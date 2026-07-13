import type { DetailedSession } from "../../types";

const isolatedJavaRun = (sourceFile: string, mainClass: string) =>
  "pwsh -NoProfile -Command '& { $base = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar); $root = Join-Path $base ([Guid]::NewGuid().ToString(\"N\")); if (Test-Path -LiteralPath $root) { throw \"unexpected temp collision\" }; New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null; try { $classes = Join-Path $root \"classes\"; New-Item -ItemType Directory -Path $classes -ErrorAction Stop | Out-Null; $compiler = @(& javac -encoding UTF-8 --release 21 -proc:none -Xlint:all -d $classes \"" + sourceFile + "\" 2>&1); if ($LASTEXITCODE -ne 0 -or $compiler.Count -ne 0) { throw (\"javac failed or warned: \" + ($compiler -join [Environment]::NewLine)) }; Push-Location $root; try { & java \"-Dfile.encoding=UTF-8\" -cp $classes \"" + mainClass + "\"; if ($LASTEXITCODE -ne 0) { throw \"java failed\" } } finally { Pop-Location } } finally { $resolved = [IO.Path]::GetFullPath($root); if (-not [string]::Equals([IO.Path]::GetDirectoryName($resolved), $base, [StringComparison]::OrdinalIgnoreCase)) { throw \"unsafe cleanup\" }; if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop }; if (Test-Path -LiteralPath $resolved) { throw \"cleanup failed\" } } }'";

