import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["oop-03-encapsulation"],
  slug: "oop-03-encapsulation",
  courseId: "java",
  moduleId: "java-oop-design",
  order: 13,
  title: "접근 제한자·캡슐화·getter/setter",
  subtitle: "access boundary를 정확히 계산하고 invariant·privacy·API·동시성까지 보호하는 작은 공개 계약을 설계합니다.",
  level: "중급",
  estimatedMinutes: 620,
  coreQuestion: "필드를 private으로 숨긴 뒤 어떤 공개 행동만 허용해야 객체가 언제나 유효하고, 관찰·변경·조회·동시 실행에서도 계약을 지킬까요?",
  summary: "javastudy2 class03 전체17개를 package smoke compile하고 OOP03 범위 Ex01~06·09·10 여덟 파일을 별도 output에 OpenJDK 21.0.11로 warning-free compile한 뒤 두 자판기 main의 성공 경로를 재현했습니다. 원본은 package-private와 private, getter/setter, boolean isXxx, 인자 타입·순서가 다른 조회 overload를 단계적으로 보여 줍니다. 그러나 private 필드에 무검증 setter를 붙이면 음수 가격·빈 회원 정보·임의 상태 변경을 그대로 허용하고, getter 안의 출력은 단순 조회를 부수 효과가 있는 명령으로 바꿉니다. 이 세션은 네 접근 수준과 특히 cross-package protected 규칙을 compile-fail harness로 확정한 뒤, validated Product/Member, pure getter와 audit service 분리, JavaBeans introspection, defensive copy, typed lookup, 자판기 순수 서비스, reflection과 API 진화, synchronized compound invariant, 계약 테스트까지 확장합니다. private는 접근 문법일 뿐이며 불변식·개인정보 보호·thread safety는 검증된 상태 전이와 출력 정책, 복사·동기화·테스트가 함께 만들 때만 성립합니다.",
  objectives: [
    "public·protected·package-private·private의 접근 가능 범위를 package·subclass·qualifying reference까지 계산할 수 있다.",
    "허용되어야 하는 코드와 거부되어야 하는 코드를 분리한 compile-fail harness로 접근 계약을 검증할 수 있다.",
    "private와 encapsulation을 구분하고 Product·Member의 불변식을 constructor와 의미 있는 command에서 지킬 수 있다.",
    "pure getter와 audit/query use case를 분리하고 JavaBeans naming·introspection의 호환 범위를 설명할 수 있다.",
    "mutable collection·array를 defensive copy하여 representation exposure를 막고 shallow/deep copy 한계를 판단할 수 있다.",
    "primitive/String overload 대신 typed lookup을 설계하고 원본 자판기를 validation·refund가 완전한 순수 서비스로 리팩터링할 수 있다.",
    "reflection·API evolution·privacy redaction·synchronized transition을 함께 고려한 캡슐화 계약을 테스트할 수 있다.",
  ],
  prerequisites: [{ title: "메서드·인자·반환과 값 전달", reason: "캡슐화는 receiver method의 입력·반환·부수 효과 계약으로 상태 변경 통로를 설계하는 작업이므로 값 전달, pure result와 exception 경계를 먼저 이해해야 합니다.", sessionSlug: "oop-02-method-contract" }],
  keywords: ["access modifier", "public", "protected", "package-private", "private", "encapsulation", "invariant", "getter", "setter", "command method", "JavaBeans", "Introspector", "defensive copy", "representation exposure", "typed lookup", "reflection", "API evolution", "privacy", "synchronized", "monitor", "thread safety"],
  chapters: [
    {
      id: "eight-source-golden-audit",
      title: "class03 여덟 원본을 선언·실행·comment assertion으로 나눠 감사합니다",
      lead: "원본의 개인 이름과 반려동물 이름은 공개 출력에 복제하지 않고 존재 여부와 상태 변화만 검증합니다.",
      explanations: [
        "Ex01은 네 package-private 인적 필드와 두 private 반려동물 필드, public getters/setters를 둡니다. getDogName은 값을 돌려주기 전에 console log까지 남겨 조회와 기록 책임을 섞고, age field에 176을 저장해 Ex02가 키로 출력하는 naming/model mismatch도 있습니다.",
        "Ex02는 같은 package라 package-private 필드를 직접 읽고 바꾸지만 private 필드는 주석 처리된 direct access가 compile되지 않아 getter/setter로 우회합니다. 출력 label `degName` 오타와 age/키 불일치를 evidence로 남기되 개인 문자열은 presence만 확인합니다.",
        "Ex03/04는 이름·가격이 package-private인 상품 네 개를 만들고 배열에서 직접 읽는 자판기입니다. synthetic 입력 3000·선택2에서 availability OOXO·잔돈500을 냅니다.",
        "Ex05/06은 필드를 private으로 바꾸고 모든 getter/setter를 추가한 같은 자판기입니다. synthetic 입력 3000·선택4에서 availability OOXO·잔돈200을 내지만 setter가 null 이름과 음수 가격도 허용하므로 불변식은 아직 없습니다.",
        "Ex09는 id/name/email/active를 private으로 두고 get/set를 모두 제공하며 boolean getter는 isActive입니다. id·active까지 자유롭게 덮어쓸 수 있어 식별자 안정성·상태 전이 정책은 호출자에게 흩어져 있습니다.",
        "Ex10의 long, String, (String,long), (long,String) 네 signatures는 compile되지만 parameters를 실제 조회에 쓰지 않습니다. 두 ordered-pair overload는 같은 문구를 출력하고, email과 name은 둘 다 String이라 단일 인자 overload를 동시에 선언할 수도 없으며, 모든 method가 void로 실제 회원이나 부재를 반환하지 않습니다.",
      ],
      concepts: [
        { term: "source audit", definition: "실제 선언, 실행 가능한 main, comment에 적힌 주장, 관찰된 결과를 서로 분리해 기록하는 검증입니다.", detail: ["주석을 runtime evidence로 취급하지 않습니다.", "원본 결함도 학습 근거로 보존합니다."] },
        { term: "privacy-safe evidence", definition: "개인 문자열 자체 대신 non-blank 여부·행 수·상태 전이·exit code처럼 학습에 필요한 최소 사실만 남기는 근거입니다.", detail: ["이름을 golden output에 넣지 않습니다.", "synthetic P1·M1을 후속 예제에 씁니다."] },
        { term: "progression pair", definition: "Ex03/04의 direct field 버전과 Ex05/06의 private accessor 버전을 같은 동작에서 비교하는 원본 쌍입니다.", detail: ["문법 차이를 볼 수 있습니다.", "private만으로 validation이 생기지 않음도 드러납니다."] },
      ],
      codeExamples: [{
        id: "java-original-class03-audit",
        title: "class03 전체17 smoke와 OOP03 범위8을 분리 compile하고 세 main을 privacy-safe summary로 검증합니다",
        language: "powershell",
        filename: "verify-original-class03.ps1",
        purpose: "원본 개인정보를 노출하지 않으면서 compile 범위·getter log·두 자판기 성공 경로를 재현합니다.",
        code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("oop03 original space " + [Guid]::NewGuid().ToString("N"))
if (Test-Path $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
function LastNumber([string]$text) {
  $matches = [regex]::Matches($text, '-?\d+(?:\.\d+)?')
  if ($matches.Count -eq 0) { return "MISSING" }
  return $matches[$matches.Count - 1].Value
}
try {
  $sourceRoot = "src\com\java\class03"
  $packageFiles = Get-ChildItem -LiteralPath $sourceRoot -Filter "*.java" | Select-Object -ExpandProperty FullName
  $scopedNames = @("Ex01_MethodDemo.java", "Ex02_MethodMain.java", "Ex03_MethodDemo.java", "Ex04_MethodMain.java",
    "Ex05_MethodDemo.java", "Ex06_MethodMain.java", "Ex09_Member.java", "Ex10_MemberService.java") |
    ForEach-Object { Join-Path $sourceRoot $_ }
  $packageOut = Join-Path $root "package classes"; $scopedOut = Join-Path $root "scoped classes"
  New-Item -ItemType Directory -Path $packageOut, $scopedOut -ErrorAction Stop | Out-Null
  $packageDiagnostics = Join-Path $root "package-javac.err"
  & javac -encoding UTF-8 -Xlint:all -d $packageOut $packageFiles 2> $packageDiagnostics
  if ($LASTEXITCODE -ne 0) { throw "package compile failed" }
  if (-not [string]::IsNullOrWhiteSpace([string](Get-Content -LiteralPath $packageDiagnostics -Raw))) { throw "package compile warnings" }
  $scopedDiagnostics = Join-Path $root "scoped-javac.err"
  & javac -encoding UTF-8 -Xlint:all -d $scopedOut $scopedNames 2> $scopedDiagnostics
  if ($LASTEXITCODE -ne 0) { throw "scoped compile failed" }
  if (-not [string]::IsNullOrWhiteSpace([string](Get-Content -LiteralPath $scopedDiagnostics -Raw))) { throw "scoped compile warnings" }
  $out2 = @(& java -cp $scopedOut com.java.class03.Ex02_MethodMain); if ($LASTEXITCODE -ne 0) { throw "Ex02 failed" }
  $input4 = (@("3000", "2") -join [Environment]::NewLine) + [Environment]::NewLine
  $out4 = @($input4 | & java -cp $scopedOut com.java.class03.Ex04_MethodMain); if ($LASTEXITCODE -ne 0) { throw "Ex04 failed" }
  $input6 = (@("3000", "4") -join [Environment]::NewLine) + [Environment]::NewLine
  $out6 = @($input6 | & java -cp $scopedOut com.java.class03.Ex06_MethodMain); if ($LASTEXITCODE -ne 0) { throw "Ex06 failed" }
  $availability4 = ([regex]::Matches([string]$out4[1], '[OX]') | ForEach-Object Value) -join ''
  $availability6 = ([regex]::Matches([string]$out6[0], '[OX]') | ForEach-Object Value) -join ''
  $updated = [regex]::Match([string]$out2[6], '^이름:(.+),\s*나이:(\d+)$')
  $ex09 = Get-Content -LiteralPath (Join-Path $sourceRoot "Ex09_Member.java") -Raw
  $ex10 = Get-Content -LiteralPath (Join-Path $sourceRoot "Ex10_MemberService.java") -Raw
  $privateFields = [regex]::Matches($ex09, '(?m)^\s*private\s+\w+\s+\w+\s*(?:=.*)?;').Count
  $accessors = [regex]::Matches($ex09, '(?m)^\s*public\s+\S+\s+(?:get|set|is)\w+\s*\(').Count
  $activeOverloads = [regex]::Matches($ex10, '(?m)^\s*public\s+void\s+findMember\s*\(').Count
  $orderedPairs = [regex]::Matches($ex10, '(?m)^\s*public\s+void\s+findMember\s*\((?:String\s+\w+\s*,\s*long\s+\w+|long\s+\w+\s*,\s*String\s+\w+)\s*\)').Count
  $ex09Main = $ex09 -match 'static\s+void\s+main\s*\('
  $ex10Main = $ex10 -match '(?m)^\s*public\s+static\s+void\s+main\s*\('
  "spacePath:$($root.Contains(' ')),packageCompiled:$($packageFiles.Count),scopedCompiled:$($scopedNames.Count),mains:3,compileOnly:2"
  "Ex02=lines:$($out2.Count),namePresent:$(-not [string]::IsNullOrWhiteSpace(([string]$out2[0] -replace '^.*?:', ''))),height:$(LastNumber $out2[1]),logLines:$(@($out2 | Where-Object {$_ -like '로깅=*'}).Count),dogLabelTypo:$(([string]$out2[3]).StartsWith('degName')),dogNamePresent:$(-not [string]::IsNullOrWhiteSpace(([string]$out2[3] -replace '^.*?:', ''))),dogAge:$(LastNumber $out2[4]),updatedNamePresent:$($updated.Success -and -not [string]::IsNullOrWhiteSpace($updated.Groups[1].Value)),updatedAge:$($updated.Groups[2].Value)"
  "Ex04=lines:$($out4.Count),input:3000,choice:2,availability:$availability4,selectedPresent:$(([string]$out4[2]) -match '>>\s*.+선택$'),change:$(LastNumber $out4[3])"
  "Ex06=lines:$($out6.Count),input:3000,choice:4,availability:$availability6,availabilityInline:$(([string]$out6[0]) -match '탄산음료O'),selectedPresent:$(([string]$out6[1]) -match '>>\s*.+선택$'),change:$(LastNumber $out6[2])"
  "Ex09=mainPresent:$ex09Main,privateFields:$privateFields,accessors:$accessors"
  "Ex10=mainPresent:$ex10Main,activeOverloads:$activeOverloads,commentedStringCollision:$($ex10.Contains('//    public void findMember(String name)')),orderedPairOverloads:$orderedPairs"
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}`,
        walkthrough: [
          { lines: "1-9", explanation: "normalized temp 아래 일부러 공백이 든 고유 root와 마지막 숫자 extractor를 준비합니다." },
          { lines: "11-28", explanation: "class03 전체17과 OOP03 범위8을 서로 다른 output에 -Xlint:all compile하고 stderr가 비어 있는지까지 검사합니다." },
          { lines: "25-34", explanation: "scoped classes에서 Ex02와 synthetic Ex04/06 fixtures를 실행하고 actual stdout만 capture합니다." },
          { lines: "35-43", explanation: "availability·updated value와 Ex09/10 compile-only source shape를 동적으로 추출합니다." },
          { lines: "44-49", explanation: "개인 문자열 없이 exact numeric/shape evidence를 출력하고 resolved parent 확인 뒤 생성 root만 제거합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11", "javastudy2/classstudy root"], command: "pwsh -NoProfile -File verify-original-class03.ps1" },
        output: { value: "spacePath:True,packageCompiled:17,scopedCompiled:8,mains:3,compileOnly:2\nEx02=lines:7,namePresent:True,height:176,logLines:2,dogLabelTypo:True,dogNamePresent:True,dogAge:4,updatedNamePresent:True,updatedAge:10\nEx04=lines:4,input:3000,choice:2,availability:OOXO,selectedPresent:True,change:500\nEx06=lines:3,input:3000,choice:4,availability:OOXO,availabilityInline:True,selectedPresent:True,change:200\nEx09=mainPresent:False,privateFields:4,accessors:8\nEx10=mainPresent:False,activeOverloads:4,commentedStringCollision:True,orderedPairOverloads:2", explanation: ["class03 전체17과 OOP03 범위8이 각각 warning 없이 compile되어 범위 자체 완결성을 확인합니다.", "Ex02의 개인 문자열은 presence만 확인하고 height·log count·age transition을 actual stdout에서 추출합니다.", "Ex04/06은 같은 availability라도 accessor 버전의 메뉴와 flags가 한 줄에 붙는 formatting defect가 있음을 보존합니다.", "Ex09/10은 main 없는 compile-only sources이며 accessor/overload shape를 source에서 동적으로 셉니다."] },
        experiments: [
          { change: "Ex05 setPrice(-1)을 별도 main에서 호출합니다.", prediction: "compile·실행 모두 성공하고 -1이 저장됩니다.", result: "private+setter가 validation을 자동 제공하지 않음을 확인합니다." },
          { change: "Ex02의 private direct-access 주석 한 줄을 활성화합니다.", prediction: "private access compile error가 발생합니다.", result: "거부되어야 할 예제는 다음 compile-fail harness로 고정합니다." },
          { change: "Ex10에 findMember(String name)을 활성화합니다.", prediction: "findMember(String) duplicate declaration compile error입니다.", result: "parameter 이름이 signature를 구분하지 못함을 확인합니다." },
        ],
        sourceRefs: ["java-class03-ex01", "java-class03-ex02", "java-class03-ex03", "java-class03-ex04", "java-class03-ex05", "java-class03-ex06", "java-class03-ex09", "java-class03-ex10", "jdk21-javac"],
      }],
      diagnostics: [
        { symptom: "private으로 바꿨으니 음수 가격이 막힐 것이라 기대했지만 그대로 저장된다.", likelyCause: "access restriction과 domain validation을 같은 기능으로 오해했습니다.", checks: ["모든 constructor·setter·command entry를 찾습니다.", "실패 후 상태가 그대로인지 봅니다.", "reflection/serialization adapter도 경계에 포함합니다."], fix: "상태 전이 메서드에서 입력을 먼저 검증하고 검증 완료 뒤 한 번에 commit합니다.", prevention: "invalid boundary와 unchanged-after-failure를 contract test로 둡니다." },
        { symptom: "원본 main을 golden으로 복사했더니 개인 이름이 공개 페이지에 남는다.", likelyCause: "학습 근거 보존과 원문 데이터 복제를 구분하지 않았습니다.", checks: ["stdout·code literal·diagnostic·screenshot을 검색합니다.", "학습에 문자열 자체가 필요한지 묻습니다.", "synthetic fixture로 재실행합니다."], fix: "존재 여부·행 수·상태 값으로 증거를 축소하고 공개 예제는 P1/M1을 사용합니다.", prevention: "source audit마다 privacy-safe evidence 항목을 둡니다." },
      ],
      expertNotes: ["원본은 학습 순서를 보존하되 잘못된 경계까지 모범 답안으로 승격하지 않습니다.", "compile success·runtime output·domain correctness·privacy safety는 서로 다른 검증 축입니다."],
    },
    {
      id: "access-matrix-protected-qualifier",
      title: "접근 가능성은 선언 위치·package·상속·qualifying reference를 함께 계산합니다",
      lead: "protected를 ‘자식이면 어디서나 접근’이라고 외우면 cross-package 코드에서 틀립니다.",
      explanations: [
        "public member는 declaring type 자체에 접근할 수 있다는 전제에서 어디서나 접근할 수 있습니다. private member는 enclosing top-level class/nest 단위의 규칙을 제외하면 해당 class 구현 밖의 일반 client가 직접 접근하지 못합니다.",
        "modifier가 없으면 package-private입니다. Java keyword default를 쓰는 것이 아니라 선언에서 access modifier를 생략하며, 같은 named package 안의 code만 접근합니다.",
        "protected는 같은 package에서는 package access처럼 접근할 수 있습니다. 다른 package의 subclass에서는 상속 관계와 접근 expression의 qualifying type 제한을 추가로 만족해야 합니다.",
        "예를 들어 other.Child가 base.Owner를 상속해도 Owner 타입의 임의 ref로 ref.protectedValue를 읽을 수 없습니다. this.protectedValue 또는 Child 타입 peer.protectedValue는 subclass body에서 허용됩니다.",
        "접근 제한은 compile-time name/member access를 통제합니다. public getter가 private 값을 그대로 반환하거나 reflection이 access를 열거나 serialization이 내보내면 데이터는 여전히 노출될 수 있습니다.",
        "거부 예제를 main source와 함께 compile하면 build 전체가 깨집니다. positive fixtures와 expected-fail fixtures를 별도 compiler task로 실행하고 error 개수를 assertion해야 합니다.",
      ],
      concepts: [
        { term: "package-private", definition: "access modifier를 쓰지 않은 member가 같은 package code에만 허용되는 접근 수준입니다.", detail: ["default keyword가 아닙니다.", "subpackage는 같은 package가 아닙니다."] },
        { term: "protected qualifying rule", definition: "서로 다른 package에서 subclass가 protected instance member를 접근할 때 qualifying expression type도 접근 중인 subclass 또는 그 subclass여야 한다는 제한입니다.", detail: ["Owner-typed arbitrary reference는 안 됩니다.", "같은 package access에는 이 추가 제한이 없습니다."] },
        { term: "negative compilation test", definition: "특정 source 위치가 의도한 compiler diagnostic으로 반드시 실패해야 계약이 지켜졌다고 판단하는 테스트입니다.", detail: ["실패 boolean만 보지 않고 source line·diagnostic code를 매핑합니다.", "정상 source와 분리합니다."] },
      ],
      codeExamples: [{
        id: "java-access-compile-fail-harness",
        title: "same-package 성공과 cross-package 세 접근 실패를 compiler API로 검증합니다",
        language: "java",
        filename: "AccessCompileHarness.java",
        purpose: "protected qualifier·package-private·private 경계를 실행 가능한 compile contract로 고정합니다.",
        code: String.raw`import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;

public class AccessCompileHarness {
    static boolean compile(JavaCompiler compiler, List<Path> files, List<String> options,
                           DiagnosticCollector<JavaFileObject> diagnostics) throws IOException {
        try (StandardJavaFileManager manager = compiler.getStandardFileManager(diagnostics, null, null)) {
            return compiler.getTask(null, manager, diagnostics, options, null,
                    manager.getJavaFileObjectsFromPaths(files)).call();
        }
    }

    public static void main(String[] args) throws Exception {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) throw new IllegalStateException("JDK required");
        Path root = Files.createTempDirectory("access-contract-");
        Path src = root.resolve("src");
        Path out = root.resolve("out");
        try {
            Path owner = src.resolve("base/Owner.java");
            Path same = src.resolve("base/SamePackage.java");
            Path child = src.resolve("other/GoodChild.java");
            Path broken = src.resolve("other/BrokenChild.java");
            Files.createDirectories(owner.getParent());
            Files.createDirectories(child.getParent());
            Files.writeString(owner, """
                    package base;
                    public class Owner {
                        public int publicValue = 1;
                        protected int protectedValue = 2;
                        int packageValue = 3;
                        private int privateValue = 4;
                    }
                    """);
            Files.writeString(same, """
                    package base;
                    public class SamePackage {
                        int read(Owner o) { return o.publicValue + o.protectedValue + o.packageValue; }
                    }
                    """);
            Files.writeString(child, """
                    package other;
                    import base.Owner;
                    public class GoodChild extends Owner {
                        int own() { return this.protectedValue; }
                        int peer(GoodChild peer) { return peer.protectedValue; }
                    }
                    """);
            Files.writeString(broken, """
                    package other;
                    import base.Owner;
                    public class BrokenChild extends Owner {
                        int foreignOwner(Owner ref) { return ref.protectedValue; }
                        int packageOnly() { return packageValue; }
                        int ownerPrivate() { return privateValue; }
                    }
                    """);
            Files.createDirectories(out);
            var goodDiagnostics = new DiagnosticCollector<JavaFileObject>();
            boolean good = compile(compiler, List.of(owner, same, child),
                    List.of("-encoding", "UTF-8", "-d", out.toString()), goodDiagnostics);
            var badDiagnostics = new DiagnosticCollector<JavaFileObject>();
            boolean bad = compile(compiler, List.of(broken),
                    List.of("-encoding", "UTF-8", "-classpath", out.toString(), "-d", out.toString()), badDiagnostics);
            var errors = badDiagnostics.getDiagnostics().stream()
                    .filter(d -> d.getKind() == Diagnostic.Kind.ERROR)
                    .sorted(java.util.Comparator.comparingLong(Diagnostic::getLineNumber)).toList();
            var lines = errors.stream().map(Diagnostic::getLineNumber).toList();
            var codes = errors.stream().map(Diagnostic::getCode).toList();
            boolean mapped = lines.equals(List.of(4L, 5L, 6L)) && codes.equals(List.of(
                    "compiler.err.report.access",
                    "compiler.err.not.def.public.cant.access",
                    "compiler.err.report.access"));
            System.out.println("goodCompile=" + good);
            System.out.println("badCompile=" + bad);
            System.out.println("badErrors=" + errors.size());
            System.out.println("badMapped=" + mapped);
        } finally {
            try (var paths = Files.walk(root)) {
                paths.sorted(Comparator.reverseOrder()).forEach(path -> {
                    try { Files.deleteIfExists(path); } catch (IOException e) { throw new RuntimeException(e); }
                });
            }
        }
    }
}`,
        walkthrough: [
          { lines: "13-19", explanation: "JavaCompiler task를 호출해 성공 여부와 structured diagnostics를 분리합니다." },
          { lines: "28-57", explanation: "Owner, same-package client, 허용된 subclass, 금지된 subclass를 각각 독립 source로 만듭니다." },
          { lines: "59-69", explanation: "정상 세 source를 먼저 compile한 뒤 그 classpath에서 금지 source만 별도 compile합니다." },
          { lines: "70-82", explanation: "각 ERROR를 source line4/5/6과 javac diagnostic code에 매핑해 다른 우연한 세 오류로 통과하지 못하게 합니다." },
          { lines: "83-91", explanation: "compile booleans·error count·mapping 결과를 출력하고 temp tree를 제거합니다." },
        ],
        run: { environment: ["OpenJDK 21.0.11 javac diagnostic codes"], command: "javac AccessCompileHarness.java && java AccessCompileHarness" },
        output: { value: "goodCompile=true\nbadCompile=false\nbadErrors=3\nbadMapped=true", explanation: ["same package에서 public/protected/package-private 합산은 허용됩니다.", "다른 package subclass의 Owner-qualified protected, package-private, private 접근이 각각 의도한 source line/diagnostic code에서 실패합니다."] },
        experiments: [
          { change: "foreignOwner의 parameter type을 접근 중인 class와 같은 BrokenChild로 바꿉니다.", prediction: "protected qualifying rule을 만족해 해당 오류가 사라지고 badErrors=2입니다.", result: "임의의 sibling subclass GoodChild가 아니라 accessing subclass S 또는 S의 subtype이어야 합니다." },
          { change: "other를 base.child package로 바꿉니다.", prediction: "subpackage도 base와 다른 package이므로 packageValue 오류는 유지됩니다.", result: "점으로 이어진 package 이름은 포함 관계가 아닙니다." },
          { change: "Owner.privateValue를 public으로 바꿉니다.", prediction: "그 오류는 사라지지만 공개 mutable field가 API가 됩니다.", result: "compile 편의와 encapsulation 비용을 함께 기록합니다." },
        ],
        sourceRefs: ["java-class03-ex01", "java-class03-ex02", "jls-access-control", "jls-protected-access", "java-compiler-api"],
      }],
      diagnostics: [
        { symptom: "다른 package의 subclass인데 ref.protectedField가 compile되지 않는다.", likelyCause: "ref의 compile-time type이 superclass라 protected qualifying rule을 위반했습니다.", checks: ["접근 code가 declaring package 밖인지 봅니다.", "접근 중인 class가 subclass인지 봅니다.", "qualifying expression의 compile-time type을 봅니다."], fix: "subclass가 자기/동료 subclass state를 다루도록 API를 재설계하고 임의 superclass object 접근은 public/protected behavior로 요청합니다.", prevention: "cross-package Owner-typed/Child-typed pair를 negative fixture로 둡니다." },
        { symptom: "base.tools package에서 base의 package-private member를 읽을 수 없다.", likelyCause: "subpackage를 같은 package로 오해했습니다.", checks: ["두 package declaration을 문자 단위로 비교합니다.", "module과 package를 혼동하지 않습니다.", "modifier 생략 여부를 확인합니다."], fix: "정말 같은 implementation unit이면 package를 맞추고, 아니면 필요한 최소 public/protected behavior를 제공합니다.", prevention: "package naming tree와 access boundary를 별개로 문서화합니다." },
      ],
      comparisons: [{ title: "네 access 수준 선택", options: [
        { name: "private", chooseWhen: "class 구현 세부를 외부 계약에서 숨길 때", avoidWhen: "협력 객체가 직접 field를 공유해야 한다고 성급히 결론 낼 때", tradeoffs: ["가장 작은 문법 경계", "공개 method 설계가 필요"] },
        { name: "package-private", chooseWhen: "한 package 내부 협력 구현만 공유할 때", avoidWhen: "다른 module/package consumer API일 때", tradeoffs: ["테스트와 구현 협력에 유용", "package 재배치 비용"] },
        { name: "protected", chooseWhen: "검증된 subclass extension point가 필요할 때", avoidWhen: "단순 편의를 위해 내부 mutable state를 노출할 때", tradeoffs: ["상속 결합", "cross-package qualifier 규칙"] },
        { name: "public", chooseWhen: "모든 consumer가 의존할 안정된 계약일 때", avoidWhen: "향후 변경 가능한 representation일 때", tradeoffs: ["사용 편의", "호환성 유지 비용"] },
      ] }],
    },
    {
      id: "private-versus-encapsulation-product-invariant",
      title: "private는 문을 잠글 뿐이고 invariant는 모든 생성·변경 통로가 지킵니다",
      lead: "setter를 자동 생성하기 전에 객체가 절대로 허용하면 안 되는 상태를 한 문장으로 씁니다.",
      explanations: [
        "invariant는 public operation 전후에 항상 참이어야 하는 객체 규칙입니다. Product라면 code는 blank가 아니고 price는 0보다 크다는 규칙을 둘 수 있습니다.",
        "private field는 client의 direct assignment를 막지만 public setPrice가 모든 int를 저장하면 음수 상태는 여전히 공개 API로 만들어집니다. 접근 차단과 의미 검증은 별도 책임입니다.",
        "constructor가 모든 필수 값을 받아 검증하면 client가 반쯤 초기화된 객체를 관찰하는 구간이 없습니다. constructor 상세 문법은 다음 세션에서 확장하지만 여기서는 invariant 시작점으로 사용합니다.",
        "setPrice보다 changePrice가 의도를 더 잘 드러냅니다. command 이름은 단순 저장이 아니라 정책을 거친 상태 전이라는 사실을 호출자에게 알립니다.",
        "검증은 mutation 전에 끝내야 합니다. code를 먼저 바꾸고 price 검증에서 throw하면 부분 update가 남으므로 locals에서 검증하거나 한 field command씩 atomic하게 commit합니다.",
        "모든 setter를 없애는 것이 목표는 아닙니다. 변경 가능한 domain이라면 허용 범위·실패 형식·실패 후 unchanged를 명시한 method를 제공합니다.",
      ],
      concepts: [
        { term: "invariant", definition: "객체가 외부에서 관찰 가능한 안정 시점마다 반드시 만족해야 하는 상태 관계입니다.", detail: ["field 하나의 범위일 수도 있습니다.", "여러 field의 관계일 수도 있습니다."] },
        { term: "command method", definition: "setX라는 저장 동작보다 rename·changePrice처럼 domain 의도와 정책을 표현하는 상태 전이 method입니다.", detail: ["검증 위치를 모읍니다.", "감사·권한 정책을 붙이기 쉽습니다."] },
        { term: "failure atomicity", definition: "operation이 실패하면 operation 전의 유효 상태가 그대로 남는 성질입니다.", detail: ["검증 후 commit합니다.", "여러 field 갱신은 transaction처럼 봅니다."] },
      ],
      codeExamples: [{
        id: "java-validated-product",
        title: "무검증 private setter와 invariant를 지키는 Product를 대조합니다",
        language: "java",
        filename: "ValidatedProductLab.java",
        purpose: "private만으로는 막지 못하는 음수 상태와 command validation·failure atomicity를 실행합니다.",
        code: String.raw`public class ValidatedProductLab {
    static final class LeakyProduct {
        private int price;
        void setPrice(int price) { this.price = price; }
        int getPrice() { return price; }
    }

    static final class Product {
        private final String code;
        private int price;

        Product(String code, int price) {
            this.code = requireCode(code);
            this.price = requirePrice(price);
        }
        String code() { return code; }
        int price() { return price; }
        void changePrice(int candidate) { this.price = requirePrice(candidate); }
        private static String requireCode(String value) {
            if (value == null || value.isBlank()) throw new IllegalArgumentException("code is blank");
            return value;
        }
        private static int requirePrice(int value) {
            if (value <= 0) throw new IllegalArgumentException("price must be positive");
            return value;
        }
    }

    public static void main(String[] args) {
        LeakyProduct leaky = new LeakyProduct();
        leaky.setPrice(-1);
        System.out.println("leakyPrice=" + leaky.getPrice());

        Product safe = new Product("P1", 1500);
        safe.changePrice(1800);
        System.out.println(safe.code() + "=" + safe.price());
        try {
            safe.changePrice(0);
        } catch (IllegalArgumentException e) {
            System.out.println("rejected=" + e.getMessage());
        }
        System.out.println("unchanged=" + safe.price());
    }
}`,
        walkthrough: [
          { lines: "2-6", explanation: "field는 private이지만 unrestricted setter 때문에 -1이 합법 상태가 됩니다." },
          { lines: "8-24", explanation: "Product는 생성과 가격 변경이 같은 검증 함수를 통과하고 code 변경 통로는 제공하지 않습니다." },
          { lines: "31-40", explanation: "정상 변경 뒤 0 변경을 거부하고 exception 이후 1800이 유지됨을 검증합니다." },
        ],
        run: { environment: ["OpenJDK 21+"], command: "javac ValidatedProductLab.java && java ValidatedProductLab" },
        output: { value: "leakyPrice=-1\nP1=1800\nrejected=price must be positive\nunchanged=1800", explanation: ["private 여부와 유효성은 독립입니다.", "requirePrice가 assignment 전에 실행되어 실패 후 price는 1800입니다."] },
        experiments: [
          { change: "changePrice에서 먼저 this.price=candidate를 하고 뒤에 검증합니다.", prediction: "exception은 나지만 unchanged=0이 되어 invariant와 failure atomicity를 잃습니다.", result: "validate-then-commit 순서가 계약입니다." },
          { change: "code setter를 추가합니다.", prediction: "P1 identity를 key로 쓰는 map/cache가 변경 후 어긋날 수 있습니다.", result: "변경 가능성은 사용 사례가 요구할 때만 엽니다." },
          { change: "price upper bound 1_000_000을 정책에 추가합니다.", prediction: "경계 1_000_000은 허용, 1_000_001은 거부하도록 test가 늘어납니다.", result: "invariant는 code와 tests에 같은 경계로 명시합니다." },
        ],
        sourceRefs: ["java-class03-ex03", "java-class03-ex05", "jls-field-declarations", "jls-method-declarations"],
      }],
      diagnostics: [
        { symptom: "exception은 발생했는데 객체의 field 일부가 invalid 값으로 바뀌었다.", likelyCause: "mutation 뒤 validation하거나 여러 field를 순차 commit했습니다.", checks: ["첫 assignment 위치를 찾습니다.", "throw 직전 상태를 snapshot합니다.", "실패 후 unchanged assertion을 추가합니다."], fix: "모든 candidate를 locals에서 검증한 뒤 단일 commit 구간에서 갱신합니다.", prevention: "각 command에 success·lower/upper boundary·failure unchanged test를 둡니다." },
        { symptom: "모든 field에 setter가 있어 호출자가 어떤 변경이 허용되는지 알 수 없다.", likelyCause: "IDE accessors 생성을 캡슐화 설계로 대체했습니다.", checks: ["각 setter의 실제 use case를 찾습니다.", "identity·derived·sensitive fields를 표시합니다.", "domain verb로 이름 붙일 수 있는지 봅니다."], fix: "불필요 setter를 제거하고 rename/changePrice/deactivate 같은 제한된 command로 바꿉니다.", prevention: "public method마다 권한·입력·전이·실패·감사 요구를 문서화합니다." },
      ],
      comparisons: [{ title: "상태 변경 API", options: [
        { name: "generic setter", chooseWhen: "단순 binding DTO처럼 별도 validation layer가 명확할 때", avoidWhen: "domain invariant와 권한을 객체가 지켜야 할 때", tradeoffs: ["framework 친화적", "의도·전이 규칙이 약함"] },
        { name: "domain command", chooseWhen: "변경 이유와 규칙이 중요한 entity일 때", avoidWhen: "값 전달만 하는 immutable message일 때", tradeoffs: ["의도와 검증 집중", "메서드 수가 use case를 반영"] },
        { name: "immutable replacement", chooseWhen: "작은 value object와 snapshot일 때", avoidWhen: "identity를 유지하며 빈번히 변하는 aggregate일 때", tradeoffs: ["추론·thread safety 유리", "새 객체/참조 교체 필요"] },
      ] }],
    },
    {
      id: "validated-member-identity-state-transitions",
      title: "Member는 식별자·연락처·활성 상태를 서로 다른 변경 정책으로 다룹니다",
      lead: "필드 타입이 같아도 수명과 권한이 다르면 같은 setter 정책을 적용하지 않습니다.",
      explanations: [
        "원본 Ex09의 id/name/email/active는 모두 private이지만 모든 setter가 열려 있습니다. client는 id를 바꿔 repository key와 객체 state를 불일치시키고 inactive를 다시 true로 되돌릴 수도 있습니다.",
        "id는 생성 뒤 고정하고 name과 email은 각각 rename/changeEmail로 변경합니다. active는 deactivate라는 단방향 command만 열어 요구사항에 없는 임의 재활성화를 막습니다.",
        "이 학습 시스템은 email 전체를 case-insensitive login identifier로 취급한다는 domain 정책 아래 trim과 Locale.ROOT lower-case를 적용한 뒤 최소 구조를 검증합니다. 모든 인터넷 email local-part의 보편 규칙이라고 일반화하지 않으며, 실제 제품은 확인 메일과 uniqueness transaction이 별도 필요합니다.",
        "boolean read convention은 isActive가 자연스럽지만 isXxx라는 이름이 authorization을 만들지는 않습니다. 민감한 field를 누가 볼 수 있는지는 service/use case와 반환 DTO에서도 통제해야 합니다.",
        "getter가 private field를 그대로 돌려주면 그 값은 공개 API입니다. email처럼 개인정보인 값은 내부 entity getter를 넓게 노출하기보다 필요한 use case에 redacted snapshot을 반환할 수 있습니다.",
        "toString·exception·audit log에도 개인정보가 새어 나갈 수 있습니다. 이 예제 snapshot은 domain 이름과 상태만 보여 주고 email은 별도 masked method로 제공합니다.",
      ],
      concepts: [
        { term: "stable identity", definition: "객체 수명 동안 바뀌지 않아 map key·database identity·reference 관계를 안정시키는 식별자입니다.", detail: ["final field로 표현할 수 있습니다.", "public setter를 두지 않습니다."] },
        { term: "state transition", definition: "현재 상태와 명령 조건에 따라 다음 유효 상태로 이동하는 domain operation입니다.", detail: ["inactive 재호출 정책을 정합니다.", "허용되지 않은 역전이를 닫습니다."] },
        { term: "redaction", definition: "목적에 불필요한 민감 부분을 가려 최소 정보만 반환·기록하는 처리입니다.", detail: ["private와 별개입니다.", "logs·toString도 대상입니다."] },
      ],
      codeExamples: [{
        id: "java-validated-member",
        title: "고정 id·검증된 변경·단방향 deactivate·masked email을 구현합니다",
        language: "java",
        filename: "ValidatedMemberLab.java",
        purpose: "원본의 blind setters를 필드별 수명과 privacy가 드러나는 계약으로 바꿉니다.",
        code: String.raw`import java.util.Locale;

public class ValidatedMemberLab {
    static final class Member {
        private final long id;
        private String name;
        private String email;
        private boolean active = true;

        Member(long id, String name, String email) {
            if (id <= 0) throw new IllegalArgumentException("id must be positive");
            this.id = id;
            this.name = requireText(name, "name");
            this.email = normalizeEmail(email);
        }
        long id() { return id; }
        String name() { return name; }
        boolean isActive() { return active; }
        void rename(String candidate) { name = requireText(candidate, "name"); }
        void changeEmail(String candidate) { email = normalizeEmail(candidate); }
        void deactivate() { active = false; }
        String maskedEmail() {
            int at = email.indexOf('@');
            return email.substring(0, 1) + "***" + email.substring(at);
        }
        private static String requireText(String value, String label) {
            if (value == null || value.isBlank()) throw new IllegalArgumentException(label + " is blank");
            return value.trim();
        }
        private static String normalizeEmail(String value) {
            String normalized = requireText(value, "email").toLowerCase(Locale.ROOT);
            int at = normalized.indexOf('@');
            if (at <= 0 || at != normalized.lastIndexOf('@') || at == normalized.length() - 1)
                throw new IllegalArgumentException("invalid email");
            return normalized;
        }
    }

    public static void main(String[] args) {
        Member member = new Member(1, "M1", " S1@Example.Test ");
        member.rename("M2");
        member.deactivate();
        System.out.println("id=" + member.id() + ",name=" + member.name() + ",active=" + member.isActive());
        System.out.println("email=" + member.maskedEmail());
        try {
            member.changeEmail("invalid");
        } catch (IllegalArgumentException e) {
            System.out.println("rejected=" + e.getMessage());
        }
        System.out.println("emailAfterFailure=" + member.maskedEmail());
    }
}`,
        walkthrough: [
          { lines: "4-15", explanation: "id는 final로 고정하고 constructor가 세 필수 값 전체를 검증합니다." },
          { lines: "16-25", explanation: "필드별 read/command 계약과 email redaction을 분리합니다." },
          { lines: "26-35", explanation: "Locale.ROOT 정규화와 예제 수준의 구조 검증을 assignment 전에 완료합니다." },
          { lines: "39-50", explanation: "synthetic data만 사용하고 invalid 변경 뒤 masked email이 유지됨을 확인합니다." },
        ],
        run: { environment: ["OpenJDK 21+"], command: "javac ValidatedMemberLab.java && java ValidatedMemberLab" },
        output: { value: "id=1,name=M2,active=false\nemail=s***@example.test\nrejected=invalid email\nemailAfterFailure=s***@example.test", explanation: ["id는 바뀌지 않고 active는 command로 false가 됩니다.", "입력 email은 정규화되지만 공개 출력은 masked입니다.", "invalid 변경은 기존 email을 훼손하지 않습니다."] },
        experiments: [
          { change: "public setActive(boolean)을 추가해 true를 전달합니다.", prediction: "정책에 없는 재활성화가 가능해집니다.", result: "상태 전이는 필요한 방향만 공개해야 합니다." },
          { change: "maskedEmail 대신 raw email을 toString에 포함합니다.", prediction: "debug·exception·collection logging에서 개인정보가 넓게 복제됩니다.", result: "출력 계약도 캡슐화 경계입니다." },
          { change: "changeEmail에서 assignment 후 구조를 검사합니다.", prediction: "실패 후 invalid raw value가 남습니다.", result: "normalize/validate result를 받은 뒤 commit합니다." },
        ],
        sourceRefs: ["java-class03-ex09", "jls-private-access", "java-locale-api"],
      }],
      diagnostics: [
        { symptom: "Member id 변경 뒤 map.get(oldId) 객체의 내부 id가 newId라 서로 다르다.", likelyCause: "식별자 setter가 repository key와 독립적으로 호출됐습니다.", checks: ["id setter 존재 여부를 봅니다.", "key와 entity id를 함께 assertion합니다.", "merge/import use case를 일반 변경과 분리합니다."], fix: "일반 entity id를 final로 만들고 식별자 변환은 별도 migration transaction으로 수행합니다.", prevention: "identity field는 생성 시점·변경 권한·저장소 key 계약을 함께 설계합니다." },
        { symptom: "field는 private인데 운영 log에 전체 email이 남는다.", likelyCause: "getter/toString/exception/audit payload가 raw 값을 공개했습니다.", checks: ["log arguments와 generated toString을 검색합니다.", "DTO serialization field를 확인합니다.", "목적별 최소 disclosure를 정합니다."], fix: "기본 출력은 stable id와 masked 값으로 제한하고 권한 있는 use case만 raw value를 받습니다.", prevention: "privacy tests와 log review를 access modifier review와 별도로 수행합니다." },
      ],
      expertNotes: ["email uniqueness는 단일 객체 invariant만으로 보장할 수 없고 repository/database transaction이 필요합니다.", "private field라도 heap dump·debugger·reflection·serialization에서 보일 수 있으므로 secret 저장 자체와 lifecycle을 별도 설계합니다."],
    },
    {
      id: "pure-getter-audit-query-separation",
      title: "getter는 예측 가능한 관찰로 두고 감사 기록은 명시적 use case에서 남깁니다",
      lead: "getX가 호출될 때마다 console·network·database 작업을 하면 단순한 property read가 숨은 명령이 됩니다.",
      explanations: [
        "원본 Ex01 getDogName은 println 뒤 값을 반환합니다. 학습용 logging 의도는 보이지만 framework introspection, debugger, template renderer가 getter를 여러 번 호출하면 중복 log와 성능·개인정보 문제가 생길 수 있습니다.",
        "Java 언어가 getter purity를 강제하지는 않습니다. 그러나 동일한 객체 상태에서 관찰만 하고 domain state나 외부 system을 바꾸지 않는 accessor는 추론·테스트·캐시·UI binding에 유리한 강한 관례입니다.",
        "감사가 필요한 것은 대개 field를 읽었다는 저수준 사실이 아니라 ‘누가 어떤 회원 상세 조회 use case를 수행했다’는 보안 사건입니다. actor·purpose·target id를 아는 application service가 더 적절한 경계입니다.",
        "audit sink를 interface로 주입하면 domain object는 console을 모르고 test는 in-memory counter로 정확히 한 번 기록됐는지 확인할 수 있습니다.",
        "민감한 값 자체를 audit payload에 넣지 않습니다. stable id·action·결과를 기록하고 raw value는 권한 검사 뒤 호출자에게만 반환합니다.",
        "CQRS 전체 구조를 도입하지 않아도 query와 command 이름을 구분할 수 있습니다. `name()`은 관찰, `findNameForSupport(actor,id)`는 권한·감사가 있는 use case입니다.",
      ],
      concepts: [
        { term: "pure accessor", definition: "객체 상태를 관찰해 값을 돌려주되 관찰 가능한 외부 부수 효과를 만들지 않는 읽기 method입니다.", detail: ["언어 강제가 아닌 설계 계약입니다.", "동일 상태에서 예측하기 쉽습니다."] },
        { term: "audit event", definition: "보안·규정 관점에서 누가 어떤 목적과 대상에 어떤 작업을 했는지 남기는 명시적 사건입니다.", detail: ["raw 개인정보를 최소화합니다.", "성공/거부도 정책에 따라 남깁니다."] },
        { term: "application service", definition: "권한, repository 조회, audit 같은 여러 협력 작업을 한 use case로 조정하는 경계입니다.", detail: ["entity getter와 다릅니다.", "dependency를 주입받습니다."] },
      ],
      codeExamples: [{
        id: "java-pure-getter-audit-service",
        title: "순수 accessor와 감사되는 명시적 query를 호출 횟수로 구분합니다",
        language: "java",
        filename: "PureGetterAuditLab.java",
        purpose: "getter 안의 println을 제거하고 use case 경계에서 audit event를 정확히 한 번 기록합니다.",
        code: String.raw`public class PureGetterAuditLab {
    static final class Member {
        private final long id;
        private final String displayName;
        Member(long id, String displayName) { this.id = id; this.displayName = displayName; }
        long id() { return id; }
        String displayName() { return displayName; }
    }
    interface AuditSink { void record(String actor, String action, long targetId); }
    static final class CountingAudit implements AuditSink {
        private int count;
        public void record(String actor, String action, long targetId) { count++; }
        int count() { return count; }
    }
    static final class MemberQuery {
        private final AuditSink audit;
        MemberQuery(AuditSink audit) { this.audit = audit; }
        String viewDisplayName(String actor, Member member) {
            if (actor == null || actor.isBlank()) throw new IllegalArgumentException("actor is blank");
            audit.record(actor, "VIEW_MEMBER_NAME", member.id());
            return member.displayName();
        }
    }

    public static void main(String[] args) {
        Member member = new Member(1, "M1");
        CountingAudit audit = new CountingAudit();
        System.out.println("direct1=" + member.displayName());
        System.out.println("direct2=" + member.displayName());
        System.out.println("afterDirect=" + audit.count());
        MemberQuery query = new MemberQuery(audit);
        System.out.println("audited=" + query.viewDisplayName("SUPPORT-1", member));
        System.out.println("afterQuery=" + audit.count());
    }
}`,
        walkthrough: [
          { lines: "2-8", explanation: "Member accessors는 저장된 값을 반환할 뿐 console/audit dependency를 모릅니다." },
          { lines: "9-14", explanation: "AuditSink와 test double이 기록 횟수를 결정적으로 관찰합니다." },
          { lines: "15-23", explanation: "MemberQuery가 actor 검증·audit·값 반환을 한 use case로 조정합니다." },
          { lines: "26-34", explanation: "direct reads 두 번은 count0, 명시 query 한 번은 count1임을 보입니다." },
        ],
        run: { environment: ["OpenJDK 21+"], command: "javac PureGetterAuditLab.java && java PureGetterAuditLab" },
        output: { value: "direct1=M1\ndirect2=M1\nafterDirect=0\naudited=M1\nafterQuery=1", explanation: ["순수 accessor 반복은 audit state를 바꾸지 않습니다.", "명시 query만 사건을 한 번 남깁니다."] },
        experiments: [
          { change: "displayName getter 안에서 audit.record를 호출하도록 합칩니다.", prediction: "UI/framework 호출 횟수에 따라 audit count가 달라지고 entity가 audit dependency를 갖습니다.", result: "저수준 read와 use case 사건을 분리합니다." },
          { change: "audit payload에 displayName 전체를 추가합니다.", prediction: "log storage에 불필요한 개인정보 복제본이 생깁니다.", result: "targetId와 action만으로 목적을 충족하는지 검토합니다." },
          { change: "blank actor로 query를 호출합니다.", prediction: "audit 전에 IllegalArgumentException이 나고 count는 증가하지 않습니다.", result: "거부 사건 기록 여부는 별도 보안 정책으로 명시합니다." },
        ],
        sourceRefs: ["java-class03-ex01", "java-class03-ex02", "java-beans-introspector-api"],
      }],
      diagnostics: [
        { symptom: "화면 한 번 렌더링했는데 getter log가 여러 줄 생긴다.", likelyCause: "template/binding framework가 property를 반복 introspect/read하며 getter가 부수 효과를 가집니다.", checks: ["getter 호출 stack과 횟수를 봅니다.", "getter 안 I/O·logging·mutation을 찾습니다.", "use case entry log와 구분합니다."], fix: "getter를 pure read로 바꾸고 명시 application query에서 한 번 audit합니다.", prevention: "accessor unit test에서 반복 호출 전후 collaborator/state가 unchanged인지 확인합니다." },
        { symptom: "모든 field read를 audit했지만 누가 왜 조회했는지 알 수 없다.", likelyCause: "entity getter에는 actor와 business purpose context가 없습니다.", checks: ["event가 actor·action·target·result를 갖는지 봅니다.", "raw value가 과도하게 포함됐는지 봅니다.", "실제 규정 사건 단위를 확인합니다."], fix: "authorization과 target을 아는 use case boundary에서 semantic audit event를 기록합니다.", prevention: "audit schema를 getter 목록이 아니라 threat/use-case model에서 설계합니다." },
      ],
      expertNotes: ["감사 저장 실패 때 조회도 실패시킬지, outbox로 후속 전송할지는 규정과 가용성 요구의 trade-off입니다.", "pure getter도 mutable object reference를 반환하면 간접 mutation 통로가 될 수 있으므로 defensive copy가 다음 경계입니다."],
    },
    {
      id: "javabeans-naming-introspection-boundary",
      title: "JavaBeans accessor 규약은 도구 호환 계약이지 모든 domain에 setter를 만들라는 명령이 아닙니다",
      lead: "getX/isX/setX 이름은 Introspector가 property를 발견하게 하지만 invariant의 품질은 구현이 결정합니다.",
      explanations: [
        "JavaBeans Introspector의 property discovery는 public getX/setX 또는 boolean isX method 형식을 보고 no-arg constructor를 요구하지 않습니다. 다만 일부 binding framework가 객체를 직접 생성할 때 public no-arg constructor를 별도로 요구하며, 둘 다 Java field 접근 규칙과는 다른 convention/API입니다.",
        "Introspector는 method 이름·형식에서 PropertyDescriptor를 만듭니다. boolean active에 isActive와 setActive가 있으면 read/write property로 보이고 displayName도 getter/setter 쌍으로 보입니다.",
        "getter만 있으면 read-only property, setter만 있으면 write-only property가 될 수 있습니다. framework binding 요구 때문에 domain entity의 모든 변경 권한을 여는 대신 별도 request/DTO bean을 둘 수 있습니다.",
        "record accessor는 componentName() 형태이므로 전통 JavaBeans Introspector가 자동으로 getComponentName property로 해석한다고 가정하면 안 됩니다. 사용하는 framework의 record 지원을 확인합니다.",
        "setter 안에서도 validation할 수 있지만 no-arg 생성 직후 필수 field가 비어 있는 시간대가 생깁니다. binding DTO는 validation 후 domain constructor/factory로 변환해 invalid domain object가 퍼지지 않게 합니다.",
        "property rename은 compile reference가 없어도 template·configuration·serialization 이름을 깨뜨릴 수 있습니다. reflection 기반 contract도 명시적 API evolution 대상으로 관리합니다.",
      ],
      concepts: [
        { term: "JavaBeans property", definition: "Introspector가 public accessor method pattern으로 발견하는 논리 property입니다.", detail: ["field 존재가 필수는 아닙니다.", "language keyword가 아닙니다."] },
        { term: "PropertyDescriptor", definition: "property 이름·type·read method·write method 정보를 제공하는 java.beans metadata입니다.", detail: ["Object property를 제외할 수 있습니다.", "framework contract test에 쓸 수 있습니다."] },
        { term: "binding DTO", definition: "도구가 값을 채우기 쉬운 형태로 받고 validation 후 domain object로 변환하는 boundary object입니다.", detail: ["entity와 변경 권한을 분리합니다.", "invalid intermediate state를 boundary에 가둡니다."] },
      ],
      codeExamples: [{
        id: "java-beans-introspection",
        title: "boolean isX와 get/set property를 Introspector로 열거합니다",
        language: "java",
        filename: "JavaBeansIntrospectionLab.java",
        purpose: "accessor naming이 실제 property metadata로 어떻게 보이는지 JDK API로 확인합니다.",
        code: String.raw`import java.beans.Introspector;
import java.util.Arrays;
import java.util.Comparator;

public class JavaBeansIntrospectionLab {
    public static class ProfileBean {
        private String displayName;
        private boolean active;
        public ProfileBean() {}
        public String getDisplayName() { return displayName; }
        public void setDisplayName(String value) { displayName = value; }
        public boolean isActive() { return active; }
        public void setActive(boolean value) { active = value; }
    }

    public static void main(String[] args) throws Exception {
        var descriptors = Introspector.getBeanInfo(ProfileBean.class, Object.class)
                .getPropertyDescriptors();
        Arrays.sort(descriptors, Comparator.comparing(d -> d.getName()));
        for (var descriptor : descriptors) {
            System.out.println(descriptor.getName() + ":" + descriptor.getPropertyType().getSimpleName()
                    + ":read=" + (descriptor.getReadMethod() != null)
                    + ":write=" + (descriptor.getWriteMethod() != null));
        }
        ProfileBean bean = new ProfileBean();
        bean.setDisplayName("M1");
        bean.setActive(true);
        System.out.println("value=" + bean.getDisplayName() + ",active=" + bean.isActive());
    }
}`,
        walkthrough: [
          { lines: "6-14", explanation: "public nested bean은 binder 호환용 no-arg constructor와 String get/set, boolean is/set 쌍을 가지며 property discovery 자체는 accessor 형식으로 검증합니다." },
          { lines: "17-25", explanation: "Object.class에서 introspection을 멈춰 class property를 제외하고 이름순으로 deterministic 출력합니다." },
          { lines: "26-30", explanation: "도구가 호출할 수 있는 같은 public accessors로 값을 넣고 읽습니다." },
        ],
        run: { environment: ["OpenJDK 21+", "JDK java.desktop module"], command: "javac JavaBeansIntrospectionLab.java && java JavaBeansIntrospectionLab" },
        output: { value: "active:boolean:read=true:write=true\ndisplayName:String:read=true:write=true\nvalue=M1,active=true", explanation: ["isActive는 boolean read method로 발견됩니다.", "두 setter가 있어 두 property 모두 writable입니다."] },
        experiments: [
          { change: "setActive를 제거합니다.", prediction: "active는 read=true:write=false property가 됩니다.", result: "read-only bean property도 가능합니다." },
          { change: "isActive를 getActive로 바꿉니다.", prediction: "boolean/Boolean 세부 규약과 framework 지원을 다시 확인해야 하며 이 JDK Introspector에서는 boolean get도 read method로 인식될 수 있습니다.", result: "프로젝트가 요구하는 convention을 contract test로 고정합니다." },
          { change: "ProfileBean을 record Profile(String displayName, boolean active)로 바꿉니다.", prediction: "전통 get/is pattern이 없어 같은 descriptors를 기대할 수 없습니다.", result: "record 지원은 사용하는 mapper/framework 문서로 검증합니다." },
        ],
        sourceRefs: ["java-class03-ex05", "java-class03-ex09", "java-beans-introspector-api", "java-beans-propertydescriptor-api"],
      }],
      diagnostics: [
        { symptom: "field와 getter가 있는데 framework가 property를 찾지 못한다.", likelyCause: "public visibility·get/is/set signature·class accessibility 또는 framework naming 규약이 맞지 않습니다.", checks: ["Introspector descriptor를 직접 출력합니다.", "method public 여부와 return/parameter type을 봅니다.", "framework의 record/field access mode를 확인합니다."], fix: "boundary DTO에서 요구 convention을 맞추고 descriptor contract test를 추가합니다.", prevention: "reflection 기반 mapping은 compile test만이 아니라 실제 mapper/introspection integration test로 검증합니다." },
        { symptom: "binding을 위해 entity setter를 모두 열었더니 business rule을 우회한다.", likelyCause: "transport binding model과 domain mutation API를 하나의 class로 합쳤습니다.", checks: ["누가 setter를 호출하는지 검색합니다.", "invalid intermediate state가 service로 넘어가는지 봅니다.", "DTO→domain 변환 지점을 찾습니다."], fix: "writable DTO를 validation한 뒤 제한된 domain constructor/command로 변환합니다.", prevention: "framework 편의와 domain invariant를 별도 type으로 분리합니다." },
      ],
      comparisons: [{ title: "framework 입력 모델", options: [
        { name: "mutable JavaBean DTO", chooseWhen: "전통 binder가 no-arg+setters를 요구할 때", avoidWhen: "그 자체가 신뢰된 domain entity로 돌아다닐 때", tradeoffs: ["도구 호환성", "invalid intermediate state"] },
        { name: "immutable record DTO", chooseWhen: "framework가 constructor/record binding을 지원할 때", avoidWhen: "지원이 검증되지 않은 legacy binder일 때", tradeoffs: ["간결·immutable", "JavaBeans naming과 다름"] },
        { name: "domain entity", chooseWhen: "invariant·행동·identity를 보호할 때", avoidWhen: "serializer 요구에 그대로 노출할 때", tradeoffs: ["정책 집중", "adapter/mapper 필요"] },
      ] }],
    },
    {
      id: "defensive-copy-representation-exposure",
      title: "private collection·array도 reference를 그대로 받거나 돌려주면 외부에서 바뀝니다",
      lead: "필드 선언이 private인지보다 mutable representation으로 들어오고 나가는 모든 reference 경계를 추적합니다.",
      explanations: [
        "private List나 array는 이름으로 직접 접근할 수 없을 뿐입니다. constructor가 caller의 mutable list reference를 그대로 저장하면 caller가 원본 list를 바꿔 내부 상태를 우회 변경할 수 있습니다.",
        "getter가 내부 list를 그대로 반환해도 같은 representation exposure가 생깁니다. setter가 없어도 returned reference의 add/remove가 사실상 숨은 setter 역할을 합니다.",
        "List.copyOf는 호출 시점 요소를 담은 unmodifiable List를 반환해 이후 mutable input collection의 구조 변경이 반영되지 않게 합니다. 입력이 이미 unmodifiable List면 새 instance를 만들지 않을 수도 있으므로 identity는 계약이 아닙니다. null list뿐 아니라 null element도 거부하고 요소 object 자체까지 deep copy하지는 않습니다.",
        "Collections.unmodifiableList는 기존 backing list의 read-only view라 caller가 backing list를 바꾸면 view에도 반영됩니다. 독립 snapshot이 목표면 copy가 필요합니다.",
        "array는 clone 또는 Arrays.copyOf로 입력과 출력을 각각 복사합니다. constructor에서만 복사하고 getter에서 원본 배열을 반환하면 여전히 새어 나갑니다.",
        "mutable 요소가 들어 있는 List는 container만 복사해도 요소 alias가 남습니다. immutable value elements를 사용하거나 각 element를 복제·snapshot으로 변환하는 deep-copy 정책이 필요합니다.",
      ],
      concepts: [
        { term: "representation exposure", definition: "객체의 내부 mutable representation을 가리키는 reference가 외부에 전달되어 공개 method를 우회한 변경이 가능해지는 현상입니다.", detail: ["입력 alias와 반환 alias가 모두 있습니다.", "private만으로 막히지 않습니다."] },
        { term: "defensive copy", definition: "신뢰 경계에서 mutable 입력을 복제해 저장하고 mutable 내부 값을 복제해 반환하는 기법입니다.", detail: ["양방향 경계를 확인합니다.", "copy 시점을 계약에 적습니다."] },
        { term: "shallow copy", definition: "container 구조는 복제하지만 그 안의 element references는 같은 objects를 가리키는 복사입니다.", detail: ["immutable element면 충분할 수 있습니다.", "mutable element에는 deep policy가 필요합니다."] },
      ],
      codeExamples: [{
        id: "java-defensive-copy-list-array",
        title: "List.copyOf와 array clone으로 입력·출력 alias를 모두 끊습니다",
        language: "java",
        filename: "DefensiveCopyLab.java",
        purpose: "setter가 없는 private field도 mutable reference로 우회될 수 있음을 차단하고 실행 결과로 확인합니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class DefensiveCopyLab {
    static final class Enrollment {
        private final List<String> topics;
        private final byte[] digest;

        Enrollment(List<String> topics, byte[] digest) {
            this.topics = List.copyOf(topics);
            this.digest = digest.clone();
        }
        List<String> topics() { return topics; }
        byte[] digest() { return digest.clone(); }
    }

    public static void main(String[] args) {
        List<String> inputTopics = new ArrayList<>(List.of("java"));
        byte[] inputDigest = {1, 2, 3};
        Enrollment enrollment = new Enrollment(inputTopics, inputDigest);
        inputTopics.add("outside");
        inputDigest[0] = 9;
        System.out.println("topics=" + enrollment.topics());
        try {
            enrollment.topics().add("blocked");
        } catch (UnsupportedOperationException e) {
            System.out.println("viewMutation=blocked");
        }
        byte[] returned = enrollment.digest();
        returned[1] = 8;
        System.out.println("digest=" + Arrays.toString(enrollment.digest()));
    }
}`,
        walkthrough: [
          { lines: "6-15", explanation: "List는 immutable snapshot, array는 constructor와 getter 양쪽에서 clone합니다." },
          { lines: "19-24", explanation: "caller 소유 입력 list/array를 바꿔도 Enrollment 내부는 유지됩니다." },
          { lines: "25-33", explanation: "list 반환값 변경은 거부되고 array 반환 copy 변경도 내부 digest에 영향이 없습니다." },
        ],
        run: { environment: ["OpenJDK 21+"], command: "javac DefensiveCopyLab.java && java DefensiveCopyLab" },
        output: { value: "topics=[java]\nviewMutation=blocked\ndigest=[1, 2, 3]", explanation: ["입력 list의 outside 추가와 입력 array의 9 변경은 내부에 반영되지 않습니다.", "두 getter를 통한 변경도 구조와 byte 값을 바꾸지 못합니다."] },
        experiments: [
          { change: "this.topics=topics로 원본 reference를 저장합니다.", prediction: "inputTopics.add 뒤 topics=[java, outside]가 됩니다.", result: "입력 boundary defensive copy가 필요합니다." },
          { change: "digest()가 digest를 그대로 반환하게 합니다.", prediction: "returned[1]=8 뒤 내부 출력이 [1, 8, 3]입니다.", result: "출력 boundary도 별도로 복사해야 합니다." },
          { change: "List<StringBuilder>를 List.copyOf로 저장하고 element.append를 호출합니다.", prediction: "list 구조는 고정돼도 같은 StringBuilder가 변합니다.", result: "List.copyOf는 shallow snapshot입니다." },
        ],
        sourceRefs: ["java-class03-ex03", "java-class03-ex05", "java-list-copyof-api", "java-arrays-api"],
      }],
      diagnostics: [
        { symptom: "setter가 없는데 내부 목록이 외부 코드 실행 뒤 바뀐다.", likelyCause: "constructor 입력 또는 getter 반환이 같은 mutable list를 가리킵니다.", checks: ["identityHashCode가 아니라 reference 흐름을 추적합니다.", "constructor assignment와 getter return을 봅니다.", "element 자체의 mutability도 확인합니다."], fix: "입력에서 snapshot을 만들고 unmodifiable/defensive result를 반환하며 mutable element도 변환합니다.", prevention: "input mutation·returned mutation·mutable element mutation 세 contract test를 둡니다." },
        { symptom: "unmodifiableList를 썼는데 원본 list 변경이 화면에 나타난다.", likelyCause: "Collections.unmodifiableList는 backing list view이지 독립 copy가 아닙니다.", checks: ["생성 API가 view인지 copy인지 확인합니다.", "backing list owner를 찾습니다.", "snapshot 시점 요구를 정합니다."], fix: "독립 snapshot이면 List.copyOf 또는 new ArrayList 후 unmodifiable wrapper를 사용합니다.", prevention: "view/live data와 snapshot을 API 이름·문서에 구분합니다." },
      ],
      comparisons: [{ title: "목록 반환 전략", options: [
        { name: "원본 mutable List", chooseWhen: "객체가 의도적으로 공동 소유 collection API일 때만", avoidWhen: "invariant를 객체가 보호해야 할 때", tradeoffs: ["복사 비용 없음", "representation exposure"] },
        { name: "unmodifiable view", chooseWhen: "내부 변경을 실시간 읽게 하되 caller mutation만 막을 때", avoidWhen: "고정 snapshot이 필요할 때", tradeoffs: ["live view", "backing 변경 노출"] },
        { name: "immutable snapshot", chooseWhen: "호출 시점 값을 안정적으로 전달할 때", avoidWhen: "큰 목록을 초고빈도로 복사하고 측정상 병목일 때", tradeoffs: ["alias 차단", "복사·메모리 비용"] },
      ] }],
      expertNotes: ["복사 비용은 측정 후 최적화하며 correctness 때문에 필요한 ownership boundary를 먼저 명확히 합니다.", "Stream 반환도 source collection이 동시에 바뀌는 lifetime 문제를 만들 수 있어 snapshot/lock 정책이 필요합니다."],
    },
    {
      id: "typed-member-lookup-contract",
      title: "조회 조건을 타입으로 만들면 String overload 충돌과 인자 순서 실수를 없앨 수 있습니다",
      lead: "email·name이 모두 String이어도 domain 의미는 다르므로 signature에 그 차이를 올립니다.",
      explanations: [
        "원본 Ex10은 findMember(long id)와 findMember(String email)을 overload하지만 findMember(String name)은 같은 signature라 주석 처리돼 있습니다. parameter 이름 email/name은 Java signature에 포함되지 않습니다.",
        "(String,long)과 (long,String)은 compile되지만 호출자가 순서를 외워야 하고 같은 숫자·문자 조합이 늘면 API가 읽기 어렵습니다. overload는 domain query 종류를 충분히 표현하지 못합니다.",
        "MemberId와 EmailAddress 같은 작은 value type은 validation·normalization을 생성 경계에 모으고 compiler가 서로 바꿔 전달하는 실수를 막습니다.",
        "조회 종류가 늘면 sealed Lookup hierarchy와 단일 find(Lookup)를 사용할 수 있습니다. exhaustive switch가 새 subtype 추가 때 처리 누락을 compile-time에 드러냅니다.",
        "조회 결과는 void println 대신 Optional<MemberSummary>로 존재/부재를 typed result로 표현합니다. 다만 authorization failure와 system error를 Optional.empty로 뭉개지 말고 별도 exception/result로 구분해야 합니다.",
        "여러 결과가 가능한 이름 조회는 Optional이 아니라 List가 더 맞습니다. query type뿐 아니라 cardinality와 ambiguity도 반환형 계약에 포함합니다.",
      ],
      concepts: [
        { term: "value object", definition: "primitive/String에 domain 의미·validation·동등성 규칙을 붙인 작은 값 타입입니다.", detail: ["MemberId와 EmailAddress를 구분합니다.", "잘못된 값은 생성에서 거부합니다."] },
        { term: "typed query", definition: "조회 조건의 종류와 필수 값을 별도 type으로 표현해 method 인자 의미를 compiler가 확인하게 하는 계약입니다.", detail: ["순서 의존을 줄입니다.", "새 조회 종류를 명시적으로 추가합니다."] },
        { term: "cardinality", definition: "조회가 0/1개인지 0..N개인지 반환형으로 표현하는 결과 개수 계약입니다.", detail: ["Optional은 0/1입니다.", "List는 여러 결과를 표현합니다."] },
      ],
      codeExamples: [{
        id: "java-typed-member-lookup",
        title: "sealed Lookup과 Optional summary로 id/email/name 조회를 분리합니다",
        language: "java",
        filename: "TypedLookupLab.java",
        purpose: "String signature 충돌 없이 조회 의미·validation·부재를 type으로 드러냅니다.",
        code: String.raw`import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

public class TypedLookupLab {
    record MemberId(long value) {
        MemberId { if (value <= 0) throw new IllegalArgumentException("invalid id"); }
    }
    record EmailAddress(String value) {
        EmailAddress {
            if (value == null) throw new IllegalArgumentException("invalid email");
            value = value.trim().toLowerCase(Locale.ROOT);
            int at = value.indexOf('@');
            if (at <= 0 || at != value.lastIndexOf('@') || at == value.length() - 1)
                throw new IllegalArgumentException("invalid email");
        }
    }
    sealed interface Lookup permits ById, ByEmail, ByName {}
    record ById(MemberId id) implements Lookup { ById { Objects.requireNonNull(id, "id"); } }
    record ByEmail(EmailAddress email) implements Lookup { ByEmail { Objects.requireNonNull(email, "email"); } }
    record ByName(String name) implements Lookup {
        ByName {
            if (name == null || name.isBlank()) throw new IllegalArgumentException("invalid name");
            name = name.trim();
        }
    }
    record MemberRecord(MemberId id, String name, EmailAddress email) {}
    record MemberSummary(MemberId id, String name) {}

    static final class MemberService {
        private final List<MemberRecord> members;
        MemberService(List<MemberRecord> members) { this.members = List.copyOf(members); }
        Optional<MemberSummary> find(Lookup lookup) {
            return members.stream().filter(member -> switch (lookup) {
                case ById query -> member.id().equals(query.id());
                case ByEmail query -> member.email().equals(query.email());
                case ByName query -> member.name().equals(query.name());
            }).findFirst().map(member -> new MemberSummary(member.id(), member.name()));
        }
    }

    public static void main(String[] args) {
        var service = new MemberService(List.of(
                new MemberRecord(new MemberId(1), "M1", new EmailAddress("s1@example.test")),
                new MemberRecord(new MemberId(2), "M2", new EmailAddress("s2@example.test"))));
        System.out.println("byId=" + service.find(new ById(new MemberId(1))).orElseThrow().name());
        System.out.println("byEmail=" + service.find(new ByEmail(new EmailAddress("S2@EXAMPLE.TEST"))).orElseThrow().name());
        System.out.println("byName=" + service.find(new ByName("M1")).orElseThrow().id().value());
        System.out.println("missing=" + service.find(new ById(new MemberId(9))).isPresent());
    }
}`,
        walkthrough: [
          { lines: "7-18", explanation: "MemberId와 EmailAddress가 의미를 감싸고, 이 domain의 case-insensitive identifier 정책에 따라 trim/lower한 뒤 local/domain 경계를 검증합니다." },
          { lines: "19-31", explanation: "query components를 검증하고 raw email을 가진 내부 record와 email을 생략한 공개 summary를 분리합니다." },
          { lines: "33-43", explanation: "service는 input list를 copy하고 exhaustive pattern switch 뒤 privacy-safe summary로 map합니다." },
          { lines: "46-54", explanation: "이 학습 domain의 identifier canonicalization과 0/1 Optional 부재를 deterministic하게 실행합니다." },
        ],
        run: { environment: ["OpenJDK 21+"], command: "javac TypedLookupLab.java && java TypedLookupLab" },
        output: { value: "byId=M1\nbyEmail=M2\nbyName=1\nmissing=false", explanation: ["id/email/name query가 서로 다른 type으로 compile됩니다.", "이 domain의 case-insensitive identifier 정규화로 대소문자 입력도 M2를 찾습니다.", "반환 summary에는 raw email이 없고 id9 부재는 Optional false입니다."] },
        experiments: [
          { change: "new ById(new EmailAddress(...))로 호출합니다.", prediction: "argument type mismatch로 compile되지 않습니다.", result: "compiler가 조회 의미 혼동을 막습니다." },
          { change: "Lookup에 ByActive를 추가하고 switch case를 생략합니다.", prediction: "switch expression이 exhaustive하지 않아 compile 실패합니다.", result: "새 query 처리 누락이 build에서 보입니다." },
          { change: "같은 이름 M1을 두 명 추가합니다.", prediction: "findFirst는 한 명만 반환해 ambiguity를 숨깁니다.", result: "ByName은 List 반환 전용 method/query contract가 더 적절합니다." },
        ],
        sourceRefs: ["java-class03-ex09", "java-class03-ex10", "jls-method-signature", "jls-pattern-switch", "java-optional-api"],
      }],
      diagnostics: [
        { symptom: "findMember(String name)을 추가했더니 duplicate method compile error가 난다.", likelyCause: "기존 email overload도 findMember(String)이며 parameter 이름은 signature가 아닙니다.", checks: ["method name과 parameter type sequence를 적습니다.", "return type과 parameter name을 제외합니다.", "domain 의미 type을 분리할지 판단합니다."], fix: "EmailAddress/MemberName query type 또는 findByEmail/findByName 명시 이름을 사용합니다.", prevention: "primitive obsession이 API ambiguity를 만드는지 review합니다." },
        { symptom: "Optional.empty라 조회 부재인지 권한 거부인지 장애인지 알 수 없다.", likelyCause: "서로 다른 failure channels를 0/1 결과 하나로 압축했습니다.", checks: ["not found·forbidden·timeout을 분류합니다.", "audit와 HTTP/CLI mapping 요구를 봅니다.", "호출자가 복구 방법을 구분해야 하는지 확인합니다."], fix: "정상 부재만 Optional로 두고 권한/장애는 typed error 또는 exception/result로 분리합니다.", prevention: "각 result variant와 caller action을 API 계약에 표로 둡니다." },
      ],
      comparisons: [{ title: "조회 API 모양", options: [
        { name: "findByEmail/findByName", chooseWhen: "조회 종류가 적고 명시 이름이 가장 읽기 쉬울 때", avoidWhen: "동적 query 조합이 빠르게 늘 때", tradeoffs: ["간단·명확", "method 수 증가"] },
        { name: "overloaded value types", chooseWhen: "동작은 같고 인자 domain type만 다를 때", avoidWhen: "primitive/String 그대로라 의미가 충돌할 때", tradeoffs: ["compiler 보호", "작은 type 정의 필요"] },
        { name: "sealed query hierarchy", chooseWhen: "query를 전달·저장·exhaustive dispatch할 때", avoidWhen: "두 단순 조회뿐이라 구조가 과할 때", tradeoffs: ["확장 지점 명시", "query class 수 증가"] },
      ] }],
    },
    {
      id: "vending-service-refactor-complete-result",
      title: "자판기는 private fields보다 검증된 catalog와 완전한 PurchaseResult가 핵심입니다",
      lead: "Scanner·출력·가격 비교를 분리하면 환불·선택·잔돈 규칙을 모든 경계에서 테스트할 수 있습니다.",
      explanations: [
        "원본 Ex04/06은 상품 배열과 선택 흐름을 잘 보여 주지만 최소 금액을 1500/1800으로 별도 hard-code하고 실제 product prices와 중복합니다. catalog가 바뀌면 시작 분기와 상품 가격이 어긋날 수 있습니다.",
        "Ex06은 private accessor로 direct field 접근을 없앴지만 null 이름·음수 가격을 setter로 만들 수 있고, 입력/계산/출력이 main에 결합되어 branch test가 어렵습니다.",
        "리팩터링 Product는 code와 positive price를 생성에서 검증하고 catalog는 List.copyOf로 snapshot을 소유합니다. choice는 array index로 바꾸기 전에 1..size를 검증합니다.",
        "purchase는 성공·금액 부족·잘못된 선택을 모두 PurchaseResult로 반환합니다. 실패 때 refund는 투입 전액이고 성공 때 change는 money-price라 money conservation을 확인할 수 있습니다.",
        "available은 각 product price<=money를 계산하므로 별도 최저가 상수가 없습니다. 빈 catalog도 자연스럽게 빈 availability와 invalid selection으로 처리됩니다.",
        "service는 Scanner와 println을 모르므로 pure core로 반복 실행할 수 있습니다. adapter가 token parse와 locale UI를 책임지고 renderer가 result를 사람용 문장으로 바꿉니다.",
      ],
      concepts: [
        { term: "complete result", definition: "성공/실패 상태와 caller가 다음 행동에 필요한 product·change·refund를 한 반환값에 모두 담는 계약입니다.", detail: ["부분 field update를 피합니다.", "branch를 exhaustive test하기 쉽습니다."] },
        { term: "single source of truth", definition: "가격 가능 여부와 차감이 같은 Product.price에서 계산되어 중복 상수 불일치를 없애는 설계입니다.", detail: ["최저가 hard-code를 제거합니다.", "catalog 변경이 한 곳에 반영됩니다."] },
        { term: "money conservation", definition: "성공 시 투입액=가격+잔돈, 실패 시 환불=투입액이 되는 금액 보존 invariant입니다.", detail: ["overflow policy도 필요할 수 있습니다.", "각 result branch에서 확인합니다."] },
      ],
      codeExamples: [{
        id: "java-vending-pure-service",
        title: "검증된 Product·snapshot catalog·typed PurchaseResult로 자판기를 다시 만듭니다",
        language: "java",
        filename: "VendingRefactorLab.java",
        purpose: "원본의 direct/accessor 차이를 넘어 선택 범위·금액·refund·잔돈 invariant를 한 pure service에서 지킵니다.",
        code: String.raw`import java.util.List;

public class VendingRefactorLab {
    record Product(String code, int price) {
        Product {
            if (code == null || code.isBlank()) throw new IllegalArgumentException("blank code");
            if (price <= 0) throw new IllegalArgumentException("invalid price");
        }
    }
    sealed interface PurchaseResult permits Dispensed, Rejected {}
    record Dispensed(String productCode, int change) implements PurchaseResult {
        Dispensed {
            if (productCode == null || productCode.isBlank() || change < 0)
                throw new IllegalArgumentException("invalid success");
        }
    }
    enum RejectReason { INVALID_SELECTION, INSUFFICIENT_FUNDS }
    record Rejected(RejectReason reason, int refund) implements PurchaseResult {
        Rejected {
            if (reason == null || refund < 0) throw new IllegalArgumentException("invalid rejection");
        }
    }

    static final class VendingService {
        private final List<Product> catalog;
        VendingService(List<Product> catalog) { this.catalog = List.copyOf(catalog); }
        List<String> availability(int money) {
            if (money < 0) throw new IllegalArgumentException("negative money");
            return catalog.stream().map(p -> p.code() + ":" + (p.price() <= money)).toList();
        }
        PurchaseResult purchase(int money, int oneBasedChoice) {
            if (money < 0) throw new IllegalArgumentException("negative money");
            if (oneBasedChoice < 1 || oneBasedChoice > catalog.size())
                return new Rejected(RejectReason.INVALID_SELECTION, money);
            Product selected = catalog.get(oneBasedChoice - 1);
            if (money < selected.price())
                return new Rejected(RejectReason.INSUFFICIENT_FUNDS, money);
            return new Dispensed(selected.code(), money - selected.price());
        }
    }
    static String render(String label, PurchaseResult result) {
        return switch (result) {
            case Dispensed success -> label + '=' + success.productCode() + ",change=" + success.change();
            case Rejected failure -> label + '=' + failure.reason() + ",refund=" + failure.refund();
        };
    }

    public static void main(String[] args) {
        var service = new VendingService(List.of(
                new Product("P1", 1800), new Product("P2", 3500), new Product("P3", 3200)));
        System.out.println("available=" + service.availability(3200));
        System.out.println(render("success", service.purchase(3200, 3)));
        System.out.println(render("badChoice", service.purchase(3200, 9)));
        System.out.println(render("notEnough", service.purchase(2000, 2)));
    }
}`,
        walkthrough: [
          { lines: "4-25", explanation: "Product와 sealed Dispensed/Rejected variants가 성공·실패별 필드 조합과 nonnegative amounts를 강제합니다." },
          { lines: "27-42", explanation: "catalog snapshot, nonnegative money, choice-before-index, funds-before-subtraction 순서를 지킵니다." },
          { lines: "44-49", explanation: "exhaustive pattern switch renderer가 branch마다 존재하는 필드만 읽습니다." },
          { lines: "52-57", explanation: "availability·성공·잘못된 선택·금액 부족 네 결과를 synthetic product code로 검증합니다." },
        ],
        run: { environment: ["OpenJDK 21+"], command: "javac VendingRefactorLab.java && java VendingRefactorLab" },
        output: { value: "available=[P1:true, P2:false, P3:true]\nsuccess=P3,change=0\nbadChoice=INVALID_SELECTION,refund=3200\nnotEnough=INSUFFICIENT_FUNDS,refund=2000", explanation: ["3200으로 P1/P3만 구매 가능하고 P3는 잔돈0입니다.", "두 실패 branch는 투입 전액을 refund합니다."] },
        experiments: [
          { change: "choice 검증 전에 catalog.get(choice-1)을 호출합니다.", prediction: "0·9 입력에서 typed result 대신 IndexOutOfBoundsException입니다.", result: "외부 입력은 index 변환 전에 검사합니다." },
          { change: "Product price를 0 허용으로 바꿉니다.", prediction: "무료 상품이라는 새 domain 의미가 생기며 기존 positive-price invariant가 달라집니다.", result: "무료 허용 여부는 우연한 숫자가 아니라 명시 정책입니다." },
          { change: "new Dispensed(\"P1\", -1)을 직접 생성합니다.", prediction: "invalid success exception으로 불가능한 음수 잔돈 상태를 거부합니다.", result: "result variant 자체도 service를 우회한 생성을 방어합니다." },
        ],
        sourceRefs: ["java-class03-ex03", "java-class03-ex04", "java-class03-ex05", "java-class03-ex06", "jls-pattern-switch", "java-list-copyof-api"],
      }],
      diagnostics: [
        { symptom: "catalog 최저 가격을 바꿨는데 시작 화면은 여전히 금액 부족이라고 한다.", likelyCause: "최저 금액 상수와 Product.price가 중복되어 drift했습니다.", checks: ["가격 literal을 전체 검색합니다.", "availability와 purchase가 같은 source를 읽는지 봅니다.", "빈 catalog 정책을 확인합니다."], fix: "catalog price에서 availability/purchase를 계산하고 중복 threshold를 제거합니다.", prevention: "catalog 경계값을 parameterized contract test로 생성합니다." },
        { symptom: "잘못된 선택에서 exception이 나고 refund 정보를 만들지 못한다.", likelyCause: "외부 one-based choice를 검증 전에 array index로 사용했습니다.", checks: ["get(choice-1)보다 range check가 앞인지 봅니다.", "0·negative·size+1 fixtures를 실행합니다.", "실패 result가 투입액을 보존하는지 봅니다."], fix: "range를 먼저 검사해 INVALID_SELECTION+full refund를 반환합니다.", prevention: "모든 외부 index는 parse→range validate→convert 순서를 사용합니다." },
      ],
      expertNotes: ["실제 결제는 int보다 최소 화폐 단위의 long/전용 Money type, idempotency, inventory transaction을 검토합니다.", "상품 재고와 결제가 추가되면 단일 pure 함수에서 database/lock transaction boundary로 invariant 범위가 확장됩니다."],
    },
    {
      id: "reflection-privacy-api-evolution",
      title: "reflection은 private를 관찰·우회할 수 있고 공개 accessor는 장기 호환성 계약이 됩니다",
      lead: "private를 비밀 저장소로 과신하지 않고 language access, strong module boundary, 공개 API evolution을 나눕니다.",
      explanations: [
        "Class.getDeclaredFields는 public 여부와 무관하게 선언 field metadata를 찾을 수 있습니다. Field.canAccess와 trySetAccessible은 실제 reflective access 가능성을 다루며 실행 환경의 module openness와 caller 관계에 따라 결과가 달라집니다.",
        "unnamed module의 일반 class 예제에서는 private field를 trySetAccessible로 열 수 있지만, 다른 named strong module의 non-open package라면 trySetAccessible은 false를 반환합니다. 같은 상황에서 setAccessible(true)는 InaccessibleObjectException을 던질 수 있으므로 두 API 계약을 섞지 않습니다.",
        "reflection이 가능하므로 private가 무의미한 것은 아닙니다. 정상 source client의 coupling을 줄이고 compiler가 구현 경계를 지키게 하지만 공격자에게서 secret bytes를 암호학적으로 숨기는 보안 경계는 아닙니다.",
        "public getter/setter를 추가하면 source consumer와 reflection/framework가 그 이름·형식에 의존할 수 있습니다. 불필요한 setter 제거는 설계상 좋지만 이미 공개·배포한 API에서는 compatibility 계획이 필요합니다.",
        "public field/member의 접근을 줄이면 기존 binary가 IllegalAccessError 같은 linkage failure를 만날 수 있고 public method 삭제는 기존 binary에 NoSuchMethodError 위험을 만듭니다. JLS binary compatibility와 source recompilation을 둘 다 검증합니다.",
        "private representation 변경은 일반 source API에 덜 파급되지만 serialized form, reflection config, ORM field access가 의존할 수 있습니다. 그런 비언어 계약도 versioned migration 대상으로 기록합니다.",
      ],
      concepts: [
        { term: "reflection", definition: "runtime Class/Field/Method metadata를 조사하고 허용된 범위에서 동적으로 접근하는 JDK API입니다.", detail: ["선언 member discovery와 값 access는 다릅니다.", "module openness가 영향을 줍니다."] },
        { term: "binary compatibility", definition: "기존에 compile된 client binary를 다시 compile하지 않고 새 library와 link/run할 수 있는 성질입니다.", detail: ["source compatibility와 다릅니다.", "접근 축소·method 삭제를 조심합니다."] },
        { term: "non-language contract", definition: "reflection 이름, serialized field, template property처럼 compiler의 일반 member call 밖에서 소비되는 사실상의 API입니다.", detail: ["rename에도 깨질 수 있습니다.", "integration test가 필요합니다."] },
      ],
      codeExamples: [{
        id: "java-reflection-private-boundary",
        title: "private field metadata와 reflective access flag를 분리해 관찰합니다",
        language: "java",
        filename: "ReflectionEvolutionLab.java",
        purpose: "정상 public API는 masked 값만 주지만 같은 unnamed module의 reflection이 private raw 값에 접근할 수 있음을 안전한 synthetic 값으로 확인합니다.",
        code: String.raw`import java.lang.reflect.Modifier;

final class SecretBox {
    private final String secret = "synthetic-token";
    public String masked() { return "***"; }
}

public class ReflectionEvolutionLab {
    public static void main(String[] args) throws Exception {
        SecretBox box = new SecretBox();
        var field = SecretBox.class.getDeclaredField("secret");
        System.out.println("declared=" + field.getName() + ",private="
                + Modifier.isPrivate(field.getModifiers()));
        System.out.println("publicApi=" + box.masked());
        System.out.println("canAccessBefore=" + field.canAccess(box));
        boolean opened = field.trySetAccessible();
        System.out.println("opened=" + opened);
        System.out.println("reflectiveValue=" + (opened ? field.get(box) : "unavailable"));
    }
}`,
        walkthrough: [
          { lines: "3-6", explanation: "top-level SecretBox는 raw synthetic value를 private로 두고 public API는 masked result만 냅니다." },
          { lines: "10-14", explanation: "getDeclaredField로 metadata 발견과 Modifier private 여부를 확인합니다." },
          { lines: "15-19", explanation: "access 전후 flag를 출력하고 열린 경우에만 값을 읽어 module-dependent failure를 무시하지 않습니다." },
        ],
        run: { environment: ["OpenJDK 21+", "classpath unnamed module"], command: "javac ReflectionEvolutionLab.java && java ReflectionEvolutionLab" },
        output: { value: "declared=secret,private=true\npublicApi=***\ncanAccessBefore=false\nopened=true\nreflectiveValue=synthetic-token", explanation: ["metadata discovery는 private에도 가능합니다.", "이 classpath 실행에서는 접근 flag를 열 수 있지만 named module 환경의 보장으로 일반화하지 않습니다."] },
        experiments: [
          { change: "SecretBox를 named module의 non-open package로 옮기고 다른 module에서 trySetAccessible을 호출합니다.", prediction: "package가 opens되지 않으면 trySetAccessible은 false를 반환합니다.", result: "setAccessible(true)의 InaccessibleObjectException 경로와 분리해 실제 module launch fixture로 검증합니다." },
          { change: "public masked()를 삭제한 새 library로 기존 compiled client를 실행합니다.", prediction: "해당 call site에서 NoSuchMethodError 위험이 있습니다.", result: "method 삭제는 versioned breaking change로 다룹니다." },
          { change: "secret field 이름만 바꾸고 reflection config는 그대로 둡니다.", prediction: "getDeclaredField에서 NoSuchFieldException입니다.", result: "private 이름도 reflection consumer에는 사실상 API입니다." },
        ],
        sourceRefs: ["java-class03-ex01", "java-class03-ex05", "java-reflection-field-api", "java-accessibleobject-api", "jls-binary-access", "jls-binary-methods"],
      }],
      diagnostics: [
        { symptom: "local에서는 setAccessible이 됐지만 module 배포에서 InaccessibleObjectException이 난다.", likelyCause: "classpath unnamed module 결과를 named module의 strong encapsulation에도 일반화했습니다.", checks: ["caller/target module과 package opens를 봅니다.", "trySetAccessible 반환을 확인합니다.", "public supported API 대체를 찾습니다."], fix: "필요한 최소 package만 명시적으로 opens하거나 reflection을 제거하고 public adapter를 사용합니다.", prevention: "실제 module launch 방식으로 reflection integration test를 둡니다." },
        { symptom: "private field rename 뒤 compile은 성공했지만 ORM/serializer가 runtime 실패한다.", likelyCause: "string 기반 mapping이 private representation 이름에 의존합니다.", checks: ["annotations/config/property names를 검색합니다.", "serialized schema migration을 봅니다.", "reflection contract test를 실행합니다."], fix: "stable DTO/schema로 분리하고 rename migration/alias를 제공합니다.", prevention: "non-language contracts를 API inventory에 포함합니다." },
      ],
      expertNotes: ["private secret의 raw String은 immutable이라 메모리에서 즉시 지우기 어렵습니다. 정말 민감한 credential은 전용 secret manager·짧은 수명·최소 복제를 함께 사용합니다.", "API 제거는 deprecation 기간, consumer telemetry, semantic version, compatibility tests를 거쳐야 합니다."],
    },
    {
      id: "synchronized-compound-invariant",
      title: "private는 data race를 막지 않으며 synchronized가 복합 상태 전이를 같은 monitor 아래 둡니다",
      lead: "check-then-act가 여러 field를 바꾸면 각 field의 private 여부와 관계없이 transition 전체를 원자적으로 보호해야 합니다.",
      explanations: [
        "Inventory의 invariant를 stock>=0, sold>=0, stock+sold=initial로 두겠습니다. trySell은 재고 확인과 stock 감소·sold 증가가 하나의 compound transition입니다.",
        "두 thread가 동시에 stock을 읽고 각각 충분하다고 판단하면 private field라도 oversell할 수 있습니다. private는 source 접근 범위만 제한하고 scheduling·visibility·atomicity를 제공하지 않습니다.",
        "synchronized instance method는 receiver monitor를 획득한 thread 하나만 body를 실행하게 합니다. 같은 monitor unlock은 이후 lock에 happens-before하여 그 안의 writes가 다음 thread에 보입니다.",
        "모든 invariant 관련 read/write가 같은 lock discipline을 따라야 합니다. trySell만 synchronized이고 snapshot이 lock 없이 두 field를 읽으면 섞인 순간을 볼 수 있습니다.",
        "stock()과 sold()를 각각 synchronized로 호출해도 두 호출 사이에 판매가 일어날 수 있습니다. 관계를 관찰할 때는 두 값을 한 synchronized snapshot으로 반환합니다.",
        "synchronized만 붙이면 자동 thread safety가 되는 것도 아닙니다. callback을 lock 안에서 호출하거나 내부 mutable collection을 반환하거나 여러 객체 invariant를 서로 다른 lock으로 보호하면 deadlock·노출이 남습니다.",
      ],
      concepts: [
        { term: "data race", definition: "서로 다른 threads가 같은 variable에 동기화 순서 없이 접근하고 적어도 하나가 write하는 상황입니다.", detail: ["visibility와 최적화 문제가 생깁니다.", "private와 무관합니다."] },
        { term: "monitor", definition: "synchronized block/method가 mutual exclusion과 happens-before ordering에 사용하는 객체별 lock mechanism입니다.", detail: ["instance synchronized는 this monitor입니다.", "lock identity를 일관되게 씁니다."] },
        { term: "compound invariant", definition: "여러 read/write가 한 묶음으로 완료되어야 유지되는 상태 관계입니다.", detail: ["check-then-act를 포함합니다.", "snapshot도 같은 lock에서 만듭니다."] },
      ],
      codeExamples: [{
        id: "java-synchronized-inventory-invariant",
        title: "100개 concurrent 판매가 stock+sold invariant를 지키는지 검증합니다",
        language: "java",
        filename: "SynchronizedInvariantLab.java",
        purpose: "private fields에 더해 transition과 snapshot을 같은 receiver monitor로 보호합니다.",
        code: String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

public class SynchronizedInvariantLab {
    record Snapshot(int initial, int stock, int sold) {
        boolean valid() { return stock >= 0 && sold >= 0 && stock + sold == initial; }
    }
    static final class Inventory {
        private final int initial;
        private int stock;
        private int sold;
        Inventory(int initial) {
            if (initial < 0) throw new IllegalArgumentException("negative initial");
            this.initial = initial;
            this.stock = initial;
        }
        synchronized boolean trySell(int quantity) {
            if (quantity <= 0) throw new IllegalArgumentException("invalid quantity");
            if (stock < quantity) return false;
            stock -= quantity;
            sold += quantity;
            return true;
        }
        synchronized Snapshot snapshot() { return new Snapshot(initial, stock, sold); }
    }

    public static void main(String[] args) throws Exception {
        Inventory inventory = new Inventory(100);
        try (var pool = Executors.newFixedThreadPool(8)) {
            List<Callable<Boolean>> tasks = new ArrayList<>();
            for (int i = 0; i < 120; i++) tasks.add(() -> inventory.trySell(1));
            long success = pool.invokeAll(tasks).stream().filter(future -> {
                try { return future.get(); } catch (Exception e) { throw new RuntimeException(e); }
            }).count();
            Snapshot snapshot = inventory.snapshot();
            System.out.println("success=" + success);
            System.out.println("stock=" + snapshot.stock() + ",sold=" + snapshot.sold());
            System.out.println("invariant=" + snapshot.valid());
        }
    }
}`,
        walkthrough: [
          { lines: "7-9", explanation: "세 값을 한 immutable snapshot으로 묶고 compound invariant를 한 곳에서 계산합니다." },
          { lines: "10-27", explanation: "private state의 check/decrement/increment와 snapshot을 모두 같은 this monitor로 보호합니다." },
          { lines: "30-42", explanation: "120 concurrent attempts 중 최대 100개만 성공하고 완료 후 deterministic aggregate만 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21+"], command: "javac SynchronizedInvariantLab.java && java SynchronizedInvariantLab" },
        output: { value: "success=100\nstock=0,sold=100\ninvariant=true", explanation: ["task 실행 순서는 달라도 성공 수와 최종 aggregate는 동일합니다.", "재고는 음수가 되지 않고 stock+sold=100입니다."] },
        experiments: [
          { change: "trySell의 synchronized를 제거하고 check 뒤 Thread.yield를 넣습니다.", prediction: "일부 실행에서 success>100 또는 stock<0/관계 불일치가 관찰될 수 있지만 한 번에 반드시 재현된다고 보장할 수 없습니다.", result: "stress test는 bug 발견 도구이고 memory model proof를 대신하지 않습니다." },
          { change: "snapshot의 synchronized를 제거합니다.", prediction: "판매 중 호출하면 stale/mixed values를 읽을 수 있고 visibility 보장이 사라집니다.", result: "read side도 같은 lock discipline을 지킵니다." },
          { change: "stock(), sold() 두 synchronized getters를 따로 호출합니다.", prediction: "각 read는 안전하지만 두 호출 사이 transition 때문에 관계 snapshot은 일관되지 않을 수 있습니다.", result: "관련 값은 한 atomic snapshot으로 반환합니다." },
        ],
        sourceRefs: ["java-class03-ex05", "jls-synchronized-method", "jls-monitor-locks", "jls-happens-before", "java-executors-api"],
      }],
      diagnostics: [
        { symptom: "모든 fields가 private인데 동시 판매에서 stock이 음수다.", likelyCause: "private를 synchronization으로 오해해 check-then-act가 여러 threads에 interleave됐습니다.", checks: ["공유 instance 여부를 확인합니다.", "invariant를 이루는 read/write sequence를 표시합니다.", "모든 path의 lock identity를 비교합니다."], fix: "compound transition 전체를 같은 synchronized/Lock/transaction boundary로 감쌉니다.", prevention: "concurrency invariant와 lock discipline을 class 문서·stress test에 둡니다." },
        { symptom: "각 getter는 synchronized인데 stock+sold가 initial과 다르게 보인다.", likelyCause: "서로 다른 getter 호출 사이에 상태가 바뀌어 관계를 한 시점으로 읽지 못했습니다.", checks: ["두 lock 획득 사이 mutation 가능성을 봅니다.", "관계 값을 한 method에서 읽는지 확인합니다.", "returned mutable state가 없는지 봅니다."], fix: "관련 값을 같은 critical section에서 immutable snapshot으로 만듭니다.", prevention: "단일 값 thread safety와 multi-field consistency를 별도 review합니다." },
      ],
      comparisons: [{ title: "동시성 보호 선택", options: [
        { name: "synchronized", chooseWhen: "한 JVM 객체의 짧은 compound invariant를 한 monitor로 보호할 때", avoidWhen: "분산/database transaction이 필요한 범위일 때", tradeoffs: ["구조 단순", "blocking·lock scope 주의"] },
        { name: "Atomic variable", chooseWhen: "단일 값의 lock-free update가 invariant 전체일 때", avoidWhen: "stock+sold처럼 여러 값 관계를 따로 atomic 처리할 때", tradeoffs: ["단일 연산 효율", "복합 관계 표현 어려움"] },
        { name: "database transaction", chooseWhen: "여러 process와 durable rows가 같은 invariant를 공유할 때", avoidWhen: "순수 in-memory 단일 객체만 보호할 때", tradeoffs: ["process 간 일관성", "I/O·isolation 비용"] },
      ] }],
      expertNotes: ["lock 안에서 외부 callback/I/O를 호출하면 지연·재진입·deadlock 위험이 커지므로 필요한 state만 capture한 뒤 lock 밖에서 수행합니다.", "volatile은 visibility/ordering을 돕지만 일반적인 여러 연산 check-then-act를 원자적으로 만들지 않습니다."],
    },
    {
      id: "encapsulation-contract-test-strategy",
      title: "캡슐화는 modifier 검사와 행동·실패·alias·동시성 계약 테스트를 함께 통과해야 합니다",
      lead: "private field 개수만 세는 테스트는 설계의 작은 일부만 확인합니다.",
      explanations: [
        "structural test는 field가 private/final인지, 금지 setter가 public API에 없는지, bean property가 의도대로 노출되는지 확인합니다. 하지만 private method 내부가 invalid state를 만들면 구조 test만으로는 찾지 못합니다.",
        "behavior test는 정상 transition, 모든 경계값, 실패 exception/result, 실패 뒤 unchanged를 확인합니다. invariant는 field 하나뿐 아니라 balance와 history처럼 여러 representation의 관계로 assertion합니다.",
        "alias test는 mutable input과 returned view를 변경해 내부가 보호되는지 확인합니다. UnsupportedOperationException만 기대하지 말고 원본 상태가 그대로인지도 검사합니다.",
        "privacy test는 toString, exception message, audit payload, serialized DTO에 raw sensitive value가 없는지 확인합니다. 실제 secret literal 대신 synthetic sentinel을 넣고 출력 어디에도 나타나지 않는지 봅니다.",
        "compile-fail test는 source client가 private/protected 경계를 우회하지 못함을 확인합니다. runtime reflection test는 허용 module/config에서 어떤 non-language contract가 있는지 별도로 확인합니다.",
        "concurrency test는 많은 실행으로 race를 발견할 수 있지만 absence proof는 아닙니다. lock discipline review와 happens-before reasoning에 deterministic final invariant test를 보탭니다.",
      ],
      concepts: [
        { term: "structural contract", definition: "public methods·modifiers·property descriptors처럼 type 표면의 모양에 대한 계약입니다.", detail: ["reflection/compile fixture로 확인합니다.", "behavior correctness와 별도입니다."] },
        { term: "behavioral contract", definition: "입력·현재 상태에 대해 반환·exception·다음 상태가 어떻게 되어야 하는지에 대한 계약입니다.", detail: ["failure unchanged를 포함합니다.", "경계값을 포함합니다."] },
        { term: "sentinel privacy test", definition: "실제 개인정보 대신 유일한 synthetic 문자열을 넣고 공개 출력·log·exception에 나타나지 않는지 확인하는 테스트입니다.", detail: ["실제 secret을 fixture에 넣지 않습니다.", "여러 output channel을 스캔합니다."] },
      ],
      codeExamples: [{
        id: "java-encapsulation-contract-suite",
        title: "Wallet의 invariant·실패 원자성·immutable history·setter 부재를 한 harness로 검증합니다",
        language: "java",
        filename: "EncapsulationContractLab.java",
        purpose: "modifier 한 줄이 아니라 공개 API를 통해 유지되어야 하는 여러 캡슐화 계약을 실행합니다.",
        code: String.raw`import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.List;

public class EncapsulationContractLab {
    static final class Wallet {
        private int balance;
        private final List<String> history = new ArrayList<>();
        void deposit(int amount) {
            if (amount <= 0) throw new IllegalArgumentException("invalid amount");
            balance = Math.addExact(balance, amount);
            history.add("+" + amount);
        }
        void withdraw(int amount) {
            if (amount <= 0 || amount > balance) throw new IllegalArgumentException("invalid amount");
            balance -= amount;
            history.add("-" + amount);
        }
        int balance() { return balance; }
        List<String> history() { return List.copyOf(history); }
    }

    static int checks;
    static void check(boolean condition, String label) {
        if (!condition) throw new AssertionError(label);
        checks++;
    }
    static void expectThrows(Class<? extends Throwable> type, Runnable action, String label) {
        try {
            action.run();
        } catch (Throwable error) {
            if (type.isInstance(error)) { checks++; return; }
            throw new AssertionError(label + " wrong exception", error);
        }
        throw new AssertionError(label + " missing exception");
    }

    public static void main(String[] args) {
        Wallet wallet = new Wallet();
        wallet.deposit(100);
        wallet.withdraw(30);
        check(wallet.balance() == 70, "normal balance");
        check(wallet.history().equals(List.of("+100", "-30")), "history relation");
        expectThrows(IllegalArgumentException.class, () -> wallet.withdraw(80), "insufficient withdraw");
        check(wallet.balance() == 70, "failed withdraw unchanged");
        expectThrows(UnsupportedOperationException.class, () -> wallet.history().add("forged"), "immutable history");
        check(wallet.history().equals(List.of("+100", "-30")), "history protected");
        long publicSetters = java.util.Arrays.stream(Wallet.class.getDeclaredMethods())
                .filter(method -> Modifier.isPublic(method.getModifiers()))
                .filter(method -> method.getName().startsWith("set")).count();
        check(publicSetters == 0, "no public setters");
        System.out.println("checks=" + checks);
        System.out.println("balance=" + wallet.balance());
        System.out.println("history=" + wallet.history());
        System.out.println("publicSetters=" + publicSetters);
    }
}`,
        walkthrough: [
          { lines: "6-20", explanation: "Wallet은 amount와 balance 관계를 검증한 뒤 balance/history를 같은 성공 path에서 갱신하고 history snapshot을 반환합니다." },
          { lines: "23-36", explanation: "JVM -ea에 의존하지 않는 check/expectThrows harness가 정상 조건뿐 아니라 exception type과 누락도 검증합니다." },
          { lines: "39-53", explanation: "정상 관계, 실패 unchanged, returned list 보호, public setter 부재까지 일곱 계약을 확인합니다." },
          { lines: "54-57", explanation: "검증 뒤 stable domain state와 structural count만 출력합니다." },
        ],
        run: { environment: ["OpenJDK 21+"], command: "javac EncapsulationContractLab.java && java EncapsulationContractLab" },
        output: { value: "checks=7\nbalance=70\nhistory=[+100, -30]\npublicSetters=0", explanation: ["성공 동작과 두 실패 경로 뒤 balance/history invariant가 유지됩니다.", "returned history는 위조되지 않고 공개 set* method가 없습니다."] },
        experiments: [
          { change: "withdraw에서 balance를 먼저 줄이고 부족 여부를 검사합니다.", prediction: "80 실패 뒤 balance=-10이 되어 unchanged check가 실패합니다.", result: "contract suite가 validate-then-commit 회귀를 잡습니다." },
          { change: "history()가 내부 ArrayList를 반환합니다.", prediction: "forged add가 성공하고 protected check가 실패합니다.", result: "alias test가 representation exposure를 잡습니다." },
          { change: "setBalance(int)를 public으로 추가합니다.", prediction: "publicSetters=1이고 structural check가 실패합니다.", result: "금지된 API 확대를 review 이전에 탐지합니다." },
        ],
        sourceRefs: ["java-class03-ex01", "java-class03-ex05", "java-class03-ex09", "java-reflection-method-api", "java-list-copyof-api", "java-math-api"],
      }],
      diagnostics: [
        { symptom: "모든 fields-private test는 통과하지만 음수 잔액이 생긴다.", likelyCause: "structural encapsulation만 검사하고 behavior invariant와 failure order를 검사하지 않았습니다.", checks: ["public operation별 경계값을 나열합니다.", "throw 뒤 state snapshot을 봅니다.", "여러 field 관계를 assertion합니다."], fix: "success/boundary/failure-unchanged contract tests를 추가하고 validation을 commit 앞에 둡니다.", prevention: "modifier test는 전체 encapsulation suite의 한 범주로만 둡니다." },
        { symptom: "concurrency test를 1000번 통과해 thread safe라고 결론 냈다.", likelyCause: "특정 schedule에서 race가 안 보인 것을 happens-before 보장으로 오해했습니다.", checks: ["공유 mutable accesses와 lock을 code review합니다.", "같은 monitor/atomic transaction인지 봅니다.", "stress test가 재현 확률만 높인다는 점을 기록합니다."], fix: "JMM reasoning과 lock discipline을 먼저 증명하고 stress/invariant test를 보조 근거로 사용합니다.", prevention: "thread-safety 문서에 state, guard, atomic operations, publication을 명시합니다." },
      ],
      expertNotes: ["reflection으로 public setter 수를 세는 test는 의도하지 않은 API 확대를 잡지만 method 이름만으로 semantics를 완전히 판단하지는 못합니다.", "mutation testing으로 validation 조건을 뒤집거나 copy를 제거했을 때 contract suite가 실제로 실패하는지 확인하면 test 강도를 평가할 수 있습니다."],
    },
  ],
  lab: {
    title: "회원 전용 자판기 Catalog를 invariant·privacy·typed query·동시 판매까지 통합합니다",
    scenario: "학습 포털의 회원은 synthetic member id로 상품을 조회하고 credit을 투입해 하나를 구매합니다. 관리자는 상품 가격을 변경할 수 있지만 code와 재고·판매량 관계는 깨지면 안 되고, 일반 조회에는 raw email이 나타나지 않아야 합니다. 여러 요청이 동시에 마지막 재고를 사도 oversell이 없어야 합니다.",
    setup: [
      "JDK 21 project에 domain, application, adapter, contracttest package를 만듭니다.",
      "원본 Ex03~06의 네 상품은 공개 literal 대신 P1~P4와 positive synthetic prices로 바꿉니다.",
      "MemberId·EmailAddress·ProductCode value objects와 private state를 가진 Member·Product·Inventory를 정의합니다.",
      "실제 개인정보·credential은 fixture에 넣지 않고 M1, s1@example.test, SYNTHETIC_SECRET_SENTINEL만 사용합니다.",
    ],
    steps: [
      "각 class의 invariant를 먼저 적습니다: positive id/price, nonblank code/name, stock>=0, sold>=0, stock+sold=initial.",
      "constructor/factory에서 필수 값을 전부 검증하고 id/code setter를 만들지 않습니다.",
      "Member에는 rename/changeEmail/deactivate만, Product에는 changePrice만 공개하고 모든 command가 validate-then-commit인지 확인합니다.",
      "Catalog constructor에서 List.copyOf를 사용하고 외부에는 ProductSummary immutable snapshots만 반환합니다.",
      "ById/ByEmail typed member query와 ProductCode lookup을 만들고 정상 부재만 Optional로 표현합니다.",
      "getter는 I/O 없는 관찰로 유지하고 권한 검사·audit은 MemberPurchaseService use case에서 actor/action/target id로 한 번 기록합니다.",
      "purchase는 choice/code, money, stock을 검증하고 SUCCESS/NOT_FOUND/INSUFFICIENT_FUNDS/OUT_OF_STOCK result와 change/refund를 완전하게 반환합니다.",
      "Inventory purchase transition과 multi-field snapshot을 같은 synchronized monitor로 보호합니다.",
      "compile-fail fixture로 private direct access, cross-package protected superclass-qualified access, EmailAddress를 ById에 전달하는 호출이 거부됨을 확인합니다.",
      "contract tests로 invalid construction, boundary price, failed-command unchanged, input/return alias mutation, privacy sentinel absence, JavaBeans DTO descriptors를 검증합니다.",
      "120 concurrent attempts/stock100 fixture를 실행해 success100·stock0·sold100·invariant true를 확인하되 stress 통과만으로 proof라 부르지 않습니다.",
      "원본 Ex04/06의 성공·부족·잘못된 선택 의미를 새 result와 대응표로 기록하고 hard-coded minimum branch가 제거됐음을 확인합니다.",
    ],
    expectedResult: [
      "모든 정상 operation 전후에 문서화한 entity/inventory invariant가 참입니다.",
      "invalid input과 실패 purchase는 기존 state를 바꾸지 않고 투입액 전액 refund를 표현합니다.",
      "외부 list/array/result mutation으로 내부 catalog·history·digest를 바꿀 수 없습니다.",
      "일반 stdout, toString, exception, audit event에 synthetic secret sentinel이나 raw email이 나타나지 않습니다.",
      "id/email/name lookup은 타입과 cardinality가 드러나며 String overload 충돌이 없습니다.",
      "동시 판매 aggregate는 success=initial, stock=0, sold=initial이고 atomic snapshot invariant가 true입니다.",
      "negative compilation tests는 기대한 source line·diagnostic code에서 실패하고 production source/build는 clean compile됩니다.",
    ],
    cleanup: ["temp compiler fixtures와 generated class files만 안전하게 제거합니다.", "실제 원본 source와 private inventory는 수정·commit하지 않습니다.", "audit test sink를 비우고 synthetic fixtures만 남깁니다."],
    extensions: [
      "관리자/지원/회원 역할별 raw/masked profile projection과 authorization matrix를 추가합니다.",
      "in-memory synchronized Inventory를 database row lock 또는 optimistic version transaction으로 교체해 multi-process invariant를 비교합니다.",
      "mutable JavaBean request DTO를 Bean Validation 뒤 immutable domain command로 변환하는 adapter를 추가합니다.",
      "japicmp 또는 Revapi 같은 도구를 검토해 public API binary/source compatibility baseline을 자동화합니다.",
      "mutation testing으로 validation·defensive copy·synchronized를 제거한 변이가 suite에서 잡히는지 확인합니다.",
    ],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "public fields를 가진 상품을 validated Product로 바꾸고 compile-fail·behavior tests를 작성하세요.", requirements: ["code는 nonblank/final, price는 positive로 정의합니다.", "direct access가 compile 실패함을 별도 fixture로 확인합니다.", "changePrice 정상·0·음수와 실패 후 unchanged를 확인합니다.", "모든 출력은 P1 synthetic code만 사용합니다."], hints: ["private 변환 뒤 자동 setter를 모두 만들지 마세요.", "validation 결과를 assignment 전에 계산하세요."], expectedOutcome: "문법 접근과 domain invariant를 서로 다른 tests로 증명합니다.", solutionOutline: ["invariant 작성", "constructor/command 검증", "positive/negative compile tasks", "boundary tests"] },
    { difficulty: "응용", prompt: "Ex09/10 형태의 Member와 조회 서비스를 privacy-safe typed API로 리팩터링하세요.", requirements: ["id setter를 제거하고 name/email/active 전이를 분리합니다.", "EmailAddress·MemberId value object를 사용합니다.", "id/email은 Optional 0/1, name은 List 0..N cardinality를 표현합니다.", "getter는 pure로 두고 audit service가 raw email 없이 semantic event를 기록합니다.", "JavaBeans binding이 필요하면 entity와 DTO를 분리합니다."], hints: ["String parameter 이름은 overload를 구분하지 못합니다.", "raw entity 대신 MemberSummary projection을 반환하세요."], expectedOutcome: "조회 의미·부재·복수 결과·감사·개인정보 경계가 type과 tests에 드러납니다.", solutionOutline: ["value types", "sealed/name-specific queries", "projection", "audit adapter", "descriptor/privacy tests"] },
    { difficulty: "설계", prompt: "동시 구매가 가능한 회원 전용 자판기의 encapsulation architecture와 위협/호환성 test plan을 설계하세요.", requirements: ["aggregate invariant와 lock/transaction owner를 명시합니다.", "catalog/collection ownership과 defensive copy depth를 정합니다.", "purchase result의 success/failure/refund를 exhaustive하게 정의합니다.", "reflection/module, serialization, JavaBeans, API evolution 소비자를 inventory화합니다.", "privacy redaction·authorization·audit failure 정책을 정의합니다.", "compile-fail, behavior, alias, concurrency, binary compatibility tests를 포함합니다."], hints: ["private는 security boundary나 transaction이 아닙니다.", "한 객체 monitor로 충분한 범위와 database transaction이 필요한 범위를 나누세요."], expectedOutcome: "class diagram보다 먼저 invariants·public commands·owners·failure channels·test matrix가 완성됩니다.", solutionOutline: ["threat/consumer inventory", "domain transitions", "typed adapters", "atomic boundary", "compatibility rollout"] },
  ],
  reviewQuestions: [
    { question: "private field를 선언하면 캡슐화가 완성되나요?", answer: "아닙니다. private는 direct source access를 제한할 뿐이며 모든 공개 생성·변경 통로의 validation, representation copy, privacy output, concurrency synchronization이 함께 invariant를 지켜야 합니다." },
    { question: "modifier를 생략한 접근 수준을 왜 default keyword라고 부르면 부정확한가요?", answer: "member access에는 default라는 keyword를 쓰지 않고 modifier가 없는 package-private access가 적용되기 때문입니다." },
    { question: "subpackage는 부모 이름 package의 package-private member에 접근할 수 있나요?", answer: "아닙니다. base와 base.child는 서로 다른 packages입니다." },
    { question: "다른 package subclass가 protected instance member를 접근할 때 추가 조건은 무엇인가요?", answer: "접근이 subclass body에서 일어나고 qualifying expression의 compile-time type도 그 subclass 또는 subclass의 subtype이어야 합니다. 임의 superclass-typed reference를 통한 접근은 허용되지 않습니다." },
    { question: "거부되어야 하는 source는 어떻게 회귀 테스트하나요?", answer: "production compile과 분리한 negative compiler task에서 failure와 expected diagnostic 수/종류를 assertion합니다." },
    { question: "invariant와 validation의 관계는 무엇인가요?", answer: "invariant는 안정 시점마다 참이어야 하는 상태 규칙이고 validation은 모든 생성·전이 입력이 그 규칙을 깨지 않는지 commit 전에 검사하는 수단입니다." },
    { question: "왜 setPrice보다 changePrice가 나을 수 있나요?", answer: "단순 저장이 아니라 가격 변경이라는 domain 의도·정책·실패를 드러내고 generic field write API를 줄이기 때문입니다." },
    { question: "failure atomicity는 무엇인가요?", answer: "operation이 실패하면 호출 전의 유효 상태가 그대로 남는 성질이며 validate-then-commit과 transaction boundary로 지킵니다." },
    { question: "id setter를 보통 닫는 이유는 무엇인가요?", answer: "entity identity가 map/database key와 수명 동안 안정돼야 하며 독립 변경은 key와 내부 id 불일치를 만들기 때문입니다." },
    { question: "boolean getter를 isActive로 쓰면 상태 정책도 안전해지나요?", answer: "아닙니다. naming convention일 뿐이며 setActive를 열지, deactivate만 허용할지 같은 transition 정책은 별도입니다." },
    { question: "getter 안 logging의 문제는 무엇인가요?", answer: "framework/debugger/UI가 반복 호출할 수 있어 숨은 I/O·중복 audit·성능·개인정보 노출이 생깁니다. semantic audit은 actor와 purpose를 아는 use case 경계로 옮깁니다." },
    { question: "JavaBeans property와 field는 같은 것인가요?", answer: "아닙니다. property는 Introspector가 public accessor pattern으로 발견하는 논리 값이며 실제 backing field가 없어도 됩니다." },
    { question: "모든 domain entity가 no-arg constructor와 setter를 가져야 하나요?", answer: "아닙니다. legacy binder가 요구하면 mutable DTO에서 받고 validation 뒤 invariant를 지키는 domain object로 변환할 수 있습니다." },
    { question: "List.copyOf는 무엇을 보장하고 무엇을 보장하지 않나요?", answer: "호출 시점 요소를 가진 unmodifiable List를 반환해 이후 mutable input collection의 구조 변경을 반영하지 않지만, 새 instance identity와 mutable element의 deep copy는 보장하지 않습니다." },
    { question: "Collections.unmodifiableList와 List.copyOf의 핵심 차이는 무엇인가요?", answer: "전자는 backing list의 live read-only view일 수 있고 후자는 호출 시점 구조 snapshot입니다." },
    { question: "private array getter에서 array를 그대로 반환하면 왜 setter가 없어도 위험한가요?", answer: "호출자가 같은 array object의 elements를 변경해 public command를 우회할 수 있기 때문입니다." },
    { question: "findMember(String email)과 findMember(String name)을 overload할 수 없는 이유는 무엇인가요?", answer: "parameter 이름은 signature가 아니어서 둘 다 findMember(String)이라는 같은 signature이기 때문입니다." },
    { question: "typed lookup의 장점은 무엇인가요?", answer: "MemberId·EmailAddress 같은 domain 의미와 validation을 type에 담아 인자 혼동을 compile-time에 막고 query 종류·cardinality를 명시합니다." },
    { question: "자판기 실패 result에 refund를 포함하는 이유는 무엇인가요?", answer: "실패 후 caller가 금액 보존과 다음 UI 행동을 완전하게 처리하게 하며 부분 mutable fields와 숨은 print에 의존하지 않게 합니다." },
    { question: "reflection은 private field를 항상 읽을 수 있나요?", answer: "아닙니다. metadata 발견과 값 접근은 다르고 caller 관계·security/module openness에 따라 trySetAccessible이 거부될 수 있습니다." },
    { question: "private는 왜 secret 보안 경계가 아닌가요?", answer: "정상 source access coupling은 줄이지만 reflection, debugger, heap dump, serialization과 process 권한을 가진 주체에게 raw memory를 암호학적으로 숨기지 않기 때문입니다." },
    { question: "public method 삭제가 기존 binary에 미치는 위험은 무엇인가요?", answer: "기존 call site가 새 library와 link할 때 NoSuchMethodError 같은 linkage failure가 날 수 있어 versioned breaking change와 compatibility test가 필요합니다." },
    { question: "private fields면 thread safe인가요?", answer: "아닙니다. 같은 instance를 여러 threads가 공유하면 private state에도 data race와 check-then-act interleaving이 생깁니다." },
    { question: "왜 stock과 sold를 각각 synchronized getter로 읽는 것보다 Snapshot 하나가 나은가요?", answer: "두 getter 호출 사이 transition을 막지 못하지만 한 synchronized snapshot은 관계 값을 같은 critical section의 한 시점에서 읽습니다." },
    { question: "synchronized unlock/lock의 핵심 memory 의미는 무엇인가요?", answer: "같은 monitor의 unlock은 뒤의 lock에 happens-before하여 critical section writes가 다음 holder에게 보이도록 ordering을 제공합니다." },
    { question: "stress test 통과만으로 thread safety를 증명할 수 있나요?", answer: "아닙니다. 특정 schedules에서 defect를 발견할 수 있을 뿐이며 공유 state·guard·happens-before에 대한 설계 reasoning이 필요합니다." },
    { question: "캡슐화 test suite의 네 큰 범주는 무엇인가요?", answer: "구조/compile access, 행동과 failure atomicity, alias/privacy, concurrency/compatibility tests를 함께 둡니다." },
  ],
  completionChecklist: [
    "class03 Ex01~06·09·10 여덟 sources의 active code와 comments를 모두 읽었다.",
    "class03 전체17 package smoke와 OOP03 범위8을 별도 output에서 JDK21 UTF-8·Xlint warning-free compile했다.",
    "Ex02 output은 개인 문자열을 복제하지 않고 presence·행 수·getter log 횟수로 검증했다.",
    "Ex04 투입3000/선택2의 OOXO·잔돈500과 Ex06 투입3000/선택4의 OOXO·잔돈200을 재현했다.",
    "public/protected/package-private/private access matrix를 설명할 수 있다.",
    "subpackage가 same package가 아님을 확인했다.",
    "cross-package protected qualifier의 Owner-typed 실패와 Child-typed 성공을 compile fixture로 확인했다.",
    "positive compile과 expected-fail compile을 분리했다.",
    "private와 invariant validation을 구분했다.",
    "Product code/price invariant를 constructor와 changePrice에서 지켰다.",
    "invalid command가 기존 state를 바꾸지 않음을 확인했다.",
    "Member id setter를 제거하고 rename/changeEmail/deactivate를 분리했다.",
    "raw email을 일반 output/toString/audit에서 redaction했다.",
    "pure getter와 actor-aware audit query를 분리했다.",
    "isActive/getX/setX를 JavaBeans Introspector로 확인했다.",
    "mutable JavaBean DTO와 domain entity 역할을 구분했다.",
    "List.copyOf의 snapshot·null·shallow-copy 성질을 설명했다.",
    "array 입력과 반환 양쪽에서 defensive copy를 적용했다.",
    "unmodifiable view와 immutable snapshot을 구분했다.",
    "mutable element까지 필요한 deep-copy 정책을 검토했다.",
    "MemberId·EmailAddress typed lookup을 구현했다.",
    "String email/name overload 충돌을 signature로 설명했다.",
    "Optional 0/1과 List 0..N cardinality를 구분했다.",
    "자판기의 hard-coded minimum을 제거하고 catalog price를 single source로 사용했다.",
    "choice를 index로 쓰기 전에 range를 검증했다.",
    "성공 change와 실패 full refund의 money conservation을 확인했다.",
    "reflection metadata discovery와 value access를 구분했다.",
    "classpath unnamed module 결과를 named module에 일반화하지 않았다.",
    "public access 축소·method 삭제의 binary compatibility 위험을 설명했다.",
    "reflection/serialization/property 이름을 non-language contracts로 inventory했다.",
    "private가 privacy/security/thread safety를 자동 제공하지 않음을 설명했다.",
    "trySell check·decrement·increment를 같은 synchronized monitor로 보호했다.",
    "관련 multi-field reads를 한 immutable synchronized snapshot으로 반환했다.",
    "120 concurrent attempts에서 success100·stock0·sold100을 확인했다.",
    "stress test를 happens-before proof로 과장하지 않았다.",
    "structural·behavior·alias·privacy·concurrency contract tests를 모두 작성했다.",
    "실제 개인정보·비밀값·로컬 절대 경로를 공개 세션에 넣지 않았다.",
  ],
  nextSessions: ["oop-04-overload-constructor-this"],
  sources: [
    { id: "java-class03-ex01", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex01_MethodDemo.java", usedFor: ["package-private/private contrast", "getter/setter", "getter logging side effect"], evidence: "네 package-private fields, 두 private fields, public accessors, getDogName console side effect와 age=176 naming mismatch를 읽었고 개인 literals는 공개하지 않았습니다." },
    { id: "java-class03-ex02", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex02_MethodMain.java", usedFor: ["same-package direct access", "private compile comments", "accessor execution"], evidence: "clean run의 7행·getter log2회·age field를 키176으로 출력한 mismatch·degName 오타를 확인하되 이름 문자열은 presence evidence로만 보존했습니다." },
    { id: "java-class03-ex03", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex03_MethodDemo.java", usedFor: ["package-private product representation", "direct-field vending baseline"], evidence: "name/price package-private defaults와 validation 부재를 확인했습니다." },
    { id: "java-class03-ex04", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex04_MethodMain.java", usedFor: ["direct-field vending flow", "choice and money branches", "golden success"], evidence: "투입3000·선택2가 availability OOXO·잔돈500이며 price/name을 직접 읽고 minimum1500을 hard-code함을 확인했습니다." },
    { id: "java-class03-ex05", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex05_MethodDemo.java", usedFor: ["private product fields", "all-accessor pattern", "validation gap"], evidence: "name/price가 private이고 네 accessors가 있지만 null/negative validation이 없음을 확인했습니다." },
    { id: "java-class03-ex06", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex06_MethodMain.java", usedFor: ["accessor vending flow", "private versus encapsulation", "golden success"], evidence: "투입3000·선택4가 availability OOXO·잔돈200이며 minimum1800과 menu/availability가 같은 줄에 붙는 formatting 차이를 확인했습니다." },
    { id: "java-class03-ex09", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex09_Member.java", usedFor: ["Member accessors", "boolean isActive", "identity/privacy transition refactor"], evidence: "id/name/email/active private fields와 unrestricted get/set, active true default를 확인했습니다." },
    { id: "java-class03-ex10", repository: "javastudy2/classstudy", path: "src/com/java/class03/Ex10_MemberService.java", usedFor: ["overload by type/order", "String name collision", "typed query refactor"], evidence: "네 overload가 parameters를 사용하지 않고, 두 ordered-pair가 같은 문구를 출력하며, 주석 처리된 duplicate String name overload와 void print-only result임을 확인했습니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["clean compile", "negative compilation contracts"], evidence: "class03 전체17 package smoke, OOP03 범위8 독립 compile와 모든 Java example의 JDK21 compiler 기준입니다." },
    { id: "jls-access-control", repository: "JLS SE 21", path: "6.6 Access Control", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.6", usedFor: ["public/protected/package/private matrix", "member accessibility"], evidence: "선언과 member 접근 가능성의 primary specification입니다." },
    { id: "jls-protected-access", repository: "JLS SE 21", path: "6.6.2 Details on protected Access", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.6.2", usedFor: ["cross-package subclass", "qualifying expression rule"], evidence: "다른 package의 protected instance member 접근 제한 근거입니다." },
    { id: "jls-private-access", repository: "JLS SE 21", path: "8.5 and 8.3 member declarations with 6.6", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html", usedFor: ["private members", "nested/nest caveat"], evidence: "class member 선언과 access control 적용 근거입니다." },
    { id: "jls-field-declarations", repository: "JLS SE 21", path: "8.3 Field Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.3", usedFor: ["private/final fields", "field initialization"], evidence: "field modifiers와 선언 semantics 근거입니다." },
    { id: "jls-method-declarations", repository: "JLS SE 21", path: "8.4 Method Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4", usedFor: ["public commands", "accessor methods"], evidence: "method modifiers와 body 계약 근거입니다." },
    { id: "jls-method-signature", repository: "JLS SE 21", path: "8.4.2 Method Signature", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.2", usedFor: ["String overload collision", "parameter-name exclusion"], evidence: "email/name parameter names가 signature를 구분하지 못하는 근거입니다." },
    { id: "jls-pattern-switch", repository: "JLS SE 21", path: "14.11 switch Statements and Expressions", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.11", usedFor: ["sealed query exhaustive dispatch"], evidence: "pattern switch와 exhaustiveness의 language 근거입니다." },
    { id: "jls-synchronized-method", repository: "JLS SE 21", path: "8.4.3.6 synchronized Methods", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.3.6", usedFor: ["receiver monitor", "method synchronization"], evidence: "instance synchronized method monitor 획득/해제 근거입니다." },
    { id: "jls-monitor-locks", repository: "JLS SE 21", path: "17.1 Synchronization", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.1", usedFor: ["monitor locks", "mutual exclusion"], evidence: "monitor와 synchronized execution semantics 근거입니다." },
    { id: "jls-happens-before", repository: "JLS SE 21", path: "17.4.5 Happens-before Order", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5", usedFor: ["visibility/order", "unlock-before-lock"], evidence: "같은 monitor unlock/lock synchronization order 근거입니다." },
    { id: "jls-binary-access", repository: "JLS SE 21", path: "13.4.7 Access to Members and Constructors", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-13.html#jls-13.4.7", usedFor: ["access reduction compatibility"], evidence: "member access 축소가 기존 binary linkage에 미치는 근거입니다." },
    { id: "jls-binary-methods", repository: "JLS SE 21", path: "13.4.12 Method and Constructor Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-13.html#jls-13.4.12", usedFor: ["method deletion compatibility", "NoSuchMethodError risk"], evidence: "method/constructor 변경의 binary compatibility 근거입니다." },
    { id: "java-compiler-api", repository: "Java SE 21 API", path: "javax.tools.JavaCompiler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/JavaCompiler.html", usedFor: ["compile-fail harness", "diagnostic collection"], evidence: "in-process compiler task와 DiagnosticCollector example의 API 근거입니다." },
    { id: "java-beans-introspector-api", repository: "Java SE 21 API", path: "java.beans.Introspector", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/java/beans/Introspector.html", usedFor: ["JavaBeans naming", "property discovery"], evidence: "accessor pattern introspection의 official API 근거입니다." },
    { id: "java-beans-propertydescriptor-api", repository: "Java SE 21 API", path: "java.beans.PropertyDescriptor", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/java/beans/PropertyDescriptor.html", usedFor: ["read/write methods", "property metadata"], evidence: "property type와 accessor metadata 근거입니다." },
    { id: "java-list-copyof-api", repository: "Java SE 21 API", path: "java.util.List.copyOf", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html#copyOf(java.util.Collection)", usedFor: ["unmodifiable snapshot", "defensive copy", "null policy"], evidence: "List.copyOf 반환·null behavior의 official API 근거입니다." },
    { id: "java-arrays-api", repository: "Java SE 21 API", path: "java.util.Arrays", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html", usedFor: ["deterministic array rendering", "copy comparison"], evidence: "array utility와 출력 검증 근거입니다." },
    { id: "java-optional-api", repository: "Java SE 21 API", path: "java.util.Optional", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html", usedFor: ["0/1 lookup result", "presence/absence"], evidence: "Optional value-based 0/1 container API 근거입니다." },
    { id: "java-locale-api", repository: "Java SE 21 API", path: "java.util.Locale.ROOT", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Locale.html#ROOT", usedFor: ["locale-neutral email normalization"], evidence: "locale-insensitive normalization marker 근거입니다." },
    { id: "java-reflection-field-api", repository: "Java SE 21 API", path: "java.lang.reflect.Field", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Field.html", usedFor: ["private metadata", "reflective field access"], evidence: "declared field metadata와 get access의 official API 근거입니다." },
    { id: "java-reflection-method-api", repository: "Java SE 21 API", path: "java.lang.reflect.Method", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Method.html", usedFor: ["public setter structural test"], evidence: "method modifier/name inspection의 official API 근거입니다." },
    { id: "java-accessibleobject-api", repository: "Java SE 21 API", path: "java.lang.reflect.AccessibleObject", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/AccessibleObject.html", usedFor: ["canAccess", "trySetAccessible", "module access caveat"], evidence: "reflective access check와 suppression 제한 근거입니다." },
    { id: "java-executors-api", repository: "Java SE 21 API", path: "java.util.concurrent.Executors", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html", usedFor: ["bounded concurrent fixture"], evidence: "fixed thread pool 생성의 official API 근거입니다." },
    { id: "java-math-api", repository: "Java SE 21 API", path: "java.lang.Math.addExact", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html#addExact(int,int)", usedFor: ["wallet overflow contract"], evidence: "int overflow를 exception으로 감지하는 official API 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 8,
    filesUsed: 8,
    uncoveredNotes: [
      "Ex01~06·09·10의 active code와 comments를 전부 읽고 범위8을 독립 compile했으며, 나머지 OOP04 대상 files는 의미 근거로 세지 않고 class03 전체17 package smoke에서만 compile했습니다.",
      "Ex02의 원본 개인 이름·반려동물 이름은 공개 code/output에 복제하지 않고 line count·nonblank/presence·getter log count로만 보존했습니다.",
      "Ex03/04 direct-field 자판기는 투입3000·선택2·OOXO·잔돈500, Ex05/06 private-accessor 자판기는 투입3000·선택4·OOXO·잔돈200 input을 재현했습니다.",
      "Ex05의 private fields와 unrestricted setters가 null/negative state를 막지 않으므로 private와 invariant를 분리해 교정했습니다.",
      "Ex01 getter의 println은 property read와 audit를 섞으므로 pure getter와 actor-aware application audit로 분리했습니다.",
      "Ex09의 id/name/email/active blind setters는 stable identity·validated commands·one-way state transition·privacy projection으로 확장했습니다.",
      "Ex10의 commented String name overload는 email String overload와 signature가 같아 선언할 수 없음을 확인하고 typed query/cardinality로 교정했습니다.",
      "protected cross-package qualifier, JavaBeans introspection, defensive/deep copy, reflection/module access, binary compatibility와 synchronized happens-before는 공식 JLS/API로 보충한 범위입니다.",
      "private만으로 개인정보 보호나 thread safety가 생긴다고 주장하지 않고 redaction·authorization·ownership·monitor/transaction 규칙을 별도 계약으로 두었습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
