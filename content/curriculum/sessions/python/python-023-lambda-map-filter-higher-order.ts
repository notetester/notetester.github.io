import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-023"],
  slug: "python-023-lambda-map-filter-higher-order",
  courseId: "python",
  moduleId: "02-control-functions-io",
  order: 23,
  title: "lambda·map·filter·고차 함수",
  subtitle: "짧은 함수를 값처럼 전달하고 변환·선별·정렬·콜백에 사용하되, 이름 있는 함수와 컴프리헨션이 더 나은 순간까지 판단합니다.",
  level: "중급",
  estimatedMinutes: 130,
  coreQuestion: "동작을 다른 함수에 값처럼 전달해야 할 때 lambda·map·filter를 어떻게 사용하며, 가독성·지연 평가·클로저 상태 때문에 언제 다른 표현을 선택해야 할까요?",
  summary: "원본의 일반 함수와 lambda 덧셈, 인자 없는 인사 함수, map/filter를 이용한 리스트·튜플·집합·딕셔너리 변환을 직접 실행합니다. 함수가 객체라는 정신 모델에서 고차 함수와 callback을 정의하고, for·컴프리헨션·map/filter의 선택 기준을 비교합니다. map/filter 이터레이터의 지연성과 1회 소비, filter의 predicate truthiness, operator.itemgetter와 functools.partial의 의도 표현, 루프 안 lambda의 late binding 실패와 세 가지 해결법, import side effect와 디버깅·테스트 전략까지 다룹니다.",
  objectives: [
    "함수를 이름에 바인딩하고 인수로 전달하거나 반환할 수 있는 객체로 설명할 수 있다.",
    "lambda 매개변수: 표현식 문법과 단일 표현식 제한을 일반 def 함수와 비교할 수 있다.",
    "map이 각 원소를 변환하고 filter가 predicate 결과가 truthy인 원래 원소를 남긴다는 차이를 구현할 수 있다.",
    "map/filter 결과가 지연 평가되는 이터레이터이며 list 변환 뒤 재사용되지 않는 이유를 설명할 수 있다.",
    "for·컴프리헨션·map/filter·operator·partial 중 읽기 쉽고 테스트 가능한 표현을 상황별로 선택할 수 있다.",
    "콜백의 입력·출력·예외 계약을 설계하고 lambda를 무조건 짧게 쓰는 관행을 피할 수 있다.",
    "루프에서 만든 lambda가 마지막 변수값을 공유하는 late binding 오류를 재현하고 기본 인수·partial·factory로 고칠 수 있다.",
  ],
  prerequisites: [
    {
      title: "컴프리헨션과 선언적 변환",
      reason: "동일한 변환·필터 작업을 컴프리헨션과 map/filter로 나란히 비교해야 표현 선택 기준을 세울 수 있습니다.",
      sessionSlug: "python-020-comprehensions-declarative-transform",
    },
    {
      title: "함수 계약·스코프·반환",
      reason: "lambda도 호출 가능한 함수 객체이며 매개변수·반환값·지역 이름 탐색 규칙을 그대로 따릅니다.",
      sessionSlug: "python-021-function-contract-scope-return",
    },
    {
      title: "기본값·*args·**kwargs",
      reason: "late binding을 기본값 인수로 고정하는 기법과 partial이 일부 인수를 미리 채우는 방식을 이해하는 데 필요합니다.",
      sessionSlug: "python-022-default-args-varargs-kwargs",
    },
  ],
  keywords: ["Python", "lambda", "고차 함수", "map", "filter", "callback", "iterator", "comprehension", "functools.partial", "operator", "closure", "late binding"],
  chapters: [
    {
      id: "functions-as-values",
      title: "함수도 이름에 담고 전달할 수 있는 객체입니다",
      lead: "고차 함수를 이해하는 출발점은 함수 호출 결과가 아니라 함수 객체 자체를 값처럼 다루는 것입니다.",
      explanations: [
        "def add(x, y): return x + y를 실행하면 add라는 이름이 호출 가능한 함수 객체를 가리킵니다. add(10, 3)은 그 객체를 호출해 13을 얻고, add처럼 괄호 없이 쓰면 함수 객체 자체를 참조합니다. 다른 이름 op = add에 바인딩하거나 함수의 인수로 전달할 수 있습니다.",
        "함수를 인수로 받거나 함수를 반환하는 함수를 고차 함수라고 합니다. map은 변환 함수와 이터러블을 받고, filter는 판정 함수와 이터러블을 받습니다. sorted의 key, GUI 버튼 handler, 웹 프레임워크 route handler도 호출 가능한 객체를 받아 나중에 실행한다는 점에서 같은 callback 설계입니다.",
        "함수 객체를 전달할 때는 호출하지 않습니다. apply(add, 10, 3)처럼 add를 넘겨야지 apply(add(), ...)로 쓰면 지금 즉시 호출한 반환값을 넘기게 됩니다. 콜백이 언제, 몇 번, 어떤 인수로 호출되는지는 받는 쪽의 계약입니다.",
      ],
      concepts: [
        {
          term: "호출 가능한 객체(callable)",
          definition: "괄호를 붙여 실행할 수 있는 함수·메서드·일부 객체입니다.",
          detail: [
            "callable(value)로 호출 가능 여부를 확인할 수 있습니다.",
            "호출 가능하다는 사실만으로 필요한 매개변수와 반환 타입이 맞는 것은 아니므로 계약이 필요합니다.",
          ],
        },
        {
          term: "고차 함수",
          definition: "함수를 인수로 받거나 함수를 반환하는 함수입니다.",
          detail: [
            "map, filter, sorted가 대표적인 내장 고차 함수입니다.",
            "반복되는 제어 구조와 바뀌는 동작을 분리할 수 있지만 지나친 추상화는 흐름을 숨깁니다.",
          ],
          analogy: "택배 시스템이 물건 자체가 아니라 '이 물건을 어떻게 포장할지'라는 작업 지시서를 함께 받는 것과 비슷합니다.",
        },
        {
          term: "callback",
          definition: "다른 코드에 전달되어 특정 시점이나 조건에서 호출되는 함수입니다.",
          detail: [
            "이벤트, 정렬 key, 재시도 조건, 데이터 변환 등에 사용합니다.",
            "호출 인수, 반환값, 예외 처리, 호출 횟수를 문서화해야 합니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "TypeError: 'int' object is not callable이 발생한다.",
          likelyCause: "함수 객체를 전달해야 하는 곳에서 add(1, 2)처럼 먼저 호출해 정수 반환값을 넘겼거나 함수 이름을 정수로 덮어썼습니다.",
          checks: [
            "print(callback, type(callback), callable(callback))로 실제 전달값을 확인합니다.",
            "인수를 넘길 때 함수 이름 뒤에 괄호가 붙었는지 확인합니다.",
            "같은 이름에 다른 값을 다시 대입한 줄이 있는지 검색합니다.",
          ],
          fix: "지금 호출할 목적이 아니라면 괄호 없는 함수 객체를 전달하고, 함수 이름을 데이터 변수로 재사용하지 않습니다.",
          prevention: "callback, transform, predicate처럼 역할이 드러나는 이름과 Callable 타입 힌트를 사용하고 정상·잘못된 callback 테스트를 둡니다.",
        },
      ],
    },
    {
      id: "lambda-syntax-and-limits",
      title: "lambda는 한 표현식으로 만드는 작은 함수입니다",
      lead: "lambda는 함수를 축약하는 마법이 아니라 이름과 문(statement) 본문을 생략하고 표현식 하나의 결과를 반환하는 함수 문법입니다.",
      explanations: [
        "lambda x, y: x + y에서 콜론 왼쪽은 매개변수, 오른쪽은 반환할 표현식입니다. return을 쓰지 않아도 표현식 결과가 반환됩니다. 매개변수가 없으면 lambda: 'Hello'처럼 쓰고, 하나 이상이면 일반 함수와 같은 인수 전달 규칙을 따릅니다.",
        "lambda 본문에는 표현식 하나만 둘 수 있습니다. 여러 문장, 반복문, try/except, 명시적 return, 일반 대입문을 넣을 수 없습니다. 조건 표현식이나 함수 호출은 표현식이어서 사용할 수 있지만, 한 줄에 복잡한 분기와 부수 효과를 압축하면 읽고 디버깅하기 어렵습니다.",
        "lambda를 이름에 바로 대입해 add2 = lambda ...로 오래 재사용한다면 보통 def add2(...):가 더 낫습니다. def는 의미 있는 함수 이름, docstring, 타입 힌트, 여러 줄 검증, 읽기 쉬운 traceback을 제공합니다. lambda는 sorted(..., key=lambda row: row['score'])처럼 사용하는 곳에서 짧고 지역적인 동작이 명백할 때 가장 가치가 큽니다.",
      ],
      concepts: [
        {
          term: "lambda expression",
          definition: "매개변수 목록과 단일 표현식으로 익명 함수 객체를 만드는 표현식입니다.",
          detail: [
            "lambda 자체가 호출 결과가 아니라 함수 객체를 만듭니다.",
            "일반 함수처럼 외부 이름을 참조하고 클로저를 만들 수 있습니다.",
          ],
          caveat: "익명이라고 해도 add2 변수에 바인딩할 수 있습니다. 다만 내부 이름과 traceback 표시는 보통 <lambda>라 여러 lambda가 겹치면 진단이 어렵습니다.",
        },
        {
          term: "표현식",
          definition: "평가하면 하나의 값을 만드는 코드 조각입니다.",
          detail: [
            "x + y, text.strip(), 'A' if ok else 'B'는 표현식입니다.",
            "for 문, while 문, try 문, return 문은 일반 문장이므로 lambda 본문에 직접 둘 수 없습니다.",
          ],
        },
      ],
      codeExamples: [
        {
          id: "lambda-source-basics",
          title: "일반 함수와 lambda의 호출 결과 비교",
          language: "python",
          filename: "lambda_basics.py",
          purpose: "원본 ex09_lambda.py의 네 호출을 그대로 재구성해 인수 개수와 반환 결과가 일반 함수와 같음을 확인합니다.",
          code: "def add(x, y):\n    return x + y\n\nadd2 = lambda x, y: x + y\nhello = lambda: 'Hello Python'\nhi = lambda msg: f'{msg}님 환영합니다.'\n\nprint(add(10, 3))\nprint(add2(10, 3))\nprint(hello())\nprint(hi('hong'))\nprint(add.__name__, add2.__name__)",
          walkthrough: [
            {
              lines: "1-2",
              explanation: "def는 add라는 내부 이름을 가진 함수 객체를 만들며 명시적인 return으로 합계를 반환합니다.",
            },
            {
              lines: "4",
              explanation: "lambda도 x와 y를 받고 합계를 반환하지만 함수 객체의 기본 내부 이름은 <lambda>입니다.",
            },
            {
              lines: "5-6",
              explanation: "매개변수가 없는 함수와 하나인 함수도 lambda로 만들 수 있습니다. 콜론 뒤에는 각각 문자열 리터럴과 f-string 표현식 하나가 있습니다.",
            },
            {
              lines: "8-11",
              explanation: "일반 함수와 lambda의 반환값을 같은 방식으로 호출하고 출력합니다.",
            },
            {
              lines: "12",
              explanation: "__name__을 비교하면 def 함수는 add, lambda는 <lambda>로 나타나 진단·로그에서 이름 있는 함수가 유리한 이유를 보여 줍니다.",
            },
          ],
          run: {
            environment: ["Python 3.11 이상", "UTF-8로 저장한 lambda_basics.py", "외부 패키지 없음"],
            command: "python lambda_basics.py",
          },
          output: {
            value: "13\n13\nHello Python\nhong님 환영합니다.\nadd <lambda>",
            explanation: [
              "두 덧셈 함수의 호출 규약과 반환 결과는 동일합니다.",
              "lambda도 인자 없는 함수와 문자열 포맷 함수가 될 수 있습니다.",
              "내부 함수 이름 차이는 예외 traceback과 관찰성에서 def가 더 명확할 수 있음을 보여 줍니다.",
            ],
          },
          experiments: [
            {
              change: "add2 본문을 lambda x, y: print(x + y)로 바꿔 반환값도 별도로 출력합니다.",
              prediction: "함수 내부에서 13을 출력하지만 반환값은 None이므로 바깥 print는 None을 출력합니다.",
              result: "화면 출력 부수 효과와 값을 반환하는 transform 계약이 다름을 확인합니다.",
            },
            {
              change: "lambda 본문에 x = x + 1 같은 일반 대입문을 넣습니다.",
              prediction: "lambda는 표현식 하나만 허용하므로 SyntaxError가 발생합니다.",
              result: "여러 단계가 필요하면 def 함수로 전환해야 합니다.",
            },
          ],
          sourceRefs: ["py-lambda-basic", "py-day04-lambda-note"],
        },
      ],
      diagnostics: [
        {
          symptom: "lambda 줄에서 SyntaxError가 발생한다.",
          likelyCause: "콜론 뒤에 return, 일반 대입, 여러 문장처럼 표현식이 아닌 문법을 넣었거나 매개변수와 콜론 구문이 잘못됐습니다.",
          checks: [
            "본문을 하나의 값으로 평가할 수 있는 표현식 하나로 줄여 봅니다.",
            "일반 함수로 먼저 작성해 검증·분기·부수 효과가 몇 단계인지 확인합니다.",
            "여러 단계라면 lambda를 고집하지 않습니다.",
          ],
          fix: "짧은 단일 표현식만 lambda로 남기고 나머지는 의미 있는 이름의 def 함수로 옮깁니다.",
          prevention: "한 줄 길이보다 한 가지 책임과 읽기 쉬운 이름을 기준으로 lambda 사용을 리뷰합니다.",
        },
      ],
    },
    {
      id: "map-transform-and-laziness",
      title: "map은 모든 원소에 변환 함수를 지연 적용합니다",
      lead: "map(transform, iterable)은 결과 리스트를 즉시 만드는 대신 다음 원소가 요청될 때 transform을 호출하는 map 이터레이터를 반환합니다.",
      explanations: [
        "원본은 [1,2,3,4,5]의 각 값에 2를 곱하는 작업을 for, 리스트 컴프리헨션, list(map(lambda ...)) 세 방식으로 비교합니다. 세 결과는 모두 [2,4,6,8,10]이지만 실행 구조와 읽는 방식은 다릅니다. for는 여러 단계와 부수 효과를 명시하기 쉽고, 컴프리헨션은 새 컬렉션 생성이 바로 보이며, map은 이미 존재하는 변환 함수를 적용하는 pipeline을 드러냅니다.",
        "Python 3의 map은 지연 평가됩니다. map 객체를 만드는 순간에는 transform이 각 원소에 실행되지 않을 수 있고, list로 소비하거나 for로 꺼낼 때 실행됩니다. 한 번 끝까지 소비한 이터레이터를 다시 list로 만들면 빈 리스트가 나옵니다. 결과를 여러 번 순회해야 하면 한 번 list로 materialize해서 그 리스트를 재사용해야 합니다.",
        "map은 transform의 반환값을 원소로 내보냅니다. transform이 print만 하고 값을 반환하지 않으면 결과는 None들입니다. 부수 효과만 목적으로 map을 만들고 소비하지 않는 코드는 실행조차 되지 않을 수 있으므로 일반 for를 선택하세요.",
        "둘 이상의 이터러블을 map에 주면 함수는 같은 위치 원소들을 함께 받으며 기본적으로 가장 짧은 입력에서 멈춥니다. 원본 노트는 Python 3.14부터 strict=True로 길이 불일치를 오류로 만들 수 있음을 별도 호환 범위로 기록합니다. 배포 최소 버전을 확인하지 않고 strict를 사용하면 이전 버전에서 TypeError가 납니다.",
      ],
      concepts: [
        {
          term: "transform",
          definition: "입력 원소 하나를 받아 대응하는 새 값을 만드는 함수입니다.",
          detail: [
            "map은 원본 원소가 아니라 transform의 반환값을 내보냅니다.",
            "같은 입력에 같은 결과를 내고 부수 효과가 적을수록 재사용·테스트가 쉽습니다.",
          ],
        },
        {
          term: "지연 평가",
          definition: "결과가 실제로 요청될 때까지 계산을 미루는 방식입니다.",
          detail: [
            "큰 데이터에서 중간 리스트 메모리를 줄일 수 있습니다.",
            "예외와 부수 효과가 map 생성 시점이 아니라 소비 시점에 나타날 수 있습니다.",
          ],
        },
        {
          term: "이터레이터 소비",
          definition: "next 또는 for/list 변환으로 이터레이터에서 원소를 차례로 꺼내 진행 위치를 끝까지 이동시키는 일입니다.",
          detail: [
            "map과 filter는 한 번 끝까지 소비하면 같은 객체에서 원소가 다시 나오지 않습니다.",
            "여러 번 사용하려면 원본에서 새 이터레이터를 만들거나 리스트로 저장합니다.",
          ],
        },
      ],
      codeExamples: [
        {
          id: "map-filter-three-styles",
          title: "for·컴프리헨션·map/filter 결과와 이터레이터 소비 비교",
          language: "python",
          filename: "transform_filter.py",
          purpose: "원본 ex01_lambda.py의 변환·짝수 필터를 독립 실행 예제로 재구성하고 map의 지연·1회 소비를 추가 검증합니다.",
          code: "numbers = [1, 2, 3, 4, 5]\n\nfor_result = []\nfor number in numbers:\n    for_result.append(number * 2)\n\ncomprehension_result = [number * 2 for number in numbers]\nmap_result = list(map(lambda number: number * 2, numbers))\neven_result = list(filter(lambda number: number % 2 == 0, numbers))\n\nprint(f'for: {for_result}')\nprint(f'comprehension: {comprehension_result}')\nprint(f'map: {map_result}')\nprint(f'filter: {even_result}')\n\nlazy_map = map(lambda number: number + 10, numbers)\nprint(type(lazy_map).__name__)\nprint(list(lazy_map))\nprint(list(lazy_map))",
          walkthrough: [
            {
              lines: "1-5",
              explanation: "일반 for가 빈 리스트를 만들고 각 변환 결과를 append합니다. 처리 순서와 중간 동작을 추가하기 쉽습니다.",
            },
            {
              lines: "7",
              explanation: "컴프리헨션은 원소 생성 표현식과 순회를 한 줄에 두며 새 리스트 생성이 문법에 드러납니다.",
            },
            {
              lines: "8",
              explanation: "map은 lambda transform을 각 원소에 적용하고 list가 이터레이터를 소비해 결과를 materialize합니다.",
            },
            {
              lines: "9",
              explanation: "filter predicate가 True인 원래 숫자만 남겨 [2,4]를 만듭니다. 2로 변환하는 map과 역할이 다릅니다.",
            },
            {
              lines: "16-19",
              explanation: "lazy_map 타입은 map이며 첫 list 변환에서 [11..15]를 소비합니다. 같은 객체를 다시 변환하면 진행 위치가 끝이라 빈 리스트입니다.",
            },
          ],
          run: {
            environment: ["Python 3.11 이상", "UTF-8로 저장한 transform_filter.py", "외부 패키지 없음"],
            command: "python transform_filter.py",
          },
          output: {
            value: "for: [2, 4, 6, 8, 10]\ncomprehension: [2, 4, 6, 8, 10]\nmap: [2, 4, 6, 8, 10]\nfilter: [2, 4]\nmap\n[11, 12, 13, 14, 15]\n[]",
            explanation: [
              "같은 변환은 세 표현 모두 같은 리스트를 만들 수 있으므로 선택 기준은 결과가 아니라 읽기·확장·평가 방식입니다.",
              "filter는 predicate를 만족한 원래 원소를 남겨 짝수 [2,4]가 됩니다.",
              "map 객체는 리스트가 아니고 한 번 소비된 뒤 비어 있습니다.",
            ],
          },
          experiments: [
            {
              change: "map_result에서 바깥 list를 제거하고 그대로 출력합니다.",
              prediction: "숫자 리스트가 아니라 <map object at ...> 같은 객체 표현이 보입니다.",
              result: "map은 결과 컬렉션이 아니라 지연 이터레이터를 반환합니다.",
            },
            {
              change: "lambda를 print로 바꾸고 map 객체를 만들기만 하되 소비하지 않습니다.",
              prediction: "지연 평가라 print가 실행되지 않습니다.",
              result: "부수 효과를 위한 반복에는 map보다 일반 for가 명확합니다.",
            },
          ],
          sourceRefs: ["py-lambda-map-filter", "py-day05-lambda-note"],
        },
      ],
      diagnostics: [
        {
          symptom: "map 결과를 출력했더니 숫자 목록 대신 <map object at ...>가 나온다.",
          likelyCause: "map이 지연 이터레이터를 반환하는데 materialize하지 않고 객체 표현만 출력했습니다.",
          checks: [
            "type(result)와 iter(result) is result를 확인합니다.",
            "결과를 한 번만 순회할지 여러 번 재사용할지 결정합니다.",
            "이미 다른 코드가 이터레이터를 소비했는지 확인합니다.",
          ],
          fix: "즉시 전체 결과가 필요하면 list(result), tuple(result) 등으로 한 번 변환하고 그 컬렉션을 재사용합니다.",
          prevention: "함수 반환 타입을 iterator인지 collection인지 명시하고 이터레이터를 여러 소비자에게 공유하지 않습니다.",
        },
        {
          symptom: "첫 list(mapper)는 값이 있는데 두 번째 list(mapper)는 []다.",
          likelyCause: "같은 map 이터레이터를 첫 변환에서 끝까지 소비했습니다.",
          checks: [
            "두 list 호출이 같은 객체를 사용하는지 확인합니다.",
            "원본 iterable이 재순회 가능한 list인지 일회성 generator인지 확인합니다.",
          ],
          fix: "첫 결과 리스트를 변수에 저장해 재사용하거나 원본 iterable로 새 map 객체를 만듭니다.",
          prevention: "이터레이터 ownership을 한 곳으로 정하고 함수 경계에서 일회성 소비 여부를 문서화합니다.",
        },
      ],
    },
    {
      id: "filter-predicates-and-truthiness",
      title: "filter는 predicate가 truthy인 원래 원소를 남깁니다",
      lead: "filter는 값을 바꾸지 않고 각 원소에 대한 질문의 진리값을 이용해 통과 여부만 결정합니다.",
      explanations: [
        "filter(lambda x: x % 2 == 0, numbers)는 predicate가 bool을 반환하므로 의미가 직접적입니다. 하지만 filter는 정확히 bool 타입만 요구하지 않고 truthiness를 사용합니다. predicate가 빈 문자열, 0, None을 반환하면 제외되고 비어 있지 않은 문자열이나 객체를 반환하면 포함됩니다.",
        "filter(None, iterable)은 각 원소 자체의 truthiness를 사용해 falsy 값을 제거합니다. [0, '', None, 3]에서 [3]만 남지만 0이 유효한 측정값이면 데이터가 손실됩니다. '비어 있지 않은 문자열만'처럼 질문을 명시하는 predicate가 요구사항을 더 잘 보존합니다.",
        "단순 필터링은 [x for x in values if predicate(x)]가 원소와 조건을 한눈에 보여 Python 코드에서 더 읽기 쉬운 경우가 많습니다. filter는 이미 이름 있는 predicate가 있고 그 계약을 재사용할 때, 또는 지연 pipeline을 유지할 때 유용합니다.",
        "predicate는 판정만 하고 외부 상태를 변경하지 않는 편이 좋습니다. 호출 순서·횟수가 바뀌거나 이터레이터가 일부만 소비되면 부수 효과 결과도 달라지기 때문입니다.",
      ],
      concepts: [
        {
          term: "predicate",
          definition: "입력 원소를 받아 포함·제외 또는 조건 충족 여부를 판정하는 함수입니다.",
          detail: [
            "명시적인 bool 반환이 읽기 쉽지만 filter는 반환값의 truthiness를 사용합니다.",
            "이름은 is_even, has_permission처럼 질문형 의미가 좋습니다.",
          ],
        },
        {
          term: "filter(None, iterable)",
          definition: "별도 predicate 없이 각 원소 자체의 truthiness로 falsy 원소를 제거하는 표현입니다.",
          detail: [
            "None뿐 아니라 0, False, 빈 문자열, 빈 컬렉션이 모두 제거됩니다.",
            "데이터 정제 요구가 정확히 그 범주와 같을 때만 사용합니다.",
          ],
          caveat: "누락값만 제거하려는 목적에는 value is not None predicate가 더 정확합니다. filter(None, ...)는 정상 0까지 잃습니다.",
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "filter(None, measurements)를 사용한 뒤 유효한 0 측정값이 사라졌다.",
          likelyCause: "None만 제거한다고 생각했지만 filter(None, ...)는 모든 falsy 값을 제거합니다.",
          checks: [
            "원본 데이터에 0, False, '', 빈 컬렉션이 있는지 세어 봅니다.",
            "제거 목적이 누락값인지 빈 값 전체인지 명시합니다.",
            "predicate를 각 경계값에 직접 호출해 반환을 확인합니다.",
          ],
          fix: "None만 제거하려면 filter(lambda value: value is not None, measurements) 또는 동등한 컴프리헨션을 사용합니다.",
          prevention: "정제 전후 개수와 보존해야 하는 경계값을 테스트하고 축약된 truthiness 필터를 코드 리뷰에서 확인합니다.",
        },
      ],
    },
    {
      id: "dicts-operator-and-comprehensions",
      title: "딕셔너리 구조에는 컴프리헨션과 operator가 의도를 더 잘 드러낼 수 있습니다",
      lead: "원본은 items 튜플의 x[0], x[1]을 lambda로 다루지만, key·value 언패킹이나 itemgetter가 구조 의미를 더 명확히 표현할 때가 많습니다.",
      explanations: [
        "원본은 dict(map(lambda x: (x[0], x[1] + 5), scores.items()))로 모든 점수에 5를 더합니다. 동작은 정확하지만 x[0]과 x[1]의 의미를 독자가 추론해야 합니다. {subject: score + 5 for subject, score in scores.items()}는 이름으로 구조를 설명하고 새 dict를 만든다는 목적도 문법에 보입니다.",
        "70점 이상 필터도 dict(filter(lambda x: x[1] >= 70, scores.items()))로 구현할 수 있습니다. 컴프리헨션은 {subject: score for subject, score in ... if score >= 70}처럼 판정 대상이 분명합니다. filter는 이름 있는 predicate를 여러 위치에서 재사용하거나 이터레이터 pipeline을 유지할 때 선택할 수 있습니다.",
        "정렬 key처럼 구조에서 특정 위치만 꺼내는 lambda는 operator.itemgetter('score')나 attrgetter('score')로 대체할 수 있습니다. 이 도구는 인덱스·속성 추출 의도를 이름으로 표현하고 C로 구현된 경로가 빠를 수 있지만, 복잡한 계산이나 fallback이 필요하면 이름 있는 함수가 낫습니다.",
        "표현 길이만으로 고르지 마세요. 변환·필터·출력 형식이 한 줄에 겹치면 일반 for가 중간 값을 검사하고 오류를 개별 처리하기 쉽습니다. 한 줄을 세 줄로 늘려 의도를 얻는 것은 실패가 아닙니다.",
      ],
      concepts: [
        {
          term: "operator.itemgetter",
          definition: "인덱스나 mapping key로 항목을 꺼내는 호출 가능한 객체를 만드는 표준 라이브러리 도구입니다.",
          detail: [
            "sorted(rows, key=itemgetter('score'))처럼 구조적 추출 의도를 드러냅니다.",
            "여러 key를 주면 tuple을 반환해 다중 정렬 key에도 쓸 수 있습니다.",
          ],
        },
        {
          term: "구조 언패킹",
          definition: "튜플·리스트 등 한 원소의 구성값을 의미 있는 여러 이름에 동시에 바인딩하는 문법입니다.",
          detail: [
            "for subject, score in scores.items()처럼 x[0], x[1]을 역할 이름으로 바꿉니다.",
            "구조가 예상과 다르면 즉시 ValueError로 드러나 schema 문제를 찾을 수 있습니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        {
          title: "같은 변환을 어떤 표현으로 쓸까요?",
          options: [
            {
              name: "컴프리헨션",
              chooseWhen: "하나의 컬렉션에서 간단한 변환·필터로 새 list/set/dict를 즉시 만들 때",
              avoidWhen: "여러 단계 오류 처리·로그·부수 효과가 필요하거나 지연 평가가 핵심일 때",
              tradeoffs: ["생성할 컬렉션 타입이 문법에 보입니다.", "언패킹과 조건을 가까이 둘 수 있습니다.", "중첩이 깊으면 읽기 어려워집니다."],
            },
            {
              name: "map/filter",
              chooseWhen: "이미 이름 있는 transform/predicate를 재사용하거나 지연 pipeline을 구성할 때",
              avoidWhen: "lambda가 길어져 의미를 숨기거나 결과를 여러 번 소비해야 할 때",
              tradeoffs: ["동작을 데이터 흐름으로 조합합니다.", "이터레이터 수명과 예외 시점 관리가 필요합니다.", "단순 lambda는 컴프리헨션보다 낯설 수 있습니다."],
            },
            {
              name: "일반 for",
              chooseWhen: "여러 분기, 상태 변경, 개별 오류 복구, 진단 로그가 필요할 때",
              avoidWhen: "아주 단순한 순수 변환을 장황하게 늘릴 때",
              tradeoffs: ["실행 순서와 중간 상태가 가장 명확합니다.", "보일러플레이트가 늘 수 있습니다.", "부수 효과를 의도적으로 표현하기 좋습니다."],
            },
          ],
        },
      ],
    },
    {
      id: "partial-and-callback-contracts",
      title: "partial은 인수를 고정하고 callback은 계약을 고정합니다",
      lead: "lambda로 단순히 기존 함수를 감싸는 코드라면 functools.partial이 어떤 인수를 미리 채웠는지 더 직접적으로 표현할 수 있습니다.",
      explanations: [
        "partial(function, fixed_arg, keyword=value)는 원래 함수의 일부 인수를 미리 채운 새 호출 가능한 객체를 만듭니다. lambda text: parse(text, base=16)처럼 전달만 하는 wrapper는 partial(parse, base=16)로 쓸 수 있습니다. 원래 함수와 고정 인수를 속성으로 검사할 수 있어 도구와 테스트에도 유리합니다.",
        "callback 설계에서 가장 중요한 것은 짧은 문법이 아니라 계약입니다. 입력 타입, 반환 타입, 예외를 누가 처리하는지, 동기·비동기 여부, 몇 번 호출되는지, 순서가 보장되는지를 정해야 합니다. lambda는 이 계약을 자동으로 만들어 주지 않습니다.",
        "외부 상태를 변경하는 callback은 재시도나 중복 호출에서 문제가 생깁니다. 정렬 key는 같은 원소에 여러 번 호출될 수 있다고 가정하고 순수하게 유지합니다. 이벤트 handler는 예외가 전체 dispatcher를 중단할지 격리될지 정책을 둡니다.",
        "operator 함수와 partial은 lambda를 모두 대체하는 만능 도구가 아닙니다. 짧은 계산이 사용 지점에서 가장 분명하면 lambda가 좋고, 도메인 규칙과 검증이 있으면 def가 좋습니다. 선택 기준은 코드가 무엇을 하는지 한 번에 말할 수 있는가입니다.",
      ],
      concepts: [
        {
          term: "functools.partial",
          definition: "기존 호출 가능 객체의 일부 위치·키워드 인수를 미리 고정한 새 호출 가능 객체를 만듭니다.",
          detail: [
            "함수 호출을 바로 실행하지 않고 나중에 남은 인수를 받아 실행합니다.",
            "callback 설정과 변환 pipeline에서 반복되는 wrapper lambda를 줄일 수 있습니다.",
          ],
        },
        {
          term: "순수 함수",
          definition: "같은 입력에 같은 출력을 내고 관찰 가능한 외부 상태를 변경하지 않는 함수입니다.",
          detail: [
            "map transform, filter predicate, sorted key는 순수할수록 예측과 테스트가 쉽습니다.",
            "모든 함수가 순수해야 하는 것은 아니지만 부수 효과 경계를 분리해야 합니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "callback이 예상과 다른 개수로 호출되어 로그·DB 변경이 중복된다.",
          likelyCause: "callback을 순수한 계산처럼 전달했지만 실제 구현이 외부 상태를 변경하고 호출 측의 재시도·정렬·평가 횟수를 가정했습니다.",
          checks: [
            "callback 호출 계약과 실제 호출 횟수를 계측합니다.",
            "동일 입력 재호출이 안전한지 확인합니다.",
            "변환 결과와 부수 효과를 한 함수에 섞었는지 봅니다.",
          ],
          fix: "계산 callback을 순수하게 만들고 외부 상태 변경은 명시적 단계로 분리하거나 idempotency key를 사용합니다.",
          prevention: "callback 계약에 호출 횟수·예외·부수 효과 정책을 기록하고 중복 호출 테스트를 둡니다.",
        },
      ],
      expertNotes: [
        "보안 필터를 lambda 한 줄로 숨기지 않습니다. 권한 predicate는 이름 있는 함수로 만들고 deny-by-default, 감사 로그, 정책 버전 테스트를 둡니다.",
      ],
    },
    {
      id: "late-binding-closures",
      title: "루프 안 lambda는 변수의 마지막 값을 공유할 수 있습니다",
      lead: "클로저는 값을 생성 시점에 복사하는 대신 바깥 이름을 호출 시점에 찾으므로, 늦게 실행되는 callback에서 모두 같은 결과가 나올 수 있습니다.",
      explanations: [
        "for factor in [1,2,3] 안에서 lambda x: x * factor를 세 번 만들면 각 함수가 1,2,3 값을 독립 복사할 것처럼 보입니다. 그러나 lambda는 같은 바깥 이름 factor를 참조하고, 루프가 끝난 뒤 factor는 3입니다. 나중에 세 함수를 호출하면 모두 x*3을 계산합니다. 이것이 late binding closure 함정입니다.",
        "lambda만의 문제가 아닙니다. 루프 안 def로 내부 함수를 만들어도 같은 이름 탐색 규칙을 쓰면 동일하게 발생합니다. 핵심은 익명 여부가 아니라 클로저가 바깥 변수값을 언제 조회하는가입니다.",
        "간단한 해결은 lambda x, factor=factor: ...처럼 현재 값을 기본 인수로 평가해 각 함수의 지역 기본값에 고정하는 것입니다. functools.partial(operator.mul, factor)는 고정 인수가 명시적으로 보이고, factory 함수는 의미 있는 이름·검증·타입 힌트를 추가하기 좋습니다.",
        "GUI 버튼, 비동기 task, 이벤트 구독처럼 콜백이 루프 뒤에 실행되는 곳에서 자주 나타납니다. 생성 직후가 아니라 실제 실행 시점과 마지막 반복값으로 테스트해야 합니다.",
      ],
      concepts: [
        {
          term: "closure",
          definition: "함수가 정의된 바깥 lexical scope의 이름을 참조하며 그 환경과 함께 동작하는 함수입니다.",
          detail: [
            "바깥 함수가 끝난 뒤에도 필요한 참조가 유지될 수 있습니다.",
            "참조한 이름의 현재 값이 호출 시점에 사용될 수 있습니다.",
          ],
        },
        {
          term: "late binding",
          definition: "클로저가 참조한 바깥 이름의 값을 함수 생성 시점이 아니라 실제 호출 시점에 조회하는 성질입니다.",
          detail: [
            "루프가 끝난 뒤 callback을 호출하면 마지막 반복값이 보일 수 있습니다.",
            "기본 인수·partial·factory로 현재 값을 별도 지역에 고정할 수 있습니다.",
          ],
        },
      ],
      codeExamples: [
        {
          id: "late-binding-and-fixes",
          title: "late binding 실패와 기본 인수·partial 해결 비교",
          language: "python",
          filename: "callback_binding.py",
          purpose: "루프가 만든 callback 세 개가 모두 마지막 factor를 보는 오류를 재현하고 두 가지 안전한 고정 방식을 정확한 출력으로 비교합니다.",
          code: "from functools import partial\nfrom operator import mul\n\nbad_callbacks = []\nfor factor in [1, 2, 3]:\n    bad_callbacks.append(lambda value: value * factor)\n\ndefault_callbacks = []\nfor factor in [1, 2, 3]:\n    default_callbacks.append(\n        lambda value, factor=factor: value * factor\n    )\n\npartial_callbacks = [partial(mul, factor) for factor in [1, 2, 3]]\n\nprint([callback(10) for callback in bad_callbacks])\nprint([callback(10) for callback in default_callbacks])\nprint([callback(10) for callback in partial_callbacks])",
          walkthrough: [
            {
              lines: "1-2",
              explanation: "partial과 operator.mul을 사용해 일부 인수를 고정한 곱셈 callback을 만들 준비를 합니다.",
            },
            {
              lines: "4-6",
              explanation: "세 lambda 모두 바깥 factor 이름을 캡처합니다. 값을 즉시 호출하지 않으므로 루프가 끝난 뒤 factor=3을 함께 봅니다.",
            },
            {
              lines: "8-12",
              explanation: "기본 인수의 기본값은 lambda가 만들어질 때 평가되므로 각 반복의 1,2,3이 서로 다른 함수 기본값에 고정됩니다.",
            },
            {
              lines: "14",
              explanation: "partial(mul, factor)는 mul의 첫 인수를 현재 factor로 고정하고 나중에 value 하나를 받는 callback을 만듭니다.",
            },
            {
              lines: "16-18",
              explanation: "같은 10을 세 그룹 callback에 전달해 실패 [30,30,30]과 의도 [10,20,30]을 나란히 검증합니다.",
            },
          ],
          run: {
            environment: ["Python 3.11 이상", "UTF-8로 저장한 callback_binding.py", "표준 라이브러리 functools·operator만 사용"],
            command: "python callback_binding.py",
          },
          output: {
            value: "[30, 30, 30]\n[10, 20, 30]\n[10, 20, 30]",
            explanation: [
              "실패 그룹은 호출 시점의 factor=3을 모든 함수가 공유합니다.",
              "기본 인수 그룹은 생성 시점의 현재 factor를 각 함수에 고정합니다.",
              "partial 그룹은 고정할 함수와 인수가 구조적으로 드러나 같은 의도 결과를 냅니다.",
            ],
          },
          experiments: [
            {
              change: "bad_callbacks를 루프 안에서 즉시 callback(10)으로 호출합니다.",
              prediction: "각 반복 중 factor가 아직 1,2,3이므로 10,20,30이 나옵니다.",
              result: "오류는 함수 생성이 아니라 나중 호출될 때 이름값이 바뀌어 있는 상황에서 드러납니다.",
            },
            {
              change: "기본 인수 방식 대신 def make_multiplier(factor): return lambda value: value * factor factory를 사용합니다.",
              prediction: "factory 호출마다 별도 지역 factor 바인딩이 생겨 [10,20,30]이 됩니다.",
              result: "검증·문서화가 커지면 factory와 이름 있는 내부 함수가 더 명확합니다.",
            },
          ],
          sourceRefs: ["python-lambda-reference", "python-late-binding-faq", "python-partial-reference"],
        },
      ],
      diagnostics: [
        {
          symptom: "루프에서 만든 버튼·작업 callback들이 모두 마지막 항목만 처리한다.",
          likelyCause: "각 callback이 값을 복사하지 않고 같은 루프 변수 이름을 late binding으로 참조합니다.",
          checks: [
            "callback을 생성한 즉시 호출한 결과와 루프 종료 후 호출한 결과를 비교합니다.",
            "callback.__closure__와 free variable 이름을 확인해 같은 바깥 바인딩을 참조하는지 봅니다.",
            "기본 인수 또는 partial 버전으로 최소 재현합니다.",
          ],
          fix: "현재 값을 기본 인수에 고정하거나 partial을 사용하고, 복잡한 로직은 factory가 새 지역 scope를 만들게 합니다.",
          prevention: "루프가 끝난 뒤 모든 callback을 서로 다른 기대값으로 호출하는 회귀 테스트를 둡니다.",
        },
      ],
    },
    {
      id: "source-runtime-and-design-review",
      title: "원본 실행의 import 부수 효과까지 학습 근거로 읽습니다",
      lead: "코드 조각의 결과만 맞는지뿐 아니라 파일이 어떤 방식으로 실행되고 다른 모듈을 불러올 때 무엇이 함께 실행되는지도 검토해야 합니다.",
      explanations: [
        "원본 day05 예제를 파일 경로로 직접 실행하면 day04 패키지를 찾지 못해 ModuleNotFoundError가 발생합니다. 프로젝트 루트에서 python -m day05.ex01_lambda로 모듈 실행하면 import는 성공하지만, t_tuple 하나를 얻기 위해 가져온 day04.ex03_for의 최상위 print들이 먼저 모두 실행됩니다.",
        "이 부수 효과 때문에 map/filter 결과 앞에 이름·색상·딕셔너리 순회 출력이 길게 나타납니다. import는 함수·변수 정의만 읽는 특별 동작이 아니라 모듈 최상위 문장을 한 번 실행합니다. 재사용할 데이터는 출력 예제 모듈과 분리하거나 main guard를 사용해야 합니다.",
        "학습 페이지의 실행 예제는 이 import 잡음을 제거한 독립 파일로 재구성했지만, sourceCoverage에는 실패와 원인을 숨기지 않습니다. 원본을 그대로 실행하는 법과 개념만 재현한 독립 예제를 구분해야 결과가 정직합니다.",
        "최종 선택 체크리스트는 간단합니다. 동작이 한 표현식이고 사용 지점에서 의미가 분명하면 lambda, 이름 있는 규칙이면 def, 새 컬렉션을 즉시 만들면 컴프리헨션, 기존 함수의 지연 pipeline이면 map/filter, 인수 고정 wrapper면 partial, 단순 항목 추출이면 operator를 우선 검토합니다.",
      ],
      concepts: [
        {
          term: "import side effect",
          definition: "모듈을 import할 때 정의 외의 최상위 출력·파일 접근·네트워크 호출 등이 함께 실행되는 현상입니다.",
          detail: [
            "Python은 첫 import에서 모듈 최상위 코드를 실행합니다.",
            "재사용 모듈은 import만으로 사용자 출력이나 외부 변경이 생기지 않게 설계하는 편이 안전합니다.",
          ],
        },
        {
          term: "main guard",
          definition: "파일을 직접 실행할 때만 데모 코드를 실행하고 import 시에는 건너뛰게 하는 if __name__ == '__main__' 조건입니다.",
          detail: [
            "함수·상수 정의와 실행 데모를 분리합니다.",
            "모듈 테스트와 재사용 시 예기치 않은 출력을 줄입니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "python day05/ex01_lambda.py 실행에서 ModuleNotFoundError: No module named 'day04'가 발생한다.",
          likelyCause: "스크립트 파일이 있는 day05가 import 검색 시작 경로가 되어 프로젝트 루트의 sibling day04를 패키지로 찾지 못했습니다.",
          checks: [
            "현재 작업 폴더와 sys.path[0]를 확인합니다.",
            "프로젝트 루트에서 python -m day05.ex01_lambda를 실행해 비교합니다.",
            "패키지 구조와 import 경계를 확인합니다.",
          ],
          fix: "프로젝트 루트에서 모듈 방식으로 실행하고, 장기적으로는 설치 가능한 패키지 구조와 명확한 import를 사용합니다.",
          prevention: "README에 실행 위치와 -m 명령을 기록하고 CI에서 깨끗한 환경으로 실행합니다.",
        },
        {
          symptom: "lambda/map 예제보다 먼저 관련 없어 보이는 for·dict 출력이 대량으로 나온다.",
          likelyCause: "t_tuple을 import한 모듈의 최상위 데모 코드가 import 시 실행되는 부수 효과입니다.",
          checks: [
            "trace 출력의 시작이 import 대상 모듈 내용과 같은지 확인합니다.",
            "import 대상 파일의 최상위 print·파일 접근을 검색합니다.",
            "정의와 데모가 main guard로 분리됐는지 봅니다.",
          ],
          fix: "재사용 값·함수를 부수 효과 없는 모듈로 옮기고 데모 실행은 main guard 안에 둡니다.",
          prevention: "import smoke test에서 stdout·파일 변경이 없는지 검증하고 예제 모듈과 라이브러리 모듈을 분리합니다.",
        },
      ],
      comparisons: [
        {
          title: "lambda와 이름 있는 def를 어떻게 고를까요?",
          options: [
            {
              name: "lambda",
              chooseWhen: "한 표현식의 짧은 지역 callback이고 이름을 따로 찾는 비용이 더 클 때",
              avoidWhen: "검증·예외 처리·타입 설명·재사용·로그 식별이 필요할 때",
              tradeoffs: ["사용 위치와 동작이 가깝습니다.", "내부 이름이 <lambda>라 traceback이 모호합니다.", "한 줄에 복잡성을 숨길 수 있습니다."],
            },
            {
              name: "def",
              chooseWhen: "도메인 규칙에 이름이 필요하고 여러 줄 검증·문서화·테스트·재사용이 있을 때",
              avoidWhen: "아주 자명한 key 표현 하나 때문에 코드 흐름이 멀리 분산될 때",
              tradeoffs: ["의미 있는 이름·docstring·타입 힌트가 가능합니다.", "호출부와 정의가 멀어질 수 있습니다.", "예외 traceback과 프로파일링이 명확합니다."],
            },
          ],
        },
      ],
      expertNotes: [
        "성능을 이유로 lambda·map 또는 컴프리헨션을 추측 선택하지 않습니다. 실제 데이터와 Python 버전에서 벤치마크하고, 대부분 애플리케이션 코드에서는 가독성과 올바른 지연성 선택을 우선합니다.",
        "Python 3.14의 map(strict=True)은 입력 길이 불일치를 잡지만 이 사이트의 최소 실행 버전이 더 낮다면 버전 가드나 zip strict 등 호환 대안을 문서화해야 합니다.",
      ],
    },
  ],
  lab: {
    title: "학습 기록 변환 pipeline과 callback 레지스트리",
    scenario: "과목·점수 dict 목록을 정규화하고 통과 기록만 선별한 뒤, 출력 형식을 callback으로 바꿀 수 있는 작은 pipeline을 만듭니다.",
    setup: [
      "pipeline_lab.py 파일을 만들고 Python 3.11 이상을 사용합니다.",
      "합성 데이터로 [{'subject':' python ','score':82}, {'subject':'db','score':0}, {'subject':'web','score':71}]을 준비합니다.",
      "외부 패키지는 사용하지 않고 functools와 operator만 허용합니다.",
    ],
    steps: [
      "normalize_record를 def로 만들고 subject 공백 제거·대문자화와 score 보존을 수행합니다.",
      "map(normalize_record, records)를 만들고 아직 소비하지 않았을 때 transform 호출 시점을 관찰합니다.",
      "is_passed 이름 있는 predicate로 score >= 70을 검사하고 filter 결과를 리스트로 만듭니다.",
      "동일 결과를 list comprehension 하나로 작성해 읽기·중간 진단·지연성 trade-off를 기록합니다.",
      "sorted의 key를 lambda와 operator.itemgetter('score') 두 방식으로 작성하고 결과가 같은지 확인합니다.",
      "format_record(record, prefix) 함수를 만들고 partial로 prefix='PASS' callback을 구성합니다.",
      "세 formatter lambda를 루프에서 잘못 만든 뒤 모두 마지막 형식을 쓰는 실패를 재현합니다.",
      "기본 인수·partial·factory 중 하나로 late binding을 고치고 서로 다른 기대 출력 테스트를 둡니다.",
      "predicate가 None만 제거해야 하는 사례에서 filter(None, ...)가 score 0을 잃는 반례를 기록합니다.",
      "정규화 callback이 예외를 낼 때 pipeline에서 어느 시점에 드러나는지와 오류 정책을 문서화합니다.",
    ],
    expectedResult: [
      "정규화된 과목명과 70점 이상 기록만 남은 결정적 목록이 만들어집니다.",
      "map/filter가 소비 시점에 실행되고 같은 이터레이터를 두 번 소비할 수 없음을 확인합니다.",
      "lambda와 itemgetter 정렬 결과가 같고 partial formatter의 고정 인수가 드러납니다.",
      "late binding 실패 [마지막 형식, 마지막 형식, 마지막 형식]과 수정된 서로 다른 출력이 함께 기록됩니다.",
      "정상 점수 0을 보존하는 명시적 predicate가 filter(None)보다 안전함을 설명합니다.",
    ],
    cleanup: ["실습은 합성 학습 데이터만 사용하며 callback 로그에 개인정보나 비밀값을 넣지 않습니다."],
    extensions: [
      "generator input으로 바꾸고 pipeline을 일부만 소비했을 때 호출 횟수를 측정합니다.",
      "callback 타입을 Callable로 명시하고 잘못된 반환 타입을 정적 검사합니다.",
      "Python 3.14 환경이 있으면 두 길이의 iterable에 map(strict=True)를 실험하고 이전 버전 결과와 분리 기록합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "원본의 두 배 변환과 짝수 필터를 for·컴프리헨션·map/filter로 각각 작성하세요.",
      requirements: [
        "입력은 [1,2,3,4,5]로 고정합니다.",
        "세 변환 결과가 [2,4,6,8,10]인지 비교합니다.",
        "세 필터 결과가 [2,4]인지 비교합니다.",
        "map/filter 객체 타입과 list 변환 전후를 출력합니다.",
        "각 표현을 한 문장으로 선택할 상황을 적습니다.",
      ],
      hints: ["map은 변환 함수, filter는 판정 함수를 받습니다.", "이터레이터를 한 번 list로 바꾼 뒤 같은 객체를 다시 소비해 보세요."],
      expectedOutcome: "같은 결과를 세 방식으로 재현하고 결과 동일성과 표현 선택을 구분합니다.",
      solutionOutline: ["for 결과 리스트를 append로 만듭니다.", "컴프리헨션을 작성합니다.", "map/filter에 짧은 lambda를 전달하고 list로 소비합니다."],
    },
    {
      difficulty: "응용",
      prompt: "학생 dict를 점수로 정렬하고 합격자 이름을 추출하는 pipeline을 두 방식으로 구현하세요.",
      requirements: [
        "첫 버전은 컴프리헨션과 lambda key를 사용합니다.",
        "둘째 버전은 이름 있는 predicate, map/filter, itemgetter를 사용합니다.",
        "동점 정렬 정책과 누락 score 오류 정책을 정합니다.",
        "각 중간 결과 타입과 이터레이터 소비 시점을 기록합니다.",
        "두 결과가 같은지 자동 비교합니다.",
      ],
      hints: ["itemgetter('score')는 mapping key 추출 callback입니다.", "누락 key를 조용히 0으로 처리할지 오류로 볼지 요구사항부터 정하세요."],
      expectedOutcome: "구조적 lambda를 표준 operator로 바꾸고 pipeline과 컴프리헨션 trade-off를 근거로 선택합니다.",
    },
    {
      difficulty: "설계",
      prompt: "이벤트 callback 시스템의 등록·호출·오류 격리 정책을 설계하세요.",
      requirements: [
        "callback 입력·반환·예외·호출 순서·중복 호출 계약을 문서화합니다.",
        "루프에서 서로 다른 event 이름 callback을 생성하고 late binding 실패를 재현합니다.",
        "partial 또는 factory로 수정하고 모든 callback 기대값을 테스트합니다.",
        "한 callback 예외가 다른 callback을 중단할지 격리할지 정책을 비교합니다.",
        "재시도 시 부수 효과 중복을 막는 idempotency 전략을 포함합니다.",
        "민감 payload를 로그하지 않는 관찰성 규칙을 정합니다.",
      ],
      hints: ["callback을 직접 실행하지 않고 레지스트리에 함수 객체로 저장하세요.", "등록이 끝난 뒤 호출해야 late binding 오류를 확인할 수 있습니다."],
      expectedOutcome: "lambda 문법 예제를 운영 가능한 callback 계약·테스트·보안 설계로 확장합니다.",
    },
  ],
  reviewQuestions: [
    {
      question: "add와 add(1, 2)는 각각 무엇인가요?",
      answer: "add는 함수 객체 자체를 참조하고 add(1,2)는 그 함수를 즉시 호출한 반환값입니다. callback에는 보통 괄호 없는 함수 객체를 전달합니다.",
    },
    {
      question: "lambda 본문에 여러 문장과 return을 쓸 수 있나요?",
      answer: "아닙니다. lambda 콜론 뒤에는 표현식 하나만 쓸 수 있고 그 결과가 자동 반환됩니다. 여러 단계는 def 함수로 작성합니다.",
    },
    {
      question: "map과 filter의 결과 원소는 어떻게 다른가요?",
      answer: "map은 transform의 반환값을 결과 원소로 내보내고, filter는 predicate가 truthy인 원래 입력 원소를 그대로 남깁니다.",
    },
    {
      question: "왜 list(mapper)를 두 번 호출하면 두 번째가 빈 리스트일 수 있나요?",
      answer: "map은 진행 위치를 가진 이터레이터라 첫 list 변환에서 끝까지 소비됐기 때문입니다.",
    },
    {
      question: "filter(None, values)가 None만 제거하지 않는 이유는 무엇인가요?",
      answer: "각 원소의 truthiness를 사용하므로 None뿐 아니라 0, False, 빈 문자열과 빈 컬렉션도 제거합니다.",
    },
    {
      question: "단순 dict 변환에서 컴프리헨션이 x[0], x[1] lambda보다 읽기 쉬울 수 있는 이유는 무엇인가요?",
      answer: "subject, score처럼 구조를 언패킹한 역할 이름과 새 dict 생성 문법, 필터 조건이 한눈에 보이기 때문입니다.",
    },
    {
      question: "functools.partial은 lambda와 어떤 문제를 다르게 표현하나요?",
      answer: "기존 함수의 일부 인수를 미리 고정한 새 callable이라는 의도를 구조적으로 표현하며 단순 전달 wrapper와 late binding 해결에 유용합니다.",
    },
    {
      question: "루프에서 만든 lambda 세 개가 모두 마지막 factor를 사용하는 이유는 무엇인가요?",
      answer: "클로저가 factor 값을 생성 시점에 복사하지 않고 호출 시점에 같은 바깥 이름을 조회하는 late binding 때문입니다.",
    },
    {
      question: "lambda를 이름에 대입해 오래 재사용할 때 def가 더 나을 수 있는 이유는 무엇인가요?",
      answer: "의미 있는 함수 이름, docstring, 타입 힌트, 여러 줄 검증, 더 명확한 traceback과 테스트 지점을 제공하기 때문입니다.",
    },
    {
      question: "원본 day05 파일을 직접 경로 실행할 때와 -m 모듈 실행할 때 결과가 다른 이유는 무엇인가요?",
      answer: "import 검색 경로가 달라 직접 실행은 sibling day04를 못 찾을 수 있고, 모듈 실행은 import에 성공하지만 대상 모듈의 최상위 출력 부수 효과도 함께 실행하기 때문입니다.",
    },
  ],
  completionChecklist: [
    "함수 객체와 함수 호출 결과를 구분해 callback으로 전달할 수 있다.",
    "lambda의 단일 표현식 문법과 def 전환 기준을 설명할 수 있다.",
    "map 변환과 filter 판정의 결과 차이를 구현할 수 있다.",
    "map/filter 이터레이터의 지연 평가와 1회 소비를 예측할 수 있다.",
    "for·컴프리헨션·map/filter 중 요구에 맞는 표현을 선택할 수 있다.",
    "dict 구조 lambda를 언패킹·itemgetter로 개선할 수 있다.",
    "partial로 일부 인수를 고정한 callback을 만들 수 있다.",
    "late binding 실패를 재현하고 기본 인수·partial·factory로 고칠 수 있다.",
    "import side effect와 모듈 실행 경로 문제를 진단할 수 있다.",
    "callback의 반환·예외·부수 효과·중복 호출 계약을 테스트할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    {
      id: "py-lambda-basic",
      repository: "PYTHON-BASIC",
      path: "day04/ex09_lambda.py",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day04/ex09_lambda.py",
      usedFor: ["lambda 기본 문법", "일반 함수 비교", "인자 없음·있음", "실행 결과"],
      evidence: "공개 main과 동일한 원본을 Python 3.13.9에서 실행해 13, 13, Hello Python, hong님 환영합니다 출력을 확인했습니다.",
    },
    {
      id: "py-lambda-map-filter",
      repository: "PYTHON-BASIC",
      path: "day05/ex01_lambda.py",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day05/ex01_lambda.py",
      usedFor: ["for·컴프리헨션·map 비교", "짝수·홀수 filter", "tuple·set 변환", "dict 변환·필터"],
      evidence: "직접 경로 실행의 ModuleNotFoundError와 프로젝트 루트의 -m 모듈 실행 성공을 모두 확인했습니다. 모듈 실행에서 리스트 두 배 [2,4,6,8,10], 짝수 [2,4], 점수 +5와 70 이상 dict 결과를 검증했습니다.",
    },
    {
      id: "py-lambda-import-dependency",
      repository: "PYTHON-BASIC",
      path: "day04/ex03_for.py",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day04/ex03_for.py",
      usedFor: ["t_tuple import", "최상위 import side effect 진단"],
      evidence: "day05 예제가 t_tuple을 import할 때 이 파일의 모든 최상위 print가 먼저 실행됨을 실제 stdout으로 확인했습니다.",
    },
    {
      id: "py-day04-lambda-note",
      repository: "PYTHON-BASIC",
      path: "notes/day04_loop_function.md",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day04_loop_function.md",
      usedFor: ["lambda 기본 구조", "일반 함수 비교", "이터러블·이터레이터", "셀프 체크"],
      evidence: "lambda 절과 map/filter가 이터레이터라는 후속 설명을 검토해 함수 객체·지연 평가 연결에 사용했습니다.",
    },
    {
      id: "py-day05-lambda-note",
      repository: "PYTHON-BASIC",
      path: "notes/day05_lambda_file_excel.md",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day05_lambda_file_excel.md",
      usedFor: ["map/filter 정의", "세 방식 비교", "dict items 처리", "Python 3.14 map strict 범위"],
      evidence: "Day05 lambda 절과 원본 파일 매핑을 검토하고 최신 버전 차이는 전문가 주의로 분리했습니다.",
    },
    {
      id: "python-lambda-reference",
      repository: "Python 공식 문서",
      path: "reference/expressions.html#lambda",
      publicUrl: "https://docs.python.org/3/reference/expressions.html#lambda",
      usedFor: ["lambda 단일 표현식 규약", "함수 객체 의미"],
      evidence: "원본에서 다루지 않은 lambda 언어 규약과 표현식 제한을 공식 레퍼런스로 보강했습니다.",
    },
    {
      id: "python-partial-reference",
      repository: "Python 공식 문서",
      path: "library/functools.html#functools.partial",
      publicUrl: "https://docs.python.org/3/library/functools.html#functools.partial",
      usedFor: ["partial 인수 고정", "callback 대안"],
      evidence: "단순 wrapper lambda와 late binding 대안의 정확한 호출 규약을 공식 표준 라이브러리 문서로 보강했습니다.",
    },
    {
      id: "python-late-binding-faq",
      repository: "Python 공식 문서",
      path: "faq/programming.html#why-do-lambdas-defined-in-a-loop-with-different-values-all-return-the-same-result",
      publicUrl: "https://docs.python.org/3/faq/programming.html#why-do-lambdas-defined-in-a-loop-with-different-values-all-return-the-same-result",
      usedFor: ["클로저 late binding", "기본 인수 해결법"],
      evidence: "루프 lambda가 마지막 값을 공유하는 동작과 생성 시점 기본 인수 고정법을 공식 FAQ 범위로 보강했습니다.",
    },
  ],
  sourceCoverage: {
    filesRead: 7,
    filesUsed: 5,
    uncoveredNotes: [
      "이전 학습본의 day04/ex09_lambda.py와 day05/ex01_lambda.py를 canonical과 대조했으며 본문 동작이 같아 중복 공개 출처로 사용하지 않았습니다.",
      "원본 day05 예제는 직접 경로 실행에서 sibling package import에 실패하고 -m 실행에서는 import 대상의 최상위 출력이 섞입니다. 학습 코드 예제는 개념을 독립 실행하도록 재구성하되 이 실패를 진단 절에 그대로 기록했습니다.",
      "operator.itemgetter, functools.partial, callback 계약, late binding closure는 원본 공백이므로 Python 공식 문서와 재현 코드로 보강했습니다.",
      "파일·CSV·Excel·JSON은 py-024 이후 별도 원자 세션 범위이므로 Day05 노트에서 lambda 절만 사용했습니다.",
      "로컬 드라이브 경로와 비공개 백업 URL은 공개 데이터에 넣지 않고 검증된 공개 저장소 링크와 일반화된 source audit 설명만 남겼습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
