import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function py(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const count = code.split("\n").length;
  const first = Math.max(1, Math.floor(count / 3));
  const second = Math.max(first + 1, Math.floor((count * 2) / 3));
  return { id, title, language: "python", filename, purpose, code,
    walkthrough: [
      { lines: `1-${first}`, explanation: "사람 이름·주소 없이 synthetic theater/showtime/seat keys를 sqlite3 메모리 DB에 준비합니다." },
      { lines: `${first + 1}-${second}`, explanation: "관계 key, uniqueness, money/time, booking transaction 또는 report grain 중 한 계약을 실행합니다." },
      { lines: `${second + 1}-${count}`, explanation: "정렬된 ids·오류·minor-unit 금액·counts처럼 deterministic evidence만 stdout으로 출력합니다. production lock/isolation은 MySQL·Oracle에서 다시 검증합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3/decimal", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 한 글자씩 같아야 합니다.", "SQLite laboratory는 InnoDB/Oracle의 row locks, deadlock, timestamp types와 online DDL을 대체하지 않습니다."] },
    experiments: [
      { change: "동일 좌석 동시 요청, 경계 시간, 취소 후 재판매와 최대 금액을 추가합니다.", prediction: "scope·transaction·snapshot 계약이 빠지면 중복 예약 또는 revenue drift가 나타납니다.", result: "canonical reservation keys, state transitions, price snapshots와 ledger totals를 비교합니다." },
      { change: "동일 fixtures를 MySQL 8.4와 Oracle 26ai 격리 schema에서 실행합니다.", prediction: "identity, check/FK, locking, time와 index plan에서 승인된 차이가 나타납니다.", result: "engine/version, DDL, isolation, actual plans와 committed readback을 conformance evidence로 남깁니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "requirements-grain-invariants",
    title: "요구사항을 entity·event·grain·불변식으로 번역합니다",
    lead: "극장·상영관·영화·상영회차·좌석·예약을 이름만 나열하면 같은 영화의 다른 시간과 같은 좌석 번호의 다른 공간을 구분할 수 없습니다.",
    explanations: [
      "원본 HOMEWORK.sql은 THEATER, SCREEN, CUSTOMERS, RESERVATION을 만들고 조회·집계·DML을 연습합니다. 이 세션은 그 학습 흐름을 read-only로 감사하되 원본 극장명·지역·영화명·고객명·주소·날짜는 복사하지 않고 synthetic keys만 사용합니다.",
      "먼저 업무 문장을 시간 독립 entity와 시간에 따라 발생하는 event로 나눕니다. theater는 장소, auditorium은 물리 상영관, seat는 그 공간의 좌석, movie는 콘텐츠, showtime은 movie가 auditorium에서 특정 시간에 상영되는 event, reservation은 showtime-seat를 고객/주문에 배정하는 event입니다.",
      "각 table의 row grain을 한 문장으로 적고 candidate keys를 찾습니다. auditorium_number는 theater 안에서만 유일하고 seat_label은 auditorium 안에서만 유일하며, 예약 좌석은 showtime 안에서 유일해야 합니다. UI 숫자를 전역 식별자로 오해하지 않습니다.",
      "불변식은 `showtime ends after starts`, `seat belongs to showtime auditorium`, `active booking per showtime-seat <=1`, `captured price never changes`, `reservation transition is monotonic`처럼 반례를 만들 수 있게 씁니다.",
      "요구사항이 모호하면 DDL로 추측해 고정하지 않습니다. 지정석/자유석, 복수 티켓 order, hold 시간, 환불, timezone, 장애인석, 상영관 변경과 개인정보 보존을 decision log와 acceptance fixture로 확정합니다.",
    ],
    concepts: [
      c("row grain", "table 한 행이 나타내는 업무 단위를 정확히 한 문장으로 표현한 것입니다.", ["key와 집계 의미를 결정합니다.", "event와 entity를 구분합니다."]),
      c("business invariant", "허용된 모든 transaction 후에도 참이어야 하는 업무 규칙입니다.", ["constraint와 command가 소유합니다.", "반례 fixture로 검증합니다."]),
      c("scope key", "번호나 label이 유일한 업무 범위를 부모 key와 함께 나타낸 복합 key입니다.", ["auditorium/seat에서 중요합니다.", "전역 번호 가정을 막습니다."]),
    ],
    diagnostics: [
      d("같은 1관이 여러 극장에 있어 join 결과가 섞입니다.", "auditorium_number의 유일 범위를 theater 내부가 아닌 전역으로 가정했습니다.", ["row grain 문장", "candidate/composite keys", "join predicate", "duplicate-number fixture"], "surrogate auditorium_id와 UNIQUE(theater_id,auditorium_number)를 두고 FK는 stable id를 사용합니다.", "모든 local number에 scope-column test와 full-FK join lint를 둡니다."),
      d("예약 요구가 바뀔 때마다 RESERVATION 열을 덧붙입니다.", "order/payment/seat allocation/status event의 서로 다른 grain을 한 행에 혼합했습니다.", ["one reservation row meaning", "multi-seat order", "payment/refund cardinality", "status history"], "booking order, booking item/seat allocation, payment/refund와 status events를 분리합니다.", "요구사항 단계에서 entity-event-grain matrix를 승인합니다."),
    ],
    expertNotes: ["ERD는 결과 그림이고 핵심 증거는 grain/key/invariant/transition 표입니다.", "원본 sample literals는 provenance가 아니라 개인정보성 예시이므로 새 교재에 복제하지 않습니다."],
  },
  {
    id: "venue-auditorium-seat-keys",
    title: "theater·auditorium·seat의 물리 계층과 key를 정규화합니다",
    lead: "좌석 15번은 상영관과 좌석 구역까지 알아야 하나의 물리 위치를 가리킵니다.",
    explanations: [
      "theater는 공개 이름/주소와 운영 timezone을, auditorium은 theater FK와 내부 번호/capacity를, seat는 auditorium FK와 row/number/type/accessibility를 가집니다. 영화 제목과 가격은 물리 SCREEN 행에서 분리합니다.",
      "surrogate PK는 참조 안정성을 제공하고 composite UNIQUE가 업무 중복을 막습니다. theater_id+auditorium_number와 auditorium_id+seat_label을 둘 다 DB constraint로 강제합니다.",
      "capacity를 저장하면 seats count와 drift할 수 있습니다. 정적 설계 상한인지 derived count인지 정의하고, 안전/허가 capacity와 실제 판매 가능 seats가 다르면 별도 source/validation을 둡니다.",
      "FK delete action은 lifecycle에 맞춥니다. 판매 이력이 있는 auditorium/seat를 CASCADE 삭제하지 않고 retired_at/status로 비활성화하며 historical reservation은 stable FK와 snapshot label을 유지합니다.",
      "seat map version이 바뀌면 같은 label이 다른 물리 위치가 될 수 있습니다. auditorium_layout/layout_seat version을 도입하고 showtime이 한 layout version을 참조하도록 하면 이미 판매된 좌석 의미를 보존합니다.",
    ],
    concepts: [
      c("surrogate key", "업무 표기 변경과 독립적인 내부 식별자입니다.", ["FK를 단순화합니다.", "업무 UNIQUE를 대체하지 않습니다."]),
      c("alternate key", "PK는 아니지만 업무상 중복을 금지하는 candidate key입니다.", ["composite UNIQUE로 강제합니다.", "scope를 포함합니다."]),
      c("layout version", "특정 시점의 상영관 좌석 배치와 label 집합을 고정한 버전입니다.", ["과거 예약 의미를 보존합니다.", "showtime과 연결합니다."]),
    ],
    codeExamples: [py("db17-key-hierarchy", "극장·상영관·좌석의 scoped key", "db17_keys.py", "같은 auditorium number와 seat label을 다른 부모에서 허용하되 같은 scope 중복은 거부하는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("CREATE TABLE theater(id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL)")
db.execute("CREATE TABLE auditorium(id INTEGER PRIMARY KEY, theater_id INTEGER NOT NULL REFERENCES theater(id), number INTEGER NOT NULL, UNIQUE(theater_id, number))")
db.execute("CREATE TABLE seat(id INTEGER PRIMARY KEY, auditorium_id INTEGER NOT NULL REFERENCES auditorium(id), label TEXT NOT NULL, UNIQUE(auditorium_id, label))")
db.executemany("INSERT INTO theater VALUES (?, ?)", [(1, "T-A"), (2, "T-B")])
db.executemany("INSERT INTO auditorium VALUES (?, ?, ?)", [(11, 1, 1), (21, 2, 1)])
db.executemany("INSERT INTO seat VALUES (?, ?, ?)", [(101, 11, "A-01"), (201, 21, "A-01")])
print("auditoriums=" + ",".join(f"{row[0]}:{row[1]}" for row in db.execute("SELECT theater_id, number FROM auditorium ORDER BY theater_id")))
print("seat-labels=" + ",".join(row[0] for row in db.execute("SELECT label FROM seat ORDER BY id")))
try:
    db.execute("INSERT INTO seat VALUES (102, 11, 'A-01')")
except sqlite3.IntegrityError:
    print("same-scope-duplicate=rejected")
print("foreign-keys=on")`, "auditoriums=1:1,2:1\nseat-labels=A-01,A-01\nsame-scope-duplicate=rejected\nforeign-keys=on", ["local-homework", "mysql-create-table", "mysql-foreign-keys", "oracle-create-table", "sqlite-create-table", "sqlite-foreign-keys"])],
    diagnostics: [
      d("seat label을 바꾸자 과거 ticket 표시도 바뀝니다.", "reservation이 mutable current seat label만 join하고 판매 시 snapshot/version을 보존하지 않았습니다.", ["layout/seat history", "reservation FK", "snapshot label", "change effective time"], "layout version을 고정하고 ticket에는 판매 시 display label을 immutable snapshot으로 저장합니다.", "layout migration에서 old showtime/ticket golden readback을 둡니다."),
      d("상영관 삭제가 과거 예약을 함께 지웁니다.", "historical entity에 ON DELETE CASCADE를 적용했습니다.", ["FK actions", "retention/legal requirements", "soft-retired status", "backup/audit"], "판매 이력이 생긴 공간은 retire하고 삭제는 별도 retention/anonymization workflow로 제한합니다.", "FK action review와 history-preservation integration test를 둡니다."),
    ],
    expertNotes: ["surrogate PK와 business composite UNIQUE는 서로 보완합니다.", "물리 좌석 변경은 단순 UPDATE가 아니라 effective-dated layout migration입니다."],
  },
  {
    id: "movie-showtime-time-model",
    title: "movie와 showtime을 분리하고 시간·timezone·겹침을 모델링합니다",
    lead: "상영관 행에 movie title 하나를 두면 같은 관의 오전·오후 영화와 일정 변경 이력을 표현할 수 없습니다.",
    explanations: [
      "movie는 콘텐츠 metadata이고 showtime은 auditorium_id, movie_id, starts_at, ends_at, sales_open/close, status와 layout/pricing version을 참조하는 event입니다. 동일 movie가 여러 장소·시간에 반복됨을 자연스럽게 표현합니다.",
      "운영 장소 timezone과 저장 instant를 분리합니다. 권장 pattern은 UTC instant와 theater timezone identifier를 저장하고 표시 때 local time으로 변환하며, DST ambiguity/nonexistent local time을 fixture로 다룹니다.",
      "end > start CHECK는 기본이고 auditorium의 활성 showtimes가 cleaning/buffer를 포함해 겹치지 않는 invariant가 필요합니다. 일반 CHECK는 다른 rows를 볼 수 없으므로 transaction/service exclusion logic과 engine 기능을 사용합니다.",
      "date equality 대신 half-open interval `[start,end)`를 사용하면 자정·fractional seconds·timezone boundary를 안전하게 표현합니다. report day도 theater local day를 UTC boundaries로 변환해 range predicate를 bind합니다.",
      "상영 시간이 바뀌면 판매된 ticket과 notification을 어떻게 처리할지 transition을 정의합니다. in-place overwrite보다 schedule revision/event와 customer notification/outbox를 transaction으로 연결합니다.",
    ],
    concepts: [
      c("showtime", "영화가 특정 auditorium에서 정의된 시간 범위에 상영되는 event입니다.", ["movie/space와 분리합니다.", "판매/상태 version을 가집니다."]),
      c("half-open interval", "시작은 포함하고 끝은 제외하는 [start,end) 시간 구간입니다.", ["연속 구간 중복을 피합니다.", "range query에 사용합니다."]),
      c("schedule overlap", "같은 resource의 두 시간 구간이 동시에 점유되는 상태입니다.", ["buffer를 포함합니다.", "cross-row invariant입니다."]),
    ],
    codeExamples: [py("db17-time-overlap", "half-open 상영 시간 겹침 검사", "db17_time.py", "같은 상영관의 인접 일정은 허용하고 실제 겹침 후보만 찾는 interval predicate를 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE showtime(id INTEGER PRIMARY KEY, auditorium_id INTEGER, starts_at TEXT, ends_at TEXT, CHECK(ends_at > starts_at))")
db.executemany("INSERT INTO showtime VALUES (?, ?, ?, ?)", [
    (1, 11, "2026-07-20T01:00:00Z", "2026-07-20T03:00:00Z"),
    (2, 11, "2026-07-20T03:00:00Z", "2026-07-20T05:00:00Z"),
    (3, 21, "2026-07-20T02:00:00Z", "2026-07-20T04:00:00Z"),
])
def overlaps(auditorium_id, start, end):
    return [row[0] for row in db.execute("SELECT id FROM showtime WHERE auditorium_id=? AND starts_at < ? AND ends_at > ? ORDER BY id", (auditorium_id, end, start))]
print("adjacent=" + ",".join(map(str, overlaps(11, "2026-07-20T05:00:00Z", "2026-07-20T06:00:00Z"))))
print("overlap=" + ",".join(map(str, overlaps(11, "2026-07-20T02:30:00Z", "2026-07-20T03:30:00Z"))))
print("other-auditorium=" + ",".join(map(str, overlaps(21, "2026-07-20T02:30:00Z", "2026-07-20T03:30:00Z"))))
print("interval=half-open")`, "adjacent=\noverlap=1,2\nother-auditorium=3\ninterval=half-open", ["mysql-datetime", "mysql-check", "oracle-create-table", "sqlite-create-table"])],
    diagnostics: [
      d("같은 관에 겹친 상영 두 개가 생성됩니다.", "row-local CHECK만 있고 cross-row resource interval invariant가 없습니다.", ["auditorium id", "half-open predicate", "transaction lock/race", "buffer duration"], "일정 생성 transaction에서 resource 범위를 serialize하고 겹침 query를 재검증합니다.", "동시 insert와 boundary/buffer interval tests를 둡니다."),
      d("자정 report에서 한 상영이 빠지거나 두 번 집계됩니다.", "local date 문자열과 UTC instant를 혼합하거나 BETWEEN 양끝 포함을 사용했습니다.", ["theater timezone", "stored type/offset", "local-day UTC boundaries", "fractional seconds"], "IANA timezone으로 local day를 [utcStart,utcEnd)로 변환해 range query합니다.", "DST 전환·자정·precision fixtures를 둡니다."),
    ],
    expertNotes: ["상영 시간은 단순 DATETIME 두 열이 아니라 resource scheduling invariant입니다.", "timezone database version과 conversion owner를 운영 metadata로 기록합니다."],
  },
  {
    id: "reservation-uniqueness-scope-fix",
    title: "HOMEWORK 예약 UNIQUE scope 오류를 showtime-seat key로 바로잡습니다",
    lead: "원본 제약은 같은 고객의 같은 seat number를 전역 금지하면서도 같은 상영의 같은 좌석을 두 고객이 동시에 예약하는 것을 막지 못합니다.",
    explanations: [
      "원본 PK(THEATER_NUMBER,SCREEN_NUMBER,CUSTOMER_NUMBER)는 고객당 관/상영관 한 예약만 제한하지만 showtime이 없고 seat 충돌을 막지 않습니다. UNIQUE(CUSTOMER_NUMBER,SEAT_NUMBER)는 서로 다른 극장·관·날짜에서도 고객이 같은 번호를 다시 선택하지 못하게 합니다.",
      "정확한 판매 단위는 showtime_id+layout_seat_id입니다. reservation_order는 구매 command, reservation_item 또는 seat_allocation은 한 showtime-seat 배정이며 `UNIQUE(showtime_id, seat_id)`가 active 판매 exclusivity의 핵심입니다.",
      "취소 row를 보존하면 unconditional UNIQUE는 재판매를 막습니다. MySQL의 generated active key, Oracle function-based unique index 또는 active allocation table 분리처럼 engine pattern을 선택하고 상태/NULL semantics를 conformance합니다.",
      "한 고객이 한 showtime에 여러 좌석을 살 수 있는지 정책에 따라 UNIQUE(showtime_id,customer_id)는 두지 않습니다. business limit은 quantity/household policy와 payment command에서 검증하고 arbitrary schema restriction으로 만들지 않습니다.",
      "seat가 showtime auditorium에 속한다는 cross-table invariant도 필요합니다. showtime_layout_id와 seat.layout_id를 composite FK로 묶거나 allocation 가능한 inventory rows를 showtime마다 생성해 잘못된 관의 좌석을 참조하지 못하게 합니다.",
    ],
    concepts: [
      c("seat exclusivity", "한 showtime의 한 물리 좌석에는 동시에 하나의 active allocation만 존재해야 한다는 규칙입니다.", ["UNIQUE scope로 강제합니다.", "취소 재판매를 설계합니다."]),
      c("over-constraint", "실제 업무보다 넓은 범위의 UNIQUE가 정상 행동까지 금지하는 상태입니다.", ["원본 customer-seat가 예입니다.", "counterexample로 검출합니다."]),
      c("under-constraint", "반드시 막아야 할 중복이 key/constraint에서 빠진 상태입니다.", ["double booking을 허용합니다.", "concurrent fixture로 검출합니다."]),
    ],
    codeExamples: [py("db17-seat-uniqueness", "showtime-seat uniqueness와 다른 회차 재사용", "db17_uniqueness.py", "같은 showtime-seat double booking은 거부하고 다른 showtime의 같은 seat는 허용하는 정확한 scope를 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE allocation(id INTEGER PRIMARY KEY, showtime_id INTEGER NOT NULL, seat_id INTEGER NOT NULL, customer_key TEXT NOT NULL, UNIQUE(showtime_id, seat_id))")
db.execute("INSERT INTO allocation VALUES (1, 1001, 501, 'C-01')")
try:
    db.execute("INSERT INTO allocation VALUES (2, 1001, 501, 'C-02')")
except sqlite3.IntegrityError:
    print("same-showtime-seat=rejected")
db.execute("INSERT INTO allocation VALUES (3, 1002, 501, 'C-02')")
db.execute("INSERT INTO allocation VALUES (4, 1001, 502, 'C-01')")
rows = list(db.execute("SELECT showtime_id, seat_id, customer_key FROM allocation ORDER BY id"))
for row in rows:
    print("allocation=" + "|".join(map(str, row)))
print("count=" + str(len(rows)))`, "same-showtime-seat=rejected\nallocation=1001|501|C-01\nallocation=1002|501|C-02\nallocation=1001|502|C-01\ncount=3", ["local-homework", "mysql-create-table", "mysql-check", "oracle-constraints", "sqlite-create-table"])],
    diagnostics: [
      d("같은 상영 좌석이 두 고객에게 판매됩니다.", "PK에 customer가 있지만 showtime-seat UNIQUE가 없습니다.", ["allocation grain", "unique indexes", "showtime identity", "concurrent inserts"], "DB에 UNIQUE(showtime_id,seat_id)를 두고 duplicate conflict를 sold response로 map합니다.", "두 connection race와 constraint-name error mapping test를 둡니다."),
      d("고객이 다음날 다른 관의 15번 좌석을 예약하지 못합니다.", "UNIQUE(customer,seat_number)가 seat number의 전역 의미를 가정합니다.", ["constraint columns", "seat scope", "showtime/date", "business purchase limit"], "해당 제약을 제거하고 physical seat_id와 showtime scope의 exclusivity를 사용합니다.", "same customer/same label/different showtime positive fixture를 둡니다."),
    ],
    expertNotes: ["UNIQUE는 index 최적화가 아니라 동시성까지 닫는 business invariant입니다.", "constraint name을 stable error taxonomy와 migration artifact에 기록합니다."],
  },
  {
    id: "money-price-snapshot-ledger",
    title: "금액·currency·가격 snapshot과 결제 ledger를 분리합니다",
    lead: "현재 상영관 가격을 join해 과거 매출을 계산하면 가격 인상 후 이미 판매된 티켓 수입까지 바뀝니다.",
    explanations: [
      "원본 SCREEN.PRICE INT와 10% UPDATE는 단일 가격 학습에는 충분하지만 showtime·좌석 등급·프로모션·세금·currency·판매 시점을 표현하지 못합니다. price rule과 booking line의 captured unit price를 분리합니다.",
      "돈은 DECIMAL precision/scale 또는 통화 minor units integer로 저장하고 currency code를 함께 둡니다. floating point를 금지하고 discount/tax/rounding owner와 순서를 contract합니다.",
      "reservation_item에는 base, discount, tax, final amount와 pricing_version 또는 immutable quote id를 저장합니다. current price rule 변경은 future sales에만 적용되고 과거 invoice/refund는 snapshot을 사용합니다.",
      "매출은 예약 status만 합산하지 않고 captured/settled payment와 refund ledger를 정의한 회계 grain으로 집계합니다. authorization/capture/refund/chargeback은 append-only events와 idempotency key를 가집니다.",
      "price update는 10% 곱셈 뒤 declared scale로 한 번 round하고 maximum/negative constraints를 적용합니다. UI 표시용 formatted string과 DB exact amount를 분리합니다.",
    ],
    concepts: [
      c("price snapshot", "구매 승인 시점의 단가·할인·세금·currency·version을 immutable하게 보존한 값입니다.", ["과거 매출을 안정화합니다.", "current rule과 분리합니다."]),
      c("minor unit", "통화의 최소 단위를 integer로 표현하는 금액 모델입니다.", ["currency별 exponent를 알아야 합니다.", "fractional pricing 정책을 둡니다."]),
      c("payment ledger", "승인·정산·환불·chargeback을 append-only monetary events로 기록한 원장입니다.", ["예약 상태와 분리합니다.", "reconciliation을 지원합니다."]),
    ],
    codeExamples: [py("db17-price-snapshot", "현재 가격과 판매 가격 snapshot 분리", "db17_money.py", "가격표 변경 뒤에도 기존 티켓의 captured minor-unit 총액이 변하지 않는지 검증합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE price(showtime_id INTEGER PRIMARY KEY, amount_minor INTEGER CHECK(amount_minor >= 0), currency TEXT)")
db.execute("CREATE TABLE ticket(id INTEGER PRIMARY KEY, showtime_id INTEGER, captured_minor INTEGER, currency TEXT)")
db.execute("INSERT INTO price VALUES (1001, 12000, 'KRW')")
db.executemany("INSERT INTO ticket VALUES (?, 1001, 12000, 'KRW')", [(1,), (2,)])
before = db.execute("SELECT sum(captured_minor) FROM ticket").fetchone()[0]
db.execute("UPDATE price SET amount_minor = 13500 WHERE showtime_id = 1001")
after = db.execute("SELECT sum(captured_minor) FROM ticket").fetchone()[0]
current = db.execute("SELECT amount_minor FROM price WHERE showtime_id = 1001").fetchone()[0]
print("ticket-revenue=" + str(before))
print("current-price=" + str(current))
print("revenue-after-change=" + str(after))
print("snapshot-stable=" + str(before == after).lower())`, "ticket-revenue=24000\ncurrent-price=13500\nrevenue-after-change=24000\nsnapshot-stable=true", ["mysql-decimal", "mysql-check", "oracle-create-table", "sqlite-create-table"])],
    diagnostics: [
      d("가격 인상 후 지난달 매출이 바뀝니다.", "report가 ticket snapshot 대신 current screen/showtime price를 join합니다.", ["revenue grain/source", "captured price columns", "pricing change time", "refund ledger"], "판매 시 price snapshot을 immutable line에 저장하고 ledger event로 revenue를 계산합니다.", "price-change-before/after historical report golden test를 둡니다."),
      d("10% 할인 합계가 화면/DB/결제사에서 다릅니다.", "floating point 또는 계층마다 다른 rounding 순서를 사용했습니다.", ["numeric types", "currency exponent", "rounding mode/order", "line-vs-order allocation"], "exact decimal/minor units와 하나의 versioned rounding/allocation rule을 사용합니다.", "half-boundary, multi-line allocation과 refund sum reconciliation을 둡니다."),
    ],
    expertNotes: ["가격표는 정책이고 판매 line은 사실이므로 update propagation을 막습니다.", "매출 KPI와 현금 settlement는 서로 다른 grain/watermark일 수 있음을 문서화합니다."],
  },
  {
    id: "concurrent-booking-idempotency-transaction",
    title: "동시 좌석 예약을 UNIQUE·transaction·idempotency로 정확히 한 번 처리합니다",
    lead: "빈 좌석을 SELECT한 뒤 INSERT하는 두 단계는 두 요청이 동시에 빈 상태를 보고 같은 좌석을 결제할 수 있는 race입니다.",
    explanations: [
      "DB UNIQUE(showtime_id,seat_id)를 최종 arbitration point로 둡니다. optimistic insert는 한 요청만 성공하고 loser duplicate를 sold conflict로 받으며, pessimistic inventory row lock은 hold/복수 좌석 ordering이 필요할 때 사용합니다.",
      "booking command는 idempotency key+request fingerprint를 unique claim하고 order, allocations, price snapshots와 outbox를 한 transaction에 넣습니다. timeout-after-commit retry는 기존 booking response를 읽어야 합니다.",
      "복수 좌석은 stable seat_id order로 lock/insert해 deadlock을 줄이고 all-or-nothing 또는 partial 성공 정책을 명시합니다. 결제 외부 호출을 DB lock transaction 안에서 기다리지 않고 payment intent/saga 상태를 설계합니다.",
      "hold는 expires_at과 상태만으로 자동 release되지 않습니다. active inventory key가 만료 hold를 어떻게 제외하는지 sweeper/transaction과 clock authority를 정하고, 판매 시 hold owner/token을 atomic compare합니다.",
      "isolation level, lock wait timeout, deadlock victim과 unknown outcome을 error taxonomy로 둡니다. retry는 idempotency가 있을 때 bounded backoff로 실행하고 새 key로 중복 효과를 만들지 않습니다.",
    ],
    concepts: [
      c("arbitration constraint", "동시 경쟁 중 허용된 한 write만 commit되도록 DB가 판정하는 UNIQUE/lock 규칙입니다.", ["application check를 보완합니다.", "오류를 business conflict로 map합니다."]),
      c("idempotency key", "같은 logical booking retry를 식별해 동일 effect/response를 재사용하는 key입니다.", ["request fingerprint와 묶습니다.", "tenant/operation scope가 필요합니다."]),
      c("unknown outcome", "client timeout 뒤 transaction commit 여부를 모르는 상태입니다.", ["read-by-key가 필요합니다.", "blind retry를 금지합니다."]),
    ],
    codeExamples: [py("db17-idempotent-booking", "좌석 UNIQUE와 idempotent response replay", "db17_booking.py", "같은 command 재시도는 같은 booking을 반환하고 다른 command의 동일 좌석은 conflict가 되는지 검증합니다.", String.raw`import hashlib
import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE booking(id INTEGER PRIMARY KEY AUTOINCREMENT, command_key TEXT UNIQUE, fingerprint TEXT)")
db.execute("CREATE TABLE allocation(booking_id INTEGER, showtime_id INTEGER, seat_id INTEGER, UNIQUE(showtime_id, seat_id))")
def book(command_key, showtime_id, seat_id):
    fingerprint = hashlib.sha256(f"{showtime_id}|{seat_id}".encode()).hexdigest()
    prior = db.execute("SELECT id, fingerprint FROM booking WHERE command_key=?", (command_key,)).fetchone()
    if prior:
        if prior[1] != fingerprint:
            raise ValueError("idempotency-mismatch")
        return prior[0], True
    with db:
        booking_id = db.execute("INSERT INTO booking(command_key,fingerprint) VALUES(?,?)", (command_key, fingerprint)).lastrowid
        db.execute("INSERT INTO allocation VALUES(?,?,?)", (booking_id, showtime_id, seat_id))
    return booking_id, False
for _ in range(2):
    booking_id, replayed = book("CMD-01", 1001, 501)
    print(f"booking={booking_id}|replayed={str(replayed).lower()}")
try:
    book("CMD-02", 1001, 501)
except sqlite3.IntegrityError:
    print("other-command=sold")
print("allocations=" + str(db.execute("SELECT count(*) FROM allocation").fetchone()[0]))`, "booking=1|replayed=false\nbooking=1|replayed=true\nother-command=sold\nallocations=1", ["mysql-locking-reads", "mysql-transaction", "mysql-insert-duplicate", "sqlite-transaction", "sqlite-upsert"])],
    diagnostics: [
      d("부하 테스트에서 동일 좌석 두 건이 생성됩니다.", "availability SELECT와 INSERT 사이 race를 DB uniqueness로 닫지 않았습니다.", ["unique constraint", "transaction/isolation", "concurrent timeline", "error mapping"], "showtime-seat UNIQUE를 최종 판정으로 두고 insert conflict를 일관된 sold response로 처리합니다.", "barrier를 사용한 two-connection race test를 둡니다."),
      d("결제 timeout retry가 두 booking을 만듭니다.", "client retry가 새 command key를 사용하거나 idempotency record와 allocation이 다른 transaction입니다.", ["command keys/fingerprint", "commit timeline", "booking/allocation counts", "response replay"], "한 logical request key를 전 effect와 같은 transaction에서 claim하고 read-by-key로 outcome을 회복합니다.", "timeout-before/after-commit fault injection을 둡니다."),
    ],
    expertNotes: ["availability cache는 힌트이고 DB arbitration constraint가 판매 진실입니다.", "외부 결제와 좌석 DB 사이 exactly-once를 주장하지 말고 idempotent state machine과 reconciliation을 운영합니다."],
  },
  {
    id: "reservation-lifecycle-cancel-refund",
    title: "hold·confirmed·cancelled·refunded 상태 전이와 inventory release를 설계합니다",
    lead: "예약 boolean 하나로는 임시 hold, 결제 승인, 사용자 취소, 상영 취소와 환불 진행을 구분할 수 없습니다.",
    explanations: [
      "booking status와 payment status, seat allocation status를 분리합니다. PENDING/HOLD, CONFIRMED, CANCELLED, EXPIRED와 payment AUTHORIZED/CAPTURED/REFUNDED는 서로 다른 owner와 failure를 가집니다.",
      "허용 transition을 표로 만들고 status_changed_at, reason, actor와 version을 append-only event로 기록합니다. application UPDATE만 믿지 않고 optimistic version/expected status predicate로 stale command를 거부합니다.",
      "취소와 seat release, refund request와 outbox는 한 local transaction에서 기록합니다. 실제 payment provider refund는 worker가 idempotent하게 실행하고 callback/retry를 ledger와 reconciliation합니다.",
      "상영 시작 이후 취소, cinema cancellation, partial seats와 policy cutoff를 showtime local time/instant로 평가합니다. policy version과 calculated fee/refund snapshot을 저장합니다.",
      "expired holds sweeper는 batch claim, SKIP LOCKED 같은 engine 기능, clock skew와 crash recovery를 고려합니다. 만료 처리와 동시에 결제가 완료되는 race는 expected-state conditional update로 한 결과만 승인합니다.",
    ],
    concepts: [
      c("state machine", "허용 상태와 전이·guard·side effects를 명시한 lifecycle 모델입니다.", ["illegal transition을 거부합니다.", "version/actor/reason을 기록합니다."]),
      c("conditional transition", "현재 status/version이 예상값일 때만 상태를 바꾸는 atomic update입니다.", ["stale command를 막습니다.", "affected row를 확인합니다."]),
      c("compensation", "이미 commit된 다른 system 효과를 새 반대 동작으로 상쇄하는 과정입니다.", ["rollback과 다릅니다.", "idempotent refund가 예입니다."]),
    ],
    diagnostics: [
      d("취소된 좌석이 계속 sold로 남습니다.", "booking status와 active allocation release를 다른 transaction/worker에서 불일치하게 처리했습니다.", ["status/allocation rows", "transaction boundary", "outbox/retry", "active uniqueness design"], "취소 transition과 allocation release/outbox를 한 local transaction에 두고 reconciliation repair를 운영합니다.", "각 failure point에서 status-active-key parity를 확인합니다."),
      d("hold expiry와 결제 완료가 동시에 성공합니다.", "두 worker가 expected state/version 없이 unconditional update했습니다.", ["update predicates", "row versions", "timestamps/clock", "affected rows"], "WHERE status='HOLD' AND version=? 같은 conditional transition으로 한 승자만 인정합니다.", "barrier race와 stale callback tests를 둡니다."),
    ],
    expertNotes: ["상태값 목록보다 transition graph와 side-effect ownership이 더 중요합니다.", "historical event는 개인정보를 최소화하고 business key/actor class로 설명 가능하게 보존합니다."],
  },
  {
    id: "reports-grain-index-plans",
    title: "상영·관객·매출 report의 grain을 맞추고 composite index를 검증합니다",
    lead: "극장별 평균 관객을 reservation rows에서 바로 AVG하면 상영별 관객 평균과 전혀 다른 값이 될 수 있습니다.",
    explanations: [
      "report마다 source population, row grain, time zone/day, status inclusion, money event, tie policy와 freshness를 정의합니다. theater count, showtime attendance, tickets sold, unique customers와 settled revenue를 같은 COUNT로 취급하지 않습니다.",
      "상영별 관객 수를 먼저 GROUP BY showtime하고 theater별 AVG를 계산합니다. movie title로 group하면 동명 영화/재개봉이 합쳐지므로 movie_id/version을 사용합니다.",
      "가장 많은 고객 영화는 tie와 deterministic order를 정의합니다. LIMIT 1만 쓰면 동률에서 임의 결과가 나올 수 있어 RANK/include-ties 또는 stable secondary key를 계약합니다.",
      "index는 query equality/range/order와 FK enforcement를 기준으로 `(theater_id,starts_at,status)`, `(showtime_id,status,seat_id)`, ledger의 `(occurred_at,type)` 등을 actual workload로 검증합니다. wide over-indexing의 write/storage cost도 측정합니다.",
      "EXPLAIN estimated만 보지 않고 representative skew에서 actual rows/loops, temp/sort/spill, lock wait와 p95를 봅니다. report replica/materialized summary는 watermark와 source reconciliation을 가집니다.",
    ],
    concepts: [
      c("report grain", "한 결과 행/집계 단위가 무엇인지 정의한 것입니다.", ["source grain과 변환을 기록합니다.", "double counting을 막습니다."]),
      c("two-stage aggregation", "세부 grain을 먼저 집계한 뒤 상위 grain에서 다시 계산하는 방식입니다.", ["평균의 평균 가중치를 주의합니다.", "intermediate counts를 검증합니다."]),
      c("plan evidence", "실제 입력 분포에서 access path·rows·loops·sort/temp·latency를 측정한 근거입니다.", ["index 채택을 설명합니다.", "engine/version을 기록합니다."]),
    ],
    codeExamples: [py("db17-report-grain", "showtime별 관객에서 theater 평균 계산", "db17_reports.py", "예약 rows를 showtime grain으로 먼저 집계해 theater별 평균 관객과 ticket count를 구분합니다.", String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE showtime(id INTEGER PRIMARY KEY, theater_id INTEGER, movie_key TEXT)")
db.execute("CREATE TABLE ticket(id INTEGER PRIMARY KEY, showtime_id INTEGER, status TEXT)")
db.executemany("INSERT INTO showtime VALUES (?, ?, ?)", [(1, 10, "M-A"), (2, 10, "M-B"), (3, 20, "M-A")])
db.executemany("INSERT INTO ticket VALUES (?, ?, 'CONFIRMED')", [(1, 1), (2, 1), (3, 2), (4, 3), (5, 3), (6, 3)])
query = """WITH attendance AS (SELECT s.theater_id, s.id showtime_id, count(t.id) viewers FROM showtime s LEFT JOIN ticket t ON t.showtime_id=s.id AND t.status='CONFIRMED' GROUP BY s.theater_id,s.id) SELECT theater_id, count(*) showtimes, sum(viewers) tickets, avg(viewers) average FROM attendance GROUP BY theater_id ORDER BY theater_id"""
for theater, showtimes, tickets, average in db.execute(query):
    print(f"theater={theater}|showtimes={showtimes}|tickets={tickets}|average={average:.2f}")
top = list(db.execute("SELECT s.movie_key, count(*) viewers FROM ticket t JOIN showtime s ON s.id=t.showtime_id GROUP BY s.movie_key ORDER BY viewers DESC, s.movie_key"))
print("movie-counts=" + ",".join(f"{key}:{count}" for key, count in top))`, "theater=10|showtimes=2|tickets=3|average=1.50\ntheater=20|showtimes=1|tickets=3|average=3.00\nmovie-counts=M-A:5,M-B:1", ["local-homework", "mysql-multicolumn-index", "mysql-explain", "sqlite-create-index"])],
    diagnostics: [
      d("극장별 평균 관객이 ticket 총수와 비슷한 이상한 값입니다.", "showtime별 count를 만들지 않고 reservation row grain에서 AVG/COUNT를 혼합했습니다.", ["metric definition", "intermediate showtime ids/counts", "zero-attendance showtimes", "status filter"], "showtime grain attendance CTE를 만들고 theater별 sum/avg를 별도로 계산합니다.", "zero/one/many showtime/ticket golden table을 둡니다."),
      d("인덱스를 추가했는데 report가 더 느리고 booking write도 느려집니다.", "query predicate/order와 맞지 않는 wide index를 추측으로 추가했습니다.", ["actual plan", "rows/loops/sort", "index key order", "write amplification/storage"], "representative workload에서 후보 index 전후 read/write budget을 측정해 최소 index만 유지합니다.", "plan+latency+write regression과 unused-index review를 둡니다."),
    ],
    expertNotes: ["report SQL을 쓰기 전에 metric grain/population/time/money semantics를 표로 승인합니다.", "매출·관객 report에는 definition version과 data watermark를 함께 공개합니다."],
  },
  {
    id: "migration-seed-privacy-portability",
    title: "원본 schema를 무중단 migration하고 seed·PII·dialect를 분리합니다",
    lead: "학습용 CREATE/INSERT script를 그대로 production migration으로 실행하면 identity, data, constraint, 개인정보와 engine 차이가 한 파일에 섞입니다.",
    explanations: [
      "HOMEWORK.sql의 DDL, sample INSERT와 report queries를 분리합니다. schema migrations는 deterministic/forward-only artifact, synthetic demo seed는 별도 profile, reports는 tested query module로 관리합니다.",
      "기존 SCREEN에서 auditorium과 showtime을 분리할 때 expand tables→backfill stable mappings→dual write/read→reconcile counts/keys/amounts→FK/NOT NULL validate→cutover→old columns retire 순서로 진행합니다.",
      "원본 customer name/address는 새 교재나 migration fixture에 복사하지 않습니다. production migration은 raw PII를 export/log하지 않고 opaque user_id mapping과 aggregate counts/hash reconciliation을 사용합니다.",
      "AUTO_INCREMENT, boolean, CHECK enforcement, DATETIME/timezone, LIMIT, UPSERT와 online DDL은 MySQL·Oracle·SQLite가 다릅니다. semantic contract와 dialect DDL adapter를 분리하고 clean install/upgrade/rollback matrix를 실행합니다.",
      "backfill은 resumable batch key, high-watermark와 idempotent upsert를 사용하고 source/target unmatched/duplicate/null counts를 기록합니다. constraint validation 전 orphan/duplicate rows를 owner가 승인·수정합니다.",
    ],
    concepts: [
      c("expand-contract migration", "새 구조를 병행 추가·backfill·전환한 뒤 old 구조를 제거하는 방식입니다.", ["downtime을 줄입니다.", "reconciliation/rollback window를 둡니다."]),
      c("synthetic seed", "실제 사람/거래를 닮지 않은 opaque fixture로 schema와 query를 재현하는 데이터입니다.", ["PII를 복사하지 않습니다.", "boundary/collision을 의도적으로 만듭니다."]),
      c("semantic portability", "다른 dialect DDL을 사용해도 동일한 key·constraint·transaction·time 계약을 만족하는 성질입니다.", ["동일 SQL text가 목표가 아닙니다.", "approved differences를 기록합니다."]),
    ],
    diagnostics: [
      d("backfill 후 예약 수는 같지만 일부 좌석 mapping이 틀립니다.", "row count만 비교하고 source composite key→new ids 관계를 검증하지 않았습니다.", ["mapping table", "unmatched/duplicate keys", "sample-free canonical hashes", "FK violations"], "old scoped keys와 new ids를 mapping artifact로 보존하고 key-level reconciliation합니다.", "restartable batch와 duplicate/orphan zero gate를 둡니다."),
      d("Oracle/SQLite에서 MySQL migration script가 문법 또는 의미 오류입니다.", "AUTO_INCREMENT/LIMIT/check/upsert/time semantics를 문자열 치환으로 이식했습니다.", ["capability matrix", "actual DDL metadata", "constraint enforcement", "time/identity behavior"], "공통 semantic fixtures와 엔진별 migration artifact를 유지합니다.", "모든 지원 engine clean install/upgrade/rollback CI를 둡니다."),
    ],
    expertNotes: ["schema migration evidence는 counts뿐 아니라 keys, constraints, money/time invariants와 consumer readback입니다.", "demo seed도 repository에 영구 남으므로 원본 sample 개인 정보를 복사하지 않습니다."],
  },
  {
    id: "backup-recovery-observability-capstone",
    title: "백업·복구·reconciliation·관측까지 종합 과제를 운영합니다",
    lead: "예약 schema는 CREATE TABLE이 끝이 아니라 결제와 좌석 진실을 장애·복구·지연·인적 오류 뒤에도 다시 증명할 수 있어야 완성입니다.",
    explanations: [
      "RPO/RTO를 booking, payment ledger, schedule과 PII별로 정의하고 full/incremental/log backup, point-in-time recovery와 encryption/key escrow를 설계합니다. backup 성공 메시지보다 격리 restore가 중요합니다.",
      "복구 후 showtime-seat active duplicates, booking-item totals, payment/refund sums, outbox delivery와 FK/orphan을 reconciliation합니다. external payment provider와 비교할 stable merchant/idempotency refs를 저장합니다.",
      "관측에는 booking success/conflict/replay/error, lock/deadlock/latency, hold expiry lag, seat inventory gaps, payment reconciliation, report watermark와 migration drift를 남기되 customer name/address/raw payment data는 수집하지 않습니다.",
      "capacity incident에는 admission control, queue, timeout hierarchy와 degraded read-only seat map을 사용하되 판매 진실은 primary arbitration DB에 둡니다. cache stale를 sold로 확정하지 않습니다.",
      "capstone 완료 증거는 requirements traceability→schema metadata→exact examples→concurrency/fault tests→actual plans→migration rehearsal→restore/reconciliation→privacy review와 runbook drill입니다.",
    ],
    concepts: [
      c("point-in-time recovery", "backup과 transaction logs를 이용해 지정한 장애 직전 시점으로 복구하는 절차입니다.", ["격리 환경에서 연습합니다.", "external effects는 별도 reconcile합니다."]),
      c("reconciliation", "서로 다른 tables/systems의 keys·counts·amounts·states가 정의된 불변식과 맞는지 비교하는 과정입니다.", ["gap을 repair queue로 보냅니다.", "raw PII 없이 수행합니다."]),
      c("traceability matrix", "업무 요구·invariant를 schema constraint, command, test, telemetry와 연결한 표입니다.", ["종합 과제 completeness를 증명합니다.", "owner/evidence를 가집니다."]),
    ],
    diagnostics: [
      d("backup restore는 성공했지만 좌석 판매와 결제 건수가 다릅니다.", "DB 복구 시점과 external payment/outbox effects를 reconciliation하지 않았습니다.", ["restore watermark", "payment provider refs", "booking/allocation/ledger counts", "outbox delivery"], "PITR 후 idempotency refs로 외부 effects를 비교하고 missing/duplicate를 승인된 repair workflow로 처리합니다.", "분기별 restore+external reconciliation drill을 둡니다."),
      d("장애 때 seat cache를 기준으로 중복 판매합니다.", "degraded mode에서 cache를 authoritative inventory로 승격했습니다.", ["write routing", "cache age/watermark", "DB availability", "constraint/error metrics"], "primary arbitration이 불가능하면 판매를 queue/fail closed하고 read-only availability에 stale 표시를 합니다.", "DB outage/cache stale chaos test와 runbook을 둡니다."),
    ],
    expertNotes: ["복구 가능한 schema는 backup 파일뿐 아니라 external side effects를 다시 맞출 stable references를 저장합니다.", "capstone review는 기능 데모보다 failure·privacy·recovery evidence를 우선합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-homework", repository: "dbstudy", path: "HOMEWORK.sql", usedFor: ["theater, screen, customer, reservation schema; queries; uniqueness-scope counterexample"], evidence: "read-only로 145 logical lines를 확인했으며 sample names, addresses, movie/theater labels and dates는 복사하지 않았습니다." },
  { id: "mysql-create-table", repository: "MySQL 8.4 Reference Manual", path: "CREATE TABLE Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table.html", usedFor: ["keys, identity, constraints and table DDL"], evidence: "MySQL 공식 CREATE TABLE 문서입니다." },
  { id: "mysql-foreign-keys", repository: "MySQL 8.4 Reference Manual", path: "FOREIGN KEY Constraints", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html", usedFor: ["relationship integrity and delete actions"], evidence: "MySQL 공식 FK 문서입니다." },
  { id: "mysql-check", repository: "MySQL 8.4 Reference Manual", path: "CHECK Constraints", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-table-check-constraints.html", usedFor: ["row-local invariants"], evidence: "MySQL 공식 CHECK 문서입니다." },
  { id: "mysql-decimal", repository: "MySQL 8.4 Reference Manual", path: "DECIMAL Data Type Characteristics", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/precision-math-decimal-characteristics.html", usedFor: ["exact money precision and rounding"], evidence: "MySQL 공식 DECIMAL 문서입니다." },
  { id: "mysql-datetime", repository: "MySQL 8.4 Reference Manual", path: "DATE, DATETIME, and TIMESTAMP Types", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/datetime.html", usedFor: ["showtime instant and range modeling"], evidence: "MySQL 공식 temporal type 문서입니다." },
  { id: "mysql-locking-reads", repository: "MySQL 8.4 Reference Manual", path: "Locking Reads", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html", usedFor: ["concurrent seat allocation"], evidence: "MySQL 공식 locking read 문서입니다." },
  { id: "mysql-transaction", repository: "MySQL 8.4 Reference Manual", path: "START TRANSACTION, COMMIT, and ROLLBACK", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/commit.html", usedFor: ["booking atomicity and outcome"], evidence: "MySQL 공식 transaction 문서입니다." },
  { id: "mysql-insert-duplicate", repository: "MySQL 8.4 Reference Manual", path: "INSERT ON DUPLICATE KEY UPDATE", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html", usedFor: ["idempotent claim and conflict caveats"], evidence: "MySQL 공식 duplicate-key insert 문서입니다." },
  { id: "mysql-multicolumn-index", repository: "MySQL 8.4 Reference Manual", path: "Multiple-Column Indexes", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html", usedFor: ["report and inventory index order"], evidence: "MySQL 공식 composite index 문서입니다." },
  { id: "mysql-explain", repository: "MySQL 8.4 Reference Manual", path: "EXPLAIN Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/explain.html", usedFor: ["actual plan evidence"], evidence: "MySQL 공식 EXPLAIN 문서입니다." },
  { id: "oracle-create-table", repository: "Oracle Database 26ai SQL Language Reference", path: "CREATE TABLE", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/CREATE-TABLE.html", usedFor: ["Oracle table, identity and temporal portability"], evidence: "Oracle 공식 CREATE TABLE 문서입니다." },
  { id: "oracle-constraints", repository: "Oracle Database 26ai SQL Language Reference", path: "constraint", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/constraint.html", usedFor: ["Oracle key/FK/check portability"], evidence: "Oracle 공식 constraint 문서입니다." },
  { id: "sqlite-create-table", repository: "SQLite Documentation", path: "CREATE TABLE", publicUrl: "https://www.sqlite.org/lang_createtable.html", usedFor: ["exact schema and constraint laboratory"], evidence: "SQLite 공식 CREATE TABLE 문서입니다." },
  { id: "sqlite-foreign-keys", repository: "SQLite Documentation", path: "Foreign Key Support", publicUrl: "https://www.sqlite.org/foreignkeys.html", usedFor: ["exact relationship laboratory"], evidence: "SQLite 공식 FK 문서입니다." },
  { id: "sqlite-transaction", repository: "SQLite Documentation", path: "Transaction", publicUrl: "https://www.sqlite.org/lang_transaction.html", usedFor: ["exact booking atomicity harness"], evidence: "SQLite 공식 transaction 문서입니다." },
  { id: "sqlite-upsert", repository: "SQLite Documentation", path: "UPSERT", publicUrl: "https://www.sqlite.org/lang_upsert.html", usedFor: ["idempotent semantic harness"], evidence: "SQLite 공식 UPSERT 문서입니다." },
  { id: "sqlite-create-index", repository: "SQLite Documentation", path: "CREATE INDEX", publicUrl: "https://www.sqlite.org/lang_createindex.html", usedFor: ["exact composite index laboratory"], evidence: "SQLite 공식 CREATE INDEX 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-17-theater-capstone", slug: "db-17-theater-capstone", courseId: "database", moduleId: "db-project-schema-portability", order: 1,
  title: "극장·상영관·예약 스키마 SQL 종합 과제", subtitle: "학습용 극장 DDL을 grain·좌석 exclusivity·시간·가격 snapshot·동시성·보고·migration·복구까지 검증된 예약 시스템으로 재설계합니다.", level: "고급", estimatedMinutes: 1100,
  coreQuestion: "극장 예약 schema가 같은 좌석을 중복 판매하지 않고 시간·가격·상태 이력을 보존하며, 장애·migration·engine 차이 뒤에도 진실을 복구할 수 있다고 어떻게 증명할까요?",
  summary: "HOMEWORK.sql의 THEATER/SCREEN/CUSTOMERS/RESERVATION과 조회·집계·DML을 read-only로 감사합니다. 요구사항을 entity/event/grain/invariant로 번역하고 theater→auditorium→layout seat, movie→showtime 시간 모델, 원본 PK/UNIQUE scope의 over/under-constraint를 showtime-seat exclusivity로 수정합니다. exact money와 price snapshot/ledger, concurrent booking UNIQUE·lock·idempotency·transaction, hold/cancel/refund state machine, report grain/index/plan, expand-contract migration·synthetic seed·privacy·dialect conformance, PITR/reconciliation/observability까지 하나의 capstone으로 연결합니다. 여섯 exact Python/SQLite examples는 scoped keys, overlap, seat uniqueness, price snapshot, idempotent booking과 report grain을 실행합니다.",
  objectives: ["요구사항을 row grain, candidate keys와 testable invariants로 변환한다.", "theater/auditorium/layout/seat와 movie/showtime을 정규화한다.", "원본 예약 uniqueness scope 오류를 반례와 constraint로 수정한다.", "시간/timezone/overlap과 money/price snapshot/ledger를 설계한다.", "좌석 동시성, idempotency, transaction과 lifecycle race를 검증한다.", "reports grain, composite indexes와 actual plans를 측정한다.", "migration/privacy/portability/backup/recovery/reconciliation을 종합 운영한다."],
  prerequisites: [{ title: "실행 계획과 쿼리 튜닝", reason: "종합 schema의 join/report/index를 actual plan으로 검증하기 위해 필요합니다.", sessionSlug: "db-16-explain-query-tuning" }],
  keywords: ["theater schema", "auditorium", "showtime", "seat allocation", "reservation", "composite unique", "time range", "timezone", "money", "price snapshot", "idempotency", "locking", "state machine", "report grain", "migration", "PITR"], topics,
  lab: {
    title: "극장 예약 v2를 설계·동시성 검증·migration·복구하는 종합 프로젝트",
    scenario: "기존 SCREEN/RESERVATION에는 showtime이 없고 잘못된 customer-seat UNIQUE가 있습니다. 다중 상영·좌석 layout·가격 변경·동시 판매·취소/환불·report·무중단 이관과 장애 복구를 지원해야 합니다.",
    setup: ["원본은 read-only provenance로만 사용하고 opaque theater/auditorium/movie/customer keys와 boundary fixtures를 만듭니다.", "MySQL 8.4·Oracle 26ai 격리 schemas와 SQLite exact harness를 준비합니다.", "requirements→grain→keys→invariants→commands→tests traceability matrix를 작성합니다.", "same local numbers, overlap/adjacent/DST, duplicate seat, max money, concurrency/fault/skew fixtures를 고정합니다."],
    steps: ["원본 PK/FK/UNIQUE를 반례로 평가하고 new entity/event grains를 확정합니다.", "theater/auditorium/layout/seat/movie/showtime DDL과 scoped keys를 metadata readback합니다.", "showtime interval/buffer/timezone boundary와 schedule conflict race를 검증합니다.", "showtime-seat UNIQUE, auditorium-seat compatibility와 취소 후 active reallocation을 검증합니다.", "price quote/snapshot/payment/refund ledger의 exact sums와 변경 불변성을 reconciliation합니다.", "two-connection booking, same-key retry, deadlock/timeout/unknown outcome과 fault injection을 실행합니다.", "hold/confirm/expire/cancel/refund conditional transitions와 outbox parity를 검증합니다.", "attendance/revenue/top metrics의 grain/tie/time/status와 actual plan/index budgets를 측정합니다.", "expand/backfill/dual-read/cutover/rollback을 key/count/amount/orphan zero evidence로 rehearsal합니다.", "격리 restore 뒤 seat/payment/outbox/report watermark와 privacy-safe telemetry를 reconciliation합니다."],
    expectedResult: ["모든 entity/event가 한 grain과 안정 key를 가지며 FK/constraints가 invalid state를 거부합니다.", "동시 요청에도 showtime-seat당 active allocation이 최대 하나이고 retry는 같은 response를 돌려줍니다.", "시간·가격·상태 history와 reports가 versioned semantics로 재현됩니다.", "MySQL·Oracle dialect/plan/lock 차이가 승인된 matrix와 budget을 만족합니다.", "migration/restore/reconciliation/rollback이 원본 PII 복사 없이 반복 가능합니다."],
    cleanup: ["격리 schemas/users, synthetic rows, locks/jobs, reports와 restore artifacts를 제거합니다.", "temporary credentials/backups/exports를 revoke·삭제합니다.", "logs/fixtures에 원본 theater/movie/customer names, addresses와 dates가 없는지 검사합니다.", "dbstudy/HOMEWORK.sql과 production data는 변경하지 않습니다."],
    extensions: ["좌석 등급·휠체어 companion rules와 dynamic pricing을 확장합니다.", "multi-region inventory owner와 queue/admission-control을 설계합니다.", "payment provider sandbox/outbox reconciliation과 chargeback을 구현합니다.", "event sourcing snapshot과 conventional relational state를 비교합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 exact examples를 실행하고 각 schema/time/money/concurrency/report invariant를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "local number scope를 설명합니다.", "adjacent/overlap interval을 구분합니다.", "원본 UNIQUE 반례와 수정 key를 적습니다.", "가격 변경 전후 ticket revenue를 비교합니다.", "idempotent replay와 sold conflict를 구분합니다.", "showtime/theater report grain을 추적합니다."], hints: ["좌석 번호가 같다는 것과 같은 물리 좌석이라는 것은 다릅니다."], expectedOutcome: "종합 schema의 key·time·money·transaction을 실행 결과로 설명합니다.", solutionOutline: ["requirements→keys→constraints→transactions→reports→operations 순서입니다."] },
    { difficulty: "응용", prompt: "HOMEWORK.sql을 production-ready theater v2로 무중단 이관하세요.", requirements: ["원본 sample 비복사/provenance를 기록합니다.", "entity/event/grain/key matrix를 작성합니다.", "showtime-seat constraint와 concurrent tests를 실행합니다.", "time/price/state snapshots를 보존합니다.", "idempotency/outbox/payment reconciliation을 둡니다.", "report grain/index/plan budget을 검증합니다.", "expand/backfill/dual-read/cutover/rollback을 rehearsal합니다.", "restore/privacy/runbook evidence를 포함합니다."], hints: ["DDL 성공보다 old→new key mapping과 invariants reconciliation이 중요합니다."], expectedOutcome: "기능·동시성·이관·복구가 검증된 예약 data platform이 완성됩니다.", solutionOutline: ["audit→redesign→race/fault→plan→migration→restore 순서입니다."] },
    { difficulty: "설계", prompt: "극장 예약 schema architecture review packet을 작성하세요.", requirements: ["requirements traceability와 ERD/grain/keys를 포함합니다.", "uniqueness/time/money/state invariants ownership을 둡니다.", "transaction/isolation/lock/idempotency/error matrix를 정의합니다.", "privacy/retention/access/audit 경계를 둡니다.", "engine DDL/plan/online migration 차이를 기록합니다.", "SLO/capacity/index/write budgets를 정의합니다.", "backup/PITR/external reconciliation/repair를 포함합니다.", "canary/rollback/incident drill evidence를 요구합니다."], hints: ["종합 과제의 끝은 테이블 생성이 아니라 실패 후 진실을 재구성하는 것입니다."], expectedOutcome: "전문가 수준의 schema·운영 review가 완성됩니다.", solutionOutline: ["trace→constrain→serialize→measure→migrate→recover→govern 순서입니다."] },
  ],
  nextSessions: ["db-18-user-auth-schema"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["HOMEWORK.sql 145 logical lines, 6,779 bytes, active 110 lines를 read-only로 확인했습니다. SHA-256은 44EFC464F8DFD72971ECDF9E17CADEF0C24D8D29B19AF4E49491737FA7317908입니다.", "원본 THEATER/SCREEN/CUSTOMERS/RESERVATION DDL과 query progression만 provenance로 사용하고 theater/movie/customer names, addresses and dates는 복사하지 않았습니다.", "원본 PK(THEATER_NUMBER,SCREEN_NUMBER,CUSTOMER_NUMBER)는 same-showtime seat collision을 막지 못하고 UNIQUE(CUSTOMER_NUMBER,SEAT_NUMBER)는 다른 showtime의 같은 label까지 금지하는 scope 오류로 분석했습니다.", "SQLite examples는 MySQL/Oracle의 lock/isolation, temporal/decimal, online migration과 recovery evidence를 대체하지 않습니다."] },
});

export default session;
