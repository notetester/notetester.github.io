import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["core-01-standard-api"],
  slug: "core-01-standard-api",
  courseId: "java",
  moduleId: "java-core-functional",
  order: 21,
  title: "String·Math·Random·Date·java.time 표준 API",
  subtitle: "문자·수치·난수·시간을 값의 의미와 경계 조건으로 해석하고, charset·Locale·seed·Clock·ZoneId를 명시해 재현 가능한 프로그램을 만듭니다.",
  level: "중급",
  estimatedMinutes: 840,
  coreQuestion: "편리한 표준 API의 기본값과 현재 상태에 숨어 있는 charset·Locale·entropy·clock·time-zone 의존성을 어떻게 드러내고, Unicode·수치·시간 경계에서도 재현 가능한 계약으로 바꿀까요?",
  summary: "MyJavaProject 원본에서 inventory direct4인 class01 Ex01_String과 class02 Ex01_Math·Ex02_Random·Ex05_LocalDate를 읽고, 같은 packages의 실행 companion4인 class01 Test와 class02 Ex03_Date·Ex04_Calendar·Test, 빈 placeholder1까지 package9로 확장해 OpenJDK21에서 감사했습니다. package9와 direct4는 모두 exit0·warning0이고 main은9개이며 direct4는 다른 source dependency 없이 독립 compile됩니다. 원본 실행은 String115행·Math34행·Random8행·LocalDate30행이고 companions는 synthetic name masking1행·Date3행·Calendar16행·두 난수 game12행입니다. 현재 시각과 난수는 raw snapshot 대신 모양·범위·개수·불변 관계로 검증하고, String 원본의 개인 식별 가능 문자열은 source에서 category count만 memory로 확인한 뒤 어떤 값도 공개 code·output·evidence에 싣지 않았습니다. 이 근거 위에서 String identity와 content equality, interning·immutability·StringBuilder, UTF-16 code unit과 Unicode code point, explicit UTF-8, regex split의 limit, 경계 검증 후 masking, Locale.ROOT와 locale-aware format, ceil/floor/round의 음수 방향·overflow exact arithmetic, seeded Random과 origin/bound·SecureRandom의 보안 경계, Date/Calendar에서 immutable java.time으로의 이동, Clock injection, Instant/LocalDateTime/ZonedDateTime와 DST gap/overlap, DayOfWeek1~7·ChronoUnit 방향·TemporalAdjusters까지 전문가 수준으로 연결합니다.",
  objectives: [
    "String reference identity·content equality·interning·immutability와 UTF-16 code unit·Unicode code point를 구분하고, 올바른 비교·조립과 explicit Charset 비ASCII round trip을 검증한다.",
    "split의 regex·limit, substring index, masking boundary를 검증해 빈 token과 개인정보 노출을 통제한다.",
    "Locale-sensitive case conversion과 formatting에 Locale을 명시하고 default-locale drift를 제거한다.",
    "Math의 ceil·floor·round를 음수에서도 수직선 방향으로 해석하고 integer overflow를 exact APIs로 탐지한다.",
    "재현 시험에는 seeded pseudorandom generator, 보안 token에는 SecureRandom을 사용하며 origin/bound의 half-open contract를 지킨다.",
    "legacy Date/Calendar의 mutable·global-default 경계를 java.time immutable types로 이전하고 Clock·ZoneId를 주입해 Instant·LocalDate·LocalDateTime·ZonedDateTime 중 domain 의미에 맞는 type을 선택한다.",
    "DST gap/overlap, ChronoUnit argument direction, DayOfWeek1~7, TemporalAdjusters의 strict/non-strict 의미를 실행 계약으로 검증한다.",
  ],
  prerequisites: [{ title: "overload·constructor·this", reason: "StringBuilder·Random·Clock·java.time factory의 생성/호출 형태와 immutable object가 새 값을 반환하는 의미를 구분하려면 constructor·instance method·this의 기본 계약이 필요합니다.", sessionSlug: "oop-04-overload-constructor-this" }],
  keywords: ["String", "reference identity", "equals", "interning", "immutability", "StringBuilder", "UTF-16", "code unit", "code point", "Charset", "UTF-8", "split", "regular expression", "limit", "substring", "masking", "Locale.ROOT", "Math.ceil", "Math.floor", "Math.round", "overflow", "Random", "seed", "origin", "bound", "SecureRandom", "Date", "Calendar", "java.time", "Clock.fixed", "Instant", "LocalDate", "LocalDateTime", "ZoneId", "ZonedDateTime", "DST gap", "DST overlap", "DayOfWeek", "ChronoUnit", "TemporalAdjusters"],
  chapters: [
    {
      id: "package-nine-privacy-safe-original-audit",
      title: "package9·direct4·실행8을 warning0로 재현하되 현재값과 개인 문자열은 raw로 공개하지 않습니다",
      lead: "원본 학습자료의 실제 동작을 잃지 않으면서도 비결정적 출력은 범위·모양으로, 개인 식별 가능 값은 category count로만 증명하는 감사 경계를 먼저 세웁니다.",
      explanations: [
        "class01에는 direct Ex01_String, 빈 main placeholder Ex01, 입력 이름 masking companion Test의3 files가 있습니다. class02에는 direct Math·Random·LocalDate와 legacy Date·Calendar·난수 game Test의6 files가 있어 package scope는9, 실제 의미 있는 실행은 placeholder를 제외한8입니다.",
        "package9와 direct4는 별도 output directories에 -encoding UTF-8 --release21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics로 compile합니다. 둘 다 exit0·compiler output0이며 source의 static void main을 세어 package main9와 direct main4를 동적으로 확인합니다.",
        "String direct output은115행이지만 source에 개인 식별 가능 문자열 category가 있으므로 raw stdout을 public golden으로 만들지 않습니다. assignment literal을 escape-decode한 뒤 mutually-exclusive precedence로 hyphenated phone2·numeric phone/identifier1·email1·compound contact2·comma-delimited name-like1·repeated name-bearing2, 총9 occurrences·exact unique8·whitespace-normalized unique7만 확인합니다.",
        "원본 masking companion에는 공개 자료와 무관한 실제 이름 대신 synthetic ABCDE를 stdin으로 넣습니다. 결과는 한 행이고 별표 run3이며 마지막 구조가 A***E인지 검증해 algorithm behavior만 남깁니다.",
        "Math의 앞28행은 E·PI·abs와 ceil/floor/round 결과를 exact로 확인하고29~32행의 Math.random 값은 [0,1), [0,10), [0,3), [0,13) 범위만 검증합니다. Random8행도 label/type/range만 검사해 특정 난수에 의존하지 않습니다.",
        "Date·Calendar·LocalDate는 현재 clock을 읽으므로 raw 날짜를 snapshot하지 않습니다. Date format shape, Calendar month1~12·weekday1~7·positive epoch, LocalDate의 fixed literals와 current-derived ISO shapes·plus/minus 관계를 확인합니다.",
        "class02 Test는 synthetic 1→n→1 입력으로 두 game을 한 번씩 끝냅니다. 첫 CPU 선택1~3, 두 번째1~13, win/draw/lose 합1만 assert하며 사용자의 선택·프로그램 labels 외 random value는 공개하지 않습니다.",
        "감사 process는 네 Java launcher option 환경변수의 존재와 값을 저장한 뒤 compile 전에 제거하고 각 ProcessStartInfo child에서도 제거합니다. stdout/stderr를 Start 직후 비동기로 drain하고 10초 timeout·tree kill·5초 termination grace·finally Dispose를 적용합니다.",
        "OS temp의 공백 포함 GUID direct child만 사용하고 normalized parent가 temp base와 정확히 같을 때만 삭제합니다. raw source/output은 process memory 밖 파일로 쓰지 않고, finally에서 environment를 복원한 뒤 residue absence까지 확인합니다.",
      ],
      concepts: [
        { term: "privacy-safe golden", definition: "민감한 raw 값 대신 behavior를 충분히 특정하는 개수·모양·범위·관계만 공개하는 회귀 계약입니다.", detail: ["원본 raw output은 public snapshot에 저장하지 않습니다.", "category count도 개인 값을 역추론할 수 없게 최소화합니다."], caveat: "redaction은 값만 별표로 바꾸는 것보다 raw를 애초에 public channel에 싣지 않는 편이 안전합니다." },
        { term: "normalized nondeterminism", definition: "현재 시각·난수처럼 매 실행 달라지는 값을 합법 범위, 형식, 상호 관계로 검증하는 방식입니다.", detail: ["난수는 half-open bounds를 확인합니다.", "시간은 ISO shape와 동일 snapshot에서 나온 관계를 확인합니다."] },
        { term: "atomic source scope", definition: "inventory direct files에 실제 실행 companion·placeholder를 분류해 독립 compile/run 가능한 경계를 닫은 source 집합입니다.", detail: ["package9=direct4+companions4+placeholder1입니다.", "빈 placeholder도 main inventory에는 포함하되 실행 evidence와 구분합니다."] },
      ],
      codeExamples: [{
        id: "powershell-original-core01-audit",
        title: "package9를 compile하고 실행8을 exact·shape·range·privacy count로 감사합니다",
        language: "powershell",
        filename: "verify-original-core01.ps1",
        purpose: "개인 식별 가능 raw 값과 현재/난수 raw를 출력하지 않고 원본 표준 API 학습자료를 재현합니다.",
        code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("core01 audit " + [Guid]::NewGuid().ToString("N"))
if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
$launcherNames = @("JDK_JAVAC_OPTIONS", "JDK_JAVA_OPTIONS", "JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS")
$savedLauncher = @{}
foreach ($name in $launcherNames) {
  if (Test-Path "Env:$name") { $savedLauncher[$name] = (Get-Item "Env:$name").Value; Remove-Item "Env:$name" -ErrorAction Stop }
}
try {
  $lf = [string][char]10
  $crlf = [string][char]13 + [char]10
  $class01 = "src\com\java\class01"
  $class02 = "src\com\java\class02"
  $all = @(Get-ChildItem -LiteralPath $class01 -Filter "*.java" | Sort-Object Name | ForEach-Object FullName) +
         @(Get-ChildItem -LiteralPath $class02 -Filter "*.java" | Sort-Object Name | ForEach-Object FullName)
  $direct = @(
    (Join-Path $class01 "Ex01_String.java"),
    (Join-Path $class02 "Ex01_Math.java"),
    (Join-Path $class02 "Ex02_Random.java"),
    (Join-Path $class02 "Ex05_LocalDate.java")
  )
  $packageOut = Join-Path $root "package classes"
  $directOut = Join-Path $root "direct classes"
  New-Item -ItemType Directory -Path $packageOut, $directOut -ErrorAction Stop | Out-Null
  $packageLog = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $packageOut $all 2>&1)
  $packageExit = $LASTEXITCODE
  $directLog = @(& javac -encoding UTF-8 --release 21 -proc:none -g:source,lines -Xlint:all -XDrawDiagnostics -d $directOut $direct 2>&1)
  $directExit = $LASTEXITCODE
  $mainPattern = 'public\s+static\s+void\s+main\s*\('
  $packageMains = @($all | Where-Object { (Get-Content -Raw -LiteralPath $_) -match $mainPattern }).Count
  $directMains = @($direct | Where-Object { (Get-Content -Raw -LiteralPath $_) -match $mainPattern }).Count
  if ($all.Count -ne 9 -or $packageExit -ne 0 -or $packageLog.Count -ne 0 -or $packageMains -ne 9) { throw "package compile drift" }
  if ($direct.Count -ne 4 -or $directExit -ne 0 -or $directLog.Count -ne 0 -or $directMains -ne 4) { throw "direct compile drift" }

  function Invoke-Java([string]$main, [string]$stdin = "") {
    $start = [Diagnostics.ProcessStartInfo]::new()
    $start.FileName = (Get-Command java -ErrorAction Stop).Source
    foreach ($arg in @("-Dfile.encoding=UTF-8", "-Duser.language=en", "-Duser.country=US", "-Duser.timezone=UTC", "-Djava.locale.providers=CLDR", "-cp", $packageOut, $main)) { [void]$start.ArgumentList.Add($arg) }
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
        if (-not $process.WaitForExit(5000)) { throw "java did not terminate after kill" }
        [void]$stdoutTask.GetAwaiter().GetResult(); [void]$stderrTask.GetAwaiter().GetResult()
        throw "java timeout"
      }
      $out = $stdoutTask.GetAwaiter().GetResult().Replace($crlf, $lf).TrimEnd([char]10)
      $err = $stderrTask.GetAwaiter().GetResult()
      $lines = if ($out.Length -eq 0) { @() } else { @($out.Split([char]10)) }
      [pscustomobject]@{ Exit = $process.ExitCode; Out = $out; Err = $err; Lines = $lines }
    } finally { $process.Dispose() }
  }
  function Assert-Clean($run) { if ($run.Exit -ne 0 -or -not [string]::IsNullOrEmpty($run.Err)) { throw "main failed" } }
  function Parse-Invariant([string]$value) { [double]::Parse($value, [Globalization.CultureInfo]::InvariantCulture) }

  $stringRun = Invoke-Java "com.java.class01.Ex01_String"
  $maskRun = Invoke-Java "com.java.class01.Test" ("ABCDE" + $lf)
  $mathRun = Invoke-Java "com.java.class02.Ex01_Math"
  $randomRun = Invoke-Java "com.java.class02.Ex02_Random"
  $dateRun = Invoke-Java "com.java.class02.Ex03_Date"
  $calendarRun = Invoke-Java "com.java.class02.Ex04_Calendar"
  $localRun = Invoke-Java "com.java.class02.Ex05_LocalDate"
  $gamesRun = Invoke-Java "com.java.class02.Test" ("1" + $lf + "n" + $lf + "1" + $lf)
  foreach ($run in @($stringRun, $maskRun, $mathRun, $randomRun, $dateRun, $calendarRun, $localRun, $gamesRun)) { Assert-Clean $run }

  $stringSource = Get-Content -Raw -LiteralPath (Join-Path $class01 "Ex01_String.java")
  $assignmentPattern = '(?m)(?:String\s+)?(?<var>[A-Za-z_]\w*)\s*=\s*"(?<value>(?:\\.|[^"\\])*)"\s*;'
  $commonSurname = '^[김이박최정강조윤장임한오서신권황안송전홍유고문양손배조백허남심노하곽성차주우구민진지엄채원천방공현함변염여추도소석선설마길연위표명기반라왕금옥육인맹제모탁국어은편용][가-힣]{1,3}$'
  $categories = [ordered]@{ phone = 0; numeric = 0; email = 0; compound = 0; commaName = 0; repeatedName = 0 }
  $candidateValues = [Collections.Generic.List[string]]::new()
  foreach ($match in [regex]::Matches($stringSource, $assignmentPattern)) {
    $variable = $match.Groups['var'].Value
    $value = [regex]::Unescape($match.Groups['value'].Value)
    $tokens = @($value.Trim() -split '\s+' | Where-Object Length)
    $hangul = $value -match '[가-힣]'
    $hasNameToken = @($tokens | Where-Object { $_ -match $commonSurname }).Count -ge 1
    $category = $null
    if ($variable -ceq 'phone' -and $value -match '^0\d{1,2}-\d{3,4}-\d{4}$') { $category = 'phone' }
    elseif ($variable -ceq 'msg' -and $value -match '^\d{10,13}$') { $category = 'numeric' }
    elseif ($value -match '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$') { $category = 'email' }
    elseif ($variable -ceq 'msg' -and ([regex]::Matches($value, '@').Count -eq 1) -and $hangul -and $tokens.Count -eq 7) { $category = 'compound' }
    elseif ($variable -ceq 'str8' -and ([regex]::Matches($value, ',').Count -eq 3) -and $value.Split(',').Count -eq 4 -and $tokens.Count -eq 6 -and $hangul -and $hasNameToken) { $category = 'commaName' }
    elseif ($variable -in @('str', 'str5') -and @($value.EnumerateRunes()).Count -eq 24 -and $tokens.Count -eq 6 -and [regex]::Matches($value, '[가-힣]').Count -eq 10 -and $hasNameToken) { $category = 'repeatedName' }
    if ($null -ne $category) { $categories[$category]++; $candidateValues.Add($value) }
  }
  $exactUnique = @($candidateValues | Sort-Object -Unique).Count
  $normalizedUnique = @($candidateValues | ForEach-Object { $_.Trim() -replace '\s+', ' ' } | Sort-Object -Unique).Count
  $maskedCommentCount = [regex]::Matches($stringSource, '[가-힣]\*+[가-힣]').Count
  $booleanCount = @($stringRun.Lines | Where-Object { $_ -match '^(true|false)$' }).Count
  $starRuns = @([regex]::Matches($stringRun.Out, '\*+') | ForEach-Object { $_.Value.Length })
  if (($categories.Values | Measure-Object -Sum).Sum -ne 9 -or $categories.phone -ne 2 -or $categories.numeric -ne 1 -or $categories.email -ne 1 -or $categories.compound -ne 2 -or $categories.commaName -ne 1 -or $categories.repeatedName -ne 2 -or $exactUnique -ne 8 -or $normalizedUnique -ne 7 -or $maskedCommentCount -ne 1) { throw "privacy category drift" }
  if ($stringRun.Lines.Count -ne 115 -or @($stringRun.Lines | Where-Object { $_ -ceq "" }).Count -ne 6 -or $booleanCount -ne 16 -or ($starRuns -join '|') -cne '4|4') { throw "String normalized drift" }
  if ($maskRun.Lines.Count -ne 1 -or [regex]::Matches($maskRun.Out, '\*+').Count -ne 1 -or [regex]::Match($maskRun.Out, '\*+').Value.Length -ne 3 -or -not $maskRun.Out.EndsWith('A***E')) { throw "mask companion drift" }

  $mathPrefix = @('2.718281828459045', '3.141592653589793', '5', '5', 'ceil:큰 정수 찾기', '10.0', '10.0', '11.0', '11.0', '-10.0', '-10.0', '-10.0', 'floor:작은 정수 찾기', '10.0', '10.0', '10.0', '10.0', '-10.0', '-11.0', '-11.0', 'round:반올림(소수점 첫번째 자리 기준)', '10', '10', '10', '11', '-10', '-10', '-11')
  if ($mathRun.Lines.Count -ne 34 -or (Compare-Object @($mathRun.Lines[0..27]) $mathPrefix -SyncWindow 0).Count -ne 0) { throw "Math exact drift" }
  $mathRandom = @(
    (Parse-Invariant ($mathRun.Lines[28]))
    ([int]($mathRun.Lines[29]))
    ([int]($mathRun.Lines[30]))
    ([int]($mathRun.Lines[31]))
  )
  if ($mathRandom[0] -lt 0 -or $mathRandom[0] -ge 1 -or $mathRandom[1] -lt 0 -or $mathRandom[1] -ge 10 -or $mathRandom[2] -lt 0 -or $mathRandom[2] -ge 3 -or $mathRandom[3] -lt 0 -or $mathRandom[3] -ge 13 -or $mathRun.Lines[32] -cne '15.0001' -or $mathRun.Lines[33] -cne '15.0') { throw "Math range drift" }

  if ($randomRun.Lines.Count -ne 8 -or $randomRun.Lines[0] -notmatch '^boolean형: (true|false)$' -or $randomRun.Lines[1] -notmatch '^int형: -?\d+$' -or $randomRun.Lines[2] -notmatch '^long형: -?\d+$' -or $randomRun.Lines[3] -notmatch '^float형: \S+$' -or $randomRun.Lines[4] -notmatch '^double형: \S+$') { throw "Random type drift" }
  $randomFloat = Parse-Invariant ($randomRun.Lines[3].Substring('float형: '.Length))
  $randomDouble = Parse-Invariant ($randomRun.Lines[4].Substring('double형: '.Length))
  if (-not [double]::IsFinite($randomFloat) -or $randomFloat -lt 0 -or $randomFloat -ge 1 -or -not [double]::IsFinite($randomDouble) -or $randomDouble -lt 0 -or $randomDouble -ge 1) { throw "Random unit range drift" }
  foreach ($line in $randomRun.Lines[5..7]) { $value = [int]$line; if ($value -lt 0 -or $value -ge 10) { throw "Random bound drift" } }

  if ($dateRun.Lines.Count -ne 3 -or $dateRun.Lines[0] -notmatch '^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{2} \d{2}:\d{2}:\d{2} UTC \d{4}$' -or $dateRun.Lines[1] -notmatch '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$' -or $dateRun.Lines[2] -notmatch '^\d{2}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}$') { throw "Date shape drift" }
  if ($calendarRun.Lines.Count -ne 16 -or $calendarRun.Lines[0] -notmatch '^java\.util\.GregorianCalendar\[' -or $calendarRun.Lines[1] -notmatch ' UTC \d{4}$' -or $calendarRun.Lines[2] -notmatch 'id="UTC"' -or $calendarRun.Lines[4] -notmatch '^(?:[1-9]|1[0-2])월$' -or $calendarRun.Lines[5] -cne $calendarRun.Lines[6] -or $calendarRun.Lines[10] -notmatch '^[월화수목금토일]요일$' -or [long]($calendarRun.Lines[11]) -le 0) { throw "Calendar normalized drift" }

  if ($localRun.Lines.Count -ne 30 -or @($localRun.Lines | Where-Object { $_ -ceq "" }).Count -ne 1 -or $localRun.Lines[1] -cne '2025-01-10' -or [int]($localRun.Lines[7]) -notin 1..7 -or $localRun.Lines[12] -cne '14:20') { throw "LocalDate fixed drift" }
  foreach ($index in @(0, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 27, 28)) { if ($localRun.Lines[$index] -notmatch '^\d{4}-\d{2}-\d{2}') { throw "LocalDate ISO drift" } }
  if ($localRun.Lines[13] -notmatch '^\d{4}-\d{2}-\d{2}T' -or $localRun.Lines[19] -cne '' -or $localRun.Lines[20] -cne $localRun.Lines[13] -or $localRun.Lines[26] -notmatch '^-?\d+$' -or $localRun.Lines[29] -notmatch '^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)$') { throw "LocalDate relation drift" }

  if ($gamesRun.Lines.Count -ne 12 -or $gamesRun.Lines[1] -notmatch ', 컴퓨터: (가위|바위|보)$' -or $gamesRun.Lines[10] -notmatch '^컴퓨터가 가진 숫자: (?:[1-9]|1[0-3])$') { throw "game shape drift" }
  $counterTotal = [int]($gamesRun.Lines[3] -replace '\D','') + [int]($gamesRun.Lines[4] -replace '\D','') + [int]($gamesRun.Lines[5] -replace '\D','')
  if ($counterTotal -ne 1) { throw "game counter drift" }

  "spacePath=$($root.Contains(' ')),packages=class01:3|class02:6,compiled=9|exit:$packageExit|warnings:$($packageLog.Count)|mains:$packageMains"
  "direct=4|exit:$directExit|warnings:$($directLog.Count)|mains:$directMains,companions=4,placeholder=1"
  "privacy=phone:2|numeric:1|email:1|compound:2|commaName:1|repeatedName:2|occurrences:9|exactUnique:$exactUnique|normalizedUnique:$normalizedUnique|rawPublished:false"
  "runs=String:115|Mask:1|Math:34|Random:8|Date:3|Calendar:16|LocalDate:30|Games:12"
  "normalized=StringBlank:6|StringBooleans:16|StringStarRuns:4-4|MaskStarRun:3|MathBounds:valid|RandomBounds:valid|timeShapes:valid|gameBounds:valid"
} finally {
  foreach ($name in $launcherNames) { Remove-Item "Env:$name" -ErrorAction SilentlyContinue }
  foreach ($entry in $savedLauncher.GetEnumerator()) { Set-Item "Env:$($entry.Key)" $entry.Value }
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }
  if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" }
}`,
        walkthrough: [
          { lines: "1-24", explanation: "공백이 있는 OS temp GUID direct child, 네 launcher options의 존재/값 저장·제거, class01+class02 package9와 direct4의 분리 output을 구성합니다." },
          { lines: "25-34", explanation: "OpenJDK21 warning0 compile과 package main9·direct main4를 source shape에서 계산합니다." },
          { lines: "36-68", explanation: "ArgumentList·UTF-8 redirects·child environment isolation·async drain·10초 timeout·tree kill·5초 termination grace·Dispose를 가진 fresh JVM helper를 만듭니다." },
          { lines: "70-78", explanation: "실행8을 각각 fresh JVM으로 실행하며 masking/game에는 공개 가능한 synthetic input만 전달합니다." },
          { lines: "80-107", explanation: "Java assignment literals를 escape-decode하고 mutually-exclusive precedence로 여섯 privacy categories와9/8/7 occurrence/uniqueness 관계만 계산합니다. raw source/output은 출력하지 않습니다." },
          { lines: "109-117", explanation: "Math의 결정적 prefix28과 마지막 max/min은 exact, 난수4개는 괄호로 각 indexed value를 먼저 평가한 뒤 half-open ranges로 검증합니다." },
          { lines: "119-123", explanation: "Random의 label/type을 확인한 뒤 float/double 문자열을 invariant parse해 finite [0,1), 마지막 세 정수를0~9로 검증하며 특정 sequence는 golden으로 만들지 않습니다." },
          { lines: "125-130", explanation: "Date·Calendar·LocalDate current values는 ISO/legacy shapes와 동일-object 관계, fixed constants, weekday1~7로 검증합니다." },
          { lines: "132-134", explanation: "두 game의 random choices를 합법 bounds와 counter sum1로만 확인합니다." },
          { lines: "136-148", explanation: "raw 값 없는 요약을 출력하고 environment를 원래대로 복원한 뒤 normalized temp parent boundary를 재검사해 audit child만 삭제합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11", "MyJavaProject root", "four Java launcher option variables isolated and restored", "raw personal/current/random values retained only in process memory"], command: "pwsh -NoProfile -File verify-original-core01.ps1" },
        output: { value: "spacePath=True,packages=class01:3|class02:6,compiled=9|exit:0|warnings:0|mains:9\ndirect=4|exit:0|warnings:0|mains:4,companions=4,placeholder=1\nprivacy=phone:2|numeric:1|email:1|compound:2|commaName:1|repeatedName:2|occurrences:9|exactUnique:8|normalizedUnique:7|rawPublished:false\nruns=String:115|Mask:1|Math:34|Random:8|Date:3|Calendar:16|LocalDate:30|Games:12\nnormalized=StringBlank:6|StringBooleans:16|StringStarRuns:4-4|MaskStarRun:3|MathBounds:valid|RandomBounds:valid|timeShapes:valid|gameBounds:valid", explanation: ["원본 개인 식별 가능 literal은 한 글자도 public output에 나타나지 않고 mutually-exclusive category counts만 남습니다.", "현재 시각과 난수는 exact raw 대신 shape·range·relation으로 검증됩니다.", "package9/direct4가 모두 compiler output0이며 placeholder와 companions가 명시적으로 분류됩니다."] },
        experiments: [
          { change: "네 launcher option 변수에 -Werror·encoding·locale·settings 출력 값을 각각 넣고 같은 script를 실행합니다.", prediction: "compile과 child environment 양쪽에서 제거하므로 다섯 summary lines가 byte-for-byte 같습니다.", result: "host machine의 Java option 오염이 golden evidence에 개입하지 않습니다." },
          { change: "String raw stdout을 그대로 console에 출력하도록 바꿉니다.", prediction: "PII-derived fragments가 public log에 남을 수 있어 privacy contract가 실패합니다.", result: "민감 source는 capture 후 count/shape assertion만 하고 raw를 publish하지 않습니다." },
          { change: "Math.random 결과를 exact 숫자로 저장합니다.", prediction: "다음 실행 sequence가 달라 정상 프로그램이 실패합니다.", result: "nondeterministic source의 stable contract는 범위와 분포 설계이지 한 표본 값이 아닙니다." },
        ],
        sourceRefs: ["java-myproject-class01-ex01-string", "java-myproject-class01-ex01-placeholder", "java-myproject-class01-test-mask", "java-myproject-class02-ex01-math", "java-myproject-class02-ex02-random", "java-myproject-class02-ex03-date", "java-myproject-class02-ex04-calendar", "java-myproject-class02-ex05-localdate", "java-myproject-class02-test-games", "jdk21-javac", "dotnet-process-start-info", "powershell-environment-variables", "dotnet-process-environment", "dotnet-process-lifecycle", "dotnet-stream-reader-async"],
      }],
      diagnostics: [
        { symptom: "원본 audit 결과에 실제 개인 문자열이 보인다.", likelyCause: "raw source/stdout을 debug print하거나 실패 메시지에 실제 value를 넣었습니다.", checks: ["console redirection과 throw message를 검사합니다.", "output snapshot에 email/mobile/name patterns를 scan합니다.", "raw capture가 file로 쓰였는지 확인합니다."], fix: "raw는 process memory에서만 검사하고 category count·length·shape만 출력하며 실패 메시지도 고정 code로 바꿉니다.", prevention: "public target에 email/mobile과 알려진 private literal zero privacy gate를 둡니다." },
        { symptom: "같은 원본인데 날짜·난수 golden이 매번 실패한다.", likelyCause: "현재 clock/entropy의 raw 한 표본을 exact snapshot으로 비교했습니다.", checks: ["now/new Random/Math.random call을 찾습니다.", "raw number/date가 expected output에 있는지 봅니다.", "range와 shape가 실제 계약인지 확인합니다."], fix: "원본 감사는 범위·shape·관계로 normalize하고 새 예제는 seed와 Clock.fixed로 deterministic하게 만듭니다.", prevention: "모든 golden field를 deterministic/exact 또는 nondeterministic/invariant로 분류합니다." },
        { symptom: "hostile Java option 환경에서 warning count나 output 앞뒤에 launcher 문구가 붙는다.", likelyCause: "JDK launcher option 환경변수를 parent 또는 child 한쪽에서만 제거했습니다.", checks: ["네 변수의 process-scope presence를 확인합니다.", "javac 전 제거 여부를 봅니다.", "ProcessStartInfo.Environment.Remove 네 번을 확인합니다."], fix: "parent compile과 모든 child process에서 네 변수를 제거하고 finally에서 존재/값을 복원합니다.", prevention: "서로 다른 hostile 값을 동시에 주입한 byte-exact 재실행을 CI fixture로 둡니다." },
      ],
      expertNotes: ["privacy-safe normalized golden은 검증을 약하게 만드는 요약이 아니라 공개해도 되는 의미만 명시적으로 모델링한 contract입니다.", "분포 품질은8개 원본 표본으로 증명할 수 없으므로 범위 검증과 statistical test를 구분하고, statistical test도 deterministic seed와 tolerance 설계를 사용합니다."],
    },
    {
      id: "string-identity-equality-interning-immutability",
      title: "String의 ==는 reference identity, equals는 문자 sequence를 비교하며 interning은 별도 최적화 계약입니다",
      lead: "문자열이 ‘같다’는 말을 object identity·content equality·pool canonicalization으로 분해하고, 모든 변환이 새 값을 반환한다는 immutability를 추적합니다.",
      explanations: [
        "reference type에 ==를 적용하면 두 변수가 같은 object를 가리키는지 비교합니다. 원본의 ‘숫자만 ==로 비교한다’는 설명은 정확하지 않습니다. primitive numeric equality에도 ==를 쓰지만 reference operands에도 identity 비교로 합법입니다.",
        "String.equals는 같은 길이와 같은 char sequence인지 비교합니다. 사용자 입력, file, network, builder, new String에서 온 값은 같은 내용이어도 다른 object일 수 있으므로 domain 문자열 비교는 거의 항상 equals 또는 null-safe Objects.equals를 사용합니다.",
        "string literal과 compile-time constant expression은 class의 runtime constant pool에서 interned reference를 공유할 수 있습니다. 그래서 일부 literal 비교의 ==가 true여도 ==가 content comparator라는 뜻은 아닙니다. source 작성 방식이 바뀌면 우연한 identity가 사라질 수 있습니다.",
        "new String(...)은 새 String object를 만들기 때문에 interned literal과 content가 같아도 identity가 다릅니다. intern()은 같은 content의 canonical pool reference를 반환하지만, 일반 business 비교를 위해 매번 intern하면 global pool pressure와 숨은 memory policy가 생깁니다.",
        "String은 immutable이라 concat·replace·toUpperCase·substring 같은 method가 receiver 내부를 바꾸지 않고 결과 String을 반환합니다. 반환값을 받지 않으면 계산은 사라지고 original은 그대로입니다.",
        "immutability는 thread-safe sharing, hash key 안정성, literal pooling을 가능하게 하지만 반복 연결이 allocation을 자동으로 없애 주는 뜻은 아닙니다. compiler가 단일 expression을 최적화할 수 있어도 loop·동적 조립에는 StringBuilder를 명시하는 편이 비용 모델이 분명합니다.",
        "null은 String object가 아니므로 null.equals(...)는 NullPointerException입니다. constant.equals(variable), Objects.equals(a,b), null validation 중 domain 정책에 맞는 것을 선택하고 null과 empty·blank를 같은 값으로 몰래 합치지 않습니다.",
      ],
      concepts: [
        { term: "reference identity", definition: "두 reference가 정확히 같은 object를 가리키는지 == 또는 !=로 묻는 관계입니다.", detail: ["content가 같아도 false일 수 있습니다.", "identity가 필요한 singleton/enum과 domain text 비교를 구분합니다."] },
        { term: "string interning", definition: "같은 character sequence의 canonical String reference를 runtime pool에서 얻는 메커니즘입니다.", detail: ["literal과 constant expression은 interned됩니다.", "intern() 결과는 identity 비교용 domain normalization의 일반 대체물이 아닙니다."] },
        { term: "immutability", definition: "생성 뒤 관찰 가능한 String character sequence가 바뀌지 않는 성질입니다.", detail: ["변환 method는 새 결과를 반환합니다.", "변수는 다른 String reference로 재대입될 수 있습니다."], caveat: "final String 변수는 reference 재대입을 막고 String immutability는 object value 변경을 막는 서로 다른 개념입니다." },
      ],
      codeExamples: [{
        id: "java-string-identity-immutability",
        title: "literal·new object·intern과 변환 전후를 한 번에 추적합니다",
        language: "java",
        filename: "StringIdentityImmutabilityLab.java",
        purpose: "우연한 literal identity와 올바른 content equality를 분리하고 StringBuilder snapshot도 확인합니다.",
        code: String.raw`public class StringIdentityImmutabilityLab {
    public static void main(String[] args) {
        String literal = "JAVA";
        String constantExpression = "JA" + "VA";
        String distinct = new String(new char[] {'J', 'A', 'V', 'A'});

        System.out.println("literalIdentity=" + (literal == constantExpression));
        System.out.println("newIdentity=" + (literal == distinct));
        System.out.println("contentEquality=" + literal.equals(distinct));
        System.out.println("internIdentity=" + (literal == distinct.intern()));

        String original = "core";
        String changed = original.concat("-api");
        original.replace('c', 'C');
        System.out.println("original=" + original);
        System.out.println("changed=" + changed);

        StringBuilder builder = new StringBuilder();
        for (int value = 1; value <= 3; value++) {
            if (!builder.isEmpty()) builder.append('|');
            builder.append(value);
        }
        String snapshot = builder.toString();
        builder.append("|4");
        System.out.println("snapshot=" + snapshot);
        System.out.println("builder=" + builder);
    }
}`,
        walkthrough: [
          { lines: "1-6", explanation: "literal, compile-time constant expression, 명시적으로 새로 만든 same-content String을 준비합니다." },
          { lines: "7-10", explanation: "pool identity true, new identity false, equals true, intern canonical identity true를 각각 독립 질문으로 출력합니다." },
          { lines: "12-16", explanation: "concat 결과를 새 변수로 받고 replace 반환은 버려 original이 바뀌지 않음을 확인합니다." },
          { lines: "18-26", explanation: "loop 조립은 StringBuilder로 수행하고 toString snapshot 뒤 builder를 더 바꿔도 snapshot String이 유지됨을 보입니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("StringIdentityImmutabilityLab.java", "StringIdentityImmutabilityLab") },
        output: { value: "literalIdentity=true\nnewIdentity=false\ncontentEquality=true\ninternIdentity=true\noriginal=core\nchanged=core-api\nsnapshot=1|2|3\nbuilder=1|2|3|4", explanation: ["literal identity true는 constant folding/pooling evidence이지 equals 대체 근거가 아닙니다.", "discarded replace는 original을 바꾸지 않습니다.", "StringBuilder는 mutable이지만 이미 만든 String snapshot은 immutable입니다."] },
        experiments: [
          { change: "contentEquality를 literal == distinct로 바꿉니다.", prediction: "같은 JAVA 내용인데 false가 됩니다.", result: "외부에서 구성된 text에 identity comparator를 쓰면 data origin에 따라 bug가 나타납니다." },
          { change: "original.concat 결과를 받지 않고 changed에도 original을 대입합니다.", prediction: "둘 다 core가 됩니다.", result: "immutable API는 반환값을 data-flow에 연결해야 합니다." },
          { change: "loop에서 result = result + value를 사용합니다.", prediction: "작은 output은 같지만 iteration마다 intermediate String allocation 가능성이 생깁니다.", result: "동적 반복 조립에는 builder가 intent와 비용을 명시합니다." },
        ],
        sourceRefs: ["java-myproject-class01-ex01-string", "jls-string-literals", "jls-reference-equality", "java-string-api", "java-string-builder-api", "java-objects-api"],
      }],
      diagnostics: [
        { symptom: "화면에는 같은 문자열인데 조건식이 false다.", likelyCause: "equals 대신 ==로 서로 다른 String objects의 identity를 비교했습니다.", checks: ["각 값의 생성 경로를 확인합니다.", "new/StringBuilder/input/file 경계인지 봅니다.", "null 가능성을 확인합니다."], fix: "domain content 비교를 equals 또는 Objects.equals로 바꿉니다.", prevention: "String ==를 허용하는 경우를 intern/identity 실험과 enum-like singleton으로 제한하는 review rule을 둡니다." },
        { symptom: "replace/trim/case conversion을 호출했는데 값이 그대로다.", likelyCause: "immutable String method의 반환값을 버렸습니다.", checks: ["method call result가 assignment/return/argument로 연결되는지 봅니다.", "원본 variable만 출력하는지 봅니다."], fix: "result = source.method(...)처럼 새 reference를 받아 명시적으로 사용합니다.", prevention: "변환 pipeline에 final intermediate names와 before/after tests를 둡니다." },
      ],
      comparisons: [{ title: "문자열 동일성 질문", options: [
        { name: "equals/Objects.equals", chooseWhen: "문자 sequence라는 domain value를 비교할 때", avoidWhen: "같은 object instance 자체가 중요한 identity model일 때", tradeoffs: ["null policy를 명시해야 합니다.", "대부분의 text 비교에 올바른 기본값입니다."] },
        { name: "==", chooseWhen: "정확히 같은 reference인지, 또는 enum singleton identity인지 확인할 때", avoidWhen: "입력·DB·file·network String content를 비교할 때", tradeoffs: ["매우 빠르지만 content 의미가 아닙니다.", "literal pooling 때문에 잘못된 code가 우연히 통과할 수 있습니다."] },
        { name: "intern+==", chooseWhen: "측정된 memory/canonicalization 설계가 있고 pool lifetime을 통제할 때", avoidWhen: "equals를 피하려는 일반 business code", tradeoffs: ["canonical identity를 얻습니다.", "global pool과 unbounded cardinality 위험이 있습니다."] },
      ] }],
      expertNotes: ["String identity를 unit test로 가르칠 때 literal끼리만 비교하면 잘못된 == code가 통과하므로 반드시 new/runtime-created same-content case를 포함합니다.", "Java compiler/JIT의 concatenation 최적화는 구현 세부가 될 수 있으므로 allocation 성능은 JMH로 측정하고 language-level output test와 분리합니다."],
    },
    {
      id: "unicode-code-units-code-points-charsets",
      title: "String.length는 UTF-16 code unit 수이고 사용자가 보는 문자는 code point·grapheme 관점까지 확장됩니다",
      lead: "비ASCII를 ‘처리 못 한다’고 단정하는 대신 UTF-16 representation, supplementary code point, explicit charset encode/decode 경계를 정확히 구분합니다.",
      explanations: [
        "Java String은 UTF-16 code units의 sequence로 API를 노출합니다. length와 charAt index는 char16-bit code unit 기준이라 Basic Multilingual Plane 밖 문자는 surrogate pair 두 units를 차지합니다.",
        "codePointCount와 codePoints는 Unicode code points를 셉니다. 예제 A+emoji+한글은 사람이 세 code points로 보지만 length는1+2+1=4입니다. charAt로 emoji 절반만 떼면 unpaired surrogate가 되어 올바른 문자 단위 처리에 실패합니다.",
        "code point도 사용자 인식 grapheme cluster와 항상 같지 않습니다. combining mark, variation selector, skin-tone modifier, ZWJ emoji sequence는 여러 code points가 한 grapheme처럼 보일 수 있습니다. UI cursor/문자수 제한에는 BreakIterator 또는 더 전문적인 Unicode segmentation이 필요합니다.",
        "String.getBytes() no-argument overload는 default charset을 사용합니다. 원본의 ‘영어가 아니면 byte 변환 불가’ 설명은 틀렸습니다. 비ASCII도 encoding할 수 있지만 producer와 consumer가 같은 charset을 합의하지 않으면 round trip이 깨집니다.",
        "StandardCharsets.UTF_8처럼 charset을 명시하면 host default와 무관한 protocol/file contract가 됩니다. decode도 new String(bytes, UTF_8)처럼 같은 charset을 명시해야 합니다.",
        "charset은 문자를 bytes로 mapping하는 규칙이고 Unicode/UTF-16 String representation과 동일하지 않습니다. UTF-8 byte length, String.length, codePointCount를 서로 바꿔 쓰지 않습니다.",
        "malformed/unmappable input을 엄격히 다뤄야 하면 CharsetDecoder의 CodingErrorAction.REPORT를 사용합니다. 편의 constructor가 replacement character로 복구하는 정책이 data integrity 요구에 맞는지 boundary에서 결정합니다.",
      ],
      concepts: [
        { term: "UTF-16 code unit", definition: "Java char와 String index가 기본으로 다루는16-bit 단위입니다.", detail: ["BMP code point는 보통 한 unit입니다.", "supplementary code point는 high+low surrogate 두 units입니다."] },
        { term: "Unicode code point", definition: "U+0000부터 U+10FFFF까지 Unicode가 문자 요소에 부여한 integer value입니다.", detail: ["codePoints stream으로 안전하게 순회할 수 있습니다.", "grapheme cluster와 일대일은 아닙니다."] },
        { term: "character encoding", definition: "Unicode character sequence와 byte sequence 사이의 mapping 규칙입니다.", detail: ["UTF-8은 variable-length encoding입니다.", "경계 양쪽에서 같은 charset을 명시해야 합니다."] },
      ],
      codeExamples: [{
        id: "java-unicode-explicit-charset",
        title: "supplementary 문자와 비ASCII를 code point·UTF-8 round trip으로 검증합니다",
        language: "java",
        filename: "UnicodeCharsetLab.java",
        purpose: "length·codePointCount·byte length를 분리하고 default charset 없는 round trip을 만듭니다.",
        code: String.raw`import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

