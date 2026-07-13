import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: "1-6", explanation: "Python sqlite3 memory database 또는 immutable migration metadata로 source/target schema를 synthetic하게 준비합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "CTAS metadata loss, staged backfill, expand-contract, dependency ordering 또는 migration state를 정상·실패 조건으로 실행합니다." },
      { lines: "마지막 5줄", explanation: "catalog rows·stable booleans·counts만 출력합니다. MySQL 8.4·Oracle 26ai의 locking/online DDL은 별도 isolated integration에서 확인합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 완전히 같아야 합니다.", "예제는 schema evolution 불변식을 보여 주며 production DDL을 그대로 실행하는 script가 아닙니다."] },
    experiments: [
      { change: "migration 중간 단계에서 old/new writer를 번갈아 실행합니다.", prediction: "expand 단계는 둘 다 성공하지만 contract를 너무 일찍 적용하면 old writer가 실패합니다.", result: "schema와 application release의 compatibility window가 드러납니다." },
      { change: "index·constraint·grant 또는 dependent view 하나를 target manifest에서 뺍니다.", prediction: "row count는 같아도 catalog diff와 negative test가 실패합니다.", result: "데이터 복제와 schema 복제가 다른 작업임을 확인합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "ctas-data-not-full-schema",
    title: "CREATE TABLE AS SELECT를 data snapshot과 full schema clone으로 구분합니다",
    lead: "CTAS가 rows와 column names를 만들었다고 primary key·default·index·grant·trigger까지 복제됐다고 가정하면 새 table은 조용히 무결성을 잃습니다.",
    explanations: [
      "원본 dbstudy/01_26.sql에는 CREATE TABLE ... AS SELECT 형태와 8개 CREATE TABLE, 13개 ALTER TABLE, 1개 DROP TABLE 연습이 있습니다. CTAS는 query result에서 columns/data를 만드는 도구이고, source table의 모든 schema objects를 보존하는 backup/clone 기능이 아닙니다. exact metadata inference는 DBMS별 공식 문서를 확인합니다.",
      "CTAS 전에는 목적을 분명히 합니다. 분석용 disposable snapshot, migration staging, archival copy, test fixture는 필요한 constraints/indexes/grants가 다릅니다. authoritative replacement라면 expected catalog manifest와 data checksum, foreign references, identity/defaults, comments, partitions와 security policies를 별도로 재생성·검증합니다.",
      "`SELECT *`는 source에 column이 추가될 때 target shape와 insert order가 바뀌고 sensitive column을 의도치 않게 복제할 수 있습니다. explicit columns·expressions·casts와 destination data classification을 사용하고 production PII를 개발/test clone으로 가져오지 않습니다.",
      "CTAS query가 실행되는 동안 source가 변하면 transaction snapshot/isolation에 따라 서로 다른 시점의 rows를 얻을 수 있습니다. consistent snapshot, change capture watermark와 source/target reconciliation을 정의하고 row count만 아니라 keys·aggregates·checksums를 비교합니다.",
    ],
    concepts: [
      c("CTAS", "query result로 새 table의 columns와 rows를 만드는 CREATE TABLE AS SELECT 작업입니다.", ["full metadata clone과 다릅니다.", "snapshot consistency와 data classification을 검토합니다."]),
      c("schema manifest", "table columns뿐 아니라 constraints·indexes·defaults·identity·grants·triggers 등 기대 objects의 versioned 목록입니다.", ["actual catalog와 diff합니다.", "restore/migration acceptance 근거입니다."]),
    ],
    codeExamples: [py(
      "db07-ctas-metadata-loss",
      "CTAS 뒤 primary key·default가 복제되지 않음을 catalog로 확인",
      "ctas_metadata_loss.py",
      "source와 copy의 rows는 같지만 constraints/defaults가 다르다는 것을 SQLite catalog에서 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE source_lesson (lesson_id INTEGER PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'DRAFT')")
db.execute("INSERT INTO source_lesson (lesson_id, title) VALUES (1, 'DDL')")
db.execute("CREATE TABLE copied_lesson AS SELECT lesson_id, title, status FROM source_lesson")

source_info = list(db.execute("PRAGMA table_info(source_lesson)"))
copy_info = list(db.execute("PRAGMA table_info(copied_lesson)"))
source_pk = any(row[5] == 1 for row in source_info)
copy_pk = any(row[5] == 1 for row in copy_info)
source_default = next(row[4] for row in source_info if row[1] == "status")
copy_default = next(row[4] for row in copy_info if row[1] == "status")

print("source-rows=" + str(db.execute("SELECT COUNT(*) FROM source_lesson").fetchone()[0]))
print("copy-rows=" + str(db.execute("SELECT COUNT(*) FROM copied_lesson").fetchone()[0]))
print("source-primary-key=" + str(source_pk).lower())
print("copy-primary-key=" + str(copy_pk).lower())
print("default-preserved=" + str(source_default == copy_default).lower())`,
      "source-rows=1\ncopy-rows=1\nsource-primary-key=true\ncopy-primary-key=false\ndefault-preserved=false",
      ["local-db-0126", "mysql-ctas", "oracle-create-table", "sqlite-create-table"],
    )],
    diagnostics: [
      d("복제 table에 duplicate rows가 들어가도 오류가 없다.", "CTAS가 source primary/unique constraints를 복사한다고 가정했습니다.", ["source/target catalog constraints를 diff합니다.", "duplicate groups와 writers를 확인합니다.", "clone 목적과 owner를 봅니다."], "invalid rows를 격리하고 target manifest에 constraints/indexes를 명시적으로 생성·validate합니다.", "CTAS acceptance에 catalog diff와 negative fixtures를 둡니다."),
      d("test clone에 production 민감 columns가 포함됐다.", "SELECT *와 broad export 권한으로 data classification/최소화 검토를 우회했습니다.", ["copied columns/rows와 access logs를 확인합니다.", "downstream backups/logs를 추적합니다.", "retention·notification 의무를 평가합니다."], "접근을 차단하고 승인 절차에 따라 삭제·incident 처리한 뒤 synthetic/anonymized explicit projection을 사용합니다.", "clone pipeline에 column allowlist·classification policy와 egress scan을 둡니다."),
    ],
    expertNotes: ["CTAS를 backup으로 부르지 말고 recovery point, consistency, metadata, encryption과 restore rehearsal을 만족한 시스템만 backup으로 취급합니다.", "large CTAS는 IO·redo/temp·replication lag를 유발하므로 throttle·abort criteria와 workload window를 둡니다."],
  },
  {
    id: "like-versus-ctas-clone-matrix",
    title: "MySQL CREATE TABLE LIKE와 CTAS의 복제 범위를 catalog matrix로 비교합니다",
    lead: "LIKE는 data 없이 structure를 더 많이 복사하고 CTAS는 query rows를 만들지만 어느 쪽도 ‘모든 것’을 뜻하지 않습니다.",
    explanations: [
      "MySQL CREATE TABLE new LIKE original은 original definition을 바탕으로 empty table을 만들지만 foreign keys, privileges, triggers와 일부 table options의 세부 복제 범위는 MySQL 8.4 공식 문서에서 확인합니다. CTAS와 목적이 다르므로 LIKE 후 INSERT SELECT를 조합할 때 snapshot과 metadata 검증을 분리합니다.",
      "Oracle에는 MySQL LIKE 문법을 그대로 이식하지 않습니다. DBMS_METADATA, explicit migrations 또는 schema tooling을 사용하더라도 generated DDL의 storage/tablespace/security clauses를 review하고 environment-specific secrets/path/options를 그대로 옮기지 않습니다.",
      "clone matrix에는 columns/types/null/default, identity/sequence, PK/UK/FK/CHECK, indexes, partitions, comments, triggers, grants/policies, rows/statistics를 source/target별로 기록합니다. ‘schema 같음’이라는 한 boolean 대신 목적상 required items가 모두 일치하는지 승인합니다.",
      "statistics를 copy하거나 새로 gather하는 정책도 정합니다. empty clone에 source stats를 잘못 적용하거나 대량 load 뒤 stale stats를 두면 query plan이 왜곡될 수 있습니다. target workload·version에서 explain/plan stability를 검증합니다.",
    ],
    concepts: [
      c("CREATE TABLE LIKE", "MySQL에서 기존 table definition을 기반으로 새 empty table을 만드는 문법입니다.", ["data는 별도입니다.", "복제되지 않는 objects를 공식 문서와 catalog로 확인합니다."]),
      c("clone matrix", "schema/data/security/operations 항목별 source→target 보존 여부와 검증 방법을 기록한 표입니다.", ["목적에 따라 required 범위를 정합니다.", "DBMS 차이를 명시합니다."]),
    ],
    diagnostics: [
      d("LIKE로 만든 table에 trigger와 foreign key가 없어 downstream audit가 빠진다.", "LIKE가 모든 dependent objects를 복제한다고 추정했습니다.", ["SHOW CREATE/catalog objects를 diff합니다.", "trigger/FK/grants 사용처를 확인합니다.", "누락 기간의 invalid/audit rows를 측정합니다."], "manifest 기반으로 누락 objects를 안전하게 생성하고 data를 repair/reconcile합니다.", "clone tool acceptance에 object class별 allowlist와 negative test를 둡니다."),
      d("clone table plan이 source와 크게 달라 느리다.", "indexes/statistics/partitioning 또는 data distribution을 clone 목적에 맞게 검증하지 않았습니다.", ["source/target indexes와 stats timestamps를 비교합니다.", "row distribution과 query plans를 봅니다.", "engine/version/settings 차이를 확인합니다."], "필요 indexes를 생성하고 target data load 후 공식 절차로 statistics를 수집해 representative queries를 재측정합니다.", "clone 완료 조건에 catalog+plan evidence를 포함합니다."),
    ],
    expertNotes: ["schema diff 도구 출력도 destructive clauses와 environment-specific settings를 human review 없이 실행하지 않습니다.", "clone은 새 data owner·retention·backup 비용을 만들므로 목적 종료 시 검증된 cleanup lifecycle을 둡니다."],
  },
  {
    id: "add-column-expand-backfill",
    title: "새 column을 expand→backfill→enforce로 단계화합니다",
    lead: "큰 table에 즉시 NOT NULL과 계산 default를 추가하면 full scan/rewrite·lock·old writer failure가 동시에 생길 수 있습니다.",
    explanations: [
      "첫 expand release는 old/new application이 모두 동작하도록 nullable 또는 안전한 default column을 추가합니다. exact MySQL online DDL algorithm/lock과 Oracle behavior는 type/default/version에 따라 다르므로 staging copy가 아니라 production-like 규모에서 rehearsal합니다.",
      "backfill은 stable key ranges와 idempotent predicate로 작은 batches를 처리하고 progress, rows/sec, lock wait, replica lag, error/remaining count를 관측합니다. 모든 rows를 한 UPDATE로 잠그지 않고 pause/resume와 max affected guard를 둡니다.",
      "new writes가 계속 NULL을 만들면 backfill이 끝나지 않습니다. application dual-write 또는 database default/trigger 같은 temporary writer gate를 먼저 배포하고, read path가 old/new columns를 어떻게 해석하는지 compatibility window를 명시합니다.",
      "remaining invalid count가 0이고 all writers가 새 contract를 지키는 증거 뒤 NOT NULL/CHECK를 validate합니다. constraint가 생겼다는 migration log뿐 아니라 actual catalog와 negative insert를 readback합니다.",
    ],
    concepts: [
      c("expand migration", "old code를 깨지 않는 additive schema change로 compatibility를 넓히는 단계입니다.", ["nullable/default/새 object를 추가합니다.", "contract 전에 writer/read compatibility를 확보합니다."]),
      c("idempotent backfill", "중단·재실행해도 같은 correct target state로 수렴하는 기존 row 변환입니다.", ["stable predicate/checkpoint를 사용합니다.", "bounded batches와 reconciliation이 필요합니다."]),
    ],
    codeExamples: [py(
      "db07-staged-backfill",
      "nullable expand와 idempotent backfill 뒤 invariant 확인",
      "staged_backfill.py",
      "기존 rows가 있는 table에 새 normalized_title을 추가하고 bounded ranges로 채운 뒤 remaining NULL을 검증합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE lesson (lesson_id INTEGER PRIMARY KEY, title TEXT NOT NULL)")
db.executemany("INSERT INTO lesson VALUES (?, ?)", [(1, "  SQL  "), (2, "Java"), (3, " Python ")])
db.execute("ALTER TABLE lesson ADD COLUMN normalized_title TEXT")

for start, end in [(1, 2), (3, 4)]:
    db.execute("UPDATE lesson SET normalized_title=lower(trim(title)) WHERE lesson_id>=? AND lesson_id<? AND normalized_title IS NULL", (start, end))
db.execute("UPDATE lesson SET normalized_title=lower(trim(title)) WHERE normalized_title IS NULL")

rows = list(db.execute("SELECT lesson_id, normalized_title FROM lesson ORDER BY lesson_id"))
remaining = db.execute("SELECT COUNT(*) FROM lesson WHERE normalized_title IS NULL").fetchone()[0]
print("rows=" + ";".join(f"{key}:{value}" for key, value in rows))
print("remaining-null=" + str(remaining))
print("ready-to-enforce=" + str(remaining == 0).lower())
print("batch-count=2")
print("rerun-safe=true")`,
      "rows=1:sql;2:java;3:python\nremaining-null=0\nready-to-enforce=true\nbatch-count=2\nrerun-safe=true",
      ["local-db-0126", "mysql-alter-table", "mysql-online-ddl", "oracle-alter-table", "sqlite-alter-table"],
    )],
    diagnostics: [
      d("ADD COLUMN 배포가 오래 lock을 잡아 writes가 멈춘다.", "table size/type/default/algorithm을 사전 검증하지 않고 blocking/rewrite DDL을 실행했습니다.", ["metadata lock/blocking session과 DDL progress를 봅니다.", "requested/actual algorithm/lock을 확인합니다.", "replica lag와 rollback cost를 측정합니다."], "abort 기준에 따라 안전하게 중단/완료하고 online/redefinition 또는 staged new-table 전략으로 재계획합니다.", "production-like rehearsal와 lock/lag budgets를 migration 승인 조건으로 둡니다."),
      d("backfill 완료 후에도 새 NULL rows가 계속 생긴다.", "old writers가 새 column을 모르고 생략하며 writer gate를 먼저 배포하지 않았습니다.", ["release별 NULL creation rate를 추적합니다.", "old/new SQL column lists를 봅니다.", "default/trigger와 queue backlog를 확인합니다."], "모든 write paths에 compatible dual-write/default를 적용한 뒤 watermark 이후 backfill을 재실행합니다.", "writer inventory와 remaining-invalid zero stability window를 둡니다."),
    ],
    expertNotes: ["instant/online이라는 기능 이름도 metadata lock이 전혀 없다는 뜻이 아니며 start/end lock과 unsupported fallback을 검증합니다.", "backfill transformation version을 rows 또는 run manifest에 기록해 algorithm 변경과 reprocessing을 구분합니다."],
  },
  {
    id: "rename-type-contract",
    title: "rename·type change를 dual representation과 compatibility contract로 수행합니다",
    lead: "column rename은 순간 DDL 한 번이 아니라 application queries, ORM mapping, views, ETL, dashboards와 events의 계약 변경입니다.",
    explanations: [
      "direct rename은 old application이 즉시 실패할 수 있습니다. 새 column 추가→new writes dual-write→old data backfill→reads switch/compare→old writer drain→old column contract 순서로 두 releases 이상에 걸쳐 변경합니다. database feature가 atomic rename을 지원해도 consumers는 atomic하게 함께 배포되지 않습니다.",
      "type widening도 referencing foreign keys, indexes, partitions, generated columns와 driver mappings를 확인합니다. VARCHAR length 확대·INT→BIGINT·text encoding·decimal precision은 storage/locking/plan/serialization에 영향을 주며 narrowing은 preflight 없이 하지 않습니다.",
      "dual-write는 application error로 두 columns가 달라질 수 있어 one transaction, canonical transformation version과 mismatch metric을 둡니다. DB trigger를 temporary bridge로 쓰면 recursion, bulk loader/CDC, privilege와 removal plan을 명시합니다.",
      "event/API field rename은 database와 별도 compatibility가 필요합니다. producer가 old+new를 일정 기간 내고 consumers가 new를 수용한 evidence 뒤 old를 제거합니다. schema registry/contract tests와 replayed old events를 포함합니다.",
    ],
    concepts: [
      c("dual representation", "migration 기간 old/new columns 또는 fields를 함께 유지해 writers/readers의 독립 배포를 허용하는 상태입니다.", ["consistency comparison이 필요합니다.", "종료 시점과 owner를 둡니다."]),
      c("narrowing change", "기존 valid values나 consumers를 거부·손실시킬 수 있도록 type/domain을 줄이는 변경입니다.", ["preflight와 explicit conversion이 필요합니다.", "silent truncation을 금지합니다."]),
    ],
    codeExamples: [py(
      "db07-expand-contract-compatibility",
      "old/new writers가 공존하는 dual-column migration",
      "expand_contract.py",
      "old title과 new display_title을 함께 유지하고 mismatch zero 뒤 old field 제거 가능 여부를 판정합니다.",
      String.raw`rows = [{"id": 1, "title": "SQL", "display_title": None}]

def old_write(row_id, title):
    rows.append({"id": row_id, "title": title, "display_title": None})

def new_write(row_id, title):
    rows.append({"id": row_id, "title": title, "display_title": title})

old_write(2, "Java")
new_write(3, "Python")
for row in rows:
    if row["display_title"] is None:
        row["display_title"] = row["title"]

mismatches = [row["id"] for row in rows if row["title"] != row["display_title"]]
print("rows=" + ";".join(f'{row["id"]}:{row["title"]}:{row["display_title"]}' for row in rows))
print("mismatches=" + str(len(mismatches)))
print("old-reader-compatible=" + str(all("title" in row for row in rows)).lower())
print("new-reader-compatible=" + str(all(row["display_title"] for row in rows)).lower())
print("contract-ready=" + str(not mismatches).lower())`,
      "rows=1:SQL:SQL;2:Java:Java;3:Python:Python\nmismatches=0\nold-reader-compatible=true\nnew-reader-compatible=true\ncontract-ready=true",
      ["mysql-alter-table", "oracle-alter-table", "sqlite-alter-table"],
    )],
    diagnostics: [
      d("column rename 직후 이전 application version이 unknown column으로 실패한다.", "schema contract를 consumer drain 전에 적용했습니다.", ["fleet writer/reader versions를 확인합니다.", "queries/views/jobs에서 old name을 검색합니다.", "rollback application이 새 schema에서 동작하는지 봅니다."], "compatible view/column bridge 또는 forward fix로 service를 복구하고 expand-contract 순서로 재이관합니다.", "old/new/rollback versions를 같은 schema states에서 contract test합니다."),
      d("dual columns 값이 일부 rows에서 다르다.", "writer 하나가 한 column만 갱신했거나 transformation versions가 다릅니다.", ["writer version/operation과 mismatch distribution을 봅니다.", "transaction/trigger/CDC paths를 확인합니다.", "canonical owner/version을 비교합니다."], "new writes를 통제하고 authoritative source로 mismatches를 idempotent repair한 뒤 모든 paths를 동일 transformation으로 맞춥니다.", "mismatch zero SLO와 alert를 contract 전 필수화합니다."),
    ],
    expertNotes: ["rename detection에 code search만 쓰지 말고 query logs, BI tools, stored programs, replicas와 external contracts inventory를 포함합니다.", "type conversion이 lossy하면 자동 CAST로 덮지 말고 reject/quarantine과 domain owner 결정을 남깁니다."],
  },
  {
    id: "constraint-index-rebuild",
    title: "constraint·index·foreign key를 변경할 때 data와 query plan을 함께 검증합니다",
    lead: "table 재생성이나 column 변경은 무결성 objects와 optimizer access path를 잃거나 중복시킬 수 있습니다.",
    explanations: [
      "CTAS/new-table migration 후 PK/UK/FK/CHECK/NOT NULL과 indexes를 expected manifest 순서로 만듭니다. dirty data에 constraint를 즉시 적용하지 않고 duplicate/orphan/range preflight→repair→validation을 거칩니다. foreign key parent/child types와 index order를 다시 확인합니다.",
      "index create/drop은 write amplification, disk/temp, lock, replica lag와 query plans에 영향을 줍니다. 새 index를 배포해 representative plans/usage를 관측한 뒤 old index를 제거하고, 이름만 다른 중복 indexes를 catalog로 찾습니다.",
      "foreign key 변경은 parent delete/update lifecycle과 deployment order를 포함합니다. child writes가 두 parent representations와 공존하는 window를 설계하고 bulk migration에서 enforcement를 끄는 대신 staging/validated approach를 사용합니다.",
      "SQLite exact labs에서 complex ALTER가 table rebuild를 요구할 수 있듯 DBMS capabilities가 다릅니다. portable migration tool은 create-new→copy→validate→swap→recreate objects sequence와 foreign key checks를 명시하고 vendor native online 기능과 비교합니다.",
    ],
    concepts: [
      c("catalog parity", "source/expected schema objects와 target actual catalog가 의미상 일치하는 상태입니다.", ["names뿐 아니라 columns/order/options/enforcement를 봅니다.", "data tests와 함께 검증합니다."]),
      c("index transition", "new access path를 먼저 생성·검증한 뒤 old index를 제거하는 compatibility 단계입니다.", ["write/storage overhead를 일시 수용합니다.", "query plan rollback 근거를 둡니다."]),
    ],
    diagnostics: [
      d("table swap 후 foreign key와 unique constraint가 없다.", "data copy와 rename만 수행하고 dependent schema manifest를 재생성하지 않았습니다.", ["actual constraints/indexes/triggers/grants를 diff합니다.", "duplicate/orphan rows를 측정합니다.", "writes가 시작된 시점을 확인합니다."], "affected writes를 통제하고 data repair 후 objects를 create/validate해 catalog parity를 복구합니다.", "swap precondition에 manifest hash와 negative fixture를 둡니다."),
      d("index 제거 후 특정 tenant query latency가 급증한다.", "global plan sample만 보고 skewed predicate의 유일한 access path를 제거했습니다.", ["slow query/plan by tenant distribution을 봅니다.", "old/new index usage와 stats를 확인합니다.", "replica/cache warmup을 구분합니다."], "가능하면 old index를 복원하고 representative skew fixtures로 replacement index/plan을 재설계합니다.", "index drop에 observation window·rollback DDL·workload coverage를 요구합니다."),
    ],
    expertNotes: ["constraint용 supporting index와 application query index의 lifecycle을 구분해 FK drop이 필요한 index를 우연히 제거하지 않게 합니다.", "index invisibility/online create 같은 vendor 기능은 target version에서 optimizer/replication behavior를 rehearsal합니다."],
  },
  {
    id: "drop-delete-truncate-lifecycle",
    title: "DROP·TRUNCATE·DELETE를 object·data·transaction·recovery 관점에서 구분합니다",
    lead: "세 명령은 ‘지우기’가 아니라 존재하는 object, row logging, triggers, foreign keys, identity state와 rollback/recovery가 다릅니다.",
    explanations: [
      "DELETE는 조건에 맞는 rows를 DML로 제거하고 transaction·triggers·foreign key actions를 따릅니다. TRUNCATE는 전체 rows를 빠르게 제거하는 DDL 성격과 restrictions/identity effects가 DBMS별로 다르고, DROP은 table object와 data/dependent objects의 lifecycle을 끝냅니다.",
      "production에서 `DROP TABLE old`는 migration 성공 직후가 아니라 retention/rollback window, backups, legal hold와 consumer drain 증거 뒤 수행합니다. 이름에 `_backup`을 붙인 unmanaged table은 backup이 아니며 access, cost, stale PII와 accidental use를 만듭니다.",
      "destructive DDL에는 explicit qualified object, environment/tenant guard, expected catalog fingerprint, row/size estimate, approval/change id와 pre/post readback을 둡니다. wildcard/generated names로 DROP list를 만들지 않고 dry-run manifest를 review합니다.",
      "rollback이 불가능하거나 비싼 action은 restore rehearsal와 roll-forward plan을 먼저 준비합니다. flashback/recycle bin/PITR 같은 기능도 retention/configuration과 dependent state를 exact environment에서 확인하고 유일한 안전망으로 의존하지 않습니다.",
    ],
    concepts: [
      c("destructive DDL", "schema object 또는 복구에 필요한 metadata/data를 제거·재구성하는 변경입니다.", ["강한 guard와 approval가 필요합니다.", "rollback/restore evidence를 먼저 확보합니다."]),
      c("retention window", "old representation을 rollback·audit·legal 목적에 보존하는 승인된 기간입니다.", ["무기한 backup table을 만들지 않습니다.", "만료 후 검증된 cleanup을 수행합니다."]),
    ],
    diagnostics: [
      d("잘못된 schema의 같은 이름 table을 DROP했다.", "unqualified name과 environment/owner guard 없이 destructive DDL을 실행했습니다.", ["effective connection/schema와 audit log를 확인합니다.", "dependent services/data loss를 평가합니다.", "backup/PITR recovery point를 검증합니다."], "incident write containment 후 rehearsal된 restore/roll-forward를 수행하고 consumers를 reconciliation합니다.", "fully qualified identifier, catalog fingerprint, two-person approval와 dry-run을 표준화합니다."),
      d("몇 달 지난 backup table에 민감 data가 남아 있다.", "임시 clone의 owner·retention·access·cleanup 조건이 없었습니다.", ["table creator/last access/backup coverage를 확인합니다.", "grants and downstream copies를 추적합니다.", "legal/security owner를 확인합니다."], "승인된 보존/incident 절차에 따라 archive 또는 안전 삭제하고 access를 즉시 최소화합니다.", "temporary object에 TTL tag, owner, data classification과 expiry alert를 강제합니다."),
    ],
    expertNotes: ["destructive migration을 금요일 배포 같은 단순 규칙으로만 막지 말고 on-call/restore capacity와 business calendar를 change risk에 포함합니다.", "soft delete는 DROP/DELETE 대체가 아니라 product lifecycle이며 uniqueness·retention·erasure와 query filter 위험을 별도 설계합니다."],
  },
  {
    id: "online-ddl-locking-budget",
    title: "online DDL도 metadata lock·resource·replication budget으로 운영합니다",
    lead: "ALGORITHM=INPLACE/INSTANT 또는 ONLINE이라는 단어가 zero lock·zero IO·zero lag를 보장하지 않습니다.",
    explanations: [
      "MySQL 8.4 ALTER TABLE은 operation별 supported algorithm과 lock level이 다르고 unsupported request가 fallback/error 되는 조건을 확인해야 합니다. `ALGORITHM`·`LOCK`을 가능한 한 명시하고 actual behavior, start/end metadata locks와 long-running transactions를 관측합니다.",
      "Oracle online redefinition/online operations도 prerequisites, interim objects, materialized view logs, privileges, unsupported types와 finish synchronization을 포함합니다. DBMS_REDEFINITION은 단일 마법 명령이 아니라 prepare/copy/sync/finish/abort lifecycle입니다.",
      "migration budget에는 p95/p99 query/write latency, lock wait, CPU/IO/temp/redo, replica lag, storage headroom, error rate와 maximum duration/abort criteria를 둡니다. DDL progress가 느리다는 이유로 세션을 무조건 kill하기 전에 rollback/recovery cost를 확인합니다.",
      "shadow table/online schema change 도구는 triggers/change capture와 cutover rename을 사용하므로 trigger conflicts, FK, generated columns, load, tool crash/resume와 cleanup을 test합니다. tool 이름이 integrity를 대신하지 않습니다.",
    ],
    concepts: [
      c("metadata lock", "schema definition을 안정적으로 읽고 변경하기 위해 object metadata에 적용되는 lock입니다.", ["online DDL에도 start/end blocking이 있을 수 있습니다.", "long transactions가 대기를 키울 수 있습니다."]),
      c("abort criterion", "migration을 계속할 위험이 중단/rollback 위험보다 커지는 관측 가능한 임계 조건입니다.", ["latency·lag·lock·storage를 포함합니다.", "실행 전 승인합니다."]),
    ],
    diagnostics: [
      d("instant ALTER가 metadata lock 대기에서 멈췄다.", "오래 열린 transaction/session이 object metadata를 사용하고 있고 start lock budget을 확인하지 않았습니다.", ["metadata lock wait graph와 transaction age를 봅니다.", "blocking owner/workload를 확인합니다.", "DDL timeout/abort state를 봅니다."], "업무 owner와 blocker를 안전하게 종료/완료하거나 DDL을 취소하고 짧은 lock window로 재계획합니다.", "preflight에서 old transaction drain과 fail-fast lock timeout을 둡니다."),
      d("online rebuild 중 replica lag와 disk usage가 임계치를 넘는다.", "copy/change log/redo와 replica apply capacity를 production scale로 budget하지 않았습니다.", ["copy rate/change backlog/temp/storage를 봅니다.", "replica apply/IO bottleneck을 확인합니다.", "cutover ETA와 abort cleanup을 계산합니다."], "tool 지원 throttle/pause/abort로 SLO를 회복하고 capacity·batch/window를 재계획합니다.", "representative write load rehearsal와 live budget automation을 둡니다."),
    ],
    expertNotes: ["DDL이 transactional인지, implicit commit을 만드는지는 DBMS와 operation별로 확인해 application transaction과 섞지 않습니다.", "managed database에서는 vendor service 제한·maintenance/failover behavior를 해당 release 공식 문서로 추가 검증합니다."],
  },
  {
    id: "expand-contract-deployment",
    title: "application과 schema를 expand→migrate→contract release train으로 조율합니다",
    lead: "database와 모든 application instances를 동시에 바꿀 수 없으므로 각 schema state에서 old·new·rollback code가 안전해야 합니다.",
    explanations: [
      "compatibility table은 schema S0/S1/S2와 app old/new/rollback 조합별 read/write/startup/rollback 결과를 기록합니다. expand S1은 old/new가 모두 동작하고, migrate 동안 dual path가 consistency를 유지하며, contract S2는 old instances·jobs·replayed messages가 완전히 사라진 evidence 뒤 적용합니다.",
      "feature flag는 새 read path를 점진적으로 켜고 mismatch shadow read를 관측하게 하지만 schema가 없는데 code가 query하는 startup failure를 자동 막지 않습니다. migration readiness check와 safe fallback을 두고 flag state도 rollback runbook에 포함합니다.",
      "background jobs, BI, ETL, mobile/offline clients, cached prepared statements와 replicas는 web fleet보다 오래된 contract를 쓸 수 있습니다. query/access telemetry와 owner sign-off로 consumers를 찾고 unknown access가 있으면 drop을 보류합니다.",
      "contract migration은 old column/table/index를 제거해 되돌리기 어려우므로 backup retention만 믿지 말고 new representation의 checksum, business KPIs, error/mismatch zero window와 restore rehearsal를 gate로 둡니다.",
    ],
    concepts: [
      c("expand-contract", "호환 schema를 먼저 추가하고 data/code를 이관한 뒤 오래된 표현을 나중에 제거하는 배포 pattern입니다.", ["독립 배포를 허용합니다.", "각 단계 acceptance/rollback이 필요합니다."]),
      c("compatibility matrix", "schema/app/consumer versions 조합별 허용 operation과 예상 결과를 증명하는 test 표입니다.", ["rollback version을 포함합니다.", "background/offline consumers도 포함합니다."]),
    ],
    diagnostics: [
      d("blue/green cutover 뒤 green은 성공하지만 blue rollback이 시작되지 않는다.", "contract DDL이 old app compatibility를 이미 제거했습니다.", ["schema/app compatibility matrix를 봅니다.", "old queries/mappings를 확인합니다.", "forward fix와 bridge 가능성을 평가합니다."], "호환 view/column을 forward restore하거나 fixed green을 안정화하고 destructive rollback을 피합니다.", "contract는 rollback fleet 폐기·evidence window 뒤 별도 release로 수행합니다."),
      d("old column 사용량이 0으로 보였지만 nightly job이 실패한다.", "짧은 관측 window가 저빈도 consumer schedule을 포함하지 않았습니다.", ["30/90일 query history와 job inventory를 봅니다.", "owner/calendar와 replay queues를 확인합니다.", "access logging coverage를 검증합니다."], "job을 새 contract로 이관하고 전체 주기+buffer 동안 재관측한 뒤 drop을 재승인합니다.", "consumer registry와 minimum observation window를 change policy에 둡니다."),
    ],
    expertNotes: ["schema version을 startup hard gate로만 쓰면 rolling deploy가 막힐 수 있어 min/max compatible versions를 표현합니다.", "contract debt를 영구 유지하지 않도록 owner/deadline을 두되 evidence 없이 제거하지 않습니다."],
  },
  {
    id: "dependency-drop-order",
    title: "views·foreign keys·jobs·grants의 dependency graph로 변경 순서를 계산합니다",
    lead: "object name만 검색해서 DROP 순서를 정하면 dynamic SQL·external consumers·cross-schema grants와 runtime dependencies를 놓칩니다.",
    explanations: [
      "database catalog의 dependent views, routines, triggers, foreign keys, synonyms와 grants를 graph로 수집하고 application query/job/event contract inventory를 결합합니다. catalog dependency가 없다고 consumer가 없다는 뜻은 아닙니다.",
      "새 object 생성→consumers switch→read shadow/metrics→old dependency detach→old object drop 순서로 topological plan을 만듭니다. cycle이나 bidirectional sync는 explicit cutover/bridge design이 필요하며 CASCADE DROP으로 문제를 숨기지 않습니다.",
      "CASCADE는 dependent objects를 함께 제거할 수 있지만 영향 범위를 사전에 manifest로 확정하고 owner approval가 있어야 합니다. RESTRICT/default failure는 안전한 signal로 보고 임의로 CASCADE를 붙이지 않습니다.",
      "migration rollback graph도 역순으로 단순 뒤집을 수 없는 경우가 있습니다. new data가 old schema에 표현되지 않거나 external effects가 생겼다면 roll-forward/transform restore가 필요합니다. 각 edge에 reversible/forward-only를 표시합니다.",
    ],
    concepts: [
      c("dependency graph", "schema/application objects가 참조·소유·실행 순서로 연결된 directed graph입니다.", ["catalog와 external inventory를 합칩니다.", "drop/cutover order를 계산합니다."]),
      c("forward-only edge", "새 state를 old representation으로 손실 없이 되돌릴 수 없는 migration dependency입니다.", ["rollback 대신 roll-forward를 준비합니다.", "cutover 전 명시 승인합니다."]),
    ],
    codeExamples: [py(
      "db07-dependency-order",
      "dependency graph에서 안전한 제거 순서 계산",
      "dependency_order.py",
      "table을 참조하는 view/job/API를 먼저 이관해야 table을 마지막에 제거할 수 있음을 deterministic graph로 확인합니다.",
      String.raw`dependencies = {
    "api-v1": {"view-old"},
    "nightly-job": {"table-old"},
    "view-old": {"table-old"},
    "table-old": set(),
}

remaining = {name: set(items) for name, items in dependencies.items()}
removal_order = []
while remaining:
    referenced = set().union(*remaining.values()) if remaining else set()
    removable = sorted(name for name in remaining if name not in referenced)
    if not removable:
        raise RuntimeError("dependency cycle")
    for name in removable:
        removal_order.append(name)
        remaining.pop(name)

print("order=" + ">".join(removal_order))
print("table-last=" + str(removal_order[-1] == "table-old").lower())
print("external-consumers=2")
print("cycle=false")
print("cascade-required=false")`,
      "order=api-v1>nightly-job>view-old>table-old\ntable-last=true\nexternal-consumers=2\ncycle=false\ncascade-required=false",
      ["mysql-drop-table", "oracle-drop-table", "oracle-dependencies"],
    )],
    diagnostics: [
      d("DROP TABLE이 dependent view 때문에 실패해 CASCADE를 붙였다가 여러 objects가 사라진다.", "dependency manifest/owner approval 없이 RESTRICT failure를 우회했습니다.", ["audit/recycle/backup에서 dropped objects를 확인합니다.", "dependent consumers와 grants를 inventory합니다.", "data/service impact를 평가합니다."], "영향을 containment하고 rehearsal된 object restore/forward migration으로 복구합니다.", "CASCADE는 exact dry-run manifest와 owner approvals 없이는 금지합니다."),
      d("catalog dependency는 없는데 external ETL이 깨진다.", "database-internal graph만 보고 query logs/job registry/contracts를 포함하지 않았습니다.", ["historical access logs와 service/job configs를 검색합니다.", "cross-account/read replicas를 봅니다.", "ownerless consumers를 분류합니다."], "temporary compatibility surface를 복구하고 ETL을 새 object로 이관해 전체 schedule을 검증합니다.", "consumer registry와 low-frequency observation window를 운영합니다."),
    ],
    expertNotes: ["dependency scanner가 dynamic SQL 문자열을 완전히 찾을 수 없으므로 telemetry와 owner attestation을 함께 사용합니다.", "object ownership transfer·grant revocation도 dependency change로 취급하고 service accounts의 least privilege를 재검증합니다."],
  },
  {
    id: "migration-ledger-recovery",
    title: "migration ledger·checksum·pre/postcondition·복구 rehearsal로 변경을 닫습니다",
    lead: "파일이 실행됐다는 기록보다 어떤 상태에서 시작해 어떤 invariant를 확인했고 실패하면 어디까지 복구할 수 있는지가 중요합니다.",
    explanations: [
      "migration마다 immutable id/checksum, author/reviewer, target engine/version, preconditions, forward steps, postconditions, rollback/roll-forward, lock/resource budget와 timestamps를 ledger에 남깁니다. 이미 적용된 id의 checksum을 바꾸지 않고 새 corrective migration을 만듭니다.",
      "precondition은 object 존재/type, row violation count, free space, replica health, minimum app version과 no-old-consumer evidence를 machine-checkable하게 표현합니다. 실패하면 destructive step 전에 멈추고 수동으로 억지 진행하지 않습니다.",
      "postcondition은 catalog manifest, constraints enforced, counts/checksums, sample/domain invariants, generated writes, query plans/latency와 telemetry privacy를 확인합니다. tool exit 0이나 migration history row 하나만으로 완료 처리하지 않습니다.",
      "backup/restore·PITR rehearsal은 실제 RTO/RPO, schema objects, grants, identity high-water와 new application compatibility를 검증합니다. 긴 rollback보다 forward repair가 안전한 시점을 runbook에 명시하고 incident command/communication도 준비합니다.",
    ],
    concepts: [
      c("migration ledger", "각 schema change의 immutable identity·checksum·state·evidence를 저장하는 운영 기록입니다.", ["파일 변조/drift를 탐지합니다.", "fleet completeness와 recovery를 연결합니다."]),
      c("postcondition", "migration 성공 뒤 실제 catalog/data/runtime이 만족해야 하는 검증 가능한 invariant입니다.", ["exit code와 별개입니다.", "negative tests와 observability를 포함합니다."]),
    ],
    codeExamples: [py(
      "db07-migration-state-machine",
      "precondition과 postcondition이 있어야 APPLIED로 전이",
      "migration_state_machine.py",
      "checksum·preflight·catalog/data verification을 통과한 migration만 완료로 기록하는 작은 state machine입니다.",
      String.raw`migration = {"id": "20260714_add_status", "checksum": "sha256:abc", "state": "PLANNED"}
evidence = []

def advance(name, passed):
    evidence.append((name, passed))
    if not passed:
        migration["state"] = "BLOCKED"
        return False
    return True

if advance("precondition", True):
    migration["state"] = "RUNNING"
if migration["state"] == "RUNNING" and advance("catalog", True) and advance("data", True) and advance("negative-test", True):
    migration["state"] = "APPLIED"

print("id=" + migration["id"])
print("state=" + migration["state"])
print("checks=" + ",".join(name for name, passed in evidence if passed))
print("all-passed=" + str(all(passed for _, passed in evidence)).lower())
print("immutable-checksum=" + migration["checksum"])`,
      "id=20260714_add_status\nstate=APPLIED\nchecks=precondition,catalog,data,negative-test\nall-passed=true\nimmutable-checksum=sha256:abc",
      ["mysql-alter-table", "oracle-redefinition", "sqlite-alter-table"],
    )],
    diagnostics: [
      d("같은 migration id가 environment마다 다른 SQL을 실행했다.", "적용 후 migration file을 수정했고 checksum immutability/fleet audit가 없습니다.", ["ledger id/checksum/applied time을 fleet별 비교합니다.", "actual catalog/data state를 diff합니다.", "변경 provenance와 영향 instances를 확인합니다."], "writes를 위험도에 따라 통제하고 actual state를 canonical corrective migrations로 수렴시킵니다.", "applied checksum 변경을 CI/deploy에서 차단하고 fleet drift alert를 둡니다."),
      d("migration history는 성공인데 application이 startup에서 실패한다.", "postcondition이 DDL exit만 보고 app compatibility/query contract를 검증하지 않았습니다.", ["schema/app version matrix와 failing query를 봅니다.", "catalog/enforcement/data를 확인합니다.", "rollback/forward bridge 가능성을 평가합니다."], "compatible forward migration 또는 application fix로 복구하고 startup smoke/old-new contract를 postcondition에 추가합니다.", "isolated migration-from-every-supported-version suite를 실행합니다."),
    ],
    expertNotes: ["migration locks는 한 instance만 실행하게 하되 stale lease/leader failover와 manual override audit를 설계합니다.", "schema-as-code repository와 actual database 모두 증거이며 어느 한쪽만 진실로 가정하지 않고 reconciliation합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0126", repository: "local dbstudy snapshot", path: "dbstudy/01_26.sql", usedFor: ["CTAS·CREATE/ALTER/DROP practice baseline"], evidence: "CREATE TABLE 8·CTAS shape 1·ALTER TABLE 13·DROP TABLE 1을 read-only로 계수했습니다." },
  { id: "mysql-ctas", repository: "MySQL 8.4 Reference Manual", path: "CREATE TABLE ... SELECT", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table-select.html", usedFor: ["CTAS metadata/data semantics"], evidence: "MySQL CTAS 공식 문서입니다." },
  { id: "mysql-create-like", repository: "MySQL 8.4 Reference Manual", path: "CREATE TABLE ... LIKE", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table-like.html", usedFor: ["LIKE clone scope"], evidence: "MySQL CREATE TABLE LIKE 공식 문서입니다." },
  { id: "mysql-alter-table", repository: "MySQL 8.4 Reference Manual", path: "ALTER TABLE", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/alter-table.html", usedFor: ["add/drop/rename/type/index DDL"], evidence: "MySQL ALTER TABLE 공식 문서입니다." },
  { id: "mysql-online-ddl", repository: "MySQL 8.4 Reference Manual", path: "InnoDB Online DDL Operations", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-online-ddl-operations.html", usedFor: ["algorithm·lock capability matrix"], evidence: "MySQL InnoDB online DDL 공식 문서입니다." },
  { id: "mysql-drop-table", repository: "MySQL 8.4 Reference Manual", path: "DROP TABLE", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/drop-table.html", usedFor: ["destructive DDL·foreign key restrictions"], evidence: "MySQL DROP TABLE 공식 문서입니다." },
  { id: "oracle-create-table", repository: "Oracle AI Database 26ai SQL Language Reference", path: "CREATE TABLE", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CREATE-TABLE.html", usedFor: ["Oracle CTAS/table metadata"], evidence: "Oracle CREATE TABLE 공식 문서입니다." },
  { id: "oracle-alter-table", repository: "Oracle AI Database 26ai SQL Language Reference", path: "ALTER TABLE", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/ALTER-TABLE.html", usedFor: ["Oracle column/constraint evolution"], evidence: "Oracle ALTER TABLE 공식 문서입니다." },
  { id: "oracle-drop-table", repository: "Oracle AI Database 26ai SQL Language Reference", path: "DROP TABLE", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/DROP-TABLE.html", usedFor: ["Oracle drop/recycle/dependency semantics"], evidence: "Oracle DROP TABLE 공식 문서입니다." },
  { id: "oracle-redefinition", repository: "Oracle AI Database 26ai PL/SQL Packages and Types Reference", path: "DBMS_REDEFINITION", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/arpls/DBMS_REDEFINITION.html", usedFor: ["online table redefinition lifecycle"], evidence: "Oracle online redefinition 공식 문서입니다." },
  { id: "oracle-dependencies", repository: "Oracle AI Database 26ai Reference", path: "ALL_DEPENDENCIES", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/refrn/ALL_DEPENDENCIES.html", usedFor: ["dependency graph evidence"], evidence: "Oracle dependency catalog 공식 문서입니다." },
  { id: "sqlite-create-table", repository: "SQLite Documentation", path: "CREATE TABLE AS SELECT", publicUrl: "https://www.sqlite.org/lang_createtable.html", usedFor: ["exact CTAS metadata example"], evidence: "SQLite CREATE TABLE 공식 문서입니다." },
  { id: "sqlite-alter-table", repository: "SQLite Documentation", path: "ALTER TABLE", publicUrl: "https://www.sqlite.org/lang_altertable.html", usedFor: ["exact add/rename/rebuild boundary"], evidence: "SQLite ALTER TABLE 공식 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-07-copy-alter-drop-schema-evolution",
  slug: "db-07-copy-alter-drop-schema-evolution",
  courseId: "database",
  moduleId: "db-foundation-ddl",
  order: 7,
  title: "테이블 복제·ALTER·DROP과 안전한 스키마 변경",
  subtitle: "CTAS·LIKE·ALTER·DROP 문법을 metadata parity·online DDL·expand-contract·dependency·restore evidence까지 확장합니다.",
  level: "중급",
  estimatedMinutes: 900,
  coreQuestion: "운영 중인 table의 structure와 data를 바꾸면서 old/new applications를 모두 살리고, lock·무결성·복구 위험을 어떻게 측정하고 통제할까요?",
  summary: "dbstudy/01_26.sql의 CREATE TABLE 8·CTAS 1·ALTER TABLE 13·DROP TABLE 1 형태를 read-only로 감사합니다. CTAS를 full clone과 구분하고 MySQL LIKE와 clone matrix, nullable expand→bounded backfill→constraint, rename/type dual representation, constraints/indexes/FKs 재구성, DROP/TRUNCATE/DELETE lifecycle, MySQL online DDL과 Oracle DBMS_REDEFINITION budgets, application/schema expand-contract matrix, catalog+external dependency graph, immutable migration ledger와 restore rehearsal을 연결합니다. 다섯 exact Python examples는 CTAS metadata loss, staged backfill, old/new writer compatibility, safe dependency order와 postcondition state machine을 실행합니다.",
  objectives: [
    "CTAS와 LIKE의 data·metadata 복제 범위를 catalog evidence로 구분한다.",
    "explicit projection·classification·consistent snapshot으로 안전한 clone을 만든다.",
    "새 column을 expand·writer gate·idempotent backfill·enforce 단계로 배포한다.",
    "rename/type change를 dual representation과 old/new/rollback compatibility로 수행한다.",
    "constraint·index·foreign key parity와 query plan을 table rebuild 뒤 복구한다.",
    "DROP·TRUNCATE·DELETE의 object/data/recovery 차이와 destructive guards를 적용한다.",
    "online DDL의 metadata lock·IO·replica lag·abort budget을 운영한다.",
    "dependency graph·migration ledger·postconditions·restore rehearsal로 변경을 완료한다.",
  ],
  prerequisites: [{ title: "INSERT 단건·다건과 무결성", reason: "schema 변경 중 old/new writers와 backfill의 commit/retry 결과를 판정해야 합니다.", sessionSlug: "db-06-insert-multirow-integrity" }],
  keywords: ["CREATE TABLE AS", "CREATE TABLE LIKE", "ALTER TABLE", "DROP TABLE", "schema manifest", "online DDL", "metadata lock", "backfill", "expand-contract", "dual-write", "dependency graph", "migration ledger", "restore"],
  topics,
  lab: {
    title: "대형 lesson table을 zero-data-loss expand-contract로 재설계하기",
    scenario: "old title을 canonical_title로 바꾸고 status NOT NULL, 새 index와 archive table을 도입한 뒤 old table/column을 제거합니다. web fleet, nightly job과 replica가 서로 다른 versions로 동작합니다.",
    setup: ["synthetic production-scale distribution과 MySQL 8.4/Oracle 26ai isolated replicas를 준비합니다.", "source catalog/data/consumer manifest와 old/new/rollback app binaries를 고정합니다.", "lock·latency·IO·storage·replica lag budgets와 abort owner를 승인합니다.", "backup/PITR restore environment와 privacy-safe telemetry를 준비합니다."],
    steps: [
      "CTAS/LIKE 후보의 columns·constraints·indexes·grants·triggers·data 복제 matrix를 작성합니다.",
      "explicit projection과 consistent watermark로 shadow table을 만들고 catalog/data checksum을 검증합니다.",
      "nullable canonical_title/status를 online expand하고 old/new writer compatibility를 시험합니다.",
      "writer gate를 배포한 뒤 stable key ranges로 backfill하고 mismatch/null remaining을 관측합니다.",
      "NOT NULL/constraints/indexes를 validate하고 representative query plans와 replica lag를 확인합니다.",
      "reads를 feature flag로 전환해 old/new shadow results와 business KPIs를 비교합니다.",
      "database catalog와 external jobs/views/APIs dependency graph에서 모든 consumers를 이관합니다.",
      "full schedule observation+rollback window 뒤 old column/table contract migration을 dry-run manifest로 승인합니다.",
      "DROP 전 qualified object/fingerprint/backup/restore evidence를 확인하고 postconditions를 readback합니다.",
      "migration ledger checksum, metrics, negative writes와 restore first-write acceptance를 보존합니다.",
    ],
    expectedResult: ["source/target required catalog objects와 canonical data가 일치합니다.", "old/new/rollback applications가 승인된 schema states에서 예상대로 동작합니다.", "backfill mismatch/null이 0이고 constraints·indexes·plans가 검증됩니다.", "lock/latency/lag/storage가 budget 안이며 abort/recovery rehearsal가 성공합니다.", "unknown consumers 없이 old object가 제거되고 restore 뒤 schema/data/write path가 재검증됩니다."],
    cleanup: ["isolated shadow/test tables와 interim redefinition objects만 migration id로 제거합니다.", "temporary grants/tools/replication resources를 revoke·종료합니다.", "synthetic logs/rejects에 secrets·PII가 없는지 검사합니다.", "production-like source snapshot과 migration evidence는 승인 retention에 따라 보존합니다."],
    extensions: ["partition key 변경과 shard migration의 write fencing을 설계합니다.", "online schema change tool crash/cutover 실패를 chaos test합니다.", "90일 저빈도 consumer telemetry와 automated drop gate를 만듭니다.", "multi-region replicas의 DDL propagation/failover compatibility를 rehearsal합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 각 예제의 precondition·postcondition·rollback point를 적으세요.", requirements: ["stdout 완전 일치를 확인합니다.", "CTAS row parity와 metadata parity를 구분합니다.", "backfill remaining zero를 검증합니다.", "old/new reader compatibility를 설명합니다.", "dependency order에서 table을 마지막에 둡니다.", "ledger는 모든 checks 뒤 APPLIED가 됩니다."], hints: ["row count만 성공 기준으로 쓰지 마세요."], expectedOutcome: "schema change를 SQL 한 줄이 아니라 state transition과 evidence로 설명합니다.", solutionOutline: ["inventory→expand→migrate→verify→contract→recover 순서입니다."] },
    { difficulty: "응용", prompt: "원본 01_26.sql의 CTAS·ALTER·DROP 연습을 production migration으로 다시 작성하세요.", requirements: ["원본 active shapes와 provenance를 보존합니다.", "CTAS/LIKE clone matrix를 작성합니다.", "constraints/indexes/grants/triggers를 manifest로 만듭니다.", "bounded idempotent backfill과 writer gate를 설계합니다.", "online DDL budgets/abort를 정의합니다.", "old/new/rollback compatibility tests를 포함합니다.", "dependency/retention/destructive guards를 둡니다.", "restore/postcondition evidence를 포함합니다."], hints: ["_backup table 이름은 backup 보증이 아닙니다."], expectedOutcome: "무결성·availability·rollback을 갖춘 reviewable migration set가 완성됩니다.", solutionOutline: ["source audit→target manifest→compatibility→online execution→readback/recovery 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 schema evolution 표준과 migration review checklist를 작성하세요.", requirements: ["additive/destructive/narrowing risk taxonomy를 정의합니다.", "catalog/data/consumer inventory를 요구합니다.", "online DDL lock/resource budgets를 정의합니다.", "expand-contract와 observation windows를 정의합니다.", "immutable ledger/checksum/pre/postconditions를 둡니다.", "backup/PITR/forward recovery rehearsal를 요구합니다.", "security/privacy/least privilege를 포함합니다.", "fleet drift·metrics·incident roles를 정의합니다."], hints: ["DDL transactional 여부를 모든 vendor에 일반화하지 마세요."], expectedOutcome: "초급 ALTER 연습부터 대규모 무중단 변경까지 일관된 승인·실행·복구 표준이 완성됩니다.", solutionOutline: ["classify→inventory→plan→rehearse→execute→verify→retire 순서입니다."] },
  ],
  nextSessions: ["db-08-normalization-workbench"],
  sources,
  sourceCoverage: {
    filesRead: 1,
    filesUsed: 1,
    uncoveredNotes: [
      "dbstudy/01_26.sql의 active CREATE TABLE 8·CTAS 1·ALTER TABLE 13·DROP TABLE 1을 read-only로 계수하고 statement shapes를 provenance로 사용했습니다.",
      "원본은 초급 DDL 연습이며 LIKE full scope, online locking, app version compatibility, dependency inventory·restore acceptance evidence는 없어 공식 문서와 synthetic examples로 보완했습니다.",
      "원본의 sample business/customer values는 교재·예제·출력에 복제하지 않았습니다.",
      "SQLite examples는 catalog/state invariants를 재현할 뿐 MySQL 8.4·Oracle 26ai production DDL algorithm/locking을 대체하지 않습니다.",
    ],
  },
});

export default session;
