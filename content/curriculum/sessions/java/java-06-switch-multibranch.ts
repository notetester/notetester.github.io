import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["java-06-switch-multibranch"],
  slug: "java-06-switch-multibranch",
  courseId: "java",
  moduleId: "java-language-control",
  order: 6,
  title: "다중 분기: else-if에서 Java 21 switch 정책까지",
  subtitle: "첫 일치·범위 분할·classic fall-through를 검증하고 switch expression·enum·pattern·sealed exhaustiveness로 안전한 정책을 설계합니다.",
  level: "기초",
  estimatedMinutes: 470,
  coreQuestion: "겹치거나 빠진 조건, 의도하지 않은 fall-through, 새 enum·type 누락을 compiler와 경계 테스트가 잡는 명시적 분기 정책으로 어떻게 바꿀까요?",
  summary: "javastudy day05 Ex01·Ex02·Ex03·Ex04·Ex06 다섯 원본을 Temurin JDK 21.0.11에서 UTF-8로 compile·run했습니다. Ex01·02·03은 else-if의 첫 true branch와 메뉴 계산을, Ex04·06은 int·char·String classic switch와 comma case label을 보여 줍니다. Ex04의 마지막 switch는 case 2에서 case 3과 default까지 내려가며 -Xlint:all fall-through 경고 3개를 냅니다. 원본의 primitive long selector 가능 주석, unknown을 대한민국이나 0원 성공으로 보내는 fallback, 점수·수량·금액 검증 누락을 교정합니다. 이어 Java 14 switch expression·arrow·yield, enum exhaustive policy, Java 21 pattern switch·case null·dominance, Java 17 sealed hierarchy와 별도 컴파일 MatchException 위험, release별 compile diagnostics까지 공식 문서와 실행 예제로 보강합니다.",
  objectives: [
    "else-if가 위에서 아래로 조건을 평가하고 첫 true branch 하나만 실행하는 과정을 추적할 수 있다.",
    "유효 domain을 겹치지 않고 빠짐없이 분할하고 min/max·경계±1 테스트로 검증할 수 있다.",
    "classic switch selector·case label 제약과 break·fall-through 실행 순서를 정확히 설명할 수 있다.",
    "arrow rule과 switch expression의 yield·type·exhaustiveness를 사용해 sentinel 대입을 제거할 수 있다.",
    "raw code를 enum 경계에서 변환하고 새 enum constant 누락을 compiler가 찾는 정책을 설계할 수 있다.",
    "Java 21 pattern switch의 null·guard·dominance와 sealed hierarchy의 exhaustive 분기를 구현할 수 있다.",
    "Java 14·17·21 문법 경계와 compile-fail fixtures를 CI의 --release 계약으로 검증할 수 있다.",
  ],
  lab: {
    title: "카페 주문 분기를 total enum policy로 리팩터링합니다",
    scenario: "원본 Ex03의 메뉴·수량·입금 흐름을 valid menu·positive count·exact integer total·충분한 payment가 모두 명시되는 testable order policy로 바꿉니다.",
    setup: [
      "원본 다섯 main과 fall-through warning 3개를 먼저 재현합니다.",
      "menu 0/1/4/5, count 0/1, payment total-1/total 경계를 준비합니다.",
      "돈은 원 단위 정수와 명시적 VAT rounding policy를 사용하고 synthetic values만 기록합니다.",
    ],
    steps: [
      "Ex03의 raw menu int를 Menu.fromCode에서 enum 또는 INVALID_MENU로 변환합니다.",
      "Menu에 code·label·priceWon을 두고 중복 가격 variables와 else-if를 제거합니다.",
      "Order 생성 시 count>0 invariant를 검사하고 multiplication overflow를 checked arithmetic으로 처리합니다.",
      "VAT 10%의 rounding 단위·mode를 문서화하고 total 계산을 pure method로 분리합니다.",
      "payment<total은 SHORT_PAYMENT, 같거나 크면 Quote 결과와 change를 반환합니다.",
      "Menu family는 default 없는 exhaustive enum switch로 분류합니다.",
      "UI Scanner input과 pure domain policy를 분리해 boundary tests가 키보드에 의존하지 않게 합니다.",
      "Java 14/17/21 release matrix와 unknown/null/enum-all-values tests를 실행합니다.",
    ],
    expectedResult: [
      "menu2·count2·payment10000의 명시적 정책 결과는 카페라떼·total8800·change1200입니다.",
      "menu9는 INVALID_MENU, count0은 INVALID_COUNT, payment8799는 SHORT_PAYMENT입니다.",
      "모든 Menu constant가 정확히 한 family를 갖고 새 constant 누락은 compile 단계에서 드러납니다.",
      "오류·telemetry에 실제 이름·결제 원문·secret이 포함되지 않습니다.",
    ],
    cleanup: ["GUID temp root의 resolved parent를 확인한 뒤 검증 산출물만 제거합니다.", "원본 day05 sources는 read-only evidence로 유지합니다."],
    extensions: ["sealed Payment(Cash/Card)로 결제 수단을 확장합니다.", "가격을 config로 옮길 때 schema/version/rollback 정책을 추가합니다.", "property test로 valid order total·change invariant를 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "점수 domain과 학점 경계를 표로 먼저 쓰고 validation-first else-if를 구현하세요.", requirements: ["-1/0/69/70/79/80/89/90/100/101을 실행합니다.", "범위 밖을 INVALID로 분리합니다.", "first-match trace를 남깁니다.", "한 input당 결과 하나를 assertion합니다."], hints: ["높은 threshold부터 배치하세요.", "else를 invalid 처리로 쓰지 마세요."], expectedOutcome: "silent invalid나 shadowed grade 없이 경계표와 코드가 일치합니다.", solutionOutline: ["domain validation을 먼저 반환합니다.", "threshold branches와 expected table을 대조합니다."] },
    { difficulty: "응용", prompt: "Ex04 classic switch를 arrow statement와 switch expression 두 버전으로 바꾸세요.", requirements: ["selector once를 유지합니다.", "fall-through warning을 제거합니다.", "comma labels와 yield block을 각각 사용합니다.", "unknown·null policy를 분리합니다.", "--release 11 실패와 14 성공을 기록합니다."], hints: ["statement와 value 생산 목적을 나누세요.", "default는 null catcher가 아닙니다."], expectedOutcome: "control flow와 result type이 명확하고 release boundary가 재현됩니다.", solutionOutline: ["원본 stdout을 golden으로 고정합니다.", "colon→arrow→expression 순서로 변환합니다."] },
    { difficulty: "설계", prompt: "enum Menu와 sealed Payment를 사용하는 주문 정책의 진화·배포 전략을 설계하세요.", requirements: ["raw lookup failure를 명시합니다.", "enum/sealed switch는 exhaustive하게 둡니다.", "돈·수량 invariant와 overflow를 정의합니다.", "dependency evolution MatchException 위험을 포함합니다.", "full rebuild·compatibility test·rollback을 설계합니다."], hints: ["compile-time closed world와 runtime deployment world를 구분하세요.", "broad default의 비용을 기록하세요."], expectedOutcome: "새 메뉴·결제 수단 추가가 누락 없이 배포되는 implementation-ready policy가 됩니다.", solutionOutline: ["adapter→domain→quote→render 경계로 나눕니다.", "source/runtime version matrix를 CI에 둡니다."] },
  ],
  reviewQuestions: [
    { question: "85점에서 C 조건이 왜 평가되지 않나요?", answer: "B 조건이 첫 true라 else-if chain이 그 자리에서 종료되기 때문입니다." },
    { question: "점수 분할의 두 완전성 조건은 무엇인가요?", answer: "유효 domain 전체 coverage와 category 간 non-overlap입니다." },
    { question: "switch selector는 몇 번 평가되나요?", answer: "switch 진입 시 정확히 한 번 평가됩니다." },
    { question: "case 2 뒤 case 3 조건을 다시 비교하나요?", answer: "아닙니다. colon fall-through는 label 조건을 재검사하지 않고 statements를 이어 실행합니다." },
    { question: "primitive long은 Java 21 switch selector인가요?", answer: "아닙니다. boxed Long pattern과 primitive long selector를 구분해야 합니다." },
    { question: "unlabeled break는 항상 switch를 끝내나요?", answer: "가장 안쪽 switch 또는 loop를 끝내므로 더 안쪽 loop가 있으면 target이 달라질 수 있습니다." },
    { question: "arrow rule에 break가 필요한가요?", answer: "아닙니다. arrow rule은 다른 rule로 fall-through하지 않습니다." },
    { question: "switch expression block에서 값은 어떻게 내나요?", answer: "모든 정상 path가 yield value를 실행하거나 throw해야 합니다." },
    { question: "default 없는 switch expression이 가능한가요?", answer: "enum·sealed의 모든 alternatives를 compiler가 증명하면 가능합니다." },
    { question: "default가 null을 잡나요?", answer: "아닙니다. case null이 없으면 nullable selector는 NPE입니다." },
    { question: "dominance는 runtime first-match 문제인가요?", answer: "앞의 넓은 pattern이 뒤를 완전히 덮으면 compiler가 도달 불가능 label로 거부합니다." },
    { question: "enum switch의 default를 생략하는 이유는 무엇인가요?", answer: "새 constant 추가 때 누락을 compile signal로 받을 수 있기 때문입니다." },
    { question: "sealed exhaustive switch가 영원히 안전한가요?", answer: "아닙니다. separate compilation으로 hierarchy만 진화하면 stale consumer에서 MatchException 가능성이 있습니다." },
    { question: "comma labels·yield·arrow는 어느 Java에서 final인가요?", answer: "Java 14입니다. sealed는 17, pattern switch는 21에서 final입니다." },
    { question: "Ex06 charAt(0)이 안전한 한 문자 입력인가요?", answer: "빈 줄에서 실패하고 supplementary 문자는 surrogate 절반만 읽으므로 code point validation이 필요합니다." },
  ],
  completionChecklist: [
    "day05 Ex01·Ex02·Ex03·Ex04·Ex06 다섯 원본을 직접 읽고 사용했다.",
    "원본 stdout과 Ex04 fall-through warning 3개를 재현했다.",
    "else-if first-match와 shadowing을 predicate trace로 설명했다.",
    "score valid domain의 coverage·non-overlap·boundary matrix를 검증했다.",
    "if·switch·enum/table·strategy 선택 기준을 비교했다.",
    "selector once와 primitive long/runtime constant label 제약을 설명했다.",
    "colon fall-through·break nearest target·comma grouping을 구분했다.",
    "arrow statement와 switch expression·yield·type contract를 실행했다.",
    "raw menu code를 enum boundary에서 명시적으로 거부했다.",
    "enum switch default trade-off와 새 constant compile signal을 설명했다.",
    "Java 21 pattern switch의 guard·null·dominance를 실행했다.",
    "sealed hierarchy를 default 없이 exhaustive하게 분기했다.",
    "separate-compilation MatchException과 full rebuild 정책을 설명했다.",
    "Java 14·17·21 feature boundary와 --release CI 계약을 기록했다.",
    "Scanner 빈 줄·Unicode code point와 메뉴 수량·금액 validation을 연결했다.",
    "경계·compile-fail·all-enum·all-sealed test matrix와 privacy-safe errors를 설계했다.",
  ],
  nextSessions: [],
  sources: [
    { id: "java-day05-ex01", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day05/Ex01.java", usedFor: ["descending else-if", "ASCII classification", "unknown fallback", "menu calculation"], evidence: "B학점·소문자·대한민국·잔돈2300을 재현하고 범위·unknown·돈 정책 결함을 교정했습니다." },
    { id: "java-day05-ex02", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day05/Ex02.java", usedFor: ["Scanner grade input", "total average", "grade thresholds", "blank output line"], evidence: "홍 길동·100·90·80으로 총점270·평균90.0·A학점을 재현하고 범위 검증 누락을 확인했습니다." },
    { id: "java-day05-ex03", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day05/Ex03.java", usedFor: ["interactive menu", "early invalid return", "payment and change", "negative count risk"], evidence: "menu2·count2·payment10000의 총액8800·잔돈1200과 invalid/negative domain 위험을 확인했습니다." },
    { id: "java-day05-ex04", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day05/Ex04.java", usedFor: ["int char String classic switch", "break", "fall-through", "long selector comment correction"], evidence: "여섯 출력행과 -Xlint fall-through warning 3개를 재현하고 primitive long 주석을 교정했습니다." },
    { id: "java-day05-ex06", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day05/Ex06.java", usedFor: ["comma labels", "Scanner newline", "char and String switch", "empty and Unicode risk"], evidence: "menu2·a·미국 입력 결과와 Java14 syntax, charAt(0)·unknown fallback 위험을 확인했습니다." },
    { id: "jdk21-javac", repository: "Oracle Java SE 21 Tool Specifications", path: "javac command", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["encoding", "Xlint fallthrough", "XDrawDiagnostics", "--release"], evidence: "원본·runtime·compile-fail examples의 compiler 기준입니다." },
    { id: "jls-if", repository: "Oracle Java Language Specification 21", path: "14.9 if Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.9", usedFor: ["else-if evaluation", "first match", "boolean conditions"], evidence: "predicate trace와 validation-first chain의 language 기준입니다." },
    { id: "jls-switch-statement", repository: "Oracle Java Language Specification 21", path: "14.11 switch Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.11", usedFor: ["selector", "labels", "fall-through", "break", "patterns", "null", "exhaustiveness"], evidence: "classic과 enhanced switch statement의 핵심 기준입니다." },
    { id: "jls-break", repository: "Oracle Java Language Specification 21", path: "14.15 break Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.15", usedFor: ["nearest loop or switch target", "unlabeled break", "abrupt completion"], evidence: "classic switch와 중첩 loop에서 break target을 정확히 설명합니다." },
    { id: "jls-yield", repository: "Oracle Java Language Specification 21", path: "14.21 yield Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.21", usedFor: ["switch expression block result", "yield target", "abrupt completion"], evidence: "block arm이 result value를 내는 공식 statement 기준입니다." },
    { id: "jls-switch-expression", repository: "Oracle Java Language Specification 21", path: "15.28 switch Expressions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.28", usedFor: ["result value", "yield", "type", "exhaustiveness"], evidence: "SwitchExpressionLab과 enum expression의 기준입니다." },
    { id: "jls-sealed", repository: "Oracle Java Language Specification 21", path: "8.1.6 Sealed Classes and Interfaces", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.6", usedFor: ["permits", "closed hierarchy", "exhaustive applicability"], evidence: "Payment hierarchy coverage의 language 기준입니다." },
    { id: "jep361", repository: "OpenJDK", path: "JEP 361 Switch Expressions", publicUrl: "https://openjdk.org/jeps/361", usedFor: ["Java 14 final", "arrow", "yield", "comma labels"], evidence: "modern switch syntax의 final release 경계를 고정합니다." },
    { id: "jep409", repository: "OpenJDK", path: "JEP 409 Sealed Classes", publicUrl: "https://openjdk.org/jeps/409", usedFor: ["Java 17 final sealed", "permits design"], evidence: "sealed feature timeline과 design intent의 기준입니다." },
    { id: "jep441", repository: "OpenJDK", path: "JEP 441 Pattern Matching for switch", publicUrl: "https://openjdk.org/jeps/441", usedFor: ["Java 21 final pattern switch", "case null", "when guard", "dominance", "MatchException evolution"], evidence: "PatternSwitchLab과 evolution 설명의 공식 기준입니다." },
    { id: "java-match-exception", repository: "Oracle Java SE 21 API", path: "java.lang.MatchException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/MatchException.html", usedFor: ["exhaustive switch runtime failure", "separate compilation"], evidence: "stale exhaustive consumer의 deployment risk 기준입니다." },
    { id: "java-scanner-api", repository: "Oracle Java SE 21 API", path: "java.util.Scanner", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Scanner.html", usedFor: ["nextInt/nextLine boundary", "blank input", "resource ownership"], evidence: "Ex06 newline 소비와 empty line validation 설명을 보강합니다." },
    { id: "java-character-api", repository: "Oracle Java SE 21 API", path: "java.lang.Character", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Character.html", usedFor: ["code point", "supplementary character", "Unicode classification"], evidence: "charAt(0)의 UTF-16 code-unit 한계를 code point 정책과 구분합니다." },
    { id: "java-math-api", repository: "Oracle Java SE 21 API", path: "java.lang.Math exact methods", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html#multiplyExact(long,long)", usedFor: ["checked menu total", "overflow rejection", "long intermediate"], evidence: "EnumMenuLab quote의 fixed-width overflow 정책을 명시합니다." },
  ],
  sourceCoverage: {
    filesRead: 5,
    filesUsed: 5,
    uncoveredNotes: [
      "inventory의 day05 Ex01·Ex02·Ex03·Ex04·Ex06을 모두 UTF-8로 읽고 JDK 21.0.11에서 compile/run했습니다.",
      "Ex04의 intentional fall-through warning 3개를 정상 evidence로 보존하고 primitive long selector 주석은 JLS에 맞춰 교정했습니다.",
      "Ex01·02의 점수 범위와 Ex01·03의 menu/count/payment/돈 계산 validation 누락을 silent fallback이 없는 정책으로 확장했습니다.",
      "Ex06 comma labels는 Java14+이며 빈 line·supplementary Unicode·null selector는 원본 밖 boundary 보강입니다.",
      "switch expression·yield·enum exhaustive policy는 Java14, sealed는 Java17, pattern/null/dominance는 Java21 공식 문서 기반 재구성입니다.",
      "separate-compilation MatchException·release compile fixtures·property/compatibility tests는 production evolution 보강입니다.",
    ],
  },
  prerequisites: [
    { title: "Scanner 입력·조건식·if/else 경계", reason: "조건식·validation-first branching과 입력 경계를 알아야 범위 정책과 switch selector를 안전하게 구성할 수 있습니다.", sessionSlug: "java-05-scanner-if" },
  ],
  keywords: ["else-if", "first match", "domain partition", "switch", "case", "break", "fall-through", "arrow rule", "switch expression", "yield", "exhaustiveness", "enum", "pattern switch", "case null", "guard", "dominance", "sealed", "MatchException", "--release"],
  chapters: [
    {
      id: "five-source-golden-audit",
      title: "다섯 원본의 정상 출력과 fall-through 경고를 먼저 고정합니다",
      lead: "active code·주석의 주장·실제 stdout과 compiler warning을 분리합니다.",
      explanations: [
        "Ex01의 89점은 A 조건 false 뒤 B 조건 true에서 종료되어 B학점입니다. 문자 h는 ASCII 소문자이고, 등록되지 않은 국가 코드 h는 원본의 broad else 때문에 대한민국으로 오분류됩니다.",
        "Ex02는 이름 한 줄과 정수 세 개를 읽어 100·90·80이면 총점 270, 평균 90.0, A학점을 출력하지만 0..100 범위는 검증하지 않습니다.",
        "Ex03은 메뉴 2·수량 2·입금 10000에서 카페라떼 총액 8800·잔돈 1200을 출력합니다. 음수 수량과 금액 overflow·부가세 반올림은 검증하지 않습니다.",
        "Ex04는 int·char·String selector를 실행하고 마지막 num=2에서 2번→3번→default로 내려갑니다. 이것은 의도된 관찰 예제이며 -Xlint:all 경고 3개도 evidence입니다.",
        "Ex06의 comma label은 Java 14+ 문법입니다. nextInt 뒤 pending newline을 소비하는 것은 맞지만 실제 빈 문자 줄은 charAt(0)에서 실패합니다.",
      ],
      concepts: [
        { term: "golden evidence", definition: "고정 입력·compiler option·stdout·warning을 재현 가능한 기준으로 저장한 것입니다.", detail: ["주석과 구분합니다.", "빈 줄과 fall-through 경고도 포함합니다."] },
        { term: "active branch", definition: "실제 입력과 조건으로 선택되어 실행된 분기입니다.", detail: ["comment-only 대안은 evidence가 아닙니다.", "trace로 확인합니다."] },
        { term: "silent fallback", definition: "invalid·unknown을 오류가 아닌 정상 default 값으로 조용히 분류하는 결함입니다.", detail: ["대한민국·0원 예가 있습니다.", "명시적 실패로 바꿉니다."] },
      ],
      codeExamples: [
        {
          id: "java-original-switch-output-audit",
          title: "원본 다섯 main과 fall-through warning을 safe temp에서 재현합니다",
          language: "powershell",
          filename: "verify-original-switch.ps1",
          purpose: "legacy output과 warning을 현대 보강 예제와 분리합니다.",
          code: String.raw`$src = "src\com\ictedu\day05"
$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("java06-original-" + [Guid]::NewGuid().ToString("N"))
if (Test-Path $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
try {
  $files = @("Ex01.java", "Ex02.java", "Ex03.java", "Ex04.java", "Ex06.java") | ForEach-Object { Join-Path $src $_ }
  $warnings = & javac -encoding UTF-8 -Xlint:all -XDrawDiagnostics -d $root $files 2>&1
  if ($LASTEXITCODE -ne 0) { throw "compile failed" }
  $warningText = $warnings -join [Environment]::NewLine
  "fallthrough-warnings=$(([regex]::Matches($warningText, 'compiler\.warn\.possible\.fall-through')).Count)"
  function Summary([string] $name, [string[]] $inputLines) {
    if ($inputLines.Count -eq 0) { $lines = & java -cp $root "com.ictedu.day05.$name" }
    else { $lines = $inputLines | & java -cp $root "com.ictedu.day05.$name" }
    if ($LASTEXITCODE -ne 0) { throw "run failed: $name" }
    "$name=$($lines -join '|')"
  }
  Summary "Ex01" @()
  Summary "Ex02" @("홍 길동", "100", "90", "80")
  Summary "Ex03" @("2", "2", "10000")
  Summary "Ex04" @()
  Summary "Ex06" @("2", "a", "미국")
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}`,
          walkthrough: [
            { lines: "1-6", explanation: "system temp 바로 아래에 GUID create-new root를 만들고 cleanup 경계를 고정합니다." },
            { lines: "8-11", explanation: "다섯 원본을 함께 compile하고 XDrawDiagnostics에서 fall-through warning 수를 계산합니다." },
            { lines: "12-18", explanation: "고정 stdin을 native process에 전달하고 stdout lines를 pipe summary로 만듭니다." },
            { lines: "19-26", explanation: "네 대표 main을 실행한 뒤 resolved parent가 temp base인지 확인하고 생성한 root만 제거합니다." },
          ],
          run: { environment: ["PowerShell 7+", "Temurin/OpenJDK 21", "javastudy MyJavaProject root"], command: "pwsh -NoProfile -File verify-original-switch.ps1" },
          output: { value: "fallthrough-warnings=3\nEx01=당신의 학점은 B학점입니다.|당신의 문자는 소문자입니다.|해당 국가는 대한민국입니다.|잔돈은 2300이다.\nEx02=이름 입력 : 국어점수 입력 : 영어점수 입력 : 수학점수 입력 : |이름 : 홍 길동|총점 : 270|평균 : 90.0|학점 : A학점\nEx03=-메뉴-|1. 카페모카 3500원|2. 카페라떼 4000원|3. 아메리카노 2500원|4. 과일쥬스 3000원|메뉴 입력 : 주문 수량 입력 : 입금할 금액 입력 : |음료 종류 : 카페라떼|입금액 : 10000|수량 : 2|총액 : 8800|잔돈 : 1200\nEx04=1번 선택|대문자 A|커피 주문|2번 선택|3번 선택|해당사항 없음\nEx06=메뉴를 입력하세요. 1. 카페모카, 2. 카페라떼, 3. 아메리카노, 4. 과일쥬스|주문 메뉴 : 카페라떼|문자를 입력하세요.|해당 국가는 아프리카입니다.|나라를 입력하세요.|해당 나라의 수도는 워싱턴입니다.", explanation: ["Ex04 warning 3개는 의도된 원본 evidence입니다.", "사용자 이름과 금액은 synthetic fixture만 사용합니다."] },
          experiments: [
            { change: "Ex04 마지막 case 2와 3에 break를 넣습니다.", prediction: "warning이 사라지고 output은 2번 선택 한 줄에서 끝납니다.", result: "control-flow 변경과 warning 변경을 함께 검토합니다." },
            { change: "Ex02 점수를 101로 넣습니다.", prediction: "원본은 범위 밖이어도 A로 분류합니다.", result: "parse와 domain validation을 분리합니다." },
            { change: "Ex06 문자 입력을 빈 줄로 둡니다.", prediction: "charAt(0)에서 StringIndexOutOfBoundsException이 납니다.", result: "문자열 길이·code point를 먼저 검증합니다." },
          ],
          sourceRefs: ["java-day05-ex01", "java-day05-ex02", "java-day05-ex03", "java-day05-ex04", "java-day05-ex06", "jdk21-javac", "java-scanner-api", "java-character-api"],
        },
      ],
      diagnostics: [
        { symptom: "원본 전체를 warning 0으로 기록했다.", likelyCause: "fall-through warning을 오류처럼 버렸거나 stderr를 확인하지 않았습니다.", checks: ["-Xlint:all과 -XDrawDiagnostics를 함께 실행합니다.", "Ex04 66·69·72행을 봅니다.", "stdout과 warning을 분리합니다."], fix: "의도된 warning 3개를 golden evidence로 보존하고 accidental warning은 제거합니다.", prevention: "warning count와 category를 regression test에 둡니다." },
      ],
    },
    {
      id: "else-if-first-match",
      title: "else-if는 첫 true 분기에서 끝나며 뒤 조건은 평가조차 하지 않습니다",
      lead: "내림차순 threshold가 단순 스타일이 아니라 set shadowing을 막는 이유를 trace합니다.",
      explanations: [
        "if 조건이 false일 때만 다음 else-if를 평가하고, 하나가 true이면 그 branch를 실행한 뒤 chain 전체가 끝납니다.",
        "점수 85에서는 >=90 false, >=80 true이므로 B이고 >=70 조건은 호출되지 않습니다.",
        "넓은 >=70 조건을 먼저 두면 95도 C에서 끝나 상위 등급이 shadow됩니다. 더 구체적·높은 threshold를 먼저 둡니다.",
        "first-match는 조건 자체의 overlap을 없애지 않습니다. 순서가 policy 우선순위를 결정하므로 review에서 각 predicate set을 적습니다.",
        "분기 안의 logging·mutation도 선택된 branch만 실행됩니다. 관찰을 위해 predicate에 side effect를 넣되 production에서는 pure predicate를 선호합니다.",
      ],
      concepts: [
        { term: "first match", definition: "위에서 처음 true가 된 branch 하나만 실행하는 else-if 규칙입니다.", detail: ["뒤 조건은 평가하지 않습니다.", "우선순위가 생깁니다."] },
        { term: "shadowed condition", definition: "앞의 더 넓은 조건 때문에 뒤 조건이 true여도 도달하지 못하는 상태입니다.", detail: ["threshold 순서를 점검합니다.", "경계 테스트로 찾습니다."] },
        { term: "predicate trace", definition: "각 조건의 평가 여부와 boolean 결과를 순서대로 기록한 것입니다.", detail: ["미평가도 evidence입니다.", "side effect 진단에 유용합니다."] },
      ],
      codeExamples: [
        {
          id: "java-else-if-first-match-trace",
          title: "85점에서 C 조건이 호출되지 않는 것을 출력합니다",
          language: "java",
          filename: "src/learning/java06/ElseIfTraceLab.java",
          purpose: "first-match를 최종 grade뿐 아니라 predicate 호출 흔적으로 증명합니다.",
          code: String.raw`package learning.java06;

public class ElseIfTraceLab {
    private static boolean check(String label, boolean result) {
        System.out.println("check=" + label + ":" + result);
        return result;
    }
    public static void main(String[] args) {
        int score = 85;
        String grade;
        if (check("A", score >= 90)) grade = "A";
        else if (check("B", score >= 80)) grade = "B";
        else if (check("C", score >= 70)) grade = "C";
        else grade = "F";
        System.out.println("grade=" + grade);
    }
}`,
          walkthrough: [
            { lines: "4-7", explanation: "predicate wrapper가 label과 result를 남기고 같은 boolean을 반환합니다." },
            { lines: "9-15", explanation: "85를 내림차순 threshold에 적용하며 B true 뒤 C 호출이 없는지를 봅니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java06/ElseIfTraceLab.java && java -cp build/classes learning.java06.ElseIfTraceLab" },
          output: { value: "check=A:false\ncheck=B:true\ngrade=B", explanation: ["C log 부재가 미평가 evidence입니다.", "first true B만 결과를 만듭니다."] },
          experiments: [
            { change: ">=70 branch를 맨 앞으로 옮깁니다.", prediction: "85가 C가 되고 다른 log가 없습니다.", result: "조건 순서가 policy입니다." },
            { change: "score를 90으로 바꿉니다.", prediction: "A true 한 번만 기록됩니다.", result: "at-boundary를 검증합니다." },
            { change: "각 branch를 독립 if로 바꿉니다.", prediction: "85에서 B와 C가 모두 실행될 수 있습니다.", result: "서로 배타적인 결과에는 chain을 사용합니다." },
          ],
          sourceRefs: ["java-day05-ex01", "java-day05-ex02", "jls-if"],
        },
      ],
      diagnostics: [
        { symptom: "95점이 C로 분류된다.", likelyCause: ">=70 같은 넓은 조건이 >=90보다 앞에 있습니다.", checks: ["95로 각 predicate를 표에 씁니다.", "실제 평가 log를 봅니다.", "branch 순서를 요구사항과 비교합니다."], fix: "높은 threshold부터 내림차순으로 배치하고 validation을 먼저 둡니다.", prevention: "89/90·79/80·69/70과 100을 boundary suite로 유지합니다." },
      ],
    },
    {
      id: "domain-partition-boundaries",
      title: "입력 유효성·coverage·non-overlap을 분리해 모든 값이 정확히 한 결과를 갖게 합니다",
      lead: "else를 나머지 정상값이 아니라 검증된 domain의 마지막 partition으로 사용합니다.",
      explanations: [
        "점수 domain이 0..100이면 -1과 101은 F나 A가 아니라 INVALID입니다. classification 전에 validation합니다.",
        "valid domain coverage는 모든 유효값이 어떤 결과에 속한다는 뜻이고 non-overlap은 두 결과에 동시에 속하지 않는다는 뜻입니다.",
        "경계값은 threshold 바로 아래·정확히·바로 위를 포함합니다. 69/70, 79/80, 89/90을 최소 fixture로 둡니다.",
        "double score에 NaN이 들어오면 모든 ordered comparison이 false여서 broad else F로 갈 수 있으므로 finite validation이 먼저입니다.",
        "gap·overlap은 조건문만 읽기보다 decision table과 property `valid input -> exactly one outcome`으로 검증합니다.",
      ],
      concepts: [
        { term: "total partition", definition: "유효 domain의 모든 값이 최소 한 category에 속하는 분할입니다.", detail: ["gap이 없어야 합니다.", "invalid domain은 별도입니다."] },
        { term: "disjoint partition", definition: "한 값이 두 category에 동시에 속하지 않는 분할입니다.", detail: ["독립 if overlap을 찾습니다.", "first-match에 숨지 않게 합니다."] },
        { term: "boundary matrix", definition: "각 전환점과 양옆 값을 expected category로 나열한 표입니다.", detail: ["off-by-one을 찾습니다.", "범위 밖도 포함합니다."] },
      ],
      codeExamples: [
        {
          id: "java-grade-partition-boundaries",
          title: "유효성 검사 뒤 열 개 경계값을 정확히 한 등급으로 분류합니다",
          language: "java",
          filename: "src/learning/java06/GradePartitionLab.java",
          purpose: "원본 threshold를 invalid 분리와 완전한 boundary matrix로 확장합니다.",
          code: String.raw`package learning.java06;

public class GradePartitionLab {
    static String grade(int score) {
        if (score < 0 || score > 100) return "INVALID";
        if (score >= 90) return "A";
        if (score >= 80) return "B";
        if (score >= 70) return "C";
        return "F";
    }
    public static void main(String[] args) {
        int[] values = {-1, 0, 69, 70, 79, 80, 89, 90, 100, 101};
        for (int value : values) System.out.println(value + "=" + grade(value));
    }
}`,
          walkthrough: [
            { lines: "4-10", explanation: "invalid를 먼저 반환한 뒤 valid domain을 내림차순으로 분할합니다." },
            { lines: "12-14", explanation: "배열은 범위 밖·최솟값·모든 threshold 양옆·최댓값을 담습니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java06/GradePartitionLab.java && java -cp build/classes learning.java06.GradePartitionLab" },
          output: { value: "-1=INVALID\n0=F\n69=F\n70=C\n79=C\n80=B\n89=B\n90=A\n100=A\n101=INVALID", explanation: ["모든 valid value는 한 grade를 갖습니다.", "범위 밖은 조용히 F/A로 섞이지 않습니다."] },
          experiments: [
            { change: "score>=80 조건을 score>=80&&score<89로 바꿉니다.", prediction: "89가 B에서 빠져 C로 내려갑니다.", result: "upper bound off-by-one을 표로 찾습니다." },
            { change: "validation을 제거합니다.", prediction: "101은 A, -1은 F가 됩니다.", result: "classification과 validity를 분리합니다." },
            { change: "return 대신 독립 if count를 증가시킵니다.", prediction: "95가 여러 threshold에 속합니다.", result: "partition non-overlap을 assertion합니다." },
          ],
          sourceRefs: ["java-day05-ex01", "java-day05-ex02", "jls-if"],
        },
      ],
      diagnostics: [
        { symptom: "101점은 A, -1점은 F로 정상 처리된다.", likelyCause: "parse success를 domain success로 보아 range validation을 생략했습니다.", checks: ["0..100 계약을 확인합니다.", "min/max±1을 실행합니다.", "NaN·Infinity 가능 type인지 봅니다."], fix: "분류 전에 invalid를 명시적 result로 반환합니다.", prevention: "boundary matrix와 exactly-one-outcome property를 둡니다." },
      ],
    },
    {
      id: "choose-if-switch-table-strategy",
      title: "범위는 if, 한 selector의 이산 equality는 switch, 변하는 데이터는 table·strategy를 선택합니다",
      lead: "switch를 모든 다중 분기의 대체 문법으로 사용하지 않습니다.",
      explanations: [
        "점수 범위·복합 predicate·검증 순서처럼 relational logic이 핵심이면 if/else가 직접적입니다.",
        "하나의 selector를 상수 labels와 equality로 분기하면 switch가 중복 비교를 줄이고 exhaustiveness 도구를 제공합니다.",
        "메뉴 code→label·price 같은 데이터가 함께 변하면 enum이나 Map이 single source of truth를 만들기 쉽습니다.",
        "운영 중 자주 바뀌는 가격·배송 규칙은 source switch보다 config·database·strategy가 배포와 검증에 적합할 수 있습니다.",
        "문법 선택 전에 invalid raw value, null, 새 값 추가, observability와 테스트 책임이 어디에 있는지 결정합니다.",
        "선택한 switch 문법은 project --release와 dependency evolution에도 맞아야 합니다. 아래 diagnostic harness가 Java 11/14/21 compile 경계와 stale sealed consumer를 먼저 고정합니다.",
      ],
      concepts: [
        { term: "discrete selector", definition: "한 값이 유한한 상수 후보 중 무엇과 같은지 비교하는 분기 입력입니다.", detail: ["switch에 적합합니다.", "범위와 다릅니다."] },
        { term: "table-driven policy", definition: "code와 속성·결과를 Map·enum·config 행으로 표현한 정책입니다.", detail: ["중복을 줄입니다.", "데이터 변경에 적합합니다."] },
        { term: "strategy boundary", definition: "행동이 domain type·운영 정책마다 달라질 때 구현을 교체 가능한 객체로 분리하는 경계입니다.", detail: ["open set에 유리합니다.", "단순 분기에는 과할 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "java-switch-release-and-evolution-diagnostics",
          title: "release·selector·dominance·yield 실패와 stale sealed MatchException을 자동 검증합니다",
          language: "powershell",
          filename: "verify-switch-diagnostics.ps1",
          purpose: "source compile constraints와 separate-compilation runtime evolution을 한 safe temp harness에서 분리합니다.",
          code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("java06-diag-" + [Guid]::NewGuid().ToString("N"))
$src = Join-Path $root "src"; $out = Join-Path $root "classes"
if (Test-Path $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
New-Item -ItemType Directory -Path $src, $out -ErrorAction Stop | Out-Null
$utf8 = [Text.UTF8Encoding]::new($false)
function Compile-Invalid([string] $name, [string] $source, [string[]] $options) {
  $file = Join-Path $src "$name.java"
  [IO.File]::WriteAllText($file, $source, $utf8)
  $null = & javac @options -d $out $file 2>&1
  return $LASTEXITCODE
}
try {
  $comma = 'class Comma { static int f(int x) { return switch(x) { case 1, 2 -> 1; default -> 0; }; } }'
  $r11 = Compile-Invalid "Comma" $comma @("--release", "11")
  $r14 = Compile-Invalid "Comma" $comma @("--release", "14")
  $long = Compile-Invalid "LongSelector" 'class LongSelector { static int f(long x) { return switch(x) { default -> 0; }; } }' @("--release", "21")
  $dominated = Compile-Invalid "Dominated" 'class Dominated { static String f(Object x) { return switch(x) { case CharSequence c -> "C"; case String s -> "S"; default -> "D"; }; } }' @("--release", "21")
  $missing = Compile-Invalid "MissingYield" 'class MissingYield { static int f(int x) { return switch(x) { case 0 -> { System.out.print(""); } default -> 1; }; } }' @("--release", "21")
  $nonExhaustive = Compile-Invalid "NonExhaustive" 'class NonExhaustive { static int f(int x) { return switch(x) { case 0 -> 0; }; } }' @("--release", "21")
  "release11=$r11,release14=$r14"
  "long=$long,dominated=$dominated,missingYield=$missing,nonExhaustive=$nonExhaustive"

  $evo = Join-Path $src "evo"; New-Item -ItemType Directory -Path $evo | Out-Null
  [IO.File]::WriteAllText((Join-Path $evo "Payment.java"), 'package evo; public sealed interface Payment permits Cash, Card {} record Cash(int amount) implements Payment {} record Card(String last4) implements Payment {}', $utf8)
  [IO.File]::WriteAllText((Join-Path $evo "Consumer.java"), 'package evo; public class Consumer { public static String render(Payment p) { return switch(p) { case Cash c -> "CASH"; case Card c -> "CARD"; }; } }', $utf8)
  $null = & javac --release 21 -d $out (Join-Path $evo "Payment.java") (Join-Path $evo "Consumer.java") 2>&1
  if ($LASTEXITCODE -ne 0) { throw "v1 compile failed" }
  [IO.File]::WriteAllText((Join-Path $evo "Payment.java"), 'package evo; public sealed interface Payment permits Cash, Card, Point {} record Cash(int amount) implements Payment {} record Card(String last4) implements Payment {} record Point(int value) implements Payment {}', $utf8)
  [IO.File]::WriteAllText((Join-Path $evo "Runner.java"), 'package evo; public class Runner { public static void main(String[] a) { try { Consumer.render(new Point(7)); } catch (MatchException e) { System.out.println("stale=" + e.getClass().getSimpleName()); } } }', $utf8)
  $null = & javac --release 21 -cp $out -d $out (Join-Path $evo "Payment.java") (Join-Path $evo "Runner.java") 2>&1
  if ($LASTEXITCODE -ne 0) { throw "v2 compile failed" }
  java -cp $out evo.Runner
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}`,
          walkthrough: [
            { lines: "1-11", explanation: "GUID system-temp root와 BOM 없는 writer, 한 오류씩 compile하는 helper를 준비합니다." },
            { lines: "13-22", explanation: "comma label release 11/14, long selector, dominated pattern, missing yield, non-exhaustive expression exit를 분리합니다." },
            { lines: "24-34", explanation: "Payment v1과 Consumer exhaustive switch를 먼저 compile한 뒤 hierarchy에 Point를 추가하되 Consumer는 재compile하지 않습니다." },
            { lines: "35-43", explanation: "v2 Runner가 stale Consumer에 Point를 전달해 MatchException을 확인하고 생성한 temp root만 제거합니다." },
          ],
          run: { environment: ["PowerShell 7+", "Temurin/OpenJDK 21"], command: "pwsh -NoProfile -File verify-switch-diagnostics.ps1" },
          output: { value: "release11=1,release14=0\nlong=1,dominated=1,missingYield=1,nonExhaustive=1\nstale=MatchException", explanation: ["release syntax와 각 compile constraint는 nonzero exit로 고정됩니다.", "dependency hierarchy만 진화한 stale exhaustive consumer는 runtime MatchException을 냅니다."] },
          experiments: [
            { change: "Point 추가 뒤 Consumer도 함께 재compile합니다.", prediction: "Point arm 누락이 compile failure로 드러납니다.", result: "full rebuild가 closed-world 변화 신호를 복구합니다." },
            { change: "Consumer v1에 default를 추가합니다.", prediction: "stale runtime MatchException 대신 fallback result가 날 수 있습니다.", result: "open boundary에서 defensive default trade-off를 검토합니다." },
            { change: "Comma를 colon labels로 고칩니다.", prediction: "--release 11 compile이 성공합니다.", result: "baseline을 유지할 때 syntax를 낮춥니다." },
          ],
          sourceRefs: ["jdk21-javac", "jls-switch-statement", "jls-switch-expression", "jls-yield", "jep361", "jep409", "jep441", "java-match-exception"],
        },
      ],
      diagnostics: [
        { symptom: "가격 한 개를 바꿨는데 label·total·validation switch가 서로 다른 값을 사용한다.", likelyCause: "같은 menu code 정책을 여러 branch에 복제했습니다.", checks: ["code별 속성 정의 위치를 검색합니다.", "unknown fallback을 봅니다.", "모든 enum/Map entries test를 확인합니다."], fix: "Menu enum/record/Map에 code·label·price를 모으고 raw lookup을 한 경계에서 수행합니다.", prevention: "single source of truth와 all-values parameterized test를 둡니다." },
      ],
    },
    {
      id: "classic-switch-selection",
      title: "classic switch는 selector를 한 번 평가하고 일치 label로 이동합니다",
      lead: "허용 selector·constant label·jump 이후 실행을 정확히 구분합니다.",
      explanations: [
        "switch selector expression은 진입할 때 한 번 평가됩니다. 각 case가 selector method를 다시 호출하지 않습니다.",
        "traditional selector는 byte·short·char·int와 대응 wrapper Byte·Short·Character·Integer, enum, String입니다. primitive long·float·double·boolean은 허용되지 않습니다.",
        "Java 21 pattern switch가 broader reference selector를 지원해도 primitive long switch가 허용된다는 뜻은 아닙니다.",
        "case label은 compile-time constant, enum constant, pattern 등 문법이 허용한 label이어야 하며 임의 runtime variable은 constant case가 아닙니다.",
        "일치 label로 jump한 뒤 colon statement groups를 실행합니다. label은 독립 if 조건처럼 매번 재검사되지 않습니다.",
      ],
      concepts: [
        { term: "selector evaluation", definition: "switch가 분기 기준 expression을 정확히 한 번 평가하는 단계입니다.", detail: ["side effect도 한 번입니다.", "case 재평가와 다릅니다."] },
        { term: "constant case label", definition: "compiler가 허용하는 compile-time constant value label입니다.", detail: ["runtime variable은 안 됩니다.", "duplicate도 거부됩니다."] },
        { term: "statement group", definition: "colon labels 뒤에 이어지는 statements 묶음입니다.", detail: ["break까지 실행될 수 있습니다.", "여러 label이 공유할 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "java-classic-switch-selector-once",
          title: "selector 한 번과 colon fall-through 흐름을 같이 출력합니다",
          language: "java",
          filename: "src/learning/java06/ClassicSwitchLab.java",
          purpose: "selector once와 label 재검사 없는 fall-through를 한 fixture로 증명합니다.",
          code: String.raw`package learning.java06;

public class ClassicSwitchLab {
    private static int calls;
    private static int selector() { calls++; return 2; }
    public static void main(String[] args) {
        StringBuilder flow = new StringBuilder();
        switch (selector()) {
            case 1: flow.append("1>");
            case 2: flow.append("2>");
            case 3: flow.append("3>");
            default: flow.append("D");
        }
        System.out.println("flow=" + flow);
        System.out.println("selectorCalls=" + calls);
    }
}`,
          walkthrough: [
            { lines: "4-5", explanation: "selector method가 호출 수를 올리고 2를 반환합니다." },
            { lines: "7-13", explanation: "case 2로 jump한 뒤 break가 없어 case 3과 default statements도 실행합니다." },
            { lines: "14-15", explanation: "flow와 selector call count를 별도로 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java06/ClassicSwitchLab.java && java -cp build/classes learning.java06.ClassicSwitchLab" },
          output: { value: "flow=2>3>D\nselectorCalls=1", explanation: ["case 1은 역주행하지 않습니다.", "case 3/default label 조건은 재평가되지 않습니다."] },
          experiments: [
            { change: "case 2 끝에 break를 추가합니다.", prediction: "flow=2>만 남습니다.", result: "break가 switch statement를 종료합니다." },
            { change: "selector return을 9로 바꿉니다.", prediction: "default D만 실행됩니다.", result: "unmatched non-null을 default가 처리합니다." },
            { change: "selector return type을 long으로 바꿉니다.", prediction: "selector type long compile failure입니다.", result: "reference pattern과 primitive selector를 구분합니다." },
          ],
          sourceRefs: ["java-day05-ex04", "jls-switch-statement", "jls-break"],
        },
      ],
      diagnostics: [
        { symptom: "switch(longValue)가 compile되지 않는다.", likelyCause: "원본 주석의 int,long,char,String 목록을 그대로 믿었습니다.", checks: ["primitive인지 boxed reference인지 확인합니다.", "JLS selector compatibility를 봅니다.", "--release를 확인합니다."], fix: "지원되는 selector로 변환하거나 Long reference pattern/if를 의도에 맞게 사용합니다.", prevention: "long selector compile-fail fixture를 유지합니다." },
      ],
    },
    {
      id: "break-fallthrough-grouping",
      title: "break가 없으면 다음 label을 검사하지 않고 statements를 계속 실행합니다",
      lead: "intentional grouping과 accidental fall-through를 warning·출력으로 구분합니다.",
      explanations: [
        "unlabeled break는 가장 안쪽의 switch 또는 loop를 종료합니다. case 안에 더 안쪽 loop가 있다면 그 break는 loop를 끝낼 수 있습니다.",
        "Ex04 num=2는 case 2 statements 뒤 case 3와 default statements를 순서대로 실행합니다. case 1로 거슬러 올라가지는 않습니다.",
        "여러 값이 같은 body를 공유하는 의도라면 Java 14+ `case 1, 2 ->`가 명시적입니다. colon을 유지하면 comment와 warning policy를 둡니다.",
        "default가 마지막일 필요는 없지만 control flow를 읽기 쉽게 배치합니다. fall-through 중 default 아래 statement group도 실행될 수 있습니다.",
        "-Xlint:fallthrough warning을 무조건 끄지 말고 intentional cases와 accidental omissions를 review합니다.",
      ],
      concepts: [
        { term: "fall-through", definition: "선택된 colon label 뒤 break 없이 다음 statement groups로 실행이 이어지는 동작입니다.", detail: ["조건을 재검사하지 않습니다.", "default도 통과할 수 있습니다."] },
        { term: "nearest target", definition: "break가 가장 안쪽 switch 또는 반복문을 대상으로 삼는 규칙입니다.", detail: ["중첩 구조에서 중요합니다.", "labeled break는 별도입니다."] },
        { term: "case grouping", definition: "여러 labels가 하나의 실행 body를 공유하는 의도적 구조입니다.", detail: ["comma arrow를 선호할 수 있습니다.", "accidental fall-through와 구분합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "case 2를 선택했는데 default message까지 출력된다.", likelyCause: "case 2와 이후 groups에 break가 없습니다.", checks: ["선택 label부터 아래로 statements를 표시합니다.", "break의 nearest target을 봅니다.", "Xlint warning을 확인합니다."], fix: "한 case만 실행할 정책이면 break/return 또는 arrow rule을 사용합니다.", prevention: "selector별 exact flow test와 fall-through warning gate를 둡니다." },
      ],
    },
    {
      id: "arrow-statement-expression-yield",
      title: "arrow rule은 fall-through하지 않고 switch expression은 값을 생산합니다",
      lead: "statement의 side effect와 expression의 result를 분리합니다.",
      explanations: [
        "`case value -> expression`, block 또는 throw는 선택된 rule만 실행하고 다음 rule로 fall-through하지 않습니다.",
        "switch statement는 출력·상태 변경 같은 제어 흐름에, switch expression은 grade·label·price 같은 값 생산에 적합합니다.",
        "single expression arm은 그 값이 result이고, 여러 statements가 필요한 block arm은 `yield value`로 값을 냅니다.",
        "`break value`는 최종 문법이 아닙니다. Java 13부터 yield를 사용하고 Java 14에서 switch expressions가 final되었습니다.",
        "switch expression은 모든 가능한 selector value에서 compatible result를 만들거나 throw해야 합니다.",
      ],
      concepts: [
        { term: "arrow rule", definition: "선택된 expression·block·throw만 실행하고 다른 rule로 이어지지 않는 switch rule입니다.", detail: ["break가 필요 없습니다.", "colon group과 혼합하지 않습니다."] },
        { term: "switch expression", definition: "분기 전체가 하나의 value와 type을 만드는 expression입니다.", detail: ["assignment·return에 씁니다.", "exhaustive해야 합니다."] },
        { term: "yield", definition: "switch expression의 block arm에서 해당 switch의 result value를 내는 statement입니다.", detail: ["method return과 다릅니다.", "block이 정상 종료되려면 필요합니다."] },
      ],
      codeExamples: [
        {
          id: "java-switch-expression-yield",
          title: "학점과 메뉴를 exhaustive expression으로 반환합니다",
          language: "java",
          filename: "src/learning/java06/SwitchExpressionLab.java",
          purpose: "sentinel·duplicated assignment 없이 arrow와 yield result를 검증합니다.",
          code: String.raw`package learning.java06;

public class SwitchExpressionLab {
    static String grade(int score) {
        if (score < 0 || score > 100) throw new IllegalArgumentException("INVALID_SCORE");
        return switch (score / 10) {
            case 10, 9 -> "A";
            case 8 -> "B";
            case 7 -> "C";
            default -> "F";
        };
    }
    static String order(int code) {
        return switch (code) {
            case 1 -> "카페모카:3500";
            case 2 -> { int price = 4000; yield "카페라떼:" + price; }
            case 3 -> "아메리카노:2500";
            case 4 -> "과일주스:3000";
            default -> throw new IllegalArgumentException("INVALID_MENU");
        };
    }
    public static void main(String[] args) {
        int[] scores = {69, 70, 79, 80, 89, 90, 100};
        StringBuilder out = new StringBuilder();
        for (int score : scores) {
            if (!out.isEmpty()) out.append('|');
            out.append(score).append(':').append(grade(score));
        }
        System.out.println("grades=" + out);
        System.out.println("order=" + order(2));
    }
}`,
          walkthrough: [
            { lines: "4-12", explanation: "range validation 뒤 score/10의 모든 values를 grade result로 만듭니다." },
            { lines: "14-22", explanation: "menu 2 block은 local 계산 후 yield하고 unknown은 explicit exception입니다." },
            { lines: "24-32", explanation: "모든 grade 경계와 block-arm menu result를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java06/SwitchExpressionLab.java && java -cp build/classes learning.java06.SwitchExpressionLab" },
          output: { value: "grades=69:F|70:C|79:C|80:B|89:B|90:A|100:A\norder=카페라떼:4000", explanation: ["모든 valid score가 한 값을 만듭니다.", "yield block도 expression arm과 같은 String result type입니다."] },
          experiments: [
            { change: "default arm을 제거합니다.", prediction: "int selector의 모든 값을 cover하지 못해 compile failure입니다.", result: "expression exhaustiveness를 compiler가 확인합니다." },
            { change: "case 2 block의 yield를 제거합니다.", prediction: "switch rule completes without providing a value입니다.", result: "block result path를 모두 닫습니다." },
            { change: "case 8 result를 int 8로 바꿉니다.", prediction: "target String과 compatible하지 않아 type failure입니다.", result: "모든 arm의 result type 계약을 맞춥니다." },
          ],
          sourceRefs: ["java-day05-ex01", "java-day05-ex03", "jls-switch-expression", "jls-yield", "jep361"],
        },
      ],
      diagnostics: [
        { symptom: "arrow block에 여러 statements를 썼더니 값이 없다며 compile되지 않는다.", likelyCause: "block이 switch expression arm인데 yield·throw 없이 끝납니다.", checks: ["statement/expression switch를 구분합니다.", "모든 block paths를 봅니다.", "result target type을 확인합니다."], fix: "block의 정상 path마다 yield하거나 exception을 throw합니다.", prevention: "non-exhaustive·missing-yield compile-fail fixtures를 유지합니다." },
      ],
    },
    {
      id: "exhaustiveness-and-type-contract",
      title: "exhaustiveness는 every input이 value 또는 failure를 갖는다는 compile-time 계약입니다",
      lead: "default 필수라는 암기 대신 compiler가 coverage를 증명하는 방법을 봅니다.",
      explanations: [
        "모든 switch expression은 exhaustive해야 합니다. legacy switch statement는 일반적으로 모든 값의 branch를 요구하지 않습니다.",
        "enum의 모든 constants나 sealed hierarchy의 permitted alternatives를 열거하면 default 없이도 exhaustive할 수 있습니다.",
        "primitive·String 같은 open value set은 보통 default가 필요합니다. default는 unknown non-null을 처리할 뿐 null catcher가 아닙니다.",
        "enhanced pattern switch statement도 exhaustive requirement가 적용될 수 있어 traditional statement와 구분합니다.",
        "compiler coverage는 현재 compilation world 기준입니다. library evolution과 stale dependent class는 별도 운영 문제입니다.",
      ],
      concepts: [
        { term: "exhaustive", definition: "가능한 모든 selector value에 적용 가능한 arm이 있음을 compiler가 증명한 상태입니다.", detail: ["expression에 필수입니다.", "default 없이도 가능할 수 있습니다."] },
        { term: "closed domain", definition: "enum·sealed처럼 가능한 alternatives를 compiler가 열거할 수 있는 값 집합입니다.", detail: ["누락을 찾기 쉽습니다.", "진화 정책이 필요합니다."] },
        { term: "open domain", definition: "int·String처럼 가능한 값을 소스에서 모두 열거하기 어려운 집합입니다.", detail: ["default/validation이 필요합니다.", "unknown 정책을 명시합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "모든 현재 메뉴를 case로 썼는데 switch expression이 non-exhaustive다.", likelyCause: "selector가 raw int/String이라 열거한 labels 밖 값이 여전히 가능합니다.", checks: ["selector domain이 closed인지 봅니다.", "validation·default를 확인합니다.", "enum 변환 경계를 검토합니다."], fix: "raw value는 boundary에서 enum/result로 변환하거나 explicit throwing default를 둡니다.", prevention: "unknown raw values와 all enum constants를 각각 test합니다." },
      ],
    },
    {
      id: "enum-menu-policy",
      title: "raw menu code는 경계에서 enum으로 바꾸고 내부 policy는 exhaustive하게 유지합니다",
      lead: "label·price·family를 한 type에 모아 sentinel과 duplicated switch를 제거합니다.",
      explanations: [
        "raw int는 Scanner·HTTP 같은 외부 경계의 표현입니다. `Menu.fromCode`에서 한 번 검증하고 내부에서는 Menu type을 사용합니다.",
        "enum constant에 code·label·price를 묶으면 Ex01·03의 여러 가격 변수와 분기 대입을 single source of truth로 바꿀 수 있습니다.",
        "unknown code를 menu 1이나 0원으로 fallback하지 말고 exception·Result의 INVALID_MENU로 분리합니다.",
        "closed enum policy에서 default를 생략하면 새 constant 추가 때 exhaustive switch가 compile signal을 줄 수 있습니다.",
        "외부 raw unknown을 처리하는 default와 내부 enum 누락을 숨기는 default는 목적이 다릅니다. boundary와 domain switch를 분리합니다.",
      ],
      concepts: [
        { term: "adapter boundary", definition: "raw code를 검증된 domain type 또는 명시적 오류로 변환하는 위치입니다.", detail: ["unknown을 격리합니다.", "내부 분기를 단순화합니다."] },
        { term: "enum payload", definition: "각 enum constant가 code·label·price 같은 immutable 속성을 함께 갖는 구조입니다.", detail: ["중복을 줄입니다.", "lookup test가 필요합니다."] },
        { term: "no-default exhaustiveness", definition: "closed enum의 모든 constants를 열거해 새 값 누락을 compiler가 찾게 하는 선택입니다.", detail: ["내부 policy에 유용합니다.", "open boundary에는 다릅니다."] },
      ],
      codeExamples: [
        {
          id: "java-enum-menu-policy",
          title: "Menu lookup과 family 분류를 enum 한 곳에서 검증합니다",
          language: "java",
          filename: "src/learning/java06/EnumMenuLab.java",
          purpose: "raw code failure와 closed enum exhaustiveness를 분리합니다.",
          code: String.raw`package learning.java06;

public class EnumMenuLab {
    enum Family { COFFEE, JUICE }
    enum Menu {
        CAFE_MOCHA(1, "카페모카", 3500), CAFE_LATTE(2, "카페라떼", 4000),
        AMERICANO(3, "아메리카노", 2500), FRUIT_JUICE(4, "과일주스", 3000);
        final int code; final String label; final int price;
        Menu(int code, String label, int price) { this.code = code; this.label = label; this.price = price; }
        static Menu fromCode(int code) {
            for (Menu menu : values()) if (menu.code == code) return menu;
            throw new IllegalArgumentException("INVALID_MENU");
        }
    }
    static Family family(Menu menu) {
        return switch (menu) {
            case CAFE_MOCHA, CAFE_LATTE, AMERICANO -> Family.COFFEE;
            case FRUIT_JUICE -> Family.JUICE;
        };
    }
    static String quote(int code, int count, int payment) {
        Menu menu = Menu.fromCode(code);
        if (count <= 0) return "INVALID_COUNT";
        if (payment < 0) return "INVALID_PAYMENT";
        long base = Math.multiplyExact((long) menu.price, count);
        long total = Math.multiplyExact(base, 110L) / 100L; // 원 단위 ROUND_DOWN 정책
        if (payment < total) return "SHORT_BY_" + (total - payment);
        return menu.label + ",count=" + count + ",total=" + total + ",change=" + (payment - total);
    }
    public static void main(String[] args) {
        Menu menu = Menu.fromCode(2);
        System.out.println("menu2=" + menu.label + ":" + menu.price);
        try { Menu.fromCode(9); }
        catch (IllegalArgumentException error) { System.out.println("menu9=" + error.getMessage()); }
        System.out.println("family=" + family(menu));
        System.out.println("quote=" + quote(2, 2, 10000));
        System.out.println("count0=" + quote(2, 0, 10000));
        System.out.println("short=" + quote(2, 2, 8799));
    }
}`,
          walkthrough: [
            { lines: "4-13", explanation: "네 constants가 code·label·price를 갖고 fromCode가 unknown을 명시적으로 거부합니다." },
            { lines: "15-20", explanation: "모든 Menu constants를 default 없이 Family로 분류합니다." },
            { lines: "22-31", explanation: "quote는 count·payment를 검증하고 long exact multiplication과 명시적 원 단위 ROUND_DOWN VAT 정책을 적용합니다." },
            { lines: "33-42", explanation: "valid lookup, invalid raw code, exhaustive family와 정상·invalid count·1원 부족 quote를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java06/EnumMenuLab.java && java -cp build/classes learning.java06.EnumMenuLab" },
          output: { value: "menu2=카페라떼:4000\nmenu9=INVALID_MENU\nfamily=COFFEE\nquote=카페라떼,count=2,total=8800,change=1200\ncount0=INVALID_COUNT\nshort=SHORT_BY_1", explanation: ["unknown code와 invalid count는 정상 메뉴로 섞이지 않습니다.", "family switch는 현재 enum 전체를 cover합니다.", "돈 계산은 long exact intermediate와 문서화된 원 단위 ROUND_DOWN 정책을 사용합니다."] },
          experiments: [
            { change: "Menu에 TEA를 추가하고 family arm은 그대로 둡니다.", prediction: "switch expression이 non-exhaustive compile failure입니다.", result: "새 constant 누락을 compiler가 알립니다." },
            { change: "family에 default를 추가한 뒤 TEA를 추가합니다.", prediction: "compile되지만 TEA가 broad fallback으로 숨을 수 있습니다.", result: "default trade-off를 기록합니다." },
            { change: "fromCode가 unknown에 CAFE_MOCHA를 반환하게 합니다.", prediction: "menu9가 성공으로 보입니다.", result: "adapter boundary에서 explicit failure를 유지합니다." },
          ],
          sourceRefs: ["java-day05-ex01", "java-day05-ex03", "jls-switch-expression", "java-math-api"],
        },
      ],
      diagnostics: [
        { symptom: "새 enum constant를 추가했는데 일부 정책이 예전 default로 조용히 처리한다.", likelyCause: "closed-domain switch마다 broad default를 두어 compiler exhaustiveness signal을 숨겼습니다.", checks: ["enum switches와 default를 검색합니다.", "all values test를 실행합니다.", "boundary unknown과 internal new constant를 구분합니다."], fix: "내부 closed policy는 explicit arms를 추가하고 boundary raw unknown만 별도 처리합니다.", prevention: "enum 추가 PR에서 exhaustive compile failure를 기대하는 test를 둡니다." },
      ],
    },
    {
      id: "java21-pattern-null-dominance",
      title: "Java 21 pattern switch는 type·guard·null을 분기하고 dominance를 compile-time에 검사합니다",
      lead: "specific·guarded patterns를 general pattern보다 앞에 둡니다.",
      explanations: [
        "Java 21 final pattern switch는 reference selector에 type pattern과 `when` guard를 사용할 수 있습니다.",
        "`case null`을 명시하면 null을 분기할 수 있지만 없으면 null selector는 NullPointerException입니다. default는 null catcher가 아닙니다.",
        "적용 가능한 labels 중 runtime에서는 첫 matching rule이 선택되지만, 앞의 넓은 pattern이 뒤 label을 모두 덮으면 compiler가 dominated label로 거부합니다.",
        "blank String guard는 general String arm보다 앞에 둡니다. pattern variable은 해당 rule scope에서만 사용합니다.",
        "constant→guarded pattern→unguarded pattern→default 순서는 유용한 설계 지침이지만 모든 switch에서 default가 문법적으로 마지막이어야 한다는 뜻은 아닙니다.",
      ],
      concepts: [
        { term: "type pattern", definition: "selector가 특정 reference type이면 변수로 안전하게 binding하는 case label입니다.", detail: ["cast를 줄입니다.", "scope는 rule 안입니다."] },
        { term: "guarded pattern", definition: "type match 뒤 when boolean을 추가로 만족해야 적용되는 pattern입니다.", detail: ["specific rule을 먼저 둡니다.", "side effect는 피합니다."] },
        { term: "dominance", definition: "앞 label이 뒤 label이 match할 모든 값을 이미 cover해 뒤가 도달 불가능한 관계입니다.", detail: ["compile error입니다.", "순서를 교정합니다."] },
      ],
      codeExamples: [
        {
          id: "java-pattern-switch-null-guards",
          title: "null·blank·text·negative Integer를 specific-first로 분기합니다",
          language: "java",
          filename: "src/learning/java06/PatternSwitchLab.java",
          purpose: "case null, guard, general type와 default를 한 Java 21 fixture에서 실행합니다.",
          code: String.raw`package learning.java06;

public class PatternSwitchLab {
    static String describe(Object value) {
        return switch (value) {
            case null -> "NULL";
            case String text when text.isBlank() -> "BLANK";
            case String text -> "TEXT:" + text;
            case Integer number when number < 0 -> "NEG";
            case Integer number -> "INT:" + number;
            default -> "OTHER";
        };
    }
    static String defaultOnly(String value) {
        return switch (value) { default -> "OTHER"; };
    }
    public static void main(String[] args) {
        Object[] values = {null, " ", "hi", -1, 2, 3.5};
        StringBuilder out = new StringBuilder();
        for (Object value : values) {
            if (!out.isEmpty()) out.append('|');
            out.append(describe(value));
        }
        System.out.println(out);
        System.out.println("default-other=" + defaultOnly("x"));
        try { defaultOnly(null); }
        catch (NullPointerException error) { System.out.println("default-null=" + error.getClass().getSimpleName()); }
    }
}`,
          walkthrough: [
            { lines: "4-13", explanation: "null과 guarded patterns를 general String/Integer보다 먼저 둡니다." },
            { lines: "15-17", explanation: "default-only String switch가 non-null은 처리하지만 null case는 갖지 않습니다." },
            { lines: "19-29", explanation: "여섯 selector와 default-null behavior를 exact output으로 비교합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21 --release 21"], command: "javac --release 21 -d build/classes src/learning/java06/PatternSwitchLab.java && java -cp build/classes learning.java06.PatternSwitchLab" },
          output: { value: "NULL|BLANK|TEXT:hi|NEG|INT:2|OTHER\ndefault-other=OTHER\ndefault-null=NullPointerException", explanation: ["case null만 null을 value로 처리합니다.", "default는 unmatched non-null과 null을 같은 방식으로 처리하지 않습니다."] },
          experiments: [
            { change: "general String arm을 blank guarded arm 앞에 둡니다.", prediction: "guarded label이 dominated compile failure입니다.", result: "specific/guarded를 먼저 둡니다." },
            { change: "case null을 제거하고 describe(null)을 호출합니다.", prediction: "NullPointerException입니다.", result: "null policy를 explicit합니다." },
            { change: "Integer general arm을 negative guard 앞에 둡니다.", prediction: "negative guard가 dominated됩니다.", result: "type coverage와 guard 순서를 검토합니다." },
          ],
          sourceRefs: ["jls-switch-statement", "jep441"],
        },
      ],
      diagnostics: [
        { symptom: "default가 있는데 null에서 NPE가 난다.", likelyCause: "default를 null catcher로 오해했습니다.", checks: ["case null 존재를 봅니다.", "selector nullable 계약을 확인합니다.", "JDK release를 확인합니다."], fix: "null이 valid state면 case null, invalid면 switch 전 Objects.requireNonNull/validation을 둡니다.", prevention: "null·blank·unknown fixtures를 분리합니다." },
      ],
    },
    {
      id: "sealed-exhaustive-evolution",
      title: "sealed hierarchy는 type alternatives를 닫지만 배포 세계까지 영원히 고정하지는 않습니다",
      lead: "compile-time completeness와 separate-compilation evolution을 분리합니다.",
      explanations: [
        "sealed interface는 permitted direct subclasses를 제한해 compiler가 pattern switch coverage를 증명할 수 있게 합니다.",
        "enum은 named singleton constants 집합이고 sealed hierarchy는 data를 가진 서로 다른 types 집합이라는 차이가 있습니다.",
        "Cash·Card를 모두 열거한 switch expression은 default 없이 exhaustive하며 새 permitted subtype 추가 시 재컴파일에서 누락을 발견합니다.",
        "그러나 dependency만 새 버전으로 바꾸고 switch consumer를 다시 compile하지 않으면 exhaustive 가정이 깨져 Java 21 MatchException이 발생할 수 있습니다.",
        "닫힌 애플리케이션은 default 생략과 full rebuild를 활용하고 plugin·외부 version boundary는 defensive failure/default와 compatibility test를 검토합니다.",
      ],
      concepts: [
        { term: "sealed hierarchy", definition: "직접 상속 가능한 types를 permits로 제한한 class/interface 계층입니다.", detail: ["coverage 증명에 쓰입니다.", "Java 17 final입니다."] },
        { term: "separate compilation", definition: "consumer와 dependency를 서로 다른 시점에 compile·배포하는 환경입니다.", detail: ["stale assumptions가 생깁니다.", "rebuild가 필요합니다."] },
        { term: "MatchException", definition: "exhaustive로 compile된 switch가 runtime의 예상 밖 selector를 match하지 못할 때 발생할 수 있는 Java 21 exception입니다.", detail: ["진화 위험 신호입니다.", "compatibility test를 둡니다."] },
      ],
      codeExamples: [
        {
          id: "java-sealed-payment-exhaustive",
          title: "Cash·Card를 default 없이 exhaustive하게 렌더링합니다",
          language: "java",
          filename: "src/learning/java06/SealedPaymentLab.java",
          purpose: "sealed type coverage와 null behavior를 실행합니다.",
          code: String.raw`package learning.java06;

public class SealedPaymentLab {
    sealed interface Payment permits Cash, Card {}
    record Cash(int amount) implements Payment {}
    record Card(String last4) implements Payment {}
    static String render(Payment payment) {
        return switch (payment) {
            case Cash cash -> "현금:" + cash.amount();
            case Card card -> "카드:****" + card.last4();
        };
    }
    public static void main(String[] args) {
        System.out.println("cash=" + render(new Cash(10000)));
        System.out.println("card=" + render(new Card("1234")));
        try { render(null); }
        catch (NullPointerException error) { System.out.println("null=" + error.getClass().getSimpleName()); }
    }
}`,
          walkthrough: [
            { lines: "4-6", explanation: "Payment의 direct alternatives를 Cash와 Card로 닫습니다." },
            { lines: "7-12", explanation: "두 permitted types를 pattern arms로 모두 cover해 default를 생략합니다." },
            { lines: "14-19", explanation: "두 정상 instances와 null invalid path를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21 --release 21"], command: "javac --release 21 -d build/classes src/learning/java06/SealedPaymentLab.java && java -cp build/classes learning.java06.SealedPaymentLab" },
          output: { value: "cash=현금:10000\ncard=카드:****1234\nnull=NullPointerException", explanation: ["두 permitted alternatives가 explicit result를 갖습니다.", "card fixture도 마지막 네 자리만 synthetic masked form으로 표시합니다.", "null은 hierarchy alternative가 아닙니다."] },
          experiments: [
            { change: "Point record를 permits에 추가하고 render arm은 그대로 둡니다.", prediction: "재컴파일하면 non-exhaustive failure입니다.", result: "새 type을 명시적으로 처리합니다." },
            { change: "render에 broad default를 추가합니다.", prediction: "Point 추가가 compile signal 없이 fallback될 수 있습니다.", result: "boundary openness에 따라 trade-off를 선택합니다." },
            { change: "consumer를 rebuild하지 않고 dependency hierarchy만 진화시킵니다.", prediction: "예상 밖 runtime type에서 MatchException 가능성이 있습니다.", result: "전체 dependents rebuild와 compatibility test를 요구합니다." },
          ],
          sourceRefs: ["jls-sealed", "jep409", "jep441", "java-match-exception"],
        },
      ],
      diagnostics: [
        { symptom: "새 permitted subtype 배포 뒤 기존 consumer가 MatchException을 낸다.", likelyCause: "dependency만 교체하고 exhaustive switch consumer를 재컴파일하지 않았습니다.", checks: ["runtime/compile dependency versions를 비교합니다.", "permits 변화와 consumer bytecode를 봅니다.", "full rebuild 여부를 확인합니다."], fix: "모든 dependents를 같은 dependency graph로 rebuild하고 새 arm 또는 deliberate boundary failure를 추가합니다.", prevention: "API evolution compatibility test와 atomic deployment policy를 둡니다." },
      ],
    },
    {
      id: "release-compile-diagnostics-tests",
      title: "Java 14·17·21 문법 경계와 compile failures를 실행 가능한 계약으로 둡니다",
      lead: "IDE language level이 아니라 CI --release와 runtime compatibility를 고정합니다.",
      explanations: [
        "switch expressions·arrow·comma labels·yield는 Java 14에서 final, sealed classes는 Java 17에서 final, pattern switch는 Java 21에서 final입니다.",
        "Ex06 comma label은 --release 11에서 실패하고 --release 14에서 compile됩니다. 원본 전체의 최소 release를 source syntax로 증명합니다.",
        "primitive long selector, runtime variable case, non-exhaustive expression, missing yield와 dominated pattern은 각각 independent compile-fail fixture로 둡니다.",
        "compiler human text는 locale·version에 따라 달라질 수 있어 -XDrawDiagnostics category·exit·source position을 normalize합니다.",
        "runtime suite는 score/menu/null/enum/sealed boundaries를, compile suite는 language constraints를 담당합니다. 두 failure 종류를 섞지 않습니다.",
      ],
      concepts: [
        { term: "--release contract", definition: "지정 Java release의 language/API/classfile compatibility로 compile하는 javac 옵션입니다.", detail: ["CI에 고정합니다.", "IDE 설정과 별도입니다."] },
        { term: "compile-fail fixture", definition: "특정 잘못된 source가 예상 category로 compile 실패하는지 검증하는 독립 파일입니다.", detail: ["runtime test와 다릅니다.", "한 오류만 넣습니다."] },
        { term: "version boundary", definition: "어떤 Java release부터 문법·type feature를 사용할 수 있는지에 대한 최소 도구 계약입니다.", detail: ["14·17·21을 구분합니다.", "배포 runtime과 맞춥니다."] },
      ],
      codeExamples: [
        {
          id: "java-switch-diagnostics-rerun",
          title: "앞서 정의한 safe diagnostic harness를 release gate에서 다시 실행합니다",
          language: "powershell",
          filename: "verify-switch-diagnostics.ps1",
          purpose: "release·compile-fail·separate-compilation 결과를 CI gate의 exact output으로 재확인합니다.",
          code: String.raw`pwsh -NoProfile -File verify-switch-diagnostics.ps1`,
          walkthrough: [
            { lines: "1", explanation: "이 페이지의 분기 도구 선택 장에 있는 동일 filename의 complete safe-temp script를 저장한 뒤 실행합니다." },
          ],
          run: { environment: ["PowerShell 7+", "Temurin/OpenJDK 21", "앞 장의 verify-switch-diagnostics.ps1"], command: "pwsh -NoProfile -File verify-switch-diagnostics.ps1" },
          output: { value: "release11=1,release14=0\nlong=1,dominated=1,missingYield=1,nonExhaustive=1\nstale=MatchException", explanation: ["CI는 exact exit matrix와 stale evolution failure를 함께 확인합니다."] },
          experiments: [
            { change: "CI JDK를 17로 낮춥니다.", prediction: "pattern switch final syntax와 MatchException fixture를 같은 방식으로 compile할 수 없습니다.", result: "toolchain JDK 자체도 release contract에 고정합니다." },
            { change: "--release 14를 13으로 낮춥니다.", prediction: "final switch expression syntax가 baseline 밖이 됩니다.", result: "feature timeline을 executable gate로 유지합니다." },
            { change: "diagnostic script exit matrix 중 하나가 바뀝니다.", prediction: "compiler upgrade review가 필요합니다.", result: "raw locale text보다 category·exit·semantic intent를 재검토합니다." },
          ],
          sourceRefs: ["jdk21-javac", "jls-switch-statement", "jls-switch-expression", "jls-yield", "jep361", "jep409", "jep441", "java-match-exception"],
        },
      ],
      diagnostics: [
        { symptom: "IDE에서는 되는데 CI --release 11에서 comma case가 실패한다.", likelyCause: "local language level과 project release contract가 다릅니다.", checks: ["javac --release를 봅니다.", "CI JDK와 runtime을 확인합니다.", "feature final release를 표와 비교합니다."], fix: "project baseline을 올리거나 Java 11 compatible colon labels로 작성합니다.", prevention: "release matrix compile test와 toolchain file을 유지합니다." },
      ],
      expertNotes: ["exhaustive switch의 deployment compatibility는 source compile 성공만으로 끝나지 않으므로 dependency evolution test를 둡니다.", "pattern switch를 untrusted open object graph의 validation 대체로 쓰지 않고 boundary schema·authorization을 먼저 적용합니다."],
    },
  ],
} satisfies DetailedSession;

export default session;
