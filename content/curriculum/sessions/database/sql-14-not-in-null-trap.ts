import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: `1-${Math.min(6, lineCount)}`, explanation: "합성 key와 명시적 NULL fixture를 가진 sqlite3 메모리 DB를 준비합니다. 실제 사용자·주문·상품 값은 사용하지 않습니다." },
      { lines: `${Math.min(7, lineCount)}-${Math.max(7, lineCount - 5)}`, explanation: "NOT IN, NOT EXISTS, LEFT JOIN anti pattern 또는 constraint/index를 동일한 outer identity 집합에서 실행합니다." },
      { lines: `${Math.max(1, lineCount - 4)}-${lineCount}`, explanation: "TRUE/FALSE/UNKNOWN과 ordered ids만 출력해 NULL로 인한 조용한 누락을 검출합니다. target engine의 optimizer/isolation은 별도 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "SQLite truth matrix는 SQL NULL 개념을 재현하지만 MySQL 8.4·Oracle 26ai의 antijoin 변환·constraint·isolation 계획을 대신하지 않습니다."] },
    experiments: [
      { change: "inner와 outer 비교 key에 NULL을 각각 추가·제거하고 inner를 empty set으로 만듭니다.", prediction: "NOT IN은 UNKNOWN 경로 때문에 결과가 크게 달라지지만 NOT EXISTS는 correlation match 존재만 반영합니다.", result: "각 조합의 truth와 outer ids를 golden matrix로 저장합니다." },
      { change: "NOT NULL constraint와 anti-lookup index를 제거한 뒤 plan·동시 write를 반복합니다.", prediction: "데이터 품질 보장이 사라지고 full scan 또는 snapshot별 결과 차이가 나타날 수 있습니다.", result: "constraint readback, EXPLAIN actual과 transaction schedule을 함께 승인합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "three-valued-membership-matrix",
    title: "IN·NOT IN을 TRUE·FALSE·UNKNOWN의 전체 행렬로 읽습니다",
    lead: "SQL의 NULL은 값 하나가 아니라 비교 결과를 UNKNOWN으로 만들 수 있으므로 Python의 not in이나 집합 차집합 직관을 그대로 적용할 수 없습니다.",
    explanations: [
      "dbstudy 02_02.sql은 주문한 고객을 IN, 주문하지 않은 고객을 NOT IN으로 표현합니다. 이 progression은 anti-membership 학습에 중요하지만 원본 schema에서 subquery key가 NULL 가능하면 NOT IN 결과가 조용히 비어 버릴 수 있습니다.",
      "x IN (set)는 하나라도 x=value가 TRUE면 TRUE입니다. match가 없고 비교 후보 중 NULL이 있으면 FALSE를 확정하지 못해 UNKNOWN이며, x 자체가 NULL이어도 보통 UNKNOWN입니다.",
      "NOT IN은 IN 결과에 논리 NOT을 적용합니다. NOT UNKNOWN은 여전히 UNKNOWN이므로 WHERE는 그 행을 선택하지 않습니다. ‘일치하지 않음’과 ‘일치하지 않는다고 증명할 수 없음’을 구분합니다.",
      "WHERE clause는 TRUE인 행만 통과시키고 FALSE와 UNKNOWN을 모두 제거합니다. 화면에서 행이 없다는 사실만 보면 의도한 exclusion과 NULL contamination을 구분할 수 없습니다.",
      "empty set은 별도 경계입니다. SQLite는 empty list와 subquery의 세부 동작을 문서화하지만 다른 engine의 literal-list syntax 제한도 있으므로 empty collection adapter를 명시적으로 처리합니다.",
    ],
    concepts: [
      c("three-valued logic", "SQL predicate가 TRUE, FALSE 또는 UNKNOWN을 가질 수 있는 논리 체계입니다.", ["NULL 비교가 UNKNOWN을 만듭니다.", "WHERE는 TRUE만 보존합니다."]),
      c("NULL-contaminated set", "membership 후보 중 하나 이상이 NULL이라 non-match를 FALSE로 확정할 수 없는 집합입니다.", ["positive match는 TRUE일 수 있습니다.", "non-match NOT IN은 UNKNOWN이 됩니다."]),
      c("truth matrix", "outer NULL 여부, inner NULL·empty·match 여부 조합별 predicate 결과를 고정한 표입니다.", ["감으로 추측하지 않습니다.", "engine conformance fixture로 사용합니다."]),
    ],
    codeExamples: [py("sql14-three-valued-matrix", "IN·NOT IN TRUE/FALSE/UNKNOWN 출력", "sql14_truth_matrix.py", "inner 집합 {1,NULL}에 대해 outer 1, 2, NULL의 IN과 NOT IN truth를 CASE로 이름 붙여 실제로 출력합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE lhs(v INTEGER)")
db.execute("CREATE TABLE rhs(v INTEGER)")
db.executemany("INSERT INTO lhs VALUES (?)", [(1,), (2,), (None,)])
db.executemany("INSERT INTO rhs VALUES (?)", [(1,), (None,)])
truth = "CASE WHEN {p} THEN 'TRUE' WHEN ({p}) IS NULL THEN 'UNKNOWN' ELSE 'FALSE' END"
sql = f"""SELECT v,
 {truth.format(p='v IN (SELECT v FROM rhs)')} AS in_truth,
 {truth.format(p='v NOT IN (SELECT v FROM rhs)')} AS not_in_truth
 FROM lhs ORDER BY v IS NULL, v"""
for value, in_truth, not_in_truth in db.execute(sql):
    label = "NULL" if value is None else str(value)
    print(f"lhs={label}:IN={in_truth},NOT_IN={not_in_truth}")
print("where-keeps-only=TRUE")`, "lhs=1:IN=TRUE,NOT_IN=FALSE\nlhs=2:IN=UNKNOWN,NOT_IN=UNKNOWN\nlhs=NULL:IN=UNKNOWN,NOT_IN=UNKNOWN\nwhere-keeps-only=TRUE", ["local-0202", "mysql-in", "mysql-comparison", "mysql-null", "oracle-in", "oracle-null", "sqlite-in", "python-sqlite3"])],
    diagnostics: [d("제외 목록에 없는 key까지 NOT IN 결과에서 모두 사라집니다.", "subquery 결과에 NULL이 하나 포함되어 non-match predicate가 UNKNOWN이 됐습니다.", ["subquery의 COUNT(*)와 COUNT(key)", "NULL rows의 provenance", "truth matrix", "WHERE 전 predicate IS NULL audit"], "nullable anti-membership에는 correlated NOT EXISTS를 기본으로 쓰고, NOT IN을 유지하려면 inner·outer non-nullability를 schema와 query에서 증명합니다.", "NULL sentinel이 있는 golden anti-membership test를 항상 포함합니다.")],
    expertNotes: ["NOT IN 결과 0행을 ‘제외 대상이 전부였다’고 해석하기 전에 inner NULL count를 확인합니다.", "application boolean으로 변환하기 전에 SQL UNKNOWN을 어떤 도메인 상태로 처리할지 결정합니다."],
  },
  {
    id: "not-in-poisoning-mechanism",
    title: "NOT IN의 NULL poisoning을 비교식 전개로 설명합니다",
    lead: "x NOT IN (1,NULL)은 x<>1 AND x<>NULL에 가깝게 이해할 수 있고 두 번째 비교가 UNKNOWN이므로 non-match를 TRUE로 확정하지 못합니다.",
    explanations: [
      "IN은 equality 비교들의 OR, NOT IN은 inequality 비교들의 AND로 직관화할 수 있습니다. 2<>1은 TRUE지만 2<>NULL은 UNKNOWN이고 TRUE AND UNKNOWN은 UNKNOWN입니다.",
      "오른쪽 NULL 한 행은 집합의 다른 모든 non-matching outer values에 영향을 줍니다. 문제의 크기는 NULL 행 하나가 아니라 anti query 결과 전체입니다.",
      "DISTINCT는 NULL을 제거하지 않습니다. SELECT DISTINCT nullable_key도 NULL 한 개를 반환할 수 있으므로 NOT IN contamination은 그대로입니다.",
      "COALESCE(inner_key, sentinel)는 sentinel이 domain에 절대 없다는 constraint와 outer 처리 없이는 충돌을 만듭니다. 임의 -1, 빈 문자열을 넣어 문제를 숨기지 않습니다.",
      "subquery에 WHERE key IS NOT NULL을 넣으면 inner contamination은 제거하지만 outer expression이 NULL인 행은 여전히 NOT IN에서 UNKNOWN입니다. outer NULL을 포함할지 별도 business policy가 필요합니다.",
    ],
    concepts: [
      c("NULL poisoning", "inner NULL 하나가 모든 nonmatching NOT IN 결과를 UNKNOWN으로 만드는 현상입니다.", ["DISTINCT로 해결되지 않습니다.", "조용한 누락을 만듭니다."]),
      c("comparison expansion", "IN/NOT IN을 equality OR 또는 inequality AND truth로 풀어 이해하는 방법입니다.", ["UNKNOWN 전파를 보여 줍니다.", "optimizer 실제 실행 알고리즘을 뜻하지는 않습니다."]),
      c("sentinel collision", "NULL을 임의 값으로 치환했을 때 실제 domain 값과 구분되지 않는 오류입니다.", ["constraint 없는 sentinel을 피합니다.", "상태를 별도 column으로 표현합니다."]),
    ],
    codeExamples: [py("sql14-not-in-poison", "NULL 한 행이 anti 결과 전체를 없애는 재현", "sql14_not_in_poison.py", "outer 1·2·3과 inner 1·NULL에서 raw NOT IN, NOT EXISTS, NULL-filtered NOT IN 결과를 나란히 비교합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE candidate(id INTEGER PRIMARY KEY)")
db.execute("CREATE TABLE blocked(candidate_id INTEGER)")
db.executemany("INSERT INTO candidate VALUES (?)", [(1,), (2,), (3,)])
db.executemany("INSERT INTO blocked VALUES (?)", [(1,), (None,)])
raw = [r[0] for r in db.execute("SELECT id FROM candidate WHERE id NOT IN (SELECT candidate_id FROM blocked) ORDER BY id")]
exists = [r[0] for r in db.execute("SELECT c.id FROM candidate c WHERE NOT EXISTS (SELECT 1 FROM blocked b WHERE b.candidate_id=c.id) ORDER BY c.id")]
filtered = [r[0] for r in db.execute("SELECT id FROM candidate WHERE id NOT IN (SELECT candidate_id FROM blocked WHERE candidate_id IS NOT NULL) ORDER BY id")]
render = lambda values: ",".join(map(str, values)) or "<empty>"
print("raw-NOT-IN=" + render(raw))
print("NOT-EXISTS=" + render(exists))
print("filtered-NOT-IN=" + render(filtered))
print("inner-null-count=" + str(db.execute("SELECT count(*) FROM blocked WHERE candidate_id IS NULL").fetchone()[0]))
print("not-exists-is-expected=" + str(exists == [2, 3]).lower())`, "raw-NOT-IN=<empty>\nNOT-EXISTS=2,3\nfiltered-NOT-IN=2,3\ninner-null-count=1\nnot-exists-is-expected=true", ["local-0202", "mysql-in", "mysql-exists", "mysql-semijoin", "oracle-in", "oracle-exists", "sqlite-in"])],
    diagnostics: [d("DISTINCT를 추가했는데도 NOT IN 결과가 비어 있습니다.", "DISTINCT는 여러 NULL을 하나로 줄일 뿐 NULL 자체를 제거하지 않습니다.", ["DISTINCT subquery 결과", "COUNT(key)와 COUNT(*)", "NULL filter placement", "outer key nullability"], "NOT EXISTS로 질문을 표현하거나 inner key IS NOT NULL과 outer NULL 정책을 명시하고 constraint로 재발을 막습니다.", "중복 NULL·단일 NULL·NULL 없음 세 fixture를 모두 실행합니다.")],
    expertNotes: ["sentinel COALESCE는 anti-join 해결책이 아니라 새로운 domain 가정을 도입합니다.", "NULL poisoning은 예외가 아니라 SQL 표준 논리에서 자연스럽게 나오는 결과입니다."],
  },
  {
    id: "empty-null-and-missing-set-boundaries",
    title: "empty set·NULL element·NULL outer key를 서로 다른 상태로 보존합니다",
    lead: "제외 목록이 비어 있음, 목록 안 값이 미상임, 검사할 outer key가 미상임은 각각 다른 business 상태이며 한 줄 COALESCE로 합치면 안 됩니다.",
    explanations: [
      "empty inner subquery는 exclusion evidence가 하나도 없다는 뜻입니다. NOT IN/NOT EXISTS 모두 non-null outer rows를 보존할 수 있지만 literal empty list syntax는 engine·framework별로 다릅니다.",
      "inner NULL은 ‘제외 key를 알 수 없는 행’입니다. 데이터 품질 위반인지 아직 매핑되지 않은 정상 상태인지 분류하고 quarantine, 보정 또는 별도 리포트로 처리합니다.",
      "outer NULL은 ‘현재 행의 비교 key를 알 수 없음’입니다. anti result에 포함할지, incomplete로 분리할지, 무효로 거절할지 domain owner가 정해야 합니다.",
      "NOT EXISTS의 equality correlation에서 outer NULL은 inner non-null/NULL 어느 것과도 equal match하지 않아 포함될 수 있습니다. 이것이 원하는 정책인지 명시적 outer predicate로 결정합니다.",
      "API에서 empty array, null field, missing field를 서로 바꾸지 않습니다. query 입력 adapter가 empty list를 FALSE/TRUE constant로 바꿀 때 authorization scope와 audit 의미를 유지합니다.",
    ],
    concepts: [
      c("empty anti-set", "비교할 exclusion rows가 하나도 없는 집합입니다.", ["NULL element와 다릅니다.", "collection adapter가 명시적으로 처리합니다."]),
      c("unknown inner key", "exclusion row는 있지만 비교 key 값을 알 수 없는 상태입니다.", ["data-quality counter로 기록합니다.", "NOT IN을 오염시킵니다."]),
      c("unknown outer identity", "현재 candidate의 비교 identity가 NULL인 상태입니다.", ["NOT EXISTS에서는 포함될 수 있습니다.", "business policy가 필요합니다."]),
    ],
    codeExamples: [py("sql14-outer-null-policy", "inner NULL 제거 뒤에도 남는 outer NULL 정책", "sql14_outer_null.py", "inner NULL을 필터한 NOT IN과 NOT EXISTS가 nullable outer key에서 다른 결과를 내는지 확인합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE candidate(seq INTEGER PRIMARY KEY, external_key INTEGER)")
db.execute("CREATE TABLE blocked(external_key INTEGER)")
db.executemany("INSERT INTO candidate VALUES (?, ?)", [(1, 1), (2, 2), (3, 3), (4, None)])
db.executemany("INSERT INTO blocked VALUES (?)", [(1,), (None,)])
filtered = list(db.execute("SELECT seq,external_key FROM candidate WHERE external_key NOT IN (SELECT external_key FROM blocked WHERE external_key IS NOT NULL) ORDER BY seq"))
exists = list(db.execute("SELECT c.seq,c.external_key FROM candidate c WHERE NOT EXISTS (SELECT 1 FROM blocked b WHERE b.external_key=c.external_key) ORDER BY c.seq"))
render = lambda rows: ",".join("NULL" if value is None else str(value) for _, value in rows)
print("filtered-NOT-IN=" + render(filtered))
print("NOT-EXISTS=" + render(exists))
print("outer-null-in-not-exists=" + str(any(v is None for _, v in exists)).lower())
print("policy=separate-unknown-outer")`, "filtered-NOT-IN=2,3\nNOT-EXISTS=2,3,NULL\nouter-null-in-not-exists=true\npolicy=separate-unknown-outer", ["mysql-in", "mysql-exists", "mysql-null", "oracle-in", "oracle-exists", "oracle-null", "sqlite-in", "python-sqlite3"])],
    diagnostics: [d("NOT EXISTS로 바꾼 뒤 key가 NULL인 outer row까지 결과에 포함됩니다.", "equality correlation은 NULL=NULL을 TRUE로 보지 않으므로 unknown outer key에 match가 없다고 판정했습니다.", ["outer key NULL count", "business inclusion policy", "IS NULL/IS NOT NULL outer predicate", "NULL-safe equality 사용 여부"], "unknown outer identity를 별도 status로 분리하거나 요구에 따라 outer key IS NOT NULL을 추가하고 결과 contract에 기록합니다.", "outer NULL 포함·제외·quarantine 세 정책의 acceptance fixture를 둡니다.")],
    expertNotes: ["inner NULL filtering만으로 anti-membership 전체 NULL 정책이 끝나지 않습니다.", "unknown outer row를 무조건 포함하는 것도 무조건 버리는 것도 domain 근거가 필요합니다."],
  },
  {
    id: "not-exists-null-safe-anti-membership",
    title: "NOT EXISTS를 correlation 기반 anti-membership의 기본형으로 설계합니다",
    lead: "NOT EXISTS는 현재 outer row와 같은 inner row가 있는지 묻고 하나도 없을 때만 outer row를 반환하므로 unrelated inner NULL이 결과 전체를 오염시키지 않습니다.",
    explanations: [
      "정석 형태는 WHERE NOT EXISTS (SELECT 1 FROM inner i WHERE i.key=o.key)입니다. correlation predicate에 outer alias와 inner alias를 명시하고 composite tenant/entity key를 모두 포함합니다.",
      "inner SELECT list는 존재 여부에 영향을 주지 않습니다. SELECT NULL도 row가 있으면 EXISTS TRUE이므로 projection이 아니라 WHERE correlation을 리뷰합니다.",
      "NOT EXISTS는 inner duplicates에도 outer row를 한 번만 배제합니다. duplicate 제거를 위한 DISTINCT/GROUP BY가 필요하지 않을 수 있고 optimizer antijoin 전략을 plan에서 확인합니다.",
      "additional inner filter를 ON/correlation 안에 둘지 outer WHERE에 둘지에 따라 ‘어떤 match가 exclusion인지’가 달라집니다. 상태·시간·soft delete·authorization을 canonical inner eligibility로 정의합니다.",
      "tenant predicate가 빠지면 다른 tenant의 match 때문에 현재 outer row가 잘못 배제될 수 있습니다. positive leak와 달리 anti query에서는 권한 있는 행이 사라지는 inference/availability 문제가 됩니다.",
    ],
    concepts: [
      c("anti-semijoin", "matching inner row가 하나도 없는 outer rows만 반환하는 관계 연산입니다.", ["outer grain을 보존합니다.", "NOT EXISTS가 직접 표현합니다."]),
      c("exclusion match", "어떤 inner row를 outer row의 배제 증거로 인정할지 정한 predicate입니다.", ["status/time/tenant를 포함합니다.", "projection과 구분합니다."]),
      c("duplicate-insensitive existence", "inner match가 하나든 여러 개든 EXISTS truth가 같은 성질입니다.", ["불필요한 DISTINCT를 피합니다.", "data 품질 duplicate는 별도 관측합니다."]),
    ],
    diagnostics: [d("NOT EXISTS가 정상 row를 너무 많이 제외합니다.", "correlation에 tenant/status/time scope가 빠져 unrelated 또는 비활성 inner row까지 exclusion evidence가 됐습니다.", ["canonical inner eligibility", "복합 correlation keys", "soft-delete/status predicate", "cross-scope fixtures"], "현재 principal과 business window에 유효한 inner relation을 먼저 정의하고 그 relation과 완전한 identity로 correlation합니다.", "same local id across tenants와 inactive/expired inner rows를 regression fixture로 둡니다.")],
    expertNotes: ["NOT EXISTS를 선택해도 correlation key의 NULL·scope·type을 리뷰해야 합니다.", "anti query에는 ‘왜 배제됐는지’ sample lineage를 PII 없이 재현할 수 있는 운영 증거가 필요합니다."],
  },
  {
    id: "filtered-not-in-preconditions",
    title: "NULL-filtered NOT IN을 쓸 수 있는 엄격한 전제 조건을 적습니다",
    lead: "inner WHERE key IS NOT NULL은 poisoning을 막을 수 있지만 outer nullability, type, composite key와 schema drift까지 확인해야 NOT EXISTS와 같은 질문이 됩니다.",
    explanations: [
      "outer key가 NOT NULL이고 inner subquery가 NULL을 제거하며 같은 타입·collation의 한 column을 반환할 때 positive equality anti-membership에서 filtered NOT IN과 NOT EXISTS가 같은 outer ids를 만들 수 있습니다.",
      "schema가 나중에 nullable로 바뀌거나 view expression이 NULL을 만들면 전제가 깨집니다. catalog constraint와 generated SQL을 배포 시 readback하고 query contract에 nullability version을 둡니다.",
      "composite NOT IN은 tuple 안 어느 element가 NULL인지에 따라 UNKNOWN 행렬이 더 복잡합니다. 엔진 지원과 semantics를 공식 문서·fixture로 확인하고 복합 NOT EXISTS equality를 선호할 수 있습니다.",
      "IS NOT NULL filter가 authorization predicate보다 앞뒤 어디에 있는지보다 canonical eligible inner relation이 정확한지가 중요합니다. 권한 없는 NULL rows를 단지 숨기는 것으로 보안이 해결되지는 않습니다.",
      "NOT IN이 optimizer에서 antijoin으로 변환될 수 있는지는 nullable expression 여부와 형태에 좌우됩니다. 결과 계약을 지키면서 target plan을 비교합니다.",
    ],
    concepts: [
      c("filtered NOT IN", "inner NULL을 명시적으로 제거한 NOT IN anti-membership입니다.", ["outer NOT NULL이 추가 전제입니다.", "schema drift를 감시합니다."]),
      c("nullability proof", "outer와 inner comparison expression이 실행 중 NULL이 될 수 없음을 constraint·expression analysis로 증명한 근거입니다.", ["catalog를 readback합니다.", "view/function 결과도 포함합니다."]),
      c("tuple UNKNOWN", "row-value comparison의 일부 component가 NULL일 때 equality/inequality truth가 미확정이 되는 상태입니다.", ["엔진별 fixture가 필요합니다.", "복합 NOT EXISTS 대안을 검토합니다."]),
    ],
    diagnostics: [d("오랫동안 맞던 filtered NOT IN이 schema 변경 후 누락을 만들기 시작합니다.", "outer key 또는 view expression이 nullable로 바뀌어 기존 nullability precondition이 깨졌습니다.", ["catalog NOT NULL", "view/generated expression lineage", "outer NULL count", "migration diff와 query version"], "migration contract test에서 anti query nullability를 검사하고 nullable 요구가 생기면 explicit policy가 있는 NOT EXISTS로 전환합니다.", "schema migration마다 anti-query golden matrix와 catalog assertion을 실행합니다.")],
    expertNotes: ["WHERE inner.key IS NOT NULL 한 줄을 ‘NULL-safe’라는 무조건적 표식으로 사용하지 않습니다.", "전제 조건이 많을수록 NOT EXISTS가 reviewer에게 더 직접적인 의도를 줄 수 있습니다."],
  },
  {
    id: "left-join-is-null-anti-patterns",
    title: "LEFT JOIN ... IS NULL에서는 non-null match marker를 검사합니다",
    lead: "outer join으로 anti result를 만들 수 있지만 nullable payload column을 NULL 검사하면 실제 match가 있는 row까지 미일치로 오판합니다.",
    explanations: [
      "LEFT JOIN inner ON match WHERE inner.primary_key IS NULL은 match가 없는 outer row를 찾는 전형적인 anti pattern입니다. 검사 column은 matched row에서 반드시 non-null인 key여야 합니다.",
      "WHERE inner.note IS NULL처럼 nullable payload를 검사하면 note가 NULL인 실제 matched row와 null-extended unmatched row를 구분하지 못합니다. schema constraint 또는 primary key marker를 사용합니다.",
      "inner filter를 WHERE에 두면 null-extended rows가 제거되어 outer join이 사실상 inner join처럼 바뀔 수 있습니다. exclusion match 조건은 ON에 두고 anti marker만 WHERE에서 검사합니다.",
      "LEFT JOIN anti와 NOT EXISTS는 optimizer가 비슷한 antijoin plan으로 만들 수 있지만 항상 같다고 단정하지 않습니다. 결과 outer key와 plan을 target engine에서 비교합니다.",
      "inner duplicates는 LEFT JOIN intermediate rows를 늘릴 수 있습니다. 최종 IS NULL anti result에는 match rows가 제거되더라도 처리 비용이 커질 수 있어 NOT EXISTS/antijoin plan을 측정합니다.",
    ],
    concepts: [
      c("null-extended row", "outer join에서 inner match가 없을 때 inner columns가 NULL로 채워진 결과 행입니다.", ["실제 nullable payload와 구분합니다.", "non-null marker를 사용합니다."]),
      c("anti marker", "matched inner row라면 반드시 non-null인 primary/unique key column입니다.", ["WHERE marker IS NULL로 unmatched를 찾습니다.", "payload를 marker로 쓰지 않습니다."]),
      c("ON-filter placement", "어떤 inner row가 match인지 정의하는 조건을 outer join ON에 두는 규칙입니다.", ["WHERE로 옮기면 보존 의미가 바뀔 수 있습니다.", "NOT EXISTS predicate와 대조합니다."]),
    ],
    codeExamples: [py("sql14-left-join-marker", "nullable payload와 primary-key anti marker 비교", "sql14_left_join_marker.py", "실제 match의 note가 NULL일 때 잘못된 payload 검사와 올바른 key 검사, NOT EXISTS 결과를 비교합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE parent(id INTEGER PRIMARY KEY)")
db.execute("CREATE TABLE child(id INTEGER PRIMARY KEY, parent_id INTEGER NOT NULL, note TEXT)")
db.executemany("INSERT INTO parent VALUES (?)", [(1,), (2,), (3,)])
db.executemany("INSERT INTO child VALUES (?, ?, ?)", [(10, 1, None), (11, 2, "ok")])
wrong = [r[0] for r in db.execute("SELECT p.id FROM parent p LEFT JOIN child c ON c.parent_id=p.id WHERE c.note IS NULL ORDER BY p.id")]
marker = [r[0] for r in db.execute("SELECT p.id FROM parent p LEFT JOIN child c ON c.parent_id=p.id WHERE c.id IS NULL ORDER BY p.id")]
exists = [r[0] for r in db.execute("SELECT p.id FROM parent p WHERE NOT EXISTS (SELECT 1 FROM child c WHERE c.parent_id=p.id) ORDER BY p.id")]
print("nullable-payload-check=" + ",".join(map(str, wrong)))
print("primary-key-marker=" + ",".join(map(str, marker)))
print("NOT-EXISTS=" + ",".join(map(str, exists)))
print("marker-equals-not-exists=" + str(marker == exists).lower())
print("false-unmatched=" + str(sorted(set(wrong) - set(marker))))`, "nullable-payload-check=1,3\nprimary-key-marker=3\nNOT-EXISTS=3\nmarker-equals-not-exists=true\nfalse-unmatched=[1]", ["local-0202", "mysql-exists", "mysql-semijoin", "oracle-exists", "sqlite-in", "sqlite-queryplanner"])],
    diagnostics: [d("LEFT JOIN anti query가 실제 child가 있는 parent도 미일치로 반환합니다.", "WHERE에서 nullable payload column IS NULL을 검사해 real NULL과 null-extension을 합쳤습니다.", ["검사 column의 NOT NULL/PK constraint", "matched row payload NULL fixture", "ON/WHERE filter 위치", "NOT EXISTS result parity"], "inner primary key처럼 match 시 non-null인 marker를 검사하거나 NOT EXISTS로 의도를 직접 표현합니다.", "matched-null-payload와 unmatched parent를 함께 둔 회귀 테스트를 유지합니다.")],
    expertNotes: ["LEFT JOIN anti는 `SELECT *`보다 outer columns만 projection해 grain 의도를 드러냅니다.", "optimizer plan이 같아도 nullable marker를 잘못 고르면 의미는 이미 달라집니다."],
  },
  {
    id: "constraints-data-quality-and-lineage",
    title: "NOT NULL·FK·quarantine으로 anti-key 데이터 품질을 강제합니다",
    lead: "anti-membership key가 논리적으로 필수라면 query마다 NULL을 방어하기보다 schema에서 입력을 거절하고 legacy NULL은 별도 정제 흐름으로 관리합니다.",
    explanations: [
      "inner foreign key가 NOT NULL이어야 하는 domain이면 NOT NULL과 FK를 함께 둡니다. FK만으로는 nullable child key를 금지하지 않는 engine이 많으므로 두 제약을 분리해 확인합니다.",
      "business상 unknown association이 허용되면 nullable key를 억지로 금지하지 말고 pending/quarantine table이나 explicit status를 사용합니다. canonical exclusion relation에는 resolved non-null keys만 노출합니다.",
      "migration에서 constraint를 추가하기 전에 NULL count, duplicate/orphan lineage, source batch와 remediation owner를 기록합니다. 임의 delete나 sentinel update로 정보 손실을 만들지 않습니다.",
      "view가 NOT NULL base column을 CASE/outer join으로 nullable하게 만들 수 있습니다. query가 실제 참조하는 expression nullability를 lineage로 검증합니다.",
      "data quality telemetry에는 unresolved/null/orphan rows 수와 age, source system, remediation status를 두되 raw external identifiers는 저장하지 않습니다.",
    ],
    concepts: [
      c("anti-key integrity", "exclusion relation의 비교 key가 domain identity를 유효하게 나타내는 제약 집합입니다.", ["NOT NULL·FK·type을 포함합니다.", "view expression까지 추적합니다."]),
      c("quarantine relation", "identity를 아직 검증하지 못한 rows를 canonical anti-set과 분리해 보존하는 영역입니다.", ["정보를 삭제하지 않습니다.", "owner와 age를 관측합니다."]),
      c("constraint readback", "배포 후 catalog에서 실제 NOT NULL·FK·index가 적용됐는지 다시 조회하는 절차입니다.", ["DDL 성공 메시지만 믿지 않습니다.", "replica/schema별 확인합니다."]),
    ],
    diagnostics: [d("DDL로 NOT NULL을 추가하려다 실패하거나 일부 환경만 계속 nullable입니다.", "legacy NULL remediation과 schema readback 없이 migration을 적용했고 replica/tenant schema drift가 있습니다.", ["환경별 NULL/orphan counts", "catalog nullability/FK", "migration version", "quarantine/rollback plan"], "raw rows를 보존한 채 quarantine·mapping으로 정제하고 staged validation 후 constraint를 적용해 모든 환경 catalog를 readback합니다.", "migration preflight/postflight에 anti-key quality와 catalog assertions를 둡니다.")],
    expertNotes: ["NULL을 없애는 것이 아니라 NULL이 나타내던 상태를 손실 없이 모델링합니다.", "constraint가 가능하지 않은 external staging은 canonical anti query에서 직접 참조하지 않습니다."],
  },
  {
    id: "anti-join-index-and-explain",
    title: "anti lookup index와 EXPLAIN으로 correctness 이후 비용을 검증합니다",
    lead: "NOT EXISTS의 correlation key를 빠르게 찾는 index가 없으면 outer rows마다 inner scan이 반복될 수 있지만 optimizer는 materialization·antijoin 등 다른 전략도 선택할 수 있습니다.",
    explanations: [
      "일반적인 anti lookup index는 tenant/status 같은 scope equality와 correlation key를 앞쪽에 둡니다. key order는 실제 predicate selectivity, range와 outer distribution으로 결정합니다.",
      "NOT NULL constraint는 correctness뿐 아니라 optimizer가 nullable antijoin 제약을 제거하고 transformation을 선택하는 데 도움을 줄 수 있습니다. 단, 계획은 version과 statistics로 확인합니다.",
      "MySQL은 조건을 만족하는 NOT EXISTS/NOT IN을 antijoin으로 transform할 수 있지만 nullable comparison은 제한이 있습니다. Oracle과 SQLite도 동일 용어/plan을 보장하지 않습니다.",
      "EXPLAIN에서 inner access path, actual loops/rows, early-out 가능성, materialization size, temp/spill과 filter selectivity를 확인합니다. SQL spelling만 보고 ‘short circuit’ 비용을 단정하지 않습니다.",
      "anti query는 matching 비율이 낮거나 높을 때 비용 패턴이 달라집니다. no-match-heavy, match-first, match-late와 skewed tenant fixtures에서 latency와 rows examined를 측정합니다.",
    ],
    concepts: [
      c("anti lookup index", "현재 outer key와 같은 exclusion row 존재를 빠르게 확인하는 composite index입니다.", ["scope와 correlation key를 포함합니다.", "write amplification을 측정합니다."]),
      c("antijoin transformation", "부정 subquery를 optimizer가 matching inner row가 없는 outer rows 선택 연산으로 바꾸는 과정입니다.", ["nullable 조건이 eligibility에 영향을 줍니다.", "plan evidence가 필요합니다."]),
      c("match-distribution benchmark", "inner match 유무·위치·tenant skew별 anti query 비용을 재는 테스트입니다.", ["평균 데이터만 보지 않습니다.", "actual loops/rows를 기록합니다."]),
    ],
    codeExamples: [py("sql14-constraint-index-plan", "NOT NULL 위반과 indexed anti lookup 증거", "sql14_constraint_plan.py", "SQLite catalog에서 NOT NULL을 확인하고 NULL insert가 거절되며 NOT EXISTS inner access가 correlation index를 사용하는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA automatic_index=OFF")
db.execute("CREATE TABLE candidate(id INTEGER PRIMARY KEY)")
db.execute("CREATE TABLE blocked(id INTEGER PRIMARY KEY, candidate_id INTEGER NOT NULL)")
db.executemany("INSERT INTO candidate VALUES (?)", [(1,), (2,), (3,)])
db.execute("INSERT INTO blocked VALUES (?, ?)", (10, 1))
db.execute("CREATE INDEX idx_blocked_candidate ON blocked(candidate_id)")
sql = "SELECT c.id FROM candidate c WHERE NOT EXISTS (SELECT 1 FROM blocked b WHERE b.candidate_id=c.id) ORDER BY c.id"
plan = " ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql)).upper()
ids = [row[0] for row in db.execute(sql)]
not_null = next(row[3] for row in db.execute("PRAGMA table_info(blocked)") if row[1] == "candidate_id")
try:
    db.execute("INSERT INTO blocked VALUES (?, ?)", (11, None))
    rejected = False
except sqlite3.IntegrityError:
    rejected = True
print("anti-ids=" + ",".join(map(str, ids)))
print("catalog-not-null=" + str(bool(not_null)).lower())
print("null-insert-rejected=" + str(rejected).lower())
print("uses-anti-index=" + str("IDX_BLOCKED_CANDIDATE" in plan).lower())`, "anti-ids=2,3\ncatalog-not-null=true\nnull-insert-rejected=true\nuses-anti-index=true", ["mysql-semijoin", "mysql-explain", "mysql-isolation", "oracle-exists", "sqlite-eqp", "sqlite-queryplanner", "sqlite-isolation", "python-sqlite3"])],
    diagnostics: [d("NULL-safe rewrite 뒤 correctness는 맞지만 큰 tenant에서 anti query가 timeout됩니다.", "correlation/scope index가 없거나 cardinality statistics가 skew를 반영하지 못해 repeated scan 또는 잘못된 strategy를 선택했습니다.", ["actual loops/rows examined", "scope+key index order", "match ratio·tenant skew", "materialization/temp/spill"], "representative 분포에서 index·NOT EXISTS·LEFT anti·materialization 후보를 결과 parity와 함께 비교해 budget 내 plan을 승인합니다.", "data-size/match-ratio 구간별 performance regression test와 plan alert를 둡니다.")],
    expertNotes: ["NULL correctness를 고친 뒤에는 반드시 이전 NOT IN이 우연히 0행이라 빨랐던 착시를 제거한 실제 부하를 측정합니다.", "계획 세부 문자열 전체보다 index access·actual loops·rows budget 같은 안정적 불변식을 감시합니다."],
  },
  {
    id: "isolation-and-changing-exclusion-set",
    title: "변하는 exclusion set과 snapshot 일관성을 설계합니다",
    lead: "anti query가 한 statement 안에서는 일관돼도 count·page·후속 write를 여러 statement로 나누면 그 사이 NULL이나 match가 삽입되어 판단이 달라질 수 있습니다.",
    explanations: [
      "하나의 NOT EXISTS statement는 해당 engine/isolation의 statement read view에서 판단합니다. 다음 statement는 새 snapshot을 볼 수 있으므로 ‘방금 미존재’가 계속 미존재한다는 보장은 없습니다.",
      "NOT IN subquery 결과를 application list로 먼저 가져와 다음 query에 넣으면 두 snapshot뿐 아니라 empty-list adapter, NULL serialization, parameter limit와 cache staleness 문제가 추가됩니다.",
      "anti check 뒤 resource 생성은 check-then-act race입니다. exclusion/uniqueness invariant가 write correctness라면 unique constraint, conditional insert 또는 lock을 사용하고 conflict를 처리합니다.",
      "오래 유지된 snapshot에서는 새 block row가 보이지 않아 stale allow가 될 수 있습니다. authorization/deny list라면 freshness와 consistency 요구를 더 엄격하게 정의하고 DB query만으로 보안 결정을 끝내지 않습니다.",
      "replica에서 anti check하고 primary에 write하면 replication lag로 stale negative를 볼 수 있습니다. read routing, version token, primary recheck 또는 constraint를 risk에 맞게 선택합니다.",
    ],
    concepts: [
      c("negative-read staleness", "match가 없다는 읽기 결과가 concurrent insert나 replica lag 때문에 즉시 낡을 수 있는 상태입니다.", ["positive cache보다 위험할 수 있습니다.", "version/freshness를 포함합니다."]),
      c("atomic exclusion enforcement", "anti condition과 write를 constraint·conditional DML·lock으로 같은 원자 경계에서 강제하는 방식입니다.", ["SELECT 확인만으로 부족합니다.", "conflict를 정상 처리합니다."]),
      c("snapshot scope", "anti query가 참조한 exclusion relation의 버전과 read view 범위입니다.", ["여러 statement에서 달라질 수 있습니다.", "response metadata/telemetry에 기록합니다."]),
    ],
    diagnostics: [d("NOT EXISTS 확인 직후 금지 row가 생겨 허용되지 않아야 할 write가 성공합니다.", "negative read와 write 사이 race 또는 replica lag가 있고 write 경계에 constraint/recheck가 없습니다.", ["두 transaction timeline", "read/write node와 lag", "constraint/lock", "snapshot/version token"], "primary의 atomic conditional DML·constraint 또는 적절한 lock에서 exclusion을 재검증하고 stale negative를 실패로 처리합니다.", "barrier 기반 concurrent insert와 replica-lag simulation을 acceptance에 포함합니다.")],
    expertNotes: ["anti query 결과를 오래 cache할수록 새 exclusion을 놓치는 방향으로 실패합니다.", "보안 deny 판단은 DB snapshot, policy version과 cache invalidation을 하나의 위협 모델로 검토합니다."],
  },
  {
    id: "security-portability-observability",
    title: "anti query의 권한·parameter·dialect·운영 실패를 관측합니다",
    lead: "NOT EXISTS도 correlation scope가 빠지거나 동적 SQL로 조립되면 누락·injection·cross-tenant inference를 만들며, engine 차이를 숨기면 업그레이드 후 결과가 달라질 수 있습니다.",
    explanations: [
      "outer와 inner authorization predicate를 모두 적용합니다. 다른 tenant의 exclusion row로 현재 tenant row를 숨기는 것도 데이터 노출의 반대 방향이지만 존재 inference와 서비스 가용성 문제입니다.",
      "사용자 exclusion values는 placeholders 또는 typed temporary relation으로 전달합니다. 가변 IN 목록을 문자열 join하지 않고 empty collection, maximum elements/bytes와 query timeout을 제한합니다.",
      "MySQL·Oracle·SQLite의 NULL/empty-list/tuple IN, antijoin transformation, EXPLAIN과 isolation 표현을 같은 golden matrix로 비교합니다. SQLite의 empty literal list extension을 다른 engine에 일반화하지 않습니다.",
      "관측에는 query shape, outer/inner/null/unresolved counts, anti result count, plan strategy/index, rows examined, snapshot age, timeout와 constraint violation을 두되 실제 keys와 policy values는 기록하지 않습니다.",
      "배포는 기존 NOT IN과 새 NOT EXISTS를 shadow-read해 ordered outer ids, null counters와 latency를 비교한 뒤 전환합니다. 결과가 다른 rows는 민감 원문 없이 reason class로 검토하고 rollback path를 유지합니다.",
    ],
    concepts: [
      c("anti-query authorization", "outer candidates와 inner exclusion evidence가 같은 principal·tenant policy를 통과하도록 보장하는 규칙입니다.", ["복합 scope key를 사용합니다.", "cache에도 적용합니다."]),
      c("bounded membership input", "사용자 제공 값 집합을 type·count·bytes·empty policy로 제한하고 안전한 relation으로 전달하는 계약입니다.", ["문자열 SQL을 만들지 않습니다.", "parameter limit을 고려합니다."]),
      c("shadow anti comparison", "구·신 anti query를 같은 snapshot/fixture에서 실행해 outer ids·NULL·plan·latency 차이를 승인하는 배포 방식입니다.", ["실사용 key를 로그에 남기지 않습니다.", "rollback 기준을 둡니다."]),
    ],
    diagnostics: [d("tenant별 결과가 섞이거나 사용자 입력으로 anti query가 우회됩니다.", "inner correlation scope가 빠졌거나 가변 IN 목록을 SQL 문자열로 연결했습니다.", ["generated SQL shape", "bound parameter count/type", "outer/inner tenant predicates", "cross-tenant sentinel과 injection payload"], "고정 query template, typed binding과 완전한 tenant correlation을 사용하고 cache·telemetry도 security context별로 분리합니다.", "cross-tenant/injection/empty/oversized-list negative tests를 release gate로 둡니다.")],
    expertNotes: ["raw deny-list keys는 가장 민감한 정책 정보일 수 있으므로 query log·metric label에 넣지 않습니다.", "NULL count 급증은 데이터 품질뿐 아니라 anti 결과 급변의 선행 지표로 경보합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-0202", repository: "dbstudy", path: "02_02.sql", usedFor: ["NOT IN으로 주문하지 않은 entity를 찾는 원본 learning progression"], evidence: "원본을 read-only로 확인했고 인명·도서명·주문 값은 복사하지 않았습니다." },
  { id: "mysql-in", repository: "MySQL 8.4 Reference Manual", path: "Subqueries with ANY, IN, or SOME", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/any-in-some-subqueries.html", usedFor: ["IN/NOT IN membership syntax"], evidence: "MySQL 공식 subquery 문서입니다." },
  { id: "mysql-exists", repository: "MySQL 8.4 Reference Manual", path: "Subqueries with EXISTS or NOT EXISTS", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/exists-and-not-exists-subqueries.html", usedFor: ["NOT EXISTS semantics"], evidence: "MySQL 공식 EXISTS 문서입니다." },
  { id: "mysql-semijoin", repository: "MySQL 8.4 Reference Manual", path: "Semijoin and Antijoin Transformations", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/semijoins-antijoins.html", usedFor: ["nullable antijoin transformation boundaries"], evidence: "MySQL 공식 optimizer 문서입니다." },
  { id: "mysql-comparison", repository: "MySQL 8.4 Reference Manual", path: "Comparison Functions and Operators", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/comparison-operators.html", usedFor: ["three-valued comparison and NULL-safe distinctions"], evidence: "MySQL 공식 comparison operator 문서입니다." },
  { id: "mysql-null", repository: "MySQL 8.4 Reference Manual", path: "Working with NULL Values", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/working-with-null.html", usedFor: ["NULL predicate behavior"], evidence: "MySQL 공식 NULL 문서입니다." },
  { id: "mysql-explain", repository: "MySQL 8.4 Reference Manual", path: "EXPLAIN Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/explain.html", usedFor: ["anti plan evidence"], evidence: "MySQL 공식 EXPLAIN 문서입니다." },
  { id: "mysql-isolation", repository: "MySQL 8.4 Reference Manual", path: "Consistent Nonlocking Reads", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html", usedFor: ["snapshot and stale negative reads"], evidence: "MySQL InnoDB 공식 consistent read 문서입니다." },
  { id: "oracle-in", repository: "Oracle Database 26ai SQL Language Reference", path: "IN Condition", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/IN-Condition.html", usedFor: ["Oracle IN/NOT IN semantics"], evidence: "Oracle 공식 IN condition 문서입니다." },
  { id: "oracle-exists", repository: "Oracle Database 26ai SQL Language Reference", path: "EXISTS Condition", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/EXISTS-Condition.html", usedFor: ["Oracle NOT EXISTS portability"], evidence: "Oracle 공식 EXISTS condition 문서입니다." },
  { id: "oracle-null", repository: "Oracle Database 26ai SQL Language Reference", path: "Null Conditions", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Null-Conditions.html", usedFor: ["Oracle NULL condition behavior"], evidence: "Oracle 공식 null condition 문서입니다." },
  { id: "sqlite-in", repository: "SQLite Documentation", path: "SQL Language Expressions: IN and NOT IN matrix", publicUrl: "https://www.sqlite.org/lang_expr.html#the_in_and_not_in_operators", usedFor: ["exact truth-matrix laboratory"], evidence: "SQLite 공식 IN/NOT IN anchor입니다." },
  { id: "sqlite-eqp", repository: "SQLite Documentation", path: "EXPLAIN QUERY PLAN", publicUrl: "https://www.sqlite.org/eqp.html", usedFor: ["anti index plan laboratory"], evidence: "SQLite 공식 EQP 문서입니다." },
  { id: "sqlite-queryplanner", repository: "SQLite Documentation", path: "Query Planning", publicUrl: "https://www.sqlite.org/queryplanner.html", usedFor: ["correlation index and planner limits"], evidence: "SQLite 공식 query planner 문서입니다." },
  { id: "sqlite-isolation", repository: "SQLite Documentation", path: "Isolation In SQLite", publicUrl: "https://www.sqlite.org/isolation.html", usedFor: ["snapshot laboratory boundaries"], evidence: "SQLite 공식 isolation 문서입니다." },
  { id: "python-sqlite3", repository: "Python 3 Documentation", path: "sqlite3 DB-API and placeholders", publicUrl: "https://docs.python.org/3/library/sqlite3.html#how-to-use-placeholders-to-bind-values-in-sql-queries", usedFor: ["exact examples and safe parameters"], evidence: "Python 공식 sqlite3 placeholder 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-14-not-in-null-trap",
  slug: "sql-14-not-in-null-trap",
  courseId: "database",
  moduleId: "db-joins-subqueries",
  order: 5,
  title: "NOT IN의 NULL 함정과 NOT EXISTS",
  subtitle: "부정 membership을 UNKNOWN 행렬·anti-semijoin·constraint·snapshot·권한·운영 증거로 완성합니다.",
  level: "고급",
  estimatedMinutes: 900,
  coreQuestion: "제외 목록이나 비교 key에 NULL이 있어도 outer rows를 조용히 잃지 않고, NOT EXISTS·LEFT anti·constraint·index 중 적절한 설계를 어떻게 증명할까요?",
  summary: "dbstudy 02_02.sql의 ‘주문하지 않은 entity’를 NOT IN으로 찾는 progression을 read-only로 감사하고 sample literals는 복사하지 않습니다. IN/NOT IN의 TRUE·FALSE·UNKNOWN 행렬, NULL poisoning 전개, empty·inner NULL·outer NULL 경계, NOT EXISTS anti-semijoin, filtered NOT IN 전제, LEFT JOIN anti marker, NOT NULL/FK/quarantine, anti lookup index와 EXPLAIN, changing exclusion snapshot과 check-then-act race, tenant·parameter·dialect·shadow telemetry까지 확장합니다. 다섯 exact Python/sqlite3 examples는 truth matrix, poisoning, outer NULL, nullable payload marker와 constraint/index plan을 실제 실행합니다.",
  objectives: ["IN·NOT IN을 TRUE/FALSE/UNKNOWN 행렬로 계산한다.", "inner NULL poisoning과 outer NULL 정책을 서로 구분한다.", "NOT EXISTS correlation으로 NULL-safe anti-membership을 설계한다.", "filtered NOT IN과 LEFT JOIN anti의 전제·nullable marker 위험을 설명한다.", "NOT NULL·FK·quarantine으로 anti-key integrity를 강제한다.", "복합 anti index·EXPLAIN actual·match 분포를 성능 근거로 만든다.", "snapshot race·tenant scope·parameter·dialect·privacy telemetry를 운영한다."],
  prerequisites: [{ title: "스칼라·IN·EXISTS 서브쿼리", reason: "membership, existence, correlation과 semijoin outer grain을 이해해야 부정 predicate의 NULL·anti-join 차이를 분석할 수 있습니다.", sessionSlug: "sql-13-scalar-in-exists-subquery" }],
  keywords: ["NOT IN", "NULL", "UNKNOWN", "three-valued logic", "NOT EXISTS", "antijoin", "LEFT JOIN IS NULL", "NULL poisoning", "NOT NULL", "EXPLAIN", "snapshot", "deny list"],
  topics,
  lab: {
    title: "NULL과 동시 변경에 안전한 multi-tenant exclusion query 구축하기",
    scenario: "candidate와 blocked relation에 legacy NULL, duplicate, unresolved external key, 같은 local id의 다른 tenant와 concurrent block insert가 있습니다. 정확한 anti result와 write enforcement가 필요합니다.",
    setup: ["합성 tenant/candidate/block ids와 empty·inner NULL·outer NULL·duplicate fixtures만 사용합니다.", "MySQL 8.4·Oracle 26ai isolated schema, representative index/statistics와 두 connection barrier를 준비합니다.", "outer/inner nullability, exclusion match, tenant scope, snapshot/freshness와 unknown-row policy를 문서화합니다.", "canonical expected outer ids와 truth matrix를 engine별 golden evidence로 고정합니다."],
    steps: ["원본 NOT IN progression과 nullable risk를 source audit에 기록합니다.", "outer/inner NULL·empty·match 조합의 IN/NOT IN truth를 모두 실행합니다.", "raw·filtered NOT IN, NOT EXISTS와 LEFT anti 결과 id multiset을 비교합니다.", "outer NULL 포함/제외/quarantine 정책을 각 query에 적용합니다.", "LEFT anti에서 nullable payload와 non-null primary marker 반례를 재현합니다.", "legacy NULL/orphan을 quarantine하고 NOT NULL/FK catalog를 readback합니다.", "scope+correlation index와 antijoin/materialization plan을 분포별 측정합니다.", "concurrent block insert·replica lag에서 stale negative와 atomic write enforcement를 검증합니다.", "bound input, tenant scope, cache와 redacted null/result telemetry를 negative-test합니다.", "shadow-read 결과·plan·latency를 승인한 뒤 versioned query를 전환하고 rollback을 연습합니다."],
    expectedResult: ["NULL contamination이 있는 raw NOT IN은 실패 증거로 검출되고 승인 anti query는 canonical ids와 일치합니다.", "다섯 exact examples의 stdout이 완전히 일치합니다.", "outer unknown, nullable marker, cross-tenant scope와 concurrent stale-negative가 명시적 정책으로 처리됩니다.", "target engines에서 승인된 antijoin/index/rows-examined/latency budget을 만족합니다.", "raw exclusion keys 없이 null/unresolved/result/plan/snapshot 지표로 운영할 수 있습니다."],
    cleanup: ["isolated schema·합성 rows·indexes·quarantine·shadow artifacts를 run id로 제거합니다.", "test credentials와 cache entries를 폐기합니다.", "logs에 raw deny keys·tenant ids·parameters가 없는지 확인합니다.", "dbstudy 원본과 production data는 변경하지 않습니다."],
    extensions: ["composite row-value NOT IN NULL matrix를 engine별 작성합니다.", "temporal exclusion의 valid-from/to와 snapshot을 anti predicate에 추가합니다.", "Bloom filter/temporary table 방식의 큰 exclusion set과 정확성 경계를 비교합니다.", "row-level security와 anti query optimizer rewrite의 plan을 분석합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 NULL 위치별 truth와 anti outer ids를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "TRUE/FALSE/UNKNOWN을 직접 계산합니다.", "raw/filtered NOT IN과 NOT EXISTS를 비교합니다.", "outer NULL 정책 차이를 설명합니다.", "LEFT anti marker 반례를 재현합니다.", "constraint와 index plan 증거를 확인합니다."], hints: ["결과 0행을 성공으로 판단하지 말고 predicate UNKNOWN과 inner NULL count를 먼저 보세요."], expectedOutcome: "NOT IN 함정을 암기가 아니라 재현 가능한 three-valued truth로 설명합니다.", solutionOutline: ["truth matrix→null provenance→anti rewrite→constraints→plan→snapshot 순서입니다."] },
    { difficulty: "응용", prompt: "원본 02_02 anti query를 multi-tenant exclusion 서비스로 재구성하세요.", requirements: ["원본 progression provenance를 보존합니다.", "unknown inner/outer 상태를 분리합니다.", "NOT EXISTS/LEFT anti 선택 근거와 outer grain을 기록합니다.", "NOT NULL/FK/quarantine migration을 설계합니다.", "tenant scope와 bound input을 적용합니다.", "index/plan/match-skew matrix를 실행합니다.", "concurrent stale negative를 atomic DML로 막습니다.", "shadow-read·telemetry·rollback을 포함합니다."], hints: ["NULL을 sentinel로 덮지 말고 어떤 상태였는지 보존하세요."], expectedOutcome: "데이터 품질·권한·성능·동시성을 갖춘 anti-membership query가 완성됩니다.", solutionOutline: ["audit→matrix→policy→constraints→query→plan→concurrency→release 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 negative membership·anti-join 표준을 작성하세요.", requirements: ["empty/inner NULL/outer NULL truth schema를 정의합니다.", "NOT EXISTS·filtered NOT IN·LEFT anti 선택 기준을 둡니다.", "non-null marker와 filter placement 규칙을 둡니다.", "constraint/quarantine/schema-drift readback을 요구합니다.", "index/plan/distribution budget을 정의합니다.", "snapshot/replica/check-then-act 정책을 둡니다.", "tenant/input/cache/privacy 관측을 정의합니다.", "dialect shadow conformance와 rollback을 포함합니다."], hints: ["negative result는 새 match가 생기면 즉시 낡는다는 점을 운영 표준에 포함하세요."], expectedOutcome: "조회부터 write enforcement까지 일관된 anti-query governance가 완성됩니다.", solutionOutline: ["classify unknown→correlate→constrain→measure→isolate→protect→observe→recover 순서입니다."] },
  ],
  nextSessions: ["sql-15-case-conditional-report"],
  sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["02_02.sql의 positive IN 4개와 ‘주문하지 않은 entity’ NOT IN 1개 progression을 read-only로 확인했습니다.", "원본 인명·도서명·출판사·주문 sample literals와 PII 가능 값은 복사하지 않았습니다.", "원본은 NOT IN의 UNKNOWN matrix, inner/outer NULL, NOT EXISTS·LEFT anti, constraint/index/EXPLAIN, isolation·tenant 보안을 충분히 설명하지 않아 공식 문서와 합성 예제로 보완했습니다.", "SQLite exact examples는 MySQL 8.4·Oracle 26ai의 antijoin transformation, constraint catalog와 isolation/replication 동작을 대체하지 않습니다."] },
});

export default session;
