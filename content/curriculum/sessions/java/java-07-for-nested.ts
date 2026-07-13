import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["java-07-for-nested"],
  slug: "java-07-for-nested",
  courseId: "java",
  moduleId: "java-language-control",
  order: 7,
  title: "for 반복·누산과 중첩 반복",
  subtitle: "초기화→조건→본문→갱신의 상태 전이를 추적하고 누산 invariant·경계·중첩 반복 횟수·출력 비용을 검증합니다.",
  level: "기초",
  estimatedMinutes: 420,
  coreQuestion: "반복문의 몇 번 실행될지와 매 회차 state가 어떻게 변하는지를 어떻게 증명하고, off-by-one·overflow·불필요한 중첩을 테스트로 막을까요?",
  summary: "javastudy day05 Ex07, day06 Ex01, day07 Example4 세 원본을 JDK 21.0.11로 clean compile·run했습니다. Ex07의 active code는 7! = 5040과 교대 부호 누산이 처음 100 이상이 되는 i=199를 출력하고, 많은 기초 for 예시는 주석 상태입니다. Ex01은 2~9단 세 출력 layout을 두 loop orientation으로 만들고 4×4 zero·identity pattern을 출력하며 Example4는 3~7단 45개 곱셈 행과 단 사이 빈 줄을 만듭니다. 이를 for lifecycle·scope·inclusive/exclusive bound·step direction·누산 invariant·factorial overflow·unbounded for와 break·중첩 Cartesian product·구구단 orientation·좌표 pattern·O(n)·O(nm)·출력 비용으로 확장합니다.",
  objectives: [
    "for의 초기화·조건·본문·갱신 순서를 회차 trace로 설명하고 scope를 구분할 수 있다.",
    "inclusive/exclusive bound와 step을 이용해 정확한 반복 횟수를 계산하고 off-by-one을 진단할 수 있다.",
    "합·곱·교대 부호 누산의 loop invariant와 overflow·종료 조건을 검증할 수 있다.",
    "중첩 for를 outer×inner의 Cartesian product로 해석해 실행 횟수와 output shape를 예측할 수 있다.",
    "구구단·격자·대각선 pattern을 row/column 좌표 predicate로 구현할 수 있다.",
    "계산 O(n)·O(nm)과 console I/O 비용을 분리하고 불필요한 중첩을 제거할 수 있다.",
  ],
  prerequisites: [{ title: "다중 분기와 switch 정책", reason: "반복 본문의 조건·continue·break와 누산 정책을 이해하려면 validation·branch·경계 개념이 필요합니다.", sessionSlug: "java-06-switch-multibranch" }],
  keywords: ["for", "initialization", "condition", "update", "scope", "off-by-one", "accumulator", "invariant", "factorial", "nested loop", "Cartesian product", "gugudan", "pattern", "complexity", "output cost"],
  chapters: [
    {
      id: "three-source-golden-audit",
      title: "세 원본의 active loop와 주석 예제를 분리해 출력 규모까지 고정합니다",
      lead: "긴 구구단 전체를 복제하는 대신 section·행 수·경계행을 exact summary로 검증합니다.",
      explanations: [
        "day05 Ex07의 0~20·5단·합계 예시는 모두 comment-only이고 active loop는 factorial과 종료점 탐색 두 개입니다.",
        "7부터 1까지 곱한 result는 5040이며 0을 포함하지 않아 곱이 0으로 사라지지 않습니다.",
        "교대 합은 odd를 더하고 even을 빼며 처음 100 이상인 odd 199에서 끝납니다. 무한 header와 break가 실제 종료 계약입니다.",
        "day06 Ex01은 102개 output lines를 만들고 2~9단×1~9, row-oriented table, column-oriented table, 4×4 patterns를 포함합니다.",
        "Example4는 3~7단의 5×9=45 multiplication lines와 단 사이 blank lines를 출력합니다.",
      ],
      concepts: [
        { term: "active loop", definition: "실제로 compile·execute되는 반복문입니다.", detail: ["comment-only와 분리합니다.", "stdout evidence가 있습니다."] },
        { term: "output shape", definition: "행 수·열 수·구분선·첫/마지막 값으로 본 출력 구조입니다.", detail: ["긴 출력 검증에 유용합니다.", "전체 문자열보다 안정적일 수 있습니다."] },
        { term: "normalized golden", definition: "결정적 핵심 값과 count를 정규화한 회귀 기준입니다.", detail: ["section marker를 포함합니다.", "원본 의미는 보존합니다."] },
      ],
      codeExamples: [
        {
          id: "java-original-for-output-audit",
          title: "세 main의 전체 실행을 count·boundary summary로 검증합니다",
          language: "powershell",
          filename: "verify-original-for.ps1",
          purpose: "원본을 변경하지 않고 짧은 deterministic evidence로 보존합니다.",
          code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("java07-original-" + [Guid]::NewGuid().ToString("N"))
if (Test-Path $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
try {
  $files = @(
    "src\com\ictedu\day05\Ex07.java",
    "src\com\ictedu\day06\Ex01.java",
    "src\com\ictedu\day07\Example4.java"
  )
  javac -encoding UTF-8 -Xlint:all -d $root $files
  if ($LASTEXITCODE -ne 0) { throw "compile failed" }
  $a = & java -cp $root com.ictedu.day05.Ex07
  $b = & java -cp $root com.ictedu.day06.Ex01
  $c = & java -cp $root com.ictedu.day07.Example4
  "Ex07=$($a -join '|')"
  "Ex01=lines:$($b.Count),first:$($b[0]),g1last:$($b[72]),last:$($b[-1])"
  "Example4=lines:$($c.Count),first:$($c[0]),last:$($c[-2]),finalBlank:$([string]::IsNullOrEmpty($c[-1]))"
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}`,
          walkthrough: [
            { lines: "1-4", explanation: "system temp 바로 아래 GUID root를 create-new로 만듭니다." },
            { lines: "6-14", explanation: "세 원본을 UTF-8·Xlint compile하고 세 main을 실행합니다." },
            { lines: "15-17", explanation: "짧은 출력은 전체를, 긴 출력은 count·first·section boundary·last로 정규화합니다." },
            { lines: "18-22", explanation: "resolved parent가 temp base인지 확인하고 생성 root만 제거합니다." },
          ],
          run: { environment: ["PowerShell 7+", "JDK 21", "javastudy MyJavaProject root"], command: "pwsh -NoProfile -File verify-original-for.ps1" },
          output: { value: "Ex07=7!의 합은? 5040|정답 : 199\nEx01=lines:102,first:구구단-1,g1last:9*9=81,last: 0 0 0 1\nExample4=lines:50,first:3X1=3,last:7X9=63,finalBlank:True", explanation: ["긴 output도 실제 전체 main을 실행한 뒤 요약합니다.", "Example4 마지막 blank line을 별도 boolean으로 보존합니다."] },
          experiments: [
            { change: "Example4 outer upper bound를 8로 바꿉니다.", prediction: "multiplication 9개와 blank 1개가 늘어 lines=60입니다.", result: "outer iteration 한 번의 output cost를 계산합니다." },
            { change: "Ex07 factorial 시작값 result를 0으로 바꿉니다.", prediction: "모든 곱 결과가 0입니다.", result: "곱셈 identity는 1입니다." },
            { change: "Ex01 diagonal predicate i==j를 제거합니다.", prediction: "마지막 pattern도 모두 0입니다.", result: "좌표 predicate가 shape를 결정합니다." },
          ],
          sourceRefs: ["java-day05-for", "java-day06-nested", "java-day07-example4", "jdk21-javac"],
        },
      ],
      diagnostics: [{ symptom: "원본에 짝수 합·5단 예제가 실행된다고 썼지만 stdout에 없다.", likelyCause: "comment-only blocks를 active evidence로 셌습니다.", checks: ["comment markers를 봅니다.", "main을 clean classes에서 실행합니다.", "stdout section을 대조합니다."], fix: "active factorial·termination과 comment-based reconstruction을 sourceCoverage에서 구분합니다.", prevention: "source audit에 active/commented state를 기록합니다." }],
    },
    {
      id: "for-lifecycle-scope-trace",
      title: "for는 초기화 한 번 뒤 조건→본문→갱신을 반복합니다",
      lead: "문법 순서와 실제 실행 순서를 회차별 state로 분리합니다.",
      explanations: [
        "초기화는 loop 진입 때 한 번, 조건은 첫 본문 전과 매 갱신 뒤 평가됩니다.",
        "조건 true면 본문, 그 뒤 갱신, 다시 조건입니다. condition-controlled loop의 정상 완료에서는 조건 false가 되는 순간 본문 없이 종료합니다. break·return·예외 같은 abrupt completion은 이 경로를 따르지 않습니다.",
        "for header에서 선언한 i는 loop body와 header 안에만 존재하고 loop 밖에서는 scope가 끝납니다.",
        "본문의 continue도 for에서는 갱신식으로 이동한 뒤 조건을 검사합니다. while continue와 차이는 다음 세션에서 중요합니다.",
        "초기화·조건·갱신을 생략할 수 있지만 종료 invariant가 숨기 쉬워 의도를 문서화합니다.",
      ],
      concepts: [
        { term: "loop lifecycle", definition: "initialization→condition→body→update→condition의 실행 순환입니다.", detail: ["초기화는 한 번입니다.", "정상 조건 완료는 false에서, abrupt completion은 break·return·예외 지점에서 끝납니다."] },
        { term: "iteration", definition: "조건 true 뒤 본문과 해당 갱신까지의 한 회차입니다.", detail: ["회차 전후 state를 적습니다.", "0회도 가능합니다."] },
        { term: "loop scope", definition: "header에서 선언한 변수의 유효 범위입니다.", detail: ["loop 밖에서 사용할 수 없습니다.", "겹치는 scope의 nested local에 같은 이름을 재선언하면 compile-time error입니다."] },
      ],
      codeExamples: [
        {
          id: "java-for-lifecycle-trace",
          title: "세 회차의 조건·본문·갱신 순서를 log로 출력합니다",
          language: "java",
          filename: "src/learning/java07/ForLifecycleLab.java",
          purpose: "header를 한 줄 암기하지 않고 actual control flow를 봅니다.",
          code: String.raw`package learning.java07;

public class ForLifecycleLab {
    private static boolean condition(int i) {
        System.out.println("condition=" + i);
        return i < 3;
    }
    private static int update(int i) {
        System.out.println("update=" + i + "->" + (i + 1));
        return i + 1;
    }
    public static void main(String[] args) {
        for (int i = 0; condition(i); i = update(i)) {
            System.out.println("body=" + i);
        }
        System.out.println("done");
    }
}`,
          walkthrough: [
            { lines: "4-11", explanation: "condition과 update가 호출될 때 state를 출력합니다." },
            { lines: "13-17", explanation: "i=0 초기화 뒤 0·1·2 본문, 각 갱신, 마지막 condition=3 false를 확인합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java07/ForLifecycleLab.java && java -cp build/classes learning.java07.ForLifecycleLab" },
          output: { value: "condition=0\nbody=0\nupdate=0->1\ncondition=1\nbody=1\nupdate=1->2\ncondition=2\nbody=2\nupdate=2->3\ncondition=3\ndone", explanation: ["condition은 iteration 수보다 한 번 더 평가됩니다.", "마지막 false에는 body/update가 없습니다."] },
          experiments: [
            { change: "condition을 i<=3으로 바꿉니다.", prediction: "body=3과 update=3->4가 한 회 더 실행됩니다.", result: "inclusive bound 차이를 봅니다." },
            { change: "초기값을 3으로 바꿉니다.", prediction: "condition=3 뒤 바로 done입니다.", result: "for도 0회 실행될 수 있습니다." },
            { change: "본문 첫 줄에 continue를 둡니다.", prediction: "update는 계속 실행됩니다.", result: "for continue target은 update입니다." },
          ],
          sourceRefs: ["java-day05-for", "jls-for"],
        },
      ],
      diagnostics: [{ symptom: "본문이 세 번인데 condition log는 네 번이다.", likelyCause: "마지막 false 평가를 iteration으로 세지 않았습니다.", checks: ["초기 condition을 포함합니다.", "각 body 뒤 update를 연결합니다.", "종료 false를 표시합니다."], fix: "condition evaluations와 body iterations를 별도 count로 기록합니다.", prevention: "0회·1회·n회 trace fixture를 둡니다." }],
    },
    {
      id: "bounds-step-iteration-count",
      title: "시작·끝·비교·step에서 반복 횟수를 먼저 계산합니다",
      lead: "코드를 실행하기 전에 count formula와 last value를 예측합니다.",
      explanations: [
        "i=start; i<end; i+=step의 양수 step 횟수는 domain과 나눗셈 올림을 고려해 계산합니다.",
        "0..9는 i<10으로 10회, 10..20 inclusive는 i<=20으로 11회입니다.",
        "step 2의 0..20 inclusive는 0부터 20까지 11개이고 홀수 1..19는 10개입니다.",
        "감소 loop는 조건 방향도 반대로 두어야 합니다. i--인데 i<end면 종료하지 않을 수 있습니다.",
        "int overflow로 update가 wrap하면 조건이 다시 true가 될 수 있으므로 큰 경계에서는 checked counter나 long을 검토합니다.",
      ],
      concepts: [
        { term: "inclusive bound", definition: "끝값 자체를 포함하는 <= 또는 >= 경계입니다.", detail: ["회차가 하나 늘 수 있습니다.", "overflow를 주의합니다."] },
        { term: "exclusive bound", definition: "끝값 직전에 멈추는 < 또는 > 경계입니다.", detail: ["length 순회에 적합합니다.", "0..length-1을 만듭니다."] },
        { term: "step direction", definition: "counter가 종료 경계 쪽으로 이동하는 증가·감소 방향입니다.", detail: ["조건과 일치해야 합니다.", "0 step은 진행하지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "java-loop-boundary-counts",
          title: "exclusive·inclusive·step·descending count를 비교합니다",
          language: "java",
          filename: "src/learning/java07/LoopBoundaryLab.java",
          purpose: "대표 header의 count와 마지막 값을 exact output으로 고정합니다.",
          code: String.raw`package learning.java07;

public class LoopBoundaryLab {
    static String trace(int start, int endInclusive, int step) {
        if (step <= 0) throw new IllegalArgumentException("NON_POSITIVE_STEP");
        StringBuilder out = new StringBuilder();
        for (int i = start; i <= endInclusive; i += step) {
            if (!out.isEmpty()) out.append(',');
            out.append(i);
        }
        return out.toString();
    }
    public static void main(String[] args) {
        int exclusive = 0;
        for (int i = 0; i < 10; i++) exclusive++;
        String evens = trace(0, 20, 2);
        int descending = 0;
        for (int i = 7; i > 0; i--) descending++;
        System.out.println("exclusive=" + exclusive);
        System.out.println("evens=" + evens + ",count=" + evens.split(",").length);
        System.out.println("descending=" + descending);
        try { trace(0, 20, 0); }
        catch (IllegalArgumentException error) { System.out.println("step0=" + error.getMessage()); }
    }
}`,
          walkthrough: [
            { lines: "4-12", explanation: "0·음수 step을 거부한 뒤 inclusive trace가 start에서 end까지 positive step으로 이동합니다." },
            { lines: "14-24", explanation: "exclusive 0..9, even 0..20, descending 7..1의 counts와 step 0 실패를 비교합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java07/LoopBoundaryLab.java && java -cp build/classes learning.java07.LoopBoundaryLab" },
          output: { value: "exclusive=10\nevens=0,2,4,6,8,10,12,14,16,18,20,count=11\ndescending=7\nstep0=NON_POSITIVE_STEP", explanation: ["<=20은 20을 포함합니다.", "factorial loop 7..1은 7회입니다.", "진행하지 않는 step은 loop 진입 전에 거부합니다."] },
          experiments: [
            { change: "trace condition을 i<endInclusive로 바꿉니다.", prediction: "20이 빠져 count=10입니다.", result: "parameter 이름과 bound semantics를 맞춥니다." },
            { change: "step을 3으로 바꿉니다.", prediction: "0,3,6,9,12,15,18입니다.", result: "끝에 정확히 닿지 않아도 조건 false에서 종료합니다." },
            { change: "trace에 step=-1을 넣습니다.", prediction: "NON_POSITIVE_STEP 예외입니다.", result: "이 helper는 증가 범위 전용임을 계약으로 고정합니다." },
            { change: "descending update를 i++로 바꿉니다.", prediction: "i>0이 계속 true이고 overflow 전까지 종료하지 않습니다.", result: "진행 방향을 review합니다." },
          ],
          sourceRefs: ["java-day05-for", "jls-for"],
        },
      ],
      diagnostics: [{ symptom: "10부터 20까지 출력했는데 10개라고 예상했다.", likelyCause: "양끝 포함 count에서 +1을 빠뜨렸습니다.", checks: ["첫·마지막 값을 적습니다.", "<=와 <를 구분합니다.", "실제 iteration count를 셉니다."], fix: "inclusive count와 expected sequence를 먼저 작성합니다.", prevention: "start=end·empty range·step이 끝을 건너뛰는 fixtures를 둡니다." }],
    },
    {
      id: "accumulator-invariant-sum-product",
      title: "누산기는 이전 prefix 결과와 현재 값을 결합하는 invariant를 유지합니다",
      lead: "합은 0, 곱은 1이라는 identity와 update 순서를 명시합니다.",
      explanations: [
        "sum accumulator는 k회 후 처리한 값들의 합, product는 곱이라는 invariant를 가집니다.",
        "identity를 잘못 고르면 모든 결과가 왜곡됩니다. 곱을 0으로 시작하면 이후 값과 무관하게 0입니다.",
        "7!은 1×2×...×7과 같고 원본은 7부터 1로 감소해도 교환법칙 때문에 5040입니다.",
        "factorial은 매우 빨리 커져 int에서 13!부터 overflow합니다. long도 21!에서 넘으므로 BigInteger나 multiplyExact를 선택합니다.",
        "누산 update를 조건 분기 안에 둘 때 skip된 값과 processed prefix를 설명할 수 있어야 합니다.",
      ],
      concepts: [
        { term: "accumulator", definition: "여러 iteration의 중간 결과를 다음 회차로 전달하는 변수입니다.", detail: ["identity로 초기화합니다.", "invariant를 가집니다."] },
        { term: "loop invariant", definition: "각 iteration 시작·끝마다 참인 state 관계입니다.", detail: ["정확성 증명에 씁니다.", "prefix result를 설명합니다."] },
        { term: "checked accumulation", definition: "각 update에서 overflow를 검사하고 명시적으로 실패하는 누산입니다.", detail: ["Math.*Exact를 씁니다.", "BigInteger 대안이 있습니다."] },
      ],
      codeExamples: [
        {
          id: "java-checked-accumulator",
          title: "7!·13! overflow와 BigInteger를 비교합니다",
          language: "java",
          filename: "src/learning/java07/AccumulatorLab.java",
          purpose: "identity·invariant·fixed-width failure를 실행합니다.",
          code: String.raw`package learning.java07;

import java.math.BigInteger;

public class AccumulatorLab {
    static int factorialInt(int n) {
        int product = 1;
        for (int i = 2; i <= n; i++) product = Math.multiplyExact(product, i);
        return product;
    }
    static BigInteger factorialBig(int n) {
        BigInteger product = BigInteger.ONE;
        for (int i = 2; i <= n; i++) product = product.multiply(BigInteger.valueOf(i));
        return product;
    }
    public static void main(String[] args) {
        System.out.println("7!=" + factorialInt(7));
        try { factorialInt(13); }
        catch (ArithmeticException error) { System.out.println("13!=ArithmeticException"); }
        System.out.println("13!big=" + factorialBig(13));
    }
}`,
          walkthrough: [
            { lines: "6-10", explanation: "int product를 multiplicative identity 1로 시작하고 매 update overflow를 검사합니다." },
            { lines: "11-15", explanation: "BigInteger는 arbitrary precision product를 새 immutable value로 누산합니다." },
            { lines: "17-22", explanation: "7! success, 13! checked failure와 exact big result를 비교합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java07/AccumulatorLab.java && java -cp build/classes learning.java07.AccumulatorLab" },
          output: { value: "7!=5040\n13!=ArithmeticException\n13!big=6227020800", explanation: ["원본 7!과 일치합니다.", "overflow를 silent wrap 대신 명시 failure/BigInteger로 바꿉니다."] },
          experiments: [
            { change: "product 초기값을 0으로 바꿉니다.", prediction: "7!=0입니다.", result: "곱셈 identity를 1로 유지합니다." },
            { change: "multiplyExact를 *로 바꿉니다.", prediction: "13!이 wrapped int value를 정상처럼 반환합니다.", result: "domain failure policy를 명시합니다." },
            { change: "n을 음수로 넣습니다.", prediction: "현재 loop는 1을 반환합니다.", result: "factorial domain n>=0 validation을 추가합니다." },
          ],
          sourceRefs: ["java-day05-for", "java-math-api", "java-biginteger-api"],
        },
      ],
      diagnostics: [{ symptom: "13!이 음수나 작은 양수로 나온다.", likelyCause: "int multiplication overflow를 검사하지 않았습니다.", checks: ["n과 target range를 봅니다.", "각 prefix product를 기록합니다.", "multiplyExact를 실행합니다."], fix: "허용 n을 제한하고 checked long 또는 BigInteger를 사용합니다.", prevention: "12/13·20/21 factorial boundaries를 test합니다." }],
    },
    {
      id: "alternating-sum-unbounded-for",
      title: "header가 비어 있는 for도 progress와 termination invariant가 있어야 합니다",
      lead: "원본 i=199 탐색을 수식·iteration bound·안전장으로 설명합니다.",
      explanations: [
        "`for(i=1;;i++)`의 condition 생략은 true와 같지만 body의 break가 종료를 제공합니다.",
        "odd i는 더하고 even i는 빼므로 두 항 pair의 합은 -1이고 odd step 직후 합은 증가합니다.",
        "i=2k-1 odd 직후 sum=k이므로 sum>=100의 첫 값은 k=100, i=199입니다.",
        "단순 simulation O(answer)도 작을 때 충분하지만 closed form이 있으면 종료·복잡도를 더 명확히 증명합니다.",
        "외부 입력 threshold에는 표현 가능한 최초 index 상한, overflow·unreachable condition·maximum iterations를 검증해 영구 loop를 막습니다.",
      ],
      concepts: [
        { term: "unbounded header", definition: "condition을 생략해 header 자체로는 종료 상한이 없는 for입니다.", detail: ["body break가 필요할 수 있습니다.", "무한을 의도할 수도 있습니다."] },
        { term: "progress invariant", definition: "매 회차 state가 종료 조건에 가까워지거나 명시적 한도를 소비한다는 성질입니다.", detail: ["무한 loop를 막습니다.", "overflow를 고려합니다."] },
        { term: "closed form", definition: "반복 simulation 없이 index와 결과 관계를 직접 계산하는 수식입니다.", detail: ["검증 oracle이 됩니다.", "domain proof가 필요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [{ symptom: "threshold 탐색이 끝나지 않거나 counter가 음수로 wrap한다.", likelyCause: "도달 불가능 threshold·overflow·최대 iteration 정책이 없습니다.", checks: ["progress 수식을 구합니다.", "counter/result range를 계산합니다.", "iteration cap을 확인합니다."], fix: "입력 상한·checked arithmetic·closed form 또는 explicit failure를 적용합니다.", prevention: "threshold 1/100/max와 unreachable fixture를 둡니다." }],
    },
    {
      id: "alternating-sum-search-proof",
      title: "교대 부호 탐색은 simulation과 closed form을 서로의 oracle로 사용합니다",
      lead: "원본의 i=199를 한 번 더 출력하는 데서 그치지 않고 왜 최초 해인지 검증합니다.",
      explanations: [
        "odd 2k-1을 더하고 바로 다음 even 2k를 빼면 한 쌍의 net change는 -1입니다. 따라서 합은 odd 직후 k, even 직후 -k입니다.",
        "threshold가 양수일 때 조건을 처음 만족할 수 있는 시점은 odd 직후뿐이고 k=threshold이므로 최초 index는 2×threshold-1입니다.",
        "simulation은 매 회차 실제 update 규칙을 검증하고 closed form은 answer·termination·iteration bound를 검증합니다. 둘의 결과가 다르면 구현이나 수식 중 하나가 틀렸습니다.",
        "threshold<=0이면 loop 시작 전 합 0이 이미 조건을 만족하는지, 반드시 항 하나를 처리한 뒤 판정할지 계약을 먼저 정해야 합니다.",
        "큰 threshold는 2×threshold-1 계산과 sum·index update에서 overflow할 수 있으므로 long exact arithmetic과 허용 범위를 사용합니다.",
      ],
      concepts: [
        { term: "simulation oracle", definition: "정의된 상태 전이를 그대로 실행해 수식 결과를 교차 검증하는 구현입니다.", detail: ["작은 입력에 명확합니다.", "독립 계산과 비교합니다."] },
        { term: "first-hit proof", definition: "어떤 index가 조건을 만족하며 그보다 앞선 모든 index는 만족하지 않음을 보이는 증명입니다.", detail: ["최솟값 계약에 필요합니다.", "parity를 활용합니다."] },
        { term: "iteration budget", definition: "탐색이 실행할 수 있는 최대 회차를 입력 계약에서 정한 상한입니다.", detail: ["영구 loop를 막습니다.", "실패 결과를 구분합니다."] },
      ],
      codeExamples: [
        {
          id: "java-alternating-first-hit",
          title: "simulation과 closed form이 최초 index 199에서 일치합니다",
          language: "java",
          filename: "src/learning/java07/AlternatingSearchLab.java",
          purpose: "원본의 무경계 for를 검증 가능한 함수와 수식으로 분리합니다.",
          code: String.raw`package learning.java07;

public class AlternatingSearchLab {
    record Hit(long index, long sum, long iterations) {}
    private static final long MAX_THRESHOLD = Long.MAX_VALUE / 2 + 1;

    static Hit simulate(long threshold, long maxIterations) {
        if (maxIterations < 0) throw new IllegalArgumentException("NEGATIVE_BUDGET");
        if (threshold <= 0) return new Hit(0, 0, 0);
        if (threshold > MAX_THRESHOLD) throw new IllegalArgumentException("THRESHOLD_TOO_LARGE");
        long sum = 0;
        long index = 1;
        long remaining = maxIterations;
        while (remaining > 0) {
            sum = Math.addExact(sum, index % 2 == 1 ? index : -index);
            remaining--;
            long iterations = maxIterations - remaining;
            if (sum >= threshold) return new Hit(index, sum, iterations);
            if (index == Long.MAX_VALUE) break;
            index++;
        }
        throw new IllegalStateException("NOT_FOUND_WITHIN_BUDGET");
    }
    static long formula(long threshold) {
        if (threshold <= 0) return 0;
        if (threshold > MAX_THRESHOLD) throw new IllegalArgumentException("THRESHOLD_TOO_LARGE");
        return Math.addExact(threshold, threshold - 1);
    }
    public static void main(String[] args) {
        Hit hit = simulate(100, 1_000);
        System.out.println("simulated=" + hit.index() + ",sum=" + hit.sum());
        System.out.println("formula=" + formula(100));
        System.out.println("iterations=" + hit.iterations());
    }
}`,
          walkthrough: [
            { lines: "4-5", explanation: "index·sum·실제 회차 result와 long에서 2t-1을 표현할 수 있는 최대 threshold를 정의합니다." },
            { lines: "7-24", explanation: "입력·budget을 검증하고 remaining을 감소시켜 Long.MAX_VALUE budget에서도 wrap 없이 종료 경계를 소비합니다." },
            { lines: "25-29", explanation: "t+(t-1) 형태로 최대 허용 threshold의 2t-1도 long 안에서 계산합니다." },
            { lines: "31-36", explanation: "원본 threshold 100에서 simulation·formula·iteration 수를 대조합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java07/AlternatingSearchLab.java && java -cp build/classes learning.java07.AlternatingSearchLab" },
          output: { value: "simulated=199,sum=100\nformula=199\niterations=199", explanation: ["199는 조건을 처음 만족한 index이자 실행 회차입니다.", "simulation과 독립 closed form이 일치합니다."] },
          experiments: [
            { change: "threshold를 1로 바꿉니다.", prediction: "index=1, sum=1, iterations=1입니다.", result: "최소 positive boundary를 검증합니다." },
            { change: "maxIterations를 198로 바꿉니다.", prediction: "NOT_FOUND_WITHIN_BUDGET입니다.", result: "silent infinite loop 대신 명시 실패합니다." },
            { change: "threshold를 Long.MAX_VALUE로 바꿉니다.", prediction: "THRESHOLD_TOO_LARGE 예외입니다.", result: "최초 index 2t-1을 long으로 표현할 수 없는 domain을 진입 전에 거부합니다." },
          ],
          sourceRefs: ["java-day05-for", "jls-for", "jls-break", "java-math-api"],
        },
      ],
      diagnostics: [{ symptom: "simulation은 199인데 수식이 200을 반환한다.", likelyCause: "odd index 2k-1과 k번째 양의 peak를 혼동했습니다.", checks: ["1,-1,2,-2,3 prefix를 직접 적습니다.", "odd/even 직후 합을 분리합니다.", "threshold 1 fixture를 실행합니다."], fix: "positive threshold 첫 hit를 i=2t-1로 정의하고 simulation과 property test로 교차 검증합니다.", prevention: "threshold 1·2·100과 budget-1 경계를 자동화합니다." }],
    },
    {
      id: "nested-cartesian-count",
      title: "중첩 for는 outer 값마다 inner domain 전체를 순회하는 Cartesian product입니다",
      lead: "indentation보다 좌표 쌍과 곱셈법칙으로 실행 횟수를 예측합니다.",
      explanations: [
        "outer가 n회이고 각 outer에서 inner가 m회면 body는 n×m회 실행됩니다. inner 초기화는 outer 회차마다 다시 일어납니다.",
        "(row,column) 좌표는 두 domain의 Cartesian product이며 순서는 outer-major입니다. row=0의 모든 column 뒤 row=1로 이동합니다.",
        "inner bound가 outer 값에 의존하면 삼각형 iteration space가 되어 단순 n×m가 아닙니다. i행에서 i+1회라면 총합 공식을 사용합니다.",
        "Java는 outer local의 scope가 겹치는 nested local에 같은 이름을 재선언하는 것을 compile-time error로 거부합니다. 허용되는 field/local shadowing과 혼동하지 말고 row·column처럼 역할 이름을 씁니다.",
        "break는 기본적으로 가장 안쪽 loop만 끝내며 전체 탐색 종료에는 flag·method return·labeled break 중 의도가 가장 명확한 방식을 고릅니다.",
      ],
      concepts: [
        { term: "Cartesian product", definition: "outer domain의 각 원소와 inner domain의 각 원소를 모두 조합한 좌표 집합입니다.", detail: ["크기는 n×m입니다.", "출력 shape를 설명합니다."] },
        { term: "iteration space", definition: "중첩 반복 body가 방문하는 모든 counter 조합의 영역입니다.", detail: ["직사각형·삼각형일 수 있습니다.", "복잡도 계산의 근거입니다."] },
        { term: "outer-major order", definition: "한 outer 값에 대한 inner 전체를 처리한 뒤 다음 outer로 가는 순서입니다.", detail: ["행 우선 출력과 같습니다.", "순서가 요구사항인지 확인합니다."] },
      ],
      codeExamples: [
        {
          id: "java-nested-cartesian-trace",
          title: "2×3 좌표의 count·first·last를 검증합니다",
          language: "java",
          filename: "src/learning/java07/NestedCountLab.java",
          purpose: "중첩 loop의 실행 순서와 곱셈법칙을 짧은 golden으로 고정합니다.",
          code: String.raw`package learning.java07;

public class NestedCountLab {
    public static void main(String[] args) {
        int outer = 2, inner = 3, count = 0;
        String first = "", last = "";
        for (int row = 0; row < outer; row++) {
            for (int column = 0; column < inner; column++) {
                String coordinate = row + "," + column;
                if (count == 0) first = coordinate;
                last = coordinate;
                count++;
            }
        }
        System.out.println("pairs=" + count);
        System.out.println("first=" + first);
        System.out.println("last=" + last);
        System.out.println("outer=" + outer + ",inner=" + inner + ",total=" + outer * inner);
    }
}`,
          walkthrough: [
            { lines: "5-6", explanation: "domain 크기와 관측할 count·boundary state를 준비합니다." },
            { lines: "7-14", explanation: "row마다 column 0..2 전체를 방문해 outer-major 좌표를 만듭니다." },
            { lines: "15-18", explanation: "observed count를 predicted multiplication과 함께 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java07/NestedCountLab.java && java -cp build/classes learning.java07.NestedCountLab" },
          output: { value: "pairs=6\nfirst=0,0\nlast=1,2\nouter=2,inner=3,total=6", explanation: ["좌표 방문은 6회입니다.", "outer-major 순서의 경계 좌표는 0,0과 1,2입니다."] },
          experiments: [
            { change: "inner condition을 column<=inner로 바꿉니다.", prediction: "각 행 4회, total 8회이며 last=1,3입니다.", result: "inner off-by-one이 outer 횟수만큼 증폭됩니다." },
            { change: "inner bound를 column<=row로 바꿉니다.", prediction: "좌표는 0,0·1,0·1,1로 3개입니다.", result: "삼각 iteration space를 봅니다." },
            { change: "inner body에서 column==1일 때 break합니다.", prediction: "각 outer에서 2개씩 총 4개입니다.", result: "break가 inner loop만 끝냅니다." },
          ],
          sourceRefs: ["java-day06-nested", "jls-for", "jls-break", "jls-scope"],
        },
      ],
      diagnostics: [{ symptom: "outer 8회·inner 9회 구구단을 17회라고 계산했다.", likelyCause: "연속 단계처럼 더하고 중첩 조합을 곱하지 않았습니다.", checks: ["한 outer에서 inner가 몇 번 도는지 셉니다.", "좌표 표를 그립니다.", "body counter를 삽입합니다."], fix: "독립 고정 bound면 outer×inner로 계산하고 의존 bound면 회차별 inner count를 합산합니다.", prevention: "예상 body count와 실제 counter를 test assertion으로 비교합니다." }],
    },
    {
      id: "gugudan-orientations-output-cost",
      title: "같은 구구단 데이터도 loop orientation에 따라 행·열·읽기 순서가 달라집니다",
      lead: "계산 domain과 presentation layout을 분리해 세 원본 출력 방식을 설명합니다.",
      explanations: [
        "단을 outer에 두면 한 단의 1~9식을 세로로 연속 출력하고, multiplier를 outer에 두면 같은 multiplier의 여러 단을 한 행에 배치하기 쉽습니다.",
        "day06 Ex01의 구구단-1과 -2는 dan outer·multiplier inner가 같고 println 위치만 달라 grouping이 바뀝니다. 구구단-3만 multiplier outer·dan inner로 바꾸므로 세 layout에는 두 loop orientation이 있습니다.",
        "day07 Example4는 3~7단만 선택해 45 multiplication lines를 만들고 각 단 뒤 blank line을 둡니다. separator도 출력 계약의 일부입니다.",
        "반복 안에서 println을 매번 호출하면 계산보다 console synchronization·encoding 비용이 지배할 수 있습니다. 작은 예제는 명료하지만 큰 출력은 buffer 후 한 번에 씁니다.",
        "표 형식은 값 길이가 달라질 때 tab 정렬이 깨질 수 있으므로 실제 UI·파일에는 formatter와 column width 또는 구조화 데이터가 적합합니다.",
      ],
      concepts: [
        { term: "loop orientation", definition: "어떤 dimension을 outer와 inner에 배치할지 정한 순회 방향입니다.", detail: ["값 집합은 같을 수 있습니다.", "출력 순서가 달라집니다."] },
        { term: "presentation separator", definition: "행 끝·단 사이 빈 줄·tab처럼 데이터 그룹 경계를 표현하는 출력입니다.", detail: ["golden에 포함합니다.", "마지막 separator 정책을 정합니다."] },
        { term: "buffered output", definition: "여러 조각을 메모리 buffer에 모은 뒤 적은 횟수로 출력하는 방식입니다.", detail: ["I/O 호출을 줄입니다.", "메모리 상한을 고려합니다."] },
      ],
      codeExamples: [
        {
          id: "java-gugudan-orientation",
          title: "3~4단×1~3의 세로형과 행형 shape를 비교합니다",
          language: "java",
          filename: "src/learning/java07/GugudanShapeLab.java",
          purpose: "작은 domain으로 값 수와 line orientation을 exact하게 확인합니다.",
          code: String.raw`package learning.java07;

public class GugudanShapeLab {
    public static void main(String[] args) {
        StringBuilder vertical = new StringBuilder();
        int verticalLines = 0;
        for (int dan = 3; dan <= 4; dan++) {
            for (int n = 1; n <= 3; n++) {
                if (!vertical.isEmpty()) vertical.append('|');
                vertical.append(dan).append('*').append(n).append('=').append(dan * n);
                verticalLines++;
            }
        }
        System.out.println("vertical-lines=" + verticalLines + ",values=" + vertical);
        for (int n = 1; n <= 3; n++) {
            StringBuilder row = new StringBuilder();
            for (int dan = 3; dan <= 4; dan++) {
                if (!row.isEmpty()) row.append('|');
                row.append(dan).append('*').append(n).append('=').append(dan * n);
            }
            System.out.println("row" + n + "=" + row);
        }
    }
}`,
          walkthrough: [
            { lines: "5-13", explanation: "dan outer는 3단 세 식 뒤 4단 세 식 순서로 한 buffer에 넣습니다." },
            { lines: "14-21", explanation: "n outer는 같은 multiplier의 두 단을 한 row로 묶습니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java07/GugudanShapeLab.java && java -cp build/classes learning.java07.GugudanShapeLab" },
          output: { value: "vertical-lines=6,values=3*1=3|3*2=6|3*3=9|4*1=4|4*2=8|4*3=12\nrow1=3*1=3|4*1=4\nrow2=3*2=6|4*2=8\nrow3=3*3=9|4*3=12", explanation: ["두 방식 모두 곱셈 값 6개를 생성합니다.", "outer dimension이 grouping과 행 수를 결정합니다."] },
          experiments: [
            { change: "dan upper bound를 9로 바꿉니다.", prediction: "vertical values는 21개, row마다 7 columns입니다.", result: "domain 확장이 shape에 미치는 영향을 계산합니다." },
            { change: "vertical inner를 n<3으로 바꿉니다.", prediction: "각 단의 *3이 빠져 4개입니다.", result: "inner 경계 오류가 모든 단에 반복됩니다." },
            { change: "row buffer를 outer loop 밖으로 옮깁니다.", prediction: "이전 행 값이 누적됩니다.", result: "group별 accumulator reset 위치를 확인합니다." },
          ],
          sourceRefs: ["java-day06-nested", "java-day07-example4", "jls-for"],
        },
      ],
      diagnostics: [{ symptom: "가로 구구단에서 다음 행에 이전 행 값까지 누적된다.", likelyCause: "row buffer를 outer iteration마다 초기화하지 않았습니다.", checks: ["buffer 선언 scope를 봅니다.", "newline·clear 위치를 확인합니다.", "row별 column count를 셉니다."], fix: "group accumulator를 outer body 안에서 생성하거나 setLength(0)으로 명시 reset합니다.", prevention: "각 행의 exact column count와 first/last cell을 test합니다." }],
    },
    {
      id: "coordinate-patterns",
      title: "격자 pattern은 row·column predicate를 값으로 렌더링합니다",
      lead: "중첩 loop를 그림 암기가 아니라 좌표 관계식으로 바꿉니다.",
      explanations: [
        "4×4 zero grid는 모든 좌표에 0을, identity pattern은 row==column인 네 좌표에만 1을 둡니다.",
        "반대 대각선은 row+column==size-1, 위 삼각형은 column>=row처럼 predicate 하나로 설명할 수 있습니다.",
        "shape 생성은 domain 순회·cell predicate·row serialization 세 책임으로 나누면 다른 패턴으로 확장하기 쉽습니다.",
        "size가 0이면 빈 grid인지 invalid인지, 음수면 어떤 오류인지 계약을 정합니다. 예제에서는 음수를 거부하고 0은 빈 결과로 둘 수 있습니다.",
        "terminal의 공백과 proportional font는 모양을 왜곡할 수 있어 학습 테스트는 visual screenshot보다 normalized row strings와 one-count를 사용합니다.",
      ],
      concepts: [
        { term: "coordinate predicate", definition: "row·column·size 관계로 한 cell의 값을 결정하는 boolean 식입니다.", detail: ["패턴을 수학적으로 설명합니다.", "독립 test가 가능합니다."] },
        { term: "identity pattern", definition: "정사각 grid에서 row==column 위치만 1인 주대각선 패턴입니다.", detail: ["1의 개수는 size입니다.", "identity matrix와 연결됩니다."] },
        { term: "normalized rows", definition: "공백·색상 대신 각 행의 cell 값을 고정 문자열로 직렬화한 검증 표현입니다.", detail: ["환경 차이를 줄입니다.", "행 경계를 보존합니다."] },
      ],
      codeExamples: [
        {
          id: "java-coordinate-patterns",
          title: "4×4 주대각선·반대 대각선을 predicate로 생성합니다",
          language: "java",
          filename: "src/learning/java07/PatternLab.java",
          purpose: "원본 주대각선을 재현하고 대칭 predicate로 확장합니다.",
          code: String.raw`package learning.java07;

import java.util.function.BiPredicate;

public class PatternLab {
    static String render(int size, BiPredicate<Integer, Integer> oneAt) {
        if (size < 0) throw new IllegalArgumentException("NEGATIVE_SIZE");
        StringBuilder grid = new StringBuilder();
        for (int row = 0; row < size; row++) {
            if (!grid.isEmpty()) grid.append('/');
            for (int column = 0; column < size; column++)
                grid.append(oneAt.test(row, column) ? '1' : '0');
        }
        return grid.toString();
    }
    public static void main(String[] args) {
        int size = 4;
        String identity = render(size, (row, column) -> row == column);
        String anti = render(size, (row, column) -> row + column == size - 1);
        System.out.println("identity=" + identity);
        System.out.println("anti=" + anti);
        System.out.println("cells=" + size * size + ",ones=" + identity.chars().filter(c -> c == '1').count());
    }
}`,
          walkthrough: [
            { lines: "6-15", explanation: "size² 좌표를 방문하고 predicate true를 1, false를 0으로 직렬화합니다." },
            { lines: "17-23", explanation: "주대각선·반대 대각선 관계식과 cell/one counts를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java07/PatternLab.java && java -cp build/classes learning.java07.PatternLab" },
          output: { value: "identity=1000/0100/0010/0001\nanti=0001/0010/0100/1000\ncells=16,ones=4", explanation: ["slash는 row boundary입니다.", "4×4 grid는 16 cells, 주대각선 1은 4개입니다."] },
          experiments: [
            { change: "predicate를 column>=row로 바꿉니다.", prediction: "upper triangle의 1은 4+3+2+1=10개입니다.", result: "의존 inner 영역과 삼각수를 연결합니다." },
            { change: "size를 1로 바꿉니다.", prediction: "identity=1, anti=1, cells=1, ones=1입니다.", result: "최소 non-empty boundary를 검증합니다." },
            { change: "size를 -1로 바꿉니다.", prediction: "NEGATIVE_SIZE 예외입니다.", result: "invalid domain을 빈 출력으로 숨기지 않습니다." },
          ],
          sourceRefs: ["java-day06-nested", "jls-for"],
        },
      ],
      diagnostics: [{ symptom: "반대 대각선의 1이 한 칸씩 밀린다.", likelyCause: "0-based 좌표에서 row+column==size를 사용했습니다.", checks: ["좌상단을 0,0으로 둡니다.", "양 끝 좌표 0,size-1과 size-1,0을 대입합니다.", "1 count를 셉니다."], fix: "0-based 정사각 grid의 반대 대각선을 row+column==size-1로 정의합니다.", prevention: "size 1·2·4 normalized rows를 golden으로 둡니다." }],
    },
    {
      id: "complexity-refactor-tests",
      title: "반복 복잡도·출력 비용·중복 계산을 분리해 production loop로 다듬습니다",
      lead: "작동하는 중첩 loop를 관측 가능하고 경계가 증명된 코드로 완성합니다.",
      explanations: [
        "단일 독립 loop는 O(n), 직사각형 중첩은 O(nm), 같은 n 두 겹은 O(n²)입니다. 상수 크기 4×4도 개념상 16회지만 고정 입력에서는 상수 시간입니다.",
        "console 출력이 body마다 있으면 wall time은 산술 복잡도보다 I/O 호출 수에 크게 좌우됩니다. benchmark에서는 계산과 rendering을 분리합니다.",
        "loop invariant 밖에서 계산할 수 있는 값은 hoist하고, 같은 문자열·size-1·domain lookup을 회차마다 불필요하게 만들지 않습니다. 다만 가독성과 JIT 최적화를 근거 없이 희생하지 않습니다.",
        "테스트는 empty·single·inclusive end·step·descending·overflow·budget failure와 nested count·shape boundary를 cover합니다.",
        "성능을 위해 stream이나 병렬화를 먼저 쓰기보다 요구 순서·side effect·작은 데이터 비용을 측정합니다. 구구단처럼 순서가 핵심인 출력은 deterministic sequential loop가 적합합니다.",
      ],
      concepts: [
        { term: "time complexity", definition: "입력 크기가 커질 때 실행 작업 수가 증가하는 차수를 표현합니다.", detail: ["I/O 상수도 관찰합니다.", "iteration space로 계산합니다."] },
        { term: "loop invariant code motion", definition: "회차마다 변하지 않는 계산을 반복문 밖으로 이동하는 최적화입니다.", detail: ["semantic equivalence가 필요합니다.", "측정 후 적용합니다."] },
        { term: "boundary matrix", definition: "0회·1회·끝 포함·overflow처럼 반복 제어의 취약 경계를 표로 만든 테스트 집합입니다.", detail: ["off-by-one을 막습니다.", "정상·실패를 함께 둡니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "작은 계산인데 출력 프로그램이 매우 느리다.", likelyCause: "중첩 body마다 println/format을 호출해 console I/O가 지배합니다.", checks: ["body count와 print count를 셉니다.", "출력을 버린 계산 시간을 비교합니다.", "buffer size를 측정합니다."], fix: "계산 결과를 bounded buffer나 구조화 collection으로 만든 뒤 필요한 횟수만 출력합니다.", prevention: "compute와 render 함수를 분리하고 output volume limit를 둡니다." },
        { symptom: "리팩터링 후 값은 맞지만 행 순서가 바뀌었다.", likelyCause: "outer/inner를 교환하면서 presentation contract를 누락했습니다.", checks: ["좌표 방문 순서를 비교합니다.", "first/last cell을 봅니다.", "row golden을 대조합니다."], fix: "요구 orientation을 명시하고 값 집합뿐 아니라 order·separator를 test합니다.", prevention: "shape count와 ordered normalized output을 함께 고정합니다." },
      ],
      comparisons: [{ title: "반복 결과를 표현하는 세 방식", options: [
        { name: "직접 println", chooseWhen: "작은 학습 trace와 즉시 관찰이 목적일 때", avoidWhen: "대량 출력·성능 측정·재사용 데이터가 필요할 때", tradeoffs: ["가장 단순합니다.", "I/O 호출과 테스트 capture 비용이 큽니다."] },
        { name: "StringBuilder buffer", chooseWhen: "bounded text를 순서대로 한 번 출력할 때", avoidWhen: "결과가 메모리보다 크거나 구조화 후처리가 필요할 때", tradeoffs: ["호출 수를 줄입니다.", "최대 크기를 관리해야 합니다."] },
        { name: "구조화 collection", chooseWhen: "정렬·필터·UI·파일 등 여러 consumer가 있을 때", avoidWhen: "한 번 버릴 초소형 trace일 때", tradeoffs: ["계산과 표현이 분리됩니다.", "객체·메모리 비용이 추가됩니다."] },
      ] }],
      expertNotes: ["Big-O는 output 자체의 크기보다 작을 수 없습니다. n×m cells를 모두 보여줘야 하면 rendering도 Ω(nm)입니다.", "JIT가 수행할 미세 최적화를 추측하기보다 JMH 같은 올바른 harness로 측정하고 외부 I/O를 benchmark에서 격리합니다."],
    },
  ],
  lab: {
    title: "검증 가능한 구구단·격자 반복 엔진",
    scenario: "단 범위·곱 범위·orientation과 pattern size를 입력받아 계산 결과와 shape summary를 만들고, 경계·overflow·출력량을 검증하는 학습용 CLI core를 설계합니다.",
    setup: ["JDK 21과 UTF-8 source를 준비합니다.", "domain record, compute service, text renderer, CLI adapter를 별도 class로 둡니다.", "stdout golden과 순수 함수 assertions를 분리합니다."],
    steps: [
      "Range(start,endInclusive,step)가 step 0·잘못된 방향·예상 count overflow를 거부하도록 구현합니다.",
      "MultiplicationCell(dan,multiplier,value) 목록을 outer orientation별로 생성하되 Math.multiplyExact로 계산합니다.",
      "VERTICAL과 ROW_TABLE renderer가 같은 cells를 다른 ordered rows로 표현하도록 구현합니다.",
      "Pattern renderer가 identity·anti-diagonal·upper-triangle predicate를 받아 normalized rows를 만듭니다.",
      "예상 iteration count와 실제 생성 cell count를 비교하고 최대 10,000 cells를 넘으면 출력 전 거부합니다.",
      "3~7단×1~9는 45 cells, 4×4 identity는 16 cells·ones 4라는 regression을 추가합니다.",
      "empty·single·descending·invalid step·overflow·output budget cases를 실행합니다.",
      "원본 Example4와 Ex01의 section boundary를 compatibility fixture로 비교합니다.",
    ],
    expectedResult: ["계산 cell 집합과 presentation orientation이 분리됩니다.", "모든 loop의 종료 방향·회차·출력량을 실행 전에 설명할 수 있습니다.", "원본 핵심 값과 행 수가 golden에서 유지됩니다.", "invalid·overflow·budget failure가 명시적 결과로 구분됩니다."],
    cleanup: ["임시 classes는 system temp 바로 아래 GUID root에서만 생성하고 resolved parent 확인 후 제거합니다.", "원본 javastudy source는 변경하지 않습니다."],
    extensions: ["Markdown table renderer를 추가합니다.", "range별 property-based count test를 만듭니다.", "stdout 대신 JSON cells를 반환하는 adapter를 추가합니다.", "JMH로 direct println을 제외한 compute/render를 따로 측정합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "1부터 20까지 짝수와 합계를 출력하는 for를 작성하고 반복 횟수를 먼저 예측하세요.", requirements: ["exclusive 또는 inclusive bound를 이름으로 설명합니다.", "count=10과 sum=110을 assertion합니다.", "0·2 start 변형을 비교합니다."], hints: ["i+=2를 사용합니다.", "sum identity는 0입니다."], expectedOutcome: "sequence·count·sum이 예측과 일치합니다.", solutionOutline: ["start=2,end=20,step=2를 정의합니다.", "count와 sum을 같은 loop에서 누산합니다.", "last value와 exact output을 검증합니다."] },
    { difficulty: "응용", prompt: "1부터 n까지 3의 배수는 더하고 나머지는 빼는 최초 threshold 탐색기를 작성하세요.", requirements: ["입력 domain과 iteration budget을 둡니다.", "checked arithmetic을 사용합니다.", "작은 n trace로 first-hit를 증명합니다.", "not-found를 정상 result와 구분합니다."], hints: ["회차별 prefix sum 표를 먼저 만듭니다.", "closed form이 어렵다면 safe upper bound와 simulation을 사용합니다."], expectedOutcome: "종료 가능성과 최초 해를 설명하는 탐색 함수가 완성됩니다.", solutionOutline: ["result record에 index·sum·iterations·status를 둡니다.", "각 update 후 threshold를 검사합니다.", "budget boundary와 overflow tests를 추가합니다."] },
    { difficulty: "설계", prompt: "구구단·좌표 pattern을 공통 iteration domain과 renderer로 제공하는 라이브러리를 설계하세요.", requirements: ["계산과 presentation을 분리합니다.", "orientation·separator·empty policy를 문서화합니다.", "cell/output budget을 둡니다.", "원본 세 main compatibility fixtures를 포함합니다.", "복잡도와 memory trade-off를 기록합니다."], hints: ["Cell generator와 Renderer interface를 나눕니다.", "normalized rows를 test oracle로 사용합니다."], expectedOutcome: "새 pattern·renderer를 기존 계산 변경 없이 추가할 수 있고 회귀가 자동 검증됩니다.", solutionOutline: ["Range·Coordinate·Cell types를 정의합니다.", "순수 generator와 bounded render adapters를 구현합니다.", "count·order·first/last·separator matrix를 test합니다."] },
  ],
  reviewQuestions: [
    { question: "for의 실제 실행 순서는 무엇인가요?", answer: "초기화 한 번 뒤 조건→본문→갱신을 반복합니다. condition-controlled 정상 완료는 마지막 false에서 끝나고 break·return·예외는 그 전에 abrupt하게 끝낼 수 있습니다." },
    { question: "본문 n회일 때 조건은 항상 몇 회 평가되나요?", answer: "정상 종료 기준으로 n+1회이며 마지막 평가는 false입니다. break·exception이면 달라질 수 있습니다." },
    { question: "0부터 length-1 순회에 i<length가 적합한 이유는 무엇인가요?", answer: "끝값 length를 제외해 유효 index 개수와 정확히 같은 length회가 됩니다." },
    { question: "곱 누산기를 1로 시작하는 이유는 무엇인가요?", answer: "1이 곱셈 identity라서 첫 값과 이후 product를 바꾸지 않기 때문입니다." },
    { question: "int factorial은 어디서 처음 overflow하나요?", answer: "12!은 int 범위지만 13!은 넘으므로 checked int 계산에서 13부터 실패합니다." },
    { question: "원본 교대 합이 i=199에서 처음 100이 되는 이유는 무엇인가요?", answer: "odd i=2k-1 직후 합이 k이므로 k=100의 최초 odd index가 199입니다." },
    { question: "condition이 없는 for를 안전하게 만들려면 무엇이 필요한가요?", answer: "progress invariant, 도달 가능한 break, arithmetic range, iteration budget과 failure policy가 필요합니다." },
    { question: "2×3 중첩 loop body는 왜 6회인가요?", answer: "각 outer 2개 값마다 inner 3개 전체를 방문하는 Cartesian product이기 때문입니다." },
    { question: "중첩 inner bound가 outer에 의존하면 어떻게 count하나요?", answer: "각 outer 회차의 inner 횟수를 계산해 합산하며 삼각수 같은 공식을 사용할 수 있습니다." },
    { question: "구구단의 outer/inner를 바꾸면 무엇이 달라지나요?", answer: "곱셈 값 집합은 같을 수 있지만 방문 순서·행 grouping·separator와 output shape가 달라집니다." },
    { question: "4×4 주대각선 predicate와 1의 개수는 무엇인가요?", answer: "row==column이고 각 row에 하나씩 있어 총 4개입니다." },
    { question: "반대 대각선 식이 size-1을 쓰는 이유는 무엇인가요?", answer: "0-based 양 끝 좌표의 row+column이 모두 size-1이기 때문입니다." },
    { question: "break는 중첩 loop를 모두 끝내나요?", answer: "기본 break는 가장 안쪽 loop만 끝냅니다. 전체 종료는 return·flag·labeled break 등을 명시적으로 선택합니다." },
    { question: "중첩 계산보다 console 출력이 느릴 수 있는 이유는 무엇인가요?", answer: "각 println의 synchronization·encoding·device I/O 같은 큰 고정 비용이 body마다 발생하기 때문입니다." },
    { question: "반복 테스트에서 값 외에 무엇을 고정해야 하나요?", answer: "iteration count, ordered first/last, row/column shape, separator, overflow와 budget failure를 함께 고정합니다." },
  ],
  completionChecklist: [
    "초기화·조건·본문·갱신 순서를 trace로 설명했다.",
    "0회 실행과 마지막 false 평가를 구분했다.",
    "inclusive·exclusive bound의 회차를 계산했다.",
    "증가·감소 step이 종료 경계로 진행하는지 확인했다.",
    "합 0·곱 1 identity를 적용했다.",
    "누산 prefix invariant를 문장으로 적었다.",
    "factorial int overflow 경계를 검증했다.",
    "무경계 for에 progress·budget·failure를 두었다.",
    "교대 합 i=199를 simulation과 수식으로 교차 검증했다.",
    "중첩 loop count를 Cartesian product 또는 합산으로 계산했다.",
    "break가 끝내는 loop 범위를 확인했다.",
    "구구단 값과 orientation·separator를 분리했다.",
    "좌표 pattern을 predicate로 표현했다.",
    "4×4 shape의 cell·one counts를 검증했다.",
    "계산 복잡도와 console I/O 비용을 분리했다.",
    "output volume 상한을 정했다.",
    "empty·single·end·step·overflow 경계 tests를 작성했다.",
    "세 원본의 active/comment-only evidence를 구분했다.",
  ],
  nextSessions: ["java-08-while-loop-control"],
  sources: [
    { id: "java-day05-for", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day05/Ex07.java", usedFor: ["comment-only 기초 for inventory", "7! active output", "교대 부호 first-hit 199"], evidence: "JDK 21.0.11 clean compile -Xlint:all warning 0; active stdout 7!의 합은? 5040, 정답 : 199." },
    { id: "java-day06-nested", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day06/Ex01.java", usedFor: ["2~9단 세 layout·두 orientation", "4×4 zero pattern", "4×4 identity pattern"], evidence: "JDK 21.0.11 clean run 102 lines; first 구구단-1, 첫 section 마지막 9*9=81, final row 0 0 0 1." },
    { id: "java-day07-example4", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day07/Example4.java", usedFor: ["3~7단 nested loop", "45 multiplication lines", "단 사이 blank separator"], evidence: "JDK 21.0.11 clean run captured 50 lines; first 3X1=3, last multiplication 7X9=63, final blank true." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["JDK 21 toolchain compile", "UTF-8 compile", "Xlint source audit"], evidence: "원본 세 파일과 페이지 examples를 JDK 21 toolchain으로 compile·run합니다." },
    { id: "jls-for", repository: "Java Language Specification SE 21", path: "14.14 The for Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.14", usedFor: ["basic for lifecycle", "condition omission", "continue update semantics"], evidence: "초기화·조건·본문·갱신의 formal execution order와 scope 근거입니다." },
    { id: "jls-break", repository: "Java Language Specification SE 21", path: "14.15 The break Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.15", usedFor: ["innermost loop termination", "labeled break", "unbounded search exit"], evidence: "break target과 abrupt completion semantics의 primary specification입니다." },
    { id: "jls-continue", repository: "Java Language Specification SE 21", path: "14.16 The continue Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.16", usedFor: ["for update target", "nested loop control"], evidence: "continue가 for update part로 이어지는 formal 근거입니다." },
    { id: "jls-scope", repository: "Java Language Specification SE 21", path: "6.3 Scope of a Declaration; 6.4 Shadowing and Obscuring", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.4", usedFor: ["for-init local scope", "nested local same-name redeclaration rejection", "field/local shadowing distinction"], evidence: "scope가 겹치는 local variable의 같은 이름 재선언이 compile-time error라는 근거입니다." },
    { id: "java-math-api", repository: "Java SE 21 API", path: "java.base/java.lang.Math", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html", usedFor: ["multiplyExact", "addExact", "overflow policy"], evidence: "fixed-width 누산과 closed-form overflow를 명시 실패시키는 API 근거입니다." },
    { id: "java-biginteger-api", repository: "Java SE 21 API", path: "java.base/java.math.BigInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigInteger.html", usedFor: ["arbitrary precision factorial", "immutable product"], evidence: "int/long 범위를 넘는 정수 누산 대안의 API 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 3,
    filesUsed: 3,
    uncoveredNotes: ["Ex07의 0~20·5단·짝수 합 등 comment-only blocks는 실행 evidence로 과장하지 않고 reconstruction 소재로만 반영했습니다.", "Ex01의 102행 전체를 본문에 복제하지 않고 section count·boundary와 작은 동등 fixture로 검증했습니다.", "Example4의 trailing blank line은 PowerShell capture boolean과 shape 설명에 포함했습니다."],
  },
} satisfies DetailedSession;

export default session;