public class UnicodeCharsetLab {
    public static void main(String[] args) {
        String text = "A\uD83D\uDE00한";
        String codePoints = text.codePoints()
                .mapToObj(value -> String.format("U+%04X", value))
                .collect(Collectors.joining(","));

        System.out.println("length=" + text.length());
        System.out.println("codePoints=" + text.codePointCount(0, text.length()));
        System.out.println("values=" + codePoints);
        System.out.println("high=" + Character.isHighSurrogate(text.charAt(1)));
        System.out.println("low=" + Character.isLowSurrogate(text.charAt(2)));
        System.out.println("offsetAfterTwo=" + text.offsetByCodePoints(0, 2));

        byte[] utf8 = text.getBytes(StandardCharsets.UTF_8);
        String restored = new String(utf8, StandardCharsets.UTF_8);
        String wrong = new String(utf8, StandardCharsets.ISO_8859_1);
        System.out.println("utf8Bytes=" + utf8.length);
        System.out.println("roundTrip=" + text.equals(restored));
        System.out.println("wrongCharsetEqual=" + text.equals(wrong));
    }
}`,
        walkthrough: [
          { lines: "1-9", explanation: "escape로 supplementary emoji를 만들고 codePoints stream을 끝까지 collect해 source/editor rendering과 무관한 U+ notation value를 조립합니다." },
          { lines: "11-16", explanation: "UTF-16 length4, code point3, surrogate pair와 offsetByCodePoints로 두 code points 뒤의 char offset3을 검증합니다." },
          { lines: "18-23", explanation: "explicit UTF-8로 encode/decode하고 byte length8, same-charset true, wrong-charset false를 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("UnicodeCharsetLab.java", "UnicodeCharsetLab") },
        output: { value: "length=4\ncodePoints=3\nvalues=U+0041,U+1F600,U+D55C\nhigh=true\nlow=true\noffsetAfterTwo=3\nutf8Bytes=8\nroundTrip=true\nwrongCharsetEqual=false", explanation: ["emoji 하나가 UTF-16 units2·UTF-8 bytes4를 차지합니다.", "한글도 explicit UTF-8에서 정상 round trip합니다.", "wrong charset decode는 exception이 없어도 내용이 틀릴 수 있습니다."] },
        experiments: [
          { change: "text.substring(1, 2)로 emoji를 자릅니다.", prediction: "high surrogate 하나만 남아 code point/출력 처리가 깨집니다.", result: "사용자 문자 경계는 offsetByCodePoints 또는 grapheme segmentation으로 계산해야 합니다." },
          { change: "encode/decode 양쪽에서 no-argument default charset을 씁니다.", prediction: "한 machine에서는 통과해도 다른 default charset에서 protocol 결과가 달라질 수 있습니다.", result: "file/network persistence 경계에 explicit charset을 둡니다." },
          { change: "combining mark가 붙은 e를 추가하고 length·codePointCount·화면 글자 수를 비교합니다.", prediction: "code point count와 grapheme count도 달라질 수 있습니다.", result: "UI 문자 단위는 Unicode grapheme 규칙이라는 별도 층입니다." },
        ],
        sourceRefs: ["java-myproject-class01-ex01-string", "java-string-api", "java-character-api", "java-standard-charsets-api", "java-charset-api", "unicode-core-spec"],
      }],
      diagnostics: [
        { symptom: "emoji가 깨지거나 문자열 중간에 replacement symbol이 보인다.", likelyCause: "char index로 surrogate pair를 분리했거나 encode/decode charset이 다릅니다.", checks: ["length와 codePointCount를 비교합니다.", "charAt 위치의 surrogate 여부를 봅니다.", "경계 양쪽 charset을 기록합니다."], fix: "code point/grapheme-aware index를 사용하고 explicit UTF-8로 양쪽을 일치시킵니다.", prevention: "BMP·supplementary·combining sequence를 포함한 round-trip tests를 둡니다." },
        { symptom: "byte 제한을 String.length로 검사했더니 저장 단계에서 초과한다.", likelyCause: "UTF-16 code units와 target encoding bytes를 같은 단위로 취급했습니다.", checks: ["DB/protocol 제한 단위를 확인합니다.", "explicit charset byte length를 계산합니다.", "normalization 정책을 확인합니다."], fix: "domain character limit과 encoded-byte limit을 서로 다른 validation으로 둡니다.", prevention: "boundary test에 ASCII·한글·supplementary·combining inputs를 포함합니다." },
      ],
      expertNotes: ["Java9 이후 compact strings 같은 내부 representation은 public UTF-16 indexing contract를 바꾸지 않으므로 reflection/internal byte layout에 의존하지 않습니다.", "정규화 NFC/NFD는 equality와 검색에 영향을 주지만 무조건 normalize하면 식별자·서명 bytes를 바꿀 수 있어 domain boundary에서 명시해야 합니다."],
    },
    {
      id: "split-regex-limit-substring-masking",
      title: "split은 regex를 받고 limit이 trailing empty 처리와 최대 token 수를 결정하며 substring은 검증된 half-open index를 요구합니다",
      lead: "구분자·빈 field·부분 문자열·masking을 ‘보이는 예제’가 아니라 입력 grammar와 개인정보 최소 공개 정책으로 설계합니다.",
      explanations: [
        "String.split의 첫 인자는 literal delimiter가 아니라 regular expression입니다. dot, pipe, brackets, plus처럼 regex metacharacter를 literal로 나누려면 escape하거나 Pattern.quote를 사용합니다.",
        "limit=0인 기본 split(regex)는 trailing empty strings를 버립니다. limit<0은 trailing empty까지 모두 보존하고, positive n은 최대 n개 결과를 만들며 마지막 token이 나머지 전체를 가집니다. CSV처럼 빈 column이 의미 있으면 기본값을 무심코 쓰면 data loss가 납니다.",
        "split result length와 각 token의 empty/blank 여부는 별도입니다. 연속 delimiter는 중간 empty token을 만들 수 있고 whitespace trimming 정책도 split이 자동으로 해결하지 않습니다.",
        "substring(begin,end)은 begin inclusive, end exclusive이며 UTF-16 code-unit indexes를 사용합니다. 0<=begin<=end<=length를 만족하지 않으면 IndexOutOfBoundsException이고 Unicode supplementary 경계를 자를 수도 있습니다.",
        "고정 index masking은 입력 format이 완전히 검증됐을 때만 안전합니다. 길이가 짧거나 delimiter 위치가 다르면 exception, 잘못된 부분 노출, 전체 원문 log가 발생할 수 있습니다. 먼저 parse/validate하고 필요한 segment만 새 문자열로 조립합니다.",
        "masking은 authorization을 대신하지 않습니다. public response에는 최소 display form만, secure storage/log에는 별도 access control·retention·redaction policy를 적용하고 raw 값이 exception message나 debug output으로 새지 않게 합니다.",
        "부분 문자열이 Java7u6 이후 원본 backing array 전체를 붙잡는 과거 구현 이야기에 의존해서는 안 됩니다. public contract는 새 String value의 내용이며 내부 storage sharing 여부는 구현 세부입니다.",
      ],
      concepts: [
        { term: "regex delimiter", definition: "split이 separator를 찾을 때 해석하는 정규 표현식입니다.", detail: ["literal dot은 Pattern.quote(" + '"."' + ") 또는 \\.입니다.", "untrusted delimiter를 regex로 직접 조합하지 않습니다."] },
        { term: "split limit", definition: "결과 token 수 상한과 trailing empty token 보존 정책을 동시에 정하는 두 번째 인자입니다.", detail: ["0은 trailing empty 제거입니다.", "negative는 모두 보존, positive는 최대 개수입니다."] },
        { term: "half-open range", definition: "begin은 포함하고 end는 제외하는 [begin,end) index 구간입니다.", detail: ["length=end-begin입니다.", "String indexes는 UTF-16 code units입니다."] },
      ],
      codeExamples: [{
        id: "java-string-boundary-parsing",
        title: "dot delimiter·trailing empty·positive limit과 검증 후 masking을 exact로 비교합니다",
        language: "java",
        filename: "StringBoundaryParsingLab.java",
        purpose: "split 기본값의 data loss와 fragile substring masking을 명시적 grammar로 교정합니다.",
        code: String.raw`import java.util.Arrays;
