import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-038"],
  slug: "python-038-regex-search-groups-substitution-validation",
  courseId: "python",
  moduleId: "04-reliability-tooling",
  order: 38,
  title: "정규식 검색·그룹·치환·검증",
  subtitle: "패턴을 암호처럼 외우지 않고 engine의 검색 범위·반복·캡처·backtracking을 추적해, 정확하고 안전한 텍스트 경계를 만듭니다.",
  level: "고급",
  estimatedMinutes: 170,
  coreQuestion: "정규식이 적합한 작은 text grammar를 명확히 표현하면서도 부분 일치·그룹 shape·Unicode·과도한 backtracking 때문에 잘못된 검증과 서비스 장애가 생기지 않게 어떻게 설계할까요?",
  summary: "search·match·fullmatch·findall·finditer와 Match/None, 문자 class·수량자·anchor·alternation을 원본 전화·날짜·점수 추출로 연결합니다. 이름 있는 그룹과 findall 반환 shape, callable sub·split·compile, email·전화·password 검증의 한계를 다룹니다. greedy/lazy·lookaround·backreference, re.escape, Unicode \w/\d, catastrophic backtracking·입력 제한·regex와 parser 선택까지 확장합니다.",
  objectives: [
    "raw string과 regex grammar의 두 해석 단계를 구분하고 literal 외부 입력에는 re.escape를 사용할 수 있다.",
    "search·match·fullmatch·findall·finditer의 검색 범위와 반환 type을 정확히 선택할 수 있다.",
    "문자 class·수량자·anchor·alternation·greedy/lazy가 engine 탐색에 미치는 영향을 설명할 수 있다.",
    "번호·이름 있는·non-capturing 그룹과 Match group/groupdict/span을 안전하게 사용할 수 있다.",
    "sub callable·backreference·split으로 masking·정규화를 구현하면서 원문 민감정보를 노출하지 않을 수 있다.",
    "fullmatch의 형식 검증과 실제 존재·권한·의미 검증을 분리할 수 있다.",
    "catastrophic backtracking과 입력 길이·timeout·pattern 통제의 필요성을 설명할 수 있다.",
    "정규식보다 명시 parser·표준 library·전용 validator가 적합한 경계를 선택할 수 있다.",
  ],
  prerequisites: [
    { title: "문자열 메서드와 검증", reason: "단순 문자열 API와 정규식이 필요한 grammar를 비교합니다.", sessionSlug: "python-009-string-methods-validation" },
    { title: "문자열 표기·이스케이프·raw 문자열", reason: "Python string escape와 regex escape를 두 단계로 구분합니다.", sessionSlug: "python-007-string-literals-escapes-raw" },
  ],
  keywords: ["Python", "regex", "re", "search", "match", "fullmatch", "findall", "finditer", "named group", "sub", "split", "greedy", "backtracking", "ReDoS"],
  chapters: [
    {
      id: "pattern-language-and-strings",
      title: "정규식 pattern은 Python 문자열 parser와 regex engine을 차례로 통과합니다",
      lead: "r'\d+'의 raw prefix는 Python escape 처리를 줄일 뿐 regex의 \d 의미와 보안 검증을 자동 해결하지 않습니다.",
      explanations: [
        "일반 '\\d+' 문자열도 현재는 backslash를 포함할 수 있지만 invalid escape warning과 가독성 때문에 regex는 raw string r'\\d+' 표기가 일반적입니다. raw string도 끝 단독 backslash를 쓸 수 없고 quote 규칙은 그대로입니다.",
        "regex에서 . * + ? { } [ ] ( ) | ^ $ \\는 특별 의미를 가집니다. 사용자가 입력한 검색어 a.b를 그대로 pattern에 넣으면 점이 아무 문자로 동작합니다. literal 검색은 re.escape(user_text)를 사용하고 전체 pattern을 사용자에게 맡기지 않습니다.",
        "re.compile은 pattern과 flag를 Pattern 객체로 만들어 반복 호출의 의도와 재사용을 드러냅니다. re module도 최근 pattern cache를 가지지만 compile은 이름·test·type을 명확히 합니다.",
        "flag re.IGNORECASE·MULTILINE·DOTALL·VERBOSE는 pattern 의미를 크게 바꿉니다. inline flag와 함수 flag를 혼용하지 않고 compiled pattern 정의 옆에 목적을 문서화합니다.",
      ],
      concepts: [
        { term: "regex engine", definition: "pattern grammar를 해석하고 입력 문자열에서 가능한 match를 탐색하는 실행기입니다.", detail: ["Python re는 backtracking engine입니다.", "pattern과 input shape에 따라 시간이 크게 달라질 수 있습니다."] },
        { term: "re.escape", definition: "외부 문자열의 regex 특수 문자를 escape해 pattern의 literal 조각으로 사용할 수 있게 하는 함수입니다.", detail: ["전체 regex template이 아니라 literal 부분에 사용합니다.", "replacement string escape 규칙과는 다릅니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "사용자 검색어의 점·괄호·별표가 예상보다 많은 text와 일치하거나 pattern 오류를 낸다.", likelyCause: "외부 literal을 regex grammar로 직접 삽입했습니다.", checks: ["최종 pattern repr을 민감값 없이 확인합니다.", "re.escape 적용 위치를 봅니다.", "사용자가 전체 pattern을 제어하는지 확인합니다."], fix: "허용된 고정 pattern template의 literal 조각만 re.escape해 삽입하고 필요하면 regex 기능 자체를 제공하지 않습니다.", prevention: "모든 meta character와 긴 입력 negative test를 둡니다." },
      ],
    },
    {
      id: "search-match-fullmatch-find",
      title: "부분 검색·시작 검사·전체 검증·모든 match 탐색은 서로 다른 API입니다",
      lead: "검증에 search를 쓰면 문자열 일부만 맞아도 성공하므로 전체 형식은 fullmatch로 명시합니다.",
      explanations: [
        "re.search는 어디서든 첫 match, re.match는 position 0에서만, re.fullmatch는 문자열 전체가 pattern과 일치해야 Match를 반환합니다. 원본 text에서 search r'\\d+'는 첫 010, match('010')은 None입니다.",
        "Match 또는 None이므로 group을 호출하기 전에 if match 또는 is not None을 확인합니다. Match의 group(0), start/end, span은 추출 값과 원문 위치를 제공합니다. bool(Match)는 True지만 matched text가 '0'이라고 falsy가 되는 것은 아닙니다.",
        "findall은 모든 non-overlapping match를 list로 materialize합니다. capturing group이 없으면 전체 문자열, 한 그룹이면 문자열 list, 여러 그룹이면 tuple list로 shape가 바뀝니다. group 추가가 API breaking change가 될 수 있어 추출하지 않는 괄호는 (?:...)를 씁니다.",
        "finditer는 Match iterator라 위치·groupdict가 필요하거나 큰 text를 streaming-like로 순회할 때 좋습니다. 입력 문자열 자체는 이미 memory에 있지만 결과 list를 모두 만들지 않습니다.",
      ],
      concepts: [
        { term: "full match", definition: "pattern이 입력의 처음부터 끝까지 전체를 소비한 경우에만 성공하는 검증 방식입니다.", detail: ["re.fullmatch가 명시적입니다.", "형식 성공이 domain 의미 성공은 아닙니다."] },
        { term: "non-overlapping match", definition: "한 match가 끝난 위치 이후부터 다음을 찾아 서로 겹치지 않는 결과 sequence입니다.", detail: ["findall·finditer 기본입니다.", "겹치는 match는 lookahead 등 별도 pattern이 필요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "abc123xyz가 숫자 전용 field 검증을 통과한다.", likelyCause: "re.search(r'\d+', value)로 일부 숫자 존재만 검사했습니다.", checks: ["search/match/fullmatch 중 API를 확인합니다.", "pattern에 ^ $가 flag 영향 없이 정확한지 봅니다.", "앞뒤 공백 trim 정책을 확인합니다."], fix: "전체 형식은 re.fullmatch를 사용하고 trim·Unicode digit 정책을 별도로 정합니다.", prevention: "유효 문자열 앞뒤에 garbage를 붙인 negative test를 자동 생성합니다." },
      ],
    },
    {
      id: "classes-quantifiers-backtracking",
      title: "문자 class와 수량자는 가능한 길이를 만들고 greedy engine은 필요하면 뒤로 돌아갑니다",
      lead: "*·+·?·{n,m}는 앞 atom 반복 수를 정하며 greedy 기본은 가장 많이 소비한 뒤 뒤 pattern이 맞도록 backtrack합니다.",
      explanations: [
        "\\d·\\w·\\s는 Unicode 기본 동작을 가질 수 있습니다. 원본 \\w+는 영문·숫자·underscore뿐 아니라 한글도 match합니다. ASCII만 원하면 re.ASCII 또는 명시 [A-Za-z0-9_]를 사용합니다. \\d도 여러 Unicode decimal digit을 포함할 수 있습니다.",
        "ab*는 a 뒤 b 0개 이상이라 a도 match하고 ab+는 최소 한 b가 필요합니다. \\d{2,3}은 긴 1234에서 기본 search로 123을 부분 match할 수 있습니다. field 검증은 anchor/fullmatch와 함께 사용합니다.",
        ".*는 greedy라 가능한 끝까지 갔다가 뒤 token을 위해 backtrack합니다. .*? lazy는 가능한 짧게 시작하지만 전체 context에 따라 다시 늘어날 수 있습니다. HTML nested 구조를 .*? 한 줄로 안정 parse하지 않습니다.",
        "alternation a|ab는 왼쪽부터 성공 가능한 대안을 선택하므로 입력 'ab'에서 a가 먼저 선택될 수 있습니다. 긴·구체 대안을 먼저 두거나 group 구조를 다시 씁니다.",
      ],
      concepts: [
        { term: "greedy quantifier", definition: "허용 범위에서 가능한 많은 문자를 먼저 소비하고 뒤 pattern 실패 시 되돌아가는 기본 반복입니다.", detail: ["*, +, ?와 {m,n} 기본입니다.", "? suffix로 lazy 반복을 만듭니다."] },
        { term: "backtracking", definition: "선택·반복 경로가 뒤 pattern에서 실패할 때 이전 결정으로 돌아가 다른 길이·대안을 시도하는 탐색입니다.", detail: ["표현력과 함께 최악 시간 위험이 있습니다.", "모호한 중첩 반복을 피합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "짧은 pattern인데 특정 긴 입력에서 CPU가 급증한다.", likelyCause: "(a+)+, (.*)*처럼 겹치는 중첩 수량자·alternation이 많은 backtracking 경로를 만듭니다.", checks: ["실패에 가까운 긴 입력으로 시간을 측정합니다.", "중첩 quantifier와 공통 prefix alternation을 찾습니다.", "입력 길이 제한과 timeout이 있는지 봅니다."], fix: "모호한 반복을 선형 pattern·명시 parser로 바꾸고 입력 길이를 제한하며 가능한 engine timeout을 사용합니다.", prevention: "adversarial near-match benchmark와 pattern review를 CI에 둡니다." },
      ],
    },
    {
      id: "groups-and-structured-extraction",
      title: "그룹은 match 일부를 구조화하고 이름 있는 그룹은 순번 drift를 줄입니다",
      lead: "group(0)은 전체, group(1...)은 capturing group, groupdict는 named field mapping을 제공합니다.",
      explanations: [
        "원본 날짜 (\\d{4})-(\\d{2})-(\\d{2})는 year·month·day를 순번으로 꺼냅니다. (?P<year>...) 이름을 붙이면 pattern 중간 그룹 추가에도 consumer가 의미로 접근할 수 있습니다.",
        "groups()는 전체 capturing tuple, groupdict()는 named group dict입니다. optional group이 match되지 않으면 None일 수 있습니다. default 인수로 대체 가능하지만 missing과 empty 의미를 구분합니다.",
        "backreference \\1 또는 (?P=name)은 이전 그룹과 같은 text를 요구합니다. 중복 quote·단어 검사에 유용하지만 복잡한 nested grammar는 parser가 낫습니다. replacement에서는 \\g<name> 표기가 숫자 모호성을 줄입니다.",
        "findall pattern에 capturing group을 추가하면 반환 shape가 바뀝니다. 단지 precedence를 묶을 때는 non-capturing (?:cat|dog)를 사용합니다. public utility는 Match iterator 또는 명시 dataclass로 반환 shape를 안정화할 수 있습니다.",
      ],
      concepts: [
        { term: "capturing group", definition: "괄호로 묶인 subpattern이 match한 text를 번호·이름으로 별도 저장하는 구조입니다.", detail: ["findall 반환 shape에 영향 줍니다.", "묶기만 필요하면 (?:...)를 사용합니다."] },
        { term: "named group", definition: "(?P<name>...)으로 캡처해 group('name')·groupdict로 읽는 field입니다.", detail: ["추출 의미를 이름으로 드러냅니다.", "같은 이름 중복 규칙을 확인합니다."] },
      ],
      codeExamples: [
        {
          id: "named-log-extraction",
          title: "이름 있는 그룹으로 날짜·사용자·점수 추출",
          language: "python",
          filename: "regex_groups.py",
          purpose: "여러 줄에서 유효 record만 Match 위치와 typed field로 변환하고 invalid line을 분리합니다.",
          code: "import re\n\nrecord_re = re.compile(\n    r'(?P<date>\\d{4}-\\d{2}-\\d{2})\\s+'\n    r'(?P<name>[A-Za-z][A-Za-z0-9_]*)\\s+'\n    r'score=(?P<score>\\d{1,3})'\n)\nlines = [\n    '2026-06-01 kim score=90',\n    '2026-06-02 lee score=105',\n    'bad record',\n]\n\nfor line_number, line in enumerate(lines, 1):\n    match = record_re.fullmatch(line)\n    if match is None:\n        print(f'line={line_number}: INVALID_FORMAT')\n        continue\n    fields = match.groupdict()\n    score = int(fields['score'])\n    status = 'OK' if 0 <= score <= 100 else 'OUT_OF_RANGE'\n    print(f\"line={line_number}: {fields['date']} {fields['name']} {score} {status}\")",
          walkthrough: [
            { lines: "1-7", explanation: "날짜·ASCII identifier·1~3자리 score를 named group으로 구성합니다. 날짜 실제 유효성은 regex 밖입니다." },
            { lines: "8-12", explanation: "정상, 형식은 맞지만 범위 밖, 형식 오류 세 줄을 준비합니다." },
            { lines: "14-18", explanation: "fullmatch 실패는 group 접근 전에 분리하고 line number만 보고합니다." },
            { lines: "19-22", explanation: "groupdict score를 int로 변환하고 0~100 domain 범위를 별도 검사합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "regex_groups.py로 저장"], command: "python regex_groups.py" },
          output: { value: "line=1: 2026-06-01 kim 90 OK\nline=2: 2026-06-02 lee 105 OUT_OF_RANGE\nline=3: INVALID_FORMAT", explanation: ["첫 줄은 format과 domain이 모두 유효합니다.", "105는 정규식 3자리 형식은 맞지만 score domain은 범위 밖입니다.", "형식 오류에서는 Match group을 호출하지 않습니다."] },
          experiments: [
            { change: "fullmatch를 search로 바꾸고 line 앞뒤에 garbage를 추가합니다.", prediction: "중간 record 부분만 찾아 format valid처럼 처리할 수 있습니다.", result: "record 전체 검증에는 fullmatch가 필요합니다." },
            { change: "날짜를 2026-99-99로 바꿉니다.", prediction: "자리 형식은 match해 OK 또는 score status가 출력됩니다.", result: "실제 달력 날짜는 date.fromisoformat 같은 semantic parser가 검증해야 합니다." },
          ],
          sourceRefs: ["py-regex-group-source", "py-regex-practical-source", "python-re-doc"],
        },
      ],
      diagnostics: [
        { symptom: "findall 결과가 문자열 list에서 tuple list로 갑자기 바뀐다.", likelyCause: "pattern에 capturing group을 추가해 findall 반환 규칙이 바뀌었습니다.", checks: ["pattern의 capturing 괄호 수를 셉니다.", "group이 추출용인지 precedence 묶기인지 분류합니다.", "consumer type test를 확인합니다."], fix: "묶기 전용은 non-capturing group으로 바꾸고 추출 API는 named Match/dataclass처럼 명시 구조로 안정화합니다.", prevention: "pattern과 반환 shape를 함께 contract test합니다." },
      ],
    },
    {
      id: "substitution-splitting-masking",
      title: "sub·split은 변환 도구이며 replacement와 delimiter가 data 손실을 만들지 않게 합니다",
      lead: "마스킹은 민감 원문을 복원 불가능하게 충분히 가리면서도 필요한 구분·추적 정보를 최소로 보존해야 합니다.",
      explanations: [
        "원본 re.sub(r'-\\d{7}','-*******', 주민번호)는 뒷자리를 가립니다. 실제 logging 전에 다양한 구분자·공백·부분 번호·Unicode digit을 처리해야 하며 원문을 먼저 log한 뒤 masking하면 늦습니다.",
        "replacement callable은 Match를 받아 계산한 text를 반환합니다. 원본 숫자 두 배처럼 type 변환 실패·범위·overflow를 고려합니다. callable 안에서 외부 side effect를 만들지 않습니다.",
        "replacement string의 backreference는 \\g<name>을 사용해 숫자 뒤 literal과 구분합니다. 외부 replacement를 그대로 쓰면 backslash 해석이 달라질 수 있어 literal replacement 정책을 정합니다.",
        "re.split에 capturing delimiter group이 있으면 delimiter도 결과 list에 포함됩니다. 연속 delimiter는 빈 문자열을 만들 수 있습니다. CSV처럼 quote·escape 규칙이 있는 format은 regex split 대신 csv parser를 사용합니다.",
      ],
      concepts: [
        { term: "replacement callback", definition: "re.sub가 각 Match를 인수로 호출해 동적으로 replacement 문자열을 만드는 함수입니다.", detail: ["group과 위치를 사용할 수 있습니다.", "순수하고 제한된 변환으로 유지합니다."] },
        { term: "data masking", definition: "민감 data 일부·전체를 허용된 표현으로 치환해 로그·화면에서 원문 노출을 줄이는 처리입니다.", detail: ["가능한 가장 이른 경계에 적용합니다.", "암호화·접근 제어를 대체하지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "mask-and-normalize",
          title: "전화번호 끝자리 masking과 공백 정규화",
          language: "python",
          filename: "regex_substitution.py",
          purpose: "named group replacement callback으로 다양한 전화번호를 같은 safe 표현으로 바꾸고 치환 수를 확인합니다.",
          code: "import re\n\nphone_re = re.compile(\n    r'(?P<prefix>01[016-9])-(?P<middle>\\d{3,4})-(?P<last>\\d{4})'\n)\n\ndef mask_phone(match):\n    return f\"{match.group('prefix')}-****-**{match.group('last')[-2:]}\"\n\ntext = '문의 010-1234-5678 또는 011-987-6543   입니다'\nmasked, count = phone_re.subn(mask_phone, text)\nnormalized = re.sub(r'\\s+', ' ', masked).strip()\nprint(normalized)\nprint(f'masked-count={count}')\nprint(bool(phone_re.fullmatch('010-12-5678')))\nprint(re.split(r'[,;|]\\s*', 'python, java;spring|react'))",
          walkthrough: [
            { lines: "1-5", explanation: "한국 mobile prefix·중간 3~4·마지막 4자리를 named group으로 정의합니다." },
            { lines: "7-8", explanation: "callback은 prefix와 마지막 두 자리만 보존하고 중간·앞 마지막 자리를 masking합니다." },
            { lines: "10-13", explanation: "subn으로 변환 text와 실제 치환 수를 받고 여러 공백을 하나로 정리합니다." },
            { lines: "14-16", explanation: "치환 결과, 두 건 count, 잘못된 번호 fullmatch False, 여러 단순 delimiter split을 출력합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "regex_substitution.py로 저장"], command: "python regex_substitution.py" },
          output: { value: "문의 010-****-**78 또는 011-****-**43 입니다\nmasked-count=2\nFalse\n['python', 'java', 'spring', 'react']", explanation: ["두 번호가 같은 정책으로 masking되고 extra 공백이 정규화됩니다.", "subn count로 실제 민감 pattern 발견 건수를 관찰할 수 있습니다.", "간단 delimiter grammar만 regex split로 처리합니다."] },
          experiments: [
            { change: "middle group을 \\d+로 넓힙니다.", prediction: "비정상적으로 긴 번호도 mask되어 validation 실패를 숨길 수 있습니다.", result: "masking pattern과 validation pattern의 목적·범위를 구분합니다." },
            { change: "전화번호에 공백 구분자를 허용합니다.", prediction: "현재 pattern은 match하지 않아 원문이 unmasked로 남습니다.", result: "실제 민감 data 변형을 inventory하고 default-deny logging을 사용해야 합니다." },
          ],
          sourceRefs: ["py-regex-sub-source", "py-regex-practical-source"],
        },
      ],
      diagnostics: [
        { symptom: "마스킹이 일부 표기에서 실패해 원문 번호가 로그에 남는다.", likelyCause: "한 가지 separator·길이 pattern만 처리하고 logging 전에 검출 실패를 안전하게 다루지 않았습니다.", checks: ["실제 표기 변형과 Unicode digit을 합성해 test합니다.", "masking 전 log call이 있는지 봅니다.", "치환 count 0일 때 원문을 그대로 허용하는지 확인합니다."], fix: "민감 field는 structured logging 단계에서 field 자체를 redact하고 regex는 비구조 text의 보조 방어로 사용합니다.", prevention: "PII variant corpus와 log sink 검증, default redaction policy를 둡니다." },
      ],
    },
    {
      id: "validation-semantics-unicode",
      title: "정규식 형식 일치는 실제 존재·의미·보안 강도를 보장하지 않습니다",
      lead: "이메일·날짜·전화·password는 pattern으로 일부 구조를 확인한 뒤 domain·protocol 검증을 별도로 수행합니다.",
      explanations: [
        "원본 간단 email pattern은 학습용이며 실제 RFC 전체를 구현하지 않습니다. 지나치게 완벽한 email regex보다 길이 제한·기본 parsing 후 확인 메일로 소유권을 검증합니다. domain DNS·mailbox 존재는 pattern이 알 수 없습니다.",
        "날짜 \\d{4}-\\d{2}-\\d{2}는 2026-99-99를 허용합니다. date.fromisoformat으로 calendar 의미를 검증합니다. 가격 [\\d,]+원도 쉼표 위치·범위·통화 의미를 Decimal parser가 확인합니다.",
        "password에 영문·숫자가 있다는 규칙은 entropy나 유출 여부를 보장하지 않습니다. 최소 길이, breached password 차단, rate limit, MFA, password hashing을 사용하고 password 원문을 regex error log에 남기지 않습니다.",
        "\\w·\\d·IGNORECASE는 Unicode에서 예상보다 넓습니다. identifier를 ASCII로 제한할지 internationalized를 허용할지 명시하고 confusable·normalization·IDNA는 전용 library를 사용합니다.",
      ],
      concepts: [
        { term: "syntactic validation", definition: "문자열이 정해진 문자·순서·길이 형식과 맞는지 검사하는 단계입니다.", detail: ["fullmatch에 적합합니다.", "실제 존재·권한·domain 의미는 별도입니다."] },
        { term: "semantic validation", definition: "형식이 맞는 값을 달력·범위·소유권·업무 규칙상 실제 유효한지 검사하는 단계입니다.", detail: ["전용 parser·DB·확인 flow가 필요합니다.", "race와 외부 상태가 있을 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "regex를 통과한 날짜·email·가격이 후속 시스템에서 거부된다.", likelyCause: "형식 match를 실제 calendar·protocol·domain validity로 오해했습니다.", checks: ["pattern이 보장하는 범위를 문장으로 적습니다.", "전용 parser와 외부 확인 단계가 있는지 봅니다.", "Unicode·길이·범위 경계를 test합니다."], fix: "regex는 최소 형식에만 사용하고 date/Decimal/email verification 등 semantic validator를 연결합니다.", prevention: "형식 valid지만 의미 invalid한 fixture를 별도 suite로 유지합니다." },
      ],
    },
    {
      id: "regex-security-and-alternatives",
      title: "정규식은 입력·pattern·시간을 통제하고 중첩 grammar에는 parser를 선택합니다",
      lead: "공격자가 긴 near-match를 보내면 catastrophic backtracking이 CPU를 오래 점유하는 Regular Expression Denial of Service가 될 수 있습니다.",
      explanations: [
        "(a+)+$ 같은 중첩 모호 반복은 마지막 불일치에서 같은 문자 분할 조합을 대량 탐색할 수 있습니다. 작은 정상 입력 benchmark만으로 안전을 판단하지 않습니다. 긴 거의 일치 input을 포함합니다.",
        "Python re의 timeout 지원 범위는 version과 API를 확인하고, 지원되지 않으면 입력 길이 제한·선형 pattern·격리 worker를 사용합니다. timeout만으로 thread CPU가 즉시 중단되는지 engine semantics도 확인합니다.",
        "사용자가 pattern 전체를 제출하는 검색 기능은 단순 re.escape보다 별도 query language·safe engine이 필요합니다. compile error뿐 아니라 CPU·memory·capture 수·결과 수를 제한합니다.",
        "HTML/XML/JSON/CSV/프로그래밍 언어처럼 nesting·quote·escape가 있는 grammar는 전용 parser를 사용합니다. regex는 token 추출·단순 line grammar·precheck에 제한하고 parser output을 schema 검증합니다.",
      ],
      concepts: [
        { term: "ReDoS", definition: "악의적 입력이 정규식 engine의 과도한 backtracking·연산을 유발해 CPU와 service 가용성을 소진하는 공격입니다.", detail: ["pattern과 입력 조합의 최악 시간이 핵심입니다.", "길이·timeout·선형 설계·격리로 완화합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "특정 요청 pattern 검사에서 worker가 CPU 100%로 오래 멈춘다.", likelyCause: "중첩 quantifier·공통 prefix alternation과 긴 near-match 입력이 catastrophic backtracking을 만듭니다.", checks: ["slow input 길이별 시간 증가를 격리 측정합니다.", "pattern 구조와 외부 제어 범위를 감사합니다.", "request timeout이 실제 regex 실행을 중단하는지 확인합니다."], fix: "pattern을 비모호 선형 구조나 parser로 바꾸고 입력 길이·실행 시간·동시성을 제한합니다.", prevention: "ReDoS static review와 adversarial benchmark를 release gate에 둡니다." },
      ],
      comparisons: [
        { title: "텍스트를 어떤 도구로 처리할까요?", options: [
          { name: "str 메서드", chooseWhen: "고정 prefix/suffix·단일 delimiter·literal replace처럼 단순할 때", avoidWhen: "여러 대안·반복·구조적 추출이 필요할 때", tradeoffs: ["읽기 쉽고 대체로 선형입니다.", "복잡한 pattern 조합은 코드가 늘 수 있습니다.", "literal 의미가 명확합니다."] },
          { name: "regex", chooseWhen: "평평한 text pattern·추출·치환·format precheck일 때", avoidWhen: "중첩 grammar·전체 protocol·untrusted pattern", tradeoffs: ["간결하고 강력합니다.", "backtracking·가독성·Unicode 경계가 있습니다.", "주석·test·입력 제한이 필요합니다."] },
          { name: "전용 parser/validator", chooseWhen: "CSV·JSON·HTML·날짜·URL·email 의미처럼 quote·nesting·표준이 있을 때", avoidWhen: "한 개 literal 검색이면 충분할 때", tradeoffs: ["표준 grammar와 오류 정보를 제공합니다.", "dependency·구조가 더 큽니다.", "parse 후 schema 검증이 필요합니다."] },
        ] },
      ],
      expertNotes: ["VERBOSE mode로 복잡 pattern을 이름 있는 조각과 주석으로 구성하되 whitespace·# literal 규칙을 이해하고 golden corpus로 review합니다.", "regex 결과를 authorization 근거로 사용할 때 Unicode normalization·confusable·canonicalization 순서를 통일해 검증 계층 간 parser differential을 막습니다."],
    },
  ],
  lab: {
    title: "안전한 application log parser·redactor",
    scenario: "timestamp·level·request ID·message를 가진 평평한 log line을 parse하고 email·전화·token을 redact한 뒤 구조화 issue를 수집합니다.",
    setup: ["safe_log_parser.py와 test_safe_log_parser.py를 만듭니다.", "합성 log만 사용하고 실제 secret·PII는 넣지 않습니다.", "최대 line 길이와 최대 match 수를 정합니다."],
    steps: ["VERBOSE compiled pattern에 named timestamp·level·request_id·message group을 정의합니다.", "fullmatch로 line 전체를 검사하고 실패 line number·code만 issue로 남깁니다.", "timestamp는 datetime.fromisoformat으로 semantic 검증합니다.", "message redaction은 structured field 우선, regex를 비구조 text 보조로 사용합니다.", "subn count와 redact category metric을 남기되 원문을 log하지 않습니다.", "사용자 검색어는 re.escape하고 전체 pattern 입력을 허용하지 않습니다.", "최대 line·결과 수를 넘으면 parsing 전에 거부합니다.", "valid·garbage suffix·invalid date·Unicode ID·긴 near-match·다양한 전화 표기를 테스트합니다.", "adversarial input에서 시간 증가를 benchmark하고 threshold를 둡니다."],
    expectedResult: ["형식·날짜 의미 오류가 분리됩니다.", "Match None에서 group 접근 오류가 없습니다.", "민감 값이 output·error log에 원문으로 남지 않습니다.", "긴 입력이 resource limit 전에 차단됩니다.", "동일 input에서 named field와 issue code가 결정적입니다.", "pattern 변경이 findall 반환 shape를 우연히 바꾸지 않습니다."],
    cleanup: ["합성 log artifact를 제거합니다."],
    extensions: ["JSON structured log로 전환해 regex 의존을 줄입니다.", "regex engine timeout 또는 RE2 계열 선형 engine을 비교합니다.", "locale·Unicode normalization 정책을 추가합니다.", "redaction conformance corpus를 CI secret scanning과 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 ex01~05의 search·group·sub·validation 결과를 재현하세요.", requirements: ["search/match/fullmatch/ findall/finditer 반환 type을 표로 만듭니다.", "날짜 named group과 점수 tuple을 추출합니다.", "주민번호 masking·공백 normalize·여러 delimiter split을 실행합니다.", "email·전화·password valid/invalid를 추가합니다."], hints: ["Match가 None인 경로를 반드시 넣습니다.", "capturing group을 추가했을 때 findall shape를 비교합니다."], expectedOutcome: "API별 범위·반환·그룹·변환을 정확히 예측합니다.", solutionOutline: ["원본 출력 기준을 만듭니다.", "각 pattern을 fullmatch/부분 검색으로 바꿔 봅니다.", "semantic invalid fixture를 추가합니다."] },
    { difficulty: "응용", prompt: "Markdown heading·link·code fence indexer를 만드세요.", requirements: ["정규식에 적합한 line token과 중첩 parser가 필요한 부분을 구분합니다.", "named group과 finditer span을 사용합니다.", "code fence 내부 heading을 제외합니다.", "Unicode heading과 escaped bracket를 처리합니다.", "입력 길이·match 수·backtracking 시간을 제한합니다."], hints: ["Markdown 전체를 한 regex로 parse하지 않습니다.", "state machine과 line regex를 조합합니다."], expectedOutcome: "regex와 명시 parser의 책임이 분리된 indexer를 만듭니다." },
    { difficulty: "설계", prompt: "사용자 제공 검색 pattern service의 보안 architecture를 설계하세요.", requirements: ["literal·제한 query DSL·full regex 세 제품 선택을 비교합니다.", "pattern allowlist·compile·input length·timeout·result cap을 정의합니다.", "격리 process·CPU/memory quota·cancellation을 포함합니다.", "Unicode canonicalization·audit·rate limit를 설계합니다.", "ReDoS corpus와 fuzz/property test를 제시합니다.", "검색 대상 PII·권한·결과 redaction을 포함합니다."], hints: ["re.escape는 literal 검색에는 충분하지만 regex 기능 제공 정책 자체는 아닙니다.", "HTTP timeout만으로 CPU 작업이 멈추는지 확인합니다."], expectedOutcome: "정규식 기능을 가용성·권한·privacy가 있는 안전한 서비스 경계로 설계합니다." },
  ],
  reviewQuestions: [
    { question: "raw string은 regex를 안전하게 만들어 주나요?", answer: "아닙니다. Python 문자열 escape 표기를 줄일 뿐 pattern 의미·backtracking·입력 검증은 별도입니다." },
    { question: "search와 fullmatch의 차이는 무엇인가요?", answer: "search는 어디든 첫 부분 일치, fullmatch는 입력 전체가 pattern과 맞아야 성공합니다." },
    { question: "findall에 capturing group 두 개가 있으면 무엇을 반환하나요?", answer: "각 match의 두 group 문자열을 담은 tuple list를 반환합니다." },
    { question: "group을 precedence 묶기에만 쓸 때 어떤 문법이 좋나요?", answer: "non-capturing group (?:...)를 사용해 캡처 번호와 반환 shape를 바꾸지 않습니다." },
    { question: "\w는 ASCII 영숫자만 뜻하나요?", answer: "Unicode 기본에서는 한글 등 여러 Unicode word 문자를 포함할 수 있어 정책에 따라 re.ASCII나 명시 class를 씁니다." },
    { question: "regex 날짜 형식이 맞으면 실제 날짜도 유효한가요?", answer: "아닙니다. date/datetime parser로 달력 의미를 별도 검증합니다." },
    { question: "catastrophic backtracking은 무엇인가요?", answer: "모호한 반복·대안이 긴 near-match에서 매우 많은 경로를 다시 탐색해 CPU를 소진하는 현상입니다." },
    { question: "CSV를 regex split로 처리하면 왜 위험한가요?", answer: "quote 안 delimiter·escape·newline 같은 중첩 규칙을 놓치므로 csv parser를 사용해야 합니다." },
  ],
  completionChecklist: [
    "Python string과 regex grammar escape를 구분할 수 있다.",
    "search·match·fullmatch·findall·finditer를 목적에 맞게 선택할 수 있다.",
    "수량자·greedy/lazy·alternation·backtracking을 설명할 수 있다.",
    "named/non-capturing group과 안정 반환 구조를 설계할 수 있다.",
    "sub callable·split·masking을 안전하게 구현할 수 있다.",
    "형식과 semantic validation·Unicode 정책을 분리할 수 있다.",
    "외부 literal에 re.escape를 사용하고 untrusted regex를 통제할 수 있다.",
    "ReDoS 입력 제한·timeout·parser 대안을 적용할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-regex-basic-source", repository: "PYTHON-BASIC", path: "day13_regex/ex01_basic.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day13_regex/ex01_basic.py", usedFor: ["search·match·findall·fullmatch", "Match span", "None 처리", "전화 추출"], evidence: "원본 실행 흐름에서 첫 010 위치, 숫자·전화번호 전체 목록, 숫자 전용 fullmatch와 대문자 없음 branch를 감사했습니다." },
    { id: "py-regex-meta-source", repository: "PYTHON-BASIC", path: "day13_regex/ex02_metachar.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day13_regex/ex02_metachar.py", usedFor: ["문자 class", "수량자", "anchor", "집합·alternation", "escape"], evidence: "원본의 Unicode \w, ab*/+, 2~3자리, 시작/끝, 한글·소수점 pattern을 감사했습니다." },
    { id: "py-regex-group-source", repository: "PYTHON-BASIC", path: "day13_regex/ex03_group.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day13_regex/ex03_group.py", usedFor: ["번호·named group", "groups", "findall tuple", "finditer 위치"], evidence: "2026-06-01 날짜 group과 kim/lee/park 점수 tuple·위치 결과를 감사했습니다." },
    { id: "py-regex-sub-source", repository: "PYTHON-BASIC", path: "day13_regex/ex04_sub_split.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day13_regex/ex04_sub_split.py", usedFor: ["sub masking", "공백·숫자 치환", "callable replacement", "split", "compile"], evidence: "주민번호 masking·공백 정리·숫자 두 배·다중 delimiter·전화 compile 결과를 감사했습니다." },
    { id: "py-regex-practical-source", repository: "PYTHON-BASIC", path: "day13_regex/ex05_practical.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day13_regex/ex05_practical.py", usedFor: ["email·전화·password 검증", "hashtag·가격 추출"], evidence: "원본 valid/invalid 목록과 파이썬·정규식 hashtag, 25,000원·4500원 가격 추출을 감사했습니다." },
    { id: "python-re-doc", repository: "Python documentation", path: "library/re.html", publicUrl: "https://docs.python.org/3/library/re.html", usedFor: ["pattern syntax", "API 반환", "groups", "flags", "Unicode", "escape"], evidence: "공식 re 문서를 engine·pattern·Match·API 동작의 기준으로 사용했습니다." },
  ],
  sourceCoverage: { filesRead: 5, filesUsed: 5, uncoveredNotes: ["전용 regex engine별 atomic group·possessive quantifier·timeout API는 선택 engine 문서와 함께 별도 다룹니다.", "ReDoS·structured logging redaction·Unicode confusable·parser differential은 원본 regex 예제를 전문가 보안 수준으로 보강한 내용입니다."] },
} satisfies DetailedSession;

const expertChapters: DetailedSession["chapters"] = [
  {
    id: "compiled-boundaries-groups-and-backrefs",
    title: "raw pattern·compile·search/match/fullmatch와 group 계약을 분리합니다",
    lead: "정규식은 문자열 literal escaping과 pattern grammar라는 두 층을 거치므로 raw string을 기본으로 쓰고, 찾기·접두·전체 검증 목적에 맞는 API를 선택합니다.",
    explanations: [
      "Python string parser와 regex parser 모두 backslash를 해석합니다. r'\\d+' 같은 raw string은 regex escape를 코드에 그대로 보여 주지만 끝에 홀수 backslash를 둘 수 없는 등 Python raw literal 규칙은 남습니다.",
      "re.compile은 pattern과 flags를 reusable object로 만들고 잘못된 문법을 경계 초기화 시점에 re.PatternError로 드러낼 수 있습니다. Python도 최근 pattern cache를 갖지만 compile은 의도와 dependency를 명시합니다.",
      "search는 문자열 어디서나 첫 match를 찾고 match는 시작 위치에서, fullmatch는 문자열 전체 소비를 요구합니다. validation에서 search와 ^...$를 대충 조합하기보다 fullmatch를 우선 검토합니다.",
      "capture group은 번호와 이름을 가질 수 있고 groupdict는 named field extraction에 적합합니다. 구조화가 필요 없는 grouping에는 (?:...) non-capturing group을 사용해 번호가 흔들리지 않게 합니다.",
      "backreference는 이전 group과 동일한 text를 다시 요구합니다. pattern 안의 (?P=name)과 replacement의 \\g<name> 문법을 구분하고, 값 equality가 아니라 exact text repetition임을 기억합니다.",
    ],
    concepts: [
      { term: "match boundary", definition: "pattern을 문자열 어디에서, 시작에서, 전체에서 적용할지 정하는 search·match·fullmatch 의미입니다.", detail: ["validation에는 fullmatch가 선명합니다.", "anchors와 MULTILINE 상호작용을 피할 수 있습니다."] },
      { term: "named group", definition: "(?P<name>...)으로 capture에 의미 있는 이름을 부여한 group입니다.", detail: ["groupdict로 구조화합니다.", "named backreference에도 사용합니다."] },
    ],
    codeExamples: [{
      id: "compiled-search-match-fullmatch-groups",
      title: "한 compiled pattern의 search·match·fullmatch와 named backreference를 비교합니다",
      language: "python",
      filename: "regex_boundaries.py",
      purpose: "같은 pattern도 API boundary에 따라 결과가 달라지고 groupdict가 구조를 보존함을 exact output으로 확인합니다.",
      code: String.raw`import re

token = re.compile(r"(?P<kind>[A-Z]+)-(?P<number>\d+)")
text = "prefix TASK-42 suffix"

searched = token.search(text)
matched = token.match(text)
full = token.fullmatch("TASK-42")
print("search:", searched.group(0), searched.span())
print("match:", matched)
print("fullmatch:", full.groupdict())

repeat = re.compile(r"\b(?P<word>[A-Za-z]+)\s+(?P=word)\b", re.IGNORECASE)
for sentence in ["go go now", "go stop go"]:
    found = repeat.search(sentence)
    print("repeat:", sentence, "->", found.group("word") if found else None)

try:
    re.compile(r"([a-z]+")
except re.PatternError as error:
    print("compile_error:", type(error).__name__)`,
      walkthrough: [
        { lines: "1-11", explanation: "raw string named group pattern을 compile하고 search·match·fullmatch의 서로 다른 boundary 결과를 비교합니다." },
        { lines: "13-16", explanation: "named backreference가 인접한 같은 단어를 case-insensitive하게 찾는지 확인합니다." },
        { lines: "18-21", explanation: "닫히지 않은 group을 compile 시점의 re.PatternError type으로 고정합니다." },
      ],
      run: { environment: ["Python 3.13+", "stdin/network/filesystem 불필요"], command: "python -I -B -X utf8 regex_boundaries.py" },
      output: { value: "search: TASK-42 (7, 14)\nmatch: None\nfullmatch: {'kind': 'TASK', 'number': '42'}\nrepeat: go go now -> go\nrepeat: go stop go -> None\ncompile_error: PatternError", explanation: ["search span은 end-exclusive 7..14입니다.", "Python 3.13에서 공식 예외 이름은 PatternError이며 re.error는 alias입니다."] },
      experiments: [
        { change: "token.match(text, pos=7)을 사용합니다.", prediction: "TASK-42가 match됩니다.", result: "match는 전체 문자열이 아니라 지정 시작 위치 boundary입니다." },
        { change: "fullmatch 입력 뒤에 newline을 추가합니다.", prediction: "전체 소비에 실패해 None입니다.", result: "^...$와 fullmatch의 newline 차이를 검토합니다." },
        { change: "named group 앞에 capture group을 추가합니다.", prediction: "named access는 유지되지만 번호 group은 이동합니다.", result: "외부 extraction에는 이름이 안정적입니다." },
      ],
      sourceRefs: ["py-regex-basic-source", "py-regex-meta-source", "python-re-compile", "python-re-fullmatch", "python-re-match-groups"],
    }],
    diagnostics: [
      { symptom: "validation regex가 문자열 일부만 맞아도 통과한다.", likelyCause: "fullmatch 대신 search 또는 unanchored match를 사용했습니다.", checks: ["사용 API와 pattern anchor를 확인합니다.", "앞뒤 garbage·newline fixture를 추가합니다.", "flags MULTILINE 영향을 봅니다."], fix: "전체 field grammar는 fullmatch로 표현하고 길이·type을 별도 검사합니다.", prevention: "prefix/suffix garbage와 empty negative test를 유지합니다." },
    ],
    expertNotes: ["regex compile 성공은 업무 grammar가 옳다는 뜻이 아닙니다. positive·negative corpus와 길이·Unicode policy가 필요합니다."],
  },
  {
    id: "substitution-flags-and-unicode-semantics",
    title: "sub callback·flags와 Unicode/ASCII 문자 class 정책을 명시합니다",
    lead: "replacement는 단순 문자열 치환과 match 기반 변환이 다르고, \\d·\\w·IGNORECASE의 Unicode 범위는 ASCII 입력 정책과 같지 않습니다.",
    explanations: [
      "re.sub는 replacement 문자열 또는 callable을 받습니다. callable은 Match를 입력으로 받아 parsing·formatting·masking을 명시할 수 있고 subn은 결과와 치환 횟수를 함께 반환합니다.",
      "replacement 문자열의 backslash도 group reference 문법을 사용합니다. 모호한 \\1보다 \\g<name> 형태가 group 번호 뒤 숫자와 구분하기 쉽습니다.",
      "re.IGNORECASE는 Unicode case matching을 수행하지만 언어별 collation·casefold 전체 의미와 동일하지 않습니다. identifier policy에는 re.ASCII와 명시 alphabet을 검토합니다.",
      "기본 Unicode pattern에서 \\d는 ASCII 0-9뿐 아니라 Unicode decimal digit을, \\w는 많은 Unicode alphanumeric과 underscore를 포함합니다. 입력 protocol이 ASCII면 flags=re.ASCII 또는 [0-9]를 사용합니다.",
      "re.MULTILINE은 ^/$의 line boundary, DOTALL은 dot의 newline 포함, VERBOSE는 공백·주석 pattern 작성에 영향을 줍니다. compiled pattern 가까이에 flags 의도를 설명합니다.",
    ],
    concepts: [
      { term: "replacement callback", definition: "각 Match를 받아 동적으로 replacement 문자열을 계산하는 callable입니다.", detail: ["mask·normalization에 적합합니다.", "반환값은 반드시 str입니다."] },
      { term: "ASCII flag", definition: "Unicode str pattern의 \\w·\\d·\\s·word boundary 등을 ASCII 범위로 제한하는 re.ASCII flag입니다.", detail: ["case-insensitive 범위에도 영향을 줍니다.", "protocol grammar를 명시합니다."] },
    ],
    codeExamples: [{
      id: "regex-sub-callback-flags-unicode",
      title: "subn callback과 Unicode/ASCII digit class 차이를 확인합니다",
      language: "python",
      filename: "regex_sub_flags.py",
      purpose: "동적 replacement, 치환 횟수와 Unicode 문자 class 정책을 deterministic output으로 비교합니다.",
      code: String.raw`import re

setting = re.compile(r"(?P<key>[A-Za-z_]+)=(?P<value>\d+)", re.ASCII)

def normalize(match):
    key = match.group("key").upper()
    value = int(match.group("value"))
    return f"{key}:{value:03d}"

converted, count = setting.subn(normalize, "retry=3 timeout=20 mode=fast")
print("subn:", converted, count)

text = "ASCII 123 / fullwidth １２３"
print("unicode_digits:", re.findall(r"\d+", text))
print("ascii_digits:", re.findall(r"\d+", text, flags=re.ASCII))

words = "café_42"
print("unicode_word:", re.fullmatch(r"\w+", words) is not None)
print("ascii_word:", re.fullmatch(r"\w+", words, flags=re.ASCII) is not None)

masked = re.sub(
    r"(?P<local>[A-Za-z0-9._%+-]+)@(?P<host>[A-Za-z0-9.-]+)",
    lambda match: match.group("local")[0] + "***@" + match.group("host"),
    "owner=alice@example.com",
)
print("masked:", masked)`,
      walkthrough: [
        { lines: "1-11", explanation: "named groups와 ASCII flag를 compile하고 callback으로 key/value를 변환하며 subn count를 얻습니다." },
        { lines: "13-16", explanation: "기본 \\d가 전각 decimal도 찾지만 re.ASCII는 123만 찾는 차이를 확인합니다." },
        { lines: "18-20", explanation: "Unicode \\w가 café를 허용하고 ASCII \\w는 거부합니다." },
        { lines: "22-26", explanation: "email-like text를 callback으로 최소 표시만 남겨 masking합니다." },
      ],
      run: { environment: ["Python 3.13+", "합성 개인정보만 사용", "stdin/network/filesystem 불필요"], command: "python -I -B -X utf8 regex_sub_flags.py" },
      output: { value: "subn: RETRY:003 TIMEOUT:020 mode=fast 2\nunicode_digits: ['123', '１２３']\nascii_digits: ['123']\nunicode_word: True\nascii_word: False\nmasked: owner=a***@example.com", explanation: ["setting pattern은 ASCII digits만 변환해 protocol policy를 고정합니다.", "email 예제는 합성 값이며 실제 민감 원문을 출력하지 않습니다."] },
      experiments: [
        { change: "setting에서 re.ASCII를 제거합니다.", prediction: "전각 숫자도 \\d에 맞고 int 변환 허용 범위가 넓어질 수 있습니다.", result: "pattern과 conversion grammar를 함께 정합니다." },
        { change: "callback이 int를 반환합니다.", prediction: "sub가 TypeError를 냅니다.", result: "replacement callable 반환 contract는 str입니다." },
        { change: "masking을 첫 글자도 숨기도록 바꿉니다.", prediction: "re-identification 위험은 줄지만 사용자 확인 가능성도 낮아집니다.", result: "mask policy는 threat model에 맞춥니다." },
      ],
      sourceRefs: ["python-re-sub", "python-re-match-groups", "python-re-compile"],
    }],
    diagnostics: [
      { symptom: "ASCII 계정 규칙인데 전각 숫자나 비ASCII 문자가 통과한다.", likelyCause: "\\d·\\w가 Unicode str pattern에서 넓은 문자 집합을 포함한다는 점을 놓쳤습니다.", checks: ["pattern flags와 입력 code point를 확인합니다.", "re.ASCII 결과와 비교합니다.", "Unicode 허용 정책을 제품 요구와 맞춥니다."], fix: "ASCII protocol이면 re.ASCII 또는 명시 class를 사용하고 Unicode 지원이면 normalization·script policy를 설계합니다.", prevention: "ASCII·전각·결합문자·confusable fixture를 둡니다." },
    ],
    expertNotes: ["regex masking은 parser가 아닙니다. RFC 전체 email grammar·internationalized domain·display name을 다룰 때는 해당 protocol parser와 최소 공개 정책을 사용합니다."],
  },
  {
    id: "validation-redos-and-timeout-boundary",
    title: "validation을 길이·linear pattern으로 방어하고 ReDoS timeout 경계를 설계합니다",
    lead: "중첩 quantifier와 ambiguous alternation은 실패 입력에서 catastrophic backtracking을 일으킬 수 있으므로 pattern 검토, 입력 제한과 실행 격리가 필요합니다.",
    explanations: [
      "^(a+)+$처럼 같은 문자를 여러 방식으로 나눠 맞출 수 있는 중첩 quantifier는 끝에서 실패할 때 조합 수가 폭발할 수 있습니다. 작은 정상 입력 benchmark만으로 안전하다고 결론내리지 않습니다.",
      "validation은 먼저 type·최대 길이·허용 alphabet 같은 O(n) guard를 적용하고 가능한 한 명확한 bounded quantifier와 linear한 pattern을 사용합니다.",
      "Python 표준 re API에는 일반적인 per-match timeout 인자가 없습니다. 신뢰할 수 없는 복잡 pattern 실행은 별도 process deadline, 제한된 pattern service, timeout을 지원하는 검토된 engine 같은 architecture 경계가 필요합니다.",
      "사용자 문자열을 pattern에 포함해야 하면 re.escape로 literalize합니다. 사용자가 regex 자체를 제출하도록 허용하는 것은 검색 편의 기능이 아니라 code-like resource consumption surface입니다.",
      "성능 test는 위험 pattern을 production process에서 거대한 입력으로 직접 실행하지 않고 정적 review·bounded corpus·격리 worker와 deadline으로 수행합니다. timeout 후 worker를 폐기할 수 있어야 합니다.",
    ],
    concepts: [
      { term: "catastrophic backtracking", definition: "backtracking engine이 실패를 확정하기 전 매우 많은 가능한 match 분할을 탐색해 시간이 급증하는 현상입니다.", detail: ["중첩 quantifier·ambiguous alternation이 흔한 원인입니다.", "ReDoS 공격으로 이어질 수 있습니다."] },
      { term: "regex execution boundary", definition: "pattern·입력 크기·deadline·자원과 실패 처리를 제한하는 실행 격리 정책입니다.", detail: ["stdlib re 자체 timeout만 기대할 수 없습니다.", "외부 pattern은 code-like input으로 다룹니다."] },
    ],
    codeExamples: [{
      id: "bounded-linear-regex-validation",
      title: "길이 guard·ASCII fullmatch·literal escape로 안전한 검증 경계를 만듭니다",
      language: "python",
      filename: "regex_validation_boundary.py",
      purpose: "위험 pattern을 실제로 오래 실행하지 않고 bounded validation과 external literal 처리 결과를 exact output으로 검증합니다.",
      code: String.raw`import re

USERNAME = re.compile(r"[A-Za-z][A-Za-z0-9_]{2,19}", re.ASCII)

def validate_username(value):
    if not isinstance(value, str):
        return False, "type"
    if len(value) > 20:
        return False, "too_long"
    if USERNAME.fullmatch(value) is None:
        return False, "syntax"
    return True, value

cases = ["Ada_01", "ab", "1alice", "A" * 21, "café"]
for value in cases:
    print(repr(value), "->", validate_username(value))

external = "a+b?.txt"
literal_pattern = re.compile(re.escape(external))
print("escaped:", re.escape(external))
print("literal_found:", literal_pattern.search("file=a+b?.txt") is not None)

risky_example = r"^(a+)+$"
print("risky_pattern_documented_not_executed:", risky_example)`,
      walkthrough: [
        { lines: "1-12", explanation: "bounded ASCII username pattern과 type→length→fullmatch validation 순서를 정의합니다." },
        { lines: "14-16", explanation: "정상·짧음·첫 문자·초과 길이·Unicode 입력을 stable code로 분류합니다." },
        { lines: "18-21", explanation: "외부 문자열을 re.escape로 literal pattern에 안전하게 삽입합니다." },
        { lines: "23-24", explanation: "교육용 위험 pattern은 text로만 기록하고 실행하지 않아 검증 자체가 ReDoS가 되지 않게 합니다." },
      ],
      run: { environment: ["Python 3.13+", "위험 pattern 실행 없음", "stdin/network/filesystem 불필요"], command: "python -I -B -X utf8 regex_validation_boundary.py" },
      output: { value: "'Ada_01' -> (True, 'Ada_01')\n'ab' -> (False, 'syntax')\n'1alice' -> (False, 'syntax')\n'AAAAAAAAAAAAAAAAAAAAA' -> (False, 'too_long')\n'café' -> (False, 'syntax')\nescaped: a\\+b\\?\\.txt\nliteral_found: True\nrisky_pattern_documented_not_executed: ^(a+)+$", explanation: ["길이 초과는 regex 실행 전에 거부됩니다.", "re.escape 결과는 외부 text의 metacharacter를 literal로 만듭니다."] },
      experiments: [
        { change: "길이 guard를 regex 뒤로 옮깁니다.", prediction: "복잡 pattern에서는 공격 입력 비용을 먼저 지불합니다.", result: "cheap guard를 expensive parse 전에 둡니다." },
        { change: "external을 escape 없이 compile합니다.", prediction: "+, ?, .가 regex operator로 해석되어 다른 문자열과 match할 수 있습니다.", result: "literal data와 pattern code를 구분합니다." },
        { change: "사용자에게 임의 regex를 허용합니다.", prediction: "입력 길이 제한만으로 pattern 자체의 계산 폭발을 막지 못합니다.", result: "격리 process·deadline·pattern 제한이 필요합니다." },
      ],
      sourceRefs: ["python-re-fullmatch", "python-re-compile", "owasp-redos"],
    }],
    diagnostics: [
      { symptom: "특정 실패 문자열 하나가 CPU를 오래 점유한다.", likelyCause: "중첩 quantifier·ambiguous alternation의 catastrophic backtracking 또는 무제한 외부 regex입니다.", checks: ["pattern과 입력 길이를 안전하게 기록합니다.", "위험한 중첩·alternation을 review합니다.", "격리 환경에서 timeout profile을 측정합니다."], fix: "linear/bounded pattern으로 재작성하고 입력 cap·격리 deadline을 적용합니다.", prevention: "regex security review, adversarial corpus와 worker timeout budget을 둡니다." },
    ],
    expertNotes: ["timeout은 취소 요청일 뿐 같은 process의 C regex 실행을 안전하게 중단할 수 있는지 engine별 확인이 필요합니다. 강한 경계에는 kill 가능한 별도 process가 적합합니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...expertChapters);
session.reviewQuestions.push(
  { question: "raw string을 regex pattern에 권장하는 이유는 무엇인가요?", answer: "Python string escape와 regex escape 두 층의 backslash를 코드에 더 직접적으로 표현해 실수를 줄이기 위해서입니다." },
  { question: "search·match·fullmatch의 차이는 무엇인가요?", answer: "search는 어디서나 첫 match, match는 시작 위치, fullmatch는 문자열 전체 소비를 요구합니다." },
  { question: "named group의 장점은 무엇인가요?", answer: "group 번호 이동에 덜 취약하고 extraction field 의미를 groupdict와 이름으로 명시합니다." },
  { question: "sub replacement callback은 언제 유용한가요?", answer: "Match field에 따라 parsing·formatting·masking처럼 동적인 replacement를 계산할 때 유용합니다." },
  { question: "기본 \\d와 \\w가 ASCII만 의미하나요?", answer: "아닙니다. Unicode str pattern에서는 Unicode decimal·word 문자를 포함하며 ASCII policy에는 re.ASCII나 명시 class가 필요합니다." },
  { question: "re.escape는 무엇을 해결하고 무엇을 해결하지 못하나요?", answer: "외부 문자열을 literal pattern fragment로 만들지만 임의 외부 regex 허용의 계산량·ReDoS 문제를 해결하지는 않습니다." },
  { question: "Python stdlib re에서 untrusted regex timeout을 어떻게 설계하나요?", answer: "일반 per-match timeout이 없으므로 pattern/입력 제한과 kill 가능한 별도 process deadline 또는 검토된 대체 engine을 고려합니다." },
);
session.completionChecklist.push(
  "regex pattern은 raw string과 compile 경계로 의도를 명확히 한다.",
  "찾기·접두·전체 validation에 search·match·fullmatch를 정확히 선택한다.",
  "구조 extraction은 named group/groupdict와 non-capturing group을 사용한다.",
  "sub callback·subn과 replacement backreference를 구분한다.",
  "Unicode와 ASCII \\d·\\w·IGNORECASE 정책을 adversarial fixture로 검증한다.",
  "validation 전에 type·길이·alphabet guard를 두고 pattern을 bounded하게 작성한다.",
  "외부 regex에는 ReDoS threat model·격리 deadline·로그 redaction을 적용한다.",
);
(session.sources as DetailedSession["sources"]).push(
  { id: "python-re-compile", repository: "Python documentation", path: "library/re.html#re.compile", publicUrl: "https://docs.python.org/3/library/re.html#re.compile", usedFor: ["compile", "flags", "PatternError"], evidence: "공식 re.compile 문서의 compiled Pattern과 flags 계약을 사용했습니다." },
  { id: "python-re-fullmatch", repository: "Python documentation", path: "library/re.html#re.fullmatch", publicUrl: "https://docs.python.org/3/library/re.html#re.fullmatch", usedFor: ["fullmatch", "validation boundary"], evidence: "공식 re.fullmatch 문서의 전체 문자열 match 계약을 확인했습니다." },
  { id: "python-re-match-groups", repository: "Python documentation", path: "library/re.html#match-objects", publicUrl: "https://docs.python.org/3/library/re.html#match-objects", usedFor: ["group", "groupdict", "span", "named capture"], evidence: "공식 Match object 문서를 extraction과 callback field 접근의 기준으로 사용했습니다." },
  { id: "python-re-sub", repository: "Python documentation", path: "library/re.html#re.sub", publicUrl: "https://docs.python.org/3/library/re.html#re.sub", usedFor: ["sub", "subn", "replacement callback"], evidence: "공식 re.sub 문서의 문자열/callable replacement 계약을 확인했습니다." },
  { id: "owasp-redos", repository: "OWASP", path: "www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS", publicUrl: "https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS", usedFor: ["catastrophic backtracking", "ReDoS threat model"], evidence: "OWASP의 ReDoS 설명을 untrusted pattern·입력의 보안 경계 근거로 사용했습니다." },
);

export default session;
