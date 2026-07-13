import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: `1-${Math.min(6, lineCount)}`, explanation: "실제 덤프를 적재하지 않고 sqlite3 메모리 DB에 합성 domain table과 constraint만 준비합니다." },
      { lines: `${Math.min(7, lineCount)}-${Math.max(7, lineCount - 5)}`, explanation: "경계 간 FK, aggregate lifecycle, cardinality, index 또는 retention 불변식을 catalog와 query로 검증합니다." },
      { lines: `${Math.max(1, lineCount - 4)}-${lineCount}`, explanation: "table/edge/count/checksum과 plan boolean만 출력합니다. 원본 sample row·credential·PII·host 값은 어느 출력에도 포함하지 않습니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "SQLite lab은 MySQL 8.4·Oracle 26ai의 DDL, FK, optimizer와 online migration 동작을 대체하지 않습니다."] },
    experiments: [
      { change: "경계 간 FK, nullable key, duplicate association과 aggregate child를 하나씩 추가합니다.", prediction: "ownership·cardinality가 불명확하면 cascade, uniqueness와 delete 정책이 서로 충돌합니다.", result: "FK graph, parent/child counts와 invariant violation class를 함께 기록합니다." },
      { change: "복합 index 순서와 retention cutoff를 바꾸고 representative skew에서 plan을 비교합니다.", prediction: "결과는 같아도 sort/temp, rows examined와 삭제 비용이 크게 달라집니다.", result: "golden ids·checksum을 유지한 채 target-engine plan과 batch budget을 승인합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "safe-large-dump-inventory",
    title: "대형 덤프를 실행하기 전에 구조 inventory와 민감도 경계를 만듭니다",
    lead: "덤프 첫 줄부터 실행하는 대신 hash·크기·statement 유형·table·constraint graph와 민감 패턴 개수만 비식별 방식으로 추출해야 원본을 훼손하거나 비밀값을 노출하지 않습니다.",
    explanations: [
      "Trip.sql은 read-only 안전 스캐너로 31개 CREATE TABLE, 41개 FOREIGN KEY와 여러 identity·travel·place·community·support 축을 확인했습니다. INSERT와 credential/identity/network 형태의 문자열도 존재할 수 있어 실제 literal은 한 번도 출력하거나 학습 예제로 복사하지 않았습니다.",
      "preflight manifest에는 source path의 논리명, byte/line count, cryptographic checksum, encoding, detected dialect/version markers, statement counts와 scan rule version을 둡니다. checksum은 내용 공개 없이 같은 artifact를 분석했는지 연결합니다.",
      "DDL-only 추출도 완전히 안전하다고 가정하지 않습니다. DEFAULT, COMMENT, DEFINER, URL과 object name에 민감 정보가 들어갈 수 있으므로 quoted literal·host·credential pattern을 먼저 redact하고 allow-listed metadata만 출력합니다.",
      "덤프는 production restore authority가 아닙니다. disposable isolated database, 최소 권한 계정, outbound network 차단, resource limit와 explicit no-trigger/no-event 검토 뒤에만 parsing/restore test를 합니다.",
      "inventory 결과는 table 수가 아니라 검토 backlog입니다. owner가 없는 table, FK가 없는 key-like column, 위험한 cascade, sample data, duplicate object와 dialect-specific option을 severity와 evidence로 분류합니다.",
    ],
    concepts: [
      c("safe schema inventory", "dump 값을 출력하지 않고 object·constraint·statement·dialect·risk category만 수집한 manifest입니다.", ["checksum과 scanner version을 포함합니다.", "quoted literal은 기본 비공개입니다."]),
      c("restore sandbox", "dump code와 data를 production network/credential에서 분리해 검증하는 일회성 환경입니다.", ["최소 권한과 resource cap을 둡니다.", "outbound를 차단합니다."]),
      c("schema evidence ledger", "각 발견의 source artifact hash, object, rule, severity, owner와 처리 상태를 기록한 목록입니다.", ["원시 secret/PII를 저장하지 않습니다.", "재감사를 지원합니다."]),
    ],
    codeExamples: [py("db19-safe-fk-boundary-inventory", "합성 schema의 table·FK·경계 간 edge inventory", "db19_boundary_inventory.py", "실제 덤프 대신 다섯 합성 table을 만들고 SQLite catalog만 읽어 같은 경계와 다른 경계의 FK 수를 계산합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE identity_member(id INTEGER PRIMARY KEY);
CREATE TABLE place_location(id INTEGER PRIMARY KEY);
CREATE TABLE itinerary_plan(id INTEGER PRIMARY KEY, member_id INTEGER NOT NULL REFERENCES identity_member(id));
CREATE TABLE itinerary_visit(id INTEGER PRIMARY KEY, plan_id INTEGER NOT NULL REFERENCES itinerary_plan(id), place_id INTEGER NOT NULL REFERENCES place_location(id));
CREATE TABLE social_note(id INTEGER PRIMARY KEY, member_id INTEGER NOT NULL REFERENCES identity_member(id));
""")
tables = [row[0] for row in db.execute("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name")]
edges = []
for table in tables:
    for row in db.execute(f"PRAGMA foreign_key_list({table})"):
        edges.append((table, row[2]))
boundary = lambda name: name.split("_", 1)[0]
cross = [edge for edge in edges if boundary(edge[0]) != boundary(edge[1])]
print("tables=" + str(len(tables)))
print("foreign-keys=" + str(len(edges)))
print("cross-boundary=" + str(len(cross)))
print("same-boundary=" + str(len(edges) - len(cross)))
print("integrity=" + db.execute("PRAGMA integrity_check").fetchone()[0])`, "tables=5\nforeign-keys=4\ncross-boundary=3\nsame-boundary=1\nintegrity=ok", ["local-trip", "mysql-key-usage", "sqlite-foreign-keys", "python-sqlite3"])],
    diagnostics: [d("덤프 감사 로그에 실제 email·token·host 또는 INSERT literal이 노출됩니다.", "구조 scan 전에 원문 grep/출력을 수행했거나 DDL은 안전하다고 가정했습니다.", ["command/output history", "quoted literal redaction", "scanner allow-list", "artifact access audit"], "원문은 read-only 격리하고 checksum·statement count·allow-listed identifier만 출력하며 이미 노출된 값은 incident 절차로 폐기·회전합니다.", "dump audit 도구에 canary secret와 output zero-leak test를 둡니다.")],
    expertNotes: ["artifact checksum은 공유할 수 있지만 원본 dump나 match context는 학습 repository에 복사하지 않습니다.", "안전 스캐너도 source file을 변경하지 않고 fail-closed 출력 한도를 가져야 합니다."],
  },
  {
    id: "bounded-context-clustering",
    title: "table 이름보다 변경 이유와 언어로 bounded context를 찾습니다",
    lead: "사용자·여행 계획·장소 catalog·community·문의가 한 dump에 있어도 같은 transaction과 같은 모델을 공유해야 하는 것은 아닙니다.",
    explanations: [
      "prefix와 FK community는 초기 힌트일 뿐 경계의 증거가 아닙니다. 같은 단어라도 context마다 의미·수명·권한이 다르고, FK가 있다고 동일 aggregate라는 뜻도 아닙니다.",
      "각 후보 context에 ubiquitous language, command/query, invariant, owner/team, write frequency, consistency requirement, PII class와 retention을 기록합니다. 함께 바뀌는 규칙이 강한 tables를 묶습니다.",
      "identity는 인증·복구·로그 retention, itinerary는 순서·기간·소유권, place catalog는 번역·tag·image, community는 게시·반응·신고처럼 서로 다른 lifecycle을 가질 수 있습니다.",
      "경계 간 관계는 raw FK, stable public id, snapshot copy, event 또는 API reference 중 선택합니다. monolith DB 안에서도 cross-context join과 cascade를 제한해 미래 분리를 준비할 수 있습니다.",
      "context map에는 upstream/downstream, conformist/anti-corruption layer, shared-kernel 여부와 ownership을 둡니다. table을 service별로 즉시 쪼개기 전에 transaction과 query evidence를 수집합니다.",
    ],
    concepts: [
      c("bounded context", "특정 언어·규칙·모델이 일관되게 적용되는 경계입니다.", ["table prefix만으로 결정하지 않습니다.", "owner와 change cadence를 포함합니다."]),
      c("context map", "context 사이 의존 방향, 계약과 변환 책임을 나타낸 지도입니다.", ["cross-boundary FK를 표시합니다.", "분리 순서를 논의합니다."]),
      c("anti-corruption layer", "외부 context의 schema/용어를 현재 context 모델로 변환하는 경계입니다.", ["직접 table 의존을 줄입니다.", "contract version을 둡니다."]),
    ],
    diagnostics: [d("prefix가 같다는 이유로 서로 다른 lifecycle의 tables를 한 aggregate/service로 묶었습니다.", "naming similarity를 invariant·transaction·ownership 증거보다 우선했습니다.", ["command와 transaction boundaries", "change history", "owner/SLA", "retention·PII class"], "use-case와 invariant workshop으로 context를 다시 나누고 cross-context relation을 명시적 contract로 전환합니다.", "schema review에 context owner와 change reason matrix를 요구합니다.")],
    expertNotes: ["shared database는 shared model과 동의어가 아닙니다.", "경계는 물리 분리 전에 코드 ownership, query adapter와 migration 권한으로 먼저 드러낼 수 있습니다."],
  },
  {
    id: "aggregate-root-invariants",
    title: "aggregate root와 child lifecycle에서 원자적 invariant를 찾습니다",
    lead: "계획과 계획의 방문 순서, 게시물과 detail/image/tag처럼 함께 생성·변경·삭제되는 규칙을 root command 경계로 모델링합니다.",
    explanations: [
      "aggregate는 object graph 전체가 아니라 한 transaction에서 반드시 일관돼야 하는 최소 cluster입니다. root만 외부에서 직접 참조하고 child는 root command를 통해 변경하는 규칙을 검토합니다.",
      "여행 계획의 날짜 범위, 방문 순서 uniqueness, maximum stops와 owner 권한은 같은 write transaction이 필요할 수 있습니다. 장소 catalog 자체의 이름·번역 lifecycle은 계획 child가 아니라 별도 aggregate reference일 가능성이 큽니다.",
      "게시물 subtype/detail을 table-per-type로 나눈 경우 root 존재, 정확히 하나의 허용 detail, deletion과 status transition을 constraint·transaction으로 보장해야 합니다. nullable subtype columns 한 table 대안도 비교합니다.",
      "DB cascade는 lifecycle ownership이 명확할 때만 사용합니다. 감사·신고·결제처럼 root 삭제 후에도 보존해야 하는 evidence는 cascade child로 두지 않고 pseudonymized reference와 retention을 설계합니다.",
      "aggregate 크기가 커지면 lock contention과 write amplification이 늘어납니다. invariant가 eventual consistency를 허용하면 outbox/event와 idempotent consumer로 분리하고 reconciliation을 둡니다.",
    ],
    concepts: [
      c("aggregate root", "외부 command와 reference가 통과하는 consistency cluster의 유일한 진입점입니다.", ["child invariant를 보호합니다.", "모든 FK parent가 root인 것은 아닙니다."]),
      c("lifecycle ownership", "parent 생성·삭제·보존 결정이 child에 미치는 책임 관계입니다.", ["CASCADE 근거가 됩니다.", "audit evidence는 분리할 수 있습니다."]),
      c("invariant budget", "한 transaction에서 강하게 지켜야 할 규칙과 eventual/reconciliation로 옮길 규칙의 경계입니다.", ["lock 비용을 포함합니다.", "실패 보상 전략을 둡니다."]),
    ],
    codeExamples: [py("db19-aggregate-lifecycle", "root delete와 FK lifecycle 검증", "db19_aggregate_lifecycle.py", "owner 삭제는 제한하고 journey root 삭제는 owned stops를 cascade하는 합성 aggregate 정책을 실제 constraint로 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE owner(id INTEGER PRIMARY KEY);
CREATE TABLE journey(id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES owner(id) ON DELETE RESTRICT);
CREATE TABLE journey_stop(id INTEGER PRIMARY KEY, journey_id INTEGER NOT NULL REFERENCES journey(id) ON DELETE CASCADE, position INTEGER NOT NULL, UNIQUE(journey_id, position));
""")
db.execute("INSERT INTO owner VALUES (1)")
db.execute("INSERT INTO journey VALUES (10,1)")
db.executemany("INSERT INTO journey_stop VALUES (?,?,?)", [(100,10,1),(101,10,2)])
try:
    db.execute("DELETE FROM owner WHERE id=1")
    owner_restricted = False
except sqlite3.IntegrityError:
    owner_restricted = True
db.execute("DELETE FROM journey WHERE id=10")
stops = db.execute("SELECT count(*) FROM journey_stop").fetchone()[0]
print("owner-delete-restricted=" + str(owner_restricted).lower())
print("owned-stops-after-root-delete=" + str(stops))
print("owner-remains=" + str(db.execute("SELECT count(*) FROM owner").fetchone()[0]))
print("foreign-key-check=" + str(len(list(db.execute("PRAGMA foreign_key_check")))))`, "owner-delete-restricted=true\nowned-stops-after-root-delete=0\nowner-remains=1\nforeign-key-check=0", ["mysql-create-table", "mysql-foreign-keys", "oracle-create-table", "oracle-constraint", "sqlite-foreign-keys"])],
    diagnostics: [d("root 삭제가 보존해야 할 audit child까지 cascade하거나 owned child를 orphan으로 남깁니다.", "lifecycle ownership과 retention을 정의하지 않고 FK action을 일괄 적용했습니다.", ["child별 legal/operational retention", "ON DELETE actions", "orphan/cascade dry run", "restore/undo path"], "owned ephemeral child만 cascade하고 독립 evidence는 별도 aggregate·pseudonymous reference와 explicit purge workflow로 분리합니다.", "root delete fixture에서 child별 expected remain/delete/anonymize를 검증합니다.")],
    expertNotes: ["cascade 편의보다 삭제 후에도 의미가 남는지 먼저 묻습니다.", "aggregate root id를 외부에 노출할 때 삭제·merge·tenant 이동 contract도 정의합니다."],
  },
  {
    id: "foreign-key-cardinality-graph",
    title: "FK graph를 1:1·1:N·N:M cardinality와 optionality로 해석합니다",
    lead: "외래키 41개라는 숫자보다 child key의 UNIQUE·NULL·composite scope와 delete/update action이 관계 의미를 결정합니다.",
    explanations: [
      "FK alone은 many-to-one을 허용합니다. child FK에 UNIQUE가 있으면 parent당 최대 한 child인 1:0..1이 되고, join table의 두 FK와 composite UNIQUE/PK는 N:M duplicate edge를 막습니다.",
      "nullable FK는 optional relation 또는 미완성 import를 뜻할 수 있습니다. domain상 필수면 NOT NULL로 강제하고, unknown 상태가 필요하면 명시적 status/quarantine을 고려합니다.",
      "composite tenant_id+local_id 관계에서 tenant part가 빠지면 cross-tenant link가 생깁니다. parent candidate key와 child FK가 같은 scope·type·collation을 사용해야 합니다.",
      "self-reference는 comment tree나 hierarchy를 표현하지만 cycle, maximum depth, root deletion과 subtree query 비용을 다뤄야 합니다. DB FK만으로 cycle을 막지 못할 수 있습니다.",
      "FK graph audit는 missing referenced index, orphan rows, disabled/unvalidated constraints, duplicate association, cycles와 unexpected cross-context edges를 분리해 report합니다.",
    ],
    concepts: [
      c("relationship cardinality", "한 parent/child가 가질 수 있는 대응 수의 최소·최대입니다.", ["FK·UNIQUE·NOT NULL 조합으로 표현합니다.", "ER label과 DDL을 대조합니다."]),
      c("association identity", "N:M edge 자체를 유일하게 식별하는 composite key 또는 surrogate+unique 계약입니다.", ["중복 like/tag/favorite를 막습니다.", "edge metadata를 수용합니다."]),
      c("scope-complete FK", "tenant 등 모든 identity component를 포함해 다른 scope와 연결될 수 없는 FK입니다.", ["parent candidate key와 맞춥니다.", "migration에서 검증합니다."]),
    ],
    diagnostics: [d("ERD는 1:1인데 실제로 child가 여러 개 생기거나 다른 tenant parent에 연결됩니다.", "FK만 있고 UNIQUE 또는 tenant component가 없어 cardinality/scope를 강제하지 못했습니다.", ["child duplicate groups", "FK/unique column sets", "tenant same-id fixture", "catalog constraint status"], "관계 의미에 맞는 composite UNIQUE·NOT NULL·scope-complete FK를 staged validation 후 적용합니다.", "0·1·2 child와 cross-tenant same-id negative fixtures를 둡니다.")],
    expertNotes: ["ORM one-to-one annotation은 DB UNIQUE를 대체하지 않습니다.", "constraint name에 relation 의미와 failure owner를 드러내면 운영 진단이 쉬워집니다."],
  },
  {
    id: "naming-glossary-and-schema-ownership",
    title: "이름·단수/복수·시간·boolean 규칙을 glossary와 ownership으로 통일합니다",
    lead: "대형 dump에서는 비슷한 의미의 접두사·suffix와 legacy name이 섞이기 쉬우므로 일괄 rename보다 semantic glossary와 compatibility plan이 먼저입니다.",
    explanations: [
      "table/column 이름은 aggregate, entity, association, history, verification, translation 같은 역할을 드러내야 합니다. `_LIST`, `_RELATION`, `_DETAIL`이 실제 cardinality/lifecycle과 맞는지 확인합니다.",
      "created_at/updated_at/deleted_at, date/time zone, actor와 source를 표준화합니다. boolean은 is_deleted와 deleted_at이 함께 있을 때 source of truth와 synchronization constraint를 정합니다.",
      "reserved word, case sensitivity와 quoted identifier는 MySQL·Oracle·filesystem 이식성에 영향을 줍니다. canonical lower_snake_case 등 정책을 정하고 mapper/entity name 변환을 한 곳에서 관리합니다.",
      "rename은 view/synonym, dual-write/backfill, code rollout, telemetry와 deprecation 순서가 필요합니다. dump text를 일괄 replace하면 FK, index, trigger, mapper와 external consumer를 놓칩니다.",
      "schema ownership에는 object 생성/alter/delete 권한, migration approver, data steward, retention owner와 incident contact를 포함합니다. shared admin 계정을 피합니다.",
    ],
    concepts: [
      c("schema glossary", "table·column·status·time field의 canonical 의미와 허용 이름을 기록한 사전입니다.", ["cardinality/lifecycle을 포함합니다.", "application 용어와 연결합니다."]),
      c("compatibility rename", "old/new 이름을 일정 기간 함께 지원하며 consumer를 이동시키는 migration입니다.", ["view/dual-read를 사용할 수 있습니다.", "usage telemetry를 둡니다."]),
      c("object ownership", "schema object 변경·데이터 품질·retention과 incident에 책임지는 role/팀입니다.", ["개인 계정과 분리합니다.", "least privilege를 적용합니다."]),
    ],
    diagnostics: [d("rename 후 일부 mapper·report·FK deployment가 깨집니다.", "문자열 검색만으로 consumer와 database dependency를 완전히 찾았다고 가정했습니다.", ["catalog dependencies", "mapper/generated SQL", "query telemetry", "old/new compatibility view"], "dependency graph와 usage telemetry를 만들고 expand-migrate-contract 단계로 rename하여 old path 종료 전에 readback합니다.", "old/new schema contract tests와 deprecation counter를 둡니다.")],
    expertNotes: ["이름 통일을 위해 history를 지우지 말고 alias/deprecation으로 의미 변경을 추적합니다.", "boolean flag와 timestamp가 동시에 있으면 불일치 상태를 constraint 또는 단일 source로 제거합니다."],
  },
  {
    id: "association-uniqueness-and-concurrency",
    title: "like·favorite·tag association의 중복을 composite key로 막습니다",
    lead: "application에서 이미 존재하는지 확인한 뒤 INSERT하는 방식은 동시 요청에서 중복 edge를 만들므로 DB uniqueness와 idempotent conflict 처리가 필요합니다.",
    explanations: [
      "N:M association의 identity가 (actor_id,target_id)라면 composite PRIMARY KEY 또는 UNIQUE로 한 edge만 허용합니다. surrogate id를 쓰더라도 business pair unique를 추가합니다.",
      "tag relation이 parent tag와 child tag를 동시에 참조한다면 direction, self-edge, duplicate reverse edge와 cycle 정책을 CHECK/trigger/service에서 정의합니다.",
      "like count를 association row count로 계산할 때 soft-delete나 duplicate history를 어떻게 포함하는지 정합니다. current edge와 event history를 같은 table에 섞지 않을 수 있습니다.",
      "idempotent create는 unique violation을 이미 존재 결과로 매핑하되 authorization과 payload equality를 재검증합니다. 무조건 오류를 삼키면 다른 constraint 위반까지 숨깁니다.",
      "delete/recreate race, retry와 bulk import에서 association uniqueness를 검증합니다. target-engine upsert syntax와 affected-row semantics는 별도 matrix로 관리합니다.",
    ],
    concepts: [
      c("business pair key", "association의 두 endpoint 조합을 유일하게 만드는 key입니다.", ["surrogate id와 별개입니다.", "tenant scope를 포함합니다."]),
      c("idempotent association", "동일 create 요청을 반복해도 edge가 한 개만 존재하는 성질입니다.", ["UNIQUE가 race를 막습니다.", "conflict class를 구분합니다."]),
      c("current edge versus event", "현재 관계 한 행과 생성/삭제 history event를 분리하는 모델입니다.", ["count 의미가 명확해집니다.", "retention을 다르게 설정합니다."]),
    ],
    codeExamples: [py("db19-association-uniqueness", "동시성 전제의 composite association key", "db19_association_unique.py", "합성 favorite edge에 composite primary key를 두고 중복 insert만 정확히 거절되는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE member(id INTEGER PRIMARY KEY);
CREATE TABLE place(id INTEGER PRIMARY KEY);
CREATE TABLE favorite(member_id INTEGER NOT NULL REFERENCES member(id), place_id INTEGER NOT NULL REFERENCES place(id), created_seq INTEGER NOT NULL, PRIMARY KEY(member_id, place_id));
""")
db.executemany("INSERT INTO member VALUES (?)", [(1,),(2,)])
db.executemany("INSERT INTO place VALUES (?)", [(10,),(20,)])
db.executemany("INSERT INTO favorite VALUES (?,?,?)", [(1,10,1),(1,20,2),(2,10,3)])
try:
    db.execute("INSERT INTO favorite VALUES (?,?,?)", (1,10,4))
    duplicate_rejected = False
except sqlite3.IntegrityError:
    duplicate_rejected = True
pairs = [f"{a}-{b}" for a,b in db.execute("SELECT member_id,place_id FROM favorite ORDER BY member_id,place_id")]
print("pairs=" + ",".join(pairs))
print("count=" + str(len(pairs)))
print("duplicate-rejected=" + str(duplicate_rejected).lower())
print("fk-errors=" + str(len(list(db.execute("PRAGMA foreign_key_check")))))`, "pairs=1-10,1-20,2-10\ncount=3\nduplicate-rejected=true\nfk-errors=0", ["mysql-create-table", "mysql-foreign-keys", "oracle-constraint", "postgres-constraints", "sqlite-foreign-keys"])],
    diagnostics: [d("like/favorite가 간헐적으로 두 번 생성돼 count가 부풀어 오릅니다.", "check-then-insert와 surrogate PK만 사용해 endpoint pair uniqueness를 강제하지 않았습니다.", ["duplicate pair GROUP BY", "unique index columns", "concurrent request timeline", "retry/upsert error mapping"], "tenant+actor+target business pair에 UNIQUE를 두고 duplicate conflict만 idempotent success로 처리합니다.", "barrier 기반 동시 insert와 retry storm test를 둡니다.")],
    expertNotes: ["association에 metadata가 늘어도 endpoint identity와 event history를 혼동하지 않습니다.", "duplicate cleanup은 winner 선정·audit 보존·FK 영향과 rollback을 먼저 설계합니다."],
  },
  {
    id: "access-pattern-index-design",
    title: "FK 존재만 믿지 말고 access pattern에서 복합 index 순서를 설계합니다",
    lead: "계획별 방문 순서, 장소별 review 최신순, 게시물별 comment처럼 equality·range·order tuple을 관찰해 최소 index를 선택합니다.",
    explanations: [
      "FK enforcement에 필요한 index와 application query를 빠르게 하는 index는 목적이 다릅니다. MySQL이 child key index를 요구/생성하더라도 filter+order를 만족하는 복합 key는 별도로 검토합니다.",
      "일반적으로 equality scope를 앞에, range/order와 unique tie-breaker를 뒤에 둡니다. `(plan_id, position)`은 한 plan의 방문 순서를 지원하고 UNIQUE면 invariant도 강제합니다.",
      "low-cardinality boolean 단독 index는 도움이 적을 수 있지만 tenant/status/date 조합에서는 유효할 수 있습니다. 데이터 분포와 predicate conjunction을 EXPLAIN actual로 측정합니다.",
      "covering index는 lookup을 줄이지만 wide text/image URL/PII column을 포함하면 storage·write·cache·leak surface가 커집니다. 필요한 좁은 projection만 고려합니다.",
      "index inventory에는 exact duplicates, redundant prefixes, unused/low-value indexes, write amplification과 FK dependency를 기록합니다. drop은 invisible/monitor 단계와 rollback을 거칩니다.",
    ],
    concepts: [
      c("access-pattern index", "실제 WHERE equality/range, ORDER BY와 tie-breaker tuple에 맞춘 복합 index입니다.", ["FK index와 구분합니다.", "대표 분포에서 측정합니다."]),
      c("leftmost prefix", "복합 index의 앞쪽 column 조합이 lookup/order 지원 범위를 결정하는 원리입니다.", ["key 순서가 중요합니다.", "엔진별 optimizer를 확인합니다."]),
      c("index write budget", "추가 index가 insert/update/delete, storage와 cache에 주는 허용 비용입니다.", ["read benefit과 함께 측정합니다.", "retention purge도 포함합니다."]),
    ],
    codeExamples: [py("db19-plan-position-index", "aggregate child 순서용 복합 index 계획", "db19_index_plan.py", "한 plan의 stop을 position 순으로 읽는 query가 복합 index를 사용하고 임시 정렬을 피하는지 확인합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA automatic_index=OFF")
db.execute("CREATE TABLE plan_stop(id INTEGER PRIMARY KEY, plan_id INTEGER NOT NULL, position INTEGER NOT NULL, label TEXT NOT NULL)")
db.executemany("INSERT INTO plan_stop VALUES (?,?,?,?)", [(1,7,3,"C"),(2,7,1,"A"),(3,7,2,"B"),(4,8,1,"X")])
db.execute("CREATE UNIQUE INDEX ux_plan_stop_position ON plan_stop(plan_id,position)")
sql = "SELECT id,position FROM plan_stop WHERE plan_id=? ORDER BY position"
plan = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql, (7,))).upper()
rows = list(db.execute(sql, (7,)))
print("positions=" + ",".join(str(position) for _,position in rows))
print("ids=" + ",".join(str(row_id) for row_id,_ in rows))
print("uses-composite-index=" + str("UX_PLAN_STOP_POSITION" in plan).lower())
print("temporary-sort=" + str("TEMP B-TREE" in plan).lower())`, "positions=1,2,3\nids=2,3,1\nuses-composite-index=true\ntemporary-sort=false", ["mysql-multicolumn-index", "mysql-explain", "sqlite-queryplanner", "sqlite-eqp", "python-sqlite3"])],
    diagnostics: [d("FK column index는 있는데 계획 상세 조회가 filesort·temp와 많은 row scan을 사용합니다.", "참조 무결성용 단일 key가 filter+order access pattern과 맞지 않습니다.", ["effective WHERE/ORDER tuple", "existing index prefixes", "actual rows/sort/temp", "write/storage cost"], "scope equality와 order/tie-breaker에 맞는 최소 composite index를 결과 parity와 write budget으로 검증합니다.", "small/large/skew plan fixture와 index usage regression을 둡니다.")],
    expertNotes: ["모든 FK에 무조건 별도 index를 더하기 전에 engine 자동/required index와 중복 prefix를 확인합니다.", "index 이름에 주요 query invariant를 드러내고 migration rollback DDL을 준비합니다."],
  },
  {
    id: "schema-evolution-expand-contract",
    title: "대형 schema를 expand·backfill·validate·contract 단계로 진화시킵니다",
    lead: "column rename/type change/FK 추가를 dump 재생성 한 번으로 처리하지 않고 old/new application이 공존하는 배포 순서와 backfill checkpoint를 설계합니다.",
    explanations: [
      "expand 단계는 nullable/new column·new table·index를 old code와 호환되게 추가합니다. write path는 dual-write 또는 canonical write+derived backfill을 사용하고 divergence를 계측합니다.",
      "backfill은 primary-key ranges와 idempotent checkpoint로 실행하고 lock, redo/binlog, replica lag, deadlock와 application latency budget을 제한합니다. 한 transaction으로 전체 table을 갱신하지 않습니다.",
      "validate 단계에서 null/duplicate/orphan, old/new checksum, read parity와 constraint readiness를 확인합니다. MySQL/Oracle의 online DDL·constraint validation 동작을 target version에서 확인합니다.",
      "contract는 old reader/writer 사용이 0임을 telemetry로 증명한 뒤 old column/view/index를 제거합니다. rollback window 동안 reverse sync 또는 restore path를 유지합니다.",
      "dump artifact는 결과 snapshot일 뿐 migration history가 아닙니다. immutable ordered migration, schema version table, checksum과 environment readback을 source of truth로 둡니다.",
    ],
    concepts: [
      c("expand-contract migration", "old/new code가 공존하도록 먼저 호환 schema를 추가하고 전환 후 old schema를 제거하는 방식입니다.", ["backfill/validate가 중간에 있습니다.", "usage telemetry를 사용합니다."]),
      c("idempotent backfill", "checkpoint부터 재시작해도 같은 target state를 만드는 batch migration입니다.", ["PK range를 사용합니다.", "divergence를 reconciliation합니다."]),
      c("schema version ledger", "migration id·checksum·applied time·tool/version·result를 저장하는 변경 이력입니다.", ["dump와 구분합니다.", "drift detection에 사용합니다."]),
    ],
    diagnostics: [d("column rename 배포 중 old application과 new application이 서로 다른 값을 씁니다.", "dual-version coexistence와 backfill/write synchronization 없이 destructive rename을 먼저 실행했습니다.", ["old/new writer traffic", "column divergence counts", "migration order", "rollback/read path"], "expand column, versioned dual-write/read, idempotent backfill·parity 후 traffic을 전환하고 usage 0에서 contract합니다.", "mixed-version deployment와 rollback rehearsal을 CI/staging에 포함합니다.")],
    expertNotes: ["migration 성공 로그보다 catalog와 data invariant readback이 완료 증거입니다.", "dual-write는 영구 구조가 아니라 관측 가능한 종료 조건이 있는 임시 단계입니다."],
  },
  {
    id: "retention-deletion-and-archival",
    title: "도메인별 retention·삭제·익명화·archive를 FK lifecycle과 맞춥니다",
    lead: "로그인 기록, 인증 요청, community content, 여행 계획과 신고 evidence는 동일한 보존 기간과 삭제 방법을 가져서는 안 됩니다.",
    explanations: [
      "data class별 purpose, legal/contractual basis, minimum/maximum retention, deletion trigger, litigation hold, archive destination와 owner를 matrix로 둡니다. 기술적으로 저장 가능하다는 이유로 무기한 보관하지 않습니다.",
      "user deletion은 aggregate별 delete, anonymize, detach, retain을 결정합니다. public content author를 pseudonymize할지 삭제할지, security history를 얼마나 보존할지 product/legal policy와 연결합니다.",
      "soft delete는 retention이 아니라 visibility state입니다. deleted_at 이후 purge deadline, uniqueness reuse, FK handling, backup expiry와 search/cache removal을 별도 구현합니다.",
      "대량 purge는 indexed time+scope key, small batches, deterministic cutoff, retry checkpoint와 replica/undo budget을 사용합니다. partition drop은 빠르지만 FK·mixed-retention partition과 restore granularity를 검토합니다.",
      "archive/purge는 count, min/max key, non-sensitive checksum과 FK orphan check로 reconciliation하고 backup/replica/object storage에서도 expiry를 검증합니다.",
    ],
    concepts: [
      c("retention matrix", "data class별 보존 목적·기간·삭제/익명화·hold·owner를 정한 계약입니다.", ["table 단위보다 세밀할 수 있습니다.", "backup까지 포함합니다."]),
      c("soft-delete lifecycle", "visibility off 이후 purge/anonymize와 backup expiry까지 이어지는 상태 전이입니다.", ["retention 자체가 아닙니다.", "deadline을 관측합니다."]),
      c("purge reconciliation", "cutoff 대상, archived/deleted/remaining와 orphan이 기대 식과 일치하는지 검증하는 절차입니다.", ["원시 PII checksum을 피합니다.", "batch별 증거를 남깁니다."]),
    ],
    codeExamples: [py("db19-retention-reconciliation", "archive·purge count와 checksum reconciliation", "db19_retention.py", "합성 event를 deterministic cutoff로 archive/delete하고 active+archive가 원래 count·id checksum과 일치하는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE event(id INTEGER PRIMARY KEY, occurred_on TEXT NOT NULL, class_code TEXT NOT NULL)")
db.execute("CREATE TABLE event_archive(id INTEGER PRIMARY KEY, occurred_on TEXT NOT NULL, class_code TEXT NOT NULL)")
db.executemany("INSERT INTO event VALUES (?,?,?)", [(1,"2025-01-01","A"),(2,"2026-01-01","B"),(3,"2026-06-01","A")])
db.commit()
before = db.execute("SELECT count(*),sum(id) FROM event").fetchone()
cutoff = "2026-01-01"
db.execute("BEGIN")
db.execute("INSERT INTO event_archive SELECT * FROM event WHERE occurred_on < ?", (cutoff,))
db.execute("DELETE FROM event WHERE occurred_on < ?", (cutoff,))
active = db.execute("SELECT count(*),sum(id) FROM event").fetchone()
archived = db.execute("SELECT count(*),sum(id) FROM event_archive").fetchone()
reconciled = (active[0] + archived[0], active[1] + archived[1]) == before
db.commit()
print(f"before={before[0]}:{before[1]}")
print(f"active={active[0]}:{active[1]}")
print(f"archived={archived[0]}:{archived[1]}")
print("reconciled=" + str(reconciled).lower())
print("cutoff-exclusive=true")`, "before=3:6\nactive=2:5\narchived=1:1\nreconciled=true\ncutoff-exclusive=true", ["mysql-partition-retention", "oracle-create-table", "sqlite-queryplanner", "python-sqlite3"])],
    diagnostics: [d("soft-deleted rows와 backup copy가 retention 기한을 지나 계속 남습니다.", "UI visibility만 구현하고 purge, archive, cache/search와 backup expiry를 end-to-end로 설계하지 않았습니다.", ["deleted_at age buckets", "purge job checkpoints", "secondary stores/backups", "hold/exception registry"], "retention matrix에 따른 batch purge/anonymize와 모든 copy expiry를 구현하고 count/checksum/orphan을 reconciliation합니다.", "기한 초과 sentinel과 backup restore 후 deletion replay test를 둡니다.")],
    expertNotes: ["archive는 영구 보관의 다른 이름이 아니며 별도 expiry와 access control이 필요합니다.", "retention cutoff의 timezone·inclusive/exclusive semantics를 versioned rule로 고정합니다."],
  },
  {
    id: "schema-release-observability-and-recovery",
    title: "schema release를 checksum·constraint·plan·rollback이 있는 운영 절차로 만듭니다",
    lead: "대형 dump 분석 결과는 문서로 끝나지 않고 migration package, dependency order, dry-run·restore와 post-deploy evidence로 이어져야 합니다.",
    explanations: [
      "release manifest에는 source/target schema version, migration checksums, object dependency order, expected row/constraint/index counts, compatible application versions와 owner를 둡니다.",
      "preflight는 free space, long transactions, replica lag, lock timeout, FK orphan/duplicate/null, secret scan과 backup restore recency를 확인합니다. 실패하면 write를 시작하지 않습니다.",
      "apply는 statement/batch별 timeout·checkpoint·structured status를 남기고 raw SQL literals·PII를 로그하지 않습니다. DDL implicit commit과 engine-specific rollback 가능 범위를 명시합니다.",
      "postflight는 catalog constraints enabled/validated, row/checksum reconciliation, application smoke query, EXPLAIN plan, error/latency와 replica consistency를 readback합니다.",
      "rollback은 down DDL만이 아닙니다. application traffic, data transform reversibility, backup/point-in-time recovery, event replay와 forward-fix를 RTO/RPO로 선택하고 실제 rehearsal합니다.",
    ],
    concepts: [
      c("schema release manifest", "migration checksum·dependency·compatibility·expected evidence·owner를 묶은 배포 단위입니다.", ["dump와 구분합니다.", "환경별 readback을 저장합니다."]),
      c("postflight evidence", "배포 후 catalog·data·plan·application·replica 상태가 기대와 일치함을 보여 주는 결과입니다.", ["성공 exit code만으로 부족합니다.", "민감 값을 포함하지 않습니다."]),
      c("recovery decision", "down migration, restore/PITR, traffic rollback 또는 forward-fix를 손실·시간 기준으로 선택하는 절차입니다.", ["RTO/RPO를 사용합니다.", "rehearsal이 필요합니다."]),
    ],
    diagnostics: [d("migration 도구는 성공했지만 constraint가 disabled이거나 일부 backfill이 누락됐습니다.", "exit code만 성공 기준으로 삼고 catalog/data postflight와 checkpoint reconciliation을 하지 않았습니다.", ["schema version/checksum", "constraint validation status", "expected/actual batch counts", "application/replica readback"], "release manifest의 expected evidence를 자동 readback하고 하나라도 다르면 traffic 전환을 막아 rollback/forward-fix를 선택합니다.", "partial apply·timeout·replica lag chaos rehearsal을 정기 수행합니다.")],
    expertNotes: ["대형 dump를 새 baseline으로 채택하려면 이전 migration history와의 lineage를 명시적으로 연결합니다.", "운영 dashboard는 object/row counts와 plan fingerprint를 보여 주되 table의 민감 sample을 포함하지 않습니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-trip", repository: "dbstudy", path: "Trip.sql", usedFor: ["31-table travel/community/identity/support dump structure and 41-FK graph provenance"], evidence: "read-only safe scanner로 DDL·statement count와 graph만 확인했으며 sample/credential/PII/host literal은 출력·복사하지 않았습니다." },
  { id: "mysql-create-table", repository: "MySQL 8.4 Reference Manual", path: "CREATE TABLE Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table.html", usedFor: ["table, constraint and engine DDL"], evidence: "MySQL 공식 CREATE TABLE 문서입니다." },
  { id: "mysql-foreign-keys", repository: "MySQL 8.4 Reference Manual", path: "FOREIGN KEY Constraints", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html", usedFor: ["referential action and required indexes"], evidence: "MySQL 공식 FK 문서입니다." },
  { id: "mysql-multicolumn-index", repository: "MySQL 8.4 Reference Manual", path: "Multiple-Column Indexes", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html", usedFor: ["composite access-pattern indexes"], evidence: "MySQL 공식 multi-column index 문서입니다." },
  { id: "mysql-explain", repository: "MySQL 8.4 Reference Manual", path: "EXPLAIN Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/explain.html", usedFor: ["plan evidence"], evidence: "MySQL 공식 EXPLAIN 문서입니다." },
  { id: "mysql-partition-retention", repository: "MySQL 8.4 Reference Manual", path: "Management of RANGE and LIST Partitions", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/partitioning-management-range-list.html", usedFor: ["time partition and retention tradeoffs"], evidence: "MySQL 공식 partition management 문서입니다." },
  { id: "mysql-key-usage", repository: "MySQL 8.4 Reference Manual", path: "INFORMATION_SCHEMA KEY_COLUMN_USAGE", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/information-schema-key-column-usage-table.html", usedFor: ["safe constraint inventory"], evidence: "MySQL 공식 metadata 문서입니다." },
  { id: "oracle-create-table", repository: "Oracle Database 26ai SQL Language Reference", path: "CREATE TABLE", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CREATE-TABLE.html", usedFor: ["Oracle table/identity/constraint portability"], evidence: "Oracle 공식 CREATE TABLE 문서입니다." },
  { id: "oracle-constraint", repository: "Oracle Database 26ai SQL Language Reference", path: "constraint", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/constraint.html", usedFor: ["constraint types and validation"], evidence: "Oracle 공식 constraint 문서입니다." },
  { id: "sqlite-foreign-keys", repository: "SQLite Documentation", path: "Foreign Key Support", publicUrl: "https://www.sqlite.org/foreignkeys.html", usedFor: ["exact FK and lifecycle laboratory"], evidence: "SQLite 공식 FK 문서입니다." },
  { id: "sqlite-queryplanner", repository: "SQLite Documentation", path: "Query Planning", publicUrl: "https://www.sqlite.org/queryplanner.html", usedFor: ["index and retention query laboratory"], evidence: "SQLite 공식 query planner 문서입니다." },
  { id: "sqlite-eqp", repository: "SQLite Documentation", path: "EXPLAIN QUERY PLAN", publicUrl: "https://www.sqlite.org/eqp.html", usedFor: ["exact plan evidence"], evidence: "SQLite 공식 EQP 문서입니다." },
  { id: "postgres-constraints", repository: "PostgreSQL Documentation", path: "Constraints", publicUrl: "https://www.postgresql.org/docs/current/ddl-constraints.html", usedFor: ["relational constraint semantics cross-check"], evidence: "PostgreSQL 공식 constraint 문서입니다." },
  { id: "python-sqlite3", repository: "Python 3 Documentation", path: "sqlite3 DB-API", publicUrl: "https://docs.python.org/3/library/sqlite3.html", usedFor: ["exact isolated schema examples"], evidence: "Python 공식 sqlite3 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-19-trip-domain-schema", slug: "db-19-trip-domain-schema", courseId: "database", moduleId: "db-project-schema-portability", order: 3,
  title: "여행 도메인 대형 덤프에서 경계와 관계 찾기", subtitle: "31-table dump를 실행하지 않고 경계·aggregate·FK cardinality·index·진화·retention·recovery 계약으로 해석합니다.", level: "전문가", estimatedMinutes: 1000,
  coreQuestion: "비밀값과 sample data를 노출하지 않으면서 대형 여행 dump의 bounded context, aggregate, 관계·index·retention과 안전한 진화 순서를 어떻게 증명할까요?",
  summary: "dbstudy Trip.sql을 read-only safe scanner로 감사해 31 tables와 41 foreign keys, 여러 identity/travel/place/community/support 구조와 민감 가능 artifact가 있음을 값 없이 확인했습니다. safe inventory, bounded context/context map, aggregate lifecycle, FK cardinality/scope, naming glossary/ownership, association uniqueness/concurrency, access-pattern indexes, expand-backfill-validate-contract evolution, retention/deletion/archive와 release recovery까지 확장합니다. 다섯 exact Python/sqlite3 examples는 boundary FK inventory, root lifecycle, N:M uniqueness, composite index plan과 retention reconciliation을 실제 실행합니다.",
  objectives: ["dump literal을 노출하지 않는 checksum·metadata 기반 preflight를 수행한다.", "change reason·language·owner로 bounded context와 context map을 작성한다.", "aggregate root·child lifecycle·cascade invariant를 정의한다.", "FK·UNIQUE·NOT NULL·tenant scope로 1:1·1:N·N:M cardinality를 증명한다.", "naming glossary와 schema ownership, compatibility rename을 설계한다.", "access pattern에서 복합 index를 도출하고 EXPLAIN actual로 측정한다.", "expand-contract migration, retention·purge·archive와 postflight/recovery를 운영한다."],
  prerequisites: [{ title: "정규화와 무결성", reason: "entity grain, candidate key, FK·UNIQUE와 functional dependency를 이해해야 대형 graph의 관계를 해석할 수 있습니다.", sessionSlug: "db-08-normalization-workbench" }],
  keywords: ["schema dump", "bounded context", "aggregate root", "foreign key graph", "cardinality", "association table", "composite index", "expand contract", "retention", "purge", "reconciliation", "schema recovery"], topics,
  lab: {
    title: "대형 여행 schema의 비식별 architecture·migration review",
    scenario: "여러 domain과 31 tables가 한 dump에 있고 cross-context FK, association duplicates, nullable key, mixed naming, sample data와 서로 다른 retention이 있습니다.",
    setup: ["원본은 read-only·최소 접근으로 보존하고 checksum·DDL counts·redacted graph만 생성합니다.", "실제 literal을 쓰지 않는 합성 schema와 MySQL 8.4·Oracle 26ai isolated targets를 준비합니다.", "context owner, invariant, relation cardinality, access pattern, sensitivity와 retention worksheet를 만듭니다.", "expected catalog objects·constraints·golden ids·checksums와 rollback evidence를 고정합니다."],
    steps: ["quoted literal 없이 table/FK/index/statement manifest를 생성합니다.", "tables를 identity/travel/place/community/support 후보 context로 cluster하고 owner와 change reasons를 검증합니다.", "aggregate root/child와 independent reference를 command·lifecycle matrix로 정합니다.", "FK graph에서 optionality, unique cardinality, composite scope, cycle와 delete actions를 감사합니다.", "association duplicate/orphan와 context-crossing constraint를 합성 fixture로 재현합니다.", "주요 query의 equality/range/order tuple과 composite index plan을 측정합니다.", "rename/type/FK 변경을 expand/backfill/validate/contract migration으로 설계합니다.", "data class별 delete/anonymize/archive/hold와 backup expiry를 retention matrix로 만듭니다.", "migration dry-run에서 catalog, counts, checksum, orphan, plan과 application compatibility를 readback합니다.", "partial failure/rollback/PITR rehearsal 후 raw values 없는 release evidence를 승인합니다."],
    expectedResult: ["원본 값 없이도 schema 경계·aggregate·관계·risk backlog가 재현됩니다.", "다섯 exact examples의 stdout이 완전히 일치합니다.", "cardinality·cascade·association uniqueness·index·retention invariant가 catalog/data/plan 증거로 검증됩니다.", "old/new application 공존과 rollback이 가능한 migration package가 완성됩니다.", "backup/secondary copy까지 포함한 retention과 privacy-safe observability가 운영됩니다."],
    cleanup: ["isolated schemas·합성 rows·indexes·archives와 scan output을 run id로 삭제합니다.", "원본 dump checksum만 승인 ledger에 남기고 raw match context를 폐기합니다.", "temporary credentials/network access를 revoke합니다.", "Trip.sql과 production data는 변경하지 않습니다."],
    extensions: ["Graphviz 없이 catalog query로 context coupling matrix를 계산합니다.", "MySQL/Oracle online constraint validation과 lock profile을 비교합니다.", "event/outbox로 cross-context FK를 대체하는 strangler migration을 설계합니다.", "backup restore 뒤 retention deletion ledger를 replay합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 boundary/FK/lifecycle/index/retention 증거를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "same/cross-boundary edge를 구분합니다.", "root RESTRICT와 child CASCADE를 설명합니다.", "association duplicate를 constraint로 막습니다.", "composite index plan을 확인합니다.", "archive+active checksum을 reconciliation합니다."], hints: ["table 이름보다 identity, lifecycle과 transaction invariant를 먼저 기록하세요."], expectedOutcome: "대형 dump를 실행 대상이 아니라 안전한 architecture evidence로 읽습니다.", solutionOutline: ["inventory→contexts→aggregates→relations→indexes→evolution→retention 순서입니다."] },
    { difficulty: "응용", prompt: "Trip.sql 구조를 context별 migration backlog로 전환하세요.", requirements: ["원본 literal zero-output audit를 보장합니다.", "context map과 ownership을 작성합니다.", "aggregate/FK/cardinality risk를 severity로 분류합니다.", "association uniqueness와 tenant scope를 보강합니다.", "top access patterns의 index plan을 측정합니다.", "expand-contract migration과 compatibility를 설계합니다.", "retention/archive/backup expiry를 포함합니다.", "postflight·rollback/PITR rehearsal을 작성합니다."], hints: ["한 번에 service를 분리하기보다 coupling과 invariant evidence로 순서를 정하세요."], expectedOutcome: "실행 가능한 schema modernization roadmap이 완성됩니다.", solutionOutline: ["safe scan→domain workshop→risk ledger→migration packages→dry-run→release evidence 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 대형 dump·domain schema review 표준을 작성하세요.", requirements: ["checksum/redaction/sandbox 규칙을 둡니다.", "bounded context/aggregate 판정 근거를 정의합니다.", "FK cardinality/scope/delete 정책을 표준화합니다.", "naming/ownership/association 규칙을 둡니다.", "index/EXPLAIN/write budget을 요구합니다.", "expand-contract와 schema ledger를 정의합니다.", "retention/purge/archive/backup expiry를 포함합니다.", "postflight/recovery/privacy telemetry를 정의합니다."], hints: ["DDL 문법 검사와 domain correctness review를 별도 단계로 유지하세요."], expectedOutcome: "dump 입수부터 안전한 진화·폐기까지 governance가 완성됩니다.", solutionOutline: ["contain→inventory→model→constrain→measure→migrate→retain→recover 순서입니다."] },
  ],
  nextSessions: ["db-20-schema-migration-secret-hygiene"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["Trip.sql을 read-only safe scanner로 확인해 31 CREATE TABLE, 41 FOREIGN KEY, 31 PRIMARY KEY, 26 UNIQUE와 21 INSERT statement가 있음을 값 없이 확인했습니다.", "credential/identity/network-shaped patterns가 감지되어 actual literal·match context·host·hash·sample row는 출력하거나 복사하지 않았습니다.", "table/FK graph는 identity/travel/place/community/support 후보 경계를 보였지만 실제 bounded context는 use-case·owner·transaction evidence로 추가 검증하도록 구성했습니다.", "SQLite examples는 MySQL 8.4·Oracle 26ai의 FK/index/online DDL/partition·retention 동작을 대체하지 않습니다."] },
});

export default session;