import java.util.regex.Pattern;

public class StringBoundaryParsingLab {
    static String maskStructuredId(String raw) {
        String[] parts = raw.split(Pattern.quote("-"), -1);
        if (parts.length != 3 || !Arrays.stream(parts).allMatch(part -> part.matches("[A-Z]{4}"))) {
            throw new IllegalArgumentException("invalid-structured-id");
        }
        return parts[0] + "-****-" + parts[2];
    }

    public static void main(String[] args) {
        String dotted = "api.example.test";
        System.out.println("dot=" + Arrays.toString(dotted.split(Pattern.quote("."), -1)));

        String row = "alpha,beta,,";
        System.out.println("zero=" + Arrays.toString(row.split(",", 0)));
        System.out.println("negative=" + Arrays.toString(row.split(",", -1)));
        System.out.println("two=" + Arrays.toString(row.split(",", 2)));

        String structured = "ABCD-EFGH-IJKL";
        System.out.println("prefix=" + structured.substring(0, 4));
        System.out.println("masked=" + maskStructuredId(structured));
        try {
            maskStructuredId("SHORT");
        } catch (IllegalArgumentException exception) {
            System.out.println("invalid=" + exception.getMessage());
        }
    }
}`,
        walkthrough: [
          { lines: "1-11", explanation: "literal hyphen을 quoted regex로 split하고 exactly3·각4 uppercase라는 grammar를 검증한 뒤 middle segment만 별표로 대체합니다." },
          { lines: "13-15", explanation: "literal dot을 Pattern.quote로 나눠 regex wildcard 오해를 제거합니다." },
          { lines: "17-20", explanation: "같은 trailing-empty row를 limit0·negative·positive2로 실행해 token 손실과 remainder 차이를 봅니다." },
          { lines: "22-30", explanation: "half-open substring과 valid masking을 출력하고 malformed input은 raw 값 없이 stable error code로 거부합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("StringBoundaryParsingLab.java", "StringBoundaryParsingLab") },
        output: { value: "dot=[api, example, test]\nzero=[alpha, beta]\nnegative=[alpha, beta, , ]\ntwo=[alpha, beta,,]\nprefix=ABCD\nmasked=ABCD-****-IJKL\ninvalid=invalid-structured-id", explanation: ["limit0은 trailing empty2개를 제거하고 negative는 보존합니다.", "positive2의 마지막 token은 beta,, 전체 remainder입니다.", "invalid error에는 raw input이 포함되지 않습니다."] },
        experiments: [
          { change: "dotted.split(\".\")로 바꿉니다.", prediction: "dot이 any-character regex라 기대한 세 labels가 나오지 않습니다.", result: "literal delimiter는 Pattern.quote로 의도를 고정합니다." },
          { change: "row.split(\",\") 결과를 four-column record로 저장합니다.", prediction: "trailing empty columns가 사라져 schema length가2가 됩니다.", result: "빈 trailing field가 의미 있으면 negative limit을 명시합니다." },
          { change: "maskStructuredId에서 validation을 제거하고 raw.substring 고정 index만 씁니다.", prediction: "SHORT에서 index exception이 나고 format variation에서 잘못된 문자가 노출됩니다.", result: "masking 전에 grammar를 parse하고 실패 message에는 raw를 넣지 않습니다." },
        ],
        sourceRefs: ["java-myproject-class01-ex01-string", "java-string-api", "java-pattern-api", "jls-array-access", "owasp-logging"],
      }],
      diagnostics: [
        { symptom: "점으로 나누려 했는데 token이 비거나 전혀 예상과 다르다.", likelyCause: "split 인자의 dot을 literal이 아니라 regex wildcard로 해석했습니다.", checks: ["delimiter에 regex metacharacter가 있는지 봅니다.", "Pattern.quote 사용 여부를 확인합니다.", "limit도 함께 기록합니다."], fix: "literal delimiter는 Pattern.quote(delimiter)로 감싸고 의미 있는 empty tokens에 맞는 limit을 지정합니다.", prevention: "dot·pipe·bracket·trailing empty cases를 parser contract test에 넣습니다." },
        { symptom: "masking code가 짧은 입력에서 죽거나 원문의 일부를 더 노출한다.", likelyCause: "format validation 없이 고정 UTF-16 indexes를 적용했습니다.", checks: ["length와 delimiter positions를 확인합니다.", "supplementary characters 가능성을 봅니다.", "exception/log에 raw가 있는지 scan합니다."], fix: "허용 grammar를 먼저 검증·parse하고 semantic segments 기준으로 최소 display를 조립합니다.", prevention: "short/missing/extra delimiter·Unicode·blank inputs와 public-output privacy scan을 둡니다." },
      ],
      expertNotes: ["java.lang.String.split은 full CSV parser가 아닙니다. quoted delimiter·escaped quote·embedded newline이 필요하면 검증된 CSV library와 explicit dialect를 사용합니다.", "regex가 untrusted이고 복잡해질 수 있으면 catastrophic backtracking/regex injection도 입력 경계 위협 모델에 포함합니다."],
    },
    {
      id: "locale-sensitive-case-format-string-builder",
      title: "case conversion과 format에는 Locale을 명시하고 반복 text 조립에는 StringBuilder ownership을 부여합니다",
      lead: "개발 PC의 default Locale에서 우연히 맞는 문자열을 machine identifier·사용자 표시·protocol text로 분류해 각기 다른 정책을 적용합니다.",
      explanations: [
        "String.toUpperCase()/toLowerCase() no-argument overload는 default Locale에 의존합니다. Turkish의 dotted/dotless I처럼 case mapping이 locale에 따라 달라 machine key·HTTP header·enum-like token normalization이 host 설정에 따라 깨질 수 있습니다.",
        "machine-readable identifier의 case normalization에는 보통 Locale.ROOT를 사용합니다. 사용자에게 보이는 자연어 text에는 사용자의 명시 Locale을 사용하며, 둘을 한 helper로 합치지 않습니다.",
        "String.format도 Locale을 생략하면 decimal/grouping separators가 default에 따라 바뀝니다. display에는 사용자 Locale을 명시하고 protocol/parseable output에는 locale-independent formatter 또는 고정 Locale·schema를 사용합니다.",
        "case conversion은 단일 char가 단일 char로만 바뀐다고 보장하지 않습니다. 일부 Unicode mapping은 길이가 변할 수 있으므로 고정 index·고정 byte length 가정 뒤에 case conversion을 두지 않습니다.",
        "StringBuilder는 mutable character buffer이고 append가 같은 builder를 반환합니다. 한 thread/operation이 ownership을 가지고 loop에서 조립한 뒤 boundary에서 toString으로 immutable snapshot을 만듭니다.",
        "StringBuffer는 method-level synchronization을 제공하지만 compound operation 전체 atomicity를 자동 보장하지 않습니다. shared mutable builder보다 operation-local StringBuilder가 대개 더 단순하고 빠릅니다.",
        "formatting과 concatenation의 성능은 output correctness와 별도입니다. loop에서 +가 자동으로 얼마나 최적화되는지는 compiler/JIT/version/context에 따라 달라질 수 있으므로 hot path는 JMH로 측정합니다.",
      ],
      concepts: [
        { term: "Locale.ROOT", definition: "특정 언어/지역이 아닌 locale-neutral operations를 위한 root locale입니다.", detail: ["machine keys의 case mapping에 적합합니다.", "사용자 자연어 표시 locale을 대신하지 않습니다."] },
        { term: "locale-aware formatting", definition: "숫자·날짜·통화 등의 표시 규칙을 사용자의 language/region convention에 맞추는 변환입니다.", detail: ["grouping/decimal symbols가 달라집니다.", "parseable protocol과 display를 분리합니다."] },
        { term: "builder ownership", definition: "mutable StringBuilder를 한 operation/thread가 독점하고 완성 시 immutable String으로 넘기는 수명 규칙입니다.", detail: ["공유 field builder를 피합니다.", "toString 뒤 builder mutation은 snapshot에 영향이 없습니다."] },
      ],
      codeExamples: [{
        id: "java-locale-builder-formatting",
        title: "ROOT·Turkish case와 US·Germany format, builder snapshot을 고정합니다",
        language: "java",
        filename: "LocaleBuilderFormattingLab.java",
        purpose: "default Locale을 읽지 않고 machine normalization·user display·text assembly를 분리합니다.",
        code: String.raw`import java.util.Locale;

