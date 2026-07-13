import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  `pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString("N")); if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root "classes"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes "${sourceFile}" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw ("javac failed or warned: " + ($compiler -join [Environment]::NewLine)) }; & java "-Dfile.encoding=UTF-8" -cp $classes "${mainClass}"; if ($LASTEXITCODE -ne 0) { throw "java failed" } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" } } }'`;

const session = {
  schemaVersion: 2,
  inventoryIds: ["oop-06-inheritance-super"],
  slug: "oop-06-inheritance-super",
  courseId: "java",
  moduleId: "java-oop-design",
  order: 16,
  title: "상속·super·생성자 체인과 필드 숨김",
  subtitle: "하나의 자식 객체가 부모 부분까지 초기화되는 순서를 추적하고, 이름 탐색·접근 제어·필드 숨김을 안전한 설계 계약으로 바꿉니다.",
  level: "중급",
  estimatedMinutes: 680,
  coreQuestion: "extends로 연결된 하나의 객체에서 어떤 상태를 어떤 이름으로 읽고, 부모부터 자식까지 유효한 생성자 체인을 어떻게 보장할까요?",
  summary: "javastudy2 class04 전체 26개와 이 세션 범위 Ex05_Sub·Ex06_Sup·Ex07_Main·Ex23_Animal·Ex24_Cat·Ex25_Main 여섯 파일을 OpenJDK 21.0.11로 서로 다른 output directory에 컴파일했습니다. 전체 package의 유일한 경고는 범위 밖 Ex09_Sub의 serialVersionUID 누락이고, 범위6은 경고 없이 컴파일되며 main2·compile-only4입니다. Ex07의 부모 생성자·자식 생성자·main이 출력한 Type@hex가 같은 것은 한 Child instance의 default Object.toString rendering을 세 위치에서 본 결과이지 부모 객체와 자식 객체가 따로 생겼다는 뜻도, 실제 메모리 주소라는 뜻도 아닙니다. play()는 local name, hidden child field, super field를 차례로 읽고, child가 다시 선언하지 않은 inherited address는 unqualified·this·super 세 표현이 같은 field를 읽습니다. child 자신의 private weight는 읽을 수 있지만 parent private dog는 storage가 객체에 존재해도 child source에서 직접 접근할 수 없습니다. Ex24의 no-arg path는 this(String,int)에서 super(String,int)로 이어지고, private parent no-arg constructor는 그 경로에서 호출되지 않습니다. 또한 Ex23의 public two-argument constructor가 parameters를 fields에 대입하지 않는 원본 모델 결함도 숨기지 않습니다. 이 기준선 위에 is-a/substitutability, member inheritance와 accessibility, static field selection과 instance method dispatch의 차이, field hiding, implicit·explicit super invocation, superclass-first initialization, constructor failure, composition 선택, reflection·negative compiler contract까지 확장합니다.",
  objectives: [
    "상속을 코드 재사용 문법이 아니라 is-a와 substitutability 계약으로 설명하고 composition과 비교할 수 있다.",
    "Child instance 하나에 superclass가 선언한 instance fields도 포함된다는 모델을 별도 부모 객체 생성이라는 오해와 구분할 수 있다.",
    "local·current-class·inherited field 탐색과 this.field·super.field를 예측하고, field hiding의 compile-time 선택을 overridden method의 runtime dispatch와 구분할 수 있다.",
    "private·package-private·protected·public 접근 가능성과 member inheritance를 같은 개념으로 섞지 않고 판단할 수 있다.",
    "constructor가 상속되지 않는 이유와 implicit super()·explicit super(args)·this(args) 체인의 제약을 설명할 수 있다.",
    "superclass field initializer·initializer block·constructor body가 subclass 단계보다 먼저 실행되는 전체 초기화 순서를 추적할 수 있다.",
    "취약한 상속 구조를 compiler diagnostics·reflection·실행 trace로 검증하고 composition 또는 명시적 delegation으로 개선할 수 있다.",
  ],
  prerequisites: [
    { title: "오버로딩·생성자·this와 안전한 객체 구성", reason: "constructor delegation, this receiver, 초기화 순서를 이해해야 superclass constructor chain과 완성 전 객체 상태를 정확히 추적할 수 있습니다.", sessionSlug: "oop-04-overload-constructor-this" },
    { title: "static 멤버·클래스 초기화", reason: "instance initialization과 class initialization을 분리해야 superclass의 static 상태와 객체별 상태를 섞지 않습니다.", sessionSlug: "oop-05-static-init" },
  ],
  keywords: ["inheritance", "extends", "superclass", "subclass", "is-a", "substitutability", "single object", "member inheritance", "access control", "private", "protected", "package-private", "field hiding", "compile-time field selection", "dynamic dispatch", "super", "implicit super()", "constructor chain", "initialization order", "composition", "fragile base class", "reflection", "compiler diagnostics"],
  chapters: [
    {
      id: "six-source-golden-audit",
      title: "class04 전체26과 범위6을 분리 감사하고 비결정적 출력은 구조 계약으로 정규화합니다",
      lead: "원본 실행의 교육적 특징은 보존하되 개인 문자열과 Object.toString hash는 공개 결과에서 제거합니다.",
      explanations: [
        "범위는 Ex05_Sub·Ex06_Sup·Ex07_Main과 Ex23_Animal·Ex24_Cat·Ex25_Main입니다. 앞 세 파일은 field lookup과 한 객체의 constructor trace, 뒤 세 파일은 접근 불가능한 parent no-arg constructor와 explicit constructor chain을 보여 줍니다.",
        "class04 전체 26개를 한 번에 compile하면 exit0과 compiler.warn.missing.SVUID 경고 하나가 나옵니다. 그 경고는 범위 밖 Ex09_Sub에서 발생하므로 상속 세션의 오류로 숨기거나 범위6의 clean compile 결과에 섞지 않습니다.",
        "범위6만 새 output directory에 compile하면 exit0·warning0이며 main은 Ex07_Main과 Ex25_Main 두 개입니다. 나머지 네 파일을 실행 실패 파일이 아니라 compile-only 선언 파일로 셉니다.",
        "Ex07은 21행이며 blank line이 5개입니다. constructor 두 곳과 main 한 곳의 Type@hex token은 모두 같고 runtime class token은 Ex05_Sub입니다. hash suffix는 실행마다 달라지므로 공개 golden에는 포함하지 않습니다.",
        "play()의 세 scope 값은 모두 다르고, age 세 읽기 중 child age 두 개는 같으며 parent age는 다릅니다. inherited address 세 읽기는 모두 같고 child-only height와 own-private weight는 각각 두 번 같은 값을 냅니다. 실제 이름·주소·신체 수치는 공개하지 않고 count·equality만 남깁니다.",
        "Ex25는 부모 생성자와 자식 생성자 두 줄을 정확히 출력합니다. Ex23은 private no-arg와 public two-arg constructor를 가지지만 parameter assignment는 0회이고, Ex24는 constructor3·explicit this call1·explicit super call2라는 구조를 갖습니다.",
      ],
      concepts: [
        { term: "package smoke audit", definition: "연결된 package 전체를 compile해 범위 밖 dependency와 warning drift도 찾는 검사입니다.", detail: ["class04 26 files를 한 output directory에 compile합니다.", "범위 밖 warning은 source와 code를 기록하고 scoped 결과와 분리합니다."] },
        { term: "scoped audit", definition: "이 세션이 책임지는 여섯 source만 별도 classes directory에서 compile·run하는 검사입니다.", detail: ["main2와 compile-only4를 구분합니다.", "warning0을 세션의 clean baseline으로 고정합니다."] },
        { term: "privacy-safe normalization", definition: "원본의 의미는 count·presence·equality·type shape로 보존하고 개인 literal과 비결정적 hash는 내보내지 않는 변환입니다.", detail: ["출력 위치와 관계는 보존합니다.", "Type@hex는 same-token boolean으로만 검증합니다."] },
      ],
      codeExamples: [{
        id: "java-original-oop06-audit",
        title: "공백이 있는 GUID temp에서 package26·scope6을 감사하고 두 main을 안전하게 요약합니다",
        language: "powershell",
        filename: "verify-original-oop06.ps1",
        purpose: "원본 여섯 파일의 실제 compile·실행·source shape를 개인정보와 hash 노출 없이 재현합니다.",
        code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("oop06 audit " + [Guid]::NewGuid().ToString("N"))
if (Test-Path -LiteralPath $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
try {
  $source = "src\com\java\class04"
  $all = @(Get-ChildItem -LiteralPath $source -Filter "*.java" | Sort-Object Name | ForEach-Object FullName)
  $scopeNames = @("Ex05_Sub.java", "Ex06_Sup.java", "Ex07_Main.java",
    "Ex23_Animal.java", "Ex24_Cat.java", "Ex25_Main.java")
  $scoped = @($scopeNames | ForEach-Object { Join-Path $source $_ })
  $allOut = Join-Path $root "all classes"
  $scopeOut = Join-Path $root "scope classes"
  New-Item -ItemType Directory -Path $allOut, $scopeOut -ErrorAction Stop | Out-Null

  $allCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -XDrawDiagnostics -d $allOut $all 2>&1)
  $allExit = $LASTEXITCODE
  $scopeCompiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -XDrawDiagnostics -d $scopeOut $scoped 2>&1)
  $scopeExit = $LASTEXITCODE
  $allCodes = @($allCompiler | ForEach-Object {
    [regex]::Match($_.ToString(), "compiler\.warn\.[\w.]+").Value
  } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  $scopeCodes = @($scopeCompiler | ForEach-Object {
    [regex]::Match($_.ToString(), "compiler\.warn\.[\w.]+").Value
  } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  $allCompilerText = $allCompiler -join [Environment]::NewLine
  $warningOwnedByEx09 = $allCompilerText -match "Ex09_Sub\.java"
  $mainCount = @($scoped | Where-Object {
    (Get-Content -Raw -LiteralPath $_) -match "static\s+void\s+main\s*\("
  }).Count
  $compileOnlyCount = $scoped.Count - $mainCount
  if ($all.Count -ne 26 -or $allExit -ne 0 -or $allCodes.Count -ne 1 -or $allCodes[0] -ne "compiler.warn.missing.SVUID" -or -not $warningOwnedByEx09) { throw "package compile contract drift" }
  if ($scopeExit -ne 0 -or $scopeCompiler.Count -ne 0 -or $scopeCodes.Count -ne 0) { throw "scope compile contract drift" }
  if ($scoped.Count -ne 6 -or $mainCount -ne 2 -or $compileOnlyCount -ne 4) { throw "scope role drift" }

  $out07 = @(& java "-Dfile.encoding=UTF-8" -cp $scopeOut com.java.class04.Ex07_Main)
  if ($LASTEXITCODE -ne 0) { throw "Ex07 failed" }
  $out25 = @(& java "-Dfile.encoding=UTF-8" -cp $scopeOut com.java.class04.Ex25_Main)
  if ($LASTEXITCODE -ne 0) { throw "Ex25 failed" }
  if ($out07.Count -ne 21 -or $out25.Count -ne 2) { throw "line count drift" }
  if ($out25[0] -cne "부모 생성자" -or $out25[1] -cne "자식 생성자") { throw "Ex25 output drift" }

  $refs = @($out07 | ForEach-Object {
    [regex]::Matches($_.ToString(), "com\.java\.class04\.Ex05_Sub@[0-9a-fA-F]+")
  } | ForEach-Object Value)
  $blankCount = @($out07 | Where-Object { [string]::IsNullOrWhiteSpace($_) }).Count
  $scopeValues = @($out07[4..6])
  $ageValues = @($out07[8..10])
  $addressValues = @($out07[12..14])
  $heightValues = @($out07[16..17])
  $weightValues = @($out07[19..20])
  $samePrintedReference = ($refs.Count -eq 3) -and ((@($refs | Select-Object -Unique)).Count -eq 1)
  $runtimeTypeToken = ($refs.Count -eq 3) -and ((@($refs | Where-Object { $_ -notmatch "^com\.java\.class04\.Ex05_Sub@" })).Count -eq 0)
  $scopeDistinct = (@($scopeValues | Select-Object -Unique)).Count
  $childAgeReadsEqual = $ageValues[0] -ceq $ageValues[1]
  $parentAgeDistinct = $ageValues[2] -cne $ageValues[0]
  $addressAllEqual = (@($addressValues | Select-Object -Unique)).Count -eq 1
  $heightEqual = $heightValues[0] -ceq $heightValues[1]
  $weightEqual = $weightValues[0] -ceq $weightValues[1]
  $expectedBlankSlots = @(3, 7, 11, 15, 18)
  $blankSlotsMatch = (@($expectedBlankSlots | Where-Object {
    [string]::IsNullOrWhiteSpace($out07[$_])
  })).Count -eq $expectedBlankSlots.Count

  $ex23 = Get-Content -Raw -LiteralPath (Join-Path $source "Ex23_Animal.java")
  $ex24 = Get-Content -Raw -LiteralPath (Join-Path $source "Ex24_Cat.java")
  $privateNoarg = $ex23 -match "private\s+Ex23_Animal\s*\(\s*\)"
  $publicTwoArg = $ex23 -match "public\s+Ex23_Animal\s*\(\s*String\s+\w+\s*,\s*int\s+\w+\s*\)"
  $parameterAssignments = [regex]::Matches($ex23, "this\.(name|age)\s*=").Count
  $constructors = [regex]::Matches($ex24, "public\s+Ex24_Cat\s*\(").Count
  $explicitThisCalls = [regex]::Matches($ex24, "(?m)^\s*this\s*\(").Count
  $explicitSuperCalls = [regex]::Matches($ex24, "(?m)^\s*super\s*\(").Count

  $ex07Contract = $blankCount -eq 5 -and $blankSlotsMatch
  $ex07Contract = $ex07Contract -and $refs.Count -eq 3 -and $samePrintedReference -and $runtimeTypeToken
  $ex07Contract = $ex07Contract -and $scopeValues.Count -eq 3 -and $scopeDistinct -eq 3
  $ex07Contract = $ex07Contract -and $ageValues.Count -eq 3 -and $childAgeReadsEqual -and $parentAgeDistinct
  $ex07Contract = $ex07Contract -and $addressValues.Count -eq 3 -and $addressAllEqual
  $ex07Contract = $ex07Contract -and $heightValues.Count -eq 2 -and $heightEqual
  $ex07Contract = $ex07Contract -and $weightValues.Count -eq 2 -and $weightEqual
  if (-not $ex07Contract) { throw "Ex07 normalized contract drift" }
  if (-not $privateNoarg -or -not $publicTwoArg -or $parameterAssignments -ne 0) { throw "Ex23 shape drift" }
  if ($constructors -ne 3 -or $explicitThisCalls -ne 1 -or $explicitSuperCalls -ne 2) { throw "Ex24 shape drift" }

  "spacePath=$($root.Contains(' ')),packageCompiled=$($all.Count),packageExit=$allExit,packageWarnings=$($allCodes.Count),packageWarningCode=$($allCodes -join '|')"
  "scopedCompiled=$($scoped.Count),scopeExit=$scopeExit,scopeWarnings=$($scopeCodes.Count),mains=$mainCount,compileOnly=$compileOnlyCount"
  "Ex07=lines:$($out07.Count),blankLines:$blankCount,refLines:$($refs.Count),samePrintedReference:$samePrintedReference,runtimeTypeToken:$runtimeTypeToken,scopeReads:$($scopeValues.Count),scopeDistinct:$scopeDistinct,ageReads:$($ageValues.Count),childAgeReadsEqual:$childAgeReadsEqual,parentAgeDistinct:$parentAgeDistinct,addressReads:$($addressValues.Count),addressAllEqual:$addressAllEqual,heightReads:$($heightValues.Count),heightEqual:$heightEqual,ownPrivateWeightReads:$($weightValues.Count),weightEqual:$weightEqual"
  "Ex25=lines:$($out25.Count),values:$($out25 -join '|')"
  "Ex23=privateNoarg:$privateNoarg,publicTwoArg:$publicTwoArg,parameterAssignments:$parameterAssignments"
  "Ex24=constructors:$constructors,explicitThisCalls:$explicitThisCalls,explicitSuperCalls:$explicitSuperCalls"
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }
  if (Test-Path -LiteralPath $resolved) { throw "cleanup failed" }
}`,
        walkthrough: [
          { lines: "1-13", explanation: "system temp의 공백 포함 GUID 직계 child와 package/scope output directories를 만들고 여섯 source의 상대 경로를 고정합니다." },
          { lines: "15-33", explanation: "전체26·범위6을 따로 compile한 뒤 경고 code와 Ex09_Sub 귀속, source에서 계산한 main2·compile-only4를 hard assertion합니다." },
          { lines: "35-62", explanation: "두 main의 native exit와 Ex25 exact 두 줄을 확인하고 Ex07 raw text 대신 위치별 count·blank slots·unique·equality·runtime type token을 계산합니다." },
          { lines: "64-82", explanation: "Ex23·24 source shape와 Ex07 normalized expectations를 모두 출력 전에 assert해 False drift가 정상 종료할 수 없게 합니다." },
          { lines: "84-95", explanation: "검증을 통과한 정규화 결과만 출력하고 resolved path의 parent가 OS temp인지 확인한 뒤 audit root만 제거합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11", "javastudy2/classstudy root"], command: "pwsh -NoProfile -File verify-original-oop06.ps1" },
        output: { value: "spacePath=True,packageCompiled=26,packageExit=0,packageWarnings=1,packageWarningCode=compiler.warn.missing.SVUID\nscopedCompiled=6,scopeExit=0,scopeWarnings=0,mains=2,compileOnly=4\nEx07=lines:21,blankLines:5,refLines:3,samePrintedReference:True,runtimeTypeToken:True,scopeReads:3,scopeDistinct:3,ageReads:3,childAgeReadsEqual:True,parentAgeDistinct:True,addressReads:3,addressAllEqual:True,heightReads:2,heightEqual:True,ownPrivateWeightReads:2,weightEqual:True\nEx25=lines:2,values:부모 생성자|자식 생성자\nEx23=privateNoarg:True,publicTwoArg:True,parameterAssignments:0\nEx24=constructors:3,explicitThisCalls:1,explicitSuperCalls:2", explanation: ["package26 경고 하나는 범위 밖 source에 있고 scope6은 warning0입니다.", "Ex07 raw 개인 문자열과 hash를 공개하지 않아도 한 reference·세 lookup 층·hidden/inherited fields의 관계를 검증할 수 있습니다.", "Ex23 public constructor가 arguments를 fields에 대입하지 않는 사실도 parameterAssignments0으로 보존합니다.", "Ex24 no-arg 경로는 this call 하나와 two-arg constructor의 super call로 이어집니다."] },
        experiments: [
          { change: "Ex05_Sub에서 child age 선언만 제거한 복사본을 만듭니다.", prediction: "unqualified age·this.age·super.age 세 표현이 모두 하나의 inherited field를 읽게 됩니다.", result: "field hiding이 사라져 세 값의 unique count가1이 됩니다." },
          { change: "Ex24 no-arg constructor의 this(args)를 지우고 아무 explicit invocation도 두지 않습니다.", prediction: "compiler가 inaccessible Ex23_Animal()을 암시 호출하려 해 compile 실패합니다.", result: "no-arg child constructor가 parent의 public two-arg를 자동 선택하지 않습니다." },
          { change: "Ex23 two-arg body에 this.name=name과 this.age=age를 추가한 합성 복사본을 검사합니다.", prediction: "parameterAssignments가2가 되고 constructed state가 arguments를 보존합니다.", result: "constructor가 존재한다는 사실과 invariant를 실제로 초기화한다는 사실은 별도 계약입니다." },
        ],
        sourceRefs: ["java-class04-ex05", "java-class04-ex06", "java-class04-ex07", "java-class04-ex23", "java-class04-ex24", "java-class04-ex25", "jdk21-javac", "java-object-tostring"],
      }],
      diagnostics: [
        { symptom: "전체 compile 경고 하나를 보고 범위6도 clean하지 않다고 기록했다.", likelyCause: "package smoke와 scoped compile의 output directory·source set·warning count를 분리하지 않았습니다.", checks: ["경고의 source filename을 확인합니다.", "범위6만 빈 classes directory에 다시 compile합니다.", "각 compile의 native exit와 compiler output을 따로 저장합니다."], fix: "전체26의 Ex09_Sub SVUID 경고와 범위6 warning0을 별도 계약으로 기록합니다.", prevention: "세션마다 package smoke와 scoped audit를 항상 두 개의 독립 compile로 실행합니다." },
        { symptom: "Type@hex 세 줄을 부모·자식·main이 가진 세 개의 주소라고 설명했다.", likelyCause: "default toString rendering, reference identity, object layout을 한 개념으로 섞었습니다.", checks: ["세 token의 full text equality를 봅니다.", "runtime class prefix를 확인합니다.", "합성 fixture에서 parentView==child를 직접 검사합니다."], fix: "Child instance 하나를 서로 다른 실행 지점에서 출력한 것으로 교정하고 hash를 메모리 주소라고 부르지 않습니다.", prevention: "identity 주장은 ==로, rendering 주장은 Object.toString API로 각각 검증합니다." },
      ],
      expertNotes: ["source comment도 audit evidence이지만 language semantics와 충돌하면 active declaration·compiler·JLS를 우선합니다.", "개인 학습자료의 raw literals를 공개 페이지에 복제하지 않고 구조적 assertion으로 같은 교육 효과를 보존할 수 있습니다."],
    },
    {
      id: "extends-single-object-model",
      title: "extends는 별도 부모 객체를 붙이는 문법이 아니라 한 Child instance의 superclass 부분을 정의합니다",
      lead: "Parent view와 Child view가 같은 reference를 가리킬 수 있지만 각 view에서 compile 가능한 member 집합은 다릅니다.",
      explanations: [
        "new Child()는 Child instance 하나를 allocation합니다. 그 객체의 instance state에는 Object부터 direct superclass와 Child까지 각 class가 선언한 fields가 포함되며, JLS의 class instance creation 절차가 superclass 단계부터 차례로 초기화합니다.",
        "Parent parentView = child는 새 Parent object를 만들지 않습니다. 같은 reference value를 더 일반적인 declared type 변수에 복사하는 upcast이며 parentView == child가 true입니다.",
        "reference variable의 declared type은 compile-time에 어떤 member 이름을 사용할 수 있는지 제한합니다. Parent view에서는 Child가 새로 선언한 own field를 바로 읽을 수 없지만 runtime object의 class는 여전히 Child입니다.",
        "getClass()는 runtime class를 돌려주므로 Parent-typed view에서도 Child가 나옵니다. 반면 field access나 overload candidate 수집처럼 compile-time type에 묶인 규칙과 혼동하면 안 됩니다.",
        "원본 주석의 ‘부모 클래스의 주소=자식 클래스의 주소=객체의 주소’는 같은 reference라는 직관에는 도움을 주지만 Object.toString suffix를 실제 주소로 해석하게 만들 수 있습니다. 정확한 표현은 하나의 Child reference를 Child·Parent type으로 볼 수 있다는 것입니다.",
        "상속의 목적은 단순히 줄 수를 줄이는 것이 아닙니다. 모든 Child가 Parent를 요구하는 위치에서 Parent의 의미 계약을 깨지 않고 동작할 때 is-a 관계가 성립하며, 그렇지 않으면 composition이 더 안전합니다.",
      ],
      concepts: [
        { term: "direct superclass", definition: "class declaration의 extends 절에 직접 지정된 상위 class입니다.", detail: ["class는 Object까지 이어지는 single superclass chain을 가집니다.", "interface 구현 관계와 class 상속은 규칙이 다릅니다."] },
        { term: "upcast", definition: "Child reference를 Parent 같은 상위 type reference로 변환하는 widening reference conversion입니다.", detail: ["object를 복사하거나 새로 만들지 않습니다.", "사용 가능한 compile-time member surface는 좁아집니다."] },
        { term: "substitutability", definition: "subtype object가 supertype 계약을 기대하는 문맥에서 의미를 깨지 않고 대체될 수 있다는 설계 기준입니다.", detail: ["문법상 extends 가능하다는 사실보다 강한 조건입니다.", "precondition 강화나 invariant 파괴는 대체 가능성을 해칩니다."] },
      ],
      codeExamples: [{
        id: "single-object-parent-view",
        title: "하나의 Child를 Child view와 Parent view로 관찰합니다",
        language: "java",
        filename: "SingleObjectModel.java",
        purpose: "constructor 순서, reference identity, runtime type, superclass/subclass state를 한 실행에서 분리합니다.",
        code: String.raw`public class SingleObjectModel {
    static class Parent {
        final int inherited = 10;
        Parent() { System.out.println("parent-ctor"); }
    }

    static final class Child extends Parent {
        final int own = 20;
        Child() { System.out.println("child-ctor"); }
    }

    public static void main(String[] args) {
        Child child = new Child();
        Parent parentView = child;
        System.out.println("same=" + (parentView == child));
        System.out.println("runtime=" + parentView.getClass().getSimpleName());
        System.out.println("sum=" + (parentView.inherited + child.own));
    }
}`,
        walkthrough: [
          { lines: "2-10", explanation: "Child는 inherited field를 다시 선언하지 않아 Parent가 선언한 storage와 own storage를 한 instance에 함께 가집니다." },
          { lines: "13-14", explanation: "new는 한 번이고 upcast는 같은 reference value를 parentView에 복사합니다." },
          { lines: "15-17", explanation: "== identity, runtime class, compile 가능한 두 state 합계를 서로 다른 관찰로 출력합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("SingleObjectModel.java", "SingleObjectModel") },
        output: { value: "parent-ctor\nchild-ctor\nsame=true\nruntime=Child\nsum=30", explanation: ["superclass constructor body가 subclass constructor body보다 먼저 실행됩니다.", "same=true는 upcast가 object를 복제하지 않았음을 직접 증명합니다.", "Parent view의 getClass도 runtime Child를 반환합니다.", "Parent가 선언한10과 Child가 선언한20은 같은 object의 서로 다른 fields입니다."] },
        experiments: [
          { change: "Parent parentView = new Parent()로 바꿉니다.", prediction: "constructor trace에 별도 parent-ctor가 추가되고 same=false가 됩니다.", result: "그때만 실제 Parent instance를 하나 더 allocation한 것입니다." },
          { change: "parentView.own을 직접 출력합니다.", prediction: "runtime object가 Child여도 compiler는 Parent type에 own 선언이 없어 거부합니다.", result: "member availability는 runtime class만으로 정하지 않습니다." },
          { change: "Child에 inherited라는 같은 이름의 field를 추가합니다.", prediction: "두 storage가 생기며 view type에 따라 선택되는 field hiding이 발생합니다.", result: "다음 장의 simple-name·qualified field 규칙으로 이어집니다." },
        ],
        sourceRefs: ["java-class04-ex05", "java-class04-ex06", "java-class04-ex07", "jls-superclasses", "jls-class-instance-creation", "jls-getclass"],
      }],
      diagnostics: [
        { symptom: "Parent view에서 Child 전용 field가 보이지 않으니 객체가 Parent로 바뀌었다고 생각했다.", likelyCause: "reference의 declared type과 referenced object's runtime class를 분리하지 않았습니다.", checks: ["new expression이 몇 번 실행됐는지 셉니다.", "parentView==child를 검사합니다.", "parentView.getClass()를 확인합니다."], fix: "object identity/runtime class는 유지되고 compile-time surface만 Parent로 제한된다고 설명합니다.", prevention: "변수 옆에 declared type, heap object 옆에 runtime class를 따로 적습니다." },
        { symptom: "재사용할 field가 있으므로 무조건 extends를 선택했다.", likelyCause: "상속을 is-a 계약이 아니라 코드 복사 방지 수단으로만 봤습니다.", checks: ["Child가 Parent가 약속한 모든 의미를 지키는지 봅니다.", "Parent API 변경이 Child invariant를 깨는지 봅니다.", "has-a delegation으로도 요구를 만족하는지 비교합니다."], fix: "대체 가능성이 없으면 collaborator field를 둔 composition으로 전환합니다.", prevention: "extends 결정 문서에 is-a 문장과 반례를 함께 기록합니다." },
      ],
      comparisons: [{ title: "한 object를 보는 두 관점", options: [
        { name: "Child view", chooseWhen: "subclass-specific API가 실제로 필요할 때", avoidWhen: "caller가 일반 Parent 계약만 알아야 할 때", tradeoffs: ["표현력은 넓지만 coupling이 커집니다.", "Child 전용 field·method를 사용할 수 있습니다."] },
        { name: "Parent view", chooseWhen: "여러 subtype을 하나의 계약으로 처리할 때", avoidWhen: "즉시 downcast해 subtype 세부 구현을 계속 검사할 때", tradeoffs: ["교체 가능성과 테스트 대역이 좋아집니다.", "compile-time surface가 Parent members로 제한됩니다."] },
      ] }],
      expertNotes: ["object layout은 JVM 구현 세부와 padding을 포함하므로 JLS의 논리적 fields 포함 관계를 물리 offset 설명으로 과도하게 일반화하지 않습니다."],
    },
    {
      id: "field-name-resolution-and-hiding",
      title: "local·this·super와 reference type은 서로 다른 단계에서 같은 field name을 선택합니다",
      lead: "field는 virtual dispatch되지 않으므로 숨김을 허용했다면 어느 선언을 읽는지 source에 드러내야 합니다.",
      explanations: [
        "method body의 simple name label은 먼저 lexical scope의 local variable·parameter를 찾습니다. 원본 play()에서 local name이 child field와 parent field보다 우선하는 이유입니다.",
        "this.label은 current object를 receiver로 쓰되 현재 class에서 보이는 field declaration을 선택합니다. Child가 Parent와 같은 이름을 다시 선언했다면 Child field가 Parent field를 hide합니다.",
        "super.label은 별도 Parent object를 가리키는 표현이 아닙니다. current object에서 direct superclass 쪽 member lookup을 시작하도록 선택 지점을 바꾸는 제한된 표현입니다.",
        "Child가 어떤 field를 다시 선언하지 않았다면 unqualified shared, this.shared, super.shared는 모두 inherited Parent field 하나를 읽을 수 있습니다. 원본 address 세 줄이 같은 이유는 주소가 우연히 같아서가 아니라 Child에 동명 field가 없기 때문입니다.",
        "Parent view.field와 Child view.field가 같은 object에서 다른 값을 낼 수 있습니다. field access는 qualifying expression의 compile-time type을 사용하므로 runtime class에 따라 동적으로 바뀌지 않습니다.",
        "hidden mutable fields는 두 개의 truth source를 만들고 serialization·mapping·debugging에서 잘못된 field를 갱신하기 쉽습니다. 같은 의미의 상태라면 private parent field와 protected behavior를 사용하고 동명 재선언을 피하는 편이 낫습니다.",
      ],
      concepts: [
        { term: "field hiding", definition: "subclass가 superclass의 accessible field와 같은 이름의 field를 선언해 두 declarations가 동시에 존재하는 상태입니다.", detail: ["override와 달리 runtime dispatch가 없습니다.", "qualifier의 compile-time type 또는 this/super가 선택을 결정합니다."], caveat: "두 fields가 자동 동기화된다고 가정하면 안 됩니다." },
        { term: "simple name", definition: "receiver나 type qualifier 없이 쓴 단일 identifier입니다.", detail: ["lexical local/parameter가 member보다 먼저 선택될 수 있습니다.", "같은 이름이 많을수록 의도가 흐려집니다."] },
        { term: "super field access", definition: "current object의 superclass declaration 쪽에서 field를 선택하는 super.name 형태입니다.", detail: ["super는 저장 가능한 일반 reference value가 아닙니다.", "static context에서 사용할 수 없습니다."] },
      ],
      codeExamples: [{
        id: "field-resolution-matrix",
        title: "local·this·super·Parent view·Child view의 다섯 선택을 한 표처럼 출력합니다",
        language: "java",
        filename: "FieldResolutionDemo.java",
        purpose: "field hiding과 inherited single field를 값 추측이 아니라 qualifier 규칙으로 확인합니다.",
        code: String.raw`public class FieldResolutionDemo {
    static class Parent {
        String label = "P";
        String shared = "S";
    }

    static final class Child extends Parent {
        String label = "C";

        void trace() {
            String label = "L";
            System.out.println("local=" + label);
            System.out.println("this=" + this.label);
            System.out.println("super=" + super.label);
            System.out.println("sharedSame=" +
                    (this.shared == super.shared));
        }
    }

    public static void main(String[] args) {
        Child child = new Child();
        Parent parentView = child;
        child.trace();
        System.out.println("parentField=" + parentView.label);
        System.out.println("childField=" + child.label);
    }
}`,
        walkthrough: [
          { lines: "2-8", explanation: "label은 Parent와 Child에 각각 storage가 생기지만 shared는 Parent declaration 하나만 있습니다." },
          { lines: "10-17", explanation: "local, current-class field, superclass field를 명시하고 shared 두 표현이 같은 reference를 읽는지 검사합니다." },
          { lines: "21-25", explanation: "같은 child object를 Parent/Child declared types로 field-access해 compile-time selection 차이를 드러냅니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("FieldResolutionDemo.java", "FieldResolutionDemo") },
        output: { value: "local=L\nthis=C\nsuper=P\nsharedSame=true\nparentField=P\nchildField=C", explanation: ["simple label은 local L을 선택합니다.", "this.label과 super.label은 같은 object의 서로 다른 field declarations를 읽습니다.", "shared는 숨겨지지 않아 this와 super가 Parent field 하나를 읽습니다.", "view type이 P와 C를 각각 선택하므로 fields는 dynamic dispatch되지 않습니다."] },
        experiments: [
          { change: "trace의 local label 선언을 제거합니다.", prediction: "simple label은 current Child field를 찾아 C를 출력합니다.", result: "local shadowing 층만 사라지고 this/super 결과는 유지됩니다." },
          { change: "Child의 label 선언을 제거합니다.", prediction: "this.label·super.label·parentView.label·child.label이 모두 P가 됩니다.", result: "field hiding이 사라져 하나의 inherited storage만 남습니다." },
          { change: "Parent와 Child를 서로 다른 top-level declarations로 옮긴 뒤 두 label을 private로 바꿉니다.", prediction: "Child의 super.label access가 compile 실패하고 각 class method를 통해서만 자기 private field를 다룰 수 있습니다.", result: "현재 fixture처럼 같은 top-level 안에 nested된 classes는 nestmates라 서로의 private members에 접근할 수 있습니다. 일반적인 별도 top-level 상속 경계를 재현해야 lookup과 private access를 정확히 분리할 수 있습니다." },
        ],
        sourceRefs: ["java-class04-ex05", "java-class04-ex06", "java-class04-ex07", "jls-field-hiding", "jls-expression-names", "jls-super-access", "jls-access-control"],
      }],
      diagnostics: [
        { symptom: "Parent view와 Child view가 다른 label을 출력해 object가 두 개라고 결론냈다.", likelyCause: "field hiding을 runtime dispatch 또는 object duplication으로 오해했습니다.", checks: ["new count와 == identity를 확인합니다.", "두 classes에 동명 field declarations가 있는지 찾습니다.", "qualifier expression의 compile-time type을 적습니다."], fix: "같은 object 안의 Parent.label과 Child.label 두 storage를 compile-time qualifier가 선택한다고 교정합니다.", prevention: "동명 field를 피하고 필요한 차이는 overridden behavior로 표현합니다." },
        { symptom: "this.shared와 super.shared가 같으니 두 fields가 동기화된다고 설명했다.", likelyCause: "Child가 shared를 재선언했는지 확인하지 않았습니다.", checks: ["Child source에서 shared declaration을 검색합니다.", "reflection getDeclaredFields를 class별로 나눠 봅니다.", "한 표현을 대입한 뒤 다른 표현을 읽어 봅니다."], fix: "재선언이 없으므로 Parent가 선언한 field 하나를 두 lookup form으로 읽는다고 설명합니다.", prevention: "값 equality가 아니라 declaring class와 declaration count를 함께 검사합니다." },
      ],
      expertNotes: ["public/protected mutable field hiding은 binary evolution과 framework mapping을 어렵게 하므로 state는 private, polymorphic variation은 methods로 두는 것이 일반적입니다.", "교육용 nested classes는 같은 nest host를 공유해 서로의 private members에 접근할 수 있으므로 private 상속 경계 test는 별도 top-level declarations나 별도 packages로 작성합니다."],
    },
    {
      id: "member-inheritance-versus-access",
      title: "객체에 상태가 존재하는지, member가 상속되는지, 현재 source에서 접근 가능한지는 서로 다른 질문입니다",
      lead: "private를 ‘자식 객체에 없음’이라고 설명하면 object state와 source-level permission을 동시에 왜곡합니다.",
      explanations: [
        "Parent의 private instance field가 Child object의 superclass state에서 사라지는 것은 아닙니다. 다만 Child declaration의 source code는 그 field 이름으로 직접 접근할 권한이 없고 Parent가 제공한 method를 통해서만 간접적으로 다룰 수 있습니다.",
        "JLS의 inherited member 집합과 accessibility 판단은 구분됩니다. 예를 들어 package-private member는 subclass라는 이유만으로 다른 package에서 접근할 수 없고, 같은 package라는 lexical 관계가 필요합니다.",
        "protected는 ‘subclass면 어디서든 아무 reference를 통해 접근’이 아닙니다. 다른 package의 subclass code에서는 protected instance member를 subclass type의 qualifying reference를 통해 사용하는 추가 제약이 있습니다.",
        "public은 가장 넓은 source access를 주지만 mutable state를 public field로 노출해야 한다는 뜻은 아닙니다. invariant를 유지해야 하는 state는 private로 두고 의미 있는 operations를 공개하는 편이 안전합니다.",
        "원본 Ex05_Sub의 own private weight는 그 field를 선언한 Child method 안이므로 직접 읽을 수 있습니다. 반면 Ex06_Sup의 private dog는 같은 object에 포함되어도 Child source에서 super.dog 또는 dog로 읽을 수 없습니다.",
        "static field도 상속 문맥에서 simple name으로 보일 수 있지만 object별 state가 아닙니다. 어느 class가 선언했는지 type name으로 명시해 instance field와 혼동을 줄여야 합니다.",
      ],
      concepts: [
        { term: "accessibility", definition: "특정 source 위치에서 declaration을 이름으로 사용할 수 있는지 정하는 compile-time 규칙입니다.", detail: ["modifier뿐 아니라 package와 qualifying expression도 영향을 줍니다.", "runtime object에 storage가 있다는 사실과 다릅니다."] },
        { term: "private superclass state", definition: "Child object 안에 존재하지만 Parent declaration의 code만 직접 이름으로 접근할 수 있는 state입니다.", detail: ["Child는 Parent의 protected/public operations로 간접 사용합니다.", "reflection 우회는 정상 설계 계약이 아닙니다."] },
        { term: "package-private", definition: "access modifier를 쓰지 않은 declaration이 같은 package code에 허용하는 접근 수준입니다.", detail: ["subclass 여부와 독립적인 package 경계입니다.", "package 이동은 source compatibility를 깨뜨릴 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "Child에서 private parent field를 읽을 수 없어 그 값은 Child object에 없다고 설명했다.", likelyCause: "storage inclusion과 source accessibility를 같은 것으로 봤습니다.", checks: ["Parent constructor/method가 그 field를 사용하는지 봅니다.", "Child object를 Parent method로 관찰합니다.", "compiler error가 missing symbol인지 access error인지 구분합니다."], fix: "field는 superclass state에 존재하지만 Child source에 direct access가 없다고 교정합니다.", prevention: "상속 설명마다 존재·상속·접근의 세 질문을 따로 답합니다." },
        { symptom: "protected field를 다른 package의 subclass가 Parent-typed arbitrary reference로 읽으려다 실패했다.", likelyCause: "protected의 cross-package qualifying-type 제약을 생략했습니다.", checks: ["접근 code와 declaration의 package를 비교합니다.", "접근 위치가 subclass body인지 확인합니다.", "qualifier의 declared type이 accessing subclass 또는 subtype인지 봅니다."], fix: "외부 package에서는 protected field 직접 공유보다 protected method 또는 public behavior API를 사용하고 qualifier rule을 지킵니다.", prevention: "protected test는 same-package·cross-package·qualifier type cases를 분리합니다." },
      ],
      comparisons: [{ title: "상속 hierarchy에서 state 공개 방식", options: [
        { name: "private field + protected method", chooseWhen: "subclass 확장 지점을 behavior로 통제할 때", avoidWhen: "subclass가 raw storage를 반드시 교환해야 한다고 성급히 가정할 때", tradeoffs: ["invariant와 변경 지점을 중앙화합니다.", "extension API를 신중히 설계해야 합니다."] },
        { name: "protected mutable field", chooseWhen: "작고 폐쇄된 hierarchy에서 직접 state customization이 명시적 계약일 때", avoidWhen: "외부 subclass나 장기 API 호환성이 중요할 때", tradeoffs: ["코드는 짧지만 invariant 우회와 coupling이 큽니다.", "field rename/type change 영향이 넓습니다."] },
        { name: "public mutable field", chooseWhen: "immutable constant가 아닌 일반 state에는 거의 선택하지 않을 때", avoidWhen: "validation·audit·thread safety가 필요할 때", tradeoffs: ["접근은 쉽지만 변경 통제가 사라집니다.", "상속과 무관한 모든 caller에 노출됩니다."] },
      ] }],
      expertNotes: ["module system, nestmate, reflection access는 별도의 runtime/access-control 층입니다. 이 세션의 정상 설계는 Java source accessibility를 우회하지 않는 것을 기준으로 합니다."],
    },
    {
      id: "constructors-are-not-inherited",
      title: "constructor는 상속·override되지 않고 모든 Child 경로는 결국 direct superclass constructor를 선택합니다",
      lead: "compiler가 넣는 implicit super()는 편의 문법일 뿐 접근 가능한 no-arg parent constructor가 존재한다는 보장은 아닙니다.",
      explanations: [
        "constructor declaration은 class 이름과 결합되고 instance creation의 초기화 경로를 정의하므로 method처럼 subclass에 inherited되지 않습니다. Parent(int)가 있다고 해서 new Child(int)가 자동으로 생기지 않습니다.",
        "Child constructor body에 explicit this(args)나 super(args)가 없으면 compiler는 implicit super()를 넣은 것처럼 처리합니다. direct superclass에 accessible no-arg constructor가 없으면 Child body가 비어 있어도 compile 실패합니다.",
        "super(args)는 direct superclass의 overload 중 compile-time에 applicable한 constructor를 선택합니다. grandparent constructor를 직접 건너뛰어 부를 수 없고, 선택된 Parent constructor가 다시 자기 superclass 경로를 책임집니다.",
        "this(args)는 같은 class의 다른 constructor에 위임합니다. Java SE 21에서는 alternate this invocation 또는 superclass super invocation이 constructor body의 첫 statement여야 하고 한 constructor에 둘을 함께 둘 수 없습니다.",
        "여러 this edges를 따라가더라도 cycle은 허용되지 않으며 끝에는 super invocation이 있어야 합니다. canonical constructor 한 곳에서 parent arguments와 child invariant를 완성하면 중복과 경로 누락을 줄일 수 있습니다.",
        "super constructor가 checked exception을 선언하면 Child constructor가 catch할 수 있는 일반 statement보다 먼저 호출되어야 하므로 보통 Child constructor도 throws로 전파해야 합니다. 예외 계약도 constructor chain의 일부입니다.",
      ],
      concepts: [
        { term: "implicit super()", definition: "constructor에 explicit constructor invocation이 없을 때 compiler가 direct superclass의 no-arg constructor 호출을 암시하는 규칙입니다.", detail: ["Parent()가 존재하고 접근 가능해야 합니다.", "임의의 다른 Parent overload를 추측해 주지 않습니다."] },
        { term: "constructor chain", definition: "한 new expression이 this delegation과 superclass invocations를 거쳐 Object까지 연결되는 실행 경로입니다.", detail: ["superclass 단계가 먼저 완료됩니다.", "각 class에서 선택된 constructor body는 한 번만 실행됩니다."] },
        { term: "canonical constructor", definition: "여러 공개 construction paths가 공통 validation·assignment를 위임하는 중심 constructor입니다.", detail: ["this(args)로 duplication을 줄입니다.", "parent call과 invariant 책임을 한 곳에서 검토합니다."] },
      ],
      codeExamples: [{
        id: "this-to-super-constructor-chain",
        title: "no-arg Child가 같은 class constructor를 거쳐 Parent(String)에 도달합니다",
        language: "java",
        filename: "ConstructorChainTrace.java",
        purpose: "this delegation과 super invocation의 실제 실행 순서를 한 줄 trace로 고정합니다.",
        code: String.raw`public class ConstructorChainTrace {
    private static final StringBuilder TRACE = new StringBuilder();

    static void mark(String value) {
        if (!TRACE.isEmpty()) TRACE.append('>');
        TRACE.append(value);
    }

    static class Parent {
        Parent(String id) { mark("parent(" + id + ")"); }
    }

    static final class Child extends Parent {
        Child() {
            this(3);
            mark("child()");
        }

        Child(int count) {
            super("B");
            mark("child(" + count + ")");
        }
    }

    public static void main(String[] args) {
        new Child();
        System.out.println(TRACE);
    }
}`,
        walkthrough: [
          { lines: "9-11", explanation: "Parent에는 String constructor만 있으므로 implicit Parent() 경로는 사용할 수 없습니다." },
          { lines: "14-17", explanation: "Child()는 먼저 Child(int)에 위임하고 돌아온 뒤 자기 body marker를 추가합니다." },
          { lines: "19-22", explanation: "canonical Child(int)가 explicit super(String)으로 parent state를 먼저 구성합니다." },
          { lines: "25-28", explanation: "new는 한 번이지만 chain의 세 constructor bodies가 parent→delegation target→delegating body 순서로 기록됩니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("ConstructorChainTrace.java", "ConstructorChainTrace") },
        output: { value: "parent(B)>child(3)>child()", explanation: ["Child()의 첫 동작은 this(3)이므로 아직 child() marker를 쓰지 않습니다.", "Child(int)의 super(B)가 Parent body를 먼저 실행합니다.", "return path에서 child(3), child()가 차례로 실행됩니다."] },
        experiments: [
          { change: "Child(int)의 super(B)를 제거합니다.", prediction: "compiler가 implicit Parent()를 시도하지만 Parent에는 no-arg constructor가 없어 compile 실패합니다.", result: "다른 Parent overload를 자동 선택하지 않습니다." },
          { change: "Child()에 mark를 this(3) 앞에 둡니다.", prediction: "OpenJDK 21은 constructor invocation이 첫 statement가 아니므로 거부합니다.", result: "JDK 21 language contract를 version-pinned negative test로 다뤄야 합니다." },
          { change: "Child(int)를 지우고 Child()의 this(3)는 유지합니다.", prediction: "matching Child(int) constructor가 없어 compile 실패합니다.", result: "Parent(int) 존재 여부와 무관하게 this는 같은 class에서만 찾습니다." },
        ],
        sourceRefs: ["java-class04-ex23", "java-class04-ex24", "java-class04-ex25", "jls-constructors", "jls-constructor-body", "jls-default-constructor"],
      }],
      diagnostics: [
        { symptom: "Child() body가 비어 있는데 ‘Parent constructor cannot be applied’가 발생했다.", likelyCause: "explicit invocation이 없어 compiler가 inaccessible 또는 nonexistent Parent()를 암시 호출했습니다.", checks: ["Parent의 모든 constructor signatures를 적습니다.", "Parent()의 access를 확인합니다.", "Child constructor 첫 statement를 확인합니다."], fix: "의도한 Parent(args)를 super(args)로 명시하거나 Parent no-arg를 의미 있게 제공하되 invariant를 약화하지 않습니다.", prevention: "superclass가 no-arg를 제거하는 API 변경 전에 모든 subclass constructors를 compile-contract로 검사합니다." },
        { symptom: "Parent(int)가 있으니 new Child(1)도 될 것이라 기대했다.", likelyCause: "constructor를 inherited method처럼 생각했습니다.", checks: ["Child에 실제 Child(int) declaration이 있는지 찾습니다.", "reflection getDeclaredConstructors 결과를 봅니다.", "호출 error의 searched symbol이 Child인지 확인합니다."], fix: "Child(int)를 명시적으로 선언하고 필요한 super(int)를 연결합니다.", prevention: "public construction surface는 class별 API로 문서화합니다." },
      ],
      expertNotes: ["superclass public/protected constructor 삭제·접근 축소는 existing subclasses의 source/binary compatibility를 깨뜨릴 수 있으므로 API evolution review가 필요합니다."],
    },
    {
      id: "original-cat-chain-reconstruction",
      title: "Ex23·24·25의 실제 no-arg 경로는 this(String,int)→super(String,int)이며 int constructor를 지나지 않습니다",
      lead: "같은 class에 constructor가 세 개 있어도 delegation edge로 연결된 declarations만 한 new 경로에서 실행됩니다.",
      explanations: [
        "Ex23_Animal은 private no-arg와 public String,int constructors를 선언합니다. Child source는 private Parent()를 정상적으로 호출할 수 없으므로 Ex24의 각 construction path는 accessible two-argument parent constructor로 이어져야 합니다.",
        "Ex24_Cat()의 첫 statement는 this(String,int)입니다. 그 target constructor가 super(name,age)를 호출하므로 Ex25의 new Ex24_Cat()은 Parent two-arg body, Child two-arg body, Child no-arg 나머지 body 순서로 진행됩니다.",
        "Child two-arg body에는 super 뒤 추가 출력이 없습니다. 따라서 원본 Ex25는 Parent marker와 no-arg Child marker 두 줄만 출력하며 Ex24_Cat(int)의 age marker는 나오지 않습니다.",
        "Ex24_Cat(int)는 별도의 public entry입니다. new Ex24_Cat(9)처럼 직접 호출할 때만 super(String,int) 뒤 int body가 실행됩니다. overload 목록과 특정 chain의 실행 경로를 구분해야 합니다.",
        "private Parent()의 marker는 정상 Child construction에서 나오지 않습니다. private은 보안 장벽이라는 추상적 표현보다 ‘declaring class 밖 source에서 직접 invocation 불가’라는 access contract로 설명해야 정확합니다.",
        "더 중요한 원본 결함은 Parent(String,int)가 parameter를 fields에 저장하지 않는다는 점입니다. 성공적으로 chain이 연결되어도 의미 있는 초기화가 자동 보장되는 것은 아니므로 state assertion이 필요합니다.",
      ],
      concepts: [
        { term: "delegation edge", definition: "constructor 첫 statement의 this(args) 또는 super(args)가 가리키는 다음 constructor 선택입니다.", detail: ["overload set 전체가 실행되는 것은 아닙니다.", "edge를 따라간 한 경로만 실행됩니다."] },
        { term: "inaccessible no-arg constructor", definition: "declaration은 존재하지만 현재 Child source 위치에서 invocation할 수 없는 Parent()입니다.", detail: ["‘없음’과 diagnostic은 다를 수 있습니다.", "explicit accessible overload가 필요합니다."] },
        { term: "state initialization contract", definition: "constructor가 끝났을 때 arguments와 fields가 도메인 invariant를 만족한다는 검증 가능한 약속입니다.", detail: ["출력 순서 성공만으로 증명되지 않습니다.", "field assignment와 validation assertion이 필요합니다."] },
      ],
      codeExamples: [{
        id: "three-public-child-paths",
        title: "원본 구조를 개인값 없는 합성 class로 재구성해 세 public paths를 모두 실행합니다",
        language: "java",
        filename: "CatChainProbe.java",
        purpose: "원본 Ex25가 실행하지 않은 int·two-arg Child constructors까지 chain 차이를 정확히 비교합니다.",
        code: String.raw`public class CatChainProbe {
    public static void main(String[] args) {
        System.out.println("case:noarg");
        new ProbeCat();
        System.out.println("case:int");
        new ProbeCat(9);
        System.out.println("case:twoarg");
        new ProbeCat("C", 3);
    }
}

class ProbeAnimal {
    private ProbeAnimal() {
        System.out.println("private-parent");
    }

    public ProbeAnimal(String name, int age) {
        System.out.println("부모 생성자");
    }
}

final class ProbeCat extends ProbeAnimal {
    public ProbeCat() {
        this("C", 1);
        System.out.println("자식 생성자");
    }

    public ProbeCat(int age) {
        super("C", 2);
        System.out.println("나이는 " + age + "입니다.");
    }

    public ProbeCat(String name, int age) {
        super(name, age);
    }
}`,
        walkthrough: [
          { lines: "1-10", explanation: "public runner가 ProbeCat의 세 public APIs를 별도 case로 실행해 overload 목록과 chain edges를 분리합니다." },
          { lines: "12-20", explanation: "ProbeAnimal은 runner/child와 별도 top-level declaration이라 private no-arg는 ProbeCat에서 inaccessible하고 public two-arg만 정상 superclass edge가 됩니다." },
          { lines: "22-36", explanation: "ProbeCat()은 ProbeCat(String,int)에 위임하고, int와 two-arg paths는 각각 직접 Parent two-arg로 연결됩니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("CatChainProbe.java", "CatChainProbe") },
        output: { value: "case:noarg\n부모 생성자\n자식 생성자\ncase:int\n부모 생성자\n나이는 9입니다.\ncase:twoarg\n부모 생성자", explanation: ["noarg path는 parent→child noarg 두 markers이고 int marker가 없습니다.", "int path만 argument9를 body에서 출력합니다.", "twoarg path는 Parent body 뒤 Child body에 추가 marker가 없어 한 줄입니다.", "private-parent는 어느 case에도 나오지 않습니다."] },
        experiments: [
          { change: "Cat()의 this(C,1)를 this(9)로 바꿉니다.", prediction: "noarg case가 Parent marker→age9 marker→Child marker 세 줄이 됩니다.", result: "delegation edge를 바꾸면 같은 class의 int body가 새 경로에 포함됩니다." },
          { change: "Animal(String,int)에서 fields를 final로 선언하고 arguments를 검증·대입합니다.", prediction: "빈 name이나 음수 age를 거부하고 성공 object가 input state를 보존합니다.", result: "chain trace뿐 아니라 invariant contract가 생깁니다." },
          { change: "Animal()을 protected로 바꾸고 Cat()에서 this를 제거합니다.", prediction: "implicit super()가 compile되어 private-parent marker 뒤 child marker가 나옵니다.", result: "access 확대는 가능한 path와 Parent invariant를 함께 바꿉니다." },
        ],
        sourceRefs: ["java-class04-ex23", "java-class04-ex24", "java-class04-ex25", "jls-constructor-body", "jls-access-control"],
      }],
      diagnostics: [
        { symptom: "new Cat()이 Cat(int)도 차례로 실행한다고 설명했다.", likelyCause: "constructor declarations의 source 순서나 overload 수를 call graph로 오해했습니다.", checks: ["Cat()의 explicit this target signature를 적습니다.", "target body의 explicit super target을 적습니다.", "각 body marker를 구별해 실행합니다."], fix: "Cat()→Cat(String,int)→Animal(String,int) edge만 그립니다.", prevention: "constructor마다 한 개의 outgoing this/super edge를 표로 기록합니다." },
        { symptom: "private Parent()을 ‘보안 생성자’라 부르면 객체 생성이 안전해진다고 믿었다.", likelyCause: "accessibility를 validation·authorization·보안 통제로 과장했습니다.", checks: ["다른 public constructors가 invalid state를 허용하는지 봅니다.", "arguments가 fields에 실제 대입되는지 봅니다.", "factory·serialization·reflection 경계도 검토합니다."], fix: "private은 source invocation surface를 제한할 뿐이며 invariant는 모든 reachable path에서 별도 검증합니다.", prevention: "보안이라는 단어 대신 caller·scope·허용 path를 구체적으로 씁니다." },
      ],
      expertNotes: ["constructor coverage는 declaration coverage가 아니라 각 public entry에서 실제 delegation edge와 postcondition을 검사해야 합니다."],
    },
    {
      id: "superclass-first-instance-initialization",
      title: "new Child의 instance initialization은 superclass fields·blocks·body를 끝낸 뒤 Child fields·blocks·body로 내려옵니다",
      lead: "constructor body만 보면 이미 앞에서 실행된 default values·field initializers·initializer blocks를 놓칩니다.",
      explanations: [
        "class가 필요하면 class initialization이 먼저 일어날 수 있지만, instance construction 자체는 memory allocation과 모든 instance fields의 default value 설정에서 시작합니다. 이 시점에는 int0·reference null 같은 값이 들어 있습니다.",
        "선택된 Child constructor의 super invocation을 따라 Parent 단계로 들어가면 Parent보다 위 superclass를 먼저 처리합니다. 돌아오면서 Parent의 instance field initializers와 instance initializer blocks를 source textual order로 실행한 뒤 Parent constructor body를 실행합니다.",
        "Parent constructor가 정상 완료된 뒤에야 Child의 field initializers와 initializer blocks가 textual order로 실행되고 선택된 Child constructor body의 나머지가 실행됩니다. 그래서 원본 Ex07에서 parent marker가 child marker보다 먼저입니다.",
        "this delegation이 있으면 같은 class의 instance initializers를 constructor마다 반복 실행하지 않습니다. 다른 constructor로 위임된 chain이 superclass processing과 current-class initialization을 한 번 수행한 뒤 delegating body로 돌아옵니다.",
        "Parent constructor에서 overridable instance method를 호출하면 Child fields가 아직 default values인 시점에 Child override가 dispatch될 수 있습니다. 이 문제는 순서상 합법이지만 불완전한 state를 관찰하는 설계 결함입니다.",
        "어느 superclass constructor나 initializer가 예외로 abrupt completion하면 아래 subclass initializers/body는 실행되지 않고 new expression은 reference를 반환하지 않습니다. 이미 일어난 외부 side effect는 자동 rollback되지 않습니다.",
      ],
      concepts: [
        { term: "default-value phase", definition: "field initializer 실행 전에 새 instance의 fields가 type별 기본값을 갖는 단계입니다.", detail: ["명시 initializer와 구분합니다.", "constructor dynamic dispatch 위험을 설명하는 핵심입니다."] },
        { term: "textual order", definition: "한 class 안에서 instance field initializers와 initializer blocks가 source에 나타난 순서대로 실행되는 규칙입니다.", detail: ["superclass 단계와 subclass 단계 사이에는 class 경계가 있습니다.", "constructor body는 그 class의 initializers 뒤입니다."] },
        { term: "abrupt completion", definition: "exception 등으로 initialization step이 정상 종료하지 못해 나머지 construction이 중단되는 상태입니다.", detail: ["Child body가 실행되지 않을 수 있습니다.", "외부 side effect 정리는 별도 책임입니다."] },
      ],
      codeExamples: [{
        id: "inheritance-initialization-order",
        title: "Parent와 Child의 field·block·constructor 순서를 정확히 여섯 줄로 고정합니다",
        language: "java",
        filename: "InheritanceInitOrder.java",
        purpose: "각 class 내부 textual order와 superclass-first 경계를 동시에 검증합니다.",
        code: String.raw`public class InheritanceInitOrder {
    static String mark(String value) {
        System.out.println(value);
        return value;
    }

    static class Parent {
        String parentField = mark("parent-field");
        { mark("parent-block"); }
        Parent() { mark("parent-ctor"); }
    }

    static final class Child extends Parent {
        String childField = mark("child-field");
        { mark("child-block"); }
        Child() { mark("child-ctor"); }
    }

    public static void main(String[] args) {
        new Child();
    }
}`,
        walkthrough: [
          { lines: "2-5", explanation: "mark는 평가 시점을 그대로 출력하고 field initializer에는 non-null synthetic value를 반환합니다." },
          { lines: "7-10", explanation: "Parent 안에서 field→block→constructor body의 textual/phase order를 둡니다." },
          { lines: "13-16", explanation: "같은 세 단계를 Child에도 두어 class boundary를 관찰합니다." },
          { lines: "19-21", explanation: "new Child 한 번으로 여섯 initialization events가 모두 실행됩니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("InheritanceInitOrder.java", "InheritanceInitOrder") },
        output: { value: "parent-field\nparent-block\nparent-ctor\nchild-field\nchild-block\nchild-ctor", explanation: ["Parent의 세 단계가 모두 끝나기 전 Child field는 명시 initializer를 실행하지 않습니다.", "각 class 안에서는 field와 block이 source 순서이고 constructor body가 뒤입니다.", "class static initialization output은 이 fixture에 없으므로 instance order만 격리합니다."] },
        experiments: [
          { change: "Parent block을 parentField 선언 위로 옮깁니다.", prediction: "Parent 구간만 parent-block→parent-field→parent-ctor로 바뀝니다.", result: "같은 class의 field/block은 textual order를 따릅니다." },
          { change: "Child()에서 RuntimeException을 던집니다.", prediction: "여섯 markers는 모두 출력된 뒤 new가 실패합니다.", result: "Child body 진입 전 단계가 이미 끝났기 때문에 side effects는 남습니다." },
          { change: "Parent() 시작에서 exception을 던집니다.", prediction: "parent-field·parent-block 뒤 Parent body가 실패하고 Child의 세 markers는 나오지 않습니다.", result: "superclass abrupt completion이 subclass initialization을 차단합니다." },
        ],
        sourceRefs: ["java-class04-ex05", "java-class04-ex06", "java-class04-ex07", "jls-class-instance-creation", "jls-instance-initializers", "jls-field-initialization"],
      }],
      diagnostics: [
        { symptom: "Child field initializer가 source에서 Parent constructor 호출보다 위에 보이니 먼저 실행된다고 예측했다.", likelyCause: "서로 다른 class의 source 위치를 하나의 textual list로 합쳤습니다.", checks: ["class별 initializer 목록을 따로 적습니다.", "super chain을 Object부터 아래로 그립니다.", "body marker를 field/block과 구분합니다."], fix: "superclass 단계를 완성한 뒤 Child 내부 textual order를 적용합니다.", prevention: "trace 표에 class·phase·event 세 열을 둡니다." },
        { symptom: "Parent constructor에서 Child override가 null을 읽어 NPE가 났다.", likelyCause: "Parent construction 중 virtual call이 아직 초기화되지 않은 Child field를 관찰했습니다.", checks: ["constructor와 initializers에서 overridable method 호출을 찾습니다.", "override가 Child fields를 읽는지 봅니다.", "default-value 시점 trace를 추가합니다."], fix: "constructor에서는 private/final helper만 호출하거나 완성 후 factory 단계에서 polymorphic hook을 실행합니다.", prevention: "static analysis와 code review에서 constructor virtual-call rule을 강제합니다." },
      ],
      expertNotes: ["상속 initialization trace는 logging framework나 dependency injection callback처럼 constructor 밖으로 this가 노출되는 경로까지 함께 감사해야 합니다."],
    },
    {
      id: "field-selection-versus-method-dispatch",
      title: "field는 declared type으로 선택되고 overridden instance method는 runtime receiver로 dispatch됩니다",
      lead: "같은 표현 p.label과 p.describe()가 서로 다른 selection 시점을 쓰는 것이 field hiding을 특히 위험하게 만듭니다.",
      explanations: [
        "Parent p = new Child()에서 p.label은 Parent가 선언한 field를 선택합니다. qualifying expression p의 compile-time type이 Parent이기 때문이며 runtime Child는 field selection을 바꾸지 않습니다.",
        "p.describe()는 compile-time에 Parent.describe signature가 선택된 뒤 runtime receiver Child에서 overriding implementation을 찾습니다. 따라서 같은 p receiver로 field=P, method=C가 나올 수 있습니다.",
        "Child code 안의 super.describe()는 current object를 유지하면서 direct superclass implementation을 명시적으로 호출합니다. super가 다른 object거나 일반 변수는 아니며 dynamic dispatch를 의도적으로 우회하는 제한된 호출입니다.",
        "static methods도 override되지 않고 hide됩니다. instance reference로 static method를 호출하는 문법이 허용되더라도 declared type 선택을 흐리므로 TypeName.method()로 명시해야 합니다.",
        "원본 Ex05/06은 fields로 lookup 차이를 가르치지만 이후 polymorphism session에서는 methods와 비교해야 합니다. 이 장은 override 전체를 선행하지 않고 두 selection mechanisms의 경계만 확실히 고정합니다.",
        "도메인에서 subtype마다 다른 의미를 원하면 같은 이름의 public field를 다시 선언하기보다 protected/private state와 overridden query method를 사용합니다. caller는 Parent contract만 알고도 runtime behavior를 얻습니다.",
      ],
      concepts: [
        { term: "compile-time field selection", definition: "field access expression의 qualifying type과 declaration lookup으로 어느 field를 읽을지 compile 때 고정하는 규칙입니다.", detail: ["runtime dispatch가 없습니다.", "cast가 선택을 바꿀 수 있습니다."] },
        { term: "dynamic method dispatch", definition: "선택된 instance method signature의 실제 body를 runtime receiver class의 override에서 찾는 과정입니다.", detail: ["static/private/final methods에는 같은 형태의 override dispatch가 없습니다.", "overload selection과도 구분합니다."] },
        { term: "super method invocation", definition: "current object에서 direct superclass implementation을 명시적으로 실행하는 super.method(args) 표현입니다.", detail: ["별도 Parent instance가 필요하지 않습니다.", "static context에는 current receiver가 없어 사용할 수 없습니다."] },
      ],
      codeExamples: [{
        id: "field-method-selection-boundary",
        title: "Parent-typed receiver 하나에서 hidden field와 overridden method가 갈라지는 지점을 봅니다",
        language: "java",
        filename: "DispatchBoundary.java",
        purpose: "field hiding을 method overriding과 같은 규칙으로 설명하는 오류를 실행 결과로 차단합니다.",
        code: String.raw`public class DispatchBoundary {
    static class Parent {
        String label = "P";
        String describe() { return "method:P"; }
    }

    static final class Child extends Parent {
        String label = "C";

        @Override
        String describe() { return "method:C"; }

        String parentDescription() { return super.describe(); }
    }

    static void inspect(Parent value) {
        System.out.println("field=" + value.label);
        System.out.println(value.describe());
    }

    public static void main(String[] args) {
        Child child = new Child();
        inspect(child);
        System.out.println("childField=" + child.label);
        System.out.println("superCall=" + child.parentDescription());
    }
}`,
        walkthrough: [
          { lines: "2-13", explanation: "label은 두 declarations로 hide되고 describe는 같은 signature로 override됩니다." },
          { lines: "13", explanation: "Child helper의 super.describe는 같은 Child object에서 Parent implementation을 지정합니다." },
          { lines: "16-19", explanation: "parameter의 declared type Parent가 field를 P로 고정하지만 method body는 runtime dispatch합니다." },
          { lines: "22-26", explanation: "Child view field와 explicit super method call을 추가해 네 선택을 비교합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("DispatchBoundary.java", "DispatchBoundary") },
        output: { value: "field=P\nmethod:C\nchildField=C\nsuperCall=method:P", explanation: ["inspect의 value.label은 declared Parent 때문에 P입니다.", "value.describe는 runtime Child override를 실행해 C입니다.", "Child view field는 hidden Child declaration을 선택합니다.", "super.describe는 current Child object에서 Parent implementation을 명시합니다."] },
        experiments: [
          { change: "Child.describe의 @Override를 지우되 signature는 유지합니다.", prediction: "output은 같지만 accidental signature drift를 compiler가 잡아 주지 못합니다.", result: "@Override는 dispatch 기능이 아니라 override 의도 검증입니다." },
          { change: "Child.describe를 describe(int x)로 바꿉니다.", prediction: "@Override가 있으면 compile 실패하고, 없으면 overload가 되어 inspect는 Parent.describe를 실행합니다.", result: "signature relation이 runtime dispatch의 전제입니다." },
          { change: "inspect에서 ((Child)value).label을 읽습니다.", prediction: "실제 value가 Child인 현재 fixture에서는 C지만 다른 Parent subtype이면 ClassCastException 위험이 생깁니다.", result: "field hiding 때문에 downcast하는 설계보다 method contract가 안전합니다." },
        ],
        sourceRefs: ["java-class04-ex05", "java-class04-ex06", "jls-field-hiding", "jls-overriding", "jls-runtime-method-lookup", "jls-super-access"],
      }],
      diagnostics: [
        { symptom: "Parent-typed 변수의 field도 Child 값이 나올 것이라 예측했다.", likelyCause: "method dynamic dispatch 규칙을 field access에 적용했습니다.", checks: ["표현이 field access인지 method invocation인지 구분합니다.", "qualifier의 compile-time type을 적습니다.", "동명 field declarations를 찾습니다."], fix: "Parent qualifier는 Parent field를 선택하며 polymorphic state query는 method로 옮깁니다.", prevention: "상속 hierarchy에서 public/protected 동명 fields를 금지합니다." },
        { symptom: "super.describe()가 별도 Parent object의 method라고 설명했다.", likelyCause: "super를 일반 reference variable로 시각화했습니다.", checks: ["new Parent가 실제로 있는지 셉니다.", "method에서 this identity를 비교합니다.", "super를 변수에 대입할 수 있는지 확인합니다."], fix: "같은 current object에서 lookup/implementation 시작점을 Parent로 지정하는 표현이라고 설명합니다.", prevention: "diagram에 object node는 하나만 그리고 class implementation lanes를 따로 표시합니다." },
      ],
      expertNotes: ["public API field를 method로 바꾸는 일은 source/binary compatibility에 영향을 주므로 처음부터 behavior boundary를 method로 설계하는 편이 낫습니다."],
    },
    {
      id: "substitutability-and-composition-choice",
      title: "extends는 모든 Child가 Parent 계약을 지킬 때만 선택하고 단순 기능 보유는 composition으로 표현합니다",
      lead: "‘재사용할 코드가 있다’보다 caller가 기대하는 의미와 변경 방향이 상속 여부를 결정합니다.",
      explanations: [
        "is-a 문장은 문법적 분류가 아니라 행동 계약입니다. Parent parameter를 받는 모든 정상 operation에 Child를 넣어도 precondition·postcondition·invariant가 깨지지 않아야 의미 있는 subtype입니다.",
        "Child가 Parent operation을 지원하지 못해 UnsupportedOperationException을 자주 던지거나 Parent가 허용한 input을 더 좁게 거부한다면 substitutability가 약합니다. extends는 compile되지만 caller의 추론은 깨집니다.",
        "has-a 관계는 필요한 collaborator를 field로 보유하고 method를 delegation합니다. DeliveryRobot이 Motor를 사용한다고 해서 Motor의 subtype일 필요는 없으며, composition은 runtime 교체와 작은 interface test double을 쉽게 만듭니다.",
        "상속은 superclass protected surface와 initialization protocol에 강하게 결합됩니다. Parent가 새로운 overridable method를 constructor에서 부르거나 field semantics를 바꾸면 source를 고치지 않은 Child도 동작이 달라질 수 있습니다.",
        "composition에도 forwarding code와 object wiring 비용이 있습니다. 그러나 collaborator API를 명시적으로 좁힐 수 있고 내부 구현을 바꿔도 outer type의 is-a 약속을 만들지 않는다는 장점이 큽니다.",
        "상속을 선택할 때는 hierarchy가 폐쇄적인지, Parent가 subclass extension을 문서화했는지, invariant를 protected hooks로 안전하게 유지하는지, 실제 Parent-polymorphic caller가 있는지를 함께 확인합니다.",
      ],
      concepts: [
        { term: "is-a", definition: "subclass instance를 superclass contract가 필요한 곳에 의미 손실 없이 사용할 수 있는 subtype 관계입니다.", detail: ["명사 문장만으로 증명되지 않습니다.", "behavioral tests와 invariant가 필요합니다."] },
        { term: "has-a", definition: "한 object가 다른 역할 object를 field로 보유하고 협력하는 composition 관계입니다.", detail: ["구현 상속 없이 delegation합니다.", "collaborator 교체와 독립 테스트가 쉽습니다."] },
        { term: "fragile base class", definition: "superclass 내부 변경이 문서화되지 않은 subclass 가정과 충돌해 하위 동작을 깨뜨리는 위험입니다.", detail: ["protected surface가 넓을수록 커집니다.", "constructor virtual call과 self-use가 대표 원인입니다."] },
      ],
      codeExamples: [{
        id: "composition-explicit-role",
        title: "DeliveryRobot이 Motor를 상속하지 않고 필요한 start 역할만 보유합니다",
        language: "java",
        filename: "CompositionInsteadOfInheritance.java",
        purpose: "has-a 설계가 unrelated type 사이의 거짓 is-a 관계 없이 재사용과 교체를 제공함을 확인합니다.",
        code: String.raw`public class CompositionInsteadOfInheritance {
    interface Motor {
        String start();
    }

    static final class ElectricMotor implements Motor {
        @Override
        public String start() { return "electric"; }
    }

    static final class DeliveryRobot {
        private final Motor motor;

        DeliveryRobot(Motor motor) {
            this.motor = java.util.Objects.requireNonNull(motor);
        }

        String run(String jobId) {
            return motor.start() + ":" + jobId;
        }
    }

    public static void main(String[] args) {
        DeliveryRobot robot = new DeliveryRobot(new ElectricMotor());
        Object robotView = robot;
        System.out.println("relationship=has-a");
        System.out.println("run=" + robot.run("job-7"));
        System.out.println("robotIsMotor=" + (robotView instanceof Motor));
    }
}`,
        walkthrough: [
          { lines: "2-9", explanation: "Motor는 Robot이 필요한 최소 역할이고 ElectricMotor가 그 계약을 구현합니다." },
          { lines: "11-20", explanation: "Robot은 final concrete class로 collaborator를 constructor-inject하고 start를 delegation합니다." },
          { lines: "23-28", explanation: "Object view를 거쳐 실제 재사용 결과와 Robot 자체가 Motor subtype이 아니라는 runtime 관계를 함께 출력합니다. final concrete class에 곧바로 disjoint interface instanceof를 쓰면 compiler가 불가능한 검사를 거부합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("CompositionInsteadOfInheritance.java", "CompositionInsteadOfInheritance") },
        output: { value: "relationship=has-a\nrun=electric:job-7\nrobotIsMotor=false", explanation: ["Robot은 Motor behavior를 사용하지만 Motor로 대체될 수 있다고 주장하지 않습니다.", "constructor injection으로 null을 즉시 거부하고 다른 Motor implementation을 받을 수 있습니다.", "delegation 결과는 job input과 collaborator output을 명시적으로 조합합니다."] },
        experiments: [
          { change: "테스트에서 () -> \"test\" 같은 Motor lambda를 주입합니다.", prediction: "실제 ElectricMotor 없이 run 결과를 결정적으로 검사할 수 있습니다.", result: "composition이 collaborator 경계를 작은 unit test로 분리합니다." },
          { change: "DeliveryRobot extends ElectricMotor로 바꿔 보려 합니다.", prediction: "ElectricMotor가 final이라 compile 실패하며 final을 지워도 Robot is-a Motor라는 부정확한 의미가 생깁니다.", result: "코드 재사용만으로 상속을 정당화할 수 없습니다." },
          { change: "Motor에 stop을 추가합니다.", prediction: "모든 implementations는 새 contract를 구현해야 하지만 Robot은 필요한 곳에서만 delegation을 추가할 수 있습니다.", result: "interface evolution 비용과 outer API evolution을 분리해 검토합니다." },
        ],
        sourceRefs: ["jls-superclasses", "jls-final-class", "java-objects-require-non-null"],
      }],
      diagnostics: [
        { symptom: "Child가 Parent operation 절반을 UnsupportedOperationException으로 막는다.", likelyCause: "공유 field나 helper 재사용만 보고 거짓 is-a hierarchy를 만들었습니다.", checks: ["Parent public operations를 Child에 적용하는 contract tests를 실행합니다.", "Child가 더 강한 precondition을 요구하는지 봅니다.", "collaborator interface로 필요한 기능만 추출해 봅니다."], fix: "대체 가능성이 없으면 composition과 delegation으로 바꾸고 실제 역할 interface를 정의합니다.", prevention: "extends 승인 기준에 Parent caller substitution test를 포함합니다." },
        { symptom: "Parent의 작은 내부 변경 뒤 unrelated Child tests가 대량 실패했다.", likelyCause: "Child가 undocumented initialization order·protected field·self-use에 결합됐습니다.", checks: ["protected member usage를 목록화합니다.", "Parent constructor와 methods의 overridable self-call을 찾습니다.", "변경 전후 trace를 비교합니다."], fix: "extension points를 작은 protected final-template contract로 제한하거나 composition으로 분리합니다.", prevention: "subclassing을 허용하는 public class는 extension contract와 compatibility tests를 유지합니다." },
      ],
      comparisons: [{ title: "재사용 관계 선택", options: [
        { name: "Inheritance", chooseWhen: "안정된 is-a 계약과 실제 polymorphic caller가 있고 superclass가 subclassing용으로 설계됐을 때", avoidWhen: "일부 helper·field만 재사용하거나 operation을 무력화해야 할 때", tradeoffs: ["override 기반 확장은 간결합니다.", "초기화·protected surface·base evolution coupling이 큽니다."] },
        { name: "Composition", chooseWhen: "필요한 역할을 교체·테스트하고 outer type의 독립 계약을 유지할 때", avoidWhen: "진짜 subtype으로 모든 Parent caller에 들어가야 할 때", tradeoffs: ["delegation code가 생깁니다.", "결합 지점과 lifetime이 명시적입니다."] },
      ] }],
      expertNotes: ["공개 상속 API는 한 번 배포하면 예상하지 못한 외부 subclasses가 생길 수 있으므로 final/sealed 또는 명시적 extension points를 기본 선택으로 검토합니다."],
    },
    {
      id: "constructor-failure-and-side-effects",
      title: "superclass construction이 실패하면 Child body와 reference 반환은 없지만 이미 발생한 외부 side effect는 남습니다",
      lead: "constructor exception은 ‘객체가 null로 완성됨’이 아니라 new expression이 정상 값을 만들지 못한 것입니다.",
      explanations: [
        "super(args)가 exception으로 abrupt completion하면 current Child constructor의 나머지 body는 실행되지 않습니다. assignment의 우변 new가 실패하므로 좌변에는 새 reference value가 대입되지 않습니다.",
        "부분 초기화된 instance를 정상 reference로 caller에게 돌려주지는 않지만 superclass constructor가 증가시킨 counter, 기록한 log, 연 외부 resource, 발행한 event 같은 side effects는 자동으로 되돌아가지 않습니다.",
        "constructor에서 외부 시스템을 변경해야 한다면 실패 원자성을 설계해야 합니다. validation을 side effect보다 앞에 두고, acquisition과 registration은 factory에서 단계화하며 실패 시 명시적 compensation 또는 try-with-resources를 사용합니다.",
        "Parent가 constructor에서 this를 registry에 등록하면 이후 Child initialization이 실패해도 불완전 reference가 외부에 남을 수 있습니다. 이른 this escape는 final field visibility와 invariant reasoning도 어렵게 만듭니다.",
        "exception message text는 JDK·locale·implementation에 따라 달라질 수 있으므로 contract test는 exception type, cause, state counter, Child body non-execution을 중심으로 검증합니다.",
        "성공 경로에서도 Parent attempt가 먼저 증가하고 Child body가 뒤에 실행됩니다. failure test와 success recovery test를 같이 두어 static shared test state가 다음 case를 오염시키지 않도록 reset 또는 isolated process를 사용합니다.",
      ],
      concepts: [
        { term: "failed construction", definition: "constructor chain이 abrupt completion해 new expression이 정상 reference value를 생산하지 못한 상태입니다.", detail: ["Child body가 실행되지 않을 수 있습니다.", "side effects까지 자동 rollback된다는 뜻은 아닙니다."] },
        { term: "this escape", definition: "construction이 완전히 끝나기 전에 current instance reference가 외부에서 관찰 가능해지는 현상입니다.", detail: ["registry·listener·thread start·overridable callback이 경로가 될 수 있습니다.", "subclass fields가 default value일 수 있습니다."] },
        { term: "failure atomicity", definition: "operation이 실패하면 외부에서 관찰 가능한 상태가 실행 전과 같거나 명시된 복구 상태를 유지하는 성질입니다.", detail: ["constructor 자체가 모든 외부 효과를 rollback하지 않습니다.", "factory와 resource scope가 도움을 줍니다."] },
      ],
      codeExamples: [{
        id: "super-construction-failure",
        title: "Parent 실패가 Child body를 막지만 Parent side-effect counter는 남는지 확인합니다",
        language: "java",
        filename: "SuperFailure.java",
        purpose: "constructor failure의 control flow와 외부 관찰 상태를 exception message에 의존하지 않고 검증합니다.",
        code: String.raw`public class SuperFailure {
    static class Parent {
        static int attempts;

        Parent(boolean fail) {
            attempts++;
            if (fail) throw new IllegalArgumentException("rejected");
        }
    }

    static final class Child extends Parent {
        static int bodies;

        Child(boolean fail) {
            super(fail);
            bodies++;
        }
    }

    public static void main(String[] args) {
        try {
            new Child(true);
            throw new AssertionError("exception expected");
        } catch (IllegalArgumentException expected) {
            System.out.println("caught=" + expected.getClass().getSimpleName());
        }
        System.out.println("afterFailure=attempts:" + Parent.attempts
                + ",childBodies:" + Child.bodies);

        Child value = new Child(false);
        System.out.println("afterSuccess=attempts:" + Parent.attempts
                + ",childBodies:" + Child.bodies
                + ",type:" + value.getClass().getSimpleName());
    }
}`,
        walkthrough: [
          { lines: "2-9", explanation: "Parent는 body 진입 side effect를 기록한 뒤 선택적으로 실패합니다." },
          { lines: "11-18", explanation: "Child counter는 super가 정상 반환한 뒤에만 증가합니다." },
          { lines: "21-29", explanation: "실패 case는 type만 확인하고 Parent attempt1·Child body0을 출력합니다." },
          { lines: "31-34", explanation: "같은 process의 성공 case가 Parent attempt2·Child body1과 정상 runtime type을 만듭니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("SuperFailure.java", "SuperFailure") },
        output: { value: "caught=IllegalArgumentException\nafterFailure=attempts:1,childBodies:0\nafterSuccess=attempts:2,childBodies:1,type:Child", explanation: ["첫 Parent body는 실행되어 attempts1을 남기지만 Child body는 실행되지 않습니다.", "exception text가 아니라 stable type만 출력합니다.", "두 번째 construction은 chain을 끝내 bodies1과 Child reference를 만듭니다."] },
        experiments: [
          { change: "attempts++를 validation 뒤로 옮깁니다.", prediction: "실패 뒤 attempts0이 됩니다.", result: "되돌릴 필요 없는 validation-first 순서가 failure atomicity를 개선합니다." },
          { change: "Parent가 실패 전에 static list에 this를 추가합니다.", prediction: "Child body0인데 list에는 incomplete Child reference가 남습니다.", result: "constructor의 this escape가 failure isolation을 깨뜨립니다." },
          { change: "Child body에서 exception을 던집니다.", prediction: "Parent attempts는 증가하고 Child bodies도 증가한 뒤 new가 실패합니다.", result: "실패 지점 이전 side effects를 phase별로 추적해야 합니다." },
        ],
        sourceRefs: ["jls-class-instance-creation", "jls-constructor-body", "jls-happens-before", "jls-final-field-semantics"],
      }],
      diagnostics: [
        { symptom: "constructor가 실패했는데 등록 counter나 외부 record가 남았다.", likelyCause: "Parent 또는 initializer가 validation 전에 side effect를 수행했고 자동 rollback을 기대했습니다.", checks: ["trace로 마지막 성공 event를 찾습니다.", "registry/listener/thread에 this가 전달되는지 봅니다.", "compensation path와 idempotency를 확인합니다."], fix: "순수 validation을 앞세우고 외부 effect는 완성된 object를 받는 factory/service 단계로 이동합니다.", prevention: "failure-injection test에서 각 construction phase 뒤 외부 state를 검사합니다." },
        { symptom: "catch 뒤 Child variable을 사용하려니 초기화되지 않았다는 compile error가 난다.", likelyCause: "실패한 new가 null을 대입한다고 오해했습니다.", checks: ["assignment가 try 안에서만 일어나는지 봅니다.", "definite assignment를 확인합니다.", "성공/실패 결과를 명시 type으로 표현할 수 있는지 검토합니다."], fix: "factory result 또는 try 내부 success branch에서만 reference를 사용하고 실패를 별도 return/exception path로 둡니다.", prevention: "partially constructed sentinel 대신 construction outcome을 명시적으로 모델링합니다." },
      ],
      expertNotes: ["finalizer에 실패 cleanup을 의존하지 않습니다. 외부 resource는 lexical scope와 명시적 close/compensation으로 관리해야 합니다."],
    },
    {
      id: "structural-contracts-and-api-evolution",
      title: "reflection으로 superclass·declaring class·constructor surface를 검사하고 base-class 진화를 호환성 문제로 다룹니다",
      lead: "출력 값이 우연히 같아도 구조가 달라질 수 있으므로 hierarchy shape는 별도 structural assertion이 필요합니다.",
      explanations: [
        "Class.getSuperclass()는 direct superclass를 확인합니다. source text regex보다 compiled class 관계를 직접 보지만 generic type arguments 같은 source-level 정보는 getGenericSuperclass와 별도 검사해야 합니다.",
        "Child.class.getField(name)가 inherited public field를 찾더라도 Field.getDeclaringClass()는 실제 declaration owner인 Parent를 반환합니다. 이 정보로 inherited single field와 hidden duplicate fields를 구분할 수 있습니다.",
        "getDeclaredConstructors()는 그 class가 선언한 constructors만 반환합니다. Parent(int)가 있어도 Child declared constructor 목록에 나타나지 않는다는 사실이 constructor non-inheritance의 구조 증거입니다.",
        "public/protected Parent constructor를 삭제하거나 access를 줄이면 새 source compile뿐 아니라 기존 Child binary linking에도 영향을 줄 수 있습니다. superclass 변경, final 추가, field/member 변화는 JLS binary compatibility 규칙을 따로 검토해야 합니다.",
        "Parent에 새 field를 추가했는데 기존 Child에 같은 이름 field가 있으면 binary는 연결되어도 source를 다시 compile했을 때 lookup·hiding·warning·reflection 결과가 달라질 수 있습니다. ‘compile 성공’만으로 의미 호환성을 보장할 수 없습니다.",
        "외부 subclass가 의도되지 않았다면 final 또는 제한된 hierarchy를 선택하고, 의도됐다면 protected extension points·constructor postconditions·self-use·thread-safety를 API 문서와 contract suite로 공개해야 합니다.",
      ],
      concepts: [
        { term: "declaring class", definition: "reflection member object가 가리키는 declaration을 실제로 포함한 class입니다.", detail: ["lookup을 시작한 Child와 다를 수 있습니다.", "hidden fields는 declaring class가 서로 다릅니다."] },
        { term: "structural assertion", definition: "실행 값이 아니라 superclass, modifiers, declarations, signatures 같은 compiled shape를 검사하는 test입니다.", detail: ["reflection과 compiler diagnostics를 사용합니다.", "behavioral golden을 보완합니다."] },
        { term: "binary compatibility", definition: "기존에 compile된 client/subclass binary가 library 변경 뒤 linkage·동작을 유지할 수 있는지에 관한 계약입니다.", detail: ["source compatibility와 같지 않습니다.", "semantic compatibility는 그보다 더 강한 별도 검토입니다."] },
      ],
      codeExamples: [{
        id: "reflection-inheritance-shape",
        title: "compiled hierarchy에서 direct superclass·field owner·constructor non-inheritance·final을 확인합니다",
        language: "java",
        filename: "InheritanceShape.java",
        purpose: "값 golden으로 잡을 수 없는 상속 구조 drift를 reflection contract로 고정합니다.",
        code: String.raw`import java.lang.reflect.Modifier;

public class InheritanceShape {
    static class Parent {
        public int shared = 7;
        protected Parent(int seed) { shared = seed; }
    }

    static final class Child extends Parent {
        public Child() { super(9); }
    }

    public static void main(String[] args) throws Exception {
        System.out.println("superclass="
                + Child.class.getSuperclass().getSimpleName());
        System.out.println("inheritedFieldOwner="
                + Child.class.getField("shared")
                        .getDeclaringClass().getSimpleName());
        System.out.println("childDeclaredConstructors="
                + Child.class.getDeclaredConstructors().length);
        boolean childHasIntConstructor;
        try {
            Child.class.getDeclaredConstructor(int.class);
            childHasIntConstructor = true;
        } catch (NoSuchMethodException expected) {
            childHasIntConstructor = false;
        }
        System.out.println("childHasIntConstructor=" + childHasIntConstructor);
        System.out.println("childFinal="
                + Modifier.isFinal(Child.class.getModifiers()));
    }
}`,
        walkthrough: [
          { lines: "4-11", explanation: "Parent(int)와 public field, Child()와 final modifier라는 의도된 shape를 선언합니다." },
          { lines: "14-19", explanation: "direct superclass와 inherited lookup 결과의 실제 declaration owner를 분리합니다." },
          { lines: "20-28", explanation: "Child 선언 constructor 수와 nonexistent Child(int)를 별도 assertion으로 만듭니다." },
          { lines: "29-31", explanation: "final modifier까지 출력해 외부 subclassing surface를 고정합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11"], command: isolatedJavaRun("InheritanceShape.java", "InheritanceShape") },
        output: { value: "superclass=Parent\ninheritedFieldOwner=Parent\nchildDeclaredConstructors=1\nchildHasIntConstructor=false\nchildFinal=true", explanation: ["Child의 direct superclass는 Parent입니다.", "Child lookup으로 찾은 shared는 Parent가 선언한 field입니다.", "Parent(int)는 Child에 inherited되지 않아 Child constructor는 no-arg 하나뿐입니다.", "final Child는 더 아래 subclass를 허용하지 않습니다."] },
        experiments: [
          { change: "Child에 public Child(int seed){super(seed);}를 추가합니다.", prediction: "declaredConstructors2와 childHasIntConstructortrue가 됩니다.", result: "constructor surface는 Child가 직접 선언할 때만 넓어집니다." },
          { change: "Child에 public int shared를 다시 선언합니다.", prediction: "getField(shared)의 owner가 Child로 바뀌고 Parent field도 superclass에 별도로 남습니다.", result: "structure test가 field hiding drift를 잡습니다." },
          { change: "Child의 final을 제거합니다.", prediction: "childFinalfalse가 되어 subclassing surface가 열립니다.", result: "API 확장 가능성도 modifier contract로 검토할 수 있습니다." },
        ],
        sourceRefs: ["java-class04-ex23", "java-class04-ex24", "java-class-get-superclass", "java-reflection-field", "java-reflection-constructor", "java-reflection-modifier", "jls-binary-superclass", "jls-binary-members", "jls-binary-final", "jls-binary-access", "jls-binary-method-constructors"],
      }],
      diagnostics: [
        { symptom: "runtime output은 그대로인데 library 업데이트 뒤 subclass 구조 test가 실패했다.", likelyCause: "superclass, field owner, constructor signature, modifier 중 하나가 조용히 바뀌었습니다.", checks: ["getSuperclass와 declaringClass를 전후 비교합니다.", "declared constructors/modifiers diff를 봅니다.", "기존 binary와 clean source rebuild를 모두 실행합니다."], fix: "의도된 breaking change면 migration과 major-version policy를 제공하고 아니면 원래 structural contract를 복원합니다.", prevention: "공개 hierarchy는 behavior와 reflection/linkage contract를 CI에서 함께 검증합니다." },
        { symptom: "Parent에 field를 추가한 뒤 Child가 예상하지 못한 field를 읽는다.", likelyCause: "기존 Child 동명 field 또는 simple-name lookup과 새 Parent declaration이 충돌했습니다.", checks: ["class별 declared fields를 나눠 봅니다.", "qualifier declared type과 source rebuild 결과를 확인합니다.", "serialization/mapping field owner도 검사합니다."], fix: "동명 mutable fields를 제거하고 private state+methods로 migration합니다.", prevention: "public/protected field 추가는 subclass source corpus와 framework integration tests를 포함해 호환성 검토합니다." },
      ],
      expertNotes: ["reflection contract는 implementation detail에 과결합할 수 있으므로 public/protected extension surface처럼 실제 호환성 약속만 고정합니다."],
    },
    {
      id: "negative-compiler-contract-suite",
      title: "private access·missing super·late super·missing Child overload·final 상속 실패를 diagnostic code와 line으로 고정합니다",
      lead: "실패 예제는 주석 처리해 두지 않고 production build와 분리된 compiler task에서 반드시 실패하는지 검사합니다.",
      explanations: [
        "expected-fail source를 정상 session source와 함께 javac에 넘기면 전체 build를 깨뜨리므로 JavaCompiler API로 fixture마다 독립 task를 만듭니다. 각 task는 서로 다른 explicit -d directory를 사용합니다.",
        "parent-private fixture는 superclass private storage가 Child object에 없어서가 아니라 Child source의 direct name access가 허용되지 않아 compiler.err.report.access를 냅니다.",
        "missing-super-noarg fixture는 Child()에 explicit invocation이 없어 implicit super()가 Parent(int)에 적용될 수 없음을 compiler.err.cant.apply.symbol로 확인합니다.",
        "late-super fixture는 Java 21에서 super(args)가 constructor body의 first statement여야 함을 검사합니다. compiler diagnostic code는 OpenJDK implementation contract이므로 JDK 21.0.11에 pin하고 JLS portable rule과 구분합니다.",
        "missing-child-int fixture는 Parent(int)가 있어도 Child(int)가 자동으로 생기지 않음을 보여 줍니다. error가 new Child(1) line에 생기는지까지 확인해 parent call failure와 혼동하지 않습니다.",
        "extend-final fixture는 final class 아래에 subclass를 선언할 수 없음을 검사합니다. error count를 정확히1로 고정해 예상하지 못한 parser·classpath failure가 목표 diagnostic을 대신 통과시키지 못하게 합니다.",
      ],
      concepts: [
        { term: "negative compiler contract", definition: "의도적으로 잘못된 source가 지정 compiler/version에서 예상 위치·code로 실패하는지 확인하는 test입니다.", detail: ["실패 자체가 성공 조건입니다.", "error count와 explicit -d도 검증합니다."] },
        { term: "diagnostic code", definition: "OpenJDK compiler가 error 종류에 부여하는 machine-readable identifier입니다.", detail: ["message text보다 locale에 덜 민감합니다.", "Java language specification의 portable API는 아니므로 version pin이 필요합니다."] },
        { term: "isolated compiler output", definition: "fixture별 GUID temp child와 classes directory에 compiler artifact를 제한하는 실행 방식입니다.", detail: ["저장소에 partial .class가 남지 않습니다.", "cleanup 전 resolved-parent boundary를 확인합니다."] },
      ],
      codeExamples: [{
        id: "inheritance-negative-compiler-suite",
        title: "상속 경계 다섯 가지가 정확히 한 error로 실패하는지 in-process compile합니다",
        language: "java",
        filename: "NegativeInheritanceContracts.java",
        purpose: "설명만으로 지나치기 쉬운 constructor/access/final 규칙을 JDK21 회귀 계약으로 만듭니다.",
        code: String.raw`import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;

public class NegativeInheritanceContracts {
    record Fixture(String name, String source, long line, String code) {}

    static final class MemorySource extends SimpleJavaFileObject {
        private final String source;

        MemorySource(String name, String source) {
            super(URI.create("string:///" + name + ".java"), Kind.SOURCE);
            this.source = source;
        }

        @Override public CharSequence getCharContent(boolean ignoreEncodingErrors) {
            return source;
        }
    }

    public static void main(String[] args) throws Exception {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) throw new IllegalStateException("JDK required");
        Path base = Path.of(System.getProperty("java.io.tmpdir"))
                .toAbsolutePath().normalize();
        Path root = base.resolve("oop06-negative-" + UUID.randomUUID()).normalize();
        if (!root.getParent().equals(base) || Files.exists(root)) {
            throw new IllegalStateException("unsafe temp root");
        }
        Files.createDirectory(root);

        List<Fixture> fixtures = List.of(
                new Fixture("parent-private",
                        "class Parent { private int secret; }\n"
                        + "class Child extends Parent { int read() { return secret; } }\n",
                        2, "compiler.err.report.access"),
                new Fixture("missing-super-noarg",
                        "class Parent { Parent(int n) {} }\n"
                        + "class Child extends Parent { Child() {} }\n",
                        2, "compiler.err.cant.apply.symbol"),
                new Fixture("late-super",
                        "class Parent { Parent(int n) {} }\n"
                        + "class Child extends Parent { Child() { int x = 0; super(1); } }\n",
                        2, "compiler.err.call.must.be.first.stmt.in.ctor"),
                new Fixture("missing-child-int",
                        "class Parent { Parent(int n) {} }\n"
                        + "class Child extends Parent { Child() { super(1); } }\n"
                        + "class Use { Child child = new Child(1); }\n",
                        3, "compiler.err.cant.apply.symbol"),
                new Fixture("extend-final",
                        "final class Parent {}\n"
                        + "class Child extends Parent {}\n",
                        2, "compiler.err.cant.inherit.from.final")
        );

        try {
            for (int index = 0; index < fixtures.size(); index++) {
                Fixture fixture = fixtures.get(index);
                Path classes = root.resolve("classes-" + index);
                Files.createDirectory(classes);
                DiagnosticCollector<JavaFileObject> diagnostics =
                        new DiagnosticCollector<>();
                String sourceName = fixture.name().replace('-', '_');
                try (StandardJavaFileManager manager = compiler.getStandardFileManager(
                        diagnostics, Locale.ROOT, java.nio.charset.StandardCharsets.UTF_8)) {
                    List<String> options = List.of("--release", "21", "-proc:none",
                            "-Xlint:all", "-XDrawDiagnostics", "-d", classes.toString());
                    boolean compiled = Boolean.TRUE.equals(compiler.getTask(null, manager,
                            diagnostics, options, null,
                            List.of(new MemorySource(sourceName, fixture.source()))).call());
                    List<Diagnostic<? extends JavaFileObject>> errors = diagnostics
                            .getDiagnostics().stream()
                            .filter(item -> item.getKind() == Diagnostic.Kind.ERROR)
                            .toList();
                    if (compiled || diagnostics.getDiagnostics().size() != 1
                            || errors.size() != 1
                            || errors.get(0).getLineNumber() != fixture.line()
                            || !errors.get(0).getCode().equals(fixture.code())) {
                        throw new AssertionError(fixture.name() + " diagnostic drift: "
                                + diagnostics.getDiagnostics());
                    }
                    System.out.println(fixture.name() + "=" + errors.get(0).getCode()
                            + "@" + errors.get(0).getLineNumber());
                }
            }
        } finally {
            deleteDirectChild(base, root);
        }
    }

    static void deleteDirectChild(Path base, Path root) throws IOException {
        Path resolved = root.toAbsolutePath().normalize();
        if (!resolved.getParent().equals(base)) {
            throw new IOException("unsafe cleanup");
        }
        if (Files.exists(resolved)) {
            try (var paths = Files.walk(resolved)) {
                for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) {
                    Files.deleteIfExists(path);
                }
            }
        }
        if (Files.exists(resolved)) throw new IOException("cleanup failed");
    }
}`,
        walkthrough: [
          { lines: "1-30", explanation: "in-memory source와 structured DiagnosticCollector를 정의해 message text 대신 code·line을 읽습니다." },
          { lines: "32-42", explanation: "JDK compiler 존재와 normalized OS temp direct-child invariant를 확인하고 GUID root를 create-new합니다." },
          { lines: "44-65", explanation: "각 fixture source와 1-based expected line·OpenJDK21 code를 함께 선언합니다." },
          { lines: "68-96", explanation: "fixture별 classes directory, explicit release/proc/lint/draw diagnostics options로 compile하고 exactly-one-error contract를 검사합니다." },
          { lines: "101-115", explanation: "finally에서 resolved root의 parent가 base인지 다시 확인하고 reverse order로 그 direct child만 제거합니다." },
        ],
        run: { environment: ["PowerShell 7+", "OpenJDK 21.0.11 full JDK"], command: isolatedJavaRun("NegativeInheritanceContracts.java", "NegativeInheritanceContracts") },
        output: { value: "parent-private=compiler.err.report.access@2\nmissing-super-noarg=compiler.err.cant.apply.symbol@2\nlate-super=compiler.err.call.must.be.first.stmt.in.ctor@2\nmissing-child-int=compiler.err.cant.apply.symbol@3\nextend-final=compiler.err.cant.inherit.from.final@2", explanation: ["private parent field direct access는 line2 access error 하나입니다.", "implicit Parent()과 nonexistent Child(int)는 둘 다 applicability error지만 실패 source line이 다릅니다.", "late super는 Java21 first-statement rule을 별도 code로 확인합니다.", "final superclass 아래 subclass declaration은 line2에서 거부됩니다."] },
        experiments: [
          { change: "parent-private의 secret을 protected로 바꿉니다.", prediction: "같은 package fixture는 성공해 negative contract가 실패합니다.", result: "access modifier 변화가 compile surface를 실제로 넓혔음을 감지합니다." },
          { change: "missing-super-noarg Child()에 super(1)을 추가합니다.", prediction: "fixture가 compile되어 expected-fail assertion이 실패합니다.", result: "명시적 applicable Parent constructor가 chain을 복구합니다." },
          { change: "harness에서 -d option을 제거합니다.", prediction: "diagnostic은 같을 수 있지만 partial class artifact 위치를 통제하지 못합니다.", result: "실패 semantics뿐 아니라 artifact isolation도 test contract입니다." },
        ],
        sourceRefs: ["jdk21-javac", "jls-access-control", "jls-constructor-body", "jls-final-class", "java-compiler-api", "java-diagnostic-api", "java-files-api", "java-uuid-api"],
      }],
      diagnostics: [
        { symptom: "negative suite가 실패했지만 expected error를 확인하지 않고 성공으로 처리했다.", likelyCause: "compiled=false만 보고 parser error·classpath error·목표 semantic error를 구분하지 않았습니다.", checks: ["Diagnostic.Kind.ERROR 개수를 확인합니다.", "1-based line과 machine code를 비교합니다.", "unexpected warnings까지 전체 diagnostic count로 잡습니다."], fix: "exactly one error·expected line·expected code를 모두 assert합니다.", prevention: "fixture record에 source와 expectation을 함께 두고 JDK version을 pin합니다." },
        { symptom: "expected-fail 실행 뒤 저장소에 Parent.class나 Child.class가 남았다.", likelyCause: "javac/JavaCompiler에 explicit -d를 주지 않았거나 cleanup root 경계를 검증하지 않았습니다.", checks: ["compiler options에 -d가 있는지 봅니다.", "fixture별 output path가 temp root 아래인지 확인합니다.", "실행 뒤 rg --files로 .class residue를 검사합니다."], fix: "OS temp direct GUID child 아래 fixture별 classes를 만들고 finally에서 guarded cleanup합니다.", prevention: "모든 positive/negative compilation helper에 output isolation과 post-delete assertion을 공통화합니다." },
      ],
      expertNotes: ["Diagnostic code는 OpenJDK regression aid이며 JLS가 표준화한 portable 문자열이 아닙니다. 다른 vendor/JDK로 올릴 때 semantic rule을 유지한 채 pinned code expectation을 재감사합니다."],
    },
  ],
  lab: {
    title: "레거시 자산 hierarchy를 단일 상태·명시적 constructor chain·composition 경계로 재설계합니다",
    scenario: "LegacyAsset은 public/protected fields를 여러 subclass가 같은 이름으로 다시 선언하고, 각 constructor가 다른 default와 side effect를 수행합니다. caller는 Asset view와 subtype view에서 서로 다른 status를 읽고, parent no-arg 제거 뒤 일부 subclasses가 compile되지 않으며, 원격 재시도 기능 때문에 unrelated subtype까지 거대한 base class에 묶여 있습니다. 목표는 실제 is-a 관계만 남기고 한 truth source, 검증된 superclass state, 예측 가능한 initialization, 실패 원자성, 구조·행동 compiler contracts를 갖춘 모델로 바꾸는 것입니다.",
    setup: [
      "OpenJDK 21.0.11과 PowerShell 7+를 준비하고 모든 javac에 -encoding UTF-8 --release 21 -proc:none -Xlint:all -d <isolated-classes>를 사용합니다.",
      "작업 root는 OS temp의 새 GUID direct child로 만들고, 정상·negative compile output을 서로 다른 directories에 둡니다.",
      "합성 package asset.core에는 abstract가 아닌 최소 BaseAsset, asset.local에는 LocalAsset, retry 역할에는 RetryPolicy interface를 준비합니다.",
      "기존 test에서 construction entry, output, exception type, public/protected surface, reflection shape를 먼저 golden으로 기록합니다.",
      "실제 개인 경로·사용자명·서버 주소는 사용하지 않고 A-001·job-7·example.test 같은 synthetic data만 씁니다.",
    ],
    steps: [
      "Legacy Parent/Child별 declared fields를 표로 만들고 동명 id·status가 hidden duplicate인지 inherited single field인지 declaring class까지 확인합니다.",
      "BaseAsset의 id와 status를 private로 모으고 protected BaseAsset(String id)에서 blank id를 거부한 뒤 final query methods로 읽게 합니다.",
      "LocalAsset(String id, long size)은 super(id)를 첫 statement로 호출하고 음수 size를 거부합니다. no-arg path가 필요하면 의미 있는 default를 선택한 this(args) delegation으로 canonical constructor에 연결합니다.",
      "constructor마다 outgoing this/super edge를 그려 cycle이 없고 모든 public entry가 BaseAsset validation과 subtype validation을 정확히 한 번 통과하는지 확인합니다.",
      "BaseAsset field initializer·block·constructor, LocalAsset field initializer·block·constructor에 marker를 넣어 superclass-first와 class별 textual order를 exact trace로 고정합니다.",
      "BaseAsset constructor와 initializer에서 overridable method·listener registration·thread start·registry publish를 제거하고 완성 후 activate() 단계로 옮깁니다.",
      "원격 재시도는 Asset superclass 기능이 아니라 RetryPolicy collaborator로 추출하고 필요한 RemoteLoader가 composition으로 주입받게 합니다.",
      "Parent-typed view와 Child-typed view로 같은 object를 검사하되 public hidden fields를 모두 제거하고 status() method가 일관된 값을 반환하도록 합니다.",
      "실패 주입 test에서 Base validation failure 뒤 Child body count0, registry size0, resource open count0을 확인합니다.",
      "reflection test로 direct superclass, declared constructor signatures, field declaring class, final/private modifiers를 고정합니다.",
      "negative compiler suite로 private field direct access, missing Parent(), late super, nonexistent Child overload, final subclass 시도를 fixture별 exactly-one-error로 검증합니다.",
      "clean process에서 모든 exact outputs를 비교하고 temp cleanup 뒤 workspace에 .class·개인 literal·절대 경로가 남지 않았는지 검사합니다.",
    ],
    expectedResult: [
      "각 의미의 state는 한 field declaration만 가지며 Parent/Child view가 hidden duplicate로 갈라지지 않습니다.",
      "모든 LocalAsset public construction path가 BaseAsset validated constructor를 거치고 invalid input은 reference나 외부 side effect를 남기지 않습니다.",
      "초기화 trace는 Base field→Base block→Base body→Local field→Local block→Local body 순서를 재현합니다.",
      "RemoteLoader는 RetryPolicy를 has-a로 사용하며 BaseAsset subtype이라는 거짓 관계를 만들지 않습니다.",
      "구조 test는 superclass·field owner·constructor surface·modifier를, behavior test는 identity·state·exception·trace를 각각 검증합니다.",
      "다섯 negative fixtures는 JDK21.0.11 expected code/line에서만 성공 판정을 받고 partial .class를 저장소에 남기지 않습니다.",
    ],
    cleanup: [
      "resolved audit root의 parent가 normalized OS temp base와 같은지 검사한 뒤 그 GUID root만 reverse-order 삭제합니다.",
      "test static counters와 registries를 case별 새 JVM 또는 explicit reset으로 격리합니다.",
      "rg --files로 product tree의 .class, temporary verifier, raw source copy가 남지 않았음을 확인합니다.",
    ],
    extensions: [
      "BaseAsset을 외부 subclass에 열지 결정하고 final, sealed hierarchy, documented protected extension point 세 대안을 비교합니다.",
      "Parent library v1/v2를 따로 compile해 constructor 삭제·field 추가·superclass 변경의 source/binary/semantic compatibility matrix를 만듭니다.",
      "JUnit parameterized test로 모든 public constructors의 valid/invalid inputs와 common postconditions를 자동 생성합니다.",
      "constructor 밖 factory가 resource acquisition과 registry publication을 수행하도록 바꾸고 중간 실패 compensation test를 추가합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "Parent의 code·version과 Child의 code·version을 hidden fields 없이 구현하고 constructor/field lookup trace를 재현합니다.",
      requirements: ["Parent(String code)은 blank를 거부하고 private final code를 대입합니다.", "Child(String code,int version)는 super(code)를 먼저 호출하고 version>=1을 검증합니다.", "Parent view==Child identity, runtime class, inherited getter 값을 출력합니다.", "Parent/Child field·block·body에 markers를 넣어 exact order를 assertion합니다.", "isolated -d compile과 guarded temp cleanup을 사용합니다."],
      hints: ["field initializer marker는 값을 반환해야 field 대입과 출력이 함께 됩니다.", "Parent view는 새 object 생성이 아니라 같은 Child reference의 upcast입니다.", "개인값 대신 C-1·version2 같은 synthetic input을 씁니다."],
      expectedOutcome: "same=true와 runtime=Child가 나오고 Parent의 세 initialization events 뒤 Child의 세 events가 나오며 warning 없이 compile됩니다.",
      solutionOutline: ["trace helper와 private final fields를 선언합니다.", "Child constructor에 explicit super(code)를 둡니다.", "main에서 하나의 new와 두 views를 만듭니다.", "expected output 전체를 exact compare합니다."],
    },
    {
      difficulty: "응용",
      prompt: "동명 quota fields와 inaccessible Parent() 때문에 깨지는 hierarchy를 canonical constructor와 behavior API로 교정합니다.",
      requirements: ["before version에서 Parent-typed field와 Child-typed field가 다른 값을 내는 failing contract를 재현합니다.", "after version은 Parent의 private quota 하나와 protected final changeQuota operation만 사용합니다.", "Parent에는 Parent(int quota)만 두고 Child의 모든 public constructors를 this→super chain으로 연결합니다.", "invalid quota에서 Parent/Child body counters와 registry가 변하지 않는지 검사합니다.", "reflection으로 Child에 동명 declared field가0인지 확인합니다."],
      hints: ["field hiding을 override로 고칠 수는 없습니다.", "validation을 counter나 registry update보다 먼저 둡니다.", "getDeclaredFields와 Field.getDeclaringClass를 나눠 사용합니다."],
      expectedOutcome: "어떤 reference view에서도 quota query가 같은 값을 반환하고 모든 constructor가 한 Parent validation 경로를 지나며 실패 side effect가0입니다.",
      solutionOutline: ["hidden fields를 제거하고 Parent behavior를 캡슐화합니다.", "Child canonical constructor가 super(validatedInput)를 호출하게 합니다.", "다른 Child paths는 this(args)로 위임합니다.", "behavioral·structural·failure tests를 분리합니다."],
    },
    {
      difficulty: "설계",
      prompt: "학습 플랫폼의 ContentItem hierarchy와 Cache·Retry 기능을 inheritance/composition으로 분류하고 공개 extension 계약을 설계합니다.",
      requirements: ["VideoItem·QuizItem이 정말 ContentItem의 모든 계약을 지키는지 pre/postcondition table을 만듭니다.", "Cache와 Retry를 has-a roles로 분리하고 constructor injection 및 null policy를 정합니다.", "ContentItem constructor에서 overridable call과 this escape가 없음을 구조 review로 증명합니다.", "외부 subclass 허용 여부를 final·sealed·open 중 선택하고 compatibility rationale를 씁니다.", "JDK21 positive examples, five negative compiler fixtures, reflection shape, failure-injection suite를 제공합니다.", "source/binary/semantic compatibility를 구분한 v2 migration plan을 작성합니다."],
      hints: ["‘재사용하고 싶다’ 대신 Parent caller가 Child를 받았을 때 유지해야 하는 의미를 씁니다.", "extension point는 protected mutable field보다 좁은 method contract가 안전합니다.", "constructor success output만 보지 말고 실패 전후 external state를 비교합니다."],
      expectedOutcome: "진짜 subtype만 inheritance에 남고 Cache·Retry는 교체 가능한 collaborators가 되며 hierarchy 진화를 CI 계약으로 판단할 수 있는 설계 문서와 실행 suite가 완성됩니다.",
      solutionOutline: ["behavioral substitutability matrix를 먼저 만듭니다.", "state ownership과 construction graph를 그립니다.", "composition ports와 lifecycle을 정의합니다.", "positive/negative/structural/failure tests를 구현합니다.", "호환성 정책과 공개 extension surface를 문서화합니다."],
    },
  ],
  reviewQuestions: [
    { question: "new Child()은 Parent object와 Child object를 각각 하나씩 만드나요?", answer: "아닙니다. Child instance 하나를 만들고 그 instance가 superclass가 선언한 instance state도 포함합니다. Parent view는 그 같은 reference의 declared type을 넓힌 것이며 새 allocation이 아닙니다." },
    { question: "원본 constructor와 main이 같은 Type@hex를 출력하면 실제 메모리 주소가 같다는 증명인가요?", answer: "같은 default rendering token이라는 보조 증거일 뿐입니다. Object.toString suffix는 memory address 계약이 아니며 reference identity는 ==로 직접 검사해야 합니다." },
    { question: "Child object에 Parent private field가 존재하나요?", answer: "superclass state의 일부로 존재합니다. 다만 Child source는 그 private declaration을 직접 이름으로 접근할 수 없고 Parent가 제공한 operation을 통해서만 정상적으로 다룹니다." },
    { question: "member가 상속된다는 말과 접근 가능하다는 말은 왜 구분해야 하나요?", answer: "member lookup/inheritance 관계와 특정 source 위치의 access modifier·package·qualifier permission은 별도 규칙이기 때문입니다. 객체에 storage가 존재하는지도 다시 별도 질문입니다." },
    { question: "local name, this.name, super.name은 무엇을 선택하나요?", answer: "simple local name은 lexical local/parameter를 우선하고, this.name은 current class에서 보이는 field, super.name은 direct superclass 쪽 declaration을 선택합니다." },
    { question: "Child가 Parent field와 같은 이름을 선언하면 override인가요?", answer: "아닙니다. field hiding이며 두 storage가 동시에 존재합니다. method override처럼 runtime dispatch되지 않고 qualifier의 compile-time type과 this/super 형태가 선택을 정합니다." },
    { question: "Child가 field를 재선언하지 않았을 때 this.shared와 super.shared는 왜 같나요?", answer: "Parent가 선언한 inherited field 하나를 서로 다른 lookup form으로 읽기 때문입니다. 두 fields가 자동 동기화된 것이 아닙니다." },
    { question: "Parent p = new Child()에서 p.field와 p.method()는 어떻게 다르나요?", answer: "p.field는 compile-time Parent type으로 Parent field를 선택합니다. p.method()는 signature를 compile-time에 확인한 뒤 runtime Child override implementation으로 dispatch될 수 있습니다." },
    { question: "super는 Parent object reference인가요?", answer: "아닙니다. current object를 유지하면서 superclass member 또는 constructor 선택을 지정하는 제한된 표현이며 일반 변수에 저장할 수 없습니다." },
    { question: "Parent(int)가 있으면 Child(int)도 자동으로 생기나요?", answer: "아닙니다. constructors는 상속되지 않습니다. Child가 Child(int)를 직접 선언하고 필요한 super(int)를 연결해야 new Child(1)이 가능합니다." },
    { question: "Child constructor에 this나 super가 없으면 무엇이 일어나나요?", answer: "compiler가 implicit super()를 넣은 것처럼 처리합니다. direct Parent의 accessible no-arg constructor가 없으면 compile 실패합니다." },
    { question: "this(args)와 super(args)를 같은 constructor에 둘 수 있나요?", answer: "한 constructor는 둘 중 하나의 explicit constructor invocation만 첫 statement로 가질 수 있습니다. this chain의 target이 결국 superclass constructor를 호출합니다." },
    { question: "Ex24_Cat()은 Ex24_Cat(int)를 실행하나요?", answer: "아닙니다. 원본 no-arg의 edge는 this(String,int)이고 그 target이 super(String,int)를 부릅니다. int constructor는 new Ex24_Cat(int)로 직접 선택할 때만 실행됩니다." },
    { question: "Ex23 private no-arg constructor는 Child construction을 ‘보안’으로 만들어 주나요?", answer: "Child source의 그 invocation path를 막을 뿐입니다. 다른 public constructor가 invalid state를 허용하거나 arguments를 저장하지 않으면 invariant는 여전히 깨질 수 있습니다." },
    { question: "Ex23 public two-arg constructor의 중요한 모델 결함은 무엇인가요?", answer: "parameters를 fields에 대입하지 않습니다. constructor chain이 compile되고 marker가 나와도 input을 보존하는 state postcondition은 성립하지 않습니다." },
    { question: "new Child의 Parent field initializer와 Child field initializer 중 무엇이 먼저인가요?", answer: "Parent 단계가 먼저입니다. Parent의 field/block/body가 정상 완료된 뒤 Child field/block/body가 실행됩니다." },
    { question: "같은 class의 field initializer와 initializer block 순서는 어떻게 정하나요?", answer: "source textual order입니다. 다만 constructor body는 그 class의 instance initializers 뒤이고 superclass 단계는 class 경계 앞에서 먼저 완료됩니다." },
    { question: "Parent constructor에서 overridable method를 부르면 왜 위험한가요?", answer: "runtime Child override가 호출될 수 있지만 Child fields는 아직 explicit initializer를 거치지 않아 default values일 수 있기 때문입니다." },
    { question: "super constructor가 exception을 던지면 Child body는 실행되나요?", answer: "아닙니다. super invocation이 abrupt completion하면 나머지 Child construction이 중단되고 new는 정상 reference를 반환하지 않습니다." },
    { question: "constructor 실패 시 이미 기록한 log·counter·registry도 자동 rollback되나요?", answer: "아닙니다. 실패 이전 외부 side effect는 남을 수 있으므로 validation-first, factory staging, compensation, resource scope가 필요합니다." },
    { question: "is-a를 어떻게 검증하나요?", answer: "Parent가 허용한 정상 입력과 postcondition·invariant를 Child도 깨지 않는지 Parent-typed contract suite로 검사합니다. 단순한 명사 문장이나 코드 재사용량만으로는 부족합니다." },
    { question: "상속보다 composition을 선택할 신호는 무엇인가요?", answer: "일부 기능만 필요하거나 Parent operations를 무력화해야 하고 collaborator 교체·독립 lifetime·독립 테스트가 중요할 때 has-a composition이 더 자연스럽습니다." },
    { question: "reflection에서 Child.class.getField가 반환한 field가 Parent 선언인지 어떻게 아나요?", answer: "Field.getDeclaringClass()를 확인합니다. lookup을 Child에서 시작했어도 실제 declaration owner는 Parent일 수 있습니다." },
    { question: "constructor non-inheritance를 reflection으로 어떻게 확인하나요?", answer: "Child.class.getDeclaredConstructors()와 getDeclaredConstructor(parameterTypes)를 검사합니다. Parent constructor는 Child declared 목록에 나타나지 않습니다." },
    { question: "source compatibility, binary compatibility, semantic compatibility는 같은가요?", answer: "아닙니다. 새 source가 compile되는지, 기존 binary가 linkage되는지, 동작 의미가 유지되는지는 서로 다른 단계이며 공개 base class 변경은 셋을 모두 검토해야 합니다." },
    { question: "negative compiler fixture에서 compiled=false만 보면 왜 부족한가요?", answer: "목표 semantic error가 아니라 parser·classpath·파일명 오류로 실패했을 수 있습니다. error count, expected line, diagnostic code를 함께 확인해야 합니다." },
    { question: "compiler diagnostic code는 모든 JDK가 보장하나요?", answer: "아닙니다. JLS가 표준화한 portable text/code가 아니라 OpenJDK implementation regression aid이므로 JDK21.0.11에 pin하고 version 변경 때 재감사합니다." },
    { question: "상속 세션을 완료했다는 최소 증거 묶음은 무엇인가요?", answer: "원본 package/scoped audit, identity-safe output, field lookup matrix, constructor/initialization traces, method-field boundary, failure injection, reflection shape, exact negative diagnostics, provenance와 artifact cleanup이 함께 있어야 합니다." },
  ],
  completionChecklist: [
    "extends를 단순 코드 재사용이 아니라 is-a/substitutability 계약으로 설명했다.",
    "new Child가 한 instance를 만들며 superclass state를 포함한다는 모델을 별도 Parent object 오해와 구분했다.",
    "upcast가 reference 복사이지 allocation·object 변환이 아님을 ==와 getClass로 검증했다.",
    "Object.toString Type@hex suffix를 메모리 주소라고 부르지 않고 identity hash를 공개 output에서 제거했다.",
    "local/simple name, this.field, super.field lookup을 각각 설명하고 exact output으로 확인했다.",
    "숨겨지지 않은 inherited field는 this와 super가 같은 declaration을 읽음을 declaring class 관점에서 설명했다.",
    "field hiding이 두 storage를 만들고 compile-time qualifier로 선택됨을 method override와 구분했다.",
    "Parent private state의 존재와 Child source direct accessibility를 분리했다.",
    "package-private와 protected cross-package qualifier 제약을 subclass 여부만으로 단순화하지 않았다.",
    "own private field access와 parent private field access 실패를 declaring class 기준으로 설명했다.",
    "constructors가 inherited·overridden되지 않음을 구조/compile contract로 검증했다.",
    "implicit super()의 정확한 조건과 inaccessible/nonexistent Parent() 실패를 다뤘다.",
    "this(args)와 super(args)의 JDK21 first-statement·single-edge·no-cycle 규칙을 설명했다.",
    "Ex24 no-arg가 this(String,int)→super(String,int)이며 int path를 지나지 않음을 실행했다.",
    "Ex23 public two-arg constructor의 parameterAssignments0 모델 결함을 숨기지 않았다.",
    "allocation default values와 Parent field/block/body→Child field/block/body 순서를 구분했다.",
    "constructor의 overridable call이 미초기화 Child state를 관찰하는 위험을 설명했다.",
    "field compile-time selection과 instance method runtime dispatch를 한 receiver에서 비교했다.",
    "super.method가 별도 object가 아니라 current object의 Parent implementation 선택임을 설명했다.",
    "상속과 composition의 선택 기준·비용·반례를 비교했다.",
    "constructor 실패에서 Child body non-execution과 Parent side effect 잔존을 함께 검사했다.",
    "this escape·failure atomicity·factory staging의 유지보수/동시성 위험을 연결했다.",
    "reflection으로 superclass·field owner·declared constructor·final modifier를 검증했다.",
    "공개 base class의 source·binary·semantic compatibility를 서로 다른 계약으로 다뤘다.",
    "negative fixtures를 production source에서 분리하고 fixture별 explicit -d를 사용했다.",
    "private access, missing Parent(), late super, missing Child(int), extend final 다섯 실패를 exact code·line으로 고정했다.",
    "negative compile이 exactly one error인지 확인해 우연한 실패를 성공으로 처리하지 않았다.",
    "원본 class04 전체26과 범위6을 서로 다른 classes directories에서 compile했다.",
    "전체 package warning1의 범위 밖 source와 scope6 warning0을 구분했다.",
    "범위6의 main2·compile-only4 역할과 Ex07 21행·Ex25 2행을 실제 source/run에서 검증했다.",
    "Ex07 개인 문자열·수치와 Type@hex를 raw 공개하지 않고 count·unique·equality·type booleans로 정규화했다.",
    "Ex23·24 constructor visibility·assignment·delegation shape를 source에서 동적으로 검사했다.",
    "모든 public Java example command가 OS temp GUID direct child와 explicit classes directory를 사용했다.",
    "모든 compile에 UTF-8, --release21, -proc:none, -Xlint:all을 적용하고 compiler output0 또는 pinned expected diagnostics를 요구했다.",
    "cleanup 전에 normalized resolved target의 parent boundary를 확인하고 direct child만 제거했다.",
    "공개 code·output·evidence에 credential·실제 개인 literal·identity hash·로컬 절대 경로가 없음을 확인했다.",
    "원본 여섯 파일, JLS SE21, Java SE21 APIs, OpenJDK21 compiler 출처의 사용 범위를 구분했다.",
  ],
  nextSessions: ["oop-07-polymorphism"],
  sources: [
    { id: "java-class04-ex05", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex05_Sub.java", usedFor: ["subclass extends declaration", "local/this/super field lookup", "hidden child fields", "own private field", "inherited single field"], evidence: "Child가 Parent를 extends하고 local·this·super name, hidden ages, inherited address, child-only height, own-private weight를 출력하며 parent private field direct access는 commented-out임을 읽었습니다. 개인 literals는 공개하지 않았습니다." },
    { id: "java-class04-ex06", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex06_Sup.java", usedFor: ["superclass fields", "private parent state", "static member contrast", "parent constructor rendering"], evidence: "Parent가 package-private fields, private field, static field와 no-arg constructor를 선언하며 constructor가 current Child runtime rendering을 출력함을 확인했습니다. raw 개인 values/hash는 정규화했습니다." },
    { id: "java-class04-ex07", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex07_Main.java", usedFor: ["single Child allocation", "same rendered reference", "play lookup execution", "21-line privacy-safe golden"], evidence: "new가 한 번이고 constructor2·main1의 Type@hex token이 같으며 play 포함 총21행·blank5임을 실행했습니다. token은 equality/type booleans로만 보존했습니다." },
    { id: "java-class04-ex23", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex23_Animal.java", usedFor: ["private parent no-arg", "public two-arg parent constructor", "missing parameter assignments"], evidence: "private no-arg와 public String,int constructors가 있고 public body의 this.name/this.age assignments가0회임을 source shape로 확인했습니다." },
    { id: "java-class04-ex24", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex24_Cat.java", usedFor: ["three child constructors", "this delegation", "explicit super calls", "distinct construction paths"], evidence: "public constructors3, explicit this calls1, explicit super calls2이며 no-arg edge가 String,int target으로 향하고 int constructor는 그 path에 포함되지 않음을 확인했습니다." },
    { id: "java-class04-ex25", repository: "javastudy2/classstudy", path: "src/com/java/class04/Ex25_Main.java", usedFor: ["original no-arg child path", "exact parent-child markers"], evidence: "new Ex24_Cat() 한 번이 정확히 부모 생성자·자식 생성자 두 줄을 출력하며 private-parent/int markers는 나오지 않음을 clean scope run으로 확인했습니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["OpenJDK 21.0.11 compilation", "-Xlint:all", "--release21", "-XDrawDiagnostics", "negative contracts"], evidence: "class04 전체26·scope6·positive examples·negative fixtures의 version-pinned compiler 기준입니다." },
    { id: "jls-superclasses", repository: "JLS SE 21", path: "8.1.4 Superclasses and Subclasses", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.4", usedFor: ["extends relation", "direct superclass", "subclass hierarchy"], evidence: "class declaration의 direct superclass와 subclass 관계를 정의하는 primary specification입니다." },
    { id: "jls-members", repository: "JLS SE 21", path: "8.2 Class Members", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.2", usedFor: ["declared and inherited members", "member set", "inheritance/access distinction"], evidence: "class body declarations와 inherited members의 관계를 구분하는 근거입니다." },
    { id: "jls-field-hiding", repository: "JLS SE 21", path: "8.3 Field Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.3", usedFor: ["field hiding", "two declarations", "compile-time field selection"], evidence: "subclass 동명 field가 superclass field를 hide하며 override가 아닌 근거입니다." },
    { id: "jls-expression-names", repository: "JLS SE 21", path: "6.5.6.1 Simple Expression Names", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.5.6.1", usedFor: ["simple-name lookup", "local/member disambiguation"], evidence: "receiver 없는 expression name이 lexical declarations와 fields에 reclassified되는 근거입니다." },
    { id: "jls-super-access", repository: "JLS SE 21", path: "15.11.2 Accessing Superclass Members using super", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.11.2", usedFor: ["super.field", "super.method", "same current object"], evidence: "super를 사용한 superclass member access가 current instance 문맥에서 lookup을 지정하는 근거입니다." },
    { id: "jls-access-control", repository: "JLS SE 21", path: "6.6 Access Control", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.6", usedFor: ["private/package/protected/public", "constructor accessibility", "direct access failures"], evidence: "declaration/member/constructor 접근 가능성을 source 위치와 modifiers로 판단하는 primary specification입니다." },
    { id: "jls-protected-access", repository: "JLS SE 21", path: "6.6.2 Details on protected Access", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.6.2", usedFor: ["cross-package subclass access", "qualifying type constraint"], evidence: "다른 package subclass에서 protected instance member 접근 시 qualifying expression에 추가되는 제약의 근거입니다." },
    { id: "jls-constructors", repository: "JLS SE 21", path: "8.8 Constructor Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.8", usedFor: ["constructors not inherited", "class-specific construction API", "throws contract"], evidence: "constructor declaration이 class instance 초기화를 담당하고 member method inheritance와 다른 규칙을 갖는 근거입니다." },
    { id: "jls-constructor-body", repository: "JLS SE 21", path: "8.8.7 Constructor Body and 8.8.7.1 Explicit Constructor Invocations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.8.7", usedFor: ["implicit super()", "this/super first statement", "constructor chain", "abrupt completion"], evidence: "Java SE21 constructor body, alternate/super invocation, implicit super와 invocation restrictions의 근거입니다." },
    { id: "jls-default-constructor", repository: "JLS SE 21", path: "8.8.9 Default Constructor", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.8.9", usedFor: ["implicit default constructor", "super invocation requirement", "accessibility"], evidence: "constructor declaration이 전혀 없을 때 compiler가 만드는 default constructor와 superclass call의 근거입니다." },
    { id: "jls-class-instance-creation", repository: "JLS SE 21", path: "12.5 Creation of New Class Instances", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.5", usedFor: ["single Child instance", "superclass-first initialization", "default values", "constructor failure"], evidence: "new instance allocation부터 superclass processing·field/block/body·abrupt completion까지의 primary execution order입니다." },
    { id: "jls-instance-initializers", repository: "JLS SE 21", path: "8.6 Instance Initializers", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.6", usedFor: ["instance initializer blocks", "textual order", "per-instance execution"], evidence: "non-static initializer blocks의 실행과 constructor processing 연결 근거입니다." },
    { id: "jls-field-initialization", repository: "JLS SE 21", path: "8.3.2 Field Initialization", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.3.2", usedFor: ["instance field initializers", "default-to-explicit transition", "textual order"], evidence: "instance field initializer 평가와 forward reference/order semantics의 근거입니다." },
    { id: "jls-overriding", repository: "JLS SE 21", path: "8.4.8.1 Overriding in Subclasses", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8.1", usedFor: ["instance method override", "field hiding contrast", "signature relation"], evidence: "subclass instance method가 superclass method를 override하는 선언 관계 근거입니다." },
    { id: "jls-runtime-method-lookup", repository: "JLS SE 21", path: "15.12.4.4 Locate Method to Invoke", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.4", usedFor: ["runtime receiver dispatch", "Child override execution"], evidence: "compile-time selected instance signature의 implementation을 runtime receiver class에서 찾는 근거입니다." },
    { id: "jls-final-class", repository: "JLS SE 21", path: "8.1.1.2 final Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.1.2", usedFor: ["closed subclassing surface", "extend-final diagnostic", "composition design"], evidence: "final class를 subclass로 확장할 수 없다는 language rule의 근거입니다." },
    { id: "jls-binary-superclass", repository: "JLS SE 21", path: "13.4.4 Superclasses and Superinterfaces", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-13.html#jls-13.4.4", usedFor: ["superclass evolution", "binary compatibility", "direct supertype changes"], evidence: "이미 compile된 binaries에 superclass/superinterface 변경이 미치는 영향의 근거입니다." },
    { id: "jls-binary-members", repository: "JLS SE 21", path: "13.4.8 Field Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-13.html#jls-13.4.8", usedFor: ["field evolution", "hidden field compatibility", "declaring owner drift"], evidence: "field 추가·삭제·변경의 binary 영향과 compile-time constants를 제외한 linkage 검토 근거입니다." },
    { id: "jls-binary-final", repository: "JLS SE 21", path: "13.4.2 final Classes and Interfaces", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-13.html#jls-13.4.2", usedFor: ["adding final to an extensible class", "existing subclass binary failure"], evidence: "기존 subclass가 있는 class를 final로 바꿀 때 발생할 수 있는 binary incompatibility의 직접 근거입니다." },
    { id: "jls-binary-access", repository: "JLS SE 21", path: "13.4.7 Access to Members and Constructors", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-13.html#jls-13.4.7", usedFor: ["constructor access reduction", "existing binary access errors"], evidence: "기존 binary가 접근하던 member 또는 constructor의 접근 수준을 줄이는 변경 위험의 직접 근거입니다." },
    { id: "jls-binary-method-constructors", repository: "JLS SE 21", path: "13.4.12 Method and Constructor Declarations", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-13.html#jls-13.4.12", usedFor: ["constructor deletion", "descriptor evolution", "existing subclass linkage"], evidence: "기존 binary가 참조하는 method 또는 constructor 선언을 삭제하거나 바꿀 때의 linkage 위험을 다루는 직접 근거입니다." },
    { id: "jls-happens-before", repository: "JLS SE 21", path: "17.4.5 Happens-before Order", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5", usedFor: ["this escape", "safe publication", "cross-thread visibility"], evidence: "constructor 중 thread/registry publication 위험을 synchronization ordering 관점에서 보충하는 근거입니다." },
    { id: "jls-final-field-semantics", repository: "JLS SE 21", path: "17.5 final Field Semantics", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.5", usedFor: ["constructor completion freeze", "early this escape caveat", "final-field visibility"], evidence: "final fields의 특별한 initialization visibility와 constructor가 끝나기 전 reference 노출 시 그 추론을 적용할 수 없는 조건의 primary specification입니다." },
    { id: "java-object-tostring", repository: "Java SE 21 API", path: "java.lang.Object.toString", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#toString()", usedFor: ["Type@hex rendering", "identity-hash normalization", "not a memory-address contract"], evidence: "default toString 형식이 class name·@·hashCode hexadecimal 조합이며 memory address API가 아님을 확인했습니다." },
    { id: "jls-getclass", repository: "Java SE 21 API", path: "java.lang.Object.getClass", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#getClass()", usedFor: ["runtime class observation", "Parent view runtime Child"], evidence: "receiver object의 runtime Class를 반환하는 final native method의 API 근거입니다." },
    { id: "java-objects-require-non-null", repository: "Java SE 21 API", path: "java.util.Objects.requireNonNull", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html#requireNonNull(T)", usedFor: ["composition collaborator validation", "constructor injection"], evidence: "합성 has-a 예제에서 null collaborator를 construction boundary에서 거부하는 API 근거입니다." },
    { id: "java-class-get-superclass", repository: "Java SE 21 API", path: "java.lang.Class.getSuperclass", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html#getSuperclass()", usedFor: ["direct superclass structural assertion"], evidence: "compiled Child class의 direct superclass를 reflection으로 확인하는 API입니다." },
    { id: "java-reflection-field", repository: "Java SE 21 API", path: "java.lang.reflect.Field", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Field.html", usedFor: ["field declaring class", "inherited lookup", "hiding drift"], evidence: "Field.getDeclaringClass로 lookup class와 declaration owner를 구분하는 API 근거입니다." },
    { id: "java-reflection-constructor", repository: "Java SE 21 API", path: "java.lang.reflect.Constructor", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Constructor.html", usedFor: ["declared constructor surface", "constructor non-inheritance"], evidence: "Child declared constructors와 parameter signatures를 구조적으로 검사하는 API 근거입니다." },
    { id: "java-reflection-modifier", repository: "Java SE 21 API", path: "java.lang.reflect.Modifier", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Modifier.html", usedFor: ["final/private/public structural assertions"], evidence: "compiled class/member modifier bits를 isFinal 등으로 판정하는 API 근거입니다." },
    { id: "java-compiler-api", repository: "Java SE 21 API", path: "javax.tools.JavaCompiler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/JavaCompiler.html", usedFor: ["in-process expected-fail compilation", "explicit options", "isolated output"], evidence: "negative sources를 정상 build와 분리해 compiler task로 실행하는 official API입니다." },
    { id: "java-diagnostic-api", repository: "Java SE 21 API", path: "javax.tools.Diagnostic", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/Diagnostic.html", usedFor: ["error kind", "line number", "OpenJDK diagnostic code"], evidence: "compiler result를 message parsing이 아닌 structured kind·line·code로 검사하는 API입니다." },
    { id: "java-files-api", repository: "Java SE 21 API", path: "java.nio.file.Files", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["temp directory creation", "reverse-order cleanup", "artifact absence"], evidence: "GUID root와 fixture classes directories를 create-new하고 walk/delete하는 API 근거입니다." },
    { id: "java-uuid-api", repository: "Java SE 21 API", path: "java.util.UUID", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/UUID.html", usedFor: ["collision-resistant temp direct-child name"], evidence: "검증 실행별 OS temp 직계 child의 고유 이름을 만드는 API 근거입니다." },
  ],
  sourceCoverage: {
    filesRead: 6,
    filesUsed: 6,
    uncoveredNotes: [
      "inventory가 지정한 Ex05_Sub·Ex06_Sup·Ex07_Main·Ex23_Animal·Ex24_Cat·Ex25_Main 여섯 files를 active code와 comments까지 모두 읽고 semantic·execution·structural evidence에 사용했습니다.",
      "dependency/warning drift를 잡기 위해 class04 전체26을 package smoke compile하고 범위6을 별도 output directory에서 OpenJDK 21.0.11 -encoding UTF-8 --release21 -proc:none -Xlint:all로 compile했습니다.",
      "전체26은 exit0이고 범위 밖 Ex09_Sub의 compiler.warn.missing.SVUID 하나가 있으며, 범위6은 exit0·warning0입니다. 두 결과를 섞지 않았습니다.",
      "범위6에는 runnable mains Ex07_Main·Ex25_Main 두 개와 compile-only Ex05_Sub·Ex06_Sup·Ex23_Animal·Ex24_Cat 네 개가 있습니다.",
      "Ex07 exact raw output은 21행·blank5이고 constructor/main의 reference tokens3은 같은 Ex05_Sub runtime prefix와 hash를 가집니다. 공개 결과에는 raw hash 대신 count·same/type booleans만 남겼습니다.",
      "Ex07 play의 local/child/parent scope reads3은 unique3, child age 두 reads는 equal이고 parent age는 distinct, inherited address reads3은 모두 equal, child-only height와 own-private weight는 각각 reads2·equal입니다.",
      "실제 이름·주소·나이·신체 수치는 공개 code/output/evidence에 복제하지 않고 array positions·nonblank·unique·equality로만 검증했습니다.",
      "Ex25는 정확히 부모 생성자·자식 생성자 두 줄이며 Ex24 no-arg path가 this(String,int)→super(String,int)라 int constructor body는 실행되지 않습니다.",
      "Ex23 source shape는 private no-arg true, public two-arg true, parameterAssignments0이고 Ex24는 constructors3·explicitThisCalls1·explicitSuperCalls2입니다.",
      "원본의 ‘부모 주소=자식 주소’ 표현은 same Child reference 직관으로 보존하되 Object.toString suffix를 memory address라고 부르지 않고 ==와 getClass fixture로 교정했습니다.",
      "private parent storage·package/protected access·field hiding과 method dispatch·initialization default values·constructor failure·composition·binary compatibility는 원본이 충분히 다루지 않아 JLS SE21과 Java SE21 APIs로 보충했습니다.",
      "negative diagnostics는 language-spec portable text가 아니라 OpenJDK21.0.11 pinned regression contract로 표시하고 exactly-one-error·1-based line·code를 함께 검사했습니다.",
      "모든 JavaCompiler task는 fixture별 explicit -d temp/classes를 사용하고 OS temp direct-child parent invariant와 post-delete assertion으로 partial artifacts를 격리했습니다.",
      "합성 examples에는 P/C/L, C-1, job-7 같은 비개인 test data만 사용하고 credential·실제 host·로컬 절대 경로를 포함하지 않았습니다.",
      "이 세션은 상속과 constructor/field 경계에 집중하며 override의 심화 polymorphic collections·downcast·sealed pattern 처리는 다음 oop-07-polymorphism session으로 연결합니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
