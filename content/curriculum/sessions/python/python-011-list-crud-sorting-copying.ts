import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-011"],
  slug: "python-011-list-crud-sorting-copying",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 11,
  title: "리스트 CRUD·정렬·복사",
  subtitle: "append·insert·remove·pop·del·extend와 sort·reverse의 변경 계약을 추적하고, 반환값·정렬 키·얕은 복사를 안전하게 다룹니다.",
  level: "기초",
  estimatedMinutes: 120,
  coreQuestion: "리스트를 변경하는 각 API가 무엇을 기준으로 어디를 바꾸고 무엇을 반환하는지 어떻게 예측할까요?",
  summary: "요소 하나 추가와 iterable 확장, 위치 수정과 슬라이스 대입, 값·위치 기반 삭제, pop 반환값을 구분합니다. sort와 sorted, reverse와 reversed, key·reverse·안정 정렬, None 반환 함정을 실제 코드로 확인하고 얕은 복사·alias·성능·함수 변경 계약까지 연결합니다.",
  objectives: [
    "append·insert·extend의 입력 단위와 변경 위치를 구분할 수 있다.",
    "remove·pop·del·clear를 값·위치·범위·반환 요구에 맞게 선택할 수 있다.",
    "in-place 메서드가 None을 반환하는 이유와 연쇄 호출 실패를 설명할 수 있다.",
    "sort와 sorted, reverse와 reversed의 원본 변경·반환 타입을 비교할 수 있다.",
    "key 함수와 안정 정렬을 사용해 복합 레코드를 여러 기준으로 정렬할 수 있다.",
    "alias·얕은 복사·중첩 mutable 요소 공유를 테스트할 수 있다.",
  ],
  prerequisites: [
    { title: "리스트 생성·중첩·가변성", reason: "같은 list 객체의 내부 변경과 이름 재바인딩, 얕은 참조 모델을 사용합니다.", sessionSlug: "python-010-list-creation-nesting-mutability" },
    { title: "문자열 메서드와 검증", reason: "메서드의 입력·반환·실패 계약을 읽는 방식을 list API에 적용합니다.", sessionSlug: "python-009-string-methods-validation" },
  ],
  keywords: ["Python", "list", "append", "extend", "insert", "remove", "pop", "del", "sort", "sorted", "reverse", "shallow copy"],
  chapters: [
    {
      id: "mutation-contract",
      title: "변경 메서드는 같은 리스트를 바꾸고 대개 None을 반환합니다",
      lead: "items.append(value)는 items 객체를 변경하지만 새 리스트를 반환하지 않습니다. 결과를 다시 items에 대입하면 오히려 이름을 None으로 잃습니다.",
      explanations: [
        "str.upper() 같은 불변 메서드는 새 값을 반환하지만 list.append, extend, insert, remove, sort, reverse는 같은 list를 변경하고 None을 반환합니다. 변경 사실이 반환값과 혼동되지 않도록 한 계약입니다. items = items.append(value)는 append를 먼저 수행한 뒤 반환 None을 items에 바인딩해 이후 list를 사용할 수 없게 만듭니다.",
        "in-place 변경은 같은 객체를 참조하는 모든 경로에 보입니다. 함수 안에서 전달받은 list를 sort하면 호출자 list도 정렬됩니다. 호출자가 원본 보존을 기대한다면 sorted를 사용하거나 복사본을 명시적으로 만들어야 합니다.",
        "변경 전후 상태를 검증할 때 id만 보는 것으로 충분하지 않습니다. 같은 id에서 요소가 달라지는지, 다른 alias에서 어떻게 보이는지, 메서드 반환이 None인지 함께 관찰하세요.",
      ],
      concepts: [
        { term: "in-place 변경", definition: "새 컨테이너를 결과로 교체하지 않고 현재 mutable 객체의 내부 상태를 바꾸는 동작입니다.", detail: ["list의 많은 변경 메서드가 None을 반환합니다.", "alias를 통해 같은 변경을 관찰할 수 있습니다."], caveat: "in-place라는 말이 메모리 재할당이 절대 없다는 뜻은 아닙니다. 관찰 가능한 객체 정체성을 유지한다는 API 계약에 집중합니다." },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "append 뒤 변수 값이 None이 되어 AttributeError가 발생한다.", likelyCause: "items = items.append(value)처럼 None 반환값을 원래 이름에 대입했습니다.", checks: ["문제 줄의 오른쪽 메서드 반환을 print 또는 문서로 확인합니다.", "append 직후 원본 객체가 이미 변경됐는지 봅니다.", "items 이름이 언제 None으로 재바인딩됐는지 traceback 앞줄을 추적합니다."], fix: "items.append(value)를 독립 문장으로 호출하고 재대입을 제거합니다.", prevention: "in-place 메서드와 새 값 반환 함수를 표로 정리하고 타입 검사·린터를 사용합니다." },
      ],
    },
    {
      id: "append-insert-extend",
      title: "하나를 추가할지 여러 요소를 펼칠지 먼저 정합니다",
      lead: "append는 인수 하나를 한 요소로, extend는 iterable의 각 요소를, insert는 지정 위치에 한 요소를 넣습니다.",
      explanations: [
        "fruits.append('바나나')는 마지막에 str 하나를 추가합니다. fruits.append(['망고','수박'])은 안쪽 list 하나를 추가해 중첩 구조가 됩니다. 여러 과일을 같은 수준에 추가하려면 extend(['망고','수박'])를 사용합니다.",
        "extend는 모든 iterable을 순회합니다. items.extend('AB')는 문자열 전체가 아니라 'A','B' 두 요소를 추가합니다. 문자열 하나를 추가하려면 append를 써야 합니다. 제너레이터를 extend하면 한 번 소비된다는 점도 나중에 확인합니다.",
        "insert(index,value)는 기존 요소를 오른쪽으로 밀어 한 요소를 넣습니다. 범위보다 큰 양수 인덱스는 끝, 매우 작은 음수는 처음으로 보정됩니다. 잘못 계산된 위치를 오류로 잡아주지 않으므로 엄격한 위치가 필요하면 직접 범위를 검증합니다.",
        "list 끝 append는 평균적으로 효율적이지만 처음 insert(0,x)를 반복하면 모든 요소 이동 비용이 누적됩니다. 앞쪽 큐가 핵심이면 collections.deque를 검토합니다.",
      ],
      concepts: [
        { term: "요소 단위", definition: "컨테이너에 넣을 값을 하나의 요소로 취급할지 iterable의 여러 요소로 펼칠지에 대한 선택입니다.", detail: ["append는 하나, extend는 여러 요소입니다.", "문자열도 iterable이라 extend에서 문자 단위로 펼쳐집니다."] },
      ],
      codeExamples: [
        {
          id: "list-crud-workflow",
          title: "과일 목록의 추가·삽입·수정·삭제 흐름",
          language: "python",
          filename: "list_crud.py",
          purpose: "원본 ex06_list.py의 상태 변화를 각 메서드 반환값과 함께 재현합니다.",
          code: "fruits = ['사과', '배', '포도']\n\nappend_result = fruits.append('바나나')\nfruits.insert(2, '망고')\nfruits[1] = '수박'\nprint(append_result, fruits)\n\nfruits.remove('수박')\nremoved = fruits.pop(2)\nlast = fruits.pop()\nprint(f'{removed=}, {last=}')\nprint(fruits)\n\nfruits.extend(['딸기', '참외'])\nprint(fruits)",
          walkthrough: [
            { lines: "1", explanation: "세 str 요소를 가진 mutable list를 준비합니다." },
            { lines: "3", explanation: "append가 원본 끝에 바나나를 추가하고 반환값 None을 append_result에 둡니다." },
            { lines: "4", explanation: "현재 인덱스 2 앞에 망고를 삽입해 이후 요소 위치가 밀립니다." },
            { lines: "5", explanation: "인덱스 1의 배 참조를 수박으로 교체합니다." },
            { lines: "8", explanation: "remove는 첫 수박 값을 찾아 삭제하고 None을 반환합니다." },
            { lines: "9-10", explanation: "pop(2)는 현재 인덱스 2 포도를, pop()은 마지막 바나나를 삭제하면서 반환합니다." },
            { lines: "14", explanation: "extend가 두 문자열을 같은 수준의 두 요소로 펼쳐 추가합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "list_crud.py를 저장"], command: "python list_crud.py" },
          output: { value: "None ['사과', '수박', '망고', '포도', '바나나']\nremoved='포도', last='바나나'\n['사과', '망고']\n['사과', '망고', '딸기', '참외']", explanation: ["append 반환 None과 변경된 fruits가 동시에 보입니다.", "앞선 삭제로 인덱스가 바뀌므로 pop(2)의 대상은 현재 상태를 기준으로 합니다.", "extend 결과는 중첩 list가 아니라 네 문자열이 같은 수준에 있습니다."] },
          experiments: [
            { change: "extend(['딸기','참외'])를 append(['딸기','참외'])로 바꿉니다.", prediction: "마지막 요소가 두 과일을 담은 list가 됩니다.", result: "['사과','망고',['딸기','참외']]가 되어 요소 단위 차이가 드러납니다." },
            { change: "fruits.extend('키위')를 추가합니다.", prediction: "키와 위가 별도 문자 요소로 추가됩니다.", result: "문자열 iterable의 소비 규칙을 확인합니다." },
          ],
          sourceRefs: ["py-list-crud", "py-day02-note"],
        },
      ],
      diagnostics: [],
    },
    {
      id: "assignment-and-slices",
      title: "인덱스 대입은 하나를 교체하고 슬라이스 대입은 길이도 바꿀 수 있습니다",
      lead: "items[i]=value는 한 칸의 참조를 바꾸고 items[start:stop]=iterable은 선택 범위를 여러 요소로 교체합니다.",
      explanations: [
        "fruits[1]='수박'은 해당 위치 하나를 교체합니다. 범위 밖 인덱스에 대입한다고 자동 append되지 않고 IndexError가 납니다. 끝에 추가하려면 append를 사용합니다.",
        "items[1:3]=['A','B','C']는 두 요소 범위를 세 요소로 바꾸어 전체 길이를 1 늘립니다. 빈 슬라이스 items[2:2]=values는 삽입, items[1:4]=[]는 삭제처럼 동작합니다. 강력하지만 한 줄에서 길이가 바뀌므로 의도를 명확히 합니다.",
        "슬라이스 step이 1이 아니면 확장 슬라이스 대입의 오른쪽 요소 수가 선택 위치 수와 정확히 같아야 합니다. 그렇지 않으면 ValueError입니다. 단순 범위 교체와 간격 위치 교체의 계약이 다릅니다.",
      ],
      concepts: [
        { term: "슬라이스 대입", definition: "list의 선택 범위를 iterable의 요소들로 교체하는 in-place 연산입니다.", detail: ["step=1 범위는 길이를 늘리거나 줄일 수 있습니다.", "확장 슬라이스는 선택 수와 입력 수가 같아야 합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "IndexError: list assignment index out of range가 발생한다.", likelyCause: "존재하지 않는 단일 위치에 대입해 append처럼 사용하려 했습니다.", checks: ["현재 len과 대입 index를 확인합니다.", "교체인지 끝 추가인지 요구를 구분합니다.", "앞선 삭제로 위치가 바뀌었는지 봅니다."], fix: "기존 위치 교체는 유효 인덱스, 끝 추가는 append, 범위 삽입은 슬라이스 대입 또는 insert를 사용합니다.", prevention: "변경 전 길이와 기대 상태를 assert하는 테스트를 둡니다." },
      ],
    },
    {
      id: "remove-pop-del-clear",
      title: "값·위치·범위·전체 삭제를 구분합니다",
      lead: "remove는 첫 같은 값, pop은 위치와 반환값, del은 문법적 위치·범위, clear는 전체 요소 삭제에 맞습니다.",
      explanations: [
        "remove(value)는 ==로 첫 일치 요소만 지우고 없으면 ValueError입니다. 중복을 모두 지우려면 컴프리헨션이나 반복 필터를 사용합니다. remove가 몇 개를 지웠는지 반환하지 않으므로 상태를 별도로 확인합니다.",
        "pop(index)는 해당 요소를 삭제하고 그 값을 반환합니다. index를 생략하면 마지막 요소입니다. 빈 list pop은 IndexError입니다. 큐의 앞 pop(0)을 반복하면 이동 비용이 커져 deque.popleft가 더 적합할 수 있습니다.",
        "del items[index]와 del items[start:stop]은 값을 반환하지 않는 문장입니다. del items는 list 내부를 비우는 것이 아니라 이름 바인딩을 제거합니다. items.clear()는 동일 list 객체를 유지하며 요소를 모두 제거해 alias에서도 빈 상태가 보입니다.",
        "삭제하면서 같은 list를 앞에서 순회하면 인덱스가 당겨져 요소를 건너뛸 수 있습니다. 필터링 결과를 새 list로 만들거나 역순 인덱스로 삭제하고, 어떤 방식이 원본 보존 계약에 맞는지 결정합니다.",
      ],
      concepts: [
        { term: "값 기반 삭제", definition: "위치가 아니라 ==로 일치하는 첫 요소를 찾고 제거하는 remove 계약입니다.", detail: ["중복 중 첫 값만 지웁니다.", "없으면 ValueError입니다."] },
        { term: "소비(pop)", definition: "컨테이너에서 요소를 제거하면서 그 값을 호출자에게 반환하는 동작입니다.", detail: ["스택의 마지막 항목 처리에 자연스럽습니다.", "빈 상태와 위치 오류를 처리해야 합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "ValueError: list.remove(x): x not in list가 발생한다.", likelyCause: "remove 대상과 같은 요소가 없거나 정규화·타입 차이로 ==가 False입니다.", checks: ["target in items와 repr을 확인합니다.", "문자열 공백·대소문자와 숫자/문자열 타입을 비교합니다.", "없음이 정상인지 데이터 오류인지 정합니다."], fix: "정상적인 선택 삭제면 membership을 먼저 검사하고, 반드시 있어야 하면 ValueError를 의미 있는 도메인 오류로 변환합니다.", prevention: "존재·부재·중복 대상 테스트를 작성합니다." },
        { symptom: "반복문에서 삭제했더니 일부 대상이 남는다.", likelyCause: "현재 list를 정방향 순회하면서 삭제해 다음 요소 인덱스가 앞으로 당겨졌습니다.", checks: ["인접한 삭제 대상 두 개로 재현합니다.", "순회 대상과 변경 대상이 같은 객체인지 확인합니다.", "원본 변경이 꼭 필요한지 검토합니다."], fix: "조건에 맞는 새 list를 만들거나 복사본을 순회하고, 위치 삭제면 역순을 고려합니다.", prevention: "연속 대상·첫·마지막·전체 대상 입력을 테스트합니다." },
      ],
    },
    {
      id: "sort-and-sorted",
      title: "sort는 원본을 바꾸고 sorted는 새 리스트를 반환합니다",
      lead: "정렬 기준을 key로 값에 이름 붙이고, 원본 보존과 반환 계약에 따라 두 API를 선택합니다.",
      explanations: [
        "items.sort()는 같은 list를 오름차순 정렬하고 None을 반환합니다. sorted(iterable)는 원본을 바꾸지 않고 새 list를 반환하며 tuple·generator 같은 다른 iterable도 받을 수 있습니다. 원본 순서가 데이터 의미라면 sorted를 사용합니다.",
        "Python 3에서는 int와 str처럼 자연 순서를 정의하지 않은 타입을 직접 섞어 정렬하면 TypeError입니다. 모두 str로 강제하면 '10'이 '2'보다 먼저 오는 사전식 결과가 될 수 있습니다. 데이터 타입을 정규화하거나 key로 명시적 기준을 정합니다.",
        "key 함수는 각 요소에서 비교 키를 한 번 계산합니다. records.sort(key=lambda item:item['score'], reverse=True)처럼 사용합니다. 문자열 대소문자 무시 정렬에는 key=str.casefold를 고려하지만 표시 원본은 보존합니다.",
        "Python 정렬은 안정적입니다. 같은 key인 요소의 이전 상대 순서를 유지하므로 보조 기준으로 먼저 정렬하고 주 기준으로 다시 안정 정렬할 수 있습니다. 더 직접적으로는 tuple key=(primary,secondary)를 사용합니다.",
      ],
      concepts: [
        { term: "정렬 key", definition: "각 요소에서 비교에 사용할 값을 추출하는 함수입니다.", detail: ["원본 요소를 변환하지 않고 정렬 관점만 제공합니다.", "key 결과끼리 서로 비교 가능해야 합니다."] },
        { term: "안정 정렬", definition: "정렬 key가 같은 요소들의 원래 상대 순서를 보존하는 성질입니다.", detail: ["여러 기준 정렬을 단계적으로 구성할 수 있습니다.", "동점의 입력 순서가 의미 있을 때 중요합니다."] },
      ],
      codeExamples: [
        {
          id: "sorting-records-safely",
          title: "원본 보존과 복합 key로 학습 기록 정렬",
          language: "python",
          filename: "sorting_records.py",
          purpose: "원본 ex07의 sort·reverse를 실제 레코드 정렬로 확장하고 in-place와 새 결과를 비교합니다.",
          code: "records = [\n    {'name': 'Java', 'score': 85},\n    {'name': 'python', 'score': 92},\n    {'name': 'React', 'score': 85},\n]\n\nby_name = sorted(records, key=lambda item: item['name'].casefold())\nby_score = sorted(records, key=lambda item: (-item['score'], item['name'].casefold()))\nprint([item['name'] for item in records])\nprint([item['name'] for item in by_name])\nprint([(item['name'], item['score']) for item in by_score])\n\nnumbers = [3, 1, 2]\nresult = numbers.sort()\nprint(result, numbers)",
          walkthrough: [
            { lines: "1-5", explanation: "dict 세 개를 입력 순서로 가진 list를 준비합니다." },
            { lines: "7", explanation: "casefold 이름 key로 새 정렬 list를 만들고 records는 보존합니다." },
            { lines: "8", explanation: "점수는 음수 key로 내림차순, 동점은 이름 오름차순인 tuple key를 사용합니다." },
            { lines: "9-11", explanation: "원본·이름·복합 기준 순서를 나란히 출력합니다." },
            { lines: "13-15", explanation: "sort 반환 None과 변경된 numbers [1,2,3]을 함께 확인합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "sorting_records.py를 저장"], command: "python sorting_records.py" },
          output: { value: "['Java', 'python', 'React']\n['Java', 'python', 'React']\n[('python', 92), ('Java', 85), ('React', 85)]\nNone [1, 2, 3]", explanation: ["현재 세 이름은 casefold 순서에서도 원본과 같지만 새 list라는 계약은 유지됩니다.", "동점 85에서는 이름 key로 Java가 React보다 앞섭니다.", "sort를 result에 받으면 None이라는 함정을 마지막 줄이 증명합니다."] },
          experiments: [
            { change: "by_name key를 제거하고 records를 직접 sorted합니다.", prediction: "dict끼리 < 비교를 지원하지 않아 TypeError가 납니다.", result: "복합 객체 정렬에는 명시적 key가 필요함을 확인합니다." },
            { change: "numbers.sort(reverse=True)를 사용합니다.", prediction: "numbers가 [3,2,1]로 바뀌고 반환은 계속 None입니다.", result: "내림차순을 sort 후 reverse 두 번 대신 한 호출로 표현합니다." },
          ],
          sourceRefs: ["py-list-sort", "py-day02-note"],
        },
      ],
      diagnostics: [
        { symptom: "TypeError: '<' not supported between instances of 'int' and 'str'가 발생한다.", likelyCause: "직접 비교 순서가 없는 혼합 타입을 key 없이 정렬했습니다.", checks: ["각 요소 type 집합을 확인합니다.", "원래 데이터가 같은 도메인 타입이어야 하는지 검증합니다.", "숫자 정렬인지 표시 문자열 정렬인지 정합니다."], fix: "입력 타입을 정규화하거나 명시적 key를 사용합니다. 무조건 str 변환이 업무 순서에 맞는지 검토합니다.", prevention: "혼합·결측·동점·대소문자 입력 정렬 테스트를 둡니다." },
      ],
      expertNotes: ["key 함수는 요소 수만큼 호출되므로 네트워크·DB 조회처럼 비싼 부작용을 넣지 말고 필요한 값을 먼저 준비합니다."],
    },
    {
      id: "reverse-copy-contracts",
      title: "reverse·reversed·슬라이스와 복사 범위를 구분합니다",
      lead: "reverse는 원본 순서 변경, reversed는 역순 iterator, [::-1]은 새 list입니다. 목적과 크기에 따라 선택합니다.",
      explanations: [
        "items.reverse()는 같은 list를 뒤집고 None을 반환합니다. reversed(items)는 원본을 바꾸지 않고 역순 iterator를 반환해 한 번씩 순회할 수 있습니다. 실제 list가 필요하면 list(reversed(items))로 구체화합니다.",
        "items[::-1]은 역순 새 list를 간단히 만듭니다. 전체 요소 참조를 복사하므로 매우 큰 list에서는 메모리를 사용합니다. 출력 한 번이면 reversed iterator가 적합할 수 있습니다.",
        "items.copy(), list(items), items[:]는 바깥 list 얕은 복사입니다. 중첩 dict·list는 공유됩니다. 완전 독립이 필요한지, 일부 큰 불변 객체 공유가 필요한지 객체 그래프와 변경 요구로 결정합니다.",
        "copy.deepcopy는 순환 참조를 처리할 수 있지만 외부 자원과 사용자 정의 객체에 항상 올바른 의미는 아닙니다. 도메인 복사 함수로 식별자·생성 시간·공유 캐시 정책을 명시할 수 있습니다.",
      ],
      concepts: [
        { term: "iterator view", definition: "요소를 즉시 새 list로 복사하지 않고 요청될 때 순서대로 제공하는 객체입니다.", detail: ["reversed 결과는 인덱스 가능한 list가 아닙니다.", "원본 변경 시 iterator 동작을 예측하기 어려우므로 순회 중 원본을 변경하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "reversed(items)[0]에서 TypeError가 발생한다.", likelyCause: "reversed 결과를 list처럼 인덱싱 가능한 컨테이너로 오해했습니다.", checks: ["type과 iter 결과를 확인합니다.", "전체 구체 list가 필요한지 한 번 순회만 필요한지 결정합니다.", "원본을 변경해도 되는지 확인합니다."], fix: "인덱스가 필요하면 list(reversed(items))를 만들고, 순회만 필요하면 for에서 그대로 사용합니다.", prevention: "iterable, iterator, sequence 반환 계약을 타입 힌트로 구분합니다." },
      ],
    },
    {
      id: "mutation-design-performance",
      title: "변경 API는 상태·성능·동시성 계약까지 포함합니다",
      lead: "어떤 메서드를 쓸지는 문법보다 원본 보존, 실패, 요소 수, 접근 방향과 공유 범위로 결정합니다.",
      explanations: [
        "함수가 list를 받아 변경하면 이름에 mutate, update_in_place 같은 의도를 드러내고 반환을 None으로 할지 같은 객체를 반환할지 팀 규칙을 정합니다. 새 list를 반환하는 함수는 입력 보존 테스트를 둡니다.",
        "list는 동적 배열이라 끝 append·pop은 평균적으로 빠르고, 중간 insert·remove·pop(0)은 뒤 요소 이동이 필요합니다. 앞뒤 큐는 deque, 우선순위는 heapq, 빠른 존재 검사는 set처럼 작업에 맞는 자료구조를 선택합니다.",
        "여러 스레드·비동기 작업이 같은 list를 수정하면 복합 연산의 원자성이 보장되지 않습니다. CPython 구현 세부에 기대지 말고 lock, queue, 메시지 전달 또는 불변 스냅샷을 사용합니다.",
        "외부 입력으로 index·반복 크기·정렬 key를 받으면 범위를 검증합니다. 거대한 list 정렬과 확장, 악성 key 계산은 CPU·메모리 고갈을 일으킬 수 있습니다. 요청당 최대 항목 수와 timeout을 둡니다.",
      ],
      concepts: [
        { term: "변경 계약", definition: "함수가 입력 객체를 바꾸는지, 무엇을 반환하고 실패 시 상태가 어떤지 정한 인터페이스 약속입니다.", detail: ["호출자와 함수가 공유 mutable 상태를 예측하게 합니다.", "테스트에는 원본 보존 또는 의도한 변경을 명시합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "원본을 정렬할까요, 정렬된 복사본을 만들까요?", options: [
          { name: "list.sort", chooseWhen: "현재 list 순서를 더 이상 보존할 필요가 없고 메모리 복사를 줄이고 싶을 때", avoidWhen: "다른 코드가 입력 순서를 사용하거나 같은 객체를 공유할 때", tradeoffs: ["같은 list를 변경합니다.", "반환은 None입니다.", "alias 모두에서 순서가 바뀝니다."] },
          { name: "sorted", chooseWhen: "원본 순서를 보존하거나 모든 iterable에서 정렬 list를 얻고 싶을 때", avoidWhen: "매우 큰 데이터에서 복사 메모리가 허용되지 않고 원본 변경이 안전할 때", tradeoffs: ["새 list를 반환합니다.", "원본을 보존합니다.", "추가 list 메모리가 필요합니다."] },
        ] },
      ],
      expertNotes: ["정렬은 O(n log n)이지만 key 계산과 데이터 이동 비용도 측정해야 합니다. DB에서 가져온 전체 데이터를 Python에서 정렬하기 전에 인덱스와 ORDER BY, 페이지네이션을 검토합니다.", "감사 로그나 이벤트 이력처럼 순서가 증거인 list는 in-place 정렬·삭제를 금지하고 새 뷰를 생성하는 편이 안전합니다."],
    },
  ],
  lab: {
    title: "학습 할 일 큐 CRUD와 정렬 정책",
    scenario: "학습 할 일을 dict list로 관리하면서 추가·삽입·완료 제거·우선순위 정렬·원본 보존 보고서를 구현합니다.",
    setup: ["task_list_lab.py를 만듭니다.", "title, priority, done 필드가 있는 합성 dict 세 개를 준비합니다.", "Python 3.11 이상에서 실행합니다."],
    steps: ["append와 insert로 할 일을 추가하고 각 상태를 출력합니다.", "없는 title remove 대신 검색 후 구체 오류를 내는 함수를 만듭니다.", "pop으로 다음 완료 작업을 소비하고 반환값을 기록합니다.", "sorted와 tuple key로 done=False 우선, priority 내림차순, title 오름차순 보고서를 만듭니다.", "원본 순서가 유지되는지 assert합니다.", "얕은 복사 보고서의 dict를 변경해 공유 문제를 재현하고 도메인 복사 정책을 정합니다.", "빈 list pop과 10,000개 앞 insert의 비용을 작은 benchmark로 비교합니다."],
    expectedResult: ["각 CRUD 연산의 변경 위치와 반환값이 예측대로입니다.", "정렬 보고서는 원본 순서를 바꾸지 않습니다.", "없는 값·빈 pop이 구체 오류 경로로 처리됩니다.", "바깥 복사만으로 dict가 독립하지 않음을 설명합니다."],
    cleanup: ["benchmark는 작은 합성 데이터로만 실행하고 결과가 환경 의존임을 기록합니다."],
    extensions: ["deque 기반 큐와 list pop(0)을 비교합니다.", "Task dataclass로 위치·문자열 key 오류를 줄입니다.", "동점 정렬의 안정성을 입력 순서 변경으로 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "과일 목록에 CRUD 메서드를 하나씩 적용하고 반환값을 기록하세요.", requirements: ["append, insert, 요소 대입, remove, pop, del, extend를 모두 사용합니다.", "각 단계의 list와 메서드 반환을 출력합니다.", "없는 값 remove와 빈 pop 오류를 재현합니다."], hints: ["대부분 변경 메서드는 None, pop만 삭제 값을 반환합니다.", "오류 예제는 정상 흐름과 분리합니다."], expectedOutcome: "상태 변화와 반환 계약을 혼동하지 않는 실행 기록이 완성됩니다.", solutionOutline: ["초기 list를 만듭니다.", "한 문장 실행 후 바로 상태를 기록합니다.", "마지막에 실패 경계를 try/except로 관찰합니다."] },
    { difficulty: "응용", prompt: "학생 레코드를 점수·이름·등록순으로 정렬하세요.", requirements: ["원본 list를 보존합니다.", "점수 내림차순, 동점 이름 casefold 오름차순을 tuple key로 구현합니다.", "같은 key 두 레코드의 안정 정렬을 증명합니다.", "혼합 score 타입 오류를 검증 단계에서 잡습니다."], hints: ["음수 score key 또는 reverse와 보조 기준 관계를 주의합니다.", "key가 같은 항목은 입력 상대 순서를 유지합니다."], expectedOutcome: "복합 key와 안정성, 입력 타입 계약이 있는 정렬 함수가 완성됩니다." },
    { difficulty: "설계", prompt: "협업 일정 보드의 변경·복사·정렬 API를 설계하세요.", requirements: ["함수별 원본 변경 여부와 반환 타입을 명시합니다.", "중첩 담당자·태그 객체의 복사 정책을 정합니다.", "동시 편집 충돌과 최대 항목 수를 다룹니다.", "삭제 감사 이력과 사용자 정렬 뷰를 분리합니다.", "정상·오류·성능 경계 테스트를 작성합니다."], hints: ["감사 원본을 in-place 정렬하지 마세요.", "deepcopy가 식별자·외부 자원까지 올바르게 복사하는지 검토합니다."], expectedOutcome: "list 메서드를 실제 다중 사용자 상태·감사·성능 계약으로 확장한 API 설계가 완성됩니다." },
  ],
  reviewQuestions: [
    { question: "append와 extend의 핵심 차이는 무엇인가요?", answer: "append는 인수 전체를 한 요소로, extend는 iterable의 각 항목을 여러 요소로 추가합니다." },
    { question: "items = items.sort()가 왜 잘못되나요?", answer: "sort는 같은 list를 변경하고 None을 반환하므로 items가 None으로 재바인딩됩니다." },
    { question: "remove와 pop은 삭제 기준과 반환이 어떻게 다른가요?", answer: "remove는 첫 같은 값을 지우고 None, pop은 위치를 지우고 삭제 값을 반환합니다." },
    { question: "del items와 items.clear()는 무엇이 다른가요?", answer: "del items는 이름 바인딩을 제거하고 clear는 같은 list 객체의 요소를 모두 제거해 alias에서도 빈 list가 보입니다." },
    { question: "sort가 혼합 int·str에서 실패하는 이유는 무엇인가요?", answer: "Python 3에서 두 타입 사이의 자연 대소 순서가 정의되지 않았기 때문입니다. 입력 정규화 또는 명시 key가 필요합니다." },
    { question: "reverse()와 reversed()의 차이는 무엇인가요?", answer: "reverse는 원본 list를 바꾸고 None, reversed는 원본을 보존하는 역순 iterator를 반환합니다." },
    { question: "list.copy() 후 내부 dict 변경이 원본에 보이는 이유는 무엇인가요?", answer: "바깥 list만 새로 만들고 내부 dict 객체 참조를 공유하는 얕은 복사이기 때문입니다." },
  ],
  completionChecklist: [
    "append·insert·extend의 요소 단위를 설명할 수 있다.",
    "인덱스·슬라이스 대입으로 요소와 길이가 어떻게 바뀌는지 예측할 수 있다.",
    "remove·pop·del·clear를 실패·반환 요구에 맞게 선택할 수 있다.",
    "in-place 메서드의 None 반환을 재대입하지 않는다.",
    "sort·sorted와 reverse·reversed의 변경·반환 계약을 구분한다.",
    "key·tuple key·reverse·안정 정렬로 복합 정렬을 구현할 수 있다.",
    "얕은 복사와 중첩 공유, 자료구조별 성능·동시성 경계를 설명할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-list-crud", repository: "PYTHON-BASIC", path: "day02/ex06_list.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day02/ex06_list.py", usedFor: ["append·insert", "요소 수정", "remove·pop·del", "상태·반환 출력"], evidence: "Python 3.13.9에서 원본을 실행해 과일 추가·수정·첫 값 삭제, pop 포도·바나나와 del 슬라이스 결과를 확인했습니다." },
    { id: "py-list-sort", repository: "PYTHON-BASIC", path: "day02/ex07_list.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day02/ex07_list.py", usedFor: ["sort·reverse", "혼합 타입 실패", "+와 extend 차이", "실행 결과"], evidence: "원본 실행에서 Unicode 문자열 정렬, 역순, 내림차순, + 원본 보존과 extend 원본 변경 결과를 확인했습니다." },
    { id: "py-day02-note", repository: "PYTHON-BASIC", path: "notes/day02_string_list_tuple.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day02_string_list_tuple.md", usedFor: ["CRUD 메서드 표", "정렬·확장", "셀프 체크"], evidence: "원본 노트의 메서드 범위를 유지하고 key·안정 정렬·복사·성능 계약을 보강했습니다." },
  ],
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["컴프리헨션 기반 필터는 py-020, 함수의 mutable 기본값은 py-022에서 실습합니다.", "deque·동시성·deepcopy 정책은 원본 공백을 전문가 관점으로 보강했습니다."] },
} satisfies DetailedSession;

const expertChapters: DetailedSession["chapters"] = [
  {
    id: "crud-return-failure-cardinality",
    title: "CRUD 메서드의 반환·실패·cardinality 계약을 먼저 고정합니다",
    lead: "append·extend·insert·remove·pop·clear는 비슷한 변경처럼 보여도 추가 단위, 삭제 기준, 누락 처리와 반환값이 서로 다릅니다.",
    explanations: [
      "append(value)는 value 하나를 끝에 넣고 None을 반환합니다. value가 list여도 중첩된 한 요소가 되며, extend(iterable)는 iterable의 각 항목을 현재 list 끝에 펼칩니다.",
      "extend('abc')는 문자열도 iterable이므로 'a','b','c' 세 요소를 추가합니다. 문자열 하나를 추가하려면 append를 사용하거나 입력 schema에서 iterable-of-items와 scalar를 구분해야 합니다.",
      "insert(index, value)는 범위를 벗어난 index도 양끝으로 clamp하며 예외를 내지 않습니다. 위치가 반드시 유효해야 한다면 대입/사전 검증과 다른 계약이 필요합니다.",
      "remove(value)는 처음 같은 값 하나만 삭제하고 없으면 ValueError, pop(index)는 삭제한 값을 반환하고 범위를 벗어나면 IndexError입니다. discard 같은 조용한 삭제를 기대하면 안 됩니다.",
      "변경 메서드가 None을 반환하는 관례는 in-place mutation을 드러냅니다. items = items.sort()처럼 재바인딩하지 말고 mutation 전후 state와 반환값을 각각 검증합니다.",
    ],
    concepts: [
      { term: "mutation return contract", definition: "객체를 직접 바꾸는 메서드가 반환하는 값과 실패 방식에 대한 약속입니다.", detail: ["list 메서드는 대개 None입니다.", "pop은 제거된 값을 반환합니다."] },
      { term: "cardinality", definition: "한 호출이 하나의 요소를 추가하는지 iterable의 여러 요소를 펼치는지에 대한 계약입니다.", detail: ["append와 extend를 구분합니다.", "문자열 iterable 함정을 포함합니다."] },
    ],
    codeExamples: [{
      id: "list-crud-contract-matrix",
      title: "append·extend·insert·remove·pop의 상태와 오류를 비교합니다",
      language: "python",
      filename: "list_crud_contracts.py",
      purpose: "각 CRUD operation의 cardinality, 반환값과 exception type을 exact output으로 고정합니다.",
      code: String.raw`items = ["python"]
append_result = items.append(["java", "jsp"])
print("after_append:", items, "return:", append_result)

extend_result = items.extend("AI")
print("after_extend_string:", items, "return:", extend_result)

items.insert(999, "tail")
items.insert(-999, "head")
print("after_insert_clamp:", items)

try:
    items.remove("missing")
except ValueError as error:
    print("remove_error:", type(error).__name__)

removed = items.pop()
print("popped:", removed, "remaining:", items)
try:
    [].pop()
except IndexError as error:
    print("pop_error:", type(error).__name__)`,
      walkthrough: [
        { lines: "1-7", explanation: "append가 list 하나를 중첩하고 extend가 문자열 characters를 펼치며 둘 다 None을 반환하는 것을 봅니다." },
        { lines: "9-11", explanation: "insert가 아주 큰/작은 index를 양끝으로 clamp하는 계약을 확인합니다." },
        { lines: "13-22", explanation: "remove의 ValueError와 pop의 반환값·IndexError를 type 수준으로 분류합니다." },
      ],
      run: { environment: ["Python 3.13+", "stdin/network 불필요"], command: "python -I -B list_crud_contracts.py" },
      output: { value: "after_append: ['python', ['java', 'jsp']] return: None\nafter_extend_string: ['python', ['java', 'jsp'], 'A', 'I'] return: None\nafter_insert_clamp: ['head', 'python', ['java', 'jsp'], 'A', 'I', 'tail']\nremove_error: ValueError\npopped: tail remaining: ['head', 'python', ['java', 'jsp'], 'A', 'I']\npop_error: IndexError", explanation: ["상태와 반환값을 분리해 출력합니다.", "예외 message 대신 안정된 exception type을 검증합니다."] },
      experiments: [
        { change: "append('AI')를 사용합니다.", prediction: "문자열 전체가 한 요소로 추가됩니다.", result: "cardinality 선택이 데이터 shape를 바꿉니다." },
        { change: "remove가 여러 번 존재하는 값을 삭제합니다.", prediction: "첫 번째 같은 요소만 삭제됩니다.", result: "전체 필터가 필요하면 comprehension/slice assignment를 씁니다." },
        { change: "insert 전에 index 범위를 강제합니다.", prediction: "clamp 대신 업무 오류를 반환할 수 있습니다.", result: "builtin contract 위에 domain policy를 둡니다." },
      ],
      sourceRefs: ["py-list-methods", "py-list-tutorial", "py-mutable-sequence"],
    }],
    diagnostics: [
      { symptom: "리스트에 문자열 한 개 대신 문자들이 각각 들어간다.", likelyCause: "scalar string에 extend를 호출했습니다.", checks: ["argument type과 append/extend 호출을 봅니다.", "expected element schema를 확인합니다."], fix: "한 문자열은 append하고 여러 strings만 extend합니다.", prevention: "scalar/list inputs를 구분하는 type hint와 tests를 둡니다." },
      { symptom: "sort나 append 뒤 변수가 None이 된다.", likelyCause: "in-place method의 None 반환값으로 같은 이름을 재바인딩했습니다.", checks: ["assignment 오른쪽의 mutation method를 찾습니다.", "mutation 전 object id와 반환값을 봅니다."], fix: "mutation method는 별도 statement로 호출하거나 새 값이 필요하면 sorted/연결을 씁니다.", prevention: "lint rule과 return-contract review checklist를 둡니다." },
    ],
  },
  {
    id: "stable-sort-key-policy",
    title: "stable sort와 key 함수를 이용해 다중 정렬 정책을 재현 가능하게 만듭니다",
    lead: "정렬은 단순한 오름차순이 아니라 key 추출, tie 순서, None·대소문자·locale와 원본 보존 정책의 조합입니다.",
    explanations: [
      "Python sort와 sorted는 stable합니다. key가 같은 records는 입력에서의 상대 순서를 유지하므로 기존 우선순위를 보존하거나 다중 pass 정렬을 구성할 수 있습니다.",
      "key 함수는 각 요소에 한 번 호출되고 반환 key끼리 비교됩니다. comparator 안에서 parsing·network·mutable state를 읽는 대신 사전에 검증된 값으로 pure key를 만듭니다.",
      "reverse=True도 stability를 유지합니다. 숫자 하나에 음수를 붙이는 방식은 여러 field와 non-numeric keys에서 의도를 흐릴 수 있으므로 tuple key 또는 stable passes를 사용합니다.",
      "str.lower보다 casefold가 Unicode caseless ordering key에 적합하지만 인간 언어의 collation과는 다릅니다. locale/ICU 정렬은 별도 제품 요구입니다.",
      "None과 str 같은 서로 직접 비교할 수 없는 값은 key가 (is_missing, normalized_value) 같은 일관된 comparable shape를 반환하도록 정책을 명시합니다.",
    ],
    concepts: [
      { term: "stable sort", definition: "정렬 key가 같은 요소의 입력 상대 순서를 보존하는 정렬입니다.", detail: ["tie-breaking을 예측할 수 있습니다.", "다중 pass 정렬이 가능합니다."] },
      { term: "key function", definition: "각 원소에서 정렬에 사용할 비교 가능 값을 한 번 추출하는 함수입니다.", detail: ["pure하고 cheap해야 합니다.", "tuple key로 여러 기준을 표현합니다."] },
    ],
    codeExamples: [{
      id: "stable-sort-key-evidence",
      title: "tie stability·복합 key·None policy를 검증합니다",
      language: "python",
      filename: "stable_sort_keys.py",
      purpose: "입력 순서 보존과 명시적 tie-break/None 정렬 정책을 deterministic records로 확인합니다.",
      code: String.raw`records = [
    {"seq": 1, "name": "Straße", "score": 90},
    {"seq": 2, "name": "alpha", "score": 90},
    {"seq": 3, "name": "Beta", "score": 80},
    {"seq": 4, "name": None, "score": 90},
]

by_score = sorted(records, key=lambda row: row["score"], reverse=True)
print("stable_tie:", [row["seq"] for row in by_score])

def name_key(row):
    name = row["name"]
    return (name is None, "" if name is None else name.casefold())

by_name = sorted(records, key=name_key)
print("name_policy:", [(row["seq"], row["name"]) for row in by_name])

by_score_then_name = sorted(records, key=lambda row: (-row["score"], name_key(row)))
print("compound:", [row["seq"] for row in by_score_then_name])
print("original:", [row["seq"] for row in records])`,
      walkthrough: [
        { lines: "1-8", explanation: "동점 records의 입력 seq를 포함해 안정성을 관찰할 fixture를 만듭니다." },
        { lines: "9-16", explanation: "score 동점 순서와 None-last/casefold name key 정책을 각각 적용합니다." },
        { lines: "18-20", explanation: "tuple key로 score descending/name ascending을 결합하고 sorted가 원본을 보존함을 확인합니다." },
      ],
      run: { environment: ["Python 3.13+", "locale/network 불필요"], command: "python -I -B stable_sort_keys.py" },
      output: { value: "stable_tie: [1, 2, 4, 3]\nname_policy: [(2, 'alpha'), (3, 'Beta'), (1, 'Straße'), (4, None)]\ncompound: [2, 1, 4, 3]\noriginal: [1, 2, 3, 4]", explanation: ["동점 score의 입력 순서는 유지됩니다.", "복합 key가 전체 tie 정책을 명시합니다."] },
      experiments: [
        { change: "seq를 최종 tuple key에 추가합니다.", prediction: "입력 순서와 독립된 명시적 deterministic tie-break가 됩니다.", result: "pagination용 total order를 만들 수 있습니다." },
        { change: "name.lower를 casefold로 바꿉니다.", prediction: "Unicode 특수 case의 비교 key가 더 넓게 정규화됩니다.", result: "locale collation과는 여전히 다릅니다." },
        { change: "key 안에서 int 변환을 시도합니다.", prediction: "잘못된 한 record가 전체 sort를 중단합니다.", result: "정렬 전 validation/parsing을 수행합니다." },
      ],
      sourceRefs: ["py-sorting-howto", "py-list-sort-api", "py-operator-itemgetter"],
    }],
    diagnostics: [
      { symptom: "동점 records의 페이지 순서가 실행마다 흔들린다.", likelyCause: "입력 source 순서가 불안정하고 total tie-break key가 없습니다.", checks: ["sort key가 unique total order인지 봅니다.", "DB/query/source iteration order를 확인합니다."], fix: "stable source order를 보장하거나 immutable unique id를 최종 key에 추가합니다.", prevention: "동점·pagination·재실행 determinism tests를 둡니다." },
      { symptom: "None이 섞인 정렬에서 TypeError가 난다.", likelyCause: "key가 일부 records에는 None, 다른 records에는 str을 반환해 직접 비교할 수 없습니다.", checks: ["모든 key 결과의 type/shape를 수집합니다.", "missing policy를 확인합니다."], fix: "(is_missing, normalized_value)처럼 항상 비교 가능한 동일 tuple shape를 반환합니다.", prevention: "None·empty·Unicode·동점 cases를 key contract test에 포함합니다." },
    ],
  },
  {
    id: "copy-and-iteration-mutation-safety",
    title: "복사 깊이와 순회 중 변경을 별도 위험으로 다룹니다",
    lead: "얕은 복사가 nested mutation을 격리하지 못하는 문제와, 같은 list를 순회하며 구조를 바꿔 요소를 건너뛰는 문제는 서로 다른 계약 위반입니다.",
    explanations: [
      "list.copy와 slice는 새 바깥 list를 만들지만 nested mutable elements를 공유합니다. snapshot이 nested state까지 고정돼야 하면 immutable value 또는 명시적 deep/domain copy가 필요합니다.",
      "for loop는 내부 index를 앞으로 이동합니다. 같은 list에서 remove/insert하면 뒤 요소 위치가 당겨지거나 밀려 일부 요소를 건너뛰거나 다시 볼 수 있습니다.",
      "필터링은 새 list comprehension을 만들어 이름을 재바인딩하는 방식이 가장 명확합니다. 기존 list identity를 다른 소비자가 공유한다면 items[:] = filtered처럼 slice assignment로 contents만 원자적 단계에서 교체합니다.",
      "삭제 대상을 먼저 수집하거나 reversed indices로 삭제하는 방법도 있지만 duplicate values와 index drift를 고려해야 합니다.",
      "multi-thread safety는 별도입니다. GIL에 기대어 여러 단계 CRUD invariant를 보호하지 말고 ownership, queue 또는 lock을 설계합니다.",
    ],
    concepts: [
      { term: "structural mutation", definition: "순회 중 컨테이너 길이 또는 요소 위치를 바꾸는 추가·삭제 연산입니다.", detail: ["iteration cursor와 충돌합니다.", "새 collection 생성이 안전합니다."] },
      { term: "identity-preserving replacement", definition: "list 객체 자체는 유지하면서 slice assignment로 전체 내용을 새 결과로 교체하는 방식입니다.", detail: ["aliases가 새 contents를 봅니다.", "필터 계산과 교체를 분리합니다."] },
    ],
    codeExamples: [{
      id: "list-copy-iteration-mutation",
      title: "얕은 copy 공유와 순회 삭제 skip을 재현하고 수정합니다",
      language: "python",
      filename: "list_copy_iteration.py",
      purpose: "두 종류의 mutation bug를 exact state transition으로 분리합니다.",
      code: String.raw`original = [["a"], ["b"]]
snapshot = original.copy()
original[0].append("shared")
print("shallow_original:", original)
print("shallow_snapshot:", snapshot)

broken = [2, 4, 6, 7]
for value in broken:
    if value % 2 == 0:
        broken.remove(value)
print("broken_filter:", broken)

shared = [2, 4, 6, 7]
alias = shared
filtered = [value for value in shared if value % 2 != 0]
shared[:] = filtered
print("safe_filter:", shared)
print("identity_preserved:", shared is alias, alias)`,
      walkthrough: [
        { lines: "1-5", explanation: "얕은 copy가 nested row를 공유해 snapshot도 변경되는 것을 확인합니다." },
        { lines: "7-11", explanation: "같은 list 순회 중 remove가 인접한4를 건너뛰는 broken 결과를 재현합니다." },
        { lines: "13-18", explanation: "새 필터 결과를 계산한 뒤 slice assignment해 aliases와 identity를 유지합니다." },
      ],
      run: { environment: ["Python 3.13+", "thread/network 불필요"], command: "python -I -B list_copy_iteration.py" },
      output: { value: "shallow_original: [['a', 'shared'], ['b']]\nshallow_snapshot: [['a', 'shared'], ['b']]\nbroken_filter: [4, 7]\nsafe_filter: [7]\nidentity_preserved: True [7]", explanation: ["얕은 copy와 iteration mutation의 결과를 별도로 관찰합니다.", "slice assignment는 list identity를 보존합니다."] },
      experiments: [
        { change: "for value in broken[:]로 순회합니다.", prediction: "복사본을 순회하므로 원본에서 모든 짝수를 제거합니다.", result: "작은 list에는 유효하지만 추가 O(n) memory가 듭니다." },
        { change: "shared = filtered로 재바인딩합니다.", prediction: "alias는 이전 list contents를 계속 봅니다.", result: "identity 유지 요구가 있을 때 slice assignment가 필요합니다." },
        { change: "nested row를 tuple로 저장합니다.", prediction: "얕은 snapshot에서 내부 mutation 경로가 사라집니다.", result: "immutable values가 copy policy를 단순화합니다." },
      ],
      sourceRefs: ["py-copy-module", "py-for-statement", "py-deque-choice"],
    }],
    diagnostics: [
      { symptom: "조건에 맞는 요소를 삭제했는데 일부가 남는다.", likelyCause: "같은 list를 순회하면서 remove해 iteration index와 요소 위치가 어긋났습니다.", checks: ["loop 대상과 변경 대상이 같은 identity인지 확인합니다.", "인접한 matching values로 재현합니다."], fix: "comprehension으로 새 결과를 만들거나 copy를 순회하고 원본을 변경합니다.", prevention: "adjacent duplicates와 all-match cases를 test합니다." },
      { symptom: "새 list로 필터했더니 다른 component는 이전 내용을 본다.", likelyCause: "공유 list 이름만 새 객체로 재바인딩해 aliases가 분리됐습니다.", checks: ["is 관계와 object owner를 확인합니다.", "API가 identity preservation을 약속하는지 봅니다."], fix: "공유 identity가 계약이면 slice assignment로 contents를 교체하거나 공유 mutable state 자체를 제거합니다.", prevention: "ownership과 identity contract를 명시합니다." },
    ],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...expertChapters);
session.reviewQuestions.push(
  { question: "append와 extend의 추가 단위 차이는 무엇인가요?", answer: "append는 인수 하나를 요소 하나로 넣고 extend는 iterable의 각 항목을 펼칩니다." },
  { question: "insert가 범위 밖 index에서 항상 오류를 내나요?", answer: "아닙니다. 아주 작거나 큰 index를 list 양끝으로 clamp합니다." },
  { question: "remove와 pop의 누락 예외는 무엇인가요?", answer: "remove는 ValueError, pop의 잘못된 index나 빈 list는 IndexError입니다." },
  { question: "Python 정렬의 stable 의미는 무엇인가요?", answer: "key가 같은 요소들의 입력 상대 순서를 유지한다는 뜻입니다." },
  { question: "key 함수는 comparator와 어떻게 다른가요?", answer: "각 요소에서 비교 key를 한 번 추출하고 sort는 그 key들을 비교합니다." },
  { question: "None과 str을 함께 정렬하려면 어떻게 하나요?", answer: "missing 여부와 normalized value를 담은 동일한 tuple shape의 key를 반환합니다." },
  { question: "순회 중 remove가 요소를 건너뛰는 이유는 무엇인가요?", answer: "삭제로 뒤 요소가 당겨져도 loop index는 다음 위치로 이동하기 때문입니다." },
  { question: "slice assignment의 장점은 무엇인가요?", answer: "list identity를 유지하면서 contents를 새 결과로 교체해 기존 aliases도 같은 내용을 보게 합니다." },
);
session.completionChecklist.push(
  "append와 extend의 cardinality를 구분한다.",
  "in-place 메서드의 None 반환값으로 재바인딩하지 않는다.",
  "remove·pop의 반환과 예외 계약을 설명한다.",
  "stable sort의 tie 순서 보존을 검증한다.",
  "pure하고 comparable한 tuple key를 설계한다.",
  "None·Unicode·동점 정렬 정책을 명시한다.",
  "순회 중 structural mutation을 피한다.",
  "재바인딩과 identity-preserving slice assignment를 구분한다.",
);
session.sources.push(
  { id: "py-list-methods", repository: "Python 3 Library Reference", path: "Mutable Sequence Types", publicUrl: "https://docs.python.org/3/library/stdtypes.html#mutable-sequence-types", usedFor: ["append/extend/insert/remove/pop", "mutation contracts"], evidence: "list CRUD의 공식 API 계약입니다." },
  { id: "py-list-tutorial", repository: "Python 3 Tutorial", path: "More on Lists", publicUrl: "https://docs.python.org/3/tutorial/datastructures.html#more-on-lists", usedFor: ["list method behavior", "stack/queue cautions"], evidence: "list methods의 Python 공식 학습 자료입니다." },
  { id: "py-mutable-sequence", repository: "Python 3 Library Reference", path: "Mutable Sequence operations", publicUrl: "https://docs.python.org/3/library/stdtypes.html#mutable-sequence-types", usedFor: ["slice assignment", "index deletion"], evidence: "mutable sequence 공통 operation의 공식 근거입니다." },
  { id: "py-sorting-howto", repository: "Python 3 HOWTO", path: "Sorting Techniques", publicUrl: "https://docs.python.org/3/howto/sorting.html", usedFor: ["stability", "key functions", "multiple sorts"], evidence: "Python 정렬의 공식 HOWTO입니다." },
  { id: "py-list-sort-api", repository: "Python 3 Library Reference", path: "list.sort", publicUrl: "https://docs.python.org/3/library/stdtypes.html#list.sort", usedFor: ["in-place stable sort", "key once"], evidence: "list.sort의 공식 계약입니다." },
  { id: "py-operator-itemgetter", repository: "Python 3 Library Reference", path: "operator.itemgetter", publicUrl: "https://docs.python.org/3/library/operator.html#operator.itemgetter", usedFor: ["declarative record sort keys"], evidence: "field key helper의 공식 API입니다." },
  { id: "py-copy-module", repository: "Python 3 Library Reference", path: "copy", publicUrl: "https://docs.python.org/3/library/copy.html", usedFor: ["shallow/deep copy boundary"], evidence: "copy depth의 공식 근거입니다." },
  { id: "py-for-statement", repository: "Python 3 Language Reference", path: "The for statement", publicUrl: "https://docs.python.org/3/reference/compound_stmts.html#the-for-statement", usedFor: ["iteration progression", "mutation hazard"], evidence: "for statement의 primary language reference입니다." },
  { id: "py-deque-choice", repository: "Python 3 Tutorial", path: "Using Lists as Queues", publicUrl: "https://docs.python.org/3/tutorial/datastructures.html#using-lists-as-queues", usedFor: ["queue container choice"], evidence: "front mutation 대신 deque를 권하는 공식 자료입니다." },
);

export default session;