const session = {
  schemaVersion: 2,
  inventoryIds: ["net-01-url-connection"],
  slug: "net-01-url-connection",
  courseId: "java",
  moduleId: "java-systems",
  order: 34,
  title: "InetAddress·URL·URLConnection·XML/JSON",
  subtitle: "DNS부터 URI, HTTP status·headers·body, 안전한 XML/JSON parsing과 SSRF 방어까지 하나의 검증 가능한 ingestion 경계로 연결합니다.",
  level: "고급",
  estimatedMinutes: 1080,
  coreQuestion: "외부 URL에서 데이터를 가져올 때 DNS·연결·TLS·HTTP·body decode·XML/JSON parse·domain validation 실패를 어떻게 분리하고, timeout·limit·SSRF·redirect를 어떻게 안전하게 통제할까요?",
  summary: "원본 class15 Ex08/09와 class16 Ex01/02 네 파일을 읽습니다. Ex08은 local host와 다섯 public host를 InetAddress로 조회하고 name/address/toString을 출력합니다. 나머지 세 파일은 HttpURLConnection으로 HTML·기상 XML·상품 JSON을 내려받아 UTF-8 text file로 저장합니다. live DNS/외부 endpoint와 D-drive paths는 재현 가능한 학습 evidence가 아니므로 원본은 compile·shape만 감사하고, copies의 six host resolutions를 loopback으로, three URLs를 owned local TCP fixture로, three paths를 temp로 치환합니다. JDK21에서 new URL(String) deprecation warnings3을 보존하며 loopback address groups6·output lines24, HTTP requests3와 exact files38/40/23bytes를 두 launcher modes에서 확인합니다. 이후 InetAddress/address families, URI components·encoding, Java11 HttpClient, failure taxonomy, safe HttpURLConnection lifecycle, media/charset/compression limits, redirects·retry, SSRF/DNS rebinding, secure XML, JSON runtime schema와 end-to-end bounded ingestion으로 확장합니다.",
  objectives: [
    "hostname·IP literal·forward/reverse DNS와 IPv4/IPv6 address object를 구분한다.",
    "URI의 scheme·authority·host·port·raw path·query·fragment를 parse하고 올바른 component encoding을 적용한다.",
    "HttpClient와 HttpURLConnection에서 connect/request/read timeout, status, headers와 body ownership을 명시한다.",
    "DNS·connect·TLS·HTTP·media·decode·parse·schema failures를 다른 recovery와 telemetry로 분류한다.",
    "redirect·retry·idempotency·cancellation·backoff를 request semantics에 맞게 설계한다.",
    "SSRF allowlist, resolved-address 검증, redirect 재검증과 private/link-local metadata 차단을 적용한다.",
    "XML parser의 DTD/external entity를 차단하고 JSON parse 뒤 runtime schema와 resource limits를 검증한다.",
    "local deterministic server fixtures, exact bytes와 negative matrix로 외부 네트워크 없이 ingestion을 검증한다.",
  ],
  prerequisites: [
    { title: "Reader·Writer와 인코딩", reason: "HTTP body bytes를 charset policy로 decode하고 bounded Reader/Writer와 atomic publish를 사용합니다.", sessionSlug: "io-03-reader-writer" },
    { title: "브라우저 XML parse·render", reason: "XML document·namespace·parser error와 safe rendering의 browser-side 기초를 server-side Java parser와 비교합니다.", sessionSlug: "xml-03-browser-parse-render" },
  ],
  keywords: ["InetAddress", "DNS", "IPv4", "IPv6", "URI", "URL", "HttpURLConnection", "HttpClient", "HTTP status", "headers", "Content-Type", "charset", "Content-Encoding", "timeout", "redirect", "retry", "idempotency", "SSRF", "DNS rebinding", "XML", "XXE", "JSON", "schema validation", "body limit", "loopback fixture"],
  chapters: [],
  lab: {
    title: "SSRF-safe bounded HTTP→parse→validate→atomic publish ingestion",
    scenario: "사용자가 등록한 weather/product feed URL을 주기적으로 가져와 XML 또는 JSON domain records로 변환하고 검증된 generation만 공개해야 합니다.",
    setup: ["allowlisted HTTPS hosts/ports/path prefixes와 redirect policy를 정의합니다.", "loopback server에 200/404/429/503, redirect chain, wrong media/charset, gzip, oversize, slow/truncated, malformed XML/JSON fixtures를 만듭니다.", "same-filesystem owned temp, existing final과 digest/audit schema를 준비합니다."],
    steps: ["URI를 component 단위로 parse하고 userinfo·fragment·unexpected port/path를 거부합니다.", "DNS answers 전체를 resolve해 private/link-local/loopback/multicast/metadata ranges를 거부합니다.", "connect와 request timeout, body byte limit과 cancellation을 설정합니다.", "redirect마다 scheme/host/port/path와 newly resolved addresses를 재검증합니다.", "status와 retry-after/idempotency에 따라 retry 여부를 결정합니다.", "Content-Type·charset·Content-Encoding을 allowlist하고 decompressed size를 제한합니다.", "XML secure factory 또는 maintained JSON parser로 parse하고 node/token/depth limits를 적용합니다.", "runtime schema와 domain invariants를 검증합니다.", "normalized output을 temp에 쓰고 count·digest를 readback 검증한 뒤 atomic publish합니다.", "safe category·duration/size buckets·correlation과 provenance를 기록합니다."],
    expectedResult: ["정상 XML/JSON만 deterministic domain records와 current generation으로 publish됩니다.", "private address·redirect escape·wrong status/media·oversize·malformed/schema-invalid inputs가 단계별 typed failure가 됩니다.", "timeout/cancel/retry에서도 connection·body·temp resources가 정리되고 existing final은 보존됩니다.", "public log에 raw URL query credentials, response body와 local paths가 남지 않습니다."],
    extensions: ["IPv4-mapped IPv6, DNS answer rotation과 redirect-to-private cases를 추가합니다.", "ETag/If-None-Match와 Last-Modified conditional request·304 cache update를 구현합니다.", "gzip bomb과 chunked unknown-length body를 decompressed-byte budget으로 검증합니다.", "HttpClient async cancellation과 virtual-thread bounded concurrency를 비교 측정합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "loopback server의 /ok와 /missing을 HttpClient로 호출해 status·media·UTF-8 body를 분류하세요.", requirements: ["URI와 connect/request timeout을 명시합니다.", "200과404 body를 같은 success DTO로 섞지 않습니다.", "exact status/media/body와 request count를 출력합니다.", "server와 executor를 finally에서 종료합니다."], hints: ["HttpClient는4xx/5xx에서 exception을 던지지 않습니다.", "BodyHandlers.ofByteArray 뒤 size/media를 먼저 검증할 수 있습니다."], expectedOutcome: "외부 인터넷 없이 response contract와 non-2xx branch를 재현하는 warning0 test가 완성됩니다.", solutionOutline: ["server route table을 먼저 만듭니다.", "transport success와 HTTP success를 분리합니다."] },
    { difficulty: "응용", prompt: "HTTPS feed fetcher의 URI·DNS·redirect·body policy를 구현하세요.", requirements: ["scheme/host/port/path allowlist와 userinfo 금지를 적용합니다.", "모든 resolved addresses와 redirect target을 검증합니다.", "compressed/decompressed bytes, timeout과 cancellation limits를 둡니다.", "status/media/charset을 typed errors로 분류합니다.", "private IPv4/IPv6 fixture를 거부합니다."], hints: ["host string allowlist 뒤에도 DNS answers를 봅니다.", "redirect는 새 request라 동일 policy를 다시 적용합니다."], expectedOutcome: "SSRF와 resource exhaustion을 fail-closed로 막는 reusable client boundary가 완성됩니다.", solutionOutline: ["URI policy→DNS policy→request→redirect loop→body policy 순서로 stages를 나눕니다.", "policy result에 safe reason code를 둡니다."] },
    { difficulty: "설계", prompt: "XML/JSON 외부 feed 플랫폼의 production ingestion specification을 작성하세요.", requirements: ["DNS/connect/TLS/HTTP/decode/parse/schema/domain failure taxonomy를 정의합니다.", "retry/idempotency/backoff/Retry-After와 circuit/bulkhead policy를 포함합니다.", "XXE/entity, JSON depth/number/duplicate, gzip/size와 SSRF limits를 명시합니다.", "ETag/cache, atomic generation publish, rollback과 provenance를 설계합니다.", "local contract/property/fault/security/observability test matrix를 만듭니다."], hints: ["timeout 하나가 모든 phases를 제한하지 않습니다.", "parse success는 schema/domain validity가 아닙니다."], expectedOutcome: "개발·보안·운영이 공통으로 구현하고 검증할 수 있는 end-to-end ingestion 계약이 완성됩니다.", solutionOutline: ["trust boundaries와 state transitions를 먼저 그립니다.", "각 acceptance criterion을 fixture·metric·owner에 연결합니다."] },
  ],
  reviewQuestions: [],
  completionChecklist: [],
  sources: [],
  sourceCoverage: {
    filesRead: 4,
    filesUsed: 4,
    uncoveredFiles: [],
    uncoveredNotes: [
      "class15 Ex08/09와 class16 Ex01/02를 모두 읽고 DNS one file, HTTP HTML/XML/JSON three files의 실행 경계를 복원했습니다.",
      "live external endpoints와 original absolute output paths는 실행하지 않고 compile/shape evidence와 loopback-relocated exact results를 분리했습니다.",
      "class16의 JDBC files는 jdbc sessions로 분리하며 net inventory2만 independent warning evidence로 compile합니다.",
    ],
  },
  relatedGlossary: ["DNS", "URI", "HTTP", "timeout", "redirect", "SSRF", "XXE", "JSON schema"],
  nextSessions: ["thread-01-lifecycle"],
} satisfies DetailedSession;

export default session;

const originalNetworkAuditChapter: DetailedSession["chapters"][number] = {
  id: "class15-class16-network-inventory4-loopback-audit",
  title: "원본 DNS·HTML·XML·JSON inventory4를 compile하고 loopback으로만 relocated 실행합니다",
  lead: "외부 DNS/HTTP 응답과 실제 D-drive files를 evidence로 의존하지 않고, 원본 source shape는 그대로 보존하면서 known hosts·URLs·paths만 owned local fixture로 치환합니다.",
  explanations: [
    "inventory는 class15 Ex08 InetAddress, Ex09 HTML download와 class16 Ex01 XML, Ex02 JSON download 네 파일입니다. 각 source를 직접 읽고 network·path literals와 active calls를 comments 제외 상태로 셉니다.",
    "class15 package9는 io-04의 unchecked2·missing UID2와 Ex09의 deprecated URL constructor1로 warnings5입니다. class16 전체는 JDBC dependency가 섞여 있으므로 net inventory2만 독립 compile하며 deprecated URL warnings2입니다.",
    "combined inventory4와 relocated4는 new URL(String) 세 곳 때문에 warnings3입니다. 이를 지우지 않고 보존한 뒤 modern examples에서는 URI.create(...).toURL 또는 HttpClient로 warning0을 달성합니다.",
    "Ex08 original은 getLocalHost1과 public hostname getByName5를 호출합니다. live DNS는 answer·order·TTL·network에 따라 달라지므로 copy에서 여섯 resolution을127.0.0.1로 바꾸고 original hostnames는 실행하지 않습니다.",
    "Ex09/Ex01/Ex02는 각각 HTTPS URL, path, HttpURLConnection, GET, User-Agent, connect/read timeout10s, 2xx input/error stream branch와 UTF-8 line copy를 가집니다.",
    "owned TcpListener fixture는 ephemeral loopback port에서 /html, /xml, /json 세 requests만 받고 exact Content-Type·Content-Length와 bodies를 반환한 뒤 종료합니다. external proxy/DNS/TLS가 개입하지 않습니다.",
    "원본 readLine/newLine transform 때문에 HTML three lines는 final CRLF가 추가된38bytes, XML one line40bytes, JSON one line23bytes가 됩니다. byte-for-byte source body 보존이 아니라 logical-line rewrite입니다.",
    "original finally는 connection/reader/writer가 null인 setup failure에서 NullPointerException으로 primary error를 가릴 수 있습니다. audit harness는 이 결함을 숨기지 않고 modern lifecycle chapter에서 try-with-resources와 null-safe disconnect로 교정합니다.",
    "각 javac/java/server child는 clean launcher variables, concurrent redirected drains,10초 timeout, tree kill과5초 grace를 갖습니다. fixture server의 port line만 readiness signal로 읽습니다.",
    "baseline/hostile modes 결과가 같고 launcher variables를 존재/값 단위로 복원하며, temp direct-child ownership을 확인한 뒤 body·server·restore·cleanup failures를 aggregate합니다.",
  ],
  concepts: [
    { term: "controlled loopback relocation", definition: "original API call structure를 유지하되 external host·URL·output path literals만 owned127.0.0.1 fixture와 temp로 바꾸는 재현 방식입니다.", detail: ["원본은 실행하지 않습니다.", "live service drift를 제거합니다."] },
    { term: "network phase evidence", definition: "DNS, connect, HTTP response와 body file 결과를 한 성공 문자열로 뭉치지 않고 각각 검증하는 기록입니다.", detail: ["failure taxonomy의 기초입니다.", "fixture requests를 셉니다."] },
    { term: "logical-line rewrite", definition: "readLine이 terminator를 버리고 newLine이 platform separator를 모든 lines 뒤에 쓰는 text transformation입니다.", detail: ["final newline이 추가됩니다.", "raw bytes와 다릅니다."] },
  ],
  codeExamples: [{
    id: "powershell-original-net01-audit",
    title: "package/inventory warnings와 loopback DNS·HTTP3·files38/40/23를 두 modes에서 검증합니다",
    language: "powershell",
    filename: "verify-original-net01.ps1",
    purpose: "live hosts/endpoints와 original output files를 건드리지 않고 source roles, compiler warnings와 exact relocated behavior를 재현합니다.",
    code: String.raw`param([Parameter(Mandatory)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$optionNames=@('JDK_JAVAC_OPTIONS','JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS')
$saved=@{}
foreach($name in $optionNames){
  $item=Get-Item -LiteralPath ("Env:"+$name) -ErrorAction SilentlyContinue
  $saved[$name]=@{Exists=$null-ne$item;Value=if($item){$item.Value}else{$null}}
}
$base=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
$root=Join-Path $base ("net01 audit "+[Guid]::NewGuid().ToString('N'))
$ownsRoot=$false;$bodyError=$null;$nl=[string][char]10

function Normalize([string]$text){return $text.Replace(([string][char]13+[char]10),[string][char]10)}
function New-StartInfo([string]$file,[string[]]$arguments,[string]$cwd){
  $start=[Diagnostics.ProcessStartInfo]::new()
  $start.FileName=$file;$start.WorkingDirectory=$cwd;$start.UseShellExecute=$false
  $start.RedirectStandardInput=$true;$start.RedirectStandardOutput=$true;$start.RedirectStandardError=$true
  $start.StandardOutputEncoding=[Text.UTF8Encoding]::new($false);$start.StandardErrorEncoding=[Text.UTF8Encoding]::new($false)
  foreach($arg in $arguments){[void]$start.ArgumentList.Add($arg)}
  foreach($name in $optionNames){[void]$start.Environment.Remove($name)}
  return $start
}
function Invoke-Child([string]$file,[string[]]$arguments,[string]$cwd){
  $process=[Diagnostics.Process]::new();$process.StartInfo=New-StartInfo $file $arguments $cwd
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
function Compile([IO.FileInfo[]]$files,[string]$classes,[int]$unchecked,[int]$serial,[int]$deprecated,[int]$total){
  New-Item -ItemType Directory -Path $classes -ErrorAction Stop|Out-Null
  $args=@('-J-Duser.language=en','-J-Duser.country=US','-encoding','UTF-8','--release','21','-proc:none','-Xlint:all','-XDrawDiagnostics','-d',$classes)+@($files.FullName)
  $result=Invoke-Child 'javac' $args $root
  if($result.Exit-ne0-or$result.Out.Length-ne0){throw 'compile failed'}
  $lines=@($result.Err.TrimEnd([char]10).Split([char]10))
  $u=@($lines|Where-Object{$_-match'compiler\.warn\.prob\.found\.req'}).Count
  $s=@($lines|Where-Object{$_-match'compiler\.warn\.missing\.SVUID'}).Count
  $d=@($lines|Where-Object{$_-match'compiler\.warn\.has\.been\.deprecated'}).Count
  if($u-ne$unchecked-or$s-ne$serial-or$d-ne$deprecated-or$lines.Count-ne($total+1)-or$lines[-1]-cne"$total warnings"){throw 'warning evidence drift'}
  return $total
}
function Run([string]$classes,[string]$main){
  $result=Invoke-Child 'java' @('-Dfile.encoding=UTF-8','-cp',$classes,$main) $root
  if($result.Exit-ne0-or$result.Err.Length-ne0){throw "$main process drift"};return $result.Out
}
function Remove-JavaComments([string]$text){return [regex]::Replace(([regex]::Replace($text,'(?s)/\*.*?\*/','')),'(?m)//.*$','')}
function Java-Literal([string]$path){return $path.Replace('\','\\')}

$serverScript=Join-Path $root 'fixture-server.ps1'
$serverCode=@'
$ErrorActionPreference='Stop'
$listener=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,0)
$listener.Start()
[Console]::Out.WriteLine(([Net.IPEndPoint]$listener.LocalEndpoint).Port)
[Console]::Out.Flush()
try{
  $routes=@{
    '/html'=@{Type='text/html; charset=utf-8';Body=('<html>'+[char]10+'<body>학습</body>'+[char]10+'</html>')}
    '/xml'=@{Type='application/xml; charset=utf-8';Body='<weather><city>서울</city></weather>'}
    '/json'=@{Type='application/json; charset=utf-8';Body='[{"id":1,"name":"A"}]'}
  }
  $crlf=[string][char]13+[char]10
  for($index=0;$index-lt3;$index++){
    $client=$listener.AcceptTcpClient()
    try{
      $stream=$client.GetStream();$reader=[IO.StreamReader]::new($stream,[Text.Encoding]::ASCII,$false,1024,$true)
      $request=$reader.ReadLine();while($null-ne($line=$reader.ReadLine())-and$line-ne''){}
      $path=($request-split' ')[1];if(-not$routes.ContainsKey($path)){throw "unexpected path: $path"}
      $route=$routes[$path];$body=[Text.UTF8Encoding]::new($false).GetBytes($route.Body)
      $header='HTTP/1.1 200 OK'+$crlf+'Content-Type: '+$route.Type+$crlf+'Content-Length: '+$body.Length+$crlf+'Connection: close'+$crlf+$crlf
      $headerBytes=[Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerBytes,0,$headerBytes.Length);$stream.Write($body,0,$body.Length);$stream.Flush()
    }finally{$client.Dispose()}
  }
  [Console]::Out.WriteLine('handled=3')
}finally{$listener.Stop()}
'@

function Start-Fixture(){
  $start=New-StartInfo 'pwsh' @('-NoProfile','-File',$serverScript) $root
  $process=[Diagnostics.Process]::new();$process.StartInfo=$start
  if(-not$process.Start()){$process.Dispose();throw 'fixture start failed'}
  $process.StandardInput.Close();$port=0;$portLine=$process.StandardOutput.ReadLine()
  if(-not[int]::TryParse($portLine,[ref]$port)){$process.Kill($true);$process.Dispose();throw 'fixture port drift'}
  return @{Process=$process;Port=$port}
}
function Write-Relocated([IO.FileInfo]$file,[string]$destination,[hashtable]$replacements){
  $text=[IO.File]::ReadAllText($file.FullName)
  foreach($entry in @($replacements.GetEnumerator()|Sort-Object{$_.Key.Length}-Descending)){
    if(-not$text.Contains($entry.Key)){continue}
    $text=$text.Replace($entry.Key,$entry.Value);if($text.Contains($entry.Key)){throw 'relocation literal survived'}
  }
  if($text-match'[A-Za-z]:\\\\util\\\\'){throw 'original path survived'}
  [IO.File]::WriteAllText($destination,$text,[Text.UTF8Encoding]::new($false))
}
function Audit([string]$mode,[string]$class15,[string]$class16){
  if($mode-eq'hostile'){
    $env:JDK_JAVAC_OPTIONS='-J-Dnet01.audit=javac';$env:JDK_JAVA_OPTIONS='-Dnet01.audit=java'
    $env:JAVA_TOOL_OPTIONS='-Dnet01.audit=tool';$env:_JAVA_OPTIONS='-Dnet01.audit=legacy'
  }else{foreach($name in $optionNames){Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue}}
  $package15=@(Get-ChildItem -LiteralPath $class15 -Filter '*.java'|Sort-Object Name)
  $inventory15=@('Ex08_InetAddress.java','Ex09_URLConnection.java')|ForEach-Object{Get-Item -LiteralPath (Join-Path $class15 $_)}
  $inventory16=@('Ex01_URLConnection_XML.java','Ex02_URLConnection_JSON.java')|ForEach-Object{Get-Item -LiteralPath (Join-Path $class16 $_)}
  $inventory=@($inventory15)+@($inventory16)
  if($package15.Count-ne9-or$inventory.Count-ne4){throw 'inventory drift'}
  $packageWarnings=Compile $package15 (Join-Path $root ("package15-"+$mode)) 2 2 1 5
  $class16Warnings=Compile @($inventory16) (Join-Path $root ("inventory16-"+$mode)) 0 0 2 2
  $inventoryWarnings=Compile $inventory (Join-Path $root ("inventory4-"+$mode)) 0 0 3 3
  $mainPattern='public\s+static\s+void\s+main\s*\('
  $packageMains=@($package15|Where-Object{([IO.File]::ReadAllText($_.FullName))-match$mainPattern}).Count
  $inventoryMains=@($inventory|Where-Object{([IO.File]::ReadAllText($_.FullName))-match$mainPattern}).Count
  if($packageMains-ne7-or$inventoryMains-ne4){throw 'main role drift'}

  $fixture=$null
  try{
    $fixture=Start-Fixture;$port=$fixture.Port
    $sourceCopy=Join-Path $root ("source-"+$mode);New-Item -ItemType Directory -Path $sourceCopy -ErrorAction Stop|Out-Null
    $html=Join-Path $root ("html-"+$mode+".txt");$xml=Join-Path $root ("xml-"+$mode+".txt");$json=Join-Path $root ("json-"+$mode+".txt")
    $common=@{
      'InetAddress.getLocalHost()'='InetAddress.getByName("127.0.0.1")'
      '"www.naver.com"'='"127.0.0.1"';'"m.naver.com"'='"127.0.0.1"';'"www.ictedu.co.kr"'='"127.0.0.1"'
      '"www.daum.net"'='"127.0.0.1"';'"www.google.com"'='"127.0.0.1"'
      'https://comic.naver.com/index'="http://127.0.0.1:$port/html"
      'https://www.kma.go.kr/XML/weather/sfc_web_map.xml'="http://127.0.0.1:$port/xml"
      'https://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline'="http://127.0.0.1:$port/json"
      'D:\\util\\webPage01.txt'=(Java-Literal $html);'D:\\util\\kma_xml.txt'=(Java-Literal $xml);'D:\\util\\makeup_json.txt'=(Java-Literal $json)
    }
    foreach($file in $inventory){Write-Relocated $file (Join-Path $sourceCopy $file.Name) $common}
    $relocated=@(Get-ChildItem -LiteralPath $sourceCopy -Filter '*.java'|Sort-Object Name)
    $classes=Join-Path $root ("relocated-"+$mode);$relocatedWarnings=Compile $relocated $classes 0 0 3 3

    $dns=Run $classes 'com.java.class15.Ex08_InetAddress'
    if(([regex]::Matches($dns,'(?m)^이름 : 127\.0\.0\.1$')).Count-ne6-or([regex]::Matches($dns,'(?m)^주소 : 127\.0\.0\.1$')).Count-ne6-or([regex]::Matches($dns,$nl)).Count-ne24){throw 'loopback DNS output drift'}
    foreach($main in @('com.java.class15.Ex09_URLConnection','com.java.class16.Ex01_URLConnection_XML','com.java.class16.Ex02_URLConnection_JSON')){
      if((Run $classes $main).Length-ne0){throw "$main stdout drift"}
    }
    $expected=@(
      [Text.Encoding]::UTF8.GetBytes((@('<html>','<body>학습</body>','</html>')-join[Environment]::NewLine)+[Environment]::NewLine),
      [Text.Encoding]::UTF8.GetBytes('<weather><city>서울</city></weather>'+[Environment]::NewLine),
      [Text.Encoding]::UTF8.GetBytes('[{"id":1,"name":"A"}]'+[Environment]::NewLine)
    )
    $actual=@([IO.File]::ReadAllBytes($html),[IO.File]::ReadAllBytes($xml),[IO.File]::ReadAllBytes($json))
    for($i=0;$i-lt3;$i++){if([Convert]::ToHexString($actual[$i])-cne[Convert]::ToHexString($expected[$i])){throw 'HTTP file bytes drift'}}
    if(-not$fixture.Process.WaitForExit(10000)){$fixture.Process.Kill($true);throw 'fixture timeout'}
    $serverOut=Normalize $fixture.Process.StandardOutput.ReadToEnd();$serverErr=Normalize $fixture.Process.StandardError.ReadToEnd()
    if($fixture.Process.ExitCode-ne0-or$serverOut-cne("handled=3"+$nl)-or$serverErr.Length-ne0){throw 'fixture completion drift'}

    $rawJoined=(@($inventory|ForEach-Object{[IO.File]::ReadAllText($_.FullName)})-join$nl)
    $joined=(@($inventory|ForEach-Object{Remove-JavaComments([IO.File]::ReadAllText($_.FullName))})-join$nl)
    $shape=@{
      local=([regex]::Matches($joined,'InetAddress\.getLocalHost\s*\(')).Count;byName=([regex]::Matches($joined,'InetAddress\.getByName\s*\(')).Count
      url=([regex]::Matches($joined,'new\s+URL\s*\(')).Count;open=([regex]::Matches($joined,'\.openConnection\s*\(')).Count
      method=([regex]::Matches($joined,'\.setRequestMethod\s*\(')).Count;ua=([regex]::Matches($joined,'\.setRequestProperty\s*\(')).Count
      connect=([regex]::Matches($joined,'\.setConnectTimeout\s*\(')).Count;readTimeout=([regex]::Matches($joined,'\.setReadTimeout\s*\(')).Count
      status=([regex]::Matches($joined,'\.getResponseCode\s*\(')).Count;input=([regex]::Matches($joined,'\.getInputStream\s*\(')).Count
      error=([regex]::Matches($joined,'\.getErrorStream\s*\(')).Count;readLine=([regex]::Matches($joined,'\.readLine\s*\(')).Count
      newline=([regex]::Matches($joined,'\.newLine\s*\(')).Count;disconnect=([regex]::Matches($joined,'\.disconnect\s*\(')).Count
      paths=([regex]::Matches($joined,'[A-Za-z]:\\\\')).Count;endpoints=([regex]::Matches($rawJoined,'new\s+URL\s*\(\s*"https://')).Count
    }
    if($shape.local-ne1-or$shape.byName-ne5-or$shape.url-ne3-or$shape.open-ne3-or$shape.method-ne3-or$shape.ua-ne3-or$shape.connect-ne3-or$shape.readTimeout-ne3-or$shape.status-ne3-or$shape.input-ne3-or$shape.error-ne3-or$shape.readLine-ne3-or$shape.newline-ne3-or$shape.disconnect-ne3-or$shape.paths-ne3-or$shape.endpoints-ne3){throw 'source shape drift'}
    return "package15=9,warnings=$packageWarnings,mains=7|inventory16=2,warnings=$class16Warnings,mains=2|inventory4=4,warnings=$inventoryWarnings,mains=4|relocated4=4,warnings=$relocatedWarnings;dns=6loopback,24lines|http=3,server=3|files=38,40,23bytes;shapes=inet:1+5|URL:3|open:3|timeouts:3,3|status:3|body:3+3|readLine:3|newLine:3|disconnect:3|paths:3->temp|endpoints:3->loopback"
  }finally{
    if($null-ne$fixture){if(-not$fixture.Process.HasExited){$fixture.Process.Kill($true);[void]$fixture.Process.WaitForExit(5000)};$fixture.Process.Dispose()}
  }
}

try{
  if(Test-Path -LiteralPath $root){throw 'unexpected temp collision'};New-Item -ItemType Directory -Path $root -ErrorAction Stop|Out-Null;$ownsRoot=$true
  [IO.File]::WriteAllText($serverScript,$serverCode,[Text.UTF8Encoding]::new($false))
  $source=[IO.Path]::GetFullPath($SourceRoot);$class15=Join-Path $source 'src/com/java/class15';$class16=Join-Path $source 'src/com/java/class16'
  $baseline=Audit 'baseline' $class15 $class16;$hostile=Audit 'hostile' $class15 $class16;if($baseline-cne$hostile){throw 'baseline hostile drift'}
  "spacePath=$($root.Contains(' ')),modes=2|same=True,$baseline";'privacy=live-hosts:not-run|original-paths:not-run|fixture:owned-loopback-temp;launcherOptions=4'
}catch{$bodyError=$_.Exception}finally{
  $finalErrors=[Collections.Generic.List[Exception]]::new()
  foreach($name in $optionNames){try{if($saved[$name].Exists){Set-Item -LiteralPath ("Env:"+$name)-Value $saved[$name].Value -ErrorAction Stop;$restored=Get-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue;if($null-eq$restored-or$restored.Value-cne$saved[$name].Value){throw "launcher restore failed: $name"}}else{Remove-Item -LiteralPath ("Env:"+$name)-ErrorAction SilentlyContinue;if(Test-Path -LiteralPath ("Env:"+$name)){throw "launcher absence failed: $name"}}}catch{$finalErrors.Add($_.Exception)}}
  try{if($ownsRoot){$resolved=[IO.Path]::GetFullPath($root);if(-not[string]::Equals([IO.Path]::GetDirectoryName($resolved),$base,[StringComparison]::OrdinalIgnoreCase)){throw 'unsafe cleanup'};if(Test-Path -LiteralPath $resolved){Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop};if(Test-Path -LiteralPath $resolved){throw 'cleanup failed'}}}catch{$finalErrors.Add($_.Exception)}
  if($null-ne$bodyError){$finalErrors.Insert(0,$bodyError)};if($finalErrors.Count-eq1){[Runtime.ExceptionServices.ExceptionDispatchInfo]::Capture($finalErrors[0]).Throw()};if($finalErrors.Count-gt1){throw[AggregateException]::new('audit and cleanup failures',$finalErrors.ToArray())}
}`,
    walkthrough: [
      { lines: "1-13", explanation: "mandatory source root, four launcher variables의 존재/값 snapshot, owned temp direct child와 newline normalization을 준비합니다." },
      { lines: "14-50", explanation: "ArgumentList·clean child environment·concurrent pipe drains·10초 timeout/tree kill/Dispose와 warning-category compiler, exact Java runner를 정의합니다." },
      { lines: "51-82", explanation: "comment/literal helpers와 ephemeral loopback TCP server의 HTML·XML·JSON exact routes3를 정의합니다." },
      { lines: "84-100", explanation: "fixture port readiness를 읽고 known literals만 source copy에서 치환하며 original D-drive path가 남으면 실패합니다." },
      { lines: "101-118", explanation: "baseline/hostile mode에서 package15, class16 net subset, combined inventory4의 warning counts와 main roles를 각각 고정합니다." },
      { lines: "119-151", explanation: "six DNS calls를 loopback으로, three endpoints를 local routes로, three outputs를 temp로 옮겨 compile/run하고 exact bytes와 server count를 검증합니다." },
      { lines: "153-170", explanation: "comments를 제외한 source shape와 raw HTTPS constructor counts를 검사하고 lifecycle metric 문자열을 반환하며 fixture를 종료합니다." },
      { lines: "172-183", explanation: "space path의 두 modes 결과를 비교하고 privacy evidence를 출력한 뒤 launcher variables와 owned temp cleanup failures를 aggregate합니다." },
    ],
    run: { environment: ["PowerShell 7+ on Windows", "OpenJDK 21", "javastudy2/classstudy source root", "owned loopback TCP fixture", "baseline+hostile launcher modes"], command: "pwsh -NoProfile -File verify-original-net01.ps1 -SourceRoot <classstudy-root>" },
    output: { value: "spacePath=True,modes=2|same=True,package15=9,warnings=5,mains=7|inventory16=2,warnings=2,mains=2|inventory4=4,warnings=3,mains=4|relocated4=4,warnings=3;dns=6loopback,24lines|http=3,server=3|files=38,40,23bytes;shapes=inet:1+5|URL:3|open:3|timeouts:3,3|status:3|body:3+3|readLine:3|newLine:3|disconnect:3|paths:3->temp|endpoints:3->loopback\nprivacy=live-hosts:not-run|original-paths:not-run|fixture:owned-loopback-temp;launcherOptions=4", explanation: ["원본 warnings와 source calls를 보존합니다.", "DNS/HTTP는 owned loopback에서만 실행합니다.", "line rewrite 결과 bytes와 fixture request count가 exact합니다."] },
    experiments: [
      { change: "server가 /json에503을 반환합니다.", prediction: "원본은 errorStream body도 output file에 쓰고 stdout 없이 종료할 수 있어 failure를 success처럼 저장합니다.", result: "modern client는 status를 typed failure와 retry policy로 분리합니다." },
      { change: "server body 마지막에 newline을 추가합니다.", prediction: "readLine/newLine output bytes는 logical lines 수에 따라 달라지며 source terminator identity는 보존되지 않습니다.", result: "raw download와 text normalization 목적을 분리합니다." },
      { change: "connect 전에 exception이 나도록 URL을 malformed하게 둡니다.", prediction: "원본 finally의 null close/disconnect가 primary failure를 가릴 수 있습니다.", result: "try-with-resources와 null-safe lifecycle을 적용합니다." },
    ],
    sourceRefs: ["java-class15-ex08", "java-class15-ex09", "java-class16-ex01", "java-class16-ex02", "jdk21-javac", "powershell-environment", "dotnet-process-start-info", "dotnet-process-environment", "dotnet-process", "dotnet-stream-reader-async", "dotnet-tcp-listener", "java-inet-address", "java-url-api", "java-url-connection", "java-http-url-connection", "java-standard-charsets"],
  }],
  diagnostics: [
    { symptom: "원본 실행 결과의 IP·download bytes가 날마다 달라진다.", likelyCause: "live DNS/CDN/endpoint contents와 availability를 golden으로 사용했습니다.", checks: ["DNS answer set/TTL을 봅니다.", "redirect/status/headers를 기록합니다.", "fixture와 live smoke를 구분합니다."], fix: "correctness tests는 loopback exact fixtures로 옮기고 live checks는 optional contract smoke로 분리합니다.", prevention: "network-free CI와 separately scheduled integration monitoring을 둡니다." },
    { symptom: "malformed URL/setup failure 대신 finally NullPointerException이 보인다.", likelyCause: "br/bw/conn이 null인데 unconditional close/disconnect가 primary exception을 덮었습니다.", checks: ["resource assignment 순서를 봅니다.", "suppressed/cause tree를 확인합니다.", "setup 단계 fault를 주입합니다."], fix: "resource는 try-with-resources로 소유하고 connection만 null-safe finally에서 disconnect합니다.", prevention: "URL/open/status/body/writer setup 각 단계 failure tests를 둡니다." },
  ],
  expertNotes: ["Loopback relocation verifies the original control flow without asserting that third-party sites still expose the historical endpoints.", "The original saves non-2xx error bodies exactly like success bodies. Modern ingestion must preserve diagnostic bodies safely while keeping publication status-aware."],
};

(session.chapters as DetailedSession["chapters"]).push(originalNetworkAuditChapter);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "왜 원본 public hosts를 직접 실행 evidence로 쓰지 않나요?", answer: "DNS·CDN·redirect·contents·availability가 외부에서 변해 correctness result가 재현되지 않고 실제 files/network side effects도 생기기 때문입니다." },
  { question: "loopback relocation은 원본을 수정하나요?", answer: "아닙니다. 원본은 read/compile만 하고 known literals를 owned temp copy에서만 바꿔 실행합니다." },
  { question: "new URL(String) warnings3은 무엇을 뜻하나요?", answer: "JDK21에서 constructor가 deprecated되어 URI를 parse/validate한 뒤 toURL 또는 modern HttpClient를 쓰는 방향을 알려 줍니다." },
  { question: "원본은4xx/5xx에서 항상 예외를 던지나요?", answer: "response code를 얻은 뒤 errorStream을 선택해 body를 파일에 쓸 수 있으므로 status를 별도로 실패 처리해야 합니다." },
  { question: "connect timeout과 read timeout은 같은가요?", answer: "아닙니다. 연결 수립과 이미 연결된 stream read 대기라는 다른 phase를 제한합니다." },
  { question: "readLine/newLine download는 raw bytes를 보존하나요?", answer: "아닙니다. terminators를 제거하고 platform newline과 final newline을 다시 만듭니다." },
  { question: "User-Agent를 browser처럼 쓰면 browser와 같은 보안 문맥인가요?", answer: "아닙니다. header 문자열일 뿐 cookies, browser sandbox, CORS와 사용자 identity를 제공하지 않습니다." },
  { question: "getHostName과 getHostAddress의 차이는 무엇인가요?", answer: "전자는 name/reverse lookup representation, 후자는 numeric address string이며 둘 다 authorization identity로 단독 사용하면 안 됩니다." },
  { question: "finally에서 disconnect만 하면 Reader도 자동으로 안전하게 닫히나요?", answer: "명시적 body stream ownership을 close하고 connection disconnect를 best-effort로 수행해야 합니다." },
  { question: "loopback fixture가 TLS를 검증하나요?", answer: "아닙니다. deterministic HTTP control flow용이며 TLS trust/hostname/protocol tests는 별도 controlled HTTPS fixture가 필요합니다." },
);

