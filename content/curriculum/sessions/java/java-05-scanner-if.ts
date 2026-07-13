import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["java-05-scanner-if"],
  slug: "java-05-scanner-if",
  courseId: "java",
  moduleId: "java-language-control",
  order: 5,
  title: "Scanner 입력·조건식·if/else 경계",
  subtitle: "콘솔 문자를 token 또는 line으로 읽어 실패 없이 검증하고, 조건 연산자와 if/else로 유효한 값만 분류하는 입력 경계를 설계합니다.",
  level: "기초",
  estimatedMinutes: 520,
  coreQuestion: "Scanner가 어디까지 읽고 무엇을 남기는지 추적하면서, 잘못된 token·EOF·경계값·Unicode 입력을 안전하게 분류하는 테스트 가능한 CLI를 어떻게 만들까요?",
  summary: "javastudy day04 Ex01·Ex02·Ex03·Ex04·Ex07 다섯 원본을 UTF-8로 직접 읽고 Temurin JDK 21.0.11에서 clean compile한 뒤 고정 stdin으로 실행했습니다. Ex01은 조건 연산자를 값 선택에 사용하고, Ex02는 nextLine 한 번, Ex03은 두 nextInt와 조건 연산자, Ex04는 이름 line 뒤 세 점수 token, Ex07은 다섯 token을 if/else로 분류합니다. 정상 예시는 시작점이지만 잘못된 token은 InputMismatchException, EOF는 NoSuchElementException으로 종료되고, 999점은 합격, -2시간은 음수 급여가 되며 Scanner.close가 공유 System.in까지 닫을 수 있습니다. 이 세션은 원본 실행 결과를 golden evidence로 보존한 뒤 Scanner source·charset·delimiter·token·line·locale·radix·mismatch token 잔존·EOF·blocking·close ownership, conditional expression type와 선택 평가, if/else definite assignment와 경계표, 음수 나머지, Unicode code point 분류, line-first validation loop와 의존성 주입을 공식 문서 기반 재구성으로 보완합니다. 오류 출력은 raw 입력 대신 stable reason code와 허용 범위만 남겨 개인정보와 secret 노출을 막습니다.",
  objectives: [
    "Scanner의 input source·charset·delimiter·locale·radix 상태가 next/nextLine/nextInt 결과에 미치는 영향을 설명할 수 있다.",
    "token method와 line method를 섞었을 때 남는 줄바꿈을 위치 관점에서 재현하고 일관된 읽기 전략을 선택할 수 있다.",
    "InputMismatchException·NoSuchElementException·closed scanner를 구분하고 문제 token을 소비하는 유한 재시도와 EOF 종료를 구현할 수 있다.",
    "조건 연산자를 값 expression으로 사용하고 if/else와의 선택 기준, type 결정, 선택된 피연산자만 평가되는 규칙을 설명할 수 있다.",
    "점수·할인 코드·근무시간을 decision table로 검증해 invalid와 정상 else를 분리하고 음수 홀짝도 정확히 판정할 수 있다.",
    "charAt(0)의 UTF-16 한계를 설명하고 한 code point 입력을 검증해 Character API로 Unicode 대소문자를 분류할 수 있다.",
    "Scanner와 PrintStream을 주입한 CLI core를 deterministic input/output으로 테스트하고 privacy-safe reason code를 설계할 수 있다.",
  ],
  prerequisites: [
    { title: "연산자와 평가 순서", reason: "나머지·비교·논리 연산자의 값과 short-circuit 평가 순서를 알아야 조건식의 결과와 부작용을 정확히 추적할 수 있습니다.", sessionSlug: "java-04-operators" },
  ],
  keywords: ["Scanner", "System.in", "token", "delimiter", "nextLine", "nextInt", "locale", "radix", "InputMismatchException", "NoSuchElementException", "EOF", "resource ownership", "conditional operator", "ternary", "if", "else", "boundary value", "negative parity", "Unicode code point", "Character", "OptionalInt", "dependency injection", "privacy-safe error"],
  chapters: [
    {
      id: "five-source-golden-evidence",
      title: "다섯 원본의 active code와 고정 stdin·stdout을 먼저 증거로 분리합니다",
      lead: "주석에 적힌 API와 실제 실행된 API를 섞지 않고 원본 그대로의 성공과 실패 범위를 기록합니다.",
      explanations: [
        "Ex01은 Scanner를 쓰지 않고 true/false, 홀짝, 합격, 할인, 근무시간, ASCII 대문자와 두 수의 최대값을 조건 연산자로 선택합니다. k1·k2·time을 여러 번 대입하지만 마지막 값 15·100·4만 출력에 기여합니다.",
        "Ex02의 active input은 nextLine 한 번뿐입니다. 주석의 nextInt·nextDouble·next는 실행 evidence가 아니며 'next는 단어를 받는다'는 설명도 정확히는 delimiter로 나눈 token을 받는다는 뜻입니다.",
        "Ex03은 -3과 79를 넣으면 홀수·불합격, -4와 80을 넣으면 짝수·합격입니다. 80은 inclusive 경계이고 n%2==0은 음수 짝수에도 맞습니다.",
        "Ex04는 이름을 nextLine으로 먼저 읽고 점수 세 개를 nextInt로 읽어 현재 순서에서는 newline 혼합 문제가 없습니다. 홍 길동·100·90·80 입력의 총점은 270, 평균은 90.0이며 마지막 출력에는 newline이 없습니다.",
        "Ex07은 -4·80·2·Z·9로 짝수·합격·10% 할인·대문자·초과근무 급여 98040.0을 출력합니다. 반면 1·999·9·😀·-2도 예외 없이 합격·정상가·기타 문자·-20640.0으로 처리해 domain validation 부재를 드러냅니다.",
        "원본 다섯 파일에는 locale·custom delimiter·nextInt 뒤 nextLine·mismatch recovery·EOF guard·close ownership·Unicode code point가 실행되지 않습니다. 이후 예제는 원본인 것처럼 포장하지 않고 Java SE/JLS 기반 재구성으로 표시합니다.",
      ],
      concepts: [
        { term: "golden evidence", definition: "특정 source·JDK·입력에서 관찰한 exit code와 stdout을 변경 감지 기준으로 보존한 기록입니다.", detail: ["prompt와 빈 줄도 계약입니다.", "설명보다 실행을 먼저 고정합니다."] },
        { term: "active code", definition: "주석이 아니라 compiler가 실제로 compile하고 JVM이 실행하는 문장입니다.", detail: ["comment-only API는 보완 범위입니다.", "마지막 대입만 살아 있을 수 있습니다."] },
        { term: "domain validity", definition: "문법적으로 int로 읽힌 값을 업무가 허용하는 범위와 코드 집합으로 다시 확인하는 단계입니다.", detail: ["parse 성공과 다릅니다.", "999점과 음수 시간이 반례입니다."] },
      ],
      codeExamples: [
        {
          id: "java-original-scanner-if-golden",
          title: "다섯 main을 clean classes와 고정 stdin으로 실행해 한 줄 summary로 비교합니다",
          language: "powershell",
          filename: "verify-original-scanner-if.ps1",
          purpose: "원본 provenance와 이후 reconstructed examples를 분리하고 prompt를 포함한 실제 stdout을 고정합니다.",
          code: String.raw`$src = "src\com\ictedu\day04"
$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("java05-golden-" + [guid]::NewGuid().ToString("N"))
$out = Join-Path $root "classes"
$files = @("$src\Ex01.java", "$src\Ex02.java", "$src\Ex03.java", "$src\Ex04.java", "$src\Ex07.java")

if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
New-Item -ItemType Directory -Path $out -ErrorAction Stop | Out-Null
try {
  javac -encoding UTF-8 -Xlint:all -d $out $files
  if ($LASTEXITCODE -ne 0) { throw "compile failed" }

  function Summary([string] $simple, [string[]] $inputLines) {
    if ($inputLines.Count -eq 0) { $lines = & java -cp $out "com.ictedu.day04.$simple" }
    else { $lines = $inputLines | & java -cp $out "com.ictedu.day04.$simple" }
    if ($LASTEXITCODE -ne 0) { throw "run failed: $simple" }
    "$simple=$($lines -join '|')"
  }

  Summary "Ex01" @()
  Summary "Ex02" @("홍 길동")
  Summary "Ex03" @("-3", "79")
  Summary "Ex04" @("홍 길동", "100", "90", "80")
  Summary "Ex07" @("-4", "80", "2", "Z", "9")
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  $parent = [IO.Path]::GetDirectoryName($resolved)
  if (-not [string]::Equals($parent, $base, [StringComparison]::OrdinalIgnoreCase)) {
    throw "unsafe cleanup boundary"
  }
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}`,
          walkthrough: [
            { lines: "1-10", explanation: "system temp 바로 아래에 GUID create-new root와 classes directory를 만들고 원본 다섯 파일을 UTF-8·Xlint로 compile합니다." },
            { lines: "12-17", explanation: "stdin lines를 native process에 전달하고 실제 stdout lines를 pipe로 연결합니다." },
            { lines: "19-23", explanation: "각 main에 검증된 synthetic 입력을 주며 Ex01은 입력 없이 실행합니다." },
            { lines: "24-32", explanation: "finally는 resolved parent가 system temp base와 정확히 같은지 확인한 뒤 생성한 GUID root만 제거합니다." },
          ],
          run: { environment: ["PowerShell 7+", "Temurin JDK 21.0.11", "javastudy MyJavaProject root"], command: "pwsh -NoProfile -File verify-original-scanner-if.ps1" },
          output: {
            value: "Ex01=홀수|짝수|홀수|합격|900|41280|대문자 아님|1900년대 태어남|14|14\nEx02=이름 : 받은 정보 : 홍 길동\nEx03=숫자 입력 : 결과 : 홀수|점수 입력 : 결과 : 불합격\nEx04=이름 입력 : 국어점수 입력 : 수학점수 입력 : 영어점수 입력 : 이름 : 홍 길동, 총점 : 270, 평균 : 90.0\nEx07=k1이 홀수인지 짝수인지 판별하자.|k1 입력 : k1은 짝수다.|k2이 80이상이면 합격 아니면 불합격이다.|k2 입력 : k2는 합격이다.|k3가 1또는 2이면 가격에 할인(10%)한다.(얼마에 살 수 있나)|k3 입력 : 가격은 13500.0이다.|k4가 대문자인지 소문자인지 판별하자.|k4 입력 : k4는 대문자이다.|근무시간이 8시간까지는 시간당 10320이고 8시간 초과한 시간 만큼은 1.5배 지급한다. scan을 이용해서 근무시간을 받자. 얼마를 받아야 하는가?|근무시간 입력 : 근무한 시간이 9시간일때 98040.0를 받아야 한다.",
            explanation: ["Temurin JDK 21.0.11에서 compile/run exit는 모두 0이고 Xlint warning과 stderr는 없습니다.", "이 line summary는 prompt와 text sequence를 검증하며 마지막 line terminator 유무는 보장 범위에 포함하지 않습니다."],
          },
          experiments: [
            { change: "Ex03 stdin을 abc와 80으로 바꿉니다.", prediction: "첫 nextInt에서 InputMismatchException과 nonzero exit가 납니다.", result: "원본은 실패를 사용자 상태로 변환하지 않습니다." },
            { change: "Ex04 점수를 -1·101·300으로 바꿉니다.", prediction: "총점 400과 평균 133.33333333333334를 정상 출력합니다.", result: "parse success 뒤 range validation이 필요합니다." },
            { change: "Ex07 근무시간을 -2로 바꿉니다.", prediction: "급여 -20640.0이 출력됩니다.", result: "invalid를 정상 else branch에 넣으면 안 됩니다." },
          ],
          sourceRefs: ["java-conditional-source", "java-scanner-line-source", "java-scanner-conditional-source", "java-score-average-source", "java-if-boundary-source", "jdk21-javac"],
        },
      ],
      diagnostics: [
        { symptom: "문서가 nextInt/nextDouble 예제라고 하지만 실행 결과에는 이름 한 줄만 보인다.", likelyCause: "주석 처리된 코드와 active code를 같은 evidence로 취급했습니다.", checks: ["주석 기호와 실제 method call을 확인합니다.", "고정 stdin으로 main을 실행합니다.", "source별 stdout을 분리합니다."], fix: "원본은 nextLine evidence로 기록하고 token API는 공식 재구성 예제로 보완합니다.", prevention: "sourceCoverage에 filesRead/filesUsed와 uncoveredNotes를 유지합니다." },
      ],
    },
    {
      id: "scanner-source-charset-state",
      title: "Scanner는 키보드 자체가 아니라 문자 source 위에 token parsing 상태를 얹는 객체입니다",
      lead: "source·charset·delimiter·locale·radix와 현재 위치를 하나의 mutable parser state로 봅니다.",
      explanations: [
        "Scanner는 InputStream, Readable, Path, String 등 여러 source를 받을 수 있습니다. System.in은 그중 프로세스 표준 입력 stream일 뿐이며 테스트에서는 String source로 같은 parser behavior를 재현할 수 있습니다.",
        "InputStream constructor는 bytes를 chars로 decode합니다. 외부 byte protocol이면 Scanner(InputStream, Charset)처럼 charset을 명시해 OS default drift를 제거합니다.",
        "Scanner는 source를 복사해 두는 단순 collection이 아니라 현재 읽기 위치를 전진시키는 stateful cursor입니다. 한 method가 소비한 범위와 남긴 delimiter가 다음 method 결과를 바꿉니다.",
        "hasNext와 next 계열은 입력을 기다리며 block할 수 있습니다. 콘솔에서는 정상이어도 server event loop나 GUI thread에서 직접 호출하면 전체 응답성을 막을 수 있습니다.",
        "Scanner는 외부 동기화 없이 thread-safe하지 않습니다. 하나의 instance를 여러 thread가 공유하지 말고 입력 전담 경계에서 순차 사용합니다.",
      ],
      concepts: [
        { term: "input source", definition: "Scanner가 문자를 얻는 InputStream·Readable·String·Path 같은 공급자입니다.", detail: ["System.in과 Scanner를 구분합니다.", "source 수명이 ownership을 결정합니다."] },
        { term: "cursor state", definition: "다음 검색을 시작할 입력 위치와 parser 설정을 포함한 Scanner의 변경 가능한 상태입니다.", detail: ["읽을 때 전진합니다.", "method 혼합 결과를 설명합니다."] },
        { term: "charset boundary", definition: "byte source를 Unicode 문자로 decode하는 규칙입니다.", detail: ["delimiter 이전 단계입니다.", "명시하면 환경 drift가 줄어듭니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "같은 byte 입력의 한글이 환경에 따라 깨진다.", likelyCause: "InputStream Scanner가 default charset에 의존합니다.", checks: ["source가 byte인지 char인지 봅니다.", "Charset.defaultCharset과 실제 protocol encoding을 확인합니다.", "UTF-8 fixture를 같은 방식으로 decode합니다."], fix: "byte source constructor에 StandardCharsets.UTF_8 같은 합의된 charset을 명시합니다.", prevention: "입력 protocol·source owner·charset을 API 계약과 테스트 이름에 적습니다." },
      ],
      expertNotes: ["대량 batch parsing에서는 Scanner regex와 locale 지원 비용을 측정하고 BufferedReader·전용 parser와 비교합니다.", "interactive blocking input을 request-handling thread에 직접 연결하지 않습니다."],
    },
    {
      id: "scanner-token-delimiter",
      title: "next는 단어가 아니라 delimiter 사이의 complete token을 반환합니다",
      lead: "default whitespace와 custom regex delimiter가 token 경계를 어떻게 만드는지 직접 출력합니다.",
      explanations: [
        "기본 delimiter는 Character.isWhitespace가 인식하는 공백을 나타내는 regex이며 JDK 21 Scanner에서 delimiter pattern은 \\p{javaWhitespace}+로 관찰됩니다.",
        "next는 delimiter를 건너뛴 다음 complete token을 반환합니다. 사람 이름의 '단어' 여부나 CSV quoting을 이해하지 않으므로 Kim Min Su는 세 token입니다.",
        "useDelimiter는 regex를 받습니다. 쉼표 주변 공백을 허용하려면 \\s*,\\s*처럼 규칙을 명시할 수 있지만 quoted comma·escape가 있는 진짜 CSV에는 CSV parser가 필요합니다.",
        "delimiter pattern 모양에 따라 empty token이 생길 수 있습니다. 한 문자만 소비하는 delimiter와 연속 구분자를 한 번에 소비하는 + pattern의 차이를 테스트합니다.",
        "nextLine과 findInLine 같은 line/search method는 token delimiter와 다른 규칙을 사용합니다. custom delimiter를 설정했다고 모든 method가 그 경계를 따르지는 않습니다.",
        "아래 TrackingInput은 아직 객체지향 세션을 보지 않은 독자를 위한 필수 작성 과제가 아니라 close 전파만 관찰하는 격리된 test fixture입니다. `extends`는 ByteArrayInputStream 기능을 물려받고, `@Override` method는 close 호출을 기록하며, try-with-resources는 block 종료 때 resource를 닫습니다.",
      ],
      concepts: [
        { term: "token", definition: "현재 delimiter pattern 사이에서 Scanner가 인식한 complete input 조각입니다.", detail: ["언어학적 단어가 아닙니다.", "numeric method가 다시 해석합니다."] },
        { term: "delimiter pattern", definition: "token 사이를 구분하고 건너뛸 정규식입니다.", detail: ["기본은 whitespace입니다.", "custom 규칙은 format 계약입니다."] },
        { term: "complete token", definition: "delimiter나 EOF로 끝이 확인되어 next가 반환할 수 있는 token입니다.", detail: ["interactive input에서 더 기다릴 수 있습니다.", "hasNext도 block할 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "java-scanner-modes-lab",
          title: "delimiter·line·locale·mismatch·EOF·close를 하나의 deterministic source에서 관찰합니다",
          language: "java",
          filename: "src/learning/java05/ScannerModesLab.java",
          purpose: "원본에 없는 Scanner 상태 계약을 Java SE 21 API 기반 exact example로 재구성합니다.",
          code: String.raw`package learning.java05;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.InputMismatchException;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.Scanner;

public class ScannerModesLab {
    private static final class TrackingInput extends ByteArrayInputStream {
        private boolean closed;

        TrackingInput(byte[] bytes) { super(bytes); }

        @Override
        public void close() throws IOException {
            closed = true;
            super.close();
        }
    }

    public static void main(String[] args) {
        try (Scanner mixed = new Scanner("42\nhello world\n")) {
            System.out.println("delimiter=" + mixed.delimiter());
            System.out.println("int=" + mixed.nextInt());
            System.out.println("rest=<" + mixed.nextLine() + ">");
            System.out.println("line=<" + mixed.nextLine() + ">");
        }

        try (Scanner csv = new Scanner("10, 20,30").useDelimiter("\\s*,\\s*")) {
            System.out.println("csv=" + csv.nextInt() + "," + csv.nextInt() + "," + csv.nextInt());
        }

        try (Scanner locale = new Scanner("1,5").useLocale(Locale.GERMANY)) {
            System.out.println("locale=" + locale.nextDouble());
        }

        try (Scanner mismatch = new Scanner("oops 42")) {
            try { mismatch.nextInt(); }
            catch (InputMismatchException error) { System.out.println("mismatch=INVALID_INTEGER"); }
            System.out.println("bad=<" + mismatch.next() + ">");
            System.out.println("recovered=" + mismatch.nextInt());
        }

        try (Scanner eof = new Scanner("")) {
            System.out.println("hasLine=" + eof.hasNextLine());
            try { eof.nextLine(); }
            catch (NoSuchElementException error) { System.out.println("eof=END_OF_INPUT"); }
        }

        TrackingInput source = new TrackingInput("1".getBytes(StandardCharsets.UTF_8));
        Scanner owner = new Scanner(source, StandardCharsets.UTF_8);
        owner.close();
        System.out.println("sourceClosed=" + source.closed);
    }
}`,
          walkthrough: [
            { lines: "10-20", explanation: "TrackingInput subclass·override는 close ownership 관찰을 위한 고급 test fixture이며 Scanner token 규칙과 분리해 읽습니다." },
            { lines: "22-28", explanation: "try-with-resources는 block 끝에 Scanner를 자동 close합니다. nextInt 뒤 nextLine이 남은 빈 부분을 반환하고 다음 nextLine이 실제 다음 줄을 반환합니다." },
            { lines: "30-36", explanation: "custom delimiter와 explicit locale이 token parse 방식을 바꿉니다." },
            { lines: "38-44", explanation: "InputMismatchException 뒤 문제 token이 남아 있어 next로 소비한 다음 42를 복구합니다." },
            { lines: "46-59", explanation: "EOF guard와 close가 underlying Closeable source까지 전파되는 사실을 reason code와 boolean으로 확인합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "Temurin JDK 21.0.11", "UTF-8 source"], command: "javac -encoding UTF-8 -Xlint:all -d build/classes src/learning/java05/ScannerModesLab.java && java -cp build/classes learning.java05.ScannerModesLab" },
          output: {
            value: "delimiter=\\p{javaWhitespace}+\nint=42\nrest=<>\nline=<hello world>\ncsv=10,20,30\nlocale=1.5\nmismatch=INVALID_INTEGER\nbad=<oops>\nrecovered=42\nhasLine=false\neof=END_OF_INPUT\nsourceClosed=true",
            explanation: ["token·line·locale·mismatch·EOF는 서로 다른 상태 전이입니다.", "raw bad token은 교육 관찰용으로만 출력하며 production error에는 포함하지 않습니다."],
          },
          experiments: [
            { change: "Locale.GERMANY를 Locale.ROOT로 바꾸고 1,5를 유지합니다.", prediction: "hasNextDouble이 false이거나 nextDouble이 InputMismatchException을 냅니다.", result: "numeric text protocol에는 locale 합의가 필요합니다." },
            { change: "delimiter를 쉼표로 둔 채 nextLine을 호출합니다.", prediction: "nextLine은 쉼표 delimiter를 무시하고 줄 끝까지 반환합니다.", result: "token API와 line API를 한 parser 흐름에서 섞지 않습니다." },
            { change: "mismatch catch 뒤 next를 제거합니다.", prediction: "다음 nextInt도 같은 oops에서 실패합니다.", result: "retry 전에 invalid input을 반드시 소비합니다." },
          ],
          sourceRefs: ["java-scanner-api", "java-input-mismatch-api", "java-locale-api", "java-system-api"],
        },
      ],
      diagnostics: [
        { symptom: "공백을 포함한 이름에서 첫 부분만 저장된다.", likelyCause: "next를 line input에 사용해 whitespace delimiter에서 token이 끝났습니다.", checks: ["입력 단위가 token인지 line인지 정합니다.", "현재 delimiter를 출력합니다.", "공백·탭·한글 이름 fixture를 실행합니다."], fix: "한 줄 전체가 값이면 nextLine을 사용하고 빈 줄·trim 정책을 별도로 검증합니다.", prevention: "field별 input grammar와 Scanner method를 표로 고정합니다." },
      ],
      comparisons: [
        { title: "token과 line 읽기 선택", options: [
          { name: "next/nextInt", chooseWhen: "whitespace 또는 명시 delimiter로 나눈 단순 token protocol일 때", avoidWhen: "공백 포함 문장·quoted CSV·원자적 line 재시도가 필요할 때", tradeoffs: ["typed parse가 편합니다.", "delimiter와 locale 상태에 결합됩니다."] },
          { name: "nextLine + parse", chooseWhen: "한 prompt의 응답을 한 줄 record로 소비하고 오류 시 줄 전체를 버릴 때", avoidWhen: "매우 큰 delimiter 기반 stream을 token 단위로 처리할 때", tradeoffs: ["retry와 EOF가 명확합니다.", "직접 trim·parse·range 검증이 필요합니다."] },
        ] },
      ],
    },
    {
      id: "scanner-line-boundary",
      title: "nextLine은 다음 token이 아니라 현재 위치에서 줄 끝까지를 반환합니다",
      lead: "newline을 '먹는다'는 암기 대신 cursor 앞뒤의 남은 문자를 그립니다.",
      explanations: [
        "nextInt는 앞 delimiter를 건너뛰고 숫자 token을 소비하지만 token 뒤 line separator까지 반드시 소비하는 API가 아닙니다. 바로 nextLine을 호출하면 숫자 뒤 남은 빈 구간을 반환할 수 있습니다.",
        "예제의 int=42 다음 rest=<>가 그 증거이고 두 번째 nextLine에서 hello world가 나옵니다. 버그가 아니라 각 method 계약을 섞은 결과입니다.",
        "해결책 하나는 nextInt 뒤 남은 line을 의도적으로 한 번 소비하는 것입니다. 다만 field가 늘면 누락하기 쉬워 모든 prompt를 nextLine으로 받고 parse하는 전략이 더 단순할 수 있습니다.",
        "Ex04는 name line을 먼저 읽고 이후 숫자 token만 읽으므로 현재 코드에는 이 증상이 없습니다. 순서를 숫자→이름으로 바꾸면 regression test가 필요합니다.",
        "빈 line은 항상 오류가 아닙니다. 사용자가 Enter만 친 것인지 이전 token 뒤 남은 빈 부분인지 위치와 prompt 단계로 구분해야 합니다.",
      ],
      concepts: [
        { term: "line separator", definition: "한 줄의 끝을 나타내며 nextLine이 건너뛰지만 반환 문자열에는 포함하지 않는 문자 sequence입니다.", detail: ["OS별 표현이 다를 수 있습니다.", "Scanner가 line pattern으로 처리합니다."] },
        { term: "remaining line", definition: "현재 cursor부터 다음 line separator 전까지 아직 소비되지 않은 문자입니다.", detail: ["빈 문자열일 수 있습니다.", "nextLine 결과가 됩니다."] },
        { term: "line-first strategy", definition: "각 prompt 응답을 nextLine으로 한 번 소비한 뒤 원하는 type으로 parse하는 입력 방식입니다.", detail: ["retry 단위가 line입니다.", "문법과 범위를 분리합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "숫자 입력 직후 이름이 빈 문자열이 된다.", likelyCause: "nextInt 뒤 남은 줄 끝을 nextLine이 빈 remaining line으로 반환했습니다.", checks: ["직전 method와 cursor 위치를 적습니다.", "빈 문자열을 angle brackets로 출력합니다.", "입력 순서를 바꾼 regression test를 실행합니다."], fix: "남은 line을 명시 소비하거나 전체 flow를 line-first parse로 통일합니다.", prevention: "하나의 form flow에서 token/line API를 임의로 섞지 않습니다." },
      ],
    },
    {
      id: "scanner-locale-radix-numeric",
      title: "nextInt·nextDouble은 Java literal parser가 아니라 Scanner locale·radix 문법으로 token을 해석합니다",
      lead: "사용자 지역 형식과 기계 protocol 형식을 선택하지 않으면 같은 text가 환경별로 달라집니다.",
      explanations: [
        "Scanner의 초기 locale은 Locale.getDefault(Locale.Category.FORMAT)이며 decimal separator와 grouping separator가 numeric token grammar에 참여합니다.",
        "독일 locale의 1,5는 1.5로 읽히지만 Locale.ROOT 기반 기계 입력은 1.5처럼 점을 사용합니다. 사용자가 보는 형식과 저장·테스트 protocol을 구분합니다.",
        "useRadix는 nextInt 등의 기본 radix를 바꿉니다. 메뉴 번호 같은 decimal input에 전역 radix를 바꾸기보다 필요한 field에서 explicit parse policy를 유지합니다.",
        "hasNextInt는 다음 token을 소비하지 않고 해석 가능성을 검사하지만 입력이 완성될 때까지 block할 수 있습니다. true 뒤에도 source 상태가 외부에서 바뀌는 concurrent 설계는 피합니다.",
        "numeric parse가 성공해도 NaN·Infinity, 점수 999, 음수 시간처럼 domain이 허용하지 않는 값은 별도 검증합니다. Scanner type parse는 업무 validation이 아닙니다.",
      ],
      concepts: [
        { term: "FORMAT locale", definition: "숫자·날짜 표시와 해석에 쓰이는 JVM 기본 지역 설정 범주입니다.", detail: ["Scanner 초기 locale에 사용됩니다.", "환경별로 달라질 수 있습니다."] },
        { term: "radix", definition: "정수 token의 숫자 체계를 정하는 밑입니다.", detail: ["기본은 10입니다.", "2·8·16 등으로 바꿀 수 있습니다."] },
        { term: "syntax validation", definition: "text가 선택한 locale·radix의 숫자 문법인지 검사하는 단계입니다.", detail: ["range와 다릅니다.", "domain validation보다 앞입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "테스트에서는 1.5가 되는데 사용자 PC에서 nextDouble이 실패한다.", likelyCause: "Scanner가 서로 다른 FORMAT locale을 사용합니다.", checks: ["scanner.locale을 기록합니다.", "decimal/group separator를 확인합니다.", "ROOT와 사용자 locale fixture를 모두 실행합니다."], fix: "기계 protocol은 Locale.ROOT, localized UI는 합의된 user locale을 명시합니다.", prevention: "locale을 process ambient state가 아니라 constructor/config input으로 다룹니다." },
      ],
    },
    {
      id: "scanner-mismatch-eof-retry",
      title: "잘못된 token과 EOF는 같은 실패가 아니며 retry는 반드시 입력을 전진시켜야 합니다",
      lead: "예외를 catch하는 것보다 실패 후 cursor를 어디로 옮길지가 더 중요합니다.",
      explanations: [
        "nextInt가 숫자로 해석할 수 없는 token을 만나면 InputMismatchException을 던지고 그 token을 지나가지 않습니다. 같은 nextInt를 반복하면 같은 자리에서 다시 실패합니다.",
        "token 기반 retry라면 next 또는 nextLine으로 invalid input을 소비해야 합니다. line-first 방식은 이미 한 줄을 소비한 뒤 parse하므로 retry가 자연스럽게 다음 줄로 진행합니다.",
        "EOF에서 nextLine은 NoSuchElementException을 던질 수 있고 원본 Ex02는 빈 stdin에서 'No line found'로 종료됐습니다. hasNextLine/hasNextInt로 정상 종료 상태를 먼저 확인합니다.",
        "EOF는 사용자가 입력 stream을 닫은 정상 종료일 수 있습니다. 무한히 다시 prompt하거나 stack trace를 사용자에게 보이지 말고 Optional/Result의 empty 상태로 상위 flow에 전달합니다.",
        "다만 Scanner는 underlying Readable의 IOException을 EOF처럼 처리하고 ioException()에 보관할 수 있습니다. hasNextLine이 false일 때 ioException을 먼저 확인해 INPUT_IO_ERROR와 clean END_OF_INPUT을 구분합니다.",
        "raw token을 exception message나 telemetry에 그대로 넣으면 이름·식별자·secret이 노출될 수 있습니다. INVALID_INTEGER·OUT_OF_RANGE·END_OF_INPUT 같은 reason code와 field·bound만 기록합니다.",
        "아래 `while (true)`는 success나 clean/error 종료가 나올 때까지 한 line씩 반복합니다. `try/catch`는 parse 실패를 reason code로 바꾸고 OptionalInt는 성공 int가 있거나 없다는 두 상태만 표현합니다. 이 세 문법의 심화는 반복·예외·API 세션에서 다시 배우며 여기서는 입력 cursor가 매회 전진하는 흐름에 집중합니다.",
      ],
      concepts: [
        { term: "mismatch token", definition: "요청한 type grammar에 맞지 않아 Scanner가 소비하지 않고 남겨 둔 다음 token입니다.", detail: ["retry 전에 처리해야 합니다.", "raw logging은 피합니다."] },
        { term: "EOF", definition: "source에서 더 읽을 문자가 없다는 상태입니다.", detail: ["예외만이 아니라 종료 신호입니다.", "hasNext 계열로 확인합니다."] },
        { term: "progress invariant", definition: "retry loop의 각 반복이 성공·종료하거나 최소 한 input unit을 소비해야 한다는 규칙입니다.", detail: ["무한 반복을 막습니다.", "line-first에서 증명하기 쉽습니다."] },
      ],
      codeExamples: [
        {
          id: "java-validated-line-cli",
          title: "한 줄씩 소비해 syntax·range·EOF를 stable reason code로 분류합니다",
          language: "java",
          filename: "src/learning/java05/ValidatedLineCli.java",
          purpose: "원본의 uncaught exception과 범위 누락을 testable line-first boundary로 재구성합니다.",
          code: String.raw`package learning.java05;

import java.io.PrintStream;
import java.util.OptionalInt;
import java.util.Scanner;

public class ValidatedLineCli {
    static OptionalInt readIntInRange(
            Scanner input, PrintStream output, String label, int min, int max) {
        while (true) {
            output.print(label + ": ");
            if (!input.hasNextLine()) {
                if (input.ioException() != null) {
                    output.println("INPUT_IO_ERROR");
                    return OptionalInt.empty();
                }
                output.println("END_OF_INPUT");
                return OptionalInt.empty();
            }

            String line = input.nextLine().strip();
            final int value;
            try {
                value = Integer.parseInt(line);
            } catch (NumberFormatException error) {
                output.println("INVALID_INTEGER");
                continue;
            }

            if (value < min || value > max) {
                output.println("OUT_OF_RANGE[" + min + ".." + max + "]");
                continue;
            }
            return OptionalInt.of(value);
        }
    }

    static void run(Scanner input, PrintStream output) {
        OptionalInt score = readIntInRange(input, output, "score", 0, 100);
        if (score.isPresent()) output.println("ACCEPTED=" + score.getAsInt());
    }

    public static void main(String[] args) {
        try (Scanner retry = new Scanner("oops\n101\n80\n")) {
            run(retry, System.out);
        }
        try (Scanner eof = new Scanner("")) {
            run(eof, System.out);
        }
    }
}`,
          walkthrough: [
            { lines: "8-18", explanation: "prompt 뒤 hasNextLine이 false면 ioException을 먼저 검사해 INPUT_IO_ERROR와 clean END_OF_INPUT을 분리하고 empty OptionalInt로 종료합니다." },
            { lines: "20-32", explanation: "한 line을 소비한 뒤 try/catch로 syntax와 range를 분리해 실패해도 다음 반복이 전진합니다." },
            { lines: "35-39", explanation: "Scanner와 PrintStream을 parameter로 받고 OptionalInt는 accepted value의 존재 여부를 명시합니다." },
            { lines: "41-48", explanation: "try-with-resources와 고정 String source로 invalid→out-of-range→accepted와 즉시 EOF를 재현합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "Temurin JDK 21.0.11"], command: "javac -encoding UTF-8 -Xlint:all -d build/classes src/learning/java05/ValidatedLineCli.java && java -cp build/classes learning.java05.ValidatedLineCli" },
          output: {
            value: "score: INVALID_INTEGER\nscore: OUT_OF_RANGE[0..100]\nscore: ACCEPTED=80\nscore: END_OF_INPUT",
            explanation: ["raw oops와 101을 오류 메시지에 복제하지 않아 telemetry가 privacy-safe합니다.", "각 실패는 한 line을 소비하므로 무한 retry가 없습니다."],
          },
          experiments: [
            { change: "continue 전에 nextLine 호출을 한 번 더 추가합니다.", prediction: "유효한 다음 줄까지 버려 80을 건너뛸 수 있습니다.", result: "line-first에서는 이미 line을 소비했으므로 추가 소비하지 않습니다." },
            { change: "입력을 공백만 있는 줄로 바꿉니다.", prediction: "strip 뒤 empty text가 INVALID_INTEGER가 됩니다.", result: "blank를 missing과 같은지 별도 reason으로 나눌 수 있습니다." },
            { change: "error message에 line을 연결합니다.", prediction: "테스트는 쉬워도 실제 입력 PII·secret이 log에 남을 수 있습니다.", result: "field와 reason code만 기록합니다." },
            { change: "read에서 IOException을 던지는 custom Readable을 연결합니다.", prediction: "hasNextLine은 false가 되고 ioException이 남아 INPUT_IO_ERROR를 출력합니다.", result: "underlying I/O failure를 clean EOF로 숨기지 않습니다." },
          ],
          sourceRefs: ["java-scanner-api", "java-integer-api", "java-optional-int-api", "jls-definite-assignment"],
        },
      ],
      diagnostics: [
        { symptom: "잘못된 숫자를 입력한 뒤 같은 오류 메시지가 끝없이 반복된다.", likelyCause: "InputMismatchException을 catch했지만 offending token을 소비하지 않았습니다.", checks: ["loop 한 번마다 cursor가 전진하는지 봅니다.", "catch 뒤 next/nextLine 호출을 확인합니다.", "EOF branch가 있는지 봅니다."], fix: "token 방식은 invalid token을 소비하고, 가능하면 line-first parse로 retry unit을 고정합니다.", prevention: "invalid-invalid-valid와 invalid-EOF fixture로 progress invariant를 테스트합니다." },
      ],
    },
    {
      id: "scanner-close-ownership",
      title: "close는 lint를 만족시키는 의식이 아니라 source 소유권을 끝내는 동작입니다",
      lead: "Scanner를 만든 코드와 underlying source를 소유한 코드가 항상 같지는 않습니다.",
      explanations: [
        "Scanner.close는 source가 Closeable이면 source도 닫습니다. System.in은 프로세스 공유 InputStream이므로 한 helper가 Scanner를 닫으면 이후 입력 consumer가 EOF처럼 실패할 수 있습니다.",
        "파일 Path를 열어 Scanner를 만든 함수는 일반적으로 그 Scanner를 try-with-resources로 닫아야 합니다. 반대로 parameter로 전달받은 Scanner는 caller가 수명을 관리하므로 callee가 닫지 않습니다.",
        "CLI main에서 System.in wrapper를 프로세스 끝에 닫는 것은 단독 프로그램에서는 무해할 수 있지만 library·test runner·여러 command가 같은 JVM을 쓰면 수명 충돌이 납니다. 정책을 의도적으로 기록합니다.",
        "닫힌 Scanner의 hasNext/next 호출은 IllegalStateException을 냅니다. EOF와 CLOSED를 같은 사용자 재입력 상태로 처리하지 않습니다.",
        "try-with-resources는 ownership이 명확한 resource에 적용합니다. 정적 분석 경고를 없애기 위해 borrowed source까지 닫는 것은 올바른 수정이 아닙니다.",
      ],
      concepts: [
        { term: "resource owner", definition: "resource를 생성하거나 수명 종료 책임을 명시적으로 넘겨받은 주체입니다.", detail: ["owner가 close합니다.", "borrower는 close하지 않습니다."] },
        { term: "borrowed Scanner", definition: "다른 계층이 소유하며 현재 함수가 일시적으로 읽기만 하는 Scanner입니다.", detail: ["dependency injection에 유용합니다.", "callee close를 금지합니다."] },
        { term: "closed state", definition: "Scanner.close 뒤 더 이상 scanning operation을 허용하지 않는 상태입니다.", detail: ["EOF와 다릅니다.", "IllegalStateException이 납니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "첫 메뉴는 입력되지만 두 번째 메뉴의 새 Scanner는 즉시 EOF가 된다.", likelyCause: "첫 Scanner.close가 공유 System.in을 닫았습니다.", checks: ["모든 Scanner(System.in) 생성·close 위치를 찾습니다.", "underlying source owner를 표시합니다.", "같은 JVM에서 두 command를 연속 실행합니다."], fix: "애플리케이션 입력 경계에 하나의 Scanner를 두고 하위 함수에는 borrowed dependency로 전달합니다.", prevention: "ownership annotation·API 문서와 sequential command integration test를 둡니다." },
      ],
    },
    {
      id: "conditional-expression-value-type",
      title: "조건 연산자는 두 문장을 실행하는 문법이 아니라 선택된 expression의 값을 만듭니다",
      lead: "'양쪽 타입이 같아야 한다'는 암기 대신 boolean·numeric·reference conditional type 규칙을 구분합니다.",
      explanations: [
        "`condition ? whenTrue : whenFalse`에서 첫 operand는 boolean/Boolean이어야 하며 true면 두 번째, false면 세 번째 expression만 평가합니다. 미선택 expression의 side effect와 exception은 발생하지 않습니다.",
        "Ex01의 '참과 거짓 결과가 같은 자료형이어야 한다'는 지나친 단순화입니다. `Object value = flag ? 10 : \"짝수\"`는 boxing과 reference type 결정을 거쳐 compile됩니다.",
        "numeric conditional에는 int constant와 char 같은 특례가 있어 `char c = true ? 67 : 'A'`가 C가 됩니다. 반면 String target에 int/String branches를 직접 넣으면 type mismatch입니다.",
        "조건 연산자는 value 선택에 적합합니다. branch마다 여러 문장, logging, mutation이 필요하면 if/else가 evaluation과 debugging을 더 명확하게 드러냅니다.",
        "중첩 conditional은 오른쪽 결합이지만 사람이 경계를 읽기 어렵습니다. 두 단계 이상 정책은 named method나 if/else-if로 옮깁니다.",
      ],
      concepts: [
        { term: "conditional expression", definition: "boolean 조건에 따라 두 expression 중 하나의 값을 산출하는 expression입니다.", detail: ["statement가 아닙니다.", "선택된 operand만 평가합니다."] },
        { term: "poly expression", definition: "assignment·invocation 같은 target context가 reference conditional type 결정에 참여하는 expression입니다.", detail: ["JLS 15.25 규칙입니다.", "same type 규칙보다 정확합니다."] },
        { term: "selection evaluation", definition: "조건을 먼저 평가하고 선택된 한쪽 operand만 평가하는 순서입니다.", detail: ["exception 회피가 가능합니다.", "side effect 의존은 피합니다."] },
      ],
      codeExamples: [
        {
          id: "java-decision-boundary-lab",
          title: "조건 연산자 type·선택 평가, 음수 parity, 점수 경계와 Unicode를 함께 검증합니다",
          language: "java",
          filename: "src/learning/java05/DecisionBoundaryLab.java",
          purpose: "원본의 정상 분기를 공식 JLS·Character 계약과 invalid 경계까지 확장합니다.",
          code: String.raw`package learning.java05;

public class DecisionBoundaryLab {
    private static int failIfCalled() { throw new IllegalStateException("UNSELECTED"); }

    private static String parity(int value) {
        return value % 2 == 0 ? "EVEN" : "ODD";
    }

    private static String score(int value) {
        if (value < 0 || value > 100) return "INVALID";
        return value >= 80 ? "PASS" : "FAIL";
    }

    private static String discount(int code) {
        return code == 1 || code == 2 ? "DISCOUNT" : "INVALID";
    }

    private static String payForHours(int hours) {
        if (hours < 0 || hours > 24) return "INVALID";
        int pay = hours <= 8
                ? hours * 10_320
                : 8 * 10_320 + (hours - 8) * 15_480;
        return Integer.toString(pay);
    }

    private static String letterKind(String token) {
        if (token.codePointCount(0, token.length()) != 1) return "INVALID_LENGTH";
        int codePoint = token.codePointAt(0);
        if (Character.isUpperCase(codePoint)) return "UPPER";
        if (Character.isLowerCase(codePoint)) return "LOWER";
        return "OTHER";
    }

    public static void main(String[] args) {
        Object first = true ? 10 : "짝수";
        Object second = false ? 10 : "짝수";
        char numeric = true ? 67 : 'A';
        int selected = true ? 7 : failIfCalled();
        System.out.println("types=" + first.getClass().getSimpleName() + "," + second.getClass().getSimpleName());
        System.out.println("numeric=" + numeric + ",selected=" + selected);

        for (int value = -3; value <= 3; value++) {
            System.out.println("parity=" + value + ":" + parity(value) + ",rem=" + value % 2);
        }
        for (int value : new int[] { -1, 0, 79, 80, 100, 101 }) {
            System.out.println("score=" + value + ":" + score(value));
        }
        for (int code : new int[] { 0, 1, 2, 3 }) {
            System.out.println("discount=" + code + ":" + discount(code));
        }
        for (int hours : new int[] { -1, 0, 8, 9, 25 }) {
            System.out.println("hours=" + hours + ":" + payForHours(hours));
        }
        for (String token : new String[] { "Ω", "a", "😀", "AB" }) {
            System.out.println("letter=" + token + ":" + letterKind(token));
        }
    }
}`,
          walkthrough: [
            { lines: "4-24", explanation: "미선택 exception method, 음수에도 안전한 even predicate, validation-first score·discount code·0..24시간 급여 정책을 helper로 분리합니다." },
            { lines: "26-33", explanation: "UTF-16 length가 아니라 code point count를 검사하고 Character API로 분류합니다." },
            { lines: "36-41", explanation: "mixed branch target type, numeric conditional constant와 selected-only evaluation을 출력합니다." },
            { lines: "43-59", explanation: "배열 literal은 경계값 묶음이고 enhanced for는 각 값을 한 번씩 방문합니다. 아직 반복문을 배우지 않았다면 각 println을 펼쳐 써도 결과는 같습니다." },
            { lines: "60-62", explanation: "supplementary code point와 multiple code point를 같은 helper로 분류합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "Temurin JDK 21.0.11", "UTF-8 console"], command: "javac -encoding UTF-8 -Xlint:all -d build/classes src/learning/java05/DecisionBoundaryLab.java && java -cp build/classes learning.java05.DecisionBoundaryLab" },
          output: {
            value: "types=Integer,String\nnumeric=C,selected=7\nparity=-3:ODD,rem=-1\nparity=-2:EVEN,rem=0\nparity=-1:ODD,rem=-1\nparity=0:EVEN,rem=0\nparity=1:ODD,rem=1\nparity=2:EVEN,rem=0\nparity=3:ODD,rem=1\nscore=-1:INVALID\nscore=0:FAIL\nscore=79:FAIL\nscore=80:PASS\nscore=100:PASS\nscore=101:INVALID\ndiscount=0:INVALID\ndiscount=1:DISCOUNT\ndiscount=2:DISCOUNT\ndiscount=3:INVALID\nhours=-1:INVALID\nhours=0:0\nhours=8:82560\nhours=9:98040\nhours=25:INVALID\nletter=Ω:UPPER\nletter=a:LOWER\nletter=😀:OTHER\nletter=AB:INVALID_LENGTH",
            explanation: ["`value % 2 != 0` 의미의 ODD 분기는 음수 remainder -1도 포함합니다.", "Unicode upper/lower와 single code point validation은 ASCII range보다 넓습니다."],
          },
          experiments: [
            { change: "parity의 odd 조건을 value%2==1로 직접 작성합니다.", prediction: "-3과 -1을 odd로 인식하지 못합니다.", result: "odd는 remainder!=0 또는 even의 부정으로 정의합니다." },
            { change: "selected 조건을 false로 바꿉니다.", prediction: "failIfCalled가 실행되어 IllegalStateException이 납니다.", result: "조건 연산자는 선택된 operand만 평가합니다." },
            { change: "Ω를 ASCII 'A'..'Z' 조건으로 검사합니다.", prediction: "OTHER가 됩니다.", result: "영문 프로토콜과 Unicode 문자 분류를 구분합니다." },
            { change: "hours max를 24에서 업무상 허용되는 다른 값으로 바꿉니다.", prediction: "같은 25 입력의 INVALID 여부가 domain 정책에 따라 달라집니다.", result: "0..24는 이 예제의 명시적 정책이지 Java 언어 규칙이 아닙니다." },
          ],
          sourceRefs: ["java-if-boundary-source", "jls-conditional-operator", "jls-if-statement", "jls-remainder-operator", "java-character-api", "unicode-core-spec"],
        },
      ],
      diagnostics: [
        { symptom: "양쪽 결과가 다른 타입이라며 Object target conditional도 금지한다.", likelyCause: "입문용 same-type 설명을 JLS 전체 규칙으로 일반화했습니다.", checks: ["boolean/numeric/reference conditional을 구분합니다.", "target type과 boxing을 확인합니다.", "compiler diagnostic fixture를 실행합니다."], fix: "간단한 공통 target을 쓰되 production에서는 결과 type이 명확한 conditional을 선호합니다.", prevention: "same-type slogan 대신 대표 compile-pass/compile-fail pair를 유지합니다." },
      ],
      comparisons: [
        { title: "conditional과 if/else 선택", options: [
          { name: "조건 연산자", chooseWhen: "두 expression 중 하나의 값을 짧고 명확하게 선택할 때", avoidWhen: "mutation·logging·여러 문장·중첩 정책이 있을 때", tradeoffs: ["값 흐름이 간결합니다.", "복잡한 type 규칙과 중첩 가독성 비용이 있습니다."] },
          { name: "if/else", chooseWhen: "branch마다 여러 작업이나 early return, 오류 분류가 필요할 때", avoidWhen: "단순 값 선택을 장황하게 중복 대입할 때", tradeoffs: ["제어 흐름과 debugging이 명확합니다.", "boilerplate가 늘 수 있습니다."] },
        ] },
      ],
    },
    {
      id: "if-else-boundary-definite-assignment",
      title: "if/else는 첫 true branch보다 먼저 invalid 영역을 분리해야 합니다",
      lead: "else를 '나머지 정상값'으로 쓰지 않고 입력 공간을 invalid·valid subranges로 나눕니다.",
      explanations: [
        "Java if 조건은 boolean/Boolean이어야 하며 숫자 0/1이나 null reference를 truthy/falsy로 자동 변환하지 않습니다. `if (1)`은 compile error입니다.",
        "Ex07 설명 주석은 else 본문도 '조건식이 참일 때'라고 적었지만 실제로는 앞 조건이 false일 때입니다. braces와 branch label을 정확히 유지합니다.",
        "score>=80만 검사하면 999도 true입니다. 먼저 score<0||score>100을 INVALID로 반환한 뒤 valid 영역에서 PASS/FAIL을 나눕니다.",
        "if 한쪽에서만 지역변수를 대입하고 뒤에서 읽으면 compiler는 might not have been initialized로 막습니다. 모든 정상 경로 대입, 초기값, early return 중 의미에 맞는 방식을 선택합니다.",
        "else는 가장 가까운 unmatched if에 결합합니다. 한 줄이어도 braces를 써서 이후 문장 추가가 의미를 바꾸지 않게 합니다.",
        "경계표는 조건식을 그대로 복사하지 않고 min-1, min, threshold-1, threshold, max, max+1을 독립 expected 값으로 기록합니다.",
      ],
      concepts: [
        { term: "validation-first branching", definition: "허용 영역 밖을 먼저 종료한 뒤 정상 영역만 분류하는 구조입니다.", detail: ["else 의미가 명확해집니다.", "invalid가 성공으로 섞이지 않습니다."] },
        { term: "definite assignment", definition: "지역변수가 사용되기 전 모든 가능한 정상 경로에서 값이 대입됐음을 compiler가 증명하는 규칙입니다.", detail: ["if branch와 연결됩니다.", "초기값 남용과 다릅니다."] },
        { term: "boundary table", definition: "조건이 전환되는 값과 바로 양옆 값을 expected category로 정리한 테스트 표입니다.", detail: ["off-by-one을 찾습니다.", "invalid endpoints를 포함합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "101점·999점이 합격으로 처리된다.", likelyCause: "threshold condition만 있고 domain max validation이 없습니다.", checks: ["입력 전체 허용 범위를 적습니다.", "min/max±1 fixture를 실행합니다.", "invalid branch가 정상 else와 분리됐는지 봅니다."], fix: "range 밖을 INVALID로 조기 반환하고 0..100 안에서만 pass threshold를 적용합니다.", prevention: "decision table을 요구사항과 parameterized test의 단일 근거로 사용합니다." },
      ],
    },
    {
      id: "negative-parity-remainder",
      title: "음수 홀짝은 remainder가 1이라고 가정하지 않고 0인지 아닌지로 판정합니다",
      lead: "Java %는 수학의 항상 양수 modulo가 아니라 dividend 부호를 따를 수 있는 remainder입니다.",
      explanations: [
        "Java 정수 나눗셈은 0 방향으로 잘리고 remainder는 `a == (a/b)*b + a%b`를 만족합니다. 그래서 -3%2는 -1입니다.",
        "짝수는 2로 나누어 remainder가 0인 정수이므로 `n % 2 == 0`이 양수·0·음수에 모두 맞습니다.",
        "홀수를 `n % 2 == 1`로 쓰면 -3과 -1을 놓칩니다. `n % 2 != 0` 또는 `!isEven(n)`을 사용합니다.",
        "Math.abs(n)%2는 불필요하며 Integer.MIN_VALUE에서 abs가 여전히 음수인 overflow edge를 추가합니다.",
        "항상 0 이상인 normalized modulo가 필요한 index/cycle 문제는 Math.floorMod를 검토합니다. parity에는 0/nonzero 검사만으로 충분합니다.",
      ],
      concepts: [
        { term: "remainder", definition: "Java /의 truncated quotient와 곱해 dividend를 복원하는 나머지입니다.", detail: ["음수일 수 있습니다.", "% 결과입니다."] },
        { term: "parity", definition: "정수가 2의 배수인지 아닌지를 나타내는 even/odd 성질입니다.", detail: ["부호와 무관합니다.", "0은 even입니다."] },
        { term: "floorMod", definition: "양의 divisor에서 0 이상 divisor 미만 결과를 주는 floor division 기반 modulo입니다.", detail: ["index normalization에 유용합니다.", "remainder와 다릅니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "-3을 홀수가 아니라고 판정한다.", likelyCause: "odd 조건을 remainder==1로 작성했습니다.", checks: ["-3%2를 출력합니다.", "-3..3 decision table을 실행합니다.", "Math.abs 우회가 있는지 봅니다."], fix: "even은 ==0, odd는 !=0으로 판정합니다.", prevention: "음수·0·양수를 포함한 parity test를 기본 fixture로 둡니다." },
      ],
    },
    {
      id: "unicode-token-code-point",
      title: "next().charAt(0)은 첫 글자가 아니라 첫 UTF-16 code unit을 반환합니다",
      lead: "입력 요구사항이 ASCII letter, Unicode code point, 사용자 인식 문자 중 무엇인지 먼저 정합니다.",
      explanations: [
        "Ex07의 `scan.next().charAt(0)`은 whitespace token의 첫 char만 얻습니다. AB를 넣어도 A만 보고 정상 대문자로 처리합니다.",
        "😀 U+1F600은 surrogate pair D83D DE00 두 char이므로 charAt(0)은 high surrogate만 반환합니다. single code point 입력을 원하면 codePointCount가 1인지 확인합니다.",
        "ASCII 'A'..'Z'와 'a'..'z'는 영문 protocol 검증에는 적합하지만 전체 Unicode 대소문자 분류가 아닙니다. Ω는 Character.isUpperCase에서는 true입니다.",
        "한 code point도 사용자가 보는 한 grapheme와 항상 같지 않습니다. combining mark나 emoji sequence가 허용되는 이름 field에는 grapheme-aware library와 별도 길이 정책이 필요합니다.",
        "문자 분류 실패를 곧바로 invalid라고 할지 OTHER category로 둘지는 domain 정책입니다. 숫자·한글·기호가 합법인 field라면 upper/lower가 아닌 것이 오류가 아닙니다.",
      ],
      concepts: [
        { term: "UTF-16 code unit", definition: "Java char가 저장하는 16-bit 단위입니다.", detail: ["supplementary 문자는 두 개가 필요합니다.", "charAt이 반환합니다."] },
        { term: "code point", definition: "Unicode에서 문자 값에 부여된 U+0000..U+10FFFF 번호입니다.", detail: ["codePointAt으로 읽습니다.", "count 검증이 필요합니다."] },
        { term: "grapheme cluster", definition: "사용자가 화면에서 한 문자로 인식할 수 있는 하나 이상의 code point sequence입니다.", detail: ["code point와도 다릅니다.", "이름 길이 정책에 중요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "emoji 한 개를 입력했는데 알 수 없는 char이거나 문자열이 깨진다.", likelyCause: "supplementary code point의 high surrogate만 charAt(0)으로 읽었습니다.", checks: ["length와 codePointCount를 함께 출력합니다.", "char hex units와 codePoint U+값을 비교합니다.", "입력 field의 문자 단위를 정의합니다."], fix: "single code point라면 count를 검증하고 codePointAt과 Character int overload를 사용합니다.", prevention: "ASCII·BMP·supplementary·combining fixtures를 text boundary test에 포함합니다." },
      ],
    },
    {
      id: "testable-cli-architecture",
      title: "입력·검증·분류·출력을 분리하면 콘솔 없이도 같은 CLI behavior를 검증할 수 있습니다",
      lead: "System.in과 System.out을 업무 함수 안에서 직접 열고 닫지 않고 dependency로 전달합니다.",
      explanations: [
        "Scanner 생성은 application boundary에 두고 `run(Scanner, PrintStream)`은 전달받은 dependency를 사용하되 닫지 않습니다. 테스트는 String Scanner와 ByteArrayOutputStream을 주입할 수 있습니다.",
        "읽기 함수는 text를 소비하고 syntax/range failure를 stable result로 바꾸며, 분류 함수는 이미 검증된 int만 받습니다. 이 구조는 999가 pass가 되는 결합 오류를 줄입니다.",
        "prompt도 stdout contract입니다. println 여부, EOF 직전 prompt, locale별 숫자 format을 golden test에서 정확히 비교합니다.",
        "사용자 오류는 INVALID_INTEGER·OUT_OF_RANGE처럼 복구 가능한 상태로 표시하고 내부 stack trace는 diagnostic channel에 제한합니다. raw 이름·전체 입력 line·secret은 log에 남기지 않습니다.",
        "동시성·GUI·server에서는 blocking Scanner를 core에 넣지 않고 asynchronous adapter가 완성한 input message를 같은 validation 함수에 전달합니다. 순수 분류 함수는 transport와 무관하게 재사용됩니다.",
        "production test matrix에는 정상, 경계, 연속 invalid, EOF, locale, Unicode, closed ownership을 포함하고 원본 golden은 legacy behavior regression 자료로 별도 유지합니다.",
      ],
      concepts: [
        { term: "dependency injection", definition: "함수가 사용할 Scanner·PrintStream을 내부 생성하지 않고 외부에서 전달받는 설계입니다.", detail: ["테스트가 쉬워집니다.", "ownership이 명확해집니다."] },
        { term: "pure classifier", definition: "검증된 값만 받아 category를 반환하고 I/O나 shared state를 바꾸지 않는 함수입니다.", detail: ["boundary test에 적합합니다.", "transport와 분리됩니다."] },
        { term: "privacy-safe diagnostic", definition: "raw 입력 대신 field·reason·허용 범위·correlation id처럼 복구에 필요한 최소 정보만 기록하는 오류 표현입니다.", detail: ["PII 노출을 줄입니다.", "stable test가 가능합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "CLI test가 실제 키보드를 기다리거나 앞 test가 System.in을 닫아 순서에 따라 실패한다.", likelyCause: "업무 함수가 global System.in Scanner를 직접 생성·close합니다.", checks: ["Scanner 생성 위치를 찾습니다.", "run method가 I/O dependency를 parameter로 받는지 봅니다.", "tests를 순서를 바꿔 실행합니다."], fix: "input/output adapter를 main에 두고 core에는 Scanner·PrintStream 또는 이미 읽은 text를 주입합니다.", prevention: "String source golden tests와 same-JVM sequential integration test를 유지합니다." },
      ],
      comparisons: [
        { title: "CLI 계층 경계", options: [
          { name: "global I/O 직접 접근", chooseWhen: "버리고 다시 쓰는 아주 작은 one-shot probe일 때", avoidWhen: "재시도·테스트·여러 command·library reuse가 있을 때", tradeoffs: ["코드는 짧습니다.", "ownership과 deterministic test가 어렵습니다."] },
          { name: "주입된 adapter/core", chooseWhen: "입력 정책과 분류를 장기 유지하고 자동 테스트할 때", avoidWhen: "학습 첫 한 줄 출력만 보여 주는 순간적 예제일 때", tradeoffs: ["경계와 privacy 정책이 명확합니다.", "초기 구조가 조금 늘어납니다."] },
        ] },
      ],
      expertNotes: ["원본의 double 급여 계산은 금액 정책 세션에서 decimal/minor-unit representation과 overflow를 별도로 다뤄야 합니다.", "Scanner raw input을 metrics label로 쓰면 cardinality와 개인정보 문제가 생기므로 reason code만 집계합니다."],
    },
  ],
  lab: {
    title: "학생 점수와 문자 command를 받는 복구 가능한 CLI를 완성합니다",
    scenario: "사용자가 이름, 점수, 한 code point command를 입력합니다. 잘못된 숫자·범위 밖 점수·EOF에서 종료되지 않거나 raw 입력을 노출하지 않으면서 PASS/FAIL과 문자 category를 출력해야 합니다.",
    setup: [
      "다섯 원본 golden을 JDK 21 clean classes에서 실행해 legacy behavior와 prompt를 보존합니다.",
      "Scanner source는 UTF-8, numeric machine input은 Locale.ROOT로 고정하고 테스트에는 String source를 사용합니다.",
      "Result reason을 END_OF_INPUT, INPUT_IO_ERROR, INVALID_INTEGER, OUT_OF_RANGE, INVALID_CODE_POINT_LENGTH로 정의합니다.",
      "점수 -1/0/79/80/100/101, 할인 코드 0/1/2/3, 근무시간 -1/0/8/9/25, parity -3..3, Ω/😀/AB, invalid-invalid-valid와 EOF fixtures를 준비합니다.",
    ],
    steps: [
      "main에서 Scanner와 PrintStream을 만들고 run에 전달하되 core method는 전달받은 resource를 닫지 않습니다.",
      "이름은 nextLine으로 한 번 소비하고 blank·최대 길이 정책을 적용하되 오류 log에 원문을 넣지 않습니다.",
      "점수도 nextLine으로 읽고 parseInt syntax와 0..100 range를 두 단계로 검증합니다.",
      "각 retry가 line 하나를 소비하거나 EOF로 반환하는 progress invariant를 assertion으로 둡니다.",
      "검증된 점수를 score>=80 조건으로 PASS/FAIL하고 invalid가 분류 함수에 들어오지 않게 type/result boundary를 둡니다.",
      "command token은 codePointCount==1을 검사하고 Character API로 UPPER/LOWER/OTHER를 분류합니다.",
      "음수 식별 번호 parity가 필요하면 even==remainder 0, odd==remainder nonzero 규칙을 사용합니다.",
      "정상 입력, 두 번 실패 뒤 성공, 첫 prompt EOF, 중간 EOF를 exact stdout으로 비교합니다.",
      "Locale.GERMANY/ROOT와 custom delimiter 실험을 별도 parser contract test로 실행합니다.",
      "첫 command 뒤 두 번째 command를 같은 JVM에서 실행해 System.in ownership regression을 확인합니다.",
      "telemetry에는 field·reason·bound·attempt count만 남고 raw name/token이 없는지 audit합니다.",
      "legacy 원본과 strict CLI 결과 차이를 migration note에 기록하고 invalid acceptance를 의도된 breaking fix로 승인합니다.",
    ],
    expectedResult: [
      "정상 점수 80은 PASS, 79는 FAIL이며 -1·101은 OUT_OF_RANGE 뒤 재입력됩니다.",
      "invalid token 뒤 cursor가 전진하고 EOF는 stack trace 없이 정상 종료 result가 됩니다.",
      "할인 코드는 1·2만 DISCOUNT이고 0·3은 INVALID이며, 근무시간 0·8·9는 0·82560·98040이고 -1·25는 INVALID입니다.",
      "-3과 -1은 ODD, -2·0·2는 EVEN으로 분류됩니다.",
      "Ω는 UPPER, 😀는 OTHER, AB는 INVALID_CODE_POINT_LENGTH가 됩니다.",
      "테스트가 실제 키보드나 ambient locale에 의존하지 않고 exact prompt/output을 재현합니다.",
      "오류와 telemetry에 raw 사용자 입력·이름·secret이 포함되지 않습니다.",
    ],
    cleanup: ["검증 전용 source/classes는 GUID temp root 안에 만들고 resolved parent가 system temp base와 같은지 확인한 뒤에만 제거합니다.", "System.in·System.out을 test에서 교체했다면 finally에서 원래 stream을 복원합니다."],
    extensions: [
      "sealed Result 또는 record로 success/failure reason과 field metadata를 type-safe하게 만듭니다.",
      "Console.readPassword로 secret echo를 피하고 char[] 수명을 최소화하는 별도 인증 입력 경계를 설계합니다.",
      "Picocli 같은 CLI parser와 직접 Scanner loop의 usage/help/error contract를 비교합니다.",
      "interactive adapter를 비동기 message adapter로 교체하고 pure validators를 그대로 재사용합니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "ScannerModesLab과 다섯 원본 golden을 실행해 token·line·mismatch·EOF 상태 전이표를 작성하세요.", requirements: ["compile/run exit와 Xlint warning을 기록합니다.", "nextInt 뒤 빈 nextLine을 angle brackets로 보존합니다.", "mismatch token이 남는 것을 확인합니다.", "EOF와 closed scanner를 구분합니다.", "원본과 공식 보완 evidence를 표시합니다."], hints: ["각 호출 전후 cursor 위치를 그리세요.", "오류 후 다음 token을 출력해 보세요."], expectedOutcome: "Scanner method를 암기하지 않고 소비 범위와 다음 상태로 설명합니다.", solutionOutline: ["String source로 deterministic fixture를 만듭니다.", "token/line/locale/close를 별도 row로 기록합니다."] },
    { difficulty: "응용", prompt: "Ex03 점수 입력을 line-first 유한 retry와 validation-first PASS/FAIL로 리팩터링하세요.", requirements: ["INVALID_INTEGER·OUT_OF_RANGE·END_OF_INPUT·INPUT_IO_ERROR를 분리합니다.", "invalid token을 raw log에 넣지 않습니다.", "-1/0/79/80/100/101 tests를 둡니다.", "clean EOF와 failing Readable을 별도 Result로 반환합니다.", "Scanner ownership을 caller에 둡니다."], hints: ["parse와 range를 한 catch로 합치지 마세요.", "각 loop가 전진하는지 증명하세요."], expectedOutcome: "잘못된 입력에서 종료·무한 반복·잘못된 합격이 없는 점수 CLI가 됩니다.", solutionOutline: ["readIntInRange와 classifyScore를 분리합니다.", "String Scanner와 captured PrintStream으로 golden을 비교합니다."] },
    { difficulty: "설계", prompt: "다국어 command와 localized 숫자를 받는 운영 CLI architecture를 설계하세요.", requirements: ["source/charset/locale/delimiter ownership을 명시합니다.", "token·line grammar와 code point/grapheme 정책을 정합니다.", "syntax/range/domain/EOF/closed error taxonomy를 만듭니다.", "blocking·thread·resource lifecycle을 설계합니다.", "privacy-safe telemetry, contract/property tests와 legacy migration을 포함합니다."], hints: ["ambient JVM state를 dependency로 끌어내세요.", "raw input 없는 observability를 설계하세요."], expectedOutcome: "locale·Unicode·EOF·재시도·소유권이 명시된 implementation-ready CLI boundary가 완성됩니다.", solutionOutline: ["adapter→normalizer→validator→classifier→renderer 층으로 나눕니다.", "legacy와 strict behavior를 동일 synthetic fixtures로 비교합니다."] },
  ],
  reviewQuestions: [
    { question: "Scanner는 키보드 전용 클래스인가요?", answer: "아닙니다. InputStream·Readable·String·Path 등 여러 source의 text를 delimiter와 locale 규칙으로 scan합니다." },
    { question: "next는 항상 한 단어를 읽나요?", answer: "아닙니다. 현재 delimiter pattern 사이의 complete token을 읽습니다." },
    { question: "nextInt 뒤 nextLine이 빈 이유는 무엇인가요?", answer: "숫자 token 뒤 현재 line에 남은 빈 구간을 nextLine이 반환하기 때문입니다." },
    { question: "nextLine도 useDelimiter의 쉼표를 따르나요?", answer: "아닙니다. nextLine은 token delimiter와 독립적으로 현재 줄 끝까지 진행합니다." },
    { question: "InputMismatchException이 나면 잘못된 token은 소비되나요?", answer: "아닙니다. next 또는 nextLine으로 처리하지 않으면 같은 token에서 다시 실패합니다." },
    { question: "EOF는 무조건 오류인가요?", answer: "아닙니다. 입력 종료라는 정상 제어 상태일 수 있어 hasNext 계열과 Optional/Result로 모델링할 수 있습니다." },
    { question: "Scanner.close는 Scanner 객체만 닫나요?", answer: "source가 Closeable이면 underlying source도 닫으므로 System.in ownership을 주의해야 합니다." },
    { question: "hasNextInt는 절대 block하지 않나요?", answer: "아닙니다. complete token이나 EOF를 확인하기 위해 입력을 기다릴 수 있습니다." },
    { question: "Scanner 숫자 parsing은 locale과 무관한가요?", answer: "아닙니다. 초기 FORMAT locale의 decimal/grouping 규칙을 사용하며 useLocale로 바꿀 수 있습니다." },
    { question: "조건 연산자의 두 결과는 정확히 같은 type이어야 하나요?", answer: "아닙니다. boolean·numeric·reference conditional과 target typing 규칙으로 결과 type이 정해집니다." },
    { question: "조건 연산자는 두 branch를 모두 평가하나요?", answer: "아닙니다. 조건 뒤 선택된 operand 하나만 평가합니다." },
    { question: "if(1)은 true로 취급되나요?", answer: "아닙니다. Java if 조건은 boolean 또는 unboxing 가능한 Boolean이어야 합니다." },
    { question: "score>=80만 검사하면 충분한가요?", answer: "아닙니다. 허용 점수가 0..100이라면 range 밖을 먼저 INVALID로 분리해야 합니다." },
    { question: "n%2==1은 모든 홀수에 맞나요?", answer: "아닙니다. 음수 홀수 remainder는 -1일 수 있으므로 odd는 n%2!=0으로 판정합니다." },
    { question: "charAt(0)은 첫 Unicode 문자를 반환하나요?", answer: "첫 UTF-16 code unit을 반환합니다. supplementary code point에는 codePointAt과 count 검증이 필요합니다." },
    { question: "Character.isUpperCase와 A..Z 검사는 같은가요?", answer: "아닙니다. 전자는 Unicode 대문자를 다루고 후자는 ASCII 영문 protocol 범위입니다." },
    { question: "왜 raw invalid token을 오류 메시지에 넣지 않나요?", answer: "입력에 이름·식별자·secret이 있을 수 있어 field와 stable reason code만 기록하는 편이 안전합니다." },
    { question: "테스트 가능한 CLI의 핵심 경계는 무엇인가요?", answer: "I/O dependency를 주입하고 읽기·parse·range validation·classification·rendering을 분리하는 것입니다." },
  ],
  completionChecklist: [
    "inventory의 day04 Ex01·Ex02·Ex03·Ex04·Ex07 다섯 source를 직접 읽고 사용했다.",
    "다섯 main을 Temurin JDK 21.0.11에서 UTF-8·Xlint clean compile하고 고정 stdin stdout을 검증했다.",
    "원본 active code와 comment-only API, 공식 문서 기반 재구성을 구분했다.",
    "Scanner source·charset·cursor·blocking·thread-safety를 설명했다.",
    "default/custom delimiter와 token grammar를 실행했다.",
    "nextInt 뒤 nextLine의 빈 remaining line을 exact output으로 재현했다.",
    "Locale.GERMANY와 Locale.ROOT numeric policy 차이를 설명했다.",
    "InputMismatchException 뒤 offending token 잔존과 recovery를 실행했다.",
    "EOF를 NoSuchElementException stack trace가 아닌 정상 result로 변환했다.",
    "Scanner.close가 underlying Closeable source를 닫는 것을 검증하고 ownership 규칙을 정했다.",
    "conditional expression의 type·target typing·선택 평가를 설명했다.",
    "if/else boolean 조건·definite assignment·dangling else와 braces를 설명했다.",
    "점수·할인 코드·근무시간 invalid를 정상 else와 분리했다.",
    "-3..3 parity로 음수 odd predicate를 검증했다.",
    "UTF-16 code unit·code point·grapheme와 Character 분류를 구분했다.",
    "line-first retry가 매 반복 전진하는 progress invariant를 만족한다.",
    "Scanner·PrintStream injection으로 deterministic CLI test를 만들었다.",
    "오류 reason과 telemetry에서 raw PII·secret을 제거했다.",
    "정상·경계·연속 invalid·EOF·locale·Unicode·ownership test matrix를 작성했다.",
  ],
  nextSessions: ["java-06-switch-multibranch"],
  sources: [
    { id: "java-conditional-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day04/Ex01.java", usedFor: ["conditional operator", "parity", "pass threshold", "discount", "work hours", "ASCII range", "maximum"], evidence: "JDK 21에서 홀수·짝수·홀수·합격·900·41280·대문자 아님·1900년대 태어남·14·14를 재현했습니다." },
    { id: "java-scanner-line-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day04/Ex02.java", usedFor: ["Scanner System.in", "nextLine", "full-name line", "close"], evidence: "홍 길동 line 입력으로 '이름 : 받은 정보 : 홍 길동'과 EOF NoSuchElementException을 재현했습니다." },
    { id: "java-scanner-conditional-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day04/Ex03.java", usedFor: ["nextInt", "negative parity", "score threshold", "conditional expression", "mismatch failure"], evidence: "-3/79는 홀수·불합격, -4/80은 짝수·합격이며 abc는 InputMismatchException임을 실행했습니다." },
    { id: "java-score-average-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day04/Ex04.java", usedFor: ["line then tokens", "full name", "three scores", "total", "double average"], evidence: "홍 길동·100·90·80으로 총점 270·평균 90.0을 재현하고 -1·101·300도 검증 없이 허용함을 확인했습니다." },
    { id: "java-if-boundary-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day04/Ex07.java", usedFor: ["if/else", "else-if", "logical conditions", "discount code", "ASCII letter", "overtime", "Scanner close"], evidence: "두 정상 branch와 999점·emoji·음수 시간의 잘못된 domain acceptance를 고정 stdin으로 재현했습니다." },
    { id: "jdk21-javac", repository: "Oracle Java SE 21 Tool Specifications", path: "javac command", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["UTF-8 compile", "Xlint", "exit code", "clean classes"], evidence: "원본과 reconstructed Java examples의 재현 compiler 기준입니다." },
    { id: "java-scanner-api", repository: "Oracle Java SE 21 API", path: "java.util.Scanner", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Scanner.html", usedFor: ["source", "delimiter", "token", "line", "locale", "radix", "blocking", "thread safety", "ioException", "close"], evidence: "ScannerModesLab과 ownership·retry·clean EOF versus underlying I/O error 설명의 공식 계약입니다." },
    { id: "java-input-mismatch-api", repository: "Oracle Java SE 21 API", path: "java.util.InputMismatchException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/InputMismatchException.html", usedFor: ["numeric mismatch", "failure taxonomy", "retry"], evidence: "잘못된 token과 range/EOF를 분리하는 기준입니다." },
    { id: "java-locale-api", repository: "Oracle Java SE 21 API", path: "java.util.Locale", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Locale.html", usedFor: ["FORMAT locale", "Locale.ROOT", "localized numeric input"], evidence: "1,5와 1.5 parser fixture의 locale 기준입니다." },
    { id: "java-system-api", repository: "Oracle Java SE 21 API", path: "java.lang.System.in", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html#in", usedFor: ["standard input", "process-wide source", "ownership"], evidence: "Scanner wrapper와 underlying shared input stream의 수명을 구분합니다." },
    { id: "java-optional-int-api", repository: "Oracle Java SE 21 API", path: "java.util.OptionalInt", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/OptionalInt.html", usedFor: ["EOF result", "accepted int", "no sentinel"], evidence: "ValidatedLineCli가 EOF와 성공을 exception·magic number 없이 구분하는 기준입니다." },
    { id: "java-integer-api", repository: "Oracle Java SE 21 API", path: "Integer.parseInt", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html#parseInt(java.lang.String)", usedFor: ["line-first integer parsing", "NumberFormatException", "syntax and range failure"], evidence: "ValidatedLineCli가 Scanner token grammar 대신 한 line을 int로 해석하는 공식 기준입니다." },
    { id: "jls-conditional-operator", repository: "Oracle Java Language Specification 21", path: "15.25 Conditional Operator", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.25", usedFor: ["boolean/numeric/reference conditional", "poly expression", "selected operand", "result type"], evidence: "Ex01의 same-type 설명을 정확한 conditional expression 규칙으로 교정합니다." },
    { id: "jls-if-statement", repository: "Oracle Java Language Specification 21", path: "14.9 The if Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.9", usedFor: ["boolean condition", "if/else execution", "dangling else"], evidence: "Ex07 branch 설명과 validation-first 구조의 language 기준입니다." },
    { id: "jls-definite-assignment", repository: "Oracle Java Language Specification 21", path: "Chapter 16 Definite Assignment", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-16.html", usedFor: ["local variable assignment", "try/catch/continue flow", "use after if branches"], evidence: "ValidatedLineCli의 final local value와 if/else branch assignment 설명을 compiler 규칙에 연결합니다." },
    { id: "jls-remainder-operator", repository: "Oracle Java Language Specification 21", path: "15.17.3 Remainder Operator %", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.17.3", usedFor: ["negative remainder", "parity", "division identity"], evidence: "-3%2=-1과 odd!=0 규칙의 공식 근거입니다." },
    { id: "java-character-api", repository: "Oracle Java SE 21 API", path: "java.lang.Character", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Character.html", usedFor: ["code point", "isUpperCase", "isLowerCase", "surrogate"], evidence: "ASCII range와 Unicode classification을 분리하는 기준입니다." },
    { id: "unicode-core-spec", repository: "Unicode Consortium", path: "Unicode Standard 15.0 Core Specification Chapter 3", publicUrl: "https://www.unicode.org/versions/Unicode15.0.0/ch03.pdf", usedFor: ["code point", "UTF-16", "surrogate pair", "character model"], evidence: "char·code point·grapheme를 같은 단위로 오해하지 않게 보완합니다." },
  ],
  sourceCoverage: {
    filesRead: 5,
    filesUsed: 5,
    uncoveredNotes: [
      "inventory의 day04 Ex01·Ex02·Ex03·Ex04·Ex07 다섯 Java source를 모두 UTF-8로 읽고 Temurin JDK 21.0.11에서 -Xlint:all clean compile했습니다.",
      "Ex01의 active conditional examples와 마지막 대입만 결과에 기여하는 사실을 golden output으로 사용하고, full JLS conditional type 규칙은 공식 보완으로 분리했습니다.",
      "Ex02는 active nextLine 하나뿐이므로 next/nextInt/nextDouble 주석을 원본 실행으로 세지 않았습니다. delimiter·locale·token/line 혼합은 Scanner API와 new exact examples로 보완했습니다.",
      "Ex03의 negative parity와 79/80 threshold는 원본 evidence이며 mismatch retry·EOF result·0..100 range validation은 production reconstruction입니다.",
      "Ex04의 line-first-name/token-scores 순서와 270/90.0은 원본 evidence이며 invalid score rejection·output formatting policy는 보완입니다.",
      "Ex07의 if/else·else-if·ASCII char·discount·overtime는 원본 evidence지만 999점과 -2시간을 허용합니다. Unicode code point·privacy-safe diagnostics·testable injected CLI는 공식 문서 기반 재구성입니다.",
      "원본에는 실제 credential·secret이 없고 홍길동·점수는 synthetic fixture입니다. 새 오류 예제는 raw input을 telemetry에 남기지 않습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
