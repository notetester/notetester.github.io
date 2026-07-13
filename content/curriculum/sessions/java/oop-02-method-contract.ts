import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["oop-02-method-contract"],
  slug: "oop-02-method-contract",
  courseId: "java",
  moduleId: "java-oop-design",
  order: 12,
  title: "메서드·인자·반환과 값 전달",
  subtitle: "declaration·signature·receiver·평가 순서·pass-by-value·overload·return/exception 계약을 검증하고 입력·계산·출력을 분리합니다.",
  level: "기초",
  estimatedMinutes: 540,
  coreQuestion: "호출자가 무엇을 전달하고 메서드가 무엇을 보장해 돌려주는지, shared mutation·호출 순서·입력 소유권을 숨기지 않는 계약으로 어떻게 표현할까요?",
  summary: "javastudy2 class02 Ex01~Ex11 전체를 OpenJDK 21.0.11에서 clean compile했습니다. Ex02·04·06·08·10은 반환형·void·overload·Scanner orchestration 흐름을 실행하고, Ex11은 학생마다 새 Scanner(System.in)을 만들어 deterministic 3명 입력에서 두 번째 학생에 NoSuchElementException으로 실패합니다. 첫 Scanner가 뒤 token까지 buffer할 수 있기 때문입니다. 원본의 ‘return은 마지막 줄’, instance/static method가 객체별로 만들어진다는 설명, signature 단순화를 교정합니다. 이어 method anatomy·receiver/this·왼쪽→오른쪽 evaluation·primitive/reference/array value 전달·varargs·early return/throw·overload resolution·pure return vs stateful void chain·recursion depth·single input owner와 typed result contract까지 확장합니다.",
  objectives: [
    "method declaration의 modifiers·result·name·formal parameters·throws·body와 Java signature를 구분할 수 있다.",
    "instance receiver·this·static class context와 정상 return 뒤 caller continuation을 trace할 수 있다.",
    "receiver·argument expressions의 왼쪽에서 오른쪽 evaluation과 exception short-circuit를 설명할 수 있다.",
    "primitive·reference·array 모두 value로 전달되며 rebind와 target mutation 효과가 다름을 구현할 수 있다.",
    "varargs packaging·aliasing·null/overload ambiguity와 array mutation 위험을 진단할 수 있다.",
    "모든 reachable normal paths의 return, early exit·throw·finally를 method contract로 설계할 수 있다.",
    "overload applicability·widening·boxing·varargs·most-specific·ambiguity를 compile fixtures로 검증할 수 있다.",
    "pure core·single input owner·typed results로 order-dependent void chain과 multi-Scanner defect를 제거할 수 있다.",
  ],
  prerequisites: [{ title: "클래스·객체·참조와 instance/static 상태", reason: "메서드 호출은 receiver object와 class state·reference alias·invariant 위에서 실행됩니다.", sessionSlug: "oop-01-class-object" }],
  keywords: ["method", "signature", "receiver", "this", "parameter", "argument", "evaluation order", "pass-by-value", "return", "void", "exception", "overload", "varargs", "pure function", "side effect", "recursion", "Scanner ownership", "contract"],
  chapters: [
    {
      id: "eleven-source-golden-audit",
      title: "class02 11개 원본의 여섯 mains와 Ex11 입력 소유권 실패를 감사합니다",
      lead: "원본 이름은 공개하지 않고 synthetic labels·numeric results·failure type만 보존합니다.",
      explanations: [
        "Ex01·03·05·07·09는 demo classes, Ex02·04·06·08·10·11은 mains이며 전체 11개가 한 progression입니다.",
        "Ex02는 14행으로 play01 호출 안 print 뒤 total260·average86.6·B와 void methods·sum field update를 보여 줍니다.",
        "Ex04는 overload/parameter pipeline으로 total250·83.3·B를 4행에 출력합니다. header text는 presence만 공개합니다.",
        "Ex06은 return-based service, Ex08은 order-dependent void fields, Ex10은 chained void calls를 synthetic S1·80·85·85에서 모두 total250·83.3·B로 재현할 수 있습니다.",
        "Ex11은 Ex09 object array 세 개가 각각 새 Scanner(System.in)을 만듭니다. 한 번에 공급한 3명 token에서 첫 Scanner가 ahead buffer해 둘째 Scanner가 NoSuchElementException을 냅니다.",
        "이 실패는 fixture 오류가 아니라 shared stream을 여러 buffered readers가 소유한 설계 결함입니다. outer application이 Scanner 하나를 만들고 inputData(scanner)에 주입해야 합니다.",
      ],
      concepts: [
        { term: "demo/main pair", definition: "method를 선언하는 class와 생성·호출·출력을 담당하는 executable class의 원본 쌍입니다.", detail: ["compile dependency를 보존합니다.", "responsibility를 비교합니다."] },
        { term: "partial stdout evidence", definition: "process failure 전까지 나온 output과 exit·exception을 함께 보존한 근거입니다.", detail: ["성공으로 오인하지 않습니다.", "Ex11 defect를 재현합니다."] },
        { term: "input owner", definition: "한 underlying stream의 reader 생성·buffering·close lifetime을 책임지는 component입니다.", detail: ["한 owner를 둡니다.", "callee에 주입합니다."] },
      ],
      codeExamples: [
        {
          id: "java-original-class02-audit",
          title: "11 files와 6 mains를 synthetic input으로 감사하고 Ex11 failure를 고정합니다",
          language: "powershell",
          filename: "verify-original-class02.ps1",
          purpose: "성공 mains와 expected source defect를 privacy-safe summary로 보존합니다.",
          code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("oop02-original-" + [Guid]::NewGuid().ToString("N"))
if (Test-Path $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
function NumberAt([object[]]$lines, [int]$index) {
  $matches = [regex]::Matches([string]$lines[$index], '-?\d+(?:\.\d+)?')
  if ($matches.Count -gt 0) { return $matches[$matches.Count - 1].Value }
  return "MISSING"
}
function GradeAt([object[]]$lines, [int]$index) {
  $match = [regex]::Match([string]$lines[$index], '([A-F])학점')
  if ($match.Success) { return $match.Groups[1].Value }
  return "MISSING"
}
try {
  $files = Get-ChildItem -LiteralPath "src\com\java\class02" -Filter "*.java" | Select-Object -ExpandProperty FullName
  javac -encoding UTF-8 -Xlint:all -d $root $files
  if ($LASTEXITCODE -ne 0) { throw "compile failed" }
  $a = @(& java -cp $root com.java.class02.Ex02_MethodMain); if ($LASTEXITCODE -ne 0) { throw "Ex02 failed" }
  $b = @(& java -cp $root com.java.class02.Ex04_MethodMain); if ($LASTEXITCODE -ne 0) { throw "Ex04 failed" }
  $one = (@("S1","80","85","85") -join [Environment]::NewLine) + [Environment]::NewLine
  $c = @($one | & java -cp $root com.java.class02.Ex06_MethodMain); if ($LASTEXITCODE -ne 0) { throw "Ex06 failed" }
  $d = @($one | & java -cp $root com.java.class02.Ex08_MethodMain); if ($LASTEXITCODE -ne 0) { throw "Ex08 failed" }
  $e = @($one | & java -cp $root com.java.class02.Ex10_MethodMain); if ($LASTEXITCODE -ne 0) { throw "Ex10 failed" }
  $stderrFile = Join-Path $root "ex11.err"
  $three = (@("S1","90","80","70","S2","100","100","100","S3","60","60","60") -join [Environment]::NewLine) + [Environment]::NewLine
  $f = @($three | & java -cp $root com.java.class02.Ex11_MethodMain 2> $stderrFile)
  $ex11Exit = $LASTEXITCODE; $errorText = Get-Content -LiteralPath $stderrFile -Raw
  $cMatch = [regex]::Match([string]$c[0], '총점\s+(-?\d+),\s*평균\s+(-?\d+(?:\.\d+)?),\s*학점\s+([A-F])학점')
  "compiled=$($files.Count),mains=6"
  "Ex02=lines:$($a.Count),namePresent:$(-not [string]::IsNullOrWhiteSpace($a[0])),total:$(NumberAt $a 4),avg:$(NumberAt $a 5),grade:$(GradeAt $a 6),sumField:$(NumberAt $a 13)"
  "Ex04=lines:$($b.Count),headerPresent:$(-not [string]::IsNullOrWhiteSpace($b[0])),total:$(NumberAt $b 1),avg:$(NumberAt $b 2),grade:$(GradeAt $b 3)"
  "Ex06=lines:$($c.Count),syntheticS1:$($c[0].Contains('S1')),total:$($cMatch.Groups[1].Value),avg:$($cMatch.Groups[2].Value),grade:$($cMatch.Groups[3].Value)"
  "Ex08=lines:$($d.Count),total:$(NumberAt $d 5),avg:$(NumberAt $d 6),grade:$(GradeAt $d 7)"
  "Ex10=lines:$($e.Count),total:$(NumberAt $e 5),avg:$(NumberAt $e 6),grade:$(GradeAt $e 7)"
  "Ex11=exit:$ex11Exit,stdoutLines:$($f.Count),completedStudents:$(@($f | Where-Object {$_ -match '님 성적표$'}).Count),exception:$($errorText.Contains('NoSuchElementException'))"
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}`,
          walkthrough: [
            { lines: "1-14", explanation: "unique temp root와 privacy-safe number/grade extractors를 준비합니다." },
            { lines: "16-24", explanation: "class02 11 sources를 compile하고 Ex02·04·06·08·10을 실행합니다." },
            { lines: "25-29", explanation: "Ex11 synthetic 3명 input을 native pipeline으로 전달해 공백 포함 classpath에서도 nonzero exit·partial stdout·stderr를 분리합니다." },
            { lines: "30-36", explanation: "상수가 아니라 실제 stdout에서 개인 이름을 제외한 totals·averages·grades와 failure evidence를 추출합니다." },
            { lines: "37-41", explanation: "resolved parent를 검사하고 생성 root만 정리합니다." },
          ],
          run: { environment: ["PowerShell 7+", "OpenJDK 21", "javastudy2 classstudy root"], command: "pwsh -NoProfile -File verify-original-class02.ps1" },
          output: { value: "compiled=11,mains=6\nEx02=lines:14,namePresent:True,total:260,avg:86.6,grade:B,sumField:260\nEx04=lines:4,headerPresent:True,total:250,avg:83.3,grade:B\nEx06=lines:1,syntheticS1:True,total:250,avg:83.3,grade:B\nEx08=lines:8,total:250,avg:83.3,grade:B\nEx10=lines:8,total:250,avg:83.3,grade:B\nEx11=exit:1,stdoutLines:11,completedStudents:1,exception:True", explanation: ["Ex02~10 값은 실제 stdout에서 추출하므로 source regression을 숨기지 않습니다.", "Ex11 nonzero exit를 source defect evidence로 명시합니다.", "원본 개인 이름은 presence만 확인하고 examples는 synthetic S1을 사용합니다."] },
          experiments: [
            { change: "Ex09 inputData가 outer에서 만든 Scanner를 parameter로 받게 합니다.", prediction: "세 students 모두 읽고 exit0이 됩니다.", result: "마지막 장에서 single owner pipeline으로 구현합니다." },
            { change: "각 inputData Scanner를 close합니다.", prediction: "첫 호출 뒤 System.in이 닫혀 이후 입력이 더 확실히 실패합니다.", result: "callee가 caller-owned stream을 닫지 않습니다." },
            { change: "Ex03 double overload를 호출합니다.", prediction: "active stub이라 실제 domain total 대신 0을 반환합니다.", result: "overload selection과 구현 correctness를 분리합니다." },
          ],
          sourceRefs: ["java-class02-ex01", "java-class02-ex02", "java-class02-ex03", "java-class02-ex04", "java-class02-ex05", "java-class02-ex06", "java-class02-ex07", "java-class02-ex08", "java-class02-ex09", "java-class02-ex10", "java-class02-ex11", "jdk21-javac"],
        },
      ],
      diagnostics: [{ symptom: "객체 배열의 첫 학생은 읽지만 둘째 Scanner가 NoSuchElementException이다.", likelyCause: "같은 System.in을 여러 Scanner가 감싸 첫 wrapper가 뒤 tokens까지 buffer했습니다.", checks: ["Scanner 생성 위치와 수를 셉니다.", "underlying stream identity를 봅니다.", "process exit/stderr를 확인합니다."], fix: "application owner가 Scanner 하나를 생성하고 inputData(Scanner)에 주입해 끝에서 한 번만 close합니다.", prevention: "multi-record piped input·EOF·extra-token integration tests를 둡니다." }],
    },
    {
      id: "method-declaration-anatomy-signature",
      title: "method declaration과 signature는 같은 정보 집합이 아닙니다",
      lead: "return type·access·static은 declaration의 일부지만 Java signature에는 포함되지 않습니다.",
      explanations: [
        "method declaration은 modifiers, type parameters, result(void/type), name, formal parameters, throws, body를 포함할 수 있습니다.",
        "Java method signature는 name과 type parameters/formal parameter types로 정의되며 return type·parameter names·access modifier·static은 overload 구별에 쓰이지 않습니다.",
        "void는 호출 결과 value가 없다는 result 표기이며 void invocation expression을 변수에 대입할 수 없습니다.",
        "non-void method body는 그대로 정상 완료할 수 없습니다. 성공 경로는 compatible value의 return으로 invocation result를 만들고 다른 경로는 throw 등으로 abrupt하게 끝날 수 있으며, return이 source의 마지막 줄일 필요는 없습니다.",
        "instance/static은 method code가 object별로 복제됨을 뜻하지 않습니다. instance invocation은 receiver를 제공하고 static invocation은 그렇지 않습니다.",
      ],
      concepts: [
        { term: "method declaration", definition: "method의 호출 형태·result·예외·implementation을 source에 정의하는 전체 문법 구조입니다.", detail: ["signature보다 넓습니다.", "body가 포함될 수 있습니다."] },
        { term: "method signature", definition: "overload/override 식별에 쓰는 method name과 formal parameter types 등의 JLS 정의입니다.", detail: ["return type은 제외됩니다.", "parameter names도 제외됩니다."] },
        { term: "void result", definition: "method invocation이 caller가 받을 value를 생산하지 않는다는 선언입니다.", detail: ["bare return은 가능합니다.", "값 대입은 불가합니다."] },
      ],
      codeExamples: [
        {
          id: "java-method-declaration-results",
          title: "instance return·static return·void methods를 호출합니다",
          language: "java",
          filename: "src/learning/oop02/DeclarationLab.java",
          purpose: "declaration 요소와 result 사용을 작은 exact output으로 구분합니다.",
          code: String.raw`package learning.oop02;

public class DeclarationLab {
    int add(int left, int right) { return Math.addExact(left, right); }
    static int multiply(int left, int right) { return Math.multiplyExact(left, right); }
    void marker() { System.out.println("marker"); }
    public static void main(String[] args) {
        DeclarationLab receiver = new DeclarationLab();
        System.out.println("add=" + receiver.add(2, 3));
        System.out.println("multiply=" + DeclarationLab.multiply(2, 3));
        receiver.marker();
    }
}`,
          walkthrough: [
            { lines: "4-6", explanation: "instance int result, static int result, instance void를 선언합니다." },
            { lines: "8-11", explanation: "receiver/class qualifiers와 value/void 소비 방식을 비교합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop02/DeclarationLab.java && java -cp build/classes learning.oop02.DeclarationLab" },
          output: { value: "add=5\nmultiply=6\nmarker", explanation: ["non-void results는 expression에 사용됩니다.", "void marker는 side effect만 냅니다."] },
          experiments: [
            { change: "같은 add(int,int)를 double return으로 하나 더 선언합니다.", prediction: "return type만 다른 duplicate method compile failure입니다.", result: "signature에서 return type이 제외됩니다." },
            { change: "int value=receiver.marker()를 추가합니다.", prediction: "void cannot be converted to int compile failure입니다.", result: "void invocation은 value가 아닙니다." },
            { change: "multiply를 receiver.multiply로 호출합니다.", prediction: "compile 가능하지만 static ownership을 흐립니다.", result: "class-qualified access를 사용합니다." },
          ],
          sourceRefs: ["java-class02-ex01", "java-class02-ex03", "jls-method-declarations", "jls-method-signature", "jls-method-result", "java-math-api"],
        },
      ],
      diagnostics: [{ symptom: "parameter 이름만 바꾼 overload가 duplicate라 compile되지 않는다.", likelyCause: "parameter names가 signature에 포함된다고 오해했습니다.", checks: ["name·parameter types sequence를 비교합니다.", "return/access/static 차이를 봅니다.", "javac diagnostic을 확인합니다."], fix: "행동 의미가 다르면 명확한 method name을 쓰고 overload는 distinct applicable parameter lists로 설계합니다.", prevention: "return-only·name-only·static-only duplicate compile-fail fixtures를 둡니다." }],
    },
    {
      id: "invocation-receiver-control-return-void",
      title: "method는 호출될 때 activation되고 return 뒤 caller의 다음 지점으로 돌아갑니다",
      lead: "receiver 선택·본문·정상/비정상 완료·caller continuation을 trace합니다.",
      explanations: [
        "instance invocation은 receiver expression을 평가하고 null이면 body 진입 전 NPE가 날 수 있습니다.",
        "arguments가 평가된 뒤 새 activation에서 formal parameters·locals가 생기고 body statements를 실행합니다.",
        "return expression을 평가하면 return statement는 JLS 형식상 reason return으로 abrupt completion하고 callee 제어를 끝냅니다. 성공한 invocation은 그 value를 result로 제공해 caller 다음 expression/statement가 계속됩니다.",
        "void method도 body 끝 또는 bare return으로 caller에 돌아가지만 result value는 없습니다.",
        "throw는 abrupt completion이라 정상 return value를 만들지 않으며 caller가 catch하지 않으면 더 위로 전파됩니다.",
      ],
      concepts: [
        { term: "receiver", definition: "instance invocation이 대상으로 선택한 object reference입니다.", detail: ["this로 전달됩니다.", "null 검사가 있습니다."] },
        { term: "activation", definition: "한 method invocation의 parameters·locals·control state가 존재하는 실행 인스턴스입니다.", detail: ["재귀마다 별도입니다.", "return/throw로 끝납니다."] },
        { term: "caller continuation", definition: "callee가 정상/처리된 비정상 완료 뒤 caller가 다시 실행할 다음 지점입니다.", detail: ["return value를 소비합니다.", "finally 영향이 있습니다."] },
      ],
      codeExamples: [
        {
          id: "java-method-control-flow",
          title: "caller-before→method body→result→void→caller-after 순서를 출력합니다",
          language: "java",
          filename: "src/learning/oop02/InvocationLab.java",
          purpose: "Ex02 play01 내부 print와 caller total 출력 순서를 일반화합니다.",
          code: String.raw`package learning.oop02;

public class InvocationLab {
    int add(int left, int right) {
        System.out.println("inside-instance");
        return left + right;
    }
    void marker() { System.out.println("inside-void"); }
    public static void main(String[] args) {
        InvocationLab receiver = new InvocationLab();
        System.out.println("before");
        int result = receiver.add(2, 3);
        System.out.println("result=" + result);
        receiver.marker();
        System.out.println("after");
    }
}`,
          walkthrough: [
            { lines: "4-8", explanation: "instance result method와 void side-effect method를 선언합니다." },
            { lines: "10-15", explanation: "caller log, body, result 소비, void body, final caller log를 순서대로 실행합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop02/InvocationLab.java && java -cp build/classes learning.oop02.InvocationLab" },
          output: { value: "before\ninside-instance\nresult=5\ninside-void\nafter", explanation: ["callee body가 끝난 뒤 caller result line이 실행됩니다.", "void도 caller control을 반환합니다."] },
          experiments: [
            { change: "receiver를 null로 바꿉니다.", prediction: "inside-instance 없이 NPE입니다.", result: "receiver validation이 body보다 앞섭니다." },
            { change: "add에서 return 전 exception을 throw합니다.", prediction: "result/after는 catch 없이는 실행되지 않습니다.", result: "abrupt completion을 추적합니다." },
            { change: "marker 중간에 bare return을 둡니다.", prediction: "그 뒤 marker statements만 건너뛰고 caller after는 실행됩니다.", result: "void early return을 확인합니다." },
          ],
          sourceRefs: ["java-class02-ex01", "java-class02-ex02", "jls-method-invocation", "jls-this", "jls-return", "jls-exceptions"],
        },
      ],
      diagnostics: [{ symptom: "method 내부 log보다 caller result가 먼저 나올 것이라 예상했다.", likelyCause: "invocation expression 결과가 body 실행 전에 이미 있다고 생각했습니다.", checks: ["receiver/arguments/body/return 순서를 적습니다.", "stdout trace를 봅니다.", "exception path를 분리합니다."], fix: "invocation lifecycle을 순서대로 trace하고 result는 return 뒤에만 소비합니다.", prevention: "body side effect를 줄이고 call-order golden은 최소 fixture에 둡니다." }],
    },
    {
      id: "parameters-arguments-evaluation-order",
      title: "formal parameters는 arguments가 왼쪽에서 오른쪽으로 평가된 뒤 값을 받습니다",
      lead: "인자 expression의 side effect와 exception이 body 시작 전에 일어남을 검증합니다.",
      explanations: [
        "formal parameter는 declaration 안의 local variables이고 argument는 호출 지점에서 값을 계산하는 expressions입니다.",
        "Java는 receiver expression을 평가한 뒤 argument expressions를 왼쪽에서 오른쪽으로 평가합니다.",
        "앞 argument 평가가 abrupt하게 끝나면 뒤 arguments와 method body는 실행되지 않습니다.",
        "각 argument value는 invocation context conversion을 거쳐 corresponding parameter에 대입됩니다.",
        "정해진 순서가 있어도 `call(i++, i++)` 같은 숨은 side effects는 가독성과 유지보수를 해치므로 local names로 분리합니다.",
      ],
      concepts: [
        { term: "formal parameter", definition: "method declaration에서 caller values를 받을 이름·type이 있는 local variable입니다.", detail: ["body scope에 있습니다.", "호출마다 생깁니다."] },
        { term: "argument expression", definition: "호출 지점에서 parameter에 전달할 value를 계산하는 expression입니다.", detail: ["왼쪽→오른쪽 평가입니다.", "side effect가 가능합니다."] },
        { term: "invocation conversion", definition: "argument value를 parameter type에 맞게 적용하는 허용 conversion rules입니다.", detail: ["overload applicability와 연결됩니다.", "narrowing은 자동이 아닐 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "java-argument-evaluation-order",
          title: "receiver·A argument·B argument·body 순서를 출력합니다",
          language: "java",
          filename: "src/learning/oop02/EvaluationOrderLab.java",
          purpose: "JLS evaluation order를 결정적 trace로 실행합니다.",
          code: String.raw`package learning.oop02;

public class EvaluationOrderLab {
    static EvaluationOrderLab receiver() {
        System.out.println("receiver"); return new EvaluationOrderLab();
    }
    static int argument(String name, int value) {
        System.out.println("arg:" + name); return value;
    }
    int add(int left, int right) {
        System.out.println("body:" + left + ',' + right); return left + right;
    }
    public static void main(String[] args) {
        int result = receiver().add(argument("A", 1), argument("B", 2));
        System.out.println("result=" + result);
    }
}`,
          walkthrough: [
            { lines: "4-9", explanation: "receiver/argument evaluation이 일어날 때 log하는 helpers를 정의합니다." },
            { lines: "10-12", explanation: "body는 두 parameter values를 받은 뒤 log/return합니다." },
            { lines: "14-15", explanation: "한 invocation expression과 final result를 실행합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop02/EvaluationOrderLab.java && java -cp build/classes learning.oop02.EvaluationOrderLab" },
          output: { value: "receiver\narg:A\narg:B\nbody:1,2\nresult=3", explanation: ["receiver가 먼저, arguments A/B가 왼쪽부터, body가 마지막입니다.", "return 뒤 result가 출력됩니다."] },
          experiments: [
            { change: "argument A가 throw하게 합니다.", prediction: "arg:B·body·result가 실행되지 않습니다.", result: "abrupt argument evaluation을 확인합니다." },
            { change: "A/B 호출 순서를 source에서 바꿉니다.", prediction: "log와 body parameter values도 바뀝니다.", result: "positional mapping을 봅니다." },
            { change: "arguments에 같은 mutable counter increments를 넣습니다.", prediction: "순서는 정의돼도 코드는 읽기 어렵습니다.", result: "side effects를 named locals로 분리합니다." },
          ],
          sourceRefs: ["jls-evaluation-order", "jls-method-invocation", "jls-invocation-context"],
        },
      ],
      diagnostics: [{ symptom: "두 arguments가 어떤 순서로 state를 바꿨는지 code review에서 알기 어렵다.", likelyCause: "호출 인자 안에 여러 mutation/IO를 숨겼습니다.", checks: ["argument expressions side effects를 찾습니다.", "receiver evaluation도 봅니다.", "exception path를 표시합니다."], fix: "각 계산을 side-effect-free named local로 먼저 실행하고 invocation에는 values만 전달합니다.", prevention: "argument side effect lint/review rule과 evaluation trace test를 둡니다." }],
    },
    {
      id: "pass-by-value-primitives",
      title: "primitive argument는 값이 복사되어 parameter 재대입이 caller variable을 바꾸지 않습니다",
      lead: "변경된 값을 원하면 명시적으로 return하고 caller가 재대입합니다.",
      explanations: [
        "Java method invocation은 primitive value를 parameter local에 복사합니다. caller variable과 parameter는 별도 variables입니다.",
        "callee가 parameter++를 해도 caller value는 그대로이고 callee local lifetime 안에서만 바뀝니다.",
        "변환 result가 필요하면 non-void return으로 표현하고 caller가 `value=increment(value)`처럼 소비합니다.",
        "void와 field/static mutation으로 caller state를 몰래 바꾸기보다 output과 side effect를 API 이름에 드러냅니다.",
        "숫자 변환은 overflow·domain을 검사하고 example에서는 Math.addExact를 사용합니다.",
      ],
      concepts: [
        { term: "pass-by-value", definition: "argument가 계산한 value를 새 parameter variable에 복사하는 호출 방식입니다.", detail: ["Java의 유일한 방식입니다.", "reference values도 해당합니다."] },
        { term: "parameter reassignment", definition: "callee의 parameter local에 다른 value를 대입하는 동작입니다.", detail: ["caller variable과 별도입니다.", "return하지 않으면 사라집니다."] },
        { term: "explicit result", definition: "method의 계산 결과를 return type/value로 caller에게 드러내는 계약입니다.", detail: ["composition에 유리합니다.", "테스트가 쉽습니다."] },
      ],
      codeExamples: [
        {
          id: "java-primitive-pass-by-value",
          title: "void parameter 증가와 returned 증가를 비교합니다",
          language: "java",
          filename: "src/learning/oop02/PrimitivePassLab.java",
          purpose: "primitive caller variable이 자동으로 바뀌지 않음을 실행합니다.",
          code: String.raw`package learning.oop02;

public class PrimitivePassLab {
    static void incrementVoid(int value) { value = Math.addExact(value, 1); }
    static int increment(int value) { return Math.addExact(value, 1); }
    public static void main(String[] args) {
        int caller = 10;
        System.out.println("before=" + caller);
        incrementVoid(caller);
        System.out.println("afterVoid=" + caller);
        caller = increment(caller);
        System.out.println("afterReturn=" + caller);
    }
}`,
          walkthrough: [
            { lines: "4-5", explanation: "void parameter local 변경과 returned value method를 나눕니다." },
            { lines: "7-12", explanation: "caller10을 void로 전달한 뒤 유지되고 return을 재대입한 뒤 11이 됩니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop02/PrimitivePassLab.java && java -cp build/classes learning.oop02.PrimitivePassLab" },
          output: { value: "before=10\nafterVoid=10\nafterReturn=11", explanation: ["void parameter reassignment는 caller를 바꾸지 않습니다.", "return result를 caller가 명시적으로 채택합니다."] },
          experiments: [
            { change: "caller=Integer.MAX_VALUE를 넣습니다.", prediction: "두 methods 모두 Math.addExact에서 ArithmeticException입니다.", result: "overflow policy를 유지합니다." },
            { change: "incrementVoid가 static global을 바꾸게 합니다.", prediction: "caller primitive는 같지만 hidden global side effect가 생깁니다.", result: "parameter semantics와 외부 side effect를 분리합니다." },
            { change: "increment(caller) 결과를 무시합니다.", prediction: "caller는 10입니다.", result: "non-void 호출도 result 소비가 필요합니다." },
          ],
          sourceRefs: ["java-class02-ex03", "java-class02-ex04", "jls-method-invocation", "jls-formal-parameters", "java-math-api"],
        },
      ],
      diagnostics: [{ symptom: "void method에서 int parameter를 바꿨지만 caller 값이 그대로다.", likelyCause: "primitive variable 자체가 전달된다고 생각했습니다.", checks: ["parameter assignment를 봅니다.", "return type/result 소비를 확인합니다.", "hidden fields를 구분합니다."], fix: "변환 결과를 return하고 caller가 명시 재대입하거나 state owner object method로 모델링합니다.", prevention: "before/after void/return fixtures를 둡니다." }],
    },
    {
      id: "pass-by-value-references-rebind-mutation",
      title: "reference argument도 reference value가 복사되어 rebind는 안 보이고 target mutation은 보입니다",
      lead: "call-by-reference라는 표현 대신 두 variables가 같은 object를 가리키는 alias graph를 그립니다.",
      explanations: [
        "caller와 callee parameter는 서로 다른 reference variables지만 복사된 values가 같은 mutable object를 가리킬 수 있습니다.",
        "callee가 `box=new Box`로 rebind하면 parameter만 바뀌고 caller reference는 원래 object를 유지합니다.",
        "callee가 `box.value=...`로 target을 mutate하면 caller가 같은 object를 가리켜 변경을 관찰합니다.",
        "String도 reference type이지만 immutable이라 method 안 `text +=`는 parameter rebind이며 caller String을 바꾸지 않습니다.",
        "null은 복사 가능한 reference value이고 dereference method는 boundary에서 require/non-null policy를 정합니다.",
      ],
      concepts: [
        { term: "reference value copy", definition: "object 위치를 나타내는 reference value가 parameter variable로 복사되는 pass-by-value입니다.", detail: ["caller를 rebind하지 않습니다.", "target은 공유할 수 있습니다."] },
        { term: "target mutation", definition: "reference가 가리키는 mutable object/array의 state를 변경하는 동작입니다.", detail: ["aliases에 보입니다.", "ownership이 필요합니다."] },
        { term: "reference rebind", definition: "parameter 같은 한 reference variable이 다른 target을 가리키도록 대입하는 동작입니다.", detail: ["다른 alias를 바꾸지 않습니다.", "return으로 전달할 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "java-reference-pass-by-value",
          title: "Box mutation과 rebind를 같은 caller에서 비교합니다",
          language: "java",
          filename: "src/learning/oop02/ReferencePassLab.java",
          purpose: "reference value copy와 shared target mutation을 실행합니다.",
          code: String.raw`package learning.oop02;

public class ReferencePassLab {
    static class Box { int value; Box(int value) { this.value = value; } }
    static void mutate(Box box) { box.value = 20; }
    static void rebind(Box box) { box = new Box(99); }
    public static void main(String[] args) {
        Box caller = new Box(10);
        Box alias = caller;
        mutate(caller);
        System.out.println("afterMutate=" + caller.value + ",sameAlias=" + (caller == alias));
        rebind(caller);
        System.out.println("afterRebind=" + caller.value + ",sameAlias=" + (caller == alias));
        try { mutate(null); }
        catch (NullPointerException error) { System.out.println("null=" + error.getClass().getSimpleName()); }
    }
}`,
          walkthrough: [
            { lines: "4-6", explanation: "mutable Box, target mutation, parameter rebind methods를 정의합니다." },
            { lines: "8-13", explanation: "caller/alias가 같은 object이고 mutate20은 보이지만 rebind99는 caller에 보이지 않습니다." },
            { lines: "14-15", explanation: "null target mutation failure를 실행합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop02/ReferencePassLab.java && java -cp build/classes learning.oop02.ReferencePassLab" },
          output: { value: "afterMutate=20,sameAlias=true\nafterRebind=20,sameAlias=true\nnull=NullPointerException", explanation: ["caller/alias object는 mutate됩니다.", "callee rebind는 caller alias graph를 바꾸지 않습니다."] },
          experiments: [
            { change: "rebind가 새 Box를 return하고 caller가 받습니다.", prediction: "caller value는 99로 바뀐 새 object입니다.", result: "reference 교체를 explicit result로 표현합니다." },
            { change: "Box를 immutable record로 바꿉니다.", prediction: "mutation method 대신 새 record return이 필요합니다.", result: "shared mutation을 줄입니다." },
            { change: "mutate 첫 줄에 null validation을 둡니다.", prediction: "domain-specific INVALID_BOX로 조기 실패할 수 있습니다.", result: "NPE와 contract failure를 선택합니다." },
          ],
          sourceRefs: ["jls-reference-values", "jls-method-invocation", "java-object-api"],
        },
      ],
      diagnostics: [{ symptom: "reference를 전달했으니 caller variable 자체를 바꿀 수 있다고 설명했다.", likelyCause: "shared target mutation을 pass-by-reference로 잘못 이름 붙였습니다.", checks: ["parameter rebind fixture를 실행합니다.", "caller/parameter variables를 따로 그립니다.", "target identity를 비교합니다."], fix: "Java는 reference value도 pass-by-value이며 mutation visibility는 aliases가 같은 target을 가리키기 때문이라고 설명합니다.", prevention: "primitive·reference·array rebind/mutate tests를 함께 둡니다." }],
    },
    {
      id: "arrays-varargs-aliasing",
      title: "배열과 varargs도 reference value로 전달되며 내용 변경과 재대입을 분리해야 합니다",
      lead: "호출 문법이 편해져도 배열 identity·alias·null·length 계약은 사라지지 않습니다.",
      explanations: [
        "array variable에는 array object를 가리키는 reference value가 들어 있고 invocation은 그 값을 parameter에 복사합니다.",
        "parameter를 새 배열로 rebind해도 caller variable은 그대로지만 element를 바꾸면 같은 array를 보는 aliases가 변경을 관찰합니다.",
        "`int... values`는 선언상 `int[]` parameter입니다. caller가 쉼표 arguments를 주면 compiler가 배열을 만들 수 있고 기존 배열을 직접 줄 수도 있습니다.",
        "varargs는 zero elements를 허용하지만 explicit `(int[]) null`도 전달할 수 있습니다. empty와 null의 정책을 혼동하지 않습니다.",
        "mutable array를 저장하거나 반환할 때는 ownership을 문서화하고 필요하면 defensive copy로 alias를 끊습니다.",
      ],
      concepts: [
        { term: "array alias", definition: "둘 이상의 reference variables가 같은 array object를 가리키는 상태입니다.", detail: ["element mutation이 공유됩니다.", "rebind는 공유되지 않습니다."] },
        { term: "varargs", definition: "호출자가 가변 개수 arguments를 전달하도록 허용하는 마지막 array parameter 문법입니다.", detail: ["실제 parameter는 array입니다.", "overload의 마지막 applicability phase입니다."] },
        { term: "defensive copy", definition: "mutable input/output array의 별도 사본을 만들어 외부 alias mutation을 막는 ownership 기법입니다.", detail: ["비용이 있습니다.", "boundary에서 선택합니다."] },
      ],
      codeExamples: [
        {
          id: "java-array-varargs-value-copy",
          title: "array element mutation·parameter rebind·varargs packaging을 한 번에 비교합니다",
          language: "java",
          filename: "src/learning/oop02/ArrayVarargsLab.java",
          purpose: "array도 Java pass-by-value라는 사실과 zero-length varargs를 실행합니다.",
          code: String.raw`package learning.oop02;

import java.util.Arrays;

public class ArrayVarargsLab {
    static void mutate(int[] values) { values[0] = 9; }
    static void rebind(int[] values) { values = new int[] {99}; }
    static int sum(int... values) {
        int total = 0;
        for (int value : values) total = Math.addExact(total, value);
        return total;
    }
    public static void main(String[] args) {
        int[] caller = {1, 2};
        mutate(caller);
        System.out.println("afterMutate=" + Arrays.toString(caller));
        rebind(caller);
        System.out.println("afterRebind=" + Arrays.toString(caller));
        System.out.println("sum0=" + sum() + ",sum3=" + sum(1, 2, 3));
        System.out.println("runtime=" + caller.getClass().getName());
    }
}`,
          walkthrough: [
            { lines: "6-7", explanation: "element mutation과 parameter rebind를 분리합니다." },
            { lines: "8-12", explanation: "varargs를 실제 int[]로 순회하며 checked sum을 구합니다." },
            { lines: "14-20", explanation: "caller array와 zero/three arguments, runtime array type을 확인합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop02/ArrayVarargsLab.java && java -cp build/classes learning.oop02.ArrayVarargsLab" },
          output: { value: "afterMutate=[9, 2]\nafterRebind=[9, 2]\nsum0=0,sum3=6\nruntime=[I", explanation: ["element9는 caller에 보이고 rebind99는 보이지 않습니다.", "빈 varargs는 length0 int[]이며 int array runtime name은 [I입니다."] },
          experiments: [
            { change: "sum((int[]) null)을 호출합니다.", prediction: "enhanced for dereference에서 NPE가 납니다.", result: "empty와 null은 다른 inputs입니다." },
            { change: "mutate가 Arrays.copyOf로 복사한 뒤 변경합니다.", prediction: "caller array는 [1,2]를 유지합니다.", result: "defensive copy가 alias를 끊습니다." },
            { change: "sum에 Integer.MAX_VALUE와 1을 전달합니다.", prediction: "Math.addExact가 ArithmeticException을 냅니다.", result: "varargs에도 overflow contract가 필요합니다." },
          ],
          sourceRefs: ["jls-arrays", "jls-formal-parameters", "jls-method-invocation", "java-object-api", "java-arrays-api", "java-math-api"],
        },
      ],
      diagnostics: [
        { symptom: "method가 배열 parameter를 새 배열로 바꿨는데 caller 배열이 교체되지 않는다.", likelyCause: "array reference variable 자체가 전달된다고 오해했습니다.", checks: ["element mutation인지 parameter rebind인지 구분합니다.", "caller/parameter identity를 봅니다.", "return result 소비를 확인합니다."], fix: "교체가 계약이면 새 배열을 return하고 caller가 명시적으로 채택합니다.", prevention: "mutate/rebind/defensive-copy fixtures를 같이 둡니다." },
        { symptom: "인자 없는 varargs와 null varargs를 같은 경우로 처리했다.", likelyCause: "compiler가 만드는 length0 array와 explicit null을 구분하지 않았습니다.", checks: ["values==null과 values.length를 분리합니다.", "호출 cast를 봅니다.", "overload warning을 확인합니다."], fix: "null 금지 또는 명시 처리 정책을 정하고 API에서 empty를 정상 identity로 사용합니다.", prevention: "zero/one/many/null boundary tests를 둡니다." },
      ],
    },
    {
      id: "return-early-exit-throw-finally",
      title: "return 계약은 마지막 줄 규칙이 아니라 모든 정상·비정상 경로의 결과 규칙입니다",
      lead: "guard clause·throw·finally까지 포함해 control-flow graph의 모든 출구를 점검합니다.",
      explanations: [
        "value-returning method body는 정상 완료할 수 없고, caller에 성공 result를 주는 각 경로는 assignment-compatible expression을 return해야 합니다. source 마지막 줄이라는 규칙은 없습니다.",
        "early return guard는 invalid/edge cases를 먼저 종료해 main path nesting을 줄일 수 있지만 결과 분류가 일관돼야 합니다.",
        "JLS에서 return과 throw statements는 모두 서로 다른 reason으로 abrupt completion하지만 API 관점에서는 return을 성공 result, uncaught throw를 exception channel로 구분합니다. recoverable domain result와 programmer error도 섞지 않습니다.",
        "`finally`는 return expression이 평가된 뒤에도 실행됩니다. finally가 return/throw하면 앞선 결과를 덮어써 이해와 장애 진단을 해치므로 피합니다.",
        "원본 play03에서 divisor0이면 division 중간값은 positive sum에서 Infinity, 0/0에서 NaN이지만 뒤 int narrowing으로 각각 214748364.7과 0.0이라는 최종 average가 됩니다. 어느 쪽도 유효 성적이 아니므로 finite positive divisor를 먼저 검증합니다.",
      ],
      concepts: [
        { term: "successful invocation result", definition: "return statement의 control transfer가 끝난 뒤 caller가 invocation value를 받고 계속하는 API-level 성공 경로입니다.", detail: ["JLS statement-level return은 reason return의 abrupt completion입니다.", "void는 result value가 없습니다."] },
        { term: "abrupt completion", definition: "return·throw·break·continue 같은 정해진 reason으로 statement의 정상 흐름을 끝내는 JLS 용어입니다.", detail: ["uncaught throw는 exception을 전파합니다.", "finally가 결과에 영향을 줄 수 있습니다."] },
        { term: "guard clause", definition: "method 초기에 invalid·edge condition을 검사해 즉시 return/throw하는 branch입니다.", detail: ["nesting을 줄입니다.", "계약을 선명하게 합니다."] },
      ],
      codeExamples: [
        {
          id: "java-return-path-contract",
          title: "세 개의 early result와 zero-divisor exception을 실행합니다",
          language: "java",
          filename: "src/learning/oop02/ReturnContractLab.java",
          purpose: "return placement가 아니라 complete path coverage가 핵심임을 확인합니다.",
          code: String.raw`package learning.oop02;

public class ReturnContractLab {
    static String classify(int value) {
        if (value < 0) return "INVALID";
        if (value == 0) return "ZERO";
        return "POSITIVE";
    }
    static int divide(int left, int right) {
        if (right == 0) throw new IllegalArgumentException("ZERO_DIVISOR");
        return left / right;
    }
    public static void main(String[] args) {
        System.out.println("-1=" + classify(-1));
        System.out.println("0=" + classify(0));
        System.out.println("2=" + classify(2));
        try { divide(6, 0); }
        catch (IllegalArgumentException error) { System.out.println("divide=" + error.getMessage()); }
    }
}`,
          walkthrough: [
            { lines: "4-8", explanation: "negative·zero·positive의 모든 정상 paths가 각 위치에서 return합니다." },
            { lines: "9-12", explanation: "invalid divisor는 domain exception, valid divisor는 quotient를 돌려줍니다." },
            { lines: "14-18", explanation: "세 정상 결과와 한 abrupt path를 deterministic하게 검증합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop02/ReturnContractLab.java && java -cp build/classes learning.oop02.ReturnContractLab" },
          output: { value: "-1=INVALID\n0=ZERO\n2=POSITIVE\ndivide=ZERO_DIVISOR", explanation: ["return은 여러 위치에 있어도 every normal path를 완성합니다.", "exception path는 호출자가 명시 catch합니다."] },
          experiments: [
            { change: "positive final return을 삭제합니다.", prediction: "missing return statement compile failure입니다.", result: "도달 가능한 정상 경로가 비었습니다." },
            { change: "finally에서 return을 추가합니다.", prediction: "try의 value/exception을 덮어쓸 수 있습니다.", result: "finally의 control transfer를 금지합니다." },
            { change: "double average에서 divisor0을 그대로 나눕니다.", prediction: "Infinity 또는 NaN이 나올 수 있습니다.", result: "finite positive divisor를 먼저 검증합니다." },
          ],
          sourceRefs: ["java-class02-ex03", "java-class02-ex05", "jls-method-result", "jls-return", "jls-throw", "jls-exceptions"],
        },
      ],
      diagnostics: [
        { symptom: "non-void method에서 missing return compile error가 난다.", likelyCause: "조건문 일부만 return하고 도달 가능한 normal path를 남겼습니다.", checks: ["각 branch의 종료를 표시합니다.", "throw와 loop completion을 구분합니다.", "javac line을 확인합니다."], fix: "contract에 맞는 final return/throw를 추가하거나 exhaustive result type으로 분기를 구조화합니다.", prevention: "boundary branch tests와 compile-fail fixture를 둡니다." },
        { symptom: "원래 exception 또는 return result가 사라진다.", likelyCause: "finally block이 return/throw로 이전 completion을 덮었습니다.", checks: ["finally 안 control transfer를 찾습니다.", "suppressed/causal chain을 봅니다.", "실행 trace를 확인합니다."], fix: "finally는 cleanup만 수행하고 결과·예외 제어는 try/catch 밖의 한 지점에서 처리합니다.", prevention: "finally return 금지 review rule을 둡니다." },
      ],
    },
    {
      id: "overload-resolution-not-return-type",
      title: "overload는 이름과 arguments의 적용 가능성·가장 구체적인 후보로 결정됩니다",
      lead: "return type이나 변수 왼쪽이 아니라 compile-time argument types가 선택을 주도합니다.",
      explanations: [
        "같은 name에 서로 다른 formal parameter type sequence를 두는 것이 overload입니다. parameter names와 return type만 달라서는 새 overload가 아닙니다.",
        "compiler는 대체로 strict invocation, loose invocation(boxing 포함), variable arity phases 순으로 applicable candidates를 찾고 더 이른 phase가 성공하면 뒤 phase를 쓰지 않습니다.",
        "여러 후보가 applicable하면 most-specific rule을 적용하며 어느 쪽도 더 구체적이지 않으면 ambiguity compile error입니다.",
        "argument의 compile-time type이 selection에 쓰이므로 Object 변수 안에 String object가 있어도 `pick(Object)`가 선택될 수 있습니다. overriding dynamic dispatch와 구분합니다.",
        "원본 Ex03의 `play02(int,int,int)`와 `play02(double,double,double)`은 다른 overload지만 double version의 active stub return0은 선택 성공과 구현 correctness가 별개임을 보여 줍니다.",
      ],
      concepts: [
        { term: "applicable method", definition: "주어진 argument count/types가 invocation conversions를 거쳐 호출할 수 있는 overload candidate입니다.", detail: ["phase가 있습니다.", "varargs는 늦게 고려됩니다."] },
        { term: "most specific", definition: "여러 applicable candidates 중 해당 invocation에 더 구체적인 parameter 관계를 가진 method를 선택하는 규칙입니다.", detail: ["항상 하나가 있는 것은 아닙니다.", "없으면 ambiguity입니다."] },
        { term: "compile-time selection", definition: "overload signature 선택이 argument expressions의 compile-time types를 중심으로 compile 때 결정되는 성질입니다.", detail: ["override dispatch와 다릅니다.", "return target이 선택하지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "java-overload-resolution",
          title: "arity·numeric type·parameter order overload를 exact labels로 선택합니다",
          language: "java",
          filename: "src/learning/oop02/OverloadLab.java",
          purpose: "원본 overload progression을 return-independent selection fixture로 보강합니다.",
          code: String.raw`package learning.oop02;

public class OverloadLab {
    static String pick() { return "none"; }
    static String pick(int a, int b, int c) { return "int3:" + (a + b + c); }
    static String pick(double a, double b, double c) { return "double3:" + (a + b + c); }
    static String pick(int count, String label) { return "int-string:" + count + ':' + label; }
    static String pick(String label, int count) { return "string-int:" + label + ':' + count; }
    public static void main(String[] args) {
        System.out.println(pick());
        System.out.println(pick(1, 2, 3));
        System.out.println(pick(1.0, 2.0, 3.0));
        System.out.println(pick(2, "S"));
        System.out.println(pick("S", 2));
    }
}`,
          walkthrough: [
            { lines: "4-8", explanation: "0/3/2 parameters와 type/order가 서로 다른 signatures를 선언합니다." },
            { lines: "10-14", explanation: "argument count·numeric literal types·order로 각 overload를 선택합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop02/OverloadLab.java && java -cp build/classes learning.oop02.OverloadLab" },
          output: { value: "none\nint3:6\ndouble3:6.0\nint-string:2:S\nstring-int:S:2", explanation: ["1/2/3 literals는 int triple, 1.0/2.0/3.0은 double triple을 고릅니다.", "같은 types라도 parameter order가 다르면 signatures가 다릅니다."] },
          experiments: [
            { change: "pick(Integer)와 pick(Long)에 pick(null)을 호출합니다.", prediction: "둘이 unrelated라 ambiguous compile error입니다.", result: "null이 모든 reference overload를 자동 결정하지 않습니다." },
            { change: "pick(int...)를 추가하고 세 int를 전달합니다.", prediction: "fixed-arity int3가 variable arity보다 먼저 선택됩니다.", result: "applicability phase 순서를 확인합니다." },
            { change: "pick(int,int,int)를 return int인 동일 parameter method로 하나 더 선언합니다.", prediction: "duplicate method compile error입니다.", result: "return type은 signature/overload selector가 아닙니다." },
          ],
          sourceRefs: ["java-class02-ex03", "java-class02-ex04", "jls-method-signature", "jls-method-invocation", "jls-invocation-context"],
        },
      ],
      diagnostics: [
        { symptom: "null argument를 넣자 어떤 overload인지 compile하지 못한다.", likelyCause: "서로 unrelated한 reference parameter candidates가 모두 applicable하고 unique most-specific가 없습니다.", checks: ["candidate signatures를 나열합니다.", "argument에 compile-time type을 부여합니다.", "varargs/boxing phase를 봅니다."], fix: "명시 cast·분리된 method names·공통 가장 구체적인 abstraction 중 의도를 드러내는 방식을 선택합니다.", prevention: "null/boxing/varargs ambiguity compile fixtures를 API 설계 때 둡니다." },
        { symptom: "runtime object type에 맞는 overload가 호출될 것이라 예상했다.", likelyCause: "overload selection과 override dynamic dispatch를 섞었습니다.", checks: ["argument variable의 declared type을 봅니다.", "선택된 signature와 overriding implementation을 두 단계로 적습니다.", "cast 유무를 확인합니다."], fix: "의도한 compile-time type을 사용하거나 polymorphic behavior는 overriding/double dispatch 등으로 모델링합니다.", prevention: "Object/String declared/runtime type 비교 test를 둡니다." },
      ],
    },
    {
      id: "pure-results-versus-stateful-void-chain",
      title: "순수 반환 파이프라인과 상태를 누적하는 void 호출 사슬의 실패 모드를 비교합니다",
      lead: "호출 순서를 기억해야만 맞는 객체보다 입력에서 완전한 결과를 계산하는 contract가 재사용과 테스트에 유리합니다.",
      explanations: [
        "Ex05/06은 return values를 caller가 조합하고 Ex07/08은 sum·avg·grade fields를 void methods가 차례로 갱신합니다. 같은 수치가 나와도 dependency visibility가 다릅니다.",
        "stateful chain은 `total→average→grade` 순서를 생략하거나 바꾸면 default0·null·stale values가 노출됩니다. type system은 이 temporal precondition을 표현하지 못합니다.",
        "pure function은 같은 valid input에 같은 output을 반환하고 receiver/shared state를 바꾸지 않아 isolated tests·parallel calls·composition이 쉽습니다.",
        "모든 side effect를 제거할 수는 없지만 parsing·clock·random·DB·printing은 outer adapter로 밀고 domain calculation을 pure core로 남길 수 있습니다.",
        "원본 average는 `(int)(sum/3.0*10)/10.0` 형태의 소수 첫째 자리 버림입니다. 반올림이라고 부르지 말고 divisor·finite·range 정책과 함께 명시합니다.",
      ],
      concepts: [
        { term: "pure function", definition: "결과가 명시 inputs에 의해 결정되고 관찰 가능한 외부 state를 변경하지 않는 계산입니다.", detail: ["repeatable합니다.", "composition이 쉽습니다."] },
        { term: "temporal coupling", definition: "correctness가 API 호출의 숨은 순서·횟수에 의존하는 결합입니다.", detail: ["skipped call에 취약합니다.", "stale state를 만듭니다."] },
        { term: "functional core, imperative shell", definition: "순수 domain calculation을 중심에 두고 IO·state orchestration을 바깥 경계가 담당하는 구조입니다.", detail: ["tests가 분리됩니다.", "side-effect ownership이 보입니다."] },
      ],
      codeExamples: [
        {
          id: "java-pure-versus-stateful-pipeline",
          title: "같은 scores의 pure repeatability와 stateful call-order dependency를 드러냅니다",
          language: "java",
          filename: "src/learning/oop02/PurityLab.java",
          purpose: "Ex05 return pipeline과 Ex07 void field pipeline의 tradeoff를 deterministic output으로 비교합니다.",
          code: String.raw`package learning.oop02;

public class PurityLab {
    record Report(int total, double average, String grade) {}
    static Report calculate(int a, int b, int c) {
        int total = Math.addExact(Math.addExact(a, b), c);
        double average = ((int) (total / 3.0 * 10)) / 10.0;
        String grade = average >= 90 ? "A" : average >= 80 ? "B" : average >= 70 ? "C" : average >= 60 ? "D" : "F";
        return new Report(total, average, grade);
    }
    static class Stateful {
        int total; double average; String grade = "";
        void total(int a, int b, int c) { total = a + b + c; }
        void average() { average = ((int) (total / 3.0 * 10)) / 10.0; }
        void grade() { grade = average >= 90 ? "A" : average >= 80 ? "B" : average >= 70 ? "C" : average >= 60 ? "D" : "F"; }
    }
    public static void main(String[] args) {
        System.out.println("pure1=" + calculate(80, 85, 85));
        System.out.println("pure2=" + calculate(80, 85, 85));
        System.out.println("grade60=" + calculate(60, 60, 60).grade());
        System.out.println("grade59=" + calculate(59, 59, 59).grade());
        Stateful state = new Stateful();
        state.grade();
        System.out.println("beforeOrder=" + state.total + ':' + state.average + ':' + state.grade);
        state.total(80, 85, 85); state.average(); state.grade();
        System.out.println("afterOrder=" + state.total + ':' + state.average + ':' + state.grade);
    }
}`,
          walkthrough: [
            { lines: "4-10", explanation: "입력 세 개에서 immutable Report 하나를 계산합니다." },
            { lines: "11-16", explanation: "void methods가 fields를 순서대로 채우는 비교 구현입니다." },
            { lines: "18-26", explanation: "pure result repeatability, D/F 경계60/59, 잘못된/올바른 stateful order를 모두 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop02/PurityLab.java && java -cp build/classes learning.oop02.PurityLab" },
          output: { value: "pure1=Report[total=250, average=83.3, grade=B]\npure2=Report[total=250, average=83.3, grade=B]\ngrade60=D\ngrade59=F\nbeforeOrder=0:0.0:F\nafterOrder=250:83.3:B", explanation: ["pure calls는 동일한 complete value를 반환합니다.", "원본의 D/F 경계 60/59를 보존합니다.", "grade를 먼저 부른 stateful object는 default state로 F를 저장합니다."] },
          experiments: [
            { change: "state.total만 다시 호출하고 grade를 읽습니다.", prediction: "old average/grade가 남는 stale state입니다.", result: "derived fields cache invalidation이 필요합니다." },
            { change: "average 계산을 Math.round 정책으로 바꿉니다.", prediction: "일부 totals에서 원본 truncation과 결과가 달라집니다.", result: "rounding policy를 이름·tests에 고정합니다." },
            { change: "Report constructor에서 score range를 검증합니다.", prediction: "invalid input이 complete object 생성 전에 거부됩니다.", result: "invariant boundary를 강화합니다." },
          ],
          sourceRefs: ["java-class02-ex05", "java-class02-ex06", "java-class02-ex07", "java-class02-ex08", "java-math-api"],
        },
      ],
      diagnostics: [
        { symptom: "grade가 null/F이거나 이전 학생 값인데 exception은 없다.", likelyCause: "void calculation calls가 생략·재정렬돼 default/stale fields를 읽었습니다.", checks: ["각 derived field writer를 찾습니다.", "필수 호출 순서를 trace합니다.", "두 번째 input에서 cache invalidation을 봅니다."], fix: "complete immutable result를 한 method에서 return하거나 state machine으로 유효 단계를 type/state에 명시합니다.", prevention: "out-of-order·repeat-input·parallel-call tests를 둡니다." },
        { symptom: "83.36이 83.3인데 문서에는 반올림이라고 적혀 있다.", likelyCause: "cast 기반 truncation과 rounding을 혼동했습니다.", checks: ["연산 순서와 cast 위치를 봅니다.", "경계 값 83.34/83.35/83.36을 비교합니다.", "정책 이름을 확인합니다."], fix: "truncate/round 중 domain 정책을 명시하고 BigDecimal 또는 정확한 정수 규칙으로 구현합니다.", prevention: "경계 기반 rounding tests를 둡니다." },
      ],
    },
    {
      id: "recursion-base-case-stack-contract",
      title: "재귀 method는 base case·감소 measure·overflow·stack depth를 함께 계약화합니다",
      lead: "재귀 호출마다 새 activation이 생기므로 수학적 정의만 아니라 실행 자원도 검토합니다.",
      explanations: [
        "recursive method는 자기 자신을 호출하며 각 invocation에 별도 parameters·locals·return continuation이 생깁니다.",
        "종료를 보이려면 base case와 매 호출에서 base에 가까워지는 well-founded measure가 필요합니다. negative input처럼 measure가 멀어지는 domain을 먼저 거부합니다.",
        "factorial은 작은 n에서도 long overflow가 날 수 있으므로 Math.multiplyExact 같은 명시 policy를 둡니다. stack보다 numeric limit가 먼저 올 수도 있습니다.",
        "Java는 tail-call elimination을 보장하지 않습니다. 입력 깊이가 외부에서 커질 수 있으면 iterative loop·explicit stack·bounded depth를 고려합니다.",
        "StackOverflowError를 정상 control flow로 사용하거나 golden으로 일부러 발생시키지 않습니다. 최대 stack은 JVM options·platform·frame shape에 의존합니다.",
      ],
      concepts: [
        { term: "base case", definition: "더 재귀 호출하지 않고 직접 결과를 반환하는 종료 branch입니다.", detail: ["도달 가능해야 합니다.", "domain edge와 맞아야 합니다."] },
        { term: "progress measure", definition: "각 호출에서 종료 상태를 향해 엄격히 감소하거나 증가하는 값입니다.", detail: ["termination reasoning에 씁니다.", "invalid domain을 찾습니다."] },
        { term: "call depth", definition: "아직 return하지 않은 중첩 method activations 수입니다.", detail: ["stack resource와 관련됩니다.", "Java가 무제한 보장하지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "java-recursion-contract",
          title: "bounded factorial을 재귀·반복 구현으로 교차 검증합니다",
          language: "java",
          filename: "src/learning/oop02/RecursionLab.java",
          purpose: "base case와 negative/overflow 정책을 가진 작은 recursion contract를 만듭니다.",
          code: String.raw`package learning.oop02;

public class RecursionLab {
    static long factorial(int n) {
        if (n < 0) throw new IllegalArgumentException("INVALID_N");
        if (n == 0) return 1L;
        return Math.multiplyExact(n, factorial(n - 1));
    }
    static long iterative(int n) {
        if (n < 0) throw new IllegalArgumentException("INVALID_N");
        long result = 1L;
        for (int value = 2; value <= n; value++) result = Math.multiplyExact(result, value);
        return result;
    }
    public static void main(String[] args) {
        System.out.println("recursive5=" + factorial(5));
        System.out.println("iterative5=" + iterative(5));
        System.out.println("factorial0=" + factorial(0));
        try { factorial(-1); }
        catch (IllegalArgumentException error) { System.out.println("negative=" + error.getMessage()); }
    }
}`,
          walkthrough: [
            { lines: "4-8", explanation: "negative guard, n0 base, n-1 progress와 exact multiplication을 둡니다." },
            { lines: "9-14", explanation: "같은 contract의 iterative oracle을 구현합니다." },
            { lines: "16-20", explanation: "normal5·base0·invalid negative를 실행합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop02/RecursionLab.java && java -cp build/classes learning.oop02.RecursionLab" },
          output: { value: "recursive5=120\niterative5=120\nfactorial0=1\nnegative=INVALID_N", explanation: ["재귀/반복 결과가 5에서 일치합니다.", "negative는 무한 진행 전에 거부됩니다."] },
          experiments: [
            { change: "n==0 base case만 삭제합니다.", prediction: "factorial(0)은 factorial(-1)의 기존 guard에서 INVALID_N으로 끝나므로 정상 identity 1 계약만 깨집니다.", result: "base case와 invalid guard의 서로 다른 역할을 확인합니다." },
            { change: "factorial(21)을 실행합니다.", prediction: "long overflow를 Math.multiplyExact가 ArithmeticException으로 알립니다.", result: "numeric bound를 문서화합니다." },
            { change: "깊은 linked structure 순회를 반복/explicit stack으로 바꿉니다.", prediction: "JVM call depth dependency를 제거할 수 있습니다.", result: "외부 입력에는 bounded strategy를 선택합니다." },
          ],
          sourceRefs: ["jls-method-invocation", "jls-return", "jvms-frames", "java-math-api", "java-stackoverflowerror-api"],
        },
      ],
      diagnostics: [
        { symptom: "재귀 method가 끝나지 않거나 StackOverflowError가 난다.", likelyCause: "base case가 없거나 progress measure가 base에서 멀어집니다.", checks: ["input domain과 base case를 적습니다.", "각 recursive argument가 엄격히 진전하는지 봅니다.", "depth bound를 측정합니다."], fix: "invalid domain을 guard하고 proven progress를 적용하며 외부 대용량 입력은 iterative/bounded algorithm으로 바꿉니다.", prevention: "base·one-step·invalid·maximum-supported-depth tests를 둡니다." },
        { symptom: "factorial 결과가 음수/작은 값으로 조용히 wrap된다.", likelyCause: "numeric overflow policy 없이 곱했습니다.", checks: ["result type bound를 계산합니다.", "checked arithmetic 유무를 봅니다.", "19/20/21 경계를 테스트합니다."], fix: "Math.multiplyExact로 fail-fast하거나 BigInteger와 explicit resource limit을 선택합니다.", prevention: "type-bound boundary tests와 API range 문서를 둡니다." },
      ],
    },
    {
      id: "single-input-owner-validated-pipeline",
      title: "입력 owner 하나가 parsing하고 pure service에 값을 전달해 세 학생을 끝까지 처리합니다",
      lead: "Ex11의 multi-Scanner failure를 단순 workaround가 아니라 ownership·validation·result contract로 고칩니다.",
      explanations: [
        "한 underlying stream에는 outer application이 Scanner 하나만 만들고 close lifetime도 owner가 관리합니다. record/domain object마다 새 wrapper를 만들지 않습니다.",
        "input adapter는 token 존재·type·record count를 검사하고 domain service는 이미 parsing된 name/scores를 받아 계산합니다. 계산 method가 System.in을 알 필요가 없습니다.",
        "각 학생 계산은 immutable Report로 완결하고 printing은 report list가 모두 생성된 뒤 renderer가 담당합니다. partial mutation과 prompt formatting을 core에서 제거합니다.",
        "원본 1-decimal truncation을 보존하되 integer tenths 계산으로 policy를 명시합니다. score range0..100과 nonblank label을 먼저 검사합니다.",
        "EOF·invalid token·extra token 정책을 정합니다. 이 fixture는 정확히 3 records를 읽고 remaining false를 확인하지만 실제 app은 count/header 또는 line-based schema가 더 안전합니다.",
      ],
      concepts: [
        { term: "single reader owner", definition: "한 stream을 감싸는 buffered parser의 생성·소비·close를 한 application component가 책임지는 원칙입니다.", detail: ["ahead buffering 충돌을 막습니다.", "lifetime이 선명합니다."] },
        { term: "input adapter", definition: "외부 text/tokens를 validation된 domain values로 변환하는 boundary component입니다.", detail: ["IO failure를 다룹니다.", "pure core와 분리합니다."] },
        { term: "complete result", definition: "한 계산의 모든 출력 fields가 함께 검증되어 생성된 immutable value입니다.", detail: ["부분 상태가 없습니다.", "renderer와 분리됩니다."] },
      ],
      codeExamples: [
        {
          id: "java-single-scanner-score-pipeline",
          title: "하나의 Scanner로 synthetic 학생 세 명을 읽고 immutable reports를 만듭니다",
          language: "java",
          filename: "src/learning/oop02/SingleScannerPipelineLab.java",
          purpose: "Ex09/11 input ownership defect를 pure calculation과 deterministic fixture로 해결합니다.",
          code: String.raw`package learning.oop02;

import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class SingleScannerPipelineLab {
    record Report(String label, int total, double average, String grade) {}
    static Report calculate(String label, int a, int b, int c) {
        if (label == null || label.isBlank()) throw new IllegalArgumentException("INVALID_LABEL");
        for (int score : new int[] {a, b, c})
            if (score < 0 || score > 100) throw new IllegalArgumentException("INVALID_SCORE");
        int total = Math.addExact(Math.addExact(a, b), c);
        double average = (total * 10 / 3) / 10.0;
        String grade = average >= 90 ? "A" : average >= 80 ? "B" : average >= 70 ? "C" : average >= 60 ? "D" : "F";
        return new Report(label, total, average, grade);
    }
    static Report readOne(Scanner scanner) {
        if (!scanner.hasNext()) throw new IllegalArgumentException("MISSING_LABEL");
        String label = scanner.next();
        int[] scores = new int[3];
        for (int i = 0; i < scores.length; i++) {
            if (!scanner.hasNext()) throw new IllegalArgumentException("MISSING_SCORE");
            if (!scanner.hasNextInt()) throw new IllegalArgumentException("INVALID_SCORE_TOKEN");
            scores[i] = scanner.nextInt();
        }
        return calculate(label, scores[0], scores[1], scores[2]);
    }
    public static void main(String[] args) {
        String fixture = "S1 80 85 85 S2 90 90 90 S3 60 60 60";
        List<Report> reports = new ArrayList<>();
        try (Scanner scanner = new Scanner(new StringReader(fixture))) {
            for (int i = 0; i < 3; i++) reports.add(readOne(scanner));
            String joined = reports.stream()
                .map(r -> r.label() + ':' + r.total() + ':' + r.average() + ':' + r.grade())
                .reduce((left, right) -> left + '|' + right).orElse("");
            System.out.println("reports=" + joined);
            System.out.println("remaining=" + scanner.hasNext());
        }
        try (Scanner malformed = new Scanner(new StringReader("SX 10 nope 20"))) {
            readOne(malformed);
        } catch (IllegalArgumentException error) {
            System.out.println("invalidToken=" + error.getMessage());
        }
    }
}`,
          walkthrough: [
            { lines: "9-18", explanation: "label/scores를 검증하고 checked total·원본 truncation·grade로 complete Report를 반환합니다." },
            { lines: "19-28", explanation: "주입된 한 Scanner에서 record 하나의 네 tokens를 읽습니다." },
            { lines: "30-45", explanation: "각 input stream의 outer owner가 Scanner 하나를 닫고, 세-record summary와 별도 malformed-token error를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop02/SingleScannerPipelineLab.java && java -cp build/classes learning.oop02.SingleScannerPipelineLab" },
          output: { value: "reports=S1:250:83.3:B|S2:270:90.0:A|S3:180:60.0:D\nremaining=false\ninvalidToken=INVALID_SCORE_TOKEN", explanation: ["세 reports가 모두 완결되고 한 input stream에는 Scanner owner가 하나뿐입니다.", "fixture tokens를 정확히 소비하고 원본 D 경계를 보존합니다.", "존재하지만 정수가 아닌 token은 EOF와 다른 error code입니다."] },
          experiments: [
            { change: "별도 fixture를 `S1 80 85`에서 끝냅니다.", prediction: "세 번째 score 위치의 실제 EOF를 MISSING_SCORE로 분류합니다.", result: "존재하는 비정수 token의 INVALID_SCORE_TOKEN과 구분합니다." },
            { change: "S1 score를 101로 바꿉니다.", prediction: "INVALID_SCORE이며 report가 생성되지 않습니다.", result: "validation-before-result를 확인합니다." },
            { change: "StringReader 대신 caller-owned System.in Scanner를 main에서 만듭니다.", prediction: "domain methods 변경 없이 interactive adapter로 교체됩니다.", result: "dependency boundary가 유지됩니다." },
          ],
          sourceRefs: ["java-class02-ex09", "java-class02-ex11", "java-scanner-api", "java-stringreader-api", "java-math-api"],
        },
      ],
      diagnostics: [
        { symptom: "첫 record 뒤 다음 object의 Scanner가 EOF를 보고한다.", likelyCause: "같은 stream에 여러 buffered Scanner owners를 만들었습니다.", checks: ["new Scanner(System.in) 위치를 모두 찾습니다.", "wrapper 수와 close 위치를 봅니다.", "piped multi-record fixture를 실행합니다."], fix: "outer owner의 Scanner 하나를 readOne/inputData parameter로 주입하고 끝에서 한 번 닫습니다.", prevention: "one-reader architecture rule과 3-record integration test를 둡니다." },
        { symptom: "입력 중간 실패 후 일부 fields만 채워진 student object가 남는다.", likelyCause: "token을 읽는 즉시 mutable fields에 기록했습니다.", checks: ["parse/validate/commit 순서를 봅니다.", "exception 뒤 object를 관찰합니다.", "complete constructor 경계를 찾습니다."], fix: "locals에 전부 parse·validate한 뒤 immutable result/domain object를 한 번에 생성합니다.", prevention: "truncated/invalid record에서 no partial result를 assertion합니다." },
      ],
    },
  ],
  lab: {
    title: "single-owner ScoreReportService와 complete result contract",
    scenario: "class02 Ex05~11의 return/void/input variants를 하나의 검증된 학습용 service로 통합하되 System.in·printing·mutable derived fields를 domain core에서 제거합니다.",
    setup: ["JDK 21과 UTF-8 sources를 준비합니다.", "실제 이름 대신 S1 같은 synthetic labels를 사용합니다.", "interactive adapter와 StringReader test adapter가 같은 service를 호출하게 합니다."],
    steps: [
      "11개 원본과 여섯 mains의 compile/run/failure baseline을 먼저 고정합니다.",
      "Score triple과 label의 null·blank·0..100 invariant를 정의합니다.",
      "total은 Math.addExact로 계산하고 평균의 소수 첫째 자리 버림 정책을 이름과 tests에 고정합니다.",
      "grade boundaries 90/80/70/60과 그 바로 아래 값을 table-driven tests로 검증합니다.",
      "Report를 immutable record로 만들어 total·average·grade가 항상 함께 존재하게 합니다.",
      "Scanner는 application adapter에서 하나만 만들고 readOne(Scanner)에 주입합니다.",
      "tokens는 locals에 모두 읽고 검증한 뒤 Report를 생성해 partial object를 막습니다.",
      "renderer는 Report만 받아 privacy-safe text를 만들며 calculation method는 print하지 않습니다.",
      "zero/one/three records, truncated record, invalid token, extra token 정책을 integration tests로 만듭니다.",
      "primitive/reference/array rebind와 mutation, argument order, overload ambiguity compile fixtures를 별도 regression suite로 둡니다.",
      "재귀가 필요한 확장에는 base/progress/depth/numeric bounds를 문서화하고 iterative oracle을 둡니다.",
    ],
    expectedResult: ["세 synthetic students가 one Scanner에서 모두 처리되고 remaining false입니다.", "invalid input에서 incomplete Report나 stale fields가 남지 않습니다.", "pure calculation은 같은 input에 같은 result를 반환합니다.", "원본 truncation policy와 grade boundaries가 실행 evidence에 일치합니다.", "Ex11의 NoSuchElementException은 fixed pipeline에서 사라지고 original audit에는 regression evidence로 남습니다."],
    cleanup: ["test Scanner/StringReader는 try-with-resources로 닫습니다.", "caller-owned System.in을 reusable domain method가 닫지 않습니다.", "temporary class roots는 resolved parent를 확인한 뒤 생성 root만 제거합니다.", "원본 class02 sources는 변경하지 않습니다."],
    extensions: ["Result<Report,InputError> 같은 typed error channel을 설계합니다.", "세 과목 고정 대신 named subject collection으로 확장하고 empty/weight policy를 정의합니다.", "BigDecimal rounding mode를 선택해 truncation과 비교합니다.", "batch processing에서 record line number와 privacy-safe error code를 추가합니다.", "benchmark로 recursion/iteration과 allocation tradeoff를 측정하되 correctness contract와 분리합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "primitive·Box·array를 각각 전달해 parameter rebind와 target mutation을 표와 실행 결과로 비교하세요.", requirements: ["primitive void/return을 포함합니다.", "reference mutate/rebind를 포함합니다.", "array element mutate/rebind를 포함합니다.", "caller 값·identity를 deterministic하게 출력합니다."], hints: ["caller variable과 parameter variable을 별도 칸에 그리세요.", "Java의 모든 경우를 pass-by-value로 설명하세요."], expectedOutcome: "call-by-reference라는 표현 없이 mutation visibility를 정확히 설명합니다.", solutionOutline: ["세 작은 methods를 만듭니다.", "before/after와 alias identity를 검증합니다."] },
    { difficulty: "응용", prompt: "Ex07/08의 void field chain을 immutable ScoreReport 반환 방식으로 리팩터링하세요.", requirements: ["total·average·grade를 한 호출에서 완성합니다.", "0..100 score와 overflow를 검증합니다.", "소수 첫째 자리 정책을 문서화합니다.", "out-of-order/stale-state 문제가 없음을 tests로 보입니다."], hints: ["derived fields를 receiver에 저장할 필요가 있는지 먼저 물으세요.", "record result와 pure static service를 고려하세요."], expectedOutcome: "호출 순서에 의존하지 않는 complete result API가 됩니다.", solutionOutline: ["inputs와 policy를 정의합니다.", "calculate가 Report를 반환하도록 만듭니다."] },
    { difficulty: "설계", prompt: "여러 학생 batch를 처리하는 입력·계산·출력 architecture와 method contracts를 설계하세요.", requirements: ["reader owner는 하나입니다.", "parse/validate/commit과 EOF/extra-token 정책을 정의합니다.", "typed error와 privacy-safe diagnostics를 설계합니다.", "overload/varargs 대신 의미 있는 types/API를 선택합니다.", "concurrency·resource lifetime·test doubles를 설명합니다.", "원본 failure와 fixed regression을 둘 다 보존합니다."], hints: ["functional core와 imperative shell 경계를 그리세요.", "partial success 정책도 명시하세요."], expectedOutcome: "실행 가능한 interface·result/error types·test matrix가 있는 batch contract가 완성됩니다.", solutionOutline: ["InputPort/ScoreService/Renderer를 나눕니다.", "single-owner integration fixture와 pure unit suite를 만듭니다."] },
  ],
  reviewQuestions: [
    { question: "method declaration과 Java signature는 어떻게 다른가요?", answer: "declaration은 modifiers·result·name·parameters·throws·body 등을 포함하지만 signature는 method name과 formal parameter types/type parameters 중심이며 return type·parameter names는 제외됩니다." },
    { question: "return statement는 반드시 method의 마지막 source line이어야 하나요?", answer: "아닙니다. non-void body는 그대로 정상 완료할 수 없으며 성공 경로는 compatible value를 return하고 다른 경로는 throw 등으로 끝날 수 있습니다." },
    { question: "instance method가 object마다 별도 code로 생성되나요?", answer: "그렇게 설명하지 않습니다. instance invocation이 receiver/this를 제공하고 object state를 통해 동작이 달라집니다." },
    { question: "receiver와 arguments는 어떤 순서로 평가되나요?", answer: "receiver expression 뒤 argument expressions가 왼쪽에서 오른쪽으로 평가되고 그 뒤 body가 실행됩니다." },
    { question: "앞 argument가 exception을 던지면 뒤 argument와 body는 실행되나요?", answer: "아닙니다. abrupt completion으로 뒤 arguments와 body가 실행되지 않습니다." },
    { question: "primitive parameter 재대입이 caller variable을 바꾸나요?", answer: "아닙니다. primitive value가 별도 parameter local에 복사됩니다." },
    { question: "reference argument는 pass-by-reference인가요?", answer: "아닙니다. reference value가 복사되는 pass-by-value이며 같은 mutable target을 가리킬 때 mutation이 공유됩니다." },
    { question: "callee의 reference parameter rebind가 caller를 바꾸나요?", answer: "아닙니다. 새 object를 caller가 채택하게 하려면 return 등 명시 result가 필요합니다." },
    { question: "array element mutation과 array parameter rebind의 차이는 무엇인가요?", answer: "element mutation은 shared array target을 바꾸지만 parameter rebind는 callee local만 다른 배열을 가리킵니다." },
    { question: "varargs parameter의 실제 type은 무엇인가요?", answer: "선언된 element type의 배열이며 zero arguments는 보통 length0 array로 packaging됩니다." },
    { question: "return type만 다른 같은 parameter method를 overload할 수 있나요?", answer: "아닙니다. return type은 Java method signature와 overload 선택에 포함되지 않습니다." },
    { question: "fixed arity와 varargs overload가 모두 가능하면 어느 쪽이 먼저 고려되나요?", answer: "fixed arity가 strict/loose invocation phases에서 applicable하면 variable arity phase보다 먼저 선택됩니다." },
    { question: "overload와 override dispatch의 핵심 차이는 무엇인가요?", answer: "overload signature는 compile-time argument types로 선택되고, 선택된 instance signature의 override implementation은 runtime receiver type으로 dispatch될 수 있습니다." },
    { question: "void field pipeline의 핵심 위험은 무엇인가요?", answer: "correctness가 숨은 호출 순서에 의존해 default·stale·partial state를 정상처럼 노출할 수 있다는 점입니다." },
    { question: "원본 평균 83.3은 반올림 결과인가요?", answer: "아닙니다. cast 기반 소수 첫째 자리 버림 정책이며 반올림과 경계 결과가 다를 수 있습니다." },
    { question: "재귀 method termination을 위해 무엇을 보여야 하나요?", answer: "base case, 매 호출에서 base로 진전하는 measure, valid input domain과 최대 지원 depth/numeric bound를 보여야 합니다." },
    { question: "여러 Scanner(System.in)이 왜 서로 방해할 수 있나요?", answer: "각 Scanner가 underlying shared stream에서 ahead buffering할 수 있어 첫 wrapper가 다음 record tokens까지 가져갈 수 있기 때문입니다." },
    { question: "System.in Scanner는 누가 닫아야 하나요?", answer: "application-level single owner가 lifetime을 결정하며 reusable domain/service methods는 caller-owned stream을 닫지 않습니다." },
    { question: "input을 바로 object fields에 기록하면 무엇이 문제인가요?", answer: "중간 EOF/invalid token에서 부분 갱신된 invalid object가 남을 수 있어 locals에 전부 parse·validate한 뒤 한 번에 commit해야 합니다." },
    { question: "pure core가 Scanner나 println을 직접 사용하지 않아야 하는 이유는 무엇인가요?", answer: "입력·출력 dependency와 계산을 분리해 deterministic unit tests, 재사용, parallel execution과 오류 계약을 쉽게 만들기 위해서입니다." },
  ],
  completionChecklist: [
    "class02 11개 sources를 모두 읽고 clean compile했다.",
    "Ex02·04·06·08·10 success outputs를 재현했다.",
    "Ex11 partial stdout·nonzero exit·NoSuchElementException을 재현했다.",
    "원본 개인 이름을 공개 golden에서 synthetic/presence evidence로 바꿨다.",
    "declaration과 signature를 구분했다.",
    "return/access/static/parameter name이 signature에 포함되지 않음을 설명했다.",
    "instance receiver/this와 static context를 구분했다.",
    "receiver·argument 왼쪽→오른쪽 evaluation을 실행했다.",
    "argument exception short-circuit를 설명했다.",
    "primitive pass-by-value를 실행했다.",
    "reference value rebind와 target mutation을 비교했다.",
    "array element mutation과 array rebind를 비교했다.",
    "varargs의 array·empty·null 정책을 설명했다.",
    "모든 normal return paths와 abrupt throw를 구분했다.",
    "finally에서 return/throw를 피해야 하는 이유를 설명했다.",
    "overload applicability phases와 most-specific/ambiguity를 설명했다.",
    "return type만으로 overload할 수 없음을 compile fixture로 확인했다.",
    "pure result와 stateful void temporal coupling을 비교했다.",
    "평균 truncation·divisor·finite 정책을 명시했다.",
    "재귀 base case·progress·depth·overflow를 검토했다.",
    "Scanner owner를 하나로 통합했다.",
    "parse·validate·commit 순서로 partial object를 막았다.",
    "세 synthetic records를 끝까지 처리하고 remaining false를 확인했다.",
    "input adapter·pure service·renderer를 분리했다.",
    "caller-owned resource와 callee close 책임을 구분했다.",
  ],
  nextSessions: [],
  sources: [
    { id: "java-class02-ex01", repository: "javastudy2/classstudy", path: "src/com/java/class02/Ex01_MethodDemo.java", usedFor: ["fields and method declarations", "void/return progression", "sum field mutation"], evidence: "active methods와 commented main, uncalled play02, sum writer play07을 읽었습니다." },
    { id: "java-class02-ex02", repository: "javastudy2/classstudy", path: "src/com/java/class02/Ex02_MethodMain.java", usedFor: ["caller/callee order", "void and return calls", "14-line golden"], evidence: "clean run의 total260·86.6·B·sumField260을 개인 이름 없이 검증했습니다." },
    { id: "java-class02-ex03", repository: "javastudy2/classstudy", path: "src/com/java/class02/Ex03_MethodDemo.java", usedFor: ["overload signatures", "parameters/results", "double stub defect"], evidence: "여덟 active methods와 int/double triples, arbitrary count divisor와 double return0 stub을 확인했습니다." },
    { id: "java-class02-ex04", repository: "javastudy2/classstudy", path: "src/com/java/class02/Ex04_MethodMain.java", usedFor: ["overload invocation", "4-line golden"], evidence: "total250·83.3·B를 header presence와 함께 검증했습니다." },
    { id: "java-class02-ex05", repository: "javastudy2/classstudy", path: "src/com/java/class02/Ex05_MethodDemo.java", usedFor: ["return-based pipeline", "pure-result refactor"], evidence: "four return-based functions의 signatures와 truncation/grade policy를 확인했습니다." },
    { id: "java-class02-ex06", repository: "javastudy2/classstudy", path: "src/com/java/class02/Ex06_MethodMain.java", usedFor: ["single-record Scanner orchestration", "return result composition"], evidence: "synthetic S1 입력이 한 stdout line에서 total250·83.3·B임을 검증했습니다." },
    { id: "java-class02-ex07", repository: "javastudy2/classstudy", path: "src/com/java/class02/Ex07_MethodDemo.java", usedFor: ["void field mutation", "temporal coupling"], evidence: "total→average→grade call order와 derived mutable fields를 확인했습니다." },
    { id: "java-class02-ex08", repository: "javastudy2/classstudy", path: "src/com/java/class02/Ex08_MethodMain.java", usedFor: ["stateful pipeline run", "8-line golden"], evidence: "synthetic S1에서 total250·83.3·B와 prompt/output shape를 검증했습니다." },
    { id: "java-class02-ex09", repository: "javastudy2/classstudy", path: "src/com/java/class02/Ex09_MethodDemo.java", usedFor: ["chained void methods", "per-object Scanner defect", "input ownership"], evidence: "각 object의 new Scanner(System.in), inputData와 calculation/printing chain을 확인했습니다." },
    { id: "java-class02-ex10", repository: "javastudy2/classstudy", path: "src/com/java/class02/Ex10_MethodMain.java", usedFor: ["single-object chained run", "8-line golden"], evidence: "synthetic S1에서 total250·83.3·B를 검증했습니다." },
    { id: "java-class02-ex11", repository: "javastudy2/classstudy", path: "src/com/java/class02/Ex11_MethodMain.java", usedFor: ["object array orchestration", "multi-Scanner failure"], evidence: "synthetic 3명에서 exit1·stdout11행·완료1명·NoSuchElementException을 별도 process로 검증했습니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["UTF-8 clean compile", "Xlint", "compile-fail contracts"], evidence: "원본 11개와 학습 examples의 compiler 기준입니다." },
    { id: "jls-method-declarations", repository: "JLS SE 21", path: "8.4 Method Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4", usedFor: ["declaration anatomy", "body/result/throws"], evidence: "method declaration 문법과 restrictions의 primary specification입니다." },
    { id: "jls-method-signature", repository: "JLS SE 21", path: "8.4.2 Method Signature", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.2", usedFor: ["signature", "return-type/parameter-name exclusion", "overload identity"], evidence: "return/access/static/parameter names를 signature에서 제외하는 근거입니다." },
    { id: "jls-formal-parameters", repository: "JLS SE 21", path: "8.4.1 Formal Parameters", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.1", usedFor: ["parameters", "varargs array"], evidence: "formal parameter와 variable arity 선언 근거입니다." },
    { id: "jls-method-result", repository: "JLS SE 21", path: "8.4.5 Method Result", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.5", usedFor: ["void/value results", "normal paths"], evidence: "method result와 return compatibility 근거입니다." },
    { id: "jls-method-invocation", repository: "JLS SE 21", path: "15.12 Method Invocation Expressions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12", usedFor: ["overload applicability", "receiver", "invocation evaluation"], evidence: "method selection과 invocation semantics의 primary specification입니다." },
    { id: "jls-evaluation-order", repository: "JLS SE 21", path: "15.7 Evaluation Order", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.7", usedFor: ["receiver/argument order", "abrupt short-circuit"], evidence: "left-to-right operand evaluation 근거입니다." },
    { id: "jls-invocation-context", repository: "JLS SE 21", path: "5.3 Invocation Contexts", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.3", usedFor: ["argument conversions", "boxing/widening"], evidence: "parameter 적용 conversions 근거입니다." },
    { id: "jls-this", repository: "JLS SE 21", path: "15.8.3 this", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.8.3", usedFor: ["receiver this", "static context distinction"], evidence: "current receiver expression 근거입니다." },
    { id: "jls-return", repository: "JLS SE 21", path: "14.17 return Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.17", usedFor: ["early return", "reason-return abrupt completion", "finally interaction"], evidence: "return control transfer와 invocation result 구분 근거입니다." },
    { id: "jls-throw", repository: "JLS SE 21", path: "14.18 throw Statement", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.18", usedFor: ["abrupt completion", "domain validation"], evidence: "throw semantics 근거입니다." },
    { id: "jls-exceptions", repository: "JLS SE 21", path: "Chapter 11 Exceptions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html", usedFor: ["exception propagation", "abrupt paths"], evidence: "exception execution model 근거입니다." },
    { id: "jls-reference-values", repository: "JLS SE 21", path: "4.3.1 Objects and 4.12.2 Reference Variables", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.3.1", usedFor: ["reference values", "null", "aliases"], evidence: "reference target/value model 근거입니다." },
    { id: "jls-arrays", repository: "JLS SE 21", path: "Chapter 10 Arrays", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-10.html", usedFor: ["array objects", "elements/runtime type"], evidence: "array type/object semantics 근거입니다." },
    { id: "jvms-frames", repository: "JVMS SE 21", path: "2.6 Frames", publicUrl: "https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.6", usedFor: ["invocation activation", "recursion depth model"], evidence: "method invocation frame의 추상 runtime 근거이며 physical implementation은 과장하지 않습니다." },
    { id: "java-scanner-api", repository: "Java SE 21 API", path: "java.util.Scanner", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Scanner.html", usedFor: ["token parsing", "buffering", "close ownership"], evidence: "Scanner가 input을 buffer할 수 있고 Closeable임을 확인하는 근거입니다." },
    { id: "java-stringreader-api", repository: "Java SE 21 API", path: "java.io.StringReader", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/StringReader.html", usedFor: ["deterministic input fixture"], evidence: "in-memory character input adapter 근거입니다." },
    { id: "java-math-api", repository: "Java SE 21 API", path: "java.lang.Math", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html", usedFor: ["addExact", "multiplyExact", "overflow policy"], evidence: "checked arithmetic examples 근거입니다." },
    { id: "java-object-api", repository: "Java SE 21 API", path: "java.lang.Object", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html", usedFor: ["runtime class and identity comparison"], evidence: "reference example의 Object operations 근거입니다." },
    { id: "java-arrays-api", repository: "Java SE 21 API", path: "java.util.Arrays", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html", usedFor: ["deterministic array rendering", "copy discussion"], evidence: "array utilities 근거입니다." },
    { id: "java-stackoverflowerror-api", repository: "Java SE 21 API", path: "java.lang.StackOverflowError", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StackOverflowError.html", usedFor: ["recursion depth caveat"], evidence: "application이 너무 깊게 재귀할 때의 error 근거이며 정상 fixture로 유발하지 않습니다." },
  ],
  sourceCoverage: { filesRead: 11, filesUsed: 11, uncoveredNotes: ["Ex01~11의 active/commented code와 six mains를 한 progression으로 감사했습니다.", "Ex02/04의 원본 개인 이름은 공개 output에 복제하지 않고 presence만 확인했으며 이후 examples는 S1~S3 synthetic labels를 사용했습니다.", "원본의 instance/static method가 객체별로 생성된다는 식의 표현은 receiver/context model로 교정했습니다.", "return은 마지막 줄이어야 한다는 단순화는 non-void body가 정상 완료할 수 없고 성공 경로가 값을 return해야 한다는 contract로 교정했습니다.", "signature에는 return/access/static/parameter names가 포함되지 않음을 JLS로 교정했습니다.", "Ex03 double triple은 active stub return0이고 arbitrary divisor·zero/finite 검증이 없음을 구현 correctness gap으로 기록했습니다.", "원본 평균은 소수 첫째 자리 truncation이며 rounding이 아니고 score/divisor validation이 없습니다.", "Ex07/08/09의 void derived-field chain은 skip/reorder 시 default/stale state를 노출합니다.", "Ex06/08은 각 process main에서 Scanner를 소유하지만 reusable method가 System.in을 생성/close하지 않도록 경계를 보강했습니다.", "Ex11의 multi-Scanner design은 deterministic 3명 input에서 exit1·NoSuchElementException을 재현했고 single-owner injection으로 해결했습니다.", "argument evaluation·varargs·recursion·overflow·typed complete result는 원본 범위를 official JLS/JVMS/API로 확장한 내용입니다."] },
} satisfies DetailedSession;

export default session;
