import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["java-09-arrays"],
  slug: "java-09-arrays",
  courseId: "java",
  moduleId: "java-language-control",
  order: 9,
  title: "1차원 배열·참조·복사·정렬·검색",
  subtitle: "고정 길이 연속 index 구조의 default·경계·aliasing을 추적하고 방어 복사·동등성·정렬 전제·검색 결과·복잡도를 검증합니다.",
  level: "중급",
  estimatedMinutes: 520,
  coreQuestion: "배열의 값·배열 객체·원소 객체를 구분해 경계와 공유 상태를 잃지 않고 복사·정렬·검색하는 API를 어떻게 설계할까요?",
  summary: "javastudy day07 Ex08·Ex09·Ex10·Ex11과 day08 Ex01 다섯 원본을 OpenJDK 21.0.11에서 clean compile·run했습니다. Ex08의 `[I@...` 두 행은 실제 메모리 주소가 아니라 배열이 Object.toString을 상속한 비결정 identity 표현이고, Ex09의 int literal 65→char는 representable constant narrowing입니다. Ex11의 166행은 정렬된 0..495에서 binarySearch 55→11, copy padding, fill, primitive·boxed·String sort를 보여 주며 String 순서는 locale 사전순이 아니라 UTF-16 natural order입니다. Ex01은 91번 비교하는 exchange-style O(n²) 정렬입니다. 이를 allocation defaults·null/empty/bounds·aliasing·covariance·traversal·shallow/deep copy·Arrays utility·sort/search precondition·equality/hash/mismatch·방어적 snapshot과 property test로 확장합니다.",
  objectives: [
    "배열 선언·생성·initializer·default value·고정 length와 0-length 배열을 설명할 수 있다.",
    "유효 index 0..length-1과 null·empty·negative/equal-length bounds failure를 구분할 수 있다.",
    "배열 reference identity·aliasing·Object.toString 표현과 content equality를 구분할 수 있다.",
    "indexed/enhanced traversal에서 slot 변경·local 재대입·mutable element 변경 차이를 추적할 수 있다.",
    "assignment·clone·Arrays.copyOf/copyOfRange·System.arraycopy의 독립성·padding·overlap·shallow copy를 검증할 수 있다.",
    "primitive/reference sort와 comparator·UTF-16/locale ordering을 선택하고 in-place mutation을 통제할 수 있다.",
    "binarySearch의 동일 ordering 전제와 negative insertion point·duplicate 정책을 설명할 수 있다.",
    "수동 exchange sort의 O(n²) 비용과 sortedness·permutation·copy-independence property를 테스트할 수 있다.",
  ],
  prerequisites: [{ title: "while·do-while와 반복 제어 계약", reason: "배열 traversal·검색·정렬의 경계와 조기 종료를 검증하려면 progress·break·complexity·test matrix가 필요합니다.", sessionSlug: "java-08-while-loop-control" }],
  keywords: ["array", "length", "index", "default value", "aliasing", "covariance", "ArrayStoreException", "enhanced for", "shallow copy", "defensive copy", "Arrays.sort", "binarySearch", "insertion point", "equals", "hashCode", "mismatch"],
  chapters: [
    {
      id: "five-source-golden-audit",
      title: "다섯 원본의 191행을 identity·blank·utility section으로 정규화합니다",
      lead: "비결정 identity hash는 버리고 같은 배열임과 결정적 값만 회귀 기준으로 둡니다.",
      explanations: [
        "Ex08은 12행이며 같은 int[]을 두 번 println해 동일한 `[I@hex` text가 나오지만 이 suffix는 실행마다 달라질 수 있습니다. 실제 주소로 해석하지 않습니다.",
        "Ex09는 char[]의 J·A·V·A와 double[]의 74.0을 char로 cast한 J를 출력해 총 5행입니다.",
        "Ex10은 String[]에서 첫 두 이름을 먼저 출력한 뒤 blank와 전체 네 이름을 출력해 7행입니다. String은 literal 편의가 있는 reference type이지 primitive가 아닙니다.",
        "Ex11은 166행·blank 4개입니다. 100개 배수 값, search index 11, 짧은/긴/range copy, fill, ascending/descending, boxed reverse, String natural order를 포함합니다.",
        "day08 Ex01은 중복을 보존해 `1 2 2 2 3 4 4 4 5 6 7 8 9 10`을 한 행으로 출력하며 원본에는 trailing space가 있습니다.",
      ],
      concepts: [
        { term: "identity normalization", definition: "실행마다 달라질 수 있는 identity hash suffix 대신 runtime type·동일성·결정적 contents를 검증하는 방식입니다.", detail: ["실제 주소를 주장하지 않습니다.", "golden flakiness를 막습니다."] },
        { term: "section boundary", definition: "긴 output에서 count·separator·first/last로 의미 영역을 구분한 경계입니다.", detail: ["Ex11 166행을 요약합니다.", "blank도 보존합니다."] },
        { term: "source correction", definition: "원본 실행 evidence는 보존하되 부정확한 설명을 JLS/API에 맞춰 바로잡는 과정입니다.", detail: ["주소·char·String을 교정합니다.", "원본은 변경하지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "java-original-array-audit",
          title: "다섯 main의 output을 안정적인 배열 evidence로 요약합니다",
          language: "powershell",
          filename: "verify-original-arrays.ps1",
          purpose: "비결정 `[I@hex`를 exact golden에 넣지 않고 동일 text·값·section을 보존합니다.",
          code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("java09-original-" + [Guid]::NewGuid().ToString("N"))
if (Test-Path $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
try {
  $files = @(
    "src\com\ictedu\day07\Ex08.java", "src\com\ictedu\day07\Ex09.java",
    "src\com\ictedu\day07\Ex10.java", "src\com\ictedu\day07\Ex11.java",
    "src\com\ictedu\day08\Ex01.java"
  )
  javac -encoding UTF-8 -Xlint:all -d $root $files
  if ($LASTEXITCODE -ne 0) { throw "compile failed" }
  $a = @(& java -cp $root com.ictedu.day07.Ex08)
  if ($LASTEXITCODE -ne 0) { throw "run failed: Ex08" }
  $b = @(& java -cp $root com.ictedu.day07.Ex09)
  if ($LASTEXITCODE -ne 0) { throw "run failed: Ex09" }
  $c = @(& java -cp $root com.ictedu.day07.Ex10)
  if ($LASTEXITCODE -ne 0) { throw "run failed: Ex10" }
  $d = @(& java -cp $root com.ictedu.day07.Ex11)
  if ($LASTEXITCODE -ne 0) { throw "run failed: Ex11" }
  $e = @(& java -cp $root com.ictedu.day08.Ex01)
  if ($LASTEXITCODE -ne 0) { throw "run failed: Ex01" }
  "Ex08=lines:$($a.Count),blank:$(@($a | Where-Object {[string]::IsNullOrEmpty($_)}).Count),sameIdentityText:$($a[0] -ceq $a[2]),values:$(@($a | Where-Object {$_ -notmatch '^\[I@' -and -not [string]::IsNullOrEmpty($_)}) -join '|')"
  "Ex09=lines:$($b.Count),values:$($b -join '|')"
  "Ex10=lines:$($c.Count),blank:$(@($c | Where-Object {[string]::IsNullOrEmpty($_)}).Count),first:$($c[0]),last:$($c[-1])"
  "Ex11=lines:$($d.Count),blank:$(@($d | Where-Object {[string]::IsNullOrEmpty($_)}).Count),search:$($d[100]),range:$($d[116..119] -join '|'),stringFirst:$($d[155]),stringLast:$($d[165])"
  "Ex01=lines:$($e.Count),sorted:$($e[0].TrimEnd())"
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}`,
          walkthrough: [
            { lines: "1-4", explanation: "system temp 바로 아래 GUID root를 create-new로 만듭니다." },
            { lines: "6-13", explanation: "원본 다섯 파일을 UTF-8·Xlint clean compile합니다." },
            { lines: "14-18", explanation: "다섯 main의 전체 output을 capture합니다." },
            { lines: "19-23", explanation: "identity suffix를 제외하고 line·blank·boundary·contents를 요약합니다." },
            { lines: "24-28", explanation: "resolved parent를 검증하고 생성 root만 제거합니다." },
          ],
          run: { environment: ["PowerShell 7+", "OpenJDK 21", "javastudy MyJavaProject root"], command: "pwsh -NoProfile -File verify-original-arrays.ps1" },
          output: { value: "Ex08=lines:12,blank:1,sameIdentityText:True,values:10|100|97|3|100|100|97|3|100\nEx09=lines:5,values:J|A|V|A|J\nEx10=lines:7,blank:1,first:고길동,last:마이콜\nEx11=lines:166,blank:4,search:결과: 11,range:3|4|5|0,stringFirst:arr8[0]=1,stringLast:arr8[10]=나바사\nEx01=lines:1,sorted:1 2 2 2 3 4 4 4 5 6 7 8 9 10", explanation: ["총 captured lines는 12+5+7+166+1=191입니다.", "Ex08은 같은 source variable을 두 번 출력해 text가 같음을 보존할 뿐, 문자열 equality만으로 object identity를 증명하지 않습니다. identity는 AliasLab의 ==로 별도 검증합니다.", "Ex11 range copy의 끝 초과 0 padding도 고정합니다."] },
          experiments: [
            { change: "Ex08을 새 JVM에서 다시 실행합니다.", prediction: "`[I@` 뒤 suffix는 달라질 수 있지만 두 행은 그 실행 안에서 같습니다.", result: "identity hash를 golden에서 제외합니다." },
            { change: "Ex11 arr를 정렬하지 않은 값으로 바꾸고 binarySearch합니다.", prediction: "검색 결과의 의미가 보장되지 않습니다.", result: "동일 ordering 선행 조건을 둡니다." },
            { change: "Ex01 print를 delimiter join으로 바꿉니다.", prediction: "값은 같고 trailing space는 사라집니다.", result: "데이터와 presentation을 분리합니다." },
          ],
          sourceRefs: ["java-day07-array-basic", "java-day07-array-init", "java-day07-string-array", "java-day07-arrays-api", "java-day08-exchange-sort", "jdk21-javac"],
        },
      ],
      diagnostics: [{ symptom: "Ex08 golden이 실행할 때마다 `[I@...`에서 실패한다.", likelyCause: "Object.toString identity hash 표현을 실제 주소·고정 문자열로 취급했습니다.", checks: ["prefix와 runtime type을 봅니다.", "같은 object 두 출력의 equality를 봅니다.", "Arrays.toString 결과를 비교합니다."], fix: "identity text suffix는 정규화하고 `==`·runtime type·contents를 별도로 검증합니다.", prevention: "identity hash·시간·임시경로 같은 비결정 값을 golden에서 제거합니다." }],
    },
    {
      id: "declaration-allocation-defaults-initializers",
      title: "배열 변수 선언과 배열 객체 생성은 별도이며 생성 순간 모든 slot이 기본값을 갖습니다",
      lead: "length를 정해 생성하고 shorthand/full initializer의 허용 문맥을 구분합니다.",
      explanations: [
        "`int[] values`는 reference variable만 선언하고 `new int[3]`이 length 3 배열 object를 생성합니다. 선언만 한 local은 definite assignment 전 읽을 수 없습니다.",
        "생성된 int slots는 0, boolean은 false, char는 null character, reference slots는 null로 초기화됩니다.",
        "`int[] a={1,2}` shorthand는 선언 initializer에서 쓰고, 이후 대입에는 `a=new int[]{1,2}` full form을 사용합니다. `new int[2]{1,2}`는 허용되지 않습니다.",
        "length는 생성 뒤 바뀌지 않지만 variable이 다른 length 배열을 가리키게 재대입할 수 있습니다. 이것은 기존 배열 resize가 아닙니다.",
        "0-length 배열은 유효하고 negative length는 NegativeArraySizeException입니다. 외부 길이는 allocation 전 상한·overflow·메모리 budget을 검사합니다.",
        "Ex09의 `ch[1]=65`는 65가 char 범위의 compile-time constant라 허용되는 narrowing입니다. 일반 int variable은 cast 없이 char에 대입되지 않습니다.",
      ],
      concepts: [
        { term: "array variable", definition: "배열 object 또는 null을 가리키는 reference variable입니다.", detail: ["선언은 object를 만들지 않습니다.", "재대입 가능합니다."] },
        { term: "default initialization", definition: "new로 만든 배열의 모든 components가 type별 기본값을 자동으로 갖는 규칙입니다.", detail: ["숫자 0·boolean false입니다.", "reference는 null입니다."] },
        { term: "fixed length", definition: "한 배열 object의 component 수가 생성 뒤 변하지 않는 성질입니다.", detail: ["length field로 읽습니다.", "복사는 새 object입니다."] },
      ],
      codeExamples: [
        {
          id: "java-array-allocation-defaults",
          title: "primitive·reference defaults와 0/negative length를 실행합니다",
          language: "java",
          filename: "src/learning/java09/AllocationLab.java",
          purpose: "생성·기본값·고정 length·invalid allocation을 exact output으로 확인합니다.",
          code: String.raw`package learning.java09;

import java.util.Arrays;

public class AllocationLab {
    public static void main(String[] args) {
        int[] ints = new int[3];
        String[] refs = new String[2];
        boolean[] flags = new boolean[2];
        int[] empty = new int[0];
        System.out.println("ints=" + Arrays.toString(ints));
        System.out.println("refs=" + Arrays.toString(refs));
        System.out.println("flags=" + Arrays.toString(flags));
        System.out.println("empty.length=" + empty.length);
        try { new int[-1].clone(); }
        catch (NegativeArraySizeException error) {
            System.out.println("negative=" + error.getClass().getSimpleName());
        }
    }
}`,
          walkthrough: [
            { lines: "7-10", explanation: "세 type의 arrays와 유효한 0-length 배열을 생성합니다." },
            { lines: "11-14", explanation: "생성 직후 default contents와 length를 구조적으로 출력합니다." },
            { lines: "15-18", explanation: "negative length를 명시된 runtime failure로 관찰합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java09/AllocationLab.java && java -cp build/classes learning.java09.AllocationLab" },
          output: { value: "ints=[0, 0, 0]\nrefs=[null, null]\nflags=[false, false]\nempty.length=0\nnegative=NegativeArraySizeException", explanation: ["배열은 생성 즉시 모든 slot이 기본값을 갖습니다.", "0-length와 negative length는 다른 상태입니다."] },
          experiments: [
            { change: "refs[0].length()를 호출합니다.", prediction: "default null이므로 NullPointerException입니다.", result: "reference slot initialization과 object 존재를 구분합니다." },
            { change: "`int[] a; System.out.println(a)`를 추가합니다.", prediction: "local variable might not have been initialized compile failure입니다.", result: "배열 slot default와 local definite assignment를 구분합니다." },
            { change: "외부 length를 Integer.MAX_VALUE로 넣습니다.", prediction: "OutOfMemoryError 가능성이 있어 정상 입력으로 시도하면 안 됩니다.", result: "allocation 전 business·resource 상한을 둡니다." },
          ],
          sourceRefs: ["java-day07-array-basic", "java-day07-array-init", "jls-arrays", "jls-initial-values", "jls-array-creation-access"],
        },
      ],
      diagnostics: [{ symptom: "배열을 선언했는데 읽을 때 compile error 또는 null failure가 난다.", likelyCause: "local reference 선언·null 대입·new allocation을 같은 단계로 생각했습니다.", checks: ["new 실행 여부를 봅니다.", "local definite assignment를 확인합니다.", "reference slot과 array variable을 구분합니다."], fix: "필요 length로 명시 생성하고 nullable contract면 사용 전 validation을 둡니다.", prevention: "uninitialized·null·empty·non-empty cases를 별도 이름과 test로 구분합니다." }],
    },
    {
      id: "length-index-null-empty-bounds",
      title: "유효 index는 0부터 length-1이며 null·empty·범위 밖은 서로 다른 실패입니다",
      lead: "`i < length`를 자료 구조의 계약으로 이해합니다.",
      explanations: [
        "length 3의 유효 index는 0·1·2이고 index==length나 negative는 ArrayIndexOutOfBoundsException입니다.",
        "length는 method가 아니라 public final field처럼 `values.length`로 읽습니다. String length()와 혼동하지 않습니다.",
        "empty 배열은 object가 있고 length 0이라 iteration은 0회지만, null은 array object가 없어 length 접근부터 NullPointerException입니다.",
        "`i<=values.length`는 마지막 회차에서 반드시 실패합니다. last element가 필요하면 values[values.length-1]이지만 empty를 먼저 처리합니다.",
        "index를 외부 입력으로 받으면 0<=index && index<length를 검사하고 오류 메시지에는 민감한 원소 contents를 노출하지 않습니다.",
      ],
      concepts: [
        { term: "valid index domain", definition: "length n 배열에서 component access가 허용되는 정수 0..n-1입니다.", detail: ["n개입니다.", "empty에는 하나도 없습니다."] },
        { term: "empty array", definition: "null이 아닌 length 0 배열 object입니다.", detail: ["순회 0회입니다.", "안전한 empty result로 쓸 수 있습니다."] },
        { term: "bounds check", definition: "runtime이 매 array access index가 valid domain인지 검사하는 동작입니다.", detail: ["벗어나면 예외입니다.", "사전 validation도 유용합니다."] },
      ],
      codeExamples: [
        {
          id: "java-array-bounds-null-empty",
          title: "정상·negative·equal-length·null·empty 경계를 분리합니다",
          language: "java",
          filename: "src/learning/java09/BoundsLab.java",
          purpose: "배열 access의 대표 실패 type을 exact output으로 고정합니다.",
          code: String.raw`package learning.java09;

public class BoundsLab {
    public static void main(String[] args) {
        int[] values = {10, 20, 30};
        System.out.println("length=" + values.length + ",last=" + values[values.length - 1]);
        try { System.out.println(values[-1]); }
        catch (ArrayIndexOutOfBoundsException error) { System.out.println("negative=" + error.getClass().getSimpleName()); }
        try { System.out.println(values[values.length]); }
        catch (ArrayIndexOutOfBoundsException error) { System.out.println("equalLength=" + error.getClass().getSimpleName()); }
        int[] missing = null;
        try { System.out.println(missing.length); }
        catch (NullPointerException error) { System.out.println("null=" + error.getClass().getSimpleName()); }
        System.out.println("empty-length=" + new int[0].length);
    }
}`,
          walkthrough: [
            { lines: "5-6", explanation: "length 3의 마지막 valid index 2를 계산합니다." },
            { lines: "7-10", explanation: "-1과 length 자체가 같은 bounds failure임을 확인합니다." },
            { lines: "11-14", explanation: "null은 length access부터 실패하고 empty는 length 0을 정상 반환합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java09/BoundsLab.java && java -cp build/classes learning.java09.BoundsLab" },
          output: { value: "length=3,last=30\nnegative=ArrayIndexOutOfBoundsException\nequalLength=ArrayIndexOutOfBoundsException\nnull=NullPointerException\nempty-length=0", explanation: ["유효 마지막 index는 length-1입니다.", "null과 empty는 같은 상태가 아닙니다."] },
          experiments: [
            { change: "loop condition을 i<=values.length로 둡니다.", prediction: "i=3 access에서 ArrayIndexOutOfBoundsException입니다.", result: "exclusive upper bound를 유지합니다." },
            { change: "empty의 마지막 값을 읽습니다.", prediction: "length-1=-1이라 bounds failure입니다.", result: "last access 전 non-empty를 검증합니다." },
            { change: "missing을 empty array로 바꿉니다.", prediction: "null failure 없이 empty-length=0으로 처리할 수 있습니다.", result: "API의 null/empty 정책을 선택합니다." },
          ],
          sourceRefs: ["java-day07-array-basic", "jls-arrays", "jls-array-creation-access", "java-index-oob"],
        },
      ],
      diagnostics: [{ symptom: "모든 값을 출력한 뒤 마지막에 bounds exception이 난다.", likelyCause: "loop upper bound가 <=length입니다.", checks: ["마지막 i를 기록합니다.", "유효 domain을 적습니다.", "empty·single 배열을 실행합니다."], fix: "index traversal을 `0 <= i && i < values.length`로 고칩니다.", prevention: "length 0·1·n과 index -1·0·n-1·n matrix를 둡니다." }],
    },
    {
      id: "reference-identity-aliasing-object-string",
      title: "배열 대입은 contents 복사가 아니라 같은 object를 가리키는 alias를 만듭니다",
      lead: "identity·runtime type·contents·content hash를 서로 다른 관측값으로 봅니다.",
      explanations: [
        "배열은 object이고 variable에는 reference value가 저장됩니다. `b=a`는 같은 배열 object를 공유하므로 b를 통한 slot 변경이 a에서 보입니다.",
        "array class는 Object.toString을 override하지 않아 `[I@hex` 같은 class-name/hash 표현을 냅니다. JVM 실제 메모리 주소가 아닙니다.",
        "`a==b`는 identity를, `Arrays.equals(a,b)`는 1차원 contents를 비교합니다. array 자체 equals도 Object identity semantics입니다.",
        "clone은 같은 component type·length의 새 array를 만들지만 reference elements는 같은 objects를 공유하는 shallow copy입니다.",
        "String[]도 reference array이며 slots는 null일 수 있습니다. String literal·+ 연산 편의 때문에 primitive처럼 보일 뿐 null·equals·identity 규칙은 reference와 같습니다.",
      ],
      concepts: [
        { term: "alias", definition: "둘 이상의 variables가 같은 mutable object를 가리키는 상태입니다.", detail: ["변경이 공유됩니다.", "소유권을 문서화합니다."] },
        { term: "identity", definition: "두 references가 정확히 같은 object를 가리키는지의 관계입니다.", detail: ["==로 비교합니다.", "contents equality와 다릅니다."] },
        { term: "content hash", definition: "array elements의 순서와 값에서 계산한 hash입니다.", detail: ["Arrays.hashCode를 씁니다.", "contents가 바뀌면 달라집니다."] },
      ],
      codeExamples: [
        {
          id: "java-array-alias-identity",
          title: "alias mutation과 clone 독립성을 identity·contents·hash로 비교합니다",
          language: "java",
          filename: "src/learning/java09/AliasLab.java",
          purpose: "Ex08의 주소 오해를 제거하고 reference sharing을 결정적으로 검증합니다.",
          code: String.raw`package learning.java09;

import java.util.Arrays;

public class AliasLab {
    public static void main(String[] args) {
        int[] original = {1, 2};
        int[] alias = original;
        int[] clone = original.clone();
        alias[0] = 9;
        System.out.println("same=" + (original == alias) + ",cloneSame=" + (original == clone));
        System.out.println("contentEqual=" + Arrays.equals(original, clone));
        System.out.println("original=" + Arrays.toString(original) + ",clone=" + Arrays.toString(clone));
        System.out.println("hashes=" + Arrays.hashCode(original) + "," + Arrays.hashCode(clone));
        System.out.println("runtimeType=" + original.getClass().getName());
    }
}`,
          walkthrough: [
            { lines: "7-10", explanation: "alias는 같은 object, clone은 mutation 전 contents를 복사한 새 object입니다." },
            { lines: "11-15", explanation: "identity·content equality·actual values·content hashes를 분리합니다." },
            { lines: "16", explanation: "int[] runtime class name `[I`를 출력하되 identity hash를 출력하지 않습니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java09/AliasLab.java && java -cp build/classes learning.java09.AliasLab" },
          output: { value: "same=true,cloneSame=false\ncontentEqual=false\noriginal=[9, 2],clone=[1, 2]\nhashes=1242,994\nruntimeType=[I", explanation: ["alias 변경이 original에 보입니다.", "clone은 array object가 다르고 mutation 이전 contents를 유지합니다."] },
          experiments: [
            { change: "clone도 alias[1]=7 뒤 생성합니다.", prediction: "clone contents는 생성 시점의 [9,7]입니다.", result: "clone은 live link가 아닌 시점 copy입니다." },
            { change: "original.toString을 출력합니다.", prediction: "`[I@` prefix지만 suffix는 고정할 수 없습니다.", result: "Arrays.toString을 contents 표현에 사용합니다." },
            { change: "original을 HashMap key로 사용한 뒤 contents를 바꿉니다.", prediction: "array 자체 hashCode는 identity라 contents lookup 의미와 맞지 않습니다.", result: "immutable value wrapper를 key로 사용합니다." },
          ],
          sourceRefs: ["java-day07-array-basic", "java-day07-string-array", "jls-arrays", "java-object-api", "java-arrays-api"],
        },
      ],
      diagnostics: [{ symptom: "복사했다고 생각한 배열 한쪽을 바꾸자 원본도 바뀐다.", likelyCause: "`copy=original`로 reference만 복사했습니다.", checks: ["original==copy를 봅니다.", "copy 생성 API를 확인합니다.", "mutable element 공유도 확인합니다."], fix: "primitive array는 clone/copyOf, object array는 요구된 element copy depth까지 적용합니다.", prevention: "identity false·content true와 mutation isolation test를 둡니다." }],
    },
    {
      id: "indexed-enhanced-traversal",
      title: "indexed for는 slot을 바꾸고 enhanced for variable 재대입은 slot을 바꾸지 않습니다",
      lead: "값 읽기·index 필요·역순·부분 범위·mutation 목적에 따라 traversal을 선택합니다.",
      explanations: [
        "indexed loop는 i와 values[i]를 함께 사용해 slot을 직접 갱신하고 역순·부분 range도 표현합니다.",
        "enhanced for는 각 component value를 local variable에 대입합니다. primitive local을 바꿔도 원래 slot은 바뀌지 않습니다.",
        "reference element의 method로 object를 mutate하면 공유 object 상태는 바뀌지만 enhanced variable을 새 object로 재대입해도 slot은 바뀌지 않습니다.",
        "순회 중 같은 배열의 length는 고정이지만 nullable elements와 외부에서 공유된 object mutation은 별도 위험입니다.",
        "stream은 index·checked exception·early mutation이 필요 없는 선언적 aggregate에 유용하지만 단순 loop보다 항상 빠르거나 명확한 것은 아닙니다.",
      ],
      concepts: [
        { term: "indexed traversal", definition: "0..length-1 index로 각 slot을 직접 읽고 쓰는 순회입니다.", detail: ["index를 알 수 있습니다.", "bounds가 명시됩니다."] },
        { term: "enhanced for", definition: "array component values를 순서대로 local loop variable에 대입하는 문법입니다.", detail: ["간결한 읽기에 적합합니다.", "slot index는 직접 주지 않습니다."] },
        { term: "slot mutation", definition: "array object의 특정 index가 저장한 component value를 바꾸는 동작입니다.", detail: ["values[i]=...로 수행합니다.", "local 재대입과 다릅니다."] },
      ],
      codeExamples: [
        {
          id: "java-array-traversal-mutation",
          title: "enhanced local 재대입과 indexed slot mutation을 비교합니다",
          language: "java",
          filename: "src/learning/java09/TraversalLab.java",
          purpose: "같은 loop 모양처럼 보여도 mutation target이 다름을 실행합니다.",
          code: String.raw`package learning.java09;

import java.util.Arrays;

public class TraversalLab {
    public static void main(String[] args) {
        int[] values = {1, 2, 3};
        for (int value : values) value = 0;
        System.out.println("after-enhanced-local=" + Arrays.toString(values));
        for (int i = 0; i < values.length; i++) values[i] *= 2;
        System.out.println("after-indexed-double=" + Arrays.toString(values));
        int sum = 0;
        for (int value : values) sum = Math.addExact(sum, value);
        System.out.println("sum=" + sum);
        for (int i = values.length - 1; i >= 0; i--) values[i] = 0;
        System.out.println("after-reverse-zero=" + Arrays.toString(values));
    }
}`,
          walkthrough: [
            { lines: "7-9", explanation: "enhanced variable value에 0을 대입해도 array slots 1·2·3은 유지됩니다." },
            { lines: "10-11", explanation: "indexed assignment가 각 slot을 2·4·6으로 바꿉니다." },
            { lines: "12-14", explanation: "enhanced for는 읽기·합산에 자연스럽고 sum 12를 만듭니다." },
            { lines: "15-16", explanation: "역순 indexed traversal로 slots를 직접 0으로 만듭니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java09/TraversalLab.java && java -cp build/classes learning.java09.TraversalLab" },
          output: { value: "after-enhanced-local=[1, 2, 3]\nafter-indexed-double=[2, 4, 6]\nsum=12\nafter-reverse-zero=[0, 0, 0]", explanation: ["enhanced variable은 component value의 local copy입니다.", "slot mutation에는 index assignment가 필요합니다."] },
          experiments: [
            { change: "enhanced body에서 StringBuilder.append를 호출합니다.", prediction: "reference copy가 가리키는 object mutation은 원본 array를 통해 보입니다.", result: "slot과 element object를 구분합니다." },
            { change: "indexed upper bound를 <=length로 바꿉니다.", prediction: "마지막에 bounds exception입니다.", result: "traversal도 exclusive bound를 유지합니다." },
            { change: "sum을 int * 큰 값으로 바꿉니다.", prediction: "Math.addExact가 overflow를 명시합니다.", result: "aggregate range를 검증합니다." },
          ],
          sourceRefs: ["java-day07-array-basic", "java-day07-array-init", "java-day07-string-array", "jls-enhanced-for", "java-math-api"],
        },
      ],
      diagnostics: [{ symptom: "enhanced for 안에서 값을 0으로 대입했는데 배열이 바뀌지 않는다.", likelyCause: "loop local variable을 재대입했고 array slot에는 쓰지 않았습니다.", checks: ["values[index] assignment가 있는지 봅니다.", "primitive/reference element를 구분합니다.", "before/after Arrays.toString을 비교합니다."], fix: "slot 변경은 indexed loop·Arrays.fill/setAll 같은 명시적 API를 사용합니다.", prevention: "local 재대입과 object mutation 예제를 code review 기준에 포함합니다." }],
    },
    {
      id: "reference-elements-mutation-covariance",
      title: "reference array는 element objects를 가리키고 공변 대입은 runtime store failure를 남깁니다",
      lead: "array object·slot reference·element object 세 층을 구분합니다.",
      explanations: [
        "String[]·StringBuilder[] 같은 reference arrays의 slots에는 object references 또는 null이 저장됩니다.",
        "shallow copy 뒤 두 arrays의 같은 index가 같은 mutable object를 가리키면 한쪽 append가 양쪽에서 보입니다.",
        "Java arrays는 covariant라 String[]을 Object[] variable에 대입할 수 있지만 runtime component type은 String[]입니다.",
        "Object[] alias를 통해 Integer를 저장하면 compile되지만 JVM store check가 ArrayStoreException을 냅니다. type safety가 runtime으로 미뤄진 비용입니다.",
        "generic List<String>은 List<Object> subtype이 아니므로 이런 쓰기 위험을 compile-time에 막습니다. arrays와 generics 대입 규칙을 섞지 않습니다.",
      ],
      concepts: [
        { term: "array covariance", definition: "S가 T의 subtype이면 S[]도 T[]의 subtype인 Java 배열 규칙입니다.", detail: ["읽기 호환성은 편리합니다.", "쓰기에는 runtime check가 필요합니다."] },
        { term: "runtime component type", definition: "array object가 생성될 때 정해져 store마다 검사되는 실제 component type입니다.", detail: ["variable type과 다를 수 있습니다.", "getClass로 관찰합니다."] },
        { term: "ArrayStoreException", definition: "reference array runtime component type에 맞지 않는 object를 저장할 때 나는 예외입니다.", detail: ["bounds와 다른 검사입니다.", "covariance 위험을 드러냅니다."] },
      ],
      codeExamples: [
        {
          id: "java-array-covariance-store",
          title: "String[]을 Object[]로 읽되 Integer store는 runtime에 거부합니다",
          language: "java",
          filename: "src/learning/java09/CovarianceLab.java",
          purpose: "compile-time reference type과 runtime component type 차이를 실행합니다.",
          code: String.raw`package learning.java09;

import java.util.Arrays;

public class CovarianceLab {
    public static void main(String[] args) {
        String[] strings = {"A", "B"};
        Object[] objects = strings;
        objects[0] = "OK";
        System.out.println("runtime=" + objects.getClass().getName());
        System.out.println("values=" + Arrays.toString(strings));
        try { objects[1] = 42; }
        catch (ArrayStoreException error) {
            System.out.println("store=" + error.getClass().getSimpleName());
        }
        System.out.println("after=" + Arrays.toString(strings));
    }
}`,
          walkthrough: [
            { lines: "7-9", explanation: "covariant reference assignment 뒤 compatible String store는 성공합니다." },
            { lines: "10-11", explanation: "runtime type은 Object[]가 아니라 String[]을 뜻하는 `[Ljava.lang.String;`입니다." },
            { lines: "12-16", explanation: "Integer store는 runtime 검사에서 실패하고 기존 B는 보존됩니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java09/CovarianceLab.java && java -cp build/classes learning.java09.CovarianceLab" },
          output: { value: "runtime=[Ljava.lang.String;\nvalues=[OK, B]\nstore=ArrayStoreException\nafter=[OK, B]", explanation: ["Object[] variable도 실제 String[] store rule을 우회하지 못합니다.", "실패 store는 slot을 변경하지 않습니다."] },
          experiments: [
            { change: "처음부터 Object[]을 new Object[2]로 생성합니다.", prediction: "String과 Integer 모두 저장됩니다.", result: "runtime component type이 store rule을 결정합니다." },
            { change: "List<String>을 List<Object>에 대입합니다.", prediction: "generic invariance 때문에 compile failure입니다.", result: "arrays와 generic collections를 비교합니다." },
            { change: "objects[1]=null로 바꿉니다.", prediction: "null은 reference component에 허용됩니다.", result: "nullable slot policy를 별도로 검증합니다." },
          ],
          sourceRefs: ["java-day07-string-array", "jls-array-subtyping", "jls-arrays", "java-array-store-exception"],
        },
      ],
      diagnostics: [{ symptom: "Object[]에 정상 Object를 넣었는데 ArrayStoreException이 난다.", likelyCause: "variable은 Object[]지만 실제 object는 더 좁은 component type의 array입니다.", checks: ["getClass().getName을 봅니다.", "array 생성 지점을 찾습니다.", "covariant assignment를 검색합니다."], fix: "쓰기 API는 정확한 component type을 유지하거나 generic collection으로 바꾸고 broad Object[] mutation을 피합니다.", prevention: "covariant arrays에 incompatible/null stores를 test하고 API boundary에서 defensive copy합니다." }],
    },
    {
      id: "copy-alias-clone-arraycopy-shallow-deep",
      title: "배열 복사는 새 container를 만들 수 있어도 mutable elements까지 자동 복제하지 않습니다",
      lead: "array identity와 element identity를 각각 검증합니다.",
      explanations: [
        "assignment는 array object를 공유하고 clone·Arrays.copyOf·copyOfRange는 새 array object를 만듭니다.",
        "primitive components는 값이 복사되지만 reference components는 references가 복사되어 element objects를 공유하는 shallow copy입니다.",
        "deep copy는 모든 type에 공통인 한 API가 아니라 element별 copy constructor·factory·immutable policy를 정의해야 합니다.",
        "System.arraycopy는 source/destination가 같은 배열로 겹쳐도 마치 임시 copy를 사용한 것처럼 올바르게 이동하지만 bounds·type 검사는 runtime에 수행합니다.",
        "copyOf가 더 긴 length를 요청하면 type default로 padding하고 copyOfRange의 end도 exclusive이며 source 끝을 넘는 부분은 padding될 수 있습니다.",
      ],
      concepts: [
        { term: "shallow copy", definition: "새 container에 기존 element values/references만 복사하는 방식입니다.", detail: ["array identity는 다릅니다.", "mutable element는 공유합니다."] },
        { term: "deep copy policy", definition: "중첩·가변 elements까지 어느 깊이와 규칙으로 새 objects를 만들지 정한 계약입니다.", detail: ["domain별 설계입니다.", "cycle·identity를 고려합니다."] },
        { term: "overlap-safe copy", definition: "source와 destination ranges가 겹쳐도 원래 source sequence가 보존되는 복사 의미입니다.", detail: ["System.arraycopy가 제공합니다.", "range 검증은 필요합니다."] },
      ],
      codeExamples: [
        {
          id: "java-array-copy-depth-overlap",
          title: "alias·shallow·deep element identity와 overlapping arraycopy를 비교합니다",
          language: "java",
          filename: "src/learning/java09/CopyDepthLab.java",
          purpose: "새 array 여부와 mutable element 공유를 독립적으로 확인합니다.",
          code: String.raw`package learning.java09;

import java.util.Arrays;

public class CopyDepthLab {
    public static void main(String[] args) {
        StringBuilder[] original = {new StringBuilder("A"), new StringBuilder("B")};
        StringBuilder[] alias = original;
        StringBuilder[] shallow = original.clone();
        StringBuilder[] deep = Arrays.stream(original)
                .map(value -> new StringBuilder(value.toString())).toArray(StringBuilder[]::new);
        System.out.println("aliasArray=" + (original == alias) + ",shallowArray=" + (original == shallow));
        System.out.println("shallowElement=" + (original[0] == shallow[0]) + ",deepElement=" + (original[0] == deep[0]));
        shallow[0].append('!');
        deep[0].append('?');
        System.out.println("original=" + Arrays.toString(original));
        System.out.println("deep=" + Arrays.toString(deep));
        int[] overlap = {1, 2, 3, 4, 5};
        System.arraycopy(overlap, 0, overlap, 1, 4);
        System.out.println("overlap=" + Arrays.toString(overlap));
    }
}`,
          walkthrough: [
            { lines: "7-11", explanation: "alias·shallow clone·element-by-element deep copy를 같은 원본에서 만듭니다." },
            { lines: "12-13", explanation: "array identity와 첫 element identity를 별도로 비교합니다." },
            { lines: "14-17", explanation: "shallow mutation은 original A에도 보이고 deep mutation은 deep에만 보입니다." },
            { lines: "18-20", explanation: "같은 int[]에서 오른쪽으로 겹쳐 복사해 원래 1·2·3·4를 보존합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java09/CopyDepthLab.java && java -cp build/classes learning.java09.CopyDepthLab" },
          output: { value: "aliasArray=true,shallowArray=false\nshallowElement=true,deepElement=false\noriginal=[A!, B]\ndeep=[A?, B]\noverlap=[1, 1, 2, 3, 4]", explanation: ["clone은 새 array지만 StringBuilder elements를 공유합니다.", "element별 생성이 mutable state를 격리합니다.", "arraycopy는 overlapping range도 정의된 순서로 처리합니다."] },
          experiments: [
            { change: "deep[0]=original[0]로 바꿉니다.", prediction: "deepElement=true이고 append가 original에도 보입니다.", result: "한 slot만 공유돼도 전체 deep-copy 주장이 깨집니다." },
            { change: "arraycopy length를 5로 바꿉니다.", prediction: "destination 끝을 넘어 IndexOutOfBoundsException입니다.", result: "source/destination ranges를 사전 검증합니다." },
            { change: "immutable String[]을 shallow copy합니다.", prediction: "elements는 공유해도 String 자체 mutation이 없어 상태 격리가 단순합니다.", result: "immutability가 copy 깊이 비용을 줄입니다." },
          ],
          sourceRefs: ["java-day07-arrays-api", "jls-arrays", "java-arrays-api", "java-system-arraycopy"],
        },
      ],
      diagnostics: [{ symptom: "배열 clone 뒤 element를 수정했는데 원본 element도 변한다.", likelyCause: "array container만 복제한 shallow copy이고 mutable element references를 공유합니다.", checks: ["original==copy와 original[i]==copy[i]를 둘 다 봅니다.", "element mutability를 확인합니다.", "copy 시점을 확인합니다."], fix: "element별 copy policy를 적용하거나 immutable value objects를 사용합니다.", prevention: "container identity·element identity·mutation isolation 세 assertions를 둡니다." }],
    },
    {
      id: "arrays-utility-display-fill-generate",
      title: "Arrays utility는 출력·padding copy·fill·index 함수 생성을 명시적으로 제공합니다",
      lead: "수동 loop를 줄이되 range·default padding 계약을 먼저 읽습니다.",
      explanations: [
        "Arrays.toString은 1차원 contents를 deterministic하게 표현하고 nested arrays에는 deepToString을 사용합니다.",
        "copyOf의 newLength가 원본보다 짧으면 truncate, 길면 component default로 padding합니다.",
        "copyOfRange(from,to)는 from inclusive·to exclusive이며 to가 source length보다 크면 남은 부분을 default로 채웁니다. Ex11의 2..6은 3,4,5,0입니다.",
        "fill은 전체 또는 range를 같은 값으로 덮고 setAll은 index 함수로 각 값을 만듭니다. reference fill은 같은 object reference를 모든 slots에 넣습니다.",
        "utility 호출도 negative length·from>to·invalid range·allocation budget을 자동으로 비즈니스 success로 바꾸지는 않습니다.",
      ],
      concepts: [
        { term: "default padding", definition: "더 긴 새 배열의 복사되지 않은 slots를 component 기본값으로 채우는 동작입니다.", detail: ["int는 0입니다.", "reference는 null입니다."] },
        { term: "half-open range", definition: "시작은 포함하고 끝은 제외하는 [from,to) 범위입니다.", detail: ["길이는 to-from입니다.", "index APIs에 흔합니다."] },
        { term: "index generator", definition: "각 index를 입력으로 받아 component value를 계산하는 함수입니다.", detail: ["Arrays.setAll에 씁니다.", "side effect를 피합니다."] },
      ],
      codeExamples: [
        {
          id: "java-arrays-utility-padding",
          title: "짧은·긴·range copy와 fill·setAll을 재현합니다",
          language: "java",
          filename: "src/learning/java09/ArraysUtilityLab.java",
          purpose: "Ex11의 copy/padding/fill을 작은 exact arrays로 고정합니다.",
          code: String.raw`package learning.java09;

import java.util.Arrays;

public class ArraysUtilityLab {
    public static void main(String[] args) {
        int[] source = {1, 2, 3, 4, 5};
        System.out.println("copy3=" + Arrays.toString(Arrays.copyOf(source, 3)));
        System.out.println("copy7=" + Arrays.toString(Arrays.copyOf(source, 7)));
        System.out.println("range2to6=" + Arrays.toString(Arrays.copyOfRange(source, 2, 6)));
        int[] filled = new int[4];
        Arrays.fill(filled, 3);
        System.out.println("filled=" + Arrays.toString(filled));
        Arrays.setAll(filled, index -> index * 5);
        System.out.println("setAll=" + Arrays.toString(filled));
    }
}`,
          walkthrough: [
            { lines: "7-10", explanation: "length 3 truncate, length 7 zero padding, [2,6) range zero padding을 비교합니다." },
            { lines: "11-13", explanation: "new int[4] 전체를 3으로 채웁니다." },
            { lines: "14-15", explanation: "index 함수 i*5로 0·5·10·15를 만듭니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java09/ArraysUtilityLab.java && java -cp build/classes learning.java09.ArraysUtilityLab" },
          output: { value: "copy3=[1, 2, 3]\ncopy7=[1, 2, 3, 4, 5, 0, 0]\nrange2to6=[3, 4, 5, 0]\nfilled=[3, 3, 3, 3]\nsetAll=[0, 5, 10, 15]", explanation: ["끝 초과는 int default 0으로 padding됩니다.", "setAll은 index마다 함수를 호출합니다."] },
          experiments: [
            { change: "copyOfRange from=4,to=2로 바꿉니다.", prediction: "IllegalArgumentException입니다.", result: "half-open range order를 검증합니다." },
            { change: "StringBuilder 한 개로 reference array를 fill합니다.", prediction: "모든 slots가 같은 mutable object를 공유합니다.", result: "reference fill과 element generation을 구분합니다." },
            { change: "newLength를 외부 huge value로 둡니다.", prediction: "memory exhaustion 위험이 있습니다.", result: "복사 전 length budget을 적용합니다." },
          ],
          sourceRefs: ["java-day07-arrays-api", "java-arrays-api", "jls-initial-values"],
        },
      ],
      diagnostics: [{ symptom: "copyOfRange 결과 끝에 예상하지 않은 0/null이 생겼다.", likelyCause: "to가 source length를 넘어 default padding되거나 newLength가 더 큽니다.", checks: ["from/to/newLength를 기록합니다.", "source length와 비교합니다.", "padding policy를 확인합니다."], fix: "padding이 의도면 문서화하고 아니면 to를 min(source.length, requestedTo)로 검증하거나 invalid로 거부합니다.", prevention: "short·exact·long copy와 from/to boundaries를 test합니다." }],
    },
    {
      id: "sort-natural-comparator-in-place",
      title: "정렬은 배열을 제자리 변경하며 primitive·boxed·String ordering 계약이 다릅니다",
      lead: "같은 ordering을 이후 search와 사용자 표시에도 일관되게 적용합니다.",
      explanations: [
        "Arrays.sort(int[])는 primitive 값을 ascending numeric order로 제자리 정렬해 호출 전 순서를 잃습니다. 원본 보존이 필요하면 먼저 복사합니다.",
        "primitive int[]에는 Comparator를 전달할 수 없어 reverseOrder를 쓰려면 Integer[] boxing 또는 ascending 뒤 역순 traversal을 선택합니다.",
        "reference sort는 natural Comparable 또는 explicit Comparator를 사용하고 null·inconsistent comparator 정책을 정합니다.",
        "String natural order는 Unicode/UTF-16 code units의 lexicographic comparison입니다. Ex11 fixture에서는 digits·@·uppercase·lowercase·Hangul 순이지만 모든 punctuation의 보편 분류 순서를 뜻하지 않습니다.",
        "사용자 언어의 사전순은 Locale과 Collator strength·normalization을 정하고 그 comparator를 sort·search 모두에 전달합니다.",
        "Object sort는 API상 stable이고 primitive sort는 stability가 의미 없는 값만 다루거나 안정성을 계약으로 기대하지 않습니다.",
      ],
      concepts: [
        { term: "in-place sort", definition: "새 결과 배열 대신 입력 배열의 component 순서를 직접 바꾸는 정렬입니다.", detail: ["alias consumer에도 보입니다.", "방어 복사를 검토합니다."] },
        { term: "natural order", definition: "Comparable type이 정의한 기본 ordering입니다.", detail: ["String은 lexicographic입니다.", "locale 표시순과 다를 수 있습니다."] },
        { term: "Comparator", definition: "두 values의 순서를 negative·zero·positive로 정의하는 전략 object입니다.", detail: ["sort/search에 일관되게 씁니다.", "transitive여야 합니다."] },
      ],
      codeExamples: [
        {
          id: "java-array-sort-ordering",
          title: "numeric ascending·boxed descending·String natural order를 실행합니다",
          language: "java",
          filename: "src/learning/java09/SortLab.java",
          purpose: "Ex11의 세 ordering을 compact exact output으로 재현합니다.",
          code: String.raw`package learning.java09;

import java.util.Arrays;
import java.util.Collections;

public class SortLab {
    public static void main(String[] args) {
        int[] numbers = {3, 2, 1, 2};
        Arrays.sort(numbers);
        Integer[] descending = {7, 4, 3, 1, 5, 6, 2};
        Arrays.sort(descending, Collections.reverseOrder());
        String[] words = {"Mango", "Apple", "apple", "7", "mango", "1", "banana", "Banana", "@", "가나다", "나바사"};
        Arrays.sort(words);
        System.out.println("numbers=" + Arrays.toString(numbers));
        System.out.println("descending=" + Arrays.toString(descending));
        System.out.println("words=" + Arrays.toString(words));
    }
}`,
          walkthrough: [
            { lines: "8-9", explanation: "primitive int[]이 ascending [1,2,2,3]으로 제자리 변경됩니다." },
            { lines: "10-11", explanation: "boxed Integer[]에 reverseOrder comparator를 적용합니다." },
            { lines: "12-13", explanation: "String natural order로 원본 Ex11의 UTF-16 순서를 재현합니다." },
            { lines: "14-16", explanation: "세 arrays의 최종 contents를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java09/SortLab.java && java -cp build/classes learning.java09.SortLab" },
          output: { value: "numbers=[1, 2, 2, 3]\ndescending=[7, 6, 5, 4, 3, 2, 1]\nwords=[1, 7, @, Apple, Banana, Mango, apple, banana, mango, 가나다, 나바사]", explanation: ["numeric·reverse comparator·String natural ordering이 각각 적용됩니다.", "String 결과를 일반 locale 사전순으로 부르지 않습니다."] },
          experiments: [
            { change: "words를 Korean Collator로 정렬합니다.", prediction: "natural UTF-16 order와 다를 수 있고 Locale·strength 설정이 결과 계약이 됩니다.", result: "사용자 표시순을 명시합니다." },
            { change: "numbers alias를 다른 consumer가 보유하게 합니다.", prediction: "sort mutation이 그 consumer에도 즉시 보입니다.", result: "원본 보존 시 defensive copy합니다." },
            { change: "descending에 null을 추가합니다.", prediction: "reverseOrder natural comparison에서 NullPointerException 가능성이 있습니다.", result: "nullsFirst/nullsLast 정책을 명시합니다." },
          ],
          sourceRefs: ["java-day07-arrays-api", "java-arrays-api", "java-collections-reverse", "java-string-api", "java-comparator-api", "java-collator-api"],
        },
      ],
      diagnostics: [{ symptom: "화면의 한글·기호 정렬이 사용자의 사전순 기대와 다르다.", likelyCause: "String natural UTF-16 order를 locale collation으로 오해했습니다.", checks: ["사용 comparator를 확인합니다.", "Locale·strength·normalization을 봅니다.", "대표 accents·한글·case fixtures를 실행합니다."], fix: "요구 locale의 Collator/comparator를 명시하고 sort와 search에 동일하게 사용합니다.", prevention: "ordering policy를 API parameter 또는 versioned config로 만들고 golden examples를 둡니다." }],
    },
    {
      id: "binary-search-sorted-precondition",
      title: "binarySearch는 같은 ordering으로 정렬된 배열에서만 결과 의미가 보장됩니다",
      lead: "negative result를 not-found boolean으로 버리지 말고 insertion point로 해석합니다.",
      explanations: [
        "binary search는 탐색 range가 ascending natural order 또는 전달 comparator와 같은 ordering으로 정렬돼 있어야 합니다.",
        "found면 non-negative index를 반환하고 못 찾으면 `-(insertionPoint)-1`을 반환합니다. insertion point는 `-result-1`로 복원합니다.",
        "Ex11 arr[i]=i*5는 이미 ascending이라 55가 index 11입니다. 정렬되지 않은 배열의 반환값은 의미를 보장하지 않습니다.",
        "duplicates가 있으면 일치하는 여러 index 중 어느 것을 반환할지 보장하지 않으므로 first/last occurrence는 추가 scan 또는 lower/upper bound가 필요합니다.",
        "sort와 binarySearch comparator가 다르면 precondition 위반입니다. locale/case-insensitive ordering도 동일 policy로 연결합니다.",
      ],
      concepts: [
        { term: "binary search precondition", definition: "탐색 range가 search가 사용하는 동일 ordering으로 정렬돼 있어야 한다는 선행 조건입니다.", detail: ["검증 책임을 정합니다.", "unsorted 결과는 사용하지 않습니다."] },
        { term: "insertion point", definition: "target을 정렬 순서를 유지하며 넣을 첫 위치입니다.", detail: ["negative result에서 복원합니다.", "0..length 범위입니다."] },
        { term: "duplicate match", definition: "동일 값이 여러 개일 때 반환될 수 있는 임의의 일치 index입니다.", detail: ["first를 보장하지 않습니다.", "별도 정책이 필요합니다."] },
      ],
      codeExamples: [
        {
          id: "java-binary-search-insertion-point",
          title: "found·missing insertion point·duplicate match를 분리합니다",
          language: "java",
          filename: "src/learning/java09/BinarySearchLab.java",
          purpose: "negative encoding을 안전하게 해석하고 duplicate index를 과도하게 고정하지 않습니다.",
          code: String.raw`package learning.java09;

import java.util.Arrays;

public class BinarySearchLab {
    public static void main(String[] args) {
        int[] sorted = {10, 20, 30, 40};
        int found = Arrays.binarySearch(sorted, 20);
        int missing = Arrays.binarySearch(sorted, 25);
        int insertionPoint = -missing - 1;
        int[] duplicates = {1, 2, 2, 2, 3};
        int duplicateIndex = Arrays.binarySearch(duplicates, 2);
        System.out.println("found20=" + found);
        System.out.println("missing25=" + missing + ",insert=" + insertionPoint);
        System.out.println("duplicateFound=" + (duplicateIndex >= 1 && duplicateIndex <= 3)
                + ",value=" + duplicates[duplicateIndex]);
    }
}`,
          walkthrough: [
            { lines: "7-10", explanation: "20은 found, 25는 20과 30 사이 insertion point를 갖습니다." },
            { lines: "11-12", explanation: "2가 세 번인 정렬 배열에서 구현이 고른 일치 index를 받습니다." },
            { lines: "13-16", explanation: "missing encoding -3과 insertion 2, duplicate valid range/value만 검증합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java09/BinarySearchLab.java && java -cp build/classes learning.java09.BinarySearchLab" },
          output: { value: "found20=1\nmissing25=-3,insert=2\nduplicateFound=true,value=2", explanation: ["25의 insertion point 2는 index 2의 30 앞입니다.", "duplicate는 exact index가 아니라 일치 range와 value를 검증합니다."] },
          experiments: [
            { change: "25를 5로 바꿉니다.", prediction: "result=-1, insertion point=0입니다.", result: "맨 앞 insertion을 확인합니다." },
            { change: "25를 50으로 바꿉니다.", prediction: "result=-5, insertion point=4입니다.", result: "length 위치 insertion을 확인합니다." },
            { change: "sorted를 [30,10,40,20]으로 바꿉니다.", prediction: "return 의미는 보장되지 않습니다.", result: "unsorted 결과를 golden success/failure로 주장하지 않습니다." },
          ],
          sourceRefs: ["java-day07-arrays-api", "java-arrays-api"],
        },
      ],
      diagnostics: [{ symptom: "배열에 값이 있는데 binarySearch가 음수를 반환한다.", likelyCause: "정렬하지 않았거나 sort와 search ordering이 다릅니다.", checks: ["sortedness를 검증합니다.", "Comparator config를 비교합니다.", "search range를 확인합니다."], fix: "동일 ordering으로 방어 복사·sort 후 search하거나 sorted collection/index를 사용합니다.", prevention: "sort+search를 한 abstraction으로 묶고 found·front/middle/end insertion·duplicates를 test합니다." }],
    },
    {
      id: "equality-hash-mismatch-nested-content",
      title: "배열 content equality·hash·mismatch와 nested deep comparison을 일관되게 사용합니다",
      lead: "Object identity semantics를 value semantics로 착각하지 않습니다.",
      explanations: [
        "array equals와 hashCode는 Object identity 기반이므로 같은 contents의 서로 다른 arrays를 value처럼 비교하지 않습니다.",
        "Arrays.equals와 Arrays.hashCode는 1차원 elements를 같은 규칙으로 처리해 content-equal arrays가 같은 content hash를 갖습니다.",
        "Arrays.mismatch는 처음 다른 index를 반환하고 차이가 없으면 -1입니다. diff report에 유용합니다.",
        "nested array에 Arrays.equals를 쓰면 inner arrays를 identity로 비교하므로 deepEquals·deepHashCode·deepToString을 선택합니다.",
        "mutable array를 hash key로 직접 쓰지 말고 immutable contents wrapper·snapshot을 사용합니다.",
      ],
      concepts: [
        { term: "content equality", definition: "같은 length에서 대응 elements가 정의된 equals 규칙으로 모두 같은 관계입니다.", detail: ["Arrays.equals를 씁니다.", "identity와 다릅니다."] },
        { term: "mismatch index", definition: "두 arrays에서 처음으로 다른 component 위치이며 동일하면 -1입니다.", detail: ["diff 위치를 줍니다.", "length 차이도 반영합니다."] },
        { term: "deep equality", definition: "nested arrays의 inner contents까지 재귀적으로 비교하는 관계입니다.", detail: ["deepEquals를 씁니다.", "cycle에는 주의합니다."] },
      ],
      codeExamples: [
        {
          id: "java-array-content-equality",
          title: "identity·content·hash·mismatch·nested deep equality를 비교합니다",
          language: "java",
          filename: "src/learning/java09/EqualityLab.java",
          purpose: "value-like 배열 비교의 올바른 API 조합을 실행합니다.",
          code: String.raw`package learning.java09;

import java.util.Arrays;

public class EqualityLab {
    public static void main(String[] args) {
        int[] left = {1, 2};
        int[] right = {1, 2};
        System.out.println("identity=" + (left == right) + ",content=" + Arrays.equals(left, right));
        System.out.println("hashEqual=" + (Arrays.hashCode(left) == Arrays.hashCode(right))
                + ",mismatch=" + Arrays.mismatch(left, right));
        right[1] = 9;
        System.out.println("changedContent=" + Arrays.equals(left, right)
                + ",mismatch=" + Arrays.mismatch(left, right));
        int[][] nestedA = {{1, 2}};
        int[][] nestedB = {{1, 2}};
        System.out.println("nestedShallow=" + Arrays.equals(nestedA, nestedB)
                + ",nestedDeep=" + Arrays.deepEquals(nestedA, nestedB));
    }
}`,
          walkthrough: [
            { lines: "7-10", explanation: "서로 다른 arrays가 identity false지만 contents·content hash는 같습니다." },
            { lines: "11-13", explanation: "right index 1 변경 뒤 처음 mismatch가 1입니다." },
            { lines: "14-17", explanation: "nested shallow는 inner identity 때문에 false, deep은 contents 때문에 true입니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java09/EqualityLab.java && java -cp build/classes learning.java09.EqualityLab" },
          output: { value: "identity=false,content=true\nhashEqual=true,mismatch=-1\nchangedContent=false,mismatch=1\nnestedShallow=false,nestedDeep=true", explanation: ["content equality와 hash consistency가 유지됩니다.", "nested arrays는 deep API가 필요합니다."] },
          experiments: [
            { change: "right를 {1,2,9}로 만들고 right[1] 변경 전 equal-prefix 비교를 별도로 실행합니다.", prediction: "공통 prefix가 같은 index 0·1 뒤 length 차이가 시작되는 mismatch=2입니다.", result: "value mismatch와 length mismatch 시점을 구분합니다." },
            { change: "Arrays.deepEquals를 Arrays.equals로 통일합니다.", prediction: "nested contents가 같아도 false입니다.", result: "자료 구조 깊이에 맞는 API를 고릅니다." },
            { change: "StringBuilder[]을 Arrays.equals로 비교합니다.", prediction: "같은 text라도 다른 builders는 false입니다.", result: "element equals semantics도 계약 일부입니다." },
          ],
          sourceRefs: ["java-arrays-api", "java-object-api"],
        },
      ],
      diagnostics: [{ symptom: "같은 숫자가 든 두 배열의 equals가 false다.", likelyCause: "array 자체 Object.equals identity semantics를 호출했습니다.", checks: ["호출 receiver와 Arrays.equals를 구분합니다.", "nested 여부를 봅니다.", "element equals semantics를 확인합니다."], fix: "1차원은 Arrays.equals/hashCode, nested는 deepEquals/deepHashCode를 짝으로 사용합니다.", prevention: "identity/content/deep cases와 hash consistency test를 둡니다." }],
    },
    {
      id: "manual-exchange-sort-complexity-tests",
      title: "원본 수동 정렬은 매 비교마다 교환할 수 있는 exchange-style O(n²) 알고리즘입니다",
      lead: "이름을 과장하지 않고 비교·교환 수와 결과 properties를 Arrays.sort로 교차 검증합니다.",
      explanations: [
        "outer i마다 j=i+1..end를 비교해 su[i]>su[j]이면 즉시 swap합니다. 한 번만 최소값을 골라 swap하는 전형적 selection sort와 다릅니다.",
        "length 14이면 input과 무관하게 comparisons는 14×13/2=91입니다. swaps는 순서에 따라 달라지고 원본 fixture에서는 48입니다.",
        "동일 key objects가 중간 swaps로 상대 순서를 잃을 수 있어 stable sort로 가정하지 않습니다.",
        "학습 구현은 loop·swap 이해에 유용하지만 production은 검증·최적화된 Arrays.sort를 우선합니다.",
        "정렬 test는 exact example뿐 아니라 nondecreasing sortedness, 원소 multiset, length, input ownership을 검증합니다.",
      ],
      concepts: [
        { term: "exchange sort", definition: "앞 위치보다 작은 뒤 원소를 발견할 때마다 즉시 교환하는 단순 quadratic 정렬 형태입니다.", detail: ["비교 수는 n(n-1)/2입니다.", "selection sort와 swap 수가 다릅니다."] },
        { term: "sortedness property", definition: "모든 인접 pair에서 previous<=current가 성립하는 조건입니다.", detail: ["예시 밖 입력도 검증합니다.", "Comparator와 맞춥니다."] },
        { term: "permutation property", definition: "정렬 전후 값과 중복 횟수가 동일하다는 조건입니다.", detail: ["값 손실을 막습니다.", "oracle로 검증합니다."] },
      ],
      codeExamples: [
        {
          id: "java-exchange-sort-cost",
          title: "원본 14개 값의 91 comparisons·48 swaps를 검증합니다",
          language: "java",
          filename: "src/learning/java09/ExchangeSortLab.java",
          purpose: "원본 알고리즘을 계측하고 standard sort 결과와 교차 검증합니다.",
          code: String.raw`package learning.java09;

import java.util.Arrays;

public class ExchangeSortLab {
    record Result(int[] values, int comparisons, int swaps) {}
    static Result sort(int[] input) {
        int[] values = input.clone();
        int comparisons = 0, swaps = 0;
        for (int i = 0; i < values.length - 1; i++) {
            for (int j = i + 1; j < values.length; j++) {
                comparisons++;
                if (values[i] > values[j]) {
                    int temp = values[i]; values[i] = values[j]; values[j] = temp;
                    swaps++;
                }
            }
        }
        return new Result(values, comparisons, swaps);
    }
    public static void main(String[] args) {
        int[] input = {3, 4, 9, 8, 2, 1, 7, 10, 5, 6, 2, 4, 2, 4};
        Result result = sort(input);
        int[] oracle = input.clone(); Arrays.sort(oracle);
        System.out.println("sorted=" + Arrays.toString(result.values()));
        System.out.println("comparisons=" + result.comparisons() + ",swaps=" + result.swaps());
        System.out.println("matchesOracle=" + Arrays.equals(result.values(), oracle));
        System.out.println("inputUnchanged=" + Arrays.equals(input, new int[]{3, 4, 9, 8, 2, 1, 7, 10, 5, 6, 2, 4, 2, 4}));
    }
}`,
          walkthrough: [
            { lines: "7-19", explanation: "defensive clone을 정렬하며 모든 i<j pair를 비교하고 즉시 swap을 계측합니다." },
            { lines: "21-24", explanation: "원본 14개 input과 Arrays.sort oracle을 준비합니다." },
            { lines: "25-28", explanation: "결과·cost·oracle equality·input 비변경을 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java09/ExchangeSortLab.java && java -cp build/classes learning.java09.ExchangeSortLab" },
          output: { value: "sorted=[1, 2, 2, 2, 3, 4, 4, 4, 5, 6, 7, 8, 9, 10]\ncomparisons=91,swaps=48\nmatchesOracle=true\ninputUnchanged=true", explanation: ["14 choose 2는 91 comparisons입니다.", "원본 fixture는 48 swaps이고 oracle·input ownership 계약을 만족합니다."] },
          experiments: [
            { change: "이미 정렬된 input을 넣습니다.", prediction: "comparisons는 여전히 91, swaps는 0입니다.", result: "early-exit 없는 quadratic algorithm입니다." },
            { change: "length 0·1을 넣습니다.", prediction: "comparisons=0, swaps=0이고 그대로 반환합니다.", result: "최소 boundaries를 검증합니다." },
            { change: "input.clone을 제거합니다.", prediction: "호출자 배열이 변경돼 inputUnchanged=false입니다.", result: "mutation ownership을 API 계약에 둡니다." },
          ],
          sourceRefs: ["java-day08-exchange-sort", "java-arrays-api"],
        },
      ],
      diagnostics: [
        { symptom: "수동 정렬을 selection sort라 불렀지만 swaps가 n-1보다 훨씬 많다.", likelyCause: "최솟값 index를 찾은 뒤 한 번 교환하지 않고 더 작은 값을 볼 때마다 즉시 교환합니다.", checks: ["swap 위치를 봅니다.", "inner loop당 swaps를 셉니다.", "pseudocode와 비교합니다."], fix: "exchange-style로 명명하거나 minIndex를 찾은 뒤 outer당 최대 한 번 swap하는 selection sort로 바꿉니다.", prevention: "comparisons·swaps·stability를 설명에 포함합니다." },
        { symptom: "정렬 결과는 맞지만 호출자 원본 순서가 사라졌다.", likelyCause: "in-place mutation을 문서화하거나 방어 복사하지 않았습니다.", checks: ["sort 전후 identity를 봅니다.", "aliases를 찾습니다.", "API 이름을 확인합니다."], fix: "mutating API임을 드러내거나 clone한 snapshot을 정렬해 반환합니다.", prevention: "inputUnchanged·alias visibility test를 둡니다." },
      ],
      comparisons: [{ title: "배열 정렬 전략 선택", options: [
        { name: "Arrays.sort in-place", chooseWhen: "호출자가 mutation을 허용하고 표준 정렬이 필요할 때", avoidWhen: "원본 order가 다른 consumer에 필요할 때", tradeoffs: ["검증된 구현입니다.", "입력 array가 변경됩니다."] },
        { name: "defensive-copy sort", chooseWhen: "immutable snapshot과 원본 보존이 필요할 때", avoidWhen: "큰 배열에서 copy memory budget이 없을 때", tradeoffs: ["alias side effect를 막습니다.", "O(n) 추가 memory가 듭니다."] },
        { name: "수동 exchange sort", chooseWhen: "중첩 loop·swap·O(n²) 학습일 때", avoidWhen: "production 성능·유지보수가 중요할 때", tradeoffs: ["동작이 보입니다.", "quadratic이며 swap이 많습니다."] },
      ] }],
      expertNotes: ["sort/search pipeline은 ordering policy를 함께 보존해 comparator drift를 막습니다.", "대용량 primitive data는 copy peak memory와 GC pressure를 계산하고 external sort를 검토합니다."],
    },
  ],
  lab: {
    title: "방어 복사 기반 배열 snapshot·정렬·검색 pipeline",
    scenario: "외부 int[]을 받아 원본을 변경하지 않고 길이 budget·null 정책을 검증한 뒤 정렬 snapshot, target search/insertion point, equality·mismatch report를 반환합니다.",
    setup: ["JDK 21과 UTF-8 source를 준비합니다.", "InputPolicy·OrderingPolicy·ArraySnapshot records를 분리합니다.", "synthetic numeric fixtures만 사용합니다."],
    steps: ["null reject/empty 정책과 maximum length를 정합니다.", "input.clone으로 ownership을 분리합니다.", "snapshot을 sort하고 sortedness·permutation을 검증합니다.", "binarySearch를 FOUND 또는 MISSING(insertionPoint)로 변환합니다.", "identity·content equality·mismatch를 report에 담습니다.", "mutable object[]에는 element copy factory를 요구합니다.", "empty·single·duplicates·reverse·missing front/middle/end·oversize를 test합니다.", "오류에는 raw contents를 노출하지 않습니다."],
    expectedResult: ["호출자 input order가 보존됩니다.", "snapshot은 sortedness·permutation properties를 만족합니다.", "sort와 search ordering이 동일하고 insertion point가 보존됩니다.", "null·oversize·mutable sharing이 명시적 정책으로 처리됩니다."],
    cleanup: ["temp classes는 resolved parent 확인 뒤 생성 root만 제거합니다.", "원본 sources는 변경하지 않습니다.", "큰 arrays references를 lab scope 밖에 보존하지 않습니다."],
    extensions: ["generic reference snapshot과 Comparator를 함께 보존합니다.", "Collator 설정을 versioned policy로 만듭니다.", "property-based sortedness·permutation·idempotence tests를 추가합니다.", "peak memory budget report를 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "int[5]의 defaults·index·length·indexed/enhanced traversal을 비교하세요.", requirements: ["default zeros와 empty를 출력합니다.", "-1·0·length-1·length를 실행합니다.", "enhanced local과 indexed slot mutation을 비교합니다."], hints: ["Arrays.toString을 사용하세요.", "bounds failure type을 고정하세요."], expectedOutcome: "allocation·valid domain·mutation target을 설명합니다.", solutionOutline: ["new int[5]/[0]을 만듭니다.", "경계 access를 분리합니다.", "before/after를 비교합니다."] },
    { difficulty: "응용", prompt: "입력을 방어 복사해 sort하고 targets의 found/insertion point를 반환하세요.", requirements: ["원본 비변경을 assertion합니다.", "동일 ordering을 씁니다.", "duplicates exact index를 고정하지 않습니다.", "front/middle/end insertion과 oversize를 test합니다."], hints: ["negative result는 -r-1입니다.", "equals와 mismatch를 사용하세요."], expectedOutcome: "ownership과 search precondition이 보존됩니다.", solutionOutline: ["clone→sort→search→result로 나눕니다.", "properties를 검증합니다."] },
    { difficulty: "설계", prompt: "mutable domain objects의 snapshot API를 shallow/deep 선택과 함께 설계하세요.", requirements: ["array/element identity를 정의합니다.", "copy factory 또는 immutability를 선택합니다.", "equals/hash/mismatch·Comparator·null·budget을 포함합니다.", "mutation isolation tests를 작성합니다."], hints: ["container copy만으로 deep이라 부르지 마세요.", "ordering metadata를 보존하세요."], expectedOutcome: "공유 mutation과 ordering drift를 막는 snapshot contract가 됩니다.", solutionOutline: ["copy depth와 element copier를 정의합니다.", "aliases를 test합니다.", "정렬·검색·동등성 policy를 묶습니다."] },
  ],
  reviewQuestions: [
    { question: "선언과 new allocation의 차이는 무엇인가요?", answer: "선언은 reference variable만 만들고 new가 fixed length array object를 생성합니다." },
    { question: "new int[3]과 new String[2]의 defaults는 무엇인가요?", answer: "int slots는 0, String slots는 null입니다." },
    { question: "0-length와 null은 어떻게 다른가요?", answer: "0-length는 object가 있고 null은 없어 length 접근도 NPE입니다." },
    { question: "유효 마지막 index는 무엇인가요?", answer: "non-empty array에서 length-1입니다." },
    { question: "`[I@...`는 실제 주소인가요?", answer: "아닙니다. runtime class와 Object hash 기반 문자열 표현입니다." },
    { question: "배열 대입은 contents를 복사하나요?", answer: "아닙니다. 같은 object의 alias를 만듭니다." },
    { question: "enhanced local 재대입이 slot을 바꾸지 않는 이유는 무엇인가요?", answer: "component value가 local variable에 복사되고 index에 쓰지 않기 때문입니다." },
    { question: "String[]을 Object[]로 보고 Integer를 넣으면 왜 실패하나요?", answer: "runtime component type String[]의 store check 때문입니다." },
    { question: "object array clone은 deep copy인가요?", answer: "아닙니다. element references를 공유하는 shallow copy입니다." },
    { question: "copyOfRange end는 포함되나요?", answer: "아닙니다. [from,to)이고 source 끝 초과는 default padding될 수 있습니다." },
    { question: "sort 원본 보존 방법은 무엇인가요?", answer: "clone/copyOf snapshot을 정렬합니다." },
    { question: "String natural order는 locale 사전순인가요?", answer: "아닙니다. UTF-16 lexicographic order이며 locale에는 Collator가 필요합니다." },
    { question: "binarySearch 전제는 무엇인가요?", answer: "같은 ordering으로 정렬돼 있어야 합니다." },
    { question: "result -3의 insertion point는 무엇인가요?", answer: "-(-3)-1=2입니다." },
    { question: "duplicates 첫 index를 보장하나요?", answer: "아닙니다. first/last는 별도 정책입니다." },
    { question: "1차원/nested content 비교 API는 무엇인가요?", answer: "Arrays.equals/hashCode와 deepEquals/deepHashCode입니다." },
    { question: "원본이 전형적 selection sort가 아닌 이유는 무엇인가요?", answer: "더 작은 값을 볼 때마다 즉시 교환하기 때문입니다." },
    { question: "length 14 comparison 수는 왜 91인가요?", answer: "모든 i<j pair인 14×13/2이기 때문입니다." },
  ],
  completionChecklist: ["원본 5개·191행을 감사했다.", "identity text를 주소로 부르지 않았다.", "`int su2[]`와 권장 `int[] su2`가 같은 1차원 type임을 확인했다.", "constant narrowing과 String reference type을 설명했다.", "default·empty·negative allocation을 검증했다.", "index/null/empty matrix를 test했다.", "alias identity/content를 분리했다.", "enhanced local/indexed slot mutation을 실행했다.", "covariant store failure를 설명했다.", "array/element identity를 각각 검증했다.", "shallow/deep isolation과 arraycopy overlap을 test했다.", "copy truncate/padding/range를 실행했다.", "sort mutation·defensive copy를 선택했다.", "natural/locale ordering을 구분했다.", "sort/search ordering을 통일했다.", "insertion point·duplicates를 검증했다.", "equals/hash/mismatch/deep variants를 사용했다.", "exchange sort 91/48을 재현했다.", "sortedness·permutation·ownership을 test했다.", "length·copy peak memory budget을 정했다.", "raw contents를 운영 로그에 노출하지 않았다."],
  nextSessions: [],
  sources: [
    { id: "java-day07-array-basic", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day07/Ex08.java", usedFor: ["allocation/index", "identity correction", "length traversal"], evidence: "JDK 21.0.11 clean run 12 lines·blank 1; same int[] identity text와 values를 확인했습니다." },
    { id: "java-day07-array-init", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day07/Ex09.java", usedFor: ["char/double initializer", "constant narrowing", "invalid syntax"], evidence: "clean run J,A,V,A,J 5 lines입니다." },
    { id: "java-day07-string-array", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day07/Ex10.java", usedFor: ["reference array", "String correction", "traversal"], evidence: "clean run 7 lines·blank 1; first 고길동, last 마이콜입니다." },
    { id: "java-day07-arrays-api", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day07/Ex11.java", usedFor: ["search/copy/fill/sort", "padding", "String order"], evidence: "clean run 166 lines·blank 4; search 11과 range 3,4,5,0을 확인했습니다." },
    { id: "java-day08-exchange-sort", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day08/Ex01.java", usedFor: ["exchange sort", "duplicates", "quadratic cost"], evidence: "clean run 14 sorted values; 계측 91 comparisons·48 swaps입니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["JDK 21", "UTF-8", "Xlint"], evidence: "원본과 examples compiler 기준입니다." },
    { id: "jls-arrays", repository: "JLS SE 21", path: "Chapter 10 Arrays", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-10.html", usedFor: ["types/members/creation/initializers/runtime checks"], evidence: "배열의 primary specification입니다." },
    { id: "jls-array-creation-access", repository: "JLS SE 21", path: "15.10 Array Creation and Access", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.10", usedFor: ["creation/access/bounds/null"], evidence: "new와 index access 근거입니다." },
    { id: "jls-initial-values", repository: "JLS SE 21", path: "4.12.5 Initial Values", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.12.5", usedFor: ["component defaults"], evidence: "primitive/reference defaults 근거입니다." },
    { id: "jls-array-subtyping", repository: "JLS SE 21", path: "4.10.3 Array Subtyping", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.10.3", usedFor: ["covariance"], evidence: "String[]→Object[] 근거입니다." },
    { id: "jls-enhanced-for", repository: "JLS SE 21", path: "14.14.2 Enhanced for", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.14.2", usedFor: ["array iteration/local variable"], evidence: "enhanced traversal 근거입니다." },
    { id: "java-arrays-api", repository: "Java SE 21 API", path: "java.util.Arrays", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html", usedFor: ["display/copy/fill/sort/search/equality"], evidence: "utility 계약 근거입니다." },
    { id: "java-system-arraycopy", repository: "Java SE 21 API", path: "System.arraycopy", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html#arraycopy(java.lang.Object,int,java.lang.Object,int,int)", usedFor: ["overlap/range/type"], evidence: "bulk copy 근거입니다." },
    { id: "java-object-api", repository: "Java SE 21 API", path: "java.lang.Object", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html", usedFor: ["toString/identity equals/hash"], evidence: "identity 표현 교정 근거입니다." },
    { id: "java-array-store-exception", repository: "Java SE 21 API", path: "ArrayStoreException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ArrayStoreException.html", usedFor: ["covariant store"], evidence: "runtime store failure 근거입니다." },
    { id: "java-index-oob", repository: "Java SE 21 API", path: "ArrayIndexOutOfBoundsException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ArrayIndexOutOfBoundsException.html", usedFor: ["index bounds"], evidence: "access failure 근거입니다." },
    { id: "java-comparator-api", repository: "Java SE 21 API", path: "java.util.Comparator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html", usedFor: ["ordering/null policy"], evidence: "custom order 근거입니다." },
    { id: "java-collections-reverse", repository: "Java SE 21 API", path: "Collections.reverseOrder", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html#reverseOrder()", usedFor: ["boxed descending"], evidence: "reverse comparator 근거입니다." },
    { id: "java-string-api", repository: "Java SE 21 API", path: "String.compareTo", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html#compareTo(java.lang.String)", usedFor: ["UTF-16 natural order"], evidence: "String sort 근거입니다." },
    { id: "java-collator-api", repository: "Java SE 21 API", path: "java.text.Collator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/text/Collator.html", usedFor: ["locale ordering"], evidence: "사용자 표시순 근거입니다." },
    { id: "java-math-api", repository: "Java SE 21 API", path: "java.lang.Math exact methods", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html", usedFor: ["checked aggregate"], evidence: "overflow policy 근거입니다." },
  ],
  sourceCoverage: { filesRead: 5, filesUsed: 5, uncoveredNotes: ["다섯 파일의 총 191행과 warning 0을 확인했습니다.", "Ex08 `[I@hex`는 주소가 아닌 identity representation으로 교정했습니다.", "Ex08 comment의 `int su2[]`는 정상적인 1차원 대체 표기이고 Ex09 literal 65는 constant narrowing으로 한정했습니다.", "Ex11 binarySearch sorted 전제·range padding·UTF-16 ordering을 명시했습니다.", "Ex01은 selection/bubble이 아닌 exchange-style로 계측했습니다.", "covariance·deep copy·equality·Collator·property tests는 공식 문서 기반 보강입니다."] },
} satisfies DetailedSession;

export default session;
