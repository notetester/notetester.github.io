import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["java-10-multidimensional-ranking"],
  slug: "java-10-multidimensional-ranking",
  courseId: "java",
  moduleId: "java-language-control",
  order: 10,
  title: "다차원·가변 배열과 성적·순위 정책",
  subtitle: "array-of-arrays의 shape·null row를 검증하고 성적 schema·평균 rounding·학점·동점 순위·정렬을 타입 안전한 pipeline으로 재설계합니다.",
  level: "중급",
  estimatedMinutes: 540,
  coreQuestion: "서로 다른 row shape와 파생값을 가진 표를 정보 손실 없이 검증하고, 평균·학점·동점 순위 정책을 일관되게 적용하려면 어떻게 모델링해야 할까요?",
  summary: "javastudy day08 Ex03·Ex05·Ex07·Ex08·Ex09를 OpenJDK 21.0.11에서 clean compile·run했습니다. Ex05·Ex07의 `[[I@...`는 실제 주소가 아니라 array identity text이고, Java의 int[][]는 독립 row references를 담는 array-of-arrays입니다. Ex03은 parallel arrays를 함께 swap하며 평균을 한 자리에서 truncate하고, Ex08·09는 `[번호,국어,영어,수학,총점,평균,학점,순위]` magic columns를 int[]로 표현합니다. Ex08의 평균 60→F는 Ex09의 D threshold와 충돌합니다. 원본 rank는 더 높은 총점 수+1인 competition rank이며 동점 뒤 gap이 생깁니다. 이를 shape policy·null/empty/jagged traversal·typed record schema·checked total·BigDecimal display rounding·grade boundary·competition/dense/ordinal rank·stable deterministic sort·input/allocation budget·O(n log n) refactor·property tests로 확장합니다.",
  objectives: [
    "int[][]를 단일 연속 matrix가 아닌 int[] references를 담은 outer array로 설명할 수 있다.",
    "rectangular·jagged·null row·empty row를 구분하고 row별 length로 안전하게 순회할 수 있다.",
    "parallel arrays·magic columns의 무결성 위험을 record 기반 domain model로 리팩터링할 수 있다.",
    "학생수·ID·점수·row shape·allocation budget을 계산 전에 검증할 수 있다.",
    "총점 overflow와 integer division·truncate·display rounding·grade input 값을 구분할 수 있다.",
    "competition·dense·ordinal 동점 순위의 차이를 구현하고 요구 정책으로 선택할 수 있다.",
    "row reference swap과 Comparator record sort의 정합성·안정성·tie-break를 검증할 수 있다.",
    "rank O(n²) 원본을 O(n log n) sort+scan으로 바꾸고 invariants·properties로 검증할 수 있다.",
  ],
  prerequisites: [{ title: "1차원 배열·참조·복사·정렬·검색", reason: "다차원 배열은 1차원 row arrays의 references이며 aliasing·copy·sort·bounds·ordering 계약을 그대로 확장합니다.", sessionSlug: "java-09-arrays" }],
  keywords: ["multidimensional array", "array of arrays", "rectangular", "jagged", "null row", "schema", "parallel arrays", "record", "average", "RoundingMode", "grade", "competition rank", "dense rank", "ordinal rank", "tie-break", "invariant"],
  chapters: [
    {
      id: "five-source-golden-audit",
      title: "다섯 원본의 shape·성적·순위 output을 비결정 identity와 분리합니다",
      lead: "interactive Ex09도 synthetic input을 고정해 prompt·결과·종료를 재현합니다.",
      explanations: [
        "Ex03은 8행으로 총점 descending 순 고·김·홍·이·박과 300·285·265·255·215, truncated averages 100.0·95.0·88.3·85.0·71.6을 출력합니다.",
        "Ex05는 11행·blank 1개이며 outer `[[I@hex`와 row `[I@hex` 두 개 뒤 값 10과 전체 6 cells를 출력합니다. hex는 고정하지 않습니다.",
        "Ex07은 30행·blank 3개로 outer identity, null rows 3개, lengths 2·4·5의 int rows, lengths 4·3·2의 JAVA/JSP/AI char rows를 보여 줍니다.",
        "Ex08은 5행으로 rank 순 4·5·1·2·3을 출력합니다. ID 3은 total 180·average 60인데 grade F라 Ex09의 D>=60 정책과 불일치합니다.",
        "Ex09에 학생 2명, ID 101 점수 90·80·70, ID 102 점수 100·100·100, 재실행 2를 넣으면 12행 prompt/result가 나오고 102가 rank 1입니다.",
      ],
      concepts: [
        { term: "shape evidence", definition: "outer rows 수, 각 row null/length, total cells로 array-of-arrays 구조를 기록한 근거입니다.", detail: ["identity text와 분리합니다.", "jagged를 보존합니다."] },
        { term: "policy inconsistency", definition: "같은 domain boundary가 서로 다른 source에서 다른 결과를 내는 상태입니다.", detail: ["60→F/D가 예입니다.", "versioned policy가 필요합니다."] },
        { term: "synthetic input fixture", definition: "개인정보 없이 interactive main의 모든 token과 종료 선택을 고정한 입력입니다.", detail: ["결정적 재현이 됩니다.", "raw user data를 쓰지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "java-original-multidimensional-audit",
          title: "다섯 main을 실행해 identity를 제외한 shape·성적 boundaries를 고정합니다",
          language: "powershell",
          filename: "verify-original-multidimensional.ps1",
          purpose: "원본을 변경하지 않고 Ex09까지 deterministic하게 회귀 검증합니다.",
          code: String.raw`$base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$root = Join-Path $base ("java10-original-" + [Guid]::NewGuid().ToString("N"))
if (Test-Path $root) { throw "unexpected temp collision" }
New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
try {
  $files = @(
    "src\com\ictedu\day08\Ex03.java", "src\com\ictedu\day08\Ex05.java",
    "src\com\ictedu\day08\Ex07.java", "src\com\ictedu\day08\Ex08.java",
    "src\com\ictedu\day08\Ex09.java"
  )
  javac -encoding UTF-8 -Xlint:all -d $root $files
  if ($LASTEXITCODE -ne 0) { throw "compile failed" }
  $a = @(& java -cp $root com.ictedu.day08.Ex03); if ($LASTEXITCODE -ne 0) { throw "Ex03 failed" }
  $b = @(& java -cp $root com.ictedu.day08.Ex05); if ($LASTEXITCODE -ne 0) { throw "Ex05 failed" }
  $c = @(& java -cp $root com.ictedu.day08.Ex07); if ($LASTEXITCODE -ne 0) { throw "Ex07 failed" }
  $d = @(& java -cp $root com.ictedu.day08.Ex08); if ($LASTEXITCODE -ne 0) { throw "Ex08 failed" }
  $fixture = (@("2","101","90","80","70","102","100","100","100","2") -join [Environment]::NewLine) + [Environment]::NewLine
  $e = @($fixture | & java -cp $root com.ictedu.day08.Ex09); if ($LASTEXITCODE -ne 0) { throw "Ex09 failed" }
  "Ex03=lines:$($a.Count),first:$($a[0].TrimEnd()),last:$($a[-1].TrimEnd())"
  "Ex05=lines:$($b.Count),blank:$(@($b | Where-Object {[string]::IsNullOrEmpty($_)}).Count),arrayText:$(@($b | Where-Object {$_ -match '^\[{1,2}I@'}).Count),values:$(@($b | Where-Object {$_ -notmatch '^\[{1,2}I@' -and -not [string]::IsNullOrEmpty($_)}) -join '|')"
  "Ex07=lines:$($c.Count),blank:$(@($c | Where-Object {[string]::IsNullOrEmpty($_)}).Count),nulls:$(@($c | Where-Object {$_ -eq 'null'}).Count),separators:$(@($c | Where-Object {$_ -eq '===='}).Count),last:$($c[-2])"
  "Ex08=lines:$($d.Count),first:$(($d[0].TrimEnd() -replace [char]9,',')),last:$(($d[-1].TrimEnd() -replace [char]9,','))"
  "Ex09=lines:$($e.Count),first:$($e[0]),rows:$(($e[9].TrimEnd() -replace [char]9,','))|$(($e[10].TrimEnd() -replace [char]9,',')),last:$($e[-1].TrimEnd())"
} finally {
  $resolved = [IO.Path]::GetFullPath($root)
  if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw "unsafe cleanup" }
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}`,
          walkthrough: [
            { lines: "1-4", explanation: "system temp 바로 아래 GUID root를 생성합니다." },
            { lines: "6-13", explanation: "다섯 원본을 UTF-8·Xlint clean compile합니다." },
            { lines: "14-19", explanation: "네 non-interactive mains와 synthetic input Ex09를 실행하고 각 exit를 검사합니다." },
            { lines: "20-24", explanation: "line/blank/null/identity-text count와 tab-normalized result boundaries를 출력합니다." },
            { lines: "25-29", explanation: "resolved parent를 확인한 뒤 생성 root만 제거합니다." },
          ],
          run: { environment: ["PowerShell 7+", "OpenJDK 21", "javastudy MyJavaProject root"], command: "pwsh -NoProfile -File verify-original-multidimensional.ps1" },
          output: { value: "Ex03=lines:8,first:이름: 고 김 홍 이 박,last:순위: 1 2 3 4 5\nEx05=lines:11,blank:1,arrayText:3,values:10|10|20|100|200|1|2\nEx07=lines:30,blank:3,nulls:3,separators:3,last:I\nEx08=lines:5,first:4,300,100,A,1,last:3,180,60,F,5\nEx09=lines:12,first:총 학생수 입력>>,rows:102,300,100,A,1|101,240,80,B,2,last:다시할까요?(1.yes, 2.no) >>", explanation: ["identity hash suffix는 output에서 제외합니다.", "Ex08 60→F와 Ex09 threshold policy는 별도 inconsistency로 기록합니다.", "Ex09 fixture는 synthetic IDs만 사용합니다."] },
          experiments: [
            { change: "Ex08 ID3 grade를 D로 바꿉니다.", prediction: "마지막 row가 3,180,60,D,5가 되어 Ex09 threshold와 일치합니다.", result: "single GradePolicy를 사용합니다." },
            { change: "Ex07 outer row 하나를 null로 유지합니다.", prediction: "그 row length access에서 NPE가 납니다.", result: "null row policy를 traversal 전에 적용합니다." },
            { change: "Ex09 score 하나를 101로 넣습니다.", prediction: "원본은 그대로 계산하지만 개선 pipeline은 INVALID_SCORE로 거부합니다.", result: "원본 behavior와 권장 validation을 분리합니다." },
          ],
          sourceRefs: ["java-day08-parallel-score", "java-day08-rectangular", "java-day08-jagged", "java-day08-score-rows", "java-day08-score-input", "jdk21-javac"],
        },
      ],
      diagnostics: [{ symptom: "Ex08의 60점이 F인데 Ex09에서는 D다.", likelyCause: "row에 derived grade를 hard-code하고 계산 policy와 동기화하지 않았습니다.", checks: ["total/average/grade를 재계산합니다.", "60 boundary를 두 sources에서 비교합니다.", "derived fields 저장 지점을 찾습니다."], fix: "점수만 source of truth로 저장하고 versioned GradePolicy로 grade를 계산합니다.", prevention: "59·60·69·70·79·80·89·90 boundaries를 모든 adapters에 공통 contract test합니다." }],
    },
    {
      id: "array-of-arrays-allocation-model",
      title: "int[][]는 int[] references를 담은 outer array이며 rows는 독립 objects입니다",
      lead: "rectangular syntax도 row 교체를 막는 immutable matrix type은 아닙니다.",
      explanations: [
        "`new int[2][3]`은 length 2 outer array와 length 3 inner arrays 두 개를 만들고 모든 cells를 0으로 초기화합니다.",
        "outer runtime type은 `[[I`, 각 row는 `[I`이며 outer·rows는 서로 다른 objects입니다.",
        "rectangular allocation 뒤에도 matrix[0]=new int[1] 또는 null로 바꿀 수 있어 shape invariant는 type이 자동 유지하지 않습니다.",
        "`new int[3][]`은 outer만 만들고 세 slots는 null입니다. 접근할 row만 생성해도 합법이며 모든 row를 반드시 만들 필요는 없습니다.",
        "2D numeric grid가 연속 memory라는 성능 가정을 하지 않고 total cells와 row overhead·locality를 실제 모델로 계산합니다.",
      ],
      concepts: [
        { term: "outer array", definition: "row arrays에 대한 references를 components로 갖는 최상위 array입니다.", detail: ["length는 row 수입니다.", "slots는 null 가능입니다."] },
        { term: "row array", definition: "각 outer slot이 가리키는 독립 1차원 component array입니다.", detail: ["length가 서로 다를 수 있습니다.", "교체·공유 가능합니다."] },
        { term: "rectangular allocation", definition: "생성 시 모든 non-null rows가 같은 length를 갖도록 만든 다차원 array 생성식입니다.", detail: ["후속 불변은 아닙니다.", "shape validation이 필요할 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "java-array-of-arrays-allocation",
          title: "rectangular rows와 outer-only null rows를 비교합니다",
          language: "java",
          filename: "src/learning/java10/ShapeAllocationLab.java",
          purpose: "runtime types·row lengths·default cells·null rows를 결정적으로 출력합니다.",
          code: String.raw`package learning.java10;

import java.util.Arrays;

public class ShapeAllocationLab {
    public static void main(String[] args) {
        int[][] rectangular = new int[2][3];
        int[][] outerOnly = new int[3][];
        System.out.println("outerType=" + rectangular.getClass().getName()
                + ",rowType=" + rectangular[0].getClass().getName());
        System.out.println("rect=rows:" + rectangular.length + ",lengths:"
                + rectangular[0].length + ',' + rectangular[1].length + ",cells=6");
        System.out.println("defaults=" + Arrays.deepToString(rectangular));
        System.out.println("outerOnly=nullRows=" + Arrays.stream(outerOnly).filter(row -> row == null).count());
        outerOnly[0] = new int[]{10, 20};
        outerOnly[1] = new int[0];
        outerOnly[2] = new int[]{1, 2, 3};
        System.out.println("jagged=lengths:2,0,3,cells=5");
    }
}`,
          walkthrough: [
            { lines: "7-8", explanation: "rectangular와 outer-only allocations를 나눕니다." },
            { lines: "9-14", explanation: "runtime array types, shape와 default cells를 출력합니다." },
            { lines: "15-19", explanation: "초기 null rows 세 개를 확인한 뒤 2·0·3 lengths로 배정합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java10/ShapeAllocationLab.java && java -cp build/classes learning.java10.ShapeAllocationLab" },
          output: { value: "outerType=[[I,rowType=[I\nrect=rows:2,lengths:3,3,cells=6\ndefaults=[[0, 0, 0], [0, 0, 0]]\nouterOnly=nullRows=3\njagged=lengths:2,0,3,cells=5", explanation: ["type name은 identity hash 없이 shape type만 보여 줍니다.", "empty row와 null row는 다릅니다."] },
          experiments: [
            { change: "rectangular[0]=new int[1]로 교체합니다.", prediction: "compile·run되지만 shape는 lengths 1,3인 jagged가 됩니다.", result: "rectangular는 영구 type invariant가 아닙니다." },
            { change: "outerOnly[1]을 null로 둡니다.", prediction: "outer는 유효하지만 그 row를 dereference하면 NPE입니다.", result: "null row policy를 정합니다." },
            { change: "두 outer slots에 같은 int[]을 넣습니다.", prediction: "한 row mutation이 두 row에서 보입니다.", result: "row aliasing을 검증합니다." },
          ],
          sourceRefs: ["java-day08-rectangular", "java-day08-jagged", "jls-arrays", "jls-initial-values", "java-arrays-api"],
        },
      ],
      diagnostics: [{ symptom: "new int[2][3]이었는데 나중에 row lengths가 달라졌다.", likelyCause: "row reference를 다른 length array 또는 null로 교체했습니다.", checks: ["row assignment를 검색합니다.", "각 row identity/length를 기록합니다.", "aliases를 확인합니다."], fix: "matrix boundary에서 defensive deep shape copy 또는 rectangular invariant validation을 적용합니다.", prevention: "생성 직후뿐 아니라 public operation 전후 shape property를 test합니다." }],
    },
    {
      id: "rectangular-jagged-null-empty-rows",
      title: "jagged·empty row는 정상 shape이고 null row는 별도 dereference 정책이 필요합니다",
      lead: "첫 row length를 전체 columns로 가정하지 않습니다.",
      explanations: [
        "jagged array는 rows마다 length가 다른 합법적인 구조이고 압축된 adjacency list·가변 응답에 유용합니다.",
        "empty row는 non-null length 0이라 안전하게 0회 순회하지만 null row는 row.length에서 실패합니다.",
        "rectangular-required API는 첫 non-null width를 기준으로 모든 row non-null·same length인지 검증합니다.",
        "jagged-accepted API는 row별 length와 total cells 합을 사용하고 null을 reject·skip·empty 중 명시적으로 선택합니다.",
        "outer length 0에서는 matrix[0] 접근이 실패하므로 width inference도 empty policy를 먼저 처리합니다.",
      ],
      concepts: [
        { term: "jagged array", definition: "rows가 서로 다른 lengths를 갖는 array-of-arrays입니다.", detail: ["Java에서 정상입니다.", "row별 순회가 필요합니다."] },
        { term: "empty row", definition: "null이 아닌 length 0 row array입니다.", detail: ["0회 순회합니다.", "shape에 포함됩니다."] },
        { term: "shape policy", definition: "null 허용·rectangular 요구·최대 rows/cells를 정한 API 계약입니다.", detail: ["진입에서 검증합니다.", "오류 위치를 줍니다."] },
      ],
      codeExamples: [
        {
          id: "java-matrix-shape-policy",
          title: "rectangular·jagged·null row를 distinct validation 결과로 반환합니다",
          language: "java",
          filename: "src/learning/java10/ShapePolicyLab.java",
          purpose: "shape를 암묵적으로 추측하지 않고 진입에서 분류합니다.",
          code: String.raw`package learning.java10;

public class ShapePolicyLab {
    static String requireRectangular(int[][] matrix) {
        if (matrix == null) return "NULL_MATRIX";
        if (matrix.length == 0) return "rect=0x0";
        if (matrix[0] == null) return "NULL_ROW_0";
        int width = matrix[0].length;
        for (int row = 1; row < matrix.length; row++) {
            if (matrix[row] == null) return "NULL_ROW_" + row;
            if (matrix[row].length != width) return "JAGGED_AT_" + row;
        }
        return "rect=" + matrix.length + 'x' + width;
    }
    static int cellsAllowJagged(int[][] matrix) {
        int cells = 0;
        for (int row = 0; row < matrix.length; row++) {
            if (matrix[row] == null) throw new IllegalArgumentException("NULL_ROW_" + row);
            cells = Math.addExact(cells, matrix[row].length);
        }
        return cells;
    }
    public static void main(String[] args) {
        System.out.println(requireRectangular(new int[][]{{1,2,3},{4,5,6}}));
        System.out.println(requireRectangular(new int[][]{{1,2},{3}}));
        System.out.println(requireRectangular(new int[][]{{1},null}));
        System.out.println("emptyRow=cells:" + cellsAllowJagged(new int[][]{{1,2},{}}));
    }
}`,
          walkthrough: [
            { lines: "4-14", explanation: "null matrix·empty outer·null first row·width mismatch를 순서대로 분류합니다." },
            { lines: "15-22", explanation: "jagged 허용 count도 null row는 명시적으로 거부하고 exact 합산합니다." },
            { lines: "23-28", explanation: "rect 2×3, jagged row1, null row1과 empty row를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java10/ShapePolicyLab.java && java -cp build/classes learning.java10.ShapePolicyLab" },
          output: { value: "rect=2x3\nJAGGED_AT_1\nNULL_ROW_1\nemptyRow=cells:2", explanation: ["jagged와 null은 다른 결과입니다.", "empty row는 cells를 추가하지 않지만 유효합니다."] },
          experiments: [
            { change: "outer empty를 넣습니다.", prediction: "rect=0x0입니다.", result: "matrix[0]을 읽지 않습니다." },
            { change: "first row empty, second length1로 둡니다.", prediction: "JAGGED_AT_1입니다.", result: "width 0도 rectangular 기준이 될 수 있습니다." },
            { change: "cellsAllowJagged에서 null을 skip합니다.", prediction: "count는 가능하지만 missing과 empty가 같아집니다.", result: "skip을 선택하면 정보 손실을 문서화합니다." },
          ],
          sourceRefs: ["java-day08-jagged", "jls-arrays", "java-math-api"],
        },
      ],
      diagnostics: [{ symptom: "일부 입력에서 matrix[0].length부터 bounds/NPE가 난다.", likelyCause: "outer empty 또는 first row null을 검증하지 않고 width를 추론했습니다.", checks: ["matrix null·outer length를 봅니다.", "row0 null을 확인합니다.", "API가 rectangular를 요구하는지 봅니다."], fix: "shape policy 순서대로 null matrix→empty outer→row null→width consistency를 검증합니다.", prevention: "null/empty/jagged/rectangular shape matrix를 contract test합니다." }],
    },
    {
      id: "shape-aware-traversal-cell-count",
      title: "안전한 중첩 순회는 outer length와 각 row의 실제 length를 사용합니다",
      lead: "total cells는 rectangular 증명 전에는 rows×firstWidth가 아니라 row lengths의 합입니다.",
      explanations: [
        "outer loop는 matrix.length, inner loop는 matrix[row].length를 사용하면 jagged shape를 그대로 방문합니다.",
        "좌표를 함께 처리하려면 indexed loops가 자연스럽고 값만 aggregate하면 nested enhanced for도 사용할 수 있습니다.",
        "null row는 traversal 전에 reject하거나 명시 skip하고, empty row는 inner 0회로 정상 처리합니다.",
        "total cells와 sum은 각 row contributions를 checked arithmetic으로 누산해 overflow를 명시합니다.",
        "출력·serialization은 row boundary를 보존해야 flatten 뒤 원래 shape를 잃지 않습니다.",
      ],
      concepts: [
        { term: "shape-aware traversal", definition: "각 row의 실제 null/length를 확인하며 cells를 방문하는 순회입니다.", detail: ["jagged를 지원합니다.", "좌표를 보존합니다."] },
        { term: "cell count", definition: "모든 non-null rows lengths의 합으로 얻는 실제 component 수입니다.", detail: ["Σ row.length입니다.", "overflow를 검사합니다."] },
        { term: "coordinate", definition: "array-of-arrays cell을 식별하는 row·column index pair입니다.", detail: ["shape 안에서만 유효합니다.", "원본 mapping에 씁니다."] },
      ],
      codeExamples: [
        {
          id: "java-jagged-coordinate-traversal",
          title: "lengths 2·0·3의 5 cells를 좌표·합계와 함께 순회합니다",
          language: "java",
          filename: "src/learning/java10/ShapeTraversalLab.java",
          purpose: "empty row를 보존한 jagged traversal을 exact하게 검증합니다.",
          code: String.raw`package learning.java10;

public class ShapeTraversalLab {
    public static void main(String[] args) {
        int[][] matrix = {{10, 20}, {}, {1, 2, 3}};
        int cells = 0, sum = 0;
        StringBuilder coordinates = new StringBuilder();
        for (int row = 0; row < matrix.length; row++) {
            for (int column = 0; column < matrix[row].length; column++) {
                if (!coordinates.isEmpty()) coordinates.append('|');
                coordinates.append(row).append(',').append(column).append(':').append(matrix[row][column]);
                cells = Math.addExact(cells, 1);
                sum = Math.addExact(sum, matrix[row][column]);
            }
        }
        System.out.println("rows=" + matrix.length + ",cells=" + cells + ",sum=" + sum);
        System.out.println("coordinates=" + coordinates);
    }
}`,
          walkthrough: [
            { lines: "5-7", explanation: "lengths 2·0·3 jagged fixture와 counters를 준비합니다." },
            { lines: "8-15", explanation: "row마다 실제 length만 방문하고 좌표·count·sum을 exact 누산합니다." },
            { lines: "16-17", explanation: "shape summary와 ordered coordinates를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java10/ShapeTraversalLab.java && java -cp build/classes learning.java10.ShapeTraversalLab" },
          output: { value: "rows=3,cells=5,sum=36\ncoordinates=0,0:10|0,1:20|2,0:1|2,1:2|2,2:3", explanation: ["empty row 1은 좌표를 만들지 않지만 row count에 남습니다.", "실제 cells는 5이고 합은 36입니다."] },
          experiments: [
            { change: "inner bound를 matrix[0].length로 고정합니다.", prediction: "empty row에서 bounds failure이고 긴 row 일부를 놓칩니다.", result: "row별 length를 씁니다." },
            { change: "row 1을 null로 바꿉니다.", prediction: "현재 code는 NPE입니다.", result: "traversal 전 requireNonNull shape policy를 적용합니다." },
            { change: "sum을 int 최대 근처 cells로 바꿉니다.", prediction: "Math.addExact가 ArithmeticException입니다.", result: "합계 domain과 long/BigInteger 대안을 정합니다." },
          ],
          sourceRefs: ["java-day08-rectangular", "java-day08-jagged", "jls-enhanced-for", "java-math-api"],
        },
      ],
      diagnostics: [{ symptom: "jagged traversal에서 cells를 놓치거나 bounds exception이 난다.", likelyCause: "모든 rows가 첫 row와 같은 width라고 가정했습니다.", checks: ["row별 lengths를 출력합니다.", "inner bound source를 봅니다.", "null/empty rows를 구분합니다."], fix: "inner condition을 matrix[row].length로 바꾸고 null row policy를 먼저 적용합니다.", prevention: "lengths 0·1·n이 섞인 jagged fixtures와 exact coordinate golden을 둡니다." }],
    },
    {
      id: "score-table-schema-magic-index",
      title: "magic column int[8]과 parallel arrays를 typed records로 바꿔 파생값 drift를 막습니다",
      lead: "번호·점수·총점·평균·학점·순위는 같은 primitive type의 단순 columns가 아닙니다.",
      explanations: [
        "Ex08/09 row는 index 0..7 의미를 comment에 의존하고 grade char까지 int code unit으로 저장합니다. 잘못된 index도 compile됩니다.",
        "Ex03 parallel arrays는 모든 lengths가 같아야 하고 sort swap 때 name·scores·total·average·grade를 하나도 빠뜨리면 record alignment가 깨집니다.",
        "derived total·average·grade·rank를 입력 row에 함께 저장하면 원본 scores 수정 뒤 stale data가 남습니다.",
        "StudentScores record에는 source fields만 두고 Result record에서 checked total·policy-derived grade·rank를 만듭니다.",
        "legacy int[][] adapter는 row non-null·exact columns·ID·score ranges를 검증한 뒤 typed model로 즉시 변환합니다.",
      ],
      concepts: [
        { term: "magic column", definition: "숫자 index가 domain field 의미를 대신하고 compiler가 의미를 검증하지 못하는 schema입니다.", detail: ["상수를 최소 방어로 씁니다.", "type으로 승격합니다."] },
        { term: "parallel arrays", definition: "같은 record의 fields를 여러 arrays의 같은 index에 나눠 저장하는 구조입니다.", detail: ["길이·순서 동기화가 필요합니다.", "swap 누락 위험이 있습니다."] },
        { term: "derived field", definition: "다른 source fields와 policy에서 계산 가능한 값입니다.", detail: ["중복 저장은 drift 위험입니다.", "계산 시점을 정합니다."] },
      ],
      codeExamples: [
        {
          id: "java-score-schema-record",
          title: "legacy row를 검증해 source-only StudentScores로 변환합니다",
          language: "java",
          filename: "src/learning/java10/ScoreSchemaLab.java",
          purpose: "column count·grade code와 typed record 차이를 실행합니다.",
          code: String.raw`package learning.java10;

public class ScoreSchemaLab {
    record StudentScores(int id, int korean, int english, int math) {
        StudentScores {
            if (id <= 0) throw new IllegalArgumentException("INVALID_ID");
            if (korean < 0 || korean > 100 || english < 0 || english > 100 || math < 0 || math > 100)
                throw new IllegalArgumentException("INVALID_SCORE");
        }
        int total() { return Math.addExact(Math.addExact(korean, english), math); }
    }
    static StudentScores fromLegacy(int[] row) {
        if (row == null || row.length != 8) throw new IllegalArgumentException("INVALID_COLUMNS");
        return new StudentScores(row[0], row[1], row[2], row[3]);
    }
    public static void main(String[] args) {
        int[] legacy = {7, 90, 80, 70, 240, 80, 'B', 1};
        StudentScores student = fromLegacy(legacy);
        System.out.println("gradeCode=" + legacy[6] + ",gradeChar=" + (char) legacy[6]);
        System.out.println("student=id:" + student.id() + ",total:" + student.total());
        try { fromLegacy(new int[7]); }
        catch (IllegalArgumentException error) { System.out.println("shortRow=" + error.getMessage()); }
    }
}`,
          walkthrough: [
            { lines: "4-11", explanation: "record compact constructor가 ID·세 점수 domain을 보호하고 total을 exact 계산합니다." },
            { lines: "12-15", explanation: "legacy adapter는 exact 8 columns를 확인한 뒤 source fields만 가져옵니다." },
            { lines: "17-23", explanation: "int grade code 66→B, typed total 240과 short row 실패를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java10/ScoreSchemaLab.java && java -cp build/classes learning.java10.ScoreSchemaLab" },
          output: { value: "gradeCode=66,gradeChar=B\nstudent=id:7,total:240\nshortRow=INVALID_COLUMNS", explanation: ["legacy grade는 int code unit으로 저장돼 있습니다.", "typed model은 grade/rank를 stale source로 가져오지 않습니다."] },
          experiments: [
            { change: "legacy total column을 999로 바꿉니다.", prediction: "typed student.total은 여전히 source scores로 240입니다.", result: "derived column drift를 무시하고 재계산합니다." },
            { change: "math를 101로 바꿉니다.", prediction: "INVALID_SCORE입니다.", result: "adapter boundary에서 domain을 보호합니다." },
            { change: "parallel arrays 한 개만 sort합니다.", prediction: "이름·점수 mapping이 깨집니다.", result: "record collection을 한 단위로 정렬합니다." },
          ],
          sourceRefs: ["java-day08-parallel-score", "java-day08-score-rows", "java-day08-score-input", "jls-records", "java-math-api"],
        },
      ],
      diagnostics: [{ symptom: "출력 total·grade가 현재 세 점수와 맞지 않는다.", likelyCause: "derived columns를 입력과 함께 저장해 수정 뒤 stale 상태가 됐거나 swap field를 누락했습니다.", checks: ["source 점수로 재계산합니다.", "row length/index constants를 확인합니다.", "parallel swap code를 봅니다."], fix: "source-only typed record에서 total·grade를 policy로 재계산하고 record 전체를 정렬합니다.", prevention: "total=sum(scores)·grade=policy(total) invariants를 모든 결과에 assertion합니다." }],
    },
    {
      id: "aggregate-precision-rounding-policy",
      title: "총점·평균 계산값과 표시 rounding을 분리해 truncate·integer division을 숨기지 않습니다",
      lead: "학점 판정은 표시 문자열이 아니라 문서화된 exact policy input을 사용합니다.",
      explanations: [
        "Ex03 `(int)(sum*10/3.0)/10.0`은 소수 첫째 자리에서 round가 아니라 toward-zero truncate이며 sum*10 int overflow 가능성이 있습니다.",
        "Ex09 `p[4]/3`은 integer division으로 소수부 전체를 버립니다. 두 sources는 같은 평균 표시 policy가 아닙니다.",
        "0..100 세 점수면 total 0..300이라 int 안전하지만 general API는 Math.addExact 또는 long domain을 선택합니다.",
        "BigDecimal division은 non-terminating decimal에 scale·RoundingMode가 필요합니다. 계산 precision과 display scale을 명시합니다.",
        "학점은 total thresholds 또는 unrounded exact average 중 하나로 판정하고 rounded display가 boundary를 올리게 하지 않습니다.",
      ],
      concepts: [
        { term: "truncation", definition: "버려지는 자리의 값과 무관하게 특정 방향으로 잘라내는 처리입니다.", detail: ["rounding과 다릅니다.", "음수 방향을 명시합니다."] },
        { term: "display rounding", definition: "사용자에게 보일 scale·mode로 표현값을 만드는 처리입니다.", detail: ["domain 판정값과 분리합니다.", "locale formatting도 별도입니다."] },
        { term: "checked total", definition: "각 score 합산에서 fixed-width overflow를 검사하는 계산입니다.", detail: ["Math.addExact를 씁니다.", "입력 range도 검증합니다."] },
      ],
      codeExamples: [
        {
          id: "java-average-rounding-policies",
          title: "265·266 total의 DOWN과 HALF_UP 한 자리 표시를 비교합니다",
          language: "java",
          filename: "src/learning/java10/AveragePolicyLab.java",
          purpose: "원본 truncate와 명시 rounding mode 차이를 exact BigDecimal output으로 봅니다.",
          code: String.raw`package learning.java10;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class AveragePolicyLab {
    static BigDecimal display(int total, RoundingMode mode) {
        return BigDecimal.valueOf(total).divide(BigDecimal.valueOf(3), 1, mode);
    }
    static String gradeFromTotal(int total) {
        return total >= 270 ? "A" : total >= 240 ? "B" : total >= 210 ? "C" : total >= 180 ? "D" : "F";
    }
    public static void main(String[] args) {
        System.out.println("265=down:" + display(265, RoundingMode.DOWN)
                + ",halfUp:" + display(265, RoundingMode.HALF_UP) + ",grade:" + gradeFromTotal(265));
        System.out.println("266=down:" + display(266, RoundingMode.DOWN)
                + ",halfUp:" + display(266, RoundingMode.HALF_UP) + ",grade:" + gradeFromTotal(266));
        System.out.println("integer240=" + (240 / 3));
    }
}`,
          walkthrough: [
            { lines: "7-9", explanation: "total/3을 scale 1과 전달 mode로 계산합니다." },
            { lines: "10-12", explanation: "3과목 total threshold로 grade를 표시 rounding과 분리합니다." },
            { lines: "14-19", explanation: "265·266 display modes와 Ex09식 integer average 80을 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java10/AveragePolicyLab.java && java -cp build/classes learning.java10.AveragePolicyLab" },
          output: { value: "265=down:88.3,halfUp:88.3,grade:B\n266=down:88.6,halfUp:88.7,grade:B\ninteger240=80", explanation: ["266/3은 표시 mode에 따라 88.6/88.7이지만 grade는 같은 total policy B입니다.", "integer division policy는 별도로 드러냅니다."] },
          experiments: [
            { change: "total 269의 HALF_UP 표시를 정수 0자리로 바꿉니다.", prediction: "90으로 보일 수 있지만 total grade는 B입니다.", result: "표시 rounding으로 grade를 올리지 않습니다." },
            { change: "RoundingMode를 생략한 exact divide를 사용합니다.", prediction: "265/3은 non-terminating이라 ArithmeticException입니다.", result: "scale·mode를 계약합니다." },
            { change: "점수 range validation을 제거합니다.", prediction: "total threshold 의미와 overflow 가정이 깨집니다.", result: "계산 전 domain을 보호합니다." },
          ],
          sourceRefs: ["java-day08-parallel-score", "java-day08-score-input", "java-bigdecimal-api", "java-roundingmode-api", "java-math-api"],
        },
      ],
      diagnostics: [{ symptom: "화면 평균은 90인데 학점이 B라 버그처럼 보인다.", likelyCause: "display rounding과 exact/total grade policy를 설명하지 않았습니다.", checks: ["raw total·exact average를 봅니다.", "display scale/mode를 확인합니다.", "grade input 값을 확인합니다."], fix: "grade policy input과 display rounding을 결과 metadata·문서에 분리해 표시합니다.", prevention: "boundary 직전 total 269와 270, 여러 display modes를 contract test합니다." }],
    },
    {
      id: "grade-boundary-consistency",
      title: "학점 경계는 한 GradePolicy에서 inclusive하게 계산하고 hard-code하지 않습니다",
      lead: "Ex08의 180·60·F를 실행 evidence로 보존하면서 권장 정책에서는 D로 교정합니다.",
      explanations: [
        "원본 Ex09 정책은 average>=90 A, >=80 B, >=70 C, >=60 D, 그 아래 F입니다.",
        "세 과목 0..100이고 total로 판정하면 A>=270, B>=240, C>=210, D>=180로 floating 계산 없이 같은 경계를 표현합니다.",
        "Ex08 ID3은 total180·average60인데 F를 저장해 정책과 모순입니다. 파생 grade를 입력 literal로 저장하지 않습니다.",
        "90·80·70·60은 상위 grade에 포함되는 inclusive boundary이고 89·79·69·59는 바로 아래입니다.",
        "과목 수·가중치가 바뀌면 total thresholds도 바뀌므로 policy version과 subject schema를 함께 보존합니다.",
      ],
      concepts: [
        { term: "GradePolicy", definition: "유효 점수 domain과 학점 경계·가중치·version을 한 곳에 정의한 정책입니다.", detail: ["모든 adapters가 공유합니다.", "경계 tests가 필요합니다."] },
        { term: "inclusive threshold", definition: "경계값 자체가 해당 등급에 포함되는 >= 조건입니다.", detail: ["90은 A입니다.", "boundary-1과 함께 test합니다."] },
        { term: "single source of truth", definition: "동일 파생값을 여러 literals가 아니라 한 계산 규칙에서 생성하는 원칙입니다.", detail: ["drift를 막습니다.", "재계산이 가능합니다."] },
      ],
      codeExamples: [
        {
          id: "java-grade-boundary-policy",
          title: "A/B/C/D/F total boundaries와 Ex08 불일치를 검증합니다",
          language: "java",
          filename: "src/learning/java10/GradePolicyLab.java",
          purpose: "모든 threshold와 boundary-1을 exact output으로 고정합니다.",
          code: String.raw`package learning.java10;

import java.util.Arrays;

public class GradePolicyLab {
    static char grade(int total) {
        if (total < 0 || total > 300) throw new IllegalArgumentException("INVALID_TOTAL");
        return total >= 270 ? 'A' : total >= 240 ? 'B' : total >= 210 ? 'C' : total >= 180 ? 'D' : 'F';
    }
    public static void main(String[] args) {
        int[] totals = {300, 270, 269, 240, 239, 210, 209, 180, 179};
        char[] grades = new char[totals.length];
        for (int i = 0; i < totals.length; i++) grades[i] = grade(totals[i]);
        System.out.println("totals=" + Arrays.toString(totals));
        System.out.println("grades=" + Arrays.toString(grades));
        char storedEx08 = 'F';
        System.out.println("total180=derived:" + grade(180) + ",stored:" + storedEx08
                + ",consistent:" + (grade(180) == storedEx08));
    }
}`,
          walkthrough: [
            { lines: "6-9", explanation: "total domain을 검증하고 네 inclusive thresholds로 grade를 반환합니다." },
            { lines: "11-15", explanation: "각 threshold와 바로 아래 total을 배열로 실행합니다." },
            { lines: "16-18", explanation: "Ex08 stored F와 derived D를 명시적으로 비교합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java10/GradePolicyLab.java && java -cp build/classes learning.java10.GradePolicyLab" },
          output: { value: "totals=[300, 270, 269, 240, 239, 210, 209, 180, 179]\ngrades=[A, A, B, B, C, C, D, D, F]\ntotal180=derived:D,stored:F,consistent:false", explanation: ["모든 inclusive boundaries와 boundary-1이 보입니다.", "원본 불일치를 숨기지 않고 derived policy로 교정합니다."] },
          experiments: [
            { change: "D threshold를 >180으로 바꿉니다.", prediction: "total180이 F가 되어 Ex09의 >=60과 불일치합니다.", result: "inclusive 연산자를 contract test합니다." },
            { change: "과목을 4개로 늘리고 thresholds를 유지합니다.", prediction: "평균 기반 학점과 의미가 달라집니다.", result: "subject count와 policy version을 묶습니다." },
            { change: "total301을 넣습니다.", prediction: "INVALID_TOTAL입니다.", result: "invalid 값을 A로 흘려보내지 않습니다." },
          ],
          sourceRefs: ["java-day08-score-rows", "java-day08-score-input"],
        },
      ],
      diagnostics: [{ symptom: "같은 평균인데 adapter마다 다른 학점이 나온다.", likelyCause: "hard-coded grade와 계산 policy가 공존하거나 경계 연산자가 다릅니다.", checks: ["policy version과 threshold table을 비교합니다.", "derived fields literals를 검색합니다.", "boundary fixtures를 실행합니다."], fix: "모든 paths가 한 GradePolicy에서 source scores로 grade를 계산하게 합니다.", prevention: "59/60·69/70·79/80·89/90·invalid 경계를 adapter contract suite로 공유합니다." }],
    },
    {
      id: "rank-tie-policies",
      title: "동점 순위는 competition·dense·ordinal 중 요구 정책을 명시합니다",
      lead: "원본 `1 + 더 높은 총점 수`는 competition rank라 동점 뒤 gap이 생깁니다.",
      explanations: [
        "competition ranking은 totals 300·285·285·270에 1·2·2·4를 부여합니다. 동점이 차지한 자리만큼 다음 rank가 건너뜁니다.",
        "dense ranking은 서로 다른 더 높은 totals 수+1이라 1·2·2·3이며 gap이 없습니다.",
        "ordinal ranking은 모든 학생에게 서로 다른 1..n을 주므로 total tie를 푸는 deterministic ID·submission time 같은 tie-break가 필요합니다.",
        "원본 equal totals continue는 self뿐 아니라 모든 동점 comparison을 건너뛰어 같은 competition rank를 만듭니다.",
        "rank와 화면 sort order는 관련 있지만 별도 정책입니다. competition tie 안에서도 ID ascending 같은 stable presentation order를 정합니다.",
      ],
      concepts: [
        { term: "competition rank", definition: "동점은 같은 rank이고 다음 rank는 동점 자리 수만큼 gap이 생기는 1,2,2,4 정책입니다.", detail: ["원본 방식입니다.", "strictly greater count+1입니다."] },
        { term: "dense rank", definition: "동점은 같되 다음 distinct group이 바로 다음 rank인 1,2,2,3 정책입니다.", detail: ["gap이 없습니다.", "distinct totals를 셉니다."] },
        { term: "ordinal rank", definition: "tie-break까지 적용해 모든 records에 고유 1..n 위치를 주는 정책입니다.", detail: ["결정적 tie-break가 필요합니다.", "동점 공유가 아닙니다."] },
      ],
      codeExamples: [
        {
          id: "java-rank-tie-policies",
          title: "같은 totals에 세 순위 정책을 적용합니다",
          language: "java",
          filename: "src/learning/java10/RankPolicyLab.java",
          purpose: "동점 gap과 ordinal tie-break를 exact arrays로 비교합니다.",
          code: String.raw`package learning.java10;

import java.util.Arrays;
import java.util.Comparator;
import java.util.stream.IntStream;

public class RankPolicyLab {
    static int[] competition(int[] totals) {
        int[] ranks = new int[totals.length];
        for (int i = 0; i < totals.length; i++) {
            ranks[i] = 1;
            for (int other : totals) if (other > totals[i]) ranks[i]++;
        }
        return ranks;
    }
    static int[] dense(int[] totals) {
        int[] ranks = new int[totals.length];
        for (int i = 0; i < totals.length; i++) {
            int targetTotal = totals[i];
            ranks[i] = 1 + (int) IntStream.of(totals).filter(value -> value > targetTotal).distinct().count();
        }
        return ranks;
    }
    static int[] ordinal(int[] ids, int[] totals) {
        if (ids.length != totals.length) throw new IllegalArgumentException("LENGTH_MISMATCH");
        for (int i = 0; i < ids.length; i++)
            for (int j = i + 1; j < ids.length; j++)
                if (ids[i] == ids[j]) throw new IllegalArgumentException("DUPLICATE_ID");
        Integer[] order = IntStream.range(0, ids.length).boxed().toArray(Integer[]::new);
        Arrays.sort(order, Comparator.<Integer>comparingInt(index -> totals[index]).reversed()
                .thenComparingInt(index -> ids[index]));
        int[] ranks = new int[ids.length];
        for (int position = 0; position < order.length; position++) ranks[order[position]] = position + 1;
        return ranks;
    }
    public static void main(String[] args) {
        int[] ids = {40, 20, 50, 10};
        int[] totals = {300, 285, 285, 270};
        System.out.println("competition=" + Arrays.toString(competition(totals)));
        System.out.println("dense=" + Arrays.toString(dense(totals)));
        System.out.println("ordinal=" + Arrays.toString(ordinal(ids, totals)));
    }
}`,
          walkthrough: [
            { lines: "8-14", explanation: "각 학생보다 strictly greater totals를 모두 세어 competition ranks를 만듭니다." },
            { lines: "15-20", explanation: "greater distinct totals만 세어 dense ranks를 만듭니다." },
            { lines: "21-28", explanation: "total descending·ID ascending order의 ordinal positions를 원본 indices에 매핑합니다." },
            { lines: "30-35", explanation: "같은 IDs/totals에 세 정책을 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java10/RankPolicyLab.java && java -cp build/classes learning.java10.RankPolicyLab" },
          output: { value: "competition=[1, 2, 2, 4]\ndense=[1, 2, 2, 3]\nordinal=[1, 2, 3, 4]", explanation: ["동점 두 명의 competition/dense rank는 같고 다음 gap만 다릅니다.", "ordinal은 ID 20이 50보다 앞서 고유 positions를 갖습니다."] },
          experiments: [
            { change: "기존 IDs에서 모든 totals를 100으로 바꿉니다.", prediction: "competition/dense는 [1,1,1,1], ordinal은 원본-index 정렬로 ID 40·20·50·10에 대응하는 [3,2,4,1]입니다.", result: "ID-sorted presentation [10,20,40,50]의 positions를 원본 indices에 다시 매핑합니다." },
            { change: "ordinal tie-break를 제거합니다.", prediction: "현재 stable input order에 의존할 수 있어 data source 순서가 정책이 됩니다.", result: "tie-break를 명시합니다." },
            { change: "competition에서 >=를 사용합니다.", prediction: "자기 자신과 동점까지 세어 ranks가 잘못 증가합니다.", result: "strictly greater를 유지합니다." },
            { change: "IDs와 totals lengths를 다르게 넣습니다.", prediction: "LENGTH_MISMATCH입니다.", result: "parallel input alignment를 진입에서 검증합니다." },
          ],
          sourceRefs: ["java-day08-parallel-score", "java-day08-score-rows", "java-comparator-api", "java-arrays-api"],
        },
      ],
      diagnostics: [{ symptom: "동점 뒤 rank가 4인데 3을 기대했다.", likelyCause: "competition 정책을 구현했지만 요구는 dense ranking입니다.", checks: ["동점 예시 1,2,2,?를 확인합니다.", "greater all vs distinct를 봅니다.", "정책 이름을 API에서 확인합니다."], fix: "요구된 RankPolicy를 명시 선택하고 정책별 결과 type·설명을 반환합니다.", prevention: "no-tie·one tie·all tie fixtures를 competition/dense/ordinal 모두에 둡니다." }],
    },
    {
      id: "sort-row-integrity-index-mapping",
      title: "row reference 또는 record 전체를 정렬해 field alignment와 deterministic tie order를 보존합니다",
      lead: "parallel field swaps 대신 한 domain object를 이동합니다.",
      explanations: [
        "Ex03은 rank swap마다 8개 parallel arrays를 모두 교환해 한 field만 빠져도 학생 record가 섞입니다.",
        "Ex08/09는 int[] row reference 자체를 swap해 row 내부 alignment는 보존하지만 magic index·derived field 문제는 남습니다.",
        "record list/snapshot을 total descending·ID ascending Comparator로 정렬하면 fields가 한 단위로 움직이고 tie order가 결정적입니다.",
        "Arrays.sort는 입력 array를 변경하므로 immutable result가 필요하면 clone/copy를 만들고 original unchanged를 test합니다.",
        "rank는 정책 결과이고 sort position은 presentation 순서입니다. competition tie records는 같은 rank라도 ID순으로 보여 줄 수 있습니다.",
      ],
      concepts: [
        { term: "row integrity", definition: "한 학생의 모든 fields가 정렬·복사 뒤에도 같은 record에 함께 남는 불변식입니다.", detail: ["parallel swap을 피합니다.", "ID로 검증합니다."] },
        { term: "tie-break comparator", definition: "주요 key가 같을 때 추가 key로 total order를 만드는 comparator입니다.", detail: ["결정성을 줍니다.", "rank와 구분합니다."] },
        { term: "index mapping", definition: "sorted position과 original ID/index의 관계를 보존하는 mapping입니다.", detail: ["원본 추적에 씁니다.", "identity를 잃지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "java-score-record-sort",
          title: "total descending·ID ascending record sort와 원본 비변경을 확인합니다",
          language: "java",
          filename: "src/learning/java10/ScoreSortLab.java",
          purpose: "원본 Ex08 order를 typed records로 재현하고 tie-break를 검증합니다.",
          code: String.raw`package learning.java10;

import java.util.Arrays;
import java.util.Comparator;

public class ScoreSortLab {
    record Score(int id, int total) {}
    static Score[] sortedSnapshot(Score[] source) {
        Score[] copy = source.clone();
        Arrays.sort(copy, Comparator.comparingInt(Score::total).reversed().thenComparingInt(Score::id));
        return copy;
    }
    static String ids(Score[] scores) {
        return Arrays.toString(Arrays.stream(scores).mapToInt(Score::id).toArray());
    }
    public static void main(String[] args) {
        Score[] source = {new Score(1,270), new Score(2,210), new Score(3,180), new Score(4,300), new Score(5,285)};
        System.out.println("sorted=" + ids(sortedSnapshot(source)));
        System.out.println("original=" + ids(source));
        System.out.println("tie=" + ids(sortedSnapshot(new Score[]{new Score(7,200), new Score(3,200)})));
    }
}`,
          walkthrough: [
            { lines: "7-11", explanation: "record array를 clone하고 total descending·ID ascending으로 정렬합니다." },
            { lines: "12-14", explanation: "결과 비교용 ID sequence를 만듭니다." },
            { lines: "16-20", explanation: "원본 Ex08 order, source 비변경, total tie ID order를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java10/ScoreSortLab.java && java -cp build/classes learning.java10.ScoreSortLab" },
          output: { value: "sorted=[4, 5, 1, 2, 3]\noriginal=[1, 2, 3, 4, 5]\ntie=[3, 7]", explanation: ["원본 Ex08의 total order를 재현합니다.", "source는 변경하지 않고 tie는 ID ascending입니다."] },
          experiments: [
            { change: "clone을 제거합니다.", prediction: "source가 sorted order로 바뀝니다.", result: "mutation ownership을 API 이름·문서로 드러냅니다." },
            { change: "thenComparingInt를 제거합니다.", prediction: "stable sort에서는 input tie order 7,3이 유지되지만 그것이 implicit policy가 됩니다.", result: "명시 tie-break를 둡니다." },
            { change: "parallel arrays 중 total만 sort합니다.", prediction: "ID-total mapping이 깨집니다.", result: "record 전체를 이동합니다." },
          ],
          sourceRefs: ["java-day08-parallel-score", "java-day08-score-rows", "java-arrays-api", "java-comparator-api", "jls-records"],
        },
      ],
      diagnostics: [{ symptom: "정렬 뒤 학생 ID와 점수·학점이 서로 다른 사람 데이터로 섞였다.", likelyCause: "parallel arrays swap 중 field 하나를 누락했거나 columns를 독립 정렬했습니다.", checks: ["ID별 source/result fields를 비교합니다.", "swap assignments를 셉니다.", "record permutation을 확인합니다."], fix: "한 record/row reference를 정렬 단위로 사용하고 source ID mapping을 보존합니다.", prevention: "result IDs permutation과 ID별 total invariant, input unchanged test를 둡니다." }],
    },
    {
      id: "input-validation-allocation-budget",
      title: "학생수·ID·점수·row shape를 allocation·aggregate 전에 검증합니다",
      lead: "Scanner transport 실패와 domain invalid를 분리하고 shared System.in 소유권을 지킵니다.",
      explanations: [
        "Ex09는 negative count에서 NegativeArraySizeException, huge count에서 memory exhaustion 위험이 있고 0명도 그대로 다음 prompt로 갑니다.",
        "ID는 positive·unique, 각 점수는 0..100, row는 exact columns를 요구하고 invalid field 이름을 안전한 code로 반환합니다.",
        "Scanner nextInt는 invalid token·EOF에서 실패합니다. `nextLine`로 count line remainder를 버리면 같은 줄의 다음 tokens도 소실될 수 있습니다.",
        "parsing adapter와 pure validator를 분리하고 invalid token을 소비하거나 line 전체를 parse해 progress를 보장합니다.",
        "library가 Scanner(System.in)을 close하면 caller-owned System.in도 닫히므로 ownership이 있는 application boundary에서만 close합니다.",
        "오류에는 count·field·status만 넣고 실제 이름·전체 점수 row 같은 개인정보는 기록하지 않습니다.",
      ],
      concepts: [
        { term: "allocation budget", definition: "외부 count로 배열·records를 만들기 전에 허용하는 최대 rows·cells·bytes입니다.", detail: ["OOM을 예방합니다.", "business limit와 함께 둡니다."] },
        { term: "domain validation", definition: "파싱된 값이 ID·score·count 불변식을 만족하는지 검사하는 단계입니다.", detail: ["transport와 분리합니다.", "field code를 반환합니다."] },
        { term: "resource ownership", definition: "stream·Scanner를 누가 생성·close하고 lifetime을 책임지는지의 계약입니다.", detail: ["System.in 공유를 고려합니다.", "dependency injection이 유용합니다."] },
      ],
      codeExamples: [
        {
          id: "java-score-input-validation",
          title: "count·score·duplicate ID를 pure validator로 구분합니다",
          language: "java",
          filename: "src/learning/java10/ScoreValidationLab.java",
          purpose: "allocation이나 stdin 없이 boundary 결과를 결정적으로 검증합니다.",
          code: String.raw`package learning.java10;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ScoreValidationLab {
    record Input(int id, int korean, int english, int math) {}
    static String validateCount(int requestedCount, int maxStudents, int columns) {
        if (maxStudents < 0 || columns <= 0) return "INVALID_CONFIG";
        if (requestedCount < 0 || requestedCount > maxStudents) return "INVALID_COUNT";
        try { return "COUNT_OK:cells=" + Math.multiplyExact(requestedCount, columns); }
        catch (ArithmeticException error) { return "INVALID_CELLS"; }
    }
    static String validate(List<Input> students, int maxStudents) {
        if (students.size() > maxStudents) return "INVALID_COUNT";
        Set<Integer> ids = new HashSet<>();
        for (Input student : students) {
            if (student.id() <= 0) return "INVALID_ID";
            if (!ids.add(student.id())) return "DUPLICATE_ID";
            if (student.korean() < 0 || student.korean() > 100) return "INVALID_SCORE:korean";
            if (student.english() < 0 || student.english() > 100) return "INVALID_SCORE:english";
            if (student.math() < 0 || student.math() > 100) return "INVALID_SCORE:math";
        }
        return "OK";
    }
    public static void main(String[] args) {
        System.out.println("negative=" + validateCount(-1, 10_000, 8));
        System.out.println("zero=" + validateCount(0, 10_000, 8));
        System.out.println("max=" + validateCount(10_000, 10_000, 8));
        System.out.println("above=" + validateCount(10_001, 10_000, 8));
        System.out.println("overflow=" + validateCount(Integer.MAX_VALUE, Integer.MAX_VALUE, 8));
        System.out.println("valid=" + validate(List.of(new Input(1,90,80,70)), 10));
        System.out.println("score=" + validate(List.of(new Input(1,90,80,101)), 10));
        System.out.println("duplicate=" + validate(List.of(new Input(1,90,80,70),new Input(1,100,100,100)), 10));
    }
}`,
          walkthrough: [
            { lines: "8-14", explanation: "raw requested count·maximum·columns를 실제 collection/array 생성 전에 검사하고 cell multiplication overflow를 잡습니다." },
            { lines: "15-26", explanation: "materialized records 단계에서는 positive unique ID와 각 named score boundary를 검사합니다." },
            { lines: "28-37", explanation: "negative·zero·max·max+1·cell overflow gate와 valid·math101·duplicate ID를 실행합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java10/ScoreValidationLab.java && java -cp build/classes learning.java10.ScoreValidationLab" },
          output: { value: "negative=INVALID_COUNT\nzero=COUNT_OK:cells=0\nmax=COUNT_OK:cells=80000\nabove=INVALID_COUNT\noverflow=INVALID_CELLS\nvalid=OK\nscore=INVALID_SCORE:math\nduplicate=DUPLICATE_ID", explanation: ["raw count와 cell multiplication을 allocation 전에 차단합니다.", "record errors도 raw row 없이 field/status로 구분됩니다."] },
          experiments: [
            { change: "empty list를 넣습니다.", prediction: "현재 policy는 OK입니다.", result: "최소 1명 요구 여부를 business rule로 정합니다." },
            { change: "maxStudents를 음수로 둡니다.", prediction: "현재는 모든 list가 INVALID_COUNT가 될 수 있어 config validation이 필요합니다.", result: "policy configuration도 검증합니다." },
            { change: "Scanner invalid token을 같은 위치에서 재시도합니다.", prediction: "token을 소비하지 않으면 반복 failure입니다.", result: "transport adapter progress를 test합니다." },
          ],
          sourceRefs: ["java-day08-score-input", "java-scanner-api"],
        },
      ],
      diagnostics: [{ symptom: "학생수 입력 뒤 다음 학생 번호가 사라지거나 입력이 멈춘다.", likelyCause: "nextInt 뒤 무조건 nextLine으로 같은 줄의 남은 tokens를 버렸거나 EOF/invalid를 처리하지 않았습니다.", checks: ["token/line API 혼용을 봅니다.", "동일 줄 fixture를 실행합니다.", "hasNext/EOF를 확인합니다."], fix: "line-based parse 또는 token-only adapter로 일관되게 읽고 transport status를 명시합니다.", prevention: "한 줄·여러 줄·blank·invalid·EOF fixtures와 resource ownership tests를 둡니다." }],
    },
    {
      id: "complexity-refactor-data-model",
      title: "O(n²) rank·exchange sort를 O(n log n) record sort와 한 번의 rank scan으로 바꿉니다",
      lead: "비교 수보다 정책 정확성·원본 mapping·메모리 budget을 함께 보존합니다.",
      explanations: [
        "원본 rank는 n students 각각 n totals를 비교해 n²이고 뒤 exchange sort는 n(n-1)/2 comparisons입니다.",
        "records를 total descending·ID ascending으로 O(n log n) 정렬한 뒤 adjacent totals를 한 번 scan하면 competition/dense ranks를 O(n)에 부여할 수 있습니다.",
        "comparison sort의 실제 comparator 호출 수는 구현에 따라 달라 exact golden으로 고정하지 않고 결과 order와 rank scan n-1을 검증합니다.",
        "matrix는 uniform numeric transform에 적합하지만 ID·grade·rank처럼 heterogeneous semantics에는 record collection이 type safety를 높입니다.",
        "memory는 total cells+row objects+sorted snapshot을 계산하고 대규모에서는 primitive compact model·database ranking·streaming을 비교합니다.",
      ],
      concepts: [
        { term: "sort-and-scan ranking", definition: "records를 점수순으로 정렬한 뒤 이전 group과 비교하며 한 번 순회해 rank를 주는 알고리즘입니다.", detail: ["O(n log n)입니다.", "tie policy를 구현합니다."] },
        { term: "complexity composition", definition: "여러 단계의 시간·공간 비용을 더해 지배적인 차수를 구하는 분석입니다.", detail: ["sort+scan을 봅니다.", "I/O도 분리합니다."] },
        { term: "data model fit", definition: "자료 구조가 field types·invariants·연산 패턴을 얼마나 직접 표현하는지의 적합성입니다.", detail: ["matrix만 고집하지 않습니다.", "record/list를 비교합니다."] },
      ],
      codeExamples: [
        {
          id: "java-ranking-complexity-counters",
          title: "n=5 원본 rank 25·sort 10과 optimized rank scan 4를 비교합니다",
          language: "java",
          filename: "src/learning/java10/RankComplexityLab.java",
          purpose: "원본 quadratic 단계와 sort 후 linear scan의 작업량을 분리합니다.",
          code: String.raw`package learning.java10;

public class RankComplexityLab {
    static int legacyRankComparisons(int n) {
        int count = 0;
        for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) count++;
        return count;
    }
    static int legacySortComparisons(int n) {
        int count = 0;
        for (int i = 0; i < n - 1; i++) for (int j = i + 1; j < n; j++) count++;
        return count;
    }
    static int rankScanComparisons(int n) { return Math.max(0, n - 1); }
    public static void main(String[] args) {
        int n = 5;
        System.out.println("legacyRank=" + legacyRankComparisons(n));
        System.out.println("legacySort=" + legacySortComparisons(n));
        System.out.println("optimizedRankScan=" + rankScanComparisons(n));
        System.out.println("optimizedTotal=sortO(nlogn)+scanO(n)");
    }
}`,
          walkthrough: [
            { lines: "4-8", explanation: "원본 rank의 full n×n comparisons를 셉니다." },
            { lines: "9-13", explanation: "exchange sort의 모든 i<j pairs를 셉니다." },
            { lines: "14-21", explanation: "정렬 뒤 adjacent scan n-1과 합성 complexity를 출력합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java10/RankComplexityLab.java && java -cp build/classes learning.java10.RankComplexityLab" },
          output: { value: "legacyRank=25\nlegacySort=10\noptimizedRankScan=4\noptimizedTotal=sortO(nlogn)+scanO(n)", explanation: ["원본 두 quadratic phases가 25+10 comparisons입니다.", "optimized comparator calls는 고정하지 않고 scan만 4로 검증합니다."] },
          experiments: [
            { change: "n=0으로 바꿉니다.", prediction: "세 counters 모두 0입니다.", result: "empty scoreboard boundary를 검증합니다." },
            { change: "sort 결과 없이 scan합니다.", prediction: "adjacent equal/group logic이 rank를 잘못 계산합니다.", result: "sorted precondition을 pipeline에 묶습니다." },
            { change: "모든 totals가 같은 n=5를 넣습니다.", prediction: "scan은 4 comparisons지만 competition rank는 모두 1입니다.", result: "작업량과 policy 결과를 구분합니다." },
          ],
          sourceRefs: ["java-day08-parallel-score", "java-day08-score-rows", "java-arrays-api", "java-comparator-api"],
        },
        {
          id: "java-sort-scan-ranking",
          title: "total 정렬 후 한 번의 scan으로 competition·dense rank를 부여합니다",
          language: "java",
          filename: "src/learning/java10/OptimizedRankingLab.java",
          purpose: "O(n log n)+O(n) 리팩터링과 all-tie·no-tie·permutation·input ownership을 실제로 검증합니다.",
          code: String.raw`package learning.java10;

import java.util.Arrays;
import java.util.Comparator;

public class OptimizedRankingLab {
    record Student(int id, int total) {}
    record Ranked(int id, int total, int rank) {}

    static Ranked[] rank(Student[] source, boolean dense) {
        Student[] sorted = source.clone();
        Arrays.sort(sorted, Comparator.comparingInt(Student::total).reversed().thenComparingInt(Student::id));
        Ranked[] result = new Ranked[sorted.length];
        int competitionRank = 1, denseRank = 1;
        for (int index = 0; index < sorted.length; index++) {
            if (index > 0 && sorted[index].total() != sorted[index - 1].total()) {
                competitionRank = index + 1;
                denseRank++;
            }
            result[index] = new Ranked(sorted[index].id(), sorted[index].total(), dense ? denseRank : competitionRank);
        }
        return result;
    }
    static String compact(Ranked[] rows) {
        return String.join("|", Arrays.stream(rows).map(row -> row.id() + ":" + row.rank()).toList());
    }
    static String ranks(Ranked[] rows) {
        return Arrays.toString(Arrays.stream(rows).mapToInt(Ranked::rank).toArray());
    }
    static boolean isPermutation(Student[] source, Ranked[] rows) {
        int[] before = Arrays.stream(source).mapToInt(Student::id).sorted().toArray();
        int[] after = Arrays.stream(rows).mapToInt(Ranked::id).sorted().toArray();
        return Arrays.equals(before, after);
    }
    public static void main(String[] args) {
        Student[] source = {new Student(4,300),new Student(2,285),new Student(5,285),new Student(1,270)};
        Student[] snapshot = source.clone();
        Ranked[] competition = rank(source, false);
        System.out.println("competition=" + compact(competition));
        System.out.println("dense=" + compact(rank(source, true)));
        System.out.println("allTie=" + ranks(rank(new Student[]{new Student(3,100),new Student(1,100),new Student(2,100)}, false)));
        System.out.println("noTie=" + ranks(rank(new Student[]{new Student(1,300),new Student(2,200),new Student(3,100)}, false)));
        System.out.println("permutation=" + isPermutation(source, competition)
                + ",inputUnchanged=" + Arrays.equals(source, snapshot));
    }
}`,
          walkthrough: [
            { lines: "10-22", explanation: "defensive clone을 total desc·ID asc로 정렬하고 distinct total group이 시작될 때 competition/dense counters만 갱신합니다." },
            { lines: "23-33", explanation: "observable ID:rank·rank arrays와 ID permutation helper를 만듭니다." },
            { lines: "34-44", explanation: "동점 fixture, all-tie, no-tie, ID permutation과 source array 비변경을 실행합니다." },
          ],
          run: { environment: ["PowerShell 7+ 또는 POSIX shell", "JDK 21+"], command: "javac -d build/classes src/learning/java10/OptimizedRankingLab.java && java -cp build/classes learning.java10.OptimizedRankingLab" },
          output: { value: "competition=4:1|2:2|5:2|1:4\ndense=4:1|2:2|5:2|1:3\nallTie=[1, 1, 1]\nnoTie=[1, 2, 3]\npermutation=true,inputUnchanged=true", explanation: ["정렬 뒤 한 scan으로 두 gap policies를 구현합니다.", "all/no-tie와 IDs multiset·source ownership을 실제로 검증합니다."] },
          experiments: [
            { change: "ID tie-break를 제거합니다.", prediction: "rank는 같아도 all-tie presentation이 input order에 의존합니다.", result: "deterministic output ordering을 별도 계약합니다." },
            { change: "distinct total에서 competitionRank=index 대신 index+1을 제거합니다.", prediction: "새 group rank가 1 작아집니다.", result: "0-based position과 1-based rank를 경계 test합니다." },
            { change: "source.clone을 제거하고 source 자체를 sort합니다.", prediction: "inputUnchanged=false입니다.", result: "snapshot ownership을 보존합니다." },
          ],
          sourceRefs: ["java-day08-parallel-score", "java-day08-score-rows", "java-arrays-api", "java-comparator-api", "jls-records"],
        },
      ],
      diagnostics: [{ symptom: "학생 수가 늘자 성적표 생성 시간이 급격히 증가한다.", likelyCause: "n² rank와 n² exchange sort를 연속 실행합니다.", checks: ["n과 comparison counters를 측정합니다.", "rank/sort phases를 profile합니다.", "output I/O를 분리합니다."], fix: "typed records를 한 번 sort하고 선택 RankPolicy를 linear scan으로 부여합니다.", prevention: "입력 budget·성능 regression과 worst/all-tie fixtures를 둡니다." }],
    },
    {
      id: "invariants-properties-boundary-matrix",
      title: "shape·성적·순위·정렬 invariants를 경계 matrix와 properties로 완성합니다",
      lead: "몇 개 golden rows보다 모든 결과가 반드시 만족할 관계를 검증합니다.",
      explanations: [
        "shape suite는 null matrix·empty outer·null/empty/jagged/rectangular rows·aliased rows·max cells를 포함합니다.",
        "score suite는 -1·0·59·60·69·70·79·80·89·90·100·101과 total overflow·rounding display를 포함합니다.",
        "rank properties는 totals descending일 때 ranks nondecreasing, equal totals competition rank equal, 다음 rank gap 정책이 정확함을 확인합니다.",
        "sort properties는 result IDs가 input permutation이고 각 ID의 source scores·derived total이 보존되며 input snapshot이 바뀌지 않음을 확인합니다.",
        "random/property tests도 seed와 failure shrinking을 기록하고 실제 이름·점수 원문은 artifact·log에 남기지 않습니다.",
      ],
      concepts: [
        { term: "invariant", definition: "pipeline 단계 전후 모든 valid 결과에서 반드시 참인 관계입니다.", detail: ["total=sum subjects입니다.", "row integrity를 보장합니다."] },
        { term: "property-based test", definition: "많은 생성 입력에 일반 성질을 검사하고 최소 반례를 찾는 테스트 방식입니다.", detail: ["golden을 보완합니다.", "seed를 보존합니다."] },
        { term: "boundary matrix", definition: "shape·count·score·tie·order의 최소·최대·경계±1 조합을 체계화한 표입니다.", detail: ["누락을 줄입니다.", "정책 version마다 실행합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "예제 다섯 명은 맞지만 동점·빈 입력에서 rank가 틀린다.", likelyCause: "happy-path golden만 있고 policy properties와 boundary matrix가 없습니다.", checks: ["all-tie/no-tie cases를 봅니다.", "empty/single을 실행합니다.", "rank monotonicity를 검사합니다."], fix: "정책별 invariants와 generated totals properties를 추가합니다.", prevention: "모든 RankPolicy implementation이 같은 contract suite를 통과하게 합니다." },
        { symptom: "테스트 실패 로그에 학생 이름과 전체 점수가 노출됐다.", likelyCause: "fixture dump를 그대로 assertion/error/CI artifact에 기록했습니다.", checks: ["test reporter와 logs를 검색합니다.", "failure payload를 확인합니다.", "artifact 공개 범위를 봅니다."], fix: "synthetic IDs·field code·row index·seed만 기록하고 raw production data를 test에 사용하지 않습니다.", prevention: "privacy-safe fixture generator와 artifact scanner를 CI에 둡니다." },
      ],
      comparisons: [{ title: "성적 데이터 모델 선택", options: [
        { name: "int[][] compatibility", chooseWhen: "legacy interface와 uniform numeric batch 연산을 잠시 연결할 때", avoidWhen: "grade·average·rank 의미와 검증을 장기간 유지할 때", tradeoffs: ["compact할 수 있습니다.", "magic columns·char code·shape 위험이 큽니다."] },
        { name: "record[] snapshot", chooseWhen: "고정 크기·배열 API와 type-safe fields가 필요할 때", avoidWhen: "빈번한 추가·삭제·streaming input일 때", tradeoffs: ["fields와 identity가 함께 이동합니다.", "길이는 고정입니다."] },
        { name: "List<record>", chooseWhen: "가변 학생수·collection operations·service boundary일 때", avoidWhen: "극단적인 primitive memory compactness가 핵심일 때", tradeoffs: ["확장성과 API가 좋습니다.", "object/boxing overhead를 측정합니다."] },
      ] }],
      expertNotes: ["정책 결과에는 gradePolicyVersion·rankPolicyName·ordering version을 보존해 재현 가능성을 높입니다.", "데이터가 DB에 있으면 window function RANK/DENSE_RANK와 application policy의 tie/null ordering을 일치시키고 integration test합니다."],
    },
  ],
  lab: {
    title: "검증·반올림·동점 정책이 명시된 성적표 pipeline",
    scenario: "legacy int[][] 또는 synthetic input을 검증된 StudentScores records로 바꾸고 total·display average·grade·선택 rank를 계산해 원본을 변경하지 않는 sorted report를 만듭니다.",
    setup: ["JDK 21과 UTF-8 source를 준비합니다.", "ShapePolicy·GradePolicy·RankPolicy·OrderingPolicy를 분리합니다.", "synthetic IDs만 사용하고 실제 이름·점수는 사용하지 않습니다."],
    steps: ["rows/cells allocation budget과 null/shape를 검증합니다.", "legacy exact 8 columns를 source-only record로 변환합니다.", "positive unique ID와 score 0..100을 검증합니다.", "Math.addExact total과 BigDecimal display average를 계산합니다.", "versioned GradePolicy에서 grade를 도출합니다.", "competition/dense/ordinal 중 선택 policy를 적용합니다.", "total desc·ID asc snapshot을 만들고 source 비변경을 확인합니다.", "shape·score boundaries·ties·duplicates·rounding·permutation properties를 실행합니다.", "report에는 policy metadata와 privacy-safe status만 포함합니다."],
    expectedResult: ["Ex08 180점은 policy-derived D로 교정됩니다.", "동점 rank와 gap이 선택 policy 설명과 일치합니다.", "모든 result에서 total=sum scores·grade=policy(total)·ID mapping이 유지됩니다.", "input arrays/records는 변경되지 않고 invalid·oversize는 계산 전에 거부됩니다."],
    cleanup: ["temp classes는 resolved parent 확인 뒤 생성 root만 제거합니다.", "Scanner/stream은 소유한 adapter만 close합니다.", "원본 학습 sources는 변경하지 않습니다."],
    extensions: ["CSV/JSON line adapter를 추가합니다.", "DB RANK/DENSE_RANK integration을 비교합니다.", "가중 과목·결시·재시험 policy를 versioning합니다.", "property-based generator로 shape·tie 반례를 축소합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "rectangular·jagged·empty·null rows의 shape와 cells·sum을 계산하세요.", requirements: ["outer/row lengths를 출력합니다.", "null row policy를 명시합니다.", "row별 inner bound를 사용합니다.", "coordinates golden을 둡니다."], hints: ["total cells는 Σ row.length입니다.", "empty outer에서 row0를 읽지 마세요."], expectedOutcome: "array-of-arrays shape를 실패 없이 분류·순회합니다.", solutionOutline: ["shape validator를 먼저 실행합니다.", "indexed nested loop로 count/sum을 exact 누산합니다."] },
    { difficulty: "응용", prompt: "legacy int[][] 성적 rows를 검증해 typed records와 grade report로 변환하세요.", requirements: ["row 8 columns·ID uniqueness·score range를 검사합니다.", "derived columns를 신뢰하지 않습니다.", "rounding mode·grade input을 명시합니다.", "Ex08 60→F inconsistency를 잡습니다."], hints: ["source scores로 total을 재계산하세요.", "status에는 field code만 넣으세요."], expectedOutcome: "stale/malformed rows가 명시적으로 거부되고 일관된 grade가 생성됩니다.", solutionOutline: ["adapter→validator→calculator→policy로 나눕니다.", "boundary totals를 실행합니다."] },
    { difficulty: "설계", prompt: "competition·dense·ordinal을 선택할 수 있는 record 기반 scoreboard를 설계하세요.", requirements: ["deterministic tie-break를 둡니다.", "O(n log n) sort+scan을 사용합니다.", "input 불변·permutation·rank properties를 test합니다.", "allocation·privacy·policy version을 포함합니다."], hints: ["rank와 presentation sort를 분리하세요.", "all-tie/no-tie fixtures를 사용하세요."], expectedOutcome: "정책을 바꿔도 동일 validated inputs와 reproducible metadata를 쓰는 scoreboard가 됩니다.", solutionOutline: ["Policy interfaces와 Result metadata를 정의합니다.", "sorted snapshot에서 ranks를 scan합니다.", "공통 contract suite를 적용합니다."] },
  ],
  reviewQuestions: [
    { question: "Java int[][]의 실제 구조는 무엇인가요?", answer: "int[] references를 components로 갖는 outer array이며 rows는 독립 objects입니다." },
    { question: "new int[3][] 직후 rows는 무엇인가요?", answer: "세 outer slots 모두 default null입니다." },
    { question: "jagged array element assignment가 항상 불가능한가요?", answer: "아닙니다. 해당 row를 먼저 생성하면 row[index]에 정상 대입할 수 있습니다." },
    { question: "empty row와 null row 차이는 무엇인가요?", answer: "empty row는 length 0 object라 0회 순회하고 null은 dereference에서 NPE입니다." },
    { question: "jagged total cells는 어떻게 계산하나요?", answer: "정책상 non-null인 각 row.length의 합입니다." },
    { question: "magic columns의 핵심 위험은 무엇인가요?", answer: "field 의미·type·derived invariant를 compiler가 검증하지 못하고 잘못된 index도 compile된다는 점입니다." },
    { question: "Ex03 평균은 rounding인가요?", answer: "아닙니다. 한 자리에서 toward-zero truncate합니다." },
    { question: "Ex09 평균은 어떤 계산인가요?", answer: "int total/3 integer division으로 소수부 전체를 버립니다." },
    { question: "display average로 grade를 판정하면 왜 위험한가요?", answer: "rounding으로 boundary를 넘어 보일 수 있으므로 exact/total policy와 표현을 분리해야 합니다." },
    { question: "Ex08 180점 F의 문제는 무엇인가요?", answer: "Ex09의 D>=60 policy에서 total180/average60은 D라 source policies가 불일치합니다." },
    { question: "원본 rank policy는 무엇인가요?", answer: "strictly greater totals 수+1인 competition rank입니다." },
    { question: "competition과 dense tie 결과는 어떻게 다른가요?", answer: "1,2,2 다음이 competition 4, dense 3입니다." },
    { question: "ordinal tie에는 무엇이 필요한가요?", answer: "ID ascending 같은 deterministic tie-break가 필요합니다." },
    { question: "row reference sort의 장점은 무엇인가요?", answer: "한 row 내부 fields alignment는 함께 이동하지만 magic schema 문제는 남습니다." },
    { question: "Ex09 student count를 allocation 전에 검증해야 하는 이유는 무엇인가요?", answer: "negative/huge count의 runtime failure·memory exhaustion을 막기 위해서입니다." },
    { question: "Scanner를 무조건 close하면 안 되는 이유는 무엇인가요?", answer: "Scanner가 감싼 caller-owned System.in까지 닫기 때문입니다." },
    { question: "원본 rank+sort complexity는 무엇인가요?", answer: "rank O(n²)와 exchange sort O(n²)입니다." },
    { question: "개선 pipeline의 complexity는 무엇인가요?", answer: "record sort O(n log n) 뒤 rank scan O(n)입니다." },
  ],
  completionChecklist: ["원본 5개와 Ex09 synthetic input을 감사했다.", "identity text를 주소로 부르지 않았다.", "array-of-arrays와 independent rows를 설명했다.", "rectangular/jagged/null/empty shape를 분류했다.", "row별 length와 total cells를 사용했다.", "row alias와 shape mutation을 검증했다.", "parallel arrays·magic columns 위험을 식별했다.", "legacy rows를 source-only records로 변환했다.", "count·ID·score·shape·allocation budget을 검사했다.", "total을 checked arithmetic으로 계산했다.", "integer division·truncate·rounding을 구분했다.", "display average와 grade input을 분리했다.", "Ex08 60→F inconsistency를 교정했다.", "학점 threshold와 boundary-1을 test했다.", "competition·dense·ordinal rank를 실행했다.", "동점 tie-break를 명시했다.", "record 전체를 deterministic comparator로 정렬했다.", "source 비변경·ID permutation·row integrity를 test했다.", "O(n²) 원본과 O(n log n)+O(n) 개선을 비교했다.", "null/empty/all-tie/no-tie/invalid boundaries를 실행했다.", "policy version metadata를 설계했다.", "raw names/scores를 로그에 노출하지 않았다."],
  nextSessions: [],
  sources: [
    { id: "java-day08-parallel-score", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day08/Ex03.java", usedFor: ["parallel arrays", "truncate average", "competition rank", "synchronized swaps"], evidence: "JDK 21.0.11 clean run 8 lines; totals 300..215, averages 100.0..71.6, ranks1..5를 확인했습니다." },
    { id: "java-day08-rectangular", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day08/Ex05.java", usedFor: ["rectangular allocation", "outer/row identity text", "row-specific traversal"], evidence: "clean run 11 lines·blank1; identity text3개와 6 cells를 확인했습니다." },
    { id: "java-day08-jagged", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day08/Ex07.java", usedFor: ["outer-only allocation", "null rows", "jagged lengths", "char rows"], evidence: "clean run 30 lines·blank3; null3, int lengths2/4/5, char lengths4/3/2입니다." },
    { id: "java-day08-score-rows", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day08/Ex08.java", usedFor: ["magic 8 columns", "row reference sort", "competition rank", "60 F inconsistency"], evidence: "clean run 5 rows; order4,5,1,2,3이며 ID3 total180 average60 stored F입니다." },
    { id: "java-day08-score-input", repository: "javastudy/MyJavaProject", path: "src/com/ictedu/day08/Ex09.java", usedFor: ["interactive allocation", "integer average", "grade thresholds", "labeled repeat", "Scanner ownership"], evidence: "synthetic input clean run 12 lines; 102 rank1, 101 rank2, final retry prompt를 확인했습니다." },
    { id: "jdk21-javac", repository: "OpenJDK", path: "javac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["JDK21", "UTF-8", "Xlint"], evidence: "원본과 Java examples compiler 기준입니다." },
    { id: "jls-arrays", repository: "JLS SE 21", path: "Chapter 10 Arrays", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-10.html", usedFor: ["array-of-arrays", "row types", "length/runtime checks"], evidence: "다차원 배열 model의 primary specification입니다." },
    { id: "jls-initial-values", repository: "JLS SE 21", path: "4.12.5 Initial Values", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.12.5", usedFor: ["outer null rows", "cell defaults"], evidence: "array component defaults 근거입니다." },
    { id: "jls-enhanced-for", repository: "JLS SE 21", path: "14.14.2 Enhanced for", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.14.2", usedFor: ["nested row/cell traversal"], evidence: "array enhanced traversal 근거입니다." },
    { id: "jls-records", repository: "JLS SE 21", path: "8.10 Record Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.10", usedFor: ["typed score model", "compact constructor", "value carriers"], evidence: "magic columns refactor 근거입니다." },
    { id: "java-arrays-api", repository: "Java SE 21 API", path: "java.util.Arrays", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html", usedFor: ["deepToString", "sort", "copy", "deep equality"], evidence: "shape display와 record array sort 근거입니다." },
    { id: "java-comparator-api", repository: "Java SE 21 API", path: "java.util.Comparator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html", usedFor: ["total desc", "ID tie-break", "contract"], evidence: "deterministic score ordering 근거입니다." },
    { id: "java-math-api", repository: "Java SE 21 API", path: "java.lang.Math exact methods", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html", usedFor: ["checked total/cell count/sum"], evidence: "overflow policy 근거입니다." },
    { id: "java-bigdecimal-api", repository: "Java SE 21 API", path: "java.math.BigDecimal", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html", usedFor: ["decimal average", "scale/division"], evidence: "평균 decimal policy 근거입니다." },
    { id: "java-roundingmode-api", repository: "Java SE 21 API", path: "java.math.RoundingMode", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/RoundingMode.html", usedFor: ["DOWN", "HALF_UP", "display rounding"], evidence: "truncate/round mode 근거입니다." },
    { id: "java-scanner-api", repository: "Java SE 21 API", path: "java.util.Scanner", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Scanner.html", usedFor: ["token input", "invalid/EOF", "close ownership"], evidence: "Ex09 adapter 보강 근거입니다." },
  ],
  sourceCoverage: { filesRead: 5, filesUsed: 5, uncoveredNotes: ["다섯 파일을 JDK21로 compile/run해 warning0과 deterministic outputs를 확인했습니다.", "Ex05/07 identity text를 실제 주소로 부르지 않습니다.", "Ex07 direct access는 jagged라 불가능한 것이 아니라 row가 null이라 실패하며 dereference할 rows만 생성하면 됩니다.", "Ex08의 average60 F는 Ex09의 D policy와 불일치합니다.", "Ex03 one-decimal truncate와 Ex09 integer division을 구분했습니다.", "parallel arrays와 magic columns는 source evidence이지 권장 production model이 아닙니다.", "tie policies·record refactor·BigDecimal rounding·property tests는 공식 문서 기반 보강입니다."] },
} satisfies DetailedSession;

export default session;