public class LocaleBuilderFormattingLab {
    public static void main(String[] args) {
        String identifier = "file-id";
        Locale turkish = Locale.forLanguageTag("tr-TR");
        System.out.println("root=" + identifier.toUpperCase(Locale.ROOT));
        System.out.println("turkish=" + identifier.toUpperCase(turkish));

        double amount = 12345.5;
        System.out.println("us=" + String.format(Locale.US, "%,.2f", amount));
        System.out.println("de=" + String.format(Locale.GERMANY, "%,.2f", amount));

        StringBuilder builder = new StringBuilder();
        for (String part : new String[] {"alpha", "beta", "gamma"}) {
            if (!builder.isEmpty()) builder.append(" -> ");
            builder.append(part);
        }
        String snapshot = builder.toString();
        builder.append(" -> delta");
        System.out.println("snapshot=" + snapshot);
        System.out.println("current=" + builder);
        System.out.println("capacityEnough=" + (builder.capacity() >= builder.length()));
    }
}`,
        walkthrough: [
          { lines: "1-8", explanation: "같은 identifier를 Locale.ROOT와 explicit Turkish locale로 upper-case해 dotted I 차이를 드러냅니다." },
          { lines: "10-12", explanation: "같은 numeric value를 US/Germany display rules로 formatting해 separator가 schema가 아니라 Locale 결과임을 보입니다." },
          { lines: "14-25", explanation: "operation-local builder로 separator-aware assembly 후 snapshot을 만들고 추가 mutation과 capacity invariant를 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("LocaleBuilderFormattingLab.java", "LocaleBuilderFormattingLab") },
        output: { value: "root=FILE-ID\nturkish=FİLE-İD\nus=12,345.50\nde=12.345,50\nsnapshot=alpha -> beta -> gamma\ncurrent=alpha -> beta -> gamma -> delta\ncapacityEnough=true", explanation: ["machine key는 ROOT에서 stable하지만 Turkish user text mapping은 dotted capital I를 만듭니다.", "숫자 value는 같아도 display separators가 다릅니다.", "snapshot은 builder의 이후 mutation과 분리됩니다."] },
        experiments: [
          { change: "toUpperCase와 String.format에서 Locale을 모두 생략하고 default Locale을 tr-TR/de-DE로 바꿉니다.", prediction: "identifier와 numeric output이 실행 host에 따라 달라집니다.", result: "default Locale은 implicit input이므로 reproducible boundary에는 explicit Locale을 전달합니다." },
          { change: "builder를 static field로 두고 두 requests가 번갈아 append합니다.", prediction: "출력이 섞이고 request data가 서로 노출될 수 있습니다.", result: "mutable builder는 operation-local ownership을 유지합니다." },
          { change: "StringBuffer로 바꾸면 request sequence 전체가 안전하다고 가정합니다.", prediction: "개별 append는 synchronized여도 check-then-append와 lifecycle sharing은 여전히 섞일 수 있습니다.", result: "synchronization primitive보다 ownership 제거가 우선입니다." },
        ],
        sourceRefs: ["java-myproject-class01-ex01-string", "java-string-api", "java-locale-api", "java-formatter-api", "java-string-builder-api", "java-string-buffer-api"],
      }],
      diagnostics: [
        { symptom: "서버 지역을 바꾸자 identifier lookup이나 signature가 실패한다.", likelyCause: "machine token normalization에 default-locale case conversion/formatting을 사용했습니다.", checks: ["no-argument case/format 호출을 찾습니다.", "default Locale을 test에서 바꿉니다.", "persisted key가 locale display인지 확인합니다."], fix: "machine tokens에는 Locale.ROOT 또는 protocol-specified canonicalization을 명시하고 기존 data migration을 설계합니다.", prevention: "tr-TR·de-DE hostile default-locale tests를 CI에 둡니다." },
        { symptom: "동시 요청의 문자열 일부가 서로 섞인다.", likelyCause: "static/instance field의 mutable builder를 여러 operations가 공유했습니다.", checks: ["builder ownership과 lifetime을 그립니다.", "append sequence가 compound atomic인지 봅니다.", "request 종료 뒤 clear/reuse를 확인합니다."], fix: "builder를 method-local로 만들고 완성된 immutable String만 반환합니다.", prevention: "mutable helper를 singleton field로 두지 않는 review rule과 concurrent isolation test를 둡니다." },
      ],
      expertNotes: ["case-insensitive equality는 lower-case 후 equals만으로 모든 언어 요구를 해결하지 않습니다. Unicode case folding, Collator strength, identifier specification을 domain별로 선택합니다.", "String.formatted도 receiver format string과 default Locale을 사용하므로 Locale이 중요한 코드에서는 Formatter/format(Locale,...) 정책을 유지합니다."],
    },
    {
      id: "math-rounding-negative-zero-overflow",
      title: "ceil·floor·round는 음수에서도 수직선 방향으로 읽고 integer overflow는 exact arithmetic으로 실패시킵니다",
      lead: "‘올림·버림·반올림’이라는 일상어를 API의 방향·tie·type 계약으로 바꾸고, 조용히 wrap되는 정수 연산을 domain boundary에서 탐지합니다.",
      explanations: [
        "Math.ceil(x)는 x보다 작지 않은 가장 작은 정수값을 double로 반환하므로 +infinity 방향입니다. -10.7에서는 -10.0입니다. 소수 자릿수를 단순 삭제하는 truncation과 다릅니다.",
        "Math.floor(x)는 x보다 크지 않은 가장 큰 정수값을 double로 반환하므로 -infinity 방향입니다. -10.3과 -10.7 모두 -11.0입니다. 원본의 ‘버림’은 음수에서 방향을 숨기므로 ‘작거나 같은 최대 정수’로 교정합니다.",
        "Math.round(double)는 floor(a+0.5)에 해당하는 long 결과를 반환합니다. +2.5는3, -2.5는-2라서 ‘항상 절댓값이 먼 쪽’이나 금융권의 half-even 규칙이 아닙니다. domain rounding mode가 필요하면 BigDecimal과 RoundingMode를 명시합니다.",
        "double의 NaN·infinity·negative zero에는 별도 계약이 있습니다. NaN 비교와 signed zero를 일반 정수처럼 추론하지 말고 입력 domain을 finite-only로 검증하거나 API 문서의 special-case를 test합니다.",
        "int/long overflow는 Java의 two's-complement low bits로 조용히 wrap됩니다. MAX_VALUE+1이 MIN_VALUE가 되어도 exception이 없으므로 금액·카운터·크기·시간 변환에서 이를 정상값으로 오해할 수 있습니다.",
        "Math.addExact·subtractExact·multiplyExact·incrementExact·negateExact·toIntExact는 overflow 시 ArithmeticException을 던집니다. exception을 무조건 catch해 clamp하지 말고 domain이 reject·widen·saturate 중 무엇을 원하는지 정합니다.",
        "Math.abs(Integer.MIN_VALUE)는 표현 가능한 positive counterpart가 없어 여전히 negative MIN_VALUE입니다. abs를 index나 security normalization에 쓰려면 이 edge를 반드시 처리하고, JDK의 absExact 또는 wider type/domain validation을 고려합니다.",
        "정수 division /는 zero 방향 truncation이고 Math.floorDiv는 -infinity 방향입니다. -7/3=-2지만 floorDiv(-7,3)=-3이며 floorMod와 함께 divisor 기준의 non-negative remainder 정책을 만들 수 있습니다.",
      ],
      concepts: [
        { term: "directed rounding", definition: "값을 특정 수직선 방향 또는 특정 tie rule로 integer-valued result에 mapping하는 계약입니다.", detail: ["ceil은 +infinity, floor는 -infinity입니다.", "round는 floor(x+0.5) rule입니다."] },
        { term: "integer overflow", definition: "연산의 수학적 결과가 primitive 범위를 벗어나 high bits가 사라지고 다른 값으로 wrap되는 상태입니다.", detail: ["기본 int/long arithmetic은 exception을 던지지 않습니다.", "exact methods는 overflow를 failure channel로 바꿉니다."] },
        { term: "floor division", definition: "quotient를 -infinity 방향으로 내려 remainder가 divisor와 일관된 관계를 갖게 하는 division입니다.", detail: ["negative operands에서 /와 다릅니다.", "floorDiv·floorMod를 한 쌍으로 사용합니다."] },
      ],
      codeExamples: [{
        id: "java-math-rounding-overflow",
        title: "음수 rounding·MIN abs·overflow·floor division을 exact contract로 실행합니다",
        language: "java",
        filename: "MathRoundingOverflowLab.java",
        purpose: "Math 원본의 출력 목록을 방향과 failure semantics로 확장합니다.",
        code: String.raw`public class MathRoundingOverflowLab {
    static String failure(Runnable operation) {
        try {
            operation.run();
            return "none";
        } catch (ArithmeticException exception) {
            return exception.getClass().getSimpleName();
        }
    }

    public static void main(String[] args) {
        System.out.println("positive=" + Math.ceil(10.7) + "," + Math.floor(10.7) + "," + Math.round(10.7));
        System.out.println("negative=" + Math.ceil(-10.7) + "," + Math.floor(-10.7) + "," + Math.round(-10.7));
        System.out.println("ties=" + Math.round(2.5) + "," + Math.round(-2.5));

        int wrapped = Integer.MAX_VALUE + 1;
        System.out.println("wrapped=" + wrapped);
        System.out.println("addExact=" + failure(() -> Math.addExact(Integer.MAX_VALUE, 1)));
        System.out.println("toIntExact=" + failure(() -> Math.toIntExact((long) Integer.MAX_VALUE + 1)));
        System.out.println("absMin=" + Math.abs(Integer.MIN_VALUE));
        System.out.println("negateExactMin=" + failure(() -> Math.negateExact(Integer.MIN_VALUE)));

        System.out.println("division=" + (-7 / 3));
        System.out.println("floorDivision=" + Math.floorDiv(-7, 3));
        System.out.println("remainder=" + (-7 % 3));
        System.out.println("floorMod=" + Math.floorMod(-7, 3));
    }
}`,
        walkthrough: [
          { lines: "1-9", explanation: "exact arithmetic operation을 실행하고 ArithmeticException type만 stable result로 반환하는 helper입니다." },
          { lines: "11-14", explanation: "같은 magnitude의 양수/음수와 ±2.5 tie를 비교해 방향 규칙을 드러냅니다." },
          { lines: "16-22", explanation: "silent wrap, add/toInt/negate exact failures, MIN abs edge를 구분합니다." },
          { lines: "24-27", explanation: "truncating division/remainder와 floorDiv/floorMod의 negative operand 차이를 exact로 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("MathRoundingOverflowLab.java", "MathRoundingOverflowLab") },
        output: { value: "positive=11.0,10.0,11\nnegative=-10.0,-11.0,-11\nties=3,-2\nwrapped=-2147483648\naddExact=ArithmeticException\ntoIntExact=ArithmeticException\nabsMin=-2147483648\nnegateExactMin=ArithmeticException\ndivision=-2\nfloorDivision=-3\nremainder=-1\nfloorMod=2", explanation: ["ceil/floor는 음수에서 truncation과 다른 방향을 보입니다.", "기본 overflow와 MIN abs는 조용히 negative가 되지만 exact APIs는 실패합니다.", "floorDiv·floorMod는 q*d+r=-7 관계를 -3*3+2로 유지합니다."] },
        experiments: [
          { change: "Math.round(-2.5)가 -3이라고 예상합니다.", prediction: "actual은-2라 tie test가 실패합니다.", result: "round를 자연어 반올림이 아니라 floor(x+0.5) 계약으로 기억합니다." },
          { change: "Math.abs(hash) % bucketCount로 index를 만듭니다.", prediction: "hash가 MIN_VALUE면 abs도 negative라 index가 음수가 될 수 있습니다.", result: "floorMod(hash,bucketCount) 또는 explicit unsigned/domain policy를 사용합니다." },
          { change: "addExact failure를 Integer.MAX_VALUE로 clamp합니다.", prediction: "program은 계속되지만 초과와 실제 최대값을 구분하지 못합니다.", result: "saturation이 domain requirement일 때만 명시 result/status와 함께 적용합니다." },
        ],
        sourceRefs: ["java-myproject-class02-ex01-math", "java-math-api", "java-big-decimal-api", "java-rounding-mode-api", "jls-integer-operations"],
      }],
      diagnostics: [
        { symptom: "음수 가격/좌표를 floor했는데 예상보다1 작다.", likelyCause: "floor를 소수부 삭제(truncation)로 이해했습니다.", checks: ["input sign을 확인합니다.", "ceil/floor/(long)cast 결과를 나란히 봅니다.", "domain이 어느 방향을 요구하는지 적습니다."], fix: "수직선 방향에 맞는 ceil/floor/truncation/RoundingMode를 명시적으로 선택합니다.", prevention: "+10.7·-10.7·±2.5를 rounding contract tests에 포함합니다." },
        { symptom: "큰 양수 합계가 갑자기 음수가 됐다.", likelyCause: "int/long overflow가 silent wrap됐습니다.", checks: ["operand/result ranges를 계산합니다.", "MAX/MIN boundary test를 실행합니다.", "wider type도 충분한지 확인합니다."], fix: "exact arithmetic 또는 BigInteger/BigDecimal과 domain overflow outcome을 사용합니다.", prevention: "boundary analysis와 property tests에 MAX±1·MIN negation을 넣습니다." },
      ],
      expertNotes: ["StrictMath는 cross-platform reproducibility가 중요한 transcendental functions에 더 엄격한 결과 계약을 제공하지만 기본 산술 rounding mode 선택 문제를 대신하지 않습니다.", "monetary value는 binary floating-point + Math.round의 조합보다 scale·RoundingMode가 명시된 BigDecimal 또는 minor-unit integer를 사용합니다."],
    },
    {
      id: "seeded-random-origin-bound-reproducibility",
      title: "Random은 pseudorandom state machine이며 같은 seed는 재현 sequence, origin/bound는 half-open range 계약을 만듭니다",
      lead: "한 번 나온 숫자를 ‘무작위’라고 부르는 데서 멈추지 않고 seed ownership, range mapping, deterministic tests, concurrency와 algorithm 선택을 분리합니다.",
      explanations: [
        "java.util.Random은 entropy를 매 호출 새로 얻는 것이 아니라 internal state에서 다음 값을 계산하는 pseudorandom generator입니다. 같은 implementation과 같은 seed·같은 호출 순서는 같은 sequence를 재현합니다.",
        "seeded generator는 simulation·fixture·property test를 재현하는 도구입니다. 실패한 test의 seed를 기록하면 같은 path를 다시 실행할 수 있지만, seed만 같고 호출 순서가 달라지면 sequence position도 달라집니다.",
        "nextInt(bound)는0 inclusive부터 bound exclusive까지이고 bound는 positive여야 합니다. Java17의 RandomGenerator 계열 origin/bound overload는 origin inclusive, bound exclusive이며 origin<bound여야 합니다.",
        "(int)(nextDouble()*bound)보다 nextInt(bound)가 intent와 distribution mapping을 더 분명히 표현합니다. Math.abs(nextInt())%bound는 MIN_VALUE edge와 modulo bias를 만들 수 있으므로 피합니다.",
        "Math.random은 편의용 shared pseudorandom source라 explicit seed를 주입하기 어렵고 global call order에 결합됩니다. 재현 가능한 domain service에는 RandomGenerator를 constructor parameter로 전달합니다.",
        "java.util.Random의 seed는 관찰 가능한 output으로 역추정 가능한 보안 비밀이 아닙니다. reset password·session id·API token에는 SecureRandom을 사용합니다.",
        "여러 threads가 한 generator를 공유하면 contention과 호출 interleaving으로 per-task reproducibility가 깨질 수 있습니다. SplittableRandom 또는 modern RandomGenerator splittable/jumpable algorithms를 task-local ownership으로 선택하되 algorithm name과 version을 reproducibility metadata에 기록합니다.",
        "분포 test는 한 작은 표본이 모든 faces를 포함하는지 정도로 quality를 증명하지 못합니다. range invariants는 항상 assert하고 statistical properties는 deterministic seed·충분한 sample·false-positive tolerance를 별도 설계합니다.",
      ],
      concepts: [
        { term: "seed", definition: "pseudorandom generator의 initial state를 결정해 이후 호출 sequence를 재현 가능하게 하는 입력입니다.", detail: ["같은 seed+같은 call order가 필요합니다.", "보안 entropy와 동일하지 않습니다."] },
        { term: "half-open random range", definition: "origin은 포함하고 bound는 제외하는 [origin,bound) 결과 집합입니다.", detail: ["nextInt(6)+1은1~6입니다.", "bound 자체는 절대 나오지 않습니다."] },
        { term: "call-order coupling", definition: "같은 generator state를 소비하는 호출의 개수·순서가 뒤의 모든 pseudorandom 결과를 바꾸는 결합입니다.", detail: ["branch 추가도 sequence를 이동시킵니다.", "subsystem별 generator ownership을 고려합니다."] },
      ],
      codeExamples: [{
        id: "java-seeded-random-ranges",
        title: "같은 seed sequence와 dice/origin bounds, invalid bounds를 deterministic하게 검증합니다",
        language: "java",
        filename: "SeededRandomRangeLab.java",
        purpose: "Random 원본의 nondeterministic8행을 재현 가능한 test seam과 half-open invariants로 바꿉니다.",
        code: String.raw`import java.util.Arrays;
import java.util.Random;

public class SeededRandomRangeLab {
    static int[] take(Random random, int count) {
        int[] values = new int[count];
        for (int index = 0; index < count; index++) values[index] = random.nextInt(100);
        return values;
    }

    static String invalidBound() {
        try {
            new Random(1L).nextInt(0);
            return "none";
        } catch (IllegalArgumentException exception) {
            return exception.getClass().getSimpleName();
        }
    }

    public static void main(String[] args) {
        int[] first = take(new Random(42L), 5);
        int[] replay = take(new Random(42L), 5);
        System.out.println("sequence=" + Arrays.toString(first));
        System.out.println("replay=" + Arrays.equals(first, replay));

        Random ranges = new Random(7L);
        int[] dice = new int[1_000];
        int[] shifted = new int[1_000];
        for (int index = 0; index < dice.length; index++) {
            dice[index] = ranges.nextInt(6) + 1;
            shifted[index] = ranges.nextInt(10, 15);
        }
        System.out.println("diceRange=" + Arrays.stream(dice).allMatch(value -> value >= 1 && value <= 6));
        System.out.println("shiftedRange=" + Arrays.stream(shifted).allMatch(value -> value >= 10 && value < 15));
        System.out.println("samples=" + (dice.length + shifted.length));
        System.out.println("invalidBound=" + invalidBound());
    }
}`,
        walkthrough: [
          { lines: "1-9", explanation: "주입된 Random에서 정해진 call count만 소비하는 helper로 sequence ownership을 드러냅니다." },
          { lines: "11-18", explanation: "non-positive bound가 stable IllegalArgumentException인지 raw message 없이 확인합니다." },
          { lines: "20-24", explanation: "seed42 generators 둘을 독립 생성해 exact sequence와 replay equality를 출력합니다." },
          { lines: "26-36", explanation: "seed7에서 dice1~6과 shifted10~14 총2000 samples를 생성하고 모든 결과의 range contract만 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("SeededRandomRangeLab.java", "SeededRandomRangeLab") },
        output: { value: "sequence=[30, 63, 48, 84, 70]\nreplay=true\ndiceRange=true\nshiftedRange=true\nsamples=2000\ninvalidBound=IllegalArgumentException", explanation: ["java.util.Random seed42의 첫5 호출은 exact regression sequence입니다.", "range tests는 모든2000 results가 half-open mapping 안에 있음을 확인합니다.", "invalid bound의 localized message가 아니라 exception type을 계약으로 둡니다."] },
        experiments: [
          { change: "첫 generator에서 take 전에 nextBoolean을 한 번 호출합니다.", prediction: "internal state가 소비되어 sequence가 달라지고 replay가 false가 됩니다.", result: "seed 외에도 call order가 replay metadata입니다." },
          { change: "dice를 Math.abs(nextInt()) % 6 + 1로 바꿉니다.", prediction: "MIN_VALUE edge와 modulo bias 위험이 들어옵니다.", result: "generator가 제공하는 bound API를 사용합니다." },
          { change: "Random을 singleton으로 공유하고 parallel tasks가 같은 seed output order를 기대합니다.", prediction: "thread scheduling에 따라 task별 sequence가 달라질 수 있습니다.", result: "task별 generator/split policy와 deterministic work partition을 명시합니다." },
        ],
        sourceRefs: ["java-myproject-class02-ex01-math", "java-myproject-class02-ex02-random", "java-myproject-class02-test-games", "java-random-api", "java-random-generator-api", "java-splittable-random-api"],
      }],
      diagnostics: [
        { symptom: "seed를 고정했는데 test result가 달라진다.", likelyCause: "호출 순서·branch·공유 generator interleaving 또는 algorithm이 달라졌습니다.", checks: ["seed와 algorithm 이름을 기록합니다.", "generator를 소비한 call trace를 비교합니다.", "parallel sharing 여부를 봅니다."], fix: "generator를 component/task에 주입하고 deterministic call order와 algorithm/version metadata를 고정합니다.", prevention: "failure report에 seed·algorithm·case index를 남기고 replay test를 둡니다." },
        { symptom: "요청한 상한값이 안 나오거나 범위 밖 index가 나온다.", likelyCause: "exclusive bound를 inclusive로 오해했거나 cast/modulo mapping을 잘못했습니다.", checks: ["요구 range를 수학적 interval로 적습니다.", "origin/bound 변환식을 확인합니다.", "MIN_VALUE와 bound0을 test합니다."], fix: "[origin,bound) API를 직접 사용하고 inclusive upper가 필요하면 overflow-safe transformation을 설계합니다.", prevention: "최솟값·최댓값-1·상한 미출현과 invalid-bound tests를 둡니다." },
      ],
      expertNotes: ["java.util.Random의 algorithm compatibility는 replay에 유용하지만 다른 RandomGenerator algorithm으로 바꾸면 같은 seed가 같은 sequence를 의미하지 않습니다.", "Monte Carlo 재현성에는 seed 하나뿐 아니라 algorithm, stream split topology, iteration order, floating-point reduction order까지 provenance로 남겨야 합니다."],
    },
    {
      id: "secure-random-entropy-token-boundary",
      title: "SecureRandom은 보안 목적 entropy 경계이며 raw token·seed·provider 세부를 학습자료 output에 노출하지 않습니다",
      lead: "재현 가능한 Random과 예측 불가능해야 하는 credential을 분리하고, rejection-free bound API·충분한 entropy·encoding·저장 정책을 함께 설계합니다.",
      explanations: [
        "SecureRandom은 cryptographically strong random numbers를 제공하도록 설계된 API입니다. session identifier, reset token, nonce, key material처럼 공격자가 예측하면 안 되는 값에 사용합니다.",
        "보안 값은 deterministic golden으로 만들 수 없습니다. test에서는 byte length·format·range·raw non-public policy를 assert하고 실제 bytes를 log·snapshot·exception·URL analytics에 남기지 않습니다.",
        "new SecureRandom() 뒤 setSeed(fixed)를 호출한다고 provider-independent deterministic sequence가 보장되지 않습니다. 기존 entropy state에 seed가 보충될 수 있고 provider/algorithm이 다릅니다. test replay용 generator와 production SecureRandom dependency를 interface로 분리합니다.",
        "token entropy는 character 수만으로 정하지 않습니다. unbiased bytes를 충분히 생성한 뒤 Base64 URL-safe no-padding 또는 hex로 encode하고, storage에는 가능하면 token hash·expiry·single-use state를 저장합니다.",
        "alphabet index를 abs(nextInt())%length로 만들면 modulo bias와 MIN edge가 생깁니다. SecureRandom.nextInt(bound)를 사용하거나 random bytes 전체를 standard encoding으로 변환합니다.",
        "SecureRandom.getInstanceStrong은 blocking 가능성과 provider policy가 있어 무조건 더 좋은 기본값이 아닙니다. platform guidance·latency·entropy source를 검토하고 startup/operation SLO 안에서 측정합니다.",
        "난수 token의 equality를 일반 String.equals로 비교하면 timing 측면이 민감할 수 있습니다. 인증 verifier는 token bytes의 cryptographic hash와 constant-time comparison API, rate limit·expiry를 함께 사용합니다.",
        "entropy가 좋아도 token을 query string/referrer/log에 노출하거나 만료·회수 없이 보관하면 보안이 깨집니다. generation은 credential lifecycle 전체의 한 단계입니다.",
      ],
      concepts: [
        { term: "cryptographic entropy", definition: "공격자가 feasible한 계산으로 다음 값을 예측하기 어렵게 하는 randomness 자원입니다.", detail: ["seeded test replay와 목표가 반대입니다.", "OS/provider entropy source와 lifecycle이 중요합니다."] },
        { term: "modulo bias", definition: "균등한 source range 크기가 target bound의 배수가 아닐 때 % mapping이 일부 결과를 더 자주 만드는 편향입니다.", detail: ["nextInt(bound)는 적절한 rejection/mapping을 제공합니다.", "security code에서 손수 range mapping하지 않습니다."] },
        { term: "token lifecycle", definition: "생성·전달·저장·검증·만료·일회성 소비·폐기까지 credential을 관리하는 전체 계약입니다.", detail: ["raw logging을 금지합니다.", "entropy만으로 replay/authorization 문제를 해결하지 못합니다."] },
      ],
      codeExamples: [{
        id: "java-secure-random-boundary",
        title: "16 random bytes와 bounded index를 생성하되 raw는 한 글자도 출력하지 않습니다",
        language: "java",
        filename: "SecureRandomBoundaryLab.java",
        purpose: "nondeterministic security value를 exact public output과 충돌 없이 검증하는 pattern을 보여 줍니다.",
        code: String.raw`import java.security.SecureRandom;

