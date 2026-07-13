import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id,
    title,
    language: "python",
    filename,
    purpose,
    code,
    walkthrough: [
      { lines: "1-6", explanation: "격리된 sqlite3 메모리 DB 또는 고정 숫자 집합을 준비해 외부 데이터·자격 증명·네트워크 없이 집계 의미를 재현합니다." },
      { lines: "7-끝에서 5줄 전", explanation: "입력 순서·NULL·중복 키·모집단/표본 정의·부동소수점 계산 경로를 명시적으로 분리합니다." },
      { lines: "마지막 5줄", explanation: "정렬된 label과 고정 소수 자릿수만 출력합니다. MySQL·Oracle의 JSON 타입, 길이 한도와 통계 구현은 각 엔진에서 별도 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3·json·statistics", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "SQLite 실행은 SQL 의미를 작게 검증하는 장치이며 MySQL 8.4·Oracle 26ai의 타입·정렬·길이·계획을 대체하지 않습니다."] },
    experiments: [
      { change: "입력 행의 삽입 순서를 뒤집고 NULL·duplicate key·큰 숫자를 추가합니다.", prediction: "명시적 ORDER BY와 사전 검증이 없으면 직렬화 결과나 통계가 달라집니다.", result: "결과 문자열만 snapshot하지 말고 ordered input keys와 집계 정책을 함께 검증합니다." },
      { change: "모집단/표본 정의 또는 출력 byte budget을 바꿉니다.", prediction: "같은 원시 값에서도 분산·표준편차 또는 payload acceptance가 바뀝니다.", result: "함수 이름이 아니라 metric definition과 transport contract를 버전으로 관리합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "aggregate-output-shape-order-contract",
    title: "행 집계를 text·JSON·통계 scalar라는 출력 형태 계약으로 구분합니다",
    lead: "여러 행을 하나의 값으로 축약해도 문자열, JSON array/object와 숫자 통계는 소비자 계약·순서·NULL·크기 실패 방식이 서로 다릅니다.",
    explanations: [
      "원본 02_03.sql은 GROUP_CONCAT separator, JSON_ARRAYAGG, JSON_OBJECTAGG, STDDEV_POP과 VAR_POP을 한 흐름에서 소개합니다. 공개 세션은 그 문법 progression만 보존하고 book 이름·가격 같은 원본 sample literals는 복사하지 않습니다.",
      "aggregate output shape에는 SQL result column type, JSON schema 또는 delimiter grammar, element/key ordering, duplicate/NULL policy, character set·collation, maximum bytes와 empty-input representation을 포함해야 합니다. 문자열 한 칸이 곧 안정적인 API라는 뜻은 아닙니다.",
      "SQL table은 ORDER BY가 없으면 순서 계약이 없습니다. aggregate 내부 ordering을 지원하는 엔진에서는 그 절을 쓰고, 그렇지 않다면 ordered subquery의 보장 범위를 공식 문서로 확인합니다. 최종 SELECT의 ORDER BY와 aggregate elements의 ORDER BY는 별개입니다.",
      "empty input에서 text/JSON aggregate가 NULL, 빈 배열, 빈 객체 중 무엇을 내는지 엔진과 함수별로 확인합니다. API가 []를 원한다면 SQL COALESCE만 적용하기 전에 JSON type이 보존되는지 driver까지 readback합니다.",
      "직렬화 집계는 관계형 detail을 transport payload로 바꾸므로 filtering·authorization이 집계 전에 적용됐음을 증명해야 합니다. tenant 또는 row-level policy가 빠지면 한 값 안에 여러 사용자의 데이터가 섞여 누출됩니다.",
    ],
    concepts: [
      c("output shape", "집계 결과의 SQL 타입과 소비자가 해석할 구조를 함께 정의한 계약입니다.", ["text grammar와 JSON schema를 구분합니다.", "empty/NULL/ordering/size semantics를 포함합니다."], "눈에 같은 문자열이어도 JSON 타입과 plain text는 드라이버에서 다를 수 있습니다."),
      c("element order", "array나 연결 문자열 내부 원소의 순서를 정하는 규칙입니다.", ["최종 row order와 독립입니다.", "tie-breaker까지 total order로 정의합니다."]),
      c("aggregation boundary", "authorization과 filtering을 마친 행을 직렬화 또는 통계 값으로 축약하는 경계입니다.", ["입력 key 목록을 감사할 수 있어야 합니다.", "결과 한 칸이 여러 민감 행을 포함할 수 있습니다."]),
    ],
    codeExamples: [py("sql09-ordered-string-aggregate", "정렬·NULL 정책이 있는 문자열 집계", "sql09_ordered_string.py", "GROUP_CONCAT류 결과가 삽입 순서가 아니라 명시한 total order를 따르고 NULL 값은 생략된다는 작은 증거를 만듭니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE item(team TEXT, position INTEGER, label TEXT)")
db.executemany("INSERT INTO item VALUES (?, ?, ?)", [
    ("A", 2, "beta"), ("A", 1, "alpha"), ("A", 3, None), ("B", 1, "gamma")
])
rows = db.execute("""
    SELECT team, group_concat(label, '|')
    FROM (SELECT team, position, label FROM item ORDER BY team, position)
    GROUP BY team ORDER BY team
""").fetchall()
null_count = db.execute("SELECT count(*) - count(label) FROM item").fetchone()[0]
for team, labels in rows:
    print(f"{team}={labels}")
print(f"null-values={null_count}")
print("null-values-omitted=" + str(all("None" not in labels for _, labels in rows)).lower())
print("separator=|")`, "A=alpha|beta\nB=gamma\nnull-values=1\nnull-values-omitted=true\nseparator=|", ["local-0203", "mysql-aggregate", "sqlite-aggregate"]),
    ],
    diagnostics: [
      d("같은 데이터인데 연결 문자열이나 JSON 배열 순서가 실행마다 바뀝니다.", "aggregate input에 total order가 없거나 동률 tie-breaker가 빠졌습니다.", ["함수 내부 ORDER BY 지원 문법", "ordered subquery와 optimizer rewrite", "정렬 key의 uniqueness", "collation·NULL ordering"], "business key와 immutable unique key를 포함한 total order를 함수가 보장하는 위치에 둡니다.", "입력 삽입 순서를 섞는 property test와 repeated-plan test를 둡니다."),
      d("다른 tenant의 항목이 한 JSON payload에 섞였습니다.", "tenant/authorization predicate보다 집계가 먼저 수행됐거나 view 경계에서 filter가 사라졌습니다.", ["input row keys와 tenant ids", "view/CTE predicate pushdown", "RLS session context", "cached aggregate key"], "권한이 적용된 canonical relation을 먼저 만들고 그 결과만 집계하며 cache key에 tenant와 policy version을 포함합니다.", "cross-tenant sentinel fixtures와 aggregate input lineage 감사를 배포 gate로 둡니다."),
    ],
    comparisons: [{ title: "집계 출력 형태 선택", options: [
      { name: "rows", chooseWhen: "consumer가 filtering·paging·streaming을 계속 수행할 때", avoidWhen: "단일 compact snapshot이 계약일 때", tradeoffs: ["관계 의미 보존", "round trip 증가 가능"] },
      { name: "text", chooseWhen: "사람 표시용이고 값 escape grammar가 단순할 때", avoidWhen: "값에 delimiter·newline이 포함되거나 typed round-trip이 필요할 때", tradeoffs: ["간단함", "파싱 취약성과 길이 한도"] },
      { name: "JSON", chooseWhen: "typed nested transport와 schema validation이 필요할 때", avoidWhen: "거대한 결과를 한 셀에 모아야 할 때", tradeoffs: ["구조 보존", "메모리·payload·duplicate policy 부담"] },
    ] }],
    expertNotes: ["결과 한 칸의 값만 저장하지 말고 report version·input population hash·order rule·byte size를 함께 기록합니다.", "정렬 collation과 JSON scalar typing은 DB→driver→serializer의 세 경계를 모두 확인합니다."],
  },
  {
    id: "group-concat-listagg-semantics",
    title: "GROUP_CONCAT·LISTAGG의 delimiter·DISTINCT·NULL·length semantics를 설계합니다",
    lead: "문자열 집계는 편리하지만 delimiter 충돌과 잘림, 문자 byte 수, 정렬·중복 정책을 숨기면 손실 있는 직렬화가 됩니다.",
    explanations: [
      "separator는 display 장식이 아니라 grammar입니다. 값 자체에 separator, quote, backslash, newline이 들어올 수 있다면 escaping/length-prefix/JSON 같은 구조화 형식을 쓰거나 목록을 rows로 유지합니다.",
      "GROUP_CONCAT류 함수는 일반적으로 NULL expression을 생략합니다. missing item을 빈 문자열로 바꾸면 missing과 empty가 합쳐지고 delimiter 개수만으로 원래 행 수를 복구할 수 없습니다. total rows, non-null values와 missing count를 별도 metric으로 둡니다.",
      "DISTINCT는 중복을 임의로 없애는 수리 도구가 아닙니다. entity identity, normalized representation, case/accent collation을 정의한 뒤 business semantics가 set일 때만 사용합니다. join fan-out을 DISTINCT로 숨기면 서로 다른 동일 값까지 잃을 수 있습니다.",
      "MySQL group_concat_max_len, Oracle LISTAGG overflow policy처럼 엔진마다 길이 제한과 실패/잘림 선택이 다릅니다. character count가 아니라 실제 connection encoding의 bytes, delimiter와 ellipsis/count 표시까지 budget에 포함합니다.",
      "UI label 목록, audit export와 machine round-trip은 같은 query를 공유하지 않는 편이 안전합니다. 표시용은 제한·요약을 명시하고, export는 paging/streaming과 typed schema를 사용합니다.",
    ],
    concepts: [
      c("delimiter grammar", "여러 값의 경계를 문자열 안에서 표현하는 규칙입니다.", ["escape·quote·NULL 표현을 포함합니다.", "임의 사용자 값에는 단순 split이 안전하지 않습니다."]),
      c("overflow policy", "집계 결과가 허용 길이를 넘을 때 error, truncate, truncate-with-count 또는 alternate transport를 선택하는 규칙입니다.", ["silent truncation은 금지합니다.", "byte budget을 사전 측정합니다."]),
      c("semantic DISTINCT", "join 결함 은폐가 아니라 domain이 실제 set임을 근거로 중복을 제거하는 결정입니다.", ["collation을 명시합니다.", "원본 cardinality를 관측합니다."]),
    ],
    diagnostics: [
      d("목록 끝 값이 조용히 사라지거나 잘린 것처럼 보입니다.", "session/server 집계 길이 한도 또는 downstream column/driver/UI byte limit을 초과했습니다.", ["source row/non-null counts", "result character·byte length", "group_concat_max_len/LISTAGG overflow 설정", "driver buffer와 API response limit"], "overflow를 error 또는 explicit truncated-with-count로 만들고 큰 목록은 rows/pagination/stream으로 전환합니다.", "경계 byte fixtures와 source-count 대 emitted-count reconciliation을 자동화합니다."),
      d("DISTINCT를 넣자 합계 오류는 사라졌지만 합법적인 동일 label도 없어졌습니다.", "join fan-out과 domain duplicate를 구분하지 않고 값 기준 deduplication을 적용했습니다.", ["entity primary keys", "join cardinality", "동일 값의 서로 다른 entity", "collation normalization"], "join grain을 먼저 고치고 필요한 경우 entity id로 deduplicate한 뒤 label을 직렬화합니다.", "DISTINCT 사용에는 identity·collation·lost-row counterexample 리뷰를 요구합니다."),
    ],
    expertNotes: ["GROUP_CONCAT 결과를 다시 split해 canonical data로 쓰지 않습니다. 원본 rows 또는 typed JSON을 canonical representation으로 유지합니다.", "overflow 정책은 query, driver, HTTP gateway와 browser rendering budget을 하나의 end-to-end 표로 검증합니다."],
  },
  {
    id: "json-array-aggregate-contract",
    title: "JSON_ARRAYAGG를 typed ordered collection 계약으로 만듭니다",
    lead: "JSON 배열은 delimiter 문제를 줄이지만 SQL NULL과 JSON null, 숫자·문자 타입, element ordering과 중첩 크기를 스스로 정의해 주지 않습니다.",
    explanations: [
      "JSON_ARRAYAGG scalar expression과 JSON_OBJECT로 만든 element는 output schema가 다릅니다. consumer가 위치 기반 scalar array인지 versioned object array인지 구분하도록 schema id와 element required/optional fields를 문서화합니다.",
      "SQL NULL이 JSON null element로 포함되는지, 생략되는지, aggregate 전체가 NULL인지 엔진 버전별로 확인합니다. missing field, explicit JSON null, empty string과 zero가 API에서 서로 다른 의미라면 JSON constructor 단계에서 보존합니다.",
      "ORDER BY가 없는 JSON array는 set-like result로만 취급해야 합니다. rank, event time, immutable id를 total order로 쓰고 page boundaries와 concurrent insert 시 snapshot consistency까지 고려합니다.",
      "DB native JSON type이 driver에서 string, bytes, vendor object 중 무엇으로 전달되는지 readback합니다. 중간 serializer가 JSON string을 다시 quote해 double encoding하지 않는지 Content-Type과 parsed value type을 검사합니다.",
      "한 group의 모든 detail을 array 한 셀에 담으면 DB memory/temp, network, application parser와 browser DOM이 동시에 압박받습니다. maximum elements/bytes/depth를 정하고 continuation 또는 child endpoint를 제공합니다.",
    ],
    concepts: [
      c("typed JSON aggregate", "관계 행을 JSON scalar/object element의 배열로 바꾸되 각 타입과 schema를 보존하는 집계입니다.", ["JSON text 유효성만으로 schema가 검증되지는 않습니다.", "number/string/null 차이를 readback합니다."]),
      c("JSON null boundary", "SQL NULL, JSON literal null과 missing property를 구분하는 경계입니다.", ["constructor와 aggregate 양쪽 정책을 확인합니다.", "consumer defaulting이 의미를 합치지 않아야 합니다."]),
      c("payload budget", "element count·encoded bytes·nesting depth·parse/render 시간을 제한하는 계약입니다.", ["DB 한도만으로 충분하지 않습니다.", "continuation 경로를 준비합니다."]),
    ],
    codeExamples: [py("sql09-json-array-shape", "순서·타입·JSON null을 검증하는 배열 집계", "sql09_json_array.py", "ordered rows를 JSON object array로 집계하고 JSON 파서로 element type과 null을 readback합니다.", String.raw`import json
import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE event(seq INTEGER, kind TEXT, amount INTEGER)")
db.executemany("INSERT INTO event VALUES (?, ?, ?)", [(2, "fail", None), (1, "ok", 10)])
payload = db.execute("""
    SELECT json_group_array(json_object('seq', seq, 'kind', kind, 'amount', amount))
    FROM (SELECT seq, kind, amount FROM event ORDER BY seq)
""").fetchone()[0]
items = json.loads(payload)
print("payload=" + payload)
print("valid=" + str(isinstance(items, list)).lower())
print(f"items={len(items)}")
print("typed-null=" + str(items[1]["amount"] is None).lower())
print("ordered=" + str([item["seq"] for item in items] == [1, 2]).lower())`, "payload=[{\"seq\":1,\"kind\":\"ok\",\"amount\":10},{\"seq\":2,\"kind\":\"fail\",\"amount\":null}]\nvalid=true\nitems=2\ntyped-null=true\nordered=true", ["mysql-aggregate", "oracle-json-arrayagg", "sqlite-json1"]),
    ],
    diagnostics: [
      d("API의 JSON 배열이 문자열 안에 다시 quote되어 옵니다.", "DB JSON value를 application serializer가 plain string으로 보고 이중 인코딩했습니다.", ["driver 반환 runtime type", "한 번 parse한 value shape", "serializer 설정", "HTTP Content-Type와 raw body"], "driver JSON codec 또는 명시적 single parse 후 typed object로 직렬화하고 raw string concatenation을 제거합니다.", "contract test에서 raw body와 parsed type을 모두 검사합니다."),
      d("큰 group에서 DB나 애플리케이션 메모리가 급증합니다.", "unbounded detail을 하나의 JSON array로 materialize해 여러 계층에서 복사합니다.", ["max group cardinality", "encoded bytes/depth", "DB temp/spill", "driver/app heap와 parse latency"], "summary와 paged detail을 분리하고 maximum element/byte budget과 continuation을 적용합니다.", "skewed largest-group load test와 resource budget alert를 둡니다."),
    ],
    expertNotes: ["JSON validity, schema validity, authorization, order, size를 서로 다른 assertion으로 유지합니다.", "array aggregate를 사용해도 row-level cursor와 snapshot/watermark를 응답 metadata에 포함할 수 있습니다."],
  },
  {
    id: "json-object-duplicate-key-policy",
    title: "JSON_OBJECTAGG의 key identity·NULL·duplicate 정책을 집계 전에 검증합니다",
    lead: "JSON object key는 유일해야 한다고 가정하기 쉽지만 SQL input에는 duplicate와 NULL이 있으며 parser마다 duplicate key 처리 결과가 달라질 수 있습니다.",
    explanations: [
      "object aggregate key는 display label이 아니라 stable unique identity여야 합니다. case folding, Unicode normalization, collation과 string conversion 후 충돌까지 고려하고 key domain을 schema로 제한합니다.",
      "duplicate key를 first-wins, last-wins, error 또는 array-of-values로 처리하는지는 엔진과 downstream JSON parser에 따라 다릅니다. input을 GROUP BY normalized_key HAVING COUNT(*)>1로 먼저 감사하고 정책 위반이면 payload를 발행하지 않습니다.",
      "NULL key는 JSON member name이 될 수 없으므로 error 또는 explicit quarantine이 일반적으로 안전합니다. NULL을 문자열 'null'로 바꾸면 실제 문자열 key와 충돌할 수 있습니다.",
      "object member order는 의미가 없어야 합니다. 화면 순서가 필요하면 [{key, value}] 배열을 ordered aggregate하고, object는 key lookup용 representation으로만 사용합니다.",
      "값이 object/array JSON인지 plain text인지 constructor 경계를 명시합니다. 이미 JSON인 text를 그대로 넣거나 반대로 raw text를 JSON fragment로 취급하면 injection 또는 double encoding이 생깁니다.",
    ],
    concepts: [
      c("key identity", "JSON object member를 유일하게 식별하는 normalized string 계약입니다.", ["DB collation과 JSON string equality 차이를 검토합니다.", "display label을 key로 쓰지 않습니다."]),
      c("duplicate-key policy", "동일 key가 둘 이상일 때 reject, merge-to-array 또는 명시적 winner를 선택하는 규칙입니다.", ["집계 전에 감지합니다.", "parser 기본 동작에 위임하지 않습니다."]),
      c("object versus pair array", "lookup용 unordered object와 순서·중복을 보존하는 key/value pair 배열의 모델 선택입니다.", ["중복이 의미 있으면 배열을 택합니다.", "object member order에 의존하지 않습니다."]),
    ],
    codeExamples: [py("sql09-json-object-duplicates", "duplicate JSON key를 발행 전에 탐지하기", "sql09_json_object.py", "object aggregate가 duplicate member를 만들 수 있고 일반 JSON parser가 마지막 값을 택하는 위험을 재현한 뒤 reject 정책을 출력합니다.", String.raw`import json
import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE config(k TEXT, v INTEGER, seq INTEGER)")
db.executemany("INSERT INTO config VALUES (?, ?, ?)", [("a", 1, 1), ("a", 2, 2), ("b", 3, 3)])
duplicate_rows = db.execute("SELECT k, count(*) FROM config GROUP BY k HAVING count(*) > 1").fetchall()
unsafe = db.execute("SELECT json_group_object(k, v) FROM (SELECT * FROM config ORDER BY seq)").fetchone()[0]
parsed = json.loads(unsafe)
print("duplicates=" + ";".join(f"{key}:{count}" for key, count in duplicate_rows))
print("unsafe-json=" + unsafe)
print(f"parsed-a={parsed['a']}")
print("safe=" + str(not duplicate_rows).lower())
print("policy=reject-before-object-aggregate")`, "duplicates=a:2\nunsafe-json={\"a\":1,\"a\":2,\"b\":3}\nparsed-a=2\nsafe=false\npolicy=reject-before-object-aggregate", ["mysql-aggregate", "oracle-json-objectagg", "sqlite-json1"]),
    ],
    diagnostics: [
      d("같은 JSON object payload를 parser에 따라 다르게 읽습니다.", "duplicate member names가 있고 parser가 first/last/error 정책을 다르게 적용합니다.", ["aggregate input duplicate counts", "normalized key/collation", "raw JSON member sequence", "각 consumer parser 동작"], "duplicate를 집계 전 reject하거나 값 배열로 모델링하고 unique constraint를 가능한 source schema에 둡니다.", "duplicate·case·Unicode normalization fixtures를 producer/consumer contract suite에 둡니다."),
      d("NULL key 또는 display label 변경 때문에 payload 생성이 실패하거나 consumer cache가 깨집니다.", "nullable/mutable label을 identity key로 사용했습니다.", ["key nullability", "stable primary/business id", "label change history", "string conversion collisions"], "non-null immutable id를 key로 쓰고 label은 value field에 둡니다.", "schema migration test와 key stability invariant를 둡니다."),
    ],
    expertNotes: ["JSON object aggregate는 uniqueness constraint를 대신하지 않습니다. source identity를 먼저 고정합니다.", "duplicate detection query와 payload query는 같은 transaction snapshot에서 수행하거나 하나의 query plan으로 결합합니다."],
  },
  {
    id: "population-sample-statistics",
    title: "평균·분산·표준편차의 모집단과 표본 정의·단위를 고정합니다",
    lead: "STDDEV와 VARIANCE라는 이름만으로 metric은 완성되지 않습니다. 관측 집합이 전체 모집단인지 표본인지와 결측·단위·weight를 먼저 정의합니다.",
    explanations: [
      "population variance는 편차 제곱합을 N으로, sample variance는 추정 목적으로 N-1로 나눕니다. 데이터가 같은데 STDDEV_POP과 STDDEV_SAMP가 다르게 나오는 것은 오류가 아니라 estimator definition 차이입니다.",
      "N=0과 sample N<2의 결과, NULL exclusion, NaN/Infinity 지원, decimal→binary floating conversion을 엔진별로 확인합니다. NULL을 zero로 대체하면 missing observation을 실제 0 관측으로 바꿉니다.",
      "variance 단위는 원래 단위의 제곱이고 standard deviation은 원래 단위입니다. 금액 표준편차를 다른 통화와 섞거나 시간(ms/s)을 섞으면 숫자는 계산돼도 의미가 없습니다.",
      "weighted observation, repeated rows와 join fan-out은 서로 다릅니다. 의도한 frequency/importance weight인지 join 때문에 복제된 row인지 source grain과 weight sum으로 구분합니다.",
      "통계 report는 count, missing count, mean, estimator, scale/unit와 rounding을 같이 내야 해석할 수 있습니다. 표준편차 하나만 표시하면 small-N과 population drift를 숨깁니다.",
    ],
    concepts: [
      c("population variance", "관측 집합 전체의 평균 제곱 편차로 분모가 N인 통계량입니다.", ["VAR_POP·STDDEV_POP에 대응합니다.", "metric population을 versioned predicate로 정의합니다."]),
      c("sample variance", "모집단 분산의 추정을 위해 일반적으로 N-1 보정을 쓰는 통계량입니다.", ["N<2를 명시합니다.", "표본 추출 설계를 함께 기록합니다."]),
      c("statistical unit", "관측 한 행이 나타내는 entity/event와 측정 단위입니다.", ["join 후 row가 unit을 바꾸지 않아야 합니다.", "통화·시간·scale을 metadata로 둡니다."]),
    ],
    codeExamples: [py("sql09-population-sample-statistics", "모집단·표본 분산과 표준편차 비교", "sql09_statistics.py", "고전적인 고정 데이터로 N/N-1 정의와 단위를 소수 여섯 자리 출력으로 비교합니다.", String.raw`from statistics import mean, pvariance, pstdev, variance, stdev

values = [2, 4, 4, 4, 5, 5, 7, 9]
print(f"n={len(values)}")
print(f"mean={mean(values):.6f}")
print(f"population-variance={pvariance(values):.6f}")
print(f"population-stddev={pstdev(values):.6f}")
print(f"sample-variance={variance(values):.6f}")
print(f"sample-stddev={stdev(values):.6f}")`, "n=8\nmean=5.000000\npopulation-variance=4.000000\npopulation-stddev=2.000000\nsample-variance=4.571429\nsample-stddev=2.138090", ["mysql-aggregate", "oracle-stddev-pop", "oracle-var-pop", "python-statistics"]),
    ],
    diagnostics: [
      d("두 서비스가 같은 rows로 서로 다른 표준편차를 냅니다.", "한쪽은 population, 다른 쪽은 sample estimator이거나 NULL/weight/rounding 정책이 다릅니다.", ["함수 alias가 실제 POP/SAMP 중 무엇인지", "N과 missing count", "weights와 join grain", "numeric type·rounding stage"], "metric schema에 estimator·population predicate·unit·missing/weight policy를 명시하고 canonical fixtures로 교차 검증합니다.", "report에 N과 estimator id를 함께 노출하고 engine matrix test를 둡니다."),
      d("표본이 한 건일 때 분산이 NULL·error·zero 중 환경마다 다릅니다.", "sample denominator N-1이 0인 경계와 application defaulting이 정의되지 않았습니다.", ["N=0/1 engine result", "driver null mapping", "API schema nullable 여부", "UI zero fallback"], "undefined를 NULL/status field로 보존하고 zero로 위조하지 않습니다.", "empty·all-null·N=1·N=2 fixtures를 고정합니다."),
    ],
    expertNotes: ["통계량의 이름보다 population predicate와 observational unit이 먼저입니다.", "분산이 커진 원인을 데이터 변화와 중복 join/단위 변환 결함으로 나누는 drill-down을 준비합니다."],
  },
  {
    id: "numerical-stability-precision",
    title: "분산 계산의 cancellation·precision·merge algorithm을 검증합니다",
    lead: "큰 평균 주변의 작은 변동을 E[x²]-E[x]²로 계산하면 거의 같은 큰 수를 빼며 유효 숫자가 사라질 수 있습니다.",
    explanations: [
      "naive one-pass variance는 SUM(x*x)/N-AVG(x)^2 형태에서 catastrophic cancellation과 overflow를 겪습니다. DB 함수가 stable algorithm을 쓰는지 공식 문서나 adversarial fixture로 검증하고 직접 식으로 재구현하지 않습니다.",
      "Welford online algorithm은 count, running mean과 M2를 갱신해 한 번의 순회로 안정적인 population/sample variance를 계산합니다. 병렬/분산 집계에는 partial state를 정확히 merge하는 식과 determinism test가 추가로 필요합니다.",
      "DECIMAL 입력이 함수 내부에서 DECIMAL, DOUBLE 또는 vendor numeric으로 승격되는지 확인합니다. 결과 precision/scale, overflow, NaN/Infinity와 driver mapping을 MySQL·Oracle matrix에 기록합니다.",
      "반올림은 통계 계산 중간이 아니라 표시/계약 경계에서 한 번 수행합니다. 평균이나 편차를 group별로 먼저 반올림한 뒤 재집계하면 weighted result가 달라집니다.",
      "수치 정확성 acceptance에는 known analytical datasets, large-offset/small-variance, extreme magnitude, order permutations와 high-precision reference를 포함합니다. 단순 happy path는 안정성을 증명하지 않습니다.",
    ],
    concepts: [
      c("catastrophic cancellation", "가까운 큰 부동소수점 수를 빼며 상대적으로 작은 차이의 유효 숫자가 사라지는 현상입니다.", ["naive variance에서 잘 드러납니다.", "large-offset fixtures로 검출합니다."]),
      c("Welford state", "count·mean·M2로 구성된 온라인 분산 계산 상태입니다.", ["population은 M2/N입니다.", "sample은 N>1에서 M2/(N-1)입니다."]),
      c("mergeable aggregate state", "partition별 통계 상태를 전체와 동등하게 합칠 수 있는 상태와 결합 법칙입니다.", ["병렬 순서 차이를 시험합니다.", "count/mean/M2를 모두 보존합니다."]),
    ],
    codeExamples: [py("sql09-stable-variance", "큰 offset에서 naive와 Welford 분산 비교", "sql09_stable_variance.py", "1조 주변의 작은 차이를 naive 제곱합과 Welford로 계산해 cancellation을 정확한 출력으로 드러냅니다.", String.raw`values = [1_000_000_000_001.0, 1_000_000_000_002.0, 1_000_000_000_003.0]
mean = sum(values) / len(values)
naive = sum(value * value for value in values) / len(values) - mean * mean
n = 0
running_mean = 0.0
m2 = 0.0
for value in values:
    n += 1
    delta = value - running_mean
    running_mean += delta / n
    m2 += delta * (value - running_mean)
stable = m2 / n
print(f"mean={mean:.1f}")
print(f"naive={naive:.1f}")
print(f"stable={stable:.6f}")
print("expected=0.666667")
print("stable-correct=" + str(round(stable, 6) == 0.666667).lower())`, "mean=1000000000002.0\nnaive=134217728.0\nstable=0.666667\nexpected=0.666667\nstable-correct=true", ["mysql-aggregate", "oracle-var-pop", "python-statistics"]),
    ],
    diagnostics: [
      d("분산이 음수이거나 실제보다 수억 배 크게 나옵니다.", "큰 offset에서 naive E[x²]-E[x]² 계산이 cancellation/overflow를 일으켰습니다.", ["직접 작성한 variance 식", "입력 magnitude 대비 spread", "intermediate numeric type", "stable vendor function/reference 결과"], "검증된 VAR_POP/VAR_SAMP 또는 stable online/two-pass algorithm을 사용하고 high-precision reference와 비교합니다.", "large-offset·permutation·extreme magnitude regression fixtures를 둡니다."),
      d("분산 실행 plan의 worker 수가 바뀌면 마지막 자릿수가 달라집니다.", "floating-point addition과 partial-state merge 순서가 바뀌어 비결합성 차이가 드러났습니다.", ["parallel aggregate plan", "partial state/merge algorithm", "result tolerance와 rounding stage", "DECIMAL 대 DOUBLE path"], "business 계약에 허용 오차·rounding을 명시하고 exact decimal이 필수인 metric은 지원 numeric path를 검증합니다.", "worker/order matrix와 relative/absolute tolerance assertion을 유지합니다."),
    ],
    expertNotes: ["정확한 숫자 하나만 요구하지 말고 algorithm, input type, tolerance와 rendering scale을 함께 계약합니다.", "분산 partial state를 직접 구현한다면 merge associativity와 serialize/restore compatibility를 property test합니다."],
  },
  {
    id: "percentile-median-distribution",
    title: "평균·표준편차를 percentile·분포·robust statistic과 함께 해석합니다",
    lead: "skew와 outlier가 있는 latency·가격·학습시간에서는 평균과 표준편차만으로 사용자 경험이나 꼬리를 설명할 수 없습니다.",
    explanations: [
      "median과 percentile은 ordered distribution의 위치를 요약합니다. continuous/discrete interpolation, even-N median, NULL exclusion과 tie policy가 엔진 함수마다 다르므로 함수명과 percentile method를 기록합니다.",
      "p95 latency는 요청의 95%가 그 값 이하라는 distribution statement이지 95%의 사용자가 같은 경험을 했다는 뜻이 아닙니다. tenant·endpoint·status·time window group grain과 population bias를 함께 봅니다.",
      "표준편차는 symmetric normal distribution을 보장하지 않습니다. histogram/quantiles, min/max, count와 missing/error rate를 함께 제공하고 heavy-tail에서는 median absolute deviation 같은 robust measure를 고려합니다.",
      "exact percentile은 sort 비용과 memory/spill을 유발하고 approximate quantile은 error bound·merge state·version이 필요합니다. audit/settlement에는 exact path를, telemetry에는 승인된 approximate path를 선택할 수 있습니다.",
      "window function percentile과 ordered-set aggregate의 지원 문법은 MySQL·Oracle에서 다릅니다. compatibility layer는 결과 method와 interpolation까지 보존하고 단순 함수명 치환을 피합니다.",
    ],
    concepts: [
      c("percentile method", "정렬된 관측에서 순위와 보간으로 분위수를 계산하는 명시적 규칙입니다.", ["continuous/discrete를 구분합니다.", "작은 N과 ties를 시험합니다."]),
      c("robust statistic", "outlier 또는 비대칭 분포의 영향에 덜 민감한 요약 통계입니다.", ["median/MAD 등을 포함합니다.", "목적에 맞는 population을 여전히 정의해야 합니다."]),
      c("approximation error contract", "근사 분위수 결과의 허용 rank/value error, confidence, algorithm version과 exact audit 경로입니다.", ["성능과 정확성 tradeoff를 수치화합니다.", "merge/upgrades를 검증합니다."]),
    ],
    diagnostics: [
      d("평균 latency는 안정적인데 사용자 불만이 증가합니다.", "꼬리 latency·error population 또는 특정 tenant/endpoint 분포가 평균에 가려졌습니다.", ["p50/p95/p99와 histogram", "success/error를 포함한 population", "group별 counts", "timeouts/censored observations"], "분포 metric과 cohort drill-down을 추가하고 timeout을 누락하지 않는 population을 정의합니다.", "tail SLO와 count/missing/error reconciliation을 둡니다."),
      d("두 엔진의 median이 작은 데이터에서 다릅니다.", "continuous/discrete interpolation 또는 even-N·NULL 처리 방식이 다릅니다.", ["공식 percentile method", "sorted raw values", "N/ties/NULL fixtures", "numeric type·rounding"], "portable method를 명시적으로 구현/선택하고 engine별 approved difference를 문서화합니다.", "N=0..5, duplicates와 extreme fixtures로 conformance test를 둡니다."),
    ],
    expertNotes: ["percentile dashboard에는 method/version과 sample count를 함께 보여 줍니다.", "timeout·dropped telemetry를 제외하면 tail이 인위적으로 좋아질 수 있으므로 censored/missing observations를 별도 계수합니다."],
  },
  {
    id: "aggregate-resource-plan-budget",
    title: "정렬·hash aggregate·JSON materialization의 plan과 resource budget을 검증합니다",
    lead: "문자열·JSON·통계 집계는 group cardinality와 group skew에 따라 sort, hash, temp spill, memory와 network 비용이 급격히 달라집니다.",
    explanations: [
      "EXPLAIN에서 scan/filter rows, group key cardinality estimate, sort/hash aggregate, temp table와 spill 신호를 읽습니다. 결과 row가 한 개라고 적은 일을 했다는 뜻은 아닙니다.",
      "ordered aggregate는 group key+element order sort가 필요할 수 있습니다. matching composite index가 도움이 될 수 있지만 filtering selectivity, collation과 covering width/write cost를 함께 측정합니다.",
      "가장 큰 group 하나가 평균 group보다 수천 배 큰 skew에서는 hash table/JSON buffer가 worker memory를 독점합니다. max group cardinality와 encoded size를 synthetic skew fixture로 측정하고 hard budget을 둡니다.",
      "JSON/list aggregate 결과를 DB에서 application, gateway, cache와 browser까지 여러 번 복사할 수 있습니다. 압축 전/후 bytes, serialization/parse time, heap peak와 retry amplification을 end-to-end로 관측합니다.",
      "precomputed/materialized aggregates는 read 비용을 줄이지만 freshness, late data correction, rebuild, access policy와 schema version을 운영해야 합니다. raw canonical facts와 reconciliation path를 유지합니다.",
    ],
    concepts: [
      c("group skew", "특정 group이 대부분 입력 행이나 payload bytes를 차지하는 분포입니다.", ["average만 측정하지 않습니다.", "largest group을 별도 fixture로 둡니다."]),
      c("aggregate spill", "memory budget을 넘은 sort/hash/materialization 상태가 temporary storage로 내려가는 현상입니다.", ["latency와 I/O가 급증할 수 있습니다.", "plan과 runtime counters를 함께 봅니다."]),
      c("end-to-end byte budget", "DB result부터 browser parse/render까지 허용하는 encoded/decoded 크기와 복사 횟수 계약입니다.", ["network bytes만 보지 않습니다.", "retry와 cache duplication을 포함합니다."]),
    ],
    diagnostics: [
      d("테스트에서는 빠르지만 특정 고객의 JSON report만 timeout됩니다.", "largest tenant group skew와 ordered materialization이 memory/spill budget을 초과했습니다.", ["tenant별 row/encoded-byte percentiles", "actual plan spill/temp", "worker memory", "gateway/app timeout과 retry"], "detail을 page/stream하고 group hard limit을 두며 필요한 composite index와 pre-aggregation을 representative skew에서 검증합니다.", "largest-group fixture와 per-group budget telemetry를 둡니다."),
      d("집계를 precompute한 뒤 숫자와 payload가 원본과 어긋납니다.", "late events, failed refresh, schema/policy drift 또는 non-atomic publish가 생겼습니다.", ["watermark/refresh run id", "source→summary counts/checksums", "schema/policy version", "publish transaction과 fallback"], "staging rebuild 후 reconciliation을 통과한 version만 atomic publish하고 이전 version rollback을 유지합니다.", "freshness·drift alert와 정기 full rebuild drill을 둡니다."),
    ],
    expertNotes: ["EXPLAIN estimate만으로 승인하지 않고 actual rows·spill·bytes·heap을 representative data로 측정합니다.", "query timeout은 resource 보호 장치이며 partial/truncated payload를 성공으로 캐시하지 않게 상태를 구분합니다."],
  },
  {
    id: "engine-portability-json-statistics",
    title: "MySQL·Oracle·SQLite의 aggregate 문법·타입·한도를 portability matrix로 격리합니다",
    lead: "GROUP_CONCAT/LISTAGG, JSON constructors와 statistical aliases는 이름·ordering·overflow·return type·empty behavior가 엔진마다 다릅니다.",
    explanations: [
      "MySQL GROUP_CONCAT과 Oracle LISTAGG는 ordering/overflow syntax와 maximum result behavior가 같지 않습니다. 공통 facade가 필요해도 각 dialect query를 별도 구현하고 의미 conformance tests를 공유합니다.",
      "JSON_ARRAYAGG/OBJECTAGG는 return type option, ordering, duplicate/NULL key와 empty input이 다를 수 있습니다. DB native JSON과 text CLOB/BLOB 반환도 driver에 영향을 주므로 SQL 문자열만 비교하지 않습니다.",
      "STD, STDDEV, VARIANCE 같은 alias가 population인지 sample인지 vendor 문서에서 확인합니다. portable metric code는 STDDEV_POP/STDDEV_SAMP와 VAR_POP/VAR_SAMP처럼 의도를 드러내는 이름을 선호합니다.",
      "SQLite exact examples는 small semantic laboratory입니다. production MySQL/Oracle의 group_concat length, JSON binary/native types, parallel aggregate, numeric precision과 optimizer를 증명하지 않음을 각 예제에 표시합니다.",
      "compatibility matrix에는 supported syntax, exact output type, NULL/empty/duplicate/order/overflow, precision, plan/resource limits와 driver round-trip을 버전별로 기록합니다. unsupported 기능은 application fallback 비용도 측정합니다.",
    ],
    concepts: [
      c("semantic portability", "문법 실행 여부가 아니라 ordering·NULL·type·overflow와 통계 estimator까지 같은 계약을 만족하는 성질입니다.", ["versioned engine matrix로 검증합니다.", "approved difference를 숨기지 않습니다."]),
      c("dialect adapter", "공통 metric 계약을 각 DB의 정확한 함수·타입·overflow 문법으로 구현하는 계층입니다.", ["string replace가 아닙니다.", "conformance fixtures를 공유합니다."]),
      c("driver round-trip", "DB native aggregate 값을 application type으로 읽고 다시 JSON/표시로 내보낼 때 의미가 보존되는지 검증하는 과정입니다.", ["JSON double encoding을 찾습니다.", "decimal precision과 NULL을 검사합니다."]),
    ],
    diagnostics: [
      d("DB를 바꾸자 query는 실행되지만 배열 순서·NULL·표준편차가 달라집니다.", "syntax compatibility만 확인하고 aggregate semantic matrix를 검증하지 않았습니다.", ["ordering syntax", "empty/NULL/duplicate behavior", "POP/SAMP alias", "return type와 driver mapping"], "dialect별 query와 shared canonical fixtures를 만들고 차이는 API contract에 명시합니다.", "지원 DB/version matrix를 CI 또는 release qualification에서 실행합니다."),
      d("Oracle/MySQL 결과를 문자열로 맞췄지만 한쪽 JSON은 double encoded됩니다.", "native JSON/CLOB/string driver type 차이를 application adapter가 무시했습니다.", ["SQL result metadata", "driver runtime type", "serializer output raw bytes", "parse depth"], "DB별 codec에서 typed application DTO로 한 번만 변환하고 serializer contract test를 둡니다.", "producer raw/parsed snapshot과 schema validation을 엔진별로 유지합니다."),
    ],
    expertNotes: ["동일 출력 text를 semantic equality로 착각하지 말고 parsed type과 metric definition을 비교합니다.", "database upgrade 시 aggregate ordering/overflow/JSON/statistics conformance suite를 먼저 실행합니다."],
  },
  {
    id: "privacy-security-structured-aggregate",
    title: "집계 payload의 authorization·privacy·injection·minimum cohort를 설계합니다",
    lead: "여러 행을 한 문자열이나 JSON으로 모으면 필드 단위 보안 검토를 우회하고 작은 cohort에서 개인을 재식별하기 쉬워집니다.",
    explanations: [
      "authorization predicate는 aggregate input relation에 적용되고 cache/export에도 같은 policy version이 이어져야 합니다. 결과 row 하나만 보안 검사하면 내부 elements의 권한을 놓칩니다.",
      "JSON constructor는 값 escaping을 제공하지만 dynamic SQL identifier/order expression을 안전하게 만들지는 않습니다. value parameter binding, allow-listed group/order fields와 fixed query templates를 사용합니다.",
      "GROUP_CONCAT output을 HTML에 그대로 삽입하면 XSS가 될 수 있고 CSV에 내보내면 formula injection이 될 수 있습니다. DB escaping과 sink-specific output encoding을 분리합니다.",
      "count/mean/stddev도 작은 cohort나 unique group에서 개인정보를 드러낼 수 있습니다. minimum cohort, suppression, rounding/noise policy와 repeated-query differencing 방어를 risk에 맞게 설계합니다.",
      "telemetry에는 raw JSON/list payload나 사용자 label을 남기지 않고 bytes, element count, schema version, policy/result status와 hashed non-sensitive correlation만 기록합니다.",
    ],
    concepts: [
      c("aggregate authorization", "집계 전 모든 input row/field가 현재 principal policy를 통과했음을 보장하는 규칙입니다.", ["cache key에 policy context를 둡니다.", "input lineage를 감사합니다."]),
      c("sink encoding", "같은 집계 값을 HTML, CSV, log 또는 JSON에 보낼 때 각 문맥에 맞게 안전하게 인코딩하는 절차입니다.", ["SQL escaping과 다릅니다.", "raw HTML concatenation을 금지합니다."]),
      c("minimum cohort", "통계/집계를 공개하기 위해 필요한 최소 독립 entity 수와 suppression 규칙입니다.", ["row count와 entity count를 구분합니다.", "differencing 공격을 고려합니다."]),
    ],
    diagnostics: [
      d("캐시된 집계 JSON에서 권한 없는 필드가 보입니다.", "cache key에 tenant/principal/policy version이 없거나 field projection이 집계 전에 제한되지 않았습니다.", ["input authorization SQL", "cache key/vary", "field allow-list", "policy update invalidation"], "권한 적용 relation에서 허용 필드만 aggregate하고 cache를 security context별로 분리·무효화합니다.", "cross-role sentinel tests와 cache readback을 둡니다."),
      d("집계 통계만 공개했는데 특정 개인 값이 추론됩니다.", "작은/중첩 cohort와 반복 차분 query가 허용됐습니다.", ["distinct entity count", "group hierarchy", "query history/rate", "suppression/rounding/noise policy"], "minimum cohort와 complementary suppression을 적용하고 민감 분석 endpoint의 query budget/audit를 둡니다.", "privacy threat model과 adversarial differencing tests를 정기 수행합니다."),
    ],
    expertNotes: ["JSON 유효성과 보안 안전성은 별개입니다. authorization, schema, sink encoding과 privacy를 독립적으로 증명합니다.", "운영 로그는 raw aggregate를 재현할 수 있을 만큼 상세하지 않아도 입력 count·policy/version·failure class를 진단할 수 있어야 합니다."],
  },
  {
    id: "versioned-report-validation-operations",
    title: "집계 결과를 version·schema·reconciliation·freshness가 있는 운영 계약으로 배포합니다",
    lead: "좋은 SQL 한 문장만으로는 report를 운영할 수 없습니다. 정의 변경, 늦은 데이터, 재계산, consumer 호환성과 오류 복구가 필요합니다.",
    explanations: [
      "metric/report contract에 population predicate, grain, output schema, ordering, duplicate/NULL/overflow, estimator/unit, timezone/currency, numeric precision과 owner를 version으로 둡니다. label만 그대로 두고 의미를 바꾸지 않습니다.",
      "validation은 source rows=eligible+excluded, JSON element count=non-null/selected rows, object key uniqueness, category totals와 statistics N/missing reconciliation을 포함합니다. sample groups뿐 아니라 전체 batch invariants를 확인합니다.",
      "late/corrected data가 있으면 event-time window, watermark, restatement interval과 immutable report version을 정의합니다. consumer가 refresh 중 old/new payload를 섞지 않도록 staging→validate→atomic publish를 사용합니다.",
      "schema evolution은 additive/required/type/order changes를 consumer compatibility matrix로 관리합니다. object array field 변경과 scalar array 위치 변경의 위험이 다르며 deprecation 기간과 dual-read evidence가 필요합니다.",
      "운영 관측에는 run id, source/eligible/missing/group counts, output bytes, max group, duplicate/overflow/suppression counters, plan/spill/latency와 schema/metric/watermark version을 둡니다. raw PII payload는 제외합니다.",
    ],
    concepts: [
      c("metric version", "집계 population·수식·estimator·출력 의미가 호환되는 범위를 나타내는 식별자입니다.", ["SQL text hash만으로 부족합니다.", "consumer와 owner를 연결합니다."]),
      c("aggregate reconciliation", "source cardinality와 결과 element/key/count/statistical N이 정의된 식으로 일치함을 검증하는 과정입니다.", ["excluded/missing을 명시합니다.", "silent truncation을 검출합니다."]),
      c("atomic publish", "완전히 계산·검증된 새 report version만 한 번에 소비자에게 보이게 하는 배포 방식입니다.", ["staging과 pointer/swap을 사용합니다.", "이전 version rollback을 유지합니다."]),
    ],
    diagnostics: [
      d("배포 후 같은 metric 이름의 과거/현재 숫자가 갑자기 달라졌습니다.", "population, estimator, NULL/rounding 또는 late-data policy가 version 없이 변경됐습니다.", ["metric definition diff", "source/watermark version", "engine/driver upgrade", "reconciliation counters"], "새 metric version으로 계산하고 dual-run/backfill 차이를 승인한 뒤 consumer를 전환합니다.", "semantic contract diff와 golden-history replay를 release gate로 둡니다."),
      d("새 JSON schema가 일부 consumer만 깨뜨렸습니다.", "required/type/shape 변경을 additive로 오판했거나 double-read 기간 없이 atomic 교체했습니다.", ["producer/consumer schema versions", "raw and parsed contract tests", "unknown/missing field behavior", "cache persistence"], "versioned endpoint 또는 envelope과 compatibility window를 제공하고 consumer readback 후 이전 version을 종료합니다.", "consumer matrix와 deprecation telemetry를 유지합니다."),
    ],
    expertNotes: ["집계 결과에는 언제·어떤 population과 code/schema version으로 계산됐는지 설명 가능한 metadata가 필요합니다.", "롤백은 query code만 되돌리는 것이 아니라 materialized/cache/export report version과 consumer pointer를 함께 복구해야 합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-0203", repository: "dbstudy", path: "02_03.sql", usedFor: ["GROUP_CONCAT·JSON_ARRAYAGG·JSON_OBJECTAGG·STDDEV_POP·VAR_POP progression provenance"], evidence: "원본 파일을 read-only로 확인했으며 sample literals는 복사하지 않았습니다." },
  { id: "mysql-aggregate", repository: "MySQL 8.4 Reference Manual", path: "Aggregate Function Descriptions", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html", usedFor: ["GROUP_CONCAT, JSON aggregates and population/sample statistics"], evidence: "MySQL 공식 집계 함수 문서입니다." },
  { id: "mysql-json-creation", repository: "MySQL 8.4 Reference Manual", path: "Functions That Create JSON Values", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/json-creation-functions.html", usedFor: ["JSON constructor typing and null boundaries"], evidence: "MySQL 공식 JSON 생성 함수 문서입니다." },
  { id: "mysql-group-concat-limit", repository: "MySQL 8.4 Reference Manual", path: "group_concat_max_len system variable", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/server-system-variables.html#sysvar_group_concat_max_len", usedFor: ["string aggregate byte and overflow budgets"], evidence: "MySQL 공식 시스템 변수 문서입니다." },
  { id: "oracle-listagg", repository: "Oracle Database 26ai SQL Language Reference", path: "LISTAGG", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/LISTAGG.html", usedFor: ["ordered text aggregation and overflow portability"], evidence: "Oracle 공식 LISTAGG 문서입니다." },
  { id: "oracle-json-arrayagg", repository: "Oracle Database 26ai SQL Language Reference", path: "JSON_ARRAYAGG", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/JSON_ARRAYAGG.html", usedFor: ["typed ordered JSON array aggregation"], evidence: "Oracle 공식 JSON_ARRAYAGG 문서입니다." },
  { id: "oracle-json-objectagg", repository: "Oracle Database 26ai SQL Language Reference", path: "JSON_OBJECTAGG", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/JSON_OBJECTAGG.html", usedFor: ["JSON object key and duplicate portability"], evidence: "Oracle 공식 JSON_OBJECTAGG 문서입니다." },
  { id: "oracle-stddev-pop", repository: "Oracle Database 26ai SQL Language Reference", path: "STDDEV_POP", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/STDDEV_POP.html", usedFor: ["population standard deviation semantics"], evidence: "Oracle 공식 STDDEV_POP 문서입니다." },
  { id: "oracle-var-pop", repository: "Oracle Database 26ai SQL Language Reference", path: "VAR_POP", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/VAR_POP.html", usedFor: ["population variance and numeric behavior"], evidence: "Oracle 공식 VAR_POP 문서입니다." },
  { id: "sqlite-aggregate", repository: "SQLite Documentation", path: "Built-in Aggregate Functions", publicUrl: "https://www.sqlite.org/lang_aggfunc.html", usedFor: ["exact group_concat laboratory and aggregate ordering caveat"], evidence: "SQLite 공식 집계 함수 문서입니다." },
  { id: "sqlite-json1", repository: "SQLite Documentation", path: "JSON Functions And Operators", publicUrl: "https://www.sqlite.org/json1.html", usedFor: ["exact JSON group array/object laboratory"], evidence: "SQLite 공식 JSON 함수 문서입니다." },
  { id: "python-statistics", repository: "Python 3 Documentation", path: "statistics — Mathematical statistics functions", publicUrl: "https://docs.python.org/3/library/statistics.html", usedFor: ["population/sample and stable reference examples"], evidence: "Python 공식 statistics 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-09-json-and-statistical-aggregates",
  slug: "sql-09-json-and-statistical-aggregates",
  courseId: "database",
  moduleId: "db-query-foundations",
  order: 9,
  title: "GROUP_CONCAT·JSON 집계와 통계 함수",
  subtitle: "직렬화와 통계 집계를 순서·NULL·중복·타입·수치 안정성·크기·보안·운영 계약으로 완성합니다.",
  level: "고급",
  estimatedMinutes: 900,
  coreQuestion: "여러 행을 text·JSON·통계 한 값으로 축약하면서도 ordering·NULL·duplicate·estimator·precision·payload·authorization 의미를 잃지 않으려면 무엇을 증명해야 할까요?",
  summary: "dbstudy 02_03.sql의 GROUP_CONCAT separator, JSON_ARRAYAGG/OBJECTAGG, STDDEV_POP/VAR_POP progression을 read-only로 감사합니다. 문자열 delimiter와 overflow, JSON array typed order/null/size, object duplicate key, population/sample statistics, numerical stability, percentile/distribution, plan/spill, engine portability, authorization/privacy와 versioned reconciliation까지 확장합니다. 다섯 exact Python/SQLite examples는 ordered string aggregation, JSON array type/null, duplicate object keys, population/sample formulas와 large-offset stable variance를 실제 실행합니다.",
  objectives: ["문자열·JSON·통계 aggregate output shape와 ordering/NULL/empty contract를 정의한다.", "GROUP_CONCAT/LISTAGG의 delimiter·DISTINCT·collation·overflow 위험을 진단한다.", "JSON array/object의 typed value·duplicate key·size와 driver round-trip을 검증한다.", "population/sample variance와 standard deviation의 N·unit·missing/weight semantics를 구분한다.", "cancellation·precision·parallel merge와 percentile method의 수치 계약을 검증한다.", "plan/spill/skew/payload budget과 materialized freshness를 운영한다.", "authorization·privacy·version/schema/reconciliation을 배포 계약으로 만든다."],
  prerequisites: [{ title: "집계와 GROUP BY", reason: "입력 population, grain, NULL과 fan-out을 먼저 고정해야 직렬화·통계 집계가 의미를 보존합니다.", sessionSlug: "sql-08-aggregate-group-having" }],
  keywords: ["GROUP_CONCAT", "LISTAGG", "JSON_ARRAYAGG", "JSON_OBJECTAGG", "duplicate key", "STDDEV_POP", "VAR_POP", "sample variance", "Welford", "percentile", "payload budget", "aggregate spill", "reconciliation"],
  topics,
  lab: {
    title: "tenant별 학습 활동을 안전한 JSON timeline과 분포 report로 발행하기",
    scenario: "학습 event rows를 tenant·course·day별 ordered JSON으로 묶고 completion time의 count/mean/population variance/p50/p95를 계산합니다. NULL, duplicate key, large group, late event와 권한 경계를 처리해야 합니다.",
    setup: ["synthetic tenant/event/user ids, duplicate/null/skew/large-offset fixtures만 사용합니다.", "MySQL 8.4·Oracle 26ai isolated schemas와 representative indexes/stats를 준비합니다.", "population·grain·order·JSON schema·key identity·estimator/unit·byte/cohort budget을 문서화합니다.", "canonical detail counts/checksums와 expected JSON/statistical results를 고정합니다."],
    steps: ["권한 적용 input relation과 ordered immutable event keys를 readback합니다.", "GROUP_CONCAT의 delimiter/NULL/DISTINCT/overflow 반례와 source/emitted count를 비교합니다.", "JSON array의 parsed element schema·types·order·null·encoded bytes를 검증합니다.", "object keys를 normalize하고 NULL/duplicate를 집계 전 reject합니다.", "population/sample N·missing·unit·weight와 analytical fixture 결과를 비교합니다.", "large-offset·order permutation·parallelism에서 stable/tolerance 결과를 검증합니다.", "percentile method, small-N/tie/timeout population과 exact/approximate 정책을 검증합니다.", "largest group EXPLAIN actual, sort/hash/temp/spill, DB/app/browser resource를 측정합니다.", "MySQL·Oracle syntax/type/overflow/driver compatibility matrix를 readback합니다.", "source=eligible+excluded, JSON elements/keys, N/missing, bytes, watermark/version과 privacy suppression을 reconciliation합니다."],
    expectedResult: ["text/JSON/statistical outputs가 versioned shape·order·NULL·duplicate·estimator 계약과 일치합니다.", "모든 다섯 exact examples의 stdout이 문서와 완전히 같습니다.", "silent truncation·duplicate key·cancellation·join duplication과 cross-tenant leak가 acceptance에서 검출됩니다.", "largest group도 승인된 plan/spill/byte/latency/cohort budget 안에서 처리되거나 명시적으로 page/suppress됩니다.", "staging 결과가 canonical source와 reconciliation된 뒤 schema/metric/watermark version으로 atomic publish됩니다."],
    cleanup: ["isolated schemas·synthetic rows와 staged report/cache keys를 run id로 제거합니다.", "temporary credentials와 test exports를 revoke·삭제합니다.", "logs에 raw JSON/list labels·사용자 값이 없는지 검사합니다.", "production source 파일과 데이터는 변경하지 않습니다."],
    extensions: ["ordered-set percentile와 approximate quantile error/merge contract를 비교합니다.", "incremental JSON/report materialization과 late correction restatement를 구현합니다.", "columnar warehouse·stream processor의 mergeable statistics state를 검증합니다.", "differential privacy budget과 minimum cohort policy를 threat-modeling합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 각 결과의 input rows·order·NULL/duplicate·N/estimator를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "aggregate row order와 element order를 구분합니다.", "SQL NULL·JSON null·missing을 구분합니다.", "duplicate object key가 parser에서 손실되는 과정을 설명합니다.", "population/sample denominator를 식으로 씁니다.", "naive/stable variance 차이를 재현합니다."], hints: ["최종 값보다 input cardinality와 representation boundary를 먼저 적으세요."], expectedOutcome: "고급 aggregate를 함수 암기가 아니라 재현 가능한 의미 계약으로 설명합니다.", solutionOutline: ["population→shape/order→null/duplicate→numeric method→resource→reconciliation 순서입니다."] },
    { difficulty: "응용", prompt: "원본 02_03 집계 흐름을 multi-tenant analytics API로 재구성하세요.", requirements: ["원본 함수 progression provenance를 보존합니다.", "text delimiter/overflow와 JSON schema/size를 정의합니다.", "key uniqueness와 authorization을 집계 전에 검증합니다.", "POP/SAMP·unit·missing/weight와 tolerance를 정의합니다.", "percentile method와 exact/approximate 경계를 둡니다.", "MySQL·Oracle plan/type/driver matrix를 실행합니다.", "version/watermark/reconciliation/atomic publish를 구현합니다.", "raw PII 없는 telemetry와 cohort suppression을 포함합니다."], hints: ["한 셀에 많이 담는 것이 반드시 API round trip을 줄이는 최적화는 아닙니다."], expectedOutcome: "정확성·이식성·보안·성능·복구가 검증된 analytics endpoint가 완성됩니다.", solutionOutline: ["source audit→contract→dialect implementation→adversarial tests→resource test→publish/readback 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 structured/statistical SQL aggregate 표준을 작성하세요.", requirements: ["shape/order/null/empty/duplicate/delimiter/overflow schema를 정의합니다.", "population/sample/weight/unit/precision/tolerance 규칙을 둡니다.", "percentile/approximation 선택 기준을 둡니다.", "authorization/injection/sink/privacy/cohort 규칙을 둡니다.", "plan/spill/skew/end-to-end byte budgets를 정의합니다.", "engine/driver compatibility matrix를 요구합니다.", "version/schema/watermark/reconciliation/rollback을 정의합니다.", "canonical rows와 materialized summaries의 ownership을 정합니다."], hints: ["JSON valid와 통계 숫자 출력은 의미가 맞다는 증거가 아닙니다."], expectedOutcome: "문자열 목록부터 운영 통계 API까지 일관된 전문가 governance가 완성됩니다.", solutionOutline: ["define→authorize→aggregate→parse/measure→reconcile→publish→observe→correct 순서입니다."] },
  ],
  nextSessions: ["sql-10-cartesian-inner-join"],
  sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["02_03.sql의 GROUP_CONCAT 3개 separator 변형, JSON array/object 각 1개, STD/STDDEV/STDDEV_POP 1개와 VAR_POP/VARIANCE 1개 active progression을 read-only로 확인했습니다.", "원본 book names/prices와 기타 sample literals는 복사하지 않고 함수·clause progression만 provenance로 사용했습니다.", "원본은 deterministic ordering, delimiter collision/overflow, JSON typing/duplicate keys, POP/SAMP와 numerical stability, payload/security/plan/version operations를 충분히 설명하지 않아 공식 문서와 synthetic examples로 보완했습니다.", "SQLite exact examples는 MySQL 8.4·Oracle 26ai의 native JSON/LOB, group length/overflow, numeric/parallel aggregate와 optimizer behavior를 대체하지 않습니다."] },
});

export default session;
