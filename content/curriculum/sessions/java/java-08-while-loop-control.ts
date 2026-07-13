import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["java-08-while-loop-control"],
  slug: "java-08-while-loop-control",
  courseId: "java",
  moduleId: "java-language-control",
  order: 8,
  title: "while·do-while와 반복 제어 계약",
  subtitle: "상태가 종료점으로 진행함을 증명하고 sentinel·EOF·break·continue·label·retry·interruption을 유한하고 테스트 가능한 반복으로 설계합니다.",
  level: "중급",
  estimatedMinutes: 500,
  coreQuestion: "횟수가 미리 정해지지 않은 반복이 모든 경로에서 진행하고, 올바른 이유로 종료하며, 자원·취소·오류 정보를 잃지 않음을 어떻게 증명할까요?",
  summary: "javastudy day06 Ex02·Ex06·Ex07과 day07 Ex01·Ex03 다섯 원본을 OpenJDK 21.0.11에서 clean compile·run해 141개 stdout lines와 blank section을 확인했습니다. Ex02는 while의 경계·step·후위 증가를, Ex06은 do-while의 최소 한 번 실행을, Ex07·Ex01·Ex03은 break 위치와 가장 가까운 target·labeled break를 보여 줍니다. Ex01 주석에는 continue가 있지만 active continue 문은 없으므로 공식 JLS 기반 예제로 별도 재구성합니다. 이를 pre/post-test lifecycle, progress variant, sentinel·EOF·invalid recovery, search postcondition, continue update trap, label·flag·method return 선택, bounded retry, interruption·cancellation, 복잡도·관측·경계 테스트까지 확장합니다.",
  objectives: [
    "while의 조건 선평가·0회 실행과 do-while의 본문 선실행·최소 1회를 state trace로 구분할 수 있다.",
    "loop invariant와 strict progress variant를 정의해 모든 정상 경로의 종료 가능성을 설명할 수 있다.",
    "sentinel·EOF·blank·invalid token·budget exhaustion을 서로 다른 입력 상태로 처리할 수 있다.",
    "break·continue의 가장 가까운 target과 갱신 순서를 중첩 반복에서 정확히 추적할 수 있다.",
    "labeled break·flag·helper return의 scope·후조건·가독성 trade-off를 비교할 수 있다.",
    "재시도·polling·장기 worker에 attempt·deadline·interruption·output budget을 적용할 수 있다.",
    "0회·1회·sentinel-first·EOF·not-found·continue path·cancel·overflow 경계를 자동 검증할 수 있다.",
  ],
  prerequisites: [{ title: "for 반복·누산과 중첩 반복", reason: "while의 상태·종료·중첩 target을 이해하려면 반복 lifecycle·누산 invariant·Cartesian count가 필요합니다.", sessionSlug: "java-07-for-nested" }],
  keywords: ["while", "do-while", "sentinel", "EOF", "progress", "variant", "break", "continue", "label", "retry", "budget", "interrupt", "cancellation", "busy spin"],
  chapters: [
    {
      id: "five-source-golden-audit",
      title: "다섯 원본의 141행과 break 위치를 section 단위로 고정합니다",
      lead: "긴 출력은 line·blank·first·last와 section 의미를 함께 보존합니다.",
      explanations: [
        "Ex02는 50행으로 0..10, 10..20, 0..20 짝수, 5단, a..h를 separator 없이 연속 출력합니다. 경계의 i=10이 두 section 끝·시작에서 연속 두 번 나옵니다.",
        "Ex06은 0..10 뒤 안내문, 짝수 0..10으로 18행이며 do-while body가 condition보다 먼저 실행됩니다.",
        "Ex07은 전체 0..10과 break 0..5를 출력합니다. 두 번째 loop는 print 뒤 i==5를 검사하므로 5가 포함됩니다.",
        "Ex01 네 block의 non-empty 행 수는 6·10·5·10입니다. inner break, outer 값에 의한 inner break, outer break, inner 완료 뒤 outer break의 차이입니다.",
        "Ex03의 첫 plain break와 single-loop labeled break는 같은 4행을 만들고, nested exit label만 6행을 2행으로 줄여 cross-loop exit 차이를 보여 줍니다.",
        "다섯 파일의 실행 코드는 모두 active이며 주석은 설명용입니다. 다만 Ex01 제목이 언급한 continue는 실제 source에 없습니다.",
      ],
      concepts: [
        { term: "golden section", definition: "긴 stdout을 의미 있는 구간의 count·경계·separator로 정규화한 회귀 기준입니다.", detail: ["전체 main은 실제 실행합니다.", "blank도 계약에 포함합니다."] },
        { term: "statement order evidence", definition: "print·check·update 위치로 마지막 포함값과 탈출 시점을 확인하는 실행 근거입니다.", detail: ["Ex07의 5 포함을 설명합니다.", "리팩터링 전후를 비교합니다."] },
        { term: "active evidence", definition: "주석 설명이 아니라 compile·execute되는 문장과 그 결과입니다.", detail: ["continue 부재를 구분합니다.", "과장된 source coverage를 막습니다."] },
      ],
      codeExamples: [
        {
          id: "java-original-while-control-audit",
          title: "다섯 main을 clean classes에서 실행해 line·blank boundaries를 요약합니다",
          language: "powershell",
          filename: "verify-original-while.ps1",
          purpose: "원본을 변경하지 않고 실제 section 규모와 마지막 값을 결정적으로 기록합니다.",
          code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("java08-original-" + [Guid]::NewGuid().ToString("N"))
if (Test-Path $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
try {
  $files = @(
    "src\com\ictedu\day06\Ex02.java", "src\com\ictedu\day06\Ex06.java",
    "src\com\ictedu\day06\Ex07.java", "src\com\ictedu\day07\Ex01.java",
    "src\com\ictedu\day07\Ex03.java"
  )
  javac -encoding UTF-8 -Xlint:all -d $root $files
  if ($LASTEXITCODE -ne 0) { throw "compile failed" }
  function Summarize([string]$name, [string]$className) {
    $lines = & java -cp $root $className
    if ($LASTEXITCODE -ne 0) { throw "run failed: $className" }
    $blank = @($lines | Where-Object { [string]::IsNullOrEmpty($_) }).Count
    $nonEmpty = @($lines | Where-Object { -not [string]::IsNullOrEmpty($_) })
    "$name=lines:$($lines.Count),nonEmpty:$($nonEmpty.Count),blanks:$blank,first:$($nonEmpty[0]),last:$($nonEmpty[-1])"
  }
  Summarize "Ex02" "com.ictedu.day06.Ex02"
  Summarize "Ex06" "com.ictedu.day06.Ex06"
  Summarize "Ex07" "com.ictedu.day06.Ex07"
  Summarize "Ex01" "com.ictedu.day07.Ex01"
  Summarize "Ex03" "com.ictedu.day07.Ex03"
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}`,
          walkthrough: [
            { lines: "1-4", explanation: "system temp 바로 아래에 충돌 없는 GUID root를 만듭니다." },
            { lines: "6-13", explanation: "원본 다섯 파일을 UTF-8·Xlint로 한 번에 clean compile합니다." },
            { lines: "14-21", explanation: "각 main의 전체 output에서 blank와 non-empty boundary를 분리합니다." },
            { lines: "22-26", explanation: "다섯 summary를 고정 순서로 출력합니다." },
            { lines: "27-31", explanation: "resolved parent가 temp base인지 검증한 뒤 생성 root만 제거합니다." },
          ],
          run: { environment: ["PowerShell 7+", "OpenJDK 21", "javastudy MyJavaProject root"], command: "pwsh -NoProfile -File verify-original-while.ps1" },
          output: { value: "Ex02=lines:50,nonEmpty:50,blanks:0,first:i=0,last:h\nEx06=lines:18,nonEmpty:18,blanks:0,first:0,last:10\nEx07=lines:19,nonEmpty:17,blanks:2,first:i=0,last:i=5\nEx01=lines:34,nonEmpty:31,blanks:3,first:i=1,j=1,last:i=2,j=5\nEx03=lines:20,nonEmpty:16,blanks:4,first:i=1,last:i=1,j=2", explanation: ["합계는 50+18+19+34+20=141 captured lines입니다.", "blank count는 Ex07·Ex01·Ex03의 section separator를 보존합니다."] },
          experiments: [
            { change: "Ex07의 break 검사를 print 앞으로 옮깁니다.", prediction: "두 번째 section 마지막은 i=4이고 nonEmpty가 16입니다.", result: "문장 순서가 포함 경계를 바꿉니다." },
            { change: "Ex03의 nested break exit를 plain break로 바꿉니다.", prediction: "마지막 section이 2행에서 6행으로 늘어납니다.", result: "가장 가까운 loop와 labeled target을 비교합니다." },
            { change: "Ex02의 5단 i++를 별도 update로 분리합니다.", prediction: "올바른 위치라면 9행 값은 같습니다.", result: "표현식 side effect 없이 state를 드러냅니다." },
          ],
          sourceRefs: ["java-day06-while", "java-day06-do", "java-day06-break", "java-day07-break", "java-day07-label", "jdk21-javac"],
        },
      ],
      diagnostics: [{ symptom: "Ex07의 break section이 i=4에서 끝난다고 기록했다.", likelyCause: "조건을 print보다 먼저 실행한다고 잘못 읽었습니다.", checks: ["source statement 순서를 봅니다.", "i=5 행을 검색합니다.", "blank boundary 전 마지막 값을 확인합니다."], fix: "print→if→break 순서를 trace해 i=5 포함을 golden에 둡니다.", prevention: "탈출 조건 전후 side effect를 ordered output으로 test합니다." }],
    },
    {
      id: "while-pretest-state-machine",
      title: "while은 조건을 먼저 보는 state machine이라 0회 실행이 가능합니다",
      lead: "현재 state·condition checks·visits를 서로 다른 수치로 추적합니다.",
      explanations: [
        "while은 condition을 평가해 true면 body를 실행하고 다시 condition으로 돌아갑니다. 초기 condition이 false면 body는 한 번도 실행되지 않습니다.",
        "condition-controlled 정상 완료에서 visits가 n이면 condition은 n+1회 평가됩니다. break·return·예외로 끝나면 마지막 false 평가는 없을 수 있습니다.",
        "for와 while은 많은 경우 같은 상태 전이로 바꿀 수 있지만 update 위치와 continue target까지 보존해야 동등합니다.",
        "condition에 `cursor++` 같은 side effect를 넣으면 false가 되는 마지막 평가에서도 state가 바뀔 수 있어 추론이 어려워집니다.",
        "condition은 가능하면 관찰 가능한 side effect 없는 predicate로 두고 update를 body의 명시적 위치에 둡니다.",
      ],
      concepts: [
        { term: "pre-test loop", definition: "본문 전에 조건을 평가하는 반복입니다.", detail: ["0회 실행 가능합니다.", "while·for가 대표적입니다."] },
        { term: "state machine", definition: "현재 state와 transition·terminal predicate로 반복을 표현한 모델입니다.", detail: ["회차 trace에 유용합니다.", "종료 상태를 명시합니다."] },
        { term: "condition check", definition: "본문 실행 여부를 결정하기 위해 predicate를 평가한 한 번의 사건입니다.", detail: ["visits와 다릅니다.", "정상 완료에는 마지막 false가 있습니다."] },
      ],
      codeExamples: [
        {
          id: "java-while-state-trace",
          title: "empty와 길이 3 입력의 visits·state·condition checks를 비교합니다",
          language: "java",
          filename: "src/learning/java08/WhileTraceLab.java",
          purpose: "0회 실행과 마지막 false 평가를 exact summary로 확인합니다.",
          code: String.raw`package learning.java08;

public class WhileTraceLab {
    record Summary(long visits, int state, long conditionChecks) {}

    static Summary consume(int length) {
        if (length < 0) throw new IllegalArgumentException("NEGATIVE_LENGTH");
        int cursor = 0;
        long visits = 0, checks = 1;
        while (cursor < length) {
            visits++;
            cursor++;
            checks++;
        }
        return new Summary(visits, cursor, checks);
    }
    static String format(String name, Summary value) {
        return name + "=visits:" + value.visits() + ",state:" + value.state()
                + ",checks:" + value.conditionChecks();
    }
    public static void main(String[] args) {
        System.out.println(format("empty", consume(0)));
        System.out.println(format("three", consume(3)));
    }
}`,
          walkthrough: [
            { lines: "4", explanation: "본문 visits와 종료 state, condition checks를 별도로 보존합니다." },
            { lines: "6-15", explanation: "cursor<length가 false일 때까지 cursor가 한 칸씩 진행합니다." },
            { lines: "16-23", explanation: "길이 0은 checks 1·visits 0, 길이 3은 checks 4·visits 3입니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java08/WhileTraceLab.java && java -cp build/classes learning.java08.WhileTraceLab" },
          output: { value: "empty=visits:0,state:0,checks:1\nthree=visits:3,state:3,checks:4", explanation: ["empty는 body를 건너뜁니다.", "정상 조건 종료에는 마지막 false check가 추가됩니다."] },
          experiments: [
            { change: "cursor++를 제거합니다.", prediction: "length 3에서 condition이 계속 true라 종료하지 않습니다.", result: "progress transition이 필수입니다." },
            { change: "condition을 cursor<=length로 바꿉니다.", prediction: "length 3은 visits 4·state 4·checks 5입니다.", result: "inclusive bound 차이를 확인합니다." },
            { change: "body 첫 회에 break를 넣습니다.", prediction: "visits 1 뒤 종료하며 마지막 false check가 없습니다.", result: "normal과 abrupt completion을 구분합니다." },
          ],
          sourceRefs: ["java-day06-while", "jls-while"],
        },
      ],
      diagnostics: [{ symptom: "빈 입력인데 body가 한 번 실행됐다.", likelyCause: "while의 0회 계약 대신 do-while 또는 body 선실행 구조를 사용했습니다.", checks: ["첫 condition 위치를 봅니다.", "length=0 trace를 실행합니다.", "초기 state를 확인합니다."], fix: "처리할 값 존재를 body 전에 검사하는 pre-test while로 바꿉니다.", prevention: "empty fixture를 모든 소비 loop에 둡니다." }],
    },
    {
      id: "progress-variant-termination-proof",
      title: "종료는 invariant뿐 아니라 매 회차 감소하는 progress variant로 증명합니다",
      lead: "모든 continue·오류·skip 경로가 종료점에 가까워지는지 확인합니다.",
      explanations: [
        "invariant는 매 회차 유지되는 사실이고 variant는 음수가 되지 않으면서 매 회차 strict하게 감소하는 양입니다.",
        "배열 소비에서는 `length-cursor`가 variant입니다. cursor가 증가하지 않는 경로가 하나라도 있으면 종료 증명이 깨집니다.",
        "step 0·잘못된 방향·overflow wrap은 condition을 영원히 true로 만들 수 있으므로 loop 진입 전에 domain을 검증합니다.",
        "입력 loop의 invalid token도 소비하거나 별도 failure로 종료해야 합니다. 같은 잘못된 token을 재검사만 하면 progress가 없습니다.",
        "완전한 수학 증명이 어렵다면 maximum iterations·deadline·cancellation을 두되 이것은 비즈니스 종료 조건을 대체하지 않고 안전망이 됩니다.",
      ],
      concepts: [
        { term: "loop invariant", definition: "각 회차 시작·끝에서 유지되는 state 관계입니다.", detail: ["정확성을 설명합니다.", "processed prefix를 나타냅니다."] },
        { term: "progress variant", definition: "하한이 있고 매 회차 strict하게 감소해 종료를 보이는 값입니다.", detail: ["ranking function이라고도 합니다.", "모든 control path를 확인합니다."] },
        { term: "non-progress path", definition: "조건을 다시 검사하지만 종료점 방향으로 state가 변하지 않는 경로입니다.", detail: ["continue에서 흔합니다.", "budget으로 탐지합니다."] },
      ],
      codeExamples: [
        {
          id: "java-progress-variant",
          title: "positive step만 허용하고 remaining variant를 출력합니다",
          language: "java",
          filename: "src/learning/java08/ProgressLab.java",
          purpose: "진행하지 않는 step을 loop 전에 실패시키고 정상 state를 검증합니다.",
          code: String.raw`package learning.java08;

public class ProgressLab {
    static String advance(long length, long step) {
        if (length < 0) throw new IllegalArgumentException("NEGATIVE_LENGTH");
        if (step <= 0) throw new IllegalArgumentException("NON_PROGRESSING_STEP");
        if (length > 0) {
            long last = ((length - 1) / step) * step;
            try { Math.addExact(last, step); }
            catch (ArithmeticException error) {
                throw new IllegalArgumentException("UNREPRESENTABLE_TERMINAL_STATE", error);
            }
        }
        long cursor = 0, visits = 0;
        StringBuilder trace = new StringBuilder();
        while (cursor < length) {
            if (!trace.isEmpty()) trace.append('|');
            trace.append("state=").append(cursor).append(",remaining=").append(length - cursor);
            cursor = Math.addExact(cursor, step);
            visits++;
        }
        return trace + ",visits=" + visits + ",done=" + cursor;
    }
    public static void main(String[] args) {
        System.out.println(advance(3, 1));
        try { advance(3, 0); }
        catch (IllegalArgumentException error) { System.out.println("step0=" + error.getMessage()); }
    }
}`,
          walkthrough: [
            { lines: "4-14", explanation: "길이·strict positive step과 마지막 overshoot cursor가 long에 표현 가능한지를 loop 진입 전에 검증합니다." },
            { lines: "15-22", explanation: "remaining이 3→2→1로 감소하고 exact update 뒤 cursor 3에서 종료합니다." },
            { lines: "24-28", explanation: "정상 trace와 non-progress step 실패를 함께 고정합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java08/ProgressLab.java && java -cp build/classes learning.java08.ProgressLab" },
          output: { value: "state=0,remaining=3|state=1,remaining=2|state=2,remaining=1,visits=3,done=3\nstep0=NON_PROGRESSING_STEP", explanation: ["remaining은 매 회차 strict하게 감소합니다.", "step 0은 hang 대신 명시 실패합니다."] },
          experiments: [
            { change: "step을 2로 바꿉니다.", prediction: "state 0·2를 방문하고 visits=2, done=4입니다.", result: "끝에 정확히 닿지 않아도 condition false로 종료합니다." },
            { change: "length=Long.MAX_VALUE, step=2를 넣습니다.", prediction: "반복 진입 전 UNREPRESENTABLE_TERMINAL_STATE입니다.", result: "마지막 정상 overshoot가 long을 넘는 domain을 미리 거부합니다." },
            { change: "invalid step을 조용히 1로 바꿉니다.", prediction: "호출자 오류가 정상 처리처럼 보입니다.", result: "invalid와 recovery policy를 섞지 않습니다." },
          ],
          sourceRefs: ["java-day06-while", "jls-while", "java-math-api"],
        },
      ],
      diagnostics: [{ symptom: "CPU를 사용하지만 cursor와 로그가 같은 값에 멈췄다.", likelyCause: "어떤 branch가 update 없이 condition으로 돌아가는 non-progress path입니다.", checks: ["모든 continue 전 state 변화를 봅니다.", "variant를 log합니다.", "iteration budget으로 동일 state를 탐지합니다."], fix: "공통 update를 control-flow가 건너뛰지 않는 위치로 옮기거나 각 경로에서 strict progress를 보장합니다.", prevention: "branch별 progress assertion과 bounded hang regression을 둡니다." }],
    },
    {
      id: "do-while-posttest-one-shot",
      title: "do-while은 본문 뒤 조건을 보므로 최소 한 번 실행됩니다",
      lead: "최초 실행이 항상 안전하고 의미 있을 때만 post-test loop를 선택합니다.",
      explanations: [
        "do body는 condition을 보기 전에 한 번 실행되므로 초기 condition이 false여도 side effect가 발생합니다.",
        "원본 Ex06은 i=0에서 출력·증가한 뒤 i<11을 검사해 0..10을 만듭니다.",
        "메뉴 표시·최초 입력 요청처럼 한 번은 반드시 수행해야 하는 workflow에는 자연스럽지만 비어 있을 수 있는 collection 소비에는 부적합할 수 있습니다.",
        "`while (condition);` 끝 semicolon을 빠뜨리면 compile error이고, 별도 빈 statement를 잘못 붙이면 의도와 다른 loop가 될 수 있어 formatter와 review가 필요합니다.",
        "body 선실행 중 예외·외부 호출·비가역 side effect가 있다면 condition이 보호하지 못하므로 body 내부 validation이나 pre-test 구조를 선택합니다.",
      ],
      concepts: [
        { term: "post-test loop", definition: "본문을 실행한 뒤 반복 조건을 평가하는 구조입니다.", detail: ["최소 한 회 실행합니다.", "do-while이 해당합니다."] },
        { term: "one-shot safety", definition: "조건 검사 전 첫 body 실행도 유효하고 안전하다는 계약입니다.", detail: ["side effect를 검토합니다.", "empty domain과 연결됩니다."] },
        { term: "retry prompt", definition: "최소 한 번 요청하고 결과에 따라 다시 요청하는 post-test workflow입니다.", detail: ["attempt budget을 둡니다.", "EOF를 별도 처리합니다."] },
      ],
      codeExamples: [
        {
          id: "java-while-do-boundary",
          title: "처음부터 false인 조건에서 while 0회와 do-while 1회를 비교합니다",
          language: "java",
          filename: "src/learning/java08/DoWhileBoundaryLab.java",
          purpose: "pre-test와 post-test의 최소 회차 차이를 exact output으로 확인합니다.",
          code: String.raw`package learning.java08;

public class DoWhileBoundaryLab {
    public static void main(String[] args) {
        int whileState = 5, whileCount = 0;
        while (whileState < 3) {
            whileState++;
            whileCount++;
        }
        int doState = 5, doCount = 0;
        do {
            doState++;
            doCount++;
        } while (doState < 3);
        System.out.println("while=count:" + whileCount + ",state:" + whileState);
        System.out.println("do=count:" + doCount + ",state:" + doState);
    }
}`,
          walkthrough: [
            { lines: "5-9", explanation: "5<3이 처음부터 false라 while body를 건너뜁니다." },
            { lines: "10-15", explanation: "do body가 먼저 state를 6으로 만든 후 false condition을 봅니다." },
            { lines: "16-17", explanation: "count 0과 1을 같은 초기 state에서 비교합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java08/DoWhileBoundaryLab.java && java -cp build/classes learning.java08.DoWhileBoundaryLab" },
          output: { value: "while=count:0,state:5\ndo=count:1,state:6", explanation: ["while은 0회입니다.", "do-while은 condition이 false여도 첫 회를 실행합니다."] },
          experiments: [
            { change: "초기 state를 0으로 바꿉니다.", prediction: "while과 do 모두 state 3, count 3입니다.", result: "조건이 처음 true이면 최종 결과가 같을 수 있습니다." },
            { change: "body에 외부 결제를 넣습니다.", prediction: "condition false여도 한 번 결제될 수 있습니다.", result: "one-shot safety 없이는 pre-test validation을 사용합니다." },
            { change: "끝 semicolon을 제거합니다.", prediction: "javac syntax error입니다.", result: "do-while 문법 경계를 확인합니다." },
          ],
          sourceRefs: ["java-day06-do", "jls-do"],
        },
      ],
      diagnostics: [{ symptom: "처리할 데이터가 없는데 한 건 처리됐다.", likelyCause: "empty 가능 domain에 do-while을 사용했습니다.", checks: ["첫 condition 위치를 봅니다.", "empty fixture를 실행합니다.", "첫 body side effect를 확인합니다."], fix: "데이터 존재를 먼저 확인하는 while로 바꾸거나 do body 안에서 안전하게 guard합니다.", prevention: "0건·1건 입력을 별도 test합니다." }],
    },
    {
      id: "sentinel-eof-input-loop",
      title: "sentinel·EOF·blank·invalid token을 분리해야 입력 반복이 정보를 잃지 않습니다",
      lead: "각 입력은 반드시 소비되거나 명시적으로 종료되어야 합니다.",
      explanations: [
        "sentinel은 데이터 domain 안팎의 특별 종료 값이고 EOF는 더 읽을 데이터가 없다는 transport 상태입니다. 둘을 같은 문자열로 뭉개지 않습니다.",
        "blank는 무시·invalid·기본값 중 요구 정책을 정하고, parse 실패 token은 소비한 뒤 rejected count나 오류 위치를 기록합니다.",
        "Scanner에서는 hasNext 계열로 EOF를 확인하고 nextInt 실패 뒤 같은 token을 소비하지 않으면 반복해서 InputMismatchException이 날 수 있습니다.",
        "BufferedReader.readLine은 EOF에 null을 반환하며 빈 문자열과 다릅니다. null에 trim을 호출하기 전에 분기합니다.",
        "학습 예제는 immutable list fixture로 parser core를 결정적으로 검증하고 실제 stdin adapter는 resource ownership과 blocking·cancellation을 별도로 다룹니다.",
      ],
      concepts: [
        { term: "sentinel", definition: "입력 stream 안에서 정상 데이터가 아니라 종료를 뜻하도록 합의한 값입니다.", detail: ["domain 충돌을 피합니다.", "소비 후 종료합니다."] },
        { term: "EOF", definition: "입력 source가 더 이상 값을 제공하지 않는 transport 상태입니다.", detail: ["빈 값과 다릅니다.", "API별 표현을 확인합니다."] },
        { term: "invalid recovery", definition: "잘못된 token을 소비·기록하고 다음 token으로 진행하거나 명시 실패하는 정책입니다.", detail: ["무한 재검사를 막습니다.", "raw secret은 log하지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "java-sentinel-input-core",
          title: "quit·invalid·EOF를 deterministic token 목록에서 구분합니다",
          language: "java",
          filename: "src/learning/java08/SentinelLoopLab.java",
          purpose: "stdin 없이 parse·aggregate·stop state를 exact하게 검증합니다.",
          code: String.raw`package learning.java08;

import java.util.List;

public class SentinelLoopLab {
    record Result(int sum, int accepted, int rejected, boolean stopped) {}

    static Result process(List<String> tokens) {
        int cursor = 0, sum = 0, accepted = 0, rejected = 0;
        boolean stopped = false;
        while (cursor < tokens.size()) {
            String token = tokens.get(cursor++).trim();
            if (token.equalsIgnoreCase("quit")) { stopped = true; break; }
            try {
                sum = Math.addExact(sum, Integer.parseInt(token));
                accepted++;
            } catch (NumberFormatException error) {
                rejected++;
            }
        }
        return new Result(sum, accepted, rejected, stopped);
    }
    static String format(Result r) {
        return "sum=" + r.sum() + ",accepted=" + r.accepted()
                + ",rejected=" + r.rejected() + ",stopped=" + r.stopped();
    }
    public static void main(String[] args) {
        System.out.println(format(process(List.of(" 2 ", "bad", "5", "quit", "99"))));
        System.out.println(format(process(List.of("1", "2"))));
    }
}`,
          walkthrough: [
            { lines: "6", explanation: "합계·정상·거부 수와 sentinel 종료 여부를 함께 반환합니다." },
            { lines: "8-22", explanation: "cursor를 먼저 증가시켜 모든 token이 소비되고 quit 뒤 값은 처리하지 않습니다." },
            { lines: "23-31", explanation: "sentinel 종료와 목록 끝 EOF-equivalent 완료를 비교합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java08/SentinelLoopLab.java && java -cp build/classes learning.java08.SentinelLoopLab" },
          output: { value: "sum=7,accepted=2,rejected=1,stopped=true\nsum=3,accepted=2,rejected=0,stopped=false", explanation: ["quit 뒤 99는 소비하지 않습니다.", "목록 끝은 sentinel 없이 정상 완료되어 stopped=false입니다."] },
          experiments: [
            { change: "첫 token을 quit로 바꿉니다.", prediction: "sum=0, accepted=0, rejected=0, stopped=true입니다.", result: "sentinel-first 경계를 검증합니다." },
            { change: "빈 문자열을 추가합니다.", prediction: "현재 정책에서는 rejected가 1 증가합니다.", result: "blank 정책을 문서화합니다." },
            { change: "cursor++를 parse 성공 뒤로 옮깁니다.", prediction: "invalid token에서 같은 위치를 재검사할 위험이 생깁니다.", result: "입력 소비와 parse 성공을 분리합니다." },
          ],
          sourceRefs: ["java-day06-while", "java-scanner-api", "java-bufferedreader-api", "java-math-api"],
        },
      ],
      diagnostics: [{ symptom: "잘못된 숫자를 입력한 뒤 같은 예외가 무한히 반복된다.", likelyCause: "Scanner의 invalid token을 소비하지 않고 nextInt를 다시 호출했습니다.", checks: ["hasNextInt/next 호출 순서를 봅니다.", "현재 token 위치를 관찰합니다.", "invalid count가 증가하는지 확인합니다."], fix: "invalid token을 next로 한 번 소비해 기록하거나 line 단위로 읽어 parse한 뒤 다음 입력으로 진행합니다.", prevention: "연속 invalid·blank·EOF fixture와 attempt budget을 둡니다." }],
    },
    {
      id: "break-search-postcondition",
      title: "break는 가장 가까운 반복만 끝내므로 탐색 결과의 postcondition을 별도로 보존합니다",
      lead: "found·not-found·budget-exhausted를 하나의 sentinel index로 섞지 않습니다.",
      explanations: [
        "unlabeled break는 가장 안쪽 while·do·for·switch를 abrupt하게 끝내고 그 다음 statement로 이동합니다.",
        "원본 Ex07처럼 print 뒤 break하면 발견값을 이미 처리한 상태이고, check 뒤 print하면 발견값은 출력되지 않습니다.",
        "탐색 후에는 왜 종료했는지 알아야 합니다. found boolean 또는 sealed/enum status와 index·value를 함께 반환합니다.",
        "-1 index는 간단하지만 not-found와 budget-exhausted·cancelled를 표현해야 할 때 정보가 부족합니다.",
        "break 뒤 loop-local 변수 scope가 끝날 수 있으므로 필요한 결과는 loop 밖 result object에 보존하거나 helper method에서 return합니다.",
      ],
      concepts: [
        { term: "abrupt completion", definition: "조건 false의 정상 완료가 아니라 break·return·throw 등으로 제어가 즉시 이동하는 완료입니다.", detail: ["마지막 false check가 없습니다.", "후조건을 구분합니다."] },
        { term: "search postcondition", definition: "종료 후 found 여부와 result 위치·처리량이 만족해야 하는 관계입니다.", detail: ["not-found를 포함합니다.", "budget 상태를 분리합니다."] },
        { term: "nearest target", definition: "label 없는 break가 종료하는 가장 안쪽 loop 또는 switch입니다.", detail: ["if는 target이 아닙니다.", "중첩에서 중요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [{ symptom: "중첩 탐색에서 값을 찾았는데 outer loop가 계속 실행돼 결과가 덮였다.", likelyCause: "inner break만 사용하고 outer 종료 postcondition을 구현하지 않았습니다.", checks: ["break의 nearest target을 표시합니다.", "found 뒤 outer state를 trace합니다.", "결과 대입 횟수를 셉니다."], fix: "helper return·labeled break·outer condition 중 하나로 전체 탐색 종료를 명시하고 found status를 보존합니다.", prevention: "first-match·last-match·not-found 요구를 먼저 쓰고 방문 count를 test합니다." }],
    },
    {
      id: "continue-update-trap",
      title: "while의 continue는 아래 update를 건너뛰므로 모든 경로의 progress를 확인해야 합니다",
      lead: "실제 hang을 만들지 않고 step budget으로 stuck state를 재현합니다.",
      explanations: [
        "continue는 현재 회차의 나머지 body를 건너뛰고 가장 가까운 loop의 continue target으로 이동합니다.",
        "while·do-while에서는 condition 쪽으로 이동하므로 body 아래에 둔 update가 실행되지 않을 수 있습니다. for에서는 header update part를 거친 뒤 condition을 봅니다.",
        "원본 Ex01 주석은 continue를 언급하지만 active code는 break뿐이므로 이 장의 continue 동작은 JLS와 별도 실행 fixture로 보강합니다.",
        "update를 continue 전에 무작정 복제하면 double update가 생길 수 있습니다. 현재 값을 capture한 뒤 cursor를 공통으로 한 번 증가시키는 구조가 안전합니다.",
        "hang regression은 무한 실행하지 말고 최대 steps 뒤 현재 state와 completed를 반환해 non-progress를 결정적으로 보여 줍니다.",
      ],
      concepts: [
        { term: "continue target", definition: "continue가 현재 회차를 끝낸 뒤 다음 반복을 위해 제어를 보내는 위치입니다.", detail: ["while은 condition입니다.", "for는 update part입니다."] },
        { term: "stuck state", definition: "condition은 true지만 다음 회차에도 같은 state로 돌아오는 상태입니다.", detail: ["CPU spin이 됩니다.", "step budget으로 탐지합니다."] },
        { term: "capture then advance", definition: "현재 값을 local에 저장한 뒤 분기 전에 cursor를 한 번 진행시키는 패턴입니다.", detail: ["skip에서도 progress합니다.", "중복 update를 줄입니다."] },
      ],
      codeExamples: [
        {
          id: "java-continue-progress-trap",
          title: "갱신 누락 버전은 i=2에 고정되고 안전 버전은 5에서 끝납니다",
          language: "java",
          filename: "src/learning/java08/ContinueLab.java",
          purpose: "무한 loop의 원인을 bounded simulator와 올바른 구조로 비교합니다.",
          code: String.raw`package learning.java08;

public class ContinueLab {
    static String broken(int maxSteps) {
        int i = 0, steps = 0;
        while (i < 5 && steps < maxSteps) {
            steps++;
            if (i == 2) continue;
            i++;
        }
        return "broken=i:" + i + ",steps:" + steps + ",completed:" + (i >= 5);
    }
    static String safe() {
        int cursor = 0;
        StringBuilder kept = new StringBuilder();
        while (cursor < 5) {
            int current = cursor++;
            if (current == 2) continue;
            if (!kept.isEmpty()) kept.append(',');
            kept.append(current);
        }
        return "safe=" + kept + ",done=" + cursor;
    }
    public static void main(String[] args) {
        System.out.println(broken(8));
        System.out.println(safe());
    }
}`,
          walkthrough: [
            { lines: "4-12", explanation: "i==2 path가 i++를 건너뛰어 budget 8까지 같은 state에 머뭅니다." },
            { lines: "13-23", explanation: "현재 값을 capture한 뒤 cursor를 먼저 한 번 진행시켜 skip path도 progress합니다." },
            { lines: "24-27", explanation: "stuck summary와 정상 sequence를 exact output으로 비교합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java08/ContinueLab.java && java -cp build/classes learning.java08.ContinueLab" },
          output: { value: "broken=i:2,steps:8,completed:false\nsafe=0,1,3,4,done=5", explanation: ["broken은 실제로 영원히 돌리지 않고 stuck state를 포착합니다.", "safe는 2만 건너뛰고 cursor 5에 도달합니다."] },
          experiments: [
            { change: "safe의 cursor++를 continue 아래로 옮깁니다.", prediction: "current 2에서 cursor가 2인 채 반복됩니다.", result: "continue 전 progress를 확인합니다." },
            { change: "while을 for(int i=0;i<5;i++)로 바꿉니다.", prediction: "continue 뒤 header i++가 실행돼 종료합니다.", result: "loop별 continue target을 구분합니다." },
            { change: "maxSteps를 2로 바꿉니다.", prediction: "broken은 i=2, steps=2, completed=false입니다.", result: "budget exhaustion과 정상 완료를 분리합니다." },
          ],
          sourceRefs: ["java-day07-break", "jls-while", "jls-basic-for", "jls-continue"],
        },
      ],
      diagnostics: [{ symptom: "특정 값에서 CPU가 계속 돌고 다음 로그가 나오지 않는다.", likelyCause: "continue가 cursor update를 건너뛰어 condition과 state가 그대로입니다.", checks: ["continue target을 확인합니다.", "continue 직전/condition 직전 state를 비교합니다.", "bounded step counter를 추가합니다."], fix: "capture-then-advance 또는 공통 update 위치로 구조를 바꾸고 모든 분기에서 variant가 감소하게 합니다.", prevention: "skip 대상이 첫·중간·마지막에 있는 fixtures와 timeout을 둡니다." }],
    },
    {
      id: "nested-nearest-target-label",
      title: "중첩 break는 nearest target만 끝내고 label은 지정 statement 전체를 끝냅니다",
      lead: "원본 Ex01·Ex03을 좌표 방문 수로 읽으면 target 차이가 선명해집니다.",
      explanations: [
        "Ex01 첫 block은 j==3에서 inner만 끝내므로 각 i마다 j=1,2가 출력돼 6행입니다.",
        "두 번째 block의 i==2 검사는 inner 안에 있지만 loop-invariant입니다. i=2의 inner만 첫 진입 즉시 끝나고 outer i=3은 계속되어 10행입니다.",
        "세 번째 block은 outer body에서 i==2일 때 outer break하므로 i=1의 5행만 남고, 네 번째는 i=2 inner까지 완료한 뒤 outer break해 10행입니다.",
        "Ex03의 single-loop `break esc`는 plain break와 같은 결과라 label 이점을 보여 주지 못하고, nested `break exit`만 두 loop를 한 번에 끝냅니다.",
        "label은 continue·break가 허용하는 target과 scope가 JLS에 정해진 statement 이름입니다. 임의 goto가 아니지만 깊은 label 제어는 추론 비용을 키웁니다.",
      ],
      concepts: [
        { term: "labeled statement", definition: "identifier와 colon으로 이름을 붙인 statement이며 break가 그 statement 뒤로 이동할 수 있습니다.", detail: ["loop에 자주 씁니다.", "goto와 다릅니다."] },
        { term: "cross-loop exit", definition: "inner에서 outer loop까지 포함한 중첩 영역을 한 번에 끝내는 제어입니다.", detail: ["labeled break가 가능합니다.", "method return 대안이 있습니다."] },
        { term: "loop-invariant branch", definition: "inner counter와 무관해 한 outer 회차 동안 결과가 변하지 않는 조건입니다.", detail: ["outer로 이동할 수 있습니다.", "target 의미는 보존해야 합니다."] },
      ],
      codeExamples: [
        {
          id: "java-nearest-vs-labeled-break",
          title: "plain break 6 visits와 labeled break 2 visits를 비교합니다",
          language: "java",
          filename: "src/learning/java08/NestedExitLab.java",
          purpose: "Ex03 nested sections의 count와 마지막 좌표를 짧게 재현합니다.",
          code: String.raw`package learning.java08;

public class NestedExitLab {
    static String plain() {
        int visits = 0, lastI = 0, lastJ = 0;
        for (int i = 1; i < 4; i++) {
            for (int j = 1; j < 6; j++) {
                if (j == 3) break;
                visits++; lastI = i; lastJ = j;
            }
        }
        return "plain=visits:" + visits + ",last:" + lastI + ',' + lastJ;
    }
    static String labeled() {
        int visits = 0, lastI = 0, lastJ = 0;
        exit:
        for (int i = 1; i < 4; i++) {
            for (int j = 1; j < 6; j++) {
                if (j == 3) break exit;
                visits++; lastI = i; lastJ = j;
            }
        }
        return "labeled=visits:" + visits + ",last:" + lastI + ',' + lastJ;
    }
    public static void main(String[] args) {
        System.out.println(plain());
        System.out.println(labeled());
    }
}`,
          walkthrough: [
            { lines: "4-13", explanation: "plain break는 매 outer 회차의 inner만 끝내 3×2=6 visits를 만듭니다." },
            { lines: "14-24", explanation: "break exit는 첫 outer의 j=3에서 labeled outer statement 전체를 끝냅니다." },
            { lines: "25-28", explanation: "두 경우의 방문 count와 마지막 출력 좌표를 대조합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java08/NestedExitLab.java && java -cp build/classes learning.java08.NestedExitLab" },
          output: { value: "plain=visits:6,last:3,2\nlabeled=visits:2,last:1,2", explanation: ["plain은 outer 3회 모두 계속합니다.", "labeled는 첫 row 두 cells 뒤 전체 중첩을 끝냅니다."] },
          experiments: [
            { change: "plain의 if를 visits·last-coordinate update 뒤로 옮깁니다.", prediction: "j=3도 관측돼 visits=9, last=3,3입니다.", result: "탈출 조건 전후 state observation을 검토합니다." },
            { change: "label을 inner loop에 붙입니다.", prediction: "break label은 inner만 끝내 plain과 같은 6 visits입니다.", result: "label 이름보다 target statement 범위를 봅니다." },
            { change: "break exit를 return으로 바꿉니다.", prediction: "helper method 전체가 즉시 결과를 반환할 수 있습니다.", result: "다음 장의 method extraction과 비교합니다." },
          ],
          sourceRefs: ["java-day07-break", "java-day07-label", "jls-labeled", "jls-break"],
        },
      ],
      diagnostics: [{ symptom: "label을 썼는데 outer loop가 계속 돈다.", likelyCause: "label을 outer가 아니라 inner statement에 붙였습니다.", checks: ["colon 뒤 statement 범위를 봅니다.", "break label 이름을 대조합니다.", "방문 좌표를 count합니다."], fix: "끝내려는 전체 outer statement에 label을 붙이거나 search helper의 return으로 바꿉니다.", prevention: "plain/labeled visit counts와 no-match를 test합니다." }],
    },
    {
      id: "label-flag-return-method-extraction",
      title: "전체 탐색 종료는 label·flag·helper return 중 후조건이 가장 명확한 방법을 고릅니다",
      lead: "세 구현이 같은 first-match와 visits를 만드는지 비교합니다.",
      explanations: [
        "labeled break는 국소적인 이중 loop에서 간결하지만 결과 변수를 loop 밖에 준비해야 하고 target 범위를 읽어야 합니다.",
        "flag는 label 없이 outer condition에 found를 넣을 수 있지만 condition·break가 여러 곳에 흩어지고 update 순서를 복잡하게 만들 수 있습니다.",
        "helper method return은 found result와 종료를 한 표현으로 묶어 library/domain search에 적합하고 unit test하기 쉽습니다.",
        "어떤 전략이든 first-match인지 last-match인지, row-major order인지, not-found에 무엇을 반환하는지 문서화해야 합니다.",
        "예외는 정상적인 found 제어에 사용하지 않습니다. 예외는 계약 위반·I/O failure처럼 별도의 실패 의미에 둡니다.",
      ],
      concepts: [
        { term: "method extraction", definition: "중첩 search를 독립 함수로 옮겨 return을 전체 종료와 result 전달에 사용하는 리팩터링입니다.", detail: ["scope를 줄입니다.", "테스트성을 높입니다."] },
        { term: "control flag", definition: "found·done 같은 boolean state를 outer condition과 후처리에 전달하는 방식입니다.", detail: ["명시적 상태입니다.", "분산되기 쉽습니다."] },
        { term: "first-match policy", definition: "정해진 방문 순서에서 조건을 처음 만족하는 값을 결과로 채택하는 계약입니다.", detail: ["order가 의미를 가집니다.", "early exit가 가능합니다."] },
      ],
      codeExamples: [
        {
          id: "java-exit-strategy-search",
          title: "label·flag·return이 target 2,3을 8 visits에 찾습니다",
          language: "java",
          filename: "src/learning/java08/ExitStrategyLab.java",
          purpose: "세 control 전략의 observable result가 같은지 검증합니다.",
          code: String.raw`package learning.java08;

public class ExitStrategyLab {
    record Found(boolean found, int row, int column, int visits) {
        @Override public String toString() {
            return found ? "found:" + row + ',' + column + ",visits:" + visits
                    : "NOT_FOUND,visits:" + visits;
        }
    }
    static Found byLabel(int targetRow, int targetColumn) {
        int row = 0, column = 0, visits = 0; boolean found = false;
        search: for (int r = 1; r <= 3; r++) for (int c = 1; c <= 5; c++) {
            visits++;
            if (r == targetRow && c == targetColumn) {
                row = r; column = c; found = true; break search;
            }
        }
        return new Found(found, row, column, visits);
    }
    static Found byFlag(int targetRow, int targetColumn) {
        int row = 0, column = 0, visits = 0; boolean found = false;
        for (int r = 1; r <= 3 && !found; r++) for (int c = 1; c <= 5; c++) {
            visits++;
            if (r == targetRow && c == targetColumn) {
                row = r; column = c; found = true; break;
            }
        }
        return new Found(found, row, column, visits);
    }
    static Found byReturn(int targetRow, int targetColumn) {
        int visits = 0;
        for (int r = 1; r <= 3; r++) for (int c = 1; c <= 5; c++) {
            visits++;
            if (r == targetRow && c == targetColumn) return new Found(true, r, c, visits);
        }
        return new Found(false, 0, 0, visits);
    }
    public static void main(String[] args) {
        System.out.println("label=" + byLabel(2, 3));
        System.out.println("flag=" + byFlag(2, 3));
        System.out.println("return=" + byReturn(2, 3));
        System.out.println("missing=" + byReturn(9, 9));
    }
}`,
          walkthrough: [
            { lines: "4-9", explanation: "결과가 found 여부·좌표·실제 visits를 함께 보존합니다." },
            { lines: "10-20", explanation: "label은 loop 밖 variables에 결과를 보존하고 전체 search를 끝냅니다." },
            { lines: "21-31", explanation: "flag는 outer condition과 inner break를 결합합니다." },
            { lines: "32-39", explanation: "helper return은 찾는 즉시 result를 반환하고 끝까지 가면 NOT_FOUND입니다." },
            { lines: "40-45", explanation: "세 성공 결과와 15-cell no-match를 비교합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java08/ExitStrategyLab.java && java -cp build/classes learning.java08.ExitStrategyLab" },
          output: { value: "label=found:2,3,visits:8\nflag=found:2,3,visits:8\nreturn=found:2,3,visits:8\nmissing=NOT_FOUND,visits:15", explanation: ["row-major target 2,3은 첫 row 5개와 둘째 row 3개 뒤 찾습니다.", "no-match는 전체 15 cells를 방문합니다."] },
          experiments: [
            { change: "target을 1,1로 바꿉니다.", prediction: "세 전략 모두 visits=1입니다.", result: "best-case early exit를 확인합니다." },
            { change: "byFlag outer condition에서 !found를 제거합니다.", prediction: "inner break 뒤 다음 row를 계속 방문해 visits가 늘어날 수 있습니다.", result: "flag 소비 위치를 확인합니다." },
            { change: "target을 1,5로 두고 방문 순서를 column-major로 바꿉니다.", prediction: "row-major visits=5지만 column-major visits=13입니다.", result: "first-match와 order를 함께 계약합니다." },
          ],
          sourceRefs: ["java-day07-break", "java-day07-label", "jls-labeled", "jls-break"],
        },
      ],
      diagnostics: [{ symptom: "세 전략이 같은 target에서 다른 좌표나 visits를 낸다.", likelyCause: "방문 순서·found 이후 outer 종료·check 전후 count가 일치하지 않습니다.", checks: ["좌표 sequence를 비교합니다.", "visits 증가 위치를 통일합니다.", "found 뒤 다음 outer 진입을 봅니다."], fix: "first-match·row-major·방문 정의를 공통 contract로 두고 strategy별 contract test를 실행합니다.", prevention: "first·middle·last·missing target의 동등성 test를 둡니다." }],
    },
    {
      id: "finite-retry-resource-budget",
      title: "재시도는 성공 조건뿐 아니라 attempt·deadline·오류 분류·멱등성 계약이 필요합니다",
      lead: "실패를 영구 while로 감싸지 않고 유한 상태 machine으로 만듭니다.",
      explanations: [
        "maxAttempts는 최초 시도를 포함한 총 호출 수인지 retry 추가 횟수인지 이름과 문서로 고정합니다. 이 장에서는 총 attempts입니다.",
        "일시 오류만 재시도하고 validation·authentication 같은 영구 오류는 즉시 실패합니다. 모든 예외를 catch해 반복하면 원인과 자원을 잃습니다.",
        "deadline은 각 attempt timeout과 다릅니다. 전체 작업 시간이 남았는지 monotonic time 기준으로 확인하고 backoff도 budget을 소비합니다.",
        "외부 쓰기 작업은 retry가 중복 side effect를 만들 수 있어 idempotency key·transaction·deduplication이 필요합니다.",
        "테스트는 실제 sleep·network 없이 주입한 attempt 결과로 success-at-n·always-fail·invalid budget을 결정적으로 검증합니다.",
      ],
      concepts: [
        { term: "attempt budget", definition: "최초 호출을 포함해 작업을 실행할 수 있는 최대 횟수입니다.", detail: ["off-by-one을 막습니다.", "0 정책을 정합니다."] },
        { term: "deadline", definition: "전체 작업이 완료되어야 하는 절대 종료 시점 또는 남은 시간 계약입니다.", detail: ["attempt timeout과 다릅니다.", "monotonic clock을 씁니다."] },
        { term: "idempotency", definition: "같은 요청을 여러 번 적용해도 결과 side effect가 한 번 적용한 것과 같은 성질입니다.", detail: ["retry safety에 필요합니다.", "key·dedupe를 사용합니다."] },
      ],
      codeExamples: [
        {
          id: "java-retry-attempt-budget",
          title: "두 번째 성공과 3회 소진을 sleep 없이 검증합니다",
          language: "java",
          filename: "src/learning/java08/RetryBudgetLab.java",
          purpose: "attempt count와 terminal status를 deterministic fixture로 고정합니다.",
          code: String.raw`package learning.java08;

import java.util.function.LongSupplier;

public class RetryBudgetLab {
    static String run(int maxAttempts, int successAt, long deadlineNanos, LongSupplier clock) {
        if (maxAttempts <= 0) return "INVALID_BUDGET";
        StringBuilder trace = new StringBuilder();
        int attempt = 0;
        while (attempt < maxAttempts) {
            if (clock.getAsLong() >= deadlineNanos)
                return (trace.isEmpty() ? "" : trace + "|") + "result=DEADLINE";
            attempt++;
            boolean success = attempt == successAt;
            if (!trace.isEmpty()) trace.append('|');
            trace.append("attempt=").append(attempt).append(success ? ":SUCCESS" : ":FAIL");
            if (success) return trace + "|result=SUCCESS";
        }
        return trace + "|result=EXHAUSTED";
    }
    static LongSupplier scripted(long... times) {
        return new LongSupplier() {
            int cursor;
            public long getAsLong() { return times[Math.min(cursor++, times.length - 1)]; }
        };
    }
    public static void main(String[] args) {
        System.out.println(run(3, 2, Long.MAX_VALUE, () -> 0));
        System.out.println(run(3, 99, Long.MAX_VALUE, () -> 0));
        System.out.println(run(5, 99, 100, scripted(10, 50, 100)));
        System.out.println(run(0, 1, 100, () -> 0));
    }
}`,
          walkthrough: [
            { lines: "3-7", explanation: "주입한 monotonic clock과 총 attempt budget을 입력으로 받고 0 이하는 호출 없이 INVALID로 분리합니다." },
            { lines: "8-18", explanation: "각 attempt 전에 deadline을 확인하고 attempt<max 조건으로 정확히 1..maxAttempts만 실행합니다." },
            { lines: "19-24", explanation: "scripted clock은 sleep 없이 10→50→100의 결정적 시간을 제공합니다." },
            { lines: "25-30", explanation: "두 번째 성공·항상 실패·세 번째 시도 전 deadline·invalid budget을 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java08/RetryBudgetLab.java && java -cp build/classes learning.java08.RetryBudgetLab" },
          output: { value: "attempt=1:FAIL|attempt=2:SUCCESS|result=SUCCESS\nattempt=1:FAIL|attempt=2:FAIL|attempt=3:FAIL|result=EXHAUSTED\nattempt=1:FAIL|attempt=2:FAIL|result=DEADLINE\nINVALID_BUDGET", explanation: ["성공하면 남은 budget을 쓰지 않습니다.", "always-fail은 정확히 3번 뒤 terminal EXHAUSTED입니다.", "clock 100은 deadline 100 이상이므로 세 번째 외부 호출 전에 멈춥니다."] },
          experiments: [
            { change: "condition을 attempt<=maxAttempts로 바꿉니다.", prediction: "선증가 구조에서 최대 4회 호출하는 off-by-one이 생깁니다.", result: "attempt 정의와 bound를 함께 test합니다." },
            { change: "successAt를 1로 바꿉니다.", prediction: "첫 attempt 성공 뒤 즉시 끝납니다.", result: "best-case를 검증합니다." },
            { change: "scripted times를 100 하나로 둡니다.", prediction: "외부 호출 0회로 result=DEADLINE입니다.", result: "deadline-first 경계를 검증합니다." },
            { change: "실제 결제 API에 동일 loop를 그대로 적용합니다.", prediction: "응답 손실 뒤 중복 결제가 가능할 수 있습니다.", result: "idempotency key 없이는 쓰기 retry를 허용하지 않습니다." },
          ],
          sourceRefs: ["jls-while", "java-duration-api", "java-system-nanotime-api"],
        },
      ],
      diagnostics: [{ symptom: "maxAttempts=3인데 외부 API가 네 번 호출됐다.", likelyCause: "attempt 증가 위치와 <= bound가 결합된 off-by-one입니다.", checks: ["최초 호출을 count에 포함하는지 확인합니다.", "condition 전후 attempt를 trace합니다.", "max 1 fixture를 실행합니다."], fix: "총 attempts 정의를 고정하고 `attempt < maxAttempts` 뒤 한 번 증가하는 구조로 통일합니다.", prevention: "max 0·1·3과 success-at-last tests를 둡니다." }],
    },
    {
      id: "interruption-cancellation-cooperation",
      title: "장기 반복은 interruption을 삼키지 않고 cooperative cancellation로 끝납니다",
      lead: "blocking 작업도 종료 신호를 받고 상위 호출자가 상태를 알 수 있어야 합니다.",
      explanations: [
        "Thread.interrupt는 강제 종료가 아니라 interruption status를 설정하거나 blocking method가 InterruptedException을 던지게 하는 협력 신호입니다.",
        "Thread.interrupted는 현재 thread flag를 읽고 지우지만 isInterrupted는 지우지 않습니다. 의도하지 않은 flag 소실을 피합니다.",
        "InterruptedException을 catch하고 계속할 이유가 없다면 종료하거나 `Thread.currentThread().interrupt()`로 flag를 복구해 상위 계층에 전달합니다.",
        "shared plain boolean은 visibility를 보장하지 않습니다. interrupt, volatile, AtomicBoolean 또는 동시성 primitive의 memory semantics를 사용합니다.",
        "condition만 빠르게 검사하는 busy spin은 CPU를 낭비하므로 queue take·latch await·condition wait 같은 blocking primitive와 shutdown policy를 선택합니다.",
        "interruptible queue·latch와 달리 System.in 위 Scanner·BufferedReader의 blocking read는 interrupt만으로 반드시 풀린다고 보장할 수 없습니다. source를 소유한 adapter의 close/channel 취소나 별도 reader lifecycle을 설계하고 shared System.in은 함부로 닫지 않습니다.",
      ],
      concepts: [
        { term: "cooperative cancellation", definition: "작업이 cancellation signal을 관찰하고 안전한 지점에서 스스로 종료하는 방식입니다.", detail: ["강제 thread stop과 다릅니다.", "cleanup을 수행할 수 있습니다."] },
        { term: "interrupt status", definition: "thread에 interruption 요청이 왔음을 나타내는 상태 flag입니다.", detail: ["API가 지울 수 있습니다.", "복구 정책이 필요합니다."] },
        { term: "busy spin", definition: "blocking 없이 condition을 매우 빠르게 반복 검사해 CPU를 소비하는 loop입니다.", detail: ["backoff만으로 해결되지 않을 수 있습니다.", "blocking primitive를 우선합니다."] },
      ],
      codeExamples: [
        {
          id: "java-interruption-cancellation",
          title: "await 중인 worker를 interrupt하고 flag를 복구한 뒤 join합니다",
          language: "java",
          filename: "src/learning/java08/CancellationLab.java",
          purpose: "race를 latch로 동기화해 cancellation 결과를 결정적으로 검증합니다.",
          code: String.raw`package learning.java08;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;

public class CancellationLab {
    public static void main(String[] args) throws Exception {
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch blocker = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>("worker=missing");
        Thread worker = new Thread(() -> {
            try {
                started.countDown();
                blocker.await();
                result.set("worker=completed");
            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
                result.set("worker=cancelled,flag=" + Thread.currentThread().isInterrupted());
            }
        });
        worker.start();
        started.await();
        worker.interrupt();
        worker.join(1_000);
        if (worker.isAlive()) throw new IllegalStateException("JOIN_TIMEOUT");
        System.out.println(result.get());
        System.out.println("main=joined");
    }
}`,
          walkthrough: [
            { lines: "8-10", explanation: "started와 blocker를 분리하고 thread-safe result holder를 준비합니다." },
            { lines: "11-20", explanation: "worker는 blocking await에서 InterruptedException을 받고 flag를 복구해 cancelled result를 남깁니다." },
            { lines: "21-28", explanation: "main은 시작을 확인한 뒤 interrupt·bounded join하고 worker 생존 여부를 검사합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java08/CancellationLab.java && java -cp build/classes learning.java08.CancellationLab" },
          output: { value: "worker=cancelled,flag=true\nmain=joined", explanation: ["InterruptedException이 지운 flag를 catch에서 복구합니다.", "bounded join 뒤 worker가 종료됐음을 확인합니다."] },
          experiments: [
            { change: "catch에서 interrupt 복구를 제거합니다.", prediction: "result flag=false입니다.", result: "상위 계층이 cancellation을 잃을 수 있습니다." },
            { change: "started.await 없이 즉시 interrupt합니다.", prediction: "실행은 대체로 끝나도 재현 timing을 추론하기 어려워집니다.", result: "동시성 test에 happens-before 동기화를 둡니다." },
            { change: "blocker.await를 `while(!done){}`으로 바꿉니다.", prediction: "CPU busy spin이 되고 interrupt 처리도 직접 넣어야 합니다.", result: "blocking primitive를 사용합니다." },
          ],
          sourceRefs: ["java-thread-api", "java-interrupted-exception", "java-latch-api", "java-atomic-reference-api"],
        },
      ],
      diagnostics: [
        { symptom: "shutdown을 요청했는데 worker가 계속 살아 있다.", likelyCause: "interruption을 검사하지 않거나 InterruptedException을 catch한 뒤 무시하고 loop를 재개했습니다.", checks: ["catch block과 flag 복구를 봅니다.", "blocking API가 어떤 신호를 내는지 확인합니다.", "bounded join 결과를 봅니다."], fix: "취소 시 cleanup 후 return하거나 flag를 복구해 상위로 전파하고 loop condition에 cancellation을 포함합니다.", prevention: "started synchronization·interrupt·join-timeout cancellation test를 둡니다." },
        { symptom: "System.in을 읽는 worker에 interrupt했지만 read에서 돌아오지 않는다.", likelyCause: "console Scanner·BufferedReader blocking read도 latch·BlockingQueue처럼 interruptible하다고 가정했습니다.", checks: ["실제 input source와 소유자를 확인합니다.", "read API의 cancellation 계약을 봅니다.", "shared System.in close의 다른 consumer 영향을 확인합니다."], fix: "소유 가능한 stream/channel의 close·취소, interruptible queue로 넘기는 별도 reader lifecycle, 또는 process-level shutdown 중 환경에 맞는 정책을 사용합니다.", prevention: "input adapter별 cancellation integration test를 두고 shared System.in을 library code에서 닫지 않습니다." },
      ],
    },
    {
      id: "complexity-observability-test-matrix",
      title: "반복의 best·worst 비용과 종료 이유를 metrics·경계 matrix로 관측합니다",
      lead: "정상 결과만 아니라 processed count·terminal status·resource ceiling을 검증합니다.",
      explanations: [
        "선형 while은 worst O(n), 직사각형 nested loop는 O(nm)이며 first-match break는 best O(1)이어도 no-match worst는 전체 domain입니다.",
        "polling interval이 너무 짧으면 외부 시스템과 CPU를 압박하고 너무 길면 cancellation·새 데이터 반응이 느립니다. blocking event나 bounded backoff를 우선 검토합니다.",
        "관측값에는 attempts·processed·rejected·terminal reason·duration bucket을 두되 raw input·token·개인정보를 log하지 않습니다.",
        "테스트 matrix는 0회·1회·sentinel-first·EOF·invalid 연속·continue 대상·first/last/not-found·budget-1/budget·cancel·overflow를 포함합니다.",
        "timeout test는 단순 wall-clock sleep에 의존하면 flaky합니다. injected clock·latch·deterministic result sequence로 state transition을 검증합니다.",
      ],
      concepts: [
        { term: "terminal reason", definition: "반복이 success·sentinel·EOF·not-found·exhausted·cancelled·failure 중 어떤 이유로 끝났는지 나타내는 상태입니다.", detail: ["운영 분석에 필요합니다.", "결과와 분리합니다."] },
        { term: "best/worst case", definition: "입력 배치와 종료 위치에 따른 최소·최대 작업량입니다.", detail: ["early exit를 설명합니다.", "SLA 설계에 씁니다."] },
        { term: "deterministic concurrency test", definition: "sleep 추측 대신 latch·barrier·injected clock으로 사건 순서를 동기화한 테스트입니다.", detail: ["flakiness를 줄입니다.", "timeout은 안전망입니다."] },
      ],
      codeExamples: [
        {
          id: "java-loop-cost-counters",
          title: "linear·nested·early break의 실제 body count를 출력합니다",
          language: "java",
          filename: "src/learning/java08/LoopCostLab.java",
          purpose: "Big-O 설명을 작은 exact counters와 연결합니다.",
          code: String.raw`package learning.java08;

public class LoopCostLab {
    public static void main(String[] args) {
        int linear = 0, i = 0;
        while (i < 5) { linear++; i++; }
        int nested = 0;
        for (int row = 0; row < 3; row++)
            for (int column = 0; column < 4; column++) nested++;
        int early = 0;
        for (int value : new int[]{7, 9, 10, 12}) {
            early++;
            if (value % 2 == 0) break;
        }
        System.out.println("linear=" + linear);
        System.out.println("nested=" + nested);
        System.out.println("early=" + early);
    }
}`,
          walkthrough: [
            { lines: "5-6", explanation: "length 5 linear loop는 body를 5회 실행합니다." },
            { lines: "7-9", explanation: "3×4 Cartesian space는 12회입니다." },
            { lines: "10-14", explanation: "첫 even이 세 번째라 early search는 3회에서 끝납니다." },
            { lines: "15-17", explanation: "세 observed counts를 exact output으로 고정합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java08/LoopCostLab.java && java -cp build/classes learning.java08.LoopCostLab" },
          output: { value: "linear=5\nnested=12\nearly=3", explanation: ["실제 count가 O(n)·O(nm)·early exit를 구체화합니다.", "큰 입력에서는 terminal reason과 count distribution을 관측합니다."] },
          experiments: [
            { change: "첫 값을 8로 바꿉니다.", prediction: "early=1입니다.", result: "best case를 확인합니다." },
            { change: "모든 값을 홀수로 바꿉니다.", prediction: "early=4이고 found status가 별도로 필요합니다.", result: "worst/no-match를 분리합니다." },
            { change: "inner upper bound를 external input으로 바꿉니다.", prediction: "overflow·출력량·시간 상한 검증이 필요합니다.", result: "resource ceiling을 API contract에 둡니다." },
          ],
          sourceRefs: ["java-day06-break", "java-day07-break", "jls-while", "jls-break"],
        },
      ],
      diagnostics: [
        { symptom: "운영에서 loop가 느리지만 성공 로그만 있어 원인을 모른다.", likelyCause: "processed·attempts·terminal reason·duration을 관측하지 않았습니다.", checks: ["body count metric을 봅니다.", "not-found와 exhausted를 구분합니다.", "I/O 대기와 계산 시간을 나눕니다."], fix: "bounded low-cardinality metrics와 structured terminal status를 추가합니다.", prevention: "성능·취소·failure budget SLO와 privacy review를 함께 둡니다." },
        { symptom: "timeout test가 간헐적으로 실패한다.", likelyCause: "sleep 시간과 scheduler timing에 의존했습니다.", checks: ["Thread.sleep을 검색합니다.", "동기화 primitive를 확인합니다.", "clock 주입 가능성을 봅니다."], fix: "latch·fake clock·scripted attempt로 사건 순서를 결정적으로 만들고 timeout은 deadlock 안전망으로만 둡니다.", prevention: "느린 CI에서도 동일한 state transition을 검증하도록 설계합니다." },
      ],
      comparisons: [{ title: "중첩 반복 전체 종료 전략", options: [
        { name: "labeled break", chooseWhen: "국소적인 이중 loop 안에서 뒤 공통 후처리를 계속해야 할 때", avoidWhen: "깊은 중첩·긴 method·여러 labels가 있을 때", tradeoffs: ["추가 flag 없이 직접 끝냅니다.", "target 범위를 읽어야 합니다."] },
        { name: "control flag", chooseWhen: "종료 state를 loop 밖 후처리에서도 명시적으로 사용할 때", avoidWhen: "여러 condition·update에 flag가 퍼질 때", tradeoffs: ["상태가 보입니다.", "제어가 분산될 수 있습니다."] },
        { name: "helper return", chooseWhen: "search 자체가 독립 책임과 result를 가질 때", avoidWhen: "반환 뒤 같은 local scope의 공통 후처리가 반드시 필요할 때", tradeoffs: ["테스트와 후조건이 명확합니다.", "method 경계를 설계해야 합니다."] },
      ] }],
      expertNotes: ["서비스 loop는 terminal reason을 cardinality가 제한된 enum으로 기록하고 user-provided raw strings를 metric label로 쓰지 않습니다.", "structured concurrency나 virtual threads를 사용해도 cancellation·deadline·resource ownership 계약은 사라지지 않습니다."],
    },
  ],
  lab: {
    title: "취소 가능하고 budget이 있는 명령 처리기",
    scenario: "숫자 ADD 명령과 STATUS·QUIT를 처리하되 invalid·EOF·overflow·command budget·attempt exhaustion·cancellation을 서로 다른 terminal/result 상태로 보존하는 core와 adapter를 설계합니다.",
    setup: ["JDK 21과 UTF-8 source를 준비합니다.", "immutable token fixtures와 stdin adapter를 분리합니다.", "LoopResult에 status·processed·rejected·sum을 둡니다.", "실제 secret·개인정보 대신 synthetic values만 사용합니다."],
    steps: [
      "Command parser가 ADD n·STATUS·QUIT·INVALID를 side effect 없이 반환하게 합니다.",
      "processor while이 cursor·remainingCommands progress variant를 유지하도록 구현합니다.",
      "QUIT·EOF·INVALID_LIMIT·OVERFLOW·BUDGET_EXHAUSTED를 distinct status로 반환합니다.",
      "invalid token을 소비하고 rejected count를 올리되 maximum consecutive invalid를 넘으면 종료합니다.",
      "Math.addExact로 합계 overflow를 검출하고 마지막 valid state와 failure를 함께 보존합니다.",
      "BlockingQueue·latch 같은 interruptible adapter는 InterruptedException 뒤 flag를 복구해 CANCELLED로 변환합니다. console reader는 interrupt 보장이 없으므로 소유 source close·별도 reader lifecycle을 선택하고 shared System.in은 닫지 않습니다.",
      "sentinel-first·EOF-first·invalid 연속·budget exact·overflow·cancel fixtures를 실행합니다.",
      "processed·rejected·terminal reason만 관측하고 raw commands는 log하지 않습니다.",
    ],
    expectedResult: ["모든 입력 token은 소비되거나 명시적 terminal 상태에서 멈춥니다.", "정상·sentinel·EOF·budget·overflow·cancel이 서로 구분됩니다.", "모든 반복 경로의 progress와 최대 작업량을 설명할 수 있습니다.", "동시성 test는 latch·bounded join으로 결정적이며 worker를 남기지 않습니다."],
    cleanup: ["생성한 temp classes는 resolved parent 확인 뒤 생성 root만 제거합니다.", "worker thread가 종료됐는지 bounded join으로 확인합니다.", "원본 다섯 source는 read-only evidence로 유지합니다."],
    extensions: ["JSON command adapter를 추가합니다.", "주입한 monotonic clock의 남은 시간으로 bounded backoff를 계산합니다.", "idempotency key가 있는 외부 write retry를 설계합니다.", "JFR·metrics로 terminal reason과 attempts distribution을 관측합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "while로 0부터 20까지 짝수를 출력하고 매 회차 remaining variant를 기록하세요.", requirements: ["step 0을 거부합니다.", "11 visits와 마지막 20을 assertion합니다.", "condition checks를 별도로 셉니다.", "empty range를 test합니다."], hints: ["현재 값을 출력한 뒤 2 증가합니다.", "end-current를 variant 후보로 봅니다."], expectedOutcome: "off-by-one 없이 종료 과정과 회차 수를 설명합니다.", solutionOutline: ["range validation을 먼저 둡니다.", "state·visits·checks를 분리합니다.", "정상 false 완료를 고정합니다."] },
    { difficulty: "응용", prompt: "quit 또는 EOF까지 숫자를 합산하고 invalid 입력에서 복구하는 processor를 작성하세요.", requirements: ["sentinel·EOF·blank를 구분합니다.", "invalid token을 반드시 소비합니다.", "합계 overflow를 명시 실패합니다.", "command budget을 둡니다.", "raw token을 error에 노출하지 않습니다."], hints: ["line adapter와 pure parse core를 나눕니다.", "terminal reason enum을 사용합니다."], expectedOutcome: "정상·거부·종료 이유와 처리량이 하나의 result에 보존됩니다.", solutionOutline: ["Result status와 counters를 정의합니다.", "모든 branch의 cursor progress를 점검합니다.", "경계 matrix를 실행합니다."] },
    { difficulty: "설계", prompt: "중첩 search와 외부 retry를 수행하는 cancel 가능한 worker를 설계하세요.", requirements: ["first-match·not-found 정책을 씁니다.", "label·flag·return 중 선택 근거를 기록합니다.", "attempt·deadline·idempotency를 정의합니다.", "interrupt flag 전파와 bounded join을 구현합니다.", "metrics privacy와 resource cleanup을 포함합니다."], hints: ["search는 helper result로 추출하세요.", "실제 sleep 대신 injected attempt와 latch를 사용하세요."], expectedOutcome: "정상·exhausted·cancelled 경로가 유한하고 결정적으로 테스트되는 worker가 완성됩니다.", solutionOutline: ["pure search·retry state machine·thread adapter로 나눕니다.", "terminal enum과 counters를 반환합니다.", "cancel·last-attempt success·join timeout tests를 둡니다."] },
  ],
  reviewQuestions: [
    { question: "while과 do-while의 가장 중요한 실행 차이는 무엇인가요?", answer: "while은 조건을 먼저 봐 0회 가능하고 do-while은 본문을 먼저 실행해 최소 1회입니다." },
    { question: "정상 조건 종료에서 body n회면 condition은 몇 번 평가되나요?", answer: "일반적으로 n+1회이며 마지막이 false입니다. break·return·예외 종료는 다릅니다." },
    { question: "progress variant의 조건은 무엇인가요?", answer: "하한이 있고 반복을 계속하는 모든 경로에서 strict하게 감소해야 합니다." },
    { question: "for를 while로 바꿀 때 update만 body 끝에 두면 항상 동등한가요?", answer: "아닙니다. continue가 body 끝 update를 건너뛰므로 continue target까지 보존해야 합니다." },
    { question: "sentinel과 EOF는 어떻게 다른가요?", answer: "sentinel은 stream 안의 합의된 종료 값이고 EOF는 source가 더 이상 값을 주지 않는 transport 상태입니다." },
    { question: "Scanner invalid token에서 무한 예외가 나는 이유는 무엇인가요?", answer: "실패한 token을 소비하지 않고 같은 parse를 반복하기 때문입니다." },
    { question: "Ex07의 break loop가 i=5를 출력하는 이유는 무엇인가요?", answer: "println이 i==5 검사보다 먼저 실행되기 때문입니다." },
    { question: "label 없는 break는 중첩 loop를 모두 끝내나요?", answer: "아닙니다. 가장 가까운 loop나 switch 하나만 끝냅니다." },
    { question: "Ex03의 single-loop label이 plain break와 같은 이유는 무엇인가요?", answer: "label target과 nearest loop가 같은 하나의 loop라 제어 효과가 같습니다." },
    { question: "labeled break보다 helper return이 적합한 경우는 언제인가요?", answer: "search가 독립 책임과 result를 갖고 전체 method를 즉시 끝내는 것이 명확할 때입니다." },
    { question: "maxAttempts와 retries를 구분해야 하는 이유는 무엇인가요?", answer: "최초 호출 포함 여부가 달라 off-by-one과 실제 외부 호출 수가 달라지기 때문입니다." },
    { question: "모든 외부 오류를 retry하면 안 되는 이유는 무엇인가요?", answer: "영구 오류는 성공하지 않고 쓰기 작업은 멱등성 없으면 side effect를 중복시킬 수 있기 때문입니다." },
    { question: "interrupt는 thread를 즉시 강제 종료하나요?", answer: "아닙니다. status나 InterruptedException으로 전달되는 cooperative cancellation 신호입니다." },
    { question: "InterruptedException catch 뒤 flag를 복구하는 이유는 무엇인가요?", answer: "예외 발생 시 지워진 interruption 상태를 상위 계층이 다시 관찰할 수 있게 하기 위해서입니다." },
    { question: "System.in의 blocking read는 interrupt만으로 항상 취소되나요?", answer: "아닙니다. source/API별 계약이 다르므로 소유 stream·channel 취소나 별도 reader lifecycle을 설계하고 shared System.in은 함부로 닫지 않습니다." },
    { question: "early break search의 worst case는 무엇인가요?", answer: "마지막에서 찾거나 못 찾으면 전체 search domain을 방문하는 경우입니다." },
    { question: "loop metrics에 raw input을 넣으면 안 되는 이유는 무엇인가요?", answer: "개인정보·secret 노출과 무제한 cardinality를 만들 수 있기 때문입니다." },
  ],
  completionChecklist: [
    "원본 다섯 파일을 JDK 21로 clean compile·run했다.",
    "141 output lines와 blank section counts를 재현했다.",
    "Ex01에는 active continue가 없음을 구분했다.",
    "while의 0회와 마지막 false condition을 추적했다.",
    "do-while의 최소 1회와 one-shot safety를 설명했다.",
    "모든 control path의 progress variant를 확인했다.",
    "step 0·잘못된 방향·overflow를 진입 전에 처리했다.",
    "sentinel·EOF·blank·invalid를 구분했다.",
    "invalid token을 소비해 무한 재검사를 막았다.",
    "break 전후 side effect 순서를 검증했다.",
    "nearest target과 labeled statement 범위를 표시했다.",
    "continue가 while update를 건너뛰는 fixture를 실행했다.",
    "label·flag·return 전략의 후조건을 비교했다.",
    "first·middle·last·not-found search를 test했다.",
    "attempt budget의 최초 호출 포함 여부를 고정했다.",
    "retryable 오류와 permanent 오류를 분리했다.",
    "injected monotonic clock으로 attempt 전 deadline을 실행 검증했다.",
    "남은 deadline을 고려한 backoff·idempotency를 설계했다.",
    "InterruptedException 뒤 flag 전파 정책을 적용했다.",
    "busy spin 대신 blocking primitive를 검토했다.",
    "bounded join으로 worker 종료를 확인했다.",
    "processed·rejected·terminal reason을 관측했다.",
    "raw input·secret을 log와 metric에 넣지 않았다.",
  ],
  nextSessions: ["java-09-arrays"],
  sources: [
    { id: "java-day06-while", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day06/Ex02.java", usedFor: ["while boundary·step", "post-increment state", "for/while heuristic caveat"], evidence: "JDK 21.0.11 clean run 50 non-empty lines; 0..10·10..20·evens·5단·a..h를 separator 없이 확인했습니다." },
    { id: "java-day06-do", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day06/Ex06.java", usedFor: ["do-while post-test", "0..10", "even 0..10"], evidence: "clean run 18 lines; 안내문 전 0..10과 뒤 0,2,4,6,8,10을 확인했습니다." },
    { id: "java-day06-break", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day06/Ex07.java", usedFor: ["plain break", "print-before-break order", "blank separators"], evidence: "clean run 19 captured lines·blank 2; 전체 loop 0..10과 break loop 0..5를 확인했습니다." },
    { id: "java-day07-break", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day07/Ex01.java", usedFor: ["nested nearest break", "break placement four blocks", "continue claim correction"], evidence: "clean run 34 lines·blank 3; non-empty block counts 6·10·5·10이며 active continue는 없습니다." },
    { id: "java-day07-label", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day07/Ex03.java", usedFor: ["single-loop redundant label", "nested cross-loop exit", "label target"], evidence: "clean run 20 lines·blank 4; plain/single-label 각 4, nested plain 6, nested label 2 non-empty lines입니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["JDK 21 compile", "UTF-8 encoding", "Xlint audit"], evidence: "다섯 원본과 페이지 Java examples의 compiler 기준입니다." },
    { id: "jls-while", repository: "Java Language Specification SE 21", path: "14.12 The while Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.12", usedFor: ["pre-test lifecycle", "continue target", "abrupt completion"], evidence: "while condition·body·normal/abrupt completion의 primary specification입니다." },
    { id: "jls-do", repository: "Java Language Specification SE 21", path: "14.13 The do Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.13", usedFor: ["post-test lifecycle", "minimum one iteration", "continue condition"], evidence: "do-while 실행 순서의 primary specification입니다." },
    { id: "jls-basic-for", repository: "Java Language Specification SE 21", path: "14.14.1 The basic for Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.14.1", usedFor: ["while conversion", "for continue update comparison"], evidence: "for update part와 while 변환 caveat의 근거입니다." },
    { id: "jls-labeled", repository: "Java Language Specification SE 21", path: "14.7 Labeled Statements", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.7", usedFor: ["label scope", "target statement", "duplicate label restriction"], evidence: "label이 임의 goto가 아니라 named statement라는 근거입니다." },
    { id: "jls-break", repository: "Java Language Specification SE 21", path: "14.15 The break Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.15", usedFor: ["nearest target", "labeled cross-loop exit", "abrupt completion"], evidence: "plain·labeled break target의 primary specification입니다." },
    { id: "jls-continue", repository: "Java Language Specification SE 21", path: "14.16 The continue Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.16", usedFor: ["while condition target", "for update target", "labeled continue"], evidence: "원본에 없는 continue 동작을 공식 문서로 보강합니다." },
    { id: "java-scanner-api", repository: "Java SE 21 API", path: "java.base/java.util.Scanner", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Scanner.html", usedFor: ["hasNext EOF", "invalid token consumption", "resource ownership"], evidence: "token input loop의 API behavior 근거입니다." },
    { id: "java-bufferedreader-api", repository: "Java SE 21 API", path: "java.base/java.io.BufferedReader#readLine()", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/BufferedReader.html#readLine()", usedFor: ["line input", "EOF null", "blank distinction"], evidence: "EOF와 empty line을 구분하는 API 근거입니다." },
    { id: "java-math-api", repository: "Java SE 21 API", path: "java.base/java.lang.Math exact methods", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html", usedFor: ["checked cursor update", "aggregate overflow"], evidence: "fixed-width state update를 silent wrap 대신 명시 실패시키는 근거입니다." },
    { id: "java-duration-api", repository: "Java SE 21 API", path: "java.base/java.time.Duration", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Duration.html", usedFor: ["retry timeout duration", "backoff duration", "time budget representation"], evidence: "시간량을 단위가 명시된 값으로 표현하는 API 근거입니다." },
    { id: "java-system-nanotime-api", repository: "Java SE 21 API", path: "java.base/java.lang.System#nanoTime()", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html#nanoTime()", usedFor: ["monotonic elapsed time", "deadline comparison", "injected clock production adapter"], evidence: "wall-clock 변경과 분리된 elapsed-time deadline의 API 근거입니다." },
    { id: "java-thread-api", repository: "Java SE 21 API", path: "java.base/java.lang.Thread interrupt methods", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html", usedFor: ["interrupt status", "isInterrupted", "join"], evidence: "cooperative cancellation과 bounded shutdown의 API 근거입니다." },
    { id: "java-interrupted-exception", repository: "Java SE 21 API", path: "java.base/java.lang.InterruptedException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/InterruptedException.html", usedFor: ["blocking cancellation", "flag clearing", "propagation policy"], evidence: "await 중 interruption 처리의 API 근거입니다." },
    { id: "java-latch-api", repository: "Java SE 21 API", path: "java.base/java.util.concurrent.CountDownLatch", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html", usedFor: ["deterministic worker start", "blocking await", "happens-before"], evidence: "sleep 없는 cancellation fixture의 동기화 근거입니다." },
    { id: "java-atomic-reference-api", repository: "Java SE 21 API", path: "java.base/java.util.concurrent.atomic.AtomicReference", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicReference.html", usedFor: ["thread-safe result publication", "atomic reference visibility", "worker-to-main handoff"], evidence: "CancellationLab에서 worker 결과를 안전하게 게시하는 API 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 5,
    filesUsed: 5,
    uncoveredNotes: [
      "다섯 파일의 active statements를 모두 compile·run했고 총 141 captured lines와 warning 0을 확인했습니다.",
      "Ex02의 고정 횟수 for·결과 중심 while 구분은 문법 제한이 아니라 사용 heuristic으로 교정하고 continue 동등성 caveat를 추가했습니다.",
      "Ex01 주석은 break와 continue를 함께 언급하지만 active continue는 없으므로 continue trap은 JLS 기반 별도 fixture입니다.",
      "Ex03 single-loop label은 plain break와 제어 효과가 같고 nested exit만 cross-loop evidence라는 점을 분리했습니다.",
      "sentinel parser·retry·interruption·metrics는 원본 밖 production 보강이며 official Java 21 API와 deterministic synthetic fixtures에 기반합니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
