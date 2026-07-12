import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["java-02-primitives-variables"],
  slug: "java-02-primitives-variables",
  courseId: "java",
  moduleId: "java-language-control",
  order: 2,
  title: "변수·상수와 기본 자료형",
  subtitle: "선언·scope·final에서 8개 primitive의 실제 값 집합, 정수 오버플로·IEEE 754·UTF-16·BigDecimal 금액 정책까지 연결합니다.",
  level: "입문",
  estimatedMinutes: 460,
  coreQuestion: "값의 범위만 외우지 않고 Java가 expression type·상수식·overflow·부동소수·Unicode를 처리하는 규칙을 어떻게 예측하고 안전한 domain type을 선택할까요?",
  summary: "inventory의 javastudy day01 Ex03·Ex04와 day02 Ex01·Ex02 네 원본을 UTF-8로 직접 읽고 Temurin JDK 21.0.11에서 -Xlint:all로 clean compile·run했습니다. Ex03은 boolean 선언→첫 대입 true→재대입 false와 선언+초기화를 보여 주고 true/false/false를 출력합니다. Ex04는 char에 'a', 정수 상수 100, '가', 100+1, 97-32, '0'을 저장해 a/d/가/e/A/0을 출력합니다. 여기서 '문자열이 숫자로 저장'이라는 주석은 String과 char를 혼동하므로 char가 0..65535의 unsigned UTF-16 code unit임을 정확히 고칩니다. Ex01은 byte·short·int·long의 범위와 literal을 소개하고 100/-120/100/100/100/1000을 출력하지만, '정수<실수', long suffix 생략 가능, 범위 안 결과면 작은 type에 저장 가능 같은 설명은 range·precision·constant-expression narrowing·general promotion을 섞습니다. Ex02는 float 3.45F, double 13.417, long 314와 float 13.417F를 double로 widening해 3.45/13.417/314/13.416999816894531을 출력합니다. 마지막 값은 widening이 이미 float에서 잃은 bits를 복구하지 못함을 원본 자체가 보여 줍니다. 이를 변수·값·expression의 static type, 선언/초기화/대입/재대입, local definite assignment와 field/array defaults, block scope·shadowing, final과 constant variable, boolean과 numeric separation, literal bases/suffix/underscore와 special -2147483648, assignment constant narrowing, byte/short/char arithmetic promotion, fixed-width two's-complement range·wrap과 Math exact, binary32/binary64의 range와 precision·subnormal·NaN·Infinity·signed zero, char/code unit·code point·grapheme, BigInteger/BigDecimal 선택과 money scale/rounding/equals, compile diagnostics·boundary/property tests까지 확장합니다.",
  objectives: [
    "변수·값·타입·expression·선언·초기화·대입·재대입을 서로 구분할 수 있다.",
    "지역변수 definite assignment와 field·array element 기본값의 차이를 compile evidence로 설명할 수 있다.",
    "block scope·수명·shadowing과 final·constant variable의 정확한 계약을 적용할 수 있다.",
    "boolean과 7개 numeric primitives의 값 집합·bit width·범위를 표와 code로 검증할 수 있다.",
    "정수·부동소수·char literal의 기본 type·suffix·radix·underscore와 compile-time constant rules를 예측할 수 있다.",
    "byte·short·char arithmetic이 int로 승격되는 이유와 constant assignment·compound assignment 예외를 설명할 수 있다.",
    "정수 overflow·narrowing wrap를 재현하고 Math.*Exact·BigInteger 등 안전한 정책을 선택할 수 있다.",
    "float·double의 binary precision, NaN·Infinity·subnormal·signed zero와 widening precision loss를 진단할 수 있다.",
    "char·UTF-16 code unit·Unicode code point·grapheme cluster를 구분해 supplementary 문자를 안전하게 순회할 수 있다.",
    "money·decimal domain에 BigDecimal(String)·scale·RoundingMode·compareTo 정책을 설계할 수 있다.",
  ],
  prerequisites: [
    { title: "Java source→class→JVM 실행", reason: "네 원본을 clean compile/run하고 compiler diagnostics·exact stdout을 type evidence로 사용합니다.", sessionSlug: "java-01-source-compile-main" },
  ],
  keywords: ["variable", "declaration", "initialization", "assignment", "definite assignment", "scope", "shadowing", "final", "constant variable", "primitive", "boolean", "byte", "short", "int", "long", "char", "float", "double", "literal", "numeric promotion", "constant expression", "overflow", "two's complement", "Math.addExact", "IEEE 754", "binary32", "binary64", "NaN", "Infinity", "signed zero", "UTF-16", "code point", "grapheme", "BigInteger", "BigDecimal", "RoundingMode"],
  chapters: [
    {
      id: "four-source-output-audit",
      title: "네 원본의 active code·commented experiment·설명 주석을 exact output과 분리해 감사합니다",
      lead: "먼저 실제로 실행되는 값과 compile되지 않는 주석 예제를 구분해야 잘못된 규칙을 일반화하지 않습니다.",
      explanations: [
        "day01 Ex03의 active code는 boolean result를 선언하고 true를 첫 대입한 뒤 false로 재대입하며 result2를 false로 선언+초기화합니다. stdout은 true, false, false 세 줄입니다.",
        "day01 Ex04는 char 하나에 'a'→100→'가'→100+1→97-32→'0'을 차례로 대입합니다. 출력 a,d,가,e,A,0은 literal glyph와 numeric code unit·constant expression을 함께 보여 줍니다.",
        "day02 Ex01 active code는 byte 100/-120, short 100, int 100, long 100L/1000을 출력합니다. -120+-8과 casts는 comment 처리되어 원본 실행 output이 아닙니다.",
        "day02 Ex02는 3.45F, 13.417, int literal 314의 long widening과 13.417F의 double widening을 실행합니다. last output 13.416999816894531은 source decimal text가 float bit pattern으로 먼저 rounded되었음을 보여 줍니다.",
        "주석은 학습자의 가설로 존중하되 compiler specification과 runtime evidence로 교정합니다. '정수<실수'는 magnitude range와 exact precision을 섞고, 'L 생략 가능'은 int 범위 literal widening에만 제한적으로 맞습니다.",
        "네 files를 한 번에 clean output에 compile해 diagnostics 0과 main exit 0을 확인했습니다. 기존 IDE bin이 아니라 same JDK/options로 얻은 result를 golden evidence로 사용합니다.",
      ],
      concepts: [
        { term: "active code", definition: "comment가 아니고 실제 compilation unit에 포함되어 compile·execute되는 source입니다.", detail: ["stdout 근거가 됩니다.", "주석 실험과 구분합니다."] },
        { term: "golden output", definition: "고정 toolchain·input에서 보존하는 exact expected stdout입니다.", detail: ["regression을 잡습니다.", "설명 자체의 진실을 전부 보장하지는 않습니다."] },
        { term: "source hypothesis", definition: "주석이나 예제가 제시한 설명 중 specification·실험으로 검증해야 하는 주장입니다.", detail: ["오류도 학습 material입니다.", "왜 틀렸는지 단계로 고칩니다."] },
      ],
      codeExamples: [
        {
          id: "java-original-primitives-output-audit",
          title: "원본 네 main을 clean compile하고 줄을 pipe-safe summary로 고정합니다",
          language: "powershell",
          filename: "verify-original-primitives.ps1",
          purpose: "원본의 실제 active code output과 comment-only experiments를 혼동하지 않도록 four exact sequences를 한 번에 검증합니다.",
          code: String.raw`$src = "src\com\ictedu"
$out = "build\classes"
$files = @(
  "$src\day01\Ex03.java",
  "$src\day01\Ex04.java",
  "$src\day02\Ex01.java",
  "$src\day02\Ex02.java"
)

javac -encoding UTF-8 -Xlint:all -d $out $files
if ($LASTEXITCODE -ne 0) { throw "compile failed" }

function Summary($name) {
  $lines = & java -cp $out $name
  if ($LASTEXITCODE -ne 0) { throw "run failed: $name" }
  $simple = $name.Substring($name.LastIndexOf(".") + 1)
  "$simple=$($lines -join "|")"
}

Summary "com.ictedu.day01.Ex03"
Summary "com.ictedu.day01.Ex04"
Summary "com.ictedu.day02.Ex01"
Summary "com.ictedu.day02.Ex02"`,
          walkthrough: [
            { lines: "1-8", explanation: "source root와 four inventory files를 explicit list로 고정합니다." },
            { lines: "10-11", explanation: "UTF-8·all warnings·separate output으로 한 compile unit을 만들고 exit를 검사합니다." },
            { lines: "13-18", explanation: "각 FQCN의 lines를 보존하면서 compact pipe summary로 만듭니다." },
            { lines: "20-23", explanation: "day/package가 다른 same simple names를 exact FQCN으로 실행합니다." },
          ],
          run: { environment: ["PowerShell 7+", "Temurin/OpenJDK 21", "javastudy MyJavaProject root"], command: "pwsh -File verify-original-primitives.ps1" },
          output: { value: "Ex03=true|false|false\nEx04=a|d|가|e|A|0\nEx01=100|-120|100|100|100|1000\nEx02=3.45|13.417|314|13.416999816894531", explanation: ["네 source의 actual stdout입니다.", "comment 처리된 casts와 compile failures는 이 output에 포함되지 않습니다."] },
          experiments: [
            { change: "Ex01의 commented -120+-8 line만 temporary fixture에서 활성화합니다.", prediction: "constant expression -128은 byte 범위 안이라 compile됩니다.", result: "일반 byte 변수 덧셈과 다른 constant assignment 규칙입니다." },
            { change: "Ex02의 float f2=3.74를 활성화합니다.", prediction: "3.74 literal은 double이므로 possible lossy conversion compile error가 납니다.", result: "F suffix 또는 explicit conversion policy가 필요합니다." },
            { change: "기존 bin을 classpath 앞에 둡니다.", prediction: "stale class가 summary를 바꿀 수 있습니다.", result: "clean output 하나만 runtime classpath에 둡니다." },
          ],
          sourceRefs: ["java-boolean-source", "java-char-source", "java-integral-source", "java-floating-source", "jdk21-javac"],
        },
      ],
      diagnostics: [
        { symptom: "문서 output과 내 output이 다른데 source는 같아 보인다.", likelyCause: "comment 활성화 여부·stale class·다른 FQCN/JDK/output formatting입니다.", checks: ["git diff와 exact source hash를 봅니다.", "clean -d output과 runtime class location을 확인합니다.", "java/javac version과 Locale formatting을 기록합니다."], fix: "inventory source를 read-only로 clean compile하고 fully qualified main을 실행합니다.", prevention: "golden script가 compile·run exit와 output을 한 번에 검증하게 합니다." },
      ],
    },
    {
      id: "variable-type-value-expression-model",
      title: "변수는 최신 값을 담는 상자보다 타입·이름·scope를 가진 저장 위치입니다",
      lead: "값·변수·expression type과 declaration/initialization/assignment를 구분하면 compiler error를 예측할 수 있습니다.",
      explanations: [
        "Java는 statically typed language라 모든 variable과 expression type이 compile time에 알려집니다. type은 저장 가능한 값과 허용 operation·operation 의미를 제한합니다.",
        "boolean result;는 declaration로 local variable 이름과 type을 도입하지만 아직 값을 읽을 수 있게 초기화하지 않습니다. result=true는 first assignment이고 boolean result2=false는 declaration과 initializer를 결합합니다.",
        "assignment는 오른쪽 expression을 평가하고 assignment conversion 뒤 왼쪽 variable location에 저장합니다. 이전 primitive value는 그 local variable에서 더 이상 관찰되지 않지만 '메모리에서 즉시 지워진다'는 물리 구현까지 뜻하지 않습니다.",
        "literal true 자체도 boolean expression이고 result를 읽는 expression type도 boolean입니다. variable type과 현재 value, expression result를 세 열로 추적합니다.",
        "primitive variable은 primitive value를 직접 보유한다는 language model이고 reference variable은 object reference를 보유합니다. 실제 CPU register/stack/optimization 배치를 language guarantee처럼 단정하지 않습니다.",
        "meaningful name·small scope·one responsibility가 type error와 state transition을 읽기 쉽게 만듭니다. result1/result2보다 isEligible·hasPermission처럼 domain predicate를 표현합니다.",
      ],
      concepts: [
        { term: "variable", definition: "type과 이름을 갖고 compatible value를 저장할 수 있는 location입니다.", detail: ["scope와 lifetime이 있습니다.", "expression과 구분합니다."] },
        { term: "initialization", definition: "variable이 처음 사용할 value를 갖게 만드는 과정입니다.", detail: ["declaration initializer 또는 constructor/initializer가 할 수 있습니다.", "local definite assignment와 연결됩니다."] },
        { term: "expression type", definition: "expression이 compile time에 produce한다고 정해진 type입니다.", detail: ["literal과 operation에도 type이 있습니다.", "assignment target type이 연산 type을 역으로 바꾸지 않을 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "java-variable-lifecycle-scope-final",
          title: "선언·첫 대입·재대입·inner scope·final을 한 추적 output으로 구분합니다",
          language: "java",
          filename: "src/learning/java02/VariableLifecycle.java",
          purpose: "원본 boolean 흐름을 block scope와 final constant까지 확장하되 각 상태를 deterministic하게 관찰합니다.",
          code: String.raw`package learning.java02;

public class VariableLifecycle {
    public static void main(String[] args) {
        boolean enabled;
        enabled = true;
        System.out.println("first=" + enabled);

        enabled = false;
        System.out.println("reassigned=" + enabled);

        int count = 3;
        {
            int inner = count + 4;
            System.out.println("inner=" + inner);
        }

        final int DAYS_PER_WEEK = 7;
        System.out.println("outer=" + count);
        System.out.println("final-product=" + DAYS_PER_WEEK * count);
    }
}`,
          walkthrough: [
            { lines: "5-10", explanation: "declaration, first assignment와 same variable reassignment를 분리합니다." },
            { lines: "12-16", explanation: "inner는 nested block 안에서만 scope가 있고 outer count를 읽습니다." },
            { lines: "18-20", explanation: "final local은 한 번 초기화되고 constant expression 계산에 사용됩니다." },
          ],
          run: { environment: ["JDK 21+"], command: "javac -d build/classes src/learning/java02/VariableLifecycle.java && java -cp build/classes learning.java02.VariableLifecycle" },
          output: { value: "first=true\nreassigned=false\ninner=7\nouter=3\nfinal-product=21", explanation: ["한 variable의 재대입과 서로 다른 scope variables가 구분됩니다.", "final 값은 다시 대입하지 않고 expression에서 읽습니다."] },
          experiments: [
            { change: "enabled first assignment를 제거하고 첫 println에서 읽습니다.", prediction: "variable enabled might not have been initialized compile error가 납니다.", result: "local에는 자동 default가 없습니다." },
            { change: "block 뒤 inner를 출력합니다.", prediction: "cannot find symbol이 납니다.", result: "scope가 block 끝에서 종료됩니다." },
            { change: "DAYS_PER_WEEK=8을 추가합니다.", prediction: "final variable already assigned compile error가 납니다.", result: "final은 exactly-once assignment contract입니다." },
          ],
          sourceRefs: ["java-boolean-source", "jls-types-values", "jls-scope", "jls-local-variables"],
        },
      ],
      diagnostics: [
        { symptom: "local int를 선언했으니 0일 것으로 생각했는데 compiler가 읽기를 막는다.", likelyCause: "field/array default와 local definite assignment를 혼동했습니다.", checks: ["variable kind와 declaration scope를 확인합니다.", "모든 control-flow path에서 assignment가 먼저인지 봅니다.", "field/array example과 별도로 compile합니다."], fix: "의미 있는 initializer를 주거나 모든 path에서 값을 대입한 뒤 읽습니다.", prevention: "uninitialized local compile-fail fixture와 control-flow tests를 둡니다." },
      ],
    },
    {
      id: "scope-lifetime-shadowing-final",
      title: "scope는 이름이 보이는 범위, lifetime은 storage가 존재하는 기간이며 final은 재대입 금지입니다",
      lead: "같은 단어처럼 쓰이는 visibility·lifetime·immutability를 분리합니다.",
      explanations: [
        "local variable scope는 declaration 위치부터 enclosing block의 끝까지 규칙에 따라 이어집니다. block을 작게 만들면 잘못된 state 재사용을 줄입니다.",
        "Java는 overlapping local scopes에서 같은 이름을 다시 선언하지 못하게 해 혼동을 줄입니다. field와 local/parameter가 같은 이름이면 shadowing이 가능하고 this.field로 구분합니다.",
        "lifetime은 runtime storage 존재와 관련되고 scope는 source name resolution 규칙입니다. JIT가 local storage를 없애거나 register에 둬도 program semantics는 같습니다.",
        "final local/field는 once assigned 후 reference/value 재대입을 막습니다. final List reference의 list contents가 자동 immutable이 되는 것은 아닙니다.",
        "constant variable은 primitive 또는 String type이며 final이고 constant expression으로 초기화된 variable입니다. 모든 final이 compile-time constant는 아닙니다.",
        "public static final primitive constant가 consumer bytecode에 inline될 수 있어 library constant value 변경만 배포하면 old clients가 old value를 유지할 수 있습니다. versioning/test를 고려합니다.",
      ],
      concepts: [
        { term: "scope", definition: "source에서 declaration name으로 entity를 참조할 수 있는 영역입니다.", detail: ["block과 declaration kind가 결정합니다.", "runtime lifetime과 다릅니다."] },
        { term: "shadowing", definition: "가까운 declaration이 같은 이름의 field 등 바깥 declaration을 가리는 현상입니다.", detail: ["this.field로 구분할 수 있습니다.", "과도하면 이름을 바꿉니다."] },
        { term: "constant variable", definition: "primitive/String type의 final variable이 constant expression으로 초기화된 경우입니다.", detail: ["assignment narrowing에 영향 줍니다.", "모든 final object가 해당하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "final collection에 element가 추가되어 final이 안 지켜진 것처럼 보인다.", likelyCause: "reference 재대입 금지와 referenced object의 mutability를 혼동했습니다.", checks: ["final variable에 새 reference를 대입하는지, object method로 내용을 바꾸는지 구분합니다.", "immutable copy/API contract를 확인합니다.", "thread-safety도 별도 봅니다."], fix: "불변 content가 필요하면 immutable type/copy와 encapsulation을 사용합니다.", prevention: "final=immutability라는 설명을 금지하고 reference/value graph를 그립니다." },
      ],
    },
    {
      id: "eight-primitives-value-sets",
      title: "8개 primitive를 크기 순서 하나가 아니라 값 집합·연산·정밀도 축으로 지도화합니다",
      lead: "큰 type이라는 표현을 magnitude range·exact integers·precision·special values로 나눕니다.",
      explanations: [
        "boolean은 true/false 두 logical values이고 numeric과 cast되지 않습니다. C처럼 0/1을 boolean에 대입할 수 없고 if condition도 boolean expression이어야 합니다.",
        "byte/short/int/long은 각각 8/16/32/64-bit signed two's-complement integer value range를 가집니다. overflow를 자동 signal하지 않습니다.",
        "char는 16-bit unsigned integral type이고 0..65535의 UTF-16 code unit을 나타냅니다. short도 16-bit지만 signed -32768..32767이라 short↔char direct widening 관계가 없습니다.",
        "float는 IEEE 754 binary32, double은 binary64 value set에 대응하고 각각 significand precision 24/53 bits, finite/subnormal/±0/±Infinity/NaN을 포함합니다.",
        "'정수<실수'는 틀린 단일 서열입니다. float가 long보다 큰 magnitude를 표현할 수 있어도 모든 long을 exact하게 표현하지 못합니다. range와 precision을 따로 봅니다.",
        "wrapper constants Byte.MIN_VALUE·Integer.MAX_VALUE 등은 range 확인에 유용합니다. Float.MIN_VALUE는 가장 작은 음수가 아니라 0보다 큰 smallest positive nonzero 값이고 negative finite minimum은 -Float.MAX_VALUE입니다.",
      ],
      concepts: [
        { term: "value set", definition: "type이 language level에서 가질 수 있는 모든 값의 집합입니다.", detail: ["bit width와 연결됩니다.", "operation behavior도 함께 봅니다."] },
        { term: "magnitude range", definition: "표현 가능한 값의 절대 크기 범위입니다.", detail: ["precision과 다릅니다.", "float/long 비교에 필요합니다."] },
        { term: "precision", definition: "서로 구분해 정확히 표현할 수 있는 유효 정보의 양입니다.", detail: ["binary32는 24-bit significand입니다.", "widening 이름이 exact를 보장하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "Float.MIN_VALUE를 가장 작은 음수로 사용해 range check가 뒤집힌다.", likelyCause: "MIN_VALUE naming을 integer wrapper와 동일 의미로 가정했습니다.", checks: ["Float.MIN_VALUE, -Float.MAX_VALUE와 MIN_NORMAL을 출력합니다.", "API doc의 smallest positive nonzero definition을 확인합니다.", "NaN/Infinity도 policy에 포함합니다."], fix: "finite lower bound에는 -Float.MAX_VALUE를 사용하고 domain range를 별도로 정의합니다.", prevention: "numeric type별 boundary glossary와 tests를 둡니다." },
      ],
    },
    {
      id: "literal-types-suffix-radix-constant-expression",
      title: "literal은 이미 type을 가지며 suffix·radix·constant expression이 assignment 가능성을 결정합니다",
      lead: "왼쪽 variable type이 오른쪽 literal/operation을 사후에 바꿔 준다고 생각하지 않습니다.",
      explanations: [
        "decimal integer literal은 suffix가 없으면 표현 가능할 때 int, L/l suffix면 long입니다. lowercase l은 숫자 1과 혼동되므로 uppercase L을 사용합니다.",
        "long num=1000은 int literal 1000을 long으로 widening하므로 suffix 없이 됩니다. 그러나 2147483648은 positive int literal 범위를 넘어 literal 자체가 오류라 2147483648L이 필요합니다.",
        "-2147483648은 특별한 decimal literal grammar와 unary minus boundary로 유효하지만 positive 2147483648은 int literal로 유효하지 않습니다. hex/binary literals는 two's-complement bit pattern rules도 확인합니다.",
        "floating literal은 suffix 없으면 double, F/f면 float, D/d는 optional double입니다. float f=1은 int→float widening이라 되지만 float f=3.74는 double literal narrowing이라 compile되지 않습니다.",
        "char literal은 single quotes에 하나의 UTF-16 code unit escape/character를 나타냅니다. '10'은 두 글자라는 semantic 이전에 valid char literal grammar가 아니고 String은 double quotes를 씁니다.",
        "underscore는 digits 사이 readability를 높이지만 시작/끝, radix prefix와 suffix 주변 규칙을 지켜야 합니다. parsing external text와 source literal grammar를 혼동하지 않습니다.",
      ],
      concepts: [
        { term: "literal type", definition: "source literal 자체가 compile time에 갖는 int/long/float/double/char/boolean/String type입니다.", detail: ["target variable과 독립적으로 시작합니다.", "suffix가 바꿀 수 있습니다."] },
        { term: "constant expression", definition: "literals·constant variables와 허용 operators로 compile time에 평가 가능한 expression입니다.", detail: ["in-range narrowing assignment가 가능할 수 있습니다.", "runtime variable expression과 다릅니다."] },
        { term: "literal suffix", definition: "L/F/D처럼 source literal type을 지정하는 marker입니다.", detail: ["L과 F를 주로 씁니다.", "값 range와 readability를 고려합니다."] },
      ],
      codeExamples: [
        {
          id: "java-literal-constant-assignment",
          title: "literal 기본 type·suffix와 in-range constant narrowing을 runtime class names/value로 확인합니다",
          language: "java",
          filename: "src/learning/java02/LiteralContracts.java",
          purpose: "boxing은 관찰 도구로만 사용해 literal expression type과 byte/char constant assignment 결과를 고정합니다.",
          code: String.raw`package learning.java02;

public class LiteralContracts {
    public static void main(String[] args) {
        System.out.println("int-literal=" + ((Object) 42).getClass().getSimpleName());
        System.out.println("long-literal=" + ((Object) 42L).getClass().getSimpleName());
        System.out.println("float-literal=" + ((Object) 3.5F).getClass().getSimpleName());
        System.out.println("double-literal=" + ((Object) 3.5).getClass().getSimpleName());

        byte edge = -120 + -8;
        final int BASE = 120;
        byte fromConstant = BASE + 7;
        char next = 'a' + 1;
        long beyondInt = 2_147_483_648L;

        System.out.println("byte-edge=" + edge);
        System.out.println("byte-final-constant=" + fromConstant);
        System.out.println("char-constant=" + next);
        System.out.println("long-literal-value=" + beyondInt);
    }
}`,
          walkthrough: [
            { lines: "5-8", explanation: "primitive literals를 Object context에서 box해 Integer/Long/Float/Double expression type을 관찰합니다." },
            { lines: "10-14", explanation: "compile-time values가 target byte/char range 안인 assignment와 int 초과 L literal을 만듭니다." },
            { lines: "16-19", explanation: "boundary와 constant results를 exact decimal/glyph로 출력합니다." },
          ],
          run: { environment: ["JDK 21+"], command: "javac -Xlint:all -d build/classes src/learning/java02/LiteralContracts.java && java -cp build/classes learning.java02.LiteralContracts" },
          output: { value: "int-literal=Integer\nlong-literal=Long\nfloat-literal=Float\ndouble-literal=Double\nbyte-edge=-128\nbyte-final-constant=127\nchar-constant=b\nlong-literal-value=2147483648", explanation: ["suffix 없는 decimal integer/floating literals는 int/double이고 L/F가 바꿉니다.", "in-range constant expressions는 byte/char assignment conversion을 허용합니다."] },
          experiments: [
            { change: "beyondInt의 L을 제거합니다.", prediction: "integer number too large compile error가 납니다.", result: "target long이 literal grammar를 소급해 바꾸지 않습니다." },
            { change: "BASE의 final을 제거합니다.", prediction: "BASE+7은 constant variable expression이 아니어서 byte assignment가 실패합니다.", result: "final+constant initializer가 중요합니다." },
            { change: "char next에서 literal 대신 int variable 98을 사용합니다.", prediction: "possible lossy conversion from int to char가 납니다.", result: "runtime variable range는 compiler가 constant로 보장하지 않습니다." },
          ],
          sourceRefs: ["java-char-source", "java-integral-source", "java-floating-source", "jls-literals", "jls-assignment", "jls-promotions"],
        },
      ],
      diagnostics: [
        { symptom: "long variable인데 2147483648 literal에서 compile error가 난다.", likelyCause: "suffix 없는 decimal literal 자체가 int로 표현되지 못해 assignment conversion 전에 실패했습니다.", checks: ["literal suffix와 radix를 확인합니다.", "expression 중 first long operand 위치를 봅니다.", "source numeric separators를 제거해도 same value인지 확인합니다."], fix: "2147483648L처럼 uppercase L로 long literal을 만듭니다.", prevention: "boundary literal compile tests와 style rule을 둡니다." },
      ],
    },
    {
      id: "assignment-narrowing-promotion-compound",
      title: "상수식 assignment 특례와 일반 산술 promotion·compound assignment를 같은 규칙으로 착각하지 않습니다",
      lead: "작은 정수형끼리 계산해도 operation은 보통 int이며 cast는 range validation이 아닙니다.",
      explanations: [
        "byte·short·char operands는 unary/binary numeric promotion에서 보통 int로 승격됩니다. byte a+b 결과 expression type은 int이고 값이 우연히 range 안이어도 byte result가 아닙니다.",
        "assignment context는 in-range int constant expression을 byte/short/char에 좁혀 넣는 특례가 있습니다. -120+-8과 'a'+1은 compile time value를 compiler가 증명합니다.",
        "byte variables a,b의 a+b는 runtime expression이라 byte result에 automatic narrowing되지 않습니다. 계산은 int로 유지하거나 domain bounds를 검사한 뒤 명시 convert합니다.",
        "char와 short는 둘 다 16-bit지만 signed/unsigned range가 달라 서로 direct widening이 아닙니다. size 한 줄 서열 대신 conversion graph를 봅니다.",
        "compound assignment c+=1은 c=(char)(c+1)과 유사한 implicit cast를 포함해 compile될 수 있습니다. 단순 assignment c=c+1과 compile behavior가 다르고 silent wrap 위험이 있습니다.",
        "++/--도 variable type으로 결과를 저장하지만 overflow check를 자동 제공하지 않습니다. loop counter/domain boundary를 따로 검증합니다.",
      ],
      concepts: [
        { term: "binary numeric promotion", definition: "numeric binary operation 전에 operands를 double→float→long→그 외 int rule로 변환하는 과정입니다.", detail: ["byte/short/char는 int가 됩니다.", "result type을 결정합니다."] },
        { term: "narrowing constant assignment", definition: "compile-time int constant가 target byte/short/char 범위 안이면 cast 없이 허용되는 assignment 특례입니다.", detail: ["runtime variable에는 적용되지 않습니다.", "범위 밖이면 compile error입니다."] },
        { term: "compound assignment conversion", definition: "E1 op= E2가 operation 뒤 E1 type으로 implicit cast해 저장하는 규칙입니다.", detail: ["simple assignment와 다릅니다.", "silent loss를 만들 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "byte 두 값의 합이 100인데 byte에 대입되지 않는다.", likelyCause: "operand variables가 binary promotion으로 int operation/result를 만들었습니다.", checks: ["각 operand/expression compile-time type을 표로 적습니다.", "constant literal expression과 비교합니다.", "target range invariant가 실제로 필요한지 봅니다."], fix: "계산 결과를 int로 유지하거나 min/max를 검사한 checked helper 뒤 byte로 convert합니다.", prevention: "무작정 cast를 금지하고 boundary tests를 둡니다." },
      ],
    },
    {
      id: "integer-range-overflow-checked-arithmetic",
      title: "fixed-width integer overflow는 조용히 low bits를 남기므로 exact arithmetic 정책을 명시합니다",
      lead: "범위를 외우는 데서 끝나지 않고 연산 중간값·narrowing·검출 방법을 비교합니다.",
      explanations: [
        "byte/short/int/long ranges는 fixed-width two's-complement입니다. integer operators는 overflow/underflow를 자동 표시하지 않고 결과 type의 low bits에 해당하는 값이 남습니다.",
        "Integer.MAX_VALUE+1은 Integer.MIN_VALUE가 되고 int MIN/-1도 overflow해 MIN을 유지하는 특수 case입니다. exception이 없으므로 결과가 plausible하면 더 위험합니다.",
        "long total=30*24*60*60*1000처럼 target만 long이어도 RHS가 모두 int면 assignment 전에 int overflow합니다. 30L처럼 첫 multiplication부터 long으로 승격해야 합니다.",
        "narrowing cast (byte)-129는 low 8 bits를 보존해 127, (short)32800은 -32736이 됩니다. cast는 range를 검사하거나 exception을 주지 않습니다.",
        "Math.addExact/subtractExact/multiplyExact/incrementExact/decrementExact/negateExact와 toIntExact는 overflow에서 ArithmeticException을 줍니다. exception policy가 맞지 않으면 explicit precheck/result type을 설계합니다.",
        "long도 부족한 arbitrary-precision domain에는 BigInteger를 사용합니다. ID·money·count처럼 domain 의미에 따라 unsigned text/BigInteger/database numeric을 선택합니다.",
      ],
      concepts: [
        { term: "two's-complement wrap", definition: "fixed width integer operation이 수학적 범위를 넘을 때 low bits가 남아 signed value가 바뀌는 동작입니다.", detail: ["exception이 기본 발생하지 않습니다.", "boundary에서 재현합니다."] },
        { term: "intermediate overflow", definition: "넓은 target에 대입하기 전 narrower operand operation에서 이미 overflow하는 문제입니다.", detail: ["operand type이 operation을 결정합니다.", "첫 단계부터 widen/check합니다."] },
        { term: "exact arithmetic", definition: "수학적 result가 primitive 범위를 넘으면 정상 값 대신 명시적 failure를 내는 Math methods입니다.", detail: ["silent wrap를 막습니다.", "exception handling이 필요합니다."] },
      ],
      codeExamples: [
        {
          id: "java-integer-boundary-overflow",
          title: "범위·wrap·narrowing·Math.addExact를 같은 output에서 비교합니다",
          language: "java",
          filename: "src/learning/java02/IntegerBoundaries.java",
          purpose: "원본의 comment-only casts와 range 설명을 actual runtime boundary·checked failure로 확장합니다.",
          code: String.raw`package learning.java02;

public class IntegerBoundaries {
    public static void main(String[] args) {
        System.out.println("byte=" + Byte.MIN_VALUE + ".." + Byte.MAX_VALUE);
        System.out.println("short=" + Short.MIN_VALUE + ".." + Short.MAX_VALUE);
        System.out.println("int=" + Integer.MIN_VALUE + ".." + Integer.MAX_VALUE);
        System.out.println("long=" + Long.MIN_VALUE + ".." + Long.MAX_VALUE);
        System.out.println("char=" + (int) Character.MIN_VALUE + ".." + (int) Character.MAX_VALUE);

        System.out.println("int-overflow=" + (Integer.MAX_VALUE + 1));
        System.out.println("int-min-div-neg-one=" + (Integer.MIN_VALUE / -1));
        System.out.println("cast-minus129=" + (byte) -129);
        System.out.println("cast-short32800=" + (short) 32800);
        try {
            Math.addExact(Integer.MAX_VALUE, 1);
        } catch (ArithmeticException error) {
            System.out.println("addExact=" + error.getClass().getSimpleName());
        }
    }
}`,
          walkthrough: [
            { lines: "5-9", explanation: "wrapper/Character constants로 five integral ranges를 runtime에 고정합니다." },
            { lines: "11-14", explanation: "int overflow와 two narrowing low-bit results를 관찰합니다." },
            { lines: "15-19", explanation: "동일 MAX+1 intent를 checked Math method로 바꿔 exception category를 출력합니다." },
          ],
          run: { environment: ["JDK 21+"], command: "javac -d build/classes src/learning/java02/IntegerBoundaries.java && java -cp build/classes learning.java02.IntegerBoundaries" },
          output: { value: "byte=-128..127\nshort=-32768..32767\nint=-2147483648..2147483647\nlong=-9223372036854775808..9223372036854775807\nchar=0..65535\nint-overflow=-2147483648\nint-min-div-neg-one=-2147483648\ncast-minus129=127\ncast-short32800=-32736\naddExact=ArithmeticException", explanation: ["default arithmetic/cast는 silent wrapped values를 냅니다.", "addExact만 explicit overflow failure를 냅니다."] },
          experiments: [
            { change: "long bad=30*24*60*60*1000과 long good=30L*...를 출력합니다.", prediction: "bad는 int intermediate overflow, good은 2592000000입니다.", result: "target type보다 operand operation type이 먼저입니다." },
            { change: "Math.multiplyExact를 단계별 적용합니다.", prediction: "어느 multiplication이 range를 넘는지 exception으로 좁힐 수 있습니다.", result: "unit conversion overflow를 조기에 찾습니다." },
            { change: "cast 앞 range check를 제거합니다.", prediction: "입력 boundary 밖이 다른 valid-looking signed value가 됩니다.", result: "external protocol conversion에는 checked helper가 필요합니다." },
          ],
          sourceRefs: ["java-integral-source", "jls-types-values", "jls-assignment", "jls-promotions", "java-math-api"],
        },
      ],
      diagnostics: [
        { symptom: "long으로 받았는데 30일 milliseconds가 음수다.", likelyCause: "RHS int multiplications가 long assignment 전에 overflow했습니다.", checks: ["각 intermediate expression type/value를 왼쪽부터 추적합니다.", "첫 operand L 여부를 봅니다.", "multiplyExact fixture를 실행합니다."], fix: "30L처럼 첫 operation부터 long으로 만들고 필요한 곳에서 Math.multiplyExact를 사용합니다.", prevention: "unit constants를 typed final long으로 만들고 max-boundary test를 둡니다." },
      ],
    },
    {
      id: "floating-binary-range-precision",
      title: "float·double은 십진수를 저장하는 통이 아니라 binary32·binary64 값 집합입니다",
      lead: "표시된 짧은 decimal과 실제 binary value, magnitude range와 exact precision을 분리합니다.",
      explanations: [
        "float와 double은 각각 IEEE 754 binary32·binary64이며 significand precision은 24·53 bits입니다. finite normal/subnormal뿐 아니라 signed zero·Infinity·NaN을 포함합니다.",
        "3.45F는 nearest binary32로 rounded되고 println은 round-trip 가능한 짧은 decimal 3.45를 보여 줍니다. 고정 자릿수 또는 hex string으로 보면 exact stored value가 3.450000047683716...입니다.",
        "13.417F를 double에 widening하면 binary32 value를 binary64로 정확히 표현할 수 있지만 original decimal 13.417 precision을 되찾지는 못해 13.416999816894531이 됩니다.",
        "0.1+0.2가 0.30000000000000004이고 ==0.3이 false인 것은 많은 decimal fractions가 finite binary fraction이 아니기 때문입니다. 0.5·0.25 같은 powers-of-two denominator는 exact할 수 있습니다.",
        "int→float와 long→float/double 같은 widening numeric conversions도 low significant bits를 잃을 수 있습니다. widening은 compile-time 허용과 magnitude range를 뜻하지 every value exact를 뜻하지 않습니다.",
        "tolerance 비교는 임의 epsilon 하나가 아니라 domain scale·absolute/relative tolerance·NaN/Infinity policy와 expected magnitude를 정합니다. exact decimal money에는 floating type을 사용하지 않습니다.",
      ],
      concepts: [
        { term: "binary32/binary64", definition: "IEEE 754의 32/64-bit floating-point formats로 Java float/double value set에 대응합니다.", detail: ["24/53-bit significand precision입니다.", "special values를 포함합니다."] },
        { term: "round-trip decimal", definition: "같은 floating value로 다시 parse될 만큼 짧게 format한 decimal representation입니다.", detail: ["stored value 전체 digits와 다를 수 있습니다.", "println이 사용합니다."] },
        { term: "widening precision loss", definition: "허용되는 widening conversion에서도 source value 생성 이전 또는 integral significant bits가 exact하지 않을 수 있는 현상입니다.", detail: ["float→double은 source float를 exact 보존합니다.", "original decimal intent는 복구하지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "java-floating-point-observation",
          title: "binary approximation·NaN·Infinity·signed zero를 stable formatting으로 관찰합니다",
          language: "java",
          filename: "src/learning/java02/FloatingPointModel.java",
          purpose: "원본 float widening evidence를 IEEE 754 special values와 decimal equality까지 확장합니다.",
          code: String.raw`package learning.java02;

import java.util.Locale;

public class FloatingPointModel {
    public static void main(String[] args) {
        Locale.setDefault(Locale.ROOT);
        float source = 3.45F;
        double widened = source;
        double sum = 0.1 + 0.2;
        double positiveZero = 0.0;
        double negativeZero = -0.0;

        System.out.printf("float-exact=%.20f%n", (double) source);
        System.out.println("float-hex=" + Float.toHexString(source));
        System.out.println("widened=" + widened);
        System.out.println("decimal-sum=" + sum);
        System.out.println("sum-equals-0.3=" + (sum == 0.3));
        System.out.println("nan-self=" + (Double.NaN == Double.NaN));
        System.out.println("isNaN=" + Double.isNaN(0.0 / 0.0));
        System.out.println("positive-infinity=" + (1.0 / positiveZero));
        System.out.println("negative-infinity=" + (1.0 / negativeZero));
        System.out.println("zeros-equal=" + (positiveZero == negativeZero));
        System.out.println("compare-zeros=" + Double.compare(positiveZero, negativeZero));
    }
}`,
          walkthrough: [
            { lines: "6-12", explanation: "Locale.ROOT과 source/widened/decimal/signed-zero values를 준비합니다." },
            { lines: "14-18", explanation: "float exact decimal view·hex, widening과 decimal sum/equality를 관찰합니다." },
            { lines: "19-24", explanation: "NaN predicate, division infinities와 equality/total-order zero 차이를 출력합니다." },
          ],
          run: { environment: ["JDK 21+"], command: "javac -d build/classes src/learning/java02/FloatingPointModel.java && java -cp build/classes learning.java02.FloatingPointModel" },
          output: { value: "float-exact=3.45000004768371600000\nfloat-hex=0x1.b9999ap1\nwidened=3.450000047683716\ndecimal-sum=0.30000000000000004\nsum-equals-0.3=false\nnan-self=false\nisNaN=true\npositive-infinity=Infinity\nnegative-infinity=-Infinity\nzeros-equal=true\ncompare-zeros=1", explanation: ["짧은 source decimal과 stored binary value가 다릅니다.", "NaN과 signed zero는 ordinary real-number 직관만으로 비교할 수 없습니다."] },
          experiments: [
            { change: "source를 3.5F로 바꿉니다.", prediction: "3.5는 finite binary fraction이라 exact decimal view가 3.500...입니다.", result: "모든 decimal fraction이 부정확한 것은 아닙니다." },
            { change: "16777217 int를 float로 widening 후 int로 되돌립니다.", prediction: "16777216이 되어 binary32 precision boundary를 보여 줍니다.", result: "widening이 항상 exact하지 않습니다." },
            { change: "NaN을 ==Double.NaN으로 검사합니다.", prediction: "항상 false입니다.", result: "Double.isNaN을 사용합니다." },
          ],
          sourceRefs: ["java-floating-source", "jls-types-values", "java-float-api", "java-double-api"],
        },
      ],
      diagnostics: [
        { symptom: "출력은 3.45인데 계산·비교에서 미세한 차이가 난다.", likelyCause: "println의 shortest representation을 exact decimal storage로 오해했습니다.", checks: ["Float.toHexString와 %.20f, ulp를 봅니다.", "literal suffix와 widening history를 확인합니다.", "domain이 exact decimal인지 평가합니다."], fix: "floating tolerance/domain policy를 적용하거나 exact decimal이면 BigDecimal(String)을 사용합니다.", prevention: "binary boundary values와 decimal regression tests를 둡니다." },
      ],
    },
    {
      id: "floating-special-values-policy",
      title: "NaN·Infinity·subnormal·signed zero는 예외가 아니라 floating value set의 일부입니다",
      lead: "finite number만 예상하는 business boundary에서는 명시적으로 거부하거나 normalize합니다.",
      explanations: [
        "floating division by zero는 integer /0과 달리 Infinity 또는 NaN을 만들 수 있고 보통 ArithmeticException을 던지지 않습니다. error policy가 exception만 잡으면 special value가 downstream으로 흐릅니다.",
        "NaN은 자기 자신과 ==도 false이고 relational comparisons도 false입니다. Double.isNaN/Float.isNaN 또는 Double.isFinite로 검사합니다.",
        "positive zero와 negative zero는 == true지만 reciprocal은 +Infinity/-Infinity이고 raw bits와 Double.compare는 구분합니다. domain에서 zero sign을 보존할지 normalize할지 정합니다.",
        "overflow는 Infinity, gradual underflow는 subnormal을 거쳐 zero가 될 수 있어 magnitude가 작은 algorithm의 precision이 급감합니다. MIN_NORMAL과 MIN_VALUE를 구분합니다.",
        "sorting/hash/container APIs는 primitive ==와 다른 wrapper compare/equals contracts를 가질 수 있습니다. NaN/zero ordering을 collection key policy와 함께 test합니다.",
        "sensor·ML·financial input boundary에서 finite·range·unit를 검증하고 NaN/Infinity를 JSON/database가 어떻게 처리하는지 확인합니다.",
      ],
      concepts: [
        { term: "NaN", definition: "0/0 같은 invalid floating operation을 나타내는 unordered Not-a-Number value입니다.", detail: ["== 자기 자신도 false입니다.", "isNaN으로 검사합니다."] },
        { term: "subnormal", definition: "minimum normal보다 magnitude가 작은 값을 reduced precision으로 표현하는 floating value입니다.", detail: ["gradual underflow를 제공합니다.", "precision이 줄어듭니다."] },
        { term: "signed zero", definition: "같다고 비교되지만 sign bit와 일부 operation result가 다른 +0.0/-0.0입니다.", detail: ["reciprocal이 다릅니다.", "domain normalization을 정합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "validation은 exception 없이 통과했는데 JSON/database 저장에서 Infinity가 실패한다.", likelyCause: "floating arithmetic special values를 finite number로 가정했습니다.", checks: ["Double.isFinite를 boundary에 추가합니다.", "division/overflow source를 추적합니다.", "serializer/database support를 확인합니다."], fix: "non-finite를 domain error로 거부하거나 명시된 sentinel model로 변환합니다.", prevention: "NaN/±Infinity/±0/subnormal fixtures를 validation suite에 둡니다." },
      ],
    },
    {
      id: "char-utf16-codepoint-grapheme",
      title: "char는 UTF-16 code unit이고 code point·사용자 인식 문자와 항상 일치하지 않습니다",
      lead: "'가'와 A는 한 char이지만 emoji와 결합 문자는 다른 경계를 보여 줍니다.",
      explanations: [
        "char value는 unsigned 16-bit 0..65535이고 UTF-16 code unit입니다. 'a'=97, '가'=44032, '0'=48이며 numeric operation이 가능하지만 일반 숫자 bucket으로 쓰는 목적은 아닙니다.",
        "원본의 '문자열은 숫자로 저장'은 String/char를 혼동합니다. char literal은 single quotes, String은 object/reference type과 double quotes이며 다음 세션에서 다룹니다.",
        "Unicode BMP code point는 한 char로 표현될 수 있지만 U+1F600 😀 같은 supplementary code point는 high/low surrogate 두 char가 필요해 String.length()가 2입니다.",
        "codePointAt·codePointCount·offsetByCodePoints·codePoints와 Character.toChars를 사용해 code point boundary를 다룹니다. char loop가 surrogate를 둘로 쪼갤 수 있습니다.",
        "사용자가 인식하는 grapheme cluster는 code point보다도 클 수 있습니다. e+combining accent, emoji sequence/skin tone/ZWJ는 codePointCount도 사용자 글자 수와 다를 수 있습니다.",
        "username 길이·cursor·truncate는 domain과 locale에 맞는 segmentation/normalization 정책이 필요합니다. password는 normalization이 의미·보안을 바꿀 수 있어 임의 적용하지 않습니다.",
      ],
      concepts: [
        { term: "UTF-16 code unit", definition: "Java char/String storage API의 16-bit 단위입니다.", detail: ["BMP code point 하나일 수 있습니다.", "surrogate pair의 절반일 수 있습니다."] },
        { term: "Unicode code point", definition: "U+0000..U+10FFFF의 Unicode scalar/code point 식별 단위입니다.", detail: ["supplementary는 two UTF-16 units입니다.", "codePoints API로 순회합니다."] },
        { term: "grapheme cluster", definition: "사용자가 하나의 문자처럼 인식하는 code point sequence입니다.", detail: ["codePoint와도 다를 수 있습니다.", "UI length 정책이 필요합니다."] },
      ],
      codeExamples: [
        {
          id: "java-char-unicode-boundaries",
          title: "BMP char·emoji surrogate pair·combining sequence의 세 길이 단위를 비교합니다",
          language: "java",
          filename: "src/learning/java02/UnicodeUnits.java",
          purpose: "원본 char code evidence를 supplementary code point와 combining sequence까지 deterministic하게 확장합니다.",
          code: String.raw`package learning.java02;

public class UnicodeUnits {
    public static void main(String[] args) {
        char latin = 'a';
        char korean = '가';
        String emoji = "😀";
        String combining = "e\u0301";

        System.out.println("a-code=" + (int) latin);
        System.out.println("ga-code=" + (int) korean);
        System.out.println("emoji-length=" + emoji.length());
        System.out.println("emoji-codepoints=" + emoji.codePointCount(0, emoji.length()));
        System.out.printf("emoji-codepoint=U+%X%n", emoji.codePointAt(0));
        System.out.printf("emoji-units=%04X|%04X%n", (int) emoji.charAt(0), (int) emoji.charAt(1));
        System.out.println("combining-length=" + combining.length());
        System.out.println("combining-codepoints=" + combining.codePointCount(0, combining.length()));
    }
}`,
          walkthrough: [
            { lines: "5-8", explanation: "one-unit Latin/Korean, surrogate-pair emoji와 two-code-point combining sequence를 준비합니다." },
            { lines: "10-11", explanation: "BMP char numeric code units를 decimal로 봅니다." },
            { lines: "12-17", explanation: "UTF-16 length, code point count/value와 high/low surrogate units를 비교합니다." },
          ],
          run: { environment: ["JDK 21+", "UTF-8 source/output"], command: "javac -encoding UTF-8 -d build/classes src/learning/java02/UnicodeUnits.java && java -cp build/classes learning.java02.UnicodeUnits" },
          output: { value: "a-code=97\nga-code=44032\nemoji-length=2\nemoji-codepoints=1\nemoji-codepoint=U+1F600\nemoji-units=D83D|DE00\ncombining-length=2\ncombining-codepoints=2", explanation: ["emoji는 two code units/one code point입니다.", "combining sequence는 two units/two code points지만 화면에서 한 grapheme처럼 보일 수 있습니다."] },
          experiments: [
            { change: "for(char unit : emoji.toCharArray())로 출력합니다.", prediction: "surrogate halves가 별도 char로 나옵니다.", result: "code point 작업에는 char loop가 안전하지 않습니다." },
            { change: "Character.toChars(0x1F600)으로 String을 만듭니다.", prediction: "same two UTF-16 units와 one code point가 됩니다.", result: "supplementary code point conversion API를 사용합니다." },
            { change: "composed é와 e+combining accent를 equals로 비교합니다.", prediction: "code unit sequence가 달라 false일 수 있습니다.", result: "normalization은 domain boundary policy입니다." },
          ],
          sourceRefs: ["java-char-source", "jls-types-values", "java-character-api", "unicode-standard"],
        },
      ],
      diagnostics: [
        { symptom: "emoji 한 글자를 검사했는데 length가 2이고 자르면 깨진다.", likelyCause: "String.length/char index를 Unicode code point 또는 grapheme count로 사용했습니다.", checks: ["codePointCount와 char hex units를 봅니다.", "substring boundary가 surrogate 사이인지 확인합니다.", "UI가 code point/grapheme 중 무엇을 요구하는지 정합니다."], fix: "code point APIs 또는 적절한 grapheme segmentation으로 경계를 계산합니다.", prevention: "BMP·supplementary·combining·ZWJ fixtures를 text tests에 포함합니다." },
      ],
    },
    {
      id: "bigdecimal-money-exact-policy",
      title: "금액에는 BigDecimal을 쓰라는 한 줄 대신 생성 source·scale·rounding·equality를 계약으로 만듭니다",
      lead: "BigDecimal은 primitive가 아니라 immutable decimal class이며 잘못 만들면 binary approximation도 그대로 보존합니다.",
      explanations: [
        "BigDecimal은 arbitrary-precision unscaled integer와 32-bit scale로 decimal value를 표현하는 class입니다. primitive type이 아니며 method call로 arithmetic합니다.",
        "decimal text가 source of truth면 new BigDecimal('19.99')처럼 String constructor를 사용합니다. new BigDecimal(0.1)은 binary64 0.1 approximation의 exact decimal을 가져와 긴 값이 됩니다.",
        "이미 double만 있다면 의도를 검토한 뒤 BigDecimal.valueOf(value)가 Double.toString 기반 canonical decimal을 사용해 흔히 기대한 0.1을 만듭니다. 처음부터 text/decimal path가 더 낫습니다.",
        "add/subtract/multiply는 exact decimal result를 만들 수 있지만 divide가 non-terminating이면 scale/MathContext/RoundingMode 없이 ArithmeticException이 납니다. 언제·어느 단계에서 round할지 domain policy입니다.",
        "equals는 value와 scale을 모두 봐 1.0과 1.00이 false이고 compareTo는 numeric comparison 0입니다. HashMap key·set uniqueness와 database scale에 canonicalization 정책이 필요합니다.",
        "currency마다 minor units가 다르고 세금·할인·현금 rounding 규칙도 다릅니다. '항상 소수 둘째 자리'를 세계 공통 규칙으로 만들지 않습니다.",
      ],
      concepts: [
        { term: "BigDecimal scale", definition: "unscaled integer에서 decimal point가 오른쪽에서 몇 자리 이동하는지 나타내는 값입니다.", detail: ["representation equality에 영향 줍니다.", "currency policy와 맞춥니다."] },
        { term: "RoundingMode", definition: "exact result를 requested precision/scale로 표현하지 못할 때 어느 방향으로 round할지 정하는 policy입니다.", detail: ["명시해야 합니다.", "business rule과 연결합니다."] },
        { term: "representation versus numeric equality", definition: "BigDecimal equals의 value+scale 동일과 compareTo의 numeric order/equality 차이입니다.", detail: ["collection key에 중요합니다.", "canonical scale을 결정합니다."] },
      ],
      codeExamples: [
        {
          id: "java-bigdecimal-money-contract",
          title: "double constructor·String/valueOf·scale equality·division rounding을 비교합니다",
          language: "java",
          filename: "src/learning/java02/DecimalMoney.java",
          purpose: "원본의 BigDecimal 언급을 실제 생성·연산·비교·failure/rounding output으로 완성합니다.",
          code: String.raw`package learning.java02;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class DecimalMoney {
    public static void main(String[] args) {
        BigDecimal fromDouble = new BigDecimal(0.1);
        BigDecimal fromString = new BigDecimal("0.1");
        BigDecimal fromValueOf = BigDecimal.valueOf(0.1);
        BigDecimal price = new BigDecimal("19.99");
        BigDecimal quantity = new BigDecimal("3");

        System.out.println("from-double=" + fromDouble);
        System.out.println("from-string=" + fromString);
        System.out.println("value-of=" + fromValueOf);
        System.out.println("sum=" + fromString.add(new BigDecimal("0.2")));
        System.out.println("money=" + price.multiply(quantity));
        System.out.println("equals-scale=" + new BigDecimal("1.0").equals(new BigDecimal("1.00")));
        System.out.println("compare-scale=" + new BigDecimal("1.0").compareTo(new BigDecimal("1.00")));
        try {
            BigDecimal.ONE.divide(new BigDecimal("3"));
        } catch (ArithmeticException error) {
            System.out.println("divide=" + error.getClass().getSimpleName());
        }
        System.out.println("rounded=" + BigDecimal.ONE.divide(new BigDecimal("3"), 2, RoundingMode.HALF_UP));
    }
}`,
          walkthrough: [
            { lines: "8-12", explanation: "binary double, decimal String/valueOf와 money operands를 따로 만듭니다." },
            { lines: "14-20", explanation: "constructor results, exact add/multiply와 equals/compare scale 차이를 출력합니다." },
            { lines: "21-26", explanation: "non-terminating exact divide failure와 explicit scale/rounding success를 비교합니다." },
          ],
          run: { environment: ["JDK 21+"], command: "javac -d build/classes src/learning/java02/DecimalMoney.java && java -cp build/classes learning.java02.DecimalMoney" },
          output: { value: "from-double=0.1000000000000000055511151231257827021181583404541015625\nfrom-string=0.1\nvalue-of=0.1\nsum=0.3\nmoney=59.97\nequals-scale=false\ncompare-scale=0\ndivide=ArithmeticException\nrounded=0.33", explanation: ["double constructor는 binary approximation을 정확히 decimal로 드러냅니다.", "String source와 explicit division policy가 deterministic decimal result를 만듭니다."] },
          experiments: [
            { change: "price를 new BigDecimal(19.99)로 만듭니다.", prediction: "money에 binary approximation digits가 들어옵니다.", result: "decimal input은 String/decimal transport로 유지합니다." },
            { change: "HALF_UP을 HALF_EVEN으로 바꾸고 tie fixtures를 돌립니다.", prediction: "일부 midpoint result가 달라집니다.", result: "rounding mode는 business contract입니다." },
            { change: "BigDecimal을 HashSet key로 1.0/1.00 둘 다 넣습니다.", prediction: "equals가 false라 two entries가 될 수 있습니다.", result: "collection identity 전에 scale canonicalization을 정합니다." },
          ],
          sourceRefs: ["java-floating-source", "java-bigdecimal-api"],
        },
      ],
      diagnostics: [
        { symptom: "new BigDecimal(0.1)이 예상보다 긴 decimal을 만든다.", likelyCause: "double binary approximation을 constructor가 exact decimal로 변환했습니다.", checks: ["input이 original String인지 already-double인지 추적합니다.", "constructor/valueOf results를 비교합니다.", "serialization/database scale을 봅니다."], fix: "decimal text면 String constructor, double-only source면 policy 검토 후 valueOf를 사용합니다.", prevention: "money creation factory가 raw String과 currency/rounding을 소유하게 합니다." },
        { symptom: "BigDecimal divide가 ArithmeticException을 낸다.", likelyCause: "1/3 같은 non-terminating decimal에 scale/MathContext/RoundingMode가 없습니다.", checks: ["division denominator와 expected scale을 확인합니다.", "rounding 시점/규칙을 domain owner와 합의합니다.", "intermediate rounding 누적을 test합니다."], fix: "explicit scale 또는 MathContext와 RoundingMode를 사용합니다.", prevention: "currency/tax/discount rounding examples와 boundary tests를 contract에 둡니다." },
      ],
    },
    {
      id: "primitive-selection-domain-boundaries",
      title: "primitive 선택은 가장 작은 type 맞추기가 아니라 domain invariant·연산·interop·failure 정책 선택입니다",
      lead: "메모리 몇 byte보다 overflow·precision·API 계약과 읽기 쉬운 model을 우선합니다.",
      explanations: [
        "일반 integer local/count/index에는 int가 기본이고 timestamp/large count에는 long을 검토합니다. byte/short는 binary protocol·compact array/file format처럼 boundary 의미가 있을 때 사용합니다.",
        "char는 text code unit이고 numeric quantity가 아닙니다. Unicode text는 String/code point APIs로 다루고 protocol unsigned 16-bit quantity는 explicit int range 0..65535 model을 고려합니다.",
        "float는 graphics/ML/binary format memory·throughput tradeoff가 명확할 때, double은 일반 scientific calculation의 기본이지만 exact decimal money에는 둘 다 부적합할 수 있습니다.",
        "boolean은 two states만 표현합니다. unknown/not-applicable/pending가 필요한 domain을 false 하나로 접지 말고 enum/state model을 사용합니다.",
        "BigInteger/BigDecimal은 arbitrary precision·decimal semantics를 주지만 allocation·method API·scale/rounding/serialization 비용을 가집니다. 필요한 invariant에 맞게 선택합니다.",
        "external input parse·database/network narrowing 경계에서 syntax, range, finite, unit와 precision을 검증합니다. internal calculation type을 좁게 유지하려고 cast를 남발하지 않습니다.",
      ],
      concepts: [
        { term: "domain invariant", definition: "값이 business/system 의미상 항상 만족해야 하는 range·unit·precision·state 규칙입니다.", detail: ["type 선택을 이끕니다.", "boundary에서 검증합니다."] },
        { term: "narrowing boundary", definition: "넓은/외부 representation을 작은 primitive로 바꾸며 loss 가능성을 검사해야 하는 지점입니다.", detail: ["cast 자체는 검사하지 않습니다.", "error type을 설계합니다."] },
        { term: "semantic type choice", definition: "storage size뿐 아니라 값 의미·operation·failure·interop를 기준으로 representation을 고르는 방식입니다.", detail: ["char와 unsigned quantity를 구분합니다.", "money rounding을 포함합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "메모리를 아끼려고 모든 count를 byte로 만들었더니 cast와 overflow bug가 늘었다.", likelyCause: "local scalar storage 추정보다 domain range·promotion/API 비용을 무시했습니다.", checks: ["실제 data volume/object layout/profile을 측정합니다.", "casts/promotions와 max count를 inventory합니다.", "serialization boundary와 in-memory type을 구분합니다."], fix: "일반 계산은 int/long으로 유지하고 compact representation은 measured boundary에서 encode/decode합니다.", prevention: "type choice decision record와 property tests를 둡니다." },
      ],
      comparisons: [
        { title: "숫자 representation 선택", options: [
          { name: "int/long", chooseWhen: "exact bounded integer count·index·duration unit를 다룰 때", avoidWhen: "범위가 unbounded 또는 decimal fraction이 필요할 때", tradeoffs: ["빠르고 단순합니다.", "fixed-width overflow를 소유합니다."] },
          { name: "float/double", chooseWhen: "binary scientific/graphics/ML approximation과 range/performance가 중요할 때", avoidWhen: "exact decimal money·identity가 필요할 때", tradeoffs: ["hardware/API 지원이 넓습니다.", "rounding·NaN·Infinity 정책이 필요합니다."] },
          { name: "BigInteger/BigDecimal", chooseWhen: "arbitrary integer 또는 exact decimal+explicit rounding이 필요할 때", avoidWhen: "primitive binary protocol/hot numeric kernel 요구가 우선일 때", tradeoffs: ["overflow/decimal semantics가 명시적입니다.", "allocation·API·scale policy 비용이 있습니다."] },
        ] },
      ],
    },
    {
      id: "compiler-diagnostics-boundary-testing",
      title: "compile-fail fixture와 min/max±1·special-value property tests로 type 규칙을 검증합니다",
      lead: "정상 예제만 보면 constant special case를 일반 규칙으로 오해하기 쉽습니다.",
      explanations: [
        "uninitialized local read, out-of-scope name, final second assignment는 runtime tests가 아니라 expected compile failures입니다. JavaCompiler API 또는 isolated javac fixture로 diagnostic code/category를 검증합니다.",
        "byte variables sum→byte, long literal without L, double literal→float, multi-character char와 boolean=1도 compile boundary를 보여 줍니다. 무작정 cast로 compiler를 침묵시키지 않습니다.",
        "integer tests는 MIN, MIN+1, -1,0,1, MAX-1,MAX와 operations that cross boundary를 포함하고 Math exact와 default wrap를 비교합니다.",
        "floating tests는 ±0, MIN_VALUE, MIN_NORMAL, MAX_VALUE, nextUp/down, NaN, ±Infinity와 representative decimal fractions를 포함합니다.",
        "Unicode tests는 ASCII, Hangul BMP, supplementary emoji, isolated surrogate, combining sequence와 normalization variants를 포함합니다.",
        "money tests는 scale, tie rounding, non-terminating division, negative/zero/large quantity, currency-specific minor unit와 serialization round-trip을 포함합니다.",
      ],
      concepts: [
        { term: "compile-fail fixture", definition: "특정 source가 expected compiler diagnostic으로 거부되는지 검증하는 작은 test입니다.", detail: ["runtime test와 다릅니다.", "compiler version/locale 영향을 관리합니다."] },
        { term: "boundary-value test", definition: "허용 range의 min/max와 바로 안팎 값을 집중 검증하는 test입니다.", detail: ["off-by-one/overflow를 찾습니다.", "conversion에 중요합니다."] },
        { term: "property test", definition: "많은 generated values에서 round-trip·range·invariant가 성립하는지 확인하는 test입니다.", detail: ["examples를 보완합니다.", "oracles와 shrinking이 필요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "정상 sample 100만 통과했는데 production boundary에서 음수로 바뀐다.", likelyCause: "min/max와 intermediate overflow/narrowing cases를 test하지 않았습니다.", checks: ["domain max와 operation chain을 계산합니다.", "MAX±1, multiplication/addition boundaries를 실행합니다.", "cast/compound assignment를 찾습니다."], fix: "wider/checked type과 boundary/property tests를 추가합니다.", prevention: "type contract마다 accepted/rejected boundary table을 유지합니다." },
      ],
      expertNotes: [
        "JOL 같은 implementation-specific object layout tool은 primitive field/array memory 측정에 유용하지만 JLS value set과 JVM implementation layout을 구분해 사용합니다.",
        "vectorization·strict floating semantics·hardware differences는 representative JDK/architecture benchmark와 numerical error analysis로 검증하고 tutorial slogan으로 단정하지 않습니다.",
      ],
    },
  ],
  lab: {
    title: "원본 primitive audit에서 안전한 금액·수량·Unicode 입력 모델까지",
    scenario: "네 원본의 boolean·char·integer·floating examples를 exact regression으로 보존하고, 주문 한 줄의 enabled·quantity·unitPrice·label을 안전한 type과 boundary policy로 모델링합니다.",
    setup: [
      "Temurin/OpenJDK 21, UTF-8와 clean build/classes를 사용하고 four original sources는 read-only로 둡니다.",
      "golden script에 네 FQCN stdout과 compiler exit를 기록합니다.",
      "OrderDraft의 active(boolean), quantity text, unitPrice text, label text에 accepted/rejected policy를 정의합니다.",
      "integer/float/Unicode/BigDecimal boundary fixture 표를 준비합니다.",
    ],
    steps: [
      "네 원본의 active lines와 comments를 분리하고 exact stdout을 clean compile/run으로 확인합니다.",
      "각 declaration을 variable kind·type·scope·initializer·reassignment 표로 만듭니다.",
      "uninitialized local·out-of-scope·final reassignment compile-fail fixtures를 실행합니다.",
      "eight primitives의 value set·width·range·precision·special values 표를 공식 JLS와 대조합니다.",
      "literal type/suffix/radix와 constant-expression narrowing을 LiteralContracts output으로 검증합니다.",
      "byte variable addition·short↔char·compound assignment의 promotion/conversion trace를 작성합니다.",
      "IntegerBoundaries에서 default wrap·narrow cast·Math exact를 비교하고 30-day intermediate overflow를 고칩니다.",
      "FloatingPointModel에서 source float bit value, 0.1+0.2, NaN·Infinity·signed zero를 검증합니다.",
      "UnicodeUnits에서 Hangul·emoji·combining sequence의 code unit/code point counts를 확인합니다.",
      "quantity는 ASCII decimal syntax·positive int range를 checked parser로 검증하고 raw sensitive input을 log하지 않습니다.",
      "unitPrice는 BigDecimal(String), currency scale와 RoundingMode policy를 적용하고 quantity multiply total을 exact하게 계산합니다.",
      "accepted/rejected results에 field와 stable reason code만 남기고 min/max±1·NaN/Infinity·Unicode·rounding tests를 실행합니다.",
    ],
    expectedResult: [
      "네 원본 stdout이 보존되고 comment-only claims는 actual execution evidence와 분리됩니다.",
      "local definite assignment·scope·final violations가 compile 단계에서 정확히 분류됩니다.",
      "constant assignment와 general promotion/compound assignment 결과형을 모든 sample에서 예측할 수 있습니다.",
      "integer overflow/narrowing이 silent data corruption으로 남지 않고 checked policy에서 거부됩니다.",
      "floating special values와 decimal approximation이 finite/range/domain validation을 통과하지 못합니다.",
      "emoji·combining label을 char count로 잘못 자르지 않고 chosen Unicode boundary를 지킵니다.",
      "money total과 rounding이 BigDecimal String source·scale·RoundingMode contract와 일치합니다.",
      "error telemetry가 raw input/PII 없이 field·reason·boundary만 기록합니다.",
    ],
    cleanup: ["temporary classes와 compile-fail source/output을 verified build directory에서만 제거하고 original four files를 수정하지 않습니다.", "diagnostic logs에서 raw labels·prices와 absolute local paths를 최소화합니다."],
    extensions: [
      "BigInteger로 very-large quantity/import ID를 처리하고 long conversion을 toIntExact/bitLength policy로 제한합니다.",
      "JMH로 int/long/BigDecimal hot path를 representative workload에서 측정하되 correctness contract를 먼저 유지합니다.",
      "ICU4J grapheme segmentation과 java.text.BreakIterator 결과를 emoji/locale fixtures로 비교합니다.",
      "database DECIMAL scale과 Java BigDecimal serialization/equals key policy를 integration test로 연결합니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "네 원본을 compile/run하고 모든 declaration·expression의 type/value/assignment 결과를 표로 추적하세요.", requirements: ["four exact outputs를 재현합니다.", "active/commented code를 구분합니다.", "boolean declaration/assignment/reassignment를 표시합니다.", "char literals/constants의 numeric code units를 적습니다.", "float 13.417F→double last output 원인을 설명합니다."], hints: ["왼쪽 target보다 오른쪽 expression type을 먼저 적으세요.", "println의 짧은 decimal만 보고 exact value를 단정하지 마세요."], expectedOutcome: "원본의 actual behavior와 부정확한 주석을 specification 근거로 교정합니다.", solutionOutline: ["source line→operand types→operation/constant→assignment conversion→printed form 순서로 표를 만듭니다.", "clean class output을 사용합니다."] },
    { difficulty: "응용", prompt: "integer·floating·Unicode boundary lab을 구현해 silent conversion을 모두 분류하세요.", requirements: ["byte/int/long min/max±1과 Math exact를 비교합니다.", "int→float precision boundary와 NaN/Infinity/±0를 검사합니다.", "BMP/emoji/combining sequence를 code unit/code point로 셉니다.", "checked quantity parser와 safe error code를 만듭니다.", "compile-fail fixtures를 최소 5개 둡니다."], hints: ["cast는 validation이 아닙니다.", "code point count도 grapheme count와 같지 않을 수 있습니다."], expectedOutcome: "정상·boundary·special inputs가 deterministic accepted/rejected result를 냅니다.", solutionOutline: ["representation별 validators를 분리합니다.", "min/max와 바로 바깥 값을 먼저 고정합니다."] },
    { difficulty: "설계", prompt: "다국어 주문 import의 quantity·money·label type/rounding/normalization policy를 production 수준으로 설계하세요.", requirements: ["primitive/BigInteger/BigDecimal 선택 근거와 DB/wire types를 정합니다.", "currency-specific scale·rounding 시점과 equals/key canonicalization을 정의합니다.", "Unicode normalization/grapheme 정책과 password/identifier 예외를 구분합니다.", "overflow/non-finite/parse/schema errors와 privacy-safe telemetry를 설계합니다.", "property/integration/migration tests와 rollback을 포함합니다."], hints: ["가장 작은 primitive가 가장 안전한 것은 아닙니다.", "값 의미와 representation equality를 구분하세요."], expectedOutcome: "silent wrap·binary money drift·Unicode truncation 없이 운영 가능한 data boundary contract가 완성됩니다.", solutionOutline: ["raw→validated domain value→calculation→serialization 단계를 분리합니다.", "각 boundary에 stable error와 round-trip test를 둡니다."] },
  ],
  reviewQuestions: [
    { question: "변수 선언과 초기화는 같은가요?", answer: "아닙니다. 선언은 type/name을 도입하고 initialization은 첫 usable value를 갖게 합니다." },
    { question: "지역 int를 선언만 하면 0인가요?", answer: "아닙니다. local은 읽기 전 definite assignment가 증명되어야 하고 field/array elements에만 기본값 규칙이 있습니다." },
    { question: "final reference가 가리키는 object도 자동 immutable인가요?", answer: "아닙니다. variable 재대입을 막을 뿐 object mutability는 type/API가 결정합니다." },
    { question: "모든 final primitive가 compile-time constant인가요?", answer: "아닙니다. final primitive/String이 constant expression으로 초기화된 constant variable이어야 합니다." },
    { question: "Java primitive는 몇 개인가요?", answer: "boolean과 byte·short·int·long·char·float·double, 총 8개입니다." },
    { question: "boolean에 0이나 1을 cast할 수 있나요?", answer: "아닙니다. numeric과 boolean 사이 cast는 없고 비교 expression으로 boolean을 만듭니다." },
    { question: "char는 Unicode 문자 하나인가요?", answer: "정확히는 UTF-16 code unit 하나이며 supplementary code point와 grapheme는 여러 char일 수 있습니다." },
    { question: "short와 char는 둘 다 16-bit이니 서로 widening되나요?", answer: "아닙니다. signed/unsigned value ranges가 달라 direct widening conversion이 없습니다." },
    { question: "long num=1000에서 L을 생략했으니 모든 long literal에서 생략 가능한가요?", answer: "아닙니다. 1000은 int literal widening이고 int 범위를 넘는 decimal에는 L이 필요합니다." },
    { question: "float literal은 언제 F가 필요한가요?", answer: "소수점/지수 floating literal은 기본 double이므로 float로 직접 대입하려면 F가 필요하지만 int literal 1은 float로 widening될 수 있습니다." },
    { question: "byte+byte result는 byte인가요?", answer: "아닙니다. binary numeric promotion으로 보통 int입니다." },
    { question: "-120+-8을 byte에 넣을 수 있는 이유는 무엇인가요?", answer: "compile-time int constant expression -128이 byte range 안인 assignment narrowing 특례입니다." },
    { question: "c+=1과 c=c+1은 char에서 완전히 같은 compile behavior인가요?", answer: "아닙니다. compound assignment는 implicit cast를 포함해 former가 compile될 수 있습니다." },
    { question: "정수 overflow는 exception을 내나요?", answer: "기본 integer operators는 표시하지 않고 wrap하며 Math.*Exact를 써야 명시 failure를 얻습니다." },
    { question: "long target이면 RHS int multiplication overflow가 방지되나요?", answer: "아닙니다. operand types로 operation이 먼저 수행되므로 first operand부터 long이어야 합니다." },
    { question: "float→double widening이 original decimal precision을 복구하나요?", answer: "아닙니다. source float value는 exact 보존하지만 이미 float rounding에서 잃은 decimal intent는 복구하지 못합니다." },
    { question: "0.1 같은 모든 decimal이 floating에서 부정확한가요?", answer: "많은 decimal fractions가 그렇지만 0.5·0.25처럼 finite binary fraction은 exact합니다." },
    { question: "NaN은 value==Double.NaN으로 검사하나요?", answer: "아닙니다. NaN은 자기 자신과도 == false이므로 Double.isNaN을 사용합니다." },
    { question: "0.0과 -0.0은 완전히 구분되지 않나요?", answer: "==는 true지만 reciprocal·raw bits·Double.compare는 구분하므로 domain policy가 필요합니다." },
    { question: "BigDecimal은 primitive인가요?", answer: "아닙니다. arbitrary-precision decimal을 표현하는 immutable class입니다." },
    { question: "금액에 new BigDecimal(0.1)을 써도 되나요?", answer: "보통 원 decimal text가 있으면 String constructor를 쓰며 double constructor는 binary approximation을 그대로 드러냅니다." },
    { question: "BigDecimal 1.0과 1.00은 equals인가요?", answer: "equals는 scale도 보므로 false이고 numeric comparison은 compareTo가 0입니다." },
  ],
  completionChecklist: [
    "inventory의 Ex03·Ex04·day02 Ex01·Ex02 네 source를 직접 읽고 사용했다.",
    "네 mains를 JDK 21.0.11에서 UTF-8·Xlint clean compile/run해 exact stdout와 exit 0을 확인했다.",
    "active code·commented experiment·source explanation을 provenance에서 분리했다.",
    "변수·값·type·expression, declaration·initialization·assignment·reassignment를 구분했다.",
    "local definite assignment와 field/array default values를 compile fixtures로 검증했다.",
    "block scope·lifetime·local/field shadowing과 this를 설명했다.",
    "final 재대입 금지와 object immutability, constant variable을 구분했다.",
    "boolean과 7 numeric primitives의 value sets·bit widths·ranges를 공식 JLS와 대조했다.",
    "range와 precision을 분리하고 '정수<실수' 단일 서열을 제거했다.",
    "integer/floating/char literal 기본 type·L/F suffix·radix·underscore rules를 검증했다.",
    "2147483648L, -2147483648과 int/long literal boundary를 설명했다.",
    "constant-expression assignment narrowing과 general byte/short/char promotion을 구분했다.",
    "compound assignment·increment의 implicit narrowing/wrap 위험을 검증했다.",
    "integer min/max, default wrap, narrowing low bits와 intermediate overflow를 재현했다.",
    "Math exact methods와 BigInteger 선택 기준을 적용했다.",
    "binary32/binary64 precision·normal/subnormal과 original float widening loss를 관찰했다.",
    "0.1+0.2, NaN·Infinity·signed zero와 finite/domain validation을 검증했다.",
    "char를 String과 구분하고 UTF-16 code unit range와 numeric codes를 설명했다.",
    "BMP·supplementary emoji·combining sequence의 code unit/code point/grapheme 경계를 검증했다.",
    "BigDecimal String/valueOf/double constructor, scale·rounding·equals/compareTo를 실행했다.",
    "type selection을 memory size가 아닌 domain range·precision·failure·interop 기준으로 결정했다.",
    "compile-fail·boundary/property tests와 privacy-safe telemetry를 갖췄다.",
  ],
  nextSessions: [],
  sources: [
    { id: "java-boolean-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day01/Ex03.java", usedFor: ["boolean", "declaration", "first assignment", "reassignment", "declaration initializer", "true/false output"], evidence: "JDK 21.0.11에서 true/false/false를 실행해 변수 lifecycle의 원본 evidence로 사용했습니다." },
    { id: "java-char-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day01/Ex04.java", usedFor: ["char literals", "numeric constants", "constant expressions", "Hangul", "digit glyph", "UTF-16 correction"], evidence: "a/d/가/e/A/0과 code units 97/100/44032/101/65/48을 확인하고 String 혼동을 UTF-16 model로 교정했습니다." },
    { id: "java-integral-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day02/Ex01.java", usedFor: ["byte", "short", "int", "long", "ranges", "L suffix", "commented casts", "constant narrowing"], evidence: "100/-120/100/100/100/1000을 재현하고 suffix·promotion·overflow 설명을 boundary examples로 보강했습니다." },
    { id: "java-floating-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day02/Ex02.java", usedFor: ["float F literal", "double", "int to long", "float to double", "precision loss", "BigDecimal note"], evidence: "3.45/13.417/314/13.416999816894531을 재현해 float widening이 lost precision을 복구하지 않음을 확인했습니다." },
    { id: "jdk21-javac", repository: "Oracle Java SE 21 Tool Specifications", path: "javac command", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["UTF-8 compile", "Xlint", "diagnostics", "clean output"], evidence: "원본과 custom examples의 reproducible compile command 기준입니다." },
    { id: "jls-types-values", repository: "Oracle Java Language Specification 21", path: "Chapter 4 Types, Values, and Variables", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html", usedFor: ["static typing", "eight primitives", "ranges", "integer overflow", "IEEE 754", "variables", "final/defaults"], evidence: "primitive value sets·operation behavior와 variable model의 핵심 language 기준입니다." },
    { id: "jls-literals", repository: "Oracle Java Language Specification 21", path: "3.10 Literals", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-3.html#jls-3.10", usedFor: ["integer/floating/boolean/char literals", "radix", "suffix", "boundary grammar"], evidence: "L/F와 special integer literal·char syntax 교정의 기준입니다." },
    { id: "jls-assignment", repository: "Oracle Java Language Specification 21", path: "5.2 Assignment Contexts", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.2", usedFor: ["assignment conversion", "constant narrowing", "target compatibility"], evidence: "원본 -120+-8·100+1 같은 constant expression assignment와 runtime variable 차이의 기준입니다." },
    { id: "jls-promotions", repository: "Oracle Java Language Specification 21", path: "5.6 Numeric Contexts", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.6", usedFor: ["unary/binary promotion", "byte/short/char to int", "operation result types"], evidence: "작은 type 산술과 float/double operation type을 size slogan 대신 graph로 설명했습니다." },
    { id: "jls-scope", repository: "Oracle Java Language Specification 21", path: "6.3 Scope of a Declaration", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.3", usedFor: ["block scope", "names", "shadowing boundary"], evidence: "원본 밖 local visibility·shadowing 설명의 공식 기준입니다." },
    { id: "jls-local-variables", repository: "Oracle Java Language Specification 21", path: "14.4 Local Variable Declaration Statements", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.4", usedFor: ["local declaration", "initializer", "definite assignment", "var boundary"], evidence: "declaration·initializer와 uninitialized local diagnostics의 기준입니다." },
    { id: "java-float-api", repository: "Oracle Java SE 21 API", path: "java.lang.Float", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Float.html", usedFor: ["MIN/MAX", "hex string", "NaN", "infinity", "bits", "ULP"], evidence: "binary32 stored value와 boundary observation API의 기준입니다." },
    { id: "java-double-api", repository: "Oracle Java SE 21 API", path: "java.lang.Double", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Double.html", usedFor: ["isNaN/isFinite", "compare", "raw bits", "signed zero", "binary64"], evidence: "special-value validation과 comparison policy를 보강했습니다." },
    { id: "java-character-api", repository: "Oracle Java SE 21 API", path: "java.lang.Character", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Character.html", usedFor: ["UTF-16", "surrogates", "code points", "toChars", "Unicode properties"], evidence: "char를 사용자 문자와 분리하고 supplementary code point API를 적용했습니다." },
    { id: "java-math-api", repository: "Oracle Java SE 21 API", path: "java.lang.Math exact arithmetic", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html#addExact(int,int)", usedFor: ["add/subtract/multiply exact", "toIntExact", "overflow failure", "ulp"], evidence: "silent integer wrap를 explicit checked policy로 바꾸는 기준입니다." },
    { id: "java-bigdecimal-api", repository: "Oracle Java SE 21 API", path: "java.math.BigDecimal", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html", usedFor: ["String/double/valueOf constructors", "scale", "rounding", "divide", "equals/compareTo", "money"], evidence: "원본의 한 줄 언급을 production decimal contract와 exact example로 완성했습니다." },
    { id: "unicode-standard", repository: "Unicode Consortium", path: "Unicode Standard 15.0 Core Specification Chapter 3", publicUrl: "https://www.unicode.org/versions/Unicode15.0.0/ch03.pdf", usedFor: ["code point", "UTF-16", "surrogates", "combining sequence", "text boundaries"], evidence: "Java 21 Character가 사용하는 Unicode model에서 code unit·code point·grapheme를 구분했습니다." },
  ],
  sourceCoverage: {
    filesRead: 4,
    filesUsed: 4,
    uncoveredNotes: [
      "inventory의 네 Java 원본을 모두 직접 읽고 Temurin JDK 21.0.11에서 -encoding UTF-8 -Xlint:all clean compile한 뒤 four main outputs와 exit 0을 검증했습니다.",
      "Ex03은 boolean declaration/reassignment만 실행하므로 local definite assignment, scope·shadowing, final/constant variable과 field/array defaults를 JLS 기반으로 보완했습니다.",
      "Ex04의 '문자열은 숫자로 저장'을 char=UTF-16 code unit으로 교정하고 constant int assignment, supplementary code point·grapheme 경계를 추가했습니다.",
      "Ex01의 '정수<실수', L 생략, 결과 범위 설명을 range/precision·literal grammar·constant assignment·promotion·overflow/narrowing rules로 교정했습니다.",
      "Ex02의 float→double last value를 actual precision-loss evidence로 사용하고 NaN·Infinity·signed zero·subnormal과 BigDecimal executable contract를 확장했습니다.",
      "scope/final, compile-fail fixtures, checked arithmetic, Unicode supplementary text, BigDecimal scale/rounding·property tests는 원본에 없어 Oracle JLS/API와 Unicode 공식 자료로 보강했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
