import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); if (Test-Path -LiteralPath $root) { throw \"unexpected temp collision\" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root \"classes\"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw (\"javac failed or warned: \" + ($compiler -join [Environment]::NewLine)) }; Push-Location $root; try { & java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\"; if ($LASTEXITCODE -ne 0) { throw \"java failed\" } } finally { Pop-Location } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw \"unsafe cleanup\" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw \"cleanup failed\" } } }'";

const session = {
  schemaVersion: 2,
  inventoryIds: ["jdbc-01-connection-resultset"],
  slug: "jdbc-01-connection-resultset",
  courseId: "java",
  moduleId: "java-systems",
  order: 39,
  title: "JDBC Connection·Statement·ResultSet",
  subtitle: "실제 DB 없이도 driver 선택부터 cursor·metadata·영향 행·예외·pool 반환까지 JDBC 계약을 JDK-only fake로 검증합니다.",
  level: "고급",
  estimatedMinutes: 1080,
  coreQuestion: "JDBC 연결과 SQL 실행 결과를 자격 증명 유출·cursor 오용·resource leak·모호한 실패 없이 어떻게 읽고 종료할까요?",
  summary: "원본 class16의 direct4 Ex03·Ex04·Ex06·Ex08을 읽습니다. 네 파일은 별도 companion 없이 closure4로 warning0 compile되며 main4개입니다. class16 package15에는 main14개와 net-01 소유 URL(String) deprecation warning2가 있지만 JDBC direct에는 warning이 없습니다. 실제 main은 실행하지 않고 MySQL driver를 load하거나 localhost database에 연결하지 않습니다. 대신 byte-identical owned temp copy4의 compile/hash, DriverManager calls4, Statement/ResultSet3, query3·update2·next3, label getters4·index getters8, close9·null guard6, broad catch4·empty catch1과 embedded URL/user/password literals 각4를 값 비출력 형태로 두 launcher modes에서 감사합니다. 현대 장은 custom Driver와 dynamic proxy로 만든 JDK-only fake JDBC를 사용해 driver discovery, redacted configuration, ResultSet before-first cursor, SQL NULL과 wasNull, metadata/label mapping, executeUpdate 영향 행, execute의 result kind, try-with-resources 역순 close·suppressed failure, SQLException SQLState chain, DataSource pool의 logical close, read-only·network/query timeout·fetch/max-row 운영 경계를 실제 java.sql interfaces로 검증합니다.",
  objectives: [
    "Driver·DriverManager·DataSource·Connection의 책임과 실제 driver dependency 경계를 구분한다.",
    "접속 URL·계정·비밀번호를 source/log/exception에서 분리하고 fail-fast configuration을 만든다.",
    "Statement의 executeQuery·executeUpdate·execute가 반환하는 서로 다른 result contract를 적용한다.",
    "ResultSet의 before-first cursor와 next·getter·SQL NULL·wasNull 규칙을 설명한다.",
    "column index·name·label·metadata와 Java type mapping을 schema drift 관점에서 다룬다.",
    "try-with-resources의 acquisition·reverse close·primary/suppressed failure를 JDBC ownership에 적용한다.",
    "SQLException의 SQLState·vendor code·next exception·transient taxonomy를 안전한 진단 record로 바꾼다.",
    "pool의 Connection.close가 logical return이라는 경계와 timeout/read-only/row limit 운영 설정을 설계한다.",
  ],
  prerequisites: [
    { title: "finally·throws와 try-with-resources", reason: "Connection→Statement→ResultSet ownership과 suppressed close failure를 손실 없이 다루는 데 필요합니다.", sessionSlug: "core-03-finally-throws" },
    { title: "파일·바이트 자원 경계", reason: "외부 resource의 open/use/close, timeout, partial failure와 ownership 사고방식을 JDBC에 재사용합니다.", sessionSlug: "io-01-file-bytes" },
  ],
  keywords: ["JDBC", "Driver", "DriverManager", "DataSource", "Connection", "Statement", "ResultSet", "cursor", "executeQuery", "executeUpdate", "execute", "affected rows", "ResultSetMetaData", "column label", "SQL NULL", "wasNull", "try-with-resources", "SQLException", "SQLState", "vendor code", "connection pool", "logical close", "query timeout", "network timeout", "read only", "fetch size", "max rows", "secret redaction"],
  chapters: [],
  lab: {
    title: "실제 DB 없이 검증하는 bounded customer read gateway",
    scenario: "운영 database에 접속하기 전에 JDK-only fake DataSource로 connection borrow부터 row mapping·failure·return까지 계약 테스트를 완성합니다.",
    setup: ["success rows, empty rows, SQL NULL, schema label drift, query timeout, connection failure와 close failure fixtures를 준비합니다.", "URL/user/password는 test secret provider에서 주입하고 public evidence에는 존재 여부·redaction만 남깁니다.", "DataSource→Connection→Statement→ResultSet 호출과 close 순서를 기록하는 fake를 만듭니다."],
    steps: ["configuration required keys와 allowed JDBC scheme을 검증합니다.", "DataSource에서 connection을 borrow하고 readOnly·network timeout을 적용합니다.", "고정 SQL에 Statement queryTimeout·fetchSize·maxRows를 설정합니다.", "executeQuery 뒤 while(rs.next()) 안에서 label 기반으로 immutable row DTO를 만듭니다.", "getObject target type과 wasNull로 SQL NULL 정책을 적용합니다.", "metadata label/type/count가 기대 schema인지 fail-fast 검증합니다.", "empty result와 missing row를 정상 도메인 결과로 분류합니다.", "SQLException을 SQLState class·vendor code·transient flag로 redacted record에 변환합니다.", "try-with-resources로 ResultSet→Statement→Connection logical close를 보장합니다.", "pool borrow/return count, terminal outcome, row count와 no-secret log를 acceptance evidence로 확인합니다."],
    expectedResult: ["DB network 없이 모든 success/failure fixture가 warning0·exact output으로 재현됩니다.", "cursor·NULL·schema drift가 silent default가 아니라 typed outcome으로 처리됩니다.", "모든 경로에서 logical connection이 pool에 반환되고 close failure도 suppressed evidence로 남습니다.", "공개 log와 문서 어디에도 실제 credential·raw SQL parameter·row PII가 나타나지 않습니다."],
    cleanup: ["test DataSource를 닫고 borrowed logical connection0을 확인합니다.", "owned fake state와 temp compile outputs만 제거합니다.", "credential fixture reference를 폐기하고 public evidence에는 redacted digest/count만 남깁니다."],
    extensions: ["Testcontainers 같은 격리 DB 통합 테스트는 별도 private CI에서 schema migration과 함께 실행합니다.", "PreparedStatement binding·transaction·DAO는 jdbc-02로 이어갑니다.", "pool metrics(active/idle/pending/timeout)와 slow-query threshold를 운영 dashboard에 추가합니다.", "driver별 SQLState/vendor behavior matrix를 official test database에서 갱신합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "JDK dynamic proxy ResultSet으로 before-first·next·label getter·empty result를 테스트하세요.", requirements: ["next 전 getter는 SQLState24000으로 실패합니다.", "두 rows를 label로 읽고 immutable DTO로 만듭니다.", "next false 뒤 getter도 실패합니다.", "ResultSet close와 Statement close를 separately assert합니다."], hints: ["cursor를 row index가 아니라 position state로 모델링합니다.", "출력 순서가 아닌 rows와 close flags를 main에서 만듭니다."], expectedOutcome: "실제 DB 없이 ResultSet cursor contract를 exact 재현합니다.", solutionOutline: ["InvocationHandler가 next/get/close만 구현합니다.", "나머지 method는 SQLFeatureNotSupportedException으로 fail-fast합니다."] },
    { difficulty: "응용", prompt: "DataSource 기반 read gateway에 metadata·NULL·timeout·redacted SQLException을 추가하세요.", requirements: ["Connection/Statement/ResultSet을 try-with-resources로 소유합니다.", "column labels·JDBC types를 실행 전에 검증합니다.", "queryTimeout·maxRows와 network timeout을 설정합니다.", "SQL NULL은 primitive default와 구분합니다.", "SQLState/vendor/transient만 공개 error에 남깁니다."], hints: ["ResultSetMetaData.getColumnLabel을 우선합니다.", "getObject(label, Type.class)가 driver에서 지원되는지 integration test로 확인합니다."], expectedOutcome: "schema drift와 database failure가 safe typed result로 귀결되는 bounded reader가 완성됩니다.", solutionOutline: ["configure→execute→validate schema→map→close→classify 흐름을 분리합니다.", "negative fixtures를 표로 만듭니다."] },
    { difficulty: "설계", prompt: "production connection pool과 read workload의 capacity·timeout·관측성 runbook을 작성하세요.", requirements: ["pool ownership과 application shutdown order를 그립니다.", "connection/query/transaction/request timeout budget을 계층화합니다.", "active/idle/pending/acquire-timeout/leak metrics threshold를 둡니다.", "credential rotation·TLS·least privilege를 포함합니다.", "SQLState class별 retry/never-retry 정책을 명시합니다.", "pool exhaustion·database failover·slow query·close failure drills를 설계합니다."], hints: ["pool size는 thread 수와 같다는 공식이 아닙니다.", "retry는 idempotency와 total deadline 안에서만 합니다."], expectedOutcome: "부하·장애·rotation 중에도 secret과 connection을 유실하지 않는 운영 설계가 완성됩니다.", solutionOutline: ["request→pool→driver→DB resource 흐름과 queues를 표시합니다.", "각 failure에 owner·deadline·metric·safe response를 연결합니다."] },
  ],
  reviewQuestions: [],
  completionChecklist: [],
  nextSessions: ["jdbc-02-prepared-transaction-dao"],
  sources: [],
  sourceCoverage: {
    filesRead: 4,
    filesUsed: 4,
    uncoveredNotes: [
      "direct4는 서로 source dependency가 없는 independent mains이므로 complementary source 없이 closure4가 warning0 compile됩니다.",
      "Ex05 single-row select와 Ex07 delete는 curriculum inventory 밖이며 각각 Ex04 cursor와 jdbc-02 write 주제에 중복되어 sourceCoverage에 포함하지 않습니다.",
      "class16 package15 warning2는 Ex01/02 URL(String) deprecation으로 net-01 소유이며 JDBC direct4 warning0와 분리해 기록합니다.",
      "원본에 포함된 connection/user/password literal values와 row PII는 공개 세션에 복사하지 않고 존재 개수와 개선 방향만 남깁니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const originalAuditChapter: DetailedSession["chapters"][number] = {
  id: "class16-jdbc-direct4-no-connect-audit",
  title: "class16 package15·direct/closure4를 DB 접속 없이 compile·shape·secret hygiene로 감사합니다",
  lead: "MySQL driver를 load하거나 network를 열지 않고 source read·warning evidence·byte-identical relocation과 credential literal count만 수집합니다.",
  explanations: [
    "인벤토리 direct4는 Ex03 connection, Ex04 select, Ex06 insert 후 select, Ex08 update 후 select입니다. 모두 java.sql types만 import하고 vendor driver는 문자열로 load하므로 external JAR 없이 compile됩니다.",
    "direct4 각 class가 독립 main이고 서로를 참조하지 않아 closure도4 files입니다. direct와 byte-identical relocated copy는 OpenJDK21 --release21 -Xlint:all에서 compiler output0입니다.",
    "class16 package는15 files·public mains14이며 warnings2입니다. 두 warning은 net-01 Ex01/02의 deprecated URL(String) constructor에서 나므로 JDBC direct warning과 섞지 않습니다.",
    "원본에는 DriverManager.getConnection4, Class.forName3, Connection declarations4, Statement/ResultSet declarations3씩 있습니다. Ex03은 JDBC4 auto-loading path를 기대하고 나머지 세 파일은 vendor driver class를 명시 load합니다.",
    "select path는 executeQuery3·next loops3이며 Ex04는 labels4, Ex06/08은 indexes8로 읽습니다. ResultSet cursor는 before-first라 next 성공 안에서만 getters를 호출해야 합니다.",
    "write path는 executeUpdate2로 insert와 update 영향 행을 받고 result>0일 때 select합니다. 영향 행0은 exception이 아니라 matching row 없음일 수 있습니다.",
    "close calls9와 null guards6이 있으나 Ex03은 connection acquisition failure 뒤 conn.close에서 NullPointerException이 날 수 있고 Ex04는 ResultSet을 명시 close하지 않으며 stmt/conn null도 검사하지 않습니다.",
    "Ex06은 finally close exception을 완전히 삼키는 empty catch1을 포함합니다. Ex03/04/08은 cleanup exception이 body failure를 덮을 수 있어 try-with-resources의 suppressed model로 개선해야 합니다.",
    "direct4에는 JDBC URL·user·password source literals가 각각4개이고 environment lookup은0입니다. literal values는 audit output·설명·예제 어디에도 복사하지 않고 counts만 검증합니다.",
    "세 URL은 transport 검증을 끄는 option과 public-key retrieval 허용 option을 포함합니다. 개발 편의 flag를 production 보안 설정으로 복사하지 말고 TLS·server identity·driver 문서를 기준으로 구성합니다.",
    "감사기는 원본 mains를 절대 실행하지 않습니다. 따라서 vendor class loading0, DriverManager call execution0, socket0, database mutation0이며 original files는 read-only입니다.",
    "baseline/hostile launcher modes에서 javac child의 option variables4를 제거하고 hash4가 같은 owned temp copy만 relocated compile합니다. parent variables와 temp ownership은 finally에서 복원합니다.",
  ],
  concepts: [
    { term: "compile-only evidence", definition: "외부 side effect가 있는 main을 실행하지 않고 type·warning·source shape만 검증하는 감사 경계입니다.", detail: ["driver class를 load하지 않습니다.", "database network를 열지 않습니다."] },
    { term: "credential hygiene", definition: "secret value를 source·log·exception·artifact에서 제거하고 authorized provider로 짧게 주입하는 규칙입니다.", detail: ["존재 여부만 공개할 수 있습니다.", "rotation과 least privilege를 포함합니다."] },
    { term: "transparent closure", definition: "direct inventory가 독립 compile되는지 확인하고 필요한 companion이 있으면 별도로 공개하는 source 경계입니다.", detail: ["이 세션은 direct=closure4입니다.", "package15와 구분합니다."] },
  ],
  codeExamples: [{
    id: "powershell-original-jdbc01-audit",
    title: "원본 main을 실행하지 않고 package/direct/relocated compile과 안전 shape만 검증합니다",
    language: "powershell",
    filename: "verify-original-jdbc01.ps1",
    purpose: "실제 credential·driver·database를 건드리지 않고 warning, hash, JDBC calls, SQL/result/cleanup/secret-literal counts를 재현합니다.",
    code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$optionNames=@('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS')
$saved=@{}
foreach($name in $optionNames){
  $item=Get-Item -LiteralPath ("Env:"+$name) -ErrorAction SilentlyContinue
  $saved[$name]=@{Exists=$null-ne$item;Value=if($item){$item.Value}else{$null}}
}
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
$root=Join-Path $base ("jdbc01 audit "+[Guid]::NewGuid().ToString('N'))
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
    if(-not$process.WaitForExit(10000)){
      $process.Kill($true);if(-not$process.WaitForExit(5000)){throw 'termination grace exceeded'}
      [void]$outTask.GetAwaiter().GetResult();[void]$errTask.GetAwaiter().GetResult();throw 'child timeout'
    }
    return @{Exit=$process.ExitCode;Out=(Normalize $outTask.GetAwaiter().GetResult());Err=(Normalize $errTask.GetAwaiter().GetResult())}
  }finally{$process.Dispose()}
}
function Javac-Args([IO.FileInfo[]]$files,[string]$classes){
  return @('-J-Duser.language=en','-J-Duser.country=US','-encoding','UTF-8','--release','21','-proc:none','-Xlint:all','-XDrawDiagnostics','-d',$classes)+@($files.FullName)
}
function Compile-Clean([IO.FileInfo[]]$files,[string]$classes){
  New-Item -ItemType Directory -Path $classes -ErrorAction Stop|Out-Null
  $result=Invoke-Child 'javac' (Javac-Args $files $classes) $root
  if($result.Exit-ne0-or$result.Out.Length-ne0-or$result.Err.Length-ne0){throw 'warning0 compile drift'}
}
function Compile-Package([IO.FileInfo[]]$files,[string]$classes){
  New-Item -ItemType Directory -Path $classes -ErrorAction Stop|Out-Null
  $result=Invoke-Child 'javac' (Javac-Args $files $classes) $root
  $lines=@($result.Err.TrimEnd([char]10).Split([char]10))
  if($result.Exit-ne0-or$result.Out.Length-ne0-or$lines.Count-ne3){throw 'package compile drift'}
  if(@($lines|Where-Object{$_-match'compiler\.warn\.has\.been\.deprecated'}).Count-ne2-or$lines[-1]-cne'2 warnings'){throw 'package warning drift'}
}
function Remove-JavaComments([string]$text){return [regex]::Replace(([regex]::Replace($text,'(?s)/\*.*?\*/','')),'(?m)//.*$','')}
function Count([string]$text,[string]$pattern){return ([regex]::Matches($text,$pattern,[Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count}
function Audit([string]$mode,[string]$class16){
  if($mode-eq'hostile'){
    $env:JDK_JAVAC_OPTIONS='-J-Djdbc01.audit=javac';$env:JDK_JAVA_OPTIONS='-Djdbc01.audit=java'
    $env:JAVA_TOOL_OPTIONS='-Djdbc01.audit=tool';$env:_JAVA_OPTIONS='-Djdbc01.audit=legacy'
  }else{foreach($name in $optionNames){Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue}}
  $package=@(Get-ChildItem -LiteralPath $class16 -Filter '*.java'|Sort-Object Name)
  $names=@('Ex03_JDBC.java','Ex04_JDBC.java','Ex06_JDBC.java','Ex08_JDBC.java')
  $direct=@($names|ForEach-Object{Get-Item -LiteralPath (Join-Path $class16 $_)})
  if($package.Count-ne15-or$direct.Count-ne4){throw 'inventory drift'}
  $mainPattern='public\s+static\s+void\s+main\s*\('
  if(@($package|Where-Object{[IO.File]::ReadAllText($_.FullName)-match$mainPattern}).Count-ne14){throw 'package main drift'}
  if(@($direct|Where-Object{[IO.File]::ReadAllText($_.FullName)-match$mainPattern}).Count-ne4){throw 'direct main drift'}
  Compile-Package $package (Join-Path $root ("package-"+$mode))
  Compile-Clean $direct (Join-Path $root ("direct-"+$mode))

  $copyDir=Join-Path $root ("source-"+$mode+'\com\java\class16');New-Item -ItemType Directory -Path $copyDir -ErrorAction Stop|Out-Null
  foreach($file in $direct){
    $copy=Join-Path $copyDir $file.Name;[IO.File]::Copy($file.FullName,$copy,$false)
    if((Get-FileHash -Algorithm SHA256 -LiteralPath $file.FullName).Hash-cne(Get-FileHash -Algorithm SHA256 -LiteralPath $copy).Hash){throw 'copy hash drift'}
  }
  $relocated=@(Get-ChildItem -LiteralPath $copyDir -Filter '*.java'|Sort-Object Name)
  Compile-Clean $relocated (Join-Path $root ("relocated-"+$mode))
  $active=($relocated|ForEach-Object{Remove-JavaComments([IO.File]::ReadAllText($_.FullName))})-join$nl
  $raw=($relocated|ForEach-Object{[IO.File]::ReadAllText($_.FullName)})-join$nl
  $shape=[ordered]@{
    driverLoad=Count $active 'Class\.forName\s*\(';getConnection=Count $active 'DriverManager\.getConnection\s*\('
    connections=Count $active 'Connection\s+conn\s*=\s*null';statements=Count $active 'Statement\s+stmt\s*=\s*null';resultSets=Count $active 'ResultSet\s+rs\s*=\s*null'
    create=Count $active '\.createStatement\s*\(';query=Count $active '\.executeQuery\s*\(';update=Count $active '\.executeUpdate\s*\(';next=Count $active '\.next\s*\('
    label=Count $active '\.get(?:Int|String)\s*\(\s*"[A-Za-z]+';index=Count $active '\.get(?:Int|String)\s*\(\s*\d+'
    close=Count $active '\.close\s*\(';nullGuards=Count $active '\b(?:rs|stmt|conn)\s*!=\s*null'
    selectStar=Count $active '"select\s+\*\s+from\s+customer';insertSql=Count $active '"insert\s+into\s+customer';updateSql=Count $active '"update\s+customer'
    broadCatch=Count $active 'catch\s*\(\s*Exception\b';sqlCatch=Count $active 'catch\s*\(\s*SQLException\b';runtimeWrap=Count $active 'new\s+RuntimeException\s*\(';emptyCatch=Count $active 'catch\s*\([^)]*\)\s*\{\s*\}'
    jdbcUrl=Count $raw 'jdbc:mysql:';userLiteral=Count $raw 'String\s+user\s*=\s*"[^"]+"';passwordLiteral=Count $raw 'String\s+password\s*=\s*"[^"]+"'
    envLookup=Count $active 'System\.(?:getenv|getProperty)\s*\(';weakSsl=Count $raw 'useSSL=false';allowPublicKey=Count $raw 'allowPublicKeyRetrieval=true'
  }
  if(($shape.Values-join',')-cne'3,4,4,3,3,3,3,2,3,4,8,9,6,3,1,1,4,4,8,1,4,4,4,0,3,3'){throw 'source shape drift'}
  return 'package=15,warnings=2(deprecation),mains=14|direct=4,warnings=0,mains=4|closure=4,relocatedWarnings=0,hashes=4same|api=driverLoad3|getConnection4|connections4|statements3|resultSets3|create3|query3|update2|next3|getters=label4,index8|close=9|nullGuards=6|sql=selectStar3,insert1,update1|errors=broadCatch4,sqlCatch4,runtimeWrap8,emptyCatch1|hygiene=jdbcUrl4,userLiteral4,passwordLiteral4,envLookup0,weakSsl3,allowPublicKey3'
}

try{
  if(Test-Path -LiteralPath $root){throw 'unexpected temp collision'}
  New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null;$ownsRoot=$true
  $source=[IO.Path]::GetFullPath($SourceRoot);$class16=Join-Path $source 'src/com/java/class16'
  $baseline=Audit 'baseline' $class16;$hostile=Audit 'hostile' $class16
  if($baseline-cne$hostile){throw 'baseline hostile drift'}
  "spacePath=$($root.Contains(' ')),modes=2|same=True,$baseline"
  'privacy=database:not-connected|driver:not-loaded|network:none|credentials:values-not-emitted|original:read-only|fixture:owned-temp-copy;launcherOptions=4'
}catch{$bodyError=$_.Exception}finally{
  $finalErrors=[Collections.Generic.List[Exception]]::new()
  foreach($name in $optionNames){
    try{
      if($saved[$name].Exists){
        Set-Item -LiteralPath ("Env:"+$name)-Value $saved[$name].Value -ErrorAction Stop
        $restored=Get-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue
        if($null-eq$restored-or$restored.Value-cne$saved[$name].Value){throw "launcher restore failed: $name"}
      }else{Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue;if(Test-Path -LiteralPath ("Env:"+$name)){throw "launcher absence failed: $name"}}
    }catch{$finalErrors.Add($_.Exception)}
  }
  try{
    if($ownsRoot){
      $resolved=[IO.Path]::GetFullPath($root)
      if(-not[string]::Equals([IO.Path]::GetDirectoryName($resolved),$base,[StringComparison]::OrdinalIgnoreCase)){throw 'unsafe cleanup'}
      if(Test-Path -LiteralPath $resolved){Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop}
      if(Test-Path -LiteralPath $resolved){throw 'cleanup failed'}
    }
  }catch{$finalErrors.Add($_.Exception)}
  if($null-ne$bodyError){$finalErrors.Insert(0,$bodyError)}
  if($finalErrors.Count-eq1){[Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($finalErrors[0]).Throw()}
  if($finalErrors.Count-gt1){throw[AggregateException]::new('audit and cleanup failures',$finalErrors.ToArray())}
}`,
    walkthrough: [
      { lines: "1-11", explanation: "launcher options4와 공백 포함 owned temp root, cleanup error state를 준비합니다." },
      { lines: "13-31", explanation: "clean child environment, concurrent drains,10초 timeout과 process-tree kill을 가진 compiler launcher를 정의합니다." },
      { lines: "32-48", explanation: "warning0 direct/relocated와 package deprecation2를 분리하는 compile oracles, comment/count helpers를 정의합니다." },
      { lines: "49-62", explanation: "baseline/hostile mode, package15/direct4/main counts와 compile evidence를 검증합니다." },
      { lines: "64-70", explanation: "direct4를 owned temp package tree에 byte-identical 복사하고 hash4·relocated warning0를 확인합니다." },
      { lines: "71-86", explanation: "comment-excluded API/SQL/cleanup shapes와 raw-only credential/URL option counts를 값 비출력 방식으로 검증합니다." },
      { lines: "88-118", explanation: "두 modes 결과를 비교하고 no-connect privacy statement, launcher restore와 safe cleanup을 수행합니다." },
    ],
    run: { environment: ["PowerShell 7+ on Windows", "OpenJDK 21", "javastudy2/classstudy source root", "no MySQL driver required", "no database/network", "owned temp copy only"], command: "pwsh -NoProfile -File verify-original-jdbc01.ps1 -SourceRoot <classstudy-root>" },
    output: {
      value: "spacePath=True,modes=2|same=True,package=15,warnings=2(deprecation),mains=14|direct=4,warnings=0,mains=4|closure=4,relocatedWarnings=0,hashes=4same|api=driverLoad3|getConnection4|connections4|statements3|resultSets3|create3|query3|update2|next3|getters=label4,index8|close=9|nullGuards=6|sql=selectStar3,insert1,update1|errors=broadCatch4,sqlCatch4,runtimeWrap8,emptyCatch1|hygiene=jdbcUrl4,userLiteral4,passwordLiteral4,envLookup0,weakSsl3,allowPublicKey3\nprivacy=database:not-connected|driver:not-loaded|network:none|credentials:values-not-emitted|original:read-only|fixture:owned-temp-copy;launcherOptions=4",
      explanation: ["package의 unrelated URL warnings와 JDBC direct warning0를 분리합니다.", "DB 실행 없이 source API·SQL·cleanup·hygiene shape만 셉니다.", "credential values와 row literals는 출력하지 않습니다."],
    },
    experiments: [
      { change: "audit에서 원본 Ex03 main을 실행합니다.", prediction: "installed driver와 localhost database 상태에 따라 class loading/connection/credential side effect가 발생합니다.", result: "public curriculum audit에서는 금지하고 private integration fixture로 분리합니다." },
      { change: "Ex03 connection 실패 fixture를 code review합니다.", prediction: "conn이 null인 채 finally conn.close가 NullPointerException을 내 원래 SQLException을 가릴 수 있습니다.", result: "try-with-resources acquisition과 primary/suppressed model로 교정합니다." },
      { change: "credential assignment values를 audit output에 추가합니다.", prediction: "public artifact에 reusable secret가 복제됩니다.", result: "count·presence·redacted fingerprint만 허용합니다." },
    ],
    sourceRefs: ["java-class16-ex03", "java-class16-ex04", "java-class16-ex06", "java-class16-ex08", "jdk21-javac", "powershell-environment", "powershell-get-file-hash", "dotnet-process-start-info", "dotnet-process", "dotnet-stream-reader-async", "java-driver-manager", "java-connection", "java-statement", "java-result-set", "java-sql-exception"],
  }],
  diagnostics: [
    { symptom: "connection 실패 뒤 finally에서 NullPointerException이 나 원래 SQLException을 잃는다.", likelyCause: "null connection에 close를 호출하고 cleanup failure가 primary failure를 덮습니다.", checks: ["acquisition 성공 전에 resource variable이 null인지 봅니다.", "cause/suppressed chain을 봅니다.", "manual finally close 순서를 확인합니다."], fix: "Connection을 try-with-resources header에서 acquire하고 SQLException cause와 suppressed를 보존합니다.", prevention: "acquisition failure·body failure·각 close failure matrix를 테스트합니다." },
    { symptom: "공개 문서나 repository search에 DB password literal이 나타난다.", likelyCause: "학습 원본의 embedded credential을 그대로 복사했습니다.", checks: ["secret scanner와 history를 검사합니다.", "build artifact/log/example output을 봅니다.", "credential 유효 여부와 scope를 확인합니다."], fix: "credential을 즉시 rotate/revoke하고 source/history/artifact에서 제거한 뒤 authorized secret provider로 주입합니다.", prevention: "pre-commit/CI secret scanning, redaction tests와 least-privilege short-lived credential을 사용합니다." },
  ],
  expertNotes: ["Compiling a JDBC program can be side-effect free while running static driver loading or DriverManager calls is not; the audit boundary deliberately stops before class execution.", "Counts of embedded credential literals are security evidence. Their values are neither needed nor appropriate in a public learning artifact."],
};

(session.chapters as DetailedSession["chapters"]).push(originalAuditChapter);

const connectionAndCursorChapters: DetailedSession["chapters"] = [
  {
    id: "driver-discovery-manager-connection-contract",
    title: "Driver는 URL을 해석하고 DriverManager는 맞는 구현에 Connection 생성을 위임합니다",
    lead: "등록했다가 반드시 해제하는 JDK-only fake Driver로 vendor JAR나 socket 없이 acceptsURL→connect→close 흐름을 실행합니다.",
    explanations: [
      "JDBC API는 java.sql의 표준 interface이고 실제 wire protocol·authentication·SQL dialect는 database vendor driver가 구현합니다. API module이 있다고 MySQL driver가 포함된 것은 아닙니다.",
      "현대 JDBC driver JAR는 META-INF/services/java.sql.Driver를 통해 Service Provider로 발견될 수 있어 매번 Class.forName이 필수는 아닙니다. 배포 artifact와 classpath/module path에 올바른 driver가 있어야 합니다.",
      "DriverManager는 등록된 Driver에게 URL 수락 여부를 묻고 connect를 위임합니다. connect가 null을 반환하면 해당 driver가 URL을 이해하지 못한다는 뜻이며 SQLException failure와 다릅니다.",
      "Connection은 database session/resource handle입니다. 생성 성공 뒤 close ownership이 즉시 정해져야 하며 connection object를 global mutable singleton으로 공유하지 않습니다.",
      "예제 fake Driver는 jdbc:study: prefix만 수락하고 Connection dynamic proxy는 close/isClosed/isValid만 지원합니다. 지원하지 않는 call은 SQLFeatureNotSupportedException으로 즉시 실패합니다.",
      "DriverManager에 test Driver를 등록한 채 두면 같은 JVM의 다른 test에 전역 상태가 누출됩니다. finally에서 deregister하여 driver registry lifecycle까지 닫습니다.",
    ],
    concepts: [
      { term: "JDBC driver", definition: "표준 JDBC interfaces를 특정 database protocol과 behavior로 구현하는 provider입니다.", detail: ["vendor/runtime dependency입니다.", "URL acceptance와 connection creation을 제공합니다."] },
      { term: "DriverManager", definition: "등록·발견된 drivers 중 JDBC URL을 처리할 구현을 찾아 Connection 요청을 전달하는 service입니다.", detail: ["process-global registry가 있습니다.", "DataSource가 production 구성에는 더 적합할 수 있습니다."] },
      { term: "Connection", definition: "database와의 logical session, transaction context와 statement factory를 나타내는 closeable handle입니다.", detail: ["thread-safe 공유를 가정하지 않습니다.", "pool에서는 close 의미가 달라집니다."] },
    ],
    codeExamples: [{
      id: "java-fake-driver-manager-connection",
      title: "custom Driver가 유일한 fake URL을 받아 Connection proxy를 반환합니다",
      language: "java",
      filename: "FakeDriverConnection.java",
      purpose: "vendor driver·network 없이 DriverManager selection과 connection lifecycle을 실제 JDBC types로 검증합니다.",
      code: String.raw`import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.Driver;
import java.sql.DriverManager;
import java.sql.DriverPropertyInfo;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.Properties;
import java.util.logging.Logger;

public class FakeDriverConnection {
    private static final class StudyDriver implements Driver {
        private int connects;

        @Override
        public Connection connect(String url, Properties info) throws SQLException {
            if (!acceptsURL(url)) {
                return null;
            }
            connects++;
            boolean[] closed = {false};
            return (Connection) Proxy.newProxyInstance(
                    FakeDriverConnection.class.getClassLoader(),
                    new Class<?>[]{Connection.class},
                    (proxy, method, args) -> switch (method.getName()) {
                        case "close" -> {
                            closed[0] = true;
                            yield null;
                        }
                        case "isClosed" -> closed[0];
                        case "isValid" -> !closed[0];
                        case "isWrapperFor" -> false;
                        case "unwrap" -> throw new SQLFeatureNotSupportedException("unwrap");
                        case "toString" -> "StudyConnection";
                        default -> throw new SQLFeatureNotSupportedException(method.getName());
                    });
        }

        @Override public boolean acceptsURL(String url) { return url != null && url.startsWith("jdbc:study:"); }
        @Override public DriverPropertyInfo[] getPropertyInfo(String url, Properties info) { return new DriverPropertyInfo[0]; }
        @Override public int getMajorVersion() { return 1; }
        @Override public int getMinorVersion() { return 0; }
        @Override public boolean jdbcCompliant() { return false; }
        @Override public Logger getParentLogger() { return Logger.getGlobal(); }
        int connects() { return connects; }
    }

    public static void main(String[] args) throws SQLException {
        StudyDriver driver = new StudyDriver();
        DriverManager.registerDriver(driver);
        try {
            boolean accepted = driver.acceptsURL("jdbc:study:mem");
            Connection connection = DriverManager.getConnection(
                    "jdbc:study:mem", new Properties());
            boolean valid = connection.isValid(0);
            connection.close();

            System.out.println("accepted=" + accepted);
            System.out.println("connects=" + driver.connects());
            System.out.println("validBeforeClose=" + valid);
            System.out.println("closed=" + connection.isClosed());
        } finally {
            DriverManager.deregisterDriver(driver);
        }
    }
}`,
      walkthrough: [
        { lines: "1-10", explanation: "JDK JDBC·proxy·properties·logger types만 import하며 vendor dependency는 없습니다." },
        { lines: "12-34", explanation: "jdbc:study URL만 수락하고 close/isClosed/isValid을 지원하는 Connection proxy를 만드는 Driver를 구현합니다." },
        { lines: "37-43", explanation: "Driver metadata와 connect count를 warning 없이 구현합니다." },
        { lines: "46-61", explanation: "driver 등록, fake URL 연결, validity/close evidence 출력과 finally deregistration을 수행합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK-only custom java.sql.Driver", "dynamic Connection proxy", "no vendor JAR/network", "-Xlint:all warning0"], command: isolatedJavaRun("FakeDriverConnection.java", "FakeDriverConnection") },
      output: { value: "accepted=true\nconnects=1\nvalidBeforeClose=true\nclosed=true", explanation: ["fake prefix를 정확히 한 Driver가 수락합니다.", "DriverManager가 connect를 한 번 호출합니다.", "logical connection을 명시 close합니다."] },
      experiments: [
        { change: "URL을 jdbc:unknown:mem으로 바꿉니다.", prediction: "등록 driver가 모두 null을 반환해 DriverManager가 suitable driver 없음 SQLException을 냅니다.", result: "URL scheme과 runtime driver packaging을 함께 진단합니다." },
        { change: "finally의 deregisterDriver를 제거하고 같은 JVM test를 반복합니다.", prediction: "전역 registry에 driver instances가 누적되어 test isolation과 class unloading을 해칠 수 있습니다.", result: "등록한 process-global provider의 owner가 해제합니다." },
        { change: "Connection proxy에서 지원하지 않는 createStatement를 호출합니다.", prediction: "SQLFeatureNotSupportedException이 즉시 발생합니다.", result: "fake는 silent default보다 필요한 contract만 fail-fast 구현합니다." },
      ],
      sourceRefs: ["java-driver", "java-driver-manager", "java-connection", "java-driver-property-info", "java-sql-feature-not-supported", "java-proxy", "java-service-loader"],
    }],
    diagnostics: [
      { symptom: "No suitable driver SQLException이 발생한다.", likelyCause: "JDBC URL을 수락하는 driver가 runtime에 없거나 URL scheme/version이 driver와 맞지 않습니다.", checks: ["runtime dependencies를 봅니다.", "DriverManager.drivers 목록을 safe하게 확인합니다.", "URL prefix와 driver 문서를 대조합니다."], fix: "지원되는 vendor driver version을 runtime artifact에 포함하고 URL을 검증합니다.", prevention: "packaged artifact에서 isolated connection-smoke test와 dependency inventory를 실행합니다." },
      { symptom: "test가 순서에 따라 다른 fake Driver를 선택한다.", likelyCause: "이전 test가 DriverManager global registry에 provider를 남겼습니다.", checks: ["등록 driver identities를 봅니다.", "register/deregister owner를 찾습니다.", "parallel test JVM 격리를 확인합니다."], fix: "finally에서 등록 instance를 해제하고 필요하면 forked JVM으로 격리합니다.", prevention: "global registry mutation test에 lifecycle fixture를 강제합니다." },
    ],
    comparisons: [{ title: "Connection acquisition entry point", options: [
      { name: "DriverManager", chooseWhen: "작은 standalone 도구·driver 교육·간단 bootstrap일 때", avoidWhen: "pool/configuration injection과 lifecycle 관리가 필요한 application일 때", tradeoffs: ["직접적", "global registry와 URL/credential 전달"] },
      { name: "DataSource", chooseWhen: "application/container가 configuration·pool·metrics를 주입할 때", avoidWhen: "DataSource owner와 close semantics를 모를 때", tradeoffs: ["factory abstraction", "implementation lifecycle 별도"] },
      { name: "Connection pool", chooseWhen: "연결 생성 비용을 재사용하고 bounded concurrency가 필요할 때", avoidWhen: "무제한 connection이나 transaction state 자동 정리를 기대할 때", tradeoffs: ["borrow/return latency", "capacity·reset·leak 관리"] },
    ] }],
    expertNotes: ["JDBC interfaces are stable abstractions, but driver behavior at unsupported methods, network timeouts, metadata, and SQLState classification still needs vendor-version integration tests."],
  },
  {
    id: "configuration-secret-injection-redaction-validation",
    title: "접속 설정은 필요한 값을 fail-fast 검증하고 password는 문자열 표현에서 항상 redaction합니다",
    lead: "production environment를 읽지 않는 deterministic Map fixture로 required keys, allowed JDBC scheme와 no-secret safe log를 검증합니다.",
    explanations: [
      "URL·user·password를 source literal로 넣으면 repository history, build artifact와 교육 문서에 복제됩니다. 이미 노출된 secret은 삭제만으로 끝나지 않고 rotate/revoke해야 합니다.",
      "production에서는 environment, file permission이 제한된 mounted secret, cloud secret manager 등 authorized provider에서 startup 시 주입합니다. provider 선택은 deployment threat model에 따릅니다.",
      "configuration은 첫 query 때가 아니라 startup boundary에서 missing/blank/scheme 오류를 fail-fast해야 합니다. 그러나 exception message에 password value를 포함하지 않습니다.",
      "JDBC API가 String credential을 요구하는 경로에서는 char[]만으로 완전한 memory erasure를 약속할 수 없습니다. scope를 줄이고 heap dump/log 접근도 보호합니다.",
      "safe representation은 URL에도 embedded credential/query secret가 없는지 검증해야 합니다. 예제는 training-only jdbc:study scheme만 허용하고 password를 고정 marker로 바꿉니다.",
      "test fixture의 synthetic password도 실제 credential처럼 log 금지 contract를 통과해야 합니다. example output은 secret 자체가 아니라 containsSecret=false만 냅니다.",
    ],
    concepts: [
      { term: "secret provider", definition: "authorized runtime이 credential을 가져오고 rotation/access audit를 제공하는 외부 구성 경계입니다.", detail: ["source repository와 분리합니다.", "least privilege·short lifetime을 선호합니다."] },
      { term: "redaction", definition: "민감 field의 존재와 문맥은 남기되 실제 value를 비가역 marker로 대체하는 출력 정책입니다.", detail: ["toString/log/exception 모두 적용합니다.", "부분 노출도 threat model로 검토합니다."] },
      { term: "fail-fast configuration", definition: "업무 요청 전에 required/format/policy 오류를 명시적으로 거부하는 startup 검증입니다.", detail: ["blank와 missing을 구분할 수 있습니다.", "safe key name만 오류에 포함합니다."] },
    ],
    codeExamples: [{
      id: "java-redacted-db-config",
      title: "synthetic configuration을 검증하고 safe string에서 secret 부재를 확인합니다",
      language: "java",
      filename: "RedactedDbConfig.java",
      purpose: "실제 environment/secret를 읽지 않고 required validation과 redaction contract를 exact 실행합니다.",
      code: String.raw`import java.util.Map;

public class RedactedDbConfig {
    private record DbConfig(String url, String user, String password) {
        static DbConfig from(Map<String, String> values) {
            String url = required(values, "DB_URL");
            String user = required(values, "DB_USER");
            String password = required(values, "DB_PASSWORD");
            if (!url.startsWith("jdbc:study:")) {
                throw new IllegalArgumentException("unsupported DB_URL scheme");
            }
            return new DbConfig(url, user, password);
        }

        private static String required(Map<String, String> values, String key) {
            String value = values.get(key);
            if (value == null || value.isBlank()) {
                throw new IllegalArgumentException("missing " + key);
            }
            return value;
        }

        String safe() {
            return "DbConfig[url=" + url + ",user=" + user
                    + ",password=<redacted>]";
        }
    }

    public static void main(String[] args) {
        String syntheticSecret = "fixture-only";
        DbConfig config = DbConfig.from(Map.of(
                "DB_URL", "jdbc:study:mem",
                "DB_USER", "learner",
                "DB_PASSWORD", syntheticSecret));
        String safe = config.safe();
        boolean missingRejected;
        try {
            DbConfig.from(Map.of("DB_URL", "jdbc:study:mem", "DB_USER", "learner"));
            missingRejected = false;
        } catch (IllegalArgumentException expected) {
            missingRejected = expected.getMessage().equals("missing DB_PASSWORD");
        }

        System.out.println("safe=" + safe);
        System.out.println("containsSecret=" + safe.contains(syntheticSecret));
        System.out.println("missingRejected=" + missingRejected);
    }
}`,
      walkthrough: [
        { lines: "1-13", explanation: "required DB keys와 allowed synthetic scheme을 검증하는 immutable record factory를 정의합니다." },
        { lines: "15-21", explanation: "null/blank를 key name만 포함한 exception으로 fail-fast합니다." },
        { lines: "23-26", explanation: "password accessor 값을 사용하지 않는 명시 redacted representation을 만듭니다." },
        { lines: "29-42", explanation: "complete/missing fixtures를 검증하고 safe output 안 synthetic secret 부재를 boolean으로 확인합니다." },
      ],
      run: { environment: ["OpenJDK 21", "deterministic Map fixture", "no environment/secret provider access", "-Xlint:all warning0"], command: isolatedJavaRun("RedactedDbConfig.java", "RedactedDbConfig") },
      output: { value: "safe=DbConfig[url=jdbc:study:mem,user=learner,password=<redacted>]\ncontainsSecret=false\nmissingRejected=true", explanation: ["safe representation은 password marker만 포함합니다.", "synthetic secret도 출력에 없습니다.", "missing password를 startup-style failure로 거부합니다."] },
      experiments: [
        { change: "record 기본 toString을 log합니다.", prediction: "password component가 그대로 포함됩니다.", result: "secret-bearing record의 자동 toString을 사용하지 않습니다." },
        { change: "URL에 user:password@host 형식을 허용합니다.", prediction: "URL log·metric label·exception에 credential이 전파될 수 있습니다.", result: "credential-free URL policy와 structured secret fields를 사용합니다." },
        { change: "missing error에 values Map 전체를 붙입니다.", prediction: "password와 기타 sensitive configuration이 exception에 노출됩니다.", result: "오류에는 safe key·reason만 남깁니다." },
      ],
      sourceRefs: ["java-map", "java-record-classes", "java-string-is-blank", "owasp-secrets-management", "owasp-logging-cheat-sheet", "twelve-factor-config"],
    }],
    diagnostics: [
      { symptom: "database password가 application log에 평문으로 보인다.", likelyCause: "config object 기본 toString, exception context 또는 URL에 credential을 포함했습니다.", checks: ["logger arguments와 structured fields를 봅니다.", "exception cause/message를 검색합니다.", "APM labels와 crash dump 접근을 확인합니다."], fix: "즉시 credential을 rotate하고 allowlisted safe fields만 log하도록 redaction을 적용합니다.", prevention: "canary secret가 모든 log/error paths에 없는지 automated test합니다." },
      { symptom: "첫 사용자 요청에서야 DB_URL 누락을 발견한다.", likelyCause: "configuration 검증을 lazy connection path까지 미뤘습니다.", checks: ["startup validation hook을 봅니다.", "required/blank/scheme 규칙을 확인합니다.", "readiness와 DB dependency 정책을 봅니다."], fix: "startup에 fail-fast validation을 두고 dependency readiness 정책을 명시합니다.", prevention: "complete/missing/blank/malformed config matrix를 deployment CI에서 실행합니다." },
    ],
    comparisons: [{ title: "secret 주입 경로", options: [
      { name: "source literal", chooseWhen: "실제 credential에는 선택하지 않음", avoidWhen: "모든 shared repository/build", tradeoffs: ["쉽지만 history에 영구 복제", "rotation·audit 어려움"] },
      { name: "environment/mounted secret", chooseWhen: "orchestrator가 access와 rotation을 관리하고 process boundary가 적절할 때", avoidWhen: "host users·diagnostics가 environment/file을 광범위하게 읽을 때", tradeoffs: ["단순 runtime injection", "host/process threat model 필요"] },
      { name: "secret manager", chooseWhen: "central policy·rotation·audit·short-lived credential이 필요할 때", avoidWhen: "bootstrap identity와 outage policy가 설계되지 않았을 때", tradeoffs: ["강한 lifecycle", "network/bootstrap/cache 복잡성"] },
    ] }],
    expertNotes: ["Redaction is a data-flow property: test logs, metrics, traces, exception serialization, support bundles, heap dumps, and generated documentation, not only logger calls."],
  },
  {
    id: "statement-query-resultset-cursor-loop",
    title: "executeQuery는 ResultSet을 반환하고 next가 현재 row를 선택한 뒤에만 getters가 유효합니다",
    lead: "실제 Statement와 ResultSet interfaces의 proxies로 두 rows를 읽고 result→statement close ownership을 exact 확인합니다.",
    explanations: [
      "새 ResultSet cursor는 첫 row 앞 before-first에 있습니다. next가 true를 반환하면서 현재 row가 생기고 false이면 더 이상 current row가 없습니다.",
      "while(rs.next())는 zero/one/many rows를 같은 구조로 처리합니다. empty result는 exception이 아니라 loop0회인 정상 query outcome입니다.",
      "executeQuery는 row-producing SQL에 사용하고 하나의 ResultSet을 반환합니다. write SQL에 사용했을 때 behavior를 기대하지 말고 executeUpdate와 구분합니다.",
      "label getter는 SQL alias를 포함한 result column label과 결합합니다. select *에 기대지 말고 필요한 columns와 aliases를 고정해 mapping contract를 드러냅니다.",
      "Statement를 닫으면 current ResultSet도 닫히는 driver contract가 있지만 ownership을 명확히 하기 위해 nested try-with-resources로 ResultSet을 먼저 닫습니다.",
      "fake handler는 지원하는 SQL과 methods만 허용합니다. 실제 driver와 다른 silent default를 만들지 않고 unsupported use를 즉시 실패시킵니다.",
    ],
    concepts: [
      { term: "before-first cursor", definition: "ResultSet 생성 직후 어떤 row도 current가 아닌 초기 위치입니다.", detail: ["next를 먼저 호출합니다.", "empty면 첫 next가 false입니다."] },
      { term: "column label", definition: "SELECT list의 AS alias가 있으면 alias, 없으면 driver가 제공하는 column label입니다.", detail: ["getString(label)에 사용합니다.", "metadata로 검증할 수 있습니다."] },
      { term: "resource nesting", definition: "Connection이 Statement를, Statement가 ResultSet을 생성하는 ownership을 acquisition 순서와 반대 close 순서로 표현합니다.", detail: ["ResultSet이 먼저 닫힙니다.", "try-with-resources가 suppressed를 보존합니다."] },
    ],
    codeExamples: [{
      id: "java-fake-statement-resultset-loop",
      title: "두 fake rows를 label로 읽고 ResultSet·Statement close를 확인합니다",
      language: "java",
      filename: "FakeQueryCursor.java",
      purpose: "database 없이 executeQuery/next/getters/nested close의 실제 JDBC interface calls를 검증합니다.",
      code: String.raw`import java.lang.reflect.Proxy;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.sql.Statement;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

public class FakeQueryCursor {
    private static ResultSet resultSet(List<Map<String, Object>> rows,
                                       AtomicBoolean closed) {
        AtomicInteger cursor = new AtomicInteger(-1);
        return (ResultSet) Proxy.newProxyInstance(
                FakeQueryCursor.class.getClassLoader(), new Class<?>[]{ResultSet.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "next" -> cursor.incrementAndGet() < rows.size();
                    case "getInt" -> ((Number) current(rows, cursor).get((String) args[0])).intValue();
                    case "getString" -> (String) current(rows, cursor).get((String) args[0]);
                    case "close" -> {
                        closed.set(true);
                        yield null;
                    }
                    case "isClosed" -> closed.get();
                    default -> throw new SQLFeatureNotSupportedException(method.getName());
                });
    }

    private static Map<String, Object> current(List<Map<String, Object>> rows,
                                                AtomicInteger cursor) throws SQLException {
        int index = cursor.get();
        if (index < 0 || index >= rows.size()) {
            throw new SQLException("cursor is not on a row", "24000");
        }
        return rows.get(index);
    }

    private static Statement statement(ResultSet resultSet, AtomicBoolean closed) {
        return (Statement) Proxy.newProxyInstance(
                FakeQueryCursor.class.getClassLoader(), new Class<?>[]{Statement.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "executeQuery" -> {
                        if (!"select custid, name from customer order by custid".equals(args[0])) {
                            throw new SQLException("unexpected SQL", "42000");
                        }
                        yield resultSet;
                    }
                    case "close" -> {
                        closed.set(true);
                        yield null;
                    }
                    case "isClosed" -> closed.get();
                    default -> throw new SQLFeatureNotSupportedException(method.getName());
                });
    }

    public static void main(String[] args) throws SQLException {
        AtomicBoolean resultClosed = new AtomicBoolean();
        AtomicBoolean statementClosed = new AtomicBoolean();
        ResultSet result = resultSet(List.of(
                Map.of("custid", 1, "name", "Ada"),
                Map.of("custid", 2, "name", "Linus")), resultClosed);
        Statement statement = statement(result, statementClosed);
        int count = 0;
        try (statement; result) {
            ResultSet rows = statement.executeQuery(
                    "select custid, name from customer order by custid");
            while (rows.next()) {
                System.out.println(rows.getInt("custid") + ":" + rows.getString("name"));
                count++;
            }
        }
        System.out.println("count=" + count);
        System.out.println("resultClosed=" + resultClosed.get());
        System.out.println("statementClosed=" + statementClosed.get());
    }
}`,
      walkthrough: [
        { lines: "1-36", explanation: "cursor -1, next, label getters와 SQLState24000 invalid position을 가진 ResultSet proxy를 정의합니다." },
        { lines: "38-54", explanation: "한 fixed SELECT만 허용하고 close를 기록하는 Statement proxy를 정의합니다." },
        { lines: "57-72", explanation: "두 immutable rows, result/statement를 만들고 nested resources 안 while-next mapping을 실행합니다." },
        { lines: "73-75", explanation: "row count와 result-before-statement close facts를 owner 밖에서 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK dynamic Statement/ResultSet proxies", "two in-memory rows", "no DB/network", "-Xlint:all warning0"], command: isolatedJavaRun("FakeQueryCursor.java", "FakeQueryCursor") },
      output: { value: "1:Ada\n2:Linus\ncount=2\nresultClosed=true\nstatementClosed=true", explanation: ["next true인 두 rows만 mapping됩니다.", "label getters가 expected values를 읽습니다.", "두 resources가 모두 닫힙니다."] },
      experiments: [
        { change: "rows를 빈 List로 바꿉니다.", prediction: "loop가0회이고 count=0이며 resources는 그대로 닫힙니다.", result: "empty result를 정상 domain state로 처리합니다." },
        { change: "getter를 while 앞에서 호출합니다.", prediction: "fake가 SQLState24000 invalid cursor state를 냅니다.", result: "모든 row getter는 successful next scope 안에 둡니다." },
        { change: "ResultSet resource를 try header에서 제거합니다.", prediction: "이 fake에서는 Statement close가 ResultSet을 자동 닫지 않아 resultClosed=false입니다.", result: "test fake와 production driver 모두 명시 ownership contract를 검증합니다." },
      ],
      sourceRefs: ["java-statement", "java-result-set", "java-sql-exception", "java-sql-state-class-24", "java-proxy", "java-list", "java-map", "java-atomic-boolean", "java-atomic-integer"],
    }],
    diagnostics: [
      { symptom: "Before start of result set 또는 invalid cursor state가 난다.", likelyCause: "next 성공 전에 getter를 호출했습니다.", checks: ["getter가 while(rs.next()) 내부인지 봅니다.", "빈 결과 path를 봅니다.", "scrollable cursor position calls를 확인합니다."], fix: "next 반환값이 true인 lexical scope에서만 current-row getters를 호출합니다.", prevention: "zero/one/many rows fixture와 invalid-position negative test를 둡니다." },
      { symptom: "query 결과가 비었는데 error로 처리하거나 이전 row 값을 재사용한다.", likelyCause: "empty result와 cursor state를 명시적으로 모델링하지 않았습니다.", checks: ["row counter/list 초기화를 봅니다.", "next false 뒤 getter가 있는지 봅니다.", "single-result API의 Optional policy를 확인합니다."], fix: "empty list/Optional.empty/not-found 중 domain contract를 정하고 stale holder를 재사용하지 않습니다.", prevention: "empty result를 first-class acceptance case로 유지합니다." },
    ],
    comparisons: [{ title: "ResultSet getter key", options: [
      { name: "column index", chooseWhen: "작고 고정된 projection에서 metadata와 함께 성능/호환성을 검증할 때", avoidWhen: "SELECT list 순서가 자주 변하거나 index magic number가 숨을 때", tradeoffs: ["간결", "order coupling"] },
      { name: "column label", chooseWhen: "명시 aliases로 mapping contract를 표현할 때", avoidWhen: "duplicate/driver-specific label case를 검증하지 않을 때", tradeoffs: ["가독성", "label schema coupling"] },
      { name: "mapper abstraction", chooseWhen: "여러 query에서 type/null/schema policy를 재사용할 때", avoidWhen: "reflection magic이 SQL contract를 가릴 때", tradeoffs: ["중복 감소", "mapping diagnostics 필요"] },
    ] }],
    expertNotes: ["A fake JDBC proxy is a contract test, not proof of vendor behavior. Keep separate driver/database integration tests for metadata casing, type conversions, streaming, and close semantics."],
  },
  {
    id: "resultset-before-first-after-last-state-machine",
    title: "ResultSet getter는 current row가 있을 때만 유효하고 next false 뒤에는 after-last입니다",
    lead: "one-row fake로 next 전·첫 row·next false 뒤의 세 positions와 SQLState class24를 exact 확인합니다.",
    explanations: [
      "forward-only ResultSet을 상태 기계로 보면 BEFORE_FIRST→ON_ROW→AFTER_LAST입니다. next true만 ON_ROW를 만들고 false는 row가 없음을 뜻합니다.",
      "single row query도 rs.next가 false일 수 있습니다. 바로 getter를 호출하면 not-found와 protocol error가 섞입니다.",
      "while loop가 끝난 뒤 마지막 row getter를 다시 읽는 code는 driver에 따라 invalid cursor failure를 냅니다. 필요한 값은 ON_ROW에서 DTO로 복사합니다.",
      "ResultSet type TYPE_FORWARD_ONLY, TYPE_SCROLL_INSENSITIVE/SCROLL_SENSITIVE와 concurrency mode가 있지만 지원 여부와 비용은 driver에 따라 다릅니다. 기본 read path는 forward-only를 우선합니다.",
      "SQLState 24000은 invalid cursor state class의 표준 code입니다. 실제 driver가 더 구체적인 message/vendor code를 줄 수 있으므로 message text parsing 대신 structured fields를 사용합니다.",
      "isBeforeFirst/isAfterLast 같은 methods도 empty set에서 behavior를 가정하지 말고 driver docs/integration tests로 확인합니다. next contract가 portable core입니다.",
    ],
    concepts: [
      { term: "current row", definition: "successful cursor movement 뒤 getters가 읽을 수 있는 한 row position입니다.", detail: ["before-first에는 없습니다.", "next false 뒤에도 없습니다."] },
      { term: "SQLState class 24", definition: "invalid cursor state를 나타내는 standard SQLState class입니다.", detail: ["message가 아닌 code로 1차 분류합니다.", "driver vendor code도 함께 보존합니다."] },
      { term: "forward-only", definition: "cursor가 next 방향으로만 이동하는 ResultSet mode입니다.", detail: ["일반 streaming read에 적합합니다.", "scrollability를 가정하지 않습니다."] },
    ],
    codeExamples: [{
      id: "java-resultset-cursor-state-machine",
      title: "before-first와 after-last getter를 같은 SQLState로 거부합니다",
      language: "java",
      filename: "CursorStateMachine.java",
      purpose: "한 row의 position transitions를 실제 ResultSet interface proxy로 분리합니다.",
      code: String.raw`import java.lang.reflect.Proxy;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;

public class CursorStateMachine {
    private static ResultSet oneRow() {
        int[] position = {-1};
        return (ResultSet) Proxy.newProxyInstance(
                CursorStateMachine.class.getClassLoader(),
                new Class<?>[]{ResultSet.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "next" -> {
                        position[0]++;
                        yield position[0] == 0;
                    }
                    case "getInt" -> {
                        if (position[0] != 0) {
                            throw new SQLException("not on current row", "24000");
                        }
                        yield 7;
                    }
                    case "close" -> null;
                    default -> throw new SQLFeatureNotSupportedException(method.getName());
                });
    }

    private static String invalidState(ResultSet rows) {
        try {
            rows.getInt("custid");
            return "unexpected";
        } catch (SQLException expected) {
            return expected.getSQLState();
        }
    }

    public static void main(String[] args) throws SQLException {
        try (ResultSet rows = oneRow()) {
            String before = invalidState(rows);
            boolean first = rows.next();
            int value = rows.getInt("custid");
            boolean second = rows.next();
            String after = invalidState(rows);

            System.out.println("before=" + before);
            System.out.println("row=" + value);
            System.out.println("nextSequence=" + first + "," + second);
            System.out.println("after=" + after);
        }
    }
}`,
      walkthrough: [
        { lines: "1-25", explanation: "position -1/0/1을 BEFORE/ON/AFTER로 사용하고 current row가 아니면 SQLState24000을 내는 one-row ResultSet을 만듭니다." },
        { lines: "27-34", explanation: "getter failure에서 message 대신 SQLState만 safe하게 추출합니다." },
        { lines: "37-48", explanation: "before getter, next true, row read, next false, after getter 순으로 state transitions를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "one-row ResultSet proxy", "no DB/network", "-Xlint:all warning0"], command: isolatedJavaRun("CursorStateMachine.java", "CursorStateMachine") },
      output: { value: "before=24000\nrow=7\nnextSequence=true,false\nafter=24000", explanation: ["next 전과 false 뒤에는 current row가 없습니다.", "첫 next만 true이고 row7을 읽습니다.", "두 invalid positions는 SQLState class24로 분류됩니다."] },
      experiments: [
        { change: "row 수를0으로 바꿉니다.", prediction: "첫 next가 false이고 getter는 계속24000입니다.", result: "single-row API도 not-found를 명시적으로 처리합니다." },
        { change: "second next 뒤 이전 value local을 반환합니다.", prediction: "cursor는 invalid인데 stale Java 값이 정상 결과처럼 보입니다.", result: "row DTO lifetime과 query outcome을 분리합니다." },
        { change: "scrollable ResultSet methods absolute/previous를 추가합니다.", prediction: "driver support와 result buffering/visibility cost가 새 contract가 됩니다.", result: "필요한 경우에만 requested type과 support를 integration test합니다." },
      ],
      sourceRefs: ["java-result-set", "java-sql-exception", "java-sql-feature-not-supported", "java-proxy", "sql-foundation-sqlstate"],
    }],
    diagnostics: [
      { symptom: "ResultSet exhausted 예외 또는 SQLState24000이 loop 뒤 발생한다.", likelyCause: "next false 뒤 getter를 호출하거나 current-row DTO를 늦게 만들었습니다.", checks: ["cursor movement와 getter 순서를 trace합니다.", "loop 밖 getter를 검색합니다.", "nested mapping callback의 lifetime을 봅니다."], fix: "next true scope 안에서 필요한 fields를 immutable DTO로 복사합니다.", prevention: "before/after invalid getter tests와 empty/one/many fixtures를 둡니다." },
      { symptom: "단건 조회가 없을 때0/null DTO를 반환한다.", likelyCause: "첫 next 반환을 확인하지 않고 primitive defaults 또는 빈 object를 만들었습니다.", checks: ["first next branch를 봅니다.", "Optional/not-found policy를 확인합니다.", "SQL NULL과 row 없음이 섞였는지 봅니다."], fix: "row 없음은 Optional.empty 또는 typed NotFound로, SQL NULL은 field policy로 따로 표현합니다.", prevention: "no-row와 null-column fixtures를 별도 유지합니다." },
    ],
    comparisons: [{ title: "single-row query 결과", options: [
      { name: "nullable DTO", chooseWhen: "legacy boundary에서 명확히 문서화된 경우", avoidWhen: "row 없음과 mapping failure/SQL NULL을 섞을 때", tradeoffs: ["간단", "null ambiguity"] },
      { name: "Optional DTO", chooseWhen: "row 없음이 정상이고 null 자체를 피할 때", avoidWhen: "collection/field까지 무분별하게 Optional로 감쌀 때", tradeoffs: ["not-found 명시", "error는 exception/result로 별도"] },
      { name: "typed result", chooseWhen: "Found/NotFound/Failure를 API contract로 모두 드러낼 때", avoidWhen: "과도한 boilerplate가 작은 경계를 가릴 때", tradeoffs: ["상태 완전성", "modeling 비용"] },
    ] }],
    expertNotes: ["Cursor validity is temporal. Avoid passing a live ResultSet outside its resource scope; map to inert values while the current row and owning statement are valid."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...connectionAndCursorChapters);

const resultMappingChapters: DetailedSession["chapters"] = [
  {
    id: "sql-null-getters-wasnull-and-boxed-types",
    title: "primitive getter의0은 SQL NULL과 실제0을 구분하지 못하므로 wasNull 또는 typed getObject를 사용합니다",
    lead: "한 row의 NULL age와 숫자0 score를 ResultSet proxy로 읽어 같은 Java0 뒤 서로 다른 null evidence를 확인합니다.",
    explanations: [
      "ResultSet.getInt 같은 primitive getter는 SQL NULL을 Java int0으로 반환합니다. 실제 database 값0과 표현이 같아 바로 뒤 wasNull을 호출해야 구분할 수 있습니다.",
      "wasNull은 가장 최근 getter가 SQL NULL을 읽었는지 묻습니다. 다른 getter를 호출한 뒤 늦게 확인하면 다른 column 결과를 설명하게 됩니다.",
      "getObject(label, Integer.class)는 지원되는 JDBC4.1 driver에서 nullable wrapper mapping을 요청할 수 있습니다. 실제 type conversion 지원은 driver/version 통합 테스트가 필요합니다.",
      "SQL NULL은 empty string, 숫자0, boolean false, row 없음과 모두 다릅니다. domain model이 unknown/not-applicable/missing 중 의미를 정해야 합니다.",
      "Optional field를 무조건 쓰거나 primitive default로 치환하기 전에 schema nullability와 업무 invariant를 확인합니다. 잘못된 default는 aggregate·filter 결과를 바꿉니다.",
      "예제 handler는 age NULL과 score0을 구분해 lastWasNull을 매 getter마다 갱신하고 exact output을 만듭니다.",
    ],
    concepts: [
      { term: "SQL NULL", definition: "값이 없거나 알려지지 않았음을 나타내는 SQL marker로 Java null/default와 자동으로 같은 의미가 아닙니다.", detail: ["three-valued logic에 영향을 줍니다.", "column nullability와 domain policy가 필요합니다."] },
      { term: "wasNull", definition: "직전에 호출한 ResultSet getter가 SQL NULL을 읽었는지 반환하는 method입니다.", detail: ["getter 바로 뒤 호출합니다.", "primitive default를 구분합니다."] },
      { term: "typed getObject", definition: "column 값을 요청한 Java reference type으로 변환해 반환하는 JDBC method입니다.", detail: ["nullable wrapper를 표현할 수 있습니다.", "driver conversion 지원을 검증합니다."] },
    ],
    codeExamples: [{
      id: "java-resultset-null-semantics",
      title: "NULL int와 실제0을 wasNull로 구분하고 boxed null을 읽습니다",
      language: "java",
      filename: "ResultSetNullSemantics.java",
      purpose: "database 없이 primitive/boxed getter와 last-read null state의 실제 ResultSet 호출 순서를 검증합니다.",
      code: String.raw`import java.lang.reflect.Proxy;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;

public class ResultSetNullSemantics {
    private static ResultSet oneRow() {
        boolean[] before = {true};
        boolean[] onRow = {false};
        boolean[] lastWasNull = {false};
        return (ResultSet) Proxy.newProxyInstance(
                ResultSetNullSemantics.class.getClassLoader(),
                new Class<?>[]{ResultSet.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "next" -> {
                        onRow[0] = before[0];
                        before[0] = false;
                        yield onRow[0];
                    }
                    case "getInt" -> {
                        requireRow(onRow[0]);
                        String label = (String) args[0];
                        lastWasNull[0] = label.equals("age");
                        yield 0;
                    }
                    case "getObject" -> {
                        requireRow(onRow[0]);
                        lastWasNull[0] = true;
                        yield null;
                    }
                    case "wasNull" -> lastWasNull[0];
                    case "close" -> null;
                    default -> throw new SQLFeatureNotSupportedException(method.getName());
                });
    }

    private static void requireRow(boolean onRow) throws SQLException {
        if (!onRow) throw new SQLException("not on row", "24000");
    }

    public static void main(String[] args) throws SQLException {
        try (ResultSet rows = oneRow()) {
            if (!rows.next()) throw new SQLException("missing fixture row");
            int age = rows.getInt("age");
            boolean ageNull = rows.wasNull();
            int score = rows.getInt("score");
            boolean scoreNull = rows.wasNull();
            Integer boxedAge = rows.getObject("age", Integer.class);
            boolean boxedNull = rows.wasNull();

            System.out.println("agePrimitive=" + age + ",wasNull=" + ageNull);
            System.out.println("scorePrimitive=" + score + ",wasNull=" + scoreNull);
            System.out.println("ageBoxed=" + boxedAge + ",wasNull=" + boxedNull);
        }
    }
}`,
      walkthrough: [
        { lines: "1-35", explanation: "one-row cursor와 각 getter 직후 갱신되는 lastWasNull을 가진 ResultSet proxy를 만듭니다." },
        { lines: "37-39", explanation: "current row가 아니면 SQLState24000으로 fail-fast합니다." },
        { lines: "42-51", explanation: "age NULL, score actual0, boxed age NULL을 getter 바로 뒤 wasNull과 함께 읽습니다." },
        { lines: "53-55", explanation: "같은 primitive0의 서로 다른 의미와 reference null을 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "one-row ResultSet proxy", "NULL+zero fixtures", "no DB/network", "-Xlint:all warning0"], command: isolatedJavaRun("ResultSetNullSemantics.java", "ResultSetNullSemantics") },
      output: { value: "agePrimitive=0,wasNull=true\nscorePrimitive=0,wasNull=false\nageBoxed=null,wasNull=true", explanation: ["age primitive0은 SQL NULL에서 왔습니다.", "score primitive0은 실제 값0입니다.", "typed getObject는 nullable Integer를 반환합니다."] },
      experiments: [
        { change: "age getInt 뒤 score getInt를 먼저 호출하고 wasNull을 확인합니다.", prediction: "false가 되어 age NULL evidence를 잃습니다.", result: "wasNull은 해당 getter 바로 다음 줄에서 읽습니다." },
        { change: "NULL age를 업무 나이0으로 저장합니다.", prediction: "unknown과 실제 신생아/invalid value 의미가 섞입니다.", result: "schema와 domain null policy를 명시합니다." },
        { change: "driver가 typed getObject를 지원하지 않는 fixture를 추가합니다.", prediction: "SQLFeatureNotSupportedException 또는 conversion SQLException이 납니다.", result: "fallback conversion을 driver matrix로 설계합니다." },
      ],
      sourceRefs: ["java-result-set", "java-sql-exception", "java-sql-feature-not-supported", "java-proxy", "jdbc-spec-42", "sql-null-three-valued-logic"],
    }],
    diagnostics: [
      { symptom: "NULL numeric column이0으로 저장되어 통계가 왜곡된다.", likelyCause: "getInt result 뒤 wasNull을 확인하지 않고 primitive default를 domain value로 사용했습니다.", checks: ["schema nullability를 봅니다.", "getter/wasNull adjacency를 봅니다.", "mapping DTO field type을 확인합니다."], fix: "wasNull 또는 supported typed getObject로 nullable state를 보존하고 domain policy에서 변환합니다.", prevention: "NULL·0·negative·max boundary fixtures를 mapping test에 둡니다." },
      { symptom: "wasNull이 예상과 반대로 나온다.", likelyCause: "확인하려던 getter 뒤 다른 getter를 호출해 last-read state가 바뀌었습니다.", checks: ["직전 ResultSet getter를 확인합니다.", "helper가 내부 getter를 더 호출하는지 봅니다.", "driver conversion path를 확인합니다."], fix: "각 nullable primitive getter와 wasNull을 한 mapping expression/block에 붙입니다.", prevention: "mapper code review에서 getter-wasNull adjacency를 검사합니다." },
    ],
    comparisons: [{ title: "nullable numeric mapping", options: [
      { name: "getInt + wasNull", chooseWhen: "광범위한 driver 호환성과 primitive getter가 필요할 때", avoidWhen: "wasNull adjacency를 보장하기 어려운 abstraction일 때", tradeoffs: ["portable pattern", "두 calls·temporal coupling"] },
      { name: "getObject(Integer.class)", chooseWhen: "driver가 JDBC typed conversion을 지원하고 nullable wrapper가 자연스러울 때", avoidWhen: "vendor/version conversion 차이를 검증하지 않았을 때", tradeoffs: ["명시 nullable", "support matrix 필요"] },
      { name: "SQL COALESCE", chooseWhen: "업무적으로 명확한 default를 query contract가 정의할 때", avoidWhen: "unknown을 편의상0으로 숨길 때", tradeoffs: ["DB에서 non-null projection", "원래 null 정보 소실"] },
    ] }],
    expertNotes: ["Null handling belongs to the query contract and domain model together; neither the JDBC primitive default nor a generic mapper can infer business meaning."],
  },
  {
    id: "resultset-metadata-column-label-type-schema",
    title: "ResultSetMetaData로 projection의 column count·label·origin name·JDBC type을 검증합니다",
    lead: "세 column metadata proxy를 읽어 alias 기반 mapping contract와 underlying name/type 차이를 exact 표로 만듭니다.",
    explanations: [
      "ResultSetMetaData column index는1부터 시작합니다. Java array의0-based 습관으로 loop를 시작하면 invalid index 또는 첫 column 누락이 생깁니다.",
      "getColumnLabel은 SQL AS alias를 우선하고 getColumnName은 underlying source name을 나타낼 수 있습니다. mapping에는 label, provenance/diagnostic에는 name을 함께 사용할 수 있습니다.",
      "SELECT *는 schema column 추가·순서 변경에 mapping을 암묵 결합합니다. 명시 projection과 aliases, expected metadata를 사용하면 drift를 빠르게 발견합니다.",
      "getColumnType의 int code는 java.sql.Types/JDBCType과 연결됩니다. type name string은 vendor-specific일 수 있어 standard code와 vendor metadata를 구분합니다.",
      "timestamp/time zone, decimal precision/scale, unsigned types와 national character set은 단순 class name만으로 완전히 설명되지 않습니다. precision·scale·nullable·typeName을 integration evidence로 확장합니다.",
      "metadata validation 비용을 매 row마다 반복하지 말고 query/result schema boundary에서 한 번 수행한 뒤 rows를 mapping합니다.",
    ],
    concepts: [
      { term: "ResultSetMetaData", definition: "query result columns의 count, labels, names, SQL types와 속성을 제공하는 metadata interface입니다.", detail: ["indexes are 1-based입니다.", "driver가 구현합니다."] },
      { term: "projection schema", definition: "SELECT list가 외부에 제공하는 ordered labels와 types의 계약입니다.", detail: ["table schema와 동일하지 않을 수 있습니다.", "aliases가 안정된 mapping key가 됩니다."] },
      { term: "JDBCType", definition: "java.sql.Types integer codes를 type-safe enum으로 표현하는 JDBC 표준 type 분류입니다.", detail: ["vendor typeName과 구분합니다.", "Java mapping은 별도입니다."] },
    ],
    codeExamples: [{
      id: "java-resultset-metadata-contract",
      title: "alias·origin name·JDBCType 세 column schema를 읽습니다",
      language: "java",
      filename: "MetadataContract.java",
      purpose: "실제 database 없이 ResultSetMetaData의 1-based access와 projection schema를 검증합니다.",
      code: String.raw`import java.lang.reflect.Proxy;
import java.sql.JDBCType;
import java.sql.ResultSetMetaData;
import java.sql.SQLFeatureNotSupportedException;

public class MetadataContract {
    private static ResultSetMetaData metadata() {
        String[] names = {"custid", "name", "created_at"};
        String[] labels = {"id", "display_name", "createdAt"};
        JDBCType[] types = {
                JDBCType.INTEGER, JDBCType.VARCHAR, JDBCType.TIMESTAMP_WITH_TIMEZONE
        };
        return (ResultSetMetaData) Proxy.newProxyInstance(
                MetadataContract.class.getClassLoader(),
                new Class<?>[]{ResultSetMetaData.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("getColumnCount")) return names.length;
                    int index = ((Integer) args[0]) - 1;
                    return switch (method.getName()) {
                        case "getColumnName" -> names[index];
                        case "getColumnLabel" -> labels[index];
                        case "getColumnType" -> types[index].getVendorTypeNumber();
                        default -> throw new SQLFeatureNotSupportedException(method.getName());
                    };
                });
    }

    public static void main(String[] args) throws Exception {
        ResultSetMetaData metadata = metadata();
        int count = metadata.getColumnCount();
        System.out.println("columns=" + count);
        for (int index = 1; index <= count; index++) {
            JDBCType type = JDBCType.valueOf(metadata.getColumnType(index));
            System.out.println(index + ":" + metadata.getColumnLabel(index)
                    + "<-" + metadata.getColumnName(index) + ":" + type.getName());
        }
    }
}`,
      walkthrough: [
        { lines: "1-11", explanation: "origin names, public aliases와 standard JDBC types의 ordered projection을 정의합니다." },
        { lines: "12-25", explanation: "count와 1-based name/label/type calls만 지원하는 ResultSetMetaData proxy를 만듭니다." },
        { lines: "28-36", explanation: "index1부터 count까지 type code를 enum으로 바꾸고 label<-name:type schema를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "ResultSetMetaData proxy", "three-column schema", "no DB/network", "-Xlint:all warning0"], command: isolatedJavaRun("MetadataContract.java", "MetadataContract") },
      output: { value: "columns=3\n1:id<-custid:INTEGER\n2:display_name<-name:VARCHAR\n3:createdAt<-created_at:TIMESTAMP_WITH_TIMEZONE", explanation: ["metadata index는1부터 시작합니다.", "aliases와 origin names를 모두 보존합니다.", "type int를 standard JDBCType으로 해석합니다."] },
      experiments: [
        { change: "loop를 index=0에서 시작합니다.", prediction: "proxy array index -1 또는 실제 driver invalid column index가 납니다.", result: "JDBC metadata/getter indexes는1-based입니다." },
        { change: "display_name alias를 제거합니다.", prediction: "column label이 origin name으로 바뀌어 alias 기반 mapper schema가 실패합니다.", result: "projection alias를 API contract로 versioning합니다." },
        { change: "createdAt type을 TIMESTAMP로 바꿉니다.", prediction: "time-zone-preserving mapping expectation과 metadata test가 불일치합니다.", result: "temporal type과 zone policy를 schema/test에 명시합니다." },
      ],
      sourceRefs: ["java-result-set-metadata", "java-jdbc-type", "java-types", "java-proxy", "java-sql-feature-not-supported", "jdbc-spec-42"],
    }],
    diagnostics: [
      { symptom: "column index out of range 또는 첫 column이 누락된다.", likelyCause: "JDBC column indexes를0-based로 순회했습니다.", checks: ["loop start/end를 봅니다.", "getColumnCount를 사용했는지 봅니다.", "hard-coded offsets를 검색합니다."], fix: "index1..count inclusive로 순회하고 mapping test에서 ordered schema를 assert합니다.", prevention: "JDBC index와 Java collection index 변환을 한 helper에 제한합니다." },
      { symptom: "SQL alias 변경 뒤 mapper가 column not found로 실패한다.", likelyCause: "getColumnLabel 기반 mapping contract가 query projection과 함께 versioning되지 않았습니다.", checks: ["SELECT aliases를 봅니다.", "getColumnLabel/name metadata를 기록합니다.", "duplicate labels를 확인합니다."], fix: "명시 projection aliases와 expected metadata contract를 같은 change로 갱신합니다.", prevention: "query별 label/type schema snapshot과 integration test를 둡니다." },
    ],
    comparisons: [{ title: "schema drift 발견 시점", options: [
      { name: "getter failure", chooseWhen: "최소 validation으로 driver가 자연스럽게 실패하게 할 때", avoidWhen: "partial rows 처리 뒤 늦게 drift를 발견할 때", tradeoffs: ["단순", "diagnostic context 부족"] },
      { name: "metadata fail-fast", chooseWhen: "mapping 전에 ordered labels/types를 검증할 때", avoidWhen: "매 row마다 metadata를 반복할 때", tradeoffs: ["명확한 drift", "driver metadata 차이 고려"] },
      { name: "generated mapper", chooseWhen: "schema/code generation pipeline이 single source of truth일 때", avoidWhen: "runtime migrations와 generated artifact version이 어긋날 때", tradeoffs: ["compile-time 도움", "generation/version 운영"] },
    ] }],
    expertNotes: ["Metadata is a driver-reported view of the result, not an excuse for SELECT *. Define stable projections and validate the vendor/version behaviors you depend on."],
  },
  {
    id: "executeupdate-affected-row-contract",
    title: "executeUpdate의 영향 행0은 정상 결과이며 기대 cardinality와 비교해야 합니다",
    lead: "같은 fixed update를 두 번 실행하는 Statement proxy로1행 성공과0행 no-match를 exception 없이 구분합니다.",
    explanations: [
      "executeUpdate는 INSERT/UPDATE/DELETE의 영향 행 수를 int로 반환하고 일부 DDL은0을 반환합니다. SQL 실행 성공과 업무 대상 존재는 별도입니다.",
      "update-by-id가 정확히 한 row여야 한다면 result==1을 검사합니다.0은 not-found/already-state,1보다 크면 predicate/schema invariant 오류일 수 있습니다.",
      "원본의 result>0은 write가 하나 이상 됐다는 것만 확인합니다. 업무 cardinality가 single-row라면 >0보다 정확한 contract가 필요합니다.",
      "Statement에 runtime input을 문자열 연결하지 않습니다. 이 세션 예제 SQL은 완전한 fixed fixture이고 user values binding은 다음 PreparedStatement 세션에서 다룹니다.",
      "affected rows semantics는 driver/database 설정, no-op update와 triggers에 따라 차이가 있을 수 있습니다. 사용하는 DB의 changed/matched rows behavior를 integration test합니다.",
      "영향 행을 확인해도 commit durability를 증명하지 않습니다. transaction/commit/rollback boundary는 jdbc-02에서 별도로 다룹니다.",
    ],
    concepts: [
      { term: "affected row count", definition: "write statement 실행이 영향을 주었다고 driver가 보고한 row 수입니다.", detail: ["0도 정상 반환입니다.", "업무 cardinality와 비교합니다."] },
      { term: "no-match outcome", definition: "predicate에 해당하는 row가 없어 write 대상이0인 정상 업무 상태입니다.", detail: ["SQLException과 다릅니다.", "not-found/already-deleted 정책을 정합니다."] },
      { term: "cardinality invariant", definition: "한 operation이 기대하는 row 수 범위입니다.", detail: ["by-id update는 흔히 exactly1입니다.", "범위 update는 별도 expectation입니다."] },
    ],
    codeExamples: [{
      id: "java-statement-affected-rows",
      title: "첫 update1과 둘째 update0을 같은 fixed SQL에서 반환합니다",
      language: "java",
      filename: "AffectedRows.java",
      purpose: "실제 mutation 없이 executeUpdate int contract와 zero-is-not-exception을 검증합니다.",
      code: String.raw`import java.lang.reflect.Proxy;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.sql.Statement;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

public class AffectedRows {
    private static Statement statement(AtomicBoolean closed) {
        AtomicInteger remaining = new AtomicInteger(1);
        return (Statement) Proxy.newProxyInstance(
                AffectedRows.class.getClassLoader(), new Class<?>[]{Statement.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "executeUpdate" -> {
                        if (!"update customer set active=false where custid=7".equals(args[0])) {
                            throw new SQLException("unexpected SQL", "42000");
                        }
                        yield remaining.getAndUpdate(value -> 0);
                    }
                    case "close" -> {
                        closed.set(true);
                        yield null;
                    }
                    case "isClosed" -> closed.get();
                    default -> throw new SQLFeatureNotSupportedException(method.getName());
                });
    }

    public static void main(String[] args) throws SQLException {
        AtomicBoolean closed = new AtomicBoolean();
        int first;
        int second;
        try (Statement statement = statement(closed)) {
            String fixedSql = "update customer set active=false where custid=7";
            first = statement.executeUpdate(fixedSql);
            second = statement.executeUpdate(fixedSql);
        }

        System.out.println("first=" + first);
        System.out.println("second=" + second);
        System.out.println("zeroIsNotException=" + (second == 0));
        System.out.println("closed=" + closed.get());
    }
}`,
      walkthrough: [
        { lines: "1-27", explanation: "한 fixed SQL만 허용하고 remaining1을 첫 영향 행으로 소비한 뒤0을 반환하는 Statement proxy를 정의합니다." },
        { lines: "29-37", explanation: "같은 fixed fixture update를 두 번 실행하고 try-with-resources로 Statement를 닫습니다." },
        { lines: "39-42", explanation: "1/0 결과,0이 exception이 아님과 close evidence를 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "Statement proxy", "no database mutation", "fixed SQL only", "-Xlint:all warning0"], command: isolatedJavaRun("AffectedRows.java", "AffectedRows") },
      output: { value: "first=1\nsecond=0\nzeroIsNotException=true\nclosed=true", explanation: ["첫 fixed update는 한 row를 보고합니다.", "둘째는 matching row 없음0입니다.", "Statement lifecycle도 종료됩니다."] },
      experiments: [
        { change: "fake가2를 반환하게 합니다.", prediction: "result>0 검사는 성공 처리하지만 exactly-one invariant는 위반됩니다.", result: "operation별 expected cardinality를 assert합니다." },
        { change: "0일 때 SQLException을 인위적으로 던집니다.", prediction: "정상 no-match와 database failure를 섞어 retry/user response가 잘못됩니다.", result: "affected0은 domain outcome으로 분류합니다." },
        { change: "custid를 user input 문자열 연결로 바꿉니다.", prediction: "SQL injection과 plan/type 문제를 만듭니다.", result: "jdbc-02에서 PreparedStatement placeholder binding을 사용합니다." },
      ],
      sourceRefs: ["java-statement", "java-sql-exception", "java-sql-feature-not-supported", "java-proxy", "java-atomic-integer", "java-atomic-boolean", "jdbc-spec-42"],
    }],
    diagnostics: [
      { symptom: "update가 exception 없이 끝났지만 실제 대상이 바뀌지 않았다.", likelyCause: "executeUpdate0을 성공으로 무시했거나 predicate가 matching row를 찾지 못했습니다.", checks: ["affected rows를 기록합니다.", "expected cardinality와 predicate를 봅니다.", "transaction commit 경계를 확인합니다."], fix: "0을 NotFound/NoChange 정책으로 처리하고 exactly-one operation은 result==1을 검증합니다.", prevention: "0/1/>1 fixtures와 concurrent delete/update cases를 둡니다." },
      { symptom: "by-id update가 여러 rows를 바꿨는데 정상 처리됐다.", likelyCause: "result>0만 검사해 uniqueness/predicate drift를 놓쳤습니다.", checks: ["affected count와 unique constraint를 봅니다.", "WHERE predicate를 검토합니다.", "tenant scope 누락을 확인합니다."], fix: "즉시 operation을 cardinality violation으로 실패시키고 schema/predicate를 교정합니다.", prevention: "unique key와 tenant predicate, exactly-one assertion을 함께 유지합니다." },
    ],
    comparisons: [{ title: "write result 해석", options: [
      { name: "result > 0", chooseWhen: "범위 작업에서 한 건 이상이면 충분한 명시 contract일 때", avoidWhen: "single-row invariant를 검증할 때", tradeoffs: ["간단", "과다 영향 감지 못함"] },
      { name: "result == 1", chooseWhen: "unique id 대상 exactly-one write일 때", avoidWhen: "batch/range/driver-specific counts일 때", tradeoffs: ["강한 invariant", "DB semantics 검증 필요"] },
      { name: "result >= 0 기록", chooseWhen: "DDL/batch/vendor semantics를 진단 record로 보존할 때", avoidWhen: "업무 성공 판정을 생략할 때", tradeoffs: ["evidence 풍부", "별도 policy 필요"] },
    ] }],
    expertNotes: ["Affected rows are an observable contract, not a universal definition of changed business entities; verify vendor flags, triggers, and transaction outcome where it matters."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...resultMappingChapters);

const executionAndFailureChapters: DetailedSession["chapters"] = [
  {
    id: "statement-execute-result-kind-and-more-results",
    title: "Statement.execute의 boolean은 성공 여부가 아니라 첫 결과가 ResultSet인지 뜻합니다",
    lead: "select와 write를 같은 execute entry point로 보내 true/false, getResultSet, getUpdateCount와 결과 종료 sentinel -1을 구분합니다.",
    explanations: [
      "executeQuery는 row result가 확실할 때, executeUpdate는 update count가 확실할 때 가장 명확합니다. execute는 결과 종류가 동적인 SQL/procedure에 사용합니다.",
      "execute가 true면 current result가 ResultSet이고 false면 update count이거나 더 결과가 없을 수 있습니다. false를 SQL 실패로 해석하면 안 됩니다.",
      "false 뒤 getUpdateCount가-1이면 더 이상 결과가 없다는 sentinel입니다.0은 실제 update count일 수 있으므로 -1과 구분합니다.",
      "여러 results를 반환하는 driver/procedure에서는 getMoreResults와 getUpdateCount를 반복하고 current ResultSet close policy를 정해야 합니다.",
      "getMoreResults(int)에는 CLOSE_CURRENT_RESULT, KEEP_CURRENT_RESULT, CLOSE_ALL_RESULTS options가 있지만 driver support와 memory/resource cost를 확인합니다.",
      "예제 fake는 select→ResultSet, delete→updateCount2, getMoreResults→end -1을 deterministic state로 구현합니다.",
    ],
    concepts: [
      { term: "execute boolean", definition: "Statement.execute가 만든 첫 current result가 ResultSet이면 true, 아니면 false인 result-kind signal입니다.", detail: ["성공 boolean이 아닙니다.", "false 뒤 update count를 확인합니다."] },
      { term: "update-count sentinel", definition: "getUpdateCount의 -1이 current result가 row count가 아니거나 더 결과가 없음을 나타내는 규칙입니다.", detail: ["0과 다릅니다.", "multiple result loop 종료에 사용합니다."] },
      { term: "multiple results", definition: "한 statement 실행이 ResultSet과 update count를 순차적으로 여러 개 제공하는 JDBC contract입니다.", detail: ["getMoreResults로 전진합니다.", "각 ResultSet ownership을 정합니다."] },
    ],
    codeExamples: [{
      id: "java-statement-execute-result-kinds",
      title: "execute true/resultset와 false/updateCount, end -1을 검증합니다",
      language: "java",
      filename: "ExecuteResultKinds.java",
      purpose: "실제 DB 없이 Statement의 general execute result state machine을 actual interfaces로 실행합니다.",
      code: String.raw`import java.lang.reflect.Proxy;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.sql.Statement;

public class ExecuteResultKinds {
    private static ResultSet emptyRows() {
        return (ResultSet) Proxy.newProxyInstance(
                ExecuteResultKinds.class.getClassLoader(), new Class<?>[]{ResultSet.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "next" -> false;
                    case "close" -> null;
                    default -> throw new SQLFeatureNotSupportedException(method.getName());
                });
    }

    private static Statement statement() {
        ResultSet rows = emptyRows();
        String[] kind = {"none"};
        int[] updateCount = {-1};
        return (Statement) Proxy.newProxyInstance(
                ExecuteResultKinds.class.getClassLoader(), new Class<?>[]{Statement.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "execute" -> {
                        String sql = (String) args[0];
                        if (sql.startsWith("select ")) {
                            kind[0] = "rows";
                            updateCount[0] = -1;
                            yield true;
                        }
                        if (sql.startsWith("delete ")) {
                            kind[0] = "count";
                            updateCount[0] = 2;
                            yield false;
                        }
                        throw new SQLException("unexpected SQL", "42000");
                    }
                    case "getResultSet" -> kind[0].equals("rows") ? rows : null;
                    case "getUpdateCount" -> updateCount[0];
                    case "getMoreResults" -> {
                        kind[0] = "none";
                        updateCount[0] = -1;
                        yield false;
                    }
                    case "close" -> null;
                    default -> throw new SQLFeatureNotSupportedException(method.getName());
                });
    }

    public static void main(String[] args) throws SQLException {
        try (Statement statement = statement()) {
            boolean queryReturnsRows = statement.execute(
                    "select custid from customer where active=true");
            boolean hasResultSet;
            try (ResultSet rows = statement.getResultSet()) {
                hasResultSet = rows != null;
            }
            boolean updateReturnsRows = statement.execute(
                    "delete from customer where expired=true");
            int affected = statement.getUpdateCount();
            boolean more = statement.getMoreResults();
            int endCount = statement.getUpdateCount();

            System.out.println("queryReturnsRows=" + queryReturnsRows);
            System.out.println("queryHasResultSet=" + hasResultSet);
            System.out.println("updateReturnsRows=" + updateReturnsRows);
            System.out.println("updateCount=" + affected);
            System.out.println("more=" + more);
            System.out.println("endCount=" + endCount);
        }
    }
}`,
      walkthrough: [
        { lines: "1-16", explanation: "next false와 close만 지원하는 empty ResultSet을 만들어 row-result handle로 사용합니다." },
        { lines: "18-49", explanation: "select는 rows/true, delete는 count2/false, getMoreResults는 none/-1로 전이하는 Statement proxy를 정의합니다." },
        { lines: "52-64", explanation: "두 SQL result kinds와 ResultSet ownership, update count, result-sequence 종료를 순서대로 읽습니다." },
        { lines: "66-71", explanation: "boolean의 result-kind 의미와 count2/end-1을 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "Statement/ResultSet proxies", "fixed SQL fixtures", "no DB/network", "-Xlint:all warning0"], command: isolatedJavaRun("ExecuteResultKinds.java", "ExecuteResultKinds") },
      output: { value: "queryReturnsRows=true\nqueryHasResultSet=true\nupdateReturnsRows=false\nupdateCount=2\nmore=false\nendCount=-1", explanation: ["true는 첫 결과가 ResultSet임을 뜻합니다.", "write의 false 뒤 count2를 읽습니다.", "more false와 count-1 조합이 sequence 끝입니다."] },
      experiments: [
        { change: "false를 failure boolean으로 처리합니다.", prediction: "정상 delete count2를 오류로 오분류합니다.", result: "execute boolean을 result kind로 이름 붙입니다." },
        { change: "update count0을 end로 간주합니다.", prediction: "0-row write와 results 종료를 구분하지 못합니다.", result: "종료 sentinel은 -1입니다." },
        { change: "current ResultSet을 닫지 않고 getMoreResults를 반복합니다.", prediction: "driver policy에 따라 자동 close 또는 open result resource 누적이 생깁니다.", result: "getMoreResults close option과 ownership을 명시합니다." },
      ],
      sourceRefs: ["java-statement", "java-result-set", "java-sql-exception", "java-sql-feature-not-supported", "java-proxy", "jdbc-spec-42"],
    }],
    diagnostics: [
      { symptom: "execute가 false라 database failure로 처리했지만 SQL은 반영됐다.", likelyCause: "boolean을 성공 여부로 오해했습니다.", checks: ["getUpdateCount를 봅니다.", "SQLException이 실제로 있었는지 봅니다.", "result-kind branch 이름을 확인합니다."], fix: "true면 getResultSet, false면 getUpdateCount를 읽고-1과 count를 구분합니다.", prevention: "query/count/end fixtures로 general execute state machine을 테스트합니다." },
      { symptom: "stored procedure 뒤 ResultSet resource가 누수된다.", likelyCause: "multiple results를 전진하며 current ResultSet close policy를 적용하지 않았습니다.", checks: ["getMoreResults overload를 봅니다.", "각 ResultSet try scope를 확인합니다.", "driver open cursors metric을 봅니다."], fix: "각 result를 소비·close하고 CLOSE_CURRENT_RESULT 등 지원 policy를 사용합니다.", prevention: "mixed rows/counts와 early-exit failure fixtures를 둡니다." },
    ],
    comparisons: [{ title: "Statement 실행 method", options: [
      { name: "executeQuery", chooseWhen: "정확히 하나 ResultSet을 반환하는 SELECT 계약일 때", avoidWhen: "write/count 또는 multiple result SQL일 때", tradeoffs: ["명시 row contract", "잘못된 SQL kind는 failure"] },
      { name: "executeUpdate", chooseWhen: "write/DDL의 update count를 받을 때", avoidWhen: "row ResultSet을 기대할 때", tradeoffs: ["명시 count contract", "vendor count semantics"] },
      { name: "execute", chooseWhen: "result kind가 동적이거나 multiple results일 때", avoidWhen: "단순 query/write를 불필요하게 복잡하게 만들 때", tradeoffs: ["일반적", "state loop와 resource ownership 필요"] },
    ] }],
    expertNotes: ["For multiple results, termination is represented by both getMoreResults returning false and getUpdateCount returning -1; preserve this distinction from a legitimate update count of zero."],
  },
  {
    id: "try-with-resources-close-order-suppressed-failures",
    title: "try-with-resources는 역순으로 닫고 body failure를 primary로 유지한 채 close failure를 suppressed에 붙입니다",
    lead: "Connection→Statement→ResultSet 역할의 세 AutoCloseable fixture로 close order와 query/close 복합 실패를 exact 확인합니다.",
    explanations: [
      "JDBC acquisition은 보통 Connection, Statement, ResultSet 순서이고 close는 ResultSet, Statement, Connection 역순이어야 합니다. try-with-resources가 lexical nesting으로 표현합니다.",
      "try body가 SQLException을 던지고 close도 실패하면 body exception이 primary로 유지되고 close exception은 getSuppressed에 추가됩니다.",
      "manual finally에서 close exception을 새 RuntimeException으로 던지면 원래 query failure를 가릴 수 있습니다. 빈 catch는 반대로 cleanup failure를 완전히 잃습니다.",
      "resource acquisition 중 둘째 생성이 실패하면 이미 생성된 첫 resource만 자동 close됩니다. 아직 얻지 못한 resource에 null close가 필요 없습니다.",
      "실제 pool logical Connection.close도 SQLException을 낼 수 있으므로 primary·suppressed·next exception·cause를 모두 진단하되 user response에는 redacted category만 냅니다.",
      "예제 Tracked는 언어 close semantics를 격리합니다. 실제 JDBC interfaces의 close cascade/vendor behavior는 integration test로 보강합니다.",
    ],
    concepts: [
      { term: "reverse close order", definition: "resources를 선언한 순서의 반대로 close하는 try-with-resources 규칙입니다.", detail: ["ResultSet→Statement→Connection에 맞습니다.", "wrapper ownership에도 적용합니다."] },
      { term: "primary exception", definition: "try body 또는 먼저 발생한 close failure 중 밖으로 전달되는 대표 Throwable입니다.", detail: ["body failure가 있으면 유지됩니다.", "나머지 close failures는 suppressed입니다."] },
      { term: "suppressed exception", definition: "primary failure를 보존하면서 resource close 중 추가로 발생한 Throwable을 연결한 evidence입니다.", detail: ["getSuppressed로 읽습니다.", "cause/next SQLException과 다른 chain입니다."] },
    ],
    codeExamples: [{
      id: "java-jdbc-shaped-close-suppression",
      title: "result→statement→connection close와 statement close suppression을 확인합니다",
      language: "java",
      filename: "JdbcCloseSuppression.java",
      purpose: "DB 없이 Java language resource semantics를 JDBC ownership names로 재현합니다.",
      code: String.raw`import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class JdbcCloseSuppression {
    private static final class Tracked implements AutoCloseable {
        private final String name;
        private final boolean fail;
        private final List<String> order;

        Tracked(String name, boolean fail, List<String> order) {
            this.name = name;
            this.fail = fail;
            this.order = order;
        }

        @Override
        public void close() throws SQLException {
            order.add(name);
            if (fail) throw new SQLException(name + "-close-failed", "08006");
        }
    }

    public static void main(String[] args) {
        List<String> order = new ArrayList<>();
        String primary = "none";
        String suppressed = "none";
        try (Tracked connection = new Tracked("connection", false, order);
             Tracked statement = new Tracked("statement", true, order);
             Tracked result = new Tracked("result", false, order)) {
            if (connection == statement || statement == result) {
                throw new IllegalStateException("resource identity collision");
            }
            throw new SQLException("query-failed", "42000");
        } catch (SQLException error) {
            primary = error.getMessage();
            if (error.getSuppressed().length == 1) {
                suppressed = error.getSuppressed()[0].getMessage();
            }
        }

        System.out.println("close=" + String.join(",", order));
        System.out.println("primary=" + primary);
        System.out.println("suppressed=" + suppressed);
    }
}`,
      walkthrough: [
        { lines: "1-21", explanation: "close name을 기록하고 선택적으로 SQLState08006 close failure를 내는 resource fixture를 정의합니다." },
        { lines: "23-34", explanation: "connection→statement→result 순서로 acquire하고 세 handle identity를 body에서 검증한 뒤 query failure를 발생시킵니다." },
        { lines: "35-40", explanation: "primary query message와 정확히 한 suppressed statement-close message를 추출합니다." },
        { lines: "42-44", explanation: "역순 close와 두 failure roles를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "JDK AutoCloseable semantics", "controlled SQLException fixtures", "no DB/network", "-Xlint:all warning0"], command: isolatedJavaRun("JdbcCloseSuppression.java", "JdbcCloseSuppression") },
      output: { value: "close=result,statement,connection\nprimary=query-failed\nsuppressed=statement-close-failed", explanation: ["세 resources가 역순으로 닫힙니다.", "body query failure가 primary입니다.", "statement close failure가 suppressed로 보존됩니다."] },
      experiments: [
        { change: "result와 connection close도 실패하게 합니다.", prediction: "primary는 query이고 suppressed가 result,statement,connection close 순으로 세 개 붙습니다.", result: "모든 suppressed를 순회해 진단합니다." },
        { change: "body가 정상 return하게 합니다.", prediction: "statement close failure가 primary가 되고 이후 connection close failure가 있다면 suppressed됩니다.", result: "close-only failure도 업무 결과를 실패시킬 수 있습니다." },
        { change: "manual finally에서 statement close exception을 throw합니다.", prediction: "query failure를 잃거나 복잡한 nested catch가 필요합니다.", result: "try-with-resources compiler translation을 우선합니다." },
      ],
      sourceRefs: ["jls-14-try-with-resources", "java-auto-closeable", "java-throwable", "java-sql-exception", "java-list", "java-array-list"],
    }],
    diagnostics: [
      { symptom: "로그에는 connection close failure만 있고 실제 query failure가 사라졌다.", likelyCause: "manual finally가 cleanup exception을 새로 던져 primary를 덮었습니다.", checks: ["cause와 suppressed를 봅니다.", "manual close catch를 검색합니다.", "try-with-resources 적용 여부를 확인합니다."], fix: "resources를 try header에 두고 primary/suppressed chain 전체를 보존합니다.", prevention: "body+close, acquisition+close, multi-close failure matrix를 테스트합니다." },
      { symptom: "ResultSet cursor가 계속 열려 pool/database resource를 소모한다.", likelyCause: "ResultSet을 resource scope에 넣지 않고 Statement/Connection close cascade만 가정했습니다.", checks: ["open cursor metric을 봅니다.", "nested try scopes를 봅니다.", "early return/exception path를 확인합니다."], fix: "Connection→Statement→ResultSet을 모두 try-with-resources로 명시 소유합니다.", prevention: "모든 terminal path의 close order를 fake/driver integration에서 assert합니다." },
    ],
    comparisons: [{ title: "JDBC cleanup style", options: [
      { name: "manual finally", chooseWhen: "legacy API와 복잡한 ownership을 점진 교정할 때", avoidWhen: "null checks·reverse order·failure chains를 직접 재구현할 때", tradeoffs: ["명시적이지만 장황", "mask/swallow 위험"] },
      { name: "try-with-resources", chooseWhen: "AutoCloseable acquisition과 lexical ownership을 표현할 때", avoidWhen: "caller-owned resource를 실수로 닫을 때", tradeoffs: ["역순 close·suppressed 자동", "ownership 결정 필요"] },
      { name: "framework transaction/resource", chooseWhen: "framework가 request/transaction scope를 명확히 소유할 때", avoidWhen: "native handle을 scope 밖에 보관할 때", tradeoffs: ["통합 lifecycle", "framework contract 이해 필요"] },
    ] }],
    expertNotes: ["SQLException has its own next-exception chain in addition to Throwable cause and suppressed arrays. Production diagnostics may need to traverse all three without logging raw SQL or credentials."],
  },
  {
    id: "sqlexception-sqlstate-vendor-transient-chain",
    title: "SQLException은 message가 아니라 SQLState·vendor code·subclass·next chain으로 분류합니다",
    lead: "synthetic syntax failure와 transient connection failure를 chain으로 연결하고 safe structured summary만 출력합니다.",
    explanations: [
      "SQLException은 reason message, SQLState string, vendor error code와 next SQLException chain을 가집니다. message는 driver locale/version과 raw SQL context에 따라 달라질 수 있습니다.",
      "SQLState 앞 두 characters는 class입니다.42는 syntax/access rule violation,08은 connection exception 계열이지만 retry 결정에는 operation idempotency와 total deadline도 필요합니다.",
      "SQLTransientException subclass는 같은 operation을 아무 변화 없이 retry하면 성공할 수도 있다는 힌트이지 자동 retry 명령이 아닙니다. non-idempotent write는 duplicate side effect 위험이 있습니다.",
      "SQLNonTransientException은 같은 원인 상태에서 단순 retry로 성공 가능성이 낮음을 나타냅니다. configuration/schema/constraint 문제를 먼저 수정합니다.",
      "getNextException chain은 batch/driver가 관련 database failures를 추가하는 JDBC-specific link입니다. Throwable.getCause와 getSuppressed도 별도 순회할 수 있습니다.",
      "public error에는 correlation id와 safe category를 주고 internal restricted log에 SQLState/vendor/subclass를 남깁니다. password, full URL, parameter values와 row data는 제외합니다.",
    ],
    concepts: [
      { term: "SQLState", definition: "SQL/JDBC failure category를 standard five-character code로 표현하는 field입니다.", detail: ["앞 두 문자는 class입니다.", "vendor가 null/nonstandard 값을 줄 가능성도 방어합니다."] },
      { term: "vendor code", definition: "database vendor가 제공하는 integer error identifier입니다.", detail: ["SQLState와 함께 보존합니다.", "vendor/version mapping에 의존합니다."] },
      { term: "transient exception", definition: "원인 상태가 일시적일 수 있음을 나타내는 JDBC exception category입니다.", detail: ["retry safety를 보장하지 않습니다.", "deadline/backoff/idempotency가 필요합니다."] },
    ],
    codeExamples: [{
      id: "java-sqlexception-structured-classification",
      title: "syntax primary와 transient connection next exception을 안전하게 분류합니다",
      language: "java",
      filename: "SqlExceptionClassification.java",
      purpose: "database 없이 SQLException structured fields와 next chain을 exact 확인합니다.",
      code: String.raw`import java.sql.SQLException;
import java.sql.SQLSyntaxErrorException;
import java.sql.SQLTransientConnectionException;
import java.sql.SQLTransientException;

public class SqlExceptionClassification {
    private static String category(SQLException error) {
        String state = error.getSQLState();
        if (state == null || state.length() < 2) return "unknown";
        return switch (state.substring(0, 2)) {
            case "42" -> "syntax-or-access";
            case "08" -> "connection";
            default -> "other";
        };
    }

    public static void main(String[] args) {
        SQLException primary = new SQLSyntaxErrorException(
                "safe syntax failure", "42000", 1064);
        SQLException next = new SQLTransientConnectionException(
                "safe connection failure", "08001", 0);
        primary.setNextException(next);

        int chain = 0;
        for (SQLException current = primary; current != null;
             current = current.getNextException()) {
            chain++;
        }

        System.out.println("primary=" + primary.getSQLState() + "/"
                + primary.getErrorCode() + "/" + category(primary));
        System.out.println("next=" + next.getSQLState() + "/"
                + next.getErrorCode() + "/" + category(next)
                + "/transient=" + (next instanceof SQLTransientException));
        System.out.println("chain=" + chain);
        System.out.println("rawSqlLogged=false");
    }
}`,
      walkthrough: [
        { lines: "1-14", explanation: "null/short SQLState를 방어하고 standard class42/08만 safe category로 바꾸는 classifier를 정의합니다." },
        { lines: "17-22", explanation: "synthetic syntax primary와 transient connection next exception을 structured fields로 만듭니다." },
        { lines: "24-28", explanation: "getNextException chain을 null까지 순회해 count2를 확인합니다." },
        { lines: "30-37", explanation: "SQLState/vendor/category/transient와 raw SQL 미출력을 exact evidence로 남깁니다." },
      ],
      run: { environment: ["OpenJDK 21", "synthetic SQLException hierarchy", "no SQL/database/network", "-Xlint:all warning0"], command: isolatedJavaRun("SqlExceptionClassification.java", "SqlExceptionClassification") },
      output: { value: "primary=42000/1064/syntax-or-access\nnext=08001/0/connection/transient=true\nchain=2\nrawSqlLogged=false", explanation: ["primary class42와 vendor1064를 보존합니다.", "next class08은 transient subtype입니다.", "message/raw SQL 없이 chain count를 출력합니다."] },
      experiments: [
        { change: "SQLState를 null로 만듭니다.", prediction: "category unknown이 되고 NullPointerException 없이 raw subclass/vendor evidence로 fallback합니다.", result: "driver의 missing/nonstandard fields를 방어합니다." },
        { change: "transient면 write를 무조건 즉시 retry합니다.", prediction: "첫 attempt가 commit됐지만 response만 유실된 경우 duplicate mutation이 생길 수 있습니다.", result: "idempotency key·transaction outcome·backoff·deadline을 함께 요구합니다." },
        { change: "exception message 전체를 사용자에게 반환합니다.", prediction: "schema name, SQL fragment, host 또는 parameter data가 노출될 수 있습니다.", result: "public safe category와 restricted diagnostics를 분리합니다." },
      ],
      sourceRefs: ["java-sql-exception", "java-sql-syntax-error-exception", "java-sql-transient-connection-exception", "java-sql-transient-exception", "sql-foundation-sqlstate", "owasp-error-handling"],
    }],
    diagnostics: [
      { symptom: "같은 오류인데 driver upgrade 후 message parsing classifier가 깨진다.", likelyCause: "localized/free-form reason text에 의존했습니다.", checks: ["SQLState/vendor/subclass를 봅니다.", "message regex를 검색합니다.", "driver release notes를 확인합니다."], fix: "structured fields와 versioned vendor mapping으로 분류하고 unknown fallback을 둡니다.", prevention: "driver version별 exception contract tests와 unknown metric을 유지합니다." },
      { symptom: "일시적 연결 오류 retry가 중복 insert를 만들었다.", likelyCause: "transient subtype을 operation retry safety로 오해하고 commit ambiguity/idempotency를 무시했습니다.", checks: ["operation idempotency key를 봅니다.", "transaction commit acknowledgement를 확인합니다.", "retry count/deadline을 봅니다."], fix: "읽기/멱등 operation만 bounded retry하거나 deduplication/transaction protocol을 설계합니다.", prevention: "pre/post-commit disconnect와 duplicate request fault injection을 실행합니다." },
    ],
    comparisons: [{ title: "DB 오류 분류 evidence", options: [
      { name: "message text", chooseWhen: "restricted human diagnosis 보조 정보일 때", avoidWhen: "program logic·public response·metric cardinality key일 때", tradeoffs: ["상세하지만 불안정/민감", "redaction 필요"] },
      { name: "SQLState", chooseWhen: "portable top-level category와 retry 후보를 분류할 때", avoidWhen: "vendor-specific detail를 모두 설명한다고 볼 때", tradeoffs: ["표준 class", "driver completeness 차이"] },
      { name: "vendor code/subclass", chooseWhen: "특정 DB/version의 운영 playbook과 세부 action이 필요할 때", avoidWhen: "vendor migration 가능한 core domain에 직접 노출할 때", tradeoffs: ["정밀", "vendor coupling"] },
    ] }],
    expertNotes: ["Retryability is a property of an operation under a failure point and transaction protocol, not merely of an exception class."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...executionAndFailureChapters);

const poolingChapter: DetailedSession["chapters"][number] = {
  id: "datasource-pool-logical-close-timeout-bounds",
  title: "pool의 Connection.close는 logical return이며 timeout·readOnly·fetch/max-row bounds를 borrow scope에 적용합니다",
  lead: "physical resource 하나를 두 번 빌리는 JDK-only DataSource fake로 logical close2회와 bounded read settings, pool owner close를 한 번에 검증합니다.",
  explanations: [
    "production pool은 expensive physical connections를 유지하고 getConnection마다 logical wrapper를 빌려줍니다. application의 Connection.close는 보통 socket close가 아니라 pool return입니다.",
    "logical close를 빼먹으면 active slot이 고갈되어 pending borrowers와 request latency가 증가합니다. try-with-resources는 success/failure 모두에서 즉시 return하게 합니다.",
    "pool은 반환 전 autoCommit, readOnly, isolation, catalog/schema, warnings와 session-specific state를 reset해야 합니다. application은 다음 borrower에게 state가 남는다고 기대하거나 Connection을 cache하지 않습니다.",
    "Connection.setNetworkTimeout은 driver/network operation upper bound를 milliseconds로 설정하고 Statement.setQueryTimeout은 SQL execution timeout을 seconds로 요청합니다. support·scope·cancel behavior는 driver별 검증이 필요합니다.",
    "setFetchSize는 row fetch hint이고 setMaxRows는 반환 row upper bound입니다. fetch size가 전체 row limit가 아니며 maxRows만으로 server scan 비용이 사라지지 않습니다.",
    "readOnly는 optimization/intent hint일 수 있고 write 방지 보안 경계로만 믿지 않습니다. database least-privilege account와 read replica policy를 함께 둡니다.",
    "pool size는 application threads와 단순 동일하게 잡지 않습니다. DB capacity, query service time, transaction duration, downstream queues와 acquire timeout을 측정합니다.",
    "예제 StudyPool은 physicalCreated1, sequential borrows2와 returns2를 기록합니다. 첫 borrow에 bounded query settings와 one-row mapping을 적용하고 둘째 borrow로 logical reuse를 증명합니다.",
    "DataSource interface 자체는 AutoCloseable이 아니지만 실제 pool implementation은 close/shutdown API를 제공할 수 있습니다. 생성한 application component가 pool implementation lifecycle을 종료합니다.",
    "request deadline, pool acquire timeout, network timeout, query timeout의 합성 budget을 정합니다. inner timeout이 outer request보다 길어 orphan database work가 남지 않게 합니다.",
  ],
  concepts: [
    { term: "logical connection", definition: "pool의 physical database session을 일정 borrow scope 동안 대표하는 wrapper handle입니다.", detail: ["close는 pool return입니다.", "close 뒤 재사용하면 안 됩니다."] },
    { term: "pool exhaustion", definition: "모든 connection slots가 active/leaked/slow하여 새 borrower가 대기하거나 acquire timeout되는 상태입니다.", detail: ["active·idle·pending을 봅니다.", "pool 증설 전에 query/transaction duration을 진단합니다."] },
    { term: "timeout budget", definition: "request 전체 deadline 안에 acquire·network·query·retry 단계별 제한 시간을 배분한 운영 계약입니다.", detail: ["단위와 owner를 명시합니다.", "timeout 뒤 cancellation/cleanup을 확인합니다."] },
  ],
  codeExamples: [{
    id: "java-fake-datasource-pool-bounds",
    title: "physical1을 logical2회 borrow/return하고 bounded query settings를 기록합니다",
    language: "java",
    filename: "FakeDataSourcePool.java",
    purpose: "vendor pool·database 없이 DataSource, logical Connection close와 read operational bounds를 actual JDBC calls로 검증합니다.",
    code: String.raw`import java.io.PrintWriter;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.sql.Statement;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Logger;
import javax.sql.DataSource;

public class FakeDataSourcePool {
    private static final class StudyPool implements DataSource, AutoCloseable {
        private final AtomicInteger borrows = new AtomicInteger();
        private final AtomicInteger returns = new AtomicInteger();
        private final int physicalCreated = 1;
        private boolean poolClosed;
        private boolean readOnly;
        private int networkMillis;
        private int querySeconds;
        private int fetchSize;
        private int maxRows;

        @Override
        public Connection getConnection() throws SQLException {
            if (poolClosed) throw new SQLException("pool closed", "08003");
            borrows.incrementAndGet();
            AtomicBoolean logicalClosed = new AtomicBoolean();
            return (Connection) Proxy.newProxyInstance(
                    FakeDataSourcePool.class.getClassLoader(),
                    new Class<?>[]{Connection.class},
                    (proxy, method, args) -> switch (method.getName()) {
                        case "setReadOnly" -> {
                            readOnly = (Boolean) args[0];
                            yield null;
                        }
                        case "isReadOnly" -> readOnly;
                        case "setNetworkTimeout" -> {
                            Executor executor = (Executor) args[0];
                            if (executor == null) throw new SQLException("executor required");
                            networkMillis = (Integer) args[1];
                            yield null;
                        }
                        case "getNetworkTimeout" -> networkMillis;
                        case "createStatement" -> statement();
                        case "close" -> {
                            if (logicalClosed.compareAndSet(false, true)) {
                                returns.incrementAndGet();
                            }
                            yield null;
                        }
                        case "isClosed" -> logicalClosed.get();
                        case "isWrapperFor" -> false;
                        case "unwrap" -> throw new SQLFeatureNotSupportedException("unwrap");
                        default -> throw new SQLFeatureNotSupportedException(method.getName());
                    });
        }

        private Statement statement() {
            AtomicBoolean closed = new AtomicBoolean();
            return (Statement) Proxy.newProxyInstance(
                    FakeDataSourcePool.class.getClassLoader(),
                    new Class<?>[]{Statement.class},
                    (proxy, method, args) -> switch (method.getName()) {
                        case "setQueryTimeout" -> {
                            querySeconds = (Integer) args[0];
                            yield null;
                        }
                        case "setFetchSize" -> {
                            fetchSize = (Integer) args[0];
                            yield null;
                        }
                        case "setMaxRows" -> {
                            maxRows = (Integer) args[0];
                            yield null;
                        }
                        case "executeQuery" -> {
                            if (!"select custid from customer where active=true".equals(args[0])) {
                                throw new SQLException("unexpected SQL", "42000");
                            }
                            yield oneRow();
                        }
                        case "close" -> {
                            closed.set(true);
                            yield null;
                        }
                        case "isClosed" -> closed.get();
                        default -> throw new SQLFeatureNotSupportedException(method.getName());
                    });
        }

        private ResultSet oneRow() {
            AtomicInteger position = new AtomicInteger(-1);
            return (ResultSet) Proxy.newProxyInstance(
                    FakeDataSourcePool.class.getClassLoader(),
                    new Class<?>[]{ResultSet.class},
                    (proxy, method, args) -> switch (method.getName()) {
                        case "next" -> position.incrementAndGet() == 0;
                        case "getInt" -> {
                            if (position.get() != 0 || !"custid".equals(args[0])) {
                                throw new SQLException("invalid row or label", "24000");
                            }
                            yield 7;
                        }
                        case "close" -> null;
                        default -> throw new SQLFeatureNotSupportedException(method.getName());
                    });
        }

        @Override
        public Connection getConnection(String user, String password) throws SQLException {
            throw new SQLFeatureNotSupportedException("credentials supplied by pool config");
        }
        @Override public PrintWriter getLogWriter() { return null; }
        @Override public void setLogWriter(PrintWriter writer) { }
        @Override public void setLoginTimeout(int seconds) { }
        @Override public int getLoginTimeout() { return 0; }
        @Override public Logger getParentLogger() { return Logger.getGlobal(); }
        @Override public <T> T unwrap(Class<T> type) throws SQLException {
            if (type.isInstance(this)) return type.cast(this);
            throw new SQLFeatureNotSupportedException("unwrap");
        }
        @Override public boolean isWrapperFor(Class<?> type) { return type.isInstance(this); }

        @Override
        public void close() {
            if (borrows.get() != returns.get()) {
                throw new IllegalStateException("borrowed connection remains");
            }
            poolClosed = true;
        }
    }

    public static void main(String[] args) throws SQLException {
        StudyPool pool = new StudyPool();
        int row;
        try (pool) {
            try (Connection connection = pool.getConnection()) {
                connection.setReadOnly(true);
                Executor direct = Runnable::run;
                connection.setNetworkTimeout(direct, 2_000);
                try (Statement statement = connection.createStatement()) {
                    statement.setQueryTimeout(2);
                    statement.setFetchSize(50);
                    statement.setMaxRows(100);
                    try (ResultSet rows = statement.executeQuery(
                            "select custid from customer where active=true")) {
                        if (!rows.next()) throw new SQLException("missing fixture row");
                        row = rows.getInt("custid");
                    }
                }
            }
            try (Connection secondBorrow = pool.getConnection()) {
                if (secondBorrow.isClosed()) throw new SQLException("invalid logical wrapper");
            }
        }

        System.out.println("row=" + row);
        System.out.println("settings=readOnly:" + pool.readOnly
                + ",networkMs:" + pool.networkMillis
                + ",querySeconds:" + pool.querySeconds
                + ",fetch:" + pool.fetchSize + ",maxRows:" + pool.maxRows);
        System.out.println("physicalCreated=" + pool.physicalCreated);
        System.out.println("borrows=" + pool.borrows.get());
        System.out.println("returns=" + pool.returns.get());
        System.out.println("poolClosed=" + pool.poolClosed);
    }
}`,
    walkthrough: [
      { lines: "1-24", explanation: "JDK/ JDBC/DataSource types와 physical1, borrow/return, bounded settings state를 가진 owned fake pool을 정의합니다." },
      { lines: "26-57", explanation: "borrow마다 새 logical Connection proxy를 만들고 readOnly/network timeout, statement factory와 idempotent logical return을 구현합니다." },
      { lines: "59-88", explanation: "query/fetch/max-row settings와 fixed SQL만 받는 Statement proxy를 구현합니다." },
      { lines: "90-108", explanation: "한 row와 current-position/label validation을 가진 ResultSet proxy를 만듭니다." },
      { lines: "110-134", explanation: "DataSource administrative methods와 unwrap, outstanding borrow0을 요구하는 pool owner close를 구현합니다." },
      { lines: "136-158", explanation: "첫 borrow에서 bounded read를 수행하고 둘째 logical borrow를 close한 뒤 pool을 종료합니다." },
      { lines: "160-170", explanation: "row, settings, physical1/borrow2/return2와 poolClosed를 exact 출력합니다." },
    ],
    run: { environment: ["OpenJDK 21", "JDK-only DataSource/Connection/Statement/ResultSet proxies", "physical1 logical2", "no vendor pool/DB/network", "-Xlint:all warning0"], command: isolatedJavaRun("FakeDataSourcePool.java", "FakeDataSourcePool") },
    output: { value: "row=7\nsettings=readOnly:true,networkMs:2000,querySeconds:2,fetch:50,maxRows:100\nphysicalCreated=1\nborrows=2\nreturns=2\npoolClosed=true", explanation: ["첫 logical borrow가 bounded one-row read를 완료합니다.", "physical resource1을 logical handles2가 순차 재사용합니다.", "두 close가 pool return되고 owner close까지 끝납니다."] },
    experiments: [
      { change: "첫 Connection try-with-resources를 제거합니다.", prediction: "returns1보다 borrows2가 커져 pool.close가 borrowed connection remains로 실패합니다.", result: "logical close 누락을 pool-exhaustion 전 acceptance gate에서 잡습니다." },
      { change: "queryTimeout을 request deadline보다 길게 설정합니다.", prediction: "request가 끝난 뒤 DB work와 borrowed connection이 남을 수 있습니다.", result: "outer deadline 안에 acquire/network/query/cancel budgets를 계층화합니다." },
      { change: "fetchSize50을 maxRows50과 같은 hard limit로 해석합니다.", prediction: "driver가 hint만 사용해 전체 result를 계속 반환할 수 있습니다.", result: "fetch hint와 row cap, SQL LIMIT/pagination을 별도 설계합니다." },
    ],
    sourceRefs: ["java-data-source", "java-connection", "java-statement", "java-result-set", "java-executor", "java-proxy", "java-sql-exception", "java-sql-feature-not-supported", "java-atomic-boolean", "java-atomic-integer", "jdbc-spec-42", "oracle-jdbc-basics-connections", "oracle-jdbc-basics-statements"],
  }],
  diagnostics: [
    { symptom: "pool acquire timeout과 pending threads가 계속 증가한다.", likelyCause: "logical Connection leak, 긴 transaction/query 또는 pool/DB capacity보다 높은 admission rate입니다.", checks: ["active/idle/pending/oldest-borrow를 봅니다.", "borrow stack/leak detector를 봅니다.", "query/transaction percentiles와 DB saturation을 확인합니다."], fix: "모든 borrow를 try-with-resources로 닫고 느린 경로를 교정하며 measured capacity에 맞춰 admission/pool을 조정합니다.", prevention: "borrow-return invariant, acquire timeout load test와 leak alert를 둡니다." },
    { symptom: "한 요청이 설정한 readOnly/schema/isolation이 다음 borrower에 남는다.", likelyCause: "pool이 connection session state를 반환 시 reset하지 않거나 application이 vendor session state를 만들었습니다.", checks: ["pool reset policy를 봅니다.", "borrow 전/후 state를 integration test합니다.", "session SQL/temp table/user variables를 확인합니다."], fix: "지원되는 reset/validation을 구성하고 application이 borrow scope 밖 state에 의존하지 않게 합니다.", prevention: "dirty-return→next-borrow fixture와 pool/driver upgrade regression을 유지합니다." },
  ],
  comparisons: [{ title: "bounded read controls", options: [
    { name: "network timeout", chooseWhen: "driver socket/connection operations의 upper bound를 둘 때", avoidWhen: "query semantics와 transaction cancellation을 이것 하나로 해결할 때", tradeoffs: ["Connection-level millis", "driver support/executor 필요"] },
    { name: "query timeout", chooseWhen: "한 Statement execution의 seconds limit를 요청할 때", avoidWhen: "server work가 즉시 중단·rollback된다고 가정할 때", tradeoffs: ["statement-local", "cancel timing/vendor behavior"] },
    { name: "maxRows/fetchSize", chooseWhen: "client row cap과 fetch batching hint를 설정할 때", avoidWhen: "pagination/SQL LIMIT/server cost 통제를 대신할 때", tradeoffs: ["result handling bounds", "server plan/scan과 별개"] },
  ] }],
  expertNotes: ["Pool close semantics, reset behavior, validation, leak detection, and timeout support are implementation-specific operational contracts layered on top of JDBC interfaces; verify the exact pool and driver versions."],
};

(session.chapters as DetailedSession["chapters"]).push(poolingChapter);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "java.sql API가 있으면 MySQL driver도 JDK에 포함되나요?", answer: "아닙니다. JDBC interfaces는 JDK에 있지만 특정 database protocol 구현은 별도 vendor driver runtime dependency입니다." },
  { question: "현대 JDBC에서도 Class.forName이 항상 필수인가요?", answer: "아닙니다. JDBC4 driver는 service provider metadata로 자동 발견될 수 있지만 driver JAR와 packaging은 여전히 필요합니다." },
  { question: "Driver.connect가 null을 반환하는 의미는 무엇인가요?", answer: "그 Driver가 해당 URL을 이해하지 못한다는 뜻이며 실제 connection failure SQLException과 다릅니다." },
  { question: "DriverManager test driver를 왜 deregister해야 하나요?", answer: "process-global registry state가 다른 test와 classloader lifetime에 누출되지 않게 하기 위해서입니다." },
  { question: "원본 JDBC main을 감사에서 실행하지 않은 이유는 무엇인가요?", answer: "driver loading, credential 사용, database network와 insert/update side effect를 공개 검증 경계에서 금지했기 때문입니다." },
  { question: "direct4와 closure4가 같은 이유는 무엇인가요?", answer: "네 main은 서로 source type을 참조하지 않고 JDK java.sql types만으로 독립 compile되기 때문입니다." },
  { question: "package15 warning2는 JDBC direct warning인가요?", answer: "아닙니다. Ex01/02 URL(String) deprecation이며 JDBC direct4는 warning0입니다." },
  { question: "원본 credential values를 문서에 복사하지 않고도 무엇을 감사할 수 있나요?", answer: "URL/user/password literal의 존재 개수, 환경 주입 부재, 취약 option count와 개선 정책을 값 없이 기록할 수 있습니다." },
  { question: "이미 repository에 들어간 password를 파일에서 지우기만 하면 되나요?", answer: "아닙니다. history/artifact 노출을 조사하고 해당 credential을 rotate 또는 revoke해야 합니다." },
  { question: "config record 기본 toString이 위험할 수 있는 이유는 무엇인가요?", answer: "모든 components를 출력해 password까지 log·exception·문서에 노출할 수 있기 때문입니다." },
  { question: "JDBC URL에 credential을 넣으면 어떤 위험이 있나요?", answer: "URL이 log, metric label, exception, tracing과 support bundle로 쉽게 복제될 수 있습니다." },
  { question: "configuration fail-fast error에는 무엇을 남겨야 하나요?", answer: "누락된 safe key와 validation reason만 남기고 전체 config map이나 secret value는 제외합니다." },
  { question: "새 ResultSet에서 바로 getter를 호출할 수 있나요?", answer: "아닙니다. cursor는 before-first이므로 next가 true를 반환한 뒤에만 current-row getter가 유효합니다." },
  { question: "empty SELECT 결과는 SQLException인가요?", answer: "아닙니다. 첫 next가 false인 정상 query outcome이며 empty list/Optional/not-found 정책을 정합니다." },
  { question: "next가 false를 반환한 뒤 마지막 row getter를 다시 호출해도 되나요?", answer: "아닙니다. current row가 없는 after-last이므로 invalid cursor state입니다." },
  { question: "왜 동시성 없는 fake에서도 actual ResultSet interface를 사용했나요?", answer: "method signatures, checked SQLException, close contract와 호출 순서를 실제 JDBC boundary에 맞춰 검증하기 위해서입니다." },
  { question: "getInt가0이면 database 값도 반드시0인가요?", answer: "아닙니다. SQL NULL도0으로 반환하므로 getter 직후 wasNull로 구분해야 합니다." },
  { question: "wasNull은 어느 getter를 설명하나요?", answer: "가장 최근에 호출한 ResultSet getter 한 번의 SQL NULL 여부를 설명합니다." },
  { question: "getObject(label, Integer.class)의 장점과 주의점은 무엇인가요?", answer: "nullable wrapper를 직접 표현하지만 driver/version의 typed conversion 지원을 integration test해야 합니다." },
  { question: "row 없음과 column SQL NULL은 같은가요?", answer: "아닙니다. row 없음은 cursor/query outcome이고 SQL NULL은 존재하는 row의 field state입니다." },
  { question: "ResultSetMetaData column index는 몇부터 시작하나요?", answer: "1부터 시작하며 getColumnCount까지 inclusive로 순회합니다." },
  { question: "getColumnLabel과 getColumnName은 어떻게 다른가요?", answer: "label은 AS alias를 우선하고 name은 underlying source column name을 나타낼 수 있습니다." },
  { question: "SELECT *가 public mapping contract에 취약한 이유는 무엇인가요?", answer: "schema 추가·순서 변경이 projection을 암묵적으로 바꾸고 index/label mapping drift를 만들기 때문입니다." },
  { question: "JDBCType과 vendor typeName을 왜 구분하나요?", answer: "JDBCType은 standard code 분류이고 vendor typeName은 database-specific detail이므로 portability와 정밀 진단 역할이 다릅니다." },
  { question: "executeUpdate가0을 반환하면 SQL failure인가요?", answer: "아닙니다. matching row 없음 또는 일부 DDL의 정상 count일 수 있으며 업무 cardinality와 비교합니다." },
  { question: "by-id update에서 result>0만 검사하면 놓치는 것은 무엇인가요?", answer: "여러 rows가 잘못 변경된 cardinality violation을 놓칠 수 있어 일반적으로 result==1을 기대합니다." },
  { question: "affected rows1이면 commit까지 보장되나요?", answer: "아닙니다. statement 결과일 뿐 transaction commit/durability는 별도 경계입니다." },
  { question: "Statement에 fixed SQL만 사용한 이유는 무엇인가요?", answer: "이 세션은 execution contract에 집중하고 runtime value binding과 injection 방지는 jdbc-02 PreparedStatement에서 다루기 때문입니다." },
  { question: "Statement.execute의 true/false는 성공 여부인가요?", answer: "아닙니다. true는 첫 result가 ResultSet, false는 update count 또는 결과 종료를 뜻합니다." },
  { question: "execute false 뒤 결과 종료와0-row update를 어떻게 구분하나요?", answer: "getUpdateCount가-1이면 종료이고0이면 실제 update count0입니다." },
  { question: "multiple results에서 무엇을 닫아야 하나요?", answer: "각 current ResultSet을 소비·close하고 getMoreResults close option과 Statement ownership을 명시해야 합니다." },
  { question: "단순 SELECT에 execute보다 executeQuery가 나은 이유는 무엇인가요?", answer: "반환 contract가 ResultSet으로 명확해 general result-kind state machine이 필요 없기 때문입니다." },
  { question: "try-with-resources의 JDBC close 순서는 무엇인가요?", answer: "Connection→Statement→ResultSet acquisition의 반대인 ResultSet→Statement→Connection입니다." },
  { question: "query body와 statement close가 모두 실패하면 무엇이 primary인가요?", answer: "query body SQLException이 primary이고 close SQLException은 suppressed로 붙습니다." },
  { question: "SQLException의 next exception과 suppressed는 같은 chain인가요?", answer: "아닙니다. JDBC getNextException, Throwable cause, getSuppressed는 서로 다른 links라 필요하면 모두 순회합니다." },
  { question: "SQLState 앞 두 characters는 무엇을 나타내나요?", answer: "표준 failure class를 나타내며 예를 들어08은 connection,42는 syntax/access rule violation 계열입니다." },
  { question: "SQLTransientException이면 무조건 retry해도 되나요?", answer: "아닙니다. operation idempotency, commit ambiguity, backoff와 total deadline을 함께 검토해야 합니다." },
  { question: "pool에서 Connection.close는 보통 무엇을 하나요?", answer: "physical socket 종료가 아니라 logical wrapper를 닫고 connection을 pool에 반환합니다." },
  { question: "setFetchSize가 전체 row 수를 제한하나요?", answer: "아닙니다. 일반적으로 fetch batching hint이며 hard cap에는 maxRows와 SQL pagination/limit를 별도 사용합니다." },
  { question: "network/query timeout과 request deadline은 어떻게 배치하나요?", answer: "outer request deadline 안에 acquire·network·query·cancel budgets를 두어 요청 종료 뒤 orphan DB work가 남지 않게 합니다." },
);

(session.completionChecklist as string[]).push(
  "inventory direct4와 class16 package15를 구분했다.",
  "direct4가 companion 없이 closure4인지 확인했다.",
  "package mains14와 direct mains4를 확인했다.",
  "package URL deprecation2와 JDBC direct warning0를 분리했다.",
  "원본 main을 한 번도 실행하지 않았다.",
  "vendor driver class를 load하지 않았다.",
  "database socket과 mutation을 만들지 않았다.",
  "direct4를 byte-identical owned temp copy로만 옮겼다.",
  "hash4와 relocated warning0를 확인했다.",
  "baseline/hostile launcher modes 결과를 비교했다.",
  "launcher variables4의 존재와 값을 복원했다.",
  "child stdout/stderr를 동시에 drain했다.",
  "compiler timeout·tree kill·grace·Dispose를 적용했다.",
  "credential literal values를 공개 artifact에 복사하지 않았다.",
  "URL/user/password literal count와 environment lookup 부재만 기록했다.",
  "노출 가능 credential은 rotate/revoke 대상으로 표시했다.",
  "configuration toString/log/exception에 redaction을 적용했다.",
  "missing·blank·scheme configuration을 fail-fast 검증했다.",
  "JDBC API와 vendor driver runtime dependency를 구분했다.",
  "test Driver registry를 finally에서 해제했다.",
  "Connection 생성 직후 close owner를 정했다.",
  "DriverManager와 DataSource 선택 근거를 기록했다.",
  "ResultSet before-first 상태를 설명했다.",
  "모든 row getter를 next true scope 안에 두었다.",
  "empty result를 정상 outcome으로 처리했다.",
  "next false 뒤 getter를 호출하지 않았다.",
  "live ResultSet을 resource scope 밖으로 반환하지 않았다.",
  "label과 index getter coupling을 비교했다.",
  "SQL NULL과 숫자0을 wasNull로 구분했다.",
  "wasNull을 해당 getter 바로 뒤 호출했다.",
  "row 없음과 null column을 별도 fixture로 검증했다.",
  "typed getObject driver 지원을 integration 항목으로 남겼다.",
  "metadata index를1부터 count까지 순회했다.",
  "column label·origin name·JDBC type을 구분했다.",
  "SELECT * 대신 명시 projection을 권장했다.",
  "schema drift를 row mapping 전에 fail-fast 검증했다.",
  "executeQuery와 executeUpdate 반환 계약을 구분했다.",
  "영향 행0을 SQLException과 구분했다.",
  "single-row write에서 result==1을 검토했다.",
  "영향 행>1 cardinality violation을 처리했다.",
  "Statement runtime value 문자열 연결을 사용하지 않았다.",
  "execute boolean을 성공 여부로 해석하지 않았다.",
  "update count0과 result 종료-1을 구분했다.",
  "multiple results의 current ResultSet close policy를 정했다.",
  "Connection→Statement→ResultSet을 try-with-resources로 소유했다.",
  "close 역순을 검증했다.",
  "body failure와 suppressed close failure를 모두 보존했다.",
  "SQLException cause·next·suppressed links를 구분했다.",
  "SQLState null/short fallback을 구현했다.",
  "SQLState·vendor code·subclass를 restricted evidence로 기록했다.",
  "raw SQL·parameters·row PII를 public error에서 제외했다.",
  "transient subtype만으로 자동 retry하지 않았다.",
  "pool borrow와 logical return count를 일치시켰다.",
  "logical Connection을 cache하거나 close 뒤 재사용하지 않았다.",
  "pool session-state reset을 integration 항목으로 검증했다.",
  "network timeout과 query timeout 단위를 구분했다.",
  "fetchSize hint와 maxRows hard bound를 구분했다.",
  "readOnly를 보안 write 차단으로만 믿지 않았다.",
  "pool owner close와 outstanding borrow0을 확인했다.",
  "모든 Java 예제를 JDK21 -Xlint:all warning0로 검증했다.",
);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-class16-ex03", repository: "javastudy2 classstudy", path: "src/com/java/class16/Ex03_JDBC.java", usedFor: ["DriverManager connection", "manual connection close", "embedded configuration hygiene"], evidence: "direct inventory의 가장 작은 Connection 원본이며 acquisition failure 뒤 null close 위험을 보여 줍니다." },
  { id: "java-class16-ex04", repository: "javastudy2 classstudy", path: "src/com/java/class16/Ex04_JDBC.java", usedFor: ["driver load", "Statement query", "label getters", "select loop"], evidence: "customer rows를 labels로 읽는 direct inventory SELECT 원본입니다." },
  { id: "java-class16-ex06", repository: "javastudy2 classstudy", path: "src/com/java/class16/Ex06_JDBC.java", usedFor: ["executeUpdate insert", "affected rows", "index getters", "empty cleanup catch"], evidence: "insert 영향 행 뒤 전체 select를 수행하고 cleanup failure를 삼키는 direct inventory 원본입니다." },
  { id: "java-class16-ex08", repository: "javastudy2 classstudy", path: "src/com/java/class16/Ex08_JDBC.java", usedFor: ["executeUpdate update", "zero-row branch", "index getters", "manual reverse close"], evidence: "update 영향 행0/positive를 분기하는 direct inventory 원본입니다." },
  { id: "jdk21-javac", repository: "OpenJDK", path: "javac tool", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["--release21", "-Xlint:all", "-XDrawDiagnostics", "warning0 gates"], evidence: "package/direct/relocated와 maintained examples compiler evidence 근거입니다." },
  { id: "powershell-environment", repository: "Microsoft Learn", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher variables snapshot", "baseline/hostile modes", "exact restore"], evidence: "audit parent/child environment isolation 근거입니다." },
  { id: "powershell-get-file-hash", repository: "Microsoft Learn", path: "Get-FileHash", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash", usedFor: ["SHA-256 original/copy equality", "relocation evidence"], evidence: "direct4 byte-identical owned temp copy 확인 근거입니다." },
  { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["ArgumentList", "redirected streams", "clean child environment"], evidence: "safe javac child construction 근거입니다." },
  { id: "dotnet-process", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "process-tree kill", "WaitForExit", "Dispose"], evidence: "bounded compile-only audit lifecycle 근거입니다." },
  { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["concurrent stdout drain", "concurrent stderr drain"], evidence: "redirected pipe deadlock 방지 근거입니다." },
  { id: "java-driver", repository: "Java SE 21 API", path: "java.sql.Driver", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Driver.html", usedFor: ["acceptsURL", "connect null contract", "driver metadata"], evidence: "database driver provider interface의 공식 계약입니다." },
  { id: "java-driver-manager", repository: "Java SE 21 API", path: "java.sql.DriverManager", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/DriverManager.html", usedFor: ["driver registry", "getConnection", "register/deregister"], evidence: "driver discovery와 Connection 요청 entry point 근거입니다." },
  { id: "java-driver-property-info", repository: "Java SE 21 API", path: "java.sql.DriverPropertyInfo", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/DriverPropertyInfo.html", usedFor: ["custom Driver property metadata", "required connection attributes"], evidence: "Driver가 connection properties 정보를 기술하는 표준 type 근거입니다." },
  { id: "java-connection", repository: "Java SE 21 API", path: "java.sql.Connection", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html", usedFor: ["session handle", "createStatement", "readOnly", "network timeout", "close"], evidence: "JDBC session과 statement factory/lifecycle의 중심 API 근거입니다." },
  { id: "java-statement", repository: "Java SE 21 API", path: "java.sql.Statement", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html", usedFor: ["executeQuery", "executeUpdate", "execute", "multiple results", "query bounds"], evidence: "SQL execution and result-kind contract의 공식 근거입니다." },
  { id: "java-result-set", repository: "Java SE 21 API", path: "java.sql.ResultSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/ResultSet.html", usedFor: ["before-first cursor", "next", "getters", "wasNull", "close"], evidence: "row cursor와 column getter semantics의 중심 API 근거입니다." },
  { id: "java-result-set-metadata", repository: "Java SE 21 API", path: "java.sql.ResultSetMetaData", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/ResultSetMetaData.html", usedFor: ["column count", "label/name", "JDBC type", "schema validation"], evidence: "query projection metadata의 공식 interface 근거입니다." },
  { id: "java-jdbc-type", repository: "Java SE 21 API", path: "java.sql.JDBCType", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/JDBCType.html", usedFor: ["standard SQL type enum", "vendor type number mapping"], evidence: "Types integer codes의 type-safe JDBC enum 근거입니다." },
  { id: "java-types", repository: "Java SE 21 API", path: "java.sql.Types", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Types.html", usedFor: ["JDBC SQL type constants", "metadata code compatibility"], evidence: "standard JDBC type integer constants 근거입니다." },
  { id: "java-sql-exception", repository: "Java SE 21 API", path: "java.sql.SQLException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLException.html", usedFor: ["SQLState", "vendor code", "next exceptions", "JDBC checked failures"], evidence: "세션 전체 structured database failure의 중심 API 근거입니다." },
  { id: "java-sql-feature-not-supported", repository: "Java SE 21 API", path: "java.sql.SQLFeatureNotSupportedException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLFeatureNotSupportedException.html", usedFor: ["minimal fake fail-fast", "driver capability boundary", "unwrap refusal"], evidence: "optional JDBC feature 미지원의 standard failure 근거입니다." },
  { id: "java-sql-syntax-error-exception", repository: "Java SE 21 API", path: "java.sql.SQLSyntaxErrorException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLSyntaxErrorException.html", usedFor: ["synthetic class42 primary", "non-transient syntax category"], evidence: "syntax/access rule JDBC failure subtype 근거입니다." },
  { id: "java-sql-transient-connection-exception", repository: "Java SE 21 API", path: "java.sql.SQLTransientConnectionException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLTransientConnectionException.html", usedFor: ["synthetic class08 next exception", "temporary connection category"], evidence: "transient connection failure subtype 근거입니다." },
  { id: "java-sql-transient-exception", repository: "Java SE 21 API", path: "java.sql.SQLTransientException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLTransientException.html", usedFor: ["transient hierarchy", "retry hint caveat"], evidence: "일시적 원인 가능성을 표현하는 JDBC superclass 근거입니다." },
  { id: "java-sql-state-class-24", repository: "PostgreSQL official documentation", path: "Appendix A PostgreSQL Error Codes - Class 24", publicUrl: "https://www.postgresql.org/docs/current/errcodes-appendix.html", usedFor: ["invalid cursor state code24000", "SQLState class evidence"], evidence: "공개 official implementation 문서에서 class24 code를 확인하는 근거입니다." },
  { id: "java-data-source", repository: "Java SE 21 API", path: "javax.sql.DataSource", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/javax/sql/DataSource.html", usedFor: ["connection factory", "pool/configuration boundary", "unwrap/admin methods"], evidence: "DriverManager 대안 connection factory abstraction 근거입니다." },
  { id: "java-proxy", repository: "Java SE 21 API", path: "java.lang.reflect.Proxy", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Proxy.html", usedFor: ["JDK-only JDBC fakes", "actual interface invocation handlers"], evidence: "vendor implementation 없이 JDBC interfaces를 deterministic하게 구현한 근거입니다." },
  { id: "java-service-loader", repository: "Java SE 21 API", path: "java.util.ServiceLoader", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ServiceLoader.html", usedFor: ["JDBC4 provider discovery", "service metadata", "Class.forName alternative"], evidence: "service-provider loading model 근거입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "java.util.Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["deterministic config fixture", "fake rows", "label-value mapping"], evidence: "immutable Map fixtures와 keyed row representation 근거입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "java.util.List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["ordered fake rows", "close trace abstraction"], evidence: "ordered result fixtures와 evidence sequences 근거입니다." },
  { id: "java-array-list", repository: "Java SE 21 API", path: "java.util.ArrayList", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html", usedFor: ["mutable close-order trace", "reverse close evidence"], evidence: "try-with-resources close events 수집 근거입니다." },
  { id: "java-record-classes", repository: "Java Language Specification 21", path: "JLS 8.10 Record Classes", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.10", usedFor: ["immutable DbConfig", "component/accessor/toString caveat"], evidence: "record 자동 members와 representation behavior의 규범 근거입니다." },
  { id: "java-string-is-blank", repository: "Java SE 21 API", path: "java.lang.String.isBlank", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html#isBlank()", usedFor: ["required config blank validation"], evidence: "empty와 whitespace-only configuration 검증 근거입니다." },
  { id: "java-atomic-boolean", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicBoolean", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicBoolean.html", usedFor: ["proxy close flags", "cursor state evidence", "logical close once"], evidence: "fake JDBC lifecycle flags의 safe mutable holder 근거입니다." },
  { id: "java-atomic-integer", repository: "Java SE 21 API", path: "java.util.concurrent.atomic.AtomicInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html", usedFor: ["cursor positions", "affected row fixture", "pool borrow/return counts"], evidence: "deterministic counter/state holder 근거입니다." },
  { id: "java-auto-closeable", repository: "Java SE 21 API", path: "java.lang.AutoCloseable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AutoCloseable.html", usedFor: ["resource ownership", "close exception", "pool owner fixture"], evidence: "try-with-resources resource type contract 근거입니다." },
  { id: "java-throwable", repository: "Java SE 21 API", path: "java.lang.Throwable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html", usedFor: ["primary/cause", "suppressed exceptions", "diagnostic chains"], evidence: "close failure suppression과 cause preservation 근거입니다." },
  { id: "java-executor", repository: "Java SE 21 API", path: "java.util.concurrent.Executor", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executor.html", usedFor: ["Connection network timeout callback executor", "direct deterministic fake"], evidence: "setNetworkTimeout에 전달하는 execution abstraction 근거입니다." },
  { id: "jls-14-try-with-resources", repository: "Java Language Specification 21", path: "JLS 14.20.3 try-with-resources", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.3", usedFor: ["reverse close order", "primary/suppressed translation", "partial acquisition"], evidence: "try-with-resources execution semantics의 규범 근거입니다." },
  { id: "jdbc-spec-42", repository: "Java Community Process", path: "JDBC 4.2 Specification", publicUrl: "https://download.oracle.com/otndocs/jcp/jdbc-4_2-mrel2-spec/index.html", usedFor: ["JDBC contracts", "typed getObject", "metadata", "statement results"], evidence: "JDBC4.2 표준 API behavior의 primary specification입니다." },
  { id: "sql-foundation-sqlstate", repository: "PostgreSQL official documentation", path: "Appendix A SQLSTATE Error Codes", publicUrl: "https://www.postgresql.org/docs/current/errcodes-appendix.html", usedFor: ["SQLState class08/24/42", "five-character structure", "portable category examples"], evidence: "공개 official DB implementation의 SQLSTATE code table 근거입니다." },
  { id: "sql-null-three-valued-logic", repository: "PostgreSQL official documentation", path: "Comparison Functions and Operators", publicUrl: "https://www.postgresql.org/docs/current/functions-comparison.html", usedFor: ["NULL distinctness", "IS NULL", "unknown truth value"], evidence: "SQL NULL 비교와 three-valued behavior의 public official reference입니다." },
  { id: "oracle-jdbc-basics-connections", repository: "Oracle Java Tutorials", path: "Establishing a Connection", publicUrl: "https://docs.oracle.com/javase/tutorial/jdbc/basics/connecting.html", usedFor: ["DriverManager/DataSource connection", "JDBC URL", "resource basics"], evidence: "JDBC connection flow의 official tutorial 근거입니다." },
  { id: "oracle-jdbc-basics-statements", repository: "Oracle Java Tutorials", path: "Processing SQL Statements with JDBC", publicUrl: "https://docs.oracle.com/javase/tutorial/jdbc/basics/processingsqlstatements.html", usedFor: ["Statement execution", "ResultSet loop", "resource processing"], evidence: "JDBC statement/result processing의 official tutorial 근거입니다." },
  { id: "owasp-secrets-management", repository: "OWASP Cheat Sheet Series", path: "Secrets Management Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html", usedFor: ["secret lifecycle", "rotation", "least privilege", "runtime injection"], evidence: "credential storage·distribution·rotation 보안 지침 근거입니다." },
  { id: "owasp-logging-cheat-sheet", repository: "OWASP Cheat Sheet Series", path: "Logging Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["data to exclude", "redaction", "restricted diagnostics"], evidence: "password·connection string·sensitive data log 방지 근거입니다." },
  { id: "owasp-error-handling", repository: "OWASP Cheat Sheet Series", path: "Error Handling Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html", usedFor: ["safe public errors", "internal diagnostic separation", "information exposure"], evidence: "SQLException public/internal representation 분리 근거입니다." },
  { id: "twelve-factor-config", repository: "The Twelve-Factor App", path: "III Config", publicUrl: "https://12factor.net/config", usedFor: ["config/source separation", "deployment-varying values"], evidence: "배포별 configuration을 code와 분리하는 공개 primary methodology 근거입니다." },
);
