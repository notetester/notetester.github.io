import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-021"],
  slug: "python-021-function-contract-scope-return",
  courseId: "python",
  moduleId: "02-control-functions-io",
  order: 21,
  title: "함수 계약·스코프·반환",
  subtitle: "코드를 단순히 묶는 문법을 넘어 입력·출력·실패 조건이 분명한 계약으로 설계하고, 이름의 유효 범위와 반환 흐름을 정확히 추적합니다.",
  level: "중급",
  estimatedMinutes: 135,
  coreQuestion: "함수를 호출하는 사람이 내부 구현을 몰라도 안전하게 사용할 수 있도록 입력·출력·상태 변경·실패를 어떻게 계약으로 표현할까요?",
  summary: "def와 호출의 실행 모델, 매개변수와 인수, 지역 스코프와 LEGB 이름 탐색, return·조기 반환·암시적 None, 여러 값 반환의 tuple 실체를 연결합니다. global에 의존하는 원본 예제를 재현한 뒤 순수 함수·명시적 의존성으로 개선하고, 빈 컬렉션·잘못된 타입·부수 효과를 계약과 테스트 경계로 다룹니다.",
  objectives: [
    "함수 정의와 호출을 서로 다른 실행 시점으로 구분하고 호출 frame에서 매개변수가 지역 이름으로 만들어지는 과정을 설명할 수 있다.",
    "함수의 입력·정상 반환·예외·부수 효과를 하나의 계약으로 문서화할 수 있다.",
    "지역·바깥 함수·전역·내장 이름을 찾는 LEGB 규칙과 이름 가림 현상을 추적할 수 있다.",
    "return이 즉시 현재 함수 호출을 끝낸다는 점과 return이 없는 경로가 None을 반환한다는 점을 예측할 수 있다.",
    "쉼표로 여러 값을 반환할 때 실제 반환 객체는 tuple 하나임을 언패킹과 함께 설명할 수 있다.",
    "global·숨은 상태 변경을 명시적 매개변수와 반환값으로 바꾸고 단위 테스트 가능한 함수를 설계할 수 있다.",
  ],
  prerequisites: [
    { title: "break·continue·for·range", reason: "반복 계산을 함수 경계 안으로 옮기고 조기 종료와 return의 차이를 비교합니다.", sessionSlug: "python-019-break-continue-for-range" },
    { title: "리스트 생성·중첩·가변성", reason: "가변 객체를 인수로 전달할 때 객체 공유와 함수 부수 효과를 판단합니다.", sessionSlug: "python-010-list-creation-nesting-mutability" },
    { title: "입력·형 변환·검증 경계", reason: "문자열 입력을 변환·검증한 뒤 함수 계약에 맞는 값만 전달합니다.", sessionSlug: "python-015-input-conversion-validation-boundary" },
  ],
  keywords: ["Python", "function", "def", "call", "parameter", "argument", "scope", "LEGB", "return", "None", "pure function", "contract"],
  chapters: [
    {
      id: "function-as-contract",
      title: "함수는 코드 묶음이면서 호출자와 구현 사이의 계약입니다",
      lead: "좋은 함수는 이름만 보고도 무엇을 입력받아 무엇을 돌려주며 어떤 상황에서 실패하는지 예측할 수 있어야 합니다.",
      explanations: [
        "def add(a, b):를 실행하는 순간 덧셈 본문이 실행되는 것은 아닙니다. Python은 함수 객체를 만들고 add라는 이름에 연결합니다. add(5, 7)처럼 호출할 때 새 호출 frame이 생기고 a와 b가 각각 5와 7을 가리킨 뒤 본문을 실행합니다. 정의 시점과 호출 시점을 나누면 왜 함수 안 print가 def 줄에서 출력되지 않는지, 왜 같은 함수를 여러 입력으로 재사용할 수 있는지 이해할 수 있습니다.",
        "원본의 add는 두 값을 받아 a+b를 반환합니다. 그러나 실무 계약은 문법보다 넓습니다. 숫자만 허용하는지 문자열 연결도 허용하는지, 빈 값은 가능한지, 실패하면 ValueError를 발생시키는지, 전달된 리스트를 수정하는지까지 호출자가 알아야 합니다. 이름·타입 힌트·docstring·테스트는 이 계약을 서로 다른 방식으로 기록합니다.",
        "함수 이름은 구현 절차보다 결과나 의도를 나타내는 편이 좋습니다. process나 do_work보다 calculate_mean, normalize_phone_number처럼 구체적인 이름이 입력과 출력의 관계를 드러냅니다. 한 함수가 파일을 읽고 값을 정제하고 DB에 저장하고 메일까지 보내면 계약이 너무 넓어집니다. 각 책임을 작은 함수로 나누고 상위 함수가 흐름을 조합하면 실패 위치와 테스트 범위가 선명해집니다.",
        "계약은 정상 사례만 설명하지 않습니다. mean([])처럼 답을 정할 수 없는 입력을 0으로 조용히 바꾸면 실제 데이터 누락을 평균 0으로 오해할 수 있습니다. 빈 목록을 허용하지 않는다면 ValueError를 명시하고, 허용한다면 None 같은 별도 결과를 반환하도록 호출자와 합의해야 합니다. 어떤 선택이든 우연히 결정하지 말고 도메인 의미를 문서화합니다.",
      ],
      concepts: [
        { term: "함수 객체", definition: "def 문이 실행될 때 생성되어 이름에 연결되는 호출 가능한 Python 객체입니다.", detail: ["변수에 담거나 다른 함수에 전달할 수 있습니다.", "괄호를 붙인 호출과 함수 객체 자체 참조를 구분합니다."] },
        { term: "함수 계약", definition: "허용 입력, 정상 출력, 실패 방식, 상태 변경과 같은 호출자에게 보이는 약속입니다.", detail: ["타입 힌트만으로 모든 값 범위와 부수 효과를 표현할 수는 없습니다.", "docstring·검증·테스트가 계약을 보완합니다."], analogy: "자판기의 버튼·가격·반환 상품·품절 표시를 약속한 사용 설명서와 같습니다." },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "함수 이름만으로 무엇을 넣고 무엇이 나오는지 알 수 없고 호출부마다 사용법이 다르다.", likelyCause: "입력·출력·예외·부수 효과 계약을 정하지 않은 채 긴 절차를 한 함수에 모았습니다.", checks: ["모든 return 경로와 발생 가능한 예외를 적습니다.", "인수로 받은 가변 객체나 전역 상태를 수정하는지 찾습니다.", "함수 이름이 계산 결과가 아니라 모호한 동사인지 확인합니다."], fix: "한 문장으로 설명할 수 있는 책임으로 나누고 타입 힌트·docstring·경계 검증·테스트에 계약을 기록합니다.", prevention: "함수를 작성하기 전에 대표 정상값, 경계값, 실패값과 기대 결과를 표로 먼저 만듭니다." },
      ],
    },
    {
      id: "parameters-arguments-frames",
      title: "매개변수는 호출 frame의 지역 이름이고 인수는 그 이름에 연결되는 객체입니다",
      lead: "Python 호출은 값을 상자에 복사하는 단순 모델보다 객체 참조를 새 지역 이름에 연결하는 모델로 이해해야 정확합니다.",
      explanations: [
        "def add(a, b)에서 a와 b는 매개변수(parameter)이고 add(5, 7)의 5와 7은 인수(argument)입니다. 호출이 시작되면 a가 정수 객체 5를, b가 7을 가리킵니다. 정수는 불변이므로 함수 안에서 a += 1을 해도 호출자의 이름이 가리키는 정수는 바뀌지 않고 지역 a가 새 정수 객체를 가리킵니다.",
        "리스트 같은 가변 객체를 전달하면 호출자 이름과 매개변수가 같은 리스트 객체를 가리킬 수 있습니다. 함수 안에서 items.append(x)를 호출하면 객체 자체가 바뀌어 호출자에게 보입니다. 반면 items = items + [x]는 지역 이름 items를 새 리스트에 다시 연결하므로 원래 리스트를 직접 바꾸지 않습니다. 함수 계약에 mutate 여부를 분명히 적어야 하는 이유입니다.",
        "호출마다 독립적인 frame과 지역 이름 공간이 생깁니다. 같은 함수가 동시에 재귀 호출되거나 여러 요청에서 호출되어도 각 호출의 매개변수와 지역 값은 별개입니다. 단, 전역 가변 객체나 외부 파일·DB를 공유하면 호출 frame이 분리되어도 상태 경쟁은 남습니다.",
        "위치 인수는 순서로 매개변수에 결합하고 키워드 인수는 이름으로 결합합니다. calculate_total(price, quantity, discount)처럼 숫자 세 개가 연달아 나오면 calculate_total(price=10000, quantity=2, discount=0.1)이 호출 의미를 더 잘 드러냅니다. 기본값과 가변 인수의 세부 규칙은 다음 세션에서 별도로 다룹니다.",
      ],
      concepts: [
        { term: "매개변수", definition: "함수 정의에 선언되어 호출 때 전달된 객체를 가리키는 지역 이름입니다.", detail: ["함수 본문 안에서 지역 스코프에 속합니다.", "위치·키워드 규칙에 따라 인수와 결합합니다."] },
        { term: "호출 frame", definition: "함수 한 번의 실행에 필요한 매개변수·지역 이름·현재 실행 위치를 보관하는 실행 문맥입니다.", detail: ["호출할 때마다 새 frame이 생깁니다.", "return하거나 예외로 빠져나가면 해당 호출 frame의 실행이 끝납니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "함수 호출 뒤 원본 리스트가 예상하지 않게 바뀐다.", likelyCause: "매개변수와 호출자 이름이 같은 가변 객체를 가리키는데 함수가 append·sort·clear 같은 변경 메서드를 호출했습니다.", checks: ["호출 전후 id와 repr을 기록합니다.", "본문에서 가변 메서드와 인덱스 대입을 찾습니다.", "반환값이 아니라 숨은 변경에 의존하는 호출부를 찾습니다."], fix: "변경이 계약이면 함수 이름·docstring에 명시하고, 변경하지 않는 계약이면 복사본을 만들거나 새 결과를 반환합니다.", prevention: "테스트에서 입력 객체가 호출 후 보존되는지 또는 의도대로 변경되는지 함께 단언합니다." },
      ],
    },
    {
      id: "return-control-flow",
      title: "return은 값을 전달하면서 현재 함수 호출을 즉시 종료합니다",
      lead: "return은 단순히 결과를 적는 줄이 아니라 이후 본문을 실행하지 않고 호출 지점으로 제어를 돌려보내는 제어문입니다.",
      explanations: [
        "return expression을 만나면 expression을 먼저 평가하고 그 객체를 호출자에게 전달한 뒤 현재 함수 실행을 끝냅니다. return 뒤 같은 블록의 코드는 도달하지 않습니다. 따라서 중첩 if를 깊게 만들기보다 잘못된 입력을 초기에 return하거나 raise하는 guard clause로 정상 흐름을 평평하게 만들 수 있습니다.",
        "return만 쓰면 None을 반환합니다. 함수 끝까지 return을 만나지 않아도 Python은 암시적으로 None을 반환합니다. 원본 sub는 차이를 print하지만 return이 없으므로 result = sub(7, 5)의 result는 None입니다. 화면 출력과 프로그램이 사용할 반환값은 서로 다른 통로입니다.",
        "모든 경로가 같은 종류의 결과를 반환하는지 확인해야 합니다. 정상 경로는 float, 빈 입력 경로는 문자열 'empty', 다른 경로는 None을 반환하면 호출자는 매번 타입을 추측해야 합니다. 도메인상 결과가 없을 수 있다면 float | None처럼 계약을 명시하고, 잘못된 입력이면 예외로 분리합니다.",
        "반복문 안의 break는 반복문만 끝내고 함수의 다음 줄로 진행하지만 return은 반복문을 포함한 현재 함수 전체를 끝냅니다. 검색 함수가 첫 일치 항목을 찾으면 return item으로 즉시 끝낼 수 있습니다. 모든 항목을 검사한 뒤에도 못 찾았을 때 마지막 return None을 명시하면 두 경로가 눈에 보입니다.",
      ],
      concepts: [
        { term: "조기 반환", definition: "함수 앞부분에서 예외·경계·완료 조건을 처리하고 즉시 return하여 나머지 정상 경로의 중첩을 줄이는 구조입니다.", detail: ["정상 흐름을 왼쪽 정렬할 수 있습니다.", "반환 경로가 지나치게 흩어지면 오히려 추적이 어려우므로 의미 있는 경계에 사용합니다."] },
        { term: "None", definition: "값이 없음을 나타내는 Python의 단일 객체이며 return이 없는 함수의 실제 반환값입니다.", detail: ["출력하지 않았다는 뜻과 같지 않습니다.", "0·False·빈 문자열과 구별해야 합니다."] },
      ],
      codeExamples: [
        {
          id: "mean-contract-and-early-return",
          title: "빈 입력을 조용히 왜곡하지 않는 평균 함수",
          language: "python",
          filename: "function_contract.py",
          purpose: "입력 검증, 명시적 예외, 정상 반환과 호출자의 예외 처리를 하나의 재현 가능한 계약으로 만듭니다.",
          code: "def mean(values: list[float]) -> float:\n    \"\"\"비어 있지 않은 숫자 목록의 산술 평균을 반환한다.\"\"\"\n    if not values:\n        raise ValueError('values must not be empty')\n    return sum(values) / len(values)\n\n\nsamples = [[10, 20, 30], [2.5, 3.5], []]\nfor sample in samples:\n    try:\n        print(f'{sample} -> {mean(sample):.2f}')\n    except ValueError as error:\n        print(f'{sample} -> ERROR: {error}')",
          walkthrough: [
            { lines: "1-2", explanation: "타입 힌트와 docstring으로 정상 입력과 반환 의도를 기록합니다. 런타임에서 숫자 타입을 자동 강제하는 기능은 아닙니다." },
            { lines: "3-4", explanation: "빈 목록은 평균의 분모가 0이므로 계산 전에 도메인 의미가 분명한 ValueError로 거부합니다." },
            { lines: "5", explanation: "검증을 통과한 정상 경로는 항상 float 계산 결과를 반환합니다." },
            { lines: "8-13", explanation: "정수 목록, 실수 목록, 빈 경계를 같은 호출부에서 실행하고 예상된 ValueError만 처리합니다." },
          ],
          run: { environment: ["Python 3.9 이상", "function_contract.py로 저장"], command: "python -I -X utf8 function_contract.py" },
          output: { value: "[10, 20, 30] -> 20.00\n[2.5, 3.5] -> 3.00\n[] -> ERROR: values must not be empty", explanation: ["두 정상 입력은 동일한 float 출력 형식을 유지합니다.", "빈 입력은 ZeroDivisionError까지 진행하지 않고 계약에 적은 ValueError가 됩니다.", "호출자는 오류를 0이라는 정상 데이터와 혼동하지 않습니다."] },
          experiments: [
            { change: "if not values 검사를 지웁니다.", prediction: "빈 목록에서 len(values)가 0이므로 0으로 나누는 ZeroDivisionError가 발생합니다.", result: "저수준 계산 오류보다 도메인 입력 오류를 경계에서 명시하는 편이 호출자에게 유용합니다." },
            { change: "빈 입력에서 return 0.0으로 바꿉니다.", prediction: "프로그램은 실패하지 않지만 실제 평균 0과 데이터 없음이 같은 값이 됩니다.", result: "기술적으로 실행되는 선택과 도메인상 올바른 계약은 다를 수 있습니다." },
          ],
          sourceRefs: ["py-function-source", "python-functions-doc"],
        },
      ],
      diagnostics: [
        { symptom: "함수를 호출했는데 변수에 None이 들어 있다.", likelyCause: "해당 실행 경로가 return expression을 만나지 않았거나 함수가 print만 수행했습니다.", checks: ["모든 if·except 경로에 return이 있는지 그립니다.", "함수 마지막까지 내려가는 입력을 재현합니다.", "print 결과와 호출식의 repr 반환값을 따로 확인합니다."], fix: "호출자가 사용할 값을 명시적으로 return하고, 의도적으로 결과가 없는 함수라면 -> None 계약과 이름으로 드러냅니다.", prevention: "정상·경계·실패 입력별 반환값과 타입을 테스트합니다." },
      ],
    },
    {
      id: "scope-legb",
      title: "이름은 Local에서 시작해 Enclosing·Global·Builtins 순서로 탐색합니다",
      lead: "함수 안에서 같은 이름에 대입하면 기본적으로 새 지역 이름이 생기므로 바깥 이름이 자동으로 수정되지 않습니다.",
      explanations: [
        "원본은 전역 x=100과 test 안 지역 x=50을 각각 출력합니다. test 호출 뒤에도 전역 x는 100입니다. Python은 함수 본문에 x 대입이 있으면 그 이름을 지역으로 분류합니다. 대입 전에 print(x)를 하더라도 같은 함수 뒤쪽에 x=50이 있으면 지역 x가 아직 연결되지 않아 UnboundLocalError가 날 수 있습니다.",
        "LEGB는 Local, Enclosing, Global, Builtins의 약자입니다. 현재 함수 지역에서 이름을 못 찾으면 중첩 함수를 감싼 바깥 함수, 모듈 전역, 마지막으로 len·sum 같은 내장 이름을 찾습니다. 지역 이름 sum = 0을 만들면 내장 sum 함수를 가려 이후 sum(values) 호출이 실패할 수 있습니다.",
        "global y는 함수 안 대입이 모듈 전역 y를 대상으로 하게 만듭니다. 원본 test2가 y를 10에서 99로 바꾸는 이유입니다. 문법을 아는 것과 좋은 설계인 것은 다릅니다. 전역 상태 변경은 함수 호출 순서와 테스트 격리를 깨뜨리므로 가능한 한 현재 값을 인수로 받고 새 값을 반환합니다.",
        "nonlocal은 가장 가까운 바깥 함수 스코프의 이름을 다시 연결합니다. closure 기반 카운터처럼 상태를 의도적으로 캡슐화할 때 쓸 수 있습니다. global과 nonlocal 모두 이름을 새 객체에 재연결하는 선언이며, 리스트 append처럼 객체 자체를 변경할 때는 선언이 필요하지 않을 수 있습니다. 재연결과 객체 변경을 구분합니다.",
      ],
      concepts: [
        { term: "LEGB", definition: "Python이 일반 이름을 Local, Enclosing, Global, Builtins 순서로 찾는 규칙입니다.", detail: ["대입은 이름의 스코프 분류에 영향을 줍니다.", "클래스 본문과 comprehension 등에는 추가 세부가 있지만 함수 이름 추적의 기본 모델입니다."] },
        { term: "이름 가림", definition: "안쪽 스코프의 같은 이름이 바깥 또는 내장 이름을 보이지 않게 만드는 현상입니다.", detail: ["sum·list·str 같은 내장 이름을 변수로 쓰지 않는 편이 좋습니다.", "바깥 객체가 사라진 것이 아니라 해당 위치의 이름 탐색에서 안쪽 연결이 먼저 선택됩니다."] },
      ],
      codeExamples: [
        {
          id: "scope-and-explicit-state",
          title: "지역 이름, closure 상태, 명시적 상태 전달 비교",
          language: "python",
          filename: "scope_models.py",
          purpose: "지역 대입이 전역을 바꾸지 않는다는 사실과 nonlocal closure, 순수한 상태 전환 함수를 나란히 실행합니다.",
          code: "x = 100\n\ndef show_local():\n    x = 50\n    return x\n\ndef make_counter():\n    count = 0\n    def next_value():\n        nonlocal count\n        count += 1\n        return count\n    return next_value\n\ndef increment(value):\n    return value + 1\n\ncounter = make_counter()\nstate = 0\nprint(f'local={show_local()}, global={x}')\nprint(f'closure={counter()}, closure={counter()}')\nstate = increment(state)\nstate = increment(state)\nprint(f'explicit state={state}')",
          walkthrough: [
            { lines: "1-5", explanation: "show_local의 x는 호출 frame 지역 이름이며 모듈 전역 x와 별개입니다." },
            { lines: "7-14", explanation: "make_counter 호출 frame의 count를 내부 함수가 캡처하고 nonlocal로 재연결합니다. 반환 뒤에도 closure가 그 상태를 보존합니다." },
            { lines: "16-17", explanation: "increment는 숨은 상태를 읽거나 바꾸지 않고 현재 값을 받아 새 값을 반환합니다." },
            { lines: "19-24", explanation: "세 모델을 실행해 전역 보존, closure의 누적, 명시적 상태 누적을 비교합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "scope_models.py로 저장"], command: "python -I -X utf8 scope_models.py" },
          output: { value: "local=50, global=100\nclosure=1, closure=2\nexplicit state=2", explanation: ["지역 x 대입 뒤에도 전역 x는 100입니다.", "동일한 counter 함수 객체는 캡처한 count를 두 호출 사이에 보존합니다.", "increment는 상태를 내부에 숨기지 않아 입력과 반환만으로 테스트할 수 있습니다."] },
          experiments: [
            { change: "next_value의 nonlocal count를 삭제합니다.", prediction: "count += 1이 count를 지역 이름으로 분류해 읽기 전에 대입하는 UnboundLocalError가 발생합니다.", result: "바깥 이름을 다시 연결할 때 nonlocal 선언이 필요한 이유를 확인합니다." },
            { change: "increment 안에서 전역 state를 수정하도록 바꿉니다.", prediction: "호출 결과를 대입하지 않아도 값은 바뀌지만 함수가 외부 상태와 호출 순서에 의존합니다.", result: "짧아 보이는 전역 변경이 테스트와 동시 실행의 숨은 결합을 만듭니다." },
          ],
          sourceRefs: ["py-function-source", "python-execution-model-doc"],
        },
      ],
      diagnostics: [
        { symptom: "UnboundLocalError: local variable ... referenced before assignment가 발생한다.", likelyCause: "함수 어딘가에 같은 이름 대입이 있어 Python이 지역으로 분류했지만 해당 경로에서 대입 전에 읽었습니다.", checks: ["함수 전체에서 그 이름의 대입·증감·예외 변수·import를 찾습니다.", "전역 또는 바깥 이름을 읽으려 했는지 확인합니다.", "입력별로 대입 줄을 건너뛰는 분기가 있는지 봅니다."], fix: "필요한 값을 매개변수로 전달하고 새 값을 반환합니다. 정말 바깥 재연결이 계약이면 global 또는 nonlocal을 최소 범위에서 명시합니다.", prevention: "지역과 전역에 같은 이름을 재사용하지 않고 데이터 의존성을 함수 인수로 드러냅니다." },
        { symptom: "TypeError: 'int' object is not callable처럼 내장 함수 호출이 갑자기 실패한다.", likelyCause: "sum=0, list=[]처럼 내장 함수 이름을 지역 또는 전역 변수로 가렸습니다.", checks: ["type(sum)과 sum 이름을 대입한 위치를 확인합니다.", "IDE·린터의 built-in shadow 경고를 확인합니다.", "새 인터프리터에서 최소 예제를 실행합니다."], fix: "total, items처럼 의미 있는 다른 이름으로 바꾸고 현재 스코프의 잘못된 연결을 제거합니다.", prevention: "내장 함수와 모듈 이름을 변수·매개변수 이름으로 쓰지 않도록 린터 규칙을 사용합니다." },
      ],
    },
    {
      id: "multiple-return-values",
      title: "여러 값 반환은 tuple 하나를 만들고 호출자가 원하는 구조로 언패킹합니다",
      lead: "return a + b, a - b는 두 번 반환하는 문법이 아니라 쉼표로 만든 tuple 객체 하나를 반환합니다.",
      explanations: [
        "원본 calc(10, 3)는 (13, 7) tuple 하나를 반환하고 k, y = calc(...)가 두 요소를 언패킹합니다. result = calc(10, 3)처럼 한 이름으로 받으면 result의 타입은 tuple입니다. 반환값 개수와 언패킹 대상 개수가 다르면 ValueError가 발생합니다.",
        "작은 내부 함수에서 밀접한 두 값을 반환할 때 tuple은 간결합니다. 그러나 의미가 다른 값이 세 개·네 개로 늘면 위치를 기억해야 합니다. dataclass, NamedTuple, dict 같은 이름 있는 구조를 사용하면 result.total처럼 의미를 드러내고 확장 시 실수를 줄일 수 있습니다.",
        "반환 tuple 안에 가변 객체가 있으면 tuple 자체가 불변이어도 내부 객체는 바뀔 수 있습니다. 불변성은 중첩된 모든 값에 자동 전파되지 않습니다. 함수가 내부 리스트 참조를 그대로 반환하면 호출자가 객체 내부 상태를 수정할 수 있으므로 복사 또는 읽기 전용 추상화를 고려합니다.",
        "함수가 성공 여부와 데이터를 (True, value) 또는 (False, error)로 반환하는 관례는 호출자가 매번 flag를 검사해야 합니다. Python에서는 예상 가능한 결과 없음은 None, 잘못된 입력은 명시적 예외, 복잡한 결과는 이름 있는 결과 타입처럼 의미에 맞는 채널을 선택합니다.",
      ],
      concepts: [
        { term: "tuple packing", definition: "쉼표로 여러 표현식을 하나의 tuple 객체로 묶는 동작입니다.", detail: ["괄호보다 쉼표가 tuple 생성의 핵심입니다.", "return 문에서도 같은 packing이 일어납니다."] },
        { term: "구조적 반환", definition: "여러 결과를 위치 tuple 또는 이름 있는 객체로 묶어 하나의 반환값으로 전달하는 설계입니다.", detail: ["호출부의 가독성과 버전 확장성을 함께 고려합니다.", "결과 필드가 많으면 dataclass 등 이름 있는 타입이 유리합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "ValueError: too many values to unpack 또는 not enough values to unpack가 발생한다.", likelyCause: "반환 tuple 요소 수와 왼쪽 대상 이름 수가 일치하지 않습니다.", checks: ["repr(result)와 type(result), len(result)를 먼저 확인합니다.", "함수의 모든 반환 경로가 같은 구조인지 봅니다.", "API 버전 변경으로 필드가 추가·삭제됐는지 확인합니다."], fix: "계약과 언패킹 개수를 일치시키고 필요 없는 나머지는 *_처럼 명시적으로 받거나 이름 있는 결과 타입으로 전환합니다.", prevention: "반환 구조를 타입·테스트에 고정하고 위치 필드가 늘기 전에 dataclass를 도입합니다." },
      ],
    },
    {
      id: "side-effects-and-purity",
      title: "반환값과 부수 효과를 분리하면 함수가 조합 가능하고 테스트하기 쉬워집니다",
      lead: "print·파일 쓰기·전역 수정은 반환값과 달리 함수 밖 세계를 바꾸므로 계약에 드러내고 계산 로직과 경계를 나눕니다.",
      explanations: [
        "원본 sub는 계산 결과를 print하고 아무 값도 반환하지 않습니다. 학습 예제에서는 눈으로 확인하기 쉽지만 다른 계산에 재사용하려면 문제가 됩니다. calculate_difference는 값을 반환하고 화면 표시 함수가 print를 담당하도록 나누면 CLI, 웹 API, 테스트가 같은 계산 함수를 공유할 수 있습니다.",
        "순수 함수는 같은 입력에서 같은 출력을 만들고 관찰 가능한 외부 상태를 바꾸지 않습니다. 모든 함수를 순수하게 만들 수는 없지만 계산 core를 순수하게 유지하고 파일·DB·네트워크 같은 side effect를 바깥 adapter에 두면 오류 재현과 병렬 테스트가 쉬워집니다.",
        "시간·난수·환경 변수도 숨은 입력입니다. 함수 내부에서 datetime.now()를 직접 부르면 테스트마다 결과가 달라집니다. now 값이나 clock 함수를 매개변수로 주입하면 호출 계약에 의존성이 드러나고 고정된 값으로 테스트할 수 있습니다.",
        "전역 cache나 singleton을 읽는 함수는 매개변수 목록만 봐서는 실제 입력을 알 수 없습니다. 작은 스크립트에서는 편리해도 규모가 커지면 초기화 순서·테스트 오염·동시성 문제가 생깁니다. 상태를 객체에 캡슐화하거나 함수 인수로 전달하고 수명과 소유자를 명확히 합니다.",
      ],
      concepts: [
        { term: "부수 효과", definition: "반환값 전달 외에 화면·파일·DB·네트워크·전역 객체 등 관찰 가능한 외부 상태를 바꾸는 동작입니다.", detail: ["필요한 동작이지만 계약과 실패를 명시해야 합니다.", "계산과 분리하면 테스트 대역을 줄일 수 있습니다."] },
        { term: "순수 함수", definition: "같은 입력에 같은 결과를 반환하고 외부 상태를 변경하지 않는 함수입니다.", detail: ["참조 투명성과 조합 가능성이 높습니다.", "I/O 경계 전체를 순수하게 만들 필요는 없고 core와 shell을 분리합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "개별 테스트는 통과하지만 전체 테스트 순서에 따라 실패한다.", likelyCause: "함수가 전역 변수·cache·환경·현재 시간 같은 공유 상태를 수정하거나 읽고 정리하지 않습니다.", checks: ["테스트 순서를 바꾸거나 단독·전체 실행 결과를 비교합니다.", "global, module singleton, os.environ, random, datetime.now 사용을 찾습니다.", "입력 객체가 테스트 사이 공유되는지 확인합니다."], fix: "숨은 의존성을 인수로 주입하고 테스트마다 새 상태를 만들며 외부 효과는 fixture에서 설정·정리합니다.", prevention: "계산 core를 순수 함수로 유지하고 I/O adapter를 얇게 만들어 계약 테스트와 단위 테스트를 분리합니다." },
      ],
    },
    {
      id: "document-test-evolve",
      title: "타입·docstring·테스트가 계약을 서로 보완하고 변경을 안전하게 만듭니다",
      lead: "타입 힌트는 가능한 값의 모양을, docstring은 의미와 예외를, 테스트는 실제 경계 행동을 실행 증거로 남깁니다.",
      explanations: [
        "def mean(values: list[float]) -> float 표기는 독자와 정적 분석 도구에 의도를 전달하지만 Python 런타임이 자동으로 모든 요소를 검사하지는 않습니다. 문자열 목록을 넣으면 sum 단계에서 오류가 날 수 있습니다. 신뢰할 수 없는 외부 입력은 함수 경계에서 실제 검증하고 내부 코드에는 이미 검증된 값을 전달합니다.",
        "docstring에는 함수 요약, 매개변수 의미와 단위, 반환 의미, 발생 가능한 예외, 중요한 부수 효과를 적습니다. 코드에서 분명한 내용을 장황하게 반복하기보다 왜 빈 값이 금지되는지, 금액이 원 단위인지, 입력 리스트를 수정하는지 같은 비자명한 계약을 기록합니다.",
        "예제 몇 번 실행한 것만으로 계약이 고정되지는 않습니다. 대표값, 최소·최대, 빈 값, 잘못된 타입, 예외, 입력 불변성 같은 경계를 자동 테스트합니다. 순수 계산 함수는 출력값을 직접 단언하고, I/O 함수는 임시 파일·가짜 clock·mock 같은 통제 가능한 경계로 검증합니다.",
        "함수 signature를 바꾸는 것은 내부 리팩터링이 아니라 호출자와의 계약 변경일 수 있습니다. 새 필수 매개변수 추가, 반환 tuple 필드 순서 변경, 예외 종류 변경은 모든 호출부에 영향을 줍니다. 검색·타입 검사·테스트를 함께 실행하고 공개 API라면 호환 기간과 migration을 제공합니다.",
      ],
      concepts: [
        { term: "타입 힌트", definition: "매개변수와 반환값 등 코드의 예상 타입을 기록하는 annotation이며 기본적으로 런타임 강제 규칙은 아닙니다.", detail: ["IDE·정적 타입 검사·문서 생성에 활용됩니다.", "값 범위·단위·부수 효과는 별도 계약이 필요합니다."] },
        { term: "경계 테스트", definition: "정상 대표값뿐 아니라 비어 있음, 최소·최대, 타입 오류, 예외 경로처럼 계약이 바뀌기 쉬운 경계를 검증하는 테스트입니다.", detail: ["실패도 예상된 계약이면 assertRaises나 pytest.raises로 검증합니다.", "입력 객체 보존 같은 비기능 계약도 단언할 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "타입 힌트를 추가했는데도 잘못된 입력이 런타임에 들어온다.", likelyCause: "annotation이 자동 validation과 conversion을 수행한다고 오해했습니다.", checks: ["mypy·pyright 같은 정적 검사 실행 여부를 봅니다.", "입력이 HTTP·파일·사용자 입력 등 신뢰 경계에서 왔는지 확인합니다.", "함수 안에서 실제 값 검증이 필요한지 판단합니다."], fix: "개발 단계에는 정적 타입 검사를 연결하고 외부 입력 경계에는 명시적 parsing·validation을 추가합니다.", prevention: "타입 힌트, 런타임 검증, 도메인 테스트의 서로 다른 책임을 팀 규칙에 기록합니다." },
      ],
      comparisons: [
        { title: "계산 결과를 어떻게 전달할까요?", options: [
          { name: "return", chooseWhen: "호출자가 결과를 저장·조합·검사해야 할 때", avoidWhen: "실제로 반환 개념이 없는 로그·화면 출력 자체가 유일한 책임일 때", tradeoffs: ["재사용과 테스트가 쉽습니다.", "호출자가 결과를 어떻게 표시할지 결정합니다.", "오류 계약을 별도로 설계해야 합니다."] },
          { name: "print 또는 외부 쓰기", chooseWhen: "CLI 표시·로그·파일 저장처럼 외부 효과가 함수의 명시적 책임일 때", avoidWhen: "계산 결과를 다른 코드에서 재사용해야 할 때", tradeoffs: ["사용자에게 즉시 보입니다.", "출력 캡처와 환경 의존 테스트가 필요합니다.", "계산과 섞이면 조합성이 떨어집니다."] },
        ] },
      ],
      expertNotes: ["공개 library 함수는 위치 인수 의미와 반환 구조를 바꾸기 어렵습니다. keyword-only 인수와 이름 있는 결과 타입은 장기 호환성에 도움이 됩니다.", "관찰성 로그에는 함수 입력 전체 대신 요청 ID·오류 분류·처리 시간처럼 필요한 최소 정보만 남겨 민감 데이터 유출을 피합니다."],
    },
  ],
  lab: {
    title: "성적 요약 함수를 계약 중심으로 재설계하기",
    scenario: "사용자 입력 문자열을 숫자 점수로 바꾸고 평균·최고·최저·합격 수를 계산하는 작은 프로그램을, 계산 함수와 I/O를 분리한 테스트 가능한 구조로 만듭니다.",
    setup: ["grade_report.py와 test_grade_report.py를 만듭니다.", "표준 라이브러리만 사용합니다.", "점수 허용 범위는 0 이상 100 이하, 합격 기준은 60으로 정합니다."],
    steps: ["parse_scores(text)는 쉼표 문자열을 list[float]로 바꾸고 빈 항목·숫자 아님·범위 밖을 ValueError로 거부하게 합니다.", "summarize_scores(scores)는 비어 있지 않은 목록만 받고 원본 목록을 수정하지 않은 채 평균·최고·최저·합격 수를 이름 있는 구조로 반환하게 합니다.", "format_report(summary)는 계산 결과를 문자열로만 바꾸고 print하지 않게 합니다.", "main에서 input·print를 담당하고 세 core 함수를 조합합니다.", "지역 이름과 전역 설정을 점검해 합격 기준을 명시적 매개변수로 전달합니다.", "정상값, 한 개 값, 0·100 경계, 공백, 빈 문자열, 범위 밖, 숫자 아님을 테스트합니다.", "호출 전후 scores가 같은지 단언해 숨은 mutation이 없음을 검증합니다.", "각 함수 docstring에 입력·반환·예외·부수 효과를 기록합니다."],
    expectedResult: ["계산 함수는 input·print·전역 상태 없이 같은 입력에서 같은 결과를 반환합니다.", "잘못된 외부 입력은 parsing 경계에서 의미 있는 ValueError로 분류됩니다.", "빈 점수 목록이 평균 0으로 왜곡되지 않습니다.", "반환 필드는 이름으로 접근할 수 있어 tuple 위치를 외울 필요가 없습니다.", "자동 테스트가 정상·경계·실패와 입력 불변성을 모두 고정합니다."],
    cleanup: ["합성 점수만 사용하므로 개인정보 파일은 만들지 않습니다."],
    extensions: ["합격 기준과 가중치를 매개변수로 받아 여러 정책을 지원합니다.", "CSV 파일 adapter를 추가하되 summarize_scores는 변경하지 않습니다.", "Decimal 기반 점수 또는 반올림 정책을 계약에 추가합니다.", "property-based test로 임의의 0~100 점수 목록을 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 add·sub·지역/전역 x·여러 값 calc를 실행한 뒤 반환값 중심으로 다시 작성하세요.", requirements: ["sub가 print한 값과 실제 반환값 None을 따로 출력합니다.", "지역 x와 전역 x의 id·값을 호출 전후 비교합니다.", "calc 반환값의 type이 tuple임을 확인합니다.", "각 함수에 한 줄 계약을 적습니다."], hints: ["result = sub(7, 5); print(repr(result))로 확인합니다.", "packed = calc(10, 3)와 total, difference = packed를 나눠 실행합니다."], expectedOutcome: "출력·반환, 지역·전역, packing·unpacking을 실행 결과로 구분합니다.", solutionOutline: ["원본을 먼저 변경 없이 실행합니다.", "print 전용 함수가 None을 반환함을 기록합니다.", "계산과 표시를 별도 함수로 분리합니다."] },
    { difficulty: "응용", prompt: "장바구니 합계 함수를 순수 core와 표시 shell로 분리하세요.", requirements: ["항목은 이름·단가·수량을 가지고 단가와 수량을 검증합니다.", "subtotal·discount·tax·total을 이름 있는 결과로 반환합니다.", "입력 리스트와 내부 dict를 수정하지 않습니다.", "할인·세율·반올림 정책을 명시적 인수로 받습니다.", "빈 장바구니와 음수 가격의 계약을 테스트합니다."], hints: ["전역 TAX_RATE를 읽지 말고 매개변수로 전달합니다.", "반환 필드가 많으면 dataclass를 고려합니다."], expectedOutcome: "숨은 상태 없이 여러 UI에서 재사용 가능한 가격 계산 계약을 만듭니다." },
    { difficulty: "설계", prompt: "여러 팀이 사용하는 공개 Python 패키지의 함수 API 변경 계획을 설계하세요.", requirements: ["기존 signature·반환 tuple·예외·부수 효과를 inventory로 작성합니다.", "새 keyword-only 옵션과 이름 있는 반환 타입의 호환 전략을 제시합니다.", "deprecated 경고와 migration 기간을 정의합니다.", "정적 타입·unit·contract·integration 테스트를 구분합니다.", "전역 설정·현재 시간·네트워크 의존성을 주입 가능한 경계로 바꿉니다.", "버전·문서·관찰성·민감 로그 정책을 포함합니다."], hints: ["호출자가 위치 tuple을 언패킹하고 있을 가능성을 고려합니다.", "한 번에 제거하기보다 adapter와 경고 기간을 둘 수 있습니다."], expectedOutcome: "함수 문법을 넘어 호환성과 운영 실패까지 포함한 진화 가능한 API 계약을 제안합니다." },
  ],
  reviewQuestions: [
    { question: "def 문을 실행하는 시점과 함수 본문이 실행되는 시점은 어떻게 다른가요?", answer: "def는 함수 객체를 만들어 이름에 연결하고, 본문은 그 함수가 실제로 호출될 때 새 호출 frame에서 실행됩니다." },
    { question: "매개변수와 인수의 차이는 무엇인가요?", answer: "매개변수는 함수 정의의 지역 이름이고 인수는 호출할 때 그 이름에 연결되는 실제 객체 또는 표현식 결과입니다." },
    { question: "print만 하고 return이 없는 함수의 반환값은 무엇인가요?", answer: "화면 출력과 별개로 암시적 None을 반환합니다." },
    { question: "return과 break의 범위 차이는 무엇인가요?", answer: "break는 가장 가까운 반복문을 끝내고 함수의 다음 줄로 가지만 return은 현재 함수 호출 전체를 즉시 끝냅니다." },
    { question: "LEGB는 무엇을 뜻하나요?", answer: "이름을 Local, Enclosing, Global, Builtins 순서로 찾는 기본 규칙입니다." },
    { question: "함수 안 x += 1에서 UnboundLocalError가 날 수 있는 이유는 무엇인가요?", answer: "대입 때문에 x가 지역 이름으로 분류되지만 +=가 기존 지역 값을 먼저 읽으려 하고 아직 연결되지 않았기 때문입니다." },
    { question: "return a, b는 몇 개의 객체를 반환하나요?", answer: "a와 b를 packing한 tuple 객체 하나를 반환하며 호출자가 두 이름으로 언패킹할 수 있습니다." },
    { question: "타입 힌트가 잘못된 외부 입력을 자동으로 막나요?", answer: "기본 Python 런타임에서는 아닙니다. 정적 검사에 도움을 주며 외부 입력은 별도 런타임 검증이 필요합니다." },
  ],
  completionChecklist: [
    "함수 정의·함수 객체·호출 frame·본문 실행 시점을 구분할 수 있다.",
    "매개변수와 인수, 가변 객체 공유와 지역 이름 재연결을 설명할 수 있다.",
    "모든 return 경로와 암시적 None을 입력별로 추적할 수 있다.",
    "LEGB와 이름 가림, global·nonlocal의 영향을 예측할 수 있다.",
    "여러 값 반환이 tuple packing임을 확인하고 적절한 결과 구조를 선택할 수 있다.",
    "계산 반환값과 print·파일·전역 수정 같은 부수 효과를 분리할 수 있다.",
    "입력·출력·예외·mutation을 타입·docstring·테스트에 계약으로 기록할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-function-source", repository: "PYTHON-BASIC", path: "day04/ex07_function.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day04/ex07_function.py", usedFor: ["def와 호출", "return과 print", "지역·전역 스코프", "global", "여러 값 반환"], evidence: "원본을 Python 3.13.9에서 직접 실행해 add=12, sub 출력 뒤 구분선, 함수 안 x=50·밖 x=100, global y=99, calc 결과 13·7과 재정의 결과를 확인했습니다." },
    { id: "py-function-parameter-source", repository: "PYTHON-BASIC", path: "day04/ex08_function.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day04/ex08_function.py", usedFor: ["매개변수와 인수", "기본값 위치 규칙의 다음 세션 연결"], evidence: "일반 매개변수와 기본값 매개변수 순서, 위치 인수 호출 세 가지를 감사했으며 기본값 세부는 py-022로 분리했습니다." },
    { id: "python-functions-doc", repository: "Python documentation", path: "tutorial/controlflow.html#defining-functions", publicUrl: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions", usedFor: ["함수 정의", "호출 의미", "return과 None", "인수 전달 모델"], evidence: "공식 자습서의 함수 정의·지역 심볼 테이블·객체 참조 전달·return 설명을 원본 코드 해석의 기준으로 사용했습니다." },
    { id: "python-execution-model-doc", repository: "Python documentation", path: "reference/executionmodel.html#naming-and-binding", publicUrl: "https://docs.python.org/3/reference/executionmodel.html#naming-and-binding", usedFor: ["이름 결합", "지역 스코프", "global·nonlocal", "UnboundLocalError"], evidence: "공식 언어 참조의 binding과 block 규칙을 바탕으로 LEGB·지역 대입·바깥 이름 재연결 진단을 보강했습니다." },
  ],
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["기본값·*args·**kwargs는 py-022에서 원본 ex07 후반과 ex08을 더 깊게 다룹니다.", "closure·순수 함수·dependency injection·공개 API 호환성은 원본의 지역/전역 예제를 전문가 단계로 확장한 보강 내용입니다."] },
} satisfies DetailedSession;

export default session;

const expertSession = session as DetailedSession;
expertSession.level = "전문가";
expertSession.estimatedMinutes = 340;
expertSession.chapters.push(
  {
    id: "call-contract-binding-annotations",
    title: "함수 계약을 입력 domain·binding·출력·오류·부작용으로 명세합니다",
    lead: "좋은 함수 문서는 파라미터 이름만 나열하지 않습니다. 어떤 값이 허용되고, 인수가 어떻게 파라미터에 묶이며, 성공 시 무엇을 반환하고, 실패 시 무엇을 raise하며, 외부 상태를 바꾸는지를 호출자 관점에서 설명합니다.",
    explanations: [
      "parameter는 함수 정의의 이름 있는 slot이고 argument는 호출 시 전달하는 실제 값입니다. positional argument는 순서로, keyword argument는 이름으로 binding됩니다. 한 parameter에 위치와 keyword로 값을 중복 제공하면 TypeError이며, 필수 값 누락·알 수 없는 keyword·너무 많은 위치 인수도 함수 본문 진입 전에 binding 단계에서 TypeError가 납니다.",
      "입력 domain은 타입만이 아니라 범위와 관계 invariant를 포함합니다. count가 int여도 0이면 평균 분모로 허용되지 않을 수 있고, start와 end는 둘 다 datetime이면서 start <= end여야 할 수 있습니다. 호출자가 복구할 수 있는 잘못된 값은 구체 ValueError 같은 예외로 표현하고 메시지에는 비밀·전체 payload를 포함하지 않습니다.",
      "return 문이 없는 경로는 암시적으로 None을 반환합니다. 성공 결과가 None일 수 있는 함수에서 None을 not-found 신호로 함께 사용하면 두 의미가 충돌합니다. Optional, sentinel, 구체 예외, tagged result 중 하나를 골라 모든 경로가 같은 계약을 갖게 합니다.",
      "annotation은 런타임 강제 변환이나 검증이 아닙니다. `def f(x: int) -> str`에 다른 타입을 전달해도 Python 호출 binding 자체는 이를 막지 않습니다. type checker·IDE·문서화 도구가 이용할 metadata이며, 외부 입력 경계에서는 별도 parse와 validation이 필요합니다.",
      "공개 함수의 keyword로 사용되는 parameter 이름은 API 일부입니다. 이름을 바꾸면 위치 호출은 유지돼도 keyword 호출이 깨질 수 있습니다. 내부 구현 변수와 공개 parameter를 구분하고 변경에는 deprecation·adapter·major version 정책을 적용합니다.",
    ],
    concepts: [
      { term: "argument binding", definition: "호출의 positional·keyword 값을 함수 signature의 각 parameter slot에 대응시키는 단계입니다.", detail: ["본문 실행 전에 완료됩니다.", "중복·누락·unknown은 TypeError가 됩니다."] },
      { term: "function contract", definition: "허용 입력, 반환 의미, 발생 가능한 예외, 부작용과 성능 기대를 호출자에게 약속하는 API 규칙입니다.", detail: ["annotation보다 넓은 개념입니다.", "정상·경계·실패 예제로 검증합니다."] },
      { term: "annotation", definition: "parameter와 반환값에 부착되는 metadata로 정적 분석과 문서화에 사용됩니다.", detail: ["기본 Python 런타임은 자동으로 강제하지 않습니다.", "검증 라이브러리 사용 여부는 별도 계약입니다."] },
    ],
    codeExamples: [
      {
        id: "contract-binding-and-annotations",
        title: "binding 오류와 domain 오류를 분리한 비율 함수",
        language: "python",
        filename: "function_binding.py",
        purpose: "positional·keyword binding, annotation metadata, 본문 domain validation이 서로 다른 단계임을 재현합니다.",
        code: "def completion_rate(done: int, total: int, *, digits: int = 1) -> float:\n    if isinstance(done, bool) or isinstance(total, bool):\n        raise TypeError('counts must be integers, not bool')\n    if not isinstance(done, int) or not isinstance(total, int):\n        raise TypeError('counts must be integers')\n    if total <= 0 or not 0 <= done <= total:\n        raise ValueError('require 0 <= done <= total and total > 0')\n    return round(done / total * 100, digits)\n\nprint(completion_rate(3, 8, digits=2))\nprint(completion_rate(done=7, total=10))\nprint(completion_rate.__annotations__)\n\nfor call in [lambda: completion_rate(1, 0), lambda: completion_rate(1, 2, unknown=3)]:\n    try:\n        call()\n    except (TypeError, ValueError) as error:\n        print(type(error).__name__)",
        walkthrough: [
          { lines: "1-9", explanation: "signature와 annotation을 선언하고 bool-as-int 경계, 타입, 값 관계를 순서대로 검증한 뒤 일관된 float를 반환합니다." },
          { lines: "11-13", explanation: "혼합 호출과 keyword 호출, 런타임에 보존된 annotation metadata를 확인합니다." },
          { lines: "15-18", explanation: "값 domain 위반은 본문의 ValueError, unknown keyword는 본문 진입 전 binding TypeError로 구분됩니다." },
        ],
        run: { environment: ["Python 3.9 이상", "function_binding.py를 UTF-8로 저장"], command: "python -I -X utf8 function_binding.py" },
        output: { value: "37.5\n70.0\n{'done': <class 'int'>, 'total': <class 'int'>, 'digits': <class 'int'>, 'return': <class 'float'>}\nValueError\nTypeError", explanation: ["annotation은 metadata dict로 보이지만 검증 코드는 본문에 별도로 있습니다.", "digits는 keyword-only라 호출 의도가 드러납니다.", "binding 오류와 domain 오류의 타입이 다릅니다."] },
        experiments: [
          { change: "`completion_rate(1, 2, 3)`을 호출합니다.", prediction: "digits는 keyword-only라 본문 전에 TypeError입니다.", result: "호출 형태도 함수 계약임을 확인합니다." },
          { change: "명시 타입 검사를 제거하고 문자열 '3', '8'을 전달합니다.", prediction: "annotation이 자동 변환하지 않아 본문 연산에서 TypeError가 납니다.", result: "annotation과 runtime validation을 구분합니다." },
        ],
        sourceRefs: ["python-calls-reference", "python-function-def-reference", "python-typing-doc", "python-annotations-howto"],
      },
    ],
    diagnostics: [
      { symptom: "TypeError가 함수 첫 줄 로그보다 먼저 발생한다.", likelyCause: "본문이 아니라 호출 argument binding 단계에서 누락·중복·unknown keyword가 검출됐습니다.", checks: ["실제 signature를 inspect.signature로 확인합니다.", "같은 parameter를 위치와 이름으로 두 번 전달했는지 봅니다.", "wrapper가 인수를 변형하는지 확인합니다."], fix: "호출 형태를 signature에 맞추고 wrapper는 원래 TypeError 문맥을 보존합니다.", prevention: "공개 signature의 대표 positional·keyword·invalid 호출 계약 테스트를 둡니다." },
      { symptom: "annotation을 추가했는데 잘못된 런타임 타입이 그대로 들어온다.", likelyCause: "Python annotation을 자동 validation·coercion으로 오해했습니다.", checks: ["type checker가 CI에서 실행되는지 확인합니다.", "외부 입력 parse 경계를 찾습니다.", "검증 framework가 실제 호출을 감싸는지 확인합니다."], fix: "정적 검사를 CI에 추가하고 신뢰 경계에서 명시 validation을 수행합니다.", prevention: "annotation·static checking·runtime validation의 책임을 아키텍처 문서에 분리합니다." },
    ],
    expertNotes: ["bool은 int의 subclass라 단순 isinstance(value, int)만으로 도메인 count를 검증하면 True가 1로 통과할 수 있습니다.", "parameter 이름 안정성은 keyword 호출자뿐 아니라 dependency injection container와 serialization adapter에도 영향을 줄 수 있습니다."],
  },
  {
    id: "pure-functions-side-effects-and-dependency-injection",
    title: "순수 계산과 I/O 부작용을 분리하고 의존성을 인수로 주입합니다",
    lead: "함수가 외부 시계·난수·파일·네트워크·전역 상태를 직접 읽으면 같은 입력에 같은 결과라는 추론이 깨집니다. 핵심 계산을 순수하게 유지하고 효과를 경계 함수로 이동하면 테스트와 재사용이 쉬워집니다.",
    explanations: [
      "pure function은 같은 입력 값에 같은 출력을 만들고 관찰 가능한 외부 상태를 변경하지 않습니다. Python이 강제하는 문법 분류는 아니며, 전달받은 mutable 객체를 변경하거나 전역 cache를 채우면 순수하지 않습니다. 순수성은 최적화보다 먼저 테스트 격리와 reasoning에 가치를 줍니다.",
      "side effect에는 print, 파일 쓰기, DB update, 로그, 전역 list append, clock·random 읽기처럼 반환값 외의 관찰 가능한 상호작용이 포함됩니다. side effect 자체가 나쁜 것은 아니며 애플리케이션은 결국 효과를 내야 합니다. 중요한 것은 계산 중간에 숨기지 않고 이름·반환·주입된 port로 경계를 드러내는 것입니다.",
      "dependency injection은 필요한 동작을 global import 안에 고정하지 않고 callable 또는 작은 protocol 인수로 전달합니다. production에서는 실제 writer·clock을, 테스트에서는 기록용 fake를 전달합니다. 단순 함수에 거대한 container를 도입하기보다 가장 작은 의존성 표면을 선택합니다.",
      "mutable argument를 받아 수정하는 in-place 함수라면 이름과 반환 계약을 명확히 합니다. Python list.sort는 list를 바꾸고 None을 반환해 새 list를 돌려준다는 오해를 줄입니다. 새 값을 반환하는 함수와 in-place command를 섞으면 caller가 aliasing을 추적하기 어려워집니다.",
      "로그 callback이 실패할 수 있는지, writer가 재시도하는지, transaction과 어떤 순서인지도 효과 계약입니다. 돈을 청구한 뒤 로그 실패 때문에 전체 함수를 재시도하면 중복 청구가 생길 수 있습니다. 도메인 effect와 관찰성 effect의 실패 정책을 분리합니다.",
    ],
    concepts: [
      { term: "pure function", definition: "명시 입력만으로 결과가 결정되고 외부에서 관찰되는 상태를 변경하지 않는 함수입니다.", detail: ["같은 값 입력에 같은 값 출력입니다.", "전역 시계·난수·I/O를 직접 읽지 않습니다."] },
      { term: "side effect", definition: "반환값 외에 외부 상태나 관찰 가능한 세계를 읽거나 변경하는 상호작용입니다.", detail: ["I/O·로그·mutation·clock·random이 포함됩니다.", "경계를 명시하면 안전하게 조합할 수 있습니다."] },
      { term: "dependency injection", definition: "함수가 필요한 외부 동작을 내부에서 고정 생성하지 않고 parameter로 받는 설계입니다.", detail: ["테스트 fake로 교체할 수 있습니다.", "가장 작은 callable이나 protocol을 선호합니다."] },
    ],
    codeExamples: [
      {
        id: "pure-core-injected-effect",
        title: "순수 영수증 계산과 주입된 출력 효과",
        language: "python",
        filename: "pure_and_effect.py",
        purpose: "동일 입력에 동일 값을 만드는 계산 함수와 외부 기록을 담당하는 command 함수를 분리합니다.",
        code: "def calculate_receipt(prices, tax_rate):\n    if not 0 <= tax_rate <= 1:\n        raise ValueError('tax_rate must be between 0 and 1')\n    subtotal = sum(prices)\n    tax = round(subtotal * tax_rate, 2)\n    return {'subtotal': subtotal, 'tax': tax, 'total': subtotal + tax}\n\ndef issue_receipt(prices, tax_rate, write_line):\n    receipt = calculate_receipt(prices, tax_rate)\n    write_line(f\"total={receipt['total']:.2f}\")\n    return receipt\n\nmessages = []\nfirst = issue_receipt([10.0, 5.0], 0.1, messages.append)\nsecond = calculate_receipt([10.0, 5.0], 0.1)\nprint(first)\nprint(second == first)\nprint(messages)",
        walkthrough: [
          { lines: "1-6", explanation: "검증과 계산만 수행하고 새 dict를 반환하는 순수 core를 만듭니다." },
          { lines: "8-11", explanation: "효과 경계가 writer callable을 인수로 받아 한 줄을 기록하고 core 결과를 반환합니다." },
          { lines: "13-18", explanation: "테스트 fake로 list.append를 주입해 실제 파일·콘솔 없이 효과와 순수 결과를 각각 검증합니다." },
        ],
        run: { environment: ["Python 3.8 이상", "pure_and_effect.py를 UTF-8로 저장"], command: "python -I -X utf8 pure_and_effect.py" },
        output: { value: "{'subtotal': 15.0, 'tax': 1.5, 'total': 16.5}\nTrue\n['total=16.50']", explanation: ["순수 core를 다시 호출하면 동일한 dict 값이 나옵니다.", "부작용은 주입된 messages.append 한 곳에 격리됩니다.", "반환 결과와 출력 형식을 독립적으로 테스트할 수 있습니다."] },
        experiments: [
          { change: "write_line에 예외를 일으키는 fake를 전달합니다.", prediction: "계산은 끝나지만 issue_receipt는 writer 예외를 전파합니다.", result: "효과 실패 정책을 caller가 명시해야 함을 확인합니다." },
          { change: "calculate_receipt가 prices.append를 수행하게 만듭니다.", prediction: "caller list가 바뀌고 같은 객체 재사용 시 결과가 달라질 수 있습니다.", result: "숨은 mutation이 순수 계약을 깨뜨리는 방식을 확인합니다." },
        ],
        sourceRefs: ["python-functions-doc", "python-unittest-mock-doc", "python-protocols-typing-doc"],
      },
    ],
    diagnostics: [
      { symptom: "단위 테스트가 실행 순서나 현재 시간에 따라 실패한다.", likelyCause: "함수가 전역 mutable 상태·datetime.now·random·환경 변수를 직접 읽습니다.", checks: ["테스트 단독·역순 실행 결과를 비교합니다.", "함수 내부의 module global과 I/O 호출을 찾습니다.", "동일 인수 반복 호출의 결과와 side effect를 기록합니다."], fix: "clock·random generator·repository를 인수로 주입하고 핵심 계산을 순수 함수로 분리합니다.", prevention: "core 계산에는 명시 인수 외 입력을 금지하는 리뷰 기준을 둡니다." },
      { symptom: "함수 반환은 맞지만 caller의 list가 예상치 않게 바뀐다.", likelyCause: "전달받은 mutable 객체를 in-place 수정했고 alias가 여러 곳에 공유됐습니다.", checks: ["호출 전후 id와 repr을 비교합니다.", "append·sort·clear·item assignment를 검색합니다.", "함수 이름과 문서가 mutation을 알리는지 확인합니다."], fix: "새 컬렉션을 만들어 반환하거나 in-place 함수로 이름·None 반환·문서를 명확히 합니다.", prevention: "값 반환 함수와 command-style mutation 함수를 한 API에서 섞지 않습니다." },
    ],
    expertNotes: ["주입된 callable signature도 계약이므로 Protocol로 인수·반환·예외 기대를 정적 표현할 수 있습니다.", "완전한 순수성보다 effect boundary를 좁게 만드는 것이 Python 애플리케이션에서 실용적인 목표입니다."],
  },
  {
    id: "error-channel-return-raise-result-finally",
    title: "return·raise·tagged result를 선택하고 finally가 제어 흐름을 덮지 않게 합니다",
    lead: "실패를 None, Boolean, 예외, result 객체 중 무엇으로 표현할지는 호출자의 복구 방식에 달려 있습니다. 어떤 방식을 택하든 성공 값과 실패 정보를 잃지 않고 finally는 정리만 수행해야 합니다.",
    explanations: [
      "예외는 함수의 정상 성공 값을 만들 수 없을 때 stack을 따라 가장 가까운 handler로 제어를 이동합니다. 값 범위 위반은 ValueError, 잘못된 타입은 TypeError처럼 기존 의미가 맞는 구체 예외를 사용하고, domain 문맥이 필요하면 자체 예외를 만들되 원인을 `raise DomainError(...) from error`로 연결합니다.",
      "Optional return은 not-found가 빈번하고 정상적인 결과이며 실패 이유가 하나일 때 간단합니다. 여러 실패 원인·재시도 여부·필드 오류가 필요하면 tagged dataclass/union result가 명시적입니다. 모든 호출자가 반드시 처리해야 하는 치명적 실패를 error code로만 돌리면 무시될 수 있고, 예상 가능한 검증 오류를 예외로만 던지면 batch 오류 수집이 불편할 수 있습니다.",
      "early return은 guard clause로 잘못된 입력과 예외적 상태를 앞에서 제거해 happy path 들여쓰기를 줄입니다. 그러나 서로 다른 실패가 모두 `return None`이면 원인을 잃습니다. 각 return 경로가 함수의 한 가지 반환 타입 의미에 맞는지 표로 검토합니다.",
      "finally는 return·break·continue·예외 여부와 관계없이 정리에 사용됩니다. finally 안의 return은 try의 반환값과 진행 중 예외를 덮어써 버리므로 피해야 합니다. cleanup 중 예외도 원래 실패를 가릴 수 있으므로 context manager와 예외 chaining, 로깅 정책을 설계합니다.",
      "catch는 복구할 수 있는 가장 좁은 경계에 둡니다. `except Exception: return None`은 프로그래밍 버그·취소·데이터 손상 신호를 같은 값으로 숨깁니다. 오류를 변환할 때는 입력의 비밀을 제거한 문맥을 더하고 원래 cause를 보존합니다.",
    ],
    concepts: [
      { term: "error channel", definition: "함수가 성공 값 이외의 실패 정보를 호출자에게 전달하는 예외·tagged result·Optional 등의 통로입니다.", detail: ["복구 가능성과 빈도에 맞춰 선택합니다.", "여러 방식을 임의로 섞지 않습니다."] },
      { term: "exception chaining", definition: "새 예외를 올리면서 `raise ... from cause`로 원래 실패 원인을 연결하는 방식입니다.", detail: ["domain 문맥과 저수준 원인을 함께 보존합니다.", "민감 입력은 메시지에서 제거합니다."] },
      { term: "finally override", definition: "finally 블록의 return·raise가 try의 기존 return 또는 진행 중 예외를 대체하는 제어 흐름 위험입니다.", detail: ["finally는 cleanup에 집중합니다.", "결과 결정은 try/except 바깥에서 수행합니다."] },
    ],
    codeExamples: [
      {
        id: "explicit-error-channel-cleanup",
        title: "구체 예외를 tagged result로 변환하고 cleanup을 보존",
        language: "python",
        filename: "error_contract.py",
        purpose: "내부 parser는 구체 예외를 사용하고 경계 함수는 예상 오류만 결과로 변환하며 finally는 정리 기록만 수행합니다.",
        code: "def parse_port(text):\n    if not text.isdecimal():\n        raise ValueError('port must contain decimal digits')\n    value = int(text)\n    if not 1 <= value <= 65535:\n        raise ValueError('port must be in 1..65535')\n    return value\n\ndef attempt(text, cleanup_log):\n    try:\n        return ('ok', parse_port(text))\n    except ValueError as error:\n        return ('error', str(error))\n    finally:\n        cleanup_log.append(f'checked:{text}')\n\ncleanup = []\nfor raw in ['8080', '0', 'abc']:\n    print(attempt(raw, cleanup))\nprint(cleanup)",
        walkthrough: [
          { lines: "1-7", explanation: "parser는 성공하면 int 한 타입을 반환하고 두 domain 위반을 구체 ValueError로 표현합니다." },
          { lines: "9-15", explanation: "경계 함수는 예상 ValueError만 tagged tuple로 변환하고 finally에서는 반환하지 않은 채 cleanup만 기록합니다." },
          { lines: "17-20", explanation: "성공·범위 오류·형식 오류와 모든 경로의 정리를 확인합니다." },
        ],
        run: { environment: ["Python 3.8 이상", "error_contract.py를 UTF-8로 저장"], command: "python -I -X utf8 error_contract.py" },
        output: { value: "('ok', 8080)\n('error', 'port must be in 1..65535')\n('error', 'port must contain decimal digits')\n['checked:8080', 'checked:0', 'checked:abc']", explanation: ["성공과 오류가 첫 tag로 구분됩니다.", "오류 원인이 문자열에 보존되어 caller가 표시할 수 있습니다.", "finally cleanup은 세 경로 모두 실행되며 기존 결과를 덮지 않습니다."] },
        experiments: [
          { change: "finally 마지막에 `return ('cleanup', None)`을 넣습니다.", prediction: "모든 성공·오류 결과가 cleanup tuple로 덮입니다.", result: "finally의 return이 기존 제어 흐름을 파괴함을 확인합니다." },
          { change: "except ValueError를 except Exception으로 넓히고 parse_port에 NameError 버그를 넣습니다.", prediction: "버그가 일반 error 결과로 숨겨집니다.", result: "복구 가능한 예외만 좁게 잡아야 함을 확인합니다." },
        ],
        sourceRefs: ["python-exceptions-tutorial", "python-raise-reference", "python-try-reference", "python-functions-doc"],
      },
    ],
    diagnostics: [
      { symptom: "함수가 예외를 냈어야 하는데 None을 반환해 이후 코드에서 더 멀리 실패한다.", likelyCause: "넓은 except가 모든 오류를 None으로 바꾸거나 일부 return 경로가 암시적 None입니다.", checks: ["모든 return과 함수 끝 도달 경로를 표로 만듭니다.", "except Exception·bare except를 검색합니다.", "not-found와 failure가 같은 None인지 확인합니다."], fix: "예상 실패만 구체적으로 변환하고 나머지는 cause와 함께 전파하며 반환 의미를 하나로 통일합니다.", prevention: "type checker와 성공·각 실패·버그 주입 테스트를 함께 둡니다." },
      { symptom: "try에서 반환한 값이나 원래 예외가 사라진다.", likelyCause: "finally 안에서 return 또는 새 예외가 기존 제어 흐름을 덮었습니다.", checks: ["finally의 return·raise·break·continue를 찾습니다.", "cleanup 함수 자체의 실패 가능성을 주입합니다.", "traceback의 __cause__·__context__를 확인합니다."], fix: "finally는 정리만 수행하고 결과 결정은 바깥에서 하며 cleanup 예외 정책을 명시합니다.", prevention: "finally 제어 이동을 금지하고 context manager를 우선 사용하는 리뷰 규칙을 둡니다." },
    ],
    expertNotes: ["batch validation은 여러 field 오류를 모아 tagged result로 반환하고, 시스템 불변식 위반은 예외로 분리하는 혼합 모델이 실용적입니다.", "예외 메시지는 API 안정 계약으로 취급하기 어렵기 때문에 programmatic 처리는 예외 type·error code·구조화 필드를 사용합니다."],
  },
);

expertSession.reviewQuestions.push(
  { question: "parameter와 argument는 어떻게 다른가요?", answer: "parameter는 함수 정의의 이름 있는 slot이고 argument는 호출할 때 그 slot에 전달하는 실제 값입니다." },
  { question: "unknown keyword TypeError는 함수 본문 안에서 발생하나요?", answer: "일반적으로 본문 진입 전 argument binding 단계에서 발생합니다." },
  { question: "type annotation이 런타임 입력을 자동 검증하나요?", answer: "기본 Python에서는 아닙니다. 정적 도구용 metadata이며 외부 입력에는 별도 runtime validation이 필요합니다." },
  { question: "순수 함수가 주는 실무 이점은 무엇인가요?", answer: "명시 입력만으로 결과를 재현할 수 있어 테스트 격리, 병렬 실행, reasoning과 cache 가능성이 좋아집니다." },
  { question: "dependency injection을 항상 큰 framework로 구현해야 하나요?", answer: "아닙니다. clock이나 writer 같은 작은 callable 하나를 parameter로 받는 것부터 충분한 의존성 주입입니다." },
  { question: "Optional 반환과 예외는 어떤 기준으로 고르나요?", answer: "not-found가 정상적이고 이유가 하나면 Optional이 간단하며, 호출자가 복구할 수 없는 실패나 반드시 처리해야 할 오류는 구체 예외가 적합합니다. 여러 예상 오류는 tagged result가 유용합니다." },
  { question: "finally 안 return이 위험한 이유는 무엇인가요?", answer: "try의 반환값뿐 아니라 진행 중인 예외까지 덮어 원래 결과와 실패 원인을 잃게 만들 수 있기 때문입니다." },
);

expertSession.completionChecklist.push(
  "parameter·argument·binding·본문 실행 순서를 구분할 수 있다.",
  "타입·범위·관계·반환·오류·부작용을 포함한 함수 계약을 작성할 수 있다.",
  "annotation과 runtime validation의 책임을 분리할 수 있다.",
  "공개 parameter 이름 변경이 keyword 호출자에게 미치는 호환성 영향을 판단할 수 있다.",
  "순수 계산과 I/O effect 경계를 두 함수로 분리할 수 있다.",
  "clock·writer·repository를 작은 callable 또는 Protocol로 주입할 수 있다.",
  "Optional·예외·tagged result 중 호출자 복구 방식에 맞는 오류 채널을 선택할 수 있다.",
  "finally에서 return하지 않고 정상·오류·취소 경로의 cleanup을 검증할 수 있다.",
);

expertSession.sources.push(
  { id: "python-calls-reference", repository: "Python", path: "reference/expressions.html#calls", publicUrl: "https://docs.python.org/3/reference/expressions.html#calls", usedFor: ["argument binding", "positional", "keyword", "호출 오류"], evidence: "호출 표현식에서 argument가 parameter slot에 binding되는 공식 순서와 오류를 확인했습니다." },
  { id: "python-function-def-reference", repository: "Python", path: "reference/compound_stmts.html#function-definitions", publicUrl: "https://docs.python.org/3/reference/compound_stmts.html#function-definitions", usedFor: ["함수 정의", "parameter", "annotation", "scope"], evidence: "function definition의 parameter list와 annotation 평가 의미를 언어 레퍼런스에서 확인했습니다." },
  { id: "python-typing-doc", repository: "Python", path: "library/typing.html", publicUrl: "https://docs.python.org/3/library/typing.html", usedFor: ["type annotation", "Protocol", "Optional", "정적 분석"], evidence: "annotation이 runtime 강제가 아닌 type hint이며 callable Protocol로 주입 계약을 표현할 수 있음을 확인했습니다." },
  { id: "python-annotations-howto", repository: "Python", path: "howto/annotations.html", publicUrl: "https://docs.python.org/3/howto/annotations.html", usedFor: ["annotation introspection", "런타임 metadata"], evidence: "함수 annotation을 안전하게 읽고 해석하는 공식 HOWTO를 보조 근거로 사용했습니다." },
  { id: "python-unittest-mock-doc", repository: "Python", path: "library/unittest.mock.html", publicUrl: "https://docs.python.org/3/library/unittest.mock.html", usedFor: ["의존성 대체", "호출 검증", "side effect 테스트"], evidence: "외부 의존성을 fake/mock로 대체하고 호출 효과를 검증하는 표준 도구 경계를 확인했습니다." },
  { id: "python-protocols-typing-doc", repository: "Python", path: "library/typing.html#typing.Protocol", publicUrl: "https://docs.python.org/3/library/typing.html#typing.Protocol", usedFor: ["구조적 callable 계약", "dependency injection"], evidence: "주입 의존성의 최소 구조 계약을 Protocol로 표현하는 근거를 추가했습니다." },
  { id: "python-exceptions-tutorial", repository: "Python", path: "tutorial/errors.html", publicUrl: "https://docs.python.org/3/tutorial/errors.html", usedFor: ["raise", "except", "finally", "exception chaining"], evidence: "예외 선택·처리·정리의 공식 학습 순서를 오류 채널 설명에 반영했습니다." },
  { id: "python-raise-reference", repository: "Python", path: "reference/simple_stmts.html#the-raise-statement", publicUrl: "https://docs.python.org/3/reference/simple_stmts.html#the-raise-statement", usedFor: ["raise", "cause chaining", "traceback"], evidence: "raise statement와 explicit cause 연결 의미를 확인했습니다." },
  { id: "python-try-reference", repository: "Python", path: "reference/compound_stmts.html#the-try-statement", publicUrl: "https://docs.python.org/3/reference/compound_stmts.html#the-try-statement", usedFor: ["try except else finally", "제어 흐름 override"], evidence: "finally가 return·예외 뒤에도 실행되고 새 제어 흐름이 기존 결과를 덮을 수 있음을 확인했습니다." },
);
