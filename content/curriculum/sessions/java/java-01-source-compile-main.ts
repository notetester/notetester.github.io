import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["java-01-source-compile-main"],
  slug: "java-01-source-compile-main",
  courseId: "java",
  moduleId: "java-language-control",
  order: 1,
  title: "소스·컴파일·바이트코드·JVM과 main",
  subtitle: "한 줄 출력에서 시작해 package·출력 디렉터리·classpath·class file version·launcher 진입점까지 Java 실행 파이프라인을 직접 추적합니다.",
  level: "입문",
  estimatedMinutes: 390,
  coreQuestion: "Java source 한 파일이 어떤 도구와 경로를 거쳐 JVM에서 실행되며, 컴파일은 성공했는데 class를 찾지 못하는 문제를 어떻게 단계별로 진단할까요?",
  summary: "inventory의 javastudy day01 Ex01_main.java와 Ex02.java 두 원본을 UTF-8로 직접 읽고 Temurin JDK 21.0.11의 javac·java·javap로 분리된 임시 output에 컴파일·실행했습니다. 두 source 모두 package com.ictedu.day01과 고전적인 public static void main(String[] args)를 사용합니다. Ex01_main은 println으로 Hello, World를 한 줄 출력하고, Ex02는 print·빈 println·println의 줄바꿈 차이와 한글 source를 보여 줍니다. 공개 학습 예제에서는 원본의 개인 연락처 문자열을 재게시하지 않고 가상 학습자 데이터로 바꾸되 print/println·UTF-8 evidence는 보존합니다. javac -encoding UTF-8 -Xlint:all -d classes로 컴파일하면 package와 일치하는 com/ictedu/day01 아래 두 .class가 생성되고 fully qualified class name과 classpath root로 실행됩니다. classpath를 class가 있는 마지막 폴더로 잘못 잡으면 ClassNotFoundException을 실제로 재현할 수 있습니다. 기본 JDK 21 compile 결과의 class-file major는 65이며 javap로 header·descriptor·bytecode를 확인했습니다. 이를 JDK/JVM/runtime의 역할, source encoding, public top-level class와 file name, package/FQCN, javac phases와 -d, class file magic·constant pool·descriptor·bytecode, class loading·linking·initialization, classic main과 command-line args, stdout/stderr/exit, --release와 runtime compatibility, source-file mode·JShell·IDE/build output, Java 25에서 정식 도입된 compact source/instance main의 version boundary, reproducible build와 ClassNotFound/NoClassDefFound/UnsupportedClassVersion diagnostics까지 확장합니다.",
  objectives: [
    "JDK·JVM·runtime image와 javac·java·javap 도구의 역할을 실행 순서로 설명할 수 있다.",
    ".java source를 UTF-8로 compile해 package hierarchy를 가진 별도 .class output을 만들 수 있다.",
    "public top-level class 이름·source file 이름과 package 선언·directory convention을 구분할 수 있다.",
    "classpath root와 fully qualified class name을 계산해 packaged main class를 실행할 수 있다.",
    "public static void main(String[] args)의 각 부분과 command-line argument 전달을 설명할 수 있다.",
    "class file의 CAFEBABE magic·minor/major·constant pool·method descriptor와 bytecode를 javap로 조사할 수 있다.",
    "load·link(verify/prepare/resolve)·initialize와 interpreter/JIT를 compile 단계와 혼동하지 않을 수 있다.",
    "--release가 language rule·target class version·available platform API를 함께 제한하는 이유를 설명할 수 있다.",
    "ClassNotFoundException·NoClassDefFoundError·UnsupportedClassVersionError·main not found·encoding 오류를 evidence로 진단할 수 있다.",
    "Java 21 classic baseline과 Java 25+ compact source·instance main을 version-aware하게 선택할 수 있다.",
  ],
  prerequisites: [],
  keywords: ["Java", "JDK", "JVM", "javac", "java launcher", "javap", "source", "class file", "bytecode", "CAFEBABE", "major version", "package", "fully qualified class name", "classpath", "main", "String[] args", "stdout", "stderr", "exit code", "--release", "source-file mode", "compact source file", "instance main", "ClassNotFoundException", "UnsupportedClassVersionError", "UTF-8", "reproducible build"],
  chapters: [
    {
      id: "two-source-audit-first-evidence",
      title: "두 원본을 출력 예제가 아니라 Java 실행 파이프라인의 첫 evidence로 읽습니다",
      lead: "source에 실제로 있는 package·class·main·출력과 공개 자료에서 바꿔야 할 데이터를 분리합니다.",
      explanations: [
        "Ex01_main.java는 첫 줄 package com.ictedu.day01, public class Ex01_main, public static void main(String[] args), System.out.println('Hello, World')의 최소 구조입니다. 문법 네 줄이 compile·load·entry point·output 전체를 연결합니다.",
        "Ex02.java도 같은 package와 main을 사용하고 System.out.print 뒤 빈 println으로 줄을 끝낸 다음 println을 이어 씁니다. print는 자동 줄바꿈이 없고 println은 인수 출력 뒤 또는 인수 없이 line separator를 씁니다.",
        "Ex02의 한글은 source encoding과 terminal/output encoding이 모두 맞아야 읽힙니다. javac -encoding UTF-8을 명시해 저장 byte 해석을 build contract로 고정합니다.",
        "Ex02에는 실제 개인 이름·전화·이메일 문자열이 있습니다. public 학습 사이트에는 필요하지 않은 개인정보를 그대로 복제하지 않고 가상 학습자 문자열로 교체합니다. provenance는 file path와 사용한 언어 기능만 남깁니다.",
        "두 파일은 Eclipse project의 src 아래에 있고 기존 bin도 있지만 이번 검증은 원본과 기존 build output을 수정하지 않고 별도 temporary classes directory에 compile했습니다. source와 generated artifact를 분리해야 stale class를 현재 결과로 오해하지 않습니다.",
        "원본의 Ex01_main 같은 underscore class 이름은 합법이지만 일반 Java class naming convention은 PascalCase입니다. 문법 오류와 팀 convention을 구분합니다.",
      ],
      concepts: [
        { term: "source evidence", definition: "실제 source declaration·command·output으로 확인한 학습 근거입니다.", detail: ["추측과 구분합니다.", "generated bin은 새 compile로 검증합니다."] },
        { term: "generated artifact", definition: "javac가 source에서 만든 .class 같은 재생성 가능한 결과물입니다.", detail: ["source tree와 분리합니다.", "보통 version control에서 제외합니다."] },
        { term: "data minimization", definition: "학습 목적에 필요하지 않은 개인정보를 public example에 복제하지 않는 원칙입니다.", detail: ["동작 evidence는 가상 값으로 보존합니다.", "원본 path만 provenance에 남깁니다."] },
      ],
      codeExamples: [
        {
          id: "java-original-hello-pipeline",
          title: "package가 있는 첫 class를 별도 output에 compile하고 FQCN으로 실행합니다",
          language: "java",
          filename: "src/com/ictedu/day01/Ex01_main.java",
          purpose: "원본 최소 code와 compile/run command가 source root·output root·package name으로 어떻게 연결되는지 확인합니다.",
          code: String.raw`package com.ictedu.day01;

public class Ex01_main {
    public static void main(String[] args) {
        System.out.println("Hello, World");
    }
}`,
          walkthrough: [
            { lines: "1", explanation: "binary name의 package 부분이 com.ictedu.day01이 되고 output 아래 같은 directory hierarchy가 생깁니다." },
            { lines: "3", explanation: "public top-level class Ex01_main은 Ex01_main.java에 선언됩니다." },
            { lines: "4-6", explanation: "Java 21 classic launcher가 찾는 main에서 stdout PrintStream의 println을 호출합니다." },
          ],
          run: { environment: ["JDK 21+", "UTF-8 source", "project root에서 실행"], command: "javac -encoding UTF-8 -Xlint:all -d build/classes src/com/ictedu/day01/Ex01_main.java && java -cp build/classes com.ictedu.day01.Ex01_main" },
          output: { value: "Hello, World", explanation: ["-d가 build/classes 아래 package directories와 .class를 만듭니다.", "java에는 source path가 아니라 classpath root와 FQCN을 줍니다."] },
          experiments: [
            { change: "-cp build/classes 대신 -cp build/classes/com/ictedu/day01을 사용합니다.", prediction: "launcher가 root 아래 com/ictedu/day01/Ex01_main.class를 다시 찾으므로 class not found가 납니다.", result: "classpath는 package hierarchy가 시작되는 root입니다." },
            { change: "package 선언을 제거하되 run name을 그대로 둡니다.", prediction: "binary name과 path contract가 달라져 기존 FQCN으로 실행되지 않습니다.", result: "package·output path·launcher name을 함께 바꿉니다." },
            { change: "println을 print로 바꿉니다.", prediction: "문자 뒤 line terminator가 없어 다음 shell prompt/output이 같은 줄에 붙을 수 있습니다.", result: "output protocol에서 newline도 의미가 있습니다." },
          ],
          sourceRefs: ["java-original-hello-source", "jdk21-javac", "jdk21-java-launcher", "jls-packages", "jls-execution"],
        },
        {
          id: "java-print-println-utf8",
          title: "개인정보 없이 print·빈 println·println과 UTF-8 한글 출력을 재현합니다",
          language: "java",
          filename: "src/learning/java01/PrintContract.java",
          purpose: "원본 Ex02의 출력 API와 encoding 학습 가치는 보존하고 public example data는 최소화합니다.",
          code: String.raw`package learning.java01;

public class PrintContract {
    public static void main(String[] args) {
        System.out.print("이름 : 학습자");
        System.out.println();
        System.out.println("과정 : Java");
        System.out.println("단계 : 01");
    }
}`,
          walkthrough: [
            { lines: "5-6", explanation: "print가 쓴 text 뒤 빈 println이 platform line separator를 추가합니다." },
            { lines: "7-8", explanation: "println은 값과 line terminator를 함께 써 다음 출력이 새 줄에서 시작합니다." },
          ],
          run: { environment: ["JDK 21+", "UTF-8 terminal"], command: "javac -encoding UTF-8 -d build/classes src/learning/java01/PrintContract.java && java -cp build/classes learning.java01.PrintContract" },
          output: { value: "이름 : 학습자\n과정 : Java\n단계 : 01", explanation: ["source bytes가 UTF-8로 정확히 decode되었습니다.", "원본의 출력 순서를 가상 데이터로 재현했습니다."] },
          experiments: [
            { change: "source를 다른 encoding으로 저장하고 -encoding UTF-8로 compile합니다.", prediction: "invalid character 또는 깨진 literal이 생길 수 있습니다.", result: "editor와 compiler encoding을 repository policy로 통일합니다." },
            { change: "첫 빈 println을 제거합니다.", prediction: "다음 과정 문자열이 이름 바로 뒤 같은 줄에 붙습니다.", result: "print/println difference가 exact output으로 드러납니다." },
            { change: "System.out을 System.err로 바꿉니다.", prediction: "화면에서는 비슷해도 OS stream과 redirect destination이 달라집니다.", result: "정상 output과 diagnostic을 분리합니다." },
          ],
          sourceRefs: ["java-original-print-source", "jdk21-javac", "jdk-printstream-api"],
        },
      ],
      diagnostics: [
        { symptom: "새 source를 고쳤는데 실행 결과는 이전 값이다.", likelyCause: "IDE bin·manual output·working directory 중 다른 stale class를 실행했습니다.", checks: ["java -verbose:class 또는 class location을 확인합니다.", "source와 .class timestamp/output roots를 비교합니다.", "clean temporary output에서 다시 compile합니다."], fix: "generated directories를 분리·정리하고 한 build command의 output만 classpath에 둡니다.", prevention: "build directory를 version control에서 제외하고 clean build를 CI에서 수행합니다." },
      ],
    },
    {
      id: "jdk-jvm-runtime-toolchain",
      title: "JDK는 개발 도구와 runtime을 제공하고 JVM은 class file을 실행하는 추상 기계입니다",
      lead: "JDK·JRE·JVM을 폴더 포함 관계 하나로 외우지 않고 배포와 실행 책임으로 구분합니다.",
      explanations: [
        "JDK는 javac·java·javap·javadoc·jar·jlink 같은 개발·진단 도구와 Java runtime modules를 포함하는 개발 kit입니다. compile이 필요하면 java command만 있는 runtime이 아니라 matching JDK가 필요합니다.",
        "JVM은 class file format·runtime data areas·instruction set·loading/linking/initialization과 execution semantics를 정의하는 virtual machine입니다. HotSpot은 그 구현 중 하나이고 Temurin은 OpenJDK build distribution입니다.",
        "JRE는 Java application을 실행하는 runtime environment라는 개념으로 여전히 유용하지만 현대 JDK 배포에서 별도 범용 JRE installer가 항상 제공된다고 가정하지 않습니다. jlink로 application-specific runtime image를 만들 수도 있습니다.",
        "java --version과 javac --version을 둘 다 확인합니다. PATH에서 서로 다른 vendor/version이 잡히면 compiler가 만든 class를 older launcher가 읽지 못하거나 API 차이가 생깁니다.",
        "JAVA_HOME은 여러 tools/build systems가 JDK root를 찾는 convention이고 PATH는 현재 shell이 어느 executable을 먼저 찾는지 결정합니다. where.exe java와 Get-Command java로 실제 path를 확인합니다.",
        "LTS는 vendor support cadence이지 Java language에 별도 문법을 만드는 flag가 아닙니다. project가 요구하는 toolchain·release·vendor support와 patch level을 lock합니다.",
      ],
      concepts: [
        { term: "JDK", definition: "compile·run·inspect·package 도구와 runtime modules를 제공하는 Java Development Kit입니다.", detail: ["javac가 포함됩니다.", "vendor/build/version을 기록합니다."] },
        { term: "JVM", definition: "class files를 load·verify·execute하는 virtual machine specification과 구현입니다.", detail: ["Java source compiler와 구분합니다.", "다른 JVM languages도 class file을 만들 수 있습니다."] },
        { term: "runtime image", definition: "application 실행에 필요한 modules와 launcher를 묶은 실행 환경입니다.", detail: ["JDK 전체와 다를 수 있습니다.", "jlink로 custom image를 만들 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "java는 실행되는데 javac 명령을 찾지 못한다.", likelyCause: "runtime-only 환경, 잘못된 PATH 또는 IDE bundled JDK와 shell 환경이 다릅니다.", checks: ["java --version, javac --version, Get-Command java,javac를 확인합니다.", "JAVA_HOME/bin에 javac가 있는지 봅니다.", "IDE project SDK path를 비교합니다."], fix: "지원되는 JDK를 설치하고 JAVA_HOME/PATH/build toolchain을 같은 JDK로 맞춥니다.", prevention: "bootstrap script와 CI에서 java·javac vendor/version을 출력·검증합니다." },
      ],
    },
    {
      id: "source-file-class-declarations-encoding",
      title: "source file 이름·public top-level type·encoding은 compiler input contract입니다",
      lead: "IDE가 자동으로 맞춰 주던 file/type 규칙을 command line error와 연결합니다.",
      explanations: [
        ".java file은 Unicode source를 담고 javac -encoding이 bytes를 characters로 decode합니다. repository는 UTF-8을 명시하고 editorconfig/build options/CI를 맞춥니다.",
        "ordinary compilation unit에는 package, imports와 top-level type declarations가 옵니다. public top-level class/interface는 그 simple name과 같은 source file 이름을 요구합니다. Ex02 public class는 Ex02.java에 있어야 합니다.",
        "한 file에 package-private top-level types를 더 둘 수 있지만 discoverability·incremental compilation·ownership이 나빠질 수 있어 보통 main type별 file을 씁니다.",
        "class name은 대소문자를 구분합니다. Windows case-insensitive filesystem에서 우연히 compile/run되던 casing이 Linux CI에서 깨질 수 있어 source/file/reference casing을 정확히 맞춥니다.",
        "comments·whitespace·identifiers·literals는 lexical input이고 compiler error line/column은 decoded source 기준입니다. 깨진 encoding을 business logic error로 추적하지 않습니다.",
        "compiled .class는 source text를 그대로 저장하지 않습니다. constant strings·line numbers·source file metadata 등 일부는 남을 수 있으므로 secret을 source literal로 넣으면 artifact에서 숨겨지지 않습니다.",
      ],
      concepts: [
        { term: "compilation unit", definition: "package/import/top-level type declarations를 포함하는 하나의 Java source file 단위입니다.", detail: ["보통 .java입니다.", "public type naming rule가 적용됩니다."] },
        { term: "source encoding", definition: "source byte sequence를 Unicode characters로 해석하는 charset입니다.", detail: ["runtime output encoding과 별개입니다.", "build에 명시합니다."] },
        { term: "public top-level type rule", definition: "public top-level type의 simple name과 source filename이 일치해야 하는 compile-time rule입니다.", detail: ["Hello.java와 public class Hello가 맞습니다.", "package path와는 별도 규칙입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "class Ex02 is public, should be declared in a file named Ex02.java 오류가 난다.", likelyCause: "public top-level class simple name과 filename이 다릅니다.", checks: ["public top-level declarations를 나열합니다.", "확장자·대소문자·숨은 이중 확장자를 봅니다.", "IDE refactor가 file도 rename했는지 확인합니다."], fix: "type과 file을 같은 simple name으로 rename하거나 public 여부/구조를 의도대로 재설계합니다.", prevention: "IDE symbol rename과 Linux CI compile을 사용합니다." },
        { symptom: "한글 literal이 깨지거나 unmappable character error가 난다.", likelyCause: "file bytes와 javac -encoding이 다릅니다.", checks: ["editor 표시가 아닌 actual file encoding을 확인합니다.", "javac command의 -encoding을 봅니다.", "terminal output charset 문제와 분리합니다."], fix: "source를 UTF-8로 저장하고 compiler option을 UTF-8로 고정합니다.", prevention: ".editorconfig·build config·CI에서 UTF-8을 명시합니다." },
      ],
    },
    {
      id: "package-directory-fqcn",
      title: "package는 이름 공간이고 directory hierarchy·FQCN·classpath root가 그 이름을 찾게 합니다",
      lead: "class file 자체가 있는 폴더를 classpath로 주는 흔한 실수를 경로 식으로 풉니다.",
      explanations: [
        "package com.ictedu.day01의 class Ex01_main binary name은 com.ictedu.day01.Ex01_main입니다. launcher에는 .class path나 slash가 아니라 이 fully qualified class name을 줍니다.",
        "javac -d build/classes는 build/classes/com/ictedu/day01/Ex01_main.class를 만듭니다. 예상 file path는 classpathRoot + binaryName.replace('.', separator) + '.class'입니다.",
        "따라서 classpath는 build/classes이고 build/classes/com/ictedu/day01이 아닙니다. latter를 root로 주면 launcher가 그 아래 package path를 한 번 더 붙여 찾습니다.",
        "source directory가 package와 물리적으로 맞는 것은 compiler/tool convention과 maintainability에 중요합니다. javac는 explicit source file을 다른 위치에서도 읽을 수 있지만 sourcepath·IDE·build discovery가 불안정해집니다.",
        "unnamed package는 작은 throwaway program에는 편하지만 named package code에서 import할 수 없고 large project organization에 부적합합니다. original은 처음부터 named package를 사용해 후속 classes와 연결됩니다.",
        "classpath entry는 directory뿐 아니라 JAR도 될 수 있고 Windows separator는 semicolon, Unix는 colon입니다. shell quoting과 wildcard expansion을 OS별로 검증합니다.",
      ],
      concepts: [
        { term: "fully qualified class name", definition: "package name과 type simple name을 dot으로 합친 class identity입니다.", detail: ["com.ictedu.day01.Ex01_main 형식입니다.", "launcher input으로 씁니다."] },
        { term: "classpath root", definition: "package hierarchy가 시작되는 directory 또는 class entries를 담은 JAR입니다.", detail: ["class file의 parent directory가 항상 root는 아닙니다.", "여러 entries는 OS separator로 연결합니다."] },
        { term: "binary name", definition: "JVM/class loader가 type을 식별할 때 사용하는 이름입니다.", detail: ["top-level class는 보통 FQCN과 같습니다.", "nested class는 $가 포함될 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "java-classpath-root-proof",
          title: "class path 계산식을 file 존재와 launcher exit로 검증합니다",
          language: "powershell",
          filename: "verify-classpath.ps1",
          purpose: "Windows 학습 환경에서 package class의 올바른 root와 한 단계 너무 깊은 root를 deterministic하게 비교합니다.",
          code: String.raw`$source = "src\com\ictedu\day01\Ex01_main.java"
$out = "build\classes"

javac -encoding UTF-8 -d $out $source
if ($LASTEXITCODE -ne 0) { throw "compile failed" }

$classFile = Join-Path $out "com\ictedu\day01\Ex01_main.class"
"class-exists=$([bool](Test-Path -LiteralPath $classFile))"

java -cp $out com.ictedu.day01.Ex01_main
"correct-exit=$LASTEXITCODE"

java -cp (Join-Path $out "com\ictedu\day01") com.ictedu.day01.Ex01_main 2>$null
"wrong-exit=$LASTEXITCODE"`,
          walkthrough: [
            { lines: "1-5", explanation: "source와 class output을 분리하고 compile failure를 즉시 중단합니다." },
            { lines: "7-8", explanation: "classpath root 아래 binary-name path의 class 존재를 확인합니다." },
            { lines: "10-14", explanation: "올바른 root와 package folder 자체를 root로 준 경우의 process exit를 비교합니다." },
          ],
          run: { environment: ["PowerShell 7+", "JDK 21+", "project root"], command: "pwsh -File verify-classpath.ps1" },
          output: { value: "class-exists=True\nHello, World\ncorrect-exit=0\nwrong-exit=1", explanation: ["올바른 root에서는 main output과 exit 0입니다.", "너무 깊은 root에서는 error text locale과 무관하게 exit 1입니다."] },
          experiments: [
            { change: "launcher name에 .class를 붙입니다.", prediction: "binary name이 아니므로 main class를 찾지 못합니다.", result: "java -cp root package.Class 형식을 지킵니다." },
            { change: "current directory를 build/classes로 옮기고 -cp .을 사용합니다.", prediction: "dot이 올바른 root가 되어 실행됩니다.", result: "relative classpath는 working directory에 의존합니다." },
            { change: "output을 JAR로 만들고 -cp app.jar로 실행합니다.", prediction: "JAR root의 package entries가 같은 식으로 resolve됩니다.", result: "directory와 archive는 classpath entry라는 공통 모델을 가집니다." },
          ],
          sourceRefs: ["java-original-hello-source", "jdk21-javac", "jdk21-java-launcher", "jls-packages"],
        },
      ],
      diagnostics: [
        { symptom: "오류: 기본 클래스를 찾거나 로드할 수 없습니다와 ClassNotFoundException이 나온다.", likelyCause: "FQCN·classpath root·working directory·compile output 중 하나가 어긋났습니다.", checks: ["expected root+binary-name path에 .class가 있는지 확인합니다.", "java -cp value와 pwd를 출력합니다.", "package declaration과 launcher name casing을 비교합니다."], fix: "package hierarchy가 시작되는 output root를 -cp에 주고 exact FQCN으로 실행합니다.", prevention: "run task/build tool이 absolute output과 mainClass를 생성하게 합니다." },
      ],
    },
    {
      id: "javac-phases-output-options",
      title: "javac는 parse·type check·code generation을 수행하고 -d·-encoding·--release·-Xlint가 결과 계약을 만듭니다",
      lead: "compile command를 성공 여부만 보는 주문이 아니라 reproducible transformation으로 읽습니다.",
      explanations: [
        "javac는 source의 declarations와 expressions를 parse하고 name/type/access rules를 검사한 뒤 JVM class files를 만듭니다. syntax/type compile error면 program을 실행해 볼 단계까지 가지 않습니다.",
        "-d는 class output root를 정하고 package subdirectories를 생성합니다. 생략하면 source 옆에 class가 생길 수 있어 source tree를 오염시키고 IDE/bin과 섞입니다.",
        "-encoding UTF-8은 source decoding을 고정합니다. -Xlint:all은 deprecation·unchecked·path·fallthrough 등 recommended warnings를 보여 주지만 warning policy는 project 단계에 맞게 review합니다.",
        "--release N은 N의 language rules에 맞추고 N target class files를 만들며 N platform API view로 compile합니다. -source/-target만 조합해 newer API를 실수로 호출하는 문제를 줄입니다.",
        "compile 여러 files는 dependency graph와 함께 처리할 수 있습니다. sourcepath/classpath/module-path는 compiler가 referenced declarations를 어디서 찾는지 결정합니다.",
        "annotation processing도 javac phase에 들어올 수 있어 untrusted processors와 classpath는 build-time code execution surface입니다. dependency provenance와 explicit processor policy를 관리합니다.",
      ],
      concepts: [
        { term: "compile-time error", definition: "source가 language/type/access 규칙을 만족하지 않아 class generation을 막는 diagnostic입니다.", detail: ["runtime exception과 다릅니다.", "error location과 symbol을 읽습니다."] },
        { term: "class output directory", definition: "-d로 정한 generated class hierarchy root입니다.", detail: ["source와 분리합니다.", "runtime classpath entry가 됩니다."] },
        { term: "--release", definition: "지정 Java SE release의 source rules·target class version·documented platform APIs를 함께 선택하는 javac option입니다.", detail: ["단순 target byte number보다 안전합니다.", "지원 release 범위를 compiler에서 확인합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "compile은 새 JDK에서 되는데 target server에서 method를 찾지 못한다.", likelyCause: "-target만 낮추고 newer platform API로 compile했거나 runtime contract를 검증하지 않았습니다.", checks: ["javac options와 class major를 확인합니다.", "used API가 target release에 존재하는지 봅니다.", "jdeps/target runtime integration을 실행합니다."], fix: "supported javac의 --release target을 사용하고 target runtime에서 test합니다.", prevention: "build toolchain과 release를 repository/CI에 고정합니다." },
      ],
    },
    {
      id: "class-file-bytecode-inspection",
      title: ".class는 source의 단순 압축본이 아니라 JVM이 검증·실행하는 구조화 binary입니다",
      lead: "CAFEBABE header에서 main descriptor와 println invocation까지 javap로 확인합니다.",
      explanations: [
        "class file은 magic 0xCAFEBABE, minor_version, major_version, constant_pool과 access flags, this/super, interfaces, fields, methods, attributes 순서의 binary structure를 가집니다.",
        "JDK 21 default compilation의 major version은 65이고 --release 17 class는 61입니다. 숫자를 외우기보다 javap -verbose와 target runtime matrix로 확인합니다.",
        "constant pool에는 class/method/field/string references와 names/descriptors가 들어갑니다. Hello string 같은 literal이 artifact에 보일 수 있어 password/API key를 source literal로 넣어도 숨겨지지 않습니다.",
        "main descriptor ([Ljava/lang/String;)V는 String array parameter와 void return을 표현합니다. bytecode의 getstatic System.out, ldc string, invokevirtual println sequence가 source call로 연결됩니다.",
        "bytecode는 CPU machine code가 아닙니다. JVM interpreter가 실행하거나 hot methods를 JIT compiler가 native code로 compile할 수 있으며 implementation/runtime profile에 따라 달라집니다.",
        "javap는 disassembler이지 source 복원 보장 tool이 아닙니다. debug line/local metadata, optimization과 compiler transformations에 따라 source와 1:1이 아닙니다.",
      ],
      concepts: [
        { term: "class file major version", definition: "class format을 읽는 데 필요한 JVM generation을 나타내는 header version입니다.", detail: ["JDK 21 class는 보통 65입니다.", "--release 17은 61입니다."] },
        { term: "constant pool", definition: "class가 참조하는 symbolic names·descriptors·literals 등을 모은 class-file table입니다.", detail: ["bytecode operands가 참조합니다.", "secret storage가 아닙니다."] },
        { term: "bytecode", definition: "JVM instruction set로 표현된 method code입니다.", detail: ["CPU native code와 다릅니다.", "verify 후 interpreter/JIT가 실행합니다."] },
      ],
      codeExamples: [
        {
          id: "java-classfile-header-release17",
          title: "--release 17로 만든 자기 class header의 magic·minor·major를 읽습니다",
          language: "java",
          filename: "src/learning/java01/ClassFileHeader.java",
          purpose: "javap 출력 형식에만 기대지 않고 class file 앞 8 bytes와 --release 결과를 Java code로 확인합니다.",
          code: String.raw`package learning.java01;

import java.io.DataInputStream;
import java.io.IOException;
import java.io.InputStream;

public class ClassFileHeader {
    public static void main(String[] args) throws IOException {
        try (InputStream raw = ClassFileHeader.class.getResourceAsStream("ClassFileHeader.class")) {
            if (raw == null) throw new IOException("class resource not found");
            DataInputStream input = new DataInputStream(raw);
            int magic = input.readInt();
            int minor = input.readUnsignedShort();
            int major = input.readUnsignedShort();
            System.out.printf("magic=0x%08X%nminor=%d%nmajor=%d%n", magic, minor, major);
        }
    }
}`,
          walkthrough: [
            { lines: "8-10", explanation: "실행 중인 class와 같은 package resource를 class loader에서 엽니다." },
            { lines: "11-14", explanation: "big-endian int magic과 unsigned 16-bit minor/major를 class-file 순서대로 읽습니다." },
            { lines: "15", explanation: "fixed-width uppercase hex와 decimal versions를 deterministic하게 출력합니다." },
          ],
          run: { environment: ["JDK 21+ compiler", "Java 17+ runtime"], command: "javac --release 17 -encoding UTF-8 -d build/classes src/learning/java01/ClassFileHeader.java && java -cp build/classes learning.java01.ClassFileHeader" },
          output: { value: "magic=0xCAFEBABE\nminor=0\nmajor=61", explanation: ["--release 17이 class major 61을 만듭니다.", "header magic은 class file identity입니다."] },
          experiments: [
            { change: "--release 17을 빼고 JDK 21 default로 compile합니다.", prediction: "major가 65로 바뀝니다.", result: "compiler default가 deployment contract가 되지 않도록 release를 고정합니다." },
            { change: "javap -classpath build/classes -c -verbose learning.java01.ClassFileHeader를 실행합니다.", prediction: "constant pool·descriptor·Code attribute와 instructions가 보입니다.", result: "binary header 다음 구조를 이어서 조사합니다." },
            { change: "class 앞 byte를 손상시킵니다.", prediction: "JVM이 invalid/corrupt class format으로 거부합니다.", result: "class verification 이전에 format contract가 검사됩니다." },
          ],
          sourceRefs: ["jvms-class-file", "jdk21-javap", "jdk21-javac", "jep247-release"],
        },
      ],
      diagnostics: [
        { symptom: "UnsupportedClassVersionError가 난다.", likelyCause: "class major version이 실행 JVM이 지원하는 것보다 높습니다.", checks: ["javap -verbose의 major version을 봅니다.", "java --version과 compile JDK/--release를 비교합니다.", "dependency JAR class versions도 검사합니다."], fix: "runtime을 supported newer version으로 올리거나 source/API 호환을 확인해 --release target으로 다시 compile합니다.", prevention: "CI toolchain·release matrix와 artifact class-version check를 둡니다." },
      ],
    },
    {
      id: "jvm-load-link-initialize-execute",
      title: "launcher 뒤 JVM은 class를 load·link·initialize한 다음 main을 실행합니다",
      lead: "컴파일·class loading·static initialization·method execution을 같은 단계로 뭉개지 않습니다.",
      explanations: [
        "java launcher가 main class를 지정하면 class loader가 binary name으로 class bytes를 찾고 Class object를 만듭니다. classpath 문제는 source compile 문제와 별도입니다.",
        "linking은 verification, preparation과 optional resolution을 포함합니다. verifier는 class structure와 bytecode type safety constraints를 확인하고 preparation은 static fields의 storage/default values를 준비합니다.",
        "initialization은 class initialization method를 실행해 static field initializers와 static blocks를 source order에 따라 수행합니다. main body 전에 실패하면 ExceptionInInitializerError 같은 오류가 날 수 있습니다.",
        "main method invocation 뒤 operand stacks·local variables를 가진 frames에서 bytecode가 실행됩니다. println은 java.base의 PrintStream method call로 이어집니다.",
        "NoClassDefFoundError는 compile 때 있던 dependency definition을 runtime에 load하지 못하거나 initialization failure를 재사용할 때 나타날 수 있고 launcher의 initial main search ClassNotFound와 맥락이 다릅니다.",
        "class loader identity는 binary name만이 아니라 defining loader도 포함합니다. application server/plugin 환경의 같은 name class가 cast 불가능한 advanced 문제로 이어질 수 있습니다.",
      ],
      concepts: [
        { term: "loading", definition: "binary name으로 class bytes를 찾아 JVM의 Class representation을 만드는 단계입니다.", detail: ["class loader가 담당합니다.", "classpath/module path가 관여합니다."] },
        { term: "linking", definition: "class를 verify·prepare하고 symbolic references를 resolve할 수 있게 만드는 단계입니다.", detail: ["실행 안전성을 검사합니다.", "initialization과 구분합니다."] },
        { term: "initialization", definition: "static field initializers와 static blocks를 실행해 class를 active use에 준비하는 단계입니다.", detail: ["main 이전일 수 있습니다.", "실패 상태가 후속 load에 영향 줍니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "compile 성공 후 NoClassDefFoundError가 난다.", likelyCause: "runtime classpath에 transitive dependency가 없거나 dependency initialization이 이전에 실패했습니다.", checks: ["Caused by 전체 chain을 읽습니다.", "missing binary name을 classpath/JAR에서 찾습니다.", "compile/runtime dependency scopes와 initialization logs를 확인합니다."], fix: "runtime artifact graph를 완성하고 initialization root cause를 고칩니다.", prevention: "packaged artifact를 clean target-like runtime에서 smoke test합니다." },
      ],
    },
    {
      id: "classic-main-args-exit-streams",
      title: "classic main은 launcher와 application을 잇는 entry contract이며 args·streams·exit status를 소유합니다",
      lead: "public static void main(String[] args)를 외우지 않고 OS process 경계로 해석합니다.",
      explanations: [
        "Java 21 conventional class launcher에서 main은 public static void이고 String[] parameter를 가집니다. public은 launcher access, static은 instance 없이 호출, void는 process result를 return value가 아닌 exit status로 전달, args는 command-line tokens입니다.",
        "String[] args와 String... args는 같은 array parameter descriptor로 launchable classic signature가 될 수 있습니다. main return type을 int로 바꾸거나 parameter를 String 하나로 바꾸면 classic entry가 아닙니다.",
        "shell이 quoting과 tokenization을 먼저 처리합니다. alpha와 'beta gamma'를 quote하면 args length 2이고 second argument 안 space가 보존됩니다. Windows PowerShell과 POSIX shell quoting rules는 다릅니다.",
        "System.out은 정상 output, System.err는 diagnostics를 분리하는 conventional streams입니다. newline과 encoding, buffering, redirect/pipeline behavior를 output contract에 포함합니다.",
        "main이 정상 return하면 보통 exit 0이고 uncaught exception이나 launcher error는 nonzero입니다. System.exit(code)는 process를 즉시 끝내므로 library/deep method에서 남용하지 않고 top-level policy에서 사용합니다.",
        "secret/token을 command-line args로 넘기면 process listing·shell history·CI logs에 노출될 수 있습니다. secret manager/file descriptor/environment의 threat model을 검토하고 raw args를 log하지 않습니다.",
      ],
      concepts: [
        { term: "entry point", definition: "launcher가 application 실행을 시작하기 위해 선택·호출하는 main method contract입니다.", detail: ["OS process boundary와 연결됩니다.", "version별 launchable forms가 다를 수 있습니다."] },
        { term: "command-line argument", definition: "shell tokenization 뒤 main의 String array에 전달되는 문자열입니다.", detail: ["args[0]은 첫 application argument입니다.", "Java executable/class name은 포함되지 않습니다."] },
        { term: "process exit status", definition: "application이 caller shell/OS에 성공·실패를 정수로 전달하는 값입니다.", detail: ["stdout text와 별개입니다.", "automation이 검사합니다."] },
      ],
      codeExamples: [
        {
          id: "java-main-arguments-contract",
          title: "quoted argument가 String[]에 어떤 index와 값으로 들어오는지 출력합니다",
          language: "java",
          filename: "src/learning/java01/CommandLineArgs.java",
          purpose: "main signature와 shell quoting·args length/index를 deterministic output으로 연결합니다.",
          code: String.raw`package learning.java01;

public class CommandLineArgs {
    public static void main(String[] args) {
        System.out.println("count=" + args.length);
        for (int index = 0; index < args.length; index++) {
            System.out.println(index + "=" + args[index]);
        }
    }
}`,
          walkthrough: [
            { lines: "4-5", explanation: "launcher가 전달한 array 길이를 먼저 출력해 index boundary를 고정합니다." },
            { lines: "6-8", explanation: "0부터 length-1까지 각 token을 index와 함께 출력합니다." },
          ],
          run: { environment: ["JDK 21+", "PowerShell 또는 quote를 보존하는 shell"], command: "javac -d build/classes src/learning/java01/CommandLineArgs.java && java -cp build/classes learning.java01.CommandLineArgs alpha \"beta gamma\"" },
          output: { value: "count=2\n0=alpha\n1=beta gamma", explanation: ["class name은 args에 포함되지 않습니다.", "quote는 shell syntax이고 전달된 second String에는 quote 없이 space가 남습니다."] },
          experiments: [
            { change: "quote를 제거해 beta gamma를 두 tokens로 줍니다.", prediction: "count=3이고 indices 1,2에 beta와 gamma가 나뉩니다.", result: "shell tokenization이 Java 이전에 일어납니다." },
            { change: "argument 없이 실행합니다.", prediction: "count=0이고 loop body는 실행되지 않습니다.", result: "args[0] 직접 접근 전 length를 검증합니다." },
            { change: "secret을 argument로 전달하고 process list/history를 확인합니다.", prediction: "운영 환경에서 노출 surface가 생길 수 있습니다.", result: "민감 값 전달 channel과 logging을 재설계합니다." },
          ],
          sourceRefs: ["java-original-hello-source", "jdk21-java-launcher", "jls-execution", "jep512-compact-main"],
        },
      ],
      diagnostics: [
        { symptom: "Main method not found 또는 main method is not static 오류가 난다.", likelyCause: "현재 runtime이 선택할 수 있는 launchable main signature와 선언이 다릅니다.", checks: ["java --version을 확인합니다.", "javap -public ClassName으로 main descriptor/modifiers를 봅니다.", "class 이름과 actually loaded artifact를 확인합니다."], fix: "Java 21 baseline이면 public static void main(String[] args)를 사용하고 Java 25+ alternative는 target toolchain을 명시합니다.", prevention: "launcher smoke test를 target runtime에서 실행합니다." },
      ],
    },
    {
      id: "java25-compact-source-instance-main",
      title: "Java 25+ compact source·instance main은 정식 on-ramp이지만 Java 21 baseline code와 version을 섞지 않습니다",
      lead: "classic form을 유일한 진리로 가르치지도, 최신 syntax를 older runtime에 설명 없이 넣지도 않습니다.",
      explanations: [
        "OpenJDK JEP 512는 Java 25에서 compact source files와 instance main methods를 정식 도입했습니다. class 선언 없이 void main()을 쓰거나 named class에서 non-static no-arg main을 launch할 수 있습니다.",
        "Java 25+ launcher는 String[] parameter main을 우선 선택하고 없으면 no-arg main을 선택합니다. chosen main이 instance method면 accessible no-arg constructor로 instance를 만든 뒤 호출합니다.",
        "compact source file은 top-level statements가 아니라 enclosing class 없이 fields와 methods를 적으면 compiler가 unnamed package의 implicit final class를 만드는 형태입니다. implementation-generated class name에 source code가 의존하면 안 됩니다.",
        "classic public static void main(String[] args)는 여전히 large project·older LTS·framework/build tool compatibility와 command-line args 설명에 안정적입니다. 이 과정의 executable examples는 installed Java 21 baseline으로 classic form을 사용합니다.",
        "Java 21에는 이 기능이 preview history로 일부 존재했지만 preview flags와 syntax가 final Java 25와 같다고 가정하지 않습니다. production course는 final target release documentation을 따릅니다.",
        "학습자는 compact form에서 변수·제어를 익힌 뒤 explicit class/package로 자연스럽게 확장할 수 있지만 repository code style과 team runtime matrix를 먼저 확인합니다.",
      ],
      concepts: [
        { term: "compact source file", definition: "Java 25+에서 explicit class declaration 없이 fields와 methods로 implicit class를 선언하는 source form입니다.", detail: ["launchable main이 필요합니다.", "unnamed package에 속합니다."] },
        { term: "instance main", definition: "Java 25+ launcher가 instance를 생성해 호출할 수 있는 non-static launchable main method입니다.", detail: ["no-arg constructor 조건이 있습니다.", "String[] 또는 no-arg form이 가능합니다."] },
        { term: "version-aware teaching", definition: "syntax·launcher contract를 적용 가능한 Java release와 함께 명시하는 방식입니다.", detail: ["older LTS 혼란을 막습니다.", "preview와 final을 구분합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "void main() compact example이 Java 21 project에서 compile되지 않는다.", likelyCause: "Java 25 final feature를 older baseline 또는 다른 preview stage에서 사용했습니다.", checks: ["javac --version과 --release를 확인합니다.", "preview flag/source version을 봅니다.", "JEP final release와 project runtime matrix를 비교합니다."], fix: "target을 Java 25+로 올리거나 classic main으로 작성합니다.", prevention: "모든 example에 minimum/final release badge와 CI matrix를 둡니다." },
      ],
      comparisons: [
        { title: "첫 program entry form", options: [
          { name: "classic main", chooseWhen: "Java 21/older compatibility, package project, frameworks와 explicit args contract가 필요할 때", avoidWhen: "Java 25+ 단일 학습 script에서 ceremony가 학습을 가릴 때", tradeoffs: ["넓게 호환되고 구조가 명시적입니다.", "초심자에게 class/static/array 설명이 한꺼번에 옵니다."] },
          { name: "compact source", chooseWhen: "Java 25+에서 작은 학습·script program을 빠르게 시작할 때", avoidWhen: "named package API/component로 바로 성장해야 할 때", tradeoffs: ["on-ramp가 간결합니다.", "unnamed implicit class와 release requirement가 있습니다."] },
          { name: "JShell", chooseWhen: "표현식·API를 한 줄씩 탐색하고 즉시 feedback이 필요할 때", avoidWhen: "재현 가능한 complete source program·build artifact가 목표일 때", tradeoffs: ["실험이 빠릅니다.", "snippet state가 실제 program file과 다릅니다."] },
        ] },
      ],
    },
    {
      id: "release-compatibility-artifact-boundary",
      title: "compile JDK·--release·runtime JDK·dependency class versions를 하나의 compatibility matrix로 관리합니다",
      lead: "내 PC에서 최신 JDK로 된다는 사실보다 배포 runtime이 class와 API를 읽을 수 있는지가 중요합니다.",
      explanations: [
        "newer JVM은 보통 older class-file versions를 읽지만 older JVM은 newer major version을 거부합니다. binary compatibility와 actual API behavior는 별도 test가 필요합니다.",
        "--release 17은 JDK 21 compiler에서 Java 17 source rules·class version·documented platform API를 target합니다. compiler 자체는 21이어도 artifact contract는 17이 됩니다.",
        "third-party dependency 하나가 higher class version이면 own source를 낮춰 compile해도 runtime이 그 JAR를 load할 때 실패할 수 있습니다. dependency graph 전체를 scan합니다.",
        "preview features는 --enable-preview를 compile과 run 양쪽에 요구하고 같은 release coupling이 강합니다. production library API에 preview class format을 무심코 배포하지 않습니다.",
        "multi-release JAR은 runtime version별 entries를 가질 수 있어 단일 javap 결과만으로 package behavior를 단정하지 않습니다. JAR manifest와 versions directory를 조사합니다.",
        "reproducible build는 source commit·JDK vendor/version·release·dependencies·encoding·options와 generated artifact hash/provenance를 기록합니다.",
      ],
      concepts: [
        { term: "toolchain version", definition: "compile/build에 실제 사용하는 JDK vendor·feature·patch version입니다.", detail: ["target release와 다릅니다.", "CI에 고정합니다."] },
        { term: "runtime compatibility", definition: "배포 JVM이 class format과 referenced APIs/behavior를 지원하는 조건입니다.", detail: ["major version만으로 전부 보장되지 않습니다.", "target-like test가 필요합니다."] },
        { term: "artifact provenance", definition: "어떤 source·toolchain·options·dependencies로 binary가 만들어졌는지 추적하는 metadata입니다.", detail: ["재현·보안에 중요합니다.", "SBOM/attestation과 연결됩니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "own classes는 major 61인데 dependency load에서 version error가 난다.", likelyCause: "dependency JAR 안 class가 더 높은 release로 compile되었습니다.", checks: ["error가 지목한 binary를 찾습니다.", "JAR entries의 javap/major를 검사합니다.", "dependency minimum Java version을 확인합니다."], fix: "target-compatible dependency version을 선택하거나 runtime/toolchain을 지원 범위로 올립니다.", prevention: "dependency class-version CI rule과 runtime smoke test를 둡니다." },
      ],
    },
    {
      id: "ide-build-layout-debugging",
      title: "IDE Run 버튼도 결국 source root·compiler output·classpath·main class 설정을 실행합니다",
      lead: "IDE 설정을 black box로 두지 않고 command-line mental model과 왕복합니다.",
      explanations: [
        "Eclipse .classpath/.project, IntelliJ module, Gradle/Maven source sets는 source roots·output·dependencies·language level을 관리합니다. Run configuration은 main class와 runtime classpath를 조립합니다.",
        "IDE project language level과 실제 compiler JDK, build tool daemon JDK, terminal JDK가 다를 수 있습니다. settings 화면만 보지 말고 build log의 executable/version/options를 확인합니다.",
        "bin/build/classes/target/classes 같은 outputs가 여러 개면 stale/duplicate class shadowing이 생깁니다. runtime classpath order에서 먼저 나온 definition이 load될 수 있습니다.",
        "debugger line breakpoint는 class의 LineNumberTable과 source mapping을 사용합니다. source와 loaded class가 다르면 breakpoint가 회색이거나 엉뚱한 줄에서 멈춥니다.",
        "build tool을 도입하면 compile/test/package/run tasks를 source-controlled configuration으로 재현할 수 있습니다. 첫 수업의 raw javac 이해는 build tool 오류를 해석하는 기반입니다.",
        "generated artifacts·IDE metadata의 version-control 정책을 명시합니다. source와 build scripts는 보존하고 machine-specific caches/output은 제외합니다.",
      ],
      concepts: [
        { term: "source root", definition: "package hierarchy가 시작되고 build tool이 Java compilation units를 발견하는 directory입니다.", detail: ["src가 흔합니다.", "package directory 자체와 구분합니다."] },
        { term: "class shadowing", definition: "같은 binary name의 여러 definitions 중 classpath 앞 entry가 선택되는 문제입니다.", detail: ["stale output이 원인이 될 수 있습니다.", "location을 출력해 진단합니다."] },
        { term: "run configuration", definition: "JDK·classpath/module path·main class·args·working directory·environment를 묶은 IDE 실행 설정입니다.", detail: ["command-line으로 환원할 수 있습니다.", "team 공유 여부를 정합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "IDE에서는 되는데 terminal/CI에서는 class를 못 찾는다.", likelyCause: "IDE가 추가 source/output/dependency classpath를 암묵적으로 넣거나 JDK가 다릅니다.", checks: ["IDE run command/classpath를 export합니다.", "working directory와 environment를 비교합니다.", "clean build tool task로 재현합니다."], fix: "source-controlled build/run configuration으로 dependency와 main class를 명시합니다.", prevention: "CI와 local이 같은 wrapper/toolchain을 사용하게 합니다." },
      ],
    },
    {
      id: "diagnostic-decision-tree-first-java",
      title: "첫 Java 오류는 compile·locate·load/link·initialize·execute 단계부터 분류합니다",
      lead: "메시지를 무작정 검색하기 전에 어느 artifact까지 성공했는지 확인합니다.",
      explanations: [
        "javac nonzero이고 .class가 없으면 source/compile 문제입니다. public filename, syntax, symbol, type, encoding과 compiler options를 봅니다.",
        "compile output은 있는데 launcher가 main class를 못 찾으면 FQCN·classpath root·working directory·case 문제입니다. expected path 식으로 file 존재를 확인합니다.",
        "class를 찾았지만 version/format/verification에서 실패하면 javap header, runtime version과 artifact corruption/dependency를 봅니다.",
        "main 선택 실패면 actually loaded class의 public methods와 runtime version을 확인합니다. source file만 보고 stale class를 놓치지 않습니다.",
        "initialization·execution exception이면 full stack trace의 첫 application frame과 deepest cause를 읽고 exit status·stdout/stderr를 함께 보존합니다.",
        "진단 command 자체가 secrets·full classpath·home path를 logs에 과도하게 노출하지 않도록 support bundle을 sanitize합니다.",
      ],
      concepts: [
        { term: "stage-first diagnosis", definition: "compile→locate→load/link→initialize→execute 중 failure stage를 먼저 좁히는 절차입니다.", detail: ["검색 범위를 줄입니다.", "증거를 보존합니다."] },
        { term: "minimal reproduction", definition: "같은 JDK/options/path에서 failure에 필요한 최소 source·dependency만 남긴 재현입니다.", detail: ["환경 drift를 찾습니다.", "민감 정보는 제거합니다."] },
        { term: "exit evidence", definition: "stdout·stderr·process exit code·tool version·command를 함께 기록한 실행 결과입니다.", detail: ["화면 screenshot보다 자동 비교가 쉽습니다.", "locale-dependent text를 분리합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "어디부터 잘못됐는지 모르겠고 오류를 바꿀 때마다 새 오류가 난다.", likelyCause: "compile·classpath·runtime 문제를 동시에 수정해 causal evidence를 잃었습니다.", checks: ["java/javac version과 exact command를 기록합니다.", ".class expected path·major·main descriptor를 순서대로 확인합니다.", "한 단계씩 exit code를 고정합니다."], fix: "clean output에서 stage-first decision tree를 따라 최초 failure 하나를 고칩니다.", prevention: "compile/run smoke script와 known-good Hello fixture를 repository에 둡니다." },
      ],
      expertNotes: [
        "production crash triage에서는 hs_err_pid crash log·JFR·class loading logs가 필요할 수 있지만 first lesson에서는 Java exception과 VM crash를 구분하는 데 집중합니다.",
        "class loading boundary는 later servlet container, plugin, application server와 test isolation의 핵심이므로 binary name+defining loader identity를 다시 연결합니다.",
      ],
    },
  ],
  lab: {
    title: "source에서 versioned class artifact와 진단 가능한 launcher까지",
    scenario: "원본 Hello와 safe profile program을 command line에서 clean compile하고, class header·classpath·args·exit evidence를 자동 확인하는 작은 Java application layout을 만듭니다.",
    setup: [
      "JDK vendor·java/javac version·executable path를 기록하고 project baseline을 Java 21로 정합니다.",
      "src/com/ictedu/day01 아래 원본 two sources는 read-only로 두고 build/classes를 clean output으로 사용합니다.",
      "public example에는 가상 학습자 정보만 사용하고 source·terminal encoding을 UTF-8로 고정합니다.",
      "PowerShell verification script는 compile/run/javap steps와 exit code를 단계별로 중단·출력하게 합니다.",
    ],
    steps: [
      "Ex01_main과 Ex02의 package·public class·main·print calls를 line-by-line source audit합니다.",
      "java --version, javac --version과 actual executable path를 비교해 toolchain identity를 고정합니다.",
      "javac -encoding UTF-8 -Xlint:all -d build/classes로 두 원본을 compile합니다.",
      "expected binary-name path 아래 두 class files가 있고 source tree에 새 class가 생기지 않았음을 검증합니다.",
      "java -cp build/classes FQCN으로 두 mains를 실행해 exact stdout과 exit 0을 기록합니다.",
      "wrong classpath root와 wrong FQCN을 각각 실행해 nonzero exit를 재현하고 locale-independent checks를 만듭니다.",
      "javap -public -c -verbose로 main descriptor, major version, constant pool과 println instructions를 확인합니다.",
      "ClassFileHeader를 --release 17로 compile해 magic CAFEBABE와 major 61을 program output으로 검증합니다.",
      "CommandLineArgs에 alpha와 quoted beta gamma를 전달해 length/index를 확인합니다.",
      "classic main과 Java 25 compact/instance main의 minimum release와 선택 기준을 비교표에 기록합니다.",
      "compile·locate·load/link·initialize·execute decision tree로 filename/version/main/dependency failures를 분류합니다.",
      "clean build를 다시 실행해 same inputs에서 같은 observable output과 artifact inventory가 나오는지 확인합니다.",
    ],
    expectedResult: [
      "source와 generated .class가 분리되고 package hierarchy가 output root 아래 정확히 생성됩니다.",
      "두 original mains가 expected UTF-8 output과 exit 0을 내며 개인 데이터는 public example에 복제되지 않습니다.",
      "wrong classpath는 class not found category와 nonzero exit로 안정적으로 감지됩니다.",
      "javap/header reader가 target release의 class major와 main descriptor·bytecode evidence를 보여 줍니다.",
      "quoted args·stdout/stderr·exit status가 automation 가능한 process contract로 문서화됩니다.",
      "Java 21 classic baseline과 Java 25+ compact syntax가 version label 없이 섞이지 않습니다.",
      "ClassNotFound·NoClassDefFound·UnsupportedClassVersion·main/encoding 오류가 stage-first checks에 매핑됩니다.",
    ],
    cleanup: ["build/classes와 temporary inspection output만 안전하게 제거하고 original src·IDE bin은 임의 변경하지 않습니다.", "diagnostic logs에서 local usernames·absolute paths·arguments의 민감 값을 제거합니다."],
    extensions: [
      "jar --create --main-class로 executable JAR를 만들고 manifest main class와 java -jar classpath 차이를 확인합니다.",
      "jlink로 최소 runtime image를 만들고 JDK 전체와 module inventory·size·launcher를 비교합니다.",
      "Gradle/Maven toolchain과 --release를 설정해 raw javac command와 generated arguments를 비교합니다.",
      "Java 25+ 별도 CI job에서 compact source와 instance main final behavior를 실행해 baseline lesson과 나란히 둡니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 두 source를 clean output에 compile·run하고 package/classpath/header evidence를 기록하세요.", requirements: ["java/javac vendor·version·path를 확인합니다.", "-encoding UTF-8 -Xlint:all -d를 사용합니다.", "두 .class relative paths와 stdout을 확인합니다.", "javap로 main descriptor와 major를 찾습니다.", "source tree에 generated class가 생기지 않게 합니다."], hints: ["-d directory가 classpath root가 됩니다.", "java command에는 .class path가 아니라 FQCN을 줍니다."], expectedOutcome: "source→class→JVM 실행의 각 input/output을 설명하고 재현합니다.", solutionOutline: ["toolchain→compile→artifact path→launch→inspect 순으로 evidence를 모읍니다.", "각 command exit code를 확인합니다."] },
    { difficulty: "응용", prompt: "의도적으로 filename·classpath·release·main 네 failure를 만들고 decision tree로 진단하세요.", requirements: ["원본을 수정하지 않고 temporary fixture/output을 사용합니다.", "public type/file mismatch compile failure를 분류합니다.", "too-deep classpath class-not-found를 재현합니다.", "higher major/older runtime 또는 simulated compatibility evidence를 분석합니다.", "wrong main signature를 javap와 launcher로 확인합니다."], hints: ["한 번에 한 조건만 바꾸세요.", "locale-dependent message보다 stage·exception class·exit를 기록하세요."], expectedOutcome: "오류 검색 없이 최초 실패 단계와 수정 지점을 evidence로 찾습니다.", solutionOutline: ["compile artifact 존재 여부부터 시작합니다.", "expected class path와 header/method descriptor를 차례로 봅니다."] },
    { difficulty: "설계", prompt: "Java 21 배포와 Java 25 학습 on-ramp가 공존하는 팀 toolchain·artifact policy를 설계하세요.", requirements: ["classic/compact source의 적용 범위와 minimum release를 정합니다.", "JDK vendor/patch·--release·dependency major validation을 CI에 넣습니다.", "source/generated/IDE metadata version-control policy를 작성합니다.", "artifact provenance·SBOM·secret/PII minimization을 포함합니다.", "canary runtime update와 rollback/compatibility matrix를 정의합니다."], hints: ["compile JDK와 target runtime은 같은 숫자일 필요가 없지만 contract가 필요합니다.", "preview history와 Java 25 final syntax를 섞지 마세요."], expectedOutcome: "초심자 경험과 production compatibility를 동시에 만족하는 implementation-ready Java toolchain policy가 완성됩니다.", solutionOutline: ["baseline release와 optional modern lane을 분리합니다.", "같은 smoke/contract suite를 target runtimes에 실행합니다."] },
  ],
  reviewQuestions: [
    { question: "JDK와 JVM은 같은 것인가요?", answer: "아닙니다. JDK는 compiler·launcher·inspection tools와 runtime을 제공하고 JVM은 class file을 load·verify·execute하는 virtual machine입니다." },
    { question: "javac는 무엇을 만드나요?", answer: "Java source declarations를 검사·compile해 JVM이 실행할 .class files를 만듭니다." },
    { question: "-d를 왜 사용하나요?", answer: "generated classes를 source와 분리하고 package hierarchy가 시작되는 output root를 명시하기 위해서입니다." },
    { question: "package 선언과 source directory가 반드시 byte-for-byte 같은 경로여야 compile되나요?", answer: "explicit file compilation은 다른 위치에서도 가능할 수 있지만 standard source layout·discovery·tools를 위해 package hierarchy와 맞춥니다." },
    { question: "public class Ex02를 Foo.java에 둘 수 있나요?", answer: "ordinary compilation unit에서 public top-level type 이름과 source filename이 맞아야 하므로 Ex02.java가 필요합니다." },
    { question: "java -cp에는 Ex01_main.class가 있는 마지막 directory를 주나요?", answer: "아닙니다. package hierarchy가 시작되는 root를 주고 launcher에는 com.ictedu.day01.Ex01_main FQCN을 줍니다." },
    { question: "classpath와 sourcepath는 같은가요?", answer: "아닙니다. classpath는 compiled classes/JAR lookup, sourcepath는 compiler의 source lookup에 사용됩니다." },
    { question: "JDK 21 class-file major version은 무엇인가요?", answer: "default target은 보통 65이며 --release 17은 61입니다. javap로 artifact를 직접 확인합니다." },
    { question: "bytecode는 CPU machine code인가요?", answer: "아닙니다. JVM instruction이고 runtime이 interpret하거나 JIT로 native code를 만들 수 있습니다." },
    { question: "main의 args[0]은 Java class 이름인가요?", answer: "아닙니다. 첫 application argument이며 class name과 java options는 포함되지 않습니다." },
    { question: "main이 int를 return해 exit code를 전달하나요?", answer: "classic main은 void이고 normal return/System.exit/uncaught failure로 process status가 결정됩니다." },
    { question: "System.out과 System.err는 같은 stream인가요?", answer: "아닙니다. 정상 output과 diagnostic용 별도 standard streams이며 redirect할 수 있습니다." },
    { question: "--release 17과 -target 17은 완전히 같은가요?", answer: "아닙니다. --release는 source rules·target class format과 target platform API view를 함께 선택합니다." },
    { question: "newer JDK로 compile하면 모든 older JVM에서 실행되나요?", answer: "아닙니다. class major와 referenced APIs가 target runtime과 호환되어야 합니다." },
    { question: "ClassNotFoundException과 NoClassDefFoundError는 항상 같은 원인인가요?", answer: "아닙니다. initial lookup/classpath와 runtime dependency·initialization failure 등 맥락을 나눠야 합니다." },
    { question: "Java에서 main은 항상 public static void main(String[] args) 하나뿐인가요?", answer: "Java 21 classic baseline에서는 그 form을 사용하지만 Java 25+는 instance/no-arg main과 compact source files도 정식 지원합니다." },
    { question: "compact source file은 top-level statements script인가요?", answer: "아닙니다. class 선언 밖 fields/methods가 implicit class members가 되고 launchable main이 필요합니다." },
    { question: "IDE Run이 되면 command-line model은 몰라도 되나요?", answer: "아닙니다. IDE도 JDK·output·classpath·main·args를 조립하므로 model을 알아야 환경 차이를 진단합니다." },
    { question: "source에 password literal을 넣으면 .class에서 숨겨지나요?", answer: "아닙니다. constant pool 등 artifact에서 발견될 수 있으므로 source/artifact에 secret을 넣지 않습니다." },
  ],
  completionChecklist: [
    "inventory의 Ex01_main.java와 Ex02.java 두 source를 실제로 읽고 사용했다.",
    "원본의 package·public class·classic main·print/println을 line-level로 감사했다.",
    "원본 개인 연락처를 public example에 복제하지 않고 가상 data로 최소화했다.",
    "java·javac·javap vendor/version/executable path와 project baseline을 확인했다.",
    "JDK·JVM·runtime image와 compiler/launcher/disassembler 역할을 구분했다.",
    "source encoding과 terminal output encoding을 구분하고 UTF-8 compile을 고정했다.",
    "public top-level type와 filename·case 규칙을 검증했다.",
    "-d output을 source/IDE bin과 분리하고 generated files를 version control에서 제외했다.",
    "package·FQCN·binary-name path·classpath root 계산식을 적용했다.",
    "두 originals를 clean compile/run해 expected stdout와 exit 0을 확인했다.",
    "wrong classpath에서 class-not-found와 nonzero exit를 재현했다.",
    "javap로 class major·main descriptor·constant pool·bytecode를 조사했다.",
    "CAFEBABE/minor/major header를 --release 17 exact example로 읽었다.",
    "loading·verification/preparation/resolution·initialization·execution을 compile과 분리했다.",
    "classic main modifiers/parameter와 quoted String[] args를 exact output으로 검증했다.",
    "stdout·stderr·newline·exit status와 argument secret exposure를 process contract에 포함했다.",
    "--release와 compiler/runtime/dependency class-version compatibility matrix를 만들었다.",
    "Java 21 classic baseline과 Java 25+ compact source·instance main을 version-aware하게 구분했다.",
    "IDE/build tool output·classpath order·stale class·debug source mapping을 진단했다.",
    "compile→locate→load/link→initialize→execute decision tree를 주요 오류에 적용했다.",
    "clean reproducible build와 artifact provenance·privacy-safe diagnostic logging을 검증했다.",
  ],
  nextSessions: ["java-02-primitives-variables"],
  sources: [
    { id: "java-original-hello-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day01/Ex01_main.java", usedFor: ["package declaration", "public class", "classic main", "println", "Hello output", "compile/run"], evidence: "원본을 JDK 21.0.11로 clean output에 compile해 package class path, stdout와 class major를 확인했습니다." },
    { id: "java-original-print-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day01/Ex02.java", usedFor: ["print", "empty println", "println", "UTF-8 Korean source", "output order", "privacy minimization"], evidence: "원본의 출력 API·한글 evidence는 보존하고 public example에서는 개인 연락처를 가상 학습자 data로 대체했습니다." },
    { id: "jdk21-javac", repository: "Oracle Java SE 21 Tool Specifications", path: "javac command", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["source to class", "-d", "-encoding", "--release", "classpath", "Xlint", "source arrangement"], evidence: "JDK 21 baseline compile command·output directory·compatibility options의 공식 기준입니다." },
    { id: "jdk21-java-launcher", repository: "Oracle Java SE 21 Tool Specifications", path: "java command", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html", usedFor: ["launcher", "classpath", "main class", "source-file mode", "options", "exit/runtime"], evidence: "classic JDK 21 launch와 classpath/source-file mode의 공식 tool 기준입니다." },
    { id: "jdk21-javap", repository: "Oracle Java SE 21 Tool Specifications", path: "javap command", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javap.html", usedFor: ["disassembly", "-c", "-verbose", "descriptors", "class version", "constant pool"], evidence: "class header와 main bytecode를 source와 대조하는 inspection 기준입니다." },
    { id: "jdk-printstream-api", repository: "Oracle Java SE 21 API", path: "java.io.PrintStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/PrintStream.html", usedFor: ["print", "println", "printf", "line terminator", "stdout/stderr"], evidence: "원본 Ex02의 print·println output contract를 설명하는 공식 API입니다." },
    { id: "jls-packages", repository: "Oracle Java Language Specification 21", path: "Chapter 7 Packages and Modules", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-7.html", usedFor: ["package declaration", "compilation units", "unnamed package", "top-level type", "observable packages"], evidence: "source unit·package name과 type organization의 language 기준입니다." },
    { id: "jls-execution", repository: "Oracle Java Language Specification 21", path: "Chapter 12 Execution", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html", usedFor: ["loading", "linking", "initialization", "classic main", "execution", "errors"], evidence: "Java 21 baseline JVM startup와 main invocation, class lifecycle 설명의 기준입니다." },
    { id: "jvms-class-file", repository: "Oracle Java Virtual Machine Specification 21", path: "Chapter 4 The class File Format", publicUrl: "https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html", usedFor: ["CAFEBABE", "minor/major", "constant pool", "methods", "Code attribute", "verification"], evidence: "ClassFileHeader exact example와 javap interpretation의 VM specification 기준입니다." },
    { id: "jep247-release", repository: "OpenJDK", path: "JEP 247 Compile for Older Platform Versions", publicUrl: "https://openjdk.org/jeps/247", usedFor: ["--release", "source/target/API combination", "cross compilation"], evidence: "target class version만 낮추는 방식보다 platform API까지 함께 제한하는 이유를 보강했습니다." },
    { id: "jep512-compact-main", repository: "OpenJDK", path: "JEP 512 Compact Source Files and Instance Main Methods", publicUrl: "https://openjdk.org/jeps/512", usedFor: ["Java 25 final", "compact source", "instance main", "launch selection", "on-ramp"], evidence: "classic main을 유일한 form으로 단정하지 않으면서 Java 21 baseline과 Java 25 final feature를 정확히 구분했습니다." },
  ],
  sourceCoverage: {
    filesRead: 2,
    filesUsed: 2,
    uncoveredNotes: [
      "inventory의 두 Java source를 모두 읽고 Temurin JDK 21.0.11에서 -encoding UTF-8 -Xlint:all -d temporary-output으로 compile·run했습니다.",
      "두 .class가 com/ictedu/day01 hierarchy에 생성되고 Ex01 Hello output, Ex02 print/println 순서와 UTF-8 한글이 실행됨을 확인했습니다.",
      "원본 Ex02의 실제 개인 이름·전화·이메일은 public 학습 목적에 필요하지 않아 source를 공개 링크로 노출하거나 값을 복제하지 않고 가상 data로 바꿨습니다.",
      "JDK 21 default class major 65와 wrong classpath ClassNotFound/nonzero exit를 실제 javap/launcher로 확인했고 --release 17 header example은 major 61 contract로 작성했습니다.",
      "원본에는 JDK/JVM 분리, class file 구조, --release, lifecycle·diagnostic tree와 최신 Java 25 compact/instance main이 없어 Oracle/OpenJDK JLS·JVMS·tool docs로 보강했습니다.",
      "modules·JAR·jlink·build tools의 상세 구현은 later Java systems/build sessions에서 확장하고 이 세션에서는 source→class→launcher mental model에 집중했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
