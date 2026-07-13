import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["oop-09-interface"],
  slug: "oop-09-interface",
  courseId: "java",
  moduleId: "java-oop-design",
  order: 19,
  title: "인터페이스·default 메서드와 다중 역할 계약",
  subtitle: "암시적 멤버 규칙과 default 충돌을 정확히 해석하고 작은 역할·주입·호환성 계약으로 구현 교체를 안전하게 만듭니다.",
  level: "고급",
  estimatedMinutes: 720,
  coreQuestion: "상태 상속 없이 여러 구현이 공유할 역할을 어떻게 선언하고, default/static/private 메서드와 다중 상속 충돌·API 진화를 어떻게 안전하게 통제할까요?",
  summary: "private inventory의 `oop-09-interface`는 직접 원본 Ex01_Interface·Ex08_RemoteControl·Ex09_TV·Ex10_Speaker·Ex15_Soccer 다섯 파일을 가리킵니다. 실제 실행과 compile dependency를 놓치지 않도록 Ex02_Main·Ex03_InterfaceDemo·Ex11_Main·Ex12_Sport·Ex13_Hobby·Ex14_Guitar·Ex16_BassGuitar·Ex17_Main 여덟 파일도 포함해 범위13을 확정했습니다. class06 package 전체22는 exit0이지만 Ex07_InterfaceDemo가 Ex04_InterfaceDemo.java 안 auxiliary Ex05_InterfaceDemo를 다른 source file에서 참조해 같은 compiler warning2를 냅니다. 범위13은 warning0·main3·compile-only10입니다. Ex02는 interface constants10·20·30·40과 play·sound·inherited default powerOn·interface static powerOff의8행을 출력합니다. Ex11 input1/2는 TV/Speaker 공통 네 operations를 각5행으로 실행하고 input9→2는 retry를 포함해7행입니다. Ex17의 compile-time choice1은 Soccer concrete path와 Hobby role path에서 서로 다른 Soccer objects를 만들며5행을 출력합니다. 이 기준선 위에서 interface fields의 public static final, abstract methods의 public abstract, concrete/abstract implementer obligations, multiple interface extension, default/private/static methods, class-wins·more-specific·explicit conflict resolution, RemoteControl 주입, class+multiple roles, ISP/DIP, binary evolution, marker/capability 경계, negative compiler suite까지 확장합니다.",
  objectives: [
    "interface field·abstract/default/static/private method와 nested type의 암시적/명시적 modifiers를 reflection과 JLS로 설명할 수 있다.",
    "concrete class의 implementation 의무, abstract class의 지연, interface의 multiple extends를 구분하고 접근·throws·return 계약을 지킬 수 있다.",
    "default method의 상속·override·InterfaceName.super 호출과 private helper 범위를 사용하고 static method가 상속/override되지 않음을 설명할 수 있다.",
    "class method 우선, 더 구체적인 subinterface 우선, unrelated defaults의 명시 override라는 충돌 해결 순서를 적용할 수 있다.",
    "RemoteControl·Hobby 같은 역할을 constructor injection과 다중 implements로 조합하되 compile-time surface와 object identity를 보존할 수 있다.",
    "consumer 중심의 작은 interface와 DIP/ISP를 적용하고 marker·capability·보안 authorization을 구분할 수 있다.",
    "interface 진화의 abstract/default 추가와 binary/source compatibility 위험을 실행·reflection·negative compiler contracts로 검증할 수 있다.",
  ],
  prerequisites: [{ title: "추상 클래스와 템플릿 메서드", reason: "abstract class가 interface 구현 의무를 미룰 수 있는 이유와 shared state/template inheritance 대비를 이해해야 interface 역할 계약을 정확히 선택할 수 있습니다.", sessionSlug: "oop-08-abstract" }],
  keywords: ["interface", "implements", "public static final", "public abstract", "default method", "private interface method", "static interface method", "multiple inheritance of type", "default conflict", "Interface.super", "RemoteControl", "role interface", "DIP", "ISP", "consumer-owned interface", "binary compatibility", "AbstractMethodError", "marker interface", "capability"],
  chapters: [
    {
      id: "thirteen-source-golden-audit",
      title: "direct5와 실행·dependency8을 묶고 package auxiliary warning2와 scope warning0을 분리 감사합니다",
      lead: "interface 선언만 읽지 않고 실제 구현·caller·class 역할 dependency까지 compile/run해 원본 범위를 닫습니다.",
      explanations: [
        "inventory direct5는 Ex01 interface 문법, Ex08 RemoteControl, Ex09 TV, Ex10 Speaker, Ex15 Soccer입니다. 그러나 Ex01 실행에는 Ex02/03, RemoteControl 실행에는 Ex11, Soccer/Hobby 실행에는 Ex12/13/14/16/17이 필요해 범위13으로 확장합니다.",
        "class06 package 전체22는 compile exit0과 warning code `compiler.warn.auxiliary.class.accessed.from.outside.of.its.source.file` 두 건을 냅니다. Ex04 파일 안 package-private Ex05 interface를 Ex07이 다른 source file에서 참조한 구조가 원인입니다.",
        "OOP09 최소 실행 dependency 범위13은 Ex04/06/07을 포함하지 않아 warning 없이 compile됩니다. main은 Ex02·Ex11·Ex17 세 개이고 나머지10은 compile-only declarations입니다.",
        "Ex02는 네 interface fields가 선언 modifier 모양과 무관하게10·20·30·40으로 접근되고 concrete play `놀이`, sound `듣기`, inherited default `전원 켜짐`, interface static `전원 꺼짐`을 이어 출력합니다.",
        "Ex11 input1/2는 같은 RemoteControl surface의 powerOn→volumeUp→volumeDown→powerOff를 TV/Speaker body로 dispatch합니다. input9→2는 invalid message 뒤 prompt를 반복하고 Speaker를 실행합니다.",
        "Ex17은 final choice1이라 active run은 Soccer만 선택합니다. concrete Soccer path에서 play·inherited Sport sound·addr을 출력한 뒤 separator, 새 Soccer를 Hobby reference로 만들어 play를 다시 출력합니다. 두 new이므로 같은 객체 재사용이 아닙니다.",
        "Ex10의 Cleaner/Reference/Map imports는 사용되지 않지만 javac -Xlint:all이 unused-import warning을 제공하지는 않습니다. IDE/linter concern과 compiler warning evidence를 섞지 않습니다.",
      ],
      concepts: [
        { term: "direct inventory source", definition: "inventory가 이 세션의 중심 근거로 직접 지정한 다섯 파일입니다.", detail: ["Ex01·08·09·10·15입니다.", "실행 dependencies와 구분합니다."] },
        { term: "auxiliary-class warning", definition: "top-level type이 이름이 다른 source file에 함께 선언되고 다른 file에서 참조될 때 javac가 낼 수 있는 구조 경고입니다.", detail: ["Ex05가 Ex04 file 안에 있습니다.", "Ex07 references 두 곳에서 warning2입니다."] },
        { term: "role-complete scope", definition: "direct declarations를 실제 compile/run하기 위해 필요한 callers·superclasses·interfaces·alternative implementers까지 포함한 범위입니다.", detail: ["총13 files입니다.", "main3/compile-only10입니다."] },
      ],
      codeExamples: [{
        id: "powershell-original-oop09-audit",
        title: "package22·scope13과 세 mains 네 입력 경로를 exact process contracts로 감사합니다",
        language: "powershell",
        filename: "verify-original-oop09.ps1",
        purpose: "auxiliary warning ownership, interface member execution, RemoteControl retry, Soccer/Hobby role output을 공백 포함 temp에서 재현합니다.",
        code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("oop09 audit " + [Guid]::NewGuid().ToString("N"))
if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
try {
  $lf = [string][char]10
  $crlf = [string][char]13 + [char]10
  $source = "src\com\java\class06"
  $all = @(Get-ChildItem -LiteralPath $source -Filter "*.java" | Sort-Object Name | ForEach-Object FullName)
  $scopeNames = @("Ex01_Interface.java", "Ex02_Main.java", "Ex03_InterfaceDemo.java",
    "Ex08_RemoteControl.java", "Ex09_TV.java", "Ex10_Speaker.java", "Ex11_Main.java",
    "Ex12_Sport.java", "Ex13_Hobby.java", "Ex14_Guitar.java", "Ex15_Soccer.java",
    "Ex16_BassGuitar.java", "Ex17_Main.java")
  $scoped = @($scopeNames | ForEach-Object { Join-Path $source $_ })
  $packageOut = Join-Path $root "package classes"
  $scopeOut = Join-Path $root "scope classes"
  New-Item -ItemType Directory -Path $packageOut, $scopeOut -ErrorAction Stop | Out-Null

  $saved = @{}
  foreach ($name in @("JDK_JAVAC_OPTIONS", "JDK_JAVA_OPTIONS", "JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS")) {
    if (Test-Path "Env:$name") { $saved[$name] = (Get-Item "Env:$name").Value; Remove-Item "Env:$name" }
  }
  try {
    $packageCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $packageOut $all 2>&1)
    $packageExit = $LASTEXITCODE
    $packageText = $packageCompiler -join [Environment]::NewLine
    $warningCodes = @([regex]::Matches($packageText, 'compiler\.warn\.[A-Za-z0-9_.]+') | ForEach-Object Value)
    if ($packageExit -ne 0 -or $all.Count -ne 22 -or $warningCodes.Count -ne 2 -or
        @($warningCodes | Where-Object { $_ -ne "compiler.warn.auxiliary.class.accessed.from.outside.of.its.source.file" }).Count -ne 0 -or
        -not $packageText.Contains("Ex07_InterfaceDemo.java") -or -not $packageText.Contains("Ex04_InterfaceDemo.java")) { throw "unexpected package diagnostics" }

    $scopeCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $scopeOut $scoped 2>&1)
    $scopeExit = $LASTEXITCODE
    if ($scopeExit -ne 0 -or $scoped.Count -ne 13 -or $scopeCompiler.Count -ne 0) { throw "scope compile failed or warned" }
  } finally {
    foreach ($name in @("JDK_JAVAC_OPTIONS", "JDK_JAVA_OPTIONS", "JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS")) { Remove-Item "Env:$name" -ErrorAction SilentlyContinue }
    foreach ($entry in $saved.GetEnumerator()) { Set-Item "Env:$($entry.Key)" $entry.Value }
  }
  $mainPattern = 'public\s+static\s+void\s+main\s*\('
  $mainCount = @($scoped | Where-Object { (Get-Content -Raw -LiteralPath $_) -match $mainPattern }).Count
  $compileOnlyCount = $scoped.Count - $mainCount
  if ($mainCount -ne 3 -or $compileOnlyCount -ne 10) { throw "scope role mismatch" }

  function Invoke-Java([string]$mainClass, [string]$stdin) {
    $start = [Diagnostics.ProcessStartInfo]::new()
    $start.FileName = "java"
    [void]$start.ArgumentList.Add("-Dfile.encoding=UTF-8")
    [void]$start.ArgumentList.Add("-cp")
    [void]$start.ArgumentList.Add($scopeOut)
    [void]$start.ArgumentList.Add($mainClass)
    $start.UseShellExecute = $false
    $start.RedirectStandardInput = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $start.StandardOutputEncoding = [Text.UTF8Encoding]::new($false)
    $start.StandardErrorEncoding = [Text.UTF8Encoding]::new($false)
    foreach ($name in @("JDK_JAVAC_OPTIONS", "JDK_JAVA_OPTIONS", "JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS")) { [void]$start.Environment.Remove($name) }
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
        [void]$stdoutTask.GetAwaiter().GetResult()
        [void]$stderrTask.GetAwaiter().GetResult()
        throw "java process timeout"
      }
      $result = [pscustomobject]@{
        Exit = $process.ExitCode
        Out = $stdoutTask.GetAwaiter().GetResult().Replace($crlf, $lf)
        Err = $stderrTask.GetAwaiter().GetResult().Replace($crlf, $lf)
      }
    } finally {
      $process.Dispose()
    }
    $result
  }

  $members = Invoke-Java "com.java.class06.Ex02_Main" ""
  $tv = Invoke-Java "com.java.class06.Ex11_Main" ("1" + $lf)
  $speaker = Invoke-Java "com.java.class06.Ex11_Main" ("2" + $lf)
  $retry = Invoke-Java "com.java.class06.Ex11_Main" ("9" + $lf + "2" + $lf)
  $roles = Invoke-Java "com.java.class06.Ex17_Main" ""
  $prompt = "조작 대상을 입력하세요. 1. TV, 2. Speaker" + $lf
  $expectedMembers = "10" + $lf + "20" + $lf + "30" + $lf + "40" + $lf + "놀이" + $lf + "듣기" + $lf + "전원 켜짐" + $lf + "전원 꺼짐" + $lf
  $expectedTv = $prompt + "TV 전원 ON" + $lf + "TV 볼륨 증가" + $lf + "TV 볼륨 감소" + $lf + "TV 전원 OFF" + $lf
  $expectedSpeaker = $prompt + "스피커 전원 ON" + $lf + "스피커 볼륨 증가" + $lf + "스피커 볼륨 감소" + $lf + "스피커 전원 OFF" + $lf
  $expectedRetry = $prompt + "다시 입력하세요." + $lf + $prompt + "스피커 전원 ON" + $lf + "스피커 볼륨 증가" + $lf + "스피커 볼륨 감소" + $lf + "스피커 전원 OFF" + $lf
  $expectedRoles = "축구 시작" + $lf + "응원가" + $lf + "서울" + $lf + "========" + $lf + "축구 시작" + $lf
  if ($members.Exit -ne 0 -or $members.Out -cne $expectedMembers -or $members.Err.Length -ne 0) { throw "member contract mismatch" }
  if ($tv.Exit -ne 0 -or $tv.Out -cne $expectedTv -or $tv.Err.Length -ne 0) { throw "tv contract mismatch" }
  if ($speaker.Exit -ne 0 -or $speaker.Out -cne $expectedSpeaker -or $speaker.Err.Length -ne 0) { throw "speaker contract mismatch" }
  if ($retry.Exit -ne 0 -or $retry.Out -cne $expectedRetry -or $retry.Err.Length -ne 0) { throw "retry contract mismatch" }
  if ($roles.Exit -ne 0 -or $roles.Out -cne $expectedRoles -or $roles.Err.Length -ne 0) { throw "role contract mismatch" }

  "spacePath=$($root.Contains(' ')),packageCompiled=$($all.Count),packageExit=$packageExit,packageWarnings=$($warningCodes.Count),packageWarningCode=$($warningCodes[0]),warningUse=Ex07_InterfaceDemo.java,auxiliaryOwner=Ex04_InterfaceDemo.java"
  "scopedCompiled=$($scoped.Count),scopeExit=$scopeExit,scopeWarnings=$($scopeCompiler.Count),mains=$mainCount,compileOnly=$compileOnlyCount"
  "Ex02=exit:$($members.Exit),lines:8,constants:10|20|30|40,sequence:play|sound|defaultOn|staticOff"
  "Ex11[input=1]=exit:$($tv.Exit),lines:5,device:TV,sequence:on|up|down|off,prompts:1,retries:0"
  "Ex11[input=2]=exit:$($speaker.Exit),lines:5,device:Speaker,sequence:on|up|down|off,prompts:1,retries:0"
  "Ex11[input=9,2]=exit:$($retry.Exit),lines:7,device:Speaker,sequence:on|up|down|off,prompts:2,retries:1"
  "Ex17=exit:$($roles.Exit),lines:5,choice:1,concrete:Soccer,superSound:True,addressPresent:True,separator:True,hobby:Soccer"
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }
  if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" }
}`,
        walkthrough: [
          { lines: "1-17", explanation: "normalized 공백 포함 GUID root, class06 package22, 실행 dependency scope13, 별도 output directories를 구성합니다." },
          { lines: "19-38", explanation: "네 외부 Java option 환경변수를 격리하고 package auxiliary warning2의 code/use/owner와 scope warning0을 exact assertion한 뒤 환경을 복원합니다." },
          { lines: "39-42", explanation: "source에서 main3·compile-only10을 동적으로 계산합니다." },
          { lines: "44-82", explanation: "ProcessStartInfo와 child option 제거, stdout/stderr 동시 비동기 배출,10초 timeout·process-tree kill, finally dispose로 세 mains를 안전하게 수집합니다." },
          { lines: "84-99", explanation: "Ex02, Ex11 input1/2/9→2, Ex17의 trailing newline까지 포함한 raw strings를 exact 비교합니다." },
          { lines: "101-107", explanation: "원본 raw 문구는 관계·count·sequence summary로 출력합니다." },
          { lines: "108-113", explanation: "temp direct-child boundary를 재확인한 뒤 생성 root만 삭제합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11", "javastudy2/classstudy root", "four Java launcher option variables isolated and restored", "10-second runtime timeout plus 5-second termination grace per Java child"], command: "pwsh -NoProfile -File verify-original-oop09.ps1" },
        output: { value: "spacePath=True,packageCompiled=22,packageExit=0,packageWarnings=2,packageWarningCode=compiler.warn.auxiliary.class.accessed.from.outside.of.its.source.file,warningUse=Ex07_InterfaceDemo.java,auxiliaryOwner=Ex04_InterfaceDemo.java\nscopedCompiled=13,scopeExit=0,scopeWarnings=0,mains=3,compileOnly=10\nEx02=exit:0,lines:8,constants:10|20|30|40,sequence:play|sound|defaultOn|staticOff\nEx11[input=1]=exit:0,lines:5,device:TV,sequence:on|up|down|off,prompts:1,retries:0\nEx11[input=2]=exit:0,lines:5,device:Speaker,sequence:on|up|down|off,prompts:1,retries:0\nEx11[input=9,2]=exit:0,lines:7,device:Speaker,sequence:on|up|down|off,prompts:2,retries:1\nEx17=exit:0,lines:5,choice:1,concrete:Soccer,superSound:True,addressPresent:True,separator:True,hobby:Soccer", explanation: ["package warning2는 Ex07→Ex04-file auxiliary type 구조이고 scope13 자체는 clean입니다.", "Ex02의 interface member 네 종류와 Ex11의 두 implementations/retry가 exact합니다.", "Ex17은 choice1 Soccer concrete path와 별도 Hobby Soccer path를 실행합니다."] },
        experiments: [
          { change: "Ex05_InterfaceDemo를 Ex05_InterfaceDemo.java top-level file로 분리합니다.", prediction: "package auxiliary warning2가 사라집니다.", result: "warning 원인은 interface semantics가 아니라 source-file/type 배치입니다." },
          { change: "Ex11 입력을9만 주고 stdin을 닫습니다.", prediction: "retry prompt 뒤 Scanner가 다음 int를 읽지 못해 NoSuchElementException으로 exit1합니다.", result: "invalid value retry와 input exhaustion failure를 구분합니다." },
          { change: "Ex17 choice를2로 바꿉니다.", prediction: "BassGuitar concrete path와 Hobby play가 실행됩니다.", result: "active original choice1과 alternative source branch를 구분합니다." },
        ],
        sourceRefs: ["java-class06-ex01", "java-class06-ex02", "java-class06-ex03", "java-class06-ex08", "java-class06-ex09", "java-class06-ex10", "java-class06-ex11", "java-class06-ex12", "java-class06-ex13", "java-class06-ex14", "java-class06-ex15", "java-class06-ex16", "java-class06-ex17", "jdk21-javac", "dotnet-process-start-info", "powershell-environment-variables", "dotnet-process-environment", "dotnet-process-lifecycle", "dotnet-stream-reader-async"],
      }],
      diagnostics: [
        { symptom: "class06 전체 warning2를 RemoteControl interface 오류로 보고했다.", likelyCause: "package smoke와 scope13 compile을 섞고 diagnostic source/use-owner를 보지 않았습니다.", checks: ["warning code와 Ex07 use lines를 봅니다.", "Ex05가 Ex04 file 안에 있는지 봅니다.", "scope13 output을 따로 확인합니다."], fix: "package auxiliary warning2와 OOP09 scope warning0을 별도로 기록합니다.", prevention: "broad package와 atomic role scope에 서로 다른 -d/source lists를 사용합니다." },
        { symptom: "Ex17 Hobby reference가 앞의 Soccer object를 재사용한다고 설명했다.", likelyCause: "두 branch에 있는 두 new 표현식을 하나로 보았습니다.", checks: ["new 개수를 셉니다.", "각 variable assignment를 추적합니다.", "identity를 출력하려면 ==를 사용합니다."], fix: "원본은 choice1에서 Soccer 두 객체를 만들며 interface reference가 두 번째 객체를 가리킨다고 교정합니다.", prevention: "reference view와 allocation count를 별 열로 기록합니다." },
      ],
      expertNotes: ["javac Xlint는 일반 unused import warning을 제공하지 않으므로 IDE inspection 결과를 javac warning count로 과장하지 않습니다.", "stdout/stderr를 동시에 배출하고 timeout 뒤 process tree를 종료해 pipe 교착·무한 대기 위험을 제한하며, 실제 CI도 승인된 toolchain/environment manifest를 함께 기록해야 합니다."],
    },
    {
      id: "interface-member-grammar-reflection",
      title: "interface fields는 public static final, body 없는 instance methods는 public abstract이며 constructor/instance state가 없습니다",
      lead: "예약어를 생략할 수 있다는 사실과 modifier 의미가 없는 것은 다릅니다.",
      explanations: [
        "Ex01의 su1, `static su2`, `final su3`, `static final su4`는 source 표기가 달라도 모두 암시적으로 public static final입니다. 값을 선언 시 초기화해야 하며 implementing object마다 복제되는 fields가 아닙니다.",
        "body 없는 `void play();`와 `public abstract void sound();`는 모두 public abstract instance methods입니다. implementing class의 method도 public이어야 하며 package-private로 좁히면 compile 실패합니다.",
        "interface는 constructor를 선언하지 않고 직접 new할 수 없습니다. interface 자체가 instance field storage를 제공하지 않지만 static constants, default/private instance behavior, static behavior와 nested types는 선언할 수 있습니다.",
        "default method는 public instance method body를 제공하고 isDefault=true입니다. static method는 interface type에 속하고 private method는 interface body 내부 helper이며 implementer에 inherited되지 않습니다.",
        "interface member type은 public static으로 취급됩니다. class처럼 non-static inner instance를 제공한다고 그리지 않고 enclosing instance 없이 type namespace에 속한다고 이해합니다.",
        "상수 container로 interface를 구현해 constants를 가져오는 constant-interface antipattern은 type relationship을 오염시킵니다. constants는 final utility/value type 또는 enum/config owner에 둡니다.",
      ],
      concepts: [
        { term: "implicit interface field modifiers", definition: "interface field declaration에 생략되어도 적용되는 public static final modifiers입니다.", detail: ["선언 시 initializer가 필요합니다.", "class identity의 constant field입니다."] },
        { term: "implicit abstract method", definition: "default/static/private가 아니고 body가 없는 interface method에 적용되는 public abstract contract입니다.", detail: ["implementer가 public으로 구현합니다.", "abstract keyword는 생략 가능합니다."] },
        { term: "interface member type", definition: "interface 안에 선언된 class/interface/enum/record로 public static 의미를 갖는 nested type입니다.", detail: ["outer instance가 필요 없습니다.", "역할 namespace로 사용할 수 있습니다."] },
      ],
      codeExamples: [{
        id: "java-interface-member-shape",
        title: "서로 다르게 적은 fields4와 abstract/default/static/private methods의 실제 modifiers를 검사합니다",
        language: "java",
        filename: "InterfaceMemberShapeLab.java",
        purpose: "Ex01의 생략 가능한 modifiers를 reflection structural contract로 확인하고 constructor0을 증명합니다.",
        code: String.raw`import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;

