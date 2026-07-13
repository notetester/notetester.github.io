import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const count = code.split("\n").length;
  const first = Math.max(1, Math.floor(count / 3));
  const second = Math.max(first + 1, Math.floor((count * 2) / 3));
  return { id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${first}`, explanation: "JDK 표준 java.sql API와 synthetic URL/properties/test driver를 준비해 실제 host·credential·network를 사용하지 않습니다." },
      { lines: `${first + 1}-${second}`, explanation: "driver selection, URL validation, property policy, Connection close 또는 SQLException classification을 실제 Java 코드로 실행합니다." },
      { lines: `${second + 1}-${count}`, explanation: "driver name·redacted endpoint·state·safe error처럼 deterministic evidence만 출력합니다. production TLS/network/auth는 실제 driver 통합 환경에서 재검증합니다." },
    ],
    run: { environment: ["JDK 21 이상", "java.sql·java.base 표준 모듈", "외부 DB·driver JAR·network·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["JDK source-file mode의 stdout은 문서와 한 글자씩 같아야 합니다.", "Synthetic Driver/Proxy Connection은 실제 Oracle/MySQL protocol, TLS, DNS, authentication과 pool behavior를 대체하지 않습니다."] },
    experiments: [
      { change: "unknown subprotocol, duplicate property, invalid timeout와 close failure를 추가합니다.", prediction: "connection pipeline의 어느 경계가 실패했는지 stable category로 분리됩니다.", result: "URL/property/driver/connection state와 redacted diagnostics를 비교합니다." },
      { change: "동일 contract를 실제 Oracle/MySQL JDBC driver와 격리 DB에서 실행합니다.", prediction: "URL grammar, service discovery, TLS properties, timeout와 SQLState/vendor code에 승인된 차이가 나타납니다.", result: "JDK/driver/server versions와 connection metadata/readback을 conformance evidence로 남깁니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "connection-establishment-pipeline",
    title: "Connection 수립을 classpath부터 authenticated session까지 단계로 추적합니다",
    lead: "getConnection 한 줄 안에는 driver 발견, URL 매칭, socket/TLS, 인증, DB session 생성과 초기 상태 설정이 연쇄적으로 들어 있습니다.",
    explanations: [
      "원본 JDBCBasic.java는 driver class load, JDBC URL·사용자·비밀번호 준비, DriverManager.getConnection과 Connection 출력이라는 초급 흐름을 보여 줍니다. 이 교재는 실제 host/port/service/user/password 값을 절대 복사하지 않고 구조와 개선 지점만 provenance로 사용합니다.",
      "pipeline은 dependency artifact 확인→class/module loader가 Driver provider 발견→DriverManager가 URL을 이해하는 Driver 선택→DNS/address→TCP→TLS/서버 identity→DB protocol→authentication/authorization→Connection object→session defaults 검증 순서입니다.",
      "각 단계는 다른 증거와 remediation을 가집니다. No suitable driver는 network 이전, name resolution/connect refused는 transport, certificate 오류는 TLS, invalid credentials는 auth, permission 오류는 authorization, pool timeout은 local capacity 문제입니다.",
      "Connection이 반환됐다는 사실만으로 application 준비가 끝난 것은 아닙니다. expected catalog/schema, readOnly, autoCommit, isolation, timezone/charset와 최소 권한 identity를 metadata 또는 작은 validation query로 확인합니다.",
      "startup fail-fast와 runtime retry를 구분합니다. 잘못된 URL/credential/certificate는 반복 retry하지 않고, transient network는 bounded backoff+jitter와 global deadline 아래 retry하며 user request마다 connection storm을 만들지 않습니다.",
    ],
    concepts: [
      c("connection pipeline", "driver artifact부터 DB session 준비까지 이어지는 단계와 실패 경계입니다.", ["단계별 evidence를 수집합니다.", "한 timeout으로 뭉개지 않습니다."]),
      c("database session", "한 physical/logical Connection이 server에 만든 transaction·schema·locale·security state입니다.", ["socket과 다릅니다.", "pool 재사용 전에 reset합니다."]),
      c("readback", "요청한 설정이 실제 Connection/server state에 적용됐는지 다시 읽어 확인하는 검증입니다.", ["catalog/schema/isolation에 필요합니다.", "secret은 출력하지 않습니다."]),
    ],
    diagnostics: [
      d("getConnection이 실패했는데 원인을 모두 DB 접속 실패로만 기록합니다.", "driver/DNS/TLS/auth/pool 단계를 분류하지 않았습니다.", ["exception class/SQLState chain", "loaded drivers", "redacted URL family", "DNS/TCP/TLS/auth telemetry"], "pipeline stage와 retryability를 stable taxonomy로 map하고 native cause chain을 internal trace에 보존합니다.", "단계별 fault injection과 no-secret diagnostic assertions를 둡니다."),
      d("Connection은 열렸지만 query가 다른 schema 또는 권한으로 실행됩니다.", "session postconditions를 readback하지 않았습니다.", ["getCatalog/getSchema", "effective user/role", "autoCommit/isolation/readOnly", "pool init SQL"], "borrow/create 직후 expected safe session invariants를 검증하고 mismatch면 폐기합니다.", "wrong-schema/role/timezone integration fixture를 둡니다."),
    ],
    expertNotes: ["연결 장애를 고치는 첫 단계는 retry가 아니라 pipeline에서 마지막으로 성공한 경계를 찾는 것입니다.", "Connection 성공 로그에도 URL/credential/identity PII를 그대로 남기지 않습니다."],
  },
  {
    id: "driver-discovery-classpath-service-loader",
    title: "JDBC Driver 발견을 classpath·module·Service Provider 관점에서 이해합니다",
    lead: "JDBC 4 이후 driver JAR의 service provider가 자동 등록될 수 있지만 artifact/class loader가 보이지 않으면 Class.forName 유무와 상관없이 연결할 수 없습니다.",
    explanations: [
      "Driver는 acceptsURL/connect를 구현하고 load될 때 DriverManager에 등록됩니다. DriverManager는 service-provider loading과 명시적 등록된 drivers 중 URL을 이해하는 구현을 찾습니다.",
      "원본의 Class.forName은 legacy/diagnostic 상황에서 class load를 명확히 하지만 현대 driver에서 항상 필요한 것은 아닙니다. 자동 discovery가 동작하는지 DriverManager.drivers(), artifact coordinates와 packaged META-INF/services를 확인합니다.",
      "compile classpath와 runtime classpath가 다르면 IDE test만 통과하고 packaged application에서 No suitable driver 또는 ClassNotFoundException이 납니다. dependency scope, fat JAR shading/service merge와 JPMS module path를 artifact inspection으로 검증합니다.",
      "application server/plugin에서 context class loader가 달라 DriverManager가 provider를 보지 못하거나 redeploy 뒤 static registration이 class loader leak을 만들 수 있습니다. container가 제공하는 DataSource/driver lifecycle을 따릅니다.",
      "여러 driver versions가 동시에 있으면 어떤 Driver가 URL을 accept하는지 불명확해집니다. runtime inventory에는 driver implementation/version/artifact hash와 supported JDK를 기록하고 dependency convergence를 강제합니다.",
    ],
    concepts: [
      c("JDBC Driver", "DB vendor protocol과 java.sql API를 연결하고 URL을 받아 Connection을 만드는 provider입니다.", ["Driver interface를 구현합니다.", "runtime artifact가 필요합니다."]),
      c("service provider discovery", "META-INF/services 또는 module provides를 통해 ServiceLoader/DriverManager가 구현을 찾는 방식입니다.", ["class loader visibility에 의존합니다.", "JDBC 4 자동 등록 기반입니다."]),
      c("runtime classpath", "실제 process/class loader가 읽을 수 있는 classes/resources 집합입니다.", ["compile/test와 다를 수 있습니다.", "packaged artifact에서 검증합니다."]),
    ],
    codeExamples: [java("jdbc01-driver-selection", "DriverManager의 URL 기반 driver 선택", "Jdbc01DriverSelection.java", "synthetic Driver를 등록해 맞는 URL만 accept하고 Proxy Connection을 반환하는 실제 DriverManager 흐름을 실행합니다.", String.raw`import java.lang.reflect.Proxy;
import java.sql.*;
import java.util.Properties;
import java.util.logging.Logger;

public class Jdbc01DriverSelection {
  static final class DemoDriver implements Driver {
    public boolean acceptsURL(String url) { return url != null && url.startsWith("jdbc:demo:"); }
    public Connection connect(String url, Properties info) {
      if (!acceptsURL(url)) return null;
      return (Connection) Proxy.newProxyInstance(Connection.class.getClassLoader(), new Class<?>[]{Connection.class}, (proxy, method, args) -> switch (method.getName()) {
        case "toString" -> "DemoConnection";
        case "isClosed" -> false;
        case "close" -> null;
        case "isWrapperFor" -> false;
        case "unwrap" -> null;
        default -> method.getReturnType().isPrimitive() ? primitiveDefault(method.getReturnType()) : null;
      });
    }
    static Object primitiveDefault(Class<?> type) {
      if (type == boolean.class) return false;
      if (type == int.class) return 0;
      if (type == long.class) return 0L;
      return 0;
    }
    public int getMajorVersion() { return 1; }
    public int getMinorVersion() { return 0; }
    public DriverPropertyInfo[] getPropertyInfo(String u, Properties p) { return new DriverPropertyInfo[0]; }
    public boolean jdbcCompliant() { return false; }
    public Logger getParentLogger() { return Logger.getGlobal(); }
  }
  public static void main(String[] args) throws Exception {
    Driver driver = new DemoDriver();
    DriverManager.registerDriver(driver);
    System.out.println("accepts-demo=" + driver.acceptsURL("jdbc:demo:memory"));
    System.out.println("accepts-other=" + driver.acceptsURL("jdbc:other:memory"));
    System.out.println("selected=" + DriverManager.getDriver("jdbc:demo:memory").getClass().getSimpleName());
    try (Connection connection = DriverManager.getConnection("jdbc:demo:memory", new Properties())) {
      System.out.println("connection=" + connection);
      System.out.println("closed=" + connection.isClosed());
    }
    DriverManager.deregisterDriver(driver);
    System.out.println("registered-after=false");
  }
}`, "accepts-demo=true\naccepts-other=false\nselected=DemoDriver\nconnection=DemoConnection\nclosed=false\nregistered-after=false", ["java-driver", "java-driver-manager", "java-service-loader"])],
    diagnostics: [
      d("IDE에서는 연결되지만 배포 JAR은 No suitable driver입니다.", "runtime artifact에 driver class/service descriptor가 없거나 shading이 provider resources를 덮었습니다.", ["packaged JAR dependencies", "META-INF/services/java.sql.Driver", "DriverManager.drivers", "class/module loader"], "runtime dependency scope와 service resource merge를 수정하고 packaged artifact smoke test를 실행합니다.", "build된 동일 artifact에서 driver discovery test를 release gate로 둡니다."),
      d("redeploy 후 metaspace/driver class loader가 누적됩니다.", "container lifecycle 밖에서 DriverManager에 driver를 static 등록하고 해제하지 않았습니다.", ["registered driver class loaders", "redeploy counts", "container DataSource", "deregister hooks"], "container-managed DataSource/driver lifecycle을 사용하거나 ownership에 맞춰 deregister/close합니다.", "repeated deploy/undeploy leak test와 driver inventory alert를 둡니다."),
    ],
    expertNotes: ["Class.forName을 제거하거나 유지하는 결정은 자동 discovery의 packaged evidence로 내립니다.", "driver artifact는 executable dependency이면서 supply-chain input이므로 version/hash/vulnerability inventory를 유지합니다."],
  },
  {
    id: "jdbc-url-grammar-routing",
    title: "JDBC URL을 vendor grammar·routing·환경 계약으로 검증합니다",
    lead: "jdbc:subprotocol:subname 형식 이후의 host/port/service/database/options 문법은 driver마다 다르므로 문자열 감으로 조립하면 다른 DB 또는 불안전한 옵션에 연결됩니다.",
    explanations: [
      "JDBC 공통 prefix는 `jdbc:`이지만 Oracle Thin service/SID/TNS와 MySQL single/replication/loadbalance URL 문법은 공식 driver 문서를 따릅니다. 한 vendor 형식을 다른 vendor에 적용하지 않습니다.",
      "URL은 code에 직접 붙이지 않고 typed configuration을 parse/validate한 뒤 생성합니다. environment allow-list, expected scheme/driver family, host count, port range, database/service와 prohibited query properties를 startup 전에 검사합니다.",
      "password/token은 URL query/userinfo에 넣지 않습니다. URL은 exception, metrics, thread dump와 config dashboard에 노출되기 쉬우므로 credentials는 separate Properties/DataSource setters/secret injection으로 전달합니다.",
      "DNS name은 certificate identity와 failover policy를 반영합니다. raw IP fallback이 TLS hostname verification을 깨뜨리거나 split-horizon DNS가 다른 cluster를 가리키지 않도록 endpoint identity를 운영합니다.",
      "redaction은 문자열 전체 삭제보다 subprotocol, logical endpoint alias, database class와 property-name allow-list만 남깁니다. raw host/database도 tenant/infra 민감 정보일 수 있어 production logs에는 stable endpoint id를 사용합니다.",
    ],
    concepts: [
      c("JDBC URL", "DriverManager/Driver가 대상과 연결 options를 해석하는 vendor-specific database URL입니다.", ["jdbc:subprotocol:subname 기반입니다.", "공식 driver grammar를 따릅니다."]),
      c("logical endpoint", "application이 physical host 대신 연결 정책/cluster를 식별하는 안정 이름입니다.", ["DNS/service discovery와 매핑합니다.", "logs에는 alias를 사용합니다."]),
      c("configuration validation", "network 접속 전 URL/property의 schema·allow-list·range·conflict를 검사하는 단계입니다.", ["fail-fast합니다.", "secret 값을 출력하지 않습니다."]),
    ],
    codeExamples: [java("jdbc01-url-redaction", "JDBC URL grammar 검사와 안전한 redaction", "Jdbc01Url.java", "synthetic URL에서 subprotocol/endpoint/database를 추출하고 property 값은 숨기는 deterministic validator를 실행합니다.", String.raw`import java.util.*;

public class Jdbc01Url {
  record Parsed(String protocol, String endpoint, String database, SortedSet<String> propertyNames) {}
  static Parsed parse(String url) {
    if (!url.startsWith("jdbc:demo://")) throw new IllegalArgumentException("unsupported-jdbc-url");
    String rest = url.substring("jdbc:demo://".length());
    String[] querySplit = rest.split("\\?", 2);
    String[] route = querySplit[0].split("/", 2);
    if (route.length != 2 || route[0].isBlank() || route[1].isBlank()) throw new IllegalArgumentException("route-invalid");
    SortedSet<String> names = new TreeSet<>();
    if (querySplit.length == 2) for (String part : querySplit[1].split("&")) names.add(part.split("=", 2)[0]);
    return new Parsed("demo", route[0], route[1], names);
  }
  public static void main(String[] args) {
    Parsed parsed = parse("jdbc:demo://db.internal.test:1543/learning?tls=verify&connectTimeout=3000");
    System.out.println("protocol=" + parsed.protocol());
    System.out.println("endpoint=" + parsed.endpoint());
    System.out.println("database=" + parsed.database());
    System.out.println("property-names=" + String.join(",", parsed.propertyNames()));
    System.out.println("redacted=jdbc:demo://ENDPOINT/DATABASE?connectTimeout=REDACTED&tls=REDACTED");
    try { parse("http://db.invalid"); } catch (IllegalArgumentException error) { System.out.println("invalid=" + error.getMessage()); }
  }
}`, "protocol=demo\nendpoint=db.internal.test:1543\ndatabase=learning\nproperty-names=connectTimeout,tls\nredacted=jdbc:demo://ENDPOINT/DATABASE?connectTimeout=REDACTED&tls=REDACTED\ninvalid=unsupported-jdbc-url", ["java-driver-manager", "mysql-url", "oracle-url"])],
    diagnostics: [
      d("새 환경이 의도한 replica 대신 다른 DB에 연결됩니다.", "URL host/service/database를 자유 문자열로 배포하고 post-connect identity를 확인하지 않았습니다.", ["resolved endpoint/config source", "certificate/server identity", "catalog/schema readback", "environment allow-list"], "typed endpoint config와 environment allow-list를 검증하고 connection metadata에서 expected identity를 readback합니다.", "wrong-endpoint canary와 deployment config diff gate를 둡니다."),
      d("exception과 metrics에 password가 포함된 URL이 노출됩니다.", "credential을 URL parameter에 넣고 raw URL을 로그했습니다.", ["URL construction", "driver exceptions", "telemetry tags", "config dashboard"], "secret을 separate protected property로 전달하고 endpoint alias/property names만 allow-list logging합니다.", "synthetic secret canary로 logs/traces/error response를 scan합니다."),
    ],
    expertNotes: ["JDBC URL은 단순 문자열이 아니라 vendor grammar와 routing/security policy가 만나는 configuration object입니다.", "동일 property를 URL과 Properties 양쪽에 중복 지정하면 precedence가 implementation-defined일 수 있으므로 한 곳만 소유합니다."],
  },
  {
    id: "properties-secrets-configuration",
    title: "Connection properties를 typed schema와 secret boundary로 관리합니다",
    lead: "Properties는 문자열 map이므로 오타·단위·중복·secret exposure를 compile time에 막지 못합니다.",
    explanations: [
      "user/password, connect/socket timeout, TLS mode/trust/key stores, application name, timezone/charset와 failover options를 owner·type·unit·default·required/prohibited·sensitive metadata가 있는 configuration schema로 정의합니다.",
      "credential은 source code, repository config, command line, environment dump와 URL에 하드코딩하지 않습니다. workload identity 또는 secret manager로 short-lived credential을 주입하고 rotation overlap/revocation과 startup failure를 rehearsal합니다.",
      "Properties에 값을 넣은 뒤 `toString`, debug logging이나 exception wrapping을 하면 secret이 그대로 노출됩니다. safe view는 allow-listed non-sensitive names와 `<redacted>`만 반환하고 char[]이라도 driver 전달 후 JVM memory zeroization 한계를 정직하게 기록합니다.",
      "timeout `3000`이 milliseconds인지 seconds인지 driver property마다 다릅니다. Duration으로 parse/range validate하고 vendor-required unit으로 한 지점에서 변환하며 0=disabled 같은 위험 default를 거부합니다.",
      "URL과 Properties에서 같은 key를 중복 지정하지 않고 unknown keys를 fail-fast 또는 explicit warning으로 거부합니다. driver upgrade 때 property rename/default change를 compatibility matrix로 검증합니다.",
    ],
    concepts: [
      c("configuration schema", "property name·type·unit·default·sensitivity·validation을 명시한 계약입니다.", ["문자열 map 앞에 둡니다.", "unknown/duplicate를 거부합니다."]),
      c("secret injection", "credential 값을 code/artifact에 저장하지 않고 runtime의 보호된 identity/secret source에서 전달하는 과정입니다.", ["rotation/revocation을 지원합니다.", "logs에 값이 남지 않습니다."]),
      c("safe configuration view", "diagnostics에 노출 가능한 이름/비민감 값만 제공하고 secret은 redaction한 표현입니다.", ["raw Properties.toString을 금지합니다.", "endpoint도 alias화할 수 있습니다."]),
    ],
    codeExamples: [java("jdbc01-properties-policy", "typed connection property policy와 redacted view", "Jdbc01Properties.java", "허용 property와 numeric timeout을 검증하고 password 값 없이 안전한 diagnostics만 출력합니다.", String.raw`import java.time.Duration;
import java.util.*;

public class Jdbc01Properties {
  static final Set<String> ALLOWED = Set.of("user", "password", "tlsMode", "connectTimeoutMs", "socketTimeoutMs");
  static Properties build(String user, char[] password, Duration connect, Duration socket) {
    if (connect.isZero() || connect.isNegative() || connect.toSeconds() > 30) throw new IllegalArgumentException("connect-timeout-range");
    if (socket.compareTo(connect) < 0) throw new IllegalArgumentException("socket-before-connect");
    Properties p = new Properties();
    p.setProperty("user", user); p.setProperty("password", new String(password)); p.setProperty("tlsMode", "VERIFY_IDENTITY");
    p.setProperty("connectTimeoutMs", Long.toString(connect.toMillis())); p.setProperty("socketTimeoutMs", Long.toString(socket.toMillis()));
    if (!ALLOWED.containsAll(p.stringPropertyNames())) throw new IllegalArgumentException("property-unknown");
    return p;
  }
  public static void main(String[] args) {
    Properties p = build("APP_ROLE", "SYNTHETIC-SECRET".toCharArray(), Duration.ofSeconds(3), Duration.ofSeconds(8));
    System.out.println("property-names=" + String.join(",", new TreeSet<>(p.stringPropertyNames())));
    System.out.println("tls=" + p.getProperty("tlsMode"));
    System.out.println("connect-ms=" + p.getProperty("connectTimeoutMs"));
    System.out.println("socket-ms=" + p.getProperty("socketTimeoutMs"));
    System.out.println("password=<redacted>");
    try { build("APP_ROLE", new char[0], Duration.ZERO, Duration.ofSeconds(1)); } catch (IllegalArgumentException error) { System.out.println("invalid=" + error.getMessage()); }
  }
}`, "property-names=connectTimeoutMs,password,socketTimeoutMs,tlsMode,user\ntls=VERIFY_IDENTITY\nconnect-ms=3000\nsocket-ms=8000\npassword=<redacted>\ninvalid=connect-timeout-range", ["java-properties", "java-driver", "mysql-properties", "oracle-url"])],
    diagnostics: [
      d("timeout을 설정했는데 연결이 수십 분 멈춥니다.", "잘못된 property 이름/단위 또는 0=무제한 default가 적용됐습니다.", ["driver version property docs", "effective safe config", "DNS/TCP/TLS phases", "outer deadline"], "typed Duration/range schema와 driver-specific unit adapter를 사용하고 blackhole endpoint에서 elapsed budget을 검증합니다.", "property typo/zero/max/network fault integration test를 둡니다."),
      d("credential rotation 후 일부 instances만 인증 실패합니다.", "secret version/lease와 pool connection lifetime/rotation overlap이 조정되지 않았습니다.", ["secret versions", "pool maxLifetime", "DB grant overlap", "failed auth by instance"], "new credential 배포→new connections canary→pool drain→old revoke 순서와 rollback을 운영합니다.", "rotation drill과 old credential zero-use readback을 둡니다."),
    ],
    expertNotes: ["Properties object 자체가 secret-bearing object이므로 lifetime, heap dump와 diagnostics 접근을 제한합니다.", "config validation은 네트워크 전에 실행해 위험 default와 typo를 빠르게 거부합니다."],
  },
  {
    id: "tls-server-identity",
    title: "TLS 암호화와 서버 identity 검증을 별개로 확인합니다",
    lead: "암호화된 socket이라도 신뢰하지 않은 인증서 또는 hostname mismatch를 허용하면 공격자 endpoint와 안전하게 암호화해 통신할 수 있습니다.",
    explanations: [
      "TLS mode가 encryption only인지 CA chain 검증인지 hostname/service identity까지 검증하는지 vendor property 의미를 확인합니다. production은 server identity를 검증하고 insecure fallback을 금지합니다.",
      "trust store와 client key store는 password와 별개 secret/config artifact이며 path/contents를 logs에 노출하지 않습니다. CA rotation은 old/new trust overlap, certificate expiry alert와 rollback을 rehearsal합니다.",
      "JDBC URL host가 certificate SAN과 일치해야 합니다. raw IP, local alias, proxy/load balancer와 DNS failover를 쓸 때 어느 identity를 검증하는지 공식 driver 문서와 실제 handshake에서 확인합니다.",
      "mTLS client certificate 또는 cloud token을 사용하면 DB user mapping, certificate/key rotation, clock skew와 connection pool lifetime을 설계합니다. 인증이 강해도 DB role은 최소 권한이어야 합니다.",
      "TLS test는 trusted correct host, unknown CA, expired/not-yet-valid, hostname mismatch, protocol/cipher policy와 revoked credential을 포함합니다. test에서 verify=false로 우회하지 않습니다.",
    ],
    concepts: [
      c("transport encryption", "network에서 JDBC protocol 내용을 암호화해 도청을 줄이는 기능입니다.", ["server identity 검증과 다릅니다.", "TLS version/cipher policy를 가집니다."]),
      c("hostname verification", "연결한 logical host가 certificate가 증명하는 identity와 일치하는지 확인하는 절차입니다.", ["MITM 방어에 필요합니다.", "raw IP fallback을 주의합니다."]),
      c("trust rotation", "old/new CA/certificates를 서비스 중단 없이 교체하고 old trust를 제거하는 과정입니다.", ["expiry/rollback을 포함합니다.", "pool connections를 drain합니다."]),
    ],
    diagnostics: [
      d("TLS enabled인데 hostname mismatch 연결도 성공합니다.", "encryption-only mode 또는 hostname verification disable을 사용했습니다.", ["effective TLS mode", "certificate SAN/chain", "URL host", "driver warnings"], "identity-verifying TLS mode와 correct DNS/SAN을 사용하고 insecure flags를 configuration deny-list에 둡니다.", "hostname/CA/expiry negative handshake tests를 둡니다."),
      d("CA rotation 순간 모든 새 connections가 실패합니다.", "new trust 배포 전 server certificate를 교체했거나 pool drain/rollback을 준비하지 않았습니다.", ["client trust versions", "server cert chain", "deployment order", "existing/new connections"], "new trust canary→server cert rotate→new connection readback→old trust removal 순서로 운영합니다.", "staging rotation과 expiry-window incident drill을 둡니다."),
    ],
    expertNotes: ["TLS property 이름은 vendor/driver version별로 달라 안전한 추상화가 실제 effective setting을 readback해야 합니다.", "인증서 path, DN과 endpoint도 infrastructure 민감 정보일 수 있어 logs에는 alias만 남깁니다."],
  },
  {
    id: "network-auth-timeout-taxonomy",
    title: "DNS·connect·TLS·login·socket·query timeout을 end-to-end deadline으로 정렬합니다",
    lead: "login timeout 하나는 DNS나 driver 내부 모든 단계에 일관되게 적용된다고 보장할 수 없고, outer request deadline보다 길면 zombie work가 남습니다.",
    explanations: [
      "DNS resolution, TCP connect, TLS handshake, database login, socket read와 statement query timeout을 구분합니다. 각각 설정 주체와 unit, cancellation guarantee와 retryability를 driver/server matrix에 기록합니다.",
      "service deadline > pool borrow? 일반적으로 request budget 안에 pool acquire, connect와 query가 모두 들어가도록 남은 시간을 계층적으로 배분합니다. 내부 timeout이 outer deadline보다 길어 background work/connection leak을 만들지 않습니다.",
      "DriverManager.setLoginTimeout은 global static state이고 driver가 어느 단계까지 준수하는지 실제로 검증해야 합니다. application-wide side effect 때문에 DataSource/pool/vendor properties를 선호할 수 있습니다.",
      "authentication failure는 credential typo/expired/locked, authorization은 login 성공 후 object privilege 부족입니다. 존재 여부/role details를 user response에 노출하지 않고 internal SQLState/vendor code로 분류합니다.",
      "retry는 idempotency와 capacity를 고려합니다. invalid config/auth/TLS는 fail-fast, transient network는 capped exponential backoff+jitter, pool exhaustion은 load shedding/admission으로 처리합니다.",
    ],
    concepts: [
      c("timeout hierarchy", "DNS/connect/login/read/query/pool/request deadlines의 포함·우선순위를 정한 규칙입니다.", ["outer budget보다 내부가 짧아야 합니다.", "unit/effective scope를 검증합니다."]),
      c("failure taxonomy", "driver/network/TLS/auth/authz/pool/query를 retry/alert 행동에 맞게 분류한 체계입니다.", ["SQLState/cause를 보존합니다.", "외부 message는 redacted합니다."]),
      c("connection storm", "장애 때 많은 instances/requests가 동시에 새 connection/retry를 만들어 DB와 network를 압도하는 현상입니다.", ["backoff/jitter/admission이 필요합니다.", "pool warmup을 제한합니다."]),
    ],
    codeExamples: [java("jdbc01-safe-errors", "SQLException chain을 safe stage와 retryability로 분류", "Jdbc01Errors.java", "synthetic SQLState/vendor causes를 raw endpoint/credential 없이 stable connection failure category로 바꿉니다.", String.raw`import java.sql.*;

public class Jdbc01Errors {
  record SafeError(String stage, boolean retryable, String code) {}
  static SafeError classify(SQLException error) {
    String state = error.getSQLState();
    if (state != null && state.startsWith("28")) return new SafeError("authentication", false, "DB_AUTH_REJECTED");
    if (state != null && state.startsWith("08")) return new SafeError("transport", true, "DB_CONNECTION_FAILURE");
    return new SafeError("database", false, "DB_CONNECT_UNKNOWN");
  }
  public static void main(String[] args) {
    SQLException transport = new SQLTransientConnectionException("synthetic network failure", "08001", 9001);
    SQLException auth = new SQLInvalidAuthorizationSpecException("synthetic auth failure", "28000", 1017);
    transport.setNextException(new SQLException("synthetic nested cause", "08006", 9002));
    for (SQLException error : new SQLException[]{transport, auth}) {
      SafeError safe = classify(error);
      System.out.println("stage=" + safe.stage() + "|retryable=" + safe.retryable() + "|code=" + safe.code());
    }
    int chain = 0;
    for (SQLException current = transport; current != null; current = current.getNextException()) chain++;
    System.out.println("transport-chain=" + chain);
    System.out.println("endpoint=<redacted>");
    System.out.println("credential=<redacted>");
  }
}`, "stage=transport|retryable=true|code=DB_CONNECTION_FAILURE\nstage=authentication|retryable=false|code=DB_AUTH_REJECTED\ntransport-chain=2\nendpoint=<redacted>\ncredential=<redacted>", ["java-driver-manager", "java-connection", "java-jdbc-tutorial"])],
    diagnostics: [
      d("DB 장애 때 retry traffic가 원래 traffic의 수십 배가 됩니다.", "모든 연결 실패를 즉시 무한 retry하고 instances 간 jitter/admission이 없습니다.", ["attempt rate/backoff", "failure class", "pool creation concurrency", "DB accept backlog"], "retryable만 capped backoff+jitter로 제한하고 circuit/admission/warmup budget을 둡니다.", "large-fleet outage simulation과 connection-attempt SLO를 둡니다."),
      d("request는 timeout됐는데 DB connect/query가 계속 실행됩니다.", "outer deadline과 driver/pool/socket/query timeouts가 연결되지 않았거나 cancel이 best-effort입니다.", ["elapsed phases", "remaining deadline propagation", "thread/socket state", "pool metrics"], "각 단계에 남은 budget을 전달하고 timeout 뒤 resource close/cancel 결과를 readback합니다.", "blackhole/slow TLS/auth/query fault tests와 leaked-resource assertion을 둡니다."),
    ],
    expertNotes: ["SQLState class는 출발점이며 vendor driver/version의 실제 mapping을 golden integration matrix로 확인합니다.", "오류 원문은 internal restricted trace에만 두고 application/user message에는 endpoint·user·certificate detail을 노출하지 않습니다."],
  },
  {
    id: "connection-ownership-state-transaction",
    title: "Connection ownership·try-with-resources·transaction state를 명확히 합니다",
    lead: "Connection은 단순 socket handle이 아니라 transaction과 session state를 가진 AutoCloseable resource이므로 빌린 계층이 정확히 close/return해야 합니다.",
    explanations: [
      "manual DriverManager connection은 try-with-resources가 close합니다. pool connection의 close는 physical socket 종료가 아니라 logical return일 수 있지만 borrower가 반드시 호출하고 pool이 rollback/reset/validation을 수행해야 합니다.",
      "Connection을 static field/singleton으로 공유하지 않습니다. concurrent use, transaction interleaving, failure 후 invalid state와 reconnect가 섞입니다. request/unit-of-work scope와 DataSource ownership을 사용합니다.",
      "autoCommit=true이면 각 statement가 독립 transaction일 수 있습니다. 여러 DML invariant는 setAutoCommit(false)→execute→commit, 모든 failure에서 rollback과 close 순서를 명시하며 suppressed exceptions까지 보존합니다.",
      "readOnly, isolation, catalog/schema, holdability, network timeout와 client info 같은 mutable session state는 pool 반환 전 reset돼야 합니다. next borrower가 이전 tenant/schema/role를 상속하지 않게 합니다.",
      "Connection.isValid/validation query는 health hint이지 workload readiness 전체를 증명하지 않습니다. validation timeout을 짧게 두고 borrow path마다 비싼 query를 실행하지 않으며 pool의 eviction policy를 검증합니다.",
    ],
    concepts: [
      c("resource ownership", "Connection을 생성/borrow한 계층과 close/return할 책임을 명시한 계약입니다.", ["try-with-resources로 구조화합니다.", "다른 thread로 escape시키지 않습니다."]),
      c("logical close", "pool wrapper close가 physical connection을 닫지 않고 reset 후 pool에 반환하는 동작입니다.", ["application은 반드시 호출합니다.", "pool metrics로 확인합니다."]),
      c("session state leakage", "이전 borrower의 transaction/schema/role/timezone 설정이 다음 borrower에 남는 문제입니다.", ["rollback/reset이 필요합니다.", "tenant isolation 사고가 될 수 있습니다."]),
    ],
    codeExamples: [java("jdbc01-connection-owner", "try-with-resources가 정확히 한 번 close", "Jdbc01Ownership.java", "Proxy Connection의 close/isClosed state를 추적해 borrower scope 종료가 resource를 반환하는지 실행합니다.", String.raw`import java.lang.reflect.*;
import java.sql.Connection;

public class Jdbc01Ownership {
  static final class State implements InvocationHandler {
    boolean closed;
    int closeCalls;
    public Object invoke(Object proxy, Method method, Object[] args) {
      return switch (method.getName()) {
        case "close" -> { closeCalls++; closed = true; yield null; }
        case "isClosed" -> closed;
        case "getAutoCommit" -> true;
        case "toString" -> "SyntheticConnection";
        case "isWrapperFor" -> false;
        case "unwrap" -> null;
        default -> method.getReturnType().isPrimitive() ? (method.getReturnType() == boolean.class ? false : 0) : null;
      };
    }
  }
  public static void main(String[] args) throws Exception {
    State state = new State();
    Connection connection = (Connection) Proxy.newProxyInstance(Connection.class.getClassLoader(), new Class<?>[]{Connection.class}, state);
    System.out.println("before-closed=" + connection.isClosed());
    try (connection) {
      System.out.println("inside=" + connection);
      System.out.println("auto-commit=" + connection.getAutoCommit());
    }
    System.out.println("after-closed=" + connection.isClosed());
    System.out.println("close-calls=" + state.closeCalls);
    System.out.println("owner=try-with-resources");
  }
}`, "before-closed=false\ninside=SyntheticConnection\nauto-commit=true\nafter-closed=true\nclose-calls=1\nowner=try-with-resources", ["java-connection", "java-autocloseable", "java-driver-manager"])],
    diagnostics: [
      d("pool active connections가 계속 늘고 timeout됩니다.", "Connection이 exception/early return path에서 close되지 않았습니다.", ["try-with-resources scope", "pool leak traces", "active/idle/pending", "transaction state"], "Connection/Statement/ResultSet을 lexical try-with-resources에 두고 pool leak detection을 보조 evidence로 사용합니다.", "각 failure/return path의 borrowed-returned equality test를 둡니다."),
      d("다음 요청이 이전 tenant schema에서 query합니다.", "pool 반환 시 mutable session state를 reset하지 않았습니다.", ["setSchema/catalog/role calls", "rollback/autoCommit", "pool reset hooks", "borrow readback"], "tenant/session context를 transaction-local하게 사용하고 return reset+borrow assertion을 적용합니다.", "tenant A→B same physical connection negative test를 둡니다."),
    ],
    expertNotes: ["Connection을 반환하는 API는 ownership을 애매하게 만들기 쉬우므로 callback/unit-of-work 또는 명시적 close contract를 사용합니다.", "close 중 SQLException은 primary failure의 suppressed chain을 포함해 관측하되 credential/URL을 로그하지 않습니다."],
  },
  {
    id: "datasource-pool-health-capacity",
    title: "DataSource·pool을 connection factory와 제한된 capacity로 운영합니다",
    lead: "DriverManager는 학습과 단순 도구에 유용하지만 production은 DataSource/pool이 configuration, lifecycle, reuse와 metrics를 관리하는 것이 일반적입니다.",
    explanations: [
      "DataSource는 getConnection factory이며 vendor/connection pool/JNDI implementation을 감출 수 있습니다. application은 interface에 의존하고 configuration/secret/TLS properties는 bootstrap에서 검증합니다.",
      "pool size는 thread 수가 아니라 DB capacity, query service time, transaction length와 replicas를 기반으로 정합니다. 너무 큰 pool은 DB concurrency/locks를 악화시키고 너무 작으면 queue deadline을 넘깁니다.",
      "minimum idle warmup은 startup stampede를 만들 수 있습니다. instance rollout rate와 DB max connections/reserved admin capacity를 고려하고 per-service budget을 합산합니다.",
      "maxLifetime/idleTimeout/keepalive/validation은 server/network timeouts보다 안전하게 정렬합니다. 죽은 connections를 borrow 전에 제거하되 health query storm을 피합니다.",
      "readiness는 pool object 존재가 아니라 최소 connection/validation과 required schema/permissions를 확인하지만, DB 일시 장애 때 모든 instances를 동시에 restart시키는 정책은 피합니다. liveness와 dependency readiness를 구분합니다.",
    ],
    concepts: [
      c("DataSource", "connection details를 캡슐화해 Connection을 제공하는 표준 JDBC factory interface입니다.", ["DriverManager 대안입니다.", "pool/JNDI 구현을 가질 수 있습니다."]),
      c("pool capacity", "동시에 빌려 줄 수 있는 logical connections와 대기 queue/deadline의 제한입니다.", ["DB capacity에 맞춥니다.", "backpressure를 제공합니다."]),
      c("validation", "borrow/create된 connection이 짧은 시간 안에 사용 가능한지 확인하는 검사입니다.", ["isValid/query를 사용할 수 있습니다.", "업무 전체 health를 대체하지 않습니다."]),
    ],
    diagnostics: [
      d("서비스 replicas를 늘렸더니 DB max connections를 초과합니다.", "instance별 pool max만 보고 fleet 합계/reserved capacity를 계산하지 않았습니다.", ["replicas*pool max", "DB max/reserved", "workload concurrency", "rollout overlap"], "global connection budget을 service/instance에 배분하고 autoscaling/rolling surge에 맞춰 admission합니다.", "capacity equation과 max-replica load test를 release checklist에 둡니다."),
      d("DB 잠깐 지연에 readiness가 모두 실패해 restart loop가 납니다.", "dependency degradation을 process liveness와 동일하게 처리했습니다.", ["probe definitions", "failure window/threshold", "pool/backoff", "orchestrator actions"], "liveness는 process, readiness는 bounded dependency/traffic ability로 분리하고 retry storm을 막습니다.", "DB outage/slow recovery chaos test와 staged readiness를 둡니다."),
    ],
    expertNotes: ["pool은 connection 생성 비용을 줄이지만 transaction/query concurrency를 무한하게 만들지 않습니다.", "pool metrics에는 endpoint alias와 service만 두고 raw URL/user를 tag로 사용하지 않습니다."],
  },
  {
    id: "observability-redaction-supply-chain",
    title: "연결을 version·stage·latency로 관측하고 URL·credential을 redaction합니다",
    lead: "연결 문제를 진단하려면 증거가 필요하지만 raw URL/Properties/SQLException을 남기면 바로 secret과 infrastructure 정보가 유출될 수 있습니다.",
    explanations: [
      "connection metrics에는 logical endpoint id, driver/JDK version, pool, attempt stage/outcome, elapsed DNS/connect/TLS/auth/borrow, retry count와 safe SQLState class를 둡니다. password/token/cert private path와 raw URL은 제외합니다.",
      "DriverManager/driver logging은 개발에서 도움이 될 수 있지만 global writer와 verbose protocol logs가 secrets를 포함할 수 있습니다. 제한된 환경/기간/access로 활성화하고 capture 전후 redaction/삭제를 운영합니다.",
      "SBOM/dependency lock에는 JDBC driver coordinates/version/hash/license와 vulnerability status를 포함합니다. upgrade는 JDK support, URL/property defaults, TLS algorithms, type mappings와 failover behavior를 integration matrix에서 검증합니다.",
      "connection success rate만 보지 않고 pool pending/timeout, creation rate, auth reject, certificate expiry, lifetime eviction, transaction reset failures와 leak detection을 함께 봅니다.",
      "incident packet에는 first/last occurrence, affected endpoint alias/versions, failure stage, safe native codes, config change and rollback evidence를 넣고 credential rotation 필요성을 판단합니다.",
    ],
    concepts: [
      c("safe connection telemetry", "연결 stage·latency·version·outcome을 secret 없이 구조화한 metrics/traces입니다.", ["endpoint alias를 사용합니다.", "SQLState class를 제한적으로 포함합니다."]),
      c("driver supply chain", "JDBC driver artifact의 origin·version·hash·license·vulnerability와 update lifecycle입니다.", ["SBOM에 포함합니다.", "upgrade conformance를 실행합니다."]),
      c("diagnostic escalation", "기본 safe telemetry에서 제한된 verbose capture로 승인·시간 제한해 확장하는 절차입니다.", ["redaction/access/삭제를 둡니다.", "global debug를 상시 켜지 않습니다."]),
    ],
    diagnostics: [
      d("연결 장애 log에 URL과 password property가 보입니다.", "raw config/exception/Properties를 문자열로 기록했습니다.", ["logging statements", "driver debug", "exception messages", "trace attributes"], "safe structured fields allow-list를 적용하고 노출 credential을 rotate한 뒤 logs/backups retention을 처리합니다.", "synthetic secret canary와 CI/log pipeline scanner를 둡니다."),
      d("driver upgrade 뒤 TLS/auth failure가 늘었지만 version correlation이 없습니다.", "runtime driver artifact/version과 effective property defaults를 관측하지 않았습니다.", ["SBOM/runtime class version", "TLS mode/protocol", "failure by version", "rollback artifact"], "driver/JDK/server version과 safe property policy hash를 telemetry에 연결하고 canary rollback합니다.", "version-stratified canary/error budget과 compatibility suite를 둡니다."),
    ],
    expertNotes: ["redaction은 사후 regex 하나가 아니라 configuration/exception/telemetry schema의 기본 정책입니다.", "driver version은 binary behavior의 일부이므로 source code 변경이 없어도 release로 취급합니다."],
  },
  {
    id: "connection-testing-portability-runbook",
    title: "JDK-only harness에서 실제 driver/TLS/failure matrix까지 검증을 계층화합니다",
    lead: "fake Driver는 selection/ownership을 빠르게 가르치지만 실제 vendor URL·TLS·timeout·auth·session semantics를 증명하지 못합니다.",
    explanations: [
      "JDK-only unit harness는 URL/property validation, Driver acceptsURL selection, close ownership와 SQLException classification을 외부 인프라 없이 deterministic하게 검증합니다.",
      "artifact test는 packaged application의 service provider/classpath/module discovery와 no-duplicate driver를 확인합니다. source tree/IDE classpath만 테스트하지 않습니다.",
      "integration matrix는 supported JDK×driver×server versions에서 correct connection, wrong URL, unreachable host, blackhole, unknown CA, hostname mismatch, wrong/expired credential, privilege/schema mismatch와 pool reset을 실행합니다.",
      "timeout tests는 wall-clock 허용 범위와 resource cleanup을 검증하되 flaky public network를 사용하지 않고 controlled fault proxy/DNS/test server를 씁니다. elapsed evidence와 cancellation aftermath를 기록합니다.",
      "runbook은 detect stage→safe config/version check→capacity/fleet retry control→certificate/credential rotation→canary→rollback→post-incident secret/log review 순서입니다.",
    ],
    concepts: [
      c("JDK-only harness", "외부 driver/DB 없이 java.sql interfaces와 synthetic providers로 작은 계약을 실행하는 test입니다.", ["빠르고 deterministic합니다.", "protocol/TLS 증거는 아닙니다."]),
      c("connection conformance matrix", "JDK/driver/server/config/failure 조합별 expected stage·code·timeout·state 결과입니다.", ["upgrade마다 실행합니다.", "approved differences를 기록합니다."]),
      c("controlled fault", "test DNS/proxy/certificate/account로 특정 연결 단계를 재현 가능하게 실패시키는 환경입니다.", ["public outage에 의존하지 않습니다.", "cleanup을 자동화합니다."]),
    ],
    diagnostics: [
      d("unit tests는 통과하지만 production driver만 연결 실패합니다.", "synthetic Driver가 vendor classpath/URL/TLS/auth semantics를 포함하지 않았습니다.", ["packaged artifact", "runtime drivers", "vendor integration matrix", "effective safe config"], "실제 driver/server controlled integration tests를 release gate로 추가합니다.", "JDK-only와 real-driver 증거의 scope를 문서화합니다."),
      d("connection incident runbook이 password를 채팅/log에 붙여 넣게 합니다.", "safe verification/rotation 절차와 credential handling channel이 없습니다.", ["runbook commands", "support artifacts", "secret manager audit", "logs/chat tickets"], "credential 값 없이 version/lease/test identity를 확인하고 승인된 rotation workflow를 사용합니다.", "tabletop drill과 canary secret leak scan을 둡니다."),
    ],
    expertNotes: ["각 test double의 증명 범위와 미증명 범위를 결과 옆에 명시합니다.", "connection readiness는 one-shot CI뿐 아니라 certificate/credential/driver lifecycle 전체에 반복됩니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-jdbc-basic", repository: "SPRING/SpringBasic", path: "src/test/java/com/simple/basic/JDBCBasic.java", usedFor: ["Class.forName, DriverManager, JDBC URL, credential and Connection learning progression"], evidence: "read-only로 24 logical lines를 확인했으며 literal URL/host/service/user/password는 복사하지 않았습니다." },
  { id: "local-jdbc-anonymous", repository: "SPRING/SpringBasic", path: "src/test/java/com/simple/basic/JDBCANONYMOUS.java", usedFor: ["one-shot interface implementation and anonymous-class provenance for synthetic test doubles"], evidence: "read-only로 27 logical lines를 확인했으며 출력/sample literal은 복사하지 않았습니다." },
  { id: "java-driver", repository: "Java SE 21 API", path: "java.sql.Driver", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Driver.html", usedFor: ["URL acceptance, connect and registration contract"], evidence: "Oracle JDK 공식 Driver API입니다." },
  { id: "java-driver-manager", repository: "Java SE 21 API", path: "java.sql.DriverManager", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/DriverManager.html", usedFor: ["service discovery, driver selection, connection and login timeout"], evidence: "Oracle JDK 공식 DriverManager API입니다." },
  { id: "java-connection", repository: "Java SE 21 API", path: "java.sql.Connection", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html", usedFor: ["session, transaction, state, validation and close"], evidence: "Oracle JDK 공식 Connection API입니다." },
  { id: "java-datasource", repository: "Java SE 21 API", path: "javax.sql.DataSource", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/javax/sql/DataSource.html", usedFor: ["preferred connection factory and login timeout"], evidence: "Oracle JDK 공식 DataSource API입니다." },
  { id: "java-service-loader", repository: "Java SE 21 API", path: "java.util.ServiceLoader", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ServiceLoader.html", usedFor: ["provider discovery and class/module loader boundary"], evidence: "Oracle JDK 공식 ServiceLoader API입니다." },
  { id: "java-properties", repository: "Java SE 21 API", path: "java.util.Properties", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Properties.html", usedFor: ["connection property transport and string-map caveats"], evidence: "Oracle JDK 공식 Properties API입니다." },
  { id: "java-autocloseable", repository: "Java SE 21 API", path: "java.lang.AutoCloseable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AutoCloseable.html", usedFor: ["try-with-resources ownership"], evidence: "Oracle JDK 공식 AutoCloseable API입니다." },
  { id: "java-jdbc-tutorial", repository: "Java Tutorials", path: "Establishing a Connection", publicUrl: "https://docs.oracle.com/javase/tutorial/jdbc/basics/connecting.html", usedFor: ["connection learning progression and DataSource context"], evidence: "Oracle 공식 JDBC tutorial입니다." },
  { id: "mysql-url", repository: "MySQL Connector/J Developer Guide", path: "Connection URL Syntax", publicUrl: "https://dev.mysql.com/doc/connector-j/en/connector-j-reference-jdbc-url-format.html", usedFor: ["MySQL URL and host routing grammar"], evidence: "MySQL 공식 Connector/J URL 문서입니다." },
  { id: "mysql-properties", repository: "MySQL Connector/J Developer Guide", path: "Configuration Properties", publicUrl: "https://dev.mysql.com/doc/connector-j/en/connector-j-reference-configuration-properties.html", usedFor: ["TLS, timeout, failover and property version matrix"], evidence: "MySQL 공식 Connector/J property 문서입니다." },
  { id: "oracle-url", repository: "Oracle Database 26ai JDBC Developer's Guide", path: "Data Sources and URLs", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/jjdbc/data-sources-and-URLs.html", usedFor: ["Oracle Thin URL, DataSource and connection properties"], evidence: "Oracle 공식 JDBC URL/DataSource 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "jdbc-01-driver-connection", slug: "jdbc-01-driver-connection", courseId: "spring", moduleId: "jdbc-foundations", order: 1,
  title: "JDBC 드라이버·URL·Connection 수립 과정", subtitle: "getConnection 한 줄을 driver discovery·URL/property·TLS·network·auth·session·ownership·pool·관측까지 설명 가능한 연결 pipeline으로 확장합니다.", level: "기초", estimatedMinutes: 900,
  coreQuestion: "JDBC Connection이 어떤 driver와 endpoint/security/session 계약으로 만들어졌는지 증명하고, 실패 단계·timeout·ownership을 secret 노출 없이 진단하려면 무엇을 확인해야 할까요?",
  summary: "SpringBasic의 JDBCBasic.java와 JDBCANONYMOUS.java를 read-only로 감사해 Class.forName→DriverManager→Connection과 one-shot interface implementation 흐름을 provenance로 사용합니다. connection pipeline, Driver service discovery/classpath/module, vendor URL grammar/routing, typed Properties/secret injection, TLS server identity, DNS/connect/login/read/query timeout taxonomy, Connection ownership/transaction/session reset, DataSource/pool health/capacity, redacted telemetry/driver supply chain과 JDK-only→actual-driver conformance/runbook까지 초급에서 운영 전문가로 연결합니다. 다섯 JDK 21 examples는 synthetic Driver selection, URL redaction, property policy, SQLException classification과 Connection close ownership을 실제 java.sql API로 실행합니다.",
  objectives: ["driver artifact/discovery와 DriverManager URL selection을 설명한다.", "vendor JDBC URL과 property schema를 안전하게 구성·redaction한다.", "credential injection과 TLS server identity/rotation을 설계한다.", "DNS/connect/TLS/auth/read/query timeout과 retryability를 분류한다.", "Connection transaction/session state와 close ownership을 검증한다.", "DataSource/pool capacity, validation와 reset을 운영한다.", "driver/JDK/server conformance, safe telemetry, supply chain과 runbook을 유지한다."],
  prerequisites: [],
  keywords: ["JDBC Driver", "DriverManager", "ServiceLoader", "classpath", "JDBC URL", "Properties", "TLS", "hostname verification", "timeout", "Connection", "DataSource", "pool", "try-with-resources", "SQLState", "redaction"], topics,
  lab: {
    title: "JDBC connection bootstrap을 secret-safe하고 장애 진단 가능한 pipeline으로 만들기",
    scenario: "개발 IDE에서는 연결되지만 배포 artifact는 driver를 못 찾고, 환경별 URL/TLS/timeout과 credential rotation이 달라 startup/pool 장애가 발생합니다.",
    setup: ["원본 파일은 read-only provenance로만 사용하고 synthetic URLs/properties/test identities만 준비합니다.", "JDK 21 JDK-only harness와 격리 MySQL/Oracle driver/server matrix를 준비합니다.", "driver artifact→URL→network/TLS→auth→session→pool stages와 expected safe errors를 작성합니다.", "wrong driver/URL/DNS/blackhole/CA/hostname/credential/schema/reset/close fixtures를 고정합니다."],
    steps: ["packaged artifact의 driver classes/service providers/version/hash를 readback합니다.", "vendor URL을 typed schema로 parse하고 prohibited/duplicate properties와 raw secret을 거부합니다.", "secret manager identity/lease를 Properties/DataSource로 주입하고 safe view를 확인합니다.", "trusted/unknown CA/hostname mismatch와 certificate rotation ordering을 실행합니다.", "DNS/connect/TLS/login/socket/query/pool deadlines와 elapsed resource cleanup을 측정합니다.", "effective user/catalog/schema/autoCommit/isolation/readOnly/timezone를 connection에서 readback합니다.", "try-with-resources와 pool wrapper close에서 borrowed/returned/reset parity를 검증합니다.", "fleet pool budget, warmup, readiness/liveness와 DB outage retry storm을 부하 테스트합니다.", "SQLState/vendor causes를 safe stage/retry category로 map하고 secret canary log scan을 실행합니다.", "JDK/driver/server upgrade canary, credential/cert rotation와 rollback runbook을 rehearsal합니다."],
    expectedResult: ["정확한 driver와 allowed endpoint가 선택되고 secret/TLS/session postconditions를 만족합니다.", "각 controlled failure가 expected stage·retryability·deadline과 cleanup으로 종료합니다.", "Connection/pool ownership에서 leak·open transaction·tenant session state가 남지 않습니다.", "fleet connection budget과 outage recovery가 DB capacity/error budget을 만족합니다.", "logs/traces/artifacts에 raw URL/credential/certificate private data가 없습니다."],
    cleanup: ["격리 driver/server/proxy/DNS/certificate/test accounts와 pool resources를 제거합니다.", "temporary credentials/trust/key stores와 traces를 revoke·삭제합니다.", "logs/artifacts에 원본 URL/host/service/user/password 또는 synthetic canary 값이 없는지 검사합니다.", "원본 JDBCBasic.java/JDBCANONYMOUS.java와 production data는 변경하지 않습니다."],
    extensions: ["cloud IAM/token authentication과 pool credential refresh를 구현합니다.", "multi-host failover/load-balancing URL의 consistency/routing을 검증합니다.", "OpenTelemetry DB connection semantic fields의 safe allow-list를 설계합니다.", "container redeploy/classloader driver leak과 native-image service discovery를 비교합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 driver→URL→property→error→close evidence를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "acceptsURL과 selected driver를 설명합니다.", "URL property values가 redaction됐는지 확인합니다.", "typed timeout/property policy를 추적합니다.", "SQLState stage/retry classification을 구분합니다.", "Connection close가 한 번 호출되는지 확인합니다."], hints: ["네트워크 전에 driver와 configuration 단계가 먼저 성공해야 합니다."], expectedOutcome: "getConnection을 단계·소유권·보안 계약으로 설명합니다.", solutionOutline: ["discover→validate→secure→connect→readback→close 순서입니다."] },
    { difficulty: "응용", prompt: "원본 JDBCBasic 흐름을 production-ready DataSource bootstrap으로 재설계하세요.", requirements: ["원본 credential/host 비복사 provenance를 기록합니다.", "automatic driver discovery artifact test를 둡니다.", "typed URL/property/secret schema를 적용합니다.", "TLS identity와 timeout hierarchy를 검증합니다.", "session readback/reset과 try-with-resources를 적용합니다.", "pool fleet capacity/readiness를 측정합니다.", "safe SQLState telemetry/secret scan을 둡니다.", "driver/cert/credential upgrade/rollback을 rehearsal합니다."], hints: ["Class.forName 제거 여부보다 runtime artifact에 provider가 있다는 증거가 중요합니다."], expectedOutcome: "보안·capacity·진단·rotation이 검증된 connection layer가 완성됩니다.", solutionOutline: ["audit→artifact/config→fault matrix→pool/session→observe→rotate 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 JDBC connection governance 표준을 작성하세요.", requirements: ["supported JDK/driver/server/SBOM matrix를 정의합니다.", "URL/property/secret/TLS policy를 둡니다.", "timeout/retry/circuit/admission hierarchy를 정의합니다.", "Connection/transaction/session/pool ownership을 둡니다.", "capacity/warmup/readiness/liveness budgets를 정의합니다.", "safe error/redaction/telemetry fields를 지정합니다.", "artifact/integration/fault/rotation tests를 요구합니다.", "incident/rollback/secret review runbook을 포함합니다."], hints: ["Connection 성공은 올바른 schema·role·session이라는 증거가 아닙니다."], expectedOutcome: "초급 DriverManager부터 운영 connection platform까지 일관된 governance가 완성됩니다.", solutionOutline: ["inventory→constrain→authenticate→verify→bound→observe→rotate→recover 순서입니다."] },
  ],
  nextSessions: ["jdbc-02-statement-prepared-sql-injection"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["JDBCBasic.java 24 lines, 682 bytes, active 19 lines를 read-only로 확인했습니다. SHA-256은 6BEA81F383C7923141038BCB314C9409840616EB72AF7D662B425961CCDE43E3입니다.", "JDBCANONYMOUS.java 27 lines, 604 bytes, active 23 lines를 read-only로 확인했습니다. SHA-256은 044A2EE4248A703C4BD0CCE73B37CE54AAE96FCD817253B1FDF8AFC33F6D6B53입니다.", "원본 literal URL/host/port/service/user/password와 sample output은 복사하지 않고 API progression과 anonymous-interface 구조만 provenance로 사용했습니다.", "JDK-only synthetic examples는 실제 Oracle/MySQL driver discovery, URL/TLS/network/auth/pool/session behavior를 대체하지 않습니다."] },
});

export default session;
