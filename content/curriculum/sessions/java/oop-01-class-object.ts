import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["oop-01-class-object"],
  slug: "oop-01-class-object",
  courseId: "java",
  moduleId: "java-oop-design",
  order: 11,
  title: "클래스·객체·참조와 instance/static 상태",
  subtitle: "class·type·new·reference identity를 분리하고 instance fields·class initialization·final·Object 계약·reachability·mutable static 위험을 검증합니다.",
  level: "기초",
  estimatedMinutes: 520,
  coreQuestion: "객체별 상태와 클래스 공유 상태를 어떻게 구분하고, alias·null·초기화·동시성·동등성·수명 오해 없이 안전한 domain object를 설계할까요?",
  summary: "javastudy2 class01 Ex01~Ex04 네 파일을 OpenJDK 21.0.11에서 clean compile했습니다. Ex03만 main을 가지며 Ex02의 static time 24·HOMEWORK 2와 새 instance의 kor 80·name 존재·STUDY 8을 7행으로 출력합니다. Ex02.play는 compile되지만 실행되지 않아 time은 24입니다. Ex01·Ex04의 comment assertions는 top-level private 제한, public class/file name 규칙, implicit default constructor, class active-use initialization, JVM 실행 모델을 더 정확히 교정합니다. 이어 class/type/object/reference/new, identity·alias·null, per-object instance state, class static state, final과 불변성, initialization order, mutable static concurrency, receiver method coupling, Object equals/hash/toString, reachability·GC 비보장, private invariant와 dependency injection까지 확장합니다.",
  objectives: [
    "class declaration·reference type·object instance·reference value·new·constructor invocation을 구분할 수 있다.",
    "== identity·alias mutation·null dereference·reference parameter rebind를 state trace로 설명할 수 있다.",
    "instance field defaults·explicit initializer·객체별 독립 state와 local definite assignment를 구분할 수 있다.",
    "static field의 class state·active-use initialization·class-qualified access·class-loader 범위를 설명할 수 있다.",
    "final field·constant variable·final mutable reference·deep immutability 차이를 설명할 수 있다.",
    "mutable static의 hidden global·test-order·data-race 위험을 Atomic/dependency 설계와 비교할 수 있다.",
    "Object identity/value semantics와 equals/hashCode/toString privacy contract를 설계할 수 있다.",
    "reachability와 resource cleanup을 GC timing과 분리하고 private invariant 중심 object로 리팩터링할 수 있다.",
  ],
  prerequisites: [{ title: "다차원·가변 배열과 성적·순위 정책", reason: "객체 reference·aliasing·records·invariants·정렬 ownership을 이해한 뒤 class instance와 공유 state로 확장합니다.", sessionSlug: "java-10-multidimensional-ranking" }],
  keywords: ["class", "object", "instance", "reference", "new", "identity", "alias", "null", "instance field", "static field", "class initialization", "final", "immutability", "this", "Object", "equals", "hashCode", "reachability", "GC", "encapsulation"],
  chapters: [
    {
      id: "four-source-golden-audit-corrections",
      title: "class01 네 원본을 runtime evidence와 comment assertions로 나눠 감사합니다",
      lead: "원본 이름 문자열은 공개 golden에 복제하지 않고 존재 여부만 보존합니다.",
      explanations: [
        "Ex01은 comment-only class shell이고 명시 fields·methods·constructor가 없습니다. compiler는 조건을 만족하면 default constructor를 제공합니다.",
        "Ex02는 package-private name·kor·time·STUDY·HOMEWORK fields와 public play를 선언합니다. play는 instance name/kor와 shared static time을 함께 바꿉니다.",
        "Ex03만 main이 있고 7행을 출력합니다. play를 호출하지 않으므로 time before/after는 모두 24입니다.",
        "Ex04는 main과 JVM을 설명하지만 실제 main을 선언하지 않는 comment-only shell이라 runnable source로 세지 않습니다.",
        "public top-level class 이름은 source file과 맞아야 하지만 non-public top-level class 일반 규칙까지 class=file로 단정하지 않습니다. top-level class에는 private/protected를 쓸 수 없습니다.",
        "static state는 JVM 시작 때 무조건 먼저 만들어진다고 설명하지 않고 defining class loader의 class가 active use로 initialized되는 시점을 구분합니다.",
      ],
      concepts: [
        { term: "comment assertion", definition: "실행되지 않지만 source가 주장하는 개념 설명이며 공식 문서로 검증해야 하는 내용입니다.", detail: ["runtime evidence와 분리합니다.", "교정 대상이 될 수 있습니다."] },
        { term: "default constructor", definition: "class에 constructor declaration이 전혀 없을 때 compiler가 조건에 따라 암묵적으로 제공하는 no-arg constructor입니다.", detail: ["source에 보이지 않습니다.", "명시 constructor 추가 시 사라집니다."] },
        { term: "package-private", definition: "member에 access modifier가 없어 같은 package에서만 직접 접근 가능한 access입니다.", detail: ["public이 아닙니다.", "reference syntax가 우회하지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "java-original-class01-audit",
          title: "네 source를 compile하고 Ex03 output을 privacy-safe summary로 검증합니다",
          language: "powershell",
          filename: "verify-original-class01.ps1",
          purpose: "comment-only files와 runnable main을 구분하고 결정적 fields만 보존합니다.",
          code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("oop01-original-" + [Guid]::NewGuid().ToString("N"))
if (Test-Path $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
try {
  $files = @(
    "src\com\java\class01\Ex01_ClassDemo.java", "src\com\java\class01\Ex02_ClassDemo.java",
    "src\com\java\class01\Ex03_ClassMain.java", "src\com\java\class01\Ex04_ClassDemo.java"
  )
  javac -encoding UTF-8 -Xlint:all -d $root $files
  if ($LASTEXITCODE -ne 0) { throw "compile failed" }
  $lines = @(& java -cp $root com.java.class01.Ex03_ClassMain)
  if ($LASTEXITCODE -ne 0) { throw "run failed" }
  "compiled=4,main=Ex03,lines=$($lines.Count)"
  "timeBefore=$($lines[0]),homework=$($lines[1]),marker=$($lines[2])"
  "kor=$($lines[3]),nameLinePresent:$(-not [string]::IsNullOrWhiteSpace($lines[4])),study=$($lines[5]),timeAfter=$($lines[6])"
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}`,
          walkthrough: [
            { lines: "1-4", explanation: "system temp 바로 아래 GUID root를 생성합니다." },
            { lines: "6-12", explanation: "class01 네 source를 UTF-8·Xlint clean compile하고 Ex03만 실행합니다." },
            { lines: "13-15", explanation: "실제 이름 text는 공개하지 않고 non-blank 여부, numeric fields와 marker만 보존합니다." },
            { lines: "16-20", explanation: "resolved parent를 검증하고 생성 root만 제거합니다." },
          ],
          run: { environment: ["PowerShell 7+", "OpenJDK 21", "javastudy2 classstudy root"], command: "pwsh -NoProfile -File verify-original-class01.ps1" },
          output: { value: "compiled=4,main=Ex03,lines=7\ntimeBefore=24,homework=2,marker=클래스를 객체로 생성\nkor=80,nameLinePresent:True,study=8,timeAfter=24", explanation: ["play가 실행되지 않아 static time은 24로 유지됩니다.", "Ex01/04는 compile되지만 main이 없습니다."] },
          experiments: [
            { change: "Ex03에서 test.play()를 호출합니다.", prediction: "해당 instance name/kor와 class time이 바뀝니다.", result: "instance·static side effects를 분리합니다." },
            { change: "Ex02 final fields assignment comments를 활성화합니다.", prediction: "cannot assign a value to final variable compile failure입니다.", result: "final reassignment constraint를 확인합니다." },
            { change: "Ex04를 java launcher로 실행합니다.", prediction: "main method not found로 실행되지 않습니다.", result: "comment 설명과 실제 entry point를 구분합니다." },
          ],
          sourceRefs: ["java-class01-comment", "java-class01-fields", "java-class01-main", "java-class01-method-comment", "jdk21-javac"],
        },
      ],
      diagnostics: [{ symptom: "Ex04에 main 설명이 있으니 실행될 것이라 예상했지만 launcher가 실패한다.", likelyCause: "comment text와 실제 method declaration을 혼동했습니다.", checks: ["qualified main signature를 검색합니다.", "javap 또는 source declarations를 봅니다.", "실제 selected class를 확인합니다."], fix: "실행 evidence는 선언된 qualifying main과 launcher exit로 검증합니다.", prevention: "comment-only·compiled-only·runnable sources를 inventory에서 구분합니다." }],
    },
    {
      id: "class-type-object-reference-new",
      title: "class는 type 선언이고 new는 distinct instance를 생성해 reference value를 돌려줍니다",
      lead: "설계도 비유 뒤에 실제 language 개념을 정확히 붙입니다.",
      explanations: [
        "class declaration은 fields·methods·constructors·nested types를 포함할 수 있는 reference type을 정의합니다.",
        "object는 runtime class instance이고 reference variable은 object 자체가 아니라 object 또는 null을 가리키는 reference value를 저장합니다.",
        "`new Learner()`는 class instance creation expression이며 allocation·instance initialization·constructor invocation을 거쳐 reference를 반환합니다.",
        "같은 class로 new를 두 번 실행하면 같은 runtime class의 distinct objects입니다. 한 object reference를 다른 variable에 대입하면 새 object가 아니라 alias입니다.",
        "class name·source file name·constructor name을 하나로 뭉개지 않습니다. public top-level class/file 규칙과 constructor declaration 규칙을 별도로 배웁니다.",
      ],
      concepts: [
        { term: "reference type", definition: "values가 objects/arrays에 대한 references 또는 null인 type입니다.", detail: ["class type이 포함됩니다.", "primitive와 다릅니다."] },
        { term: "class instance", definition: "특정 class를 runtime class로 가진 object입니다.", detail: ["instance fields를 갖습니다.", "identity가 있습니다."] },
        { term: "class instance creation", definition: "new와 constructor arguments로 새 instance를 만들고 reference를 결과로 내는 expression입니다.", detail: ["constructor와 연결됩니다.", "실패 가능성이 있습니다."] },
      ],
      codeExamples: [
        {
          id: "java-class-object-creation",
          title: "두 objects와 한 alias의 class·identity·state를 비교합니다",
          language: "java",
          filename: "src/learning/oop01/ClassObjectLab.java",
          purpose: "same class와 same object를 분리합니다.",
          code: String.raw`package learning.oop01;

public class ClassObjectLab {
    static class Learner { int score = 80; }
    public static void main(String[] args) {
        Learner first = new Learner();
        Learner second = new Learner();
        Learner alias = first;
        first.score = 90;
        System.out.println("sameClass=" + (first.getClass() == second.getClass()));
        System.out.println("firstSecondSame=" + (first == second));
        System.out.println("aliasFirstSame=" + (alias == first));
        System.out.println("scores=first:" + first.score + ",alias:" + alias.score + ",second:" + second.score);
    }
}`,
          walkthrough: [
            { lines: "4", explanation: "nested Learner type은 instance field score initializer를 가집니다." },
            { lines: "6-8", explanation: "new 두 번으로 distinct instances, assignment로 alias를 만듭니다." },
            { lines: "9-13", explanation: "first mutation 뒤 runtime class equality·identity·object별 state를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop01/ClassObjectLab.java && java -cp build/classes learning.oop01.ClassObjectLab" },
          output: { value: "sameClass=true\nfirstSecondSame=false\naliasFirstSame=true\nscores=first:90,alias:90,second:80", explanation: ["같은 class가 same identity를 뜻하지 않습니다.", "alias는 first mutation을 공유하고 second는 독립입니다."] },
          experiments: [
            { change: "second=first로 바꿉니다.", prediction: "firstSecondSame=true이고 second score도 90입니다.", result: "assignment는 object를 복제하지 않습니다." },
            { change: "Learner에 명시 constructor Learner(int score)를 추가합니다.", prediction: "new Learner()는 no-arg constructor를 직접 추가하지 않으면 compile 실패합니다.", result: "implicit default constructor가 사라집니다." },
            { change: "getClass 결과 대신 toString을 golden으로 둡니다.", prediction: "identity hash suffix로 비결정적일 수 있습니다.", result: "runtime type과 identity를 구조적으로 검증합니다." },
          ],
          sourceRefs: ["java-class01-comment", "java-class01-fields", "jls-classes", "jls-reference-types", "jls-instance-creation"],
        },
      ],
      diagnostics: [{ symptom: "같은 class objects라 ==가 true일 것이라 예상했다.", likelyCause: "type sameness와 object identity를 혼동했습니다.", checks: ["new 호출 횟수를 봅니다.", "reference assignments를 추적합니다.", "getClass와 ==를 분리합니다."], fix: "identity가 요구면 ==, value 의미가 요구면 명시 equals contract를 사용합니다.", prevention: "two-new·alias·null fixtures를 모든 reference 교육에 포함합니다." }],
    },
    {
      id: "identity-alias-null-reference-values",
      title: "reference도 값으로 전달되며 rebind와 object mutation은 다른 효과를 냅니다",
      lead: "alias graph와 null path를 method boundary까지 추적합니다.",
      explanations: [
        "reference variable assignment와 parameter passing은 reference value를 복사해 caller·callee variables가 같은 object를 가리킬 수 있습니다.",
        "callee parameter를 새 object로 rebind해도 caller variable은 바뀌지 않지만 parameter가 가리키는 mutable object를 수정하면 caller에서 보입니다.",
        "null은 어떤 object도 가리키지 않는 reference value이고 member access·instance invocation에서 NullPointerException이 납니다.",
        "null 허용 여부를 constructor·method contract에서 정하고 invalid null을 늦은 NPE 대신 boundary에서 거부합니다.",
        "alias가 많아질수록 mutation source 추적이 어려워지므로 immutable objects·defensive copies·명확한 ownership을 선택합니다.",
      ],
      concepts: [
        { term: "alias graph", definition: "variables·fields가 어떤 objects를 함께 가리키는지 나타낸 reference 관계입니다.", detail: ["mutation 전파를 설명합니다.", "reachability와 연결됩니다."] },
        { term: "rebind", definition: "reference variable이 다른 object/null reference value를 갖도록 다시 대입하는 동작입니다.", detail: ["object 자체를 바꾸지 않습니다.", "parameter local에만 적용될 수 있습니다."] },
        { term: "null dereference", definition: "null reference를 통해 instance member를 읽거나 호출하려는 실패입니다.", detail: ["NPE가 납니다.", "계약으로 예방합니다."] },
      ],
      codeExamples: [
        {
          id: "java-reference-rebind-mutation-null",
          title: "alias·parameter rebind·mutation·null access를 비교합니다",
          language: "java",
          filename: "src/learning/oop01/ReferenceLab.java",
          purpose: "Java pass-by-value에서 reference value가 복사됨을 실행합니다.",
          code: String.raw`package learning.oop01;

public class ReferenceLab {
    static class Box { int score; Box(int score) { this.score = score; } }
    static void rebind(Box box) { box = new Box(1); }
    static void mutate(Box box) { box.score = 95; }
    public static void main(String[] args) {
        Box first = new Box(90);
        Box alias = first;
        rebind(first);
        System.out.println("same=" + (first == alias) + ",afterRebind=" + first.score);
        mutate(alias);
        System.out.println("afterMutate=first:" + first.score + ",alias:" + alias.score);
        Box missing = null;
        try { System.out.println(missing.score); }
        catch (NullPointerException error) { System.out.println("nullAccess=" + error.getClass().getSimpleName()); }
    }
}`,
          walkthrough: [
            { lines: "4-6", explanation: "rebind는 parameter variable만 바꾸고 mutate는 shared Box field를 바꿉니다." },
            { lines: "8-13", explanation: "first/alias가 같은 object이고 rebind 뒤에도 score 90, mutate 뒤 둘 다 95입니다." },
            { lines: "14-16", explanation: "null field access를 exact failure type으로 확인합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop01/ReferenceLab.java && java -cp build/classes learning.oop01.ReferenceLab" },
          output: { value: "same=true,afterRebind=90\nafterMutate=first:95,alias:95\nnullAccess=NullPointerException", explanation: ["reference parameter도 value로 복사됩니다.", "shared object mutation은 aliases에서 보입니다."] },
          experiments: [
            { change: "mutate에서 box=null로 rebind합니다.", prediction: "caller first/alias는 계속 object를 가리킵니다.", result: "parameter rebind 범위를 확인합니다." },
            { change: "mutate(null)을 호출합니다.", prediction: "box.score에서 NPE입니다.", result: "null contract를 method boundary에 둡니다." },
            { change: "Box를 immutable record로 바꿉니다.", prediction: "field mutation 대신 새 value 반환이 필요합니다.", result: "alias mutation 위험을 줄입니다." },
          ],
          sourceRefs: ["jls-reference-types", "jls-method-invocation", "java-object-api"],
        },
      ],
      diagnostics: [{ symptom: "method 안에서 parameter에 새 object를 넣었는데 caller reference가 바뀌지 않는다.", likelyCause: "Java가 reference variable 자체를 공유한다고 오해했습니다.", checks: ["parameter assignment와 field mutation을 구분합니다.", "호출 전후 identity를 봅니다.", "return value 사용 여부를 확인합니다."], fix: "새 reference가 결과라면 return하고 caller가 명시적으로 재대입하게 합니다.", prevention: "rebind/mutate 두 fixture로 pass-by-value contract를 test합니다." }],
    },
    {
      id: "instance-fields-defaults-per-object-state",
      title: "instance fields는 object마다 존재하고 default 뒤 explicit initializer가 적용됩니다",
      lead: "field initialization과 local variable definite assignment를 구분합니다.",
      explanations: [
        "새 instance의 fields는 먼저 type default 0·false·null을 갖고 그 뒤 source 순서의 field initializers와 instance blocks가 실행됩니다.",
        "initializer가 있는 Ex02 name·kor·STUDY는 default를 덮어 각각 명시값을 갖습니다.",
        "각 new instance는 own instance fields를 가지므로 한 object의 name·kor 변경은 다른 object에 보이지 않습니다.",
        "local variables에는 field default initialization 규칙이 적용되지 않아 읽기 전 definite assignment가 필요합니다.",
        "instance final STUDY는 object마다 한 번 초기화되는 field이고 static final HOMEWORK와 storage/ownership이 다릅니다.",
      ],
      concepts: [
        { term: "instance field", definition: "각 class instance에 속하는 non-static field입니다.", detail: ["object별 state입니다.", "defaults를 갖습니다."] },
        { term: "field initializer", definition: "instance 생성 또는 class 초기화 때 textual order로 field에 값을 대입하는 expression입니다.", detail: ["default 뒤 실행됩니다.", "side effect를 피합니다."] },
        { term: "definite assignment", definition: "local/blank final 등을 사용하기 전에 compiler가 값 대입을 증명해야 하는 규칙입니다.", detail: ["field defaults와 다릅니다.", "compile-time 검사입니다."] },
      ],
      codeExamples: [
        {
          id: "java-instance-field-defaults",
          title: "default fields와 두 instances의 독립 state를 실행합니다",
          language: "java",
          filename: "src/learning/oop01/InstanceFieldLab.java",
          purpose: "field defaults·explicit final initializer·per-object mutation을 확인합니다.",
          code: String.raw`package learning.oop01;

public class InstanceFieldLab {
    static class State {
        String label;
        int count;
        boolean active;
        final int study = 8;
    }
    public static void main(String[] args) {
        State first = new State();
        State second = new State();
        System.out.println("defaults=label:" + first.label + ",count:" + first.count + ",active:" + first.active);
        first.count = 1;
        first.active = true;
        System.out.println("first=count:" + first.count + ",active:" + first.active + ",study:" + first.study);
        System.out.println("second=count:" + second.count + ",active:" + second.active + ",study:" + second.study);
    }
}`,
          walkthrough: [
            { lines: "4-9", explanation: "세 uninitialized fields와 explicit instance final field를 선언합니다." },
            { lines: "11-13", explanation: "두 distinct instances를 만들고 first defaults를 출력합니다." },
            { lines: "14-17", explanation: "first만 변경한 뒤 second가 defaults를 유지하는지 확인합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop01/InstanceFieldLab.java && java -cp build/classes learning.oop01.InstanceFieldLab" },
          output: { value: "defaults=label:null,count:0,active:false\nfirst=count:1,active:true,study:8\nsecond=count:0,active:false,study:8", explanation: ["fields는 defaults를 갖습니다.", "first mutation은 second instance에 전파되지 않습니다."] },
          experiments: [
            { change: "local `int local;`을 출력합니다.", prediction: "might not have been initialized compile failure입니다.", result: "field default와 local definite assignment를 구분합니다." },
            { change: "study를 static final로 바꿉니다.", prediction: "object마다가 아니라 class-qualified constant state가 됩니다.", result: "instance/static ownership을 구분합니다." },
            { change: "second=first로 바꿉니다.", prediction: "second에도 count1/active true가 보입니다.", result: "독립 instance와 alias를 구분합니다." },
          ],
          sourceRefs: ["java-class01-fields", "jls-fields", "jls-initial-values", "jls-final-fields"],
        },
      ],
      diagnostics: [{ symptom: "새 object field가 null/0이라 constructor가 실패했다고 생각했다.", likelyCause: "JLS default initialization과 explicit invariant initialization을 구분하지 않았습니다.", checks: ["field initializer/constructor를 봅니다.", "default가 valid state인지 확인합니다.", "local variable과 비교합니다."], fix: "invalid defaults를 허용하지 않으면 constructor에서 required fields를 받아 invariant를 완성합니다.", prevention: "default-only·explicit initializer·constructor states를 test합니다." }],
    },
    {
      id: "static-fields-class-state-active-use",
      title: "static field는 class state이고 active use에서 class initialization이 일어납니다",
      lead: "instance-qualified static 접근은 가능하지만 class-qualified 표현으로 ownership을 드러냅니다.",
      explanations: [
        "static field는 특정 instance가 아니라 declaring class의 state이며 보통 `ClassName.field`로 접근합니다.",
        "Ex03의 첫 non-constant static time read는 Ex02 class active use라 initialization을 유발할 수 있습니다. HOMEWORK 같은 compile-time constant는 caller에 inline되어 class initialization을 유발하지 않을 수 있습니다.",
        "`test.time`은 Java 문법상 가능하지만 reference가 null이어도 field selection은 statically resolved될 수 있어 object별 state처럼 오해하기 쉽습니다.",
        "Ex02 play가 time=8로 바꾸면 어떤 instance를 통해 호출했는지와 무관하게 class reads와 모든 instances의 관찰값이 8입니다.",
        "정확히 하나라는 표현은 JVM 전체보다 defining class loader별 Class identity를 고려해야 합니다. plugin/server environments에서는 loaders가 여러 copies를 가질 수 있습니다.",
      ],
      concepts: [
        { term: "class state", definition: "declaring class에 속하며 instances가 공유하는 static fields의 상태입니다.", detail: ["class-qualified로 접근합니다.", "global dependency가 될 수 있습니다."] },
        { term: "active use", definition: "static non-constant field access·static method invocation·instance creation 등 class initialization을 요구하는 사용입니다.", detail: ["JLS trigger가 정해집니다.", "load와 init을 구분합니다."] },
        { term: "constant variable", definition: "primitive/String type의 final variable이 constant expression으로 초기화된 경우입니다.", detail: ["compile-time inline 가능입니다.", "모든 static final이 해당하지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "java-static-shared-state",
          title: "한 instance play가 class time을 바꿔 다른 instance에서도 8로 보입니다",
          language: "java",
          filename: "src/learning/oop01/StaticSharingLab.java",
          purpose: "Ex02 instance/static side effects를 synthetic state로 재현합니다.",
          code: String.raw`package learning.oop01;

public class StaticSharingLab {
    static class Learner {
        String label = "L";
        int score = 80;
        static int time = 24;
        void play() { label = "P"; score = 90; time = 8; }
    }
    public static void main(String[] args) {
        Learner first = new Learner();
        Learner second = new Learner();
        System.out.println("before=time:" + Learner.time + ",first:" + first.score + ",second:" + second.score);
        first.play();
        System.out.println("after=time:" + Learner.time + ",first:" + first.score + ",second:" + second.score);
        System.out.println("labels=first:" + first.label + ",second:" + second.label);
        Learner.time = 24;
    }
}`,
          walkthrough: [
            { lines: "4-9", explanation: "object별 label/score와 class-shared time, 혼합 side effect play를 정의합니다." },
            { lines: "11-15", explanation: "두 instances의 초기값 뒤 first.play를 호출합니다." },
            { lines: "16-18", explanation: "static time만 공유되고 second instance fields는 유지되며 test cleanup으로 time을 reset합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop01/StaticSharingLab.java && java -cp build/classes learning.oop01.StaticSharingLab" },
          output: { value: "before=time:24,first:80,second:80\nafter=time:8,first:90,second:80\nlabels=first:P,second:L", explanation: ["play receiver first의 instance fields만 바뀝니다.", "static time은 class 전체에 공유됩니다."] },
          experiments: [
            { change: "`Learner ref=null; ref.time=7`을 실행합니다.", prediction: "static field는 class로 resolve돼 NPE 없이 7이 될 수 있지만 강하게 비권장입니다.", result: "class-qualified access를 사용합니다." },
            { change: "두 번째 instance에서 play를 호출합니다.", prediction: "second fields도 변하고 same static time은 계속 8입니다.", result: "receiver와 class side effects를 분리합니다." },
            { change: "test cleanup reset을 제거합니다.", prediction: "같은 JVM의 후속 test가 time8을 상속할 수 있습니다.", result: "mutable static test-order leak를 확인합니다." },
          ],
          sourceRefs: ["java-class01-fields", "java-class01-main", "jls-fields", "jls-class-initialization"],
        },
      ],
      diagnostics: [{ symptom: "각 object마다 time이 다를 것이라 예상했지만 모두 8이다.", likelyCause: "static field를 instance state로 읽었습니다.", checks: ["declaration static을 봅니다.", "access qualifier를 확인합니다.", "어떤 method가 class state를 쓰는지 검색합니다."], fix: "object별 값이면 instance field로, process/class policy면 immutable/injected dependency 또는 명시 class state로 모델링합니다.", prevention: "two-instance isolation/shared-state tests와 static writer inventory를 둡니다." }],
    },
    {
      id: "mutable-static-global-concurrency-risk",
      title: "mutable static은 hidden global과 data race를 만들며 ++는 atomic transaction이 아닙니다",
      lead: "가능한 lost-update interleaving과 실제 AtomicInteger 결과를 각각 검증합니다.",
      explanations: [
        "mutable static은 모든 callers가 암묵적으로 공유해 test order·request isolation·configuration 변경을 어렵게 만듭니다.",
        "`counter++`는 read→add→write라 threads가 같은 old value를 읽으면 한 update가 사라질 수 있습니다.",
        "race 결과를 특정 lost count로 golden에 고정하면 scheduler에 따라 flaky하므로 가능한 interleaving을 deterministic state trace로 보여 줍니다.",
        "정말 process-wide counter라면 AtomicInteger·LongAdder·lock과 overflow/visibility semantics를 선택하고 threads를 latch로 시작·join합니다.",
        "사용자/session state는 static에 넣지 않고 instance dependency로 격리하며 immutable static final constants만 global에 두는 방향을 우선합니다.",
      ],
      concepts: [
        { term: "data race", definition: "동기화되지 않은 concurrent conflicting accesses 중 적어도 하나가 write인 상황입니다.", detail: ["visibility/order 문제가 생깁니다.", "JMM으로 설명합니다."] },
        { term: "lost update", definition: "두 read-modify-write가 같은 이전 값을 기반으로 써서 한 변경이 사라지는 현상입니다.", detail: ["++에서 가능합니다.", "atomic operation으로 막습니다."] },
        { term: "AtomicInteger", definition: "volatile-like visibility와 atomic update methods를 제공하는 integer holder입니다.", detail: ["incrementAndGet을 씁니다.", "compound domain transaction은 별도입니다."] },
      ],
      codeExamples: [
        {
          id: "java-static-race-and-atomic",
          title: "lost update trace와 4×1000 atomic increments를 비교합니다",
          language: "java",
          filename: "src/learning/oop01/StaticConcurrencyLab.java",
          purpose: "race를 flaky하게 재현하지 않고 interleaving과 safe counter를 모두 실행합니다.",
          code: String.raw`package learning.oop01;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

public class StaticConcurrencyLab {
    public static void main(String[] args) throws Exception {
        int plain = 0;
        int readA = plain, readB = plain;
        plain = readA + 1;
        plain = readB + 1;
        System.out.println("lostUpdate=expected:2,actual:" + plain);

        AtomicInteger atomic = new AtomicInteger();
        CountDownLatch start = new CountDownLatch(1);
        Thread[] workers = new Thread[4];
        for (int worker = 0; worker < 4; worker++) {
            workers[worker] = new Thread(() -> {
                try { start.await(); for (int i = 0; i < 1_000; i++) atomic.incrementAndGet(); }
                catch (InterruptedException error) { Thread.currentThread().interrupt(); }
            });
            workers[worker].start();
        }
        start.countDown();
        for (Thread worker : workers) {
            worker.join(5_000);
            if (worker.isAlive()) throw new IllegalStateException("JOIN_TIMEOUT");
        }
        System.out.println("atomic=" + atomic.get());
    }
}`,
          walkthrough: [
            { lines: "8-12", explanation: "두 workers가 plain0을 읽고 모두 1을 써 expected2가 actual1이 되는 interleaving을 순차 재현합니다." },
            { lines: "14-16", explanation: "AtomicInteger, 공통 start latch와 보존할 Thread 배열을 준비합니다." },
            { lines: "17-24", explanation: "네 threads가 같은 시작 signal 뒤 각 1000번 atomic increment하고 interruption을 복구합니다." },
            { lines: "25-30", explanation: "각 worker를 bounded join하고 생존 thread가 없을 때 exact 4000을 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop01/StaticConcurrencyLab.java && java -cp build/classes learning.oop01.StaticConcurrencyLab" },
          output: { value: "lostUpdate=expected:2,actual:1\natomic=4000", explanation: ["lost update는 가능한 interleaving의 deterministic model입니다.", "실제 threaded counter는 atomic updates와 completion synchronization으로 4000입니다."] },
          experiments: [
            { change: "AtomicInteger를 static int++로 바꿉니다.", prediction: "최종 값이 4000보다 작을 수 있지만 exact 손실 수는 고정할 수 없습니다.", result: "flaky equality 대신 race detector/stress strategy를 사용합니다." },
            { change: "bounded joins를 제거합니다.", prediction: "main이 workers 완료 전 값을 읽거나 worker를 남길 수 있습니다.", result: "atomicity와 lifecycle completion을 모두 보장합니다." },
            { change: "각 Learner instance에 counter를 둡니다.", prediction: "공유 requirement가 사라지면 threads 간 contention도 사라집니다.", result: "먼저 state ownership을 재검토합니다." },
          ],
          sourceRefs: ["java-class01-fields", "jls-memory-model", "java-atomicinteger-api", "java-countdownlatch-api"],
        },
      ],
      diagnostics: [{ symptom: "개별 test는 통과하지만 suite 순서나 병렬 실행에서 값이 달라진다.", likelyCause: "mutable static state가 reset되지 않거나 unsynchronized updates가 경쟁합니다.", checks: ["static non-final fields를 검색합니다.", "writers와 reset lifecycle을 찾습니다.", "parallel test를 실행합니다."], fix: "instance dependency로 격리하거나 genuine shared state에 atomic/lock과 lifecycle ownership을 적용합니다.", prevention: "tests가 global reset에 의존하지 않게 하고 concurrency contract tests를 둡니다." }],
    },
    {
      id: "final-fields-constants-immutability",
      title: "final은 한 번의 대입을 제한할 뿐 참조 대상까지 immutable하게 만들지 않습니다",
      lead: "instance final과 static final, constant variable과 runtime final을 구분합니다.",
      explanations: [
        "final field는 정확히 한 번 초기화되어야 합니다. instance blank final은 instance initializer·모든 constructor 정상 경로에서, static blank final은 static initializer에서 대입할 수 있고 이후 재대입할 수 없습니다.",
        "Ex02 STUDY는 object마다 존재하는 instance final이고 HOMEWORK는 class에 속하는 static final입니다.",
        "final reference는 다른 object/null로 재대입할 수 없지만 가리키는 mutable object의 fields·contents는 바뀔 수 있습니다.",
        "primitive/String final이 constant expression으로 초기화되면 constant variable이라 compile-time inline될 수 있지만 모든 static final object가 constant variable은 아닙니다.",
        "constructor가 정상 완료되고 생성 중 this가 부적절하게 escape하지 않으면 final fields에는 JMM의 특별한 초기화 안전성 보장이 있습니다. 이것은 target object의 deep immutability나 모든 non-final field의 동기화를 대신하지 않습니다.",
        "상수식 class state만 UPPER_SNAKE_CASE convention을 쓰고 object별 final identity·dependency fields는 일반 field naming을 사용합니다.",
      ],
      concepts: [
        { term: "blank final", definition: "선언 initializer 없이 constructor/initializer에서 한 번 값이 정해지는 final field입니다.", detail: ["모든 정상 생성 경로가 초기화해야 합니다.", "불변식에 유용합니다."] },
        { term: "final reference", definition: "reference value의 재대입은 금지하지만 target object mutation은 막지 않는 variable입니다.", detail: ["deep immutability가 아닙니다.", "defensive copy를 검토합니다."] },
        { term: "constant expression", definition: "compile-time에 평가 가능한 제한된 expression입니다.", detail: ["constant variable 조건입니다.", "class init timing에 영향이 있습니다."] },
      ],
      codeExamples: [
        {
          id: "java-final-reference-mutation",
          title: "instance/static finals와 final mutable reference를 비교합니다",
          language: "java",
          filename: "src/learning/oop01/FinalLab.java",
          purpose: "재대입 금지와 target mutation 허용을 실행합니다.",
          code: String.raw`package learning.oop01;

public class FinalLab {
    static class Policy {
        final int study = 8;
        static final int HOMEWORK = 2;
        final StringBuilder text = new StringBuilder("A");
    }
    public static void main(String[] args) {
        Policy first = new Policy();
        Policy second = new Policy();
        first.text.append('!');
        System.out.println("study=" + first.study + ',' + second.study + ",homework=" + Policy.HOMEWORK);
        System.out.println("texts=first:" + first.text + ",second:" + second.text);
    }
}`,
          walkthrough: [
            { lines: "4-8", explanation: "instance final study/text와 static final HOMEWORK를 선언합니다." },
            { lines: "10-12", explanation: "두 objects를 만들고 first의 final target StringBuilder를 mutate합니다." },
            { lines: "13-14", explanation: "final fields 값과 object별 mutable text 차이를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop01/FinalLab.java && java -cp build/classes learning.oop01.FinalLab" },
          output: { value: "study=8,8,homework=2\ntexts=first:A!,second:A", explanation: ["final reference target은 mutate됩니다.", "각 instance는 distinct builder를 갖습니다."] },
          experiments: [
            { change: "first.text=new StringBuilder()를 추가합니다.", prediction: "cannot assign a value to final variable compile failure입니다.", result: "reference 재대입과 target mutation을 구분합니다." },
            { change: "text를 static final로 바꿉니다.", prediction: "두 instances가 같은 mutable builder를 공유합니다.", result: "static final mutable object도 global mutation 위험이 있습니다." },
            { change: "StringBuilder 대신 immutable String을 사용합니다.", prediction: "변경은 새 String reference가 필요하지만 final이라 재대입할 수 없습니다.", result: "불변 target과 final binding을 조합합니다." },
          ],
          sourceRefs: ["java-class01-fields", "jls-fields", "jls-final-fields", "jls-class-initialization"],
        },
      ],
      diagnostics: [{ symptom: "static final collection 내용이 운영 중 바뀌었다.", likelyCause: "final을 target object의 deep immutability로 오해했습니다.", checks: ["field type mutability를 봅니다.", "reference escape와 mutator calls를 찾습니다.", "unmodifiable view와 copy를 구분합니다."], fix: "immutable value/defensive copy를 사용하고 mutable global final을 노출하지 않습니다.", prevention: "reassignment compile test와 target mutation runtime test를 분리합니다." }],
    },
    {
      id: "class-instance-initialization-order",
      title: "class initialization은 한 번, instance initialization은 new마다 textual order로 실행됩니다",
      lead: "load·link·initialize와 object creation을 한 사건으로 뭉개지 않습니다.",
      explanations: [
        "class initialization에서는 superclass가 먼저 initialized되고 static field initializers와 static blocks가 source textual order로 실행됩니다.",
        "같은 class loader의 정상 initialized class는 이후 new에서 static initializers를 다시 실행하지 않습니다.",
        "instance 생성에서는 fields가 default values를 가진 뒤 superclass constructor, instance field initializers·instance blocks, constructor body 순서가 적용됩니다.",
        "static compile-time constant read는 active-use initialization을 유발하지 않을 수 있어 static log가 항상 먼저 나온다고 단정하지 않습니다.",
        "initializer side effect와 constructor에서 overridable method 호출은 partially initialized this를 노출할 수 있어 피합니다.",
      ],
      concepts: [
        { term: "class initialization", definition: "static initializers와 class variables initializers를 실행해 class state를 준비하는 JLS 단계입니다.", detail: ["active use trigger가 있습니다.", "실패 state도 있습니다."] },
        { term: "instance initialization", definition: "새 object의 fields·blocks·constructor chain이 실행되어 instance state를 만드는 과정입니다.", detail: ["new마다 실행됩니다.", "superclass가 먼저입니다."] },
        { term: "textual order", definition: "같은 class 안의 initializer expressions/blocks가 source에 나타난 순서대로 실행되는 규칙입니다.", detail: ["forward reference 제약이 있습니다.", "side effect 순서를 설명합니다."] },
      ],
      codeExamples: [
        {
          id: "java-initialization-order",
          title: "static 한 번과 instance 두 번의 초기화 trace를 출력합니다",
          language: "java",
          filename: "src/learning/oop01/InitializationOrderLab.java",
          purpose: "active static access와 두 new의 정확한 반복 횟수를 봅니다.",
          code: String.raw`package learning.oop01;

public class InitializationOrderLab {
    static class Target {
        static int time = mark("static-field", 24);
        static { System.out.println("static-block"); }
        int score = mark("instance-field", 80);
        { System.out.println("instance-block"); }
        Target() { System.out.println("constructor"); }
        static int mark(String event, int value) { System.out.println(event); return value; }
    }
    public static void main(String[] args) {
        System.out.println("main-before");
        System.out.println("time=" + Target.time);
        Target first = new Target();
        Target second = new Target();
        System.out.println("scores=" + first.score + ',' + second.score);
    }
}`,
          walkthrough: [
            { lines: "4-11", explanation: "static field/block과 instance field/block/constructor events를 textual order로 정의합니다." },
            { lines: "13-15", explanation: "main-before 뒤 Target.time active use가 static events를 한 번 실행합니다." },
            { lines: "16-18", explanation: "new 두 번이 instance events를 각각 실행하고 scores를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop01/InitializationOrderLab.java && java -cp build/classes learning.oop01.InitializationOrderLab" },
          output: { value: "main-before\nstatic-field\nstatic-block\ntime=24\ninstance-field\ninstance-block\nconstructor\ninstance-field\ninstance-block\nconstructor\nscores=80,80", explanation: ["class events는 첫 active use에 한 번입니다.", "instance events는 각 new마다 반복됩니다."] },
          experiments: [
            { change: "time을 static final int TIME=24 constant로 만들고 TIME만 읽습니다.", prediction: "caller에 inline되어 Target initialization log가 나오지 않을 수 있습니다.", result: "constant read와 non-constant active use를 구분합니다." },
            { change: "static block과 static field 순서를 바꿉니다.", prediction: "두 static log 순서도 바뀝니다.", result: "textual order를 확인합니다." },
            { change: "두 번째 new를 제거합니다.", prediction: "instance events가 한 세트 줄지만 static events는 같습니다.", result: "class/instance frequency를 분리합니다." },
          ],
          sourceRefs: ["jls-class-initialization", "jls-instance-creation", "jls-fields", "jls-constructors"],
        },
      ],
      diagnostics: [{ symptom: "static initializer가 application 시작 즉시 실행될 것이라 기대했지만 늦게 실행된다.", likelyCause: "class loading과 active-use initialization을 같은 시점으로 봤습니다.", checks: ["첫 active use를 찾습니다.", "constant variable access인지 봅니다.", "class loader를 확인합니다."], fix: "정확한 init trigger에 의존하거나 application lifecycle에서 명시 initialization을 호출합니다.", prevention: "initializer-order fixture는 별도 JVM/process로 실행해 이미 initialized state 영향을 막습니다." }],
    },
    {
      id: "instance-static-methods-this-state-transition",
      title: "instance method는 receiver this를 통해 object state를 바꾸고 static method에는 implicit this가 없습니다",
      lead: "한 method가 instance와 class state를 동시에 바꾸는 coupling을 줄입니다.",
      explanations: [
        "instance method invocation은 receiver object를 선택하고 method body의 unqualified instance fields는 this fields로 해석됩니다.",
        "static method는 특정 receiver instance가 없어 this를 사용할 수 없고 instance fields에는 명시 object reference가 필요합니다.",
        "Ex02 play는 receiver name·kor와 class time을 함께 변경해 command 하나의 영향 범위가 두 ownership domains에 걸칩니다.",
        "method 이름·return·exception은 state transition 전제와 후조건을 드러내야 하며 unrelated global mutation을 숨기지 않습니다.",
        "공유 schedule/time은 immutable dependency로 constructor에 주입하고 play/study는 instance result만 반환하도록 분리할 수 있습니다.",
      ],
      concepts: [
        { term: "receiver", definition: "instance method invocation이 대상으로 선택한 object reference입니다.", detail: ["this가 가리킵니다.", "null이면 invocation 실패입니다."] },
        { term: "this", definition: "instance context에서 현재 receiver object를 나타내는 expression입니다.", detail: ["field shadowing을 해소합니다.", "static context에는 없습니다."] },
        { term: "state transition", definition: "method 호출 전 valid object state가 호출 후 다른 valid state로 바뀌는 계약입니다.", detail: ["invariant를 유지합니다.", "side effects를 문서화합니다."] },
      ],
      codeExamples: [],
      diagnostics: [{ symptom: "한 object method 호출이 unrelated tests와 다른 objects의 결과를 바꾼다.", likelyCause: "instance command 안에서 mutable static/global dependency도 변경합니다.", checks: ["method가 쓰는 fields를 instance/static으로 분류합니다.", "call graph side effects를 봅니다.", "test order를 바꿉니다."], fix: "instance transition과 shared service operation을 분리하고 dependency를 명시 parameter/constructor로 주입합니다.", prevention: "method별 read/write set과 two-instance isolation test를 둡니다." }],
    },
    {
      id: "object-methods-identity-value-semantics",
      title: "Object 기본 equals/hashCode/toString은 identity 중심이며 value semantics는 명시적으로 정의합니다",
      lead: "주소처럼 보이는 기본 문자열과 domain equality를 구분하고 민감한 fields를 숨깁니다.",
      explanations: [
        "Object 기본 equals는 같은 object identity에서 true이고 기본 hashCode는 identity-compatible value입니다.",
        "Object.toString 기본 형태는 runtime class name·@·unsigned hex hash 표현이며 실제 memory address 계약이 아닙니다.",
        "value object는 의미 fields로 equals와 hashCode를 함께 정의하고 mutable fields를 hash collection key에 넣지 않습니다.",
        "record는 components 기반 equals/hashCode/toString을 자동 제공하지만 components에 secret·개인정보가 있으면 default toString log도 노출 위험입니다.",
        "entity identity는 database ID, value equality는 모든 components처럼 domain 목적에 따라 선택하며 무작정 IDE 전체 field 비교를 하지 않습니다.",
      ],
      concepts: [
        { term: "identity semantics", definition: "같은 runtime object인지로 동등성을 판단하는 의미입니다.", detail: ["Object 기본 equals입니다.", "==와 연결됩니다."] },
        { term: "value semantics", definition: "domain을 구성하는 값들이 같으면 서로 다른 instances도 동등하다고 보는 의미입니다.", detail: ["equals/hashCode가 필요합니다.", "immutability가 유리합니다."] },
        { term: "hash contract", definition: "equals가 true인 objects는 같은 hashCode를 가져야 한다는 계약입니다.", detail: ["역은 필수가 아닙니다.", "mutation을 주의합니다."] },
      ],
      codeExamples: [
        {
          id: "java-object-value-contract",
          title: "plain identity equality와 record value equality를 비교합니다",
          language: "java",
          filename: "src/learning/oop01/ObjectContractLab.java",
          purpose: "서로 다른 instances의 identity/value results와 deterministic toString을 실행합니다.",
          code: String.raw`package learning.oop01;

public class ObjectContractLab {
    static class Plain { int score; Plain(int score) { this.score = score; } }
    record ScoreValue(int score) {}
    public static void main(String[] args) {
        Plain plainA = new Plain(80), plainB = new Plain(80);
        ScoreValue valueA = new ScoreValue(80), valueB = new ScoreValue(80);
        System.out.println("plainIdentity=" + (plainA == plainB) + ",plainEquals=" + plainA.equals(plainB));
        System.out.println("valueIdentity=" + (valueA == valueB) + ",valueEquals=" + valueA.equals(valueB));
        System.out.println("valueHashEqual=" + (valueA.hashCode() == valueB.hashCode()));
        System.out.println("valueText=" + valueA);
    }
}`,
          walkthrough: [
            { lines: "4-5", explanation: "Object 기본을 쓰는 mutable Plain과 value record를 정의합니다." },
            { lines: "7-8", explanation: "각 type에서 같은 score의 distinct instances를 만듭니다." },
            { lines: "9-12", explanation: "identity·equals·hash consistency와 deterministic record text를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop01/ObjectContractLab.java && java -cp build/classes learning.oop01.ObjectContractLab" },
          output: { value: "plainIdentity=false,plainEquals=false\nvalueIdentity=false,valueEquals=true\nvalueHashEqual=true\nvalueText=ScoreValue[score=80]", explanation: ["Plain은 identity semantics입니다.", "record는 component value semantics와 hash contract를 제공합니다."] },
          experiments: [
            { change: "ScoreValue에 secret component를 추가하고 그대로 log합니다.", prediction: "record toString에 secret이 포함됩니다.", result: "privacy-safe projection/logging을 사용합니다." },
            { change: "Plain equals만 override하고 hashCode를 두지 않습니다.", prediction: "HashSet/HashMap contract가 깨집니다.", result: "두 methods를 함께 설계합니다." },
            { change: "Plain에 mutable score 기반 equals/hashCode를 구현해 hash key로 넣은 뒤 score를 변경합니다.", prediction: "hash bucket이 달라져 같은 object lookup도 실패할 수 있습니다.", result: "mutable meaning fields를 hash key에 사용하지 않습니다." },
          ],
          sourceRefs: ["java-object-api", "jls-records", "jls-classes"],
        },
      ],
      diagnostics: [{ symptom: "같은 field 값 objects가 HashSet에서 중복으로 남거나 조회되지 않는다.", likelyCause: "identity equals를 그대로 쓰거나 equals/hashCode가 불일치·mutable입니다.", checks: ["domain equality 요구를 확인합니다.", "두 methods implementations를 봅니다.", "key mutation을 추적합니다."], fix: "immutable meaning fields로 equals/hashCode를 함께 구현하거나 stable entity ID semantics를 사용합니다.", prevention: "reflexive/symmetric/transitive/consistent/null과 equal-hash contract tests를 둡니다." }],
    },
    {
      id: "heap-stack-mental-model-reachability-gc",
      title: "reference·reachability를 우선하고 object의 물리 heap/stack 배치를 과장하지 않습니다",
      lead: "GC eligibility와 수거 시점, resource cleanup을 분리합니다.",
      explanations: [
        "language-level reasoning에는 objects와 reference values·scope·lifetime·reachability가 핵심이며 JIT escape analysis가 실제 배치를 최적화할 수 있습니다.",
        "JVMS runtime data areas는 heap·per-thread stacks를 정의하지만 source local이 항상 물리 stack, object가 항상 관찰 가능한 heap 위치라는 디버깅 계약은 아닙니다.",
        "GC roots에서 strong reference path가 없는 object는 collection eligible이지만 언제 또는 반드시 수거될지는 보장되지 않습니다.",
        "cycles도 roots에서 unreachable이면 eligible이고 static field reference는 class state가 살아 있는 동안 reachability를 길게 유지할 수 있습니다.",
        "System.gc·finalize에 correctness를 의존하지 않습니다. files/sockets 같은 AutoCloseable resources는 try-with-resources로 닫고, Lock은 lock 뒤 try/finally에서 unlock하며 synchronized monitor는 block exit로 해제합니다.",
      ],
      concepts: [
        { term: "reachability", definition: "GC roots에서 reference graph를 따라 object에 도달할 수 있는 관계입니다.", detail: ["strong reference가 기본입니다.", "수명과 연결됩니다."] },
        { term: "GC eligibility", definition: "strong reachability가 없어 collector가 회수할 수 있는 상태입니다.", detail: ["즉시 수거 보장이 아닙니다.", "correctness signal이 아닙니다."] },
        { term: "deterministic cleanup", definition: "GC가 아니라 resource type별 close/unlock/scope protocol로 외부 자원을 해제하는 방식입니다.", detail: ["AutoCloseable은 try-with-resources를 씁니다.", "Lock은 try/finally unlock합니다."] },
      ],
      codeExamples: [
        {
          id: "java-reference-reachability-flow",
          title: "owner 제거 뒤 alias가 object를 유지하고 마지막 reference를 제거합니다",
          language: "java",
          filename: "src/learning/oop01/ReachabilityLab.java",
          purpose: "수거를 강제 assertion하지 않고 strong reference graph만 검증합니다.",
          code: String.raw`package learning.oop01;

public class ReachabilityLab {
    static class Box { final int value; Box(int value) { this.value = value; } }
    public static void main(String[] args) {
        Box owner = new Box(7);
        Box alias = owner;
        owner = null;
        System.out.println("aliasKeepsValue=" + alias.value);
        alias = null;
        System.out.println("strongReferencesCleared=" + (owner == null && alias == null));
        System.out.println("collectionGuaranteed=false");
    }
}`,
          walkthrough: [
            { lines: "6-9", explanation: "owner를 null로 rebind해도 alias strong reference가 Box value7을 유지합니다." },
            { lines: "10-12", explanation: "마지막 local strong reference를 제거하되 collection은 assertion하지 않습니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop01/ReachabilityLab.java && java -cp build/classes learning.oop01.ReachabilityLab" },
          output: { value: "aliasKeepsValue=7\nstrongReferencesCleared=true\ncollectionGuaranteed=false", explanation: ["alias가 있는 동안 object는 사용 가능합니다.", "references 제거 뒤에도 GC timing은 golden이 아닙니다."] },
          experiments: [
            { change: "alias를 static field에 저장합니다.", prediction: "class state에서 strong path가 남아 reachability가 연장됩니다.", result: "static cache leak policy를 검토합니다." },
            { change: "System.gc 뒤 WeakReference null을 즉시 assertion합니다.", prediction: "collector/timing에 따라 flaky합니다.", result: "GC timing을 correctness test로 쓰지 않습니다." },
            { change: "Box가 file handle을 갖게 합니다.", prediction: "reference 제거만으로 close timing을 보장하지 못합니다.", result: "AutoCloseable과 try-with-resources를 사용합니다." },
          ],
          sourceRefs: ["jls-reference-types", "jvms-runtime-data-areas", "java-object-api", "java-autocloseable-api", "jep421"],
        },
      ],
      diagnostics: [{ symptom: "static cache 때문에 request objects가 계속 memory에 남는다.", likelyCause: "class state에서 objects로 strong reference path가 유지됩니다.", checks: ["heap dump dominator/GC roots를 봅니다.", "static collections/listeners를 찾습니다.", "eviction·unregister를 확인합니다."], fix: "bounded cache·explicit lifecycle·weak reference가 정말 맞는 경우의 policy를 적용합니다.", prevention: "cache size/eviction metrics와 lifecycle integration tests를 둡니다." }],
    },
    {
      id: "encapsulation-transition-contract-tests",
      title: "package-private mutable fields를 private invariant와 명시 methods·dependencies로 전환합니다",
      lead: "다음 세션의 method contract와 캡슐화로 이어지는 누적 object를 완성합니다.",
      explanations: [
        "Ex02 fields는 같은 package에서 직접 변경 가능해 invalid score·stale shared state를 막지 못합니다.",
        "constructor가 required label·score를 검증하고 private final identity, private mutable state를 완전한 valid object로 만듭니다.",
        "query method는 state를 읽고 command method는 허용 transition만 수행하며 unrelated static state를 변경하지 않습니다.",
        "공유 시간/정책은 immutable dependency로 주입해 test마다 원하는 fixture를 사용하고 global reset을 제거합니다.",
        "contract tests는 two-instance isolation·alias·null/invalid·before/after transition·equals/log privacy·concurrency ownership을 포함합니다.",
      ],
      concepts: [
        { term: "encapsulation", definition: "object가 representation을 숨기고 methods를 통해 invariant를 보호하는 설계입니다.", detail: ["private만으로 끝나지 않습니다.", "행동 중심입니다."] },
        { term: "constructor invariant", definition: "constructor 정상 반환 시 object가 반드시 만족하는 상태 조건입니다.", detail: ["invalid 생성을 막습니다.", "모든 경로를 검증합니다."] },
        { term: "dependency injection", definition: "필요 정책/service를 hidden global lookup 대신 constructor/method로 명시 전달하는 방식입니다.", detail: ["테스트성을 높입니다.", "ownership이 보입니다."] },
      ],
      codeExamples: [
        {
          id: "java-encapsulated-learner",
          title: "private score invariant와 object별 study transition을 구현합니다",
          language: "java",
          filename: "src/learning/oop01/EncapsulatedLearnerLab.java",
          purpose: "원본 public-like fields와 static side effect를 캡슐화된 synthetic object로 바꿉니다.",
          code: String.raw`package learning.oop01;

public class EncapsulatedLearnerLab {
    record StudyPolicy(int maximumScore) {
        StudyPolicy {
            if (maximumScore < 0 || maximumScore > 100) throw new IllegalArgumentException("INVALID_POLICY");
        }
    }
    static final class Learner {
        private final String label;
        private final StudyPolicy policy;
        private int score;
        Learner(String label, int score, StudyPolicy policy) {
            if (label == null || label.isBlank()) throw new IllegalArgumentException("INVALID_LABEL");
            if (policy == null || score < 0 || score > policy.maximumScore()) throw new IllegalArgumentException("INVALID_SCORE");
            this.label = label; this.score = score; this.policy = policy;
        }
        void study(int points) {
            if (points < 0) throw new IllegalArgumentException("INVALID_POINTS");
            score = Math.min(policy.maximumScore(), Math.addExact(score, points));
        }
        String snapshot() { return "label=" + label + ",score=" + score; }
    }
    public static void main(String[] args) {
        Learner first = new Learner("L1", 80, new StudyPolicy(100));
        Learner second = new Learner("L2", 80, new StudyPolicy(90));
        first.study(15);
        second.study(15);
        System.out.println("first=" + first.snapshot());
        System.out.println("second=" + second.snapshot());
        try { new Learner("L3", 101, new StudyPolicy(100)); }
        catch (IllegalArgumentException error) { System.out.println("invalid=" + error.getMessage()); }
    }
}`,
          walkthrough: [
            { lines: "4-8", explanation: "maximum score가 검증된 immutable StudyPolicy record를 정의합니다." },
            { lines: "9-18", explanation: "private label/policy/score와 constructor invariant를 정의합니다." },
            { lines: "19-23", explanation: "study command가 주입된 policy upper bound를 유지합니다." },
            { lines: "25-34", explanation: "maximum100/90 정책 두 개를 주입해 transitions와 invalid101 failure를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/oop01/EncapsulatedLearnerLab.java && java -cp build/classes learning.oop01.EncapsulatedLearnerLab" },
          output: { value: "first=label=L1,score=95\nsecond=label=L2,score=90\ninvalid=INVALID_SCORE", explanation: ["동일 command가 주입된 maximum100/90 정책에 따라 결정적으로 실행됩니다.", "instances는 policy/state를 공유하지 않고 invalid object는 생성되지 않습니다."] },
          experiments: [
            { change: "study30을 호출합니다.", prediction: "score는 policy upper bound100입니다.", result: "transition invariant를 유지합니다." },
            { change: "label을 실제 사용자 이름으로 log합니다.", prediction: "snapshot/log에 개인정보가 노출될 수 있습니다.", result: "synthetic/stable ID 또는 redacted projection을 씁니다." },
            { change: "score를 public으로 바꿉니다.", prediction: "caller가 -1/101을 직접 대입해 invariant를 우회합니다.", result: "representation을 private로 유지합니다." },
          ],
          sourceRefs: ["java-class01-fields", "jls-classes", "jls-fields", "jls-constructors", "jls-records", "java-math-api"],
        },
      ],
      diagnostics: [{ symptom: "validation method는 있지만 caller가 field를 직접 바꿔 invalid object가 생긴다.", likelyCause: "representation fields가 package/public으로 노출돼 invariant boundary를 우회합니다.", checks: ["field modifiers와 direct writes를 검색합니다.", "constructor/method paths를 봅니다.", "reflection/serialization boundary를 확인합니다."], fix: "fields를 private로 만들고 모든 생성·transition 경로가 같은 invariant를 적용하게 합니다.", prevention: "invalid direct state가 compile되지 않는 package/API tests와 runtime boundary tests를 둡니다." }],
      expertNotes: ["객체지향은 data를 class에 넣는 것보다 invariant와 behavior ownership을 명확히 하는 설계입니다.", "mutable static을 singleton dependency로 바꿨다고 자동 해결되는 것은 아니며 lifecycle·thread safety·test isolation을 계속 설계합니다."],
    },
  ],
  lab: {
    title: "전역 상태 없는 LearnerSession domain object",
    scenario: "원본 Ex02의 package-private fields와 mixed play side effects를 private invariant·immutable policy dependency·명시 snapshot을 가진 object로 재설계합니다.",
    setup: ["JDK 21과 UTF-8 source를 준비합니다.", "synthetic labels만 사용합니다.", "policy interfaces와 state/result types를 분리합니다."],
    steps: ["label·initial score·policy를 constructor에서 검증합니다.", "instance state와 truly shared immutable constants를 분류합니다.", "play/study command의 pre/postconditions와 overflow/upper bound를 구현합니다.", "mutable static time을 constructor-injected immutable Schedule로 바꿉니다.", "snapshot에는 public-safe fields만 포함합니다.", "two-new·alias·null·invalid·two-instance isolation을 test합니다.", "class/instance initialization order는 separate process fixture로 확인합니다.", "shared metric이 필요하면 Atomic counter와 lifecycle ownership을 따로 둡니다.", "resources는 AutoCloseable boundary에서 정리하고 GC를 assertion하지 않습니다."],
    expectedResult: ["한 session mutation이 다른 session에 전파되지 않습니다.", "invalid object가 정상 반환되지 않습니다.", "hidden mutable static dependency와 test reset이 없습니다.", "identity/value/log/reachability contracts가 문서·tests에 일치합니다."],
    cleanup: ["temp classes는 resolved parent 확인 뒤 생성 root만 제거합니다.", "threads는 latch/join으로 종료합니다.", "원본 class01 sources는 변경하지 않습니다."],
    extensions: ["immutable event history를 추가합니다.", "Schedule fake로 time-based behavior를 test합니다.", "record snapshot과 entity ID equality를 비교합니다.", "JFR/heap dump로 static root retention을 실습합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "class를 만들고 두 instances·alias·null·field defaults를 비교하세요.", requirements: ["new 두 번과 alias assignment를 포함합니다.", "==·getClass·object별 state를 출력합니다.", "null access를 명시 failure로 봅니다.", "local definite assignment와 field defaults를 비교합니다."], hints: ["same class와 same object를 따로 출력하세요.", "identity hash text는 쓰지 마세요."], expectedOutcome: "type·identity·alias·default를 정확히 설명합니다.", solutionOutline: ["작은 State class를 만듭니다.", "two-new/alias/null fixtures를 실행합니다."] },
    { difficulty: "응용", prompt: "Ex02를 private fields·constructor·query/command methods로 리팩터링하세요.", requirements: ["score invariant를 보호합니다.", "instance/static side effects를 분리합니다.", "final/immutable dependency를 사용합니다.", "two-instance isolation과 invalid tests를 둡니다."], hints: ["time policy를 주입하세요.", "derived/public-safe snapshot을 반환하세요."], expectedOutcome: "direct mutation과 hidden global 없이 valid state만 유지됩니다.", solutionOutline: ["필드 ownership을 분류합니다.", "constructor와 methods로 transition을 제한합니다."] },
    { difficulty: "설계", prompt: "동시 요청에서도 안전한 session service의 object/static/lifecycle 전략을 설계하세요.", requirements: ["request state를 instance로 격리합니다.", "shared counter 필요성을 정당화하고 Atomic/lock을 선택합니다.", "class initialization·resource close·GC 비보장을 포함합니다.", "equals/hash/log privacy와 test independence를 설계합니다."], hints: ["mutable static 목록을 먼저 만드세요.", "state owner와 lifetime을 표로 적으세요."], expectedOutcome: "ownership·thread safety·cleanup·value semantics가 implementation-ready contract가 됩니다.", solutionOutline: ["state를 request/class/external resource로 분류합니다.", "dependencies와 lifecycle hooks를 명시합니다."] },
  ],
  reviewQuestions: [
    { question: "class·object·reference의 차이는 무엇인가요?", answer: "class는 type declaration, object는 runtime instance, reference는 object/null을 가리키는 값입니다." },
    { question: "new 두 번이면 ==는 보통 무엇인가요?", answer: "같은 class라도 distinct objects라 false입니다." },
    { question: "parameter rebind가 caller reference를 바꾸나요?", answer: "아닙니다. reference value가 복사돼 전달됩니다." },
    { question: "field default와 local variable은 어떻게 다른가요?", answer: "fields는 type defaults를 갖지만 local은 읽기 전 definite assignment가 필요합니다." },
    { question: "instance와 static field ownership 차이는 무엇인가요?", answer: "instance는 object별, static은 declaring class/class loader state입니다." },
    { question: "instance를 통해 static에 접근할 수 없나요?", answer: "문법상 가능하지만 statically resolved되어 class-qualified 접근이 권장됩니다." },
    { question: "static은 JVM 시작 때 항상 초기화되나요?", answer: "아닙니다. JLS active-use class initialization timing을 따릅니다." },
    { question: "final reference target은 immutable인가요?", answer: "아닙니다. reference 재대입만 막고 mutable target은 바뀔 수 있습니다." },
    { question: "counter++가 concurrent atomic인가요?", answer: "아닙니다. read-modify-write가 분리되어 lost update가 가능합니다." },
    { question: "class/instance initializer 실행 횟수는 어떻게 다른가요?", answer: "class initializer는 정상 class initialization에 한 번, instance initializer는 각 new마다 실행됩니다." },
    { question: "instance method의 this는 무엇인가요?", answer: "현재 invocation receiver object입니다." },
    { question: "Object 기본 toString은 주소인가요?", answer: "아닙니다. class name과 hash 기반 표현이며 실제 memory address 계약이 아닙니다." },
    { question: "equals와 hashCode를 함께 설계해야 하는 이유는 무엇인가요?", answer: "equals가 true인 objects는 반드시 같은 hashCode를 가져야 하기 때문입니다." },
    { question: "strong references를 제거하면 즉시 GC되나요?", answer: "아닙니다. eligible일 뿐 수거 시점은 보장되지 않습니다." },
    { question: "file/socket cleanup을 GC에 맡겨도 되나요?", answer: "아닙니다. AutoCloseable·try-with-resources로 결정적으로 닫습니다." },
    { question: "private fields만 쓰면 캡슐화가 끝나나요?", answer: "아닙니다. methods가 invariant·valid transitions를 실제로 보호해야 합니다." },
  ],
  completionChecklist: ["class01 4개 sources를 감사했다.", "comment-only와 runnable evidence를 구분했다.", "top-level access와 class/file naming을 교정했다.", "implicit default constructor를 설명했다.", "class/type/object/reference/new를 분리했다.", "two-new·alias·null을 실행했다.", "reference rebind와 object mutation을 구분했다.", "field defaults와 local definite assignment를 비교했다.", "instance state isolation을 test했다.", "static active-use initialization을 설명했다.", "instance-qualified static이 가능하지만 비권장임을 설명했다.", "mutable static writer와 test leak을 찾았다.", "lost update와 Atomic result를 실행했다.", "final binding과 target mutability를 비교했다.", "constant variable/inlining caveat를 설명했다.", "class/instance initialization order를 실행했다.", "receiver this와 static context를 구분했다.", "identity/value equals/hash/toString을 검증했다.", "privacy-safe snapshot/log를 사용했다.", "reachability와 GC timing을 분리했다.", "external resource cleanup을 명시했다.", "private constructor invariant와 dependency injection을 적용했다."],
  nextSessions: [],
  sources: [
    { id: "java-class01-comment", repository: "javastudy2/classstudy", path: "src/com/java/class01/Ex01_ClassDemo.java", usedFor: ["class terminology", "field categories", "constructor/file/access corrections"], evidence: "comment-only shell을 compile하고 설명 assertions를 JLS와 대조했습니다." },
    { id: "java-class01-fields", repository: "javastudy2/classstudy", path: "src/com/java/class01/Ex02_ClassDemo.java", usedFor: ["instance/static/final fields", "package-private access", "mixed play side effects"], evidence: "5 fields와 compiled but uncalled play를 확인했습니다." },
    { id: "java-class01-main", repository: "javastudy2/classstudy", path: "src/com/java/class01/Ex03_ClassMain.java", usedFor: ["static pre-instance reads", "new/default constructor", "instance/static access", "7-line golden"], evidence: "clean run time24/homework2/kor80/study8/time24를 privacy-safe summary로 재현했습니다." },
    { id: "java-class01-method-comment", repository: "javastudy2/classstudy", path: "src/com/java/class01/Ex04_ClassDemo.java", usedFor: ["method/main transition", "JVM wording correction", "comment-vs-declaration audit"], evidence: "compile되지만 실제 main이 없는 empty class임을 확인했습니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["JDK21", "UTF-8", "Xlint", "default/final compile checks"], evidence: "원본과 examples compiler 기준입니다." },
    { id: "jls-classes", repository: "JLS SE 21", path: "Chapter 8 Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html", usedFor: ["class declarations", "members/access", "instance/static context"], evidence: "class language model의 primary specification입니다." },
    { id: "jls-fields", repository: "JLS SE 21", path: "8.3 Field Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.3", usedFor: ["instance/static/final fields", "initializers"], evidence: "field semantics 근거입니다." },
    { id: "jls-constructors", repository: "JLS SE 21", path: "8.8 Constructor Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.8", usedFor: ["default constructor", "constructor name", "initialization"], evidence: "constructor corrections 근거입니다." },
    { id: "jls-reference-types", repository: "JLS SE 21", path: "4.3.1 Objects and 4.12.2 Variables of Reference Type", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.3.1", usedFor: ["objects/references/null", "alias/rebind"], evidence: "reference value model 근거입니다." },
    { id: "jls-initial-values", repository: "JLS SE 21", path: "4.12.5 Initial Values", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.12.5", usedFor: ["instance/static defaults"], evidence: "field default 근거입니다." },
    { id: "jls-class-initialization", repository: "JLS SE 21", path: "12.4 Initialization of Classes and Interfaces", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.4", usedFor: ["active use", "static order", "constant caveat"], evidence: "class initialization timing 근거입니다." },
    { id: "jls-instance-creation", repository: "JLS SE 21", path: "12.5 Creation of New Class Instances and 15.9", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.5", usedFor: ["new", "instance initialization", "constructor order"], evidence: "object creation 근거입니다." },
    { id: "jls-method-invocation", repository: "JLS SE 21", path: "15.12 Method Invocation", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12", usedFor: ["receiver", "reference argument", "static/instance invocation"], evidence: "method boundary 근거입니다." },
    { id: "jls-final-fields", repository: "JLS SE 21", path: "17.5 final Field Semantics", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.5", usedFor: ["final publication", "binding/visibility"], evidence: "final field semantics 근거입니다." },
    { id: "jls-memory-model", repository: "JLS SE 21", path: "17.4 Memory Model", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4", usedFor: ["data race", "visibility/order", "synchronization"], evidence: "concurrency 위험 근거입니다." },
    { id: "jls-records", repository: "JLS SE 21", path: "8.10 Record Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.10", usedFor: ["value semantics example"], evidence: "record Object contract 근거입니다." },
    { id: "jvms-runtime-data-areas", repository: "JVMS SE 21", path: "2.5 Run-Time Data Areas", publicUrl: "https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5", usedFor: ["heap/stack abstract model", "non-overclaim"], evidence: "JVM runtime areas 근거입니다." },
    { id: "java-object-api", repository: "Java SE 21 API", path: "java.lang.Object", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html", usedFor: ["equals/hashCode/toString/getClass", "GC caveat"], evidence: "Object 기본 contract 근거입니다." },
    { id: "java-atomicinteger-api", repository: "Java SE 21 API", path: "AtomicInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html", usedFor: ["atomic counter"], evidence: "concurrent shared counter 근거입니다." },
    { id: "java-countdownlatch-api", repository: "Java SE 21 API", path: "CountDownLatch", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html", usedFor: ["deterministic shared thread start"], evidence: "workers의 공통 시작 signal 근거이며 완료는 bounded Thread.join으로 확인합니다." },
    { id: "java-autocloseable-api", repository: "Java SE 21 API", path: "AutoCloseable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AutoCloseable.html", usedFor: ["deterministic resource cleanup"], evidence: "GC와 close 분리 근거입니다." },
    { id: "jep421", repository: "OpenJDK", path: "JEP 421 Deprecate Finalization for Removal", publicUrl: "https://openjdk.org/jeps/421", usedFor: ["finalization avoidance", "cleanup direction"], evidence: "finalize 의존을 피하는 근거입니다." },
    { id: "java-math-api", repository: "Java SE 21 API", path: "java.lang.Math exact methods", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html", usedFor: ["checked score transition"], evidence: "overflow policy 근거입니다." },
  ],
  sourceCoverage: { filesRead: 4, filesUsed: 4, uncoveredNotes: ["Ex01/04는 runtime 예제가 아니라 comment terminology audit로 사용했습니다.", "Ex02 play는 compile되지만 Ex03에서 호출되지 않아 original time은 24입니다.", "top-level access·public class/file·constructor name 과장을 JLS로 교정했습니다.", "static은 JVM 시작 시 무조건 생성되는 것이 아니라 active-use class initialization을 따릅니다.", "instance-qualified static은 가능하지만 비권장이고 final은 deep immutability가 아닙니다.", "heap/stack physical placement·concurrency·GC·encapsulation은 official JLS/JVMS/API 기반 보강입니다.", "원본 이름 text는 공개 golden에 복제하지 않고 synthetic labels만 사용했습니다."] },
} satisfies DetailedSession;

export default session;