public class InterfaceMemberShapeLab {
    interface Contract {
        int first = 10;
        static int second = 20;
        final int third = 30;
        static final int fourth = 40;
        void play();
        default String powerOn() { return helper(); }
        static String powerOff() { return "off"; }
        private String helper() { return "on"; }
    }

    public static void main(String[] args) throws Exception {
        boolean fieldsExact = Arrays.stream(Contract.class.getDeclaredFields())
                .allMatch(field -> Modifier.isPublic(field.getModifiers())
                        && Modifier.isStatic(field.getModifiers()) && Modifier.isFinal(field.getModifiers()));
        Method play = Contract.class.getDeclaredMethod("play");
        Method powerOn = Contract.class.getDeclaredMethod("powerOn");
        Method powerOff = Contract.class.getDeclaredMethod("powerOff");
        Method helper = Contract.class.getDeclaredMethod("helper");
        System.out.println("fields=" + Contract.class.getDeclaredFields().length + ",publicStaticFinal=" + fieldsExact);
        System.out.println("abstractPublic=" + Modifier.isAbstract(play.getModifiers()) + "|" + Modifier.isPublic(play.getModifiers()));
        System.out.println("default=" + powerOn.isDefault());
        System.out.println("static=" + Modifier.isStatic(powerOff.getModifiers()));
        System.out.println("private=" + Modifier.isPrivate(helper.getModifiers()));
        System.out.println("constructors=" + Contract.class.getDeclaredConstructors().length);
    }
}`,
        walkthrough: [
          { lines: "6-15", explanation: "Ex01과 같은 네 field 표기와 abstract/default/static/private method 종류를 한 interface에 둡니다." },
          { lines: "18-24", explanation: "모든 declared fields와 네 methods를 reflection으로 찾습니다." },
          { lines: "25-30", explanation: "modifiers, default flag, interface constructor0을 deterministic shape로 출력합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("InterfaceMemberShapeLab.java", "InterfaceMemberShapeLab") },
        output: { value: "fields=4,publicStaticFinal=true\nabstractPublic=true|true\ndefault=true\nstatic=true\nprivate=true\nconstructors=0", explanation: ["네 field의 source modifier 차이에도 runtime modifiers는 모두 public/static/final입니다.", "play는 public abstract, powerOn은 default, powerOff static, helper private입니다.", "interface declared constructor는0입니다."] },
        experiments: [
          { change: "first initializer를 제거해 `int first;`로 둡니다.", prediction: "interface field에 initializer가 필요해 compile error입니다.", result: "instance별 나중 assignment 대상이 아닙니다." },
          { change: "helper를 protected로 바꿉니다.", prediction: "interface method에 protected modifier를 허용하지 않아 compile error입니다.", result: "subclass state 공유 surface와 interface helper를 구분합니다." },
          { change: "Contract를 구현해 constants만 얻는 class를 만듭니다.", prediction: "문법상 가능할 수 있어도 play 구현 의무와 거짓 is-a 관계가 생깁니다.", result: "constant interface antipattern을 피합니다." },
        ],
        sourceRefs: ["java-class06-ex01", "java-class06-ex02", "jls-interface-fields", "jls-interface-methods", "jls-interface-member-types", "java-reflection-method", "java-modifier-api"],
      }],
      diagnostics: [
        { symptom: "su1은 static을 안 썼으니 object마다 있다고 설명했다.", likelyCause: "interface field의 implicit public static final을 놓쳤습니다.", checks: ["declaring type이 interface인지 확인합니다.", "reflection modifiers를 봅니다.", "assignment 가능 여부를 compile합니다."], fix: "네 Ex01 fields가 모두 interface constants임을 교정합니다.", prevention: "생략된 modifiers를 읽을 때 명시 형태로 다시 써 봅니다." },
        { symptom: "implementer의 play를 package-private로 작성해 compile이 실패한다.", likelyCause: "interface abstract method의 implicit public access를 좁혔습니다.", checks: ["interface method modifier를 확인합니다.", "implementation access를 봅니다.", "@Override를 붙입니다."], fix: "implementation을 public으로 선언합니다.", prevention: "interface implementations에는 @Override와 explicit public을 사용합니다." },
      ],
      expertNotes: ["public static final field도 OOP05에서 다룬 compile-time constant 조건을 만족하면 client에 인라인될 수 있어 값 진화 정책이 필요합니다.", "reflection declared methods에는 compiler bridge/synthetic artifacts가 포함될 수 있으므로 source method count와 항상 같다고 가정하지 않습니다."],
    },
    {
      id: "implementation-obligation-and-deferral",
      title: "concrete class는 모든 abstract 역할을 구현하고 abstract class·subinterface는 의무를 확장하거나 다음 concrete type으로 미룹니다",
      lead: "‘override할 필요 없다’가 아니라 현재 type이 concrete instance 생성 책임을 아직 갖지 않는 것입니다.",
      explanations: [
        "Ex03 concrete class는 Ex01의 play와 sound를 public으로 모두 구현해야 합니다. default powerOn은 상속해도 되고 선택적으로 override할 수 있으며 static powerOff는 상속 대상이 아닙니다.",
        "Ex04 abstract class는 Ex01을 implements하면서 play/sound를 아직 구현하지 않아도 compile됩니다. 그러나 의무가 사라진 것이 아니라 concrete subclass Ex06이 inherited abstract methods와 Ex04 run을 모두 구현해야 합니다.",
        "Ex05 subinterface는 `extends Ex01_Interface`로 parent abstract/default contracts를 이어 받고 stop을 추가합니다. interface가 interface를 연결할 때 implements가 아니라 extends를 사용하며 여러 parents를 extends할 수 있습니다.",
        "class는 하나의 superclass만 extends하지만 여러 interfaces를 implements할 수 있습니다. 이는 implementation state의 다중 상속이 아니라 여러 type/behavior contracts의 조합입니다.",
        "default method body가 있어도 implementer가 override하면 dynamic dispatch는 구현 body를 사용합니다. `InterfaceName.super.defaultMethod()`는 direct superinterface default를 명시 호출할 때만 사용합니다.",
        "구현 의무는 단순 method name뿐 아니라 public access, return substitutability, checked throws를 포함합니다. OOP07 override 계약을 interface implementation에도 그대로 적용합니다.",
      ],
      concepts: [
        { term: "implementation obligation", definition: "concrete implementing class가 inherited public abstract methods에 호환 body를 제공해야 하는 compile-time 책임입니다.", detail: ["모든 inherited roles를 포함합니다.", "default는 이미 body가 있습니다."] },
        { term: "abstract deferral", definition: "abstract class가 미구현 interface methods를 남겨 다음 concrete subclass가 구현하게 하는 구조입니다.", detail: ["의무 소멸이 아닙니다.", "direct new가 불가능합니다."] },
        { term: "multiple interface extension", definition: "한 interface가 여러 superinterfaces의 contracts를 extends해 새 역할 계약을 만드는 기능입니다.", detail: ["state 다중 상속이 아닙니다.", "default conflict 가능성이 있습니다."] },
      ],
      codeExamples: [{
        id: "java-interface-obligation-chain",
        title: "abstract class와 subinterface가 미룬 세 obligations를 final concrete class가 한 번에 완성합니다",
        language: "java",
        filename: "InterfaceObligationChainLab.java",
        purpose: "Ex03~07의 concrete/abstract/interface extension 차이를 한 warning-free hierarchy와 reflection shape로 검증합니다.",
        code: String.raw`import java.lang.reflect.Modifier;

public class InterfaceObligationChainLab {
    interface BaseRole {
        String play();
        default String powerOn() { return "on"; }
    }

    interface ExtendedRole extends BaseRole {
        String stop();
    }

    static abstract class Deferred implements BaseRole {
        abstract String name();
    }

    static final class Complete extends Deferred implements ExtendedRole {
        @Override public String play() { return "play"; }
        @Override public String stop() { return "stop"; }
        @Override String name() { return "complete"; }
    }

