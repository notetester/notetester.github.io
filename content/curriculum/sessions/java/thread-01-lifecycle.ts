import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); if (Test-Path -LiteralPath $root) { throw \"unexpected temp collision\" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root \"classes\"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw (\"javac failed or warned: \" + ($compiler -join [Environment]::NewLine)) }; Push-Location $root; try { & java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\"; if ($LASTEXITCODE -ne 0) { throw \"java failed\" } } finally { Pop-Location } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw \"unsafe cleanup\" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw \"cleanup failed\" } } }'";

const session = {
  schemaVersion: 2,
  inventoryIds: ["thread-01-lifecycle"],
  slug: "thread-01-lifecycle",
  courseId: "java",
  moduleId: "java-systems",
  order: 35,
  title: "Thread 수명주기·start/run·Runnable",
  subtitle: "원본 class11을 보존 감사하고, 호출 스택·상태 전이·실패 전파·Executor·Future·가상 스레드까지 결정적 실험으로 연결합니다.",
  level: "고급",
  estimatedMinutes: 1080,
  coreQuestion: "작업을 새 Java 스레드에서 정확히 한 번 실행하고, 완료·실패·취소를 관찰 가능하게 만들려면 수명주기와 API 계약을 어떻게 설계해야 할까요?",
  summary: "인벤토리 direct5인 class11 Ex01·Ex02·Ex04·Ex05·Ex07과 실행에 반드시 필요한 Ex03·Ex06을 함께 읽습니다. package24는 JDK21 -Xlint:all warning0이고 main11개이며, direct5만 떼어 compile하면 companion Task_B 두 class가 없어 정확히4 errors로 실패합니다. 따라서 실행 폐쇄7을 byte-identical owned temp copy로 옮겨 warning0 compile하고, Ex01의 여섯 행, Ex04의 main2+Thread subclass 작업60행, Ex07의 main2+Runnable 작업90행을 순서가 아닌 exact multiset과 thread name으로 두 launcher modes에서 검증합니다. Ex01의 start는 단지 같은 이름의 일반 method라 새 스레드를 만들지 않는다는 사실도 분리합니다. 그 위에 NEW→RUNNABLE→WAITING→TERMINATED 상태, run 직접 호출과 start 차이, Runnable 조합, join happens-before, interrupt 복원, one-shot start, uncaught failure, ExecutorService ownership, Future cancellation, CompletableFuture outcome, Java21 virtual thread와 관측성까지 확장합니다.",
  objectives: [
    "Thread object·실행 스레드·Runnable task를 서로 다른 개념으로 설명한다.",
    "run 직접 호출과 start가 만드는 호출 스택·thread identity 차이를 warning0 코드로 검증한다.",
    "NEW·RUNNABLE·BLOCKED·WAITING·TIMED_WAITING·TERMINATED가 관측 snapshot임을 설명한다.",
    "join 성공 반환이 제공하는 completion과 memory visibility 경계를 적용한다.",
    "interrupt를 강제 종료가 아닌 협력적 요청으로 처리하고 InterruptedException 뒤 정책적으로 복원한다.",
    "동일 Thread를 두 번 start할 수 없는 one-shot lifecycle과 실패 전달 경계를 다룬다.",
    "ExecutorService·Future·CompletableFuture에서 task와 execution resource lifecycle을 분리한다.",
    "virtual thread가 blocking task의 비용 모델을 바꾸지만 동시성 정확성은 대신 해결하지 않음을 설명한다.",
  ],
  prerequisites: [
    { title: "인터페이스와 구현 분리", reason: "Runnable을 작업 계약으로 보고 Thread/Executor를 실행 정책으로 분리하는 데 필요합니다.", sessionSlug: "oop-09-interface" },
    { title: "예외의 전달과 정리", reason: "worker failure·InterruptedException·executor close 정책을 손실 없이 전달하려면 예외 경계를 알아야 합니다.", sessionSlug: "core-02-exception" },
  ],
  keywords: ["Thread", "Runnable", "start", "run", "Thread.State", "NEW", "RUNNABLE", "WAITING", "TERMINATED", "join", "happens-before", "interrupt", "InterruptedException", "IllegalThreadStateException", "UncaughtExceptionHandler", "ExecutorService", "Future", "cancellation", "CompletableFuture", "virtual thread", "structured task lifetime", "observability"],
  chapters: [],
  lab: {
    title: "유실·중복·무한 대기 없이 종료되는 병렬 학습자료 생성기",
    scenario: "여러 문서 변환 작업을 동시에 실행하되 각 작업의 성공·실패·취소를 수집하고, 전체 제한 시간 뒤에도 JVM이 남지 않게 운영 계약을 만듭니다.",
    setup: ["성공·검증실패·예외·느린 작업 fixtures를 준비합니다.", "task id·thread name·시작/종료 시각·outcome을 담는 immutable result를 정의합니다.", "platform fixed pool과 virtual-thread-per-task executor를 같은 task corpus로 비교합니다."],
    steps: ["Runnable/Callable에서 입력과 mutable global state를 분리합니다.", "실행기를 명시적으로 생성하고 의미 있는 thread naming 또는 task correlation id를 둡니다.", "각 task에 bounded timeout·interrupt-aware blocking·cleanup finally를 적용합니다.", "Future/CompletionStage 결과를 submission order와 completion order 중 요구사항에 맞게 수집합니다.", "실패를 stdout stack trace로만 남기지 말고 typed outcome으로 main 경계에 전달합니다.", "새 작업 수락을 중단하고 graceful deadline 뒤 남은 작업에 cancellation을 요청합니다.", "await termination과 thread dump evidence로 non-daemon leak가 없음을 확인합니다.", "결과 count·unique task id·digest를 검증한 뒤에만 final artifact를 publish합니다."],
    expectedResult: ["모든 task가 success/failure/cancelled 중 정확히 하나로 귀결됩니다.", "interrupt를 삼킨 작업이 없고 deadline 뒤 executor가 TERMINATED입니다.", "출력 순서에 기대지 않아 반복 실행에서도 count와 digest가 같습니다.", "platform/virtual 실행 정책을 바꿔도 task 결과 계약은 유지됩니다."],
    cleanup: ["executor를 shutdown하고 bounded await 뒤 필요한 경우에만 shutdownNow를 사용합니다.", "owned temp와 partial artifact만 제거하고 기존 결과는 보존합니다.", "진단용 thread dump와 task outcome을 run id 아래 보관합니다."],
    extensions: ["Java Flight Recorder로 thread park·pinning·executor queue를 관찰합니다.", "blocking I/O task와 CPU-bound task를 분리해 concurrency limit를 비교합니다.", "StructuredTaskScope는 사용 JDK의 preview/stable 상태를 확인한 별도 실험에서만 적용합니다.", "fault injection으로 start 전·실행 중·결과 publish 중 실패를 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "같은 Runnable을 run과 start로 각각 실행해 thread identity와 상태를 출력하세요.", requirements: ["worker name을 직접 지정합니다.", "start 전 NEW와 join 후 TERMINATED를 확인합니다.", "worker 내부 결과는 shared mutable println 순서가 아니라 안전한 result holder로 전달합니다.", "warning0 compile과 exact output을 만듭니다."], hints: ["run은 일반 method call입니다.", "join 뒤에 결과를 읽습니다."], expectedOutcome: "main 호출 스택과 새 worker 호출 스택의 차이를 설명할 수 있습니다.", solutionOutline: ["direct invocation 결과를 먼저 저장합니다.", "새 Thread를 start·join한 뒤 결과를 비교합니다."] },
    { difficulty: "응용", prompt: "interrupt를 지원하는 bounded worker와 Future cancellation test를 작성하세요.", requirements: ["started latch로 race를 제거합니다.", "blocking call의 InterruptedException을 분류합니다.", "cleanup 뒤 interrupt status 복원 정책을 문서화합니다.", "cancel·get·executor termination을 모두 검증합니다.", "무한 sleep과 시간 추측 assertion을 사용하지 않습니다."], hints: ["interrupt는 boolean request와 blocking wake-up을 함께 제공합니다.", "Future.get은 CancellationException을 줄 수 있습니다."], expectedOutcome: "작업이 협력적으로 중단되고 실행기까지 종료되는 재현 가능한 테스트가 완성됩니다.", solutionOutline: ["진입 handshake 뒤 cancel(true)를 호출합니다.", "worker cleanup signal과 Future outcome을 각각 검증합니다."] },
    { difficulty: "설계", prompt: "수천 개 blocking 작업을 처리하는 platform/virtual thread 실행 정책을 비교 설계하세요.", requirements: ["동시 요청 제한과 외부 resource pool 한계를 명시합니다.", "task failure·timeout·cancellation·retry taxonomy를 만듭니다.", "ThreadLocal·pinning·monitor·native call 위험을 검토합니다.", "shutdown deadline·observability·thread dump·JFR evidence를 포함합니다.", "CPU-bound 작업은 별도 concurrency policy로 분리합니다.", "성능 주장을 warm-up·workload·percentile 측정과 연결합니다."], hints: ["가상 스레드는 무제한 외부 연결 허가가 아닙니다.", "task 수명과 요청 수명을 연결합니다."], expectedOutcome: "처리량뿐 아니라 실패 격리와 종료 가능성을 검증할 수 있는 운영 설계가 완성됩니다.", solutionOutline: ["workload/resource/trust boundary를 그립니다.", "동일 corpus로 executor별 결과·latency·resource evidence를 비교합니다."] },
  ],
  reviewQuestions: [],
  completionChecklist: [],
  nextSessions: ["thread-02-daemon-join-interrupt"],
  sources: [],
  sourceCoverage: {
    filesRead: 7,
    filesUsed: 7,
    uncoveredNotes: [
      "inventory direct5만 compile하면 Ex03_Task_B·Ex06_Task_B symbol4개가 없어 실패하므로 두 companion을 포함한 closure7을 실행 경계로 사용합니다.",
      "class11의 Ex08 이후 daemon·join·synchronized·wait/notify와 Study files는 thread-02~04의 별도 원본 범위이지만 package24 warning0 regression에는 포함합니다.",
      "원본의 scheduler-dependent 행 순서를 학습 정답으로 고정하지 않고 thread별 index0..29의 누락·중복과 identity를 검증합니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const originalAuditChapter: DetailedSession["chapters"][number] = {
  id: "class11-thread-inventory-closure-audit",
  title: "class11 package24·direct5 실패·closure7 실행을 원본 변경 없이 감사합니다",
  lead: "인벤토리와 실제 compile dependency를 구분하고, nondeterministic interleaving 대신 exact thread별 multiset을 두 launcher modes에서 증명합니다.",
  explanations: [
    "인벤토리는 Ex01_Thread, Ex02_Task_A, Ex04_Main, Ex05_Task_A, Ex07_Main 다섯 파일을 지목합니다. 그러나 Ex04가 Ex03_Task_B를, Ex07이 Ex06_Task_B를 직접 생성하므로 direct5는 독립 compile 단위가 아닙니다.",
    "direct5 compile은 Ex03와 Ex06의 type·constructor 각 두 지점에서 compiler.err.cant.resolve.location 네 건과 마지막 4 errors를 냅니다. 이 실패도 숨기지 않는 원본 증거입니다.",
    "closure7과 class11 package24는 OpenJDK21 --release21 -Xlint:all에서 compiler output0, warning0입니다. package에는 public main이11개이고 closure에는 Ex01·Ex04·Ex07 세 main이 있습니다.",
    "Ex01_Thread의 start는 Thread.start override가 아니라 Ex01_Thread에 선언한 평범한 method입니다. play와 start를 포함한 여섯 출력 행은 모두 main thread에서 실행됩니다.",
    "Ex02·Ex03은 Thread를 상속하고 run을 override합니다. Ex04가 각 객체를 start하면 기본 이름 Thread-0과 Thread-1의 새 호출 스택에서 AAAR·BBBR index0..29가 각각 정확히 한 번 실행됩니다.",
    "Ex05·Ex06은 Runnable만 구현합니다. Ex07은 두 task를 Thread constructor에 넘기고 anonymous Runnable 하나를 더 만들어 Thread-0/1/2에서 AAAR·BBBR·MAINR 각30행을 실행합니다.",
    "main의 수고하셨습니다는 worker 완료 의미가 아닙니다. main이 join하지 않았기 때문에 scheduler에 따라 task 행 전·중간에 보일 수 있지만, worker가 non-daemon이므로 세 worker가 끝나기 전 JVM process는 종료되지 않습니다.",
    "출력 interleaving을 한 문자열로 고정하면 올바른 실행도 실패합니다. 감사기는 total line count, main markers, prefix별 index set, thread name을 검사하여 허용 가능한 모든 순서를 포괄합니다.",
    "원본 seven files는 read-only입니다. byte-identical copy만 공백 포함 owned temp source tree에 만들고 hash7이 동일한지 확인한 뒤 relocated classes를 실행합니다.",
    "stdout/stderr를 동시에 drain하고 child마다10초 timeout·process-tree kill·5초 grace를 둡니다. JDK launcher variables4는 child에서 제거하고 parent의 존재·값을 finally에서 복원합니다.",
  ],
  concepts: [
    { term: "inventory boundary", definition: "학습 표가 직접 지목한 파일 집합으로, 항상 독립 compile 단위라는 뜻은 아닙니다.", detail: ["direct5의 provenance를 보존합니다.", "missing companion failure도 evidence입니다."] },
    { term: "execution closure", definition: "선택한 entry points를 compile·실행하는 데 필요한 source dependency까지 포함한 최소 집합입니다.", detail: ["여기서는 companion2를 더한 seven files입니다.", "package 전체와도 구분합니다."] },
    { term: "scheduler-independent oracle", definition: "전체 행 순서 대신 허용된 invariants와 per-task multiset을 검사하는 동시성 테스트 판정기입니다.", detail: ["누락·중복을 잡습니다.", "합법적인 interleaving을 오판하지 않습니다."] },
  ],
  codeExamples: [{
    id: "powershell-original-thread01-audit",
    title: "원본 direct failure와 closure 실행을 두 격리 모드에서 검증합니다",
    language: "powershell",
    filename: "verify-original-thread01.ps1",
    purpose: "원본 파일을 수정·실행하지 않고 package/direct/closure compile 증거와 세 main의 scheduler-independent 결과를 재현합니다.",
    code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$optionNames=@('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS')
$saved=@{}
foreach($name in $optionNames){
  $item=Get-Item -LiteralPath ("Env:"+$name) -ErrorAction SilentlyContinue
  $saved[$name]=@{Exists=$null-ne$item;Value=if($item){$item.Value}else{$null}}
}
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
$root=Join-Path $base ("thread01 audit "+[Guid]::NewGuid().ToString('N'))
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
    if(-not$process.WaitForExit(10000)){
      $process.Kill($true);if(-not$process.WaitForExit(5000)){throw 'termination grace exceeded'}
      [void]$outTask.GetAwaiter().GetResult();[void]$errTask.GetAwaiter().GetResult();throw 'child timeout'
    }
    return @{Exit=$process.ExitCode;Out=(Normalize $outTask.GetAwaiter().GetResult());Err=(Normalize $errTask.GetAwaiter().GetResult())}
  }finally{$process.Dispose()}
}
function Javac-Args([IO.FileInfo[]]$files,[string]$classes){
  return @('-J-Duser.language=en','-J-Duser.country=US','-encoding','UTF-8','--release','21','-proc:none','-Xlint:all','-XDrawDiagnostics','-d',$classes)+@($files.FullName)
}
function Compile-Success([IO.FileInfo[]]$files,[string]$classes){
  New-Item -ItemType Directory -Path $classes -ErrorAction Stop|Out-Null
  $result=Invoke-Child 'javac' (Javac-Args $files $classes) $root
  if($result.Exit-ne0-or$result.Out.Length-ne0-or$result.Err.Length-ne0){throw 'warning0 compile drift'}
}
function Compile-DirectFailure([IO.FileInfo[]]$files,[string]$classes){
  New-Item -ItemType Directory -Path $classes -ErrorAction Stop|Out-Null
  $result=Invoke-Child 'javac' (Javac-Args $files $classes) $root
  $lines=@($result.Err.TrimEnd([char]10).Split([char]10))
  if($result.Exit-ne1-or$result.Out.Length-ne0-or$lines.Count-ne5){throw 'direct failure shape drift'}
  if(@($lines|Where-Object{$_-match'compiler\.err\.cant\.resolve\.location'}).Count-ne4-or$lines[-1]-cne'4 errors'){throw 'direct diagnostics drift'}
}
function Run-Main([string]$classes,[string]$main){
  $result=Invoke-Child 'java' @('-Dfile.encoding=UTF-8','-cp',$classes,$main) $root
  if($result.Exit-ne0-or$result.Err.Length-ne0){throw "$main process drift"}
  return @($result.Out.TrimEnd([char]10).Split([char]10))
}
function Assert-Indexed([string[]]$lines,[string]$prefix,[string]$thread){
  $matched=@($lines|Where-Object{$_-match('^'+$prefix+'\(\d+\) : '+[regex]::Escape($thread)+'$')})
  if($matched.Count-ne30){throw "$prefix count drift"}
  $indices=@($matched|ForEach-Object{if($_-notmatch'^\D+\((\d+)\)'){throw 'index parse drift'};[int]$Matches[1]}|Sort-Object)
  if(($indices-join',')-cne((0..29)-join',')){throw "$prefix index drift"}
}
function Assert-OriginalRuns([string]$classes){
  $ex01=Run-Main $classes 'com.java.class11.Ex01_Thread'
  $expected01=@('1 : main','2 : main','3 : main','4 : main','5 : main','수고하셨습니다.')
  if(($ex01-join$nl)-cne($expected01-join$nl)){throw 'Ex01 output drift'}
  $ex04=Run-Main $classes 'com.java.class11.Ex04_Main'
  if($ex04.Count-ne62-or$ex04[0]-cne'main : main'-or@($ex04|Where-Object{$_-ceq'수고하셨습니다.'}).Count-ne1){throw 'Ex04 markers drift'}
  Assert-Indexed $ex04 'AAAR' 'Thread-0';Assert-Indexed $ex04 'BBBR' 'Thread-1'
  $ex07=Run-Main $classes 'com.java.class11.Ex07_Main'
  if($ex07.Count-ne92-or$ex07[0]-cne'main : main'-or@($ex07|Where-Object{$_-ceq'수고하셨습니다.'}).Count-ne1){throw 'Ex07 markers drift'}
  Assert-Indexed $ex07 'AAAR' 'Thread-0';Assert-Indexed $ex07 'BBBR' 'Thread-1';Assert-Indexed $ex07 'MAINR' 'Thread-2'
}
function Remove-JavaComments([string]$text){return [regex]::Replace(([regex]::Replace($text,'(?s)/\*.*?\*/','')),'(?m)//.*$','')}
function Audit([string]$mode,[string]$class11){
  if($mode-eq'hostile'){
    $env:JDK_JAVAC_OPTIONS='-J-Dthread01.audit=javac';$env:JDK_JAVA_OPTIONS='-Dthread01.audit=java'
    $env:JAVA_TOOL_OPTIONS='-Dthread01.audit=tool';$env:_JAVA_OPTIONS='-Dthread01.audit=legacy'
  }else{foreach($name in $optionNames){Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue}}
  $package=@(Get-ChildItem -LiteralPath $class11 -Filter '*.java'|Sort-Object Name)
  $directNames=@('Ex01_Thread.java','Ex02_Task_A.java','Ex04_Main.java','Ex05_Task_A.java','Ex07_Main.java')
  $closureNames=@('Ex01_Thread.java','Ex02_Task_A.java','Ex03_Task_B.java','Ex04_Main.java','Ex05_Task_A.java','Ex06_Task_B.java','Ex07_Main.java')
  $direct=@($directNames|ForEach-Object{Get-Item -LiteralPath (Join-Path $class11 $_)})
  $closure=@($closureNames|ForEach-Object{Get-Item -LiteralPath (Join-Path $class11 $_)})
  if($package.Count-ne24-or$direct.Count-ne5-or$closure.Count-ne7){throw 'inventory drift'}
  $mainPattern='public\s+static\s+void\s+main\s*\('
  if(@($package|Where-Object{[IO.File]::ReadAllText($_.FullName)-match$mainPattern}).Count-ne11){throw 'package main drift'}
  if(@($closure|Where-Object{[IO.File]::ReadAllText($_.FullName)-match$mainPattern}).Count-ne3){throw 'closure main drift'}
  Compile-Success $package (Join-Path $root ("package-"+$mode))
  Compile-DirectFailure $direct (Join-Path $root ("direct-"+$mode))

  $copyDir=Join-Path $root ("source-"+$mode+'\com\java\class11');New-Item -ItemType Directory -Path $copyDir -ErrorAction Stop|Out-Null
  foreach($file in $closure){
    $copy=Join-Path $copyDir $file.Name;[IO.File]::Copy($file.FullName,$copy,$false)
    if((Get-FileHash -Algorithm SHA256 -LiteralPath $file.FullName).Hash-cne(Get-FileHash -Algorithm SHA256 -LiteralPath $copy).Hash){throw 'copy hash drift'}
  }
  $relocated=@(Get-ChildItem -LiteralPath $copyDir -Filter '*.java'|Sort-Object Name)
  $classes=Join-Path $root ("relocated-"+$mode);Compile-Success $relocated $classes;Assert-OriginalRuns $classes
  $joined=($relocated|ForEach-Object{Remove-JavaComments([IO.File]::ReadAllText($_.FullName))})-join$nl
  $shape=[ordered]@{
    extendsThread=([regex]::Matches($joined,'extends\s+Thread\b')).Count;runnable=([regex]::Matches($joined,'implements\s+Runnable\b')).Count
    newThread=([regex]::Matches($joined,'new\s+Thread\s*\(')).Count;startCalls=([regex]::Matches($joined,'\.start\s*\(')).Count
    runDeclarations=([regex]::Matches($joined,'void\s+run\s*\(')).Count;currentThread=([regex]::Matches($joined,'Thread\.currentThread\s*\(')).Count
    loops=([regex]::Matches($joined,'for\s*\(')).Count;plainStart=([regex]::Matches($joined,'public\s+void\s+start\s*\(')).Count
  }
  if(($shape.Values-join',')-cne'2,2,3,6,5,12,5,1'){throw 'source shape drift'}
  return 'package=24,warnings=0,mains=11|direct=5,errors=4,missing=Ex03+Ex06|closure=7,warnings=0,mains=3|runs=Ex01:6main;Ex04:62,AAAR30@Thread-0,BBBR30@Thread-1;Ex07:92,AAAR30@Thread-0,BBBR30@Thread-1,MAINR30@Thread-2|shapes=extendsThread:2|Runnable:2|newThread:3|startCalls:6|runDecl:5|currentThread:12|loops:5|plainStart:1|hashes:7same'
}

try{
  if(Test-Path -LiteralPath $root){throw 'unexpected temp collision'}
  New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null;$ownsRoot=$true
  $source=[IO.Path]::GetFullPath($SourceRoot);$class11=Join-Path $source 'src/com/java/class11'
  $baseline=Audit 'baseline' $class11;$hostile=Audit 'hostile' $class11
  if($baseline-cne$hostile){throw 'baseline hostile drift'}
  "spacePath=$($root.Contains(' ')),modes=2|same=True,$baseline"
  'privacy=original-sources:read-only|network:none|fixture:owned-temp-copy;launcherOptions=4'
}catch{$bodyError=$_.Exception}finally{
  $finalErrors=[Collections.Generic.List[Exception]]::new()
  foreach($name in $optionNames){
    try{
      if($saved[$name].Exists){
        Set-Item -LiteralPath ("Env:"+$name)-Value $saved[$name].Value -ErrorAction Stop
        $restored=Get-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue
        if($null-eq$restored-or$restored.Value-cne$saved[$name].Value){throw "launcher restore failed: $name"}
      }else{Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue;if(Test-Path -LiteralPath ("Env:"+$name)){throw "launcher absence failed: $name"}}
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
      { lines: "1-11", explanation: "launcher options4의 존재·값과 공백 포함 owned temp root, cleanup error state를 준비합니다." },
      { lines: "13-31", explanation: "argument list, clean child environment, concurrent pipe drain,10초 timeout과 process-tree kill을 갖춘 launcher를 정의합니다." },
      { lines: "32-46", explanation: "warning0 compile과 direct5의 four missing-symbol diagnostics를 서로 다른 oracle로 검증합니다." },
      { lines: "47-68", explanation: "세 main을 실행하고 Ex04/07의 scheduler-independent prefix·index·thread multiset을 검사합니다." },
      { lines: "69-85", explanation: "package24·direct5·closure7과 main counts를 검증하고 package/direct compile evidence를 수집합니다." },
      { lines: "87-93", explanation: "closure7을 owned temp package tree에 byte-identical 복사하고 hash7·relocated warning0를 확인합니다." },
      { lines: "94-103", explanation: "comments를 제외한 Thread/Runnable/start/run source shape와 stable summary를 고정합니다." },
      { lines: "105-135", explanation: "baseline/hostile 결과를 비교하고 parent launcher state와 direct-child temp ownership을 복원합니다." },
    ],
    run: { environment: ["PowerShell 7+ on Windows", "OpenJDK 21", "javastudy2/classstudy source root", "baseline+hostile launcher modes", "owned temp copy only"], command: "pwsh -NoProfile -File verify-original-thread01.ps1 -SourceRoot <classstudy-root>" },
    output: {
      value: "spacePath=True,modes=2|same=True,package=24,warnings=0,mains=11|direct=5,errors=4,missing=Ex03+Ex06|closure=7,warnings=0,mains=3|runs=Ex01:6main;Ex04:62,AAAR30@Thread-0,BBBR30@Thread-1;Ex07:92,AAAR30@Thread-0,BBBR30@Thread-1,MAINR30@Thread-2|shapes=extendsThread:2|Runnable:2|newThread:3|startCalls:6|runDecl:5|currentThread:12|loops:5|plainStart:1|hashes:7same\nprivacy=original-sources:read-only|network:none|fixture:owned-temp-copy;launcherOptions=4",
      explanation: ["direct5의 dependency failure와 closure7 warning0를 모두 보존합니다.", "행 순서가 아니라 각 worker의 exact index set과 thread identity를 검증합니다.", "원본은 read-only이고 외부 경로·network를 사용하지 않습니다."],
    },
    experiments: [
      { change: "Ex04의 taskA.start()를 taskA.run()으로 바꾼 copy를 실행합니다.", prediction: "AAAR30은 main thread에서 먼저 끝난 뒤 BBBR worker와 완료 marker가 나타납니다.", result: "새 호출 스택 생성 여부는 method 이름이 아니라 Thread.start 계약으로 구분합니다." },
      { change: "Ex07의 각 start 뒤 join을 추가합니다.", prediction: "task groups가 submission 순서로 완료되어 interleaving이 사라지지만 concurrency도 사라집니다.", result: "결정적 출력만을 위해 불필요한 직렬화를 도입하지 않습니다." },
      { change: "oracle을 전체 stdout 문자열 비교로 바꿉니다.", prediction: "합법적인 scheduler interleaving 때문에 반복 실행이 간헐적으로 실패합니다.", result: "concurrency test는 partial order와 invariant를 판정합니다." },
    ],
    sourceRefs: ["java-class11-ex01", "java-class11-ex02", "java-class11-ex03", "java-class11-ex04", "java-class11-ex05", "java-class11-ex06", "java-class11-ex07", "jdk21-javac", "powershell-environment", "powershell-get-file-hash", "dotnet-process-start-info", "dotnet-process", "dotnet-stream-reader-async", "java-thread", "java-runnable"],
  }],
  diagnostics: [
    { symptom: "인벤토리 five files만 javac에 넘기자 symbol4개를 찾지 못한다.", likelyCause: "Ex04와 Ex07이 인벤토리에 빠진 Ex03_Task_B·Ex06_Task_B를 참조합니다.", checks: ["cant.resolve.location의 class 이름을 봅니다.", "new expressions를 따라갑니다.", "package 전체와 closure compile을 비교합니다."], fix: "원본 provenance는 direct5로 남기고 실행에는 companion2를 포함한 closure7을 사용합니다.", prevention: "inventory generator가 compile dependency closure와 direct source를 별도 필드로 기록하게 합니다." },
    { symptom: "worker 출력 순서가 실행할 때마다 달라 exact snapshot test가 깨진다.", likelyCause: "start된 여러 runnable thread의 scheduling order는 보장되지 않습니다.", checks: ["각 prefix count를 셉니다.", "index 누락·중복을 봅니다.", "thread name과 total lines를 확인합니다."], fix: "전체 순서 대신 per-task multiset과 필요한 happens-before edge만 검증합니다.", prevention: "동시성 테스트 oracle에 허용 순서와 금지 상태를 명시합니다." },
  ],
  expertNotes: ["Default thread names are useful as a fixture fact in fresh JVMs, but production correlation should use explicit semantic names or task identifiers.", "A JVM waits for live non-daemon threads after main returns; that process-liveness fact does not mean main observed worker success."],
};

(session.chapters as DetailedSession["chapters"]).push(originalAuditChapter);

const identityAndStateChapters: DetailedSession["chapters"] = [
  {
    id: "run-call-versus-thread-start-identity",
    title: "run은 현재 호출 스택, start는 새 실행 스레드를 만듭니다",
    lead: "같은 Runnable이라도 run을 직접 부르면 일반 method call이고, Thread.start를 호출해야 JVM이 새 스레드를 시작해 그 안에서 run을 호출합니다.",
    explanations: [
      "Runnable.run에는 새 스레드를 만드는 기능이 없습니다. main이 task.run()을 호출하면 call stack과 thread identity는 그대로 main입니다.",
      "Thread.start는 NEW 상태의 Thread를 scheduler에 제출하고 새 실행 스레드가 run을 호출하도록 합니다. start가 반환했을 때 run이 끝났다는 보장은 없습니다.",
      "Thread object는 실행을 제어하는 handle이고 Runnable은 수행할 task입니다. 두 역할을 분리하면 동일 task를 다른 이름·priority·executor 정책으로 실행할 수 있습니다.",
      "getState는 순간 snapshot입니다. NEW와 join 뒤 TERMINATED는 handshake 때문에 안정적으로 관찰할 수 있지만 RUNNABLE을 특정 시점의 영구 상태처럼 해석하면 안 됩니다.",
      "join은 worker 완료를 기다립니다. 이 예제는 join 뒤에 AtomicReference를 읽어 output을 결정하므로 println interleaving에 기대지 않습니다.",
      "원본 Ex01의 demo.start()가 main에서 실행된 이유는 demo가 Thread가 아니라 Ex01_Thread이고 그 start가 평범한 instance method이기 때문입니다.",
    ],
    concepts: [
      { term: "direct invocation", definition: "호출자가 같은 thread와 stack에서 method body를 실행하는 일반 호출입니다.", detail: ["run도 예외가 아닙니다.", "호출자가 return까지 기다립니다."], analogy: "새 직원을 부르는 것이 아니라 내가 직접 작업 체크리스트를 수행하는 것과 같습니다." },
      { term: "start contract", definition: "NEW Thread를 한 번 시작하여 새 execution context에서 run을 호출하게 하는 JVM 계약입니다.", detail: ["asynchronous completion입니다.", "두 번째 start는 불법입니다."] },
      { term: "thread identity", definition: "현재 코드를 실제 실행 중인 Thread instance의 identity와 name입니다.", detail: ["Thread.currentThread로 얻습니다.", "task object identity와 다릅니다."] },
    ],
    codeExamples: [{
      id: "java-start-versus-run-identity",
      title: "같은 Runnable의 direct와 started identity를 비교합니다",
      language: "java",
      filename: "StartVsRunIdentity.java",
      purpose: "출력 순서 추측 없이 direct call·NEW·worker identity·TERMINATED를 정확히 검증합니다.",
      code: String.raw`import java.util.concurrent.atomic.AtomicReference;

public class StartVsRunIdentity {
    public static void main(String[] args) throws InterruptedException {
        AtomicReference<String> observed = new AtomicReference<>();
        Runnable task = () -> observed.set(Thread.currentThread().getName());

        task.run();
        String direct = observed.get();

        Thread worker = new Thread(task, "worker-1");
        Thread.State before = worker.getState();
        worker.start();
        worker.join();

        System.out.println("direct=" + direct);
        System.out.println("before=" + before);
        System.out.println("started=" + observed.get());
        System.out.println("after=" + worker.getState());
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "worker가 관측한 name을 안전하게 전달할 AtomicReference와 동일 Runnable을 만듭니다." },
        { lines: "8-9", explanation: "run을 main에서 직접 호출하고 return 뒤 main identity를 저장합니다." },
        { lines: "11-14", explanation: "명시 이름의 Thread가 NEW임을 저장하고 start·join으로 완료 edge를 만듭니다." },
        { lines: "16-19", explanation: "direct/main, before/NEW, started/worker-1, after/TERMINATED를 안정된 시점에 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "fresh JVM main thread", "-Xlint:all warning0"], command: isolatedJavaRun("StartVsRunIdentity.java", "StartVsRunIdentity") },
      output: { value: "direct=main\nbefore=NEW\nstarted=worker-1\nafter=TERMINATED", explanation: ["run 직접 호출은 main identity를 유지합니다.", "start된 task만 worker-1에서 실행됩니다.", "join 뒤 state는 TERMINATED입니다."] },
      experiments: [
        { change: "worker.start() 대신 worker.run()을 호출합니다.", prediction: "started도 main이고 state는 계속 NEW입니다.", result: "run은 Thread lifecycle을 시작하지 않습니다." },
        { change: "join을 제거하고 observed를 즉시 읽습니다.", prediction: "main 또는 worker-1 중 어느 값인지 timing에 의존합니다.", result: "비동기 결과에는 명시적인 completion edge가 필요합니다." },
        { change: "worker 이름을 생략합니다.", prediction: "fresh JVM에서는 Thread-0 같은 구현 지정 기본 이름이 보이지만 업무 의미는 없습니다.", result: "운영 task에는 semantic name 또는 correlation id를 둡니다." },
      ],
      sourceRefs: ["java-thread", "java-runnable", "java-thread-state", "java-atomic-reference", "jls-17-threads-locks"],
    }],
    diagnostics: [
      { symptom: "task.run()을 호출했는데 병렬 실행되지 않는다.", likelyCause: "run을 현재 스레드에서 직접 호출했습니다.", checks: ["Thread.currentThread name을 기록합니다.", "Thread.start call site를 찾습니다.", "Thread object state를 봅니다."], fix: "새 Thread의 start 또는 요구에 맞는 Executor를 사용합니다.", prevention: "task 정의와 execution policy를 API 이름·테스트에서 구분합니다." },
      { symptom: "start 직후 result가 null이거나 이전 값이다.", likelyCause: "start는 완료를 기다리지 않으며 결과 read에 completion edge가 없습니다.", checks: ["join/Future.get이 있는지 봅니다.", "result holder의 visibility 계약을 봅니다.", "worker failure도 수집합니다."], fix: "join·Future·CompletionStage 등 명시 completion primitive로 결과를 전달합니다.", prevention: "비동기 method의 완료·실패 contract를 return type에 드러냅니다." },
    ],
    comparisons: [{ title: "실행 진입 방식", options: [
      { name: "Runnable.run", chooseWhen: "현재 스레드에서 동기적으로 같은 task logic을 호출할 때", avoidWhen: "새 스레드·동시 실행이 필요할 때", tradeoffs: ["단순한 일반 호출", "Thread lifecycle 없음"] },
      { name: "Thread.start", chooseWhen: "한 개 Thread lifecycle을 직접 제어·학습할 때", avoidWhen: "많은 task의 pooling·backpressure가 필요할 때", tradeoffs: ["명시 thread handle", "one-shot이고 자원 정책을 직접 책임"] },
      { name: "Executor.submit", chooseWhen: "task 제출과 worker 관리를 분리할 때", avoidWhen: "executor lifecycle owner가 불명확할 때", tradeoffs: ["Future outcome", "shutdown 책임"] },
    ] }],
    expertNotes: ["Thread.start establishes a happens-before edge from actions before start to actions in the started thread; join establishes another edge from worker actions to the successful join return."],
  },
  {
    id: "thread-state-machine-observable-snapshots",
    title: "상태는 수명주기 단계의 snapshot이며 handshake로만 결정적으로 관측합니다",
    lead: "Thread.State는 원인이나 진행률이 아니라 관측 순간의 VM 상태입니다. latch를 사용해 NEW·WAITING·TERMINATED의 안정 구간을 만듭니다.",
    explanations: [
      "NEW는 아직 start되지 않은 상태이고 TERMINATED는 run이 정상 또는 예외로 끝난 상태입니다. Thread instance는 TERMINATED에서 다시 NEW로 돌아가지 않습니다.",
      "RUNNABLE은 Java 상태 모델에서 실제 CPU 실행과 OS runnable 대기를 함께 포함합니다. CPU를 점유 중이라는 뜻으로 단정할 수 없습니다.",
      "BLOCKED는 synchronized monitor 진입을 기다리는 상태, WAITING은 시간 제한 없는 Object.wait/join/park 계열 대기, TIMED_WAITING은 sleep·timed wait·timed join 등 시간 제한 대기입니다.",
      "CountDownLatch.await는 count가0이 될 때까지 WAITING할 수 있습니다. worker가 entered를 countDown한 뒤 release를 기다리게 하여 main이 WAITING snapshot을 확인할 창을 만듭니다.",
      "상태 polling 자체는 일반 coordination primitive가 아닙니다. 이 예제에서는 교육용 관측만 하고 실제 진행 제어는 두 latch와 join이 담당합니다.",
      "thread dump에서는 state뿐 아니라 stack frame·lock owner·task correlation을 함께 읽어야 원인을 추정할 수 있습니다.",
    ],
    concepts: [
      { term: "Thread.State", definition: "JVM이 노출하는 six-state enum의 순간 관측값입니다.", detail: ["NEW/RUNNABLE/BLOCKED/WAITING/TIMED_WAITING/TERMINATED", "진행률 metric은 아닙니다."] },
      { term: "handshake", definition: "두 실행 흐름이 특정 milestone 도달을 신호로 확인하는 동기화 패턴입니다.", detail: ["시간 추측 sleep을 대체합니다.", "latch countDown/await를 사용할 수 있습니다."] },
      { term: "parked wait", definition: "조건이 충족될 때까지 thread가 실행 자격을 내려놓고 기다리는 상태입니다.", detail: ["busy spin과 다릅니다.", "깨우는 조건과 종료 경로가 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-deterministic-thread-states",
      title: "latch로 NEW·WAITING·TERMINATED 관측 구간을 만듭니다",
      language: "java",
      filename: "DeterministicThreadStates.java",
      purpose: "sleep duration 추측 없이 세 lifecycle state를 정확히 확인합니다.",
      code: String.raw`import java.util.concurrent.CountDownLatch;

public class DeterministicThreadStates {
    private static void awaitState(Thread thread, Thread.State expected) {
        long deadline = System.nanoTime() + 5_000_000_000L;
        while (thread.getState() != expected) {
            if (System.nanoTime() >= deadline || !thread.isAlive()) {
                throw new IllegalStateException("state=" + thread.getState());
            }
            Thread.onSpinWait();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        Thread worker = new Thread(() -> {
            entered.countDown();
            try {
                release.await();
            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(error);
            }
        }, "state-worker");

        Thread.State initial = worker.getState();
        worker.start();
        entered.await();
        awaitState(worker, Thread.State.WAITING);
        Thread.State parked = worker.getState();
        release.countDown();
        worker.join();

        System.out.println("initial=" + initial);
        System.out.println("parked=" + parked);
        System.out.println("final=" + worker.getState());
    }
}`,
      walkthrough: [
        { lines: "1-12", explanation: "관측을5초로 제한하고 target state 전 worker 종료까지 실패로 분류하는 교육용 polling helper를 둡니다." },
        { lines: "14-25", explanation: "entered/release handshake와 interrupt 보존을 가진 worker를 정의합니다." },
        { lines: "27-33", explanation: "NEW를 저장한 뒤 start, 진입 확인, WAITING 관측, release와 join 순서로 안정 구간을 만듭니다." },
        { lines: "35-37", explanation: "세 snapshot을 worker와 경쟁하지 않는 시점에 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "CountDownLatch handshake", "bounded state observation", "-Xlint:all warning0"], command: isolatedJavaRun("DeterministicThreadStates.java", "DeterministicThreadStates") },
      output: { value: "initial=NEW\nparked=WAITING\nfinal=TERMINATED", explanation: ["start 전 NEW입니다.", "release count가1인 await에서 WAITING입니다.", "release와 join 뒤 TERMINATED입니다."] },
      experiments: [
        { change: "release.await를 Thread.sleep으로 바꿉니다.", prediction: "대기 중 snapshot은 TIMED_WAITING이 됩니다.", result: "대기 primitive가 state 분류에 반영됩니다." },
        { change: "awaitState 대신 Thread.sleep(10) 뒤 state를 읽습니다.", prediction: "느리거나 과부하인 환경에서 RUNNABLE을 읽는 flaky test가 됩니다.", result: "시간 지연은 milestone handshake가 아닙니다." },
        { change: "release.countDown을 제거합니다.", prediction: "worker가 WAITING에 남아 join이 끝나지 않습니다.", result: "모든 대기에는 성공·실패·취소·shutdown 해제 경로가 필요합니다." },
      ],
      sourceRefs: ["java-thread", "java-thread-state", "java-count-down-latch", "java-system-nano-time", "jls-17-threads-locks"],
    }],
    diagnostics: [
      { symptom: "state test가 가끔 RUNNABLE을 보고 실패한다.", likelyCause: "sleep으로 worker 진입 시점을 추측하거나 상태 전이의 짧은 구간을 읽었습니다.", checks: ["milestone latch가 있는지 봅니다.", "getState와 task event timestamp를 함께 봅니다.", "test host 부하를 확인합니다."], fix: "state를 안정시키는 controlled blocking fixture와 bounded handshake를 사용합니다.", prevention: "wall-clock sleep 기반 concurrency assertion을 금지합니다." },
      { symptom: "join이 영원히 끝나지 않고 WAITING worker가 남는다.", likelyCause: "release/cancellation/shutdown path가 빠졌거나 signal 전에 exception이 났습니다.", checks: ["thread dump stack을 봅니다.", "latch count와 owner를 확인합니다.", "signal을 finally에서 보장하는지 봅니다."], fix: "bounded wait·finally release·interrupt handling과 실패 전달을 추가합니다.", prevention: "각 blocking point에 unblock owner와 deadline을 문서화합니다." },
    ],
    comparisons: [{ title: "Java thread wait states", options: [
      { name: "BLOCKED", chooseWhen: "monitor 소유자가 synchronized 진입을 막는 원인을 설명할 때", avoidWhen: "Lock/condition이나 I/O wait를 모두 BLOCKED라 부를 때", tradeoffs: ["monitor contention에 특화", "owner stack과 함께 봐야 함"] },
      { name: "WAITING", chooseWhen: "무기한 wait/join/park 계열을 분류할 때", avoidWhen: "deadline이 필요한 운영 대기를 무기한 둘 때", tradeoffs: ["CPU busy loop 방지", "명시 wake-up 경로 필요"] },
      { name: "TIMED_WAITING", chooseWhen: "sleep 또는 timed wait/join을 분류할 때", avoidWhen: "timeout만으로 task cancellation이 완료됐다고 볼 때", tradeoffs: ["bounded wake-up 가능", "deadline 뒤 처리 정책 필요"] },
    ] }],
    expertNotes: ["Thread state sampling is lossy observability. For incident analysis, correlate repeated samples with stack traces, monitor ownership, executor queues, and task-level events."],
  },
  {
    id: "runnable-task-reuse-and-execution-policy",
    title: "Runnable은 작업을 표현하고 Thread는 실행 정책과 수명주기를 제공합니다",
    lead: "상속으로 task와 thread를 결합하지 않고 동일 Runnable을 여러 명시 이름의 Thread에 전달해 composition의 이점을 확인합니다.",
    explanations: [
      "Thread subclass는 task와 execution mechanism을 한 type에 묶습니다. Runnable composition은 이미 다른 superclass가 있는 객체도 task가 될 수 있고 executor로 옮기기 쉽습니다.",
      "같은 Runnable instance를 여러 thread가 동시에 호출할 수 있으므로 task 내부 mutable state는 자동으로 안전해지지 않습니다. 예제는 AtomicInteger와 ConcurrentSkipListSet을 명시적으로 사용합니다.",
      "두 worker의 전체 출력 순서를 snapshot하지 않고 join 뒤 sorted set을 읽습니다. worker 이름과 call count만 task contract로 삼습니다.",
      "Thread name은 진단 도구에 보이지만 globally unique business id는 아닙니다. request/task id는 structured log context에 별도로 넣습니다.",
      "작업이 반복 실행 가능한지 one-shot인지 문서화해야 합니다. Runnable type 자체는 idempotency·reentrancy·thread safety를 보장하지 않습니다.",
      "실무의 대량 task에는 Thread를 매번 직접 생성하기보다 lifecycle owner가 분명한 ExecutorService 또는 virtual-thread-per-task executor를 선택합니다.",
    ],
    concepts: [
      { term: "task/executor separation", definition: "무엇을 할지와 어느 thread·queue·lifecycle에서 실행할지를 분리하는 설계입니다.", detail: ["Runnable/Callable이 task입니다.", "Thread/Executor가 execution policy입니다."] },
      { term: "reentrancy", definition: "같은 callable object가 이전 호출이 끝나기 전 다시 호출되어도 올바르게 동작하는 성질입니다.", detail: ["Runnable이 자동 보장하지 않습니다.", "shared fields를 감사해야 합니다."] },
      { term: "idempotency", definition: "같은 logical 작업을 다시 실행해도 외부 결과가 중복되지 않는 성질입니다.", detail: ["thread safety와 다른 축입니다.", "retry 설계에서 중요합니다."] },
    ],
    codeExamples: [{
      id: "java-runnable-composition-reuse",
      title: "동일 Runnable을 두 Thread에 조합하고 결과를 안정적으로 수집합니다",
      language: "java",
      filename: "RunnableComposition.java",
      purpose: "task reuse가 가능하지만 shared state에는 별도 concurrency contract가 필요함을 보여 줍니다.",
      code: String.raw`import java.util.Set;
import java.util.concurrent.ConcurrentSkipListSet;
import java.util.concurrent.atomic.AtomicInteger;

public class RunnableComposition {
    public static void main(String[] args) throws InterruptedException {
        AtomicInteger calls = new AtomicInteger();
        Set<String> workers = new ConcurrentSkipListSet<>();
        Runnable task = () -> {
            calls.incrementAndGet();
            workers.add(Thread.currentThread().getName());
        };

        Thread first = new Thread(task, "worker-a");
        Thread second = new Thread(task, "worker-b");
        first.start();
        second.start();
        first.join();
        second.join();

        System.out.println("calls=" + calls.get());
        System.out.println("workers=" + String.join(",", workers));
        System.out.println("terminated="
                + (first.getState() == Thread.State.TERMINATED
                && second.getState() == Thread.State.TERMINATED));
    }
}`,
      walkthrough: [
        { lines: "1-12", explanation: "concurrent calls와 정렬된 thread names를 안전하게 수집하는 동일 Runnable을 정의합니다." },
        { lines: "14-19", explanation: "task instance 하나를 의미 있는 이름의 두 Thread에 조합하고 동시에 start한 뒤 모두 join합니다." },
        { lines: "21-25", explanation: "join 뒤 count2, sorted names, 두 TERMINATED 상태를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "two platform threads", "concurrent collections", "-Xlint:all warning0"], command: isolatedJavaRun("RunnableComposition.java", "RunnableComposition") },
      output: { value: "calls=2\nworkers=worker-a,worker-b\nterminated=true", explanation: ["동일 task body가 두 번 실행됩니다.", "set 정렬로 scheduler 순서를 제거합니다.", "join 뒤 두 worker가 모두 종료됐습니다."] },
      experiments: [
        { change: "AtomicInteger를 int field의 ++로 바꿔 많은 thread에서 반복합니다.", prediction: "read-modify-write race로 증가가 유실될 수 있습니다.", result: "Runnable reuse는 shared state 안전성을 보장하지 않습니다." },
        { change: "ConcurrentSkipListSet을 ArrayList로 바꿉니다.", prediction: "concurrent add가 data race가 되어 누락·구조 손상이 가능해집니다.", result: "result collector에도 명시 concurrency policy가 필요합니다." },
        { change: "같은 task를 ExecutorService에 submit합니다.", prediction: "task 코드는 유지되고 thread creation·reuse·shutdown 정책만 이동합니다.", result: "composition이 실행 정책 교체를 쉽게 합니다." },
      ],
      sourceRefs: ["java-runnable", "java-thread", "java-atomic-integer", "java-concurrent-skip-list-set", "java-set", "jls-17-threads-locks"],
    }],
    diagnostics: [
      { symptom: "같은 Runnable을 두 thread에서 실행하자 내부 counter가 작게 나온다.", likelyCause: "task instance field의 복합 갱신이 thread-safe하지 않습니다.", checks: ["shared mutable fields를 찾습니다.", "read-modify-write 연산을 분해합니다.", "Thread Sanitizer가 아니라 반복 invariant test와 설계를 봅니다."], fix: "ownership을 분리하거나 atomic/lock/immutable message를 사용합니다.", prevention: "Runnable의 reentrancy와 state ownership을 API 문서에 명시합니다." },
      { symptom: "Thread subclass라 다른 framework base class를 상속할 수 없다.", likelyCause: "Java single inheritance에서 task를 Thread inheritance에 결합했습니다.", checks: ["run body의 domain logic을 찾습니다.", "Thread-specific override가 실제 필요한지 봅니다.", "executor 이전 계획을 확인합니다."], fix: "domain task를 Runnable/Callable로 추출하고 Thread는 composition으로 주입합니다.", prevention: "상속보다 task interface와 execution service 경계를 우선합니다." },
    ],
    comparisons: [{ title: "작업 표현", options: [
      { name: "Thread subclass", chooseWhen: "Thread 자체 동작을 교육하거나 매우 제한적으로 customize할 때", avoidWhen: "domain task 재사용·다른 superclass·executor 이동이 필요할 때", tradeoffs: ["입문 시 직접적", "강한 결합과 one-shot object"] },
      { name: "Runnable", chooseWhen: "반환값 없는 task를 execution policy와 분리할 때", avoidWhen: "checked failure나 값 결과를 직접 전달해야 할 때", tradeoffs: ["composition 용이", "outcome channel 별도 필요"] },
      { name: "Callable", chooseWhen: "값 또는 checked failure를 Future로 전달할 때", avoidWhen: "fire-and-forget으로 failure를 잃을 때", tradeoffs: ["typed result", "Future/Executor lifecycle 필요"] },
    ] }],
    expertNotes: ["A stateless Runnable is often reusable, but reuse safety is a property of its captured object graph and side effects, not of the Runnable interface."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...identityAndStateChapters);

const completionAndInterruptionChapters: DetailedSession["chapters"] = [
  {
    id: "start-join-happens-before-and-result-publication",
    title: "start와 join은 실행 순서뿐 아니라 memory visibility 경계를 만듭니다",
    lead: "worker 시작 전 입력 publication과 join 성공 뒤 결과 publication은 Java Memory Model의 happens-before 관계로 설명할 수 있습니다.",
    explanations: [
      "main이 Thread.start 전에 수행한 action은 started thread의 action보다 happens-before입니다. 따라서 worker는 main이 먼저 설정한 input21을 볼 수 있습니다.",
      "worker의 모든 action은 다른 thread에서 그 worker에 대한 join이 성공적으로 반환한 뒤 action보다 happens-before입니다. main은 answer42와 ready true를 볼 수 있습니다.",
      "예제 field가 volatile도 Atomic도 아닌 것은 start/join edges 자체를 보여 주기 위해서입니다. join 전에 경쟁해서 읽는 순간 같은 code는 data race가 됩니다.",
      "happens-before는 wall-clock에서 단순히 먼저처럼 보인다는 뜻이 아니라 visibility와 ordering을 제공하는 formal relation입니다.",
      "join은 worker의 return value나 exception을 자동 전달하지 않습니다. 값 holder와 failure holder의 소유·publication 계약을 따로 설계해야 합니다.",
      "timed join이 timeout으로 돌아오면 completion edge를 얻은 것이 아닙니다. isAlive나 explicit outcome을 확인하고 cancellation/shutdown 정책으로 이어가야 합니다.",
    ],
    concepts: [
      { term: "happens-before", definition: "한 action의 effect가 다른 action에 보이고 순서화되도록 Java Memory Model이 정의한 관계입니다.", detail: ["실시간 timestamp 비교와 다릅니다.", "start/join/monitor/volatile 등에 규칙이 있습니다."] },
      { term: "safe publication", definition: "다른 thread가 object state를 초기화된 형태로 볼 수 있게 reference와 writes를 공개하는 것입니다.", detail: ["start 전 publication이 한 방법입니다.", "immutable object와 concurrent container도 사용합니다."] },
      { term: "completion edge", definition: "작업 종료를 관찰하고 그 작업의 결과 writes까지 읽을 수 있게 하는 synchronization 경계입니다.", detail: ["successful join이 제공합니다.", "Future.get도 결과 경계를 제공합니다."] },
    ],
    codeExamples: [{
      id: "java-start-join-visibility",
      title: "plain fields를 start 전 쓰고 join 뒤 읽습니다",
      language: "java",
      filename: "StartJoinVisibility.java",
      purpose: "volatile 없이도 start/join이 제공하는 두 happens-before edge를 좁은 fixture에서 증명합니다.",
      code: String.raw`public class StartJoinVisibility {
    private static final class Result {
        int input;
        int answer;
        boolean ready;
    }

    public static void main(String[] args) throws InterruptedException {
        Result result = new Result();
        result.input = 21;

        Thread worker = new Thread(() -> {
            result.answer = result.input * 2;
            result.ready = true;
        }, "calculator");

        worker.start();
        worker.join();

        System.out.println("input=" + result.input);
        System.out.println("answer=" + result.answer);
        System.out.println("ready=" + result.ready);
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "일부러 volatile이 아닌 input·answer·ready를 가진 confined result holder를 정의합니다." },
        { lines: "8-15", explanation: "main이 input을 start 전에 공개하고 worker가 answer·ready를 plain write합니다." },
        { lines: "17-18", explanation: "start는 input visibility를, successful join은 result visibility를 보장하는 edges를 만듭니다." },
        { lines: "20-22", explanation: "join 뒤에만 plain results를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "single worker", "JMM start/join edges", "-Xlint:all warning0"], command: isolatedJavaRun("StartJoinVisibility.java", "StartJoinVisibility") },
      output: { value: "input=21\nanswer=42\nready=true", explanation: ["start 전 input21이 worker에 보입니다.", "worker writes가 join 뒤 main에 보입니다.", "fixture는 join 전 경쟁 read를 하지 않습니다."] },
      experiments: [
        { change: "join 전에 while(!result.ready){}를 실행합니다.", prediction: "data race이며 loop가 종료된다는 JMM 보장이 없습니다.", result: "spin flag에는 volatile/atomic 또는 blocking primitive가 필요합니다." },
        { change: "worker가 answer를 쓰기 전에 ready를 true로 쓰고 synchronization을 제거합니다.", prediction: "다른 thread가 ready true와 stale answer를 함께 볼 가능성을 배제할 수 없습니다.", result: "publication edge가 object invariant 전체를 덮어야 합니다." },
        { change: "join(1)만 호출하고 바로 result를 읽습니다.", prediction: "timeout 시 worker가 살아 있어 값과 completion 모두 미정입니다.", result: "timed join return과 successful completion을 구분합니다." },
      ],
      sourceRefs: ["java-thread", "jls-17-threads-locks", "java-memory-model-cookbook", "java-thread-state"],
    }],
    diagnostics: [
      { symptom: "worker가 ready를 true로 만들었는데 main의 busy loop가 끝나지 않는다.", likelyCause: "join/volatile/lock 같은 happens-before edge 없이 plain field를 경쟁해서 읽습니다.", checks: ["field modifier와 access threads를 봅니다.", "completion primitive가 있는지 봅니다.", "loop body가 synchronization을 하는지 봅니다."], fix: "join·Future.get·volatile/atomic·lock·latch 중 의미에 맞는 synchronization을 사용합니다.", prevention: "shared field마다 ownership/publication/read edge를 설계 문서에 표시합니다." },
      { symptom: "timed join 뒤 partial result를 정상 완료로 저장했다.", likelyCause: "join(timeout)의 반환을 worker completion으로 오해했습니다.", checks: ["isAlive를 확인합니다.", "outcome holder가 terminal인지 봅니다.", "timeout 뒤 cancellation 정책을 확인합니다."], fix: "completion을 확인하지 못했으면 timeout outcome으로 분류하고 bounded cancellation/cleanup을 수행합니다.", prevention: "deadline, cancellation, result publication을 하나의 protocol로 테스트합니다." },
    ],
    comparisons: [{ title: "결과 publication", options: [
      { name: "Thread.join", chooseWhen: "직접 소유한 한 worker의 완료와 writes를 기다릴 때", avoidWhen: "값·실패·대량 task를 별도 channel 없이 관리할 때", tradeoffs: ["명확한 completion edge", "return value 없음"] },
      { name: "Future.get", chooseWhen: "Executor task의 값·failure·cancellation을 받아야 할 때", avoidWhen: "무기한 blocking이 event-loop를 막을 때", tradeoffs: ["typed outcome", "blocking 또는 timeout 정책 필요"] },
      { name: "CompletableFuture", chooseWhen: "비동기 pipeline과 outcome composition이 필요할 때", avoidWhen: "executor와 failure policy가 암묵적일 때", tradeoffs: ["nonlinear composition", "context/executor 추적 난이도"] },
    ] }],
    expertNotes: ["The JMM guarantees do not require Result fields to be volatile in this exact start-before-write and read-after-join pattern; changing access timing changes the correctness proof."],
  },
  {
    id: "interrupt-request-clearing-restoration-contract",
    title: "interrupt는 강제 종료가 아니라 관찰하고 보존해야 하는 협력 취소 신호입니다",
    lead: "blocking method가 InterruptedException으로 신호를 전달할 때 interrupt status가 지워지는 지점과 복원 정책을 exact boolean으로 확인합니다.",
    explanations: [
      "interrupt는 target thread에 요청을 표시합니다. arbitrary instruction에서 안전하게 thread를 죽이지 않으며 task code가 blocking exception 또는 status check로 협력해야 합니다.",
      "CountDownLatch.await, sleep, join 같은 interruptible blocking method는 interrupt를 감지하면 InterruptedException을 던지고 일반적으로 status를 clear합니다.",
      "catch가 exception을 밖으로 던질 수 없는 Runnable boundary라면 cleanup 후 Thread.currentThread().interrupt()로 status를 복원하고 상위 실행 정책이 관찰할 기회를 남기는 것이 일반적입니다.",
      "무조건 복원이 정답은 아닙니다. method가 interruption을 완전히 처리해 새로운 semantic outcome으로 반환하는 명시 계약이라면 consumed policy도 가능하지만 문서와 test가 필요합니다.",
      "InterruptedException을 빈 catch로 삼키면 executor shutdown·request cancellation이 무시되어 thread leak와 stale side effect가 생깁니다.",
      "예제는 entered latch로 worker 진입을 확인한 뒤 interrupt하므로 sleep으로 timing을 추측하지 않습니다. interrupt가 await 직전 도착해도 await가 즉시 감지합니다.",
    ],
    concepts: [
      { term: "interrupt status", definition: "Thread에 설정되는 협력 신호 flag로 isInterrupted 또는 Thread.interrupted로 관찰합니다.", detail: ["Thread.interrupted는 현재 thread 상태를 읽고 clear합니다.", "일부 blocking method도 throw하며 clear합니다."] },
      { term: "interruption policy", definition: "어떤 layer가 interrupt를 처리·변환·복원할 책임이 있는지 정한 계약입니다.", detail: ["API boundary와 함께 설계합니다.", "cleanup과 failure outcome을 포함합니다."] },
      { term: "cooperative cancellation", definition: "작업이 안전한 경계에서 요청을 확인하고 invariant를 보존하며 종료하는 방식입니다.", detail: ["강제 process kill과 다릅니다.", "blocking operation도 깨울 수 있어야 합니다."] },
    ],
    codeExamples: [{
      id: "java-interrupt-status-restoration",
      title: "await interrupt의 clear와 catch 내부 restore를 기록합니다",
      language: "java",
      filename: "InterruptRestoration.java",
      purpose: "handshake로 race를 제거하고 InterruptedException의 status semantics를 warning0 exact 출력으로 검증합니다.",
      code: String.raw`import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicBoolean;

public class InterruptRestoration {
    public static void main(String[] args) throws InterruptedException {
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch blocker = new CountDownLatch(1);
        AtomicBoolean caught = new AtomicBoolean();
        AtomicBoolean cleared = new AtomicBoolean();
        AtomicBoolean restored = new AtomicBoolean();

        Thread worker = new Thread(() -> {
            entered.countDown();
            try {
                blocker.await();
            } catch (InterruptedException error) {
                caught.set(true);
                cleared.set(!Thread.currentThread().isInterrupted());
                Thread.currentThread().interrupt();
                restored.set(Thread.currentThread().isInterrupted());
            }
        }, "interruptible-worker");

        worker.start();
        entered.await();
        worker.interrupt();
        worker.join();

        System.out.println("caught=" + caught.get());
        System.out.println("clearedByThrow=" + cleared.get());
        System.out.println("restoredInCatch=" + restored.get());
        System.out.println("state=" + worker.getState());
    }
}`,
      walkthrough: [
        { lines: "1-10", explanation: "진입·blocking latches와 catch/clear/restore 세 evidence flags를 만듭니다." },
        { lines: "12-22", explanation: "worker가 진입 신호 뒤 await하고, interrupt exception 안에서 clear를 확인한 다음 status를 복원합니다." },
        { lines: "24-27", explanation: "entered handshake 뒤 interrupt하고 join으로 catch 처리 완료를 기다립니다." },
        { lines: "29-32", explanation: "exception 관찰·clear·restore와 terminal state를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "CountDownLatch interruptible wait", "AtomicBoolean evidence", "-Xlint:all warning0"], command: isolatedJavaRun("InterruptRestoration.java", "InterruptRestoration") },
      output: { value: "caught=true\nclearedByThrow=true\nrestoredInCatch=true\nstate=TERMINATED", explanation: ["await가 interrupt를 InterruptedException으로 전달합니다.", "catch 진입 시 status는 clear되어 있습니다.", "Runnable boundary가 status를 복원한 뒤 정상 종료합니다."] },
      experiments: [
        { change: "catch의 interrupt 복원을 제거합니다.", prediction: "restoredInCatch는 false이고 상위 policy가 cancellation 신호를 알기 어려워집니다.", result: "신호를 소비할 authority가 없는 layer는 보존합니다." },
        { change: "Thread.interrupted()를 두 번 호출합니다.", prediction: "첫 호출이 true를 반환하며 clear하고 둘째는 false입니다.", result: "isInterrupted와 clearing static method를 구분합니다." },
        { change: "busy CPU loop가 status를 전혀 확인하지 않게 합니다.", prediction: "interrupt만으로 loop가 멈추지 않습니다.", result: "CPU task도 bounded interval로 status를 확인해야 합니다." },
      ],
      sourceRefs: ["java-thread", "java-interrupted-exception", "java-count-down-latch", "java-atomic-boolean", "java-concurrency-tutorial-interrupts"],
    }],
    diagnostics: [
      { symptom: "shutdownNow를 호출했는데 worker가 계속 실행된다.", likelyCause: "task가 interrupt를 확인하지 않거나 InterruptedException을 삼킵니다.", checks: ["blocking call과 catch를 찾습니다.", "CPU loop의 status check를 봅니다.", "native/uninterruptible operation인지 확인합니다."], fix: "bounded blocking·status check·cleanup·outcome propagation을 구현합니다.", prevention: "cancellation latency upper bound와 interrupt fixture를 acceptance test에 둡니다." },
      { symptom: "catch 뒤 상위 executor가 cancellation 사실을 잃었다.", likelyCause: "Runnable 내부에서 InterruptedException을 log만 하고 status를 복원하지 않았습니다.", checks: ["catch exit 시 isInterrupted를 기록합니다.", "exception을 다른 outcome으로 전달하는지 봅니다.", "API interruption policy를 확인합니다."], fix: "cleanup 후 status를 복원하거나 explicit cancelled outcome으로 완전히 변환합니다.", prevention: "각 layer가 consume/propagate/restore 중 무엇을 하는지 code review checklist로 고정합니다." },
    ],
    comparisons: [{ title: "취소 신호 처리", options: [
      { name: "throws InterruptedException", chooseWhen: "caller가 interruption policy를 결정할 수 있는 blocking API일 때", avoidWhen: "exception을 의미 없이 RuntimeException으로 감쌀 때", tradeoffs: ["명시 전달", "signature 전파 필요"] },
      { name: "restore status", chooseWhen: "Runnable처럼 checked exception을 전달할 수 없는 boundary에서 cleanup 후 상위에 보존할 때", avoidWhen: "현재 layer가 cancellation을 완전히 처리했다고 계약할 때", tradeoffs: ["신호 보존", "상위가 실제 확인해야 함"] },
      { name: "explicit cancelled result", chooseWhen: "domain outcome으로 취소를 완전히 모델링할 때", avoidWhen: "interrupt status를 지우면서 partial side effect를 숨길 때", tradeoffs: ["업무 의미 명확", "blocking wake-up과 별도 연결 필요"] },
    ] }],
    expertNotes: ["Interruption is a protocol spanning caller, blocking primitives, task code, and resource cleanup. A single interrupt() call is not evidence that cancellation completed."],
  },
  {
    id: "thread-one-shot-start-and-illegal-state",
    title: "Thread instance는 one-shot이며 종료 후 다시 start할 수 없습니다",
    lead: "NEW에서 start할 수 있는 기회는 한 번뿐입니다. 같은 task를 재시도하려면 새 Thread 또는 executor submission을 만들어야 합니다.",
    explanations: [
      "Thread.start는 한 Thread instance에 최대 한 번 호출할 수 있습니다. 실행 중이든 TERMINATED든 두 번째 start는 IllegalThreadStateException입니다.",
      "TERMINATED는 object가 garbage collection 대상이 될 수 있다는 뜻이지 run이 다시 가능한 idle worker라는 뜻이 아닙니다.",
      "재시도를 같은 Runnable logic으로 해야 한다면 새 Thread handle을 만들거나 executor에 새 task로 제출합니다. 이전 run의 mutable task state는 retry 전에 검증합니다.",
      "두 caller가 같은 NEW Thread를 동시에 start하려 하면 하나만 성공하고 다른 하나가 실패합니다. start ownership을 단일 component에 둡니다.",
      "isAlive false는 NEW와 TERMINATED 모두에서 가능하므로 start 가능 여부 판정으로 쓰면 안 됩니다. 외부 check-then-act도 race입니다.",
      "IllegalThreadStateException을 잡아 무시하면 작업이 실제로 실행되지 않은 retry를 성공으로 오인할 수 있으므로 typed failure와 task id를 남깁니다.",
    ],
    concepts: [
      { term: "one-shot lifecycle", definition: "한 Thread object가 NEW에서 한 번만 start되고 종료 뒤 재사용되지 않는 계약입니다.", detail: ["TERMINATED→NEW 전이는 없습니다.", "Runnable logic은 별개로 재사용할 수 있습니다."] },
      { term: "IllegalThreadStateException", definition: "현재 Thread state에서 요청한 lifecycle operation이 허용되지 않을 때 나는 runtime exception입니다.", detail: ["두 번째 start의 표준 실패입니다.", "catch로 실행을 복구하지 않습니다."] },
      { term: "start ownership", definition: "어떤 component가 Thread를 정확히 한 번 시작할 책임을 가지는지 정한 소유권입니다.", detail: ["race를 줄입니다.", "shutdown ownership과 함께 둡니다."] },
    ],
    codeExamples: [{
      id: "java-thread-start-once",
      title: "종료된 Thread의 두 번째 start를 명시적으로 거부합니다",
      language: "java",
      filename: "ThreadStartOnce.java",
      purpose: "한 번 실행된 run count와 TERMINATED 상태, 표준 exception을 exact 확인합니다.",
      code: String.raw`import java.util.concurrent.atomic.AtomicInteger;

public class ThreadStartOnce {
    public static void main(String[] args) throws InterruptedException {
        AtomicInteger calls = new AtomicInteger();
        Thread worker = new Thread(calls::incrementAndGet, "one-shot");

        worker.start();
        worker.join();

        boolean secondRejected = false;
        try {
            worker.start();
        } catch (IllegalThreadStateException expected) {
            secondRejected = true;
        }

        System.out.println("calls=" + calls.get());
        System.out.println("state=" + worker.getState());
        System.out.println("secondRejected=" + secondRejected);
    }
}`,
      walkthrough: [
        { lines: "1-6", explanation: "run 호출 횟수를 atomic하게 기록하는 one-shot Thread를 만듭니다." },
        { lines: "8-9", explanation: "첫 start와 join으로 worker를 TERMINATED까지 진행시킵니다." },
        { lines: "11-16", explanation: "같은 instance의 두 번째 start가 IllegalThreadStateException인지 좁게 분류합니다." },
        { lines: "18-20", explanation: "run은 한 번, terminal state, rejection true를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "single one-shot platform thread", "-Xlint:all warning0"], command: isolatedJavaRun("ThreadStartOnce.java", "ThreadStartOnce") },
      output: { value: "calls=1\nstate=TERMINATED\nsecondRejected=true", explanation: ["run body는 정확히 한 번 호출됐습니다.", "join 뒤 TERMINATED입니다.", "재시작은 표준 exception으로 거부됩니다."] },
      experiments: [
        { change: "second start 때 새 Thread(worker task)를 만들려고 합니다.", prediction: "기존 Thread 자체에서 Runnable을 꺼낼 public API가 없어 task reference를 따로 보관해야 합니다.", result: "task와 execution handle을 분리해 소유합니다." },
        { change: "isAlive가 false면 start하는 helper를 두 caller가 동시에 호출합니다.", prediction: "check-then-act race로 한 caller가 IllegalThreadStateException을 받습니다.", result: "start ownership을 한 component에 둡니다." },
        { change: "ExecutorService에 같은 Runnable을 두 번 submit합니다.", prediction: "두 개 task execution이 생기며 각 submission outcome을 별도 Future로 추적합니다.", result: "재시도는 새 execution identity로 모델링합니다." },
      ],
      sourceRefs: ["java-thread", "java-illegal-thread-state-exception", "java-atomic-integer", "java-thread-state"],
    }],
    diagnostics: [
      { symptom: "종료된 worker를 재시작하자 IllegalThreadStateException이 난다.", likelyCause: "Thread instance를 reusable worker로 오해했습니다.", checks: ["getState가 TERMINATED인지 봅니다.", "start call count와 owner를 찾습니다.", "task reference가 분리됐는지 봅니다."], fix: "새 Thread를 만들거나 executor에 새 submission을 생성합니다.", prevention: "Thread handle은 one-shot으로 취급하고 lifecycle state machine을 문서화합니다." },
      { symptom: "같은 작업이 중복 실행되거나 한 번도 실행되지 않았다.", likelyCause: "여러 component가 start/retry ownership을 공유하고 exception을 무시합니다.", checks: ["task id별 start event를 봅니다.", "IllegalThreadStateException catch를 검색합니다.", "external side effect idempotency key를 확인합니다."], fix: "single owner와 unique execution id, idempotent side effect protocol을 도입합니다.", prevention: "submitted/started/completed terminal events의 exactly-once transition을 검증합니다." },
    ],
    comparisons: [{ title: "재실행 단위", options: [
      { name: "same Thread", chooseWhen: "선택할 수 없음", avoidWhen: "모든 재시도", tradeoffs: ["두 번째 start 불법", "terminal object는 재사용 불가"] },
      { name: "new Thread + same task", chooseWhen: "작은 직접 lifecycle 실험 또는 새 execution identity가 필요할 때", avoidWhen: "대량 task와 resource limit가 필요할 때", tradeoffs: ["명시적", "생성·종료 책임 반복"] },
      { name: "new executor submission", chooseWhen: "managed worker policy 아래 retry할 때", avoidWhen: "non-idempotent task를 무제한 retry할 때", tradeoffs: ["Future별 outcome", "queue/backoff/idempotency 설계 필요"] },
    ] }],
    expertNotes: ["Do not build a start-if-not-alive abstraction: isAlive is false for both NEW and TERMINATED and cannot make a racy lifecycle transition atomic."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...completionAndInterruptionChapters);

const managedExecutionChapters: DetailedSession["chapters"] = [
  {
    id: "uncaught-worker-failure-observation",
    title: "worker 종료와 성공은 다르며 uncaught failure를 별도 outcome으로 수집합니다",
    lead: "Thread.run 밖으로 나온 예외는 그 worker를 종료시키지만 join을 호출한 main에 던져지지 않습니다. 명시 handler로 failure channel을 만듭니다.",
    explanations: [
      "worker에서 catch되지 않은 Throwable은 Thread.UncaughtExceptionHandler로 전달됩니다. instance handler가 없으면 ThreadGroup/default handler 정책으로 이어질 수 있습니다.",
      "join은 lifecycle completion만 기다립니다. worker가 정상 return했는지 exception으로 끝났는지 join의 return 또는 Thread.State만으로 구분할 수 없습니다.",
      "예제는 instance handler가 failure type·message와 failing thread name을 AtomicReference에 기록하므로 기본 stack trace와 stderr 환경 차이를 제거합니다.",
      "handler 자체가 실패하거나 block하면 종료 관측과 진단을 망칠 수 있습니다. 최소 정보만 안전하게 수집하고 bounded sink로 전달합니다.",
      "Thread.stop 같은 강제 종료로 실패를 해결하지 않습니다. invariant가 깨진 채 lock/resource state를 남길 수 있어 deprecated for removal이 아닌 deprecated unsafe API입니다.",
      "ExecutorService.submit에서는 uncaught exception이 Future outcome에 잡히므로 handler만 보면 실패를 놓칠 수 있습니다. execution abstraction별 failure channel을 알아야 합니다.",
    ],
    concepts: [
      { term: "uncaught exception handler", definition: "Thread.run 밖으로 전달된 Throwable과 해당 Thread를 마지막 경계에서 받는 callback입니다.", detail: ["instance/default handler가 있습니다.", "복구된 task return으로 바꾸지는 않습니다."] },
      { term: "terminal outcome", definition: "작업이 success·failure·cancelled 중 어떤 최종 의미로 끝났는지 나타내는 결과입니다.", detail: ["TERMINATED state보다 풍부합니다.", "정확히 하나여야 합니다."] },
      { term: "failure channel", definition: "worker의 예외를 관찰·저장·전달하는 명시 경로입니다.", detail: ["Thread handler, Future, CompletionStage 등이 있습니다.", "stdout/stderr만으로 대체하지 않습니다."] },
    ],
    codeExamples: [{
      id: "java-uncaught-exception-handler",
      title: "worker uncaught failure를 main이 join 뒤 읽습니다",
      language: "java",
      filename: "UncaughtFailureOutcome.java",
      purpose: "handler를 설치해 default stderr 없이 exception identity와 thread identity를 exact 수집합니다.",
      code: String.raw`import java.util.concurrent.atomic.AtomicReference;

public class UncaughtFailureOutcome {
    public static void main(String[] args) throws InterruptedException {
        AtomicReference<String> failedThread = new AtomicReference<>();
        AtomicReference<String> failure = new AtomicReference<>();
        Thread worker = new Thread(() -> {
            throw new IllegalStateException("boom");
        }, "failing-worker");

        worker.setUncaughtExceptionHandler((thread, error) -> {
            failedThread.set(thread.getName());
            failure.set(error.getClass().getSimpleName() + ":" + error.getMessage());
        });
        worker.start();
        worker.join();

        System.out.println("handlerThread=" + failedThread.get());
        System.out.println("failure=" + failure.get());
        System.out.println("state=" + worker.getState());
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "failure evidence holders와 의도적으로 uncaught IllegalStateException을 내는 worker를 만듭니다." },
        { lines: "11-14", explanation: "instance handler가 thread name과 stable type/message만 기록합니다." },
        { lines: "16-17", explanation: "start와 join은 handler까지 실행된 terminal lifecycle을 기다립니다." },
        { lines: "19-21", explanation: "failure outcome과 TERMINATED가 함께 존재함을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "instance uncaught-exception handler", "stderr-free controlled failure", "-Xlint:all warning0"], command: isolatedJavaRun("UncaughtFailureOutcome.java", "UncaughtFailureOutcome") },
      output: { value: "handlerThread=failing-worker\nfailure=IllegalStateException:boom\nstate=TERMINATED", explanation: ["handler가 실제 failing thread를 받습니다.", "exception이 worker 밖으로 전파됐습니다.", "실패한 worker도 lifecycle state는 TERMINATED입니다."] },
      experiments: [
        { change: "handler를 제거합니다.", prediction: "JVM 기본 정책이 stack trace를 stderr에 쓰지만 main의 join은 여전히 정상 return합니다.", result: "console trace와 programmatic outcome을 구분합니다." },
        { change: "worker body에서 exception을 catch하고 무시합니다.", prediction: "handler가 호출되지 않고 false success처럼 보입니다.", result: "복구하지 못한 failure는 terminal outcome으로 전파합니다." },
        { change: "같은 throwing Runnable을 executor.submit에 넣습니다.", prediction: "exception이 Future.get의 ExecutionException cause로 전달되고 thread handler는 보통 받지 않습니다.", result: "사용 abstraction의 failure channel을 테스트합니다." },
      ],
      sourceRefs: ["java-thread", "java-thread-uncaught-handler", "java-atomic-reference", "java-throwable", "java-thread-stop-deprecation"],
    }],
    diagnostics: [
      { symptom: "join이 정상 반환해서 worker도 성공했다고 기록했다.", likelyCause: "join의 completion과 task outcome을 같은 것으로 취급했습니다.", checks: ["handler/Future failure를 확인합니다.", "worker log의 terminal event를 봅니다.", "result holder가 success default인지 봅니다."], fix: "success/failure/cancelled의 explicit outcome channel을 만들고 join은 lifecycle wait로만 사용합니다.", prevention: "terminal state와 semantic outcome을 각각 assert합니다." },
      { symptom: "production에서 worker stack trace만 있고 어떤 task인지 모른다.", likelyCause: "default handler와 generic thread name에 의존했습니다.", checks: ["thread/task/correlation id를 봅니다.", "handler sink가 structured인지 봅니다.", "error cause chain을 보존했는지 확인합니다."], fix: "semantic thread/task context와 bounded structured failure sink를 설치합니다.", prevention: "failure event schema와 redaction·rate limit를 운영 계약에 포함합니다." },
    ],
    comparisons: [{ title: "worker failure 전달", options: [
      { name: "UncaughtExceptionHandler", chooseWhen: "직접 생성한 Thread의 마지막 안전망이 필요할 때", avoidWhen: "submit된 executor task 결과를 이것만으로 수집할 때", tradeoffs: ["thread-level 최종 관측", "typed return 없음"] },
      { name: "Future.get", chooseWhen: "Callable/Runnable submission의 success·failure·cancel을 caller가 받아야 할 때", avoidWhen: "get을 호출하지 않아 failure를 방치할 때", tradeoffs: ["ExecutionException cause", "blocking·timeout 정책"] },
      { name: "CompletionStage", chooseWhen: "비동기 결과와 recovery pipeline을 조합할 때", avoidWhen: "exceptional stage를 관찰하지 않을 때", tradeoffs: ["composition", "wrapper exception/context 추적"] },
    ] }],
    expertNotes: ["An uncaught-exception handler is an observation boundary, not a transaction rollback mechanism. Side effects performed before failure need their own atomicity or compensation design."],
  },
  {
    id: "executor-service-task-lifecycle-and-shutdown",
    title: "ExecutorService는 task 제출과 worker 자원 수명주기를 분리하지만 종료 책임은 남습니다",
    lead: "두 Callable의 결과를 Future submission order로 읽고, shutdown·awaitTermination까지 실행기 ownership의 일부로 검증합니다.",
    explanations: [
      "ExecutorService는 Runnable/Callable task를 받아 내부 worker 정책으로 실행합니다. task마다 Thread를 직접 만드는 code와 queue·reuse·shutdown 정책을 분리합니다.",
      "Executors.newFixedThreadPool(2)는 최대 두 active worker와 unbounded queue를 사용하므로 무제한 producer에 자동 backpressure를 제공하지 않습니다.",
      "submit은 Future를 즉시 반환합니다. get은 task completion을 기다리고 값 또는 ExecutionException/CancellationException으로 terminal outcome을 전달합니다.",
      "결과를 Future list의 submission order로 get하면 출력은 결정적이지만 느린 앞 task가 뒤의 완료 결과 소비를 막을 수 있습니다. completion order가 필요하면 CompletionService 등을 선택합니다.",
      "shutdown은 새 task를 거절하고 이미 제출된 task가 끝나게 합니다. awaitTermination은 bounded lifecycle 확인이며 timeout이면 남은 task 진단·cancel policy가 필요합니다.",
      "executor reference를 만든 component가 shutdown owner여야 합니다. library가 caller-owned shared executor를 임의로 종료하면 다른 workload를 손상합니다.",
    ],
    concepts: [
      { term: "ExecutorService", definition: "task submission, worker scheduling, shutdown과 termination을 묶은 managed execution service입니다.", detail: ["task와 Thread 생성을 분리합니다.", "명시 lifecycle owner가 필요합니다."] },
      { term: "Future", definition: "한 submission의 pending/complete/cancelled 상태와 값·failure 접근을 제공하는 handle입니다.", detail: ["get은 completion을 기다립니다.", "task identity별로 보관합니다."] },
      { term: "graceful shutdown", definition: "새 작업을 받지 않고 이미 수락한 작업이 bounded deadline 안에 끝나도록 기다리는 종료 단계입니다.", detail: ["shutdown 후 await합니다.", "timeout 뒤 escalation을 정의합니다."] },
    ],
    codeExamples: [{
      id: "java-fixed-executor-lifecycle",
      title: "두 결과와 executor TERMINATED를 함께 검증합니다",
      language: "java",
      filename: "ExecutorLifecycle.java",
      purpose: "task result와 execution-service shutdown result를 모두 terminal evidence로 남깁니다.",
      code: String.raw`import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public class ExecutorLifecycle {
    public static void main(String[] args) throws Exception {
        AtomicInteger sequence = new AtomicInteger();
        ExecutorService executor = Executors.newFixedThreadPool(2, task ->
                new Thread(task, "calc-" + sequence.incrementAndGet()));
        try {
            List<Future<Integer>> results = List.of(
                    executor.submit(() -> 3 * 3),
                    executor.submit(() -> 4 * 4));
            int first = results.get(0).get();
            int second = results.get(1).get();
            System.out.println("values=" + first + "," + second);
            System.out.println("sum=" + (first + second));
        } finally {
            executor.shutdown();
        }

        boolean terminated = executor.awaitTermination(5, TimeUnit.SECONDS);
        System.out.println("terminated=" + terminated);
    }
}`,
      walkthrough: [
        { lines: "1-12", explanation: "두 worker 제한과 의미 있는 calc sequence 이름을 가진 명시 소유 executor를 만듭니다." },
        { lines: "13-21", explanation: "두 Callable을 submit하고 Future를 submission order로 get해 values와 sum을 안정적으로 출력합니다." },
        { lines: "22-24", explanation: "task code가 성공하거나 get이 실패해도 finally에서 새 submission을 닫습니다." },
        { lines: "26-27", explanation: "5초 bounded await로 executor termination까지 확인합니다." },
      ],
      run: { environment: ["OpenJDK 21", "fixed pool size2", "explicit thread factory", "bounded shutdown", "-Xlint:all warning0"], command: isolatedJavaRun("ExecutorLifecycle.java", "ExecutorLifecycle") },
      output: { value: "values=9,16\nsum=25\nterminated=true", explanation: ["결과는 Future list 순서로 읽습니다.", "두 task 합은25입니다.", "shutdown 뒤 executor가 deadline 안에 종료됩니다."] },
      experiments: [
        { change: "shutdown을 제거합니다.", prediction: "non-daemon pool workers가 JVM을 살려 process가 끝나지 않을 수 있습니다.", result: "execution resource lifecycle도 테스트 결과의 일부입니다." },
        { change: "수백만 task를 fixed pool에 즉시 submit합니다.", prediction: "unbounded work queue가 memory와 latency를 키울 수 있습니다.", result: "bounded queue·rejection·producer backpressure를 별도 설계합니다." },
        { change: "첫 task만 느리게 하고 둘째가 빨리 끝나게 합니다.", prediction: "submission-order get은 둘째 결과 소비를 늦춥니다.", result: "ordering requirement에 따라 CompletionService 또는 completion callbacks를 선택합니다." },
      ],
      sourceRefs: ["java-executor-service", "java-executors", "java-future", "java-time-unit", "java-thread-factory", "java-atomic-integer", "java-list"],
    }],
    diagnostics: [
      { symptom: "main이 끝났는데 JVM process가 종료되지 않는다.", likelyCause: "non-daemon executor workers를 shutdown하지 않았습니다.", checks: ["thread dump의 pool threads를 봅니다.", "shutdown/isTerminated를 기록합니다.", "executor owner를 찾습니다."], fix: "owner boundary에서 shutdown 후 bounded await와 escalation을 수행합니다.", prevention: "executor creation마다 lifecycle owner·deadline·test cleanup을 필수로 둡니다." },
      { symptom: "producer burst 뒤 memory가 증가하고 task latency가 끝없이 늘어난다.", likelyCause: "fixedThreadPool의 unbounded queue에 admission control 없이 제출합니다.", checks: ["queue size와 oldest age를 봅니다.", "submit rate와 service rate를 비교합니다.", "rejection/backpressure 정책을 확인합니다."], fix: "bounded ThreadPoolExecutor queue·rejection 또는 upstream concurrency limit를 사용합니다.", prevention: "capacity model과 overload test를 release gate로 둡니다." },
    ],
    comparisons: [{ title: "task execution policy", options: [
      { name: "new Thread per task", chooseWhen: "소수의 명시 lifecycle 또는 교육용 실험일 때", avoidWhen: "대량 platform thread와 admission control이 필요할 때", tradeoffs: ["직접적", "자원 관리 반복"] },
      { name: "fixed thread pool", chooseWhen: "CPU/제한 resource에 맞춰 active concurrency를 제한할 때", avoidWhen: "unbounded queue를 자동 backpressure로 오해할 때", tradeoffs: ["worker reuse·limit", "queue/rejection 설계"] },
      { name: "virtual thread per task", chooseWhen: "많은 독립 blocking task를 thread-per-request style로 표현할 때", avoidWhen: "CPU 병렬도나 외부 resource limit를 자동 해결한다고 볼 때", tradeoffs: ["cheap blocking", "별도 semaphore/pool limit 필요"] },
    ] }],
    expertNotes: ["Executor selection is capacity planning: distinguish active concurrency, queued work, external resource limits, rejection semantics, and shutdown latency."],
  },
  {
    id: "future-cancel-interrupt-cleanup-outcome",
    title: "Future.cancel(true)는 요청이며 cleanup·outcome·executor 종료를 따로 확인합니다",
    lead: "task가 blocking point에 들어갔다는 handshake 뒤 cancel(true)를 보내고, cancellation handle과 worker finally cleanup을 모두 검증합니다.",
    explanations: [
      "Future.cancel(true)의 true 반환은 cancellation request가 accepted되었다는 뜻이지 외부 side effect rollback이나 worker cleanup 완료를 뜻하지 않습니다.",
      "mayInterruptIfRunning=true이면 실행 중 thread에 interrupt를 시도합니다. task가 interruptible wait에 있고 신호를 삼키지 않아야 빠르게 종료할 수 있습니다.",
      "cancelled Future의 get은 CancellationException을 던집니다. null result나 ExecutionException과 구분해 terminal outcome을 정확히 기록합니다.",
      "worker cleanup은 finally에 둡니다. 예제는 cleaned latch를 별도로 기다려 Future 상태뿐 아니라 finally가 실제 완료됐음을 확인합니다.",
      "cancel(false)는 아직 시작하지 않은 task를 queue에서 취소할 때 유용할 수 있지만 이미 실행 중 task를 깨우지 않습니다. race별 behavior를 test해야 합니다.",
      "취소 이후에도 executor 자체를 shutdown하고 await해야 process-level lifecycle이 끝납니다. 한 Future와 execution service는 서로 다른 handle입니다.",
    ],
    concepts: [
      { term: "cancellation request", definition: "작업이 더 진행되지 않도록 요청하는 상태 전이로, 즉시 cleanup 완료나 rollback을 보장하지 않습니다.", detail: ["Future cancel acceptance를 봅니다.", "task cooperation을 별도 확인합니다."] },
      { term: "CancellationException", definition: "취소된 Future에서 결과를 얻으려 할 때 발생하는 unchecked terminal outcome입니다.", detail: ["ExecutionException과 다릅니다.", "cause 없는 정상 취소 신호일 수 있습니다."] },
      { term: "cleanup acknowledgement", definition: "task의 finally/resource release가 실제 완료됐음을 별도 signal로 확인하는 단계입니다.", detail: ["Future flag만으로 추론하지 않습니다.", "shutdown acceptance criterion에 포함합니다."] },
    ],
    codeExamples: [{
      id: "java-future-cancellation-cleanup",
      title: "cancel acceptance·get outcome·finally·executor termination을 검증합니다",
      language: "java",
      filename: "FutureCancellation.java",
      purpose: "시각 sleep 없이 started/cleaned handshakes로 running task cancellation protocol을 재현합니다.",
      code: String.raw`import java.util.concurrent.CancellationException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

public class FutureCancellation {
    public static void main(String[] args) throws Exception {
        ExecutorService executor = Executors.newSingleThreadExecutor();
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch blocker = new CountDownLatch(1);
        CountDownLatch cleaned = new CountDownLatch(1);
        Future<String> future = executor.submit(() -> {
            started.countDown();
            try {
                blocker.await();
                return "unexpected";
            } finally {
                cleaned.countDown();
            }
        });

        started.await();
        boolean accepted = future.cancel(true);
        cleaned.await();
        String getOutcome;
        try {
            future.get();
            getOutcome = "unexpected";
        } catch (CancellationException expected) {
            getOutcome = expected.getClass().getSimpleName();
        } finally {
            executor.shutdown();
        }
        boolean terminated = executor.awaitTermination(5, TimeUnit.SECONDS);

        System.out.println("cancelAccepted=" + accepted);
        System.out.println("futureCancelled=" + future.isCancelled());
        System.out.println("getOutcome=" + getOutcome);
        System.out.println("cleanup=" + (cleaned.getCount() == 0));
        System.out.println("terminated=" + terminated);
    }
}`,
      walkthrough: [
        { lines: "1-13", explanation: "single executor와 started/blocker/cleaned 세 protocol signals를 준비합니다." },
        { lines: "14-21", explanation: "task가 진입을 알리고 interruptible await를 하며 모든 exit에서 cleanup acknowledgement를 냅니다." },
        { lines: "23-25", explanation: "started 뒤 cancel(true)를 보내고 finally completion을 기다립니다." },
        { lines: "26-35", explanation: "Future.get의 CancellationException을 분류하고 executor를 finally에서 shutdown합니다." },
        { lines: "36-42", explanation: "bounded termination과 cancellation protocol의 다섯 terminal facts를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "single-thread executor", "interruptible latch wait", "bounded shutdown", "-Xlint:all warning0"], command: isolatedJavaRun("FutureCancellation.java", "FutureCancellation") },
      output: { value: "cancelAccepted=true\nfutureCancelled=true\ngetOutcome=CancellationException\ncleanup=true\nterminated=true", explanation: ["running task의 cancellation 요청이 accepted됩니다.", "get은 cancelled terminal outcome을 냅니다.", "task finally와 executor termination을 별도로 확인합니다."] },
      experiments: [
        { change: "cancel(false)를 사용합니다.", prediction: "이미 started된 task는 blocker에서 깨지지 않아 cleaned.await가 끝나지 않습니다.", result: "running blocking task에는 interrupt cooperation이 필요합니다." },
        { change: "task가 InterruptedException을 catch하고 다시 blocker.await합니다.", prediction: "Future는 cancelled여도 worker와 executor가 남을 수 있습니다.", result: "Future state와 physical task termination을 분리해 봅니다." },
        { change: "cleaned latch assertion을 제거합니다.", prediction: "resource cleanup 전 test가 성공했다고 판단할 수 있습니다.", result: "shutdown acceptance에는 cleanup acknowledgement를 포함합니다." },
      ],
      sourceRefs: ["java-future", "java-cancellation-exception", "java-count-down-latch", "java-executor-service", "java-executors", "java-time-unit", "java-interrupted-exception"],
    }],
    diagnostics: [
      { symptom: "Future는 cancelled인데 database 작업이 계속 진행된다.", likelyCause: "cancel(true)는 요청일 뿐 task/driver가 interrupt를 지원하지 않거나 이미 side effect를 commit했습니다.", checks: ["worker thread가 살아 있는지 봅니다.", "blocking API cancellation contract를 확인합니다.", "transaction commit 시점을 봅니다."], fix: "driver timeout·domain cancellation·transaction rollback/compensation과 cleanup acknowledgement를 설계합니다.", prevention: "cancel race별 external side effect fixture를 운영 테스트에 둡니다." },
      { symptom: "cancel 뒤 executor가 종료되지 않는다.", likelyCause: "task가 interrupt를 삼키거나 uninterruptible block에 있고 shutdown만 호출했습니다.", checks: ["thread dump stack을 봅니다.", "interrupt status/catch를 봅니다.", "awaitTermination deadline을 기록합니다."], fix: "cooperative task를 고치고 bounded escalation과 resource-specific abort를 추가합니다.", prevention: "worst-case cancellation latency와 leak test를 측정합니다." },
    ],
    comparisons: [{ title: "Future cancel variants", options: [
      { name: "cancel(false)", chooseWhen: "아직 실행되지 않은 queued task를 제거하고 running task는 건드리지 않을 때", avoidWhen: "이미 blocking 중인 task를 멈춰야 할 때", tradeoffs: ["running thread interrupt 없음", "queue race 영향"] },
      { name: "cancel(true)", chooseWhen: "running task가 interrupt protocol을 지원할 때", avoidWhen: "강제 rollback 보장으로 오해할 때", tradeoffs: ["blocking wake-up 시도", "협력·cleanup 별도"] },
      { name: "domain cancellation token", chooseWhen: "여러 child operation과 업무 상태에 취소를 전파할 때", avoidWhen: "blocking primitive를 깨울 interrupt 연결이 없을 때", tradeoffs: ["업무 의미", "Java 표준 interrupt와 bridge 필요"] },
    ] }],
    expertNotes: ["A cancelled Future can coexist briefly or indefinitely with a still-running physical task if interruption is ignored; monitor both logical outcome and execution cleanup."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...managedExecutionChapters);

const modernConcurrencyChapters: DetailedSession["chapters"] = [
  {
    id: "completable-future-explicit-executor-and-outcomes",
    title: "CompletableFuture는 값과 failure pipeline을 조합하되 executor와 exceptional path를 명시합니다",
    lead: "명시 single executor에서 success transform과 failure normalization을 만들고 두 stage의 terminal value와 실행기 종료를 확인합니다.",
    explanations: [
      "CompletableFuture.supplyAsync는 value-producing task를 비동기 stage로 만듭니다. executor argument를 생략하면 보통 common ForkJoinPool을 사용해 workload·lifecycle·context가 암묵적이 됩니다.",
      "thenApply는 정상 value path만 변환합니다. upstream이 exceptional이면 function을 건너뛰고 exceptional completion이 downstream으로 전파됩니다.",
      "handle은 value와 Throwable을 함께 받아 success/failure를 모두 새 value로 정규화할 수 있습니다. 복구로 바꿀지 다시 fail할지는 업무 계약입니다.",
      "join은 checked signature 없이 결과를 반환하지만 failure를 CompletionException으로 감쌀 수 있습니다. get의 ExecutionException과 wrapper가 다르므로 root cause를 보존합니다.",
      "여러 비동기 stage의 println 순서를 계약으로 삼지 않습니다. 예제는 각 stage를 join해 value로 만든 뒤 main에서 정해진 순서로 출력합니다.",
      "CompletionStage graph가 request lifetime 밖으로 탈출하면 취소·context·resource가 orphan될 수 있습니다. root stage owner와 terminal observation을 명시합니다.",
    ],
    concepts: [
      { term: "completion stage", definition: "비동기 계산의 value 또는 exceptional completion과 후속 action graph를 표현하는 단계입니다.", detail: ["normal/exceptional 두 경로가 있습니다.", "executor 선택을 추적해야 합니다."] },
      { term: "exceptional completion", definition: "stage가 value 대신 Throwable 원인으로 완료된 terminal 상태입니다.", detail: ["thenApply를 건너뜁니다.", "handle/exceptionally/whenComplete 정책을 선택합니다."] },
      { term: "root cause preservation", definition: "CompletionException 같은 wrapper를 해석하되 원래 failure type·message·stack/cause chain을 잃지 않는 규칙입니다.", detail: ["공개 메시지는 redaction합니다.", "진단 record에는 cause chain을 보존합니다."] },
    ],
    codeExamples: [{
      id: "java-completable-future-outcomes",
      title: "success와 failure stage를 explicit executor에서 정규화합니다",
      language: "java",
      filename: "CompletableFutureOutcomes.java",
      purpose: "비동기 실행 순서에 기대지 않고 normal value·root failure·executor termination을 exact 출력합니다.",
      code: String.raw`import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class CompletableFutureOutcomes {
    private static String describe(Throwable error) {
        Throwable cause = error instanceof CompletionException
                && error.getCause() != null ? error.getCause() : error;
        return cause.getClass().getSimpleName() + ":" + cause.getMessage();
    }

    public static void main(String[] args) throws InterruptedException {
        ExecutorService executor = Executors.newSingleThreadExecutor(task ->
                new Thread(task, "stage-worker"));
        String failure;
        int value;
        try {
            CompletableFuture<Integer> success = CompletableFuture
                    .supplyAsync(() -> 21, executor)
                    .thenApply(number -> number * 2);
            CompletableFuture<String> failed = CompletableFuture
                    .<Integer>supplyAsync(() -> {
                        throw new IllegalArgumentException("bad-input");
                    }, executor)
                    .handle((ignored, error) -> describe(error));
            value = success.join();
            failure = failed.join();
        } finally {
            executor.shutdown();
        }
        boolean terminated = executor.awaitTermination(5, TimeUnit.SECONDS);

        System.out.println("value=" + value);
        System.out.println("failure=" + failure);
        System.out.println("terminated=" + terminated);
    }
}`,
      walkthrough: [
        { lines: "1-12", explanation: "CompletionException wrapper가 있으면 non-null cause를 보존해 stable type/message로 설명합니다." },
        { lines: "14-19", explanation: "명시 이름의 single executor와 main에서 출력할 두 terminal values를 준비합니다." },
        { lines: "20-30", explanation: "success transform과 intentional failure recovery stage를 같은 executor에 구성하고 join합니다." },
        { lines: "31-35", explanation: "finally shutdown 뒤 bounded termination을 확인합니다." },
        { lines: "37-39", explanation: "stage 실행 interleaving과 무관하게 main에서 value, failure, termination 순으로 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "explicit single-thread executor", "normal+exceptional stages", "bounded shutdown", "-Xlint:all warning0"], command: isolatedJavaRun("CompletableFutureOutcomes.java", "CompletableFutureOutcomes") },
      output: { value: "value=42\nfailure=IllegalArgumentException:bad-input\nterminated=true", explanation: ["normal stage가21을42로 변환합니다.", "handler가 wrapper 안 root failure를 보존합니다.", "explicit executor도 종료됩니다."] },
      experiments: [
        { change: "executor argument를 제거합니다.", prediction: "async stages가 common pool 정책을 사용해 application의 다른 workload와 경쟁할 수 있습니다.", result: "latency·blocking·ownership 요구에 맞는 executor를 명시합니다." },
        { change: "failed stage의 handle을 제거하고 join합니다.", prediction: "join이 CompletionException을 던지고 cause가 IllegalArgumentException입니다.", result: "exceptional terminal stage를 반드시 관찰합니다." },
        { change: "handle에서 무조건 빈 문자열을 반환합니다.", prediction: "pipeline은 정상처럼 이어지지만 root cause와 retry 판단을 잃습니다.", result: "recovery value에는 failure provenance를 포함합니다." },
      ],
      sourceRefs: ["java-completable-future", "java-completion-stage", "java-completion-exception", "java-executor-service", "java-executors", "java-time-unit", "java-illegal-argument-exception"],
    }],
    diagnostics: [
      { symptom: "CompletableFuture failure가 log 없이 사라졌다.", likelyCause: "terminal stage를 join/get/handler로 관찰하지 않았거나 recovery가 cause를 버렸습니다.", checks: ["root stage owner를 찾습니다.", "exceptionally/handle/whenComplete를 봅니다.", "terminal observation metric을 확인합니다."], fix: "모든 root stage에 terminal observation과 typed outcome propagation을 둡니다.", prevention: "orphan stage와 unobserved exceptional completion을 test/lint convention으로 차단합니다." },
      { symptom: "unrelated async 작업까지 느려졌다.", likelyCause: "blocking stage를 common pool에 넣어 shared workers를 점유했습니다.", checks: ["supplyAsync executor argument를 봅니다.", "thread names와 pool metrics를 봅니다.", "blocking duration을 측정합니다."], fix: "workload 성격과 capacity가 명시된 executor 또는 virtual threads로 격리합니다.", prevention: "async API마다 executor provenance와 blocking policy를 문서화합니다." },
    ],
    comparisons: [{ title: "CompletionStage failure action", options: [
      { name: "handle", chooseWhen: "success/failure 모두를 새 value로 변환할 때", avoidWhen: "error가 null일 수 있음을 무시할 때", tradeoffs: ["양쪽 경로 접근", "실패를 정상으로 바꾸는 결정"] },
      { name: "exceptionally", chooseWhen: "exceptional path에만 fallback value를 줄 때", avoidWhen: "fallback이 failure를 숨길 때", tradeoffs: ["간결한 recovery", "원인 provenance 필요"] },
      { name: "whenComplete", chooseWhen: "결과를 바꾸지 않고 관측·정리를 붙일 때", avoidWhen: "callback failure가 원래 outcome에 미치는 영향을 모를 때", tradeoffs: ["side observation", "새 recovery value는 제공하지 않음"] },
    ] }],
    expertNotes: ["Async composition does not remove blocking; join at the wrong boundary can still serialize a pipeline or deadlock a constrained executor graph."],
  },
  {
    id: "java21-virtual-thread-lifecycle-and-limits",
    title: "Java21 virtual thread도 같은 Thread lifecycle을 따르지만 blocking 비용 모델이 다릅니다",
    lead: "Thread.ofVirtual builder로 명시 이름의 unstarted virtual thread를 만들고 NEW→TERMINATED와 task identity를 platform thread와 같은 API로 확인합니다.",
    explanations: [
      "Java21에서 virtual thread는 Thread API의 lightweight implementation입니다. start·join·interrupt·ThreadLocal 등 기본 programming model을 유지합니다.",
      "virtual thread는 OS thread와 영구 일대일로 묶이지 않고 blocking 시 carrier에서 unmount될 수 있어 많은 blocking task를 thread-per-task style로 표현하기 쉽습니다.",
      "cheap하다는 말은 무제한이라는 뜻이 아닙니다. database connections, remote rate limits, memory, CPU와 downstream capacity는 semaphore·pool·admission control로 제한해야 합니다.",
      "virtual thread를 pool에 재사용하는 것은 권장 모델이 아닙니다. task마다 새 virtual thread를 만들고 scarce resource 자체를 별도로 제한합니다.",
      "JDK21에서는 synchronized monitor 내부 blocking이나 native/foreign call이 carrier pinning을 만들 수 있습니다. JFR pinning event와 thread dump로 실제 workload를 측정하며 이후 JDK 개선도 runtime별 확인합니다.",
      "가상 스레드는 data race·deadlock·interrupt swallowing·orphan task를 해결하지 않습니다. task lifetime과 request lifetime, terminal outcome을 여전히 구조화해야 합니다.",
    ],
    concepts: [
      { term: "virtual thread", definition: "JVM이 scheduling하는 lightweight Thread로, 많은 blocking task를 thread-per-task style로 실행하도록 설계됐습니다.", detail: ["Java21 final feature입니다.", "Thread API lifecycle을 사용합니다."] },
      { term: "carrier thread", definition: "virtual thread의 Java code를 실제로 실행하는 platform thread입니다.", detail: ["virtual thread가 mount/unmount될 수 있습니다.", "application이 carrier identity에 의존하면 안 됩니다."] },
      { term: "pinning", definition: "virtual thread가 blocking 중 carrier에서 unmount되지 못해 carrier를 함께 점유하는 상황입니다.", detail: ["JDK/runtime별 원인을 측정합니다.", "JFR와 thread dump로 관찰합니다."] },
    ],
    codeExamples: [{
      id: "java-virtual-thread-lifecycle",
      title: "명시 virtual thread의 type·identity·lifecycle을 확인합니다",
      language: "java",
      filename: "VirtualThreadLifecycle.java",
      purpose: "preview option 없이 Java21 virtual thread를 생성해 stable API와 exact output을 검증합니다.",
      code: String.raw`import java.util.concurrent.atomic.AtomicReference;

public class VirtualThreadLifecycle {
    public static void main(String[] args) throws InterruptedException {
        AtomicReference<String> observed = new AtomicReference<>();
        Thread worker = Thread.ofVirtual()
                .name("vt-request-7")
                .unstarted(() -> observed.set(
                        Thread.currentThread().getName() + ":"
                                + Thread.currentThread().isVirtual()));

        Thread.State before = worker.getState();
        boolean virtual = worker.isVirtual();
        worker.start();
        worker.join();

        System.out.println("virtual=" + virtual);
        System.out.println("before=" + before);
        System.out.println("observed=" + observed.get());
        System.out.println("after=" + worker.getState());
    }
}`,
      walkthrough: [
        { lines: "1-10", explanation: "virtual builder가 semantic name의 unstarted Thread를 만들고 task가 own name/type을 evidence로 기록합니다." },
        { lines: "12-15", explanation: "NEW snapshot과 isVirtual을 저장한 뒤 일반 Thread API로 start·join합니다." },
        { lines: "17-20", explanation: "type, NEW, task 내부 identity, TERMINATED를 stable main output으로 기록합니다." },
      ],
      run: { environment: ["OpenJDK 21", "final virtual-thread API", "no preview flags", "-Xlint:all warning0"], command: isolatedJavaRun("VirtualThreadLifecycle.java", "VirtualThreadLifecycle") },
      output: { value: "virtual=true\nbefore=NEW\nobserved=vt-request-7:true\nafter=TERMINATED", explanation: ["builder가 virtual Thread를 만듭니다.", "start 전 NEW이며 task 내부에서도 virtual identity를 봅니다.", "join 뒤 TERMINATED입니다."] },
      experiments: [
        { change: "Thread.ofPlatform으로 바꿉니다.", prediction: "virtual과 observed suffix가 false이고 lifecycle outputs는 같습니다.", result: "programming model은 유사하고 resource 비용 모델이 다릅니다." },
        { change: "수천 virtual task가 동시에 database connection을 얻도록 합니다.", prediction: "thread는 싸도 connection pool에서 대기하거나 database를 과부하시킵니다.", result: "scarce resource concurrency를 semaphore/pool로 제한합니다." },
        { change: "JDK21에서 synchronized block 안 장기 blocking을 실행하고 JFR을 켭니다.", prediction: "pinned virtual thread event와 carrier occupancy가 관찰될 수 있습니다.", result: "runtime version과 실제 blocking stack을 근거로 개선합니다." },
      ],
      sourceRefs: ["java-thread", "java-thread-builder-of-virtual", "java-executors-virtual-per-task", "java-atomic-reference", "jep-444-virtual-threads", "java21-virtual-thread-guide", "jdk-jfr-virtual-thread-events"],
    }],
    diagnostics: [
      { symptom: "virtual thread로 바꿨는데 database timeout이 더 늘었다.", likelyCause: "cheap threads가 scarce downstream resource로 더 많은 동시 요청을 보내 admission limit를 넘겼습니다.", checks: ["connection pool wait와 active count를 봅니다.", "downstream rate/latency를 봅니다.", "task concurrency limit를 확인합니다."], fix: "resource capacity에 맞춘 semaphore/pool/rate limit를 task boundary에 둡니다.", prevention: "thread count가 아니라 downstream saturation을 포함한 load test를 합니다." },
      { symptom: "virtual workload가 기대만큼 확장되지 않고 carrier가 막힌다.", likelyCause: "JDK21에서 monitor/native 구간 중 blocking으로 pinning이 발생하거나 CPU-bound code가 carrier를 점유합니다.", checks: ["JFR pinned events를 봅니다.", "virtual thread dump stack을 봅니다.", "runtime version과 synchronized/native frames를 확인합니다."], fix: "긴 blocking critical section을 줄이고 runtime별 권장 primitive·API로 바꾸며 CPU 작업을 제한합니다.", prevention: "representative workload의 pinning·carrier·downstream metrics를 release마다 측정합니다." },
    ],
    comparisons: [{ title: "platform vs virtual thread", options: [
      { name: "platform thread", chooseWhen: "작은 bounded worker set, CPU-bound pool 또는 native integration이 중심일 때", avoidWhen: "수많은 mostly-blocking request마다 한 platform thread를 둘 때", tradeoffs: ["OS thread와 밀접", "상대적으로 높은 생성/stack 비용"] },
      { name: "virtual thread", chooseWhen: "많은 독립 blocking task를 단순한 sequential code로 표현할 때", avoidWhen: "CPU 병렬도·downstream capacity를 자동 제한한다고 볼 때", tradeoffs: ["cheap blocking/task-per-thread", "pinning·ThreadLocal·admission 감사"] },
      { name: "async stage graph", chooseWhen: "nonblocking APIs와 fan-in/fan-out composition이 자연스러울 때", avoidWhen: "callback/context graph가 단순 sequential domain logic을 가릴 때", tradeoffs: ["명시 composition", "debug/context propagation 복잡성"] },
    ] }],
    expertNotes: ["Virtual threads improve scalability of the thread-per-task style, not raw CPU parallelism. Apply Little's Law and downstream capacity limits to the whole system, not just the Java scheduler."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...modernConcurrencyChapters);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "Runnable.run을 직접 호출하면 새 thread가 생기나요?", answer: "아닙니다. 호출 중인 thread의 일반 method call이며 Thread.start가 새 execution context에서 run을 호출하게 합니다." },
  { question: "원본 Ex01의 demo.start가 모두 main으로 출력된 이유는 무엇인가요?", answer: "demo는 Thread가 아니고 Ex01_Thread에 선언된 평범한 start method를 main이 직접 호출했기 때문입니다." },
  { question: "Thread와 Runnable을 분리하는 핵심 이점은 무엇인가요?", answer: "task logic을 Thread 생성·이름·queue·pool 같은 execution policy와 독립적으로 재사용하고 테스트할 수 있습니다." },
  { question: "Thread.start가 반환되면 run도 끝난 것인가요?", answer: "아닙니다. start는 비동기 시작을 요청하며 완료는 join, Future 또는 다른 completion primitive로 확인해야 합니다." },
  { question: "Thread의 six states는 무엇인가요?", answer: "NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED입니다." },
  { question: "RUNNABLE이면 CPU에서 실제 실행 중이라고 단정할 수 있나요?", answer: "아닙니다. Java RUNNABLE은 실제 실행과 OS runnable 대기를 함께 포함하는 snapshot입니다." },
  { question: "BLOCKED와 WAITING의 차이는 무엇인가요?", answer: "BLOCKED는 synchronized monitor 진입을 기다리고 WAITING은 wait/join/park 계열 신호를 시간 제한 없이 기다립니다." },
  { question: "Thread.sleep으로 상태 테스트를 맞추면 왜 취약한가요?", answer: "시간 지연은 worker milestone을 보장하지 않아 host 부하와 scheduling에 따라 다른 상태를 읽을 수 있기 때문입니다." },
  { question: "원본 Ex04/Ex07 전체 출력 순서를 정답으로 저장하면 안 되는 이유는 무엇인가요?", answer: "여러 worker 사이 interleaving은 보장되지 않으므로 exact multiset과 필요한 partial order를 검증해야 합니다." },
  { question: "Ex04가 main marker2와 task60행인데 process가 worker 완료 전에 종료되지 않는 이유는 무엇인가요?", answer: "두 worker가 기본 non-daemon이어서 main return 뒤에도 JVM이 살아 있기 때문이며, main이 성공을 관찰했다는 뜻은 아닙니다." },
  { question: "인벤토리 direct5가 compile되지 않는 이유는 무엇인가요?", answer: "Ex04는 Ex03_Task_B를, Ex07은 Ex06_Task_B를 참조하지만 두 companion이 direct list에 없기 때문입니다." },
  { question: "execution closure와 package 전체는 어떻게 다른가요?", answer: "closure7은 선택 entry points에 필요한 최소 sources이고 package24는 이후 thread 주제까지 포함한 전체 regression boundary입니다." },
  { question: "같은 Runnable instance를 두 thread가 실행하면 자동으로 thread-safe한가요?", answer: "아닙니다. captured object graph와 mutable fields의 ownership·synchronization을 별도로 설계해야 합니다." },
  { question: "thread safety와 idempotency는 같은 개념인가요?", answer: "아닙니다. thread safety는 concurrent execution correctness이고 idempotency는 logical retry가 외부 결과를 중복시키지 않는 성질입니다." },
  { question: "Thread.start 전 main의 writes가 worker에 보이는 근거는 무엇인가요?", answer: "start 호출 전 actions가 started thread actions보다 happens-before라는 Java Memory Model 규칙입니다." },
  { question: "worker writes가 join 뒤 main에 보이는 근거는 무엇인가요?", answer: "worker의 모든 actions가 successful join return 이후 actions보다 happens-before이기 때문입니다." },
  { question: "join 전에 plain ready flag를 busy-spin하면 왜 잘못인가요?", answer: "visibility edge 없는 data race라 compiler/JVM이 반복 read를 원하는 대로 최적화할 수 있고 종료 보장이 없습니다." },
  { question: "timed join이 반환되면 completion happens-before를 얻나요?", answer: "timeout으로 worker가 끝나지 않았다면 그렇지 않습니다. completion 여부와 isAlive/outcome을 확인해야 합니다." },
  { question: "interrupt는 target thread를 즉시 강제 종료하나요?", answer: "아닙니다. status와 interruptible blocking wake-up을 통해 task가 안전하게 협력하도록 요청합니다." },
  { question: "InterruptedException catch 진입 시 status가 흔히 false인 이유는 무엇인가요?", answer: "sleep/await/join 같은 blocking method가 interrupt를 감지해 exception을 던질 때 status를 clear하기 때문입니다." },
  { question: "Runnable 내부에서 InterruptedException을 밖으로 던질 수 없으면 보통 어떻게 하나요?", answer: "cleanup 뒤 current thread의 interrupt status를 복원하고 상위 execution policy가 관찰하도록 합니다." },
  { question: "interrupt를 소비해도 되는 경우가 있나요?", answer: "현재 layer가 취소를 완전히 처리해 explicit domain outcome으로 바꾸는 명시 계약이 있을 수 있지만, 무의식적으로 삼키면 안 됩니다." },
  { question: "Thread.interrupted와 isInterrupted의 중요한 차이는 무엇인가요?", answer: "Thread.interrupted는 현재 thread의 status를 읽고 clear하지만 isInterrupted는 대상 thread의 status를 clear하지 않고 읽습니다." },
  { question: "동일 Thread를 종료 후 다시 start할 수 있나요?", answer: "아닙니다. Thread instance는 one-shot이고 두 번째 start는 IllegalThreadStateException입니다." },
  { question: "isAlive false이면 start해도 안전한가요?", answer: "아닙니다. NEW와 TERMINATED 모두 false이고 check-then-act도 race이므로 start ownership을 단일화해야 합니다." },
  { question: "worker가 TERMINATED이면 성공했다는 뜻인가요?", answer: "아닙니다. 정상 return과 uncaught exception 모두 TERMINATED이며 별도 terminal outcome이 필요합니다." },
  { question: "Thread.join이 worker exception을 main에 던지나요?", answer: "아닙니다. 직접 Thread에는 UncaughtExceptionHandler 같은 failure channel을 따로 설치해야 합니다." },
  { question: "ExecutorService.submit task의 exception은 주로 어디서 보나요?", answer: "Future.get의 ExecutionException cause 또는 CompletionStage exceptional outcome에서 보며 handler만 의존하면 놓칠 수 있습니다." },
  { question: "fixed thread pool이 자동 backpressure를 제공하나요?", answer: "Executors.newFixedThreadPool은 기본적으로 unbounded queue를 사용하므로 producer admission control을 별도로 설계해야 합니다." },
  { question: "executor를 shutdown하지 않으면 어떤 문제가 생기나요?", answer: "non-daemon worker가 JVM을 살려 process/test가 끝나지 않거나 resource가 누수됩니다." },
  { question: "shutdown과 shutdownNow의 의미 차이는 무엇인가요?", answer: "shutdown은 새 제출을 막고 accepted tasks를 진행시키며 shutdownNow는 queued tasks 반환과 running tasks interrupt를 시도하지만 강제 완료를 보장하지 않습니다." },
  { question: "Future.cancel(true)가 true면 cleanup도 끝났나요?", answer: "아닙니다. cancellation 요청이 accepted된 것이며 worker cooperation과 finally/resource cleanup을 별도 확인해야 합니다." },
  { question: "cancelled Future에서 get하면 무엇이 발생하나요?", answer: "CancellationException이 발생하며 정상 null이나 ExecutionException과 다른 terminal outcome입니다." },
  { question: "Future logical cancellation과 physical task termination이 다를 수 있나요?", answer: "그렇습니다. task가 interrupt를 무시하면 Future는 cancelled여도 worker가 계속 실행할 수 있습니다." },
  { question: "CompletableFuture에서 executor를 생략할 때 주의점은 무엇인가요?", answer: "보통 common pool을 공유하므로 blocking workload와 context·lifecycle·capacity가 암묵적으로 다른 작업과 경쟁할 수 있습니다." },
  { question: "thenApply upstream이 exceptional이면 function이 실행되나요?", answer: "아닙니다. exceptional completion이 downstream으로 전파되고 recovery action에서 처리해야 합니다." },
  { question: "join이 비동기 failure를 어떤 형태로 전달할 수 있나요?", answer: "unchecked CompletionException으로 감싸며 original cause chain을 보존해 해석해야 합니다." },
  { question: "virtual thread가 해결하지 않는 문제 세 가지는 무엇인가요?", answer: "data race/deadlock correctness, downstream resource capacity, task lifetime·cancellation ownership을 해결하지 않습니다." },
  { question: "virtual thread를 pool에 재사용하기보다 task마다 만드는 이유는 무엇인가요?", answer: "가상 스레드는 lightweight task execution 단위로 설계됐고 scarce resource concurrency는 그 resource에서 별도로 제한하기 때문입니다." },
  { question: "JDK21 virtual thread pinning을 어떻게 진단하나요?", answer: "JFR pinned events, virtual thread dump, synchronized/native blocking stack과 carrier utilization을 runtime version과 함께 봅니다." },
);

(session.completionChecklist as string[]).push(
  "inventory direct5와 execution closure7을 구분했다.",
  "빠진 Ex03_Task_B와 Ex06_Task_B provenance를 기록했다.",
  "class11 package24 warning0와 main11을 확인했다.",
  "direct5 compiler errors4를 숨기지 않았다.",
  "closure7 warning0와 mains3을 확인했다.",
  "원본 seven files를 byte-identical temp copy로만 옮겼다.",
  "원본 source를 수정하거나 main으로 직접 실행하지 않았다.",
  "공백 포함 owned temp root의 direct-child ownership을 확인했다.",
  "launcher variables4의 존재와 값을 복원했다.",
  "child stdout/stderr를 동시에 drain했다.",
  "child timeout·tree kill·grace·Dispose를 적용했다.",
  "baseline과 hostile launcher 결과가 같은지 확인했다.",
  "Ex01 여섯 행이 모두 main identity인지 확인했다.",
  "Ex04 total62와 AAAR/BBBR index0..29를 확인했다.",
  "Ex07 total92와 세 prefix index0..29를 확인했다.",
  "동시 출력 전체 순서를 snapshot 정답으로 만들지 않았다.",
  "run 직접 호출과 start의 execution identity를 구분했다.",
  "Thread object와 Runnable task identity를 구분했다.",
  "start 반환과 task completion을 구분했다.",
  "Thread name과 business task id를 구분했다.",
  "NEW와 TERMINATED의 one-shot 전이를 설명했다.",
  "RUNNABLE을 CPU running과 동일시하지 않았다.",
  "BLOCKED·WAITING·TIMED_WAITING 원인을 구분했다.",
  "상태 테스트에 sleep 추측 대신 handshake를 썼다.",
  "state polling을 coordination primitive로 사용하지 않았다.",
  "모든 무기한 wait에 release owner를 두었다.",
  "Runnable reuse 전 reentrancy를 검토했다.",
  "shared mutable state의 owner를 표시했다.",
  "thread safety와 idempotency를 별도로 검토했다.",
  "concurrent result collector의 안전성을 확인했다.",
  "start 전 publication edge를 설명했다.",
  "successful join 뒤 completion edge를 설명했다.",
  "join 전 plain field 경쟁 read를 만들지 않았다.",
  "timed join timeout을 completion으로 오해하지 않았다.",
  "interrupt를 강제 종료로 표현하지 않았다.",
  "각 blocking API의 interrupt contract를 확인했다.",
  "InterruptedException catch에서 cleanup을 수행했다.",
  "consume·propagate·restore 정책을 layer별로 정했다.",
  "CPU loop의 cancellation check interval을 제한했다.",
  "cancellation latency acceptance criterion을 두었다.",
  "Thread 두 번째 start를 명시 failure로 분류했다.",
  "start ownership을 단일 component에 두었다.",
  "TERMINATED state와 success outcome을 구분했다.",
  "direct Thread failure channel을 설치했다.",
  "handler가 bounded하고 민감정보를 redaction하는지 확인했다.",
  "Executor Future failure를 실제로 관찰했다.",
  "executor 생성자와 shutdown owner를 연결했다.",
  "executor queue capacity와 rejection policy를 검토했다.",
  "shutdown 뒤 bounded awaitTermination을 수행했다.",
  "timeout 뒤 escalation과 evidence 보존을 정의했다.",
  "Future cancellation acceptance와 cleanup 완료를 분리했다.",
  "CancellationException을 별도 terminal outcome으로 기록했다.",
  "external side effect의 rollback/compensation을 검토했다.",
  "CompletableFuture root stage를 terminal까지 관찰했다.",
  "async executor provenance와 blocking policy를 기록했다.",
  "CompletionException의 original cause를 보존했다.",
  "virtual thread가 final Java21 API인지 확인했다.",
  "virtual thread에서도 downstream resource limit를 적용했다.",
  "JFR/thread dump로 pinning과 orphan tasks를 관찰했다.",
  "모든 Java 예제가 JDK21 -Xlint:all warning0인지 확인했다.",
);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-class11-ex01", repository: "javastudy2 classstudy", path: "src/com/java/class11/Ex01_Thread.java", usedFor: ["plain play/start methods", "main-thread six-line evidence", "currentThread names"], evidence: "Thread subclass가 아닌 class의 start가 일반 method call임을 보여 주는 direct inventory 원본입니다." },
  { id: "java-class11-ex02", repository: "javastudy2 classstudy", path: "src/com/java/class11/Ex02_Task_A.java", usedFor: ["Thread subclass", "AAAR run loop", "Ex04 dependency"], evidence: "Thread를 상속하고 run에서 index0..29를 출력하는 direct inventory 원본입니다." },
  { id: "java-class11-ex03", repository: "javastudy2 classstudy", path: "src/com/java/class11/Ex03_Task_B.java", usedFor: ["Thread subclass companion", "BBBR run loop", "closure repair"], evidence: "direct list에는 없지만 Ex04 compile·실행에 필수인 companion 원본입니다." },
  { id: "java-class11-ex04", repository: "javastudy2 classstudy", path: "src/com/java/class11/Ex04_Main.java", usedFor: ["two Thread subclasses", "start calls", "non-joined main marker"], evidence: "Ex02와 Ex03을 start하고 완료를 기다리지 않는 direct inventory main입니다." },
  { id: "java-class11-ex05", repository: "javastudy2 classstudy", path: "src/com/java/class11/Ex05_Task_A.java", usedFor: ["Runnable implementation", "AAAR task", "composition"], evidence: "Thread 상속 없이 Runnable.run을 구현하는 direct inventory 원본입니다." },
  { id: "java-class11-ex06", repository: "javastudy2 classstudy", path: "src/com/java/class11/Ex06_Task_B.java", usedFor: ["Runnable companion", "BBBR task", "closure repair"], evidence: "direct list에는 없지만 Ex07 compile·실행에 필수인 companion 원본입니다." },
  { id: "java-class11-ex07", repository: "javastudy2 classstudy", path: "src/com/java/class11/Ex07_Main.java", usedFor: ["Runnable Thread constructors", "anonymous Runnable", "three-worker evidence"], evidence: "두 named task와 anonymous Runnable을 세 Thread에서 start하는 direct inventory main입니다." },
  { id: "jdk21-javac", repository: "OpenJDK", path: "javac tool", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["--release21", "-Xlint:all", "-XDrawDiagnostics", "warning0 gates"], evidence: "package/direct/closure와 모든 현대 Java 예제의 compiler contract 근거입니다." },
  { id: "powershell-environment", repository: "Microsoft Learn", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher snapshot", "baseline/hostile modes", "exact restore"], evidence: "parent launcher variables4 격리·복원 근거입니다." },
  { id: "powershell-get-file-hash", repository: "Microsoft Learn", path: "Get-FileHash", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash", usedFor: ["SHA-256 original/copy equality", "relocation evidence"], evidence: "closure7 byte-identical owned temp copy 확인 근거입니다." },
  { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["ArgumentList", "redirection", "child environment", "working directory"], evidence: "shell quoting과 launcher inheritance를 제어하는 child start 근거입니다." },
  { id: "dotnet-process", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "Kill(entireProcessTree)", "WaitForExit", "Dispose"], evidence: "bounded compiler/JVM child lifecycle 근거입니다." },
  { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["concurrent stdout drain", "concurrent stderr drain"], evidence: "redirect pipe deadlock을 피하는 감사기 근거입니다." },
  { id: "java-thread", repository: "Java SE 21 API", path: "java.lang.Thread", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html", usedFor: ["start/run/join", "name/identity", "interrupt", "isVirtual", "lifecycle"], evidence: "세션 전체 Thread programming model의 중심 API 근거입니다." },
  { id: "java-runnable", repository: "Java SE 21 API", path: "java.lang.Runnable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Runnable.html", usedFor: ["task contract", "run direct call", "Thread composition"], evidence: "값을 반환하지 않는 실행 task interface 근거입니다." },
  { id: "java-thread-state", repository: "Java SE 21 API", path: "java.lang.Thread.State", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.State.html", usedFor: ["six states", "NEW/WAITING/TERMINATED", "snapshot caveat"], evidence: "Java thread state 분류의 공식 enum 근거입니다." },
  { id: "java-atomic-reference", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicReference", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicReference.html", usedFor: ["cross-thread identity result", "failure evidence", "virtual-thread evidence"], evidence: "single reference result의 atomic publication 근거입니다." },
  { id: "jls-17-threads-locks", repository: "Java Language Specification 21", path: "Chapter 17 Threads and Locks", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html", usedFor: ["start happens-before", "join happens-before", "data races", "memory visibility"], evidence: "Thread start/join과 Java Memory Model formal rules의 규범 근거입니다." },
  { id: "java-count-down-latch", repository: "Java SE 21 API", path: "java.util.concurrent.CountDownLatch", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html", usedFor: ["deterministic handshake", "WAITING fixture", "cancellation cleanup acknowledgement"], evidence: "sleep 추측 없는 one-shot milestone coordination 근거입니다." },
  { id: "java-system-nano-time", repository: "Java SE 21 API", path: "java.lang.System.nanoTime", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html#nanoTime()", usedFor: ["elapsed deadline", "bounded state observation"], evidence: "wall-clock 조정에 영향받지 않는 elapsed-time deadline 근거입니다." },
  { id: "java-atomic-integer", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html", usedFor: ["task call count", "thread factory sequence", "one-shot run count"], evidence: "concurrent numeric evidence와 name sequence의 atomic update 근거입니다." },
  { id: "java-concurrent-skip-list-set", repository: "Java SE 21 API", path: "java.util.concurrent.ConcurrentSkipListSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentSkipListSet.html", usedFor: ["thread-safe worker-name collection", "deterministic sorted output"], evidence: "scheduler-independent concurrent sorted set fixture 근거입니다." },
  { id: "java-set", repository: "Java SE 21 API", path: "java.util.Set", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html", usedFor: ["unique worker identities", "collection abstraction"], evidence: "worker name uniqueness를 중복 없는 abstraction으로 표현한 근거입니다." },
  { id: "java-memory-model-cookbook", repository: "JSR-133 resources", path: "JSR-133 Cookbook", publicUrl: "https://gee.cs.oswego.edu/dl/jmm/cookbook.html", usedFor: ["compiler reorder intuition", "publication patterns", "JMM implementation context"], evidence: "plain-field publication과 reordering 설명을 보강하는 JMM expert reference입니다." },
  { id: "java-interrupted-exception", repository: "Java SE 21 API", path: "java.lang.InterruptedException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/InterruptedException.html", usedFor: ["interruptible blocking", "status clearing", "propagation policy"], evidence: "sleep/wait/join 계열 interrupt delivery exception 근거입니다." },
  { id: "java-atomic-boolean", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicBoolean", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicBoolean.html", usedFor: ["catch/clear/restore evidence", "safe boolean publication"], evidence: "interrupt fixture의 cross-thread boolean evidence 근거입니다." },
  { id: "java-concurrency-tutorial-interrupts", repository: "Oracle Java Tutorials", path: "Concurrency - Interrupts", publicUrl: "https://docs.oracle.com/javase/tutorial/essential/concurrency/interrupt.html", usedFor: ["cooperative interruption", "status restoration pattern"], evidence: "interrupt 요청·exception·status 처리 입문 설명의 공식 tutorial 근거입니다." },
  { id: "java-illegal-thread-state-exception", repository: "Java SE 21 API", path: "java.lang.IllegalThreadStateException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/IllegalThreadStateException.html", usedFor: ["second start failure", "one-shot lifecycle"], evidence: "현재 Thread state에서 허용되지 않는 operation의 표준 failure 근거입니다." },
  { id: "java-thread-uncaught-handler", repository: "Java SE 21 API", path: "java.lang.Thread.UncaughtExceptionHandler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.UncaughtExceptionHandler.html", usedFor: ["direct worker failure channel", "thread/error callback"], evidence: "uncaught Throwable의 thread-level 마지막 관측 callback 근거입니다." },
  { id: "java-throwable", repository: "Java SE 21 API", path: "java.lang.Throwable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html", usedFor: ["cause chain", "failure type/message", "suppressed diagnostic context"], evidence: "worker와 stage failure provenance 보존 근거입니다." },
  { id: "java-thread-stop-deprecation", repository: "Java SE 21 API", path: "Java Thread Primitive Deprecation", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/doc-files/threadPrimitiveDeprecation.html", usedFor: ["Thread.stop unsafe reasoning", "cooperative alternatives"], evidence: "arbitrary force-stop이 invariant와 monitor state를 손상하는 이유의 공식 근거입니다." },
  { id: "java-executor-service", repository: "Java SE 21 API", path: "java.util.concurrent.ExecutorService", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html", usedFor: ["task submission", "shutdown", "awaitTermination", "memory consistency"], evidence: "managed execution service lifecycle의 중심 API 근거입니다." },
  { id: "java-executors", repository: "Java SE 21 API", path: "java.util.concurrent.Executors", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html", usedFor: ["fixed pool", "single-thread executor", "factory caveats"], evidence: "예제 executor factories와 queue policy 선택 근거입니다." },
  { id: "java-future", repository: "Java SE 21 API", path: "java.util.concurrent.Future", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Future.html", usedFor: ["result", "failure", "cancel", "get visibility"], evidence: "submission별 terminal outcome handle의 공식 근거입니다." },
  { id: "java-time-unit", repository: "Java SE 21 API", path: "java.util.concurrent.TimeUnit", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/TimeUnit.html", usedFor: ["bounded termination deadline", "explicit time units"], evidence: "숫자 timeout의 단위 오류를 피하는 enum 근거입니다." },
  { id: "java-thread-factory", repository: "Java SE 21 API", path: "java.util.concurrent.ThreadFactory", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadFactory.html", usedFor: ["semantic pool thread names", "worker construction policy"], evidence: "executor가 새 worker Thread를 만드는 policy abstraction 근거입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "java.util.List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["Future submission order", "immutable result-handle list"], evidence: "두 Future의 명시 ordering과 indexed access 근거입니다." },
  { id: "java-cancellation-exception", repository: "Java SE 21 API", path: "java.util.concurrent.CancellationException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CancellationException.html", usedFor: ["cancelled Future get outcome", "terminal taxonomy"], evidence: "취소된 result retrieval의 표준 unchecked failure 근거입니다." },
  { id: "java-completable-future", repository: "Java SE 21 API", path: "java.util.concurrent.CompletableFuture", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html", usedFor: ["supplyAsync", "thenApply", "handle", "join"], evidence: "normal/exceptional async pipeline 구현의 중심 API 근거입니다." },
  { id: "java-completion-stage", repository: "Java SE 21 API", path: "java.util.concurrent.CompletionStage", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletionStage.html", usedFor: ["stage graph", "dependent actions", "exceptional propagation"], evidence: "비동기 계산 stage의 composition contract 근거입니다." },
  { id: "java-completion-exception", repository: "Java SE 21 API", path: "java.util.concurrent.CompletionException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletionException.html", usedFor: ["join wrapper", "root cause unwrapping"], evidence: "CompletionStage 처리 중 failure를 감싸는 표준 exception 근거입니다." },
  { id: "java-illegal-argument-exception", repository: "Java SE 21 API", path: "java.lang.IllegalArgumentException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/IllegalArgumentException.html", usedFor: ["controlled stage validation failure", "stable failure type"], evidence: "잘못된 input 계약을 나타내는 fixture exception 근거입니다." },
  { id: "java-thread-builder-of-virtual", repository: "Java SE 21 API", path: "java.lang.Thread.Builder.OfVirtual", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.Builder.OfVirtual.html", usedFor: ["named virtual thread", "unstarted lifecycle", "builder configuration"], evidence: "Java21 virtual Thread builder의 공식 API 근거입니다." },
  { id: "java-executors-virtual-per-task", repository: "Java SE 21 API", path: "Executors.newVirtualThreadPerTaskExecutor", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html#newVirtualThreadPerTaskExecutor()", usedFor: ["virtual-thread-per-task policy", "managed task lifecycle alternative"], evidence: "각 task에 새 virtual thread를 만드는 executor factory 근거입니다." },
  { id: "jep-444-virtual-threads", repository: "OpenJDK JEP", path: "JEP 444 Virtual Threads", publicUrl: "https://openjdk.org/jeps/444", usedFor: ["Java21 final feature", "thread-per-request model", "pinning/JFR", "non-goals"], evidence: "virtual threads의 목표·finalization·관측성·제약을 정의한 primary proposal입니다." },
  { id: "java21-virtual-thread-guide", repository: "Oracle Java 21 Guide", path: "Virtual Threads", publicUrl: "https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html", usedFor: ["virtual thread usage", "do not pool", "throughput guidance", "pinning diagnosis"], evidence: "Java21 application-level virtual thread 사용 지침 근거입니다." },
  { id: "jdk-jfr-virtual-thread-events", repository: "Oracle Java 21 JFR API Guide", path: "Flight Recorder Runtime Guide", publicUrl: "https://docs.oracle.com/en/java/javase/21/jfapi/flight-recorder-runtime-guide.html", usedFor: ["JFR recording", "runtime events", "low-overhead observability"], evidence: "virtual task와 pinning 진단에 사용할 JFR 운영 기반 근거입니다." },
);