public class SecureRandomBoundaryLab {
    public static void main(String[] args) {
        SecureRandom secureRandom = new SecureRandom();
        byte[] token = new byte[16];
        secureRandom.nextBytes(token);

        int alphabetSize = 32;
        int index = secureRandom.nextInt(alphabetSize);

        System.out.println("generator=SecureRandom");
        System.out.println("tokenBytes=" + token.length);
        System.out.println("indexInRange=" + (index >= 0 && index < alphabetSize));
        System.out.println("rawPublished=false");
        System.out.println("purpose=security-credential");
    }
}`,
        walkthrough: [
          { lines: "1-7", explanation: "default SecureRandom을 만들고128-bit raw buffer를 채우되 bytes를 문자열로 변환하거나 출력하지 않습니다." },
          { lines: "9-10", explanation: "alphabet index는 nextInt(bound)로 unbiased half-open 범위를 요청합니다." },
          { lines: "12-16", explanation: "public evidence는 generator category·length·range invariant·non-public policy·purpose만 exact로 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21", "OS entropy source available"], command: isolatedJavaRun("SecureRandomBoundaryLab.java", "SecureRandomBoundaryLab") },
        output: { value: "generator=SecureRandom\ntokenBytes=16\nindexInRange=true\nrawPublished=false\npurpose=security-credential", explanation: ["실행마다 token/index가 달라도 public output은 contract invariants만 담아 exact입니다.", "raw token의 uniqueness나 nonzero를 작은 표본으로 주장하지 않습니다.", "보안 목적을 replay 가능한 Random과 명시적으로 구분합니다."] },
        experiments: [
          { change: "token bytes를 Base64로 만들어 println합니다.", prediction: "실제 credential material이 log/snapshot에 남아 privacy/security gate가 실패합니다.", result: "public evidence는 length·format predicate·redaction state만 남깁니다." },
          { change: "new Random(42)로 production token을 생성합니다.", prediction: "sequence가 공개 seed로 완전히 replay됩니다.", result: "test determinism과 production unpredictability dependencies를 분리합니다." },
          { change: "secureRandom.setSeed(42) 후 exact sequence를 기대합니다.", prediction: "provider/initial state에 따라 deterministic guarantee가 없어 portable test가 아닙니다.", result: "SecureRandom output 자체를 golden으로 만들지 않습니다." },
        ],
        sourceRefs: ["java-myproject-class02-ex02-random", "java-secure-random-api", "java-message-digest-api", "owasp-session-management", "owasp-forgot-password"],
      }],
      diagnostics: [
        { symptom: "비밀번호 재설정 token을 알 수 없는 사용자가 맞춘다.", likelyCause: "Random/Math.random·짧은 range·predictable seed를 credential에 사용했거나 raw token이 log/URL에서 유출됐습니다.", checks: ["generator type과 entropy bits를 확인합니다.", "token transport/log/referrer를 추적합니다.", "expiry/single-use/rate limit을 확인합니다."], fix: "충분한 SecureRandom bytes, URL-safe encoding, hash-at-rest, short expiry, single use와 leakage cleanup을 함께 적용합니다.", prevention: "credential threat model·secret scanning·redacted observability와 replay/rate-limit tests를 둡니다." },
        { symptom: "SecureRandom test가 CI machine마다 다른 값으로 실패한다.", likelyCause: "nondeterministic raw bytes나 provider name/algorithm을 exact golden으로 저장했습니다.", checks: ["expected output에 raw/encoded token이 있는지 봅니다.", "provider-specific assertion을 찾습니다.", "test 목적이 format인지 replay인지 분리합니다."], fix: "length·range·allowed encoding·non-public invariants만 확인하고 replay logic에는 injectable deterministic fake를 사용합니다.", prevention: "security randomness tests와 deterministic domain tests를 다른 suites/dependencies로 분리합니다." },
      ],
      expertNotes: ["128 random bits는 이상적인 brute-force 관점의 한 기준일 뿐 protocol threat model, online rate, token lifetime, side channels와 함께 평가해야 합니다.", "SecureRandom object 초기화/entropy blocking 특성은 provider별로 다를 수 있어 latency-critical service에서는 startup warm-up과 production telemetry를 설계하되 raw values는 절대 관찰하지 않습니다."],
    },
    {
      id: "legacy-date-calendar-to-java-time",
      title: "Date는 instant carrier, Calendar는 mutable regional view로 격리하고 java.time의 immutable 값으로 migration합니다",
      lead: "원본 Date·Calendar companion의 현재 machine 의존성과0-based month·mutation을 확인한 뒤 Instant·ZoneId·DateTimeFormatter 경계로 옮깁니다.",
      explanations: [
        "java.util.Date는 이름과 달리 현대 Java에서 주로 epoch-millisecond instant를 담는 legacy mutable carrier입니다. toString은 system default time zone으로 표시하므로 같은 Date value도 machine마다 화면 문자열이 다를 수 있습니다.",
        "Calendar는 time zone·locale·여러 fields를 가진 mutable abstraction이고 MONTH가0~11입니다. get/set/add 호출 순서, lenient normalization, shared mutation 때문에 local reasoning이 어렵습니다.",
        "SimpleDateFormat은 mutable하고 thread-safe하지 않으며 생성 시 default Locale/TimeZone을 캡처할 수 있습니다. static singleton formatter를 여러 threads가 공유하지 말고 가능하면 immutable·thread-safe DateTimeFormatter로 이동합니다.",
        "Date.toInstant와 Date.from(instant)는 legacy API boundary adapter입니다. Calendar.toInstant도 absolute timeline으로 옮길 수 있고, regional local fields가 필요하면 calendar의 TimeZone을 ZoneId로 함께 보존합니다.",
        "Instant는 UTC timeline point이고 human calendar date/time을 직접 갖는 type이 아닙니다. 표시하거나 calendar 단위를 더하려면 explicit ZoneId로 ZonedDateTime/LocalDate를 얻습니다.",
        "legacy Calendar.add(DAY_OF_MONTH,2)는 calendar-local date arithmetic이고 Instant.plus(2,DAYS)는 정확히48 elapsed hours입니다. DST가 있는 zone에서는 결과가 다를 수 있으므로 migration 때 operation 의미를 먼저 분류합니다.",
        "Date가 mutable하므로 public API에서 그대로 보관/반환하면 caller가 setTime으로 내부 state를 바꿀 수 있습니다. defensive copy 또는 즉시 Instant conversion으로 ownership을 끊습니다.",
        "java.sql.Date/Timestamp는 JDBC mapping이라는 별도 legacy family입니다. 이름이 비슷하다고 java.util.Date와 섞지 말고 JDBC version과 database column semantics에 맞춰 LocalDate·LocalDateTime·Instant mapping을 선택합니다.",
      ],
      concepts: [
        { term: "legacy adapter boundary", definition: "기존 Date/Calendar API를 application 내부의 java.time types로 즉시 변환하고 바깥쪽에만 격리하는 경계입니다.", detail: ["Date↔Instant를 사용합니다.", "TimeZone↔ZoneId를 함께 보존합니다."] },
        { term: "calendar arithmetic", definition: "지역 달력의 year/month/day fields를 기준으로 더하고 빼는 연산입니다.", detail: ["elapsed Duration과 다를 수 있습니다.", "DST·month length·leap year가 개입합니다."] },
        { term: "defensive copy", definition: "mutable value를 저장·반환할 때 별도 object로 복제해 외부 mutation이 내부 state에 도달하지 못하게 하는 방법입니다.", detail: ["legacy Date API에 필요할 수 있습니다.", "immutable Instant는 공유해도 됩니다."] },
      ],
      codeExamples: [{
        id: "java-legacy-date-migration",
        title: "고정 Instant를 Date·Calendar로 왕복하고 immutable modern result와 비교합니다",
        language: "java",
        filename: "LegacyDateMigrationLab.java",
        purpose: "현재 machine과 무관한 legacy adapter, explicit UTC, month offset, mutable/immutable 차이를 실행합니다.",
        code: String.raw`import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class LegacyDateMigrationLab {
    public static void main(String[] args) {
        Instant fixed = Instant.parse("2025-01-10T12:34:56Z");
        Date legacyDate = Date.from(fixed);
        System.out.println("legacyToInstant=" + legacyDate.toInstant());

        SimpleDateFormat legacyFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss 'UTC'", Locale.ROOT);
        legacyFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
        System.out.println("legacyFormatted=" + legacyFormat.format(legacyDate));

        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"), Locale.ROOT);
        calendar.setTime(legacyDate);
        System.out.println("calendarMonthZeroBased=" + calendar.get(Calendar.MONTH));
        calendar.add(Calendar.DAY_OF_MONTH, 2);
        System.out.println("calendarPlusTwo=" + calendar.toInstant());

        Instant modernPlusTwo = fixed.plus(2, ChronoUnit.DAYS);
        System.out.println("modernPlusTwo=" + modernPlusTwo);
        System.out.println("legacyDateUnchanged=" + legacyDate.toInstant().equals(fixed));
        System.out.println("sameResultInUtc=" + calendar.toInstant().equals(modernPlusTwo));
    }
}`,
        walkthrough: [
          { lines: "1-13", explanation: "fixed Instant를 legacy Date로 바꾸고 다시 Instant로 읽어 absolute value를 보존합니다." },
          { lines: "15-17", explanation: "SimpleDateFormat에는 Locale.ROOT와 UTC를 모두 명시해 system defaults를 제거합니다." },
          { lines: "19-23", explanation: "UTC Calendar에 Date를 넣고 January의 zero-based month0과 mutable add 결과를 봅니다." },
          { lines: "25-28", explanation: "immutable Instant.plus 결과, original Date unchanged, UTC에서 두 연산 결과 equality를 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("LegacyDateMigrationLab.java", "LegacyDateMigrationLab") },
        output: { value: "legacyToInstant=2025-01-10T12:34:56Z\nlegacyFormatted=2025-01-10 12:34:56 UTC\ncalendarMonthZeroBased=0\ncalendarPlusTwo=2025-01-12T12:34:56Z\nmodernPlusTwo=2025-01-12T12:34:56Z\nlegacyDateUnchanged=true\nsameResultInUtc=true", explanation: ["January Calendar.MONTH는0이지만 modern month value는1 기반입니다.", "Calendar는 자신이 변하고 Instant.plus는 새 값입니다.", "UTC에는 이 구간 DST가 없어 calendar2일과 elapsed48시간이 같습니다."] },
        experiments: [
          { change: "formatter의 setTimeZone을 제거하고 JVM default zone을 바꿉니다.", prediction: "legacyFormatted clock fields가 달라집니다.", result: "Date value와 display zone은 별도 입력입니다." },
          { change: "같은 연산을 DST 전환이 있는 regional Calendar에서 수행합니다.", prediction: "local2일과 elapsed48시간의 wall-clock 결과가 다를 수 있습니다.", result: "migration은 method 치환이 아니라 arithmetic semantics 선택입니다." },
          { change: "static SimpleDateFormat 하나를 여러 threads에서 동시에 사용합니다.", prediction: "mutable parser/formatter state가 경쟁해 잘못된 result나 failure가 날 수 있습니다.", result: "immutable DateTimeFormatter 또는 operation-local legacy adapter를 사용합니다." },
        ],
        sourceRefs: ["java-myproject-class02-ex03-date", "java-myproject-class02-ex04-calendar", "java-date-api", "java-calendar-api", "java-simple-date-format-api", "java-instant-api", "java-date-time-formatter-api"],
      }],
      diagnostics: [
        { symptom: "같은 Date가 서버마다 다른 날짜/시각 문자열로 보인다.", likelyCause: "Date.toString 또는 default-zone SimpleDateFormat이 machine time zone을 implicit input으로 사용했습니다.", checks: ["epoch millis/Instant를 비교합니다.", "formatter/JVM default zone을 기록합니다.", "DB value의 zone semantics를 확인합니다."], fix: "내부에서는 Instant를 보존하고 표시 boundary에 explicit ZoneId·Locale·DateTimeFormatter를 사용합니다.", prevention: "UTC와 두 regional zones에서 같은 instant display tests를 둡니다." },
        { symptom: "Calendar month가 한 달 작거나 shared object의 날짜가 갑자기 바뀐다.", likelyCause: "zero-based MONTH와 mutable add/set를 놓쳤습니다.", checks: ["Calendar.MONTH+1 변환을 찾습니다.", "alias references를 추적합니다.", "lenient mode와 operation order를 확인합니다."], fix: "LocalDate/ZonedDateTime으로 즉시 변환해1-based immutable model을 사용하고 legacy return에는 defensive copy를 둡니다.", prevention: "January/December·leap day와 no-alias mutation tests를 migration suite에 넣습니다." },
      ],
      expertNotes: ["DateTimeFormatter는 thread-safe지만 formatter가 붙은 Locale/Zone/ResolverStyle의 의미는 여전히 명시해야 합니다.", "DB TIMESTAMP WITHOUT TIME ZONE을 Instant로 자동 해석하면 원래 zone 정보가 없으므로 schema semantics와 write/read zone policy를 먼저 복구해야 합니다."],
    },
    {
      id: "clock-injection-instant-local-types",
      title: "현재 시각은 Clock으로 주입하고 Instant·LocalDate·LocalDateTime을 domain 의미에 맞춰 선택합니다",
      lead: "now()를 여기저기 호출해 flaky boundary를 만드는 대신 한 Clock과 한 snapshot을 service input으로 만들고, timeline·calendar·wall time을 type으로 구분합니다.",
      explanations: [
        "Instant.now()와 LocalDate.now()는 편리하지만 system clock/time zone이라는 숨은 input을 읽습니다. 자정·초 경계에서 여러 now 호출이 서로 다른 날짜/시각을 보고 test가 간헐적으로 실패할 수 있습니다.",
        "Clock은 instant와 zone을 함께 제공하는 abstraction입니다. production에는 systemUTC/system(zone), test에는 Clock.fixed, simulation에는 Clock.offset/tick을 주입해 같은 service code를 재현합니다.",
        "한 operation이 ‘지금’을 여러 번 필요로 하면 Clock에서 Instant를 한 번 snapshot해 아래 methods에 전달합니다. 시간이 실제로 흐르는 workflow라면 각 step의 sampling point와 deadline을 명시합니다.",
        "Instant는 global timeline point로 event timestamp·expiry·ordering에 적합합니다. LocalDate는 생일·영업일처럼 zone에서 정해진 날짜이고, LocalDateTime은 zone/offset 없는 wall-clock fields라 단독으로 global event를 식별하지 못합니다.",
        "ZonedDateTime은 LocalDateTime+ZoneId+resolved offset으로 regional schedule에 적합하고 OffsetDateTime은 offset을 보존하지만 future regional rule identity는 없습니다. 목적별로 최소 충분한 type을 고릅니다.",
        "java.time objects는 immutable입니다. plusDays·with·atZone은 새 object를 반환하므로 원본을 재사용해 before/after를 비교할 수 있지만 반환값을 버리면 변화가 적용되지 않습니다.",
        "expiry 비교는 boundary equality를 정책으로 정해야 합니다. 예제는 now가 deadline과 같으면 expired라는 [created,deadline) half-open validity를 사용합니다. ‘이후’인지 ‘이상’인지 이름과 test에 드러냅니다.",
        "Clock.fixed는 business test를 deterministic하게 만들지만 production time synchronization, monotonic elapsed measurement, leap-second handling을 대신하지 않습니다. duration timeout에는 System.nanoTime 같은 monotonic source가 더 맞을 수 있습니다.",
      ],
      concepts: [
        { term: "Clock injection", definition: "현재 instant/zone source를 constructor나 parameter로 전달해 system time 의존성을 명시하는 설계입니다.", detail: ["Clock.fixed로 exact tests가 가능합니다.", "한 operation snapshot을 재사용합니다."] },
        { term: "timeline type", definition: "전 세계 공통 시간선의 한 지점을 표현하는 Instant 같은 type입니다.", detail: ["event ordering/expiry에 적합합니다.", "calendar fields를 보려면 zone이 필요합니다."] },
        { term: "wall-clock type", definition: "지역 시계에 보이는 year-month-day-hour fields를 표현하지만 단독으로 instant를 결정하지 못하는 LocalDateTime 같은 type입니다.", detail: ["DST gap에는 존재하지 않을 수 있습니다.", "overlap에는 두 instants가 대응할 수 있습니다."] },
      ],
      codeExamples: [{
        id: "java-clock-injected-time",
        title: "fixed Clock으로 서울 local view와 expiry boundary, offset simulation을 exact 실행합니다",
        language: "java",
        filename: "ClockInjectedJavaTimeLab.java",
        purpose: "현재 시각 기반 logic을 자정/실행 timing과 무관한 deterministic contract로 바꿉니다.",
        code: String.raw`import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

public class ClockInjectedJavaTimeLab {
    record DeadlinePolicy(Clock clock) {
        boolean isExpired(Instant deadline) {
            return !Instant.now(clock).isBefore(deadline);
        }
    }

    public static void main(String[] args) {
        Instant fixedInstant = Instant.parse("2025-03-08T12:34:56Z");
        ZoneId seoul = ZoneId.of("Asia/Seoul");
        Clock clock = Clock.fixed(fixedInstant, seoul);

        Instant snapshot = clock.instant();
        ZonedDateTime zonedSnapshot = snapshot.atZone(clock.getZone());
        LocalDate dateSnapshot = zonedSnapshot.toLocalDate();
        LocalDateTime dateTimeSnapshot = zonedSnapshot.toLocalDateTime();
        System.out.println("instant=" + snapshot);
        System.out.println("zoned=" + zonedSnapshot);
        System.out.println("date=" + dateSnapshot);
        System.out.println("dateTime=" + dateTimeSnapshot);

        DeadlinePolicy policy = new DeadlinePolicy(clock);
        System.out.println("expiredAtBoundary=" + policy.isExpired(fixedInstant));
        System.out.println("futureExpired=" + policy.isExpired(fixedInstant.plusSeconds(1)));

        Clock twoHoursLater = Clock.offset(clock, Duration.ofHours(2));
        System.out.println("offsetInstant=" + Instant.now(twoHoursLater));

        LocalDate original = dateSnapshot;
        LocalDate tomorrow = original.plusDays(1);
        System.out.println("original=" + original);
        System.out.println("tomorrow=" + tomorrow);
    }
}`,
        walkthrough: [
          { lines: "1-14", explanation: "Clock을 record service dependency로 받고 deadline equality를 expired로 정의합니다." },
          { lines: "16-19", explanation: "고정 Instant와 Asia/Seoul zone을 가진 Clock을 구성합니다." },
          { lines: "21-28", explanation: "clock을 한 번만 읽은 Instant snapshot에서 ZonedDateTime·LocalDate·LocalDateTime views를 파생하고 네 표현을 출력합니다." },
          { lines: "30-35", explanation: "deadline boundary/future와 Clock.offset2시간 simulation을 exact로 검증합니다." },
          { lines: "37-41", explanation: "같은 snapshot의 LocalDate에 plusDays를 적용해 original을 바꾸지 않고 새 tomorrow를 반환함을 보입니다." },
        ],
        run: { environment: ["OpenJDK 21", "JDK tzdb containing Asia/Seoul"], command: isolatedJavaRun("ClockInjectedJavaTimeLab.java", "ClockInjectedJavaTimeLab") },
        output: { value: "instant=2025-03-08T12:34:56Z\nzoned=2025-03-08T21:34:56+09:00[Asia/Seoul]\ndate=2025-03-08\ndateTime=2025-03-08T21:34:56\nexpiredAtBoundary=true\nfutureExpired=false\noffsetInstant=2025-03-08T14:34:56Z\noriginal=2025-03-08\ntomorrow=2025-03-09", explanation: ["같은 instant가 서울에서21:34:56 local view가 됩니다.", "expiry equality 정책과1초 미래가 반대로 나옵니다.", "Clock.offset은 system sleep 없이 미래 simulation을 제공합니다."] },
        experiments: [
          { change: "DeadlinePolicy의 Instant.now(clock)을 no-argument Instant.now()로 바꿉니다.", prediction: "fixed Clock test가 무력화되고 system 실행 시각에 따라 결과가 달라집니다.", result: "시간 의존성은 object graph 끝까지 주입해야 합니다." },
          { change: "Clock.fixed의 zone을 UTC로 바꿉니다.", prediction: "instant는 같지만 LocalDateTime은12:34:56으로 바뀝니다.", result: "timeline equality와 local presentation equality를 구분합니다." },
          { change: "isExpired를 now.isAfter(deadline)로 바꿉니다.", prediction: "deadline과 같은 순간에 expiredAtBoundary가 false가 됩니다.", result: "boundary inclusivity는 implementation detail이 아니라 business contract입니다." },
        ],
        sourceRefs: ["java-myproject-class02-ex05-localdate", "java-clock-api", "java-instant-api", "java-local-date-api", "java-local-date-time-api", "java-zone-id-api", "java-zoned-date-time-api"],
      }],
      diagnostics: [
        { symptom: "자정 근처에서 today와 deadline 계산 test가 가끔 하루 차이 난다.", likelyCause: "LocalDate.now/Instant.now를 여러 번, 서로 다른 default zones에서 호출했습니다.", checks: ["now call count와 위치를 찾습니다.", "각 API가 읽는 zone을 확인합니다.", "실패 timestamp가 자정/초 경계인지 봅니다."], fix: "Clock을 주입하고 operation 시작에서 한 instant/date를 snapshot해 전달합니다.", prevention: "Clock.fixed로 자정 직전/직후·deadline equality tests를 둡니다." },
        { symptom: "DB의 LocalDateTime 두 값이 같은데 실제 event 순서를 정할 수 없다.", likelyCause: "zone/offset 없는 wall-clock fields를 global timestamp로 저장했습니다.", checks: ["source zone이 저장됐는지 봅니다.", "DST overlap 가능성을 확인합니다.", "column semantics를 확인합니다."], fix: "event에는 Instant/offset을 저장하고 regional schedule에는 ZoneId+LocalDateTime을 별도 보존합니다.", prevention: "temporal field마다 timeline/date/wall-schedule semantic type을 schema review에 기록합니다." },
      ],
      expertNotes: ["Clock.tick은 resolution을 낮춰 caching/batching에 쓸 수 있지만 boundary가 quantized되어 expiry semantics가 달라질 수 있으므로 명시 test가 필요합니다.", "distributed systems의 wall clocks는 skew/jump할 수 있으므로 causality/order에는 database sequence·logical clock·version도 함께 고려합니다."],
    },
    {
      id: "zoned-date-time-dst-gap-overlap",
      title: "ZoneId rules는 DST gap의 존재하지 않는 local time과 overlap의 두 가능한 instants를 해석합니다",
      lead: "LocalDateTime에 zone을 붙이면 언제나 유일한 instant가 된다는 착각을 버리고, gap normalization·overlap offset 선택·calendar day와24 elapsed hours를 검증합니다.",
      explanations: [
        "ZoneOffset은 +09:00 같은 한 순간의 offset이고 ZoneId는 Asia/Seoul·America/New_York처럼 역사·미래 전환 rules의 identity입니다. future regional schedule에는 고정 offset만 저장하면 rule 변화를 표현할 수 없습니다.",
        "spring-forward gap에는 시계가 건너뛴 local times가 존재하지 않습니다. New York 2024-03-10 02:30은 valid offset0개이며 LocalDateTime.atZone은 기본적으로 gap 길이만큼 앞으로 밀어03:30-04:00으로 resolve합니다.",
        "fall-back overlap에는 같은 local time이 두 instants에 대응합니다. New York 2024-11-03 01:30은 -04:00과-05:00 offsets가 모두 유효하고 둘은 timeline에서3600초 떨어집니다.",
        "atZone의 overlap 기본은 보통 이전/earlier offset을 선택하며 withLaterOffsetAtOverlap으로 다른 instant를 선택할 수 있습니다. 예약 입력이라면 사용자/domain 정책으로 offset을 선택하거나 ambiguity를 명시 오류로 돌려야 합니다.",
        "ZonedDateTime.plusDays(1)는 local timeline에서 같은 wall-clock time을 유지하려는 date-based 연산이라 DST spring gap을 지나 elapsed23시간이 될 수 있습니다. plusHours(24)는 instant timeline24시간이라 다음 날13시가 됩니다.",
        "Period는 years/months/days calendar amount, Duration은 seconds/nanos elapsed amount입니다. ‘하루’를 영업일/다음 calendar date/정확히86400초 중 어느 의미로 쓰는지 type과 이름에 드러냅니다.",
        "tzdb rules는 법·정책 변경으로 JDK update에서 바뀔 수 있습니다. 미래 schedule을 materialize한 instant만 저장하지 말고 original local time·ZoneId·rule-version/recalculation policy를 고려합니다.",
        "DST test는 host default zone에 기대지 않고 historical transition이 명확한 ZoneId와 date를 explicit하게 사용합니다. current date나 현재 tzdb display name을 golden에 넣지 않습니다.",
      ],
      concepts: [
        { term: "DST gap", definition: "offset이 앞으로 이동해 어떤 local clock interval에 유효한 instant가 하나도 없는 구간입니다.", detail: ["valid offsets count가0입니다.", "default atZone은 gap 뒤로 shift합니다."] },
        { term: "DST overlap", definition: "offset이 뒤로 이동해 같은 local clock interval이 두 번 나타나 valid instants가 둘인 구간입니다.", detail: ["valid offsets count가2입니다.", "earlier/later offset 정책이 필요합니다."] },
        { term: "calendar versus elapsed amount", definition: "local calendar fields를 보존하는 Period/date unit과 timeline seconds를 보존하는 Duration/time unit의 차이입니다.", detail: ["DST를 지날 때 결과가 갈립니다.", "day=24h라고 항상 가정하지 않습니다."] },
      ],
      codeExamples: [{
        id: "java-zoned-dst-gap-overlap",
        title: "New York의2024 gap·overlap과 plusDays/plusHours를 exact 비교합니다",
        language: "java",
        filename: "ZonedDateTimeDstLab.java",
        purpose: "존재하지 않는 local time, ambiguous local time,23시간 calendar day를 직접 재현합니다.",
        code: String.raw`import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