    public static void main(String[] args) {
        ExtendedRole role = new Complete();
        System.out.println("actions=" + role.play() + "|" + role.stop() + "|" + role.powerOn());
        System.out.println("abstractDeferred=" + Modifier.isAbstract(Deferred.class.getModifiers()));
        System.out.println("interfaces=" + Complete.class.getInterfaces().length);
        System.out.println("name=" + ((Complete) role).name());
    }
}`,
        walkthrough: [
          { lines: "4-11", explanation: "BaseRole의 abstract/default와 ExtendedRole의 추가 obligation을 정의합니다." },
          { lines: "13-15", explanation: "abstract Deferred는 play를 미룬 채 class-specific name obligation도 추가합니다." },
          { lines: "17-21", explanation: "Complete가 inherited play, subinterface stop, abstract-class name을 모두 구현합니다." },
          { lines: "24-28", explanation: "ExtendedRole surface dispatch와 Deferred abstract shape, Complete direct interface count를 출력합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("InterfaceObligationChainLab.java", "InterfaceObligationChainLab") },
        output: { value: "actions=play|stop|on\nabstractDeferred=true\ninterfaces=1\nname=complete", explanation: ["Complete가 두 interface obligations와 abstract-class obligation을 만족합니다.", "default powerOn은 override 없이 inherited됩니다.", "Complete의 direct interface는 ExtendedRole 하나이고 BaseRole relation은 transitive입니다."] },
        experiments: [
          { change: "Complete의 stop 구현을 제거합니다.", prediction: "Complete is not abstract and does not override stop compile error입니다.", result: "subinterface가 추가한 obligation도 concrete class까지 전달됩니다." },
          { change: "Deferred에서 abstract를 제거합니다.", prediction: "play를 구현하지 않은 concrete class라 compile error입니다.", result: "deferral은 abstract declaration에 의존합니다." },
          { change: "ExtendedRole을 `implements BaseRole`로 바꿉니다.", prediction: "interface declaration에서 implements를 사용할 수 없어 compile error입니다.", result: "interface-to-interface는 extends입니다." },
        ],
        sourceRefs: ["java-class06-ex01", "java-class06-ex03", "java-class06-ex15", "jls-interface-inheritance", "jls-interface-implementation", "jls-abstract-class", "jls-overriding", "jls-class-overriding", "jls-class-override-requirements"],
      }],
      diagnostics: [
        { symptom: "abstract class가 interface methods를 구현하지 않아도 되니 obligation이 없다고 설명했다.", likelyCause: "현재 abstract type의 direct-new 금지와 hierarchy 전체 implementation 책임을 혼동했습니다.", checks: ["class가 abstract인지 봅니다.", "first concrete subclass를 찾습니다.", "unimplemented methods를 모읍니다."], fix: "의무가 concrete boundary까지 deferred된다고 교정합니다.", prevention: "각 hierarchy node에 remaining obligations를 표로 적습니다." },
        { symptom: "Complete가 BaseRole과 ExtendedRole 두 direct interfaces를 갖는다고 reflection count를 예상했다.", likelyCause: "transitive superinterface와 direct implements clause를 같은 것으로 셌습니다.", checks: ["source implements list를 봅니다.", "getInterfaces 결과를 확인합니다.", "isAssignableFrom으로 transitive relation을 검사합니다."], fix: "direct interface1과 transitive BaseRole subtype relation을 구분합니다.", prevention: "구조 tests에 direct/transitive 질문을 명시합니다." },
      ],
      expertNotes: ["abstract adapter class가 interface evolution을 완충할 수 있지만 single class inheritance slot을 소비하고 hidden defaults를 만들 수 있어 composition/default methods와 비교합니다.", "interface segregation은 concrete class의 method 수를 줄이는 것보다 각 consumer가 실제 필요한 contract만 의존하게 하는 것이 핵심입니다."],
    },
    {
      id: "default-method-private-helper-super-call",
      title: "default는 선택적 instance 기본 구현이고 private helper는 interface 내부 중복을 숨기며 InterfaceName.super로 direct default를 재사용합니다",
      lead: "default가 abstract obligation을 없애는 범위와 implementer가 override하는 범위를 분리해야 합니다.",
      explanations: [
        "Ex01 powerOn은 default body가 있어 Ex03이 구현하지 않아도 inherited됩니다. Ex02의 demo.powerOn은 따라서 `전원 켜짐`을 출력합니다. implementer는 필요할 때 public override로 대체할 수 있습니다.",
        "default method는 public instance method이므로 interface-typed receiver에서 dynamic dispatch됩니다. static utility나 field initializer와 달리 implementing object가 receiver입니다.",
        "override body에서 특정 direct superinterface default를 재사용하려면 `InterfaceName.super.method()` 문법을 사용합니다. 일반 class의 `super.method()`와 달리 어떤 direct superinterface인지 이름으로 지정합니다.",
        "Java9 이후 private interface method는 여러 default/static bodies가 공유하는 helper를 public contract에 노출하지 않게 합니다. private instance helper는 default instance body에서, private static helper는 static/default bodies에서 사용할 수 있습니다.",
        "private helper는 implementer에 inherited되지 않고 override할 수 없습니다. Ex01 play01은 현재 다른 method에서 호출되지 않아 runtime evidence가 없으며 존재만으로 contract surface가 되지 않습니다.",
        "default에 많은 workflow/state assumptions를 넣으면 implementations가 보이지 않는 behavior를 상속합니다. 작은 호환 기본값에는 유용하지만 필수 순서·invariant는 explicit service/template/composition과 비교합니다.",
      ],
      concepts: [
        { term: "default method", definition: "interface가 public instance contract와 기본 body를 함께 제공하는 method입니다.", detail: ["implementer override는 선택입니다.", "receiver로 dynamic dispatch됩니다."] },
        { term: "private interface helper", definition: "interface body 내부 default/static methods가 공유하지만 외부 contract와 implementer에는 노출되지 않는 helper입니다.", detail: ["Java9부터 허용됩니다.", "override 대상이 아닙니다."] },
        { term: "qualified superinterface call", definition: "override body에서 direct superinterface의 특정 default body를 `Role.super.method()`로 선택하는 호출입니다.", detail: ["direct 관계가 필요합니다.", "같은 receiver를 사용합니다."] },
      ],
      codeExamples: [{
        id: "java-default-private-super",
        title: "inherited default와 Interface.super 확장 모두 같은 private validation helper를 거칩니다",
        language: "java",
        filename: "DefaultPrivateSuperLab.java",
        purpose: "default inheritance, private helper encapsulation, qualified superinterface reuse를 exact behavior로 검증합니다.",
        code: String.raw`public class DefaultPrivateSuperLab {
    interface Lifecycle {
        default String start() { return validate() + ">start"; }
        private String validate() { return "validate"; }
    }

    static final class Basic implements Lifecycle {}

    static final class Custom implements Lifecycle {
        @Override public String start() {
            return Lifecycle.super.start() + ">custom";
        }
    }

    static String run(Lifecycle lifecycle) { return lifecycle.start(); }

    public static void main(String[] args) {
        System.out.println("basic=" + run(new Basic()));
        System.out.println("custom=" + run(new Custom()));
        System.out.println("privateMethods=" + java.util.Arrays.stream(Lifecycle.class.getDeclaredMethods())
                .filter(method -> java.lang.reflect.Modifier.isPrivate(method.getModifiers())).count());
    }
}`,
        walkthrough: [
          { lines: "2-5", explanation: "public default start가 private validate를 호출해 helper를 contract 밖에 숨깁니다." },
          { lines: "7", explanation: "Basic은 implementation 없이 default를 그대로 상속합니다." },
          { lines: "9-13", explanation: "Custom은 public override에서 Lifecycle.super.start를 명시 재사용한 뒤 behavior를 확장합니다." },
          { lines: "15-21", explanation: "같은 Lifecycle caller와 reflection private-method count를 출력합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("DefaultPrivateSuperLab.java", "DefaultPrivateSuperLab") },
        output: { value: "basic=validate>start\ncustom=validate>start>custom\nprivateMethods=1", explanation: ["Basic은 inherited default를, Custom은 같은 default 뒤 custom을 실행합니다.", "private validate는 reflection declared shape에는 있지만 public role surface에는 없습니다."] },
        experiments: [
          { change: "Custom의 Lifecycle.super.start를 `super.start()`로 바꿉니다.", prediction: "Object/superclass에 start가 없어 compile되지 않습니다.", result: "interface default 선택은 qualified syntax를 사용합니다." },
          { change: "validate를 protected로 바꿉니다.", prediction: "interface method에 protected를 허용하지 않아 compile error입니다.", result: "subclass hook이 아니라 interface-private helper입니다." },
          { change: "Basic에 public start override를 추가합니다.", prediction: "basic output은 새 body로 바뀌고 private validate는 직접 호출할 수 없습니다.", result: "default override와 private helper visibility를 구분합니다." },
        ],
        sourceRefs: ["java-class06-ex01", "java-class06-ex02", "java-class06-ex03", "jls-default-methods", "jls-private-interface-methods", "jls-superinterface-call", "java-reflection-method"],
      }],
      diagnostics: [
        { symptom: "default method도 static이라 object 없이 호출할 수 있다고 생각했다.", likelyCause: "body가 있다는 공통점만 보고 instance default와 interface static을 합쳤습니다.", checks: ["method modifiers를 봅니다.", "receiver가 필요한지 확인합니다.", "isDefault/isStatic reflection을 비교합니다."], fix: "default는 public instance method, static은 interface type method로 분리합니다.", prevention: "호출 문법과 dispatch 여부를 method 종류별 표로 둡니다." },
        { symptom: "implementer에서 interface private helper를 override하거나 호출하려 한다.", likelyCause: "private helper를 inherited protected hook처럼 이해했습니다.", checks: ["helper access를 봅니다.", "interface public contract 목록을 봅니다.", "default body 안 호출인지 확인합니다."], fix: "helper는 interface 내부에만 두고 implementer extension은 public/default abstract hook을 별도로 설계합니다.", prevention: "private helper를 API documentation의 implementer contract에 노출하지 않습니다." },
      ],
      expertNotes: ["default body가 새로운 checked/unchecked failure나 side effect를 도입하면 기존 implementer가 source 변경 없이 behavior가 달라질 수 있어 API evolution review가 필요합니다.", "private helper로 중복을 줄여도 interface가 큰 stateful framework가 되면 작은 역할 경계를 잃으므로 composition을 검토합니다."],
    },
    {
      id: "default-conflict-resolution",
      title: "class 구현이 우선하고 더 구체적인 subinterface가 이기며 unrelated defaults는 구현 class가 명시 해결합니다",
      lead: "‘여러 interface를 구현할 수 있다’는 말은 같은 signature의 inherited bodies를 compiler가 임의 선택한다는 뜻이 아닙니다.",
      explanations: [
        "class 또는 superclass에 concrete instance method가 있으면 동일 signature의 interface default보다 class method가 우선합니다. 이를 class-wins rule이라 부르며 기존 class hierarchy behavior를 default 추가가 조용히 바꾸지 않게 합니다.",
        "한 default를 선언한 interface가 다른 interface의 subtype이면 더 구체적인 subinterface default가 선택됩니다. inheritance graph의 specificity가 있어 ambiguity가 아닙니다.",
        "서로 관련 없는 A와 B가 같은 default signature를 제공하면 class는 명시 override해야 합니다. override body에서 A.super와 B.super를 선택·조합하거나 완전히 새 behavior를 정의합니다.",
        "compiler는 unrelated defaults 중 선언 순서나 implements 순서로 하나를 고르지 않습니다. 충돌 해결을 caller에 미루지도 않고 implementing class declaration 시점에 요구합니다.",
        "abstract declaration이 inherited default를 다시 abstract로 만들거나 superclass method access가 충분하지 않은 경우 등 세부 규칙도 있습니다. 단순 암기 대신 class methods와 superinterface graph를 그립니다.",
        "default 충돌은 역할이 같은 이름에 서로 다른 의미를 붙였다는 설계 신호일 수 있습니다. 우연히 이름만 같은 unrelated operations라면 더 구체적인 names/interfaces로 분리합니다.",
      ],
      concepts: [
        { term: "class-wins rule", definition: "class hierarchy의 concrete instance method가 interface default보다 우선하는 resolution입니다.", detail: ["기존 class behavior를 보존합니다.", "static methods와는 별개입니다."] },
        { term: "most-specific superinterface", definition: "여러 inherited defaults 중 subtype 관계상 더 구체적인 interface declaration을 선택하는 규칙입니다.", detail: ["Child default가 Parent default보다 우선합니다.", "unrelated이면 적용되지 않습니다."] },
        { term: "explicit conflict override", definition: "unrelated defaults가 충돌할 때 implementing class가 같은 signature를 override해 선택/조합하는 해결입니다.", detail: ["A.super/B.super를 사용할 수 있습니다.", "implements 순서로 해결하지 않습니다."] },
      ],
      codeExamples: [{
        id: "java-default-conflict-resolution",
        title: "class-wins·more-specific·explicit A+B 세 resolution 결과를 한 번에 비교합니다",
        language: "java",
        filename: "DefaultConflictResolutionLab.java",
        purpose: "default conflict 우선순위를 runtime exact output과 compile-valid declarations로 검증합니다.",
        code: String.raw`public class DefaultConflictResolutionLab {
    interface A { default String label() { return "A"; } }
    interface B { default String label() { return "B"; } }

    static class Parent { public String label() { return "class"; } }
    static final class ClassWins extends Parent implements A, B {}

    interface ChildA extends A {
        @Override default String label() { return "ChildA"; }
    }
    static final class MoreSpecific implements ChildA {}

    static final class Explicit implements A, B {
        @Override public String label() { return A.super.label() + "+" + B.super.label(); }
    }

    public static void main(String[] args) {
        System.out.println("classWins=" + new ClassWins().label());
        System.out.println("moreSpecific=" + new MoreSpecific().label());
        System.out.println("explicit=" + new Explicit().label());
    }
}`,
        walkthrough: [
          { lines: "2-3", explanation: "unrelated A/B가 같은 default signature를 제공합니다." },
          { lines: "5-6", explanation: "Parent concrete label이 두 defaults보다 우선해 ClassWins는 별 override가 필요 없습니다." },
          { lines: "8-11", explanation: "ChildA가 A보다 구체적인 default를 제공해 MoreSpecific이 이를 상속합니다." },
          { lines: "13-15", explanation: "Explicit은 A/B conflict를 public override와 qualified super calls로 해결합니다." },
          { lines: "18-21", explanation: "세 resolution paths를 deterministic labels로 출력합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("DefaultConflictResolutionLab.java", "DefaultConflictResolutionLab") },
        output: { value: "classWins=class\nmoreSpecific=ChildA\nexplicit=A+B", explanation: ["class hierarchy method가 A/B defaults보다 우선합니다.", "subinterface ChildA가 A보다 구체적입니다.", "unrelated A/B는 Explicit이 두 bodies를 명시 조합합니다."] },
        experiments: [
          { change: "ClassWins의 Parent 상속을 제거하고 A,B만 구현합니다.", prediction: "unrelated defaults conflict로 compile되지 않습니다.", result: "class-wins 근거가 사라졌습니다." },
          { change: "Explicit override를 제거합니다.", prediction: "inherits unrelated defaults 오류입니다.", result: "implements 순서는 tie-breaker가 아닙니다." },
          { change: "ChildA label override를 제거합니다.", prediction: "moreSpecific=A가 됩니다.", result: "ChildA가 inherited A default만 전달합니다." },
        ],
        sourceRefs: ["jls-default-methods", "jls-default-conflicts", "jls-class-method-inheritance", "jls-class-method-conflicts", "jls-superinterface-call"],
      }],
      diagnostics: [
        { symptom: "A,B implements 순서를 바꾸면 선택 default가 바뀔 것으로 예상했다.", likelyCause: "interface list를 procedural priority list로 봤습니다.", checks: ["superinterface subtype 관계를 그립니다.", "class concrete method를 찾습니다.", "explicit override 존재를 봅니다."], fix: "class-wins→most-specific→explicit conflict resolution 순서로 판단합니다.", prevention: "unrelated defaults는 즉시 named override로 의미를 결정합니다." },
        { symptom: "default conflict를 해결하려 A.super를 direct superinterface가 아닌 조상에 사용했다.", likelyCause: "qualified super call의 direct-superinterface 제약을 놓쳤습니다.", checks: ["implements/extends direct list를 봅니다.", "redundant parent relation을 확인합니다.", "most-specific owner를 찾습니다."], fix: "직접 superinterface를 qualification하거나 hierarchy/override body를 재구성합니다.", prevention: "default resolution graph와 call owner를 함께 문서화합니다." },
      ],
      expertNotes: ["library interface에 default를 추가하면 downstream interfaces의 기존 same-signature defaults와 새 conflict를 만들 수 있어 source/binary ecosystem matrix가 필요합니다.", "Object public methods와 override-equivalent default 선언에는 별 제약이 있어 interface가 Object semantics를 default로 가로채지 못합니다."],
    },
    {
      id: "static-method-and-interface-constant-boundary",
      title: "interface static method는 상속·override되지 않고 type으로 호출하며 constants는 API 진화 위험을 가진 public static final입니다",
      lead: "Ex01 powerOff는 demo.powerOff가 아니라 Ex01_Interface.powerOff로 호출해야 ownership과 언어 규칙이 맞습니다.",
      explanations: [
        "interface static method는 interface type에 속하고 implementing class 또는 instance에 inherited되지 않습니다. Ex02가 `Ex01_Interface.powerOff()`를 사용하는 이유이며 implementer에 같은 signature static을 선언해도 별 method이지 override가 아닙니다.",
        "static interface method는 @Override 대상이 아니고 dynamic dispatch에 참여하지 않습니다. 구현 교체가 필요한 operation을 static으로 두면 polymorphic contract가 되지 않으므로 instance abstract/default method를 선택합니다.",
        "interface fields는 모두 public static final입니다. primitive/String field가 constant expression으로 초기화되면 client binary에 인라인될 수 있어 library에서 값을 바꿔도 오래된 client가 이전 값을 볼 수 있습니다.",
        "constants만 공유하려 class가 interface를 implements하는 constant-interface pattern은 거짓 역할 관계와 namespace pollution을 만듭니다. `Settings.LIMIT`처럼 owner를 명시하거나 enum/value/config object를 사용합니다.",
        "static factory는 interface에 둘 수 있고 구현 class를 감춘 construction entry가 될 수 있습니다. 그러나 environment-dependent dependency를 global static locator로 숨기지 않고 composition root에서 주입합니다.",
        "interface static/private static method가 body를 가질 수 있다는 사실과 abstract instance contract를 혼동하지 않습니다. method modifier가 호출 문법·receiver·dispatch를 결정합니다.",
      ],
      concepts: [
        { term: "interface static method", definition: "interface type 자체에 속하며 implementers에 inherited/overridden되지 않는 method입니다.", detail: ["InterfaceName.method로 호출합니다.", "receiver dispatch가 없습니다."] },
        { term: "constant-interface antipattern", definition: "constants 이름을 unqualified로 쓰기 위해 역할 관계가 없는 class가 interface를 implements하는 설계입니다.", detail: ["API surface를 오염시킵니다.", "owner type qualification을 선호합니다."] },
        { term: "constant inlining risk", definition: "compile-time constant value가 client class file에 포함되어 producer-only 변경 뒤 stale value가 남을 수 있는 위험입니다.", detail: ["binary version skew입니다.", "evolution 값은 method/config를 검토합니다."] },
      ],
      codeExamples: [{
        id: "java-interface-static-constant",
        title: "constant owner와 static owner를 interface 이름으로 호출하고 reflection modifiers를 확인합니다",
        language: "java",
        filename: "InterfaceStaticConstantLab.java",
        purpose: "Ex01/02의 constants와 static powerOff를 synthetic Settings로 재현하고 implementer inheritance와 구분합니다.",
        code: String.raw`import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

public class InterfaceStaticConstantLab {
    interface Settings {
        int LIMIT = 7;
        static String owner() { return "interface"; }
    }

    static final class Implementation implements Settings {
        static String owner() { return "implementation"; }
    }

    public static void main(String[] args) throws Exception {
        Method interfaceOwner = Settings.class.getDeclaredMethod("owner");
        System.out.println("limit=" + Settings.LIMIT);
        System.out.println("settingsOwner=" + Settings.owner());
        System.out.println("implementationOwner=" + Implementation.owner());
        System.out.println("sameDeclaration=" + (interfaceOwner.getDeclaringClass() == Settings.class));
        System.out.println("static=" + Modifier.isStatic(interfaceOwner.getModifiers()));
    }
}`,
        walkthrough: [
          { lines: "5-8", explanation: "Settings constant와 static method를 interface owner에 선언합니다." },
          { lines: "10-12", explanation: "implementer의 same-name static은 override가 아닌 별 declaration입니다." },
          { lines: "15-20", explanation: "각 type으로 qualification하고 interface method declaring class/static shape를 출력합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("InterfaceStaticConstantLab.java", "InterfaceStaticConstantLab") },
        output: { value: "limit=7\nsettingsOwner=interface\nimplementationOwner=implementation\nsameDeclaration=true\nstatic=true", explanation: ["LIMIT와 Settings.owner는 interface가 owner입니다.", "Implementation.owner는 상속 override가 아니라 별 static method입니다.", "reflection declaring class도 Settings입니다."] },
        experiments: [
          { change: "Implementation.owner에 @Override를 붙입니다.", prediction: "static method가 supertype instance method를 override하지 않아 compile error입니다.", result: "same name과 override relation을 구분합니다." },
          { change: "Settings.LIMIT에 assignment를 시도합니다.", prediction: "final variable assignment compile error입니다.", result: "interface field는 암시적으로 final입니다." },
          { change: "client와 producer를 따로 compile한 뒤 LIMIT를8로 producer만 바꿉니다.", prediction: "old client는7을 계속 볼 수 있습니다.", result: "public constant 값 변경은 client recompile 정책이 필요합니다." },
        ],
        sourceRefs: ["java-class06-ex01", "java-class06-ex02", "jls-interface-fields", "jls-static-interface-methods", "jls-class-method-inheritance", "jls-binary-constants", "java-reflection-method", "java-modifier-api"],
      }],
      diagnostics: [
        { symptom: "demo.powerOff 또는 Implementation.owner로 interface static을 상속 호출하려 했다.", likelyCause: "interface static method를 inherited instance/default method로 오해했습니다.", checks: ["declaring interface를 봅니다.", "method static modifier를 확인합니다.", "InterfaceName qualification을 사용합니다."], fix: "interface static은 선언 interface type으로 직접 호출합니다.", prevention: "교체 가능한 behavior는 instance contract로, type utility만 static으로 둡니다." },
        { symptom: "interface constant 값을 배포 후 바꿨는데 일부 clients가 이전 값을 본다.", likelyCause: "constant variable이 old client binary에 인라인됐습니다.", checks: ["primitive/String final+constant expression 조건을 확인합니다.", "client compile version을 봅니다.", "producer-only deploy인지 확인합니다."], fix: "clients를 recompile/redeploy하거나 진화 값은 method/configuration으로 옮깁니다.", prevention: "public constants를 binary compatibility review 대상에 둡니다." },
      ],
      expertNotes: ["static factory가 concrete implementation을 숨길 수 있지만 호출자가 lifecycle/credentials를 선택해야 한다면 injected factory가 더 명시적입니다.", "interface constants는 public API이므로 이름·값·단위·version 의미를 변경할 때 source/binary/semantic compatibility를 함께 봅니다."],
    },
    {
      id: "remote-control-strategy-injection",
      title: "RemoteControl 구현 선택을 factory에 두고 consumer는 non-null interface를 constructor로 주입받아 같은 명령 흐름을 실행합니다",
      lead: "interface 변수를 null로 시작하는 원본 학습 구조를 selection result와 valid dependency invariant로 바꿉니다.",
      explanations: [
        "Ex11은 input이1이면 TV,2이면 Speaker를 RemoteControl variable에 넣고 null이 아닌 때까지 반복합니다. valid selection 뒤 같은 네 method calls가 runtime implementation에 dispatch되는 핵심은 정확합니다.",
        "다만 caller가 null placeholder와 input loop, object creation, operation sequence를 모두 소유하면 UI와 device behavior가 결합됩니다. factory는 choice→implementation/absence를, RemoteSession은 공통 command sequence를 담당하게 분리합니다.",
        "constructor injection으로 RemoteSession을 만들 때 non-null RemoteControl을 요구하면 operations 안에서 매번 null check를 반복하지 않습니다. unknown choice는 Optional.empty 또는 typed failure로 session 생성 전에 끝납니다.",
        "TV/Speaker implementations는 같은 four-method signature뿐 아니라 on/off state, volume bounds, failure semantics 같은 행동 계약도 맞춰야 합니다. 실제 device adapter라면 shared contract suite를 둡니다.",
        "interface는 concrete type import를 consumer에서 제거하지만 creation composition root는 implementations를 알아야 합니다. dependency가 사라지는 것이 아니라 안정적인 방향으로 이동합니다.",
        "원본 retry loop는 invalid integer를 처리하지만 non-integer token과 stdin exhaustion은 별 failure입니다. parsing/UI boundary를 factory와 섞지 않고 syntax/domain errors를 구분합니다.",
      ],
      concepts: [
        { term: "interface injection", definition: "consumer가 concrete implementation을 직접 new하지 않고 required role interface를 constructor로 받는 구조입니다.", detail: ["test fake를 넣을 수 있습니다.", "dependency direction이 role을 향합니다."] },
        { term: "composition root", definition: "configuration/input에 따라 concrete implementations를 선택하고 object graph를 조립하는 application boundary입니다.", detail: ["factory/registry가 위치합니다.", "business consumer와 분리합니다."] },
        { term: "valid dependency invariant", definition: "consumer가 생성된 뒤에는 required interface collaborator가 non-null이고 사용할 준비가 됐다는 조건입니다.", detail: ["operation마다 null check가 없습니다.", "unknown은 construction 전 실패합니다."] },
      ],
      codeExamples: [{
        id: "java-remote-control-injection",
        title: "TV·Speaker를 같은 RemoteSession에 주입하고 invalid choice는 session 전에 거부합니다",
        language: "java",
        filename: "RemoteControlInjectionLab.java",
        purpose: "Ex08~11의 구현 교체를 null-free factory+constructor injection으로 재구성하고 command order를 exact 검증합니다.",
        code: String.raw`import java.util.List;
