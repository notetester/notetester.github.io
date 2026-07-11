import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-009"],
  slug: "python-009-string-methods-validation",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 9,
  title: "문자열 메서드와 검증",
  subtitle: "count·find·index에서 strip·split·join·startswith까지, 메서드의 반환 계약을 읽고 정규화와 유효성 검사를 분리합니다.",
  level: "기초",
  estimatedMinutes: 110,
  coreQuestion: "문자열을 검색·정제·분해하면서 원본을 잃지 않고 실패를 명확하게 다루려면 어떤 메서드를 어떻게 조합해야 할까요?",
  summary: "문자열 메서드가 원본을 바꾸지 않고 새 값을 반환한다는 공통 규칙에서 출발합니다. find와 index의 실패 계약, strip의 문자 집합 함정, split과 join의 역할 반전, 대소문자 정규화, 접두·접미 검사와 이메일 검증의 한계를 실행 결과와 오류 진단으로 확인합니다.",
  objectives: [
    "str 메서드 호출이 새 값을 반환하며 원본 문자열을 변경하지 않는다는 사실을 증명할 수 있다.",
    "count, find, index, in을 실패 처리 요구에 맞게 선택할 수 있다.",
    "strip·lower·casefold·replace를 정규화 정책과 연결해 사용할 수 있다.",
    "split의 구분자 생략 규칙과 명시 구분자 규칙, join의 호출 주체를 설명할 수 있다.",
    "startswith·endswith를 빠른 형식 검사에 쓰되 도메인 유효성 검증과 구분할 수 있다.",
    "정제·검증·파싱·저장을 순서가 있는 파이프라인으로 설계할 수 있다.",
  ],
  prerequisites: [
    { title: "문자열 표기와 escape", reason: "원본 문자열과 공백·구분자 리터럴을 정확히 만듭니다.", sessionSlug: "python-007-string-literals-escapes-raw" },
    { title: "문자열 인덱싱과 슬라이싱", reason: "find와 index가 반환하는 위치, 불변 문자열의 새 값 반환을 연결합니다.", sessionSlug: "python-008-string-indexing-slicing" },
  ],
  keywords: ["Python", "str methods", "find", "index", "strip", "replace", "split", "join", "startswith", "정규화", "유효성 검사"],
  chapters: [
    {
      id: "method-contract",
      title: "메서드는 객체가 제공하는 동작 계약입니다",
      lead: "text.upper()에서 text는 호출 주체, upper는 str 타입이 제공하는 메서드입니다. 반환값과 실패 방식까지 읽어야 API를 안다고 할 수 있습니다.",
      explanations: [
        "함수 type(text)와 달리 text.upper()는 str 객체를 통해 메서드를 찾습니다. 점 앞 객체의 타입에 따라 사용할 수 있는 메서드가 달라집니다. 에디터 자동 완성은 후보를 보여 주지만 인수·반환 타입·실패 조건은 문서와 실험으로 확인해야 합니다.",
        "str은 불변이므로 upper, strip, replace 같은 메서드는 원본 객체의 문자를 직접 고치지 않고 새 str 값을 반환합니다. text.strip()만 호출하고 반환값을 받지 않으면 text는 그대로입니다. cleaned = text.strip() 또는 text = text.strip()처럼 반환값을 바인딩해야 합니다.",
        "모든 메서드가 str을 반환하는 것은 아닙니다. count·find·index는 int, startswith·endswith는 bool, split은 list[str]을 반환합니다. 메서드 이름만 외우지 말고 ‘입력 → 반환 타입 → 실패’ 표를 스스로 만들면 조합 오류가 줄어듭니다.",
      ],
      concepts: [
        { term: "메서드", definition: "특정 타입의 객체를 통해 호출하며 그 타입의 데이터 모델에 맞는 동작을 제공하는 함수입니다.", detail: ["점 앞 객체가 암묵적인 첫 대상이 됩니다.", "인수, 반환 타입, 부작용, 예외가 메서드 계약을 이룹니다."] },
        { term: "반환 계약", definition: "정상일 때 어떤 타입·값을 돌려주고 실패할 때 sentinel 또는 예외 중 무엇을 사용하는지에 대한 약속입니다.", detail: ["find는 못 찾으면 -1, index는 ValueError입니다.", "split은 항상 list를 돌려주며 구분자가 없어도 원소 하나짜리 list입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "strip이나 replace를 호출했는데 원본 문자열이 그대로다.", likelyCause: "불변 str 메서드의 반환값을 변수에 받지 않고 버렸습니다.", checks: ["메서드 호출 결과를 repr로 직접 출력합니다.", "호출 전후 원본 이름의 값을 비교합니다.", "해당 메서드의 반환 타입과 in-place 여부를 문서에서 확인합니다."], fix: "cleaned = raw.strip()처럼 새 이름에 받고 정제 파이프라인의 다음 단계에 cleaned를 사용합니다.", prevention: "원본 raw와 파생 normalized 이름을 구분하고 반환값을 검사하는 테스트를 둡니다." },
      ],
    },
    {
      id: "count-search-contracts",
      title: "count·find·index·in은 서로 다른 질문에 답합니다",
      lead: "존재만 궁금한지, 첫 위치가 필요한지, 없으면 정상인지 오류인지에 따라 API를 선택합니다.",
      explanations: [
        "text.count('o')는 겹치지 않는 부분 문자열의 개수를 int로 반환하고 없으면 0입니다. 빈 문자열을 count하면 문자 사이 경계까지 세므로 직관과 다른 len(text)+1이 나올 수 있습니다. 요구사항이 문자 빈도인지 겹치는 패턴인지 명확히 하세요.",
        "find는 첫 시작 위치를 반환하고 못 찾으면 -1입니다. index는 같은 위치를 반환하지만 못 찾으면 ValueError를 냅니다. ‘없음’이 흔한 정상 분기면 find 또는 in이 자연스럽고, 반드시 있어야 하는 구분자가 없으면 데이터 오류라는 계약에는 index의 예외가 의도를 드러낼 수 있습니다.",
        "존재 여부만 필요하면 'Python' in text가 가장 직접적입니다. if text.find('Python'):처럼 쓰면 위치 0은 False, -1은 True로 평가되어 조건이 뒤집히는 심각한 버그가 됩니다. find 결과를 쓸 때는 != -1을 명시하거나 in을 사용합니다.",
        "find와 index는 선택적인 start, end 범위를 받을 수 있습니다. 첫 결과 뒤부터 다시 찾는 반복 로직에서 유용하지만 겹치는 패턴을 찾으려면 다음 시작 위치를 1만 증가시킬지 패턴 길이만큼 증가시킬지 정책을 정합니다.",
      ],
      concepts: [
        { term: "sentinel 값", definition: "정상 결과와 구분되는 특별한 값으로 특정 상태를 표현하는 방식입니다.", detail: ["find의 -1은 찾지 못함을 뜻합니다.", "sentinel을 일반 truthiness 조건으로 검사하면 위치 0과 혼동할 수 있어 명시 비교가 필요합니다."], caveat: "-1은 Python에서 유효한 음수 인덱스이므로 find 결과를 검사하지 않고 text[position]에 쓰면 못 찾았을 때 마지막 문자를 잘못 읽습니다." },
      ],
      codeExamples: [
        {
          id: "search-contract-comparison",
          title: "find와 index의 성공·실패 계약 비교",
          language: "python",
          filename: "search_contracts.py",
          purpose: "원본 ex03_string.py의 P와 K 검색을 확장해 반환값을 조건문에서 안전하게 사용하는 방법을 확인합니다.",
          code: "text = 'Hello Python'\n\nprint(text.count('o'))\nprint(text.find('P'))\nprint(text.find('K'))\nprint('Python' in text)\n\nposition = text.find('Hello')\nprint(f'{position=}, found={position != -1}')\n\ntry:\n    print(text.index('K'))\nexcept ValueError as error:\n    print(type(error).__name__, '필수 문자 K가 없습니다')",
          walkthrough: [
            { lines: "1", explanation: "검색 대상 원본을 불변 str로 준비합니다." },
            { lines: "3", explanation: "o가 인덱스 4와 10에 있어 개수 2를 반환합니다." },
            { lines: "4-5", explanation: "P는 위치 6, 없는 K는 sentinel -1입니다." },
            { lines: "6", explanation: "위치가 필요 없을 때 in이 의도를 바로 bool로 반환합니다." },
            { lines: "8-9", explanation: "Hello는 위치 0이라 bool(position)은 False입니다. -1과 명시 비교해야 성공을 정확히 판단합니다." },
            { lines: "11-14", explanation: "index의 실패는 ValueError이므로 반드시 있어야 하는 값의 오류 경로를 예외로 분리할 수 있습니다." },
          ],
          run: { environment: ["Python 3.11 이상", "search_contracts.py를 저장"], command: "python search_contracts.py" },
          output: { value: "2\n6\n-1\nTrue\nposition=0, found=True\nValueError 필수 문자 K가 없습니다", explanation: ["위치 0도 정상 성공이라는 점이 명시 비교에서 드러납니다.", "find와 index는 같은 검색을 하지만 실패 표현이 -1과 ValueError로 다릅니다.", "try/except는 예상한 ValueError만 잡아 다른 프로그래밍 오류를 숨기지 않습니다."] },
          experiments: [
            { change: "print(bool(text.find('K')))를 추가합니다.", prediction: "-1은 0이 아닌 정수라 True가 나와 잘못된 성공처럼 보입니다.", result: "find를 truthiness로 검사하면 안 되는 증거를 확인합니다." },
            { change: "text.count('o')를 text.count('')로 바꿉니다.", prediction: "빈 부분 문자열은 문자 사이 경계 13개로 계산됩니다.", result: "길이 12 문자열에서 13이 출력되어 count 대상 계약의 중요성을 확인합니다." },
          ],
          sourceRefs: ["py-string-method-code", "py-day02-note"],
        },
      ],
      diagnostics: [
        { symptom: "없는 문자를 find한 뒤 text[position]이 마지막 문자를 반환한다.", likelyCause: "find의 -1 sentinel을 검사하지 않고 유효한 음수 인덱스로 사용했습니다.", checks: ["position 값을 repr로 확인합니다.", "검색 실패가 정상 분기인지 데이터 오류인지 결정합니다.", "위치가 필요 없는 경우 in으로 바꿀 수 있는지 봅니다."], fix: "position != -1을 확인한 뒤 인덱싱하거나, 반드시 있어야 하면 index와 구체 ValueError 처리를 사용합니다.", prevention: "검색 실패 테스트를 추가하고 find 반환을 바로 인덱스로 쓰지 않는 리뷰 규칙을 둡니다." },
      ],
    },
    {
      id: "case-and-whitespace-normalization",
      title: "대소문자와 공백 정규화는 비교 전에 적용합니다",
      lead: "사용자가 입력한 '  Hong@Gmail.Com   '을 비교하기 전에 양끝 공백과 대소문자를 일관된 정책으로 정리할 수 있습니다.",
      explanations: [
        "strip은 양끝의 공백 문자를 제거하고 lstrip·rstrip은 한쪽만 처리합니다. 중간 공백은 유지됩니다. 인수 없는 strip은 스페이스뿐 아니라 탭·줄바꿈 등 Unicode whitespace를 처리합니다. 원본 ex03에서 길이 12인 '   hello    '가 strip 후 길이 5가 됩니다.",
        "strip(chars)는 정확한 접두·접미 문자열을 제거하는 함수가 아니라 chars에 들어 있는 문자 집합을 양끝에서 반복 제거합니다. 'www.example.com'.strip('w.com')은 기대한 도메인 제거와 전혀 다를 수 있습니다. 정확한 접두·접미 제거는 removeprefix·removesuffix를 사용합니다.",
        "lower와 upper는 대소문자를 새 문자열로 변환합니다. 사용자 식별자의 caseless 비교에는 일부 언어에서 lower보다 casefold가 적합하지만, 이메일 로컬 파트·비밀번호·파일 경로처럼 대소문자 정책이 도메인별로 다릅니다. 무조건 lower로 저장하기 전에 규칙을 확인합니다.",
        "capitalize는 첫 문자를 대문자로, 나머지를 소문자로 바꾸므로 이미 의도적으로 섞인 제품명이나 사람 이름을 훼손할 수 있습니다. 표시용 이름을 자동 교정하지 말고 사용자가 제공한 원본과 검색용 정규화 값을 분리합니다.",
      ],
      concepts: [
        { term: "정규화(normalization)", definition: "의미가 같다고 취급할 입력을 비교·저장하기 쉬운 일관된 표현으로 바꾸는 과정입니다.", detail: ["양끝 공백, 대소문자, Unicode 정규화, 구분자 정책이 포함될 수 있습니다.", "원본 보존과 정규화 값의 사용 목적을 분리해야 정보 손실을 통제할 수 있습니다."] },
        { term: "casefold", definition: "언어 간 caseless 비교를 위해 lower보다 적극적으로 대소문자 차이를 접는 str 메서드입니다.", detail: ["검색 키 비교에 유용할 수 있습니다.", "표시 문자열을 casefold 결과로 대체하는 용도는 아닙니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "strip('.com')으로 도메인 접미사를 지웠더니 예상보다 많은 문자가 사라졌다.", likelyCause: "strip 인수를 하나의 접미 문자열이 아니라 제거할 문자 집합으로 해석합니다.", checks: ["원본과 결과를 repr로 비교합니다.", "정확한 접두·접미 제거인지 양끝 문자 정리인지 요구를 구분합니다.", "Python 버전이 removeprefix/removesuffix를 지원하는지 확인합니다."], fix: "정확한 접미사는 text.removesuffix('.com')을 사용하거나 endswith 확인 후 슬라이스합니다.", prevention: "strip(chars)의 문자 집합 의미를 테스트하고 URL·경로에는 전용 파서를 사용합니다." },
      ],
      expertNotes: ["사용자명 정규화는 계정 중복과 보안에 직접 연결됩니다. Unicode confusable, NFC 정책, 대소문자 규칙을 데이터베이스 unique constraint와 일치시킵니다."],
    },
    {
      id: "replace-and-transform",
      title: "replace는 일치하는 부분을 새 문자열로 바꿉니다",
      lead: "text.replace(old, new)는 모든 비중첩 일치를 바꾼 새 str을 반환하고, 찾지 못하면 값이 같은 문자열을 반환합니다.",
      explanations: [
        "'Life is too short'.replace('Life', 'Your leg')는 'Your leg is too short'를 만듭니다. 오타 'Lief'는 일치하지 않아 원래 내용과 같은 결과가 나옵니다. 교체가 반드시 일어나야 하는 업무라면 old in text 또는 교체 전후 비교로 검증해야 합니다.",
        "세 번째 count 인수로 앞에서 몇 개까지만 바꿀 수 있습니다. 단순 정제에는 편리하지만 여러 규칙이 겹치면 적용 순서에 따라 결과가 달라집니다. URL, HTML, SQL, 코드 같은 구조화 문서를 replace 연쇄로 수정하지 말고 해당 파서·라이브러리를 사용합니다.",
        "민감정보 마스킹에 replace(token, '***')를 쓰면 token이 빈 문자열일 때 모든 문자 사이에 ***가 들어가거나, 다른 문맥의 같은 문자열까지 바뀔 수 있습니다. 비밀을 문자열에 조립하기 전 구조화 필드 단계에서 제외하는 것이 우선입니다.",
      ],
      concepts: [
        { term: "비중첩 일치", definition: "한 번 선택한 일치 범위와 겹치지 않는 다음 위치부터 찾는 방식입니다.", detail: ["replace와 count 결과가 겹치는 패턴에 대한 수학적 기대와 다를 수 있습니다.", "겹치는 검색이 필요하면 명시적 알고리즘이나 정규식 lookahead를 검토합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
    },
    {
      id: "split-and-join",
      title: "split은 하나를 여러 값으로, join은 여러 값을 하나로 만듭니다",
      lead: "split의 반환은 list[str]이고 join의 호출 주체는 사이에 넣을 구분자 문자열입니다.",
      explanations: [
        "'Life is too short'.split()처럼 구분자를 생략하면 연속된 공백·탭·줄바꿈을 하나의 경계처럼 처리하고 양끝 공백에서 빈 항목을 만들지 않습니다. 반면 'a,,b'.split(',')처럼 구분자를 명시하면 연속 구분자 사이의 빈 문자열도 데이터로 보존합니다.",
        "'Life,is,too,short'.split()은 쉼표를 자동 인식하지 않아 원소 하나짜리 list를 반환합니다. split(',')을 명시해야 네 원소가 됩니다. 자연어의 ‘공백으로 나눈다’와 특정 문자 구분 형식을 구분하세요.",
        "separator.join(parts)는 parts의 문자열 원소 사이에 separator를 넣습니다. 원본의 '*, '.join(text)는 문자열도 시퀀스라 각 문자 사이에 구분자를 넣습니다. 숫자가 섞인 list를 join하면 TypeError이므로 의미 있는 변환 정책으로 str을 만든 뒤 조합합니다.",
        "CSV는 단순 line.split(',')로 완전하게 파싱할 수 없습니다. 따옴표 안 쉼표, 줄바꿈, escaping 규칙이 있기 때문에 csv 모듈을 사용합니다. split은 단순하고 명확한 구분자 계약에만 사용합니다.",
      ],
      concepts: [
        { term: "토큰화", definition: "하나의 문자열을 규칙에 따라 의미 있는 작은 문자열 목록으로 나누는 과정입니다.", detail: ["split은 단순 구분자 토큰화에 적합합니다.", "인용·escape·중첩 문법이 있으면 전용 파서가 필요합니다."] },
        { term: "join", definition: "문자열 iterable의 항목 사이에 구분자를 넣어 하나의 str을 만드는 메서드입니다.", detail: ["구분자가 메서드 호출 주체라는 문법을 기억합니다.", "대량 문자열 조립에서 반복 +보다 의도가 명확하고 효율적일 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "normalization-split-join-pipeline",
          title: "태그 입력을 정규화하고 중복 제거 후 다시 조립하기",
          language: "python",
          filename: "tag_pipeline.py",
          purpose: "strip·lower·split·join을 순서 있는 파이프라인으로 조합하고 각 단계의 타입과 결과를 확인합니다.",
          code: "raw = ' Python, spring ,PYTHON,  React  '\n\nparts = raw.split(',')\nnormalized = [part.strip().lower() for part in parts]\nunique = list(dict.fromkeys(normalized))\nresult = ' | '.join(unique)\n\nprint(parts)\nprint(normalized)\nprint(unique)\nprint(result)\nprint(raw)",
          walkthrough: [
            { lines: "1", explanation: "공백·대소문자·중복이 섞인 원본을 보존합니다." },
            { lines: "3", explanation: "명시 구분자 쉼표로 네 원소 list를 만듭니다. 각 원소 주변 공백은 아직 남아 있습니다." },
            { lines: "4", explanation: "각 항목의 양끝 공백을 제거하고 비교용 소문자로 새 list를 만듭니다." },
            { lines: "5", explanation: "dict 키의 삽입 순서와 중복 불허 성질을 사용해 첫 등장 순서를 유지한 중복 제거 list를 만듭니다." },
            { lines: "6", explanation: "문자열 원소 사이에 ' | '를 넣어 표시용 str을 만듭니다." },
            { lines: "8-12", explanation: "각 중간값과 원본을 출력해 변환 단계와 불변성을 확인합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "tag_pipeline.py를 저장"], command: "python tag_pipeline.py" },
          output: { value: "[' Python', ' spring ', 'PYTHON', '  React  ']\n['python', 'spring', 'python', 'react']\n['python', 'spring', 'react']\npython | spring | react\n Python, spring ,PYTHON,  React  ", explanation: ["split 직후에는 구분자만 제거되고 주변 공백은 남습니다.", "정규화 뒤 PYTHON과 Python이 같은 키가 되어 중복 제거됩니다.", "마지막 raw 출력은 어떤 메서드도 원본 str을 변경하지 않았음을 증명합니다."] },
          experiments: [
            { change: "raw에 'Python,,React'를 넣습니다.", prediction: "명시 구분자 split 때문에 중간 빈 문자열이 항목으로 생깁니다.", result: "빈 태그를 제거할 검증 단계가 별도로 필요함을 확인합니다." },
            { change: "' | '.join(unique)를 unique.join(' | ')로 바꿉니다.", prediction: "list에는 join 메서드가 없어 AttributeError가 납니다.", result: "join의 호출 주체가 구분자 str이라는 규칙을 확인합니다." },
          ],
          sourceRefs: ["py-string-method-code", "py-day02-note"],
        },
      ],
      diagnostics: [
        { symptom: "TypeError: sequence item 1: expected str instance, int found가 발생한다.", likelyCause: "join 대상 iterable에 int 같은 비문자열 항목이 섞였습니다.", checks: ["[type(item).__name__ for item in parts]로 항목 타입을 확인합니다.", "숫자를 어떤 표시 규칙으로 바꿀지 결정합니다.", "원본 데이터 타입을 유지해야 하는 계산 단계인지 확인합니다."], fix: "표시 단계에서 (str(item) for item in parts) 또는 목적에 맞는 포맷 함수를 적용한 뒤 join합니다.", prevention: "list[str] 계약을 타입 힌트와 테스트로 명시하고 계산 데이터와 표시 조각을 분리합니다." },
      ],
    },
    {
      id: "prefix-suffix-validation",
      title: "startswith와 endswith는 빠른 경계 검사이지 완전한 검증기가 아닙니다",
      lead: "접두·접미가 맞는지 bool로 확인할 수 있지만 문자열 전체의 문법과 실제 존재 여부까지 보장하지는 않습니다.",
      explanations: [
        "text.startswith('Life')와 text.endswith('short')는 각각 시작·끝의 정확한 문자열 일치를 bool로 반환합니다. 여러 후보는 tuple로 전달해 filename.endswith(('.jpg', '.png'))처럼 검사할 수 있습니다. 대소문자 정책이 있다면 정규화한 비교용 값에 적용합니다.",
        "원본 이메일 예제의 '@' in email and email.endswith('.com')은 최소 조건 데모일 뿐 완전한 이메일 검증이 아닙니다. '---@.com', 공백이 든 값, 국제화 도메인도 통과하거나 잘못 거부될 수 있습니다. 이메일은 표준 문법이 복잡하고 최종 소유 확인은 실제 인증 메일 전송으로 해야 합니다.",
        "파일 확장자 검사만으로 업로드 파일 종류를 신뢰하면 안 됩니다. 공격자는 실행 파일 이름을 image.jpg로 바꿀 수 있습니다. 콘텐츠 타입·magic bytes·디코더 검증, 저장 위치와 실행 권한 정책이 함께 필요합니다.",
      ],
      concepts: [
        { term: "형식 검사", definition: "입력의 일부 표면 규칙이 맞는지 확인하는 단계입니다.", detail: ["접두·접미·길이·허용 문자 검사가 해당됩니다.", "업무적으로 존재하고 소유되며 안전하다는 의미 검증과는 다릅니다."] },
        { term: "검증 계층", definition: "정규화, 구문, 도메인 규칙, 외부 확인, 보안 검사를 각 책임으로 나누는 설계입니다.", detail: ["한 정규식이나 endswith 하나에 모든 신뢰를 맡기지 않습니다.", "실패 이유를 사용자 메시지와 운영 진단에 맞게 분리합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "'---@.com' 같은 잘못된 값이 이메일 검사에 통과한다.", likelyCause: "@ 포함과 .com 접미만 확인해 로컬 파트·도메인 구조·공백·길이를 검증하지 않았습니다.", checks: ["현재 코드가 보장하는 조건을 정확히 목록화합니다.", "실제 요구가 UI 오타 방지인지 계정 소유 확인인지 구분합니다.", "신뢰할 수 있는 이메일 파서와 인증 메일 흐름이 있는지 확인합니다."], fix: "검증 라이브러리로 구문을 검사하고 정규화 정책을 적용한 뒤 실제 인증 링크로 소유를 확인합니다.", prevention: "정상·경계·악성 입력 corpus와 최종 소유 확인을 별도 테스트합니다." },
      ],
      expertNotes: ["보안 검증은 허용 목록이 기본입니다. 파일명·확장자·MIME 헤더 어느 하나만 신뢰하지 말고 실제 디코딩과 격리 저장을 사용합니다."],
    },
    {
      id: "production-pipeline",
      title: "원본 보존 → 정규화 → 검증 → 파싱 → 사용 순서를 지킵니다",
      lead: "메서드를 길게 이어 붙이는 것보다 각 단계의 이름·타입·실패를 드러내는 파이프라인이 디버깅과 정책 변경에 강합니다.",
      explanations: [
        "raw는 외부에서 들어온 원본입니다. normalized는 비교 정책을 적용한 값, validated는 검증을 통과했다는 상태, parsed는 도메인 타입으로 바뀐 값입니다. 이름을 분리하면 어디서 정보가 사라졌는지와 어느 오류 메시지를 보여 줄지 추적할 수 있습니다.",
        "raw.strip().lower().split(',')처럼 체이닝하면 짧지만 중간 결과와 실패를 보기 어렵습니다. 규칙이 간단하고 실패가 없는 표현에는 체이닝이 좋지만, 사용자 입력 검증에서는 단계별 이름과 구체 오류가 대개 더 가치 있습니다.",
        "로그에는 전체 raw 입력을 무조건 남기지 않습니다. 비밀번호·토큰·개인정보를 최소화하고 길이와 실패 코드 같은 진단 메타데이터를 기록합니다. 제어 문자와 줄바꿈을 그대로 로그에 넣으면 로그 위조·가독성 문제가 생길 수 있어 구조화 로깅과 escaping을 사용합니다.",
        "성능 최적화 전에는 프로파일링합니다. 수백만 행 정제에서는 Python 루프 대신 pandas 벡터화가 유리할 수 있지만, 정규화 정책과 결측 처리 의미를 먼저 동일하게 만들어야 합니다.",
      ],
      concepts: [
        { term: "정제 파이프라인", definition: "외부 문자열을 단계별 규칙과 명시적 실패를 거쳐 내부 데이터로 바꾸는 흐름입니다.", detail: ["각 단계는 입력·출력 타입과 보존·손실 정보를 가져야 합니다.", "정규화 전 원본을 보존할지는 개인정보 정책과 감사 요구에 따라 결정합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "find와 index 중 무엇을 선택할까요?", options: [
          { name: "find", chooseWhen: "대상이 없는 것이 정상이고 위치 또는 -1 분기가 필요할 때", avoidWhen: "-1 검사를 놓칠 위험이 크거나 반드시 있어야 하는 형식일 때", tradeoffs: ["예외 없이 분기할 수 있습니다.", "위치 0과 -1의 truthiness 함정이 있습니다.", "sentinel 계약을 명시해야 합니다."] },
          { name: "index", chooseWhen: "대상이 반드시 있어야 하며 누락을 즉시 오류로 취급할 때", avoidWhen: "검색 실패가 흔한 정상 흐름일 때", tradeoffs: ["불변 조건 위반이 ValueError로 드러납니다.", "예외 처리 또는 상위 전파가 필요합니다.", "실패 위치를 놓치지 않습니다."] },
        ] },
      ],
      expertNotes: ["입력 정규화와 데이터베이스 collation·인덱스 규칙이 다르면 애플리케이션에서 같다고 본 값이 DB unique constraint에서는 다르거나 그 반대가 될 수 있습니다.", "문자열을 SQL·HTML·shell 명령에 넣을 때 정규화가 escaping을 대신하지 않습니다. 각 컨텍스트의 매개변수 API를 사용합니다."],
    },
  ],
  lab: {
    title: "사용자 태그 입력 정제·검증기",
    scenario: "쉼표로 입력된 기술 태그를 정규화하고 빈 값·길이·허용 문자를 검증한 뒤 순서를 유지해 중복 제거하고 화면 문자열을 만듭니다.",
    setup: ["tag_validator.py를 만듭니다.", "정상 입력과 빈 항목·너무 긴 항목·제어 문자가 포함된 실패 입력을 준비합니다.", "Python 3.11 이상에서 실행합니다."],
    steps: ["raw를 보존하고 split(',')으로 후보를 만듭니다.", "각 후보에 strip과 casefold를 적용하되 표시용 원본 정책을 정합니다.", "빈 문자열, 20자 초과, 허용하지 않은 문자를 이유별로 분리합니다.", "유효 태그만 첫 등장 순서로 중복 제거합니다.", "join으로 화면 문자열을 만들고 원본·중간 list·오류 list·결과를 출력합니다.", "token 모양 문자열과 줄바꿈 입력이 로그에 그대로 노출되지 않도록 진단 출력 정책을 적용합니다."],
    expectedResult: ["정상 태그는 일관된 비교 키로 중복 제거됩니다.", "빈 값과 잘못된 값은 조용히 사라지지 않고 이유가 기록됩니다.", "표시 문자열은 계산·검증용 list와 별도 str입니다.", "원본이 민감할 수 있음을 고려한 로그 정책이 코드에 드러납니다."],
    cleanup: ["합성 입력만 사용하고 실제 토큰·개인정보를 실습 파일에 저장하지 않습니다."],
    extensions: ["한글과 결합 문자의 길이 정책을 추가합니다.", "허용 태그 목록을 set으로 두고 알 수 없는 값을 제안과 함께 거부합니다.", "같은 파이프라인을 함수로 만들고 정상·실패 테스트를 작성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 ex03의 주요 메서드 반환 타입 표를 만드세요.", requirements: ["count, find, upper, strip, split, startswith 결과와 type을 출력합니다.", "원본 문자열을 마지막에 다시 출력합니다.", "각 메서드의 실패 또는 없음 결과를 한 개씩 기록합니다."], hints: ["split만 list를 반환합니다.", "find의 없음은 -1, startswith의 불일치는 False입니다."], expectedOutcome: "메서드 이름이 아니라 반환 계약으로 분류한 실행 표가 완성됩니다.", solutionOutline: ["동일한 text에 메서드를 하나씩 호출합니다.", "result와 type(result)를 함께 출력합니다.", "원본 불변성을 마지막에 확인합니다."] },
    { difficulty: "응용", prompt: "검색어와 문서 제목을 caseless 비교하고 위치를 안전하게 표시하세요.", requirements: ["strip과 casefold로 비교 키를 만듭니다.", "위치 0과 없음 -1을 모두 테스트합니다.", "원본 제목의 표시 대소문자는 보존합니다.", "find와 in 중 선택 이유를 씁니다."], hints: ["정규화된 제목에서 위치를 찾되 Unicode 변환 후 위치가 원본과 달라질 수 있음을 기록합니다.", "단순 ASCII 범위부터 완성하세요."], expectedOutcome: "정규화 값과 표시 원본을 분리하고 sentinel 함정을 피합니다." },
    { difficulty: "설계", prompt: "회원가입 이메일 처리 계약을 설계하세요.", requirements: ["raw·normalized·validated·verified 단계를 구분합니다.", "strip·대소문자 정책과 Unicode·길이 규칙을 정합니다.", "문자열 형식 검사와 실제 소유 인증을 분리합니다.", "정상·오류·악성 입력 최소 8개와 예상 결과를 작성합니다.", "로그에서 이메일·토큰을 어떻게 마스킹할지 정합니다."], hints: ["@와 endswith만으로는 충분하지 않습니다.", "검증 라이브러리와 인증 메일이 서로 다른 책임입니다."], expectedOutcome: "몇 개의 str 메서드를 실제 제품의 계층적 검증·보안 정책으로 확장한 설계가 완성됩니다." },
  ],
  reviewQuestions: [
    { question: "find와 index는 찾지 못했을 때 어떻게 다른가요?", answer: "find는 -1 sentinel을 반환하고 index는 ValueError를 발생시킵니다." },
    { question: "if text.find('Hello')가 잘못될 수 있는 이유는 무엇인가요?", answer: "Hello가 위치 0에서 발견되면 0이 False로 평가되고, 못 찾은 -1은 True로 평가되어 의미가 뒤집힙니다." },
    { question: "split()과 split(' ')는 연속 공백에서 어떻게 다른가요?", answer: "인수 없는 split은 연속 whitespace를 하나의 경계처럼 처리하지만 명시적 ' '는 연속 구분자 사이 빈 문자열을 보존합니다." },
    { question: "왜 ','.join([1, 2])가 실패하나요?", answer: "join은 str 항목 iterable을 요구하고 int를 자동 표시 문자열로 바꾸지 않기 때문입니다." },
    { question: "strip('.com')이 정확한 .com 접미 제거가 아닌 이유는 무엇인가요?", answer: "인수를 문자열 한 덩어리가 아니라 제거할 문자 집합으로 해석하기 때문입니다. removesuffix를 사용해야 합니다." },
    { question: "@ 포함과 .com 접미 검사가 이메일 유효성을 보장하나요?", answer: "아닙니다. 매우 약한 형식 조건일 뿐 문법·도메인·소유를 보장하지 않습니다. 파서와 인증 흐름이 필요합니다." },
    { question: "str 메서드를 체이닝할 때 언제 중간 이름으로 나누어야 하나요?", answer: "중간 단계의 타입·실패·정보 손실을 확인하거나 오류 메시지를 구분해야 할 때 단계별 이름으로 나누는 것이 좋습니다." },
  ],
  completionChecklist: [
    "str 메서드의 반환값을 받아야 원본과 다른 정제 값을 사용할 수 있음을 설명할 수 있다.",
    "count·find·index·in을 존재·위치·실패 요구에 맞춰 선택할 수 있다.",
    "strip(chars)의 문자 집합 의미와 removeprefix/removesuffix 차이를 설명할 수 있다.",
    "split의 생략·명시 구분자 차이와 join의 str 항목 계약을 재현할 수 있다.",
    "startswith·endswith 검사를 완전한 도메인 검증과 혼동하지 않는다.",
    "원본 보존, 정규화, 검증, 파싱, 로그 최소화의 순서 있는 파이프라인을 설계할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-string-method-code", repository: "PYTHON-BASIC", path: "day02/ex03_string.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day02/ex03_string.py", usedFor: ["count·find·index", "join", "대소문자·strip", "replace·split", "startswith·endswith", "이메일 정규화"], evidence: "Python 3.13.9에서 원본을 직접 실행해 2·0, 6·-1, 길이 12→5, split list, 접두·접미 bool과 이메일 통과 결과를 확인했습니다." },
    { id: "py-day02-note", repository: "PYTHON-BASIC", path: "notes/day02_string_list_tuple.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day02_string_list_tuple.md", usedFor: ["메서드 표", "find와 index 차이", "split 반환 타입", "셀프 체크"], evidence: "원본 노트의 메서드 계약을 기준으로 sentinel 함정, Unicode 정규화와 제품 검증 계층을 보강했습니다." },
  ],
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["정규식 기반 검증은 py-038에서 별도로 다룹니다.", "Unicode 계정 정규화·업로드 보안·구조화 로그는 원본 공백을 전문가 관점으로 보강했습니다."] },
} satisfies DetailedSession;

export default session;
