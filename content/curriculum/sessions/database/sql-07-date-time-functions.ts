import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const count = code.split("\n").length;
  const first = Math.max(1, Math.floor(count / 3));
  const second = Math.max(first + 1, Math.floor((count * 2) / 3));
  return {
    id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: `1-${first}`, explanation: "Python sqlite3와 datetime 표준 라이브러리로 fixed synthetic instants·dates·ranges를 준비합니다." },
      { lines: `${first + 1}-${second}`, explanation: "half-open filtering, offset/instant conversion, strict parse, month policy 또는 injected clock duration을 실행합니다." },
      { lines: `${second + 1}-${count}`, explanation: "exact ISO/key/duration stdout을 기록합니다. SQLite/Python 결과를 MySQL 8.4·Oracle 26ai temporal type/time-zone semantics로 일반화하지 않습니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3·datetime·calendar", "외부 DB·network·system clock·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 완전히 같아야 합니다.", "모든 시간·identifier는 fixed synthetic fixture이며 원본 사용자/업무 timestamp를 복제하지 않습니다."] },
    experiments: [
      { change: "range end를 inclusive 23:59:59로 바꾸거나 fractional precision row를 추가합니다.", prediction: "마지막 순간의 row가 누락되거나 다음 기간과 중복될 수 있습니다.", result: "기간은 [start,end)와 next-boundary 계산으로 표현합니다." },
      { change: "fixed instant/clock 대신 session zone·CURRENT_TIMESTAMP를 직접 사용합니다.", prediction: "timezone·DST·실행 시각에 따라 stdout과 selected rows가 달라집니다.", result: "clock source·zone·precision을 dependency와 contract로 고정합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "temporal-domain-types",
    title: "생일·영업일·현지 예약·세계 instant·기간을 하나의 DATETIME 문자열로 저장하지 않습니다",
    lead: "시간 data의 첫 질문은 format이 아니라 이것이 달력 날짜인지, wall time인지, UTC instant인지, duration/interval인지입니다.",
    explanations: [
      "DATE는 time-of-day 없이 달력 날짜를, TIME은 문맥에 따라 wall clock 또는 duration처럼 보일 수 있으므로 DB type semantics를 확인합니다. local date-time은 zone 없이 2026-07-14 09:00을 표현하고 instant는 세계 timeline의 한 지점으로 UTC/offset과 연결됩니다.",
      "MySQL DATE/DATETIME/TIMESTAMP의 range, fractional precision, session time-zone conversion 차이를 8.4 manual로 확인합니다. Oracle DATE는 이름과 달리 time fields를 포함하며 TIMESTAMP WITH TIME ZONE/LOCAL TIME ZONE의 stored/display semantics가 다릅니다. type name만 1:1 mapping하지 않습니다.",
      "business rule이 서울 매일 오전 9시라면 UTC instant 하나가 아니라 local time+IANA zone+recurrence policy가 필요합니다. 이미 발생한 event audit은 instant와 source offset/zone, schedule definition version을 구분해 저장합니다.",
      "year/month, date-only, duration을 arbitrary string이나 epoch zero sentinel로 저장하지 않습니다. domain type, allowed range·precision·calendar와 unknown/not-applicable state를 schema/API/Java/Python mapping에 명시합니다.",
    ],
    concepts: [c("instant", "UTC timeline에서 유일하게 식별되는 한 시점입니다.", ["offset/zone을 통해 local representation으로 바꿉니다.", "Java Instant 등에 mapping합니다."]), c("wall time", "특정 지역의 달력과 시계에 보이는 local date-time 표현입니다.", ["zone 없이는 instant가 아닙니다.", "DST gap/fold policy가 필요합니다."])],
    diagnostics: [d("다른 지역 사용자가 예약을 보면 하루/한 시간씩 이동하거나 생일이 전날로 보인다.", "date-only·local schedule·instant를 같은 UTC conversion pipeline에 넣었습니다.", ["field별 domain meaning과 DB catalog type을 적습니다.", "driver/JVM/session zone conversion을 추적합니다.", "date-only와 DST boundary fixtures를 실행합니다."], "DATE/local datetime+IANA zone/UTC instant 등 의미에 맞는 type과 mapping으로 staged migration합니다.", "temporal field마다 semantic type·zone·precision contract와 cross-zone tests를 둡니다.")],
    expertNotes: ["historical/civil time은 timezone database rule changes를 받을 수 있어 zone id와 tzdb version·recalculation policy를 보존합니다.", "timestamp ordering이 causality를 보장하지 않으므로 distributed event ordering에는 sequence/version/vector 등 별도 mechanism을 검토합니다."],
  },
  {
    id: "precision-storage-serialization",
    title: "fractional precision·range·round/truncate와 ISO/RFC serialization을 end-to-end로 고정합니다",
    lead: "DB microseconds, Java nanoseconds, JSON milliseconds가 섞이면 equality cursor·deduplication·half-open boundary에서 값이 조용히 달라집니다.",
    explanations: [
      "column fractional seconds precision과 driver mapping precision을 확인합니다. writer가 nanoseconds를 보내고 DB가 microseconds로 round/truncate하면 read-after-write equality와 optimistic token이 깨질 수 있습니다. canonical precision으로 ingest 전에 normalize하거나 returned stored value를 authoritative하게 사용합니다.",
      "epoch integer는 unit을 column 이름과 schema에 명시합니다. seconds/milliseconds/microseconds를 magnitude로 추측하지 않고 checked conversion과 range bounds를 적용합니다. 32-bit epoch와 language/driver integer limits도 검증합니다.",
      "외부 instant serialization은 ISO 8601/RFC 3339 profile과 explicit offset을 사용하고 parser가 허용할 fractional digits, uppercase Z, offset range와 leap-second policy를 명시합니다. locale display string을 API 저장 format으로 재사용하지 않습니다.",
      "round-trip test는 original instant, DB stored precision, returned driver type, JSON bytes와 reparsed instant를 비교합니다. logs에는 user activity timestamp를 불필요하게 raw query와 함께 노출하지 않고 bounded latency/age category를 사용합니다.",
    ],
    concepts: [c("fractional precision", "second 아래 소수 자릿수를 어느 resolution으로 저장·반환하는지 정한 속성입니다.", ["round/truncate policy가 필요합니다.", "cursor/equality에 영향이 있습니다."]), c("RFC 3339 timestamp", "Internet date-time interchange를 위한 ISO 8601 profile의 offset 포함 timestamp 표현입니다.", ["API grammar를 고정합니다.", "local display format과 분리합니다."])],
    diagnostics: [d("insert한 timestamp를 즉시 조회했는데 equality가 실패하고 cursor가 같은 event를 다시 준다.", "client nanosecond와 DB micro/millisecond precision이 달라 stored value가 round/truncate되었습니다.", ["column precision과 bind/getter type을 봅니다.", "before-bind/stored/readback epoch units를 비교합니다.", "cursor serialization digits를 확인합니다."], "authoritative precision/unit으로 normalize하고 stored readback을 token에 사용하며 historical cursors를 versioning합니다.", "max precision·boundary round-trip vectors를 DB/driver/API CI에 둡니다.")],
    expertNotes: ["floating-point epoch seconds는 큰 instant에서 subsecond precision을 잃을 수 있어 integer+unit 또는 temporal type을 선호합니다.", "RFC 3339 syntactic validity가 business range·timezone authorization을 보장하지 않으므로 별도 validation이 필요합니다."],
  },
  {
    id: "timezone-dst-gap-fold",
    title: "IANA timezone과 DST gap·fold를 offset 하나 또는 server default로 단순화하지 않습니다",
    lead: "DST 종료에는 같은 local 01:30이 두 instant를 가리키고 시작에는 존재하지 않는 local 시간이 생길 수 있습니다.",
    explanations: [
      "offset +09:00은 특정 순간의 UTC 차이일 뿐 미래/과거 daylight-saving rule을 포함하지 않습니다. recurring schedule에는 Asia/Seoul, America/New_York 같은 IANA zone id와 rule source가 필요하고, 발생 event에는 resolved instant와 필요하면 original local/offset을 보존합니다.",
      "fold에서는 same wall fields와 다른 offsets가 두 instants를 만듭니다. gap local time은 reject, shift-forward, next-valid 또는 user choice 중 policy를 정합니다. parser/library default가 조용히 하나를 고르는 것을 product 정책으로 받아들이지 않습니다.",
      "example은 2024-11-03 05:30Z와 06:30Z를 각각 -04:00/-05:00으로 표시해 같은 01:30이지만 3600초 차이임을 deterministic하게 보여 줍니다. real production resolution은 Python ZoneInfo/Java ZonedDateTime과 installed tzdb version으로 contract test합니다.",
      "DB session timezone, JVM default, container OS TZ, connection pool reuse와 user profile zone을 request마다 명시적으로 설정/전달합니다. SQL CURRENT_TIMESTAMP, conversion functions와 driver getters가 어느 zone에서 평가되는지 trace합니다.",
    ],
    concepts: [c("IANA time zone", "지역 이름과 역사·미래 offset transition rules를 가진 timezone identifier입니다.", ["fixed offset보다 풍부합니다.", "tzdb version을 관리합니다."]), c("DST fold", "clock이 뒤로 이동해 같은 local date-time이 두 instants에 대응하는 중복 구간입니다.", ["offset/fold 선택이 필요합니다.", "wall time만 저장하면 모호합니다."])],
    codeExamples: [py(
      "sql07-dst-fold-instants",
      "같은 local 01:30과 서로 다른 offsets·UTC instants",
      "dst_fold_instants.py",
      "system timezone database 없이 fixed synthetic UTC instants와 당시 offsets로 fold ambiguity의 invariant를 재현합니다.",
      String.raw`from datetime import datetime, timedelta, timezone

first = datetime(2024, 11, 3, 5, 30, tzinfo=timezone.utc)
second = datetime(2024, 11, 3, 6, 30, tzinfo=timezone.utc)
early = first.astimezone(timezone(timedelta(hours=-4)))
late = second.astimezone(timezone(timedelta(hours=-5)))

print("first-local=" + early.strftime("%Y-%m-%d %H:%M %z"))
print("second-local=" + late.strftime("%Y-%m-%d %H:%M %z"))
print("same-wall-time=" + str(early.replace(tzinfo=None) == late.replace(tzinfo=None)).lower())
print("distinct-instants=" + str(first != second).lower())
print("elapsed-seconds=" + str(int((second - first).total_seconds())))`,
      "first-local=2024-11-03 01:30 -0400\nsecond-local=2024-11-03 01:30 -0500\nsame-wall-time=true\ndistinct-instants=true\nelapsed-seconds=3600",
      ["mysql-timezone", "oracle-datetime", "python-zoneinfo", "java-zoneddatetime"],
    )],
    diagnostics: [d("DST 종료일 예약 두 건이 같은 local text로 덮어써지거나 한 건만 조회된다.", "local datetime을 unique key/instant로 사용하고 fold offset 선택을 저장하지 않았습니다.", ["UTC instant·zone id·offset·fold를 비교합니다.", "tzdb versions와 parse defaults를 확인합니다.", "unique/index/business key를 봅니다."], "instant 또는 local+zone+disambiguation key를 모델링하고 중복 rows를 owner-approved migration으로 분리합니다.", "gap/fold 양방향·tzdb upgrade contract tests를 둡니다.")],
    expertNotes: ["정부가 timezone rules를 바꾸면 미래 schedule instants를 재계산할지 기존 resolution을 고정할지 product/legal policy가 필요합니다.", "tzdb package가 없는 Windows/container에서는 ZoneInfo load가 실패할 수 있어 deployment dependency와 fallback fail-closed를 검증합니다."],
  },
  {
    id: "half-open-period-ranges",
    title: "기간 조회는 start <= value AND value < next_start의 half-open range로 표현합니다",
    lead: "하루/월 끝을 23:59:59로 만드는 방식은 fractional precision 증가와 timezone 변환에서 마지막 rows를 놓칩니다.",
    explanations: [
      "[start,end)는 adjacent periods가 overlap 없이 정확히 이어지고 end instant를 다음 period start로 재사용할 수 있습니다. 월 조회는 local calendar에서 month start와 next month start를 계산한 뒤 instant storage라면 zone rule로 각각 resolve해 UTC boundaries를 얻습니다.",
      "BETWEEN은 양 끝 inclusive이므로 timestamp 기간에서 next start를 end로 넣으면 다음 period boundary row가 중복됩니다. date-only domain의 inclusive range와 instant range를 구분하고 query name에 semantics를 드러냅니다.",
      "원본 01_29.sql은 active INTERVAL3·BETWEEN3과 date predicates를, 02_03.sql은 date functions와 recent/day/month examples를 제시합니다. example은 fractional .500 row가 inclusive truncated end에서는 빠지고 half-open March range에는 포함됨을 보여 줍니다.",
      "column에 DATE(timestamp)를 적용해 day를 비교하면 일반 timestamp index sargability를 잃을 수 있습니다. parameter boundaries를 미리 계산해 raw column range를 사용하고 composite tenant+time index와 partition pruning을 actual plan으로 확인합니다.",
    ],
    concepts: [c("half-open interval", "start는 포함하고 end는 제외하는 [start,end) 기간 표현입니다.", ["adjacent 기간이 겹치지 않습니다.", "fractional precision에 안전합니다."]), c("calendar boundary", "timezone/calendar rule로 계산한 day/month/year의 시작과 다음 시작입니다.", ["고정 24시간과 다를 수 있습니다.", "instant storage에는 zone resolution이 필요합니다."])],
    codeExamples: [py(
      "sql07-half-open-range",
      "fractional end row를 포함하고 next-period boundary를 제외",
      "half_open_range.py",
      "ISO-sortable synthetic timestamps에서 March [start,April start)와 23:59:59 inclusive range selected ids를 비교합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE event (event_id INTEGER PRIMARY KEY, occurred_at TEXT NOT NULL)")
db.executemany("INSERT INTO event VALUES (?, ?)", [(1, "2026-03-01 00:00:00"), (2, "2026-03-31 23:59:59"), (3, "2026-04-01 00:00:00"), (4, "2026-02-28 23:59:59"), (5, "2026-03-31 23:59:59.500")])

half_open = [row[0] for row in db.execute("SELECT event_id FROM event WHERE occurred_at >= ? AND occurred_at < ? ORDER BY event_id", ("2026-03-01 00:00:00", "2026-04-01 00:00:00"))]
closed = [row[0] for row in db.execute("SELECT event_id FROM event WHERE occurred_at BETWEEN ? AND ? ORDER BY event_id", ("2026-03-01 00:00:00", "2026-03-31 23:59:59"))]
print("half-open=" + ",".join(map(str, half_open)))
print("closed-truncated=" + ",".join(map(str, closed)))
print("fractional-boundary-included=" + str(5 in half_open).lower())
print("next-period-excluded=" + str(3 not in half_open).lower())`,
      "half-open=1,2,5\nclosed-truncated=1,2\nfractional-boundary-included=true\nnext-period-excluded=true",
      ["local-db-0129", "mysql-date-types", "sqlite-datefunc", "sqlite-datatype"],
    )],
    diagnostics: [d("월말 fractional-second rows가 report에서 빠지거나 다음 달 boundary가 두 report에 나온다.", "inclusive 23:59:59 end 또는 BETWEEN next-start를 사용했습니다.", ["column precision과 exact boundary rows를 봅니다.", "query operators와 bound zones를 확인합니다.", "adjacent periods union/intersection ids를 계산합니다."], "calendar에서 start/next-start를 계산하고 raw timestamp에 >=/< half-open predicate를 적용합니다.", "모든 precision과 adjacent period coverage/no-overlap property tests를 둡니다.")],
    expertNotes: ["local day가 DST 때문에 23/25시간일 수 있어 start instant+24h로 next local day를 만들지 않습니다.", "bitemporal valid/system periods도 half-open conventions와 zero-length/overlap constraints를 명시합니다."],
  },
  {
    id: "format-parse-validation",
    title: "DATE_FORMAT·TO_CHAR는 presentation, strict parse는 ingestion boundary로 분리합니다",
    lead: "사람에게 보여 줄 locale format을 DB 저장·comparison·API interchange에 재사용하면 ambiguous day/month와 lexical ordering bug가 생깁니다.",
    explanations: [
      "MySQL DATE_FORMAT/STR_TO_DATE, Oracle TO_CHAR/TO_TIMESTAMP와 format models는 tokens와 locale/session settings가 다릅니다. 같은 percent-m 또는 MM처럼 보이는 문법을 섞지 않고 adapter별 golden vectors와 invalid input behavior를 실행합니다.",
      "parser는 exact grammar, locale, zone/offset requirement, fractional precision, range와 trailing characters를 검증합니다. lenient normalization이 2월 30일을 다음 달로 넘기거나 partial input을 받지 않게 strict mode와 readback comparison을 사용합니다.",
      "API interchange는 RFC 3339 offset timestamp 또는 domain-specific date grammar를 사용하고 database display function은 user locale presentation/report에 제한합니다. sorting/filtering은 formatted string이 아니라 temporal typed column에서 수행합니다.",
      "example은 fixed local datetime strict parse, ISO round-trip, SQLite year-month formatting과 invalid date rejection을 deterministic하게 기록합니다. 이는 MySQL/Oracle format token이나 timezone parse를 대신하지 않습니다.",
    ],
    concepts: [c("format model", "temporal value와 문자열 사이 변환에서 year/month/day/time/zone token을 정의한 pattern입니다.", ["DBMS마다 문법이 다릅니다.", "session locale 영향을 확인합니다."]), c("strict parsing", "문자열 전체가 승인 grammar와 실제 calendar/timezone validity를 만족할 때만 temporal value로 받아들이는 처리입니다.", ["trailing/invalid dates를 거부합니다.", "business range도 별도 검증합니다."])],
    codeExamples: [py(
      "sql07-format-parse-strict",
      "strict parse·ISO round-trip·SQLite month formatting",
      "format_parse_strict.py",
      "고정 문자열이 exact format으로 round-trip하고 invalid calendar date가 거부되는지 확인합니다.",
      String.raw`import sqlite3
from datetime import datetime

db = sqlite3.connect(":memory:")
raw = "2026-07-14 09:05:06"
parsed = datetime.strptime(raw, "%Y-%m-%d %H:%M:%S")
month = db.execute("SELECT strftime('%Y-%m', ?)", (raw,)).fetchone()[0]
try:
    datetime.strptime("2026-02-30", "%Y-%m-%d")
    invalid_accepted = True
except ValueError:
    invalid_accepted = False
print("iso=" + parsed.isoformat())
print("round-trip=" + parsed.strftime("%Y-%m-%d %H:%M:%S"))
print("sqlite-month=" + month)
print("invalid-date-accepted=" + str(invalid_accepted).lower())
print("locale-independent=true")`,
      "iso=2026-07-14T09:05:06\nround-trip=2026-07-14 09:05:06\nsqlite-month=2026-07\ninvalid-date-accepted=false\nlocale-independent=true",
      ["mysql-date-func", "oracle-format-models", "sqlite-datefunc", "python-datetime", "rfc3339"],
    )],
    diagnostics: [d("03/04/2026 import가 locale에 따라 3월 4일 또는 4월 3일로 저장된다.", "display locale format을 ingestion grammar로 사용하고 session defaults에 의존했습니다.", ["raw source metadata와 parser locale/format을 확인합니다.", "round-trip과 invalid/trailing cases를 실행합니다.", "stored affected range를 independent source와 비교합니다."], "source별 explicit strict format/zone을 요구하고 ambiguous rows를 quarantine·owner review 후 idempotent repair합니다.", "import schema에 format/version/timezone과 invalid-case golden vectors를 둡니다.")],
    expertNotes: ["format string을 사용자 입력에서 SQL에 interpolation하면 injection/CPU abuse surface가 될 수 있어 allowlisted report formats만 제공합니다.", "localized month/day names는 locale data version과 session NLS 설정을 배포 manifest에 포함합니다."],
  },
  {
    id: "month-year-arithmetic-policy",
    title: "월·년 연산의 말일·윤년 policy를 duration seconds와 구분합니다",
    lead: "1월 31일에 한 달을 더한 결과는 28/29일 clamp, overflow to March, reject 등 여러 합리적 policy가 가능하므로 함수 default를 business rule로 숨기지 않습니다.",
    explanations: [
      "calendar month는 고정 초 수가 아닙니다. subscription billing, maturity, reminder에서 end-of-month preservation, clamp-to-last-day, overflow, skip-invalid 중 어떤 policy를 쓸지 domain owner가 정하고 leap year·negative month·multi-month vectors를 제공합니다.",
      "원본 01_29.sql은 INTERVAL DAY/MONTH/YEAR를, 02_03.sql은 DATE_ADD/DATE_SUB 각각 3회와 DATEDIFF를 제시합니다. example은 explicit clamp policy와 SQLite 2024-01-31 +1 month default가 다름을 보여 주어 vendor function default를 portable rule로 오해하지 않게 합니다.",
      "Oracle ADD_MONTHS와 interval arithmetic, MySQL DATE_ADD, SQLite modifiers, Java plusMonths의 end-of-month behavior를 actual versions에서 비교합니다. application과 DB가 같은 operation을 중복 수행하지 않고 authoritative layer와 rule version을 정합니다.",
      "year addition의 leap-day, business day/holiday calendar와 timezone-local schedule도 별도 policy가 필요합니다. holiday data source/version, cutoff time과 reprocessing/rollback을 temporal rule evidence에 포함합니다.",
    ],
    concepts: [c("calendar arithmetic", "day/month/year field와 calendar validity 규칙으로 date/time을 이동하는 연산입니다.", ["fixed seconds와 다릅니다.", "말일/윤년 policy가 필요합니다."]), c("end-of-month policy", "target month에 source day가 없을 때 clamp·overflow·reject·preserve-last-day 중 선택한 규칙입니다.", ["domain이 결정합니다.", "rule version을 보존합니다."])],
    codeExamples: [py(
      "sql07-month-arithmetic-policy",
      "explicit clamp와 SQLite month modifier 결과 비교",
      "month_arithmetic_policy.py",
      "윤년/평년 January 31에 한 달을 더하는 clamp policy와 SQLite default를 exact 비교합니다.",
      String.raw`import calendar
import sqlite3
from datetime import date

def add_month_clamped(value, months):
    index = value.year * 12 + value.month - 1 + months
    year, zero_based_month = divmod(index, 12)
    month = zero_based_month + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)

db = sqlite3.connect(":memory:")
sqlite_value = db.execute("SELECT date('2024-01-31', '+1 month')").fetchone()[0]
clamped_2024 = add_month_clamped(date(2024, 1, 31), 1).isoformat()
print("policy-clamp-2024=" + clamped_2024)
print("policy-clamp-2023=" + add_month_clamped(date(2023, 1, 31), 1).isoformat())
print("sqlite-default-2024=" + sqlite_value)
print("same-policy=" + str(sqlite_value == clamped_2024).lower())`,
      "policy-clamp-2024=2024-02-29\npolicy-clamp-2023=2023-02-28\nsqlite-default-2024=2024-03-02\nsame-policy=false",
      ["local-db-0129", "local-db-0203", "mysql-date-func", "oracle-datetime", "sqlite-datefunc", "python-datetime"],
    )],
    diagnostics: [d("월 구독 갱신일이 DB와 Java에서 February/March로 갈리고 이중 청구가 생긴다.", "month addition default와 end-of-month policy가 layer마다 다릅니다.", ["원본 date·rule version·DB/app results를 비교합니다.", "leap/negative/multiple month vectors를 실행합니다.", "job idempotency와 charged events를 봅니다."], "authoritative calendar policy를 한 service/library에 versioning하고 affected schedules/charges를 reconcile합니다.", "말일·윤년·DST·retry property tests와 billing audit를 둡니다.")],
    expertNotes: ["calendar policy 변경은 미래 schedule만 재계산할지 이미 issued documents도 변경할지 legal/accounting 판단이 필요합니다.", "business calendar data가 외부 source이면 effective dates·version·missing holiday fallback을 fail-closed로 정의합니다."],
  },
  {
    id: "duration-elapsed-calendar-time",
    title: "elapsed duration·calendar period·wall-clock difference를 서로 다른 계산으로 유지합니다",
    lead: "두 local timestamps의 숫자 차이는 DST, leap, timezone과 calendar policy를 무시하면 실제 경과 시간이나 청구 기간을 보장하지 않습니다.",
    explanations: [
      "elapsed duration은 두 instants의 timeline 차이로 계산하며 UTC epoch/nanosecond 등 정확한 unit을 사용합니다. local datetime subtraction은 fold/gap ambiguity와 zone resolution을 먼저 해결해야 합니다.",
      "DATEDIFF류 함수가 day boundaries를 세는지 elapsed 24-hour blocks를 세는지 vendor별 정의를 확인합니다. date difference, age in calendar years/months와 SLA elapsed seconds를 같은 함수로 계산하지 않습니다.",
      "duration storage는 integer microseconds/nanoseconds 또는 INTERVAL type을 요구에 맞게 선택하고 unit·range·sign을 명시합니다. TIME-of-day type에 30시간 duration을 억지로 저장하지 않습니다.",
      "monotonic elapsed measurement는 wall clock 조정(NTP/manual)에 영향받을 수 있어 application latency에는 monotonic clock을 사용합니다. DB business timestamps와 performance duration evidence를 분리하고 cross-system clocks에 uncertainty를 고려합니다.",
    ],
    concepts: [c("elapsed duration", "두 instants 사이 timeline에서 실제로 경과한 양입니다.", ["instant difference로 계산합니다.", "unit과 precision을 명시합니다."]), c("calendar period", "달력의 day/month/year fields로 표현되는 기간입니다.", ["고정 seconds가 아닙니다.", "start date와 policy가 있어야 instant화됩니다."])],
    diagnostics: [d("DST 전환일의 01:00~03:00 근무가 항상 2시간으로 계산된다.", "wall-clock fields를 빼고 actual offset transition/instants를 무시했습니다.", ["start/end instants와 offsets를 출력합니다.", "zone/tzdb version과 fold/gap policy를 확인합니다.", "billing rule이 elapsed/calendar 중 무엇인지 봅니다."], "local inputs를 explicit zone policy로 instants에 resolve하고 elapsed instant difference 또는 승인된 calendar rule을 적용합니다.", "DST gap/fold·cross-zone·negative/long duration vectors를 둡니다.")],
    expertNotes: ["leap seconds 지원/normalization은 platform마다 달라 high-precision scientific/financial systems에서 별도 time scale 정책이 필요합니다.", "event processing latency는 producer/event/ingest/process timestamps를 구분하고 clock skew와 queue delay를 분리해 관측합니다."],
  },
  {
    id: "current-time-clock-determinism",
    title: "CURRENT_TIMESTAMP/NOW와 system clock을 숨은 global state가 아니라 명시적 clock dependency로 다룹니다",
    lead: "현재 시간 함수가 statement·transaction·function call 중 어느 범위에서 고정되는지와 session zone이 무엇인지 모르면 tests·expiry·audit가 흔들립니다.",
    explanations: [
      "MySQL NOW/CURRENT_TIMESTAMP, Oracle CURRENT_TIMESTAMP/SYSTIMESTAMP, SQLite current time tokens의 evaluation scope·precision·timezone을 공식 문서에서 확인합니다. 같은 statement 안에서 stable하더라도 여러 statements/transactions 사이 값은 달라질 수 있습니다.",
      "application service는 Clock/time provider를 주입하고 repository에 asOf instant를 parameter로 전달하면 expiry/status queries와 fixtures가 deterministic해집니다. database-generated audit timestamp를 쓸 때는 authoritative DB clock, readback과 multi-region skew policy를 명시합니다.",
      "example은 epoch microseconds를 저장하고 fixed now_us CTE parameter로 completed/running duration과 ISO UTC clock을 exact 출력합니다. 실제 wall clock이나 timezone database에 의존하지 않아 python -I -X utf8 반복 결과가 같습니다.",
      "clock manipulation은 security boundary이기도 합니다. signed token expiry, certificate, retention을 client-supplied time으로 결정하지 않고 trusted server clock과 bounded skew를 사용하며 clock anomaly alerts에 raw user activity를 노출하지 않습니다.",
    ],
    concepts: [c("clock dependency", "현재 시각을 제공하는 명시적 component 또는 DB statement source입니다.", ["test에서 fixed clock을 주입합니다.", "trust·zone·precision을 정의합니다."]), c("as-of time", "query/report가 상태를 평가하는 기준 instant를 parameter·snapshot으로 고정한 값입니다.", ["여러 clauses에 재사용합니다.", "재현성과 audit를 높입니다."])],
    codeExamples: [py(
      "sql07-injected-clock-duration",
      "fixed epoch microsecond clock과 repeatable duration",
      "injected_clock_duration.py",
      "CURRENT_TIMESTAMP 대신 CTE bind clock을 사용해 completed/running durations를 deterministic하게 계산합니다.",
      String.raw`import sqlite3
from datetime import datetime, timezone

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE job (job_id INTEGER PRIMARY KEY, started_us INTEGER NOT NULL, finished_us INTEGER)")
db.executemany("INSERT INTO job VALUES (?, ?, ?)", [(1, 1704067200000000, 1704067202500000), (2, 1704067201000000, None)])

fixed_now = 1704067205000000
done = db.execute("SELECT finished_us - started_us FROM job WHERE job_id = 1").fetchone()[0]
running = db.execute("WITH clock(now_us) AS (VALUES (?)) SELECT now_us - started_us FROM job, clock WHERE job_id = 2", (fixed_now,)).fetchone()[0]
instant = datetime.fromtimestamp(fixed_now / 1_000_000, tz=timezone.utc)
print("done-duration-us=" + str(done))
print("running-duration-us=" + str(running))
print("clock-utc=" + instant.isoformat())
print("clock-source=injected")
print("repeatable=" + str(running == 4000000).lower())`,
      "done-duration-us=2500000\nrunning-duration-us=4000000\nclock-utc=2024-01-01T00:00:05+00:00\nclock-source=injected\nrepeatable=true",
      ["mysql-date-func", "oracle-current-timestamp", "sqlite-datefunc", "python-datetime", "java-instant"],
    )],
    diagnostics: [d("expiry test가 자정·timezone·CI 속도에 따라 flaky하고 여러 rows의 asOf가 조금씩 다르다.", "현재 시간을 여러 layer/function call에서 직접 읽고 scope/zone을 고정하지 않았습니다.", ["SQL/application clock calls와 session zone을 inventory합니다.", "statement/transaction/request 범위를 확인합니다.", "test가 sleep/system time에 의존하는지 봅니다."], "request/job당 trusted fixed asOf를 주입하고 DB/app authoritative clock과 skew policy를 명시합니다.", "fake clock·boundary·clock-skew tests와 time-source telemetry를 둡니다.")],
    expertNotes: ["DB default audit timestamp와 application timestamp가 둘 다 있으면 authoritative ordering과 reconciliation policy를 정합니다.", "time-based cache/lease algorithms은 wall clock rollback에 취약할 수 있어 monotonic clock·fencing token을 검토합니다."],
  },
  {
    id: "temporal-sargability-partitioning",
    title: "DATE(column)·format filter를 raw half-open range로 바꾸고 time index·partition pruning을 검증합니다",
    lead: "날짜별 조회를 DATE(occurred_at)=?로 쓰면 읽기 쉽지만 indexed timestamp column을 함수로 감싸 scan과 partition miss를 만들 수 있습니다.",
    explanations: [
      "tenant equality+occurred_at range처럼 authorization/filter prefix와 time order를 맞춘 composite index를 설계합니다. selected width, sort direction, retention deletes와 hot insert locality를 benchmark하고 모든 query마다 duplicate time index를 추가하지 않습니다.",
      "partition key와 predicate가 same type/zone/range expression으로 연결되어야 pruning이 가능합니다. function/cast/implicit timezone conversion이 partition elimination을 막는지 EXPLAIN partitions/actual rows를 확인합니다.",
      "generated local-date column과 index가 필요하면 zone/version을 고정할 수 있는지 검토합니다. user별 timezone local date를 하나의 generated column으로 표현할 수 없으므로 precomputed report dimension 또는 parameter UTC boundaries가 필요합니다.",
      "retention cutoff도 half-open range와 trusted clock을 사용하고 delete batch, FK/archive/legal hold·replica lag와 restore evidence를 포함합니다. timestamp index가 있다고 즉시 대량 delete하지 않습니다.",
    ],
    concepts: [c("temporal sargability", "typed timestamp column에 직접 equality/range boundary를 적용해 time index 탐색을 가능하게 하는 성질입니다.", ["DATE/format wrapping을 피합니다.", "zone boundaries는 parameter로 계산합니다."]), c("partition pruning", "query predicate로 관련 없는 time partitions를 계획/실행에서 제외하는 최적화입니다.", ["type/expression alignment가 필요합니다.", "actual partitions를 확인합니다."])],
    diagnostics: [d("오늘 data query가 전체 history partitions를 읽고 retention job이 DB를 포화시킨다.", "column-side DATE/timezone conversion이 index/pruning을 막고 unbounded delete를 수행했습니다.", ["EXPLAIN partitions·rows·predicate casts를 봅니다.", "start/end bound types/zones를 확인합니다.", "delete batch/locks/replica lag를 관찰합니다."], "parameter half-open raw range와 matching index/partition key를 적용하고 retention을 bounded resumable batches로 전환합니다.", "plan partition assertions·range coverage·retention max-affected/rollback gate를 둡니다.")],
    expertNotes: ["BRIN/zone map 등 engine-specific large time-series indexes는 data correlation·vacuum/maintenance를 workload로 검증합니다.", "hot timestamp-leading indexes는 concurrent insert contention을 만들 수 있어 partition/sharding/index design tradeoff를 봅니다."],
  },
  {
    id: "temporal-portability-observability",
    title: "DB·JDBC·Python/Java·API의 temporal semantic matrix와 tzdb/clock 운영 증거를 유지합니다",
    lead: "날짜 함수가 실행된다는 사실보다 type range·zone conversion·precision·parse·month rule·current-time scope가 같은 의미인지 검증해야 합니다.",
    explanations: [
      "vendor matrix는 DATE/TIME/TIMESTAMP type meaning/range/precision, timezone storage/display, current time scope, add-month/day difference, format/parse strictness와 interval support를 actual supported versions에서 실행합니다. syntax-only translation을 acceptance로 삼지 않습니다.",
      "JDBC LocalDate/LocalDateTime/Instant/OffsetDateTime mappings과 Python datetime naive/aware 규칙을 query result round-trip으로 검증합니다. ORM session timezone, connection initialization과 JSON serializer가 default zone을 삽입하지 않게 합니다.",
      "upgrade/migration은 tzdb·DB/JDK/Python version, before/after gap/fold/month/precision vectors, changed future schedules와 collision counts를 dry-run합니다. rule change가 실제 사용자 예약에 미치는 영향은 data owner와 review하고 rollback snapshot을 보존합니다.",
      "telemetry는 invalid parse, ambiguous/nonexistent local time, clock skew, late event, range scan/partition miss를 bounded categories로 기록합니다. raw user timestamps와 locations가 sensitive할 수 있으므로 small cohort·exact route를 노출하지 않습니다.",
    ],
    concepts: [c("temporal contract matrix", "type·zone·precision·function·driver/API별 boundary input과 expected instant/local/date/duration을 비교한 표입니다.", ["vendor upgrades에 반복합니다.", "gap/fold/month cases를 포함합니다."]), c("tzdb drift", "timezone rules database version 차이로 같은 zone/local schedule의 resolved instant가 달라지는 상태입니다.", ["deployment manifest로 탐지합니다.", "future schedule migration 정책이 필요합니다."])],
    diagnostics: [d("DB/JDK upgrade 뒤 미래 예약 instant가 바뀌고 일부 API가 offset을 잃는다.", "tzdb/driver/serializer semantic changes를 compile success만으로 승인했습니다.", ["old/new versions와 temporal golden vectors를 비교합니다.", "future schedules/resolution version을 inventory합니다.", "JSON/JDBC round-trip offsets를 봅니다."], "versioned resolver/serializer contract로 staged dual-read comparison하고 affected schedules를 owner-approved re-resolve 또는 고정합니다.", "DB/JDK/Python/tzdb upgrade matrix와 canary/rollback evidence를 release gate로 둡니다.")],
    expertNotes: ["시간 data는 위치·행동 패턴을 드러낼 수 있어 observability/export의 privacy classification과 retention을 별도 적용합니다.", "multi-region DB의 current time과 commit timestamp는 application causality·legal event time과 다를 수 있어 각각의 provenance를 보존합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0129", repository: "local dbstudy snapshot", path: "dbstudy/01_29.sql", usedFor: ["INTERVAL·date predicate progression"], evidence: "99 logical lines·6,349 bytes·SHA-256 15595B98D5FC2187DE0CCBBB0CEAF44D0AF87E03EE12CA263258CF7C6ED6B9C4; comments를 제외한 active INTERVAL3·BETWEEN3·SELECT39를 read-only로 계수했습니다." },
  { id: "local-db-0203", repository: "local dbstudy snapshot", path: "dbstudy/02_03.sql", usedFor: ["current/date arithmetic/format progression"], evidence: "121 logical lines·4,913 bytes·SHA-256 07FA8F4DCDDBDE2C45B7011B3DB71F1255C2C448954D461D176A2E9BBB2060C5; active NOW14·DATEDIFF1·DATE_ADD3·DATE_SUB3·DATE_FORMAT1을 read-only로 계수했습니다." },
  { id: "mysql-date-func", repository: "MySQL 8.4 Reference Manual", path: "Date and Time Functions", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html", usedFor: ["NOW·DATE_ADD/SUB·DATEDIFF·DATE_FORMAT"], evidence: "MySQL 8.4 date/time functions 공식 문서입니다." },
  { id: "mysql-date-types", repository: "MySQL 8.4 Reference Manual", path: "Date and Time Data Types", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/date-and-time-types.html", usedFor: ["DATE/DATETIME/TIMESTAMP range·precision"], evidence: "MySQL 8.4 temporal types 공식 문서입니다." },
  { id: "mysql-timezone", repository: "MySQL 8.4 Reference Manual", path: "MySQL Server Time Zone Support", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/time-zone-support.html", usedFor: ["session/system timezone·named zones"], evidence: "MySQL 8.4 timezone 공식 문서입니다." },
  { id: "oracle-datetime", repository: "Oracle AI Database 26ai Globalization Support Guide", path: "Datetime Data Types and Time Zone Support", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/nlspg/datetime-data-types-and-time-zone-support.html", usedFor: ["Oracle DATE/TIMESTAMP/timezone portability"], evidence: "Oracle 26ai datetime/timezone 공식 문서입니다." },
  { id: "oracle-format-models", repository: "Oracle AI Database 26ai SQL Language Reference", path: "Format Models", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Format-Models.html", usedFor: ["Oracle datetime parsing/formatting"], evidence: "Oracle 26ai format models 공식 문서입니다." },
  { id: "oracle-current-timestamp", repository: "Oracle AI Database 26ai SQL Language Reference", path: "CURRENT_TIMESTAMP", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CURRENT_TIMESTAMP.html", usedFor: ["Oracle current time/session timezone"], evidence: "Oracle 26ai CURRENT_TIMESTAMP 공식 문서입니다." },
  { id: "sqlite-datefunc", repository: "SQLite Documentation", path: "Date And Time Functions", publicUrl: "https://www.sqlite.org/lang_datefunc.html", usedFor: ["exact date/time examples·modifier behavior"], evidence: "SQLite date/time functions 공식 문서입니다." },
  { id: "sqlite-datatype", repository: "SQLite Documentation", path: "Date and Time Datatype", publicUrl: "https://www.sqlite.org/datatype3.html#date_and_time_datatype", usedFor: ["SQLite temporal storage boundary"], evidence: "SQLite date/time datatype 공식 fragment입니다." },
  { id: "python-datetime", repository: "Python 3 Documentation", path: "datetime — Basic date and time types", publicUrl: "https://docs.python.org/3/library/datetime.html", usedFor: ["strict parse·fixed instant/month harness"], evidence: "Python datetime 공식 문서입니다." },
  { id: "python-zoneinfo", repository: "Python 3 Documentation", path: "zoneinfo — IANA time zone support", publicUrl: "https://docs.python.org/3/library/zoneinfo.html", usedFor: ["IANA zone·fold·tzdata deployment"], evidence: "Python zoneinfo 공식 문서입니다." },
  { id: "java-instant", repository: "Java SE 21 API", path: "java.time.Instant", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Instant.html", usedFor: ["JDBC/application instant mapping·clock"], evidence: "Java Instant 공식 API입니다." },
  { id: "java-zoneddatetime", repository: "Java SE 21 API", path: "java.time.ZonedDateTime", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/ZonedDateTime.html", usedFor: ["zone gap/fold application mapping"], evidence: "Java ZonedDateTime 공식 API입니다." },
  { id: "rfc3339", repository: "IETF RFC Editor", path: "RFC 3339 Date and Time on the Internet", publicUrl: "https://www.rfc-editor.org/rfc/rfc3339.html", usedFor: ["offset timestamp interchange grammar"], evidence: "IETF RFC 3339 공식 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-07-date-time-functions", slug: "sql-07-date-time-functions", courseId: "database", moduleId: "db-query-foundations", order: 7,
  title: "날짜·시간 연산, 포맷과 기간 경계", subtitle: "temporal domain types와 precision에서 timezone/DST, half-open ranges, parsing, calendar arithmetic, deterministic clocks와 plan 운영까지 연결합니다.", level: "중급", estimatedMinutes: 900,
  coreQuestion: "날짜·local wall time·UTC instant·calendar period·elapsed duration이 DB·timezone·driver·API를 지날 때 어떤 boundary와 rule version으로 같은 의미를 유지할까요?",
  summary: "authoritative 01_29.sql·02_03.sql을 read-only로 감사해 active INTERVAL3·BETWEEN3과 NOW14·DATEDIFF1·DATE_ADD3·DATE_SUB3·DATE_FORMAT1 progression을 보존했습니다. date/time types와 precision/serialization, IANA timezone·DST gap/fold, half-open period ranges, strict format/parse, month/year end policy, elapsed duration vs calendar period, injected current clock, temporal sargability/partitioning과 vendor/tzdb operations를 독립 장으로 완성합니다. 다섯 Python sqlite3 examples는 fractional half-open ranges, duplicated DST wall time, strict parse, month clamp vs SQLite default, fixed clock duration을 exact stdout으로 실행합니다.",
  objectives: ["DATE/local datetime/instant/duration/calendar period의 domain type을 구분한다.", "DB·driver·API fractional precision과 RFC 3339 serialization을 검증한다.", "IANA timezone·offset·DST gap/fold와 tzdb version policy를 설계한다.", "day/month 조회를 timezone-aware half-open range로 표현한다.", "format presentation과 strict ingestion parse를 분리한다.", "month/year 말일·윤년 arithmetic policy를 vendor default와 구분한다.", "elapsed duration·calendar period·current time source를 deterministic하게 계산한다.", "time index·partition pruning·driver/tzdb upgrade evidence를 운영한다."],
  prerequisites: [{ title: "문자열·숫자 함수와 문자/바이트 길이", reason: "temporal parsing/formatting도 문자열 grammar·type conversion·sargability와 precision/rounding 경계를 공유합니다.", sessionSlug: "sql-06-string-number-functions" }],
  keywords: ["DATE", "TIMESTAMP", "Instant", "timezone", "IANA", "DST", "fold", "half-open interval", "DATE_ADD", "DATEDIFF", "DATE_FORMAT", "RFC 3339", "month arithmetic", "duration", "CURRENT_TIMESTAMP", "Clock", "partition pruning"], topics,
  lab: {
    title: "다지역 학습 일정·활동 event의 temporal model과 조회/expiry를 재구축하기",
    scenario: "사용자 local 일정과 UTC activity events가 한 DATETIME column에 섞여 DST 중복, 월말 누락, flaky expiry tests와 전체 partition scan을 만듭니다.",
    setup: ["synthetic date/local/instant/gap/fold/fractional/month-end fixtures만 사용합니다.", "MySQL 8.4·Oracle 26ai isolated schemas와 SQLite/Python·Java 21 harness를 준비합니다.", "field별 semantic type·zone·precision·source clock·retention을 inventory합니다.", "tzdb/DB/JDK/Python versions와 current query plans를 기록합니다."],
    steps: ["date-only·local schedule·resolved instant·duration fields를 분리합니다.", "precision/unit round-trip과 RFC 3339 parser boundary를 검증합니다.", "IANA zone resolution의 normal/gap/fold와 future tzdb change policy를 실행합니다.", "user local day/month을 start/next-start instants로 계산해 half-open query를 만듭니다.", "display formatting과 strict ingestion grammar를 adapter로 분리합니다.", "month-end/leap/business-calendar rule을 versioned authoritative function으로 고정합니다.", "expiry/report jobs에 request/job당 injected asOf clock을 전달합니다.", "raw time range와 composite tenant+time index/partition pruning을 actual plan으로 확인합니다.", "JDBC/Python/API readback과 serializer offsets·precision을 end-to-end 대조합니다.", "tzdb/clock/parse/range anomalies를 privacy-safe metrics와 rollback runbook에 연결합니다."],
    expectedResult: ["모든 temporal fields가 date/local/instant/duration 의미와 precision을 보존합니다.", "DST gap/fold와 month-end rule 결과가 승인된 vectors와 일치합니다.", "adjacent half-open periods가 overlap/누락 없이 모든 fractional rows를 cover합니다.", "tests와 expiry/report가 fixed asOf로 재현되고 raw time range index/pruning budget을 충족합니다.", "tzdb/vendor upgrade 영향과 repair/rollback evidence가 PII 없이 추적됩니다."],
    cleanup: ["isolated rows/indexes/partitions와 test telemetry를 run id로 제거합니다.", "temporary time-zone/session settings와 DB users/grants를 원복/revoke합니다.", "raw user timestamps/locations가 logs/artifacts에 없는지 검사합니다.", "원본 SQL·production schedule/event data는 변경하지 않습니다."],
    extensions: ["bitemporal valid/system time과 late-arriving correction을 설계합니다.", "recurrence rule·exception·tzdb update materialization을 구현합니다.", "multi-region event ordering과 clock uncertainty/fencing을 연구합니다.", "business calendar source/version과 schedule replay simulator를 만듭니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 value마다 date/local/instant/duration과 boundary policy를 표시하세요.", requirements: ["python -I -X utf8 stdout을 완전 대조합니다.", "fractional half-open row를 설명합니다.", "DST 같은 wall time의 offsets/instants를 구분합니다.", "invalid parse를 재현합니다.", "month clamp와 SQLite default를 비교합니다.", "injected clock duration unit을 확인합니다."], hints: ["표에 wall fields, zone/offset, instant, precision, policy version을 따로 두세요."], expectedOutcome: "시간을 format string이 아닌 domain/boundary/clock 계약으로 설명합니다.", solutionOutline: ["type→zone→range→parse/arithmetic→clock 순서입니다."] },
    { difficulty: "응용", prompt: "local 학습 일정과 UTC activity repository를 분리·이관하세요.", requirements: ["temporal field inventory를 만듭니다.", "precision/RFC round-trip을 검증합니다.", "gap/fold resolution policy를 둡니다.", "half-open local-period query를 구현합니다.", "month/business rule을 versioning합니다.", "injected asOf와 raw range index를 적용합니다.", "driver/API/tzdb matrix를 실행합니다.", "repair·privacy telemetry·rollback을 포함합니다."], hints: ["미래 일정과 이미 발생한 event의 timezone 요구는 다릅니다."], expectedOutcome: "일정·event·report/expiry가 각자의 시간 의미를 유지합니다.", solutionOutline: ["inventory→model→boundaries→query/index→migration/operations 순서입니다."] },
    { difficulty: "설계", prompt: "조직 temporal data와 clock 표준을 작성하세요.", requirements: ["date/local/instant/duration type 선택표를 만듭니다.", "precision/unit/serialization을 정의합니다.", "IANA zone·tzdb·gap/fold 정책을 둡니다.", "half-open range와 sargability 규칙을 정의합니다.", "strict parse/format 경계를 둡니다.", "month/business arithmetic version을 정합니다.", "trusted/injected/monotonic clock 사용을 구분합니다.", "vendor/driver/tzdb upgrade·privacy·incident 절차를 포함합니다."], hints: ["UTC 저장 한 문장만으로 future local schedule을 해결하지 마세요."], expectedOutcome: "시간 data 생성부터 조회·표시·만료·이관·복구까지 검증 가능한 표준이 완성됩니다.", solutionOutline: ["semantics→representation→rules→queries→clock/operations 순서입니다."] },
  ],
  nextSessions: ["sql-08-aggregate-group-having"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["dbstudy/01_29.sql: 99 logical lines·6,349 bytes·SHA-256 15595B98D5FC2187DE0CCBBB0CEAF44D0AF87E03EE12CA263258CF7C6ED6B9C4; comments를 제외한 active INTERVAL3·BETWEEN3·SELECT39를 read-only로 계수했습니다.", "dbstudy/02_03.sql: 121 logical lines·4,913 bytes·SHA-256 07FA8F4DCDDBDE2C45B7011B3DB71F1255C2C448954D461D176A2E9BBB2060C5; active NOW14·CURRENT_TIMESTAMP1·CURRENT_DATE1·standalone CURRENT_TIME1·DATEDIFF1·DATE_ADD3·DATE_SUB3·DATE_FORMAT1을 read-only로 계수했습니다.", "원본 sample 고객·주문·주소·timestamp 값을 복제하지 않고 temporal clause progression과 counts/hash만 provenance로 사용했습니다.", "원본에 없는 temporal type semantics, precision/RFC round-trip, IANA DST gap/fold, fractional half-open range, month policy, injected clock, index/partition/tzdb operations는 공식 문서와 synthetic exact examples로 보완했습니다.", "SQLite/Python exact output은 MySQL 8.4·Oracle 26ai temporal types·session timezone·month functions·driver/tzdb semantics를 대신하지 않습니다."] },
});

export default session;