import java.util.Optional;

public class RemoteControlInjectionLab {
    interface RemoteControl {
        String powerOn();
        String volumeUp();
        String volumeDown();
        String powerOff();
    }

    static final class Tv implements RemoteControl {
        public String powerOn() { return "TV ON"; }
        public String volumeUp() { return "TV UP"; }
        public String volumeDown() { return "TV DOWN"; }
        public String powerOff() { return "TV OFF"; }
    }

    static final class Speaker implements RemoteControl {
        public String powerOn() { return "Speaker ON"; }
        public String volumeUp() { return "Speaker UP"; }
        public String volumeDown() { return "Speaker DOWN"; }
        public String powerOff() { return "Speaker OFF"; }
    }

    record RemoteSession(RemoteControl remote) {
        RemoteSession {
            if (remote == null) throw new IllegalArgumentException("remote required");
        }
        String operate() {
            return String.join("|", List.of(remote.powerOn(), remote.volumeUp(), remote.volumeDown(), remote.powerOff()));
        }
    }

    static Optional<RemoteSession> select(int choice) {
        return switch (choice) {
            case 1 -> Optional.of(new RemoteSession(new Tv()));
            case 2 -> Optional.of(new RemoteSession(new Speaker()));
            default -> Optional.empty();
        };
    }

    public static void main(String[] args) {
        System.out.println("tv=" + select(1).orElseThrow().operate());
        System.out.println("speaker=" + select(2).orElseThrow().operate());
        System.out.println("invalid=" + select(9).map(RemoteSession::operate).orElse("unsupported"));
    }
}`,
        walkthrough: [
          { lines: "5-10", explanation: "RemoteControl이 consumer가 필요한 four-operation role을 선언합니다." },
          { lines: "12-24", explanation: "TV/Speaker가 같은 public contract를 provider-specific markers로 구현합니다." },
          { lines: "26-33", explanation: "RemoteSession은 non-null dependency와 고정 command order를 소유합니다." },
          { lines: "35-41", explanation: "selection boundary가 choice를 valid session 또는 absence로 바꿉니다." },
          { lines: "44-47", explanation: "두 valid implementations와 invalid choice를 NPE 없이 출력합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("RemoteControlInjectionLab.java", "RemoteControlInjectionLab") },
        output: { value: "tv=TV ON|TV UP|TV DOWN|TV OFF\nspeaker=Speaker ON|Speaker UP|Speaker DOWN|Speaker OFF\ninvalid=unsupported", explanation: ["RemoteSession command sequence는 동일하고 injected body만 TV/Speaker로 달라집니다.", "choice9는 null RemoteControl을 만들지 않고 unsupported로 끝납니다."] },
        experiments: [
          { change: "`select`에 case 3/choice 3인 Projector 구현을 추가합니다.", prediction: "RemoteSession 변경 없이 같은 four-operation sequence가 실행됩니다.", result: "selection 확장과 consumer flow를 분리합니다." },
          { change: "RemoteSession null check를 제거하고 null을 전달합니다.", prediction: "operate 첫 call에서 NPE가 납니다.", result: "required role은 construction boundary에서 검증합니다." },
          { change: "Speaker가 volumeDown을 구현하지 않게 합니다.", prediction: "concrete class가 abstract method를 구현하지 않아 compile error입니다.", result: "interface가 structural completeness를 강제합니다." },
        ],
        sourceRefs: ["java-class06-ex08", "java-class06-ex09", "java-class06-ex10", "java-class06-ex11", "java-optional-api", "jls-runtime-method-lookup", "dip-primary"],
      }],
      diagnostics: [
        { symptom: "invalid choice 뒤 remote.powerOn에서 NPE가 난다.", likelyCause: "selection failure를 null implementation으로 표현해 valid role과 섞었습니다.", checks: ["factory return을 봅니다.", "consumer constructor validation을 확인합니다.", "unknown path를 test합니다."], fix: "Optional/result로 selection을 끝내고 valid non-null dependency만 session에 주입합니다.", prevention: "role collections/fields에 null sentinel을 저장하지 않습니다." },
        { symptom: "test에서 실제 TV/Speaker output과 input loop까지 항상 실행해야 한다.", likelyCause: "consumer가 concrete construction·UI parsing을 직접 소유해 interface seam을 활용하지 못합니다.", checks: ["new 위치를 찾습니다.", "constructor parameter type을 봅니다.", "fake RemoteControl 주입 가능성을 확인합니다."], fix: "composition root에서 implementation을 선택하고 consumer에는 interface fake/real을 주입합니다.", prevention: "business flow tests와 adapter/process tests를 분리합니다." },
      ],
      expertNotes: ["hardware/network adapter interface에는 timeout·cancellation·idempotency·thread-safety와 partial failure semantics도 포함해야 단순 method shape를 넘어 substitutable합니다.", "DI framework 없이 plain constructor injection만으로 dependency direction과 test isolation을 얻을 수 있습니다."],
    },
    {
      id: "class-inheritance-plus-multiple-roles",
      title: "class state는 한 superclass에서 상속하고 Hobby 같은 여러 역할 interfaces를 같은 객체 identity에 조합합니다",
      lead: "interface 구현이 별 역할 객체를 자동 생성하는 것이 아니라 한 Soccer/BassGuitar object가 여러 type views를 만족합니다.",
      explanations: [
        "Ex15 Soccer는 Ex12 Sport를 extends해 addr/count/sound 구현을 상속하고 Ex13 Hobby를 implements해 play obligation을 제공합니다. class state/implementation reuse와 역할 contract를 한 declaration에서 조합합니다.",
        "Ex16 BassGuitar도 Guitar class behavior와 Hobby role을 조합합니다. Java class는 direct superclass 하나만 갖지만 interfaces는 여러 개 구현할 수 있어 unrelated capabilities를 type surface로 추가할 수 있습니다.",
        "Hobby reference에서는 play만 compile-time에 보입니다. runtime object가 Soccer라도 Sport.sound/addr은 Hobby surface에 없으므로 직접 접근할 수 없습니다. 역할이 필요한 consumer가 concrete state에 결합하지 않게 합니다.",
        "upcast는 같은 object reference를 보존합니다. 이 합성 예제는 기존 Soccer를 Hobby에 저장해 ==true를 검증하지만 원본 Ex17은 concrete path와 role path에서 new를 두 번 사용해 서로 다른 objects입니다.",
        "여러 interface를 구현한다고 구현 state가 여러 copies 생기지 않습니다. default bodies는 method inheritance 규칙을 따르고 fields는 interface public static final constants뿐입니다.",
        "interface roles가 너무 많고 methods가 서로 강하게 결합되면 god object가 될 수 있습니다. responsibilities가 실제 한 object invariant에 속하는지 composition/delegation과 비교합니다.",
      ],
      concepts: [
        { term: "multiple role implementation", definition: "한 concrete class가 여러 interface contracts를 implements해 같은 object를 여러 소비자 관점으로 제공하는 구조입니다.", detail: ["object는 하나입니다.", "각 view의 surface가 다릅니다."] },
        { term: "single class inheritance", definition: "Java class가 direct superclass를 하나만 extends해 state/implementation hierarchy를 이루는 제한입니다.", detail: ["interfaces는 여러 개 가능합니다.", "default conflicts는 해결해야 합니다."] },
        { term: "role view", definition: "같은 runtime object를 특정 interface가 선언한 operations만 보이는 compile-time reference로 다루는 관점입니다.", detail: ["Hobby는 play만 보입니다.", "coupling을 줄입니다."] },
      ],
      codeExamples: [{
        id: "java-class-plus-role-interfaces",
        title: "Soccer/Bass가 class behavior와 Hobby role을 조합하고 동일 Soccer identity를 두 views로 봅니다",
        language: "java",
        filename: "ClassPlusRolesLab.java",
        purpose: "Ex12~17의 extends+implements 구조와 compile-time role surface, identity를 privacy-safe values로 재현합니다.",
        code: String.raw`public class ClassPlusRolesLab {
    static class Sport {
        String sound() { return "응원가"; }
        boolean hasAddress() { return true; }
    }
    interface Hobby { String play(); }
    static final class Soccer extends Sport implements Hobby {
        public String play() { return "축구 시작"; }
    }

    static class Guitar {
        String sound() { return "연주하기"; }
        int rows() { return 6; }
    }
    static final class BassGuitar extends Guitar implements Hobby {
        public String play() { return "베이스 기타 시작"; }
    }

    public static void main(String[] args) {
        Soccer soccer = new Soccer();
        Hobby soccerRole = soccer;
        BassGuitar bass = new BassGuitar();
        Hobby bassRole = bass;
        System.out.println("soccer=" + soccer.play() + "|" + soccer.sound() + "|addressPresent=" + soccer.hasAddress());
        System.out.println("bass=" + bass.play() + "|" + bass.sound() + "|rows=" + bass.rows());
        System.out.println("roles=" + soccerRole.play() + "|" + bassRole.play());
        System.out.println("sameSoccer=" + (soccer == soccerRole));
    }
}`,
        walkthrough: [
          { lines: "2-9", explanation: "Sport class behavior와 Hobby role을 Soccer 한 object type에 조합합니다." },
          { lines: "11-17", explanation: "Guitar class behavior와 같은 Hobby role을 BassGuitar에 조합합니다." },
          { lines: "20-28", explanation: "concrete/role views, inherited class methods, same Soccer identity를 출력합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("ClassPlusRolesLab.java", "ClassPlusRolesLab") },
        output: { value: "soccer=축구 시작|응원가|addressPresent=true\nbass=베이스 기타 시작|연주하기|rows=6\nroles=축구 시작|베이스 기타 시작\nsameSoccer=true", explanation: ["각 concrete type은 superclass behavior와 Hobby play를 모두 가집니다.", "Hobby views는 play만 호출하지만 runtime body는 Soccer/Bass입니다.", "합성 예제의 soccer/soccerRole은 same identity입니다."] },
        experiments: [
          { change: "soccerRole.sound()를 호출합니다.", prediction: "Hobby surface에 sound가 없어 compile error입니다.", result: "runtime Soccer가 compile-time role surface를 넓히지 않습니다." },
          { change: "Soccer가 두 번째 interface Schedulable도 구현하게 합니다.", prediction: "required method를 구현하면 한 object가 Hobby/Schedulable 두 role views를 가집니다.", result: "multiple role implementation이 가능합니다." },
          { change: "원본처럼 soccerRole에 new Soccer를 따로 대입합니다.", prediction: "sameSoccer=false가 됩니다.", result: "implements가 identity를 정하지 않고 new 지점이 allocation을 정합니다." },
        ],
        sourceRefs: ["java-class06-ex12", "java-class06-ex13", "java-class06-ex14", "java-class06-ex15", "java-class06-ex16", "java-class06-ex17", "jls-interface-implementation", "jls-widening-reference"],
      }],
      diagnostics: [
        { symptom: "Hobby reference에서 sound/addr/rows를 사용할 수 없어 interface가 구현을 잃었다고 생각했다.", likelyCause: "runtime object capabilities와 compile-time role surface를 혼동했습니다.", checks: ["reference declared type을 봅니다.", "operation owner를 찾습니다.", "consumer가 그 concrete 기능을 정말 필요로 하는지 검토합니다."], fix: "필요한 role로 주입하거나 안전한 composition API를 설계하고 무분별한 cast를 피합니다.", prevention: "consumer가 필요한 최소 surface만 parameter로 받습니다." },
        { symptom: "extends class와 implements interface가 부모 객체/역할 객체를 각각 만든다고 설명했다.", likelyCause: "type relations와 allocations를 같은 것으로 봤습니다.", checks: ["new 표현식 수를 셉니다.", "== identity를 확인합니다.", "한 object layout/view를 그립니다."], fix: "한 new object가 superclass state와 여러 role contracts를 만족한다고 교정합니다.", prevention: "type arrow와 heap allocation arrow를 별도로 표시합니다." },
      ],
      expertNotes: ["interface default state는 없으므로 role별 mutable state가 필요하면 implementing object fields나 composed collaborator가 명시적으로 소유해야 합니다.", "role 조합이 특정 combinations만 허용한다면 constructor/factory validation 또는 sealed composition model로 invalid combinations을 막습니다."],
    },
    {
      id: "interface-segregation-consumer-owned-contracts",
      title: "큰 공급자 중심 interface를 소비자별 작은 capability로 나누고 high-level policy가 abstraction에 의존하게 합니다",
      lead: "interface를 만들었다는 사실만으로 결합도가 낮아지지 않으며 누가 어떤 이유로 변하는 contract인지가 중요합니다.",
      explanations: [
        "Ex08 RemoteControl의 네 operations는 TV/Speaker 모두 자연스럽게 지원해 학습 예제로 적절합니다. 그러나 mute/channel/input/source처럼 기능이 늘면 일부 devices가 의미 없는 no-op/UnsupportedOperationException을 구현할 수 있습니다.",
        "ISP는 모든 class의 method 수를 무조건 최소화하는 규칙이 아니라 client가 사용하지 않는 methods에 의존하도록 강요받지 않게 하는 원칙입니다. PowerButton은 PowerControl만, VolumePanel은 VolumeControl만 받습니다.",
        "consumer-owned interface는 high-level use case가 필요로 하는 최소 protocol을 application boundary에 정의하고 vendor SDK adapter가 구현합니다. 공급자 API 전체를 그대로 domain interface로 복사하지 않습니다.",
        "DIP는 high-level policy와 low-level detail 모두 stable abstraction을 향하게 하고 concrete wiring은 composition root로 이동합니다. 단순히 interface 파일을 low-level package에 두는 것으로 끝나지 않습니다.",
        "작은 interfaces가 지나치게 세분되어 항상 같은 묶음으로 이동하면 구성 복잡성만 늘 수 있습니다. independent change reason, substitutability, consumer sets를 근거로 경계를 정합니다.",
        "test fake는 consumer가 실제 호출하는 작은 contract만 구현해 쉽고 명확합니다. 그러나 fake와 production adapter가 drift하지 않도록 shared contract/integration tests도 필요합니다.",
      ],
      concepts: [
        { term: "Interface Segregation Principle", definition: "client가 사용하지 않는 operations에 의존하도록 강요하지 말라는 설계 원칙입니다.", detail: ["consumer별 capability를 봅니다.", "method-count 최소화 자체가 목표는 아닙니다."] },
        { term: "Dependency Inversion Principle", definition: "high-level policy와 low-level details가 stable abstraction에 의존하고 concrete assembly를 외부로 이동시키는 원칙입니다.", detail: ["constructor injection과 연결됩니다.", "ownership direction이 중요합니다."] },
        { term: "consumer-owned interface", definition: "consumer/use-case가 필요한 최소 protocol을 자신의 경계에서 정의하고 adapters가 맞추는 contract입니다.", detail: ["vendor surface 복제를 피합니다.", "변화 이유가 명확합니다."] },
      ],
      codeExamples: [{
        id: "java-segregated-consumer-interfaces",
        title: "PowerButton과 VolumePanel이 각각 필요한 role만 받고 TV·Speaker·fake를 독립 주입합니다",
        language: "java",
        filename: "SegregatedInterfacesLab.java",
        purpose: "fat RemoteControl 대안을 작은 consumer contracts와 constructor injection으로 구현하고 fake test seam을 보입니다.",
        code: String.raw`public class SegregatedInterfacesLab {
    interface PowerControl { String powerOn(); }
    interface VolumeControl { String volumeUp(); }

    static final class Tv implements PowerControl, VolumeControl {
        public String powerOn() { return "TV:on"; }
        public String volumeUp() { return "TV:up"; }
    }

    static final class Speaker implements VolumeControl {
        public String volumeUp() { return "Speaker:up"; }
    }

    record PowerButton(PowerControl control) {
        String press() { return control.powerOn(); }
    }
    record VolumePanel(VolumeControl control) {
        String up() { return control.volumeUp(); }
    }

    static final class RecordingPower implements PowerControl {
        int calls;
        public String powerOn() { calls++; return "fake:on"; }
    }

    public static void main(String[] args) {
        Tv tv = new Tv();
        System.out.println("power=" + new PowerButton(tv).press());
        System.out.println("volume=" + new VolumePanel(tv).up());
        System.out.println("speakerVolume=" + new VolumePanel(new Speaker()).up());
        RecordingPower fake = new RecordingPower();
        new PowerButton(fake).press();
        System.out.println("fakeCalls=" + fake.calls);
    }
}`,
        walkthrough: [
          { lines: "2-3", explanation: "power와 volume을 서로 다른 consumer capability로 선언합니다." },
          { lines: "5-12", explanation: "TV는 두 roles, Speaker는 자신에게 필요한 volume role만 구현합니다." },
          { lines: "14-19", explanation: "각 high-level consumer가 한 interface dependency만 constructor로 받습니다." },
          { lines: "21-24", explanation: "test fake는 PowerControl 한 operation과 call count만 구현합니다." },
          { lines: "27-34", explanation: "real/fake implementations를 consumer 변경 없이 주입하고 exact outputs를 검사합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("SegregatedInterfacesLab.java", "SegregatedInterfacesLab") },
        output: { value: "power=TV:on\nvolume=TV:up\nspeakerVolume=Speaker:up\nfakeCalls=1", explanation: ["PowerButton은 volume methods를 모르고 VolumePanel은 power methods를 모릅니다.", "Speaker는 의미 없는 power implementation 없이 volume consumer를 만족합니다.", "fake가 정확히 한 call을 기록합니다."] },
        experiments: [
          { change: "PowerButton parameter를 concrete Tv로 바꿉니다.", prediction: "RecordingPower fake와 다른 PowerControl 구현을 주입할 수 없습니다.", result: "high-level policy가 low-level detail에 결합됩니다." },
          { change: "두 interfaces를 다시 하나의 Device로 합칩니다.", prediction: "Speaker가 사용하지 않는 power method 구현을 강요받습니다.", result: "consumer sets가 다른 operations는 분리 후보입니다." },
          { change: "모든 호출자가 항상 두 roles를 함께 요구하도록 바뀝니다.", prediction: "작은 roles를 합성한 facade/interface가 구성 단순성을 높일 수 있습니다.", result: "분리는 실제 change/consumer evidence로 조정합니다." },
        ],
        sourceRefs: ["java-class06-ex08", "java-class06-ex09", "java-class06-ex10", "isp-primary", "dip-primary"],
      }],
      diagnostics: [
        { symptom: "일부 implementer가 지원하지 않는 methods에서 no-op 또는 UnsupportedOperationException을 낸다.", likelyCause: "서로 다른 capabilities를 공급자 중심 fat interface에 묶었습니다.", checks: ["consumer별 실제 호출 set을 수집합니다.", "implementer별 unsupported methods를 찾습니다.", "change reasons를 비교합니다."], fix: "consumer capability interfaces로 분리하고 필요한 consumers가 roles를 조합합니다.", prevention: "새 method 추가 전 모든 implementers/consumers substitutability를 검토합니다." },
        { symptom: "interface가 있지만 high-level class가 내부에서 new Tv를 직접 한다.", likelyCause: "abstraction은 선언했지만 concrete assembly와 dependency direction을 이동하지 않았습니다.", checks: ["new 위치를 찾습니다.", "constructor signature를 봅니다.", "composition root가 있는지 확인합니다."], fix: "interface를 constructor로 주입하고 root/factory에서 concrete adapter를 선택합니다.", prevention: "high-level package가 low-level implementation package를 import하지 않는 architecture test를 둡니다." },
      ],
      expertNotes: ["consumer-owned ports와 vendor adapters 사이에는 data/error normalization이 필요하며 vendor types를 interface signature로 새지 않게 합니다.", "작은 interfaces도 버전·failure·threading semantics가 없으면 안정적 계약이 아니므로 method count보다 behavior documentation을 우선합니다."],
    },
    {
      id: "interface-evolution-binary-default",
      title: "interface에 abstract method를 추가하면 old implementer가 invocation에서 AbstractMethodError를 낼 수 있고 default는 fallback을 제공하지만 충돌 위험이 남습니다",
      lead: "compile 성공과 binary linkage, 실제 invocation behavior, source recompile 결과를 서로 다른 호환성 층으로 봅니다.",
      explanations: [
        "배포된 interface와 해당 method를 제공하지 않는 concrete implementers를 함께 recompile하는 monorepo에서는 새 abstract method가 implementer compile failure로 즉시 드러납니다. 독립 배포 binary 환경에서는 old implementation class가 load될 수 있어도 새 method invocation 시 AbstractMethodError가 날 수 있습니다.",
        "default method를 추가하면 old implementer가 body를 제공하지 않아도 fallback을 받을 수 있어 interface evolution 도구가 됩니다. 하지만 downstream interface/class가 같은 signature를 이미 정의했거나 unrelated defaults가 생기면 source conflict 또는 runtime compatibility 문제가 생길 수 있습니다.",
        "예제는 v1 Service+Impl을 compile한 뒤 Service만 v2 abstract health로 교체하고 v2 Caller를 compile합니다. old Impl에서 health를 호출하면 AbstractMethodError가 cause로 나타납니다.",
        "그 뒤 Service만 v3 default health로 교체하고 새 class loader에서 같은 old Impl/Caller를 실행하면 healthy를 반환합니다. 구현을 recompile하지 않았다는 조건과 loader를 새로 썼다는 조건이 핵심입니다.",
        "default를 빈 no-op 또는 임의 성공으로 두면 compatibility는 유지해도 의미상 오류를 숨길 수 있습니다. 안전한 universal behavior가 없으면 새 subinterface/versioned capability 또는 adapter migration이 낫습니다.",
        "API evolution review는 binary compatibility 표만 보지 않고 old/new interface, implementer, caller 조합과 behavior contract를 실행해야 합니다. linkage 성공은 semantic compatibility가 아닙니다.",
      ],
      concepts: [
        { term: "binary compatibility", definition: "기존 class files를 recompile하지 않고 변경된 library와 link/run할 수 있는 정도입니다.", detail: ["source compatibility와 다릅니다.", "invocation 시 error가 늦게 날 수 있습니다."] },
        { term: "AbstractMethodError", definition: "runtime에 호출할 concrete implementation이 필요한데 receiver class가 해당 method body를 제공하지 못할 때 발생할 수 있는 linkage Error입니다.", detail: ["old implementer+new interface에서 가능합니다.", "Exception보다 Error 계열입니다."] },
        { term: "default evolution fallback", definition: "새 interface operation에 body를 제공해 old implementers가 명시 구현 없이 동작하게 하는 migration 수단입니다.", detail: ["universal semantics가 필요합니다.", "conflict matrix를 검사합니다."] },
      ],
      codeExamples: [{
        id: "java-interface-binary-evolution",
        title: "v1 old Impl에서 v2 abstract는 AbstractMethodError, v3 default는 healthy가 되는 binary matrix를 실행합니다",
        language: "java",
        filename: "InterfaceBinaryEvolutionLab.java",
        purpose: "interface abstract/default method 추가의 차이를 producer/implementer/caller 분리 compile과 fresh loaders로 exact 검증합니다.",
        code: String.raw`import java.lang.reflect.InvocationTargetException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;

