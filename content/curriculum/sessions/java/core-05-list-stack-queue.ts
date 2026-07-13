import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["core-05-list-stack-queue"],
  slug: "core-05-list-stack-queue",
  courseId: "java",
  moduleId: "java-core-functional",
  order: 25,
  title: "ArrayList·LinkedList·Stack·Queue",
  subtitle: "순서·중복·인덱스·양끝 연산 계약을 자료구조 비용과 분리해 읽고, ArrayDeque·bounded queue·불변 경계까지 실제 선택 기준으로 연결합니다.",
  level: "고급",
  estimatedMinutes: 900,
  coreQuestion: "같은 원소들을 저장하더라도 접근·삽입·삭제·양끝 처리·동시성·소유권 요구가 다를 때 어떤 List/Deque/Queue 구현과 API 계약을 선택해야 할까요?",
  summary: "inventory direct3인 javastudy2 class10 Ex01_Stack·Ex02_ArrayList·Ex03_LinkedList와 package 전체7 files(Ex01~Ex06, Test)를 읽고 OpenJDK21.0.11에서 감사했습니다. package7/direct3은 분리 output에서 모두 exit0·compiler output0·warning0이고 모든 files가 public main이라 별도 source dependency는 없습니다. Ex01은 Stack에 중복과 중간 삽입을 수행하고 peek/lastElement가 비파괴, pop이 파괴적임을 보인 뒤 search의 top-based1과 indexOf의 left-based0 차이, iterator 순회, LIFO drain까지 exact35행입니다. Ex02는 ArrayList와 Vector의 ordered index operations·set·iterator를 exact22행으로 비교합니다. Ex03은 LinkedList가 List이자 Deque/Queue인 surface에서 duplicate/index/set 뒤 peek 비파괴, poll/pop head 제거, 남은3개 순회까지 exact14행입니다. package companions인 Ex04/Ex05의 HashMap iteration은 specification상 순서 비보장이므로 key/value pair multiset으로 정규화하고, Ex06 한국→서울→n은 exact2 logical lines, Test는 blank1행으로 확인했습니다. 이 원본을 바탕으로 List ordered/duplicate/index contract, ArrayList capacity와 amortized append·middle shift·RandomAccess·subList view, LinkedList node/deque와 O(n) indexed access·cache/memory 측정, iterator/listIterator fail-fast와 safe remove, legacy Stack 대신 ArrayDeque, LIFO empty contracts, Queue method pairs, bounded backpressure, ArrayDeque 양끝/null/ring caveat, undo/printer queue, defensive copy·unmodifiable·immutable distinctions, concurrent collection 선택 경계까지 확장합니다.",
  objectives: [
    "List의 encounter order·duplicate·zero-based index·equality 계약과 iteration 방법을 구현체와 분리해 설명한다.",
    "ArrayList와 LinkedList의 접근·append·중간 삽입/삭제·memory locality 비용을 Big-O와 측정 한계로 비교한다.",
    "Iterator/ListIterator의 cursor·safe mutation·best-effort fail-fast caveat를 실제 변경 경로별로 적용한다.",
    "legacy Stack 대신 Deque를 사용해 LIFO push/pop/peek와 empty exception/sentinel 계약을 명시한다.",
    "Queue의 exception/special-value method pairs와 bounded capacity/backpressure 정책을 선택한다.",
    "ArrayDeque의 양끝 API·null 금지·resizable circular-array 성격을 public contract와 implementation detail로 구분한다.",
    "defensive copy·unmodifiable view·immutable snapshot·concurrent collections를 alias와 mutation owner 기준으로 선택한다.",
  ],
  prerequisites: [
    { title: "예외·자원 경계", reason: "collection operations의 UnsupportedOperationException·NoSuchElementException과 process/resource cleanup을 정확히 다루려면 예외 전달·finally 계약이 필요합니다.", sessionSlug: "core-03-finally-throws" },
    { title: "제네릭·Collection·Set", reason: "List/Deque/Queue의 element type, Iterator와 generic collection hierarchy를 이해하려면 generic invariance와 Collection 공통 계약이 필요합니다.", sessionSlug: "core-04-set-generics" },
  ],
  keywords: ["List", "ArrayList", "LinkedList", "Vector", "Stack", "Deque", "ArrayDeque", "Queue", "ArrayBlockingQueue", "LIFO", "FIFO", "RandomAccess", "capacity", "amortized", "subList", "Iterator", "ListIterator", "fail-fast", "ConcurrentModificationException", "backpressure", "defensive copy", "unmodifiable view", "immutable snapshot", "CopyOnWriteArrayList", "ConcurrentLinkedQueue"],
  chapters: [
    {
      id: "class10-package7-direct3-golden-audit",
      title: "class10 package7·direct3을 warning0 compile하고 direct exact·Map normalized companions를 fresh JVM으로 감사합니다",
      lead: "HashMap 순서처럼 계약에 없는 우연은 golden string에서 제거하고 List/Stack/Queue의 결정적 순서와 파괴 여부만 강하게 고정합니다.",
      explanations: [
        "class10 package에는 Ex01_Stack·Ex02_ArrayList·Ex03_LinkedList·Ex04_Map·Ex05_Map·Ex06_Map·Test의7 files가 있고 모두 public static void main을 가집니다. direct3은 imports 외 source dependency가 없습니다.",
        "package7과 direct3은 서로 다른 -d directories에서 -encoding UTF-8 --release21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics로 compile하며 exit0·captured compiler output0을 각각 assert합니다.",
        "Ex01 exact35행은 Stack/Vector의 list-style 삽입·중복과 LIFO operations가 섞인 원본입니다. search는 top에서1부터, indexOf는 왼쪽에서0부터라 둘리5/0, 공실이2/2가 되고 마지막 drain은 size5→0입니다.",
        "Ex02 exact22행에는 의도적인 blank2행이 포함됩니다. ArrayList와 Vector 모두 four-element order, set replacement, iterator order를 유지하지만 synchronization 차이만으로 Vector를 기본 선택하지 않습니다.",
        "Ex03 exact14행은 LinkedList의 duplicate List operations 뒤 head peek, poll, pop을 보여 줍니다. 원본 comment의 ‘stack pop은 마지막’은 Stack에는 맞지만 LinkedList.pop은 Deque의 first element 제거라는 차이를 output으로 교정합니다.",
        "Ex04/Ex05 HashMap의 toString/keySet/entrySet order는 API contract가 아니므로 raw 전체 문자열을 exact golden으로 두지 않습니다. Ex04의25행은 raw Map 두 행을 key=value multisets, blank positions3/10, get loop exact6, keySet/entrySet pair multisets6씩, values multiset6과 separator로 전부 분해해 검사하고 Ex05는 first2 exact와 unordered pair set4로 검사합니다.",
        "Ex06은 입력 한국→n에서 `나라...서울`과 trailing continue prompt의 logical2 lines·exit0이고 Test는 stdout LF 하나입니다. companions는 이후 Map 세션 경계를 침범하지 않고 package health만 증명합니다.",
        "JDK_JAVAC_OPTIONS·JDK_JAVA_OPTIONS·JAVA_TOOL_OPTIONS·_JAVA_OPTIONS는 outer try 안에서 전부 snapshot한 뒤 audit process에서 제거하고 child Environment에서도 제거합니다. 초기화 중간 실패도 catch/finally가 보호하며 variable별 restoration과 temp direct-child cleanup을 서로 독립적으로 시도합니다. async stream drain, stdin close, 10초 timeout, tree kill, 5초 termination grace와 Dispose도 적용합니다.",
      ],
      concepts: [
        { term: "exact contract", definition: "순서·문자·line count가 API와 fixture에서 결정적인 output을 byte/LF normalized value로 비교하는 검증입니다.", detail: ["List encounter order에 적합합니다.", "계약 밖 순서를 넣지 않습니다."] },
        { term: "normalized contract", definition: "Map iteration처럼 순서 비보장인 부분을 set/multiset·shape·count로 바꿔 의미만 비교하는 검증입니다.", detail: ["정렬이 의미를 바꾸지 않을 때만 정렬합니다.", "필수 multiplicity를 유지합니다."] },
        { term: "role inventory", definition: "source별 public main·compile-only·dependency 역할을 세어 compile/run 범위를 정하는 과정입니다.", detail: ["package7 main7입니다.", "direct3 main3입니다."] },
      ],
      codeExamples: [{
        id: "powershell-original-core05-audit",
        title: "direct exact35/22/14와 companion normalized25/6/2/1을 hostile environment에서 재현합니다",
        language: "powershell",
        filename: "verify-original-core05.ps1",
        purpose: "원본의 ordered sequence는 exact로, HashMap unordered sequence는 multiset으로 검증하고 source API shapes까지 고정합니다.",
        code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("core05 audit " + [Guid]::NewGuid().ToString("N"))
$launcherNames = @("JDK_JAVAC_OPTIONS", "JDK_JAVA_OPTIONS", "JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS")
$savedLauncher = @{}
$rootCreated = $false
$environmentMutationStarted = $false
$failure = $null
try {
  if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }
  New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
  $rootCreated = $true
  foreach ($name in $launcherNames) {
    if (Test-Path "Env:$name") { $savedLauncher[$name] = (Get-Item "Env:$name").Value }
  }
  $environmentMutationStarted = $true
  foreach ($name in $launcherNames) { Remove-Item "Env:$name" -ErrorAction SilentlyContinue }
  $lf = [string][char]10
  $crlf = [string][char]13 + [char]10
  $source = "src\com\java\class10"
  $all = @(Get-ChildItem -LiteralPath $source -Filter "*.java" | Sort-Object Name | ForEach-Object FullName)
  $directNames = @("Ex01_Stack.java", "Ex02_ArrayList.java", "Ex03_LinkedList.java")
  $direct = @($directNames | ForEach-Object { Join-Path $source $_ })
  $packageOut = Join-Path $root "package classes"
  $directOut = Join-Path $root "direct classes"
  New-Item -ItemType Directory -Path $packageOut, $directOut -ErrorAction Stop | Out-Null

  $packageCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $packageOut $all 2>&1)
  $packageExit = $LASTEXITCODE
  $directCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $directOut $direct 2>&1)
  $directExit = $LASTEXITCODE
  if ($all.Count -ne 7 -or $packageExit -ne 0 -or $packageCompiler.Count -ne 0) { throw "package compile drift" }
  if ($direct.Count -ne 3 -or $directExit -ne 0 -or $directCompiler.Count -ne 0) { throw "direct compile drift" }
  $mainPattern = 'public\s+static\s+void\s+main\s*\('
  $packageMains = @($all | Where-Object { (Get-Content -Raw -LiteralPath $_) -match $mainPattern }).Count
  $directMains = @($direct | Where-Object { (Get-Content -Raw -LiteralPath $_) -match $mainPattern }).Count
  if ($packageMains -ne 7 -or $directMains -ne 3) { throw "main role drift" }

  function Invoke-Java([string]$classes, [string]$main, [string]$stdin = "") {
    $start = [Diagnostics.ProcessStartInfo]::new()
    $start.FileName = (Get-Command java -ErrorAction Stop).Source
    foreach ($arg in @("-Dfile.encoding=UTF-8", "-cp", $classes, $main)) { [void]$start.ArgumentList.Add($arg) }
    $start.WorkingDirectory = $root
    $start.UseShellExecute = $false
    $start.RedirectStandardInput = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $start.StandardOutputEncoding = [Text.UTF8Encoding]::new($false)
    $start.StandardErrorEncoding = [Text.UTF8Encoding]::new($false)
    foreach ($name in $launcherNames) { [void]$start.Environment.Remove($name) }
    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $start
    try {
      if (-not $process.Start()) { throw "process start failed" }
      $stdoutTask = $process.StandardOutput.ReadToEndAsync()
      $stderrTask = $process.StandardError.ReadToEndAsync()
      $process.StandardInput.Write($stdin)
      $process.StandardInput.Close()
      if (-not $process.WaitForExit(10000)) {
        $process.Kill($true)
        if (-not $process.WaitForExit(5000)) { throw "java process did not stop after kill" }
        [void]$stdoutTask.GetAwaiter().GetResult(); [void]$stderrTask.GetAwaiter().GetResult()
        throw "java process timeout"
      }
      [pscustomobject]@{
        Exit = $process.ExitCode
        Out = $stdoutTask.GetAwaiter().GetResult().Replace($crlf, $lf)
        Err = $stderrTask.GetAwaiter().GetResult().Replace($crlf, $lf)
      }
    } finally { $process.Dispose() }
  }

  $ex01 = Invoke-Java $directOut "com.java.class10.Ex01_Stack"
  $ex02 = Invoke-Java $directOut "com.java.class10.Ex02_ArrayList"
  $ex03 = Invoke-Java $directOut "com.java.class10.Ex03_LinkedList"
  $ex04 = Invoke-Java $packageOut "com.java.class10.Ex04_Map"
  $ex05 = Invoke-Java $packageOut "com.java.class10.Ex05_Map"
  $ex06 = Invoke-Java $packageOut "com.java.class10.Ex06_Map" ("한국" + $lf + "n" + $lf)
  $test = Invoke-Java $packageOut "com.java.class10.Test"

  $expected01 = @(
    "[둘리, 공실이, 마이콜]", "[둘리, 고길동, 공실이, 마이콜]", "[둘리, 고길동, 공실이, 희동이, 마이콜]",
    "[둘리, 고길동, 공실이, 공실이, 희동이, 마이콜]", "마이콜", "[둘리, 고길동, 공실이, 공실이, 희동이, 마이콜]",
    "마이콜", "[둘리, 고길동, 공실이, 공실이, 희동이, 마이콜]", "마이콜", "[둘리, 고길동, 공실이, 공실이, 희동이]",
    "5", "0", "2", "2", "공실이", "공실이", "둘리", "[둘리, 도우너, 공실이, 공실이, 희동이]",
    "[둘리, 도우너, 마이콜, 공실이, 희동이]", "둘리님 환영합니다.", "도우너님 환영합니다.", "마이콜님 환영합니다.",
    "공실이님 환영합니다.", "희동이님 환영합니다.", "[둘리, 도우너, 마이콜, 공실이, 희동이] s1 크기는 5이다.",
    "희동이", "[둘리, 도우너, 마이콜, 공실이] s1 크기는 4이다.", "공실이", "[둘리, 도우너, 마이콜] s1 크기는 3이다.",
    "마이콜", "[둘리, 도우너] s1 크기는 2이다.", "도우너", "[둘리] s1 크기는 1이다.", "둘리", "[] s1 크기는 0이다."
  )
  $lines01 = @($ex01.Out.TrimEnd([char]10).Split([char]10))
  if ($ex01.Exit -ne 0 -or $ex01.Err.Length -ne 0 -or (Compare-Object $lines01 $expected01 -SyncWindow 0).Count -ne 0) { throw "Ex01 exact drift" }

  $expected02 = @(
    "[공실이, 마이콜, 둘리]", "[차두리, 박지성, 손흥민]", "[공실이, 고길동, 마이콜, 둘리]", "[차두리, 안정환, 박지성, 손흥민]", "",
    "2", "마이콜", "", "0", "박지성", "[공실이, 고길동, 마이콜, 둘리]", "[차두리, 안정환, 박지성, 손흥민]",
    "[공실이, 고길동, 도우너, 둘리]", "[차범근, 안정환, 박지성, 손흥민]", "공실이", "고길동", "도우너", "둘리",
    "차범근", "안정환", "박지성", "손흥민"
  )
  $lines02 = @($ex02.Out.TrimEnd([char]10).Split([char]10))
  if ($ex02.Exit -ne 0 -or $ex02.Err.Length -ne 0 -or (Compare-Object $lines02 $expected02 -SyncWindow 0).Count -ne 0) { throw "Ex02 exact drift" }

  $expected03 = @(
    "[고길동, 공실이, 도우너, 둘리, 고길동]", "3", "공실이", "[고길동, 공실이, 도우너, 둘리, 마이콜]", "", "고길동",
    "[고길동, 공실이, 도우너, 둘리, 마이콜]", "고길동", "[공실이, 도우너, 둘리, 마이콜]", "공실이",
    "[도우너, 둘리, 마이콜]", "도우너", "둘리", "마이콜"
  )
  $lines03 = @($ex03.Out.TrimEnd([char]10).Split([char]10))
  if ($ex03.Exit -ne 0 -or $ex03.Err.Length -ne 0 -or (Compare-Object $lines03 $expected03 -SyncWindow 0).Count -ne 0) { throw "Ex03 exact drift" }

  $lines04 = @($ex04.Out.TrimEnd([char]10).Split([char]10))
  function Get-DelimitedItems([string]$line, [char]$open, [char]$close) {
    if ($line.Length -lt 2 -or $line[0] -cne $open -or $line[$line.Length - 1] -cne $close) { throw "invalid delimited output" }
    $inner = $line.Substring(1, $line.Length - 2)
    if ($inner.Length -eq 0) { return @() }
    @($inner.Split([char]',') | ForEach-Object Trim)
  }
  $mapBefore04 = @(Get-DelimitedItems $lines04[0] ([char]'{') ([char]'}') | Sort-Object)
  $mapAfter04 = @(Get-DelimitedItems $lines04[1] ([char]'{') ([char]'}') | Sort-Object)
  $values04 = @(Get-DelimitedItems $lines04[17] ([char]'[') ([char]']') | Sort-Object)
  $expectedMapBefore04 = @("0=한국", "1=중국", "2=일본", "3=미국") | Sort-Object
  $expectedMapAfter04 = @("0=한국", "1=중국", "2=태국", "3=미국", "4=한국") | Sort-Object
  $expectedValues04 = @("한국", "한국", "한국", "중국", "태국", "미국") | Sort-Object
  $expectedPairs04 = @("0 : 한국", "1 : 중국", "2 : 태국", "3 : 미국", "4 : 한국", "10 : 한국") | Sort-Object
  $keyPairs04 = @($lines04[11..16] | Sort-Object)
  $entryPairs04 = @($lines04[19..24] | Sort-Object)
  $blankPositions04 = @(0..24 | Where-Object { $lines04[$_] -ceq "" })
  if ($ex04.Exit -ne 0 -or $ex04.Err.Length -ne 0 -or $lines04.Count -ne 25 -or
      (Compare-Object $mapBefore04 $expectedMapBefore04 -SyncWindow 0).Count -ne 0 -or
      (Compare-Object $mapAfter04 $expectedMapAfter04 -SyncWindow 0).Count -ne 0 -or
      $lines04[2] -cne "태국" -or (Compare-Object $blankPositions04 @(3, 10) -SyncWindow 0).Count -ne 0 -or
      (Compare-Object @($lines04[4..9]) @("한국", "중국", "태국", "미국", "한국", "null") -SyncWindow 0).Count -ne 0 -or
      (Compare-Object $keyPairs04 $expectedPairs04 -SyncWindow 0).Count -ne 0 -or
      (Compare-Object $values04 $expectedValues04 -SyncWindow 0).Count -ne 0 -or $lines04[18] -cne "===============" -or
      (Compare-Object $entryPairs04 $expectedPairs04 -SyncWindow 0).Count -ne 0) { throw "Ex04 normalized drift" }

  $lines05 = @($ex05.Out.TrimEnd([char]10).Split([char]10))
  $expectedPairs05 = @("나이 : 24", "이름 : 고길동", "주소 : 서울시 방학동", "취미 : 운동") | Sort-Object
  if ($ex05.Exit -ne 0 -or $ex05.Err.Length -ne 0 -or $lines05.Count -ne 6 -or $lines05[0] -cne "고길동" -or $lines05[1] -cne "24" -or
      (Compare-Object @($lines05[2..5] | Sort-Object) $expectedPairs05 -SyncWindow 0).Count -ne 0) { throw "Ex05 normalized drift" }
  $expected06 = "나라를 입력하세요. >> 서울" + $lf + "계속하시겠습니까?(y/n) >> "
  if ($ex06.Exit -ne 0 -or $ex06.Err.Length -ne 0 -or $ex06.Out -cne $expected06) { throw "Ex06 exact drift" }
  if ($test.Exit -ne 0 -or $test.Err.Length -ne 0 -or $test.Out -cne $lf) { throw "Test exact drift" }

  function Remove-JavaComments([string]$text) {
    $withoutBlocks = [regex]::Replace($text, '(?s)/\*.*?\*/', '')
    [regex]::Replace($withoutBlocks, '(?m)//.*$', '')
  }
  $stackSource = Remove-JavaComments (Get-Content -Raw -LiteralPath (Join-Path $source "Ex01_Stack.java"))
  $arraySource = Remove-JavaComments (Get-Content -Raw -LiteralPath (Join-Path $source "Ex02_ArrayList.java"))
  $linkedSource = Remove-JavaComments (Get-Content -Raw -LiteralPath (Join-Path $source "Ex03_LinkedList.java"))
  $stackNew = [regex]::Matches($stackSource, 'new\s+Stack\s*<').Count
  $stackPush = [regex]::Matches($stackSource, '\.push\s*\(').Count
  $stackPop = [regex]::Matches($stackSource, '\.pop\s*\(').Count
  $stackPeek = [regex]::Matches($stackSource, '\.peek\s*\(').Count
  $arrayNew = [regex]::Matches($arraySource, 'new\s+ArrayList\s*<').Count
  $vectorNew = [regex]::Matches($arraySource, 'new\s+Vector\s*<').Count
  $linkedNew = [regex]::Matches($linkedSource, 'new\s+LinkedList\s*<').Count
  $offer = [regex]::Matches($linkedSource, '\.offer\s*\(').Count
  $poll = [regex]::Matches($linkedSource, '\.poll\s*\(').Count
  $linkedPop = [regex]::Matches($linkedSource, '\.pop\s*\(').Count
  $linkedPeek = [regex]::Matches($linkedSource, '\.peek\s*\(').Count
  if ($stackNew -ne 1 -or $stackPush -ne 1 -or $stackPop -ne 2 -or $stackPeek -ne 1 -or $arrayNew -ne 1 -or $vectorNew -ne 1 -or
      $linkedNew -ne 1 -or $offer -ne 1 -or $poll -ne 1 -or $linkedPop -ne 1 -or $linkedPeek -ne 1) { throw "direct source shape drift" }

  "spacePath=$($root.Contains(' ')),package=7|exit:$packageExit|compilerLines:$($packageCompiler.Count)|mains:$packageMains,direct=3|exit:$directExit|compilerLines:$($directCompiler.Count)|mains:$directMains"
  "direct=Ex01:35|drain0:True|search:5,0,2,2;Ex02:22|list4|vector4;Ex03:14|remaining3"
  "companions=Ex04:25|pairs12|unordered:True;Ex05:6|pairs4|unordered:True;Ex06:2|capital:서울;Test:1"
  "shapes=Stack:new$stackNew|push$stackPush|pop$stackPop|peek$stackPeek;ArrayList:new$arrayNew|Vector:new$vectorNew;LinkedList:new$linkedNew|offer$offer|poll$poll|pop$linkedPop|peek$linkedPeek|launcherOptions:$($launcherNames.Count)"
} catch {
  $failure = $_.Exception
} finally {
  $cleanupMessages = [Collections.Generic.List[string]]::new()
  if ($environmentMutationStarted) {
    foreach ($name in $launcherNames) {
      try {
        Remove-Item "Env:$name" -ErrorAction SilentlyContinue
        if ($savedLauncher.ContainsKey($name)) { Set-Item "Env:$name" $savedLauncher[$name] -ErrorAction Stop }
      } catch { $cleanupMessages.Add("environment $name restore failed: $($_.Exception.Message)") }
    }
  }
  try {
    if ($rootCreated) {
      $resolved = [IO.Path]::GetFullPath($root)
      if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
      if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }
      if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" }
    }
  } catch { $cleanupMessages.Add("temp cleanup failed: $($_.Exception.Message)") }
  if ($cleanupMessages.Count -gt 0) {
    $cleanupText = $cleanupMessages -join " | "
    if ($null -eq $failure) { $failure = [Exception]::new($cleanupText) }
    else { $failure = [Exception]::new(($failure.Message + " | " + $cleanupText), $failure) }
  }
}
if ($null -ne $failure) { throw $failure }`,
        walkthrough: [
            { lines: "1-25", explanation: "outer try 안에서 공백 OS temp direct child를 만들고 launcher variables4를 전부 snapshot한 뒤 제거하며 package7/direct3 output directories를 준비합니다." },
            { lines: "27-36", explanation: "package/direct warning0 compile과 public main roles7|3을 검증합니다." },
            { lines: "38-70", explanation: "child environment 격리, UTF-8 async drain, stdin close, 10초 timeout·tree kill·5초 termination grace·Dispose를 구현합니다." },
            { lines: "72-100", explanation: "direct3·companions4를 fresh JVM으로 실행하고 Ex01 exact35와 Ex02 exact22를 검사합니다." },
            { lines: "102-134", explanation: "Ex03 exact14 뒤 Ex04 raw maps·blank positions·get values·key/entry pairs·values·separator를 합쳐25행 전체를 order-neutral 검증합니다." },
            { lines: "136-142", explanation: "Ex05 unordered pair set, Ex06 exact prompt/capital, Test blank line을 검증합니다." },
            { lines: "144-195", explanation: "direct source API shapes와 stable summary를 만든 뒤 catch/finally에서 launcher restoration과 temp cleanup을 각각 독립 시도하고 보존한 failure를 다시 던집니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11", "javastudy2/classstudy root", "four Java launcher option variables isolated and restored", "10-second runtime timeout plus 5-second termination grace per Java child"], command: "pwsh -NoProfile -File verify-original-core05.ps1" },
        output: { value: "spacePath=True,package=7|exit:0|compilerLines:0|mains:7,direct=3|exit:0|compilerLines:0|mains:3\ndirect=Ex01:35|drain0:True|search:5,0,2,2;Ex02:22|list4|vector4;Ex03:14|remaining3\ncompanions=Ex04:25|pairs12|unordered:True;Ex05:6|pairs4|unordered:True;Ex06:2|capital:서울;Test:1\nshapes=Stack:new1|push1|pop2|peek1;ArrayList:new1|Vector:new1;LinkedList:new1|offer1|poll1|pop1|peek1|launcherOptions:4", explanation: ["ordered direct outputs는 blank lines까지 exact입니다.", "Ex04의 raw maps·blank positions·get values·key/entry pair multisets·values multiset·separator를 합쳐25행 전체 의미를 검증합니다.", "LinkedList.pop은 head removal이고 direct final remaining3을 보존합니다.", "package/direct 모두 warning0이며 source API shapes와 launcher isolation을 함께 확인합니다."] },
        experiments: [
          { change: "Ex04 HashMap 전체 stdout을 한 exact golden으로 바꿉니다.", prediction: "다른 JVM/구현의 valid iteration order에서 false failure가 납니다.", result: "계약 밖 순서는 pair multiset으로 정규화합니다." },
          { change: "Ex01 iterator loop에서 s1.remove를 직접 호출합니다.", prediction: "best-effort fail-fast ConcurrentModificationException이 발생할 수 있습니다.", result: "iterator 자체 remove 또는 별도 수집 후 bulk mutation을 사용합니다." },
          { change: "Ex03의 pop을 removeLast로 바꿉니다.", prediction: "고길동 poll 뒤 tail 마이콜이 제거되어 remaining order가 달라집니다.", result: "LinkedList.pop은 removeFirst alias이며 Stack.pop과 end가 다릅니다." },
        ],
        sourceRefs: ["java-class10-ex01", "java-class10-ex02", "java-class10-ex03", "java-class10-ex04", "java-class10-ex05", "java-class10-ex06", "java-class10-test", "jdk21-javac", "dotnet-process-start-info", "powershell-environment-variables", "dotnet-process-environment", "dotnet-process-lifecycle", "dotnet-stream-reader-async", "java-hashmap-api"],
      }],
      diagnostics: [
        { symptom: "HashMap companion output 순서가 달라 package audit가 실패한다.", likelyCause: "API가 보장하지 않는 iteration/toString order를 exact golden으로 저장했습니다.", checks: ["Map implementation contract를 봅니다.", "key/value pairs와 multiplicity를 비교합니다.", "LinkedHashMap 요구인지 확인합니다."], fix: "unordered 부분은 pair multiset으로 정규화하고 order가 요구되면 적합한 implementation을 선택합니다.", prevention: "golden test마다 ordered/unordered 근거를 sourceRefs와 함께 기록합니다." },
        { symptom: "원본 main 하나가 hang하거나 환경에서만 output이 바뀐다.", likelyCause: "stdin close·timeout·launcher environment를 통제하지 않았습니다.", checks: ["fresh process인지 봅니다.", "launcher options4를 audit/child에서 확인합니다.", "async drain과 kill grace를 확인합니다."], fix: "공백 temp, closed stdin, hostile4 isolation, 10초+5초 lifecycle과 finally cleanup을 적용합니다.", prevention: "process harness를 다른 세션과 같은 검증 계약으로 유지합니다." },
      ],
      expertNotes: ["HashMap normalized audit는 Map 학습을 대신하지 않고 class10 package가 direct3과 함께 건강한지만 확인합니다.", "원본 Stack/Vector code가 warning0라는 사실은 현대 API 선택으로서 권장된다는 뜻이 아닙니다. compile validity와 design recommendation을 분리합니다."],
    },
    {
      id: "list-contract-order-duplicates-index-iteration",
      title: "List는 encounter order·중복·zero-based position을 보존하고 equals로 검색합니다",
      lead: "ArrayList/LinkedList 같은 저장 방식보다 먼저 모든 List 구현이 공유하는 관찰 가능한 계약을 고정합니다.",
      explanations: [
        "List는 원소의 encounter order를 유지하는 ordered collection입니다. 같은 value를 여러 위치에 저장할 수 있고 각 위치는0부터 size-1까지의 index로 식별됩니다.",
        "List가 변경 연산을 지원한다면 add(E)는 sequence 끝에 추가하고 add(index,E)는 기존 index 이후 원소를 오른쪽으로 이동시키는 의미 계약입니다. 그러나 add·set·remove는 optional operations라 immutable/unmodifiable/fixed-size 등 구현은 UnsupportedOperationException을 던질 수 있습니다. 이 장의 ArrayList는 해당 변경을 지원하며 실제 비용은 구현체가 결정합니다.",
        "get/set/remove(index)는 position 기반이고 contains/indexOf/lastIndexOf/remove(Object)는 equals 기반입니다. mutable element의 equals/hashCode 관련 fields를 바꾸면 검색 의미가 바뀔 수 있습니다.",
        "set은 size를 바꾸지 않고 이전 원소를 반환합니다. remove(index)는 제거된 원소를 반환하고 뒤 positions가 한 칸 당겨집니다. overload된 remove(int)/remove(Object)는 Integer list에서 특히 주의합니다.",
        "index loop는 position이 필요한 ArrayList에 자연스럽지만 LinkedList에서 반복 get(i)를 쓰면 매번 node traversal로 O(n²)이 될 수 있습니다. 일반 순회는 enhanced for/Iterator를 기본으로 둡니다.",
        "Iterator는 encounter order를 따르고 read-only traversal에는 implementation-neutral합니다. mutation이 필요하면 iterator.remove/ListIterator operations처럼 iterator protocol을 사용하되 이 변경 methods 자체도 optional이라 UnsupportedOperationException일 수 있습니다. concrete collection/iterator contract를 먼저 확인합니다.",
        "List equality도 같은 size와 각 position의 equal elements를 비교하므로 구현체가 달라도 sequence가 같으면 equals true입니다. 성능 구현과 value semantics를 분리할 수 있습니다.",
      ],
      concepts: [
        { term: "encounter order", definition: "iteration과 index observation에서 원소가 나타나는 정의된 sequence 순서입니다.", detail: ["List의 핵심 계약입니다.", "HashMap iteration과 다릅니다."] },
        { term: "positional access", definition: "zero-based index로 특정 sequence 위치를 읽거나 바꾸는 API입니다.", detail: ["valid range를 확인합니다.", "구현별 시간 비용이 다릅니다."] },
        { term: "duplicate", definition: "equals한 value가 서로 다른 positions에 둘 이상 존재할 수 있는 List 성질입니다.", detail: ["indexOf는 첫 위치입니다.", "lastIndexOf는 마지막 위치입니다."] },
      ],
      codeExamples: [{
        id: "java-list-contract",
        title: "중복·삽입·set return·검색·두 iteration을 sequence로 확인합니다",
        language: "java",
        filename: "ListContract.java",
        purpose: "구현 detail 없이 List interface의 ordered position semantics를 exact output으로 고정합니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.StringJoiner;

public class ListContract {
    public static void main(String[] args) {
        List<String> values = new ArrayList<>(List.of("A", "B", "A"));
        values.add(1, "X");
        String previous = values.set(2, "C");

        System.out.println("values=" + values);
        System.out.println("previous=" + previous);
        System.out.println("firstA=" + values.indexOf("A"));
        System.out.println("lastA=" + values.lastIndexOf("A"));
        System.out.println("duplicateA=" + (values.indexOf("A") != values.lastIndexOf("A")));

        StringJoiner indexed = new StringJoiner("|");
        for (int i = 0; i < values.size(); i++) {
            indexed.add(i + ":" + values.get(i));
        }
        System.out.println("indexed=" + indexed);

        StringJoiner iterated = new StringJoiner("|");
        for (String value : values) iterated.add(value);
        System.out.println("iterated=" + iterated);
        System.out.println("crossImplEqual=" + values.equals(List.of("A", "X", "C", "A")));
    }
}`,
        walkthrough: [
          { lines: "1-9", explanation: "List interface reference에 duplicate A를 만들고 index1 insert 뒤 index2 set의 이전값 B를 보존합니다." },
          { lines: "11-15", explanation: "sequence, set return, first/last duplicate positions를 출력합니다." },
          { lines: "17-26", explanation: "index가 필요한 순회와 implementation-neutral enhanced-for 순회가 같은 encounter order를 만드는지 확인합니다." },
            { lines: "26-28", explanation: "다른 List factory 구현과도 position별 elements가 같으면 equals true임을 검증합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("ListContract.java", "ListContract") },
        output: { value: "values=[A, X, C, A]\nprevious=B\nfirstA=0\nlastA=3\nduplicateA=true\nindexed=0:A|1:X|2:C|3:A\niterated=A|X|C|A\ncrossImplEqual=true", explanation: ["insert는 뒤 positions를 이동시키고 set은 size를 유지합니다.", "A가 positions0/3에 중복됩니다.", "두 iteration과 cross-implementation equality가 같은 sequence를 봅니다."] },
        experiments: [
          { change: "`values.remove(1)`을 호출합니다.", prediction: "index overload라 X를 제거하고 C/A가 왼쪽으로 이동합니다.", result: "position removal과 object removal을 구분합니다." },
          { change: "List<Integer>에서 remove(1)를 값1 제거로 사용합니다.", prediction: "index1을 제거합니다.", result: "값을 제거하려면 remove(Integer.valueOf(1))처럼 overload를 명확히 합니다." },
        ],
        sourceRefs: ["java-class10-ex01", "java-class10-ex02", "java-class10-ex03", "java-list-api", "java-iterator-api"],
      }],
      diagnostics: [
        { symptom: "List<Integer>.remove(1)이 값1이 아닌 두 번째 원소를 지운다.", likelyCause: "remove(int index) overload가 선택됐습니다.", checks: ["compile-time argument type을 봅니다.", "remove overload signatures를 확인합니다.", "before/after sequence를 출력합니다."], fix: "값 제거는 remove(Integer.valueOf(1)), 위치 제거는 remove(index)로 의도를 드러냅니다.", prevention: "numeric element list tests에 두 overload를 포함합니다." },
        { symptom: "LinkedList index loop가 데이터 증가 때 급격히 느려진다.", likelyCause: "get(i)가 매번 head/tail에서 node를 순회해 전체 O(n²)이 됐습니다.", checks: ["loop 안 get(index)를 찾습니다.", "RandomAccess marker를 확인합니다.", "iterator version과 profile합니다."], fix: "position이 불필요하면 enhanced for/Iterator를 사용합니다.", prevention: "List parameter algorithm은 RandomAccess 분기보다 먼저 iterator로 표현 가능한지 검토합니다." },
      ],
      expertNotes: ["List.of가 만든 list는 null과 mutation을 허용하지 않지만 그 사실은 List interface 일반 계약이 아닙니다.", "contains/indexOf 성능은 equals 비용까지 포함하므로 element의 깊은 equality가 비싸면 단순 O(n) 표기보다 실제 비용이 큽니다."],
    },
    {
      id: "arraylist-capacity-amortized-random-access",
      title: "ArrayList는 contiguous reference array로 random access가 빠르지만 growth와 middle shift 비용을 가집니다",
      lead: "size와 capacity를 구분하고 amortized O(1)을 ‘모든 append가 O(1)’로 오해하지 않도록 occasional resize까지 설명합니다.",
      explanations: [
        "ArrayList의 public size는 저장된 elements 수이고 internal capacity는 재할당 없이 담을 수 있는 backing array slots입니다. capacity 값과 growth factor는 public contract가 아니므로 reflection에 의존한 test를 만들지 않습니다.",
        "get/set은 index로 backing array slot에 접근해 O(1)이고 ArrayList는 RandomAccess marker를 구현합니다. bounds check와 element access는 상수 시간이지만 CPU cache/locality까지 포함한 실제 latency는 workload에 따라 달라집니다.",
        "끝 append는 capacity가 남으면 O(1), 부족하면 더 큰 array 할당과 기존 references 복사가 필요해 O(n)입니다. 여러 append에 비용을 분산한 amortized O(1)이지 각 호출 worst-case O(1)이 아닙니다.",
        "middle add/remove는 뒤 references를 System.arraycopy 계열로 이동시켜 O(n)입니다. memory contiguous copy라 linked traversal보다 실제로 빠를 수 있어 Big-O만으로 작은/중간 데이터 선택을 단정하지 않습니다.",
        "ensureCapacity는 예상 element 수를 알 때 reallocations를 줄이는 hint이며 size를 늘리지 않습니다. 지나치게 크게 잡으면 unused memory와 GC pressure가 생깁니다.",
        "trimToSize는 capacity를 현재 size에 가깝게 줄이려는 요청이지 semantic contents 변화가 아닙니다. 다시 growth할 list에 반복 호출하면 shrink/grow thrashing을 만들 수 있습니다.",
        "RandomAccess는 algorithm이 indexed traversal에 적합한지 판단하는 marker일 뿐 concurrency, mutability, constant exact latency를 보장하지 않습니다.",
      ],
      concepts: [
        { term: "capacity", definition: "backing storage 재할당 없이 수용 가능한 elements 수에 관한 implementation state입니다.", detail: ["size와 다릅니다.", "정확한 growth policy는 contract가 아닙니다."] },
        { term: "amortized cost", definition: "일부 비싼 operations 비용을 긴 operation sequence 전체에 분산해 계산한 평균적 상한입니다.", detail: ["single-call worst case와 다릅니다.", "append sequence 분석에 사용합니다."] },
        { term: "RandomAccess", definition: "List가 빠른 일반적 random indexed access를 지원한다는 marker interface입니다.", detail: ["method가 없습니다.", "algorithm hint입니다."] },
      ],
      codeExamples: [{
        id: "java-arraylist-cost-surface",
        title: "ensure/trim이 contents를 바꾸지 않고 middle operations가 suffix를 이동시키는 의미를 추적합니다",
        language: "java",
        filename: "ArrayListCostSurface.java",
        purpose: "private capacity를 추측하지 않고 public sequence·size·RandomAccess와 이동 대상 수를 deterministic하게 계산합니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.RandomAccess;

public class ArrayListCostSurface {
    public static void main(String[] args) {
        ArrayList<Integer> values = new ArrayList<>(1);
        values.ensureCapacity(16);
        for (int i = 0; i < 8; i++) values.add(i);

        int insertIndex = 3;
        int insertionSuffix = values.size() - insertIndex;
        values.add(insertIndex, 99);

        int removeIndex = 5;
        int removalSuffix = values.size() - removeIndex - 1;
        int removed = values.remove(removeIndex);
        values.trimToSize();

        System.out.println("randomAccess=" + (values instanceof RandomAccess));
        System.out.println("size=" + values.size());
        System.out.println("values=" + values);
        System.out.println("removed=" + removed);
        System.out.println("logicalShiftTargets=" + insertionSuffix + "," + removalSuffix);
    }
}`,
        walkthrough: [
          { lines: "1-8", explanation: "initial capacity1로 만들고 ensureCapacity16 뒤 eight values를 append하지만 capacity 자체는 관찰 계약으로 출력하지 않습니다." },
          { lines: "10-17", explanation: "index3 insert와 index5 remove 직전 suffix 원소 수를 semantic 이동 대상 상한으로 계산합니다." },
          { lines: "18-25", explanation: "trim 뒤에도 RandomAccess, size8, contents와 removed4가 유지됨을 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("ArrayListCostSurface.java", "ArrayListCostSurface") },
        output: { value: "randomAccess=true\nsize=8\nvalues=[0, 1, 2, 99, 3, 5, 6, 7]\nremoved=4\nlogicalShiftTargets=5,3", explanation: ["ensure/trim은 semantic size/contents를 임의로 바꾸지 않습니다.", "insert 뒤 suffix5, remove 뒤 suffix3 references가 논리적으로 position을 이동합니다.", "ArrayList는 RandomAccess marker입니다."] },
        experiments: [
          { change: "매 append 뒤 trimToSize를 호출합니다.", prediction: "contents는 같지만 다음 append가 반복 재할당할 가능성이 커집니다.", result: "capacity tuning은 안정된 lifecycle phase에서만 측정 후 적용합니다." },
          { change: "initial/ensure capacity를 매우 크게 잡습니다.", prediction: "resize 횟수는 줄 수 있지만 unused reference array memory가 늘어납니다.", result: "예상 upper bound와 memory budget을 함께 봅니다." },
        ],
        sourceRefs: ["java-class10-ex02", "java-arraylist-api", "java-random-access-api", "openjdk-arraylist-source"],
      }],
      diagnostics: [
        { symptom: "ensureCapacity(1000) 뒤 size가1000이라고 기대했다.", likelyCause: "capacity와 logical element count를 혼동했습니다.", checks: ["size()를 확인합니다.", "get(0)이 가능한지 봅니다.", "ensureCapacity API를 읽습니다."], fix: "elements는 add로 넣고 ensureCapacity는 storage hint로만 사용합니다.", prevention: "size/capacity를 별도 columns로 문서화합니다." },
        { symptom: "amortized O(1) append인데 latency spike가 발생한다.", likelyCause: "capacity growth call의 O(n) copy를 single-call worst case에서 놓쳤습니다.", checks: ["list growth phase를 profile합니다.", "allocation/GC events를 봅니다.", "예상 size가 있는지 확인합니다."], fix: "측정된 upper estimate에 ensureCapacity를 적용하거나 bounded structure를 검토합니다.", prevention: "tail latency 요구에는 amortized 평균과 worst-case를 함께 기록합니다." },
      ],
      expertNotes: ["OpenJDK growth formula는 학습 참고가 될 수 있지만 Java SE API compatibility contract가 아니므로 application correctness가 의존하면 안 됩니다.", "primitive 대량 데이터는 ArrayList<Integer> boxing/indirection 비용이 커질 수 있어 primitive-specialized library나 arrays를 별도 검토합니다."],
    },
    {
      id: "arraylist-sublist-view-and-aliasing",
      title: "subList는 독립 복사본이 아니라 parent의 range view이며 외부 structural modification은 계약 밖 상태를 만듭니다",
      lead: "view·unmodifiable view·immutable snapshot의 alias 방향을 실제 변경 반영으로 구분합니다.",
      explanations: [
        "subList(from,to)는 from inclusive, to exclusive range의 view를 반환합니다. view의 set/add/remove는 backing parent에 반영되고 parent positions도 함께 바뀝니다.",
        "view가 아닌 경로로 parent를 structurally modify하면 subList semantics는 undefined입니다. 구현이 ConcurrentModificationException을 던질 수 있지만 그것을 portable correctness mechanism으로 의존하면 안 됩니다.",
        "non-structural set은 size를 바꾸지 않지만 어떤 경로의 set이 view에서 안전한지는 API contract와 active range를 따릅니다. alias가 여러 계층에 퍼지면 mutation owner를 하나로 제한합니다.",
        "List.copyOf(view)는 현재 elements의 unmodifiable snapshot을 만듭니다. 이후 parent/view structural changes가 snapshot sequence에 반영되지 않습니다.",
        "Collections.unmodifiableList(parent)는 mutation method를 막는 wrapper view일 뿐 parent alias의 변경은 보입니다. read-only facade와 immutable value를 같은 말로 쓰지 않습니다.",
        "subList.clear는 range bulk deletion에 유용하고 보통 parent에서 연속 range를 한 번에 제거하는 의도를 명확히 합니다. from/to bounds와 빈 range를 test합니다.",
        "장기 보관할 subList는 작은 view가 큰 backing ArrayList lifetime을 유지할 수 있다는 implementation/memory consideration이 있습니다. 독립 lifetime이면 copy를 고려합니다.",
      ],
      concepts: [
        { term: "view", definition: "별도 storage copy 없이 backing collection의 일부/전체를 다른 API surface로 보여 주는 object입니다.", detail: ["변경이 양방향 반영될 수 있습니다.", "backing lifetime과 연결됩니다."] },
        { term: "structural modification", definition: "collection size를 바꾸거나 iteration을 방해하는 방식으로 구조를 변경하는 operation입니다.", detail: ["add/remove/clear가 대표입니다.", "set은 일반적으로 non-structural입니다."] },
        { term: "snapshot", definition: "특정 시점 elements를 독립 storage/value로 복사해 이후 source changes와 분리한 collection입니다.", detail: ["shallow element copy일 수 있습니다.", "List.copyOf는 unmodifiable입니다."] },
      ],
      codeExamples: [{
        id: "java-sublist-view-snapshot",
        title: "subList mutation·unmodifiable alias·List.copyOf snapshot을 비교합니다",
        language: "java",
        filename: "SubListViewSnapshot.java",
        purpose: "세 read/write surfaces의 alias 반영 차이를 undefined external structural mutation 없이 검증합니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class SubListViewSnapshot {
    public static void main(String[] args) {
        ArrayList<String> parent = new ArrayList<>(List.of("A", "B", "C", "D", "E"));
        List<String> range = parent.subList(1, 4);
        range.set(1, "X");
        range.remove(0);

        List<String> snapshot = List.copyOf(range);
        List<String> readOnlyView = Collections.unmodifiableList(parent);
        range.add("Y");
        parent.set(0, "Z");

        System.out.println("parent=" + parent);
        System.out.println("range=" + range);
        System.out.println("snapshot=" + snapshot);
        System.out.println("readOnlyView=" + readOnlyView);
        try {
            readOnlyView.add("blocked");
        } catch (UnsupportedOperationException e) {
            System.out.println("readOnlyMutation=" + e.getClass().getSimpleName());
        }
    }
}`,
        walkthrough: [
          { lines: "1-10", explanation: "parent indices1..3 view에서 set/remove해 parent sequence를 직접 변경합니다." },
          { lines: "12-15", explanation: "range snapshot과 parent unmodifiable wrapper를 만든 뒤 view add와 parent set을 수행합니다." },
          { lines: "17-26", explanation: "parent/range/readOnlyView는 최신 aliases를 보지만 snapshot은 [X,D]에 고정되고 wrapper mutation은 거부됩니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("SubListViewSnapshot.java", "SubListViewSnapshot") },
        output: { value: "parent=[Z, X, D, Y, E]\nrange=[X, D, Y]\nsnapshot=[X, D]\nreadOnlyView=[Z, X, D, Y, E]\nreadOnlyMutation=UnsupportedOperationException", explanation: ["range changes가 parent에 반영됩니다.", "snapshot은 생성 시점 range와 분리됩니다.", "unmodifiable wrapper는 parent alias 변경을 보지만 자체 mutation만 막습니다."] },
        experiments: [
          { change: "range 생성 뒤 parent.add를 직접 호출하고 range.size를 읽습니다.", prediction: "behavior는 specification상 undefined이며 CME에만 의존할 수 없습니다.", result: "view lifetime 동안 structural mutations는 view 경로로 한정합니다." },
          { change: "snapshot elements를 mutable objects로 바꿉니다.", prediction: "List 구조는 독립이지만 shared element 내부 mutation은 양쪽에서 보일 수 있습니다.", result: "defensive copy가 shallow인지 deep인지 구분합니다." },
        ],
        sourceRefs: ["java-arraylist-api", "java-list-api", "java-collections-api", "java-concurrent-modification-api"],
      }],
      diagnostics: [
        { symptom: "subList 사용 중 갑자기 ConcurrentModificationException이 난다.", likelyCause: "parent를 view 밖 alias에서 structurally 변경했습니다.", checks: ["view 생성 뒤 모든 add/remove/clear 경로를 찾습니다.", "backing parent alias를 추적합니다.", "copy가 필요한 lifetime인지 봅니다."], fix: "view lifetime mutation을 view 경로로 제한하거나 독립 ArrayList copy를 만듭니다.", prevention: "subList를 long-lived field로 노출하지 않고 mutation owner를 캡슐화합니다." },
        { symptom: "unmodifiable list가 나중에 바뀌어 immutable cache가 깨진다.", likelyCause: "Collections.unmodifiableList view의 backing list가 다른 alias에서 변경됐습니다.", checks: ["wrapper 생성 source를 찾습니다.", "List.copyOf 사용 여부를 봅니다.", "element mutability도 확인합니다."], fix: "독립 immutable snapshot이 필요하면 List.copyOf 또는 defensive copy 후 wrapper를 사용합니다.", prevention: "API docs에서 view/snapshot과 shallow/deep를 명시합니다." },
      ],
      expertNotes: ["subList의 undefined external structural modification은 ‘반드시 CME’보다 더 강한 주의입니다. fail-fast는 bug detection aid이지 synchronization/correctness guarantee가 아닙니다.", "JDK 구현에서 subList가 root/offset 정보를 유지하는 방식은 version detail이므로 memory/profile 결론은 target runtime에서 검증합니다."],
    },
    {
      id: "linkedlist-node-deque-and-cost-model",
      title: "LinkedList는 List와 Deque를 함께 구현하지만 indexed get은 node traversal이고 locality·memory 비용이 큽니다",
      lead: "‘삽입 삭제가 항상 빠르다’는 문장을 탐색 비용·known position·allocation·cache locality 조건으로 해체합니다.",
      explanations: [
        "LinkedList는 doubly-linked nodes로 encounter order를 연결하고 List와 Deque를 구현합니다. addFirst/removeFirst/addLast/removeLast는 ends를 알고 있어 O(1)입니다.",
        "get(index)는 index가 앞 절반이면 head, 뒤 절반이면 tail에서 node links를 따라가므로 O(n)입니다. RandomAccess를 구현하지 않습니다.",
        "middle insert/remove도 target node를 먼저 찾아야 하므로 index 기반 operation 전체는 O(n)입니다. 이미 ListIterator가 target cursor에 있으면 link update 자체는 O(1)일 수 있습니다.",
        "각 element마다 item과 prev/next references를 가진 node allocation이 필요해 ArrayList의 reference array보다 per-element overhead와 GC pressure가 큽니다.",
        "nodes가 heap에 흩어져 pointer chasing을 하므로 CPU cache locality가 나쁠 수 있습니다. ArrayList의 O(n) contiguous copy가 LinkedList traversal보다 실제로 빠른 workload도 흔합니다.",
        "Queue/Deque ends operation이 중심이고 stable node iterator가 필요한 경우 LinkedList가 의미 있을 수 있지만 null 허용 등 API 차이도 고려합니다. 대부분 stack/queue에는 ArrayDeque가 더 단순하고 빠른 기본입니다.",
        "성능을 비교할 때 JMH warmup, fork, dead-code elimination 방지, 같은 data distribution, GC/allocation profile, 여러 sizes와 operation mix를 사용합니다. System.nanoTime 한 번으로 결론내리지 않습니다.",
      ],
      concepts: [
        { term: "node traversal", definition: "linked nodes의 next/prev references를 따라 target position에 도달하는 과정입니다.", detail: ["indexed access O(n)의 원인입니다.", "head/tail 중 가까운 쪽을 택할 수 있습니다."] },
        { term: "pointer chasing", definition: "연속되지 않은 heap objects의 references를 순차 따라가며 memory latency를 발생시키는 access pattern입니다.", detail: ["cache locality가 낮을 수 있습니다.", "Big-O에 드러나지 않습니다."] },
        { term: "operation mix", definition: "실제 workload에서 get/add/remove/iterate/ends operations가 차지하는 비율과 위치 분포입니다.", detail: ["자료구조 선택의 입력입니다.", "단일 benchmark operation으로 대체하지 않습니다."] },
      ],
      codeExamples: [{
        id: "java-linkedlist-deque-surface",
        title: "LinkedList의 List index와 Deque 양끝/queue/stack aliases를 분리합니다",
        language: "java",
        filename: "LinkedListDequeSurface.java",
        purpose: "RandomAccess=false와 head/tail operations의 정확한 end를 sequence로 확인합니다.",
        code: String.raw`import java.util.LinkedList;
import java.util.RandomAccess;

public class LinkedListDequeSurface {
    public static void main(String[] args) {
        LinkedList<Integer> values = new LinkedList<>();
        values.addLast(2);
        values.addFirst(1);
        values.offerLast(3);
        values.offerFirst(0);

        System.out.println("initial=" + values);
        System.out.println("randomAccess=" + (values instanceof RandomAccess));
        System.out.println("get2=" + values.get(2));
        System.out.println("removeEnds=" + values.removeFirst() + "," + values.removeLast());
        System.out.println("afterEnds=" + values);

        values.offer(4);
        System.out.println("queuePoll=" + values.poll());
        values.push(0);
        System.out.println("stackPop=" + values.pop());
        System.out.println("final=" + values);
    }
}`,
        walkthrough: [
          { lines: "1-10", explanation: "LinkedList 양끝 APIs로 [0,1,2,3] encounter order를 만듭니다." },
          { lines: "12-16", explanation: "RandomAccess=false, index2 value2와 first0/last3 removal을 확인합니다." },
          { lines: "18-23", explanation: "Queue.offer/poll은 tail/head, stack push/pop은 head를 사용해 최종 [2,4]를 만듭니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("LinkedListDequeSurface.java", "LinkedListDequeSurface") },
        output: { value: "initial=[0, 1, 2, 3]\nrandomAccess=false\nget2=2\nremoveEnds=0,3\nafterEnds=[1, 2]\nqueuePoll=1\nstackPop=0\nfinal=[2, 4]", explanation: ["LinkedList는 RandomAccess marker가 없습니다.", "removeFirst/removeLast end가 분명합니다.", "Queue와 stack aliases가 같은 deque의 서로 다른 protocol을 사용합니다."] },
        experiments: [
          { change: "백만 elements를 `for i get(i)`로 순회합니다.", prediction: "node traversal이 반복되어 O(n²)로 커집니다.", result: "Iterator가 한 번 next links를 따라 O(n) 순회합니다." },
          { change: "middle insert benchmark만 한 번 nanoTime으로 잽니다.", prediction: "JIT/GC/탐색/측정 noise 때문에 신뢰하기 어렵습니다.", result: "JMH와 실제 operation mix/profile을 사용합니다." },
        ],
        sourceRefs: ["java-class10-ex03", "java-linkedlist-api", "java-deque-api", "java-random-access-api", "jmh-project"],
      }],
      diagnostics: [
        { symptom: "LinkedList 중간 삽입이 O(1)이라고 바꿨는데 더 느리다.", likelyCause: "index target node 탐색 O(n)을 제외하고 link update만 셌습니다.", checks: ["API가 index인지 iterator cursor인지 봅니다.", "탐색과 update를 분리 측정합니다.", "allocation/cache profile을 확인합니다."], fix: "known ListIterator position이 아니면 전체 O(n)으로 모델링하고 workload를 다시 선택합니다.", prevention: "복잡도 표에 precondition과 traversal 포함 여부를 적습니다." },
        { symptom: "LinkedList를 cache-friendly하다고 가정했는데 GC와 latency가 증가한다.", likelyCause: "per-element node allocation과 pointer chasing을 무시했습니다.", checks: ["allocation rate와 retained size를 봅니다.", "cache miss/profile을 비교합니다.", "ArrayDeque/ArrayList 대안을 benchmark합니다."], fix: "ends operations에는 ArrayDeque, indexed/iteration에는 ArrayList를 실제 workload로 비교합니다.", prevention: "Big-O와 memory/locality columns를 함께 평가합니다." },
      ],
      expertNotes: ["LinkedList node는 public API로 노출되지 않아 arbitrary element handle로 O(1) delete하는 intrusive list use case를 직접 지원하지 않습니다.", "concurrent producer/consumer에는 LinkedList 자체를 외부 lock으로 감싸기보다 BlockingQueue/ConcurrentLinkedQueue 같은 의도별 collection을 우선합니다."],
    },
    {
      id: "iterator-listiterator-fail-fast-safe-mutation",
      title: "Iterator/ListIterator mutation protocol을 지키고 fail-fast를 best-effort bug signal로만 사용합니다",
      lead: "순회 중 collection 직접 변경과 iterator 경유 변경을 구분하고 ListIterator cursor의 next/previous/add/set 규칙을 trace합니다.",
      explanations: [
        "enhanced for는 내부적으로 Iterator를 사용하므로 loop 안에서 backing list add/remove를 직접 호출하면 iterator expected modification count와 달라질 수 있습니다.",
        "일반 Iterator.remove는 구현이 이 optional operation을 지원할 때 마지막 next가 반환한 element를 iterator state와 함께 제거합니다. 지원하지 않으면 UnsupportedOperationException이고, 지원하더라도 next 전이나 한 next 뒤 두 번 호출하면 IllegalStateException입니다. 이 장의 ArrayList iterator는 remove를 지원합니다.",
        "ListIterator는 양방향 traversal, nextIndex/previousIndex와 optional set/add/remove를 제공합니다. 지원되는 구현에서 set은 마지막 next/previous element를 교체하고 add는 cursor 앞에 삽입한 뒤 cursor 위치를 조정하지만, immutable/unmodifiable 등의 iterator는 UnsupportedOperationException을 던질 수 있습니다. 예제의 ArrayList ListIterator는 세 변경을 지원합니다.",
        "fail-fast iterator는 structural modification을 탐지하면 ConcurrentModificationException을 던질 수 있지만 best-effort입니다. 모든 race를 탐지하거나 즉시 던진다는 보장이 없습니다.",
        "ConcurrentModificationException은 동시 thread만의 예외가 아닙니다. 같은 thread가 iterator 밖 alias로 list를 구조 변경해도 발생할 수 있습니다.",
        "fail-fast를 synchronization으로 사용하지 않습니다. 여러 threads가 같은 mutable list를 공유하면 external locking, synchronized wrapper discipline, CopyOnWriteArrayList 등 명시 concurrency policy가 필요합니다.",
        "조건 삭제는 removeIf가 간결할 수 있고, iteration 중 복합 edit는 ListIterator, 원본을 보존해야 하면 stream/filter로 새 list를 만듭니다. mutation semantics를 먼저 선택합니다.",
      ],
      concepts: [
        { term: "iterator cursor", definition: "next/previous elements 사이의 논리적 위치로 traversal과 insert/remove 대상 관계를 결정합니다.", detail: ["element 자체가 아닙니다.", "ListIterator add 뒤 이동합니다."] },
        { term: "fail-fast", definition: "iterator 생성 후 예상 밖 structural modification을 best-effort로 탐지해 빠르게 실패하는 진단 behavior입니다.", detail: ["correctness guarantee가 아닙니다.", "concurrency control이 아닙니다."] },
        { term: "safe iterator mutation", definition: "구현이 optional remove/set/add를 지원할 때 현재 iterator protocol로 expected state를 함께 갱신하는 순회 중 변경입니다.", detail: ["호출 순서 제약이 있습니다.", "미지원 구현은 UnsupportedOperationException입니다.", "지원 시 backing list에 반영됩니다."] },
      ],
      codeExamples: [{
        id: "java-iterator-mutation",
        title: "Iterator.remove·ListIterator.set/add와 stale iterator fail-fast를 비교합니다",
        language: "java",
        filename: "IteratorMutation.java",
        purpose: "안전한 mutation paths와 direct structural modification의 best-effort exception을 deterministic single-thread case로 확인합니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.ConcurrentModificationException;
import java.util.Iterator;
import java.util.List;
import java.util.ListIterator;

public class IteratorMutation {
    public static void main(String[] args) {
        ArrayList<String> values = new ArrayList<>(List.of("A", "B", "C", "D"));
        Iterator<String> iterator = values.iterator();
        while (iterator.hasNext()) {
            if (iterator.next().equals("B")) iterator.remove();
        }
        System.out.println("afterIteratorRemove=" + values);

        ListIterator<String> editor = values.listIterator();
        while (editor.hasNext()) {
            if (editor.next().equals("C")) {
                editor.set("C*");
                editor.add("afterC");
            }
        }
        System.out.println("afterListIterator=" + values);

        Iterator<String> stale = values.iterator();
        System.out.println("staleFirst=" + stale.next());
        values.add("E");
        try {
            stale.next();
        } catch (ConcurrentModificationException e) {
            System.out.println("directMutation=" + e.getClass().getSimpleName());
        }
        System.out.println("final=" + values);
    }
}`,
        walkthrough: [
          { lines: "1-14", explanation: "Iterator.next로 B를 선택하고 같은 iterator.remove로 expected modification state와 backing list를 함께 갱신합니다." },
          { lines: "16-23", explanation: "ListIterator가 C를 C*로 set하고 cursor 위치에 afterC를 add합니다." },
          { lines: "25-35", explanation: "stale iterator 생성 뒤 list 직접 add가 best-effort fail-fast를 유발하고 final list에는 E가 남습니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("IteratorMutation.java", "IteratorMutation") },
        output: { value: "afterIteratorRemove=[A, C, D]\nafterListIterator=[A, C*, afterC, D]\nstaleFirst=A\ndirectMutation=ConcurrentModificationException\nfinal=[A, C*, afterC, D, E]", explanation: ["이 예제의 mutable ArrayList iterator는 optional remove/set/add를 지원해 변경이 반영됩니다.", "다른 List/iterator 구현은 같은 변경 method에서 UnsupportedOperationException일 수 있습니다.", "direct add 뒤 stale iterator가 CME를 내지만 add를 rollback하지는 않습니다."] },
        experiments: [
          { change: "iterator.next 전에 iterator.remove를 호출합니다.", prediction: "IllegalStateException입니다.", result: "remove는 마지막으로 반환된 element가 있어야 합니다." },
          { change: "CME가 없으면 concurrent access가 안전하다고 판단합니다.", prediction: "탐지되지 않은 race/data corruption 가능성을 놓칩니다.", result: "fail-fast는 best-effort이며 concurrency policy가 아닙니다." },
        ],
        sourceRefs: ["java-class10-ex01", "java-class10-ex02", "java-class10-ex03", "java-iterator-api", "java-list-iterator-api", "java-concurrent-modification-api", "java-arraylist-api"],
      }],
      diagnostics: [
        { symptom: "enhanced-for 안 list.remove가 CME를 낸다.", likelyCause: "loop iterator 밖 backing list를 structurally 변경했습니다.", checks: ["mutation receiver가 iterator인지 list인지 봅니다.", "removeIf로 표현 가능한지 확인합니다.", "다른 aliases를 찾습니다."], fix: "Iterator.remove/ListIterator/removeIf 또는 새 결과 list를 사용합니다.", prevention: "순회와 mutation owner를 같은 abstraction에 둡니다." },
        { symptom: "CME가 없으니 여러 thread 접근이 안전하다고 결론냈다.", likelyCause: "best-effort detection을 happens-before/synchronization으로 오해했습니다.", checks: ["collection thread-safety contract를 봅니다.", "모든 access가 같은 lock을 쓰는지 확인합니다.", "snapshot/weakly-consistent iterator인지 구분합니다."], fix: "workload에 맞는 concurrent collection 또는 외부 locking을 사용합니다.", prevention: "iterator consistency model을 API 선택 표에 포함합니다." },
      ],
      expertNotes: ["CopyOnWriteArrayList iterator는 snapshot이라 CME를 내지 않지만 iterator.remove를 지원하지 않고 writes가 전체 copy 비용을 가집니다.", "ConcurrentLinkedQueue iterator는 weakly consistent하여 creation 이후 일부 changes를 볼 수 있지만 snapshot/strong consistency와 다릅니다."],
    },
    {
      id: "legacy-stack-versus-arraydeque",
      title: "legacy Stack은 Vector의 넓은 indexed surface를 상속하므로 LIFO에는 Deque<ArrayDeque>를 기본으로 선택합니다",
      lead: "원본 Stack의 valid behavior를 보존하면서 strict stack abstraction·성능·동시성 요구에 더 맞는 현대 API로 이동합니다.",
      explanations: [
        "Stack은 Vector를 상속한 legacy class라 push/pop/peek 외 add(index), elementAt, setElementAt 같은 arbitrary-position operations도 노출합니다. Ex01은 실제로 중간 삽입/치환을 해 순수 LIFO abstraction을 벗어납니다.",
        "Deque는 양끝 queue contract이며 stack으로 쓸 때 push(E)=addFirst, pop()=removeFirst, peek()=peekFirst입니다. Oracle API도 legacy Stack보다 Deque 사용을 권장합니다.",
        "ArrayDeque는 대부분 stack/queue uses에서 Stack/LinkedList보다 빠를 가능성이 큰 resizable-array deque이고 null을 금지합니다. 구체 성능은 workload로 측정합니다.",
        "Stack의 synchronized methods가 복합 sequence 원자성을 보장하지 않습니다. `if (!empty()) pop()` 사이 다른 thread가 변경할 수 있어 external atomicity가 필요합니다.",
        "ArrayDeque는 thread-safe하지 않습니다. concurrent stack에는 ConcurrentLinkedDeque, bounded blocking deque에는 LinkedBlockingDeque 등 semantics에 맞는 type을 선택합니다.",
        "Deque도 addFirst/addLast/removeFirst/removeLast 전체를 노출하므로 팀이 strict LIFO만 원하면 push/pop/peek만 노출하는 wrapper/domain type으로 surface를 줄입니다.",
        "Stack.search는 top에서1-based position을 반환하지만 Deque에는 같은 method가 없습니다. 검색이 핵심이면 stack 자체 선택과 algorithm을 재검토하고 필요 시 iteration으로 명시합니다.",
      ],
      concepts: [
        { term: "LIFO", definition: "가장 나중에 push된 element가 가장 먼저 pop되는 Last-In First-Out protocol입니다.", detail: ["top 한쪽 end를 일관되게 씁니다.", "중간 mutation은 protocol 밖입니다."] },
        { term: "legacy collection", definition: "Collections Framework 이전/초기 design surface와 synchronization 선택을 유지한 class입니다.", detail: ["동작 불가라는 뜻은 아닙니다.", "새 code 기본 선택을 재검토합니다."] },
        { term: "surface restriction", definition: "underlying collection의 넓은 API 중 domain이 허용하는 operations만 wrapper/interface로 노출하는 설계입니다.", detail: ["invariant를 지킵니다.", "잘못된 end 사용을 줄입니다."] },
      ],
      codeExamples: [{
        id: "java-stack-deque-migration",
        title: "Stack과 ArrayDeque가 같은 LIFO drain을 만들지만 representation surface는 다름을 확인합니다",
        language: "java",
        filename: "StackDequeMigration.java",
        purpose: "legacy Stack의 vector order와 Deque head-as-top order를 구분하면서 pop sequence equivalence를 검증합니다.",
        code: String.raw`import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Stack;
import java.util.StringJoiner;

public class StackDequeMigration {
    public static void main(String[] args) {
        Stack<Integer> legacy = new Stack<>();
        Deque<Integer> modern = new ArrayDeque<>();
        for (int value : new int[] {1, 2, 3}) {
            legacy.push(value);
            modern.push(value);
        }

        System.out.println("legacyView=" + legacy);
        System.out.println("modernView=" + modern);
        System.out.println("legacySearch1=" + legacy.search(1));

        StringJoiner legacyDrain = new StringJoiner(",");
        StringJoiner modernDrain = new StringJoiner(",");
        while (!legacy.empty()) legacyDrain.add(String.valueOf(legacy.pop()));
        while (!modern.isEmpty()) modernDrain.add(String.valueOf(modern.pop()));
        System.out.println("legacyDrain=" + legacyDrain);
        System.out.println("modernDrain=" + modernDrain);
        System.out.println("sameLifo=" + legacyDrain.toString().equals(modernDrain.toString()));
    }
}`,
        walkthrough: [
          { lines: "1-13", explanation: "같은1,2,3을 Stack과 Deque.push에 넣지만 Stack view는 bottom→top, ArrayDeque iteration은 head/top→tail 순서입니다." },
          { lines: "15-17", explanation: "representation 차이와 Stack.search의 top-based position3을 출력합니다." },
          { lines: "19-26", explanation: "각 pop protocol로 drain하면 둘 다3,2,1이며 LIFO semantics가 같습니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("StackDequeMigration.java", "StackDequeMigration") },
        output: { value: "legacyView=[1, 2, 3]\nmodernView=[3, 2, 1]\nlegacySearch1=3\nlegacyDrain=3,2,1\nmodernDrain=3,2,1\nsameLifo=true", explanation: ["toString/iteration orientation은 다릅니다.", "top에서 pop한 observable sequence는 동일합니다.", "migration test는 representation이 아니라 protocol result를 비교합니다."] },
        experiments: [
          { change: "modern에 addLast를 섞습니다.", prediction: "strict LIFO sequence가 깨질 수 있습니다.", result: "Deque의 넓은 surface를 protocol discipline/wrapper로 제한합니다." },
          { change: "Stack synchronized methods만으로 check-then-pop을 concurrent safe라 가정합니다.", prediction: "두 method 사이 race가 남습니다.", result: "compound atomicity 또는 concurrent deque를 선택합니다." },
        ],
        sourceRefs: ["java-class10-ex01", "java-stack-api", "java-vector-api", "java-deque-api", "java-arraydeque-api", "java-concurrent-linked-deque-api"],
      }],
      diagnostics: [
        { symptom: "Stack을 썼는데 다른 code가 add(0,e)로 LIFO 순서를 깨뜨린다.", likelyCause: "Vector에서 상속한 indexed APIs가 그대로 노출됐습니다.", checks: ["Stack reference가 외부로 새는지 봅니다.", "push/pop 외 calls를 검색합니다.", "domain wrapper 가능성을 봅니다."], fix: "Deque를 사용하고 strict stack wrapper로 allowed methods만 노출합니다.", prevention: "field/parameter type을 구체 Stack 대신 최소 protocol interface로 선언합니다." },
        { symptom: "Stack이라 thread-safe하다고 했지만 empty check 뒤 pop이 실패한다.", likelyCause: "method-level synchronization을 compound operation atomicity로 확대 해석했습니다.", checks: ["check와 mutation 사이 lock scope를 봅니다.", "다른 aliases/threads를 찾습니다.", "concurrent deque semantics를 비교합니다."], fix: "한 lock 안 compound operation 또는 atomic concurrent API를 사용합니다.", prevention: "thread-safe 문구에 operation 단위와 compound invariants를 명시합니다." },
      ],
      expertNotes: ["Deque interface type을 사용하면 ArrayDeque와 concurrent/bounded implementations 사이 policy 교체가 쉬워집니다.", "serialization compatibility 때문에 legacy Stack이 남는 경우에도 new domain API 안으로 격리하고 arbitrary Vector methods를 노출하지 않습니다."],
    },
    {
      id: "lifo-empty-state-contracts",
      title: "push/pop/peek의 top end와 빈 상태 exception·null sentinel 계약을 API 경계에서 고정합니다",
      lead: "`isEmpty` 선검사만 반복하기보다 empty가 정상 분기인지 invariant 위반인지에 따라 throwing/sentinel methods를 선택합니다.",
      explanations: [
        "Deque stack protocol에서 push는 addFirst, pop은 removeFirst, peek은 peekFirst입니다. 같은 end를 top으로 일관되게 사용해야 LIFO가 유지됩니다.",
        "pop/removeFirst는 empty에서 NoSuchElementException, peek/peekFirst는 null을 반환합니다. pollFirst도 제거하면서 null을 반환합니다.",
        "ArrayDeque가 null elements를 금지하므로 null sentinel은 empty와 명확히 구분됩니다. null을 허용하는 Deque 구현에서는 sentinel API가 모호해질 수 있어 null 저장 자체를 피하는 것이 권장됩니다.",
        "empty가 정상적인 ‘더 없음’이면 peek/poll 같은 special-value API가 자연스럽고, algorithm invariant상 반드시 element가 있어야 하면 pop/remove로 빠르게 실패시키는 것이 진단에 좋습니다.",
        "`if (!deque.isEmpty()) deque.pop()`은 single-thread에서는 명확하지만 concurrent deque에서는 check와 pop 사이 race가 있습니다. poll 하나의 atomic call 또는 external lock을 사용합니다.",
        "값이 없음을 null로 domain에 흘리지 않으려면 Optional을 반환하는 wrapper를 둘 수 있지만 hot loop allocation/clarity tradeoff를 판단합니다.",
        "undo stack처럼 depth limit가 있으면 push 전 오래된 history 제거 policy와 memory budget을 명시합니다. ArrayDeque 자체는 fixed bound를 제공하지 않습니다.",
      ],
      concepts: [
        { term: "top", definition: "stack protocol에서 push/pop/peek가 모두 사용하는 한쪽 deque end입니다.", detail: ["Deque push는 first end입니다.", "orientation을 문서화합니다."] },
        { term: "sentinel", definition: "exception 대신 empty/failure를 나타내는 특별 반환값입니다.", detail: ["Queue/Deque는 null을 사용합니다.", "stored null과 모호하면 안 됩니다."] },
        { term: "invariant failure", definition: "algorithm상 element가 반드시 있어야 한다는 전제가 깨진 상태로 throwing API가 빠른 진단을 제공할 수 있습니다.", detail: ["정상 empty와 구분합니다.", "message/context를 상위에서 추가할 수 있습니다."] },
      ],
      codeExamples: [{
        id: "java-lifo-empty-contracts",
        title: "ArrayDeque empty peek/poll과 pop exception, 정상 LIFO를 비교합니다",
        language: "java",
        filename: "LifoEmptyContracts.java",
        purpose: "empty가 정상 분기일 때와 invariant 위반일 때 method family가 다른 결과를 내는 것을 고정합니다.",
        code: String.raw`import java.util.ArrayDeque;
import java.util.Deque;
import java.util.NoSuchElementException;

public class LifoEmptyContracts {
    public static void main(String[] args) {
        Deque<String> stack = new ArrayDeque<>();
        System.out.println("emptyPeek=" + stack.peek());
        System.out.println("emptyPoll=" + stack.poll());
        try {
            stack.pop();
        } catch (NoSuchElementException e) {
            System.out.println("emptyPop=" + e.getClass().getSimpleName());
        }

        stack.push("A");
        stack.push("B");
        System.out.println("top=" + stack.peek());
        System.out.println("pop=" + stack.pop() + "," + stack.pop());
        System.out.println("empty=" + stack.isEmpty());
    }
}`,
        walkthrough: [
          { lines: "1-14", explanation: "empty peek/poll은 null이고 pop은 NoSuchElementException인 두 method families를 비교합니다." },
          { lines: "16-21", explanation: "A 뒤 B를 first end에 push해 peek B, pop B,A와 final empty를 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("LifoEmptyContracts.java", "LifoEmptyContracts") },
        output: { value: "emptyPeek=null\nemptyPoll=null\nemptyPop=NoSuchElementException\ntop=B\npop=B,A\nempty=true", explanation: ["sentinel methods는 null입니다.", "throwing pop은 empty invariant 위반을 알립니다.", "push/pop은 first end에서 B,A LIFO입니다."] },
        experiments: [
          { change: "stack에 null을 push합니다.", prediction: "ArrayDeque는 NullPointerException입니다.", result: "null sentinel과 element ambiguity를 제거합니다." },
          { change: "concurrent code에서 isEmpty 뒤 pop을 호출합니다.", prediction: "사이 다른 consumer가 제거해 pop이 실패할 수 있습니다.", result: "poll 한 번으로 상태 관찰과 제거를 결합합니다." },
        ],
        sourceRefs: ["java-deque-api", "java-arraydeque-api", "java-no-such-element-api", "java-null-pointer-api"],
      }],
      diagnostics: [
        { symptom: "빈 stack에서 pop이 갑자기 NoSuchElementException을 낸다.", likelyCause: "empty가 가능한 정상 state인데 throwing API를 무조건 사용했습니다.", checks: ["empty가 protocol 종료인지 invariant 위반인지 정합니다.", "peek/poll family를 비교합니다.", "concurrent race를 확인합니다."], fix: "정상 empty는 poll/peek 결과로 분기하고 invariant 위반은 context를 가진 exception으로 유지합니다.", prevention: "public method에 empty contract를 문서화합니다." },
        { symptom: "peek null을 실제 null element와 구분할 수 없다.", likelyCause: "null 허용 collection에서 sentinel method를 사용했습니다.", checks: ["implementation null policy를 봅니다.", "null insert 경로를 찾습니다.", "Optional/domain wrapper를 검토합니다."], fix: "null elements를 금지하고 absence를 별도 type/policy로 표현합니다.", prevention: "collection element invariants에 non-null을 선언합니다." },
      ],
      expertNotes: ["ArrayDeque의 null 금지는 Queue/Deque special-value methods를 명확하게 만드는 중요한 설계 일부입니다.", "exception vs sentinel 선택은 micro-performance보다 호출자가 empty를 어떻게 처리해야 하는지에 맞춰야 합니다."],
    },
    {
      id: "queue-method-pairs-fifo-empty",
      title: "Queue는 FIFO를 유지하며 add/offer·remove/poll·element/peek method pairs로 실패 표현을 선택합니다",
      lead: "동일 operation의 exception form과 special-value form을 bounded capacity·empty normality에 맞춰 구분합니다.",
      explanations: [
        "FIFO Queue는 tail에 enqueue하고 head에서 dequeue합니다. ArrayDeque Queue view에서 offer/add는 tail, poll/remove/peek/element는 head를 사용합니다.",
        "add는 capacity 제한 등으로 삽입할 수 없으면 IllegalStateException을 던지고 offer는 false를 반환합니다. unbounded/resizable queue에서는 둘 다 보통 true지만 contract 차이는 남습니다.",
        "remove는 empty에서 NoSuchElementException, poll은 null입니다. element는 제거하지 않고 empty에서 NoSuchElementException, peek은 제거하지 않고 null입니다.",
        "special-value forms가 null을 사용하므로 Queue implementations는 일반적으로 null insertion을 금지하거나 강하게 비권장합니다. null은 ‘없음’ 의미로 남깁니다.",
        "empty가 정상 consumer polling이면 poll/peek, 반드시 item이 있어야 하는 invariant이면 remove/element가 의도를 드러냅니다. exception을 정상 busy-wait loop에 쓰지 않습니다.",
        "Queue interface는 thread-safety나 blocking을 보장하지 않습니다. ArrayDeque는 non-thread-safe/non-blocking이고 BlockingQueue는 put/take/timed operations를 추가합니다.",
        "FIFO fairness와 priority는 별개입니다. PriorityQueue는 head가 priority order라 insertion order FIFO가 아니며 equal-priority tie order도 별도 policy가 필요합니다.",
      ],
      concepts: [
        { term: "FIFO", definition: "가장 먼저 enqueue된 element가 가장 먼저 dequeue되는 First-In First-Out protocol입니다.", detail: ["tail insert/head remove입니다.", "priority queue와 다릅니다."] },
        { term: "exception form", definition: "operation 실패/empty를 exception으로 알리는 add/remove/element method family입니다.", detail: ["invariant 위반에 유용합니다.", "정상 empty loop에는 과할 수 있습니다."] },
        { term: "special-value form", definition: "operation 실패/empty를 false 또는 null로 알리는 offer/poll/peek family입니다.", detail: ["bounded/normal absence에 유용합니다.", "null element를 피합니다."] },
      ],
      codeExamples: [{
        id: "java-queue-method-pairs",
        title: "ArrayDeque Queue에서 insertion/removal/examination method pairs를 모두 실행합니다",
        language: "java",
        filename: "QueueMethodPairs.java",
        purpose: "FIFO order와 empty exception/null 차이를 한 deterministic queue lifecycle로 확인합니다.",
        code: String.raw`import java.util.ArrayDeque;
import java.util.NoSuchElementException;
import java.util.Queue;

public class QueueMethodPairs {
    public static void main(String[] args) {
        Queue<String> queue = new ArrayDeque<>();
        System.out.println("addA=" + queue.add("A"));
        System.out.println("offerB=" + queue.offer("B"));
        System.out.println("head=" + queue.element() + "," + queue.peek());
        System.out.println("remove=" + queue.remove());
        System.out.println("poll=" + queue.poll());
        System.out.println("emptyPoll=" + queue.poll());
        System.out.println("emptyPeek=" + queue.peek());
        try {
            queue.remove();
        } catch (NoSuchElementException e) {
            System.out.println("emptyRemove=" + e.getClass().getSimpleName());
        }
        try {
            queue.element();
        } catch (NoSuchElementException e) {
            System.out.println("emptyElement=" + e.getClass().getSimpleName());
        }
    }
}`,
        walkthrough: [
          { lines: "1-10", explanation: "add/offer로 A,B를 tail에 넣고 element/peek가 같은 head A를 비파괴 관찰합니다." },
          { lines: "11-15", explanation: "remove A, poll B로 FIFO drain한 뒤 special-value forms가 null을 반환합니다." },
          { lines: "16-26", explanation: "throwing remove/element는 empty에서 각각 NoSuchElementException입니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("QueueMethodPairs.java", "QueueMethodPairs") },
        output: { value: "addA=true\nofferB=true\nhead=A,A\nremove=A\npoll=B\nemptyPoll=null\nemptyPeek=null\nemptyRemove=NoSuchElementException\nemptyElement=NoSuchElementException", explanation: ["resizable ArrayDeque에서 add/offer 모두 성공합니다.", "head examination은 A,A이고 removal은 A then B FIFO입니다.", "empty special vs exception forms가 분리됩니다."] },
        experiments: [
          { change: "ArrayBlockingQueue capacity1에서 두 번째 add를 호출합니다.", prediction: "IllegalStateException이고 offer는 false입니다.", result: "다음 장에서 capacity/backpressure policy로 연결합니다." },
          { change: "PriorityQueue로 구현을 바꿉니다.", prediction: "head는 insertion FIFO가 아니라 natural/comparator priority가 됩니다.", result: "Queue interface만으로 ordering discipline을 단정하지 않습니다." },
        ],
        sourceRefs: ["java-class10-ex03", "java-queue-api", "java-arraydeque-api", "java-no-such-element-api", "java-priority-queue-api"],
      }],
      diagnostics: [
        { symptom: "empty가 정상인데 remove exception을 계속 catch하며 polling한다.", likelyCause: "exception form을 정상 flow에 사용했습니다.", checks: ["empty frequency를 봅니다.", "poll null 분기로 바꿀 수 있는지 봅니다.", "blocking take가 맞는지 검토합니다."], fix: "non-blocking normal absence는 poll, blocking consumer는 BlockingQueue take/timed poll을 사용합니다.", prevention: "Queue method pair 선택을 consumer protocol에 명시합니다." },
        { symptom: "Queue라서 항상 insertion FIFO라고 가정해 priority job 순서가 틀린다.", likelyCause: "Queue head contract와 concrete ordering policy를 구분하지 않았습니다.", checks: ["implementation/comparator를 확인합니다.", "equal priority tie policy를 봅니다.", "test data insertion order를 바꿉니다."], fix: "FIFO에는 ArrayDeque/linked FIFO queue, priority에는 explicit priority+tie-breaker를 사용합니다.", prevention: "queue type 이름과 ordering invariant를 architecture에 함께 기록합니다." },
      ],
      expertNotes: ["Queue.remove(Object)는 head removal method remove()와 overload되어 arbitrary equal element를 지울 수 있으므로 호출 signature를 구분합니다.", "peek 뒤 poll을 분리하면 concurrent queue에서 head가 달라질 수 있으므로 처리할 element는 poll 한 번으로 claim하는 pattern을 우선합니다."],
    },
    {
      id: "bounded-queue-backpressure",
      title: "bounded queue는 capacity를 시스템 계약으로 만들고 offer·put·timed offer로 backpressure 정책을 표현합니다",
      lead: "producer가 consumer보다 빠를 때 memory를 무한히 늘리는 대신 reject·block·timeout·shed 중 명시적인 선택을 합니다.",
      explanations: [
        "unbounded queue는 순간 burst를 흡수하지만 producer rate가 지속적으로 높으면 memory와 latency가 제한 없이 증가할 수 있습니다. bounded capacity는 overload를 조기에 관찰 가능한 상태로 바꿉니다.",
        "ArrayBlockingQueue는 생성 시 fixed capacity를 정하는 array-backed BlockingQueue입니다. offer는 full이면 false, add는 IllegalStateException, put은 space가 생길 때까지 interruptibly block합니다.",
        "timed offer는 deadline 안 space가 없으면 false를 반환해 caller가 retry/drop/fallback을 결정하게 합니다. 무제한 put은 request thread pool을 모두 막을 수 있으므로 blocking budget을 설계합니다.",
        "backpressure 정책에는 reject with signal, newest/oldest drop, coalescing, spill to durable storage, upstream rate limit가 있습니다. 데이터 중요도·ordering·latency·durability로 선택합니다.",
        "capacity는 임의 상수가 아닙니다. arrival/service rates, acceptable waiting time, burst distribution, memory per item을 관찰하고 Little's Law를 참고하되 non-stationary traffic과 tail을 별도 봅니다.",
        "BlockingQueue의 put/take는 thread 간 handoff와 memory consistency effects를 제공하지만 task 자체의 idempotency·transaction·shutdown drain을 자동 해결하지 않습니다.",
        "ArrayBlockingQueue fairness option은 waiting threads의 FIFO access 경향을 높일 수 있지만 throughput을 낮출 수 있습니다. business FIFO ordering과 lock waiter fairness를 같은 개념으로 보지 않습니다.",
      ],
      concepts: [
        { term: "backpressure", definition: "downstream 처리 능력이 부족할 때 upstream 생산 속도/수락량을 제한하고 overload를 전달하는 제어입니다.", detail: ["bounded capacity가 신호를 만듭니다.", "정책 없는 block은 위험합니다."] },
        { term: "bounded queue", definition: "동시에 보유할 수 있는 elements 수에 고정/명시 capacity 제한이 있는 queue입니다.", detail: ["full behavior를 정해야 합니다.", "memory와 latency를 제한합니다."] },
        { term: "load shedding", definition: "시스템 전체 안정성을 위해 overload 시 일부 work를 명시 기준으로 거부/삭제/축약하는 정책입니다.", detail: ["관찰 가능해야 합니다.", "데이터 손실 계약이 필요합니다."] },
      ],
      codeExamples: [{
        id: "java-bounded-backpressure",
        title: "capacity2 ArrayBlockingQueue에서 offer false·add exception·space 회복을 확인합니다",
        language: "java",
        filename: "BoundedBackpressure.java",
        purpose: "full state의 special-value/exception forms와 consumer poll 뒤 producer 재수락을 deterministic single-thread trace로 보여 줍니다.",
        code: String.raw`import java.util.concurrent.ArrayBlockingQueue;

public class BoundedBackpressure {
    public static void main(String[] args) {
        ArrayBlockingQueue<String> queue = new ArrayBlockingQueue<>(2);
        System.out.println("offerA=" + queue.offer("A"));
        System.out.println("offerB=" + queue.offer("B"));
        System.out.println("offerCWhenFull=" + queue.offer("C"));
        try {
            queue.add("C");
        } catch (IllegalStateException e) {
            System.out.println("addWhenFull=" + e.getClass().getSimpleName());
        }
        System.out.println("consumer=" + queue.poll());
        System.out.println("offerCAfterSpace=" + queue.offer("C"));
        System.out.println("queue=" + queue);
        System.out.println("remainingCapacity=" + queue.remainingCapacity());
    }
}`,
        walkthrough: [
          { lines: "1-8", explanation: "capacity2를 A,B로 채우고 third offer가 false라는 non-blocking backpressure signal을 만듭니다." },
          { lines: "9-13", explanation: "같은 full state에서 add는 IllegalStateException form입니다." },
          { lines: "14-18", explanation: "consumer가 A를 제거해 space를 만들면 C offer가 성공하고 [B,C], remaining0이 됩니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("BoundedBackpressure.java", "BoundedBackpressure") },
        output: { value: "offerA=true\nofferB=true\nofferCWhenFull=false\naddWhenFull=IllegalStateException\nconsumer=A\nofferCAfterSpace=true\nqueue=[B, C]\nremainingCapacity=0", explanation: ["offer는 full을 false로 전달합니다.", "add는 같은 상태를 exception으로 전달합니다.", "poll로 capacity를 회복하면 FIFO B,C가 남습니다."] },
        experiments: [
          { change: "request thread에서 무기한 put을 사용합니다.", prediction: "consumer 정체 시 request threads가 모두 block될 수 있습니다.", result: "timed offer/deadline과 overload response를 설계합니다." },
          { change: "capacity를 무조건 매우 크게 늘립니다.", prediction: "reject는 늦어지지만 memory와 queueing latency가 커집니다.", result: "처리율·latency SLO·item size·burst로 capacity를 산정합니다." },
        ],
        sourceRefs: ["java-array-blocking-queue-api", "java-blocking-queue-api", "java-queue-api", "little-law-reference"],
      }],
      diagnostics: [
        { symptom: "트래픽 spike 뒤 OOM이 나고 queue latency가 수분으로 늘어난다.", likelyCause: "unbounded queue가 overload를 숨겼습니다.", checks: ["queue depth/age를 봅니다.", "arrival/service rates를 비교합니다.", "item retained size를 측정합니다."], fix: "bounded queue와 explicit reject/timeout/shed policy를 도입합니다.", prevention: "depth·oldest age·offer failures를 SLO alerts로 둡니다." },
        { symptom: "bounded queue 도입 뒤 모든 producer thread가 멈춘다.", likelyCause: "무기한 put과 정지/느린 consumer가 결합했습니다.", checks: ["thread dumps에서 put wait를 봅니다.", "consumer health를 확인합니다.", "shutdown protocol을 검토합니다."], fix: "timed offer와 cancellation/deadline/fallback을 사용합니다.", prevention: "block budget과 full behavior를 API contract에 포함합니다." },
      ],
      expertNotes: ["queue length만으로 overload를 판단하면 item cost 편차를 놓칩니다. weighted capacity나 work estimation이 필요한 workload도 있습니다.", "distributed queue는 local BlockingQueue와 달리 durability, visibility timeout, redelivery, duplicate handling이 추가되므로 idempotent consumer가 필요합니다."],
    },
    {
      id: "arraydeque-two-ends-null-ring",
      title: "ArrayDeque는 양끝 O(1) amortized operations와 null 금지를 제공하며 circular-array layout은 구현 detail로 취급합니다",
      lead: "first/last method family를 표로 고정하고 내부 head/tail wrap과 growth를 correctness contract로 노출하지 않습니다.",
      explanations: [
        "ArrayDeque는 resizable-array Deque implementation으로 addFirst/addLast/removeFirst/removeLast/peekFirst/peekLast를 제공합니다. 대부분 operations는 amortized constant time입니다.",
        "내부적으로 OpenJDK는 array의 head/tail indices를 wrap하는 circular layout을 사용해 양끝마다 전체 shift하지 않습니다. exact indices와 capacity/growth는 private implementation detail입니다.",
        "constructor capacity는 초기 수용 hint이지 maximum bound가 아닙니다. full backpressure가 필요하면 ArrayBlockingQueue/LinkedBlockingDeque 등 bounded type을 사용합니다.",
        "ArrayDeque는 null elements를 허용하지 않고 add/push/offer null에서 NullPointerException입니다. peek/poll null sentinel과 실제 element absence가 명확합니다.",
        "iterator는 first→last encounter order, descendingIterator는 last→first입니다. stack view의 top이 first end라 일반 iterator는 top→bottom이 됩니다.",
        "ArrayDeque는 thread-safe하지 않고 fail-fast iterator도 best-effort입니다. 여러 threads에는 external synchronization이나 concurrent deque를 선택합니다.",
        "양끝 API가 많아 end 혼동이 쉬우므로 queue는 offerLast/pollFirst, stack은 push/pop 또는 addFirst/removeFirst처럼 한 protocol을 정하고 섞지 않습니다.",
      ],
      concepts: [
        { term: "circular array", definition: "logical sequence의 head/tail indices가 backing array 끝에서 처음으로 wrap되는 layout입니다.", detail: ["양끝 shift를 피합니다.", "exact layout은 implementation detail입니다."] },
        { term: "first/last ends", definition: "Deque가 양쪽 insertion/removal/examination을 이름으로 구분하는 두 logical boundaries입니다.", detail: ["queue와 stack orientation을 정합니다.", "method family를 일관되게 씁니다."] },
        { term: "resizable", definition: "elements 증가에 따라 internal storage를 늘릴 수 있어 constructor capacity가 hard bound가 아닌 성질입니다.", detail: ["growth는 occasional O(n)입니다.", "backpressure를 제공하지 않습니다."] },
      ],
      codeExamples: [{
        id: "java-arraydeque-ends",
        title: "first/last mutation·descending iteration·null prohibition을 exact sequence로 확인합니다",
        language: "java",
        filename: "ArrayDequeEnds.java",
        purpose: "internal capacity/index를 노출하지 않고 public end semantics와 sentinel invariant만 검증합니다.",
        code: String.raw`import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.StringJoiner;

public class ArrayDequeEnds {
    public static void main(String[] args) {
        Deque<String> deque = new ArrayDeque<>(2);
        deque.addLast("A");
        deque.addLast("B");
        deque.addLast("C");
        System.out.println("removeFirst=" + deque.removeFirst());
        deque.addLast("D");
        deque.addLast("E");
        deque.addFirst("Z");
        System.out.println("deque=" + deque);
        System.out.println("removeEnds=" + deque.removeFirst() + "," + deque.removeLast());

        StringJoiner reverse = new StringJoiner(",");
        Iterator<String> descending = deque.descendingIterator();
        while (descending.hasNext()) reverse.add(descending.next());
        System.out.println("remaining=" + deque);
        System.out.println("descending=" + reverse);
        try {
            deque.add(null);
        } catch (NullPointerException e) {
            System.out.println("nullAdd=" + e.getClass().getSimpleName());
        }
    }
}`,
        walkthrough: [
          { lines: "1-16", explanation: "initial hint2를 넘어 grow하면서 A를 first에서 제거하고 Z/B/C/D/E sequence를 양끝 operations로 만듭니다." },
          { lines: "17-24", explanation: "first Z와 last E를 제거해 [B,C,D], descending D,C,B를 만듭니다." },
          { lines: "25-30", explanation: "null add가 sentinel invariant 때문에 NullPointerException임을 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("ArrayDequeEnds.java", "ArrayDequeEnds") },
        output: { value: "removeFirst=A\ndeque=[Z, B, C, D, E]\nremoveEnds=Z,E\nremaining=[B, C, D]\ndescending=D,C,B\nnullAdd=NullPointerException", explanation: ["initial capacity2는 hard bound가 아니며 five elements를 담습니다.", "first/last removal과 descending order가 정확합니다.", "null element는 금지됩니다."] },
        experiments: [
          { change: "constructor에2를 줬으니 third add가 false일 것으로 기대합니다.", prediction: "ArrayDeque는 resize해 성공합니다.", result: "bounded capacity는 ArrayBlockingQueue 같은 별도 contract입니다." },
          { change: "reflection으로 head/tail internal indices를 golden test합니다.", prediction: "JDK version/encapsulation에서 깨질 수 있습니다.", result: "public sequence/end behavior만 correctness contract로 검증합니다." },
        ],
        sourceRefs: ["java-arraydeque-api", "java-deque-api", "java-null-pointer-api", "openjdk-arraydeque-source"],
      }],
      diagnostics: [
        { symptom: "ArrayDeque capacity2인데 queue가2를 넘어 overload가 누적된다.", likelyCause: "initial capacity를 maximum bound로 오해했습니다.", checks: ["implementation이 resizable인지 봅니다.", "remainingCapacity API 존재를 확인합니다.", "bounded requirement를 문서화합니다."], fix: "fixed capacity BlockingQueue/Deque를 선택합니다.", prevention: "constructor hint와 hard limit를 용어로 분리합니다." },
        { symptom: "stack과 queue calls를 섞어 예상 반대 end가 제거된다.", likelyCause: "push/addLast/pop/pollFirst orientation을 합의하지 않았습니다.", checks: ["각 method를 first/last 표로 변환합니다.", "protocol별 wrapper를 확인합니다.", "exact sequence test를 실행합니다."], fix: "stack/queue 중 하나의 method family로 통일하고 surface를 제한합니다.", prevention: "field 이름과 domain API에 orientation을 드러냅니다." },
      ],
      expertNotes: ["ArrayDeque clone/serialization/internal capacity behavior를 application invariant로 사용하지 않습니다.", "large deques에서 clear는 references를 제거해 GC 가능하게 하지만 capacity 축소 semantics는 public trim API로 제공되지 않습니다."],
    },
    {
      id: "applications-exposure-and-concurrency-boundary",
      title: "undo·printer queue를 protocol로 구현하고 copy/view/immutable/concurrent collections를 alias·write 비율로 선택합니다",
      lead: "자료구조 이름 암기에서 벗어나 history LIFO, work FIFO, API exposure와 multi-thread iteration을 하나의 설계 체크리스트로 연결합니다.",
      explanations: [
        "undo history는 가장 최근 command를 먼저 되돌리는 LIFO라 Deque가 맞습니다. redo가 필요하면 undo/redo 두 stacks 사이 command를 이동하고 새 command 실행 시 redo를 비우는 invariant를 둡니다.",
        "printer/work queue는 먼저 제출된 job을 먼저 처리하는 FIFO가 기본입니다. priority가 필요하면 stable sequence number를 tie-breaker로 포함하고 capacity/backpressure를 별도 설계합니다.",
        "mutable internal list를 그대로 반환하면 caller가 invariant를 우회합니다. defensive mutable copy는 caller가 바꿀 독립 list, unmodifiable view는 write 차단 alias, List.copyOf는 unmodifiable structural snapshot입니다.",
        "모든 copy는 기본적으로 shallow라 mutable element objects는 공유됩니다. 진짜 deep immutability가 필요하면 elements도 immutable value로 만들거나 명시 deep copy합니다.",
        "Collections.synchronizedList는 각 method를 mutex로 감싸지만 iteration 전체는 반환 wrapper를 lock해 external synchronization해야 합니다.",
        "CopyOnWriteArrayList는 reads/iterations가 많고 writes가 드문 작은/중간 lists에 유용합니다. iterator는 creation 시 snapshot이고 writes마다 backing array copy 비용이 듭니다.",
        "ConcurrentLinkedQueue/Deque는 non-blocking, unbounded, weakly-consistent iteration을 제공하고 BlockingQueue는 capacity/blocking handoff를 제공합니다. 단순히 ‘thread-safe’ 한 column이 아니라 ordering·capacity·blocking·iteration consistency·compound atomicity로 선택합니다.",
      ],
      concepts: [
        { term: "defensive copy", definition: "caller/callee alias mutation을 분리하기 위해 collection structure를 새 object로 복사하는 경계입니다.", detail: ["mutable copy일 수 있습니다.", "elements는 기본 shallow copy입니다."] },
        { term: "unmodifiable view", definition: "해당 reference의 mutation methods는 막지만 backing collection 다른 alias changes를 반영하는 wrapper입니다.", detail: ["immutable snapshot과 다릅니다.", "alias lifetime을 문서화합니다."] },
        { term: "snapshot iterator", definition: "iterator 생성 시점의 collection state를 고정해 이후 writes와 독립적으로 순회하는 모델입니다.", detail: ["CopyOnWriteArrayList가 사용합니다.", "최신성을 자동 보장하지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "java-undo-printer-queue",
          title: "Deque undo LIFO와 Queue printer FIFO를 한 deterministic workflow로 실행합니다",
          language: "java",
          filename: "UndoPrinterQueue.java",
          purpose: "같은 commands/jobs라도 history와 work ordering requirement가 다른 자료구조를 요구함을 보여 줍니다.",
          code: String.raw`import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Queue;

public class UndoPrinterQueue {
    public static void main(String[] args) {
        Deque<String> undo = new ArrayDeque<>();
        for (String command : new String[] {"type:A", "type:B", "bold"}) {
            undo.push(command);
            System.out.println("execute=" + command);
        }
        System.out.println("undo=" + undo.pop());
        System.out.println("undo=" + undo.pop());
        System.out.println("history=" + undo);

        Queue<String> printer = new ArrayDeque<>();
        printer.offer("doc-1");
        printer.offer("doc-2");
        printer.offer("doc-3");
        while (!printer.isEmpty()) {
            System.out.println("print=" + printer.remove());
        }
        System.out.println("printerEmpty=" + printer.isEmpty());
    }
}`,
          walkthrough: [
            { lines: "1-14", explanation: "세 commands를 push해 latest bold, type:B 순으로 undo하고 oldest type:A history가 남습니다." },
            { lines: "16-25", explanation: "세 documents를 offer order 그대로 remove해 doc-1,2,3 FIFO로 출력합니다." },
          ],
          run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("UndoPrinterQueue.java", "UndoPrinterQueue") },
          output: { value: "execute=type:A\nexecute=type:B\nexecute=bold\nundo=bold\nundo=type:B\nhistory=[type:A]\nprint=doc-1\nprint=doc-2\nprint=doc-3\nprinterEmpty=true", explanation: ["undo는 latest-first입니다.", "printer는 earliest-first입니다.", "두 protocols 모두 ArrayDeque지만 서로 다른 operation families를 씁니다."] },
          experiments: [
            { change: "undo history를 Queue.poll로 구현합니다.", prediction: "type:A가 먼저 취소되어 사용자 기대를 깨뜨립니다.", result: "ordering requirement가 collection 선택의 첫 기준입니다." },
            { change: "printer queue를 unbounded로 두고 producer를 빠르게 합니다.", prediction: "memory/latency backlog가 커질 수 있습니다.", result: "bounded capacity와 submission failure policy를 추가합니다." },
          ],
          sourceRefs: ["java-deque-api", "java-queue-api", "java-arraydeque-api"],
        },
        {
          id: "java-collection-exposure",
          title: "unmodifiable view·immutable snapshot·defensive copy·CopyOnWrite snapshot iterator를 비교합니다",
          language: "java",
          filename: "CollectionExposure.java",
          purpose: "source mutation 반영과 caller mutation 권한, concurrent snapshot iteration을 deterministic aliases로 구분합니다.",
          code: String.raw`import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.StringJoiner;
import java.util.concurrent.CopyOnWriteArrayList;

public class CollectionExposure {
    public static void main(String[] args) {
        ArrayList<String> source = new ArrayList<>(List.of("A", "B"));
        List<String> readOnlyView = Collections.unmodifiableList(source);
        List<String> immutableSnapshot = List.copyOf(source);
        ArrayList<String> defensiveMutable = new ArrayList<>(source);

        CopyOnWriteArrayList<String> copyOnWrite = new CopyOnWriteArrayList<>(source);
        Iterator<String> snapshotIterator = copyOnWrite.iterator();
        source.add("C");
        defensiveMutable.add("X");
        copyOnWrite.add("C");

        StringJoiner oldSnapshot = new StringJoiner(",");
        snapshotIterator.forEachRemaining(oldSnapshot::add);
        System.out.println("source=" + source);
        System.out.println("readOnlyView=" + readOnlyView);
        System.out.println("immutableSnapshot=" + immutableSnapshot);
        System.out.println("defensiveMutable=" + defensiveMutable);
        System.out.println("copyOnWrite=" + copyOnWrite);
        System.out.println("snapshotIterator=" + oldSnapshot);
        try {
            immutableSnapshot.add("blocked");
        } catch (UnsupportedOperationException e) {
            System.out.println("snapshotMutation=" + e.getClass().getSimpleName());
        }
    }
}`,
          walkthrough: [
            { lines: "1-13", explanation: "같은 source에서 alias view, immutable snapshot, independent mutable copy를 만들고 CopyOnWrite list iterator를 생성합니다." },
            { lines: "15-20", explanation: "source/defensive/COW를 각각 변경하되 COW iterator는 write 전 snapshot을 유지합니다." },
            { lines: "22-34", explanation: "view만 source C를 보고 snapshot은 A,B, defensive는 A,B,X, COW current는 A,B,C, iterator는 old A,B이며 snapshot mutation은 거부됩니다." },
          ],
          run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("CollectionExposure.java", "CollectionExposure") },
          output: { value: "source=[A, B, C]\nreadOnlyView=[A, B, C]\nimmutableSnapshot=[A, B]\ndefensiveMutable=[A, B, X]\ncopyOnWrite=[A, B, C]\nsnapshotIterator=A,B\nsnapshotMutation=UnsupportedOperationException", explanation: ["unmodifiable view는 source alias change를 봅니다.", "snapshot/defensive copy는 source structure와 분리됩니다.", "COW iterator는 creation 시점 A,B만 봅니다."] },
          experiments: [
            { change: "elements를 mutable StringBuilder로 바꿉니다.", prediction: "세 copies 모두 같은 element object mutation을 볼 수 있습니다.", result: "collection copy는 기본적으로 shallow입니다." },
            { change: "write-heavy list를 CopyOnWriteArrayList로 바꿉니다.", prediction: "각 write array copy와 allocation 비용이 커집니다.", result: "read/write ratio와 size를 profile해 선택합니다." },
          ],
          sourceRefs: ["java-collections-api", "java-list-api", "java-copy-on-write-list-api", "java-synchronized-collections", "java-concurrent-linked-queue-api", "java-blocking-queue-api"],
        },
      ],
      diagnostics: [
        { symptom: "getter가 unmodifiable list를 줬는데 내부 변경이 caller 화면에 나타난다.", likelyCause: "immutable snapshot이 아니라 backing alias view를 반환했습니다.", checks: ["Collections.unmodifiableList인지 List.copyOf인지 봅니다.", "source mutation paths를 찾습니다.", "element mutability를 확인합니다."], fix: "독립 시점 value가 필요하면 defensive immutable snapshot을 반환합니다.", prevention: "API docs에 live view/snapshot과 shallow element semantics를 명시합니다." },
        { symptom: "CopyOnWriteArrayList 도입 뒤 writes와 memory allocation이 급증한다.", likelyCause: "write-heavy/large list에 snapshot-copy design을 사용했습니다.", checks: ["read/write ratio와 size를 측정합니다.", "allocation profile을 봅니다.", "iteration consistency 요구를 확인합니다."], fix: "lock 기반 list, concurrent queue/map, immutable publication 등 workload에 맞는 대안을 선택합니다.", prevention: "‘thread-safe’가 아니라 operation mix·iterator model·compound atomicity를 평가합니다." },
      ],
      expertNotes: ["List.copyOf는 source가 이미 suitable unmodifiable list면 같은 instance를 반환할 수 있으므로 identity가 아니라 value/immutability contract만 사용합니다.", "CopyOnWriteArrayList snapshot iterator는 remove를 지원하지 않으며 오래 보관하면 old backing array lifetime을 유지할 수 있습니다."],
    },
  ],
  lab: {
    title: "bounded print spooler와 undo/redo history를 가진 collection boundary 설계",
    scenario: "문서 editor의 commands는 undo/redo LIFO로 관리하고 print jobs는 capacity3 FIFO로 처리합니다. UI에는 immutable snapshots만 노출하며, iteration 중 mutation과 overload, empty, concurrent read/write 경계를 deterministic tests로 검증합니다.",
    setup: [
      "OpenJDK21 UTF-8 --release21 -proc:none -Xlint:all isolated compile/run harness를 준비합니다.",
      "EditorState 안에 ArrayList<Document>, ArrayDeque<Command> undo/redo, ArrayBlockingQueue<PrintJob> capacity3을 둡니다.",
      "Command와 PrintJob은 immutable record이고 stable id·sequence를 갖게 합니다.",
      "public getters는 List.copyOf snapshot을 반환하고 mutable internals를 노출하지 않습니다.",
      "모든 cases는 새 state로 실행해 iterator/queue/history state가 섞이지 않게 합니다.",
      "clock·thread scheduling·object identity가 output에 들어가지 않도록 synthetic sequence만 사용합니다.",
      "queue full policy는 non-blocking offer false→stable rejection code로 정합니다.",
      "temp build artifacts는 OS temp direct child에 두고 finally cleanup합니다.",
    ],
    steps: [
      "commands type:A, type:B, bold를 실행하고 undo stack top→bottom이 bold,type:B,type:A인지 확인합니다.",
      "undo 두 번으로 bold,type:B를 제거해 redo stack에 push하고 document state와 두 histories를 assert합니다.",
      "새 command italic을 실행하면 redo history를 clear하는 branching-history invariant를 구현합니다.",
      "empty undo에서 exception form이 아닌 explicit false/result를 반환하고 UI stable message로 변환합니다.",
      "print jobs1,2,3 offer가 true이고4는 full false/rejection code인지 검증합니다.",
      "consumer poll이 job1을 가져간 뒤 job4 retry가 true이며 remaining order2,3,4인지 확인합니다.",
      "Queue.peek로 UI preview하되 actual claim은 poll 한 번으로 수행합니다.",
      "documents getter snapshot을 받은 뒤 internal add를 수행해 이전 snapshot이 변하지 않는지 확인합니다.",
      "unmodifiable view version을 일부러 만들어 source alias change가 보이는 negative comparison을 기록합니다.",
      "Iterator.remove로 조건 삭제를 수행하고 backing list direct remove가 CME를 만들 수 있는 negative case와 분리합니다.",
      "ArrayList index loop와 LinkedList iterator loop를 같은 outputs로 검증하고 LinkedList get(i) 반복을 금지합니다.",
      "CopyOnWriteArrayList iterator가 creation 후 write를 보지 않는 snapshot behavior를 test합니다.",
      "shared mutable state version에는 synchronization/collection 선택표를 작성하고 단순 ArrayDeque 공유를 금지합니다.",
      "queue depth, remaining capacity, rejection count, oldest sequence를 운영 metrics로 정의합니다.",
      "normal examples warning0/exact output과 package/direct original audit를 함께 실행합니다.",
      "모든 실행 후 .class/temp/privacy residue0를 확인합니다.",
    ],
    expectedResult: [
      "undo는 latest-first, print queue는 earliest-first ordering을 유지합니다.",
      "redo branching rule과 empty history result가 명시적으로 검증됩니다.",
      "capacity3 full에서 job4가 거부되고 poll 뒤 재수락됩니다.",
      "immutable snapshot은 internal changes와 분리되고 unmodifiable view는 alias changes를 반영합니다.",
      "safe iterator mutation은 성공하고 direct structural mutation negative는 CME signal을 냅니다.",
      "ArrayList/LinkedList algorithms가 같은 values를 내되 traversal strategy가 구현 비용에 맞습니다.",
      "CopyOnWrite iterator와 current list의 시점 차이가 exact output으로 드러납니다.",
      "public API가 mutable internals, null elements, legacy Stack/Vector concrete types를 노출하지 않습니다.",
      "overload/rejection/queue age metrics와 처리 policy가 문서화됩니다.",
      "warning·class·temp·민감정보 residue가0입니다.",
    ],
    cleanup: [
      "producer/consumer threads를 사용했다면 bounded join과 interruption policy로 종료합니다.",
      "queue/history를 clear해 test fixture references를 해제합니다.",
      "OS temp resolved parent를 검증한 뒤 build outputs를 reverse delete합니다.",
      "repository-wide .class와 temporary verifier files가 없는지 확인합니다.",
    ],
    extensions: [
      "redo stack과 command memento의 memory budget/compaction policy를 추가합니다.",
      "priority print jobs에 monotonic sequence tie-breaker를 넣어 stable ordering을 만듭니다.",
      "timed offer와 request deadline을 연결해 overload response를 구현합니다.",
      "ConcurrentLinkedQueue와 ArrayBlockingQueue의 throughput·latency·backpressure를 JMH로 비교합니다.",
      "mutable Document를 immutable value로 바꿔 shallow snapshot alias를 제거합니다.",
      "large subList retention을 heap profile로 재현하고 copy lifetime과 비교합니다.",
      "CopyOnWriteArrayList write-heavy negative benchmark를 추가합니다.",
      "queue shutdown에서 drain, poison pill, cancellation 중 하나를 선택해 loss/duplicate contract를 작성합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "Ex01 Stack 원본을 Deque<Integer/String> protocol로 옮기고 observable LIFO behavior를 비교하세요.",
      requirements: ["push/pop/peek만 사용합니다.", "legacy toString orientation이 아닌 drain sequence를 비교합니다.", "empty peek/pop contracts를 test합니다.", "null insert를 금지합니다.", "warning0 exact output을 만듭니다."],
      hints: ["Deque.push/pop/peek는 first end입니다.", "Stack.search는 직접 대응 API가 없습니다.", "중간 add/set은 strict stack contract에서 제거하세요."],
      expectedOutcome: "modern Deque가 same latest-first drain을 만들고 legacy indexed surface와 empty/null 정책 차이를 설명합니다.",
      solutionOutline: ["원본 operations를 LIFO와 arbitrary List operations로 분류합니다.", "LIFO operations만 ArrayDeque로 변환합니다.", "top sequence를 StringJoiner로 비교합니다.", "empty special/throwing cases를 별도 assertions로 둡니다."],
    },
    {
      difficulty: "응용",
      prompt: "capacity5 printer queue에 reject·timed wait·drop-oldest 세 overload policies를 구현하고 비교하세요.",
      requirements: ["같은 jobs sequence를 세 policies에 넣습니다.", "accepted/rejected/dropped order를 exact output으로 검증합니다.", "무기한 blocking을 사용하지 않습니다.", "queue depth/oldest age 대체 synthetic metric을 기록합니다.", "shutdown drain behavior를 명시합니다."],
      hints: ["offer false는 caller policy의 입력입니다.", "drop-oldest는 FIFO data loss contract를 바꿉니다.", "timed offer는 interruption을 처리해야 합니다."],
      expectedOutcome: "각 policy의 data loss, producer latency, ordering tradeoff가 code와 result table에서 일치합니다.",
      solutionOutline: ["BackpressurePolicy enum을 만듭니다.", "ArrayBlockingQueue를 policy adapter 뒤에 둡니다.", "synthetic job ids로 outcomes를 수집합니다.", "capacity/rejection/drop counters를 assert합니다."],
    },
    {
      difficulty: "설계",
      prompt: "read-heavy catalog와 write-heavy work queue의 collection exposure/concurrency architecture를 설계하세요.",
      requirements: ["ArrayList/LinkedList/ArrayDeque/COW/concurrent/blocking alternatives를 operation mix로 비교합니다.", "view·snapshot·defensive mutable copy를 API별로 지정합니다.", "iterator consistency와 compound atomicity를 명시합니다.", "capacity/backpressure와 empty/null contracts를 포함합니다.", "JMH measurement plan과 correctness tests를 분리합니다.", "mutable element shallow-copy 위험을 해결합니다."],
      hints: ["thread-safe method와 transaction-like compound operation은 다릅니다.", "COW는 write마다 copy합니다.", "ConcurrentLinkedQueue는 backpressure가 없습니다."],
      expectedOutcome: "구현자가 바뀌어도 ordering·alias·capacity·concurrency·measurement 결정을 재해석하지 않는 implementation-ready 선택표와 test plan이 완성됩니다.",
      solutionOutline: ["operation mix와 SLO를 먼저 수치화합니다.", "각 state의 single mutation owner를 정합니다.", "public snapshot/commands/queue APIs를 설계합니다.", "runtime invariants와 benchmark metrics를 분리합니다.", "overload/shutdown/failure paths를 추가합니다."],
    },
  ],
  reviewQuestions: [
    { question: "List의 핵심 관찰 계약은 무엇인가요?", answer: "encounter order, duplicate 허용, zero-based positional access와 position별 equality입니다." },
    { question: "List.indexOf와 lastIndexOf는 무엇을 반환하나요?", answer: "equals한 element의 첫 위치와 마지막 위치를 반환하며 없으면 -1입니다." },
    { question: "set(index,e)는 size를 바꾸나요?", answer: "아닙니다. 해당 position을 교체하고 이전 element를 반환합니다." },
    { question: "List<Integer>.remove(1)의 의미는 무엇인가요?", answer: "int overload라 index1 element를 제거합니다. 값1은 remove(Integer.valueOf(1))로 명시합니다." },
    { question: "ArrayList size와 capacity의 차이는 무엇인가요?", answer: "size는 저장된 elements 수이고 capacity는 재할당 전 내부 수용량입니다. capacity는 public semantic state가 아닙니다." },
    { question: "ArrayList append가 amortized O(1)이라는 뜻은 무엇인가요?", answer: "대부분 O(1)이지만 growth 시 O(n) copy가 있으며 긴 sequence 전체에 비용을 분산하면 operation당 O(1) 상한이라는 뜻입니다." },
    { question: "ArrayList middle add/remove 비용은 왜 O(n)인가요?", answer: "뒤 suffix references를 오른쪽/왼쪽으로 이동해야 하기 때문입니다." },
    { question: "ensureCapacity는 size를 늘리나요?", answer: "아닙니다. 예상 storage를 미리 확보하려는 hint이고 elements는 add해야 합니다." },
    { question: "trimToSize는 언제 주의해야 하나요?", answer: "다시 growth할 list에 반복하면 shrink/grow와 allocations를 늘릴 수 있어 안정된 lifecycle에서 측정 후 사용합니다." },
    { question: "RandomAccess는 무엇을 보장하나요?", answer: "빠른 일반적 indexed access를 나타내는 marker hint이며 thread-safety나 exact latency를 보장하지 않습니다." },
    { question: "subList는 copy인가요?", answer: "아닙니다. parent range의 live view이며 view mutation이 parent에 반영됩니다." },
    { question: "subList 밖에서 parent를 structural modify하면 어떻게 되나요?", answer: "subList semantics는 undefined입니다. CME가 날 수 있지만 그것을 portable guarantee로 의존하면 안 됩니다." },
    { question: "unmodifiable view와 immutable snapshot 차이는 무엇인가요?", answer: "view는 backing alias changes를 보지만 mutation method만 막고 snapshot은 생성 시점 structure와 독립입니다." },
    { question: "List.copyOf는 deep copy인가요?", answer: "아닙니다. collection structure snapshot은 만들지만 mutable element objects는 공유할 수 있습니다." },
    { question: "LinkedList get(index) 비용은 무엇인가요?", answer: "head/tail 중 가까운 쪽에서 node를 따라가므로 O(n)입니다." },
    { question: "LinkedList middle insert는 항상 O(1)인가요?", answer: "아닙니다. index로 target을 찾는 O(n)이 포함됩니다. 이미 ListIterator cursor가 target에 있을 때 link update만 O(1)일 수 있습니다." },
    { question: "LinkedList가 ArrayList보다 느릴 수 있는 이유는 무엇인가요?", answer: "node allocation, reference overhead, pointer chasing과 낮은 cache locality 때문에 contiguous array copy/iteration보다 실제 비용이 클 수 있습니다." },
    { question: "Iterator.remove의 호출 조건은 무엇인가요?", answer: "구현이 optional remove를 지원해야 하며 마지막 next가 element를 반환한 뒤 한 번 호출할 수 있습니다. 미지원이면 UnsupportedOperationException, next 전이나 연속 두 번이면 IllegalStateException입니다." },
    { question: "ListIterator.add는 어디에 삽입하나요?", answer: "구현이 optional add를 지원할 때 cursor의 next가 반환할 element 앞에 삽입하고 cursor를 새 element 뒤로 이동시킵니다. 미지원 iterator는 UnsupportedOperationException입니다." },
    { question: "List.add/set/remove는 모든 List가 지원하나요?", answer: "아닙니다. 모두 optional operations라 immutable·unmodifiable·fixed-size 구현은 UnsupportedOperationException을 던질 수 있으며 concrete implementation contract를 확인해야 합니다." },
    { question: "fail-fast는 concurrency safety를 보장하나요?", answer: "아닙니다. 예상 밖 structural modification을 best-effort로 알리는 bug signal일 뿐 synchronization/correctness guarantee가 아닙니다." },
    { question: "CME는 여러 threads에서만 발생하나요?", answer: "아닙니다. 한 thread에서도 iterator 밖 list alias로 structural modification하면 발생할 수 있습니다." },
    { question: "새 code에서 Stack보다 무엇을 권장하나요?", answer: "Deque interface와 보통 ArrayDeque implementation을 사용해 push/pop/peek LIFO protocol을 표현합니다." },
    { question: "Stack의 synchronized methods가 compound operation을 atomic하게 하나요?", answer: "아닙니다. empty check와 pop 같은 여러 calls 사이 race는 별도 lock/atomic API가 필요합니다." },
    { question: "Deque stack top은 어느 end인가요?", answer: "push/pop/peek는 first end를 사용합니다." },
    { question: "empty Deque의 pop과 peek 차이는 무엇인가요?", answer: "pop은 NoSuchElementException, peek은 null을 반환합니다." },
    { question: "ArrayDeque가 null을 금지하는 이유와 효과는 무엇인가요?", answer: "null element를 금지해 poll/peek null sentinel이 empty를 명확히 나타내게 합니다." },
    { question: "Queue add와 offer 차이는 무엇인가요?", answer: "삽입 불가 시 add는 IllegalStateException, offer는 false를 반환합니다." },
    { question: "Queue remove/poll 차이는 무엇인가요?", answer: "empty에서 remove는 NoSuchElementException, poll은 null이며 둘 다 head를 제거합니다." },
    { question: "Queue element/peek 차이는 무엇인가요?", answer: "둘 다 head를 제거하지 않지만 empty에서 element는 NoSuchElementException, peek은 null입니다." },
    { question: "Queue interface가 FIFO를 항상 보장하나요?", answer: "모든 implementation이 insertion FIFO인 것은 아닙니다. PriorityQueue는 priority ordering이므로 concrete policy를 확인합니다." },
    { question: "bounded queue가 필요한 이유는 무엇인가요?", answer: "producer overload를 memory/latency 무한 증가로 숨기지 않고 full signal로 upstream에 전달하기 위해서입니다." },
    { question: "ArrayBlockingQueue full에서 offer와 put은 어떻게 다른가요?", answer: "offer는 즉시 false, put은 space가 생길 때까지 interruptibly block합니다." },
    { question: "backpressure policy 예시는 무엇인가요?", answer: "reject, timed wait, rate limit, drop newest/oldest, coalesce, durable spill 등이 있으며 data/latency 계약으로 선택합니다." },
    { question: "ArrayDeque constructor capacity는 hard bound인가요?", answer: "아닙니다. initial capacity hint인 resizable deque입니다." },
    { question: "ArrayDeque circular indices를 test해도 되나요?", answer: "correctness는 private indices/growth에 의존하지 말고 public sequence/end behavior만 test합니다." },
    { question: "ArrayDeque iteration과 descending iteration은 어떤 순서인가요?", answer: "일반 iterator는 first→last, descendingIterator는 last→first입니다." },
    { question: "undo와 printer queue에 각각 어떤 protocol을 쓰나요?", answer: "undo는 latest-first LIFO Deque, printer는 earliest-first FIFO Queue를 사용합니다." },
    { question: "CopyOnWriteArrayList는 언제 유리한가요?", answer: "reads/iterations가 매우 많고 writes가 드물며 snapshot iteration이 맞는 workload입니다." },
    { question: "CopyOnWrite iterator는 이후 writes를 보나요?", answer: "아닙니다. creation 시점 backing array snapshot을 순회합니다." },
    { question: "ConcurrentLinkedQueue와 BlockingQueue 선택 차이는 무엇인가요?", answer: "전자는 non-blocking unbounded/weakly-consistent이고 후자는 capacity와 blocking/timed handoff를 표현합니다." },
  ],
  completionChecklist: [
    "List encounter order와 duplicates를 설명했다.",
    "zero-based valid index range를 확인했다.",
    "indexOf/lastIndexOf의 equals semantics를 확인했다.",
    "set return과 size 불변을 검증했다.",
    "remove(int)와 remove(Object) overload를 구분했다.",
    "index가 필요 없는 순회는 Iterator/enhanced for를 사용했다.",
    "ArrayList size와 capacity를 분리했다.",
    "amortized append와 worst-case resize를 함께 기록했다.",
    "middle insertion/removal suffix shift 비용을 고려했다.",
    "ensureCapacity가 size를 바꾸지 않음을 확인했다.",
    "trimToSize를 반복 growth path에 남용하지 않았다.",
    "RandomAccess를 algorithm hint로만 사용했다.",
    "private growth factor/indices에 correctness를 의존하지 않았다.",
    "subList가 live view임을 문서화했다.",
    "subList lifetime external structural mutation을 금지했다.",
    "unmodifiable view와 immutable snapshot을 구분했다.",
    "copy가 shallow인지 element immutability를 확인했다.",
    "LinkedList get(index) O(n)을 고려했다.",
    "LinkedList index loop O(n²)을 제거했다.",
    "middle update에서 traversal 비용을 포함했다.",
    "node allocation·GC·cache locality를 비교했다.",
    "JMH warmup/fork/operation mix로 성능을 측정했다.",
    "List add/set/remove가 optional operations이며 미지원 구현은 UnsupportedOperationException임을 확인했다.",
    "Iterator.remove가 optional임을 확인하고 지원되는 구현에서 호출 순서를 지켰다.",
    "ListIterator set/add/remove의 optional-operation 여부와 지원 시 cursor semantics를 함께 확인했다.",
    "backing list 직접 mutation과 iterator mutation을 구분했다.",
    "fail-fast를 best-effort signal로만 사용했다.",
    "CME를 synchronization으로 사용하지 않았다.",
    "legacy Stack 대신 Deque 선택을 검토했다.",
    "strict stack API를 push/pop/peek로 제한했다.",
    "Stack method synchronization과 compound atomicity를 구분했다.",
    "LIFO top end를 first로 일관되게 사용했다.",
    "empty가 정상인지 invariant failure인지 정했다.",
    "pop/remove와 peek/poll empty contracts를 구분했다.",
    "null elements를 금지해 sentinel을 명확히 했다.",
    "Queue tail insertion/head removal FIFO를 확인했다.",
    "add/offer full behavior를 구분했다.",
    "remove/poll empty behavior를 구분했다.",
    "element/peek empty behavior를 구분했다.",
    "priority ordering을 FIFO로 오해하지 않았다.",
    "bounded capacity를 memory·latency budget으로 정했다.",
    "full state의 reject/block/timeout/drop policy를 명시했다.",
    "무기한 put으로 request threads를 막지 않았다.",
    "queue depth·oldest age·rejections를 관찰한다.",
    "ArrayDeque initial capacity를 hard bound로 오해하지 않았다.",
    "first/last methods를 protocol별로 통일했다.",
    "ArrayDeque null prohibition을 test했다.",
    "circular layout은 implementation detail로 남겼다.",
    "undo history는 LIFO invariant를 가진다.",
    "printer/work queue는 FIFO/backpressure를 가진다.",
    "mutable internal collection을 그대로 반환하지 않았다.",
    "defensive mutable copy와 immutable snapshot을 구분했다.",
    "Collections.synchronizedList iteration lock을 고려했다.",
    "CopyOnWrite의 read/write ratio와 snapshot model을 확인했다.",
    "ConcurrentLinkedQueue의 unbounded 특성을 고려했다.",
    "thread-safe method와 compound operation atomicity를 구분했다.",
    "package7/direct3을 분리 warning0 compile했다.",
    "direct exact35/22/14 outputs를 재현했다.",
    "HashMap companions를 unordered multiset으로 검증했다.",
    "hostile launcher4·async drain·10초+5초 lifecycle을 검증했다.",
    "walkthrough line bounds와 의미를 실제 code에 맞췄다.",
    "sourceRefs·URLs·anchors·privacy·class residue를 검증했다.",
  ],
  nextSessions: ["core-06-map"],
  sources: [
    { id: "java-class10-ex01", repository: "javastudy2/classstudy", path: "src/com/java/class10/Ex01_Stack.java", usedFor: ["direct inventory", "Stack LIFO", "duplicate/index mutation", "search/index contrast", "exact35"], evidence: "Stack에 add/push/addElement·중간 삽입·duplicate·peek/last/pop·search/index·set·iterator·drain을 수행해 exact35행, final size0, source new1/push1/pop2/peek1을 확인했습니다." },
    { id: "java-class10-ex02", repository: "javastudy2/classstudy", path: "src/com/java/class10/Ex02_ArrayList.java", usedFor: ["direct inventory", "ArrayList/Vector", "ordered index/set", "iterator", "exact22"], evidence: "ArrayList와 Vector 각각 four-element order, index/get/set와 iterator outputs, blank2 포함 exact22행, source constructors1/1을 확인했습니다." },
    { id: "java-class10-ex03", repository: "javastudy2/classstudy", path: "src/com/java/class10/Ex03_LinkedList.java", usedFor: ["direct inventory", "List duplicate/index", "Queue/Deque head", "poll/pop distinction", "exact14"], evidence: "LinkedList duplicate/index/set 뒤 peek 비파괴, poll과 pop의 head 제거, remaining 도우너·둘리·마이콜을 포함 exact14행과 offer/poll/pop/peek 각1을 확인했습니다." },
    { id: "java-class10-ex04", repository: "javastudy2/classstudy", path: "src/com/java/class10/Ex04_Map.java", usedFor: ["package companion", "full25 normalization", "map/value/pair multiplicity", "package health"], evidence: "exit0·stderr0·logical lines25 전체를 raw Map pair multisets2, blank positions2, exact get loop6, keySet/entrySet pair multisets6+6, values multiset6과 separator로 order-independent 검증했습니다." },
    { id: "java-class10-ex05", repository: "javastudy2/classstudy", path: "src/com/java/class10/Ex05_Map.java", usedFor: ["package companion", "unordered keySet", "pair set4", "exact leading values"], evidence: "고길동·24 leading2와 unordered 이름/나이/주소/취미 pair set4의 total6행·exit0을 확인했습니다." },
    { id: "java-class10-ex06", repository: "javastudy2/classstudy", path: "src/com/java/class10/Ex06_Map.java", usedFor: ["package companion", "interactive smoke", "한국 서울", "exact prompts"], evidence: "fresh JVM input 한국→n에서 나라 prompt+서울과 trailing continue prompt exact logical2 lines·stderr0·exit0을 확인했습니다." },
    { id: "java-class10-test", repository: "javastudy2/classstudy", path: "src/com/java/class10/Test.java", usedFor: ["package companion", "generic method compile", "blank main smoke"], evidence: "package compile dependency 없이 public main이 LF 한 행만 출력하고 exit0임을 확인했습니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["package/direct warning0", "release21", "positive examples", "source lines"], evidence: "OpenJDK21.0.11 -encoding UTF-8 --release21 -proc:none -Xlint:all과 isolated -d로 original7/direct3 및 모든 synthetic examples를 검증하는 toolchain입니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["fresh JVM7", "ArgumentList", "working directory", "UTF-8 redirects"], evidence: "shell interpolation 없이 direct3/companions4의 stdin/stdout/stderr와 공백 audit temp working directory를 구성하는 API 근거입니다." },
    { id: "powershell-environment-variables", repository: "Microsoft PowerShell Documentation", path: "about_Environment_Variables / Env provider", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher variable full snapshot", "process removal", "independent finally restoration"], evidence: "outer try 안에서 Java launcher variables4를 모두 snapshot한 뒤 제거하고, 초기화 실패에도 variable별 복원을 독립 시도하는 Env provider 근거입니다." },
    { id: "dotnet-process-environment", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["child environment isolation", "launcher removal", "per-process variables"], evidence: "각 Java child environment에서도 hostile launcher variables를 제거해 exact output/toolchain을 격리하는 API 근거입니다." },
    { id: "dotnet-process-lifecycle", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["Start", "WaitForExit10s", "Kill tree", "grace5s", "Dispose"], evidence: "child당 10초 runtime timeout, process-tree kill, 5초 termination grace와 finally Dispose를 적용하는 lifecycle 근거입니다." },
    { id: "dotnet-stream-reader-async", repository: ".NET API", path: "System.IO.StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["stdout drain", "stderr drain", "post-exit recovery"], evidence: "redirected pipe backpressure를 피하도록 Start 직후 stdout/stderr async reads를 시작하고 종료 뒤 tasks를 회수하는 근거입니다." },
    { id: "java-hashmap-api", repository: "Java SE 21 API", path: "java.util.HashMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html", usedFor: ["companion order caveat", "unordered iteration", "Map normalization"], evidence: "HashMap가 iteration order를 보장하지 않으며 시간이 지나도 같은 order를 유지한다고 가정하지 말아야 하는 companion normalization 근거입니다." },
    { id: "java-list-api", repository: "Java SE 21 API", path: "java.util.List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["ordered duplicate contract", "index methods", "subList", "copyOf", "equality"], evidence: "List의 positional order, duplicate, equals/search, subList range view와 unmodifiable factory contracts의 중심 API 근거입니다." },
    { id: "java-iterator-api", repository: "Java SE 21 API", path: "java.util.Iterator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Iterator.html", usedFor: ["encounter traversal", "remove protocol", "forEachRemaining"], evidence: "hasNext/next/remove 호출 순서와 default traversal behavior의 API 근거입니다." },
    { id: "java-arraylist-api", repository: "Java SE 21 API", path: "java.util.ArrayList", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html", usedFor: ["RandomAccess list", "amortized append", "ensureCapacity", "trimToSize", "fail-fast caveat"], evidence: "constant-time get/set, amortized add, other linear operations, capacity management와 unsynchronized/fail-fast behavior를 설명하는 API 근거입니다." },
    { id: "java-random-access-api", repository: "Java SE 21 API", path: "java.util.RandomAccess", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/RandomAccess.html", usedFor: ["marker hint", "indexed algorithm", "ArrayList/LinkedList contrast"], evidence: "fast random access를 지원하는 Lists가 구현하는 marker와 generic algorithms의 usage guidance 근거입니다." },
    { id: "openjdk-arraylist-source", repository: "OpenJDK jdk21", path: "java.util.ArrayList source", publicUrl: "https://github.com/openjdk/jdk/blob/jdk-21-ga/src/java.base/share/classes/java/util/ArrayList.java", usedFor: ["backing array context", "growth implementation caveat", "shift implementation"], evidence: "capacity/growth/copy mechanics를 현재 OpenJDK21 implementation 참고로 읽되 Java SE correctness contract로 승격하지 않는 source 근거입니다." },
    { id: "java-collections-api", repository: "Java SE 21 API", path: "java.util.Collections", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html", usedFor: ["unmodifiableList", "synchronized wrappers", "view distinction"], evidence: "unmodifiable view가 backing collection을 읽고 synchronized wrappers가 mutex discipline을 요구하는 API 근거입니다." },
    { id: "java-concurrent-modification-api", repository: "Java SE 21 API", path: "java.util.ConcurrentModificationException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ConcurrentModificationException.html", usedFor: ["single-thread direct mutation", "best-effort fail-fast", "not synchronization"], evidence: "concurrent라는 이름과 달리 single-thread contract violation에서도 발생하고 correctness guarantee로 의존하면 안 된다는 API 근거입니다." },
    { id: "java-linkedlist-api", repository: "Java SE 21 API", path: "java.util.LinkedList", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedList.html", usedFor: ["doubly linked List/Deque", "indexed traversal", "first/last operations", "unsynchronized"], evidence: "List와 Deque를 구현하고 indexed operations가 beginning/end 중 가까운 쪽에서 traverse하는 API 근거입니다." },
    { id: "java-deque-api", repository: "Java SE 21 API", path: "java.util.Deque", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Deque.html", usedFor: ["first/last pairs", "stack replacement", "queue orientation", "null guidance"], evidence: "양끝 exception/special-value method table, Queue/Stack usage와 legacy Stack 대체 guidance의 핵심 API 근거입니다." },
    { id: "jmh-project", repository: "OpenJDK Code Tools", path: "JMH", publicUrl: "https://openjdk.org/projects/code-tools/jmh/", usedFor: ["warmup/fork", "microbenchmark harness", "measurement discipline"], evidence: "JVM microbenchmark에서 JIT/measurement pitfalls를 줄이기 위한 OpenJDK 공식 harness 근거입니다." },
    { id: "java-list-iterator-api", repository: "Java SE 21 API", path: "java.util.ListIterator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ListIterator.html", usedFor: ["bidirectional cursor", "set/add/remove", "index positions"], evidence: "List traversal과 cursor-relative mutation method 호출 규칙의 API 근거입니다." },
    { id: "java-stack-api", repository: "Java SE 21 API", path: "java.util.Stack", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Stack.html", usedFor: ["legacy Vector subclass", "push/pop/peek", "search1-based", "Deque recommendation"], evidence: "Stack의 LIFO methods, Vector inheritance와 more complete/consistent Deque replacement recommendation 근거입니다." },
    { id: "java-vector-api", repository: "Java SE 21 API", path: "java.util.Vector", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Vector.html", usedFor: ["legacy synchronized methods", "indexed surface", "compound atomicity caveat"], evidence: "growable object array와 synchronized methods를 가진 legacy List superclass의 API 근거입니다." },
    { id: "java-arraydeque-api", repository: "Java SE 21 API", path: "java.util.ArrayDeque", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayDeque.html", usedFor: ["resizable deque", "Stack/LinkedList alternative", "null prohibition", "amortized ends", "iterators"], evidence: "capacity restriction 없는 resizable-array deque, null 금지, first→last/descending iteration과 typical performance guidance의 API 근거입니다." },
    { id: "java-concurrent-linked-deque-api", repository: "Java SE 21 API", path: "java.util.concurrent.ConcurrentLinkedDeque", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentLinkedDeque.html", usedFor: ["concurrent deque alternative", "non-blocking", "weakly-consistent iteration"], evidence: "multiple threads의 concurrent insert/access/remove를 위한 unbounded concurrent deque contract 근거입니다." },
    { id: "java-no-such-element-api", repository: "Java SE 21 API", path: "java.util.NoSuchElementException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/NoSuchElementException.html", usedFor: ["empty pop/remove/element", "throwing method family"], evidence: "요청한 element가 존재하지 않을 때 throwing Deque/Queue methods가 사용하는 exception family 근거입니다." },
    { id: "java-null-pointer-api", repository: "Java SE 21 API", path: "java.lang.NullPointerException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/NullPointerException.html", usedFor: ["ArrayDeque null add", "non-null invariant", "sentinel clarity"], evidence: "null이 허용되지 않는 operation의 runtime failure type을 검증하는 API 근거입니다." },
    { id: "java-queue-api", repository: "Java SE 21 API", path: "java.util.Queue", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Queue.html", usedFor: ["FIFO head/tail", "method pairs", "null guidance", "ordering variants"], evidence: "add/offer, remove/poll, element/peek exception vs special-value table와 ordering policy caveat의 중심 API 근거입니다." },
    { id: "java-priority-queue-api", repository: "Java SE 21 API", path: "java.util.PriorityQueue", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/PriorityQueue.html", usedFor: ["priority ordering caveat", "non-FIFO head", "ties"], evidence: "natural/comparator priority head와 equal-priority tie breaking 비보장으로 Queue가 항상 insertion FIFO가 아님을 보여 주는 API 근거입니다." },
    { id: "java-array-blocking-queue-api", repository: "Java SE 21 API", path: "java.util.concurrent.ArrayBlockingQueue", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ArrayBlockingQueue.html", usedFor: ["fixed capacity", "FIFO", "fairness", "remainingCapacity"], evidence: "fixed-size array-backed blocking FIFO queue와 optional fairness의 API 근거입니다." },
    { id: "java-blocking-queue-api", repository: "Java SE 21 API", path: "java.util.concurrent.BlockingQueue", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/BlockingQueue.html", usedFor: ["put/take", "timed offer/poll", "four method forms", "memory consistency"], evidence: "exception/special/block/timed operation families와 producer-consumer handoff semantics의 API 근거입니다." },
    { id: "little-law-reference", repository: "Queueing Systems, Volume I", path: "Little's Formula L=lambda W", usedFor: ["capacity observation", "arrival/service/wait relation", "queue sizing caveat"], evidence: "평균 number-in-system, arrival rate와 time-in-system 관계를 capacity/latency 관찰의 보충 모델로 사용하되 burst/tail/stationarity 한계를 함께 명시했습니다." },
    { id: "openjdk-arraydeque-source", repository: "OpenJDK jdk21", path: "java.util.ArrayDeque source", publicUrl: "https://github.com/openjdk/jdk/blob/jdk-21-ga/src/java.base/share/classes/java/util/ArrayDeque.java", usedFor: ["circular array context", "head/tail wrap", "growth detail caveat"], evidence: "OpenJDK21의 circular array/head-tail implementation을 이해하되 private indices/capacity를 public correctness contract로 사용하지 않는 source 근거입니다." },
    { id: "java-copy-on-write-list-api", repository: "Java SE 21 API", path: "java.util.concurrent.CopyOnWriteArrayList", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CopyOnWriteArrayList.html", usedFor: ["snapshot iterator", "write copy", "read-heavy selection", "unsupported iterator mutation"], evidence: "mutative operation마다 fresh copy하고 iterator creation 시점 snapshot을 순회하는 thread-safe List API 근거입니다." },
    { id: "java-synchronized-collections", repository: "Java SE 21 API", path: "Collections.synchronizedList", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html#synchronizedList(java.util.List)", usedFor: ["method mutex", "external iteration lock", "compound access"], evidence: "synchronized wrapper를 통한 serial access와 iteration 시 반환 list를 manual synchronize해야 하는 API 근거입니다." },
    { id: "java-concurrent-linked-queue-api", repository: "Java SE 21 API", path: "java.util.concurrent.ConcurrentLinkedQueue", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentLinkedQueue.html", usedFor: ["non-blocking concurrent FIFO", "unbounded", "weakly-consistent iterator"], evidence: "multiple threads용 unbounded thread-safe FIFO queue와 weakly-consistent traversal의 선택 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 7,
    filesUsed: 7,
    uncoveredNotes: [
      "inventory direct3 Ex01_Stack·Ex02_ArrayList·Ex03_LinkedList를 모두 읽고 source call shapes와 fresh-JVM exact outputs에 직접 사용했습니다.",
      "class10 package 전체 Ex01~Ex06·Test seven files를 읽고 compile/run해 public main7/direct main3이며 별도 source dependency가 없음을 확인했습니다.",
      "package7/direct3은 분리 classes directories에서 OpenJDK21.0.11 -g:source,lines -Xlint:all -XDrawDiagnostics exit0·compiler output0입니다.",
      "Ex01 Stack은 blank0 포함 exact35 lines, search/index values5/0/2/2, iterator order와 LIFO drain size0을 확인했습니다.",
      "Ex02 ArrayList/Vector는 blank2 포함 exact22 lines, four-element orders와 set/iterator outputs를 확인했습니다.",
      "Ex03 LinkedList는 blank1 포함 exact14 lines, peek non-removal, poll/pop head removals와 final remaining3을 확인했습니다.",
      "Ex04 HashMap logical25 lines 전체를 raw Map pair multisets, blanks3/10, exact get loop6, keySet/entrySet pair multisets6씩, values multiset6과 separator로 검증해 unspecified iteration order를 golden에 고정하지 않았습니다.",
      "Ex05 HashMap은 first2 exact와 unordered pairs4 total6, Ex06 한국→n exact logical2, Test LF1을 companion health로 확인했습니다.",
      "original audit는 comments를 제거한 direct source에서 Stack new1/push1/pop2/peek1, ArrayList/Vector new1/1, LinkedList new1/offer1/poll1/pop1/peek1을 assert합니다.",
      "audit는 outer try 안에서 launcher options4를 전부 snapshot한 뒤 audit/child environments에서 제거하고, 초기화 실패에도 variable별 restoration과 temp cleanup을 독립 시도하며 async drain, stdin close, 10-second timeout, tree kill, 5-second termination grace와 Dispose를 사용합니다.",
      "List contract, ArrayList capacity/amortized/shift, subList alias와 LinkedList traversal/locality를 official APIs와 warning0 exact examples로 확장했습니다.",
      "Iterator/ListIterator safe mutation과 best-effort fail-fast는 single-thread deterministic CME case로 검증하되 concurrency correctness로 사용하지 않았습니다.",
      "legacy Stack과 ArrayDeque migration은 representation이 아닌 same3,2,1 LIFO drain으로 비교했습니다.",
      "LIFO/Queue empty method families, null prohibition과 first/last end semantics를 exception/null exact outputs로 검증했습니다.",
      "bounded queue capacity2는 offer false, add IllegalStateException, poll 뒤 recovery와 remainingCapacity0을 exact output으로 검증했습니다.",
      "ArrayDeque initial capacity2를 넘어 growth, first/last removal, descending order와 null failure를 public contract만으로 검증했습니다.",
      "undo LIFO와 printer FIFO applications은 same ArrayDeque를 서로 다른 protocol surface로 사용해 deterministic order를 확인했습니다.",
      "unmodifiable view, List.copyOf snapshot, defensive mutable copy와 CopyOnWrite snapshot iterator의 alias 시점을 exact output으로 구분했습니다.",
      "모든 positive Java examples는 -encoding UTF-8 --release21 -proc:none -Xlint:all warning0와 exact output을 요구합니다.",
      "성능 결론은 private growth/index나 single nanoTime에 의존하지 않고 JMH·operation mix·allocation/cache profile 측정 원칙으로 제한했습니다.",
      "공개 code/output/evidence에는 실제 local absolute path·credential·개인 입력·nondeterministic identity를 포함하지 않았습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
