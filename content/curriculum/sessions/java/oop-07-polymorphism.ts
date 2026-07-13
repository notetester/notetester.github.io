import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["oop-07-polymorphism"],
  slug: "oop-07-polymorphism",
  courseId: "java",
  moduleId: "java-oop-design",
  order: 17,
  title: "오버라이딩·다형성·안전한 타입 대체",
  subtitle: "compile-time 표면과 runtime dispatch를 분리하고 override 계약·안전한 narrowing·전략 주입·LSP를 실행과 컴파일 계약으로 검증합니다.",
  level: "중급",
  estimatedMinutes: 720,
  coreQuestion: "하나의 상위 타입으로 여러 객체를 다루면서도 실제 구현의 동작을 안전하게 선택하고, 잘못된 override·cast·null 분기와 행동 계약 위반을 어떻게 막을까요?",
  summary: "inventory가 직접 지정한 Ex15_Animal·Ex16_Dog·Ex17_Cat·Ex19_Payment·Ex20_CardPayment·Ex21_KakaoPayment 여섯 선언과 companion Ex18_Main·Ex22_Main 두 실행 파일을 범위8로 함께 감사합니다. class04 전체26은 compile exit0이지만 범위 밖 Ex09_Sub의 serialVersionUID 누락 warning1이 있고 범위8은 warning0·main2·compile-only6입니다. Ex18 input1은 prompt 뒤 부모 sound와 Cat sound를 이어 출력한 뒤 like를 호출하고, input2는 Dog sound와 like를 출력합니다. input9는 animal이 null인 채 sound를 호출해 prompt만 stdout에 남기고 exit1·line28 NullPointerException을 stderr에 냅니다. Ex22는 Card 한 번과 Kakao 두 번을 5000·5000·5200으로 dispatch하며 원본의 `결재` 표기는 provenance로 보존하되 교육용 합성 예제는 맞춤법 `결제`를 사용합니다. 원본의 ‘부모 메서드를 가져와 마음대로 변경’이라는 설명을 override-equivalence/subsignature, return-type-substitutability, access·checked-throws 계약과 @Override 검사로 교정합니다. 이어 compile-time member surface와 runtime dynamic dispatch, field/static hiding, upcast 동일 identity, safe downcast와 pattern instanceof, invalid choice 제거, Payment strategy/DI, LSP 행동 계약, sealed hierarchy, bridge method와 constructor dispatch 위험, negative compiler suite까지 확장합니다.",
  objectives: [
    "method overriding의 signature/subsignature·covariant return·access·checked exception 제약을 설명하고 @Override로 검증할 수 있다.",
    "reference의 compile-time type이 접근 가능한 member surface를, receiver의 runtime class가 overridden instance method body를 정한다는 두 단계를 구분할 수 있다.",
    "upcast가 새 객체를 만들지 않는 동일 reference 변환임을 증명하고 field/static hiding과 instance dynamic dispatch를 구분할 수 있다.",
    "downcast의 필요 조건을 instanceof pattern과 null 규칙으로 검사해 ClassCastException과 NullPointerException 경로를 제거할 수 있다.",
    "Cat의 super 호출을 통한 동작 확장과 Dog의 완전 대체를 구분하고 base contract를 깨지 않는 재사용 방식을 선택할 수 있다.",
    "Payment 구현 선택을 null 분기에서 factory·strategy·dependency injection으로 바꾸고 caller가 구체 타입을 몰라도 되게 설계할 수 있다.",
    "Liskov substitution의 precondition·postcondition·invariant·failure 의미와 sealed hierarchy의 trade-off를 판단하고 positive runtime·original-process·reflection·behavioral·negative compiler contracts로 재현할 수 있다.",
  ],
  prerequisites: [
    { title: "상속·super·생성자 체인과 필드 숨김", reason: "override relation은 상속된 instance method와 super 호출 위에 놓이며 field hiding과 method dispatch의 차이를 이미 구분해야 합니다.", sessionSlug: "oop-06-inheritance-super" },
    { title: "static과 클래스·인스턴스 초기화", reason: "static method hiding은 instance override와 다른 compile-time selection이므로 class/instance ownership과 initialization을 분리해야 합니다.", sessionSlug: "oop-05-static-init" },
  ],
  keywords: ["overriding", "@Override", "subsignature", "covariant return", "dynamic dispatch", "compile-time type", "runtime class", "upcast", "downcast", "instanceof pattern", "ClassCastException", "field hiding", "static hiding", "super call", "strategy", "dependency injection", "Liskov substitution", "behavioral subtyping", "sealed class", "pattern switch", "bridge method"],
  chapters: [
    {
      id: "eight-source-process-golden-audit",
      title: "direct6·companion2와 입력 세 갈래를 ProcessStartInfo로 분리 감사하고 정상·실패 channels를 모두 고정합니다",
      lead: "stdout만 캡처해 input9를 빈 성공으로 오해하지 않고 exit code·stderr·source line까지 하나의 원본 계약으로 봅니다.",
      explanations: [
        "범위8은 Animal/Dog/Cat과 Payment/CardPayment/KakaoPayment 여섯 declarations, 그리고 Ex18·Ex22 두 mains입니다. 선언만 읽고 polymorphism을 추측하지 않도록 입력과 caller 분기를 가진 companion mains도 filesRead/filesUsed에 포함합니다.",
        "class04 전체26 package smoke는 exit0이지만 범위 밖 Ex09_Sub가 Serializable parent Random을 상속하면서 serialVersionUID를 선언하지 않아 compiler.warn.missing.SVUID 하나를 냅니다. 범위8만 별도 classes directory에 compile하면 exit0·warning0입니다.",
        "Ex18 input1은 prompt와 부모 `울음소리`가 같은 첫 stdout line에 이어지고 Cat의 `야옹~ 야옹~`, inherited like가 다음 두 lines에 옵니다. Cat override가 super.sound()를 먼저 호출하기 때문입니다.",
        "input2는 Dog override가 parent body를 호출하지 않아 prompt 뒤 `멍~ 멍~`, 이어 like의 두 lines뿐입니다. 같은 `animal.sound()` call site라도 runtime receiver가 선택한 override body와 그 body의 super 사용 여부가 결과를 바꿉니다.",
        "input9는 branch가 animal을 null로 남긴 채 line28에서 animal.sound()를 호출합니다. stdout은 newline 없는 prompt뿐이고 exit1, stderr는 enhanced NullPointerException과 stack line 두 줄입니다. 잘못된 선택을 polymorphism 오류가 아니라 selection boundary의 null-state 결함으로 분류합니다.",
        "Ex22는 Card 5000, Kakao 5000, 선택된 Kakao 5200을 dispatch하고 blank lines2를 포함한 raw8 lines를 냅니다. 원본의 네 `결재` occurrences는 exact provenance로 보존하지만 새 예제의 사용자 문구는 표준 표기 `결제`로 교정합니다.",
        "PowerShell audit은 shell redirection 문자열 조합이 아니라 ProcessStartInfo.ArgumentList·redirected stdin/stdout/stderr를 사용합니다. 각 process의 exit와 channels를 독립 읽고 exact normalized strings를 assertion합니다.",
      ],
      concepts: [
        { term: "process contract", definition: "한 실행을 stdin, stdout, stderr, exit code의 네 요소로 검증하는 계약입니다.", detail: ["정상 input1/2와 실패 input9를 분리합니다.", "prompt의 trailing newline 여부도 보존합니다."] },
        { term: "companion main", definition: "상속 declarations를 실제로 생성·upcast·호출해 runtime dispatch evidence를 만드는 진입점입니다.", detail: ["Ex18과 Ex22입니다.", "compile-only declarations와 구분합니다."] },
        { term: "legacy spelling provenance", definition: "원본 실행 문자열의 오타는 감사 evidence에서 그대로 기록하고 새 교육 설계에서는 교정 사실을 명시하는 원칙입니다.", detail: ["원본은 결재입니다.", "합성 예제는 결제입니다."] },
      ],
      codeExamples: [{
        id: "powershell-original-oop07-process-audit",
        title: "package26·scope8과 Ex18 세 입력·Ex22를 exit/stdout/stderr exact로 감사합니다",
        language: "powershell",
        filename: "verify-original-oop07.ps1",
        purpose: "공백 포함 temp classes와 ProcessStartInfo를 사용해 정상 dispatch, null failure, legacy spelling을 shell 해석 없이 재현합니다.",
        code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("oop07 audit " + [Guid]::NewGuid().ToString("N"))
if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
$optionNames = @("JDK_JAVAC_OPTIONS", "JDK_JAVA_OPTIONS", "JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS")
$savedOptions = @{}
foreach ($name in $optionNames) {
  $savedOptions[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
  Remove-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue
}
try {
  $lf = [string][char]10
  $crlf = [string][char]13 + [char]10
  $tab = [string][char]9
  $quote = [string][char]34
  $source = "src\com\java\class04"
  $all = @(Get-ChildItem -LiteralPath $source -Filter "*.java" | Sort-Object Name | ForEach-Object FullName)
  $scopeNames = @("Ex15_Animal.java", "Ex16_Dog.java", "Ex17_Cat.java", "Ex18_Main.java",
    "Ex19_Payment.java", "Ex20_CardPayment.java", "Ex21_KakaoPayment.java", "Ex22_Main.java")
  $scoped = @($scopeNames | ForEach-Object { Join-Path $source $_ })
  $packageOut = Join-Path $root "package classes"
  $scopeOut = Join-Path $root "scope classes"
  New-Item -ItemType Directory -Path $packageOut, $scopeOut -ErrorAction Stop | Out-Null

  $packageCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $packageOut $all 2>&1)
  $packageExit = $LASTEXITCODE
  $packageText = $packageCompiler -join [Environment]::NewLine
  $warningCodes = @([regex]::Matches($packageText, 'compiler\.warn\.[A-Za-z0-9_.]+') | ForEach-Object Value)
  if ($packageExit -ne 0 -or $all.Count -ne 26 -or $warningCodes.Count -ne 1 -or
      $warningCodes[0] -ne "compiler.warn.missing.SVUID" -or -not $packageText.Contains("Ex09_Sub.java")) { throw "unexpected package diagnostics" }

  $scopeCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $scopeOut $scoped 2>&1)
  $scopeExit = $LASTEXITCODE
  if ($scopeExit -ne 0 -or $scoped.Count -ne 8 -or $scopeCompiler.Count -ne 0) { throw "scope compile failed or warned" }
  $mainPattern = 'public\s+static\s+void\s+main\s*\('
  $mainCount = @($scoped | Where-Object { (Get-Content -Raw -LiteralPath $_) -match $mainPattern }).Count
  $compileOnlyCount = $scoped.Count - $mainCount
  if ($mainCount -ne 2 -or $compileOnlyCount -ne 6) { throw "scope role mismatch" }

  function Invoke-Java([string]$mainClass, [AllowNull()][string]$stdin) {
    $start = [Diagnostics.ProcessStartInfo]::new()
    $start.FileName = "java"
    [void]$start.ArgumentList.Add("-XX:+ShowCodeDetailsInExceptionMessages")
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
    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $start
    if (-not $process.Start()) { throw "process start failed" }
    if ($null -ne $stdin) { $process.StandardInput.Write($stdin) }
    $process.StandardInput.Close()
    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    [pscustomobject]@{ Exit = $process.ExitCode; Out = $stdout.Replace($crlf, $lf); Err = $stderr.Replace($crlf, $lf) }
  }

  $cat = Invoke-Java "com.java.class04.Ex18_Main" ("1" + $lf)
  $dog = Invoke-Java "com.java.class04.Ex18_Main" ("2" + $lf)
  $invalid = Invoke-Java "com.java.class04.Ex18_Main" ("9" + $lf)
  $payment = Invoke-Java "com.java.class04.Ex22_Main" ""
  $prompt = "선택하세요(1.cat, 2.dog) >> "
  $expectedCat = $prompt + "울음소리" + $lf + "야옹~ 야옹~" + $lf + "좋아하는 행동" + $lf
  $expectedDog = $prompt + "멍~ 멍~" + $lf + "좋아하는 행동" + $lf
  $expectedError = "Exception in thread " + $quote + "main" + $quote + " java.lang.NullPointerException: Cannot invoke " +
    $quote + "com.java.class04.Ex15_Animal.sound()" + $quote + " because " + $quote + "<local3>" + $quote + " is null" + $lf +
    $tab + "at com.java.class04.Ex18_Main.main(Ex18_Main.java:28)" + $lf
  $expectedPayment = "카드 결재 승인 요청" + $lf + "카드로 5000원 결재 완료" + $lf + $lf +
    "카카오 페이 서버 연결" + $lf + "카카오 페이로 5000원 결재 완료" + $lf + $lf +
    "카카오 페이 서버 연결" + $lf + "카카오 페이로 5200원 결재 완료" + $lf
  if ($cat.Exit -ne 0 -or $cat.Out -cne $expectedCat -or $cat.Err.Length -ne 0) { throw "cat contract mismatch" }
  if ($dog.Exit -ne 0 -or $dog.Out -cne $expectedDog -or $dog.Err.Length -ne 0) { throw "dog contract mismatch" }
  if ($invalid.Exit -ne 1 -or $invalid.Out -cne $prompt -or $invalid.Err -cne $expectedError) { throw "invalid contract mismatch" }
  if ($payment.Exit -ne 0 -or $payment.Out -cne $expectedPayment -or $payment.Err.Length -ne 0) { throw "payment contract mismatch" }

  "spacePath=$($root.Contains(' ')),packageCompiled=$($all.Count),packageExit=$packageExit,packageWarnings=$($warningCodes.Count),packageWarningCode=$($warningCodes[0])"
  "scopedCompiled=$($scoped.Count),scopeExit=$scopeExit,scopeWarnings=$($scopeCompiler.Count),mains=$mainCount,compileOnly=$compileOnlyCount"
  "Ex18[input=1]=exit:$($cat.Exit),stdoutLines:3,sequence:parentSound|catSound|like,stderrEmpty:$($cat.Err.Length -eq 0)"
  "Ex18[input=2]=exit:$($dog.Exit),stdoutLines:2,sequence:dogSound|like,stderrEmpty:$($dog.Err.Length -eq 0)"
  "Ex18[input=9]=exit:$($invalid.Exit),stdoutPromptOnly:$($invalid.Out -ceq $prompt),stderrLines:2,errorNPE:$($invalid.Err.Contains('NullPointerException')),nullAnimal:$($invalid.Err.Contains('<local3>')),line28:$($invalid.Err.Contains('Ex18_Main.java:28'))"
  $paymentLines = @($payment.Out.TrimEnd([char]10).Split([char]10))
  "Ex22=exit:$($payment.Exit),lines:$($paymentLines.Count),blankLines:$(@($paymentLines | Where-Object Length -eq 0).Count),cardBlocks:1,kakaoBlocks:$(@($paymentLines | Where-Object { $_ -eq '카카오 페이 서버 연결' }).Count),amounts:5000|5000|5200,legacySpellingOccurrences:$([regex]::Matches($payment.Out, '결재').Count)"
} finally {
  foreach ($name in $optionNames) {
    if ($null -eq $savedOptions[$name]) {
      Remove-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue
    } else {
      [Environment]::SetEnvironmentVariable($name, $savedOptions[$name], "Process")
    }
  }
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }
  if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" }
}`,
        walkthrough: [
          { lines: "1-23", explanation: "normalized OS temp의 공백 포함 direct GUID root를 만들고 네 Java launcher option 환경 변수를 process scope에서 저장·제거해 외부 option 주입을 격리합니다." },
          { lines: "25-38", explanation: "package26의 유일한 SVUID warning과 `-g:source,lines`로 debug profile을 고정한 scope8 warning0, main2·compile-only6 역할을 별도 compiler/source 검사에서 assertion합니다." },
          { lines: "40-63", explanation: "ProcessStartInfo.ArgumentList에 enhanced-NPE 활성화를 명시하고 redirected channels로 shell quoting 없이 Java main에 stdin을 쓰고 exit/stdout/stderr를 반환합니다." },
          { lines: "65-81", explanation: "input1·2·9와 Ex22를 실행해 trailing newline까지 포함한 JDK21 UTF-8 raw channel strings를 exact 비교합니다." },
          { lines: "83-89", explanation: "raw 원문 대신 dispatch sequence·failure shape·legacy spelling count를 privacy-safe deterministic summary로 출력합니다." },
          { lines: "90-101", explanation: "네 launcher option 환경 변수의 원래 존재 여부와 값을 복원하고 resolved parent boundary를 재검사한 뒤 생성한 GUID root만 삭제합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11", "isolated Java launcher option environment", "explicit -g:source,lines and ShowCodeDetailsInExceptionMessages", "javastudy2/classstudy root"], command: "pwsh -NoProfile -File verify-original-oop07.ps1" },
        output: { value: "spacePath=True,packageCompiled=26,packageExit=0,packageWarnings=1,packageWarningCode=compiler.warn.missing.SVUID\nscopedCompiled=8,scopeExit=0,scopeWarnings=0,mains=2,compileOnly=6\nEx18[input=1]=exit:0,stdoutLines:3,sequence:parentSound|catSound|like,stderrEmpty:True\nEx18[input=2]=exit:0,stdoutLines:2,sequence:dogSound|like,stderrEmpty:True\nEx18[input=9]=exit:1,stdoutPromptOnly:True,stderrLines:2,errorNPE:True,nullAnimal:True,line28:True\nEx22=exit:0,lines:8,blankLines:2,cardBlocks:1,kakaoBlocks:2,amounts:5000|5000|5200,legacySpellingOccurrences:4", explanation: ["package warning은 범위 밖 Ex09_Sub에만 있고 scope8은 clean입니다.", "Cat은 parent sound를 확장해3 lines, Dog은 대체해2 lines입니다.", "invalid input은 prompt-only stdout과 NPE stderr/exit1을 분리합니다.", "Ex22는 raw8 lines·blank2·legacy 결재4 occurrences입니다."] },
        experiments: [
          { change: "input9 뒤 animal null check를 추가합니다.", prediction: "exit0과 명시 invalid message로 바뀌고 NPE stderr가 사라집니다.", result: "null을 dispatch receiver로 넘기기 전에 selection boundary에서 실패를 처리합니다." },
          { change: "Cat sound의 super.sound()를 제거합니다.", prediction: "input1 stdoutLines가2로 줄고 parentSound marker가 사라집니다.", result: "override가 parent body를 자동 실행하지 않습니다." },
          { change: "Ex22 choice를1로 바꿉니다.", prediction: "마지막 block이 Card 5200으로 바뀝니다.", result: "choice branch는 object selection만 하고 pay call site는 동일합니다." },
        ],
        sourceRefs: ["java-class04-ex15", "java-class04-ex16", "java-class04-ex17", "java-class04-ex18", "java-class04-ex19", "java-class04-ex20", "java-class04-ex21", "java-class04-ex22", "jdk21-javac", "dotnet-process-start-info", "dotnet-environment-variables"],
      }],
      diagnostics: [
        { symptom: "input9가 stdout prompt만 보여 정상 종료로 기록됐다.", likelyCause: "stdout만 캡처하고 exit code와 stderr를 버렸습니다.", checks: ["process exit가1인지 봅니다.", "stderr 두 lines를 읽습니다.", "Ex18 line28 receiver를 확인합니다."], fix: "stdin/stdout/stderr/exit를 한 process contract로 저장하고 invalid selection을 null 전에 거부합니다.", prevention: "CLI golden test에 channels와 exit를 모두 포함합니다." },
        { symptom: "scope8이 warning을 냈다고 보고했지만 source를 찾을 수 없다.", likelyCause: "package26의 Ex09_Sub SVUID warning을 scoped compile에 잘못 귀속했습니다.", checks: ["compiler source list와 -d를 분리합니다.", "diagnostic source/code를 확인합니다.", "scope compiler output count를 봅니다."], fix: "package warning1과 scope warning0을 동시에 기록합니다.", prevention: "broad smoke와 atomic scope compile을 항상 별도 processes로 실행합니다." },
      ],
      expertNotes: ["enhanced NPE message의 local slot token과 source line은 launcher option 환경을 격리한 OpenJDK21.0.11, `-g:source,lines`, `-XX:+ShowCodeDetailsInExceptionMessages` 재현 계약이며 모든 vendor/version에 portable한 문구로 일반화하지 않습니다.", "원본 UI 문자열의 결재 오타를 provenance에서 지우지 않되 새 domain API·문서·tests에서는 결제로 정규화합니다."],
    },
    {
      id: "override-language-contract",
      title: "override는 부모 코드를 마음대로 고치는 행위가 아니라 호환 signature·return·access·throws를 지키는 새 구현입니다",
      lead: "@Override는 설명용 장식이 아니라 compiler에게 override 의도를 검증시키는 안전장치입니다.",
      explanations: [
        "instance method가 override하려면 superclass method와 override-equivalent signature 관계를 만족해야 합니다. 단순히 이름이 같다는 이유만으로 override가 아니며 parameter list가 다르면 overload일 수 있습니다.",
        "return type은 동일하거나 return-type-substitutable해야 합니다. reference return에서는 subtype을 반환하는 covariant return이 가능하지만 unrelated String으로 바꾸는 식의 변화는 compiler가 거부합니다.",
        "overriding method는 inherited method보다 접근을 더 좁힐 수 없습니다. public contract를 protected/private로 축소하면 상위 타입 caller가 기대한 호출 가능성을 깨므로 compile-time error입니다.",
        "checked exception은 부모 선언보다 넓게 추가할 수 없습니다. subtype caller가 상위 method contract에 없던 checked failure를 갑자기 처리해야 한다면 substitutability가 깨지기 때문입니다. unchecked exception은 compiler 제약과 별개로 행동 계약을 여전히 검토합니다.",
        "Ex17 Cat의 public void sound()는 Ex15 public void sound()와 같은 signature/access/return/throws 계약을 지키고 body에서 super.sound() 뒤 Cat 출력을 추가합니다. Dog도 계약을 지키지만 parent body를 호출하지 않고 완전히 대체합니다.",
        "@Override를 쓰면 오타나 잘못된 parameter로 새 method를 만든 실수를 compiler가 `does not override`로 잡습니다. 구현 의도가 override라면 항상 붙이고 compiler warning/error를 build에서 무시하지 않습니다.",
      ],
      concepts: [
        { term: "override-equivalent signature", definition: "두 method signatures가 같거나 erasure 등을 고려한 JLS subsignature 관계여서 override 판단에 참여하는 관계입니다.", detail: ["이름만 같다고 충분하지 않습니다.", "generic migration의 subsignature도 포함합니다."] },
        { term: "covariant return", definition: "overriding method가 부모 reference return type의 subtype을 반환하는 허용된 변화입니다.", detail: ["Number에서 Integer가 예입니다.", "primitive에는 같은 방식이 적용되지 않습니다."] },
        { term: "checked-throws narrowing", definition: "override가 부모보다 같거나 더 좁은 checked exception만 선언할 수 있는 규칙입니다.", detail: ["throws를 제거할 수 있습니다.", "더 넓게 추가할 수 없습니다."] },
      ],
      codeExamples: [{
        id: "java-override-contract-shape",
        title: "protected Number+IOException을 public Integer+no throws로 안전하게 좁힙니다",
        language: "java",
        filename: "OverrideContractShapeLab.java",
        purpose: "covariant return, access widening, checked throws removal과 @Override를 runtime/reflection shape로 확인합니다.",
        code: String.raw`import java.io.IOException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

public class OverrideContractShapeLab {
    static class Sensor {
        protected Number read() throws IOException { return 1; }
    }

    static final class PreciseSensor extends Sensor {
        @Override
        public Integer read() { return 7; }
    }

    public static void main(String[] args) throws Exception {
        Sensor sensor = new PreciseSensor();
        Number value = sensor.read();
        Method method = PreciseSensor.class.getDeclaredMethod("read");
        System.out.println("value=" + value + ",runtime=" + value.getClass().getSimpleName());
        System.out.println("return=" + method.getReturnType().getSimpleName());
        System.out.println("public=" + Modifier.isPublic(method.getModifiers()));
        System.out.println("checkedThrows=" + method.getExceptionTypes().length);
    }
}`,
        walkthrough: [
          { lines: "6-8", explanation: "부모는 protected Number와 checked IOException을 포함한 호출 계약을 선언합니다." },
          { lines: "10-13", explanation: "자식은 @Override로 Integer return, public access, throws 제거라는 허용된 방향을 사용합니다." },
          { lines: "16-23", explanation: "상위 reference 호출 결과와 자식 선언의 return/access/throws shape를 reflection으로 고정합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("OverrideContractShapeLab.java", "OverrideContractShapeLab") },
        output: { value: "value=7,runtime=Integer\nreturn=Integer\npublic=true\ncheckedThrows=0", explanation: ["compile-time Sensor surface로 호출해도 runtime PreciseSensor body가 Integer7을 반환합니다.", "override declaration은 부모보다 접근이 넓고 checked exception이 더 좁습니다."] },
        experiments: [
          { change: "PreciseSensor.read를 protected로 바꿉니다.", prediction: "부모도 protected라 compile은 계속 성공하고 public reflection 값만 false가 됩니다.", result: "같은 access는 허용되며 더 좁히는 것이 금지됩니다." },
          { change: "return type을 String으로 바꾸고 body도 `return \"x\";`로 함께 바꿉니다.", prediction: "body 자체는 type-correct하지만 override return이 unrelated라 compiler.err.override.incompatible.ret입니다.", result: "한 실험에서 covariant-return 규칙만 분리해 실패시킵니다." },
          { change: "throws Exception을 추가합니다.", prediction: "부모 IOException보다 넓은 checked exception이라 compile error입니다.", result: "caller failure obligations을 확장할 수 없습니다." },
        ],
        sourceRefs: ["java-class04-ex15", "java-class04-ex16", "java-class04-ex17", "jls-overriding", "jls-method-signature", "jls-return-type-substitutability", "jls-override-throws", "java-override-annotation", "java-reflection-method", "java-modifier-api"],
      }],
      diagnostics: [
        { symptom: "@Override에서 method does not override 오류가 난다.", likelyCause: "method name/parameter가 부모 signature와 다르거나 대상이 static/private여서 instance override relation이 없습니다.", checks: ["부모 선언과 parameter types를 비교합니다.", "import한 type을 확인합니다.", "static/private modifier를 봅니다."], fix: "의도한 signature를 정확히 맞추거나 별 overload라면 @Override를 제거하고 다른 API 의도를 문서화합니다. final 위반은 별 cannot-override-final 진단으로 구분합니다.", prevention: "override 의도에는 @Override와 compiler contract test를 필수로 둡니다." },
        { symptom: "override에서 더 넓은 checked exception을 선언하자 compile이 실패한다.", likelyCause: "상위 type caller에게 없던 checked failure obligation을 추가했습니다.", checks: ["부모 throws 목록을 봅니다.", "exception subtype 관계를 확인합니다.", "exception을 내부 처리할 수 있는지 봅니다."], fix: "부모가 허용한 subtype으로 좁히거나 내부에서 변환/처리하고 행동 계약을 명시합니다.", prevention: "base interface의 failure semantics를 구현 전에 정의합니다." },
      ],
      expertNotes: ["generic override에서는 compiler가 type erasure 호환을 위해 bridge method를 생성할 수 있으므로 source declaration 수와 runtime declared methods 수가 다를 수 있습니다.", "unchecked exception이 문법상 자유롭다는 사실은 LSP상 precondition 강화나 failure 의미 변경을 허용한다는 뜻이 아닙니다."],
    },
    {
      id: "compile-time-surface-runtime-dispatch-upcast",
      title: "reference type은 보이는 member를, runtime receiver class는 overridden instance body를 선택하며 upcast는 같은 객체를 가리킵니다",
      lead: "‘부모 타입으로 바뀐다’가 아니라 한 Cat reference를 Animal 관점으로 제한해 보는 것입니다.",
      explanations: [
        "`Cat cat = new Cat(); Animal animal = cat;`에서 new는 한 번뿐입니다. upcast assignment는 새 Animal object나 부모 부분 사본을 만들지 않고 같은 Cat object reference를 더 일반적인 static type으로 저장합니다.",
        "compiler는 animal expression의 compile-time type Animal에서 sound와 like가 호출 가능한지 확인합니다. Cat에만 선언된 play는 animal surface에 없으므로 runtime object가 Cat이어도 `animal.play()`는 compile되지 않습니다.",
        "호출이 유효하면 overridden instance method의 실제 body는 runtime receiver class에서 dynamic lookup됩니다. animal.sound()는 Cat body를 실행하지만 Animal에 정의되고 override되지 않은 like는 inherited body를 실행합니다.",
        "cast는 object를 변환하지 않고 reference expression의 static view를 좁힙니다. 실제 object가 해당 subtype인지 먼저 보장해야 하며 그렇지 않으면 runtime ClassCastException입니다.",
        "Ex18의 `Ex15_Animal animal` 한 변수로 Cat/Dog을 받는 것이 다형성의 시작이지만, null까지 유효한 subtype처럼 넣은 것은 별도 결함입니다. common surface와 valid receiver invariant를 함께 유지해야 합니다.",
        "dynamic dispatch는 caller의 if/switch를 각 subtype behavior로 이동시켜 확장 지점을 만들지만 동일한 method name만으로 행동 의미까지 자동 호환되지는 않습니다. 행동 계약은 LSP 장에서 검증합니다.",
      ],
      concepts: [
        { term: "compile-time member surface", definition: "reference expression의 declared/static type으로 compiler가 접근 가능하다고 인정하는 fields와 methods 집합입니다.", detail: ["Animal surface에는 sound/like가 있습니다.", "Cat-only play는 없습니다."] },
        { term: "dynamic dispatch", definition: "유효한 instance method call에서 runtime receiver class를 기준으로 가장 구체적인 override body를 찾는 과정입니다.", detail: ["sound가 Cat body로 갑니다.", "fields/static methods에는 같은 규칙이 아닙니다."] },
        { term: "upcast identity preservation", definition: "subtype reference를 supertype variable에 저장해도 object allocation·복사 없이 같은 identity를 유지하는 성질입니다.", detail: ["cat==animal입니다.", "관점만 일반화됩니다."] },
      ],
      codeExamples: [{
        id: "java-upcast-surface-dispatch",
        title: "Cat 한 객체를 Animal surface로 보고 identity·runtime type·override·inherited method를 분리합니다",
        language: "java",
        filename: "UpcastDispatchSurfaceLab.java",
        purpose: "upcast가 allocation이 아니며 compile-time surface와 runtime dispatch가 서로 다른 단계임을 exact markers로 증명합니다.",
        code: String.raw`public class UpcastDispatchSurfaceLab {
    static class Animal {
        String sound() { return "animal"; }
        String like() { return "like"; }
    }

    static final class Cat extends Animal {
        @Override String sound() { return "cat"; }
        String play() { return "wire"; }
    }

    public static void main(String[] args) {
        Cat cat = new Cat();
        Animal animal = cat;
        System.out.println("same=" + (cat == animal));
        System.out.println("runtime=" + animal.getClass().getSimpleName());
        System.out.println("sound=" + animal.sound());
        System.out.println("like=" + animal.like());
        System.out.println("playAfterCheck=" + ((Cat) animal).play());
    }
}`,
        walkthrough: [
          { lines: "2-10", explanation: "Animal common surface와 Cat override/Cat-only method를 나눕니다." },
          { lines: "13-15", explanation: "한 new 뒤 upcast assignment만 수행하고 ==로 같은 object identity를 확인합니다." },
          { lines: "16-18", explanation: "runtime class Cat, dispatched sound cat, inherited like를 서로 다른 evidence로 출력합니다." },
          { lines: "19", explanation: "실제 Cat임을 앞의 construction context가 보장한 뒤 명시 downcast로 Cat-only surface를 복원합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("UpcastDispatchSurfaceLab.java", "UpcastDispatchSurfaceLab") },
        output: { value: "same=true\nruntime=Cat\nsound=cat\nlike=like\nplayAfterCheck=wire", explanation: ["cat과 animal은 같은 reference라 same=true입니다.", "Animal surface의 sound call은 runtime Cat override를 실행합니다.", "Cat-only play는 narrow view를 얻은 뒤 호출합니다."] },
        experiments: [
          { change: "animal.play()를 직접 호출합니다.", prediction: "compiler가 Animal에서 play symbol을 찾지 못해 거부합니다.", result: "runtime class가 compiler member surface를 넓히지 않습니다." },
          { change: "Cat의 sound override를 제거합니다.", prediction: "sound=animal이 됩니다.", result: "inherited body가 사용되고 dynamic override lookup 결과가 달라집니다." },
          { change: "Animal animal = new Animal()로 바꾸고 Cat cast를 유지합니다.", prediction: "앞 네 줄 뒤 ClassCastException으로 종료합니다.", result: "cast는 실제 object type을 바꾸지 않습니다." },
        ],
        sourceRefs: ["java-class04-ex15", "java-class04-ex16", "java-class04-ex17", "java-class04-ex18", "jls-widening-reference", "jls-method-invocation", "jls-runtime-method-lookup", "jls-casting"],
      }],
      diagnostics: [
        { symptom: "animal이 실제 Cat인데 animal.play()가 compile되지 않는다.", likelyCause: "runtime class와 reference의 compile-time member surface를 혼동했습니다.", checks: ["variable declared type을 확인합니다.", "play가 어느 class에 선언됐는지 봅니다.", "공통 interface에 있어야 하는 동작인지 검토합니다."], fix: "정말 subtype-specific이면 pattern instanceof로 좁히고, 공통 행동이면 base contract로 승격합니다.", prevention: "caller가 subtype branch를 반복하면 common abstraction 설계를 재검토합니다." },
        { symptom: "upcast 뒤 Animal 객체와 Cat 객체가 두 개 생겼다고 생각했다.", likelyCause: "reference variable과 heap object를 같은 것으로 그렸습니다.", checks: ["new 표현식 수를 셉니다.", "cat==animal을 확인합니다.", "runtime class를 출력합니다."], fix: "한 object에 두 reference arrows를 그립니다.", prevention: "allocation은 new 지점으로, type conversion은 reference view로 따로 표시합니다." },
      ],
      expertNotes: ["JIT가 monomorphic/bimorphic call site를 inline할 수 있지만 최적화는 Java source의 dispatch semantics를 바꾸지 않습니다.", "API surface를 일부러 supertype으로 좁히는 것은 coupling을 줄이지만 subtype-only 기능을 되찾기 위한 cast가 반복되면 abstraction이 잘못 잘린 신호일 수 있습니다."],
    },
    {
      id: "super-augmentation-versus-replacement",
      title: "Cat은 super body 뒤 동작을 확장하고 Dog은 body를 대체하므로 override마다 재사용 의도를 명시합니다",
      lead: "override가 부모 body를 자동 포함하는 것도, 반드시 버려야 하는 것도 아닙니다.",
      explanations: [
        "Ex17 Cat.sound는 `super.sound()`를 명시 호출한 뒤 Cat sound를 출력합니다. 그래서 한 polymorphic call이 부모/자식 두 sound lines를 냅니다. super 호출은 dynamic dispatch를 다시 하는 것이 아니라 현재 override의 direct superclass implementation을 선택합니다.",
        "Ex16 Dog.sound는 super를 호출하지 않고 Dog sound만 출력하므로 parent behavior를 완전히 대체합니다. 두 방식 모두 언어상 유효하지만 base method가 어떤 단계와 invariant를 책임지는지에 따라 행동 계약 적합성이 달라집니다.",
        "부모 method가 필수 validation·audit·resource cleanup을 body에 숨기고 subclass가 super 호출을 잊으면 취약한 base class가 됩니다. 필수 단계는 final template method에 두고 variation point만 protected abstract/hook으로 분리하는 방법을 검토합니다.",
        "반대로 parent의 사용자 메시지까지 무조건 super로 재사용하면 Cat처럼 의도한 합성일 수도 있지만 중복 출력·중복 side effect가 될 수 있습니다. ‘코드 재사용’만으로 super 호출을 결정하지 않고 결과 contract를 먼저 씁니다.",
        "super는 별도 부모 객체가 아니라 같은 receiver에서 특정 superclass implementation을 선택하는 표현입니다. instance fields와 identity도 그대로 같은 object에 속합니다.",
        "composition/delegation은 parent implementation을 명시 collaborator로 호출해 재사용 시점과 실패를 드러낼 수 있습니다. is-a substitutability가 약하고 재사용만 필요하다면 inheritance보다 안전할 수 있습니다.",
      ],
      concepts: [
        { term: "override replacement", definition: "subclass body가 parent body를 호출하지 않고 계약을 자체 구현하는 방식입니다.", detail: ["Dog sound가 예입니다.", "필수 parent side effect를 잃지 않는지 검사합니다."] },
        { term: "override augmentation", definition: "subclass body가 super implementation을 호출하고 전후 동작을 추가하는 방식입니다.", detail: ["Cat sound가 예입니다.", "순서와 중복 side effect를 계약화합니다."] },
        { term: "template method", definition: "변하지 않아야 할 algorithm 순서를 final method에 두고 일부 단계만 overridable hook으로 위임하는 패턴입니다.", detail: ["필수 validation을 보호합니다.", "상속 coupling은 남습니다."] },
      ],
      codeExamples: [{
        id: "java-super-augmentation-replacement",
        title: "base·Cat augmentation·Dog replacement의 결과를 한 call surface로 비교합니다",
        language: "java",
        filename: "SuperAugmentationReplacementLab.java",
        purpose: "super 호출 유무가 polymorphic caller가 관찰하는 behavior sequence를 어떻게 바꾸는지 exact 문자열로 고정합니다.",
        code: String.raw`public class SuperAugmentationReplacementLab {
    static class Animal {
        String sound() { return "울음소리"; }
    }

    static final class Cat extends Animal {
        @Override String sound() { return super.sound() + ">야옹"; }
    }

    static final class Dog extends Animal {
        @Override String sound() { return "멍"; }
    }

    static String hear(Animal animal) { return animal.sound(); }

    public static void main(String[] args) {
        System.out.println("base=" + hear(new Animal()));
        System.out.println("cat=" + hear(new Cat()));
        System.out.println("dog=" + hear(new Dog()));
    }
}`,
        walkthrough: [
          { lines: "2-4", explanation: "base sound contract의 synthetic marker를 정의합니다." },
          { lines: "6-12", explanation: "Cat은 direct super 결과 뒤 Cat marker를 붙이고 Dog은 새 결과로 완전히 대체합니다." },
          { lines: "14-19", explanation: "caller hear는 Animal만 알며 세 runtime receivers에 같은 call을 적용합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("SuperAugmentationReplacementLab.java", "SuperAugmentationReplacementLab") },
        output: { value: "base=울음소리\ncat=울음소리>야옹\ndog=멍", explanation: ["Cat만 parent 결과를 포함합니다.", "Dog override는 parent body가 자동 실행되지 않아 멍만 반환합니다.", "hear call site는 세 경우 모두 같습니다."] },
        experiments: [
          { change: "Cat에서 super.sound()를 제거합니다.", prediction: "cat=야옹이 됩니다.", result: "parent body 포함은 명시적 선택입니다." },
          { change: "Dog에서 `super.sound()+\">멍\"`을 반환합니다.", prediction: "dog=울음소리>멍이 됩니다.", result: "replacement를 augmentation으로 바꾸면 observable contract가 달라집니다." },
          { change: "Animal.sound를 final로 바꿉니다.", prediction: "Cat/Dog declarations가 final method override 오류로 compile되지 않습니다.", result: "variation point가 아닌 invariant operation은 final로 닫을 수 있습니다." },
        ],
        sourceRefs: ["java-class04-ex15", "java-class04-ex16", "java-class04-ex17", "java-class04-ex18", "jls-super-method", "jls-overriding", "jls-final-method"],
      }],
      diagnostics: [
        { symptom: "override가 실행될 때 parent logging/validation도 자동 수행될 것으로 예상했다.", likelyCause: "dynamic dispatch와 implicit super body execution을 혼동했습니다.", checks: ["override body에 super call이 있는지 봅니다.", "parent side effect가 계약 필수인지 확인합니다.", "runtime exact sequence를 기록합니다."], fix: "필수 algorithm은 final template에 두거나 명시 super/delegation을 contract로 검증합니다.", prevention: "override hook 문서에 super call required/forbidden/optional을 명시합니다." },
        { symptom: "super.sound()가 다른 부모 객체의 method라고 설명했다.", likelyCause: "super를 object reference로 오해했습니다.", checks: ["new 개수를 셉니다.", "this identity가 바뀌는지 봅니다.", "field writes가 같은 receiver에 반영되는지 확인합니다."], fix: "같은 receiver에서 direct superclass implementation을 선택하는 표현으로 교정합니다.", prevention: "super arrow를 별도 heap object로 그리지 않습니다." },
      ],
      comparisons: [{ title: "부모 동작 재사용 선택", options: [
        { name: "완전 대체", chooseWhen: "subtype이 base postcondition을 독립적으로 만족하고 parent body가 불필요할 때", avoidWhen: "parent body에 필수 invariant가 숨겨졌을 때", tradeoffs: ["자율성", "중복 구현 가능"] },
        { name: "super 확장", chooseWhen: "parent 결과/side effect가 명시 계약이고 subtype이 전후 단계를 추가할 때", avoidWhen: "중복 I/O·중복 결제처럼 side effect가 겹칠 때", tradeoffs: ["코드 재사용", "base coupling"] },
        { name: "composition", chooseWhen: "is-a보다 특정 behavior 재사용만 필요하고 lifecycle을 명시할 때", avoidWhen: "진정한 substitutable subtype surface가 필요할 때", tradeoffs: ["결합 통제", "delegation 코드"] },
      ] }],
      expertNotes: ["constructor에서 overridable method를 호출하면 subclass fields가 초기화되기 전 override가 dispatch될 수 있으므로 template method를 construction path에서 실행하지 않습니다.", "super call 순서를 바꾸는 것은 source-compatible해 보여도 audit/logging/transaction 의미를 바꾸는 behavioral breaking change일 수 있습니다."],
    },
    {
      id: "field-static-hiding-versus-instance-dispatch",
      title: "instance fields와 static methods는 compile-time qualification으로 숨겨지고 overridden instance methods만 runtime dispatch됩니다",
      lead: "같은 이름이 보인다는 이유로 모든 member가 polymorphic하게 선택되는 것은 아닙니다.",
      explanations: [
        "instance method override call은 runtime receiver를 보지만 field access는 expression의 compile-time type과 declared field로 결정됩니다. Parent reference가 Child object를 가리켜도 `parent.label`은 Parent.label입니다.",
        "Child reference로 같은 object를 보면 `child.label`은 Child가 숨긴 field입니다. 두 fields는 같은 object 안에 별도 storage로 존재할 수 있으며 override처럼 하나가 다른 것을 대체하지 않습니다.",
        "static method도 instance receiver dynamic dispatch 대상이 아니며 subclass의 같은 signature static method는 hiding입니다. Parent.kind()와 Child.kind()처럼 class 이름으로 qualification해 selection을 명시합니다.",
        "reference variable을 통해 static method를 호출하면 compiler가 static type으로 선택하므로 값은 예측 가능해도 ownership과 의도가 흐려집니다. compiler warning 설정과 style rule로 class qualification을 강제합니다.",
        "Ex18/22가 보여 주는 sound/pay는 instance override라 runtime class에 따라 달라집니다. 이를 앞 세션의 field hiding 결과와 섞으면 ‘부모 변수라 부모 method’ 같은 잘못된 예측을 하게 됩니다.",
        "polymorphic behavior를 원한다면 field를 public data surface로 노출하기보다 instance method contract로 감쌉니다. field hiding은 API evolution과 상태 invariant를 어렵게 하므로 피하는 편이 안전합니다.",
      ],
      concepts: [
        { term: "field hiding", definition: "subclass가 superclass field와 같은 이름의 새 field를 선언해 compile-time view에 따라 서로 다른 storage를 선택하게 하는 현상입니다.", detail: ["dynamic dispatch가 아닙니다.", "두 storage가 공존할 수 있습니다."] },
        { term: "static method hiding", definition: "subclass가 superclass static method와 같은 signature를 선언해 class/reference compile-time type으로 선택되게 하는 관계입니다.", detail: ["override와 다릅니다.", "class qualification을 사용합니다."] },
        { term: "instance override dispatch", definition: "상위 surface에서 유효한 instance method call이 runtime receiver의 가장 구체적인 body를 실행하는 선택입니다.", detail: ["speak가 Child body입니다.", "field/static과 대조합니다."] },
      ],
      codeExamples: [{
        id: "java-hiding-versus-dispatch",
        title: "같은 Child object에서 Parent/Child fields·static methods·instance method 결과를 나란히 봅니다",
        language: "java",
        filename: "HidingVersusDispatchLab.java",
        purpose: "field/static compile-time selection과 instance method runtime selection을 같은 identity에서 exact 비교합니다.",
        code: String.raw`public class HidingVersusDispatchLab {
    static class Parent {
        String label = "parent";
        static String kind() { return "parent-static"; }
        String speak() { return "parent-speak"; }
    }

    static final class Child extends Parent {
        String label = "child";
        static String kind() { return "child-static"; }
        @Override String speak() { return "child-speak"; }
        String both() { return super.speak() + ">" + speak(); }
    }

    public static void main(String[] args) {
        Child child = new Child();
        Parent parent = child;
        System.out.println("same=" + (parent == child));
        System.out.println("parentField=" + parent.label);
        System.out.println("childField=" + child.label);
        System.out.println("parentStatic=" + Parent.kind());
        System.out.println("childStatic=" + Child.kind());
        System.out.println("instance=" + parent.speak());
        System.out.println("superAndDynamic=" + child.both());
    }
}`,
        walkthrough: [
          { lines: "2-6", explanation: "Parent가 field/static/instance method에 서로 다른 markers를 둡니다." },
          { lines: "8-13", explanation: "Child가 field/static을 숨기고 instance method를 override하며 super와 virtual call을 함께 노출합니다." },
          { lines: "16-24", explanation: "동일 identity에서 reference view별 field, class-qualified static, runtime instance dispatch를 출력합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("HidingVersusDispatchLab.java", "HidingVersusDispatchLab") },
        output: { value: "same=true\nparentField=parent\nchildField=child\nparentStatic=parent-static\nchildStatic=child-static\ninstance=child-speak\nsuperAndDynamic=parent-speak>child-speak", explanation: ["한 Child identity 안에서도 field access는 reference type에 따라 parent/child storage를 봅니다.", "static은 class qualification대로 선택됩니다.", "parent.speak는 runtime Child override로 dispatch됩니다."] },
        experiments: [
          { change: "Child label declaration을 제거합니다.", prediction: "childField도 parent가 됩니다.", result: "inherited 한 field만 남아 두 views가 같은 storage를 봅니다." },
          { change: "Child kind에서 static을 제거합니다.", prediction: "instance method cannot override static method 계열 compile error입니다.", result: "static/instance 선언 형태를 바꾸어 override로 전환할 수 없습니다." },
          { change: "Child speak override를 제거합니다.", prediction: "instance와 both의 두 번째 값이 parent-speak가 됩니다.", result: "runtime lookup에 더 구체적인 body가 없으면 inherited body를 사용합니다." },
        ],
        sourceRefs: ["jls-field-hiding", "jls-static-hiding", "jls-runtime-method-lookup", "jls-super-method", "java-class04-ex18", "java-class04-ex22"],
      }],
      diagnostics: [
        { symptom: "Parent reference의 field도 Child 값일 것으로 예상했다.", likelyCause: "field access에 instance dynamic dispatch를 적용했습니다.", checks: ["field declaration owners를 찾습니다.", "access expression의 compile-time type을 적습니다.", "method call과 분리합니다."], fix: "field는 compile-time selection으로 계산하고 polymorphic state는 method로 노출합니다.", prevention: "상속 계층에서 같은 이름 field 재선언을 금지합니다." },
        { symptom: "parentReference.staticMethod()가 runtime Child static을 호출할 것으로 예상했다.", likelyCause: "static hiding을 instance override로 오해했습니다.", checks: ["method가 static인지 봅니다.", "reference declared type을 봅니다.", "class qualification으로 다시 호출합니다."], fix: "Parent.kind/Child.kind처럼 declaring class를 명시합니다.", prevention: "static member를 instance expression으로 호출하지 않는 lint/style을 적용합니다." },
      ],
      expertNotes: ["public/protected fields의 hiding은 serialization, reflection, frameworks의 property mapping에서도 중복 상태를 만들 수 있어 private fields와 behavior methods가 안전합니다.", "interface static methods도 instance polymorphism에 참여하지 않으며 implementing class에 inherited instance method처럼 들어오지 않습니다."],
    },
    {
      id: "safe-downcast-pattern-instanceof-null",
      title: "downcast는 실제 subtype 증거 뒤에만 수행하고 pattern instanceof로 검사와 binding을 한 범위에 묶습니다",
      lead: "cast는 객체를 Cat으로 바꾸는 연산이 아니라 이미 Cat인 객체를 Cat surface로 보는 위험한 주장입니다.",
      explanations: [
        "widening reference conversion인 upcast는 subtype object가 supertype 계약을 만족한다는 언어 관계로 일반적으로 runtime check 없이 가능합니다. narrowing downcast는 실제 receiver가 target subtype인지 runtime에 검사합니다.",
        "`candidate instanceof Cat cat`은 null이면 false이고 Cat이면 검사된 binding cat을 true branch에 제공합니다. 검사와 별도의 cast를 떨어뜨려 쓰다가 다른 variable을 cast하는 실수를 줄입니다.",
        "Animal이지만 Dog인 값을 Cat으로 강제 cast하면 ClassCastException입니다. compiler가 상속 관계상 가능성을 허용해도 특정 runtime value가 맞는지는 별 문제입니다.",
        "null은 어떤 reference type variable에도 들어갈 수 있지만 method receiver로 호출할 수 있는 object가 아닙니다. instanceof는 null에 false라 안전한 분기 도구지만 null을 정상 subtype 중 하나처럼 장기간 유지하는 설계를 정당화하지 않습니다.",
        "subtype-specific play가 caller 곳곳에서 필요하면 instanceof cascade를 늘리기보다 공통 behavior를 base/interface에 올리거나 visitor/sealed exhaustive operation/composition을 검토합니다.",
        "downcast 후 same identity는 유지됩니다. 새 Cat이 생성되는 것이 아니며 validated narrow reference가 기존 object를 가리킵니다.",
      ],
      concepts: [
        { term: "narrowing reference conversion", definition: "더 구체적인 reference type view를 요청하며 runtime type compatibility check가 필요한 변환입니다.", detail: ["실패하면 ClassCastException입니다.", "object를 새로 만들지 않습니다."] },
        { term: "pattern instanceof", definition: "type test가 성공한 branch 범위에 target type variable을 함께 binding하는 Java pattern입니다.", detail: ["null에는 false입니다.", "중복 cast를 줄입니다."] },
        { term: "cast pressure", definition: "공통 abstraction 밖 subtype 기능을 사용하려고 caller가 반복적으로 narrowing하는 설계 신호입니다.", detail: ["abstraction 누락일 수 있습니다.", "sealed operation이나 composition을 검토합니다."] },
      ],
      codeExamples: [{
        id: "java-safe-pattern-downcast",
        title: "Cat·Dog·null·other를 pattern으로 분류하고 valid/invalid cast identity를 확인합니다",
        language: "java",
        filename: "SafePatternDowncastLab.java",
        purpose: "pattern instanceof의 null behavior와 safe subtype binding, unchecked cast의 ClassCastException을 결정적으로 비교합니다.",
        code: String.raw`public class SafePatternDowncastLab {
    static class Animal { String sound() { return "animal-sound"; } }
    static final class Cat extends Animal { String play() { return "cat-play"; } }
    static final class Dog extends Animal { @Override String sound() { return "dog-sound"; } }

    static String describe(Object candidate) {
        if (candidate instanceof Cat cat) return cat.play();
        if (candidate instanceof Animal animal) return animal.sound();
        if (candidate == null) return "null";
        return "unsupported";
    }

    public static void main(String[] args) {
        Cat original = new Cat();
        Animal widened = original;
        Cat narrowed = (Cat) widened;
        System.out.println("cat=" + describe(original));
        System.out.println("dog=" + describe(new Dog()));
        System.out.println("null=" + describe(null));
        System.out.println("other=" + describe("text"));
        System.out.println("downcastSame=" + (original == narrowed));
        try {
            Cat impossible = (Cat) (Animal) new Dog();
            System.out.println(impossible.play());
        } catch (ClassCastException error) {
            System.out.println("badCast=" + error.getClass().getSimpleName());
        }
    }
}`,
        walkthrough: [
          { lines: "2-4", explanation: "공통 Animal과 Cat-only play, Dog override를 구성합니다." },
          { lines: "6-11", explanation: "Cat pattern을 먼저 검사하고 나머지 Animal, null, unsupported를 mutually exclusive paths로 분류합니다." },
          { lines: "14-21", explanation: "known Cat을 widen/narrow한 뒤 same identity와 네 inputs의 결과를 출력합니다." },
          { lines: "22-27", explanation: "Dog object를 Cat으로 주장해 runtime ClassCastException을 catch하고 type만 정규화합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("SafePatternDowncastLab.java", "SafePatternDowncastLab") },
        output: { value: "cat=cat-play\ndog=dog-sound\nnull=null\nother=unsupported\ndowncastSame=true\nbadCast=ClassCastException", explanation: ["Cat은 pattern binding으로 play, Dog은 Animal branch의 dynamic sound를 사용합니다.", "null instanceof는 false라 explicit null branch에 도달합니다.", "valid cast는 same identity이고 Dog→Cat 주장은 ClassCastException입니다."] },
        experiments: [
          { change: "Animal branch를 Cat branch보다 먼저 둡니다.", prediction: "Cat도 Animal에 먼저 매칭되어 animal-sound를 반환하고 Cat play branch는 사실상 도달하지 않습니다.", result: "더 구체적인 pattern을 먼저 배치해야 합니다." },
          { change: "null branch를 첫 줄로 옮깁니다.", prediction: "출력은 같습니다.", result: "instanceof 자체가 null-safe이지만 명시 null policy의 가독성은 선택할 수 있습니다." },
          { change: "bad cast 전에 `if (value instanceof Cat cat)`을 사용합니다.", prediction: "Dog이면 branch가 실행되지 않아 exception이 없습니다.", result: "runtime evidence가 narrowing 주장을 보호합니다." },
        ],
        sourceRefs: ["java-class04-ex16", "java-class04-ex17", "java-class04-ex18", "jls-casting", "jls-instanceof", "jls-pattern-instanceof", "jls-pattern-instanceof-scope", "java-class-cast-exception"],
      }],
      diagnostics: [
        { symptom: "Animal을 Cat으로 cast했더니 ClassCastException이 난다.", likelyCause: "variable declared type이 Animal이라는 사실만 보고 runtime object도 Cat이라고 가정했습니다.", checks: ["object 생성 지점을 찾습니다.", "getClass 또는 instanceof로 확인합니다.", "cast가 필요한 API 이유를 검토합니다."], fix: "pattern instanceof 성공 branch에서만 Cat 기능을 사용합니다.", prevention: "subtype 분기가 반복되면 공통 contract나 sealed exhaustive operation으로 재설계합니다." },
        { symptom: "instanceof null이 NullPointerException을 낼까봐 검사 전에 method를 호출했다.", likelyCause: "instanceof의 null 결과 규칙을 몰랐습니다.", checks: ["candidate가 null일 수 있는 boundary를 찾습니다.", "method call보다 type test가 앞인지 봅니다.", "null을 허용할지 결정합니다."], fix: "null policy를 먼저 정하고 pattern instanceof 또는 Objects.requireNonNull을 boundary에서 사용합니다.", prevention: "nullable state를 return type/annotation/Optional/validation으로 명시합니다." },
      ],
      expertNotes: ["pattern matching은 cast 문법을 줄이지만 subtype branching 자체의 open/closed trade-off를 없애지 않습니다.", "ClassCastException message에는 module/loader identity 정보가 포함될 수 있으므로 공개 golden에서는 simple class name만 고정합니다."],
    },
    {
      id: "selection-boundary-no-null-receiver",
      title: "입력 선택은 Optional/factory 경계에서 끝내고 null receiver가 polymorphic call site에 도달하지 않게 합니다",
      lead: "다형성 변수에 null을 임시 placeholder로 넣는 순간 모든 뒤 호출에 숨은 상태 검사가 필요해집니다.",
      explanations: [
        "Ex18은 `animal=null`로 시작해 choice1/2에서만 receiver를 배정합니다. invalid input이 들어오면 null이 sound call까지 흐르므로 user input 오류가 line28 NullPointerException이라는 내부 실패로 바뀝니다.",
        "factory는 supported choice를 concrete object로 매핑하고 unsupported choice를 Optional.empty나 명시 domain error로 반환해야 합니다. caller는 empty를 처리한 뒤에만 common Animal call을 수행합니다.",
        "null check를 sound 바로 앞에 한 줄 넣는 것도 crash는 막지만 selection rules가 caller에 남습니다. choice parsing·supported values·object creation을 한 boundary로 모으면 tests와 오류 메시지가 명확해집니다.",
        "Optional은 모든 field와 parameter의 만능 대체가 아니라 ‘결과가 없을 수 있음’을 return type에 드러내는 한 선택입니다. invalid input을 반드시 실패시켜야 하면 exception/result sealed type을 사용할 수 있습니다.",
        "factory가 반환한 Animal은 non-null invariant를 갖고 caller는 sound/like만 압니다. Cat/Dog 추가 시 caller의 dispatch call은 바뀌지 않지만 open factory registry는 새 mapping을 등록해야 합니다.",
        "Scanner token parsing 실패(InputMismatchException)와 supported range 실패는 다른 diagnostics입니다. 문자열 parse, integer validation, domain selection의 각 경계를 분리합니다.",
      ],
      concepts: [
        { term: "selection boundary", definition: "외부 choice를 valid domain object 또는 명시 실패로 변환하는 단일 경계입니다.", detail: ["null placeholder를 제거합니다.", "supported values를 한 곳에 둡니다."] },
        { term: "non-null receiver invariant", definition: "polymorphic call site에 도달한 receiver는 반드시 유효한 object라는 조건입니다.", detail: ["sound 앞 null check가 필요 없습니다.", "invalid choice는 앞에서 종료합니다."] },
        { term: "absence as type", definition: "값 부재를 null 암묵 상태가 아니라 Optional/result type으로 caller contract에 표시하는 방식입니다.", detail: ["처리 누락을 줄입니다.", "오류 이유가 필요하면 richer result를 씁니다."] },
      ],
      codeExamples: [{
        id: "java-null-free-animal-selection",
        title: "choice1·2는 valid Animal, choice9는 invalid result로 끝내 NPE 경로를 제거합니다",
        language: "java",
        filename: "NullFreeAnimalSelectionLab.java",
        purpose: "Ex18 branch의 학습 의도는 보존하면서 invalid choice가 null receiver 호출로 이어지지 않는 factory boundary를 검증합니다.",
        code: String.raw`import java.util.Optional;

public class NullFreeAnimalSelectionLab {
    interface Animal {
        String sound();
        default String like() { return "좋아하는 행동"; }
    }

    static final class Cat implements Animal {
        public String sound() { return "울음소리>야옹"; }
    }

    static final class Dog implements Animal {
        public String sound() { return "멍"; }
    }

    static Optional<Animal> select(int choice) {
        return switch (choice) {
            case 1 -> Optional.of(new Cat());
            case 2 -> Optional.of(new Dog());
            default -> Optional.empty();
        };
    }

    static String run(int choice) {
        return select(choice)
                .map(animal -> animal.sound() + "|" + animal.like())
                .orElse("invalid");
    }

    public static void main(String[] args) {
        System.out.println("choice1=" + run(1));
        System.out.println("choice2=" + run(2));
        System.out.println("choice9=" + run(9));
    }
}`,
        walkthrough: [
          { lines: "4-15", explanation: "Animal common contract와 Cat/Dog implementations를 null 없이 정의합니다." },
          { lines: "17-23", explanation: "choice mapping이 Optional<Animal> 또는 empty를 반환해 object selection을 한 함수에 모읍니다." },
          { lines: "25-29", explanation: "present receiver에만 sound/like를 dispatch하고 absence는 invalid로 바꿉니다." },
          { lines: "32-35", explanation: "원본 정상1/2와 실패9를 같은 process에서 deterministic 결과로 비교합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("NullFreeAnimalSelectionLab.java", "NullFreeAnimalSelectionLab") },
        output: { value: "choice1=울음소리>야옹|좋아하는 행동\nchoice2=멍|좋아하는 행동\nchoice9=invalid", explanation: ["choice1/2만 non-null Animal에 common calls를 수행합니다.", "choice9는 factory absence에서 종료되어 stdout prompt-only+NPE가 아니라 명시 invalid 결과가 됩니다."] },
        experiments: [
          { change: "default에서 Optional.of(new Animal fallback)를 반환합니다.", prediction: "choice9도 성공처럼 보입니다.", result: "fallback이 domain상 정당한지 없이 crash만 숨기면 오류 의미가 왜곡됩니다." },
          { change: "select가 Optional 대신 null을 반환하게 합니다.", prediction: "run의 map 호출 자체가 NPE가 됩니다.", result: "부재 contract를 type으로 유지해야 합니다." },
          { change: "choice3에 Bird를 등록합니다.", prediction: "run은 수정 없이 Bird sound/like를 dispatch합니다.", result: "factory mapping은 확장되지만 polymorphic caller는 닫혀 있습니다." },
        ],
        sourceRefs: ["java-class04-ex18", "java-optional-api", "jls-switch-expressions", "jls-runtime-method-lookup"],
      }],
      diagnostics: [
        { symptom: "invalid choice가 NullPointerException으로 보인다.", likelyCause: "null placeholder를 valid Animal과 같은 variable state로 유지했습니다.", checks: ["animal 초기값을 봅니다.", "모든 choice가 assignment하는지 봅니다.", "call 전 absence 처리가 있는지 확인합니다."], fix: "factory가 Optional/result를 반환하고 absent path를 call site 전에 종료합니다.", prevention: "polymorphic collection/variable에는 valid contract objects만 저장합니다." },
        { symptom: "숫자가 아닌 입력에서 selection logic까지 도달하지 못한다.", likelyCause: "Scanner/token parsing failure와 unsupported integer를 한 오류로 처리했습니다.", checks: ["hasNextInt 또는 parse 경계를 봅니다.", "range validation을 분리합니다.", "각 error message/test를 확인합니다."], fix: "text→int parsing과 int→Animal selection을 별 functions/results로 나눕니다.", prevention: "외부 input boundary마다 syntax와 domain validation tests를 둡니다." },
      ],
      expertNotes: ["Optional을 entity field나 serialization model에 무조건 사용하기보다 public return absence contract에 선택적으로 사용합니다.", "factory registry가 외부 class name을 reflection으로 무제한 load하면 code execution surface가 되므로 allowlisted key→supplier mapping과 version/permission 검증을 둡니다."],
    },
    {
      id: "payment-strategy-dependency-injection",
      title: "결제 선택 분기와 실행을 분리해 Checkout은 주입된 PaymentMethod 공통 계약만 호출합니다",
      lead: "다형성의 가치는 `if(choice)`를 없애는 것 자체가 아니라 변화하는 선택과 안정적인 업무 흐름의 책임을 나누는 데 있습니다.",
      explanations: [
        "Ex22는 Card/Kakao objects를 Payment reference에 넣어 pay를 dispatch하지만 선택 분기와 null placeholder도 같은 main에 둡니다. 예제가 작아 보이지만 provider가 늘면 caller마다 같은 if/switch가 복제될 수 있습니다.",
        "strategy interface는 결제 실행 contract를 표현하고 Checkout은 constructor로 정확히 하나의 non-null strategy를 받습니다. Checkout.complete는 amount validation과 common flow만 담당하고 provider-specific 승인/연결 문구는 구현에 둡니다.",
        "registry/factory는 external key를 strategy supplier로 변환합니다. unknown key는 Optional.empty로 반환해 null strategy가 Checkout에 주입되지 않게 합니다. 실제 DI container를 쓰지 않아도 plain constructor injection이면 충분합니다.",
        "원본 클래스명 Payment와 pay 구조, Card/Kakao 5000·5200 dispatch 의미는 보존하지만 새 출력의 사용자 표기는 `결재`에서 `결제`로 교정합니다. source audit golden은 원본 spelling을 별도로 유지합니다.",
        "strategy가 network I/O를 수행하면 timeout, idempotency key, retry, duplicate charge, cancellation, observability가 contract 일부가 됩니다. 단순 String output polymorphism만으로 production payment safety가 확보되지는 않습니다.",
        "provider selection이 request별이면 Checkout도 request scope로 구성하고 mutable global currentPayment를 두지 않습니다. tests는 각 fake strategy를 독립 주입해 call arguments와 receipt를 검증합니다.",
      ],
      concepts: [
        { term: "strategy", definition: "같은 업무 목적을 수행하는 교체 가능한 behavior object를 공통 interface로 표현한 패턴입니다.", detail: ["Card/Kakao가 구현합니다.", "caller branch를 줄입니다."] },
        { term: "constructor injection", definition: "필수 collaborator를 object 생성 시 parameter로 받아 non-null invariant와 dependency를 명시하는 방식입니다.", detail: ["global locator가 필요 없습니다.", "test fake를 지역적으로 넣습니다."] },
        { term: "factory registry", definition: "외부 provider key를 허용된 strategy supplier로 매핑하는 selection component입니다.", detail: ["unknown을 명시 실패로 반환합니다.", "execution과 selection을 분리합니다."] },
      ],
      codeExamples: [{
        id: "java-payment-strategy-injection",
        title: "Card·Kakao를 같은 Checkout에 주입하고 unknown provider를 null 없이 거부합니다",
        language: "java",
        filename: "PaymentStrategyInjectionLab.java",
        purpose: "Ex19~22의 runtime dispatch를 constructor-injected strategy와 allowlisted factory로 재구성하고 결제 표기를 교정합니다.",
        code: String.raw`import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;

public class PaymentStrategyInjectionLab {
    interface PaymentMethod { List<String> pay(int amount); }

    static final class CardPayment implements PaymentMethod {
        public List<String> pay(int amount) {
            return List.of("카드 결제 승인 요청", "카드로 " + amount + "원 결제 완료");
        }
    }

    static final class KakaoPayment implements PaymentMethod {
        public List<String> pay(int amount) {
            return List.of("카카오 페이 서버 연결", "카카오 페이로 " + amount + "원 결제 완료");
        }
    }

    record Checkout(PaymentMethod method) {
        Checkout {
            if (method == null) throw new IllegalArgumentException("method required");
        }
        String complete(int amount) {
            if (amount <= 0) throw new IllegalArgumentException("positive amount required");
            return String.join(">", method.pay(amount));
        }
    }

    static final Map<String, Supplier<PaymentMethod>> METHODS = Map.of(
            "card", CardPayment::new, "kakao", KakaoPayment::new);

    static Optional<Checkout> checkout(String key) {
        Supplier<PaymentMethod> supplier = METHODS.get(key);
        return supplier == null ? Optional.empty() : Optional.of(new Checkout(supplier.get()));
    }

    public static void main(String[] args) {
        System.out.println("card=" + checkout("card").orElseThrow().complete(5000));
        System.out.println("kakao=" + checkout("kakao").orElseThrow().complete(5000));
        System.out.println("selected=" + checkout("kakao").orElseThrow().complete(5200));
        System.out.println("unknown=" + checkout("cash").map(value -> "unexpected").orElse("unknown-method"));
    }
}`,
        walkthrough: [
          { lines: "7-18", explanation: "두 providers가 같은 List<String> pay contract를 구현하고 원본 동작을 교정된 합성 문구로 반환합니다." },
          { lines: "20-28", explanation: "Checkout record가 non-null strategy와 positive amount를 보장한 뒤 provider behavior를 dispatch합니다." },
          { lines: "30-36", explanation: "allowlisted key→supplier registry가 selection을 담당하고 unknown은 Optional.empty입니다." },
          { lines: "39-43", explanation: "원본 5000·5000·5200 흐름과 unknown failure를 같은 caller surface로 실행합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("PaymentStrategyInjectionLab.java", "PaymentStrategyInjectionLab") },
        output: { value: "card=카드 결제 승인 요청>카드로 5000원 결제 완료\nkakao=카카오 페이 서버 연결>카카오 페이로 5000원 결제 완료\nselected=카카오 페이 서버 연결>카카오 페이로 5200원 결제 완료\nunknown=unknown-method", explanation: ["Checkout call은 동일하고 injected runtime strategy만 provider-specific result를 만듭니다.", "unknown key는 null receiver나 NPE 없이 selection failure로 끝납니다.", "새 문구는 결제 표기로 교정됐습니다."] },
        experiments: [
          { change: "METHODS에 bank supplier를 추가합니다.", prediction: "Checkout 구현 변경 없이 bank key가 새 behavior를 실행합니다.", result: "선택 registry 확장과 업무 flow 변경을 분리합니다." },
          { change: "Checkout constructor null check를 제거하고 new Checkout(null)을 만듭니다.", prediction: "complete에서 method.pay NPE가 납니다.", result: "필수 dependency는 construction boundary에서 거부해야 합니다." },
          { change: "amount validation을 각 provider에만 둡니다.", prediction: "providers 사이 failure behavior가 drift할 수 있습니다.", result: "공통 precondition owner를 interface contract/Checkout에서 정합니다." },
        ],
        sourceRefs: ["java-class04-ex19", "java-class04-ex20", "java-class04-ex21", "java-class04-ex22", "java-optional-api", "java-map-api", "java-supplier-api", "jls-runtime-method-lookup"],
      }],
      diagnostics: [
        { symptom: "provider를 추가할 때마다 여러 controllers의 if/switch를 모두 수정한다.", likelyCause: "selection과 execution이 caller마다 복제됐습니다.", checks: ["choice branches를 검색합니다.", "common pay surface가 있는지 봅니다.", "registry owner를 확인합니다."], fix: "allowlisted factory registry와 injected PaymentMethod로 selection/execution을 분리합니다.", prevention: "caller는 concrete provider class가 아니라 interface dependency만 받습니다." },
        { symptom: "retry 뒤 같은 주문이 두 번 결제된다.", likelyCause: "polymorphic interface에 idempotency/failure semantics가 없고 network retry를 단순 재호출했습니다.", checks: ["idempotency key 전달을 확인합니다.", "timeout과 unknown-result 상태를 구분합니다.", "provider reconciliation을 봅니다."], fix: "Payment contract에 idempotency·receipt identity·retryable status를 모델링합니다.", prevention: "실제 결제 strategy는 String 출력이 아니라 운영 failure protocol까지 contract test합니다." },
      ],
      comparisons: [{ title: "provider 선택 구조", options: [
        { name: "caller if/switch", chooseWhen: "닫힌 두 경우의 일회성 adapter이고 변경이 거의 없을 때", avoidWhen: "여러 callers/providers가 반복될 때", tradeoffs: ["직접적", "분기 복제"] },
        { name: "factory+strategy", chooseWhen: "provider 선택과 공통 업무 flow를 분리할 때", avoidWhen: "behavior 차이가 전혀 없고 단순 data mapping일 때", tradeoffs: ["확장 지점", "registry 관리"] },
        { name: "DI composition root", chooseWhen: "scope·config·credentials·test doubles까지 application startup에서 구성할 때", avoidWhen: "작은 순수 예제에서 framework가 더 복잡할 때", tradeoffs: ["dependency 명시", "구성 비용"] },
      ] }],
      expertNotes: ["payment implementation을 plugin으로 열 때 arbitrary class loading을 피하고 signed/allowlisted provider와 최소 권한 credential scope를 사용합니다.", "provider 객체가 thread-safe인지 명시하지 않은 채 singleton으로 재사용하지 말고 request/session/application scope를 상태 모델에 맞춥니다."],
    },
    {
      id: "liskov-behavioral-contracts",
      title: "compile되는 override라도 precondition을 강화하거나 결과 의미를 약화하면 Liskov substitution을 위반합니다",
      lead: "Java compiler는 signature 호환성을 검사하지만 ‘positive amount면 승인 결과를 반환한다’는 업무 의미까지 증명하지 않습니다.",
      explanations: [
        "LSP는 S가 T의 subtype일 때 T를 기대하는 프로그램의 바람직한 성질을 깨지 않고 S로 대체할 수 있어야 한다는 행동 원칙입니다. 단순히 `extends/implements`가 compile된다는 사실보다 강합니다.",
        "subtype은 base client가 허용한 입력을 새로 거부하도록 precondition을 강화하면 안 됩니다. Payment가 모든 positive amount를 받는다면 Minimum1000 구현이1~999를 거부하는 것은 signature가 같아도 substitutability 위반입니다.",
        "postcondition을 약화해 approved receipt 대신 null/다른 amount를 반환하거나 invariant를 깨도 위반입니다. caller가 concrete class를 몰라도 믿는 결과 의미를 contract tests로 고정합니다.",
        "checked throws restriction은 일부 문법 보호만 제공합니다. unchecked IllegalArgumentException, timeout mapping, partial side effect, logging, performance/resource limits 같은 behavioral difference는 별 검증이 필요합니다.",
        "contract test는 모든 implementations에 같은 input suite를 적용합니다. 여기서는 positive1·5000이 approved이고 receipt amount가 input과 같다는 postcondition을 검사해 Card/Kakao는 통과하고 MinimumPayment는 실패시킵니다.",
        "모든 implementations가 완전히 동일해야 한다는 뜻은 아닙니다. provider label·내부 protocol은 달라도 base client가 의존하는 pre/post/failure invariant를 지켜야 합니다.",
      ],
      concepts: [
        { term: "behavioral subtyping", definition: "subtype이 base type caller가 의존하는 입력·결과·상태·실패 의미를 보존하는 관계입니다.", detail: ["문법 override보다 강합니다.", "공통 contract tests로 검증합니다."] },
        { term: "precondition strengthening", definition: "subtype이 base보다 더 제한된 입력만 허용해 기존 valid caller를 실패시키는 위반입니다.", detail: ["positive→minimum1000이 예입니다.", "caller 분기를 강요합니다."] },
        { term: "postcondition weakening", definition: "subtype이 base가 약속한 결과 품질·상태를 덜 보장하는 위반입니다.", detail: ["null receipt나 wrong amount가 예입니다.", "compiler가 자동 검사하지 않습니다."] },
      ],
      codeExamples: [{
        id: "java-lsp-payment-contract-suite",
        title: "Card/Kakao는 공통 positive contract를 통과하고 minimum1000 구현은 행동 위반으로 탐지됩니다",
        language: "java",
        filename: "LiskovPaymentContractLab.java",
        purpose: "같은 signature만으로 보이지 않는 precondition/postcondition을 모든 Payment implementations에 실행하는 reusable contract test로 검증합니다.",
        code: String.raw`public class LiskovPaymentContractLab {
    record Receipt(String provider, int amount, boolean approved) {}
    interface Payment { Receipt pay(int amount); }

    static final class CardPayment implements Payment {
        public Receipt pay(int amount) {
            if (amount <= 0) throw new IllegalArgumentException("positive required");
            return new Receipt("card", amount, true);
        }
    }

    static final class KakaoPayment implements Payment {
        public Receipt pay(int amount) {
            if (amount <= 0) throw new IllegalArgumentException("positive required");
            return new Receipt("kakao", amount, true);
        }
    }

    static final class MinimumPayment implements Payment {
        public Receipt pay(int amount) {
            if (amount < 1000) throw new IllegalArgumentException("minimum 1000");
            return new Receipt("minimum", amount, true);
        }
    }

    static int checks;
    static String verify(Payment payment) {
        for (int amount : new int[]{1, 5000}) {
            Receipt receipt = payment.pay(amount);
            if (!receipt.approved() || receipt.amount() != amount) {
                throw new AssertionError("postcondition violated");
            }
            checks++;
        }
        return "pass";
    }

    public static void main(String[] args) {
        System.out.println("card=" + verify(new CardPayment()));
        System.out.println("kakao=" + verify(new KakaoPayment()));
        try {
            verify(new MinimumPayment());
            System.out.println("bad=unexpected-pass");
        } catch (IllegalArgumentException error) {
            System.out.println("bad=contract-violation");
        }
        System.out.println("checks=" + checks);
    }
}`,
        walkthrough: [
          { lines: "2-3", explanation: "base contract surface를 receipt와 pay signature로 정의합니다." },
          { lines: "5-16", explanation: "Card/Kakao는 모든 positive amount와 matching approved receipt postcondition을 지킵니다." },
          { lines: "18-23", explanation: "MinimumPayment는 같은 signature지만1이라는 base-valid input을 새로 거부합니다." },
          { lines: "25-35", explanation: "공통 verifier가 두 inputs와 receipt invariants를 concrete type 분기 없이 검사합니다." },
          { lines: "37-48", explanation: "두 valid implementations와 행동 위반 구현에 같은 suite를 적용하고 successful checks4를 고정합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("LiskovPaymentContractLab.java", "LiskovPaymentContractLab") },
        output: { value: "card=pass\nkakao=pass\nbad=contract-violation\nchecks=4", explanation: ["Card/Kakao는 각각 amount1·5000 두 checks를 통과합니다.", "MinimumPayment는 첫 base-valid input1에서 precondition을 강화해 탐지됩니다.", "실패 구현의 check는 증가 전이라 total4입니다."] },
        experiments: [
          { change: "MinimumPayment도 amount>0만 검사합니다.", prediction: "bad=unexpected-pass와 checks=6이 됩니다.", result: "공통 precondition을 회복하면 suite를 통과합니다." },
          { change: "Kakao receipt amount를 amount-1로 반환합니다.", prediction: "kakao 출력 전에 AssertionError로 종료합니다.", result: "postcondition weakening도 같은 suite가 탐지합니다." },
          { change: "verify가 amount5000만 검사하게 합니다.", prediction: "MinimumPayment가 통과해 위반을 놓칩니다.", result: "contract boundary values와 representative valid set이 중요합니다." },
        ],
        sourceRefs: ["java-class04-ex19", "java-class04-ex20", "java-class04-ex21", "java-class04-ex22", "lsp-primary", "jls-overriding"],
      }],
      diagnostics: [
        { symptom: "새 Payment 구현만 특정 valid amount에서 실패한다.", likelyCause: "subtype이 base precondition을 강화했습니다.", checks: ["interface의 valid input 범위를 적습니다.", "모든 implementations에 같은 boundary suite를 실행합니다.", "unchecked exception 조건을 비교합니다."], fix: "base valid inputs를 모두 받아들이거나 별도의 더 제한된 type/operation으로 모델링합니다.", prevention: "implementation-parameterized contract tests를 CI에 둡니다." },
        { symptom: "caller가 provider별 null/receipt 상태를 다르게 처리한다.", likelyCause: "postcondition/failure semantics가 공통 contract에 없거나 구현별로 약화됐습니다.", checks: ["receipt non-null·amount·approved invariant를 확인합니다.", "provider branches를 검색합니다.", "timeout/decline/error taxonomy를 비교합니다."], fix: "공통 result algebra와 postconditions를 정의하고 모든 provider adapters가 변환하게 합니다.", prevention: "provider-specific protocol을 domain PaymentResult로 normalize합니다." },
      ],
      expertNotes: ["LSP는 테스트 몇 개로 완전 증명되지는 않지만 shared contract suite가 명백한 drift와 regression을 잡는 실행 가능한 최소선입니다.", "performance·resource consumption도 client의 실질적 가정일 수 있으므로 unbounded latency/memory를 가진 subtype이 운영상 substitutable하지 않을 수 있습니다."],
    },
    {
      id: "sealed-hierarchy-exhaustive-polymorphism",
      title: "sealed hierarchy는 허용 subtype을 닫아 exhaustive pattern 처리를 돕지만 외부 확장 가능성을 의도적으로 포기합니다",
      lead: "모든 다형성 계층이 open extension이어야 하는 것은 아니며 domain cases가 닫혀 있을 때 compiler 도움을 더 받을 수 있습니다.",
      explanations: [
        "sealed class/interface는 direct permitted subclasses를 선언하거나 같은 compilation unit/module 규칙 아래 한정합니다. permitted subtype은 final, sealed, non-sealed 중 하나로 자신의 다음 확장 정책을 명시합니다.",
        "JDK21의 pattern switch는 sealed hierarchy의 알려진 cases를 exhaustively 처리할 수 있습니다. 새 permitted subtype을 추가하면 누락된 switch가 compile failure로 드러나 중앙 operation의 업데이트 지점을 찾는 데 도움이 됩니다.",
        "반면 Payment provider를 제3자가 plugin으로 추가해야 한다면 sealed root는 외부 확장을 막습니다. 그 경우 open interface+registry+capability/version 검증이 더 적합할 수 있습니다.",
        "sealed는 behavior contract를 자동 보장하지 않습니다. Card/Kakao가 LSP pre/postconditions를 지키는지는 여전히 shared contract suite가 필요합니다.",
        "switch pattern은 null을 자동 case로 처리하지 않습니다. receiver non-null invariant를 유지하거나 명시 case null/default policy를 설계합니다. 이 예제는 method 입구에서 null을 거부합니다.",
        "reflection의 getPermittedSubclasses는 구조 evidence를 제공하지만 subtype 순서를 API contract로 가정하지 않습니다. count와 set으로 검증합니다.",
      ],
      concepts: [
        { term: "sealed type", definition: "직접 확장/구현할 수 있는 subtype 집합을 제한하는 class 또는 interface입니다.", detail: ["permits 목록을 가집니다.", "domain closure를 표현합니다."] },
        { term: "exhaustive pattern switch", definition: "selector type의 가능한 cases를 compiler가 모두 처리했다고 확인할 수 있는 switch expression입니다.", detail: ["sealed cases와 잘 맞습니다.", "새 subtype이 compile feedback을 만듭니다."] },
        { term: "open extension trade-off", definition: "외부 subtype 추가 가능성과 중앙 exhaustive reasoning 사이의 선택입니다.", detail: ["plugin API는 open이 유리할 수 있습니다.", "closed domain은 sealed가 유리합니다."] },
      ],
      codeExamples: [{
        id: "java-sealed-payment-switch",
        title: "Card·Kakao 두 permitted types를 JDK21 pattern switch로 빠짐없이 처리합니다",
        language: "java",
        filename: "SealedPaymentSwitchLab.java",
        purpose: "sealed structure, exhaustive switch, permitted subtype count를 compile/runtime 계약으로 확인합니다.",
        code: String.raw`import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public class SealedPaymentSwitchLab {
    sealed interface PaymentMethod permits CardPayment, KakaoPayment {}
    record CardPayment(String code) implements PaymentMethod {}
    record KakaoPayment(String code) implements PaymentMethod {}

    static String route(PaymentMethod method) {
        if (method == null) throw new IllegalArgumentException("method required");
        return switch (method) {
            case CardPayment card -> "card:" + card.code();
            case KakaoPayment kakao -> "kakao:" + kakao.code();
        };
    }

    public static void main(String[] args) {
        System.out.println(route(new CardPayment("C")));
        System.out.println(route(new KakaoPayment("K")));
        Set<String> names = Arrays.stream(PaymentMethod.class.getPermittedSubclasses())
                .map(Class::getSimpleName).collect(Collectors.toSet());
        System.out.println("types=" + names.size());
        System.out.println("complete=" + names.equals(Set.of("CardPayment", "KakaoPayment")));
    }
}`,
        walkthrough: [
          { lines: "6-8", explanation: "sealed root와 두 final-by-record permitted implementations를 선언합니다." },
          { lines: "10-16", explanation: "non-null boundary 뒤 두 patterns만으로 value를 반환하는 exhaustive switch입니다." },
          { lines: "19-24", explanation: "두 routes와 reflection permitted subtype set을 순서 비의존으로 검증합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("SealedPaymentSwitchLab.java", "SealedPaymentSwitchLab") },
        output: { value: "card:C\nkakao:K\ntypes=2\ncomplete=true", explanation: ["switch가 runtime subtype의 record component를 안전하게 binding합니다.", "permitted subtype set은 정확히 CardPayment/KakaoPayment 두 개입니다."] },
        experiments: [
          { change: "permits에 BankPayment를 추가하고 `record BankPayment(String code) implements PaymentMethod {}`도 선언하되 switch case만 추가하지 않습니다.", prediction: "BankPayment symbol은 정상 해석되고 switch expression만 모든 가능한 입력값을 다루지 못했다는 compile error로 실패합니다.", result: "새 closed-domain case가 중앙 exhaustive operation을 갱신하게 하며, missing-symbol 같은 엉뚱한 실패를 exhaustiveness evidence로 오인하지 않습니다." },
          { change: "PaymentMethod를 일반 interface로 바꿉니다.", prediction: "default 없는 두-case switch는 exhaustive하지 않아 compile되지 않습니다.", result: "open hierarchy에서는 unknown future subtype 처리가 필요합니다." },
          { change: "KakaoPayment를 `non-sealed class`로 바꾸면서 동일한 String constructor, private final code field, code() accessor를 그대로 제공합니다.", prediction: "기존 main과 Kakao pattern branch는 계속 compile·실행되고 KakaoPayment 아래 외부 subtype도 그 branch에 포함됩니다.", result: "record를 class로 바꿀 때 기존 construction/access surface를 함께 보존해야 확장 정책 하나만 비교할 수 있습니다." },
        ],
        sourceRefs: ["jls-sealed-interfaces", "jls-sealed-classes", "jls-pattern-switch", "java-class-permitted-subclasses", "java-class04-ex20", "java-class04-ex21"],
      }],
      diagnostics: [
        { symptom: "새 sealed subtype 추가 뒤 기존 switch가 compile되지 않는다.", likelyCause: "기존 exhaustive cases가 새 domain case를 처리하지 않습니다.", checks: ["permits 목록 diff를 봅니다.", "모든 pattern switches를 찾습니다.", "새 case의 result/failure 의미를 정의합니다."], fix: "각 exhaustive operation에 새 subtype case를 추가하고 contract tests를 확장합니다.", prevention: "sealed subtype 추가를 domain-wide breaking review로 다룹니다." },
        { symptom: "외부 plugin이 PaymentMethod를 구현할 수 없다.", likelyCause: "sealed root가 permitted hierarchy 밖 구현을 의도적으로 막습니다.", checks: ["plugin extension requirement를 확인합니다.", "module/package 위치를 봅니다.", "non-sealed extension point가 있는지 봅니다."], fix: "open plugin interface를 별도로 두거나 permits 정책을 재설계합니다.", prevention: "closed domain과 third-party SPI를 한 root type으로 섞지 않습니다." },
      ],
      comparisons: [{ title: "계층 개방성 선택", options: [
        { name: "sealed hierarchy", chooseWhen: "domain cases가 소유 코드 안에서 닫혀 있고 exhaustive operations가 중요할 때", avoidWhen: "third-party subtype/plugin이 핵심일 때", tradeoffs: ["compiler exhaustiveness", "외부 확장 제한"] },
        { name: "open interface", chooseWhen: "독립 providers가 구현을 추가해야 할 때", avoidWhen: "모든 cases를 중앙에서 완전 분석해야 할 때", tradeoffs: ["확장 유연", "unknown subtype policy"] },
        { name: "sealed core+open adapter", chooseWhen: "내부 domain result는 닫고 외부 provider integration은 열어야 할 때", avoidWhen: "변환 계층 비용이 불필요할 때", tradeoffs: ["경계 분리", "mapping 유지"] },
      ] }],
      expertNotes: ["sealed exhaustive switch가 domain evolution의 compile feedback을 주지만 다른 modules에 이미 compile된 clients의 binary/source migration 계획은 별도로 필요합니다.", "serialization/deserialization allowlist와 sealed permits는 관련될 수 있지만 permits만으로 untrusted payload validation이 완성되지는 않습니다."],
    },
    {
      id: "bridge-method-and-constructor-dispatch-traps",
      title: "generic covariant override의 synthetic bridge와 constructor 중 virtual call의 부분 초기화 위험을 runtime shape로 확인합니다",
      lead: "source에 한 override만 보여도 compiler가 dispatch 호환을 위한 bridge를 만들 수 있고, virtual call은 construction 중에도 작동합니다.",
      explanations: [
        "generic `Box<T>.value()`를 `TextBox extends Box<String>`가 String으로 override하면 type erasure 뒤 parent descriptor는 Object value()입니다. compiler는 erased caller와 String body를 연결하는 synthetic bridge Object value()를 만들 수 있습니다.",
        "reflection이나 framework가 declared methods를 셀 때 source에 없는 bridge/synthetic method를 볼 수 있습니다. name만으로 하나라고 가정하지 말고 isBridge/isSynthetic와 parameter/return types를 함께 봅니다.",
        "bridge는 compiler implementation detail이지만 Java language의 override·binary invocation 호환을 지탱합니다. unchecked raw types를 섞으면 bridge 안 cast에서 runtime failure가 나타날 수도 있어 generic warnings를 무시하지 않습니다.",
        "또 다른 함정은 superclass constructor가 overridable instance method를 호출하는 것입니다. dynamic dispatch는 subclass field initializer 전에도 subclass body로 가므로 override가 null/default state를 관찰할 수 있습니다.",
        "예제 RiskBase constructor는 describe()를 호출하고 RiskChild override는 아직 초기화되지 않은 state를 반환해 constructorSaw=null을 저장합니다. construction 완료 뒤 같은 method는 ready를 반환합니다.",
        "constructor에서 virtual call, callback registration, thread start를 피하고 완성 뒤 factory/lifecycle method에서 polymorphism을 시작합니다. final/private method는 override되지 않지만 외부 호출·this escape 위험도 함께 검토합니다.",
      ],
      concepts: [
        { term: "bridge method", definition: "generic erasure와 override dispatch 호환을 위해 compiler가 생성할 수 있는 synthetic forwarding method입니다.", detail: ["isBridge=true입니다.", "source method와 함께 reflection에 보입니다."] },
        { term: "type erasure", definition: "대부분의 generic type parameter가 runtime descriptor에서 upper bound/Object 형태로 지워지는 Java 구현 모델입니다.", detail: ["Box<T>.value는 Object descriptor가 됩니다.", "bridge가 String override를 연결합니다."] },
        { term: "constructor virtual dispatch", definition: "superclass construction 중 overridable instance call도 실제 subclass body로 dispatch되는 현상입니다.", detail: ["subclass fields는 아직 default일 수 있습니다.", "완성 전 this 노출 위험입니다."] },
      ],
      codeExamples: [{
        id: "java-bridge-and-constructor-dispatch",
        title: "String direct+Object bridge 두 methods와 constructorSaw null을 함께 검증합니다",
        language: "java",
        filename: "BridgeAndConstructorDispatchLab.java",
        purpose: "source override와 compiler-generated bridge shape, superclass constructor의 premature subclass dispatch를 deterministic evidence로 만듭니다.",
        code: String.raw`import java.lang.reflect.Method;
import java.util.Arrays;

public class BridgeAndConstructorDispatchLab {
    static class Box<T> { T value() { return null; } }
    static final class TextBox extends Box<String> {
        @Override String value() { return "text"; }
    }

    static class RiskBase {
        final String constructorSaw;
        RiskBase() { constructorSaw = describe(); }
        String describe() { return "base"; }
    }

    static final class RiskChild extends RiskBase {
        String state = "ready";
        @Override String describe() { return state; }
    }

    public static void main(String[] args) {
        Box<String> box = new TextBox();
        System.out.println("dispatch=" + box.value());
        Method direct = Arrays.stream(TextBox.class.getDeclaredMethods())
                .filter(method -> !method.isBridge()).findFirst().orElseThrow();
        Method bridge = Arrays.stream(TextBox.class.getDeclaredMethods())
                .filter(Method::isBridge).findFirst().orElseThrow();
        System.out.println("direct=" + direct.getReturnType().getSimpleName() + "," + direct.isBridge() + "," + direct.isSynthetic());
        System.out.println("bridge=" + bridge.getReturnType().getSimpleName() + "," + bridge.isBridge() + "," + bridge.isSynthetic());

        RiskChild child = new RiskChild();
        System.out.println("constructorSaw=" + child.constructorSaw);
        System.out.println("after=" + child.describe());
    }
}`,
        walkthrough: [
          { lines: "5-8", explanation: "generic parent value와 String covariant override가 bridge generation 조건을 만듭니다." },
          { lines: "10-19", explanation: "base constructor가 virtual describe를 호출하고 child state initializer는 그 뒤 실행됩니다." },
          { lines: "22-29", explanation: "generic parent surface 호출과 direct/bridge reflection shape를 명시 filters로 분리합니다." },
          { lines: "31-33", explanation: "construction 중 null 관찰과 완료 뒤 ready를 같은 object에서 비교합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("BridgeAndConstructorDispatchLab.java", "BridgeAndConstructorDispatchLab") },
        output: { value: "dispatch=text\ndirect=String,false,false\nbridge=Object,true,true\nconstructorSaw=null\nafter=ready", explanation: ["Box<String> call은 TextBox String body로 dispatch됩니다.", "reflection에는 source direct method와 compiler-generated Object bridge가 함께 있습니다.", "base constructor 시점에는 child state가 default null이고 완료 뒤 ready입니다."] },
        experiments: [
          { change: "TextBox override를 제거합니다.", prediction: "dispatch=null이고 bridge method를 찾지 못해 orElseThrow가 실패합니다.", result: "bridge는 해당 generic override 연결을 위해 생성됩니다." },
          { change: "RiskBase.describe를 final로 바꾸고 RiskChild의 override를 제거한 runnable variant를 만듭니다.", prediction: "constructorSaw=base와 after=base가 출력되고 override compile error는 남지 않습니다.", result: "variation을 닫으면 construction-time subclass dispatch를 막지만 subclass별 describe 확장도 함께 포기합니다." },
          { change: "RiskBase의 final constructorSaw field와 constructor 안 virtual call을 제거하고 factory가 `new RiskChild()` 완료 뒤 별도 local `factorySaw = child.describe()`를 기록하게 합니다.", prediction: "factorySaw=ready와 after=ready가 출력됩니다.", result: "final field를 생성 뒤 재대입하려 하지 않고 관찰 책임을 완성 이후 단계로 옮겨 partial-state observation을 피합니다." },
        ],
        sourceRefs: ["jls-type-erasure", "jls-bridge-methods", "jls-runtime-method-lookup", "jls-instance-creation", "java-reflection-method"],
      }],
      diagnostics: [
        { symptom: "reflection에서 source보다 override method가 하나 더 보인다.", likelyCause: "generic erasure 호환을 위한 synthetic bridge method입니다.", checks: ["isBridge와 isSynthetic을 봅니다.", "return/parameter descriptors를 비교합니다.", "generic superclass signature를 확인합니다."], fix: "framework method selection에서 bridge/synthetic 여부와 most-specific user declaration을 처리합니다.", prevention: "reflection tests가 단순 name count에 의존하지 않게 합니다." },
        { symptom: "subclass field가 initializer로 ready인데 base constructor에서 null이 관찰된다.", likelyCause: "base constructor의 overridable call이 subclass initializer 전에 subclass body로 dispatch됐습니다.", checks: ["constructor call graph를 봅니다.", "overridable methods/callbacks를 찾습니다.", "subclass initialization 순서를 적습니다."], fix: "virtual call을 construction 완료 뒤 lifecycle/factory 단계로 옮깁니다.", prevention: "constructors에서 overridable method·callback·thread start를 금지합니다." },
      ],
      expertNotes: ["bridge method 존재와 정확한 bytecode shape는 compiler가 language semantics를 구현하는 방식이지만 Java reflection API가 isBridge/isSynthetic를 공식 노출하므로 frameworks는 이를 고려해야 합니다.", "JIT devirtualization 성능을 이유로 hierarchy를 미리 왜곡하지 말고 profiling evidence와 semantic design을 우선합니다."],
    },
    {
      id: "override-negative-compiler-contract-suite",
      title: "access·throws·return·final·@Override·static clash를 exactly-one-error compiler fixtures로 고정합니다",
      lead: "틀린 override 예제를 주석으로만 보여 주지 않고 OpenJDK21 source line과 diagnostic code까지 검증합니다.",
      explanations: [
        "negative sources는 production tree에 invalid .java로 저장하지 않습니다. SimpleJavaFileObject memory source를 fixture별 dedicated temp output으로 compile해 expected failure가 정상 build를 오염시키지 않게 합니다.",
        "weakerAccess는 public을 protected로 좁혀 호출 가능성을 깨고, broaderThrows는 부모에 없는 IOException을 추가하며, incompatibleReturn은 Number 대신 unrelated String을 반환합니다.",
        "finalOverride는 variation을 닫은 method를 재정의하려 하고, badOverride는 parameter가 달라 실제로는 overload인데 @Override 의도를 선언합니다. staticClash는 inherited instance method를 static으로 숨기려 해 instance/static 계약을 충돌시킵니다.",
        "각 fixture는 `ok=false`뿐 아니라 errors1·warnings0·1-based line·diagnostic code가 모두 일치해야 통과합니다. 엉뚱한 syntax error나 추가 warning으로 실패해도 suite는 거부합니다.",
        "diagnostic code는 JLS가 보장하는 vendor-neutral 문자열이 아니므로 OpenJDK21.0.11 regression contract로 pin합니다. JLS sources는 왜 거부되는지 설명하고 compiler code는 사용 toolchain의 자동 evidence를 제공합니다.",
        "모든 compiler tasks에 explicit `-d`를 주고 normalized system temp direct GUID child만 생성합니다. failed compile이 일부 class를 emit하더라도 repository에 남지 않고 finally에서 boundary 재검사 후 삭제됩니다.",
      ],
      concepts: [
        { term: "intent fixture", definition: "한 source가 한 override 규칙만 위반하도록 최소화한 negative test case입니다.", detail: ["exactly one error를 기대합니다.", "line/code가 원인을 고정합니다."] },
        { term: "toolchain-pinned diagnostic", definition: "특정 JDK vendor/version의 structured compiler code를 regression expectation으로 사용하는 계약입니다.", detail: ["JLS portable rule과 구분합니다.", "upgrade 시 review합니다."] },
        { term: "partial-output isolation", definition: "실패 compilation이 생성할 수 있는 artifacts도 명시 temp -d 아래에 가두는 원칙입니다.", detail: ["fixture별 output을 씁니다.", "finally cleanup합니다."] },
      ],
      codeExamples: [{
        id: "java-override-negative-compiler-suite",
        title: "여섯 override 위반을 line·code·errors1·warnings0으로 거부하고 cleanup합니다",
        language: "java",
        filename: "OverrideNegativeCompilerSuite.java",
        purpose: "override 문법 계약의 대표 실패를 in-memory OpenJDK21 tasks로 재현하고 wrong-reason failure와 artifact leakage를 막습니다.",
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

public class OverrideNegativeCompilerSuite {
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
        var errors = diagnostics.getDiagnostics().stream()
                .filter(item -> item.getKind() == Diagnostic.Kind.ERROR).toList();
        long warnings = diagnostics.getDiagnostics().stream()
                .filter(item -> item.getKind() == Diagnostic.Kind.WARNING
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
        Path root = base.resolve("override-negative-" + UUID.randomUUID()).normalize();
        if (!root.getParent().equals(base) || Files.exists(root)) throw new IllegalStateException("unsafe root");
        Files.createDirectory(root);
        try {
            Path classes = Files.createDirectory(root.resolve("classes"));
            List<Fixture> fixtures = List.of(
                new Fixture("weakerAccess", String.join("\n",
                    "class Parent { public void run() {} }",
                    "class Child extends Parent {",
                    "  @Override protected void run() {}",
                    "}"), 3, "compiler.err.override.weaker.access"),
                new Fixture("broaderThrows", String.join("\n",
                    "import java.io.IOException;",
                    "class Parent { void run() {} }",
                    "class Child extends Parent {",
                    "  @Override void run() throws IOException {}",
                    "}"), 4, "compiler.err.override.meth.doesnt.throw"),
                new Fixture("incompatibleReturn", String.join("\n",
                    "class Parent { Number value() { return 1; } }",
                    "class Child extends Parent {",
                    "  String value() { return \"x\"; }",
                    "}"), 3, "compiler.err.override.incompatible.ret"),
                new Fixture("finalOverride", String.join("\n",
                    "class Parent { final void run() {} }",
                    "class Child extends Parent {",
                    "  @Override void run() {}",
                    "}"), 3, "compiler.err.override.meth"),
                new Fixture("badOverride", String.join("\n",
                    "class Parent { void run(int value) {} }",
                    "class Child extends Parent {",
                    "  @Override void run() {}",
                    "}"), 3, "compiler.err.method.does.not.override.superclass"),
                new Fixture("staticClash", String.join("\n",
                    "class Parent { void run() {} }",
                    "class Child extends Parent {",
                    "  static void run() {}",
                    "}"), 3, "compiler.err.override.static")
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
          { lines: "14-24", explanation: "in-memory source와 expected line/code fixtures를 정의합니다." },
          { lines: "26-41", explanation: "fixture별 temp -d, JDK21/Xlint options, structured error/warning counts를 수집합니다." },
          { lines: "43-48", explanation: "GUID tree만 reverse path order로 제거하는 helper입니다." },
          { lines: "50-57", explanation: "full JDK와 normalized system temp direct-child boundary를 생성 전에 검사합니다." },
          { lines: "59-88", explanation: "access·throws·return·final·annotation intent·static/instance 여섯 위반을 한 source당 하나로 고정합니다." },
          { lines: "90-100", explanation: "errors1·warnings0·line/code를 assertion하고 여섯 checks를 출력합니다." },
          { lines: "101-107", explanation: "finally에서 boundary 재검사와 cleanup=true를 보장합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11 full JDK", "OS temporary directory write permission"], command: isolatedJavaRun("OverrideNegativeCompilerSuite.java", "OverrideNegativeCompilerSuite") },
        output: { value: "weakerAccess=false,line=3,code=compiler.err.override.weaker.access\nbroaderThrows=false,line=4,code=compiler.err.override.meth.doesnt.throw\nincompatibleReturn=false,line=3,code=compiler.err.override.incompatible.ret\nfinalOverride=false,line=3,code=compiler.err.override.meth\nbadOverride=false,line=3,code=compiler.err.method.does.not.override.superclass\nstaticClash=false,line=3,code=compiler.err.override.static\nchecks=6\ncleanup=true", explanation: ["각 fixture가 exactly one intended OpenJDK21 error와 zero warnings로 실패합니다.", "비슷한 override errors도 fixture name·line·code로 독립 구분합니다.", "partial outputs를 포함한 GUID root가 제거되어 cleanup=true입니다."] },
        experiments: [
          { change: "weakerAccess를 public으로 바꿉니다.", prediction: "해당 fixture가 compile 성공해 expected-failure assertion이 실패합니다.", result: "access contract를 복원했습니다." },
          { change: "broaderThrows의 IOException을 제거합니다.", prediction: "fixture가 compile 성공합니다.", result: "checked failure obligation 확장이 사라집니다." },
          { change: "staticClash의 Parent.run도 static으로 바꿉니다.", prediction: "valid static hiding이 되어 fixture가 성공합니다.", result: "static-static hiding과 instance-static clash를 구분합니다." },
        ],
        sourceRefs: ["jdk21-javac", "java-compiler-api", "java-diagnostic-api", "java-files-api", "java-uuid-api", "jls-overriding", "jls-return-type-substitutability", "jls-override-throws", "jls-final-method", "jls-static-hiding", "java-override-annotation"],
      }],
      diagnostics: [
        { symptom: "negative suite가 실패했지만 errors가2개이고 첫 code만 우연히 맞는다.", likelyCause: "fixture에 독립 invalid constructs를 여러 개 넣거나 errors1을 검사하지 않았습니다.", checks: ["모든 ERROR diagnostics를 셉니다.", "각 source line을 봅니다.", "한 규칙만 남깁니다."], fix: "fixture를 분리하고 errors1·warnings0을 강제합니다.", prevention: "wrong-reason failure를 허용하지 않는 structured assertion을 사용합니다." },
        { symptom: "suite 뒤 Parent.class 같은 artifact가 repository에 남는다.", likelyCause: "failed compiler task에도 -d가 없거나 cleanup boundary가 잘못됐습니다.", checks: ["task options의 -d를 봅니다.", "output parent를 확인합니다.", "finally와 existence assertion을 봅니다."], fix: "fixture별 temp output과 direct-child GUID cleanup을 강제합니다.", prevention: "검증 전후 repository .class residue0을 확인합니다." },
      ],
      expertNotes: ["diagnostic code가 변경되는 JDK upgrade에서는 언어 규칙이 바뀐 것인지 compiler 내부 naming만 바뀐 것인지 JLS와 release notes를 함께 검토합니다.", "annotation processing을 끄고 source/target을 --release21로 고정해 외부 processors와 host JDK API drift가 negative result를 오염시키지 않게 합니다."],
    },
  ],
  lab: {
    title: "동물 선택과 결제 provider를 null 분기에서 행동 계약이 검증된 다형성 설계로 전환합니다",
    scenario: "학습 포털은 사용자가 선택한 동물의 sound/like를 보여 주고 주문마다 Card 또는 Kakao 결제를 수행합니다. 기존 코드는 choice가 유효하지 않으면 null receiver를 호출하고 provider 분기가 main에 섞여 있으며, override가 signature만 맞으면 안전하다고 가정합니다. 원본 Ex15~22의 정상/실패 evidence를 보존하면서 factory, strategy injection, shared behavioral contracts, sealed/open extension decision과 negative compiler suite까지 한 subsystem에 적용합니다.",
    setup: [
      "OpenJDK21.0.11 full JDK와 PowerShell7+를 사용하고 original-process, production, runtime-contract, behavioral-contract, compiler-contract를 분리합니다.",
      "class04 전체26 package smoke와 direct6+companion2 범위8을 서로 다른 temp classes에 compile해 package warning1/scope warning0을 기록합니다.",
      "Animal/Cat/Dog, AnimalFactory, PaymentMethod/Card/Kakao, Checkout, PaymentRegistry, Receipt 역할과 compile-time surface를 먼저 적습니다.",
      "원본 output의 `결재`는 provenance에서 유지하고 새 domain messages와 tests는 `결제`로 교정합니다.",
      "모든 compiler tasks는 `--release 21 -proc:none -encoding UTF-8 -Xlint:all -d`와 normalized system temp direct GUID child를 사용합니다.",
    ],
    steps: [
      "ProcessStartInfo로 Ex18 input1·2·9와 Ex22를 실행하고 stdin/stdout/stderr/exit를 exact strings로 검사합니다.",
      "input1의 parentSound→catSound→like와 input2의 dogSound→like 차이를 super augmentation/replacement로 설명합니다.",
      "input9의 prompt-only stdout, exit1, NPE enhanced message, Ex18_Main.java:28 stack line을 failure golden으로 남깁니다.",
      "Cat/Dog override declarations에 @Override를 붙이고 return/access/checked-throws 방향을 reflection과 compiler로 확인합니다.",
      "한 Cat new 뒤 Cat/Animal references가 ==임을 확인하고 Animal surface에서 sound/like만 호출 가능함을 positive/negative contracts로 나눕니다.",
      "field/static hiding과 instance method dispatch를 같은 Child object에서 reference/class qualification별로 비교합니다.",
      "AnimalFactory가 choice1/2를 Optional<Animal>, choice9를 empty로 반환하게 해 null receiver state를 제거합니다.",
      "subtype-specific 기능이 필요한 한 지점은 pattern instanceof로 좁히고 Dog→Cat invalid cast를 ClassCastException contract로 격리합니다.",
      "PaymentRegistry가 allowlisted key를 Supplier<PaymentMethod>로 변환하고 Checkout은 constructor-injected interface만 받게 합니다.",
      "Card/Kakao 5000·5000·5200 flow를 교정된 `결제` output으로 실행하고 unknown provider와 non-positive amount를 boundary에서 거부합니다.",
      "모든 Payment implementations에 positive1·5000, approved true, matching amount 공통 contract suite를 적용합니다.",
      "minimum1000 구현이 signature는 맞지만 base-valid1을 거부해 LSP contract violation으로 탐지되는지 확인합니다.",
      "provider set이 내부 closed domain인지 third-party SPI인지 결정하고 sealed+exhaustive switch 또는 open registry를 선택합니다.",
      "generic Box<String> override의 direct/bridge reflection shape와 base constructor virtual call의 null observation을 검사합니다.",
      "weaker access·broader checked throws·incompatible return·final override·bad @Override·static clash를 fixture별 exactly one diagnostic으로 검증합니다.",
      "마지막 report에 original exact, Java exact outputs, structure, LSP, negative diagnostics, privacy, temp cleanup, repository .class residue0을 함께 기록합니다.",
    ],
    expectedResult: [
      "package26은 범위 밖 SVUID warning1, scope8은 warning0·mains2·compileOnly6으로 정확히 분리됩니다.",
      "Ex18 inputs1/2는 exit0·stderr empty이며 Cat3 lines와 Dog2 lines sequence가 원본과 같습니다.",
      "Ex18 input9는 prompt-only stdout·exit1·stderr2 lines NPE/line28이고 이를 정상 polymorphism 결과로 오해하지 않습니다.",
      "Ex22는 raw8 lines·blank2·Kakao blocks2·amounts5000|5000|5200·legacy `결재`4 occurrences입니다.",
      "upcast 전후 reference identity는 같고 common instance calls는 runtime override body로 dispatch됩니다.",
      "field/static hiding은 compile-time qualification, instance override는 runtime receiver로 선택됨이 exact output과 일치합니다.",
      "invalid animal/provider selection은 null/NPE가 아니라 Optional/result failure로 종료됩니다.",
      "Card/Kakao strategies는 caller branch 없이 교정된 결제 output을 반환하고 shared LSP suite를 통과합니다.",
      "behaviorally invalid MinimumPayment는 compiler가 아니라 shared contract test에서 탐지됩니다.",
      "sealed case set과 pattern switch가 일치하고 bridge=true/Object method와 construction-time null 위험이 구조 evidence로 남습니다.",
      "여섯 negative fixtures는 errors1·warnings0·expected line/code로 실패하고 cleanup=true입니다.",
      "공개 code/output/evidence에 실제 개인정보·credential·로컬 절대 경로·비결정적 identity hash가 없습니다.",
    ],
    cleanup: [
      "resolved root parent가 normalized system temp와 같은지 확인한 뒤 각 GUID root만 reverse-order로 제거합니다.",
      "process/compiler source·classes·reports가 남지 않았는지 확인하고 repository의 새 .class files가0인지 검사합니다.",
      "javastudy2 원본은 read-only evidence로 유지하고 legacy spelling이나 failure를 고치기 위해 수정하지 않습니다.",
    ],
    extensions: [
      "Animal selection을 sealed result Success/InvalidSyntax/UnsupportedChoice로 확장해 parsing과 domain failure를 분리합니다.",
      "PaymentResult를 Approved/Declined/UnknownOutcome sealed hierarchy로 만들고 idempotency·retry/reconciliation contract를 추가합니다.",
      "open provider SPI에 signed allowlist·version negotiation·capability permissions를 추가하고 sealed domain result로 normalize합니다.",
      "JMH로 monomorphic/polymorphic call sites를 측정하되 성능 결과가 abstraction의 행동 의미를 바꾸는 근거가 아님을 명시합니다.",
      "mutation testing으로 contract verifier의 amount/approved assertions를 제거했을 때 tests가 실패하는지 확인합니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "Ex15~18을 privacy-safe Animal markers로 재구성하고 input1·2·9의 정상/실패 process contracts와 null-free factory를 구현하세요.", requirements: ["Cat은 parent sound 뒤 cat sound를, Dog은 dog sound만 반환합니다.", "upcast identity same과 common sound/like dispatch를 assertion합니다.", "input9 원본은 prompt-only/exit1/NPE line28로 감사하고 새 factory에서는 invalid result로 종료합니다.", "Animal reference에서 Cat-only play 직접 호출이 compile 실패하는 negative fixture를 별도로 둡니다."], hints: ["원본 failure를 없던 일로 하지 말고 provenance와 개선 예제를 분리하세요.", "new 수와 reference 수를 따로 세세요."], expectedOutcome: "compile-time surface/runtime body/invalid selection이 세 독립 계약으로 설명되고 null receiver가 사라집니다.", solutionOutline: ["process audit", "override markers", "identity test", "Optional factory", "surface negative test"] },
    { difficulty: "응용", prompt: "Ex19~22를 constructor-injected Payment strategy와 shared LSP contract suite로 리팩터링하세요.", requirements: ["Card/Kakao 구현은 공통 PaymentMethod와 Receipt contract를 사용합니다.", "Checkout은 non-null strategy와 positive amount를 construction/operation boundary에서 검증합니다.", "allowlisted registry는 unknown key를 null 대신 명시 failure로 반환합니다.", "positive boundary inputs와 receipt invariants를 모든 implementations에 반복 적용합니다.", "원본 audit은 결재를 보존하고 새 output은 결제로 교정합니다."], hints: ["provider 선택과 결제 실행을 서로 다른 책임으로 두세요.", "signature 일치 외에 caller가 믿는 postcondition을 적으세요."], expectedOutcome: "caller가 concrete provider와 분기를 몰라도 되며 새로운 implementation의 행동 호환성을 같은 suite로 판정합니다.", solutionOutline: ["interface contract", "provider adapters", "registry", "Checkout injection", "parameterized contract tests"] },
    { difficulty: "설계", prompt: "closed domain과 third-party plugins가 함께 있는 결제 architecture의 다형성·보안·진화 경계를 설계하세요.", requirements: ["외부 provider SPI는 open interface/registry로, 내부 PaymentResult는 sealed hierarchy로 분리하는 대안을 평가합니다.", "pre/post/failure/idempotency/resource contracts와 LSP tests를 작성합니다.", "unchecked cast와 reflection class-name loading 없이 allowlisted supplier를 사용합니다.", "generic bridge/reflection filtering과 constructor virtual-call 금지 규칙을 framework integration에 반영합니다.", "positive runtime·structure·behavior·negative compile·process channels·privacy suites를 CI 단계로 나눕니다."], hints: ["확장 가능한 대상과 exhaustive해야 하는 대상을 같은 type hierarchy로 묶지 마세요.", "결제 timeout은 실패/성공을 모르는 상태일 수 있어 단순 exception으로 축약하지 마세요."], expectedOutcome: "언어 다형성뿐 아니라 외부 확장, domain exhaustiveness, 운영 failure, trust boundary까지 책임이 분리된 설계가 완성됩니다.", solutionOutline: ["boundary map", "open SPI", "sealed result", "behavioral algebra", "verification matrix"] },
  ],
  reviewQuestions: [
    { question: "method 이름이 같으면 항상 overriding인가요?", answer: "아닙니다. override-equivalent signature/subsignature와 상속·접근 관계를 만족해야 하며 parameter가 다르면 overload일 수 있습니다." },
    { question: "override return type은 어떻게 바꿀 수 있나요?", answer: "동일하거나 return-type-substitutable한 covariant reference subtype으로 좁힐 수 있지만 unrelated type으로 바꿀 수 없습니다." },
    { question: "public parent method를 protected로 override할 수 있나요?", answer: "안 됩니다. overriding method가 inherited method보다 접근을 좁혀 base caller의 호출 가능성을 깨면 compiler가 거부합니다." },
    { question: "override에서 checked exception을 더 넓게 추가할 수 있나요?", answer: "안 됩니다. 부모가 허용한 checked exception과 같거나 subtype으로 좁히거나 제거할 수 있지만 caller obligation을 확장할 수 없습니다." },
    { question: "@Override를 왜 항상 붙이는 것이 좋은가요?", answer: "오타·parameter drift로 새 overload를 만든 실수를 compiler가 override 의도 불일치로 즉시 잡기 때문입니다." },
    { question: "Cat.sound와 Dog.sound는 parent body를 같은 방식으로 사용하나요?", answer: "아닙니다. Cat은 super.sound 뒤 behavior를 추가하고 Dog은 parent body를 호출하지 않고 완전히 대체합니다." },
    { question: "super.sound()는 별도 부모 객체를 호출하나요?", answer: "아닙니다. 같은 receiver에서 direct superclass implementation을 선택하며 새 객체나 다른 identity가 생기지 않습니다." },
    { question: "Animal animal = cat 업캐스트에서 객체가 새로 만들어지나요?", answer: "아닙니다. new는 Cat 생성 한 번이고 두 variables가 같은 object를 다른 static type view로 가리켜 ==가 true입니다." },
    { question: "reference의 compile-time type은 무엇을 결정하나요?", answer: "compiler가 접근 가능한 member surface와 overload/field/static selection 등을 결정합니다." },
    { question: "runtime class는 무엇을 결정하나요?", answer: "유효한 overridden instance method call에서 실행할 가장 구체적인 body를 dynamic dispatch로 결정합니다." },
    { question: "Animal reference가 실제 Cat이면 animal.play()가 가능한가요?", answer: "compile-time Animal surface에 play가 없으므로 직접 호출할 수 없습니다. common contract로 승격하거나 안전한 narrowing이 필요합니다." },
    { question: "field hiding도 runtime receiver로 선택되나요?", answer: "아닙니다. field access는 expression의 compile-time type으로 선언 field가 선택되며 같은 object에 parent/child storage가 공존할 수 있습니다." },
    { question: "static method hiding과 instance overriding의 차이는 무엇인가요?", answer: "static은 class/reference compile-time qualification으로 선택되고 instance override는 runtime receiver body로 dispatch됩니다." },
    { question: "cast는 object를 target type으로 바꾸나요?", answer: "아닙니다. reference view를 좁히며 실제 object가 target subtype이 아니면 ClassCastException입니다." },
    { question: "instanceof pattern에 null을 넣으면 어떻게 되나요?", answer: "false이며 exception이 아닙니다. 다만 null 허용 정책을 boundary에서 명시해야 합니다." },
    { question: "Ex18 input9의 root cause는 polymorphism 자체인가요?", answer: "아닙니다. unsupported choice가 receiver를 null로 남기고 call boundary까지 흘린 selection-state 결함입니다." },
    { question: "Optional factory가 해결하는 핵심은 무엇인가요?", answer: "valid object와 absence를 return type으로 구분해 null receiver가 common polymorphic call site에 도달하지 않게 합니다." },
    { question: "strategy와 dependency injection은 어떤 분리를 만드나요?", answer: "provider-specific behavior는 strategy에, provider 선택은 factory/registry에, common workflow는 injected interface를 받는 Checkout에 둡니다." },
    { question: "원본의 결재 표기를 왜 새 예제에서 결제로 바꾸나요?", answer: "source audit은 exact provenance로 결재를 보존하지만 새 사용자/도메인 문구는 올바른 결제 표기를 사용하고 교정 사실을 명시합니다." },
    { question: "override가 compiler를 통과하면 LSP도 만족하나요?", answer: "아닙니다. compiler는 문법 호환을 보지만 precondition·postcondition·invariant·failure 의미 같은 행동 계약은 별도로 검증해야 합니다." },
    { question: "precondition strengthening의 예는 무엇인가요?", answer: "base Payment가 모든 positive amount를 허용하는데 subtype만 minimum1000을 요구해 amount1을 거부하는 경우입니다." },
    { question: "sealed hierarchy는 언제 유리한가요?", answer: "domain cases가 소유 코드 안에서 닫혀 있고 pattern switch 등 exhaustive reasoning이 중요한 경우입니다." },
    { question: "sealed PaymentMethod가 third-party plugin에 항상 좋은가요?", answer: "아닙니다. 외부 구현 추가가 핵심이면 open SPI가 필요하며 sealed는 내부 closed result에 더 적합할 수 있습니다." },
    { question: "generic override에서 bridge method가 왜 생기나요?", answer: "type erasure 뒤 parent Object descriptor와 subtype String override invocation을 호환시키기 위해 compiler가 synthetic forwarding method를 만들 수 있습니다." },
    { question: "constructor에서 overridable method를 호출하면 왜 위험한가요?", answer: "subclass field initializer 전에 subclass body로 dispatch되어 default/null partial state를 관찰하거나 this가 완성 전에 노출될 수 있습니다." },
    { question: "negative compiler fixture는 무엇을 검사해야 하나요?", answer: "ok=false 외에 exactly one error, zero warnings, 기대 1-based line과 pinned diagnostic code, explicit temp -d와 cleanup을 검사해야 합니다." },
  ],
  completionChecklist: [
    "direct Ex15·16·17·19·20·21과 companions Ex18·22 범위8을 모두 읽었다.",
    "class04 package26과 scope8을 별도 temp -d에서 OpenJDK21 Xlint로 compile했다.",
    "package warning1이 범위 밖 Ex09_Sub SVUID이고 scope8 warning0임을 분리했다.",
    "scope8의 main2와 compile-only6 역할을 정확히 셌다.",
    "Ex18 input1의 prompt+parentSound, catSound, like 세 lines와 exit0/stderr empty를 exact 검증했다.",
    "Ex18 input2의 prompt+dogSound, like 두 lines와 exit0/stderr empty를 exact 검증했다.",
    "Ex18 input9의 prompt-only stdout·exit1·stderr NPE local3·line28을 exact 검증했다.",
    "Ex22 raw8 lines·blank2·Kakao blocks2·amounts5000|5000|5200을 exact 검증했다.",
    "원본 `결재` occurrences4는 provenance로 보존하고 새 합성 예제는 `결제`로 교정했다.",
    "override를 ‘부모 method를 마음대로 변경’이 아니라 언어/행동 계약으로 교정했다.",
    "override-equivalent signature와 overload를 구분했다.",
    "covariant return과 incompatible return을 positive/negative contracts로 확인했다.",
    "access widening/same은 허용되고 weaker access는 금지됨을 확인했다.",
    "checked throws 제거/narrowing과 broader throws 금지를 확인했다.",
    "override 의도에 @Override를 사용하고 bad signature를 compiler가 거부함을 확인했다.",
    "Cat super augmentation과 Dog replacement 결과를 각각 설명했다.",
    "super method call이 같은 receiver의 direct superclass implementation 선택임을 설명했다.",
    "upcast가 allocation/복사 없이 same identity를 유지함을 ==로 확인했다.",
    "compile-time member surface와 runtime dynamic dispatch 단계를 분리했다.",
    "Animal surface에서 Cat-only play 직접 호출이 불가능함을 설명했다.",
    "field hiding은 compile-time reference view, instance override는 runtime receiver로 선택됨을 확인했다.",
    "static method hiding을 class qualification으로 호출했다.",
    "valid downcast가 same identity이고 invalid Dog→Cat이 ClassCastException임을 확인했다.",
    "pattern instanceof가 null false이며 checked binding을 제공함을 확인했다.",
    "subtype branch 반복을 abstraction pressure 신호로 검토했다.",
    "Animal selection factory가 choice9를 null 대신 explicit absence로 반환하게 했다.",
    "parsing failure와 unsupported domain choice를 구분했다.",
    "Payment selection을 allowlisted registry로, execution을 strategy로 분리했다.",
    "Checkout이 non-null constructor-injected PaymentMethod만 받게 했다.",
    "unknown provider와 non-positive amount를 polymorphic call 전에 거부했다.",
    "Card/Kakao에 같은 LSP positive-input/receipt suite를 적용해 통과시켰다.",
    "MinimumPayment의 strengthened precondition을 행동 contract violation으로 탐지했다.",
    "문법 override와 behavioral substitutability를 구분했다.",
    "sealed hierarchy의 permits set과 exhaustive pattern switch를 JDK21에서 검증했다.",
    "closed domain과 open third-party SPI trade-off를 설명했다.",
    "generic override의 direct String method와 synthetic Object bridge를 reflection으로 구분했다.",
    "base constructor virtual call이 subclass initializer 전 null을 볼 수 있음을 확인했다.",
    "constructors에서 overridable call·callback·thread start를 피하는 규칙을 적용했다.",
    "여섯 negative compiler fixtures가 errors1·warnings0·기대 line/code에서 실패했다.",
    "모든 compiler/run artifacts를 direct GUID temp에 격리하고 boundary 검사 뒤 cleanup했다.",
    "공개 code/output/evidence에 개인정보·credential·로컬 절대 경로·identity hash가 없음을 확인했다.",
  ],
  nextSessions: [],
  sources: [
    { id: "java-class04-ex15", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex15_Animal.java", usedFor: ["Animal base surface", "sound/like inherited methods", "tail/leg fields"], evidence: "public sound가 `울음소리`, public like가 `좋아하는 행동`을 출력하고 Cat/Dog common surface가 되는 active base declaration을 확인했습니다." },
    { id: "java-class04-ex16", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex16_Dog.java", usedFor: ["Dog override replacement", "@Override evidence", "Dog-only play"], evidence: "Dog sound는 @Override를 사용해 parent body 없이 `멍~ 멍~`만 출력하며 play는 Animal surface에 없는 subtype-only method입니다." },
    { id: "java-class04-ex17", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex17_Cat.java", usedFor: ["Cat super augmentation", "override misconception correction", "Cat-only play"], evidence: "Cat sound는 super.sound 뒤 `야옹~ 야옹~`을 출력합니다. ‘부모 method를 가져와 마음대로 변경’ 주석은 언어/행동 계약으로 교정했습니다." },
    { id: "java-class04-ex18", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex18_Main.java", usedFor: ["Animal upcast", "input1/2 dynamic dispatch", "input9 null failure"], evidence: "choice1/2는 Animal reference에 Cat/Dog을 넣어 sound/like를 호출하고 choice9는 null을 line28에서 호출해 prompt-only stdout·exit1·NPE stderr를 만듭니다." },
    { id: "java-class04-ex19", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex19_Payment.java", usedFor: ["Payment base method", "amount parameter", "legacy spelling"], evidence: "base pay(int)는 amount와 `결재를 진행` 문구를 출력하며 Card/Kakao override surface의 기준입니다." },
    { id: "java-class04-ex20", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex20_CardPayment.java", usedFor: ["Card override", "approval sequence", "legacy spelling"], evidence: "Card pay는 승인 요청과 amount별 완료 두 lines를 출력하며 원본은 두 lines 모두 `결재` 표기를 사용합니다." },
    { id: "java-class04-ex21", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex21_KakaoPayment.java", usedFor: ["Kakao override", "server connection sequence", "legacy spelling"], evidence: "Kakao pay는 서버 연결과 amount별 완료 두 lines를 출력하며 완료 문구에 원본 `결재` 표기가 있습니다." },
    { id: "java-class04-ex22", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex22_Main.java", usedFor: ["Payment polymorphic calls", "choice branch", "5000/5000/5200 exact output"], evidence: "Card5000·Kakao5000 뒤 choice2 Kakao5200을 실행해 blank2 포함 raw8 lines와 legacy `결재`4 occurrences를 만듭니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["JDK21 clean compile", "Xlint", "negative diagnostic contracts", "explicit -d"], evidence: "package26·scope8·모든 synthetic examples와 in-memory override fixtures의 OpenJDK21.0.11 toolchain/options 근거입니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["ArgumentList", "redirected stdin/stdout/stderr", "exit-code process audit"], evidence: "PowerShell original audit에서 shell parsing 없이 Java process arguments와 three streams를 구성하는 official API 근거입니다." },
    { id: "dotnet-environment-variables", repository: ".NET API", path: "System.Environment.GetEnvironmentVariable / SetEnvironmentVariable", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.environment.setenvironmentvariable", usedFor: ["process-scope environment read/write", "Java launcher option isolation", "finally restoration"], evidence: "audit child process가 네 Java launcher option 환경 변수의 원래 값을 저장·제거·복원해 host 설정이 compiler/runtime golden을 오염시키지 않게 하는 API 근거입니다." },
    { id: "jls-overriding", repository: "JLS SE 21", path: "8.4.8.1 Overriding (by Instance Methods)", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8.1", usedFor: ["override relation", "inheritance", "instance methods"], evidence: "subclass instance method가 superclass method를 override하는 선언 조건의 primary specification입니다." },
    { id: "jls-method-signature", repository: "JLS SE 21", path: "8.4.2 Method Signature", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.2", usedFor: ["signature", "subsignature", "overload distinction"], evidence: "method signature와 subsignature 정의로 이름만 같은 method를 override로 오해하지 않게 합니다." },
    { id: "jls-return-type-substitutability", repository: "JLS SE 21", path: "8.4.5 Method Result", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.5", usedFor: ["covariant return", "return-type-substitutable", "incompatible return"], evidence: "overriding return type의 substitutability와 unchecked migration rules의 근거입니다." },
    { id: "jls-override-throws", repository: "JLS SE 21", path: "8.4.8.3 Requirements in Overriding and Hiding", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8.3", usedFor: ["checked throws narrowing", "access restriction", "override requirements"], evidence: "override의 return/throws/access compatibility 요구를 함께 규정하는 primary specification입니다." },
    { id: "jls-widening-reference", repository: "JLS SE 21", path: "5.1.5 Widening Reference Conversion", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.5", usedFor: ["upcast", "identity preservation", "subtype to supertype"], evidence: "Cat reference를 Animal view로 widening하는 허용 변환의 근거입니다." },
    { id: "jls-method-invocation", repository: "JLS SE 21", path: "15.12 Method Invocation Expressions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12", usedFor: ["compile-time method surface", "invocation selection", "receiver expression"], evidence: "method 호출의 compile-time selection과 runtime evaluation을 분리하는 전체 규칙 근거입니다." },
    { id: "jls-runtime-method-lookup", repository: "JLS SE 21", path: "15.12.4.4 Locate Method to Invoke", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.4", usedFor: ["dynamic dispatch", "runtime receiver", "most-specific override body"], evidence: "compile-time에 선택된 instance signature의 실제 body를 runtime class에서 찾는 근거입니다." },
    { id: "jls-casting", repository: "JLS SE 21", path: "5.5 Casting Contexts", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.5", usedFor: ["downcast", "runtime check", "ClassCastException path"], evidence: "narrowing reference cast의 허용과 runtime compatibility check 근거입니다." },
    { id: "jls-super-method", repository: "JLS SE 21", path: "15.12.1 Determine Type to Search", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.1", usedFor: ["super method invocation", "direct superclass implementation", "same receiver"], evidence: "TypeName.super/super form이 search type을 정하는 method invocation 근거입니다." },
    { id: "jls-final-method", repository: "JLS SE 21", path: "8.4.3.3 final Methods", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.3.3", usedFor: ["closed variation", "final override rejection", "constructor trap mitigation"], evidence: "final instance method가 override/hide될 수 없는 선언 규칙 근거입니다." },
    { id: "jls-field-hiding", repository: "JLS SE 21", path: "8.3 Field Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.3", usedFor: ["field hiding", "separate storage", "compile-time field selection"], evidence: "subclass의 same-name field가 inherited field를 숨기는 선언과 initialization 근거입니다." },
    { id: "jls-static-hiding", repository: "JLS SE 21", path: "8.4.8.2 Hiding (by Class Methods)", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8.2", usedFor: ["static method hiding", "instance/static clash", "class qualification"], evidence: "class method hiding이 instance overriding과 다른 관계라는 primary specification입니다." },
    { id: "jls-instanceof", repository: "JLS SE 21", path: "15.20.2 The instanceof Operator", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.20.2", usedFor: ["runtime type test", "null false", "pattern match"], evidence: "instanceof의 runtime compatibility와 null 결과 규칙 근거입니다." },
    { id: "jls-pattern-instanceof", repository: "JLS SE 21", path: "14.30.1 Kinds of Patterns", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.30.1", usedFor: ["type pattern", "checked binding"], evidence: "type pattern이 type test와 local binding을 함께 제공하는 language 근거입니다." },
    { id: "jls-pattern-instanceof-scope", repository: "JLS SE 21", path: "6.3.1.5 Scope of a Pattern Variable Declared in an instanceof Expression", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.3.1.5", usedFor: ["instanceof pattern variable scope", "true-path binding", "flow-sensitive availability"], evidence: "instanceof type pattern이 성공한 control-flow 영역에서 pattern variable을 사용할 수 있는 정확한 scope 근거입니다." },
    { id: "jls-switch-expressions", repository: "JLS SE 21", path: "15.28 switch Expressions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.28", usedFor: ["choice factory", "expression result", "exhaustiveness"], evidence: "choice→Optional mapping에 사용한 switch expression의 typing/completion 근거입니다." },
    { id: "jls-sealed-classes", repository: "JLS SE 21", path: "8.1.1.2 sealed, non-sealed, and final Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.1.2", usedFor: ["sealed hierarchy", "permits", "extension policy"], evidence: "direct subclasses 제한과 permitted subtype modifier 의무의 primary specification입니다." },
    { id: "jls-sealed-interfaces", repository: "JLS SE 21", path: "9.1.1.4 sealed Interfaces", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.1.1.4", usedFor: ["sealed interface", "permitted direct implementors", "PaymentMethod permits contract"], evidence: "sealed interface의 direct subinterface/implementor 제한과 permits 관계를 규정하는 예제 root의 primary specification입니다." },
    { id: "jls-pattern-switch", repository: "JLS SE 21", path: "14.11.1 The Selector Expression", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.11.1", usedFor: ["pattern switch", "exhaustiveness", "sealed selector"], evidence: "JDK21 switch pattern compatibility/exhaustiveness와 null treatment 근거입니다." },
    { id: "jls-type-erasure", repository: "JLS SE 21", path: "4.6 Type Erasure", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.6", usedFor: ["generic runtime descriptor", "Object return", "bridge motivation"], evidence: "generic type erasure가 Box<T> method descriptor를 Object 형태로 만드는 근거입니다." },
    { id: "jls-bridge-methods", repository: "JLS SE 21", path: "8.4.8.3 Requirements in Overriding and Hiding", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8.3", usedFor: ["synthetic bridge", "erasure override compatibility", "binary invocation"], evidence: "erasure가 superclass signature를 바꿀 때 bridge method가 필요할 수 있음을 설명하는 JLS 근거입니다." },
    { id: "jls-instance-creation", repository: "JLS SE 21", path: "12.5 Creation of New Class Instances", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.5", usedFor: ["superclass-first construction", "constructor virtual dispatch risk", "subclass field timing"], evidence: "super constructor processing과 subclass field initialization 순서를 추적하는 근거입니다." },
    { id: "java-override-annotation", repository: "Java SE 21 API", path: "java.lang.Override", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Override.html", usedFor: ["override intent", "compiler verification", "badOverride fixture"], evidence: "method declaration이 intended supertype method를 override한다는 compiler-checked annotation contract입니다." },
    { id: "java-reflection-method", repository: "Java SE 21 API", path: "java.lang.reflect.Method", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Method.html", usedFor: ["return/access/throws shape", "isBridge", "isSynthetic"], evidence: "override declaration과 compiler-generated bridge method를 구조적으로 검사하는 API 근거입니다." },
    { id: "java-modifier-api", repository: "Java SE 21 API", path: "java.lang.reflect.Modifier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Modifier.html", usedFor: ["public access reflection", "modifier contract"], evidence: "reflection modifier bits에서 public 등 선언 특성을 판정하는 official API 근거입니다." },
    { id: "java-class-cast-exception", repository: "Java SE 21 API", path: "java.lang.ClassCastException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassCastException.html", usedFor: ["invalid downcast", "normalized failure type"], evidence: "object가 target subclass instance가 아닐 때 cast가 던지는 runtime exception 근거입니다." },
    { id: "java-optional-api", repository: "Java SE 21 API", path: "java.util.Optional", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html", usedFor: ["selection absence", "null-free factory", "unknown provider"], evidence: "값이 있을 수도 없을 수도 있는 return result를 명시하는 value-based container API 근거입니다." },
    { id: "java-map-api", repository: "Java SE 21 API", path: "java.util.Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["allowlisted provider registry", "key lookup"], evidence: "provider key→supplier immutable registry에 사용한 official collection API 근거입니다." },
    { id: "java-supplier-api", repository: "Java SE 21 API", path: "java.util.function.Supplier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Supplier.html", usedFor: ["strategy creation", "factory registry", "fresh provider instance"], evidence: "arguments 없이 PaymentMethod instance를 공급하는 functional contract 근거입니다." },
    { id: "java-class-permitted-subclasses", repository: "Java SE 21 API", path: "java.lang.Class.getPermittedSubclasses", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html#getPermittedSubclasses()", usedFor: ["sealed structure reflection", "permitted set"], evidence: "sealed type의 direct permitted subclasses를 runtime에 구조 검증하는 API 근거입니다." },
    { id: "lsp-primary", repository: "ACM TOPLAS", path: "Liskov and Wing, A Behavioral Notion of Subtyping", publicUrl: "https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf", usedFor: ["behavioral subtyping", "pre/postconditions", "substitutability"], evidence: "signature 관계를 넘어 프로그램 properties를 보존하는 behavioral subtype 원칙의 primary research 근거입니다." },
    { id: "java-compiler-api", repository: "Java SE 21 API", path: "javax.tools.JavaCompiler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/JavaCompiler.html", usedFor: ["in-memory negative tasks", "explicit compiler options", "isolated output"], evidence: "invalid override fixtures를 production build 밖에서 programmatic compile하는 API 근거입니다." },
    { id: "java-diagnostic-api", repository: "Java SE 21 API", path: "javax.tools.Diagnostic", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/Diagnostic.html", usedFor: ["ERROR kind", "line number", "diagnostic code"], evidence: "compiler result의 kind·1-based line·code를 structured assertion하는 API 근거입니다." },
    { id: "java-files-api", repository: "Java SE 21 API", path: "java.nio.file.Files", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["temp output", "reverse cleanup", "artifact absence"], evidence: "fixture별 classes directory와 GUID tree cleanup을 수행하는 filesystem API 근거입니다." },
    { id: "java-uuid-api", repository: "Java SE 21 API", path: "java.util.UUID", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/UUID.html", usedFor: ["unique temp direct child", "collision avoidance"], evidence: "검증 실행마다 system temp 아래 고유 root name을 만드는 API 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 8,
    filesUsed: 8,
    uncoveredNotes: [
      "inventory direct6 Ex15·16·17·19·20·21과 실행 companions Ex18·22를 모두 읽어 declarations와 runtime evidence를 범위8로 연결했습니다.",
      "class04 package26은 exit0·warning1이며 warning source는 범위 밖 Ex09_Sub.java와 compiler.warn.missing.SVUID로 exact assertion했습니다. scope8은 별도 output에서 exit0·warning0입니다.",
      "scope source를 동적으로 검사해 Ex18·Ex22 main2와 나머지 compile-only6을 계산하고 hardcoded role count drift를 막았습니다.",
      "JDK_JAVAC_OPTIONS·JDK_JAVA_OPTIONS·JAVA_TOOL_OPTIONS·_JAVA_OPTIONS는 audit process에서 원래 값을 저장하고 제거한 뒤 finally에서 복원합니다. explicit debug/NPE flags가 host launcher 설정과 pickup diagnostics에 흔들리지 않게 했습니다.",
      "ProcessStartInfo로 Ex18 input1/2/9 각각에 stdin을 쓰고 stdout/stderr/exit를 분리 읽었습니다. input9의 enhanced NPE local slot과 line28은 OpenJDK21.0.11, explicit `-g:source,lines`, `-XX:+ShowCodeDetailsInExceptionMessages`로 pin했습니다.",
      "input1은 prompt+parent sound, cat sound, like의3 lines이고 input2는 prompt+dog sound, like의2 lines입니다. Cat super augmentation과 Dog replacement로 차이를 설명했습니다.",
      "Ex22 raw8 lines·blank2·Card1/Kakao2 blocks·amounts5000/5000/5200·legacy `결재`4 occurrences를 exact 검증했습니다.",
      "원본 `결재` 오타는 source/runtime provenance에서 보존하되 새 strategy/domain 예제의 사용자 문구는 `결제`로 교정해 두 evidence를 섞지 않았습니다.",
      "원본의 ‘부모 method를 가져와 마음대로 수정’ 설명은 JLS override-equivalence/subsignature, return-type-substitutability, access, checked throws, @Override 계약으로 교정했습니다.",
      "upcast identity, compile-time surface/runtime dispatch, field/static hiding, pattern downcast와 null 규칙은 원본 comments만으로 충분하지 않아 JLS SE21 exact examples로 보충했습니다.",
      "Ex18 invalid null receiver는 원본 failure golden으로 유지하고 새 factory example에서는 Optional absence로 selection boundary에서 제거했습니다.",
      "Ex19~22 choice branch는 allowlisted supplier registry와 constructor-injected strategy로 확장했으며 실제 결제의 idempotency/retry는 lab extension/diagnostic contract로 명시했습니다.",
      "LSP pre/postcondition suite는 Card/Kakao가 base-valid1·5000을 통과하고 MinimumPayment가 strengthened precondition으로 실패하는 behavioral evidence입니다.",
      "sealed hierarchy는 closed domain 선택지로만 제시하고 third-party provider SPI에는 open interface가 필요할 수 있다는 trade-off를 함께 기록했습니다.",
      "generic bridge와 constructor virtual dispatch는 reflection/JLS로 보충해 direct String+synthetic Object methods와 partial null state를 exact 검증했습니다.",
      "negative compiler suite는 access·throws·return·final·bad @Override·static clash를 각각 errors1·warnings0·expected line/code로 OpenJDK21에 pin했습니다.",
      "모든 Java examples와 inner JavaCompiler tasks는 explicit temp -d를 사용하고 normalized system temp direct GUID child boundary 뒤 생성 root만 cleanup합니다.",
      "공개 code/output/evidence에는 실제 개인정보·credential·로컬 절대 경로·비결정적 identity hash를 포함하지 않고 synthetic markers와 원본의 비민감 학습 문구만 사용했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