public class InterfaceBinaryEvolutionLab {
    static void compile(JavaCompiler compiler, Path output, String classpath, Path... sources) throws Exception {
        DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
        try (StandardJavaFileManager manager = compiler.getStandardFileManager(diagnostics, null, null)) {
            var units = manager.getJavaFileObjectsFromPaths(List.of(sources));
            List<String> options = List.of("--release", "21", "-proc:none", "-Xlint:all",
                    "-classpath", classpath, "-d", output.toString());
            boolean ok = compiler.getTask(null, manager, diagnostics, options, null, units).call();
            long errors = diagnostics.getDiagnostics().stream().filter(item -> item.getKind() == Diagnostic.Kind.ERROR).count();
            long warnings = diagnostics.getDiagnostics().stream().filter(item -> item.getKind() == Diagnostic.Kind.WARNING
                    || item.getKind() == Diagnostic.Kind.MANDATORY_WARNING).count();
            if (!ok || errors != 0 || warnings != 0 || !diagnostics.getDiagnostics().isEmpty()) {
                throw new AssertionError("unexpected compile diagnostics: " + diagnostics.getDiagnostics());
            }
        }
    }

    static void deleteTree(Path root) throws Exception {
        if (!Files.exists(root)) return;
        try (var paths = Files.walk(root)) {
            for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) Files.delete(path);
        }
    }

    public static void main(String[] args) throws Exception {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) throw new IllegalStateException("full JDK required");
        Path base = Path.of(System.getProperty("java.io.tmpdir")).toAbsolutePath().normalize();
        Path root = base.resolve("interface-evolution-" + UUID.randomUUID()).normalize();
        if (!root.getParent().equals(base) || Files.exists(root)) throw new IllegalStateException("unsafe root");
        try {
            Path source = Files.createDirectories(root.resolve("source"));
            Path apiV1 = Files.createDirectories(root.resolve("api-v1"));
            Path implV1 = Files.createDirectories(root.resolve("impl-v1"));
            Path apiV2 = Files.createDirectories(root.resolve("api-v2"));
            Path callerV2 = Files.createDirectories(root.resolve("caller-v2"));
            Path apiV3 = Files.createDirectories(root.resolve("api-v3"));
            Path service = source.resolve("Service.java");
            Path impl = source.resolve("Impl.java");
            Path caller = source.resolve("Caller.java");
            Files.writeString(service, "public interface Service { String run(); }");
            Files.writeString(impl, "public class Impl implements Service { public String run(){ return \"run\"; } }");
            compile(compiler, apiV1, apiV1.toString(), service);
            compile(compiler, implV1, apiV1.toString(), impl);

            Files.writeString(service, "public interface Service { String run(); String health(); }");
            compile(compiler, apiV2, apiV2.toString(), service);
            Files.writeString(caller, "public class Caller { public static String call(){ Service service = new Impl(); return service.health(); } }");
            String v2CompilePath = apiV2 + System.getProperty("path.separator") + implV1;
            compile(compiler, callerV2, v2CompilePath, caller);
            try (URLClassLoader loader = new URLClassLoader(new URL[]{apiV2.toUri().toURL(), implV1.toUri().toURL(), callerV2.toUri().toURL()}, ClassLoader.getPlatformClassLoader())) {
                try {
                    Class.forName("Caller", true, loader).getMethod("call").invoke(null);
                    System.out.println("abstract=unexpected-pass");
                } catch (InvocationTargetException error) {
                    System.out.println("abstract=" + error.getCause().getClass().getSimpleName());
                }
            }

            Files.writeString(service, "public interface Service { String run(); default String health(){ return \"healthy\"; } }");
            compile(compiler, apiV3, apiV3.toString(), service);
            try (URLClassLoader loader = new URLClassLoader(new URL[]{apiV3.toUri().toURL(), implV1.toUri().toURL(), callerV2.toUri().toURL()}, ClassLoader.getPlatformClassLoader())) {
                Class<?> callerType = Class.forName("Caller", true, loader);
                Class<?> implType = Class.forName("Impl", true, loader);
                System.out.println("default=" + callerType.getMethod("call").invoke(null));
                System.out.println("impl=" + implType.getMethod("run").invoke(implType.getConstructor().newInstance()));
            }
        } finally {
            Path resolved = root.toAbsolutePath().normalize();
            if (!resolved.getParent().equals(base)) throw new IllegalStateException("unsafe cleanup");
            deleteTree(resolved);
        }
    }
}`,
        walkthrough: [
          { lines: "17-31", explanation: "각 inner javac task가 JDK21·processing off·Xlint·classpath/-d와 diagnostics0인지 검사합니다." },
          { lines: "33-38", explanation: "GUID tree를 reverse order로 제거하는 helper입니다." },
          { lines: "40-59", explanation: "direct temp boundary 안에서 v1 Service API와 이를 대상으로 compile한 old Impl을 독립 artifact directories에 만듭니다." },
          { lines: "61-73", explanation: "abstract health v2 API와 새 Caller를 v2 API+old Impl classpath로 compile한 뒤 fresh loader에서 invocation cause를 정규화합니다." },
          { lines: "75-82", explanation: "default health v3 API를 별 artifact로 만들고 fresh loader에서 같은 old Impl/Caller가 healthy/run을 반환하는지 봅니다." },
          { lines: "83-87", explanation: "boundary 재확인 뒤 source와 모든 versioned class artifacts를 cleanup합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11 full JDK", "OS temporary directory write permission"], command: isolatedJavaRun("InterfaceBinaryEvolutionLab.java", "InterfaceBinaryEvolutionLab") },
        output: { value: "abstract=AbstractMethodError\ndefault=healthy\nimpl=run", explanation: ["v2 Caller가 old Impl의 missing health를 invoke하면 AbstractMethodError입니다.", "v3 default body가 같은 old Impl에 healthy fallback을 제공합니다.", "old Impl의 기존 run body도 유지됩니다."] },
        experiments: [
          { change: "v2 abstract health 뒤 Impl도 health를 구현해 recompile합니다.", prediction: "abstract=unexpected-pass가 출력됩니다.", result: "새 implementation obligation을 충족하면 linkage error가 없습니다." },
          { change: "v3 default health가 exception을 던지게 합니다.", prediction: "binary fallback은 존재하지만 caller behavior는 실패로 바뀝니다.", result: "binary compatibility와 semantic compatibility를 구분합니다." },
          { change: "old implementation이 이미 unrelated interface의 같은 default를 상속하도록 만듭니다.", prediction: "새 default와 충돌해 source/runtime compatibility 검토가 필요합니다.", result: "default 추가도 무조건 안전한 진화가 아닙니다." },
        ],
        sourceRefs: ["jls-interface-evolution", "jls-default-methods", "java-abstract-method-error", "java-compiler-api", "java-diagnostic-api", "java-classloader-api", "java-files-api", "java-uuid-api"],
      }],
      diagnostics: [
        { symptom: "새 interface method를 호출할 때 old implementation에서 AbstractMethodError가 난다.", likelyCause: "interface/caller는 새 abstract method 기준인데 implementation class는 이전 binary라 body가 없습니다.", checks: ["각 artifact compile version을 확인합니다.", "implementation recompile 여부를 봅니다.", "error가 invocation 시점인지 봅니다."], fix: "implementers를 함께 upgrade/recompile하거나 의미 있는 default/adapter migration을 제공합니다.", prevention: "old/new interface×implementer×caller binary matrix를 release test합니다." },
        { symptom: "default를 추가했더니 downstream build에 conflict가 생긴다.", likelyCause: "기존 class/interface hierarchy에 같은 signature의 unrelated default 또는 method가 있습니다.", checks: ["ecosystem implementers를 검색합니다.", "class-wins/most-specific graph를 그립니다.", "source recompile을 실행합니다."], fix: "명시 override, 다른 method name, versioned subinterface 중 호환 전략을 선택합니다.", prevention: "default 추가를 additive-safe로 단정하지 않고 ecosystem impact를 검사합니다." },
      ],
      expertNotes: ["AbstractMethodError 같은 LinkageError를 일반 business exception으로 catch해 계속 실행하기보다 dependency/version skew를 배포 실패로 탐지합니다.", "multi-release JAR·module layer·application server에서는 loader별 old/new 조합이 달라질 수 있어 artifact provenance를 telemetry에 포함합니다."],
    },
    {
      id: "marker-versus-explicit-capability-boundary",
      title: "빈 marker는 metadata 신호일 뿐 권한이 아니며 가능한 경우 명시 capability method와 외부 authorization policy를 사용합니다",
      lead: "`implements Trusted`를 누구나 source에 적을 수 있다면 보안 신뢰를 스스로 주장하게 만든 셈입니다.",
      explanations: [
        "marker interface는 abstract methods 없이 type membership 자체로 metadata를 전달합니다. Serializable처럼 platform protocol 참여를 나타낸 역사적/유효 사례가 있지만 모든 marker가 나쁜 것도 모든 capability에 적합한 것도 아닙니다.",
        "실행 가능한 기능은 `Exportable.export()`처럼 behavior contract로 표현하면 caller가 무엇을 호출할 수 있는지 명확합니다. empty marker만으로는 operation shape·failure·result를 설명하지 못합니다.",
        "authorization을 `object instanceof Trusted`에 맡기면 untrusted implementation이 marker를 직접 implements해 권한을 주장할 수 있습니다. 신원·정책·서명·allowlist 같은 외부 authority가 결정해야 합니다.",
        "annotation은 type relationship 없이 metadata를 붙일 수 있지만 runtime retention/processor/validation 정책이 필요합니다. marker interface는 generic bounds와 overload/type check에 참여한다는 차이가 있습니다.",
        "legacy API가 concrete class만 제공하면 consumer-owned capability interface를 adapter가 구현할 수 있습니다. 이때 adapter가 error/result semantics를 normalize하고 raw vendor object를 domain에 노출하지 않습니다.",
        "capability interfaces도 너무 넓으면 ambient authority가 됩니다. 최소 operation, resource scope, revocation/lifecycle, auditing을 contract에 포함하고 credential을 interface field/static global로 두지 않습니다.",
      ],
      concepts: [
        { term: "marker interface", definition: "method 없이 type membership 자체를 metadata/selection 신호로 사용하는 interface입니다.", detail: ["generic/type checks에 참여합니다.", "행동 contract는 없습니다."] },
        { term: "explicit capability", definition: "허용된 operation과 result/failure shape를 method contract로 표현한 작은 role interface입니다.", detail: ["caller surface가 명확합니다.", "scope·lifecycle도 정의합니다."] },
        { term: "external authorization policy", definition: "객체의 self-declared type이 아니라 trusted identity/configuration/allowlist로 권한을 판정하는 경계입니다.", detail: ["marker를 권한으로 쓰지 않습니다.", "audit provenance를 남깁니다."] },
      ],
      codeExamples: [{
        id: "java-marker-capability-authorization",
        title: "self-declared marker claim과 external allowlist를 분리하고 Exportable adapter를 명시 호출합니다",
        language: "java",
        filename: "MarkerCapabilityBoundaryLab.java",
        purpose: "marker가 type signal일 뿐 security authority가 아님을 보여 주고 explicit capability/adapter 대안을 실행합니다.",
        code: String.raw`import java.util.Set;

