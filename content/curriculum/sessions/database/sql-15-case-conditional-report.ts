import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: `1-${Math.min(6, lineCount)}`, explanation: "sqlite3 메모리 DB와 합성 상태·점수·금액만 준비해 분류 규칙을 개인정보·원본 sample literals와 분리합니다." },
      { lines: `${Math.min(7, lineCount)}-${Math.max(7, lineCount - 5)}`, explanation: "simple/searched CASE, first-match, result type, conditional aggregate 또는 sargability를 실제 SQL과 독립 기대값으로 검증합니다." },
      { lines: `${Math.max(1, lineCount - 4)}-${lineCount}`, explanation: "정렬된 label·count·type·plan boolean만 출력합니다. SQLite storage class와 plan은 MySQL·Oracle의 CASE type/optimizer 계약을 대체하지 않습니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "분류 경계·ELSE·type·aggregate grain과 plan을 MySQL 8.4·Oracle 26ai에서도 같은 fixture로 readback합니다."] },
    experiments: [
      { change: "WHEN 순서를 뒤집고 경계·NULL·새 status와 서로 다른 result type을 추가합니다.", prediction: "first-match, ELSE와 type resolution 계약이 없으면 label·sort·driver type이 달라집니다.", result: "각 입력이 정확히 한 category로 가는지 coverage/overlap matrix와 typeof/readback으로 확인합니다." },
      { change: "CASE를 WHERE indexed column 주위에 감싸고 직접 predicate와 EXPLAIN을 비교합니다.", prediction: "결과는 같아도 expression 때문에 index range/lookup이 사라질 수 있습니다.", result: "CASE는 projection/reporting에 두고 filtering은 sargable canonical predicate로 유지하는 후보를 측정합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "simple-searched-case-expression",
    title: "simple CASE와 searched CASE를 값 매핑과 조건 분류로 구분합니다",
    lead: "CASE는 저장 프로시저의 제어문이 아니라 SELECT·ORDER BY·aggregate 안에서 한 값을 만드는 expression이며, 동등 비교인지 범위·복합 조건인지에 따라 두 형태를 선택합니다.",
    explanations: [
      "dbstudy 01_30.sql의 WHERE/HAVING 범위와 집계, 02_02.sql의 subquery·NULL, 02_03.sql의 aggregate·paging·view는 CASE를 직접 쓰지 않습니다. 이 세션은 그 query 결과를 합성 status·구간·report label로 분류하는 전문가 확장임을 provenance에 명시합니다.",
      "simple CASE expr WHEN value THEN result는 같은 expression에 대한 equality mapping에 적합합니다. status code를 stable display category로 바꾸되 NULL은 `WHEN NULL`과 같지 않으므로 별도 searched condition 또는 ELSE를 설계합니다.",
      "searched CASE WHEN condition THEN result는 범위, 복합 boolean, NULL 검사와 EXISTS 등을 왼쪽부터 평가해 첫 TRUE result를 반환합니다. 조건 간 우선순위가 곧 business rule입니다.",
      "SQL CASE expression은 MySQL stored-program CASE statement의 END CASE와 다릅니다. query 안에서는 END로 끝나며 값 하나를 반환하므로 projection alias, aggregate argument와 order expression에 결합할 수 있습니다.",
      "label을 데이터의 source of truth로 저장하지 않습니다. canonical status·score와 versioned CASE rule에서 파생하고, 반복 사용·권한·index가 필요하면 governed view/generated column/dimension table을 비교합니다.",
    ],
    concepts: [
      c("simple CASE", "기준 expression을 여러 comparison values와 equality로 비교해 result 하나를 반환하는 표현식입니다.", ["코드→label 매핑에 적합합니다.", "NULL equality에 주의합니다."]),
      c("searched CASE", "각 WHEN에 독립 condition을 두고 처음 TRUE인 result를 반환하는 표현식입니다.", ["범위·NULL·복합 조건을 표현합니다.", "순서가 우선순위입니다."]),
      c("derived classification", "원시 사실을 versioned rule로 category label/rank에 변환한 결과입니다.", ["canonical fact와 구분합니다.", "rule version을 기록합니다."]),
    ],
    codeExamples: [py("sql15-simple-searched-case", "상태 매핑과 점수 구간을 동시에 분류하기", "sql15_case_forms.py", "simple CASE로 상태를 매핑하고 searched CASE로 NULL과 점수 구간을 분류해 두 형태의 역할을 비교합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE signal(id INTEGER PRIMARY KEY, state TEXT NOT NULL, score INTEGER)")
db.executemany("INSERT INTO signal VALUES (?, ?, ?)", [
    (1, "ok", 95), (2, "hold", 75), (3, "other", 40), (4, "ok", None)
])
rows = db.execute("""
 SELECT id,
        CASE state WHEN 'ok' THEN 'ready' WHEN 'hold' THEN 'pending' ELSE 'unknown' END,
        CASE WHEN score IS NULL THEN 'missing' WHEN score >= 90 THEN 'top'
             WHEN score >= 70 THEN 'pass' ELSE 'retry' END
 FROM signal ORDER BY id
""").fetchall()
for row_id, state_label, score_label in rows:
    print(f"{row_id}:{state_label}:{score_label}")
print("classified=" + str(len(rows)))
print("missing-score=" + str(sum(label == "missing" for _, _, label in rows)))`, "1:ready:top\n2:pending:pass\n3:unknown:retry\n4:ready:missing\nclassified=4\nmissing-score=1", ["local-0130", "local-0202", "mysql-case", "oracle-case", "sqlite-case", "python-sqlite3"])],
    diagnostics: [d("NULL status가 simple CASE의 WHEN NULL branch에 들어가지 않습니다.", "NULL=NULL은 TRUE가 아니라 UNKNOWN이므로 simple equality mapping으로 NULL을 잡으려 했습니다.", ["input NULL count", "simple vs searched form", "ELSE output", "engine truth fixture"], "CASE WHEN status IS NULL THEN ... searched branch를 사용하거나 upstream NOT NULL/default 계약을 강제합니다.", "known codes·unknown code·NULL을 모두 포함한 classification test를 둡니다.")],
    comparisons: [{ title: "CASE 형태 선택", options: [
      { name: "simple CASE", chooseWhen: "한 expression의 discrete equality mapping일 때", avoidWhen: "NULL·범위·복합 predicate가 필요할 때", tradeoffs: ["간결함", "NULL equality와 type coercion 주의"] },
      { name: "searched CASE", chooseWhen: "범위·우선순위·복합 조건을 표현할 때", avoidWhen: "수백 개 코드 mapping을 SQL에 하드코딩할 때", tradeoffs: ["표현력", "overlap·ordering 검증 필요"] },
      { name: "dimension table", chooseWhen: "mapping이 데이터로 운영·버전·소유되어야 할 때", avoidWhen: "작고 고정된 query-local rule일 때", tradeoffs: ["governance와 유효기간", "join·data quality 비용"] },
    ] }],
    expertNotes: ["query CASE expression과 stored-program CASE statement의 종료 문법을 혼동하지 않습니다.", "label이 여러 report에 반복되면 rule source와 owner/version을 한 곳으로 모읍니다."],
  },
  {
    id: "first-match-overlap-boundaries",
    title: "searched CASE의 first-match와 경계 겹침을 결정표로 검증합니다",
    lead: "여러 WHEN이 TRUE여도 첫 번째 branch만 선택되므로 좁은 범위·높은 임계값을 먼저 두거나 명시적 mutual exclusion을 설계해야 합니다.",
    explanations: [
      "CASE WHEN amount>=10 THEN 'high' WHEN amount>=20 THEN 'extreme'은 20도 첫 branch에서 끝나 extreme에 도달하지 않습니다. 높은 임계값부터 내림차순으로 두거나 `>=10 AND <20`처럼 구간을 분리합니다.",
      "경계 정책은 0, 임계값 바로 아래·같음·바로 위와 최대/최소를 포함한 table로 정의합니다. 부동소수점·currency scale·timezone date 경계는 raw literal이 아니라 canonical type과 half-open interval을 사용합니다.",
      "branch overlap이 의도된 우선순위인지 결함인지 문서화합니다. fraud rule처럼 여러 조건이 참이어도 severity가 높은 첫 rule을 택할 수 있지만 matched rule id와 version을 함께 남겨야 설명할 수 있습니다.",
      "gap은 ELSE로 나타납니다. ELSE를 생략하면 unmatched row가 NULL label이 되어 group/report에서 조용히 별도 bucket이 되거나 UI에서 사라질 수 있습니다.",
      "coverage 검증은 각 row가 exactly one category인지, explicit overlap priority인지, unknown/error bucket인지 집계합니다. 샘플 눈검사 대신 boundary property test를 둡니다.",
    ],
    concepts: [
      c("first-match semantics", "왼쪽부터 처음 TRUE인 WHEN의 result만 반환하는 규칙입니다.", ["뒤 branch는 선택되지 않습니다.", "순서가 business priority입니다."]),
      c("boundary table", "각 임계값의 below/equal/above와 NULL·extreme 기대 category를 기록한 테스트 표입니다.", ["off-by-one을 검출합니다.", "type·unit을 명시합니다."]),
      c("overlap policy", "두 조건이 동시에 TRUE일 때 허용 여부와 winner를 정한 규칙입니다.", ["의도적 priority를 versioning합니다.", "unintended shadow branch를 탐지합니다."]),
    ],
    codeExamples: [py("sql15-first-match-boundaries", "잘못된 임계값 순서와 올바른 분류 비교", "sql15_case_boundaries.py", "-5·0·10·20·NULL에서 broad-first CASE가 높은 branch를 가리는 반례와 high-first 분류를 나란히 출력합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE sample(seq INTEGER PRIMARY KEY, amount INTEGER)")
db.executemany("INSERT INTO sample VALUES (?, ?)", [(1, -5), (2, 0), (3, 10), (4, 20), (5, None)])
rows = db.execute("""
 SELECT amount,
   CASE WHEN amount IS NULL THEN 'unknown' WHEN amount >= 10 THEN 'high'
        WHEN amount >= 20 THEN 'extreme' WHEN amount >= 0 THEN 'nonnegative' ELSE 'negative' END,
   CASE WHEN amount IS NULL THEN 'unknown' WHEN amount >= 20 THEN 'extreme'
        WHEN amount >= 10 THEN 'high' WHEN amount >= 0 THEN 'nonnegative' ELSE 'negative' END
 FROM sample ORDER BY seq
""").fetchall()
for amount, broad_first, high_first in rows:
    label = "NULL" if amount is None else str(amount)
    print(f"{label}:wrong={broad_first},right={high_first}")
print("shadowed-at-20=" + str(rows[3][1] != rows[3][2]).lower())`, "-5:wrong=negative,right=negative\n0:wrong=nonnegative,right=nonnegative\n10:wrong=high,right=high\n20:wrong=high,right=extreme\nNULL:wrong=unknown,right=unknown\nshadowed-at-20=true", ["local-0130", "mysql-case", "oracle-case", "sqlite-case", "sqlite-select"])],
    diagnostics: [d("최상위 등급 row가 모두 중간 등급으로 분류됩니다.", "포괄적인 낮은 임계값 WHEN이 먼저 있어 뒤의 높은 임계값 branch를 shadow했습니다.", ["조건 pair overlap", "WHEN 순서", "threshold below/equal/above", "matched rule id"], "높은 임계값부터 배치하거나 mutual-exclusive half-open ranges로 쓰고 결정표와 coverage assertion을 추가합니다.", "모든 임계값의 -1/equal/+1과 overlap mutation test를 둡니다.")],
    expertNotes: ["순서를 바꾸는 것은 포맷팅 변경이 아니라 business semantics 변경입니다.", "matched branch id를 report lineage에 두면 분류 결과를 설명하고 과거 rule을 재현할 수 있습니다."],
  },
  {
    id: "else-null-and-total-classification",
    title: "ELSE·NULL·unknown category로 total classification을 설계합니다",
    lead: "ELSE 생략은 암묵적 NULL 반환이며 새 status·누락 값·오타를 숨길 수 있으므로 closed/open domain에 맞는 fallback과 품질 경보가 필요합니다.",
    explanations: [
      "closed enum domain이라면 unknown code가 schema CHECK에서 거절되어야 하고 CASE ELSE는 defensive error label 또는 NULL counter로 남을 수 있습니다. open domain이면 'other'와 원본 code ownership을 문서화합니다.",
      "NULL input을 unknown, not-applicable, pending 또는 invalid 중 무엇으로 분류하는지 정합니다. 모두 '기타'로 합치면 data completeness와 business category를 구분할 수 없습니다.",
      "ELSE 0은 conditional aggregate에서 편리하지만 row classification에서 0이 실제 category/value라면 unmatched와 합쳐집니다. result domain에 맞는 typed sentinel 또는 별도 matched flag를 사용합니다.",
      "category count 합이 eligible rows와 같아야 하는 total classification인지, 일부만 포함하는 partial metric인지 구분합니다. source=categories+unknown+excluded reconciliation을 둡니다.",
      "새 status가 추가되면 CASE가 자동으로 옳아지지 않습니다. schema enum, application mapping, report SQL과 dashboard filter를 같은 release contract로 versioning합니다.",
    ],
    concepts: [
      c("total classification", "모든 eligible row가 정확히 하나의 명시 category 또는 unknown/error bucket에 들어가는 분류입니다.", ["count reconciliation을 합니다.", "ELSE 정책이 필수입니다."]),
      c("open versus closed domain", "새 값을 허용하는 code 집합과 schema로 고정된 enum 집합의 차이입니다.", ["fallback 정책이 다릅니다.", "owner/version을 둡니다."]),
      c("unknown bucket", "NULL·새 code·불완전 데이터를 정상 business category와 분리해 관측하는 결과입니다.", ["silent NULL을 피합니다.", "remediation owner를 연결합니다."]),
    ],
    diagnostics: [d("새 status 배포 후 report 총합이 줄었지만 오류는 없습니다.", "ELSE 없는 CASE가 새 값을 NULL로 만들고 downstream filter/aggregate가 NULL을 제외했습니다.", ["unknown/new code counts", "CASE ELSE", "source-to-category reconciliation", "schema/application/report versions"], "명시적 unknown/error bucket과 metric을 추가하고 closed domain이면 CHECK 및 coordinated release로 새 값을 관리합니다.", "unknown code sentinel과 source=sum(categories)+unknown invariant를 배포 gate로 둡니다.")],
    expertNotes: ["'기타'가 영구 쓰레기통이 되지 않도록 count·age·top unknown codes를 민감 값 없이 관리합니다.", "ELSE NULL을 의도했다면 downstream NULL semantics까지 contract에 씁니다."],
  },
  {
    id: "case-result-type-collation",
    title: "모든 result branch의 타입·precision·collation을 하나의 출력 계약으로 맞춥니다",
    lead: "CASE는 branch마다 별도 column을 만드는 것이 아니라 result 하나를 만들므로 숫자·문자·날짜·NULL을 섞으면 engine의 type resolution과 driver mapping이 개입합니다.",
    explanations: [
      "MySQL은 모든 result values의 aggregated type을 계산하고 Oracle은 비교/result expression의 datatype compatibility와 numeric precedence를 적용합니다. SQLite는 선택된 값의 storage class가 row마다 다를 수 있어 동일 query column도 Python 타입이 달라질 수 있습니다.",
      "THEN 0 ELSE 'unknown'처럼 숫자와 문자를 섞지 않습니다. display label은 모두 text로, metric value는 모두 numeric으로 분리하고 필요하면 CAST를 각 branch에 명시합니다.",
      "DECIMAL amount와 integer 0을 섞을 때 precision/scale이 보존되는지 driver에서 readback합니다. currency는 float implicit conversion을 피하고 unit·rounding을 report contract에 둡니다.",
      "문자 result의 character set/collation은 GROUP BY·ORDER BY category equality를 바꿀 수 있습니다. multilingual label은 stable category code와 localized presentation을 분리합니다.",
      "literal NULL branch가 type aggregation에서 특별 취급될 수 있습니다. NULL을 typed CAST하여 view/materialized column schema가 예상 type인지 catalog·driver로 확인합니다.",
    ],
    concepts: [
      c("result type resolution", "모든 THEN/ELSE expressions로 CASE 전체 SQL type·precision·collation을 결정하는 규칙입니다.", ["engine별 차이가 있습니다.", "driver readback을 포함합니다."]),
      c("branch type uniformity", "모든 result branches가 같은 domain과 명시적 type을 반환하는 성질입니다.", ["number/text를 섞지 않습니다.", "typed NULL을 사용합니다."]),
      c("category code", "정렬·집계·API에 쓰는 stable machine value이며 localized label과 분리됩니다.", ["collation 영향을 줄입니다.", "mapping version을 둡니다."]),
    ],
    codeExamples: [py("sql15-case-result-types", "mixed branch storage class와 명시적 CAST 비교", "sql15_case_types.py", "SQLite에서 integer/text branch가 row별 다른 typeof를 만들고 CAST AS TEXT가 출력 type을 통일하는지 확인합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE flag(id INTEGER PRIMARY KEY, enabled INTEGER NOT NULL CHECK(enabled IN (0,1)))")
db.executemany("INSERT INTO flag VALUES (?, ?)", [(1, 1), (2, 0)])
rows = db.execute("""
 SELECT id,
        CASE WHEN enabled=1 THEN 7 ELSE 'none' END AS mixed,
        typeof(CASE WHEN enabled=1 THEN 7 ELSE 'none' END),
        CAST(CASE WHEN enabled=1 THEN 7 ELSE 'none' END AS TEXT),
        typeof(CAST(CASE WHEN enabled=1 THEN 7 ELSE 'none' END AS TEXT))
 FROM flag ORDER BY id
""").fetchall()
for row_id, mixed, mixed_type, uniform, uniform_type in rows:
    print(f"{row_id}:mixed={mixed}/{mixed_type},cast={uniform}/{uniform_type}")
print("mixed-types=" + str(len({row[2] for row in rows}) > 1).lower())
print("cast-uniform=" + str(all(row[4] == "text" for row in rows)).lower())`, "1:mixed=7/integer,cast=7/text\n2:mixed=none/text,cast=none/text\nmixed-types=true\ncast-uniform=true", ["mysql-case", "mysql-type", "oracle-case", "oracle-type", "sqlite-case", "python-sqlite3"])],
    diagnostics: [d("같은 CASE column이 일부 row에서는 숫자, 일부에서는 문자열로 driver에 전달됩니다.", "branch result type을 통일하지 않고 engine의 암시적 type resolution/storage class에 의존했습니다.", ["각 branch SQL type/typeof", "view/catalog result type", "driver runtime types", "serialization schema"], "result domain을 하나로 정하고 모든 branch와 NULL을 명시적으로 CAST하며 machine code와 display label을 분리합니다.", "각 branch를 강제로 선택하는 fixture에서 DB type과 driver type을 검사합니다.")],
    expertNotes: ["화면에서 모두 문자열처럼 보이는 것은 API/schema type이 안정적이라는 증거가 아닙니다.", "type/collation 변화는 CASE label 변경과 함께 migration compatibility 대상으로 관리합니다."],
  },
  {
    id: "short-circuit-and-safe-expressions",
    title: "short-circuit을 오류 회피에 쓰되 side effect·optimizer 추측에 의존하지 않습니다",
    lead: "CASE는 첫 matching branch 이후 result를 선택하지 않는 모델을 제공하지만 위험한 계산, 함수 부작용과 dialect 차이를 숨기는 만능 보호막은 아닙니다.",
    explanations: [
      "Oracle 공식 문서는 CASE의 left-to-right short-circuit evaluation을 설명합니다. denominator=0을 먼저 검사한 뒤 division을 계산하는 searched CASE처럼 branch order로 안전 조건을 표현할 수 있습니다.",
      "그래도 database optimizer, constant folding, aggregate evaluation과 user-defined function의 세부 timing을 일반화하지 않습니다. 안전한 SQL은 NULLIF, validated domain, CHECK와 별도 filtering을 함께 사용합니다.",
      "CASE branch에 data-changing function, network call 또는 nondeterministic side effect를 넣지 않습니다. optimizer rewrite와 engine 차이로 호출 횟수 가정을 보장하기 어렵고 query 재시도·replication도 위험합니다.",
      "expensive expression을 CASE로 감쌌다고 항상 비용이 절감되는 것은 아닙니다. generated plan과 function execution counters를 측정하고 prefilter/materialization 대안을 비교합니다.",
      "division result의 type과 zero/NULL denominator 정책을 구분합니다. 0, NULL, error, not-applicable label 중 API 계약을 선택하고 numerator/denominator 원시 counts를 함께 제공합니다.",
    ],
    concepts: [
      c("guard branch", "위험한 계산보다 먼저 domain/NULL/zero 조건을 판정하는 WHEN입니다.", ["우선순위가 중요합니다.", "NULLIF·constraint와 함께 씁니다."]),
      c("short-circuit contract", "첫 matching CASE branch 이후 뒤 조건/result를 선택하지 않는 평가 의미입니다.", ["공식 dialect 문서로 확인합니다.", "side effect 보장으로 남용하지 않습니다."]),
      c("safe arithmetic policy", "zero·NULL·overflow·unit에 대해 result/error/not-applicable을 정한 계산 계약입니다.", ["CASE type을 통일합니다.", "raw denominator를 보존합니다."]),
    ],
    diagnostics: [d("CASE로 0 나눗셈을 막았는데 engine 변경이나 query rewrite 후 오류·타입 변화가 생깁니다.", "branch order만 믿고 denominator constraint, NULLIF와 engine-specific evaluation/type conformance를 검증하지 않았습니다.", ["zero/NULL/negative denominator fixtures", "CASE/NULLIF expression", "result type", "target engine plan/version"], "guard condition과 NULLIF·domain CHECK를 함께 사용하고 결과 type/policy를 CAST하여 target engines에서 실행합니다.", "모든 위험 domain과 optimizer/version matrix를 regression test합니다.")],
    expertNotes: ["short-circuit은 invalid data를 정상으로 만드는 수단이 아니라 명시한 domain policy를 안전하게 표현하는 한 요소입니다.", "side-effect UDF를 CASE evaluation 횟수에 묶지 않습니다."],
  },
  {
    id: "projection-versus-filter-sargability",
    title: "CASE는 분류 projection에 두고 검색 predicate의 sargability를 지킵니다",
    lead: "indexed column을 CASE·함수로 감싼 WHERE는 같은 결과라도 index lookup/range를 어렵게 만들 수 있으므로 표시 분류와 row 선택을 분리합니다.",
    explanations: [
      "SELECT CASE ... END AS category는 eligible rows를 label로 바꾸는 projection입니다. WHERE CASE WHEN status=? THEN 1 ELSE 0 END=1은 단순 status=?를 우회해 optimizer의 index term 인식을 방해할 수 있습니다.",
      "optional filter를 CASE로 한 query에 합치기보다 query builder가 허용된 predicate template을 선택하도록 합니다. `(:p IS NULL OR col=:p)`도 selectivity·plan을 측정해야 하며 동적 identifier는 allow-list합니다.",
      "CASE-based expression index/generated column은 반복 분류 검색을 빠르게 할 수 있지만 rule version, determinism, collation, write cost와 schema portability를 포함합니다. ad hoc report를 위해 무조건 만들지 않습니다.",
      "GROUP BY CASE는 분류 계산이 필수이므로 index 사용과 hash/sort 비용을 별도 측정합니다. 먼저 WHERE에서 canonical range를 좁히고 같은 CASE expression을 select/group/order에서 일관되게 재사용합니다.",
      "EXPLAIN에서 access type, chosen index, rows examined, filter selectivity와 temp/sort를 봅니다. SQLite EQP의 문자열 전체를 계약으로 저장하지 않고 index-used boolean을 학습 증거로 삼습니다.",
    ],
    concepts: [
      c("sargable predicate", "index key에 search argument를 직접 적용해 lookup/range 후보가 될 수 있는 조건입니다.", ["column을 불필요한 CASE로 감싸지 않습니다.", "type·collation을 맞춥니다."]),
      c("classification projection", "eligible row를 category value로 변환하는 SELECT expression입니다.", ["WHERE selection과 분리합니다.", "group/order에서 같은 rule을 사용합니다."]),
      c("expression index", "deterministic CASE/function result를 index key로 저장하는 최적화입니다.", ["rule version과 write cost가 있습니다.", "dialect portability를 검증합니다."]),
    ],
    diagnostics: [d("status filter가 단순 equality인데 CASE로 감싼 뒤 full scan으로 바뀝니다.", "indexed column이 expression 안에 들어가 optimizer가 직접 lookup term으로 인식하지 못했습니다.", ["direct vs CASE EXPLAIN", "index key/type/collation", "rows examined", "generated/expression index 필요성"], "WHERE는 status=? 같은 canonical predicate로 유지하고 CASE는 projection/order/report에 두며 반복 검색이면 governed generated/index를 측정합니다.", "동일 result ids와 index access boolean을 performance regression test에 둡니다.")],
    expertNotes: ["CASE로 모든 optional 조건을 한 SQL에 우겨 넣는 것이 plan 안정성을 보장하지 않습니다.", "분류 label을 filter parameter로 받을 때는 label→canonical predicate mapping을 allow-list합니다."],
  },
  {
    id: "conditional-aggregation-count-sum-rate",
    title: "SUM·COUNT와 CASE로 조건부 count·sum·rate를 분모까지 검증합니다",
    lead: "한 group에서 여러 category 지표를 계산할 때 CASE는 유용하지만 ELSE·NULL·중복 join과 분모가 틀리면 숫자는 실행돼도 의미가 틀립니다.",
    explanations: [
      "조건부 count는 SUM(CASE WHEN condition THEN 1 ELSE 0 END) 또는 COUNT(CASE WHEN condition THEN 1 END)로 표현할 수 있습니다. ELSE 0을 COUNT에 넣으면 모든 row가 non-null이라 전체를 세는 실수를 만듭니다.",
      "조건부 sum은 SUM(CASE WHEN condition THEN amount ELSE 0 END)처럼 쓸 수 있지만 amount NULL, currency/unit와 numeric type을 정의합니다. ELSE 0이 적절하지 않으면 NULL/unknown metric을 별도 count합니다.",
      "rate 분모가 전체 rows, eligible non-null rows, distinct entities 중 무엇인지 명시합니다. integer division, zero denominator와 rounding 위치를 target engine에서 검증합니다.",
      "join fan-out이 생기면 CASE count/sum도 함께 증식합니다. metric grain의 canonical relation을 먼저 만들고 child 존재는 EXISTS 또는 pre-aggregation으로 처리합니다.",
      "한 query에 수십 conditional metrics를 넣으면 scan은 한 번이어도 CPU, maintenance와 category overlap 위험이 커집니다. metric contract·owner·version과 reconciliation을 자동 생성/검토합니다.",
    ],
    concepts: [
      c("conditional aggregate", "aggregate argument를 CASE로 선택해 group 안 특정 조건의 count·sum을 계산하는 패턴입니다.", ["ELSE/NULL이 함수별로 다릅니다.", "grain을 먼저 고정합니다."]),
      c("metric denominator", "비율을 나눌 population의 row/entity/non-null 단위입니다.", ["분자와 같은 eligibility를 사용합니다.", "zero 정책을 둡니다."]),
      c("metric reconciliation", "source population이 category counts·unknown·excluded 합과 일치하는지 검증하는 과정입니다.", ["중복 join을 검출합니다.", "version별 저장합니다."]),
    ],
    codeExamples: [py("sql15-conditional-aggregate", "팀별 조건부 count·sum·rate", "sql15_conditional_report.py", "두 group에서 paid count/sum과 전체 분모 rate를 같은 grain으로 계산하고 category counts가 total과 일치하는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE activity(id INTEGER PRIMARY KEY, team TEXT NOT NULL, state TEXT NOT NULL, amount INTEGER NOT NULL)")
db.executemany("INSERT INTO activity VALUES (?, ?, ?, ?)", [
    (1, "A", "paid", 100), (2, "A", "paid", 50), (3, "A", "pending", 20),
    (4, "B", "paid", 70), (5, "B", "refund", 30), (6, "B", "pending", 10)
])
rows = db.execute("""
 SELECT team, count(*) AS total,
        sum(CASE WHEN state='paid' THEN 1 ELSE 0 END) AS paid_count,
        sum(CASE WHEN state='paid' THEN amount ELSE 0 END) AS paid_sum,
        sum(CASE WHEN state='pending' THEN 1 ELSE 0 END) AS pending_count,
        sum(CASE WHEN state='refund' THEN 1 ELSE 0 END) AS refund_count
 FROM activity GROUP BY team ORDER BY team
""").fetchall()
for team, total, paid_count, paid_sum, pending_count, refund_count in rows:
    rate = paid_count / total
    reconciled = total == paid_count + pending_count + refund_count
    print(f"{team}:total={total},paid={paid_count},sum={paid_sum},rate={rate:.2f},reconciled={str(reconciled).lower()}")
print("groups=" + str(len(rows)))`, "A:total=3,paid=2,sum=150,rate=0.67,reconciled=true\nB:total=3,paid=1,sum=70,rate=0.33,reconciled=true\ngroups=2", ["local-0130", "local-0203", "mysql-case", "mysql-aggregate", "mysql-groupby", "oracle-case", "oracle-select", "sqlite-case", "sqlite-aggregate"])],
    diagnostics: [d("COUNT(CASE ... ELSE 0 END)가 조건과 무관하게 전체 행 수를 반환합니다.", "COUNT는 0도 non-null 값으로 세므로 ELSE 0이 모든 row를 count 대상으로 만들었습니다.", ["COUNT argument values", "ELSE NULL/생략", "SUM(CASE 1/0) 비교", "source/category reconciliation"], "COUNT에는 non-match가 NULL이 되게 하고, 또는 SUM(CASE WHEN ... THEN 1 ELSE 0 END)를 사용해 의도를 명확히 합니다.", "match/nonmatch/NULL/empty group fixture에서 두 공식과 expected count를 비교합니다.")],
    expertNotes: ["조건부 aggregate 숫자만 저장하지 말고 population·grain·denominator·rule version을 함께 보존합니다.", "category overlap이 가능하면 합이 total보다 클 수 있으므로 exclusive/multi-label metric을 구분합니다."],
  },
  {
    id: "report-grain-grouping-and-reuse",
    title: "CASE category와 GROUP BY의 report grain·재사용 경계를 고정합니다",
    lead: "row label을 붙이는 것과 category별 한 행으로 집계하는 것은 다른 grain이며, select·group·order에서 CASE가 조금이라도 달라지면 label과 숫자가 어긋납니다.",
    explanations: [
      "SELECT CASE만 쓰면 source row 수가 유지됩니다. GROUP BY CASE를 추가하면 category grain으로 축약되므로 detail columns를 함께 선택할 수 있는지 functional dependency와 SQL mode를 확인합니다.",
      "MySQL ONLY_FULL_GROUP_BY와 Oracle grouping 규칙을 만족하도록 모든 nonaggregate expressions를 group definition과 맞춥니다. alias를 GROUP BY에서 허용하는 범위도 dialect별 다릅니다.",
      "동일 CASE를 select/group/order에 복사하면 drift가 쉽습니다. CTE/derived table에서 category code를 한 번 계산하거나 governed view를 사용하되 materialization/merge와 predicate pushdown plan을 확인합니다.",
      "분류 dimension이 시간에 따라 바뀌면 report as-of rule version을 보존합니다. 현재 CASE로 과거 데이터를 다시 계산한 값과 당시 published category를 구분합니다.",
      "category별 count 합, amount 합과 unknown/excluded를 canonical source total과 reconciliation합니다. late/corrected rows에는 watermark·restatement·atomic publish가 필요합니다.",
    ],
    concepts: [
      c("report grain", "최종 결과 한 행이 나타내는 category·time·tenant 등 차원 조합입니다.", ["row label과 aggregate row를 구분합니다.", "metric denominator와 맞춥니다."]),
      c("classification reuse boundary", "CASE를 한 번 계산해 여러 projection/group/order consumer가 같은 category code를 사용하는 query layer입니다.", ["drift를 줄입니다.", "optimizer merge/materialization을 측정합니다."]),
      c("as-of rule version", "과거 report를 어떤 분류 규칙으로 계산했는지 나타내는 버전입니다.", ["current recomputation과 구분합니다.", "restatement policy를 둡니다."]),
    ],
    diagnostics: [d("화면 category label과 GROUP BY 숫자가 서로 맞지 않습니다.", "SELECT와 GROUP BY에 복사한 CASE의 경계·ELSE·type이 달라졌거나 detail join이 grain을 증식했습니다.", ["normalized CASE expressions", "group keys", "outer key duplicates", "source/category totals"], "category code를 canonical relation에서 한 번 계산하고 원하는 grain으로 집계하며 key multiset과 totals를 reconciliation합니다.", "CASE definition hash/version과 category sum invariants를 report test에 둡니다.")],
    expertNotes: ["보기 좋은 localized label이 아니라 stable category code로 group/order하고 label은 presentation에서 매핑합니다.", "CTE/view reuse가 correctness를 돕더라도 plan과 predicate pushdown을 별도로 확인합니다."],
  },
  {
    id: "custom-order-and-portability",
    title: "ORDER BY CASE로 business rank를 만들되 total order와 dialect 이식성을 지킵니다",
    lead: "status를 알파벳이 아닌 업무 우선순위로 정렬할 수 있지만 unknown·NULL·동률과 pagination을 위한 immutable tie-breaker까지 정의해야 합니다.",
    explanations: [
      "ORDER BY CASE status WHEN 'urgent' THEN 1 ... ELSE 99 END는 category rank를 값으로 만듭니다. rank 숫자 자체를 API 의미로 노출하지 않고 stable status code와 mapping version을 관리합니다.",
      "같은 rank 안에서는 created_at, immutable id 등 total order를 추가합니다. CASE rank만으로 paging하면 tie rows가 page 사이에서 중복·누락될 수 있습니다.",
      "NULL/unknown status를 first, last 또는 quarantine 중 어디에 둘지 ELSE/NULL rank로 명시합니다. engine 기본 NULL ordering에 의존하지 않습니다.",
      "CASE sort는 plain status index를 그대로 쓰지 못하고 filesort/temp가 생길 수 있습니다. 작은 결과는 허용될 수 있지만 큰 queue는 generated rank column+index 또는 dimension join을 비교합니다.",
      "Oracle·MySQL·SQLite의 alias, type, collation과 expression index/generated column syntax를 compatibility matrix로 검증합니다. 동일 ordered ids가 핵심 증거입니다.",
    ],
    concepts: [
      c("business sort rank", "category code를 업무 우선순위 숫자로 변환한 CASE result입니다.", ["unknown/NULL rank를 포함합니다.", "mapping version을 둡니다."]),
      c("total report order", "CASE rank 뒤에 immutable unique tie-breaker를 더해 모든 rows의 순서를 결정하는 tuple입니다.", ["pagination에 필요합니다.", "collation/timezone을 고정합니다."]),
      c("sort cost", "expression 계산과 index 비호환 때문에 발생하는 rows sorted, temp/spill와 latency 비용입니다.", ["filtered cardinality에서 측정합니다.", "generated rank 대안을 비교합니다."]),
    ],
    diagnostics: [d("CASE 우선순위 목록이 page마다 흔들리거나 큰 queue에서 sort가 느립니다.", "rank 동률 tie-breaker가 없고 expression sort를 지원하는 index/filtered cardinality budget을 검증하지 않았습니다.", ["ORDER BY tuple uniqueness", "unknown/null rank", "EXPLAIN sort/temp", "rows sorted와 generated-index 후보"], "immutable id를 final tie-breaker로 추가하고 큰 workload는 versioned generated rank/dimension과 composite index를 비교합니다.", "tie-heavy ordered-id pagination과 sort spill/latency regression test를 둡니다.")],
    expertNotes: ["CASE rank 변경은 사용자에게 보이는 queue 순서를 바꾸므로 feature/config version으로 배포합니다.", "rank가 자주 바뀌면 SQL literal보다 governed dimension table이 더 적합할 수 있습니다."],
  },
  {
    id: "security-plan-version-and-operations",
    title: "CASE 규칙을 parameter·권한·plan·version·privacy가 있는 운영 자산으로 배포합니다",
    lead: "동적 CASE 문자열, 권한 전 분류, 서로 다른 snapshot의 numerator/denominator와 raw label logging은 injection·누출·재현 불가 report를 만듭니다.",
    explanations: [
      "사용자 threshold·status value는 bind하지만 column/expression/order direction은 bind할 수 없으므로 allow-listed template을 사용합니다. CASE SQL fragment를 request string으로 직접 받지 않습니다.",
      "authorization과 tenant filter를 category 계산·conditional aggregate 전에 적용합니다. 먼저 전체를 분류한 뒤 label만 가리면 aggregate count나 rare category로 민감 정보를 추론할 수 있습니다.",
      "count·sum·rate를 여러 statement로 계산하면 mutation 중 서로 다른 snapshot을 볼 수 있습니다. 한 canonical query/snapshot, watermark 또는 versioned materialization으로 consistency를 정의합니다.",
      "release에는 rule id/version, input schema, category coverage/overlap, result type/collation, metric grain/denominator, plan/index, engine/driver matrix와 rollback을 포함합니다. SQL text만 versioning하지 않습니다.",
      "telemetry에는 rule version, source/eligible/category/unknown counts, overlap violations, result type, rows examined/sorted, temp/spill, snapshot/watermark와 latency를 두되 raw labels·threshold inputs·tenant ids·PII는 남기지 않습니다.",
    ],
    concepts: [
      c("rule contract", "CASE 조건·우선순위·category code·type·grain·owner가 호환되는 범위를 정의한 버전입니다.", ["SQL text 이상입니다.", "historical replay를 지원합니다."]),
      c("authorized classification", "tenant/principal policy를 통과한 canonical rows만 CASE와 aggregate에 입력되는 경계입니다.", ["rare-category leak를 줄입니다.", "cache key에 policy version을 둡니다."]),
      c("classification observability", "원시 row 값 없이 coverage·unknown·overlap·plan·resource·snapshot을 관측하는 지표입니다.", ["metric label cardinality를 제한합니다.", "rollback threshold를 둡니다."]),
    ],
    codeExamples: [py("sql15-sargable-case-plan", "bound filter와 CASE projection·plan 비교", "sql15_case_plan.py", "동일 status 결과를 direct bound predicate와 CASE-wrapped predicate로 조회해 결과 parity, index 사용과 injection-safe binding을 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA automatic_index=OFF")
db.execute("CREATE TABLE ticket(id INTEGER PRIMARY KEY, status TEXT NOT NULL, priority INTEGER NOT NULL)")
db.executemany("INSERT INTO ticket VALUES (?, ?, ?)", [(1, "open", 2), (2, "closed", 1), (3, "open", 1), (4, "hold", 3)])
db.execute("CREATE INDEX idx_ticket_status ON ticket(status)")
direct = "SELECT id FROM ticket WHERE status=? ORDER BY id"
wrapped = "SELECT id FROM ticket WHERE CASE WHEN status=? THEN 1 ELSE 0 END=1 ORDER BY id"
direct_ids = [r[0] for r in db.execute(direct, ("open",))]
wrapped_ids = [r[0] for r in db.execute(wrapped, ("open",))]
direct_plan = " ".join(r[3] for r in db.execute("EXPLAIN QUERY PLAN " + direct, ("open",))).upper()
wrapped_plan = " ".join(r[3] for r in db.execute("EXPLAIN QUERY PLAN " + wrapped, ("open",))).upper()
attack_ids = [r[0] for r in db.execute(direct, ("open' OR 1=1 --",))]
ordered = [r[0] for r in db.execute("SELECT id FROM ticket ORDER BY CASE status WHEN 'open' THEN 1 WHEN 'hold' THEN 2 ELSE 3 END, priority, id")]
print("direct=" + ",".join(map(str, direct_ids)))
print("same-result=" + str(direct_ids == wrapped_ids).lower())
print("direct-uses-index=" + str("IDX_TICKET_STATUS" in direct_plan).lower())
print("wrapped-scans=" + str("SCAN TICKET" in wrapped_plan).lower())
print("attack-count=" + str(len(attack_ids)))
print("business-order=" + ",".join(map(str, ordered)))`, "direct=1,3\nsame-result=true\ndirect-uses-index=true\nwrapped-scans=true\nattack-count=0\nbusiness-order=3,1,4,2", ["local-0202", "local-0203", "mysql-case", "mysql-explain", "mysql-select", "oracle-case", "oracle-select", "sqlite-case", "sqlite-eqp", "sqlite-queryplanner", "sqlite-isolation", "python-sqlite3"])],
    diagnostics: [d("사용자 정의 CASE report가 injection되거나 권한 없는 category count를 노출합니다.", "CASE expression/identifier를 문자열로 조립했고 authorization보다 먼저 전체 population을 분류·집계했습니다.", ["query template allow-list", "bound values", "canonical authorized input", "cache key·rare category output"], "고정/allow-listed rule templates와 typed binding을 사용하고 tenant/principal filter 후 분류하며 small cohort suppression과 scoped cache를 적용합니다.", "injection·cross-tenant·rare-category·stale-snapshot negative tests를 release gate로 둡니다.")],
    expertNotes: ["CASE rule 변경은 data migration이 없어도 historical metric 의미와 sort 순서를 바꾸므로 semantic release입니다.", "운영 로그에는 category code별 aggregate count도 privacy risk가 될 수 있어 cohort와 label cardinality 정책을 적용합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-0130", repository: "dbstudy", path: "01_30.sql", usedFor: ["WHERE/HAVING thresholds, grouping, joins and top-result progression extended into classification"], evidence: "원본을 read-only로 확인했으며 sample customer/book/order literals는 복사하지 않았습니다." },
  { id: "local-0202", repository: "dbstudy", path: "02_02.sql", usedFor: ["join, NULL and subquery result conditions extended into CASE labels"], evidence: "원본을 read-only로 확인했고 인명·출판사·가격 등 sample literals는 복사하지 않았습니다." },
  { id: "local-0203", repository: "dbstudy", path: "02_03.sql", usedFor: ["aggregate, paging and view result progression extended into conditional reports"], evidence: "원본을 read-only로 확인했고 sample search/name values는 복사하지 않았습니다." },
  { id: "mysql-case", repository: "MySQL 8.4 Reference Manual", path: "Flow Control Functions: CASE operator", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/flow-control-functions.html", usedFor: ["simple/searched CASE syntax and result type"], evidence: "MySQL 공식 CASE operator 문서입니다." },
  { id: "mysql-type", repository: "MySQL 8.4 Reference Manual", path: "Type Conversion in Expression Evaluation", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/type-conversion.html", usedFor: ["branch type and comparison coercion"], evidence: "MySQL 공식 type conversion 문서입니다." },
  { id: "mysql-aggregate", repository: "MySQL 8.4 Reference Manual", path: "Aggregate Function Descriptions", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html", usedFor: ["conditional COUNT/SUM NULL behavior"], evidence: "MySQL 공식 aggregate 문서입니다." },
  { id: "mysql-groupby", repository: "MySQL 8.4 Reference Manual", path: "MySQL Handling of GROUP BY", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html", usedFor: ["report grain and ONLY_FULL_GROUP_BY"], evidence: "MySQL 공식 GROUP BY 문서입니다." },
  { id: "mysql-explain", repository: "MySQL 8.4 Reference Manual", path: "EXPLAIN Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/explain.html", usedFor: ["CASE predicate and sort plan evidence"], evidence: "MySQL 공식 EXPLAIN 문서입니다." },
  { id: "mysql-select", repository: "MySQL 8.4 Reference Manual", path: "SELECT Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/select.html", usedFor: ["projection, grouping and ordering portability"], evidence: "MySQL 공식 SELECT 문서입니다." },
  { id: "oracle-case", repository: "Oracle Database 26ai SQL Language Reference", path: "CASE Expressions", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CASE-Expressions.html", usedFor: ["CASE syntax, short-circuit and type precedence"], evidence: "Oracle 공식 CASE expression 문서입니다." },
  { id: "oracle-type", repository: "Oracle Database 26ai SQL Language Reference", path: "Data Type Comparison Rules", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Data-Type-Comparison-Rules.html", usedFor: ["type and collation portability"], evidence: "Oracle 공식 datatype comparison 문서입니다." },
  { id: "oracle-select", repository: "Oracle Database 26ai SQL Language Reference", path: "SELECT", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/SELECT.html", usedFor: ["SELECT/GROUP/ORDER expression portability"], evidence: "Oracle 공식 SELECT 문서입니다." },
  { id: "sqlite-case", repository: "SQLite Documentation", path: "SQL Language Expressions: CASE", publicUrl: "https://www.sqlite.org/lang_expr.html#the_case_expression", usedFor: ["exact CASE laboratory and lazy evaluation"], evidence: "SQLite 공식 CASE expression anchor입니다." },
  { id: "sqlite-aggregate", repository: "SQLite Documentation", path: "Built-in Aggregate Functions", publicUrl: "https://www.sqlite.org/lang_aggfunc.html", usedFor: ["exact conditional aggregation laboratory"], evidence: "SQLite 공식 aggregate 문서입니다." },
  { id: "sqlite-select", repository: "SQLite Documentation", path: "SELECT", publicUrl: "https://www.sqlite.org/lang_select.html", usedFor: ["GROUP BY and ORDER BY laboratory"], evidence: "SQLite 공식 SELECT 문서입니다." },
  { id: "sqlite-eqp", repository: "SQLite Documentation", path: "EXPLAIN QUERY PLAN", publicUrl: "https://www.sqlite.org/eqp.html", usedFor: ["CASE-wrapped predicate plan laboratory"], evidence: "SQLite 공식 EQP 문서입니다." },
  { id: "sqlite-queryplanner", repository: "SQLite Documentation", path: "Query Planning", publicUrl: "https://www.sqlite.org/queryplanner.html", usedFor: ["sargability and expression sort boundaries"], evidence: "SQLite 공식 query planner 문서입니다." },
  { id: "sqlite-isolation", repository: "SQLite Documentation", path: "Isolation In SQLite", publicUrl: "https://www.sqlite.org/isolation.html", usedFor: ["multi-statement report snapshot boundary"], evidence: "SQLite 공식 isolation 문서입니다." },
  { id: "python-sqlite3", repository: "Python 3 Documentation", path: "sqlite3 DB-API and placeholders", publicUrl: "https://docs.python.org/3/library/sqlite3.html#how-to-use-placeholders-to-bind-values-in-sql-queries", usedFor: ["exact examples, runtime type readback and safe parameters"], evidence: "Python 공식 sqlite3 placeholder 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-15-case-conditional-report",
  slug: "sql-15-case-conditional-report",
  courseId: "database",
  moduleId: "db-joins-subqueries",
  order: 6,
  title: "CASE 조건식으로 조회 결과 분류하기",
  subtitle: "값 매핑을 first-match·경계·타입·조건부 집계·sargability·versioned reporting 계약으로 확장합니다.",
  level: "중급",
  estimatedMinutes: 900,
  coreQuestion: "CASE로 row와 aggregate를 분류하면서 경계 겹침·NULL·타입·grain·index·권한·snapshot이 모두 일관됨을 어떻게 증명할까요?",
  summary: "dbstudy 01_30.sql의 threshold/HAVING/group/join, 02_02.sql의 join/NULL/subquery, 02_03.sql의 aggregate/paging/view progression을 read-only로 감사했습니다. 원본에 CASE 문법은 직접 없으므로 이 세션은 해당 결과를 분류 report로 확장한 범위임을 명시합니다. simple/searched CASE, first-match와 overlap, ELSE/unknown total classification, result type/collation, short-circuit 안전 계산, projection과 sargability, conditional count/sum/rate, report grain/reuse/version, business ORDER BY와 total order, parameter·권한·snapshot·observability를 다룹니다. 다섯 exact Python/sqlite3 examples는 두 CASE 형태, 경계 shadow, branch type, conditional report와 plan/parameter를 실행합니다.",
  objectives: ["simple CASE와 searched CASE를 equality mapping과 조건 분류에 맞게 선택한다.", "first-match·overlap·gap·boundary와 ELSE/NULL을 결정표로 검증한다.", "모든 result branch의 type·precision·collation을 통일한다.", "short-circuit guard와 safe arithmetic의 dialect 경계를 설명한다.", "CASE projection과 WHERE sargability·expression index를 plan으로 비교한다.", "조건부 count·sum·rate의 grain·denominator·reconciliation을 증명한다.", "custom order·rule version·권한·snapshot·privacy telemetry를 운영한다."],
  prerequisites: [{ title: "집계·GROUP BY·HAVING", reason: "row grain, aggregate NULL과 denominator를 이해해야 CASE 분류와 conditional report를 정확히 설계할 수 있습니다.", sessionSlug: "sql-08-aggregate-group-having" }],
  keywords: ["CASE", "searched CASE", "simple CASE", "first match", "ELSE", "conditional aggregation", "SUM CASE", "COUNT CASE", "sargability", "business sort", "rule version", "report grain"],
  topics,
  lab: {
    title: "versioned 상태·위험도·성과 conditional report 구축하기",
    scenario: "합성 activity rows를 tenant 권한 후 상태·점수 구간으로 분류하고 category count, amount, rate와 업무 우선순위 queue를 발행합니다. NULL·새 code·overlap·join fan-out·동시 update가 있습니다.",
    setup: ["합성 tenant/activity/status/score/amount만 사용하고 0·boundary·NULL·unknown·duplicate join fixtures를 준비합니다.", "MySQL 8.4·Oracle 26ai isolated schema와 representative indexes/statistics를 준비합니다.", "rule id/version, categories, priority, result type, metric grain/denominator, snapshot/watermark와 owner를 문서화합니다.", "row별 expected category/rank와 group totals를 engine별 golden evidence로 고정합니다."],
    steps: ["세 원본 파일의 predicate/aggregate progression과 CASE 확장 mapping을 기록합니다.", "simple/searched CASE의 known/unknown/NULL 결과를 검증합니다.", "모든 threshold below/equal/above에서 overlap·gap·first-match를 확인합니다.", "각 branch SQL/driver type, precision·collation과 typed NULL을 readback합니다.", "zero/NULL denominator와 short-circuit/NULLIF safe arithmetic을 실행합니다.", "direct WHERE와 CASE-wrapped predicate의 ids·EXPLAIN actual을 비교합니다.", "조건부 count/sum/rate를 canonical grain과 denominator로 reconciliation합니다.", "CASE category select/group/order 정의와 unknown/late rows를 version/watermark별 검증합니다.", "business rank+unique tie-breaker, sort/temp/index와 pagination ids를 측정합니다.", "authorization 후 report, bound rule values, redacted telemetry, atomic publish와 rollback을 E2E 검증합니다."],
    expectedResult: ["모든 eligible row가 승인 category/unknown policy에 따라 재현 가능하게 분류됩니다.", "다섯 exact examples의 stdout이 완전히 일치합니다.", "conditional metrics와 category totals가 canonical source grain/denominator와 reconciliation됩니다.", "target engines에서 type·plan·sort·snapshot·driver matrix와 resource budget을 만족합니다.", "raw tenant/input/labels 없이 rule version·coverage·unknown·plan·watermark로 운영할 수 있습니다."],
    cleanup: ["isolated schema·합성 rows·indexes·staged reports/cache를 run id로 제거합니다.", "test credentials와 exports를 폐기합니다.", "logs에 raw row labels·thresholds·tenant identifiers가 없는지 확인합니다.", "dbstudy 원본과 production data는 변경하지 않습니다."],
    extensions: ["effective-dated dimension table과 CASE literal mapping을 비교합니다.", "generated category/rank column과 expression index의 migration 비용을 측정합니다.", "window functions와 CASE로 cohort·running conditional metrics를 확장합니다.", "minimum cohort·suppression을 conditional report privacy policy에 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 row category·boundary·type·aggregate·plan 증거를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "simple/searched CASE 역할을 구분합니다.", "20 경계의 shadow branch를 설명합니다.", "mixed/cast runtime type을 비교합니다.", "conditional count/sum/rate를 검산합니다.", "direct/CASE predicate plan과 business order를 확인합니다."], hints: ["label보다 matched branch, source row identity와 result type을 먼저 기록하세요."], expectedOutcome: "CASE를 표시 편의가 아니라 검증 가능한 분류·report 계약으로 설명합니다.", solutionOutline: ["domain→branches→boundaries→types→grain→plan→version 순서입니다."] },
    { difficulty: "응용", prompt: "세 원본 SQL 흐름을 multi-tenant conditional analytics report로 확장하세요.", requirements: ["원본에는 CASE가 없다는 provenance를 명시합니다.", "rule version과 category decision table을 작성합니다.", "NULL/unknown/overlap/gap을 처리합니다.", "branch type/collation을 통일합니다.", "canonical grain에서 conditional metrics를 계산합니다.", "sargable filter와 business rank plan을 측정합니다.", "authorization/snapshot/watermark를 적용합니다.", "MySQL·Oracle matrix·telemetry·atomic publish·rollback을 포함합니다."], hints: ["CASE를 복사하기 전에 category code를 한 번 계산할 canonical relation을 만드세요."], expectedOutcome: "정확성·성능·보안·재현성이 있는 conditional report가 완성됩니다.", solutionOutline: ["source audit→rule contract→classification→reconciliation→plans→conformance→publish 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 SQL CASE·conditional reporting 표준을 작성하세요.", requirements: ["simple/searched 선택과 first-match 규칙을 둡니다.", "boundary/overlap/gap/ELSE/NULL schema를 정의합니다.", "result type/precision/collation 규칙을 둡니다.", "safe arithmetic/side-effect 금지를 포함합니다.", "projection/filter/sargability/index 기준을 둡니다.", "metric grain/denominator/reconciliation을 요구합니다.", "rank/total-order와 dialect matrix를 정의합니다.", "rule version·권한·snapshot·privacy observability·rollback을 포함합니다."], hints: ["CASE 수정은 SQL 포맷팅이 아니라 metric semantics와 사용자 순서를 바꾸는 release입니다."], expectedOutcome: "학습 분류부터 운영 analytics까지 일관된 CASE governance가 완성됩니다.", solutionOutline: ["define→cover→type→aggregate→measure→authorize→version→publish→observe 순서입니다."] },
  ],
  nextSessions: ["sql-16-pagination-count-query"],
  sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["01_30.sql의 threshold WHERE/HAVING·group/join, 02_02.sql의 join/NULL/subquery, 02_03.sql의 aggregate/paging/view progression을 read-only로 확인했습니다.", "세 원본에는 CASE expression 예제가 직접 없으므로 공개 세션은 해당 query 결과를 분류·조건부 report로 확장한 전문가 보강 범위임을 명시했습니다.", "원본 인명·도서명·출판사·검색어·금액 등 sample literals와 PII 가능 값은 복사하지 않고 합성 fixture만 사용했습니다.", "SQLite exact examples는 MySQL 8.4·Oracle 26ai의 CASE type/collation, short-circuit 세부, generated index·optimizer와 isolation 동작을 대체하지 않습니다."] },
});

export default session;