public class ZonedDateTimeDstLab {
    public static void main(String[] args) {
        ZoneId zone = ZoneId.of("America/New_York");

        LocalDateTime gapLocal = LocalDateTime.of(2024, 3, 10, 2, 30);
        System.out.println("gapOffsets=" + zone.getRules().getValidOffsets(gapLocal).size());
        System.out.println("isGap=" + zone.getRules().getTransition(gapLocal).isGap());
        System.out.println("gapResolved=" + gapLocal.atZone(zone));

        LocalDateTime overlapLocal = LocalDateTime.of(2024, 11, 3, 1, 30);
        System.out.println("overlapOffsets=" + zone.getRules().getValidOffsets(overlapLocal));
        ZonedDateTime earlier = overlapLocal.atZone(zone);
        ZonedDateTime later = earlier.withLaterOffsetAtOverlap();
        System.out.println("earlier=" + earlier);
        System.out.println("later=" + later);
        System.out.println("overlapSeconds=" + Duration.between(earlier.toInstant(), later.toInstant()).toSeconds());

        ZonedDateTime beforeSpring = ZonedDateTime.of(2024, 3, 9, 12, 0, 0, 0, zone);
        ZonedDateTime plusDay = beforeSpring.plusDays(1);
        ZonedDateTime plusHours = beforeSpring.plusHours(24);
        System.out.println("plusDay=" + plusDay);
        System.out.println("plusDayElapsedHours=" + Duration.between(beforeSpring, plusDay).toHours());
        System.out.println("plus24Hours=" + plusHours);
    }
}`,
        walkthrough: [
          { lines: "1-13", explanation: "explicit New York zone에서 gap local02:30의 valid offsets0, transition gap true, default03:30 resolution을 확인합니다." },
          { lines: "15-21", explanation: "overlap local01:30의 two offsets와 earlier/later ZonedDateTime, 두 instants 사이3600초를 봅니다." },
          { lines: "23-29", explanation: "spring transition 전날 정오에서 calendar plusDay와 elapsed plus24Hours가12시/13시로 갈리고 전자는23시간임을 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21", "JDK tzdb with America/New_York 2024 rules"], command: isolatedJavaRun("ZonedDateTimeDstLab.java", "ZonedDateTimeDstLab") },
        output: { value: "gapOffsets=0\nisGap=true\ngapResolved=2024-03-10T03:30-04:00[America/New_York]\noverlapOffsets=[-04:00, -05:00]\nearlier=2024-11-03T01:30-04:00[America/New_York]\nlater=2024-11-03T01:30-05:00[America/New_York]\noverlapSeconds=3600\nplusDay=2024-03-10T12:00-04:00[America/New_York]\nplusDayElapsedHours=23\nplus24Hours=2024-03-10T13:00-04:00[America/New_York]", explanation: ["gap은0 offsets, overlap은2 offsets입니다.", "같은 overlap local fields가 한 시간 차이의 두 instants를 만듭니다.", "calendar1일은 이 전환에서23 elapsed hours이고24시간 뒤 wall clock은13시입니다."] },
        experiments: [
          { change: "overlap 예약에서 offset을 저장하지 않고 LocalDateTime만 저장합니다.", prediction: "01:30이 두 instants 중 어느 것인지 복원할 수 없습니다.", result: "ambiguous schedule에는 ZoneId와 chosen offset/ambiguity policy를 함께 보존합니다." },
          { change: "배송 마감+1일을 plusHours(24)로 구현합니다.", prediction: "DST 뒤 wall clock 마감 시간이 한 시간 이동합니다.", result: "calendar deadline은 plusDays/Period, elapsed TTL은 Duration을 사용합니다." },
          { change: "JVM default zone에 의존해 같은 test를 실행합니다.", prediction: "DST가 없는 zone에서는 gap/overlap case 자체가 사라집니다.", result: "temporal tests에 ZoneId를 explicit fixture로 둡니다." },
        ],
        sourceRefs: ["java-myproject-class02-ex04-calendar", "java-zone-id-api", "java-zone-rules-api", "java-zone-offset-transition-api", "java-zoned-date-time-api", "java-period-api", "java-duration-api"],
      }],
      diagnostics: [
        { symptom: "예약02:30이03:30으로 저장되거나 중복01:30 중 다른 회차에 실행된다.", likelyCause: "DST gap/overlap을 검증하지 않고 LocalDateTime.atZone default resolution을 그대로 사용했습니다.", checks: ["ZoneRules.getValidOffsets size를 봅니다.", "transition isGap/isOverlap을 확인합니다.", "chosen offset이 저장됐는지 봅니다."], fix: "gap은 reject/shift 정책, overlap은 earlier/later/user choice 정책을 명시하고 original input과 decision을 보존합니다.", prevention: "각 supported zone의 gap/overlap fixtures와 round-trip tests를 둡니다." },
        { symptom: "하루 뒤 SLA가23시간 또는25시간으로 측정된다.", likelyCause: "calendar day와 elapsed24h 의미가 섞였습니다.", checks: ["plusDays/Period와 plusHours/Duration 사용을 비교합니다.", "zone transition을 확인합니다.", "SLA 문구가 wall clock인지 elapsed인지 분류합니다."], fix: "calendar schedule은 date-based, TTL/SLA elapsed는 Duration/Instant-based arithmetic을 사용합니다.", prevention: "DST 양방향 transition과 leap-day를 duration tests에 포함합니다." },
      ],
      expertNotes: ["ZonedDateTime.ofStrict는 주어진 LocalDateTime·ZoneOffset·ZoneId 조합이 유효하지 않으면 실패시켜 silent gap adjustment를 피할 수 있습니다.", "future recurring event는 local rule intent를 보존하고 실행 직전에 현재 tzdb로 resolve하는 전략과 이미 확정한 instant를 보존하는 전략의 tradeoff를 명시해야 합니다."],
    },
    {
      id: "day-of-week-chrono-unit-adjusters",
      title: "DayOfWeek는 ISO1~7이고 ChronoUnit.between 방향과 TemporalAdjusters의 strict 여부를 호출부에서 읽습니다",
      lead: "원본의1~9 주석을 교정하고 ‘두 날짜 차이’와 ‘다음 월요일’처럼 자연어가 숨기는 argument order·complete unit·same-day 정책을 exact dates로 고정합니다.",
      explanations: [
        "DayOfWeek.getValue는 ISO-8601에서 MONDAY=1부터 SUNDAY=7까지입니다. 원본 주석의1~9는 factual error이며 enum constants도 일곱 개뿐입니다. Calendar.DAY_OF_WEEK의 SUNDAY=1 체계와 섞지 않습니다.",
        "ChronoUnit.DAYS.between(startInclusive,endExclusive)는 end-start 방향의 signed complete units입니다. start가 earlier면 positive, arguments를 뒤집으면 같은 magnitude의 negative가 됩니다.",
        "YEARS/MONTHS between은 단순 field subtraction이 아니라 complete units를 계산하므로 month-end에서 직관과 다를 수 있습니다. billing month·달력 page count·elapsed days 중 domain 정의를 먼저 정합니다.",
        "TemporalAdjusters.next(MONDAY)는 현재 날짜가 Monday여도 반드시 다음 주 Monday를 반환합니다. nextOrSame은 이미 Monday면 같은 날을 반환합니다. ‘다음’의 business 문구가 strict인지 inclusive인지 명시합니다.",
        "lastDayOfMonth는 leap year와 month length를 반영하고 firstDayOfNextMonth는 year boundary도 처리합니다. 수동28/30/31 switch를 만들지 않습니다.",
        "with(adjuster)와 plus/minus는 immutable result를 반환합니다. chained expression에서 intermediate receiver의 type/zone을 유지하지만 원본 variable은 바뀌지 않습니다.",
        "LocalDate 비교는 date-only domain에 적합하고 Instant duration은 event timeline에 적합합니다. ChronoUnit.DAYS between two Instants는 exact24h chunks이지 regional calendar dates 차이가 아닙니다.",
        "adjuster를 business rule로 재사용할 수 있지만 holiday/calendar data가 필요한 영업일은 weekend만 건너뛰는 generic rule로 충분하지 않습니다. region/version이 명시된 business calendar service가 필요합니다.",
      ],
      concepts: [
        { term: "ISO day-of-week value", definition: "Monday1·Tuesday2·...·Sunday7인 DayOfWeek enum의 numeric contract입니다.", detail: ["Calendar Sunday1 체계와 다릅니다.", "ordinal 대신 getValue를 사용합니다."] },
        { term: "between direction", definition: "ChronoUnit.between(first,second)가 first에서 second로 이동하는 signed complete-unit 수를 반환하는 argument order입니다.", detail: ["reverse하면 sign이 바뀝니다.", "unit별 complete-unit semantics가 있습니다."] },
        { term: "strict adjuster", definition: "현재 값과 조건이 같아도 이후/이전의 다른 occurrence를 선택하는 next/previous 같은 조정입니다.", detail: ["nextOrSame/previousOrSame은 inclusive입니다.", "business wording과 맞춰 선택합니다."] },
      ],
      codeExamples: [{
        id: "java-temporal-rules",
        title: "Saturday 기준 weekday value·signed between·next/nextOrSame·month end를 exact 실행합니다",
        language: "java",
        filename: "TemporalRulesLab.java",
        purpose: "DayOfWeek 오류와 날짜 차이/adjuster boundary를 current date 없이 교정합니다.",
        code: String.raw`import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;

