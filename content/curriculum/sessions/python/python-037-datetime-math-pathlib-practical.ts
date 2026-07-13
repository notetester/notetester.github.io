import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-037"],
  slug: "python-037-datetime-math-pathlib-practical",
  courseId: "python",
  moduleId: "04-reliability-tooling",
  order: 37,
  title: "datetime·math·pathlib 실전",
  subtitle: "날짜·시간·수치·경로를 문자열과 숫자로 즉흥 처리하지 않고, 단위·시간대·기준점·파일 위치가 드러나는 표준 타입으로 모델링합니다.",
  level: "중급",
  estimatedMinutes: 155,
  coreQuestion: "달력 날짜·실제 시각·기간·수치 통계·파일 경로의 서로 다른 의미를 표준 라이브러리 타입으로 보존해 환경과 경계값에도 올바른 계산을 어떻게 만들까요?",
  summary: "date·datetime·timedelta·strftime·strptime, math의 ceil/floor/trunc/sqrt/log/gcd/lcm/isfinite, pathlib Path를 원본 D-171·만 나이·평균/분산/표준편차와 연결합니다. naive/aware datetime과 zoneinfo·DST, wall clock/monotonic clock, 월말·윤년·생일, population/sample variance, float·NaN, source/resource/path traversal까지 실전 계약으로 확장합니다.",
  objectives: [
    "date·time·datetime·timedelta가 표현하는 달력·시각·기간 의미를 구분할 수 있다.",
    "strftime 표시와 strptime parsing format을 round-trip하고 잘못된 날짜·locale 경계를 처리할 수 있다.",
    "naive와 aware datetime을 구분하고 zoneinfo로 timezone·DST 정책을 설계할 수 있다.",
    "고정 기준일을 주입해 D-day·만 나이를 월일·윤년 경계에서 재현 가능하게 계산할 수 있다.",
    "ceil·floor·trunc·sqrt·log·gcd·lcm·isfinite의 입력 domain과 반환 타입을 설명할 수 있다.",
    "population과 sample 분산을 구분하고 빈·한 개·NaN·float 정밀도 경계를 검증할 수 있다.",
    "pathlib로 source/resource/user data 경로를 구분하고 안전한 파일 탐색·검증을 수행할 수 있다.",
  ],
  prerequisites: [
    { title: "경로·파일 모드·context manager", reason: "Path 기준점·resolve·안전한 파일 수명을 실전 표준 library와 연결합니다.", sessionSlug: "python-024-path-file-modes-context-manager" },
    { title: "내장 함수·수치 집계·정렬", reason: "sum·len과 math를 사용해 평균·분산·표준편차를 구현합니다.", sessionSlug: "python-033-builtins-numeric-aggregation-sorting" },
  ],
  keywords: ["Python", "datetime", "date", "timedelta", "strftime", "strptime", "timezone", "zoneinfo", "math", "variance", "pathlib", "Path"],
  chapters: [
    {
      id: "date-time-duration-models",
      title: "date·datetime·timedelta는 달력 날짜·시각·기간이라는 서로 다른 domain 값을 표현합니다",
      lead: "날짜 차이와 실제 경과 시간은 항상 같지 않으며 어떤 단위를 계산하는지 타입과 이름으로 드러냅니다.",
      explanations: [
        "date는 year·month·day 달력 날짜, datetime은 날짜와 시각, timedelta는 두 시점의 차이나 기간을 나타냅니다. 원본 datetime(2026,1,1)과 datetime(2026,12,25,18,30)의 차이는 days와 seconds로 분해됩니다. timedelta.days만 읽으면 시간 부분을 잃을 수 있습니다.",
        "date.today와 datetime.now는 system wall clock을 읽어 test 실행 날짜마다 결과가 달라집니다. 업무 함수는 base_date·clock을 인수로 받고 entry boundary에서 현재값을 주입합니다. 원본 실전 예제가 date(2026,6,1)를 고정해 D-171을 재현한 방식입니다.",
        "timedelta(days=1)는 24시간 duration입니다. timezone이 있는 지역의 '다음 달력날 같은 현지 시각'은 DST 전환에서 23·25시간 차이가 날 수 있습니다. calendar period와 elapsed duration을 구분합니다.",
        "datetime subtraction은 두 객체가 모두 naive이거나 호환 aware여야 합니다. naive와 aware를 섞으면 TypeError입니다. stored instant는 UTC aware, 사용자 표시·일정은 timezone 정보와 함께 다루는 정책이 흔합니다.",
      ],
      concepts: [
        { term: "wall clock", definition: "사용자가 보는 달력·시계 시각으로 system 보정·timezone·DST 영향이 있는 시간 기준입니다.", detail: ["datetime.now가 읽습니다.", "elapsed timeout 측정에는 monotonic clock이 적합합니다."] },
        { term: "duration", definition: "두 시점 사이 경과량을 days·seconds·microseconds로 나타내는 timedelta 값입니다.", detail: ["달력 month 단위는 직접 표현하지 않습니다.", "total_seconds와 days 속성을 구분합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "test가 날짜가 바뀌면 실패하거나 D-day snapshot이 매일 달라진다.", likelyCause: "domain 함수 내부에서 date.today/datetime.now를 직접 읽어 현재 시간이 숨은 입력입니다.", checks: ["today·now 호출 위치를 검색합니다.", "test가 system timezone에 의존하는지 봅니다.", "기준일을 인수로 주면 재현되는지 확인합니다."], fix: "기준 date 또는 clock callable을 주입하고 application boundary에서만 현재값을 읽습니다.", prevention: "고정 clock fixture와 월말·연말·윤년 경계 test를 둡니다." },
      ],
    },
    {
      id: "formatting-and-parsing",
      title: "strftime는 표시하고 strptime은 정확한 format 계약으로 parsing합니다",
      lead: "날짜 문자열은 사람이 보는 UI와 기계 교환 format을 분리하고, parsing 실패를 조용히 다른 날짜로 보정하지 않습니다.",
      explanations: [
        "원본 d2.strftime('%Y년 %m월 %d일 %H시 %M분')은 표시 문자열을 만들고 datetime.strptime('2026-03-15 09:30','%Y-%m-%d %H:%M')은 정확한 pattern을 해석합니다. 날짜 2026-02-30은 ValueError입니다.",
        "%a·%A·%p 같은 locale 의존 표시가 OS locale에 따라 영문·한국어로 달라질 수 있습니다. API와 파일 교환에는 ISO 8601과 명시 timezone을 사용하고 UI localization은 presentation layer에 둡니다.",
        "datetime.fromisoformat과 date.fromisoformat은 표준에 가까운 문자열을 간단히 처리하지만 지원 범위와 Z·offset을 Python version 문서로 확인합니다. 외부 protocol spec이 정한 format을 그대로 검증합니다.",
        "formatting 후 parsing round-trip이 microsecond·timezone fold·원래 zone name까지 모두 보존하는 것은 아닙니다. 필요한 정보 field를 schema에 명시합니다.",
      ],
      concepts: [
        { term: "format directive", definition: "%Y·%m·%d·%H처럼 datetime과 문자열 field를 대응시키는 strftime/strptime 표기입니다.", detail: ["format과 입력이 정확히 일치해야 합니다.", "일부 directive 출력은 locale에 의존합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "개발 PC에서 parse되던 날짜가 서버 locale·OS에서 실패하거나 요일 text가 달라진다.", likelyCause: "locale-dependent directive와 사용자 표시 문자열을 machine protocol로 사용했습니다.", checks: ["사용 directive와 process locale을 확인합니다.", "입력 sample의 timezone·언어를 봅니다.", "ISO format fixture로 비교합니다."], fix: "교환 format을 locale-independent ISO 8601+offset으로 고정하고 display localization은 별도 처리합니다.", prevention: "여러 locale·timezone 환경 CI와 invalid date fixture를 둡니다." },
      ],
    },
    {
      id: "timezone-zoneinfo-dst",
      title: "timezone이 필요한 시각은 aware datetime과 IANA zone 규칙으로 처리합니다",
      lead: "UTC offset 하나는 특정 순간 차이를 나타내지만 지역의 과거·미래 DST 규칙과 이름을 모두 표현하지 못합니다.",
      explanations: [
        "naive datetime은 tzinfo가 없어 어떤 지역·UTC instant인지 알 수 없습니다. aware datetime은 timezone 정보를 가지며 astimezone으로 같은 instant를 다른 지역 시각으로 표현할 수 있습니다. 서로 다른 zone aware subtraction은 UTC instant 차이를 계산합니다.",
        "zoneinfo.ZoneInfo('Asia/Seoul')처럼 IANA zone을 사용하면 역사적 offset 규칙을 적용합니다. 배포 OS·tzdata package version도 결과 provenance에 포함할 수 있습니다. fixed timezone(timedelta(hours=9))는 DST 없는 고정 offset 요구에만 적합합니다.",
        "DST가 끝날 때 같은 현지 시각이 두 번 나타나는 ambiguous time은 datetime.fold로 구분할 수 있습니다. 시작할 때 존재하지 않는 local time도 있습니다. 외부 local schedule parsing은 정책 없이 단순 replace(tzinfo=zone)하지 않습니다.",
        "DB에는 보통 UTC instant와 필요하면 원래 zone ID를 저장합니다. 생일·휴일·매일 9시 일정은 UTC instant 하나가 아니라 local calendar rule이므로 다음 발생 시점 계산 때 zone 규칙을 사용합니다.",
      ],
      concepts: [
        { term: "aware datetime", definition: "tzinfo와 UTC offset 계산 능력을 가진 datetime으로 global instant와 local 표현을 연결할 수 있습니다.", detail: ["naive와 직접 비교·연산할 수 없습니다.", "timezone database version 영향을 받을 수 있습니다."] },
        { term: "DST fold", definition: "일광절약시간 종료 때 같은 local clock 표현이 두 instant에 해당하는 ambiguity를 구분하는 datetime 속성입니다.", detail: ["fold 0·1로 두 occurrence를 구분합니다.", "지역 schedule parsing 정책이 필요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "서버와 사용자 화면 시간이 9시간·1시간 어긋나거나 DST 날 일정이 중복·누락된다.", likelyCause: "naive datetime을 UTC 또는 local로 임의 가정하거나 fixed offset으로 지역 규칙을 대체했습니다.", checks: ["각 값의 tzinfo·utcoffset을 확인합니다.", "저장 instant와 사용자 zone ID를 분리합니다.", "DST transition 전후 fixture를 실행합니다."], fix: "입력 경계에서 zone을 명시해 aware로 만들고 UTC 저장·IANA zone 표시 정책을 사용합니다.", prevention: "지원 zone별 DST gap/fold·UTC round-trip test와 tzdata version 기록을 둡니다." },
      ],
    },
    {
      id: "calendar-business-calculations",
      title: "D-day·만 나이·마감 계산은 기준일과 달력 policy를 명시합니다",
      lead: "원본 D-171과 생일 전 1세 차감은 재현 가능하지만 윤년 생일·영업일·마감 포함 여부까지 domain에서 정해야 합니다.",
      explanations: [
        "date(2026,11,19)-date(2026,6,1)의 days는 171입니다. UI가 오늘을 D-day에 포함하는지, 지나면 D+로 표시하는지는 presentation policy입니다. 계산 함수는 signed day 차이를 반환하고 표시 함수가 문구를 만듭니다.",
        "만 나이는 base.year-birth.year에서 base 월일이 생일 월일보다 앞이면 1을 뺍니다. 2월 29일 출생이 비윤년 2월 28일·3월 1일 중 언제 나이를 먹는지는 법·domain policy가 필요합니다.",
        "timedelta(days=30)를 한 달로 취급하면 28~31일 월 차이를 무시합니다. 월 단위 반복·billing은 year/month calendar 연산 library나 명시 month rollover 정책을 사용합니다.",
        "영업일 계산은 주말뿐 아니라 국가·회사·임시 공휴일 calendar version이 필요합니다. date arithmetic에 hard-coded holiday를 섞지 않고 calendar service/data를 주입합니다.",
      ],
      concepts: [
        { term: "calendar policy", definition: "생일·월말·영업일·마감 포함 여부처럼 단순 timedelta만으로 결정되지 않는 domain 달력 규칙입니다.", detail: ["법·지역·제품 version에 따라 달라집니다.", "함수 인수·service로 명시합니다."] },
      ],
      codeExamples: [
        {
          id: "fixed-date-business-calculations",
          title: "고정 기준일 D-day와 만 나이 경계",
          language: "python",
          filename: "calendar_rules.py",
          purpose: "원본 고정일의 D-171과 생일 전·당일·지난 사례를 재현 가능한 함수로 확인합니다.",
          code: "from datetime import date\n\ndef days_until(target, *, base):\n    return (target - base).days\n\ndef full_age(birth, *, base):\n    if birth > base:\n        raise ValueError('birth must not be in the future')\n    return base.year - birth.year - ((base.month, base.day) < (birth.month, birth.day))\n\nbase = date(2026, 6, 1)\nexam = date(2026, 11, 19)\nprint(f'exam-days={days_until(exam, base=base)}')\nfor birth in [date(2000, 3, 1), date(2000, 12, 25), date(1990, 6, 1)]:\n    print(f'{birth}: age={full_age(birth, base=base)}')\nprint(f'past-days={days_until(date(2026, 5, 30), base=base)}')",
          walkthrough: [
            { lines: "1-4", explanation: "target-base signed timedelta days를 그대로 반환해 D-/D+ 표시는 분리합니다." },
            { lines: "6-9", explanation: "미래 출생을 거부하고 생일 월일이 아직 오지 않았으면 bool 1을 뺍니다." },
            { lines: "11-14", explanation: "원본의 기준일·시험일로 171일을 재현합니다." },
            { lines: "15-16", explanation: "생일이 지난 2000-03-01, 아직인 12-25, 당일인 1990-06-01을 비교합니다." },
            { lines: "16", explanation: "이미 지난 target은 음수 day를 반환합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "calendar_rules.py로 저장"], command: "python calendar_rules.py" },
          output: { value: "exam-days=171\n2000-03-01: age=26\n2000-12-25: age=25\n1990-06-01: age=36\npast-days=-2", explanation: ["원본 D-171이 고정 기준일에서 재현됩니다.", "같은 출생연도라도 생일 전이면 한 살 적고 생일 당일은 차감하지 않습니다.", "음수 차이를 숨기지 않아 caller가 이미 지난 일정 문구를 결정합니다."] },
          experiments: [
            { change: "base를 date(2026,2,28), birth를 date(2000,2,29)로 둡니다.", prediction: "tuple 비교만으로는 생일이 아직이라고 계산합니다.", result: "윤년 생일의 비윤년 policy를 명시해야 합니다." },
            { change: "함수 안에서 date.today를 사용합니다.", prediction: "실행 날짜마다 결과가 달라져 golden output이 깨집니다.", result: "기준 clock을 의존성으로 주입하는 장점을 확인합니다." },
          ],
          sourceRefs: ["py-datetime-source", "py-practical-stdlib-source", "python-datetime-doc"],
        },
      ],
      diagnostics: [
        { symptom: "만 나이가 생일 전후·윤년에서 1년 틀린다.", likelyCause: "연도 차이만 사용하거나 2월 29일 policy를 정의하지 않았습니다.", checks: ["생일 하루 전·당일·다음 날을 test합니다.", "윤년 출생과 비윤년 base를 확인합니다.", "법적/제품 기준일 포함 규칙을 검토합니다."], fix: "월일 비교와 domain-specific 윤년 policy를 함수에 명시합니다.", prevention: "경계 table-driven test와 policy 문서를 유지합니다." },
      ],
    },
    {
      id: "math-functions-numeric-domains",
      title: "math 함수는 입력 domain·반환 type·NaN/Infinity를 확인하고 사용합니다",
      lead: "ceil·floor·trunc는 양수에서 비슷해 보여도 음수 방향이 다르고 sqrt·log는 정의역 밖에서 ValueError가 납니다.",
      explanations: [
        "math.ceil은 작지 않은 최소 정수, floor는 크지 않은 최대 정수, trunc는 0 방향 정수 부분입니다. -3.8에서 ceil=-3, floor=-4, trunc=-3입니다. 할인·pagination·bucket policy에 맞게 선택합니다.",
        "math.sqrt(-1)과 math.log(0)는 real number domain에서 ValueError입니다. complex 결과가 필요하면 cmath를 사용합니다. math.pow는 항상 float로 변환할 수 있어 큰 int 정밀도·overflow가 생기고 **는 int exponent에서 arbitrary precision int를 유지합니다.",
        "math.isfinite는 NaN과 ±Infinity를 모두 거부해 일반 수치 validation에 유용합니다. isnan만 검사하면 Infinity가 남습니다. bool을 숫자로 허용할지는 별도입니다.",
        "gcd·lcm은 주기 정렬·분수 단순화에 유용하지만 입력 0·음수 의미를 확인합니다. factorial은 음수·비정수에서 오류이며 큰 n에서 CPU·memory가 급증합니다. 외부 입력에 제한을 둡니다.",
      ],
      concepts: [
        { term: "numeric domain", definition: "수학 함수가 의미 있는 결과를 갖는 허용 입력 집합입니다.", detail: ["sqrt real은 0 이상, log는 양수입니다.", "domain 밖은 ValueError·complex 대안이 됩니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "음수 반올림·bucket에서 ceil/floor 결과가 반대로 보인다.", likelyCause: "소수점 자르기와 수직선 기준 올림·내림을 양수 예제만으로 이해했습니다.", checks: ["-3.8에서 ceil/floor/trunc를 비교합니다.", "업무 policy가 0 방향인지 ±무한 방향인지 정의합니다.", "정수 변환 int와 비교합니다."], fix: "domain 용어로 원하는 방향을 정하고 맞는 함수를 사용합니다.", prevention: "양수·0·음수·정확 정수 경계 test를 둡니다." },
      ],
    },
    {
      id: "statistics-from-math",
      title: "평균·분산·표준편차는 모집단·표본·정밀도·빈 입력 계약을 분리합니다",
      lead: "원본은 n으로 나눈 모집단 분산을 계산하며 표본 추정에서는 n-1을 사용하는 별도 정의가 필요합니다.",
      explanations: [
        "scores의 mean은 sum/n, population variance는 제곱 편차 합/n, standard deviation은 sqrt(variance)입니다. 원본 코드를 실제 실행하면 평균 85.43, 분산 65.10, 표준편차 8.07입니다.",
        "sample variance는 데이터가 더 큰 모집단의 표본일 때 보통 n-1로 나눕니다. n=1에서는 정의되지 않습니다. statistics.pvariance·pstdev와 variance·stdev가 이 구분을 이름으로 제공합니다.",
        "큰 값과 작은 편차에서 단순 two-pass 또는 one-pass 수식의 float 안정성이 달라질 수 있습니다. statistics·검증된 library 알고리즘을 사용하고 분산 계산에서 작게 음수가 된 rounding 결과를 무작정 sqrt하지 않습니다.",
        "NaN·missing을 drop할지 impute할지 오류로 할지 정하고 실제 sample count를 report합니다. 평균±1σ를 이상치 규칙으로 사용할 때 분포 가정과 작은 sample을 고려합니다.",
      ],
      concepts: [
        { term: "population variance", definition: "관측값 전체를 모집단으로 보고 제곱 편차 합을 n으로 나눈 분산입니다.", detail: ["statistics.pvariance가 제공합니다.", "n이 0이면 정의되지 않습니다."] },
        { term: "sample variance", definition: "표본으로 모집단 분산을 추정할 때 보통 제곱 편차 합을 n-1로 나눈 값입니다.", detail: ["n이 최소 2여야 합니다.", "statistics.variance가 제공합니다."] },
      ],
      codeExamples: [
        {
          id: "population-statistics",
          title: "원본 점수 통계와 population/sample 분리",
          language: "python",
          filename: "score_statistics.py",
          purpose: "직접 계산과 statistics module 결과를 대조하고 평균±1σ 내부 점수를 확인합니다.",
          code: "import math\nimport statistics\n\nscores = [85, 90, 78, 92, 88, 95, 70]\nmean = sum(scores) / len(scores)\npop_variance = sum((score - mean) ** 2 for score in scores) / len(scores)\npop_std = math.sqrt(pop_variance)\nsample_variance = statistics.variance(scores)\nlow, high = mean - pop_std, mean + pop_std\ninside = [score for score in scores if low <= score <= high]\n\nprint(f'mean={mean:.2f}')\nprint(f'population variance={pop_variance:.2f}, std={pop_std:.2f}')\nprint(f'sample variance={sample_variance:.2f}')\nprint(f'inside={inside}')\nprint(f'library-match={math.isclose(pop_variance, statistics.pvariance(scores))}')",
          walkthrough: [
            { lines: "1-7", explanation: "원본 수식으로 mean·n denominator population variance·sqrt standard deviation을 계산합니다." },
            { lines: "8", explanation: "statistics.variance는 n-1 sample variance를 별도 계산합니다." },
            { lines: "9-10", explanation: "population mean±1σ 범위에 포함된 원래 순서의 점수를 선택합니다." },
            { lines: "12-16", explanation: "반올림 표시와 library population 결과 일치를 확인합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "score_statistics.py로 저장"], command: "python score_statistics.py" },
          output: { value: "mean=85.43\npopulation variance=65.10, std=8.07\nsample variance=75.95\ninside=[85, 90, 78, 92, 88]\nlibrary-match=True", explanation: ["원본 코드를 실제 실행한 평균·분산·표준편차와 내부 점수 목록을 재현합니다.", "sample variance는 n-1 denominator라 population variance보다 큽니다.", "math.isclose로 직접 계산과 표준 library를 비교합니다."] },
          experiments: [
            { change: "scores를 [100] 하나로 바꿉니다.", prediction: "population variance는 0이지만 statistics.variance는 최소 두 data가 필요해 StatisticsError입니다.", result: "population/sample 최소 cardinality가 다릅니다." },
            { change: "float('nan')을 추가합니다.", prediction: "평균·분산·범위가 NaN으로 오염되고 inside 결과도 달라집니다.", result: "missing·NaN 정책을 계산 전에 적용해야 합니다." },
          ],
          sourceRefs: ["py-math-source", "py-practical-stdlib-source", "python-statistics-doc"],
        },
      ],
      diagnostics: [
        { symptom: "팀마다 표준편차 값이 다르다.", likelyCause: "한쪽은 population n, 다른 쪽은 sample n-1 정의를 사용하거나 missing 처리·반올림 시점이 다릅니다.", checks: ["사용 함수 pvariance/variance와 denominator를 확인합니다.", "실제 포함 sample count를 비교합니다.", "NaN·missing·rounding policy를 봅니다."], fix: "metric 이름에 population/sample을 명시하고 같은 정제 data·표준 함수·정밀도 정책을 사용합니다.", prevention: "golden dataset과 수식·library 교차 검증을 문서화합니다." },
      ],
    },
    {
      id: "pathlib-resources-and-safety",
      title: "pathlib는 경로 의미를 타입으로 다루지만 존재·권한·신뢰를 자동 보장하지 않습니다",
      lead: "Path / 결합, name·stem·suffix·parent·parts, glob은 문자열 연결보다 명확하지만 실제 I/O 예외와 traversal 정책은 별도입니다.",
      explanations: [
        "원본 Path('data')/'csv_sample01.csv'는 OS 구분자에 맞게 결합하고 Path 속성으로 구성요소를 읽습니다. suffix는 마지막 확장자 하나이며 archive.tar.gz 전체 suffix는 suffixes를 사용합니다. 대소문자 확장자 정책을 정합니다.",
        "Path(__file__).resolve().parent는 source checkout에서 현재 module 위치 기준 resource를 찾을 수 있지만 installed wheel·zip package resource에는 importlib.resources가 더 적합합니다. user writable data를 package directory에 저장하지 않습니다.",
        "exists 후 open 사이 state가 바뀔 수 있습니다. exists는 UI 사전 표시용이고 실제 operation 예외를 처리합니다. glob 결과는 정렬·symlink·hidden·recursive pattern 정책을 명시하고 대량 tree에서 resource limit를 둡니다.",
        "외부 file name은 resolve 후 허용 base 내부인지 검증하고 absolute path·..·symlink traversal을 고려합니다. public log에 전체 home/server path를 남기지 않습니다.",
      ],
      concepts: [
        { term: "package resource", definition: "Python distribution에 포함되어 code가 읽는 template·schema·data이며 일반 file path가 아닐 수 있습니다.", detail: ["importlib.resources로 접근합니다.", "사용자 writable data와 분리합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "source checkout에서는 resource 파일을 찾지만 wheel 설치 후 실패한다.", likelyCause: "__file__ 인접 실제 path와 package resource가 항상 같은 filesystem layout이라고 가정했습니다.", checks: ["distribution에 resource가 포함됐는지 확인합니다.", "importlib.resources.files 결과를 봅니다.", "cwd·editable·wheel 설치를 비교합니다."], fix: "resource를 build metadata에 포함하고 importlib.resources API로 읽습니다.", prevention: "built wheel 설치 환경에서 resource smoke test를 실행합니다." },
      ],
      comparisons: [
        { title: "시간을 어떤 clock으로 측정할까요?", options: [
          { name: "datetime.now/date.today", chooseWhen: "사용자 달력·timestamp·현재 날짜가 필요할 때", avoidWhen: "timeout·실행 시간처럼 system clock 변경에 영향받지 않아야 할 때", tradeoffs: ["실제 wall time을 제공합니다.", "timezone·DST·clock 조정 정책이 필요합니다.", "test에는 clock 주입이 유리합니다."] },
          { name: "time.monotonic/perf_counter", chooseWhen: "경과 시간·timeout·benchmark를 측정할 때", avoidWhen: "사용자에게 표시할 calendar timestamp를 만들 때", tradeoffs: ["뒤로 가지 않는 경과 clock입니다.", "절대 날짜로 변환할 수 없습니다.", "process·시스템별 기준점은 의미 없습니다."] },
        ] },
      ],
      expertNotes: ["calendar event와 instant를 DB schema에서 별도 type/column으로 표현하고 timezone database update가 미래 일정에 미치는 영향을 migration 정책으로 관리합니다.", "정확한 과학 계산에는 float error model·units library·Decimal·Fraction·NumPy dtype를 목적에 맞게 선택하고 math 결과를 무조건 exact로 가정하지 않습니다."],
    },
  ],
  lab: {
    title: "시간대 있는 학습 마감·통계 report",
    scenario: "사용자 zone의 과제 마감과 제출 instant를 비교하고 점수 population/sample 통계와 source-relative template resource를 안전하게 조합합니다.",
    setup: ["deadline_report.py와 test_deadline_report.py를 만듭니다.", "zoneinfo가 제공되는 환경에서 Asia/Seoul·America/New_York 합성 사용자를 사용합니다.", "기준 UTC clock을 주입합니다."],
    steps: ["deadline 입력을 local date/time+zone ID로 받고 aware datetime으로 해석합니다.", "ambiguous/nonexistent local time 정책을 명시하고 UTC instant로 변환합니다.", "remaining duration과 local calendar D-day를 별도 계산합니다.", "time.monotonic으로 report 생성 elapsed를 측정하고 wall clock과 섞지 않습니다.", "점수의 유한성·empty·sample count를 검증해 mean·population/sample std를 구분합니다.", "표시 format은 locale layer에 두고 machine output은 ISO 8601 offset을 사용합니다.", "template는 importlib.resources로 읽고 사용자 output path는 허용 base를 검증합니다.", "DST fold/gap·윤년·마감 정확 instant·NaN·한 점수·resource 누락·path traversal을 테스트합니다."],
    expectedResult: ["같은 deadline instant가 사용자 zone별로 올바르게 표시됩니다.", "elapsed duration과 local D-day가 서로 다른 의미로 report됩니다.", "고정 clock으로 golden output이 재현됩니다.", "population/sample 통계와 최소 sample 오류가 명확합니다.", "wheel 설치에서도 template resource를 찾습니다.", "사용자 path가 허용 output base 밖으로 나가지 않습니다."],
    cleanup: ["TemporaryDirectory output을 제거합니다."],
    extensions: ["국가별 business calendar service를 주입합니다.", "tzdata version 변경에 따른 미래 일정 재계산 정책을 만듭니다.", "Decimal 점수·가중 통계를 추가합니다.", "report manifest에 clock·zone·data·code provenance를 기록합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 datetime·math·pathlib·실전 파일을 고정 기준으로 실행하세요.", requirements: ["D-171·세 만 나이·평균 85.43·표준편차 8.07을 재현합니다.", "strftime/strptime round-trip과 invalid date를 실행합니다.", "ceil/floor/trunc를 음수에서도 비교합니다.", "Path name·stem·suffix·parent·glob 결과를 확인합니다."], hints: ["현재 시각 출력은 golden 비교에서 제외하거나 clock을 주입합니다.", "population/sample variance를 따로 표시합니다."], expectedOutcome: "표준 타입과 함수의 경계 결과를 기준 출력으로 설명합니다.", solutionOutline: ["고정 입력 section을 먼저 실행합니다.", "환경 의존 출력을 분리합니다.", "경계 table을 자동 test로 옮깁니다."] },
    { difficulty: "응용", prompt: "생일·구독 만료 계산 library를 설계하세요.", requirements: ["기준 date를 인수로 받고 윤년 생일 policy를 정의합니다.", "월 단위 갱신과 timedelta 30일을 구분합니다.", "UTC instant·사용자 zone·local date를 분리합니다.", "expiry 전/당일/후 결과와 machine/display format을 분리합니다.", "최소 15개 월말·DST·윤년 test를 작성합니다."], hints: ["date와 datetime을 임의 비교하지 않습니다.", "법적 나이·billing policy는 코드 밖 spec이 필요합니다."], expectedOutcome: "달력 policy와 instant 계산이 명시된 재사용 가능한 API를 만듭니다." },
    { difficulty: "설계", prompt: "전 세계 예약 시스템의 시간·경로·통계 architecture를 설계하세요.", requirements: ["local schedule rule·UTC instant·zone ID·tzdata version schema를 정의합니다.", "DST gap/fold·정책 변경·재예약 migration을 포함합니다.", "monotonic timeout과 wall clock audit timestamp를 분리합니다.", "경로 resource·tenant output traversal·retention을 설계합니다.", "capacity 통계의 population/sample·NaN·단위를 정의합니다.", "clock skew·NTP 조정·multi-region consistency를 논의합니다."], hints: ["UTC만 저장하면 반복 local 일정 규칙이 사라질 수 있습니다.", "사용자 표시 문자열을 parse source of truth로 쓰지 않습니다."], expectedOutcome: "표준 라이브러리 예제를 글로벌 시간·수치·resource 운영 계약으로 확장합니다." },
  ],
  reviewQuestions: [
    { question: "date와 datetime의 차이는 무엇인가요?", answer: "date는 달력 날짜만, datetime은 날짜와 시각을 함께 표현합니다." },
    { question: "datetime.now를 domain 함수 안에서 직접 쓰면 test가 왜 어려운가요?", answer: "현재 시간이 숨은 입력이라 실행 시점·timezone마다 결과가 달라지기 때문입니다." },
    { question: "naive와 aware datetime을 바로 뺄 수 있나요?", answer: "아닙니다. timezone 정보 유무가 달라 TypeError이며 먼저 명시 정책으로 같은 시간 기준으로 만듭니다." },
    { question: "timedelta(days=30)는 한 달인가요?", answer: "고정 30일 duration일 뿐 달력 월은 28~31일이고 rollover policy가 필요합니다." },
    { question: "ceil·floor·trunc는 음수에서 어떻게 다른가요?", answer: "-3.8에서 각각 -3, -4, -3으로 ceil/floor는 ±무한 방향, trunc는 0 방향입니다." },
    { question: "원본 분산은 population인가 sample인가요?", answer: "n으로 나누므로 population variance이며 sample은 보통 n-1을 사용합니다." },
    { question: "Path.exists 후 open하면 안전한가요?", answer: "확인 뒤 상태가 바뀔 수 있어 실제 open 예외를 처리해야 합니다." },
    { question: "실행 시간 측정에 datetime.now가 최선인가요?", answer: "아닙니다. system clock 조정에 영향받지 않는 time.monotonic 또는 perf_counter가 적합합니다." },
  ],
  completionChecklist: [
    "date·datetime·timedelta·wall/monotonic clock을 구분할 수 있다.",
    "format·parse·locale·ISO 교환 계약을 설계할 수 있다.",
    "aware datetime·IANA zone·DST gap/fold를 설명할 수 있다.",
    "고정 기준일 D-day·만 나이와 달력 policy를 구현할 수 있다.",
    "math 함수의 음수·정의역·finite·반환 type을 검증할 수 있다.",
    "population/sample 통계와 empty·NaN 경계를 구분할 수 있다.",
    "pathlib·importlib.resources·안전한 output path를 선택할 수 있다.",
    "clock·zone·data·resource 환경 의존성을 주입하고 test할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-datetime-source", repository: "PYTHON-BASIC", path: "day12_stdlib/ex01_datetime.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day12_stdlib/ex01_datetime.py", usedFor: ["date.today", "datetime.now", "특정 시각", "timedelta", "strftime", "strptime"], evidence: "원본의 신정·크리스마스·358일 차이·요일·7일 후/100일 전·문자열 parsing 흐름을 감사했습니다." },
    { id: "py-math-source", repository: "PYTHON-BASIC", path: "day12_stdlib/ex02_math.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day12_stdlib/ex02_math.py", usedFor: ["ceil·floor·trunc", "sqrt·pow", "pi·e", "log", "factorial·gcd·lcm", "isnan·inf·hypot"], evidence: "원본의 대표 수치 결과와 math.pow float/연산자 int 차이를 감사해 정의역·타입 경계로 확장했습니다." },
    { id: "py-pathlib-source", repository: "PYTHON-BASIC", path: "day12_stdlib/ex03_pathlib.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day12_stdlib/ex03_pathlib.py", usedFor: ["Path 결합", "name·stem·suffix·parent·parts", "__file__", "exists/type", "glob"], evidence: "원본의 객체 경로 조작과 현재 source directory py 파일 탐색을 감사했습니다." },
    { id: "py-practical-stdlib-source", repository: "PYTHON-BASIC", path: "day12_stdlib/ex04_practical.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day12_stdlib/ex04_practical.py", usedFor: ["고정 D-171", "만 나이", "평균·분산·표준편차", "평균±1σ"], evidence: "Python 3.13.9에서 고정 기준일 D-171, 만 나이 26·25·36, 평균 85.43·분산 65.10·표준편차 8.07 결과를 확인했습니다." },
    { id: "python-datetime-doc", repository: "Python documentation", path: "library/datetime.html", publicUrl: "https://docs.python.org/3/library/datetime.html", usedFor: ["naive/aware", "timedelta", "format/parsing", "fold"], evidence: "공식 datetime 계약을 시간대·DST·duration 경계의 기준으로 사용했습니다." },
    { id: "python-statistics-doc", repository: "Python documentation", path: "library/statistics.html", publicUrl: "https://docs.python.org/3/library/statistics.html", usedFor: ["population/sample variance", "표준편차", "최소 sample"], evidence: "공식 statistics API로 원본 직접 수식과 정의를 교차 검증했습니다." },
  ],
  sourceCoverage: { filesRead: 4, filesUsed: 4, uncoveredNotes: ["pandas Timestamp·NumPy dtype·business calendar 외부 library는 데이터 분석 과정에서 다룹니다.", "zoneinfo·DST·monotonic clock·calendar policy·package resource는 원본 표준 library 예제를 전문가 운영 수준으로 보강한 내용입니다."] },
} satisfies DetailedSession;

const expertChapters: DetailedSession["chapters"] = [
  {
    id: "aware-time-zoneinfo-dst-evidence",
    title: "aware datetime·ZoneInfo·DST fold로 실제 instant와 wall time을 분리합니다",
    lead: "지역 시각은 timezone rule에 따라 존재하지 않거나 두 번 나타날 수 있으므로 저장 instant, 표시 zone과 ambiguous time 정책을 명시해야 합니다.",
    explanations: [
      "naive datetime은 tzinfo가 없어 UTC인지 지역 시간인지 자체로 알 수 없습니다. aware datetime은 utcoffset을 계산할 수 있는 tzinfo를 가져 instant 변환을 표현합니다.",
      "zoneinfo.ZoneInfo는 IANA time zone database 규칙을 사용합니다. Windows 등 system database가 없는 환경에는 tzdata package가 필요할 수 있으므로 deployment dependency와 database version을 기록합니다.",
      "DST가 끝날 때 같은 wall time이 두 번 나타나는 fold가 생깁니다. datetime의 fold=0/1로 앞·뒤 offset을 구분하고 입력 UI에는 사용자에게 offset 또는 disambiguation을 요구합니다.",
      "서로 다른 instant의 elapsed time은 UTC로 변환한 뒤 계산합니다. 같은 tzinfo 객체를 가진 local datetime끼리 뺄 때 wall-time semantics가 적용될 수 있으므로 업무가 elapsed인지 calendar recurrence인지 먼저 정합니다.",
      "DB에는 보통 UTC instant와 원래 zone ID를 별도 저장하고 표시 시 최신/고정 rule 정책을 정합니다. 단순 offset만 저장하면 미래 DST rule과 지역 identity를 잃습니다.",
    ],
    concepts: [
      { term: "aware datetime", definition: "UTC offset을 계산할 수 있는 tzinfo를 포함해 시간선의 instant와 연결할 수 있는 datetime입니다.", detail: ["naive와 직접 비교·연산이 제한됩니다.", "zone rule과 fold가 필요할 수 있습니다."] },
      { term: "fold", definition: "DST 종료처럼 같은 local wall time이 두 번 나타날 때 앞 occurrence와 뒤 occurrence를 구분하는 0/1 속성입니다.", detail: ["PEP 495에서 도입되었습니다.", "ZoneInfo가 offset 선택에 사용합니다."] },
    ],
    codeExamples: [{
      id: "zoneinfo-dst-fold-instant-evidence",
      title: "뉴욕 DST fold 두 시각의 offset·UTC instant·elapsed를 비교합니다",
      language: "python",
      filename: "dst_fold_contract.py",
      purpose: "같은 wall clock 표기가 서로 다른 instant가 될 수 있음을 고정 timezone data 예제로 확인합니다.",
      code: String.raw`from datetime import datetime, timezone
from zoneinfo import ZoneInfo

new_york = ZoneInfo("America/New_York")
first = datetime(2024, 11, 3, 1, 30, tzinfo=new_york, fold=0)
second = datetime(2024, 11, 3, 1, 30, tzinfo=new_york, fold=1)

print("offsets:", first.utcoffset(), second.utcoffset())
print("utc_first:", first.astimezone(timezone.utc).isoformat())
print("utc_second:", second.astimezone(timezone.utc).isoformat())
print("elapsed:", second.astimezone(timezone.utc) - first.astimezone(timezone.utc))
print("timestamps:", int(first.timestamp()), int(second.timestamp()))
print("same_wall_fields:", first.replace(tzinfo=None) == second.replace(tzinfo=None))

naive = datetime(2024, 11, 3, 1, 30)
try:
    naive < first
except TypeError as error:
    print("naive_aware_error:", type(error).__name__)`,
      walkthrough: [
        { lines: "1-6", explanation: "같은 2024-11-03 01:30을 fold 0/1로 만들어 EDT와 EST occurrence를 구분합니다." },
        { lines: "8-13", explanation: "서로 다른 offset·UTC instant·timestamp와 1시간 elapsed를 출력하면서 wall field는 같음을 확인합니다." },
        { lines: "15-19", explanation: "naive와 aware ordering 비교가 TypeError로 거부되는 경계를 확인합니다." },
      ],
      run: { environment: ["Python 3.13+", "IANA tzdata의 America/New_York zone 필요", "network/filesystem 직접 접근 없음"], command: "python -I -B -X utf8 dst_fold_contract.py" },
      output: { value: "offsets: -1 day, 20:00:00 -1 day, 19:00:00\nutc_first: 2024-11-03T05:30:00+00:00\nutc_second: 2024-11-03T06:30:00+00:00\nelapsed: 1:00:00\ntimestamps: 1730611800 1730615400\nsame_wall_fields: True\nnaive_aware_error: TypeError", explanation: ["fold가 바꾼 offset 때문에 timestamp가 3600초 다릅니다.", "wall field equality는 instant equality를 의미하지 않습니다."] },
      experiments: [
        { change: "fold를 둘 다 0으로 둡니다.", prediction: "같은 occurrence가 되어 timestamp도 같습니다.", result: "ambiguous input에서 fold 정책이 필수입니다." },
        { change: "UTC 변환 없이 local datetime을 직접 뺍니다.", prediction: "same tzinfo wall-time 규칙 때문에 elapsed 기대와 다를 수 있습니다.", result: "instant duration은 UTC에서 계산합니다." },
        { change: "고정 -04:00 offset만 저장합니다.", prediction: "America/New_York라는 지역 rule identity와 이후 전환 정보를 잃습니다.", result: "instant와 zone ID를 함께 보존합니다." },
      ],
      sourceRefs: ["python-zoneinfo-doc", "python-datetime-aware-naive"],
    }],
    diagnostics: [
      { symptom: "DST 종료일 예약이 한 시간 빠르거나 두 번 실행된다.", likelyCause: "ambiguous local time을 fold/offset 없이 naive datetime으로 저장했습니다.", checks: ["원본 zone ID·offset·fold를 확인합니다.", "UTC instant로 두 occurrence를 비교합니다.", "tzdata version과 scheduler semantics를 봅니다."], fix: "입력에서 ambiguity를 해소하고 UTC instant+zone ID를 저장하며 elapsed/calendar recurrence를 분리합니다.", prevention: "각 지원 zone의 gap·fold 경계 fixture와 tzdata update test를 둡니다." },
    ],
    expertNotes: ["정치적 time-zone rule은 바뀔 수 있습니다. 미래 예약을 instant로 고정할지 local recurrence로 재계산할지 제품 정책이 필요합니다."],
  },
  {
    id: "numeric-duration-and-calendar-semantics",
    title: "math.fsum·isclose와 timedelta·calendar 의미를 수치 계약으로 연결합니다",
    lead: "부동소수 근사와 시간 duration은 모두 표현과 비교 정책이 필요하며, 30일을 한 달로 간주하는 식의 단위 혼동을 피해야 합니다.",
    explanations: [
      "math.fsum은 크기가 다른 float 누적에서 일반 sum보다 정확하고 math.isclose는 상대·절대 tolerance로 근사 equality를 표현합니다. rel_tol만 쓰면 0 근처 비교가 지나치게 엄격해질 수 있어 abs_tol을 함께 검토합니다.",
      "isclose는 업무 허용 오차를 정하는 함수이지 잘못된 계산을 무조건 같다고 만드는 도구가 아닙니다. 단위와 scale을 확인하고 NaN은 어떤 값과도 close하지 않음을 테스트합니다.",
      "timedelta.seconds는 하루를 제외한 0..86399 나머지 component이고 전체 duration은 total_seconds()로 얻습니다. 음수 duration에서 둘의 차이가 특히 큽니다.",
      "timedelta(days=30)는 정확히 30*24시간의 duration이지 calendar month가 아닙니다. 1월 31일의 다음 달 같은 업무 규칙은 month 길이·말일·leap year 정책을 별도로 구현합니다.",
      "datetime arithmetic은 duration과 calendar recurrence를 구분합니다. 청구일·월간 예약에는 calendar rule, timeout·latency에는 monotonic clock과 duration이 적합합니다.",
    ],
    concepts: [
      { term: "relative tolerance", definition: "비교 값의 크기에 비례해 허용하는 오차입니다.", detail: ["math.isclose의 rel_tol입니다.", "0 근처에는 abs_tol이 필요할 수 있습니다."] },
      { term: "calendar arithmetic", definition: "달 길이·윤년·지역 시간 규칙을 따르는 날짜 단위 연산입니다.", detail: ["고정 초 duration과 다릅니다.", "말일 정책을 명시해야 합니다."] },
    ],
    codeExamples: [{
      id: "fsum-isclose-timedelta-calendar-contracts",
      title: "정밀 합계·근사 비교·음수 timedelta와 30일 calendar 함정을 확인합니다",
      language: "python",
      filename: "numeric_time_contracts.py",
      purpose: "수치와 시간 API의 이름이 숨기는 tolerance·component·calendar 의미를 exact output으로 드러냅니다.",
      code: String.raw`from datetime import date, timedelta
import math

values = [1e16, 1.0, 1e-16]
print("sums:", sum(values), math.fsum(values))
print("close_decimal:", math.isclose(0.1 + 0.2, 0.3, rel_tol=1e-12, abs_tol=0.0))
print("near_zero:", math.isclose(1e-12, 0.0, rel_tol=1e-9, abs_tol=1e-11))
print("nan_close:", math.isclose(float("nan"), float("nan")))

negative = timedelta(days=-1, seconds=1)
print("negative:", negative)
print("seconds_component:", negative.seconds)
print("total_seconds:", negative.total_seconds())

start = date(2024, 1, 31)
print("plus_30_days:", start + timedelta(days=30))
print("leap_day:", date(2024, 2, 29) + timedelta(days=1))`,
      walkthrough: [
        { lines: "1-8", explanation: "sum/fsum 차이, scale 기반 isclose와 near-zero abs_tol, NaN comparison을 확인합니다." },
        { lines: "10-13", explanation: "음수 timedelta의 seconds component 1과 전체 -86399초를 구분합니다." },
        { lines: "15-17", explanation: "1월 31일에 30일을 더하면 다음 달 29일이 아니라 3월 1일임을 확인합니다." },
      ],
      run: { environment: ["Python 3.13+", "고정 날짜", "stdin/network/filesystem 불필요"], command: "python -I -B -X utf8 numeric_time_contracts.py" },
      output: { value: "sums: 1e+16 1.0000000000000002e+16\nclose_decimal: True\nnear_zero: True\nnan_close: False\nnegative: -1 day, 0:00:01\nseconds_component: 1\ntotal_seconds: -86399.0\nplus_30_days: 2024-03-01\nleap_day: 2024-03-01", explanation: ["fsum은 큰 값과 작은 항이 섞인 입력에서 더 정확한 representable 결과를 만들고 abs_tol은 0 근처 1e-12를 허용합니다.", "timedelta.seconds와 total_seconds는 전혀 다른 질문에 답합니다."] },
      experiments: [
        { change: "near_zero의 abs_tol을 0으로 바꿉니다.", prediction: "False가 됩니다.", result: "0 근처 비교에 절대 허용 오차가 필요한 이유입니다." },
        { change: "negative.seconds로 timeout을 계산합니다.", prediction: "-86399초를 1초로 잘못 해석합니다.", result: "전체 duration에는 total_seconds를 사용합니다." },
        { change: "start를 2023-01-31로 바꿉니다.", prediction: "30일 뒤는 2023-03-02입니다.", result: "고정 일수와 달 이동이 다릅니다." },
      ],
      sourceRefs: ["python-math-fsum-isclose", "python-datetime-aware-naive"],
    }],
    diagnostics: [
      { symptom: "음수 timeout이 작은 양수로 기록된다.", likelyCause: "timedelta.total_seconds() 대신 seconds component를 사용했습니다.", checks: ["days·seconds·microseconds를 함께 출력합니다.", "음수와 24시간 초과 fixture를 실행합니다.", "업무 단위가 duration인지 확인합니다."], fix: "전체 duration은 total_seconds로 계산하고 허용 범위를 검증합니다.", prevention: "negative·multi-day duration 회귀 test를 둡니다." },
    ],
    expertNotes: ["timeout 측정에는 wall clock datetime.now보다 time.monotonic 계열이 안전합니다. 시스템 시각 조정과 DST가 elapsed를 바꾸지 않게 합니다."],
  },
  {
    id: "pathlib-pure-path-and-containment-boundary",
    title: "pathlib의 lexical path 모델과 실제 filesystem 보안 경계를 구분합니다",
    lead: "PurePath는 문자열 path 구조를 플랫폼 독립적으로 다루고 Path는 실제 filesystem 작업을 수행하지만, '..' 제거만으로 symlink·race까지 해결되지는 않습니다.",
    explanations: [
      "PurePosixPath와 PureWindowsPath는 filesystem을 조회하지 않고 parts·name·suffix·parent 같은 lexical 연산을 제공합니다. 외부 형식의 path를 현재 OS Path로 해석하기 전에 format을 정합니다.",
      "Path는 현재 platform filesystem semantics를 사용하며 exists·resolve·read_text 같은 I/O를 수행합니다. library 코드에서 cwd 의존 상대 경로보다 주입된 base path를 사용합니다.",
      "사용자 입력 path는 absolute 여부, '..' traversal, 빈 이름과 허용 확장자를 먼저 검증할 수 있습니다. 그러나 문자열 정규화만으로 symlink가 base 밖을 가리키는 문제를 막지 못합니다.",
      "실제 저장 경계에서는 trusted base와 candidate를 resolve한 뒤 containment를 검사하고, 검사와 open 사이 race를 줄이는 OS 안전 API·권한·별도 storage namespace를 검토합니다.",
      "path 전체를 오류·로그에 그대로 남기면 사용자명·directory 구조가 노출될 수 있습니다. 공개 응답에는 logical object ID나 basename처럼 필요한 최소 정보만 사용합니다.",
    ],
    concepts: [
      { term: "pure path", definition: "실제 filesystem 접근 없이 path 문자열의 platform별 구조와 연산만 표현하는 객체입니다.", detail: ["PurePosixPath·PureWindowsPath가 있습니다.", "I/O method가 없습니다."] },
      { term: "path containment", definition: "candidate가 trusted base directory 아래의 실제 허용 대상인지 검증하는 보안 조건입니다.", detail: ["lexical '..' 검사만으로 충분하지 않습니다.", "symlink·race·권한을 함께 고려합니다."] },
    ],
    codeExamples: [{
      id: "pure-path-validation-boundary",
      title: "PurePosixPath로 suffix·parts와 lexical traversal policy를 확인합니다",
      language: "python",
      filename: "pure_path_boundary.py",
      purpose: "실제 filesystem을 건드리지 않고 path parsing과 1차 입력 policy를 deterministic하게 검증합니다.",
      code: String.raw`from pathlib import PurePosixPath

base = PurePosixPath("/srv/uploads")

def lexical_target(raw):
    candidate = PurePosixPath(raw)
    if candidate.is_absolute():
        return False, "absolute"
    if ".." in candidate.parts:
        return False, "traversal"
    if candidate.suffix.casefold() not in {".txt", ".csv"}:
        return False, "extension"
    return True, str(base / candidate)

report = PurePosixPath("reports/2026.summary.csv")
print("parts:", report.parts)
print("name:", report.name)
print("stem:", report.stem)
print("suffixes:", report.suffixes)
print("parent:", report.parent)

for raw in ["team/data.csv", "../secret.txt", "/etc/passwd", "image.exe"]:
    print(raw, "->", lexical_target(raw))`,
      walkthrough: [
        { lines: "1-12", explanation: "trusted base와 absolute·'..'·extension을 검사하는 lexical policy를 정의합니다." },
        { lines: "14-19", explanation: "복합 suffix path의 parts·name·stem·suffixes·parent를 확인합니다." },
        { lines: "21-22", explanation: "허용 상대 path와 traversal·absolute·extension 거부 결과를 table로 실행합니다." },
      ],
      run: { environment: ["Python 3.13+", "PurePath만 사용해 filesystem 접근 없음"], command: "python -I -B -X utf8 pure_path_boundary.py" },
      output: { value: "parts: ('reports', '2026.summary.csv')\nname: 2026.summary.csv\nstem: 2026.summary\nsuffixes: ['.summary', '.csv']\nparent: reports\nteam/data.csv -> (True, '/srv/uploads/team/data.csv')\n../secret.txt -> (False, 'traversal')\n/etc/passwd -> (False, 'absolute')\nimage.exe -> (False, 'extension')", explanation: ["PurePosixPath라 Windows에서도 slash 기반 외부 format 결과가 같습니다.", "이 검사는 lexical 1차 경계이며 symlink containment를 증명하지 않습니다."] },
      experiments: [
        { change: "raw를 'team/../secret.txt'로 넣습니다.", prediction: "parts에 '..'가 있어 traversal로 거부됩니다.", result: "단순 prefix 문자열 비교보다 component 검사가 낫습니다." },
        { change: "suffix 검사를 endswith('.txt')로 바꿉니다.", prediction: "대소문자·복합 확장자 policy가 달라집니다.", result: "허용 확장자를 parsed suffix로 명시합니다." },
        { change: "lexical 통과만으로 실제 open을 허용합니다.", prediction: "base 안 symlink가 외부를 가리키는 위험은 남습니다.", result: "실제 filesystem containment와 권한이 별도입니다." },
      ],
      sourceRefs: ["py-pathlib-source", "python-pathlib-purepath"],
    }],
    diagnostics: [
      { symptom: "prefix 검사상 uploads 아래인데 실제 파일은 base 밖에 생성된다.", likelyCause: "문자열 startswith 또는 lexical '..' 검사만 하고 symlink·resolve containment를 확인하지 않았습니다.", checks: ["base/candidate의 resolved path와 symlink를 조사합니다.", "검사와 open 사이 race를 확인합니다.", "process filesystem 권한을 봅니다."], fix: "trusted base의 실제 containment, 안전한 open API와 최소 권한 storage를 적용합니다.", prevention: "traversal·absolute·symlink·case·race threat model과 integration test를 유지합니다." },
    ],
    expertNotes: ["업로드는 사용자가 준 filename을 storage path로 직접 쓰기보다 server-generated object ID와 metadata로 분리하는 설계가 더 강합니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...expertChapters);
session.reviewQuestions.push(
  { question: "naive datetime과 aware datetime의 차이는 무엇인가요?", answer: "aware는 UTC offset을 계산할 수 있는 tzinfo가 있어 instant와 연결되고 naive는 timezone 의미를 자체로 갖지 않습니다." },
  { question: "DST fold는 무엇을 구분하나요?", answer: "시계가 뒤로 갈 때 같은 local wall time이 두 번 나타나는 앞 occurrence(fold=0)와 뒤 occurrence(fold=1)를 구분합니다." },
  { question: "지역 datetime의 실제 elapsed를 왜 UTC에서 계산하나요?", answer: "DST gap/fold와 local wall-time arithmetic이 실제 시간선 차이를 왜곡하지 않도록 서로의 UTC instant를 비교하기 위해서입니다." },
  { question: "math.isclose에서 abs_tol이 특히 필요한 경우는 언제인가요?", answer: "비교 대상이 0에 가깝거나 정확히 0일 때 relative tolerance만으로 허용 범위를 만들기 어려운 경우입니다." },
  { question: "timedelta.seconds와 total_seconds()는 어떻게 다른가요?", answer: "seconds는 day를 제외한 나머지 component이고 total_seconds는 days·seconds·microseconds를 합친 전체 duration입니다." },
  { question: "timedelta(days=30)가 한 달 이동이 아닌 이유는 무엇인가요?", answer: "30*24시간의 고정 duration일 뿐 달마다 다른 날짜 수와 말일·윤년 규칙을 적용하지 않기 때문입니다." },
  { question: "PurePath의 '..' 검사만으로 안전한 파일 저장이 되나요?", answer: "아닙니다. symlink·resolve containment·race·OS 권한과 storage namespace를 실제 filesystem 경계에서 처리해야 합니다." },
);
session.completionChecklist.push(
  "naive·aware datetime을 혼합하지 않고 저장 instant와 표시 zone을 분리한다.",
  "ZoneInfo deployment의 tzdata와 DST gap/fold 정책을 테스트한다.",
  "elapsed duration은 UTC instant 또는 monotonic clock 기준으로 계산한다.",
  "float 합계·비교에 math.fsum과 rel_tol·abs_tol의 domain 근거를 둔다.",
  "timedelta component와 total_seconds, duration과 calendar arithmetic을 구분한다.",
  "PurePath lexical 검증과 실제 Path filesystem containment를 분리한다.",
  "path·timezone·수치 오류에 민감 정보가 노출되지 않는 negative test를 둔다.",
);
(session.sources as DetailedSession["sources"]).push(
  { id: "python-zoneinfo-doc", repository: "Python documentation", path: "library/zoneinfo.html", publicUrl: "https://docs.python.org/3/library/zoneinfo.html", usedFor: ["ZoneInfo", "IANA time zone", "fold", "tzdata"], evidence: "공식 zoneinfo 문서를 DST rule과 data source deployment 기준으로 사용했습니다." },
  { id: "python-datetime-aware-naive", repository: "Python documentation", path: "library/datetime.html#aware-and-naive-objects", publicUrl: "https://docs.python.org/3/library/datetime.html#aware-and-naive-objects", usedFor: ["aware/naive", "timedelta", "calendar boundary"], evidence: "공식 datetime aware/naive 정의와 timedelta API를 시간 model 설명의 기준으로 사용했습니다." },
  { id: "python-math-fsum-isclose", repository: "Python documentation", path: "library/math.html", publicUrl: "https://docs.python.org/3/library/math.html", usedFor: ["fsum", "isclose", "tolerance"], evidence: "공식 math 문서의 fsum·isclose 계약을 수치 정확도와 근사 비교에 사용했습니다." },
  { id: "python-pathlib-purepath", repository: "Python documentation", path: "library/pathlib.html#pure-paths", publicUrl: "https://docs.python.org/3/library/pathlib.html#pure-paths", usedFor: ["PurePath", "parts", "suffix", "lexical path"], evidence: "공식 pathlib pure paths 문서를 platform-independent path parsing 근거로 사용했습니다." },
);

export default session;