public class MarkerCapabilityBoundaryLab {
    interface TrustedMarker {}
    interface Exportable { String export(); }

    static final class SelfClaimed implements TrustedMarker {}
    static final class Report implements Exportable {
        public String export() { return "report"; }
    }
    static final class LegacyReport { String render() { return "legacy"; } }
    record LegacyAdapter(LegacyReport source) implements Exportable {
        public String export() { return source.render(); }
    }

    static boolean authorized(Object candidate, Set<Class<?>> allowlist) {
        return allowlist.contains(candidate.getClass());
    }

    public static void main(String[] args) {
        SelfClaimed claim = new SelfClaimed();
        System.out.println("markerClaim=" + (claim instanceof TrustedMarker));
        System.out.println("authorized=" + authorized(claim, Set.of(Report.class)));
        System.out.println("export=" + new Report().export());
        System.out.println("adapter=" + new LegacyAdapter(new LegacyReport()).export());
    }
}`,
        walkthrough: [
          { lines: "4-5", explanation: "empty marker와 explicit Exportable operation을 별 contracts로 둡니다." },
          { lines: "7-14", explanation: "self-claim, real capability, legacy adapter implementations를 분리합니다." },
          { lines: "16-18", explanation: "authorization은 external allowlist를 사용하고 marker membership을 보지 않습니다." },
          { lines: "21-25", explanation: "marker true여도 authorized false이며 explicit/new/adapter capabilities를 호출합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("MarkerCapabilityBoundaryLab.java", "MarkerCapabilityBoundaryLab") },
        output: { value: "markerClaim=true\nauthorized=false\nexport=report\nadapter=legacy", explanation: ["SelfClaimed는 marker를 자유롭게 implements해 membership true입니다.", "외부에서 구성한 permitted-type set에는 없어 authorization false입니다. 이 합성 Set은 policy seam을 보여 줄 뿐 production의 authenticated principal/resource authorization을 대신하지 않습니다.", "Report/LegacyAdapter는 명시 export behavior를 제공합니다."] },
        experiments: [
          { change: "authorized가 `candidate instanceof TrustedMarker`만 반환하게 합니다.", prediction: "self-claimed object가 authorized=true가 됩니다.", result: "self-declared marker를 security authority로 쓰면 privilege spoofing이 가능합니다." },
          { change: "Exportable을 empty marker로 바꿉니다.", prediction: "caller가 export operation을 compile-time에 알 수 없습니다.", result: "실행 capability는 method contract가 더 명시적입니다." },
          { change: "allowlist를 mutable public static field로 둡니다.", prediction: "전역 mutation이 authorization 결과를 바꾸고 test/threads가 결합됩니다.", result: "policy dependency와 lifecycle을 주입합니다." },
        ],
        sourceRefs: ["jls-marker-interface", "java-serializable-api", "java-set-api", "capability-security-source"],
      }],
      diagnostics: [
        { symptom: "Trusted marker를 구현한 외부 object가 자동으로 관리자 기능을 얻는다.", likelyCause: "self-declared type membership을 trusted authorization evidence로 사용했습니다.", checks: ["누가 interface를 구현할 수 있는지 봅니다.", "identity/policy source를 확인합니다.", "allowlist/signature validation을 찾습니다."], fix: "trusted external policy가 identity와 resource scope를 판정하고 marker는 metadata로만 사용합니다.", prevention: "authorization decisions에 self-asserted marker만 사용하지 않는 security test를 둡니다." },
        { symptom: "빈 marker를 받은 caller가 reflection/cast로 실제 operation을 추측한다.", likelyCause: "behavior capability를 metadata membership으로만 표현했습니다.", checks: ["caller reflection branches를 검색합니다.", "필요 operations를 적습니다.", "result/failure contract를 정의합니다."], fix: "작은 explicit capability interface와 adapters를 도입합니다.", prevention: "runtime type guessing 대신 compile-time method surface를 사용합니다." },
      ],
      expertNotes: ["Java module/package sealing과 sealed interface도 untrusted code 전체의 authorization을 대신하지 않으며 code source/signature/sandbox/OS 권한 경계를 함께 봅니다.", "capability object는 권한을 전달하므로 serialization·logging·caching으로 무심코 복제/노출하지 않고 최소 scope와 revocation policy를 둡니다."],
    },
    {
      id: "interface-negative-compiler-contract-suite",
      title: "final field·public implementation·미구현 concrete·default conflict·static inheritance·private access를 exact compiler fixtures로 고정합니다",
      lead: "interface 오개념은 실행 전에 compiler가 막는 경우가 많으므로 한 규칙당 한 invalid source로 검증합니다.",
      explanations: [
        "fieldAssignment는 암시적 final field를 다시 대입하고, weakerImplementation은 implicit public abstract method를 package-private로 구현하려 합니다. source에 modifier가 안 보여도 실제 계약은 compiler가 적용합니다.",
        "missingImplementation은 concrete class가 abstract method를 구현하지 않고, defaultConflict는 unrelated interfaces의 같은 default를 explicit override 없이 함께 구현합니다.",
        "staticInheritance는 interface static method를 implementer type으로 상속 호출하려 하고 privateAccess는 interface 외부에서 private helper를 호출합니다. default/instance inheritance와 static/private 경계를 분리합니다.",
        "각 JavaCompiler task는 errors1·warnings0·expected 1-based line·OpenJDK21 diagnostic code를 assertion합니다. ok=false만 검사하면 엉뚱한 parse error도 통과하므로 충분하지 않습니다.",
        "fixture별 output directory를 system temp direct GUID child 아래 만들고 모든 tasks에 explicit -d를 전달합니다. failed compile partial outputs가 repository나 다음 fixture를 오염시키지 않습니다.",
        "diagnostic code는 Java language portable API가 아니라 OpenJDK21.0.11 toolchain regression contract입니다. 의미 규칙은 JLS source와 함께 설명하고 JDK upgrade 때 expectations를 review합니다.",
      ],
      concepts: [
        { term: "implicit-modifier negative test", definition: "source에 생략된 public/final 같은 interface modifier가 실제 compile 제약으로 적용됨을 검증하는 fixture입니다.", detail: ["field assignment/access를 잡습니다.", "reflection positive와 짝을 이룹니다."] },
        { term: "default-conflict fixture", definition: "unrelated inherited defaults를 explicit override 없이 결합해 compiler의 ambiguity 거부를 검증합니다.", detail: ["implements 순서는 무관합니다.", "한 error만 기대합니다."] },
        { term: "isolated expected failure", definition: "invalid source와 partial output을 temp -d에 가두고 exact diagnostic만 성공 조건으로 삼는 test입니다.", detail: ["production build와 분리합니다.", "cleanup boundary를 검증합니다."] },
      ],
      codeExamples: [{
        id: "java-interface-negative-compiler-suite",
        title: "여섯 interface 위반을 errors1·warnings0·line·code로 거부하고 cleanup합니다",
        language: "java",
        filename: "InterfaceNegativeCompilerSuite.java",
        purpose: "interface implicit modifiers, implementation obligation, default/static/private rules를 in-memory OpenJDK21 tasks로 자동 검증합니다.",
        code: String.raw`import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.ToolProvider;

public class InterfaceNegativeCompilerSuite {
    static final class Source extends SimpleJavaFileObject {
        final String code;
        Source(String name, String code) {
            super(URI.create("string:///" + name + ".java"), Kind.SOURCE);
            this.code = code;
        }
        @Override public CharSequence getCharContent(boolean ignoreEncodingErrors) { return code; }
    }

    record Fixture(String name, String source, long line, String code) {}
    record Result(boolean ok, long errors, long warnings, long line, String code) {}

    static Result compile(JavaCompiler compiler, Path classes, Fixture fixture) throws Exception {
        Path output = Files.createDirectory(classes.resolve(fixture.name()));
        DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
        List<String> options = List.of("--release", "21", "-proc:none", "-encoding", "UTF-8", "-Xlint:all", "-d", output.toString());
        boolean ok = compiler.getTask(null, null, diagnostics, options, null,
                List.of(new Source(fixture.name(), fixture.source()))).call();
        var errors = diagnostics.getDiagnostics().stream().filter(item -> item.getKind() == Diagnostic.Kind.ERROR).toList();
        long warnings = diagnostics.getDiagnostics().stream().filter(item -> item.getKind() == Diagnostic.Kind.WARNING
                || item.getKind() == Diagnostic.Kind.MANDATORY_WARNING).count();
        if (errors.isEmpty()) return new Result(ok, 0, warnings, -1, "none");
        var first = errors.getFirst();
        return new Result(ok, errors.size(), warnings, first.getLineNumber(), first.getCode());
    }

