import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-15", explanation: "JDK 21 record·enum·collections와 작은 proxy/transaction journal로 service transaction의 물리·논리 상태를 명시합니다." },
      { lines: "16-끝에서 6줄 전", explanation: "rollback rules, proxy interception, propagation, readOnly, version conflict, lazy scope 또는 outbox delivery를 deterministic하게 계산합니다." },
      { lines: "마지막 6줄", explanation: "commit/rollback/transaction ID, DB/outbox state와 retry 결과를 exact stdout으로 출력합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "Spring/JPA/Hibernate/DB/network/실데이터 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "순수 Java model은 실제 AOP proxy, PlatformTransactionManager/JTA, JDBC savepoints, provider context, database isolation과 broker를 대체하지 않습니다."] },
    experiments: [
      { change: "exception type/catch, proxy 진입, propagation, readOnly, version과 lazy access 시점을 바꿉니다.", prediction: "rollback 여부, physical transaction 수, conflict와 context-open 결과가 달라집니다.", result: "Spring integration test에서 transaction active/name/readOnly, SQL, commit readback과 exception을 대조합니다." },
      { change: "DB commit 직전/직후와 outbox publish/ack 사이에 failure를 주입합니다.", prediction: "domain row와 outbox는 함께 commit/rollback되고 worker retry에서는 중복 delivery 가능성이 드러납니다.", result: "idempotent consumer, attempt ledger와 crash-recovery evidence를 확인합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "source-transaction-annotation-audit",
    title: "원본 class-level jakarta.transaction.Transactional의 실제 범위와 비어 있는 운영 속성을 감사합니다",
    lead: "annotation 이름이 같아 보여도 Jakarta와 Spring annotation은 제공 attributes가 다르며 proxy를 통과한 실제 호출만 transaction behavior를 얻습니다.",
    explanations: [
      "원본 GuestBookServiceImpl은 class에 jakarta.transaction.Transactional을 붙이고 네 public read methods에서 repository query를 위임합니다. write 조합, lazy association access, exception/rollback, propagation, timeout, readOnly, concurrency나 external side effect 코드는 없습니다.",
      "Spring transaction infrastructure는 지원 version에서 Jakarta Transactional을 해석할 수 있지만 원본 import에는 Spring @Transactional의 readOnly, isolation, timeout, propagation enum과 rollbackFor attributes가 없습니다. Jakarta 쪽은 TxType, rollbackOn/dontRollbackOn을 제공합니다.",
      "class-level annotation은 public business methods의 기본 의도를 표현하지만 bean이 실제 Spring proxy로 등록되고 caller가 proxy를 통해 진입해야 advice가 적용됩니다. new로 직접 만든 instance나 self-invocation은 annotation text만으로 transaction을 만들지 않습니다.",
      "이번 세션은 원본을 transaction boundary 출발점으로만 사용하고 rollback/propagation/lazy/outbox는 current Spring/Jakarta/JPA 공식 계약과 synthetic tests로 보강합니다. 실제 rows, credential, exception message와 local absolute path는 복사하지 않습니다.",
    ],
    concepts: [
      c("transaction annotation dialect", "Spring 또는 Jakarta annotation이 표현하는 propagation/rollback/readOnly/timeout attributes와 parser semantics의 차이입니다.", ["import를 확인합니다.", "target transaction manager로 test합니다."]),
      c("transaction interceptor", "proxy 호출 전후에 transaction begin/participate/commit/rollback을 적용하는 advice입니다.", ["method body 밖에서 동작합니다.", "self-invocation을 가로채지 못할 수 있습니다."]),
      c("source capability gap", "원본 annotation은 있지만 advanced transaction behavior를 실행하는 method/scenario가 없는 상태입니다.", ["공식 자료로 보강합니다.", "원본 evidence와 구분합니다."]),
    ],
    diagnostics: [
      d("readOnly=true를 설정했다고 설명하지만 원본 import에는 해당 attribute가 없습니다.", "jakarta.transaction.Transactional과 Spring annotation을 혼동했습니다.", ["fully qualified import를 봅니다.", "available annotation elements를 공식 API와 대조합니다.", "runtime transaction attributes를 inspect합니다."], "조직 표준 annotation을 선택하고 method별 attributes를 명시하며 mixed imports를 architecture test로 차단합니다.", "annotation parser/import/transaction-attribute integration tests를 둡니다."),
      d("@Transactional class인데 repository calls가 transaction 밖에서 실행됩니다.", "Spring bean/proxy가 아닌 직접 instance 호출 또는 비공개/지원되지 않는 interception 경로입니다.", ["bean identity/proxy type을 봅니다.", "caller reference와 instantiation을 추적합니다.", "transaction active evidence를 확인합니다."], "constructor-injected Spring bean을 외부 component가 proxy reference로 호출하게 구조화합니다.", "real application context에서 proxy-entry transaction tests를 둡니다."),
    ],
    expertNotes: ["annotation 지원/visibility rules는 Spring major version과 proxy mode에 따라 current docs/test로 고정합니다.", "class-level write transaction default는 모든 read method까지 unnecessary dirty checking/connection usage를 만들 수 있어 method intent를 review합니다."],
  },
  {
    id: "service-unit-of-work-atomicity",
    title: "service public method를 business invariant의 원자적 unit-of-work 경계로 설계합니다",
    lead: "transaction은 repository method 호출 횟수가 아니라 어떤 business state changes가 함께 성공하거나 함께 취소돼야 하는지에서 시작합니다.",
    explanations: [
      "application service는 input validation/authorization 뒤 aggregate들을 load하고 domain rules를 적용해 repository writes와 outbox row를 하나의 transaction으로 묶습니다. controller, repository 개별 method나 entity setter가 전체 unit-of-work를 소유하지 않습니다.",
      "transaction을 너무 작게 나누면 첫 write가 commit된 뒤 두 번째 failure에서 partial state가 남습니다. 너무 크게 잡아 remote HTTP, file upload와 사용자 대기까지 포함하면 locks, pool과 deadlock risk가 커집니다.",
      "DB transaction은 같은 transaction manager/resource에 enlist된 changes만 atomic하게 rollback합니다. 다른 database, broker, email과 filesystem은 자동 포함되지 않으므로 saga/compensation 또는 same-DB outbox 같은 명시적 consistency pattern이 필요합니다.",
      "service return은 commit이 실제로 성공한 뒤 controller가 public success로 변환해야 합니다. generated ID나 DTO는 transaction 안에서 완성하되 external response가 commit 전에 전송되지 않게 proxy invocation/exception flow를 보존합니다.",
    ],
    concepts: [
      c("unit of work", "하나의 business invariant를 유지하기 위해 함께 commit 또는 rollback돼야 하는 reads/writes의 범위입니다.", ["service method로 표현합니다.", "remote side effect와 범위가 다릅니다."]),
      c("atomicity", "transaction에 참여한 changes가 전부 확정되거나 전부 취소되는 성질입니다.", ["다중 resources에는 별도 coordination이 필요합니다.", "commit failure를 포함합니다."]),
      c("transaction duration", "connection/locks/snapshots가 유지되는 begin부터 completion까지 시간입니다.", ["remote I/O를 피합니다.", "timeout과 metrics를 둡니다."]),
    ],
    diagnostics: [
      d("두 repository 중 첫 write만 남습니다.", "business method에 outer transaction이 없거나 서로 다른 transaction manager/resources를 사용했습니다.", ["transaction ID/resource bindings를 봅니다.", "begin/commit timeline을 확인합니다.", "DataSource/manager qualifiers를 대조합니다."], "service public method에서 필요한 same-resource writes를 하나의 transaction으로 묶고 다중 resource는 explicit consistency design을 적용합니다.", "각 단계 fault-injection commit/readback tests를 둡니다."),
      d("DB transaction 동안 외부 API가 느려져 pool과 locks가 고갈됩니다.", "remote call을 open database transaction 안에서 수행했습니다.", ["transaction duration/span을 봅니다.", "remote wait와 DB lock timeline을 겹칩니다.", "pool pending/deadlock을 확인합니다."], "remote prefetch를 transaction 전으로 옮기거나 DB outbox/async worker로 commit 후 수행하고 stale validation을 transaction 안에서 다시 합니다.", "slow remote fault test와 max transaction-duration gate를 둡니다."),
    ],
    expertNotes: ["한 service method가 여러 aggregates를 바꾸는 것이 항상 잘못은 아니지만 invariant owner와 contention을 명시합니다.", "transaction success와 business event delivery success를 하나의 boolean로 합치지 않습니다."],
  },
  {
    id: "proxy-entry-self-invocation",
    title: "proxy 외부 진입과 self-invocation을 구분해 transaction advice 누락을 재현합니다",
    lead: "Spring AOP proxy는 proxy reference를 거친 method call을 가로채지만 target 내부의 this.inner() 호출은 일반 Java 호출이라 별도 advice를 우회합니다.",
    explanations: [
      "외부 caller→proxy→target 순서에서는 transaction interceptor가 method attributes를 읽고 begin/join/suspend를 결정합니다. target method가 같은 target의 다른 method를 호출하면 proxy로 되돌아가지 않아 inner annotation이 새로 평가되지 않습니다.",
      "self-invocation 문제는 outer transaction이 이미 REQUIRED로 열려 있고 inner도 같은 semantics면 눈에 잘 띄지 않지만 inner REQUIRES_NEW, readOnly, timeout 또는 rollback rule을 기대할 때 치명적입니다.",
      "가장 명확한 해결은 서로 다른 unit-of-work를 별도 bean으로 분리해 collaborator proxy를 호출하는 것입니다. self injection/AopContext는 coupling과 순환 문제를 만들 수 있어 우선 선택하지 않습니다.",
      "private/final method interception, JDK proxy interface exposure와 class proxy rules는 target Spring version에 따라 검증합니다. annotation 위치만 보고 advice가 실행됐다고 단정하지 않습니다.",
    ],
    concepts: [
      c("proxy entry", "caller가 Spring bean proxy reference의 advised method를 호출해 interceptor chain이 실행되는 경계입니다.", ["transaction begin 지점입니다.", "caller/target identity를 확인합니다."]),
      c("self-invocation", "target object method가 this 또는 implicit this로 같은 object의 다른 method를 직접 호출하는 것입니다.", ["proxy advice를 우회합니다.", "refactor가 우선입니다."]),
      c("advice visibility", "어떤 method/proxy type/call path가 transaction interceptor 대상이 되는지에 대한 runtime 규칙입니다.", ["Spring version을 고정합니다.", "context integration test가 필요합니다."]),
    ],
    codeExamples: [java("jpa05-proxy", "외부 proxy 호출과 내부 self-invocation의 advice 횟수", "Jpa05Proxy.java", "proxy가 external method마다 transaction advice를 실행하지만 target outer→inner direct call은 추가 advice가 없음을 보여 줍니다.", String.raw`public class Jpa05Proxy {
    static final class Target {
        int innerBodies;
        void outer() { inner(); }
        void inner() { innerBodies++; }
    }
    static final class Proxy {
        final Target target; int adviceCalls; int transactions;
        Proxy(Target target) { this.target = target; }
        void outer() { adviceCalls++; transactions++; target.outer(); }
        void inner() { adviceCalls++; transactions++; target.inner(); }
    }
    public static void main(String[] args) {
        Target target = new Target();
        Proxy proxy = new Proxy(target);
        proxy.outer();
        System.out.println("after-outer-advice=" + proxy.adviceCalls);
        System.out.println("after-outer-transactions=" + proxy.transactions);
        System.out.println("inner-bodies=" + target.innerBodies);
        proxy.inner();
        System.out.println("after-external-inner-advice=" + proxy.adviceCalls);
        System.out.println("after-external-inner-transactions=" + proxy.transactions);
    }
}`, "after-outer-advice=1\nafter-outer-transactions=1\ninner-bodies=1\nafter-external-inner-advice=2\nafter-external-inner-transactions=2", ["local-guestbook-service", "spring-aop-proxying", "spring-transactional-javadoc", "spring-tx-annotations"])],
    diagnostics: [
      d("inner REQUIRES_NEW가 별도 commit되지 않습니다.", "같은 target의 outer가 inner를 self-invoke해 proxy advice를 우회했습니다.", ["call graph와 bean/proxy identity를 봅니다.", "transaction IDs를 비교합니다.", "inner method를 외부에서 호출해 차이를 재현합니다."], "inner unit-of-work를 별도 Spring bean으로 분리해 collaborator proxy를 호출합니다.", "outer→inner와 direct-inner transaction-ID integration tests를 둡니다."),
      d("테스트에서 new ServiceImpl()로 호출하면 transaction rollback이 없습니다.", "Spring context/proxy 없이 target instance를 직접 만들었습니다.", ["test construction을 봅니다.", "AopUtils/bean type과 transaction active를 확인합니다.", "repository가 fake인지 actual인지 봅니다."], "pure unit test와 proxy transaction integration test를 분리하고 context에서 bean을 주입받습니다.", "proxy-presence architecture test를 둡니다."),
    ],
    expertNotes: ["self-invocation을 해결하려고 모든 method를 public bean으로 쪼개면 domain cohesion이 깨질 수 있으므로 실제 별도 transaction boundary일 때만 분리합니다.", "AspectJ weaving은 self-invocation behavior가 다를 수 있으므로 proxy mode 자료와 혼용하지 않습니다."],
  },
  {
    id: "rollback-runtime-checked-caught",
    title: "runtime·checked exception, rollbackFor/rollbackOn과 catch-swallow가 transaction outcome을 바꾸는 규칙을 고정합니다",
    lead: "기본 declarative transaction은 unchecked exception/Error에서 rollback하고 checked exception은 보통 commit하므로 business exception hierarchy를 의도적으로 설계해야 합니다.",
    explanations: [
      "Spring @Transactional default는 RuntimeException과 Error에 rollback하고 checked Exception에는 rollback하지 않습니다. checked business failure도 모든 DB changes를 취소해야 한다면 type-safe rollbackFor를 명시하거나 unchecked application exception 정책을 선택합니다.",
      "Jakarta Transactional도 기본 checked exception은 rollback하지 않고 RuntimeException은 rollback하며 rollbackOn/dontRollbackOn으로 조정합니다. Spring/Jakarta attributes 이름을 섞지 않습니다.",
      "method 안에서 exception을 catch해 정상 return하면 interceptor는 failure를 보지 못해 commit할 수 있습니다. 처리할 수 없는 persistence/business failure는 rethrow하고, 정말 복구한 경우에만 consistent state를 만들어 반환합니다. 필요 시 rollback-only를 명시하지만 infrastructure coupling을 최소화합니다.",
      "rollback rule 문자열 pattern은 unintended class names까지 match할 수 있어 class-based rules를 우선합니다. 가장 구체적인 matching rule과 nested exception translation을 tests로 확인합니다.",
      "inner REQUIRED scope가 rollback-only로 표시된 뒤 outer가 exception을 catch하면 outer commit 시 UnexpectedRollbackException이 날 수 있습니다. 부분 성공으로 숨기지 않고 unit-of-work 전체 failure로 처리합니다.",
    ],
    concepts: [
      c("rollback rule", "throwable type/pattern에 따라 transaction을 rollback-only로 표시할지 결정하는 declarative 정책입니다.", ["unchecked default를 이해합니다.", "type-safe rule을 우선합니다."]),
      c("checked exception", "RuntimeException을 상속하지 않아 compile-time handling이 요구되는 Exception입니다.", ["기본 rollback 대상이 아닐 수 있습니다.", "business atomicity에 맞춰 설정합니다."]),
      c("rollback-only", "transaction이 더 진행돼도 최종 commit될 수 없도록 표시된 상태입니다.", ["outer commit에서 UnexpectedRollback이 날 수 있습니다.", "새 transaction에서 retry합니다."]),
    ],
    codeExamples: [java("jpa05-rollback", "runtime·checked·configured checked rollback 결과", "Jpa05Rollback.java", "작은 transaction journal에서 exception 종류와 checked rollback option에 따라 commit/rollback rows를 계산합니다.", String.raw`import java.util.*;

public class Jpa05Rollback {
    enum Failure { NONE, RUNTIME, CHECKED }
    static String run(Set<String> database, String value, Failure failure, boolean rollbackChecked) {
        List<String> pending = new ArrayList<>(); pending.add(value);
        boolean rollback = failure == Failure.RUNTIME || (failure == Failure.CHECKED && rollbackChecked);
        if (!rollback) database.addAll(pending);
        return rollback ? "rollback" : "commit";
    }
    public static void main(String[] args) {
        Set<String> database = new LinkedHashSet<>();
        System.out.println("runtime=" + run(database, "runtime-row", Failure.RUNTIME, false));
        System.out.println("checked-default=" + run(database, "checked-row", Failure.CHECKED, false));
        System.out.println("checked-configured=" + run(database, "configured-row", Failure.CHECKED, true));
        System.out.println("success=" + run(database, "success-row", Failure.NONE, false));
        System.out.println("rows=" + database);
    }
}`, "runtime=rollback\nchecked-default=commit\nchecked-configured=rollback\nsuccess=commit\nrows=[checked-row, success-row]", ["spring-tx-rollback", "spring-tx-annotations", "spring-transactional-javadoc", "jakarta-transactional", "spring-tx-overview"])],
    diagnostics: [
      d("checked business failure 후 일부 rows가 commit됩니다.", "default rollback rule이 checked exception을 rollback하지 않습니다.", ["thrown exception type과 wrapping을 봅니다.", "annotation import/rollback attributes를 확인합니다.", "commit readback을 실행합니다."], "atomicity가 필요한 checked exception을 rollbackFor/rollbackOn으로 명시하거나 exception hierarchy를 정책에 맞게 교정합니다.", "runtime/checked/subclass/wrapped rule matrix를 둡니다."),
      d("repository exception을 catch해 false를 반환했는데 transaction이 commit됩니다.", "failure를 swallow해 interceptor가 정상 return으로 판단했습니다.", ["catch blocks와 return을 봅니다.", "transaction rollback-only를 확인합니다.", "pending writes/readback을 봅니다."], "복구할 수 없는 failure를 stable application exception으로 rethrow하고 public mapping은 transaction 밖 advice에서 수행합니다.", "first-write→caught-second-failure atomicity tests를 둡니다."),
    ],
    expertNotes: ["exception을 log하고 rethrow할 때 여러 layers에서 중복 stack/secret logging을 만들지 않게 correlation owner를 정합니다.", "rollback은 in-memory entity, external side effect와 sequence/identity allocation을 반드시 원상 복구하지 않습니다."],
  },
  {
    id: "readonly-transaction-intent",
    title: "readOnly를 최적화 hint로 쓰고 write prohibition·replica routing·consistency를 별도 정책으로 둡니다",
    lead: "readOnly=true는 transaction intent를 표현하지만 database/provider에 따라 write 차단 정도가 다르므로 correctness와 security를 맡기지 않습니다.",
    explanations: [
      "Spring transaction readOnly flag는 TransactionDefinition metadata로 전달되며 JDBC/provider가 optimization에 사용할 수 있습니다. Spring Data JPA 문서는 Hibernate에서 flush mode MANUAL/dirty-check skip 같은 최적화가 적용될 수 있음을 설명합니다.",
      "원본 Jakarta annotation에는 readOnly attribute가 없습니다. maintained query method에서 Spring @Transactional(readOnly=true)을 사용할지 결정하고 write method는 명시 read-write 경계로 둡니다.",
      "readOnly method에서 mutation을 금지하는 것은 code architecture, domain API와 tests로 보장합니다. database read-only enforcement가 있더라도 temporary table, sequence, functions와 dialect behavior를 확인합니다.",
      "read replica routing을 readOnly flag에 연결하면 read-after-write, replica lag와 transaction stickiness가 새 consistency contract가 됩니다. 중요한 command 검증은 primary transaction에서 재확인합니다.",
    ],
    concepts: [
      c("readOnly transaction", "transaction manager에 읽기 의도를 전달하는 transaction attribute입니다.", ["optimization hint일 수 있습니다.", "portable write guard가 아닙니다."]),
      c("read-after-write consistency", "write 성공 직후 이어지는 read가 그 write를 관찰해야 한다는 요구입니다.", ["replica lag와 충돌할 수 있습니다.", "routing/session 정책이 필요합니다."]),
      c("transaction attribute", "propagation, isolation, timeout, readOnly와 name처럼 transaction creation/participation을 결정하는 metadata입니다.", ["existing transaction에서 상속될 수 있습니다.", "method/proxy 진입이 필요합니다."]),
    ],
    codeExamples: [java("jpa05-readonly", "readOnly hint와 application write guard 분리", "Jpa05ReadOnly.java", "transaction metadata만으로는 write가 금지되지 않으므로 별도 command policy가 거부하는 model입니다.", String.raw`public class Jpa05ReadOnly {
    record Tx(boolean readOnly, String route) {}
    static String providerHint(Tx tx) { return tx.readOnly() ? "manual-flush-hint" : "auto-flush"; }
    static String write(Tx tx, boolean applicationGuard) {
        if (applicationGuard && tx.readOnly()) return "blocked-by-application";
        return tx.readOnly() ? "provider-dependent" : "allowed";
    }
    public static void main(String[] args) {
        Tx read = new Tx(true, "replica");
        Tx write = new Tx(false, "primary");
        System.out.println("read-hint=" + providerHint(read));
        System.out.println("read-route=" + read.route());
        System.out.println("write-without-guard=" + write(read, false));
        System.out.println("write-with-guard=" + write(read, true));
        System.out.println("command=" + write(write, true) + ",route=" + write.route());
    }
}`, "read-hint=manual-flush-hint\nread-route=replica\nwrite-without-guard=provider-dependent\nwrite-with-guard=blocked-by-application\ncommand=allowed,route=primary", ["spring-tx-strategies", "spring-transaction-definition", "spring-data-transactions", "spring-transactional-javadoc", "spring-isolation-javadoc"])],
    diagnostics: [
      d("readOnly method의 mutation이 한 DB에서는 반영되고 다른 DB에서는 실패합니다.", "readOnly를 portable write prohibition으로 간주했습니다.", ["transaction manager/provider/JDBC settings를 봅니다.", "flush mode와 DB enforcement를 확인합니다.", "commit readback을 실행합니다."], "read/write service API를 분리하고 read path mutation 0을 architecture/integration test로 보장합니다.", "supported provider/DB readOnly mutation matrix를 둡니다."),
      d("write 직후 readOnly 조회가 이전 값을 반환합니다.", "readOnly routing이 lagging replica로 보냈습니다.", ["transaction route와 replica lag를 봅니다.", "write token/session stickiness를 확인합니다.", "cache를 대조합니다."], "read-after-write가 필요한 요청은 primary/session consistency를 사용하고 eventual response에는 staleness를 명시합니다.", "replica lag/read-your-write tests를 둡니다."),
    ],
    expertNotes: ["readOnly optimization은 large entity graphs에서 유용할 수 있지만 transaction 자체를 없애는 것과 다릅니다.", "route 값을 metrics label로 쓰되 tenant/user/SQL values를 포함하지 않습니다."],
  },
  {
    id: "propagation-required-rollback-only",
    title: "REQUIRED가 logical scopes를 하나의 physical transaction에 결합하는 방식을 추적합니다",
    lead: "default REQUIRED는 기존 transaction이 있으면 참여하고 없으면 새 transaction을 만들기 때문에 inner failure가 outer 전체 outcome에 영향을 줍니다.",
    explanations: [
      "outer REQUIRED가 physical transaction을 시작한 뒤 inner REQUIRED는 같은 resource transaction에 참여합니다. inner logical scope가 rollback-only로 표시하면 outer가 exception을 catch해도 physical transaction은 commit될 수 없습니다.",
      "outer commit 시 unexpected rollback을 알려 주는 것은 caller가 성공이라고 오해하지 않게 하는 안전장치입니다. inner expected failure를 부분 성공으로 허용하려면 transaction model 자체를 다시 설계합니다.",
      "SUPPORTS는 existing transaction에 참여할 수 있지만 없으면 non-transactional 실행이므로 동일 method가 context/resource semantics를 달리할 수 있습니다. MANDATORY/NEVER로 architecture invariant를 fail-fast할 수도 있습니다.",
      "existing transaction 참여 시 inner isolation/timeout/readOnly 선언이 새 physical transaction에 적용되지 않을 수 있습니다. validateExistingTransactions와 target manager behavior를 확인합니다.",
    ],
    concepts: [
      c("REQUIRED", "기존 transaction에 참여하고 없으면 새 transaction을 만드는 default propagation입니다.", ["logical scopes가 physical transaction을 공유합니다.", "rollback-only가 전파됩니다."]),
      c("logical transaction scope", "각 annotated method가 선언한 transaction boundary와 rollback decision 범위입니다.", ["physical resource transaction을 공유할 수 있습니다.", "proxy 호출이어야 합니다."]),
      c("UnexpectedRollbackException", "outer가 commit을 요청했지만 inner가 shared transaction을 rollback-only로 표시해 rollback됐음을 알리는 Spring exception입니다.", ["성공 오해를 막습니다.", "catch-swallow를 교정합니다."]),
    ],
    codeExamples: [java("jpa05-propagation", "REQUIRED·REQUIRES_NEW·NESTED physical scope 차이", "Jpa05Propagation.java", "transaction IDs와 savepoint를 생성해 propagation에 따른 join/new/nested 결과를 출력합니다.", String.raw`import java.util.*;

public class Jpa05Propagation {
    static final class Manager {
        int nextId; final Deque<Integer> stack = new ArrayDeque<>(); int savepoints;
        int required() { if (stack.isEmpty()) stack.push(++nextId); return stack.peek(); }
        int requiresNew() { stack.push(++nextId); return stack.peek(); }
        void finishRequiresNew() { stack.pop(); }
        int nested() { if (stack.isEmpty()) return required(); savepoints++; return stack.peek(); }
    }
    public static void main(String[] args) {
        Manager manager = new Manager();
        int outer = manager.required();
        int innerRequired = manager.required();
        int innerNew = manager.requiresNew();
        manager.finishRequiresNew();
        int innerNested = manager.nested();
        System.out.println("outer=" + outer);
        System.out.println("required-joins=" + (outer == innerRequired));
        System.out.println("requires-new=" + innerNew + ",independent=" + (innerNew != outer));
        System.out.println("nested-tx=" + innerNested + ",same=" + (innerNested == outer));
        System.out.println("savepoints=" + manager.savepoints);
    }
}`, "outer=1\nrequired-joins=true\nrequires-new=2,independent=true\nnested-tx=1,same=true\nsavepoints=1", ["spring-tx-propagation", "spring-propagation-javadoc", "spring-transaction-definition", "spring-tx-annotations", "jakarta-transactional"])],
    diagnostics: [
      d("inner failure를 catch했는데 outer commit에서 UnexpectedRollbackException이 납니다.", "inner REQUIRED가 shared physical transaction을 rollback-only로 표시했습니다.", ["transaction IDs/propagation을 봅니다.", "rollback-only set origin을 추적합니다.", "outer catch block을 확인합니다."], "unit-of-work 전체 failure로 전파하거나 정말 independent한 업무만 별도 transaction/outbox로 재설계합니다.", "inner runtime failure+caught outer commit test를 둡니다."),
      d("inner isolation/readOnly 설정이 적용되지 않습니다.", "REQUIRED가 기존 physical transaction에 참여해 outer attributes를 사용했습니다.", ["new/join 여부를 봅니다.", "actual isolation/readOnly를 inspect합니다.", "validateExistingTransactions 설정을 확인합니다."], "attribute가 반드시 다른 작업은 명시 separate boundary를 검토하고 incompatible participation을 fail-fast합니다.", "existing/no-existing attribute matrix를 둡니다."),
    ],
    expertNotes: ["logical scope마다 새 connection을 쓴다고 가정하지 않습니다. REQUIRED는 보통 같은 transaction-bound resource를 공유합니다.", "SUPPORTS는 편리하지만 transaction 유무에 따라 lazy/context/locking이 달라질 수 있어 application service에서는 신중히 사용합니다."],
  },
  {
    id: "requires-new-nested-resource-cost",
    title: "REQUIRES_NEW의 독립 commit·pool 비용과 NESTED savepoint의 제한을 구분합니다",
    lead: "두 propagation은 모두 inner failure를 격리하는 것처럼 보이지만 physical transaction, connection과 rollback 가능 범위가 다릅니다.",
    explanations: [
      "REQUIRES_NEW는 outer transaction을 suspend하고 독립 physical transaction/resource를 시작해 inner commit/rollback과 locks가 outer와 분리됩니다. outer rollback 뒤에도 inner commit은 남으므로 business atomicity에 맞는 경우만 사용합니다.",
      "outer가 connection을 보유한 채 모든 threads가 REQUIRES_NEW connection을 기다리면 pool exhaustion/deadlock이 생길 수 있습니다. pool capacity는 concurrent outer + inner depth와 other workloads를 포함합니다.",
      "NESTED는 일반적으로 하나의 physical transaction과 savepoints를 사용해 inner 부분 rollback 후 outer가 계속할 수 있습니다. Spring docs는 JDBC resource transactions/savepoint support에 의존함을 명시하므로 JPA manager/provider에서 지원된다고 가정하지 않습니다.",
      "audit를 무조건 REQUIRES_NEW로 저장하면 main failure에도 audit가 남는 장점이 있지만 pool/consistency/PII와 false success 위험이 있습니다. durable business event는 same-transaction outbox가 더 자연스러운 경우가 많습니다.",
    ],
    concepts: [
      c("REQUIRES_NEW", "항상 독립 physical transaction을 만들고 existing transaction을 suspend하는 propagation입니다.", ["별도 resource/connection이 필요할 수 있습니다.", "outer rollback과 독립입니다."]),
      c("NESTED", "existing physical transaction 안의 savepoint로 inner 부분 rollback을 표현하는 propagation입니다.", ["manager/savepoint 지원이 필요합니다.", "REQUIRES_NEW와 다릅니다."]),
      c("connection pool headroom", "outer transactions가 connection을 보유한 상태에서 inner independent transactions까지 수용할 여유입니다.", ["concurrency/depth로 계산합니다.", "timeout/fail-fast를 둡니다."]),
    ],
    diagnostics: [
      d("REQUIRES_NEW 추가 후 모든 threads가 connection을 기다립니다.", "outer가 pool connections를 점유한 채 inner가 새 connection을 요구했습니다.", ["pool active/pending/max를 봅니다.", "outer concurrency와 inner depth를 계산합니다.", "transaction duration을 확인합니다."], "REQUIRES_NEW 사용을 줄이고 pool capacity/timeout을 검증하며 async outbox로 독립 작업을 이동합니다.", "full-concurrency pool exhaustion test를 둡니다."),
      d("NESTED annotation을 썼지만 inner만 rollback되지 않습니다.", "transaction manager/resource가 savepoint-based nested transaction을 지원하지 않거나 self-invocation했습니다.", ["manager type과 nestedTransactionAllowed를 봅니다.", "savepoint logs를 확인합니다.", "proxy call path를 봅니다."], "지원 matrix를 확인하고 unsupported하면 business workflow/outbox/별도 transaction으로 재설계합니다.", "actual manager savepoint integration test를 둡니다."),
    ],
    expertNotes: ["REQUIRES_NEW는 outer uncommitted data를 isolation상 보지 못하거나 lock에 막힐 수 있습니다.", "NESTED partial rollback 뒤 entity persistence context state가 savepoint DB state와 일치하는지 provider behavior를 별도 검증합니다."],
  },
  {
    id: "isolation-concurrency-version",
    title: "isolation과 @Version으로 lost update·write skew·lock conflict를 transaction 결과로 다룹니다",
    lead: "transaction이 있다는 사실은 모든 동시성 anomaly를 막지 않으며 isolation level과 optimistic/pessimistic control을 domain invariant에 맞춰 선택해야 합니다.",
    explanations: [
      "isolation은 dirty/non-repeatable/phantom reads와 serialization behavior를 database에 요청합니다. Spring Isolation enum과 JDBC levels의 의미를 알되 target DB의 default, MVCC와 predicate locking을 실제로 검증합니다.",
      "두 transaction이 같은 entity를 읽고 dirty checking으로 저장하면 version이 없을 때 마지막 write가 앞선 변경을 덮을 수 있습니다. @Version은 update/delete에서 read version을 비교해 conflict 시 OptimisticLockException과 rollback을 만듭니다.",
      "optimistic conflict는 사용자의 stale edit 또는 정상 경쟁이며 blind transaction retry가 항상 안전하지 않습니다. command idempotency, merge UI와 bounded retry policy로 분류합니다.",
      "여러 rows 조건의 write skew는 entity 한 개 @Version만으로 막히지 않을 수 있습니다. constraint, aggregate redesign, atomic conditional update, pessimistic lock 또는 serializable isolation을 위험/throughput에 따라 선택합니다.",
    ],
    concepts: [
      c("isolation level", "동시 transactions가 서로의 intermediate/committed changes를 관찰하는 범위를 정하는 transaction attribute입니다.", ["DB 구현 차이가 있습니다.", "새 transaction에 적용됩니다."]),
      c("optimistic locking", "read version과 write 시 current version을 비교해 intervening update를 conflict로 탐지하는 방식입니다.", ["@Version을 사용합니다.", "충돌 시 rollback됩니다."]),
      c("lost update", "두 readers가 같은 이전 state에서 변경하고 나중 write가 앞선 write를 덮어버리는 anomaly입니다.", ["version/atomic update로 막습니다.", "last-write-wins와 구분합니다."]),
    ],
    codeExamples: [java("jpa05-version", "두 transaction snapshot의 optimistic version conflict", "Jpa05Version.java", "동일 version을 읽은 두 writers 중 첫 update만 성공하고 두 번째 stale update를 거부합니다.", String.raw`public class Jpa05Version {
    static final class Row {
        String subject = "initial"; long version;
        boolean update(long expectedVersion, String value) {
            if (version != expectedVersion) return false;
            subject = value; version++; return true;
        }
    }
    public static void main(String[] args) {
        Row row = new Row();
        long versionA = row.version;
        long versionB = row.version;
        boolean a = row.update(versionA, "from-a");
        boolean b = row.update(versionB, "from-b");
        System.out.println("a-version=" + versionA + ",success=" + a);
        System.out.println("b-version=" + versionB + ",success=" + b);
        System.out.println("final-subject=" + row.subject);
        System.out.println("final-version=" + row.version);
        System.out.println("conflicts=" + (b ? 0 : 1));
    }
}`, "a-version=0,success=true\nb-version=0,success=false\nfinal-subject=from-a\nfinal-version=1\nconflicts=1", ["spring-isolation-javadoc", "spring-transaction-definition", "jakarta-persistence-spec", "jakarta-version"])],
    diagnostics: [
      d("두 사용자의 수정 중 하나가 조용히 사라집니다.", "version/conditional predicate 없이 last commit이 이전 state를 덮었습니다.", ["read/write version과 SQL affected rows를 봅니다.", "entity @Version mapping을 확인합니다.", "concurrent barrier test를 실행합니다."], "@Version 또는 atomic conditional update를 적용하고 conflict를 409/reload-merge flow로 처리합니다.", "deterministic two-writer lost-update test를 둡니다."),
      d("isolation을 SERIALIZABLE로 높인 뒤 abort/deadlock이 늘어납니다.", "retry/idempotency와 capacity 검증 없이 가장 강한 level을 전역 적용했습니다.", ["serialization/deadlock codes를 봅니다.", "transaction length/access order를 확인합니다.", "invariant별 필요 isolation을 분석합니다."], "짧은 transaction, consistent lock order와 invariant-specific constraint/version을 사용하고 retryable abort만 bounded retry합니다.", "representative concurrency/load/deadlock tests를 둡니다."),
    ],
    expertNotes: ["Spring isolation attribute는 새 physical transaction을 만들 때만 의미 있을 수 있어 REQUIRED participation을 함께 봅니다.", "@Version conflict retry 전에 command가 순수/idempotent하고 사용자 의도를 자동 재적용해도 되는지 확인합니다."],
  },
  {
    id: "timeout-deadlock-retry-idempotency",
    title: "transaction timeout·deadlock·serialization failure를 bounded retry와 idempotency로 복구합니다",
    lead: "timeout이나 deadlock은 rollback 가능한 transient failure일 수 있지만 transaction 전체를 안전하게 재실행할 수 있을 때만 retry합니다.",
    explanations: [
      "Spring transaction timeout은 manager/resource에 전달되는 seconds granularity metadata이며 모든 Java computation/network I/O를 강제 interrupt하는 universal deadline이 아닙니다. statement/query timeout과 caller deadline을 함께 설계합니다.",
      "deadlock victim, serialization failure와 selected optimistic conflict는 retry 후보지만 constraint validation, authentication과 deterministic business rejection은 retry하지 않습니다. SQLState/provider exception을 stable transient/permanent category로 translate합니다.",
      "retry는 transaction proxy 밖에서 새 physical transaction을 시작해야 합니다. rollback-only context 안에서 같은 EntityManager로 반복하지 않고 backoff/jitter, max attempts와 end-to-end deadline을 적용합니다.",
      "create/payment-like command는 idempotency key와 unique ledger로 duplicate external/request replay를 막습니다. retry마다 Clock/random/remote response가 달라지는 side effects를 transaction 밖/command state로 통제합니다.",
    ],
    concepts: [
      c("transaction timeout", "transaction manager가 unit-of-work에 허용한 최대 실행 시간 metadata입니다.", ["resource 지원에 의존합니다.", "caller/network deadline과 다릅니다."]),
      c("transient concurrency failure", "deadlock victim/serialization abort처럼 새 transaction에서 재실행하면 성공할 수 있는 failure입니다.", ["분류가 필요합니다.", "무제한 retry하지 않습니다."]),
      c("idempotency key", "동일 actor/operation/payload replay를 하나의 durable result로 결합하는 식별자입니다.", ["unique constraint/ledger를 사용합니다.", "다른 payload reuse를 거부합니다."]),
    ],
    diagnostics: [
      d("deadlock retry가 같은 rollback-only transaction에서 계속 실패합니다.", "retry loop가 transactional method 내부에 있어 새 transaction을 만들지 못했습니다.", ["retry와 proxy/transaction boundary를 봅니다.", "transaction IDs를 비교합니다.", "EntityManager state를 확인합니다."], "non-transactional orchestrator/retry interceptor가 transactional unit-of-work를 매 attempt 새로 호출하게 합니다.", "attempt별 transaction-ID와 rollback/readback tests를 둡니다."),
      d("timeout retry로 duplicate create가 발생합니다.", "commit outcome이 ambiguous한 command를 idempotency ledger 없이 재실행했습니다.", ["request key/payload hash를 봅니다.", "DB commit과 response-loss timeline을 확인합니다.", "unique result lookup을 봅니다."], "actor-scoped idempotency key와 payload hash를 same DB transaction에 저장하고 replay는 기존 result를 반환합니다.", "commit-success/response-loss concurrent replay tests를 둡니다."),
    ],
    expertNotes: ["retry advice와 transaction advice order가 새 transaction per attempt를 만드는지 integration test합니다.", "deadlock을 retry로 숨기기 전에 inconsistent access order와 long transaction root cause를 교정합니다."],
  },
  {
    id: "lazy-loading-dto-boundary",
    title: "lazy loading이 살아있는 persistence context와 transaction 안에서 DTO를 완성합니다",
    lead: "lazy proxy/collection은 entity field가 아니라 provider와 open context가 협력하는 deferred database access이므로 layer 밖으로 내보내면 실패와 N+1 위치가 불명확해집니다.",
    explanations: [
      "transaction-scoped persistence context 안에서 managed entity의 lazy association을 접근하면 provider가 추가 query로 초기화할 수 있습니다. context가 닫혀 detached가 되면 미초기화 state 접근은 LazyInitializationException 계열 failure가 될 수 있습니다.",
      "persistence context가 열려 있다는 사실과 database transaction이 active라는 사실은 완전히 같은 개념이 아닐 수 있습니다. consistent business read와 resource lifecycle을 위해 service transaction 안에서 필요한 graph를 query/projection합니다.",
      "OSIV는 web request 끝까지 context를 연장할 수 있지만 controller/view/serializer에서 예상 밖 queries, N+1과 mixed snapshots를 만듭니다. 문제를 숨기는 default가 아니라 명시적 architecture decision으로 취급합니다.",
      "service는 authorization과 use-case fetch plan을 적용해 immutable DTO를 transaction 안에서 materialize하고 entities/proxies를 반환하지 않습니다. collection pagination과 multiple bags/cartesian amplification도 query tests로 검증합니다.",
    ],
    concepts: [
      c("lazy loading", "entity attribute/association의 database load를 실제 접근 시점까지 미루는 persistence provider 동작입니다.", ["open context가 필요할 수 있습니다.", "query budget을 관찰합니다."]),
      c("LazyInitialization failure", "detached/unavailable context에서 초기화되지 않은 lazy state를 접근해 발생하는 provider failure입니다.", ["DTO/fetch plan으로 방지합니다.", "모든 EAGER 전환은 피합니다."]),
      c("transactional DTO materialization", "service transaction 안에서 필요한 authorized fields를 모두 읽어 immutable response DTO로 변환하는 경계입니다.", ["entity escape를 막습니다.", "N+1을 test합니다."]),
    ],
    codeExamples: [java("jpa05-lazy", "open context에서 DTO materialize 후 context 밖 안전 사용", "Jpa05Lazy.java", "lazy value는 context open일 때만 load하고 DTO string은 context 종료 후에도 독립적으로 사용할 수 있음을 모델링합니다.", String.raw`public class Jpa05Lazy {
    static final class LazyValue {
        boolean loaded; String value;
        String get(boolean contextOpen) {
            if (!loaded && !contextOpen) throw new IllegalStateException("context-closed");
            if (!loaded) { value = "loaded-detail"; loaded = true; }
            return value;
        }
    }
    public static void main(String[] args) {
        LazyValue first = new LazyValue();
        String dto = first.get(true);
        System.out.println("loaded-inside=" + first.loaded);
        System.out.println("dto-outside=" + dto);
        LazyValue second = new LazyValue();
        try { second.get(false); }
        catch (IllegalStateException ex) { System.out.println("outside-lazy=" + ex.getMessage()); }
        System.out.println("second-loaded=" + second.loaded);
    }
}`, "loaded-inside=true\ndto-outside=loaded-detail\noutside-lazy=context-closed\nsecond-loaded=false", ["local-guestbook-service", "jakarta-persistence-spec", "spring-data-transactions", "spring-tx-strategies"])],
    diagnostics: [
      d("controller JSON serialization에서 lazy initialization failure가 납니다.", "entity/proxy를 service transaction 밖으로 반환했습니다.", ["transaction/context completion을 봅니다.", "uninitialized association과 serializer stack을 확인합니다.", "OSIV 설정을 봅니다."], "service query에서 필요한 DTO/projection을 완성하고 entity를 web contract에서 제거합니다.", "OSIV-off context-closed serialization tests를 둡니다."),
      d("OSIV를 켠 뒤 response마다 수백 query가 실행됩니다.", "serializer가 entity graph를 순회하며 request 끝까지 lazy loads를 발생시켰습니다.", ["route query count/stack을 봅니다.", "association fetch plan을 확인합니다.", "payload graph/bytes를 측정합니다."], "use-case DTO projection/fetch join/entity graph와 bounded collections를 적용하고 query budget을 enforce합니다.", "large dataset N+1/query-count regression tests를 둡니다."),
    ],
    expertNotes: ["모든 association을 EAGER로 바꾸면 over-fetch/cartesian/N+1이 다른 위치에서 생길 수 있습니다.", "readOnly transaction과 lazy loads가 결합될 때 provider flush/dirty behavior를 target version에서 검증합니다."],
  },
  {
    id: "external-side-effects-outbox",
    title: "DB transaction과 외부 side effect 사이를 transactional outbox와 idempotent delivery로 연결합니다",
    lead: "email, broker publish와 HTTP 호출은 JPA rollback으로 취소되지 않으므로 business row와 delivery intent를 같은 DB transaction에 기록한 뒤 별도 worker가 전송합니다.",
    explanations: [
      "DB write 뒤 곧바로 broker publish하고 transaction이 rollback되면 존재하지 않는 business state의 event가 나갑니다. 반대로 commit 뒤 publish 전에 process가 죽으면 event가 영구 누락됩니다. 단순 호출 순서만 바꿔서는 dual-write gap을 없앨 수 없습니다.",
      "transactional outbox는 aggregate change와 event ID/type/payload-reference/status를 같은 local DB transaction에 insert합니다. commit이면 둘 다 존재하고 rollback이면 둘 다 없으며 worker가 pending rows를 claim/publish/ack합니다.",
      "worker crash가 publish 후 ack 전에 발생하면 duplicate delivery가 가능하므로 event ID 기반 idempotent consumer/inbox 또는 broker semantics를 설계합니다. exactly-once라는 표현은 DB/broker/consumer 전체 범위를 증명하지 않고 사용하지 않습니다.",
      "@TransactionalEventListener AFTER_COMMIT은 commit 성공 뒤 handler를 실행할 수 있지만 process crash gap과 durable retry를 자동 해결하지 않습니다. AFTER_COMMIT phase에서 같은 transactional resource writes가 commit된다고 가정하지 않습니다.",
      "outbox payload에는 필요한 최소 data와 schema/version/provenance만 두고 secret/entire entity를 직렬화하지 않습니다. retention, poison event, backoff, dead-letter/manual replay와 ordering key를 운영합니다.",
    ],
    concepts: [
      c("dual-write gap", "database와 외부 system 두 writes 중 하나만 성공해 consistency가 깨질 수 있는 failure window입니다.", ["호출 순서만으로 제거되지 않습니다.", "outbox/saga가 필요합니다."]),
      c("transactional outbox", "business change와 durable publish intent를 같은 DB transaction에 저장하고 별도 relay가 외부 전송하는 pattern입니다.", ["local atomicity를 사용합니다.", "duplicate delivery를 처리합니다."]),
      c("idempotent consumer", "같은 event ID가 여러 번 도착해도 business effect를 한 번만 적용하도록 durable deduplication하는 consumer입니다.", ["payload conflict를 검증합니다.", "dedupe retention을 정합니다."]),
    ],
    codeExamples: [java("jpa05-outbox", "domain row와 outbox atomic commit 및 retry delivery", "Jpa05Outbox.java", "rollback에서는 둘 다 없고 commit 뒤 첫 publish failure를 worker가 retry해 delivered로 만드는 model입니다.", String.raw`import java.util.*;

public class Jpa05Outbox {
    record Event(String id, String payload) {}
    static final class Database {
        final Set<String> rows = new LinkedHashSet<>();
        final Map<String, Event> pending = new LinkedHashMap<>();
        void transact(String row, Event event, boolean fail) {
            if (fail) return;
            rows.add(row); pending.put(event.id(), event);
        }
    }
    public static void main(String[] args) {
        Database db = new Database();
        db.transact("rolled-back", new Event("e0", "ignored"), true);
        db.transact("committed", new Event("e1", "minimal"), false);
        int attempts = 0; boolean delivered = false;
        while (!delivered && attempts < 2) { attempts++; delivered = attempts == 2; }
        if (delivered) db.pending.remove("e1");
        System.out.println("rows=" + db.rows);
        System.out.println("rollback-event-present=" + db.pending.containsKey("e0"));
        System.out.println("attempts=" + attempts);
        System.out.println("delivered=" + delivered);
        System.out.println("pending=" + db.pending.size());
    }
}`, "rows=[committed]\nrollback-event-present=false\nattempts=2\ndelivered=true\npending=0", ["spring-transactional-event-listener", "spring-transaction-phase", "spring-transaction-synchronization", "spring-tx-overview", "spring-tx-strategies"])],
    diagnostics: [
      d("DB rollback 후 이미 email/event가 전송됐습니다.", "external side effect를 DB transaction 안에서 rollback 전에 호출했습니다.", ["DB/event timestamps와 transaction outcome을 봅니다.", "call location을 추적합니다.", "provider idempotency key를 확인합니다."], "same-DB outbox intent를 저장하고 commit 후 worker가 idempotently 전송하게 합니다.", "rollback-before/after-publish crash matrix를 둡니다."),
      d("DB commit됐지만 event가 영구 누락됩니다.", "commit 후 in-memory listener/direct publish 사이 process crash를 durable하게 기록하지 않았습니다.", ["outbox/transaction log를 확인합니다.", "after-commit listener retry storage를 봅니다.", "crash window를 재현합니다."], "business transaction에 outbox row를 함께 저장하고 lease/retry worker와 backlog alerts를 운영합니다.", "commit→process-kill→restart delivery test를 둡니다."),
    ],
    expertNotes: ["outbox row ack/delete 자체도 publish와 atomic하지 않을 수 있어 at-least-once와 idempotent consumer를 기본 가정합니다.", "TransactionalEventListener는 in-process phase coupling 도구이며 durable integration messaging과 동일하지 않습니다."],
  },
  {
    id: "transaction-tests-observability-recovery",
    title: "proxy·rollback·propagation·lazy·concurrency·outbox를 실제 commit과 장애 복구 evidence로 고정합니다",
    lead: "test method의 자동 rollback과 mocks만으로는 proxy advice, commit-time failure, connection pool, database isolation와 crash recovery를 증명할 수 없습니다.",
    explanations: [
      "unit tests는 exception classification과 domain branching을 검증하고 Spring context tests는 실제 proxy, transaction attributes, self-invocation과 manager selection을 검증합니다. target DB tests는 isolation, locks, savepoints, timeout과 commit readback을 담당합니다.",
      "Spring test transaction의 default rollback은 data cleanup에 편리하지만 commit phase, after-commit listener/outbox relay와 constraint timing을 숨길 수 있습니다. TransactionTemplate/별도 test worker로 real commit과 새 transaction readback을 수행합니다.",
      "fault matrix는 first/second write, flush, beforeCommit, commit response loss, inner REQUIRED/REQUIRES_NEW, timeout/deadlock, lazy outside context, outbox publish/ack와 process kill을 포함합니다. 각 case의 DB rows, outbox, external deliveries와 retry count를 assert합니다.",
      "observability는 transaction name/manager, propagation, readOnly, duration/outcome, rollback reason category, connection wait, lock/deadlock, queries/rows와 outbox age/attempts를 낮은 cardinality로 수집합니다. SQL values, entity/string, exception raw message를 label로 쓰지 않습니다.",
      "release는 N/N-1 application-schema-event compatibility, pool capacity(REQUIRES_NEW 포함), canary thresholds와 rollback/forward recovery를 rehearsal합니다. rollback이 외부 side effect/forward-written data를 되돌리지 못하면 reconciliation runbook을 실행합니다.",
    ],
    concepts: [
      c("commit-path test", "transaction이 실제 commit되고 새 context에서 DB state와 after-commit effects를 확인하는 integration test입니다.", ["test rollback과 분리합니다.", "constraint/optimistic errors를 포함합니다."]),
      c("transaction telemetry", "transaction attributes, duration/outcome, resource wait/locks와 stable failure category를 correlation하는 관측 정보입니다.", ["raw data를 넣지 않습니다.", "logical/physical scopes를 구분합니다."]),
      c("reconciliation runbook", "partial external/DB/event states를 ledger와 idempotent repair로 expected business state에 맞추는 사고 절차입니다.", ["rollback만 믿지 않습니다.", "audit와 승인 절차를 둡니다."]),
    ],
    diagnostics: [
      d("모든 transaction test가 통과하지만 운영 commit에서 constraint failure가 납니다.", "자동 rollback test가 flush/commit/after-completion 경로를 실행하지 않았습니다.", ["test transaction configuration을 봅니다.", "flush와 real commit 여부를 확인합니다.", "target DB catalog를 대조합니다."], "별도 commit-path integration suite에서 commit 후 새 transaction readback과 external/outbox state를 검증합니다.", "provider/DB version commit matrix를 release gate로 둡니다."),
      d("incident에서 어느 transaction이 rollback-only를 만든지 찾을 수 없습니다.", "logical scopes, propagation과 stable rollback reason correlation이 없습니다.", ["trace spans/transaction IDs를 봅니다.", "exception translation chain을 확인합니다.", "inner/outer call graph를 대조합니다."], "transaction span에 service operation, manager, propagation/outcome/reason code를 기록하고 raw values는 제외합니다.", "fault tests가 expected telemetry reason을 assert하게 합니다."),
    ],
    expertNotes: ["debug SQL/bind logging을 incident 때 켜도 개인정보/secret redaction과 자동 만료를 적용합니다.", "transaction latency를 낮추기 위해 atomicity를 쪼개기 전에 outbox/saga와 business consistency를 설계합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-guestbook-service", repository: "local learning source", path: "2026-spring-jpa-test\\src\\main\\java\\com\\study\\jpatest\\guestbook\\service\\GuestBookServiceImpl.java", usedFor: ["@Service", "class-level jakarta.transaction.Transactional", "field-injected repository", "four read methods", "advanced transaction inventory gap"], evidence: "2026-07-14 read-only audit: 36 lines, 1,023 bytes, SHA-256 376951E8323A82D287BD6AFD288CB6FB5BDA4E36D2B22ABDD984A59EB39BB5F5. 실제 rows/config/local absolute path는 복사하지 않았습니다." },
  { id: "spring-tx-overview", repository: "Spring Framework Reference", path: "data-access/transaction.html", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction.html", usedFor: ["transaction abstraction", "declarative/programmatic management", "resources"], evidence: "current Spring transaction management overview와 abstraction boundaries를 확인했습니다." },
  { id: "spring-tx-strategies", repository: "Spring Framework Reference", path: "data-access/transaction/strategies.html", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/strategies.html", usedFor: ["TransactionDefinition properties", "readOnly/isolation/timeout", "manager strategies"], evidence: "transaction name, propagation, isolation, timeout와 readOnly concepts를 current official reference에서 확인했습니다." },
  { id: "spring-tx-annotations", repository: "Spring Framework Reference", path: "data-access/transaction/declarative/annotations.html", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html", usedFor: ["@Transactional defaults", "method/class settings", "proxy mode", "rollback defaults"], evidence: "annotation-driven transaction settings와 default propagation/isolation/rollback/readOnly를 확인했습니다." },
  { id: "spring-tx-rollback", repository: "Spring Framework Reference", path: "data-access/transaction/declarative/rolling-back.html", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html", usedFor: ["runtime/checked rollback", "rollbackFor/noRollbackFor", "rollback-only"], evidence: "default unchecked rollback과 type/pattern rollback rules를 current official reference에서 확인했습니다." },
  { id: "spring-tx-propagation", repository: "Spring Framework Reference", path: "data-access/transaction/declarative/tx-propagation.html", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html", usedFor: ["REQUIRED logical/physical", "REQUIRES_NEW pool risk", "NESTED savepoints", "UnexpectedRollback"], evidence: "propagation별 physical resource, rollback-only와 pool/savepoint caveats를 확인했습니다." },
  { id: "spring-aop-proxying", repository: "Spring Framework Reference", path: "core/aop/proxying.html", publicUrl: "https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", usedFor: ["JDK/CGLIB proxies", "self-invocation bypass", "refactoring guidance"], evidence: "proxy reference와 target this self-invocation의 advice 차이를 current official AOP reference에서 확인했습니다." },
  { id: "spring-transactional-javadoc", repository: "Spring Framework API", path: "org/springframework/transaction/annotation/Transactional.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Transactional.html", usedFor: ["Spring transaction attributes", "rollbackFor", "readOnly", "timeout/isolation/labels"], evidence: "current Spring @Transactional API elements와 thread-bound/reactive transaction notes를 확인했습니다." },
  { id: "spring-propagation-javadoc", repository: "Spring Framework API", path: "org/springframework/transaction/annotation/Propagation.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Propagation.html", usedFor: ["REQUIRED/SUPPORTS/MANDATORY/REQUIRES_NEW/NOT_SUPPORTED/NEVER/NESTED"], evidence: "current Propagation enum의 defined behaviors와 suspension/savepoint caveats를 확인했습니다." },
  { id: "spring-isolation-javadoc", repository: "Spring Framework API", path: "org/springframework/transaction/annotation/Isolation.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Isolation.html", usedFor: ["DEFAULT/READ_COMMITTED/REPEATABLE_READ/SERIALIZABLE", "JDBC mapping"], evidence: "Spring Isolation enum과 standard JDBC isolation mapping을 확인했습니다." },
  { id: "spring-transaction-definition", repository: "Spring Framework API", path: "org/springframework/transaction/TransactionDefinition.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/TransactionDefinition.html", usedFor: ["propagation/isolation/timeout/readOnly/name", "existing/new transaction"], evidence: "transaction definition property contract와 constants를 확인했습니다." },
  { id: "spring-data-transactions", repository: "Spring Data JPA Reference", path: "jpa/transactions.html", publicUrl: "https://docs.spring.io/spring-data/jpa/reference/jpa/transactions.html", usedFor: ["repository defaults", "service facade boundary", "readOnly Hibernate optimization", "managed mutation"], evidence: "Spring Data repository/service transaction guidance와 readOnly provider optimization을 확인했습니다." },
  { id: "jakarta-transactional", repository: "Jakarta EE Platform API", path: "jakarta/transaction/Transactional", publicUrl: "https://jakarta.ee/specifications/platform/11/apidocs/jakarta/transaction/transactional", usedFor: ["TxType REQUIRED default", "rollbackOn/dontRollbackOn", "checked/runtime default", "class/method override"], evidence: "원본 annotation의 Jakarta transaction attributes와 default rollback semantics를 확인했습니다." },
  { id: "jakarta-persistence-spec", repository: "Jakarta Persistence", path: "specifications/persistence/3.2/jakarta-persistence-spec-3.2", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2", usedFor: ["transaction-scoped context", "commit/rollback entity state", "lazy detached state", "locking/concurrency"], evidence: "Jakarta Persistence transaction synchronization, rollback, lazy detached와 optimistic locking contracts를 확인했습니다." },
  { id: "jakarta-version", repository: "Jakarta Persistence API", path: "jakarta/persistence/Version", publicUrl: "https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/version", usedFor: ["optimistic version", "lost update detection", "update/delete conflict"], evidence: "@Version field types와 optimistic lock failure semantics를 확인했습니다." },
  { id: "spring-transactional-event-listener", repository: "Spring Framework API", path: "org/springframework/transaction/event/TransactionalEventListener.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/event/TransactionalEventListener.html", usedFor: ["transaction-bound listener", "phase", "fallback execution"], evidence: "TransactionalEventListener가 transaction phase에 binding되는 official API와 resource caveats를 확인했습니다." },
  { id: "spring-transaction-phase", repository: "Spring Framework API", path: "org/springframework/transaction/event/TransactionPhase.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/event/TransactionPhase.html", usedFor: ["BEFORE_COMMIT/AFTER_COMMIT/AFTER_ROLLBACK/AFTER_COMPLETION", "post-completion resource caveat"], evidence: "transaction event phases와 AFTER_COMMIT/AFTER_COMPLETION semantics를 확인했습니다." },
  { id: "spring-transaction-synchronization", repository: "Spring Framework API", path: "org/springframework/transaction/support/TransactionSynchronization.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/support/TransactionSynchronization.html", usedFor: ["beforeCommit/afterCommit/afterCompletion callbacks", "resource cleanup"], evidence: "transaction synchronization callback lifecycle와 after-commit resource warning을 확인했습니다." },
];

const session = createExpertSession({
  inventoryId: "jpa-05-transaction-service-boundary", slug: "jpa-05-transaction-service-boundary", courseId: "spring", moduleId: "spring-data-jpa", order: 5,
  title: "@Transactional과 지연 로딩이 살아있는 경계",
  subtitle: "원본 Jakarta annotation을 proxy·rollback·propagation·readOnly·concurrency·lazy DTO·outbox의 실제 unit-of-work로 확장합니다",
  level: "고급", estimatedMinutes: 100,
  coreQuestion: "service method의 @Transactional이 실제 proxy와 transaction manager를 거쳐 어디서 시작·참여·rollback·commit되고, lazy entity와 외부 side effect를 어떤 경계 안팎에 두어야 일관성과 복구를 보장할까요?",
  summary: "2026-spring-jpa-test의 GuestBookServiceImpl을 read-only로 감사합니다. 원본은 class-level jakarta.transaction.Transactional과 네 repository read delegation만 가지며 Spring 전용 readOnly/isolation/timeout/Propagation, write atomicity, rollback, self-invocation, lazy access, concurrency와 outbox 실행 evidence는 없음을 명시합니다. 이를 출발점으로 service unit-of-work, proxy entry/self-invocation, runtime/checked/caught exception rollback, readOnly hint/replica, REQUIRED logical/physical scopes와 rollback-only, REQUIRES_NEW pool/NESTED savepoints, isolation/@Version lost-update, timeout/deadlock retry/idempotency, transaction 안 lazy DTO/OSIV, same-DB transactional outbox와 idempotent delivery, commit-path/fault/telemetry/reconciliation을 단계적으로 연결합니다. 일곱 JDK 21 examples는 proxy advice, rollback rule, readOnly, propagation, optimistic version, lazy scope와 outbox retry를 exact stdout으로 실행합니다.",
  objectives: ["원본 Jakarta annotation과 advanced transaction inventory gap을 정확히 구분한다.", "business invariant 기준 service unit-of-work와 DB atomicity 범위를 정한다.", "proxy entry/self-invocation과 annotation advice 적용 여부를 검증한다.", "runtime/checked/caught exception과 rollback rules/rollback-only를 설계한다.", "readOnly hint, REQUIRED/REQUIRES_NEW/NESTED와 resource cost를 구분한다.", "isolation/@Version/timeout/deadlock/idempotency로 concurrency failure를 처리한다.", "lazy state를 transaction 안 DTO로 materialize하고 OSIV/N+1을 통제한다.", "transactional outbox, commit-path tests, telemetry와 reconciliation recovery를 운영한다."],
  prerequisites: [{ title: "영속성 컨텍스트·변경 감지·flush", reason: "transaction boundary가 persistence context 수명, dirty checking과 flush/commit을 결정하므로 entity state와 synchronization을 먼저 이해해야 합니다.", sessionSlug: "jpa-04-persistence-context-dirty-check" }],
  keywords: ["Transactional", "jakarta.transaction", "Spring transaction", "AOP proxy", "self invocation", "unit of work", "rollbackFor", "rollbackOn", "checked exception", "readOnly", "Propagation", "REQUIRED", "REQUIRES_NEW", "NESTED", "isolation", "Version", "deadlock retry", "idempotency", "lazy loading", "OSIV", "transactional outbox"],
  topics,
  lab: {
    title: "원본 service를 proxy·rollback·concurrency·lazy·outbox가 검증된 unit-of-work로 qualification하기",
    scenario: "synthetic aggregate와 disposable supported DB/broker stub에서 실제 Spring proxy transaction, commit/rollback와 crash recovery를 끝까지 증명합니다.",
    setup: ["JDK 21", "원본과 호환되는 Boot/Spring Data JPA/transaction manager/provider", "migration이 적용된 disposable supported DB", "broker/email stub과 outbox worker", "barrier/fault injection", "synthetic non-PII data", "원본 service read-only", "실제 credential/row 접근 금지"],
    steps: ["원본 hash/import/class annotation/method bodies를 기록하고 advanced behavior gap을 표시합니다.", "Spring context bean proxy type과 외부 proxy call의 active transaction/name/manager를 확인합니다.", "outer→self inner와 separate collaborator inner에서 advice/transaction IDs를 비교합니다.", "두 repository writes 사이 runtime/checked/configured checked/caught failures를 넣어 commit readback합니다.", "Spring/Jakarta rollback attributes를 혼용하지 않고 strongest rule/rollback-only/UnexpectedRollback을 검증합니다.", "readOnly mutation과 primary/replica read-after-write를 supported stack에서 실행합니다.", "REQUIRED join, REQUIRES_NEW suspend/independent commit/pool exhaustion과 NESTED savepoint support를 검증합니다.", "두 writers의 lost update를 재현하고 @Version conflict/HTTP mapping/idempotent retry를 적용합니다.", "timeout/deadlock/serialization failure를 attempt별 새 transaction과 bounded deadline/backoff로 실행합니다.", "OSIV-off 상태에서 transaction 안 DTO/fetch plan을 완성하고 context 밖 lazy failure/query budget을 검증합니다.", "business row+outbox atomicity와 commit/publish/ack process-kill matrix, idempotent consumer를 실행합니다.", "real commit/after-completion telemetry, N/N-1 schema/event compatibility와 reconciliation/rollback을 rehearsal합니다."],
    expectedResult: ["원본 annotation import와 runtime proxy/transaction attributes가 evidence로 구분됩니다.", "각 failure type에서 DB rows가 expected commit/rollback state이고 partial writes가 없습니다.", "propagation별 physical transaction/connection/savepoint와 resource budgets가 명시됩니다.", "concurrent stale write가 @Version conflict로 탐지되고 retries가 idempotent합니다.", "lazy entities가 web layer로 escape하지 않고 DTO/query budgets가 통과합니다.", "business row/outbox가 atomic하며 crash/retry에도 durable delivery와 dedupe가 재현됩니다.", "incident telemetry와 rollback/forward reconciliation runbook이 실행 가능합니다."],
    cleanup: ["disposable DB/schema/data/accounts, stub broker, workers와 test processes를 제거합니다.", "outbox/inbox/idempotency fixtures와 synthetic canaries를 폐기합니다.", "SQL/bind/transaction debug logging을 원복하고 sanitized evidence만 보존합니다.", "원본 service hash/status unchanged를 readback합니다."],
    extensions: ["multi-database saga와 compensation state machine을 outbox 기반으로 확장합니다.", "virtual thread/async/reactive transaction context propagation을 별도 matrix로 검증합니다.", "pessimistic locks와 lock timeout/fairness를 JPA09로 확장합니다.", "derived query/Pageable/Sort를 다음 JPA06 세션으로 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Java examples를 실행하고 actual Spring transaction evidence에 대응시키세요.", requirements: ["stdout 완전 일치를 확인합니다.", "proxy/self invocation advice 횟수를 재현합니다.", "runtime/checked/configured rollback rows를 확인합니다.", "readOnly hint와 guard를 구분합니다.", "propagation transaction IDs/savepoint를 확인합니다.", "optimistic conflict를 재현합니다.", "lazy DTO/context-close 결과를 확인합니다.", "outbox rollback/retry/delivery를 확인합니다."], hints: ["test의 method-level rollback을 commit evidence로 쓰지 말고 새 transaction readback을 추가하세요."], expectedOutcome: "annotation에서 physical transaction, DB state와 external delivery까지 하나의 timeline으로 설명합니다.", solutionOutline: ["source→proxy→rollback→attributes/propagation→concurrency→lazy→outbox 순서입니다."] },
    { difficulty: "응용", prompt: "원본 Service를 read/write commands와 durable outbox가 있는 implementation plan으로 이관하세요.", requirements: ["constructor injection과 Spring/Jakarta annotation 정책을 정합니다.", "business method unit-of-work를 정의합니다.", "self-invocation을 제거합니다.", "rollback exception taxonomy를 둡니다.", "readOnly/propagation/timeout/isolation을 근거로 선택합니다.", "@Version/idempotency/deadlock retry를 둡니다.", "transactional DTO/OSIV-off fetch plan을 둡니다.", "outbox worker/dedupe/fault/recovery를 포함합니다."], hints: ["모든 method에 @Transactional을 붙이기 전에 어떤 invariant와 resource가 함께 commit돼야 하는지 적으세요."], expectedOutcome: "부분 commit, stale write, lazy failure와 event loss를 견디는 service 설계가 완성됩니다.", solutionOutline: ["audit→boundary→proxy/rules→concurrency→materialize→outbox→qualify 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring/JPA transaction governance를 작성하세요.", requirements: ["annotation/import/proxy visibility 표준을 둡니다.", "unit-of-work/manager/resource ownership을 정의합니다.", "rollback exception/catch/rollback-only 정책을 둡니다.", "readOnly/isolation/timeout/propagation 사용 기준을 둡니다.", "REQUIRES_NEW pool/NESTED support safeguards를 둡니다.", "optimistic/pessimistic/idempotency/retry 정책을 둡니다.", "lazy/DTO/OSIV/query-budget 정책을 둡니다.", "outbox/event schema/dedupe/retention과 commit/fault/canary/reconciliation을 포함합니다."], hints: ["annotation style guide가 아니라 begin부터 crash recovery와 data repair까지 lifecycle 표준을 만드세요."], expectedOutcome: "transaction consistency와 external delivery가 감사·시험·복구 가능한 조직 표준이 완성됩니다.", solutionOutline: ["define→intercept→commit/rollback→coordinate→observe→recover 순서입니다."] },
  ],
  nextSessions: ["jpa-06-derived-query-pageable"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["원본 GuestBookServiceImpl.java는 read-only로 36 lines/1,023 bytes, SHA-256 376951E8323A82D287BD6AFD288CB6FB5BDA4E36D2B22ABDD984A59EB39BB5F5를 확인했습니다.", "원본은 class-level jakarta.transaction.Transactional과 네 repository read delegation만 보여 주며 Spring readOnly/isolation/timeout/Propagation, write atomicity, rollback, self-invocation, lazy association와 outbox 실행 evidence는 없습니다.", "Jakarta와 Spring transaction annotation attributes를 분리하고 target Spring version에서 Jakarta parser/proxy 적용을 integration test하도록 명시했습니다.", "실제 source rows, credentials, private configuration, exception messages와 local absolute path는 공개 내용/examples에 복사하지 않았습니다.", "rollback/propagation/savepoints/isolation/timeouts/lazy/provider/outbox crash behavior는 actual Spring transaction manager, supported DB와 stub broker lab에서 검증해야 합니다."] },
});

export default session;
