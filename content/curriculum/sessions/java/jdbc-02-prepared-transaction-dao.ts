import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); if (Test-Path -LiteralPath $root) { throw \"unexpected temp collision\" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root \"classes\"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw (\"javac failed or warned: \" + ($compiler -join [Environment]::NewLine)) }; Push-Location $root; try { & java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\"; if ($LASTEXITCODE -ne 0) { throw \"java failed\" } } finally { Pop-Location } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw \"unsafe cleanup\" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw \"cleanup failed\" } } }'";

const session = {
  schemaVersion: 2,
  inventoryIds: ["jdbc-02-prepared-transaction-dao"],
  slug: "jdbc-02-prepared-transaction-dao",
  courseId: "java",
  moduleId: "java-systems",
  order: 40,
  title: "PreparedStatement·트랜잭션·DAO",
  subtitle: "값 binding부터 injection 경계, rollback·savepoint·격리 수준, DAO·pool·test double까지 업무 원자성으로 연결합니다.",
  level: "전문가",
  estimatedMinutes: 1140,
  coreQuestion: "사용자 입력을 SQL 구조와 분리하고 여러 변경을 하나의 업무 단위로 commit하거나 모두 rollback하면서, DAO의 mapping·자원·예외·pool 경계를 어떻게 검증 가능하게 설계할까요?",
  summary: "class16의 Ex09_JDBC·Ex11_JDBC·Ex13_JDBC·Ex14_DAO·Ex15_JDBC 다섯 파일이 실제 closure입니다. Ex15가 singleton Ex14_DAO를 호출하고 나머지 셋은 독립 main입니다. 실제 DB·driver·credential에는 전혀 접속하지 않고 source hash, compile과 source shape만 감사합니다. class16 package15는 net-01의 deprecated URL(String) 두 건 때문에 warnings2이지만 closure5는 JDK21 warning0입니다. 원본은 PreparedStatement12, executeQuery8, executeUpdate4, setInt4, setString9와 placeholders13으로 값 binding을 사용합니다. 반면 transaction APIs는0회라 connection 기본 auto-commit에 의존하고, update 뒤 statement를 새 query로 네 번 덮어써 첫 statement를 닫지 않으며, 동일 credential literals가 네 곳에 반복되고 SSL disabled/public-key-retrieval flags도 네 URL에 있습니다. 이 사실을 값 비공개로 투명하게 보존한 뒤 binding/null/type, SQL injection과 identifier allowlist, affected rows, transaction owner, rollback/savepoint/isolation/retry, DAO label mapping, SQLException·suppressed failures, DataSource pool reset, JDK-only proxy contract tests까지12장으로 확장합니다.",
  objectives: [
    "PreparedStatement placeholder가1부터 시작하며 SQL structure와 typed values를 분리하는 방식을 구현한다.",
    "parameter binding이 막는 value injection과 막지 못하는 identifier/order/direction injection을 구분한다.",
    "executeUpdate affected rows와 generated-key/zero/many 정책을 업무 결과로 매핑한다.",
    "autoCommit을 끄고 commit·rollback·restore를 한 owner가 관리하는 transaction template을 만든다.",
    "savepoint가 nested transaction이 아님을 알고 부분 rollback 뒤 outer commit 정책을 명시한다.",
    "격리 수준별 dirty/non-repeatable/phantom/lost-update 가능성과 optimistic retry 경계를 설명한다.",
    "DAO가 SQL·binding·ResultSet label mapping은 담당하되 UI 출력과 transaction orchestration을 분리하게 설계한다.",
    "try-with-resources close order·suppressed SQLException·SQLState/vendor code를 보존한다.",
    "DataSource pool에서 Connection.close가 물리 종료가 아닌 반환일 수 있으며 state reset과 leak detection을 검증한다.",
    "JDK dynamic proxy test double과 실제 database integration test의 역할·한계를 구분한다.",
  ],
  prerequisites: [
    { title: "Connection·Statement·ResultSet", reason: "driver loading, connection ownership, query/update 선택과 cursor lifecycle을 이미 이해해야 transaction/DAO 경계를 설계할 수 있습니다.", sessionSlug: "jdbc-01-connection-resultset" },
    { title: "캡슐화와 불변식", reason: "DAO mapping과 transaction은 field 하나가 아니라 업무 객체와 여러 rows의 불변식을 보호합니다.", sessionSlug: "oop-03-encapsulation" },
  ],
  keywords: ["JDBC", "PreparedStatement", "placeholder", "parameter binding", "SQL injection", "allowlist", "affected rows", "autoCommit", "commit", "rollback", "Savepoint", "transaction boundary", "isolation level", "dirty read", "non-repeatable read", "phantom", "lost update", "DAO", "ResultSet mapping", "SQLException", "SQLState", "try-with-resources", "DataSource", "connection pool", "test double", "integration test"],
  chapters: [],
  lab: {
    title: "주문 결제·재고 차감을 안전한 transaction과 test evidence로 재설계하기",
    scenario: "주문 row는 생성됐지만 재고 차감이 실패하거나, retry에서 결제가 중복되고, pool connection state가 다음 요청으로 새는 장애를 교정합니다.",
    setup: ["성공, 재고0, second statement failure, commit failure, rollback failure, deadlock/serialization retry와 connection reset fixtures를 만듭니다.", "실제 credential 대신 ephemeral test database용 secret injection boundary와 JDK-only unit double을 분리합니다.", "order·stock·payment·outbox의 업무 불변식과 각 SQL affected-row 기대를 문서화합니다."],
    steps: ["모든 SQL을 고정 template과 typed parameters로 분리하고 dynamic identifiers는 enum allowlist로 변환합니다.", "connection을 service transaction owner가 DataSource에서 한 번 빌립니다.", "원래 autoCommit/isolation/readOnly state를 기록하고 업무에 필요한 값으로 설정합니다.", "재고 conditional update의 affected rows=1을 요구하고0이면 domain conflict로 중단합니다.", "주문·결제·outbox 변경을 같은 transaction에 포함합니다.", "예외 시 원래 SQLException을 보존하며 rollback failure를 suppressed로 연결합니다.", "commit 성공 뒤에만 외부 response를 확정하고 connection state를 restore해 pool에 반환합니다.", "deadlock/serialization SQLState만 bounded backoff와 idempotency key로 retry합니다.", "unit proxy test에서 SQL·bind order·commit/rollback/close sequence를 검증합니다.", "ephemeral real DB integration test에서 constraint·isolation·generated keys·pool reset을 재검증합니다."],
    expectedResult: ["성공 경로는 모든 rows와 outbox가 함께 commit되고 affected rows가 exact 기대와 같습니다.", "어느 단계든 실패하면 부분 주문·재고 변경이 보이지 않고 원인·rollback failure chain이 보존됩니다.", "사용자 값은 SQL text/log에 합쳐지지 않으며 identifier attack은 DB 호출 전에 거부됩니다.", "반환된 pooled connection의 autoCommit/readOnly/isolation과 uncommitted work가 다음 borrower에 새지 않습니다."],
    cleanup: ["test pool과 DataSource를 닫고 borrowed connection leak이0인지 확인합니다.", "ephemeral schema/container만 owned test namespace에서 폐기하고 실제/local DB는 건드리지 않습니다.", "SQL traces에서 binds·credentials·PII를 redact한 뒤 필요한 aggregate evidence만 남깁니다."],
    extensions: ["transactional outbox consumer의 at-least-once delivery와 idempotent handler를 추가합니다.", "two concurrent orders로 lost-update와 conditional version update를 비교합니다.", "HikariCP leak detection·maximumPoolSize·connectionTimeout을 부하 evidence로 조정합니다.", "database proxy/toxiproxy fault로 commit response loss와 unknown outcome reconciliation을 테스트합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "문자열 결합 SELECT를 PreparedStatement binding으로 바꾸고 null을 명시 type으로 처리하세요.", requirements: ["SQL에는 placeholders만 둡니다.", "indices1..N과 JDBC types 표를 만듭니다.", "setNull 또는 setObject type contract를 명시합니다.", "attack string을 값으로 bind하고 SQL structure가 불변임을 검증합니다.", "statement/result를 try-with-resources로 닫습니다."], hints: ["placeholder는 identifier를 대신하지 못합니다.", "NULL은 문자열 'null'이 아닙니다."], expectedOutcome: "입력 내용과 무관하게 같은 SQL template과 typed bind trace를 만드는 warning0 예제가 완성됩니다.", solutionOutline: ["column schema에서 setter/type을 정합니다.", "SQL과 redacted bind metadata를 별도 evidence로 남깁니다."] },
    { difficulty: "응용", prompt: "두 account 사이 이체를 한 Connection transaction으로 구현하세요.", requirements: ["autoCommit false·commit·rollback·restore를 한 owner가 관리합니다.", "debit/credit affected rows는 각각1이어야 합니다.", "rollback failure는 original failure에 suppressed로 추가합니다.", "same-account·amount range·idempotency를 검증합니다.", "opposite transfer deadlock/serialization state의 bounded retry policy를 정의합니다."], hints: ["DAO methods마다 새 Connection을 열면 한 transaction이 아닙니다.", "commit failure는 성공으로 단정할 수 없는 unknown outcome일 수 있습니다."], expectedOutcome: "성공은 두 changes가 함께 보이고 실패는 어느 것도 보이지 않는 transaction service가 완성됩니다.", solutionOutline: ["service가 connection을 빌리고 DAOs에 전달합니다.", "catch→rollback→suppressed→restore 순서를 테스트합니다."] },
    { difficulty: "설계", prompt: "DAO·service·pool·integration-test 경계를 가진 주문 저장 architecture decision record를 작성하세요.", requirements: ["SQL/binding/mapping과 transaction orchestration 책임을 분리합니다.", "DataSource secret injection과 rotation 정책을 포함합니다.", "isolation/locking/version strategy를 anomaly별로 선택합니다.", "SQLState taxonomy·retry/idempotency·unknown commit outcome을 다룹니다.", "unit fake와 real DB contract test matrix를 만듭니다.", "pool sizing·timeout·leak·state reset SLO를 수치화합니다."], hints: ["mock가 통과해도 실제 driver conversion과 isolation은 검증되지 않습니다.", "pool size는 request thread 수가 아니라 DB capacity와 query latency에서 시작합니다."], expectedOutcome: "정합성·보안·성능·복구·검증 근거를 연결한 production JDBC runbook이 완성됩니다.", solutionOutline: ["invariant→transaction owner→SQL contracts→failure matrix→pool budget→evidence 순으로 작성합니다.", "각 failure에 public-safe diagnostic과 owner를 연결합니다."] },
  ],
  reviewQuestions: [],
  completionChecklist: [],
  nextSessions: ["servlet-01-mapping-lifecycle-response"],
  sources: [],
  sourceCoverage: {
    filesRead: 5,
    filesUsed: 5,
    uncoveredNotes: [
      "inventory의 다섯 실제 파일을 모두 사용했고 Ex15→Ex14 외 추가 source dependency가 없음을 확인했습니다.",
      "class16 Ex10/12 등 유사 CRUD variants는 jdbc-01 또는 원본 progression 배경으로 남기고 JDBC02 atomic closure에는 포함하지 않았습니다.",
      "실제 MySQL driver·localhost database·source credential은 로드/접속/사용하지 않고 compile과 redacted static shape만 감사합니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const originalAuditChapter: DetailedSession["chapters"][number] = {
  id: "class16-jdbc02-redacted-static-audit",
  title: "class16 package15·closure5의 compile·SQL·resource·credential shape를 DB 접속 없이 감사합니다",
  lead: "원본 credential 값은 출력하지 않고 source hashes와 warning, SQL/binding/resource/transaction counts만 두 launcher modes에서 검증합니다.",
  explanations: [
    "실제 closure는 inventory에 적힌 Ex09_JDBC, Ex11_JDBC, Ex13_JDBC, Ex14_DAO, Ex15_JDBC 다섯 파일입니다. Ex15가 Ex14 singleton을 호출하고 나머지 세 JDBC classes는 독립 main이므로 filesRead/Used5입니다.",
    "class16 package는 Java files15·mains14입니다. package warnings2는 net-01 대상 Ex01/02의 deprecated URL(String)이고, JDBC02 closure5·mains4는 JDK21 -Xlint:all warning0입니다.",
    "closure에는 prepareStatement12, executeQuery8, executeUpdate4가 있습니다. setInt4·setString9는 placeholders13과 정확히 대응하며 value를 SQL text에 더하는 active CRUD path는 없습니다.",
    "static SQL shapes는 SELECT8·INSERT2·UPDATE1·DELETE1입니다. 모든 ResultSet output은 ordinal getters32를 사용해 column reorder에 취약하고 DAO는 domain DTO를 반환하지 않고 console에 직접 출력합니다.",
    "try-with-resources는 Ex14 selectAll 한 곳뿐이고 explicit close calls21, null-guarded close12입니다. Ex09/11/13은 connection 이전 실패에서도 rs.close를 호출해 null failure가 원인을 가릴 수 있습니다.",
    "Ex13과 Ex14 insert/delete/update는 첫 mutation PreparedStatement를 닫기 전에 같은 variable에 SELECT statement를 네 번 덮어씁니다. finally는 마지막 statement만 닫으므로 첫 handle leak 가능성을 source shape로 기록합니다.",
    "setAutoCommit·commit·rollback·setSavepoint·transaction isolation 호출은 모두0입니다. 따라서 각 update는 driver/connection 기본 auto-commit에 의존하고 여러 changes의 업무 원자성은 표현되지 않습니다.",
    "Ex14는 selectAll/selectById/insert/delete/update 다섯 public void methods와 singleton lifecycle을 갖습니다. 출력·connection acquisition·SQL·mapping·exception translation이 한 class에 함께 있어 testability와 transaction composition이 낮습니다.",
    "동일 JDBC URL·user·password literals가 각각4곳에 있고 URL options에는 SSL disabled와 public-key retrieval enabled가 각각4번 보입니다. audit는 counts·uniqueness·redacted=True만 출력하고 실제 values·host·password를 공개하지 않습니다.",
    "audit는 javac만 실행하고 java, driver loading, DriverManager.getConnection, Scanner main을 절대 실행하지 않습니다. 실제 database·network·credential 사용은 policy로 차단합니다.",
    "source5 SHA-256을 compile 전후 비교하고 owned temp classes만 삭제합니다. launcher variables4는 child에서 제거하고 parent에 exact restore해 외부 options가 audit 결과나 class initialization을 바꾸지 못하게 합니다.",
  ],
  concepts: [
    { term: "static source audit", definition: "프로그램을 실행하지 않고 compile diagnostics·tokens·API calls·resource/secret shapes와 file integrity를 검증하는 감사입니다.", detail: ["외부 side effect를 차단합니다.", "runtime behavior 증명과 구분합니다."] },
    { term: "actual closure", definition: "inventory files와 그 compile/runtime source dependencies를 추적해 독립적으로 이해 가능한 최소 파일 집합입니다.", detail: ["Ex15→Ex14를 포함합니다.", "driver는 runtime dependency로 실행하지 않습니다."] },
    { term: "secret hygiene", definition: "credential을 source·log·public artifact에 복제하지 않고 secret manager/environment boundary, redaction과 rotation으로 관리하는 규율입니다.", detail: ["count만 공개할 수 있습니다.", "weak literal의 hash도 공개하지 않습니다."] },
  ],
  codeExamples: [{
    id: "powershell-original-jdbc02-static-audit",
    title: "원본5와 package15를 warning/shape/hash만 검사하고 credential·DB 실행을 차단합니다",
    language: "powershell",
    filename: "verify-original-jdbc02.ps1",
    purpose: "실제 DB와 credential을 사용하지 않고 원본 PreparedStatement·DAO progression의 정확한 장점과 결함을 보존합니다.",
    code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$optionNames=@('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS')
$saved=@{}
foreach($name in $optionNames){
  $item=Get-Item -LiteralPath ("Env:"+$name) -ErrorAction SilentlyContinue
  $saved[$name]=@{Exists=$null-ne$item;Value=if($item){$item.Value}else{$null}}
}
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
$root=Join-Path $base ("jdbc02 audit "+[Guid]::NewGuid().ToString('N'))
$ownsRoot=$false;$bodyError=$null;$nl=[string][char]10

function Normalize([string]$text){return $text.Replace(([string][char]13+[char]10),[string][char]10)}
function Invoke-Child([string]$file,[string[]]$arguments,[string]$cwd){
  $start=[Diagnostics.ProcessStartInfo]::new()
  $start.FileName=$file;$start.WorkingDirectory=$cwd;$start.UseShellExecute=$false
  $start.RedirectStandardInput=$true;$start.RedirectStandardOutput=$true;$start.RedirectStandardError=$true
  $start.StandardOutputEncoding=[Text.UTF8Encoding]::new($false);$start.StandardErrorEncoding=[Text.UTF8Encoding]::new($false)
  foreach($arg in $arguments){[void]$start.ArgumentList.Add($arg)}
  foreach($name in $optionNames){[void]$start.Environment.Remove($name)}
  $process=[Diagnostics.Process]::new();$process.StartInfo=$start
  try{
    if(-not$process.Start()){throw 'process start failed'}
    $outTask=$process.StandardOutput.ReadToEndAsync();$errTask=$process.StandardError.ReadToEndAsync();$process.StandardInput.Close()
    if(-not$process.WaitForExit(15000)){
      $process.Kill($true);if(-not$process.WaitForExit(5000)){throw 'termination grace exceeded'}
      [void]$outTask.GetAwaiter().GetResult();[void]$errTask.GetAwaiter().GetResult();throw 'child timeout'
    }
    return @{Exit=$process.ExitCode;Out=(Normalize $outTask.GetAwaiter().GetResult());Err=(Normalize $errTask.GetAwaiter().GetResult())}
  }finally{$process.Dispose()}
}
function Compile([IO.FileInfo[]]$files,[string]$classes,[int]$warnings,[int]$deprecated){
  New-Item -ItemType Directory -Path $classes -ErrorAction Stop|Out-Null
  $args=@('-J-Duser.language=en','-J-Duser.country=US','-encoding','UTF-8','--release','21','-proc:none','-Xlint:all','-XDrawDiagnostics','-d',$classes)+@($files.FullName)
  $result=Invoke-Child 'javac' $args $root
  if($result.Exit-ne0-or$result.Out.Length-ne0){throw 'compile failed'}
  if($warnings-eq0){if($result.Err.Length-ne0){throw 'unexpected closure warning'};return 0}
  $lines=@($result.Err.TrimEnd([char]10).Split([char]10))
  if(@($lines|Where-Object{$_-match'compiler\.warn\.has\.been\.deprecated'}).Count-ne$deprecated-or$lines.Count-ne($warnings+1)-or$lines[-1]-cne"$warnings warnings"){throw 'package warning drift'}
  return $warnings
}
function Remove-JavaComments([string]$text){return [regex]::Replace(([regex]::Replace($text,'(?s)/\*.*?\*/','')),'(?m)//.*$','')}
function Count([string]$text,[string]$pattern){return ([regex]::Matches($text,$pattern)).Count}
function Values([string]$text,[string]$pattern){return @([regex]::Matches($text,$pattern)|ForEach-Object{$_.Groups[1].Value})}
function Audit([string]$mode,[string]$class16){
  if($mode-eq'hostile'){
    $env:JDK_JAVAC_OPTIONS='-J-Djdbc02.audit=javac';$env:JDK_JAVA_OPTIONS='-Djdbc02.audit=java'
    $env:JAVA_TOOL_OPTIONS='-Djdbc02.audit=tool';$env:_JAVA_OPTIONS='-Djdbc02.audit=legacy'
  }else{foreach($name in $optionNames){Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue}}
  $package=@(Get-ChildItem -LiteralPath $class16 -Filter '*.java'|Sort-Object Name)
  $names=@('Ex09_JDBC.java','Ex11_JDBC.java','Ex13_JDBC.java','Ex14_DAO.java','Ex15_JDBC.java')
  $closure=@($names|ForEach-Object{Get-Item -LiteralPath (Join-Path $class16 $_)})
  if($package.Count-ne15-or$closure.Count-ne5){throw 'inventory drift'}
  $before=@{};foreach($file in $closure){$before[$file.Name]=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash}
  $packageWarnings=Compile $package (Join-Path $root ("package-"+$mode)) 2 2
  $closureWarnings=Compile $closure (Join-Path $root ("closure-"+$mode)) 0 0
  $mainPattern='public\s+static\s+void\s+main\s*\('
  $packageMains=@($package|Where-Object{([IO.File]::ReadAllText($_.FullName))-match$mainPattern}).Count
  $closureMains=@($closure|Where-Object{([IO.File]::ReadAllText($_.FullName))-match$mainPattern}).Count
  if($packageMains-ne14-or$closureMains-ne4){throw 'main role drift'}
  foreach($file in $closure){if((Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash-cne$before[$file.Name]){throw 'source hash drift'}}

  $raw=($closure|ForEach-Object{[IO.File]::ReadAllText($_.FullName)})-join$nl;$active=Remove-JavaComments $raw
  $prepare=Count $active '\.prepareStatement\s*\(';$query=Count $active '\.executeQuery\s*\(';$update=Count $active '\.executeUpdate\s*\('
  $bindInt=Count $active '\.setInt\s*\(';$bindString=Count $active '\.setString\s*\(';$placeholders=Count $active '\?'
  $select=Count $active '(?i)"\s*select\b';$insert=Count $active '(?i)"\s*insert\b';$updateSql=Count $active '(?i)"\s*update\b';$delete=Count $active '(?i)"\s*delete\b'
  $tryWith=Count $active 'try\s*\(';$manualClose=Count $active '\.close\s*\(';$guardedClose=Count $active 'if\s*\(\s*(?:rs|pstmt|conn)\s*!=\s*null\s*\)'
  $overwrite=Count $active '(?s)result\s*=\s*pstmt\.executeUpdate\s*\(\s*\)\s*;\s*if\s*\(result>0\)\s*\{\s*sql\s*=\s*"select[^"]*"\s*;\s*pstmt\s*=\s*conn\.prepareStatement'
  $auto=Count $active '\.setAutoCommit\s*\(';$commit=Count $active '\.commit\s*\(';$rollback=Count $active '\.rollback\s*\(';$savepoint=Count $active '\.setSavepoint\s*\(';$isolation=Count $active '\.setTransactionIsolation\s*\('
  $daoMethods=Count $active 'public\s+void\s+(?:selectAll|selectById|insert|delete|update)\s*\(';$ordinal=Count $active '\.get(?:Int|String)\s*\(\s*\d+\s*\)'
  $urls=Values $raw '(?i)\burl\s*=\s*"(jdbc:mysql:[^"]*)"';$users=Values $raw '(?i)\buser\s*=\s*"([^"]*)"';$passwords=Values $raw '(?i)\bpassword\s*=\s*"([^"]*)"'
  if($urls.Count-ne4-or$users.Count-ne4-or$passwords.Count-ne4-or@($urls|Sort-Object -Unique).Count-ne1-or@($users|Sort-Object -Unique).Count-ne1-or@($passwords|Sort-Object -Unique).Count-ne1){throw 'credential shape drift'}
  $sslDisabled=Count $raw '(?i)useSSL=false';$publicKey=Count $raw '(?i)allowPublicKeyRetrieval=true'
  if($prepare-ne12-or$query-ne8-or$update-ne4-or$bindInt-ne4-or$bindString-ne9-or$placeholders-ne13-or$select-ne8-or$insert-ne2-or$updateSql-ne1-or$delete-ne1){throw 'SQL shape drift'}
  if($tryWith-ne1-or$manualClose-ne21-or$guardedClose-ne12-or$overwrite-ne4-or$auto-ne0-or$commit-ne0-or$rollback-ne0-or$savepoint-ne0-or$isolation-ne0-or$daoMethods-ne5-or$ordinal-ne32-or$sslDisabled-ne4-or$publicKey-ne4){throw 'resource or transaction shape drift'}
  return "package=15,warnings=$packageWarnings,mains=14|closure=5,warnings=$closureWarnings,mains=4;prepared=12,query=8,update=4,bindInt=4,bindString=9,placeholders=13|sql=select8,insert2,update1,delete1|resources=tryWith1,manualClose21,guardedClose12,statementOverwrite4|transactions=autoCommit0,commit0,rollback0,savepoint0,isolation0|dao=methods5,void5,ordinalReads32|secrets=jdbcUrls4,userLiterals4,passwordLiterals4,uniqueCredentialSets1,sslDisabled4,publicKeyRetrieval4,redacted=True|hashes=5/5"
}

try{
  if(Test-Path -LiteralPath $root){throw 'unexpected temp collision'};New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null;$ownsRoot=$true
  $source=[IO.Path]::GetFullPath($SourceRoot);$class16=Join-Path $source 'src/com/java/class16'
  $baseline=Audit 'baseline' $class16;$hostile=Audit 'hostile' $class16;if($baseline-cne$hostile){throw 'baseline hostile drift'}
  "spacePath=$($root.Contains(' ')),modes=2|same=True,$baseline";'execution=compile-and-shape-only|db=not-contacted|credentials=not-used'
}catch{$bodyError=$_.Exception}finally{
  $finalErrors=[Collections.Generic.List[Exception]]::new()
  foreach($name in $optionNames){try{if($saved[$name].Exists){Set-Item -LiteralPath ("Env:"+$name)-Value $saved[$name].Value -ErrorAction Stop;$restored=Get-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue;if($null-eq$restored-or$restored.Value-cne$saved[$name].Value){throw "launcher restore failed: $name"}}else{Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue;if(Test-Path -LiteralPath ("Env:"+$name)){throw "launcher absence failed: $name"}}}catch{$finalErrors.Add($_.Exception)}}
  try{if($ownsRoot){$resolved=[IO.Path]::GetFullPath($root);if(-not[string]::Equals([IO.Path]::GetDirectoryName($resolved),$base,[StringComparison]::OrdinalIgnoreCase)){throw 'unsafe cleanup'};if(Test-Path -LiteralPath $resolved){Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop};if(Test-Path -LiteralPath $resolved){throw 'cleanup failed'}}}catch{$finalErrors.Add($_.Exception)}
  if($null-ne$bodyError){$finalErrors.Insert(0,$bodyError)};if($finalErrors.Count-eq1){[Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($finalErrors[0]).Throw()};if($finalErrors.Count-gt1){throw[AggregateException]::new('audit and cleanup failures',$finalErrors.ToArray())}
}`,
    walkthrough: [
      { lines: "1-11", explanation: "launcher option snapshot과 owned temp/error state를 준비합니다." },
      { lines: "13-41", explanation: "argument-safe child process, concurrent pipe drain, timeout과 exact warning compiler를 정의합니다." },
      { lines: "42-44", explanation: "comments 제거, regex count와 redacted value extraction helpers를 정의합니다." },
      { lines: "45-61", explanation: "package15·closure5·mains14/4·warnings2/0과 source hashes를 검증합니다." },
      { lines: "63-70", explanation: "PreparedStatement/bind/SQL/resource/transaction/DAO shapes를 count합니다." },
      { lines: "71-73", explanation: "credential literal values는 출력하지 않고 count·unique·unsafe URL flags만 확인합니다." },
      { lines: "74-76", explanation: "모든 expected counts를 검증하고 redacted semantic summary만 반환합니다." },
      { lines: "79-89", explanation: "두 modes를 비교하고 DB 미접속을 명시한 뒤 environment restore와 safe cleanup을 수행합니다." },
    ],
    run: { environment: ["PowerShell 7+ on Windows", "OpenJDK 21", "javastudy2/classstudy source root", "javac only: no java/driver/DB", "owned temp class output"], command: "pwsh -NoProfile -File verify-original-jdbc02.ps1 -SourceRoot <classstudy-root>" },
    output: { value: "spacePath=True,modes=2|same=True,package=15,warnings=2,mains=14|closure=5,warnings=0,mains=4;prepared=12,query=8,update=4,bindInt=4,bindString=9,placeholders=13|sql=select8,insert2,update1,delete1|resources=tryWith1,manualClose21,guardedClose12,statementOverwrite4|transactions=autoCommit0,commit0,rollback0,savepoint0,isolation0|dao=methods5,void5,ordinalReads32|secrets=jdbcUrls4,userLiterals4,passwordLiterals4,uniqueCredentialSets1,sslDisabled4,publicKeyRetrieval4,redacted=True|hashes=5/5\nexecution=compile-and-shape-only|db=not-contacted|credentials=not-used", explanation: ["JDBC02 closure 자체는 warning0이고 package warnings2의 소유권을 분리합니다.", "binding 장점과 transaction/resource gaps를 같은 exact source evidence로 보존합니다.", "credential values·host·DB rows는 출력하거나 사용하지 않습니다."] },
    experiments: [
      { change: "audit script에 java Ex15_JDBC 실행을 추가합니다.", prediction: "static initializer가 driver를 load하고 menu action은 실제 credential/DB 접속을 시도할 수 있습니다.", result: "원본 감사는 compile/shape-only policy를 유지합니다." },
      { change: "password literal을 SHA-256으로 출력합니다.", prediction: "짧거나 재사용된 secret은 offline guessing에 노출될 수 있어 redaction 목표가 깨집니다.", result: "값과 hash를 모두 숨기고 count·rotation action만 공개합니다." },
      { change: "Ex13의 두 pstmt assignments 사이 첫 statement close를 추가합니다.", prediction: "statementOverwrite4 shape가 drift해 audit가 실패합니다.", result: "원본은 보존하고 현대 DAO에서 nested try-with-resources로 교정합니다." },
    ],
    sourceRefs: ["java-class16-ex09", "java-class16-ex11", "java-class16-ex13", "java-class16-ex14", "java-class16-ex15", "jdk21-javac", "powershell-environment", "dotnet-process-start-info", "dotnet-process-environment", "dotnet-process", "dotnet-stream-reader-async", "java-prepared-statement", "java-connection", "java-result-set", "owasp-secrets-management"],
  }],
  diagnostics: [
    { symptom: "DB 연결 실패 뒤 finally에서 NullPointerException만 보인다.", likelyCause: "connection/statement/result가 생성되기 전에 실패했는데 Ex09/11/13이 null check 없이 close해 원래 SQLException을 가렸습니다.", checks: ["exception cause/suppressed chain을 봅니다.", "각 resource acquisition 지점을 확인합니다.", "finally close null guards를 셉니다."], fix: "한 try-with-resources header 또는 단계별 nested ownership으로 바꾸고 primary failure를 보존합니다.", prevention: "각 acquisition 단계 fault injection과 suppressed assertion을 둡니다." },
    { symptom: "CRUD 반복 후 statement 수가 계속 늘어난다.", likelyCause: "mutation statement variable을 SELECT statement로 덮어써 첫 PreparedStatement handle을 닫지 않았습니다.", checks: ["pstmt reassignment 전 close를 봅니다.", "driver/pool open statement metrics를 확인합니다.", "statementOverwrite shape를 찾습니다."], fix: "각 statement/result를 별도 nested try-with-resources scope로 관리합니다.", prevention: "resource variable 재사용 금지와 leak integration test를 적용합니다." },
  ],
  expertNotes: ["Compilation proves type correctness without triggering Class.forName or DriverManager connection; it does not prove SQL validity against MySQL schema.", "Publishing even a hash of a weak embedded password can aid offline guessing, so this audit discloses only counts and remediation status."],
};

(session.chapters as DetailedSession["chapters"]).push(originalAuditChapter);

const bindingAndSqlSafetyChapters: DetailedSession["chapters"] = [
  {
    id: "preparedstatement-placeholder-index-type-null-lifecycle",
    title: "PreparedStatement의 placeholder·1-based index·type·NULL·lifecycle을 bind trace로 검증합니다",
    lead: "SQL template을 먼저 고정하고 schema에 맞는 typed setters를1부터 순서대로 적용하며 statement를 실행·닫는 전체 계약을 DB 없는 JDK proxy로 확인합니다.",
    explanations: [
      "PreparedStatement는 connection에 SQL template을 전달해 만들고 각 `?`에 값을 바인딩합니다. parameter index는 ResultSet column과 마찬가지로1부터 시작합니다.",
      "원본 Ex11은 custid를 setInt(1), Ex13은 name/address/phone을 setString(1..3), Ex14 update는 setString1..3와 setInt4로 SQL 순서와 맞춥니다.",
      "setter는 Java value와 target SQL type conversion contract를 driver에 전달합니다. 모든 값을 setString으로 보내면 implicit conversion, index 사용과 validation이 database 설정에 따라 달라질 수 있습니다.",
      "SQL NULL은 Java 문자열 \"null\"이나 빈 문자열이 아닙니다. setNull(index, Types/VARCHAR) 또는 명시 SQLType을 사용하고 domain optionality와 column nullability를 함께 검증합니다.",
      "parameter metadata에 runtime 의존하면 driver/server round trip과 불완전 지원이 생길 수 있습니다. application schema/mapping에서 expected types를 명시하는 편이 안정적입니다.",
      "statement는 executeQuery/executeUpdate 전에 모든 required parameters가 설정돼야 합니다. 재사용할 때 이전 bind가 남을 수 있으므로 모든 parameters를 다시 설정하거나 clearParameters contract를 사용합니다.",
      "PreparedStatement는 AutoCloseable이므로 try-with-resources로 닫습니다. ResultSet이 있으면 statement 안쪽 scope에 두어 result→statement→connection 역순 close를 보장합니다.",
      "예제 proxy는 실제 JDBC interface만 구현하고 setInt/setString/setNull/executeUpdate/close calls를 기록합니다. driver·network·database는 전혀 사용하지 않으면서 exact bind order와 lifecycle을 unit evidence로 만듭니다.",
    ],
    concepts: [
      { term: "placeholder", definition: "SQL text의 value expression 위치를 나타내는 `?` marker로 실행 전에 typed parameter가 바인딩됩니다.", detail: ["index는1-based입니다.", "identifier/keyword를 대신하지 못합니다."] },
      { term: "typed binding", definition: "setInt·setString·setNull 등으로 Java value와 SQL type 의도를 statement parameter에 전달하는 과정입니다.", detail: ["schema와 setter를 맞춥니다.", "conversion failure를 분류합니다."] },
      { term: "SQL NULL", definition: "값이 없거나 unknown임을 나타내는 database marker로 Java null·빈 문자열·문자열 null과 의미가 다릅니다.", detail: ["three-valued logic에 참여합니다.", "명시 type binding이 필요할 수 있습니다."] },
    ],
    codeExamples: [{
      id: "java-prepared-binding-trace",
      title: "JDK proxy PreparedStatement에 int·string·typed NULL을 bind하고 close를 확인합니다",
      language: "java",
      filename: "PreparedBindingTrace.java",
      purpose: "실제 DB 없이 placeholder index/type/order와 try-with-resources lifecycle을 검증합니다.",
      code: String.raw`import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.JDBCType;
import java.sql.PreparedStatement;
import java.sql.Types;
import java.util.LinkedHashMap;
import java.util.Map;

public class PreparedBindingTrace {
    static final class Trace implements InvocationHandler {
        final Map<Integer, String> binds = new LinkedHashMap<>();
        boolean closed;
        public Object invoke(Object proxy, Method method, Object[] args) {
            return switch (method.getName()) {
                case "setInt" -> { binds.put((Integer) args[0], "int:" + args[1]); yield null; }
                case "setString" -> { binds.put((Integer) args[0], "string:" + args[1]); yield null; }
                case "setNull" -> {
                    JDBCType type = JDBCType.valueOf((Integer) args[1]);
                    binds.put((Integer) args[0], "null:" + type.getName());
                    yield null;
                }
                case "executeUpdate" -> 1;
                case "close" -> { closed = true; yield null; }
                case "isClosed" -> closed;
                default -> throw new UnsupportedOperationException(method.getName());
            };
        }
    }
    static PreparedStatement statement(Trace trace) {
        return (PreparedStatement) Proxy.newProxyInstance(
            PreparedStatement.class.getClassLoader(),
            new Class<?>[]{PreparedStatement.class}, trace);
    }
    public static void main(String[] args) throws Exception {
        String sql = "insert into customer(custid,name,note) values(?,?,?)";
        Trace trace = new Trace();
        int rows;
        try (PreparedStatement statement = statement(trace)) {
            statement.setInt(1, 7);
            statement.setString(2, "Ada");
            statement.setNull(3, Types.VARCHAR);
            rows = statement.executeUpdate();
        }
        System.out.println("sql=" + sql);
        System.out.println("binds=" + String.join("|", trace.binds.values()));
        System.out.println("rows=" + rows);
        System.out.println("closed=" + trace.closed);
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "JDK reflection proxy, JDBC types/statement와 insertion-order trace collections를 import합니다." },
        { lines: "11-28", explanation: "setters·executeUpdate·close만 허용하고 parameter index 순서대로 redacted type/value trace를 기록합니다." },
        { lines: "30-34", explanation: "실제 PreparedStatement interface를 구현하는 JDK dynamic proxy를 만듭니다." },
        { lines: "35-45", explanation: "고정 SQL의1..3 parameters를 int/string/typed null로 bind하고 execute합니다." },
        { lines: "46-49", explanation: "template, bind order, affected rows와 automatic close를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK dynamic proxy only", "no JDBC driver/database/network", "-Xlint:all warning0"], command: isolatedJavaRun("PreparedBindingTrace.java", "PreparedBindingTrace") },
      output: { value: "sql=insert into customer(custid,name,note) values(?,?,?)\nbinds=int:7|string:Ada|null:VARCHAR\nrows=1\nclosed=true", explanation: ["세 placeholders가1부터 typed order로 채워집니다.", "SQL NULL은 VARCHAR type과 함께 기록됩니다.", "try-with-resources가 statement를 닫습니다."] },
      experiments: [
        { change: "setString(2)를 setString(3)으로 바꿉니다.", prediction: "index2가 unset이고 index3이 다음 setNull로 덮여 real driver 실행이 parameter error로 실패할 수 있습니다.", result: "SQL marker와 binder를 같은 mapping test에서 검증합니다." },
        { change: "setNull 대신 setString(index, \"null\")을 씁니다.", prediction: "database에는 NULL이 아니라 네 글자 text가 저장됩니다.", result: "domain absence를 typed SQL NULL로 표현합니다." },
        { change: "statement close를 제거합니다.", prediction: "unit output closed=false이고 real pool에서는 server/client statement resource가 누적될 수 있습니다.", result: "statement/result를 lexical ownership으로 닫습니다." },
      ],
      sourceRefs: ["java-prepared-statement", "java-jdbc-type", "java-types", "java-auto-closeable", "java-proxy", "java-invocation-handler", "jdbc-spec-43"],
    }],
    diagnostics: [
      { symptom: "Parameter index out of range 또는 No value specified 오류가 난다.", likelyCause: "placeholder count/order와1-based setter indices가 맞지 않거나 한 parameter를 빠뜨렸습니다.", checks: ["SQL의 markers를 셉니다.", "binder index/type 표를 비교합니다.", "dynamic SQL branch별 bind count를 봅니다."], fix: "SQL template과 binder를 한 method/mapper contract로 묶고 모든 branches를 trace test합니다.", prevention: "SQL별 marker-index-type snapshot test를 둡니다." },
      { symptom: "NULL을 넣었는데 문자열 null이 조회된다.", likelyCause: "setString으로 literal text를 보냈거나 빈 문자열을 absence로 혼용했습니다.", checks: ["setter와 bound value type을 봅니다.", "column nullability를 확인합니다.", "ResultSet.wasNull을 검사합니다."], fix: "domain optionality를 정하고 setNull/typed setObject와 getObject/wasNull mapping을 사용합니다.", prevention: "null·empty·literal-null fixtures를 분리합니다." },
    ],
    expertNotes: ["A proxy verifies application call shape, not driver conversion or server-side prepare behavior; retain a real-driver integration test.", "JDBC parameter metadata support and cost vary by driver, so generated binders should rely on the application's schema contract rather than speculative runtime introspection."],
  },
  {
    id: "sql-injection-code-data-separation-and-limits",
    title: "문자열 결합 injection과 bind parameter의 code/data 분리를 비교합니다",
    lead: "공격 문자열이 SQL text에 들어갈 때 구조 token이 되지만 parameter value로 분리되면 template이 불변이라는 차이를 DB 없이 정확히 관찰합니다.",
    explanations: [
      "SQL injection은 untrusted input이 SQL code structure에 합쳐져 원래 의도하지 않은 predicate·statement·comment로 해석될 때 발생합니다.",
      "문자열 escaping을 직접 조립하면 quote mode, encoding, backslash behavior와 driver/server 설정을 모두 재현해야 해 취약합니다. parameterized query를 기본으로 사용합니다.",
      "PreparedStatement는 SQL template과 parameter values를 분리합니다. 공격 text 안의 quote·OR·comment가 query structure가 아니라 한 value로 전달됩니다.",
      "parameter binding은 input validation을 대체하지 않습니다. 길이, Unicode normalization, 허용 업무 값과 authorization은 별도로 검증해야 합니다.",
      "prepared API를 사용해도 SQL text 자체를 사용자 입력으로 조립하거나 stored procedure 내부가 dynamic SQL을 결합하면 injection은 남습니다.",
      "LIKE parameter의 `%`와 `_`는 SQL injection이 아니라 pattern semantics입니다. literal search가 목적이면 escape character와 DB별 pattern contract를 명시합니다.",
      "로그에는 SQL template과 parameter type/count, correlation id만 남기고 passwords·tokens·PII values는 redact합니다. 디버깅 편의를 위해 완성 SQL을 재조립하지 않습니다.",
      "예제는 동일 attack text를 vulnerable concatenation과 immutable Query(template, parameters)로 표현합니다. safe template에는 OR token이 없고 parameter identity만 유지됩니다.",
    ],
    concepts: [
      { term: "SQL injection", definition: "외부 입력이 SQL grammar의 data가 아니라 code로 해석되어 query 의미를 바꾸는 취약점입니다.", detail: ["confidentiality/integrity를 위협합니다.", "parameterization이 핵심 통제입니다."] },
      { term: "code/data separation", definition: "실행 구조인 SQL template과 외부 values를 서로 다른 protocol fields로 전달하는 원칙입니다.", detail: ["완성 SQL 문자열을 만들지 않습니다.", "logging에서도 분리를 유지합니다."] },
      { term: "defense in depth", definition: "parameter binding에 최소 권한·validation·authorization·safe errors·monitoring을 더해 단일 실패가 침해로 이어지지 않게 하는 설계입니다.", detail: ["DB 계정 권한을 줄입니다.", "여러 trust boundaries를 검증합니다."] },
    ],
    codeExamples: [{
      id: "java-sql-code-data-separation",
      title: "attack text가 vulnerable SQL에는 code로, safe query에는 한 parameter로 남는지 비교합니다",
      language: "java",
      filename: "SqlCodeDataSeparation.java",
      purpose: "PreparedStatement가 제공하는 SQL structure 불변성을 단순하고 exact한 model로 설명합니다.",
      code: String.raw`import java.util.List;
import java.util.Locale;

public class SqlCodeDataSeparation {
    record Query(String template, List<String> parameters) {
        Query {
            parameters = List.copyOf(parameters);
        }
    }
    public static void main(String[] args) {
        String attack = "x' OR '1'='1' --";
        String vulnerable = "select * from customer where name='" + attack + "'";
        Query safe = new Query(
            "select * from customer where name=?", List.of(attack));

        boolean vulnerableStructureChanged =
            vulnerable.toUpperCase(Locale.ROOT).contains(" OR ");
        boolean safeTemplateHasOperator =
            safe.template().toUpperCase(Locale.ROOT).contains(" OR ");
        System.out.println("vulnerableStructureChanged=" + vulnerableStructureChanged);
        System.out.println("safeTemplate=" + safe.template());
        System.out.println("safeTemplateHasOperator=" + safeTemplateHasOperator);
        System.out.println("safeBindCount=" + safe.parameters().size());
        System.out.println("bindRetained=" + safe.parameters().getFirst().equals(attack));
    }
}`,
      walkthrough: [
        { lines: "1-2", explanation: "immutable parameter list와 locale-stable token inspection을 import합니다." },
        { lines: "5-9", explanation: "SQL template과 values를 별도 fields로 가진 immutable Query model을 정의합니다." },
        { lines: "11-15", explanation: "같은 attack text를 concatenated SQL과 parameterized representation에 넣습니다." },
        { lines: "17-21", explanation: "SQL text 부분에 OR operator가 생겼는지 template만 비교합니다." },
        { lines: "22-26", explanation: "vulnerable/safe structure, bind count와 value 보존을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "pure in-memory SQL representation", "no parser/driver/database", "-Xlint:all warning0"], command: isolatedJavaRun("SqlCodeDataSeparation.java", "SqlCodeDataSeparation") },
      output: { value: "vulnerableStructureChanged=true\nsafeTemplate=select * from customer where name=?\nsafeTemplateHasOperator=false\nsafeBindCount=1\nbindRetained=true", explanation: ["concatenation은 attack의 OR를 SQL text에 포함합니다.", "safe template 구조는 고정되고 value는 parameter 하나로 유지됩니다.", "예제는 parser가 아니라 code/data 경계 model입니다."] },
      experiments: [
        { change: "safe template 끝에 사용자 입력을 다시 `+`로 붙입니다.", prediction: "PreparedStatement API를 사용해도 dynamic fragment가 code로 들어가 structure가 변합니다.", result: "모든 untrusted values를 bind하고 fragments는 allowlist합니다." },
        { change: "attack을 `%`로 바꾸고 LIKE를 사용합니다.", prediction: "injection은 아니지만 wildcard로 검색 범위가 넓어집니다.", result: "literal/pattern search contract와 escape를 분리합니다." },
        { change: "safe parameters를 SQL log에 평문 출력합니다.", prediction: "injection은 막아도 PII/secret leakage가 생깁니다.", result: "type/count와 approved redacted identifiers만 기록합니다." },
      ],
      sourceRefs: ["java-prepared-statement", "owasp-sql-injection-prevention", "cwe-89", "jdbc-spec-43", "owasp-logging-cheat-sheet"],
    }],
    diagnostics: [
      { symptom: "PreparedStatement를 쓰는데 보안 점검이 injection을 찾는다.", likelyCause: "table/order/filter fragment를 문자열 결합하거나 prepared SQL 자체에 raw input을 넣었습니다.", checks: ["prepareStatement 인자의 data flow를 추적합니다.", "모든 `+`/format/text block fragments를 찾습니다.", "stored procedure 내부 dynamic SQL도 봅니다."], fix: "values는 bind하고 identifiers/keywords는 finite allowlist mapping으로 생성합니다.", prevention: "SAST와 attack corpus를 SQL builder contract test에 연결합니다." },
      { symptom: "quote escaping을 했는데 특정 DB mode에서 우회된다.", likelyCause: "application escaping이 server charset/escape mode/parser semantics와 달랐습니다.", checks: ["driver/server modes를 확인합니다.", "완성 SQL 생성 코드를 찾습니다.", "multi-byte/quote/backslash corpus를 실행합니다."], fix: "manual escaping을 제거하고 driver parameter binding을 사용합니다.", prevention: "문자열 SQL 결합을 lint/review에서 금지합니다." },
    ],
    expertNotes: ["This example models structural separation; only an integration test with the actual driver/server can validate wire protocol and SQL dialect behavior.", "Parameterization protects value positions. Authorization, least privilege and result-size controls remain independent security requirements."],
  },
  {
    id: "dynamic-identifier-order-by-allowlist",
    title: "bind할 수 없는 column·direction은 enum allowlist로 application-owned SQL fragment에 매핑합니다",
    lead: "사용자 문자열을 identifier로 quote하거나 붙이지 않고 외부 token을 제한된 enum으로 해석해 알려진 SQL literal만 선택합니다.",
    explanations: [
      "JDBC `?`는 일반적으로 value expression용이며 table name, column name, ASC/DESC keyword를 parameter로 바인딩할 수 없습니다.",
      "동적 정렬·테이블 선택이 필요하면 외부 token과 실제 SQL identifier를 분리합니다. 예제의 recent/name tokens만 created_at/customer_name으로 매핑됩니다.",
      "allowlist는 regex로 위험 문자만 제거하는 denylist보다 강합니다. 새 허용 값은 code review와 schema/index evidence를 거쳐 명시적으로 추가됩니다.",
      "direction도 boolean/string concatenation 대신 ASC/DESC 두 enum으로 제한합니다. locale-sensitive lowercase를 피하려면 Locale.ROOT를 사용합니다.",
      "identifier quoting은 reserved word/case 처리를 위한 dialect 기능이지 arbitrary input을 안전하게 만드는 authorization control이 아닙니다.",
      "tenant별 table name을 직접 만들면 isolation·migration·plan cache·privilege가 복잡해집니다. tenant_id bind 또는 schema routing layer를 우선 검토합니다.",
      "allowlist mapping 뒤에도 limit/offset의 range, sort stability와 secondary key를 정의해야 pagination 중 중복·누락을 줄일 수 있습니다.",
      "예제는 malicious sort token을 DB 호출 전에 IllegalArgumentException으로 거부하고 accepted SQL은 application literals만으로 구성합니다.",
    ],
    concepts: [
      { term: "dynamic identifier", definition: "runtime 선택이 필요한 table·column·schema 이름처럼 value placeholder로 대체할 수 없는 SQL grammar 요소입니다.", detail: ["allowlist mapping이 필요합니다.", "dialect와 privilege를 고려합니다."] },
      { term: "allowlist mapping", definition: "외부 입력을 그대로 쓰지 않고 미리 정의된 token→trusted literal 집합 중 하나로 변환하는 통제입니다.", detail: ["unknown은 fail closed합니다.", "SQL literal은 code 소유입니다."] },
      { term: "stable ordering", definition: "pagination/repeat query에서 동률까지 결정하도록 unique secondary key를 포함한 완전한 정렬 계약입니다.", detail: ["중복·누락을 줄입니다.", "index design과 연결됩니다."] },
    ],
    codeExamples: [{
      id: "java-dynamic-order-allowlist",
      title: "recent/descending만 trusted created_at DESC로 바꾸고 공격 token은 거부합니다",
      language: "java",
      filename: "DynamicOrderAllowlist.java",
      purpose: "identifier·keyword injection을 parameter binding과 별도의 finite mapping으로 차단합니다.",
      code: String.raw`import java.util.Locale;
import java.util.Map;

public class DynamicOrderAllowlist {
    private static final Map<String, String> COLUMNS = Map.of(
        "recent", "created_at",
        "name", "customer_name");
    private static final Map<String, String> DIRECTIONS = Map.of(
        "ascending", "ASC",
        "descending", "DESC");

    static String query(String columnToken, String directionToken) {
        String column = COLUMNS.get(columnToken.toLowerCase(Locale.ROOT));
        String direction = DIRECTIONS.get(directionToken.toLowerCase(Locale.ROOT));
        if (column == null || direction == null) {
            throw new IllegalArgumentException("unsupported sort");
        }
        return "select custid,name from customer order by "
            + column + " " + direction + ", custid ASC";
    }
    public static void main(String[] args) {
        String accepted = query("recent", "descending");
        boolean rejected = false;
        try {
            query("created_at DESC; drop table customer", "ascending");
        } catch (IllegalArgumentException expected) {
            rejected = true;
        }
        System.out.println("accepted=" + accepted);
        System.out.println("attackRejected=" + rejected);
        System.out.println("allowedColumns=" + COLUMNS.size());
        System.out.println("allowedDirections=" + DIRECTIONS.size());
    }
}`,
      walkthrough: [
        { lines: "1-2", explanation: "locale-stable normalization과 immutable allowlist maps를 import합니다." },
        { lines: "5-10", explanation: "외부 tokens와 application-owned column/direction SQL literals를 분리합니다." },
        { lines: "12-20", explanation: "unknown token은 fail closed하고 stable secondary custid order를 추가합니다." },
        { lines: "22-29", explanation: "정상 token과 SQL fragment를 포함한 공격 token을 각각 평가합니다." },
        { lines: "30-33", explanation: "accepted trusted SQL, rejection과 finite set sizes를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "in-memory allowlist only", "no driver/database", "-Xlint:all warning0"], command: isolatedJavaRun("DynamicOrderAllowlist.java", "DynamicOrderAllowlist") },
      output: { value: "accepted=select custid,name from customer order by created_at DESC, custid ASC\nattackRejected=true\nallowedColumns=2\nallowedDirections=2", explanation: ["accepted SQL fragments는 모두 code-owned literals입니다.", "공격 text는 column token과 일치하지 않아 DB 전에 거부됩니다.", "허용 표면은 columns2·directions2로 유한합니다."] },
      experiments: [
        { change: "unknown token을 그대로 column으로 반환합니다.", prediction: "공격 text가 ORDER BY grammar로 들어가 injection이 재발합니다.", result: "unknown은 항상 reject합니다." },
        { change: "column을 backtick/double quote로 감쌉니다.", prediction: "dialect/escaping 설정에 의존하고 authorization 없는 arbitrary identifier 선택 문제는 남습니다.", result: "quoting과 allowlist를 다른 책임으로 봅니다." },
        { change: "secondary custid order를 제거합니다.", prediction: "created_at/name 동률 rows가 page 사이에서 이동해 중복·누락될 수 있습니다.", result: "unique stable tie-breaker를 포함합니다." },
      ],
      sourceRefs: ["owasp-sql-injection-prevention", "cwe-89", "java-locale", "java-map-api", "java-prepared-statement"],
    }],
    diagnostics: [
      { symptom: "ORDER BY ?가 column 정렬 대신 오류 또는 상수 정렬이 된다.", likelyCause: "value placeholder로 identifier/keyword를 바인딩하려 했습니다.", checks: ["SQL grammar에서 marker 위치를 봅니다.", "driver/server error를 확인합니다.", "동적 fragment 요구를 inventory합니다."], fix: "외부 token을 finite trusted column/direction literal로 매핑합니다.", prevention: "identifier allowlist unit tests에 unknown/attack/case corpus를 둡니다." },
      { symptom: "정렬 기능에 prepared parameters를 썼는데 injection이 보고된다.", likelyCause: "WHERE values만 bind하고 column/direction은 raw query parameter를 concatenation했습니다.", checks: ["ORDER BY/GROUP BY/table/schema fragments를 추적합니다.", "allowlist mapping 결과만 SQL에 들어가는지 봅니다.", "fallback branch를 검사합니다."], fix: "모든 structural choices를 enum/map allowlist로 제한하고 unknown을 거부합니다.", prevention: "SQL builder가 raw String 대신 typed SortSpec을 받게 합니다." },
    ],
    expertNotes: ["Identifier allowlists are also an authorization surface: a syntactically safe column may still expose data the caller must not sort or infer.", "Stable pagination requires an ordering that is total over the visible row set, usually by adding a unique tie-breaker."],
  },
  {
    id: "executeupdate-affected-row-cardinality-contract",
    title: "executeUpdate 반환값을 성공 boolean이 아니라 cardinality contract로 해석합니다",
    lead: "0·1·2 affected rows를 not-found·success·invariant violation으로 분리해 조용한 no-op과 과다 변경을 숨기지 않습니다.",
    explanations: [
      "executeUpdate는 INSERT/UPDATE/DELETE가 영향을 준 rows 수를 반환합니다. `>0`만 검사하면 정확히 한 customer를 바꿔야 하는 operation이 두 rows를 바꿔도 성공으로 처리됩니다.",
      "id 기반 UPDATE/DELETE는 보통 rows1을 성공, rows0을 not-found 또는 optimistic conflict로 구분하고 rows>1을 schema/query invariant violation으로 거부합니다.",
      "database와 driver 설정에 따라 UPDATE가 matched rows와 actually changed rows 중 무엇을 보고하는지 차이가 있을 수 있습니다. 사용하는 driver 옵션과 SQL contract를 integration test로 고정합니다.",
      "INSERT에서 generated key가 필요하면 RETURN_GENERATED_KEYS와 getGeneratedKeys lifecycle을 사용하되 exactly one key, type/range와 missing/multiple key를 검증합니다.",
      "batch update는 SUCCESS_NO_INFO와 EXECUTE_FAILED sentinel을 포함할 수 있어 단순 합계만으로 개별 item 성공을 확정하면 안 됩니다.",
      "optimistic locking은 `where id=? and version=?` affected rows0을 concurrent modification으로 해석하고 bounded retry 또는 caller conflict로 반환합니다.",
      "예제는 JDK proxy가1,0,2를 순서대로 반환합니다. application mapping은1=updated,0=not-found,2=SQLState class21 cardinality failure로 만듭니다.",
      "public error에는 SQL text와 values를 넣지 않고 entity type, redacted id/correlation, outcome category를 남깁니다. raw SQLException은 cause chain에서 보존합니다.",
    ],
    concepts: [
      { term: "affected rows", definition: "DML 실행이 삽입·변경·삭제한 것으로 driver가 보고한 row count입니다.", detail: ["업무 cardinality와 비교합니다.", "driver semantics를 검증합니다."] },
      { term: "cardinality contract", definition: "한 operation이 허용하는 결과 row 수 집합과 각 count의 업무 의미를 명시한 계약입니다.", detail: ["exactly one을 표현합니다.", "0과 many를 분리합니다."] },
      { term: "optimistic conflict", definition: "expected version/value 조건이 더 이상 맞지 않아 affected rows0으로 드러나는 concurrent update 충돌입니다.", detail: ["not-found와 구분할 수 있습니다.", "retry/idempotency 정책이 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-affected-row-contract",
      title: "proxy executeUpdate의1·0·2를 updated·not-found·cardinality failure로 매핑합니다",
      language: "java",
      filename: "AffectedRowContract.java",
      purpose: "DML result count를 exact 업무 outcome으로 변환하고 many-row corruption을 거부합니다.",
      code: String.raw`import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayDeque;
import java.util.List;

public class AffectedRowContract {
    static final class Rows implements InvocationHandler {
        final ArrayDeque<Integer> values = new ArrayDeque<>(List.of(1, 0, 2));
        int calls;
        public Object invoke(Object proxy, Method method, Object[] args) {
            return switch (method.getName()) {
                case "executeUpdate" -> { calls++; yield values.removeFirst(); }
                case "close" -> null;
                default -> throw new UnsupportedOperationException(method.getName());
            };
        }
    }
    static PreparedStatement statement(Rows rows) {
        return (PreparedStatement) Proxy.newProxyInstance(
            PreparedStatement.class.getClassLoader(),
            new Class<?>[]{PreparedStatement.class}, rows);
    }
    static String updateOne(PreparedStatement statement) throws SQLException {
        int affected = statement.executeUpdate();
        if (affected == 0) return "not-found";
        if (affected == 1) return "updated";
        throw new SQLException("expected one affected row", "21000");
    }
    public static void main(String[] args) throws Exception {
        Rows rows = new Rows();
        boolean manyRejected = false;
        String one;
        String zero;
        try (PreparedStatement statement = statement(rows)) {
            one = updateOne(statement);
            zero = updateOne(statement);
            try {
                updateOne(statement);
            } catch (SQLException expected) {
                manyRejected = "21".equals(expected.getSQLState().substring(0, 2));
            }
        }
        System.out.println("one=" + one);
        System.out.println("zero=" + zero);
        System.out.println("manyRejected=" + manyRejected);
        System.out.println("calls=" + rows.calls);
    }
}`,
      walkthrough: [
        { lines: "1-7", explanation: "JDK proxy, PreparedStatement/SQLException과 deterministic row queue를 import합니다." },
        { lines: "10-20", explanation: "executeUpdate calls에1·0·2를 순서대로 반환하는 statement handler를 정의합니다." },
        { lines: "21-25", explanation: "실제 PreparedStatement interface의 JDK proxy를 만듭니다." },
        { lines: "26-31", explanation: "0/1을 업무 outcome으로, 그 외 count를 SQLState21 cardinality failure로 매핑합니다." },
        { lines: "32-45", explanation: "세 counts를 실행하고 many-row typed rejection을 확인합니다." },
        { lines: "46-49", explanation: "outcomes와 exact execute calls3을 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK proxy PreparedStatement", "row counts1/0/2", "no database", "-Xlint:all warning0"], command: isolatedJavaRun("AffectedRowContract.java", "AffectedRowContract") },
      output: { value: "one=updated\nzero=not-found\nmanyRejected=true\ncalls=3", explanation: ["affected1만 normal success입니다.", "affected0은 명시적 not-found입니다.", "affected2는 SQLState class21 failure로 거부됩니다."] },
      experiments: [
        { change: "affected>0이면 모두 updated로 반환합니다.", prediction: "query/schema bug로 여러 rows가 바뀌어도 성공으로 숨겨집니다.", result: "operation별 allowed cardinality를 exact 검사합니다." },
        { change: "version predicate를 추가하고0을 not-found로만 처리합니다.", prediction: "실제 row 존재와 concurrent version conflict를 구분하지 못합니다.", result: "필요하면 별도 existence/version evidence 또는 conflict result를 설계합니다." },
        { change: "batch 결과를 단순 합계로만 검사합니다.", prediction: "EXECUTE_FAILED/SUCCESS_NO_INFO와 부분 성공 위치를 잃습니다.", result: "item별 result와 transaction rollback policy를 검증합니다." },
      ],
      sourceRefs: ["java-statement", "java-prepared-statement", "java-sql-exception", "java-batch-update-exception", "jdbc-spec-43", "oracle-jdbc-updates"],
    }],
    diagnostics: [
      { symptom: "삭제 성공 메시지가 나왔는데 실제로는 대상 row가 없었다.", likelyCause: "executeUpdate 반환0을 확인하지 않고 exception 없음만 성공으로 봤습니다.", checks: ["affected count를 capture합니다.", "0의 domain meaning을 확인합니다.", "transaction commit 여부를 봅니다."], fix: "0을 not-found/conflict outcome으로 명시해 caller가 처리하게 합니다.", prevention: "0/1/many contract fixtures를 모든 DML DAO에 둡니다." },
      { symptom: "id update인데 rows2가 변경됐다.", likelyCause: "unique constraint가 없거나 WHERE predicate가 잘못됐는데 `>0` 검사가 과다 변경을 숨겼습니다.", checks: ["SQL predicate와 schema uniqueness를 봅니다.", "affected rows를 확인합니다.", "변경 audit 범위를 조사합니다."], fix: "transaction을 rollback하고 exactly-one violation으로 격리한 뒤 schema/query를 교정합니다.", prevention: "DB unique constraint와 many-row negative integration test를 둡니다." },
    ],
    expertNotes: ["Affected-row semantics can vary for no-op updates by database and driver configuration; pin the production behavior with an integration contract test.", "An exact row count is a guardrail, not a substitute for database constraints that enforce uniqueness under concurrency."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...bindingAndSqlSafetyChapters);

const transactionChapters: DetailedSession["chapters"] = [
  {
    id: "transaction-owner-autocommit-commit-rollback-restore",
    title: "한 service가 Connection transaction을 소유하고 autoCommit·commit·rollback·restore를 관리합니다",
    lead: "DAO마다 connection을 열지 않고 업무 use case가 하나의 Connection을 빌려 두 changes의 성공·실패와 pool 반환 전 state 복구를 책임집니다.",
    explanations: [
      "새 JDBC Connection은 보통 auto-commit true이며 각 statement 완료가 개별 transaction commit으로 이어집니다. 여러 statements를 하나의 업무 원자성으로 묶으려면 setAutoCommit(false)가 필요합니다.",
      "transaction boundary는 table/DAO method 수가 아니라 업무 불변식으로 정합니다. debit과 credit, order와 stock처럼 함께 성공하거나 실패해야 하는 changes가 한 boundary입니다.",
      "service layer가 DataSource에서 connection 하나를 빌리고 DAO methods에 전달하면 동일 physical transaction을 공유합니다. DAO가 내부에서 새 connection을 열면 outer rollback이 다른 connection의 commit을 되돌릴 수 없습니다.",
      "성공 경로는 모든 affected-row/domain checks 뒤 commit합니다. 실패 경로는 원래 exception을 보존한 채 rollback하고 rollback 자체 failure는 suppressed로 추가합니다.",
      "pooled connection은 autoCommit/readOnly/isolation state가 다음 borrower에 새지 않도록 원래 값을 restore해야 합니다. pool도 reset하지만 application은 명확한 ownership을 유지합니다.",
      "setAutoCommit(true)는 현재 transaction을 commit할 수 있으므로 cleanup 편의로 무조건 호출하기 전에 driver/spec contract와 transaction outcome을 이해해야 합니다.",
      "commit이 exception을 던지면 server가 commit했는지 모르는 unknown outcome일 수 있습니다. 무조건 retry하면 중복 side effect가 생기므로 idempotency key와 reconciliation이 필요합니다.",
      "예제는 Connection proxy의 event trace로 success는 commit, SQLState40001 failure는 rollback, 두 paths 모두 auto:true restore를 exact 검증합니다.",
    ],
    concepts: [
      { term: "auto-commit", definition: "각 SQL statement를 개별 transaction으로 자동 commit하는 Connection mode입니다.", detail: ["기본값을 확인합니다.", "multi-step 업무에는 끕니다."] },
      { term: "transaction owner", definition: "connection acquisition, boundary, commit/rollback, state restore와 close를 한 곳에서 책임지는 component입니다.", detail: ["보통 service/use-case layer입니다.", "DAO에 connection을 전달합니다."] },
      { term: "unknown commit outcome", definition: "commit 요청 중 network/driver failure로 client가 server의 최종 commit 여부를 확정할 수 없는 상태입니다.", detail: ["blind retry가 위험합니다.", "idempotency/reconciliation이 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-transaction-owner-trace",
      title: "Connection proxy에서 성공 commit과 failure rollback·autoCommit restore 순서를 비교합니다",
      language: "java",
      filename: "TransactionOwnerTrace.java",
      purpose: "DB 없이 transaction template의 성공/실패 call sequence와 exception preservation을 검증합니다.",
      code: String.raw`import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class TransactionOwnerTrace {
    @FunctionalInterface
    interface SqlWork { void run() throws SQLException; }
    static final class Trace implements InvocationHandler {
        final List<String> events = new ArrayList<>();
        boolean autoCommit = true;
        void work(String name) { events.add("work:" + name); }
        public Object invoke(Object proxy, Method method, Object[] args) {
            return switch (method.getName()) {
                case "getAutoCommit" -> autoCommit;
                case "setAutoCommit" -> {
                    autoCommit = (Boolean) args[0];
                    events.add("auto:" + autoCommit);
                    yield null;
                }
                case "commit" -> { events.add("commit"); yield null; }
                case "rollback" -> { events.add("rollback"); yield null; }
                default -> throw new UnsupportedOperationException(method.getName());
            };
        }
    }
    static Connection connection(Trace trace) {
        return (Connection) Proxy.newProxyInstance(
            Connection.class.getClassLoader(), new Class<?>[]{Connection.class}, trace);
    }
    static void transaction(Connection connection, SqlWork work) throws SQLException {
        boolean originalAutoCommit = connection.getAutoCommit();
        Throwable primary = null;
        connection.setAutoCommit(false);
        try {
            work.run();
            connection.commit();
        } catch (SQLException | RuntimeException failure) {
            primary = failure;
            try {
                connection.rollback();
            } catch (SQLException rollbackFailure) {
                failure.addSuppressed(rollbackFailure);
            }
            throw failure;
        } finally {
            try {
                connection.setAutoCommit(originalAutoCommit);
            } catch (SQLException restoreFailure) {
                if (primary != null) primary.addSuppressed(restoreFailure);
                else throw restoreFailure;
            }
        }
    }
    public static void main(String[] args) throws Exception {
        Trace success = new Trace();
        transaction(connection(success), () -> {
            success.work("debit"); success.work("credit");
        });

        Trace failure = new Trace();
        boolean failed = false;
        try {
            transaction(connection(failure), () -> {
                failure.work("debit");
                throw new SQLException("credit conflict", "40001");
            });
        } catch (SQLException expected) {
            failed = "40001".equals(expected.getSQLState());
        }
        System.out.println("success=" + String.join("|", success.events));
        System.out.println("failure=" + String.join("|", failure.events));
        System.out.println("failed=" + failed);
    }
}`,
      walkthrough: [
        { lines: "1-11", explanation: "Connection proxy, SQLException, event list와 checked SqlWork contract를 준비합니다." },
        { lines: "12-29", explanation: "autoCommit/commit/rollback calls만 허용하는 deterministic Connection state trace를 정의합니다." },
        { lines: "30-33", explanation: "실제 Connection interface의 JDK proxy를 생성합니다." },
        { lines: "34-57", explanation: "original state 저장, false 전환, commit/rollback, suppressed와 restore를 한 owner가 관리합니다." },
        { lines: "58-76", explanation: "success debit+credit과 SQLState40001 failure를 각각 실행합니다." },
        { lines: "77-78", explanation: "두 call sequences와 typed failure 보존을 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK proxy Connection", "no JDBC driver/database", "success+failure paths", "-Xlint:all warning0"], command: isolatedJavaRun("TransactionOwnerTrace.java", "TransactionOwnerTrace") },
      output: { value: "success=auto:false|work:debit|work:credit|commit|auto:true\nfailure=auto:false|work:debit|rollback|auto:true\nfailed=true", explanation: ["성공 changes 둘 뒤 commit하고 original autoCommit을 복구합니다.", "credit failure는 partial debit 뒤 rollback합니다.", "original SQLState40001이 caller까지 유지됩니다."] },
      experiments: [
        { change: "각 work가 별도 connection을 열게 합니다.", prediction: "첫 auto-committed debit은 두 번째 connection rollback으로 되돌릴 수 없습니다.", result: "service owner가 한 connection을 전달합니다." },
        { change: "catch에서 새 RuntimeException(message)만 던집니다.", prediction: "SQLState/vendor code/cause와 retry classification을 잃습니다.", result: "원인 SQLException을 cause로 보존하거나 typed translation합니다." },
        { change: "commit exception을 즉시 전체 use case retry합니다.", prediction: "server가 이미 commit했다면 debit/credit이 중복될 수 있습니다.", result: "idempotency key와 outcome reconciliation을 설계합니다." },
      ],
      sourceRefs: ["java-connection", "java-sql-exception", "java-proxy", "java-invocation-handler", "jdbc-spec-43", "oracle-jdbc-transactions", "mysql-autocommit"],
    }],
    diagnostics: [
      { symptom: "rollback했는데 첫 DAO 변경은 남아 있다.", likelyCause: "첫 DAO가 다른 auto-commit connection을 열어 outer transaction에 참여하지 않았습니다.", checks: ["connection identity와 acquisition count를 추적합니다.", "DAO getConnection calls를 찾습니다.", "autoCommit 상태를 기록합니다."], fix: "service가 connection 하나를 소유하고 participating DAOs에 명시 전달합니다.", prevention: "unit trace에서 prepare calls가 동일 connection인지 검증합니다." },
      { symptom: "commit timeout 뒤 retry에서 중복 주문이 생긴다.", likelyCause: "commit failure를 definite rollback로 가정하고 idempotency 없이 재실행했습니다.", checks: ["SQLState/network timeline을 봅니다.", "server transaction/audit를 조회합니다.", "request id unique constraint를 확인합니다."], fix: "idempotency key로 결과를 조회·재조정하고 unknown outcome을 별도 상태로 처리합니다.", prevention: "commit response-loss fault test와 reconciliation runbook을 둡니다." },
    ],
    expertNotes: ["A transaction template must preserve the primary failure while attaching rollback and restore failures; otherwise diagnostics become misleading.", "Connection state restoration matters even when a pool promises reset, because the application's ownership contract should be testable independently."],
  },
  {
    id: "savepoint-partial-rollback-and-outer-transaction",
    title: "Savepoint로 선택 단계만 되돌리고 outer transaction의 commit 정책을 명시합니다",
    lead: "savepoint 이전 required work는 유지하고 optional step failure 이후 rollback(savepoint)·fallback·release·outer commit 순서를 exact trace로 검증합니다.",
    explanations: [
      "Savepoint는 현재 transaction 안의 특정 지점을 표시하고 rollback(savepoint)로 이후 changes 일부를 되돌리는 기능입니다. 별도 nested transaction이나 독립 commit이 아닙니다.",
      "outer connection이 rollback하면 savepoint 이전 required work도 모두 사라집니다. 반대로 outer commit 전에는 savepoint 이전 changes도 durable하지 않습니다.",
      "savepoint 이름은 diagnostic에 유용하지만 지원, 이름 제한과 release semantics는 database/driver마다 확인해야 합니다. DatabaseMetaData.supportsSavepoints를 integration에서 검증합니다.",
      "partial rollback이 업무적으로 허용되는지 먼저 결정합니다. 결제 실패인데 주문만 commit하는 것이 허용되지 않으면 savepoint로 억지 복구하지 말고 전체 rollback해야 합니다.",
      "rollback to savepoint 뒤 locks, sequences, identity values와 external side effects가 모두 원상복구된다고 가정하면 안 됩니다. database와 외부 system contracts를 따로 봅니다.",
      "savepoint reference는 rollback/release 후 재사용하지 않고 outer transaction 종료 시 무효입니다. lexical scope와 명확한 이름을 사용합니다.",
      "예제는 required work 뒤 optional savepoint를 만들고 계획된 optional failure를 해당 지점까지 되돌린 뒤 fallback을 수행해 outer commit합니다.",
      "full rollback0과 commit1은 부분 실패를 성공으로 전환한 policy를 드러냅니다. public result에도 partial/fallback outcome을 숨기지 않습니다.",
    ],
    concepts: [
      { term: "savepoint", definition: "한 transaction 내부에서 이후 changes를 부분 rollback할 수 있도록 설정한 복귀 지점입니다.", detail: ["nested commit이 아닙니다.", "driver support를 확인합니다."] },
      { term: "partial rollback", definition: "transaction 전체가 아니라 savepoint 뒤의 database changes만 되돌리는 operation입니다.", detail: ["업무 허용 여부가 우선입니다.", "locks/side effects는 별도 검토합니다."] },
      { term: "fallback commit policy", definition: "optional 단계 실패를 부분 rollback한 뒤 대체 결과로 outer transaction을 commit할지 결정하는 업무 규칙입니다.", detail: ["caller-visible outcome이 필요합니다.", "필수/선택 단계를 구분합니다."] },
    ],
    codeExamples: [{
      id: "java-savepoint-partial-trace",
      title: "required 유지·optional rollback·fallback·outer commit을 Connection proxy로 기록합니다",
      language: "java",
      filename: "SavepointPartialTrace.java",
      purpose: "savepoint가 nested transaction이 아니라 outer lifecycle 일부임을 exact call sequence로 보여 줍니다.",
      code: String.raw`import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.Savepoint;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class SavepointPartialTrace {
    static final class NamedSavepoint implements Savepoint {
        private final String name;
        NamedSavepoint(String name) { this.name = name; }
        public int getSavepointId() throws SQLException {
            throw new SQLException("named savepoint");
        }
        public String getSavepointName() { return name; }
    }
    static final class Trace implements InvocationHandler {
        final List<String> events = new ArrayList<>();
        boolean autoCommit = true;
        int commits;
        int fullRollbacks;
        void work(String name) { events.add("work:" + name); }
        public Object invoke(Object proxy, Method method, Object[] args) throws SQLException {
            return switch (method.getName()) {
                case "getAutoCommit" -> autoCommit;
                case "setAutoCommit" -> {
                    autoCommit = (Boolean) args[0]; events.add("auto:" + autoCommit); yield null;
                }
                case "setSavepoint" -> {
                    String name = (String) args[0]; events.add("savepoint:" + name); yield new NamedSavepoint(name);
                }
                case "rollback" -> {
                    if (args == null) { fullRollbacks++; events.add("rollback"); }
                    else events.add("rollbackTo:" + ((Savepoint) args[0]).getSavepointName());
                    yield null;
                }
                case "releaseSavepoint" -> {
                    events.add("release:" + ((Savepoint) args[0]).getSavepointName()); yield null;
                }
                case "commit" -> { commits++; events.add("commit"); yield null; }
                default -> throw new UnsupportedOperationException(method.getName());
            };
        }
    }
    static Connection connection(Trace trace) {
        return (Connection) Proxy.newProxyInstance(
            Connection.class.getClassLoader(), new Class<?>[]{Connection.class}, trace);
    }
    static void run(Connection connection, Trace trace) throws SQLException {
        boolean original = connection.getAutoCommit();
        connection.setAutoCommit(false);
        try {
            trace.work("required");
            Savepoint optional = connection.setSavepoint("optional");
            try {
                trace.work("optional");
                throw new SQLException("optional rejected", "23000");
            } catch (SQLException expected) {
                connection.rollback(optional);
                trace.work("fallback");
            } finally {
                connection.releaseSavepoint(optional);
            }
            connection.commit();
        } catch (SQLException failure) {
            connection.rollback();
            throw failure;
        } finally {
            connection.setAutoCommit(original);
        }
    }
    public static void main(String[] args) throws Exception {
        Trace trace = new Trace();
        run(connection(trace), trace);
        System.out.println("events=" + String.join("|", trace.events));
        System.out.println("commits=" + trace.commits);
        System.out.println("fullRollbacks=" + trace.fullRollbacks);
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "Connection/Savepoint proxy와 event collection dependencies를 import합니다." },
        { lines: "11-18", explanation: "이름 기반 Savepoint의 JDBC contract를 구현합니다." },
        { lines: "19-47", explanation: "autoCommit/savepoint/partial·full rollback/release/commit calls를 기록하는 Connection handler를 정의합니다." },
        { lines: "48-51", explanation: "JDK proxy Connection을 생성합니다." },
        { lines: "52-75", explanation: "required work, optional failure, rollback-to/fallback/release와 outer commit/rollback/restore를 수행합니다." },
        { lines: "76-81", explanation: "call order와 outer commit/full rollback counts를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK proxy Connection/Savepoint", "planned optional failure", "no database", "-Xlint:all warning0"], command: isolatedJavaRun("SavepointPartialTrace.java", "SavepointPartialTrace") },
      output: { value: "events=auto:false|work:required|savepoint:optional|work:optional|rollbackTo:optional|work:fallback|release:optional|commit|auto:true\ncommits=1\nfullRollbacks=0", explanation: ["savepoint 이전 required work는 outer transaction에 남습니다.", "optional만 되돌리고 fallback 뒤 outer commit합니다.", "업무 policy상 full rollback은 사용하지 않습니다."] },
      experiments: [
        { change: "fallback도 실패하게 합니다.", prediction: "outer catch가 full rollback을 호출해 required work까지 모두 되돌립니다.", result: "partial recovery 실패는 전체 transaction failure로 승격합니다." },
        { change: "savepoint 직후 commit한 뒤 optional을 실행합니다.", prediction: "한 atomic 업무가 두 transactions로 나뉘어 outer rollback이 required를 되돌리지 못합니다.", result: "savepoint를 nested commit으로 사용하지 않습니다." },
        { change: "releaseSavepoint 지원이 없는 driver를 사용합니다.", prediction: "cleanup call에서 SQLException이 나 primary outcome 처리에 영향을 줄 수 있습니다.", result: "metadata/driver contract와 release failure policy를 integration test합니다." },
      ],
      sourceRefs: ["java-connection", "java-savepoint", "java-database-metadata", "java-sql-exception", "jdbc-spec-43", "oracle-jdbc-transactions", "mysql-savepoint"],
    }],
    diagnostics: [
      { symptom: "savepoint rollback 뒤에도 lock wait가 계속된다.", likelyCause: "부분 rollback이 모든 locks를 즉시 해제한다고 가정했지만 database isolation/implementation이 transaction 종료까지 일부 locks를 유지합니다.", checks: ["DB lock view와 transaction id를 봅니다.", "isolation/engine docs를 확인합니다.", "outer transaction duration을 측정합니다."], fix: "outer transaction을 짧게 하고 partial-work design과 lock order를 교정합니다.", prevention: "real DB concurrent integration test로 lock retention을 검증합니다." },
      { symptom: "optional 단계가 실패했는데 성공 응답만 나가 데이터가 축소됐다.", likelyCause: "fallback commit policy를 caller-visible result와 audit에 표현하지 않았습니다.", checks: ["rollback-to 이후 events를 봅니다.", "domain outcome model을 확인합니다.", "optional/required 분류를 재검토합니다."], fix: "partial/fallback outcome을 명시하고 허용되지 않으면 full rollback합니다.", prevention: "각 optional failure의 expected external result를 contract test합니다." },
    ],
    expertNotes: ["Savepoints are database-transaction markers, not independent transactions; external side effects executed after a savepoint are not undone by JDBC rollback.", "Driver support, lock retention and sequence behavior require integration evidence on the production database engine."],
  },
  {
    id: "isolation-anomalies-optimistic-version-retry",
    title: "격리 수준의 anomaly 표와 optimistic version retry를 분리해 설계합니다",
    lead: "READ_COMMITTED·REPEATABLE_READ 이름만 믿지 않고 업무 anomaly, database 구현과 conditional affected-row contract를 함께 검증합니다.",
    explanations: [
      "isolation은 concurrent transactions가 서로의 changes를 언제 관찰하는지 정하는 contract입니다. JDBC constants는 NONE, READ_UNCOMMITTED, READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE을 제공합니다.",
      "READ_UNCOMMITTED는 dirty read 가능성이 있고 READ_COMMITTED는 dirty read를 막지만 같은 row 재조회가 달라지는 non-repeatable read가 가능합니다.",
      "REPEATABLE_READ와 phantom/lost-update behavior는 database MVCC/locking 구현에 따라 다릅니다. isolation 이름만으로 모든 anomaly가 제거됐다고 단정하지 않습니다.",
      "SERIALIZABLE은 결과를 serial execution처럼 제한하지만 abort/deadlock과 낮은 concurrency cost가 생길 수 있어 retry policy가 transaction semantics 일부입니다.",
      "optimistic locking은 version column을 read하고 `update ... where id=? and version=?`로 commit합니다. affected rows0은 stale write conflict이며 새 state를 읽어 다시 계산하거나 caller에409-like conflict를 반환합니다.",
      "retry는 SQLState class40 같은 transaction rollback category와 driver/vendor codes를 allowlist하고 횟수·elapsed time·jitter를 제한합니다. validation/constraint errors는 그대로 재시도하지 않습니다.",
      "idempotency가 없는 transaction을 처음부터 재실행하면 외부 payment/email이 중복될 수 있습니다. external effects는 outbox 또는 idempotent adapter로 분리합니다.",
      "예제 Store는 실제 DB가 아닌 명시적 교육 model입니다. READ_COMMITTED-style 재조회100→120, captured snapshot100→100, stale CAS failure와 fresh retry success를 exact 보여 줍니다.",
    ],
    concepts: [
      { term: "isolation level", definition: "동시 transactions 사이에서 reads/writes와 anomalies를 제한하는 database/JDBC 설정입니다.", detail: ["engine 구현을 검증합니다.", "성능·abort tradeoff가 있습니다."] },
      { term: "non-repeatable read", definition: "한 transaction이 같은 row를 두 번 읽는 사이 다른 committed update 때문에 값이 달라지는 현상입니다.", detail: ["READ_COMMITTED에서 가능할 수 있습니다.", "snapshot policy와 관련됩니다."] },
      { term: "optimistic locking", definition: "lock을 오래 보유하지 않고 version 조건이 여전히 맞을 때만 update를 성공시키는 concurrency control입니다.", detail: ["affected rows0이 conflict입니다.", "recompute/retry가 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-isolation-version-model",
      title: "100→120 재조회, 고정 snapshot과 stale/fresh CAS를 deterministic store로 비교합니다",
      language: "java",
      filename: "IsolationVersionModel.java",
      purpose: "isolation anomaly와 optimistic update를 특정 DB 없는 명시 model로 분리해 설명합니다.",
      code: String.raw`import java.sql.Connection;

public class IsolationVersionModel {
    record Versioned(int value, int version) {}
    static final class Store {
        private Versioned current = new Versioned(100, 0);
        synchronized Versioned read() { return current; }
        synchronized void write(int value) {
            current = new Versioned(value, current.version() + 1);
        }
        synchronized boolean compareAndSet(int expectedVersion, int value) {
            if (current.version() != expectedVersion) return false;
            current = new Versioned(value, current.version() + 1);
            return true;
        }
    }
    public static void main(String[] args) {
        Store store = new Store();
        int readCommittedFirst = store.read().value();
        Versioned repeatableSnapshot = store.read();
        store.write(120);
        int readCommittedSecond = store.read().value();

        Versioned stale = store.read();
        store.write(130);
        boolean firstCas = store.compareAndSet(stale.version(), 140);
        Versioned fresh = store.read();
        boolean retryCas = store.compareAndSet(fresh.version(), 140);
        Versioned result = store.read();

        System.out.println("readCommitted=" + readCommittedFirst + "->" + readCommittedSecond);
        System.out.println("repeatable=" + repeatableSnapshot.value() + "->" + repeatableSnapshot.value());
        System.out.println("firstCas=" + firstCas);
        System.out.println("retryCas=" + retryCas);
        System.out.println("final=" + result.value() + "@" + result.version());
        System.out.println("jdbcLevels=" + Connection.TRANSACTION_READ_COMMITTED
            + "," + Connection.TRANSACTION_REPEATABLE_READ);
    }
}`,
      walkthrough: [
        { lines: "1-3", explanation: "JDBC isolation constants와 immutable value/version pair를 준비합니다." },
        { lines: "4-15", explanation: "synchronized 교육용 store에서 read, committed write와 conditional version update를 정의합니다." },
        { lines: "16-22", explanation: "첫 read와 captured snapshot 뒤 committed value120을 만듭니다." },
        { lines: "23-29", explanation: "stale version 뒤 competing write130, failed CAS와 fresh retry140을 수행합니다." },
        { lines: "31-37", explanation: "non-repeatable/snapshot observations, CAS outcomes, final version과 JDBC constants를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "deterministic in-memory version store", "no JDBC driver/database", "-Xlint:all warning0"], command: isolatedJavaRun("IsolationVersionModel.java", "IsolationVersionModel") },
      output: { value: "readCommitted=100->120\nrepeatable=100->100\nfirstCas=false\nretryCas=true\nfinal=140@3\njdbcLevels=2,4", explanation: ["재조회 model은 committed update120을 봅니다.", "captured snapshot은100을 유지합니다.", "stale version은 실패하고 fresh version retry가140@3을 만듭니다."] },
      experiments: [
        { change: "version predicate 없이 마지막 write140을 수행합니다.", prediction: "130 update를 조용히 덮어써 lost update가 됩니다.", result: "version 조건과 affected rows0 conflict를 사용합니다." },
        { change: "모든 SQLException을 무한 retry합니다.", prediction: "constraint/auth/syntax failure는 회복하지 않고 overload/retry storm만 커집니다.", result: "retryable SQLState/vendor allowlist와 bounded budget을 둡니다." },
        { change: "실제 MySQL REPEATABLE READ를 이 model과 같다고 단정합니다.", prediction: "MVCC snapshot·locking read·gap lock 차이를 놓칩니다.", result: "production dialect/engine에서 anomaly matrix를 integration test합니다." },
      ],
      sourceRefs: ["java-connection", "java-sql-exception", "jdbc-spec-43", "oracle-jdbc-transactions", "mysql-isolation", "mysql-innodb-locking"],
    }],
    diagnostics: [
      { symptom: "동시에 수정한 값이 마지막 writer에 조용히 덮인다.", likelyCause: "read 후 update에 version/expected-value predicate가 없어 lost update를 감지하지 못했습니다.", checks: ["UPDATE WHERE와 affected rows를 봅니다.", "version column을 확인합니다.", "concurrent two-session fixture를 실행합니다."], fix: "optimistic version 조건 또는 적합한 locking/isolation을 사용하고 rows0을 conflict로 처리합니다.", prevention: "동시 update integration test와 version increment constraint를 둡니다." },
      { symptom: "deadlock 재시도로 DB 부하가 더 커진다.", likelyCause: "unbounded immediate retry와 긴 transaction이 contention을 증폭했습니다.", checks: ["SQLState/vendor code와 attempts를 봅니다.", "lock graph/transaction duration을 측정합니다.", "retry jitter와 budget을 확인합니다."], fix: "transaction을 줄이고 global resource order, bounded exponential backoff+jitter와 admission control을 적용합니다.", prevention: "retry rate/abort SLO와 circuit/load shedding을 운영합니다." },
    ],
    expertNotes: ["Isolation-level names are portable constants, but anomaly behavior and locking details are database-engine-specific and require production-dialect tests.", "Retry is part of transaction semantics only when the work is replay-safe and external side effects are idempotent or transactional."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...transactionChapters);

const daoOperationsChapters: DetailedSession["chapters"] = [
  {
    id: "dao-boundary-resultset-label-mapping-null-validation",
    title: "DAO는 SQL·binding·label mapping을 캡슐화하고 immutable domain result를 반환합니다",
    lead: "ResultSet column ordinal과 console 출력에 결합된 원본을 column label·wasNull·domain invariant 기반 mapper로 분리해 schema drift와 testability를 개선합니다.",
    explanations: [
      "DAO는 persistence mechanism을 application use case에서 격리합니다. SQL template, binding, ResultSet→domain mapping과 persistence exception translation이 핵심 책임입니다.",
      "원본 Ex14_DAO는 select methods가 void이고 rows를 console에 직접 출력합니다. caller가 empty/not-found/data를 구조적으로 구분하거나 transaction에 조합하기 어렵습니다.",
      "ResultSet getInt(1)/getString(2..4) ordinal mapping은 SELECT * column order에 결합됩니다. 명시 column list와 stable aliases, label getters를 사용합니다.",
      "primitive getter는 SQL NULL에서0/false를 반환할 수 있으므로 wasNull을 직후 확인해야 합니다. wrapper getObject(label, Integer.class) 지원도 driver contract로 검증합니다.",
      "mapper는 required id/name, length/range와 nullable phone을 검증해 invalid database state가 domain layer로 조용히 퍼지지 않게 합니다.",
      "DAO에서 connection을 항상 얻고 닫는 방식과 caller-provided connection 방식의 ownership을 분리합니다. transaction participating method는 caller connection을 닫지 않습니다.",
      "empty query는 빈 List, id miss는 Optional.empty 또는 typed result로 표현하고 null/list/exception을 섞지 않습니다. pagination과 maximum rows도 API contract에 넣습니다.",
      "예제 ResultSet proxy의 backing map은 phone,name,custid 순서지만 mapper는 labels로7/Ada/null을 정확히 읽습니다. 실제 cursor next는 caller/DAO query loop가 책임집니다.",
    ],
    concepts: [
      { term: "DAO", definition: "SQL·binding·mapping 같은 data-access details를 domain/service에서 분리하는 객체 경계입니다.", detail: ["transaction ownership은 별도일 수 있습니다.", "구조화된 results를 반환합니다."] },
      { term: "column label mapping", definition: "SELECT alias/name을 ResultSet getter key로 사용해 물리 column ordinal과 Java field의 결합을 줄이는 방식입니다.", detail: ["명시 SELECT list를 사용합니다.", "duplicate labels를 피합니다."] },
      { term: "wasNull", definition: "마지막 primitive ResultSet getter가 SQL NULL을 읽었는지 확인하는 JDBC method입니다.", detail: ["getter 직후 호출합니다.", "0/false와 NULL을 구분합니다."] },
    ],
    codeExamples: [{
      id: "java-resultset-label-mapper",
      title: "column 순서가 섞인 proxy ResultSet을 labels와 wasNull로 immutable Customer에 매핑합니다",
      language: "java",
      filename: "ResultSetLabelMapper.java",
      purpose: "DB 없이 label-based mapping, nullable field와 domain validation을 exact 검증합니다.",
      code: String.raw`import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ResultSetLabelMapper {
    record Customer(int id, String name, String phone) {}
    static final class Row implements InvocationHandler {
        final Map<String, Object> values = new LinkedHashMap<>();
        final List<String> reads = new ArrayList<>();
        boolean lastWasNull;
        public Object invoke(Object proxy, Method method, Object[] args) {
            return switch (method.getName()) {
                case "getInt" -> {
                    String label = (String) args[0]; reads.add(label);
                    Object value = values.get(label); lastWasNull = value == null;
                    yield value == null ? 0 : (Integer) value;
                }
                case "getString" -> {
                    String label = (String) args[0]; reads.add(label);
                    Object value = values.get(label); lastWasNull = value == null;
                    yield (String) value;
                }
                case "wasNull" -> lastWasNull;
                default -> throw new UnsupportedOperationException(method.getName());
            };
        }
    }
    static ResultSet resultSet(Row row) {
        return (ResultSet) Proxy.newProxyInstance(
            ResultSet.class.getClassLoader(), new Class<?>[]{ResultSet.class}, row);
    }
    static Customer map(ResultSet result) throws SQLException {
        int id = result.getInt("custid");
        if (result.wasNull() || id <= 0) throw new SQLException("invalid id", "22003");
        String name = result.getString("name");
        if (name == null || name.isBlank()) throw new SQLException("invalid name", "22000");
        String phone = result.getString("phone");
        if (result.wasNull()) phone = null;
        return new Customer(id, name, phone);
    }
    public static void main(String[] args) throws Exception {
        Row row = new Row();
        row.values.put("phone", null);
        row.values.put("name", "Ada");
        row.values.put("custid", 7);
        Customer customer = map(resultSet(row));
        System.out.println("customer=" + customer.id() + ":" + customer.name()
            + ":" + (customer.phone() == null ? "<none>" : customer.phone()));
        System.out.println("reads=" + String.join("|", row.reads));
        System.out.println("physicalOrder=" + String.join("|", row.values.keySet()));
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "ResultSet proxy, SQLException과 order-preserving row/read collections를 import합니다." },
        { lines: "11-12", explanation: "DAO가 반환할 immutable Customer domain record를 정의합니다." },
        { lines: "13-32", explanation: "label getters와 직전 NULL state를 구현하고 실제 read labels를 기록합니다." },
        { lines: "33-36", explanation: "실제 ResultSet interface의 JDK proxy를 생성합니다." },
        { lines: "37-45", explanation: "id/name invariants와 nullable phone을 labels/wasNull로 mapping합니다." },
        { lines: "46-58", explanation: "물리 insertion order를 섞고 mapped value, logical reads와 physical order를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK proxy ResultSet", "single positioned synthetic row", "no database", "-Xlint:all warning0"], command: isolatedJavaRun("ResultSetLabelMapper.java", "ResultSetLabelMapper") },
      output: { value: "customer=7:Ada:<none>\nreads=custid|name|phone\nphysicalOrder=phone|name|custid", explanation: ["physical map order와 무관하게 labels로 mapping합니다.", "phone SQL NULL은 domain null로 유지됩니다.", "읽은 labels와 order가 명시적입니다."] },
      experiments: [
        { change: "map에서 getInt(1), getString(2/3)을 사용합니다.", prediction: "physical order phone/name/custid fixture에서 cast 또는 잘못된 field mapping이 납니다.", result: "명시 aliases와 label getters를 사용합니다." },
        { change: "id getter 뒤 wasNull을 제거합니다.", prediction: "SQL NULL custid가0으로 보여 domain range error와 null 원인을 구분하기 어렵습니다.", result: "primitive getter 직후 wasNull을 확인합니다." },
        { change: "DAO가 Customer 대신 println만 수행합니다.", prediction: "service가 not-found, pagination, transaction composition과 test assertions를 구조화하지 못합니다.", result: "domain result/Optional/List를 반환하고 presentation을 분리합니다." },
      ],
      sourceRefs: ["java-result-set", "java-sql-exception", "java-proxy", "java-invocation-handler", "jdbc-spec-43", "oracle-jdbc-retrieving"],
    }],
    diagnostics: [
      { symptom: "SELECT column 추가 뒤 이름·전화번호가 뒤바뀐다.", likelyCause: "SELECT *와 ordinal getters가 physical column order에 결합됐습니다.", checks: ["SQL select list를 봅니다.", "getXXX indices와 metadata를 비교합니다.", "schema migration을 확인합니다."], fix: "필요 columns/aliases를 명시하고 label-based mapper로 전환합니다.", prevention: "reordered/extra-column mapping contract test를 둡니다." },
      { symptom: "nullable 숫자 column이0으로 저장된 것처럼 보인다.", likelyCause: "getInt가 SQL NULL에서0을 반환했는데 wasNull을 확인하지 않았습니다.", checks: ["getter 직후 wasNull call을 봅니다.", "column nullability와 domain type을 확인합니다.", "NULL/0 fixtures를 비교합니다."], fix: "wasNull 또는 supported typed getObject를 사용해 nullable wrapper/domain type으로 mapping합니다.", prevention: "NULL·zero·missing-row tests를 분리합니다." },
    ],
    expertNotes: ["Label mapping reduces order coupling but still needs explicit aliases when joins expose duplicate column names.", "A unit ResultSet proxy validates mapper logic; actual driver type conversions, case folding and metadata require integration tests."],
  },
  {
    id: "sql-exception-taxonomy-resource-close-suppressed-chain",
    title: "SQLException의 SQLState·vendor code·cause와 try-with-resources suppressed failures를 보존합니다",
    lead: "body failure를 close failure로 덮어쓰지 않고 reverse close order와 suppressed chain을 유지해 retry·constraint·connection 진단이 가능한 예외 경계를 만듭니다.",
    explanations: [
      "SQLException은 message만이 아니라 SQLState, vendor error code, cause와 nextException chain을 가집니다. translation 전에 모두 보존해야 driver/database 진단이 가능합니다.",
      "SQLState 앞 두 자리는 class를 나타냅니다. class08 connection, class23 integrity constraint, class40 transaction rollback처럼 portable starting point가 있지만 vendor-specific code도 함께 봅니다.",
      "모든 class40을 무조건 retry하지 않습니다. transaction work가 replay-safe하고 retry budget·idempotency·backoff를 갖춘 경우에만 allowlist합니다.",
      "try-with-resources body와 close가 모두 실패하면 body exception이 primary이고 close exceptions가 suppressed로 붙습니다. resources는 declaration의 역순으로 닫힙니다.",
      "수동 finally에서 close exception을 새 RuntimeException으로 던지면 primary SQL failure를 덮을 수 있습니다. try-with-resources가 구조적으로 더 정확한 이유입니다.",
      "exception translation은 domain conflict/not-found/unavailable 등 stable categories를 반환하되 raw SQLException을 cause로 보존하고 SQL/parameters/credentials를 public message에 넣지 않습니다.",
      "BatchUpdateException update counts와 chained SQLException을 모두 검사합니다. 첫 exception 하나만 보면 partial batch 결과와 server detail을 잃을 수 있습니다.",
      "예제는 planned SQLState40001 body failure와 statement/connection close failures 둘을 만들고 reverse order와 suppressed2, 별도 class23 constraint 분류를 exact 검증합니다.",
    ],
    concepts: [
      { term: "SQLState", definition: "SQLException 원인을 표준화된 다섯 문자 code로 분류하는 필드로 앞 두 문자가 class입니다.", detail: ["vendor code와 함께 사용합니다.", "retry taxonomy의 입력입니다."] },
      { term: "suppressed exception", definition: "primary exception을 유지하면서 resource cleanup 등 추가 실패를 연결하는 Throwable 목록입니다.", detail: ["try-with-resources가 자동 연결합니다.", "로그/telemetry에서 보존합니다."] },
      { term: "exception translation", definition: "persistence-specific failure를 application/domain category로 바꾸되 원인 evidence를 cause chain에 보존하는 경계입니다.", detail: ["public message는 안전해야 합니다.", "retryability를 명시합니다."] },
    ],
    codeExamples: [{
      id: "java-sql-exception-suppressed-chain",
      title: "body40001과 두 close failures의 primary/suppressed·reverse order를 검증합니다",
      language: "java",
      filename: "SqlExceptionSuppressedChain.java",
      purpose: "resource cleanup failure가 원래 transaction failure를 가리지 않는 try-with-resources semantics를 보여 줍니다.",
      code: String.raw`import java.sql.SQLException;
import java.sql.SQLIntegrityConstraintViolationException;
import java.util.ArrayList;
import java.util.List;

public class SqlExceptionSuppressedChain {
    static final class Resource implements AutoCloseable {
        private final String name;
        private final List<String> closeOrder;
        Resource(String name, List<String> closeOrder) {
            this.name = name;
            this.closeOrder = closeOrder;
        }
        String name() { return name; }
        public void close() throws SQLException {
            closeOrder.add(name);
            throw new SQLException("close failed", "08006");
        }
    }
    static String classify(SQLException failure) {
        String state = failure.getSQLState();
        if (state == null || state.length() < 2) return "unknown";
        return switch (state.substring(0, 2)) {
            case "40" -> "retryable-transaction";
            case "23" -> "constraint";
            case "08" -> "connection";
            default -> "database";
        };
    }
    public static void main(String[] args) {
        List<String> closeOrder = new ArrayList<>();
        SQLException primary = null;
        try (Resource connection = new Resource("connection", closeOrder);
             Resource statement = new Resource("statement", closeOrder)) {
            if (!"connection".equals(connection.name()) || !"statement".equals(statement.name())) {
                throw new AssertionError("resource identity");
            }
            throw new SQLException("deadlock victim", "40001", 1213);
        } catch (SQLException failure) {
            primary = failure;
        }
        SQLException constraint = new SQLIntegrityConstraintViolationException(
            "duplicate", "23505", 1062);
        System.out.println("primaryState=" + primary.getSQLState());
        System.out.println("closeOrder=" + String.join("|", closeOrder));
        System.out.println("suppressed=" + primary.getSuppressed().length);
        System.out.println("category=" + classify(primary));
        System.out.println("constraint=" + classify(constraint));
    }
}`,
      walkthrough: [
        { lines: "1-4", explanation: "SQLException types와 reverse close trace collection을 import합니다." },
        { lines: "7-19", explanation: "resource identity를 참조 가능하게 두고 close 순서를 기록한 뒤 SQLState08 failure를 던지는 AutoCloseable을 정의합니다." },
        { lines: "20-30", explanation: "SQLState class40/23/08을 stable categories로 분류합니다." },
        { lines: "31-42", explanation: "connection 뒤 statement를 선언·참조하고 body에서 planned40001을 던져 두 close failures를 suppressed로 만듭니다." },
        { lines: "43-50", explanation: "별도 constraint exception과 primary state, reverse close order, suppressed count/categories를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "synthetic SQLException and AutoCloseable resources", "no database", "-Xlint:all warning0"], command: isolatedJavaRun("SqlExceptionSuppressedChain.java", "SqlExceptionSuppressedChain") },
      output: { value: "primaryState=40001\ncloseOrder=statement|connection\nsuppressed=2\ncategory=retryable-transaction\nconstraint=constraint", explanation: ["body SQLState40001이 primary로 남습니다.", "statement가 connection보다 먼저 닫힙니다.", "close failures2가 suppressed되고 class23은 constraint로 분류됩니다."] },
      experiments: [
        { change: "finally에서 connection.close exception을 그대로 던집니다.", prediction: "원래40001이08006 close failure로 가려질 수 있습니다.", result: "try-with-resources 또는 explicit suppressed 보존을 사용합니다." },
        { change: "message 문자열에 deadlock이 포함되면 retry합니다.", prediction: "locale/vendor/version에 따라 잘못 분류됩니다.", result: "SQLState/vendor code allowlist와 cause를 사용합니다." },
        { change: "public error에 SQL과 bound values를 포함합니다.", prediction: "schema와 PII/secret가 client/log로 노출됩니다.", result: "safe category/correlation id만 공개하고 raw details는 제한 telemetry에 둡니다." },
      ],
      sourceRefs: ["java-sql-exception", "java-sql-integrity-exception", "java-batch-update-exception", "java-auto-closeable", "java-throwable", "jdbc-spec-43", "owasp-logging-cheat-sheet"],
    }],
    diagnostics: [
      { symptom: "실제 constraint 오류 대신 close failed만 로그에 남는다.", likelyCause: "수동 finally close가 primary SQLException을 덮어썼습니다.", checks: ["cause/suppressed/nextException을 모두 봅니다.", "resource close code를 확인합니다.", "fault order를 재현합니다."], fix: "try-with-resources로 전환하거나 primary에 cleanup failure를 addSuppressed합니다.", prevention: "body+각 close 동시 실패 fixture를 둡니다." },
      { symptom: "재시도해도 syntax/constraint 오류가 반복된다.", likelyCause: "모든 SQLException을 transient로 취급했습니다.", checks: ["SQLState class와 vendor code를 봅니다.", "operation idempotency를 확인합니다.", "attempt/backoff를 측정합니다."], fix: "명시 retryable taxonomy만 bounded retry하고 나머지는 즉시 typed failure로 반환합니다.", prevention: "SQLState별 retry/non-retry table과 test를 유지합니다." },
    ],
    expertNotes: ["SQLState is a portable starting point, not a complete taxonomy; production classification often combines state class, vendor code, operation phase and idempotency.", "Always inspect SQLException.nextException and suppressed exceptions when diagnosing batch, commit or cleanup failures."],
  },
  {
    id: "datasource-pool-logical-connection-reset-ownership",
    title: "DataSource pool의 logical Connection 반환·state reset·capacity budget을 검증합니다",
    lead: "DriverManager 직접 연결을 request마다 만들지 않고 DataSource에서 logical handle을 빌리되 close, timeout, reset과 leak의 운영 계약을 명시합니다.",
    explanations: [
      "DataSource는 connection acquisition을 application code와 driver URL/credential에서 분리합니다. container/pool이 configuration, reuse와 lifecycle을 소유할 수 있습니다.",
      "pool에서 Connection.close는 대개 physical socket 종료가 아니라 logical handle 반환입니다. 그래서 try-with-resources close가 여전히 필수이며 connection을 field/singleton에 보관하면 안 됩니다.",
      "borrower가 autoCommit false, readOnly, isolation, catalog/schema, warnings와 session variables를 바꿨다면 반환 전 reset돼야 합니다. uncommitted work가 다음 borrower에 새면 심각한 정합성 결함입니다.",
      "production pool은 rollback/reset/validation을 수행하지만 application이 dirty connection을 반환해도 된다는 뜻은 아닙니다. transaction owner가 outcome과 restore를 명확히 합니다.",
      "pool size는 web thread 수만큼 크게 잡지 않습니다. DB max connections, active query latency, CPU/I/O capacity와 downstream SLO에서 시작하고 acquisition timeout으로 backpressure합니다.",
      "leak detection은 진단 도구이지 connection을 자동 안전 회수하는 guarantee가 아닙니다. borrow stack, age와 owner context를 민감정보 없이 수집합니다.",
      "credential은 source/DataSource method argument에 박지 않고 secret provider와 deployment config에서 주입·rotation합니다. public logs에 URL query/password를 남기지 않습니다.",
      "예제 FakePool은 physical resource1을 재사용하는 model에서 logical borrows2를 만들고 첫 close 시 state를 reset해 두 번째 borrower가 autoCommit true/readOnly false를 받는지 확인합니다.",
    ],
    concepts: [
      { term: "DataSource", definition: "Connection 획득을 위한 표준 JDBC factory abstraction으로 pooling/container integration의 기본 경계입니다.", detail: ["URL/credential을 감춥니다.", "lifecycle owner를 분리합니다."] },
      { term: "logical connection", definition: "pool의 physical database connection을 일정 기간 빌려 쓰는 borrower-facing Connection handle입니다.", detail: ["close는 반환일 수 있습니다.", "borrow 범위 밖 사용 금지입니다."] },
      { term: "connection reset", definition: "pool 반환 시 transaction/session state를 안전한 baseline으로 복원해 다음 borrower 격리를 지키는 과정입니다.", detail: ["rollback과 properties를 포함합니다.", "integration test가 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-datasource-logical-pool",
      title: "physical1·logical2 model에서 close 반환과 autoCommit/readOnly reset을 검증합니다",
      language: "java",
      filename: "DataSourceLogicalPool.java",
      purpose: "DataSource/Connection interfaces만으로 pool ownership과 state leakage 방지 contract를 설명합니다.",
      code: String.raw`import java.io.PrintWriter;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.logging.Logger;
import javax.sql.DataSource;

public class DataSourceLogicalPool {
    static final class State implements InvocationHandler {
        boolean autoCommit = true;
        boolean readOnly;
        boolean closed;
        public Object invoke(Object proxy, Method method, Object[] args) {
            return switch (method.getName()) {
                case "getAutoCommit" -> autoCommit;
                case "setAutoCommit" -> { autoCommit = (Boolean) args[0]; yield null; }
                case "isReadOnly" -> readOnly;
                case "setReadOnly" -> { readOnly = (Boolean) args[0]; yield null; }
                case "close" -> {
                    autoCommit = true; readOnly = false; closed = true; yield null;
                }
                case "isClosed" -> closed;
                default -> throw new UnsupportedOperationException(method.getName());
            };
        }
    }
    static final class FakePool implements DataSource {
        int borrows;
        int loginTimeout;
        State lastState;
        public Connection getConnection() {
            borrows++;
            lastState = new State();
            return (Connection) Proxy.newProxyInstance(
                Connection.class.getClassLoader(), new Class<?>[]{Connection.class}, lastState);
        }
        public Connection getConnection(String user, String password) throws SQLException {
            throw new SQLFeatureNotSupportedException("credentials configured externally");
        }
        public PrintWriter getLogWriter() { return null; }
        public void setLogWriter(PrintWriter writer) {}
        public void setLoginTimeout(int seconds) { loginTimeout = seconds; }
        public int getLoginTimeout() { return loginTimeout; }
        public Logger getParentLogger() { return Logger.getLogger("fake-pool"); }
        public <T> T unwrap(Class<T> type) throws SQLException {
            if (type.isInstance(this)) return type.cast(this);
            throw new SQLException("not a wrapper");
        }
        public boolean isWrapperFor(Class<?> type) { return type.isInstance(this); }
    }
    public static void main(String[] args) throws Exception {
        FakePool pool = new FakePool();
        Connection first = pool.getConnection();
        first.setAutoCommit(false);
        first.setReadOnly(true);
        first.close();
        boolean firstReturned = first.isClosed();

        boolean secondAutoCommit;
        boolean secondReadOnly;
        try (Connection second = pool.getConnection()) {
            secondAutoCommit = second.getAutoCommit();
            secondReadOnly = second.isReadOnly();
        }
        System.out.println("physicalCreated=1");
        System.out.println("logicalBorrows=" + pool.borrows);
        System.out.println("firstReturned=" + firstReturned);
        System.out.println("secondAutoCommit=" + secondAutoCommit);
        System.out.println("secondReadOnly=" + secondReadOnly);
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "DataSource가 요구하는 JDBC, logging, wrapper types를 import합니다." },
        { lines: "12-29", explanation: "logical Connection state와 close 시 baseline reset을 구현합니다." },
        { lines: "30-52", explanation: "credential-free getConnection, timeout/log/wrapper contract를 가진 minimal DataSource를 정의합니다." },
        { lines: "53-60", explanation: "첫 borrower가 state를 변경한 뒤 close로 반환합니다." },
        { lines: "61-67", explanation: "두 번째 logical borrower가 reset baseline을 관찰하고 다시 close합니다." },
        { lines: "68-72", explanation: "physical/logical counts, 반환과 reset state를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK DataSource/Connection proxy", "one modeled physical resource", "no driver/database/credentials", "-Xlint:all warning0"], command: isolatedJavaRun("DataSourceLogicalPool.java", "DataSourceLogicalPool") },
      output: { value: "physicalCreated=1\nlogicalBorrows=2\nfirstReturned=true\nsecondAutoCommit=true\nsecondReadOnly=false", explanation: ["한 modeled physical resource에서 logical handles2를 빌립니다.", "첫 close는 borrower handle 반환을 나타냅니다.", "두 번째 borrower는 clean baseline을 봅니다."] },
      experiments: [
        { change: "close에서 state reset을 제거합니다.", prediction: "두 번째 borrower가 autoCommit=false/readOnly=true를 받아 transaction과 write behavior가 오염됩니다.", result: "pool과 application 양쪽에서 reset contract를 검증합니다." },
        { change: "Connection을 static field에 캐시합니다.", prediction: "동시 requests가 transaction/session state를 공유하고 pool ownership이 깨집니다.", result: "use-case lexical scope에서 borrow/close합니다." },
        { change: "pool size를 request threads와 같은1000으로 설정합니다.", prediction: "DB max connections/CPU를 초과해 queueing·failure가 커질 수 있습니다.", result: "DB capacity와 query latency 기반으로 sizing하고 acquisition timeout을 둡니다." },
      ],
      sourceRefs: ["java-data-source", "java-connection", "java-wrapper", "java-sql-feature-not-supported", "java-proxy", "java-invocation-handler", "jdbc-spec-43", "hikaricp-readme", "owasp-secrets-management"],
    }],
    diagnostics: [
      { symptom: "다음 요청의 첫 query가 commit되지 않거나 read-only 오류가 난다.", likelyCause: "이전 borrower의 autoCommit/readOnly/transaction state가 pool 반환 시 reset되지 않았습니다.", checks: ["borrow/return state trace를 봅니다.", "pool reset/rollback configuration을 확인합니다.", "connection unwrap/session variables를 조사합니다."], fix: "transaction owner가 outcome/restore를 수행하고 pool reset contract를 교정합니다.", prevention: "두-borrower state leakage integration test를 둡니다." },
      { symptom: "부하 시 connection acquisition timeout이 급증한다.", likelyCause: "connection leak, 긴 transaction/query 또는 DB capacity보다 작은/큰 부적절한 pool과 retry storm이 있습니다.", checks: ["active/idle/pending/borrow age를 봅니다.", "query/transaction p99를 측정합니다.", "DB sessions와 locks를 확인합니다."], fix: "leak을 제거하고 transaction을 줄이며 DB budget에 맞게 pool/admission control을 조정합니다.", prevention: "acquisition SLO·leak detection·pool metrics alerts를 운영합니다." },
    ],
    expertNotes: ["A realistic pool must reset more than autoCommit and readOnly, including isolation, catalog/schema, warnings and vendor session state.", "Pool sizing is a queueing and database-capacity decision; more connections can reduce throughput by increasing contention."],
  },
  {
    id: "jdbc-contract-tests-proxy-double-real-database-matrix",
    title: "JDK proxy unit double과 실제 DB integration test를 계층화해 DAO·transaction contract를 검증합니다",
    lead: "unit double로 SQL·bind·affected-row·commit/rollback/close 순서를 빠르게 고정하고 실제 driver/database에서만 알 수 있는 conversion·constraint·isolation을 별도 검증합니다.",
    explanations: [
      "JDBC interface가 크다고 손으로 fake class 전체를 구현할 필요는 없습니다. JDK dynamic proxy InvocationHandler가 test에서 호출한 작은 method surface만 엄격히 허용할 수 있습니다.",
      "strict double은 예상하지 않은 method를 UnsupportedOperationException으로 실패시켜 production code의 call-shape drift를 빠르게 찾습니다.",
      "unit contract test는 SQL template, parameter index/type/value redaction, affected rows, commit/rollback, autoCommit restore와 statement close를 deterministic하게 검증합니다.",
      "mock/proxy가 SQL syntax, schema constraints, trigger, generated keys, timezone/charset, driver conversion, network, isolation/locks와 pool reset을 구현했다고 믿으면 안 됩니다.",
      "real integration test는 production과 같은 database version/driver 설정의 ephemeral schema에서 migrations를 적용하고 positive/negative/concurrent/fault cases를 실행합니다.",
      "test double에 production SQL parser나 database를 재구현하지 않습니다. application decision만 model하고 실제 DB contract는 integration layer가 소유합니다.",
      "credential은 CI secret에서 ephemeral database에만 주입하고 logs/artifacts에 redact합니다. developer machine의 실제 dbstudy credential을 재사용하지 않습니다.",
      "예제 Transfer DAO는 debit3 binds와 credit2 binds, exact rows1을 요구합니다. success는 statements2·commit·close2, second rows0은 rollback·SQLState02000·close2를 exact 검증합니다.",
    ],
    concepts: [
      { term: "test double", definition: "실제 dependency 대신 application interaction을 관찰·제어하는 fake, stub, spy, mock 등의 테스트 대역입니다.", detail: ["검증 범위를 명시합니다.", "DB semantics를 가장하지 않습니다."] },
      { term: "contract test", definition: "consumer가 의존하는 SQL/JDBC call·mapping·failure semantics를 provider implementation과 대조하는 테스트입니다.", detail: ["unit과 integration에 나눕니다.", "driver version을 고정합니다."] },
      { term: "ephemeral database", definition: "test run 동안만 격리 생성하고 migrations/fixtures를 적용한 뒤 폐기하는 실제 database instance/schema입니다.", detail: ["production dialect를 사용합니다.", "실제 데이터/credential은 사용하지 않습니다."] },
    ],
    codeExamples: [{
      id: "java-transfer-dao-contract-double",
      title: "debit/credit SQL·bind counts·affected rows와 commit/rollback/close를 strict proxies로 검증합니다",
      language: "java",
      filename: "TransferDaoContractDouble.java",
      purpose: "실제 DB 없이 service transaction과 DAO interaction contract의 성공·부분 실패 paths를 exact 검증합니다.",
      code: String.raw`import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class TransferDaoContractDouble {
    static final class StatementTrace implements InvocationHandler {
        final Map<Integer, Integer> binds = new LinkedHashMap<>();
        final int affected;
        boolean closed;
        StatementTrace(int affected) { this.affected = affected; }
        public Object invoke(Object proxy, Method method, Object[] args) {
            return switch (method.getName()) {
                case "setInt" -> { binds.put((Integer) args[0], (Integer) args[1]); yield null; }
                case "executeUpdate" -> affected;
                case "close" -> { closed = true; yield null; }
                default -> throw new UnsupportedOperationException(method.getName());
            };
        }
    }
    static final class Harness implements InvocationHandler {
        final ArrayDeque<Integer> rows;
        final List<String> sql = new ArrayList<>();
        final List<StatementTrace> statements = new ArrayList<>();
        boolean autoCommit = true;
        boolean committed;
        boolean rolledBack;
        Harness(Integer... rows) { this.rows = new ArrayDeque<>(List.of(rows)); }
        public Object invoke(Object proxy, Method method, Object[] args) {
            return switch (method.getName()) {
                case "getAutoCommit" -> autoCommit;
                case "setAutoCommit" -> { autoCommit = (Boolean) args[0]; yield null; }
                case "prepareStatement" -> {
                    sql.add((String) args[0]);
                    StatementTrace trace = new StatementTrace(rows.removeFirst());
                    statements.add(trace);
                    yield Proxy.newProxyInstance(PreparedStatement.class.getClassLoader(),
                        new Class<?>[]{PreparedStatement.class}, trace);
                }
                case "commit" -> { committed = true; yield null; }
                case "rollback" -> { rolledBack = true; yield null; }
                default -> throw new UnsupportedOperationException(method.getName());
            };
        }
        Connection connection() {
            return (Connection) Proxy.newProxyInstance(
                Connection.class.getClassLoader(), new Class<?>[]{Connection.class}, this);
        }
        int closedStatements() {
            return (int) statements.stream().filter(statement -> statement.closed).count();
        }
    }
    static void transfer(Connection connection, int from, int to, int amount) throws SQLException {
        boolean original = connection.getAutoCommit();
        connection.setAutoCommit(false);
        try {
            String debitSql = "update account set balance=balance-? where id=? and balance>=?";
            try (PreparedStatement debit = connection.prepareStatement(debitSql)) {
                debit.setInt(1, amount); debit.setInt(2, from); debit.setInt(3, amount);
                if (debit.executeUpdate() != 1) throw new SQLException("debit conflict", "02000");
            }
            String creditSql = "update account set balance=balance+? where id=?";
            try (PreparedStatement credit = connection.prepareStatement(creditSql)) {
                credit.setInt(1, amount); credit.setInt(2, to);
                if (credit.executeUpdate() != 1) throw new SQLException("credit missing", "02000");
            }
            connection.commit();
        } catch (SQLException failure) {
            connection.rollback();
            throw failure;
        } finally {
            connection.setAutoCommit(original);
        }
    }
    public static void main(String[] args) throws Exception {
        Harness success = new Harness(1, 1);
        transfer(success.connection(), 10, 20, 5);

        Harness failure = new Harness(1, 0);
        String failureState = "none";
        try {
            transfer(failure.connection(), 10, 20, 5);
        } catch (SQLException expected) {
            failureState = expected.getSQLState();
        }
        System.out.println("successCommitted=" + success.committed);
        System.out.println("successStatements=" + success.statements.size());
        System.out.println("successBindCounts=" + success.statements.get(0).binds.size()
            + "," + success.statements.get(1).binds.size());
        System.out.println("failureRolledBack=" + failure.rolledBack);
        System.out.println("failureState=" + failureState);
        System.out.println("closedStatements=" + success.closedStatements()
            + "," + failure.closedStatements());
    }
}`,
      walkthrough: [
        { lines: "1-11", explanation: "Connection/PreparedStatement proxies와 deterministic SQL/bind/row collections를 import합니다." },
        { lines: "14-27", explanation: "setInt·executeUpdate·close만 허용하는 strict statement trace를 정의합니다." },
        { lines: "28-57", explanation: "row results를 statement별 제공하고 SQL, commit/rollback, close counts를 모으는 Connection harness를 정의합니다." },
        { lines: "58-80", explanation: "한 transaction에서 debit3 binds·credit2 binds와 affected rows1을 요구하고 failure를 rollback합니다." },
        { lines: "81-91", explanation: "success1/1과 failure1/0 row fixtures를 실행해 SQLState를 capture합니다." },
        { lines: "92-100", explanation: "commit/statement/bind, rollback/state와 양쪽 close counts를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "strict JDK proxy Connection/PreparedStatement", "success rows1/1 and failure1/0", "no database", "-Xlint:all warning0"], command: isolatedJavaRun("TransferDaoContractDouble.java", "TransferDaoContractDouble") },
      output: { value: "successCommitted=true\nsuccessStatements=2\nsuccessBindCounts=3,2\nfailureRolledBack=true\nfailureState=02000\nclosedStatements=2,2", explanation: ["success는 두 statements와 expected bind counts 뒤 commit합니다.", "credit rows0은 SQLState02000으로 rollback됩니다.", "성공·실패 모두 prepared statements2를 닫습니다."] },
      experiments: [
        { change: "credit SQL에 syntax error를 넣습니다.", prediction: "proxy는 SQL parser가 없어 계속 통과할 수 있습니다.", result: "real production-dialect integration test가 반드시 필요합니다." },
        { change: "failure rows를0,1로 바꿉니다.", prediction: "debit에서 즉시 실패해 credit statement는 생성되지 않고 close count는1입니다.", result: "각 failure point별 expected call prefix를 검증합니다." },
        { change: "PreparedStatement close handler를 제거합니다.", prediction: "strict proxy가 unexpected close에서 실패하거나 closed count가0이 되어 resource regression을 잡습니다.", result: "unit contract에 lifecycle을 포함합니다." },
      ],
      sourceRefs: ["java-connection", "java-prepared-statement", "java-sql-exception", "java-proxy", "java-invocation-handler", "jdbc-spec-43", "testcontainers-jdbc", "mysql-connector-j-guide"],
    }],
    diagnostics: [
      { symptom: "모든 mock tests는 통과하지만 production SQL syntax가 실패한다.", likelyCause: "test double이 call shape만 검증하고 실제 dialect/parser/schema를 실행하지 않았습니다.", checks: ["integration test coverage를 봅니다.", "driver/DB versions를 비교합니다.", "migrations와 SQL을 ephemeral DB에 실행합니다."], fix: "production-compatible real database integration contract test를 추가합니다.", prevention: "unit double와 integration responsibility matrix를 유지합니다." },
      { symptom: "integration tests가 developer DB data에 따라 간헐 실패한다.", likelyCause: "공유/실제 database와 credential을 재사용해 fixture isolation·cleanup이 없습니다.", checks: ["connection target과 schema owner를 확인합니다.", "test run ids/transactions를 봅니다.", "parallel run collisions를 찾습니다."], fix: "run별 ephemeral schema/container와 deterministic migrations/fixtures를 사용합니다.", prevention: "actual/local DB 접속을 CI policy로 차단하고 owned cleanup을 검증합니다." },
    ],
    expertNotes: ["A strict proxy is valuable precisely because it models less: it verifies application interactions and fails unexpected calls instead of pretending to be a database.", "Use the same migration scripts and driver family in integration tests; otherwise schema and conversion drift can escape unit contracts."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...daoOperationsChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-class16-ex09", repository: "javastudy2 classstudy", path: "src/com/java/class16/Ex09_JDBC.java", usedFor: ["no-placeholder PreparedStatement SELECT", "ordinal ResultSet output", "unguarded manual close", "embedded connection literals"], evidence: "customer 전체 조회 PreparedStatement progression 원본입니다." },
  { id: "java-class16-ex11", repository: "javastudy2 classstudy", path: "src/com/java/class16/Ex11_JDBC.java", usedFor: ["custid placeholder", "setInt1", "Scanner validation", "embedded connection literals"], evidence: "입력 id를 value parameter로 분리한 SELECT 원본입니다." },
  { id: "java-class16-ex13", repository: "javastudy2 classstudy", path: "src/com/java/class16/Ex13_JDBC.java", usedFor: ["INSERT placeholders3", "setString1..3", "affected rows", "statement overwrite"], evidence: "insert 뒤 전체 SELECT를 수행하는 standalone CRUD 원본입니다." },
  { id: "java-class16-ex14", repository: "javastudy2 classstudy", path: "src/com/java/class16/Ex14_DAO.java", usedFor: ["singleton DAO", "CRUD methods5", "one try-with-resources", "manual close and overwrite", "embedded connection literals"], evidence: "DB access를 한 class로 모은 원본 DAO progression입니다." },
  { id: "java-class16-ex15", repository: "javastudy2 classstudy", path: "src/com/java/class16/Ex15_JDBC.java", usedFor: ["Ex14 caller closure", "menu validation", "DAO presentation coupling"], evidence: "Ex14 singleton CRUD를 호출하는 console runner입니다." },
  { id: "jdk21-javac", repository: "OpenJDK", path: "javac tool", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["--release21", "-proc:none", "-Xlint:all", "warning ownership"], evidence: "package/closure와 modern examples compiler 기준입니다." },
  { id: "powershell-environment", repository: "Microsoft Learn", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher snapshot", "hostile mode", "exact restore"], evidence: "audit environment 격리 근거입니다." },
  { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["ArgumentList", "redirected compile process", "working directory"], evidence: "shell interpolation 없는 javac 실행 근거입니다." },
  { id: "dotnet-process-environment", repository: ".NET API", path: "ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["remove launcher options from child"], evidence: "parent hostile options를 javac child에서 제거하는 근거입니다." },
  { id: "dotnet-process", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "process-tree termination", "dispose"], evidence: "bounded compile audit lifecycle 근거입니다." },
  { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["concurrent stdout/stderr drains"], evidence: "redirect pipe blockage 방지 근거입니다." },
  { id: "java-connection", repository: "Java SE 21 API", path: "java.sql.Connection", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html", usedFor: ["autoCommit", "commit/rollback", "savepoint", "isolation constants", "transaction state"], evidence: "JDBC transaction과 connection lifecycle의 중심 API 근거입니다." },
  { id: "java-prepared-statement", repository: "Java SE 21 API", path: "java.sql.PreparedStatement", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/PreparedStatement.html", usedFor: ["typed parameter binding", "executeQuery/update", "statement reuse", "close"], evidence: "parameterized SQL execution contract의 중심 근거입니다." },
  { id: "java-statement", repository: "Java SE 21 API", path: "java.sql.Statement", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html", usedFor: ["affected rows", "generated keys", "batch sentinel constants"], evidence: "DML result와 statement lifecycle 근거입니다." },
  { id: "java-result-set", repository: "Java SE 21 API", path: "java.sql.ResultSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/ResultSet.html", usedFor: ["label getters", "wasNull", "cursor/mapping lifecycle"], evidence: "DAO row mapping과 SQL NULL 판정 근거입니다." },
  { id: "java-jdbc-type", repository: "Java SE 21 API", path: "java.sql.JDBCType", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/JDBCType.html", usedFor: ["portable SQL type enum", "setNull trace"], evidence: "vendor type code를 standard name으로 해석하는 근거입니다." },
  { id: "java-types", repository: "Java SE 21 API", path: "java.sql.Types", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Types.html", usedFor: ["setNull VARCHAR code", "SQL type constants"], evidence: "typed NULL binding constant 근거입니다." },
  { id: "java-savepoint", repository: "Java SE 21 API", path: "java.sql.Savepoint", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Savepoint.html", usedFor: ["named savepoint", "rollback target", "release lifecycle"], evidence: "partial transaction marker contract 근거입니다." },
  { id: "java-database-metadata", repository: "Java SE 21 API", path: "java.sql.DatabaseMetaData", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/DatabaseMetaData.html", usedFor: ["supportsSavepoints", "driver/database capability checks"], evidence: "savepoint/transaction feature capability 검증 근거입니다." },
  { id: "java-sql-exception", repository: "Java SE 21 API", path: "java.sql.SQLException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLException.html", usedFor: ["SQLState", "vendor code", "cause/next exception", "transaction failures"], evidence: "JDBC failure evidence와 translation 근거입니다." },
  { id: "java-sql-integrity-exception", repository: "Java SE 21 API", path: "java.sql.SQLIntegrityConstraintViolationException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLIntegrityConstraintViolationException.html", usedFor: ["class23 constraint category", "typed exception comparison"], evidence: "integrity constraint violation subtype 근거입니다." },
  { id: "java-batch-update-exception", repository: "Java SE 21 API", path: "java.sql.BatchUpdateException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/BatchUpdateException.html", usedFor: ["partial batch counts", "chained failures", "affected-row caveat"], evidence: "batch DML failure/result inspection 근거입니다." },
  { id: "java-sql-feature-not-supported", repository: "Java SE 21 API", path: "java.sql.SQLFeatureNotSupportedException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLFeatureNotSupportedException.html", usedFor: ["fake DataSource unsupported credential overload", "capability signaling"], evidence: "선택 JDBC feature 미지원 typed failure 근거입니다." },
  { id: "java-data-source", repository: "Java SE 21 API", path: "javax.sql.DataSource", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/javax/sql/DataSource.html", usedFor: ["connection factory", "pool/container boundary", "login timeout"], evidence: "DriverManager 대신 DataSource acquisition abstraction 근거입니다." },
  { id: "java-wrapper", repository: "Java SE 21 API", path: "java.sql.Wrapper", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Wrapper.html", usedFor: ["DataSource unwrap/isWrapperFor contract"], evidence: "vendor/pool wrapper access의 표준 contract 근거입니다." },
  { id: "java-auto-closeable", repository: "Java SE 21 API", path: "java.lang.AutoCloseable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AutoCloseable.html", usedFor: ["try-with-resources", "close exception", "ownership"], evidence: "JDBC resources의 lexical cleanup 기반 근거입니다." },
  { id: "java-throwable", repository: "Java SE 21 API", path: "java.lang.Throwable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html", usedFor: ["addSuppressed/getSuppressed", "cause preservation"], evidence: "primary와 cleanup failure chain 보존 근거입니다." },
  { id: "java-proxy", repository: "Java SE 21 API", path: "java.lang.reflect.Proxy", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Proxy.html", usedFor: ["JDK-only JDBC test doubles", "interface proxy creation"], evidence: "driver 없는 strict Connection/Statement/ResultSet doubles 근거입니다." },
  { id: "java-invocation-handler", repository: "Java SE 21 API", path: "java.lang.reflect.InvocationHandler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/InvocationHandler.html", usedFor: ["method call interception", "strict event traces"], evidence: "proxy call behavior와 observation 근거입니다." },
  { id: "java-locale", repository: "Java SE 21 API", path: "java.util.Locale", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Locale.html", usedFor: ["Locale.ROOT identifier normalization"], evidence: "locale-independent allowlist token normalization 근거입니다." },
  { id: "java-map-api", repository: "Java SE 21 API", path: "java.util.Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["finite identifier allowlist", "ordered bind/row model"], evidence: "trusted token mapping과 trace collections 근거입니다." },
  { id: "jdbc-spec-43", repository: "Java Community Process", path: "JDBC 4.3 Specification", publicUrl: "https://download.oracle.com/otndocs/jcp/jdbc-4_3-mrel3-spec/index.html", usedFor: ["JDBC connection/statement/result contracts", "transactions", "DataSource", "exception semantics"], evidence: "JDBC4.3 normative specification 근거입니다." },
  { id: "oracle-jdbc-transactions", repository: "Oracle Java Tutorials", path: "Using Transactions", publicUrl: "https://docs.oracle.com/javase/tutorial/jdbc/basics/transactions.html", usedFor: ["auto-commit", "commit/rollback", "savepoints", "transaction isolation"], evidence: "JDBC transaction workflow의 official tutorial 근거입니다." },
  { id: "oracle-jdbc-retrieving", repository: "Oracle Java Tutorials", path: "Retrieving and Modifying Values from Result Sets", publicUrl: "https://docs.oracle.com/javase/tutorial/jdbc/basics/retrieving.html", usedFor: ["ResultSet getters", "cursor and column labels", "NULL retrieval"], evidence: "row retrieval/mapping progression 근거입니다." },
  { id: "oracle-jdbc-updates", repository: "Oracle Java Tutorials", path: "Processing SQL Statements with JDBC", publicUrl: "https://docs.oracle.com/javase/tutorial/jdbc/basics/processingsqlstatements.html", usedFor: ["executeUpdate", "statement result processing", "affected counts"], evidence: "query/update execution shape의 official tutorial 근거입니다." },
  { id: "owasp-sql-injection-prevention", repository: "OWASP Cheat Sheet Series", path: "SQL Injection Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html", usedFor: ["prepared statements", "allowlist input validation", "least privilege"], evidence: "SQL injection 방지 통제의 primary security guidance입니다." },
  { id: "owasp-secrets-management", repository: "OWASP Cheat Sheet Series", path: "Secrets Management Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html", usedFor: ["credential externalization", "rotation", "logging redaction"], evidence: "원본 hard-coded connection literals 교정 근거입니다." },
  { id: "owasp-logging-cheat-sheet", repository: "OWASP Cheat Sheet Series", path: "Logging Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["exclude secrets/PII", "safe SQL diagnostics", "correlation"], evidence: "JDBC error/bind logging의 public-safe 기준입니다." },
  { id: "cwe-89", repository: "MITRE CWE", path: "CWE-89 SQL Injection", publicUrl: "https://cwe.mitre.org/data/definitions/89.html", usedFor: ["injection weakness model", "data flow and mitigations"], evidence: "SQL command structure에 input이 들어가는 weakness 정의 근거입니다." },
  { id: "mysql-autocommit", repository: "MySQL 8.4 Reference Manual", path: "InnoDB Transaction Model / autocommit", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-autocommit-commit-rollback.html", usedFor: ["MySQL autocommit", "commit/rollback behavior"], evidence: "원본 MySQL target의 transaction default/commands 근거입니다." },
  { id: "mysql-isolation", repository: "MySQL 8.4 Reference Manual", path: "Transaction Isolation Levels", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html", usedFor: ["InnoDB isolation", "consistent/locking reads", "anomaly caveats"], evidence: "production-dialect isolation behavior 재검증 근거입니다." },
  { id: "mysql-innodb-locking", repository: "MySQL 8.4 Reference Manual", path: "InnoDB Locking", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html", usedFor: ["record/gap/next-key locks", "deadlock/contention analysis"], evidence: "MySQL lock implementation 차이와 integration test 근거입니다." },
  { id: "mysql-savepoint", repository: "MySQL 8.4 Reference Manual", path: "SAVEPOINT, ROLLBACK TO SAVEPOINT, RELEASE SAVEPOINT", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/savepoint.html", usedFor: ["savepoint semantics", "partial rollback", "release"], evidence: "원본 MySQL target의 savepoint dialect 근거입니다." },
  { id: "mysql-connector-j-guide", repository: "MySQL Connector/J Developer Guide", path: "Connector/J", publicUrl: "https://dev.mysql.com/doc/connector-j/en/", usedFor: ["driver configuration", "affected-row/type conversion", "production integration matrix"], evidence: "실제 MySQL JDBC driver contract 재검증 근거입니다." },
  { id: "hikaricp-readme", repository: "HikariCP", path: "README", publicUrl: "https://github.com/brettwooldridge/HikariCP#essentials", usedFor: ["pool sizing/configuration", "timeouts", "leak detection", "connection lifecycle"], evidence: "널리 쓰이는 JDBC pool의 project-owned 운영 지침입니다." },
  { id: "testcontainers-jdbc", repository: "Testcontainers for Java", path: "JDBC support", publicUrl: "https://java.testcontainers.org/modules/databases/jdbc/", usedFor: ["ephemeral real database integration", "driver/dialect contract tests"], evidence: "격리된 실제 DB test infrastructure의 project-owned guide입니다." },
);

(session.sourceCoverage.uncoveredNotes as string[]).push(
  "원본 static audit1과 JDK-only warning0 examples11로 DB·credential side effect 없이 모든 실행 evidence를 재현합니다.",
  "proxy/fake examples는 application call contract만 검증하며 실제 SQL syntax·driver conversion·constraint·isolation·pool reset은 ephemeral production-dialect integration test로 별도 소유합니다.",
  "원본 credential literal의 값·hash·host는 학습 사이트와 검증 stdout 어디에도 복제하지 않고 count/redacted remediation만 기록합니다.",
  "PreparedStatement가 막는 value injection과 dynamic identifier allowlist, transaction/DAO/pool boundary를 하나의 progression으로 연결했습니다.",
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "PreparedStatement parameter index는0부터 시작하나요?", answer: "아닙니다. JDBC parameter index는1부터 시작하며 SQL marker 순서와 setter index/type이 맞아야 합니다." },
  { question: "`?`로 table이나 column 이름을 바인딩할 수 있나요?", answer: "일반적으로 아닙니다. marker는 value 위치용이며 identifier/keyword는 finite allowlist로 trusted literal에 매핑합니다." },
  { question: "모든 값을 setString으로 보내도 되나요?", answer: "암묵 변환에 의존하므로 schema에 맞는 typed setter 또는 명시 SQLType을 사용하는 편이 안정적입니다." },
  { question: "SQL NULL과 문자열 null은 같은가요?", answer: "아닙니다. SQL NULL은 absence/unknown marker이고 문자열 null은 네 글자 text입니다." },
  { question: "PreparedStatement를 재사용할 때 무엇을 주의하나요?", answer: "이전 parameter가 남을 수 있으므로 모든 markers를 다시 설정하거나 clearParameters contract를 사용하고 resource lifecycle을 지킵니다." },
  { question: "PreparedStatement가 SQL injection을 어떻게 줄이나요?", answer: "SQL structure와 values를 protocol상 분리해 value 속 quote/operator/comment가 SQL code로 해석되지 않게 합니다." },
  { question: "parameter binding이면 input validation이 필요 없나요?", answer: "아닙니다. 길이·형식·업무 허용값·authorization과 output/resource limits는 여전히 필요합니다." },
  { question: "LIKE의 `%`는 SQL injection인가요?", answer: "그 자체는 pattern wildcard semantics이며 literal 검색 요구라면 별도 escaping contract가 필요합니다." },
  { question: "동적 ORDER BY를 안전하게 만드는 기본 pattern은 무엇인가요?", answer: "외부 token을 enum/map allowlist의 application-owned column/direction literals로 변환하고 unknown을 거부합니다." },
  { question: "identifier를 quote하면 allowlist가 필요 없나요?", answer: "아닙니다. quoting은 dialect syntax 처리이고 arbitrary identifier 선택과 authorization을 제한하지 않습니다." },
  { question: "executeUpdate 반환값은 무엇인가요?", answer: "DML이 영향을 준 것으로 driver가 보고한 row count이며 operation별 expected cardinality와 비교해야 합니다." },
  { question: "id UPDATE에서 affected rows2를 성공으로 봐도 되나요?", answer: "보통 아닙니다. exactly-one invariant 위반으로 rollback하고 query/schema uniqueness를 조사해야 합니다." },
  { question: "affected rows0은 항상 not-found인가요?", answer: "아닙니다. no-op reporting, optimistic version conflict 등 driver/SQL contract에 따라 의미가 달라질 수 있습니다." },
  { question: "generated key를 어떻게 요청하나요?", answer: "statement 생성 시 RETURN_GENERATED_KEYS를 요청하고 getGeneratedKeys에서 expected count/type/range를 검증합니다." },
  { question: "JDBC Connection의 auto-commit은 어떤 의미인가요?", answer: "각 statement를 개별 transaction으로 자동 commit하는 mode이며 multi-step 업무에서는 보통 false로 전환합니다." },
  { question: "transaction boundary는 DAO method마다 잡나요?", answer: "업무상 함께 성공/실패해야 하는 invariant 단위로 service/use-case owner가 잡습니다." },
  { question: "두 DAO가 서로 다른 Connection을 쓰면 한 transaction인가요?", answer: "아닙니다. 동일 database transaction에 참여하려면 같은 Connection/transaction context를 공유해야 합니다." },
  { question: "rollback 중에도 exception이 나면 무엇을 하나요?", answer: "원래 failure를 primary로 유지하고 rollback failure를 suppressed로 추가합니다." },
  { question: "commit SQLException은 확실한 rollback을 의미하나요?", answer: "아닙니다. response loss 등으로 server commit 여부를 모르는 unknown outcome일 수 있습니다." },
  { question: "setAutoCommit(true)는 단순 state reset인가요?", answer: "현재 transaction을 commit할 수 있으므로 outcome/driver contract를 이해하고 owner가 조심스럽게 복구해야 합니다." },
  { question: "Savepoint는 nested transaction인가요?", answer: "아닙니다. 한 outer transaction 내부의 부분 rollback 지점이며 독립 commit이 없습니다." },
  { question: "rollback(savepoint)가 외부 API 호출도 되돌리나요?", answer: "아닙니다. JDBC database changes만 대상으로 하므로 외부 side effect는 outbox/idempotency가 필요합니다." },
  { question: "savepoint rollback 뒤 모든 lock이 해제되나요?", answer: "database/engine에 따라 transaction 종료까지 일부 locks가 남을 수 있으므로 실제 DB에서 검증합니다." },
  { question: "READ_COMMITTED가 막는 대표 anomaly는 무엇인가요?", answer: "dirty read는 막지만 같은 row 재조회가 달라지는 non-repeatable read 등은 가능할 수 있습니다." },
  { question: "REPEATABLE_READ면 lost update가 항상 사라지나요?", answer: "아닙니다. database 구현과 access pattern에 따라 다르므로 version predicate/locking과 integration evidence가 필요합니다." },
  { question: "optimistic locking conflict는 어떻게 드러나나요?", answer: "version 조건 UPDATE의 affected rows0으로 드러나며 재계산·bounded retry 또는 caller conflict로 처리합니다." },
  { question: "어떤 SQLException을 retry해야 하나요?", answer: "replay-safe operation에서만 검증된 SQLState/vendor transient allowlist를 bounded backoff+jitter로 retry합니다." },
  { question: "DAO의 핵심 책임은 무엇인가요?", answer: "SQL template, binding, ResultSet→domain mapping과 persistence exception translation을 캡슐화하는 것입니다." },
  { question: "DAO가 println만 하면 무엇이 문제인가요?", answer: "caller가 empty/not-found/data를 구조화하거나 transaction/use case에 조합하고 테스트하기 어렵습니다." },
  { question: "SELECT *와 ordinal getter가 취약한 이유는 무엇인가요?", answer: "physical column order 변화에 Java fields가 결합돼 잘못된 mapping이 생길 수 있습니다." },
  { question: "getInt가 SQL NULL을 읽으면 어떻게 되나요?", answer: "0을 반환할 수 있으므로 직후 wasNull 또는 typed getObject로 실제 NULL을 구분합니다." },
  { question: "column label이면 join에서 항상 안전한가요?", answer: "아닙니다. duplicate labels가 생길 수 있어 명시적인 unique aliases를 사용해야 합니다." },
  { question: "try-with-resources의 close 순서는 무엇인가요?", answer: "resource declaration의 역순이며 ResultSet→Statement→Connection ownership에 맞게 중첩합니다." },
  { question: "body와 close가 모두 실패하면 어느 것이 primary인가요?", answer: "body exception이 primary이고 close exceptions는 suppressed로 연결됩니다." },
  { question: "SQLState만으로 모든 DB 오류를 완벽히 분류할 수 있나요?", answer: "아닙니다. portable starting point이며 vendor code, operation phase, cause와 idempotency를 함께 봅니다." },
  { question: "DataSource를 쓰는 이유는 무엇인가요?", answer: "connection acquisition/config/credential과 pooling lifecycle을 application SQL code에서 분리하기 위해서입니다." },
  { question: "pooled Connection.close는 무엇을 뜻하나요?", answer: "대개 physical 연결 종료가 아니라 logical handle을 pool에 반환하는 뜻이지만 borrower는 반드시 close해야 합니다." },
  { question: "pool 반환 시 어떤 state를 reset하나요?", answer: "rollback outcome, autoCommit, readOnly, isolation, catalog/schema, warnings와 vendor session state를 검토합니다." },
  { question: "JDK proxy test가 실제 DB integration test를 대체하나요?", answer: "아닙니다. proxy는 call shape만 검증하고 syntax·constraint·conversion·isolation은 실제 production-dialect DB가 필요합니다." },
  { question: "ephemeral DB test에서 실제 developer credential을 써도 되나요?", answer: "아닙니다. run별 격리 secret/schema를 사용하고 local/production target 접속을 policy로 차단합니다." },
);

(session.completionChecklist as string[]).push(
  "모든 SQL template을 고정 구조로 정의했다.", "parameter indices가1부터 연속이다.",
  "placeholder count와 bind count가 일치한다.", "schema에 맞는 typed setters를 사용한다.",
  "SQL NULL과 empty/literal-null을 구분했다.", "statement 재사용 시 모든 binds를 초기화한다.",
  "value를 SQL text에 concatenation하지 않았다.", "PreparedStatement 인자까지 taint flow를 검토했다.",
  "LIKE wildcard/escape contract를 정의했다.", "SQL logs에서 values와 secrets를 redact했다.",
  "dynamic table/column/direction을 inventory했다.", "identifier를 finite allowlist로 매핑했다.",
  "unknown structural token을 fail closed한다.", "stable pagination tie-breaker를 포함했다.",
  "각 DML의 expected affected rows를 정의했다.", "affected0의 not-found/conflict 의미를 구분했다.",
  "affected many를 invariant violation으로 rollback한다.", "driver affected-row semantics를 integration test했다.",
  "generated key count/type/range를 검증한다.", "batch sentinel/partial results를 처리한다.",
  "업무 transaction owner가 한 곳이다.", "participating DAOs가 같은 Connection을 공유한다.",
  "원래 autoCommit state를 기록했다.", "모든 validation 뒤에만 commit한다.",
  "모든 failure path에서 rollback한다.", "rollback failure를 suppressed로 보존한다.",
  "restore failure도 primary chain에 보존한다.", "commit unknown outcome을 별도 처리한다.",
  "retry 전에 idempotency/replay safety를 검증한다.", "retry 횟수·시간·backoff·jitter를 제한한다.",
  "savepoint 사용의 업무 허용성을 확인했다.", "savepoint를 nested commit으로 오해하지 않았다.",
  "partial rollback 뒤 fallback outcome을 공개한다.", "savepoint driver/DB support를 검증했다.",
  "필요한 isolation level을 anomaly로 선택했다.", "production engine의 MVCC/lock behavior를 테스트했다.",
  "optimistic UPDATE에 version predicate가 있다.", "rows0 version conflict를 typed result로 처리한다.",
  "DAO가 console/UI 출력에 결합되지 않는다.", "DAO가 domain/Optional/List result를 반환한다.",
  "SELECT column list와 unique aliases를 명시했다.", "ResultSet을 label로 mapping한다.",
  "primitive getter 뒤 wasNull을 확인한다.", "domain required/range invariants를 mapping에서 검증한다.",
  "ResultSet·Statement·Connection을 역순 close한다.", "statement variable overwrite leak이 없다.",
  "SQLException cause/SQLState/vendor code를 보존한다.", "nextException과 suppressed를 검사한다.",
  "public errors에 SQL/binds/credentials를 넣지 않는다.", "source credential literals를 제거·rotation했다.",
  "DataSource에서 lexical scope로 connection을 빌린다.", "logical Connection을 field에 캐시하지 않는다.",
  "pool 반환 전 transaction/state reset을 검증한다.", "pool active/idle/pending/leak metrics를 운영한다.",
  "pool size를 DB capacity로 산정했다.", "connection acquisition timeout/backpressure가 있다.",
  "strict proxy unit contract tests가 있다.", "production-dialect ephemeral DB tests가 있다.",
  "migrations와 driver versions를 test에 고정했다.", "실제/local DB 미접속 정책과 owned cleanup을 검증했다.",
);