    static void deleteTree(Path root) throws Exception {
        if (!Files.exists(root)) return;
        try (var paths = Files.walk(root)) {
            for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) Files.delete(path);
        }
    }

    public static void main(String[] args) throws Exception {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) throw new IllegalStateException("full JDK required");
        Path base = Path.of(System.getProperty("java.io.tmpdir")).toAbsolutePath().normalize();
        Path root = base.resolve("interface-negative-" + UUID.randomUUID()).normalize();
        if (!root.getParent().equals(base) || Files.exists(root)) throw new IllegalStateException("unsafe root");
        Files.createDirectory(root);
        try {
            Path classes = Files.createDirectory(root.resolve("classes"));
            List<Fixture> fixtures = List.of(
                new Fixture("fieldAssignment", String.join("\n",
                    "interface Constants { int LIMIT = 7; }",
                    "class Use {",
                    "  void change() { Constants.LIMIT = 8; }",
                    "}"), 3, "compiler.err.cant.assign.val.to.var"),
                new Fixture("weakerImplementation", String.join("\n",
                    "interface Role { void run(); }",
                    "class Weak implements Role {",
                    "  void run() {}",
                    "}"), 3, "compiler.err.override.weaker.access"),
                new Fixture("missingImplementation", String.join("\n",
                    "interface Role { void run(); }",
                    "class Missing implements Role {}"), 2, "compiler.err.does.not.override.abstract"),
                new Fixture("defaultConflict", String.join("\n",
                    "interface A { default void run() {} }",
                    "interface B { default void run() {} }",
                    "class Conflict implements A, B {}"), 3, "compiler.err.types.incompatible"),
                new Fixture("staticInheritance", String.join("\n",
                    "interface Role { static void util() {} }",
                    "class Impl implements Role {}",
                    "class Use { void call() { Impl.util(); } }"), 3, "compiler.err.cant.resolve.location.args"),
                new Fixture("privateAccess", String.join("\n",
                    "interface Role { private void helper() {} }",
                    "class Use { void call(Role role) { role.helper(); } }"), 2, "compiler.err.report.access")
            );
            int checks = 0;
            for (Fixture fixture : fixtures) {
                Result result = compile(compiler, classes, fixture);
                if (result.ok() || result.errors() != 1 || result.warnings() != 0
                        || result.line() != fixture.line() || !result.code().equals(fixture.code())) {
                    throw new AssertionError(fixture.name() + " => " + result);
                }
                checks++;
                System.out.println(fixture.name() + "=false,line=" + result.line() + ",code=" + result.code());
            }
            System.out.println("checks=" + checks);
        } finally {
            Path resolved = root.toAbsolutePath().normalize();
            if (!resolved.getParent().equals(base)) throw new IllegalStateException("unsafe cleanup");
            deleteTree(resolved);
            System.out.println("cleanup=" + !Files.exists(resolved));
        }
    }
}`,
        walkthrough: [
          { lines: "14-24", explanation: "in-memory source, expected line/code fixture, structured result를 정의합니다." },
          { lines: "26-38", explanation: "fixture별 temp -d와 JDK21/Xlint options로 errors/warnings/first line/code를 수집합니다." },
          { lines: "40-45", explanation: "GUID tree만 reverse order로 삭제하는 helper입니다." },
          { lines: "47-54", explanation: "full JDK와 system temp direct-child invariant를 생성 전에 확인합니다." },
          { lines: "56-82", explanation: "field/access/missing/default/static/private 여섯 독립 invalid sources를 구성합니다." },
          { lines: "84-94", explanation: "각 task가 errors1·warnings0·expected line/code인지 assertion하고 checks6을 출력합니다." },
          { lines: "95-101", explanation: "finally에서 parent boundary와 cleanup=true를 확인합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11 full JDK", "OS temporary directory write permission"], command: isolatedJavaRun("InterfaceNegativeCompilerSuite.java", "InterfaceNegativeCompilerSuite") },
        output: { value: "fieldAssignment=false,line=3,code=compiler.err.cant.assign.val.to.var\nweakerImplementation=false,line=3,code=compiler.err.override.weaker.access\nmissingImplementation=false,line=2,code=compiler.err.does.not.override.abstract\ndefaultConflict=false,line=3,code=compiler.err.types.incompatible\nstaticInheritance=false,line=3,code=compiler.err.cant.resolve.location.args\nprivateAccess=false,line=2,code=compiler.err.report.access\nchecks=6\ncleanup=true", explanation: ["implicit final/public과 concrete obligation 위반이 exact codes로 거부됩니다.", "default conflict, static non-inheritance, private access도 각각 한 error입니다.", "모든 outputs가 temp에 격리되고 cleanup=true입니다."] },
        experiments: [
          { change: "Weak.run을 public으로 바꿉니다.", prediction: "fixture가 compile 성공해 expected-failure assertion이 실패합니다.", result: "implicit public contract를 만족합니다." },
          { change: "Conflict에 public run override를 추가합니다.", prediction: "default conflict가 해결되어 compile 성공합니다.", result: "implementing class가 의미를 명시합니다." },
          { change: "Impl.util을 Role.util로 바꿉니다.", prediction: "compile 성공합니다.", result: "interface static owner qualification을 복원합니다." },
        ],
        sourceRefs: ["jdk21-javac", "java-compiler-api", "java-diagnostic-api", "java-files-api", "java-uuid-api", "jls-interface-fields", "jls-interface-implementation", "jls-abstract-class", "jls-class-overriding", "jls-class-override-requirements", "jls-default-conflicts", "jls-class-method-conflicts", "jls-static-interface-methods", "jls-class-method-inheritance", "jls-private-interface-methods"],
      }],
      diagnostics: [
        { symptom: "negative suite가 두 errors로 실패하는데 첫 code만 맞아 통과시켰다.", likelyCause: "wrong-reason failure와 exactly-one 규칙을 검사하지 않았습니다.", checks: ["ERROR diagnostics 전체 count를 봅니다.", "fixture source를 한 위반으로 줄입니다.", "warnings0도 확인합니다."], fix: "errors1·warnings0·line/code를 모두 assertion합니다.", prevention: "한 fixture에는 한 language rule만 둡니다." },
        { symptom: "failed compile 뒤 Constants.class가 repository에 남는다.", likelyCause: "JavaCompiler -d가 빠졌거나 cleanup root 경계가 틀렸습니다.", checks: ["모든 options에 -d를 봅니다.", "output parent를 확인합니다.", "finally existence를 검사합니다."], fix: "fixture별 temp output과 verified GUID root cleanup을 적용합니다.", prevention: "검증 전후 repository .class residue0을 CI에 둡니다." },
      ],
      expertNotes: ["compiler diagnostic code는 vendor/version internal contract이므로 OpenJDK21.0.11을 명시하고 JDK upgrade 때 JLS semantics와 함께 갱신합니다.", "annotation processing을 끄고 -d를 강제해 외부 processors와 partial emissions가 language-rule fixture를 오염시키지 않게 합니다."],
    },
  ],
  lab: {
    title: "원격 장치와 취미 기능을 작은 역할·default 정책·주입·호환성 계약으로 재설계합니다",
    scenario: "학습 포털은 TV·Speaker를 같은 control flow로 조작하고 Soccer·BassGuitar를 Hobby 목록에 표시합니다. 기존 원본은 interface 문법과 다형성을 잘 보여 주지만 selection/null, fat capability, default 진화, binary version skew는 다루지 않습니다. direct5+dependency8의 exact evidence를 보존하면서 consumer-owned interfaces, constructor injection, default conflict policy, shared contract tests와 compiler/binary suites를 추가합니다.",
    setup: [
      "OpenJDK21.0.11 full JDK와 PowerShell7+를 사용하고 package-smoke, scope-original, production, runtime-contract, binary-evolution, compiler-negative를 분리합니다.",
      "class06 package22와 scope13을 서로 다른 temp -d에 compile해 auxiliary warning2와 scope warning0을 각각 기록합니다.",
      "PowerControl, VolumeControl, RemoteSession, DeviceFactory, Hobby, Exportable, AuthorizationPolicy 역할과 owner/consumer를 표로 만듭니다.",
      "JDK option 환경변수는 original process 안에서 저장·제거·복원해 hostile environment가 exact compiler/process output에 섞이지 않게 합니다.",
      "모든 generated sources/classes는 normalized system temp direct GUID child에만 두고 공개 output에는 원본 주소 literal 대신 presence만 남깁니다.",
    ],
    steps: [
      "package22 warning code2의 use Ex07과 auxiliary owner Ex04를 assertion하고 scope13 warning0·main3·compile-only10을 source에서 동적 계산합니다.",
      "Ex02의 constants10/20/30/40와 play/sound/defaultOn/staticOff8행을 exact 실행합니다.",
      "Ex11 input1·2·9→2의 prompt/retry/TV·Speaker four-operation sequences와 exit/stderr를 exact 검사합니다.",
      "Ex17 choice1의 Soccer concrete path와 별도 Hobby Soccer path5행을 실행하고 address는 presence로 summary합니다.",
      "reflection으로 interface fields4가 public static final, body 없는 method가 public abstract, default/static/private flags와 constructors0인지 확인합니다.",
      "abstract implementer와 subinterface에 남은 obligations를 표로 만들고 first concrete class가 모두 public으로 구현하게 합니다.",
      "inherited default, Interface.super augmentation, private helper를 실행하고 helper가 public role surface에 없는지 검사합니다.",
      "class-wins·more-specific·unrelated-default explicit override 세 conflict paths를 positive/negative suites로 고정합니다.",
      "interface static method는 declaring interface로 qualification하고 implementing class same-name static과 override 관계가 아님을 확인합니다.",
      "Remote selection은 Optional factory로, operation sequence는 non-null injected RemoteSession으로 분리합니다.",
      "Soccer/Bass가 한 superclass+Hobby role을 조합하고 role view가 같은 object identity를 보존하는 합성 예제를 실행합니다.",
      "fat RemoteControl을 실제 consumer sets에 따라 PowerControl/VolumeControl로 나누고 real/fake adapters를 주입합니다.",
      "v1 interface+old Impl, v2 abstract method, v3 default method를 분리 compile/load해 AbstractMethodError→healthy evolution matrix를 검증합니다.",
      "empty marker self-claim과 external allowlist authorization을 분리하고 explicit Exportable adapter를 사용합니다.",
      "field final·weaker access·missing method·default conflict·static inheritance·private access 여섯 negative fixtures를 exact diagnostics로 실행합니다.",
      "마지막 report에 original channels, Java exact, structure, binary evolution, negative diagnostics, privacy, cleanup, repository class residue를 합칩니다.",
    ],
    expectedResult: [
      "package22는 auxiliary warning2, scope13은 warning0·mains3·compileOnly10으로 분리됩니다.",
      "Ex02·Ex11 세 input paths·Ex17 exact summaries가 원본 active source와 일치합니다.",
      "interface implicit fields/methods, default/static/private, constructor0 구조가 reflection contract와 일치합니다.",
      "concrete implementer만 모든 abstract obligations를 완성하고 abstract/subinterface는 책임을 명시적으로 미룹니다.",
      "default conflict 세 resolution paths와 unresolved negative fixture가 JLS 우선순위와 일치합니다.",
      "TV/Speaker session은 같은 consumer flow로 dispatch되고 invalid choice는 null 없이 unsupported로 끝납니다.",
      "Soccer/Bass의 class behavior와 Hobby role surface가 구분되고 합성 example의 same identity가 true입니다.",
      "PowerButton/VolumePanel은 필요한 작은 interfaces만 받고 fake call count가 정확히1입니다.",
      "old Impl은 v2 abstract invocation에서 AbstractMethodError, v3 default에서 healthy, 기존 run에서 run을 반환합니다.",
      "self-claimed marker는 true여도 external authorization false이고 explicit capability/adapter가 동작합니다.",
      "negative fixtures6은 errors1·warnings0·expected line/code이고 cleanup=true입니다.",
      "개인정보·credential·로컬 절대 경로·비결정적 identity hash·temp artifacts가 공개 결과에 없습니다.",
    ],
    cleanup: [
      "각 resolved root의 parent가 normalized system temp인지 확인한 뒤 생성 GUID root만 reverse-order 제거합니다.",
      "JavaCompiler/URLClassLoader를 닫고 sources/classes/reports와 repository .class residue0을 확인합니다.",
      "original class06 files와 private inventory는 read-only evidence로 유지합니다.",
    ],
    extensions: [
      "RemoteControl operations의 state machine과 failure/idempotency/threading contract를 모든 adapters에 공통 적용합니다.",
      "provider SPI는 open interface로, 내부 operation result는 sealed hierarchy로 나눠 extension/exhaustiveness를 동시에 설계합니다.",
      "default method ecosystem impact를 downstream source/binary corpus로 자동 matrix test합니다.",
      "consumer interface ownership을 ArchUnit 같은 dependency test로 강제하고 low-level imports를 차단합니다.",
      "capability objects에 resource scope·revocation·audit를 추가하고 serialization/logging leakage를 검사합니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "Ex01~03 interface member와 default/static 호출을 privacy-safe synthetic example로 재현하고 reflection/negative contracts를 작성하세요.", requirements: ["네 field 표기가 모두 public static final인지 확인합니다.", "body 없는 method가 public abstract이고 implementation은 public임을 확인합니다.", "default inherited output과 interface static type-qualified output을 exact 실행합니다.", "field reassignment·weaker implementation·static inherited call을 각각 한 diagnostic fixture로 둡니다."], hints: ["source에 생략된 modifiers를 명시 형태로 다시 쓰세요.", "default와 static은 모두 body가 있지만 receiver/dispatch가 다릅니다."], expectedOutcome: "interface member 종류를 예약어 암기가 아니라 modifier·호출·dispatch·failure evidence로 설명합니다.", solutionOutline: ["source audit", "reflection table", "positive calls", "three negative fixtures"] },
    { difficulty: "응용", prompt: "Ex08~11 RemoteControl을 consumer interfaces·factory·constructor injection으로 리팩터링하세요.", requirements: ["input parsing과 device selection, operation flow를 별 components로 나눕니다.", "unknown choice는 Optional/result로 처리하고 null implementation을 만들지 않습니다.", "Power/Volume consumer sets가 다르면 작은 interfaces로 분리합니다.", "TV/Speaker/fake에 shared behavior contract를 적용합니다.", "input1/2/retry process golden과 business unit tests를 분리합니다."], hints: ["new 구현체는 composition root에만 두세요.", "interface method shape 외 state/failure 의미도 contract에 쓰세요."], expectedOutcome: "UI와 adapter가 분리되고 각 consumer는 필요한 최소 role만 non-null로 주입받습니다.", solutionOutline: ["consumer map", "port interfaces", "adapters", "selection result", "contract suite"] },
    { difficulty: "설계", prompt: "독립 배포되는 device plugin API의 interface 진화·capability·authorization architecture를 설계하세요.", requirements: ["old/new interface×implementer×caller binary matrix와 source recompile matrix를 작성합니다.", "새 abstract/default/subinterface 중 evolution 전략과 conflict risk를 비교합니다.", "empty marker를 authorization에 쓰지 않고 signed allowlist/external policy를 둡니다.", "open provider SPI와 consumer-owned domain ports/adapters를 분리합니다.", "runtime/linkage/behavior/security/compiler/privacy suites를 CI 단계로 정의합니다."], hints: ["default가 제공할 universal safe semantics가 실제로 있는지 먼저 물으세요.", "linkage 성공과 권한·행동 호환을 같은 것으로 보지 마세요."], expectedOutcome: "확장 가능한 plugin 계약과 안전한 domain capability, 호환성·보안 검증 경계가 implementation-ready 수준으로 완성됩니다.", solutionOutline: ["artifact matrix", "port/SPI split", "evolution decision", "authorization authority", "verification pipeline"] },
  ],
  reviewQuestions: [
    { question: "interface의 `int su1=10`은 object마다 생기는 field인가요?", answer: "아닙니다. interface fields는 표기와 무관하게 public static final이며 declaring interface에 속합니다." },
    { question: "interface field는 initializer 없이 나중에 구현 class가 값을 넣을 수 있나요?", answer: "할 수 없습니다. static final field라 declaration 시 initializer가 필요하고 reassignment할 수 없습니다." },
    { question: "body 없는 interface method의 암시 modifiers는 무엇인가요?", answer: "private/static/default가 아닌 전통적 method declaration은 public abstract이며 구현도 public access를 유지해야 합니다." },
    { question: "interface는 constructor와 instance field를 가질 수 있나요?", answer: "constructor와 object별 instance field는 없습니다. static constants와 default/private/static methods, nested member types는 가질 수 있습니다." },
    { question: "concrete class가 interface method 하나를 구현하지 않으면 어떻게 되나요?", answer: "class가 abstract가 아닌 한 compiler가 does-not-override-abstract 오류로 거부합니다." },
    { question: "abstract class가 구현을 미루면 interface obligation이 사라지나요?", answer: "아닙니다. first concrete subclass가 inherited abstract obligations를 모두 호환되게 구현해야 합니다." },
    { question: "interface가 다른 interface를 연결할 때 implements를 쓰나요?", answer: "아닙니다. extends를 사용하며 여러 superinterfaces를 extends할 수 있습니다." },
    { question: "class는 여러 classes와 interfaces를 모두 다중 extends할 수 있나요?", answer: "class direct superclass는 하나이고 여러 interfaces는 implements할 수 있습니다." },
    { question: "default method는 static method인가요?", answer: "아닙니다. default는 public instance method로 receiver dispatch에 참여하고 static은 interface type으로 직접 호출합니다." },
    { question: "private interface method를 implementer가 override할 수 있나요?", answer: "할 수 없습니다. interface 내부 helper로만 보이고 implementer에 inherited되지 않습니다." },
    { question: "InterfaceName.super.method는 언제 쓰나요?", answer: "override body에서 direct superinterface의 특정 default implementation을 명시 재사용할 때 씁니다." },
    { question: "A와 B의 unrelated defaults가 충돌하면 implements 앞쪽이 이기나요?", answer: "아닙니다. implementing class가 명시 override해 선택·조합해야 합니다." },
    { question: "default conflict에서 class method와 interface default 중 무엇이 우선하나요?", answer: "호환되는 concrete class/superclass method가 interface default보다 우선합니다." },
    { question: "subinterface가 parent default를 override하면 어느 것이 선택되나요?", answer: "더 구체적인 subinterface default가 선택됩니다." },
    { question: "interface static method는 implementer에 상속되나요?", answer: "아닙니다. declaring interface로 qualification하며 implementer same-name static은 별 declaration입니다." },
    { question: "interface constant 값 변경이 왜 독립 배포에서 위험한가요?", answer: "compile-time constant가 old client binary에 인라인되어 producer만 바꿔도 stale 값이 남을 수 있습니다." },
    { question: "Ex11의 핵심 다형성은 무엇인가요?", answer: "valid choice 뒤 같은 RemoteControl four-method call sequence가 runtime TV/Speaker bodies로 dispatch되는 것입니다." },
    { question: "RemoteControl variable을 null로 시작하는 대신 무엇을 쓸 수 있나요?", answer: "selection factory가 Optional/result를 반환하고 valid non-null implementation만 consumer constructor에 주입할 수 있습니다." },
    { question: "Hobby reference가 Soccer이면 sound/addr도 직접 보이나요?", answer: "아닙니다. compile-time Hobby surface에는 play만 있고 concrete/class 기능은 보이지 않습니다." },
    { question: "implements Hobby가 별 Hobby object를 만드나요?", answer: "아닙니다. 한 concrete object가 Hobby role을 만족하며 allocation은 new 표현식이 결정합니다." },
    { question: "ISP는 interface method를 무조건 한 개로 쪼개라는 뜻인가요?", answer: "아닙니다. client가 사용하지 않는 operations에 의존하지 않게 실제 consumer sets와 change reasons로 경계를 정합니다." },
    { question: "DIP를 적용하려면 DI framework가 필요한가요?", answer: "아닙니다. consumer-owned interface와 plain constructor injection, 외부 composition root만으로 적용할 수 있습니다." },
    { question: "interface에 abstract method를 추가하면 old binary는 항상 load조차 못하나요?", answer: "항상 그렇지는 않습니다. old implementation이 load될 수 있어도 새 method invocation에서 AbstractMethodError가 날 수 있습니다." },
    { question: "default method 추가는 항상 호환되나요?", answer: "아닙니다. safe universal behavior가 없을 수 있고 downstream same-signature/default conflicts와 semantic 변화가 생길 수 있습니다." },
    { question: "marker interface membership을 authorization으로 써도 되나요?", answer: "self-declared marker만으로는 안 됩니다. trusted external identity/policy/allowlist가 권한을 판정해야 합니다." },
    { question: "negative compiler test는 ok=false만 확인하면 충분한가요?", answer: "아닙니다. errors1·warnings0·expected source line/code와 temp output cleanup을 함께 검사해야 합니다." },
  ],
  completionChecklist: [
    "inventory direct5 Ex01·08·09·10·15를 모두 읽었다.",
    "실행/compile dependency8 Ex02·03·11·12·13·14·16·17을 함께 읽어 scope13을 확정했다.",
    "class06 package22와 scope13을 별도 output에서 OpenJDK21로 compile했다.",
    "package auxiliary warning2의 use Ex07과 owner file Ex04를 exact 확인했다.",
    "scope13 warning0·main3·compile-only10을 source에서 동적 계산했다.",
    "Ex02 constants10|20|30|40과 play|sound|defaultOn|staticOff8행을 exact 실행했다.",
    "Ex11 input1 TV·input2 Speaker 각5행과 input9→2 retry7행을 exact 실행했다.",
    "Ex17 choice1 Soccer concrete/Hobby paths5행과 두 new 의미를 확인했다.",
    "interface fields가 모두 public static final이고 initializer/reassignment 계약을 설명했다.",
    "body 없는 interface methods가 public abstract이고 implementation이 public임을 확인했다.",
    "interface constructors0과 instance state 부재를 reflection으로 확인했다.",
    "default/static/private method modifiers와 호출 surface를 구분했다.",
    "interface member types의 public static 의미를 설명했다.",
    "constant-interface antipattern을 피하고 owner qualification을 사용했다.",
    "concrete implementer가 모든 inherited abstract methods를 구현하게 했다.",
    "abstract class의 implementation deferral과 obligation 소멸을 구분했다.",
    "interface-to-interface extends와 class implements를 구분했다.",
    "multiple interface extension과 single class inheritance를 구분했다.",
    "default inheritance와 public override를 exact output으로 확인했다.",
    "private interface helper가 implementer contract에 노출되지 않음을 확인했다.",
    "InterfaceName.super로 direct default를 명시 재사용했다.",
    "class-wins·most-specific·explicit override conflict resolution을 적용했다.",
    "unrelated defaults를 implements 순서로 선택하지 않았다.",
    "interface static method가 inherited/overridden되지 않음을 확인했다.",
    "public constant inlining과 producer/client version skew 위험을 기록했다.",
    "RemoteControl selection과 operation consumer를 factory/injection으로 분리했다.",
    "invalid device choice를 null이 아닌 Optional/result로 처리했다.",
    "TV/Speaker에 같은 operation order와 behavior contract를 적용했다.",
    "Soccer/Bass가 class behavior와 Hobby role을 같은 object에 조합함을 확인했다.",
    "role compile-time surface와 concrete runtime capabilities를 구분했다.",
    "원본 Ex17 두 Soccer allocations와 합성 same-identity example을 구분했다.",
    "Power/Volume consumer interfaces를 실제 사용 set에 따라 분리했다.",
    "high-level consumers가 concrete adapter가 아닌 interface를 constructor로 받게 했다.",
    "real/fake adapters와 shared contract drift 방지 전략을 설명했다.",
    "v1 old Impl·v2 abstract·v3 default binary evolution을 fresh loaders에서 재현했다.",
    "AbstractMethodError를 business exception이 아닌 version-skew linkage failure로 분류했다.",
    "default 추가의 conflict/semantic compatibility 위험을 설명했다.",
    "marker membership과 explicit capability method를 구분했다.",
    "self-declared marker를 authorization authority로 사용하지 않았다.",
    "negative fixtures6이 errors1·warnings0·expected line/code에서 실패했다.",
    "모든 compiler/process artifacts를 temp direct GUID child에 격리하고 Java child의 async streams·10초 timeout·process-tree cleanup을 적용했다.",
    "공개 code/output/evidence에 개인정보·credential·로컬 절대 경로·identity hash가 없음을 확인했다.",
  ],
  nextSessions: [],
  sources: [
    { id: "java-class06-ex01", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex01_Interface.java", usedFor: ["interface member declarations", "constants", "abstract/default/static/private methods"], evidence: "네 fields와 play/sound bodyless methods, powerOn default, powerOff static, interface-local private play01의 원본 선언을 제공하며 Ex02 실행 계약의 중심입니다." },
    { id: "java-class06-ex02", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex02_Main.java", usedFor: ["interface constants", "named concrete implementation invocation", "default/static invocation", "eight-line golden"], evidence: "named Ex03_InterfaceDemo를 생성해 Ex01 constants10·20·30·40, play `놀이`, sound `듣기`, default powerOn, interface-qualified static powerOff를 순서대로 실행합니다." },
    { id: "java-class06-ex03", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex03_InterfaceDemo.java", usedFor: ["concrete implementation", "public methods", "default inheritance"], evidence: "Ex01_Interface를 구현하고 play/sound를 public으로 제공하며 inherited default를 별 override 없이 사용할 수 있음을 보여 줍니다." },
    { id: "java-class06-ex08", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex08_RemoteControl.java", usedFor: ["RemoteControl contract", "four operations", "polymorphic surface"], evidence: "TV와 Speaker가 공유하는 powerOn·powerOff·volumeUp·volumeDown 네 operations의 역할 계약입니다." },
    { id: "java-class06-ex09", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex09_TV.java", usedFor: ["TV adapter", "RemoteControl implementation", "device output"], evidence: "RemoteControl 네 methods를 TV 문구로 구현해 Ex11 input1의 runtime dispatch body를 제공합니다." },
    { id: "java-class06-ex10", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex10_Speaker.java", usedFor: ["Speaker adapter", "RemoteControl implementation", "device output"], evidence: "RemoteControl 네 methods를 스피커 문구로 구현해 Ex11 input2와 retry input9→2의 runtime dispatch body를 제공합니다." },
    { id: "java-class06-ex11", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex11_Main.java", usedFor: ["device selection", "retry flow", "TV/Speaker process goldens"], evidence: "Scanner choice에 따라 RemoteControl reference를 TV 또는 Speaker로 정하고 동일 four-call sequence를 실행하며 invalid choice를 재입력받습니다." },
    { id: "java-class06-ex12", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex12_Sport.java", usedFor: ["class inheritance", "Soccer superclass", "shared sound behavior"], evidence: "Soccer가 class inheritance로 받는 addr/count state와 sound behavior를 Hobby의 play role 구현과 구분하기 위한 superclass 근거입니다." },
    { id: "java-class06-ex13", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex13_Hobby.java", usedFor: ["role interface", "Hobby view", "play obligation"], evidence: "Soccer와 Guitar 계열이 공유하는 Hobby role surface를 선언해 compile-time view와 concrete capability 차이를 보여 줍니다." },
    { id: "java-class06-ex14", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex14_Guitar.java", usedFor: ["class inheritance", "instrument behavior", "Hobby implementation chain"], evidence: "BassGuitar가 상속할 class behavior를 제공해 single class inheritance와 multiple role interface 조합을 대비합니다." },
    { id: "java-class06-ex15", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex15_Soccer.java", usedFor: ["Sport subclass", "Hobby implementation", "sound/address behavior"], evidence: "Sport를 extends하면서 Hobby를 implements하는 concrete type으로 class behavior와 role contract가 한 object에 결합됨을 보여 줍니다." },
    { id: "java-class06-ex16", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex16_BassGuitar.java", usedFor: ["Guitar subclass", "Hobby implementation", "second role implementation"], evidence: "Guitar inheritance와 Hobby implementation을 함께 사용해 다른 class hierarchy도 같은 role surface를 만족할 수 있음을 보여 줍니다." },
    { id: "java-class06-ex17", repository: "javastudy2/classstudy", path: "src/com/java/class06/Ex17_Main.java", usedFor: ["Soccer concrete path", "Hobby role path", "five-line golden", "allocation count"], evidence: "choice1에서 concrete Soccer path와 별도 new Soccer를 Hobby reference에 넣는 role path를 실행해5행을 출력합니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["JDK21 clean compile", "Xlint", "negative diagnostic contracts", "explicit temp output"], evidence: "package22·scope13·합성 예제와 compiler fixtures를 `--release 21 -proc:none -encoding UTF-8 -Xlint:all -d`로 검증하는 toolchain 근거입니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["ArgumentList", "redirected stdin/stdout/stderr", "exit-code process audit"], evidence: "PowerShell 원본 감사에서 shell quoting 없이 Java arguments와 입력·세 출력 channels를 분리하는 official API 근거입니다." },
    { id: "powershell-environment-variables", repository: "PowerShell documentation", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["Env provider access", "process-scope save/remove/restore", "host option isolation"], evidence: "audit process가 Env: drive의 Get-Item·Remove-Item·Set-Item으로 네 Java option variables를 저장·제거·복원하는 PowerShell 근거입니다." },
    { id: "dotnet-process-environment", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["child environment dictionary", "launcher option removal", "per-process isolation"], evidence: "각 Java child의 ProcessStartInfo environment dictionary에서 네 option names를 제거해 restored host values가 child golden을 오염시키지 않게 합니다." },
    { id: "dotnet-process-lifecycle", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timed WaitForExit", "process-tree Kill", "Dispose"], evidence: "Java child가10초 안에 종료되지 않으면 process tree를 끝내고 기다린 뒤 Process를 finally에서 dispose하는 lifecycle API 근거입니다." },
    { id: "dotnet-stream-reader-async", repository: ".NET API", path: "System.IO.StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["concurrent stdout read", "concurrent stderr read", "pipe deadlock avoidance"], evidence: "redirected stdout와 stderr를 동시에 비동기 배출해 한쪽 pipe가 차서 다른 ReadToEnd를 막는 순차 읽기 위험을 제거합니다." },
    { id: "jls-interface-fields", repository: "JLS SE 21", path: "9.3 Field (Constant) Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.3", usedFor: ["public static final fields", "initializer requirement", "constant access"], evidence: "interface field가 표기 여부와 무관하게 public static final이고 initializer를 가져야 한다는 primary language specification입니다." },
    { id: "jls-interface-methods", repository: "JLS SE 21", path: "9.4 Method Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.4", usedFor: ["public abstract methods", "default/static/private forms", "method body rules"], evidence: "interface method modifiers와 body 유무, public abstract 암시 규칙을 정의하는 primary specification입니다." },
    { id: "jls-interface-member-types", repository: "JLS SE 21", path: "9.5 Member Type Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.5", usedFor: ["nested member types", "public static meaning", "interface member grammar"], evidence: "interface 안 member class/interface가 public static member type이라는 선언 규칙의 근거입니다." },
    { id: "java-reflection-method", repository: "Java SE 21 API", path: "java.lang.reflect.Method", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Method.html", usedFor: ["method modifiers", "default method detection", "declaring type"], evidence: "합성 예제에서 abstract/default/static/private method shape를 runtime metadata로 검사하는 API 근거입니다." },
    { id: "java-modifier-api", repository: "Java SE 21 API", path: "java.lang.reflect.Modifier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Modifier.html", usedFor: ["public/static/final/abstract flags", "reflection contracts"], evidence: "reflection modifier bits를 사람이 읽는 선언 특성으로 판정하는 official API 근거입니다." },
    { id: "jls-interface-inheritance", repository: "JLS SE 21", path: "9.1.3 Superinterfaces and Subinterfaces", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.1.3", usedFor: ["multiple interface extends", "subinterface obligations", "inheritance graph"], evidence: "interface가 여러 direct superinterfaces를 extends하고 inherited members를 조합하는 규칙의 근거입니다." },
    { id: "jls-interface-implementation", repository: "JLS SE 21", path: "8.1.5 Superinterfaces", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.5", usedFor: ["class implements", "superinterface relation", "implementation obligations"], evidence: "class 선언의 implements 절과 direct superinterface 관계를 정의하는 primary specification입니다." },
    { id: "jls-abstract-class", repository: "JLS SE 21", path: "8.1.1.1 abstract Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.1.1", usedFor: ["abstract implementation deferral", "concrete subclass obligation", "instantiation boundary"], evidence: "abstract class가 incomplete implementation을 유지할 수 있지만 직접 instance화할 수 없다는 규칙의 근거입니다." },
    { id: "jls-overriding", repository: "JLS SE 21", path: "9.4.1 Inheritance and Overriding", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.4.1", usedFor: ["subinterface method inheritance", "interface-to-interface override", "most-specific interface relation"], evidence: "interface hierarchy 안에서 methods가 inherited되고 subinterface declaration이 superinterface method를 override하는 관계의 primary specification입니다." },
    { id: "jls-class-overriding", repository: "JLS SE 21", path: "8.4.8.1 Overriding (by Instance Methods)", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8.1", usedFor: ["class method implements interface method", "override-from-class relation", "signature matching"], evidence: "class instance method가 superinterface method를 override-from-class 하는 조건을 정의해 concrete implementation 관계를 정확히 판정하는 근거입니다." },
    { id: "jls-class-override-requirements", repository: "JLS SE 21", path: "8.4.8.3 Requirements in Overriding and Hiding", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8.3", usedFor: ["public access preservation", "return-type substitutability", "checked throws compatibility"], evidence: "class implementation/override method가 inherited interface method보다 access를 좁히지 않고 호환 return·throws 계약을 지켜야 하는 primary specification입니다." },
    { id: "jls-default-methods", repository: "JLS SE 21", path: "9.4.3 Interface Method Body", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.4.3", usedFor: ["default body", "inherited behavior", "override rules"], evidence: "default/private/static interface method body의 허용과 default가 instance method라는 근거입니다." },
    { id: "jls-private-interface-methods", repository: "JLS SE 21", path: "9.4 Method Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.4", usedFor: ["private helper", "non-inheritance", "interface-local reuse"], evidence: "private interface method가 interface body 내부 helper이며 implementer contract에 inherited되지 않는다는 근거입니다." },
    { id: "jls-superinterface-call", repository: "JLS SE 21", path: "15.12.1 Determine Type to Search", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.1", usedFor: ["InterfaceName.super call", "direct superinterface default", "explicit reuse"], evidence: "TypeName.super 형태가 direct superinterface의 default implementation을 명시 선택하는 method search 근거입니다." },
    { id: "jls-class-method-inheritance", repository: "JLS SE 21", path: "8.4.8 Inheritance, Overriding, and Hiding", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8", usedFor: ["class-wins default resolution", "concrete superclass method", "interface static/private non-inheritance"], evidence: "class가 direct superinterfaces의 default를 상속하는 조건에서 inherited concrete superclass method가 override-equivalent default inheritance를 막으며 superinterface private/static methods는 상속하지 않는다는 근거입니다." },
    { id: "jls-class-method-conflicts", repository: "JLS SE 21", path: "8.4.8.4 Inheriting Methods with Override-Equivalent Signatures", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8.4", usedFor: ["class inherited default conflict", "override-equivalent methods", "compile-time rejection"], evidence: "class가 override-equivalent default methods를 함께 상속할 때 적용되는 compile-time conflict 규칙의 primary specification입니다." },
    { id: "jls-default-conflicts", repository: "JLS SE 21", path: "9.4.1.3 Inheriting Methods with Override-Equivalent Signatures", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.4.1.3", usedFor: ["most-specific subinterface", "unrelated interface defaults", "override-equivalent interface conflict"], evidence: "interface hierarchy에서 더 구체적인 override가 inherited choice를 정하고 unrelated override-equivalent defaults가 conflict를 만드는 규칙의 근거입니다." },
    { id: "jls-static-interface-methods", repository: "JLS SE 21", path: "9.4 Method Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.4", usedFor: ["interface static method", "type qualification", "non-inheritance"], evidence: "static interface method가 declaring interface에 속하고 instance/default dispatch에 참여하지 않는 선언 규칙의 근거입니다." },
    { id: "jls-binary-constants", repository: "JLS SE 21", path: "13.4.9 final Fields and static Constant Variables", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-13.html#jls-13.4.9", usedFor: ["constant inlining", "old client binary", "version skew"], evidence: "constant variable 값이 client binary에 inline되어 producer만 재compile하면 이전 값이 남을 수 있다는 binary compatibility 근거입니다." },
    { id: "java-optional-api", repository: "Java SE 21 API", path: "java.util.Optional", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html", usedFor: ["selection absence", "null-free factory", "unknown device"], evidence: "device 선택 결과의 값/부재를 return type으로 명시해 null implementation이 consumer에 도달하지 않게 하는 API 근거입니다." },
    { id: "jls-runtime-method-lookup", repository: "JLS SE 21", path: "15.12.4.4 Locate Method to Invoke", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.4", usedFor: ["interface dispatch", "runtime receiver", "TV/Speaker body selection"], evidence: "compile-time에 선택된 interface instance method의 실제 implementation body를 runtime receiver class에서 찾는 근거입니다." },
    { id: "dip-primary", repository: "Object Mentor", path: "Robert C. Martin, The Dependency Inversion Principle", publicUrl: "https://web.archive.org/web/20240210121618/http://www.objectmentor.com/resources/articles/dip.pdf", usedFor: ["dependency inversion", "high-level policy", "interface ownership"], evidence: "상위 정책과 하위 세부가 abstraction에 의존하고 abstraction이 세부에 의존하지 않아야 한다는 설계 원칙의 primary article입니다." },
    { id: "jls-widening-reference", repository: "JLS SE 21", path: "5.1.5 Widening Reference Conversion", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.5", usedFor: ["concrete to interface view", "identity preservation", "multiple roles"], evidence: "Soccer reference를 Hobby role view로 widening해도 새 object가 생기지 않는 reference conversion 근거입니다." },
    { id: "isp-primary", repository: "Object Mentor", path: "Robert C. Martin, The Interface Segregation Principle", publicUrl: "https://web.archive.org/web/20240210115044/http://www.objectmentor.com/resources/articles/isp.pdf", usedFor: ["client-specific interfaces", "unused dependency avoidance", "consumer method sets"], evidence: "client가 사용하지 않는 methods에 의존하도록 강제하지 않는 interface segregation 원칙의 primary article입니다." },
    { id: "jls-interface-evolution", repository: "JLS SE 21", path: "13.5.4 Interface Evolution", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-13.html#jls-13.5.4", usedFor: ["abstract method addition", "default method addition", "binary compatibility"], evidence: "이미 배포된 interfaces에 methods를 추가할 때 binary linkage와 default conflict가 어떻게 달라지는지 규정하는 근거입니다." },
    { id: "java-abstract-method-error", repository: "Java SE 21 API", path: "java.lang.AbstractMethodError", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AbstractMethodError.html", usedFor: ["version-skew linkage failure", "old implementation", "new abstract invocation"], evidence: "runtime이 호출할 implementation을 찾지 못했을 때 발생하는 linkage error의 official API 정의입니다." },
    { id: "java-compiler-api", repository: "Java SE 21 API", path: "javax.tools.JavaCompiler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/JavaCompiler.html", usedFor: ["programmatic compilation", "binary evolution artifacts", "negative fixtures"], evidence: "독립 v1/v2/v3 artifacts와 invalid interface fixtures를 production build 밖에서 compile하는 API 근거입니다." },
    { id: "java-diagnostic-api", repository: "Java SE 21 API", path: "javax.tools.Diagnostic", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/Diagnostic.html", usedFor: ["ERROR kind", "diagnostic code", "source line"], evidence: "compiler failure를 문자열이 아닌 kind·code·1-based line으로 assertion하는 official API 근거입니다." },
    { id: "java-classloader-api", repository: "Java SE 21 API", path: "java.net.URLClassLoader", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URLClassLoader.html", usedFor: ["fresh binary worlds", "version isolation", "linkage experiment"], evidence: "v1 implementation과 v2/v3 interface·caller combinations를 fresh loader namespaces에서 격리해 version-skew behavior를 재현하는 API 근거입니다." },
    { id: "java-files-api", repository: "Java SE 21 API", path: "java.nio.file.Files", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["temp sources/classes", "reverse cleanup", "artifact absence"], evidence: "compiler tasks의 isolated directories와 finally reverse-order cleanup을 구현하는 filesystem API 근거입니다." },
    { id: "java-uuid-api", repository: "Java SE 21 API", path: "java.util.UUID", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/UUID.html", usedFor: ["unique temp direct child", "collision avoidance"], evidence: "검증 실행마다 normalized system temp 아래 고유 direct-child root를 만드는 API 근거입니다." },
    { id: "jls-marker-interface", repository: "JLS SE 21", path: "9.1 Interface Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.1", usedFor: ["empty interface legality", "nominal membership", "marker role"], evidence: "methods가 없는 interface도 nominal supertype을 선언할 수 있는 interface declaration의 language 근거입니다." },
    { id: "java-serializable-api", repository: "Java SE 21 API", path: "java.io.Serializable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Serializable.html", usedFor: ["standard marker interface", "serialization opt-in example", "nominal signal"], evidence: "methods/fields 없이 serialization eligibility를 표시하는 대표 Java platform marker interface입니다." },
    { id: "java-set-api", repository: "Java SE 21 API", path: "java.util.Set", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html", usedFor: ["externally configured permitted types", "policy state", "membership lookup"], evidence: "합성 예제에서 self-declared marker membership과 분리된 external permitted-type set을 표현합니다. 실제 principal/resource authorization은 별 trusted identity와 policy boundary가 필요합니다." },
    { id: "capability-security-source", repository: "OWASP Cheat Sheet Series", path: "Authorization Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", usedFor: ["deny by default", "authorization checks", "trusted external policy"], evidence: "객체가 marker를 스스로 구현했다는 사실이 아니라 매 요청의 trusted authorization policy가 권한을 결정해야 한다는 security guidance 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 13,
    filesUsed: 13,
    uncoveredNotes: [
      "inventory direct5 Ex01·08·09·10·15와 실행·compile companions Ex02·03·11·12·13·14·16·17을 모두 읽어 declarations와 runtime evidence를 범위13으로 닫았습니다.",
      "class06 package 전체22는 exit0·warning2입니다. 두 warnings는 모두 Ex07이 Ex04 source file 안 auxiliary Ex05 type을 참조한 동일 code이며 OOP09 범위13 밖 structural debt입니다.",
      "scope13은 별도 output에서 exit0·warning0이고 source의 public static void main signature를 동적으로 계산해 main3·compile-only10을 확인했습니다.",
      "JDK_JAVAC_OPTIONS·JDK_JAVA_OPTIONS·JAVA_TOOL_OPTIONS·_JAVA_OPTIONS는 original audit 안에서 process-scope 원래 값을 저장·제거한 뒤 finally에서 복원하고 child ProcessStartInfo에서도 네 launcher options를 모두 제거합니다.",
      "각 Java child의 stdout/stderr는 ReadToEndAsync로 동시에 배출하고10초 안에 끝나지 않으면 process tree를 종료·대기한 뒤 Process를 dispose해 pipe 교착과 무한 대기를 제한합니다.",
      "Ex02 raw8 lines는 constants10|20|30|40 뒤 play|sound|defaultOn|staticOff 순서이며 interface static powerOff는 implementing object가 아니라 Ex01_Interface type으로 호출됩니다.",
      "Ex11 input1과2는 prompt1·retry0·각5 lines이고 TV/Speaker 네 operations가 같은 순서로 dispatch됩니다. input9→2는 prompts2·retry1·Speaker·7 lines입니다.",
      "Ex17 choice1은 Soccer concrete path와 Hobby role path에서 `new Soccer`를 각각 실행해 서로 다른 objects를 만들며 raw5 lines입니다. 합성 identity example의 한 object·여러 views와 구분했습니다.",
      "interface field·abstract/default/static/private method와 nested member type의 암시 modifiers를 JLS와 reflection evidence로 보충했습니다.",
      "concrete implementation obligation, abstract deferral, interface multiple extends, class single extends+multiple implements를 positive execution과 one-rule negative fixtures로 분리했습니다.",
      "default conflict는 class wins·more-specific subinterface·unrelated explicit override 세 cases를 실행하고 implements 순서에 의존하지 않게 했습니다.",
      "RemoteControl 원본 branch는 null-free Optional factory와 constructor injection으로 확장하고 selection·operation·adapter 역할을 분리했습니다.",
      "ISP는 method 수가 아니라 consumer 사용 set/change reason으로 판단하고 DIP는 framework 없이 consumer-owned interface와 composition root로 구현했습니다.",
      "v1 old implementation, v2 abstract addition, v3 default addition을 fresh URLClassLoader로 조합해 successful load와 invocation-time AbstractMethodError를 구분했습니다.",
      "default method 추가가 linkage를 피할 수 있어도 semantic drift와 downstream default conflict까지 자동으로 해결하지 않는다는 한계를 기록했습니다.",
      "empty marker와 explicit operation capability를 구분하고 self-declared marker를 authorization authority로 쓰지 않으며 외부 allowlist/policy를 사용했습니다.",
      "negative compiler suite는 field reassignment·weaker implementation·missing implementation·default conflict·static inherited call·private access를 각각 errors1·warnings0·expected line/code로 고정했습니다.",
      "모든 Java examples와 inner compiler/classloader artifacts는 normalized system temp direct GUID child에 격리하며 생성한 root만 reverse cleanup합니다.",
      "공개 code/output/evidence에는 실제 개인정보·credential·로컬 절대 경로·비결정적 identity hash가 없고 synthetic markers와 비민감 원본 학습 문구만 사용했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
