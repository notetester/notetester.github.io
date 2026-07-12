import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["java-04-operators"],
  slug: "java-04-operators",
  courseId: "java",
  moduleId: "java-language-control",
  order: 4,
  title: "산술·증감·비교·논리·대입 연산",
  subtitle: "연산자를 기호 표가 아니라 operand type, 평가 순서, side effect, 실패 정책이 만드는 실행 계약으로 배웁니다.",
  level: "기초",
  estimatedMinutes: 450,
  coreQuestion: "Java expression을 보았을 때 grouping·operand evaluation·promotion·operation·assignment를 어떤 순서로 추적해야 값과 부작용, 실패까지 정확히 예측할 수 있을까요?",
  summary: "javastudy day03 Ex01·Ex02·Ex03·Ex05·Ex07 다섯 원본을 Temurin JDK 21.0.11에서 UTF-8·-Xlint:all로 clean compile하고 빈 줄까지 exact stdout을 고정했습니다. Ex01의 9/4는 int 2와 late widening 2.0, floating division 2.25를 구분하고, Ex02의 합계 250·평균 83.333...·toward-zero 83.33, Ex03의 10원/100원 미만 절삭, Ex05의 prefix/postfix 결과 25/20과 최종 값 5/5, Ex07의 && 범위 판정과 short-circuit side effect를 expression trace로 다시 설명합니다. 원본의 ‘postfix는 세미콜론에서 증가한다’는 표현은 잘못됐습니다. postfix update는 expression evaluation 중 저장되고 expression value만 이전 값입니다. 원본 밖에서는 음수 /·%와 floorDiv/floorMod, 정수/부동소수 0, MIN/-1 overflow와 Math exact, floating equality와 BigDecimal, eager boolean &/|, bitwise·shift-distance masking, compound assignment의 implicit cast와 LHS 1회 평가, NaN·signed zero·reference equality, locale-independent compile diagnostics를 Java 21 공식 규칙과 실행 예제로 보강합니다.",
  objectives: [
    "operand type→promotion→operation→assignment 순서로 원본 산술식과 우선순위·결합·평가 순서를 추적할 수 있다.",
    "정수 /·%의 toward-zero 규칙과 음수 floorDiv/floorMod, 정수·부동소수 0 나눗셈 정책을 구분할 수 있다.",
    "정수 overflow와 MIN/-1 특례를 발견하고 Math exact, long, BigInteger 중 적절한 실패 계약을 선택할 수 있다.",
    "floating equality·NaN·signed zero를 직접 비교하고 tolerance 또는 BigDecimal 정책을 domain에 맞게 적용할 수 있다.",
    "prefix/postfix와 &&·|| short-circuit의 value·state 변화를 분리하고 side effect가 숨은 식을 명시적 statements로 고칠 수 있다.",
    "boolean eager 연산과 integer bitwise·shift 연산을 구분하고 mask·signed/unsigned representation을 검증할 수 있다.",
    "simple/compound assignment의 conversion·LHS 평가 횟수와 비교식 compile failure를 실행 가능한 diagnostics로 검증할 수 있다.",
  ],
  prerequisites: [
    { title: "String·자동 승격·강제 형변환", reason: "연산 결과는 operand의 primitive type과 numeric promotion, String concatenation, narrowing 위치에 의해 결정되므로 앞 세션의 conversion trace가 필요합니다.", sessionSlug: "java-03-string-casting" },
  ],
  keywords: ["operator", "precedence", "associativity", "evaluation order", "arithmetic", "division", "remainder", "floorDiv", "floorMod", "zero division", "overflow", "Math exact", "floating equality", "BigDecimal", "prefix", "postfix", "comparison", "NaN", "short-circuit", "bitwise", "shift", "compound assignment", "diagnostics"],
  chapters: [
    {
      id: "five-source-golden-output-audit",
      title: "다섯 원본의 출력과 active expression을 먼저 고정합니다",
      lead: "주석을 그대로 외우기 전에 JDK 21에서 실제로 compile·run되는 줄과 빈 출력까지 provenance로 보존합니다.",
      explanations: [
        "Ex01은 int 9와 4의 +·-·*·/·%를 13·5·36·2·1로 출력합니다. double destination만 둔 su1/su2는 int division 2 뒤 2.0으로 widening되고, operand를 double로 바꾼 식만 2.25입니다.",
        "Ex02는 synthetic placeholder 이름 홍길동과 점수 90·80·80에서 합계 250, 평균 83.33333333333333을 계산합니다. `(int)(sum/3.0*100)/100.0`은 반올림이 아니라 양수 표본을 소수 둘째 자리에서 toward-zero 절삭한 83.33입니다.",
        "Ex03은 178964를 /10, /10*10, /100*100으로 바꿔 17896·178960·178900을 출력합니다. 원본의 ‘0단위 절삭’은 모호하며 10원 미만 또는 100원 미만 절삭처럼 단위와 음수 정책을 함께 써야 합니다.",
        "Ex05는 ++su1*5가 update 후 값 5를 사용해 25, su2++*5가 이전 값 4를 사용해 20을 냅니다. 두 variable은 출력 시점에 모두 5이고 중간 empty println 한 줄도 golden output에 포함됩니다.",
        "Ex07은 && truth/range와 assignment side effect를 실행합니다. 마지막 su3=104와 c1='T'만 active하고, false인 첫 operand 뒤 `(s4=s4+5)`가 생략되어 s4가 7로 남는 것이 short-circuit evidence입니다.",
        "홍길동과 점수는 원본에 든 합성 학습 fixture이며 credential·실사용 개인정보는 없습니다. 새 예제도 synthetic boundary만 쓰고 raw 외부 값을 diagnostics에 남기지 않습니다.",
      ],
      concepts: [
        { term: "golden output", definition: "동일 source와 toolchain에서 다시 비교할 exact stdout 기준입니다.", detail: ["empty line도 보존합니다.", "설명보다 실행 결과를 먼저 고정합니다."] },
        { term: "active expression", definition: "commented alternative가 아니라 compiler가 실제로 type-check하고 실행하는 식입니다.", detail: ["마지막 재대입을 추적합니다.", "source line과 output을 연결합니다."] },
        { term: "provenance boundary", definition: "원본에서 관찰한 내용과 공식 문서로 보강한 내용을 구분하는 경계입니다.", detail: ["5/5 파일을 직접 사용합니다.", "보강을 원본 사실처럼 꾸미지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "java-original-operator-output-audit",
          title: "원본 다섯 main을 safe temporary classes에서 실행합니다",
          language: "powershell",
          filename: "verify-original-operators.ps1",
          purpose: "원본을 변경하지 않고 JDK 21 compile warning과 exact output을 재현합니다.",
          code: String.raw`$src = "src\com\ictedu\day03"
$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$out = Join-Path $base ("java04-original-" + [Guid]::NewGuid().ToString("N"))
if (Test-Path -LiteralPath $out) { throw "unexpected temp collision" }
[IO.Directory]::CreateDirectory($out) | Out-Null

try {
  $files = @("Ex01.java", "Ex02.java", "Ex03.java", "Ex05.java", "Ex07.java") |
    ForEach-Object { Join-Path $src $_ }
  javac -encoding UTF-8 -Xlint:all -d $out $files
  if ($LASTEXITCODE -ne 0) { throw "compile failed" }

  foreach ($simple in @("Ex01", "Ex02", "Ex03", "Ex05", "Ex07")) {
    $lines = & java -cp $out "com.ictedu.day03.$simple"
    if ($LASTEXITCODE -ne 0) { throw "run failed: $simple" }
    "$simple=$($lines -join '|')"
  }
} finally {
  $resolved = [IO.Path]::GetFullPath($out)
  $boundary = $base.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
  if (-not $resolved.StartsWith($boundary, [StringComparison]::OrdinalIgnoreCase)) {
    throw "unsafe cleanup path"
  }
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}`,
          walkthrough: [
            { lines: "1-5", explanation: "system temp 아래 GUID directory가 없는지 확인하고 새로 만들어 product source와 분리합니다." },
            { lines: "7-17", explanation: "다섯 source를 한 번에 UTF-8·Xlint compile하고 각 main output을 pipe summary로 만듭니다." },
            { lines: "18-25", explanation: "cleanup 전에 canonical path가 temp boundary 안인지 검증해 다른 directory 삭제를 막습니다." },
          ],
          run: { environment: ["PowerShell 7+", "Temurin/OpenJDK 21", "javastudy/MyJavaProject root"], command: "pwsh -NoProfile -File verify-original-operators.ps1" },
          output: { value: "Ex01=9 + 4 = 13|9 - 4 = 5|9 * 4 = 36|9 / 4 = 2|9 % 4 = 1|9 / 4 = 2.0|9 / 4 = 2.25|9 / 4 = 2.25\nEx02=이름:홍길동,총점:250,평균:83.33333333333333|83.33\nEx03=17896|178960|178900\nEx05=25|20||5|5\nEx07=true|false||true|false||결과 : false|결과2 : false|결과3 : true|s1 : 12|s2 : 12|결과4 : false|s3 : 12|s4 : 7", explanation: ["Ex05의 세 번째 field와 Ex07의 세 번째·여섯 번째 field는 empty println입니다.", "compile exit 0, -Xlint:all warning 0인 JDK 21.0.11 기준입니다."] },
          experiments: [
            { change: "Ex01의 result2=su1/su2를 `(double)su1/su2`로 바꿉니다.", prediction: "2.0이 2.25로 바뀝니다.", result: "destination이 아니라 division 전 operand type이 operation을 정합니다." },
            { change: "Ex05의 empty println을 제거합니다.", prediction: "pipe summary의 empty field가 사라집니다.", result: "golden은 whitespace까지 계약으로 삼을지 명시합니다." },
            { change: "Ex07의 첫 && 비교를 true가 되게 바꿉니다.", prediction: "오른쪽 assignment도 실행되어 두 state가 모두 변합니다.", result: "short-circuit는 value뿐 아니라 side effect 경로도 바꿉니다." },
          ],
          sourceRefs: ["java-arithmetic-source", "java-score-average-source", "java-truncation-source", "java-increment-source", "java-logical-source", "jdk21-javac"],
        },
      ],
      diagnostics: [
        { symptom: "문서에 적은 출력과 실제 출력 줄 수가 다릅니다.", likelyCause: "commented code·중간 blank line·마지막 재대입을 active expression으로 오인했습니다.", checks: ["source를 line-by-line으로 읽습니다.", "빈 문자열을 포함해 stdout을 배열로 캡처합니다.", "compile warning과 exit code를 분리합니다."], fix: "clean build에서 다섯 main을 다시 실행해 golden을 갱신합니다.", prevention: "source hash/tool version/empty line을 보존하는 regression script를 둡니다." },
      ],
    },
    {
      id: "expression-five-stage-mental-model",
      title: "연산식은 grouping→operand evaluation→promotion→operation→assignment의 다섯 단계입니다",
      lead: "우선순위 표 한 장으로는 type conversion과 side effect, target conversion을 설명할 수 없습니다.",
      explanations: [
        "precedence는 어떤 operator가 더 강하게 묶이는지 정하고 associativity는 같은 precedence chain의 grouping을 정합니다. 둘 다 operand가 실제 실행되는 시간 순서와 같은 말이 아닙니다.",
        "Java는 observable operand를 왼쪽부터 평가하고 operation 전에 필요한 numeric promotion을 적용합니다. `2+3*4`는 `2+(3*4)`로 group되지만 runtime에는 +의 왼쪽 2를 먼저 평가한 뒤 오른쪽 subexpression 3*4를 평가합니다.",
        "operation result type은 operand와 operator가 정합니다. Ex01의 `double result2=su1/su2`에서 target double은 이미 만들어진 int 2만 2.0으로 바꿉니다.",
        "assignment는 마지막 단계입니다. simple assignment는 RHS를 target type에 맞게 변환하고 compound assignment는 operation 뒤 implicit cast를 포함할 수 있습니다.",
        "parentheses는 grouping을 바꾸지만 이미 평가된 value를 되돌리지 않습니다. `(double)(9/4)`는 int 2를 2.0으로 만들고 `(double)9/4`만 floating division을 만듭니다.",
        "increment·assignment·method call이 한 expression에 섞이면 값과 state transition을 각각 써야 합니다. production code에서는 계산과 mutation을 separate statements로 나누는 것이 안전합니다.",
      ],
      concepts: [
        { term: "precedence", definition: "괄호가 없을 때 grammar가 operator를 묶는 상대 우선순위입니다.", detail: ["실행 속도 순서가 아닙니다.", "의도가 모호하면 괄호를 씁니다."] },
        { term: "associativity", definition: "같은 precedence operator가 연속될 때 왼쪽 또는 오른쪽으로 묶이는 규칙입니다.", detail: ["대부분 산술은 왼쪽 grouping입니다.", "assignment는 오른쪽 grouping입니다."] },
        { term: "state transition", definition: "expression 평가 전후 variable·array·object field가 어떻게 달라졌는지 나타낸 기록입니다.", detail: ["expression value와 별개입니다.", "side effect 진단의 핵심입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "괄호를 추가했는데 정수 나눗셈 2.0이 2.25가 되지 않습니다.", likelyCause: "괄호가 cast를 division 뒤에 두어 operation type은 여전히 int였습니다.", checks: ["expression tree를 그립니다.", "각 operand static type을 적습니다.", "cast가 operation 전인지 봅니다."], fix: "`(double)left/right`처럼 operand를 먼저 변환합니다.", prevention: "grouping·evaluation·conversion을 한 문장으로 섞지 않고 five-stage trace를 남깁니다." },
      ],
      expertNotes: ["optimizer와 bytecode lowering은 observable Java semantics를 보존해야 합니다. 성능 결론은 source-level 계약과 profiler evidence를 분리합니다."],
    },
    {
      id: "division-remainder-floor-policy",
      title: "정수 /와 %는 toward zero 한 쌍이고 floorDiv/floorMod는 음수 좌표 정책을 따릅니다",
      lead: "양수 9/4만 보면 truncation과 floor의 차이가 숨으므로 네 sign 조합을 실행합니다.",
      explanations: [
        "integer `/`는 algebraic quotient를 0 방향으로 잘라 -7/3이 -2입니다. floor는 음의 무한대 방향이므로 Math.floorDiv(-7,3)은 -3입니다.",
        "integer `%`는 `(a/b)*b + a%b == a`를 만족하고 nonzero remainder의 sign은 dividend를 따릅니다. 따라서 -7%3은 -1이며 수학 교재의 항상 nonnegative modulo라고 가정하면 틀립니다.",
        "Math.floorMod는 floorDiv와 짝을 이뤄 `a=floorDiv(a,b)*b+floorMod(a,b)`를 만족합니다. divisor가 양수면 floorMod는 nonnegative지만 divisor가 음수면 결과도 0이 아니면 음수입니다.",
        "배열 순환 index·날짜 bucket처럼 0..n-1이 필요한 domain은 positive modulus를 명시해야 합니다. 단순히 `value % size`를 쓰면 negative value에서 음수 index가 나올 수 있습니다.",
        "Ex03의 `/10*10`도 toward-zero division입니다. 양수 금액에서는 내림처럼 보이지만 음수 환불 금액에서는 floor와 달라지므로 회계 owner가 절삭 방향을 정의해야 합니다.",
      ],
      concepts: [
        { term: "truncating quotient", definition: "정수 division 결과를 0 방향으로 자른 quotient입니다.", detail: ["-7/3은 -2입니다.", "floor quotient와 다를 수 있습니다."] },
        { term: "remainder identity", definition: "`(a/b)*b + a%b == a`로 quotient와 remainder를 연결하는 invariant입니다.", detail: ["divisor는 0이 아니어야 합니다.", "remainder sign은 dividend를 따릅니다."] },
        { term: "floor pair", definition: "Math.floorDiv와 floorMod가 음의 무한대 방향 quotient를 공유하는 조합입니다.", detail: ["좌표·bucket에 유용합니다.", "divisor sign 정책을 확인합니다."] },
      ],
      codeExamples: [
        {
          id: "java-negative-division-remainder-floor",
          title: "네 부호 조합의 /·%·floorDiv·floorMod를 비교합니다",
          language: "java",
          filename: "src/learning/java04/DivisionPolicyLab.java",
          purpose: "양수 원본을 negative domain과 floor policy까지 확장합니다.",
          code: String.raw`package learning.java04;

public class DivisionPolicyLab {
    public static void main(String[] args) {
        int[][] pairs = {{7, 3}, {-7, 3}, {7, -3}, {-7, -3}};
        for (int[] pair : pairs) {
            int value = pair[0];
            int divisor = pair[1];
            System.out.println(value + "/" + divisor + "=" + (value / divisor)
                    + "," + value + "%" + divisor + "=" + (value % divisor)
                    + ",floor=" + Math.floorDiv(value, divisor)
                    + ",mod=" + Math.floorMod(value, divisor));
        }
    }
}`,
          walkthrough: [
            { lines: "5", explanation: "dividend와 divisor의 네 sign 조합을 빠짐없이 준비합니다." },
            { lines: "6-12", explanation: "같은 operands에 truncating pair와 floor pair를 적용해 방향 차이를 한 줄에 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java04/DivisionPolicyLab.java && java -cp build/classes learning.java04.DivisionPolicyLab" },
          output: { value: "7/3=2,7%3=1,floor=2,mod=1\n-7/3=-2,-7%3=-1,floor=-3,mod=2\n7/-3=-2,7%-3=1,floor=-3,mod=-2\n-7/-3=2,-7%-3=-1,floor=2,mod=-1", explanation: ["sign이 같으면 양수 표본에서 두 quotient가 같지만 sign이 다르고 나누어떨어지지 않으면 floor가 1 더 작습니다.", "%와 floorMod는 서로 다른 quotient와 짝을 이루므로 결과 sign도 다를 수 있습니다."] },
          experiments: [
            { change: "-7%3을 array index로 직접 사용합니다.", prediction: "-1이어서 index failure 위험이 있습니다.", result: "positive size bucket에는 floorMod(-7,3)=2를 검토합니다." },
            { change: "divisor를 -3으로 바꿉니다.", prediction: "floorMod의 nonzero sign도 음수가 됩니다.", result: "항상 nonnegative라는 설명 대신 divisor policy를 명시합니다." },
            { change: "Integer.MIN_VALUE와 -1을 넣습니다.", prediction: "일반 /와 floorDiv는 overflow 특례를 보입니다.", result: "다음 장의 exact division으로 검증합니다." },
          ],
          sourceRefs: ["java-arithmetic-source", "java-truncation-source", "jls-multiplicative", "java-math-operators-api"],
        },
      ],
      diagnostics: [
        { symptom: "negative id를 size로 `%` 했더니 음수 index가 나옵니다.", likelyCause: "Java remainder를 nonnegative modulo로 오해했습니다.", checks: ["dividend·divisor sign을 기록합니다.", "remainder identity를 검증합니다.", "domain이 truncating/floor 중 무엇을 요구하는지 묻습니다."], fix: "positive bucket 정책이면 Math.floorMod를 사용하고 size>0을 검증합니다.", prevention: "±dividend·±divisor parameterized tests와 quotient/remainder invariant를 둡니다." },
      ],
    },
    {
      id: "integer-floating-zero-boundaries",
      title: "정수 0 나눗셈은 예외이고 floating 0 나눗셈은 Infinity·NaN·signed zero입니다",
      lead: "같은 `/0` 표기라도 promoted operation type에 따라 실패 모드가 완전히 달라집니다.",
      explanations: [
        "integer `/`와 `%`에서 divisor가 0이면 ArithmeticException입니다. literal `1/0`도 javac가 warning을 낼 수 있지만 일반 expression statement로 compile된 뒤 실행 시 idiv에서 실패할 수 있으므로 compile error라고 일반화하면 안 됩니다.",
        "floating division은 IEEE 754 규칙을 따릅니다. nonzero/±0.0은 signed Infinity, 0.0/0.0은 NaN이고 exception이 아닙니다.",
        "floating `%`에서 divisor가 zero이면 NaN입니다. Math.IEEEremainder와 `%`는 implied quotient rounding이 달라 같은 API로 취급하면 안 됩니다.",
        "-0.0은 `== 0.0`은 true지만 reciprocal sign과 bit representation이 다릅니다. denominator validation은 `value == 0.0`으로 두 signed zero를 모두 차단할지 domain별로 정합니다.",
        "parse 성공이나 exception 부재는 valid 계산을 뜻하지 않습니다. 외부 double은 isFinite·zero·range를 operation 전에 검사하고 raw user amount는 error message에 남기지 않습니다.",
      ],
      concepts: [
        { term: "integer zero failure", definition: "integer division/remainder divisor가 0일 때 evaluation이 ArithmeticException으로 abruptly complete되는 계약입니다.", detail: ["runtime failure입니다.", "guard를 operation 전에 둡니다."] },
        { term: "signed zero", definition: "IEEE 754의 +0.0과 -0.0처럼 비교는 같아도 sign bit와 일부 operation 결과가 다른 값입니다.", detail: ["1.0/-0.0은 -Infinity입니다.", "serialization policy를 확인합니다."] },
        { term: "non-finite result", definition: "NaN 또는 ±Infinity처럼 유한 실수가 아닌 floating value입니다.", detail: ["exception 없이 생길 수 있습니다.", "domain boundary에서 거부할 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "java-zero-division-matrix",
          title: "integer exception과 floating special values를 같은 matrix에서 실행합니다",
          language: "java",
          filename: "src/learning/java04/ZeroDivisionLab.java",
          purpose: "operation type별 zero failure를 exact class/value로 고정합니다.",
          code: String.raw`package learning.java04;

public class ZeroDivisionLab {
    public static void main(String[] args) {
        int zero = 0;
        try { System.out.println(1 / zero); }
        catch (ArithmeticException error) { System.out.println("int-div-zero=" + error.getClass().getSimpleName()); }
        try { System.out.println(1 % zero); }
        catch (ArithmeticException error) { System.out.println("int-rem-zero=" + error.getClass().getSimpleName()); }

        System.out.println("double-pos=" + (1.0 / 0.0));
        System.out.println("double-neg=" + (-1.0 / 0.0));
        System.out.println("double-nan=" + (0.0 / 0.0));
        System.out.println("double-negzero=" + (1.0 / -0.0));
        System.out.println("double-rem=" + (1.0 % 0.0));
    }
}`,
          walkthrough: [
            { lines: "5-9", explanation: "runtime integer zero를 /와 %에 각각 적용하고 exception class만 privacy-safe하게 출력합니다." },
            { lines: "11-15", explanation: "positive/negative numerator, 0/0, negative zero와 floating remainder를 비교합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java04/ZeroDivisionLab.java && java -cp build/classes learning.java04.ZeroDivisionLab" },
          output: { value: "int-div-zero=ArithmeticException\nint-rem-zero=ArithmeticException\ndouble-pos=Infinity\ndouble-neg=-Infinity\ndouble-nan=NaN\ndouble-negzero=-Infinity\ndouble-rem=NaN", explanation: ["integer operations만 exception path입니다.", "floating zero는 정상 반환 value이므로 별도 finite/zero validation이 필요합니다."] },
          experiments: [
            { change: "zero variable을 literal 0으로 바꾸고 -Xlint:divzero를 켭니다.", prediction: "warning이 생길 수 있지만 일반 method compile exit는 0이고 실행은 실패합니다.", result: "warning·compile failure·runtime failure를 구분합니다." },
            { change: "1.0/0.0 결과를 int로 cast합니다.", prediction: "Infinity가 Integer.MAX_VALUE가 되어 invalid data가 숨습니다.", result: "finite check를 cast 전에 둡니다." },
            { change: "denominator check를 `value < epsilon`으로 작성합니다.", prediction: "negative nonzero도 모두 zero로 오판할 수 있습니다.", result: "absolute magnitude와 domain tolerance를 명시합니다." },
          ],
          sourceRefs: ["java-arithmetic-source", "jls-multiplicative", "jls-floating-values", "java-double-api"],
        },
      ],
      diagnostics: [
        { symptom: "division이 exception 없이 Infinity를 저장했습니다.", likelyCause: "floating operation을 integer zero contract로 생각했습니다.", checks: ["promoted operand/result type을 확인합니다.", "denominator의 +0.0/-0.0을 출력합니다.", "Double.isFinite와 isNaN을 적용합니다."], fix: "operation 전 zero/range를 검증하고 operation 후 finite invariant도 확인합니다.", prevention: "±0.0·NaN·Infinity fixtures와 stable rejection reason을 둡니다." },
      ],
    },
    {
      id: "integer-overflow-exact-contract",
      title: "정수 연산은 조용히 wrap하며 MIN_VALUE/-1도 예외 없이 overflow합니다",
      lead: "compile 성공을 범위 안전으로 착각하지 않고 operation마다 checked 또는 wider representation을 선택합니다.",
      explanations: [
        "int·long +·-·*의 overflow는 exception을 내지 않고 two's-complement low bits로 wrap합니다. Integer.MAX_VALUE+1이 MIN_VALUE가 되는 것은 정상 Java operator semantics이지만 대부분 업무 domain에는 invalid입니다.",
        "integer division에는 유일한 overflow pair가 있습니다. Integer.MIN_VALUE/-1의 algebraic result 2147483648은 int에 없어서 결과가 다시 Integer.MIN_VALUE이고 remainder는 0입니다.",
        "JDK 21의 Math.addExact·subtractExact·multiplyExact·incrementExact·decrementExact·negateExact·divideExact는 fixed-width overflow를 ArithmeticException으로 바꿉니다. divideExact는 divisor zero와 MIN/-1을 모두 거부합니다.",
        "final result만 long에 저장해도 earlier int multiplication은 이미 overflow할 수 있습니다. Ex03의 /10*10처럼 each intermediate type을 추적하고 첫 위험 operand부터 long 또는 exact method로 바꿉니다.",
        "exception이 control flow에 맞지 않는 import/UI boundary에서는 checked helper가 field·reason·bound를 가진 Result를 반환할 수 있습니다. raw 금액이나 사용자 record 전체를 exception/log에 복사하지 않습니다.",
        "범위가 fixed-width보다 본질적으로 큰 count라면 BigInteger를 선택합니다. exact method는 representation 선택을 대신하지 않고 의도치 않은 overflow를 빨리 드러냅니다.",
      ],
      concepts: [
        { term: "silent wrap", definition: "fixed-width integer result의 high bits가 사라져 value가 반대쪽 범위로 순환하는 현상입니다.", detail: ["runtime exception이 아닙니다.", "boundary tests가 필요합니다."] },
        { term: "division overflow pair", definition: "signed MIN_VALUE를 -1로 나눌 때 positive counterpart가 target type에 없어지는 유일한 integer division overflow 조합입니다.", detail: ["일반 /는 MIN_VALUE를 반환합니다.", "Math.divideExact는 거부합니다."] },
        { term: "checked arithmetic", definition: "mathematical result가 primitive 범위를 벗어나면 명시적으로 실패하는 API 계약입니다.", detail: ["Math exact methods가 대표입니다.", "failure taxonomy를 설계합니다."] },
      ],
      codeExamples: [
        {
          id: "java-overflow-exact-arithmetic",
          title: "default wrap와 Math exact failure를 나란히 실행합니다",
          language: "java",
          filename: "src/learning/java04/OverflowPolicyLab.java",
          purpose: "덧셈·곱셈·division special pair의 silent/checked behavior를 고정합니다.",
          code: String.raw`package learning.java04;

public class OverflowPolicyLab {
    public static void main(String[] args) {
        System.out.println("wrap-add=" + (Integer.MAX_VALUE + 1));
        try { Math.addExact(Integer.MAX_VALUE, 1); }
        catch (ArithmeticException error) { System.out.println("add-exact=" + error.getClass().getSimpleName()); }

        System.out.println("min-div=" + (Integer.MIN_VALUE / -1)
                + ",min-rem=" + (Integer.MIN_VALUE % -1));
        try { Math.divideExact(Integer.MIN_VALUE, -1); }
        catch (ArithmeticException error) { System.out.println("divide-exact=" + error.getClass().getSimpleName()); }

        try { Math.multiplyExact(100_000, 100_000); }
        catch (ArithmeticException error) { System.out.println("multiply-exact=" + error.getClass().getSimpleName()); }
    }
}`,
          walkthrough: [
            { lines: "5-7", explanation: "같은 MAX+1을 default operator와 addExact에 적용해 wrap/failure를 비교합니다." },
            { lines: "9-12", explanation: "MIN/-1의 quotient/remainder와 divideExact rejection을 실행합니다." },
            { lines: "14-15", explanation: "각 operand는 int에 들어가도 product가 넘는 multiplication을 검사합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java04/OverflowPolicyLab.java && java -cp build/classes learning.java04.OverflowPolicyLab" },
          output: { value: "wrap-add=-2147483648\nadd-exact=ArithmeticException\nmin-div=-2147483648,min-rem=0\ndivide-exact=ArithmeticException\nmultiply-exact=ArithmeticException", explanation: ["default integer operator는 범위 위반을 정상 value로 반환합니다.", "Math exact는 동일 boundary를 stable exception path로 바꿉니다."] },
          experiments: [
            { change: "result target만 long으로 바꾸고 `100_000*100_000`은 그대로 둡니다.", prediction: "RHS int overflow 뒤 손상된 value가 long으로 widening됩니다.", result: "첫 operand를 100_000L로 바꾸거나 multiplyExact(long,long)을 씁니다." },
            { change: "Math.divideExact(Integer.MIN_VALUE,-1)을 일반 /로 바꿉니다.", prediction: "exception 대신 MIN_VALUE가 됩니다.", result: "division에도 exact policy가 필요합니다." },
            { change: "exception message에 원본 transaction 전체를 넣습니다.", prediction: "로그에 PII·금액이 노출될 수 있습니다.", result: "field=quantity,reason=OVERFLOW 같은 최소 metadata만 기록합니다." },
          ],
          sourceRefs: ["java-truncation-source", "jls-integer-values", "jls-multiplicative", "java-math-operators-api"],
        },
      ],
      diagnostics: [
        { symptom: "long total인데도 큰 multiplication이 음수입니다.", likelyCause: "int operands가 먼저 overflow한 뒤 long target으로 late widening됐습니다.", checks: ["각 multiplication intermediate type을 적습니다.", "first overflow 가능 operation 전 operand를 확인합니다.", "Math.multiplyExact로 재현합니다."], fix: "첫 operand부터 long으로 만들거나 checked long arithmetic을 사용합니다.", prevention: "MIN/MAX±1과 realistic maximum product를 parameterized tests에 둡니다." },
      ],
    },
    {
      id: "floating-equality-decimal-rounding",
      title: "floating ==는 representation equality이며 tolerance와 BigDecimal은 서로 다른 domain 선택입니다",
      lead: "Ex02의 평균과 둘째 자리 절삭을 binary approximation·rounding policy 관점에서 다시 설계합니다.",
      explanations: [
        "0.1+0.2는 binary64에서 0.30000000000000004이고 0.3과 primitive ==가 false입니다. 이는 evaluation order bug가 아니라 두 decimal literals의 nearest binary representations를 연산한 결과입니다.",
        "measurement 비교는 absolute tolerance 하나만 무조건 쓰지 않습니다. expected magnitude에 따라 absolute+relative tolerance를 결합하고 NaN·Infinity·signed zero policy를 먼저 정합니다.",
        "money·decimal rule처럼 base-10 intent가 중요하면 BigDecimal(String)으로 ingress하고 scale·MathContext·RoundingMode를 명시합니다. binary double을 만든 뒤 new BigDecimal(double)로 옮겨도 원래 decimal intent는 복구되지 않습니다.",
        "Ex02의 `(int)(average*100)/100.0`은 양수에서 둘째 자리 아래를 버립니다. 음수에서는 floor가 아니라 0 방향이고 1.005 같은 binary boundary도 기대와 다를 수 있습니다.",
        "BigDecimal equals는 value와 scale을 모두 보고 compareTo는 numerical order를 봅니다. 계산 equality와 key equality를 같은 개념으로 두지 않습니다.",
        "rounding은 화면 format, 저장 canonical value, 업무 정산 시점마다 owner가 다를 수 있습니다. 일찍 반복 rounding하면 누적 오차가 생기므로 boundary와 순서를 문서화합니다.",
      ],
      concepts: [
        { term: "representation equality", definition: "두 floating operands가 같은 IEEE value인지 보는 primitive == 계약입니다.", detail: ["mathematical closeness와 다릅니다.", "NaN은 자기 자신과도 == false입니다."] },
        { term: "tolerance comparison", definition: "두 finite measurements 차이가 domain이 허용한 absolute/relative error 안인지 판단하는 정책입니다.", detail: ["scale에 맞춰야 합니다.", "NaN/Infinity를 별도 처리합니다."] },
        { term: "decimal arithmetic", definition: "base-10 source·scale·rounding intent를 BigDecimal로 명시하는 계산 방식입니다.", detail: ["String constructor를 선호합니다.", "equals/compareTo 차이를 검증합니다."] },
      ],
      codeExamples: [
        {
          id: "java-floating-equality-bigdecimal",
          title: "binary direct equality, tolerance와 decimal equality를 비교합니다",
          language: "java",
          filename: "src/learning/java04/FloatingEqualityLab.java",
          purpose: "평균·금액 domain에서 서로 다른 equality 전략을 exact output으로 분리합니다.",
          code: String.raw`package learning.java04;

import java.math.BigDecimal;

public class FloatingEqualityLab {
    public static void main(String[] args) {
        double binary = 0.1 + 0.2;
        System.out.println("binary=" + binary);
        System.out.println("binary-direct=" + (binary == 0.3));
        System.out.println("binary-tolerance=" + (Math.abs(binary - 0.3) <= 1.0e-12));

        BigDecimal decimal = new BigDecimal("0.1").add(new BigDecimal("0.2"));
        System.out.println("decimal=" + decimal + ",equals=" + decimal.equals(new BigDecimal("0.3")));
        BigDecimal one = new BigDecimal("1.0");
        BigDecimal two = new BigDecimal("1.00");
        System.out.println("scale-equals=" + one.equals(two) + ",compare=" + one.compareTo(two));
    }
}`,
          walkthrough: [
            { lines: "7-10", explanation: "같은 binary sum을 출력·direct ==·explicit tolerance로 세 번 관찰합니다." },
            { lines: "12-16", explanation: "decimal String arithmetic와 scale-sensitive/numeric equality를 분리합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java04/FloatingEqualityLab.java && java -cp build/classes learning.java04.FloatingEqualityLab" },
          output: { value: "binary=0.30000000000000004\nbinary-direct=false\nbinary-tolerance=true\ndecimal=0.3,equals=true\nscale-equals=false,compare=0", explanation: ["binary approximation과 tolerance success는 direct equality를 바꾸지 않습니다.", "BigDecimal numeric equality와 representation equality도 별도 계약입니다."] },
          experiments: [
            { change: "tolerance를 0.0으로 둡니다.", prediction: "binary comparison이 false가 됩니다.", result: "tolerance는 syntax trick이 아니라 domain requirement입니다." },
            { change: "new BigDecimal(0.1)을 사용합니다.", prediction: "긴 binary approximation의 exact decimal expansion이 보입니다.", result: "decimal text intent에는 String constructor를 씁니다." },
            { change: "Ex02 average가 음수가 되게 fixture를 만듭니다.", prediction: "int cast 절삭은 floor가 아니라 0 방향입니다.", result: "RoundingMode.DOWN/FLOOR 등 실제 정책을 이름으로 선택합니다." },
          ],
          sourceRefs: ["java-score-average-source", "java-truncation-source", "jls-floating-values", "jls-equality", "java-double-api", "java-bigdecimal-api"],
        },
      ],
      diagnostics: [
        { symptom: "계산상 0.3인데 `== 0.3`이 false입니다.", likelyCause: "decimal real-number equality를 binary floating representation equality에 적용했습니다.", checks: ["Double.toHexString과 decimal output을 봅니다.", "NaN/Infinity를 제외합니다.", "measurement인지 money인지 domain을 확인합니다."], fix: "measurement는 documented tolerance, decimal domain은 BigDecimal policy를 사용합니다.", prevention: "0.1+0.2·large magnitude·near-zero·NaN·Infinity tests를 둡니다." },
      ],
      comparisons: [
        { title: "floating equality 전략", options: [
          { name: "primitive ==", chooseWhen: "exact sentinel·same computed representation을 비교할 때", avoidWhen: "decimal measurement closeness를 판단할 때", tradeoffs: ["빠르고 명확합니다.", "NaN·signed zero 규칙을 알아야 합니다."] },
          { name: "tolerance", chooseWhen: "finite scientific/measurement error budget이 있을 때", avoidWhen: "money·identifier·exact counter일 때", tradeoffs: ["approximate domain에 맞습니다.", "absolute/relative scale 설계가 필요합니다."] },
          { name: "BigDecimal", chooseWhen: "decimal text·money·rounding rule이 계약일 때", avoidWhen: "고성능 binary simulation에서 decimal이 요구되지 않을 때", tradeoffs: ["decimal policy가 명시적입니다.", "scale/equality/performance 비용이 있습니다."] },
        ] },
      ],
    },
    {
      id: "prefix-postfix-state-transitions",
      title: "prefix/postfix는 update 시점이 아니라 expression value가 이전/이후인지가 다릅니다",
      lead: "세미콜론 신화를 버리고 variable load·store·result value를 각각 추적합니다.",
      explanations: [
        "`++x`는 1을 더해 variable에 저장한 새 value가 expression result이고, `x++`는 새 value를 저장하지만 expression result는 저장 전 value입니다.",
        "postfix update는 세미콜론을 만날 때 미뤄지는 것이 아닙니다. operand evaluation이 정상 완료되면 increment와 store가 expression evaluation 중 수행됩니다.",
        "Java는 left operand부터 평가하므로 `x++ + ++x`도 deterministic하지만 같은 variable을 한 식에서 두 번 mutation하면 review와 유지보수가 어렵습니다.",
        "Ex05의 result1 25, result2 20, 최종 su1/su2 5가 value/state 분리를 보여 줍니다. 비활성 주석의 긴 증감식은 학습 puzzle이지 production pattern이 아닙니다.",
        "++/--에도 numeric promotion과 variable type으로의 narrowing이 내장됩니다. byte MAX에서 ++하면 exception이 아니라 wrap하므로 counter range가 중요하면 incrementExact를 씁니다.",
        "atomicity와 thread safety는 별도 문제입니다. `count++`는 read-modify-write라 여러 thread의 shared counter에 안전하지 않으며 AtomicInteger 또는 synchronization policy가 필요합니다.",
      ],
      concepts: [
        { term: "postfix value", definition: "variable은 갱신되지만 expression이 산출하는 값은 갱신 전 value인 계약입니다.", detail: ["store는 evaluation 중 일어납니다.", "result와 state를 분리합니다."] },
        { term: "prefix value", definition: "variable을 먼저 갱신하고 갱신 후 value를 expression result로 산출하는 계약입니다.", detail: ["최종 state는 postfix와 같을 수 있습니다.", "주변 계산 결과는 다릅니다."] },
        { term: "read-modify-write", definition: "현재 값을 읽어 계산하고 다시 저장하는 여러 단계의 mutation입니다.", detail: ["atomic이라고 가정하지 않습니다.", "concurrency policy가 별도입니다."] },
      ],
      codeExamples: [
        {
          id: "java-prefix-postfix-decomposition",
          title: "compact 증감식을 명시적 statements와 비교합니다",
          language: "java",
          filename: "src/learning/java04/IncrementStateLab.java",
          purpose: "expression result와 final variable state를 같은 output에서 검증합니다.",
          code: String.raw`package learning.java04;

public class IncrementStateLab {
    public static void main(String[] args) {
        int value = 4;
        int postfix = value++;
        System.out.println("postfix-result=" + postfix + ",value=" + value);

        value = 4;
        int prefix = ++value;
        System.out.println("prefix-result=" + prefix + ",value=" + value);

        int mixed = 1;
        int compact = mixed++ + ++mixed;
        System.out.println("mixed-result=" + compact + ",value=" + mixed);

        int clear = 1;
        int left = clear;
        clear++;
        clear++;
        int right = clear;
        System.out.println("clear-result=" + (left + right) + ",value=" + clear);
    }
}`,
          walkthrough: [
            { lines: "5-11", explanation: "같은 초기 4에서 postfix/prefix expression result와 final state를 비교합니다." },
            { lines: "13-15", explanation: "left-to-right로 deterministic한 mixed mutation을 실행합니다." },
            { lines: "17-22", explanation: "같은 result/state를 named statements로 풀어 review 가능한 형태로 만듭니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java04/IncrementStateLab.java && java -cp build/classes learning.java04.IncrementStateLab" },
          output: { value: "postfix-result=4,value=5\nprefix-result=5,value=5\nmixed-result=4,value=3\nclear-result=4,value=3", explanation: ["postfix와 prefix의 final state는 같아도 expression result가 다릅니다.", "compact/clear는 Java에서 같은 결과지만 명시적 version이 mutation 순서를 바로 보여 줍니다."] },
          experiments: [
            { change: "int MAX_VALUE에 ++를 적용합니다.", prediction: "MIN_VALUE로 wrap합니다.", result: "checked counter는 Math.incrementExact를 사용합니다." },
            { change: "mixed expression의 두 operand 순서를 바꿉니다.", prediction: "각 load/store sequence가 달라져 result를 다시 추적해야 합니다.", result: "한 expression의 multiple mutation을 금지합니다." },
            { change: "shared static counter를 여러 thread에서 ++합니다.", prediction: "lost update로 기대 count보다 작을 수 있습니다.", result: "AtomicInteger/synchronization과 workload test가 필요합니다." },
          ],
          sourceRefs: ["java-increment-source", "jls-evaluation-order", "jls-postfix-increment", "jls-prefix-increment", "java-math-operators-api"],
        },
      ],
      diagnostics: [
        { symptom: "postfix result는 4인데 variable을 바로 출력하면 5입니다.", likelyCause: "expression result와 stored state를 같은 값으로 생각했습니다.", checks: ["평가 전 value를 기록합니다.", "increment/store 뒤 state를 기록합니다.", "주변 operator가 소비한 expression value를 적습니다."], fix: "필요한 value와 update를 named statements로 분리합니다.", prevention: "한 expression에서 같은 variable을 한 번만 mutate하는 review rule을 둡니다." },
      ],
    },
    {
      id: "comparison-equality-nan-reference",
      title: "비교 연산은 boolean을 만들지만 숫자·NaN·reference마다 equality 계약이 다릅니다",
      lead: "범위 비교와 ==를 한 종류의 ‘같다’로 묶지 않고 operand category를 먼저 확인합니다.",
      explanations: [
        "<·<=·>·>=는 numeric operands를 binary promotion한 뒤 boolean을 만듭니다. Java에서 `0<score<100`처럼 boolean result를 다시 number와 비교할 수 없으므로 두 comparison을 &&로 연결합니다.",
        "primitive numeric ==는 promoted values를 비교합니다. +0.0과 -0.0은 == true이지만 NaN은 자신과도 == false이고 != true이며 모든 ordered comparison이 false입니다.",
        "Double.compare와 Double.equals는 collection sorting/key에 쓸 total-order/equality 계약을 제공해 primitive operator와 다릅니다. boxed NaN equals는 true이고 boxed +0.0/-0.0 equals는 false입니다.",
        "reference ==는 identity를 비교합니다. String content는 Java03에서 배운 equals를 사용하며 new String 두 개는 content가 같아도 == false입니다.",
        "Ex07의 `su3>=90&&su3<=100`과 `c1>='a'&&c1<='z'`는 inclusive range입니다. 그러나 최종 active values는 104와 'T'라 두 출력 모두 false입니다.",
        "user-defined range는 lower≤upper·inclusive/exclusive·NaN·null·Unicode 범위를 명시해야 합니다. char ASCII range는 전체 문자 분류 API를 대신하지 않습니다.",
      ],
      concepts: [
        { term: "ordered comparison", definition: "두 numeric values의 크기 관계를 boolean으로 만드는 <·<=·>·>= operation입니다.", detail: ["numeric promotion이 먼저입니다.", "NaN에서는 모두 false입니다."] },
        { term: "primitive equality", definition: "primitive values를 promotion 후 == 또는 !=로 비교하는 계약입니다.", detail: ["+0.0==-0.0입니다.", "NaN==NaN은 false입니다."] },
        { term: "reference identity", definition: "두 references가 같은 object를 가리키는지 ==로 비교하는 계약입니다.", detail: ["content equality와 다릅니다.", "null identity 비교는 가능합니다."] },
      ],
      codeExamples: [
        {
          id: "java-comparison-equality-matrix",
          title: "range·NaN·signed zero·boxed·String equality를 비교합니다",
          language: "java",
          filename: "src/learning/java04/ComparisonPolicyLab.java",
          purpose: "같은 == 표기가 operand category에 따라 어떤 계약인지 exact output으로 구분합니다.",
          code: String.raw`package learning.java04;

public class ComparisonPolicyLab {
    public static void main(String[] args) {
        int score = 90;
        System.out.println("range=" + (score >= 0 && score <= 100));

        double nan = Double.NaN;
        System.out.println("primitive-nan-eq=" + (nan == nan) + ",nan-ne=" + (nan != nan));
        System.out.println("boxed-nan-eq=" + Double.valueOf(nan).equals(Double.valueOf(nan)));
        System.out.println("primitive-zero-eq=" + (0.0 == -0.0)
                + ",boxed-zero-eq=" + Double.valueOf(0.0).equals(Double.valueOf(-0.0)));

        String left = new String("same");
        String right = new String("same");
        System.out.println("string-identity=" + (left == right) + ",string-content=" + left.equals(right));
    }
}`,
          walkthrough: [
            { lines: "5-6", explanation: "두 independent comparisons를 &&로 연결해 inclusive range를 만듭니다." },
            { lines: "8-12", explanation: "primitive와 boxed NaN/signed-zero equality contract를 대비합니다." },
            { lines: "14-16", explanation: "reference identity와 String content equality를 재확인합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java04/ComparisonPolicyLab.java && java -cp build/classes learning.java04.ComparisonPolicyLab" },
          output: { value: "range=true\nprimitive-nan-eq=false,nan-ne=true\nboxed-nan-eq=true\nprimitive-zero-eq=true,boxed-zero-eq=false\nstring-identity=false,string-content=true", explanation: ["operator equality와 wrapper/content equality는 같은 결과를 보장하지 않습니다.", "collection key/sort policy는 primitive comparison을 그대로 복사하지 않습니다."] },
          experiments: [
            { change: "score range를 `0 < score < 100`으로 씁니다.", prediction: "첫 comparison boolean과 100을 <로 비교할 수 없어 compile failure입니다.", result: "`0<score && score<100`으로 분리합니다." },
            { change: "nan 대신 Infinity를 비교합니다.", prediction: "Infinity는 자신과 == true이고 ordered comparison도 sign에 따라 동작합니다.", result: "non-finite 전체를 NaN 한 규칙으로 묶지 않습니다." },
            { change: "String == fixture를 literals로 바꿉니다.", prediction: "interning 때문에 true가 될 수 있어 identity bug가 숨습니다.", result: "content contract에는 equals를 유지합니다." },
          ],
          sourceRefs: ["java-logical-source", "jls-relational", "jls-equality", "jls-floating-values", "java-double-api"],
        },
      ],
      diagnostics: [
        { symptom: "NaN이 min/max 검사를 모두 통과하지도 실패 branch에 걸리지도 않는 것처럼 보입니다.", likelyCause: "NaN ordered comparisons가 모두 false라는 unordered contract를 고려하지 않았습니다.", checks: ["Double.isNaN/isFinite를 먼저 봅니다.", "comparison truth table을 기록합니다.", "boxed/primitive contract를 구분합니다."], fix: "finite validation 뒤 range를 비교하고 NaN reason을 별도로 반환합니다.", prevention: "NaN·±Infinity·±0.0·bounds fixtures를 comparison tests에 포함합니다." },
      ],
    },
    {
      id: "short-circuit-versus-eager-boolean",
      title: "&&·||는 오른쪽을 조건부 평가하고 boolean &·|·^는 양쪽을 항상 평가합니다",
      lead: "truth table 결과가 같아도 method call·assignment·exception 같은 오른쪽 side effect는 같지 않습니다.",
      explanations: [
        "`left && right`는 left가 false면 전체가 false라 right를 평가하지 않습니다. `left || right`는 left가 true면 전체가 true라 right를 평가하지 않습니다.",
        "boolean operands의 `&`와 `|`는 각각 AND/OR value를 만들지만 두 operands를 항상 평가합니다. integer operands에서는 같은 기호가 bitwise operation이므로 type context를 먼저 봅니다.",
        "boolean `^`는 exclusive OR로 operands가 다를 때 true이고 short-circuit variant가 없습니다. `!`는 단일 boolean value를 반전합니다.",
        "Ex07의 false && assignment에서 right assignment가 실행되지 않아 s4가 7로 남습니다. 이 behavior를 null guard처럼 의도적으로 사용할 수 있지만 mutation을 숨기면 읽기 어렵습니다.",
        "`value != null && value.isValid()`는 guard로 적절하지만 `ready && send()`처럼 중요한 action을 boolean expression 안에 숨기면 audit·retry가 어렵습니다. control flow statement로 의도를 드러냅니다.",
        "right operand가 expensive query라면 short-circuit가 성능에 영향을 주지만 operand order를 바꾸려면 pure·equivalent 조건인지 확인해야 합니다. exception과 state change가 있으면 단순 reorder는 semantics를 바꿉니다.",
      ],
      concepts: [
        { term: "short-circuit", definition: "left value만으로 결과가 확정되면 right expression을 평가하지 않는 &&·|| 계약입니다.", detail: ["side effect도 생략됩니다.", "guard에 유용합니다."] },
        { term: "eager boolean", definition: "boolean &·|·^처럼 결과 계산 전에 양쪽 operands를 모두 평가하는 방식입니다.", detail: ["truth value가 &&·||와 같을 수 있습니다.", "evaluation trace는 다릅니다."] },
        { term: "guard expression", definition: "위험하거나 불필요한 operation 앞에서 조건을 확인해 evaluation을 막는 식입니다.", detail: ["null/zero/range guard가 있습니다.", "중요 mutation은 숨기지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "java-short-circuit-eager-boolean",
          title: "동일 truth values에서 probe call 수를 비교합니다",
          language: "java",
          filename: "src/learning/java04/LogicalEvaluationLab.java",
          purpose: "논리 결과와 right operand evaluation 여부를 separate evidence로 만듭니다.",
          code: String.raw`package learning.java04;

public class LogicalEvaluationLab {
    private static int calls;

    private static boolean probe(boolean value) {
        calls++;
        return value;
    }

    public static void main(String[] args) {
        calls = 0;
        System.out.println("and-short=" + (probe(false) && probe(true)) + ",calls=" + calls);
        calls = 0;
        System.out.println("and-eager=" + (probe(false) & probe(true)) + ",calls=" + calls);
        calls = 0;
        System.out.println("or-short=" + (probe(true) || probe(false)) + ",calls=" + calls);
        calls = 0;
        System.out.println("or-eager=" + (probe(true) | probe(false)) + ",calls=" + calls);
        calls = 0;
        System.out.println("xor=" + (probe(true) ^ probe(false)) + ",calls=" + calls);
        System.out.println("not=" + !false);
    }
}`,
          walkthrough: [
            { lines: "4-9", explanation: "probe가 호출 횟수라는 observable side effect를 남깁니다." },
            { lines: "12-21", explanation: "같은 boolean input에 short/eager AND·OR와 XOR를 적용하고 calls를 매번 초기화합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java04/LogicalEvaluationLab.java && java -cp build/classes learning.java04.LogicalEvaluationLab" },
          output: { value: "and-short=false,calls=1\nand-eager=false,calls=2\nor-short=true,calls=1\nor-eager=true,calls=2\nxor=true,calls=2\nnot=true", explanation: ["AND/OR truth value는 같아도 eager version만 second probe를 호출합니다.", "XOR는 두 values가 달라 true이고 항상 두 calls입니다."] },
          experiments: [
            { change: "probe(false)&&probe(true)의 operands를 바꿉니다.", prediction: "두 calls가 실행된 뒤 false가 됩니다.", result: "commutative truth table과 evaluation trace는 다릅니다." },
            { change: "right probe가 exception을 던지게 합니다.", prediction: "short version은 생략할 수 있지만 eager version은 실패합니다.", result: "operator 교체는 failure behavior를 바꿉니다." },
            { change: "null guard의 &&를 &로 바꿉니다.", prediction: "right dereference가 실행되어 NullPointerException 위험이 생깁니다.", result: "guard에는 conditional operator를 유지합니다." },
          ],
          sourceRefs: ["java-logical-source", "jls-evaluation-order", "jls-bitwise-logical", "jls-conditional-and", "jls-conditional-or"],
        },
      ],
      diagnostics: [
        { symptom: "false guard인데 오른쪽 method가 호출됐습니다.", likelyCause: "&& 대신 eager boolean &를 사용했습니다.", checks: ["operand types가 boolean인지 확인합니다.", "operator가 하나/두 문자인지 봅니다.", "call count·assignment·exception을 trace합니다."], fix: "conditional guard에는 &&/||를 사용하고 side effect는 statements로 분리합니다.", prevention: "right operand가 실행되면 안 되는 false/true guard tests를 둡니다." },
      ],
    },
    {
      id: "bitwise-shifts-mask-representation",
      title: "bitwise와 shift는 promoted fixed-width bits를 다루며 shift distance도 mask됩니다",
      lead: "2진수 표기를 값 장식으로 끝내지 않고 sign extension·zero fill·distance normalization을 실행합니다.",
      explanations: [
        "integer `&`·`|`·`^`·`~`는 binary numeric/unary promotion 뒤 각 bit를 계산합니다. boolean &·|·^와 기호는 같지만 input/result type과 의미가 다릅니다.",
        "`>>`는 signed right shift로 left sign bit를 복제하고 `>>>`는 zero-fill right shift입니다. negative int에서 두 결과가 크게 달라집니다.",
        "int shift는 right operand의 low 5 bits만 사용해 distance가 0..31이고 long shift는 low 6 bits만 사용해 0..63입니다. 그래서 1<<35는 1<<3과 같습니다.",
        "byte·short·char는 shift 전에 int로 promotion됩니다. signed byte 0x80을 바로 >>> 하면 sign-extended int를 shift하므로 unsigned byte intent면 Byte.toUnsignedInt를 먼저 적용합니다.",
        "bit mask는 feature flags·protocol fields에 유용하지만 magic number를 흩뿌리지 않습니다. named constants와 `(flags & MASK) != 0`, set/clear/toggle helper를 두고 unknown bits를 검증합니다.",
        "security permission을 bit flag 하나로만 신뢰하지 않습니다. authorization source·versioning·reserved bits·serialization width와 signed display를 함께 설계합니다.",
      ],
      concepts: [
        { term: "bit mask", definition: "관심 있는 bit positions만 선택·설정·해제하기 위한 integer pattern입니다.", detail: ["named constant를 씁니다.", "width를 고정합니다."] },
        { term: "arithmetic/logical shift", definition: ">>는 sign bit를 복제하고 >>>는 왼쪽을 zero로 채우는 right shift입니다.", detail: ["negative value에서 다릅니다.", "left type은 promotion됩니다."] },
        { term: "shift-distance masking", definition: "int는 distance low 5 bits, long은 low 6 bits만 사용하는 규칙입니다.", detail: ["큰/negative distance도 normalize됩니다.", "validation을 대신하지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "java-bitwise-shift-matrix",
          title: "mask·signed/unsigned shift·distance masking·unsigned byte를 출력합니다",
          language: "java",
          filename: "src/learning/java04/BitwiseShiftLab.java",
          purpose: "원본 밖 bit-level operator를 JLS fixed-width 규칙으로 보강합니다.",
          code: String.raw`package learning.java04;

public class BitwiseShiftLab {
    public static void main(String[] args) {
        int value = 0b1010;
        int mask = 0b1100;
        System.out.println("and=" + (value & mask) + ",or=" + (value | mask)
                + ",xor=" + (value ^ mask) + ",not=" + (~value));

        int negative = -8;
        System.out.println("signed-shift=" + (negative >> 2)
                + ",unsigned-shift=" + (negative >>> 2));
        System.out.println("masked-distance=" + (1 << 35)
                + ",long-masked-distance=" + (1L << 67));

        byte signedByte = (byte) 0x80;
        int unsignedByte = Byte.toUnsignedInt(signedByte);
        System.out.println("byte-signed=" + signedByte + ",byte-unsigned=" + unsignedByte
                + ",byte-shift=" + (unsignedByte >>> 1));
    }
}`,
          walkthrough: [
            { lines: "5-8", explanation: "10과 12의 bitwise AND/OR/XOR와 promoted int complement를 출력합니다." },
            { lines: "10-14", explanation: "negative signed/zero-fill right shift와 int/long distance masking을 비교합니다." },
            { lines: "16-19", explanation: "same 0x80 bits를 signed byte와 unsigned int로 해석한 뒤 안전하게 shift합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java04/BitwiseShiftLab.java && java -cp build/classes learning.java04.BitwiseShiftLab" },
          output: { value: "and=8,or=14,xor=6,not=-11\nsigned-shift=-2,unsigned-shift=1073741822\nmasked-distance=8,long-masked-distance=8\nbyte-signed=-128,byte-unsigned=128,byte-shift=64", explanation: ["~10은 32-bit complement라 -11입니다.", "35&31과 67&63이 모두 3이고 unsigned byte conversion은 sign extension을 제거합니다."] },
          experiments: [
            { change: "1<<35를 1<<-1로 바꿉니다.", prediction: "-1의 low 5 bits가 31이라 Integer.MIN_VALUE입니다.", result: "negative distance도 exception이 아니므로 external shift count를 검증합니다." },
            { change: "Byte.toUnsignedInt를 제거하고 signedByte>>>1을 출력합니다.", prediction: "byte가 negative int로 sign-extend된 뒤 huge positive int가 됩니다.", result: "wire unsigned meaning을 promotion 전에 명시합니다." },
            { change: "mask의 reserved bit를 켭니다.", prediction: "현재 helper가 silently 보존/삭제할 수 있습니다.", result: "allowed mask와 unknown-bit rejection을 protocol contract로 둡니다." },
          ],
          sourceRefs: ["jls-numeric-promotion", "jls-bitwise-logical", "jls-shift"],
        },
      ],
      diagnostics: [
        { symptom: "1<<32가 0이 아니라 1입니다.", likelyCause: "shift distance가 그대로 쓰인다고 가정했지만 int distance는 low 5 bits만 사용합니다.", checks: ["left promoted type을 확인합니다.", "distance &31 또는 &63을 계산합니다.", "binary/hex output을 봅니다."], fix: "domain이 허용한 distance 범위를 operation 전에 검증합니다.", prevention: "-1·0·31·32·63·64 boundary tests와 named width를 둡니다." },
      ],
    },
    {
      id: "simple-compound-assignment-evaluation",
      title: "compound assignment는 implicit cast를 포함하고 복잡한 왼쪽을 한 번만 평가합니다",
      lead: "`x op= y`를 text substitution으로 풀면 type과 side effect가 달라질 수 있습니다.",
      explanations: [
        "JLS상 `E1 op= E2`는 대략 `E1=(T)(E1 op E2)`와 같지만 E1을 한 번만 평가합니다. T는 E1의 type입니다.",
        "따라서 byte value에 `+=`는 compile되지만 operation int result가 byte로 implicitly narrowing되어 wrap할 수 있습니다. `byteValue=byteValue+10`은 explicit cast 없이는 compile되지 않습니다.",
        "array access·field receiver·method call이 LHS에 있으면 evaluation-once 차이가 observable합니다. `array[index()] += 5`와 손으로 푼 `array[index()] = array[index()] + 5`는 index() 호출 수와 selected components가 다릅니다.",
        "assignment operator는 오른쪽으로 grouping되므로 `a=b=3`은 가능하지만 state changes를 한 줄에 연결하면 audit가 어렵습니다. declaration/validation/update를 분리합니다.",
        "compound assignment의 implicit conversion은 convenience이지 range check가 아닙니다. counter·money·size처럼 overflow가 invalid면 wider/exact operation 뒤 checked conversion을 사용합니다.",
        "`+=`의 String concatenation도 별도 규칙을 갖습니다. 이 세션에서는 numeric/bitwise assignment에 집중하고 String content/performance는 Java03 계약을 따릅니다.",
      ],
      concepts: [
        { term: "compound assignment conversion", definition: "binary operation 뒤 result를 LHS type으로 암묵 변환해 저장하는 규칙입니다.", detail: ["narrowing이 숨어 있을 수 있습니다.", "range check는 아닙니다."] },
        { term: "LHS evaluation-once", definition: "compound assignment에서 receiver·array·index를 한 번 평가해 variable과 old value를 저장하는 성질입니다.", detail: ["manual expansion과 다릅니다.", "side effect를 줄여도 숨기지 않습니다."] },
        { term: "assignment value", definition: "assignment 자체도 저장된 value를 결과로 갖는 expression이라는 성질입니다.", detail: ["chaining이 가능합니다.", "조건식의 accidental assignment를 주의합니다."] },
      ],
      codeExamples: [
        {
          id: "java-compound-assignment-evaluation-once",
          title: "byte implicit cast와 LHS index call 횟수를 비교합니다",
          language: "java",
          filename: "src/learning/java04/AssignmentPolicyLab.java",
          purpose: "compound assignment를 단순 축약이 아닌 conversion/evaluation contract로 실행합니다.",
          code: String.raw`package learning.java04;

public class AssignmentPolicyLab {
    private static int calls;

    private static int index() {
        return calls++;
    }

    public static void main(String[] args) {
        byte compact = 120;
        compact += 10;
        byte explicit = 120;
        explicit = (byte) (explicit + 10);
        System.out.println("compound-byte=" + compact + ",explicit-byte=" + explicit);

        int factor = 3;
        factor *= 2 + 1;
        System.out.println("compound-value=" + factor);

        int[] compound = {10, 20};
        calls = 0;
        compound[index()] += 5;
        System.out.println("compound-index-calls=" + calls + ",first=" + compound[0]);

        int[] expanded = {10, 20};
        calls = 0;
        expanded[index()] = expanded[index()] + 5;
        System.out.println("expanded-index-calls=" + calls + ",first=" + expanded[0]);
    }
}`,
          walkthrough: [
            { lines: "11-15", explanation: "byte +=의 implicit cast와 explicit expanded arithmetic이 같은 wrapped value를 만듭니다." },
            { lines: "17-19", explanation: "RHS precedence에 따라 2+1 뒤 multiplication과 assignment가 일어납니다." },
            { lines: "21-30", explanation: "compound LHS는 index를 한 번, naive expanded form은 두 번 호출해 서로 다른 element value를 사용합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java04/AssignmentPolicyLab.java && java -cp build/classes learning.java04.AssignmentPolicyLab" },
          output: { value: "compound-byte=-126,explicit-byte=-126\ncompound-value=9\ncompound-index-calls=1,first=15\nexpanded-index-calls=2,first=25", explanation: ["compound assignment implicit narrowing도 silent wrap을 만듭니다.", "manual expansion은 second index call이 element 1의 20을 읽어 element 0에 25를 저장합니다."] },
          experiments: [
            { change: "compact += 10을 compact = compact + 10으로 바꿉니다.", prediction: "possible lossy conversion compile failure입니다.", result: "compound assignment에 implicit cast가 있음을 확인합니다." },
            { change: "index()가 external service를 호출한다고 가정합니다.", prediction: "naive expansion은 service를 두 번 호출합니다.", result: "LHS를 local variable로 분리해 side effect를 제거합니다." },
            { change: "factor *= 2+1에 괄호를 명시합니다.", prediction: "factor *= (2+1)과 같아 9입니다.", result: "읽는 사람이 precedence를 외우게 하지 않습니다." },
          ],
          sourceRefs: ["jls-evaluation-order", "jls-numeric-promotion", "jls-assignment", "jls-integer-values"],
        },
      ],
      diagnostics: [
        { symptom: "byte +=는 compile됐는데 음수가 됐습니다.", likelyCause: "compound assignment가 operation result를 byte로 implicit narrowing했고 range를 검사하지 않았습니다.", checks: ["LHS type과 promoted operation type을 적습니다.", "manual explicit cast form으로 비교합니다.", "MIN/MAX boundary를 실행합니다."], fix: "int로 계산을 유지하거나 range check 뒤 narrow합니다.", prevention: "small primitive compound assignment를 lossy-cast review rule에 포함합니다." },
      ],
    },
    {
      id: "compile-diagnostics-and-operator-tests",
      title: "compile diagnostics와 invariants로 operator 오해를 실행 가능한 반례로 만듭니다",
      lead: "잘못된 식을 cast로 덮기 전에 compiler category와 runtime boundary를 증거로 남깁니다.",
      explanations: [
        "`0<value<10`은 `(0<value)<10`으로 grouping되어 boolean에 <를 적용하므로 compile되지 않습니다. range는 `0<value && value<10`처럼 두 comparisons로 씁니다.",
        "byte+byte result는 int라 simple byte return/assignment가 possible loss of precision으로 실패합니다. compound assignment가 compile된다는 사실은 안전해서가 아니라 implicit conversion rule 때문입니다.",
        "javac human message는 locale/version에 따라 달라질 수 있어 -XDrawDiagnostics의 outer와 nested diagnostic keys, exit code, source position을 normalize합니다. `compiler.err.prob.found.req`만 보면 너무 넓으므로 `compiler.misc.possible.loss.of.precision`까지 확인합니다.",
        "temporary compile fixture는 system temp 아래 GUID directory에 만들고 pre-existing user directory를 재사용하지 않습니다. cleanup 전 canonical parent boundary를 검사합니다.",
        "runtime tests는 exact examples와 boundary matrix를 두고, generated/property tests는 `/`·`%` identity, floor pair identity, no-silent-overflow helper, short-circuit call count 같은 invariant를 넓은 input에서 검증합니다.",
        "bytecode는 constant folding과 actual opcode를 설명하는 tool evidence이지 language specification이 아닙니다. correctness는 JLS/API, lowering은 pinned javac, performance는 benchmark로 각각 검증합니다.",
      ],
      concepts: [
        { term: "diagnostic key", definition: "localized 문장 대신 compiler가 내는 stable category identifier입니다.", detail: ["outer/nested cause를 함께 봅니다.", "exit/source position도 기록합니다."] },
        { term: "negative compile fixture", definition: "의도적으로 type-invalid source를 compile해 금지된 경계를 검증하는 작은 파일입니다.", detail: ["product source와 분리합니다.", "성공하면 test failure입니다."] },
        { term: "operator invariant", definition: "많은 operands에서도 항상 만족해야 하는 quotient/remainder·range·call-count 같은 성질입니다.", detail: ["boundary와 generated inputs를 씁니다.", "overflow precondition을 명시합니다."] },
      ],
      codeExamples: [
        {
          id: "java-operator-compile-diagnostics",
          title: "chained comparison과 lossy byte sum을 safe temp에서 분류합니다",
          language: "powershell",
          filename: "verify-operator-diagnostics.ps1",
          purpose: "comparison/assignment compile failures를 locale-independent categories로 재현합니다.",
          code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$root = Join-Path $base ("java04-diagnostics-" + [Guid]::NewGuid().ToString("N"))
if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }
[IO.Directory]::CreateDirectory($root) | Out-Null
$utf8 = [Text.UTF8Encoding]::new($false)

try {
  $cases = [ordered]@{
    ChainedComparison = @'
class ChainedComparison {
    boolean test(int value) { return 0 < value < 10; }
}
'@
    ByteSum = @'
class ByteSum {
    byte sum(byte left, byte right) { return left + right; }
}
'@
  }

  foreach ($name in $cases.Keys) {
    $file = Join-Path $root "$name.java"
    [IO.File]::WriteAllText($file, $cases[$name], $utf8)
    $diagnostics = & javac -XDrawDiagnostics -d $root $file 2>&1
    $exit = $LASTEXITCODE
    $text = $diagnostics -join [Environment]::NewLine
    $category = if ($text -match 'compiler\.misc\.possible\.loss\.of\.precision') {
      "LOSS_OF_PRECISION"
    } elseif ($text -match 'compiler\.err\.operator\.cant\.be\.applied') {
      "BAD_OPERANDS"
    } else {
      "UNEXPECTED"
    }
    "$name-exit=$exit,category=$category"
  }
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  $boundary = $base.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
  if (-not $resolved.StartsWith($boundary, [StringComparison]::OrdinalIgnoreCase)) {
    throw "unsafe cleanup path"
  }
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}`,
          walkthrough: [
            { lines: "1-5", explanation: "GUID system-temp directory를 create-new 방식으로 만들고 BOM 없는 UTF-8 writer를 준비합니다." },
            { lines: "7-19", explanation: "chained relational과 promoted byte sum이라는 두 independent invalid sources를 만듭니다." },
            { lines: "21-36", explanation: "각 compile exit와 specific nested/outer diagnostic key를 stable category로 변환합니다." },
            { lines: "37-43", explanation: "canonical temp parent boundary를 확인한 directory만 recursive cleanup합니다." },
          ],
          run: { environment: ["PowerShell 7+", "Temurin/OpenJDK 21"], command: "pwsh -NoProfile -File verify-operator-diagnostics.ps1" },
          output: { value: "ChainedComparison-exit=1,category=BAD_OPERANDS\nByteSum-exit=1,category=LOSS_OF_PRECISION", explanation: ["두 fixtures 모두 nonzero compile exit입니다.", "generic found/required가 아니라 actual bad operands와 precision-loss cause를 구분합니다."] },
          experiments: [
            { change: "ByteSum return에 `(byte)` cast를 추가합니다.", prediction: "compile은 성공하지만 overflow/wrap 가능성이 생깁니다.", result: "compile eligibility와 domain safety를 분리합니다." },
            { change: "0<value<10을 0<value&&value<10으로 고칩니다.", prediction: "compile되고 boundary에 따라 boolean을 반환합니다.", result: "각 comparison result를 boolean operator로 연결합니다." },
            { change: "fixed `.verify` directory를 -Force로 재사용합니다.", prediction: "cleanup이 기존 사용자 파일을 지울 위험이 있습니다.", result: "unique temp와 parent-boundary validation을 유지합니다." },
          ],
          sourceRefs: ["jdk21-javac", "jls-numeric-promotion", "jls-relational", "jls-assignment"],
        },
      ],
      diagnostics: [
        { symptom: "negative compile test가 다른 type error인데도 통과합니다.", likelyCause: "generic `compiler.err.prob.found.req`만 match해 nested cause를 확인하지 않았습니다.", checks: ["-XDrawDiagnostics raw keys를 보존합니다.", "expected nested key를 확인합니다.", "exit와 source position도 비교합니다."], fix: "specific cause key와 nonzero exit를 함께 assertion합니다.", prevention: "한 fixture에 한 학습 오류를 두고 compiler update 때 golden diagnostic을 review합니다." },
      ],
      expertNotes: [
        "constant expression 9/4는 bytecode에서 iconst_2로 fold될 수 있으므로 idiv evidence가 필요하면 parameters를 사용합니다.",
        "operator property tests는 overflow·zero preconditions를 명시하지 않으면 mathematical identity 자체가 fixed-width wrap 때문에 실패할 수 있습니다.",
      ],
    },
  ],
  lab: {
    title: "합성 성적·리워드 record를 explicit operator policy로 계산합니다",
    scenario: "synthetic learner record의 세 과목 점수, bonus points, reward cents, feature flags를 받아 총점·평균·등급 범위·정산 금액·상태 flags를 계산하는 pure evaluator를 작성합니다.",
    setup: [
      "원본 Ex01·02·03·05·07 golden과 이 세션의 custom examples를 JDK 21 clean output에서 먼저 재현합니다.",
      "실사용 이름·계정·token 대신 learner-001 같은 synthetic identifier와 boundary scores만 사용합니다.",
      "Accepted 또는 Rejected(field,reason,bound) result를 만들고 raw input row 전체를 exception/log에 넣지 않습니다.",
      "score MIN/MAX±1, divisor ±3/0, NaN/Infinity/±0.0, integer overflow, shift -1/31/32 fixtures를 준비합니다.",
    ],
    steps: [
      "각 expression을 grouping→left-to-right evaluation→promotion→operation→assignment 표로 기록합니다.",
      "총점은 Math.addExact chain, count는 positive zero guard, 평균은 selected double 또는 BigDecimal policy로 계산합니다.",
      "음수 adjustment를 bucket에 넣을 때 /·%와 floorDiv/floorMod 중 domain pair를 선택하고 identity를 test합니다.",
      "10원/100원 미만 절삭은 positive/negative 방향과 RoundingMode를 명시하고 Ex03 결과와 비교합니다.",
      "평균 equality는 direct ==를 피하고 measurement tolerance 또는 decimal equality contract를 선택합니다.",
      "bonus index의 prefix/postfix mutation을 named statements로 풀고 한 expression의 multiple mutation을 제거합니다.",
      "score range·nullable guard는 &&/||로 작성하고 right-side call count가 short-circuit되는지 test합니다.",
      "feature flags는 named masks와 allowed-bits validation을 사용하고 unsigned byte ingress를 명시합니다.",
      "compound assignment를 사용한 모든 small primitive와 complex LHS를 찾아 implicit cast/evaluation-once를 review합니다.",
      "overflow·zero·non-finite·bad flag는 stable reason으로 거부하고 UI message와 internal diagnostic을 분리합니다.",
      "negative compile fixtures로 chained comparison과 lossy assignment 금지를 자동 검증합니다.",
      "generated inputs로 quotient/remainder identity, floor pair identity, no-silent-loss, short-circuit call-count properties를 검사합니다.",
    ],
    expectedResult: [
      "원본 five golden outputs와 blank lines가 변하지 않습니다.",
      "positive/negative division과 floor bucket 결과가 선택한 domain policy와 일치합니다.",
      "zero·MIN/-1·add/multiply overflow가 silent success가 아니라 분류된 rejection이 됩니다.",
      "floating/decimal equality와 rounding이 source representation·scale·tolerance 계약을 따릅니다.",
      "증감·short-circuit·compound LHS의 state transition과 evaluation count가 test로 고정됩니다.",
      "bitwise flags는 unknown bits와 signed/unsigned conversion을 명시적으로 처리합니다.",
      "diagnostics에는 field·reason·bound만 있고 raw record·secret·실사용 PII가 없습니다.",
    ],
    cleanup: ["compiler fixtures는 GUID system-temp 아래에서만 만들고 canonical parent boundary 확인 뒤 제거합니다.", "golden·logs에는 합성 identifier와 boundary values만 남기고 원본 five source는 변경하지 않습니다."],
    extensions: [
      "jqwik 같은 property framework로 operator invariants와 shrinking을 구현합니다.",
      "JMH로 branch order·BigDecimal cost를 측정하되 correctness policy를 먼저 고정합니다.",
      "database DECIMAL·integer flags와 Java value의 serialization round-trip을 추가합니다.",
      "concurrent bonus counter를 AtomicInteger와 synchronized design으로 비교합니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 원본의 모든 active operator expression을 five-stage trace로 재현하세요.", requirements: ["blank line 포함 golden을 맞춥니다.", "Ex01 2.0/2.25 원인을 구분합니다.", "Ex02/03 절삭이 rounding/floor가 아님을 설명합니다.", "Ex05 prefix/postfix value/state를 표로 씁니다.", "Ex07 short-circuit가 s4를 7로 보존하는 이유를 설명합니다."], hints: ["target type은 마지막에 보세요.", "commented assignment를 active state로 세지 마세요."], expectedOutcome: "원본 output을 주석 없이도 operand type과 evaluation order로 예측합니다.", solutionOutline: ["source line과 output을 대응합니다.", "expression value와 variable state를 별도 columns로 둡니다."] },
    { difficulty: "응용", prompt: "safe integer/decimal operator helper와 exhaustive boundary table을 구현하세요.", requirements: ["/·%와 floor pair를 ±operands에서 비교합니다.", "zero·MIN/-1·add/multiply overflow를 거부합니다.", "NaN/Infinity/±0.0과 tolerance를 분리합니다.", "BigDecimal scale/RoundingMode를 고정합니다.", "short-circuit call count와 compound assignment wrap을 test합니다."], hints: ["Math exact와 BigDecimal String ingress를 사용하세요.", "failure에 raw record를 담지 마세요."], expectedOutcome: "silent wrap·wrong rounding·unintended RHS evaluation 없이 stable results가 나옵니다.", solutionOutline: ["각 helper는 pure accepted/rejected result를 반환합니다.", "boundary table을 parameterized tests로 실행합니다."] },
    { difficulty: "설계", prompt: "operator-heavy legacy 정산식을 audit 가능한 rule engine으로 migration하세요.", requirements: ["precedence·mutation·conversion risk inventory를 만듭니다.", "integer/decimal/bit-flag representations를 선택합니다.", "overflow·zero·rounding·NaN taxonomy를 정의합니다.", "canary comparison과 rollback을 설계합니다.", "property tests·compile fixtures·telemetry privacy를 포함합니다."], hints: ["한 식을 계산·validation·state update로 나누세요.", "old/new 결과 차이를 reason별로 집계하세요."], expectedOutcome: "수학·representation·evaluation 정책이 코드와 운영 검증으로 연결된 migration plan이 완성됩니다.", solutionOutline: ["legacy golden을 먼저 고정합니다.", "pure operator kernel 뒤 adapter와 telemetry를 배치합니다."] },
  ],
  reviewQuestions: [
    { question: "double target이면 9/4가 2.25가 되나요?", answer: "아닙니다. int division 2가 먼저 만들어지고 2.0으로 widening됩니다. operand 하나를 division 전에 double로 바꿔야 합니다." },
    { question: "-7/3과 Math.floorDiv(-7,3)은 같은가요?", answer: "아닙니다. /는 toward zero라 -2, floorDiv는 negative infinity 방향이라 -3입니다." },
    { question: "Java %는 항상 nonnegative인가요?", answer: "아닙니다. integer remainder의 nonzero sign은 dividend를 따릅니다." },
    { question: "integer /0은 compile error인가요?", answer: "일반적으로 runtime ArithmeticException입니다. constant form은 warning이 날 수 있지만 expression context에 따라 compile될 수 있습니다." },
    { question: "double /0도 exception인가요?", answer: "아닙니다. signed Infinity 또는 NaN을 반환하므로 finite policy가 필요합니다." },
    { question: "Integer.MIN_VALUE/-1은 무엇인가요?", answer: "일반 /는 overflow해 Integer.MIN_VALUE를 반환하고 Math.divideExact는 ArithmeticException을 냅니다." },
    { question: "long target은 int multiplication overflow를 막나요?", answer: "아닙니다. operands가 int면 int operation 뒤 late widening됩니다." },
    { question: "0.1+0.2==0.3이 false인 이유는 무엇인가요?", answer: "decimal values가 binary64에 근사되고 그 representations를 연산·비교하기 때문입니다." },
    { question: "모든 floating 비교에 1e-9를 쓰면 되나요?", answer: "아닙니다. magnitude와 domain error budget에 맞춘 absolute/relative tolerance 및 non-finite 정책이 필요합니다." },
    { question: "postfix increment는 세미콜론에서 실행되나요?", answer: "아닙니다. update/store는 expression evaluation 중 일어나고 expression result만 이전 value입니다." },
    { question: "false && method()에서 method는 호출되나요?", answer: "아닙니다. &&는 left false에서 right를 평가하지 않습니다." },
    { question: "boolean &는 integer bitwise &와 같은가요?", answer: "기호는 같지만 boolean에서는 eager logical AND, integer에서는 promoted bits의 AND입니다." },
    { question: "1<<32가 왜 1인가요?", answer: "int shift distance는 low 5 bits만 써 32가 0으로 normalize되기 때문입니다." },
    { question: "0<score<100이 가능한가요?", answer: "아닙니다. 첫 result boolean을 100과 비교할 수 없어 `0<score && score<100`으로 씁니다." },
    { question: "NaN==NaN은 true인가요?", answer: "아닙니다. primitive ==는 false이고 !=는 true입니다. boxed Double.equals는 별도 계약입니다." },
    { question: "byte b=120; b+=10이 안전한가요?", answer: "compile되지만 implicit byte narrowing으로 -126이 되므로 range safety를 보장하지 않습니다." },
    { question: "array[index()] += x를 simple assignment로 그대로 펼쳐도 되나요?", answer: "일반적으로 아닙니다. compound LHS는 한 번만 평가하지만 naive expansion은 index()를 두 번 호출할 수 있습니다." },
    { question: "compiler human message 전체를 golden으로 비교해야 하나요?", answer: "locale/version drift가 있어 -XDrawDiagnostics의 specific key·exit·position을 normalize하는 편이 안정적입니다." },
  ],
  completionChecklist: [
    "inventory의 day03 Ex01·Ex02·Ex03·Ex05·Ex07을 모두 직접 읽고 사용했다.",
    "다섯 원본을 JDK 21.0.11 UTF-8·-Xlint:all clean compile/run했다.",
    "Ex05와 Ex07의 empty lines까지 golden output에 보존했다.",
    "홍길동/점수는 synthetic fixture임을 확인하고 실사용 PII·secret을 추가하지 않았다.",
    "grouping·evaluation·promotion·operation·assignment를 별도 단계로 추적했다.",
    "9/4의 2·2.0·2.25를 operand type으로 설명했다.",
    "negative /·%와 floorDiv/floorMod 네 sign 조합을 실행했다.",
    "integer/floating zero division·remainder failure를 구분했다.",
    "integer wrap과 MIN/-1 division overflow를 Math exact와 비교했다.",
    "intermediate overflow가 wide target으로 복구되지 않음을 검증했다.",
    "floating direct equality·tolerance·BigDecimal을 domain별로 구분했다.",
    "Ex02/03 절삭과 floor·rounding mode 차이를 설명했다.",
    "prefix/postfix expression value와 stored state를 분리했다.",
    "postfix가 세미콜론에서 증가한다는 원본 표현을 교정했다.",
    "NaN·signed zero·boxed/primitive·reference equality를 실행했다.",
    "&&·|| short-circuit와 boolean &·|·^ eager evaluation을 call count로 검증했다.",
    "integer bitwise·>>·>>>·shift-distance masking을 실행했다.",
    "signed byte를 unsigned int로 변환한 뒤 shift했다.",
    "compound assignment implicit cast와 LHS evaluation-once를 검증했다.",
    "chained comparison과 lossy byte sum을 specific compiler keys로 분류했다.",
    "safe GUID temp와 canonical parent-boundary cleanup을 사용했다.",
    "operator invariants와 generated/property test 확장 기준을 설계했다.",
    "모든 custom output을 JDK 21에서 exact하게 재검증했다.",
    "원본 밖 보강 범위를 source coverage에 명시했다.",
  ],
  nextSessions: ["java-05-scanner-if"],
  sources: [
    { id: "java-arithmetic-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day03/Ex01.java", usedFor: ["+ - * / %", "integer versus floating division", "late destination conversion", "formatted operator output"], evidence: "9와 4의 13/5/36/2/1, late 2.0과 early floating 2.25를 JDK 21에서 재현했습니다." },
    { id: "java-score-average-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day03/Ex02.java", usedFor: ["sum", "average", "positive truncation", "synthetic learner fixture"], evidence: "합계 250, 평균 83.33333333333333과 int cast 기반 83.33을 재현하고 rounding과 구분했습니다." },
    { id: "java-truncation-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day03/Ex03.java", usedFor: ["integer unit truncation", "operation order", "money-policy caveat"], evidence: "17896·178960·178900을 재현하고 10원/100원 미만 절삭과 negative toward-zero caveat로 교정했습니다." },
    { id: "java-increment-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day03/Ex05.java", usedFor: ["prefix", "postfix", "expression result", "final variable state"], evidence: "25·20·blank·5·5를 재현하고 postfix update가 세미콜론에서 일어난다는 주석을 JLS evaluation으로 교정했습니다." },
    { id: "java-logical-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day03/Ex07.java", usedFor: ["&& truth", "range comparison", "char comparison", "short-circuit side effect"], evidence: "true/false 범위 결과와 s1/s2=12, false branch의 s3=12/s4=7을 blank lines까지 재현했습니다." },
    { id: "jdk21-javac", repository: "Oracle Java SE 21 Tool Specifications", path: "javac command", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["UTF-8 Xlint compile", "XDrawDiagnostics", "negative fixtures"], evidence: "원본/custom compile과 locale-independent operator diagnostics의 tool 기준입니다." },
    { id: "jls-evaluation-order", repository: "Oracle Java Language Specification 21", path: "15.7 Evaluation Order", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.7", usedFor: ["left-to-right operands", "side effects", "parentheses and precedence"], evidence: "증감·논리·assignment evaluation trace의 language 기준입니다." },
    { id: "jls-numeric-promotion", repository: "Oracle Java Language Specification 21", path: "5.6 Numeric Contexts", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.6", usedFor: ["operation type", "small integral promotion", "mixed numeric operands"], evidence: "operand type가 division·bitwise·comparison result를 정하는 기준입니다." },
    { id: "jls-integer-values", repository: "Oracle Java Language Specification 21", path: "4.2.2 Integer Operations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.2.2", usedFor: ["fixed-width overflow", "two's complement", "silent wrap"], evidence: "default integer arithmetic와 Math exact policy를 구분하는 기준입니다." },
    { id: "jls-floating-values", repository: "Oracle Java Language Specification 21", path: "4.2.3 Floating-Point Types", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.2.3", usedFor: ["NaN", "Infinity", "signed zero", "binary precision"], evidence: "zero division과 floating equality matrix의 value-set 기준입니다." },
    { id: "jls-multiplicative", repository: "Oracle Java Language Specification 21", path: "15.17 Multiplicative Operators", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.17", usedFor: ["multiplication", "toward-zero division", "remainder identity", "zero failure"], evidence: "positive/negative /·%와 zero/overflow semantics의 공식 기준입니다." },
    { id: "jls-postfix-increment", repository: "Oracle Java Language Specification 21", path: "15.14.2 Postfix Increment", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.14.2", usedFor: ["old expression value", "increment store", "implicit narrowing"], evidence: "Ex05의 세미콜론 설명을 actual postfix contract로 교정했습니다." },
    { id: "jls-prefix-increment", repository: "Oracle Java Language Specification 21", path: "15.15.1 Prefix Increment", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.15.1", usedFor: ["new expression value", "increment store"], evidence: "prefix/postfix state matrix의 공식 기준입니다." },
    { id: "jls-shift", repository: "Oracle Java Language Specification 21", path: "15.19 Shift Operators", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.19", usedFor: [">>", ">>>", "distance masking", "unary promotion"], evidence: "int low-5/long low-6 distance와 signed/zero-fill output의 기준입니다." },
    { id: "jls-relational", repository: "Oracle Java Language Specification 21", path: "15.20.1 Numerical Comparison", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.20.1", usedFor: ["< <= > >=", "range expressions", "chained comparison failure", "NaN ordering"], evidence: "Ex07 ranges와 negative compile fixture의 language 기준입니다." },
    { id: "jls-equality", repository: "Oracle Java Language Specification 21", path: "15.21 Equality Operators", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.21", usedFor: ["numeric equality", "boolean equality", "reference identity", "NaN and zero"], evidence: "primitive·boxed/content comparison을 분리하는 기준입니다." },
    { id: "jls-bitwise-logical", repository: "Oracle Java Language Specification 21", path: "15.22 Bitwise and Logical Operators", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.22", usedFor: ["integer masks", "boolean eager & | ^", "complement"], evidence: "같은 기호의 boolean/integer context와 eager evaluation을 설명합니다." },
    { id: "jls-conditional-and", repository: "Oracle Java Language Specification 21", path: "15.23 Conditional-And", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.23", usedFor: ["&& short-circuit", "right operand skipping"], evidence: "Ex07 false-left assignment skip과 call-count example의 기준입니다." },
    { id: "jls-conditional-or", repository: "Oracle Java Language Specification 21", path: "15.24 Conditional-Or", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.24", usedFor: ["|| short-circuit", "right operand skipping"], evidence: "true-left OR와 eager | 비교의 기준입니다." },
    { id: "jls-assignment", repository: "Oracle Java Language Specification 21", path: "15.26 Assignment Operators", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.26", usedFor: ["simple assignment", "compound implicit cast", "LHS evaluation-once", "right grouping"], evidence: "byte +=와 index() call-count example의 공식 기준입니다." },
    { id: "java-math-operators-api", repository: "Oracle Java SE 21 API", path: "java.lang.Math exact/floor methods", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html#divideExact(int,int)", usedFor: ["floorDiv", "floorMod", "addExact", "multiplyExact", "divideExact", "tolerance helpers"], evidence: "negative quotient policy와 silent overflow rejection의 API 기준입니다." },
    { id: "java-double-api", repository: "Oracle Java SE 21 API", path: "java.lang.Double", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Double.html", usedFor: ["isFinite/isNaN", "boxed equals", "signed zero", "format"], evidence: "floating zero/equality validation과 wrapper contract를 보강합니다." },
    { id: "java-bigdecimal-api", repository: "Oracle Java SE 21 API", path: "java.math.BigDecimal", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html", usedFor: ["String construction", "scale", "rounding", "equals/compareTo"], evidence: "Ex02/03 decimal average·money rounding을 production policy로 확장합니다." },
  ],
  sourceCoverage: {
    filesRead: 5,
    filesUsed: 5,
    uncoveredNotes: [
      "inventory의 day03 Ex01·Ex02·Ex03·Ex05·Ex07을 모두 JDK 21.0.11로 UTF-8·-Xlint:all clean compile/run하고 blank lines까지 검증했습니다.",
      "Ex01의 positive arithmetic은 negative /·%·floorDiv/floorMod, zero, MIN/-1, intermediate overflow로 확장했습니다.",
      "Ex02의 홍길동/점수는 합성 학습 data이며 83.33 cast trick은 BigDecimal/tolerance/rounding policy와 구분했습니다.",
      "Ex03의 모호한 ‘0단위 절삭’은 10원/100원 미만과 negative toward-zero/floor 정책으로 교정했습니다.",
      "Ex05의 postfix 세미콜론 주석을 JLS load/store/result로 교정하고 multiple mutation·overflow·concurrency caveat를 추가했습니다.",
      "Ex07은 &&만 실행하므로 ||·!·boolean eager &/|/^, bitwise·shift, NaN/reference equality와 compound assignment는 원본 밖 공식 보강입니다.",
      "safe temp diagnostics·generated property invariants·BigDecimal·Math exact는 production failure를 다루기 위한 원본 밖 보강입니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
