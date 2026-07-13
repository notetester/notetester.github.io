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
      { lines: `1-${first}`, explanation: "JDK 21 collection·record와 JDBC 표준 상수만으로 synthetic table, write command, key allocator 또는 transaction snapshot을 준비합니다." },
      { lines: `${first + 1}-${second}`, explanation: "INSERT·UPDATE·DELETE의 affected-row invariant, generated-key mutation, sequence order, optimistic version 또는 batch/rollback 규칙을 실행합니다." },
      { lines: `${second + 1}-${count}`, explanation: "raw SQL·credential·PII 없이 counts, keys, event order, transaction decision과 persisted snapshot만 deterministic evidence로 출력합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "외부 MyBatis jar·DB·network·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "교육용 store/allocator는 실제 MyBatis Executor, JDBC driver generated keys, DB sequence/constraints/locks와 Spring transaction을 대체하지 않습니다."] },
    experiments: [
      { change: "missing id, duplicate idempotency key, version conflict, constraint failure와 response-loss-after-commit을 주입합니다.", prediction: "affected count·rollback·conflict·unknown outcome이 서로 다른 stable result로 분류됩니다.", result: "persisted rows, key property, transaction events와 retry decision을 readback합니다." },
      { change: "동일 contract를 actual MyBatis와 supported MySQL auto-increment/Oracle sequence driver에서 실행합니다.", prediction: "key acquisition mechanism은 달라도 unique key, affected-row와 transaction invariants는 같습니다.", result: "MappedStatement/key generator inventory, update counts, generated object property와 committed state를 비교합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "mapped-write-lifecycle-contract",
    title: "Mapper write를 statement→bind→execute→count/key→transaction의 계약으로 봅니다",
    lead: "insert/update/delete method가 예외 없이 반환했다는 사실만으로 원하는 한 행이 durable하게 바뀌었다고 말할 수 없습니다.",
    explanations: [
      "선행 `mybatis-04-resulttype-resultmap`에서는 select 결과를 객체로 만드는 출력 계약을 다뤘습니다. 이번 세션은 parameter object가 MappedStatement와 TypeHandler를 거쳐 JDBC write가 되고, 영향 행 수·생성 키·transaction outcome이 mapper/service로 돌아오는 흐름을 독립적으로 설명합니다.",
      "원본 ScoreMapper.xml은 VO property를 `#{}`로 bind하는 sequence 기반 insert, resultType select와 단일 id delete의 작은 CRUD 진행을 보여 줍니다. 실제 namespace/SQL/property literal을 복사하지 않고 insert/select/delete shape와 key generation 학습 지점만 provenance로 사용합니다.",
      "MyBatis mapper의 insert/update/delete return은 일반적으로 영향 행 수 int/long 의미를 갖습니다. method를 void로 만들면 0/1/2+ invariant를 상위 계층이 검사하기 어려우므로 write result를 domain outcome으로 변환합니다.",
      "write lifecycle은 statement resolution→parameter validation/binding→DB constraint/trigger→update count/generated keys→local/second-level cache flush→commit/rollback→response입니다. 각 단계는 실패와 retry 안전성이 다릅니다.",
      "MappedStatement id, SQL command type, key generator, affected count, transaction id/outcome과 schema/driver version을 safe evidence로 남깁니다. raw SQL parameter와 generated business data는 기본 log에서 제외합니다.",
    ],
    concepts: [
      c("mapped write", "MyBatis MappedStatement가 실행하는 INSERT·UPDATE·DELETE 또는 data-affecting statement입니다.", ["parameter와 transaction scope를 가집니다.", "affected count/key 결과를 검증합니다."]),
      c("affected-row invariant", "use case별 write가 기대하는 영향 행 수와 0/2+ 처리 규칙입니다.", ["update/delete 존재성·conflict를 표현합니다.", "driver semantics를 matrix로 확인합니다."]),
      c("durable outcome", "DB transaction commit이 성공하고 이후 readback에서 write가 보존되는 결과입니다.", ["execute 성공과 다릅니다.", "unknown commit을 별도로 둡니다."]),
    ],
    diagnostics: [
      d("mapper method는 성공했지만 아무 행도 바뀌지 않았습니다.", "void return 또는 무시된 affected count 때문에 predicate mismatch를 성공으로 처리했습니다.", ["mapper return type/value", "statement command type", "predicate/id/version", "transaction commit/readback"], "expected count를 검사해 0은 not-found/conflict, 2+는 integrity failure로 명시적으로 map합니다.", "0/1/2 counts를 repository contract test와 API outcome test에 포함합니다."),
      d("DB에는 반영됐는데 application은 실패로 응답하거나 그 반대입니다.", "execute, key assignment, commit과 response 단계를 하나의 success flag로 뭉갰습니다.", ["timeline and transaction events", "commit acknowledgement", "connection failure point", "idempotency/reconciliation evidence"], "stage별 outcome을 기록하고 ambiguous commit은 retry가 아니라 idempotency-key readback/reconciliation으로 처리합니다.", "commit 전/후 response loss fault injection을 둡니다."),
    ],
    expertNotes: ["write method의 진짜 반환값은 int 하나가 아니라 count, key, conflict, transaction certainty와 domain result의 조합입니다.", "MyBatis가 JDBC boilerplate를 줄여도 DB constraint와 service transaction ownership은 그대로 application 책임입니다."],
  },
  {
    id: "insert-binding-defaults-constraints",
    title: "INSERT의 column list·bind·default·constraint를 명시적으로 맞춥니다",
    lead: "INSERT 성공 여부는 객체에 값이 있다는 사실보다 SQL column list, DB default, NULL과 constraint가 같은 계약인지에 달려 있습니다.",
    explanations: [
      "insert에는 필요한 column을 명시하고 각 `#{property}`의 Java/JDBC type, nullable와 TypeHandler를 schema와 맞춥니다. select *와 마찬가지로 implicit column order에 의존하는 VALUES-only insert를 피합니다.",
      "DB default를 사용할 column은 SQL column list에서 의도적으로 생략합니다. null을 bind하는 것과 column을 생략하는 것은 다르며 trigger/default/generated column 결과를 필요하면 RETURNING/generated keys/readback으로 확인합니다.",
      "application validation은 사용자 피드백을 빠르게 하지만 unique, foreign key, check, not-null은 concurrency-safe한 마지막 방어로 DB에 유지합니다. constraint violation을 stable domain conflict로 변환하되 vendor message/raw values를 노출하지 않습니다.",
      "multi-row insert는 round-trip을 줄이지만 parameter limit, packet size, generated-key order와 한 row 실패 semantics가 달라집니다. batch executor와 multi-values SQL을 구분해 실제 driver에서 검증합니다.",
      "insert 후 parameter object에 key가 채워지는 mutation은 호출자에게 명확히 문서화합니다. immutable command를 유지하려면 mapper adapter가 mutable persistence parameter와 typed result를 분리할 수 있습니다.",
    ],
    concepts: [
      c("column omission", "DB default/generated behavior를 사용하기 위해 INSERT column list에서 해당 column을 제외하는 선택입니다.", ["NULL bind와 다릅니다.", "readback 필요성을 정합니다."]),
      c("constraint-backed validation", "unique/FK/check/not-null을 DB가 원자적으로 강제하고 application이 오류를 domain result로 변환하는 구조입니다.", ["concurrency race를 막습니다.", "SQLState/constraint id를 safe map합니다."]),
      c("parameter-object mutation", "generated key/selectKey가 mapper argument의 keyProperty를 실행 중 변경하는 동작입니다.", ["호출 전후 state가 달라집니다.", "불변 command adapter를 고려합니다."]),
    ],
    codeExamples: [java("mybatis05-crud-counts", "INSERT·UPDATE·DELETE 영향 행 수 계약", "MyBatis05CrudCounts.java", "in-memory synthetic table에서 create/update/delete의 1/0 counts와 최종 state를 실행합니다.", String.raw`import java.util.*;

public class MyBatis05CrudCounts {
  record Score(long id, String name, int points) {}
  static final class Store {
    final Map<Long, Score> rows = new LinkedHashMap<>();
    int insert(Score score) {
      if (rows.putIfAbsent(score.id(), score) != null) return 0;
      return 1;
    }
    int update(long id, int points) {
      Score current = rows.get(id);
      if (current == null) return 0;
      rows.put(id, new Score(id, current.name(), points));
      return 1;
    }
    int delete(long id) { return rows.remove(id) == null ? 0 : 1; }
  }

  public static void main(String[] args) {
    Store store = new Store();
    System.out.println("insert=" + store.insert(new Score(101, "learner", 80)));
    System.out.println("duplicate-insert=" + store.insert(new Score(101, "learner", 90)));
    System.out.println("update=" + store.update(101, 95));
    System.out.println("missing-update=" + store.update(999, 20));
    System.out.println("delete=" + store.delete(101));
    System.out.println("missing-delete=" + store.delete(101));
    System.out.println("remaining=" + store.rows.size());
  }
}`, "insert=1\nduplicate-insert=0\nupdate=1\nmissing-update=0\ndelete=1\nmissing-delete=0\nremaining=0", ["mybatis-sqlmap", "mybatis-java-api", "mybatis-mapped-statement"] )],
    diagnostics: [
      d("DB default timestamp가 null로 저장되거나 constraint에 걸립니다.", "default를 기대하면서 column을 포함해 explicit NULL을 bind했습니다.", ["INSERT column list", "bound null/JDBC type", "column default/nullability", "trigger/generated definition"], "default를 쓸 column은 의도적으로 생략하거나 application 값을 명시하고 persisted readback을 검증합니다.", "omitted/null/value 세 fixture와 migration default compatibility test를 둡니다."),
      d("동시 중복 요청이 application 사전 검사 뒤 모두 INSERT됩니다.", "select-before-insert만 있고 DB unique/idempotency constraint가 없습니다.", ["unique indexes", "race timeline", "operation key", "constraint SQLState mapping"], "DB unique constraint를 최종 방어로 두고 duplicate를 stable idempotent/conflict result로 변환합니다.", "concurrent identical request test와 constraint-name mapping test를 둡니다."),
    ],
    expertNotes: ["DB default와 application default를 둘 다 두면 drift하기 쉬우므로 authoritative owner와 readback을 정합니다.", "insert parameter의 key mutation을 숨기면 비동기/retry code가 old/new identity를 혼동하므로 API contract에 노출합니다."],
  },
  {
    id: "update-replacement-patch-optimistic",
    title: "UPDATE를 replacement·patch·optimistic concurrency로 구분합니다",
    lead: "null field를 그대로 SET하는 full update와 제공된 field만 바꾸는 patch는 서로 다른 API이며 동적 SQL과 version 조건이 필요합니다.",
    explanations: [
      "replacement update는 전체 writable state를 받아 모든 column을 명시적으로 갱신합니다. patch update는 field별 absent/null/value를 구분해야 하며 Java null 하나로 세 상태를 표현하지 않습니다.",
      "WHERE primary key만 있는 update는 last-write-wins입니다. lost update를 막으려면 version/updated_at token을 predicate에 포함하고 SET에서 version을 증가시킨 뒤 affected=1을 검사합니다.",
      "affected=0은 row 없음과 version conflict를 바로 구분하지 못할 수 있습니다. 별도 existence readback 또는 API 정책으로 404/409를 결정하되 transaction snapshot과 information disclosure를 고려합니다.",
      "UPDATE가 여러 행을 의도하지 않는 use case에서 affected>1은 primary/unique predicate 누락 또는 data corruption incident입니다. commit 전에 rollback하고 statement/predicate metadata를 값 없이 기록합니다.",
      "trigger가 추가 rows/tables를 바꾸거나 DB/driver가 matched rows와 changed rows를 다르게 보고할 수 있습니다. target DB의 JDBC update count semantics를 실제 fixture로 고정합니다.",
    ],
    concepts: [
      c("replacement update", "요청 객체가 resource의 전체 writable state를 대표해 모든 field를 갱신하는 방식입니다.", ["누락과 null을 구분합니다.", "PUT-like semantics에 가깝습니다."]),
      c("patch update", "명시적으로 제공된 field만 변경하고 absent field를 보존하는 방식입니다.", ["tri-state command가 필요합니다.", "동적 set을 안전하게 구성합니다."]),
      c("optimistic locking", "version token을 WHERE에 넣고 affected count로 동시 변경 충돌을 탐지하는 제어입니다.", ["version을 원자적으로 증가시킵니다.", "0 count를 conflict로 처리합니다."]),
    ],
    codeExamples: [java("mybatis05-optimistic", "version predicate와 affected count", "MyBatis05Optimistic.java", "in-memory row에 expected version을 적용해 첫 update는 성공하고 stale update는 0으로 충돌하는 계약을 실행합니다.", String.raw`public class MyBatis05Optimistic {
  record Document(long id, String title, long version) {}
  static final class Store {
    Document document = new Document(7, "draft", 3);
    int update(long id, long expectedVersion, String title) {
      if (document.id() != id || document.version() != expectedVersion) return 0;
      document = new Document(id, title, expectedVersion + 1);
      return 1;
    }
  }

  public static void main(String[] args) {
    Store store = new Store();
    int first = store.update(7, 3, "published");
    int stale = store.update(7, 3, "stale overwrite");
    int missing = store.update(99, 4, "missing");
    System.out.println("first=" + first);
    System.out.println("stale=" + stale);
    System.out.println("missing=" + missing);
    System.out.println("state=" + store.document.title() + "|version=" + store.document.version());
    System.out.println("stale-outcome=CONFLICT");
  }
}`, "first=1\nstale=0\nmissing=0\nstate=published|version=4\nstale-outcome=CONFLICT", ["mybatis-sqlmap", "mybatis-java-api", "mybatis-spring-transactions"] )],
    diagnostics: [
      d("두 사용자가 수정하면 마지막 요청이 앞선 변경을 조용히 덮습니다.", "id predicate만 사용하고 version/ETag과 affected count를 검증하지 않았습니다.", ["UPDATE WHERE clause", "version field propagation", "affected count", "concurrent request timeline"], "version predicate+increment와 count=1 invariant를 적용하고 0을 conflict response로 반환합니다.", "two-writer barrier test와 retry/merge UX test를 둡니다."),
      d("patch에서 보내지 않은 field가 NULL로 지워집니다.", "absent와 explicit null을 같은 Java null로 표현해 full SET에 bind했습니다.", ["request deserialization presence", "patch command type", "dynamic SET clauses", "nullable domain policy"], "tri-state patch field와 whitelist SET builder를 사용하고 빈 patch를 거부합니다.", "absent/null/value 조합 property tests와 SQL shape snapshots를 둡니다."),
    ],
    expertNotes: ["optimistic locking은 DB lock을 없애는 기술이 아니라 충돌을 감지해 product가 해결하게 하는 protocol입니다.", "affected rows semantics는 DB/driver setting에 따라 matched/changed 차이가 있을 수 있어 supported matrix evidence가 필요합니다."],
  },
  {
    id: "delete-hard-soft-cascade-safety",
    title: "DELETE를 hard·soft·cascade·retention 정책으로 분리합니다",
    lead: "delete mapper 한 줄은 데이터 수명, 권한, 외래 키와 복구 가능성을 결정하므로 단순 CRUD의 마지막 글자가 아닙니다.",
    explanations: [
      "hard delete는 row를 물리적으로 제거하고 FK cascade/restrict/trigger를 따릅니다. soft delete는 deleted flag/time/actor를 update하고 모든 read/unique/index/retention query가 상태를 고려해야 합니다.",
      "단건 delete는 primary key와 tenant/owner/version 같은 authorization/concurrency predicate를 포함하고 affected=1을 검증합니다. identifier만 맞다고 삭제 권한이 생기는 것은 아닙니다.",
      "bulk delete는 허용 filter, dry-run count, maximum rows, approval/idempotency와 transaction timeout을 둡니다. 빈 조건이 전체 table delete가 되지 않도록 mapper API와 SQL 모두 fail-closed합니다.",
      "cascade는 application mapper count에 child rows가 모두 나타나지 않을 수 있습니다. DB FK action과 audit/change-data-capture, storage/object files 같은 external side effects를 전체 deletion plan에 포함합니다.",
      "privacy/retention delete는 즉시 logical hide와 비동기 physical purge를 분리할 수 있습니다. backup/search/cache replicas까지 SLA와 legal hold를 설계하고 delete log에 PII를 다시 남기지 않습니다.",
    ],
    concepts: [
      c("hard delete", "row를 물리적으로 제거하고 FK/trigger effects를 일으키는 삭제입니다.", ["복구와 audit를 설계합니다.", "cascade 범위를 확인합니다."]),
      c("soft delete", "상태 column을 갱신해 일반 조회에서 숨기고 후속 purge를 가능하게 하는 방식입니다.", ["모든 read path에 적용합니다.", "unique/index semantics를 재설계합니다."]),
      c("delete blast radius", "한 delete operation이 직접/cascade/external systems에서 제거하거나 숨기는 전체 data 범위입니다.", ["dry-run count로 예측합니다.", "상한과 승인을 둡니다."]),
    ],
    diagnostics: [
      d("tenant A 요청으로 tenant B row까지 삭제됩니다.", "delete predicate에 tenant scope가 없거나 runtime DB role/row policy가 광범위합니다.", ["WHERE predicates/binds", "effective tenant context", "DB row policy/grants", "affected count/audit"], "tenant+id+version predicate와 DB enforcement를 적용하고 예상 1행 외에는 rollback합니다.", "cross-tenant forbidden fixtures와 role authorization tests를 둡니다."),
      d("soft-delete한 row가 목록/unique check에서 다시 보이거나 신규 등록을 막습니다.", "read/unique/index 정책이 deleted state를 일관되게 반영하지 않습니다.", ["all mapped selects", "unique constraints/indexes", "cache keys", "restore/purge paths"], "active-row view/predicate와 DB별 partial/function index 전략을 중앙화하고 cache를 무효화합니다.", "deleted/active/restore/purge lifecycle integration suite를 둡니다."),
    ],
    expertNotes: ["soft delete는 UPDATE로 보이지만 product와 schema 전체를 바꾸는 state machine입니다.", "delete affected count만으로 cascade/external side effects 완료를 증명할 수 없어 operation saga/audit가 필요할 수 있습니다."],
  },
  {
    id: "jdbc-generated-keys-keyproperty",
    title: "useGeneratedKeys·keyProperty·keyColumn의 mutation 계약을 검증합니다",
    lead: "auto-increment key는 JDBC getGeneratedKeys 결과를 어느 객체 property에 어떤 column 순서로 주입할지까지 맞아야 합니다.",
    explanations: [
      "`useGeneratedKeys=true`는 MyBatis가 JDBC `Statement.getGeneratedKeys()`를 사용하도록 요청합니다. driver/DB가 실제 지원해야 하며 keyProperty는 반환 값을 쓸 parameter object property를 가리킵니다.",
      "keyColumn은 generated key column이 첫 column이 아니거나 DB가 column names를 요구할 때 중요합니다. multiple keys이면 property/column 순서와 row order를 supported driver에서 검증합니다.",
      "insert 호출 전 key가 unset이고 호출 후 같은 mutable object에 key가 채워질 수 있습니다. mapper return int를 generated key로 오해하지 말고 affected count와 mutated property를 각각 확인합니다.",
      "Map, nested parameter, list multi-row insert에서 keyProperty path와 object correlation이 복잡해집니다. 단순 typed parameter와 one-row key부터 인증하고 bulk key behavior는 별도 adapter/test로 격리합니다.",
      "key 값을 log/URL에 넣기보다 operation id와 key-present/count만 관측합니다. key가 PII가 아니어도 sequential identifier는 record volume과 접근 pattern을 노출할 수 있습니다.",
    ],
    concepts: [
      c("useGeneratedKeys", "DB/JDBC가 만든 key를 getGeneratedKeys로 받아 parameter object에 설정하도록 하는 mapped statement 속성입니다.", ["driver support가 필요합니다.", "insert/update에서 사용될 수 있습니다."]),
      c("keyProperty", "generated/selectKey 결과를 쓸 parameter object property path입니다.", ["setter/mutable target이 필요할 수 있습니다.", "여러 property는 순서를 검증합니다."]),
      c("keyColumn", "DB가 반환하는 generated column name과 keyProperty를 연결하는 속성입니다.", ["일부 DB에서 필요합니다.", "composite/multiple keys를 지원합니다."]),
    ],
    codeExamples: [java("mybatis05-generated-key", "generated key의 affected count·property mutation", "MyBatis05GeneratedKey.java", "mutable persistence command에 allocator key를 주입하고 호출 전후 key/affected contract를 확인합니다.", String.raw`import java.util.concurrent.atomic.AtomicLong;

public class MyBatis05GeneratedKey {
  static final class CreateCommand {
    Long id;
    final String title;
    CreateCommand(String title) { this.title = title; }
  }
  static final class MapperModel {
    final AtomicLong sequence = new AtomicLong(500);
    int insert(CreateCommand command) {
      if (command.id != null) throw new IllegalArgumentException("key-must-be-unset");
      command.id = sequence.incrementAndGet();
      return 1;
    }
  }

  public static void main(String[] args) {
    MapperModel mapper = new MapperModel();
    CreateCommand command = new CreateCommand("generated key contract");
    System.out.println("before-key=" + command.id);
    int affected = mapper.insert(command);
    System.out.println("affected=" + affected);
    System.out.println("after-key=" + command.id);
    System.out.println("key-present=" + (command.id != null));
    try { mapper.insert(command); }
    catch (IllegalArgumentException e) { System.out.println("reused-command=" + e.getMessage()); }
  }
}`, "before-key=null\naffected=1\nafter-key=501\nkey-present=true\nreused-command=key-must-be-unset", ["mybatis-sqlmap", "mybatis-key-generator", "mybatis-jdbc3-key-generator", "java-statement"] )],
    diagnostics: [
      d("insert는 1을 반환하지만 object id가 null입니다.", "mapper return을 key로 오해했거나 useGeneratedKeys/keyProperty/keyColumn/driver support가 맞지 않습니다.", ["MappedStatement key generator", "keyProperty/keyColumn", "object setter/path", "JDBC generated keys metadata"], "지원 DB 설정과 정확한 property/column을 지정하고 호출 후 key-present와 persisted row를 assert합니다.", "actual driver one/multi-row generated-key contract tests를 둡니다."),
      d("multi-row insert에서 keys가 다른 objects에 들어갑니다.", "driver 반환 order/count와 collection object correlation을 검증하지 않았습니다.", ["input object order", "generated key ResultSet order/count", "keyProperty path", "driver rewrite/batch settings"], "bulk generated keys를 지원 matrix로 인증하거나 client/sequence ids로 사전 할당해 correlation을 명시합니다.", "비연속/trigger-generated/multi-row key fixture와 count mismatch failure를 둡니다."),
    ],
    expertNotes: ["generated key 주입은 mapper parameter의 observable mutation이므로 concurrency 공유나 command 재사용을 금지합니다.", "JDBC getGeneratedKeys 지원이라는 문장만으로 driver별 multi-row ordering/column metadata까지 보장되지 않습니다."],
  },
  {
    id: "selectkey-sequence-before-after",
    title: "selectKey BEFORE·AFTER와 database sequence의 실행 순서를 구분합니다",
    lead: "auto-increment가 아닌 DB에서는 key를 INSERT 전후 어느 statement로 얻는지가 transaction·trigger·round-trip과 객체 상태를 바꿉니다.",
    explanations: [
      "`<selectKey>`는 별도 key statement 결과를 keyProperty에 설정합니다. BEFORE는 key를 먼저 얻어 object에 넣은 뒤 insert하고, AFTER는 insert 뒤 key query를 실행합니다.",
      "Oracle sequence NEXTVAL은 concurrent-safe하게 unique 값을 제공하지만 rollback되어도 gap이 생길 수 있고 cache/order 설정이 성능과 순서 의미에 영향을 줍니다. key가 연속이어야 한다는 business 요구와 surrogate identity를 분리합니다.",
      "sequence NEXTVAL을 insert expression에 직접 쓰면서 key도 필요하면 RETURNING/JDBC/selectKey AFTER 등 DB/driver별 방식이 있습니다. 임의의 `MAX(id)+1`은 concurrent transaction race로 duplicate를 만들므로 사용하지 않습니다.",
      "selectKey resultType, keyProperty/keyColumn과 statementType을 실제 반환 type에 맞춥니다. BEFORE key를 얻은 뒤 insert가 실패하면 object에 key가 남아도 row는 존재하지 않을 수 있습니다.",
      "key allocation event와 row durability를 분리해 state machine으로 표현합니다: UNASSIGNED→ALLOCATED→INSERTED→COMMITTED 또는 FAILED_WITH_ALLOCATED_KEY. retry는 같은 key/idempotency 정책을 명시합니다.",
    ],
    concepts: [
      c("selectKey", "별도 statement로 key 값을 조회해 parameter property에 설정하는 mapper 요소입니다.", ["BEFORE/AFTER order가 있습니다.", "result type/property를 명시합니다."]),
      c("database sequence", "transaction과 독립적으로 NEXTVAL을 할당하는 database object입니다.", ["동시 unique allocation을 제공합니다.", "rollback gap이 정상일 수 있습니다."]),
      c("allocated-but-not-persisted", "key는 parameter object에 있지만 insert/commit 실패로 실제 row는 없는 상태입니다.", ["재시도 정책이 필요합니다.", "존재 readback으로 구분합니다."]),
    ],
    codeExamples: [java("mybatis05-select-key-order", "selectKey BEFORE·AFTER event order", "MyBatis05SelectKeyOrder.java", "key allocation, insert와 property assignment 이벤트 순서를 두 mode에서 비교합니다.", String.raw`import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

public class MyBatis05SelectKeyOrder {
  enum Order { BEFORE, AFTER }
  static List<String> execute(Order order, AtomicLong sequence) {
    List<String> events = new ArrayList<>();
    Long key = null;
    if (order == Order.BEFORE) {
      key = sequence.incrementAndGet();
      events.add("allocate:" + key);
      events.add("assign-before-insert");
    }
    events.add("insert");
    if (order == Order.AFTER) {
      key = sequence.incrementAndGet();
      events.add("allocate:" + key);
      events.add("assign-after-insert");
    }
    events.add("key-present:" + (key != null));
    return events;
  }

  public static void main(String[] args) {
    AtomicLong sequence = new AtomicLong(700);
    System.out.println("before=" + execute(Order.BEFORE, sequence));
    System.out.println("after=" + execute(Order.AFTER, sequence));
    System.out.println("next-sequence=" + sequence.get());
    System.out.println("rollback-can-have-gap=true");
  }
}`, "before=[allocate:701, assign-before-insert, insert, key-present:true]\nafter=[insert, allocate:702, assign-after-insert, key-present:true]\nnext-sequence=702\nrollback-can-have-gap=true", ["mybatis-sqlmap", "mybatis-select-key-generator", "oracle-create-sequence", "oracle-sequence-pseudocolumns"] )],
    diagnostics: [
      d("rollback 후 sequence 번호가 비어 있어 장애라고 판단합니다.", "sequence를 gapless business number로 오해했습니다.", ["sequence cache/order/cycle settings", "rollback timeline", "business numbering requirement", "key usage"], "surrogate key gap을 정상으로 수용하고 gapless 법적 번호는 별도 serialized ledger/allocation 정책으로 설계합니다.", "rollback/crash/cache failover sequence tests와 business invariant를 분리합니다."),
      d("BEFORE selectKey 후 insert 실패인데 object id가 남아 재사용됩니다.", "allocated key와 persisted/committed row 상태를 구분하지 않았습니다.", ["object lifecycle", "insert/commit outcome", "existence readback", "retry idempotency"], "create result에 persistence state를 포함하고 failed command/object를 재사용하지 않거나 같은 operation key로 reconcile합니다.", "constraint failure after allocation과 retry test를 둡니다."),
    ],
    expertNotes: ["sequence value의 증가 순서는 commit 순서나 event 시간 순서를 보장하지 않습니다.", "DB-specific key strategy를 mapper adapter로 격리하면 domain service가 useGeneratedKeys/selectKey 차이에 오염되지 않습니다."],
  },
  {
    id: "key-strategy-concurrency-portability",
    title: "auto-increment·sequence·client key를 concurrency와 portability 관점에서 선택합니다",
    lead: "생성 키 전략은 문법보다 분산 생성, index locality, 정보 노출, multi-DB와 retry correlation의 trade-off입니다.",
    explanations: [
      "MySQL AUTO_INCREMENT는 DB가 insert 중 값을 생성하고 JDBC generated keys로 받을 수 있습니다. commit rollback과 concurrent inserts에서 값 gap/ordering을 business time으로 사용하지 않습니다.",
      "Oracle sequence는 insert 전 key 할당이 가능해 parent-child graph를 미리 연결하기 쉽습니다. sequence cache와 RAC ordering trade-off를 이해하고 `NEXTVAL`을 공식 semantics에 맞춰 사용합니다.",
      "UUID/ULID 같은 client-generated key는 DB round-trip 전에 identity를 갖고 idempotency correlation에 유리하지만 key size, randomness/index fragmentation, monotonicity와 privacy를 평가합니다.",
      "`SELECT MAX(id)+1`과 application counter는 concurrent-safe하지 않습니다. transaction isolation을 높여 억지로 serialize하기보다 DB sequence/identity 또는 collision-safe client generator를 사용합니다.",
      "multi-database mapper는 databaseId/provider 또는 repository adapter로 key SQL을 분리하고 domain에 typed id만 반환합니다. 하나의 dialect trick을 조건문으로 곳곳에 흩뜨리지 않습니다.",
    ],
    concepts: [
      c("AUTO_INCREMENT", "MySQL이 insert 시 numeric identity를 자동 생성하는 column 속성입니다.", ["generated keys로 회수할 수 있습니다.", "gap/commit order를 보장하지 않습니다."]),
      c("client-generated key", "application이 DB insert 전에 충돌 가능성을 통제해 만드는 identity입니다.", ["retry correlation에 유리합니다.", "index/storage/privacy trade-off가 있습니다."]),
      c("key strategy adapter", "DB별 생성/회수 방식을 감추고 동일 typed create result를 제공하는 persistence boundary입니다.", ["dialect를 격리합니다.", "matrix tests를 가집니다."]),
    ],
    diagnostics: [
      d("동시 insert에서 MAX+1 key가 충돌합니다.", "현재 최대값 조회와 insert 사이가 원자적 allocation이 아닙니다.", ["key query pattern", "unique constraint errors", "concurrent timelines", "sequence/identity availability"], "DB sequence/identity 또는 검증된 client generator로 교체하고 unique constraint를 유지합니다.", "barrier-based concurrent insert stress와 duplicate-key mapping test를 둡니다."),
      d("UUID 전환 뒤 index 크기와 insert latency가 급증합니다.", "key size/order와 clustered index locality를 workload evidence 없이 변경했습니다.", ["index/storage size", "page splits/cache hit", "insert p99", "key encoding/order distribution"], "ordered/binary representation과 secondary surrogate 전략을 benchmark하고 rollout/rollback합니다.", "production-like cardinality load와 query plan/storage budget gate를 둡니다."),
    ],
    expertNotes: ["identity에 creation time 또는 tenant 정보를 encode하면 편리하지만 enumeration/privacy와 clock semantics를 함께 검토합니다.", "portable domain id와 database-specific physical key가 항상 같은 값일 필요는 없습니다."],
  },
  {
    id: "service-transaction-multiple-writes",
    title: "여러 Mapper write를 service transaction 하나로 묶습니다",
    lead: "각 mapper 호출이 1행을 성공해도 business invariant에 필요한 모든 write가 함께 commit되지 않으면 데이터가 깨집니다.",
    explanations: [
      "transaction boundary는 repository method가 아니라 business unit-of-work에 둡니다. 예를 들어 parent insert, child insert와 audit/outbox가 모두 성공하거나 함께 rollback되어야 합니다.",
      "base MyBatis는 SqlSession owner가 commit/rollback/close하고 MyBatis-Spring은 같은 DataSource를 사용하는 Spring transaction manager가 session을 transaction 동안 관리합니다. manual commit과 Spring-managed mapper를 섞지 않습니다.",
      "checked/runtime exception과 catch/translate 정책이 rollback rule을 바꿀 수 있습니다. 실패를 삼키고 success를 반환하지 않으며 domain exception translation 뒤에도 transaction rollback-only 상태를 확인합니다.",
      "DB write와 외부 HTTP/message publish는 하나의 local transaction으로 원자화되지 않습니다. outbox pattern과 idempotent consumer를 사용해 commit된 event를 안정적으로 전달합니다.",
      "transaction timeout, isolation, lock order와 retry는 service use case별로 설정합니다. deadlock retry는 전체 idempotent unit-of-work를 새 transaction에서 bounded backoff로 재실행합니다.",
    ],
    concepts: [
      c("unit of work", "business invariant를 만족하기 위해 함께 commit/rollback해야 하는 write 집합입니다.", ["service boundary가 소유합니다.", "하나의 transaction resource에 묶습니다."]),
      c("Spring-managed SqlSession", "Spring transaction 동안 같은 DataSource connection/session에 mapper 호출을 참여시키는 MyBatis-Spring 경계입니다.", ["manual commit/close하지 않습니다.", "factory와 transaction manager DataSource가 같아야 합니다."]),
      c("transactional outbox", "domain data와 event row를 같은 DB transaction에 기록하고 별도 publisher가 전송하는 패턴입니다.", ["external atomicity gap을 줄입니다.", "consumer idempotency가 필요합니다."]),
    ],
    codeExamples: [java("mybatis05-transaction", "여러 write의 commit·rollback snapshot", "MyBatis05Transaction.java", "in-memory state snapshot을 사용해 두 write 중 두 번째 실패 시 전체 rollback되는 unit-of-work를 실행합니다.", String.raw`import java.util.*;

public class MyBatis05Transaction {
  static final class Database {
    Map<String, Integer> balances = new LinkedHashMap<>();
    Database() {
      balances.put("A", 100);
      balances.put("B", 40);
    }
    boolean transfer(int amount, boolean failSecondWrite) {
      Map<String, Integer> before = new LinkedHashMap<>(balances);
      try {
        balances.put("A", balances.get("A") - amount);
        if (failSecondWrite) throw new IllegalStateException("synthetic-second-write-failure");
        balances.put("B", balances.get("B") + amount);
        return true;
      } catch (RuntimeException failure) {
        balances = before;
        return false;
      }
    }
  }

  public static void main(String[] args) {
    Database db = new Database();
    System.out.println("failed-commit=" + db.transfer(30, true));
    System.out.println("after-rollback=" + db.balances);
    System.out.println("successful-commit=" + db.transfer(30, false));
    System.out.println("after-commit=" + db.balances);
    System.out.println("total=" + db.balances.values().stream().mapToInt(Integer::intValue).sum());
  }
}`, "failed-commit=false\nafter-rollback={A=100, B=40}\nsuccessful-commit=true\nafter-commit={A=70, B=70}\ntotal=140", ["mybatis-java-api", "mybatis-spring-transactions", "java-connection"] )],
    diagnostics: [
      d("첫 mapper write만 commit되고 두 번째 실패가 남습니다.", "각 mapper가 다른 session/autocommit 또는 transaction manager 밖에서 실행됐습니다.", ["transaction proxy entry", "DataSource identity", "session/connection ids", "autocommit/commit traces"], "service unit-of-work에 Spring transaction을 두고 factory/manager가 같은 DataSource를 사용하게 합니다.", "두 번째 write failure integration test에서 두 table 모두 rollback을 assert합니다."),
      d("예외를 catch해 응답은 정상인데 transaction은 부분 상태입니다.", "exception을 삼키거나 rollback rule 밖의 예외로 변환했습니다.", ["catch/translation path", "rollback-only state", "exception type/rules", "commit event"], "실패를 재throw하거나 explicit rollback-only/domain result policy를 적용하고 commit readback을 확인합니다.", "checked/runtime/translated exception matrix와 commit spy test를 둡니다."),
    ],
    expertNotes: ["transaction annotation 위치보다 실제 proxy call path와 동일 connection participation evidence가 중요합니다.", "outbox도 publisher exactly-once를 보장하지 않으므로 event idempotency와 replay/reconciliation을 설계합니다."],
  },
  {
    id: "batch-executor-flush-partial-failure",
    title: "ExecutorType.BATCH의 flush·counts·부분 실패를 해석합니다",
    lead: "BATCH mapper 호출의 즉시 return은 최종 DB update count가 아닐 수 있으며 flush/commit에서 실제 오류가 나타납니다.",
    explanations: [
      "BatchExecutor는 동일 statement/SQL을 모아 JDBC batch로 보내고 flushStatements에서 BatchResult를 반환합니다. mapper update call의 임시 return을 일반 SIMPLE executor affected count와 동일하게 해석하지 않습니다.",
      "statement shape가 dynamic SQL로 row마다 달라지면 batch grouping이 분산됩니다. 모든 parameter를 매 row 다시 bind하고 batch size/flush cadence를 memory, packet, locks와 error localization으로 결정합니다.",
      "JDBC counts에는 exact non-negative, SUCCESS_NO_INFO와 EXECUTE_FAILED가 올 수 있습니다. driver가 failure 뒤 중단/계속하는지와 counts 길이를 input index에 안전하게 correlate합니다.",
      "all-or-nothing이면 어떤 batch row failure도 transaction 전체 rollback입니다. partial import면 savepoint/chunk, row result report와 idempotency를 명시하며 성공한 earlier chunks의 commit policy를 사용자에게 보여 줍니다.",
      "batch 중 query를 실행하면 pending statements flush가 일어날 수 있습니다. execution order와 generated key availability를 mapper 호출 순서가 아니라 actual flush events로 관측합니다.",
    ],
    concepts: [
      c("BatchExecutor", "mapped writes를 JDBC batches로 모으고 flush 시 실행하는 MyBatis Executor입니다.", ["즉시 return semantics가 다릅니다.", "transaction과 함께 사용합니다."]),
      c("flushStatements", "대기 batch를 DB에 보내 BatchResult/update counts를 얻는 경계입니다.", ["query/commit 전에 발생할 수 있습니다.", "실제 오류가 이때 나타날 수 있습니다."]),
      c("partial batch failure", "batch 일부 command만 실행/성공하고 나머지 실패/미실행인 상태입니다.", ["counts/index를 correlate합니다.", "rollback/partial 정책을 명시합니다."]),
    ],
    codeExamples: [java("mybatis05-batch", "JDBC batch count 해석과 rollback 결정", "MyBatis05Batch.java", "JDBC Statement sentinel을 exact/unknown/failed로 분류하고 transaction decision을 계산합니다.", String.raw`import java.sql.Statement;
import java.util.*;

public class MyBatis05Batch {
  record Summary(int exactRows, int unknownSuccess, int failed, String decision) {}
  static Summary summarize(int[] counts) {
    int exact = 0, unknown = 0, failed = 0;
    for (int count : counts) {
      if (count >= 0) exact += count;
      else if (count == Statement.SUCCESS_NO_INFO) unknown++;
      else if (count == Statement.EXECUTE_FAILED) failed++;
      else throw new IllegalArgumentException("unknown-count:" + count);
    }
    return new Summary(exact, unknown, failed, failed == 0 ? "COMMIT" : "ROLLBACK_ALL");
  }

  public static void main(String[] args) {
    int[] counts = {1, Statement.SUCCESS_NO_INFO, 2, Statement.EXECUTE_FAILED};
    Summary summary = summarize(counts);
    System.out.println("entries=" + counts.length);
    System.out.println("exact-rows=" + summary.exactRows());
    System.out.println("unknown-success=" + summary.unknownSuccess());
    System.out.println("failed=" + summary.failed());
    System.out.println("decision=" + summary.decision());
    System.out.println("input-indexes=" + java.util.stream.IntStream.range(0, counts.length).boxed().toList());
  }
}`, "entries=4\nexact-rows=3\nunknown-success=1\nfailed=1\ndecision=ROLLBACK_ALL\ninput-indexes=[0, 1, 2, 3]", ["mybatis-batch-executor", "java-statement", "java-prepared-statement"] )],
    diagnostics: [
      d("BATCH mapper return count를 1로 기대해 모두 실패로 판정합니다.", "BatchExecutor의 deferred return과 flush update counts를 SIMPLE executor처럼 해석했습니다.", ["ExecutorType", "flushStatements results", "commit timing", "BatchResult statement/parameters"], "batch path는 flush/commit 결과에서 row correlation을 계산하고 mapper 즉시 return에 domain 판단을 두지 않습니다.", "SIMPLE/BATCH contract를 분리한 integration tests를 둡니다."),
      d("batch 중간 실패 뒤 일부 rows가 남습니다.", "autocommit/chunk commit과 failure rollback policy가 의도와 다릅니다.", ["transaction boundaries", "chunk/flush cadence", "counts length/sentinels", "persisted rows"], "all-or-nothing은 하나의 explicit transaction으로 rollback하고 partial은 committed chunks와 row outcomes를 명시합니다.", "각 index constraint failure와 response loss에서 persisted set을 assert합니다."),
    ],
    expertNotes: ["batch는 API 호출 수가 아니라 actual JDBC executions와 flush events를 줄이는 최적화입니다.", "generated keys와 batch rewrite는 driver-specific이므로 성능 flag 변경 때 correctness matrix를 다시 실행합니다."],
  },
  {
    id: "idempotency-unknown-commit-retry",
    title: "idempotency key와 reconciliation으로 unknown commit을 처리합니다",
    lead: "connection이 끊긴 시점에 DB commit이 성공했는지 모르면 같은 INSERT를 재시도하는 것만으로 안전하지 않습니다.",
    explanations: [
      "timeout/connection reset이 commit request 전, DB commit 후 response 전 또는 rollback 중 어디서 났는지 client는 알 수 없을 수 있습니다. 이 ambiguous outcome을 transient failure와 별도 category로 둡니다.",
      "create command에 stable idempotency key를 부여하고 DB unique constraint로 한 번만 적용합니다. repeated request는 같은 payload/result를 반환하고 다른 payload면 conflict로 거부합니다.",
      "generated surrogate key만으로 idempotency를 구현하면 retry 전에 key를 모를 수 있습니다. client operation id 또는 deterministic domain key를 separate unique column에 둡니다.",
      "reconciliation은 operation table/outbox/domain row를 key로 조회해 COMMITTED/NOT_FOUND/IN_PROGRESS/CONFLICT를 판단합니다. raw payload/secret을 log key로 사용하지 않습니다.",
      "deadlock/serialization failure처럼 DB가 확실히 rollback한 retryable error와 unknown commit을 구분합니다. retry는 bounded attempts/backoff/jitter와 전체 deadline 아래 새 transaction에서 수행합니다.",
    ],
    concepts: [
      c("idempotency key", "같은 logical write 재요청을 식별해 한 번의 효과와 동일 result를 보장하는 stable operation key입니다.", ["DB unique constraint로 강제합니다.", "payload fingerprint를 연결합니다."]),
      c("ambiguous commit", "client가 transaction commit 성공/실패를 확정할 수 없는 통신 실패 상태입니다.", ["blind retry를 금지합니다.", "reconciliation이 필요합니다."]),
      c("reconciliation", "operation key로 persisted state를 조회해 불확실한 write outcome을 확정/복구하는 절차입니다.", ["readback evidence를 남깁니다.", "manual escalation path를 둡니다."]),
    ],
    diagnostics: [
      d("timeout retry 뒤 주문/게시글이 두 번 생성됩니다.", "commit 성공 후 응답 손실을 rollback 실패로 간주하고 새 key로 재INSERT했습니다.", ["operation/idempotency key", "unique constraints", "commit/network timeline", "duplicate payload fingerprints"], "stable operation key+unique constraint를 적용하고 timeout 후 readback으로 기존 result를 반환합니다.", "response-loss-after-commit fault test와 repeated request invariant를 둡니다."),
      d("idempotency key 재사용으로 다른 payload가 기존 성공처럼 처리됩니다.", "key만 비교하고 normalized payload/actor/scope를 확인하지 않았습니다.", ["key scope/owner", "payload fingerprint", "stored result", "expiry/reuse policy"], "tenant+operation key와 canonical payload hash를 함께 저장해 mismatch를 conflict/security event로 처리합니다.", "same-key same/different-payload/tenant corpus와 expiry boundary test를 둡니다."),
    ],
    expertNotes: ["exactly-once API라는 표현보다 at-least-once transport 위 idempotent effect와 deterministic result라고 설명하는 편이 정확합니다.", "idempotency record retention이 request retry window보다 짧으면 늦은 retry가 다시 실행될 수 있습니다."],
  },
  {
    id: "write-security-observability-testing",
    title: "최소 권한·safe telemetry·target DB failure matrix로 CRUD를 운영합니다",
    lead: "CRUD mapper correctness는 happy-path unit test가 아니라 권한, constraint, lock, driver key behavior와 장애 후 persisted state까지 확인해야 합니다.",
    explanations: [
      "runtime DB role에는 필요한 table/view의 최소 SELECT/INSERT/UPDATE/DELETE만 부여하고 DDL, account, 다른 schema/tenant, sequence 관리 권한을 분리합니다. sequence NEXTVAL 사용 권한도 최소화합니다.",
      "write telemetry에는 statement id, command type, affected count class(0/1/many), key-present, batch size, transaction outcome, SQLState class, elapsed와 version만 둡니다. parameter object/toString, raw SQL, generated key 값과 row body는 제외합니다.",
      "unit tests는 counts/key state machine/optimistic/idempotency를 빠르게, actual DB integration은 constraints, trigger, generated keys, sequences, locks, update count와 rollback/readback을 검증합니다.",
      "failure corpus는 duplicate/FK/check/not-null, stale version, deadlock, lock timeout, batch middle error, disconnect before/after commit, key ResultSet mismatch와 insufficient privilege를 포함합니다.",
      "MyBatis/JDK/driver/DB/schema upgrade는 CRUD matrix를 canary하고 count/key/error mapping과 performance를 version별 비교합니다. migration과 mapper rollback compatibility를 함께 rehearsal합니다.",
    ],
    concepts: [
      c("write telemetry envelope", "값 없이 statement/command/count/key-presence/transaction/error/version을 기록하는 구조입니다.", ["PII/secret을 제외합니다.", "reconciliation에 사용합니다."]),
      c("constraint error mapping", "SQLState/vendor/constraint identity를 stable domain conflict/validation category로 변환하는 정책입니다.", ["raw vendor message를 노출하지 않습니다.", "version별 fixture를 둡니다."]),
      c("write conformance matrix", "JDK/MyBatis/driver/DB/schema/executor 조합별 count/key/constraint/transaction 기대값입니다.", ["upgrade gate입니다.", "persisted state를 검증합니다."]),
    ],
    diagnostics: [
      d("constraint 오류 응답/log에 SQL과 사용자 입력 전체가 노출됩니다.", "SQLException/parameter object를 raw serialize했습니다.", ["exception translation", "JDBC/MyBatis logging", "APM attributes", "retention/access"], "stable constraint/domain code와 statement id만 남기고 노출 data/secret을 rotate·삭제·접근 통제합니다.", "synthetic PII/secret canary와 log schema assertions를 둡니다."),
      d("테스트는 통과하지만 production driver에서 generated key/count가 다릅니다.", "mock/in-memory model만 사용해 driver/DB semantics를 인증하지 않았습니다.", ["actual driver version/settings", "key ResultSet metadata", "update count behavior", "trigger/schema differences"], "supported actual DB matrix에서 one/multi-row, trigger, batch와 transaction readback tests를 release gate로 둡니다.", "driver/config canary와 old/new result diff budget을 둡니다."),
    ],
    expertNotes: ["write incident의 source of truth는 mapper return만이 아니라 committed DB state와 operation ledger입니다.", "권한/constraint/trigger 변경은 mapper source가 그대로여도 write semantics를 바꾸므로 application release처럼 검증합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-score-mapper", repository: "SPRING/SpringBasic", path: "src/main/resources/sqlmap/ScoreMapper.xml", usedFor: ["sequence-backed insert, scalar resultType select and id delete learning progression"], evidence: "read-only로 18 lines/765 bytes를 확인했으며 namespace·SQL/property literal은 예제에 복사하지 않았습니다." },
  { id: "mybatis-sqlmap", repository: "MyBatis 3 Documentation", path: "Mapper XML Files", publicUrl: "https://mybatis.org/mybatis-3/sqlmap-xml.html", usedFor: ["insert/update/delete attributes, useGeneratedKeys, keyProperty/keyColumn and selectKey"], evidence: "MyBatis 공식 Mapper XML reference 3.5.19입니다." },
  { id: "mybatis-java-api", repository: "MyBatis 3 Documentation", path: "Java API", publicUrl: "https://mybatis.org/mybatis-3/java-api.html", usedFor: ["SqlSession write returns, commit/rollback, executor and batch API"], evidence: "MyBatis 공식 Java API reference입니다." },
  { id: "mybatis-mapped-statement", repository: "MyBatis 3 API", path: "MappedStatement", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/mapping/MappedStatement.html", usedFor: ["command type, key generator, key properties/columns and cache/timeout metadata"], evidence: "MyBatis 공식 MappedStatement API 3.5.19입니다." },
  { id: "mybatis-key-generator", repository: "MyBatis 3 API", path: "KeyGenerator", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/executor/keygen/KeyGenerator.html", usedFor: ["processBefore/processAfter key generation lifecycle"], evidence: "MyBatis 공식 KeyGenerator API 3.5.19입니다." },
  { id: "mybatis-jdbc3-key-generator", repository: "MyBatis 3 API", path: "Jdbc3KeyGenerator", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/executor/keygen/Jdbc3KeyGenerator.html", usedFor: ["JDBC getGeneratedKeys assignment behavior"], evidence: "MyBatis 공식 Jdbc3KeyGenerator API 3.5.19입니다." },
  { id: "mybatis-select-key-generator", repository: "MyBatis 3 API", path: "SelectKeyGenerator", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/executor/keygen/SelectKeyGenerator.html", usedFor: ["BEFORE/AFTER selectKey execution"], evidence: "MyBatis 공식 SelectKeyGenerator API 3.5.19입니다." },
  { id: "mybatis-batch-executor", repository: "MyBatis 3 API", path: "BatchExecutor", publicUrl: "https://mybatis.org/mybatis-3/apidocs/org/apache/ibatis/executor/BatchExecutor.html", usedFor: ["deferred update and flushStatements batch results"], evidence: "MyBatis 공식 BatchExecutor API 3.5.19입니다." },
  { id: "mybatis-spring-transactions", repository: "MyBatis-Spring Documentation", path: "Transactions", publicUrl: "https://mybatis.org/spring/transactions.html", usedFor: ["Spring transaction/session ownership and DataSource identity"], evidence: "MyBatis-Spring 공식 transaction reference입니다." },
  { id: "java-statement", repository: "Java SE 21 API", path: "java.sql.Statement", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html", usedFor: ["getGeneratedKeys, RETURN_GENERATED_KEYS and batch update count sentinels"], evidence: "Oracle JDK 공식 Statement API입니다." },
  { id: "java-prepared-statement", repository: "Java SE 21 API", path: "java.sql.PreparedStatement", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/PreparedStatement.html", usedFor: ["typed write execution, addBatch and update counts"], evidence: "Oracle JDK 공식 PreparedStatement API입니다." },
  { id: "java-connection", repository: "Java SE 21 API", path: "java.sql.Connection", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html", usedFor: ["prepare flags, transaction commit/rollback and savepoint ownership"], evidence: "Oracle JDK 공식 Connection API입니다." },
  { id: "oracle-create-sequence", repository: "Oracle Database 26ai SQL Language Reference", path: "CREATE SEQUENCE", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CREATE-SEQUENCE.html", usedFor: ["sequence options, cache/order/cycle semantics"], evidence: "Oracle 공식 CREATE SEQUENCE reference입니다." },
  { id: "oracle-sequence-pseudocolumns", repository: "Oracle Database 26ai SQL Language Reference", path: "Sequence Pseudocolumns", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Sequence-Pseudocolumns.html", usedFor: ["NEXTVAL/CURRVAL usage and restrictions"], evidence: "Oracle 공식 sequence pseudocolumn reference입니다." },
  { id: "mysql-auto-increment", repository: "MySQL 8.4 Reference Manual", path: "Using AUTO_INCREMENT", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/example-auto-increment.html", usedFor: ["auto-increment creation and LAST_INSERT_ID behavior context"], evidence: "MySQL 공식 AUTO_INCREMENT reference입니다." },
];

const session = createExpertSession({
  inventoryId: "mybatis-05-crud-generated-key", slug: "mybatis-05-crud-generated-key", courseId: "spring", moduleId: "mybatis-mapping", order: 5,
  title: "INSERT·UPDATE·DELETE와 생성 키 처리", subtitle: "CRUD를 영향 행 수·generated key/sequence·낙관적 잠금·transaction·batch·idempotency·reconciliation까지 검증 가능한 write contract로 만듭니다.", level: "중급", estimatedMinutes: 960,
  coreQuestion: "Mapper write가 원하는 행만 원자적으로 변경하고 올바른 생성 키와 결과를 반환했으며, 장애와 재시도 뒤에도 중복·부분 상태가 없음을 어떻게 증명할까요?",
  summary: "SpringBasic의 ScoreMapper.xml을 read-only로 감사해 VO property insert, sequence NEXTVAL, resultType select와 단일 id delete의 학습 진행을 구조 provenance로 사용합니다. 선행 result mapping 용어를 연결하면서 mapped write lifecycle, insert column/default/constraint, replacement·patch·optimistic update, hard/soft delete, JDBC generated keys/keyProperty/keyColumn, selectKey BEFORE/AFTER와 Oracle sequence, MySQL auto-increment/client key portability, service transaction, BatchExecutor flush/counts, idempotency와 ambiguous commit reconciliation, 최소 권한·safe telemetry·actual DB conformance까지 중급에서 운영 전문가 수준으로 확장합니다. 여섯 JDK 21 examples는 CRUD counts, optimistic conflict, generated-key mutation, selectKey order, multi-write rollback과 batch partial result를 실제 실행합니다.",
  objectives: ["MappedStatement write lifecycle과 affected-row invariant를 설명한다.", "INSERT column/default/NULL/constraint와 generated property mutation을 검증한다.", "replacement/patch/optimistic UPDATE와 hard/soft DELETE outcome을 설계한다.", "useGeneratedKeys/keyProperty/keyColumn과 selectKey BEFORE/AFTER를 구분한다.", "sequence/auto-increment/client key의 concurrency·portability trade-off를 평가한다.", "service transaction과 BatchExecutor partial failure를 정확히 처리한다.", "idempotency/unknown commit/reconciliation 및 최소 권한·safe telemetry를 운영한다."],
  prerequisites: [{ title: "resultType·resultMap과 컬럼-객체 매핑", reason: "write parameter/result 객체와 DB projection mapping 계약을 이해한 뒤 CRUD count와 생성 키 mutation을 이어서 다룹니다.", sessionSlug: "mybatis-04-resulttype-resultmap" }],
  keywords: ["INSERT", "UPDATE", "DELETE", "affected rows", "useGeneratedKeys", "keyProperty", "keyColumn", "selectKey", "sequence", "AUTO_INCREMENT", "optimistic locking", "BatchExecutor", "transaction", "idempotency", "ambiguous commit"], topics,
  lab: {
    title: "점수 CRUD를 count·key·transaction·retry-safe write contract로 재구성하기",
    scenario: "legacy mapper는 sequence insert와 delete는 있지만 mapper return/count를 검사하지 않고, UPDATE·generated key·batch·transaction·retry 정책이 없습니다.",
    setup: ["원본 ScoreMapper.xml은 read-only provenance로 보존하고 namespace/SQL/property literal을 공개 code에 복사하지 않습니다.", "JDK 21 harness와 별도로 supported MyBatis/JDK/driver, MySQL auto-increment·Oracle sequence ephemeral schemas를 준비합니다.", "statement별 command type, parameter schema, expected counts, key strategy, transaction/idempotency와 required role 표를 작성합니다.", "duplicate/FK/check/not-null/stale/deadlock/lock timeout/batch middle/commit response-loss synthetic fixtures를 고정합니다."],
    steps: ["insert/update/delete mapper return을 int 또는 typed result로 받아 0/1/many invariant를 적용합니다.", "INSERT column list와 omitted/default/null/value 및 DB constraints를 schema와 맞춥니다.", "full replacement와 tri-state patch를 분리하고 version predicate+increment를 적용합니다.", "hard/soft delete의 tenant/version predicate, cascade와 retention blast radius를 검증합니다.", "MySQL useGeneratedKeys/keyProperty/keyColumn에서 object mutation과 persisted key를 readback합니다.", "Oracle selectKey/sequence BEFORE/AFTER와 allocation-failure/rollback gap을 실행합니다.", "MAX+1을 제거하고 auto-increment/sequence/client key adapter의 concurrency를 stress-test합니다.", "여러 mapper writes를 하나의 Spring transaction과 동일 DataSource/session에 묶고 failure rollback을 확인합니다.", "BatchExecutor의 flush cadence, counts/index와 all-or-nothing/partial policy를 fault-test합니다.", "idempotency key unique constraint와 response-loss-after-commit reconciliation을 실행합니다.", "runtime/migration role 권한을 분리하고 forbidden object/tenant write를 거부합니다.", "statement/count class/key-present/transaction/error/version만 기록하는 telemetry와 upgrade canary를 검증합니다."],
    expectedResult: ["각 CRUD가 0/1/many를 의도한 domain outcome으로 반환하고 unexpected count는 commit 전에 실패합니다.", "generated/sequence key가 올바른 object와 persisted row에 연결되고 allocation-only 상태가 구분됩니다.", "optimistic conflict, partial batch와 multi-write failure가 명시적 rollback/partial policy를 따릅니다.", "ambiguous commit retry가 duplicate를 만들지 않고 operation ledger readback으로 확정됩니다.", "최소 권한과 safe telemetry/actual DB matrix가 raw data 노출 없이 write 결과를 설명합니다."],
    cleanup: ["ephemeral rows/tables/sequences/idempotency/outbox records와 test identities를 제거합니다.", "batch/session/connection/transactions를 close/rollback하고 pool active baseline을 확인합니다.", "logs/traces/snapshots에서 raw parameters/generated keys/synthetic canary가 없는지 검사 후 삭제합니다.", "원본 mapper와 production schema/data는 변경하지 않습니다."],
    extensions: ["databaseId 기반 MySQL/Oracle key strategy adapter를 구현합니다.", "transactional outbox publisher와 idempotent consumer를 추가합니다.", "large batch generated-key correlation과 driver rewrite matrix를 benchmark합니다.", "schema/constraint/role drift를 MappedStatement write manifest와 자동 비교합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Java examples를 실행해 count, key, conflict, transaction과 batch 결과를 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "CRUD 0/1 counts를 domain outcome과 연결합니다.", "stale optimistic update가 기존 state를 보존하는지 확인합니다.", "generated key 전후 object state를 추적합니다.", "selectKey BEFORE/AFTER event order와 sequence gap을 설명합니다.", "second write failure의 전체 rollback을 확인합니다.", "batch sentinel과 ROLLBACK_ALL을 계산합니다."], hints: ["execute 성공, affected rows, key assignment와 commit을 서로 다른 단계로 적으세요."], expectedOutcome: "단순 CRUD를 failure-aware write state machine으로 설명합니다.", solutionOutline: ["resolve→bind→execute→count/key→commit/rollback→readback 순서입니다."] },
    { difficulty: "응용", prompt: "원본 점수 mapper를 production CRUD repository로 확장하세요.", requirements: ["원본은 structural provenance로만 사용합니다.", "insert defaults/constraints/count를 검증합니다.", "versioned update와 hard/soft delete 정책을 둡니다.", "MySQL/Oracle key adapter와 key readback을 만듭니다.", "service transaction과 batch failure policy를 적용합니다.", "idempotency/ambiguous commit reconciliation을 구현합니다.", "least privilege와 safe telemetry를 검증합니다.", "actual driver/DB fault matrix를 실행합니다."], hints: ["mapper int를 generated key로 오해하지 말고 keyProperty mutation과 count를 따로 검증하세요."], expectedOutcome: "동시성·장애·재시도에도 중복/부분 상태가 없는 CRUD layer가 완성됩니다.", solutionOutline: ["inventory→constrain→count→key→transact→batch→idempotency→observe 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 MyBatis write governance와 release gate를 작성하세요.", requirements: ["statement별 expected count/domain outcome을 정의합니다.", "insert default/constraint와 patch/optimistic/delete 정책을 둡니다.", "generated-key/sequence/client-key matrix를 유지합니다.", "transaction/outbox/deadlock retry 경계를 둡니다.", "batch flush/partial failure 계약을 정의합니다.", "idempotency/unknown commit/reconciliation을 요구합니다.", "runtime/migration role과 safe telemetry를 지정합니다.", "actual DB/driver/schema failure/upgrade tests를 요구합니다."], hints: ["write 성공을 예외 없음이 아니라 state transition과 readback evidence로 정의하세요."], expectedOutcome: "입력 command부터 durable DB state와 incident recovery까지 일관된 write 표준이 완성됩니다.", solutionOutline: ["validate→authorize→execute→verify→commit→deduplicate→reconcile→audit 순서입니다."] },
  ],
  nextSessions: ["mybatis-06-dynamic-sql"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["ScoreMapper.xml은 read-only로 18 lines/765 bytes를 확인했고 SHA-256은 9D2D6CA70214AE7BD915C57083322560AEB127ACC59F9A36ACCA5452E6E3F3DB입니다.", "원본은 sequence-backed insert, scalar list와 id delete의 작은 mapper이며 UPDATE/useGeneratedKeys/selectKey/batch/transaction 처리는 공식 자료와 synthetic model로 보강했습니다.", "원본 namespace/SQL/property literal과 application data는 복사하지 않았습니다.", "JDK-only examples는 실제 MyBatis executor, driver getGeneratedKeys/update counts, Oracle sequence/MySQL auto-increment, constraints/locks와 Spring transaction behavior를 대체하지 않습니다."] },
});

export default session;
