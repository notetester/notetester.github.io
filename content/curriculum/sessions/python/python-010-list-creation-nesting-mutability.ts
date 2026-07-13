import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-010"],
  slug: "python-010-list-creation-nesting-mutability",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 10,
  title: "리스트 생성·중첩·가변성",
  subtitle: "여러 값을 순서대로 보관하고, 인덱싱·슬라이싱·연결·반복·포함 검사를 수행하며 공유 참조의 변경까지 추적합니다.",
  level: "기초",
  estimatedMinutes: 110,
  coreQuestion: "리스트의 요소와 리스트 객체 자체가 어떻게 연결되어 있으며, 한 곳의 변경이 어디까지 보이는지 어떻게 예측할까요?",
  summary: "list의 순서·가변성, 단일 인덱싱과 슬라이싱의 반환 타입, 혼합 타입과 중첩 접근, +·*·in 연산을 실제 출력으로 확인합니다. 특히 대입은 복사가 아니라 같은 리스트를 공유할 수 있고, 중첩 리스트 반복이 같은 내부 객체를 재사용하는 함정을 객체 그래프로 설명합니다.",
  objectives: [
    "리스트 리터럴을 만들고 순서·중복·가변성 특성을 설명할 수 있다.",
    "인덱싱 결과는 요소 타입, 슬라이싱 결과는 새 list라는 차이를 예측할 수 있다.",
    "중첩 리스트의 다단계 인덱스를 왼쪽부터 추적할 수 있다.",
    "이름 대입, 얕은 복사, 중첩 객체 공유를 구분할 수 있다.",
    "+·*·in·not in 연산의 결과와 비용·함정을 설명할 수 있다.",
    "동질 데이터에는 list, 고정 필드 레코드에는 dataclass 같은 더 명확한 모델을 선택할 수 있다.",
  ],
  prerequisites: [
    { title: "문자열 인덱싱과 슬라이싱", reason: "list도 같은 시퀀스 위치·반열린 범위 규칙을 사용하지만 가변성은 다릅니다.", sessionSlug: "python-008-string-indexing-slicing" },
    { title: "변수와 동적 타입", reason: "두 이름이 같은 mutable 객체를 가리키는 공유 참조를 이해하는 데 필요합니다.", sessionSlug: "python-002-variables-dynamic-types" },
  ],
  keywords: ["Python", "list", "mutable", "중첩 리스트", "alias", "얕은 복사", "인덱싱", "슬라이싱", "membership"],
  chapters: [
    {
      id: "list-model",
      title: "리스트는 순서 있는 가변 참조 모음입니다",
      lead: "[1, 3, 5]는 세 int 객체 자체를 한 덩어리로 융합한 값이 아니라, 순서대로 각 객체를 참조하는 list 객체입니다.",
      explanations: [
        "대괄호 안 항목을 쉼표로 나열하면 list를 만듭니다. 순서가 있고 같은 값을 여러 번 둘 수 있으며 길이와 요소를 실행 중 바꿀 수 있습니다. len으로 요소 수를 구하고 0부터 시작하는 인덱스로 접근합니다.",
        "Python list에는 서로 다른 타입을 함께 넣을 수 있습니다. 원본 person = ['홍길동', 24, 178.45, 'A', True]는 문법적으로 정상입니다. 그러나 각 위치의 의미를 번호로 기억해야 하는 레코드는 person[2]가 무엇인지 읽기 어렵고 순서 실수에 취약합니다. 짧은 학습 예제와 달리 제품 코드에서는 dataclass·dict·도메인 클래스를 검토합니다.",
        "리스트가 가변이라는 말은 이름을 다른 객체로 재바인딩하는 것과 다릅니다. items[0] = value는 같은 list 객체의 요소 참조를 바꾸고, items = other는 이름이 다른 객체를 가리키게 합니다. 공유하는 다른 이름에 변화가 보이는지는 이 차이에 달려 있습니다.",
      ],
      concepts: [
        { term: "가변 객체(mutable object)", definition: "생성된 뒤에도 동일한 객체의 내부 상태를 바꿀 수 있는 객체입니다.", detail: ["list는 요소 대입·추가·삭제가 가능합니다.", "같은 list를 여러 이름이 공유하면 한 이름을 통한 내부 변경이 다른 이름에서도 보입니다."], analogy: "여러 사람이 같은 화이트보드를 가리키는 명찰을 가진 상황과 같습니다. 한 사람이 보드 내용을 고치면 모두가 바뀐 보드를 봅니다." },
        { term: "요소 참조", definition: "리스트의 각 칸이 현재 어떤 Python 객체를 가리키는지 나타내는 연결입니다.", detail: ["요소마다 서로 다른 타입 객체를 참조할 수 있습니다.", "중첩 list의 한 요소는 또 다른 list 객체를 가리킵니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
    },
    {
      id: "index-slice-types",
      title: "인덱싱은 요소 하나, 슬라이싱은 리스트를 반환합니다",
      lead: "items[3]의 타입은 그 위치 요소의 타입이고, items[1:3]은 선택 요소가 하나여도 항상 list입니다.",
      explanations: [
        "odd=[1,3,5,7,9]에서 odd[3]은 int 7입니다. person[3]은 str 'A'입니다. list 인덱싱의 반환 타입을 list라고 고정해서 생각하면 다음 메서드 호출과 계산에서 오류가 납니다. 실제 요소 타입을 추적하세요.",
        "odd[:3]은 [1,3,5], odd[-3:-2]는 요소 하나를 담은 [5]입니다. 슬라이싱은 list 컨테이너를 반환하므로 odd[-3]의 5와 구분됩니다. 경계 밖 슬라이스는 보정되지만 단일 인덱스 범위 초과는 IndexError입니다.",
        "일반 슬라이스는 새 바깥 list를 만듭니다. 그러나 요소 객체는 그대로 참조하는 얕은 복사입니다. 숫자·문자열처럼 불변 요소에서는 독립처럼 보이지만 내부에 list나 dict가 있으면 그 중첩 객체를 원본과 공유할 수 있습니다.",
      ],
      concepts: [
        { term: "얕은 복사(shallow copy)", definition: "새 바깥 컨테이너를 만들되 내부 요소 객체 참조는 재사용하는 복사입니다.", detail: ["items[:]와 list(items), items.copy()가 대표적입니다.", "중첩 mutable 요소를 바꾸면 원본과 복사본 양쪽에서 변화가 보일 수 있습니다."], caveat: "새 list라는 사실이 내부 객체까지 모두 독립이라는 뜻은 아닙니다." },
      ],
      codeExamples: [
        {
          id: "list-index-slice-nesting",
          title: "요소 타입과 중첩 접근을 단계별로 확인",
          language: "python",
          filename: "list_shapes.py",
          purpose: "원본 ex04_list.py의 홀수·사람·중첩 리스트를 작은 관찰 코드로 재구성합니다.",
          code: "odd = [1, 3, 5, 7, 9]\nperson = ['홍길동', 24, 178.45, 'A', True]\neven = [2, 4, odd, 6, 8, 10]\n\nprint(odd[3], type(odd[3]).__name__)\nprint(odd[-3:-2], type(odd[-3:-2]).__name__)\nprint(even[2], type(even[2]).__name__)\nprint(even[2][3])\nprint(person[0][1], type(person[0][1]).__name__)",
          walkthrough: [
            { lines: "1-2", explanation: "동질 int list와 서로 다른 역할·타입을 위치로 표현한 list를 만듭니다." },
            { lines: "3", explanation: "even의 인덱스 2가 기존 odd list 객체를 참조합니다. 숫자 5개를 복사해 펼친 것이 아닙니다." },
            { lines: "5", explanation: "단일 인덱스 결과는 요소 int 7입니다." },
            { lines: "6", explanation: "한 요소 범위 슬라이스 결과는 list [5]입니다." },
            { lines: "7-8", explanation: "even[2]로 안쪽 odd list를 얻고, 이어 [3]으로 그 list의 int 7을 읽습니다." },
            { lines: "9", explanation: "person[0]은 str '홍길동'이고 그 문자열 [1]이 str '길'을 반환합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "list_shapes.py를 저장"], command: "python list_shapes.py" },
          output: { value: "7 int\n[5] list\n[1, 3, 5, 7, 9] list\n7\n길 str", explanation: ["같은 [] 문법도 현재 객체가 list인지 str인지에 따라 다음 선택 대상이 달라집니다.", "중첩 접근은 even[2]와 그 결과 [3]을 나누어 추적하면 됩니다.", "슬라이스 결과 [5]와 인덱스 결과 5의 컨테이너 차이가 드러납니다."] },
          experiments: [
            { change: "print(even[2][10])을 추가합니다.", prediction: "바깥 인덱스 2는 성공하지만 안쪽 odd의 10이 범위 밖이라 IndexError입니다.", result: "traceback 위치에서 어느 단계 인덱스가 실패했는지 분리해야 합니다." },
            { change: "one = odd[-3:-2] 뒤 one[0]=500을 실행합니다.", prediction: "one은 새 바깥 list라 one만 [500]이고 odd는 그대로입니다.", result: "불변 int 요소를 가진 얕은 슬라이스의 바깥 독립성을 확인합니다." },
          ],
          sourceRefs: ["py-list-basic", "py-day02-note"],
        },
      ],
      diagnostics: [
        { symptom: "IndexError: list index out of range가 발생한다.", likelyCause: "단일 인덱스가 -len 이상 len 미만 범위를 벗어났거나 중첩 단계 중 안쪽 list가 예상보다 짧습니다.", checks: ["각 단계 객체를 나누어 repr과 len으로 출력합니다.", "빈 list와 마지막 유효 위치를 확인합니다.", "필터링·삭제 후 길이가 바뀐 경로를 추적합니다."], fix: "입력 구조를 검증하고 유효 범위에서 접근합니다. 단순히 예외를 무시해 누락 데이터를 숨기지 않습니다.", prevention: "빈 list, 길이 1, 마지막, 범위 밖과 불규칙 중첩 길이를 테스트합니다." },
      ],
    },
    {
      id: "nested-reference-graph",
      title: "중첩 리스트는 객체 그래프로 그려야 합니다",
      lead: "even=[2,4,odd,6]에서 even의 한 칸과 odd 이름은 동일한 내부 list 객체를 가리킵니다.",
      explanations: [
        "odd.append(11)을 실행하면 even[2]에서도 11이 보입니다. odd와 even[2]가 복제된 두 값이 아니라 같은 객체 참조이기 때문입니다. 반대로 odd = [100]으로 이름을 재바인딩하면 기존 even[2]는 원래 list를 계속 가리킵니다.",
        "중첩 데이터를 디버깅할 때 이름과 객체를 상자로만 그리지 말고 화살표로 표시하세요. outer → inner, alias → inner처럼 같은 도착점을 가지면 내부 변경이 공유됩니다. is 비교로 두 경로가 같은 객체인지 확인할 수 있지만 제품 로직을 id 값에 의존시키지는 않습니다.",
        "행마다 독립 list가 필요한 표를 [[0]*3]*2로 만들면 두 행이 같은 내부 list를 참조합니다. grid[0][0]=1이 두 행에 반영됩니다. [[0]*3 for _ in range(2)]처럼 매 반복 새 내부 list를 만들어야 합니다.",
      ],
      concepts: [
        { term: "alias", definition: "둘 이상의 이름·경로가 같은 객체를 가리키는 상태입니다.", detail: ["alias 자체는 오류가 아니며 공유 변경이 의도인지가 중요합니다.", "mutable 객체에서는 변경의 관찰 범위를 문서화해야 합니다."] },
        { term: "객체 그래프", definition: "이름·컨테이너·객체 사이 참조를 노드와 화살표로 표현한 정신 모델입니다.", detail: ["중첩·순환·공유 구조를 값 문자열보다 정확히 설명합니다.", "얕은 복사와 깊은 복사의 차이를 그래프로 볼 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "list-alias-repetition-trap",
          title: "공유 참조와 반복 중첩 리스트 함정 재현",
          language: "python",
          filename: "list_aliases.py",
          purpose: "대입·중첩·* 반복이 언제 같은 내부 list를 재사용하는지 실행 결과로 확인합니다.",
          code: "inner = [1, 3, 5]\nouter = ['start', inner, 'end']\nalias = inner\n\ninner.append(7)\nprint(outer)\nprint(alias is outer[1])\n\ninner = [100]\nprint(inner)\nprint(outer)\n\nbad_grid = [[0] * 3] * 2\nbad_grid[0][0] = 9\nprint(bad_grid)\n\ngood_grid = [[0] * 3 for _ in range(2)]\ngood_grid[0][0] = 9\nprint(good_grid)",
          walkthrough: [
            { lines: "1-3", explanation: "outer[1]과 alias가 모두 처음 inner list 객체를 가리킵니다." },
            { lines: "5-7", explanation: "같은 객체에 7을 추가하므로 outer를 통해서도 보이고 is 결과가 True입니다." },
            { lines: "9-11", explanation: "inner 이름만 새 [100]으로 재바인딩합니다. outer는 원래 [1,3,5,7]을 계속 가리킵니다." },
            { lines: "13-15", explanation: "* 2가 내부 [0,0,0] 참조를 두 번 복제해 한 행 변경이 두 행에 보입니다." },
            { lines: "17-19", explanation: "컴프리헨션이 반복마다 새 내부 list를 만들어 첫 행만 바뀝니다." },
          ],
          run: { environment: ["Python 3.11 이상", "list_aliases.py를 저장"], command: "python list_aliases.py" },
          output: { value: "['start', [1, 3, 5, 7], 'end']\nTrue\n[100]\n['start', [1, 3, 5, 7], 'end']\n[[9, 0, 0], [9, 0, 0]]\n[[9, 0, 0], [0, 0, 0]]", explanation: ["append는 공유 객체를 변경하고 재바인딩은 inner 이름의 화살표만 바꿉니다.", "bad_grid 두 행의 값이 동시에 바뀌어 같은 내부 객체를 공유함을 증명합니다.", "good_grid는 행별 독립 객체라 첫 행만 변경됩니다."] },
          experiments: [
            { change: "outer_copy = outer[:]를 만든 뒤 outer_copy[1].append(9)를 실행합니다.", prediction: "바깥 list는 새 객체지만 안쪽 list를 공유해 outer에도 9가 보입니다.", result: "얕은 복사가 중첩 mutable 객체까지 복제하지 않음을 확인합니다." },
            { change: "alias = inner 대신 alias = inner.copy()를 사용합니다.", prediction: "불변 int 요소만 있는 현재 예제에서는 alias.append가 원본에 보이지 않습니다.", result: "바깥 list 독립성과 내부 요소 공유를 구분하게 됩니다." },
          ],
          sourceRefs: ["py-list-basic", "py-list-operators", "py-day02-note"],
        },
      ],
      diagnostics: [
        { symptom: "2차원 리스트의 한 셀을 바꿨는데 여러 행이 동시에 바뀐다.", likelyCause: "[[value]*cols]*rows가 같은 내부 list 참조를 반복했습니다.", checks: ["grid[0] is grid[1]을 확인합니다.", "생성식에 *가 중첩 list 바깥에서 사용됐는지 봅니다.", "얕은 복사 이후에도 내부 행을 공유하는지 확인합니다."], fix: "[[value for _ in range(cols)] for _ in range(rows)]처럼 행마다 새 list를 만듭니다.", prevention: "첫·마지막 행을 각각 수정하는 독립성 테스트를 둡니다." },
      ],
      expertNotes: ["copy.deepcopy는 모든 상황의 자동 정답이 아닙니다. 큰 그래프 비용, 외부 자원, 사용자 정의 복사 규칙과 의도한 공유를 검토합니다."],
    },
    {
      id: "concatenate-repeat",
      title: "+는 새 연결 리스트, *는 요소 참조 반복을 만듭니다",
      lead: "[1,2,3]+[4,5,6]은 순서를 보존한 새 list이고, [1,2,3]*3은 요소 참조 시퀀스를 세 번 반복합니다.",
      explanations: [
        "+는 양쪽 list를 연결한 새 list를 만듭니다. 순서는 피연산자 순서에 따라 달라 su1+su2와 su2+su1은 다릅니다. 원래 두 list는 바뀌지 않습니다. list와 int처럼 타입이 다른 +는 TypeError입니다.",
        "* 오른쪽에는 정수가 와야 하며 0 또는 음수면 빈 list입니다. 요소 객체를 깊게 복사하는 연산이 아니므로 mutable 요소 반복은 공유 참조를 만듭니다. 불변 숫자에서만 보면 이 차이가 숨습니다.",
        "많은 list를 sum(lists, [])로 연결하면 중간 list를 반복 복사해 느려질 수 있습니다. itertools.chain, 컴프리헨션, extend를 목적에 따라 선택합니다. 성능 전에 원본 변경 여부와 반환 계약을 먼저 결정합니다.",
      ],
      concepts: [
        { term: "연결(concatenation)", definition: "두 시퀀스의 순서를 유지해 하나의 새 시퀀스로 이어 붙이는 연산입니다.", detail: ["list + list만 지원합니다.", "원본 list는 변경하지 않습니다."] },
        { term: "반복(repetition)", definition: "시퀀스의 요소 참조 패턴을 정수 횟수만큼 반복한 새 시퀀스를 만드는 연산입니다.", detail: ["내부 mutable 요소를 복제하지 않습니다.", "매우 큰 횟수는 메모리를 많이 사용하므로 외부 입력을 제한합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "TypeError: can only concatenate list (not \"int\") to list가 발생한다.", likelyCause: "list + 1처럼 연결 가능한 list가 아닌 값을 오른쪽에 사용했습니다.", checks: ["양쪽 type을 확인합니다.", "숫자 하나를 요소로 추가할지 숫자 list를 연결할지 의도를 정합니다.", "원본 변경이 필요한지 새 list가 필요한지 확인합니다."], fix: "새 요소 하나면 [1]처럼 list로 감싸 연결하거나, 원본 변경이면 append를 사용합니다.", prevention: "컨테이너 API의 요소와 iterable 차이를 타입 힌트·테스트로 명시합니다." },
      ],
    },
    {
      id: "membership-cost",
      title: "in은 값 동등성을 앞에서부터 검사합니다",
      lead: "1 in [1,2,3]은 True, 5 not in [1,2,3]은 True입니다. list에서는 최악의 경우 모든 요소를 순서대로 비교합니다.",
      explanations: [
        "list의 in은 각 요소와 == 비교해 일치하면 즉시 True를 반환합니다. 못 찾으면 끝까지 확인합니다. 작은 순서 목록에는 자연스럽지만 매우 큰 목록에서 반복 조회하면 비용이 커질 수 있습니다.",
        "순서보다 빠른 membership이 핵심이면 set을 고려합니다. 하지만 set은 중복과 순서 의미가 다르며 hash 가능한 값만 요소로 사용합니다. list를 무조건 set으로 바꾸면 출력 순서와 중복 정보가 사라질 수 있습니다.",
        "중첩 list에서 7 in even은 안쪽 list 내부까지 재귀 검색하지 않습니다. even의 직접 요소 중 7이 없으면 False이고, 7 in even[2]처럼 대상 계층을 명시해야 합니다. 평평하게 만들지 중첩을 유지할지는 데이터 모델 결정입니다.",
      ],
      concepts: [
        { term: "membership 검사", definition: "값이 컨테이너의 직접 요소 중 하나와 같은지 in·not in으로 묻는 연산입니다.", detail: ["list는 순차 == 비교를 사용합니다.", "중첩 컨테이너 내부를 자동 재귀 검색하지 않습니다."] },
        { term: "시간 복잡도", definition: "입력 크기가 늘 때 연산 시간이 어떻게 증가하는지 나타내는 관점입니다.", detail: ["list membership은 일반적으로 O(n)입니다.", "set membership은 평균 O(1)이지만 순서·중복과 hash 제약 trade-off가 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "membership 중심 데이터에 list와 set 중 무엇을 선택할까요?", options: [
          { name: "list", chooseWhen: "순서·중복·인덱스가 중요하고 데이터가 작거나 조회가 적을 때", avoidWhen: "거대한 데이터에서 존재 검사를 매우 자주 할 때", tradeoffs: ["순서와 중복을 보존합니다.", "원소가 hash 가능할 필요가 없습니다.", "membership은 선형 탐색입니다."] },
          { name: "set", chooseWhen: "고유 값의 빠른 존재 검사와 집합 연산이 핵심일 때", avoidWhen: "중복 횟수·인덱스 순서가 업무 데이터일 때", tradeoffs: ["평균적으로 빠른 조회입니다.", "중복을 제거합니다.", "mutable list 같은 unhashable 요소는 직접 넣을 수 없습니다."] },
        ] },
      ],
    },
    {
      id: "construction-choices",
      title: "리터럴·list 생성자·컴프리헨션의 의도를 구분합니다",
      lead: "이미 알고 있는 요소를 나열할 때는 리터럴, 다른 iterable을 구체 list로 만들 때는 list(), 규칙으로 요소를 만들 때는 컴프리헨션을 사용합니다.",
      explanations: [
        "[]는 빈 list, [1,2,3]은 세 요소 list를 가장 직접적으로 표현합니다. list('Python')은 문자열을 문자 단위로 순회해 ['P','y','t','h','o','n']을 만듭니다. 하나의 문자열 요소를 원했다면 ['Python']이어야 하므로 생성자의 iterable 계약을 확인해야 합니다.",
        "list(range(5))는 range가 순서대로 제공하는 0~4를 실제 list로 구체화합니다. 매우 큰 range를 불필요하게 list로 바꾸면 메모리를 많이 사용합니다. 인덱스 가능한 전체 자료가 필요한지 한 번씩 순회하면 되는지 결정합니다.",
        "[expression for item in source] 형태의 컴프리헨션은 각 반복마다 표현식을 평가해 요소를 만듭니다. 중첩 행을 독립 생성하는 데 유용하지만, 복잡한 조건과 부작용을 한 줄에 넣지 않습니다. 컴프리헨션 자체는 py-020에서 더 깊게 다룹니다.",
        "함수 기본값으로 items=[]를 두면 그 list가 함수 정의 시 한 번 만들어져 호출 간 공유될 수 있습니다. 지금은 mutable 객체 공유 문제로 기억하고, 함수 세션에서 None sentinel로 안전하게 생성하는 패턴을 실험합니다.",
      ],
      concepts: [
        { term: "iterable", definition: "요소를 하나씩 제공하며 순회할 수 있는 객체입니다.", detail: ["str, range, tuple, set 등에서 list를 만들 수 있습니다.", "순서·중복은 원본 iterable의 제공 방식에 따라 달라집니다."] },
        { term: "구체화(materialization)", definition: "지연되거나 다른 형태로 제공되는 요소를 메모리의 실제 list에 모두 모으는 일입니다.", detail: ["반복 조회·인덱싱이 쉬워지는 대신 요소 수만큼 메모리가 필요합니다.", "무한 또는 매우 큰 iterable을 list로 만들면 끝나지 않거나 자원을 고갈시킬 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "list('Python') 결과가 ['Python']이 아니라 문자 여섯 개다.", likelyCause: "list 생성자가 문자열 전체를 한 요소로 감싸는 것이 아니라 iterable의 각 문자를 소비했습니다.", checks: ["원하는 요소 단위가 전체 문자열인지 개별 문자인지 정합니다.", "생성자 인수의 iterable 계약을 확인합니다.", "원본과 결과의 len을 비교합니다."], fix: "문자열 하나를 요소로 담으려면 ['Python'] 리터럴을 사용합니다.", prevention: "대표값뿐 아니라 문자열·빈 iterable·중첩 iterable 생성 테스트를 둡니다." },
      ],
      expertNotes: ["신뢰하지 않는 입력으로 list(range(user_size)) 같은 구체화를 하지 말고 최대 크기를 제한합니다."],
    },
    {
      id: "modeling-and-boundaries",
      title: "리스트가 표현하는 데이터 계약을 명시합니다",
      lead: "list가 무엇이든 담을 수 있다는 사실과 무엇이든 담는 설계가 좋은 것은 다릅니다.",
      explanations: [
        "점수 목록 scores:list[int]처럼 요소 역할이 같으면 반복·집계하기 쉽습니다. person=['홍길동',24,178.45]처럼 위치마다 역할이 다른 값은 person[1]의 의미를 기억해야 합니다. dict나 dataclass로 name·age·height를 이름 붙이면 검증과 변경이 안전합니다.",
        "외부 JSON 배열을 list로 받았다고 해서 요소 타입과 길이를 신뢰하지 않습니다. 최대 항목 수, 각 값 타입·범위, 중첩 깊이를 검증합니다. 지나치게 큰 배열과 깊은 중첩은 메모리·재귀 처리 비용을 키울 수 있습니다.",
        "함수에 list를 전달할 때 함수가 읽기만 하는지 변경하는지 계약을 정합니다. 예상치 못한 in-place 변경은 호출자 상태를 훼손합니다. 변경 함수는 이름·문서·반환 정책을 분명히 하고, 읽기 전용이면 Sequence 같은 추상 타입을 받을 수 있습니다.",
        "동시 실행에서 공유 list를 여러 작업이 변경하면 순서와 일관성이 깨질 수 있습니다. 단순 append가 특정 구현에서 원자적으로 보인다는 사실에 의존하지 말고 queue·lock·메시지 전달 같은 명시적 동시성 모델을 사용합니다.",
      ],
      concepts: [
        { term: "컨테이너 계약", definition: "요소 타입·순서·중복·최대 크기·변경 권한을 정한 규칙입니다.", detail: ["문법상 허용 범위보다 좁고 의미 있는 업무 범위를 정의합니다.", "입력 경계와 함수 인터페이스에서 검증합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "함수 호출 후 호출자의 list가 예상치 않게 바뀐다.", likelyCause: "함수가 전달받은 같은 mutable list를 in-place 변경했고 호출자는 복사 또는 불변 계약을 기대했습니다.", checks: ["호출 전후 id와 repr을 확인합니다.", "함수 내부 append·sort·요소 대입을 찾습니다.", "문서와 이름에 변경 사실이 명시됐는지 확인합니다."], fix: "의도에 따라 함수가 새 list를 반환하거나 변경을 명시하고 호출자가 복사본을 전달합니다.", prevention: "변경 여부를 타입·문서·테스트에 기록하고 원본 보존 테스트를 둡니다." },
      ],
      expertNotes: ["타입 힌트 list[object]는 모든 것을 허용하지만 사용자가 타입 좁히기를 해야 합니다. 가능한 한 list[Score], list[str]처럼 요소 계약을 구체화합니다.", "보안 경계에서는 항목 수와 중첩 깊이 제한이 필요합니다. JSON bomb와 대규모 반복 생성은 메모리 고갈을 일으킬 수 있습니다."],
    },
  ],
  lab: {
    title: "학습 과정과 세션의 중첩 목록 모델링",
    scenario: "과정별 완료 세션 번호를 중첩 list로 표현하고 조회·슬라이스·membership을 수행한 뒤 공유 참조 버그를 찾아 독립 구조로 고칩니다.",
    setup: ["list_model_lab.py를 만듭니다.", "Python·Java 두 과정의 완료 세션 list를 준비합니다.", "Python 3.11 이상에서 실행합니다."],
    steps: ["python_done=[1,2,3], java_done=[1]을 만들고 courses=[python_done,java_done]로 중첩합니다.", "각 과정 첫·마지막 값과 앞 두 값 슬라이스의 반환 타입을 출력합니다.", "4 in python_done과 4 in courses 결과 차이를 설명합니다.", "backup=courses[:]를 만들고 backup[0].append(4) 후 원본 변화와 이유를 기록합니다.", "행별 독립 복사를 [row.copy() for row in courses]로 만들고 같은 실험을 반복합니다.", "잘못된 repeated=[[]]*2를 재현하고 컴프리헨션으로 수정합니다."],
    expectedResult: ["중첩 인덱스와 슬라이스 타입을 예측합니다.", "얕은 바깥 복사가 내부 list를 공유하는 결과가 명확히 보입니다.", "행별 새 list를 만든 구조에서는 한 과정 변경이 다른 복사에 영향을 주지 않습니다.", "직접 요소 membership과 중첩 내부 membership을 구분합니다."],
    cleanup: ["실습은 합성 세션 번호만 사용합니다."],
    extensions: ["위치별 의미가 있는 과정 레코드를 dict 또는 dataclass로 바꿉니다.", "조회가 많은 완료 세션을 set으로 보조 색인하고 순서 list와 일관성을 유지합니다.", "최대 과정·세션 수 입력 검증을 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "서로 다른 타입이 든 list의 각 인덱스 결과 타입을 표로 출력하세요.", requirements: ["str, int, float, bool, 중첩 list를 포함합니다.", "단일 인덱스와 한 요소 슬라이스를 비교합니다.", "원본 길이와 마지막 음수 인덱스를 확인합니다."], hints: ["type(items[i]).__name__을 사용합니다.", "items[i:i+1]은 항상 list입니다."], expectedOutcome: "컨테이너 타입과 요소 타입을 혼동하지 않는 실행 표가 완성됩니다.", solutionOutline: ["list 리터럴을 만듭니다.", "대표 위치 결과와 타입을 출력합니다.", "범위 밖 오류도 마지막에 재현합니다."] },
    { difficulty: "응용", prompt: "3×3 좌석표를 만들고 행 독립성을 검증하세요.", requirements: ["잘못된 * 반복 버전과 올바른 컴프리헨션 버전을 모두 만듭니다.", "첫 행 한 칸 변경 후 모든 행을 출력합니다.", "is 검사와 객체 그래프로 이유를 설명합니다."], hints: ["[[False]*3]*3은 내부 행을 공유합니다.", "[[False]*3 for _ in range(3)]을 비교합니다."], expectedOutcome: "값만 고치는 것이 아니라 생성 방식의 참조 문제를 설명하고 해결합니다." },
    { difficulty: "설계", prompt: "여행 일정의 날짜별 활동 데이터 모델을 설계하세요.", requirements: ["순서·중복·위치별 역할을 분석해 list, dict, dataclass를 조합합니다.", "복사·편집·취소 시 어느 객체를 공유할지 정합니다.", "외부 JSON의 최대 크기·깊이·타입 검증을 정의합니다.", "얕은 복사 버그와 membership 성능 테스트를 포함합니다."], hints: ["모든 정보를 중첩 list 위치로만 표현하지 마세요.", "의도한 공유와 독립 복사를 구분합니다."], expectedOutcome: "list 문법을 실제 도메인 객체 그래프·입력 계약·성능 기준으로 확장한 설계가 완성됩니다." },
  ],
  reviewQuestions: [
    { question: "items[2]와 items[2:3]의 반환 타입 차이는 무엇인가요?", answer: "items[2]는 해당 요소의 타입이고 items[2:3]은 요소 하나를 담은 새 list입니다." },
    { question: "outer[1]과 inner가 같은 list인지 어떻게 확인하나요?", answer: "동일성 확인에는 outer[1] is inner를 사용할 수 있고, 한 경로로 변경해 다른 경로에서 관찰할 수도 있습니다." },
    { question: "inner를 새 list로 재바인딩하면 outer 안 기존 inner도 바뀌나요?", answer: "아닙니다. inner 이름의 연결만 바뀌고 outer 요소는 이전 객체를 계속 가리킵니다." },
    { question: "[[0]*3]*2의 한 셀이 두 행에서 바뀌는 이유는 무엇인가요?", answer: "*가 하나의 내부 list 참조를 두 번 반복해 두 행이 같은 객체이기 때문입니다." },
    { question: "list 슬라이스가 새 list인데도 중첩 변경이 원본에 보일 수 있는 이유는 무엇인가요?", answer: "바깥 컨테이너만 새로 만들고 내부 요소 객체 참조는 공유하는 얕은 복사이기 때문입니다." },
    { question: "7 in outer가 inner 안의 7까지 자동으로 찾나요?", answer: "아닙니다. outer의 직접 요소만 비교하므로 7 in inner 또는 명시적 순회가 필요합니다." },
    { question: "혼합 타입 list가 문법적으로 가능해도 dataclass가 나을 수 있는 이유는 무엇인가요?", answer: "위치 대신 필드 이름·타입·검증을 표현해 읽기와 변경 안정성이 좋아지기 때문입니다." },
  ],
  completionChecklist: [
    "list의 순서·중복·가변성·요소 참조 모델을 설명할 수 있다.",
    "인덱싱과 슬라이싱 반환 타입을 예측할 수 있다.",
    "중첩 인덱스를 한 단계씩 분해해 추적할 수 있다.",
    "대입 alias, 얕은 복사, 행별 독립 생성의 차이를 재현할 수 있다.",
    "+·*·in 연산의 결과와 mutable 요소 공유 함정을 설명할 수 있다.",
    "순서·중복·조회 비용에 따라 list와 set을 비교할 수 있다.",
    "요소 타입·최대 크기·변경 권한이 있는 list 계약을 설계할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-list-basic", repository: "PYTHON-BASIC", path: "day02/ex04_list.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day02/ex04_list.py", usedFor: ["혼합 타입", "인덱싱·슬라이싱", "중첩 list", "다단계 접근"], evidence: "Python 3.13.9에서 직접 실행해 7 int, A str, 세 슬라이스 list, even 중첩과 '길' 접근 결과를 확인했습니다." },
    { id: "py-list-operators", repository: "PYTHON-BASIC", path: "day02/ex05_list.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day02/ex05_list.py", usedFor: ["+ 연결", "* 반복", "in·not in", "지원하지 않는 연산"], evidence: "원본 실행에서 두 연결 순서, 3회 반복, 1·5 membership True/False를 확인했습니다." },
    { id: "py-day02-note", repository: "PYTHON-BASIC", path: "notes/day02_string_list_tuple.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day02_string_list_tuple.md", usedFor: ["list 특성", "인덱싱·슬라이싱", "중첩 접근", "가변성 복습"], evidence: "원본 노트 범위를 기준으로 alias·얕은 복사·반복 행 함정·모델링을 심화 보강했습니다." },
  ],
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["append·insert·remove·pop·sort와 복사 API는 py-011에서 별도로 다룹니다.", "deepcopy·동시성·입력 자원 제한은 원본 공백을 전문가 관점으로 보강했습니다."] },
} satisfies DetailedSession;

const expertChapters: DetailedSession["chapters"] = [
  {
    id: "aliasing-copy-depth-reference-graph",
    title: "alias·얕은 복사·깊은 복사를 객체 그래프로 구분합니다",
    lead: "리스트를 복사했다는 말만으로는 충분하지 않습니다. 바깥 컨테이너와 안쪽 mutable 요소가 각각 같은 객체인지 id와 변경 전파로 확인해야 합니다.",
    explanations: [
      "b = a는 리스트를 복사하지 않고 같은 객체에 두 번째 이름을 붙입니다. a is b가 True이고 어느 이름으로 append해도 동일 리스트가 바뀝니다.",
      "a.copy(), a[:], list(a)는 새 바깥 리스트를 만들지만 요소 참조는 재사용합니다. nested list에서 outer is copy는 False여도 outer[0] is copy[0]은 True일 수 있습니다.",
      "copy.deepcopy는 접근 가능한 object graph를 재귀적으로 복사하고 memo로 cycle과 repeated reference를 처리합니다. 파일 handle·module·shared service처럼 복사 의미가 없는 객체에는 domain-specific clone이 필요합니다.",
      "[[0] * cols] * rows는 같은 row 하나를 rows번 참조하므로 한 cell 변경이 모든 행에 보입니다. comprehension으로 매 iteration 새 row를 만들어야 합니다.",
      "복사 깊이는 기술 선택이 아니라 ownership 계약입니다. 누가 nested object를 변경할 수 있는지, snapshot이 필요한지와 비용 상한을 먼저 정합니다.",
    ],
    concepts: [
      { term: "alias", definition: "둘 이상의 이름 또는 컨테이너 slot이 같은 mutable 객체를 가리키는 상태입니다.", detail: ["is로 identity를 확인합니다.", "변경이 모든 경로에서 관찰됩니다."] },
      { term: "shallow copy", definition: "바깥 컨테이너만 새로 만들고 내부 요소 참조를 재사용하는 복사입니다.", detail: ["중첩 변경은 공유됩니다.", "불변 요소만 있으면 충분할 수 있습니다."] },
      { term: "deep copy", definition: "memo를 사용해 object graph의 nested objects까지 재귀 복사하는 연산입니다.", detail: ["비용과 의미를 검토합니다.", "모든 resource에 적합하지 않습니다."] },
    ],
    codeExamples: [{
      id: "list-alias-shallow-deep-evidence",
      title: "행 반복 함정과 copy 깊이를 identity로 검증합니다",
      language: "python",
      filename: "list_alias_copy_depth.py",
      purpose: "같은 출력 모양 뒤에 숨은 object identity와 mutation propagation을 결정적으로 드러냅니다.",
      code: String.raw`from copy import deepcopy

shared_rows = [[0, 0]] * 3
shared_rows[0][0] = 7
print("shared_rows:", shared_rows)
print("same_rows:", shared_rows[0] is shared_rows[1])

independent_rows = [[0, 0] for _ in range(3)]
independent_rows[0][0] = 7
print("independent_rows:", independent_rows)
print("same_rows:", independent_rows[0] is independent_rows[1])

original = [["python"], ["java"]]
shallow = original.copy()
deep = deepcopy(original)
original[0].append("typing")
print("outer_identity:", original is shallow, original is deep)
print("inner_identity:", original[0] is shallow[0], original[0] is deep[0])
print("original:", original)
print("shallow:", shallow)
print("deep:", deep)`,
      walkthrough: [
        { lines: "1-6", explanation: "반복 연산으로 같은 row reference가 세 slots에 들어가 한 변경이 모두 전파되는 것을 확인합니다." },
        { lines: "8-11", explanation: "comprehension은 각 iteration에 새 row를 만들어 변경을 한 행에 격리합니다." },
        { lines: "13-21", explanation: "얕은·깊은 복사의 바깥/안쪽 identity와 변경 결과를 함께 관찰합니다." },
      ],
      run: { environment: ["Python 3.13+", "network/filesystem 불필요"], command: "python -I -B list_alias_copy_depth.py" },
      output: { value: "shared_rows: [[7, 0], [7, 0], [7, 0]]\nsame_rows: True\nindependent_rows: [[7, 0], [0, 0], [0, 0]]\nsame_rows: False\nouter_identity: False False\ninner_identity: True False\noriginal: [['python', 'typing'], ['java']]\nshallow: [['python', 'typing'], ['java']]\ndeep: [['python'], ['java']]", explanation: ["리스트 출력만 보지 않고 identity를 함께 검증합니다.", "deep copy는 mutation 전 snapshot을 독립적으로 유지합니다."] },
      experiments: [
        { change: "nested 요소를 tuple로 바꿉니다.", prediction: "얕은 복사에서도 내부 값 자체는 변경할 수 없습니다.", result: "불변 value graph에는 shallow copy가 충분할 수 있습니다." },
        { change: "self-reference cycle을 만든 뒤 deepcopy합니다.", prediction: "memo 덕분에 무한 재귀 없이 새 cycle이 만들어집니다.", result: "deepcopy가 단순 재귀 이상의 계약임을 확인합니다." },
        { change: "아주 큰 graph 전체를 deepcopy합니다.", prediction: "시간과 memory가 object graph 크기에 비례해 커집니다.", result: "immutable value나 domain clone으로 범위를 줄입니다." },
      ],
      sourceRefs: ["py-list-docs", "py-copy-module", "py-faq-multidimensional", "py-builtins-id"],
    }],
    diagnostics: [
      { symptom: "한 matrix cell을 바꿨는데 같은 열의 모든 행이 바뀐다.", likelyCause: "[[value] * cols] * rows가 동일 row를 반복 참조합니다.", checks: ["rows[0] is rows[1]을 확인합니다.", "id(row)를 모두 출력합니다.", "construction expression의 바깥 *를 찾습니다."], fix: "[[value for _ in range(cols)] for _ in range(rows)]처럼 행을 매번 새로 만듭니다.", prevention: "행 identity가 모두 다르다는 test와 단일-cell mutation test를 둡니다." },
      { symptom: "복사본을 수정했는데 원본 nested 값도 바뀐다.", likelyCause: "copy 또는 slice가 바깥 list만 복사했습니다.", checks: ["outer와 inner is 관계를 각각 확인합니다.", "mutable nested paths를 inventory합니다."], fix: "ownership에 맞춰 immutable nested values, targeted clone 또는 deepcopy를 선택합니다.", prevention: "copy-depth contract와 mutation-isolation tests를 API 문서에 둡니다." },
    ],
  },
  {
    id: "rectangular-matrix-shape-invariants",
    title: "중첩 리스트를 matrix로 쓸 때 shape·cell type·ragged 경계를 검증합니다",
    lead: "list of lists는 자동으로 matrix가 되지 않습니다. 행 개수·열 개수·rectangular shape와 cell domain을 명시해야 transpose와 계산이 안전합니다.",
    explanations: [
      "빈 matrix, 빈 row, 행마다 길이가 다른 ragged data를 허용할지 먼저 정합니다. zip(*rows)는 기본적으로 가장 짧은 행에서 조용히 멈추므로 검증 없이 쓰면 data를 잃습니다.",
      "shape는 (rows, cols)처럼 tuple로 표현하고 모든 row가 list/sequence인지, len(row) == cols인지 확인합니다.",
      "bool은 int의 subclass이므로 숫자 cell 검사에서 isinstance(value, int)만 쓰면 True가 1로 통과합니다. 업무가 bool을 금지하면 type(value) is int처럼 명시합니다.",
      "transpose는 rectangular matrix에서 columns를 rows로 바꾸며 zip이 tuple을 반환합니다. API가 list-of-lists를 약속하면 list 변환도 계약에 포함합니다.",
      "큰 matrix에는 Python object/list overhead와 cache locality 비용이 큽니다. 수치 연산이 주 목적이면 NumPy 같은 typed dense array를 이후 단계에서 검토합니다.",
    ],
    concepts: [
      { term: "shape invariant", definition: "matrix가 항상 유지해야 하는 행·열 수와 cell type 조건입니다.", detail: ["operation 전에 검증합니다.", "ragged data 정책을 포함합니다."] },
      { term: "ragged matrix", definition: "행마다 열 개수가 다른 중첩 sequence입니다.", detail: ["일부 업무에는 유효합니다.", "일반 matrix 연산에는 별도 처리해야 합니다."] },
    ],
    codeExamples: [{
      id: "validated-matrix-transpose",
      title: "rectangular shape를 검증한 뒤 transpose합니다",
      language: "python",
      filename: "validated_matrix.py",
      purpose: "zip truncation 전에 matrix shape와 int cell policy를 검사합니다.",
      code: String.raw`def validate_matrix(value):
    if not isinstance(value, list) or not value:
        return False, "matrix-required"
    if not all(isinstance(row, list) and row for row in value):
        return False, "nonempty-rows-required"
    columns = len(value[0])
    if any(len(row) != columns for row in value):
        return False, "ragged"
    if any(type(cell) is not int for row in value for cell in row):
        return False, "integer-cells-required"
    return True, (len(value), columns)

def transpose(matrix):
    valid, detail = validate_matrix(matrix)
    if not valid:
        return detail
    return [list(column) for column in zip(*matrix)]

matrix = [[1, 2, 3], [4, 5, 6]]
print("valid:", validate_matrix(matrix))
print("transpose:", transpose(matrix))
print("ragged:", transpose([[1, 2], [3]]))
print("bool_cell:", validate_matrix([[1, True]]))`,
      walkthrough: [
        { lines: "1-11", explanation: "container/empty/rectangular/cell-type 조건을 순서대로 검사하고 shape를 반환합니다." },
        { lines: "13-17", explanation: "검증 성공 뒤에만 zip을 사용하고 tuple columns를 list로 바꿉니다." },
        { lines: "19-23", explanation: "정상 matrix, ragged data와 bool-as-int 경계를 exact output으로 확인합니다." },
      ],
      run: { environment: ["Python 3.13+", "third-party package 불필요"], command: "python -I -B validated_matrix.py" },
      output: { value: "valid: (True, (2, 3))\ntranspose: [[1, 4], [2, 5], [3, 6]]\nragged: ragged\nbool_cell: (False, 'integer-cells-required')", explanation: ["zip 전에 rectangular invariant를 확인해 truncation을 방지합니다.", "type(cell) is int 정책으로 bool을 분리합니다."] },
      experiments: [
        { change: "ragged 검사를 제거합니다.", prediction: "zip(*[[1,2],[3]])는 두 번째 열2를 조용히 잃습니다.", result: "silent truncation이 생깁니다." },
        { change: "빈 matrix를 허용합니다.", prediction: "열 수를 정의할 추가 schema가 필요합니다.", result: "shape metadata 없이는 []의 columns를 알 수 없습니다." },
        { change: "cell policy를 numbers.Real로 넓힙니다.", prediction: "float 등은 통과하지만 bool 제외를 별도로 유지해야 합니다.", result: "domain numeric tower를 명시합니다." },
      ],
      sourceRefs: ["py-common-sequences", "py-zip-builtins", "py-datamodel-identity"],
    }],
    diagnostics: [
      { symptom: "transpose 뒤 일부 cell이 사라진다.", likelyCause: "ragged rows에 zip을 사용해 shortest iterable에서 중단됐습니다.", checks: ["각 row len을 수집합니다.", "zip(strict=True) 또는 사전 shape 검사를 검토합니다."], fix: "rectangular invariant를 강제하거나 ragged-aware representation/정책을 사용합니다.", prevention: "ragged와 empty boundary tests를 둡니다." },
      { symptom: "True가 숫자 matrix cell로 저장된다.", likelyCause: "isinstance(True, int)가 True인 Python type 관계를 놓쳤습니다.", checks: ["type(cell)과 isinstance 결과를 비교합니다.", "업무가 bool을 허용하는지 확인합니다."], fix: "strict int가 필요하면 type(cell) is int로 검사합니다.", prevention: "True/False를 numeric validation cases에 포함합니다." },
    ],
  },
  {
    id: "list-complexity-and-container-choice",
    title: "리스트 연산의 선형 비용과 data access pattern을 연결합니다",
    lead: "작은 예제의 편리함을 운영 규모에 그대로 적용하지 않고, index·membership·insert·copy가 몇 요소를 방문하거나 이동하는지 설명합니다.",
    explanations: [
      "list index access는 내부 연속 pointer array에서 위치를 계산하므로 평균 O(1)이고, x in list와 index(value)는 앞에서 equality를 검사해 최악 O(n)입니다.",
      "append는 capacity를 여유 있게 늘리는 amortized O(1)이지만 insert(0, value), pop(0), 중간 삭제는 뒤 pointer들을 이동해 O(n)입니다.",
      "slice와 concatenation은 선택한 요소 참조를 새 list로 복사하므로 O(k) 시간과 memory를 사용합니다. nested 요소까지 deep copy하는 비용은 object graph 크기에 따릅니다.",
      "queue의 왼쪽 추가/삭제가 핵심이면 collections.deque, 반복 membership이면 set, key lookup이면 dict가 의도를 더 정확히 표현합니다.",
      "wall-clock benchmark는 noise가 있으므로 correctness example에는 비교 횟수처럼 결정적 evidence를 쓰고 실제 성능은 representative data와 timeit/pyperf로 별도 측정합니다.",
    ],
    concepts: [
      { term: "amortized complexity", definition: "가끔 비싼 resize 비용을 많은 연산에 나누어 평균적으로 보는 분석입니다.", detail: ["append의 대표 계약입니다.", "개별 호출 latency와 다릅니다."] },
      { term: "access pattern", definition: "주로 수행하는 위치 접근, membership, 양끝 queue, 정렬 등의 연산 분포입니다.", detail: ["컨테이너 선택 근거입니다.", "데이터 크기와 함께 봅니다."] },
    ],
    codeExamples: [{
      id: "list-membership-comparison-count",
      title: "membership의 선형 equality 방문을 결정적으로 셉니다",
      language: "python",
      filename: "list_complexity_evidence.py",
      purpose: "불안정한 시간 측정 대신 equality 호출 수로 list membership의 선형 scan을 증명합니다.",
      code: String.raw`from collections import deque

class Probe:
    comparisons = 0

    def __init__(self, value):
        self.value = value

    def __eq__(self, other):
        type(self).comparisons += 1
        return isinstance(other, Probe) and self.value == other.value

items = [Probe(number) for number in range(5)]
Probe.comparisons = 0
print("found:", Probe(4) in items, "comparisons:", Probe.comparisons)
Probe.comparisons = 0
print("missing:", Probe(9) in items, "comparisons:", Probe.comparisons)

queue = deque(["a", "b", "c"])
print("popleft:", queue.popleft(), "remaining:", list(queue))
print("index_access:", items[3].value)`,
      walkthrough: [
        { lines: "1-10", explanation: "비교 횟수를 class state로 기록하는 equality probe를 정의합니다." },
        { lines: "12-17", explanation: "끝에서 발견되는 값과 없는 값이 모두5번 비교되는 worst-case scan을 확인합니다." },
        { lines: "19-21", explanation: "왼쪽 queue operation은 deque로 표현하고 list index access는 직접 위치를 읽습니다." },
      ],
      run: { environment: ["Python 3.13+", "timing/network 불필요"], command: "python -I -B list_complexity_evidence.py" },
      output: { value: "found: True comparisons: 5\nmissing: False comparisons: 5\npopleft: a remaining: ['b', 'c']\nindex_access: 3", explanation: ["측정 noise 없이 equality visits를 셉니다.", "access pattern에 따라 list와 deque를 구분합니다."] },
      experiments: [
        { change: "Probe(0)을 찾습니다.", prediction: "첫 비교에서 성공해 comparisons1입니다.", result: "O(n)은 입력 위치에 따른 upper bound입니다." },
        { change: "같은 값을 set에 넣습니다.", prediction: "hash/equality 계약이 필요하고 평균 membership이 상수 시간에 가까워집니다.", result: "순서·hashability tradeoff가 생깁니다." },
        { change: "pop(0)을 큰 list에서 반복합니다.", prediction: "남은 요소 이동이 누적되어 quadratic behavior가 됩니다.", result: "deque.popleft로 바꿉니다." },
      ],
      sourceRefs: ["py-deque", "py-timeit"],
    }],
    diagnostics: [
      { symptom: "데이터가 커지자 membership loop가 급격히 느려진다.", likelyCause: "list O(n) membership을 다른 list의 각 항목마다 반복해 O(n·m)가 됐습니다.", checks: ["membership 호출 위치와 input sizes를 기록합니다.", "중복·순서 요구와 hashability를 확인합니다."], fix: "반복 조회 대상은 set/dict index로 한 번 변환하되 순서·중복 semantics를 보존합니다.", prevention: "규모별 complexity budget과 representative benchmark를 둡니다." },
      { symptom: "queue 처리량이 항목 수와 함께 계속 떨어진다.", likelyCause: "list.pop(0)으로 매번 나머지 references를 이동합니다.", checks: ["left insert/pop calls를 찾습니다.", "access pattern이 양끝인지 확인합니다."], fix: "collections.deque의 append/popleft를 사용합니다.", prevention: "container choice를 access-pattern ADR에 기록합니다." },
    ],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...expertChapters);
session.reviewQuestions.push(
  { question: "b = a는 리스트 복사인가요?", answer: "아닙니다. 두 이름이 같은 list 객체를 가리키는 alias입니다." },
  { question: "list.copy가 중첩 리스트를 완전히 분리하나요?", answer: "아닙니다. 새 바깥 리스트를 만들지만 내부 요소 참조는 공유합니다." },
  { question: "[[0] * cols] * rows가 위험한 이유는 무엇인가요?", answer: "한 row 객체의 참조를 반복하므로 한 cell 변경이 모든 행에 보입니다." },
  { question: "zip으로 ragged matrix를 transpose하면 어떻게 되나요?", answer: "가장 짧은 행에서 중단되어 뒤 cell이 조용히 사라질 수 있습니다." },
  { question: "isinstance(True, int)는 무엇을 반환하나요?", answer: "True입니다. strict numeric domain이 bool을 금지하면 별도 검사가 필요합니다." },
  { question: "list membership의 최악 시간 복잡도는 무엇인가요?", answer: "앞에서부터 equality를 검사하므로 O(n)입니다." },
  { question: "append가 항상 O(1)인가요?", answer: "개별 resize는 비쌀 수 있지만 많은 호출에 평균낸 amortized O(1)입니다." },
  { question: "queue 왼쪽 삭제에 적합한 표준 컨테이너는 무엇인가요?", answer: "collections.deque의 popleft가 적합합니다." },
);
session.completionChecklist.push(
  "alias와 복사를 is로 구분할 수 있다.",
  "얕은 복사의 outer/inner identity를 설명할 수 있다.",
  "반복 연산으로 만든 shared-row matrix 함정을 재현할 수 있다.",
  "rectangular matrix의 shape와 cell type을 검증한다.",
  "ragged matrix의 zip truncation을 방지한다.",
  "bool과 strict int cell 정책을 구분한다.",
  "index·membership·front mutation의 complexity를 설명한다.",
  "access pattern에 따라 list·set·dict·deque를 선택한다.",
);
session.sources.push(
  { id: "py-list-docs", repository: "Python 3 Library Reference", path: "Lists", publicUrl: "https://docs.python.org/3/library/stdtypes.html#lists", usedFor: ["list mutability", "copy and repetition"], evidence: "list type의 공식 계약입니다." },
  { id: "py-copy-module", repository: "Python 3 Library Reference", path: "copy — Shallow and deep copy operations", publicUrl: "https://docs.python.org/3/library/copy.html", usedFor: ["copy/deepcopy", "memo and limitations"], evidence: "copy depth의 공식 API 근거입니다." },
  { id: "py-faq-multidimensional", repository: "Python 3 FAQ", path: "How do I create a multidimensional list?", publicUrl: "https://docs.python.org/3/faq/programming.html#how-do-i-create-a-multidimensional-list", usedFor: ["shared row repetition trap"], evidence: "다차원 list 생성 함정의 Python 공식 설명입니다." },
  { id: "py-builtins-id", repository: "Python 3 Library Reference", path: "id", publicUrl: "https://docs.python.org/3/library/functions.html#id", usedFor: ["object identity evidence"], evidence: "identity 관찰 builtin의 공식 계약입니다." },
  { id: "py-common-sequences", repository: "Python 3 Library Reference", path: "Common Sequence Operations", publicUrl: "https://docs.python.org/3/library/stdtypes.html#common-sequence-operations", usedFor: ["index/slice/repetition/membership complexity model"], evidence: "sequence operation 계약의 공식 근거입니다." },
  { id: "py-zip-builtins", repository: "Python 3 Library Reference", path: "zip", publicUrl: "https://docs.python.org/3/library/functions.html#zip", usedFor: ["transpose", "shortest iterable behavior"], evidence: "zip truncation과 strict option의 공식 계약입니다." },
  { id: "py-datamodel-identity", repository: "Python 3 Language Reference", path: "Objects, values and types", publicUrl: "https://docs.python.org/3/reference/datamodel.html#objects-values-and-types", usedFor: ["identity", "mutability"], evidence: "Python object model primary reference입니다." },
  { id: "py-deque", repository: "Python 3 Library Reference", path: "collections.deque", publicUrl: "https://docs.python.org/3/library/collections.html#collections.deque", usedFor: ["queue access pattern"], evidence: "양끝 queue API의 공식 계약입니다." },
  { id: "py-timeit", repository: "Python 3 Library Reference", path: "timeit", publicUrl: "https://docs.python.org/3/library/timeit.html", usedFor: ["representative performance measurement"], evidence: "Python timing 도구의 공식 근거입니다." },
);

export default session;
