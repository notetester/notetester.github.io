import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function javaExample(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return { id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-8", explanation: "JDK 21 표준 API만으로 synthetic AutoCloseable·SQLException fixture를 준비해 실제 DB·host·credential 없이 failure semantics를 재현합니다." },
      { lines: "9-끝에서 5줄 전", explanation: "try-with-resources, suppressed exception, SQLException chain·SQLState, batch counts 또는 timeout path를 실행합니다." },
      { lines: "마지막 5줄", explanation: "close order·stable classification·bounded metadata만 출력하며 raw SQL·message·parameter는 출력하지 않습니다." },
    ],
    run: { environment: ["JDK 21", "외부 library·DB·network·credential 불필요"], command: `javac --release 21 ${filename} && java ${filename.replace(/\.java$/, "")}` },
    output: { value: output, explanation: ["stdout은 문서와 완전히 같아야 합니다.", "synthetic JDK harness는 JDBC driver의 network cancellation·vendor code·pool proxy close를 실제 engine에서 검증하는 integration test를 대체하지 않습니다."] },
    experiments: [
      { change: "body와 ResultSet·Statement·Connection close가 동시에 서로 다른 예외를 던지게 합니다.", prediction: "body 예외가 primary이고 역순 close 예외들은 suppressed 배열에 보존됩니다.", result: "primary만 로그하고 suppressed를 버리지 말되 사용자 응답에는 내부 message를 노출하지 않습니다." },
      { change: "SQLState class를 08·23·40 또는 timeout으로 바꾸고 nextException을 추가합니다.", prediction: "분류와 retry 판단은 message 문자열이 아니라 전체 chain의 structured fields에 따라 달라집니다.", result: "driver/engine matrix에서 retryable codes와 transaction outcome을 별도로 검증합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "jdbc-resource-ownership-stack",
    title: "Connection→Statement→ResultSet의 소유권과 의존 순서를 먼저 그립니다",
    lead: "JDBC resource는 garbage collection 대상인 Java 객체이면서 동시에 socket·server cursor·transaction·pool lease를 소유하므로 명시적으로 닫아야 합니다.",
    explanations: [
      "일반적인 dependency는 Connection이 Statement를 만들고 Statement가 ResultSet을 만듭니다. 가장 안쪽 ResultSet부터 Statement, Connection 순으로 닫아야 child가 parent를 필요로 하는 동안 parent가 먼저 사라지지 않습니다.",
      "Connection.close는 DriverManager 연결에서는 물리 연결 종료일 수 있지만 pool proxy에서는 lease 반환입니다. 둘 다 caller가 소유권을 얻었다면 close해야 하며 구현 차이를 이유로 생략하지 않습니다.",
      "Statement를 닫으면 current ResultSet도 닫힐 수 있고 Connection close가 children을 정리할 수 있지만 transitive cleanup을 정상 경로 계약으로 의존하지 않습니다. 각 resource를 선언 위치에서 소유·해제합니다.",
      "streaming/large ResultSet은 server cursor·network buffer와 transaction snapshot을 오래 보유합니다. row mapping을 끝낸 뒤 즉시 scope를 닫고 UI rendering·remote call로 넘기지 않습니다.",
      "로컬 JDBCBasic.java는 24 logical lines에서 getConnection1·일반 try1/catch1이 있지만 try-with-resources0·close0·SQLException typed catch0입니다. 연결 성공 실습을 비난하지 않고 다음 단계의 ownership gap으로 사용합니다.",
    ],
    concepts: [
      c("resource owner", "JDBC resource를 획득해 사용 범위를 정하고 반드시 close할 책임이 있는 code boundary입니다.", ["소유권 이전을 명시합니다.", "한 resource에 한 owner를 둡니다."]),
      c("dependency close order", "child resource를 parent보다 먼저 역순으로 해제하는 규칙입니다.", ["ResultSet→Statement→Connection입니다.", "try 선언 역순과 연결됩니다."]),
      c("pool lease", "물리 connection을 독점하는 논리 proxy handle의 대여 기간입니다.", ["close는 반환입니다.", "transaction state reset도 검증합니다."]),
    ],
    codeExamples: [javaExample("jdbc04-close-order", "try-with-resources의 역순 close", "Jdbc04CloseOrder.java", "세 nested resources가 body 뒤 ResultSet→Statement→Connection 순으로 닫히는지 JDK 21로 검증합니다.", String.raw`public class Jdbc04CloseOrder {
    static final class TracedResource implements AutoCloseable {
        private final String name;
        TracedResource(String name) { this.name = name; }
        @Override public void close() { System.out.println("close=" + name); }
    }
    public static void main(String[] args) {
        try (TracedResource connection = new TracedResource("connection");
             TracedResource statement = new TracedResource("statement");
             TracedResource resultSet = new TracedResource("result-set")) {
            System.out.println("body=read-row");
        }
        System.out.println("released=true");
    }
}`, "body=read-row\nclose=result-set\nclose=statement\nclose=connection\nreleased=true", ["local-jdbc-basic", "local-jdbc-anonymous", "jdk-autocloseable", "jls-try-resources", "jdk-connection", "jdk-statement", "jdk-resultset"])],
    diagnostics: [d("부하 후 DB session/cursor 수가 계속 증가합니다.", "Connection만 닫거나 success path에서만 닫고 ResultSet/Statement owner가 불명확합니다.", ["resource acquisition/close paths", "active server sessions/cursors", "pool active/idle", "exception/return/cancel branches"], "각 acquisition을 같은 lexical scope의 try-with-resources header에 두고 dependency 역순 자동 close를 사용합니다.", "success/body-failure/close-failure/early-return에서 active resources가 baseline으로 돌아오는 test를 둡니다.")],
    expertNotes: ["close 호출은 '필요하면 하는 cleanup'이 아니라 소유권 계약의 종료입니다.", "ResultSet을 method 밖으로 반환하면 Statement/Connection owner도 함께 새 abstraction으로 이전해야 하므로 보통 DTO로 materialize합니다."],
  },
  {
    id: "try-with-resources-acquisition-close",
    title: "try-with-resources의 획득·body·역순 close·초기화 실패 규칙을 적용합니다",
    lead: "문법을 괄호가 있는 try로만 외우지 말고 어떤 resource까지 성공적으로 생성됐고 어느 순서로 close되는지 이해해야 합니다.",
    explanations: [
      "try header의 resources는 왼쪽에서 오른쪽으로 초기화되고 body 뒤 오른쪽에서 왼쪽으로 닫힙니다. ResultSet까지 header에 선언하면 모든 return/throw path가 같은 cleanup을 거칩니다.",
      "두 번째 resource 초기화가 실패하면 이미 성공한 첫 resource는 자동 close되고 아직 생성되지 않은 뒤 resources는 닫지 않습니다. connection 획득 뒤 prepareStatement 실패도 leak 없이 종료되어야 합니다.",
      "Java 9 이후 effectively final local variable을 try header에서 재사용할 수 있지만 ownership이 흐려지지 않게 acquisition과 scope를 가깝게 둡니다. field/shared connection을 method가 임의 close하지 않습니다.",
      "close는 여러 번 호출될 가능성에 대비해 driver contract를 따르되 application에서 double-owner/double-close 구조를 만들지 않습니다. wrapper/proxy가 close를 intercept하는지도 확인합니다.",
      "try-with-resources는 commit/rollback을 자동 결정하지 않습니다. manual transaction에서는 catch에서 rollback하고 close 전에 transaction outcome을 확정하며 pool 반환 state를 검증합니다.",
    ],
    concepts: [
      c("resource specification", "try header에 선언해 compiler가 정상·비정상 종료 모두에 close를 생성하는 resources 목록입니다.", ["초기화는 정방향입니다.", "close는 역방향입니다."]),
      c("partial acquisition", "여러 resource 중 일부만 생성된 뒤 다음 초기화가 실패한 상태입니다.", ["성공한 resources만 닫힙니다.", "acquisition failure test가 필요합니다."]),
      c("lexical lifetime", "resource 사용 가능 범위를 source block으로 제한해 owner와 종료를 보이게 하는 방식입니다.", ["field 보관을 피합니다.", "async 전달을 금지합니다."]),
    ],
    diagnostics: [d("prepareStatement 실패 뒤 pool active count가 줄지 않습니다.", "Connection은 header 밖에서 얻고 Statement만 try-with-resources에 넣어 partial acquisition path에서 반환하지 못했습니다.", ["각 resource 선언 위치", "failure point", "suppressed/primary exception", "pool active trace"], "Connection부터 dependent resources까지 하나의 try header 또는 명시 outer owner에 넣습니다.", "각 initializer 위치에서 failure를 주입해 앞 resources만 정확히 close되는지 검증합니다.")],
    expertNotes: ["컴파일러가 생성한 cleanup이 transaction outcome을 대신하지 않으므로 rollback/commit은 별도 책임입니다.", "한 method가 connection을 인자로 받았다면 일반적으로 caller owner이므로 callee가 close하지 않는 계약을 이름/문서로 명시합니다."],
  },
  {
    id: "suppressed-exceptions-primary-failure",
    title: "body 예외와 close 예외가 동시에 발생할 때 primary·suppressed를 보존합니다",
    lead: "cleanup 실패가 원래 업무 오류를 덮어쓰거나 사라지면 root cause와 자원 손상을 모두 놓칩니다.",
    explanations: [
      "try body가 예외를 던지고 close도 실패하면 body 예외가 primary, close 예외들은 getSuppressed 배열에 역순으로 추가됩니다. primary stack trace만 문자열로 저장하면 suppressed evidence를 잃을 수 있습니다.",
      "body가 정상이고 close만 실패하면 close 예외가 primary로 전파됩니다. commit 성공 뒤 connection close 실패처럼 outcome과 resource health를 분리해 판정해야 합니다.",
      "여러 close 실패의 suppressed 순서는 close execution order입니다. 자동 관측 도구가 cause만 수집하고 suppressed를 버리지 않는지 integration test합니다.",
      "suppressed exception에 driver message·host·SQL이 포함될 수 있습니다. secure incident log에는 structured safe fields와 restricted raw cause를 분리하고 사용자 응답은 stable code로 변환합니다.",
      "close failure connection은 pool이 broken으로 폐기해야 할 수 있습니다. application이 무시하고 재사용 가능으로 표시하지 않도록 DataSource/pool health behavior를 검증합니다.",
    ],
    concepts: [
      c("primary exception", "try-with-resources 전체에서 caller에게 직접 throw되는 대표 실패입니다.", ["body 실패가 먼저면 보존됩니다.", "close-only 실패일 수 있습니다."]),
      c("suppressed exception", "primary를 덮지 않으면서 cleanup 과정의 추가 실패를 보존한 Throwable입니다.", ["getSuppressed로 읽습니다.", "cause chain과 다릅니다."]),
      c("close failure", "resource 해제가 완전히 성공하지 않아 connection/socket/cursor 상태가 불확실한 오류입니다.", ["outcome과 구분합니다.", "pool 폐기 여부를 확인합니다."]),
    ],
    codeExamples: [javaExample("jdbc04-suppressed", "body와 두 close 예외의 보존 순서", "Jdbc04Suppressed.java", "primary body failure와 역순 close-b/close-a가 suppressed에 남는지 정확히 출력합니다.", String.raw`public class Jdbc04Suppressed {
    static final class FailingResource implements AutoCloseable {
        private final String name;
        FailingResource(String name) { this.name = name; }
        @Override public void close() throws Exception {
            throw new Exception("close-" + name);
        }
    }
    public static void main(String[] args) {
        try (FailingResource a = new FailingResource("a");
             FailingResource b = new FailingResource("b")) {
            throw new Exception("body-failure");
        } catch (Exception error) {
            System.out.println("primary=" + error.getMessage());
            System.out.println("suppressed-count=" + error.getSuppressed().length);
            for (Throwable suppressed : error.getSuppressed()) {
                System.out.println("suppressed=" + suppressed.getMessage());
            }
        }
    }
}`, "primary=body-failure\nsuppressed-count=2\nsuppressed=close-b\nsuppressed=close-a", ["jdk-autocloseable", "jls-try-resources", "jdk-throwable"] )],
    diagnostics: [d("로그에는 close 오류만 있고 실제 query 실패가 사라집니다.", "finally close가 원래 exception을 덮었거나 logger가 suppressed를 수집하지 않습니다.", ["try-with-resources 사용 여부", "primary/cause/suppressed tree", "logger/APM throwable capture", "pool eviction result"], "try-with-resources로 primary를 보존하고 safe structured exception tree를 기록합니다.", "body+close 동시 failure fixture를 logging pipeline end-to-end에 둡니다.")],
    expertNotes: ["suppressed는 causal chain이 아니라 같은 scope cleanup 중 추가 실패입니다.", "close 실패를 경고만 하고 같은 physical connection을 healthy로 재사용하는지 pool/driver integration에서 확인합니다."],
  },
  {
    id: "sqlexception-chain-structured-fields",
    title: "SQLException의 message 대신 SQLState·vendor code·nextException chain을 읽습니다",
    lead: "SQLException은 한 오류만 담는 RuntimeException이 아니라 표준 상태·vendor code와 추가 database errors를 연결할 수 있는 checked exception입니다.",
    explanations: [
      "getSQLState는 표준 또는 vendor mapping state, getErrorCode는 vendor integer, getMessage는 사람이 읽는 진단 text입니다. control flow를 locale/version-dependent message substring에 의존하지 않습니다.",
      "getNextException chain은 batch, server diagnostics 또는 driver가 제공한 추가 SQLExceptions를 보존합니다. cause와 nextException은 다른 축이므로 둘 다 bounded cycle-safe하게 순회합니다.",
      "SQLState 앞 두 characters는 class로 connection(08), integrity(23), transaction rollback(40) 같은 범주를 나타낼 수 있지만 실제 retry는 engine code와 transaction outcome까지 봐야 합니다.",
      "driver가 SQLState null/nonstandard를 줄 수 있고 같은 state라도 constraint name/operation에 따라 domain mapping이 다릅니다. 지원 driver/version error catalog를 test fixture로 유지합니다.",
      "repository는 SQLException을 그대로 controller에 던지기보다 retryable/constraint/not-found 같은 안정된 data-access/domain exception으로 translate하되 원본 structured metadata를 secure cause에 보존합니다.",
    ],
    concepts: [
      c("SQLState", "SQL/JDBC error condition을 문자 code로 분류하는 structured field입니다.", ["class prefix를 볼 수 있습니다.", "driver mapping을 검증합니다."]),
      c("vendor error code", "DBMS/driver가 제공하는 vendor-specific integer 진단 code입니다.", ["engine/version과 함께 해석합니다.", "message parsing을 대체합니다."]),
      c("nextException chain", "한 database operation에서 이어진 추가 SQLExceptions를 연결하는 JDBC 전용 chain입니다.", ["cause와 별개입니다.", "전체를 안전하게 순회합니다."]),
    ],
    codeExamples: [javaExample("jdbc04-sql-chain", "SQLState class와 nextException 순회", "Jdbc04SqlChain.java", "integrity와 rollback 상태 두 개를 message 없이 분류해 retry 판단을 출력합니다.", String.raw`import java.sql.SQLException;
import java.sql.SQLTransientException;

public class Jdbc04SqlChain {
    static String category(String state) {
        if (state == null || state.length() < 2) return "unknown";
        return switch (state.substring(0, 2)) {
            case "08" -> "connection";
            case "23" -> "integrity";
            case "40" -> "rollback";
            default -> "other";
        };
    }
    public static void main(String[] args) {
        SQLException root = new SQLException("internal-detail", "23505", 1001);
        root.setNextException(new SQLTransientException("internal-detail", "40001", 2002));
        int index = 0;
        for (SQLException current = root; current != null; current = current.getNextException()) {
            String category = category(current.getSQLState());
            boolean retry = "rollback".equals(category);
            System.out.printf("%d:state=%s:vendor=%d:class=%s:retry=%s%n",
                    index++, current.getSQLState(), current.getErrorCode(), category, retry);
        }
        System.out.println("chain=" + index);
    }
}`, "0:state=23505:vendor=1001:class=integrity:retry=false\n1:state=40001:vendor=2002:class=rollback:retry=true\nchain=2", ["jdk-sqlexception", "mysql-sqlstates", "postgres-error-codes", "oracle-jdbc-errors"])],
    diagnostics: [d("DB locale/driver upgrade 뒤 retry 분류가 작동하지 않습니다.", "예외 message의 특정 문구를 contains로 검사했습니다.", ["exception concrete type", "SQLState/vendor code", "nextException chain", "old/new driver error matrix"], "structured fields와 지원 engine code allowlist로 translate하고 unknown은 안전한 non-retry/default로 처리합니다.", "driver/DB upgrade gate에 constraint/deadlock/timeout/connection-loss error fixtures를 둡니다.")],
    expertNotes: ["SQLState 40 class가 모두 blind retry-safe라는 뜻은 아니며 transaction idempotency와 vendor semantics가 필요합니다.", "chain 순회에는 비정상 driver cycle/과대 diagnostics를 대비한 maximum depth를 둘 수 있습니다."],
  },
  {
    id: "exception-translation-retry-boundary",
    title: "transient·recoverable·non-transient을 transaction outcome과 idempotency로 번역합니다",
    lead: "retryable exception type을 찾는 것만으로는 안전한 재실행이 되지 않으며 실패 시점과 commit 여부가 핵심입니다.",
    explanations: [
      "SQLTransientException은 같은 operation이 나중에 성공할 가능성을 표현하지만 즉시/무제한 retry 지시가 아닙니다. bounded backoff, total deadline과 overload control이 필요합니다.",
      "SQLRecoverableException은 connection/session을 다시 만들면 recovery 가능할 수 있지만 이전 transaction이 commit됐는지는 별도입니다. connection loss at COMMIT은 outcome unknown으로 조회합니다.",
      "SQLNonTransientException도 schema migration 후에는 해결될 수 있지만 같은 request 안 retry할 문제는 아닙니다. error taxonomy는 user action, operator action과 automatic retry를 분리합니다.",
      "deadlock/serialization victim은 전체 transaction이 rollback됐음을 engine code로 확인하고 fresh connection/snapshot에서 unit 전체를 retry합니다. 마지막 statement만 반복하지 않습니다.",
      "retry 전 request/idempotency key와 outbox를 같은 transaction에 두어 duplicate business effects를 막습니다. GET-like read와 payment-like write는 같은 retry policy를 갖지 않습니다.",
    ],
    concepts: [
      c("transient classification", "시간·경쟁·일시 network 때문에 재시도 성공 가능성이 있는 failure 범주입니다.", ["bounded retry를 사용합니다.", "outcome을 먼저 판정합니다."]),
      c("recoverable connection", "새 physical connection/session이 필요할 수 있는 failure입니다.", ["old connection은 폐기합니다.", "commit unknown을 구분합니다."]),
      c("retry boundary", "fresh transaction에서 다시 실행할 idempotent business unit의 시작과 끝입니다.", ["statement 단위가 아닐 수 있습니다.", "outer retries와 budget을 합칩니다."]),
    ],
    diagnostics: [d("connection reset retry 뒤 같은 주문이 두 개 생깁니다.", "recoverable connection error를 rollback 확정으로 간주하고 idempotency key 없이 전체 요청을 재실행했습니다.", ["failure가 commit 전/중/후인지", "durable request row", "retry key/payload", "business/outbox counts"], "outcome을 unknown으로 분류해 durable key로 조회하고 same-payload canonical result만 반환합니다.", "commit acknowledgement loss와 delayed duplicate request fault tests를 둡니다.")],
    expertNotes: ["exception class hierarchy는 hint이고 automatic retry policy는 operation semantics·outcome·idempotency를 포함합니다.", "driver가 connection을 recoverable로 표시해도 pool이 해당 proxy/physical connection을 폐기하는지 검증합니다."],
  },
  {
    id: "batch-update-exception-counts",
    title: "BatchUpdateException의 update counts와 partial execution을 transaction 정책으로 해석합니다",
    lead: "batch 하나가 실패해도 앞 statements가 성공했거나 count가 SUCCESS_NO_INFO일 수 있어 exception만 보고 전체 결과를 추측하면 안 됩니다.",
    explanations: [
      "BatchUpdateException은 SQLException fields와 update counts를 제공합니다. count>=0은 해당 command의 affected rows, SUCCESS_NO_INFO는 성공했지만 count 미상, EXECUTE_FAILED는 실패를 나타냅니다.",
      "driver가 failure 뒤 processing을 중단하는지 계속하는지, large counts와 batch rewrite가 어떻게 동작하는지 지원 driver에서 확인합니다. array position은 input correlation과 함께 보존합니다.",
      "manual transaction 안 batch 실패면 business invariant에 따라 전체 rollback하는 것이 일반적입니다. autocommit batch의 partial commit은 재처리 manifest와 idempotency가 필요합니다.",
      "generated keys·trigger side effects·upsert affected rows는 command count와 일대일이 아닐 수 있습니다. canonical keys와 final table/outbox를 readback합니다.",
      "error response/log에 rejected row payload를 그대로 넣지 않습니다. source offset/correlation id, safe reason code와 counts만 남기고 sensitive payload는 제한된 quarantine에 둡니다.",
    ],
    concepts: [
      c("batch update count", "batch 각 command의 affected rows 또는 JDBC sentinel을 순서대로 담은 값입니다.", ["SUCCESS_NO_INFO를 처리합니다.", "input correlation을 유지합니다."]),
      c("partial batch", "batch commands 중 일부만 server에서 실행·성공했을 수 있는 상태입니다.", ["transaction rollback 정책을 둡니다.", "post-state를 readback합니다."]),
      c("batch correlation", "input item과 update count/error/returned key를 stable identity로 연결하는 정보입니다.", ["position 추측을 피합니다.", "retry idempotency에 사용합니다."]),
    ],
    codeExamples: [javaExample("jdbc04-batch-counts", "JDBC batch sentinel을 안정된 결과로 해석", "Jdbc04BatchCounts.java", "성공 count·unknown success·failed sentinel을 순서와 함께 분류합니다.", String.raw`import java.sql.BatchUpdateException;
import java.sql.Statement;
import java.util.Arrays;

public class Jdbc04BatchCounts {
    static String outcome(int count) {
        if (count == Statement.SUCCESS_NO_INFO) return "success-unknown";
        if (count == Statement.EXECUTE_FAILED) return "failed";
        return "rows-" + count;
    }
    public static void main(String[] args) {
        int[] counts = {1, Statement.SUCCESS_NO_INFO, Statement.EXECUTE_FAILED, 2};
        BatchUpdateException error = new BatchUpdateException(
                "internal-detail", "23000", 3001, counts);
        int[] observed = error.getUpdateCounts();
        for (int i = 0; i < observed.length; i++) {
            System.out.println("item-" + (i + 1) + "=" + outcome(observed[i]));
        }
        long knownRows = Arrays.stream(observed).filter(value -> value >= 0).asLongStream().sum();
        System.out.println("known-rows=" + knownRows);
        System.out.println("rollback-required=true");
    }
}`, "item-1=rows-1\nitem-2=success-unknown\nitem-3=failed\nitem-4=rows-2\nknown-rows=3\nrollback-required=true", ["jdk-batch-update", "jdk-statement", "jdk-sqlexception"])],
    diagnostics: [d("batch retry 뒤 일부 rows가 중복됩니다.", "partial counts를 무시하고 autocommit batch 전체를 새 keys로 재실행했습니다.", ["autocommit/transaction outcome", "update counts/sentinels", "input correlation keys", "final rows/outbox"], "가능하면 transaction 전체 rollback 후 stable keys로 retry하고, partial commit이면 canonical post-state manifest를 먼저 조회합니다.", "failure index별 batch rewrite/continue behavior와 duplicate retry integration test를 둡니다.")],
    expertNotes: ["SUCCESS_NO_INFO는 0 rows가 아니라 성공했지만 count를 모른다는 뜻입니다.", "batch performance 최적화가 atomicity와 key/count mapping을 바꿀 수 있어 connector property를 release evidence에 포함합니다."],
  },
  {
    id: "safe-redaction-observability",
    title: "SQLException을 구조화하되 SQL·bind·host·credential·PII를 로그와 응답에서 분리합니다",
    lead: "장애 진단에 필요한 context와 공격자·일반 사용자에게 노출하면 안 되는 database 내부 정보를 같은 문자열로 다루지 않습니다.",
    explanations: [
      "일반 telemetry에는 operation id, sanitized query fingerprint, SQLState class, vendor code, exception type, duration, attempt, transaction outcome과 pool state를 bounded labels로 남깁니다.",
      "raw SQL은 literal을 포함할 수 있고 driver message에는 host, table/constraint, value가 포함될 수 있습니다. message 전체를 metric label·HTTP response·chat alert에 넣지 않습니다.",
      "PreparedStatement를 사용해도 toString/logging proxy가 bind values를 렌더링할 수 있습니다. logger 설정, APM DB instrumentation과 support dump를 synthetic sensitive fixture로 검증합니다.",
      "사용자에게는 stable error code와 retry/문의 action을 제공하고 내부 cause correlation id만 연결합니다. constraint 종류를 노출할 때 authorization enumeration 위험을 검토합니다.",
      "restricted raw evidence는 access, encryption, retention, incident purpose와 deletion을 둡니다. production credential/host를 학습 example·snapshot·test fixture로 복사하지 않습니다.",
    ],
    concepts: [
      c("query fingerprint", "literal/bind를 제거하고 query shape를 bounded identity로 표현한 값입니다.", ["high cardinality를 줄입니다.", "원문 복원이 어렵게 합니다."]),
      c("safe error envelope", "외부 응답용 stable code·correlation·action만 담고 내부 DB detail을 제외한 구조입니다.", ["domain별 mapping을 둡니다.", "authorization을 고려합니다."]),
      c("restricted diagnostic", "보안 승인된 incident context에서만 접근 가능한 raw exception/trace 자료입니다.", ["retention을 제한합니다.", "감사 기록을 둡니다."]),
    ],
    diagnostics: [d("metric backend cardinality와 비용이 폭증하고 bind 값이 노출됩니다.", "SQLException message와 full SQL을 label로 사용했습니다.", ["metric label samples", "APM SQL sanitization", "logger proxy settings", "HTTP/error payload"], "bounded operation/fingerprint/state/vendor labels만 사용하고 raw evidence를 restricted sampled logs로 분리합니다.", "synthetic sensitive bind/host/message가 logs·metrics·responses에 없는 privacy test를 둡니다.")],
    expertNotes: ["redaction 뒤에도 constraint/table naming이 tenant나 개인을 드러낼 수 있어 naming/visibility를 함께 검토합니다.", "SQLState/vendor code는 상대적으로 안전하지만 request correlation과 결합하면 식별 가능성이 커질 수 있습니다."],
  },
  {
    id: "timeout-cancel-interrupt",
    title: "login·network·query·lock·request timeout과 cancel 후 connection 상태를 구분합니다",
    lead: "timeout 하나를 설정했다고 모든 JDBC 대기가 끝나는 것이 아니며 각 clock은 적용 단계와 예외·transaction 상태가 다릅니다.",
    explanations: [
      "DriverManager login timeout, DataSource/driver connect timeout, socket read/network timeout, Statement query timeout, DB lock/statement timeout과 outer request deadline을 별도 표로 관리합니다.",
      "Statement.setQueryTimeout의 단위·지원·server cancel 방식은 driver별로 검증합니다. client timeout 뒤 query가 server에서 계속되는 orphan work가 없는지 activity와 locks를 readback합니다.",
      "Statement.cancel은 best effort일 수 있고 호출 자체가 실패할 수 있습니다. cancel 후 transaction이 aborted/usable인지 확인하고 일반적으로 rollback 후 connection validate/evict를 선택합니다.",
      "Thread interrupt를 삼키거나 InterruptedException을 suppressed close로 만들지 않습니다. interrupt status 복원과 higher-level cancellation policy를 지키되 DB resource cleanup은 완료합니다.",
      "timeout exception은 transaction rollback 확정과 다릅니다. COMMIT/read timeout이면 outcome unknown을 idempotency key로 조회하고 blind retry하지 않습니다.",
    ],
    concepts: [
      c("timeout layer", "connect·socket·query·lock·transaction·request 각각에 적용되는 시간 제한 경계입니다.", ["단위/기본값을 기록합니다.", "outer deadline과 정렬합니다."]),
      c("query cancellation", "진행 중 statement를 client/driver/server에 중단 요청하는 동작입니다.", ["best effort일 수 있습니다.", "server state를 확인합니다."]),
      c("orphan database work", "caller가 timeout/취소됐지만 server query·transaction·lock은 계속 남아 있는 상태입니다.", ["activity view로 탐지합니다.", "rollback/close를 전파합니다."]),
    ],
    codeExamples: [javaExample("jdbc04-timeout-cleanup", "SQLTimeoutException에서도 resource close 보장", "Jdbc04TimeoutCleanup.java", "timeout을 stable SQLState로 분류하고 catch 진입 전에 resource가 닫혔는지 검증합니다.", String.raw`import java.sql.SQLTimeoutException;

public class Jdbc04TimeoutCleanup {
    static final class TimedResource implements AutoCloseable {
        static boolean closed;
        @Override public void close() { closed = true; }
    }
    public static void main(String[] args) {
        try (TimedResource resource = new TimedResource()) {
            System.out.println("started=true");
            throw new SQLTimeoutException("internal-timeout", "HYT00", 0);
        } catch (SQLTimeoutException error) {
            System.out.println("type=" + error.getClass().getSimpleName());
            System.out.println("state=" + error.getSQLState());
            System.out.println("resource-closed=" + TimedResource.closed);
            System.out.println("outcome=verify-before-retry");
        }
    }
}`, "started=true\ntype=SQLTimeoutException\nstate=HYT00\nresource-closed=true\noutcome=verify-before-retry", ["jdk-sql-timeout", "jdk-statement", "oracle-jdbc-troubleshooting", "mysql-sqlstates"])],
    diagnostics: [d("HTTP timeout 뒤에도 DB session이 query/lock을 계속 보유합니다.", "outer cancellation이 Statement.cancel·server timeout·transaction rollback으로 전파되지 않았습니다.", ["server active query/transaction", "client cancel/close trace", "query/socket/lock timeouts", "pool lease owner"], "남은 deadline을 driver/server에 전달하고 cancel→rollback→close/evict를 bounded하게 수행합니다.", "request abort fault test에서 server work·locks·pool active가 제한 시간 안 baseline으로 복귀하는지 확인합니다.")],
    expertNotes: ["timeout 값을 길게 늘리기 전에 어느 layer에서 기다리는지 분류합니다.", "timeout error response에는 안전한 retry guidance를 주되 commit unknown write는 조회 endpoint를 사용하게 합니다."],
  },
  {
    id: "pooled-close-transaction-state",
    title: "pool 환경에서 close를 반환·rollback·session reset·validation 계약으로 검증합니다",
    lead: "pool connection close는 socket 종료가 아니어도 반드시 호출해야 하며 dirty transaction/session state가 다음 borrower에게 넘어가지 않아야 합니다.",
    explanations: [
      "DataSource.getConnection이 반환한 proxy를 try-with-resources로 닫으면 Hikari 같은 pool은 물리 연결을 idle로 반환합니다. close 누락은 pool 고갈이고 physical connection 수만 보고 찾기 어렵습니다.",
      "uncommitted transaction을 반환하면 pool/framework가 rollback하는지에 의존하기보다 owner가 명시 outcome을 결정합니다. pool reset은 방어선이며 business commit/rollback 정책이 아닙니다.",
      "autocommit, readOnly, isolation, catalog/schema, network timeout과 vendor session variables가 baseline으로 복구되는지 확인합니다. unsupported reset state는 borrow hook 또는 금지 규칙이 필요합니다.",
      "fatal SQLException/close failure 뒤 connection을 healthy idle로 반환하지 않고 evict해야 합니다. driver isValid/exception override와 Hikari behavior를 actual fault에서 검증합니다.",
      "pool metrics active/idle/pending/total과 acquisition duration을 request operation에 연결하고 raw JDBC URL/user를 label로 쓰지 않습니다.",
    ],
    concepts: [
      c("logical close", "pool proxy lease를 끝내고 physical connection을 재사용 가능 상태로 반환하는 close입니다.", ["호출 생략은 leak입니다.", "physical close와 구분합니다."]),
      c("session reset", "반환 전에 transaction·autocommit·readOnly·isolation·schema 등 connection state를 baseline으로 복원하는 절차입니다.", ["pool/driver 지원을 확인합니다.", "custom state를 검토합니다."]),
      c("connection eviction", "fatal/unknown health connection을 idle 재사용하지 않고 pool에서 제거하는 동작입니다.", ["error classification과 연결합니다.", "replenishment를 관측합니다."]),
    ],
    diagnostics: [d("다음 요청이 이전 tenant schema/readOnly/isolation을 상속합니다.", "custom session state를 reset하지 않았거나 dirty connection을 pool에 반환했습니다.", ["borrow/return state readback", "pool reset list", "custom SET commands", "previous/current request trace"], "session mutation을 제한하고 owner rollback/close 뒤 pool baseline reset 및 checkout assertion을 둡니다.", "같은 physical connection을 연속 대여하는 cross-request leakage test를 실행합니다.")],
    expertNotes: ["pool이 rollback해 준다는 기대는 commit/rollback ownership을 흐리므로 success/failure path에서 명시합니다.", "connection unwrap로 physical handle을 저장하거나 proxy 밖에서 사용하면 pool lifecycle을 우회합니다."],
  },
  {
    id: "resource-exception-test-operations",
    title: "failure-point matrix·driver conformance·관측·runbook으로 자원/예외 운영을 닫습니다",
    lead: "정상 query 한 번 성공으로는 initializer·body·close·timeout·network·pool-return 실패를 검증할 수 없습니다.",
    explanations: [
      "failure matrix는 connection acquire, prepare, bind, execute, first/middle row map, batch index, commit, each close와 cancel 시점을 포함합니다. 각 점에서 primary/suppressed/nextException과 resource counts를 고정합니다.",
      "unit harness는 JDK language/API semantics를 빠르게 증명하고 ephemeral MySQL/Oracle integration은 actual SQLState/vendor code, timeout/cancel, network partition과 server cursor/session cleanup을 증명합니다.",
      "telemetry에는 operation, exception type, SQLState class, vendor code, primary/suppressed count, duration, timeout layer, transaction outcome, pool active/pending과 retry attempt를 bounded하게 남깁니다.",
      "runbook은 spike error classification, connection/test query health, orphan queries, pool exhaustion, safe eviction/restart, commit-unknown reconciliation과 credential rotation을 포함합니다.",
      "driver/JDK/pool upgrade gate에서 close order language semantics뿐 아니라 error translation, isValid/cancel, batch counts, network timeout과 leak metrics를 재실행합니다.",
    ],
    concepts: [
      c("failure-point matrix", "resource lifecycle 각 단계에 실패를 주입하고 expected exception tree·transaction·resource state를 적은 표입니다.", ["정상/실패 cleanup을 포함합니다.", "자동 실행합니다."]),
      c("driver conformance", "지원 DB/driver/version이 agreed SQLState·timeout·close·batch/resource 계약을 만족하는지 검증하는 suite입니다.", ["JDK mock을 보완합니다.", "upgrade마다 실행합니다."]),
      c("resource reconciliation", "application pool counts와 DB sessions/cursors/transactions가 요청 종료 뒤 baseline으로 돌아왔는지 비교하는 절차입니다.", ["orphan work를 찾습니다.", "privacy-safe identifiers를 씁니다."]),
    ],
    diagnostics: [d("driver upgrade 뒤 leak alert와 timeout 분류가 달라졌지만 CI는 통과합니다.", "unit mock만 실행하고 actual driver SQLState/close/cancel/pool behavior를 고정하지 않았습니다.", ["old/new driver matrix", "ephemeral DB failures", "pool/server resource counts", "error translation snapshots"], "지원 engine/driver별 failure-point conformance suite와 resource reconciliation을 release gate로 둡니다.", "upgrade artifact에 structured differences와 승인된 retry/eviction policy를 남깁니다.")],
    expertNotes: ["JDK 21 harness stdout은 language contract의 증거이고 database cleanup의 최종 증거는 server/pool readback입니다.", "운영 runbook에서 로그 수집 때문에 raw credentials/SQL을 추가하지 않고 제한된 diagnostic channel을 사용합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-jdbc-basic", repository: "SPRING/SpringBasic", path: "src/test/java/com/simple/basic/JDBCBasic.java", usedFor: ["DriverManager connection baseline and explicit resource/exception gap"], evidence: "read-only 구조 감사에서 24 logical lines, getConnection1, plain try1/catch1, try-with-resources0, close0, typed SQLException0을 확인했습니다. URL·user·password literals는 복사하지 않았습니다." },
  { id: "local-jdbc-anonymous", repository: "SPRING/SpringBasic", path: "src/test/java/com/simple/basic/JDBCANONYMOUS.java", usedFor: ["interface/anonymous implementation progression and absence of JDBC resource ownership"], evidence: "read-only 구조 감사에서 27 logical lines와 interface/anonymous run method progression을 확인했으며 JDBC resource APIs는 0이었습니다. sample literals는 복사하지 않았습니다." },
  { id: "jdk-autocloseable", repository: "Java SE 21 API", path: "AutoCloseable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AutoCloseable.html", usedFor: ["automatic close contract and close failure"], evidence: "Java SE 21 공식 API입니다." },
  { id: "jdk-throwable", repository: "Java SE 21 API", path: "Throwable", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html", usedFor: ["cause and suppressed exception access"], evidence: "Java SE 21 공식 API입니다." },
  { id: "jls-try-resources", repository: "Java Language Specification 21", path: "14.20.3 try-with-resources", publicUrl: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.3", usedFor: ["initialization, translation, reverse close and suppression semantics"], evidence: "Java 21 공식 language specification입니다." },
  { id: "jdk-sqlexception", repository: "Java SE 21 API", path: "SQLException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLException.html", usedFor: ["SQLState, vendor code and nextException chain"], evidence: "Java SE 21 공식 JDBC API입니다." },
  { id: "jdk-sql-timeout", repository: "Java SE 21 API", path: "SQLTimeoutException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/SQLTimeoutException.html", usedFor: ["timeout classification"], evidence: "Java SE 21 공식 JDBC API입니다." },
  { id: "jdk-batch-update", repository: "Java SE 21 API", path: "BatchUpdateException", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/BatchUpdateException.html", usedFor: ["partial batch counts and exception fields"], evidence: "Java SE 21 공식 JDBC API입니다." },
  { id: "jdk-connection", repository: "Java SE 21 API", path: "Connection", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html", usedFor: ["connection close, transaction and validation ownership"], evidence: "Java SE 21 공식 JDBC API입니다." },
  { id: "jdk-statement", repository: "Java SE 21 API", path: "Statement", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html", usedFor: ["query timeout, cancel, batch sentinels and close"], evidence: "Java SE 21 공식 JDBC API입니다." },
  { id: "jdk-resultset", repository: "Java SE 21 API", path: "ResultSet", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/ResultSet.html", usedFor: ["cursor lifetime and close ownership"], evidence: "Java SE 21 공식 JDBC API입니다." },
  { id: "mysql-sqlstates", repository: "MySQL Connector/J Developer Guide", path: "Mapping MySQL Error Numbers to JDBC SQLState Codes", publicUrl: "https://dev.mysql.com/doc/connector-j/en/connector-j-reference-error-sqlstates.html", usedFor: ["MySQL SQLState/vendor mapping conformance"], evidence: "MySQL Connector/J 공식 문서입니다." },
  { id: "postgres-error-codes", repository: "PostgreSQL Documentation", path: "Error Codes", publicUrl: "https://www.postgresql.org/docs/current/errcodes-appendix.html", usedFor: ["SQLSTATE classes and stable condition names"], evidence: "PostgreSQL 공식 error-code 문서입니다." },
  { id: "oracle-jdbc-errors", repository: "Oracle AI Database 26ai JDBC Developer's Guide", path: "JDBC Error Messages", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/jjdbc/JDBC-error-messages.html", usedFor: ["Oracle JDBC vendor diagnostics boundary"], evidence: "Oracle 공식 JDBC error 문서입니다." },
  { id: "oracle-jdbc-troubleshooting", repository: "Oracle AI Database 26ai JDBC Developer's Guide", path: "Troubleshooting", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/jjdbc/JDBC-troubleshooting.html", usedFor: ["network timeout and diagnostic redaction boundary"], evidence: "Oracle 공식 JDBC troubleshooting 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "jdbc-04-exception-resource-trywithresources", slug: "jdbc-04-exception-resource-trywithresources", courseId: "spring", moduleId: "jdbc-foundations", order: 4,
  title: "SQLException과 try-with-resources 자원 정리", subtitle: "Connection 소유권에서 suppressed·SQLState chain·batch·timeout·pool 반환·privacy-safe 진단까지 연결합니다.", level: "고급", estimatedMinutes: 900,
  coreQuestion: "JDBC 실행의 어느 지점에서 실패해도 원래 원인을 잃지 않고 Connection·Statement·ResultSet을 확실히 닫으며, 안전한 정보만으로 retry·rollback·eviction을 어떻게 결정할까요?",
  summary: "SpringBasic JDBCBasic.java와 JDBCANONYMOUS.java를 read-only로 구조 감사해 connection/anonymous-interface progression과 try-with-resources·typed SQLException 공백만 provenance로 사용합니다. resource ownership, 역순 close, partial acquisition, suppressed exceptions, SQLState/vendor/nextException, retry boundary, BatchUpdateException counts, redaction, timeout/cancel, pooled close/session reset과 failure-point operations를 고급 수준으로 연결합니다. 다섯 exact JDK 21 examples는 close order, suppressed failures, SQLException chain, batch sentinels와 timeout cleanup을 실제 compile/run합니다.",
  objectives: ["Connection·Statement·ResultSet 소유권과 역순 close를 설명한다.", "try-with-resources 초기화/close 실패와 suppressed exception을 보존한다.", "SQLException의 SQLState·vendor code·nextException을 구조적으로 분류한다.", "retryable/recoverable error를 outcome·idempotency와 함께 판정한다.", "BatchUpdateException partial counts와 rollback 정책을 검증한다.", "timeout/cancel/orphan work와 pool logical close/session reset을 운영한다.", "SQL·bind·host·credential·PII를 노출하지 않는 관측/runbook을 설계한다."],
  prerequisites: [{ title: "ResultSet cursor와 행을 VO로 매핑하기", reason: "ResultSet 사용 범위와 cursor mapping을 resource ownership/exception cleanup까지 확장합니다.", sessionSlug: "jdbc-03-resultset-row-mapping" }],
  keywords: ["SQLException", "SQLState", "vendor code", "nextException", "try-with-resources", "AutoCloseable", "suppressed exception", "BatchUpdateException", "SQLTimeoutException", "Statement.cancel", "resource leak", "redaction", "pool lease"], topics,
  lab: {
    title: "JDBC repository의 모든 failure point에서 예외·transaction·resource를 증명하기",
    scenario: "목록/등록 repository가 Connection·PreparedStatement·ResultSet·batch를 사용하고 connection loss, timeout, body/close 동시 오류와 pool proxy 반환 실패를 만납니다.",
    setup: ["local source는 read-only provenance로만 사용하고 synthetic keys/values만 준비합니다.", "JDK 21 harness와 ephemeral MySQL/Oracle, 실제 driver/pool versions를 준비합니다.", "resource ownership graph와 acquisition→use→transaction outcome→close timeline을 작성합니다.", "failure point별 expected primary/cause/suppressed/nextException과 pool/server counts를 고정합니다."],
    steps: ["Connection→Statement→ResultSet을 한 lexical try-with-resources scope로 옮깁니다.", "각 initializer/body/row map/batch/commit/close에서 failure를 주입합니다.", "primary·suppressed·cause·nextException을 cycle/depth 제한으로 수집합니다.", "SQLState/vendor/concrete type을 domain/retry/eviction policy에 mapping합니다.", "batch update counts와 canonical post-state를 correlation key로 reconciliation합니다.", "query/network/lock/request timeout과 cancel 후 server work·transaction을 readback합니다.", "commit unknown을 durable idempotency key로 조회하고 blind retry를 차단합니다.", "pool 반환 전 rollback/state reset과 fatal connection eviction을 검증합니다.", "logs/metrics/responses에서 raw SQL/binds/host/credential/PII가 없는지 검사합니다.", "driver/JDK/pool upgrade conformance와 incident runbook을 실행합니다."],
    expectedResult: ["모든 정상·실패 path에서 resources와 server cursors/sessions가 baseline으로 돌아옵니다.", "body 오류가 close 오류에 덮이지 않고 structured exception tree가 보존됩니다.", "retry·rollback·eviction이 message가 아니라 approved codes/outcome에 근거합니다.", "batch/timeout/commit-unknown이 duplicate effect 없이 안전하게 해소됩니다.", "관측과 runbook이 진단 가능하면서 민감 DB 정보를 노출하지 않습니다."],
    cleanup: ["ephemeral schemas·synthetic rows와 captured restricted diagnostics를 제거합니다.", "connections/statements/resultsets/transactions와 pool active/pending이 0인지 확인합니다.", "temporary credentials/exports를 revoke·삭제합니다.", "production과 local source files/data는 변경하지 않습니다."],
    extensions: ["R2DBC Publisher cancellation/resource lifecycle과 JDBC blocking model을 비교합니다.", "OpenTelemetry database spans의 statement sanitization을 검증합니다.", "network proxy로 half-open/socket reset/commit-ack loss를 fault-injection합니다.", "custom SQLException translator의 driver upgrade conformance corpus를 구축합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 JDK 21 examples를 compile/run하고 exception/resource timeline을 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "close 역순을 설명합니다.", "primary/suppressed를 구분합니다.", "SQLState chain 분류를 계산합니다.", "batch sentinels와 known rows를 해석합니다.", "timeout catch 전에 close됐음을 확인합니다."], hints: ["finally code보다 language가 보장하는 translation 순서를 먼저 보세요."], expectedOutcome: "JDBC failure를 message가 아니라 구조화된 예외와 resource state로 설명합니다.", solutionOutline: ["acquire→use→primary failure→reverse close→structured classify 순서입니다."] },
    { difficulty: "응용", prompt: "로컬 connection test progression을 leak-safe repository로 확장하세요.", requirements: ["local 구조 계수와 민감값 미복사를 기록합니다.", "모든 JDBC resources를 try-with-resources로 소유합니다.", "exception tree/SQLState/vendor translation을 구현합니다.", "batch partial/rollback/idempotency를 검증합니다.", "timeout/cancel/orphan cleanup을 실행합니다.", "pool reset/eviction을 확인합니다.", "privacy-safe telemetry를 둡니다.", "actual driver failure matrix를 release gate로 만듭니다."], hints: ["close 호출 수가 아니라 server/pool resource baseline을 증명하세요."], expectedOutcome: "실패해도 root cause와 자원 안전성을 함께 보존하는 repository가 완성됩니다.", solutionOutline: ["audit→ownership→failure injection→translate→reconcile→operate 순서입니다."] },
    { difficulty: "설계", prompt: "조직 JDBC exception/resource 표준을 작성하세요.", requirements: ["owner/close-order/lexical-scope rules를 둡니다.", "primary/suppressed/cause/next chain 수집을 정의합니다.", "SQLState/vendor/domain/retry/eviction matrix를 둡니다.", "batch/commit-unknown/idempotency 정책을 포함합니다.", "timeout/cancel/deadline/pool reset을 정의합니다.", "SQL/bind/host/credential/PII redaction을 요구합니다.", "driver conformance/failure matrix를 둡니다.", "resource reconciliation/runbook/upgrade gate를 정의합니다."], hints: ["예외를 잡는 위치와 transaction/resource owner를 같은 diagram에 그리세요."], expectedOutcome: "초급 close부터 운영 장애 진단까지 일관된 JDBC 고급 gate가 완성됩니다.", solutionOutline: ["own→close→preserve→classify→decide→observe→recover 순서입니다."] },
  ],
  nextSessions: ["jdbc-05-manual-transaction"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["JDBCBasic.java 24 logical lines/682 bytes를 read-only로 감사해 getConnection1·plain try/catch1, try-with-resources/close/typed SQLException0을 확인했습니다.", "JDBCANONYMOUS.java 27 logical lines/604 bytes의 interface/anonymous implementation progression과 JDBC resource API0을 확인했습니다.", "원본 JDBC URL·host·username·password·sample values·code 원문을 복사하지 않고 구조와 명시적 gaps만 provenance로 사용했습니다.", "JDK synthetic examples는 actual MySQL/Oracle driver SQLState/vendor codes, network cancel, pool proxy eviction과 server resource cleanup을 대체하지 않습니다."] },
});

export default session;
