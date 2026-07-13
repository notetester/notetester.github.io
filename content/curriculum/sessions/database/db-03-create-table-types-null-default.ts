import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function py(
  id: string,
  title: string,
  filename: string,
  purpose: string,
  code: string,
  output: string,
  sourceRefs: string[],
): DetailedCodeExample {
  return {
    id,
    title,
    language: "python",
    filename,
    purpose,
    code,
    walkthrough: [
      { lines: "1-5", explanation: "Python 표준 라이브러리와 메모리 SQLite로 외부 server·credential·영구 data 없는 재현 환경을 만듭니다. MySQL·Oracle dialect와 같다고 주장하지 않습니다." },
      { lines: "6-끝에서 4줄 전", explanation: "자료형·NULL·DEFAULT 불변식을 작은 DDL과 synthetic fixture로 실행합니다. 환경 의존 시각·locale·vendor 오류 원문은 stable output에서 제외합니다." },
      { lines: "마지막 4줄", explanation: "catalog 또는 query 결과를 정렬하고 명시적인 판정 문자열로 출력합니다. 같은 요구사항을 MySQL 8.4와 Oracle 26ai에서 별도 contract test해야 합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3·decimal·datetime", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["고정 fixture와 explicit ordering을 사용해 stdout이 문서와 완전히 일치합니다.", "SQLite의 dynamic typing과 default/NULL 세부 동작은 MySQL·Oracle과 다르므로 portable concept 실행과 vendor integration evidence를 분리합니다."] },
    experiments: [
      { change: "정상 경계값을 하나 넘어서는 값 또는 explicit NULL을 넣습니다.", prediction: "type 범위, CHECK 또는 NOT NULL 불변식이 실패하거나 SQLite affinity 때문에 예상과 다른 저장이 관찰됩니다.", result: "portable contract는 application validation만이 아니라 target DBMS의 실제 strict behavior로 검증해야 합니다." },
      { change: "INSERT column list에서 default 대상 column을 생략한 경우와 NULL을 명시한 경우를 비교합니다.", prediction: "생략은 DEFAULT를 사용하지만 explicit NULL은 nullable이면 NULL을 저장하고 NOT NULL이면 실패합니다.", result: "DEFAULT는 NULL 대체 연산자가 아니라 omitted-value 규칙입니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "ddl-contract-lifecycle",
    title: "CREATE TABLE을 허용 상태와 변경 절차를 정의하는 DDL 계약으로 읽습니다",
    lead: "column을 나열해 table이 만들어졌다는 사실보다 어떤 상태를 허용·거부하고 어떻게 version을 바꿀지가 더 중요합니다.",
    explanations: [
      "CREATE TABLE은 column 이름과 type뿐 아니라 identity, NULL 가능성, default, generated value, constraint, index와 table option을 하나의 schema version으로 만듭니다. DDL 성공은 syntax가 맞다는 증거이고 business 요구를 충분히 표현했다는 증거는 아닙니다. 정상·경계·반례 fixture로 허용 상태를 검증합니다.",
      "원본 01_21.sql은 members 계열 table을 세 번 정의하며 NOT NULL, default, unique, check를 점진적으로 보강합니다. 01_26.sql은 여러 BOOKTEST table과 ALTER 연습을 포함합니다. 두 파일은 학습 변화가 남은 좋은 provenance지만 같은 이름의 중복 CREATE, plaintext credential·연락처 fixture, 서로 다른 NULL/default 정책을 production migration으로 그대로 실행해서는 안 됩니다.",
      "MySQL DDL은 transaction DML과 같은 rollback 기대를 두면 안 되는 statement가 있고 implicit commit·metadata lock·online algorithm 비용을 고려해야 합니다. schema migration은 source-controlled version, preflight, apply, catalog readback, data invariant check, observation과 roll-forward/restore를 포함합니다.",
      "CREATE TABLE IF NOT EXISTS는 존재하는 table이 기대 schema와 같은지 검증하지 않습니다. deployment가 성공처럼 보여도 old column type·constraint가 남을 수 있으므로 migration history checksum과 INFORMATION_SCHEMA actual diff를 별도로 검사합니다.",
    ],
    concepts: [
      c("DDL", "database object의 구조와 규칙을 생성·변경·삭제하는 data definition language입니다.", ["CREATE·ALTER·DROP과 object-specific statements를 포함합니다.", "transaction/locking/replication 의미는 target DBMS 문서와 rehearsal로 확인합니다."]),
      c("schema contract", "writer와 reader가 공유하는 column·type·NULL·default·constraint·version의 실행 가능한 약속입니다.", ["application DTO보다 오래 살 수 있습니다.", "catalog와 negative fixtures로 actual enforcement를 검증합니다."]),
    ],
    codeExamples: [py(
      "db03-create-catalog",
      "CREATE TABLE 뒤 catalog에서 type·NULL·DEFAULT를 readback하기",
      "create_catalog.py",
      "작성한 DDL 문자열을 믿는 대신 actual catalog metadata와 instance를 서로 다른 증거로 확인합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("""
CREATE TABLE lesson (
  lesson_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  note TEXT DEFAULT NULL
)
""")
db.execute("INSERT INTO lesson (lesson_id, title) VALUES (1, '자료형')")

catalog = [(row[1], row[2], row[3], row[4], row[5]) for row in db.execute("PRAGMA table_info(lesson)")]
row = db.execute("SELECT lesson_id, title, difficulty, note FROM lesson").fetchone()
print("columns=" + ";".join(f"{name}:{kind}:notnull={notnull}:default={default}:pk={pk}" for name, kind, notnull, default, pk in catalog))
print("row=" + repr(row))
print("schema-evidence=catalog")
print("data-evidence=query")`,
      "columns=lesson_id:INTEGER:notnull=0:default=None:pk=1;title:TEXT:notnull=1:default=None:pk=0;difficulty:INTEGER:notnull=1:default=1:pk=0;note:TEXT:notnull=0:default=NULL:pk=0\nrow=(1, '자료형', 1, None)\nschema-evidence=catalog\ndata-evidence=query",
      ["local-db-0121", "local-db-0126", "mysql-create-table", "sqlite-create-table"],
    )],
    diagnostics: [
      d("CREATE TABLE IF NOT EXISTS가 성공했는데 application은 unknown column 오류가 난다.", "기존 table 존재만 확인했고 expected/actual schema equality를 검증하지 않았습니다.", ["migration history version/checksum을 비교합니다.", "catalog의 column·type·default·constraint를 expected manifest와 diff합니다.", "fleet instance별 drift를 확인합니다."], "traffic을 격리하고 누락 migration을 idempotent하게 적용하거나 compatible application으로 roll back합니다.", "readiness에 schema range와 catalog drift gate를 둡니다."),
      d("DDL 배포 중 unrelated write가 timeout 난다.", "metadata lock과 table rebuild/copy 시간을 workload에서 rehearsal하지 않았습니다.", ["blocking/blocked sessions와 metadata locks를 확인합니다.", "DDL algorithm·lock option·table size를 봅니다.", "replication lag와 abort threshold를 확인합니다."], "DDL을 안전하게 중단하거나 traffic을 조절하고 online/expand-contract migration으로 단계화합니다.", "representative data와 concurrent load에서 lock/time budget을 사전 검증합니다."),
    ],
    expertNotes: ["schema migration은 code rollback과 data rollback 가능성이 다르므로 reversible, roll-forward-only, destructive class를 표시합니다.", "multi-region replica와 CDC consumer가 있으면 DDL propagation order와 old/new schema compatibility window를 별도 설계합니다."],
  },
  {
    id: "integer-fixed-point-range",
    title: "정수와 DECIMAL을 값 범위·단위·연산 규칙으로 선택합니다",
    lead: "INT를 습관적으로 쓰거나 돈을 FLOAT로 저장하면 데이터가 커지거나 반올림이 누적될 때 뒤늦게 contract가 깨집니다.",
    explanations: [
      "integer type은 signed/unsigned 범위, storage, client language mapping과 future growth를 함께 선택합니다. row count가 아니라 identifier가 평생 생성될 최대 속도·보존 기간·shard 전략을 추정합니다. boolean·status·수량을 모두 INT로 선언하면 domain은 application 밖에 드러나지 않습니다.",
      "금액·세율·정밀 측정처럼 decimal digit 계약이 중요한 값은 DECIMAL(p,s)와 명시적 rounding policy를 사용합니다. p는 전체 유효 자릿수, s는 소수 자릿수이며 최대값·negative 허용·currency/단위를 CHECK 또는 domain 계약으로 제한합니다. 돈을 smallest unit integer로 저장하는 선택도 currency별 minor unit과 overflow를 문서화해야 합니다.",
      "type 변환 때 out-of-range behavior와 SQL mode를 확인합니다. 엄격하지 않은 환경에서 잘림·경고로 진행되는 동작을 정상화하지 말고 CI와 production의 strict mode를 맞추며 warning을 실패 evidence로 취급합니다.",
      "aggregate SUM, multiplication, division은 input type과 expression coercion에 따라 result precision이 달라질 수 있습니다. schema type만 보고 끝내지 않고 대표적인 최대 row 수와 계산식을 target DBMS에서 test해 intermediate/result 범위를 검증합니다.",
    ],
    concepts: [
      c("precision and scale", "DECIMAL(p,s)에서 전체 유효 자릿수 p와 소수점 아래 자릿수 s를 나타냅니다.", ["business rounding과 최대 범위를 함께 정합니다.", "client Decimal type과 serialization 계약을 맞춥니다."]),
      c("overflow", "값이나 연산 결과가 type이 표현할 수 있는 범위를 벗어나는 상태입니다.", ["insert뿐 아니라 aggregate·산술 중간값도 검토합니다.", "strict mode와 driver error handling을 test합니다."]),
    ],
    codeExamples: [py(
      "db03-decimal-money",
      "binary float와 Decimal 누적 결과 비교하기",
      "decimal_money.py",
      "금액에서 표현 방식과 rounding policy가 왜 schema 밖의 client 계산에도 이어지는지 exact value로 확인합니다.",
      String.raw`from decimal import Decimal, ROUND_HALF_UP, getcontext

getcontext().prec = 28
binary_total = sum([0.1, 0.1, 0.1])
decimal_total = sum([Decimal("0.10"), Decimal("0.10"), Decimal("0.10")], Decimal("0"))
tax = (decimal_total * Decimal("0.075")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
gross = decimal_total + tax

print("binary-total=" + format(binary_total, ".17f"))
print("decimal-total=" + format(decimal_total, ".2f"))
print("tax-half-up=" + format(tax, ".2f"))
print("gross=" + format(gross, ".2f"))`,
      "binary-total=0.30000000000000004\ndecimal-total=0.30\ntax-half-up=0.02\ngross=0.32",
      ["mysql-integer", "mysql-fixed-point", "mysql-out-of-range"],
    )],
    diagnostics: [
      d("월말 합계가 line items의 화면 합과 0.01씩 다르다.", "binary float와 서로 다른 rounding 시점·mode를 사용했습니다.", ["DB column과 client runtime type을 확인합니다.", "line/group/final rounding 순서를 비교합니다.", "currency별 minor unit과 historical calculation version을 봅니다."], "DECIMAL/Decimal과 versioned rounding policy를 하나의 calculation boundary에 적용하고 기존 rows를 reconciliation합니다.", "golden monetary fixtures와 aggregate invariant tests를 둡니다."),
      d("오래 운영한 id column insert가 갑자기 out-of-range가 난다.", "identifier growth를 작은 integer 범위에 맞추고 capacity alert를 두지 않았습니다.", ["현재 max와 type range, 일 증가량을 계산합니다.", "foreign key와 replica/consumer type을 inventory합니다.", "widen migration lock/rebuild 비용을 봅니다."], "parent/child/consumer를 compatible하게 widen하는 online migration을 실행합니다.", "capacity horizon alert와 schema review에서 growth model을 의무화합니다."),
    ],
    expertNotes: ["unsigned type portability는 Java/Oracle mapping과 API schema에서 마찰이 생길 수 있어 logical range를 별도 contract로 둡니다.", "계산 규칙 변경은 schema migration이 없어도 data semantic version과 recomputation/audit 전략이 필요합니다."],
  },
  {
    id: "approximate-floating-point",
    title: "FLOAT·DOUBLE을 근사값과 오차 허용 정책이 있는 domain에만 사용합니다",
    lead: "부동소수점은 틀린 숫자가 아니라 제한된 bit로 넓은 범위를 근사하는 표현입니다. exact equality가 필요한 identity·money에는 맞지 않습니다.",
    explanations: [
      "FLOAT와 DOUBLE은 IEEE 754 계열 근사 표현을 사용해 많은 decimal fractions를 정확히 저장하지 못합니다. 측정·과학 계산처럼 상대/절대 오차 tolerance가 정의된 값에는 유용하지만 금액·식별자·정확한 code에는 부적합합니다.",
      "NaN, infinity, signed zero와 comparison은 application·driver·DBMS 지원이 다릅니다. JSON 같은 외부 format은 표준적으로 non-finite 값을 허용하지 않을 수 있어 validation·serialization boundary를 명시합니다.",
      "WHERE measured = 0.3 같은 exact comparison보다 tolerance range 또는 quantized/canonical value를 사용하되 tolerance는 domain 단위와 scale에 근거해야 합니다. index usage와 selectivity에 미치는 영향도 EXPLAIN으로 확인합니다.",
      "FLOAT display 자릿수와 stored precision, client print formatting을 구분합니다. 화면이 0.30으로 보인다고 실제 bit pattern이나 equality가 decimal exact라는 뜻은 아닙니다.",
    ],
    concepts: [
      c("floating-point approximation", "유한 bit의 significand와 exponent로 넓은 수 범위를 근사하는 표현입니다.", ["대부분의 decimal fraction은 정확히 표현되지 않습니다.", "오차 tolerance와 non-finite policy를 domain에 둡니다."]),
      c("tolerance comparison", "두 근사값의 차이가 허용한 absolute/relative 범위 안인지 비교하는 방법입니다.", ["tolerance를 임의 상수로 두지 않습니다.", "단위·magnitude·measurement error를 반영합니다."]),
    ],
    diagnostics: [
      d("0.1을 세 번 더한 값이 0.3과 equality에서 다르다.", "binary floating-point의 decimal fraction 근사를 exact decimal로 가정했습니다.", ["column/client type과 raw representation을 봅니다.", "계산이 exact money인지 measured value인지 분류합니다.", "comparison tolerance 또는 DECIMAL 필요를 검토합니다."], "exact domain은 DECIMAL/integer minor units로 바꾸고 근사 domain은 documented tolerance를 사용합니다.", "0.1·boundary·large/small magnitude fixtures를 유지합니다."),
      d("NaN이 aggregate·정렬·API 응답을 오염시킨다.", "non-finite input과 serialization policy를 정의하지 않았습니다.", ["NaN/inf 발생 source와 count를 찾습니다.", "DB·driver·JSON serializer behavior를 test합니다.", "NULL/error status로 분리할지 결정합니다."], "ingestion에서 finite/range validation하고 invalid measurement를 status/reason과 격리합니다.", "data contract에 finite·unit·range·missing semantics를 둡니다."),
    ],
    expertNotes: ["numeric reproducibility는 CPU/library/order 차이와 parallel reduction에서도 달라질 수 있어 허용 오차와 deterministic requirement를 분리합니다.", "analytics feature store에서 float normalization·dtype downcast는 model drift와 overflow/underflow를 monitoring해야 합니다."],
  },
  {
    id: "character-binary-unicode-collation",
    title: "CHAR·VARCHAR·TEXT·binary를 Unicode·길이·collation·index 계약으로 선택합니다",
    lead: "VARCHAR(45)는 45 byte가 아니라 product·charset 규칙 속의 길이 제한입니다. 사용자 문자 수와 저장 byte, grapheme 수는 서로 다릅니다.",
    explanations: [
      "CHAR는 고정 길이 code처럼 보일 수 있지만 padding/comparison behavior와 trailing spaces를 확인해야 하고 VARCHAR는 가변 길이 문자열에 적합합니다. TEXT는 더 큰 값이지만 default/index/row storage 세부가 version·engine에 따라 다릅니다. 무조건 VARCHAR(255)로 통일하지 않습니다.",
      "utf8mb4 한 code point는 최대 여러 bytes를 사용하며 사용자가 보는 grapheme cluster는 여러 code points로 구성될 수 있습니다. UI maxlength, DB character length, byte payload limit을 같은 숫자로 가정하지 않습니다. emoji·combining mark·한글·ASCII fixtures로 end-to-end 검증합니다.",
      "collation은 equality·sorting·UNIQUE에 영향을 줍니다. login identifier, case-sensitive external subject, display name은 서로 다른 비교 요구를 가질 수 있습니다. canonical normalized key column을 별도로 두더라도 normalization algorithm/version과 collision migration을 관리합니다.",
      "hash·encrypted bytes·compressed payload를 character column에 넣지 않습니다. BINARY/VARBINARY/BLOB와 encoding boundary를 선택하고 hex/base64는 표현 layer에서만 사용합니다. Unicode decode 오류를 replacement로 조용히 삼키면 identity와 audit가 손상됩니다.",
    ],
    concepts: [
      c("character length", "문자열에서 DBMS가 정의한 문자 단위 길이입니다.", ["byte length와 다를 수 있습니다.", "사용자 grapheme 수와도 일치하지 않을 수 있습니다."]),
      c("binary data", "문자 encoding·collation 의미 없이 bytes로 취급해야 하는 data입니다.", ["hash·ciphertext·file payload에 사용합니다.", "text로 표시할 때만 명시 encoding을 적용합니다."]),
    ],
    codeExamples: [py(
      "db03-unicode-length",
      "문자 수·UTF-8 byte 수·grapheme-like 표시 차이 관찰하기",
      "unicode_length.py",
      "ASCII·한글·emoji·combining sequence가 같은 len/byte/storage 가정을 깨는 경계를 확인합니다.",
      String.raw`samples = [
    ("ascii", "ABC"),
    ("hangul", "가나다"),
    ("emoji", "😀"),
    ("combining", "e\u0301"),
]

for name, value in samples:
    print(f"{name}:codepoints={len(value)}:utf8-bytes={len(value.encode('utf-8'))}")
print("same-codepoints-ascii-hangul=" + str(len(samples[0][1]) == len(samples[1][1])).lower())
print("same-bytes-ascii-hangul=" + str(len(samples[0][1].encode()) == len(samples[1][1].encode())).lower())
print("combining-display=one-grapheme-like")
print("database-contract=charset+collation+length")`,
      "ascii:codepoints=3:utf8-bytes=3\nhangul:codepoints=3:utf8-bytes=9\nemoji:codepoints=1:utf8-bytes=4\ncombining:codepoints=2:utf8-bytes=3\nsame-codepoints-ascii-hangul=true\nsame-bytes-ascii-hangul=false\ncombining-display=one-grapheme-like\ndatabase-contract=charset+collation+length",
      ["mysql-char", "mysql-charset", "sqlite-datatype"],
    )],
    diagnostics: [
      d("한글·emoji 입력에서만 data too long 또는 index 오류가 난다.", "character·byte·index prefix 한계를 ASCII fixture로만 검증했습니다.", ["actual charset/collation과 column length를 봅니다.", "CHAR_LENGTH와 byte length를 비교합니다.", "index key size와 row format을 확인합니다."], "domain 최대 길이와 utf8mb4 worst case를 기준으로 column/index를 재설계합니다.", "multilingual·emoji·combining boundary fixtures를 schema CI에 둡니다."),
      d("대소문자만 다른 external subject가 UNIQUE 충돌한다.", "case-insensitive collation을 case-sensitive identifier에 적용했습니다.", ["column collation과 comparison result를 확인합니다.", "source identity의 case semantics를 확인합니다.", "기존 collision 후보를 preflight합니다."], "identifier에 binary/case-sensitive comparison 또는 canonical key 정책을 선택해 collision을 해소합니다.", "business key마다 normalization·collation ADR과 contract test를 둡니다."),
    ],
    expertNotes: ["Unicode normalization은 보안·검색·identity에 영향을 주며 원문 보존과 canonical key를 분리할 수 있습니다.", "collation version upgrade는 index rebuild와 sort/unique 결과 변화를 일으킬 수 있어 upgrade preflight가 필요합니다."],
  },
  {
    id: "temporal-type-timezone",
    title: "DATE·TIME·DATETIME·TIMESTAMP를 사건 의미와 timezone 계약으로 선택합니다",
    lead: "날짜, 벽시계 시각, UTC instant, 기간은 서로 다른 값입니다. 모두 문자열이나 DATETIME 하나로 넣으면 DST와 지역 변경에서 모순이 생깁니다.",
    explanations: [
      "DATE는 생일·영업일처럼 달력 날짜, TIME은 time-of-day 또는 제한된 duration인지 구분해야 하며 DATETIME/TIMESTAMP의 range·timezone conversion은 MySQL 세부 동작을 확인합니다. 발생 instant는 보통 UTC로 저장하고 표시 timezone을 별도 적용하지만 미래 지역 일정은 zone id와 local rule을 보존해야 할 수 있습니다.",
      "CURRENT_TIMESTAMP default와 ON UPDATE는 편리하지만 created_at·updated_at의 owner와 precision을 명시합니다. 모든 update가 business update인지, migration/backfill이 timestamp를 바꿔도 되는지, application clock과 DB clock 중 source of truth가 무엇인지 결정합니다.",
      "시간 precision은 second, millisecond, microsecond 요구와 driver serialization을 맞춥니다. ordering tie-breaker로 timestamp 하나만 쓰면 같은 precision 내 events 순서가 불안정할 수 있어 sequence/id를 추가합니다.",
      "zero dates, invalid dates, ambiguous DST local time과 leap behavior를 strict mode와 client parser에서 test합니다. date를 formatted VARCHAR로 저장하면 range query·validation·timezone conversion이 각 consumer에 흩어집니다.",
    ],
    concepts: [
      c("instant", "세계 시간선의 한 지점을 나타내며 timezone을 바꿔도 같은 순간입니다.", ["UTC timestamp로 교환할 수 있습니다.", "표시용 local time과 zone을 구분합니다."]),
      c("civil time", "특정 지역 달력과 시계 규칙에서 표현한 날짜·시각입니다.", ["DST rule 변경과 ambiguous/nonexistent time이 있습니다.", "미래 일정은 zone id와 business policy가 필요할 수 있습니다."]),
    ],
    codeExamples: [py(
      "db03-temporal-contract",
      "같은 instant와 서로 다른 지역 표시를 분리하기",
      "temporal_contract.py",
      "고정 UTC instant를 두 timezone에 표시하고 date-only 값이 instant가 아님을 확인합니다.",
      String.raw`from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

instant = datetime(2026, 7, 13, 15, 30, tzinfo=timezone.utc)
seoul = instant.astimezone(ZoneInfo("Asia/Seoul"))
new_york = instant.astimezone(ZoneInfo("America/New_York"))
business_day = date(2026, 7, 14)

print("instant=" + instant.isoformat())
print("seoul=" + seoul.isoformat())
print("new-york=" + new_york.isoformat())
print("business-date=" + business_day.isoformat())`,
      "instant=2026-07-13T15:30:00+00:00\nseoul=2026-07-14T00:30:00+09:00\nnew-york=2026-07-13T11:30:00-04:00\nbusiness-date=2026-07-14",
      ["mysql-date-time", "oracle-relational-structures"],
    )],
    diagnostics: [
      d("한국 자정 근처 event가 미국 report에서 전날로 집계된다.", "UTC instant와 business reporting timezone/date 경계를 명시하지 않았습니다.", ["stored type/value와 session timezone을 봅니다.", "report의 timezone·day boundary를 확인합니다.", "driver serialization에서 offset 손실을 찾습니다."], "instant는 UTC로 보존하고 report마다 명시 business timezone에서 date bucket을 계산합니다.", "timezone/DST/midnight boundary fixtures를 유지합니다."),
      d("migration update가 모든 updated_at을 바꿔 audit 의미가 사라진다.", "automatic ON UPDATE timestamp가 technical backfill과 business change를 구분하지 않습니다.", ["column default/on-update metadata를 확인합니다.", "변경 statement와 trigger를 봅니다.", "business_updated_at과 system_migrated_at 필요를 검토합니다."], "timestamp ownership을 분리하고 migration에서 보존/override 정책을 명시합니다.", "backfill rehearsal에서 audit column invariants를 검사합니다."),
    ],
    expertNotes: ["tz database rule update는 미래 예약의 표시 결과를 바꿀 수 있어 rule version과 사용자 확인 workflow가 필요할 수 있습니다.", "event ordering은 application clock만 믿지 말고 database commit/order id와 distributed causality 요구를 검토합니다."],
  },
  {
    id: "null-semantics-not-null",
    title: "NULL 가능성을 domain 상태와 query 3값 논리로 결정합니다",
    lead: "NULL을 허용할지는 화면 field가 비어 있을 수 있는지가 아니라 해당 사실이 아직 없음·알 수 없음·해당 없음 중 어떤 상태인지에 대한 모델 결정입니다.",
    explanations: [
      "NOT NULL은 모든 허용 row에 값이 있어야 한다는 강한 불변식입니다. 값이 나중에 채워지는 workflow라면 draft relation/state를 분리하거나 nullable+status/reason을 명시합니다. sentinel 빈 문자열·0·1970-01-01로 NULL을 숨기면 aggregate와 validation이 오염됩니다.",
      "SQL NULL 비교는 UNKNOWN을 만들며 WHERE는 TRUE만 남깁니다. = NULL 대신 IS NULL을 쓰는 문법을 넘어 UNIQUE, aggregate COUNT(column), NOT IN, outer join, CHECK에서 NULL이 어떻게 작동하는지 target DBMS로 test합니다.",
      "nullable foreign key는 optional relationship을 표현할 수 있지만 parent 미정, 삭제 후 보존, import 오류를 하나로 섞지 않습니다. 상태 transition이 언제 relation을 필수로 만드는지 service와 deferred validation 경계를 정합니다.",
      "existing nullable column을 NOT NULL로 바꿀 때 default로 일괄 채우기 전에 값 의미를 확인합니다. invalid rows를 owner별로 backfill/quarantine하고 new writes를 먼저 막은 뒤 constraint validation과 readback을 실행합니다.",
    ],
    concepts: [
      c("NULL", "값이 없거나 알 수 없음을 나타내는 SQL marker입니다.", ["빈 문자열·0과 다릅니다.", "comparison·aggregate·constraint에서 3값 논리를 만듭니다."]),
      c("NOT NULL", "column이 모든 stored rows에서 NULL이 아니도록 강제하는 constraint입니다.", ["값의 형식·범위·business 유효성까지 자동 보장하지 않습니다.", "기존 data migration을 먼저 준비합니다."]),
    ],
    diagnostics: [
      d("NOT IN query가 예상과 달리 아무 row도 반환하지 않는다.", "subquery에 NULL이 있어 비교 결과가 UNKNOWN으로 전파됐습니다.", ["subquery key의 NULL count를 확인합니다.", "NOT EXISTS와 결과를 비교합니다.", "foreign key nullable 정책을 봅니다."], "business 의미에 맞는 NOT EXISTS를 사용하거나 NULL을 명시적으로 제외합니다.", "NULL fixture를 포함한 query truth-table tests를 둡니다."),
      d("NOT NULL migration이 production에서 실패한다.", "기존 NULL rows와 concurrent write를 사전 차단·backfill하지 않았습니다.", ["NULL count와 owner/source를 집계합니다.", "write path별 새 NULL 유입을 봅니다.", "online validation/lock 비용을 확인합니다."], "writer validation→backfill/quarantine→constraint apply/validate 순서로 단계화합니다.", "constraint preflight와 dual-write-period invariant monitor를 둡니다."),
    ],
    expertNotes: ["Oracle의 SQL empty-string 처리 등 dialect 차이가 NULL contract에 영향을 주므로 cross-DB tests가 필요합니다.", "analytics에서는 missingness 자체가 signal일 수 있어 imputation 전에 source/reason lineage를 보존합니다."],
  },
  {
    id: "default-omission-generation",
    title: "DEFAULT를 누락 처리·system generation·history semantics로 설계합니다",
    lead: "DEFAULT는 application이 보내지 않은 column에 적용되는 schema 규칙입니다. explicit NULL과 잘못된 값까지 알아서 고치는 만능값이 아닙니다.",
    explanations: [
      "INSERT column list에서 column을 생략하면 default가 적용될 수 있지만 explicit NULL은 nullable이면 NULL을 저장하고 NOT NULL이면 실패합니다. ORM이 모든 columns를 NULL로 bind하면 기대 default가 작동하지 않을 수 있어 generated/insertable behavior를 integration test합니다.",
      "status DEFAULT 'PENDING', created_at DEFAULT CURRENT_TIMESTAMP처럼 생성 시점에 합리적인 system value는 schema default로 일관성을 높일 수 있습니다. 하지만 name DEFAULT '홍길동'처럼 실제로 모르는 값을 가짜 사실로 채우면 analytics와 사용자 workflow를 속입니다.",
      "default 변경은 future inserts에 적용되고 기존 rows를 자동 backfill하는 것과 다릅니다. historical rows를 새 default로 채울지 NULL/old 의미로 보존할지 별도 migration과 provenance 결정을 합니다.",
      "expression default와 temporal function 지원 범위는 version·type마다 다릅니다. nondeterministic 값을 replication·test에서 어떻게 다룰지, default owner가 DB clock인지 application인지 명시합니다.",
    ],
    concepts: [
      c("DEFAULT", "INSERT에서 값을 제공하지 않은 column에 DBMS가 사용할 수 있는 schema-level 값 또는 식입니다.", ["explicit NULL과 다릅니다.", "기존 rows의 자동 backfill을 의미하지 않습니다."]),
      c("generated value", "database 또는 application이 business input 없이 규칙에 따라 만드는 id·timestamp·derived 값입니다.", ["owner와 readback 방법을 명시합니다.", "retry와 replication에서 안정성을 검토합니다."]),
    ],
    codeExamples: [py(
      "db03-default-vs-null",
      "column 생략·DEFAULT와 explicit NULL을 구분하기",
      "default_vs_null.py",
      "DEFAULT가 NULL 대체 연산이 아니라 omitted-value rule임을 세 rows로 관찰합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE task (task_id INTEGER PRIMARY KEY, title TEXT NOT NULL, status TEXT DEFAULT 'PENDING', note TEXT DEFAULT 'none')")
db.execute("INSERT INTO task (task_id, title) VALUES (1, '기본값')")
db.execute("INSERT INTO task (task_id, title, status, note) VALUES (2, '명시값', 'DONE', 'ok')")
db.execute("INSERT INTO task (task_id, title, status, note) VALUES (3, 'NULL값', NULL, NULL)")

rows = list(db.execute("SELECT task_id, status, note FROM task ORDER BY task_id"))
print("row1=" + repr(rows[0]))
print("row2=" + repr(rows[1]))
print("row3=" + repr(rows[2]))
print("default-applies=omitted-only")`,
      "row1=(1, 'PENDING', 'none')\nrow2=(2, 'DONE', 'ok')\nrow3=(3, None, None)\ndefault-applies=omitted-only",
      ["mysql-data-defaults", "mysql-create-table", "sqlite-create-table"],
    )],
    diagnostics: [
      d("DEFAULT CURRENT_TIMESTAMP가 있는데 created_at이 NULL이다.", "ORM이 column을 생략하지 않고 explicit NULL을 bind했거나 column이 nullable입니다.", ["generated SQL과 bind values를 확인합니다.", "column NOT NULL/default metadata를 봅니다.", "ORM insertable/generated 설정을 확인합니다."], "DB-generated column은 INSERT에서 생략하고 NOT NULL/default를 일치시키며 readback합니다.", "real ORM integration test에서 emitted SQL과 stored row를 assertion합니다."),
      d("default status 변경 뒤 old rows와 new rows 의미가 섞인다.", "future default change와 historical data migration/version을 구분하지 않았습니다.", ["row 생성 시기별 status 분포를 봅니다.", "business 의미가 바뀐 시점을 확인합니다.", "consumer가 NULL/old/new를 어떻게 해석하는지 inventory합니다."], "semantic version 또는 explicit backfill policy를 정하고 consumer compatibility를 단계화합니다.", "default 변경 ADR에 old-row semantics와 reconciliation query를 포함합니다."),
    ],
    expertNotes: ["default가 application마다 중복되면 drift하므로 source of truth와 schema/API generation 전략을 정합니다.", "PII·consent·legal status에는 편리한 default보다 explicit user/action evidence가 필요할 수 있습니다."],
  },
  {
    id: "boolean-enum-status-portability",
    title: "boolean·status·enumeration을 값 집합과 변경 전략으로 모델링합니다",
    lead: "TINYINT(1), BOOLEAN alias, CHECK, ENUM, reference table은 비슷해 보여도 portability와 진화 비용이 다릅니다.",
    explanations: [
      "MySQL BOOLEAN은 physical type alias 의미를 확인해야 하며 0/1 외 값이 들어갈 수 있는지 constraint로 test합니다. deleted flag와 deleted_at이 동시에 있으면 두 값의 일관성을 누가 보장하는지 결정하고 가능한 경우 하나의 source of truth와 derived projection을 사용합니다.",
      "작고 안정된 status 집합은 VARCHAR/TINYINT+CHECK로 강제할 수 있습니다. ENUM은 compact하고 제한을 제공하지만 순서·DDL 변경·ORM mapping·cross-DB portability를 검토합니다. 자주 바뀌고 metadata가 있는 code는 reference table과 foreign key가 더 나을 수 있습니다.",
      "status는 단순 allowed values만이 아니라 transition graph입니다. PENDING→ACTIVE는 허용하지만 DELETED→ACTIVE는 별도 restore workflow가 필요할 수 있습니다. CHECK만으로 이전값을 알 수 없으므로 service transaction과 audit event가 transition을 방어합니다.",
      "numeric code를 쓰면 meaning map이 migration·API·analytics에서 동일해야 합니다. magic 0/1/2 대신 named constants, reference data version과 unknown-code fail behavior를 둡니다.",
    ],
    concepts: [
      c("enumerated domain", "column이 가질 수 있는 제한된 named values의 집합입니다.", ["CHECK·ENUM·reference table 등으로 구현할 수 있습니다.", "새 값 추가·폐기·unknown consumer behavior를 설계합니다."]),
      c("state transition", "현재 status에서 다음 status로 이동할 수 있는 허용 방향과 조건입니다.", ["allowed values만으로는 표현되지 않습니다.", "actor·time·reason audit와 transaction을 결합합니다."]),
    ],
    diagnostics: [
      d("deleted=0인데 deleted_at이 채워진 rows가 생긴다.", "같은 상태를 두 columns에 중복 저장하고 invariant를 강제하지 않았습니다.", ["네 조합의 count를 집계합니다.", "write paths와 backfill을 inventory합니다.", "어느 column이 source of truth인지 확인합니다."], "하나를 canonical하게 선택하고 다른 값은 generated/derived하거나 cross-column CHECK와 service rule로 동기화합니다.", "상태 조합 invariant query와 mutation tests를 둡니다."),
      d("새 status를 추가한 뒤 old application이 crash하거나 잘못 처리한다.", "enumeration 확장을 backward-compatible하지 않게 가정했습니다.", ["consumer별 unknown-value behavior를 test합니다.", "DB constraint와 API schema 배포 순서를 봅니다.", "analytics mapping 누락을 확인합니다."], "consumer가 unknown을 안전하게 처리하도록 먼저 배포하고 DB/API producer를 확장합니다.", "enum evolution contract tests와 usage telemetry를 둡니다."),
    ],
    expertNotes: ["status history가 중요하면 current row와 append-only transition events를 함께 설계하고 재생/reconciliation합니다.", "soft delete는 authorization filter, unique key 재사용, foreign key, retention과 backup에서 일관된 policy가 필요합니다."],
  },
  {
    id: "identifier-naming-portability",
    title: "table·column·constraint 이름을 검색·이식·운영 가능한 규칙으로 정합니다",
    lead: "이름은 단순 취향이 아니라 query, migration, error, audit와 dashboard를 연결하는 API입니다.",
    explanations: [
      "snake_case 같은 일관된 규칙, 단수/복수 선택, 명확한 domain 용어와 약어 사전을 정합니다. id, status, name처럼 context 없는 이름은 join과 log에서 모호할 수 있지만 모든 column에 table 이름을 반복하는 것도 noise가 됩니다. 팀 query와 tooling에서 실제 readability를 검토합니다.",
      "reserved word, quote, identifier length, case sensitivity와 file-system behavior는 DBMS·OS별 차이가 있습니다. quoted mixed-case names에 의존하면 migration/ORM/raw SQL에서 지속적인 quote가 필요하므로 portability가 목표라면 단순 lowercase ASCII identifier를 선호할 수 있습니다.",
      "constraint와 index에 uq_account_email, fk_order_customer, ck_amount_positive 같은 의미 있는 이름을 붙이면 error category와 migration diff가 쉬워집니다. 이름 충돌 scope와 vendor length 제한 때문에 deterministic abbreviation/hash 규칙을 둡니다.",
      "rename은 zero-cost cosmetic change가 아닙니다. views, routines, ETL, dashboards, ad hoc reports, CDC consumers와 code generation을 inventory하고 alias/dual-read deprecation window를 설계합니다.",
    ],
    concepts: [
      c("identifier", "database object를 참조하는 table·column·constraint·index 등의 이름입니다.", ["quote·case·length·reserved word 규칙이 있습니다.", "운영 evidence와 migration dependency에 사용됩니다."]),
      c("ubiquitous language", "domain 참여자와 개발자가 같은 개념에 같은 이름을 사용하는 용어 체계입니다.", ["schema 이름을 UI label과 무조건 같게 한다는 뜻은 아닙니다.", "glossary와 owner를 유지합니다."]),
    ],
    diagnostics: [
      d("Windows에서는 되던 table 이름이 Linux 배포 뒤 찾을 수 없다고 나온다.", "identifier case와 file-system/config 차이에 의존했습니다.", ["actual catalog spelling과 generated SQL을 비교합니다.", "lower_case_table_names와 OS 차이를 확인합니다.", "migration history의 quoted identifiers를 inventory합니다."], "일관된 portable naming으로 migration하고 environment matrix에서 exact identifier tests를 실행합니다.", "lowercase naming lint와 Linux CI를 둡니다."),
      d("constraint 오류가 자동 생성 이름만 보여 어떤 rule인지 알 수 없다.", "constraint를 명시적으로 naming하지 않고 error translation map이 없습니다.", ["catalog에서 generated name과 definition을 매핑합니다.", "동일 rule의 environment별 이름 drift를 봅니다.", "application이 raw vendor message를 노출하는지 확인합니다."], "의미 있는 deterministic constraint names를 migration으로 도입하고 stable domain error로 번역합니다.", "schema lint와 error mapping contract test를 둡니다."),
    ],
    expertNotes: ["data mesh/catalog에서는 technical identifier와 business glossary·classification·lineage를 연결하는 metadata id가 필요합니다.", "rename의 CDC schema evolution은 event field compatibility와 replay consumer까지 포함합니다."],
  },
  {
    id: "physical-limits-index-storage",
    title: "type 길이와 NULL·DEFAULT가 row storage·index·memory·network에 미치는 영향을 측정합니다",
    lead: "논리적으로 맞는 schema도 row가 너무 넓거나 index key가 커지고 통계가 부정확하면 production workload에서 실패합니다.",
    explanations: [
      "column 수, row size, variable-length off-page storage, charset worst-case bytes와 index key limit은 engine·row format·version에 따라 다릅니다. table이 생성됐다는 사실만으로 largest valid row와 index가 안전한지 보장되지 않습니다.",
      "VARCHAR를 지나치게 크게 선언하면 일부 temporary table, sort, client allocation, API payload와 validation에 비용을 줄 수 있습니다. 반대로 임의로 짧게 제한하면 legitimate multilingual data가 잘립니다. domain evidence와 growth를 기반으로 선택합니다.",
      "nullable columns에는 null bitmap 등 physical representation이 있고 sparse optional attributes가 많으면 별도 vertical relation이나 JSON을 고려할 수 있지만 queryability·constraint·schema evolution을 교환합니다. EAV는 type·constraint·join·discoverability 비용을 숨길 수 있습니다.",
      "index는 column type·collation·order와 cardinality에 결합됩니다. 긴 text prefix나 low-selectivity status index를 습관적으로 만들지 않고 top query의 equality/range/sort/join과 representative distribution에서 EXPLAIN·latency·write amplification을 측정합니다.",
    ],
    concepts: [
      c("row size", "한 row의 columns와 engine overhead가 차지하는 physical 저장 크기와 제한입니다.", ["variable/off-page storage와 charset 영향을 받습니다.", "largest valid row와 average row를 모두 봅니다."]),
      c("selectivity", "index key가 rows를 얼마나 잘 구분해 검색 범위를 줄이는지 나타내는 특성입니다.", ["data distribution과 predicate에 따라 달라집니다.", "낮은 selectivity라도 composite/order/covering 목적이 있을 수 있습니다."]),
    ],
    diagnostics: [
      d("새 VARCHAR column 추가가 row size too large로 실패한다.", "existing wide columns와 charset/row format의 worst-case를 계산하지 않았습니다.", ["INFORMATION_SCHEMA와 SHOW CREATE TABLE을 봅니다.", "variable/binary/text storage와 row format을 확인합니다.", "실제 값 분포와 largest row를 측정합니다."], "domain별 vertical split, appropriate TEXT/off-page type, 불필요한 columns 제거를 설계하고 online migration합니다.", "schema lint에 width budget과 worst-case calculation을 둡니다."),
      d("모든 status column index를 추가했지만 write만 느려지고 query는 full scan이다.", "low-selectivity single-column index를 workload/plan 없이 만들었습니다.", ["actual EXPLAIN과 rows examined를 봅니다.", "predicate 조합·sort·cardinality를 측정합니다.", "unused index와 write cost를 확인합니다."], "query shape에 맞는 composite index를 benchmark하거나 불필요한 index를 제거합니다.", "index proposal에 target query, plan, benchmark, rollback을 요구합니다."),
    ],
    expertNotes: ["compression과 encryption은 CPU·page layout·backup/restore·observability trade-off를 benchmark합니다.", "data type change가 CDC/warehouse/model feature dtype에 미치는 downstream 비용을 lineage에서 평가합니다."],
  },
  {
    id: "create-table-review-migration",
    title: "CREATE TABLE review를 요구사항·DDL·fixtures·catalog·migration·복구 증거로 완성합니다",
    lead: "전문가 수준 schema는 column 표가 아니라 왜 이 type·NULL·default를 선택했고 실패·변경·복구 때 어떻게 행동하는지 설명할 수 있어야 합니다.",
    explanations: [
      "각 column에 business meaning, owner, type/range/unit, NULL states, default owner, sensitivity, retention, example과 invalid examples를 기록합니다. key·foreign key·check·index는 다음 세션에서 더 깊게 다루되 이 단계에서도 type/NULL/default가 constraint와 호환되는지 검토합니다.",
      "test matrix는 min/max, zero/negative, multilingual, empty/NULL/omitted, duplicate, invalid date, DST, non-finite, overflow, concurrent writes와 old/new application compatibility를 포함합니다. syntax test만으로 production contract를 승인하지 않습니다.",
      "migration은 expand(add nullable/default-compatible), deploy writers/readers, backfill with checkpoints, validate, enforce NOT NULL/constraint, contract(remove old)로 단계화합니다. backfill은 idempotent하고 progress·error·lag·lock budget을 관측하며 중단/재개할 수 있어야 합니다.",
      "release evidence에는 DDL checksum, source inventory, catalog readback, data invariant counts, query plans, load/lock results, backup/restore rehearsal, owner/approval, abort criteria와 post-deploy metrics를 남깁니다. plaintext credential·PII fixture는 포함하지 않습니다.",
    ],
    concepts: [
      c("expand-and-contract", "old/new code가 공존하도록 additive schema를 먼저 만들고 전환·backfill 뒤 old schema를 제거하는 migration pattern입니다.", ["compatibility window와 rollback boundary를 명시합니다.", "destructive contract step을 충분히 늦춥니다."]),
      c("catalog readback", "DDL 적용 뒤 database metadata를 다시 읽어 expected schema와 일치하는지 확인하는 검증입니다.", ["statement 성공만으로 drift를 놓치지 않습니다.", "fleet/replica별 consistency를 확인합니다."]),
    ],
    diagnostics: [
      d("staging migration은 빨랐지만 production에서는 backfill이 replica lag를 유발한다.", "대표 data volume·distribution·write load 없이 빈 staging에서만 rehearsal했습니다.", ["batch size·transaction duration·rows/sec를 봅니다.", "replica lag·IO·lock wait를 확인합니다.", "throttle/pause checkpoint가 있는지 봅니다."], "backfill을 작은 idempotent batches와 adaptive throttle로 중단/재개하고 lag를 회복합니다.", "production-like scale rehearsal과 abort SLO를 둡니다."),
      d("rollback binary가 새 NOT NULL column 때문에 write하지 못한다.", "old application과 enforced schema의 backward compatibility를 확인하지 않았습니다.", ["old binary emitted INSERT columns를 봅니다.", "default/nullable compatibility를 확인합니다.", "constraint 적용 시점과 rollback window를 비교합니다."], "old/new writers가 모두 동작하는 additive state로 되돌리거나 roll-forward fix를 배포합니다.", "각 migration phase에 supported binary matrix를 자동 test합니다."),
    ],
    expertNotes: ["large table online DDL도 instant/in-place/copy behavior와 fallback condition이 있어 exact statement·version·table shape로 rehearsal합니다.", "restore test는 schema와 data뿐 아니라 grants, events, routines, timezone/collation settings와 application acceptance까지 포함합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0121", repository: "local dbstudy snapshot", path: "dbstudy/01_21.sql", usedFor: ["members types·NULL·DEFAULT·check progression"], evidence: "원본을 read-only로 감사했고 plaintext credential·email·전화번호 fixture는 공개 예제에 복제하지 않았습니다." },
  { id: "local-db-0126", repository: "local dbstudy snapshot", path: "dbstudy/01_26.sql", usedFor: ["BOOKTEST CREATE/ALTER type exercises"], evidence: "원본 CREATE TABLE 8개와 ALTER 13개 shape를 확인하고 source를 수정하지 않았습니다." },
  { id: "mysql-create-table", repository: "MySQL 8.4 Reference Manual", path: "CREATE TABLE", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table.html", usedFor: ["DDL·column definitions·table options"], evidence: "MySQL CREATE TABLE 공식 문서입니다." },
  { id: "mysql-data-types", repository: "MySQL 8.4 Reference Manual", path: "Data Types", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/data-types.html", usedFor: ["type family·storage requirements"], evidence: "MySQL data types 공식 문서입니다." },
  { id: "mysql-integer", repository: "MySQL 8.4 Reference Manual", path: "Integer Types", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/integer-types.html", usedFor: ["integer range·signedness"], evidence: "MySQL integer 공식 문서입니다." },
  { id: "mysql-fixed-point", repository: "MySQL 8.4 Reference Manual", path: "Fixed-Point Types", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/fixed-point-types.html", usedFor: ["DECIMAL precision·scale"], evidence: "MySQL exact numeric 공식 문서입니다." },
  { id: "mysql-floating", repository: "MySQL 8.4 Reference Manual", path: "Floating-Point Types", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/floating-point-types.html", usedFor: ["FLOAT·DOUBLE approximation"], evidence: "MySQL approximate numeric 공식 문서입니다." },
  { id: "mysql-out-of-range", repository: "MySQL 8.4 Reference Manual", path: "Out-of-Range and Overflow Handling", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/out-of-range-and-overflow.html", usedFor: ["strict range·overflow"], evidence: "MySQL numeric failure 공식 문서입니다." },
  { id: "mysql-char", repository: "MySQL 8.4 Reference Manual", path: "CHAR and VARCHAR", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/char.html", usedFor: ["character length·padding·storage"], evidence: "MySQL character type 공식 문서입니다." },
  { id: "mysql-charset", repository: "MySQL 8.4 Reference Manual", path: "Character Sets and Collations", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/charset.html", usedFor: ["Unicode·collation"], evidence: "MySQL character/collation 공식 문서입니다." },
  { id: "mysql-date-time", repository: "MySQL 8.4 Reference Manual", path: "Date and Time Types", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/date-and-time-types.html", usedFor: ["DATE·TIME·DATETIME·TIMESTAMP"], evidence: "MySQL temporal type 공식 문서입니다." },
  { id: "mysql-data-defaults", repository: "MySQL 8.4 Reference Manual", path: "Data Type Default Values", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/data-type-defaults.html", usedFor: ["implicit·explicit defaults"], evidence: "MySQL default value 공식 문서입니다." },
  { id: "mysql-null", repository: "MySQL 8.4 Reference Manual", path: "Problems with NULL Values", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/problems-with-null.html", usedFor: ["NULL comparison·aggregate"], evidence: "MySQL NULL 공식 문서입니다." },
  { id: "oracle-relational-structures", repository: "Oracle AI Database 26ai Concepts", path: "Oracle Relational Structures", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/oracle-relational-structures.html", usedFor: ["Oracle types·NULL·constraints portability"], evidence: "Oracle 관계 구조 공식 문서입니다." },
  { id: "sqlite-create-table", repository: "SQLite Documentation", path: "CREATE TABLE", publicUrl: "https://www.sqlite.org/lang_createtable.html", usedFor: ["메모리 exact DDL lab"], evidence: "SQLite CREATE TABLE 공식 문서입니다." },
  { id: "sqlite-datatype", repository: "SQLite Documentation", path: "Datatypes In SQLite", publicUrl: "https://www.sqlite.org/datatype3.html", usedFor: ["dynamic typing·affinity lab boundary"], evidence: "SQLite typing 공식 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-03-create-table-types-null-default",
  slug: "db-03-create-table-types-null-default",
  courseId: "database",
  moduleId: "db-foundation-ddl",
  order: 3,
  title: "CREATE TABLE, 자료형, NULL과 DEFAULT 선택",
  subtitle: "DDL 문법에서 시작해 수치·문자·시간 domain, NULL 3값 논리, DEFAULT ownership, 물리 한계와 무중단 migration까지 검증합니다.",
  level: "입문",
  estimatedMinutes: 780,
  coreQuestion: "각 column의 type·NULL·DEFAULT를 어떤 근거로 선택해야 값의 의미, 범위, 이식성, 성능과 schema evolution이 함께 안전할까요?",
  summary: "dbstudy/01_21.sql의 members table progression과 01_26.sql의 BOOKTEST CREATE/ALTER 연습을 read-only로 감사합니다. CREATE TABLE을 schema contract와 migration으로 읽고, integer·DECIMAL·floating point의 range/precision, CHAR·VARCHAR·TEXT·binary의 Unicode/collation/length, DATE·TIME·DATETIME·TIMESTAMP의 instant/civil-time 의미, NULL 3값 논리와 NOT NULL migration, omitted value와 explicit NULL을 구분하는 DEFAULT, boolean/status enumeration과 transition, portable identifier naming, row/index physical limits, expand-and-contract review evidence까지 초급에서 production 수준으로 연결합니다. 다섯 Python·SQLite 예제는 외부 DB 없이 portable 개념을 exact output으로 실행하되 MySQL 8.4·Oracle 26ai integration evidence와 명확히 분리합니다.",
  objectives: [
    "CREATE TABLE을 column 목록이 아니라 허용 상태·version·migration의 schema contract로 해석한다.",
    "integer·DECIMAL·FLOAT/DOUBLE을 범위·단위·정밀도·오차 정책으로 선택한다.",
    "문자·binary type을 Unicode character/byte/grapheme와 collation·index 요구로 선택한다.",
    "DATE·TIME·DATETIME·TIMESTAMP를 date·civil time·instant·duration 의미로 구분한다.",
    "NULL·빈 값·unknown·not applicable을 구분하고 NOT NULL migration을 단계화한다.",
    "DEFAULT가 omitted value에 적용되는 규칙임을 ORM·history와 함께 검증한다.",
    "boolean·status·enumeration의 allowed values와 transition·portability를 설계한다.",
    "row/index physical limits와 expand-and-contract, catalog readback, 복구 evidence를 검토한다.",
  ],
  prerequisites: [{ title: "안전한 database·account boundary", reason: "DDL을 실행할 migration identity와 runtime identity를 분리해야 합니다.", sessionSlug: "db-02-mysql-database-user-grant" }],
  keywords: ["CREATE TABLE", "DDL", "INT", "BIGINT", "DECIMAL", "FLOAT", "VARCHAR", "TEXT", "Unicode", "collation", "DATE", "TIMESTAMP", "NULL", "NOT NULL", "DEFAULT", "ENUM", "row size", "expand-and-contract"],
  topics,
  lab: {
    title: "다국어 학습 콘텐츠·가격·일정 table을 type-safe하게 설계하고 진화시키기",
    scenario: "lesson catalog에는 한국어·emoji 제목, 난이도와 상태, 통화별 가격, 게시 instant와 지역 일정, 선택 메모가 있습니다. old application을 중단하지 않고 새 status와 NOT NULL publish policy를 도입해야 합니다.",
    setup: ["synthetic fixture만 사용하는 작업 폴더를 준비합니다.", "portable concept는 Python sqlite3, vendor contract는 격리 MySQL 8.4/Oracle 26ai 환경으로 분리합니다.", "예상 최대 길이·금액·row 수·timezone·retention을 수치로 적습니다.", "old/new application emitted SQL과 expected schema manifest를 준비합니다."],
    steps: [
      "모든 attributes의 단위·범위·NULL states·default owner·sensitivity를 표로 작성합니다.",
      "price는 DECIMAL precision/scale과 currency를, identifier는 growth horizon과 signedness/portability를 결정합니다.",
      "title/note의 character·byte·grapheme limits와 collation/normalization을 정합니다.",
      "publish instant와 local schedule/date를 서로 다른 temporal contract로 모델링합니다.",
      "omitted/default, explicit NULL, empty, invalid, min/max/overflow fixtures를 작성합니다.",
      "SQLite portable examples와 MySQL/Oracle dialect DDL을 분리해 실행 결과를 기록합니다.",
      "catalog readback으로 type·NULL·default·constraint가 expected manifest와 같은지 확인합니다.",
      "old/new writer compatibility를 유지하는 expand→backfill→validate→enforce→contract phases를 설계합니다.",
      "representative volume에서 row width, index plan, DDL lock/time과 replication lag를 측정합니다.",
      "rollback/roll-forward, backup/restore, invariant queries와 post-deploy metrics를 승인 packet으로 묶습니다.",
    ],
    expectedResult: ["각 column의 type·NULL·default가 business 근거와 반례를 가집니다.", "다국어·decimal·timezone·omitted/NULL boundary가 exact tests로 검증됩니다.", "expected/actual catalog drift가 0건입니다.", "old/new binary가 모든 migration phase에서 지원 matrix대로 동작합니다.", "DDL lock·backfill·replication·restore가 수치화한 budget 안에 있습니다."],
    cleanup: ["메모리 SQLite 연결과 owned test files를 제거합니다.", "격리 vendor test schema를 migration identity로만 제거합니다.", "test credentials를 revoke하고 log/history에 secret이 없는지 확인합니다.", "results에는 synthetic rows와 redacted metadata만 남깁니다."],
    extensions: ["MySQL 8.4와 Oracle 26ai type mapping contract를 자동 비교합니다.", "ORM migration generator가 emitted DDL과 catalog를 정확히 맞추는지 test합니다.", "10억 id·다중 currency·DST rule update 시나리오를 추가합니다.", "online DDL 중 failover와 backfill 재시작을 fault injection합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 다시 작성하고 schema evidence와 data evidence를 별도 표로 기록하세요.", requirements: ["외부 DB와 개인정보를 사용하지 않습니다.", "각 example stdout을 완전 일치시킵니다.", "SQLite와 MySQL/Oracle 차이를 한 줄씩 적습니다.", "omitted/default와 explicit NULL을 반드시 비교합니다.", "Unicode character와 byte 길이를 비교합니다."], hints: ["DDL 문자열만 보고 성공했다고 결론 내리지 말고 catalog를 읽으세요."], expectedOutcome: "type·NULL·default의 핵심 경계를 실행 결과로 재현합니다.", solutionOutline: ["contract→DDL→catalog→fixtures→exact output→dialect note 순서로 작성합니다."] },
    { difficulty: "응용", prompt: "원본 members schema를 credential·연락처·provider·soft-delete·timestamps 관점에서 type-safe하게 재설계하세요.", requirements: ["원본 plaintext credential/PII 값을 복제하지 않습니다.", "password hash의 binary/text storage와 algorithm metadata를 설계합니다.", "email/phone/display name의 charset·collation·length를 결정합니다.", "deleted flag와 deleted_at 불변식을 정리합니다.", "provider/status enumeration과 evolution을 설계합니다.", "created/updated/deleted temporal ownership을 정의합니다.", "기존 rows를 안전하게 migrate하는 phases를 작성합니다."], hints: ["가짜 default가 unknown을 숨기지 않는지 확인하세요."], expectedOutcome: "보안·identity·Unicode·history·migration까지 닫힌 회원 schema가 완성됩니다.", solutionOutline: ["source audit→domain table→target DDL→collision/invalid preflight→phased migration→readback 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 database type·NULL·default 표준과 schema evolution gate를 작성하세요.", requirements: ["수치·통화·문자·binary·temporal·boolean/status decision table을 만듭니다.", "vendor portability와 strict mode를 포함합니다.", "PII·retention·encryption classification을 포함합니다.", "catalog lint와 boundary fixtures를 정의합니다.", "online DDL/backfill lock·lag·time budgets를 정의합니다.", "binary compatibility matrix와 destructive approval를 정의합니다.", "backup/restore rehearsal과 post-deploy SLO를 정의합니다."], hints: ["표준은 VARCHAR 길이 숫자 모음이 아니라 판단 질문과 검증 evidence를 제공해야 합니다."], expectedOutcome: "새 table과 migration을 자동·수동 evidence로 일관되게 승인하는 전문가 표준이 완성됩니다.", solutionOutline: ["domain semantics→type rules→negative tests→migration phases→operations→governance 순서로 작성합니다."] },
  ],
  nextSessions: ["db-04-primary-foreign-unique-check"],
  sources,
  sourceCoverage: {
    filesRead: 2,
    filesUsed: 2,
    uncoveredNotes: [
      "inventory의 dbstudy/01_21.sql과 dbstudy/01_26.sql을 모두 read-only로 확인했습니다.",
      "01_21.sql의 plaintext credential·email·전화번호 rows는 공개 예제·출력·hash 목록에 복제하지 않았습니다.",
      "01_26.sql의 CREATE/ALTER 학습 shape를 사용하되 실제 local schema나 DB server에는 실행하지 않았습니다.",
      "다섯 exact examples는 Python 표준 라이브러리와 메모리 SQLite를 사용하며 MySQL·Oracle server execution evidence로 주장하지 않습니다.",
    ],
  },
});

export default session;
