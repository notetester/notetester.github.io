import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-012"],
  slug: "python-012-tuple-packing-unpacking",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 12,
  title: "튜플·패킹·언패킹",
  subtitle: "쉼표가 만드는 불변 시퀀스의 문법을 이해하고, 고정 구조를 안전하게 분해하며 여러 반환값과 교환을 설명합니다.",
  level: "기초",
  estimatedMinutes: 105,
  coreQuestion: "변하지 않는 순서 묶음을 만들고 각 위치의 의미를 안전하게 꺼내려면 tuple을 어떻게 사용해야 할까요?",
  summary: "(3)과 (3,)의 차이, 괄호 생략 패킹, 인덱싱·슬라이싱, 불변성과 중첩 mutable 요소, + 연결과 list 왕복을 실행합니다. 고정 개수·별표 언패킹, 함수의 여러 값 반환, swap, hash 가능성과 list·dataclass 선택 기준까지 연결합니다.",
  objectives: [
    "튜플을 만드는 핵심 문법이 괄호가 아니라 쉼표임을 설명할 수 있다.",
    "인덱싱과 슬라이싱 결과 타입, + 연결이 새 tuple을 만든다는 사실을 예측할 수 있다.",
    "tuple 불변성과 내부 mutable 요소의 변경 가능성을 구분할 수 있다.",
    "고정 개수·중첩·별표 언패킹의 성공 조건과 오류를 진단할 수 있다.",
    "여러 반환값과 변수 교환을 패킹·언패킹 과정으로 설명할 수 있다.",
    "list, tuple, NamedTuple, dataclass를 데이터 의미에 따라 선택할 수 있다.",
  ],
  prerequisites: [
    { title: "리스트 생성·중첩·가변성", reason: "가변 list와 불변 tuple, 변환 전후 객체 참조를 비교합니다.", sessionSlug: "python-010-list-creation-nesting-mutability" },
    { title: "문자열 인덱싱과 슬라이싱", reason: "tuple도 같은 시퀀스 위치와 반열린 범위 규칙을 사용합니다.", sessionSlug: "python-008-string-indexing-slicing" },
  ],
  keywords: ["Python", "tuple", "packing", "unpacking", "starred expression", "immutable", "multiple return", "hashable"],
  chapters: [
    {
      id: "comma-creates-tuple",
      title: "튜플을 만드는 것은 괄호보다 쉼표입니다",
      lead: "(3)은 계산 그룹을 위한 괄호 안 int이고, (3,)은 항목 뒤 쉼표가 있는 한 요소 tuple입니다.",
      explanations: [
        "t=(1,2,3)은 세 요소 tuple입니다. 괄호를 생략한 t=1,2,3도 같은 tuple을 만듭니다. 함수 호출·복잡한 표현식에서 경계를 명확히 하려고 괄호를 주로 사용하지만 문법의 결정 요소는 쉼표입니다.",
        "한 요소에서 t=(3)이라고 쓰면 단순 int 3입니다. t=(3,) 또는 t=3,처럼 쉼표가 있어야 tuple입니다. 원본은 [3] list, (3) int, (3,) tuple을 type으로 비교합니다. 설정값과 SQL parameter를 한 요소 tuple로 전달할 때 자주 만나는 함정입니다.",
        "빈 tuple은 () 또는 tuple()로 만듭니다. 빈 상태는 falsy지만, 이 세션의 핵심은 truthiness가 아니라 구조와 변경 계약입니다. tuple(iterable)은 iterable 요소를 순서대로 소비해 새 tuple을 만듭니다.",
      ],
      concepts: [
        { term: "튜플 리터럴", definition: "쉼표로 구분한 표현식들을 하나의 tuple로 패킹하는 문법입니다.", detail: ["괄호는 많은 상황에서 선택적입니다.", "한 요소 tuple에는 뒤 쉼표가 필수입니다."] },
        { term: "trailing comma", definition: "마지막 요소 뒤에 두는 쉼표이며 한 요소 tuple에서 구조를 결정합니다.", detail: ["여러 줄 컬렉션 diff를 단순하게 만들기도 합니다.", "함수 인수의 trailing comma와 tuple 패킹은 문맥을 함께 봐야 합니다."] },
      ],
      codeExamples: [
        {
          id: "tuple-construction-observation",
          title: "괄호·쉼표·슬라이스 타입 비교",
          language: "python",
          filename: "tuple_basics.py",
          purpose: "원본 ex08_tuple과 ex01_tuple의 문법·시퀀스 결과를 한 번에 관찰합니다.",
          code: "not_tuple = (3)\none = (3,)\nempty = ()\npacked = 1, 2, 3, 4\nmixed = (1, 'hello', 3.14, True)\n\nfor value in (not_tuple, one, empty, packed):\n    print(repr(value), type(value).__name__)\n\nprint(mixed[1], type(mixed[1]).__name__)\nprint(mixed[1:3], type(mixed[1:3]).__name__)\nprint(packed + (5,))",
          walkthrough: [
            { lines: "1", explanation: "괄호는 숫자 표현식을 묶을 뿐 쉼표가 없어 int입니다." },
            { lines: "2", explanation: "뒤 쉼표가 한 요소 tuple을 만듭니다." },
            { lines: "3-4", explanation: "빈 tuple과 괄호 없이 쉼표로 패킹한 네 요소 tuple입니다." },
            { lines: "5", explanation: "tuple도 서로 다른 타입 객체 참조를 담을 수 있습니다." },
            { lines: "7-8", explanation: "repr과 type으로 모양이 비슷한 값의 실제 타입을 확인합니다." },
            { lines: "10-11", explanation: "단일 인덱싱은 요소 str, 슬라이싱은 tuple을 반환합니다." },
            { lines: "12", explanation: "tuple + tuple이 새 연결 tuple을 만들며 한 요소 쪽에도 쉼표가 필요합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "tuple_basics.py를 저장"], command: "python tuple_basics.py" },
          output: { value: "3 int\n(3,) tuple\n() tuple\n(1, 2, 3, 4) tuple\nhello str\n('hello', 3.14) tuple\n(1, 2, 3, 4, 5)", explanation: ["(3,)의 출력 쉼표가 한 요소 tuple임을 시각적으로 유지합니다.", "슬라이싱은 요소가 두 개든 하나든 tuple입니다.", "연결 결과는 새 tuple이고 packed 원본은 네 요소 그대로입니다."] },
          experiments: [
            { change: "packed + (5,)를 packed + (5)로 바꿉니다.", prediction: "오른쪽이 int라 tuple과 연결할 수 없어 TypeError입니다.", result: "한 요소 쉼표가 연산 타입을 결정함을 확인합니다." },
            { change: "tuple('AB')를 출력합니다.", prediction: "문자열 iterable을 소비해 ('A','B')가 됩니다.", result: "문자열 전체 한 요소가 필요하면 ('AB',)를 써야 합니다." },
          ],
          sourceRefs: ["py-tuple-basic", "py-tuple-sequence", "py-day02-note"],
        },
      ],
      diagnostics: [
        { symptom: "tuple + int TypeError가 발생한다.", likelyCause: "한 요소 tuple을 (7)로 써서 실제로 int를 만들었습니다.", checks: ["repr과 type으로 오른쪽 값을 확인합니다.", "요소 뒤 쉼표가 있는지 봅니다.", "연결 대신 숫자 계산을 의도했는지 구분합니다."], fix: "한 요소 tuple이면 (7,)을 사용합니다.", prevention: "한 요소 컬렉션의 type을 테스트하고 포매터가 유지하는 trailing comma를 사용합니다." },
      ],
    },
    {
      id: "sequence-operations",
      title: "tuple도 인덱싱·슬라이싱·연결·membership을 지원합니다",
      lead: "읽기 시퀀스 연산은 list와 비슷하지만 요소 추가·삭제·대입 메서드는 제공하지 않습니다.",
      explanations: [
        "t=(1,2,'a','b')에서 t[0]은 int 1, t[2]는 str 'a'입니다. t[:2]는 (1,2), t[1:3]은 (2,'a')인 새 tuple입니다. 범위와 음수 인덱스 규칙은 다른 시퀀스와 같습니다.",
        "t+(7,)과 t*2는 새 tuple을 만듭니다. 기존 tuple에 append한 것이 아니며 이름에 결과를 다시 받으면 재바인딩입니다. 반복도 내부 mutable 요소를 깊게 복제하지 않습니다.",
        "value in t는 직접 요소의 동등성을 순차 검사합니다. 고정 소수 항목에는 충분하지만 빠른 대규모 membership이 목적이면 set이 적합할 수 있습니다. tuple의 핵심 선택 이유는 보통 순서 고정과 구조 의도입니다.",
      ],
      concepts: [
        { term: "불변 시퀀스", definition: "순서 읽기 연산은 제공하지만 같은 객체의 요소 참조를 추가·삭제·교체할 수 없는 시퀀스입니다.", detail: ["str과 tuple이 대표적입니다.", "연결·슬라이스는 새 객체 결과를 만듭니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
    },
    {
      id: "immutability-depth",
      title: "튜플은 참조 묶음이 불변이지 내부 객체가 모두 불변인 것은 아닙니다",
      lead: "tuple 안 list의 내용을 바꿀 수 있습니다. tuple 칸이 같은 list를 계속 가리키므로 튜플의 요소 참조 자체는 바뀌지 않았습니다.",
      explanations: [
        "t=(1,[2,3])에서 t[0]=9는 TypeError지만 t[1].append(4)는 성공해 t가 (1,[2,3,4])처럼 보입니다. tuple이 list를 가리키는 두 번째 참조는 그대로이고, 그 list 내부 상태가 바뀐 것입니다.",
        "따라서 tuple을 썼다고 깊은 불변 데이터가 자동 보장되지 않습니다. 설정 스냅샷·캐시 key처럼 완전 불변이 필요하면 내부도 tuple·frozenset·불변 도메인 객체로 구성합니다.",
        "tuple 자체가 hash 가능한지는 모든 요소가 hash 가능한지에 달려 있습니다. (1,2)는 dict key가 될 수 있지만 (1,[2])는 list가 unhashable이라 key로 쓸 수 없습니다. hash 사용 중 값이 바뀌면 lookup 규칙이 깨지기 때문에 mutable 요소를 막습니다.",
      ],
      concepts: [
        { term: "얕은 불변성", definition: "컨테이너의 요소 참조는 바꿀 수 없지만 참조 대상 객체의 내부 변경 가능성은 별도인 상태입니다.", detail: ["tuple 안 mutable 객체는 변경될 수 있습니다.", "깊은 불변이 필요하면 전체 객체 그래프를 검토합니다."] },
        { term: "hashable", definition: "수명 동안 안정적인 hash와 equality 계약을 제공해 dict key·set 요소로 사용할 수 있는 성질입니다.", detail: ["모든 요소가 hashable인 tuple은 보통 hashable입니다.", "list를 포함하면 tuple도 hash할 수 없습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "TypeError: 'tuple' object does not support item assignment가 발생한다.", likelyCause: "tuple 위치에 새 값을 직접 대입했습니다.", checks: ["변경이 정말 필요한 데이터인지 확인합니다.", "새 tuple 재구성이 적절한지 list가 더 맞는지 판단합니다.", "내부 mutable 요소 변경과 tuple 칸 변경을 구분합니다."], fix: "새 tuple을 슬라이스·연결로 만들거나 편집 단계에서 list를 사용한 뒤 tuple로 고정합니다.", prevention: "함수 입력·출력에서 가변 편집 단계와 불변 공개 단계를 구분합니다." },
        { symptom: "TypeError: unhashable type: 'list'가 tuple을 dict key로 쓸 때 발생한다.", likelyCause: "tuple 내부에 list처럼 hash 불가능한 요소가 있습니다.", checks: ["tuple 각 요소 type과 중첩 구조를 확인합니다.", "key에 mutable 데이터가 꼭 필요한지 검토합니다.", "깊은 불변 표현이 가능한지 확인합니다."], fix: "내부 list를 의미에 맞게 tuple 또는 frozenset으로 변환하거나 별도 불변 식별자를 key로 사용합니다.", prevention: "key 타입을 명시하고 hash(key) 경계 테스트를 둡니다." },
      ],
      expertNotes: ["불변 구조는 동시성·캐시 reasoning을 단순화하지만 내부에 mutable 객체를 숨기면 보장이 약해집니다."],
    },
    {
      id: "packing-unpacking",
      title: "패킹은 여러 값을 하나로, 언패킹은 구조에 맞춰 이름으로 나눕니다",
      lead: "point=10,20은 tuple 패킹이고 x,y=point는 두 요소를 두 이름에 언패킹합니다.",
      explanations: [
        "언패킹 왼쪽 이름 수와 오른쪽 요소 수가 같아야 합니다. 너무 많으면 too many values to unpack, 너무 적으면 not enough values to unpack ValueError입니다. 오류는 데이터 구조 계약이 호출자 기대와 달라졌다는 신호입니다.",
        "first,*middle,last=values처럼 별표 이름 하나가 남은 요소를 list로 받습니다. middle은 원본이 tuple이어도 list입니다. *rest,=values는 모든 요소를 list에 받는 문법이고 별표 대상은 한 언패킹 패턴에 하나만 둘 수 있습니다.",
        "중첩 구조도 (name,(x,y))=record처럼 모양을 맞춰 분해할 수 있습니다. 데이터가 불규칙하면 복잡한 패턴 언패킹보다 길이·타입 검증과 명시 인덱싱이 오류 메시지를 더 잘 제공할 수 있습니다.",
      ],
      concepts: [
        { term: "패킹", definition: "여러 표현식 결과를 하나의 tuple 값으로 묶는 과정입니다.", detail: ["쉼표 문법이 tuple을 만듭니다.", "함수 return a,b도 하나의 tuple 반환으로 이해할 수 있습니다."] },
        { term: "언패킹", definition: "iterable 요소를 왼쪽의 이름·중첩 패턴에 대응시켜 바인딩하는 과정입니다.", detail: ["고정 패턴은 요소 수가 맞아야 합니다.", "별표 대상은 남은 요소를 list로 수집합니다."] },
      ],
      codeExamples: [
        {
          id: "tuple-unpacking-workflow",
          title: "고정·별표·중첩 언패킹과 교환",
          language: "python",
          filename: "tuple_unpacking.py",
          purpose: "tuple의 구조를 이름으로 분해하고 여러 반환값과 swap이 패킹·언패킹이라는 사실을 확인합니다.",
          code: "point = (10, 20)\nx, y = point\nprint(x, y)\n\nvalues = (1, 2, 3, 4, 5)\nfirst, *middle, last = values\nprint(first, middle, last, type(middle).__name__)\n\nrecord = ('Python', (17, 40))\nname, (done, total) = record\nprint(name, done / total)\n\nleft, right = 'L', 'R'\nleft, right = right, left\nprint(left, right)",
          walkthrough: [
            { lines: "1-3", explanation: "두 요소 tuple을 x와 y 두 이름에 정확히 대응합니다." },
            { lines: "5-7", explanation: "첫·마지막을 고정하고 중간 세 요소를 list middle로 수집합니다." },
            { lines: "9-11", explanation: "바깥 tuple과 안쪽 진도 tuple 모양을 한 패턴으로 분해합니다." },
            { lines: "13-15", explanation: "오른쪽에서 ('R','L')을 먼저 패킹한 뒤 왼쪽 두 이름에 언패킹해 임시 변수 없이 교환합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "tuple_unpacking.py를 저장"], command: "python tuple_unpacking.py" },
          output: { value: "10 20\n1 [2, 3, 4] 5 list\nPython 0.425\nR L", explanation: ["별표 수집 결과가 tuple이 아닌 list입니다.", "중첩 패턴이 record 구조와 정확히 맞습니다.", "swap은 두 대입을 순서대로 한 것이 아니라 오른쪽 전체 평가 후 언패킹합니다."] },
          experiments: [
            { change: "x,y=point를 x,y,z=point로 바꿉니다.", prediction: "두 요소를 세 이름에 넣을 수 없어 ValueError입니다.", result: "not enough values to unpack 메시지가 요소 계약 불일치를 드러냅니다." },
            { change: "first,*middle,last를 first,*middle로 줄입니다.", prediction: "first=1, middle=[2,3,4,5]가 됩니다.", result: "별표 위치에 따라 고정·수집 범위가 달라집니다." },
          ],
          sourceRefs: ["py-tuple-basic", "py-tuple-sequence", "py-day02-note"],
        },
      ],
      diagnostics: [
        { symptom: "ValueError: too many/not enough values to unpack가 발생한다.", likelyCause: "왼쪽 고정 이름 수와 오른쪽 iterable 요소 수가 맞지 않습니다.", checks: ["오른쪽 repr·type·len을 확인합니다.", "API 반환 구조가 버전·조건에 따라 달라졌는지 봅니다.", "가변 나머지를 허용할지 별표 패턴을 검토합니다."], fix: "정확한 구조 계약으로 이름 수를 맞추거나 의도한 위치에 *rest를 사용하고 길이를 검증합니다.", prevention: "빈·최소·초과 요소 입력과 API 반환 구조 테스트를 둡니다." },
      ],
    },
    {
      id: "multiple-return-values",
      title: "함수의 여러 반환값은 하나의 tuple로 돌아옵니다",
      lead: "return quotient,remainder는 두 값을 따로 순간 이동시키는 것이 아니라 tuple을 만들고 호출자가 선택적으로 언패킹합니다.",
      explanations: [
        "divmod처럼 함수가 관련 값 여러 개를 돌려줄 때 tuple이 자연스럽습니다. result=function()으로 전체 tuple을 보존하거나 a,b=function()으로 바로 언패킹할 수 있습니다. 함수 반환 구조는 공개 API 계약이므로 요소를 추가하면 기존 고정 언패킹 호출자가 깨질 수 있습니다.",
        "위치만으로 의미를 기억해야 하는 반환값이 많아지면 NamedTuple, dataclass 또는 dict가 더 명확합니다. (status,data,error,metadata)에서 순서를 잘못 받을 위험보다 result.status처럼 이름 있는 필드가 안전합니다.",
        "일부 값을 무시할 때 underscore 이름을 관례적으로 사용하지만 실제로는 정상 변수입니다. 반복 REPL에서는 _가 특별 의미를 가질 수 있고, 여러 무시 값이 필요하면 *_로 수집해 의도를 표시할 수 있습니다.",
      ],
      concepts: [
        { term: "반환 구조 계약", definition: "함수가 반환하는 타입, 요소 개수·순서·의미를 호출자와 약속한 인터페이스입니다.", detail: ["고정 tuple 반환 변경은 호출자 언패킹을 깨뜨릴 수 있습니다.", "요소가 많거나 진화 가능하면 이름 있는 결과 타입을 고려합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
    },
    {
      id: "conversion-and-editing",
      title: "편집 때문에 list로 바꿀 때는 새 객체와 공유 요소를 추적합니다",
      lead: "list(tup)로 편집하고 tuple(list_value)로 고정하는 흐름은 바깥 컨테이너를 새로 만들지만 중첩 요소를 깊게 복사하지 않습니다.",
      explanations: [
        "원본은 tup=(1,2,3,4,5)를 list로 바꿔 append·insert 후 tuple로 되돌립니다. 각 변환은 새 바깥 컨테이너를 만듭니다. 불변 숫자만 있으면 완전 독립처럼 보이지만 내부 list·dict는 양쪽이 같은 객체를 참조할 수 있습니다.",
        "한 요소를 바꾸기 위해 전체 tuple→list→tuple을 반복하면 데이터 모델이 실제로 가변인지 질문해야 합니다. 자주 편집하면 작업 중 list를 유지하고 공개·캐시 경계에서 tuple로 변환하는 편이 낫습니다.",
        "tuple 연결을 반복해 큰 tuple을 조금씩 키우면 매번 새 tuple 복사 비용이 발생합니다. 요소를 list에 모은 뒤 마지막에 tuple로 고정하거나 generator에서 한 번 생성합니다.",
      ],
      concepts: [
        { term: "편집 단계와 고정 단계", definition: "데이터를 구성·변경하는 동안 가변 구조를 쓰고 외부 공개·키 사용 시 불변 구조로 전환하는 설계입니다.", detail: ["불필요한 반복 복사를 줄일 수 있습니다.", "고정 이후 변경을 막는 의도를 타입으로 드러냅니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: ["대규모 tuple을 반복 +로 누적하지 말고 list append 후 한 번 tuple로 변환해 비용을 측정합니다."],
    },
    {
      id: "modeling-choice",
      title: "고정 순서라는 의미가 있을 때 tuple을 선택합니다",
      lead: "tuple은 단순히 ‘수정 못 하는 list’가 아니라 좌표·RGB·고정 반환 구조처럼 위치와 개수가 계약인 값을 표현합니다.",
      explanations: [
        "좌표 (x,y), dict.items의 (key,value), 색상 (r,g,b)처럼 요소 수와 위치가 안정적이면 tuple과 언패킹이 읽기 좋습니다. 사용자 작업 목록처럼 항목 추가·삭제가 자연스러우면 list가 맞습니다.",
        "('홍길동',24,178.4)처럼 서로 다른 필드가 세 개 이상이면 순서를 기억하기 어렵습니다. NamedTuple은 tuple 호환성과 필드 이름, dataclass는 타입·기본값·메서드와 선택적 가변성을 제공합니다. 공개 API의 진화 가능성도 고려합니다.",
        "보안상 불변 컨테이너만으로 입력 신뢰가 생기지는 않습니다. 요소 타입·범위·길이를 검증하고 중첩 mutable 객체를 제한합니다. 외부 tuple처럼 보이는 JSON 배열은 실제로 list로 파싱되며 계약 변환이 필요합니다.",
        "함수 매개변수에 Sequence를 받으면 list·tuple 모두 읽기 전용 관점으로 사용할 수 있습니다. 실제로 변경할 필요가 있을 때만 list 구체 타입을 요구해 인터페이스를 좁힙니다.",
      ],
      concepts: [
        { term: "구조적 의미", definition: "요소 개수·순서·각 위치 역할이 데이터 계약의 일부인 특성입니다.", detail: ["tuple과 언패킹이 구조를 표현합니다.", "위치 의미가 복잡하면 이름 있는 레코드 타입이 더 낫습니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "어떤 레코드 표현을 선택할까요?", options: [
          { name: "tuple", chooseWhen: "요소가 적고 순서 의미가 널리 알려졌으며 불변·언패킹이 유용할 때", avoidWhen: "필드가 많거나 선택 필드·버전 확장이 잦을 때", tradeoffs: ["가볍고 hash 가능할 수 있습니다.", "위치 의미를 기억해야 합니다.", "기존 언패킹과 호환성 관리가 필요합니다."] },
          { name: "dataclass", chooseWhen: "필드 이름·타입·기본값·메서드와 진화 가능한 도메인 모델이 필요할 때", avoidWhen: "단순 두 값 내부 반환에 과도한 구조일 때", tradeoffs: ["자기 설명적입니다.", "불변 frozen 설정도 가능합니다.", "직렬화와 equality 정책을 설계해야 합니다."] },
        ] },
      ],
      expertNotes: ["public API에 tuple 위치를 추가하면 고정 언패킹 호출자가 실패합니다. 이름 있는 결과 객체와 버전 전략을 검토합니다.", "tuple이 hashable해도 내부 객체의 equality·hash 구현이 안정적이어야 캐시 key로 안전합니다."],
    },
  ],
  lab: {
    title: "학습 진도 스냅샷과 결과 구조",
    scenario: "과정명·완료·전체를 고정 tuple로 만들고 언패킹·검증·함수 반환·이름 있는 모델 전환을 비교합니다.",
    setup: ["tuple_progress_lab.py를 만듭니다.", "('Python',17,40)과 잘못된 길이·타입 입력을 준비합니다.", "Python 3.11 이상에서 실행합니다."],
    steps: ["name,done,total로 언패킹하고 total>0·0<=done<=total을 검증합니다.", "progress 함수를 만들어 rate와 remaining을 tuple로 반환합니다.", "rate,remaining과 전체 result 두 방식으로 받습니다.", "name,*counts 패턴의 counts 타입을 확인합니다.", "tuple을 list로 바꿔 done을 수정하고 새 tuple로 고정하며 원본을 비교합니다.", "필드를 하나 추가했을 때 고정 언패킹 호출자가 어떻게 깨지는지 재현합니다.", "동일 데이터를 frozen dataclass로 표현해 가독성을 비교합니다."],
    expectedResult: ["패킹·고정·별표 언패킹의 결과와 타입을 예측합니다.", "여러 반환값이 tuple이라는 사실을 확인합니다.", "원본 tuple은 편집 변환 뒤에도 그대로입니다.", "API 진화에서 위치 tuple의 trade-off를 설명합니다."],
    cleanup: ["합성 학습 데이터만 사용합니다."],
    extensions: ["tuple을 dict key로 써 진도 캐시를 만들고 내부 list 포함 실패를 재현합니다.", "NamedTuple과 frozen dataclass를 비교합니다.", "Sequence 타입 힌트로 list·tuple 입력을 모두 받는 읽기 함수를 만듭니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "빈·한 요소·여러 요소 tuple을 만들고 타입을 출력하세요.", requirements: ["(), (3), (3,), 괄호 없는 패킹을 비교합니다.", "인덱싱과 한 요소 슬라이스 타입을 확인합니다.", "한 요소 연결의 잘못된·올바른 예를 실행합니다."], hints: ["tuple을 만드는 핵심은 쉼표입니다.", "오류 예제는 try/except 또는 별도 실행으로 관찰합니다."], expectedOutcome: "괄호와 쉼표 역할을 실행 결과로 정확히 설명합니다.", solutionOutline: ["네 값을 서로 다른 이름에 둡니다.", "repr과 type을 나란히 출력합니다.", "(7)과 (7,) 연결을 비교합니다."] },
    { difficulty: "응용", prompt: "가변 길이 로그 레코드를 별표 언패킹하세요.", requirements: ["timestamp, level, *messages 패턴을 사용합니다.", "최소 길이와 빈 messages를 검증합니다.", "요소 부족·초과 고정 언패킹 오류를 비교합니다.", "messages가 list인 이유를 설명합니다."], hints: ["별표는 남은 요소를 list로 수집합니다.", "언패킹 전 len 검증이 더 좋은 오류를 줄 수 있습니다."], expectedOutcome: "가변 나머지를 받으면서 고정 필드 계약을 보존합니다." },
    { difficulty: "설계", prompt: "지도 좌표 API의 반환 모델을 설계하세요.", requirements: ["(lat,lon), NamedTuple, frozen dataclass 세 대안을 비교합니다.", "고도·정확도 필드가 나중에 추가되는 버전 전략을 정합니다.", "범위 검증과 JSON 배열/객체 직렬화를 명시합니다.", "hash key·불변성·가독성 테스트를 포함합니다."], hints: ["tuple 필드 추가는 기존 두 이름 언패킹을 깨뜨립니다.", "외부 JSON은 tuple 타입을 직접 보존하지 않습니다."], expectedOutcome: "짧은 tuple 문법을 진화 가능한 공개 데이터 계약으로 확장한 설계가 완성됩니다." },
  ],
  reviewQuestions: [
    { question: "(3)과 (3,)의 타입은 왜 다른가요?", answer: "괄호가 아니라 쉼표가 tuple 패킹을 만들기 때문에 전자는 int, 후자는 한 요소 tuple입니다." },
    { question: "tuple 슬라이스의 반환 타입은 무엇인가요?", answer: "선택 요소가 하나여도 새 tuple입니다. 단일 인덱싱은 요소 타입입니다." },
    { question: "tuple 안 list를 append할 수 있는 이유는 무엇인가요?", answer: "tuple의 list 참조는 바뀌지 않고 그 mutable list 내부 상태만 바뀌기 때문입니다." },
    { question: "first,*middle,last에서 middle 타입은 무엇인가요?", answer: "남은 요소를 수집한 list입니다. 원본이 tuple이어도 list입니다." },
    { question: "return a,b는 실제로 무엇을 반환하나요?", answer: "a와 b를 패킹한 하나의 tuple을 반환하며 호출자가 두 이름으로 언패킹할 수 있습니다." },
    { question: "모든 tuple을 dict key로 쓸 수 있나요?", answer: "아닙니다. 내부 모든 요소가 hashable이어야 하며 list를 포함하면 쓸 수 없습니다." },
    { question: "필드가 많은 레코드에 dataclass가 나을 수 있는 이유는 무엇인가요?", answer: "위치 대신 필드 이름·타입·기본값을 제공하고 API 진화를 더 명확하게 관리할 수 있기 때문입니다." },
  ],
  completionChecklist: [
    "빈·한 요소·여러 요소 tuple 문법을 정확히 작성할 수 있다.",
    "tuple 인덱싱·슬라이싱·연결 결과 타입을 예측할 수 있다.",
    "tuple의 얕은 불변성과 내부 mutable 요소를 구분할 수 있다.",
    "고정·중첩·별표 언패킹과 요소 수 오류를 진단할 수 있다.",
    "여러 반환값과 swap을 패킹·언패킹으로 설명할 수 있다.",
    "list↔tuple 변환의 바깥 복사와 내부 공유를 추적할 수 있다.",
    "tuple·NamedTuple·dataclass를 구조와 진화 요구로 비교할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-tuple-basic", repository: "PYTHON-BASIC", path: "day02/ex08_tuple.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day02/ex08_tuple.py", usedFor: ["튜플 특징", "(3,) 함정", "괄호 생략", "연결", "list 왕복"], evidence: "Python 3.13.9에서 원본을 실행해 int 3·tuple (3,), 빈 tuple, 연결 1~10과 list 왕복 결과를 확인했습니다." },
    { id: "py-tuple-sequence", repository: "PYTHON-BASIC", path: "day03/ex01_tuple.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day03/ex01_tuple.py", usedFor: ["인덱싱·슬라이싱", "한 요소 연결", "불변 연산", "편집 변환"], evidence: "원본 실행에서 요소 int/str, 세 tuple 슬라이스, (7,)·(9,11) 연결과 최종 편집 tuple을 확인했습니다." },
    { id: "py-day02-note", repository: "PYTHON-BASIC", path: "notes/day02_string_list_tuple.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day02_string_list_tuple.md", usedFor: ["tuple 문법", "불변성", "list 변환", "셀프 체크"], evidence: "원본 노트를 기준으로 패킹·언패킹·hash·API 모델링을 심화 보강했습니다." },
  ],
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["함수 인수·반환의 상세 계약은 py-021~022에서 확장합니다.", "NamedTuple·dataclass·hash 안정성은 원본 공백을 전문가 관점으로 보강했습니다."] },
} satisfies DetailedSession;

export default session;
