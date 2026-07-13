import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["oop-04-overload-constructor-this"],
  slug: "oop-04-overload-constructor-this",
  courseId: "java",
  moduleId: "java-oop-design",
  order: 14,
  title: "오버로딩·생성자·this와 안전한 객체 구성",
  subtitle: "compile-time overload 선택과 constructor chain·초기화 순서를 추적하고, 완성 전 this 노출 없이 유효한 객체만 공개합니다.",
  level: "중급",
  estimatedMinutes: 640,
  coreQuestion: "같은 이름의 호출이 어느 선언을 선택하는지 예측하고, 생성자 체인과 초기화 순서 전체에서 불변식이 완성된 객체만 안전하게 공개하려면 어떻게 설계할까요?",
  summary: "javastudy2 class03 전체 17개와 이 세션 범위 Ex07·08·11~17 아홉 파일을 OpenJDK 21.0.11 -Xlint:all로 별도 clean compile했습니다. 범위에는 main 네 개와 compile-only 다섯 개가 있습니다. Ex08 마지막 add(100.0,75)는 varargs가 아니라 고정 arity add(double,double)가 phase1에서 선택되어 175.0을 출력하고, Ex07의 varargs overload는 원본 main에서 호출되지 않습니다. Ex13의 주석은 compiler가 default constructor를 만들었다고 하지만 Ex12는 no-arg와 3-arg constructors를 명시적으로 선언했으므로 그 no-arg는 default constructor가 아닙니다. Ex11의 ‘constructor는 반환형 없는 method’라는 비유도 constructor declaration은 method declaration과 다른 문법 요소라는 JLS 모델로 교정합니다. 이어 overload signature와 3단계 applicability, widening·boxing·varargs·null ambiguity, compile-time overload와 runtime override, default constructor의 정확한 조건, this() delegation과 초기화 순서, this receiver·shadowing, validated factory와 immutable construction, this escape·constructor dynamic dispatch, positive/negative compiler contract suite까지 확장합니다. 원본의 이름·주소·상품 문자열과 identity hash는 presence 또는 Ex16_ThisDemo@<id>로만 검증합니다.",
  objectives: [
    "method signature와 overload 가능 조건을 return type·parameter name과 구분할 수 있다.",
    "strict·loose·variable-arity 세 applicability phases와 most-specific 선택을 실제 호출에 적용할 수 있다.",
    "primitive widening·boxing/unboxing·varargs·null이 결합될 때 선택·모호성·compile failure를 예측할 수 있다.",
    "overload는 compile-time 선언 type으로, override implementation은 runtime receiver type으로 결정됨을 한 호출 trace에서 설명할 수 있다.",
    "constructor declaration과 method를 구분하고 implicit default constructor가 생기는 정확한 조건과 accessibility/super 호출을 설명할 수 있다.",
    "constructor overload를 this()로 canonical constructor에 위임하고 recursive/비선두 호출이 거부되는 이유를 설명할 수 있다.",
    "allocation default values부터 superclass·field initializer·instance initializer·constructor body 순서를 예측할 수 있다.",
    "this receiver·field shadowing·factory validation·immutable snapshot·final field와 this escape 위험을 계약 테스트로 검증할 수 있다.",
  ],
  prerequisites: [{ title: "접근 제한자·캡슐화·getter/setter", reason: "생성자는 private fields의 최초 invariant를 만들고 overload된 공개 API는 캡슐화 경계를 넓히므로 access·validation·defensive copy 계약이 필요합니다.", sessionSlug: "oop-03-encapsulation" }],
  keywords: ["overload", "signature", "applicability", "most specific", "widening", "boxing", "unboxing", "varargs", "null ambiguity", "override", "constructor", "default constructor", "this()", "constructor delegation", "initialization order", "this receiver", "shadowing", "static factory", "immutable", "final field", "this escape", "safe publication"],
  chapters: [
    {
      id: "nine-source-golden-audit",
      title: "class03 전체 17개와 OOP04 범위 아홉 원본을 분리 compile하고 네 main을 정규화합니다",
      lead: "개인 문자열은 출력하지 않고 presence만, 객체 identity는 type@<id>만 남깁니다.",
      explanations: [
        "Ex07은 add(), add(int), add(int,int), add(double,double), add(double,int...) 다섯 active overloads를 가집니다. 주석 처리된 add(double,int)도 signature가 달라 선언 가능하지만 현재 build에는 없습니다.",
        "Ex08은 다섯 호출에서 150, 200, 350, 320.45, 175.0을 출력합니다. 마지막 int 75는 double로 widening되어 fixed-arity add(double,double)가 variable-arity phase보다 먼저 선택됩니다.",
        "Ex11은 constructor 설명만 있는 compile-only class이며 source에 constructor declaration과 main이 없습니다. ‘특수한 method’, ‘반환형 없는 method’라는 주석은 constructor가 method declaration과 별개라는 점에서 정확한 정의가 아닙니다.",
        "Ex12는 field initializers 뒤 명시 no-arg와 3-arg constructors를 선언하고 Ex13은 두 no-arg objects와 한 3-arg object를 출력합니다. 따라서 Ex13의 ‘생성자를 만들지 않아 compiler가 기본 생성자를 제공’했다는 주석은 실제 source와 모순됩니다.",
        "Ex14는 no-arg, String, int, String+int 네 constructors를 선언합니다. String-only는 price0, int-only는 name empty라는 부분 초기 상태를 허용하지만 Ex15는 no-arg와 String+int 두 경로만 실행합니다.",
        "Ex16은 네 constructor overloads와 this shadow disambiguation을 보여 줍니다. String constructor는 this(2500)로 int constructor에 위임하며 Ex17 source는 constructor 내부 this와 main의 demo가 같은 reference를 출력합니다. audit의 같은 Type@hex text는 이를 보조하는 rendering evidence일 뿐 identity proof로 일반화하지 않고, 뒤 lab에서 ==로 직접 확인합니다.",
      ],
      concepts: [
        { term: "package audit", definition: "연결된 원본 package 전체가 함께 compile되는지 확인해 범위 밖 dependency·중복 선언 문제까지 보는 검증입니다.", detail: ["class03 17 files를 compile합니다.", "session scope 9 files도 별도 compile합니다."] },
        { term: "scoped audit", definition: "이 세션이 책임지는 source만 별도 output directory에 compile하고 mains/compile-only 수를 확인하는 검증입니다.", detail: ["sourceCoverage 9/9와 연결됩니다.", "원본 progression을 좁혀 봅니다."] },
        { term: "normalized identity rendering", definition: "비결정적 Object.toString hash suffix를 <id>로 치환하고 두 rendered tokens의 일치만 기록하는 증거입니다.", detail: ["golden flakiness를 막습니다.", "실제 reference identity는 source flow와 == fixture로 따로 확인합니다."] },
      ],
      codeExamples: [{
        id: "java-original-oop04-audit",
        title: "공백이 있는 GUID temp에서 all17/scoped9를 compile하고 네 main을 privacy-safe summary로 만듭니다",
        language: "powershell",
        filename: "verify-original-oop04.ps1",
        purpose: "실제 원본의 overload 선택·constructor outputs·same identity를 개인정보와 hash 노출 없이 재현합니다.",
        code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("oop04 audit " + [Guid]::NewGuid().ToString("N"))
if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
try {
  $source = "src\com\java\class03"
  $all = @(Get-ChildItem -LiteralPath $source -Filter "*.java" | Sort-Object Name | ForEach-Object FullName)
  $scopeNames = @("Ex07_MethodDemo.java", "Ex08_MethodMain.java", "Ex11_Constructor.java",
    "Ex12_ConstructorDemo.java", "Ex13_ConstructorMain.java", "Ex14_ConstructorDemo.java",
    "Ex15_ConstructorMain.java", "Ex16_ThisDemo.java", "Ex17_ThisMain.java")
  $scoped = @($scopeNames | ForEach-Object { Join-Path $source $_ })
  $allOut = Join-Path $root "all classes"
  $scopeOut = Join-Path $root "scope classes"
  New-Item -ItemType Directory -Path $allOut, $scopeOut -ErrorAction Stop | Out-Null
  $allCompiler = @(& javac -encoding UTF-8 -Xlint:all -d $allOut $all 2>&1)
  if ($LASTEXITCODE -ne 0 -or $allCompiler.Count -ne 0) { throw "all compile failed or warned" }
  $scopeCompiler = @(& javac -encoding UTF-8 -Xlint:all -d $scopeOut $scoped 2>&1)
  if ($LASTEXITCODE -ne 0 -or $scopeCompiler.Count -ne 0) { throw "scope compile failed or warned" }

  $out08 = @(& java -cp $scopeOut com.java.class03.Ex08_MethodMain); if ($LASTEXITCODE -ne 0) { throw "Ex08 failed" }
  $out13 = @(& java -cp $scopeOut com.java.class03.Ex13_ConstructorMain); if ($LASTEXITCODE -ne 0) { throw "Ex13 failed" }
  $out15 = @(& java -cp $scopeOut com.java.class03.Ex15_ConstructorMain); if ($LASTEXITCODE -ne 0) { throw "Ex15 failed" }
  $out17 = @(& java -cp $scopeOut com.java.class03.Ex17_ThisMain); if ($LASTEXITCODE -ne 0) { throw "Ex17 failed" }
  $idPattern = "com\.java\.class03\.Ex16_ThisDemo@[0-9a-fA-F]+"
  $ids = @([regex]::Matches(($out17 -join [Environment]::NewLine), $idPattern) | ForEach-Object Value)
  $ex11Code = @(Get-Content -LiteralPath (Join-Path $source "Ex11_Constructor.java") |
    Where-Object { $_ -notmatch '^\s*//' }) -join [Environment]::NewLine
  $ex11Comments = Get-Content -Raw -LiteralPath (Join-Path $source "Ex11_Constructor.java")
  $ex11Main = $ex11Code -match 'static\s+void\s+main'
  $ex11Constructors = [regex]::Matches($ex11Code, 'Ex11_Constructor\s*\(').Count
  $commentSpecial = $ex11Comments.Contains('특수한 메서드')
  $commentReturnless = $ex11Comments.Contains('반환형이 없는 메서드')
  $commentDefaultNoArg = $ex11Comments.Contains('기본생성자는 인자가 없는 생성자')
  $sameIdentity = $ids.Count -eq 2 -and $ids[0] -ceq $ids[1]

  "spacePath=$($root.Contains(' ')),packageCompiled=$($all.Count),scopedCompiled=$($scoped.Count),mains=4,compileOnly=5"
  "Ex08=lines:$($out08.Count),values:$($out08 -join '|')"
  "Ex11=mainPresent:$ex11Main,declaredConstructors:$ex11Constructors,commentSpecialMethod:$commentSpecial,commentReturnlessMethod:$commentReturnless,commentDefaultNoArg:$commentDefaultNoArg"
  "Ex13=lines:$($out13.Count),namesPresent:$(-not [string]::IsNullOrWhiteSpace($out13[0]))|$(-not [string]::IsNullOrWhiteSpace($out13[3]))|$(-not [string]::IsNullOrWhiteSpace($out13[6])),addressesPresent:$(-not [string]::IsNullOrWhiteSpace($out13[2]))|$(-not [string]::IsNullOrWhiteSpace($out13[5]))|$(-not [string]::IsNullOrWhiteSpace($out13[8])),ages:$($out13[1])|$($out13[4])|$($out13[7])"
  "Ex15=lines:$($out15.Count),productsPresent:$(-not [string]::IsNullOrWhiteSpace($out15[0]))|$(-not [string]::IsNullOrWhiteSpace($out15[2])),prices:$($out15[1])|$($out15[3])"
  "Ex17=lines:$($out17.Count),identities:$($ids.Count),normalized:$(@($ids | ForEach-Object { 'Ex16_ThisDemo@<id>' }) -join '|'),sameIdentity:$sameIdentity,productsPresent:$(-not [string]::IsNullOrWhiteSpace($out17[2]))|$(-not [string]::IsNullOrWhiteSpace($out17[4])),prices:$($out17[3])|$($out17[5])"
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop
  if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" }
}`,
        walkthrough: [
          { lines: "1-13", explanation: "공백이 포함된 system temp 직계 GUID root와 두 output directories를 만들어 path quoting도 함께 검증합니다." },
          { lines: "14-18", explanation: "class03 전체17과 범위9를 -Xlint:all로 별도 compile하고 compiler output이 하나라도 있으면 실패합니다." },
          { lines: "20-30", explanation: "네 mains를 native java classpath로 실행하고 Ex17 identity와 Ex11 active/comment text를 동적으로 분리합니다." },
          { lines: "32-37", explanation: "개인·주소·상품 text는 nonblank booleans만, identity는 normalized token과 equality만 출력합니다." },
          { lines: "38-42", explanation: "resolved target이 temp base의 직계 child인지 검증한 뒤 그 root만 제거합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11", "javastudy2/classstudy root"], command: "pwsh -NoProfile -File verify-original-oop04.ps1" },
        output: { value: "spacePath=True,packageCompiled=17,scopedCompiled=9,mains=4,compileOnly=5\nEx08=lines:5,values:150|200|350|320.45|175.0\nEx11=mainPresent:False,declaredConstructors:0,commentSpecialMethod:True,commentReturnlessMethod:True,commentDefaultNoArg:True\nEx13=lines:9,namesPresent:True|True|True,addressesPresent:True|True|True,ages:34|57|512\nEx15=lines:4,productsPresent:True|True,prices:1500|2500\nEx17=lines:6,identities:2,normalized:Ex16_ThisDemo@<id>|Ex16_ThisDemo@<id>,sameIdentity:True,productsPresent:True|True,prices:1500|2500", explanation: ["package와 scoped builds가 warnings 없이 성공하고 범위에는 main4·compile-only5가 있습니다.", "Ex08 마지막 175.0은 fixed double,double 선택의 동적 근거입니다.", "Ex13 text와 Ex15/17 product text는 공개하지 않고 presence만 보존합니다.", "Ex17의 두 rendered tokens는 일치하지만 Object.toString text 자체를 identity proof로 쓰지 않고 source flow와 뒤의 == lab으로 확인합니다."] },
        experiments: [
          { change: "Ex07의 commented add(double,int)를 활성화합니다.", prediction: "Ex08 마지막 호출은 새 exact fixed overload를 선택하지만 구현이 a+b이면 출력은 여전히 175.0입니다.", result: "같은 output만으로 selected declaration을 증명할 수 없어 각 overload marker test가 필요합니다." },
          { change: "Ex07의 add(double,double)를 제거합니다.", prediction: "마지막 호출은 add(double,int...)로 넘어가 원본 body상 200.0을 출력합니다.", result: "fixed arity phase가 varargs보다 먼저였음을 확인합니다." },
          { change: "Ex12의 명시 no-arg constructor를 제거하고 3-arg만 남깁니다.", prediction: "new Ex12_ConstructorDemo() 두 호출이 compile 실패하며 implicit default constructor는 생기지 않습니다.", result: "constructor declaration 하나라도 있으면 compiler default 조건이 사라집니다." },
        ],
        sourceRefs: ["java-class03-ex07", "java-class03-ex08", "java-class03-ex11", "java-class03-ex12", "java-class03-ex13", "java-class03-ex14", "java-class03-ex15", "java-class03-ex16", "java-class03-ex17", "jdk21-javac"],
      }],
      diagnostics: [
        { symptom: "Ex08 마지막 호출이 int varargs를 받으니 varargs overload라고 설명했다.", likelyCause: "applicable methods를 모두 본 뒤 phase 순서를 적용하지 않았습니다.", checks: ["fixed arity로 해석 가능한 후보를 먼저 적습니다.", "int→double widening이 strict invocation인지 확인합니다.", "각 overload가 다른 marker를 반환하는 test를 만듭니다."], fix: "phase1 fixed add(double,double)를 선택하고 varargs는 phase3까지 도달할 때만 고려한다고 교정합니다.", prevention: "overload 설명은 output 값뿐 아니라 selected signature assertion을 포함합니다." },
        { symptom: "Ex13의 no-arg를 compiler-generated default constructor라고 문서화했다.", likelyCause: "no-arg constructor와 default constructor를 동의어로 사용하고 Ex12 선언을 확인하지 않았습니다.", checks: ["class body의 모든 constructor declarations를 찾습니다.", "명시 no-arg인지 source line을 확인합니다.", "다른 constructor가 하나라도 있는지 봅니다."], fix: "Ex12의 no-arg는 명시 constructor라고 기록하고 implicit default는 constructor declaration이 전혀 없을 때만 생긴다고 설명합니다.", prevention: "source declaration·reflection shape·compiler synthesis를 별도 evidence로 둡니다." },
      ],
      expertNotes: ["같은 numeric output은 다른 overload body에서도 나올 수 있으므로 branch marker 또는 compile-time type test가 필요합니다.", "source 주석은 학습 progression의 일부지만 실제 선언·JLS와 모순되면 comment assertion으로 분리해 교정합니다."],
    },
    {
      id: "overload-signature-resolution-phases",
      title: "overload는 signature 후보를 모은 뒤 strict→loose→varargs phase에서 처음 성공한 집합을 선택합니다",
      lead: "‘가장 비슷해 보이는 타입’이 아니라 compiler가 적용하는 순서와 most-specific 규칙으로 판단합니다.",
      explanations: [
        "method signature는 method name과 type parameters/formal parameter types의 adaptation된 형태로 결정됩니다. return type, access modifier, static 여부, parameter 이름만 바꿔서는 새 overload가 되지 않습니다.",
        "호출 compiler는 먼저 이름·접근성·arity를 바탕으로 potentially applicable methods를 모은 뒤 phase1 strict invocation에서 fixed-arity 후보를 검사합니다. identity와 widening primitive/reference가 핵심입니다.",
        "phase1에 applicable method가 없을 때 phase2 loose invocation으로 넘어가 boxing/unboxing이 포함된 fixed-arity 후보를 검사합니다. 앞 phase 후보가 있으면 뒤 phase의 더 ‘모양이 가까워 보이는’ 후보는 비교 대상이 아닙니다.",
        "두 fixed phases가 모두 실패해야 phase3 variable arity를 적용해 trailing arguments를 배열로 포장합니다. Ex08의 int 75는 double로 widening 가능한 phase1 후보가 있어 int... phase에 도달하지 않습니다.",
        "한 phase 안에 여러 applicable candidates가 있으면 most-specific method를 고릅니다. 하나로 정할 수 없으면 compiler는 임의 선택하지 않고 ambiguous call로 거부합니다.",
        "호출을 읽을 때 argument runtime value가 아니라 compile-time types를 적어야 합니다. primitive literal, variable declared type, cast와 poly expression target이 overload 결과를 바꿉니다.",
      ],
      concepts: [
        { term: "overload", definition: "한 class/interface scope에서 같은 이름이지만 override-equivalent하지 않은 signatures를 가진 methods를 선언하는 기능입니다.", detail: ["return type만으로 구분하지 않습니다.", "호출 시 compile-time 선택됩니다."] },
        { term: "applicability phase", definition: "strict fixed arity, loose fixed arity, variable arity 순서로 invocation 가능한 후보를 찾는 단계입니다.", detail: ["처음 non-empty phase에서 멈춥니다.", "varargs는 마지막입니다."] },
        { term: "most specific", definition: "같은 phase의 applicable 후보 중 argument를 더 구체적으로 받을 수 있는 하나의 method를 고르는 규칙입니다.", detail: ["단순 거리 계산이 아닙니다.", "유일하지 않으면 ambiguity입니다."] },
      ],
      codeExamples: [{
        id: "java-overload-phase-order",
        title: "primitive widening이 boxing보다, fixed arity가 varargs보다 먼저 선택됨을 marker로 봅니다",
        language: "java",
        filename: "OverloadPhaseLab.java",
        purpose: "각 overload가 signature 이름을 반환하게 해 selected declaration을 output으로 직접 증명합니다.",
        code: String.raw`public class OverloadPhaseLab {
    static String select(long value) { return "long"; }
    static String select(Integer value) { return "Integer"; }
    static String select(int... values) { return "int...:" + values.length; }

    public static void main(String[] args) {
        int primitive = 7;
        Integer boxed = 7;
        short narrow = 7;
        System.out.println("primitive=" + select(primitive));
        System.out.println("boxed=" + select(boxed));
        System.out.println("narrow=" + select(narrow));
        System.out.println("empty=" + select());
        System.out.println("many=" + select(1, 2, 3));
    }
}`,
        walkthrough: [
          { lines: "2-4", explanation: "long fixed, Integer fixed, int varargs가 phase 경쟁을 만듭니다." },
          { lines: "7-12", explanation: "int/short는 phase1 widening long, Integer variable은 identity reference로 Integer를 선택합니다." },
          { lines: "13-14", explanation: "0개와 3개 arguments는 fixed candidates arity가 맞지 않아 phase3 varargs가 배열 길이를 반환합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("OverloadPhaseLab.java", "OverloadPhaseLab") },
        output: { value: "primitive=long\nboxed=Integer\nnarrow=long\nempty=int...:0\nmany=int...:3", explanation: ["int/short widening은 boxing이나 varargs보다 먼저입니다.", "이미 Integer인 argument는 Integer fixed overload에 identity conversion으로 맞습니다.", "fixed arity가 불가능할 때만 varargs 배열이 만들어집니다."] },
        experiments: [
          { change: "select(long)를 제거합니다.", prediction: "primitive int는 phase2에서 boxing되어 Integer를 선택합니다.", result: "앞 phase 후보 제거가 뒤 phase 선택을 엽니다." },
          { change: "select(int)를 추가합니다.", prediction: "primitive int는 identity로 int, short는 widening 가능한 int를 선택합니다.", result: "같은 phase most-specific 관계를 확인합니다." },
          { change: "select(Object)를 추가하고 boxed를 Object variable에 대입해 호출합니다.", prediction: "argument declared type이 Object라 select(Object)가 선택됩니다.", result: "runtime object class가 overload를 다시 선택하지 않습니다." },
        ],
        sourceRefs: ["java-class03-ex07", "java-class03-ex08", "jls-method-signature", "jls-overload-applicability", "jls-most-specific"],
      }],
      diagnostics: [
        { symptom: "int argument인데 Integer overload가 long보다 더 정확하다고 예상했다.", likelyCause: "primitive widening phase와 boxing phase 순서를 무시했습니다.", checks: ["phase1 identity/widening 후보를 먼저 표시합니다.", "boxing이 필요한 후보를 phase2로 미룹니다.", "selected marker를 출력합니다."], fix: "phase1 long이 존재하면 compiler가 거기서 멈춘다고 설명합니다.", prevention: "widening-vs-boxing fixture를 overload API review에 둡니다." },
        { symptom: "varargs가 모든 arity를 받으니 항상 후보라고 생각했다.", likelyCause: "potential applicability와 실제 phase selection을 혼동했습니다.", checks: ["fixed arity phase에서 성공하는지 먼저 봅니다.", "varargs method를 fixed array parameter처럼 적용할 수 있는 경우도 구분합니다.", "argument count를 적습니다."], fix: "strict/loose가 비었을 때만 variable-arity adaptation을 적용합니다.", prevention: "varargs overload는 fallback이라는 비용과 ambiguity를 문서화합니다." },
      ],
      comparisons: [{ title: "overload 해석 방법", options: [
        { name: "감각적 타입 거리", chooseWhen: "사용하지 않습니다.", avoidWhen: "boxing·varargs·generic inference가 하나라도 있을 때", tradeoffs: ["빠르지만 잘못됨", "phase 규칙을 숨김"] },
        { name: "phase 표", chooseWhen: "compiler 결과를 정확히 예측·설명할 때", avoidWhen: "없음", tradeoffs: ["조금 느리지만 재현 가능", "most-specific까지 기록"] },
        { name: "명시 method names", chooseWhen: "domain 의미가 다른 overload 때문에 사용자가 혼란스러울 때", avoidWhen: "동일 의미의 자연스러운 type overload일 때", tradeoffs: ["API 의도 명확", "method 이름 증가"] },
      ] }],
    },
    {
      id: "widening-boxing-varargs-null-ambiguity",
      title: "widening·boxing·varargs와 null은 허용 조합이 다르고 unrelated references는 ambiguity를 만듭니다",
      lead: "conversion을 한 덩어리로 보지 말고 argument 하나마다 어떤 invocation conversion이 필요한지 적습니다.",
      explanations: [
        "primitive widening은 byte→short→int→long→float→double처럼 정보 범위가 넓은 방향의 허용 conversion입니다. 반대 narrowing은 method invocation이 자동 적용하지 않으므로 cast나 validation이 필요합니다.",
        "boxing은 primitive를 wrapper reference로, unboxing은 wrapper를 primitive로 바꿉니다. loose invocation은 boxing 뒤 widening reference나 unboxing 뒤 widening primitive 같은 허용 조합을 포함하지만 임의의 widening-then-boxing을 모두 허용하지는 않습니다.",
        "예를 들어 int literal을 Long parameter에 직접 전달하는 int→long→Long 연쇄는 method invocation conversion이 아니어서 compile되지 않습니다. long literal 1L 또는 Long.valueOf가 필요합니다.",
        "varargs declaration int...는 body 안에서 int[]입니다. 호출자는 0개 이상 개별 ints 또는 명시 int[]를 전달할 수 있으며, explicit (int[]) null은 null array 그대로 전달되어 body policy가 필요합니다.",
        "null literal은 모든 reference type에 적용 가능하지만 primitive에는 적용할 수 없습니다. Integer와 int[] overload가 함께 있으면 null은 둘 다 맞고 두 types가 unrelated라 most-specific 하나를 정할 수 없습니다.",
        "cast는 모호성을 해결하지만 null 의미를 숨길 수 있습니다. API가 null을 실제 값으로 받아야 하는지 먼저 정하고, 아니라면 Objects.requireNonNull 또는 명시 query method로 경계를 좁힙니다.",
      ],
      concepts: [
        { term: "method invocation conversion", definition: "argument를 formal parameter type에 맞출 때 JLS가 허용하는 identity·widening·boxing/unboxing 조합입니다.", detail: ["assignment conversion과 완전히 같지 않습니다.", "phase에 따라 허용 범위가 다릅니다."] },
        { term: "variable arity parameter", definition: "선언에서는 T...로 쓰고 method body에서는 T[]로 다루며 invocation에서 trailing arguments가 배열로 포장될 수 있는 parameter입니다.", detail: ["0개는 length0입니다.", "명시 null array도 가능합니다."] },
        { term: "null ambiguity", definition: "null literal이 둘 이상의 unrelated reference parameter types에 applicable해 unique most-specific method가 없는 compile-time 오류입니다.", detail: ["runtime null branch가 아닙니다.", "cast로 후보를 제한할 수 있습니다."] },
      ],
      codeExamples: [{
        id: "java-conversion-varargs-markers",
        title: "widening·boxing·typed null·명시 null varargs를 안전한 marker로 실행합니다",
        language: "java",
        filename: "ConversionVarargsLab.java",
        purpose: "compile되는 호출만으로 phase 결과를 확인하고 ambiguous null은 negative experiment로 분리합니다.",
        code: String.raw`public class ConversionVarargsLab {
    static String route(long value) { return "long"; }
    static String route(Integer value) { return "Integer:" + (value == null); }
    static String route(Object value) { return "Object:" + (value == null); }
    static String route(int... values) { return values == null ? "int...:null" : "int...:" + values.length; }

    public static void main(String[] args) {
        System.out.println("literal=" + route(1));
        System.out.println("boxed=" + route(Integer.valueOf(1)));
        System.out.println("objectNull=" + route((Object) null));
        System.out.println("integerNull=" + route((Integer) null));
        System.out.println("empty=" + route());
        System.out.println("arrayNull=" + route((int[]) null));
    }
}`,
        walkthrough: [
          { lines: "2-5", explanation: "primitive, wrapper, Object, primitive-array reference 후보를 marker로 구분하고 null varargs policy를 명시합니다." },
          { lines: "8-9", explanation: "int literal은 phase1 long, 명시 Integer object는 Integer identity 후보를 선택합니다." },
          { lines: "10-13", explanation: "casts가 null 후보를 하나로 제한하고 0 arguments와 null int[]를 서로 다른 결과로 처리합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("ConversionVarargsLab.java", "ConversionVarargsLab") },
        output: { value: "literal=long\nboxed=Integer:false\nobjectNull=Object:true\nintegerNull=Integer:true\nempty=int...:0\narrayNull=int...:null", explanation: ["literal1은 widening long이 boxing보다 먼저입니다.", "typed casts는 null overload ambiguity를 제거합니다.", "empty varargs와 explicit null array는 다른 inputs입니다."] },
        experiments: [
          { change: "route(null)을 cast 없이 추가합니다.", prediction: "Integer와 int[]가 unrelated most-specific candidates라 ambiguous compile error입니다.", result: "null runtime 처리가 아니라 caller compilation에서 차단됩니다." },
          { change: "static String longOnly(Long value)를 만들고 longOnly(1)을 호출합니다.", prediction: "int→long→Long 연쇄가 허용되지 않아 compile 실패합니다.", result: "1L 또는 Long.valueOf(1)을 사용합니다." },
          { change: "route(int...)에서 values.length만 읽고 explicit null array를 전달합니다.", prediction: "NullPointerException입니다.", result: "null varargs를 금지하거나 body에서 명시 검사합니다." },
        ],
        sourceRefs: ["java-class03-ex07", "java-class03-ex08", "jls-widening-primitive", "jls-boxing", "jls-invocation-context", "jls-varargs", "jls-null-type"],
      }],
      diagnostics: [
        { symptom: "route(null)이 runtime에 Integer branch를 탈 것이라 예상했지만 compile되지 않는다.", likelyCause: "null에 applicable한 Integer와 int[] 사이 unique most-specific 관계가 없습니다.", checks: ["reference-type overloads를 모두 나열합니다.", "subtype 관계를 그립니다.", "null 허용 contract가 필요한지 묻습니다."], fix: "typed cast로 의도를 명시하거나 API names/types를 분리하고 null을 금지합니다.", prevention: "새 reference overload 추가 때 null call source compatibility를 검사합니다." },
        { symptom: "int를 Long parameter에 넘기면 widening 후 boxing될 것이라 생각했다.", likelyCause: "Java가 모든 conversion 연쇄를 method invocation에서 허용한다고 일반화했습니다.", checks: ["argument compile-time primitive type을 적습니다.", "formal wrapper type을 적습니다.", "JLS invocation conversion 목록과 비교합니다."], fix: "1L로 widening 결과를 literal에서 만들거나 Long.valueOf를 명시합니다.", prevention: "wrapper overload보다 domain value type과 명시 factory를 선호합니다." },
      ],
      expertNotes: ["기존 API에 unrelated reference overload를 추가하면 과거의 m(null) client가 source recompilation에서 ambiguous해질 수 있습니다.", "varargs는 배열 allocation과 null/empty 의미를 API에 추가하므로 단순 편의 이상의 계약입니다."],
    },
    {
      id: "compile-time-overload-runtime-override",
      title: "overload signature는 compile-time type으로 선택되고 override body만 runtime receiver로 dispatch됩니다",
      lead: "한 호출 expression 안에서도 두 결정 시점이 연속될 수 있어 선언 type과 실제 object type을 따로 적어야 합니다.",
      explanations: [
        "overload resolution은 compiler가 method name과 argument compile-time types로 하나의 signature를 고릅니다. variable이 Parent로 선언되어 실제 Child를 가리켜도 classify(ref)는 Parent parameter overload를 선택합니다.",
        "선택된 signature가 instance method이고 override되어 있으면 runtime invocation은 receiver object class에서 가장 구체적인 override implementation을 찾습니다. Parent ref의 sound()는 Child body를 실행합니다.",
        "static methods는 override되지 않고 hiding되며 receiver runtime class로 dynamic dispatch하지 않습니다. 이 세션 예제의 classify는 static overload라 compile-time 선택만 보여 줍니다.",
        "cast는 object를 바꾸지 않고 expression의 compile-time type을 바꿉니다. 안전한 Child object를 (Child) ref로 cast하면 classify(Child)가 선택되지만 잘못된 cast는 ClassCastException입니다.",
        "overload와 override가 같은 API에 섞이면 사람이 결과를 오해하기 쉽습니다. domain 의미가 다르면 다른 method names를 사용하고, 다형적 행동은 하나의 override contract로 표현하는 편이 낫습니다.",
        "null receiver의 instance invocation은 signature 선택 후 runtime에서 NullPointerException이지만 static invocation을 expression으로 쓰는 특수 경우와 섞지 않습니다. 호출 스타일은 class-qualified static으로 명확히 합니다.",
      ],
      concepts: [
        { term: "static selection", definition: "compile-time 정보로 overload signature나 static member를 결정하는 과정입니다.", detail: ["argument declared types가 핵심입니다.", "runtime object가 재선택하지 않습니다."] },
        { term: "dynamic dispatch", definition: "선택된 instance method signature에 대해 runtime receiver class의 override implementation을 실행하는 과정입니다.", detail: ["override에 적용됩니다.", "static hiding에는 적용되지 않습니다."] },
        { term: "declared type versus runtime class", definition: "reference expression이 compile-time에 제공하는 type과 그 reference가 실행 중 가리키는 object class의 구분입니다.", detail: ["overload는 앞쪽을 봅니다.", "override는 뒤쪽을 봅니다."] },
      ],
      codeExamples: [{
        id: "java-overload-override-two-stage",
        title: "Parent-typed Child reference로 overload와 override의 서로 다른 결과를 봅니다",
        language: "java",
        filename: "OverloadOverrideLab.java",
        purpose: "동일 reference가 static overload에서는 parent, instance override에서는 child로 해석되는 이유를 분리합니다.",
        code: String.raw`public class OverloadOverrideLab {
    static class Parent {
        String sound() { return "parent-body"; }
    }
    static final class Child extends Parent {
        @Override String sound() { return "child-body"; }
    }
    static String classify(Parent value) { return "parent-overload"; }
    static String classify(Child value) { return "child-overload"; }

    public static void main(String[] args) {
        Parent reference = new Child();
        System.out.println("overload=" + classify(reference));
        System.out.println("override=" + reference.sound());
        System.out.println("castOverload=" + classify((Child) reference));
        System.out.println("sameObject=" + (reference == (Child) reference));
    }
}`,
        walkthrough: [
          { lines: "2-7", explanation: "Child는 Parent의 sound signature body만 override합니다." },
          { lines: "8-9", explanation: "classify는 parameter types가 다른 두 static overloads라 compile-time에 선택됩니다." },
          { lines: "12-16", explanation: "Parent declared type, Child runtime class, cast expression type을 각각 output과 identity boolean으로 검증합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("OverloadOverrideLab.java", "OverloadOverrideLab") },
        output: { value: "overload=parent-overload\noverride=child-body\ncastOverload=child-overload\nsameObject=true", explanation: ["classify(reference)는 Parent declared type을 봅니다.", "reference.sound는 Child runtime implementation을 실행합니다.", "cast는 같은 object를 유지하면서 overload용 expression type만 바꿉니다."] },
        experiments: [
          { change: "Child object를 Parent object로 바꾸고 (Child) cast를 유지합니다.", prediction: "compile은 되지만 cast evaluation에서 ClassCastException입니다.", result: "cast는 runtime class를 변환하지 않습니다." },
          { change: "classify methods를 instance methods로 옮기되 overload parameter는 유지합니다.", prediction: "호출 receiver override와 argument overload라는 두 축을 모두 추적해야 합니다.", result: "혼란이 커지면 API 이름을 분리합니다." },
          { change: "Parent/Child에 static sound를 선언합니다.", prediction: "reference declared type에 따른 hiding이며 child-body dynamic dispatch가 아닙니다.", result: "static method를 instance reference로 호출하지 않고 class name을 사용합니다." },
        ],
        sourceRefs: ["java-class03-ex07", "jls-overload-applicability", "jls-overriding", "jls-runtime-method-lookup", "jls-casting"],
      }],
      diagnostics: [
        { symptom: "실제 object가 Child인데 Parent overload가 호출돼 버그라고 생각했다.", likelyCause: "overload를 runtime dispatch로 오해했습니다.", checks: ["argument variable의 declared type을 봅니다.", "선택 대상이 overload인지 override인지 구분합니다.", "compiler-selected descriptor를 javap로 확인할 수 있습니다."], fix: "compile-time type에 맞는 결과로 설명하고 다형적 분기가 목적이면 override/visitor 등 한 contract를 사용합니다.", prevention: "상속 hierarchy에 overloads를 겹쳐 놓는 API를 피합니다." },
        { symptom: "cast를 했으니 Parent object가 Child로 바뀐다고 생각했다.", likelyCause: "reference expression type check와 object conversion을 혼동했습니다.", checks: ["cast 전 실제 runtime class를 확인합니다.", "instanceof guard가 필요한지 봅니다.", "identity가 같은지 확인합니다."], fix: "cast는 type assertion/표현식 변환일 뿐이며 안전하지 않으면 polymorphic method로 재설계합니다.", prevention: "downcast가 반복되면 abstraction 경계를 재검토합니다." },
      ],
      comparisons: [{ title: "행동 분기 표현", options: [
        { name: "overload", chooseWhen: "compile-time argument types별 동일 이름 convenience가 자연스러울 때", avoidWhen: "runtime subtype별 행동이 목적일 때", tradeoffs: ["호출 간결", "declared type 의존"] },
        { name: "override", chooseWhen: "runtime receiver subtype이 공통 contract를 다르게 구현할 때", avoidWhen: "서로 무관한 입력 타입 변환일 때", tradeoffs: ["다형성", "상속 계약 필요"] },
        { name: "명시 dispatcher", chooseWhen: "여러 object types와 operations를 중앙에서 통제해야 할 때", avoidWhen: "단순한 한 축 다형성일 때", tradeoffs: ["결정 규칙 가시적", "분기 구조 증가"] },
      ] }],
    },
    {
      id: "constructor-declaration-default-condition",
      title: "constructor는 method가 아니며 default constructor는 선언이 하나도 없을 때만 암묵적으로 생깁니다",
      lead: "no-arg라는 모양, source에 명시했는지, compiler가 제공했는지를 세 개의 질문으로 나눕니다.",
      explanations: [
        "constructor declaration은 class 이름과 같은 simple type name을 쓰고 result type이 없습니다. ‘void가 생략된 method’가 아니며 return value, 상속, override라는 method 규칙을 그대로 적용하지 않습니다.",
        "class에 constructor declarations가 전혀 없으면 compiler가 default constructor를 암묵적으로 제공합니다. 명시 constructor가 인자를 받든 no-arg든 하나라도 있으면 default constructor는 제공되지 않습니다.",
        "default constructor는 no-arg이지만 모든 no-arg constructor가 default는 아닙니다. Ex12의 Ex12_ConstructorDemo()는 source에 적힌 explicit no-arg constructor입니다.",
        "일반 class의 default constructor accessibility는 class accessibility와 연결되고 body는 인자 없는 superclass constructor 호출을 포함하는 형태입니다. 접근 가능한 no-arg super constructor가 없으면 compile error가 날 수 있습니다.",
        "constructor는 object마다 정확히 한 번이라는 표현도 조심합니다. 한 object 생성에서 this() chain을 따라 여러 constructor bodies가 실행되며, serialization/clone/Unsafe 같은 특수 생성 경로는 별도 계약입니다.",
        "reflection의 getDeclaredConstructors는 compiler가 만든 default constructor도 runtime constructor로 보여 주므로 parameter count0만으로 source에 명시했는지 판별할 수 없습니다. source/bytecode provenance를 함께 봅니다.",
      ],
      concepts: [
        { term: "constructor declaration", definition: "class instance creation 시 초기화를 수행하지만 JLS상 member가 아니며 method declaration과 별도 문법·규칙을 갖는 선언입니다.", detail: ["result type이 없습니다.", "상속/override되지 않습니다."] },
        { term: "default constructor", definition: "class가 constructor를 하나도 선언하지 않았을 때 compiler가 암묵적으로 제공하는 constructor입니다.", detail: ["항상 no-arg입니다.", "explicit no-arg와 다릅니다."] },
        { term: "explicit no-arg constructor", definition: "programmer가 source에 직접 선언한 formal parameter 없는 constructor입니다.", detail: ["default라고 부르지 않습니다.", "검증·logging·delegation body를 가질 수 있습니다."] },
      ],
      codeExamples: [{
        id: "java-default-explicit-constructor-shape",
        title: "implicit default·explicit no-arg·only-arg constructors의 runtime shape를 비교합니다",
        language: "java",
        filename: "DefaultConstructorLab.java",
        purpose: "세 source 선언을 나란히 두고 reflection parameter count가 source provenance까지 말해 주지는 않음을 확인합니다.",
        code: String.raw`public class DefaultConstructorLab {
    static final class ImplicitDefault {}

    static final class ExplicitNoArg {
        ExplicitNoArg() {}
    }

    static final class OnlyArg {
        OnlyArg(int value) {}
    }

    static int parameterCount(Class<?> type) {
        var constructors = type.getDeclaredConstructors();
        if (constructors.length != 1) throw new AssertionError("expected one constructor");
        return constructors[0].getParameterCount();
    }

    public static void main(String[] args) {
        new ImplicitDefault();
        new ExplicitNoArg();
        new OnlyArg(1);
        System.out.println("implicitParams=" + parameterCount(ImplicitDefault.class));
        System.out.println("explicitParams=" + parameterCount(ExplicitNoArg.class));
        System.out.println("onlyArgParams=" + parameterCount(OnlyArg.class));
        System.out.println("sourceDistinguishesFirstTwo=true");
    }
}`,
        walkthrough: [
          { lines: "2-10", explanation: "constructor 없음, 명시 no-arg, 명시 one-arg라는 세 source 조건을 만듭니다." },
          { lines: "12-16", explanation: "reflection에는 각 runtime constructor가 하나씩 보이며 parameter count만 측정합니다." },
          { lines: "19-26", explanation: "각기 유효한 creation syntax를 실행하고 처음 두 shape가 같아도 source provenance가 다름을 출력합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("DefaultConstructorLab.java", "DefaultConstructorLab") },
        output: { value: "implicitParams=0\nexplicitParams=0\nonlyArgParams=1\nsourceDistinguishesFirstTwo=true", explanation: ["ImplicitDefault에는 compiler가 no-arg를 제공합니다.", "ExplicitNoArg는 동일 parameter count지만 source에 명시했습니다.", "OnlyArg에는 implicit no-arg가 추가되지 않습니다."] },
        experiments: [
          { change: "OnlyArg main에 new OnlyArg()를 추가합니다.", prediction: "no applicable constructor compile error입니다.", result: "명시 one-arg가 default 제공 조건을 제거했습니다." },
          { change: "ExplicitNoArg 선언을 제거합니다.", prediction: "compiler가 default constructor를 제공해 new ExplicitNoArg()는 계속 compile됩니다.", result: "동작이 같아 보여도 source/API provenance가 달라집니다." },
          { change: "superclass에 private Super(int)만 두고 subclass constructor를 전혀 선언하지 않습니다.", prediction: "subclass default constructor의 implicit super()가 접근 가능한 no-arg를 찾지 못해 compile 실패합니다.", result: "default constructor도 superclass chain 조건을 만족해야 합니다." },
        ],
        sourceRefs: ["java-class03-ex11", "java-class03-ex12", "java-class03-ex13", "jls-constructors", "jls-default-constructor", "jls-instance-creation"],
      }],
      diagnostics: [
        { symptom: "명시 int constructor를 추가한 뒤 기존 new Type()이 compile되지 않는다.", likelyCause: "compiler가 기존 default constructor도 계속 제공한다고 생각했습니다.", checks: ["class body의 constructor declarations를 찾습니다.", "호출 arity/types를 비교합니다.", "source/binary compatibility 영향을 봅니다."], fix: "정말 계약이면 explicit no-arg를 선언하고 invariant가 허용하는지 검토합니다.", prevention: "constructor overload 추가 시 모든 creation call sites와 frameworks를 compile test합니다." },
        { symptom: "reflection에 no-arg가 보이니 explicit source constructor라고 단정했다.", likelyCause: "runtime shape와 compiler synthesis provenance를 혼동했습니다.", checks: ["source 또는 classfile debug/source history를 봅니다.", "class가 다른 constructors를 선언했는지 확인합니다.", "isSynthetic flag에 의존하지 않습니다."], fix: "‘runtime no-arg 존재’와 ‘source explicit/default’를 별도 사실로 기록합니다.", prevention: "교육 자료는 no-arg/default 용어를 엄격히 구분합니다." },
      ],
      expertNotes: ["public no-arg를 framework 편의로 추가하면 invalid empty object를 만들 수 있으므로 binding DTO나 protected/private constructor 대안을 검토합니다.", "API에서 constructor 추가/삭제·access 변경은 reflection, dependency injection, serialization 소비자까지 compatibility inventory에 넣습니다."],
    },
    {
      id: "constructor-overload-this-delegation",
      title: "여러 constructors는 this()로 하나의 canonical path에 위임해 중복과 정책 drift를 막습니다",
      lead: "각 overload가 fields를 제각각 쓰지 않게 가장 완전한 constructor에서 validation과 assignment를 한 번 수행합니다.",
      explanations: [
        "constructor overload도 formal parameter types가 다른 여러 constructor declarations입니다. 호출자는 new 뒤 argument types로 applicable constructor를 compile-time에 선택합니다.",
        "this(arguments)는 같은 class의 다른 constructor를 호출하는 explicit constructor invocation입니다. JDK21에서는 constructor body의 첫 statement여야 하며 같은 body에서 this()와 super()를 함께 직접 호출할 수 없습니다.",
        "no-arg→one-arg→canonical two-arg처럼 단방향 graph를 만들면 default policy가 한 곳으로 모입니다. canonical constructor가 code·price 검증과 assignments를 책임집니다.",
        "this() chain은 recursive cycle을 만들 수 없습니다. 직접 this() 자기 호출이나 A→B→A cycle은 recursive constructor invocation compile error입니다.",
        "위임받은 constructor body는 delegated constructor가 완료된 뒤 이어서 실행됩니다. trace가 canonical>one>zero 순서가 되는 이유입니다.",
        "Ex14처럼 String-only가 price0, int-only가 empty name을 남기면 constructor가 invalid/부분 object를 성공적으로 만듭니다. overload가 필요하더라도 meaningful defaults 또는 별도 factory를 선택해야 합니다.",
      ],
      concepts: [
        { term: "constructor overload", definition: "같은 class에 서로 다른 constructor signatures를 선언해 여러 creation inputs를 받는 기능입니다.", detail: ["return type은 없습니다.", "method overload와 유사한 applicability를 사용합니다."] },
        { term: "explicit constructor invocation", definition: "constructor body 시작에서 this(...) 또는 super(...)로 다른 constructor를 호출하는 문장입니다.", detail: ["JDK21에서 first statement입니다.", "한 chain의 다음 node를 정합니다."] },
        { term: "canonical constructor", definition: "모든 필수 값의 validation·normalization·assignment를 책임지고 편의 overloads가 위임하는 가장 완전한 생성 경로입니다.", detail: ["중복을 줄입니다.", "invariant drift를 막습니다."] },
      ],
      codeExamples: [{
        id: "java-constructor-delegation-trace",
        title: "zero→one→canonical this() chain의 완료 순서를 trace합니다",
        language: "java",
        filename: "ConstructorDelegationLab.java",
        purpose: "this() 호출 방향과 delegated body 이후의 실행 순서를 결정적 문자열로 확인합니다.",
        code: String.raw`public class ConstructorDelegationLab {
    static final class Product {
        private final String code;
        private final int price;
        private String trace;

        Product() {
            this("P1");
            trace += ">zero";
        }
        Product(String code) {
            this(code, 1500);
            trace += ">one";
        }
        Product(String code, int price) {
            if (code == null || code.isBlank()) throw new IllegalArgumentException("blank code");
            if (price <= 0) throw new IllegalArgumentException("invalid price");
            this.code = code;
            this.price = price;
            this.trace = "canonical";
        }
        String summary() { return code + "/" + price + "/" + trace; }
    }

    public static void main(String[] args) {
        System.out.println("zero=" + new Product().summary());
        System.out.println("full=" + new Product("P2", 2500).summary());
        try {
            new Product("P3", 0);
        } catch (IllegalArgumentException e) {
            System.out.println("rejected=" + e.getMessage());
        }
    }
}`,
        walkthrough: [
          { lines: "7-14", explanation: "zero는 one으로, one은 canonical로 first-statement delegation하고 돌아온 뒤 trace suffix를 붙입니다." },
          { lines: "15-22", explanation: "canonical path만 validation·final fields assignment·trace 시작을 담당합니다." },
          { lines: "27-34", explanation: "편의/full paths와 invalid price가 같은 policy를 통과함을 실행합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("ConstructorDelegationLab.java", "ConstructorDelegationLab") },
        output: { value: "zero=P1/1500/canonical>one>zero\nfull=P2/2500/canonical\nrejected=invalid price", explanation: ["가장 깊은 canonical body가 먼저 완료되고 호출한 bodies가 역순으로 이어집니다.", "full constructor와 convenience constructors가 같은 validation을 사용합니다."] },
        experiments: [
          { change: "Product()에서 println 뒤 this(\"P1\")를 둡니다.", prediction: "JDK21 compiler가 constructor invocation must be first statement로 거부합니다.", result: "delegation은 body 선두에서 chain을 확정합니다." },
          { change: "Product()가 this()를 호출하게 합니다.", prediction: "recursive constructor invocation compile error입니다.", result: "constructor graph는 cycle이 없어야 합니다." },
          { change: "one-arg constructor가 직접 fields를 쓰고 validation을 복제합니다.", prediction: "당장은 같은 결과여도 한 path만 policy 변경할 때 drift할 수 있습니다.", result: "canonical path contract tests로 중복을 제거합니다." },
        ],
        sourceRefs: ["java-class03-ex11", "java-class03-ex14", "java-class03-ex15", "java-class03-ex16", "java-class03-ex17", "jls-constructor-overloading", "jls-explicit-constructor-invocation"],
      }],
      diagnostics: [
        { symptom: "this() 앞에서 argument를 계산하려고 local statement를 두니 compile되지 않는다.", likelyCause: "JDK21 explicit constructor invocation의 first-statement 제약을 위반했습니다.", checks: ["target JDK/JLS version을 확인합니다.", "this()/super() 위치를 봅니다.", "계산을 static helper argument expression이나 canonical constructor로 옮길 수 있는지 봅니다."], fix: "this(validate(value))처럼 side-effect 없는 helper를 argument에서 호출하거나 factory에서 계산 후 constructor를 호출합니다.", prevention: "constructor body는 delegation→최소 후처리 구조로 유지합니다." },
        { symptom: "편의 constructor 하나만 invalid 값을 허용한다.", likelyCause: "overload별 assignment/validation을 복사해 policy가 drift했습니다.", checks: ["모든 paths가 canonical constructor에 도달하는지 그립니다.", "field assignments 위치를 검색합니다.", "동일 invalid fixtures를 각 overload에 적용합니다."], fix: "가장 완전한 constructor 하나에 validation을 모으고 나머지는 this()로 위임합니다.", prevention: "constructor matrix contract test를 둡니다." },
      ],
      comparisons: [{ title: "여러 생성 경로 표현", options: [
        { name: "constructor overloads", chooseWhen: "argument type/arity만으로 의미가 명확하고 defaults가 안전할 때", avoidWhen: "같은 types가 다른 의미를 가져 호출이 불명확할 때", tradeoffs: ["new syntax 자연스러움", "overload ambiguity 가능"] },
        { name: "named static factories", chooseWhen: "의미·validation·캐시·subtype 반환을 이름으로 드러낼 때", avoidWhen: "framework가 public constructor만 요구할 때", tradeoffs: ["의도 명확", "new 직접 호출 아님"] },
        { name: "builder", chooseWhen: "optional parameters가 많고 단계적 조립이 필요할 때", avoidWhen: "필수 값 두세 개의 작은 object일 때", tradeoffs: ["가독성", "중간 mutable builder와 추가 code"] },
      ] }],
    },
    {
      id: "allocation-initialization-constructor-order",
      title: "할당의 기본값부터 부모·field·initializer·constructor body까지 순서를 한 줄씩 추적합니다",
      lead: "constructor body가 객체 초기화의 시작이라고 생각하면 부모 상태와 field initializer가 이미 실행된 이유를 설명할 수 없습니다.",
      explanations: [
        "new 표현식은 먼저 객체에 필요한 공간을 확보하고 모든 instance fields를 기본값으로 둡니다. 그 뒤 선택된 constructor를 처리하며, Object가 아닌 class에서는 같은 class의 this() chain 또는 direct superclass constructor chain이 먼저 진행됩니다.",
        "superclass constructor 처리가 돌아오면 현재 class의 instance field initializers와 instance initializers가 source의 textual order로 실행되고, 마지막으로 현재 constructor body의 나머지가 실행됩니다. Parent 부분이 먼저 완성된 뒤 Child initializers가 시작됩니다.",
        "this()로 같은 class의 다른 constructor에 위임한 path는 delegated constructor가 superclass·현재 class initializers를 한 번 처리한 뒤 호출한 constructor body로 돌아옵니다. 같은 객체의 fields와 initializer blocks가 constructor overload 수만큼 반복되는 것은 아닙니다.",
        "field initializer에서 앞 field의 값을 읽거나 instance initializer가 field를 덮어쓰면 constructor body가 보는 값은 source 순서의 결과입니다. 순서를 외우기보다 각 단계의 trace와 최종 state를 함께 assertion해야 합니다.",
        "Ex12·Ex14·Ex16처럼 declaration 옆에서 값을 초기화하고 constructor가 다시 값을 쓰는 source는 최종 출력만 보면 중간 default·initializer 값을 숨깁니다. 이 장의 marker fixture는 각 단계가 실제로 한 번씩 실행됨을 드러냅니다.",
        "초기화 도중 exception이 발생하면 그 뒤 initializer와 constructor body는 실행되지 않고 객체 생성은 abrupt completion합니다. reference가 외부로 새지 않았다면 호출자는 미완성 객체를 받을 수 없습니다.",
      ],
      concepts: [
        { term: "default field value", definition: "객체 공간이 확보된 직후 각 instance field가 type별 0·false·null 같은 기본값을 갖는 최초 상태입니다.", detail: ["local variable의 definite assignment와 다릅니다.", "field initializer보다 앞선 단계입니다."] },
        { term: "instance initializer", definition: "객체 생성마다 field initializers와 함께 textual order로 실행되는 class body의 비-static block입니다.", detail: ["superclass constructor 뒤에 실행됩니다.", "현재 class constructor overloads가 공유합니다."] },
        { term: "constructor processing", definition: "this/super chain, instance initializers, constructor body를 JLS 12.5 순서로 처리해 하나의 새 객체를 초기화하는 절차입니다.", detail: ["부모 객체와 자식 객체를 따로 만드는 과정이 아닙니다.", "abrupt completion도 계약에 포함합니다."] },
      ],
      codeExamples: [{
        id: "java-full-initialization-order",
        title: "Parent와 Child의 field·block·constructor·this() 완료 순서를 marker로 고정합니다",
        language: "java",
        filename: "InitializationOrderLab.java",
        purpose: "한 Child 생성에서 superclass와 subclass 초기화가 어떤 순서로 정확히 한 번씩 실행되는지 검증합니다.",
        code: String.raw`public class InitializationOrderLab {
    static int mark(String label, int value) {
        System.out.println(label);
        return value;
    }

    static class Parent {
        int parentValue = mark("parent-field", 1);
        { System.out.println("parent-block:" + parentValue); parentValue = 2; }
        Parent(int requested) {
            System.out.println("parent-ctor:" + parentValue + ":" + requested);
        }
    }

    static final class Child extends Parent {
        int childValue = mark("child-field", 3);
        { System.out.println("child-block:" + childValue); }
        Child() {
            this(2);
            System.out.println("child-noarg");
        }
        Child(int requested) {
            super(requested);
            System.out.println("child-ctor:" + requested);
        }
    }

    public static void main(String[] args) {
        Child child = new Child();
        System.out.println("final=" + child.parentValue + ":" + child.childValue);
    }
}`,
        walkthrough: [
          { lines: "2-5", explanation: "field initializer가 값을 반환하면서 단계 marker도 남기도록 순수한 작은 helper를 둡니다." },
          { lines: "7-14", explanation: "Parent field→block→constructor body에서 parentValue가 1에서 2로 바뀐 뒤 requested2를 관찰합니다." },
          { lines: "16-28", explanation: "Child no-arg는 int constructor에 위임하고, super 완료 뒤 Child field·block·int body가 실행된 다음 no-arg body로 돌아옵니다." },
          { lines: "31-33", explanation: "모든 단계가 끝난 최종 parentValue2·childValue3을 별도 state assertion으로 출력합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("InitializationOrderLab.java", "InitializationOrderLab") },
        output: { value: "parent-field\nparent-block:1\nparent-ctor:2:2\nchild-field\nchild-block:3\nchild-ctor:2\nchild-noarg\nfinal=2:3", explanation: ["Parent의 field와 block, body가 Child의 field initializer보다 먼저 완료됩니다.", "this() delegation 때문에 Child field/block은 한 번만 실행되고 int body 뒤 no-arg body가 이어집니다.", "최종 state는 trace와 일치합니다."] },
        experiments: [
          { change: "Child(int)의 super(requested)를 지우고 Parent에 no-arg를 추가하지 않습니다.", prediction: "implicit super()가 Parent(int)에 적용되지 않아 compile 실패합니다.", result: "constructor chain은 호출 가능한 direct-super path를 가져야 합니다." },
          { change: "parent-block에서 parentValue를 바꾸지 않습니다.", prediction: "parent-ctor와 final의 parentValue가 모두 1로 바뀝니다.", result: "instance initializer의 assignment가 constructor body보다 먼저임을 확인합니다." },
          { change: "Child no-arg와 int constructor가 각각 childValue를 다시 초기화하도록 복사합니다.", prediction: "실행은 가능하지만 path별 최종 state가 달라질 수 있습니다.", result: "공통 초기화는 initializer/canonical path 한 곳에 둡니다." },
        ],
        sourceRefs: ["java-class03-ex12", "java-class03-ex13", "java-class03-ex14", "java-class03-ex16", "jls-instance-creation", "jls-instance-initializers", "jls-field-initialization"],
      }],
      diagnostics: [
        { symptom: "Child constructor 첫 줄이 찍힌 뒤 Parent가 실행될 것이라 예상했지만 Parent trace가 먼저 나온다.", likelyCause: "constructor 호출 시점과 constructor body 나머지 실행 시점을 같은 것으로 보았습니다.", checks: ["explicit this/super invocation을 찾습니다.", "각 class의 field·instance initializers를 source order로 적습니다.", "body marker와 final state를 분리합니다."], fix: "JLS 12.5의 super chain→현재 class initializers→현재 body 순서로 trace를 다시 그립니다.", prevention: "상속 초기화 예제에는 단계별 고유 marker를 둡니다." },
        { symptom: "this() chain 길이만큼 Child field initializer가 반복된다고 계산했다.", likelyCause: "여러 constructor bodies를 여러 객체 초기화로 오해했습니다.", checks: ["new가 몇 번 평가되는지 셉니다.", "this()가 같은 receiver의 alternate constructor인지 확인합니다.", "field marker 횟수를 셉니다."], fix: "한 new에는 한 객체이고 delegated path에서 현재 class initializers는 한 번 실행된다고 교정합니다.", prevention: "constructor path test에 initializer 횟수와 최종 state를 함께 assertion합니다." },
      ],
      expertNotes: ["JLS는 객체 생성 순서를 정의하지만 실제 object layout·header·memory address는 JVM 구현 사항이므로 trace에서 추론하지 않습니다.", "initializer에서 virtual method·외부 I/O·복잡한 dependency를 호출하면 아직 완성되지 않은 this와 abrupt completion 위험이 커집니다."],
    },
    {
      id: "this-receiver-shadowing-self",
      title: "this는 현재 receiver이며 이름 충돌을 풀고 같은 객체를 반환할 수 있지만 새 identity를 만들지는 않습니다",
      lead: "‘지역변수가 우선’이라는 암기보다 lexical scope와 receiver-qualified field access를 구분합니다.",
      explanations: [
        "instance method와 constructor에서 this는 현재 호출 대상 객체를 나타내는 expression입니다. Ex16 constructor의 this와 Ex17의 demo가 같은 문자열을 출력한 이유도 constructor가 새로 만든 또 다른 객체가 아니라 demo가 가리키는 receiver를 본 것이기 때문입니다.",
        "parameter name이 field name을 shadow하면 simple name은 parameter를 나타내고 this.name은 receiver field를 나타냅니다. 이를 ‘지역변수 우선순위’로만 설명하지 말고 declaration scope와 qualified access의 차이로 설명해야 method·nested scope에서도 확장 가능합니다.",
        "this를 return하면 fluent API나 identity-preserving operation을 만들 수 있습니다. caller의 original reference와 returned reference가 ==인지는 명시적 계약이어야 하며, immutable withXxx처럼 새 객체를 반환하는 API와 이름·문서로 구분합니다.",
        "this는 assign할 수 있는 local variable이 아니며 static context에는 current instance가 없어 사용할 수 없습니다. static helper가 instance state를 필요로 하면 receiver를 parameter로 명시하거나 instance method로 바꿉니다.",
        "this()는 this expression과 관련 있지만 역할이 다릅니다. this는 현재 receiver를 가리키고, this(arguments)는 constructor body 선두의 explicit alternate-constructor invocation입니다.",
        "toString으로 this를 출력한 `Type@hex` suffix는 Object.toString 형식의 hash 표현이지 memory address가 아닙니다. 비결정적 suffix는 golden output에서 제거하고 reference equality를 직접 검사합니다.",
      ],
      concepts: [
        { term: "receiver", definition: "instance method 호출 또는 constructor 초기화가 대상으로 삼는 현재 객체입니다.", detail: ["this로 명시할 수 있습니다.", "static context에는 current receiver가 없습니다."] },
        { term: "shadowing", definition: "안쪽 scope의 declaration이 같은 simple name으로 바깥 declaration을 가려 simple-name 해석을 바꾸는 현상입니다.", detail: ["parameter code가 field code를 가릴 수 있습니다.", "this.code로 field를 명시합니다."] },
        { term: "identity-preserving return", definition: "method가 새 객체가 아니라 current receiver인 this를 그대로 반환하는 계약입니다.", detail: ["==로 확인할 수 있습니다.", "fluent mutation의 aliasing 비용을 동반할 수 있습니다."] },
      ],
      codeExamples: [{
        id: "java-this-shadow-self-contract",
        title: "parameter와 field를 분리하고 self()가 같은 receiver임을 identity로 검증합니다",
        language: "java",
        filename: "ThisReceiverLab.java",
        purpose: "this의 field qualification·method call·identity 의미를 비결정적 hash 없이 확인합니다.",
        code: String.raw`public class ThisReceiverLab {
    static final class Product {
        private final String code;
        private int price;

        Product(String code, int price) {
            this.code = code;
            this.price = price;
        }
        String shadow(String code) {
            return code + "|" + this.code;
        }
        Product self() {
            return this;
        }
        Product raiseBy(int amount) {
            this.price += amount;
            return this;
        }
        int price() { return this.price; }
    }

    public static void main(String[] args) {
        Product original = new Product("P1", 1500);
        Product returned = original.self().raiseBy(200);
        System.out.println("shadow=" + original.shadow("ARG"));
        System.out.println("same=" + (original == returned));
        System.out.println("price=" + original.price() + "|" + returned.price());
    }
}`,
        walkthrough: [
          { lines: "2-9", explanation: "constructor parameters와 fields가 같은 이름이므로 assignments의 왼쪽을 this로 명시합니다." },
          { lines: "10-14", explanation: "shadow는 argument와 receiver field를 둘 다 반환하고 self는 receiver identity를 그대로 돌려줍니다." },
          { lines: "15-21", explanation: "raiseBy는 this의 state를 바꾸고 같은 this를 반환하므로 두 aliases가 같은 price를 봅니다." },
          { lines: "24-29", explanation: "hash 문자열 대신 shadow 결과·==·두 alias의 상태를 deterministic output으로 검증합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("ThisReceiverLab.java", "ThisReceiverLab") },
        output: { value: "shadow=ARG|P1\nsame=true\nprice=1700|1700", explanation: ["simple code는 ARG parameter이고 this.code는 P1 field입니다.", "self와 raiseBy가 모두 receiver를 반환해 original과 returned는 같은 reference입니다.", "mutable fluent API이므로 한 alias의 변경을 다른 alias도 관찰합니다."] },
        experiments: [
          { change: "shadow에서 this.code 대신 code를 두 번 연결합니다.", prediction: "shadow=ARG|ARG가 출력됩니다.", result: "parameter shadowing으로 field access가 사라졌음을 확인합니다." },
          { change: "static Product self() { return this; }로 바꿉니다.", prediction: "non-static variable this cannot be referenced from a static context diagnostic입니다.", result: "static method에는 current receiver가 없습니다." },
          { change: "raiseBy가 새 Product(code, price+amount)를 반환하게 합니다.", prediction: "same=false이고 original1500·returned1700이 됩니다.", result: "identity-preserving mutation과 immutable copy 계약을 구분합니다." },
        ],
        sourceRefs: ["java-class03-ex16", "java-class03-ex17", "jls-this", "jls-static-context", "java-object-tostring"],
      }],
      diagnostics: [
        { symptom: "setter가 성공했지만 field가 바뀌지 않고 parameter만 자기 자신에게 대입된다.", likelyCause: "`code = code`에서 두 simple names가 모두 parameter로 해석됐습니다.", checks: ["parameter와 field의 names를 비교합니다.", "assignment 후 getter/state를 확인합니다.", "IDE symbol resolution을 봅니다."], fix: "field 쪽을 `this.code = code`로 receiver-qualified access합니다.", prevention: "constructor/setter contract test로 assigned state를 확인하고 qualification convention을 유지합니다." },
        { symptom: "fluent call 이후 원본 객체도 바뀌어 예상하지 못한 side effect가 생긴다.", likelyCause: "method가 새 값이 아니라 mutable this를 반환한다는 identity 계약을 놓쳤습니다.", checks: ["return this를 검색합니다.", "original == returned를 확인합니다.", "다른 aliases의 관찰 state를 검사합니다."], fix: "의도가 immutable이면 새 object를 반환하고, mutable fluent API면 이름·문서·thread-safety 정책에 aliasing을 명시합니다.", prevention: "identity와 state를 함께 확인하는 test를 둡니다." },
      ],
      comparisons: [{ title: "상태 변경 API의 반환 방식", options: [
        { name: "void mutation", chooseWhen: "명령과 조회를 분리하고 receiver 변경이 분명할 때", avoidWhen: "연쇄 구성이 핵심일 때", tradeoffs: ["side effect 명확", "chain 불가"] },
        { name: "return this fluent", chooseWhen: "동일 mutable builder/receiver를 연속 설정할 때", avoidWhen: "immutable value처럼 오해하기 쉬울 때", tradeoffs: ["간결한 chain", "aliasing과 동시성 비용"] },
        { name: "new immutable value", chooseWhen: "이전 snapshot 보존과 reasoning이 중요할 때", avoidWhen: "매우 빈번한 large copy 비용이 검증된 병목일 때", tradeoffs: ["상태 추론 용이", "새 allocation"] },
      ] }],
      expertNotes: ["instance method 호출 bytecode의 receiver 전달과 Java source의 this expression은 관련되지만, JVM 내부 표현을 source-level memory address로 설명하지 않습니다.", "constructor에서 this를 외부 callback에 넘기는 것은 identity 사용이 가능하더라도 완성 전 state 노출이므로 뒤 장에서 별도 금지 계약으로 다룹니다."],
    },
    {
      id: "validated-immutable-static-factory",
      title: "private constructor와 named factory로 정규화·검증을 모으고 완성된 immutable value만 반환합니다",
      lead: "constructor overload가 의미를 숨기거나 부분 상태를 허용하면 이름 있는 생성 경계가 더 안전합니다.",
      explanations: [
        "static factory는 method name으로 creation intent를 드러내고 호출 전에 normalization·validation을 수행할 수 있습니다. constructor와 달리 항상 새 instance를 반환할 의무가 없고 declared return type의 subtype도 반환할 수 있지만, 이 장에서는 단순한 immutable Product를 만듭니다.",
        "private canonical constructor는 이미 검증된 normalized values만 받아 final fields에 한 번 대입합니다. 공개 constructor를 열지 않아 caller가 validation path를 우회하지 못하게 하고 reflection structural test로 public constructor 수0을 확인합니다.",
        "문자열 trim·case normalization 뒤 blank를 검사하고 price positive 정책을 검사해야 합니다. 원본을 먼저 검사하거나 assignment 후 검사하면 normalization 결과와 failure atomicity가 어긋날 수 있습니다.",
        "withPrice는 현재 객체를 수정하지 않고 같은 code와 새 price로 factory를 다시 호출합니다. original과 repriced의 identity가 다르고 두 snapshot 값이 각각 유지되므로 중간 alias가 이전 state를 안전하게 관찰합니다.",
        "final reference는 해당 field를 재대입하지 못하게 하지만 참조 대상이 mutable하면 deep immutability를 자동 보장하지 않습니다. collection·array field가 있다면 defensive immutable snapshot 정책을 추가해야 합니다.",
        "factory가 IllegalArgumentException을 던진 경우 Product reference가 caller에게 반환되지 않습니다. 다만 constructor/factory 안에서 this를 registry·thread·callback으로 먼저 노출하면 이 보장은 깨지므로 escape 방지와 함께 설계합니다.",
      ],
      concepts: [
        { term: "named static factory", definition: "new 대신 의미 있는 static method name으로 validated instance를 얻는 생성 API입니다.", detail: ["호출 의미를 이름으로 표현합니다.", "cache·subtype·failure policy 선택 여지가 있습니다."] },
        { term: "immutable value", definition: "관찰 가능한 상태가 생성 완료 후 바뀌지 않고 변경 연산이 새 snapshot을 반환하는 값 객체입니다.", detail: ["fields를 final로 둡니다.", "mutable components는 defensive snapshot이 필요합니다."] },
        { term: "failure atomicity", definition: "생성 검증이 실패했을 때 caller가 부분적으로 초기화된 공개 객체를 얻지 않는 성질입니다.", detail: ["검증 후 assignment를 선호합니다.", "this escape가 없어야 합니다."] },
      ],
      codeExamples: [{
        id: "java-validated-immutable-product-factory",
        title: "Product.of와 withPrice가 같은 invariant를 거쳐 두 immutable snapshots를 만듭니다",
        language: "java",
        filename: "ImmutableFactoryLab.java",
        purpose: "normalization·validation·private construction·copy-style update·public API shape를 한 계약으로 검증합니다.",
        code: String.raw`import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.Locale;

public class ImmutableFactoryLab {
    static final class Product {
        private final String code;
        private final int price;

        private Product(String code, int price) {
            this.code = code;
            this.price = price;
        }
        static Product of(String rawCode, int price) {
            if (rawCode == null) throw new IllegalArgumentException("null code");
            String code = rawCode.trim().toUpperCase(Locale.ROOT);
            if (code.isEmpty()) throw new IllegalArgumentException("blank code");
            if (price <= 0) throw new IllegalArgumentException("invalid price");
            return new Product(code, price);
        }
        Product withPrice(int newPrice) {
            return of(code, newPrice);
        }
        String summary() { return code + ":" + price; }
    }

    public static void main(String[] args) {
        Product original = Product.of(" p1 ", 1500);
        Product repriced = original.withPrice(1800);
        System.out.println("original=" + original.summary());
        System.out.println("repriced=" + repriced.summary());
        System.out.println("same=" + (original == repriced));
        try {
            Product.of(" ", 1);
        } catch (IllegalArgumentException e) {
            System.out.println("invalid=" + e.getClass().getSimpleName());
        }
        long publicConstructors = Arrays.stream(Product.class.getDeclaredConstructors())
                .filter(c -> Modifier.isPublic(c.getModifiers())).count();
        System.out.println("publicConstructors=" + publicConstructors);
    }
}`,
        walkthrough: [
          { lines: "6-13", explanation: "final fields와 private constructor가 이미 검증된 두 값을 한 번만 저장합니다." },
          { lines: "14-24", explanation: "factory가 null→normalize→blank/price validation 순서를 지키고 withPrice도 같은 path를 재사용합니다." },
          { lines: "27-38", explanation: "두 snapshots의 값·identity와 invalid failure type을 deterministic하게 확인합니다." },
          { lines: "39-42", explanation: "reflection으로 public constructor가 하나도 없어 factory 우회가 공개 API에 없는지 검사합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("ImmutableFactoryLab.java", "ImmutableFactoryLab") },
        output: { value: "original=P1:1500\nrepriced=P1:1800\nsame=false\ninvalid=IllegalArgumentException\npublicConstructors=0", explanation: ["trim과 Locale.ROOT upper normalization 결과는 P1입니다.", "withPrice는 original을 바꾸지 않고 새 identity를 반환합니다.", "blank input은 object 반환 전에 거부되고 공개 constructor는 없습니다."] },
        experiments: [
          { change: "withPrice가 this.price를 바꾸고 this를 반환하도록 fields/factory를 mutable하게 만듭니다.", prediction: "same=true가 되고 original도 1800을 관찰합니다.", result: "immutable snapshot 계약과 mutable fluent 계약이 달라집니다." },
          { change: "factory의 rawCode.trim()보다 앞에서 rawCode.isEmpty()만 검사합니다.", prediction: "공백 문자열이 검사 후 normalize되어 blank code가 생성될 수 있습니다.", result: "normalization 후 invariant를 검사해야 합니다." },
          { change: "public Product(String,int)를 추가해 validation 없이 fields를 대입합니다.", prediction: "publicConstructors=1이고 invalid state를 만들 우회 경로가 생깁니다.", result: "모든 공개 creation entry가 같은 invariant를 지켜야 합니다." },
        ],
        sourceRefs: ["java-class03-ex14", "java-class03-ex16", "jls-constructors", "java-locale-root", "java-reflection-constructor", "java-modifier"],
      }],
      diagnostics: [
        { symptom: "factory를 통하면 정상인데 public constructor로는 blank code가 만들어진다.", likelyCause: "여러 공개 creation entries 중 일부가 canonical validation을 우회합니다.", checks: ["public/protected constructors와 factories를 모두 inventory합니다.", "각 path에 같은 invalid matrix를 적용합니다.", "reflection으로 constructor modifiers를 검사합니다."], fix: "public entry를 factory 하나로 좁히거나 모든 constructors가 private canonical validation에 도달하게 합니다.", prevention: "creation API structural test와 invariant parameterized test를 함께 둡니다." },
        { symptom: "final List field인데 caller가 전달한 list를 바꾸자 Product 내용도 변한다.", likelyCause: "final이 reference 재대입만 막고 mutable object alias를 끊지 못한다는 점을 놓쳤습니다.", checks: ["constructor input과 getter result의 identity를 봅니다.", "mutable element 여부를 확인합니다.", "List.copyOf/defensive deep copy 정책을 검토합니다."], fix: "입력 시 immutable snapshot을 만들고 반환도 representation을 노출하지 않습니다.", prevention: "원본 collection 변경 후 object state가 유지되는 alias test를 둡니다." },
      ],
      comparisons: [{ title: "생성 API 선택", options: [
        { name: "public constructor", chooseWhen: "필수 값과 의미가 짧고 직접 new가 명확할 때", avoidWhen: "같은 signature에 여러 의미·cache·subtype 반환이 필요할 때", tradeoffs: ["언어 기본 syntax", "이름으로 의도 표현 제한"] },
        { name: "static factory", chooseWhen: "normalization·validation·의미 있는 이름·구현 선택이 필요할 때", avoidWhen: "tool/framework가 constructor contract를 강제할 때", tradeoffs: ["공개 경계 통제", "검색/상속 관습 학습 필요"] },
        { name: "builder", chooseWhen: "optional 값이 많고 단계적 검증·가독성이 필요할 때", avoidWhen: "필수 두 값뿐인 작은 value일 때", tradeoffs: ["호출 가독성", "추가 mutable 객체와 code"] },
      ] }],
      expertNotes: ["static factory가 cache를 도입하면 identity와 lifetime 계약이 달라지므로 호출자가 new identity를 기대하지 않게 문서화합니다.", "private constructor는 reflection·serialization·module boundary 전체를 자동 봉쇄하는 보안 장치가 아니라 정상 source API의 creation path를 좁히는 설계 도구입니다."],
    },
    {
      id: "construction-hazards-override-this-escape",
      title: "생성 중 overridable 호출과 this escape는 기본값 상태를 외부 동작에 노출합니다",
      lead: "constructor가 끝나기 전 receiver는 identity를 갖지만 subclass와 final state가 아직 완성됐다는 뜻은 아닙니다.",
      explanations: [
        "Java는 constructor 실행 중이라고 virtual dispatch를 멈추지 않습니다. superclass constructor가 overridable instance method를 호출하면 runtime class의 override가 선택될 수 있고, 그 시점에는 subclass field initializers가 아직 실행되지 않아 null·0 같은 기본값을 봅니다.",
        "base constructor에서 호출한 method가 subclass invariant를 기대하면 NPE·잘못된 registration·외부 I/O가 발생할 수 있습니다. constructor에서는 private/final helper 또는 이미 완성된 superclass state만 사용하는 것이 안전합니다.",
        "this escape는 constructor가 끝나기 전에 this를 static field, collection, listener, callback, thread 또는 다른 외부 객체에 저장하는 일입니다. 다른 code가 leaked reference를 사용하면 아직 assignment 전인 fields를 관찰하거나 partially initialized 동작을 호출할 수 있습니다.",
        "이 장의 Escaper는 같은 thread에서 assignment 전 leaked.answer를 읽어 default0을 결정적으로 보여 줍니다. 실제 concurrent observer의 timing·visibility는 schedule과 Java Memory Model 문제이므로 이 출력 하나로 race 결과를 일반화하지 않습니다.",
        "final field는 올바르게 구성되고 constructor 중 reference가 escape하지 않은 객체에 특별한 visibility 보장을 제공합니다. final이라는 keyword만 추가한 뒤 constructor가 this를 유출하면 safe publication 전체가 자동 해결되는 것은 아닙니다.",
        "생성 후 등록이 필요하면 private constructor가 완성된 object를 반환한 다음 factory가 registry에 넣거나 caller가 명시적으로 start/register lifecycle을 호출하게 합니다. 실패 시에는 registry와 resource가 부분적으로 남지 않도록 rollback/cleanup 계약도 둡니다.",
      ],
      concepts: [
        { term: "overridable call during construction", definition: "superclass 초기화가 끝나기 전에 dynamic dispatch 가능한 instance method를 호출해 subclass override가 미완성 state를 관찰하는 위험입니다.", detail: ["override는 runtime receiver로 선택됩니다.", "subclass field initializers보다 이를 수 있습니다."] },
        { term: "this escape", definition: "constructor 완료 전에 current receiver reference가 외부에서 도달 가능한 곳으로 유출되는 현상입니다.", detail: ["static registry·listener·thread가 흔한 경로입니다.", "부분 초기화와 publication 문제가 생깁니다."] },
        { term: "safe publication", definition: "다른 thread가 객체의 완성된 초기화 결과를 Java Memory Model 규칙에 따라 올바르게 관찰하도록 reference를 전달하는 것입니다.", detail: ["constructor 완료와 non-escape가 중요합니다.", "동시 collection·volatile·lock 같은 publication edge를 검토합니다."] },
      ],
      codeExamples: [{
        id: "java-construction-hazard-markers",
        title: "override dispatch와 leaked this가 각각 null·0 기본값을 보는 시점을 재현합니다",
        language: "java",
        filename: "ConstructionHazardLab.java",
        purpose: "완성 전 receiver identity가 존재해도 subclass/final state가 준비되지 않았음을 deterministic same-thread trace로 확인합니다.",
        code: String.raw`public class ConstructionHazardLab {
    static class Base {
        Base() { report(); }
        void report() {}
    }
    static final class Child extends Base {
        private String state = "ready";
        @Override void report() {
            System.out.println("overrideDuring=" + state);
        }
        void reportAfter() {
            System.out.println("overrideAfter=" + state);
        }
    }
    static final class Escaper {
        static Escaper leaked;
        final int answer;
        Escaper() {
            leaked = this;
            System.out.println("escapedDuring=" + leaked.answer);
            answer = 42;
        }
    }
    public static void main(String[] args) {
        Child child = new Child();
        child.reportAfter();
        new Escaper();
        System.out.println("escapedAfter=" + Escaper.leaked.answer);
    }
}`,
        walkthrough: [
          { lines: "2-5", explanation: "Base constructor가 overridable report를 호출해 runtime Child override로 dispatch될 입구를 만듭니다." },
          { lines: "6-14", explanation: "Child state initializer 전에는 override가 null을 보고, construction 완료 뒤 명시 호출은 ready를 봅니다." },
          { lines: "15-23", explanation: "Escaper는 answer assignment보다 먼저 this를 static field에 저장하고 indirect field read로 default0을 관찰합니다." },
          { lines: "25-30", explanation: "같은 객체를 생성 중/완료 후 두 번 관찰해 순서를 deterministic하게 비교합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("ConstructionHazardLab.java", "ConstructionHazardLab") },
        output: { value: "overrideDuring=null\noverrideAfter=ready\nescapedDuring=0\nescapedAfter=42", explanation: ["Base constructor 시점에는 Child state initializer가 실행 전이라 null입니다.", "construction 뒤에는 Child state가 ready입니다.", "leaked.answer도 assignment 전에는 default0, constructor 종료 뒤에는 42입니다."] },
        experiments: [
          { change: "Base.report를 private helper로 바꾸고 Child override를 제거합니다.", prediction: "construction 중 subclass method dispatch가 사라집니다.", result: "constructor가 자신의 이미 준비된 state만 다루게 됩니다." },
          { change: "leaked=this를 answer=42 뒤로 옮깁니다.", prediction: "escapedDuring도 42가 됩니다.", result: "assignment 순서는 개선되지만 concurrent safe publication은 별도 edge가 필요합니다." },
          { change: "constructor에서 new Thread(() -> System.out.println(answer)).start()를 추가합니다.", prediction: "compile/실행 timing과 definite-assignment 문제를 포함한 불안정한 lifecycle이 생깁니다.", result: "thread start는 factory가 construction 완료 뒤 수행하게 분리합니다." },
        ],
        sourceRefs: ["jls-instance-creation", "jls-runtime-method-lookup", "jls-final-field-semantics", "jls-happens-before"],
      }],
      diagnostics: [
        { symptom: "Base constructor 안에서 정상인 method가 Child 생성 때만 null state로 실패한다.", likelyCause: "constructor가 overridable method를 호출해 Child initializer 전 override로 dispatch됐습니다.", checks: ["superclass constructors의 instance calls를 찾습니다.", "target method가 private/final/static인지 봅니다.", "subclass field initializer 시점을 trace합니다."], fix: "constructor에서는 private/final helper만 호출하거나 필요한 값을 superclass constructor arguments로 완전히 전달합니다.", prevention: "hierarchy test에서 subclass sentinel field와 constructor-time callback 금지를 검사합니다." },
        { symptom: "간헐적으로 registry listener가 0/null fields를 관찰한다.", likelyCause: "constructor가 this를 registry/callback/thread에 등록해 completion 전에 다른 code가 접근했습니다.", checks: ["this가 field·collection·lambda·listener로 전달되는 모든 경로를 검색합니다.", "publication happens-before edge를 확인합니다.", "등록과 construction 실패 cleanup을 봅니다."], fix: "완성된 object를 factory가 반환한 뒤 등록하고 thread-safe publication mechanism을 사용합니다.", prevention: "construct→publish lifecycle을 분리하고 constructor non-escape code review rule을 둡니다." },
      ],
      comparisons: [{ title: "생성 후 외부 등록 시점", options: [
        { name: "constructor 내부 등록", chooseWhen: "일반 application code에서는 거의 선택하지 않습니다.", avoidWhen: "observer가 즉시 callback하거나 multi-threaded일 때", tradeoffs: ["호출 한 번처럼 보임", "this escape·rollback 위험"] },
        { name: "factory가 완료 후 등록", chooseWhen: "생성과 registration을 한 transaction-like 경계로 통제할 때", avoidWhen: "registry 책임이 domain creation과 무관할 때", tradeoffs: ["완성 후 publication", "factory 책임 증가"] },
        { name: "명시 start/register", chooseWhen: "resource lifecycle과 failure를 caller가 관리해야 할 때", avoidWhen: "호출 누락이 치명적이고 type state로 강제할 수 없을 때", tradeoffs: ["단계 명확", "호출 순서 계약"] },
      ] }],
      expertNotes: ["same-thread default-value demo는 initialization order 증거이고 concurrent visibility 결과의 확률적 재현 test가 아닙니다.", "constructor에서 외부 code를 실행하는 dependency injection callback·event publish도 직접 this 저장이 없어 보여도 재진입으로 escape를 만들 수 있습니다."],
    },
    {
      id: "factory-builder-api-evolution-decisions",
      title: "constructor overload·named factory·builder를 입력 수와 API 진화 위험에 맞춰 선택합니다",
      lead: "모든 생성 패턴을 한 class에 쌓는 것이 유연성은 아니며 호출 의미와 호환성 surface를 불필요하게 넓힐 수 있습니다.",
      explanations: [
        "필수 값이 적고 positional 의미가 자명하면 constructor가 가장 단순합니다. 같은 String/int 조합이 서로 다른 domain 의미를 갖거나 defaults를 이름으로 드러내야 하면 standard·priced 같은 named factories가 call site를 더 명확하게 합니다.",
        "optional parameters가 많고 일부만 지정할 때 builder가 telescoping constructors를 줄입니다. builder는 mutable staging object이므로 build 시점에 전체 validation을 다시 수행하고, 재사용·thread safety·snapshot semantics를 문서화해야 합니다.",
        "예제 builder를 재사용해도 이미 build된 Product는 final snapshot이라 바뀌지 않습니다. builder의 price를 3000에서 3500으로 바꾼 뒤 두 번째 build는 새 Product를 만들고 first와 second identity는 다릅니다.",
        "overload 추가는 항상 source-compatible하지 않습니다. 기존 pick(null)이 pick(String) 하나일 때 compile됐어도 pick(Integer)를 추가하면 recompilation 시 unrelated reference types 사이에서 ambiguous해질 수 있습니다.",
        "이미 compile된 client는 기존 method/constructor descriptor에 link하므로 source recompilation 결과와 binary compatibility를 분리해야 합니다. 기존 public member 삭제·descriptor 변경·access 축소는 NoSuchMethodError 또는 IllegalAccessError 같은 linkage failure 위험이 있습니다.",
        "API evolution에서는 기존 overload를 즉시 삭제하기보다 deprecate→named alternative 제공→call-site migration→major-version removal 순서를 검토합니다. reflection/DI/serialization처럼 source call이 보이지 않는 consumers도 compatibility inventory에 포함합니다.",
      ],
      concepts: [
        { term: "telescoping constructor", definition: "optional parameter 조합을 표현하려 constructor overload 수가 늘고 positional arguments가 길어지는 설계입니다.", detail: ["호출 의미가 흐려집니다.", "builder/factory 대안을 검토합니다."] },
        { term: "builder snapshot", definition: "mutable builder의 현재 staged values를 검증해 독립된 완성 객체로 복사한 결과입니다.", detail: ["builder 재사용이 과거 snapshot을 바꾸지 않아야 합니다.", "build 시 invariant를 검사합니다."] },
        { term: "source vs binary compatibility", definition: "source를 다시 compile할 때의 overload 선택 가능성과 이미 compile된 descriptor가 새 library에 link되는 가능성을 구분한 호환성 축입니다.", detail: ["overload 추가도 source ambiguity를 만들 수 있습니다.", "삭제·access 축소는 binary linkage를 깨뜨릴 수 있습니다."] },
      ],
      codeExamples: [{
        id: "java-creation-api-builder-snapshots",
        title: "두 named factories와 재사용 가능한 builder가 같은 immutable Product 계약으로 모입니다",
        language: "java",
        filename: "CreationApiLab.java",
        purpose: "간단한 defaults는 factory, optional 조립은 builder로 표현하고 build마다 독립 snapshot임을 검증합니다.",
        code: String.raw`public class CreationApiLab {
    static final class Product {
        private final String code;
        private final int price;
        private final String label;
        private Product(String code, int price, String label) {
            if (code == null || code.isBlank()) throw new IllegalArgumentException("code");
            if (price <= 0) throw new IllegalArgumentException("price");
            if (label == null || label.isBlank()) throw new IllegalArgumentException("label");
            this.code = code; this.price = price; this.label = label;
        }
        static Product standard(String code) {
            return new Product(code, 1500, "STANDARD");
        }
        static Product priced(String code, int price) {
            return new Product(code, price, "STANDARD");
        }
        static Builder builder(String code) { return new Builder(code); }
        String summary() { return code + "/" + price + "/" + label; }

        static final class Builder {
            private final String code;
            private int price = 1500;
            private String label = "STANDARD";
            private Builder(String code) { this.code = code; }
            Builder price(int value) { this.price = value; return this; }
            Builder label(String value) { this.label = value; return this; }
            Product build() { return new Product(code, price, label); }
        }
    }
    public static void main(String[] args) {
        Product standard = Product.standard("P1");
        Product priced = Product.priced("P2", 2500);
        Product.Builder builder = Product.builder("P3").price(3000).label("PREMIUM");
        Product first = builder.build();
        Product second = builder.price(3500).build();
        System.out.println("standard=" + standard.summary());
        System.out.println("priced=" + priced.summary());
        System.out.println("first=" + first.summary());
        System.out.println("second=" + second.summary());
        System.out.println("same=" + (first == second));
    }
}`,
        walkthrough: [
          { lines: "2-11", explanation: "private canonical constructor가 factory와 builder 모두의 validation·final assignments를 담당합니다." },
          { lines: "12-20", explanation: "standard와 priced가 defaults의 의미를 이름으로 드러내고 builder entry를 별도로 제공합니다." },
          { lines: "22-30", explanation: "Builder는 mutable staged values를 보관하지만 build마다 immutable Product를 새로 만듭니다." },
          { lines: "33-43", explanation: "builder를 수정해 두 번째 snapshot을 만들고 값·identity를 deterministic하게 비교합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("CreationApiLab.java", "CreationApiLab") },
        output: { value: "standard=P1/1500/STANDARD\npriced=P2/2500/STANDARD\nfirst=P3/3000/PREMIUM\nsecond=P3/3500/PREMIUM\nsame=false", explanation: ["named factories가 standard default와 explicit price를 구분합니다.", "builder 변경은 second에만 반영되고 first는 3000 snapshot을 유지합니다.", "두 build 결과는 다른 identity입니다."] },
        experiments: [
          { change: "Builder.build가 validation 없이 fields를 package-private Product에 직접 대입하게 합니다.", prediction: "factory와 builder의 invalid policy가 달라질 수 있습니다.", result: "모든 creation paths를 한 canonical validation으로 모읍니다." },
          { change: "Product.builder(null).price(1)을 만들되 build를 호출하지 않습니다.", prediction: "현재 설계에서는 staging은 가능하고 build 시 code exception이 납니다.", result: "eager builder validation과 build-time validation 중 계약을 명시해야 합니다." },
          { change: "기존 create(String)에 create(Integer)를 추가하고 create(null)을 compile합니다.", prediction: "compiler.err.ref.ambiguous입니다.", result: "overload 추가가 source compatibility를 깨는 사례를 다음 harness로 고정합니다." },
        ],
        sourceRefs: ["jls-overload-applicability", "jls-most-specific", "jls-binary-methods", "jls-binary-access", "jls-constructors"],
      }],
      diagnostics: [
        { symptom: "builder로만 음수 price가 만들어지고 factory는 거부한다.", likelyCause: "build가 canonical validation을 재사용하지 않고 fields를 직접 조립했습니다.", checks: ["모든 new Product call sites를 찾습니다.", "builder build와 factories의 invalid matrix를 비교합니다.", "builder 재사용 후 snapshots를 검사합니다."], fix: "private canonical constructor/factory 하나가 최종 validation을 담당하게 합니다.", prevention: "각 creation API에 같은 parameterized invariant suite를 적용합니다." },
        { symptom: "library에 overload 하나를 추가했더니 기존 source의 null 호출이 ambiguous해진다.", likelyCause: "새 parameter type이 기존 type과 unrelated하여 한 most-specific candidate를 고를 수 없습니다.", checks: ["기존 call sites의 null·lambda·method reference를 검색합니다.", "추가 전후 javac source compatibility를 실행합니다.", "이미 compile된 client binary도 별도 link test합니다."], fix: "의미가 다른 entry는 named factory/method로 분리하고 migration 기간을 둡니다.", prevention: "public overload 추가 전 source corpus recompilation과 binary compatibility 검사를 함께 수행합니다." },
      ],
      comparisons: [{ title: "공개 생성 surface 결정", options: [
        { name: "constructor overload", chooseWhen: "2~3개 필수 inputs와 안전한 defaults가 positional하게 명확할 때", avoidWhen: "같은 types가 서로 다른 domain 의미를 가질 때", tradeoffs: ["간단한 new", "추가 overload ambiguity"] },
        { name: "named factory", chooseWhen: "creation mode·normalization·cache·subtype 선택을 이름으로 보일 때", avoidWhen: "framework가 constructor만 요구할 때", tradeoffs: ["의도와 migration path", "ordinary method compatibility 관리"] },
        { name: "builder", chooseWhen: "optional fields가 많고 독립 snapshot 조립이 필요할 때", avoidWhen: "작은 두-field value일 때", tradeoffs: ["call-site 가독성", "mutable staging과 code 비용"] },
      ] }],
      expertNotes: ["builder는 pattern이라는 이유만으로 thread-safe하지 않으며 일반적으로 한 thread/한 construction scope에 가둡니다.", "source compatibility, binary compatibility, behavioral compatibility와 serialized/reflection shape는 서로 다른 검증 축입니다."],
    },
    {
      id: "compiler-negative-construction-contract-suite",
      title: "성공 실행과 expected compile failure를 분리해 overload·constructor·this 계약을 자동 검증합니다",
      lead: "실패해야 맞는 source를 주석으로만 남기지 않고 JDK21 compiler의 line·diagnostic code까지 고정합니다.",
      explanations: [
        "overload ambiguity, implicit default 부재, 늦은 this()/super(), constructor cycle, static this, constructor invocation 전 instance field 참조는 runtime test로 갈 수 없습니다. compiler가 class 실행 전에 거부해야 하는 language contracts입니다.",
        "negative fixture는 정상 application source와 같은 compilation task에 섞지 않습니다. 각 in-memory source를 독립 JavaCompiler task로 compile하고 `ok=false`, error count1, expected line, stable diagnostic code를 함께 assertion합니다.",
        "localized human message는 JDK locale과 wording에 따라 달라질 수 있어 `compiler.err.*` code를 사용합니다. 다만 code와 source position도 compiler version contract이므로 OpenJDK 21.0.11 baseline을 명시하고 JDK upgrade 때 의도적으로 갱신합니다.",
        "모든 compiler tasks에 `--release 21`, `-proc:none`, `-Xlint:all`, `-d <GUID temp>/classes`를 전달합니다. compile failure가 일부 class를 만들 가능성까지 고려해 output을 repository/source tree와 분리합니다.",
        "cleanup은 생성 root의 normalized parent가 normalized OS temp와 정확히 같은지 먼저 확인한 뒤에만 recursive delete합니다. 예상 line/code assertion이 실패해도 finally가 실행되어 generated artifacts를 제거합니다.",
        "전체 세션 contract suite는 이 negative harness뿐 아니라 앞 장의 exact runtime outputs, reflection publicConstructors0, original scoped9 warning-free audit를 함께 포함합니다. compile success·selected branch·runtime state·API shape·cleanup을 서로 다른 assertion으로 유지합니다.",
      ],
      concepts: [
        { term: "expected compile failure", definition: "특정 source가 정해진 language rule 때문에 반드시 compile되지 않아야 통과하는 negative contract입니다.", detail: ["ok=false만으로 충분하지 않습니다.", "line·diagnostic code를 함께 봅니다."] },
        { term: "diagnostic code", definition: "javac Diagnostic.getCode가 제공하는 locale-independent compiler identifier입니다.", detail: ["human message보다 안정적입니다.", "compiler baseline에는 여전히 종속됩니다."] },
        { term: "artifact isolation", definition: "성공·실패 compiler가 만드는 모든 outputs를 source/repository 밖의 검증 전용 directory로 제한하는 원칙입니다.", detail: ["-d를 항상 명시합니다.", "safe finally cleanup을 적용합니다."] },
      ],
      codeExamples: [{
        id: "java-constructor-negative-compiler-suite",
        title: "일곱 invalid sources를 in-memory compile하고 line·code·cleanup을 assertion합니다",
        language: "java",
        filename: "ConstructorContractSuite.java",
        purpose: "overload/constructor/this의 대표 compile-time 거부 규칙과 output hygiene를 OpenJDK21 계약으로 자동화합니다.",
        code: String.raw`import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Stream;
import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;

public class ConstructorContractSuite {
    record Fixture(String name, String source, long line, String code) {}
    record CompileResult(boolean ok, long line, String code, long errorCount) {}

    static final class Source extends SimpleJavaFileObject {
        private final String text;
        Source(String name, String text) {
            super(URI.create("string:///" + name + ".java"), Kind.SOURCE);
            this.text = text;
        }
        @Override public CharSequence getCharContent(boolean ignoreEncodingErrors) {
            return text;
        }
    }

    static CompileResult compile(JavaCompiler compiler, Path classes, Fixture fixture)
            throws IOException {
        var diagnostics = new DiagnosticCollector<JavaFileObject>();
        try (StandardJavaFileManager files = compiler.getStandardFileManager(
                diagnostics, Locale.ROOT, StandardCharsets.UTF_8)) {
            boolean ok = Boolean.TRUE.equals(compiler.getTask(null, files, diagnostics,
                    List.of("--release", "21", "-proc:none", "-Xlint:all",
                            "-d", classes.toString()), null,
                    List.of(new Source(fixture.name(), fixture.source()))).call());
            var errors = diagnostics.getDiagnostics().stream()
                    .filter(d -> d.getKind() == Diagnostic.Kind.ERROR).toList();
            if (errors.isEmpty()) return new CompileResult(ok, -1, "NONE", 0);
            var first = errors.get(0);
            return new CompileResult(ok, first.getLineNumber(), first.getCode(), errors.size());
        }
    }

    static void deleteTree(Path root) throws IOException {
        try (Stream<Path> paths = Files.walk(root)) {
            for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) {
                Files.delete(path);
            }
        }
    }

    public static void main(String[] args) throws Exception {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) throw new IllegalStateException("JDK compiler required");
        Path tempBase = Path.of(System.getProperty("java.io.tmpdir")).toAbsolutePath().normalize();
        Path root = tempBase.resolve(UUID.randomUUID().toString()).normalize();
        if (!root.getParent().equals(tempBase)) throw new IllegalStateException("unsafe root");
        Files.createDirectory(root);
        try {
            Path classes = Files.createDirectory(root.resolve("classes"));
            List<Fixture> fixtures = List.of(
                new Fixture("ambiguous", """
                    class Ambiguous {
                        static void pick(Integer value) {}
                        static void pick(String value) {}
                        void test() { pick(null); }
                    }
                    """, 4, "compiler.err.ref.ambiguous"),
                new Fixture("noDefault", """
                    class OnlyArg { OnlyArg(int value) {} }
                    class UseNoArg { Object value = new OnlyArg(); }
                    """, 2, "compiler.err.cant.apply.symbol"),
                new Fixture("lateThis", """
                    class LateThis {
                        LateThis() { int value = 0; this(1); }
                        LateThis(int value) {}
                    }
                    """, 2, "compiler.err.call.must.be.first.stmt.in.ctor"),
                new Fixture("lateSuper", """
                    class Parent {}
                    class LateSuper extends Parent {
                        LateSuper() { int value = 0; super(); }
                    }
                    """, 3, "compiler.err.call.must.be.first.stmt.in.ctor"),
                new Fixture("cycle", """
                    class Cycle {
                        Cycle() { this(1); }
                        Cycle(int value) { this(); }
                    }
                    """, 3, "compiler.err.recursive.ctor.invocation"),
                new Fixture("staticThis", """
                    class StaticThis {
                        static Object self() { return this; }
                    }
                    """, 2, "compiler.err.non-static.cant.be.ref"),
                new Fixture("beforeThis", """
                    class BeforeThis {
                        int value = 1;
                        BeforeThis() { this(value); }
                        BeforeThis(int value) {}
                    }
                    """, 3, "compiler.err.cant.ref.before.ctor.called")
            );
            int checks = 0;
            for (Fixture fixture : fixtures) {
                CompileResult result = compile(compiler, classes, fixture);
                if (result.ok() || result.errorCount() != 1
                        || result.line() != fixture.line()
                        || !result.code().equals(fixture.code())) {
                    throw new AssertionError(fixture.name() + " => " + result);
                }
                checks++;
                System.out.println(fixture.name() + "=false,line=" + result.line()
                        + ",code=" + result.code());
            }
            System.out.println("checks=" + checks);
        } finally {
            Path resolved = root.toAbsolutePath().normalize();
            if (!resolved.getParent().equals(tempBase)) {
                throw new IllegalStateException("unsafe cleanup");
            }
            deleteTree(resolved);
            System.out.println("cleanup=" + !Files.exists(resolved));
        }
    }
}`,
        walkthrough: [
          { lines: "1-31", explanation: "in-memory source object와 expected fixture/result records를 만들어 repository에 invalid .java files를 저장하지 않습니다." },
          { lines: "33-48", explanation: "각 task가 JDK21·annotation processing off·Xlint·명시 temp -d로 compile되고 error diagnostics를 수집합니다." },
          { lines: "50-56", explanation: "generated class를 포함한 root를 reverse path order로 삭제하는 helper입니다." },
          { lines: "58-65", explanation: "normalized OS temp 직계 GUID child만 만들고 parent invariant를 생성 전에도 검사합니다." },
          { lines: "67-106", explanation: "일곱 fixtures가 overload ambiguity, default 부재, invocation 위치/cycle, static this, pre-construction field access를 각각 한 error로 만듭니다." },
          { lines: "108-126", explanation: "ok·error count·line·code를 모두 assertion하고 finally에서 parent를 재검사한 뒤 cleanup 결과를 출력합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11 full JDK", "OS temporary directory write permission"], command: isolatedJavaRun("ConstructorContractSuite.java", "ConstructorContractSuite") },
        output: { value: "ambiguous=false,line=4,code=compiler.err.ref.ambiguous\nnoDefault=false,line=2,code=compiler.err.cant.apply.symbol\nlateThis=false,line=2,code=compiler.err.call.must.be.first.stmt.in.ctor\nlateSuper=false,line=3,code=compiler.err.call.must.be.first.stmt.in.ctor\ncycle=false,line=3,code=compiler.err.recursive.ctor.invocation\nstaticThis=false,line=2,code=compiler.err.non-static.cant.be.ref\nbeforeThis=false,line=3,code=compiler.err.cant.ref.before.ctor.called\nchecks=7\ncleanup=true", explanation: ["모든 fixture는 exactly one expected JDK21 error로 실패합니다.", "late this/super는 같은 code라도 source line을 별도로 고정합니다.", "정상 종료 전 GUID root가 제거되어 cleanup=true입니다."] },
        experiments: [
          { change: "compiler options에서 -d를 제거합니다.", prediction: "실패 task 일부가 current working directory에 class artifact를 남길 위험이 생깁니다.", result: "negative compile에도 explicit isolated output이 필요합니다." },
          { change: "ambiguous의 Integer overload를 Number로 바꾸고 String을 유지합니다.", prediction: "Number와 String도 unrelated라 null call은 계속 ambiguous입니다.", result: "reference overload의 subtype 관계를 그려 most-specific 가능성을 판단합니다." },
          { change: "LateThis의 this(1)을 body 첫 statement로 옮깁니다.", prediction: "해당 fixture는 compile 성공해 suite가 expected-failure assertion에서 실패합니다.", result: "harness가 단순 compiler 실행이 아니라 거부 계약의 regression test임을 확인합니다." },
        ],
        sourceRefs: ["jdk21-javac", "java-compiler-api", "java-diagnostic-api", "java-files-api", "java-uuid-api", "jls-overload-applicability", "jls-default-constructor", "jls-explicit-constructor-invocation", "jls-static-context"],
      }],
      diagnostics: [
        { symptom: "negative suite가 실패했는데 실제로는 compiler가 fixture를 성공시켰다.", likelyCause: "source를 수정해 금지 조건이 사라졌거나 target JDK language rule이 달라졌습니다.", checks: ["result.ok와 errorCount를 먼저 봅니다.", "fixture source line을 그대로 저장해 비교합니다.", "javac vendor/version/options를 확인합니다."], fix: "의도한 invalid construct를 복원하거나 version migration이라면 JLS 근거와 expected diagnostic을 함께 갱신합니다.", prevention: "toolchain version과 fixture source를 reviewable code로 고정합니다." },
        { symptom: "suite 뒤 repository root에 Parent.class 같은 artifact가 남는다.", likelyCause: "failed JavaCompiler task도 일부 classes를 emit할 수 있는데 -d가 빠졌거나 cleanup target을 검증하지 않았습니다.", checks: ["모든 task options에 -d가 있는지 봅니다.", "output path가 OS temp GUID child인지 확인합니다.", "finally와 post-cleanup existence assertion을 확인합니다."], fix: "task마다 isolated -d를 강제하고 normalized parent equality 뒤 생성 root만 제거합니다.", prevention: "검증 전후 repository `.class` count0과 cleanup=true를 CI contract에 둡니다." },
      ],
      comparisons: [{ title: "언어 오류 검증 방식", options: [
        { name: "주석 속 invalid code", chooseWhen: "빠른 설명 보조일 때만", avoidWhen: "regression을 자동 검출해야 할 때", tradeoffs: ["읽기 쉬움", "실행 증거 없음"] },
        { name: "shell javac fixture", chooseWhen: "파일 단위 compiler command와 stderr를 직접 가르칠 때", avoidWhen: "수십 in-memory fixtures의 line/code 구조화가 필요할 때", tradeoffs: ["도구 그대로 관찰", "temp source 관리"] },
        { name: "JavaCompiler harness", chooseWhen: "여러 expected failures를 line·code와 함께 programmatic assertion할 때", avoidWhen: "JRE-only runtime이거나 compiler module이 없을 때", tradeoffs: ["구조화·반복 가능", "JDK/compiler version 결합"] },
      ] }],
      expertNotes: ["diagnostic code는 human message보다 안정적이지만 Java SE 표준 API가 모든 vendor의 동일 내부 code 문자열을 보장하는 것은 아니므로 pinned javac contract로 취급합니다.", "negative compilation은 application build를 깨뜨리지 않도록 별도 test source set 또는 in-memory harness에서 실행합니다."],
    },
  ],
  lab: {
    title: "합성 상품 견적 도메인을 overload 선택부터 안전한 객체 공개까지 계약으로 봉인합니다",
    scenario: "학습 포털은 P1·P2 같은 합성 상품 code로 견적 요청을 만듭니다. 편의 생성 경로는 하나의 canonical validation으로 모이고, 같은 이름의 계산 overload가 어느 선언을 선택했는지 marker로 증명해야 합니다. 생성 중 receiver를 registry·callback·thread에 노출하지 않고 완성된 immutable snapshot만 공개하며, 성공 실행뿐 아니라 모호한 overload와 잘못된 constructor chain도 JDK 21 compiler 계약으로 고정합니다.",
    setup: [
      "OpenJDK 21.0.11과 PowerShell 7+를 사용하고 production, contracttest, negativefixtures를 분리합니다.",
      "원본 Ex07·08·11~17 아홉 파일의 의미는 유지하되 이름·주소·상품 문자열은 P1·P2와 presence boolean으로 치환합니다.",
      "PriceQuote, QuoteRequest, OverloadSelector, BaseFormatter/ChildFormatter, ConstructionRegistry 역할을 먼저 적습니다.",
      "모든 compiler fixture는 system temp의 직계 GUID child와 별도 classes directory에서 `--release 21 -proc:none -encoding UTF-8 -Xlint:all -d`로 실행합니다.",
      "fixture에는 실제 개인정보·credential·로컬 절대 경로를 넣지 않고 SYNTHETIC_SECRET_SENTINEL도 privacy absence 검사용으로만 사용합니다.",
    ],
    steps: [
      "Ex07/08의 active signatures를 표로 만들고 add(100.0, 75)가 phase1 add(double,double)를 고르는 근거를 적습니다.",
      "OverloadSelector에 long, Integer, int... 및 double,double marker overloads를 두고 primitive·boxed·empty-varargs·Ex08형 호출의 selected signature를 assertion합니다.",
      "서로 관련 없는 reference overload 두 개에 null을 넘긴 negative fixture와 명시 cast로 모호성을 해소한 positive fixture를 분리합니다.",
      "BaseFormatter와 ChildFormatter에 overload와 override를 함께 두고 declared argument type이 selected signature를, runtime receiver가 implementation을 정하는 2단계 trace를 검증합니다.",
      "QuoteRequest의 no-arg와 one-arg constructors를 this()로 가장 완전한 canonical constructor에 위임하고 normalization·validation·final assignment를 한 곳에 둡니다.",
      "Parent/Child field initializer·instance initializer·constructor body에 고유 marker를 넣어 부모→자식 및 delegated-body 복귀 순서를 정확히 한 번씩 검증합니다.",
      "PriceQuote는 private constructor와 named factory를 사용해 code trim/Locale.ROOT upper, positive price·quantity 검증 뒤 immutable snapshot만 반환하게 합니다.",
      "withUnitPrice는 원본을 바꾸지 않고 새 snapshot을 반환하며 original==repriced가 false이고 두 summary가 각각 유지됨을 확인합니다.",
      "constructor에서는 overridable method, registry 등록, callback, thread 시작을 호출하지 않고 factory가 정상 완료된 객체만 ConstructionRegistry에 게시하게 합니다.",
      "reflection으로 PriceQuote의 public constructor 수가 0이고 fields가 private final인지 검사하며 정상 API가 validation을 우회하지 못함을 확인합니다.",
      "negative compiler suite에 ambiguous null, 반환형만 다른 duplicate, this()/super() 비선두, recursive this(), 호출 불가능한 implicit super(), static this를 각각 별도 source로 넣습니다.",
      "각 negative task는 ok=false뿐 아니라 기대 source 이름·1-based line·OpenJDK 21 diagnostic code를 assertion하고 모든 task에 -d temp/classes를 전달합니다.",
      "golden output은 overload marker, constructor trace, normalized product summary, exception simple name, registry count만 포함하고 Object.toString hash와 원본 개인 문자열은 포함하지 않습니다.",
      "마지막으로 clean positive compile, runtime contract, structural reflection, negative compile, privacy sentinel absence를 한 검증 보고서로 묶습니다.",
    ],
    expectedResult: [
      "primitive widening·boxing·varargs 호출이 strict→loose→variable-arity phase 순서와 일치하는 marker를 반환합니다.",
      "Ex08형 double,int 호출은 fixed double,double을 선택하고 원본의 double,int... body는 그 main에서 실행되지 않습니다.",
      "overload signature는 compile time에 선택되고 override body는 runtime receiver에 따라 선택되는 trace가 재현됩니다.",
      "모든 constructor overload가 같은 validation과 final assignment에 도달하고 invalid 요청은 객체나 registry entry를 남기지 않습니다.",
      "한 new에서 superclass와 current-class initializers는 정의된 순서로 각각 한 번 실행되고 this() bodies만 역순으로 복귀합니다.",
      "immutable update 뒤 original과 repriced는 다른 identity이며 P1:1500과 P1:1800 snapshot을 각각 유지합니다.",
      "완성 전 this 노출 marker는 0이고 정상 factory 반환 뒤 registry count만 1이 됩니다.",
      "negative fixtures는 OpenJDK 21의 기대 source·line·diagnostic code에서 실패하고 production sources는 warning 없이 compile됩니다.",
      "공개 output에는 실제 이름·주소·상품 문자열·identity hash·secret sentinel·로컬 절대 경로가 없습니다.",
    ],
    cleanup: [
      "resolved root의 parent가 normalized system temp와 정확히 같은지 확인한 뒤 해당 GUID root만 재귀 제거합니다.",
      "classes·negative sources·compiler reports가 남지 않았는지 확인하고 저장소 전체의 .class 잔여물을 검사합니다.",
      "javastudy2 원본과 학습 세션 source는 lab 실행 중 수정하지 않습니다.",
    ],
    extensions: [
      "primitive/reference overload가 늘어날 때 source compatibility가 어떻게 달라지는지 client recompile matrix를 추가합니다.",
      "sealed request types나 의미 있는 method names로 위험한 overload family를 치환하고 호출 가독성을 비교합니다.",
      "builder의 build()에서만 validation·publication을 허용하고 builder 자체 this escape와 alias를 검사합니다.",
      "final field가 mutable collection을 가리키는 경우 List.copyOf와 element deep-copy 정책을 추가합니다.",
      "JCStress 같은 도구를 별도 검토해 constructor escape와 safe-publication 실험을 확장하되 단일 stress 통과를 증명으로 과장하지 않습니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "Ex07/08을 개인정보 없는 marker overload 실험으로 다시 만들고 다섯 호출의 선택 이유를 phase별로 증명하세요.", requirements: ["add(), add(int), add(int,int), add(double,double), add(double,int...)를 서로 다른 marker로 식별합니다.", "add(100.0,75)가 fixed double,double임을 assertion합니다.", "double,double을 제거했을 때만 varargs로 넘어가는 실험을 추가합니다.", "OpenJDK 21.0.11 -Xlint:all clean compile과 exact output을 남깁니다."], hints: ["runtime 값의 모양보다 argument compile-time type을 먼저 적으세요.", "처음 non-empty applicability phase에서 뒤 phase는 비교하지 않습니다."], expectedOutcome: "Ex08의 175.0을 값 우연이 아니라 selected signature marker와 JLS phase 순서로 설명합니다.", solutionOutline: ["signature inventory", "phase1 후보", "marker 실행", "candidate 제거 실험"] },
    { difficulty: "응용", prompt: "Ex14~17의 부분 초기화·setter 중심 Product를 canonical constructor와 immutable named factory 설계로 리팩터링하세요.", requirements: ["code는 trim과 Locale.ROOT upper 뒤 nonblank, price는 positive invariant로 둡니다.", "private constructor 하나에 final assignment를 모으고 public constructor 수 0을 reflection으로 확인합니다.", "of와 withPrice가 같은 validation을 사용하고 실패 시 기존 snapshot과 registry가 변하지 않게 합니다.", "Object.toString hash와 원본 상품 문자열 대신 P1·P2 summary와 == 결과만 출력합니다."], hints: ["normalization 결과를 validation한 뒤 constructor에 넘기세요.", "final reference가 mutable component의 deep immutability까지 보장하지는 않습니다."], expectedOutcome: "모든 공개 생성·변경 경로가 같은 invariant를 지키고 완성된 서로 다른 immutable snapshots만 노출됩니다.", solutionOutline: ["invariant 정의", "factory normalization", "private canonical constructor", "behavior/structural/privacy tests"] },
    { difficulty: "설계", prompt: "overload·constructor chain·상속 초기화·publication을 함께 가진 견적 subsystem의 API 및 검증 architecture를 설계하세요.", requirements: ["각 overload의 필요성과 ambiguity/source-compatibility 위험을 표로 만듭니다.", "constructor delegation graph가 acyclic이고 모든 path가 canonical invariant에 도달함을 보입니다.", "overridable call·registry·callback·thread를 constructor 밖으로 옮긴 publication boundary를 정의합니다.", "positive runtime, structural reflection, negative compiler, privacy, initialization-trace tests를 분리합니다.", "JDK 21 diagnostic code를 pin하고 compiler outputs는 temp -d로 격리합니다."], hints: ["생성 편의성보다 invalid/partial object가 공개될 수 있는 경로부터 찾으세요.", "overload 선택과 override dispatch를 한 단계로 설명하지 마세요."], expectedOutcome: "호출 선택·객체 구성·완성 후 공개의 각 책임과 실패 채널이 source/API/test matrix에 드러납니다.", solutionOutline: ["API candidate table", "constructor DAG", "initialization trace", "publication boundary", "five-layer contract suite"] },
  ],
  reviewQuestions: [
    { question: "method signature에 return type과 parameter name이 포함되나요?", answer: "아닙니다. overload 판단의 핵심 signature는 method name과 adapted formal parameter types이며 return type, parameter name, access modifier, static 여부만 바꿔서는 새 overload가 되지 않습니다." },
    { question: "overload applicability의 세 phase는 어떤 순서인가요?", answer: "strict fixed arity, loose fixed arity, variable arity 순서이며 처음 applicable candidate 집합이 생긴 phase에서 멈춥니다." },
    { question: "int argument에서 long과 Integer overload가 모두 보이면 무엇이 선택되나요?", answer: "int→long primitive widening이 phase1에서 가능하므로 long이 선택되고 boxing이 필요한 Integer phase까지 가지 않습니다." },
    { question: "왜 Ex08의 add(100.0,75)는 add(double,int...)가 아닌가요?", answer: "75가 int에서 double로 widening되어 fixed-arity add(double,double)가 phase1에서 applicable하므로 phase3 varargs를 검토하지 않습니다." },
    { question: "한 phase 안에서 후보가 둘 이상이면 compiler가 임의로 고르나요?", answer: "아닙니다. most-specific 하나를 찾고 유일한 승자가 없으면 ambiguous invocation으로 compile을 거부합니다." },
    { question: "null을 reference overload에 넘기면 항상 모호한가요?", answer: "아닙니다. String과 Object처럼 더 구체적인 후보가 있으면 String이 선택되지만 서로 무관한 sibling reference types면 유일한 most-specific이 없어 모호할 수 있습니다." },
    { question: "cast가 overload 선택에 미치는 영향은 무엇인가요?", answer: "객체 identity를 바꾸는 것이 아니라 argument expression의 compile-time type을 명시해 candidate applicability와 most-specific 결과를 바꿉니다." },
    { question: "overload와 override가 한 호출에 함께 있으면 언제 무엇이 결정되나요?", answer: "먼저 receiver와 arguments의 compile-time types로 signature를 선택하고, 그 selected instance signature의 실제 body는 runtime receiver class에서 lookup합니다." },
    { question: "constructor를 반환형 없는 method라고 정의하면 왜 부정확한가요?", answer: "constructor declaration은 이름·호출 문법·상속·반환 규칙이 method declaration과 다른 JLS 문법 요소이며 return type을 생략한 method가 아닙니다." },
    { question: "implicit default constructor는 언제 생기나요?", answer: "class에 constructor declaration이 하나도 없을 때만 compiler가 만듭니다. parameterized constructor 하나라도 선언하면 자동 no-arg는 생기지 않습니다." },
    { question: "no-arg constructor와 default constructor는 같은 말인가요?", answer: "아닙니다. no-arg는 parameter가 없다는 형태이고 default constructor는 compiler가 조건부로 암시 선언한 constructor를 뜻합니다. Ex12의 no-arg는 source에 명시돼 있습니다." },
    { question: "implicit default constructor가 있어도 subclass compile이 실패할 수 있나요?", answer: "그렇습니다. 생성된 constructor가 암시적으로 호출할 direct-super no-arg constructor가 없거나 접근 불가능하면 compile error가 납니다." },
    { question: "JDK 21에서 this()나 super() 앞에 일반 statement를 둘 수 있나요?", answer: "없습니다. 이 세션은 JDK 21 규칙을 pin하며 explicit constructor invocation은 constructor body의 첫 statement여야 합니다." },
    { question: "한 constructor에서 this()와 super()를 모두 직접 호출할 수 있나요?", answer: "아닙니다. explicit invocation은 하나이고 this() target이 결국 superclass constructor chain에 도달합니다." },
    { question: "recursive this() cycle은 runtime stack overflow가 되나요?", answer: "아닙니다. compiler가 recursive constructor invocation으로 거부하므로 정상 class file이 만들어지지 않습니다." },
    { question: "한 Child 객체의 초기화 큰 순서는 무엇인가요?", answer: "allocation과 field default values 뒤 superclass constructor processing이 완료되고, 현재 class field/instance initializers가 textual order로 실행된 다음 현재 constructor body가 이어집니다." },
    { question: "this() chain이 길면 current-class field initializer도 여러 번 실행되나요?", answer: "아닙니다. 한 new는 한 receiver를 만들고 그 class의 field/instance initializers는 한 번 실행되며 delegated constructor bodies만 호출 경로를 따라 복귀합니다." },
    { question: "this와 this(arguments)는 같은 기능인가요?", answer: "this는 current receiver expression이고 this(arguments)는 constructor body 첫 줄에서 같은 class의 다른 constructor를 호출하는 explicit invocation입니다." },
    { question: "parameter와 field 이름이 같을 때 this.field를 쓰는 이유는 무엇인가요?", answer: "simple name은 안쪽 parameter declaration으로 해석되므로 receiver-qualified this.field로 가려진 field를 명시하기 위해서입니다." },
    { question: "Object.toString의 Type@hex는 memory address인가요?", answer: "아닙니다. 기본 toString이 class name과 hash code의 unsigned hexadecimal 표현을 합친 문자열일 뿐이며 identity 검증은 ==로 해야 합니다." },
    { question: "named static factory가 constructor보다 유리한 경우는 언제인가요?", answer: "normalization·validation·의미 있는 이름·cache 또는 subtype 반환 정책을 공개 생성 경계에 모아야 할 때 유리합니다." },
    { question: "모든 field가 final이면 deep immutable인가요?", answer: "아닙니다. final은 field 재대입을 막지만 참조한 collection·array·element의 내부 변경은 막지 않으므로 defensive immutable snapshot 정책이 필요합니다." },
    { question: "constructor에서 overridable method나 callback을 호출하면 무엇이 위험한가요?", answer: "subclass override나 외부 observer가 아직 초기화되지 않은 fields를 보고 this가 정상 완료 전 escape할 수 있어 invariant와 safe-publication reasoning이 깨집니다." },
    { question: "compile-fail fixture는 ok=false만 확인하면 충분한가요?", answer: "아닙니다. 엉뚱한 문법 오류도 실패하므로 기대 source·line·diagnostic code를 JDK 21에 맞춰 확인하고 -d temp output으로 partial class emission도 격리해야 합니다." },
  ],
  completionChecklist: [
    "Ex07·08·11~17 아홉 sources의 active code와 comments를 모두 읽었다.",
    "class03 전체17과 OOP04 범위9를 별도 output directory에서 OpenJDK 21.0.11 UTF-8·Xlint warning-free compile했다.",
    "Ex08의 150·200·350·320.45·175.0 다섯 값을 exact output으로 재현했다.",
    "Ex11의 ‘constructor는 반환형 없는 method’ 비유를 JLS의 별도 declaration 모델로 교정했다.",
    "Ex13 주석과 달리 Ex12 no-arg constructor가 source에 명시돼 있음을 확인했다.",
    "Ex13의 이름·주소는 공개하지 않고 presence와 ages 34·57·512만 보존했다.",
    "Ex15는 text presence와 prices 1500·2500으로 privacy-safe 검증했다.",
    "Ex17의 두 Object.toString suffix를 <id>로 정규화하고 같은 reference인지는 == 의미로 별도 확인했다.",
    "method signature에 return type·parameter name·access modifier·static 여부가 포함되지 않음을 설명했다.",
    "strict fixed→loose fixed→variable arity 세 applicability phases를 순서대로 적용했다.",
    "primitive widening이 boxing보다 앞 phase에서 선택될 수 있음을 marker test로 확인했다.",
    "fixed-arity 후보가 있으면 varargs 후보를 비교하지 않음을 Ex08형 호출로 증명했다.",
    "null과 무관한 sibling reference overload의 ambiguity 및 명시 cast 해소를 compile tests로 확인했다.",
    "overload selected signature가 argument의 runtime value가 아니라 compile-time type에 의해 정해짐을 설명했다.",
    "selected instance signature의 override body는 runtime receiver type으로 lookup됨을 별도 trace로 확인했다.",
    "constructor declaration이 method declaration과 다른 문법 요소임을 설명했다.",
    "constructor declaration이 하나도 없을 때만 implicit default constructor가 생김을 확인했다.",
    "명시 no-arg constructor와 compiler-declared default constructor를 구분했다.",
    "direct superclass의 accessible no-arg path가 없으면 implicit super()가 compile 실패함을 확인했다.",
    "JDK 21에서 this()/super()는 constructor body 첫 statement이고 둘을 함께 직접 호출할 수 없음을 설명했다.",
    "recursive this() constructor graph가 compile-time에 거부됨을 확인했다.",
    "모든 편의 constructor를 acyclic this() chain으로 canonical validation path에 모았다.",
    "allocation default values→superclass processing→현재 class initializers→constructor body 순서를 추적했다.",
    "한 new의 current-class field/instance initializers가 this() chain 길이와 무관하게 한 번 실행됨을 확인했다.",
    "current receiver expression this와 alternate-constructor invocation this(arguments)를 구분했다.",
    "parameter shadowing에서 this.field가 receiver field를 명시함을 state test로 확인했다.",
    "Object.toString의 Type@hex를 memory address로 설명하지 않았다.",
    "private canonical constructor와 reflection 검사로 공개 constructor 우회 경로가 0임을 확인했다.",
    "normalize→validate→final assignment 순서와 immutable withPrice snapshot 계약을 검증했다.",
    "final reference와 mutable component의 deep immutability를 구분했다.",
    "invalid construction이 object·registry·기존 snapshot을 바꾸지 않는 failure atomicity를 확인했다.",
    "constructor에서 overridable method·registry 등록·callback·thread start로 this를 노출하지 않았다.",
    "각 negative compiler task가 기대 source·1-based line·OpenJDK 21 diagnostic code에서 실패하고 모든 task에 -d를 전달했다.",
    "system temp 직계 GUID root만 사용하고 resolved parent를 검증한 뒤 안전하게 cleanup했다.",
    "공개 code·output·diagnostic에 실제 개인정보·credential·원본 개인 문자열·identity hash·로컬 절대 경로가 없음을 확인했다.",
  ],
  nextSessions: [],
  sources: [
    { id: "java-class03-ex07", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex07_MethodDemo.java", usedFor: ["five active overloads", "fixed versus varargs", "commented signature"], evidence: "add(), add(int), add(int,int), add(double,double), add(double,int...) 다섯 active declarations와 commented add(double,int)를 읽었고 varargs body가 a+100임을 확인했습니다." },
    { id: "java-class03-ex08", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex08_MethodMain.java", usedFor: ["five overload calls", "exact golden output", "double,int selection"], evidence: "clean run이 150·200·350·320.45·175.0을 출력하며 마지막 add(100.0,75)는 fixed double,double을 선택함을 marker 실험으로 교차 확인했습니다." },
    { id: "java-class03-ex11", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex11_Constructor.java", usedFor: ["constructor concept comments", "method misconception correction", "default constructor wording"], evidence: "active constructor/main이 없는 comment-only class이며 ‘특수한 method’, ‘반환형 없는 method’, ‘기본생성자는 인자 없는 생성자’ 표현을 실제 JLS 정의와 분리했습니다." },
    { id: "java-class03-ex12", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex12_ConstructorDemo.java", usedFor: ["explicit no-arg constructor", "three-arg constructor", "field initializer then constructor assignment"], evidence: "field initializers 뒤 명시 no-arg와 String,int,String constructors가 fields를 다시 대입하므로 Ex13의 compiler-generated 주석과 모순됨을 확인했습니다. 개인 literals는 복제하지 않았습니다." },
    { id: "java-class03-ex13", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex13_ConstructorMain.java", usedFor: ["three construction paths", "default-constructor comment correction", "privacy-safe golden"], evidence: "두 no-arg와 한 three-arg 생성 결과가 9행이며 ages 34·57·512입니다. 이름·주소는 nonblank presence로만 검증했습니다." },
    { id: "java-class03-ex14", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex14_ConstructorDemo.java", usedFor: ["four constructor overloads", "partial initialization risk", "mutable setter contrast"], evidence: "no-arg·String·int·String,int 네 public constructors와 unrestricted setters를 확인했고 단일-argument paths가 name empty 또는 price0을 남길 수 있음을 invariant 설계로 확장했습니다." },
    { id: "java-class03-ex15", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex15_ConstructorMain.java", usedFor: ["no-arg and full constructor execution", "getter output", "privacy normalization"], evidence: "no-arg와 String,int 두 paths가 4행을 출력하며 prices는 1500·2500입니다. 상품 text는 presence로만 보존했습니다." },
    { id: "java-class03-ex16", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex16_ThisDemo.java", usedFor: ["this receiver", "this(2500) delegation", "parameter shadowing", "four constructor overloads"], evidence: "no-arg·String·int·String,int constructors, String path의 this(2500), this.field assignments와 constructor this 출력을 확인했습니다." },
    { id: "java-class03-ex17", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex17_ThisMain.java", usedFor: ["constructor and caller identity", "two construction paths", "normalized output"], evidence: "6행 실행에서 constructor this와 caller demo가 같은 reference이고 prices가 1500·2500임을 확인했습니다. identity hash는 Ex16_ThisDemo@<id>, product text는 presence로 정규화했습니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["JDK 21 clean compilation", "-Xlint:all", "--release 21", "negative diagnostic contracts"], evidence: "class03 전체17·범위9·모든 예제와 expected-fail fixture의 OpenJDK 21.0.11 기준 및 explicit -d 격리 근거입니다." },
    { id: "jls-method-signature", repository: "JLS SE 21", path: "8.4.2 Method Signature", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.2", usedFor: ["overload legality", "return/parameter-name exclusion"], evidence: "method name과 adapted formal parameter types로 signature를 판단하는 primary specification입니다." },
    { id: "jls-overload-applicability", repository: "JLS SE 21", path: "15.12.2 Compile-Time Step 2", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.2", usedFor: ["strict/loose/variable phases", "potential applicability", "ambiguous invocation"], evidence: "처음 성공한 applicability phase에서 후보 집합을 정하는 근거입니다." },
    { id: "jls-most-specific", repository: "JLS SE 21", path: "15.12.2.5 Choosing the Most Specific Method", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.2.5", usedFor: ["unique overload winner", "null reference specificity"], evidence: "한 phase 안 applicable 후보들에서 유일한 most-specific method를 찾는 근거입니다." },
    { id: "jls-widening-primitive", repository: "JLS SE 21", path: "5.1.2 Widening Primitive Conversion", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.2", usedFor: ["int to long/double", "Ex08 fixed selection"], evidence: "75 int가 double로 widening되어 phase1 fixed candidate를 만족하는 변환 근거입니다." },
    { id: "jls-boxing", repository: "JLS SE 21", path: "5.1.7 Boxing and 5.1.8 Unboxing Conversion", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.7", usedFor: ["loose invocation", "primitive/wrapper overloads"], evidence: "boxing/unboxing을 primitive widening과 별 phase로 비교하는 language 근거입니다." },
    { id: "jls-varargs", repository: "JLS SE 21", path: "15.12.2.4 Variable Arity Methods", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.2.4", usedFor: ["phase3 applicability", "zero/many trailing arguments"], evidence: "fixed phases가 모두 실패한 뒤 variable-arity invocation을 적용하는 근거입니다." },
    { id: "jls-null-type", repository: "JLS SE 21", path: "4.1 The Kinds of Types and Values", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.1", usedFor: ["null type", "reference overload ambiguity"], evidence: "null type이 reference conversions에는 참여하지만 primitive type 값은 아닌 근거입니다." },
    { id: "jls-casting", repository: "JLS SE 21", path: "5.5 Casting Contexts", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.5", usedFor: ["explicit argument type", "ambiguity resolution experiments"], evidence: "cast expression의 compile-time type이 overload candidate 선택을 바꾸는 근거입니다." },
    { id: "jls-invocation-context", repository: "JLS SE 21", path: "5.3 Invocation Contexts", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.3", usedFor: ["strict and loose conversions", "method/constructor argument conversion"], evidence: "method와 constructor invocation에서 허용되는 conversion categories의 공통 근거입니다." },
    { id: "jls-overriding", repository: "JLS SE 21", path: "8.4.8.1 Overriding in Subclasses", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8.1", usedFor: ["override relation", "subclass implementation"], evidence: "subclass instance method가 inherited signature를 override하는 선언 관계의 근거입니다." },
    { id: "jls-runtime-method-lookup", repository: "JLS SE 21", path: "15.12.4.4 Locate Method to Invoke", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.4", usedFor: ["runtime receiver dispatch", "selected signature implementation"], evidence: "compile-time에 선택한 instance signature의 body를 runtime receiver class에서 찾는 근거입니다." },
    { id: "jls-constructors", repository: "JLS SE 21", path: "8.8 Constructor Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.8", usedFor: ["constructor syntax", "constructor versus method", "constructor body"], evidence: "constructor declaration이 method와 별개이며 class instance 초기화를 담당하는 primary specification입니다." },
    { id: "jls-constructor-overloading", repository: "JLS SE 21", path: "8.8.8 Constructor Overloading", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.8.8", usedFor: ["constructor signatures", "overloaded creation paths"], evidence: "constructor overload resolution이 method invocation과 유사한 compile-time 규칙을 쓰는 근거입니다." },
    { id: "jls-default-constructor", repository: "JLS SE 21", path: "8.8.9 Default Constructor", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.8.9", usedFor: ["implicit default condition", "accessibility", "implicit super failure"], evidence: "constructor declaration이 전혀 없을 때만 default constructor가 암시 선언되는 근거입니다." },
    { id: "jls-explicit-constructor-invocation", repository: "JLS SE 21", path: "8.8.7.1 Explicit Constructor Invocations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.8.7.1", usedFor: ["this()/super() first statement", "delegation", "recursive invocation rejection"], evidence: "JDK 21 constructor body의 alternate/super invocation 위치와 금지 사항 근거입니다." },
    { id: "jls-instance-creation", repository: "JLS SE 21", path: "12.5 Creation of New Class Instances", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.5", usedFor: ["allocation/default values", "superclass/current-class initialization order", "abrupt completion"], evidence: "new instance의 superclass processing부터 field/initializer/body 순서까지 설명하는 근거입니다." },
    { id: "jls-instance-initializers", repository: "JLS SE 21", path: "8.6 Instance Initializers", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.6", usedFor: ["instance initializer blocks", "per-new execution", "abrupt completion"], evidence: "비-static initializer block의 실행 및 checked-exception 제약과 constructor processing 연결 근거입니다." },
    { id: "jls-field-initialization", repository: "JLS SE 21", path: "8.3.2 Field Initialization", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.3.2", usedFor: ["field initializer textual order", "default-to-explicit value transition"], evidence: "instance field initializer의 실행 시점과 forward-reference 관련 field semantics 근거입니다." },
    { id: "jls-this", repository: "JLS SE 21", path: "15.8.3 this", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.8.3", usedFor: ["current receiver", "shadow disambiguation", "qualified this"], evidence: "this expression이 현재 객체를 가리키는 범위와 의미의 primary specification입니다." },
    { id: "jls-static-context", repository: "JLS SE 21", path: "8.1.3 Inner Classes and Enclosing Instances", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.3", usedFor: ["static context", "static this compile failure", "pre-construction context"], evidence: "static context와 early construction context에서 current this 사용이 제한되는 근거입니다." },
    { id: "jls-final-field-semantics", repository: "JLS SE 21", path: "17.5 final Field Semantics", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.5", usedFor: ["constructor completion freeze", "safe final-field observation", "this escape caveat"], evidence: "final fields의 특별한 memory-model 보장과 constructor 안 reference 노출 시 reasoning이 깨지는 근거입니다." },
    { id: "jls-happens-before", repository: "JLS SE 21", path: "17.4.5 Happens-before Order", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5", usedFor: ["safe publication", "visibility ordering", "thread-start publication"], evidence: "constructor 종료만으로 일반 mutable state의 cross-thread publication 전체가 자동 보장되는 것은 아니며 명시 synchronization edge가 필요하다는 근거입니다." },
    { id: "jls-binary-methods", repository: "JLS SE 21", path: "13.4.12 Method and Constructor Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-13.html#jls-13.4.12", usedFor: ["method/constructor evolution", "binary linkage risk"], evidence: "기존 binary가 사용하는 method·constructor 선언 삭제/변경 위험을 분석하는 근거입니다." },
    { id: "jls-binary-access", repository: "JLS SE 21", path: "13.4.7 Access to Members and Constructors", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-13.html#jls-13.4.7", usedFor: ["constructor access reduction", "binary compatibility"], evidence: "public/protected member나 constructor의 접근 축소가 pre-existing binaries에 미치는 영향 근거입니다." },
    { id: "java-object-tostring", repository: "Java SE 21 API", path: "java.lang.Object.toString", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#toString()", usedFor: ["Type@hex format", "identity-hash normalization"], evidence: "기본 toString이 class name, @, hashCode의 unsigned hexadecimal 표현을 조합하며 memory address 계약이 아님을 확인하는 API 근거입니다." },
    { id: "java-locale-root", repository: "Java SE 21 API", path: "java.util.Locale.ROOT", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Locale.html#ROOT", usedFor: ["locale-neutral product-code normalization"], evidence: "합성 code upper normalization이 실행 locale에 따라 달라지지 않게 하는 official API 근거입니다." },
    { id: "java-reflection-constructor", repository: "Java SE 21 API", path: "java.lang.reflect.Constructor", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Constructor.html", usedFor: ["constructor shape", "public-constructor structural test"], evidence: "declared constructors와 modifier를 inspect해 public validation bypass가 없는지 확인하는 API 근거입니다." },
    { id: "java-modifier", repository: "Java SE 21 API", path: "java.lang.reflect.Modifier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Modifier.html", usedFor: ["public/private/final structural assertions"], evidence: "reflection modifier bit를 isPublic/isPrivate/isFinal로 판정하는 official API 근거입니다." },
    { id: "java-compiler-api", repository: "Java SE 21 API", path: "javax.tools.JavaCompiler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/JavaCompiler.html", usedFor: ["in-process expected-fail tasks", "explicit compiler options", "isolated -d output"], evidence: "negative sources를 production build와 분리해 programmatic compile하는 API 근거입니다." },
    { id: "java-diagnostic-api", repository: "Java SE 21 API", path: "javax.tools.Diagnostic", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/Diagnostic.html", usedFor: ["diagnostic kind", "source line", "pinned code"], evidence: "compiler diagnostic의 kind·line number·code를 구조적으로 검증하는 API 근거입니다." },
    { id: "java-files-api", repository: "Java SE 21 API", path: "java.nio.file.Files", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["temp directory creation", "safe reverse-order cleanup", "artifact absence"], evidence: "GUID temp root 생성·존재 확인·walk 기반 cleanup을 수행하는 official API 근거입니다." },
    { id: "java-uuid-api", repository: "Java SE 21 API", path: "java.util.UUID", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/UUID.html", usedFor: ["collision-resistant temp child name"], evidence: "system temp의 직접 child에 검증 실행별 고유 root 이름을 만드는 API 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 9,
    filesUsed: 9,
    uncoveredNotes: [
      "inventory가 직접 지정한 Ex07·11·14·16 네 files와 그 선언·실행 companion인 Ex08·12·13·15·17 다섯 files를 함께 읽어 범위9의 active code와 comments를 모두 semantic evidence에 사용했습니다.",
      "dependency drift를 잡기 위해 class03 전체17을 package smoke compile하고, 세션 책임 범위9를 별도 classes directory에 OpenJDK 21.0.11 -encoding UTF-8 -Xlint:all로 clean compile했습니다.",
      "범위9에는 runnable mains Ex08·13·15·17 네 개와 compile-only Ex07·11·12·14·16 다섯 개가 있으며 역할을 서로 바꾸어 세지 않았습니다.",
      "Ex08 exact output은 150·200·350·320.45·175.0입니다. 마지막 add(100.0,75)는 int 75의 double widening으로 phase1 add(double,double)가 선택되고 Ex07의 double,int... body는 원본 main에서 호출되지 않습니다.",
      "Ex11의 constructor 설명은 source comment evidence로 남기되 constructor를 method로 정의한 표현과 no-arg/default 동의어 사용은 JLS 8.8·8.8.9로 교정했습니다.",
      "Ex12에는 no-arg와 three-arg constructors가 모두 명시돼 있어 Ex13의 ‘생성자를 만들지 않아 compiler가 기본 생성자를 제공’한다는 주석은 active source와 모순됨을 명시했습니다.",
      "Ex13의 9행은 names/addresses nonblank presence와 ages 34·57·512로만, Ex15의 4행은 products presence와 prices 1500·2500으로만 검증해 원본 개인·주소·상품 문자열을 복제하지 않았습니다.",
      "Ex14의 String-only/int-only constructors가 price0/name-empty 부분 상태를 허용하고 setters도 validation이 없으므로 canonical validation과 immutable factory는 공식 문서로 보충한 설계 확장입니다.",
      "Ex16/17의 constructor this와 caller demo가 같은 reference임은 보존하되 Object.toString hash는 Ex16_ThisDemo@<id>로 정규화하고 상품 text는 presence만 남겼습니다.",
      "widening·boxing·varargs·null ambiguity·compile-time overload/runtime override·constructor order·final-field publication·binary compatibility는 원본이 충분히 설명하지 않는 범위라 JLS SE 21과 Java SE 21 API로 보충했습니다.",
      "negative compiler diagnostics는 Java 언어 표준이 보장하는 portable text가 아니라 OpenJDK 21.0.11 pinned regression contract로 표시하고 source·1-based line·code·exactly-one-error를 함께 검사했습니다.",
      "모든 JavaCompiler task에 explicit -d temp/classes를 전달해 expected-fail 중 partial class emission이 저장소 root로 새지 않게 했고, normalized OS temp direct-child invariant 뒤 GUID root만 cleanup했습니다.",
      "실제 개인정보·credential·로컬 절대 경로·비결정적 identity hash는 공개 code/output/evidence에 포함하지 않았으며 P1·P2·example.test 같은 synthetic values만 사용했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
