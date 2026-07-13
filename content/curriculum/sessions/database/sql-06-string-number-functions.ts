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
      { lines: `1-${first}`, explanation: "Python sqlite3 memory database와 synthetic Unicode·numeric fixtures를 준비하고 단위를 명시합니다." },
      { lines: `${first + 1}-${second}`, explanation: "문자열/숫자 함수, normalization·collation 또는 query-plan 비교를 실행해 raw values가 아닌 stable measurements를 수집합니다." },
      { lines: `${second + 1}-${count}`, explanation: "exact stdout을 기록합니다. SQLite/Python 관찰을 MySQL 8.4·Oracle 26ai의 함수·type/collation 계약으로 일반화하지 않습니다." },
    ],
    run: { environment: ["Python 3.11 이상", "표준 라이브러리 sqlite3·unicodedata·decimal", "외부 DB·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["stdout은 문서와 완전히 같아야 합니다.", "문자열은 synthetic labels만 사용하고 원본의 이름·주소 등 sample PII는 복제하지 않습니다."] },
    experiments: [
      { change: "ASCII fixture를 한글·emoji·NFD sequence 또는 NULL로 바꿉니다.", prediction: "character·code point·UTF-8 byte·grapheme·collation 결과가 같은 숫자로 유지되지 않습니다.", result: "각 column/API limit와 function의 단위를 명시합니다." },
      { change: "indexed column을 LOWER·CAST·연산으로 감싸고 EXPLAIN을 비교합니다.", prediction: "같은 ids가 나와도 일반 index seek가 scan으로 바뀔 수 있습니다.", result: "expression index/generated column 또는 canonical stored value를 workload로 검증합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "character-byte-grapheme-units",
    title: "문자 수·code point·UTF-8 byte·grapheme cluster를 같은 ‘길이’로 부르지 않습니다",
    lead: "ASCII에서는 모두 5처럼 보여도 한글·emoji·combining sequence에서 storage byte와 사용자 눈의 글자 수가 분리됩니다.",
    explanations: [
      "MySQL `CHAR_LENGTH`는 characters, `LENGTH`는 bytes를 반환하지만 character set과 type에 따라 storage/returned byte 해석을 공식 문서로 확인합니다. Oracle LENGTH family에는 character/byte/code-point variants가 있고 LOB/type restrictions가 다릅니다. 이름이 비슷하다는 이유로 portability wrapper를 한 줄 치환하지 않습니다.",
      "Python `len(str)`와 Java `String.length()`도 같은 단위가 아닙니다. Python은 Unicode code points에 가까운 count를 제공하고 Java String은 UTF-16 code units를 셉니다. 사용자 눈의 emoji family나 combining glyph는 grapheme segmentation이 필요하므로 DB column length와 UI counter를 별도 계약으로 둡니다.",
      "원본 02_02.sql은 active standalone LENGTH3·CHAR_LENGTH5로 ASCII와 한글의 byte/character 차이를 시작합니다. 이 세션은 sample 이름을 가져오지 않고 `Hello`, synthetic 한글 3자와 emoji 1개를 사용해 SQLite character count와 Python UTF-8 bytes를 exact 기록합니다.",
      "schema limit는 storage engine bytes, index key bytes, protocol bytes와 domain character limit를 각각 검토합니다. truncate로 오류를 숨기지 않고 validation layer가 어떤 normalization 뒤 어떤 unit으로 길이를 재는지 명시하며 boundary fixtures를 DB·driver·API에서 round-trip합니다.",
    ],
    concepts: [c("character length", "DBMS가 정의한 character 단위로 문자열 길이를 세는 측정입니다.", ["byte length와 다릅니다.", "vendor/type semantics를 확인합니다."]), c("grapheme cluster", "사용자가 한 글자로 인식할 수 있는 하나 이상의 Unicode code points 묶음입니다.", ["emoji/combining marks에서 중요합니다.", "DB LENGTH가 UI 글자 수를 보장하지 않습니다."])],
    codeExamples: [py(
      "sql06-character-byte-length",
      "ASCII·한글·emoji의 SQLite character와 UTF-8 byte 수 비교",
      "character_byte_length.py",
      "세 synthetic strings의 SQLite length와 Python UTF-8 encoding bytes를 같은 stdout에 기록합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
values = [("ascii", "Hello"), ("korean", "가나다"), ("emoji", "🙂")]

for label, text in values:
    characters = db.execute("SELECT length(?)", (text,)).fetchone()[0]
    utf8_bytes = len(text.encode("utf-8"))
    print(f"{label}=chars:{characters},utf8-bytes:{utf8_bytes}")
print("unit-contract=sqlite-characters/python-utf8-bytes")`,
      "ascii=chars:5,utf8-bytes:5\nkorean=chars:3,utf8-bytes:9\nemoji=chars:1,utf8-bytes:4\nunit-contract=sqlite-characters/python-utf8-bytes",
      ["local-db-0202", "mysql-string", "oracle-length", "sqlite-core", "python-unicode", "java-string"],
    )],
    diagnostics: [d("UI는 20자로 표시하지만 DB insert가 multibyte emoji에서만 실패한다.", "UI grapheme/Java UTF-16/DB character·byte/index limits를 같은 단위로 가정했습니다.", ["raw UTF-8 bytes·code points·graphemes를 synthetic fixture로 잽니다.", "column/index charset와 limits를 확인합니다.", "driver encoding과 normalization 시점을 봅니다."], "domain unit과 storage/index byte budget을 분리해 validation하고 full round-trip boundary tests를 추가합니다.", "schema/API 문서에 normalization과 length unit을 필수로 기록합니다.")],
    expertNotes: ["index prefix length와 collated weight bytes는 displayed character count와 달라 long multilingual keys에서 별도 측정이 필요합니다.", "Unicode version upgrade로 segmentation/case/collation 결과가 달라질 수 있어 runtime/DB version을 evidence에 고정합니다."],
  },
  {
    id: "unicode-normalization-collation",
    title: "같아 보이는 Unicode sequence와 normalization·collation equality를 명시적으로 다룹니다",
    lead: "NFC `é`와 NFD `e`+combining accent는 화면이 같아도 binary bytes와 length, DISTINCT·UNIQUE 결과가 달라질 수 있습니다.",
    explanations: [
      "Unicode normalization은 canonical equivalent sequences를 NFC/NFD 등 선택한 form으로 변환합니다. 입력마다 임의로 여러 form을 적용하지 말고 ingest/search/key generation boundary에서 canonical policy를 정합니다. 원본과 legal/audit text 보존이 필요하면 normalized search key와 raw display text를 분리합니다.",
      "collation은 comparison/order rules이며 normalization 자체와 같지 않습니다. case/accent/locale sensitivity, pad behavior와 deterministic flag가 equality·DISTINCT·UNIQUE·ORDER BY·index eligibility를 바꿉니다. MySQL/Oracle collation 이름과 version을 schema evidence로 남깁니다.",
      "SQLite built-in NOCASE는 full Unicode linguistic matching을 일반적으로 제공하는 것으로 가정하지 않습니다. Python `casefold`도 locale-specific user sorting과 동일하지 않습니다. exact engine/extension, ICU version과 expected equivalence pairs를 contract test합니다.",
      "identifier, login, tag와 free text는 요구가 다릅니다. security-sensitive identifier는 confusable/homograph 정책까지 다루고, user content search는 language relevance와 display fidelity를 우선할 수 있습니다. normalization으로 서로 다른 account를 사후 merge하지 않습니다.",
    ],
    concepts: [c("Unicode normalization", "canonically equivalent code-point sequences를 선택한 NFC/NFD 등 form으로 변환하는 과정입니다.", ["collation과 다릅니다.", "ingest/key policy를 정합니다."]), c("linguistic collation", "언어·case·accent 규칙에 따라 문자열 비교와 정렬 weight를 만드는 규칙입니다.", ["DISTINCT/UNIQUE/index에 영향이 있습니다.", "version drift를 검증합니다."])],
    codeExamples: [py(
      "sql06-normalization-collation",
      "NFC/NFD DISTINCT와 SQLite NOCASE·Python casefold 경계",
      "normalization_collation.py",
      "화면상 유사한 Unicode sequences가 raw DISTINCT와 normalization 뒤 어떻게 달라지는지 exact count로 확인합니다.",
      String.raw`import sqlite3
import unicodedata

db = sqlite3.connect(":memory:")
nfc = "é"
nfd = "e\u0301"
db.execute("CREATE TABLE word (value TEXT)")
db.executemany("INSERT INTO word VALUES (?)", [(nfc,), (nfd,)])

raw_distinct = db.execute("SELECT count(DISTINCT value) FROM word").fetchone()[0]
normalized_distinct = len({unicodedata.normalize("NFC", value) for value in (nfc, nfd)})
sqlite_nocase = db.execute("SELECT 'Straße' = 'STRASSE' COLLATE NOCASE").fetchone()[0]
print("raw-distinct=" + str(raw_distinct))
print("nfc-length=" + str(len(nfc)))
print("nfd-length=" + str(len(nfd)))
print("normalized-distinct=" + str(normalized_distinct))
print("sqlite-nocase-strasse=" + str(sqlite_nocase))
print("python-casefold-equal=" + str("Straße".casefold() == "STRASSE".casefold()).lower())`,
      "raw-distinct=2\nnfc-length=1\nnfd-length=2\nnormalized-distinct=1\nsqlite-nocase-strasse=0\npython-casefold-equal=true",
      ["mysql-charset", "oracle-collation", "sqlite-datatype", "python-unicode"],
    )],
    diagnostics: [d("같아 보이는 tag가 두 개로 저장되고 UNIQUE 또는 DISTINCT 결과가 환경마다 다르다.", "normalization/collation/version policy가 writer와 DB마다 다릅니다.", ["code points·bytes·normalization form을 synthetic/redacted sample로 봅니다.", "column/index collation과 deterministic property를 확인합니다.", "writer/runtime Unicode versions를 비교합니다."], "승인된 canonical search/key column을 만들고 collision review와 staged unique migration을 수행합니다.", "equivalence/confusable/collision matrix를 DB·application upgrade gate에 둡니다.")],
    expertNotes: ["normalization collision은 data merge decision이므로 automatic overwrite 대신 quarantine·owner resolution·audit를 사용합니다.", "collation key를 external durable token으로 저장하면 library/version migration이 어려워 raw canonical value와 version metadata를 보존합니다."],
  },
  {
    id: "case-conversion-search-semantics",
    title: "UPPER/LOWER와 case-insensitive search를 locale·collation·index 계약으로 분리합니다",
    lead: "ASCII demo의 LOWER(name)=LOWER(?)가 모든 언어에서 올바른 case-insensitive equality와 빠른 index search를 보장하지 않습니다.",
    explanations: [
      "case conversion은 one-to-many mapping과 locale context를 가질 수 있습니다. German sharp s, Turkish dotted/dotless I처럼 `UPPER`/`LOWER` 후 length나 round-trip이 달라지는 cases를 official Unicode/collation behavior와 target DB에서 검증합니다.",
      "case-insensitive column collation, generated normalized key, functional index, application canonicalization은 각각 storage·query·portability tradeoff가 있습니다. ad-hoc every-row LOWER는 correctness와 sargability를 동시에 잃을 수 있습니다.",
      "search가 prefix, equality, sorting, uniqueness 중 무엇인지 분리합니다. user-facing search relevance와 account identifier uniqueness에 같은 collation을 쓰면 accent/case collision 또는 예상치 못한 분리를 만들 수 있습니다.",
      "query parameter는 bind하고 collation/function 이름은 allowlisted query shape에서 선택합니다. 사용자 locale string을 `COLLATE ${value}`처럼 interpolation하지 않으며 supported options와 schema indexes를 미리 매핑합니다.",
    ],
    concepts: [c("case folding", "case-insensitive comparison을 위해 Unicode case distinctions를 정규화하는 mapping입니다.", ["simple lowercase와 다를 수 있습니다.", "locale/product semantics를 검토합니다."]), c("functional index", "column 자체가 아니라 deterministic expression 결과에 만든 index입니다.", ["wrapped predicate를 seek할 수 있습니다.", "expression·collation 일치를 요구합니다."])],
    diagnostics: [d("LOWER 비교는 맞는 rows를 찾지만 multilingual query가 느리고 unique rule과 search가 다르다.", "application lower, DB collation, unique index와 query expression contract가 분리되었습니다.", ["representative language equivalence pairs를 실행합니다.", "actual plan과 expression index를 봅니다.", "unique/search/display requirements를 분리합니다."], "domain별 canonical/collation policy와 matching generated/function index를 설계하고 collisions를 migration review합니다.", "language matrix·plan assertions·collation version upgrade tests를 둡니다.")],
    expertNotes: ["database collation과 JVM/Python case folding이 같은 Unicode version/rules를 쓴다고 가정하지 않습니다.", "search engine analyzer로 넘기는 경우 DB equality/authorization predicate와 relevance search를 분리해 false positive가 scope를 넓히지 않게 합니다."],
  },
  {
    id: "concat-null-missing-policy",
    title: "CONCAT·연산자와 NULL propagation을 display fallback·domain missing policy와 함께 설계합니다",
    lead: "이름 조각 하나가 NULL일 때 전체 결과가 NULL인지 빈 문자열인지 separator가 남는지는 함수·DBMS와 business contract가 결정합니다.",
    explanations: [
      "MySQL CONCAT은 argument NULL에서 NULL을 반환하는 등 vendor function semantics를 확인하고 Oracle concatenation operator의 null/empty behavior와 비교합니다. SQLite `||` exact example은 NULL propagation을 보여 주지만 다른 DB의 CONCAT_WS까지 대신하지 않습니다.",
      "`COALESCE(last_name,'')`는 output을 만들지만 missing surname을 실제 empty surname과 합칩니다. display-only fallback, search key, audit/export, legal name formatting에서 각각 허용되는 policy를 정하고 raw fields를 보존합니다.",
      "separator는 conditional component와 함께 다룹니다. 단순 `first || ' ' || last`는 double space, dangling punctuation과 locale order를 만들 수 있습니다. structured fields와 locale-aware display formatter를 구분합니다.",
      "concat으로 composite key나 multi-column DISTINCT key를 만들면 delimiter collision, NULL ambiguity, collation, length/overflow 문제가 생깁니다. tuple columns, row constructors 또는 length-prefixed/typed serialization을 사용합니다.",
    ],
    concepts: [c("NULL propagation", "함수/연산 입력의 NULL이 결과 NULL 또는 다른 fallback으로 이어지는 정의입니다.", ["함수·DBMS별로 확인합니다.", "COALESCE는 business policy입니다."]), c("display fallback", "raw missing value를 변경하지 않고 presentation context에서만 대체 text를 보여 주는 정책입니다.", ["storage key로 재사용하지 않습니다.", "locale/privacy를 고려합니다."])],
    codeExamples: [py(
      "sql06-concat-trim-replace",
      "NULL concat과 explicit fallback·replace·custom trim",
      "concat_trim_replace.py",
      "SQLite `||` NULL 결과와 명시적 COALESCE, REPLACE, trim character-set 결과를 deterministic하게 기록합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
first, last = "  Ada  ", None
raw = db.execute("SELECT trim(?) || ' ' || ?", (first, last)).fetchone()[0]
explicit = db.execute("SELECT trim(?) || ' ' || coalesce(?, '(없음)')", (first, last)).fetchone()[0]
replaced = db.execute("SELECT replace('db--query', '--', ' ')").fetchone()[0]
custom = db.execute("SELECT trim('..SQL..', '.')").fetchone()[0]
print("raw-concat=" + ("NULL" if raw is None else raw))
print("explicit-concat=" + explicit)
print("replace=" + replaced)
print("custom-trim=" + custom)
print("missing-policy=explicit")`,
      "raw-concat=NULL\nexplicit-concat=Ada (없음)\nreplace=db query\ncustom-trim=SQL\nmissing-policy=explicit",
      ["local-db-0202", "mysql-string", "oracle-concat", "sqlite-core"],
    )],
    diagnostics: [d("fullName이 NULL 또는 separator만 남고 export와 화면 값이 다르다.", "concat NULL semantics와 missing/display policy를 endpoint마다 임의 적용했습니다.", ["raw component NULL/empty/blank distribution을 봅니다.", "DB/function/driver concat behavior를 실행합니다.", "display·search·export contract를 분리합니다."], "raw structured fields를 보존하고 context별 explicit formatter/fallback을 한 곳에서 적용합니다.", "NULL/empty/locale component matrix와 exact outputs를 둡니다.")],
    expertNotes: ["PII display concat 결과를 logs/cache keys에 넣지 말고 structured presence/category만 telemetry로 사용합니다.", "generated full-text/display columns는 base fields update·collation·normalization migration과 함께 rebuild/validate합니다."],
  },
  {
    id: "substring-trim-replace-boundaries",
    title: "SUBSTRING index·length·negative position과 TRIM/REPLACE의 exact unit·scope를 검증합니다",
    lead: "SQL 문자열 위치는 언어 String API와 0/1-base, negative position, character/byte unit이 달라 off-by-one과 Unicode 절단을 만들기 쉽습니다.",
    explanations: [
      "원본은 active SUBSTRING3·REPLACE1·TRIM1로 1-based extraction과 치환/공백 제거를 보여 줍니다. production에서는 start=0/negative/out-of-range, omitted length, NULL, multibyte/combining sequence를 target MySQL·Oracle·SQLite matrix에서 실행합니다.",
      "TRIM은 일반적으로 모든 Unicode whitespace를 자동 정규화하는 함수가 아닙니다. default space와 explicit trim character set/substring syntax가 DBMS마다 다르며 internal whitespace를 제거하지 않습니다. domain에서 blank canonicalization이 필요하면 approved Unicode policy를 application/ingest에 둡니다.",
      "REPLACE는 literal substring 치환이지 regular expression이나 sanitizer가 아닙니다. HTML/SQL escaping, profanity/security filtering을 REPLACE chain으로 구현하지 않고 output context-safe API와 parameter binding을 사용합니다.",
      "masking은 substring으로 끝 몇 글자만 남기더라도 원본 PII를 query/log/result에 다루게 됩니다. DB privilege, dynamic data masking 한계, minimum cohort와 application logging을 threat model로 검토합니다.",
    ],
    concepts: [c("substring contract", "시작 위치·길이·단위·out-of-range·NULL을 정의한 문자열 slice 규칙입니다.", ["언어 API와 base가 다를 수 있습니다.", "Unicode boundary를 확인합니다."]), c("canonical whitespace", "domain이 동등하게 취급하기로 승인한 leading/trailing/internal whitespace representation입니다.", ["TRIM default와 같지 않을 수 있습니다.", "raw/audit 보존을 결정합니다."])],
    diagnostics: [d("Java에서 맞던 index를 SQL SUBSTRING에 전달하자 첫 글자가 빠지거나 emoji가 깨진다.", "0-based/UTF-16 client offsets를 1-based DB character function에 그대로 사용했습니다.", ["start/length unit과 encoding을 표로 비교합니다.", "ASCII·한글·combining·emoji boundary를 실행합니다.", "offset을 누가 계산하는지 추적합니다."], "slice ownership을 한 layer로 정하고 typed character/grapheme contract와 boundary validation을 적용합니다.", "cross-language golden string fixtures와 invalid offset tests를 둡니다.")],
    expertNotes: ["large text에 function을 반복 적용하면 CPU와 temporary value 비용이 커져 ingest-time derived key와 online migration을 검토합니다.", "redaction/masking query도 backup, replica, query log와 admin tools에는 원본이 남을 수 있어 end-to-end data handling을 봅니다."],
  },
  {
    id: "numeric-types-implicit-conversion",
    title: "정수·exact decimal·approximate float와 implicit conversion의 type/result를 먼저 결정합니다",
    lead: "숫자처럼 보이는 문자열과 숫자를 자동 비교·더하면 편리하지만 invalid text, leading zero, collation과 plan이 환경별로 달라질 수 있습니다.",
    explanations: [
      "금액·비율처럼 exact decimal이 필요한 값은 DECIMAL precision/scale과 rounding/rejection policy를 정합니다. FLOAT/DOUBLE은 binary approximation이므로 equality, sum order와 display rounding에 주의하고 identifiers/phone/postcode를 numeric type으로 바꾸지 않습니다.",
      "implicit conversion은 operand precedence에 따라 string을 number로 또는 number를 string으로 바꿉니다. invalid/partial numeric strings의 warning/error mode, leading/trailing spaces와 locale separators를 MySQL SQL mode·Oracle conversion rules에서 검증하고 explicit typed bind를 사용합니다.",
      "column을 CAST하거나 arithmetic으로 감싸면 index use와 histogram selectivity가 달라질 수 있습니다. data cleanup과 schema type correction이 가능한지 먼저 보고 unavoidable conversion에는 generated/expression index와 validation constraint를 검토합니다.",
      "driver binding도 중요합니다. Java BigDecimal, long/double, Python int/Decimal adapters가 DB precision/scale와 어떻게 round-trip하는지 max/min·scale·NULL fixtures로 검증하고 JSON number/string representation을 API contract에 둡니다.",
    ],
    concepts: [c("exact numeric", "지정 precision과 scale로 decimal 값을 표현하는 DB type 계열입니다.", ["금액 등 exact rules에 적합합니다.", "overflow/rounding policy가 필요합니다."]), c("implicit conversion", "서로 다른 operand types를 DB가 자동으로 공통 comparison/operation type으로 바꾸는 처리입니다.", ["warnings·result·index가 달라질 수 있습니다.", "명시적 type contract를 선호합니다."])],
    diagnostics: [d("문자열 id column과 numeric parameter 비교가 일부 rows를 잘못 match하고 full scan한다.", "implicit conversion이 invalid/leading-zero values를 숫자로 collapse하고 column-side conversion을 만들었습니다.", ["column catalog type과 bind type을 봅니다.", "warning/error SQL mode와 invalid fixtures를 실행합니다.", "EXPLAIN의 converted expression과 rows를 확인합니다."], "domain-correct schema와 typed bind로 맞추고 staged data validation/migration 후 conversion을 제거합니다.", "schema/API type compatibility와 plan assertions를 CI에 둡니다.")],
    expertNotes: ["online type migration은 dual-write/backfill/read-compare/cutover/rollback에서 conversion errors와 reconciliation을 명시합니다.", "NaN·Infinity·negative zero 지원과 JSON serialization은 DB/driver/language마다 달라 approximate types에 별도 matrix가 필요합니다."],
  },
  {
    id: "rounding-policy-boundary",
    title: "ROUND·FLOOR·CEIL을 표시 함수가 아니라 tie rule·scale·sign·stage가 있는 domain policy로 다룹니다",
    lead: "2.5를 2로 할지 3으로 할지는 함수 이름만이 아니라 exact/approximate input, half-even/half-away 정책과 언제 반올림했는지가 결정합니다.",
    explanations: [
      "원본 02_02.sql은 active CEIL4·FLOOR4·ROUND4로 양수/음수 boundary를 보여 줍니다. 전문가 단계에서는 exact decimal과 approximate float, positive/negative scale, halfway values, negative values와 overflow를 DB별로 실행합니다.",
      "invoice line마다 round한 합과 전체 sum 뒤 round한 값은 다를 수 있습니다. tax, currency minor unit, regulatory rule과 allocation remainder를 domain specification으로 정하고 DB·backend·frontend가 같은 decimal algorithm/version을 사용하게 합니다.",
      "FLOOR는 음수에서 0쪽 truncation이 아니라 더 작은 정수 방향이고 CEIL은 더 큰 정수 방향입니다. integer division·CAST truncation과 혼합하지 않고 negative fixtures를 필수로 둡니다.",
      "display formatting은 stored/calculated value를 변경하지 않습니다. localized separator와 scale은 presentation layer에서 적용하고 audit/export에는 raw exact value, applied rounding mode·stage·version을 보존합니다.",
    ],
    concepts: [c("rounding mode", "halfway와 discarded fraction을 어떤 방향으로 정수/scale에 맞출지 정한 규칙입니다.", ["half-even/half-up 등이 다릅니다.", "domain과 stage를 명시합니다."]), c("rounding stage", "line·subtotal·tax·final 등 계산 pipeline의 어느 지점에서 scale을 줄이는지 정한 위치입니다.", ["합계 결과에 영향이 있습니다.", "중복 반올림을 피합니다."])],
    codeExamples: [py(
      "sql06-rounding-overflow",
      "SQLite ROUND·integer overflow promotion과 Decimal tie mode 비교",
      "rounding_overflow.py",
      "binary SQL observation과 exact Decimal half-even/half-up을 동일 입력에서 분리해 출력합니다.",
      String.raw`import sqlite3
from decimal import Decimal, ROUND_HALF_EVEN, ROUND_HALF_UP

db = sqlite3.connect(":memory:")
positive, negative, overflow_type, overflow_rendered = db.execute(
    "SELECT round(2.345, 2), round(-2.345, 2), typeof(9223372036854775807 + 1), printf('%.0f', 9223372036854775807 + 1)"
).fetchone()
half_even = Decimal("2.5").quantize(Decimal("1"), rounding=ROUND_HALF_EVEN)
half_up = Decimal("2.5").quantize(Decimal("1"), rounding=ROUND_HALF_UP)
print(f"sqlite-round={positive},{negative}")
print("overflow-type=" + overflow_type)
print("overflow-rendered=" + overflow_rendered)
print("decimal-half-even=" + str(half_even))
print("decimal-half-up=" + str(half_up))`,
      "sqlite-round=2.35,-2.35\noverflow-type=real\noverflow-rendered=9223372036854776000\ndecimal-half-even=2\ndecimal-half-up=3",
      ["local-db-0202", "mysql-math", "mysql-rounding", "oracle-round", "sqlite-datatype"],
    )],
    diagnostics: [d("DB 합계와 Java/프론트 금액이 1 unit씩 다르고 음수 refund에서 방향이 반대다.", "layers가 다른 numeric type·rounding mode·stage를 사용했습니다.", ["raw operands와 type/scale을 기록합니다.", "halfway positive/negative·line-vs-total fixtures를 실행합니다.", "driver BigDecimal/JSON mapping을 확인합니다."], "authoritative decimal algorithm·mode·stage를 domain library/DB contract로 고정하고 historical reconciliation을 수행합니다.", "cross-layer golden decimal vectors와 audit rounding metadata를 둡니다.")],
    expertNotes: ["financial corrections는 old/new rounding algorithm 결과와 affected documents를 versioned migration으로 다룹니다.", "ROUND 함수가 exact/approximate arguments에 서로 다른 tie behavior를 가질 수 있어 literal type과 bind type도 test합니다."],
  },
  {
    id: "overflow-domain-error-policy",
    title: "overflow·underflow·division by zero·invalid numeric을 silent coercion이 아닌 실패 정책으로 설계합니다",
    lead: "큰 정수에 1을 더했을 때 error, decimal overflow, approximate promotion 또는 wrap 중 무엇이 발생하는지 DB·driver·language마다 확인해야 합니다.",
    explanations: [
      "integer/DECIMAL precision 경계를 schema와 intermediate expression 모두에서 검토합니다. operands가 좁은 type이면 final column이 넓어도 중간 overflow가 날 수 있어 explicit cast target과 domain maximum을 계산합니다.",
      "SQLite dynamic typing example은 max integer addition이 REAL로 promote되어 rendered integer 정밀도를 잃는 것을 보여 줍니다. MySQL/Oracle의 error/warning/precision semantics를 대신하지 않으므로 strict modes와 exact target type tests를 실행합니다.",
      "division by zero, SQRT negative, POWER overflow와 MOD sign rules의 error/NULL/NaN behavior를 함수별로 확인합니다. `NULLIF(divisor,0)`는 error를 NULL로 바꾸는 business policy이므로 missing result의 의미와 alert를 정의합니다.",
      "ingest에서 numeric text를 parse할 때 locale comma, scientific notation, whitespace, plus sign과 excessive exponent를 allowlist합니다. parse failure를 zero로 바꾸지 않고 field-level bounded error와 quarantine/audit를 남깁니다.",
    ],
    concepts: [c("numeric overflow", "값 또는 intermediate result가 type의 표현 범위를 벗어나는 상태입니다.", ["error·warning·promotion이 다를 수 있습니다.", "경계값을 실행합니다."]), c("error policy", "invalid arithmetic을 reject·NULL·quarantine·fallback 중 어떻게 처리하고 관측할지 정한 계약입니다.", ["silent zero를 피합니다.", "business meaning을 포함합니다."])],
    diagnostics: [d("대규모 합계가 어느 날 scientific notation 또는 부정확한 마지막 digits로 바뀐다.", "integer/decimal 범위를 넘은 값을 approximate type으로 promote/coerce했지만 warning을 놓쳤습니다.", ["expression/aggregate result type과 max bounds를 계산합니다.", "SQL mode·warnings·driver target type을 봅니다.", "raw source count와 independent exact recomputation을 비교합니다."], "충분한 exact precision과 checked arithmetic을 사용하고 overflow 시 fail/quarantine한 뒤 affected data를 reconcile합니다.", "max/min·intermediate·aggregate overflow tests와 warning-as-failure policy를 둡니다.")],
    expertNotes: ["aggregate SUM result type과 client getter range가 달라 DB는 정확해도 application에서 overflow할 수 있습니다.", "adversarial huge exponent/long digit input은 CPU/memory denial surface가 될 수 있어 length·magnitude limits를 먼저 검증합니다."],
  },
  {
    id: "function-sargability-indexes",
    title: "column-side 함수가 predicate를 읽기 쉽게 해도 sargability와 index range를 잃을 수 있음을 EXPLAIN으로 확인합니다",
    lead: "`LOWER(name)=LOWER(?)`, `ROUND(amount)=?`, `SUBSTRING(code,1,3)=?`는 결과가 맞아도 일반 column index를 seek하지 못할 수 있습니다.",
    explanations: [
      "sargable predicate는 index search argument로 boundary를 만들 수 있습니다. equality/range의 indexed column을 function/cast/arithmetic으로 감싸면 engine이 일반 index ordering을 직접 사용하지 못할 수 있으므로 actual plan을 확인합니다.",
      "대안은 canonical stored value, generated column+index, expression/functional index 또는 equivalent range rewrite입니다. expression은 deterministic하고 query와 문법·collation이 일치해야 하며 write/rebuild 비용을 포함합니다.",
      "example은 direct equality가 SQLite SEARCH, lower-wrapped equality가 SCAN으로 분류되지만 SQLite 3.51 observation입니다. MySQL 8.4 functional indexes/generated columns과 Oracle function-based indexes는 exact DDL·statistics·session collation을 별도 검증합니다.",
      "성능을 위해 correctness를 바꾸지 않습니다. prefix range rewrite는 collation과 upper bound를 정확히 만들 수 있을 때만 적용하고 normalization/search semantics가 다르면 dedicated key/index를 설계합니다.",
    ],
    concepts: [c("sargability", "predicate가 index의 ordered keys로 탐색 범위를 만들 수 있는 성질입니다.", ["column-side 함수가 약화할 수 있습니다.", "EXPLAIN actual로 확인합니다."]), c("expression index", "deterministic expression 결과에 만들어 동일 expression predicate를 지원하는 index입니다.", ["query expression 일치가 필요합니다.", "write/storage 비용이 있습니다."])],
    codeExamples: [py(
      "sql06-function-sargability",
      "direct equality SEARCH와 LOWER-wrapped SCAN 비교",
      "function_sargability.py",
      "같은 selected id를 반환하는 두 predicates의 SQLite EXPLAIN detail을 SEARCH/SCAN invariant로 축약합니다.",
      String.raw`import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE person (person_id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
db.execute("CREATE INDEX idx_person_name ON person(name)")
db.executemany("INSERT INTO person VALUES (?, ?)", [(1, "Ada"), (2, "Grace"), (3, "Linus")])

direct = db.execute("EXPLAIN QUERY PLAN SELECT person_id FROM person WHERE name = ?", ("Grace",)).fetchone()[3]
wrapped = db.execute("EXPLAIN QUERY PLAN SELECT person_id FROM person WHERE lower(name) = lower(?)", ("Grace",)).fetchone()[3]
direct_ids = [row[0] for row in db.execute("SELECT person_id FROM person WHERE name = ?", ("Grace",))]
wrapped_ids = [row[0] for row in db.execute("SELECT person_id FROM person WHERE lower(name) = lower(?)", ("Grace",))]
print("direct-plan=" + ("SEARCH" if "SEARCH" in direct else "SCAN"))
print("wrapped-plan=" + ("SEARCH" if "SEARCH" in wrapped else "SCAN"))
print("direct-ids=" + ",".join(map(str, direct_ids)))
print("wrapped-ids=" + ",".join(map(str, wrapped_ids)))
print("same-result=" + str(direct_ids == wrapped_ids).lower())`,
      "direct-plan=SEARCH\nwrapped-plan=SCAN\ndirect-ids=2\nwrapped-ids=2\nsame-result=true",
      ["mysql-type-conversion", "sqlite-expridx", "sqlite-core", "java-string"],
    )],
    diagnostics: [d("기능은 맞지만 LOWER/DATE/ROUND filter가 data 증가 뒤 full scan으로 바뀐다.", "column-side expression에 대응하는 index/generated key가 없고 plan budget을 검증하지 않았습니다.", ["direct/wrapped query의 actual plan·rows를 비교합니다.", "expression determinism/collation/type을 봅니다.", "write/read workload와 existing indexes를 inventory합니다."], "canonical/generated/expression index 또는 correctness-preserving range query를 선택해 benchmark하고 rollout합니다.", "representative cardinality plan assertion과 index write-cost review를 둡니다.")],
    expertNotes: ["plan text exact 문자열은 version에 따라 바뀔 수 있어 logical SEARCH/SCAN, selected keys와 measured work를 함께 assertion합니다.", "parameter selectivity와 statistics 때문에 sargable query도 scan을 고를 수 있으므로 sargability는 plan 보장이 아니라 선택 가능성입니다."],
  },
  {
    id: "function-portability-testing-governance",
    title: "함수 이름 호환보다 type·unit·NULL·collation·error·plan 결과를 vendor matrix로 관리합니다",
    lead: "SUBSTRING과 ROUND가 세 DB에 존재해도 argument syntax, return type, empty/NULL, tie rule과 index eligibility가 같다는 뜻은 아닙니다.",
    explanations: [
      "portability matrix는 function spelling만 나열하지 않고 input type, start/index unit, NULL/empty, return type/length, collation, warning/error, deterministic property와 plan/index support를 기록합니다. 실제 supported MySQL 8.4·Oracle 26ai versions와 SQLite harness를 실행합니다.",
      "compatibility layer는 domain intent에 이름을 붙입니다. 예를 들어 `canonical_tag_key`, `money_round`, `display_name`을 repository/database adapter에서 구현하고 arbitrary function strings를 business code에 흩뿌리지 않습니다.",
      "migration은 before/after exact outputs, collisions, truncations, rounding differences와 query plans를 dry-run합니다. Unicode/collation/decimal library version을 artifact에 기록하고 mismatch rows를 raw PII 없이 hashed synthetic key 또는 bounded count로 review합니다.",
      "observability는 invalid parse, overflow, normalization collision, truncation, plan regression을 bounded reason codes로 수집합니다. raw input strings·names·addresses를 log하지 않고 data owner, repair, rollback evidence를 연결합니다.",
    ],
    concepts: [c("semantic portability", "서로 다른 DBMS에서 동일 domain inputs가 unit·NULL·type·rounding·error 기준으로 같은 의미를 내도록 검증하는 성질입니다.", ["문법 호환보다 넓습니다.", "golden vectors를 사용합니다."]), c("function contract test", "공식 문서와 actual target DB에 같은 boundary vectors를 실행해 output/type/error/plan을 비교하는 test입니다.", ["upgrade에 반복합니다.", "synthetic data만 사용합니다."])],
    diagnostics: [d("DB migration은 compile됐지만 문자열 distinct 수와 금액 합계가 달라진다.", "함수 이름만 매핑하고 collation·normalization·rounding·return type 차이를 preflight하지 않았습니다.", ["source/target golden vectors와 types를 비교합니다.", "collision/rounding delta counts를 봅니다.", "query plans와 indexes를 확인합니다."], "domain adapter와 approved semantic mapping을 적용해 collisions/rounding differences를 owner review하고 staged reconcile합니다.", "vendor/version function matrix와 upgrade contract suite를 release gate로 둡니다.")],
    expertNotes: ["database extension/ICU package가 OS image마다 다르면 같은 SQL version에서도 collation behavior가 달라 deployment manifest에 포함합니다.", "function results를 materialize하면 semantics version column과 rebuild path를 두어 old/new values를 안전하게 전환합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0202", repository: "local dbstudy snapshot", path: "dbstudy/02_02.sql", usedFor: ["문자열·숫자 함수 progression"], evidence: "159 logical lines·5,853 bytes·SHA-256 06C8FF1D7AC36881E1FF9F176ED15BF71EDAA5707379C3BF511CD406666B4F21; comments를 제외한 active standalone LENGTH3·CHAR_LENGTH5·SUBSTRING3·REPLACE1·TRIM1·ROUND4·FLOOR4·CEIL4를 read-only로 계수했습니다." },
  { id: "mysql-string", repository: "MySQL 8.4 Reference Manual", path: "String Functions and Operators", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/string-functions.html", usedFor: ["LENGTH·CHAR_LENGTH·CONCAT·SUBSTRING·TRIM·REPLACE"], evidence: "MySQL 8.4 string functions 공식 문서입니다." },
  { id: "mysql-type-conversion", repository: "MySQL 8.4 Reference Manual", path: "Type Conversion in Expression Evaluation", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/type-conversion.html", usedFor: ["implicit conversion·comparison type"], evidence: "MySQL 8.4 type conversion 공식 문서입니다." },
  { id: "mysql-charset", repository: "MySQL 8.4 Reference Manual", path: "Character Sets, Collations, Unicode", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/charset.html", usedFor: ["charset·collation·Unicode"], evidence: "MySQL 8.4 charset/collation 공식 문서입니다." },
  { id: "mysql-math", repository: "MySQL 8.4 Reference Manual", path: "Mathematical Functions", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/mathematical-functions.html", usedFor: ["ROUND·FLOOR·CEIL·MOD·POW·SQRT"], evidence: "MySQL 8.4 mathematical functions 공식 문서입니다." },
  { id: "mysql-rounding", repository: "MySQL 8.4 Reference Manual", path: "Rounding Behavior", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/precision-math-rounding.html", usedFor: ["exact/approximate rounding"], evidence: "MySQL 8.4 precision math rounding 공식 문서입니다." },
  { id: "oracle-length", repository: "Oracle AI Database 26ai SQL Language Reference", path: "LENGTH", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/LENGTH.html", usedFor: ["Oracle character/byte length portability"], evidence: "Oracle 26ai LENGTH 공식 문서입니다." },
  { id: "oracle-concat", repository: "Oracle AI Database 26ai SQL Language Reference", path: "Concatenation Operator", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Concatenation-Operator.html", usedFor: ["Oracle concat·NULL portability"], evidence: "Oracle 26ai concatenation 공식 문서입니다." },
  { id: "oracle-round", repository: "Oracle AI Database 26ai SQL Language Reference", path: "ROUND(number)", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/ROUND-number.html", usedFor: ["Oracle numeric rounding portability"], evidence: "Oracle 26ai numeric ROUND 공식 문서입니다." },
  { id: "oracle-collation", repository: "Oracle AI Database 26ai Globalization Support Guide", path: "Linguistic Sorting and Matching", publicUrl: "https://docs.oracle.com/en/database/oracle/oracle-database/26/nlspg/linguistic-sorting-and-matching.html", usedFor: ["Oracle linguistic collation"], evidence: "Oracle 26ai collation 공식 문서입니다." },
  { id: "sqlite-core", repository: "SQLite Documentation", path: "Built-In Scalar SQL Functions", publicUrl: "https://www.sqlite.org/lang_corefunc.html", usedFor: ["length·lower·replace·round·trim exact examples"], evidence: "SQLite core functions 공식 문서입니다." },
  { id: "sqlite-datatype", repository: "SQLite Documentation", path: "Datatypes In SQLite", publicUrl: "https://www.sqlite.org/datatype3.html", usedFor: ["text/number dynamic type·overflow observation"], evidence: "SQLite datatype 공식 문서입니다." },
  { id: "sqlite-expridx", repository: "SQLite Documentation", path: "Indexes On Expressions", publicUrl: "https://www.sqlite.org/expridx.html", usedFor: ["function predicate sargability"], evidence: "SQLite expression index 공식 문서입니다." },
  { id: "python-unicode", repository: "Python 3 Documentation", path: "Unicode HOWTO", publicUrl: "https://docs.python.org/3/howto/unicode.html", usedFor: ["code points·encoding·normalization harness"], evidence: "Python Unicode 공식 문서입니다." },
  { id: "java-string", repository: "Java SE 21 API", path: "java.lang.String", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html", usedFor: ["UTF-16 length·client mapping boundary"], evidence: "Java String 공식 API입니다." },
];

const session = createExpertSession({
  inventoryId: "sql-06-string-number-functions", slug: "sql-06-string-number-functions", courseId: "database", moduleId: "db-query-foundations", order: 6,
  title: "문자열·숫자 함수와 문자/바이트 길이", subtitle: "Unicode 단위·normalization/collation, 문자열 변환, exact numeric·rounding·overflow와 function predicate plan을 통합합니다.", level: "중급", estimatedMinutes: 840,
  coreQuestion: "문자열과 숫자 함수가 DB·driver·언어 경계를 지날 때 unit·collation·NULL·type·rounding·error·index 의미를 어떻게 잃지 않게 할까요?",
  summary: "authoritative 02_02.sql 159 lines·5,853 bytes를 read-only로 감사해 active standalone LENGTH3·CHAR_LENGTH5·SUBSTRING3·REPLACE1·TRIM1·ROUND4·FLOOR4·CEIL4 progression을 보존했습니다. character/byte/grapheme units, Unicode normalization/collation, case folding/search, concat NULL policy, substring/trim/replace boundaries, exact/approximate numeric와 implicit conversion, rounding mode/stage, overflow/error policy, expression sargability와 vendor portability governance를 전문가 수준으로 확장합니다. 다섯 Python sqlite3 examples는 multilingual lengths, NFC/NFD와 NOCASE, concat/trim/replace, rounding/overflow, direct SEARCH 대 wrapped SCAN을 exact stdout으로 실행합니다.",
  objectives: ["character·byte·code point·grapheme·UTF-16 unit을 구분한다.", "normalization과 collation이 equality·DISTINCT·UNIQUE·ORDER/index에 미치는 영향을 검증한다.", "case conversion과 locale-aware search·functional index 경계를 설계한다.", "concat/NULL/empty·separator·display fallback 정책을 명시한다.", "substring·trim·replace의 index/unit/security 한계를 진단한다.", "exact decimal·float·implicit conversion과 driver types를 구분한다.", "rounding mode·stage·negative/tie rules와 overflow/error policy를 고정한다.", "function predicate sargability와 vendor semantic contract tests를 운영한다."],
  prerequisites: [{ title: "DISTINCT·ORDER BY·LIMIT/OFFSET의 안정적인 결과", reason: "collation과 function expression이 DISTINCT·ORDER BY·index·pagination 순서를 바꾸는 경계를 이해해야 합니다.", sessionSlug: "sql-05-distinct-order-limit" }],
  keywords: ["CHAR_LENGTH", "LENGTH", "Unicode", "UTF-8", "grapheme", "normalization", "collation", "CONCAT", "SUBSTRING", "TRIM", "REPLACE", "ROUND", "Decimal", "overflow", "implicit conversion", "sargability"], topics,
  lab: {
    title: "다국어 학습자료 검색 key와 금액 계산 함수를 semantic portability contract로 재구축하기",
    scenario: "한글·Latin·emoji 제목이 중복/검색에서 다르게 처리되고, DB와 Java 금액 합계가 1 unit씩 다르며 LOWER filter가 대규모 scan을 만듭니다.",
    setup: ["synthetic NFC/NFD·case·accent·emoji·NULL/blank와 decimal boundary vectors만 사용합니다.", "MySQL 8.4·Oracle 26ai isolated schemas, SQLite/Python/Java 21 harness를 준비합니다.", "field별 raw/display/search/unique와 character/byte/grapheme unit을 적습니다.", "금액 precision/scale·rounding mode/stage·overflow policy를 승인받습니다."],
    steps: ["schema/API/Java/Python의 length units와 limits를 matrix로 만듭니다.", "normalization/collation equivalence·collision·order vectors를 실행합니다.", "raw display text와 canonical search/unique key를 분리합니다.", "CONCAT·NULL/empty·locale separator output을 exact 검증합니다.", "SUBSTRING/TRIM/REPLACE boundary와 sanitizer 오용을 감사합니다.", "implicit conversion과 invalid numeric warnings/errors를 fail-closed로 바꿉니다.", "DB·Decimal·Java rounding golden vectors와 line/total stage를 대조합니다.", "max/min/intermediate/aggregate overflow와 division error policy를 실행합니다.", "direct/function predicates의 EXPLAIN actual과 expression index tradeoff를 benchmark합니다.", "Unicode/collation/DB upgrade collision dry-run과 rollback/rebuild를 rehearsal합니다."],
    expectedResult: ["모든 length/limit에 unit과 normalization 시점이 명시됩니다.", "search/unique/display가 승인된 collation·normalization 의미를 유지합니다.", "문자열 NULL/empty와 numeric rounding/overflow가 layer 간 exact golden vector와 일치합니다.", "function filters가 correctness를 유지하며 plan budget 또는 matching index를 충족합니다.", "collision·parse·overflow·plan telemetry는 raw PII 없이 재현·복구 가능합니다."],
    cleanup: ["isolated rows·indexes/generated keys와 test telemetry를 run id로 제거합니다.", "collision review artifacts에서 raw strings를 제거하고 bounded counts만 보존합니다.", "temporary DB users/grants를 revoke합니다.", "원본 SQL·production data는 변경하지 않습니다."],
    extensions: ["ICU grapheme segmentation과 DB collation version matrix를 자동화합니다.", "search engine analyzer와 DB authorization/equality 경계를 설계합니다.", "multi-currency allocation/remainder algorithm을 property-test합니다.", "online collation/type migration dual-read reconciliation을 구현합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 exact examples를 실행하고 각 output의 unit·collation·numeric type·plan 의미를 기록하세요.", requirements: ["python -I -X utf8 stdout을 완전 대조합니다.", "한글/emoji character-byte 차이를 설명합니다.", "NFC/NFD와 casefold/NOCASE를 비교합니다.", "NULL concat fallback을 바꿔 봅니다.", "half-even/half-up 차이를 재현합니다.", "SEARCH/SCAN과 selected ids를 함께 확인합니다."], hints: ["값보다 먼저 type과 unit 열을 만드세요."], expectedOutcome: "같은 함수 이름이 아닌 observable semantic contract로 설명합니다.", solutionOutline: ["unit→equality→transformation→numeric→plan 순서입니다."] },
    { difficulty: "응용", prompt: "학습자료 title/tag/price repository를 multilingual·exact numeric 환경으로 교정하세요.", requirements: ["raw/display/search/unique fields를 분리합니다.", "normalization/collation과 collision migration을 설계합니다.", "length limits의 unit을 정합니다.", "NULL/blank concat policy를 둡니다.", "Decimal precision/rounding/overflow를 고정합니다.", "implicit conversion을 제거합니다.", "functional index plan을 검증합니다.", "privacy-safe telemetry와 rollback을 포함합니다."], hints: ["LOWER column을 기본 해법으로 고정하지 마세요."], expectedOutcome: "다국어와 숫자 경계가 DB·API·UI에서 일치합니다.", solutionOutline: ["domain→storage/key→function→index→migration/operations 순서입니다."] },
    { difficulty: "설계", prompt: "조직 SQL 함수 portability와 numeric/Unicode 표준을 작성하세요.", requirements: ["unit/normalization/collation 표준을 정의합니다.", "문자열 NULL/empty/trim/concat 규칙을 둡니다.", "substring/masking security를 포함합니다.", "exact/approximate numeric 선택표를 만듭니다.", "rounding mode/stage와 overflow policy를 정합니다.", "implicit conversion 금지/예외를 정합니다.", "vendor golden vector·plan tests를 요구합니다.", "upgrade collision·rebuild·incident 절차를 포함합니다."], hints: ["문법 번역표와 semantic portability matrix를 구분하세요."], expectedOutcome: "DBMS upgrade와 이관에도 검증 가능한 함수 계약이 완성됩니다.", solutionOutline: ["semantics→types→functions→plans→governance 순서입니다."] },
  ],
  nextSessions: ["sql-07-date-time-functions"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["dbstudy/02_02.sql: 159 logical lines·5,853 bytes·SHA-256 06C8FF1D7AC36881E1FF9F176ED15BF71EDAA5707379C3BF511CD406666B4F21; comments를 제외한 active standalone LENGTH3·CHAR_LENGTH5·UPPER1·LOWER1·CONCAT1·SUBSTRING3·REPLACE1·TRIM1·ABS3·CEIL4·FLOOR4·ROUND4·MOD1·POW2·SQRT2를 read-only로 계수했습니다.", "원본 sample 인물·주소·검색 text를 복제하지 않고 함수 progression과 counts/hash만 provenance로 사용했습니다.", "원본에 없는 grapheme/UTF-16, normalization/collation collisions, concat missing policy, implicit conversion, rounding stage·overflow와 sargability/portability operations는 공식 문서와 synthetic exact examples로 보완했습니다.", "SQLite/Python exact output은 MySQL 8.4·Oracle 26ai charset/collation·function return type·rounding/error·optimizer semantics를 대신하지 않습니다."] },
});

export default session;
