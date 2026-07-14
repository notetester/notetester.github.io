import type {
  DetailedCodeExample,
  DetailedSession,
  DiagnosticCase,
  SessionConcept,
  SessionExercise,
  SessionLab,
  SessionPrerequisite,
  SessionSource,
} from "../../types";

export const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar); $root=Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); if(Test-Path -LiteralPath $root){throw \"unexpected temp collision\"}; New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null; try{$classes=Join-Path $root \"classes\";New-Item -ItemType Directory -Path $classes -ErrorAction Stop|Out-Null;$compiler=@(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1);if($LASTEXITCODE-ne0-or$compiler.Count-ne0){throw(\"javac failed or warned: \"+($compiler-join[Environment]::NewLine))};Push-Location $root;try{& java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\";if($LASTEXITCODE-ne0){throw \"java failed\"}}finally{Pop-Location}}finally{$resolved=[IO.Path]::GetFullPath($root);if(-not[string]::Equals([IO.Path]::GetDirectoryName($resolved),$base,[StringComparison]::OrdinalIgnoreCase)){throw \"unsafe cleanup\"};if(Test-Path -LiteralPath $resolved){Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop};if(Test-Path -LiteralPath $resolved){throw \"cleanup failed\"}}}'";

export type MvcTraceCase = {
  input: string;
  decision: string;
  evidence: string;
};

export type MvcTopicSpec = {
  id: string;
  title: string;
  lead: string;
  explanations: string[];
  concepts: SessionConcept[];
  diagnostics: DiagnosticCase[];
  expertNotes: string[];
  trace?: {
    className: string;
    title: string;
    purpose: string;
    cases: MvcTraceCase[];
    defaultDecision: string;
    defaultEvidence: string;
    sourceRefs: string[];
  };
  customExample?: DetailedCodeExample;
};

export type MvcSessionProfile = {
  inventoryId: string;
  order: number;
  title: string;
  subtitle: string;
  level: DetailedSession["level"];
  estimatedMinutes: number;
  coreQuestion: string;
  summary: string;
  objectives: string[];
  prerequisites: SessionPrerequisite[];
  keywords: string[];
  topics: MvcTopicSpec[];
  lab: SessionLab;
  exercises: SessionExercise[];
  nextSessions: string[];
  sources: SessionSource[];
  sourceCoverage: DetailedSession["sourceCoverage"];
};

const javaLiteral = (value: string) =>
  JSON.stringify(value).replaceAll("\\u2028", "\\\\u2028").replaceAll("\\u2029", "\\\\u2029");

const makeTraceExample = (
  topicId: string,
  trace: NonNullable<MvcTopicSpec["trace"]>,
): DetailedCodeExample => {
  const cases = trace.cases
    .map(
      (item) =>
        `            case ${javaLiteral(item.input)} -> new Result(${javaLiteral(item.decision)}, ${javaLiteral(item.evidence)});`,
    )
    .join("\n");
  const inputs = [...trace.cases.map((item) => item.input), "UNKNOWN"]
    .map(javaLiteral)
    .join(", ");
  const code = `import java.util.List;

public class ${trace.className} {
    record Result(String decision, String evidence) {}

    static Result decide(String input) {
        return switch (input) {
${cases}
            default -> new Result(${javaLiteral(trace.defaultDecision)}, ${javaLiteral(trace.defaultEvidence)});
        };
    }

    public static void main(String[] args) {
        List<String> inputs = List.of(${inputs});
        for (String input : inputs) {
            Result result = decide(input);
            System.out.printf("input=%s|decision=%s|evidence=%s%n",
                    input, result.decision(), result.evidence());
        }
    }
}`;
  const output = [...trace.cases, {
    input: "UNKNOWN",
    decision: trace.defaultDecision,
    evidence: trace.defaultEvidence,
  }]
    .map((item) => `input=${item.input}|decision=${item.decision}|evidence=${item.evidence}`)
    .join("\n");
  return {
    id: `java-${topicId}-decision-trace`,
    title: trace.title,
    language: "java",
    filename: `${trace.className}.java`,
    purpose: trace.purpose,
    code,
    walkthrough: [
      { lines: "1", explanation: "JDK collection만 사용해 외부 framework·database·network 의존성을 제거합니다." },
      { lines: "3-3", explanation: "결정과 공개 가능한 근거를 하나의 immutable record로 묶습니다." },
      { lines: "5-13", explanation: "입력을 exhaustive switch decision table에 통과시키고 알 수 없는 값은 명시적으로 거부합니다." },
      { lines: "15-22", explanation: "정상·경계·실패 입력과 UNKNOWN을 고정 순서로 실행해 exact trace를 만듭니다." },
    ],
    run: {
      environment: ["PowerShell 7+", "OpenJDK 21", "빈 owned 임시 디렉터리", "외부 DB·Servlet container·network 불필요"],
      command: isolatedJavaRun(`${trace.className}.java`, trace.className),
    },
    output: {
      value: output,
      explanation: [
        "각 입력은 한 결정과 한 근거에만 매핑되어 분기 누락을 눈으로 검토할 수 있습니다.",
        "UNKNOWN이 조용히 성공하지 않으므로 새 상태나 명령 추가 시 contract drift가 드러납니다.",
        "이 예제는 경계의 상태 기계를 검증하며 실제 Servlet·MyBatis 통합 검증을 대체하지 않습니다.",
      ],
    },
    experiments: [
      { change: "UNKNOWN의 default를 첫 성공 분기로 바꿉니다.", prediction: "오타나 새 입력이 정상 처리되어 fail-open이 됩니다.", result: "default는 명시 거부로 유지하고 새 입력은 별도 case와 test로 추가합니다." },
      { change: "decision만 출력하고 evidence를 없앱니다.", prediction: "결과는 같아도 왜 선택됐는지 회귀 근거가 사라집니다.", result: "public-safe evidence를 함께 남겨 운영 진단과 학습 설명을 연결합니다." },
      { change: "cases 순서를 무작위로 섞습니다.", prediction: "실행마다 출력이 달라 exact comparison이 어려워집니다.", result: "고정 List 순서로 재현 가능한 출력을 보존합니다." },
    ],
    sourceRefs: trace.sourceRefs,
  };
};

export const buildMvcSession = (profile: MvcSessionProfile): DetailedSession => {
  if (profile.topics.length !== 10) throw new Error(`${profile.inventoryId}: topics must be 10`);
  const chapters = profile.topics.map((topic) => ({
    id: topic.id,
    title: topic.title,
    lead: topic.lead,
    explanations: topic.explanations,
    concepts: topic.concepts,
    codeExamples: [topic.customExample ?? makeTraceExample(topic.id, topic.trace!)],
    diagnostics: topic.diagnostics,
    expertNotes: topic.expertNotes,
  }));
  const reviewQuestions = profile.topics.flatMap((topic) => [
    { question: `${topic.title}에서 '${topic.concepts[0].term}'은 무엇이며 왜 필요한가요?`, answer: `${topic.concepts[0].definition} ${topic.concepts[0].detail[0]}` },
    { question: `${topic.title}의 원본 또는 단순 구현에서 가장 먼저 확인할 실패 경계는 무엇인가요?`, answer: topic.diagnostics[0].likelyCause + " " + topic.diagnostics[0].checks[0] },
    { question: `${topic.title}를 검증할 때 어떤 결정적 근거를 남겨야 하나요?`, answer: topic.explanations[Math.min(2, topic.explanations.length - 1)] },
    { question: `${topic.title}를 운영 수준으로 올릴 때 마지막으로 확인할 원칙은 무엇인가요?`, answer: topic.expertNotes[0] },
  ]);
  const completionChecklist = profile.topics.flatMap((topic) => [
    `${topic.title}: 요청·상태·결과의 owner를 문장으로 설명할 수 있다.`,
    `${topic.title}: ${topic.concepts[0].term}과 ${topic.concepts[1].term}의 경계를 예제로 구분했다.`,
    `${topic.title}: 정상·경계·UNKNOWN 분기의 exact 출력을 재현했다.`,
    `${topic.title}: '${topic.diagnostics[0].symptom}'의 원인·확인·수정 순서를 기록했다.`,
    `${topic.title}: secret·PII·사용자 입력을 공개 evidence에서 제거했다.`,
    `${topic.title}: unit state machine과 실제 container/DB integration evidence를 구분했다.`,
  ]);
  return {
    schemaVersion: 2,
    inventoryIds: [profile.inventoryId],
    slug: profile.inventoryId,
    courseId: "servlet-jsp",
    moduleId: "mvc-mybatis-capstone",
    order: profile.order,
    title: profile.title,
    subtitle: profile.subtitle,
    level: profile.level,
    estimatedMinutes: profile.estimatedMinutes,
    coreQuestion: profile.coreQuestion,
    summary: profile.summary,
    objectives: profile.objectives,
    prerequisites: profile.prerequisites,
    keywords: profile.keywords,
    chapters,
    lab: profile.lab,
    exercises: profile.exercises,
    reviewQuestions,
    completionChecklist,
    relatedGlossary: profile.keywords.slice(0, 12),
    nextSessions: profile.nextSessions,
    sources: profile.sources,
    sourceCoverage: profile.sourceCoverage,
  };
};

const mvc01Audit: DetailedCodeExample = {
  id: "powershell-mvc01-original-static-audit",
  title: "원본5의 factory·mapper·XML·VO shape를 credential 비공개로 감사합니다",
  language: "powershell",
  filename: "verify-original-mvc01.ps1",
  purpose: "DB 연결이나 MyBatis 초기화를 하지 않고 interface/XML binding과 설정 위험을 exact count로 보존합니다.",
  code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$rels=@(
  'jspstudy/src/main/java/org/study/jspstudy/db/DBUtil.java',
  'jspstudy/src/main/java/org/study/jspstudy/mapper/BookMapper.java',
  'jspstudy/src/main/resources/mybatis-config.xml',
  'jspstudy/src/main/resources/mapper/BookMapper.xml',
  'jspstudy/src/main/java/org/study/jspstudy/vo/BookVO.java'
)
$files=@($rels|ForEach-Object{Get-Item -LiteralPath (Join-Path $SourceRoot $_)})
if($files.Count-ne5){throw 'inventory drift'}
$before=@{};foreach($file in $files){$before[$file.FullName]=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash}
function Read([string]$rel){[IO.File]::ReadAllText((Join-Path $SourceRoot $rel))}
function Count([string]$text,[string]$pattern){([regex]::Matches($text,$pattern,[Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count}
$db=Read $rels[0];$interface=Read $rels[1];$config=Read $rels[2];$mapper=Read $rels[3];$vo=Read $rels[4]
$active=[regex]::Replace($mapper,'(?s)<!--.*?-->','')
$methods=Count $interface '(?m)^\s*(?:List<BookVO>|BookVO|int)\s+\w+\s*\('
$statements=Count $active '<(?:select|insert|update|delete)\b'
$binds=Count $active '#\{';$raw=Count $active '\$\{';$stars=Count $active 'select\s+\*'
$sessions=Count $db '\.openSession\s*\('
$getters=Count $vo 'public\s+String\s+get(?:BookId|BookName|Publisher|Price|Stock)\s*\('
$sensitive=Count $config 'name="(?:username|password)"'
if($methods-ne5-or$statements-ne5-or$binds-ne11-or$raw-ne0-or$stars-ne2-or$sessions-ne2-or$getters-ne5-or$sensitive-ne2){throw 'source shape drift'}
foreach($file in $files){if((Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash-cne$before[$file.FullName]){throw 'source hash drift'}}
"files=5|mapperMethods=5|activeStatements=5|selectStar=2|binds=11|rawSubstitution=0|openSession=2|voGetters=5|sensitiveProperties=2|redacted=True|hashes=5/5"
"execution=static-only|db=not-contacted|credentials=not-output"`,
  walkthrough: [
    { lines: "1-10", explanation: "inventory의 실제 상대 경로5를 고정하고 누락을 즉시 실패시킵니다." },
    { lines: "11-16", explanation: "source hashes를 값 공개 없이 보존하고 텍스트·count helpers를 준비합니다." },
    { lines: "17-23", explanation: "XML comments를 제외한 active statements와 binding·factory·VO·민감 설정 shape를 셉니다." },
    { lines: "24-27", explanation: "exact contract와 source 불변성을 확인하고 credential values 없이 semantic summary만 출력합니다." },
  ],
  run: { environment: ["PowerShell 7+", "jspstudy 저장소의 상위 폴더", "정적 파일 읽기만 허용", "DB·MyBatis·network 실행 금지"], command: "pwsh -NoProfile -File verify-original-mvc01.ps1 -SourceRoot ./jspstudy" },
  output: { value: "files=5|mapperMethods=5|activeStatements=5|selectStar=2|binds=11|rawSubstitution=0|openSession=2|voGetters=5|sensitiveProperties=2|redacted=True|hashes=5/5\nexecution=static-only|db=not-contacted|credentials=not-output", explanation: ["interface5와 active XML statement5가 대응합니다.", "값 binding은11이고 raw substitution은0입니다.", "credential은 존재 여부2만 기록하고 값·hash를 공개하지 않습니다."] },
  experiments: [
    { change: "XML statement id 하나를 interface와 다르게 바꿉니다.", prediction: "개수만 같아도 실제 binding은 runtime에 실패합니다.", result: "다음 장의 namespace/id set equality audit를 함께 적용합니다." },
    { change: "민감 property의 value를 출력합니다.", prediction: "학습 페이지와 CI log가 secret 유출 경로가 됩니다.", result: "count와 redacted 상태만 공개합니다." },
    { change: "audit에서 DBUtil.getSession을 호출합니다.", prediction: "static initializer가 credential을 사용해 실제 DB 연결을 시도할 수 있습니다.", result: "파일 읽기와 hash 비교만 허용합니다." },
  ],
  sourceRefs: ["mvc01-dbutil", "mvc01-interface", "mvc01-config", "mvc01-mapper", "mvc01-vo"],
};

const commonDiagnostics = (subject: string): DiagnosticCase[] => [
  { symptom: `${subject}에서 시작 직후 예외가 나고 실제 원인이 보이지 않는다.`, likelyCause: "초기화·mapping·환경 오류를 한 RuntimeException으로 뭉개고 public message와 internal cause를 분리하지 않았습니다.", checks: ["exception cause chain을 확인합니다.", "resource path와 namespace/id/type alias를 검증합니다.", "secret 값 없이 environment name과 correlation id만 기록합니다."], fix: "구성 검증을 startup에 수행하고 typed failure·원인 보존·공개 메시지 분리를 적용합니다.", prevention: "configuration contract test와 redacted startup health check를 둡니다." },
  { symptom: `${subject}의 unit 예제는 통과하지만 실제 DB에서 다르게 동작한다.`, likelyCause: "JDK state machine은 경계 규칙만 검증하며 driver·schema·transaction·XML runtime semantics를 실행하지 않습니다.", checks: ["unit과 integration test 범위를 구분합니다.", "실제 mapper statement id와 schema를 확인합니다.", "ephemeral DB migration version을 기록합니다."], fix: "격리된 test DB에서 MyBatis integration test를 추가하되 운영 credential을 사용하지 않습니다.", prevention: "unit contract와 real-engine integration suite를 CI의 별도 단계로 유지합니다." },
];

const topics: MvcTopicSpec[] = [
  {
    id: "mvc01-original-five-file-audit",
    title: "원본5의 SqlSessionFactory·mapper interface/XML·BookVO를 안전하게 해부합니다",
    lead: "실제 DB와 credential은 건드리지 않고 파일 폐쇄·active statement·binding·type shape만 exact하게 고정합니다.",
    explanations: [
      "실제 inventory는 DBUtil.java, BookMapper.java, mybatis-config.xml, BookMapper.xml, BookVO.java 다섯 파일이며 모두 읽고 사용했습니다.",
      "DBUtil의 static initializer는 mybatis-config.xml Reader로 SqlSessionFactory를 한 번 만들고 getSession 두 overload가 manual/auto-commit session을 엽니다.",
      "BookMapper interface의 selectAllBook·selectBookById·insertBook·updateBook·deleteBook 다섯 method와 active XML statement 다섯 개가 이름과 역할로 대응합니다.",
      "XML에는 `#{}` binding11개와 `${}` raw substitution0개가 있어 값 SQL injection 면에서는 올바른 출발점입니다.",
      "두 SELECT는 `SELECT *`와 resultType BookVO를 사용합니다. column 이름과 JavaBean property가 우연히 맞는 동안만 자동 mapping이 안정적입니다.",
      "BookVO의 bookId·bookName·publisher·price·stock은 모두 String입니다. 숫자 가격·재고의 범위와 산술 불변식이 Java type에 표현되지 않습니다.",
      "config에는 username/password property가 source literal로 존재합니다. audit는 존재 count만 확인하고 값이나 hash를 절대 출력하지 않습니다.",
      "이 장의 PowerShell은 source hash 전후 equality와 정규식 shape만 확인하며 DBUtil class loading, MyBatis builder, driver, network를 실행하지 않습니다.",
    ],
    concepts: [
      { term: "source closure", definition: "한 학습 주제를 설명하는 inventory와 직접 구성 의존성을 빠짐없이 묶은 집합입니다.", detail: ["interface·XML·config·VO·factory를 함께 봅니다.", "외부 runtime은 별도 integration 경계입니다."] },
      { term: "active statement", definition: "XML comment가 아닌 mapper 안에서 MyBatis가 등록할 select/insert/update/delete 선언입니다.", detail: ["주석 속 예시는 count에서 제외합니다.", "id와 namespace까지 계약입니다."] },
      { term: "redacted audit", definition: "민감 값 대신 존재·개수·정책 위반 여부만 공개하는 정적 감사입니다.", detail: ["credential value와 hash를 숨깁니다.", "source mutation도 검사합니다."] },
    ],
    diagnostics: commonDiagnostics("원본 MyBatis 폐쇄"),
    expertNotes: ["정적 count는 runtime mapper registration이나 SQL correctness를 증명하지 않으므로 ephemeral database integration evidence와 분리합니다.", "약한 secret은 hash만 공개해도 추측 공격을 도울 수 있으므로 값과 hash 모두 비공개가 안전합니다."],
    customExample: mvc01Audit,
  },
  {
    id: "mvc01-config-resource-factory-lifecycle",
    title: "mybatis-config.xml을 읽어 SqlSessionFactory를 한 번 안전하게 구성합니다",
    lead: "configuration resource·environment·transaction manager·data source를 startup lifecycle과 secret 경계로 연결합니다.",
    explanations: [
      "SqlSessionFactoryBuilder는 configuration Reader를 파싱해 immutable하게 공유할 factory를 만듭니다. request마다 다시 build하면 XML parse와 pool 구성이 반복됩니다.",
      "factory는 application lifetime에 공유할 수 있지만 SqlSession은 request/transaction lifetime에만 소유해야 합니다.",
      "원본 JDBC transaction manager는 session의 commit/rollback과 connection lifecycle을 MyBatis API에 연결하고 POOLED data source는 connection 재사용을 담당합니다.",
      "environment id는 dev/test/prod 구성 선택점입니다. 같은 artifact에 운영 비밀번호를 넣는 대신 외부 secret과 profile별 최소 권한 계정을 주입해야 합니다.",
      "Resources.getResourceAsReader는 classpath resource 이름과 encoding/path 실패를 startup에서 드러냅니다. Reader도 try-with-resources로 명시 소유하는 편이 분명합니다.",
      "static initializer 실패는 class initialization error로 전파되어 호출 지점이 혼란스러울 수 있습니다. bootstrap component가 validation 결과와 원인을 보존해야 합니다.",
      "pool은 timeout·최대 연결·validation·state reset이 없는 단순 속도 장치가 아닙니다. DB capacity와 query latency에 근거한 예산이 필요합니다.",
      "health check는 credential·JDBC URL 전체를 로그에 쓰지 않고 environment name, mapper count, redacted endpoint class와 correlation id만 공개합니다.",
    ],
    concepts: [
      { term: "SqlSessionFactory", definition: "검증된 MyBatis configuration에서 transaction-scoped SqlSession을 만드는 thread-safe factory입니다.", detail: ["application scope로 공유합니다.", "session 자체와 수명을 구분합니다."] },
      { term: "environment", definition: "transaction manager와 data source 조합을 이름으로 선택하는 MyBatis 구성 단위입니다.", detail: ["test와 prod를 분리합니다.", "secret 값은 외부 주입합니다."] },
      { term: "bootstrap validation", definition: "트래픽 수락 전에 resource·mapper·secret reference·pool 설정을 검증하는 단계입니다.", detail: ["fail fast합니다.", "public-safe evidence만 남깁니다."] },
    ],
    diagnostics: commonDiagnostics("SqlSessionFactory bootstrap"),
    expertNotes: ["Factory singleton은 global mutable service locator보다 dependency injection으로 전달할 때 test isolation과 lifecycle ownership이 더 선명합니다.", "Pool size는 request thread 수가 아니라 database capacity, transaction duration과 queueing SLO에서 역산합니다."],
    trace: { className: "FactoryBootstrapDecision", title: "환경별 factory bootstrap을 fail-closed decision table로 만듭니다", purpose: "resource·secret reference·mapper 검증 전에는 READY가 되지 않는 startup 상태를 재현합니다.", cases: [
      { input: "VALIDATED", decision: "READY", evidence: "resource+mapper+secret-ref" },
      { input: "MISSING_RESOURCE", decision: "STOP", evidence: "configuration-not-found" },
      { input: "INLINE_SECRET", decision: "STOP", evidence: "secret-policy" },
    ], defaultDecision: "STOP", defaultEvidence: "unknown-environment", sourceRefs: ["mybatis-start", "mybatis-config", "owasp-secrets"] },
  },
  {
    id: "mvc01-session-ownership-transaction-boundary",
    title: "SqlSession을 요청·업무 transaction의 짧은 owner로 관리합니다",
    lead: "factory 공유와 session 비공유를 구분하고 read/write close·commit·rollback 규칙을 상태 기계로 만듭니다.",
    explanations: [
      "SqlSession은 connection, transaction state와 first-level cache를 품으므로 servlet field나 singleton에 저장하면 안 됩니다.",
      "한 HTTP 요청이 곧 한 transaction이라는 뜻은 아닙니다. 업무 불변식을 함께 지켜야 하는 service operation이 boundary를 결정합니다.",
      "read-only query도 session을 close해야 pool connection이 반환됩니다. try-with-resources가 가장 분명한 owner 표현입니다.",
      "manual-commit session에서 DML 성공 후 commit하지 않으면 close 시 변경이 보존되지 않습니다. 반대로 auto-commit은 여러 변경의 원자성을 잃습니다.",
      "예외 경로는 rollback을 시도하고 원래 cause를 보존해야 합니다. rollback 실패는 primary failure를 덮지 말고 suppressed/structured field로 연결합니다.",
      "commit response를 잃으면 client는 결과를 모르는 unknown outcome입니다. 무조건 재시도하지 말고 idempotency key와 reconciliation을 설계합니다.",
      "session을 command마다 새로 열면 여러 mapper 변경을 하나의 transaction으로 묶기 어렵습니다. 상위 service가 session/transaction owner가 되어야 합니다.",
      "close 뒤 mapper proxy나 lazy result를 사용하지 않도록 materialization boundary를 명시하고 view에는 detached DTO만 전달합니다.",
    ],
    concepts: [
      { term: "SqlSession", definition: "mapper 실행·transaction·connection·local cache를 묶는 짧은 수명의 작업 단위입니다.", detail: ["thread-safe하지 않습니다.", "try-with-resources로 닫습니다."] },
      { term: "transaction owner", definition: "begin부터 commit/rollback/close까지 한 업무 단위의 최종 책임을 가진 계층입니다.", detail: ["service가 적합합니다.", "DAO가 제멋대로 commit하지 않습니다."] },
      { term: "unknown commit outcome", definition: "commit 요청 뒤 응답이 끊겨 실제 반영 여부를 client가 확정할 수 없는 상태입니다.", detail: ["idempotency가 필요합니다.", "조회·조정 절차가 필요합니다."] },
    ],
    diagnostics: commonDiagnostics("SqlSession transaction"),
    expertNotes: ["MyBatis local cache scope와 transaction isolation은 같은 개념이 아니며 둘 다 stale read 분석에 포함해야 합니다.", "Framework-managed transaction으로 옮겨도 ownership은 사라지지 않고 interceptor/proxy boundary로 이동합니다."],
    trace: { className: "SessionLifecycleDecision", title: "session 상태별 허용 동작을 결정합니다", purpose: "OPEN·DIRTY·COMMITTED·FAILED·CLOSED 전이를 단순화해 commit/rollback 누락을 찾습니다.", cases: [
      { input: "READ_DONE", decision: "CLOSE", evidence: "return-connection" },
      { input: "WRITE_OK", decision: "COMMIT_THEN_CLOSE", evidence: "affected-rows-valid" },
      { input: "WRITE_FAILED", decision: "ROLLBACK_THEN_CLOSE", evidence: "preserve-cause" },
    ], defaultDecision: "REJECT", defaultEvidence: "invalid-session-state", sourceRefs: ["mybatis-java-api", "jakarta-servlet"] },
  },
  {
    id: "mvc01-mapper-interface-xml-binding",
    title: "mapper interface의 FQCN·method와 XML namespace·statement id를 정확히 결합합니다",
    lead: "동일 개수보다 강한 namespace equality, id set equality, parameter/result compatibility를 startup contract로 봅니다.",
    explanations: [
      "XML mapper namespace는 interface의 fully qualified class name과 같아야 proxy가 statement를 찾습니다.",
      "interface method name과 statement id는 같은 문자열이어야 합니다. overload는 XML id 하나로 모호해질 수 있어 피하는 편이 안전합니다.",
      "return List<BookVO>는 select 결과0..N을 뜻하고 BookVO는0..1을 뜻합니다. 데이터가2개면 TooManyResults 성격의 오류가 납니다.",
      "@Param(\"bookId\")는 XML `#{bookId}` 이름을 안정적으로 공개합니다. compiler parameter-name 옵션에 우연히 기대지 않습니다.",
      "insert/update/delete의 int return은 affected rows이며 boolean 성공보다 더 많은 이상을 드러냅니다.",
      "statementType, timeout, fetchSize와 resultMap은 method 계약의 일부지만 interface signature만 보면 보이지 않습니다. XML review가 반드시 함께 필요합니다.",
      "startup integration test는 모든 mapper를 등록하고 mappedStatement names를 예상 set과 비교하면 오타를 traffic 전에 찾을 수 있습니다.",
      "rename refactor는 Java와 XML을 동시에 바꾸고 negative test로 오래된 id가 사라졌는지도 확인해야 합니다.",
    ],
    concepts: [
      { term: "mapper proxy", definition: "interface method 호출을 namespace.id mapped statement 실행으로 변환하는 MyBatis runtime proxy입니다.", detail: ["구현 class를 직접 쓰지 않습니다.", "method contract와 XML을 함께 봅니다."] },
      { term: "namespace", definition: "mapped statement id의 충돌을 막고 mapper interface와 결합하는 XML의 논리 이름입니다.", detail: ["FQCN을 사용합니다.", "대소문자까지 일치시킵니다."] },
      { term: "statement id", definition: "namespace 안에서 select/insert/update/delete를 식별하고 interface method와 연결하는 이름입니다.", detail: ["id set equality를 검증합니다.", "overload를 피합니다."] },
    ],
    diagnostics: commonDiagnostics("mapper interface/XML binding"),
    expertNotes: ["MappedStatement registry를 startup에 감사하면 호출되지 않은 mapper 오타도 조기에 찾을 수 있습니다.", "Mapper method는 persistence port이며 HTTP request/response type을 signature에 섞지 않아야 재사용 가능합니다."],
    trace: { className: "MapperBindingDecision", title: "namespace·id·return cardinality를 함께 판정합니다", purpose: "문자열 하나만 맞추는 검사를 넘어 mapper binding의 세 조건을 표현합니다.", cases: [
      { input: "FQCN+ID+TYPE", decision: "REGISTER", evidence: "contract-complete" },
      { input: "WRONG_NAMESPACE", decision: "REJECT", evidence: "statement-not-found" },
      { input: "LIST_TO_ONE", decision: "REJECT", evidence: "cardinality-mismatch" },
    ], defaultDecision: "REJECT", defaultEvidence: "unmapped-contract", sourceRefs: ["mvc01-interface", "mvc01-mapper", "mybatis-start", "mybatis-sqlmap"] },
  },
  {
    id: "mvc01-parameter-binding-injection-boundary",
    title: "`#{}` 값 binding과 `${}` 문자열 치환의 보안 경계를 분리합니다",
    lead: "값은 parameter로, 식별자·정렬 방향은 enum allowlist로 변환해 SQL 구조를 사용자 입력에서 분리합니다.",
    explanations: [
      "`#{bookId}`는 PreparedStatement parameter marker와 typed binding으로 변환되어 값이 SQL grammar가 되지 않습니다.",
      "`${column}`은 text를 SQL에 그대로 넣으므로 사용자 입력을 전달하면 injection입니다. parameter marker는 table/column/order keyword를 대신할 수 없습니다.",
      "동적 정렬은 raw input을 직접 치환하지 말고 `NAME -> book_name`, `PRICE -> price` 같은 server enum allowlist로 변환합니다.",
      "LIKE 검색은 `%`와 `_` wildcard semantics도 요구사항에 따라 escape해야 합니다. injection 방지와 wildcard 정책은 별개입니다.",
      "null, empty, whitespace, Unicode normalization, 숫자 범위는 mapper 전 validation boundary에서 domain value로 변환합니다.",
      "로그에는 SQL template id와 redacted parameter metadata만 남기고 비밀번호·email·본문과 전체 bind 값을 남기지 않습니다.",
      "원본 mapper의 raw substitution0은 좋은 근거지만 validation·authorization·least privilege까지 자동으로 보장하지 않습니다.",
      "DB 계정은 mapper가 필요한 schema와 CRUD 권한만 가져 injection 이후 피해 범위와 실수를 줄여야 합니다.",
    ],
    concepts: [
      { term: "parameter binding", definition: "SQL 구조와 값을 분리해 driver에 typed value로 전달하는 과정입니다.", detail: ["`#{}`가 사용됩니다.", "값 injection을 막습니다."] },
      { term: "raw substitution", definition: "`${}`처럼 문자열을 SQL text에 직접 삽입하는 방식입니다.", detail: ["사용자 입력에 금지합니다.", "불가피하면 enum allowlist를 사용합니다."] },
      { term: "identifier allowlist", definition: "외부 선택 값을 미리 정의한 안전한 SQL identifier constant로 변환하는 규칙입니다.", detail: ["column과 direction을 분리합니다.", "unknown은 거부합니다."] },
    ],
    diagnostics: commonDiagnostics("MyBatis parameter binding"),
    expertNotes: ["Prepared statements mitigate value-position injection; they do not authorize rows or validate business semantics.", "Dynamic SQL DSL도 사용자 문자열을 identifier로 그대로 수용하면 동일한 injection boundary를 갖습니다."],
    trace: { className: "SqlInputBoundaryDecision", title: "값·식별자·미등록 입력의 처리 방식을 판정합니다", purpose: "binding과 allowlist가 담당하는 서로 다른 SQL 위치를 구분합니다.", cases: [
      { input: "BOOK_ID_VALUE", decision: "BIND", evidence: "prepared-parameter" },
      { input: "SORT_PRICE", decision: "ALLOWLIST", evidence: "enum-to-column" },
      { input: "RAW_FRAGMENT", decision: "REJECT", evidence: "sql-structure-input" },
    ], defaultDecision: "REJECT", defaultEvidence: "unknown-input-kind", sourceRefs: ["mvc01-mapper", "mybatis-sqlmap", "owasp-sql-injection"] },
  },
  {
    id: "mvc01-result-mapping-alias-null-type",
    title: "SELECT 결과를 column alias·resultMap·null/type 계약으로 BookVO에 매핑합니다",
    lead: "`SELECT *`의 암묵적 일치를 버리고 projection·alias·constructor/property mapping을 schema 변화에 견디게 만듭니다.",
    explanations: [
      "resultType 자동 mapping은 column label과 JavaBean property 이름이 일치하거나 설정된 underscore-to-camel 규칙이 맞아야 합니다.",
      "`SELECT *`는 column 추가·순서·민감 column 노출을 query contract에 끌어들입니다. 필요한 column을 명시합니다.",
      "DB가 `book_id`, Java가 `bookId`라면 `book_id AS bookId` 또는 resultMap을 사용해 mapping 근거를 코드에 남깁니다.",
      "resultMap은 id/result association과 jdbcType/javaType, constructor mapping을 명시할 수 있어 복잡한 DTO에 적합합니다.",
      "primitive numeric은 SQL NULL을 표현하지 못합니다. nullable column은 wrapper/Optional boundary 또는 domain default 정책을 선택합니다.",
      "원본 price와 stock String은 invalid numeric text가 view까지 이동할 수 있습니다. BigDecimal과 int/long 범위로 변환 책임을 명시합니다.",
      "한 건 query는 absent를 정상 상태로 다뤄 null을 곧바로 JSP property access에 넘기지 말고 NotFound result로 변환합니다.",
      "mapping integration test는 column labels·null·Unicode·큰 숫자·scale과 schema migration version을 실제 engine에서 검증합니다.",
    ],
    concepts: [
      { term: "resultType", definition: "column labels를 지정 Java type의 properties에 자동 매핑하는 간단한 결과 선언입니다.", detail: ["이름 규칙에 의존합니다.", "단순 projection에 적합합니다."] },
      { term: "resultMap", definition: "column과 property/constructor/association 관계를 명시하는 재사용 가능한 mapping 계약입니다.", detail: ["복잡한 mapping을 가시화합니다.", "id column을 표시합니다."] },
      { term: "projection", definition: "query가 반환할 column 집합과 label을 명시한 읽기 계약입니다.", detail: ["SELECT *를 피합니다.", "민감 column을 최소화합니다."] },
    ],
    diagnostics: commonDiagnostics("MyBatis result mapping"),
    expertNotes: ["Mapping layer에서 domain object와 view DTO를 구분하면 password/secret-like columns의 accidental exposure를 구조적으로 줄일 수 있습니다.", "BigDecimal scale과 database DECIMAL scale의 equality/rounding 정책은 mapper 밖 domain 규칙으로 명시합니다."],
    trace: { className: "ResultMappingDecision", title: "column label과 target type에 따라 mapping 전략을 선택합니다", purpose: "자동 mapping·alias·resultMap·거부 조건을 결정적으로 비교합니다.", cases: [
      { input: "LABEL_MATCH", decision: "RESULT_TYPE", evidence: "simple-properties" },
      { input: "SNAKE_CAMEL", decision: "ALIAS_OR_RESULT_MAP", evidence: "explicit-name" },
      { input: "NULL_TO_PRIMITIVE", decision: "REJECT", evidence: "type-nullability" },
    ], defaultDecision: "REVIEW", defaultEvidence: "unknown-projection", sourceRefs: ["mvc01-mapper", "mvc01-vo", "mybatis-sqlmap"] },
  },
  {
    id: "mvc01-bookvo-domain-boundary",
    title: "BookVO를 transport bag에서 검증된 도메인 값 경계로 발전시킵니다",
    lead: "문자열5개를 그대로 운반하는 편의와 id·money·stock의 타입 불변식을 구분합니다.",
    explanations: [
      "JavaBean no-arg constructor와 getters/setters는 MyBatis property mapping에 편리하지만 어떤 순서로든 invalid state를 만들 수 있습니다.",
      "bookId는 trim·length·allowed character·identity 정책을 거친 value object로 만들 수 있습니다.",
      "price는 floating point가 아니라 BigDecimal과 currency/scale/rounding policy가 필요합니다.",
      "stock은 음수 허용 여부, 최대값, concurrent decrement rule을 int/long과 domain method에 표현합니다.",
      "mapper DTO는 persistence nullability를 표현하고 domain object는 생성 시 불변식을 검증한 뒤 immutable하게 유지하는 이중 모델이 유용할 수 있습니다.",
      "JSP request parameter를 곧바로 VO setter에 넣지 말고 parse errors를 field별 validation result로 수집합니다.",
      "toString, logs, debugger views에 민감 정보가 포함될 수 있으므로 DTO 전체 자동 로깅을 피하고 allowlisted fields만 남깁니다.",
      "schema constraint와 Java validation은 중복이 아니라 서로 다른 신뢰 경계입니다. 최종 무결성은 DB constraint로도 보호합니다.",
    ],
    concepts: [
      { term: "JavaBean", definition: "no-arg constructor와 property accessor 규약을 따르는 mutable 객체 형태입니다.", detail: ["framework mapping에 편리합니다.", "invalid intermediate state를 허용할 수 있습니다."] },
      { term: "value object", definition: "검증된 값과 의미·동등성·불변식을 함께 캡슐화한 작은 immutable type입니다.", detail: ["BookId·Money 등에 적합합니다.", "생성 시 검증합니다."] },
      { term: "DTO-domain split", definition: "외부/DB representation과 업무 불변식을 지닌 domain model을 분리하는 설계입니다.", detail: ["mapping cost가 생깁니다.", "경계가 명확해집니다."] },
    ],
    diagnostics: commonDiagnostics("BookVO domain boundary"),
    expertNotes: ["An anemic DTO is not inherently wrong at a persistence boundary; the risk is allowing it to become the sole business-invariant owner.", "Validation messages should retain field/code metadata rather than embedding raw rejected PII in logs."],
    trace: { className: "BookValueDecision", title: "책 입력을 타입별 검증 결과로 분류합니다", purpose: "문자열 운반과 검증된 domain value 생성의 경계를 보여 줍니다.", cases: [
      { input: "PRICE_12000.00", decision: "MONEY", evidence: "decimal-scale-2" },
      { input: "STOCK_-1", decision: "REJECT", evidence: "negative-stock" },
      { input: "BOOK_ID_BLANK", decision: "REJECT", evidence: "identity-required" },
    ], defaultDecision: "REJECT", defaultEvidence: "unparsed-field", sourceRefs: ["mvc01-vo", "mybatis-sqlmap"] },
  },
  {
    id: "mvc01-crud-statement-affected-row-contract",
    title: "mapped CRUD statement를 SQL 의미·affected rows·key·timeout 계약으로 읽습니다",
    lead: "문장이 실행됐다는 사실보다 기대 row 수와 업무 결과를 명시해 silent corruption을 막습니다.",
    explanations: [
      "selectAllBook은0..N, selectBookById는0..1 cardinality를 갖습니다. unique key가 없다면 한 건 method 계약이 깨질 수 있습니다.",
      "insert는 affected rows1과 identity 생성 정책을 확인합니다. DB 생성 key라면 useGeneratedKeys/selectKey와 DTO mutation을 명시합니다.",
      "update/delete는 id가 없으면0, 정상 한 건이면1, 비정상 broad predicate면2+가 될 수 있습니다. 모두 같은 성공이 아닙니다.",
      "affected rows exact1 정책은 stale/not-found/conflict를 구분하는 기초이며 optimistic version predicate와 결합하면 lost update를 탐지합니다.",
      "timeout은 무한 대기 예방 장치지만 cancel 이후 transaction 상태와 connection 재사용 가능 여부를 driver별로 검증해야 합니다.",
      "fetchSize는 결과 cardinality·driver streaming behavior와 함께 조정합니다. 작은 book 목록에 무조건 큰 값을 주는 튜닝은 근거가 없습니다.",
      "SQL keyword 대소문자보다 projection, predicate indexability, constraint와 execution plan이 중요합니다.",
      "mapper integration test는0/1/2 affected rows, duplicate key, foreign key, timeout과 rollback visibility를 실제 schema에서 확인합니다.",
    ],
    concepts: [
      { term: "affected rows", definition: "DML이 삽입·수정·삭제했다고 driver가 보고한 row 수입니다.", detail: ["0/1/many를 구분합니다.", "업무 결과로 매핑합니다."] },
      { term: "cardinality", definition: "query 또는 mutation contract가 허용하는 결과 row 수 범위입니다.", detail: ["list와 one이 다릅니다.", "constraint와 함께 검증합니다."] },
      { term: "optimistic predicate", definition: "id와 기존 version을 WHERE에 넣어 동시 변경을 affected rows0으로 감지하는 조건입니다.", detail: ["lost update를 탐지합니다.", "conflict UI가 필요합니다."] },
    ],
    diagnostics: commonDiagnostics("mapped CRUD statement"),
    expertNotes: ["Some databases report matched rows versus changed rows differently; driver/URL settings and exact engine semantics must be integration-tested.", "Generated-key mutation of a DTO is a side effect that should be explicit in mapper method documentation and tests."],
    trace: { className: "AffectedRowDecision", title: "DML affected rows를 업무 결과로 변환합니다", purpose: "0·1·many를 같은 boolean으로 축약하지 않는 mapper/service 계약을 만듭니다.", cases: [
      { input: "ROWS_0", decision: "NOT_FOUND_OR_CONFLICT", evidence: "no-row-changed" },
      { input: "ROWS_1", decision: "SUCCESS", evidence: "exact-contract" },
      { input: "ROWS_2", decision: "ROLLBACK", evidence: "cardinality-breach" },
    ], defaultDecision: "ROLLBACK", defaultEvidence: "invalid-row-count", sourceRefs: ["mvc01-interface", "mvc01-mapper", "mybatis-sqlmap", "mybatis-java-api"] },
  },
  {
    id: "mvc01-error-secret-observability-boundary",
    title: "초기화·SQL·mapping 오류를 분류하고 secret·PII 없는 관측 근거를 남깁니다",
    lead: "예외를 삼키거나 전체 config/parameter를 찍지 않고 public response와 internal diagnosis를 분리합니다.",
    explanations: [
      "configuration parse, mapper registration, connection acquisition, statement prepare, constraint, timeout, mapping은 서로 다른 failure class입니다.",
      "모두 RuntimeException 하나로 감싸면 retry 가능성·HTTP status·운영 owner를 판단하기 어렵습니다. cause와 vendor-neutral category를 보존합니다.",
      "사용자에게는 correlation id와 안전한 안내를 제공하고 stack trace·SQL text·credential·내부 path는 응답에 넣지 않습니다.",
      "로그에는 event name, mapper statement id, duration bucket, affected rows category, SQLState class와 correlation id를 구조화합니다.",
      "book title/email 같은 PII/contents와 password, JDBC URL query, bind values는 allowlist하지 않는 한 기록하지 않습니다.",
      "credential rotation은 source history에서 삭제하는 것만으로 끝나지 않습니다. 노출 가능 값을 폐기하고 새 secret·권한·audit를 적용합니다.",
      "startup failure는 readiness false로 traffic을 막고 liveness restart loop와 구분합니다.",
      "metrics cardinality는 raw bookId나 exception message를 label로 쓰지 않고 bounded statement/category만 사용합니다.",
    ],
    concepts: [
      { term: "error taxonomy", definition: "오류를 원인·retry 가능성·공개 status·owner에 따라 안정된 category로 분류하는 체계입니다.", detail: ["raw message와 분리합니다.", "운영 action을 연결합니다."] },
      { term: "correlation id", definition: "사용자에게 내부 상세를 노출하지 않고 여러 log/trace를 연결하는 public-safe 식별자입니다.", detail: ["PII를 넣지 않습니다.", "요청 경계를 추적합니다."] },
      { term: "redaction allowlist", definition: "기록해도 되는 field만 명시하고 나머지는 기본적으로 제거하는 로그 정책입니다.", detail: ["secret은 항상 제외합니다.", "metrics label도 제한합니다."] },
    ],
    diagnostics: commonDiagnostics("MyBatis observability"),
    expertNotes: ["SQLState class can guide retry categorization, but retry decisions still require operation idempotency and engine-specific validation.", "A source credential incident requires rotation and history review, not merely replacing the current file."],
    trace: { className: "PersistenceErrorDecision", title: "지속성 오류를 공개 status와 운영 action으로 분류합니다", purpose: "내부 cause를 보존하면서 client와 log에 필요한 최소 정보만 선택합니다.", cases: [
      { input: "NOT_FOUND", decision: "404", evidence: "domain-absence" },
      { input: "CONSTRAINT", decision: "409", evidence: "integrity-conflict" },
      { input: "CONFIG_SECRET", decision: "NOT_READY", evidence: "rotate-and-stop" },
    ], defaultDecision: "500", defaultEvidence: "correlation-only", sourceRefs: ["mvc01-config", "owasp-secrets", "owasp-logging"] },
  },
  {
    id: "mvc01-testing-migration-production-readiness",
    title: "정적 감사·JDK contract·MyBatis integration·운영 readiness를 계층화합니다",
    lead: "각 test가 증명하는 것과 증명하지 못하는 것을 표시해 mapper가 실제 schema 변화와 운영 장애를 견디게 합니다.",
    explanations: [
      "정적 감사는 inventory completeness, namespace/id/placeholder/secret shape와 source 불변성을 DB 없이 빠르게 검증합니다.",
      "JDK decision table은 validation, affected-row, error taxonomy 같은 순수 정책을 warning0과 exact output으로 검증합니다.",
      "MyBatis integration test는 실제 XML parse, mapper proxy, type handler, driver conversion, constraint와 transaction visibility를 확인합니다.",
      "production과 같은 engine/version을 ephemeral schema에 migration으로 만들고 운영 credential·데이터·upload를 절대 복제하지 않습니다.",
      "schema migration은 expand/backfill/contract 순서와 application version compatibility window를 문서화합니다.",
      "readiness는 factory·mapper·필수 dependency 상태를 보고, liveness는 process가 회복 불가능하게 멈췄는지를 구분합니다.",
      "load test는 pool saturation, p95/p99 query/transaction duration, timeout, rollback과 connection leak을 측정합니다.",
      "release evidence에는 source inventory, migration version, test matrix, secret scan/redaction, rollback plan과 owner를 남깁니다.",
    ],
    concepts: [
      { term: "contract test", definition: "경계 양쪽이 합의한 입력·출력·실패 규칙을 실제 구현 또는 안정된 double로 검증하는 test입니다.", detail: ["unit과 integration을 구분합니다.", "exact failure도 검증합니다."] },
      { term: "ephemeral database", definition: "test 실행을 위해 migration으로 새로 만들고 폐기하는 격리 database instance/schema입니다.", detail: ["운영 데이터를 쓰지 않습니다.", "재현성을 높입니다."] },
      { term: "expand-contract migration", definition: "구·신 application이 공존하도록 schema를 먼저 확장하고 전환 후 오래된 구조를 제거하는 배포 전략입니다.", detail: ["compatibility window가 필요합니다.", "rollback을 고려합니다."] },
    ],
    diagnostics: commonDiagnostics("MyBatis production readiness"),
    expertNotes: ["A green in-memory database test is insufficient when production uses different SQL dialect, collation, locking or generated-key behavior.", "Readiness should not execute destructive writes; use bounded, least-privilege checks and cache stable configuration validation."],
    trace: { className: "Mvc01EvidenceDecision", title: "변경 위험에 맞는 검증 계층을 선택합니다", purpose: "static·unit·integration·release evidence의 책임을 혼동하지 않게 합니다.", cases: [
      { input: "MAPPER_RENAME", decision: "STATIC+INTEGRATION", evidence: "id-registry" },
      { input: "ROW_POLICY", decision: "UNIT+INTEGRATION", evidence: "pure-rule+engine" },
      { input: "SCHEMA_CHANGE", decision: "MIGRATION+ROLLBACK", evidence: "compatibility-window" },
    ], defaultDecision: "FULL_REVIEW", defaultEvidence: "unclassified-change", sourceRefs: ["mybatis-start", "mybatis-config", "mybatis-java-api", "jakarta-servlet", "owasp-secrets"] },
  },
];

const sources: SessionSource[] = [
  { id: "mvc01-dbutil", repository: "nohssam/jspstudy", path: "jspstudy/src/main/java/org/study/jspstudy/db/DBUtil.java", usedFor: ["factory lifecycle", "session overloads", "startup failure"], evidence: "SqlSessionFactory static build와 openSession 두 overload를 직접 확인했습니다." },
  { id: "mvc01-interface", repository: "nohssam/jspstudy", path: "jspstudy/src/main/java/org/study/jspstudy/mapper/BookMapper.java", usedFor: ["mapper methods", "@Param", "affected rows"], evidence: "select2·DML3 method signature를 직접 확인했습니다." },
  { id: "mvc01-config", repository: "nohssam/jspstudy", path: "jspstudy/src/main/resources/mybatis-config.xml", usedFor: ["environment", "JDBC transaction manager", "pooled data source", "secret hygiene"], evidence: "민감 값은 복제하지 않고 property 존재와 mapper resource만 확인했습니다." },
  { id: "mvc01-mapper", repository: "nohssam/jspstudy", path: "jspstudy/src/main/resources/mapper/BookMapper.xml", usedFor: ["namespace/id", "CRUD", "binding", "resultType"], evidence: "active statements5, #{}11, ${}0, SELECT *2를 확인했습니다." },
  { id: "mvc01-vo", repository: "nohssam/jspstudy", path: "jspstudy/src/main/java/org/study/jspstudy/vo/BookVO.java", usedFor: ["JavaBean mapping", "String fields", "domain evolution"], evidence: "다섯 String property와 constructors/accessors를 직접 확인했습니다." },
  { id: "mybatis-start", repository: "MyBatis", path: "Getting started", publicUrl: "https://mybatis.org/mybatis-3/getting-started.html", usedFor: ["factory", "configuration", "mapper bootstrap"], evidence: "공식 MyBatis 시작 문서입니다." },
  { id: "mybatis-config", repository: "MyBatis", path: "Configuration XML", publicUrl: "https://mybatis.org/mybatis-3/configuration.html", usedFor: ["environments", "transaction manager", "data source", "settings"], evidence: "공식 configuration reference입니다." },
  { id: "mybatis-java-api", repository: "MyBatis", path: "Java API", publicUrl: "https://mybatis.org/mybatis-3/java-api.html", usedFor: ["SqlSessionFactory", "SqlSession", "commit/rollback"], evidence: "공식 Java API reference입니다." },
  { id: "mybatis-sqlmap", repository: "MyBatis", path: "Mapper XML", publicUrl: "https://mybatis.org/mybatis-3/sqlmap-xml.html", usedFor: ["mapped statements", "parameters", "resultMap"], evidence: "공식 mapper XML reference입니다." },
  { id: "jakarta-servlet", repository: "Jakarta EE", path: "Servlet 6.1 specification", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/jakarta-servlet-spec-6.1", usedFor: ["request ownership", "container integration boundary"], evidence: "공식 Jakarta Servlet specification입니다." },
  { id: "owasp-sql-injection", repository: "OWASP", path: "SQL Injection Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html", usedFor: ["prepared parameters", "allowlist"], evidence: "OWASP의 parameterized query와 allowlist 지침입니다." },
  { id: "owasp-secrets", repository: "OWASP", path: "Secrets Management Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html", usedFor: ["credential externalization", "rotation", "redaction"], evidence: "OWASP secret lifecycle 지침입니다." },
  { id: "owasp-logging", repository: "OWASP", path: "Logging Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["safe diagnostics", "PII redaction", "correlation"], evidence: "OWASP의 application logging 지침입니다." },
];

const session = buildMvcSession({
  inventoryId: "mvc-01-mybatis-config-mapper",
  order: 1,
  title: "MyBatis 설정·Mapper 결합",
  subtitle: "SqlSessionFactory와 짧은 SqlSession부터 interface/XML namespace·id·parameter·result mapping, secret·test 경계까지 연결합니다.",
  level: "중급",
  estimatedMinutes: 930,
  coreQuestion: "설정 파일·factory·session·mapper interface/XML·VO가 어떤 문자열과 수명주기 계약으로 결합되고, 이를 DB와 credential을 노출하지 않으면서 어떻게 정확히 검증할까요?",
  summary: "원본5는 static SqlSessionFactory, manual/auto-commit SqlSession overload2, BookMapper methods5와 active XML statements5, #{}11·${}0, SELECT *2, String BookVO properties5로 구성됩니다. credential property2는 값·hash를 공개하지 않고 존재만 확인했으며 실제 MyBatis·driver·DB는 실행하지 않았습니다. 이 출발점을 factory/session ownership, namespace/id/cardinality, binding/identifier allowlist, explicit projection/resultMap/null/type, affected rows, error taxonomy, secret/observability, real-engine integration과 migration readiness까지 10장으로 확장합니다.",
  objectives: ["SqlSessionFactory와 SqlSession의 공유 가능성·수명 차이를 설명한다.", "mybatis-config environment·transaction manager·data source를 안전하게 구성한다.", "mapper interface FQCN/method와 XML namespace/id set을 검증한다.", "#{} 값 binding과 ${} raw substitution·identifier allowlist를 구분한다.", "resultType 자동 mapping과 explicit alias/resultMap을 선택한다.", "BookVO String fields를 id·money·stock domain types로 발전시킨다.", "affected rows0/1/many를 업무 결과와 rollback 정책으로 변환한다.", "secret·PII 없는 오류·로그·readiness evidence를 설계한다.", "static/JDK unit/MyBatis integration/migration 검증 범위를 구분한다."],
  prerequisites: [
    { title: "PreparedStatement·트랜잭션·DAO", reason: "MyBatis가 감싸는 parameter binding, connection transaction과 persistence boundary를 이해해야 합니다.", sessionSlug: "jdbc-02-prepared-transaction-dao" },
    { title: "Servlet 요청 수명주기", reason: "SqlSession을 servlet field가 아닌 request/business-operation scope에 두는 이유를 연결합니다.", sessionSlug: "servlet-01-mapping-lifecycle-response" },
  ],
  keywords: ["MyBatis", "SqlSessionFactory", "SqlSession", "mapper proxy", "namespace", "statement id", "#{}", "${}", "parameter binding", "resultType", "resultMap", "projection", "JavaBean", "affected rows", "transaction owner", "secret redaction", "integration test"],
  topics,
  lab: {
    title: "Book mapper를 production-ready persistence port로 재설계하기",
    scenario: "원본5의 학습 가치를 보존하면서 credential literal, SELECT *, String money/stock, implicit mapping과 transaction ownership을 안전한 mapper module로 발전시킵니다.",
    setup: ["운영 credential·실데이터 없이 ephemeral test database와 migration을 준비합니다.", "원본 namespace/id/parameter/result/affected-row contract 표를 작성합니다.", "valid, absent, duplicate, invalid numeric, constraint, timeout, concurrent update fixtures를 만듭니다."],
    steps: ["secret reference 기반 environment와 singleton factory bootstrap을 구성합니다.", "mapper interface/XML namespace와 id set equality startup test를 만듭니다.", "SELECT *를 explicit projection과 alias/resultMap으로 바꿉니다.", "BookRow DTO와 validated Book domain model을 분리합니다.", "dynamic sort는 enum identifier allowlist로 제한합니다.", "service가 한 SqlSession transaction을 소유하고 exact affected rows를 검증합니다.", "optimistic version predicate와 conflict result를 추가합니다.", "public error/correlation id와 redacted structured log를 분리합니다.", "JDK policy tests와 real MyBatis/engine integration tests를 실행합니다.", "migration·rollback·pool saturation·secret rotation runbook을 완성합니다."],
    expectedResult: ["모든 mapper method가 exact mapped statement와 type/cardinality contract를 가집니다.", "사용자 값은 SQL 구조와 분리되고 raw fragment는 DB 호출 전에 거부됩니다.", "DML0/1/many와 concurrent version conflict가 명시 결과로 구분됩니다.", "credential·PII·내부 SQL은 학습 페이지와 public log에 노출되지 않습니다.", "unit과 real-engine evidence가 서로의 한계를 명시한 채 모두 통과합니다."],
    cleanup: ["ephemeral schema와 owned test artifacts만 제거합니다.", "pool을 닫고 borrowed connection과 open session이0인지 확인합니다.", "test logs를 secret/PII scan하고 안전한 aggregate evidence만 보존합니다."],
    extensions: ["Spring-managed transaction으로 옮기며 ownership 변화가 없는지 비교합니다.", "type handler로 BookId·Money mapping을 추가합니다.", "read/write datasource routing과 replica lag 정책을 설계합니다.", "mapper XML cache·local cache scope를 stale-read 시나리오로 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "BookMapper interface와 XML의 namespace/id/parameter/result contract 표를 만드세요.", requirements: ["methods5와 statements5를 set equality로 비교합니다.", "#{ }11과 ${ }0을 확인합니다.", "list/one/DML cardinality를 표시합니다.", "credential 값은 기록하지 않습니다.", "SELECT *2의 explicit projection 대안을 씁니다."], hints: ["개수만 같아도 이름이 다를 수 있습니다.", "@Param 이름과 XML token을 비교하세요."], expectedOutcome: "원본을 변조·실행하지 않는 exact mapper contract audit가 완성됩니다.", solutionOutline: ["namespace→id→parameter→return→SQL 순서로 표를 만듭니다."] },
    { difficulty: "응용", prompt: "Book update를 version 기반 optimistic transaction으로 재설계하세요.", requirements: ["id+version predicate를 사용합니다.", "affected rows0은 conflict로 변환합니다.", "exact1만 commit합니다.", "many는 rollback·alert합니다.", "unit decision table과 real engine concurrent test를 둡니다."], hints: ["마지막 write wins는 lost update를 숨깁니다."], expectedOutcome: "두 편집자가 동시에 저장해도 한 명의 변경을 조용히 덮어쓰지 않습니다.", solutionOutline: ["version을 projection/DTO/WHERE/SET에 관통시킵니다."] },
    { difficulty: "설계", prompt: "MyBatis book module의 production readiness ADR을 작성하세요.", requirements: ["factory/session/transaction owners를 표시합니다.", "secret injection·rotation을 포함합니다.", "mapper/result/type contracts를 포함합니다.", "pool·timeout·retry/idempotency를 수치화합니다.", "static/unit/integration/migration/load evidence를 구분합니다.", "rollback과 관측 runbook을 작성합니다."], hints: ["framework를 써도 transaction owner와 failure semantics는 남습니다."], expectedOutcome: "보안·정합성·운영·검증 근거가 연결된 배포 가능한 설계가 완성됩니다.", solutionOutline: ["invariant→owner→mapping→failure→evidence→operations 순서로 작성합니다."] },
  ],
  nextSessions: ["mvc-02-book-query-view"],
  sources,
  sourceCoverage: { filesRead: 5, filesUsed: 5, uncoveredNotes: ["inventory의 DBUtil·BookMapper interface·config·mapper XML·BookVO 다섯 파일을 모두 읽고 사용했습니다.", "mybatis-config의 credential values와 source secret hash는 어떤 artifact에도 복제하지 않았습니다.", "정적 shape만 실행했으며 MyBatis class loading, driver, DB connection, query와 production data는 사용하지 않았습니다."] },
});

export default session;
