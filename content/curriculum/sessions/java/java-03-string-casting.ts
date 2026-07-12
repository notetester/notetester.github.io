import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["java-03-string-casting"],
  slug: "java-03-string-casting",
  courseId: "java",
  moduleId: "java-language-control",
  order: 3,
  title: "String·자동 승격·강제 형변환",
  subtitle: "String의 값·identity·불변성과 숫자 promotion·cast·parse·checked conversion을 평가 순서와 손실 정책으로 통합합니다.",
  level: "기초",
  estimatedMinutes: 480,
  coreQuestion: "문자열 결합과 숫자 변환을 단순한 ‘큰 타입/작은 타입’ 규칙으로 외우지 않고, 각 expression의 type·value·손실·실패를 어떻게 단계별로 증명할까요?",
  summary: "javastudy day02 Ex03·Ex04·Ex05·Ex07 네 원본을 UTF-8로 읽고 Temurin JDK 21.0.11에서 clean compile·run해 String 결합, primitive widening, narrowing, char 변환의 실제 출력을 먼저 고정합니다. 원본의 직선형 크기표와 2/5 설명을 operand→promotion→operation→conversion 순서로 교정합니다. short↔char는 direct widening 관계가 없고 byte·short·char 산술은 int로 promotion되며, 넓은 destination은 이미 끝난 정수 나눗셈이나 overflow를 되돌리지 못합니다. 그 위에 String reference/null·불변성·pool·content equality·Unicode normalization, 결합 평가 순서, 정밀도 손실·NaN/Infinity narrowing, parsing 정책, checked arithmetic, BigInteger/BigDecimal, compile-fail·bytecode·boundary/property tests를 연결합니다.",
  objectives: [
    "String reference·null·불변성·재대입을 구분하고 == identity, equals content, pool/intern boundary를 설명할 수 있다.",
    "UTF-16 length·code point·normalization과 content equality를 domain별 text policy에 맞게 적용할 수 있다.",
    "+ expression을 left association·left-to-right evaluation으로 추적해 numeric addition과 concatenation 결과를 예측할 수 있다.",
    "widening·narrowing·assignment·string conversion·numeric promotion을 conversion graph로 설명하고 constant assignment 특례를 구분할 수 있다.",
    "cast 위치 이전의 integer division·intermediate overflow, int→float precision loss와 NaN·Infinity narrowing을 진단할 수 있다.",
    "String parsing의 syntax·radix·whitespace·range·Unicode digit·finite 정책과 실패 범주를 분류할 수 있다.",
    "Math exact·strict numeric conversion·BigInteger·BigDecimal로 silent wrap/truncation을 stable domain error로 바꿀 수 있다.",
  ],
  prerequisites: [
    { title: "변수·primitive·overflow·floating·Unicode", reason: "String과 numeric conversions가 참조형·primitive value sets·promotion·binary precision 위에서 동작합니다.", sessionSlug: "java-02-primitives-variables" },
  ],
  keywords: ["String", "reference", "immutable", "string pool", "intern", "identity", "equals", "Objects.equals", "Unicode normalization", "concatenation", "evaluation order", "promotion", "widening", "narrowing", "casting", "assignment conversion", "int division", "precision loss", "NaN cast", "Infinity cast", "parseInt", "NumberFormatException", "Math.addExact", "Math.toIntExact", "BigInteger", "BigDecimal", "StringConcatFactory"],
  chapters: [
    {
      id: "four-source-expression-output-audit",
      title: "네 원본의 모든 출력은 operand type→operation→conversion→format 순서로 다시 계산합니다",
      lead: "주석의 크기 비유보다 actual expression과 bytecode를 먼저 evidence로 고정합니다.",
      explanations: [
        "Ex03의 `String s2 = \"1000\";`은 String이라 `s2 + 10`이 100010이고 `int s3 = 1000;`의 `s3 + 10`은 1010입니다. subtraction은 String에 정의되지 않아 `s3 - 10`만 990을 냅니다.",
        "`105 + \"10\"`과 `\"10\" + 105`는 한 operand가 String인 첫 +에서 concatenation이 되어 10510과 10105입니다. `20 + 4`는 24지만 `\"결과 : \" + 20 + 4`는 left-associative하게 결과 : 204가 됩니다.",
        "Ex04의 int 100은 long 100, float 100.0으로 widening되고 long 100은 double 100.0이 됩니다. char a/가/나는 int code units 97/44032/45208로 widening됩니다.",
        "double su3=2/5는 int division idiv가 0을 만든 뒤 i2d로 0.0이 됩니다. (double)(2/5)도 같은 0.0이고 (double)2/5 또는 2/5.0만 floating division 0.4입니다.",
        "Ex05의 (int)35.475는 toward zero 35이고 (char)65는 A입니다. 이것은 정상 범위 sample일 뿐 overflow·NaN·Infinity에서 안전하다는 증거가 아닙니다.",
        "Ex07의 char ch2=66은 in-range constant assignment라 B가 되지만 int ch3=67은 explicit (char) cast가 필요해 C가 됩니다. 'ASCII code'는 A/B/C에만 맞고 Java char 일반 model은 UTF-16입니다.",
      ],
      concepts: [
        { term: "conversion trace", definition: "operand static types·operation type/value·assignment/cast·printed form을 순서대로 적는 표입니다.", detail: ["destination부터 역추론하지 않습니다.", "손실 위치를 찾습니다."] },
        { term: "active expression", definition: "comment가 아니라 실제 compile·execute되는 expression입니다.", detail: ["bytecode와 stdout 근거가 됩니다.", "comment-only alternatives와 구분합니다."] },
        { term: "intermediate value", definition: "최종 assignment 전에 subexpression이 만든 type과 value입니다.", detail: ["division/overflow가 이미 일어날 수 있습니다.", "cast placement가 중요합니다."] },
      ],
      codeExamples: [
        {
          id: "java-original-string-casting-output-audit",
          title: "원본 네 main의 빈 줄까지 exact pipe summary로 보존합니다",
          language: "powershell",
          filename: "verify-original-string-casting.ps1",
          purpose: "String +·widening·narrowing의 실제 active output을 이후 보강 examples와 분리합니다.",
          code: String.raw`$src = "src\com\ictedu\day02"
$out = "build\classes"
$files = @("$src\Ex03.java", "$src\Ex04.java", "$src\Ex05.java", "$src\Ex07.java")

javac -encoding UTF-8 -Xlint:all -d $out $files
if ($LASTEXITCODE -ne 0) { throw "compile failed" }

function Summary($simple) {
  $lines = & java -cp $out "com.ictedu.day02.$simple"
  if ($LASTEXITCODE -ne 0) { throw "run failed: $simple" }
  "$simple=$($lines -join "|")"
}

Summary "Ex03"
Summary "Ex04"
Summary "Ex05"
Summary "Ex07"`,
          walkthrough: [
            { lines: "1-6", explanation: "four inventory files를 same compiler invocation과 clean output에 고정합니다." },
            { lines: "8-12", explanation: "각 main의 lines를 pipe로 연결하되 Ex04의 empty println도 empty field로 보존합니다." },
            { lines: "14-17", explanation: "same package의 exact simple names를 실행합니다." },
          ],
          run: { environment: ["PowerShell 7+", "JDK 21", "javastudy MyJavaProject root"], command: "pwsh -File verify-original-string-casting.ps1" },
          output: { value: "Ex03=Hello|100010|1010|990|10510|10105|24|결과 : 204|결과 : 24|결과 : 24\nEx04=100|100|100.0|100.0|a|97|44032|45208||0|0.0|0.4\nEx05=35|A\nEx07=A|65|B|67|C", explanation: ["원본 actual stdout이고 Ex04 blank line은 double pipe입니다.", "commented casts/alternatives는 포함되지 않습니다."] },
          experiments: [
            { change: "Ex04의 (double)(2/5), (double)2/5, 2/(double)5를 각각 활성화합니다.", prediction: "0.0, 0.4, 0.4가 순서대로 나옵니다.", result: "cast가 operation 전에 operand를 바꿔야 division type이 달라집니다." },
            { change: "Ex07 int ch3 cast를 제거합니다.", prediction: "possible lossy conversion from int to char compile error가 납니다.", result: "runtime variable은 constant assignment 특례가 아닙니다." },
            { change: "Ex03 결과 expression에 parentheses를 제거/추가합니다.", prediction: "24와 204가 전환됩니다.", result: "연결 시작 지점을 명시합니다." },
          ],
          sourceRefs: ["java-string-concat-source", "java-widening-division-source", "java-narrowing-source", "java-char-cast-source", "jdk21-javac"],
        },
      ],
      diagnostics: [
        { symptom: "원본 설명과 출력 계산이 맞지 않는다.", likelyCause: "destination type·commented code·size slogan을 actual operation보다 먼저 적용했습니다.", checks: ["각 subexpression type/value를 왼쪽부터 적습니다.", "active/commented lines를 구분합니다.", "javap conversion opcode와 stdout을 확인합니다."], fix: "operand→promotion→operation→assignment/cast→format trace로 다시 계산합니다.", prevention: "golden output과 bytecode probe를 session evidence에 둡니다." },
      ],
    },
    {
      id: "string-reference-immutability-null",
      title: "String variable은 reference를 바꿀 수 있지만 String object의 character sequence는 immutable입니다",
      lead: "불변이라는 말을 ‘변수 변경 불가’나 ‘항상 새 객체 생성’으로 과장하지 않습니다.",
      explanations: [
        "String은 primitive가 아닌 final class이고 variable은 String object reference 또는 null을 저장합니다. 예를 들어 String variable s에 Hello literal을 대입하면 literal object의 reference가 s에 저장됩니다.",
        "String object는 생성 후 value sequence가 바뀌지 않습니다. toUpperCase·replace·substring 같은 method의 result를 사용하지 않으면 original reference가 가리키는 value는 그대로입니다.",
        "variable은 final이 아니면 다른 String reference로 재대입할 수 있습니다. s=s.toUpperCase(...)는 original object mutation이 아니라 returned reference를 s에 저장합니다.",
        "immutability는 thread sharing·hash key·pool에 유리하지만 모든 operation이 반드시 distinct object를 만든다는 뜻은 아닙니다. concat('')처럼 API가 same instance를 반환할 수 있습니다.",
        "null은 String object가 아니므로 null.toUpperCase/equals는 NullPointerException입니다. null·empty·blank를 domain에서 구분하고 Objects.equals를 고려합니다.",
        "반복 loop에서 String +=는 many intermediate values/allocation 가능성이 있어 StringBuilder를 고려하되 compiler/JIT optimization이 있으므로 representative benchmark로 결정합니다.",
      ],
      concepts: [
        { term: "String reference", definition: "String object 또는 null을 가리키는 reference type value입니다.", detail: ["object content와 variable assignment를 구분합니다.", "==는 reference identity를 봅니다."] },
        { term: "immutability", definition: "String object가 나타내는 character sequence가 생성 뒤 바뀌지 않는 계약입니다.", detail: ["variable 재대입은 가능합니다.", "same instance 반환도 가능합니다."] },
        { term: "null/empty/blank", definition: "reference 없음, length 0, whitespace-only라는 서로 다른 상태입니다.", detail: ["validation policy를 명시합니다.", "method receiver null을 피합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "name.toUpperCase()를 호출했는데 name이 바뀌지 않는다.", likelyCause: "immutable String method의 returned value를 사용하지 않았습니다.", checks: ["method return을 assignment/return에 연결했는지 봅니다.", "original과 result를 함께 출력합니다.", "nullable receiver를 확인합니다."], fix: "String normalized=name.toUpperCase(Locale.ROOT)처럼 result를 새 variable/reference에 저장합니다.", prevention: "String transformation pipeline은 input/result를 explicit names로 둡니다." },
      ],
    },
    {
      id: "string-identity-content-pool-intern",
      title: "==는 identity, equals는 content이며 pool identity는 content 계약이 아닙니다",
      lead: "literal·constant concatenation·runtime concatenation·new String·intern을 같은 fixture에서 비교합니다.",
      explanations: [
        "String literal과 String-valued constant expression은 interned되므로 같은 content의 literal/constant expression은 같은 canonical reference를 가리킵니다.",
        "`\"ja\" + \"va\"`는 String constant expression이라 `\"java\"` literal과 같은 interned reference임이 보장됩니다. non-final variable을 포함한 non-constant concatenation은 새 String object를 만듭니다.",
        "`new String(\"java\")`는 content가 같아도 distinct object identity를 의도적으로 만듭니다. ==가 false이고 equals가 true인 대표 fixture입니다.",
        "content contract에는 equals를 사용하고 nullable values에는 Objects.equals(a,b)를 사용합니다. intern을 correctness를 위한 equality 대체재로 쓰지 않습니다.",
        "String.intern은 canonical pool reference를 반환하지만 memory/performance tradeoff와 lifecycle이 있습니다. unbounded external strings를 무조건 intern하지 않습니다.",
        "hashCode/equals가 value 기반이라 immutable String은 map key로 안정적입니다. normalization/case policy가 다르면 visually similar keys는 별도 entries일 수 있습니다.",
      ],
      concepts: [
        { term: "identity equality", definition: "두 references가 같은 object를 가리키는지 보는 == 비교입니다.", detail: ["String content 계약과 다릅니다.", "pool 때문에 우연히 true일 수 있습니다."] },
        { term: "content equality", definition: "String.equals가 character sequence 값을 비교하는 계약입니다.", detail: ["case/normalization은 별도입니다.", "null receiver를 주의합니다."] },
        { term: "intern", definition: "같은 content의 canonical pooled String reference를 얻는 operation입니다.", detail: ["identity 실험에 사용합니다.", "일반 equality용이 아닙니다."] },
      ],
      codeExamples: [
        {
          id: "java-string-identity-immutability",
          title: "pool·runtime/new identity, immutable result와 Unicode normalization을 한 번에 검증합니다",
          language: "java",
          filename: "src/learning/java03/StringIdentityLab.java",
          purpose: "원본에 주석으로만 있는 reference 개념을 content/identity/immutability/Unicode exact evidence로 완성합니다.",
          code: String.raw`package learning.java03;

import java.text.Normalizer;
import java.util.Locale;

public class StringIdentityLab {
    public static void main(String[] args) {
        String literal = "java";
        String folded = "ja" + "va";
        String prefix = "ja";
        String runtime = prefix + "va";
        String copied = new String("java");
        String original = "Hello";
        String upper = original.toUpperCase(Locale.ROOT);
        String composed = "\u00E9";
        String decomposed = "e\u0301";
        String emoji = "😀";

        System.out.println("literal==folded=" + (literal == folded));
        System.out.println("literal==runtime=" + (literal == runtime));
        System.out.println("literal==copied=" + (literal == copied));
        System.out.println("literal.equals(copied)=" + literal.equals(copied));
        System.out.println("intern=" + (literal == runtime.intern()));
        System.out.println("original=" + original + ",upper=" + upper);
        System.out.println("concat-empty-same=" + (literal == literal.concat("")));
        System.out.println("unicode-equals=" + composed.equals(decomposed));
        System.out.println("unicode-nfc=" + Normalizer.normalize(decomposed, Normalizer.Form.NFC).equals(composed));
        System.out.println("emoji-length=" + emoji.length() + ",codePoints=" + emoji.codePointCount(0, emoji.length()));
    }
}`,
          walkthrough: [
            { lines: "8-16", explanation: "literal/folded/runtime/new, immutable transformation와 normalization fixtures를 준비합니다." },
            { lines: "18-24", explanation: "identity·content·intern, original/result와 same-instance optimization을 비교합니다." },
            { lines: "25-27", explanation: "visually similar Unicode sequences와 emoji code-unit/code-point 차이를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+", "UTF-8 source/output"], command: "javac -encoding UTF-8 -d build/classes src/learning/java03/StringIdentityLab.java && java -cp build/classes learning.java03.StringIdentityLab" },
          output: { value: "literal==folded=true\nliteral==runtime=false\nliteral==copied=false\nliteral.equals(copied)=true\nintern=true\noriginal=Hello,upper=HELLO\nconcat-empty-same=true\nunicode-equals=false\nunicode-nfc=true\nemoji-length=2,codePoints=1", explanation: ["pool identity는 construction path에 따라 달라도 content equals는 안정적입니다.", "immutability·same-instance 반환과 Unicode normalization을 구분합니다."] },
          experiments: [
            { change: "prefix를 constant initializer가 있는 final String으로 만듭니다.", prediction: "`prefix + \"va\"`도 String constant expression이 되어 literal identity가 true입니다.", result: "이 보장은 constant expression에만 해당하므로 일반 content 비교에는 여전히 equals를 씁니다." },
            { change: "nullable String의 receiver.equals를 호출합니다.", prediction: "NullPointerException이 납니다.", result: "Objects.equals 또는 validation으로 null semantics를 명시합니다." },
            { change: "password에 NFC normalization을 자동 적용합니다.", prediction: "사용자가 입력한 secret sequence 의미를 바꿀 수 있습니다.", result: "normalization은 domain별 보안 정책입니다." },
          ],
          sourceRefs: ["java-string-concat-source", "jls-string-literals", "jls-constant-expression", "java-string-api", "java-objects-api", "java-normalizer-api", "jls-expression-order"],
        },
      ],
      diagnostics: [
        { symptom: "같은 문자열인데 == test가 환경·생성 경로에 따라 실패한다.", likelyCause: "content 대신 object identity와 pool/folding에 의존했습니다.", checks: ["literal/new/runtime/intern construction path를 확인합니다.", "==와 equals 결과를 함께 봅니다.", "null/normalization/case policy를 확인합니다."], fix: "content 비교는 equals/Objects.equals와 explicit normalization/case policy를 사용합니다.", prevention: "runtime-created·new String·nullable·Unicode variants를 equality tests에 둡니다." },
      ],
    },
    {
      id: "string-unicode-normalization-boundaries",
      title: "String length·equals는 UTF-16 sequence 기준이며 시각적 문자·normalized identifier와 별개입니다",
      lead: "Java 02의 code unit/code point 지식을 String content 정책에 적용합니다.",
      explanations: [
        "String.length는 UTF-16 code units 수이고 equals는 같은 code-unit sequence를 비교합니다. emoji는 length 2이고 composed/decomposed é는 화면이 같아도 equals false일 수 있습니다.",
        "Normalizer NFC/NFD 등은 canonical equivalence를 같은 form으로 바꿀 수 있지만 모든 domain에 자동 적용하면 안 됩니다. identifier/search/display/password rules가 다릅니다.",
        "case-insensitive comparison은 equalsIgnoreCase 한 줄로 모든 locale/security 요구를 해결하지 않습니다. storage canonicalization과 display original, Locale.ROOT versus user locale를 구분합니다.",
        "substring/truncate는 surrogate pair와 grapheme cluster를 끊지 않아야 합니다. codePoint offset도 ZWJ emoji/combining grapheme를 완전히 해결하지 않습니다.",
        "String isBlank/strip은 Unicode whitespace API semantics를 가지며 trim과 범위가 다릅니다. external protocol의 ASCII whitespace policy와 분리합니다.",
        "homoglyph/confusable identifier 보안은 normalization만으로 해결되지 않습니다. allowed scripts·confusable detection·display context를 threat model로 둡니다.",
      ],
      concepts: [
        { term: "normalization form", definition: "canonically equivalent Unicode sequences를 composed/decomposed representation으로 정규화하는 규칙입니다.", detail: ["NFC/NFD 등이 있습니다.", "domain boundary에서 선택합니다."] },
        { term: "code-unit equality", definition: "String.equals가 UTF-16 sequence를 exact하게 비교하는 성질입니다.", detail: ["시각적 equality와 다릅니다.", "normalization/case는 자동 적용되지 않습니다."] },
        { term: "confusable", definition: "서로 다른 Unicode sequences가 시각적으로 비슷해 identity/security 혼동을 만드는 경우입니다.", detail: ["normalization만으로 전부 해결되지 않습니다.", "allowed-script policy를 고려합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "화면상 같은 é가 database uniqueness에서 다르게 취급된다.", likelyCause: "composed/decomposed code-unit sequences와 normalization policy가 없습니다.", checks: ["codePoints/Normalizer forms를 출력합니다.", "ingress·query·index collation을 확인합니다.", "identifier/password domain을 구분합니다."], fix: "해당 domain ingress/storage/query에 같은 explicit normalization/collation policy를 적용합니다.", prevention: "NFC/NFD·locale·confusable fixtures와 migration plan을 둡니다." },
      ],
    },
    {
      id: "plus-overload-association-evaluation",
      title: "+는 각 subexpression에서 numeric addition 또는 String concatenation으로 결정되고 operands는 왼쪽부터 평가됩니다",
      lead: "전체 식에 String이 하나 있으니 모두 연결이라는 단순화 대신 tree를 그립니다.",
      explanations: [
        "binary +는 operands가 numeric이면 numeric addition이고 한 operand가 String이면 string conversion과 concatenation입니다. result String 뒤 다음 +는 계속 concatenation이 됩니다.",
        "+는 left-associative라 `\"결과 : \" + 20 + 4`는 `(\"결과 : \" + 20) + 4`이고 결과 : 204입니다. `\"결과 : \" + (20 + 4)`는 parentheses 안 addition 후 결과 : 24입니다.",
        "`1 + 2 + \"x\"`는 3x이고 `\"x\" + 1 + 2`는 x12입니다. parentheses나 named numeric variable로 intent를 드러냅니다.",
        "Java evaluates operands left-to-right even when operator precedence groups them. i++처럼 side effect가 있으면 expression result와 variable update를 분리하지만 production code에서는 한 식의 multiple mutation을 피합니다.",
        "null reference가 concatenation context에 오면 'null' text가 될 수 있어 missing data를 조용히 숨깁니다. validation/format policy를 먼저 적용합니다.",
        "javac는 constant concatenation을 ldc literal로 fold하고 runtime concatenation은 modern JDK에서 invokedynamic StringConcatFactory를 사용할 수 있습니다. lowering은 semantics를 바꾸지 않으며 performance는 workload로 측정합니다.",
      ],
      concepts: [
        { term: "string conversion", definition: "concatenation operand를 textual representation으로 바꾸는 conversion입니다.", detail: ["null도 'null'이 될 수 있습니다.", "parsing의 반대가 아닙니다."] },
        { term: "left associativity", definition: "같은 precedence의 + chain을 왼쪽부터 group하는 grammar property입니다.", detail: ["evaluation order와 함께 결과를 결정합니다.", "parentheses로 바꿀 수 있습니다."] },
        { term: "evaluation order", definition: "Java operands와 subexpressions가 observable side effects 관점에서 왼쪽부터 평가되는 규칙입니다.", detail: ["precedence와 다른 개념입니다.", "mutation은 separate statements가 낫습니다."] },
      ],
      codeExamples: [
        {
          id: "java-concat-evaluation-order",
          title: "원본 204 bug와 numeric/string-first·side effect·null concatenation을 비교합니다",
          language: "java",
          filename: "src/learning/java03/ConcatOrderLab.java",
          purpose: "association·parentheses·left-to-right mutation을 exact output으로 고정합니다.",
          code: String.raw`package learning.java03;

public class ConcatOrderLab {
    public static void main(String[] args) {
        int first = 20;
        int second = 4;
        int counter = 1;
        String nullable = null;

        System.out.println("raw=" + "결과 : " + first + second);
        System.out.println("grouped=" + "결과 : " + (first + second));
        System.out.println("number-first=" + (1 + 2) + "x");
        System.out.println("string-first=" + "x" + 1 + 2);
        System.out.println("order=" + counter++ + ":" + counter);
        System.out.println("null-concat=value=" + nullable);
    }
}`,
          walkthrough: [
            { lines: "5-8", explanation: "numeric operands, side-effect counter와 null reference를 준비합니다." },
            { lines: "10-13", explanation: "raw/grouped와 numeric-first/string-first grouping을 나란히 출력합니다." },
            { lines: "14-15", explanation: "postfix expression previous value·updated variable와 null string conversion을 봅니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java03/ConcatOrderLab.java && java -cp build/classes learning.java03.ConcatOrderLab" },
          output: { value: "raw=결과 : 204\ngrouped=결과 : 24\nnumber-first=3x\nstring-first=x12\norder=1:2\nnull-concat=value=null", explanation: ["concatenation이 시작된 뒤 later numbers는 text가 됩니다.", "postfix variable update는 semicolon이 아니라 expression evaluation 중 일어납니다."] },
          experiments: [
            { change: "counter++를 별도 statement로 분리합니다.", prediction: "output intent는 유지하면서 evaluation puzzle이 사라집니다.", result: "side effects를 읽기 쉬운 statements로 분리합니다." },
            { change: "nullable을 Objects.requireNonNull로 검증합니다.", prediction: "missing value가 literal null text 대신 boundary error가 됩니다.", result: "format 전에 null policy를 적용합니다." },
            { change: "loop에서 100만 번 +=와 StringBuilder를 benchmark합니다.", prediction: "workload/JIT에 따라 차이가 나며 bytecode만으로 속도를 단정할 수 없습니다.", result: "JMH/profile로 결정합니다." },
          ],
          sourceRefs: ["java-string-concat-source", "jls-expression-order", "jls-string-concat", "openjdk-string-concat"],
        },
      ],
      diagnostics: [
        { symptom: "합계 label이 결과 : 204로 나온다.", likelyCause: "leftmost String concatenation 뒤 20과 4가 각각 string conversion되었습니다.", checks: ["expression tree와 parentheses를 적습니다.", "numeric sum을 먼저 variable에 저장해 봅니다.", "compiler constant/runtime concat과 관계없이 semantics를 확인합니다."], fix: "`\"결과 : \" + (first + second)` 또는 `int total = first + second;` 뒤 format합니다.", prevention: "복잡한 output expression은 계산·format을 분리하고 exact output test를 둡니다." },
      ],
    },
    {
      id: "conversion-graph-assignment-promotion",
      title: "identity·widening·narrowing·assignment·string conversion과 numeric promotion은 서로 다른 규칙입니다",
      lead: "byte<short<char<int 같은 한 줄 크기표를 conversion graph로 교체합니다.",
      explanations: [
        "widening primitive conversions에는 byte→short/int/long/float/double, short→int/long/float/double, char→int/long/float/double 등이 있지만 short↔char는 없습니다.",
        "int→long/double은 exact할 수 있지만 int→float, long→float/double은 precision을 잃을 수 있습니다. widening은 runtime exception 없이 target range에 들어간다는 뜻이지 모든 bits exact 보장이 아닙니다.",
        "narrowing conversion은 explicit cast가 필요할 수 있고 value loss·wrap·truncation을 자동 검증하지 않습니다. compiler 허용과 domain safety를 분리합니다.",
        "assignment context는 in-range int constant expression을 byte/short/char에 넣는 특례가 있어 char c=66은 되지만 int n=66; char c=n은 cast 없이 안 됩니다.",
        "binary numeric promotion은 operand 중 double이 있으면 double, 아니면 float가 있으면 float, 아니면 long이 있으면 long, 그 밖의 integral operands는 int를 operation type으로 사용합니다. 그래서 byte+byte·char+char도 result가 int입니다.",
        "String conversion은 concatenation/format에서 values를 text로 바꾸는 규칙이고 text→number parsing과 다릅니다. String을 (int) cast할 수 없습니다.",
      ],
      concepts: [
        { term: "widening conversion", definition: "compile-time cast 없이 허용되는 primitive range 방향 conversion입니다.", detail: ["항상 exact는 아닙니다.", "boolean은 numeric graph 밖입니다."] },
        { term: "narrowing conversion", definition: "target value set이 source를 모두 exact 표현하지 못해 loss 가능한 conversion입니다.", detail: ["cast가 필요할 수 있습니다.", "검증을 대신하지 않습니다."] },
        { term: "numeric promotion", definition: "operator 적용 전에 operands를 common operation type으로 바꾸는 규칙입니다.", detail: ["assignment와 구분합니다.", "작은 integral은 int가 됩니다."] },
      ],
      codeExamples: [
        {
          id: "java-promotion-cast-placement",
          title: "small-integral promotion·precision loss·cast timing·intermediate overflow를 한 표로 출력합니다",
          language: "java",
          filename: "src/learning/java03/PromotionLab.java",
          purpose: "원본의 직선 type 표와 2/5 설명을 operation-result evidence로 교정합니다.",
          code: String.raw`package learning.java03;

public class PromotionLab {
    public static void main(String[] args) {
        byte left = 60;
        byte right = 70;
        Object byteSum = left + right;
        char letter = 'A';
        Object charSum = letter + 1;
        int exactInt = 16_777_217;
        float widenedFloat = exactInt;
        int back = (int) widenedFloat;
        double lateCast = 2 / 5;
        double earlyCast = (double) 2 / 5;
        int badMillis = 30 * 24 * 60 * 60 * 1000;
        long goodMillis = 30L * 24 * 60 * 60 * 1000;

        System.out.println("byte-plus-type=" + byteSum.getClass().getSimpleName() + ",value=" + byteSum);
        System.out.println("byte-cast=" + (byte) (left + right));
        System.out.println("char-plus-type=" + charSum.getClass().getSimpleName() + ",value=" + charSum);
        System.out.println("int=" + exactInt + ",float=" + (int) widenedFloat + ",back=" + back);
        System.out.println("division-late=" + lateCast + ",early=" + earlyCast);
        System.out.println("30days-bad=" + badMillis + ",good=" + goodMillis);
    }
}`,
          walkthrough: [
            { lines: "5-10", explanation: "byte/char operations를 Object context에서 boxed result type으로 관찰하고 int→float precision boundary를 만듭니다." },
            { lines: "11-14", explanation: "division cast timing과 int/long multiplication timing을 대비합니다." },
            { lines: "16-21", explanation: "type·value·cast wrap·precision·overflow를 exact lines로 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java03/PromotionLab.java && java -cp build/classes learning.java03.PromotionLab" },
          output: { value: "byte-plus-type=Integer,value=130\nbyte-cast=-126\nchar-plus-type=Integer,value=66\nint=16777217,float=16777216,back=16777216\ndivision-late=0.0,early=0.4\n30days-bad=-1702967296,good=2592000000", explanation: ["작은 integral operations는 int이고 cast는 wrap합니다.", "widening·late assignment/cast가 lost precision/overflow를 되돌리지 못합니다."] },
          experiments: [
            { change: "byte result를 cast 없이 byte variable에 대입합니다.", prediction: "possible lossy conversion from int to byte compile error가 납니다.", result: "계산은 int로 유지하거나 checked narrow합니다." },
            { change: "(double)(2/5)로 바꿉니다.", prediction: "parentheses 안 int division 후 cast라 0.0입니다.", result: "cast 위치가 operation type 전에 있어야 합니다." },
            { change: "goodMillis 첫 L을 마지막 literal에만 둡니다.", prediction: "그 전에 int overflow가 날 수 있습니다.", result: "첫 risky operation부터 widen/check합니다." },
          ],
          sourceRefs: ["java-widening-division-source", "java-char-cast-source", "jls-widening", "jls-narrowing", "jls-assignment", "jls-promotions", "jls-primitive-overflow"],
        },
      ],
      diagnostics: [
        { symptom: "double result=2/5가 0.0이다.", likelyCause: "int operands가 integer division 0을 만든 뒤 result가 double로 widening되었습니다.", checks: ["cast/decimal literal이 division 전에 operand에 적용되는지 봅니다.", "상수식은 compiler가 접을 수 있으므로 variable operand probe에서 idiv 뒤 i2d 순서를 확인합니다.", "integer/floating operation requirement를 정합니다."], fix: "(double)2/5 또는 2/5.0으로 operation을 floating으로 만들거나 exact rational/decimal type을 씁니다.", prevention: "division boundary example과 operation type trace를 둡니다." },
      ],
    },
    {
      id: "widening-precision-and-intermediate-overflow",
      title: "자동 widening은 compile 편의이지 precision·중간 연산 안전 보증이 아닙니다",
      lead: "conversion이 허용되는가와 domain value가 보존되는가를 별도 질문으로 둡니다.",
      explanations: [
        "byte→short/int/long, short/char→int/long, int→long과 int→double 등 exact widening edges가 있지만 int→float는 24-bit precision 때문에 일부 int를 합칩니다.",
        "long→double도 53-bit를 넘는 integer low bits를 잃을 수 있고 long→float는 더 큽니다. cast-back equality나 exact integer boundary로 검증합니다.",
        "float→double은 every float value를 exact하게 표현하지만 decimal literal intent가 float creation 때 이미 rounded됐다면 original text를 복구하지 않습니다.",
        "target long/double은 RHS operation operands를 소급해 widen하지 않습니다. integer division·multiplication이 먼저 끝난 뒤 assignment conversion됩니다.",
        "unit calculation은 Duration/typed constants와 Math.multiplyExact를 고려하고 각 intermediate unit/range를 이름으로 드러냅니다.",
        "serialization/database/export에서 widening된 approximate value를 exact ID/money로 사용하지 않습니다. representation contract를 boundary에서 검증합니다.",
      ],
      concepts: [
        { term: "exact widening edge", definition: "source value set의 모든 값을 target에서 exactly represent하는 widening conversion입니다.", detail: ["int→long 등이 해당합니다.", "int→float는 해당하지 않습니다."] },
        { term: "precision boundary", definition: "adjacent integer/real values가 floating representation에서 더 이상 구분되지 않는 지점입니다.", detail: ["float around 2^24가 대표입니다.", "round-trip test로 봅니다."] },
        { term: "late widening", definition: "narrow operation result가 이미 만들어진 뒤 넓은 target으로 변환되는 상황입니다.", detail: ["손실을 되돌리지 못합니다.", "operand부터 바꿉니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "int를 float에 자동 대입했는데 1이 줄어든 뒤 cast-back된다.", likelyCause: "widening conversion은 허용되지만 binary32 precision boundary를 넘었습니다.", checks: ["source absolute value와 2^24 주변을 확인합니다.", "Float.toHexString/ulp와 cast-back을 봅니다.", "exactness requirement를 확인합니다."], fix: "exact integer는 int/long/BigInteger로 유지하고 floating conversion은 explicit boundary policy로 제한합니다.", prevention: "max domain values의 round-trip property test를 둡니다." },
      ],
    },
    {
      id: "narrowing-integer-floating-two-step",
      title: "narrowing은 integer low bits와 floating toward-zero·endpoint clamp의 서로 다른 algorithm입니다",
      lead: "cast는 round·range check·exception이 아니며 floating→byte는 두 단계입니다.",
      explanations: [
        "integer→smaller integral narrowing은 low n bits를 보존해 sign이 바뀔 수 있습니다. (byte)130=-126, (char)-1=65535입니다.",
        "floating→int/long은 NaN이면 0, finite는 toward zero, 너무 크거나 ±Infinity면 target endpoint로 clamp됩니다. overflow wrap라고 설명하면 틀립니다.",
        "floating→byte/short/char는 먼저 int로 위 규칙을 적용한 뒤 integer narrowing으로 low bits를 보존합니다. 그래서 (byte)Infinity는 int MAX_VALUE→byte -1입니다.",
        "double 35.475→int 35와 -35.475→-35는 floor가 아니라 toward zero입니다. 금융 rounding에는 RoundingMode/BigDecimal을 사용합니다.",
        "primitive cast는 NumberFormatException/ArithmeticException을 주지 않으므로 finite·fraction·range를 먼저 검사한 strict helper가 필요합니다.",
        "protocol byte가 unsigned 0..255라면 Java signed byte display와 wire bits를 분리하고 Byte.toUnsignedInt를 사용합니다.",
      ],
      concepts: [
        { term: "low-bit narrowing", definition: "integer target width의 low bits만 남겨 새 signed/unsigned value를 만드는 conversion입니다.", detail: ["range validation이 아닙니다.", "sign이 바뀔 수 있습니다."] },
        { term: "toward-zero conversion", definition: "floating fractional part를 0 방향으로 제거해 integer 후보를 만드는 규칙입니다.", detail: ["floor와 다릅니다.", "NaN/overflow rules가 별도입니다."] },
        { term: "endpoint clamp", definition: "floating value가 int/long range 밖이거나 infinity일 때 MIN/MAX endpoint가 되는 narrowing 단계입니다.", detail: ["그 뒤 byte/char narrowing이 이어질 수 있습니다.", "exception이 아닙니다."] },
      ],
      codeExamples: [
        {
          id: "java-narrowing-boundary-matrix",
          title: "fraction·NaN·Infinity·integer low bits와 two-step byte result를 검증합니다",
          language: "java",
          filename: "src/learning/java03/NarrowingBoundaryLab.java",
          purpose: "원본 정상 sample 35/A를 full JLS boundary matrix로 확장합니다.",
          code: String.raw`package learning.java03;

public class NarrowingBoundaryLab {
    public static void main(String[] args) {
        System.out.println("trunc=" + (int) 3.9 + "," + (int) -3.9);
        System.out.println("nan=" + (int) Double.NaN);
        System.out.println("posInf=" + (int) Double.POSITIVE_INFINITY);
        System.out.println("negInf=" + (int) Double.NEGATIVE_INFINITY);
        System.out.println("byte130=" + (byte) 130);
        System.out.println("charMinus1=" + (int) (char) -1);
        System.out.println("bytePosInf=" + (byte) Double.POSITIVE_INFINITY);
    }
}`,
          walkthrough: [
            { lines: "5-8", explanation: "positive/negative fraction, NaN과 infinities의 floating→int rules를 출력합니다." },
            { lines: "9-11", explanation: "integer low-bit byte/char와 Infinity→int MAX→byte two-step result를 봅니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java03/NarrowingBoundaryLab.java && java -cp build/classes learning.java03.NarrowingBoundaryLab" },
          output: { value: "trunc=3,-3\nnan=0\nposInf=2147483647\nnegInf=-2147483648\nbyte130=-126\ncharMinus1=65535\nbytePosInf=-1", explanation: ["floating int conversion은 toward-zero/0/endpoints입니다.", "smaller integral target은 이어지는 low-bit narrowing으로 다른 값이 됩니다."] },
          experiments: [
            { change: "Math.floor(negative) 뒤 int cast와 direct cast를 비교합니다.", prediction: "-4와 -3으로 다릅니다.", result: "rounding policy를 cast와 혼동하지 않습니다." },
            { change: "NaN/Infinity를 strict helper 전 검사합니다.", prediction: "silent 0/endpoints 대신 domain error가 됩니다.", result: "cast 전에 finite/range/fraction을 검증합니다." },
            { change: "byte value를 Byte.toUnsignedInt로 출력합니다.", prediction: "-126 bits가 unsigned 130으로 해석됩니다.", result: "wire bits와 signed numeric meaning을 구분합니다." },
          ],
          sourceRefs: ["java-narrowing-source", "java-char-cast-source", "jls-narrowing", "jls-primitive-overflow"],
        },
      ],
      diagnostics: [
        { symptom: "(int)NaN이 0이고 Infinity가 MAX/MIN이라 invalid data가 정상처럼 보인다.", likelyCause: "primitive narrowing cast를 validation으로 사용했습니다.", checks: ["Double.isFinite/isNaN을 먼저 봅니다.", "fraction/range requirements를 확인합니다.", "byte/char two-step narrowing도 추적합니다."], fix: "finite·integral·range checks를 통과한 value만 cast하고 stable domain error를 반환합니다.", prevention: "NaN/±Infinity/MIN/MAX±1/fraction fixtures를 mandatory tests로 둡니다." },
      ],
    },
    {
      id: "string-parsing-format-policy",
      title: "String→number는 cast가 아니라 syntax·radix·range를 해석하는 parsing boundary입니다",
      lead: "Integer.parseInt 성공과 업무적으로 유효한 값, normalization 허용을 구분합니다.",
      explanations: [
        "`String text = \"42\";`를 `(int) text`로 cast할 수 없습니다. parseInt는 character sequence를 radix digits/sign으로 해석해 int value를 만들고 syntax/range 실패에 NumberFormatException을 냅니다.",
        "parseInt는 leading/trailing whitespace를 자동 허용하지 않습니다. trim/strip을 적용할지는 protocol/user-input policy이고 silently normalize하지 않습니다.",
        "radix 2..36을 explicit 지원하고 hex prefix 0x는 parseInt(s,16)에 자동 허용되지 않는 등 API contract를 확인합니다. full string consumption을 기대합니다.",
        "Character.digit에 기반한 non-ASCII Unicode digits가 accepted될 수 있습니다. external machine protocol이 ASCII-only라면 regex/code-point allowlist로 먼저 제한합니다.",
        "overflow와 invalid syntax 모두 NumberFormatException이어서 field-specific error가 필요하면 pre-validation 또는 custom result type으로 empty/syntax/range를 분류합니다.",
        "Double.parseDouble은 NaN/Infinity text도 받을 수 있어 business finite policy를 추가합니다. raw account/token/value를 error logs에 남기지 않습니다.",
      ],
      concepts: [
        { term: "parsing", definition: "text syntax를 검사하고 의미 있는 typed value로 해석하는 과정입니다.", detail: ["numeric cast와 다릅니다.", "syntax/range failure가 있습니다."] },
        { term: "radix", definition: "digit sequence를 해석할 진법 base입니다.", detail: ["2..36을 지원합니다.", "prefix policy를 명시합니다."] },
        { term: "normalization policy", definition: "whitespace·Unicode digits·sign·case 등을 parse 전에 허용/변환/거부하는 규칙입니다.", detail: ["API default와 구분합니다.", "security/protocol에 영향 줍니다."] },
      ],
      codeExamples: [
        {
          id: "java-integer-parsing-policy",
          title: "decimal·hex·whitespace·overflow·Unicode digits와 double special text를 분류합니다",
          language: "java",
          filename: "src/learning/java03/ParsingPolicyLab.java",
          purpose: "parse defaults와 caller normalization/finite policy를 exact exceptions/values로 보여 줍니다.",
          code: String.raw`package learning.java03;

public class ParsingPolicyLab {
    private static String parseFailure(String text) {
        try {
            return Integer.toString(Integer.parseInt(text));
        } catch (NumberFormatException error) {
            return error.getClass().getSimpleName();
        }
    }

    public static void main(String[] args) {
        System.out.println("decimal=" + Integer.parseInt("42"));
        System.out.println("hex=" + Integer.parseInt("2A", 16));
        System.out.println("spaces=" + parseFailure(" 42 "));
        System.out.println("range=" + parseFailure("2147483648"));
        System.out.println("trim-policy=" + Integer.parseInt(" 42 ".trim()));
        System.out.println("fullwidth=" + Integer.parseInt("１２"));
        System.out.println("double-special=" + Double.parseDouble("NaN") + "," + Double.parseDouble("Infinity"));
    }
}`,
          walkthrough: [
            { lines: "4-10", explanation: "raw input을 노출하지 않고 NumberFormatException category 또는 parsed decimal을 반환하는 helper입니다." },
            { lines: "13-18", explanation: "default decimal/radix, whitespace/range failures와 explicit trim·fullwidth digit acceptance를 비교합니다." },
            { lines: "19", explanation: "floating parser가 special tokens를 value로 받음을 확인합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+", "UTF-8 source"], command: "javac -encoding UTF-8 -d build/classes src/learning/java03/ParsingPolicyLab.java && java -cp build/classes learning.java03.ParsingPolicyLab" },
          output: { value: "decimal=42\nhex=42\nspaces=NumberFormatException\nrange=NumberFormatException\ntrim-policy=42\nfullwidth=12\ndouble-special=NaN,Infinity", explanation: ["parseInt는 whitespace를 reject하지만 Unicode digits는 받아들일 수 있습니다.", "floating parse 성공 뒤 finite validation이 별도입니다."] },
          experiments: [
            { change: "ASCII-only regex [+-]?[0-9]+를 parse 전에 적용합니다.", prediction: "fullwidth digits가 domain syntax error가 됩니다.", result: "machine protocol을 JDK Unicode digit policy와 분리합니다." },
            { change: "null을 parseInt에 넘깁니다.", prediction: "NumberFormatException 계열 failure가 나며 null/empty 정책을 별도로 두어야 합니다.", result: "missing과 malformed를 구분합니다." },
            { change: "Double.parseDouble 결과에 isFinite를 적용합니다.", prediction: "NaN/Infinity를 business rejection으로 바꿀 수 있습니다.", result: "parse success가 domain success는 아닙니다." },
          ],
          sourceRefs: ["java-integer-api", "java-double-api"],
        },
      ],
      diagnostics: [
        { symptom: "`Integer.parseInt(\" 42 \")`가 실패한다.", likelyCause: "parser가 surrounding whitespace를 자동 제거한다고 가정했습니다.", checks: ["raw code points와 input contract를 봅니다.", "trim/strip 허용 여부를 정합니다.", "ASCII/Unicode digits 정책도 확인합니다."], fix: "whitespace를 reject하거나 caller가 명시적으로 normalize한 뒤 parse합니다.", prevention: "empty/space/sign/radix/Unicode/overflow boundary table을 둡니다." },
      ],
    },
    {
      id: "checked-conversion-exact-arithmetic",
      title: "compiler를 통과시키는 cast보다 overflow·finite·fraction·range를 검증하는 checked conversion을 만듭니다",
      lead: "silent wrap/truncation을 stable domain error로 바꾸고 arithmetic intent를 method 이름에 담습니다.",
      explanations: [
        "Math.addExact/subtractExact/multiplyExact/incrementExact/decrementExact/negateExact는 fixed-width overflow에서 ArithmeticException을 냅니다. default operators와 behavior가 다릅니다.",
        "Math.toIntExact(long)는 long→int range를 검사하지만 double→int strict helper는 직접 finite·integer-valued·range를 검사해야 합니다.",
        "Double.isFinite, value==Math.rint(value), Integer.MIN/MAX 순서로 검사한 뒤 cast하면 NaN/Infinity/fraction/overflow가 silent value가 되지 않습니다.",
        "exception 대신 Result/Either/domain validation object가 UI/import pipeline에 적합할 수 있습니다. raw sensitive value 대신 field·reason·range만 telemetry에 남깁니다.",
        "intermediate operations도 exact method로 수행해야 final toIntExact만으로 earlier overflow를 잡을 수 있습니다. unit별 named longs와 multiplyExact를 사용합니다.",
        "arbitrary integer는 BigInteger, exact decimal은 BigDecimal을 선택하고 conversion back to primitive에 exactValue methods를 사용합니다.",
      ],
      concepts: [
        { term: "checked conversion", definition: "source value가 target invariant를 만족하는지 검사하고 failure를 명시한 뒤 변환하는 operation입니다.", detail: ["cast와 다릅니다.", "stable error taxonomy를 만듭니다."] },
        { term: "integer-valued floating", definition: "finite floating value가 fractional component 없이 exact integer 값인지에 대한 조건입니다.", detail: ["Math.rint 비교로 검사할 수 있습니다.", "range check도 필요합니다."] },
        { term: "exactValue", definition: "BigInteger/BigDecimal이 primitive/decimal target에 exact하게 들어가지 않으면 exception을 내는 conversion 계열입니다.", detail: ["silent loss를 막습니다.", "boundary에서 사용합니다."] },
      ],
      codeExamples: [
        {
          id: "java-checked-numeric-conversion",
          title: "default wrap와 Math exact, strict double→int rejection을 비교합니다",
          language: "java",
          filename: "src/learning/java03/CheckedConversionLab.java",
          purpose: "compile 성공과 data safety를 분리해 accepted/rejected boundary를 exact output으로 만듭니다.",
          code: String.raw`package learning.java03;

public class CheckedConversionLab {
    private static int strictInt(double value) {
        if (!Double.isFinite(value)) throw new IllegalArgumentException("NON_FINITE");
        if (value != Math.rint(value)) throw new IllegalArgumentException("FRACTION");
        if (value < Integer.MIN_VALUE || value > Integer.MAX_VALUE)
            throw new IllegalArgumentException("OUT_OF_RANGE");
        return (int) value;
    }

    private static void tryStrict(double value) {
        try {
            System.out.println("strict-ok=" + strictInt(value));
        } catch (IllegalArgumentException error) {
            System.out.println("strict-reject=" + error.getMessage());
        }
    }

    public static void main(String[] args) {
        System.out.println("wrapped=" + (Integer.MAX_VALUE + 1));
        try { Math.addExact(Integer.MAX_VALUE, 1); }
        catch (ArithmeticException error) { System.out.println("addExact=" + error.getClass().getSimpleName()); }
        try { Math.toIntExact((long) Integer.MAX_VALUE + 1); }
        catch (ArithmeticException error) { System.out.println("toIntExact=" + error.getClass().getSimpleName()); }
        tryStrict(42.0);
        tryStrict(3.5);
        tryStrict(Double.NaN);
        tryStrict(2_147_483_648.0);
    }
}`,
          walkthrough: [
            { lines: "4-10", explanation: "finite·integer-valued·range invariant를 순서대로 검사하고 raw value 대신 stable reason code를 던진 뒤에만 cast합니다." },
            { lines: "12-18", explanation: "success/rejection을 stable prefix와 reason code로 출력합니다." },
            { lines: "21-29", explanation: "default wrap, two Math exact failures와 four strict boundaries를 실행합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java03/CheckedConversionLab.java && java -cp build/classes learning.java03.CheckedConversionLab" },
          output: { value: "wrapped=-2147483648\naddExact=ArithmeticException\ntoIntExact=ArithmeticException\nstrict-ok=42\nstrict-reject=FRACTION\nstrict-reject=NON_FINITE\nstrict-reject=OUT_OF_RANGE", explanation: ["default operations/casts가 만들 silent values를 checked APIs가 stable rejection으로 바꿉니다.", "fraction·non-finite·range를 raw input 노출 없이 구분합니다."] },
          experiments: [
            { change: "range check를 cast 뒤로 옮깁니다.", prediction: "Infinity/large value가 endpoint로 바뀌어 original violation을 잃습니다.", result: "검사는 loss 전에 수행합니다." },
            { change: "Math.rint 대신 value%1==0을 사용합니다.", prediction: "NaN/Infinity와 signed zero 등 별도 finite policy가 여전히 필요합니다.", result: "helper contract를 tests로 고정합니다." },
            { change: "exception message에 full raw user record를 넣습니다.", prediction: "logs에 PII/secret이 노출될 수 있습니다.", result: "field/reason/boundary만 기록합니다." },
          ],
          sourceRefs: ["java-narrowing-source", "jls-primitive-overflow", "java-math-api"],
        },
      ],
      diagnostics: [
        { symptom: "cast를 추가하니 compile은 되지만 값이 음수/endpoint/0으로 훼손된다.", likelyCause: "compile-time lossy warning을 suppression했을 뿐 runtime invariant를 검사하지 않았습니다.", checks: ["source value와 cast 전 finite/fraction/range를 기록합니다.", "low-bit/toward-zero/two-step rule을 적용합니다.", "domain error expectation을 확인합니다."], fix: "checked helper/Math exact/exactValue conversion으로 교체합니다.", prevention: "min/max±1·NaN/Infinity/fraction property tests와 no-raw-cast review rule을 둡니다." },
      ],
    },
    {
      id: "exact-decimal-biginteger-policy",
      title: "BigInteger·BigDecimal은 primitive cast의 만능 대체가 아니라 exact domain arithmetic 계약입니다",
      lead: "source representation·scale·rounding·equality와 primitive conversion을 함께 설계합니다.",
      explanations: [
        "BigInteger는 arbitrary-precision integer로 long overflow domain에 적합하고 intValueExact/longValueExact로 checked narrow할 수 있습니다.",
        "BigDecimal(String)은 decimal text intent를 보존하고 new BigDecimal(double)은 binary double의 exact decimal expansion을 담습니다. double source면 valueOf 의미를 검토합니다.",
        "`0.1 + 0.2` double과 `new BigDecimal(\"0.1\").add(new BigDecimal(\"0.2\"))` 결과를 비교해 binary approximation과 exact decimal을 분리합니다.",
        "BigDecimal equals는 scale까지 보고 compareTo는 numeric order를 봅니다. 1.0/1.00 key uniqueness와 canonical scale을 정합니다.",
        "non-terminating divide는 rounding policy가 없으면 ArithmeticException입니다. scale/MathContext/RoundingMode와 rounding 시점을 domain owner가 정의합니다.",
        "BigDecimal→primitive는 intValue가 silently truncate할 수 있으므로 intValueExact처럼 expected exactness를 표현하는 method를 사용합니다.",
      ],
      concepts: [
        { term: "arbitrary precision", definition: "fixed primitive bit width 대신 available memory/implementation limit 안에서 크기를 늘리는 integer/decimal representation입니다.", detail: ["overflow model이 달라집니다.", "resource limits는 필요합니다."] },
        { term: "decimal source fidelity", definition: "사용자가 준 decimal text와 계산 intent를 binary approximation 없이 보존하는 성질입니다.", detail: ["String constructor가 중요합니다.", "serialization round-trip을 test합니다."] },
        { term: "explicit rounding", definition: "exact result가 requested decimal representation에 안 들어갈 때 scale/precision과 RoundingMode를 명시하는 정책입니다.", detail: ["divide에 필수일 수 있습니다.", "업무 규칙입니다."] },
      ],
      codeExamples: [
        {
          id: "java-exact-decimal-conversion",
          title: "double·BigDecimal 생성·scale equality·non-terminating divide를 비교합니다",
          language: "java",
          filename: "src/learning/java03/ExactDecimalLab.java",
          purpose: "conversion session의 최종 선택으로 binary approximation과 exact decimal·rounding을 실행합니다.",
          code: String.raw`package learning.java03;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;

public class ExactDecimalLab {
    public static void main(String[] args) {
        System.out.println("double=" + (0.1 + 0.2));
        System.out.println("decimal=" + new BigDecimal("0.1").add(new BigDecimal("0.2")));
        System.out.println("ctor-double=" + new BigDecimal(0.1));
        System.out.println("valueOf=" + BigDecimal.valueOf(0.1));
        BigInteger beyondInt = new BigInteger("2147483648");
        System.out.println("big-integer=" + beyondInt);
        try {
            beyondInt.intValueExact();
        } catch (ArithmeticException error) {
            System.out.println("big-int-exact=" + error.getClass().getSimpleName());
        }
        BigDecimal oneDecimal = new BigDecimal("1.0");
        BigDecimal twoDecimals = new BigDecimal("1.00");
        System.out.println("equals=" + oneDecimal.equals(twoDecimals) + ",compare=" + oneDecimal.compareTo(twoDecimals));
        try {
            BigDecimal.ONE.divide(new BigDecimal("3"));
        } catch (ArithmeticException error) {
            System.out.println("divide=" + error.getClass().getSimpleName());
        }
        System.out.println("rounded=" + BigDecimal.ONE.divide(new BigDecimal("3"), 2, RoundingMode.HALF_UP));
    }
}`,
          walkthrough: [
            { lines: "9-12", explanation: "binary sum, decimal String sum와 double/valueOf constructors를 비교합니다." },
            { lines: "13-19", explanation: "primitive int 범위를 넘는 BigInteger와 intValueExact rejection을 실행합니다." },
            { lines: "20-22", explanation: "same numeric value/different scale의 equals와 compareTo를 출력합니다." },
            { lines: "23-29", explanation: "exact non-terminating divide failure와 explicit rounded result를 나란히 둡니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java03/ExactDecimalLab.java && java -cp build/classes learning.java03.ExactDecimalLab" },
          output: { value: "double=0.30000000000000004\ndecimal=0.3\nctor-double=0.1000000000000000055511151231257827021181583404541015625\nvalueOf=0.1\nbig-integer=2147483648\nbig-int-exact=ArithmeticException\nequals=false,compare=0\ndivide=ArithmeticException\nrounded=0.33", explanation: ["source representation에 따라 BigDecimal value가 달라집니다.", "BigInteger는 값을 보존하고 exact primitive conversion은 범위를 거부합니다.", "numeric equality·representation equality·rounding policy가 서로 다릅니다."] },
          experiments: [
            { change: "intValue와 intValueExact에 3.5를 적용합니다.", prediction: "intValue는 3, exact는 ArithmeticException입니다.", result: "primitive conversion에도 exact contract를 사용합니다." },
            { change: "HALF_UP을 HALF_EVEN으로 바꾸고 tie cases를 실행합니다.", prediction: "일부 결과가 달라집니다.", result: "rounding mode를 제품 정책에 고정합니다." },
            { change: "unbounded digit input으로 BigInteger를 생성합니다.", prediction: "CPU/memory resource risk가 생깁니다.", result: "syntax뿐 아니라 length/resource limit를 둡니다." },
          ],
          sourceRefs: ["java-widening-division-source", "java-narrowing-source", "java-biginteger-api", "java-bigdecimal-api"],
        },
      ],
      diagnostics: [
        { symptom: "BigDecimal 1.0과 1.00이 HashSet에서 두 값이 된다.", likelyCause: "equals/hashCode가 scale을 포함하지만 numeric compareTo는 0인 차이를 무시했습니다.", checks: ["scale/equals/compareTo/hash policy를 확인합니다.", "database column scale과 serialization을 봅니다.", "key identity requirement를 정합니다."], fix: "canonical scale/stripTrailingZeros policy 또는 value object equality를 domain에 맞게 정의합니다.", prevention: "1.0/1.00·zero scale·serialization round-trip tests를 둡니다." },
      ],
    },
    {
      id: "compile-bytecode-boundary-tests",
      title: "compile-fail·javap·boundary/property tests가 conversion 설명을 실행 가능한 계약으로 만듭니다",
      lead: "cast를 넣으면 된다는 결론 대신 왜 compiler가 막았고 runtime에서 무엇을 잃는지 검증합니다.",
      explanations: [
        "compile-fail inventory에는 byte result=p+q, short→char variable, String→int cast, float f=0.1이 있고 각각 int promotion·signed range·reference/numeric separation·double literal narrowing을 드러냅니다. 아래 executable fixture는 대표 byte sum을 자동화하고 나머지는 확장 실험으로 분리합니다.",
        "compiler diagnostic text는 JDK/locale에 따라 달라질 수 있어 diagnostic code/category와 source position, exit를 test하고 교육 화면에는 핵심 reason을 normalize합니다.",
        "javap는 Ex03 constant concatenation을 ldc folded String, runtime concat을 invokedynamic StringConcatFactory로 보여 주고 Ex04/05는 i2l/i2f/l2d/d2i/i2c를 보여 줍니다.",
        "bytecode lowering이 source semantics의 유일한 specification은 아니므로 JLS rule과 함께 사용합니다. JIT native behavior를 bytecode만으로 performance 결론 내리지 않습니다.",
        "boundary tests는 numeric MIN/MAX±1, 2^24, NaN/Infinity/fraction, whitespace/radix/Unicode digits, composed/decomposed String과 null을 포함합니다.",
        "property tests는 checked conversion round-trip, accepted value invariant와 rejection no-silent-loss를 many generated values에서 검증합니다.",
      ],
      concepts: [
        { term: "diagnostic normalization", definition: "compiler/runtime raw message를 stable category·position·reason으로 바꿔 test/교육에 사용하는 방식입니다.", detail: ["locale drift를 줄입니다.", "raw details도 보존할 수 있습니다."] },
        { term: "bytecode evidence", definition: "javap로 source operation이 어떤 JVM conversions/invocations로 compile됐는지 확인한 근거입니다.", detail: ["JLS를 보완합니다.", "performance 결론은 아닙니다."] },
        { term: "no-silent-loss property", definition: "target invariant 밖 value가 wrapped/truncated success로 반환되지 않고 explicit rejection이 되는 성질입니다.", detail: ["checked helper에 중요합니다.", "generated tests로 넓힙니다."] },
      ],
      codeExamples: [
        {
          id: "java-conversion-bytecode-diagnostic",
          title: "variable division bytecode와 lossy conversion 진단을 locale-independent하게 정규화합니다",
          language: "powershell",
          filename: "verify-conversion-evidence.ps1",
          purpose: "상수 folding과 실제 idiv/i2d/ddiv 순서를 구분하고 compile failure를 stable diagnostic category로 보존합니다.",
          code: String.raw`$tempBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $tempBase ("java03-" + [Guid]::NewGuid().ToString("N"))
$src = Join-Path $root "src"
$out = Join-Path $root "classes"

New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
New-Item -ItemType Directory -Path $src, $out -ErrorAction Stop | Out-Null
try {
  @'
package learning.java03;
public class ConversionProbe {
    static double late(int left, int right) { return left / right; }
    static double early(int left, int right) { return (double) left / right; }
    public static void main(String[] args) {
        System.out.println("late=" + late(2, 5));
        System.out.println("early=" + early(2, 5));
    }
}
'@ | Set-Content -Encoding utf8 (Join-Path $src "ConversionProbe.java")

  @'
class BadConversion {
    byte sum(byte left, byte right) { return left + right; }
}
'@ | Set-Content -Encoding utf8 (Join-Path $src "BadConversion.java")

  javac -encoding UTF-8 -Xlint:all -g:none -d $out (Join-Path $src "ConversionProbe.java")
  if ($LASTEXITCODE -ne 0) { throw "good fixture compile failed" }
  java -cp $out learning.java03.ConversionProbe

  $dump = (javap -classpath $out -c learning.java03.ConversionProbe) -join [Environment]::NewLine
  $late = [regex]::Match($dump, 'static double late\(int, int\);(?<body>.*?)static double early', 'Singleline').Groups['body'].Value
  $early = [regex]::Match($dump, 'static double early\(int, int\);(?<body>.*?)public static void main', 'Singleline').Groups['body'].Value
  function Ops([string] $block) {
    ([regex]::Matches($block, '\b(idiv|i2d|ddiv)\b') | ForEach-Object { $_.Value }) -join ">"
  }
  "late-bytecode=$(Ops $late)"
  "early-bytecode=$(Ops $early)"

  $bad = javac -XDrawDiagnostics -d $out (Join-Path $src "BadConversion.java") 2>&1
  $badExit = $LASTEXITCODE
  $badText = $bad -join [Environment]::NewLine
  "bad-exit=$badExit"
  "bad-category=$([bool]($badText -match 'compiler\.err\.prob\.found\.req'))"
  "bad-detail=$([bool]($badText -match 'compiler\.misc\.possible\.loss\.of\.precision: int, byte'))"
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  $parent = [IO.Path]::GetDirectoryName($resolved)
  if (-not [string]::Equals($parent, $tempBase, [StringComparison]::OrdinalIgnoreCase)) {
    throw "unsafe cleanup boundary"
  }
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}`,
          walkthrough: [
            { lines: "1-8", explanation: "OS temp 바로 아래에 GUID create-new directory를 만들고 source/class paths를 그 안으로 한정합니다." },
            { lines: "10-29", explanation: "constant가 아닌 parameters로 late/early division과 intentionally invalid byte sum을 분리합니다." },
            { lines: "31-43", explanation: "runtime value를 먼저 확인한 뒤 javap method blocks에서 conversion/division opcodes만 순서대로 추출합니다." },
            { lines: "45-51", explanation: "-XDrawDiagnostics의 top-level과 lossy-conversion detail category, nonzero exit를 모두 검증합니다." },
            { lines: "52-60", explanation: "cleanup 직전에 resolved path의 parent가 temp base인지 재검증하고 생성한 GUID directory만 제거합니다." },
          ],
          run: { environment: ["PowerShell 7+", "JDK 21+"], command: "pwsh -NoProfile -File verify-conversion-evidence.ps1" },
          output: { value: "late=0.0\nearly=0.4\nlate-bytecode=idiv>i2d\nearly-bytecode=i2d>i2d>ddiv\nbad-exit=1\nbad-category=True\nbad-detail=True", explanation: ["variable operands라 compiler가 division을 constant로 접지 않습니다.", "late widening과 early promotion의 opcode 순서가 다릅니다.", "lossy byte sum은 stable top-level/detail compiler categories로 실패합니다."] },
          experiments: [
            { change: "late(2,5)를 source literal expression 2/5로 바꿉니다.", prediction: "javac가 iconst_0/dconst_0처럼 fold해 idiv가 사라질 수 있습니다.", result: "source semantics와 lowering evidence를 구분합니다." },
            { change: "BadConversion return에 `(byte)` cast를 추가합니다.", prediction: "compile은 성공하지만 wrap 가능성이 생깁니다.", result: "compile success가 no-silent-loss를 보장하지 않습니다." },
            { change: "-XDrawDiagnostics를 제거합니다.", prediction: "message가 JDK locale/version에 따라 달라질 수 있습니다.", result: "자동화는 category/exit/source position을 우선합니다." },
          ],
          sourceRefs: ["jdk21-javac", "jls-expression-order", "jls-division", "jls-widening", "jls-assignment", "jls-promotions", "jls-narrowing"],
        },
      ],
      diagnostics: [
        { symptom: "compiler error에 cast를 추가했더니 tests는 통과하지만 production data가 훼손된다.", likelyCause: "compile eligibility만 해결하고 source range/precision invariant를 증명하지 않았습니다.", checks: ["cast 전후 value와 boundary를 비교합니다.", "compiler가 경고한 conversion graph를 읽습니다.", "checked/exact alternative를 평가합니다."], fix: "wider representation 또는 validated checked conversion으로 바꾸고 rejection path를 test합니다.", prevention: "lossy cast review checklist와 no-silent-loss property tests를 둡니다." },
      ],
      expertNotes: [
        "String concat optimization은 JEP 280 이후 compiler strategy가 바뀔 수 있으므로 invokedynamic 여부를 correctness contract로 두지 않고 source observable behavior만 고정합니다.",
        "Unicode normalization·case-folding·confusables와 numeric parsing은 security boundary가 될 수 있어 locale/script/length/resource limits를 threat model에 포함합니다.",
      ],
    },
  ],
  lab: {
    title: "정산 행의 String 입력을 lossless domain values로 변환합니다",
    scenario: "productName·quantity·unitPrice·discountRate가 String으로 들어오는 import 한 행을 검증하고, 정확한 total과 safe summary를 만드는 converter를 작성합니다.",
    setup: [
      "four original mains와 eight exact examples를 JDK 21 clean output에서 먼저 실행합니다.",
      "Accepted 또는 Rejected(field,reason) result type을 만들고 raw sensitive input을 error에 넣지 않습니다.",
      "productName null/blank/normalization, quantity ASCII decimal/range, price/discount decimal scale/rounding policy를 정의합니다.",
      "min/max±1·whitespace·fullwidth digits·NaN/Infinity·composed/decomposed name·rounding tie fixtures를 준비합니다.",
    ],
    steps: [
      "원본 outputs와 conversion trace를 작성하고 잘못된 straight size table·2/5·ASCII 주석을 교정합니다.",
      "String identity/content/pool/immutability example을 실행하고 equals/Objects.equals policy를 고정합니다.",
      "productName의 NFC/length/grapheme policy를 domain별로 선택하고 original display value 보존 여부를 정합니다.",
      "summary concatenation 전에 numeric total을 named variable로 계산해 204-style bug를 제거합니다.",
      "quantity는 ASCII syntax와 range를 검사한 뒤 parseInt하고 overflow/syntax/missing error를 분리합니다.",
      "unitPrice·discountRate는 BigDecimal(String)으로 parse하고 allowed scale/range를 검증합니다.",
      "quantity×price와 discount 계산에 explicit scale/MathContext/RoundingMode를 적용합니다.",
      "primitive narrow가 필요하면 finite·integral·range 또는 exactValue helper를 사용합니다.",
      "2/5·30-day multiplication·int→float boundary와 NaN/Infinity casts를 regression fixtures로 둡니다.",
      "String normalization/formatting·numeric parsing/calculation·output rendering을 separate pure functions로 만듭니다.",
      "compiler-fail and javap probes로 promotion/cast/concat lowering evidence를 확인합니다.",
      "property tests로 accepted round-trip·no-silent-loss·stable error categories를 검증합니다.",
    ],
    expectedResult: [
      "String content comparison이 identity/pool에 의존하지 않고 null·normalization policy를 지킵니다.",
      "numeric addition과 concatenation이 분리되어 summary가 exact total을 출력합니다.",
      "widening/narrowing·cast timing·intermediate overflow에서 silent precision/value loss가 없습니다.",
      "quantity parsing은 whitespace/radix/Unicode digit/range policy에 맞는 deterministic error를 냅니다.",
      "NaN·Infinity·fraction·out-of-range values가 primitive cast로 정상화되지 않고 거부됩니다.",
      "money total·discount·rounding과 BigDecimal equality/key behavior가 documented contract와 일치합니다.",
      "telemetry에는 field·reason·bounds만 있고 raw name/price/secret이 없습니다.",
    ],
    cleanup: ["temporary compiler fixtures·class/javap output을 verified build directory에서만 제거하고 four originals를 변경하지 않습니다.", "logs·goldens에 실제 customer names/amounts 대신 synthetic boundary fixtures만 둡니다."],
    extensions: [
      "CSV/JSON import adapter와 database DECIMAL integration에 같은 converter contract를 적용합니다.",
      "BigInteger exact quantity와 batch total resource limits를 추가합니다.",
      "ICU4J normalization/grapheme/confusable 정책을 multilingual identifier fixture로 비교합니다.",
      "JMH로 loop concat/StringBuilder와 primitive/BigDecimal workload를 측정하되 correctness tests를 먼저 유지합니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "네 원본의 모든 expression을 type·promotion·operation·conversion·output 표로 추적하고 8개 exact examples를 재현하세요.", requirements: ["four original summaries와 blank line을 보존합니다.", "String identity/content/immutability를 설명합니다.", "204/24와 cast placement results를 재현합니다.", "promotion/narrowing/parsing/checked/decimal outputs를 맞춥니다.", "source comments의 three 핵심 오류를 교정합니다."], hints: ["destination type을 마지막에 보세요.", "cast는 operation 전후 위치가 다릅니다."], expectedOutcome: "String과 numeric conversion 결과를 slogan 없이 단계별로 예측합니다.", solutionOutline: ["expression tree를 왼쪽부터 작성합니다.", "JLS rule과 javap opcode를 evidence로 연결합니다."] },
    { difficulty: "응용", prompt: "strictInt·parseAsciiInt·checked duration·exact decimal helpers를 구현하세요.", requirements: ["finite/fraction/range를 분리합니다.", "min/max±1·NaN/Infinity tests를 둡니다.", "ASCII-only/whitespace/fullwidth policies를 test합니다.", "Math exact로 intermediate overflow를 막습니다.", "BigDecimal scale/rounding/equals 정책을 검증합니다."], hints: ["loss 전에 검증하세요.", "raw input을 exception message에 넣지 마세요."], expectedOutcome: "silent wrap/truncation/parse drift 없이 stable accepted/rejected result가 나옵니다.", solutionOutline: ["각 conversion을 pure result-returning helper로 만듭니다.", "boundary table을 parameterized test로 실행합니다."] },
    { difficulty: "설계", prompt: "다국어 정산 import의 String→domain migration architecture를 설계하세요.", requirements: ["normalization/case/grapheme/identity policy를 구분합니다.", "quantity·money·rate representation과 exact conversion을 정합니다.", "rounding·overflow·syntax/range error taxonomy를 정의합니다.", "database/wire round-trip과 key equality를 포함합니다.", "canary migration·telemetry·rollback과 property tests를 설계합니다."], hints: ["parse 성공은 domain 성공이 아닙니다.", "BigDecimal equals와 compareTo 차이를 storage key까지 추적하세요."], expectedOutcome: "문자·숫자 손실 없이 운영 가능한 typed import boundary가 완성됩니다.", solutionOutline: ["raw→normalized text→validated domain→calculation→serialization 단계로 나눕니다.", "legacy behavior와 new strict behavior를 contract fixtures로 비교합니다."] },
  ],
  reviewQuestions: [
    { question: "String은 primitive인가요?", answer: "아닙니다. immutable character sequence를 나타내는 class/reference type입니다." },
    { question: "String이 immutable이면 variable 재대입도 불가능한가요?", answer: "아닙니다. object value는 안 바뀌지만 non-final variable은 다른 reference를 저장할 수 있습니다." },
    { question: "모든 String method가 새 object를 만드나요?", answer: "아닙니다. value는 불변이지만 concat empty처럼 same instance를 반환할 수 있습니다." },
    { question: "String content는 ==로 비교하나요?", answer: "아닙니다. ==는 identity이고 content는 equals, null-safe면 Objects.equals를 사용합니다." },
    { question: "literal pool 때문에 ==가 true면 계속 사용해도 되나요?", answer: "아닙니다. construction path에 따라 달라 correctness는 equals에 둡니다." },
    { question: "visually 같은 é는 always equals인가요?", answer: "아닙니다. composed/decomposed UTF-16 sequences가 다를 수 있어 domain normalization policy가 필요합니다." },
    { question: "`\"결과 : \" + 20 + 4`가 왜 204인가요?", answer: "left-associative 첫 concatenation이 String을 만들고 다음 4도 text로 연결되기 때문입니다." },
    { question: "`1 + 2 + \"x\"`와 `\"x\" + 1 + 2`는 같은가요?", answer: "아닙니다. 전자는 numeric 3 뒤 x, 후자는 x 뒤 1과 2가 각각 연결됩니다." },
    { question: "short와 char는 크기가 같으니 서로 widening되나요?", answer: "아닙니다. signed/unsigned ranges가 달라 direct widening conversion이 없습니다." },
    { question: "byte+byte result는 byte인가요?", answer: "아닙니다. binary numeric promotion으로 int입니다." },
    { question: "char c=66은 되는데 int n=66; char c=n은 왜 안 되나요?", answer: "전자는 in-range compile-time constant assignment 특례이고 후자는 runtime variable narrowing이기 때문입니다." },
    { question: "double d=2/5는 왜 0.0인가요?", answer: "assignment 전에 int division이 0을 만들고 그 결과가 double로 widening되기 때문입니다." },
    { question: "(double)(2/5)는 0.4인가요?", answer: "아닙니다. parentheses 안 int division 뒤 cast라 0.0이고 (double)2/5가 0.4입니다." },
    { question: "widening conversion은 항상 exact인가요?", answer: "아닙니다. int→float, long→float/double은 precision을 잃을 수 있습니다." },
    { question: "(byte)130은 range error를 내나요?", answer: "아닙니다. low bits를 남겨 -126이 되므로 cast 전 range check가 필요합니다." },
    { question: "(int)NaN과 Infinity는 exception인가요?", answer: "아닙니다. NaN은 0, infinities는 int endpoints가 되어 strict validation이 필요합니다." },
    { question: "String을 int로 cast할 수 있나요?", answer: "아닙니다. parseInt로 syntax/range를 해석해야 합니다." },
    { question: "parseInt는 surrounding spaces를 자동 무시하나요?", answer: "아닙니다. normalization을 명시하거나 reject합니다." },
    { question: "parseInt가 fullwidth digits를 받을 수 있나요?", answer: "가능하므로 ASCII-only protocol이면 별도 allowlist가 필요합니다." },
    { question: "BigDecimal equals와 compareTo는 같은 equality인가요?", answer: "아닙니다. equals는 scale 포함 representation, compareTo는 numeric comparison입니다." },
    { question: "new BigDecimal(0.1)은 정확한 0.1인가요?", answer: "binary double approximation의 exact decimal이며 decimal text intent에는 String constructor를 사용합니다." },
  ],
  completionChecklist: [
    "inventory의 Ex03·Ex04·Ex05·Ex07 네 source를 직접 읽고 사용했다.",
    "네 mains를 JDK 21.0.11로 UTF-8·Xlint clean compile/run하고 exact stdout/blank line을 검증했다.",
    "String reference·null·immutability·variable reassignment를 구분했다.",
    "literal/folded/runtime/new String identity와 equals/intern을 실행했다.",
    "String transformation return과 concat empty same-instance caveat를 검증했다.",
    "UTF-16 length·code point·NFC normalization과 domain별 정책을 설명했다.",
    "+ numeric/concat overload·left association·left-to-right evaluation을 추적했다.",
    "원본 204 bug를 parentheses/named numeric result로 교정했다.",
    "constant folding과 invokedynamic StringConcatFactory를 correctness와 분리했다.",
    "widening/narrowing/assignment/string conversion·numeric promotion graph를 작성했다.",
    "short↔char no-widening, byte/char arithmetic int promotion을 검증했다.",
    "constant assignment와 runtime int→char cast 차이를 설명했다.",
    "2/5 cast placement와 30-day intermediate overflow를 exact output으로 재현했다.",
    "int→float precision loss와 float→double original decimal loss를 구분했다.",
    "integer low-bit narrowing과 floating toward-zero/NaN/Infinity endpoint rules를 검증했다.",
    "floating→byte/char two-step narrowing을 설명했다.",
    "String parse syntax·radix·whitespace·range·Unicode digit policy를 실행했다.",
    "Double parse 뒤 finite/domain validation을 적용했다.",
    "Math exact·toIntExact와 strict double→int helper를 구현했다.",
    "BigInteger/BigDecimal 생성·scale·rounding·equals/compareTo·exactValue 정책을 적용했다.",
    "대표 byte-sum compile-fail·javap·boundary tests를 실행했고 나머지 conversion failures와 no-silent-loss property-test invariants, privacy-safe errors를 설계했다.",
  ],
  nextSessions: [],
  sources: [
    { id: "java-string-concat-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day02/Ex03.java", usedFor: ["String reference introduction", "numeric versus string +", "left-associative concatenation", "parenthesized sum", "constant/runtime concat"], evidence: "JDK 21에서 Hello·100010·10510·10105·결과 : 204/24를 재현하고 constant/runtime lowering을 조사했습니다." },
    { id: "java-widening-division-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day02/Ex04.java", usedFor: ["int widening", "char numeric value", "Hangul UTF-16 units", "integer division", "cast placement", "mixed floating division"], evidence: "100 widening, a/가/나 codes, 2/5→0/0.0과 2/5.0→0.4를 실행했습니다. 원본 상수식은 compiler가 folded했고 i2l/i2f/l2d conversions를 확인했으며, idiv→i2d와 i2d→ddiv 순서는 별도 variable operand probe로 검증합니다." },
    { id: "java-narrowing-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day02/Ex05.java", usedFor: ["double to int", "toward-zero", "int to char", "narrowing cast"], evidence: "35.475→35와 65→A를 재현하고 NaN/Infinity/low-bit checked conversion으로 확장했습니다." },
    { id: "java-char-cast-source", repository: "javastudy 학습 원본", path: "MyJavaProject/src/com/ictedu/day02/Ex07.java", usedFor: ["char/int conversion", "constant assignment", "explicit cast", "ASCII subset versus UTF-16"], evidence: "A/65/B/67/C를 재현하고 literal 66 assignment와 runtime variable cast 차이를 교정했습니다." },
    { id: "jdk21-javac", repository: "Oracle Java SE 21 Tool Specifications", path: "javac command", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["clean compile", "Xlint", "diagnostics", "bytecode fixtures"], evidence: "원본/custom/compile-fail examples의 reproducible tool 기준입니다." },
    { id: "jls-string-literals", repository: "Oracle Java Language Specification 21", path: "3.10.5 String Literals", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-3.html#jls-3.10.5", usedFor: ["String literals", "interning", "constant pool", "Unicode sequence"], evidence: "literal/folded/runtime identity와 intern 설명의 language 기준입니다." },
    { id: "jls-constant-expression", repository: "Oracle Java Language Specification 21", path: "15.29 Constant Expressions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.29", usedFor: ["String constant expressions", "compile-time folding", "interned result", "final constant variables"], evidence: "literal concatenation과 constant-variable concatenation의 guaranteed identity boundary를 고정합니다." },
    { id: "java-string-api", repository: "Oracle Java SE 21 API", path: "java.lang.String", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html", usedFor: ["immutability", "equals", "concat", "length", "code points", "blank/strip"], evidence: "String object/content API와 same-instance caveat의 공식 기준입니다." },
    { id: "java-objects-api", repository: "Oracle Java SE 21 API", path: "java.util.Objects.equals", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html#equals(java.lang.Object,java.lang.Object)", usedFor: ["null-safe content equality", "nullable comparison policy"], evidence: "nullable String content comparison을 receiver call과 분리하는 기준입니다." },
    { id: "java-normalizer-api", repository: "Oracle Java SE 21 API", path: "java.text.Normalizer", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/text/Normalizer.html", usedFor: ["NFC", "canonical equivalence", "Unicode normalization boundary"], evidence: "composed/decomposed e-acute fixture와 domain-specific normalization 설명의 기준입니다." },
    { id: "jls-expression-order", repository: "Oracle Java Language Specification 21", path: "15.7 Evaluation Order", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.7", usedFor: ["left-to-right operands", "side effects", "abrupt completion", "evaluation trace"], evidence: "concat/postfix order를 precedence와 분리하는 기준입니다." },
    { id: "jls-string-concat", repository: "Oracle Java Language Specification 21", path: "15.18.1 String Concatenation Operator +", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.18.1", usedFor: ["numeric versus concat +", "string conversion", "left association", "null text"], evidence: "원본 204/24 output의 정확한 expression rule입니다." },
    { id: "jls-division", repository: "Oracle Java Language Specification 21", path: "15.17.2 Division Operator /", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.17.2", usedFor: ["integer versus floating division", "truncation toward zero", "variable operand bytecode probe"], evidence: "late 2/5와 early double promotion의 source-level division semantics를 고정합니다." },
    { id: "jls-widening", repository: "Oracle Java Language Specification 21", path: "5.1.2 Widening Primitive Conversion", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.2", usedFor: ["conversion graph", "exact/approximate widening", "short/char distinction"], evidence: "직선 크기표를 actual allowed edges와 precision caveats로 교정했습니다." },
    { id: "jls-narrowing", repository: "Oracle Java Language Specification 21", path: "5.1.3 Narrowing Primitive Conversion", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.3", usedFor: ["low bits", "toward-zero", "NaN", "infinity endpoints", "two-step narrowing"], evidence: "NarrowingBoundary와 strict conversion의 핵심 규칙입니다." },
    { id: "jls-assignment", repository: "Oracle Java Language Specification 21", path: "5.2 Assignment Contexts", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.2", usedFor: ["constant assignment narrowing", "byte arithmetic compile failure", "assignment conversion"], evidence: "char c=66 특례와 runtime int variable·promoted byte sum의 compile boundary를 설명합니다." },
    { id: "jls-promotions", repository: "Oracle Java Language Specification 21", path: "5.6 Numeric Contexts", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.6", usedFor: ["byte/short/char to int", "binary promotion", "operation type"], evidence: "작은 type 산술과 mixed numeric operation을 교정했습니다." },
    { id: "jls-primitive-overflow", repository: "Oracle Java Language Specification 21", path: "4.2 Primitive Types and Values", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.2", usedFor: ["integer ranges", "overflow", "floating values", "char UTF-16"], evidence: "promotion/cast boundary와 exact helper를 primitive value sets에 연결했습니다." },
    { id: "java-integer-api", repository: "Oracle Java SE 21 API", path: "Integer.parseInt", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html#parseInt(java.lang.String)", usedFor: ["decimal/radix parse", "syntax", "range", "NumberFormatException", "Unicode digits"], evidence: "ParsingPolicy exact example와 external text policy의 기준입니다." },
    { id: "java-double-api", repository: "Oracle Java SE 21 API", path: "java.lang.Double", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Double.html", usedFor: ["parse special values", "isFinite/isNaN", "toString", "precision"], evidence: "strict double conversion과 parser finite policy를 보강했습니다." },
    { id: "java-math-api", repository: "Oracle Java SE 21 API", path: "java.lang.Math exact methods", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html#toIntExact(long)", usedFor: ["add/multiply exact", "toIntExact", "rint", "checked conversion"], evidence: "silent primitive operations을 explicit failure로 바꾸는 기준입니다." },
    { id: "java-biginteger-api", repository: "Oracle Java SE 21 API", path: "java.math.BigInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigInteger.html", usedFor: ["arbitrary precision integer", "intValueExact", "primitive range rejection", "resource limits"], evidence: "2147483648 보존과 checked primitive narrowing example의 공식 기준입니다." },
    { id: "java-bigdecimal-api", repository: "Oracle Java SE 21 API", path: "java.math.BigDecimal", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html", usedFor: ["String/double/valueOf", "scale", "rounding", "divide", "equals/compareTo", "exact conversions"], evidence: "ExactDecimal과 money conversion policy의 공식 기준입니다." },
    { id: "openjdk-string-concat", repository: "OpenJDK", path: "JEP 280 Indify String Concatenation", publicUrl: "https://openjdk.org/jeps/280", usedFor: ["invokedynamic", "StringConcatFactory", "compiler strategy", "performance caveat"], evidence: "JDK 9+ runtime concat lowering을 source semantics와 분리해 설명했습니다." },
  ],
  sourceCoverage: {
    filesRead: 4,
    filesUsed: 4,
    uncoveredNotes: [
      "inventory의 네 Java 원본을 모두 JDK 21.0.11로 -encoding UTF-8 -Xlint:all clean compile하고 four main outputs·blank line을 직접 검증했습니다.",
      "Ex03은 String reference와 +만 실행하므로 immutability·pool·equals·null-safe comparison·Unicode normalization을 JLS/API와 deterministic examples로 보완했습니다.",
      "Ex04의 일렬 크기표, 큰 type 우선 설명, 2/5 저장 설명과 '나' code 주석 오기를 actual conversion graph·promotion·evaluation 단계로 교정했습니다.",
      "Ex05의 정상 범위 double→int/int→char만으로 부족해 overflow·truncation·NaN·Infinity·two-step byte/char narrowing과 strict checked conversion을 보완했습니다.",
      "Ex07의 A/B/C는 ASCII subset이며 Java char 일반 계약은 UTF-16 code unit입니다. literal constant assignment와 runtime int cast 차이를 추가했습니다.",
      "String parsing·exact arithmetic·BigInteger/BigDecimal scale/rounding·compile-fail/bytecode/property tests는 원본 밖 production 보강입니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