(session.completionChecklist as string[]).push(
  "source inventory4와 package boundaries를 확인했다.", "원본 warning categories를 숨기지 않았다.",
  "live host와 endpoint를 correctness test에서 호출하지 않았다.", "original D-drive output files를 열지 않았다.",
  "host·URL·path replacements를 known literals로 제한했다.", "fixture는 ephemeral loopback만 bind했다.",
  "fixture requests3과 exact bodies를 검증했다.", "DNS outputs를 semantic counts로 검증했다.",
  "line normalization files38/40/23bytes를 확인했다.", "baseline/hostile launcher modes를 비교했다.",
  "child timeout·tree kill·drain·Dispose를 적용했다.", "server·environment·temp cleanup failures를 보존했다.",
);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-class15-ex08", repository: "javastudy2 classstudy", path: "src/com/java/class15/Ex08_InetAddress.java", usedFor: ["getLocalHost", "five hostname lookups", "name/address/toString output"], evidence: "DNS/address 원본 one-file inventory입니다." },
  { id: "java-class15-ex09", repository: "javastudy2 classstudy", path: "src/com/java/class15/Ex09_URLConnection.java", usedFor: ["HTML URLConnection", "status/input-error stream", "UTF-8 line file"], evidence: "HTML HTTP download 원본입니다." },
  { id: "java-class16-ex01", repository: "javastudy2 classstudy", path: "src/com/java/class16/Ex01_URLConnection_XML.java", usedFor: ["weather XML download", "timeout", "UTF-8 output"], evidence: "XML HTTP download 원본입니다." },
  { id: "java-class16-ex02", repository: "javastudy2 classstudy", path: "src/com/java/class16/Ex02_URLConnection_JSON.java", usedFor: ["product JSON download", "timeout", "UTF-8 output"], evidence: "JSON HTTP download 원본입니다." },
  { id: "jdk21-javac", repository: "OpenJDK", path: "javac tool", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html", usedFor: ["--release21", "-Xlint:all", "deprecated URL warning evidence"], evidence: "package/inventory compiler evidence와 positive warning0 기준입니다." },
  { id: "powershell-environment", repository: "Microsoft Learn", path: "about_Environment_Variables", publicUrl: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables", usedFor: ["launcher snapshot", "per-variable restore"], evidence: "baseline/hostile isolation 근거입니다." },
  { id: "dotnet-process-start-info", repository: ".NET API", path: "System.Diagnostics.ProcessStartInfo", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo", usedFor: ["argument list", "redirected server/java launch"], evidence: "safe child construction 근거입니다." },
  { id: "dotnet-process-environment", repository: ".NET API", path: "ProcessStartInfo.Environment", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.processstartinfo.environment", usedFor: ["child launcher option removal"], evidence: "clean child environment 근거입니다." },
  { id: "dotnet-process", repository: ".NET API", path: "System.Diagnostics.Process", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process", usedFor: ["timeout", "tree kill", "Dispose"], evidence: "bounded child/server lifecycle 근거입니다." },
  { id: "dotnet-stream-reader-async", repository: ".NET API", path: "StreamReader.ReadToEndAsync", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader.readtoendasync", usedFor: ["concurrent stdout/stderr drain"], evidence: "redirect pipe deadlock 방지 근거입니다." },
  { id: "dotnet-tcp-listener", repository: ".NET API", path: "System.Net.Sockets.TcpListener", publicUrl: "https://learn.microsoft.com/en-us/dotnet/api/system.net.sockets.tcplistener", usedFor: ["owned loopback HTTP fixture", "ephemeral port"], evidence: "external network 없는 exact HTTP fixture 근거입니다." },
  { id: "java-inet-address", repository: "Java SE 21 API", path: "java.net.InetAddress", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/InetAddress.html", usedFor: ["host/address APIs", "loopback relocation", "DNS semantics"], evidence: "original DNS calls와 modern address classification 근거입니다." },
  { id: "java-url-api", repository: "Java SE 21 API", path: "java.net.URL", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URL.html", usedFor: ["deprecated constructor evidence", "legacy URL object"], evidence: "원본 new URL warning과 URI migration 근거입니다." },
  { id: "java-url-connection", repository: "Java SE 21 API", path: "java.net.URLConnection", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URLConnection.html", usedFor: ["openConnection", "timeouts", "headers"], evidence: "legacy connection base contract 근거입니다." },
  { id: "java-http-url-connection", repository: "Java SE 21 API", path: "java.net.HttpURLConnection", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/HttpURLConnection.html", usedFor: ["status", "input/error streams", "disconnect"], evidence: "original HTTP-specific lifecycle 근거입니다." },
  { id: "java-standard-charsets", repository: "Java SE 21 API", path: "java.nio.charset.StandardCharsets", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/StandardCharsets.html", usedFor: ["original explicit UTF-8", "fixture exact bytes"], evidence: "body text encoding boundary 근거입니다." },
);

const addressingAndHttpChapters: DetailedSession["chapters"] = [
  {
    id: "inetaddress-dns-forward-reverse-ipv4-ipv6",
    title: "hostname·DNS answer set·numeric IPv4/IPv6와 reverse name을 authorization identity와 분리합니다",
    lead: "InetAddress는 address value를 표현하지만 DNS answer freshness·ordering·trust와 연결 성공까지 보장하지 않으므로 각 단계의 evidence를 따로 봅니다.",
    explanations: [
      "hostname은 사람이 관리하는 DNS name이고 IP literal은 network-layer numeric address입니다. InetAddress.getByName은 literal parse 또는 name service lookup을 수행할 수 있어 같은 메서드라도 failure source가 다릅니다.",
      "getAllByName은 host의 현재 answer set을 반환할 수 있고 order·개수·IPv4/IPv6는 resolver와 환경에 따라 달라집니다. 첫 answer만 policy-check하고 connect가 다른 address를 쓰지 않게 합니다.",
      "getHostAddress는 numeric presentation이고 getHostName/getCanonicalHostName은 supplied name 또는 reverse lookup을 유발할 수 있습니다. reverse name을 authentication/authorization 근거로 신뢰하지 않습니다.",
      "UnknownHostException은 name이 존재하지 않음뿐 아니라 resolver/network/configuration failure도 포함할 수 있습니다. retry budget과 negative caching을 무한 retry로 덮지 않습니다.",
      "JVM/name-service와 OS resolver caching TTL이 존재합니다. DNS rebinding 방어에서 allowlist host string 검증과 resolved address 검증, connect 대상 고정을 하나의 operation으로 묶습니다.",
      "IPv4 loopback127.0.0.0/8과 IPv6::1, unspecified, link-local, site-local/unique-local, multicast를 목적별로 분류합니다. 문자열 prefix보다 parsed address bytes와 API predicates를 사용합니다.",
      "IPv4-mapped IPv6와 textual normalization은 우회 표면입니다. URL parser가 만든 host와 resolver result objects를 canonical policy input으로 사용하고 raw string 비교만 하지 않습니다.",
      "주소가 public이어도 port/path/protocol이 허용된 것은 아닙니다. DNS policy는 SSRF 전체 중 한 gate이며 redirect와 proxy resolution에도 다시 적용합니다.",
      "예제는 DNS 없이 supplied-name+raw bytes로 IPv4/IPv6 loopback을 만들어 class/address/loopback/family facts를 stable 출력합니다.",
    ],
    concepts: [
      { term: "forward DNS", definition: "hostname을 하나 이상의 address records로 해석하는 과정입니다.", detail: ["answer set/TTL이 변합니다.", "lookup 성공과 connect 성공은 다릅니다."] },
      { term: "reverse DNS", definition: "numeric address를 PTR/name으로 조회하는 과정이며 보통 logging/display 보조 정보입니다.", detail: ["신뢰 identity가 아닙니다.", "추가 network lookup일 수 있습니다."] },
      { term: "address scope", definition: "loopback·link-local·private/site-local·global·multicast처럼 address가 유효한 network 범위입니다.", detail: ["SSRF policy에 사용합니다.", "IPv4/IPv6 규칙이 다릅니다."] },
    ],
    codeExamples: [{
      id: "java-inetaddress-family-scope",
      title: "DNS 없이 IPv4·IPv6 loopback bytes의 class와 scope를 확인합니다",
      language: "java",
      filename: "InetAddressFamilyScope.java",
      purpose: "text hostname variability를 제거하고 parsed address family/scope facts를 검증합니다.",
      code: String.raw`import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;

public class InetAddressFamilyScope {
    public static void main(String[] args) throws Exception {
        InetAddress ipv4 = InetAddress.getByAddress(
                "loop-v4", new byte[] {127, 0, 0, 1});
        InetAddress ipv6 = InetAddress.getByAddress(
                "loop-v6", new byte[] {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1});
        System.out.println("v4Class=" + ipv4.getClass().getSimpleName());
        System.out.println("v6Class=" + ipv6.getClass().getSimpleName());
        System.out.println("v4Address=" + ipv4.getHostAddress());
        System.out.println("v6Address=" + ipv6.getHostAddress());
        System.out.println("bothLoopback=" + (ipv4.isLoopbackAddress() && ipv6.isLoopbackAddress()));
        System.out.println("families=" + (ipv4 instanceof Inet4Address) + "," + (ipv6 instanceof Inet6Address));
    }
}`,
      walkthrough: [
        { lines: "1-3", explanation: "address base와 IPv4/IPv6 family classes를 import합니다." },
        { lines: "6-10", explanation: "DNS lookup 없이 supplied labels와 exact loopback bytes로 두 address objects를 만듭니다." },
        { lines: "11-16", explanation: "runtime class, numeric presentation, loopback predicates와 family checks를 출력합니다." },
        { lines: "17-18", explanation: "main과 class scope를 닫으며 socket·resolver resource가 생성되지 않았음을 확인합니다." },
      ],
      run: { environment: ["OpenJDK 21", "no DNS/network", "raw address bytes", "-Xlint:all warning0"], command: isolatedJavaRun("InetAddressFamilyScope.java", "InetAddressFamilyScope") },
      output: { value: "v4Class=Inet4Address\nv6Class=Inet6Address\nv4Address=127.0.0.1\nv6Address=0:0:0:0:0:0:0:1\nbothLoopback=true\nfamilies=true,true", explanation: ["두 runtime family가 분리됩니다.", "numeric loopback presentations가 stable합니다.", "scope와 family predicates가 모두 true입니다."] },
      experiments: [
        { change: "IPv4 bytes를8.8.8.8로 바꿉니다.", prediction: "isLoopbackAddress=false지만 실제 reachability/ownership은 증명하지 않습니다.", result: "scope와 authorization을 분리합니다." },
        { change: "getHostName을 출력합니다.", prediction: "supplied loop-v4/loop-v6 names가 보이지만 DNS 신뢰 증명이 아닙니다.", result: "numeric address와 display name을 구분합니다." },
        { change: "getAllByName(\"localhost\")를 사용합니다.", prediction: "환경에 따라 one/multiple IPv4/IPv6 answers와 order가 달라질 수 있습니다.", result: "exact golden 대신 set/scope invariant를 사용합니다." },
      ],
      sourceRefs: ["java-inet-address", "java-inet4-address", "java-inet6-address", "rfc-1034", "rfc-1035", "rfc-4291"],
    }],
    diagnostics: [
      { symptom: "localhost test가 어떤 환경에서는 IPv4, 다른 환경에서는 IPv6라 실패한다.", likelyCause: "resolver answer family/order를 exact string 하나로 고정했습니다.", checks: ["getAllByName set을 봅니다.", "hosts/resolver config를 확인합니다.", "bind family를 기록합니다."], fix: "family-neutral behavior를 테스트하거나 controlled raw address/explicit bind를 사용합니다.", prevention: "IPv4/IPv6 fixtures와 address-set assertions를 둡니다." },
      { symptom: "allowlisted hostname이 private address로 연결된다.", likelyCause: "host string만 검사하고 DNS answers/connect address 또는 redirect target을 재검증하지 않았습니다.", checks: ["all resolved addresses를 봅니다.", "proxy/redirect resolution을 추적합니다.", "TTL/rebinding timing을 기록합니다."], fix: "operation에서 resolution result 전체를 scope-check하고 validated address로 connect하며 redirects마다 반복합니다.", prevention: "public→private rebinding과 multi-answer negative tests를 둡니다." },
    ],
    expertNotes: ["DNSSEC or authenticated service identity is a separate concern; InetAddress lookup alone is not an authorization primitive.", "Do not perform reverse DNS on hot error paths without timeout and privacy considerations."],
  },
  {
    id: "uri-components-raw-decoded-normalization-encoding",
    title: "URI를 component 단위로 parse하고 raw·decoded path, query encoding과 normalization의 한계를 구분합니다",
    lead: "전체 URL string을 concatenate하거나 decode한 뒤 재parse하지 않고 scheme·authority·host·port·path·query·fragment의 문법과 정책을 각각 검증합니다.",
    explanations: [
      "URI는 identifier syntax와 components를 모델링하고 URL/connection은 resource access까지 포함합니다. parse 성공이 scheme/host/port/path가 application policy에 맞다는 뜻은 아닙니다.",
      "getRawPath는 percent-encoded octets를 보존하고 getPath는 decoded characters를 제공합니다. security routing에서 decode 횟수·encoded slash/dot·Unicode normalization을 명시합니다.",
      "URI.normalize는 path의 literal dot segments를 정리하지만 percent-encoded dot, filesystem symlink, server-specific decoding과 authorization을 해결하지 않습니다.",
      "query는 path와 다른 grammar입니다. URLEncoder는 HTML form application/x-www-form-urlencoded component용이라 space를+로 만들며 전체 URI를 encode하는 API가 아닙니다.",
      "fragment는 HTTP request target으로 server에 전송되지 않습니다. server-side fetch policy에서는 fragment를 거부하거나 무시하되 signed/canonical input 의미를 문서화합니다.",
      "userinfo가 있는 authority는 credential confusion과 log leakage를 만들 수 있어 external fetch URL에서는 금지합니다. host allowlist 비교 전에 parser가 분리한 userInfo/host를 사용합니다.",
      "default port와 explicit port는 network destination 관점에서 normalize할 수 있지만 signature/cache key에서는 lexical form이 다를 수 있습니다. 하나의 canonicalization profile을 정합니다.",
      "IDN Unicode hostname은 IDN.toASCII와 UTS46/browser behavior 차이가 있습니다. display Unicode와 policy ASCII label을 분리하고 mixed-script/confusable review를 둡니다.",
      "예제는 constructor가 space를 percent-encode한 URI의 raw/decoded path, normalize 결과, query, host/port/scheme을 exact 출력합니다.",
    ],
    concepts: [
      { term: "raw component", definition: "percent escapes를 아직 decode하지 않은 URI component text입니다.", detail: ["canonical/security review에 필요합니다.", "decoded view와 함께 봅니다."] },
      { term: "dot-segment normalization", definition: "hierarchical path의 literal .과 .. segments를 RFC algorithm에 따라 줄이는 처리입니다.", detail: ["encoded variants는 별도입니다.", "filesystem resolution이 아닙니다."] },
      { term: "component encoding", definition: "path segment·query name/value 등 각 component grammar에 맞게 data octets를 percent/form encode하는 과정입니다.", detail: ["전체 URI encode와 다릅니다.", "decode 횟수를 고정합니다."] },
    ],
    codeExamples: [{
      id: "java-uri-component-model",
      title: "space path를 raw/decoded로 보고 dot segments를 normalize합니다",
      language: "java",
      filename: "UriComponentModel.java",
      purpose: "URI string concatenation 없이 typed constructor와 component getters의 exact 차이를 확인합니다.",
      code: String.raw`import java.net.URI;

public class UriComponentModel {
    public static void main(String[] args) throws Exception {
        URI uri = new URI(
                "https", null, "example.com", 8443,
                "/a b/../c", "q=x/y&lang=ko", "part");
        URI normalized = uri.normalize();
        System.out.println("scheme=" + uri.getScheme());
        System.out.println("host=" + uri.getHost());
        System.out.println("port=" + uri.getPort());
        System.out.println("rawPath=" + uri.getRawPath());
        System.out.println("decodedPath=" + uri.getPath());
        System.out.println("normalizedPath=" + normalized.getRawPath());
        System.out.println("rawQuery=" + uri.getRawQuery());
        System.out.println("fragment=" + uri.getFragment());
    }
}`,
      walkthrough: [
        { lines: "1", explanation: "fetch side effect 없는 URI value type을 import합니다." },
        { lines: "4-7", explanation: "scheme/host/port/path/query/fragment를 typed constructor parameters로 전달합니다." },
        { lines: "8-16", explanation: "normalize 후 scheme·authority facts와 raw/decoded/normalized components를 출력합니다." },
        { lines: "17-18", explanation: "network API 호출 없이 value-model 예제를 종료합니다." },
      ],
      run: { environment: ["OpenJDK 21", "no network", "RFC3986 URI syntax", "-Xlint:all warning0"], command: isolatedJavaRun("UriComponentModel.java", "UriComponentModel") },
      output: { value: "scheme=https\nhost=example.com\nport=8443\nrawPath=/a%20b/../c\ndecodedPath=/a b/../c\nnormalizedPath=/c\nrawQuery=q=x/y&lang=ko\nfragment=part", explanation: ["space만 %20 raw path로 encode됩니다.", "decoded path는 space와 dot segments를 보입니다.", "normalize 결과 literal preceding segment가 제거됩니다."] },
      experiments: [
        { change: "path를 /a/%2e%2e/c raw string으로 만듭니다.", prediction: "normalize가 encoded dots를 literal ..처럼 제거하지 않을 수 있습니다.", result: "decode/normalize order를 security policy로 고정합니다." },
        { change: "authority에 user@example.com을 넣습니다.", prediction: "getUserInfo가 user이고 host가 example.com으로 분리됩니다.", result: "external fetch에서 userInfo를 거부합니다." },
        { change: "전체 URI에 URLEncoder를 적용합니다.", prediction: "scheme separators까지 form-encode되어 valid target이 깨집니다.", result: "query value 같은 data component만 encode합니다." },
      ],
      sourceRefs: ["java-uri-api", "java-url-encoder", "java-idn-api", "rfc-3986"],
    }],
    diagnostics: [
      { symptom: "allowlist path 검사 뒤 server가 다른 endpoint를 처리한다.", likelyCause: "raw/decoded/normalized path와 server decode rules가 달라 encoded slash/dot 또는 double decode가 발생했습니다.", checks: ["raw request target을 기록합니다.", "decode 횟수와 router normalization을 확인합니다.", "encoded separator fixtures를 실행합니다."], fix: "client와 server가 공유하는 canonical component policy를 정하고 ambiguous encodings를 거부합니다.", prevention: "raw/encoded/double-encoded path matrix를 authorization tests에 둡니다." },
      { symptom: "한글/space query가+·%20·%25로 중복 변환된다.", likelyCause: "form encoding, URI percent encoding과 already-encoded input을 구분하지 않았습니다.", checks: ["rawQuery와 decoded values를 봅니다.", "encode 호출 횟수를 추적합니다.", "Content-Type contract를 확인합니다."], fix: "unencoded domain values에서 한 번만 component-specific encoder를 호출합니다.", prevention: "space,+,%,/,Unicode round-trip fixtures를 둡니다." },
    ],
    expertNotes: ["URI normalization is syntactic, not a substitute for endpoint authorization or filesystem canonicalization.", "Avoid URL.equals/hashCode for policy/cache identity because historical URL behavior can involve host resolution; use normalized URI/application keys."],
  },
  {
    id: "java-httpclient-request-response-contract-loopback",
    title: "Java11+ HttpClient에서 connect/request timeout, redirect policy, status·headers·body를 명시합니다",
    lead: "HttpClient transport success와 HTTP application success를 분리하고 BodyHandler가 언제 얼마나 body를 materialize하는지 계약으로 관리합니다.",
    explanations: [
      "HttpClient는 builder에서 connect timeout, redirect policy, HTTP version preference, authenticator/proxy/executor를 설정합니다. request마다 URI, method, headers와 overall request timeout을 둡니다.",
      "connectTimeout은 새 TCP connection 수립을 제한하고 HttpRequest.timeout은 response를 얻는 operation deadline에 가깝습니다. DNS resolver와 body subscriber/caller processing까지 하나의 숫자가 모두 제한한다고 가정하지 않습니다.",
      "send가 정상 반환해도 status404/429/503일 수 있습니다. transport exception과 response status branch를 별도 types로 다룹니다.",
      "BodyHandlers.ofString은 response body를 memory String으로 materialize합니다. untrusted large body에는 ofInputStream/custom bounded subscriber 또는 byte limit layer를 사용합니다.",
      "Content-Type과 charset을 body decode 전에 확인합니다. JSON media인데 HTML login/error page가 온 경우 parser error로만 보고하지 않습니다.",
      "headers는 case-insensitive이고 repeated values가 가능합니다. hop-by-hop, Set-Cookie, authorization과 privacy-sensitive headers를 log에 그대로 남기지 않습니다.",
      "client는 immutable하고 여러 requests에 재사용해 connection pooling을 활용합니다. request-specific credentials/cancellation과 response body ownership은 operation scope입니다.",
      "local com.sun.net.httpserver fixture는 production server API가 아니라 deterministic client contract test 도구입니다. ephemeral127.0.0.1에만 bind하고 finally stop합니다.",
      "예제는 GET/Accept request를 한 번 받고 JSON UTF-8 body를 status200·media·bytes와 함께 exact 출력합니다.",
    ],
    concepts: [
      { term: "transport success", definition: "DNS/connect/TLS/HTTP exchange가 response object를 만들었다는 상태이며2xx를 뜻하지 않습니다.", detail: ["4xx/5xx도 response입니다.", "exception과 status를 분리합니다."] },
      { term: "BodyHandler", definition: "response metadata를 보고 body bytes를 어떤 subscriber/result type으로 처리할지 선택하는 HttpClient 전략입니다.", detail: ["memory/streaming이 다릅니다.", "limits가 필요합니다."] },
      { term: "client reuse", definition: "immutable HttpClient를 공유해 connection pool과 configuration을 재사용하는 lifecycle입니다.", detail: ["per-request timeout/header는 Request에 둡니다.", "global mutation을 피합니다."] },
    ],
    codeExamples: [{
      id: "java-httpclient-loopback-contract",
      title: "loopback JSON GET의 request count·status·media·bytes를 확인합니다",
      language: "java",
      filename: "HttpClientLoopbackContract.java",
      purpose: "외부 network 없이 modern HttpClient request/response contract를 실행 검증합니다.",
      code: String.raw`import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

public class HttpClientLoopbackContract {
    public static void main(String[] args) throws Exception {
        AtomicInteger requests = new AtomicInteger();
        byte[] body = "{\"ok\":true}".getBytes(StandardCharsets.UTF_8);
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/data", exchange -> {
            requests.incrementAndGet();
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        try {
            URI uri = URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/data");
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(2))
                    .followRedirects(HttpClient.Redirect.NEVER)
                    .build();
            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(2))
                    .header("Accept", "application/json")
                    .GET().build();
            HttpResponse<byte[]> response = client.send(
                    request, HttpResponse.BodyHandlers.ofByteArray());
            System.out.println("requests=" + requests.get());
            System.out.println("status=" + response.statusCode());
            System.out.println("media=" + response.headers().firstValue("Content-Type").orElse(""));
            System.out.println("body=" + new String(response.body(), StandardCharsets.UTF_8));
            System.out.println("bytes=" + response.body().length);
        } finally {
            server.stop(0);
        }
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "loopback server, HttpClient/request/response, UTF-8, timeout와 counter를 import합니다." },
        { lines: "12-22", explanation: "ephemeral127 server가 request를 세고 exact JSON media/body를 반환합니다." },
        { lines: "23-34", explanation: "connect/request2s, redirect NEVER와 Accept JSON GET을 구성해 byte[] handler로 전송합니다." },
        { lines: "35-41", explanation: "request count, status, media, explicit UTF-8 body와 bytes를 출력합니다." },
        { lines: "42-44", explanation: "성공/실패 모두 server를 즉시 stop합니다." },
      ],
      run: { environment: ["OpenJDK 21", "127.0.0.1 ephemeral HttpServer", "no external network", "-Xlint:all warning0"], command: isolatedJavaRun("HttpClientLoopbackContract.java", "HttpClientLoopbackContract") },
      output: { value: "requests=1\nstatus=200\nmedia=application/json; charset=utf-8\nbody={\"ok\":true}\nbytes=11", explanation: ["GET은 exactly once입니다.", "status/media/body contract가 분리됩니다.", "UTF-8 JSON ASCII body는11bytes입니다."] },
      experiments: [
        { change: "server status를404로 바꿉니다.", prediction: "send는 response를 반환하고 status=404이며 자동 exception은 아닙니다.", result: "status classifier를 추가합니다." },
        { change: "BodyHandlers.ofString(UTF_8)을 사용합니다.", prediction: "same text를 얻지만 body size pre-limit 전략이 달라집니다.", result: "untrusted body에는 bounded bytes/streaming을 설계합니다." },
        { change: "server bind를0.0.0.0로 바꿉니다.", prediction: "fixture가 외부 interface에 노출될 수 있습니다.", result: "tests는 explicit127.0.0.1만 bind합니다." },
      ],
      sourceRefs: ["java-http-client", "java-http-request", "java-http-response", "java-http-response-body-handlers", "java-http-headers", "jdk-http-server", "java-duration-api", "rfc-9110-http"],
    }],
    diagnostics: [
      { symptom: "HttpClient.send가 반환했는데 code가 success path로 들어가404 HTML을 JSON parse한다.", likelyCause: "response object 존재를 HTTP2xx success와 동일시했습니다.", checks: ["status를 body parse 전에 봅니다.", "Content-Type과 body prefix를 확인합니다.", "redirect/auth page를 조사합니다."], fix: "status/media gates를 통과한 body만 parser에 전달하고 safe error body summary를 보존합니다.", prevention: "2xx/204/3xx/4xx/429/5xx fixtures를 둡니다." },
      { symptom: "timeout2초인데 요청 전체가 더 오래 걸린다.", likelyCause: "DNS, queued executor work, streaming body consumer 또는 retry가 별도 budget을 사용합니다.", checks: ["phase timestamps를 봅니다.", "connect/request/body/application processing을 나눕니다.", "retry total deadline을 확인합니다."], fix: "operation total deadline과 phase budgets/cancellation을 함께 전파합니다.", prevention: "DNS/connect/header/body stall과 retry compound timeout tests를 둡니다." },
    ],
    expertNotes: ["The JDK HttpServer is sufficient for deterministic protocol fixtures but does not model every production proxy/TLS behavior.", "If a body may be large, choose a bounded subscriber before allocation rather than checking String length afterward."],
  },
  {
    id: "network-failure-taxonomy-dns-connect-tls-http-media-parse",
    title: "DNS·connect·TLS·timeout·HTTP·media·decode·parse·schema 실패를 typed phase와 recovery로 나눕니다",
    lead: "모든 실패를 IOException 또는 RuntimeException 한 종류로 감싸지 않고 어느 경계까지 성공했는지 보존해 retry·사용자 메시지·관측을 결정합니다.",
    explanations: [
      "UnknownHostException은 DNS/address resolution phase, ConnectException은 route/refused/connect phase, SSLException은 TLS handshake/trust/protocol phase로 분류합니다.",
      "HttpTimeoutException은 request deadline, InterruptedException은 caller cancellation/interrupt contract와 관련됩니다. interrupt를 swallow하지 않고 flag/exception policy를 보존합니다.",
      "HTTP4xx/5xx는 transport exception이 아니라 status response입니다. 401/403/404/409/412/422/429/500/502/503/504는 의미와 retry 가능성이 다릅니다.",
      "GET/HEAD/PUT/DELETE 같은 method semantics와 실제 endpoint idempotency를 확인하지 않고 timeout 뒤 자동 retry하면 duplicate mutation이 생깁니다. POST도 idempotency key가 있으면 별도 정책이 가능합니다.",
      "Content-Type mismatch, unsupported charset/encoding과 decompression failure는 parse 전에 body representation phase failures입니다.",
      "XML well-formed/JSON syntax parse 성공 뒤에도 schema/type/range/required/duplicate/relationship errors가 있습니다. parse failure와 domain rejection을 같은 사용자 메시지로 뭉치지 않습니다.",
      "error model에는 stable category, retryable boolean, safe endpoint id, status, attempt와 phase duration을 두고 raw query credentials/body/stack을 public log에서 제외합니다.",
      "retryable은 즉시 retry를 뜻하지 않습니다. total deadline, max attempts, exponential backoff+jitter, Retry-After, circuit/bulkhead와 caller cancellation을 적용합니다.",
      "예제는 실제 network 없이 representative exception/status/media signals를 stable categories로 매핑해 taxonomy 자체를 warning0 exact test로 고정합니다.",
    ],
    concepts: [
      { term: "failure phase", definition: "resolution→connect→TLS→HTTP→body→decode→parse→schema 중 작업이 실패한 경계입니다.", detail: ["recovery가 다릅니다.", "timing을 분리합니다."] },
      { term: "retryability", definition: "request semantics·failure phase·status·attempt budget을 고려해 안전하게 다시 시도할 수 있는지에 대한 policy result입니다.", detail: ["실패 type만으로 결정하지 않습니다.", "total deadline을 가집니다."] },
      { term: "safe error envelope", definition: "stable category·status·correlation·safe context만 외부에 내고 raw secret/body/path를 제한하는 오류 표현입니다.", detail: ["internal cause chain은 보존합니다.", "privacy를 지킵니다."] },
    ],
    codeExamples: [{
      id: "java-network-failure-taxonomy",
      title: "대표 exceptions와 HTTP statuses를 stable phase categories로 분류합니다",
      language: "java",
      filename: "NetworkFailureTaxonomy.java",
      purpose: "broad IOException wrapping 대신 retry/recovery에 필요한 phase 정보를 exact mapping으로 검증합니다.",
      code: String.raw`import java.net.ConnectException;
import java.net.UnknownHostException;
import java.net.http.HttpTimeoutException;
import javax.net.ssl.SSLException;

public class NetworkFailureTaxonomy {
    static String transport(Throwable failure) {
        if (failure instanceof UnknownHostException) return "dns";
        if (failure instanceof ConnectException) return "connect";
        if (failure instanceof SSLException) return "tls";
        if (failure instanceof HttpTimeoutException) return "timeout";
        return "transport-other";
    }
    static String status(int code) {
        if (code >= 200 && code < 300) return "http-success";
        if (code == 429 || code == 502 || code == 503 || code == 504) {
            return "http-retryable";
        }
        return "http-permanent";
    }
    public static void main(String[] args) {
        System.out.println("dns=" + transport(new UnknownHostException()));
        System.out.println("connect=" + transport(new ConnectException()));
        System.out.println("tls=" + transport(new SSLException("fixture")));
        System.out.println("timeout=" + transport(new HttpTimeoutException("fixture")));
        System.out.println("status503=" + status(503));
        System.out.println("status404=" + status(404));
        System.out.println("mediaMismatch=media");
        System.out.println("syntaxFailure=parse");
        System.out.println("fieldFailure=schema");
    }
}`,
      walkthrough: [
        { lines: "1-4", explanation: "DNS/connect/timeout/TLS representative exception types를 import합니다." },
        { lines: "7-13", explanation: "specific exception에서 stable transport phase category를 반환합니다." },
        { lines: "14-20", explanation: "2xx, selected retryable statuses와 permanent response를 분류합니다." },
        { lines: "21-31", explanation: "four transport, two HTTP와 media/parse/schema boundaries를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "no network", "synthetic typed signals", "-Xlint:all warning0"], command: isolatedJavaRun("NetworkFailureTaxonomy.java", "NetworkFailureTaxonomy") },
      output: { value: "dns=dns\nconnect=connect\ntls=tls\ntimeout=timeout\nstatus503=http-retryable\nstatus404=http-permanent\nmediaMismatch=media\nsyntaxFailure=parse\nfieldFailure=schema", explanation: ["transport phases4가 유지됩니다.", "HTTP status retry policy가 별도입니다.", "representation/parse/domain gates도 독립 categories입니다."] },
      experiments: [
        { change: "status429를 permanent set으로 옮깁니다.", prediction: "server Retry-After를 무시하게 됩니다.", result: "endpoint/business policy와 total deadline을 함께 검토합니다." },
        { change: "InterruptedException을 transport-other로 감쌉니다.", prediction: "caller cancellation signal을 잃습니다.", result: "interrupt flag 복원/propagation 계약을 둡니다." },
        { change: "JSON schema error를 parse로 합칩니다.", prediction: "producer syntax 결함과 contract field 결함의 ownership/metric이 섞입니다.", result: "parse와 validation adapters를 분리합니다." },
      ],
      sourceRefs: ["java-unknown-host-exception", "java-connect-exception", "java-http-timeout-exception", "java-ssl-exception", "rfc-9110-http", "rfc-9111-cache"],
    }],
    diagnostics: [
      { symptom: "모든 network failure가 RuntimeException이라 retry가 잘못되거나 불가능하다.", likelyCause: "phase/status/cause를 broad wrapping하면서 잃었습니다.", checks: ["cause chain과 original exception type을 봅니다.", "status response가 exception으로 변환됐는지 확인합니다.", "retry decision logs를 봅니다."], fix: "boundary adapter에서 typed phase envelope를 만들고 cause를 보존합니다.", prevention: "각 phase exception/status fixture와 retry table contract tests를 둡니다." },
      { symptom: "503 retry가 장애를 더 키우거나 request가 deadline 뒤에도 계속된다.", likelyCause: "attempt별 timeout만 있고 total deadline·jitter·max attempts·cancellation이 없습니다.", checks: ["attempt timeline을 봅니다.", "Retry-After와 idempotency를 확인합니다.", "concurrency queue를 측정합니다."], fix: "total budget 안에서 bounded exponential backoff+jitter와 cancellation/bulkhead를 적용합니다.", prevention: "retry storm simulation과 deadline propagation tests를 둡니다." },
    ],
    expertNotes: ["Retryability is a policy over an operation, not a static property of an exception class.", "Keep enough internal cause detail for diagnosis while exposing only stable, privacy-safe categories."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...addressingAndHttpChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-inet4-address", repository: "Java SE 21 API", path: "java.net.Inet4Address", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/Inet4Address.html", usedFor: ["IPv4 family predicate", "loopback fixture"], evidence: "IPv4 address family 근거입니다." },
  { id: "java-inet6-address", repository: "Java SE 21 API", path: "java.net.Inet6Address", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/Inet6Address.html", usedFor: ["IPv6 family predicate", "::1 fixture"], evidence: "IPv6 address family 근거입니다." },
  { id: "rfc-1034", repository: "IETF", path: "RFC 1034 Domain Names Concepts and Facilities", publicUrl: "https://www.rfc-editor.org/rfc/rfc1034", usedFor: ["DNS names", "resolver/cache concepts"], evidence: "DNS architecture concepts 근거입니다." },
  { id: "rfc-1035", repository: "IETF", path: "RFC 1035 Domain Names Implementation and Specification", publicUrl: "https://www.rfc-editor.org/rfc/rfc1035", usedFor: ["resource records", "answer sets", "TTL"], evidence: "DNS records/protocol 근거입니다." },
  { id: "rfc-4291", repository: "IETF", path: "RFC 4291 IPv6 Addressing Architecture", publicUrl: "https://www.rfc-editor.org/rfc/rfc4291", usedFor: ["IPv6 textual/scope rules", "loopback"], evidence: "IPv6 address architecture 근거입니다." },
  { id: "java-uri-api", repository: "Java SE 21 API", path: "java.net.URI", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URI.html", usedFor: ["component constructor", "raw/decoded getters", "normalize"], evidence: "side-effect-free URI parsing/model 근거입니다." },
  { id: "java-url-encoder", repository: "Java SE 21 API", path: "java.net.URLEncoder", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URLEncoder.html", usedFor: ["form component encoding distinction"], evidence: "application/x-www-form-urlencoded semantics 근거입니다." },
  { id: "java-idn-api", repository: "Java SE 21 API", path: "java.net.IDN", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/IDN.html", usedFor: ["Unicode hostname ASCII labels", "display-policy split"], evidence: "internationalized domain conversion 근거입니다." },
  { id: "rfc-3986", repository: "IETF", path: "RFC 3986 URI Generic Syntax", publicUrl: "https://www.rfc-editor.org/rfc/rfc3986", usedFor: ["URI components", "percent encoding", "dot segments", "resolution"], evidence: "URI syntax/normalization normative 근거입니다." },
  { id: "java-http-client", repository: "Java SE 21 API", path: "java.net.http.HttpClient", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.html", usedFor: ["client reuse", "connect timeout", "redirect policy"], evidence: "modern HTTP client lifecycle 근거입니다." },
  { id: "java-http-request", repository: "Java SE 21 API", path: "java.net.http.HttpRequest", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpRequest.html", usedFor: ["URI/method/header/request timeout"], evidence: "immutable request contract 근거입니다." },
  { id: "java-http-response", repository: "Java SE 21 API", path: "java.net.http.HttpResponse", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpResponse.html", usedFor: ["status/headers/body separation"], evidence: "response contract 근거입니다." },
  { id: "java-http-response-body-handlers", repository: "Java SE 21 API", path: "HttpResponse.BodyHandlers", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpResponse.BodyHandlers.html", usedFor: ["byte array/string/stream body strategies"], evidence: "body materialization choice 근거입니다." },
  { id: "java-http-headers", repository: "Java SE 21 API", path: "java.net.http.HttpHeaders", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpHeaders.html", usedFor: ["case-insensitive response headers", "firstValue"], evidence: "HTTP header access 근거입니다." },
  { id: "jdk-http-server", repository: "Java SE 21 API", path: "com.sun.net.httpserver.HttpServer", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/jdk.httpserver/com/sun/net/httpserver/HttpServer.html", usedFor: ["ephemeral loopback client fixture"], evidence: "network-free contract server 근거입니다." },
  { id: "java-duration-api", repository: "Java SE 21 API", path: "java.time.Duration", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Duration.html", usedFor: ["connect/request timeout values"], evidence: "typed timeout duration 근거입니다." },
  { id: "java-unknown-host-exception", repository: "Java SE 21 API", path: "java.net.UnknownHostException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/UnknownHostException.html", usedFor: ["DNS phase failure category"], evidence: "name/address resolution failure 근거입니다." },
  { id: "java-connect-exception", repository: "Java SE 21 API", path: "java.net.ConnectException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/ConnectException.html", usedFor: ["connect phase failure category"], evidence: "connection establishment failure 근거입니다." },
  { id: "java-http-timeout-exception", repository: "Java SE 21 API", path: "java.net.http.HttpTimeoutException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpTimeoutException.html", usedFor: ["request timeout category"], evidence: "HttpClient timeout failure 근거입니다." },
  { id: "java-ssl-exception", repository: "Java SE 21 API", path: "javax.net.ssl.SSLException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/javax/net/ssl/SSLException.html", usedFor: ["TLS phase failure category"], evidence: "TLS/SSL failure hierarchy 근거입니다." },
  { id: "rfc-9110-http", repository: "IETF", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110", usedFor: ["methods", "status semantics", "headers", "idempotency"], evidence: "HTTP semantics normative 근거입니다." },
  { id: "rfc-9111-cache", repository: "IETF", path: "RFC 9111 HTTP Caching", publicUrl: "https://www.rfc-editor.org/rfc/rfc9111", usedFor: ["cache/revalidation context", "stale/retry distinction"], evidence: "HTTP cache behavior 근거입니다." },
);

const boundedHttpChapters: DetailedSession["chapters"] = [
  {
    id: "httpurlconnection-safe-lifecycle-status-error-stream",
    title: "HttpURLConnection의 설정·status·error stream·close·disconnect 순서를 안전하게 고정합니다",
    lead: "legacy API를 유지해야 할 때도 2xx만 가정하거나 finally에서 null close를 반복하지 않고 connection과 body stream의 소유권을 분명히 합니다.",
    explanations: [
      "URI를 먼저 구조적으로 검증한 뒤 URI.toURL().openConnection()으로 변환하면 deprecated URL(String)을 피할 수 있습니다. 하지만 URLConnection 생성 자체가 대상의 안전성을 보장하지는 않습니다.",
      "connect timeout은 연결 수립 대기, read timeout은 이미 연결된 stream read 대기를 제한합니다. DNS와 전체 작업 deadline, retry 누적 시간은 별도 정책이 필요합니다.",
      "setRequestMethod·timeouts·headers는 connect/getResponseCode/getInputStream 전에 설정합니다. response가 시작된 뒤 request property를 바꾸려 하면 IllegalStateException이 날 수 있습니다.",
      "getResponseCode가 4xx/5xx라고 해서 transport가 실패한 것은 아닙니다. success stream과 error stream을 status에 따라 고르고, error body도 byte·media·privacy 한도 안에서만 읽습니다.",
      "InputStream과 Reader는 try-with-resources로 닫습니다. disconnect는 persistent connection 재사용 의미와 별개로 이 request가 가진 connection 자원을 더 쓰지 않겠다는 명시적 종료 지점입니다.",
      "setup 중 실패하면 stream이 아직 null일 수 있으므로 원본처럼 무조건 reader.close()를 호출하면 secondary NullPointerException이 primary failure를 가립니다. resource를 얻은 가장 좁은 scope에서 소유합니다.",
      "HTTP body charset은 임의로 UTF-8이라 가정하지 않고 allowlisted media type의 charset parameter와 protocol/application default를 정책으로 결정합니다. 예제 fixture는 UTF-8을 명시합니다.",
      "예제는 loopback 404를 정상 response로 받고 error stream의 exact JSON을 읽은 뒤 finally disconnect가 실행됐는지 검증합니다. 외부 DNS·proxy·TLS는 사용하지 않습니다.",
    ],
    concepts: [
      { term: "transport success", definition: "HTTP response status와 headers를 받을 때까지 network exchange가 성립한 상태입니다.", detail: ["4xx/5xx도 transport success일 수 있습니다.", "application success와 다릅니다."] },
      { term: "error stream", definition: "HttpURLConnection이 non-2xx response body를 제공할 때 사용하는 별도 input stream입니다.", detail: ["null 가능성을 고려합니다.", "동일한 크기·charset 제한을 적용합니다."] },
      { term: "resource acquisition scope", definition: "resource가 실제 생성된 직후 가장 좁은 범위에서 try-with-resources로 소유하는 설계입니다.", detail: ["partial initialization에 안전합니다.", "primary exception을 보존합니다."] },
    ],
    codeExamples: [{
      id: "java-safe-httpurlconnection-404",
      title: "loopback 404 error body를 읽고 모든 경로에서 disconnect합니다",
      language: "java",
      filename: "SafeHttpUrlConnection.java",
      purpose: "legacy HttpURLConnection에서도 non-2xx와 resource lifecycle을 deterministic contract로 검증합니다.",
      code: String.raw`import com.sun.net.httpserver.HttpServer;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;

public class SafeHttpUrlConnection {
    record Result(int status, String body) { }
    static boolean disconnected;

    static Result fetch(URI uri) throws Exception {
        HttpURLConnection connection =
                (HttpURLConnection) uri.toURL().openConnection();
        try {
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(1_000);
            connection.setReadTimeout(1_000);
            connection.setRequestProperty("Accept", "application/json");
            int status = connection.getResponseCode();
            InputStream stream = status >= 200 && status < 300
                    ? connection.getInputStream() : connection.getErrorStream();
            if (stream == null) return new Result(status, "");
            try (stream;
                 BufferedReader reader = new BufferedReader(
                         new InputStreamReader(stream, StandardCharsets.UTF_8))) {
                return new Result(status, reader.readLine());
            }
        } finally {
            connection.disconnect();
            disconnected = true;
        }
    }

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(
                new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/missing", exchange -> {
            byte[] body = "{\"error\":\"missing\"}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set(
                    "Content-Type", "application/json; charset=utf-8");
            exchange.sendResponseHeaders(404, body.length);
            try (var output = exchange.getResponseBody()) {
                output.write(body);
            }
        });
        server.start();
        try {
            URI uri = URI.create("http://127.0.0.1:"
                    + server.getAddress().getPort() + "/missing");
            Result result = fetch(uri);
            System.out.println("status=" + result.status());
            System.out.println("body=" + result.body());
            System.out.println("disconnected=" + disconnected);
        } finally {
            server.stop(0);
        }
    }
}`,
      walkthrough: [
        { lines: "1-8", explanation: "owned loopback server, connection, URI와 explicit UTF-8에 필요한 APIs를 import합니다." },
        { lines: "10-12", explanation: "status/body result와 finally 실행 evidence를 분리합니다." },
        { lines: "14-31", explanation: "request를 설정하고 status에 따라 input/error stream을 고른 뒤 acquired resources만 닫습니다." },
        { lines: "32-35", explanation: "success·failure 모두 disconnect하고 marker를 설정합니다." },
        { lines: "38-49", explanation: "ephemeral127.0.0.1 server가 explicit media와404 JSON을 반환합니다." },
        { lines: "51-61", explanation: "dynamic port URI를 호출하고 exact result를 출력한 뒤 server를 종료합니다." },
      ],
      run: { environment: ["OpenJDK 21", "jdk.httpserver loopback127.0.0.1", "no external DNS", "-Xlint:all warning0"], command: isolatedJavaRun("SafeHttpUrlConnection.java", "SafeHttpUrlConnection") },
      output: { value: "status=404\nbody={\"error\":\"missing\"}\ndisconnected=true", explanation: ["404는 response branch입니다.", "error stream body가 exact UTF-8입니다.", "finally disconnect가 실행됐습니다."] },
      experiments: [
        { change: "getErrorStream 대신 항상 getInputStream을 호출합니다.", prediction: "404에서 IOException이 발생해 server error body를 잃습니다.", result: "status별 stream selection을 유지합니다." },
        { change: "read timeout을 제거하고 handler가 body를 보내지 않습니다.", prediction: "read가 장시간 block될 수 있습니다.", result: "phase timeout과 total deadline을 모두 둡니다." },
        { change: "finally에서 reader.close를 직접 호출합니다.", prediction: "reader 생성 전 실패 시 null close가 primary error를 가립니다.", result: "try-with-resources acquisition scope를 유지합니다." },
      ],
      sourceRefs: ["java-uri-api", "java-url-connection-api", "java-http-url-connection", "java-input-stream-api", "java-buffered-reader-api", "jdk-http-server", "rfc-9110-http"],
    }],
    diagnostics: [
      { symptom: "404에서 IOException만 보이고 실제 API 오류 JSON이 사라진다.", likelyCause: "status 확인 없이 getInputStream만 호출했습니다.", checks: ["getResponseCode 호출 위치를 봅니다.", "getErrorStream null 여부를 봅니다.", "body/media limit 적용 여부를 봅니다."], fix: "status에 따라 input/error stream을 선택하고 bounded safe summary를 보존합니다.", prevention: "2xx·204·404·429·500 fixtures를 contract test에 둡니다." },
      { symptom: "원래 timeout/connect 오류가 finally NullPointerException으로 바뀐다.", likelyCause: "부분 초기화된 reader/writer를 unconditional close했습니다.", checks: ["suppressed/cause chain을 봅니다.", "resource assignment 이전 실패를 재현합니다.", "finally null dereference를 찾습니다."], fix: "resource acquisition 직후 try-with-resources로 소유하고 connection만 outer finally에서 disconnect합니다.", prevention: "connect 실패·header 실패·body midstream 실패 tests를 둡니다." },
    ],
    expertNotes: ["HttpURLConnection is stateful; configuration order is part of its correctness contract.", "Capturing an error body is useful only after bounding size and applying redaction/privacy rules."],
  },
  {
    id: "content-type-charset-content-encoding-decompressed-byte-limit",
    title: "Content-Type·charset·Content-Encoding을 분리하고 압축 해제 뒤 byte budget을 강제합니다",
    lead: "Content-Length나 compressed payload 크기만 믿지 않고 representation metadata를 검증한 다음 실제 decoded bytes를 streaming으로 제한합니다.",
    explanations: [
      "Content-Type은 media type과 parameters를 전달합니다. application/json, application/xml 같은 allowlist를 비교할 때 case와 parameter parsing을 처리하고 단순 startsWith 우회를 피합니다.",
      "charset은 bytes→characters 변환 계약입니다. header에 없을 때 적용할 default는 media/application contract로 정하며 platform default charset에 맡기지 않습니다.",
      "Content-Encoding:gzip은 representation에 압축 coding이 적용됐다는 뜻입니다. Transfer-Encoding:chunked와 다르며, decode 순서와 지원 coding allowlist를 명시합니다.",
      "Content-Length는 없거나 거짓일 수 있고 compressed bytes만 나타낼 수도 있습니다. allocation 전 compressed limit, decompression 도중 decoded byte limit, parse 중 token/node/depth limits가 모두 필요합니다.",
      "GZIPInputStream은 header/trailer/CRC 형식을 검증하지만 안전한 output 상한을 자동으로 두지 않습니다. read loop의 누적 bytes가 cap을 넘는 즉시 중단합니다.",
      "character count와 UTF-8 byte count는 같지 않습니다. 예제의 한글 두 글자는 characters2지만 UTF-8 bytes6이며 limit5에서 거부됩니다.",
      "decoded bytes를 String으로 바꾼 뒤 길이를 검사하면 이미 큰 allocation이 끝났습니다. bounded byte sink 뒤 strict decoder와 parser로 넘깁니다.",
      "예제는 memory fixture를 gzip으로 만들고 network 없이 decoded exact bytes와 cap rejection을 검증합니다. gzip binary 자체는 환경별 header 차이가 있어 출력하지 않습니다.",
    ],
    concepts: [
      { term: "representation metadata", definition: "media type, charset과 content coding처럼 body bytes를 해석하는 계약입니다.", detail: ["status 뒤 parse 전에 검증합니다.", "unsupported combination은 fail closed합니다."] },
      { term: "decompressed-byte budget", definition: "압축 stream에서 실제로 나온 bytes의 누적 상한입니다.", detail: ["zip bomb을 제한합니다.", "Content-Length와 독립입니다."] },
      { term: "strict decoding", definition: "malformed/unmappable byte sequence를 대체 문자로 숨기지 않고 오류로 처리하는 charset 정책입니다.", detail: ["data corruption을 드러냅니다.", "CharsetDecoder 설정으로 구현합니다."] },
    ],
    codeExamples: [{
      id: "java-bounded-gzip-decoder",
      title: "gzip body를 streaming decode하며 실제 UTF-8 bytes 상한을 검사합니다",
      language: "java",
      filename: "BoundedGzipDecoder.java",
      purpose: "compressed size와 decoded size가 다르다는 사실을 exact multibyte fixture로 검증합니다.",
      code: String.raw`import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

public class BoundedGzipDecoder {
    static byte[] gzip(byte[] source) throws IOException {
        ByteArrayOutputStream sink = new ByteArrayOutputStream();
        try (GZIPOutputStream gzip = new GZIPOutputStream(sink)) {
            gzip.write(source);
        }
        return sink.toByteArray();
    }

    static byte[] decode(byte[] source, String encoding, int limit)
            throws IOException {
        InputStream raw = new ByteArrayInputStream(source);
        try (raw;
             InputStream decoded = "gzip".equalsIgnoreCase(encoding)
                     ? new GZIPInputStream(raw) : raw;
             ByteArrayOutputStream sink = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4];
            for (int read; (read = decoded.read(buffer)) != -1;) {
                if (sink.size() + read > limit) {
                    throw new IOException("decoded body exceeds limit");
                }
                sink.write(buffer, 0, read);
            }
            return sink.toByteArray();
        }
    }

    public static void main(String[] args) throws Exception {
        byte[] compressed = gzip("한글".getBytes(StandardCharsets.UTF_8));
        byte[] decoded = decode(compressed, "gzip", 6);
        boolean rejected;
        try {
            decode(compressed, "gzip", 5);
            rejected = false;
        } catch (IOException expected) {
            rejected = true;
        }
        System.out.println("encoding=gzip");
        System.out.println("text=" + new String(decoded, StandardCharsets.UTF_8));
        System.out.println("decodedUtf8Bytes=" + decoded.length);
        System.out.println("limitRejected=" + rejected);
    }
}`,
      walkthrough: [
        { lines: "1-7", explanation: "memory streams, explicit UTF-8과 gzip streams를 import합니다." },
        { lines: "10-16", explanation: "fixture bytes를 gzip으로 만들고 stream close로 trailer까지 완성합니다." },
        { lines: "18-34", explanation: "coding을 선택하고 small buffer로 읽으며 write 이전 decoded byte budget을 검사합니다." },
        { lines: "37-46", explanation: "동일 payload를 limit6 success와 limit5 rejection으로 실행합니다." },
        { lines: "47-50", explanation: "encoding, decoded text/bytes와 rejection을 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "memory-only gzip fixture", "UTF-8", "-Xlint:all warning0"], command: isolatedJavaRun("BoundedGzipDecoder.java", "BoundedGzipDecoder") },
      output: { value: "encoding=gzip\ntext=한글\ndecodedUtf8Bytes=6\nlimitRejected=true", explanation: ["gzip coding이 선택됐습니다.", "한글2자는 UTF-8 bytes6입니다.", "decoded limit5가 allocation 전 거부됐습니다."] },
      experiments: [
        { change: "limit를 character count2로 둡니다.", prediction: "UTF-8 multibyte payload를 잘못 거부합니다.", result: "byte budget과 domain character limit을 별도로 둡니다." },
        { change: "compressed.length만 검사합니다.", prediction: "높은 compression ratio payload가 decoded memory budget을 넘을 수 있습니다.", result: "compressed와 decompressed 두 budgets를 둡니다." },
        { change: "unknown encoding br를 identity로 처리합니다.", prediction: "압축 bytes를 parser에 넘기거나 policy bypass가 됩니다.", result: "지원하지 않는 coding을 명시적으로 거부합니다." },
      ],
      sourceRefs: ["java-gzip-input-stream", "java-gzip-output-stream", "java-byte-array-output-stream", "java-standard-charsets", "rfc-9110-http"],
    }],
    diagnostics: [
      { symptom: "작은 gzip 응답 하나가 heap을 소진한다.", likelyCause: "compressed Content-Length만 제한하고 decoded stream을 무제한 materialize했습니다.", checks: ["compressed/decoded byte counters를 비교합니다.", "String 생성 시점을 봅니다.", "parser token/node limits도 확인합니다."], fix: "streaming decode 중 decoded byte cap을 초과하면 즉시 cancel/close합니다.", prevention: "high-ratio gzip·unknown length·truncated CRC fixtures를 둡니다." },
      { symptom: "같은 body가 개발 PC에서는 읽히고 서버에서는 글자가 깨진다.", likelyCause: "header/application charset 대신 platform default를 사용했습니다.", checks: ["Content-Type charset을 봅니다.", "new String/InputStreamReader overload를 봅니다.", "raw bytes digest를 비교합니다."], fix: "allowed media별 charset policy와 strict CharsetDecoder를 명시합니다.", prevention: "UTF-8·legacy charset·invalid sequence·missing charset cases를 검증합니다." },
    ],
    expertNotes: ["Resource limits belong at every amplification boundary: transfer, decompression, decoding, parsing, and domain expansion.", "Never treat an unknown Content-Encoding as identity; ambiguity at a trust boundary should fail closed."],
  },
  {
    id: "redirect-policy-method-semantics-idempotency-retry",
    title: "리다이렉트를 새 요청으로 재검증하고 method semantics·idempotency와 retry를 함께 설계합니다",
    lead: "3xx를 편의 기능으로만 보지 않고 Location 해석, credential 전달, method 전환과 SSRF policy를 각 hop에서 결정합니다.",
    explanations: [
      "redirect는 기존 URI를 기준으로 relative Location을 resolve해 새 target을 만듭니다. scheme·host·port·path·userinfo와 resolved addresses를 매 hop 다시 검증합니다.",
      "HttpClient.Redirect.NEVER는 3xx와 Location을 caller가 관찰하게 하고 NORMAL은 일반적으로 HTTPS→HTTP downgrade를 따르지 않는 자동 정책을 제공합니다. 보안 요구가 높으면 bounded manual loop가 더 명시적입니다.",
      "301/302/303/307/308은 method/body 처리 의미가 동일하지 않습니다. 특히 mutation request가 GET으로 바뀌거나 동일 body가 재전송되는지 endpoint 계약과 client behavior를 시험합니다.",
      "Authorization·Cookie·signed query 같은 credentials를 다른 authority에 자동 전달하면 유출됩니다. redirect target이 allowlisted여도 credential scope를 별도로 계산합니다.",
      "redirect loop와 long chain을 막기 위해 maximum hops와 visited normalized URI set을 둡니다. Location 부재·invalid syntax·fragment도 typed failure로 처리합니다.",
      "retry는 redirect와 다른 제어 흐름입니다. timeout/429/502/503/504 이후 method가 idempotent하거나 idempotency key 계약이 있을 때만 total deadline 안에서 제한합니다.",
      "backoff는 exponential delay와 jitter, Retry-After, max attempts를 사용하고 caller cancellation을 즉시 전파합니다. attempt마다 DNS/address policy도 다시 확인합니다.",
      "예제는 같은 loopback origin의 relative302를 NEVER와 NORMAL로 비교하여 network drift 없이 Location, final body와 final hit count를 고정합니다.",
    ],
    concepts: [
      { term: "redirect hop", definition: "3xx Location을 resolve해 만들어진 다음 HTTP request 경계입니다.", detail: ["새 URI로 policy를 재적용합니다.", "hop budget을 소비합니다."] },
      { term: "idempotency", definition: "동일 의도의 요청을 여러 번 적용해도 의도된 server state 효과가 한 번과 같은 성질입니다.", detail: ["method 이름만으로 충분하지 않습니다.", "idempotency key 계약이 보완할 수 있습니다."] },
      { term: "credential scope", definition: "Authorization·cookie·signature가 전송되어도 되는 scheme/authority/path 범위입니다.", detail: ["redirect마다 재평가합니다.", "cross-origin 전달을 기본 금지합니다."] },
    ],
    codeExamples: [{
      id: "java-redirect-policy-loopback",
      title: "relative302를 NEVER와 NORMAL 정책으로 비교합니다",
      language: "java",
      filename: "RedirectPolicyLoopback.java",
      purpose: "자동 redirect가 status/location을 소비하고 final request를 만든다는 사실을 exact local fixture로 검증합니다.",
      code: String.raw`import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

public class RedirectPolicyLoopback {
    public static void main(String[] args) throws Exception {
        AtomicInteger finalHits = new AtomicInteger();
        HttpServer server = HttpServer.create(
                new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/start", exchange -> {
            exchange.getResponseHeaders().set("Location", "/final");
            exchange.sendResponseHeaders(302, -1);
            exchange.close();
        });
        server.createContext("/final", exchange -> {
            finalHits.incrementAndGet();
            byte[] body = "done".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            try (var output = exchange.getResponseBody()) {
                output.write(body);
            }
        });
        server.start();
        try {
            URI start = URI.create("http://127.0.0.1:"
                    + server.getAddress().getPort() + "/start");
            HttpRequest request = HttpRequest.newBuilder(start)
                    .timeout(Duration.ofSeconds(2)).GET().build();
            HttpClient never = HttpClient.newBuilder()
                    .followRedirects(HttpClient.Redirect.NEVER).build();
            HttpClient normal = HttpClient.newBuilder()
                    .followRedirects(HttpClient.Redirect.NORMAL).build();
            HttpResponse<String> first = never.send(
                    request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            HttpResponse<String> followed = normal.send(
                    request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            System.out.println("neverStatus=" + first.statusCode());
            System.out.println("location="
                    + first.headers().firstValue("Location").orElse("missing"));
            System.out.println("normalStatus=" + followed.statusCode());
            System.out.println("body=" + followed.body());
            System.out.println("finalHits=" + finalHits.get());
        } finally {
            server.stop(0);
        }
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "local server, modern HTTP client, exact UTF-8와 hit counter를 import합니다." },
        { lines: "12-27", explanation: "relative Location을 주는302 route와 count되는 final200 route를 만듭니다." },
        { lines: "30-37", explanation: "dynamic loopback URI/request와 NEVER/NORMAL clients를 구성합니다." },
        { lines: "38-42", explanation: "같은 request를 수동 관찰 정책과 자동 추적 정책으로 각각 실행합니다." },
        { lines: "43-50", explanation: "first status/location, followed status/body와 final hit1을 exact 출력합니다." },
        { lines: "51-53", explanation: "모든 경로에서 owned server를 종료합니다." },
      ],
      run: { environment: ["OpenJDK 21", "jdk.httpserver loopback127.0.0.1", "no external network", "-Xlint:all warning0"], command: isolatedJavaRun("RedirectPolicyLoopback.java", "RedirectPolicyLoopback") },
      output: { value: "neverStatus=302\nlocation=/final\nnormalStatus=200\nbody=done\nfinalHits=1", explanation: ["NEVER는302와 Location을 보존합니다.", "NORMAL은 relative target을 따라200/body를 얻습니다.", "final route는 자동 client 한 번만 호출했습니다."] },
      experiments: [
        { change: "Location을 http://127.0.0.1:다른포트로 바꿉니다.", prediction: "NORMAL은 origin credential policy를 알지 못한 채 따라갈 수 있습니다.", result: "manual hop에서 authority/address/credential policy를 검증합니다." },
        { change: "두 route가 서로302를 반환하게 합니다.", prediction: "client hop limit 뒤 실패합니다.", result: "명시적 max hops와 visited set으로 stable category를 만듭니다." },
        { change: "non-idempotent POST를503에서 자동 retry합니다.", prediction: "server가 처리 후 응답만 잃은 경우 mutation이 중복될 수 있습니다.", result: "operation semantics 또는 idempotency key 없이는 재시도하지 않습니다." },
      ],
      sourceRefs: ["java-http-client", "java-http-request", "java-http-response", "java-uri-api", "jdk-http-server", "rfc-9110-http"],
    }],
    diagnostics: [
      { symptom: "허용 host URL이 redirect 뒤 private service에 접근한다.", likelyCause: "초기 URI만 검증하고 자동 redirect target과 DNS answers를 재검증하지 않았습니다.", checks: ["followRedirects 설정을 봅니다.", "hop별 effective URI/address logs를 봅니다.", "relative Location resolution을 재현합니다."], fix: "redirect를 bounded manual loop로 처리하고 매 hop URI·DNS·address·credential policy를 재적용합니다.", prevention: "public→loopback/link-local/IPv6-private와 chain/loop fixtures를 둡니다." },
      { symptom: "timeout/503 뒤 주문이 두 번 생성된다.", likelyCause: "method 또는 endpoint effect의 idempotency를 확인하지 않고 자동 retry했습니다.", checks: ["attempt IDs와 server processing logs를 연결합니다.", "idempotency key 저장 범위를 봅니다.", "response loss 시나리오를 확인합니다."], fix: "safe/idempotent operation 또는 durable idempotency-key 계약에서만 bounded retry합니다.", prevention: "response-lost-after-commit fault test와 duplicate suppression metrics를 둡니다." },
    ],
    expertNotes: ["A redirect is a new authorization and network-policy decision, not merely a new URL string.", "Retry safety depends on operation semantics and durable server behavior, not only on an HTTP method label."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...boundedHttpChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-url-connection-api", repository: "Java SE 21 API", path: "java.net.URLConnection", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URLConnection.html", usedFor: ["stateful connection configuration", "connect/read timeout"], evidence: "URLConnection lifecycle 근거입니다." },
  { id: "java-input-stream-api", repository: "Java SE 21 API", path: "java.io.InputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStream.html", usedFor: ["body stream ownership", "bounded reads"], evidence: "byte stream lifecycle 근거입니다." },
  { id: "java-buffered-reader-api", repository: "Java SE 21 API", path: "java.io.BufferedReader", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/BufferedReader.html", usedFor: ["legacy logical-line reading"], evidence: "buffered character input 근거입니다." },
  { id: "java-gzip-input-stream", repository: "Java SE 21 API", path: "java.util.zip.GZIPInputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/zip/GZIPInputStream.html", usedFor: ["gzip decoding", "CRC/trailer validation"], evidence: "gzip decoding stream 근거입니다." },
  { id: "java-gzip-output-stream", repository: "Java SE 21 API", path: "java.util.zip.GZIPOutputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/zip/GZIPOutputStream.html", usedFor: ["deterministic compressed fixture"], evidence: "gzip fixture encoding 근거입니다." },
  { id: "java-byte-array-output-stream", repository: "Java SE 21 API", path: "java.io.ByteArrayOutputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ByteArrayOutputStream.html", usedFor: ["bounded decoded byte accumulation"], evidence: "memory byte sink 근거입니다." },
);

const trustAndParsingChapters: DetailedSession["chapters"] = [
  {
    id: "ssrf-uri-allowlist-resolved-address-redirect-revalidation",
    title: "SSRF를 URI 문자열 검사 한 번이 아니라 URI→DNS answers→connect→redirect의 반복 policy로 차단합니다",
    lead: "사용자가 준 URL이 server-side network 권한으로 해석되는 순간 trust boundary가 생기므로 hostname allowlist와 실제 목적지 address ranges를 모두 검증합니다.",
    explanations: [
      "SSRF는 공격자가 server를 proxy처럼 사용해 loopback admin, RFC1918/unique-local, link-local metadata, internal DNS와 cloud control plane에 접근하게 하는 문제입니다.",
      "URI policy는 scheme을 HTTPS로 제한하고 exact canonical host, 허용 port/path prefix를 비교하며 userinfo·fragment·ambiguous authority를 거부합니다. contains/endsWith 문자열 비교는 suffix confusion에 취약합니다.",
      "hostname allowlist만으로는 부족합니다. resolver가 반환한 IPv4/IPv6 answers 전체를 검사하고 any-local, loopback, link-local, site-local/private, multicast, unique-local과 조직별 금지 ranges를 차단합니다.",
      "DNS rebinding에서는 validation 때 public address였다가 connect 때 private address가 될 수 있습니다. validated address로 연결을 고정하거나 trusted egress proxy/resolver가 resolution과 connection을 같은 정책 경계에서 수행해야 합니다.",
      "redirect target은 완전히 새로운 URI·DNS decision입니다. relative Location을 resolve한 뒤 scheme/authority/path와 answers를 다시 검사하고 maximum hops와 visited set을 적용합니다.",
      "IPv4를 IPv6-mapped form으로 표현하거나 decimal/octal-like host notation, trailing dot, IDN/punycode와 mixed case를 사용할 수 있으므로 parser/canonicalization 전에 직접 문자열 replace로 판단하지 않습니다.",
      "application이 public IP만 허용해도 destination port, HTTP method, headers, body와 response byte budget을 제한합니다. deny reason에는 raw credential/query 대신 stable category만 남깁니다.",
      "JDK high-level HttpClient는 arbitrary pre-resolved address pinning을 직접 제공하지 않습니다. production에서는 network egress policy, allowlisted proxy 또는 lower-level client adapter와 함께 방어합니다.",
      "예제는 DNS를 호출하지 않고 explicit IPv4127.0.0.1과 IPv6 fd00::1 bytes를 분류하여 URI allowlist와 address policy가 서로 다른 gate임을 exact 검증합니다.",
    ],
    concepts: [
      { term: "SSRF", definition: "untrusted input이 server-side outbound request destination을 통제해 내부 또는 특권 network 자원에 접근하는 취약점입니다.", detail: ["server network identity를 악용합니다.", "response exfiltration이 없어도 side effect가 날 수 있습니다."] },
      { term: "DNS rebinding", definition: "같은 hostname이 시간 또는 질의에 따라 validation용 public address와 connection용 forbidden address를 다르게 반환하는 공격/상태입니다.", detail: ["resolve-check-connect 원자성이 필요합니다.", "redirect/retry마다 재검증합니다."] },
      { term: "egress policy", definition: "application 밖 network layer에서도 허용 destination/protocol을 제한하는 defense-in-depth 규칙입니다.", detail: ["application bug의 blast radius를 줄입니다.", "proxy/firewall 관측을 제공합니다."] },
    ],
    codeExamples: [{
      id: "java-ssrf-uri-address-policy",
      title: "exact URI allowlist와 IPv4/IPv6 forbidden-address 분류를 독립 검증합니다",
      language: "java",
      filename: "SsrfUriAddressPolicy.java",
      purpose: "host string 승인만으로 끝내지 않고 parsed URI와 resolved address가 모두 통과해야 함을 보여 줍니다.",
      code: String.raw`import java.net.InetAddress;
import java.net.URI;

public class SsrfUriAddressPolicy {
    static boolean uriAllowed(URI uri) {
        return "https".equalsIgnoreCase(uri.getScheme())
                && "api.example.test".equalsIgnoreCase(uri.getHost())
                && uri.getUserInfo() == null
                && (uri.getPort() == -1 || uri.getPort() == 443)
                && uri.getFragment() == null
                && uri.getPath().startsWith("/v1/");
    }

    static boolean forbidden(InetAddress address) {
        if (address.isAnyLocalAddress() || address.isLoopbackAddress()
                || address.isLinkLocalAddress() || address.isSiteLocalAddress()
                || address.isMulticastAddress()) return true;
        byte[] bytes = address.getAddress();
        return bytes.length == 16 && (bytes[0] & 0xfe) == 0xfc;
    }

    public static void main(String[] args) throws Exception {
        URI allowed = URI.create("https://api.example.test/v1/data");
        URI userInfo = URI.create("https://user@api.example.test/v1/data");
        InetAddress loopback = InetAddress.getByAddress(
                new byte[] {127, 0, 0, 1});
        byte[] uniqueLocalBytes = new byte[16];
        uniqueLocalBytes[0] = (byte) 0xfd;
        uniqueLocalBytes[15] = 1;
        InetAddress uniqueLocal = InetAddress.getByAddress(uniqueLocalBytes);

        System.out.println("allowedHost=" + uriAllowed(allowed));
        System.out.println("userinfoRejected=" + !uriAllowed(userInfo));
        System.out.println("loopbackRejected=" + forbidden(loopback));
        System.out.println("uniqueLocalRejected=" + forbidden(uniqueLocal));
    }
}`,
      walkthrough: [
        { lines: "1-2", explanation: "side-effect-free URI와 explicit-address InetAddress APIs를 import합니다." },
        { lines: "5-12", explanation: "scheme/host/userinfo/port/fragment/path를 component 단위 exact policy로 비교합니다." },
        { lines: "14-21", explanation: "JDK scope predicates 뒤 IPv6 fc00::/7 unique-local을 byte prefix로 추가 차단합니다." },
        { lines: "24-32", explanation: "DNS 없이 allowlisted URI, userinfo variant, loopback과 unique-local raw bytes를 구성합니다." },
        { lines: "34-37", explanation: "URI gate 둘과 address gate 둘을 exact booleans로 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "no DNS/no sockets", "explicit address bytes", "-Xlint:all warning0"], command: isolatedJavaRun("SsrfUriAddressPolicy.java", "SsrfUriAddressPolicy") },
      output: { value: "allowedHost=true\nuserinfoRejected=true\nloopbackRejected=true\nuniqueLocalRejected=true", explanation: ["canonical allowlisted URI가 통과합니다.", "userinfo는 host가 같아도 거부됩니다.", "IPv4 loopback과 IPv6 unique-local이 별도 address gate에서 거부됩니다."] },
      experiments: [
        { change: "host 비교를 endsWith(example.test)로 바꿉니다.", prediction: "evil-example.test 같은 sibling name이 오승인될 수 있습니다.", result: "canonical exact host 또는 label-aware allowlist를 사용합니다." },
        { change: "IPv4 predicates만 남깁니다.", prediction: "fd00::/8 등 IPv6 internal destination이 우회합니다.", result: "IPv4/IPv6와 mapped/special ranges를 같은 policy table로 시험합니다." },
        { change: "첫 DNS answer만 검사합니다.", prediction: "후속 forbidden answer가 connection에 선택될 수 있습니다.", result: "answers 전체 검증과 connect binding/egress enforcement를 적용합니다." },
      ],
      sourceRefs: ["java-uri-api", "java-inet-address", "java-inet4-address", "java-inet6-address", "rfc-6890", "rfc-4193", "owasp-ssrf-cheat-sheet"],
    }],
    diagnostics: [
      { symptom: "allowlisted hostname인데 internal IP로 접속된다.", likelyCause: "hostname만 승인하고 DNS answers 또는 rebinding을 통제하지 않았습니다.", checks: ["hop/attempt별 answers 전체를 기록합니다.", "validation과 connect resolver가 같은지 봅니다.", "proxy/egress route를 확인합니다."], fix: "모든 answers를 검사하고 validated destination binding 또는 trusted egress proxy를 사용합니다.", prevention: "answer rotation·public/private mixture·TTL/rebinding fixtures와 egress deny test를 둡니다." },
      { symptom: "redirect 뒤 credentials가 다른 host로 전달된다.", likelyCause: "자동 redirect가 URI policy와 credential scope를 분리하지 않았습니다.", checks: ["hop별 Authorization/Cookie headers를 봅니다.", "relative/absolute Location을 확인합니다.", "origin comparison을 검증합니다."], fix: "manual bounded redirect에서 target을 재검증하고 authority가 바뀌면 credentials를 제거합니다.", prevention: "cross-origin redirect credential non-forwarding contract test를 둡니다." },
    ],
    expertNotes: ["Application-layer URI validation and network-layer egress controls should both exist; neither fully substitutes for the other.", "Resolve-check-connect must be designed as one security operation, especially across redirects and retries."],
  },
  {
    id: "secure-xml-parsing-dtd-external-entities-limits",
    title: "XML parser에서 DOCTYPE·external entity·XInclude·external schema access를 fail-closed로 차단합니다",
    lead: "well-formed XML을 읽는 기능과 외부 resource resolution 권한을 분리해 XXE, local-file disclosure, internal requests와 entity expansion을 막습니다.",
    explanations: [
      "DocumentBuilderFactory 기본값은 provider/version에 따라 달라질 수 있으므로 security-critical features를 코드에서 명시하고 설정 실패를 무시하지 않습니다.",
      "DOCTYPE가 필요 없는 feed contract라면 disallow-doctype-decl을 true로 두는 것이 가장 단순합니다. external-general/parameter-entities도 false로 두어 defense in depth를 만듭니다.",
      "XMLConstants.ACCESS_EXTERNAL_DTD와 ACCESS_EXTERNAL_SCHEMA를 빈 문자열로 설정하면 protocol을 통한 외부 DTD/schema 접근을 금지합니다. XInclude와 entity expansion도 끕니다.",
      "namespace awareness는 contract에 맞게 켜고 namespace URI+local name으로 선택합니다. prefix 문자열은 문서가 임의로 바꿀 수 있어 identity가 아닙니다.",
      "secure-processing만 켜면 모든 XXE vector와 application-specific size를 자동으로 막는다고 가정하지 않습니다. input bytes, nodes, depth, attributes, text와 time budgets를 별도 적용합니다.",
      "parser diagnostic이 stderr에 원문·local path를 출력하지 않도록 ErrorHandler에서 stable exception으로 소유합니다. public log에는 전체 untrusted XML을 남기지 않습니다.",
      "DOM은 전체 tree를 memory에 올리므로 작은 bounded document에 적합합니다. 큰 feed는 secure streaming parser와 element/depth/count limits를 사용합니다.",
      "parse 성공 뒤 required elements, multiplicity, numeric/date ranges와 cross-field domain invariants를 검증합니다. XML syntax validity와 business validity는 별도 gate입니다.",
      "예제는 safe Korean city XML을 parse하고 DOCTYPE가 포함된 memory fixture가 외부 access 전에 거부되는지 exact 검증합니다. file/network URI는 사용하지 않습니다.",
    ],
    concepts: [
      { term: "XXE", definition: "XML external entity resolution을 악용해 local/remote resource를 읽거나 request를 유발하는 취약점입니다.", detail: ["DTD/entity capability에서 발생합니다.", "parser configuration과 egress limits로 방어합니다."] },
      { term: "secure processing", definition: "XML implementation이 processing limits를 적용하도록 요청하는 표준 feature입니다.", detail: ["필요하지만 단독으로 충분하지 않습니다.", "explicit external-access settings와 병행합니다."] },
      { term: "namespace identity", definition: "XML element/attribute를 prefix가 아니라 namespace URI와 local name 조합으로 식별하는 방식입니다.", detail: ["prefix 변경에 안정적입니다.", "schema contract와 연결됩니다."] },
    ],
    codeExamples: [{
      id: "java-secure-xml-parser",
      title: "safe DOM은 읽고 DOCTYPE fixture는 외부 접근 전에 거부합니다",
      language: "java",
      filename: "SecureXmlParser.java",
      purpose: "secure parser flags가 실제 negative fixture를 차단하는지 warning0 exact test로 고정합니다.",
      code: String.raw`import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;
import org.xml.sax.helpers.DefaultHandler;

public class SecureXmlParser {
    static Document parse(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
        factory.setFeature(
                "http://apache.org/xml/features/disallow-doctype-decl", true);
        factory.setFeature(
                "http://xml.org/sax/features/external-general-entities", false);
        factory.setFeature(
                "http://xml.org/sax/features/external-parameter-entities", false);
        factory.setXIncludeAware(false);
        factory.setExpandEntityReferences(false);
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
        DocumentBuilder builder = factory.newDocumentBuilder();
        builder.setErrorHandler(new DefaultHandler() {
            @Override
            public void fatalError(SAXParseException error) throws SAXException {
                throw error;
            }
        });
        byte[] bytes = xml.getBytes(StandardCharsets.UTF_8);
        return builder.parse(new ByteArrayInputStream(bytes));
    }

    public static void main(String[] args) throws Exception {
        Document safe = parse("<weather><city>서울</city></weather>");
        boolean rejected;
        try {
            parse("<!DOCTYPE weather><weather><city>서울</city></weather>");
            rejected = false;
        } catch (SAXException expected) {
            rejected = true;
        }
        String city = safe.getElementsByTagName("city").item(0).getTextContent();
        System.out.println("city=" + city);
        System.out.println("doctypeRejected=" + rejected);
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "bounded memory input, XML constants/factory, DOM과 controlled SAX error APIs를 import합니다." },
        { lines: "12-26", explanation: "namespace/secure processing과 DTD/entities/XInclude/external protocols를 explicit fail-closed로 설정합니다." },
        { lines: "27-35", explanation: "fatal diagnostics를 caller exception으로 소유하고 UTF-8 memory bytes를 parse합니다." },
        { lines: "38-46", explanation: "safe XML과 DOCTYPE negative fixture를 각각 실행해 rejection boolean을 만듭니다." },
        { lines: "47-49", explanation: "parsed Korean city와 DOCTYPE rejection을 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21 bundled XML provider", "memory-only fixtures", "no external DTD/schema", "-Xlint:all warning0"], command: isolatedJavaRun("SecureXmlParser.java", "SecureXmlParser") },
      output: { value: "city=서울\ndoctypeRejected=true", explanation: ["safe UTF-8 DOM text가 유지됩니다.", "DOCTYPE는 entity 사용 여부와 관계없이 거부됩니다."] },
      experiments: [
        { change: "disallow-doctype-decl만 제거합니다.", prediction: "다른 entity flags가 남아도 contract가 불필요한 DTD syntax를 허용합니다.", result: "feed에 DTD가 필요 없다면 가장 바깥 gate에서 금지합니다." },
        { change: "ACCESS_EXTERNAL_DTD를 all로 둡니다.", prediction: "provider가 external resource access를 허용할 수 있습니다.", result: "빈 protocol list와 egress policy를 유지합니다." },
        { change: "10MB text node를 DOM으로 parse합니다.", prediction: "input보다 큰 tree/strings memory를 사용할 수 있습니다.", result: "pre-parse byte cap과 DOM node/text budgets 또는 streaming parser를 적용합니다." },
      ],
      sourceRefs: ["java-xml-constants", "java-document-builder-factory", "java-document-builder", "java-dom-document", "java-sax-error-handler", "owasp-xxe-cheat-sheet", "w3c-xml"],
    }],
    diagnostics: [
      { symptom: "XML parse만 했는데 local file 내용 또는 internal HTTP response가 나타난다.", likelyCause: "DOCTYPE/external entity 또는 schema resolution이 활성화됐습니다.", checks: ["factory features/attributes를 runtime에 확인합니다.", "DOCTYPE/entity declarations를 찾습니다.", "egress/file access telemetry를 봅니다."], fix: "DTD/entity/XInclude를 끄고 ACCESS_EXTERNAL_DTD/SCHEMA를 빈 값으로 설정하며 egress를 제한합니다.", prevention: "external entity·parameter entity·XInclude·external schema negative fixtures를 둡니다." },
      { symptom: "작은 XML 요청이 CPU/heap을 과도하게 소비한다.", likelyCause: "entity expansion 또는 DOM/token/depth/text limits가 없습니다.", checks: ["input vs expanded node/text size를 비교합니다.", "DOCTYPE 허용 여부를 봅니다.", "parser limit properties를 확인합니다."], fix: "DOCTYPE를 금지하고 input/node/depth/text/time budgets를 강제하거나 bounded streaming parser를 사용합니다.", prevention: "entity expansion·deep nesting·wide attributes·large text stress tests를 둡니다." },
    ],
    expertNotes: ["Treat parser feature-configuration failure as a startup or request failure; silently continuing creates an environment-dependent vulnerability.", "Syntactic XML safety and domain-schema validity are separate gates with separate diagnostics."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...trustAndParsingChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "rfc-6890", repository: "IETF", path: "RFC 6890 Special-Purpose IP Address Registries", publicUrl: "https://www.rfc-editor.org/rfc/rfc6890", usedFor: ["special-purpose IPv4/IPv6 ranges", "SSRF address policy"], evidence: "special address classification 근거입니다." },
  { id: "rfc-4193", repository: "IETF", path: "RFC 4193 Unique Local IPv6 Unicast Addresses", publicUrl: "https://www.rfc-editor.org/rfc/rfc4193", usedFor: ["fc00::/7 unique-local classification"], evidence: "IPv6 unique-local range 근거입니다." },
  { id: "owasp-ssrf-cheat-sheet", repository: "OWASP Cheat Sheet Series", path: "Server Side Request Forgery Prevention", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html", usedFor: ["allowlist strategy", "DNS/pinning considerations", "network-layer controls"], evidence: "SSRF defense-in-depth 근거입니다." },
  { id: "java-xml-constants", repository: "Java SE 21 API", path: "javax.xml.XMLConstants", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/javax/xml/XMLConstants.html", usedFor: ["secure processing", "external DTD/schema access properties"], evidence: "standard XML security constants 근거입니다." },
  { id: "java-document-builder-factory", repository: "Java SE 21 API", path: "javax.xml.parsers.DocumentBuilderFactory", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/javax/xml/parsers/DocumentBuilderFactory.html", usedFor: ["DOM parser configuration", "namespace/XInclude/entity flags"], evidence: "DOM factory configuration 근거입니다." },
  { id: "java-document-builder", repository: "Java SE 21 API", path: "javax.xml.parsers.DocumentBuilder", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/javax/xml/parsers/DocumentBuilder.html", usedFor: ["parse boundary", "ErrorHandler ownership"], evidence: "DOM builder parse contract 근거입니다." },
  { id: "java-dom-document", repository: "Java SE 21 API", path: "org.w3c.dom.Document", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/org/w3c/dom/Document.html", usedFor: ["DOM tree access", "post-parse validation boundary"], evidence: "DOM document model 근거입니다." },
  { id: "java-sax-error-handler", repository: "Java SE 21 API", path: "org.xml.sax.ErrorHandler", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/org/xml/sax/ErrorHandler.html", usedFor: ["controlled parser diagnostics"], evidence: "SAX warning/error ownership 근거입니다." },
  { id: "owasp-xxe-cheat-sheet", repository: "OWASP Cheat Sheet Series", path: "XML External Entity Prevention", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html", usedFor: ["Java parser hardening", "XXE negative tests"], evidence: "XXE mitigation 근거입니다." },
  { id: "w3c-xml", repository: "W3C", path: "Extensible Markup Language XML 1.0", publicUrl: "https://www.w3.org/TR/xml/", usedFor: ["well-formedness", "DTD/entity model"], evidence: "XML language specification 근거입니다." },
);

const validationAndCacheChapters: DetailedSession["chapters"] = [
  {
    id: "json-syntax-runtime-schema-domain-validation-limits",
    title: "JSON syntax parse 뒤 type·required·unknown·range·size를 runtime schema와 domain gate로 검증합니다",
    lead: "JSON parser가 object를 반환했다는 사실을 신뢰하지 않고 untyped tree를 명시적 DTO로 변환하는 경계에서 모든 필드 계약을 검사합니다.",
    explanations: [
      "JSON syntax parser는 braces, strings, numbers, arrays와 literals의 문법을 읽습니다. 이것만으로 name이 string인지, score가 integer0..100인지 또는 필드가 누락됐는지는 보장하지 않습니다.",
      "JDK 자체에는 범용 JSON parser가 포함되어 있지 않으므로 production에서는 Jackson, JSON-P 같은 maintained parser를 dependency와 limits를 고정해 사용합니다. 예제 Map은 parser가 이미 만든 untyped object tree를 모델링할 뿐 JSON text parser가 아닙니다.",
      "tree→DTO adapter는 root kind, required fields, explicit null, runtime types, integer/decimal precision, finite number, ranges와 string byte/character limits를 검사합니다.",
      "unknown fields를 reject할지 ignore할지는 compatibility 정책입니다. 보안·학습 계약에서는 typo와 producer drift를 빠르게 드러내도록 exact key set을 사용하고, evolution이 필요하면 version별 allowlist를 둡니다.",
      "JSON numbers는 하나의 문법 category지만 Java int/long/BigInteger/BigDecimal/double 선택은 domain 결정입니다. double을 currency/id에 사용하거나 overflow narrowing을 하지 않습니다.",
      "duplicate object member 이름은 parser마다 last-wins/first-wins/reject가 다를 수 있습니다. trust boundary에서는 duplicate detection을 켜고 canonicalization/signature 이전 의미 ambiguity를 제거합니다.",
      "body byte cap 뒤에도 parser token count, nesting depth, array/object size와 total string bytes를 제한합니다. 매우 깊거나 넓은 JSON은 작은 transfer로도 CPU/heap을 늘릴 수 있습니다.",
      "schema valid DTO도 cross-field 관계, authorization, freshness와 business invariants를 통과해야 publish할 수 있습니다. syntax/schema/domain failure categories를 분리합니다.",
      "예제는 maintained parser 이후의 Map tree를 four cases로 검증해 valid record, wrong type, unknown field와 oversize string rejection을 warning0 exact output으로 고정합니다.",
    ],
    concepts: [
      { term: "untyped JSON tree", definition: "parser가 object/array/string/number/boolean/null을 generic Map·List·scalar로 표현한 중간 구조입니다.", detail: ["application DTO가 아닙니다.", "runtime validation이 필요합니다."] },
      { term: "runtime schema", definition: "실행 중 입력의 shape, required/unknown fields, types, ranges와 limits를 검사하는 계약입니다.", detail: ["syntax parse 뒤 적용합니다.", "version 정책을 포함합니다."] },
      { term: "domain invariant", definition: "개별 필드 type보다 높은 수준에서 반드시 참이어야 하는 business 관계입니다.", detail: ["예: start<end입니다.", "schema valid와 별도입니다."] },
    ],
    codeExamples: [{
      id: "java-json-object-runtime-schema",
      title: "parser 출력 Map을 strict Product record로 변환합니다",
      language: "java",
      filename: "JsonRuntimeSchema.java",
      purpose: "JSON syntax parse와 application type/domain validation이 다른 단계임을 warning0 generic code로 검증합니다.",
      code: String.raw`import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

public class JsonRuntimeSchema {
    record Product(String name, int score) { }

    static Product validate(Map<String, Object> object) {
        if (!object.keySet().equals(Set.of("name", "score"))) {
            throw new IllegalArgumentException("unexpected object shape");
        }
        Object rawName = object.get("name");
        Object rawScore = object.get("score");
        if (!(rawName instanceof String name)
                || name.isBlank() || name.length() > 20) {
            throw new IllegalArgumentException("invalid name");
        }
        if (!(rawScore instanceof Integer score)
                || score < 0 || score > 100) {
            throw new IllegalArgumentException("invalid score");
        }
        return new Product(name, score);
    }

    static boolean rejected(Map<String, Object> object) {
        try {
            validate(object);
            return false;
        } catch (IllegalArgumentException expected) {
            return true;
        }
    }

    public static void main(String[] args) {
        Map<String, Object> valid = new LinkedHashMap<>();
        valid.put("name", "Ada");
        valid.put("score", 91);
        Product product = validate(valid);
        boolean wrongType = rejected(Map.<String, Object>of(
                "name", "Ada", "score", "91"));
        boolean unknown = rejected(Map.<String, Object>of(
                "name", "Ada", "score", 91, "admin", true));
        boolean oversize = rejected(Map.<String, Object>of(
                "name", "x".repeat(21), "score", 91));

        System.out.println("valid=" + product.name() + ":" + product.score());
        System.out.println("wrongTypeRejected=" + wrongType);
        System.out.println("unknownRejected=" + unknown);
        System.out.println("oversizeRejected=" + oversize);
    }
}`,
      walkthrough: [
        { lines: "1-3", explanation: "generic tree, deterministic fixture와 exact key-set APIs를 import합니다." },
        { lines: "6-22", explanation: "Product DTO와 exact shape/name/score runtime rules를 적용합니다." },
        { lines: "24-31", explanation: "negative fixtures가 stable rejection boolean을 만들도록 boundary를 감쌉니다." },
        { lines: "34-43", explanation: "valid tree와 wrong type, unknown field, oversize string cases를 구성합니다." },
        { lines: "45-48", explanation: "DTO와 세 rejection 결과를 exact 출력합니다." },
      ],
      run: { environment: ["OpenJDK 21", "parser-output Map fixture", "no JSON library/network", "-Xlint:all warning0"], command: isolatedJavaRun("JsonRuntimeSchema.java", "JsonRuntimeSchema") },
      output: { value: "valid=Ada:91\nwrongTypeRejected=true\nunknownRejected=true\noversizeRejected=true", explanation: ["valid tree만 Product로 변환됩니다.", "string score가 integer로 coercion되지 않습니다.", "unknown field와 oversize name이 fail closed됩니다."] },
      experiments: [
        { change: "String.valueOf(rawScore)로 coercion합니다.", prediction: "booleans/objects 같은 잘못된 producer type도 text가 되어 schema drift를 숨깁니다.", result: "명시적 compatibility adapter가 아닌 한 exact runtime type을 요구합니다." },
        { change: "unknown fields를 항상 무시합니다.", prediction: "admin 같은 security-sensitive typo/drift를 감지하지 못합니다.", result: "versioned compatibility policy와 telemetry를 둡니다." },
        { change: "parser에서 nesting/token limit을 제거합니다.", prediction: "DTO adapter 전 untyped tree 생성에서 이미 heap/stack을 소진할 수 있습니다.", result: "stream/parser phase에도 독립 limits를 둡니다." },
      ],
      sourceRefs: ["java-map-api", "java-set-api", "rfc-8259-json", "json-schema-validation"],
    }],
    diagnostics: [
      { symptom: "JSON parse 성공 뒤 ClassCastException 또는 잘못된 기본값이 발생한다.", likelyCause: "untyped tree를 schema 검증 없이 cast/coerce했습니다.", checks: ["raw runtime types를 safe summary로 봅니다.", "required/null/unknown policy를 확인합니다.", "number narrowing을 찾습니다."], fix: "central tree→DTO adapter에서 shape/type/range/size를 검사하고 typed failure를 반환합니다.", prevention: "missing/null/wrong type/overflow/unknown/duplicate matrix를 둡니다." },
      { symptom: "작은 JSON이 parser에서 stack 또는 heap을 소진한다.", likelyCause: "body cap만 있고 nesting, token, collection과 total string limits가 없습니다.", checks: ["depth/token/array sizes를 측정합니다.", "tree materialization 여부를 봅니다.", "duplicate/large numbers를 확인합니다."], fix: "maintained parser의 stream constraints와 application aggregate limits를 설정합니다.", prevention: "deep/wide/duplicate/huge-number/property-based adversarial fixtures를 둡니다." },
    ],
    expertNotes: ["A Map fixture can test the schema adapter, but it must never be presented as a substitute for a real JSON syntax parser.", "Compatibility is an explicit versioning decision; silent coercion and silent unknown-field handling are not free robustness."],
  },
  {
    id: "conditional-http-cache-etag-304-provenance-capstone",
    title: "ETag 조건부 요청·304와 validated generation provenance를 end-to-end ingestion에 연결합니다",
    lead: "cache hit를 단순 body 생략으로 처리하지 않고 validator가 어느 URI·representation·authorization에 속하는지 검증한 뒤 기존 generation을 재사용합니다.",
    explanations: [
      "ETag는 selected representation의 validator입니다. client는 이전200에서 받은 값을 If-None-Match로 보내고 server가304를 반환하면 response body 없이 cached representation을 재사용할 수 있습니다.",
      "304는 새 domain payload가 아닙니다. 기존 cached bytes·media·charset·schema version·digest와 validation evidence가 온전할 때만 current generation으로 계속 사용합니다.",
      "weak ETag와 strong ETag의 비교 의미가 다릅니다. byte-for-byte requirement, range request와 application deduplication에 어떤 validator가 필요한지 구분합니다.",
      "cache key에는 normalized URI뿐 아니라 Vary가 지정한 request headers와 authorization/tenant scope가 포함될 수 있습니다. 다른 사용자의 authenticated response를 공유하면 정보 유출입니다.",
      "Cache-Control, Expires, Age와 revalidation은 freshness를 결정하지만 business freshness/SLA와 같지 않습니다. stale-if-error 같은 정책은 명시적 risk decision입니다.",
      "200 response도 status/media/charset/decompression/byte limits/XML·JSON schema/domain validation을 모두 통과한 뒤 owned temp generation으로 저장합니다. validator만 먼저 publish하지 않습니다.",
      "atomic current pointer 교체 전에 bytes digest, record count, source URI id, ETag, fetched/validated timestamps와 parser/schema versions를 readback합니다. 실패하면 이전 generation을 보존합니다.",
      "304에는 body processing을 수행하지 않고 cached evidence를 재확인합니다. cache miss인데304가 오거나 validator와 representation metadata가 맞지 않으면 protocol/cache state failure입니다.",
      "예제는 loopback server가 첫 요청에200 data+ETag를, If-None-Match가 같은 두 번째 요청에304 empty body를 반환하여 exact request count와 conditional flow를 검증합니다.",
    ],
    concepts: [
      { term: "validator", definition: "cached representation이 origin의 현재 selected representation과 같은지 조건부 요청에서 확인하는 metadata입니다.", detail: ["ETag와 Last-Modified가 있습니다.", "representation scope를 가집니다."] },
      { term: "304 Not Modified", definition: "조건부 GET/HEAD의 precondition이 false여서 cached representation을 재사용할 수 있음을 알리는 body 없는 response입니다.", detail: ["새 body가 아닙니다.", "cache state가 필요합니다."] },
      { term: "provenance", definition: "published generation이 어떤 source/validator/bytes/parser/schema와 검증 결과에서 왔는지 추적하는 기록입니다.", detail: ["재현과 rollback에 필요합니다.", "secret-free 식별자를 사용합니다."] },
    ],
    codeExamples: [{
      id: "java-etag-conditional-loopback",
      title: "첫200의 ETag로 두 번째 조건부 요청을 보내304 empty body를 확인합니다",
      language: "java",
      filename: "EtagConditionalLoopback.java",
      purpose: "ETag 저장·If-None-Match 전송·304 branch를 외부 cache 없이 deterministic하게 검증합니다.",
      code: String.raw`import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

public class EtagConditionalLoopback {
    public static void main(String[] args) throws Exception {
        AtomicInteger requests = new AtomicInteger();
        String etag = "\"v1\"";
        HttpServer server = HttpServer.create(
                new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/data", exchange -> {
            requests.incrementAndGet();
            String supplied = exchange.getRequestHeaders().getFirst("If-None-Match");
            exchange.getResponseHeaders().set("ETag", etag);
            if (etag.equals(supplied)) {
                exchange.sendResponseHeaders(304, -1);
                exchange.close();
                return;
            }
            byte[] body = "data".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
            exchange.sendResponseHeaders(200, body.length);
            try (var output = exchange.getResponseBody()) {
                output.write(body);
            }
        });
        server.start();
        try {
            URI uri = URI.create("http://127.0.0.1:"
                    + server.getAddress().getPort() + "/data");
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(2)).build();
            HttpRequest firstRequest = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(2)).GET().build();
            HttpResponse<byte[]> first = client.send(
                    firstRequest, HttpResponse.BodyHandlers.ofByteArray());
            String validator = first.headers().firstValue("ETag").orElseThrow();
            HttpRequest secondRequest = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(2))
                    .header("If-None-Match", validator).GET().build();
            HttpResponse<byte[]> second = client.send(
                    secondRequest, HttpResponse.BodyHandlers.ofByteArray());

            System.out.println("first=" + first.statusCode() + ":"
                    + new String(first.body(), StandardCharsets.UTF_8));
            System.out.println("etag=" + validator);
            System.out.println("second=" + second.statusCode());
            System.out.println("secondBytes=" + second.body().length);
            System.out.println("requests=" + requests.get());
        } finally {
            server.stop(0);
        }
    }
}`,
      walkthrough: [
        { lines: "1-9", explanation: "owned server, HttpClient, exact bytes/timeouts와 request counter를 import합니다." },
        { lines: "12-31", explanation: "If-None-Match equality에는304 empty response를, 그 외에는200 data+ETag를 반환합니다." },
        { lines: "34-42", explanation: "dynamic loopback URI와 bounded client/request로 첫200 byte response를 받습니다." },
        { lines: "43-49", explanation: "response ETag를 읽어 같은 URI의 If-None-Match header에 넣고 두 번째 요청을 보냅니다." },
        { lines: "51-57", explanation: "200 body, validator,304 empty body와 total requests2를 exact 출력합니다." },
        { lines: "58-60", explanation: "owned server를 모든 경로에서 종료합니다." },
      ],
      run: { environment: ["OpenJDK 21", "jdk.httpserver loopback127.0.0.1", "no external cache/network", "-Xlint:all warning0"], command: isolatedJavaRun("EtagConditionalLoopback.java", "EtagConditionalLoopback") },
      output: { value: "first=200:data\netag=\"v1\"\nsecond=304\nsecondBytes=0\nrequests=2", explanation: ["첫 response가 validated candidate bytes와 ETag를 제공합니다.", "두 번째 request가 같은 validator를 전송합니다.", "304 body는 empty이며 cached data를 재사용해야 합니다."] },
      experiments: [
        { change: "cache entry 없이 If-None-Match를 보내304를 받습니다.", prediction: "재사용할 bytes가 없어 결과를 만들 수 없습니다.", result: "cache-miss304를 typed protocol/cache-state failure로 처리합니다." },
        { change: "Authorization이 다른 두 users가 URI만 cache key로 공유합니다.", prediction: "한 사용자의 representation이 다른 사용자에게 노출될 수 있습니다.", result: "authorization/tenant와 Vary dimensions를 cache partition에 포함합니다." },
        { change: "200 body 검증 전 ETag/current pointer를 저장합니다.", prediction: "schema-invalid bytes와 validator가 trusted cache로 승격됩니다.", result: "bytes→parse→domain→readback 완료 뒤 generation과 metadata를 함께 publish합니다." },
      ],
      sourceRefs: ["java-http-client", "java-http-request", "java-http-response", "java-http-headers", "jdk-http-server", "rfc-9110-http", "rfc-9111-cache"],
    }],
    diagnostics: [
      { symptom: "304를 받았는데 결과 body가 비어 있거나 null DTO가 publish된다.", likelyCause: "304를 새 empty representation으로 처리하고 기존 validated cache를 불러오지 않았습니다.", checks: ["cache key/entry/validator를 확인합니다.", "304 branch가 parser를 호출하는지 봅니다.", "generation pointer를 확인합니다."], fix: "matching validated cache entry를 재사용하고 없으면 cache-state failure로 재요청 정책을 적용합니다.", prevention: "200→304, cold304, evicted entry와 validator mismatch tests를 둡니다." },
      { symptom: "조건부 cache가 사용자 간 데이터를 섞거나 wrong language representation을 준다.", likelyCause: "URI만 key로 사용하고 authorization/Vary dimensions를 누락했습니다.", checks: ["Vary header와 request headers를 비교합니다.", "tenant/auth scope를 확인합니다.", "cache hit provenance를 추적합니다."], fix: "representation selection dimensions로 cache를 partition하고 sensitive responses의 공유를 금지합니다.", prevention: "Accept-Encoding/Language/Auth/Tenant cross-product isolation tests를 둡니다." },
    ],
    expertNotes: ["A 304 response validates a cached representation; it does not create a replacement representation by itself.", "Publish cache metadata and validated content as one generation so crashes cannot pair a new validator with old or invalid bytes."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...validationAndCacheChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "java-map-api", repository: "Java SE 21 API", path: "java.util.Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["untyped JSON object tree fixture", "key/value runtime types"], evidence: "generic object mapping 근거입니다." },
  { id: "java-set-api", repository: "Java SE 21 API", path: "java.util.Set", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html", usedFor: ["exact required/unknown field set"], evidence: "exact key-set comparison 근거입니다." },
  { id: "rfc-8259-json", repository: "IETF", path: "RFC 8259 The JavaScript Object Notation JSON Data Interchange Format", publicUrl: "https://www.rfc-editor.org/rfc/rfc8259", usedFor: ["JSON syntax/data model", "numbers", "duplicate-name interoperability"], evidence: "JSON format specification 근거입니다." },
  { id: "json-schema-validation", repository: "JSON Schema", path: "JSON Schema Validation Draft 2020-12", publicUrl: "https://json-schema.org/draft/2020-12/json-schema-validation", usedFor: ["types", "required/properties", "validation vocabulary"], evidence: "JSON structural validation concepts 근거입니다." },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "hostname과 IP address는 같은 identity인가요?", answer: "아닙니다. hostname은 DNS로 하나 이상의 주소에 매핑되는 이름이고 address는 특정 network destination 표현입니다. authorization에는 URI host policy와 실제 resolved addresses를 모두 사용합니다." },
  { question: "forward DNS와 reverse DNS 결과를 보안 identity로 믿으면 왜 위험한가요?", answer: "answer가 운영자·resolver·시간에 따라 바뀌고 reverse name도 검증된 소유권을 자동 보장하지 않기 때문입니다. 인증은 TLS certificate와 application credential 같은 별도 수단을 사용합니다." },
  { question: "URI와 URL을 언제 구분해 사용하나요?", answer: "URI는 component parse·normalize·resolve를 side effect 없이 수행하는 식별 모델이고, URL/HTTP client는 실제 접근 경계입니다. 먼저 URI policy를 통과시킨 뒤 network API로 넘깁니다." },
  { question: "URI.normalize가 percent encoding과 hostname case까지 모두 canonicalize하나요?", answer: "아닙니다. 주로 hierarchical path의 dot segments를 처리하며 percent-encoding equivalence, IDN, default port와 application path 의미는 별도 정책입니다." },
  { question: "URLEncoder를 전체 URL에 쓰면 왜 안 되나요?", answer: "application/x-www-form-urlencoded의 form component 규칙이므로 scheme 구분자, slash와 query 구조까지 잘못 encode할 수 있습니다. component별 builder/encoder를 사용합니다." },
  { question: "HttpClient.send가 exception 없이 반환하면 요청이 성공한 것인가요?", answer: "transport exchange가 response를 만들었다는 뜻일 뿐입니다. status, headers, media, body limits, parse/schema/domain gates를 통과해야 application success입니다." },
  { question: "connect timeout 하나로 전체 HTTP 작업을 제한할 수 있나요?", answer: "없습니다. DNS, connect, TLS, headers/body, retries와 application parse가 서로 다른 시간을 사용하므로 request timeout과 total deadline/cancellation을 함께 설계합니다." },
  { question: "HttpURLConnection에서 non-2xx body는 어떻게 읽나요?", answer: "먼저 status를 얻고 2xx는 input stream, 그 밖은 error stream을 선택하되 null·size·media·charset 정책을 적용합니다." },
  { question: "disconnect만 호출하면 body resource ownership이 충분한가요?", answer: "아닙니다. acquired InputStream/Reader를 try-with-resources로 먼저 닫고 outer finally에서 connection을 disconnect해 partial initialization과 primary exception을 보존합니다." },
  { question: "Content-Length가 body limit보다 작으면 안전한가요?", answer: "아닙니다. header가 없거나 부정확할 수 있고 compressed size일 수 있습니다. 실제 transfer/decompressed bytes와 parser expansion을 streaming으로 제한합니다." },
  { question: "Content-Encoding과 Transfer-Encoding은 같은가요?", answer: "아닙니다. Content-Encoding은 representation에 적용된 gzip 같은 coding이고 Transfer-Encoding은 HTTP message 전송 framing입니다. decode와 size 정책도 다릅니다." },
  { question: "UTF-8 문자열 길이와 byte 길이는 왜 따로 제한하나요?", answer: "한 character가 여러 UTF-8 bytes일 수 있고 combining/emoji도 있기 때문입니다. network/memory budget은 bytes, domain 표시 규칙은 code points/graphemes 등 목적에 맞는 단위를 씁니다." },
  { question: "unknown Content-Encoding을 identity로 읽어도 되나요?", answer: "안 됩니다. bytes 의미가 모호해지고 parser/security policy를 우회할 수 있으므로 지원 coding allowlist 밖은 fail closed합니다." },
  { question: "리다이렉트는 왜 매 hop 다시 검증해야 하나요?", answer: "Location이 scheme, authority, port, path와 DNS destination을 바꾸는 새 요청이기 때문입니다. credential scope와 SSRF address policy도 다시 계산합니다." },
  { question: "HttpClient.Redirect.NORMAL만 켜면 SSRF가 해결되나요?", answer: "아닙니다. protocol downgrade 일부를 제한하지만 application host/path/address allowlist나 DNS rebinding, credential scope를 대신하지 않습니다." },
  { question: "GET은 언제나 무조건 retry해도 되나요?", answer: "HTTP semantics상 safe/idempotent 성격이 있어도 endpoint side effect, total deadline, rate limit과 partial response를 고려해야 합니다. operation contract와 bounded policy가 필요합니다." },
  { question: "POST도 안전하게 retry할 수 있나요?", answer: "server가 durable idempotency key를 동일 operation scope에서 보장하고 client가 같은 key를 재사용하는 등 명시적 계약이 있으면 가능합니다. 단순 POST라는 이유만으로는 불가능합니다." },
  { question: "SSRF 방어에서 hostname exact allowlist만으로 부족한 이유는 무엇인가요?", answer: "허용 이름이 private/link-local 주소를 resolve하거나 validation과 connection 사이 answer가 바뀔 수 있기 때문입니다. answers 전체와 connect destination, redirects를 함께 통제합니다." },
  { question: "InetAddress.isSiteLocalAddress만 검사하면 모든 internal address를 막나요?", answer: "아닙니다. loopback, link-local, any-local, multicast, IPv6 unique-local, mapped/special-purpose와 조직별 metadata ranges를 포함한 정책 표가 필요합니다." },
  { question: "DNS rebinding을 application 코드만으로 완전히 막을 수 있나요?", answer: "high-level client가 checked address로 connection을 고정하지 못하면 어렵습니다. trusted egress proxy/resolver와 firewall 같은 network-layer enforcement를 함께 사용합니다." },
  { question: "FEATURE_SECURE_PROCESSING 하나면 XXE 방어가 끝나나요?", answer: "아닙니다. DOCTYPE/entities/XInclude를 끄고 external DTD/schema protocols를 차단하며 input·node·depth·time limits와 egress defense를 둡니다." },
  { question: "XML prefix 문자열로 element를 찾으면 왜 불안정한가요?", answer: "동일 namespace URI에 문서가 다른 prefix를 자유롭게 붙일 수 있기 때문입니다. namespace URI와 local name을 identity로 사용합니다." },
  { question: "DOM과 streaming XML parser는 언제 선택하나요?", answer: "bounded small document와 random tree access에는 hardened DOM, 큰 순차 feed에는 hardened streaming parser와 explicit depth/count/state limits가 적합합니다." },
  { question: "JSON parser가 Map을 반환하면 schema 검증이 끝난 것인가요?", answer: "아닙니다. Map은 syntax parse 결과의 untyped tree일 뿐 required/unknown fields, runtime types, ranges와 domain invariants를 DTO adapter에서 검사해야 합니다." },
  { question: "JDK 표준 library만으로 일반 JSON text를 parse할 수 있나요?", answer: "Java SE에는 범용 JSON parser가 포함되어 있지 않습니다. maintained dependency를 선택해 version과 stream constraints를 고정해야 하며 Map fixture는 parser 대체물이 아닙니다." },
  { question: "unknown JSON fields를 무시하는 것이 항상 호환성에 좋은가요?", answer: "아닙니다. typo나 security-sensitive producer drift를 숨길 수 있습니다. versioned compatibility 정책으로 allow/reject와 telemetry를 명시합니다." },
  { question: "JSON number를 모두 double로 받으면 어떤 문제가 있나요?", answer: "large integer precision, identifier, currency와 non-finite/coercion 문제가 생깁니다. domain에 맞는 int/long/BigInteger/BigDecimal과 범위를 선택합니다." },
  { question: "ETag가 같다는 것은 무엇을 뜻하나요?", answer: "해당 selected representation의 validator 비교가 일치한다는 뜻입니다. strong/weak semantics와 URI·Vary·authorization scope 안에서 해석해야 합니다." },
  { question: "304 response body를 parse해야 하나요?", answer: "아닙니다.304는 matching validated cached representation을 재사용하라는 response이며 cache entry가 없으면 정상 empty DTO가 아니라 cache-state failure입니다." },
  { question: "network ingestion을 안전하게 publish하는 마지막 조건은 무엇인가요?", answer: "status/media/limits/parse/schema/domain을 통과한 owned temp generation의 count·digest·provenance를 readback하고 atomic pointer swap을 완료해야 합니다. 실패 시 기존 generation을 보존합니다." },
);

(session.completionChecklist as string[]).push(
  "hostname, numeric address와 authorization identity를 구분했다.",
  "forward/reverse DNS를 재현 가능한 test fixture와 분리했다.",
  "IPv4와 IPv6 address families를 모두 다뤘다.",
  "URI를 scheme·authority·host·port·path·query·fragment로 parse했다.",
  "raw와 decoded URI components를 혼동하지 않았다.",
  "dot-segment normalization과 application path semantics를 분리했다.",
  "form encoding을 전체 URL에 적용하지 않았다.",
  "IDN display와 ASCII network label policy를 구분했다.",
  "HttpClient를 application scope에 재사용하도록 설계했다.",
  "connect, request, body와 total deadlines를 구분했다.",
  "HTTP transport success와 application success를 구분했다.",
  "status를 body parse 전에 검사했다.",
  "non-2xx error body에도 size·media·privacy limit을 적용했다.",
  "InputStream과 Reader를 acquisition scope에서 닫았다.",
  "connection disconnect가 primary exception을 가리지 않게 했다.",
  "Content-Type media type과 parameters를 구조적으로 해석했다.",
  "charset을 platform default에 맡기지 않았다.",
  "unsupported Content-Encoding을 fail closed했다.",
  "compressed와 decompressed byte budgets를 각각 적용했다.",
  "character/domain limit과 byte/resource limit을 분리했다.",
  "redirect maximum hops와 visited set을 정의했다.",
  "redirect마다 URI와 DNS/address policy를 재검증했다.",
  "cross-origin redirect에서 credentials를 제거했다.",
  "301·302·303·307·308의 method/body 차이를 시험했다.",
  "retry 전에 operation idempotency를 확인했다.",
  "retry max attempts, total deadline, backoff와 jitter를 정의했다.",
  "Retry-After와 caller cancellation을 반영했다.",
  "SSRF URI policy가 exact canonical components를 비교한다.",
  "resolved IPv4/IPv6 answers 전체를 검사한다.",
  "loopback·private·link-local·multicast·unique-local을 차단한다.",
  "DNS rebinding과 resolve-check-connect gap을 설계에 반영했다.",
  "application allowlist와 network egress control을 함께 사용한다.",
  "XML DOCTYPE와 external entities를 비활성화했다.",
  "XML external DTD/schema protocol access를 차단했다.",
  "XInclude와 entity expansion policy를 명시했다.",
  "XML input·node·depth·text·time limits를 정의했다.",
  "XML namespace URI와 local name을 사용했다.",
  "parser errors가 raw body/path를 public log에 노출하지 않는다.",
  "maintained JSON parser와 version을 명시했다.",
  "JSON body·token·depth·collection·string limits를 정의했다.",
  "JSON required, null, types와 ranges를 검증했다.",
  "unknown/duplicate JSON field 정책을 명시했다.",
  "JSON numeric precision과 overflow를 domain별로 처리했다.",
  "syntax, schema와 domain failures를 분리했다.",
  "ETag validator를 representation scope와 함께 저장했다.",
  "304에서 matching validated cache만 재사용한다.",
  "Vary·authorization·tenant를 cache key에 반영했다.",
  "validated content와 provenance를 atomic generation으로 publish한다.",
);