public class TemporalRulesLab {
    public static void main(String[] args) {
        LocalDate base = LocalDate.of(2025, 3, 8);
        LocalDate target = LocalDate.of(2025, 3, 17);
        System.out.println("weekday=" + base.getDayOfWeek());
        System.out.println("weekdayValue=" + base.getDayOfWeek().getValue());
        System.out.println("forwardDays=" + ChronoUnit.DAYS.between(base, target));
        System.out.println("reverseDays=" + ChronoUnit.DAYS.between(target, base));

        LocalDate monday = LocalDate.of(2025, 3, 10);
        LocalDate leapFebruary = LocalDate.of(2024, 2, 10);
        System.out.println("baseNextMonday=" + base.with(TemporalAdjusters.next(DayOfWeek.MONDAY)));
        System.out.println("mondayNext=" + monday.with(TemporalAdjusters.next(DayOfWeek.MONDAY)));
        System.out.println("mondayNextOrSame=" + monday.with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY)));
        System.out.println("lastOfMonth=" + base.with(TemporalAdjusters.lastDayOfMonth()));
        System.out.println("firstNextMonth=" + base.with(TemporalAdjusters.firstDayOfNextMonth()));
        System.out.println("leapLastDay=" + leapFebruary.with(TemporalAdjusters.lastDayOfMonth()));

        LocalDate changed = base.plusDays(1);
        System.out.println("baseUnchanged=" + base);
        System.out.println("changed=" + changed);
    }
}`,
        walkthrough: [
          { lines: "1-9", explanation: "current time 대신 fixed Saturday와9일 뒤 target을 준비합니다." },
          { lines: "10-13", explanation: "SATURDAY의 ISO value6과 between argument reversal의+9/-9를 확인합니다." },
          { lines: "15-22", explanation: "Saturday의 next Monday, Monday 자체에서 strict next와 inclusive nextOrSame, March month boundary와 leap-year February29를 비교합니다." },
          { lines: "24-27", explanation: "plusDays 결과를 새 변수로 받아 base immutability를 다시 고정합니다." },
        ],
        run: { environment: ["OpenJDK 21"], command: isolatedJavaRun("TemporalRulesLab.java", "TemporalRulesLab") },
        output: { value: "weekday=SATURDAY\nweekdayValue=6\nforwardDays=9\nreverseDays=-9\nbaseNextMonday=2025-03-10\nmondayNext=2025-03-17\nmondayNextOrSame=2025-03-10\nlastOfMonth=2025-03-31\nfirstNextMonth=2025-04-01\nleapLastDay=2024-02-29\nbaseUnchanged=2025-03-08\nchanged=2025-03-09", explanation: ["DayOfWeek value는1~7이고 Saturday는6입니다.", "between 방향을 바꾸면 sign만 반대가 됩니다.", "next는 strict, nextOrSame은 inclusive이고 leap February의 마지막 날은29일입니다."] },
        experiments: [
          { change: "Monday에서 next와 nextOrSame을 같은 결과라고 기대합니다.", prediction: "2025-03-17과2025-03-10으로 한 주 차이가 납니다.", result: "‘다음’의 strict/inclusive 언어를 API 이름으로 선택합니다." },
          { change: "ChronoUnit.DAYS.between(target,base)를 D-day 양수로 표시합니다.", prediction: "-9가 나와 UI 의미가 뒤집힙니다.", result: "start/end parameter names와 past/future sign policy를 명시합니다." },
          { change: "DayOfWeek.ordinal()+1을 external value로 저장합니다.", prediction: "현재는1~7처럼 보여도 ordinal은 일반 persistence contract가 아닙니다.", result: "ISO contract에는 getValue, external schema에는 명시 mapping을 사용합니다." },
        ],
        sourceRefs: ["java-myproject-class02-ex05-localdate", "java-day-of-week-api", "java-chrono-unit-api", "java-temporal-adjusters-api", "java-local-date-api", "iso-8601"],
      }],
      diagnostics: [
        { symptom: "요일 숫자가 API마다 하루씩 어긋난다.", likelyCause: "DayOfWeek Monday1~Sunday7과 Calendar Sunday1~Saturday7 또는 enum ordinal을 섞었습니다.", checks: ["value를 만든 type/API를 확인합니다.", "Monday/Sunday fixtures를 출력합니다.", "persisted mapping 문서를 봅니다."], fix: "내부에는 DayOfWeek enum을 유지하고 경계에서 명시 mapping/getValue를 사용합니다.", prevention: "MONDAY=1·SUNDAY=7과 legacy Calendar mapping tests를 둡니다." },
        { symptom: "D-day sign이 반대거나 Monday 당일에도7일 뒤로 밀린다.", likelyCause: "between arguments 또는 next/nextOrSame 정책을 뒤집었습니다.", checks: ["start/end names와 값을 출력합니다.", "same-day case를 test합니다.", "business 문구가 strict인지 확인합니다."], fix: "between(start,end)의 signed 의미와 adjuster strictness를 API boundary 이름/문서/test에 고정합니다.", prevention: "past/same/future와 weekday same/different table-driven tests를 둡니다." },
      ],
      expertNotes: ["custom TemporalAdjuster는 순수하고 immutable하게 만들고 입력 temporal이 지원하는 fields/chronology를 확인해야 합니다.", "국가 공휴일·대체휴일·거래소 휴장은 tzdb와 다른 versioned data domain이므로 DayOfWeek만으로 business day를 구현하지 않습니다."],
    },
  ],
  lab: {
    title: "재현 가능한 학습 알림 예약·초대 token 서비스",
    scenario: "사용자가 Locale별 숫자 목표와 지역 시간대의 다음 학습일을 입력하면 서버가 개인정보를 최소 표시하고, deterministic preview ID와 실제 보안용 one-time token을 분리하며, DST·만료·문자열/수치 경계를 모두 검증하는 작은 domain service를 설계합니다.",
    setup: [
      "OpenJDK21에서 warning0로 compile되는 빈 project와 각 test case가 격리된 OS temp classes directory를 준비합니다.",
      "Clock, RandomGenerator, SecureRandom, ZoneId, Locale을 service constructor dependencies로 정의하고 system defaults를 직접 읽지 못하게 합니다.",
      "public fixture에는 ASCII·한글·supplementary Unicode를 포함하되 실제 이름·email·phone·identifier를 닮은 값을 사용하지 않습니다.",
      "production path와 preview/test path를 나눕니다. preview는 seeded Random, credential은 SecureRandom raw16bytes 이상을 사용합니다.",
      "예약 input schema를 structuredId, localeTag, zoneId, localDateTime, weekdayPolicy, targetCount로 명시하고 raw input logging을 금지합니다.",
      "validity를 issuedAt inclusive, expiresAt exclusive로 문서화하고 fixed Clock fixture를 만듭니다.",
    ],
    steps: [
      "String parser가 delimiter를 Pattern.quote로 처리하고 split(...,-1)로 empty fields를 보존하게 합니다.",
      "structuredId를 token count·allowed characters·Unicode code-point length로 검증한 뒤 middle segment만 masking하고 invalid message에는 raw를 넣지 않습니다.",
      "machine key normalization에는 Locale.ROOT, targetCount display에는 사용자 Locale을 명시합니다.",
      "반복 설명문 조립은 operation-local StringBuilder로 수행하고 toString 뒤 builder를 공유하지 않습니다.",
      "targetCount scaling에서 Math.multiplyExact/toIntExact를 사용하고 overflow를 stable domain error code로 번역합니다.",
      "preview schedule/sample IDs는 injected RandomGenerator seed와 fixed call order로 재현하고 [origin,bound) assertions를 둡니다.",
      "실제 invitation token은 SecureRandom.nextBytes로 만들되 test/output/log에는 bytes·Base64 value를 싣지 않고 length·format predicate·rawPublished=false만 확인합니다.",
      "localDateTime+ZoneId resolution 전에 ZoneRules.getValidOffsets를 검사합니다. gap0은 명시 reject/shift 정책, overlap2는 earlier/later offset choice를 요구합니다.",
      "예약이 date-based인지 elapsed-duration인지 분리해 next/nextOrSame과 plusDays/Duration을 올바르게 선택합니다.",
      "Clock.fixed에서 issuedAt, exact deadline, deadline-1ns, deadline+1ns를 검증하고 operation마다 한 now snapshot만 사용합니다.",
      "legacy Date를 받는 adapter는 즉시 toInstant하고 legacy return이 필요하면 defensive Date copy를 반환합니다.",
      "DateTimeFormatter에는 Locale·ZoneId를 명시하고 machine protocol과 user display format을 별도 methods로 둡니다.",
      "Unicode tests는 UTF-16 length·codePointCount·UTF-8 byte length를 각각 확인하고 supplementary pair를 substring으로 자르지 않습니다.",
      "negative tests로 malformed split, short mask, wrong charset, invalid bound, integer overflow, DST gap/overlap, reversed between, next-vs-nextOrSame를 실행합니다.",
      "audit script를 기본 환경과 네 hostile Java launcher option 환경에서 반복해 stdout byte equality, warning0, cleanup, privacy zero를 확인합니다.",
    ],
    expectedResult: [
      "같은 Clock·seed·input이면 preview output과 schedule decision이 byte-for-byte 같고 Random call-order provenance가 남습니다.",
      "production token은 SecureRandom으로 생성되지만 public evidence에는 raw/encoded credential이 전혀 없고 length·lifecycle policy만 있습니다.",
      "String comparison은 content equality를 사용하고 literal pooling/new origin에 따라 결과가 달라지지 않습니다.",
      "supplementary Unicode가 explicit UTF-8로 round trip하고 code-unit/code-point/byte limits가 독립 검증됩니다.",
      "Locale.ROOT machine key와 user-locale display가 default Locale을 tr-TR/de-DE로 바꿔도 각자 계약대로 유지됩니다.",
      "overflow, invalid random bounds, malformed structured input이 raw value 없는 명시 error code로 처리됩니다.",
      "DST gap·overlap에 silent ambiguity가 없고 calendar-day와 elapsed-duration 결과가 목적에 맞게 분리됩니다.",
      "expiry equality·ChronoUnit direction·next/nextOrSame·DayOfWeek1~7이 fixed fixtures에서 exact입니다.",
      "legacy adapter 밖 application state는 Instant·LocalDate·ZonedDateTime 같은 immutable java.time types만 사용합니다.",
      "모든 examples와 integration fixture가 OpenJDK21 -Xlint:all warning0, exact/invariant output, no residue, privacy scan0을 통과합니다.",
    ],
    cleanup: [
      "token byte arrays와 raw inputs를 file/snapshot에 쓰지 않고 operation reference를 release합니다. heap zeroization 보장은 과장하지 않습니다.",
      "formatter/builder/random/clock test doubles를 global singleton state에 남기지 않고 각 fixture scope에서 폐기합니다.",
      "child JVM timeout이면 process tree를 kill하고 stdout/stderr async tasks를 회수한 뒤 Process를 Dispose합니다.",
      "normalized parent가 OS temp base와 정확히 같은 GUID direct child만 reverse cleanup하고 post-delete를 assert합니다.",
      "workspace에서 .class·audit temp·raw token·email/mobile/name-like candidate·absolute local path patterns가0인지 검사합니다.",
    ],
    extensions: [
      "IANA tzdb update 전후에 future recurring schedules를 재-resolve하고 changed-instant report·user re-confirmation policy를 구현합니다.",
      "RandomGeneratorFactory로 여러 algorithm을 주입하되 seed·algorithm·split topology가 provenance에 남는 Monte Carlo replay harness를 만듭니다.",
      "CharsetDecoder REPORT와 Unicode normalization policy를 identifier ingestion boundary에 추가하고 malformed/unmappable/normalization-collision cases를 검증합니다.",
      "holiday provider와 versioned business calendar를 도입해 DayOfWeek adjuster를 국가별 영업일 계산으로 확장합니다.",
      "hashed one-time token storage, constant-time verification, rate limit, expiry, rotation, audit redaction을 포함한 credential lifecycle integration test를 작성합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "원본 String·Math·Random·LocalDate 개념을 default-free deterministic console report로 다시 작성합니다.",
      requirements: ["same-content new String case에서 == false·equals true를 보여 줍니다.", "supplementary Unicode 하나를 포함해 length·codePointCount·explicit UTF-8 round trip을 출력합니다.", "split(regex,-1)로 trailing empty를 보존하고 synthetic structured ID만 검증 후 masking합니다.", "ceil/floor/round의 +10.7·-10.7과 addExact overflow를 exact 출력합니다.", "Random(고정 seed)의 sequence replay와 bounds를 검증합니다.", "Clock.fixed·explicit ZoneId로 LocalDate/Instant output을 고정합니다.", "개인정보·현재 시각·raw 난수·default Locale/Charset/Zone이 output에 없어야 합니다.", "OpenJDK21 -Xlint:all warning0와 exact output을 실행 script로 검증합니다."],
      hints: ["값을 equality/representation/encoding/display 네 columns로 나눕니다.", "현재/난수 원본 감사와 새 deterministic example을 같은 golden 방식으로 취급하지 않습니다.", "run helper는 source마다 별도 classes directory를 사용합니다."],
      expectedOutcome: "어느 machine에서도 같은8개 contract 결과가 나오고 String·수치·난수·시간의 숨은 defaults가 code review에서 보입니다.",
      solutionOutline: ["dependencies와 fixed fixtures를 먼저 정의합니다.", "각 concept을 한 stable predicate로 출력합니다.", "negative boundaries를 추가합니다.", "hostile defaults·launcher options에서 재실행합니다.", "privacy/residue scan으로 닫습니다."],
    },
    {
      difficulty: "응용",
      prompt: "legacy Date/Calendar 기반 알림 예약기를 java.time·Clock·ZoneRules 기반으로 migration합니다.",
      requirements: ["legacy boundary에서 Date/Calendar를 Instant+ZoneId로 즉시 변환합니다.", "SimpleDateFormat shared field를 immutable DateTimeFormatter로 교체하고 Locale/Zone을 명시합니다.", "LocalDateTime input의 gap0/normal1/overlap2 offsets를 분기하고 정책 result를 반환합니다.", "calendar+1day와 elapsed+24hours를 서로 다른 methods/types로 제공합니다.", "next Monday와 next-or-same Monday를 별도 user stories로 test합니다.", "expiry equality를 명시하고 Clock.fixed로 before/equal/after를 검증합니다.", "January zero-based legacy month, leap day, spring/fall DST, reversed between cases를 포함합니다.", "migration 전후 output은 raw current date 대신 fixed semantic values로 비교합니다."],
      hints: ["Date.toInstant, TimeZone.toZoneId를 adapter에만 둡니다.", "ZoneRules.getValidOffsets size가 ambiguity classifier입니다.", "Period와 Duration 이름을 domain phrase에 맞춥니다."],
      expectedOutcome: "default zone·mutation·thread-unsafe formatter가 core에서 사라지고 DST와 만료 boundary가 명시적으로 재현됩니다.",
      solutionOutline: ["legacy API inventory와 arithmetic semantics를 분류합니다.", "immutable domain model과 adapters를 만듭니다.", "Clock/ZoneRules policies를 주입합니다.", "transition matrix를 exact 실행합니다.", "deprecated path를 단계적으로 제거합니다."],
    },
    {
      difficulty: "설계",
      prompt: "다국어 학습 플랫폼의 versioned identifier·reward randomization·regional schedule·one-time credential 표준 API 정책을 설계합니다.",
      requirements: ["identifier equality·Unicode normalization·code-point/byte limits·charset·Locale policy를 ADR로 작성합니다.", "regex parsing과 masking이 raw personal data를 log/exception/public snapshot에 남기지 않게 합니다.", "reward simulation은 injectable RandomGenerator로 replay되고 algorithm/seed/call partition provenance를 가집니다.", "credential은 SecureRandom·충분한 entropy·hash-at-rest·expiry·single-use·rate limit·redaction lifecycle을 가집니다.", "정수 점수·확률·금액 rounding과 overflow policy를 type별로 정합니다.", "event timestamp, birthday, wall schedule, offset snapshot, zone identity를 schema columns로 구분합니다.", "DST gap/overlap·tzdb update·future recurrence 재계산 정책을 정합니다.", "legacy/date-time/version compatibility와 rollback migration을 문서화합니다.", "property/statistical/security/privacy tests를 서로 다른 pass criteria로 운영합니다.", "기본/hostile Locale·Charset·Zone·launcher variables와 JDK update matrix를 CI에 넣습니다."],
      hints: ["default-free는 모든 곳에 ROOT/UTC를 쓰는 것이 아니라 domain 입력을 명시하는 것입니다.", "randomness는 reproducibility와 unpredictability라는 반대 목적을 가진 두 dependencies로 나눕니다.", "future regional schedule은 LocalDateTime+ZoneId intent와 resolved Instant evidence를 모두 고려합니다."],
      expectedOutcome: "문자·수치·난수·시간 정책이 schema/API/test/운영 observability까지 일관되고, privacy와 재현성이 구현 세부가 아니라 검증 가능한 계약이 됩니다.",
      solutionOutline: ["data classes를 semantic type과 trust level로 inventory합니다.", "defaults/entropy/clock/zone dependencies를 드러냅니다.", "adapters·policies·credential lifecycle을 분리합니다.", "boundary matrices와 failure codes를 구현합니다.", "migration/monitoring/rollback과 privacy evidence를 완성합니다."],
    },
  ],
  reviewQuestions: [
    { question: "String 두 값의 내용이 같은지 ==로 비교하면 안 되는 이유는 무엇인가요?", answer: "==는 reference identity를 비교하므로 서로 다른 생성 경로의 same-content objects에서 false가 될 수 있고 content에는 equals/Objects.equals가 맞습니다." },
    { question: "literal끼리 ==가 true인 것은 무엇을 증명하나요?", answer: "compile-time constant pooling/interning으로 같은 canonical reference를 공유한 case를 증명할 뿐 ==가 content comparator임을 증명하지 않습니다." },
    { question: "intern()을 모든 문자열 비교에 쓰지 않는 이유는 무엇인가요?", answer: "equals가 이미 content를 비교하며 intern은 global canonical pool/lifetime/cardinality policy를 추가하기 때문입니다." },
    { question: "String.concat이나 replace를 호출하면 원본이 바뀌나요?", answer: "아닙니다. String은 immutable이고 새 결과를 반환하므로 그 reference를 받거나 사용해야 합니다." },
    { question: "StringBuilder.toString 뒤 builder를 바꾸면 기존 String도 바뀌나요?", answer: "아닙니다. toString이 만든 immutable String value는 이후 mutable builder state와 분리됩니다." },
    { question: "String.length가 사용자가 보는 문자 수와 다른 이유는 무엇인가요?", answer: "length는 UTF-16 code units를 세고 supplementary code point는 두 units, grapheme는 여러 code points일 수도 있기 때문입니다." },
    { question: "charAt은 Unicode code point를 반환하나요?", answer: "항상 그렇지 않습니다. charAt은 한 UTF-16 code unit을 반환하므로 supplementary 문자의 surrogate 절반일 수 있습니다." },
    { question: "비ASCII String을 bytes로 바꿀 수 없나요?", answer: "바꿀 수 있습니다. producer/consumer가 StandardCharsets.UTF_8 같은 explicit charset을 합의해야 정확히 round trip합니다." },
    { question: "getBytes() no-argument overload가 위험한 이유는 무엇인가요?", answer: "host default charset이라는 숨은 입력을 사용해 다른 machine에서 bytes가 달라질 수 있기 때문입니다." },
    { question: "String.split의 delimiter는 literal인가요?", answer: "아닙니다. regex이며 dot·pipe 같은 metacharacter는 escape 또는 Pattern.quote가 필요합니다." },
    { question: "split(regex,0)과 split(regex,-1)의 차이는 무엇인가요?", answer: "0은 trailing empty tokens를 제거하고 negative는 모두 보존합니다." },
    { question: "positive split limit2는 무엇을 뜻하나요?", answer: "최대2개 결과를 만들고 두 번째 token에 아직 나뉘지 않은 remainder 전체가 들어갑니다." },
    { question: "substring(begin,end)의 end character는 포함되나요?", answer: "포함되지 않습니다. UTF-16 index의 half-open [begin,end)입니다." },
    { question: "고정 substring index로 masking하기 전에 무엇이 필요한가요?", answer: "입력 grammar·length·delimiter·Unicode boundary를 먼저 검증하고 실패에 raw 값을 노출하지 않아야 합니다." },
    { question: "machine identifier를 upper-case할 때 어떤 Locale을 쓰나요?", answer: "protocol 규칙이 별도로 없다면 일반적으로 Locale.ROOT를 명시하고 사용자 자연어 display는 사용자의 Locale을 씁니다." },
    { question: "String.format에서 Locale을 생략하면 무엇이 달라질 수 있나요?", answer: "default Locale에 따라 grouping·decimal symbols와 다른 locale-sensitive 표시가 달라집니다." },
    { question: "Math.ceil(-10.7)과 floor(-10.7)은 각각 무엇인가요?", answer: "ceil은+infinity 방향의-10.0, floor는-infinity 방향의-11.0입니다." },
    { question: "Math.round(-2.5)가 -2인 이유는 무엇인가요?", answer: "double round가 floor(a+0.5) 규칙을 사용하기 때문이며 half-away나 half-even과 다릅니다." },
    { question: "Integer.MAX_VALUE+1은 exception을 던지나요?", answer: "기본 int 연산은 조용히 MIN_VALUE로 wrap하며 Math.addExact를 써야 overflow가 ArithmeticException이 됩니다." },
    { question: "Math.abs(Integer.MIN_VALUE)는 positive인가요?", answer: "아닙니다. 대응 positive int가 없어 같은 negative MIN_VALUE가 반환됩니다." },
    { question: "-7/3과 Math.floorDiv(-7,3)은 왜 다른가요?", answer: "/는 zero 방향으로-2, floorDiv는-infinity 방향으로-3을 반환합니다." },
    { question: "같은 Random seed면 언제 같은 sequence인가요?", answer: "같은 algorithm/implementation과 같은 seed, 같은 call order일 때입니다." },
    { question: "nextInt(bound)의 bound가 결과에 포함되나요?", answer: "아닙니다. 결과는0 inclusive, bound exclusive이며 bound는 positive여야 합니다." },
    { question: "Math.abs(nextInt())%bound가 위험한 이유는 무엇인가요?", answer: "MIN_VALUE abs edge와 modulo bias가 있으므로 generator의 bounded API를 써야 합니다." },
    { question: "Math.random이나 Random을 reset token에 써도 되나요?", answer: "안 됩니다. 예측 가능한 pseudorandom source이므로 credential에는 SecureRandom이 필요합니다." },
    { question: "SecureRandom에 fixed seed를 주면 portable replay가 되나요?", answer: "보장되지 않습니다. provider/기존 state가 다르고 setSeed는 entropy를 보충할 수 있어 raw sequence를 golden으로 만들면 안 됩니다." },
    { question: "SecureRandom test는 무엇을 exact로 검증하나요?", answer: "raw 값이 아니라 byte length·allowed format/range·raw non-public·credential lifecycle policy를 검증합니다." },
    { question: "Date.toString이 같은 instant를 다르게 표시할 수 있나요?", answer: "네. system default time zone으로 rendering하므로 내부 value는 Instant로 비교하고 display zone을 명시합니다." },
    { question: "Calendar.MONTH의 January 값은 무엇인가요?", answer: "0입니다. legacy0-based month와 java.time의1-based Month/value를 섞지 않습니다." },
    { question: "SimpleDateFormat을 static singleton으로 공유해도 되나요?", answer: "thread-safe하지 않은 mutable formatter라 위험하며 immutable DateTimeFormatter 또는 operation-local adapter를 사용합니다." },
    { question: "Instant와 LocalDateTime의 핵심 차이는 무엇인가요?", answer: "Instant는 global timeline point이고 LocalDateTime은 zone/offset 없는 wall-clock fields라 단독으로 instant를 정하지 못합니다." },
    { question: "Clock.fixed가 해결하는 것은 무엇인가요?", answer: "현재 instant/zone hidden input을 고정해 now 기반 business logic을 exact 재현하게 합니다." },
    { question: "deadline과 now가 같을 때 expired인가요?", answer: "domain 정책입니다. 예제는 validity end-exclusive라 equality부터 expired이며 before/equal/after tests로 고정합니다." },
    { question: "DST gap의 valid offset 수는 몇 개인가요?", answer: "0개이며 default atZone은 보통 gap 뒤 유효한 local time으로 shift합니다." },
    { question: "DST overlap의 같은 LocalDateTime은 몇 instants가 될 수 있나요?", answer: "두 valid offsets에 따라 두 instants가 될 수 있어 earlier/later 또는 user choice 정책이 필요합니다." },
    { question: "plusDays(1)과 plusHours(24)는 항상 같은가요?", answer: "아닙니다. ZonedDateTime의 DST transition에서는 calendar day가23/25 elapsed hours가 될 수 있습니다." },
    { question: "DayOfWeek.getValue 범위는 무엇인가요?", answer: "ISO Monday1부터 Sunday7이며1~9가 아닙니다." },
    { question: "ChronoUnit.DAYS.between(a,b)의 sign은 어떻게 정하나요?", answer: "a에서 b로 가는 signed complete days라 b가 뒤면 positive, arguments를 뒤집으면 negative입니다." },
    { question: "TemporalAdjusters.next와 nextOrSame은 어떻게 다른가요?", answer: "next는 현재가 해당 요일이어도 다음 occurrence, nextOrSame은 같은 날을 허용합니다." },
    { question: "영업일을 DayOfWeek만으로 계산해도 되나요?", answer: "국가 공휴일·대체휴일·거래소 휴장에는 versioned business calendar data가 추가로 필요합니다." },
  ],
  completionChecklist: [
    "String == reference identity와 equals content equality를 new same-content case로 구분했다.",
    "literal/constant-expression pooling이 잘못된 == code를 우연히 통과시킬 수 있음을 설명했다.",
    "intern의 canonical pool 의미와 일반 business comparison에 남용할 때의 lifetime/cardinality 비용을 다뤘다.",
    "String 변환 반환값과 original immutability를 before/after로 검증했다.",
    "반복 조립은 operation-local StringBuilder와 immutable snapshot으로 구현했다.",
    "null·empty·blank를 서로 다른 domain states로 유지하고 null-safe comparison 정책을 정했다.",
    "UTF-16 code unit·Unicode code point·grapheme cluster를 서로 다른 문자 단위로 설명했다.",
    "supplementary character의 surrogate pair와 offsetByCodePoints를 실행했다.",
    "String.length·codePointCount·UTF-8 byte length를 독립 측정했다.",
    "getBytes/new String 양쪽에 StandardCharsets.UTF_8을 명시했다.",
    "wrong charset decode가 exception 없이 unequal data를 만들 수 있음을 검증했다.",
    "split delimiter가 regex라는 점을 Pattern.quote dot case로 실행했다.",
    "split limit0·negative·positive의 trailing-empty/remainder 차이를 exact 출력했다.",
    "substring의 UTF-16 half-open boundary와 index validation을 설명했다.",
    "masking 전에 grammar를 검증하고 raw invalid input을 message/log에 넣지 않았다.",
    "Locale.ROOT machine key와 explicit user Locale display를 분리했다.",
    "Turkish case와 US/Germany numeric formatting을 hostile-default 없이 실행했다.",
    "ceil·floor를+/- infinity 방향으로 음수까지 설명했다.",
    "Math.round의 negative tie가 금융 rounding과 다름을 실행했다.",
    "integer silent wrap와 addExact/toIntExact/negateExact failures를 비교했다.",
    "Math.abs(MIN_VALUE) edge와 floorMod 대안을 다뤘다.",
    "truncating division/remainder와 floorDiv/floorMod를 구분했다.",
    "seeded Random이 같은 algorithm·call order에서 replay됨을 exact sequence로 검증했다.",
    "Random origin inclusive/bound exclusive와 invalid bound를 확인했다.",
    "cast/modulo mapping 대신 bounded random APIs를 사용했다.",
    "Random/Math.random을 보안 credential에서 제외했다.",
    "SecureRandom raw bytes를 public output/snapshot/log에 싣지 않았다.",
    "SecureRandom test를 length·range·redaction·purpose invariants로 만들었다.",
    "token generation뿐 아니라 hash-at-rest·expiry·single-use·rate limit lifecycle을 설계했다.",
    "Date를 legacy instant carrier로 보고 Date.toInstant/Date.from boundary를 사용했다.",
    "Calendar0-based month·mutation·leniency와 java.time immutable model을 구분했다.",
    "SimpleDateFormat thread-safety/default 문제를 DateTimeFormatter migration으로 해결했다.",
    "Clock.fixed/offset과 constructor injection으로 now hidden input을 제거했다.",
    "operation당 한 time snapshot과 expiry equality 정책을 적용했다.",
    "Instant·LocalDate·LocalDateTime·OffsetDateTime·ZonedDateTime을 domain 의미로 선택했다.",
    "java.time plus/with가 새 값을 반환하고 original을 바꾸지 않음을 확인했다.",
    "ZoneId와 ZoneOffset의 rule identity/snapshot 차이를 설명했다.",
    "DST gap offsets0과 default forward resolution을 exact 실행했다.",
    "DST overlap offsets2와 earlier/later instants3600초 차이를 exact 실행했다.",
    "calendar plusDays와 elapsed plusHours/Duration이 DST에서 갈리는 것을 확인했다.",
    "DayOfWeek ISO1~7로 원본1~9 오류를 교정했다.",
    "ChronoUnit.between start/end 방향과 sign을 양방향으로 검증했다.",
    "TemporalAdjusters.next와 nextOrSame의 strict/inclusive 차이를 same-day case로 검증했다.",
    "lastDayOfMonth/firstDayOfNextMonth로 month/leap boundary를 library에 맡겼다.",
    "package9·direct4가 OpenJDK21 warning0이고 main9·companion4·placeholder1임을 재현했다.",
    "원본 실행8의 current/random output은 shape·range·relations로 normalize했다.",
    "String 원본의 privacy candidates9/unique8/normalized7을 raw 값 없이 category counts로만 감사했다.",
    "네 Java launcher option 환경변수를 parent compile과 child process 양쪽에서 격리·복원했다.",
    "모든 child는 async stdout/stderr drain·timeout·tree kill·bounded grace·Dispose를 사용했다.",
    "OS temp GUID direct-child parent boundary와 post-delete residue absence를 검증했다.",
    "모든 synthetic Java examples가 OpenJDK21 -Xlint:all warning0와 exact output을 통과했다.",
    "public content에서 실제 개인 literal·raw credential·absolute local path·current raw snapshot이0임을 scan했다.",
  ],
  nextSessions: ["core-02-exception"],
  sources: [
    { id: "java-myproject-class01-ex01-string", repository: "javastudy/MyJavaProject", path: "src/com/java/class01/Ex01_String.java", usedFor: ["String direct inventory", "115-line normalized run", "identity/equality", "charset", "split", "masking privacy audit"], evidence: "String creation·comparison·search·conversion·bytes·substring·split·masking examples를 읽고 warning0 실행과 raw 비공개 privacy-category contract로 사용했습니다." },
    { id: "java-myproject-class01-ex01-placeholder", repository: "javastudy/MyJavaProject", path: "src/com/java/class01/Ex01.java", usedFor: ["package scope", "empty placeholder classification", "main count"], evidence: "빈 main scaffold도 package3/main3 inventory에는 포함하되 의미 있는 실행8과 direct/companion에서 분리했습니다." },
    { id: "java-myproject-class01-test-mask", repository: "javastudy/MyJavaProject", path: "src/com/java/class01/Test.java", usedFor: ["masking companion", "synthetic stdin", "input validation extension"], evidence: "이름 masking exercise를 실제 개인 입력 없이 ABCDE synthetic input과 star-run3 구조로 실행했습니다." },
    { id: "java-myproject-class02-ex01-math", repository: "javastudy/MyJavaProject", path: "src/com/java/class02/Ex01_Math.java", usedFor: ["Math direct inventory", "ceil/floor/round exact prefix", "random range normalization", "max/min"], evidence: "34행 중 결정적1~28·33~34와 난수29~32 ranges를 분리하고 음수 방향·overflow exact arithmetic으로 확장했습니다." },
    { id: "java-myproject-class02-ex02-random", repository: "javastudy/MyJavaProject", path: "src/com/java/class02/Ex02_Random.java", usedFor: ["Random direct inventory", "8-line type/range run", "seed reproducibility", "SecureRandom contrast"], evidence: "unseeded Random의 boolean/int/long/float/double와 bounded0~9 shapes를 확인하고 seeded test seam·security boundary로 보완했습니다." },
    { id: "java-myproject-class02-ex03-date", repository: "javastudy/MyJavaProject", path: "src/com/java/class02/Ex03_Date.java", usedFor: ["legacy Date companion", "SimpleDateFormat shapes", "migration adapter"], evidence: "Date current output3행을 shape로 감사하고 explicit UTC/Locale fixed Instant migration example의 출발점으로 사용했습니다." },
    { id: "java-myproject-class02-ex04-calendar", repository: "javastudy/MyJavaProject", path: "src/com/java/class02/Ex04_Calendar.java", usedFor: ["legacy Calendar companion", "month/weekday ranges", "mutable arithmetic", "DST migration"], evidence: "Calendar current output16행의 month1~12·weekday relation·epoch/date shapes를 확인하고0-based month·mutation·calendar-vs-elapsed 교정에 사용했습니다." },
    { id: "java-myproject-class02-ex05-localdate", repository: "javastudy/MyJavaProject", path: "src/com/java/class02/Ex05_LocalDate.java", usedFor: ["java.time direct inventory", "30-line normalized run", "immutability", "between direction", "DayOfWeek correction", "TemporalAdjusters"], evidence: "fixed date/time와 current-derived shapes를 분리하고 DayOfWeek1~9 주석을 ISO1~7로 교정했습니다." },
    { id: "java-myproject-class02-test-games", repository: "javastudy/MyJavaProject", path: "src/com/java/class02/Test.java", usedFor: ["Random game companion", "bounded choices", "synthetic interactive run"], evidence: "synthetic1/n/1 input으로12행을 종료하고 CPU choices1~3·1~13과 counter sum1만 공개했습니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["package9/direct4 compile", "release21", "lint warning0", "synthetic example verification"], evidence: "원본과 모든 public Java examples를 UTF-8·release21·proc:none·Xlint all로 compile하는 pinned toolchain 근거입니다." },
    { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["fresh JVM", "ArgumentList", "redirected UTF-8 streams", "stdin"], evidence: "shell interpolation 없는 Java child arguments와 redirected streams/input을 구성하는 API 근거입니다." },
    { id: "powershell-environment-variables", repository: "Microsoft PowerShell Documentation", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher option save/remove/restore", "process-scope environment"], evidence: "네 Java launcher option 변수의 존재·값을 저장하고 finally에서 원상 복원하는 Env provider 근거입니다." },
    { id: "dotnet-process-environment", repository: ".NET API", path: "ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["child launcher-option isolation", "per-process environment"], evidence: "각 child environment dictionary에서 네 launcher option variables를 제거하는 근거입니다." },
    { id: "dotnet-process-lifecycle", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["Start", "timeout", "Kill process tree", "termination grace", "Dispose"], evidence: "10초 runtime timeout과 tree kill·5초 grace·finally Dispose lifecycle의 API 근거입니다." },
    { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["concurrent stdout drain", "concurrent stderr drain", "post-exit task recovery"], evidence: "redirected pipes를 Start 직후 함께 drain해 backpressure deadlock을 피하는 근거입니다." },
    { id: "jls-string-literals", repository: "JLS SE 21", path: "3.10.5 String Literals", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-3.html#jls-3.10.5", usedFor: ["literal interning", "constant expression identity", "escape representation"], evidence: "String literal instances와 intern relation의 language specification입니다." },
    { id: "jls-reference-equality", repository: "JLS SE 21", path: "15.21.3 Reference Equality Operators", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.21.3", usedFor: ["String == identity", "reference comparison", "null equality"], evidence: "reference operands의 ==/!=가 같은 object/null을 비교하는 규칙의 primary specification입니다." },
    { id: "java-string-api", repository: "Java SE 21 API", path: "java.lang.String", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html", usedFor: ["equals", "length", "code points", "substring", "split", "case", "bytes", "immutability"], evidence: "String의 character-sequence operations와 charset/regex/Locale overload contracts의 중심 API입니다." },
    { id: "java-string-builder-api", repository: "Java SE 21 API", path: "java.lang.StringBuilder", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuilder.html", usedFor: ["mutable assembly", "append", "toString snapshot", "capacity invariant"], evidence: "single-operation mutable text assembly와 immutable String conversion에 사용했습니다." },
    { id: "java-string-buffer-api", repository: "Java SE 21 API", path: "java.lang.StringBuffer", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuffer.html", usedFor: ["synchronization comparison", "shared mutable caution"], evidence: "method synchronization이 compound ownership을 자동 해결하지 않음을 비교했습니다." },
    { id: "java-objects-api", repository: "Java SE 21 API", path: "java.util.Objects", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html", usedFor: ["null-safe equality", "precondition helpers"], evidence: "Objects.equals를 null-safe content comparison option으로 제시했습니다." },
    { id: "java-character-api", repository: "Java SE 21 API", path: "java.lang.Character", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Character.html", usedFor: ["surrogate detection", "code points", "Unicode classification"], evidence: "high/low surrogate와 supplementary code-point operations의 API 근거입니다." },
    { id: "java-standard-charsets-api", repository: "Java SE 21 API", path: "java.nio.charset.StandardCharsets", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/StandardCharsets.html", usedFor: ["explicit UTF-8", "wrong-charset contrast", "portable encoding names"], evidence: "UTF-8과 ISO-8859-1 상수로 default charset 의존성을 제거했습니다." },
    { id: "java-charset-api", repository: "Java SE 21 API", path: "java.nio.charset.Charset", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/Charset.html", usedFor: ["encode/decode boundary", "default charset caution", "decoder policy"], evidence: "문자와 bytes mapping 및 default/decoder error action을 설명하는 API 근거입니다." },
    { id: "unicode-core-spec", repository: "Unicode Standard 15.0", path: "Core Specification Chapter 3", publicUrl: "https://www.unicode.org/versions/Unicode15.0.0/ch03.pdf", usedFor: ["code point", "encoding form", "surrogates", "grapheme caveat"], evidence: "Unicode scalar/code-point·UTF encoding·character boundary 용어를 보충하는 primary standard입니다." },
    { id: "java-pattern-api", repository: "Java SE 21 API", path: "java.util.regex.Pattern", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/regex/Pattern.html", usedFor: ["split regex", "Pattern.quote", "literal delimiter"], evidence: "regex metacharacters와 literal delimiter quoting의 API 근거입니다." },
    { id: "jls-array-access", repository: "JLS SE 21", path: "15.10.4 Run-Time Evaluation of Array Access", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.10.4", usedFor: ["index boundary analogy", "range failure reasoning"], evidence: "index range가 runtime boundary라는 language rule을 substring/input boundary 설명에 보조했습니다." },
    { id: "owasp-logging", repository: "OWASP Cheat Sheet Series", path: "Logging Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["PII redaction", "credential non-logging", "safe error context"], evidence: "raw personal/contact/token values를 public output·log에서 제외하는 운영 보안 근거입니다." },
    { id: "java-locale-api", repository: "Java SE 21 API", path: "java.util.Locale", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Locale.html", usedFor: ["Locale.ROOT", "Turkish case", "explicit user locale"], evidence: "locale-neutral machine operations과 regional display를 분리하는 API 근거입니다." },
    { id: "java-formatter-api", repository: "Java SE 21 API", path: "java.util.Formatter", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Formatter.html", usedFor: ["explicit numeric formatting", "grouping/decimal symbols", "Locale contract"], evidence: "US/Germany exact numeric display와 default-locale caution의 API 근거입니다." },
    { id: "java-math-api", repository: "Java SE 21 API", path: "java.lang.Math", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html", usedFor: ["ceil", "floor", "round", "exact arithmetic", "abs edge", "floorDiv/floorMod"], evidence: "음수 rounding 방향, overflow-detecting methods, MIN_VALUE와 integer division contracts의 중심 API입니다." },
    { id: "java-big-decimal-api", repository: "Java SE 21 API", path: "java.math.BigDecimal", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html", usedFor: ["decimal arithmetic", "scale", "money alternative"], evidence: "binary floating-point와 분리된 explicit decimal value/scale arithmetic 대안입니다." },
    { id: "java-rounding-mode-api", repository: "Java SE 21 API", path: "java.math.RoundingMode", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/RoundingMode.html", usedFor: ["domain rounding modes", "half-even contrast", "directed rounding"], evidence: "자연어 반올림 대신 explicit rounding policy를 선택하는 API 근거입니다." },
    { id: "jls-integer-operations", repository: "JLS SE 21", path: "4.2.2 Integer Operations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.2.2", usedFor: ["two's-complement range", "silent overflow", "integer division"], evidence: "primitive integer representation·overflow·arithmetic semantics의 language specification입니다." },
    { id: "java-random-api", repository: "Java SE 21 API", path: "java.util.Random", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Random.html", usedFor: ["seed replay", "bounded values", "specified sequence", "non-security warning"], evidence: "same seed/call order와 nextInt bound contracts, cryptographic unsuitability의 API 근거입니다." },
    { id: "java-random-generator-api", repository: "Java SE 21 API", path: "java.util.random.RandomGenerator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/random/RandomGenerator.html", usedFor: ["origin/bound", "dependency injection", "modern algorithms"], evidence: "[origin,bound) overloads와 generator interface 기반 test seam의 API 근거입니다." },
    { id: "java-splittable-random-api", repository: "Java SE 21 API", path: "java.util.SplittableRandom", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/SplittableRandom.html", usedFor: ["parallel generator ownership", "split streams", "non-security simulation"], evidence: "parallel simulation에서 shared Random interleaving을 줄이는 선택지를 설명했습니다." },
    { id: "java-secure-random-api", repository: "Java SE 21 API", path: "java.security.SecureRandom", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/SecureRandom.html", usedFor: ["cryptographic randomness", "nextBytes", "bounded index", "seed/provider caveat"], evidence: "credential용 strong random API와 provider-dependent seeding behavior의 primary API 근거입니다." },
    { id: "java-message-digest-api", repository: "Java SE 21 API", path: "java.security.MessageDigest", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/MessageDigest.html", usedFor: ["token hash-at-rest", "constant-time equality consideration"], evidence: "raw one-time token 대신 digest verifier를 저장하고 isEqual을 고려하는 lifecycle 보충 근거입니다." },
    { id: "owasp-session-management", repository: "OWASP Cheat Sheet Series", path: "Session Management Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", usedFor: ["session identifier entropy", "token lifecycle", "transport/log leakage"], evidence: "예측 불가능한 session/token과 안전한 lifecycle·non-disclosure의 보안 근거입니다." },
    { id: "owasp-forgot-password", repository: "OWASP Cheat Sheet Series", path: "Forgot Password Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html", usedFor: ["reset token", "expiry", "single use", "rate limiting"], evidence: "one-time credential generation 이후 만료·일회성 소비·rate limit policy의 근거입니다." },
    { id: "java-date-api", repository: "Java SE 21 API", path: "java.util.Date", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Date.html", usedFor: ["legacy instant carrier", "toInstant/from", "mutability", "default-zone toString"], evidence: "legacy Date의 epoch value·conversion·mutable boundary contract입니다." },
    { id: "java-calendar-api", repository: "Java SE 21 API", path: "java.util.Calendar", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Calendar.html", usedFor: ["zero-based month", "mutable fields", "add/set", "time zone"], evidence: "원본 Calendar companion와 java.time migration의 legacy API 근거입니다." },
    { id: "java-simple-date-format-api", repository: "Java SE 21 API", path: "java.text.SimpleDateFormat", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/text/SimpleDateFormat.html", usedFor: ["legacy formatting", "mutable/thread-unsafe warning", "explicit zone"], evidence: "legacy formatter patterns와 synchronization/thread-safety caveat의 API 근거입니다." },
    { id: "java-date-time-formatter-api", repository: "Java SE 21 API", path: "java.time.format.DateTimeFormatter", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/format/DateTimeFormatter.html", usedFor: ["immutable formatter migration", "explicit Locale/Zone", "parse/format policy"], evidence: "thread-safe modern temporal formatter와 explicit configuration의 근거입니다." },
    { id: "java-clock-api", repository: "Java SE 21 API", path: "java.time.Clock", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Clock.html", usedFor: ["time dependency injection", "fixed clock", "offset clock", "zone"], evidence: "system time hidden input을 production/test clock dependency로 전환하는 중심 API입니다." },
    { id: "java-instant-api", repository: "Java SE 21 API", path: "java.time.Instant", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Instant.html", usedFor: ["timeline point", "event/expiry", "Date migration", "elapsed arithmetic"], evidence: "UTC timeline timestamp와 immutable temporal arithmetic의 API 근거입니다." },
    { id: "java-local-date-api", repository: "Java SE 21 API", path: "java.time.LocalDate", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/LocalDate.html", usedFor: ["date-only domain", "immutability", "weekday", "adjusters"], evidence: "zone-derived current date와 fixed calendar date operations의 API 근거입니다." },
    { id: "java-local-date-time-api", repository: "Java SE 21 API", path: "java.time.LocalDateTime", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/LocalDateTime.html", usedFor: ["wall-clock fields", "gap/overlap input", "zone ambiguity"], evidence: "zone/offset 없는 local fields가 instant를 유일하게 정하지 못하는 API 근거입니다." },
    { id: "java-zone-id-api", repository: "Java SE 21 API", path: "java.time.ZoneId", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/ZoneId.html", usedFor: ["regional rule identity", "Clock zone", "IANA zones"], evidence: "offset snapshot과 구별되는 region-based time-zone rules identity의 API 근거입니다." },
    { id: "java-zoned-date-time-api", repository: "Java SE 21 API", path: "java.time.ZonedDateTime", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/ZonedDateTime.html", usedFor: ["instant/local/zone composition", "gap resolution", "overlap offset selection", "date/time arithmetic"], evidence: "atZone resolution과 withLaterOffsetAtOverlap·plusDays/plusHours behavior의 중심 API입니다." },
    { id: "java-zone-rules-api", repository: "Java SE 21 API", path: "java.time.zone.ZoneRules", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/zone/ZoneRules.html", usedFor: ["valid offset counts", "gap/overlap classification", "transition lookup"], evidence: "LocalDateTime이0/1/2 valid offsets를 갖는지 사전에 검사하는 API 근거입니다." },
    { id: "java-zone-offset-transition-api", repository: "Java SE 21 API", path: "java.time.zone.ZoneOffsetTransition", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/zone/ZoneOffsetTransition.html", usedFor: ["isGap", "isOverlap", "transition duration"], evidence: "지역 offset 변화가 gap인지 overlap인지 구조적으로 판단하는 API입니다." },
    { id: "java-period-api", repository: "Java SE 21 API", path: "java.time.Period", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Period.html", usedFor: ["calendar amount", "date-based day/month/year", "Duration contrast"], evidence: "regional calendar fields 기반 amount를 elapsed seconds와 분리하는 API 근거입니다." },
    { id: "java-duration-api", repository: "Java SE 21 API", path: "java.time.Duration", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Duration.html", usedFor: ["elapsed amount", "DST hour comparison", "Clock offset"], evidence: "seconds/nanos 기반 elapsed time과23/24-hour transition 계산의 API 근거입니다." },
    { id: "java-day-of-week-api", repository: "Java SE 21 API", path: "java.time.DayOfWeek", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/DayOfWeek.html", usedFor: ["ISO Monday1-Sunday7", "enum weekday", "original correction"], evidence: "원본1~9 주석을1~7로 바로잡는 primary API 근거입니다." },
    { id: "java-chrono-unit-api", repository: "Java SE 21 API", path: "java.time.temporal.ChronoUnit", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/temporal/ChronoUnit.html", usedFor: ["between direction", "complete units", "date/time unit classification"], evidence: "between(start,end)의 signed unit count와 date/time based units의 API 근거입니다." },
    { id: "java-temporal-adjusters-api", repository: "Java SE 21 API", path: "java.time.temporal.TemporalAdjusters", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/temporal/TemporalAdjusters.html", usedFor: ["next", "nextOrSame", "last day", "first next month"], evidence: "strict/inclusive weekday와 month-boundary adjusters의 API 근거입니다." },
    { id: "iso-8601", repository: "ISO", path: "ISO 8601 Date and time format", publicUrl: "https://www.iso.org/iso-8601-date-and-time-format.html", usedFor: ["weekday numbering", "date/time representation terminology"], evidence: "ISO calendar/date-time 표기와 weekday ordering 용어의 표준 배경입니다." },
  ],
  sourceCoverage: {
    filesRead: 9,
    filesUsed: 9,
    uncoveredNotes: [
      "inventory direct4인 class01 Ex01_String과 class02 Ex01_Math·Ex02_Random·Ex05_LocalDate를 모두 읽고 다른 source dependency 없이 warning0 compile됨을 확인했습니다.",
      "같은 packages의 class01 Test와 class02 Ex03_Date·Ex04_Calendar·Test를 실행 companions4로, class01 Ex01을 빈 placeholder1로 분류해 package9를 닫았습니다.",
      "class01 package3/main3과 class02 package6/main6, 합 package9/main9가 OpenJDK21.0.11에서 compiler output0이며 direct4/main4도 별도 output에서 warning0입니다.",
      "release matrix상 String은 isBlank 때문에 최소11, Math·LocalDate는8, Random은 nextDouble(bound) 때문에17이며 direct scope 최소17이지만 curriculum은21로 고정했습니다.",
      "String direct는 exit0·stderr0·115행·blank6·boolean16·star-runs4|4입니다. raw stdout에는 민감 derived fields가 있어 어떤 snapshot/evidence에도 공개하지 않았습니다.",
      "String assignment literals를 escape-decode하고 mutually-exclusive precedence로 phone2·numeric identifier1·email1·compound contacts2·comma-name1·repeated-name-bearing2의 총9 occurrences를 확인했습니다.",
      "privacy candidate exact unique8, whitespace-normalized unique7과 masked-comment1을 assert하지만 원본 decoded values·hashes·derived runtime fragments는 public content에 싣지 않았습니다.",
      "class01 masking Test는 실제 이름 대신 synthetic ABCDE input으로 한 행·star-run3·A***E suffix만 검증했습니다.",
      "Math34행은 deterministic1~28/33~34 exact와 random29~32의 [0,1)·0~9·0~2·0~12 ranges로 나누었습니다.",
      "Random8행은 boolean/int/long/float/double label shapes와 bounded lines6~8의0~9만 확인하고 raw sequence를 golden으로 쓰지 않았습니다.",
      "Date3행·Calendar16행·LocalDate30행은 current raw 값 대신 legacy/ISO shape·range·fixed literals·same-snapshot relations로 normalize했습니다.",
      "LocalDate 원본의 DayOfWeek getValue1~9 주석은 factual error라 Java SE21 API에 따라 Monday1~Sunday7로 교정했습니다.",
      "ChronoUnit between 방향, immutable plus/minus 반환, next/nextOrSame, lastDayOfMonth는 원본 설명이 짧아 fixed-date exact examples로 확장했습니다.",
      "class02 game Test는 synthetic1/n/1 input으로12행을 종료하고 first random1~3·second1~13·counter sum1만 검증했습니다.",
      "원본 getBytes 설명은 비ASCII 불가가 아니라 charset 합의 문제로, == 설명은 숫자 전용이 아니라 reference identity로, length/charAt은 UTF-16 code-unit contract로 교정했습니다.",
      "원본 ASCII-32 upper-case는 Unicode/Locale 일반 해법이 아니므로 Locale.ROOT와 explicit user Locale examples로 대체했습니다.",
      "split regex·limit/trailing empty, validated masking, StringBuilder ownership, grapheme caveat는 JLS/Java/Unicode/OWASP primary sources로 보충했습니다.",
      "Math floor negative-infinity·round negative ties·MIN abs·silent overflow·exact APIs·floorDiv/floorMod는 원본 natural-language 요약의 경계를 보강했습니다.",
      "seeded Random replay/origin-bound와 SecureRandom credential lifecycle을 분리하고 raw secure bytes가 public output에 나타나지 않게 invariant-only example을 만들었습니다.",
      "legacy Date/Calendar/SimpleDateFormat의 default zone·mutability·thread-safety를 explicit UTC adapter와 immutable java.time migration으로 연결했습니다.",
      "Clock.fixed/offset injection, Instant/LocalDateTime semantic choice, DST gap/overlap, Period-vs-Duration은 JDK21 exact examples로 보충했습니다.",
      "모든 public Java examples는 source별 isolated temp classes에서 -encoding UTF-8 --release21 -proc:none -Xlint:all warning0와 exact output을 요구합니다.",
      "원본 audit는 네 Java launcher option variables를 parent compile 전과 모든 ProcessStartInfo children에서 제거하고 finally에서 원래 존재/값을 복원합니다.",
      "JDK_JAVAC_OPTIONS=-Werror, JDK_JAVA_OPTIONS=settings output, JAVA_TOOL_OPTIONS=alternate charset, _JAVA_OPTIONS=alternate language의 hostile environment에서도 summary byte equality를 요구합니다.",
      "child JVM은 Start 직후 stdout/stderr async drain, closed stdin,10초 runtime timeout, tree kill,5초 termination grace, task recovery, finally Dispose를 사용합니다.",
      "OS temp GUID direct-child와 normalized parent equality를 확인한 뒤 그 child만 삭제하고 post-delete·workspace .class/audit residue absence를 검증합니다.",
      "public session target에서 원본 decoded privacy values, raw random/security values, local absolute paths, inventory/private research references가0이어야 합니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
