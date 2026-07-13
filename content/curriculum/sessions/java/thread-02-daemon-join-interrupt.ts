import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); if (Test-Path -LiteralPath $root) { throw \"unexpected temp collision\" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root \"classes\"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw (\"javac failed or warned: \" + ($compiler -join [Environment]::NewLine)) }; Push-Location $root; try { & java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\"; if ($LASTEXITCODE -ne 0) { throw \"java failed\" } } finally { Pop-Location } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw \"unsafe cleanup\" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw \"cleanup failed\" } } }'";

const session = {
  schemaVersion: 2,
  inventoryIds: ["thread-02-daemon-join-interrupt"],
  slug: "thread-02-daemon-join-interrupt",
  courseId: "java",
  moduleId: "java-systems",
  order: 36,
  title: "daemon·join·interrupt와 협력 취소",
  subtitle: "JVM 종료 조건, 완료 대기, 메모리 가시성, 인터럽트 상태와 운영 가능한 취소·종료 프로토콜을 결정적 실험으로 익힙니다.",
  level: "고급",
  estimatedMinutes: 1080,
  coreQuestion: "스레드를 강제로 없애지 않고도 언제 기다리고, 언제 취소를 요청하며, 결과·실패·자원을 잃지 않는 종료 계약을 어떻게 설계할까요?",
  summary: "원본 class11 인벤토리의 Ex08~Ex11 네 파일과 실제 join 호출자인 Ex12_Main을 함께 감사합니다. package24·inventory4·executable5·relocated5 모두 JDK21 -Xlint:all warning0이며, 원본을 byte-for-byte 복사한 owned temp에서 daemon main의 i0~9와 보조 출력, join main의 정확한59줄 순서를 두 launcher modes로 재현합니다. 원본의 daemon worker는 InterruptedException을 RuntimeException으로 바꾸고 main은 join 실행 파일이 인벤토리에서 빠져 있으므로, 현대 장에서는 daemon을 내구성 보장 수단으로 쓰지 않는 이유, join의 happens-before, timeout 뒤 취소·재join, interrupt flag의 설정·소비·복원, blocking call 취소, token+interrupt 협력 취소, 예외 변환 경계, Future.cancel, ExecutorService 2단계 종료, uncaught failure 전달, Java21 virtual thread까지 초보에서 운영 수준으로 연결합니다.",
  objectives: [
    "daemon과 user thread가 JVM 생존에 미치는 차이와 setDaemon 호출 시점을 설명한다.",
    "join이 단순 순서 제어뿐 아니라 종료 전 action의 메모리 가시성을 제공함을 검증한다.",
    "무기한 join 대신 deadline·timeout·interrupt·최종 join을 조합해 bounded shutdown을 설계한다.",
    "interrupt(), isInterrupted(), Thread.interrupted()의 설정·조회·소비 차이를 정확히 구분한다.",
    "sleep·wait·join 같은 blocking method가 InterruptedException을 던질 때 flag가 지워지는 계약을 다룬다.",
    "취소 flag와 interrupt를 함께 사용해 계산·대기 양쪽을 협력적으로 중단한다.",
    "InterruptedException을 전파하거나 변환할 때 현재 스레드의 취소 신호를 보존한다.",
    "Future.cancel(true)와 ExecutorService shutdown protocol의 의미·한계를 검증한다.",
    "worker의 uncaught failure를 join과 별도 channel로 전달하고 관측 가능하게 만든다.",
    "Java21 virtual thread도 동일한 join·interrupt 원칙을 따르며 daemon 특성을 가진다는 점을 확인한다.",
  ],
  prerequisites: [
    { title: "Thread 수명주기·start/run·Runnable", reason: "새 호출 stack, Thread.State, Runnable 역할과 start-once 계약을 이미 알고 있어야 종료·취소 신호를 정확히 추적할 수 있습니다.", sessionSlug: "thread-01-lifecycle" },
    { title: "예외 계층과 try/catch", reason: "InterruptedException 전파·복원·예외 변환이 이 세션의 핵심 API 계약입니다.", sessionSlug: "core-02-exception" },
  ],
  keywords: ["daemon thread", "user thread", "JVM shutdown", "join", "timed join", "happens-before", "interrupt", "interrupt status", "InterruptedException", "cooperative cancellation", "cancellation token", "Future.cancel", "ExecutorService", "shutdownNow", "awaitTermination", "UncaughtExceptionHandler", "virtual thread", "deadline", "resource ownership"],
  chapters: [],
  lab: {
    title: "손실 없는 bounded worker shutdown controller",
    scenario: "queue worker들이 요청을 처리하는 서비스가 배포·사용자 취소·치명 오류 때 정해진 시간 안에 멈춰야 하지만, 처리 중 결과와 audit evidence를 잃어서는 안 됩니다.",
    setup: ["정상 완료, 대기 중 취소, 계산 중 취소, interrupt 무시, uncaught failure, timeout과 double-shutdown fixture를 준비합니다.", "accepting·draining·cancelling·terminated 상태와 owner를 정의합니다.", "monotonic deadline, task id, last safe checkpoint와 공개 가능한 error schema를 정합니다."],
    steps: ["새 작업 수락을 먼저 닫고 shutdown()으로 이미 제출된 작업의 graceful 완료를 기다립니다.", "전체 deadline에서 남은 budget만 각 await/join에 전달합니다.", "deadline을 넘으면 cancellation token을 세우고 blocking worker에 interrupt를 보냅니다.", "InterruptedException을 받은 worker는 invariant-safe checkpoint에서 cleanup하고 flag를 복원하거나 상위로 전파합니다.", "shutdownNow()가 돌려준 미시작 작업을 durable queue로 재등록합니다.", "worker failure는 UncaughtExceptionHandler 또는 Future.get channel로 수집합니다.", "종료된 worker를 다시 join하고 resource close·temp cleanup을 확인합니다.", "processed·requeued·cancelled·failed 합계가 accepted 합계와 같은지 검증합니다.", "민감 payload 없이 task id·state transition·deadline·cause category를 감사 기록합니다."],
    expectedResult: ["graceful path는 이미 시작한 작업을 끝내고 새 제출을 거부합니다.", "forced path는 bounded time 안에 끝나며 미시작 작업을 잃지 않습니다.", "interrupt가 삼켜지지 않고 상위 종료 controller까지 보존됩니다.", "중복 실행과 partial publish 없이 합계·자원·감사 불변식이 유지됩니다."],
    cleanup: ["모든 executor·worker가 terminated인지 확인합니다.", "owned temp와 test queues만 제거합니다.", "복원하지 못한 작업은 quarantine 목록과 owner를 남깁니다."],
    extensions: ["interruptible I/O와 non-interruptible native call을 분리해 escalation 정책을 비교합니다.", "virtual-thread-per-task executor로 같은 acceptance matrix를 실행합니다.", "JFR thread events와 structured metrics로 cancellation latency p50/p95/p99를 측정합니다.", "process kill·restart를 포함한 durable lease와 idempotency key 설계를 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "sleep 중인 worker를 interrupt하고 InterruptedException catch에서 flag를 복원한 뒤 join하세요.", requirements: ["worker ready latch를 둡니다.", "catch 진입 때 flag가 false임을 기록합니다.", "Thread.currentThread().interrupt()로 복원합니다.", "main은 최종 join 뒤 결과만 출력합니다."], hints: ["interrupt는 kill이 아닙니다.", "sleep가 예외를 던질 때 flag가 지워집니다."], expectedOutcome: "race 없는 exact output으로 catch·clear·restore 순서를 설명할 수 있습니다.", solutionOutline: ["ready→interrupt→catch→restore→join 순서로 gate를 둡니다."] },
    { difficulty: "응용", prompt: "ExecutorService를 grace period 뒤 강제 취소하는 2단계 종료 helper를 구현하세요.", requirements: ["shutdown→awaitTermination→shutdownNow→awaitTermination 순서를 지킵니다.", "호출자 자신이 interrupt되면 flag를 복원합니다.", "shutdownNow 반환 tasks를 유실하지 않습니다.", "하나의 absolute deadline budget을 사용합니다.", "종료 여부와 requeue count를 반환합니다."], hints: ["각 단계마다 같은 timeout을 새로 주면 총 제한을 초과합니다.", "interrupt에 반응하지 않는 작업은 별도 격리 정책이 필요합니다."], expectedOutcome: "정상·timeout·caller-interrupt fixture를 모두 통과하는 bounded shutdown utility가 완성됩니다.", solutionOutline: ["remainingNanos를 매 단계 다시 계산합니다.", "미시작 Runnable을 durable id로 변환합니다."] },
    { difficulty: "설계", prompt: "파일 변환 worker pool의 배포 종료·사용자 취소·실패 복구 runbook을 작성하세요.", requirements: ["daemon 의존을 제거합니다.", "task state machine과 owner를 그립니다.", "interruptible point·checkpoint·atomic publish를 표시합니다.", "accepted=completed+requeued+cancelled+failed 불변식을 둡니다.", "로그 redaction·metric·alert·operator escalation을 포함합니다.", "platform·virtual thread 선택 근거를 제시합니다."], hints: ["join은 worker 예외를 자동 전달하지 않습니다.", "interrupt는 이미 publish된 외부 side effect를 rollback하지 않습니다."], expectedOutcome: "운영자가 재시도·중단·복구를 증거와 함께 판단할 수 있는 종료 계약이 완성됩니다.", solutionOutline: ["수락 차단부터 증거 보존까지 단계별 acceptance criterion을 연결합니다."] },
  ],
  reviewQuestions: [],
  completionChecklist: [],
  nextSessions: ["thread-03-synchronized"],
  sources: [],
  sourceCoverage: {
    filesRead: 5,
    filesUsed: 5,
    uncoveredNotes: [
      "inventory가 지정한 Ex08~Ex11 네 파일을 모두 사용하고, Ex11_Join을 실제로 start·join하는 같은 package의 Ex12_Main을 실행 보완 파일로 추가했습니다.",
      "class11 package24 전체 warning0도 별도 검증해 인접 thread-01/03/04 원본과 compiler evidence를 섞지 않습니다.",
      "원본의10초 daemon 실험과59줄 join 실험은 source를 수정하지 않은 relocated copy에서 실행하며, daemon interleaving 자체는 순서 보장으로 오해하지 않습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const originalAuditChapter: DetailedSession["chapters"][number] = {
  id: "class11-inventory4-executable5-audit",
  title: "class11 package24·inventory4·executable5와 daemon·join 원본을 무변형 relocation으로 감사합니다",
  lead: "원본 파일은 읽기만 하고 owned temp에 byte-for-byte 복사한 뒤, compiler warning0·daemon 종료·join 순서를 두 launcher 환경에서 재현합니다.",
  explanations: [
    "인벤토리는 Ex08_Daemon, Ex09_Daemon, Ex10_Main, Ex11_Join 네 파일입니다. Ex11은 Runnable일 뿐 main과 join 호출이 없으므로 같은 package의 Ex12_Main을 실행 경계에 추가합니다.",
    "class11 package는 Java 파일24개와 main11개이며 JDK21 -Xlint:all -XDrawDiagnostics warning0입니다. inventory4는 main1, executable5는 main2이고 모두 warning0입니다.",
    "relocation은 source text를 바꾸지 않습니다. 다섯 파일을 package directory로 복사하고 SHA-256이 원본과 같은지 확인한 후 별도 classes directory에 다시 compile합니다.",
    "Ex10은 두 daemon을 start하기 전에 setDaemon(true)로 표시하고 main user thread가1초 간격으로 i0~9를 출력합니다. main 종료 뒤 daemon만 남으므로 JVM은 무한 while을 기다리지 않고 끝날 수 있습니다.",
    "daemon의 1·2 출력은 scheduler 경합으로 서로 순서가 달라질 수 있습니다. 감사기는 i0~9의 user-thread 순서, 종료 문구1개, 각 daemon의 반복 관찰 여부만 검사하고 interleaving을 거짓 exact order로 만들지 않습니다.",
    "Ex12는 먼저 main 이름을 출력하고 Ex11 worker를 start한 뒤 join합니다. worker의 run0~49·play·return이 모두 끝난 다음 main0~4와 종료 문구가 나와 정확한59줄이 됩니다.",
    "join은 대상 스레드에서 발생한 예외를 호출자에게 다시 던지는 API가 아닙니다. 원본은 정상 완료만 보여 주므로 현대 장에서 failure channel을 별도로 보강합니다.",
    "원본 catch는 InterruptedException을 RuntimeException으로 바꿉니다. 이 방식은 현재 flag를 보존하지 않으므로 상위 취소 protocol이 끊길 수 있으며, 개선 예제에서는 전파 또는 복원 규칙을 분리합니다.",
    "baseline과 hostile launcher modes에서 부모의 JDK_JAVAC_OPTIONS·JDK_JAVA_OPTIONS·JAVA_TOOL_OPTIONS·_JAVA_OPTIONS를 child에서 제거합니다. 실행 후 부모 환경은 존재 여부와 값까지 복원합니다.",
    "child stdout/stderr를 동시에 비동기 drain하고 daemon main은15초, 다른 child는10초 제한과 process-tree kill grace를 둡니다. body·restore·cleanup failure를 모두 보존합니다.",
    "network·원본 외부 경로·사용자 파일은 열지 않습니다. GUID temp root가 OS temp의 direct child인지 확인하고 실제 생성 ownership을 얻었을 때만 재귀 삭제합니다.",
  ],
  concepts: [
    { term: "user thread", definition: "살아 있는 동안 JVM의 정상 종료를 막는 non-daemon thread입니다.", detail: ["main thread도 user thread입니다.", "작업 완료·종료 절차를 명시해야 합니다."] },
    { term: "daemon thread", definition: "모든 user thread가 끝나면 완료를 기다리지 않고 JVM 종료와 함께 사라질 수 있는 보조 thread입니다.", detail: ["start 전에 daemon status를 정합니다.", "영속성·flush 보장을 맡기지 않습니다."] },
    { term: "join", definition: "호출 중인 thread가 대상 thread의 종료까지 기다리는 coordination method입니다.", detail: ["대상 종료 action은 성공적인 join 반환보다 happens-before입니다.", "worker exception은 자동 전파하지 않습니다."] },
    { term: "compiler evidence boundary", definition: "원본 warning count와 개선 예제 warning0을 분리해 출처와 변경 효과를 보존하는 감사 경계입니다.", detail: ["package·inventory·executable·relocated를 따로 셉니다.", "source hash로 무변형 복사를 증명합니다."] },
  ],
  codeExamples: [{
    id: "powershell-original-thread02-audit",
    title: "원본5 files의 hash·compile과 daemon·join 실행을 두 modes에서 검증합니다",
    language: "powershell",
    filename: "verify-original-thread02.ps1",
    purpose: "원본을 수정하지 않고 실행 누락 파일을 보완해 daemon shutdown과 join ordering evidence를 재현합니다.",
    code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$optionNames=@('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS')
$saved=@{}
foreach($name in $optionNames){
  $item=Get-Item -LiteralPath ("Env:"+$name) -ErrorAction SilentlyContinue
  $saved[$name]=@{Exists=$null-ne$item;Value=if($item){$item.Value}else{$null}}
}
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
$root=Join-Path $base ("thread02 audit "+[Guid]::NewGuid().ToString('N'))
$ownsRoot=$false;$bodyError=$null;$nl=[string][char]10

function Normalize([string]$text){return $text.Replace(([string][char]13+[char]10),[string][char]10)}
function Invoke-Child([string]$file,[string[]]$arguments,[string]$cwd,[int]$timeoutMs){
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
    if(-not$process.WaitForExit($timeoutMs)){
      $process.Kill($true);if(-not$process.WaitForExit(5000)){throw 'termination grace exceeded'}
      [void]$outTask.GetAwaiter().GetResult();[void]$errTask.GetAwaiter().GetResult();throw 'child timeout'
    }
    return @{Exit=$process.ExitCode;Out=(Normalize $outTask.GetAwaiter().GetResult());Err=(Normalize $errTask.GetAwaiter().GetResult())}
  }finally{$process.Dispose()}
}
function Compile([IO.FileInfo[]]$files,[string]$classes){
  New-Item -ItemType Directory -Path $classes -ErrorAction Stop|Out-Null
  $args=@('-J-Duser.language=en','-J-Duser.country=US','-encoding','UTF-8','--release','21','-proc:none','-Xlint:all','-XDrawDiagnostics','-d',$classes)+@($files.FullName)
  $result=Invoke-Child 'javac' $args $root 10000
  if($result.Exit-ne0-or$result.Out.Length-ne0-or$result.Err.Length-ne0){throw 'compile failed or warned'}
}
function Run([string]$classes,[string]$main,[int]$timeoutMs){
  $result=Invoke-Child 'java' @('-Dfile.encoding=UTF-8','-cp',$classes,$main) $root $timeoutMs
  if($result.Exit-ne0-or$result.Err.Length-ne0){throw "$main process drift"};return $result.Out
}
function Remove-JavaComments([string]$text){
  return [regex]::Replace(([regex]::Replace($text,'(?s)/\*.*?\*/','')),'(?m)//.*$','')
}
function Main-Count([IO.FileInfo[]]$files){
  return @($files|Where-Object{(Remove-JavaComments ([IO.File]::ReadAllText($_.FullName)))-match'public\s+static\s+void\s+main\s*\('}).Count
}
function Audit([string]$mode,[string]$class11){
  if($mode-eq'hostile'){
    $env:JDK_JAVAC_OPTIONS='-J-Dthread02.audit=javac';$env:JDK_JAVA_OPTIONS='-Dthread02.audit=java'
    $env:JAVA_TOOL_OPTIONS='-Dthread02.audit=tool';$env:_JAVA_OPTIONS='-Dthread02.audit=legacy'
  }else{foreach($name in $optionNames){Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue}}
  $package=@(Get-ChildItem -LiteralPath $class11 -Filter '*.java'|Sort-Object Name)
  $inventoryNames=@('Ex08_Daemon.java','Ex09_Daemon.java','Ex10_Main.java','Ex11_Join.java')
  $inventory=@($inventoryNames|ForEach-Object{Get-Item -LiteralPath (Join-Path $class11 $_)})
  $executable=@($inventory)+@(Get-Item -LiteralPath (Join-Path $class11 'Ex12_Main.java'))
  if($package.Count-ne24-or$inventory.Count-ne4-or$executable.Count-ne5){throw 'inventory drift'}
  if((Main-Count $package)-ne11-or(Main-Count $inventory)-ne1-or(Main-Count $executable)-ne2){throw 'main role drift'}
  Compile $package (Join-Path $root ("package-"+$mode))
  Compile $inventory (Join-Path $root ("inventory-"+$mode))
  Compile $executable (Join-Path $root ("executable-"+$mode))

  $copyDir=Join-Path $root ("source-"+$mode+"\com\java\class11")
  New-Item -ItemType Directory -Path $copyDir -ErrorAction Stop|Out-Null
  foreach($file in $executable){
    $copy=Join-Path $copyDir $file.Name;[IO.File]::Copy($file.FullName,$copy,$false)
    if((Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash-cne(Get-FileHash -LiteralPath $copy -Algorithm SHA256).Hash){throw 'relocation hash drift'}
  }
  $relocated=@(Get-ChildItem -LiteralPath $copyDir -Filter '*.java'|Sort-Object Name)
  $classes=Join-Path $root ("relocated-"+$mode);Compile $relocated $classes

  $daemonLines=@((Run $classes 'com.java.class11.Ex10_Main' 15000).TrimEnd([char]10).Split([char]10))
  $iLines=@($daemonLines|Where-Object{$_-match'^i=\d+$'})
  $expectedI=@(0..9|ForEach-Object{"i=$_"})
  if(($iLines-join'|')-cne($expectedI-join'|')-or@($daemonLines|Where-Object{$_-ceq'수고하셨습니다.'}).Count-ne1){throw 'daemon main user output drift'}
  if(@($daemonLines|Where-Object{$_-ceq'1'}).Count-lt2-or@($daemonLines|Where-Object{$_-ceq'2'}).Count-lt2){throw 'daemon workers not observed'}
  if(@($daemonLines|Where-Object{$_-notmatch'^(?:1|2|i=\d+|수고하셨습니다\.)$'}).Count-ne0){throw 'daemon unexpected output'}

  $joinLines=@((Run $classes 'com.java.class11.Ex12_Main' 10000).TrimEnd([char]10).Split([char]10))
  $expectedJoin=[Collections.Generic.List[string]]::new()
  $expectedJoin.Add('main : main');foreach($i in 0..49){$expectedJoin.Add("run($i) : Thread-0")}
  $expectedJoin.Add('first : Thread-0');$expectedJoin.Add('return : Thread-0')
  foreach($i in 0..4){$expectedJoin.Add("main($i) : main")};$expectedJoin.Add('수고하셨습니다.')
  if($joinLines.Count-ne59-or($joinLines-join$nl)-cne($expectedJoin.ToArray()-join$nl)){throw 'join ordering drift'}

  $joined=@($executable|ForEach-Object{Remove-JavaComments ([IO.File]::ReadAllText($_.FullName))})-join$nl
  $shape=@{
    runnable=([regex]::Matches($joined,'implements\s+Runnable\b')).Count;sleep=([regex]::Matches($joined,'Thread\.sleep\s*\(')).Count
    daemon=([regex]::Matches($joined,'\.setDaemon\s*\(')).Count;start=([regex]::Matches($joined,'\.start\s*\(')).Count
    join=([regex]::Matches($joined,'\.join\s*\(')).Count;runtime=([regex]::Matches($joined,'new\s+RuntimeException\s*\(')).Count
    println=([regex]::Matches($joined,'System\.out\.println\s*\(')).Count;whileTrue=([regex]::Matches($joined,'while\s*\(\s*true\s*\)')).Count
    loops=([regex]::Matches($joined,'for\s*\(')).Count
  }
  if($shape.runnable-ne3-or$shape.sleep-ne3-or$shape.daemon-ne2-or$shape.start-ne3-or$shape.join-ne1-or$shape.runtime-ne4-or$shape.println-ne10-or$shape.whileTrue-ne2-or$shape.loops-ne3){throw 'source shape drift'}
  return 'package=24,warnings=0,mains=11|inventory=4,warnings=0,mains=1|executable=5,warnings=0,mains=2|relocated=5,warnings=0,hashes=5|daemon=i10,helpersObserved,terminates|join=59lines,workerBeforeMainTail|shapes=Runnable:3|sleep:3|setDaemon:2|start:3|join:1|RuntimeWrap:4|println:10|whileTrue:2|for:3'
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
      { lines: "1-11", explanation: "launcher variables의 존재·값과 공백 포함 owned temp root를 준비합니다." },
      { lines: "13-45", explanation: "argument-safe child process, 동시 stream drain, timeout·tree kill, warning0 compile/run helper를 정의합니다." },
      { lines: "47-72", explanation: "원본 package24·inventory4·executable5의 files·main roles와 warning0을 분리 검증합니다." },
      { lines: "74-84", explanation: "실행5 files를 package 경로에 무변형 복사하고 SHA-256 동일성과 relocated warning0을 확인합니다." },
      { lines: "86-94", explanation: "10초 daemon 원본의 user output 순서·helper 관찰·JVM 종료를 interleaving 독립적으로 검사합니다." },
      { lines: "96-102", explanation: "join 원본의 worker52줄이 main tail보다 앞서는 정확한59줄 계약을 검증합니다." },
      { lines: "104-114", explanation: "Runnable·sleep·daemon·start·join·exception wrap·loop source shape를 comments 밖에서 셉니다." },
      { lines: "117-131", explanation: "두 launcher modes 결과를 비교하고 환경 복원·direct-child cleanup의 모든 실패를 보존합니다." },
    ],
    run: { environment: ["PowerShell 7+ on Windows", "OpenJDK 21", "javastudy2/classstudy source root", "약 22초: 원본 daemon 두 modes", "network 없음", "owned temp only"], command: "pwsh -NoProfile -File verify-original-thread02.ps1 -SourceRoot <classstudy-root>" },
    output: {
      value: "spacePath=True,modes=2|same=True,package=24,warnings=0,mains=11|inventory=4,warnings=0,mains=1|executable=5,warnings=0,mains=2|relocated=5,warnings=0,hashes=5|daemon=i10,helpersObserved,terminates|join=59lines,workerBeforeMainTail|shapes=Runnable:3|sleep:3|setDaemon:2|start:3|join:1|RuntimeWrap:4|println:10|whileTrue:2|for:3\nprivacy=network:none|original:read-only|fixture:owned-temp;launcherOptions=4",
      explanation: ["네 compile boundary가 모두 warning0입니다.", "daemon interleaving은 고정하지 않되 user sequence와 helper 실행을 증명합니다.", "join worker 전체가 main tail보다 먼저 끝납니다.", "원본 source와 외부 자원은 변경하지 않습니다."],
    },
    experiments: [
      { change: "setDaemon(true)를 start 뒤로 옮깁니다.", prediction: "살아 있는 thread의 daemon status는 바꿀 수 없어 IllegalThreadStateException이 납니다.", result: "lifecycle configuration은 start 전 단계로 고정합니다." },
      { change: "Ex12의 join을 제거합니다.", prediction: "worker와 main tail의 상대 순서는 scheduler에 따라 섞일 수 있습니다.", result: "필요한 completion dependency를 명시합니다." },
      { change: "daemon worker가 파일 flush를 책임지게 합니다.", prediction: "마지막 user thread 종료 시 finally·flush 완료를 보장할 수 없습니다.", result: "내구성 경로는 user-thread shutdown protocol과 atomic publish로 옮깁니다." },
    ],
    sourceRefs: ["java-class11-ex08", "java-class11-ex09", "java-class11-ex10", "java-class11-ex11", "java-class11-ex12", "jdk21-javac", "powershell-environment", "dotnet-process-start-info", "dotnet-process-environment", "dotnet-process", "dotnet-stream-reader-async", "java-thread", "jls-12-8", "jls-17-4-5"],
  }],
  diagnostics: [
    { symptom: "Ex11을 compile했지만 join 실행 결과가 없다.", likelyCause: "Ex11은 Runnable 구현이고 join 호출과 main은 인벤토리 밖 Ex12_Main에 있습니다.", checks: ["public static void main을 검색합니다.", "new Ex11_Join과 .join() caller를 같은 package에서 찾습니다.", "source coverage에 보완 파일을 기록합니다."], fix: "Ex12를 executable boundary에 포함하되 inventory4 count는 바꾸지 않습니다.", prevention: "inventory에 subject·runner roles와 complementary files를 함께 기록합니다." },
    { symptom: "daemon의 1과2 줄 순서가 실행마다 달라 테스트가 실패한다.", likelyCause: "독립 thread scheduling에는 두 println의 total order 계약이 없습니다.", checks: ["user i sequence만 분리합니다.", "helper별 관찰 count를 확인합니다.", "불필요한 exact interleaving assertion을 찾습니다."], fix: "보장된 partial order와 membership만 검증합니다.", prevention: "concurrency test는 gate를 사용하거나 happens-before가 없는 순서를 명세하지 않습니다." },
  ],
  expertNotes: [
    "A daemon thread may be stopped at JVM shutdown without application-level cleanup. It is appropriate for disposable assistance, not a durability boundary.",
    "The audit intentionally keeps the original ten-second timing. It reports scheduler-independent invariants instead of laundering nondeterminism into a fabricated transcript.",
  ],
};

(session.chapters as DetailedSession["chapters"]).push(originalAuditChapter);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-class11-ex08", repository: "local javastudy2 source snapshot", path: "classstudy/src/com/java/class11/Ex08_Daemon.java", usedFor: ["daemon worker1", "sleep loop", "original interrupt wrap"], evidence: "inventory 원본1입니다. 공개 URL이 확인되지 않아 검증된 local snapshot provenance만 표시합니다." },
  { id: "java-class11-ex09", repository: "local javastudy2 source snapshot", path: "classstudy/src/com/java/class11/Ex09_Daemon.java", usedFor: ["daemon worker2", "nondeterministic helper interleaving"], evidence: "inventory 원본2입니다. 공개 URL이 확인되지 않아 검증된 local snapshot provenance만 표시합니다." },
  { id: "java-class11-ex10", repository: "local javastudy2 source snapshot", path: "classstudy/src/com/java/class11/Ex10_Main.java", usedFor: ["setDaemon before start", "user main lifetime", "i0..9 evidence"], evidence: "inventory의 daemon runner입니다. 공개 URL이 확인되지 않아 local snapshot provenance만 표시합니다." },
  { id: "java-class11-ex11", repository: "local javastudy2 source snapshot", path: "classstudy/src/com/java/class11/Ex11_Join.java", usedFor: ["join target Runnable", "worker52 output"], evidence: "inventory의 join subject입니다. 공개 URL이 확인되지 않아 local snapshot provenance만 표시합니다." },
  { id: "java-class11-ex12", repository: "local javastudy2 source snapshot", path: "classstudy/src/com/java/class11/Ex12_Main.java", usedFor: ["actual join caller", "59-line execution order"], evidence: "인벤토리 누락 실행 보완 파일입니다. 공개 URL이 확인되지 않아 local snapshot provenance만 표시합니다." },
  { id: "jdk21-javac", repository: "OpenJDK 21", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["release21", "Xlint all", "compiler evidence"], evidence: "warning0 compile 감사 기준입니다." },
  { id: "powershell-environment", repository: "Microsoft PowerShell", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher option snapshot", "exact restore"], evidence: "hostile parent 환경 격리 근거입니다." },
  { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["argument list", "redirected streams", "working directory"], evidence: "safe child launch 근거입니다." },
  { id: "dotnet-process-environment", repository: ".NET API", path: "ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["child launcher option removal"], evidence: "clean child 환경 근거입니다." },
  { id: "dotnet-process", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "process-tree kill", "dispose"], evidence: "bounded child lifecycle 근거입니다." },
  { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["simultaneous stdout stderr drain"], evidence: "pipe deadlock 방지 근거입니다." },
  { id: "java-thread", repository: "Java SE 21 API", path: "java.lang.Thread", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html", usedFor: ["daemon", "join", "interrupt", "thread lifecycle"], evidence: "핵심 Thread API 계약입니다." },
  { id: "jls-12-8", repository: "Java SE 21 JLS", path: "12.8 Program Exit", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.8", usedFor: ["JVM user-thread termination condition"], evidence: "daemon-only 상태에서 program exit 근거입니다." },
  { id: "jls-17-4-5", repository: "Java SE 21 JLS", path: "17.4.5 Happens-before Order", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5", usedFor: ["thread termination to join happens-before"], evidence: "join 뒤 결과 가시성의 언어 명세 근거입니다." },
);

const lifetimeAndJoinChapters: DetailedSession["chapters"] = [
  {
    id: "user-daemon-jvm-liveness-boundary",
    title: "user·daemon 역할과 JVM 종료 경계를 먼저 설계합니다",
    lead: "daemon은 낮은 중요도의 thread가 아니라, 마지막 user thread 종료 시 완료·finally·flush를 기다리지 않아도 되는 disposable helper라는 생존 계약입니다.",
    explanations: [
      "새 platform thread의 daemon status는 생성한 thread의 status를 상속합니다. main은 user thread이므로 main이 만든 platform thread도 기본적으로 user이며, 명시적으로 setDaemon(true)한 helper만 daemon입니다.",
      "setDaemon은 start 전에만 호출할 수 있습니다. start 뒤 호출은 IllegalThreadStateException이며, 이미 실행 중인 thread의 생존 계약을 중간에 바꾸는 기능이 아닙니다.",
      "JVM은 살아 있는 user thread가 없으면 종료를 시작할 수 있습니다. daemon의 stack이 finally, buffer flush, transaction commit 중이어도 application-level 완료를 기다린다는 보장이 없습니다.",
      "따라서 cache refresh, best-effort monitoring처럼 재생성 가능한 helper는 daemon 후보지만 파일 publish, message acknowledgment, 결제·감사 기록처럼 durability가 필요한 작업은 user-thread shutdown protocol의 관리 대상입니다.",
      "예제는 daemon을 영원히 latch에 대기시키고 user worker만 join합니다. main 반환 직전 daemon이 실제 alive여도 process가 종료되는 사실을 exact output으로 확인하되 daemon에서 stdout을 출력하지 않아 race를 제거합니다.",
      "daemon 여부와 작업 중요도는 같은 축이 아닙니다. 중요한 background 작업도 user thread일 수 있고, user thread라고 자동으로 안전한 것도 아니므로 수락 차단·drain·deadline·cleanup 계약이 별도로 필요합니다.",
    ],
    concepts: [
      { term: "JVM liveness root", definition: "프로그램 정상 종료를 막고 JVM을 살아 있게 하는 active user thread 집합입니다.", detail: ["daemon은 root가 아닙니다.", "main 종료만으로 항상 JVM이 끝나는 것은 아닙니다."] },
      { term: "disposable assistance", definition: "프로세스 종료 때 미완료여도 다음 시작에서 재생성할 수 있는 보조 작업 성격입니다.", detail: ["cache refresh가 한 예입니다.", "durable side effect와 분리합니다."] },
      { term: "lifecycle configuration", definition: "name·daemon·handler처럼 start 전에 확정해야 하는 thread 설정 단계입니다.", detail: ["start 후 daemon 변경은 금지됩니다.", "builder 또는 factory로 일관되게 만듭니다."] },
    ],
    codeExamples: [{
      id: "java-daemon-role-boundary",
      title: "살아 있는 daemon보다 user worker 완료만 기다리는 종료 경계를 확인합니다",
      language: "java",
      filename: "DaemonRoleBoundary.java",
      purpose: "daemon status와 user-thread completion을 race 없는 latch·join으로 분리합니다.",
      code: String.raw`import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;

public class DaemonRoleBoundary {
    public static void main(String[] args) throws InterruptedException {
        CountDownLatch daemonStarted = new CountDownLatch(1);
        CountDownLatch neverReleased = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>("missing");

        Thread helper = new Thread(() -> {
            daemonStarted.countDown();
            try {
                neverReleased.await();
            } catch (InterruptedException failure) {
                Thread.currentThread().interrupt();
            }
        }, "cache-helper");
        helper.setDaemon(true);

        Thread worker = new Thread(() -> result.set("done"), "request-worker");
        helper.start();
        daemonStarted.await();
        worker.start();
        worker.join();

        System.out.println("helperDaemon=" + helper.isDaemon());
        System.out.println("workerDaemon=" + worker.isDaemon());
        System.out.println("workerResult=" + result.get());
        System.out.println("helperAliveBeforeExit=" + helper.isAlive());
    }
}`,
      walkthrough: [
        { lines: "1-7", explanation: "daemon 시작 확인, 영구 대기 gate와 worker 결과 channel을 만듭니다." },
        { lines: "9-18", explanation: "helper는 start 전에 daemon으로 지정하고 interrupt를 받으면 flag를 복원합니다." },
        { lines: "20-25", explanation: "user worker를 시작해 join하고 그 완료에 필요한 결과만 기다립니다." },
        { lines: "27-30", explanation: "daemon이 아직 alive여도 main이 끝날 수 있음을 네 deterministic facts로 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "single source file", "network/file 없음"], command: isolatedJavaRun("DaemonRoleBoundary.java", "DaemonRoleBoundary") },
      output: { value: "helperDaemon=true\nworkerDaemon=false\nworkerResult=done\nhelperAliveBeforeExit=true", explanation: ["helper는 daemon이라 JVM 생존 root가 아닙니다.", "worker 결과는 join 뒤 안전하게 읽습니다.", "main 반환 시 helper latch는 닫혀 있지만 process는 종료됩니다."] },
      experiments: [
        { change: "helper.setDaemon(true)를 제거합니다.", prediction: "neverReleased latch를 기다리는 user helper 때문에 process가 끝나지 않습니다.", result: "daemon 선택이 process liveness에 직접 영향을 줍니다." },
        { change: "helper.start() 다음 setDaemon(true)를 호출합니다.", prediction: "IllegalThreadStateException이 발생합니다.", result: "daemon status는 lifecycle configuration입니다." },
        { change: "helper에 유일한 파일 flush를 맡깁니다.", prediction: "main 종료와 flush 사이에 completion 보장이 없습니다.", result: "durable write는 관리되는 user task와 atomic publish로 옮깁니다." },
      ],
      sourceRefs: ["java-thread", "jls-12-8", "java-countdown-latch", "java-atomic-reference"],
    }],
    diagnostics: [
      { symptom: "main은 끝났는데 Java process가 계속 살아 있다.", likelyCause: "종료되지 않은 user thread 또는 executor worker가 liveness root로 남았습니다.", checks: ["thread dump에서 non-daemon을 찾습니다.", "executor shutdown 호출을 확인합니다.", "block 위치와 owner를 확인합니다."], fix: "수락을 닫고 취소·join·executor shutdown protocol로 user threads를 종료합니다.", prevention: "thread factory에 name·daemon 정책을 명시하고 shutdown integration test를 둡니다." },
      { symptom: "daemon이 마지막 로그나 파일을 남기지 못했다.", likelyCause: "daemon completion을 JVM 종료가 기다릴 것이라 잘못 가정했습니다.", checks: ["마지막 user thread 종료 시점을 찾습니다.", "write·flush·close owner를 확인합니다.", "partial final artifact를 검사합니다."], fix: "내구성 작업을 user task로 옮기고 close·verify·atomic move를 shutdown acceptance criterion으로 둡니다.", prevention: "daemon에는 재생성 가능한 작업만 배치합니다." },
    ],
    comparisons: [{
      title: "background thread의 생존 역할 선택",
      options: [
        { name: "daemon helper", chooseWhen: "중단돼도 다음 시작에서 재생성 가능한 cache·관찰 보조", avoidWhen: "flush·commit·ack처럼 완료 증거가 필요할 때", tradeoffs: ["종료를 붙잡지 않습니다.", "cleanup 완료를 보장하지 않습니다."] },
        { name: "managed user worker", chooseWhen: "작업 완료·재queue·실패 회계가 필요할 때", avoidWhen: "owner 없는 무한 helper를 방치할 때", tradeoffs: ["명시적 shutdown이 필요합니다.", "durability contract를 구현할 수 있습니다."] },
      ],
    }],
    expertNotes: ["Daemon status is a JVM liveness property, not a priority, scheduling, safety, or durability guarantee."],
  },
  {
    id: "join-completion-happens-before-publication",
    title: "join을 완료 대기와 happens-before publication으로 이해합니다",
    lead: "join은 sleep로 시간을 추측하는 대신 대상 thread의 실제 termination event에 의존하고, 성공적으로 돌아오면 종료 전 writes를 호출자에게 보이게 합니다.",
    explanations: [
      "start는 새 thread actions를 시작한 thread의 앞선 actions 뒤에 놓고, termination detection인 join은 대상의 모든 actions를 join 반환 앞에 놓습니다. 이 happens-before chain이 결과 publication을 만듭니다.",
      "예제의 result와 done은 volatile도 atomic도 아닙니다. worker가 값을 쓴 뒤 종료하고 main이 join했기 때문에 main이42와 true를 관찰할 수 있습니다. 이는 임의 sleep나 isAlive polling만으로 얻는 계약과 다릅니다.",
      "started·release latch는 beforeJoinAlive를 결정적으로 만들기 위한 test gate입니다. worker가 실제로 시작했지만 아직 값을 쓰지 못하도록 막아 scheduler 속도에 독립적인 상태를 구성합니다.",
      "join은 대상 thread의 성공 여부나 return value를 전달하지 않습니다. 결과·실패는 Future, queue, immutable holder, UncaughtExceptionHandler 같은 별도 channel을 설계해야 합니다.",
      "같은 Thread instance에 여러 caller가 join할 수 있지만, 누가 resource owner이고 누가 timeout·interrupt 정책을 결정하는지는 API 밖의 application contract입니다.",
      "join 중 호출자 자신이 interrupt되면 InterruptedException이 납니다. 대상 thread가 interrupt되는 것이 아니므로 catch에서 대상 취소 여부와 caller 취소 보존을 별도로 결정합니다.",
    ],
    concepts: [
      { term: "termination synchronization", definition: "대상 thread 종료 event를 기준으로 caller 진행을 허용하는 synchronization입니다.", detail: ["elapsed time 추측이 아닙니다.", "여러 caller가 기다릴 수 있습니다."] },
      { term: "safe publication by join", definition: "대상 thread의 종료 전 writes가 성공적인 join 반환 뒤 caller에 보이는 happens-before 효과입니다.", detail: ["plain fields에도 적용됩니다.", "join 전에 읽은 값까지 소급 보장하지 않습니다."] },
      { term: "completion channel", definition: "완료 여부와 result·failure·cancellation을 caller에게 전달하는 별도 계약입니다.", detail: ["Thread.join 자체에는 result가 없습니다.", "Future가 대표적인 고수준 channel입니다."] },
    ],
    codeExamples: [{
      id: "java-join-publication",
      title: "plain fields를 worker가 쓰고 join 뒤 정확히 관찰합니다",
      language: "java",
      filename: "JoinPublication.java",
      purpose: "gate로 termination 전·후를 분리해 join의 ordering과 visibility를 함께 증명합니다.",
      code: String.raw`import java.util.concurrent.CountDownLatch;

public class JoinPublication {
    private static int result;
    private static boolean done;

    public static void main(String[] args) throws InterruptedException {
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        Thread worker = new Thread(() -> {
            started.countDown();
            try {
                release.await();
            } catch (InterruptedException failure) {
                Thread.currentThread().interrupt();
                return;
            }
            result = 42;
            done = true;
        }, "calculator");

        worker.start();
        started.await();
        System.out.println("beforeJoinAlive=" + worker.isAlive());
        release.countDown();
        worker.join();
        System.out.println("afterJoinAlive=" + worker.isAlive());
        System.out.println("result=" + result);
        System.out.println("done=" + done);
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "plain result fields와 worker 상태를 결정할 두 latches를 만듭니다." },
        { lines: "10-20", explanation: "worker는 release 뒤 result·done을 순서대로 쓰고 종료합니다." },
        { lines: "22-26", explanation: "started 뒤 alive를 확인하고 release 후 join으로 termination을 기다립니다." },
        { lines: "27-29", explanation: "join 이후 plain writes가 보이는지 exact output으로 확인합니다." },
      ],
      run: { environment: ["OpenJDK 21", "single source file", "warning0"], command: isolatedJavaRun("JoinPublication.java", "JoinPublication") },
      output: { value: "beforeJoinAlive=true\nafterJoinAlive=false\nresult=42\ndone=true", explanation: ["release 전 worker는 살아 있지만 완료하지 못합니다.", "join 뒤 terminated입니다.", "종료 전 plain writes가 caller에 publication됩니다."] },
      experiments: [
        { change: "join 전에 result를 출력합니다.", prediction: "release timing에 따라0 또는42일 수 있어 contract가 없습니다.", result: "관찰 지점을 happens-before 뒤로 이동합니다." },
        { change: "join을 Thread.sleep(10)으로 바꿉니다.", prediction: "느린 환경에서 여전히 worker가 실행 중일 수 있습니다.", result: "시간 추측을 completion event로 바꿉니다." },
        { change: "worker가 값을 쓰기 전에 unchecked exception을 던집니다.", prediction: "join은 정상 반환하지만 result는 기본값입니다.", result: "completion과 success channel을 분리합니다." },
      ],
      sourceRefs: ["java-thread", "java-countdown-latch", "jls-17-4-5", "java-concurrent-package"],
    }],
    diagnostics: [
      { symptom: "sleep 뒤 결과가 가끔 기본값으로 보인다.", likelyCause: "elapsed time은 worker completion이나 memory ordering을 보장하지 않습니다.", checks: ["실제 join/Future.get/latch await가 있는지 봅니다.", "read가 synchronization 전인지 확인합니다.", "worker failure도 확인합니다."], fix: "정확한 completion primitive 뒤에서 결과를 읽습니다.", prevention: "concurrency test에서 sleep-based ordering을 금지합니다." },
      { symptom: "join은 반환했는데 업무 결과가 없다.", likelyCause: "worker가 예외로 끝났거나 cancellation path로 반환했으며 join은 이를 전달하지 않습니다.", checks: ["UncaughtExceptionHandler·Future failure를 확인합니다.", "result holder state를 확인합니다.", "cancel flag를 확인합니다."], fix: "success/failure/cancelled를 표현하는 completion channel을 추가합니다.", prevention: "종료와 성공을 서로 다른 acceptance field로 기록합니다." },
    ],
    expertNotes: ["Thread termination synchronization safely publishes prior actions, but it does not turn compound shared-state protocols during execution into race-free code."],
  },
  {
    id: "timed-join-deadline-and-final-reap",
    title: "timed join을 deadline·cancel·final join의 한 단계로 사용합니다",
    lead: "timed join은 timeout이 나면 예외를 던지지 않고 그냥 반환하므로 isAlive 재확인과 취소 요청, 최종 reap가 반드시 뒤따라야 합니다.",
    explanations: [
      "join(milliseconds)가 돌아왔다는 사실만으로 대상이 끝났다고 결론 내릴 수 없습니다. timeout과 거의 동시에 종료할 수도 있으므로 반환 직후 isAlive로 상태를 다시 읽어야 합니다.",
      "timeout은 작업 실패가 아니라 기다림 budget 소진입니다. 정책은 계속 기다림, interrupt 요청, 격리, process escalation 중 하나를 task의 side-effect 성격에 맞게 선택해야 합니다.",
      "예제 worker는 절대 열리지 않는 latch에서 기다리므로20ms timed join 뒤에도 alive라는 사실이 결정적입니다. 그 다음 interrupt가 await를 깨우고 worker가 종료되며 최종 무기한 join은 이미 요청된 취소를 reap합니다.",
      "실무에서는 여러 단계마다 고정 timeout을 새로 주지 말고 monotonic absolute deadline에서 remaining budget을 계산합니다. 그렇지 않으면 단계 수만큼 총 종료 시간이 늘어납니다.",
      "interrupt를 보낸 직후 resource를 닫거나 결과를 재queue하면 worker가 아직 side effect를 수행 중일 수 있습니다. final join 또는 executor termination이 ownership handoff 전제입니다.",
      "caller가 timed join 중 interrupt되면 자신의 shutdown request가 우선일 수 있습니다. catch에서 flag를 복원하고 상위 controller가 대상을 어떻게 처리할지 결정하게 해야 합니다.",
    ],
    concepts: [
      { term: "timed join", definition: "대상 종료 또는 지정 시간 경과 중 먼저 일어나는 조건까지 기다리는 join variant입니다.", detail: ["timeout은 boolean으로 반환되지 않습니다.", "isAlive 재검사가 필요합니다."] },
      { term: "deadline budget", definition: "전체 operation의 한 absolute 종료 시각에서 매 단계 남은 시간만 배분하는 제한입니다.", detail: ["timeout 누적을 막습니다.", "monotonic clock을 사용합니다."] },
      { term: "reap", definition: "취소 요청 뒤 대상이 실제 terminated 상태가 될 때까지 합류해 ownership을 회수하는 단계입니다.", detail: ["interrupt 직후와 다릅니다.", "resource handoff 전에 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-timed-join-cancel-reap",
      title: "timeout 뒤 alive를 확인하고 interrupt·final join으로 종료합니다",
      language: "java",
      filename: "TimedJoinDeadline.java",
      purpose: "timeout을 완료로 오인하지 않는 bounded cancellation sequence를 검증합니다.",
      code: String.raw`import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicBoolean;

public class TimedJoinDeadline {
    public static void main(String[] args) throws InterruptedException {
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch neverReleased = new CountDownLatch(1);
        AtomicBoolean interruptRestored = new AtomicBoolean();
        Thread worker = new Thread(() -> {
            entered.countDown();
            try {
                neverReleased.await();
            } catch (InterruptedException failure) {
                Thread.currentThread().interrupt();
                interruptRestored.set(Thread.currentThread().isInterrupted());
            }
        }, "blocked-worker");

        worker.start();
        entered.await();
        worker.join(20);
        boolean timedOut = worker.isAlive();
        worker.interrupt();
        worker.join();

        System.out.println("timedOut=" + timedOut);
        System.out.println("aliveAfterReap=" + worker.isAlive());
        System.out.println("interruptRestored=" + interruptRestored.get());
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "blocked 상태와 interrupt 복원 결과를 위한 synchronization objects를 만듭니다." },
        { lines: "9-17", explanation: "worker는 await 중 interrupt를 받으면 flag를 복원하고 종료합니다." },
        { lines: "19-24", explanation: "20ms join 뒤 alive를 확인해 timeout을 판정하고 interrupt·최종 join합니다." },
        { lines: "26-28", explanation: "timeout, termination, worker-side signal preservation을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "single source file", "20ms controlled timeout"], command: isolatedJavaRun("TimedJoinDeadline.java", "TimedJoinDeadline") },
      output: { value: "timedOut=true\naliveAfterReap=false\ninterruptRestored=true", explanation: ["닫힌 latch 때문에 timed join은 반드시 budget을 소진합니다.", "interrupt가 await를 깨운 뒤 final join이 종료를 확인합니다.", "worker catch는 flag를 복원했습니다."] },
      experiments: [
        { change: "worker.interrupt 뒤 final join을 제거합니다.", prediction: "main이 resource ownership을 회수할 때 worker가 아직 cleanup 중일 수 있습니다.", result: "취소 요청과 종료 확인을 분리합니다." },
        { change: "timeout만 늘립니다.", prediction: "neverReleased 조건에서는 여전히 끝나지 않고 종료 latency만 커집니다.", result: "원인 없는 timeout 증가는 정책이 아닙니다." },
        { change: "세 단계에 각각1초 timeout을 줍니다.", prediction: "전체 deadline이 최대3초로 늘어납니다.", result: "한 absolute deadline의 remaining budget을 전달합니다." },
      ],
      sourceRefs: ["java-thread", "java-countdown-latch", "java-atomic-boolean", "java-system-nanotime"],
    }],
    diagnostics: [
      { symptom: "timed join이 반환해서 resource를 닫았는데 worker가 같은 resource를 사용한다.", likelyCause: "timeout 반환을 termination으로 오인하고 isAlive·final join을 생략했습니다.", checks: ["join overload와 timeout을 봅니다.", "반환 뒤 isAlive 확인을 찾습니다.", "resource owner 전환 시점을 추적합니다."], fix: "alive면 cancellation policy를 실행하고 실제 termination 뒤 ownership을 넘깁니다.", prevention: "shutdown state machine에 cancelling과 terminated를 분리합니다." },
      { symptom: "종료 단계별 timeout 합이 운영 제한을 초과한다.", likelyCause: "각 단계가 독립적인 전체 timeout을 새로 사용합니다.", checks: ["deadline 생성 횟수를 셉니다.", "wall clock 대신 monotonic clock인지 봅니다.", "remaining<=0 분기를 확인합니다."], fix: "처음 한 번 deadline을 만들고 매 단계 remaining budget만 사용합니다.", prevention: "최악 종료 시간 acceptance test를 둡니다." },
    ],
    expertNotes: ["A timeout is a property of the observer's budget, not proof that the target task is deadlocked, failed, or safe to abandon."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...lifetimeAndJoinChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-countdown-latch", repository: "Java SE 21 API", path: "java.util.concurrent.CountDownLatch", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html", usedFor: ["deterministic test gates", "await interruption", "one-way completion signal"], evidence: "sleep-based test race를 제거하는 synchronization 근거입니다." },
  { id: "java-atomic-reference", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicReference", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicReference.html", usedFor: ["thread-safe result and failure channel"], evidence: "cross-thread immutable reference publication 근거입니다." },
  { id: "java-concurrent-package", repository: "Java SE 21 API", path: "java.util.concurrent package summary", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html", usedFor: ["memory consistency effects", "high-level concurrency utilities"], evidence: "start·join과 concurrent utilities의 memory effects 보강 근거입니다." },
  { id: "java-atomic-boolean", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicBoolean", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicBoolean.html", usedFor: ["cross-thread cancellation and observation flags"], evidence: "race 없는 boolean signal 근거입니다." },
  { id: "java-system-nanotime", repository: "Java SE 21 API", path: "java.lang.System.nanoTime", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html#nanoTime()", usedFor: ["monotonic deadline calculation"], evidence: "elapsed-time budget 계산 근거입니다." },
);

const interruptContractChapters: DetailedSession["chapters"] = [
  {
    id: "interrupt-status-set-query-consume",
    title: "interrupt flag를 설정·조회·소비하는 세 API를 구분합니다",
    lead: "interrupt는 다른 thread를 즉시 죽이는 명령이 아니라 취소를 요청하는 status signal이며, API마다 그 status를 보존하거나 지우는지가 다릅니다.",
    explanations: [
      "target.interrupt()는 대상 thread의 interrupt status를 설정합니다. 대상이 interruptible blocking method에 있으면 그 method가 InterruptedException을 던지는 방식으로 깨어날 수 있습니다.",
      "target.isInterrupted()는 특정 Thread instance의 status를 읽되 지우지 않습니다. polling loop가 계속 signal을 관찰해야 할 때 사용하는 non-clearing query입니다.",
      "Thread.interrupted()는 현재 실행 중인 thread의 status를 읽고 동시에 clear합니다. 이름은 instance method처럼 보이지 않지만 static이며, 단순 조회로 잘못 쓰면 취소 신호를 소비합니다.",
      "fresh JVM의 main status는 false입니다. 예제는 main 자신을 interrupt한 뒤 isInterrupted로 true를 보존하고, Thread.interrupted로 true를 한 번 소비한 다음 false가 되는 정확한 transition을 보입니다.",
      "interrupt status는 업무 취소 여부 전체를 표현하지 않습니다. task id, reason, deadline, partial progress 같은 context는 별도 token·state object에 두고 interrupt는 blocking point를 깨우는 wake-up channel로 조합합니다.",
      "interrupt를 보냈다는 사실만으로 대상이 종료됐다고 가정하면 안 됩니다. 대상 code가 status를 검사하거나 interruptible API를 호출하고 cleanup을 마친 뒤 termination synchronization까지 확인해야 합니다.",
    ],
    concepts: [
      { term: "interrupt status", definition: "Thread에 저장되는 cooperative cancellation 요청 bit입니다.", detail: ["강제 종료가 아닙니다.", "일부 blocking API가 예외로 소비합니다."] },
      { term: "non-clearing query", definition: "isInterrupted처럼 status를 읽어도 그대로 남기는 관찰입니다.", detail: ["다른 Thread instance도 조회할 수 있습니다.", "반복 검사에 적합합니다."] },
      { term: "clearing query", definition: "Thread.interrupted처럼 현재 status를 반환하면서 false로 지우는 관찰입니다.", detail: ["현재 thread만 대상으로 합니다.", "의도적 소비 지점에서만 씁니다."] },
    ],
    codeExamples: [{
      id: "java-interrupt-flag-transition",
      title: "interrupt·isInterrupted·interrupted의 exact flag transition을 봅니다",
      language: "java",
      filename: "InterruptFlagTransition.java",
      purpose: "static clearing query를 단순 조회로 오해하지 않도록 네 상태를 한 thread에서 검증합니다.",
      code: String.raw`public class InterruptFlagTransition {
    public static void main(String[] args) {
        Thread self = Thread.currentThread();
        System.out.println("initial=" + self.isInterrupted());

        self.interrupt();
        System.out.println("afterInterrupt=" + self.isInterrupted());

        boolean consumed = Thread.interrupted();
        System.out.println("consumed=" + consumed);
        System.out.println("afterConsume=" + self.isInterrupted());
    }
}`,
      walkthrough: [
        { lines: "1-4", explanation: "fresh main thread의 status를 non-clearing query로 읽습니다." },
        { lines: "6-7", explanation: "현재 thread에 interrupt request를 설정하고 true가 보존되는지 확인합니다." },
        { lines: "9-11", explanation: "static Thread.interrupted가 true를 반환하면서 status를 false로 clear하는지 확인합니다." },
      ],
      run: { environment: ["OpenJDK 21", "fresh JVM process", "single thread"], command: isolatedJavaRun("InterruptFlagTransition.java", "InterruptFlagTransition") },
      output: { value: "initial=false\nafterInterrupt=true\nconsumed=true\nafterConsume=false", explanation: ["interrupt가 status를 설정합니다.", "isInterrupted는 지우지 않습니다.", "Thread.interrupted는 true를 반환하고 clear합니다."] },
      experiments: [
        { change: "Thread.interrupted를 두 번 연속 호출합니다.", prediction: "첫 번째는 true, 두 번째는 false입니다.", result: "clearing query의 소비 효과를 확인합니다." },
        { change: "새 Thread object의 isInterrupted를 읽습니다.", prediction: "start하지 않은 thread는 false입니다.", result: "status는 thread instance마다 독립적입니다." },
        { change: "interrupt 직후 작업을 강제 종료됐다고 기록합니다.", prediction: "대상은 여전히 실행 중일 수 있어 회계가 틀립니다.", result: "requested와 terminated 상태를 분리합니다." },
      ],
      sourceRefs: ["java-thread", "oracle-interrupts"],
    }],
    diagnostics: [
      { symptom: "취소 flag가 검사 한 번 뒤 사라진다.", likelyCause: "isInterrupted 대신 clearing static Thread.interrupted를 단순 조회로 사용했습니다.", checks: ["호출 형태가 instance처럼 보여도 static인지 확인합니다.", "첫 검사 뒤 status를 다시 출력합니다.", "누가 signal 소비 owner인지 찾습니다."], fix: "보존 조회는 isInterrupted를 쓰고, 소비가 필요할 때만 Thread.interrupted를 씁니다.", prevention: "API wrapper 이름에 checkAndClear처럼 side effect를 드러냅니다." },
      { symptom: "interrupt를 보냈는데 worker가 계속 계산한다.", likelyCause: "CPU loop가 status를 검사하지 않고 interruptible blocking point도 없습니다.", checks: ["loop에 isInterrupted/token check가 있는지 봅니다.", "native call 여부를 봅니다.", "요청 후 실제 state를 측정합니다."], fix: "안전한 checkpoint에서 status를 검사해 cleanup 후 반환하게 합니다.", prevention: "긴 loop의 cancellation latency budget과 test를 둡니다." },
    ],
    expertNotes: ["Interrupt status is deliberately minimal. Rich cancellation cause and ownership belong in a separate protocol, while interrupt provides a standard wake-up signal."],
  },
  {
    id: "blocking-interruption-clears-and-restore",
    title: "sleep·wait·join이 던진 InterruptedException과 flag 복원 규칙을 익힙니다",
    lead: "interruptible blocking method는 요청을 예외로 바꾸면서 status를 clear하므로 catch 안에서 false인 것이 정상이며, 신호를 처리하지 않을 계층은 복원하거나 전파해야 합니다.",
    explanations: [
      "Thread.sleep 중인 thread에 interrupt가 오면 sleep은 일찍 끝나고 InterruptedException을 던집니다. 예외가 던져질 때 interrupt status는 cleared 상태입니다.",
      "Object.wait, Thread.join, CountDownLatch.await, BlockingQueue.take 같은 많은 coordination API도 같은 checked interruption contract를 사용합니다. 구체 API 문서에서 clear 여부와 lock reacquisition을 확인해야 합니다.",
      "catch 계층이 cancellation을 완전히 처리해 정상 대체 결과를 확정한다면 소비할 수 있습니다. 그렇지 않다면 InterruptedException을 그대로 throws하거나 Thread.currentThread().interrupt()로 복원한 뒤 반환·변환합니다.",
      "원본처럼 무조건 RuntimeException으로 감싸면서 flag를 복원하지 않으면 상위 executor·shutdown controller가 isInterrupted로 취소를 관찰하지 못할 수 있습니다.",
      "예제는 worker가 sleep에 들어갔음을 latch로 확인한 뒤 interrupt합니다. catch 진입 시 cleared=true를 기록하고 즉시 restore해 종료 시 true임을 main이 join 뒤 안전하게 읽습니다.",
      "catch에서 interrupt를 복원하고 다시 같은 interruptible method를 호출하면 즉시 다시 InterruptedException이 날 수 있습니다. cleanup code는 어떤 operation이 interruption-sensitive인지 명시해야 합니다.",
    ],
    concepts: [
      { term: "interruptible blocking point", definition: "대기 중 interrupt request를 InterruptedException으로 전달해 조기에 반환할 수 있는 API 지점입니다.", detail: ["sleep·wait·join·await·take가 대표적입니다.", "강제 stack unwind 전체가 아닙니다."] },
      { term: "status clearing on throw", definition: "InterruptedException을 던지는 시점에 interrupt status가 false로 지워지는 계약입니다.", detail: ["catch에서 false가 정상입니다.", "상위에 알리려면 전파 또는 복원이 필요합니다."] },
      { term: "restore", definition: "catch가 checked exception을 그대로 전파할 수 없을 때 currentThread().interrupt()로 요청 bit를 다시 세우는 행위입니다.", detail: ["원래 cause도 보존합니다.", "처리를 끝냈다면 무조건 복원할 필요는 없습니다."] },
    ],
    codeExamples: [{
      id: "java-blocking-interrupt-restore",
      title: "sleep catch에서 clear된 status를 관찰하고 복원합니다",
      language: "java",
      filename: "BlockingInterruptRestore.java",
      purpose: "ready gate와 join을 이용해 interrupt delivery·clear·restore 순서를 결정적으로 검증합니다.",
      code: String.raw`import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicBoolean;

public class BlockingInterruptRestore {
    public static void main(String[] args) throws InterruptedException {
        CountDownLatch sleeping = new CountDownLatch(1);
        AtomicBoolean caught = new AtomicBoolean();
        AtomicBoolean clearedInCatch = new AtomicBoolean();
        AtomicBoolean restored = new AtomicBoolean();

        Thread worker = new Thread(() -> {
            sleeping.countDown();
            try {
                Thread.sleep(Long.MAX_VALUE);
            } catch (InterruptedException failure) {
                caught.set(true);
                clearedInCatch.set(!Thread.currentThread().isInterrupted());
                Thread.currentThread().interrupt();
                restored.set(Thread.currentThread().isInterrupted());
            }
        }, "sleeper");

        worker.start();
        sleeping.await();
        worker.interrupt();
        worker.join();

        System.out.println("caught=" + caught.get());
        System.out.println("clearedInCatch=" + clearedInCatch.get());
        System.out.println("restored=" + restored.get());
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "sleep 진입과 catch의 세 관찰 결과를 위한 thread-safe signals를 준비합니다." },
        { lines: "11-20", explanation: "worker가 무기한 sleep하다 예외를 받고 clear 상태를 기록한 뒤 flag를 복원합니다." },
        { lines: "22-25", explanation: "main은 sleep 진입 확인 후 interrupt하고 worker termination까지 join합니다." },
        { lines: "27-29", explanation: "delivery·clear·restore 세 계약을 race 없이 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "single source file", "controlled interrupt"], command: isolatedJavaRun("BlockingInterruptRestore.java", "BlockingInterruptRestore") },
      output: { value: "caught=true\nclearedInCatch=true\nrestored=true", explanation: ["sleep가 interrupt를 checked exception으로 전달합니다.", "catch 진입 status는 false입니다.", "명시 복원 뒤 true입니다."] },
      experiments: [
        { change: "catch의 interrupt 복원을 제거합니다.", prediction: "restored=false가 되고 상위 status polling은 취소를 놓칩니다.", result: "신호 ownership을 처리하거나 보존해야 합니다." },
        { change: "sleeping.await 없이 즉시 interrupt합니다.", prediction: "interrupt가 sleep 전에 와도 sleep가 즉시 예외를 낼 수 있지만 test 의도가 timing에 의존합니다.", result: "gate로 상태 전제를 명확히 합니다." },
        { change: "catch 뒤 다시 sleep합니다.", prediction: "복원된 flag 때문에 새 sleep가 즉시 InterruptedException을 던지고 다시 clear합니다.", result: "cleanup operation의 interrupt sensitivity를 설계합니다." },
      ],
      sourceRefs: ["java-thread", "java-countdown-latch", "java-atomic-boolean", "oracle-interrupts"],
    }],
    diagnostics: [
      { symptom: "InterruptedException catch에서 isInterrupted가 false라 interrupt가 아니었다고 판단한다.", likelyCause: "blocking method가 exception을 던지며 status를 clear하는 계약을 몰랐습니다.", checks: ["예외 type과 API docs를 봅니다.", "catch 이전에 signal을 보낸 owner를 찾습니다.", "복원 코드 위치를 확인합니다."], fix: "예외 자체를 cancellation signal로 처리하고 필요한 경우 flag를 복원합니다.", prevention: "catch template과 code review checklist에 clear-on-throw를 넣습니다." },
      { symptom: "catch에서 로그만 남기고 loop가 계속 돈다.", likelyCause: "interrupt를 삼켜 cancellation request가 사라졌습니다.", checks: ["empty/log-only catch를 찾습니다.", "loop termination predicate를 봅니다.", "상위 shutdown timeout을 봅니다."], fix: "throws로 전파하거나 restore 후 loop를 종료합니다.", prevention: "InterruptedException catch마다 consume·propagate·restore 중 선택 근거를 요구합니다." },
    ],
    expertNotes: ["Restoring interrupt status is a preservation technique, not a ritual. A layer that fully owns and completes cancellation may consume it, but that ownership must be explicit."],
  },
  {
    id: "cooperative-cancellation-token-plus-interrupt",
    title: "업무 취소 token과 blocking wake-up interrupt를 함께 설계합니다",
    lead: "flag만 두면 blocked worker가 깨어나지 않고 interrupt만 쓰면 취소 이유·업무 상태가 부족하므로, 두 channel을 하나의 ownership protocol로 결합합니다.",
    explanations: [
      "cancellation token은 requested 여부, reason, deadline, task scope 같은 업무 의미를 전달합니다. interrupt status는 표준 blocking point를 깨우는 thread-local 신호입니다.",
      "worker loop는 계산 checkpoint에서 token을 검사하고 blocking call에서는 InterruptedException을 받습니다. 둘 중 하나만 오더라도 안전하게 멈추되 정상 queue wake-up과 취소를 구분해야 합니다.",
      "예제는 정확히 세 항목을 queue에 넣습니다. worker가 세 번째를 처리한 뒤 empty queue take 직전 gate를 알리고, controller가 stop=true와 interrupt를 함께 보내므로 처리 수와 종료 status가 결정적입니다.",
      "interrupt를 받은 catch는 token이 실제 취소를 요청했는지 확인할 수 있습니다. token이 false라면 예상치 못한 infrastructure interruption이므로 상위로 전파하거나 failure로 기록하는 편이 안전합니다.",
      "취소 checkpoint는 domain invariant가 깨지지 않는 위치에 둡니다. 데이터 한 행의 절반만 publish한 뒤 취소되면 재시도도 어렵기 때문에 temp write·validate·atomic publish 단위를 사용합니다.",
      "token과 interrupt ownership은 한 controller에 둡니다. 여러 계층이 임의로 interrupt를 보내면 reason attribution, duplicate cancellation, resource close 순서를 재구성하기 어렵습니다.",
    ],
    concepts: [
      { term: "cancellation token", definition: "취소 요청의 업무 상태와 범위를 여러 작업에 공유하는 explicit object입니다.", detail: ["reason·deadline을 확장할 수 있습니다.", "blocking method를 자동으로 깨우지는 않습니다."] },
      { term: "wake-up signal", definition: "대기 중인 worker가 cancellation token을 다시 검사하도록 interrupt로 blocking point를 깨우는 신호입니다.", detail: ["종료 그 자체가 아닙니다.", "catch가 protocol을 해석합니다."] },
      { term: "safe checkpoint", definition: "취소 후에도 domain·resource 불변식이 유지되는 중단 가능 경계입니다.", detail: ["한 작업 단위 사이에 둡니다.", "partial publish를 피합니다."] },
    ],
    codeExamples: [{
      id: "java-token-interrupt-cancellation",
      title: "세 작업 뒤 token을 세우고 blocked take를 interrupt합니다",
      language: "java",
      filename: "CooperativeCancellation.java",
      purpose: "업무 상태와 blocking wake-up을 결합해 처리 수·종료 신호를 exact하게 검증합니다.",
      code: String.raw`import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

public class CooperativeCancellation {
    public static void main(String[] args) throws InterruptedException {
        BlockingQueue<Integer> queue = new LinkedBlockingQueue<>();
        queue.add(1);
        queue.add(1);
        queue.add(1);
        AtomicBoolean stop = new AtomicBoolean();
        AtomicBoolean interruptedExit = new AtomicBoolean();
        AtomicInteger processed = new AtomicInteger();
        CountDownLatch beforeEmptyTake = new CountDownLatch(1);

        Thread worker = new Thread(() -> {
            try {
                while (!stop.get()) {
                    processed.addAndGet(queue.take());
                    if (processed.get() == 3) {
                        beforeEmptyTake.countDown();
                    }
                }
            } catch (InterruptedException failure) {
                interruptedExit.set(stop.get());
                Thread.currentThread().interrupt();
            }
        }, "queue-worker");

        worker.start();
        beforeEmptyTake.await();
        stop.set(true);
        worker.interrupt();
        worker.join();

        System.out.println("stopRequested=" + stop.get());
        System.out.println("processed=" + processed.get());
        System.out.println("interruptedExit=" + interruptedExit.get());
    }
}`,
      walkthrough: [
        { lines: "1-16", explanation: "세 deterministic jobs, token, 결과 counters와 empty take 직전 gate를 준비합니다." },
        { lines: "18-29", explanation: "worker는 token을 검사하며 take하고 interruption을 token과 결합해 취소로 분류합니다." },
        { lines: "31-35", explanation: "controller가 세 처리 후 token 설정·interrupt·join 순서를 소유합니다." },
        { lines: "37-39", explanation: "취소 요청, exact 처리 수, expected interruption exit를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "single source file", "in-memory queue"], command: isolatedJavaRun("CooperativeCancellation.java", "CooperativeCancellation") },
      output: { value: "stopRequested=true\nprocessed=3\ninterruptedExit=true", explanation: ["세 jobs만 처리됩니다.", "token이 업무 취소를 표현합니다.", "interrupt가 empty take를 깨워 종료 latency를 제한합니다."] },
      experiments: [
        { change: "stop.set(true)만 하고 interrupt를 제거합니다.", prediction: "worker는 empty take에서 token을 다시 검사하지 못하고 계속 대기합니다.", result: "blocking wake-up channel이 필요합니다." },
        { change: "interrupt만 보내고 token을 false로 둡니다.", prediction: "catch가 expected cancellation로 분류하지 못합니다.", result: "업무 의미는 explicit token에 둡니다." },
        { change: "항목 처리 중간에 shared final output을 직접 갱신합니다.", prediction: "취소 시 partial state가 노출될 수 있습니다.", result: "checkpoint를 atomic work boundary 뒤로 옮깁니다." },
      ],
      sourceRefs: ["java-blocking-queue", "java-linked-blocking-queue", "java-countdown-latch", "java-atomic-boolean", "java-atomic-integer", "java-thread"],
    }],
    diagnostics: [
      { symptom: "stop flag는 true인데 queue worker가 종료되지 않는다.", likelyCause: "worker가 blocking take 안에서 flag를 다시 검사할 기회를 얻지 못합니다.", checks: ["thread dump의 blocking point를 봅니다.", "controller가 interrupt도 보내는지 봅니다.", "interruptible API인지 확인합니다."], fix: "token 설정 뒤 owner가 worker를 interrupt하고 termination을 join합니다.", prevention: "계산·대기 두 경로의 cancellation latency test를 둡니다." },
      { symptom: "모든 interrupt가 사용자 취소로 기록된다.", likelyCause: "interrupt status만 보고 업무 reason token을 확인하지 않습니다.", checks: ["requesting owner와 reason을 추적합니다.", "stop token 상태를 봅니다.", "infrastructure shutdown과 사용자 취소를 구분합니다."], fix: "explicit cancellation context와 interrupt wake-up을 함께 전달합니다.", prevention: "state transition audit에 requester·reason·deadline을 남깁니다." },
    ],
    expertNotes: ["A token gives cancellation semantic scope; interrupt gives blocked Java code a standard escape hatch. Neither alone is a complete operational protocol."],
  },
  {
    id: "interruption-propagation-and-exception-translation",
    title: "InterruptedException을 전파하거나 flag를 복원해 예외 경계를 지킵니다",
    lead: "checked interruption을 API 표면에 둘 수 있으면 그대로 전파하고, unchecked domain cancellation로 변환해야 한다면 cause와 interrupt status를 모두 보존합니다.",
    explanations: [
      "가장 단순하고 정보 손실이 적은 선택은 메서드가 throws InterruptedException을 선언해 호출자가 policy를 정하게 하는 것입니다. low-level library가 임의로 재시도하거나 취소를 정상 결과로 바꾸지 않습니다.",
      "Runnable.run처럼 checked exception을 선언할 수 없는 경계에서는 catch 후 currentThread().interrupt()로 status를 복원하고 반환하거나 unchecked cancellation exception으로 변환할 수 있습니다.",
      "예외 cause는 진단 chain을, restored flag는 상위 polling·executor protocol을 보존합니다. 둘 중 하나만 남기면 관측 또는 control channel 하나가 끊깁니다.",
      "예제는 main 자신을 먼저 interrupt해 sleep가 즉시 InterruptedException을 던지게 합니다. service boundary가 CancellationException에 cause를 연결하고 flag를 복원하므로 외부 catch가 두 evidence를 모두 봅니다.",
      "CancellationException은 정상 success가 아닙니다. metrics·API response에서는 failed와 cancelled를 구분하되, stack trace에 민감 payload를 넣지 않고 safe task context만 제공합니다.",
      "복원 뒤 catch 바깥에서 추가 interruptible cleanup을 호출하면 즉시 실패할 수 있습니다. 필요하면 non-interruptible 최소 cleanup, 별도 cleanup owner, suppressed failure 보존을 설계합니다.",
    ],
    concepts: [
      { term: "propagation", definition: "InterruptedException을 호출 signature에 그대로 올려 policy 결정을 상위 owner에 맡기는 방식입니다.", detail: ["원인과 checked contract가 보존됩니다.", "boundary가 허용할 때 우선합니다."] },
      { term: "exception translation", definition: "계층의 public abstraction에 맞는 exception으로 바꾸되 original cause를 연결하는 방식입니다.", detail: ["cause를 잃지 않습니다.", "interruption이면 status도 고려합니다."] },
      { term: "dual preservation", definition: "diagnostic cause chain과 control용 interrupt flag를 동시에 보존하는 규칙입니다.", detail: ["로그와 polling 모두 살아남습니다.", "취소를 성공 값으로 위장하지 않습니다."] },
    ],
    codeExamples: [{
      id: "java-interrupt-boundary-translation",
      title: "checked interruption을 cancellation으로 바꾸며 cause·flag를 보존합니다",
      language: "java",
      filename: "InterruptBoundary.java",
      purpose: "Runnable·service 같은 checked-exception 제한 경계의 안전한 translation pattern을 검증합니다.",
      code: String.raw`import java.util.concurrent.CancellationException;

public class InterruptBoundary {
    private static void interruptibleOperation() throws InterruptedException {
        Thread.sleep(1_000);
    }

    private static void serviceBoundary() {
        try {
            interruptibleOperation();
        } catch (InterruptedException failure) {
            Thread.currentThread().interrupt();
            CancellationException translated =
                    new CancellationException("operation cancelled");
            translated.initCause(failure);
            throw translated;
        }
    }

    public static void main(String[] args) {
        Thread.currentThread().interrupt();
        try {
            serviceBoundary();
        } catch (CancellationException failure) {
            System.out.println("type=" + failure.getClass().getSimpleName());
            System.out.println("cause=" + failure.getCause().getClass().getSimpleName());
            System.out.println("restored=" + Thread.currentThread().isInterrupted());
        } finally {
            Thread.interrupted();
        }
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "checked interruption을 그대로 선언하는 low-level operation을 둡니다." },
        { lines: "8-18", explanation: "service boundary가 flag를 복원하고 CancellationException에 original cause를 연결합니다." },
        { lines: "20-31", explanation: "main이 미리 interrupt해 즉시 경로를 만들고 type·cause·status를 확인한 뒤 test process flag를 정리합니다." },
      ],
      run: { environment: ["OpenJDK 21", "fresh JVM", "single thread"], command: isolatedJavaRun("InterruptBoundary.java", "InterruptBoundary") },
      output: { value: "type=CancellationException\ncause=InterruptedException\nrestored=true", explanation: ["public boundary에는 cancellation type이 보입니다.", "진단 cause는 InterruptedException입니다.", "control flag도 복원되어 있습니다."] },
      experiments: [
        { change: "initCause를 제거합니다.", prediction: "상위 진단에서 실제 blocking interruption을 잃습니다.", result: "translation은 cause chain을 보존합니다." },
        { change: "currentThread().interrupt를 제거합니다.", prediction: "restored=false가 되어 상위 polling protocol이 신호를 놓칩니다.", result: "checked exception을 삼키는 경계에서 flag를 복원합니다." },
        { change: "serviceBoundary가 throws InterruptedException을 허용하게 바꿉니다.", prediction: "translation 없이 더 직접적인 contract가 됩니다.", result: "가능하면 checked propagation을 우선합니다." },
      ],
      sourceRefs: ["java-thread", "java-cancellation-exception", "oracle-interrupts"],
    }],
    diagnostics: [
      { symptom: "상위에서 CancellationException은 보이지만 원래 blocking 지점을 모른다.", likelyCause: "exception translation 때 cause를 연결하지 않았습니다.", checks: ["getCause가 null인지 봅니다.", "catch에서 새 exception만 만드는지 봅니다.", "safe context가 있는지 봅니다."], fix: "original InterruptedException을 cause로 연결하고 필요한 safe context를 추가합니다.", prevention: "translation test에서 type·cause·status를 모두 assert합니다." },
      { symptom: "executor shutdown이 task cancellation을 놓친다.", likelyCause: "Runnable boundary가 InterruptedException을 unchecked로 바꾸면서 flag를 복원하지 않았습니다.", checks: ["catch 직후 status를 봅니다.", "RuntimeException cause만 남았는지 봅니다.", "loop가 계속되는지 봅니다."], fix: "restore 후 종료하거나 cancellation으로 변환해 상위 channel에 전달합니다.", prevention: "interrupt catch에 control·diagnostic dual preservation rule을 적용합니다." },
    ],
    expertNotes: ["Exception translation should preserve abstraction without erasing control-flow semantics. For interruption, that often means preserving both cause and status."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...interruptContractChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "oracle-interrupts", repository: "Oracle Java Tutorials", path: "Concurrency/Interrupts", publicUrl: "https://docs.oracle.com/javase/tutorial/essential/concurrency/interrupt.html", usedFor: ["interrupt status", "InterruptedException clear and restore", "cooperative cancellation"], evidence: "Java interrupt idiom의 공식 학습 근거입니다." },
  { id: "java-blocking-queue", repository: "Java SE 21 API", path: "java.util.concurrent.BlockingQueue", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/BlockingQueue.html", usedFor: ["interruptible take", "producer consumer contract"], evidence: "blocking queue cancellation point 근거입니다." },
  { id: "java-linked-blocking-queue", repository: "Java SE 21 API", path: "java.util.concurrent.LinkedBlockingQueue", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/LinkedBlockingQueue.html", usedFor: ["deterministic in-memory work queue"], evidence: "예제 queue implementation 근거입니다." },
  { id: "java-atomic-integer", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html", usedFor: ["thread-safe processed count"], evidence: "worker progress counter 근거입니다." },
  { id: "java-cancellation-exception", repository: "Java SE 21 API", path: "java.util.concurrent.CancellationException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CancellationException.html", usedFor: ["unchecked cancellation boundary", "Future cancellation result"], evidence: "취소를 failure와 구분하는 표준 type 근거입니다." },
);

const managedTaskChapters: DetailedSession["chapters"] = [
  {
    id: "future-cancel-interrupt-completion-channel",
    title: "Future.cancel(true)를 취소 요청과 결과 channel로 사용합니다",
    lead: "Future는 Thread보다 task abstraction에 가깝고 success·failure·cancellation을 get으로 구분하지만, cancel(true)도 실행 중 code가 interrupt에 협력해야 끝납니다.",
    explanations: [
      "ExecutorService.submit은 task를 Future와 연결합니다. Future.get은 정상 result를 반환하고 worker exception을 ExecutionException cause로 전달하며, 취소된 task에서는 CancellationException을 던집니다.",
      "cancel(false)는 아직 시작하지 않은 task의 실행을 막을 수 있지만 이미 실행 중이면 interrupt를 요청하지 않습니다. cancel(true)는 실행 중 thread에 interrupt를 시도할 권한을 executor에 주지만 강제 종료를 보장하지 않습니다.",
      "cancel 반환 true는 task가 cancelled state로 전환되었다는 뜻입니다. worker가 cleanup을 끝내고 thread가 종료됐다는 뜻은 아니므로 executor termination 또는 별도 task completion evidence가 필요합니다.",
      "예제 Callable은 시작 latch 뒤 무기한 sleep하고, catch에서 workerInterrupted를 기록한 다음 InterruptedException을 다시 던집니다. main은 cancel(true), shutdown, awaitTermination 뒤 Future state와 worker evidence를 읽습니다.",
      "cancel된 Future.get은 worker가 던진 InterruptedException을 ExecutionException으로 보여 주지 않고 CancellationException을 우선합니다. 상세 worker cleanup failure가 필요하면 별도 telemetry·handler channel을 둡니다.",
      "Future를 잃어버리면 개별 취소·failure 관측도 잃습니다. task registry의 수명, task id와 Future mapping, 완료 후 제거와 memory retention을 함께 설계합니다.",
    ],
    concepts: [
      { term: "Future state", definition: "task의 pending·completed·failed·cancelled 결과를 caller가 관찰하는 handle 상태입니다.", detail: ["get으로 completion을 기다립니다.", "cancellation과 termination은 같은 사실이 아닙니다."] },
      { term: "mayInterruptIfRunning", definition: "cancel(true)가 이미 실행 중인 task thread에 interrupt를 시도하도록 허용하는 parameter입니다.", detail: ["true도 강제 kill이 아닙니다.", "task cooperation이 필요합니다."] },
      { term: "task handle ownership", definition: "누가 Future를 보관하고 취소·get·관측·제거할지 정하는 application 책임입니다.", detail: ["task id와 연결합니다.", "완료 후 retention을 제한합니다."] },
    ],
    codeExamples: [{
      id: "java-future-cancel-interrupt",
      title: "실행 중 Callable을 cancel(true)하고 cancellation·interruption·termination을 분리합니다",
      language: "java",
      filename: "FutureCancellation.java",
      purpose: "Future state와 실제 worker interrupt evidence를 모두 확인합니다.",
      code: String.raw`import java.util.concurrent.CancellationException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class FutureCancellation {
    public static void main(String[] args) throws Exception {
        ExecutorService executor = Executors.newSingleThreadExecutor();
        CountDownLatch started = new CountDownLatch(1);
        AtomicBoolean workerInterrupted = new AtomicBoolean();
        Future<String> future = executor.submit(() -> {
            started.countDown();
            try {
                Thread.sleep(Long.MAX_VALUE);
                return "unexpected";
            } catch (InterruptedException failure) {
                workerInterrupted.set(true);
                throw failure;
            }
        });

        started.await();
        boolean cancelAccepted = future.cancel(true);
        executor.shutdown();
        boolean terminated = executor.awaitTermination(2, TimeUnit.SECONDS);
        String getOutcome;
        try {
            future.get();
            getOutcome = "value";
        } catch (CancellationException expected) {
            getOutcome = expected.getClass().getSimpleName();
        }

        System.out.println("cancelAccepted=" + cancelAccepted);
        System.out.println("isCancelled=" + future.isCancelled());
        System.out.println("get=" + getOutcome);
        System.out.println("workerInterrupted=" + workerInterrupted.get());
        System.out.println("terminated=" + terminated);
    }
}`,
      walkthrough: [
        { lines: "1-13", explanation: "single worker executor, start gate, interruption evidence와 Future handle을 준비합니다." },
        { lines: "14-23", explanation: "Callable이 sleep interruption을 기록하고 checked failure를 executor에 되돌립니다." },
        { lines: "25-34", explanation: "실행 확인 뒤 cancel(true), executor shutdown·termination과 Future.get cancellation을 확인합니다." },
        { lines: "36-40", explanation: "handle state, API outcome, worker signal, executor termination을 별도 facts로 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "single-thread ExecutorService", "2-second termination bound"], command: isolatedJavaRun("FutureCancellation.java", "FutureCancellation") },
      output: { value: "cancelAccepted=true\nisCancelled=true\nget=CancellationException\nworkerInterrupted=true\nterminated=true", explanation: ["Future가 cancelled state를 받아들였습니다.", "get은 CancellationException입니다.", "worker도 실제 interrupt를 받았습니다.", "executor thread가 종료됐습니다."] },
      experiments: [
        { change: "cancel(false)로 바꿉니다.", prediction: "이미 sleep 중인 task에는 interrupt가 전달되지 않아 executor가2초 안에 종료되지 않습니다.", result: "queued와 running cancellation 의미를 구분합니다." },
        { change: "worker가 InterruptedException을 삼키고 다시 sleep합니다.", prediction: "Future는 cancelled지만 executor termination이 늦어집니다.", result: "handle state만으로 실제 종료를 추정하지 않습니다." },
        { change: "Future reference를 버립니다.", prediction: "개별 task의 get·cancel·state 관찰 경로를 잃습니다.", result: "task registry 수명과 cleanup을 정합니다." },
      ],
      sourceRefs: ["java-executor-service", "java-executors", "java-future", "java-cancellation-exception", "java-time-unit", "java-countdown-latch", "java-atomic-boolean"],
    }],
    diagnostics: [
      { symptom: "future.isCancelled는 true인데 process가 끝나지 않는다.", likelyCause: "task가 interrupt를 무시하거나 executor 자체를 shutdown하지 않았습니다.", checks: ["worker가 catch 후 계속 실행하는지 봅니다.", "executor.isTerminated를 봅니다.", "non-daemon pool thread dump를 봅니다."], fix: "task의 cooperative cancellation을 고치고 executor shutdown·await protocol을 실행합니다.", prevention: "cancelled handle과 terminated worker를 별도 test합니다." },
      { symptom: "cancelled Future에서 worker의 원래 InterruptedException을 get으로 찾지 못한다.", likelyCause: "Future cancellation state에서는 get이 CancellationException을 보고하는 계약입니다.", checks: ["isCancelled를 먼저 봅니다.", "worker telemetry를 확인합니다.", "cleanup failure channel을 확인합니다."], fix: "취소 원인·cleanup 실패는 별도 structured task record에 남깁니다.", prevention: "Future result와 operational audit 책임을 분리합니다." },
    ],
    expertNotes: ["Future.cancel(true) is a request routed through the executor. It neither injects asynchronous exceptions at arbitrary points nor proves task cleanup is complete."],
  },
  {
    id: "executor-two-phase-shutdown-requeue",
    title: "ExecutorService를 graceful→forced 두 단계로 닫고 미시작 작업을 회수합니다",
    lead: "shutdown은 새 제출을 막고 기존 작업을 drain하며, deadline을 넘긴 뒤 shutdownNow가 보내는 interrupt와 반환 queue를 모두 회계해야 손실 없는 종료가 됩니다.",
    explanations: [
      "shutdown() 이후 executor는 새 task를 거부하지만 이미 실행 중이거나 queue에 있는 task는 계속 처리합니다. awaitTermination은 그 완료를 제한 시간 동안 기다립니다.",
      "grace period가 끝나면 shutdownNow()는 실행 중 worker를 interrupt하려 시도하고 아직 시작하지 않은 Runnable 목록을 반환합니다. 그 목록을 버리면 accepted task가 조용히 유실됩니다.",
      "shutdownNow도 강제 kill이 아닙니다. 실행 중 task가 interrupt를 무시하면 isTerminated는 false로 남을 수 있으므로 escalation과 격리 기준이 필요합니다.",
      "예제는 single-thread executor의 첫 task를 latch에 막고 두 번째 task를 queue에 둡니다. shutdown 뒤 새 제출은 거부되고20ms grace는 false, shutdownNow 반환 목록은 정확히1개입니다.",
      "running task는 await interruption을 catch해 flag를 복원하고 끝납니다. 두 번째 awaitTermination이 실제 thread 종료를 확인한 뒤에만 requeue된 task ownership을 넘길 수 있습니다.",
      "실무 Runnable 자체보다 durable task id·payload reference를 queue item으로 사용해야 restart 뒤 재등록할 수 있습니다. in-memory FutureTask 객체는 process 경계를 넘는 복구 형식이 아닙니다.",
    ],
    concepts: [
      { term: "graceful shutdown", definition: "새 제출을 거부하고 이미 accepted한 작업의 정상 완료를 기다리는 종료 단계입니다.", detail: ["shutdown을 호출합니다.", "awaitTermination으로 bounded wait합니다."] },
      { term: "forced cancellation phase", definition: "grace deadline 뒤 running tasks에 interrupt를 시도하고 queued tasks를 회수하는 단계입니다.", detail: ["shutdownNow를 사용합니다.", "강제 종료 보장은 아닙니다."] },
      { term: "requeue accounting", definition: "shutdownNow가 반환한 미시작 작업을 durable queue 또는 명시 실패 상태로 보존하는 회계입니다.", detail: ["accepted 합계를 맞춥니다.", "in-memory Runnable 그대로 장기 저장하지 않습니다."] },
    ],
    codeExamples: [{
      id: "java-executor-two-phase-shutdown",
      title: "running1·queued1을 graceful timeout 뒤 interrupt·회수합니다",
      language: "java",
      filename: "TwoPhaseShutdown.java",
      purpose: "거부·grace timeout·queued return·running interrupt·termination을 한 deterministic fixture로 검증합니다.",
      code: String.raw`import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class TwoPhaseShutdown {
    public static void main(String[] args) throws InterruptedException {
        ExecutorService executor = Executors.newSingleThreadExecutor();
        CountDownLatch running = new CountDownLatch(1);
        CountDownLatch neverReleased = new CountDownLatch(1);
        AtomicBoolean runningInterrupted = new AtomicBoolean();

        executor.submit(() -> {
            running.countDown();
            try {
                neverReleased.await();
            } catch (InterruptedException failure) {
                runningInterrupted.set(true);
                Thread.currentThread().interrupt();
            }
        });
        running.await();
        executor.submit(() -> System.out.println("unexpected queued run"));

        executor.shutdown();
        boolean acceptedAfterShutdown;
        try {
            executor.execute(() -> { });
            acceptedAfterShutdown = true;
        } catch (RejectedExecutionException expected) {
            acceptedAfterShutdown = false;
        }
        boolean graceful = executor.awaitTermination(20, TimeUnit.MILLISECONDS);
        List<Runnable> queued = executor.shutdownNow();
        boolean terminated = executor.awaitTermination(2, TimeUnit.SECONDS);

        System.out.println("acceptedAfterShutdown=" + acceptedAfterShutdown);
        System.out.println("graceful=" + graceful);
        System.out.println("queuedForRecovery=" + queued.size());
        System.out.println("runningInterrupted=" + runningInterrupted.get());
        System.out.println("terminated=" + terminated);
    }
}`,
      walkthrough: [
        { lines: "1-14", explanation: "single worker, running gate, permanent block와 interrupt evidence를 준비합니다." },
        { lines: "16-26", explanation: "첫 task를 running 상태에 고정하고 두 번째 task를 queue에 넣습니다." },
        { lines: "28-38", explanation: "shutdown 뒤 거부, grace wait, shutdownNow queue 회수와 최종 termination을 실행합니다." },
        { lines: "40-44", explanation: "두 단계의 모든 acceptance facts를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "single-thread ExecutorService", "in-memory tasks only"], command: isolatedJavaRun("TwoPhaseShutdown.java", "TwoPhaseShutdown") },
      output: { value: "acceptedAfterShutdown=false\ngraceful=false\nqueuedForRecovery=1\nrunningInterrupted=true\nterminated=true", explanation: ["shutdown 뒤 제출은 거부됩니다.", "막힌 task 때문에 grace period를 넘깁니다.", "미시작1개를 회수합니다.", "running task는 interrupt로 끝나고 executor가 terminated됩니다."] },
      experiments: [
        { change: "shutdownNow 반환 목록을 무시합니다.", prediction: "accepted됐지만 시작하지 않은 두 번째 작업이 유실됩니다.", result: "durable id로 requeue하거나 명시 실패 처리합니다." },
        { change: "running task가 interrupt catch 뒤 다시 await합니다.", prediction: "terminated=false가 될 수 있습니다.", result: "비협력 task의 격리·process escalation 정책을 둡니다." },
        { change: "shutdown 호출을 생략합니다.", prediction: "pool의 user thread 때문에 main 이후 JVM이 살아 있을 수 있습니다.", result: "executor owner는 반드시 lifecycle을 닫습니다." },
      ],
      sourceRefs: ["java-executor-service", "java-executors", "java-rejected-execution", "java-time-unit", "java-countdown-latch", "java-atomic-boolean", "java-list"],
    }],
    diagnostics: [
      { symptom: "배포 종료 때 queue에 있던 작업이 사라진다.", likelyCause: "shutdownNow 반환 Runnable 목록을 버리고 accepted task 회계를 하지 않았습니다.", checks: ["shutdownNow 반환값 사용을 봅니다.", "accepted와 terminal counts를 비교합니다.", "durable queue ack 시점을 봅니다."], fix: "미시작 task ids를 재queue하거나 explicit failed state로 남깁니다.", prevention: "accepted=completed+requeued+cancelled+failed 불변식을 metric·test로 둡니다." },
      { symptom: "shutdownNow 뒤에도 executor가 terminated되지 않는다.", likelyCause: "running code가 interrupt status를 검사하지 않거나 non-interruptible call에 갇혔습니다.", checks: ["thread dump와 native/blocking call을 봅니다.", "catch에서 signal을 삼키는지 봅니다.", "termination deadline을 봅니다."], fix: "cooperative checkpoints를 추가하고 격리 process 또는 resource close로 unblock할 정책을 둡니다.", prevention: "task type별 cancellation latency와 escalation boundary를 문서화합니다." },
    ],
    expertNotes: ["The list returned by shutdownNow is an ownership transfer of never-started tasks, not proof that running tasks stopped."],
  },
  {
    id: "join-does-not-propagate-uncaught-failure",
    title: "join과 별도로 worker의 uncaught failure channel을 만듭니다",
    lead: "Thread가 예외로 종료돼도 join은 InterruptedException 외에 worker cause를 던지지 않으므로, handler나 Future로 실패를 명시적으로 전달해야 합니다.",
    explanations: [
      "unchecked exception이 run 밖으로 빠져나오면 Thread는 UncaughtExceptionHandler를 호출한 뒤 종료합니다. handler가 없으면 ThreadGroup의 기본 처리로 stderr stack trace가 나올 수 있습니다.",
      "join caller는 worker가 정상 반환했는지 예외로 끝났는지 알 수 없습니다. 둘 다 termination이므로 join은 정상 반환하고 isAlive는 false입니다.",
      "예제는 worker별 handler를 start 전에 설치해 stderr를 오염시키지 않고 thread name과 Throwable을 AtomicReference에 저장합니다. join 뒤 handler action도 완료되어 deterministic하게 읽힙니다.",
      "handler 자체는 복구를 계속 수행하는 worker가 아닙니다. 최소한의 safe telemetry와 supervisor notification을 하고, blocking·실패 가능 작업은 별도 관리 경로에 넘깁니다.",
      "ExecutorService submit task의 exception은 보통 Future에 capture되어 uncaught handler로 가지 않습니다. execute와 submit, Thread 직접 실행의 failure channel 차이를 테스트해야 합니다.",
      "failure payload에 secret·전체 입력을 넣지 않고 type, safe task id, state, cause category, correlation id를 남깁니다. handler failure까지 관측 가능한 fallback을 둡니다.",
    ],
    concepts: [
      { term: "uncaught exception", definition: "run call stack 어디에서도 처리되지 않아 thread termination으로 이어지는 Throwable입니다.", detail: ["handler가 호출됩니다.", "join caller에 자동 전파되지 않습니다."] },
      { term: "UncaughtExceptionHandler", definition: "thread가 uncaught exception으로 끝나기 직전 failure와 thread를 받는 callback입니다.", detail: ["start 전에 설치합니다.", "최소 작업만 수행합니다."] },
      { term: "failure channel", definition: "worker의 성공·실패 원인을 supervisor에 전달하는 Thread lifecycle과 별도의 통신 경로입니다.", detail: ["Future 또는 handler를 씁니다.", "termination만으로 success를 추정하지 않습니다."] },
    ],
    codeExamples: [{
      id: "java-uncaught-failure-channel",
      title: "handler가 worker failure를 capture하고 join 뒤 읽습니다",
      language: "java",
      filename: "UncaughtFailureChannel.java",
      purpose: "worker exception이 join으로 전파되지 않는다는 사실과 별도 capture pattern을 검증합니다.",
      code: String.raw`import java.util.concurrent.atomic.AtomicReference;

public class UncaughtFailureChannel {
    public static void main(String[] args) throws InterruptedException {
        AtomicReference<String> failedThread = new AtomicReference<>();
        AtomicReference<Throwable> failure = new AtomicReference<>();
        Thread worker = new Thread(
                () -> { throw new IllegalStateException("boom"); },
                "boom-worker");
        worker.setUncaughtExceptionHandler((thread, problem) -> {
            failedThread.set(thread.getName());
            failure.set(problem);
        });

        worker.start();
        worker.join();
        Throwable captured = failure.get();

        System.out.println("joined=" + !worker.isAlive());
        System.out.println("thread=" + failedThread.get());
        System.out.println("type=" + captured.getClass().getSimpleName());
        System.out.println("message=" + captured.getMessage());
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "thread name과 Throwable channels를 만들고 실패하는 worker를 정의합니다." },
        { lines: "10-13", explanation: "start 전에 per-thread handler를 설치해 failure evidence를 capture합니다." },
        { lines: "15-17", explanation: "worker를 start·join한 뒤 captured failure를 읽습니다." },
        { lines: "19-22", explanation: "termination과 failure thread·type·safe message를 별도 facts로 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "single worker", "stderr 없음"], command: isolatedJavaRun("UncaughtFailureChannel.java", "UncaughtFailureChannel") },
      output: { value: "joined=true\nthread=boom-worker\ntype=IllegalStateException\nmessage=boom", explanation: ["join은 정상 반환해 termination만 확인합니다.", "handler가 정확한 thread와 exception을 전달합니다.", "default stderr trace는 발생하지 않습니다."] },
      experiments: [
        { change: "handler를 제거합니다.", prediction: "process exit code는 보통0이어도 stderr에 worker stack trace가 나옵니다.", result: "failure observability와 process success를 분리합니다." },
        { change: "같은 Runnable을 executor.submit으로 실행합니다.", prediction: "exception은 Future.get의 ExecutionException cause로 전달되고 handler가 호출되지 않을 수 있습니다.", result: "execution API별 failure channel을 테스트합니다." },
        { change: "handler 안에서 다시 exception을 던집니다.", prediction: "원래 failure 관측까지 잃을 수 있습니다.", result: "handler를 작고 실패 안전하게 유지합니다." },
      ],
      sourceRefs: ["java-thread-uncaught-handler", "java-atomic-reference", "java-future", "jls-12-8"],
    }],
    diagnostics: [
      { symptom: "worker가 실패했는데 main exit code와 join은 정상이다.", likelyCause: "Thread uncaught exception은 main caller로 자동 전파되지 않으며 다른 user thread가 정상 종료했습니다.", checks: ["stderr·handler를 봅니다.", "worker completion status를 봅니다.", "Future/handler channel 유무를 확인합니다."], fix: "worker failure를 supervisor channel에 전달하고 전체 operation outcome을 명시 계산합니다.", prevention: "thread termination과 업무 success를 서로 다른 test assertion으로 둡니다." },
      { symptom: "UncaughtExceptionHandler를 달았지만 executor submit 실패가 안 잡힌다.", likelyCause: "submit이 exception을 Future에 capture해 run 밖으로 uncaught되지 않았습니다.", checks: ["execute인지 submit인지 봅니다.", "Future.get을 호출하는지 봅니다.", "afterExecute hook 정책을 봅니다."], fix: "submit은 Future result를 관찰하고 direct Thread/execute는 handler 경로를 사용합니다.", prevention: "task submission wrapper가 failure observation을 강제하게 합니다." },
    ],
    expertNotes: ["Termination, cancellation, and successful completion are three different outcomes. A lifecycle primitive alone cannot encode all three."],
  },
  {
    id: "java21-virtual-thread-lifecycle-cancellation",
    title: "Java21 virtual thread에도 같은 join·interrupt 계약을 적용합니다",
    lead: "virtual thread는 값싼 thread-per-task 실행 모델을 제공하지만 자동 취소·자동 resource ownership을 주지 않으며, 기본 daemon 특성 때문에 join 또는 executor scope가 더 중요합니다.",
    explanations: [
      "Java21에서 Thread.ofVirtual은 preview option 없이 사용할 수 있는 final API입니다. virtual thread는 OS thread를 작업 수만큼 독점하지 않아 blocking 중심 task를 thread-per-task로 표현하기 쉽습니다.",
      "virtual thread도 Thread이므로 start-once, interrupt status, InterruptedException, join, UncaughtExceptionHandler의 핵심 계약을 공유합니다. 동시성 correctness 규칙이 사라지지 않습니다.",
      "virtual thread는 daemon thread이며 daemon status를 false로 바꿀 수 없습니다. main이 끝나면 unfinished virtual thread completion을 JVM이 기다릴 것이라 기대해서는 안 됩니다.",
      "예제는 virtual worker가 latch에 들어간 뒤 interrupt하고 join합니다. isVirtual·isDaemon·cancelled·terminated를 exact하게 확인하고, 비교용 unstarted platform thread의 기본 daemon=false도 출력합니다.",
      "많은 virtual thread를 만들 수 있다는 것은 무제한 downstream 요청을 허용한다는 뜻이 아닙니다. database connection, remote API quota, memory, open files에는 semaphore·rate limit·backpressure가 필요합니다.",
      "ThreadLocal 값과 pinning 가능 구간, 관측 도구, library 호환성을 측정합니다. CPU-bound parallelism에는 core 수에 맞춘 executor가 더 적절할 수 있습니다.",
    ],
    concepts: [
      { term: "virtual thread", definition: "JVM이 scheduling하는 가벼운 Thread로 blocking task를 thread-per-task style로 표현하도록 설계되었습니다.", detail: ["Java21 final feature입니다.", "Thread API 계약을 따릅니다."] },
      { term: "carrier", definition: "virtual thread 실행을 실제 CPU에서 운반하는 JVM-managed platform thread입니다.", detail: ["application이 보통 직접 관리하지 않습니다.", "일부 blocking 구간의 pinning을 관찰합니다."] },
      { term: "resource concurrency limit", definition: "thread 수와 별개로 database·API·file 같은 downstream 자원의 허용 동시성을 제한하는 정책입니다.", detail: ["semaphore·pool·rate limiter를 씁니다.", "virtual thread가 제거하지 않습니다."] },
    ],
    codeExamples: [{
      id: "java-virtual-thread-interrupt-join",
      title: "virtual thread의 daemon status와 interruption·join을 검증합니다",
      language: "java",
      filename: "VirtualThreadLifecycle.java",
      purpose: "Java21 virtual thread도 cooperative cancellation과 termination synchronization이 필요함을 확인합니다.",
      code: String.raw`import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicBoolean;

public class VirtualThreadLifecycle {
    public static void main(String[] args) throws InterruptedException {
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch neverReleased = new CountDownLatch(1);
        AtomicBoolean cancelled = new AtomicBoolean();
        Thread virtual = Thread.ofVirtual().name("fetch-vt").unstarted(() -> {
            started.countDown();
            try {
                neverReleased.await();
            } catch (InterruptedException failure) {
                cancelled.set(true);
                Thread.currentThread().interrupt();
            }
        });
        Thread platform = Thread.ofPlatform().name("platform").unstarted(() -> { });

        virtual.start();
        started.await();
        virtual.interrupt();
        virtual.join();

        System.out.println("virtual=" + virtual.isVirtual());
        System.out.println("virtualDaemon=" + virtual.isDaemon());
        System.out.println("platformDaemon=" + platform.isDaemon());
        System.out.println("cancelled=" + cancelled.get());
        System.out.println("terminated=" + !virtual.isAlive());
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "virtual worker의 시작·block과 cancellation evidence를 준비합니다." },
        { lines: "9-18", explanation: "virtual builder로 unstarted thread를 만들고 await interruption에서 flag를 복원합니다." },
        { lines: "19-24", explanation: "비교 platform thread를 만들고 virtual을 start·interrupt·join합니다." },
        { lines: "26-30", explanation: "thread kind·daemon defaults·취소·termination을 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21 exactly or later", "no --enable-preview", "single virtual thread"], command: isolatedJavaRun("VirtualThreadLifecycle.java", "VirtualThreadLifecycle") },
      output: { value: "virtual=true\nvirtualDaemon=true\nplatformDaemon=false\ncancelled=true\nterminated=true", explanation: ["virtual thread API가 Java21에서 동작합니다.", "virtual은 daemon, 비교 platform은 user입니다.", "interrupt와 join으로 명시 취소·종료합니다."] },
      experiments: [
        { change: "virtual.join을 제거하고 main을 즉시 끝냅니다.", prediction: "virtual이 daemon이라 작업 완료를 기다린다는 보장이 없습니다.", result: "scope 또는 Future/join으로 lifetime을 관리합니다." },
        { change: "virtual thread10만 개가 DB connection을 동시에 요청하게 합니다.", prediction: "thread 생성은 가능해도 connection pool·DB가 병목 또는 과부하됩니다.", result: "downstream concurrency limit을 별도로 둡니다." },
        { change: "CPU-bound task를 무제한 virtual threads로 실행합니다.", prediction: "core 수를 넘는 runnable work가 throughput을 자동 개선하지 않습니다.", result: "workload 성격을 측정해 executor를 선택합니다." },
      ],
      sourceRefs: ["java-thread", "java-thread-builder-virtual", "jep-444", "java-countdown-latch", "java-atomic-boolean"],
    }],
    diagnostics: [
      { symptom: "virtual worker가 main 종료 전에 결과를 publish하지 못한다.", likelyCause: "virtual thread의 daemon 특성을 무시하고 join·scope·executor close를 생략했습니다.", checks: ["isDaemon을 확인합니다.", "Future/join owner를 찾습니다.", "partial output을 확인합니다."], fix: "task lifetime을 명시 scope에 묶고 completion 뒤 publish합니다.", prevention: "main-return-before-task fixture를 종료 test에 포함합니다." },
      { symptom: "virtual threads로 바꿨지만 DB timeout과 rate-limit 오류가 늘었다.", likelyCause: "thread 비용 감소를 downstream capacity 증가로 오해해 동시 요청을 제한하지 않았습니다.", checks: ["in-flight DB/API 수를 봅니다.", "pool·quota·latency를 봅니다.", "backpressure를 확인합니다."], fix: "resource별 semaphore·pool·rate limit과 queue bound를 적용합니다.", prevention: "thread 수와 resource concurrency budget을 분리해 capacity test합니다." },
    ],
    comparisons: [{
      title: "task 실행 모델",
      options: [
        { name: "platform thread pool", chooseWhen: "CPU-bound work나 제한된 concurrency를 명시 운영할 때", avoidWhen: "많은 독립 blocking task를 thread 수 때문에 복잡하게 비동기화할 때", tradeoffs: ["mature tooling", "thread당 비용이 큽니다."] },
        { name: "virtual thread per task", chooseWhen: "많은 독립 blocking I/O task를 직선 code로 표현할 때", avoidWhen: "무제한 downstream concurrency 또는 CPU throughput 해결책으로 쓸 때", tradeoffs: ["thread 생성 비용이 낮습니다.", "lifecycle·resource limit은 여전히 필요합니다."] },
      ],
    }],
    expertNotes: ["Virtual threads scale thread-per-task representation; they do not make unsafe publication, unbounded fan-out, or ignored interruption correct."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...managedTaskChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-executor-service", repository: "Java SE 21 API", path: "java.util.concurrent.ExecutorService", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html", usedFor: ["submit", "shutdown", "awaitTermination", "shutdownNow"], evidence: "managed task lifecycle와 two-phase shutdown 근거입니다." },
  { id: "java-executors", repository: "Java SE 21 API", path: "java.util.concurrent.Executors", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html", usedFor: ["single-thread executor factory"], evidence: "결정적 queue fixture 생성 근거입니다." },
  { id: "java-future", repository: "Java SE 21 API", path: "java.util.concurrent.Future", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Future.html", usedFor: ["task result", "cancel", "cancellation state", "get"], evidence: "task completion channel 계약 근거입니다." },
  { id: "java-time-unit", repository: "Java SE 21 API", path: "java.util.concurrent.TimeUnit", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/TimeUnit.html", usedFor: ["bounded executor waits"], evidence: "명시 시간 단위 근거입니다." },
  { id: "java-rejected-execution", repository: "Java SE 21 API", path: "java.util.concurrent.RejectedExecutionException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/RejectedExecutionException.html", usedFor: ["post-shutdown submission rejection"], evidence: "수락 차단 evidence 근거입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "java.util.List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["shutdownNow queued task ownership"], evidence: "미시작 Runnable 반환 collection 근거입니다." },
  { id: "java-thread-uncaught-handler", repository: "Java SE 21 API", path: "java.lang.Thread.UncaughtExceptionHandler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.UncaughtExceptionHandler.html", usedFor: ["per-thread uncaught failure capture"], evidence: "Thread failure channel 근거입니다." },
  { id: "java-thread-builder-virtual", repository: "Java SE 21 API", path: "java.lang.Thread.Builder.OfVirtual", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.Builder.OfVirtual.html", usedFor: ["virtual thread naming and creation"], evidence: "Java21 virtual builder API 근거입니다." },
  { id: "jep-444", repository: "OpenJDK JEP", path: "JEP 444 Virtual Threads", publicUrl: "https://openjdk.org/jeps/444", usedFor: ["Java21 final virtual threads", "daemon semantics", "scalability intent"], evidence: "virtual thread 설계·상태 근거입니다." },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "daemon thread는 중요도가 낮거나 CPU 우선순위가 낮다는 뜻인가요?", answer: "아닙니다. daemon은 마지막 user thread 종료 때 JVM 생존을 붙잡지 않는 lifecycle 속성일 뿐 priority·중요도·안전성을 뜻하지 않습니다." },
  { question: "setDaemon은 언제 호출해야 하나요?", answer: "Thread.start 전에 호출해야 하며, 이미 alive인 thread에서 바꾸면 IllegalThreadStateException입니다." },
  { question: "daemon에게 파일 flush나 transaction commit을 맡겨도 되나요?", answer: "완료를 기다린다는 보장이 없어 안 됩니다. 내구성 작업은 관리되는 user task와 명시 shutdown·atomic publish 경계에 둡니다." },
  { question: "main이 끝나도 Java process가 살아 있는 가장 흔한 이유는 무엇인가요?", answer: "종료하지 않은 non-daemon worker나 ExecutorService pool thread가 남았기 때문입니다." },
  { question: "join은 worker를 실행시키는 메서드인가요?", answer: "아닙니다. 이미 start된 대상 thread가 terminated될 때까지 현재 caller를 기다리게 합니다." },
  { question: "join 뒤 plain field 값이 보이는 근거는 무엇인가요?", answer: "대상 thread의 모든 종료 전 action이 successful join 반환보다 happens-before라는 JLS 규칙입니다." },
  { question: "join이 worker의 RuntimeException을 caller에게 던지나요?", answer: "아닙니다. termination만 기다리므로 Future 또는 UncaughtExceptionHandler 같은 별도 failure channel이 필요합니다." },
  { question: "Thread.sleep으로 join을 대신하면 왜 불안정한가요?", answer: "경과 시간은 실제 completion이나 memory ordering을 보장하지 않고 환경 부하에 따라 달라집니다." },
  { question: "timed join이 정상 반환하면 대상이 끝났다는 뜻인가요?", answer: "아닙니다. timeout도 정상 반환이므로 즉시 isAlive를 재확인해야 합니다." },
  { question: "timeout 뒤 interrupt만 보내고 resource를 넘겨도 되나요?", answer: "안 됩니다. interrupt는 요청일 뿐이므로 final join 또는 executor termination 뒤 ownership을 넘깁니다." },
  { question: "여러 종료 단계의 timeout을 어떻게 전체 제한 안에 묶나요?", answer: "monotonic absolute deadline을 한 번 만들고 각 단계에서 remaining budget만 계산합니다." },
  { question: "interrupt()는 대상 thread를 즉시 죽이나요?", answer: "아닙니다. status를 설정하거나 interruptible blocking API를 깨우는 cooperative request입니다." },
  { question: "isInterrupted와 Thread.interrupted의 핵심 차이는 무엇인가요?", answer: "isInterrupted는 지정 thread status를 보존해 읽고, static Thread.interrupted는 현재 thread status를 읽으며 clear합니다." },
  { question: "Thread.interrupted를 object.interrupted처럼 호출해도 되나요?", answer: "문법상 가능해도 static current-thread operation이라 오해를 만들므로 class 이름으로 호출해야 합니다." },
  { question: "CPU loop가 interrupt에 반응하려면 무엇이 필요한가요?", answer: "안전한 checkpoint에서 isInterrupted 또는 cancellation token을 검사하고 cleanup 뒤 반환해야 합니다." },
  { question: "sleep가 InterruptedException을 던진 catch에서 flag가 false인 이유는 무엇인가요?", answer: "sleep가 exception을 던질 때 interrupt status를 clear하는 API 계약이기 때문입니다." },
  { question: "InterruptedException을 항상 복원해야 하나요?", answer: "항상은 아닙니다. 현재 계층이 취소를 완전히 처리하지 않는다면 전파하거나 복원해야 하며, signal ownership을 명시해야 합니다." },
  { question: "복원한 직후 다시 sleep하면 어떻게 되나요?", answer: "설정된 status 때문에 즉시 InterruptedException이 나고 status가 다시 clear될 수 있습니다." },
  { question: "catch에서 RuntimeException으로 감싸기만 하면 무엇을 잃나요?", answer: "cause를 연결하지 않으면 진단 원인을, flag를 복원하지 않으면 상위 cancellation control signal을 잃습니다." },
  { question: "checked interruption을 API에서 허용할 수 있을 때 가장 단순한 선택은 무엇인가요?", answer: "throws InterruptedException으로 그대로 전파해 상위 lifecycle owner가 정책을 결정하게 하는 것입니다." },
  { question: "cancellation token만으로 blocking worker가 멈추지 않는 이유는 무엇인가요?", answer: "worker가 take·await 안에서 token을 다시 검사할 실행 기회를 얻지 못하기 때문입니다." },
  { question: "interrupt만으로 사용자 취소 이유를 충분히 표현할 수 있나요?", answer: "아닙니다. requester·reason·deadline·scope는 explicit token이나 task state에 둡니다." },
  { question: "취소 checkpoint는 어디에 두어야 하나요?", answer: "중단해도 domain invariant와 resource ownership이 유지되는 작업 단위 경계에 둡니다." },
  { question: "Future.cancel(true)의 true는 무엇을 허용하나요?", answer: "실행 중 task thread에 interrupt를 시도하도록 허용하지만 task 종료를 강제하거나 증명하지 않습니다." },
  { question: "cancel(true)가 true를 반환하면 worker cleanup도 끝났나요?", answer: "아닙니다. Future state 전환만 의미하므로 executor termination 또는 별도 completion evidence를 확인합니다." },
  { question: "취소된 Future.get은 무엇을 던지나요?", answer: "CancellationException을 던지며 worker의 InterruptedException을 ExecutionException으로 보여 주는 것이 아닙니다." },
  { question: "ExecutorService.shutdown은 running task를 interrupt하나요?", answer: "아닙니다. 새 제출을 거부하고 이미 accepted한 running·queued tasks의 정상 완료를 허용합니다." },
  { question: "shutdownNow 반환 목록의 의미는 무엇인가요?", answer: "시작하지 못한 queued Runnable의 ownership이 caller에게 넘어왔다는 뜻이며 durable requeue 또는 terminal 처리가 필요합니다." },
  { question: "shutdownNow가 강제 kill을 보장하나요?", answer: "아닙니다. interrupt를 시도할 뿐이며 비협력 code는 계속 실행할 수 있습니다." },
  { question: "2단계 executor shutdown 순서는 무엇인가요?", answer: "shutdown, bounded awaitTermination, 필요 시 shutdownNow, 미시작 작업 회수, 다시 awaitTermination 순서입니다." },
  { question: "shutdown 뒤 새 submit은 어떻게 되나요?", answer: "RejectedExecutionException 또는 configured RejectedExecutionHandler 정책에 따라 거부됩니다." },
  { question: "accepted task 유실을 찾는 핵심 회계식은 무엇인가요?", answer: "accepted=completed+requeued+cancelled+failed 같은 terminal 합계 불변식입니다." },
  { question: "UncaughtExceptionHandler는 언제 호출되나요?", answer: "Thread의 run stack에서 처리되지 않은 Throwable이 빠져나와 thread가 종료될 때 호출됩니다." },
  { question: "executor.submit task failure도 항상 UncaughtExceptionHandler로 가나요?", answer: "아닙니다. submit은 보통 exception을 Future에 capture하므로 Future.get을 관찰해야 합니다." },
  { question: "handler에서는 어떤 일을 해야 하나요?", answer: "safe task id·thread·cause category 같은 최소 telemetry와 supervisor notification만 수행하고 무거운 복구는 넘깁니다." },
  { question: "Java21 virtual thread는 preview option이 필요한가요?", answer: "아닙니다. JEP444로 Java21 final feature이며 --enable-preview 없이 사용할 수 있습니다." },
  { question: "virtual thread도 interrupt와 join을 쓰나요?", answer: "네. Thread API의 interruption·termination synchronization 계약을 그대로 따릅니다." },
  { question: "virtual thread의 daemon status는 무엇인가요?", answer: "virtual thread는 daemon이며 unfinished task를 main 종료가 기다릴 것이라 가정하면 안 됩니다." },
  { question: "virtual thread를 많이 만들면 DB connection도 무제한으로 써도 되나요?", answer: "아닙니다. downstream resource capacity는 semaphore·pool·rate limit으로 별도 제한해야 합니다." },
  { question: "virtual thread가 CPU-bound throughput도 자동으로 늘리나요?", answer: "아닙니다. CPU parallelism은 core 수와 workload를 측정해 제한된 executor를 선택하는 편이 적절합니다." },
);

(session.completionChecklist as string[]).push(
  "inventory4와 실행 보완 Ex12를 구분해 설명할 수 있다.",
  "class11 package24·inventory4·executable5·relocated5 warning0 evidence를 확인했다.",
  "relocated source5의 SHA-256이 원본과 같음을 확인했다.",
  "원본 daemon 실행의 i0~9 순서와 helper interleaving을 구분했다.",
  "원본 join 실행이 정확히59줄인 이유를 계산했다.",
  "daemon과 user thread의 JVM liveness 차이를 설명할 수 있다.",
  "daemon은 priority나 중요도 표지가 아님을 안다.",
  "setDaemon을 start 전에만 호출한다.",
  "daemon에 durable flush·commit·ack를 맡기지 않는다.",
  "남은 non-daemon thread로 process hang을 진단할 수 있다.",
  "join을 elapsed-time sleep과 구분한다.",
  "join의 termination synchronization을 설명할 수 있다.",
  "join happens-before로 plain result publication을 설명할 수 있다.",
  "join이 result와 failure를 자동 전달하지 않음을 안다.",
  "worker success·failure·cancelled channel을 별도로 둔다.",
  "timed join 반환 뒤 isAlive를 재확인한다.",
  "timeout을 task failure와 동일시하지 않는다.",
  "interrupt 뒤 final join으로 worker를 reap한다.",
  "resource ownership은 실제 termination 뒤에 넘긴다.",
  "monotonic absolute deadline에서 remaining budget을 계산한다.",
  "interrupt가 cooperative request임을 설명할 수 있다.",
  "interrupt()가 status를 설정함을 검증했다.",
  "isInterrupted가 status를 clear하지 않음을 검증했다.",
  "Thread.interrupted가 current status를 clear함을 검증했다.",
  "Thread.interrupted를 class 이름으로 호출한다.",
  "CPU loop에 cancellation checkpoint를 둔다.",
  "sleep·wait·join·await·take의 interruptible 성격을 구분한다.",
  "InterruptedException throw 때 status가 clear됨을 안다.",
  "catch에서 consume·propagate·restore 중 하나를 의식적으로 선택한다.",
  "전파할 수 있으면 InterruptedException을 그대로 전파한다.",
  "변환할 때 original cause를 보존한다.",
  "checked interruption을 삼키는 경계에서 flag를 복원한다.",
  "복원 뒤 interruptible cleanup의 즉시 실패 가능성을 고려한다.",
  "cancellation token에 reason·scope·deadline을 둔다.",
  "interrupt를 blocked worker wake-up signal로 사용한다.",
  "token만으로 blocked take가 깨어나지 않음을 재현했다.",
  "interrupt만으로 업무 취소 reason을 추정하지 않는다.",
  "safe checkpoint를 domain invariant 경계에 둔다.",
  "한 controller가 token·interrupt ownership을 가진다.",
  "취소 요청과 terminated 상태를 분리 기록한다.",
  "Future를 task completion handle로 사용한다.",
  "cancel(false)와 cancel(true)의 차이를 설명할 수 있다.",
  "cancel(true)가 강제 종료 보장이 아님을 안다.",
  "Future cancellation과 worker interruption을 별도 확인한다.",
  "cancelled Future.get의 CancellationException을 처리한다.",
  "ExecutorService owner가 shutdown을 호출한다.",
  "shutdown 뒤 새 task 수락을 닫는다.",
  "grace period에 awaitTermination을 사용한다.",
  "deadline 뒤 shutdownNow로 running interrupt를 시도한다.",
  "shutdownNow 반환 미시작 tasks를 회수한다.",
  "accepted task terminal 합계 불변식을 검증한다.",
  "두 번째 awaitTermination으로 실제 종료를 확인한다.",
  "비협력 task의 격리·escalation 정책을 둔다.",
  "join이 worker unchecked failure를 전파하지 않음을 검증했다.",
  "direct Thread에는 UncaughtExceptionHandler를 설치할 수 있다.",
  "executor.submit failure는 Future에서 관찰한다.",
  "failure telemetry에서 민감 payload를 제거한다.",
  "Java21 virtual thread가 final API임을 안다.",
  "virtual thread도 explicit join·interrupt lifecycle이 필요함을 검증했다.",
  "virtual thread 수와 downstream resource concurrency limit을 분리한다.",
);
