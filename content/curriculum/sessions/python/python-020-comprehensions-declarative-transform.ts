import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-020"],
  slug: "python-020-comprehensions-declarative-transform",
  courseId: "python",
  moduleId: "02-control-functions-io",
  order: 20,
  title: "컴프리헨션과 선언적 변환",
  subtitle: "반복의 절차를 결과 컬렉션의 규칙으로 바꾸고, 변환·필터·분기·중복 제거·키 매핑을 읽기 좋은 한 표현식으로 설계합니다.",
  level: "중급",
  estimatedMinutes: 125,
  coreQuestion: "일반 for 루프의 ‘순회→조건→변환→추가’를 list·set·dict comprehension으로 옮길 때, 실행 순서와 결과 의미를 잃지 않으려면 어떻게 작성해야 할까요?",
  summary: "컴프리헨션은 단순히 for 문을 한 줄로 줄이는 기술이 아닙니다. 입력 iterable의 각 항목을 선택적으로 통과시키고 변환해 새로운 list·set·dict를 만드는 선언적 표현입니다. 기본 list comprehension, 뒤쪽 필터 if와 앞쪽 conditional expression의 차이, set의 중복 제거, dict의 key 충돌, 중첩 for의 실행 순서, Python 3의 독립 반복 변수 scope를 실제 코드로 추적합니다. 모든 결과를 즉시 메모리에 만드는 eager comprehension과 lazy generator expression을 비교하고, 부수 효과·복잡한 분기·한 번의 partition에는 일반 for가 더 명확한 이유까지 다룹니다.",
  objectives: [
    "일반 for+append와 list comprehension이 같은 변환 파이프라인을 표현한다는 점을 입력→조건→변환→수집 순서로 설명할 수 있다.",
    "[expression for item in iterable if condition]의 각 위치가 언제 평가되는지 추적할 수 있다.",
    "뒤쪽 if 필터와 앞쪽 value_if_true if condition else value_if_false 조건 표현식을 구분해 항목 수 변화를 예측할 수 있다.",
    "list·set·dict comprehension의 결과 타입, 순서·중복·키 충돌 규칙을 목적에 맞게 선택할 수 있다.",
    "중첩 comprehension의 for 절을 동등한 중첩 루프로 되돌려 실행 순서를 검증할 수 있다.",
    "eager comprehension과 lazy generator expression의 메모리·재사용·오류 발생 시점을 비교할 수 있다.",
    "부수 효과, 복잡한 분기, 단일 순회 partition에는 일반 for나 이름 있는 함수를 선택할 수 있다.",
  ],
  prerequisites: [
    {
      title: "break·continue·for·range",
      reason: "컴프리헨션의 for 절과 뒤쪽 if를 일반 반복문으로 펼쳐 실행 순서를 비교하려면 iterable 순회, range, 조건 분기의 기본 흐름을 알아야 합니다.",
    },
    {
      title: "list·set·dict 생성과 순회",
      reason: "컴프리헨션이 만드는 세 결과 컨테이너의 순서, 중복, key-value 차이를 이해하는 데 필요합니다.",
      sessionSlug: "python-014-set-and-set-operations",
    },
    {
      title: "dict 항목 순회",
      reason: "dict comprehension의 name: score 표현과 .items() 언패킹을 정확히 읽는 데 필요합니다.",
      sessionSlug: "python-013-dictionary-access-iteration-update",
    },
  ],
  keywords: ["Python", "comprehension", "list comprehension", "set comprehension", "dict comprehension", "filter", "transform", "conditional expression", "generator expression", "declarative", "eager", "lazy", "scope"],
  chapters: [
    {
      id: "declarative-mental-model",
      title: "컴프리헨션은 결과 컬렉션의 생성 규칙을 선언합니다",
      lead: "일반 루프는 빈 결과를 만들고 항목을 추가하는 절차를 보여 주지만, 컴프리헨션은 ‘어떤 입력에서 어떤 결과 항목을 만들 것인가’를 한 표현식에 모읍니다.",
      explanations: [
        "원본 ex05_comprehension.py의 첫 예제는 su를 순회하면서 i * 3을 빈 list res에 append합니다. 바로 다음 예제 res2 = [i * 3 for i in su2]는 같은 입력 순서와 같은 곱셈을 사용해 새 list를 만듭니다. Python 3.13.9에서 두 결과가 모두 [3, 9, 15, 21, 27]임을 확인할 수 있습니다. 줄 수만 줄어든 것이 아니라 ‘빈 list를 만들고 언제 append할지’라는 기계적 절차가 ‘각 i에서 i * 3을 모은 list’라는 결과 규칙으로 바뀌었습니다.",
        "가장 단순한 형태는 [표현식 for 변수 in 반복가능객체]입니다. 실행은 글을 읽는 순서와 조금 다르게 느껴질 수 있습니다. 먼저 iterable을 얻고 첫 항목을 변수에 바인딩한 다음 맨 앞 표현식을 평가해 결과 list에 추가합니다. 그 뒤 다음 항목으로 반복합니다. 따라서 앞 표현식이 입력 항목마다 한 번씩 실행된다는 점이 중요합니다.",
        "컴프리헨션은 기존 입력 컨테이너를 제자리에서 수정하지 않고 새 결과 컨테이너를 만듭니다. numbers가 list라면 [n * 2 for n in numbers]를 실행해도 numbers의 항목은 그대로이고 새 list가 반환됩니다. 원본 예제에서도 scores와 변환 결과를 각각 출력해 입력 보존을 확인합니다. 다만 앞 표현식이 변경 가능한 입력 객체 자체를 수정하는 함수를 호출한다면 부수 효과는 생길 수 있으므로 ‘문법이 새 list를 만든다’와 ‘표현식이 순수하다’를 구분해야 합니다.",
        "선언적이라는 말은 내부 실행 순서가 사라진다는 뜻이 아닙니다. 항목 순회, 조건 검사, 표현식 평가와 결과 추가가 정해진 순서로 일어납니다. 선언적 표기가 그 순서를 간결하게 감출 뿐이므로, 오류나 성능을 진단할 때는 언제든 동등한 for 루프로 펼칠 수 있어야 합니다.",
      ],
      concepts: [
        {
          term: "컴프리헨션(comprehension)",
          definition: "iterable을 순회하고 선택적으로 필터·변환해 새 list·set·dict를 만드는 표현식 문법입니다.",
          detail: ["표현식이므로 완성된 결과 객체를 반환합니다.", "list·set·dict마다 delimiter와 결과 의미가 다르지만 for·if 절의 기본 흐름은 공유합니다."],
          analogy: "공장에서 작업자에게 ‘빈 상자에 하나씩 넣어라’고 절차를 지시하는 것이 일반 루프라면, ‘합격 점수만 세 배로 표시한 목록’이라는 완성품 규격을 적는 것이 컴프리헨션에 가깝습니다.",
        },
        {
          term: "선언적 변환",
          definition: "변경 단계를 세세히 명령하기보다 입력과 원하는 출력 사이의 규칙을 직접 표현하는 방식입니다.",
          detail: ["무조건 짧다는 뜻이 아니라 핵심 규칙이 읽는 사람에게 먼저 보인다는 뜻입니다.", "규칙이 복잡해져 한눈에 이해되지 않으면 명시적 for가 더 선언 의도를 잘 전달할 수 있습니다."],
        },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: [
        "컴프리헨션은 Python 문법 수준 최적화가 적용될 수 있지만, 가독성을 희생해 모든 루프를 바꾸는 것이 성능 전략은 아닙니다. 실제 workload를 측정합니다.",
        "코드 리뷰에서는 줄 수보다 데이터 흐름이 한 방향인지, 표현식이 부수 효과 없이 결과 값을 만드는지 확인합니다.",
      ],
    },
    {
      id: "list-transform-filter",
      title: "list comprehension은 변환과 필터를 왼쪽 결과 하나로 모읍니다",
      lead: "각 입력 항목을 같은 규칙으로 바꾸고 선택한 결과를 입력 순서대로 보존할 때 list comprehension이 가장 자연스럽습니다.",
      explanations: [
        "[number * 3 for number in numbers]에서 number는 입력 항목 이름, number * 3은 출력 항목 표현식입니다. numbers가 [1, 3, 5, 7, 9]이면 number는 그 순서대로 바인딩되고 계산 결과도 같은 순서로 list에 들어갑니다. list 결과는 중복을 제거하지 않으며 입력 iterable이 순서를 제공하면 그 순서를 반영합니다.",
        "뒤에 if를 붙인 [score for score in scores if score >= 60]은 각 score를 먼저 조건으로 검사합니다. 조건이 truthy인 항목만 맨 앞 score 표현식을 평가해 결과에 넣습니다. 원본 ex06_for.py의 합격자 list는 [90, 67, 80, 75]이고 불합격자는 [25, 45]입니다. 일반 for+if+append 버전과 두 comprehension 버전이 같은 결과를 냅니다.",
        "표현식은 단순 이름일 필요가 없습니다. [word.upper() for word in words]는 각 str의 upper 결과를 모으고 [word for word in words if len(word) >= 6]은 길이 조건을 만족한 원래 문자열을 모읍니다. 변환과 필터를 함께 쓰면 [word.upper() for word in words if len(word) >= 6]처럼 조건은 원본 word에 적용되고 통과한 뒤 대문자 변환이 일어납니다.",
        "입력과 출력 타입을 말로 적으면 실수를 줄일 수 있습니다. iterable의 항목 타입이 int, 출력 표현식이 str이면 결과는 list[str]입니다. 컴프리헨션 자체는 런타임 타입 검증기가 아니므로 항목에 None이나 잘못된 타입이 섞이면 조건 또는 표현식에서 예외가 발생할 수 있습니다. 외부 입력은 먼저 검증하거나 명확한 정제 함수로 처리합니다.",
      ],
      concepts: [
        {
          term: "변환 표현식",
          definition: "각 통과 항목에서 결과 컬렉션에 넣을 값을 만드는 컴프리헨션 맨 앞의 표현식입니다.",
          detail: ["입력 항목 자체, 산술 결과, 메서드 호출, tuple 등 어떤 값 표현식도 될 수 있습니다.", "입력 항목마다 평가되므로 비싼 함수 호출은 항목 수만큼 실행됩니다."],
        },
        {
          term: "필터 절",
          definition: "for 절 뒤 if condition으로 입력 항목을 결과에 포함할지 결정하는 선택 규칙입니다.",
          detail: ["조건이 truthy일 때만 앞 표현식이 평가됩니다.", "통과하지 않은 항목은 대체값 없이 결과에서 사라집니다."],
        },
      ],
      codeExamples: [
        {
          id: "python-list-transform-filter-branch",
          title: "점수 필터·전체 라벨·숫자 변환을 구분하기",
          language: "python",
          filename: "list_comprehensions.py",
          purpose: "원본의 세 배 변환, 합격 필터, even/odd 조건 표현식을 하나의 예제로 결합해 결과 길이와 입력 보존을 비교합니다.",
          code: `scores = [90, 25, 67, 45, 80, 75]
passed = [score for score in scores if score >= 60]
labels = ["pass" if score >= 60 else "fail" for score in scores]
tripled = [number * 3 for number in [1, 3, 5, 7, 9]]

print(passed)
print(labels)
print(tripled)
print(scores)`,
          walkthrough: [
            { lines: "1", explanation: "입력 list의 점수 순서와 값은 이 예제에서 수정하지 않습니다." },
            { lines: "2", explanation: "각 score를 60 이상인지 검사하고 통과한 원래 score만 새 list에 넣습니다. 결과 항목 수가 줄어듭니다." },
            { lines: "3", explanation: "모든 score에 대해 앞 conditional expression이 pass 또는 fail 하나를 선택합니다. 필터가 아니므로 결과 길이는 입력과 같습니다." },
            { lines: "4", explanation: "별도 입력 숫자 각각을 세 배로 변환해 같은 길이의 새 list를 만듭니다." },
            { lines: "6-9", explanation: "필터 결과, 분기 결과, 변환 결과, 변경되지 않은 원본을 순서대로 출력합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "UTF-8로 저장한 list_comprehensions.py"], command: "python list_comprehensions.py" },
          output: {
            value: `[90, 67, 80, 75]
['pass', 'fail', 'pass', 'fail', 'pass', 'pass']
[3, 9, 15, 21, 27]
[90, 25, 67, 45, 80, 75]`,
            explanation: [
              "합격 list는 60 미만 항목을 제거해 네 개만 남고 입력 상대 순서는 유지됩니다.",
              "labels는 모든 점수에 문자열 하나를 만들어 여섯 개입니다. 뒤쪽 필터 if와 앞쪽 조건 표현식의 차이입니다.",
              "tripled는 원본 학습자료의 결과 [3, 9, 15, 21, 27]을 재현합니다.",
              "마지막 scores 출력은 comprehension이 입력 list를 제자리 변경하지 않았음을 보여 줍니다.",
            ],
          },
          experiments: [
            { change: "합격 기준을 score > 60으로 바꿉니다.", prediction: "현재 입력에는 정확히 60이 없어 출력은 같지만 60 경계 테스트를 추가해야 차이가 드러납니다.", result: "scores에 60을 추가하면 >=는 포함하고 >는 제외합니다. 경계값을 데이터에 넣어야 정책 오류를 발견할 수 있습니다." },
            { change: "labels를 [\"pass\" for score in scores if score >= 60]으로 바꿉니다.", prediction: "합격 점수에 대해서만 pass가 생성되어 네 항목이고 fail은 사라집니다.", result: "뒤쪽 if는 항목 제거이고 앞쪽 if/else는 항목별 대체값 선택이라는 차이가 확인됩니다." },
          ],
          sourceRefs: ["py-day04-ex05", "py-day04-ex06", "py-day04-note"],
        },
      ],
      diagnostics: [
        {
          symptom: "필터 조건을 넣었는데 결과 길이가 입력과 같고 탈락 항목도 문자열로 남는다.",
          likelyCause: "뒤쪽 filter if 대신 맨 앞 conditional expression으로 모든 항목에 대체값을 만들었습니다.",
          checks: ["if가 for 뒤에 있는지, 표현식 안에서 else와 함께 for 앞에 있는지 확인합니다.", "요구가 항목 제거인지 라벨 대체인지 문장으로 적습니다.", "입력 길이와 결과 길이를 출력해 비교합니다."],
          fix: "항목을 제거하려면 [x for x in items if condition]을 사용합니다. 모든 항목을 유지하고 값을 고르려면 [a if condition else b for x in items]를 사용합니다.",
          prevention: "필터는 결과 수를 줄이고 분기는 각 입력당 결과 하나를 만든다는 불변식을 테스트합니다.",
        },
      ],
    },
    {
      id: "filter-versus-conditional",
      title: "뒤쪽 if는 항목을 버리고 앞쪽 if/else는 값을 고릅니다",
      lead: "두 문법은 같은 if 단어를 쓰지만 결과 cardinality와 평가 순서가 다릅니다.",
      explanations: [
        "[i for i in range(10) if i % 2 == 0]에서 if는 filter clause입니다. range의 각 i를 검사하고 짝수만 결과에 넣으므로 [0, 2, 4, 6, 8]이 됩니다. 조건을 통과하지 않은 홀수에는 어떤 결과도 생성되지 않습니다. 결과 항목 수는 입력보다 작거나 같습니다.",
        "['even' if i % 2 == 0 else 'odd' for i in range(5)]에서 맨 앞 부분은 conditional expression입니다. 모든 i마다 조건을 검사해 두 값 중 하나를 결과에 넣습니다. 결과는 ['even', 'odd', 'even', 'odd', 'even']이고 입력과 같은 다섯 항목입니다. else가 반드시 필요한 이유는 각 입력에서 어떤 값 하나를 만들어야 하기 때문입니다.",
        "필터와 분기를 함께 쓸 수도 있습니다. [normalize(x) if x else default for x in items if is_valid(x)]처럼 쓰면 for 뒤 is_valid가 먼저 항목을 거르고, 통과한 항목에 대해 앞 조건 표현식이 값을 선택합니다. 문법적으로 가능하지만 조건이 둘 이상이고 함수 호출이 섞이면 읽기 어려워집니다. 중간 이름과 일반 loop 또는 별도 normalize 함수를 사용해 의도를 분리합니다.",
        "표현식을 읽을 때 영어 문장처럼 ‘각 items의 x에 대해, 조건을 만족하면, 이 값을 만든다’로 번역합니다. 복잡한 코드를 쓸 때는 반대로 먼저 이 문장을 적고 가장 단순한 문법을 고릅니다. 컴프리헨션을 해독 퍼즐로 만들지 않는 것이 목표입니다.",
      ],
      concepts: [
        { term: "cardinality", definition: "입력과 결과에 존재하는 항목 수의 관계입니다.", detail: ["순수 변환·조건 표현식은 보통 입력당 결과 하나를 만들어 길이를 유지합니다.", "필터는 일부 입력을 버려 결과 항목 수가 같거나 줄어듭니다."] },
        { term: "conditional expression", definition: "true_value if condition else false_value 형태로 조건에 따라 값 하나를 만드는 표현식입니다.", detail: ["컴프리헨션 맨 앞 결과 위치에 놓을 수 있습니다.", "문장이 아니라 값 표현식이므로 else가 필요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "[x for x in items else 0] 또는 [x if condition for x in items]에서 SyntaxError가 발생한다.",
          likelyCause: "filter if와 conditional expression의 위치·구성 규칙을 섞었습니다.",
          checks: ["항목을 제거할지 대체값을 만들지 결정합니다.", "제거라면 for 뒤 if만 있는지 확인합니다.", "대체라면 for 앞에 a if condition else b 전체가 있는지 확인합니다."],
          fix: "필터는 [x for x in items if condition], 분기는 [x if condition else default for x in items]로 고칩니다.",
          prevention: "복잡한 식을 먼저 동등한 for/if/append로 작성한 뒤 한 단계씩 변환합니다.",
        },
      ],
    },
    {
      id: "set-dict-comprehensions",
      title: "set은 중복을 제거하고 dict는 key 충돌을 덮어씁니다",
      lead: "중괄호 안에서 key:value가 있으면 dict comprehension, 값 하나만 있으면 set comprehension입니다. 두 결과의 보존 규칙은 list와 다릅니다.",
      explanations: [
        "{score for score in scores if score >= 60}은 set comprehension입니다. 같은 합격 점수가 여러 번 나와도 결과 set에는 동등한 값 하나만 남고, 출력·순회 순서는 입력 순서를 보장하지 않습니다. 원본 ex06_for.py는 일반 for+set.add와 set comprehension을 모두 실행해 같은 구성원 집합을 확인합니다. 학습 결과를 고정할 때는 set 자체 repr 순서를 정답으로 두지 말고 sorted(result) 또는 집합 동등성으로 검증합니다.",
        "{name: score for name, score in records if score >= 60}은 dict comprehension입니다. 콜론 왼쪽은 key 표현식, 오른쪽은 value 표현식입니다. records가 dict라면 records.items()를 순회해 key와 value를 언패킹해야 합니다. dict 자체를 순회하면 key만 나오므로 name, score 두 변수 언패킹이 예상과 다르게 실패하거나 문자열 key의 문자 두 개가 들어갈 수 있습니다.",
        "여러 입력 항목이 같은 key를 만들면 나중 항목의 value가 앞 value를 덮어씁니다. 이것은 중복 데이터를 자동으로 합쳤다는 뜻이 아닙니다. 학생 이름이 중복인데 마지막 점수만 남아도 되는지, 오류로 거부해야 하는지, 여러 값을 list로 모아야 하는지는 업무 정책입니다. comprehension은 충돌 정책을 질문하지 않으므로 결과 길이와 중복 key 테스트를 둡니다.",
        "빈 중괄호 {}는 빈 set이 아니라 빈 dict입니다. 빈 set은 set()으로 만듭니다. 그러나 값 하나를 만드는 {x for x in iterable}은 문법상 set comprehension이므로 결과가 비어도 타입은 set입니다. delimiter 모양만 보지 말고 콜론과 for 절을 함께 확인합니다.",
      ],
      concepts: [
        { term: "set comprehension", definition: "{expression for item in iterable if condition} 형태로 중복 없는 set을 만드는 표현식입니다.", detail: ["hash 가능한 결과 값만 넣을 수 있습니다.", "순서 보존을 결과 계약으로 삼지 않습니다."] },
        { term: "dict comprehension", definition: "{key_expression: value_expression for item in iterable if condition} 형태로 mapping을 만드는 표현식입니다.", detail: ["입력 항목마다 key와 value를 계산합니다.", "동일 key가 반복되면 나중 값이 앞 값을 덮어씁니다."] },
      ],
      codeExamples: [
        {
          id: "python-set-dict-comprehensions",
          title: "합격자 중복 제거와 마지막 점수 덮어쓰기를 관찰하기",
          language: "python",
          filename: "set_dict_comprehensions.py",
          purpose: "원본의 set·dict 합격 분류를 중복 이름 데이터까지 확장해 두 컨테이너의 서로 다른 축약 규칙을 확인합니다.",
          code: `records = [("둘리", 90), ("일지매", 25), ("장길산", 67), ("둘리", 95)]
passed_names = {name for name, score in records if score >= 60}
passed_scores = {name: score for name, score in records if score >= 60}

print(sorted(passed_names))
print(passed_scores)
print(len(records), len(passed_scores))`,
          walkthrough: [
            { lines: "1", explanation: "둘리 이름이 서로 다른 합격 점수로 두 번 등장하는 입력을 의도적으로 준비합니다." },
            { lines: "2", explanation: "합격 record의 name만 set에 넣어 중복 이름을 하나로 축약합니다." },
            { lines: "3", explanation: "합격 record를 name key와 score value로 넣습니다. 둘리 key는 뒤의 95가 앞 90을 덮어씁니다." },
            { lines: "5", explanation: "set 순서는 계약이 아니므로 sorted list로 바꾸어 재현 가능한 출력을 만듭니다." },
            { lines: "6-7", explanation: "dict 내용과 원본 record 수·결과 key 수 차이로 key 충돌을 관찰합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "UTF-8로 저장한 set_dict_comprehensions.py"], command: "python set_dict_comprehensions.py" },
          output: {
            value: `['둘리', '장길산']
{'둘리': 95, '장길산': 67}
4 2`,
            explanation: [
              "passed_names는 둘리 중복을 하나로 만들고 sorted로 안정된 순서를 표시합니다.",
              "passed_scores에는 둘리의 마지막 합격 점수 95와 장길산 67만 남습니다.",
              "원본 record 네 개 중 합격 key는 두 개뿐입니다. 탈락 한 건과 중복 key 한 건 때문에 길이가 줄었습니다.",
            ],
          },
          experiments: [
            { change: "마지막 ('둘리', 95)를 ('도우너', 95)로 바꿉니다.", prediction: "합격 이름과 dict key가 세 개가 되어 마지막 길이가 4 3으로 바뀝니다.", result: "중복 key가 사라지면 dict가 모든 합격 record를 별도 key로 보존합니다." },
            { change: "set 표현식을 {score for name, score in records if score >= 60}으로 바꿉니다.", prediction: "합격 점수 {90, 67, 95} 구성원이 만들어지며 이름 중복과 무관하게 점수 중복만 제거합니다.", result: "set에서 무엇을 projection하느냐가 중복의 기준을 결정합니다." },
          ],
          sourceRefs: ["py-day04-ex06", "py-day04-note", "py-day05-ex01"],
        },
      ],
      diagnostics: [
        {
          symptom: "for name, score in scores_dict에서 ValueError가 나거나 name과 score에 key 문자열의 글자가 들어간다.",
          likelyCause: "dict 자체를 순회하면 (key, value) tuple이 아니라 key만 나오는데 두 변수로 언패킹했습니다.",
          checks: ["print(next(iter(scores_dict)))로 실제 반복 항목을 봅니다.", "key가 우연히 길이 2라 문자 두 개로 언패킹되는지 확인합니다.", ".items() 호출 여부를 확인합니다."],
          fix: "key와 value가 모두 필요하면 for name, score in scores_dict.items()를 사용합니다.",
          prevention: "dict의 keys·values·items 중 필요한 순회 계약을 먼저 선택하고 타입 힌트를 둡니다.",
        },
        {
          symptom: "set comprehension에서 TypeError: unhashable type: 'list'가 발생한다.",
          likelyCause: "set 항목은 hash 가능해야 하는데 결과 표현식이 list를 만들었습니다.",
          checks: ["맨 앞 결과 표현식의 type을 일반 loop에서 한 번 출력합니다.", "list 대신 값 tuple이 의미에 맞는지 확인합니다.", "내용 자체를 중복 제거할지 식별 key만 제거할지 결정합니다."],
          fix: "불변 tuple로 표현 가능한 값이면 tuple로 바꾸거나, list 결과를 유지해야 하면 list comprehension과 별도 dedup 정책을 사용합니다.",
          prevention: "결과 컨테이너가 요구하는 항목 계약(hashability, key uniqueness)을 작성 전에 명시합니다.",
        },
      ],
      expertNotes: [
        "dict insertion order는 유지되지만 기존 key의 value를 덮어쓸 때 key 위치는 처음 삽입 위치에 남습니다. 표시 순서와 최신 값 정책을 구분합니다.",
        "중복이 오류여야 한다면 comprehension 뒤 길이 비교만으로는 어떤 key가 충돌했는지 부족할 수 있습니다. 일반 loop에서 충돌을 감지해 명시 예외를 만듭니다.",
      ],
    },
    {
      id: "nested-order-scope",
      title: "중첩 for 절은 왼쪽부터 바깥→안쪽 루프로 펼칩니다",
      lead: "[(row, column) for row in rows for column in columns]은 row 루프 안에 column 루프가 있는 것과 같은 순서를 가집니다.",
      explanations: [
        "컴프리헨션에 for가 두 개 있으면 왼쪽 for가 바깥 loop, 오른쪽 for가 안쪽 loop입니다. [(row, column) for row in range(2) for column in range(3)]은 row=0일 때 column 0·1·2를 모두 만들고, 그 다음 row=1에서 column 0·1·2를 만듭니다. 결과 순서는 (0,0), (0,1), (0,2), (1,0), (1,1), (1,2)입니다.",
        "뒤쪽 iterable은 앞에서 바인딩한 변수를 사용할 수 있습니다. [(row, column) for row in matrix for column in row]처럼 행별로 내부 항목을 평탄화합니다. 반대로 앞쪽 iterable에서 아직 오른쪽 for 변수는 사용할 수 없습니다. 동등한 중첩 loop로 펼쳐 보면 이름이 어느 시점에 존재하는지 명확해집니다.",
        "각 for 뒤에 if를 둘 수 있고 해당 loop 단계에서 평가됩니다. [value for row in matrix if row for value in row if value > 0]은 빈 row를 먼저 제외하고, 그 row의 value를 순회하며 양수만 넣습니다. 두 조건을 한 줄에 겹치면 해독 비용이 커지므로 실제 코드에서는 입력 정제 함수와 한 단계 comprehension으로 나누는 편이 좋습니다.",
        "Python 3에서 comprehension의 반복 변수는 바깥 scope로 누출되지 않습니다. [n * 2 for n in numbers] 뒤 바깥에서 n을 읽으면 기존 n이 없을 경우 NameError가 납니다. 이는 임시 반복 이름이 주변 코드를 덮는 것을 줄입니다. 그러나 comprehension 앞 표현식이 외부 변경 가능한 객체를 수정하는 함수라면 scope 독립성과 부수 효과는 별개입니다.",
      ],
      concepts: [
        { term: "중첩 comprehension", definition: "둘 이상의 for 절 또는 중첩된 comprehension을 사용해 여러 차원의 입력을 조합·평탄화하는 표현식입니다.", detail: ["for 절은 왼쪽부터 바깥→안쪽 loop 순서입니다.", "두 단계 이상이면 동등 loop로 펼쳐 가독성과 경우의 수를 검토합니다."] },
        { term: "comprehension scope", definition: "Python 3에서 반복 변수와 내부 바인딩이 일반적으로 comprehension 내부에 한정되는 이름 공간입니다.", detail: ["반복 변수는 완료 뒤 바깥 이름으로 남지 않습니다.", "표현식은 바깥 scope의 읽기 가능한 이름을 참조할 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "컴프리헨션 뒤 print(item)에서 NameError가 발생한다.",
          likelyCause: "Python 3에서는 comprehension 반복 변수 item이 내부 scope에만 있고 바깥으로 누출되지 않습니다.",
          checks: ["item이 comprehension 밖에서 별도로 바인딩됐는지 확인합니다.", "결과에서 마지막 항목이 필요한 것인지 요구를 확인합니다.", "locals()에 item이 있는지 학습용으로 관찰합니다."],
          fix: "필요한 값은 결과 list에서 명시적으로 선택하거나 일반 loop에서 의미 있는 바깥 변수를 관리합니다. 반복 변수 누출에 의존하지 않습니다.",
          prevention: "comprehension 반복 이름은 짧고 지역적인 역할로 사용하고 외부에서 재사용하지 않습니다.",
        },
      ],
      expertNotes: [
        "중첩 loop의 조합 수는 각 iterable 길이의 곱입니다. 1,000×1,000 조합 list는 백만 항목을 즉시 만듭니다.",
        "walrus 연산자와 comprehension scope의 상호작용은 복잡하므로 꼭 필요한 누산 상태가 있다면 일반 loop로 의도를 드러냅니다.",
      ],
    },
    {
      id: "eager-versus-generator",
      title: "list·set·dict comprehension은 eager, generator expression은 lazy입니다",
      lead: "대괄호·중괄호 comprehension은 결과 전체를 즉시 만들지만 괄호 generator expression은 요청할 때 항목을 하나씩 계산합니다.",
      explanations: [
        "[n * n for n in range(5)]는 표현식이 끝날 때 다섯 항목을 가진 list가 완성됩니다. 입력이 크면 결과 항목 전체 메모리가 필요합니다. 반면 (n * n for n in range(5))는 tuple comprehension이 아니라 generator expression입니다. 생성 시 계산을 모두 하지 않고 next 또는 for가 값을 요구할 때 하나씩 만듭니다.",
        "generator expression은 한 번 소비하면 앞 항목으로 자동 되돌아가지 않습니다. next로 첫 값 0을 꺼낸 뒤 list(generator)를 만들면 남은 [1, 4, 9, 16]만 나옵니다. 여러 번 순회하거나 인덱싱해야 하면 list가 적합하고, 한 번의 sum·any·all·파일 스트리밍에는 generator가 메모리 효율적일 수 있습니다.",
        "lazy 계산은 오류 시점도 늦춥니다. 표현식 안에 잘못된 타입 연산이 있어도 generator 생성 자체는 성공하고 문제가 있는 항목을 요청할 때 예외가 납니다. 디버깅할 때 ‘생성 줄이 성공했다’는 사실만으로 모든 데이터가 유효하다고 판단하지 않습니다. 소비 단계까지 테스트합니다.",
        "map과 filter도 Python 3에서 iterator를 반환합니다. 원본 day05 예제는 결과를 보기 위해 list(map(...))와 list(filter(...))로 materialize합니다. 간단한 Python 표현식은 comprehension이 읽기 쉬운 경우가 많고, 이미 이름 있는 함수가 있거나 여러 lazy 단계를 연결할 때 map/filter·generator가 적합할 수 있습니다.",
      ],
      concepts: [
        { term: "eager materialization", definition: "표현식 평가 중 결과 항목 전체를 즉시 계산해 컨테이너에 저장하는 방식입니다.", detail: ["list·set·dict comprehension이 해당합니다.", "완성 결과를 반복 재사용·길이 조회·인덱싱하기 쉽지만 전체 메모리가 필요합니다."] },
        { term: "generator expression", definition: "(expression for item in iterable) 형태로 요청 시 항목을 계산하는 일회성 iterator를 만드는 표현식입니다.", detail: ["괄호라고 해서 tuple 결과가 아닙니다.", "lazy라서 큰 데이터의 단일 통과에 유리하지만 소비 상태를 관리해야 합니다."] },
      ],
      codeExamples: [
        {
          id: "python-nested-and-generator",
          title: "중첩 순서와 lazy 소비 상태 확인하기",
          language: "python",
          filename: "nested_and_generator.py",
          purpose: "중첩 list comprehension의 순서와 generator expression의 일회성 lazy 소비를 정확한 출력으로 비교합니다.",
          code: `pairs = [(row, column) for row in range(2) for column in range(3)]
squares = (number * number for number in range(5))

print(pairs)
print(type(squares).__name__)
print(next(squares))
print(list(squares))`,
          walkthrough: [
            { lines: "1", explanation: "row 바깥 loop마다 column 내부 loop를 0부터 2까지 돌며 tuple 여섯 개를 list에 즉시 저장합니다." },
            { lines: "2", explanation: "괄호는 tuple comprehension이 아니라 아직 소비되지 않은 generator 객체를 만듭니다." },
            { lines: "4", explanation: "중첩 실행 순서대로 완성된 pairs 전체를 출력합니다." },
            { lines: "5", explanation: "실제 타입 이름 generator를 확인합니다." },
            { lines: "6", explanation: "next가 첫 입력 number=0을 요청해 제곱 0을 계산하고 소비합니다." },
            { lines: "7", explanation: "남아 있는 number 1~4만 list로 materialize하므로 [1, 4, 9, 16]입니다." },
          ],
          run: { environment: ["Python 3.11 이상", "UTF-8로 저장한 nested_and_generator.py"], command: "python nested_and_generator.py" },
          output: {
            value: `[(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2)]
generator
0
[1, 4, 9, 16]`,
            explanation: [
              "pairs는 왼쪽 row가 바깥 loop라 row 0의 세 column 뒤 row 1의 세 column이 옵니다.",
              "squares는 tuple이 아니라 generator입니다.",
              "첫 next가 0을 소비했기 때문에 마지막 list에는 0이 다시 나타나지 않습니다.",
            ],
          },
          experiments: [
            { change: "마지막에 print(list(squares))를 한 번 더 추가합니다.", prediction: "이미 모두 소비돼 빈 list []가 출력됩니다.", result: "generator는 일회성 iterator이며 자동으로 처음부터 재실행되지 않습니다." },
            { change: "pairs의 두 for 절 순서를 바꿉니다.", prediction: "column이 바깥 loop가 되어 (0,0), (1,0), (0,1), (1,1), ... 순서가 됩니다.", result: "for 절 순서가 결과 순서와 조합 진행 방향을 직접 결정합니다." },
          ],
          sourceRefs: ["py-day04-ex05", "py-day04-note", "python-expression-doc"],
        },
      ],
      diagnostics: [
        {
          symptom: "generator를 두 번째 반복했더니 결과가 비어 있다.",
          likelyCause: "generator expression은 일회성 iterator이며 첫 반복에서 모든 항목이 소비됐습니다.",
          checks: ["type(result).__name__이 generator인지 확인합니다.", "앞에서 next, list, sum, for가 이미 소비했는지 찾습니다.", "여러 번 순회가 실제 요구인지 확인합니다."],
          fix: "여러 번 재사용해야 하면 처음에 list로 materialize하거나 매번 새 generator를 만드는 함수로 감쌉니다.",
          prevention: "API 이름과 타입 힌트에 Iterator와 Sequence 차이를 드러내고 소비 횟수 테스트를 둡니다.",
        },
      ],
      comparisons: [
        {
          title: "같은 변환을 어떤 도구로 표현할까요?",
          options: [
            { name: "list comprehension", chooseWhen: "결과 전체를 보관·재사용하고 변환 규칙이 짧고 순수할 때", avoidWhen: "데이터가 매우 크고 한 번만 소비하거나 부수 효과·복잡한 분기가 핵심일 때", tradeoffs: ["Python 코드에서 읽기 자연스럽고 결과가 즉시 완성됩니다.", "전체 결과 메모리가 필요합니다."] },
            { name: "generator expression", chooseWhen: "큰 입력을 한 번 순회하며 sum·any·파일 출력 등으로 바로 소비할 때", avoidWhen: "인덱싱·길이·여러 번 반복이 필요할 때", tradeoffs: ["lazy라 메모리를 줄일 수 있습니다.", "오류가 소비 시점에 늦게 발생하고 일회성 상태를 관리해야 합니다."] },
            { name: "map/filter 또는 일반 for", chooseWhen: "이미 이름 있는 함수가 있거나 복수 분기·부수 효과·여러 결과 누적이 핵심일 때", avoidWhen: "단순 Python 표현식 하나가 comprehension으로 더 직접적으로 읽힐 때", tradeoffs: ["함수 재사용 또는 명시적 제어 흐름이 좋습니다.", "lambda가 겹치면 comprehension보다 읽기 어려울 수 있습니다."] },
          ],
        },
      ],
      expertNotes: [
        "sys.getsizeof 한 번만으로 전체 객체 그래프 메모리를 결론 내리지 말고 실제 데이터 규모와 소비 패턴을 프로파일링합니다.",
        "async comprehension은 비동기 iterable에서 사용할 수 있지만 이벤트 루프·취소·동시성 계약이 필요해 별도 고급 세션으로 남깁니다.",
      ],
    },
    {
      id: "readability-side-effects-partition",
      title: "부수 효과·복잡한 분기·한 번의 분할에는 일반 for가 낫습니다",
      lead: "컴프리헨션의 강점은 값을 만드는 순수한 규칙입니다. 출력·파일 쓰기·여러 컨테이너 동시 갱신을 억지로 넣으면 결과와 효과가 섞입니다.",
      explanations: [
        "[print(item) for item in items]는 각 print를 실행하지만 반환값 None을 모은 [None, None, ...] list도 불필요하게 만듭니다. 출력이 목적이라면 for item in items: print(item)이 의도를 정확히 보여 줍니다. comprehension은 결과 컬렉션이 실제로 필요할 때 사용합니다.",
        "합격자와 불합격자를 두 comprehension으로 만들면 scores를 두 번 순회합니다. 입력 list가 작고 두 선언이 명확하면 괜찮습니다. 그러나 입력이 generator라면 첫 comprehension이 모두 소비해 둘째가 비거나, 비싼 데이터 소스라면 비용이 두 배가 됩니다. 한 번 순회하며 success와 fail 두 결과를 함께 만들려면 원본의 일반 for+if/else가 더 정확합니다.",
        "중첩 conditional expression, 여러 함수 호출, 세 개 이상의 for/if 절이 한 줄에 있으면 독자가 실행 순서를 복원해야 합니다. 줄을 여러 줄로 포맷해도 핵심 규칙이 복잡하면 이름 있는 helper 함수와 일반 loop로 분리합니다. ‘한 줄이니까 Python답다’보다 오류 메시지, 중단점, 로깅, 단위 테스트가 쉬운 구조가 유지보수에 중요합니다.",
        "불신 외부 데이터를 comprehension으로 바로 변환할 때 한 항목의 오류가 전체 표현식을 중단합니다. 실패 항목을 건너뛰고 이유를 수집해야 한다면 일반 loop에서 정상 결과와 오류 목록을 각각 누적하는 편이 좋습니다. 조용히 if로 버리면 데이터 품질 문제를 숨길 수 있으므로 필터링 정책과 제외 개수를 관찰합니다.",
      ],
      concepts: [
        { term: "부수 효과(side effect)", definition: "값을 반환하는 것 외에 출력, 파일 쓰기, 외부 상태 변경처럼 프로그램 바깥 또는 공유 상태를 바꾸는 동작입니다.", detail: ["컴프리헨션 앞 표현식에서도 실행될 수 있습니다.", "결과 생성과 부수 효과가 섞이면 실패 시 어느 항목까지 처리됐는지 추적하기 어렵습니다."] },
        { term: "partition", definition: "입력 각 항목을 둘 이상의 상호 배타적 그룹으로 한 번에 분류하는 작업입니다.", detail: ["두 comprehension은 간단하지만 입력을 두 번 순회합니다.", "단일 통과와 여러 결과·오류 수집에는 일반 for가 자연스럽습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "[print(x) for x in items] 실행 후 거대한 [None, None, ...] 결과가 생기거나 메모리를 낭비한다.",
          likelyCause: "값 컬렉션 생성 문법을 부수 효과 반복 용도로 사용했습니다. print 반환값 None도 모두 list에 저장됩니다.",
          checks: ["맨 앞 표현식의 반환값이 실제로 필요한지 확인합니다.", "완성된 list를 이후 사용하지 않는지 검색합니다.", "반복 중 여러 외부 상태를 바꾸는지 봅니다."],
          fix: "결과 list가 필요 없으면 명시적 for loop를 사용합니다. 값 변환이 필요하면 부수 효과 없는 함수가 값을 반환하도록 분리합니다.",
          prevention: "comprehension은 새 컬렉션을 만드는 목적에만 사용한다는 팀 규칙을 둡니다.",
        },
        {
          symptom: "같은 generator에서 합격자 comprehension 뒤 불합격자 comprehension이 빈 결과다.",
          likelyCause: "첫 comprehension이 일회성 generator를 끝까지 소비했습니다.",
          checks: ["입력 type이 list인지 Iterator인지 확인합니다.", "첫 연산 전에 list로 materialize했는지 봅니다.", "두 그룹을 한 번에 만들 수 있는지 확인합니다."],
          fix: "한 번의 for에서 if/else로 두 결과에 추가하거나, 입력 크기가 허용되고 재사용이 필요하면 먼저 list로 명시 materialize합니다.",
          prevention: "입력 API가 Iterable인지 Iterator인지 문서화하고 단일 통과 테스트를 포함합니다.",
        },
      ],
      expertNotes: [
        "필터로 제외된 항목 수와 이유를 metric으로 남기되 원본 개인정보 전체를 로그에 기록하지 않습니다.",
        "컴프리헨션 내부에서 네트워크·DB 호출을 항목별로 수행하면 N+1과 부분 실패가 생길 수 있습니다. batch API와 명시적 오류 정책을 설계합니다.",
      ],
    },
    {
      id: "testing-debugging-contracts",
      title: "결과 값뿐 아니라 길이·순서·중복·호출 횟수를 테스트합니다",
      lead: "컴프리헨션은 짧아서 맞아 보이기 쉽습니다. 하지만 필터 경계, key 충돌, set 순서, lazy 소비는 별도 계약입니다.",
      explanations: [
        "list 변환 테스트는 대표 출력과 함께 입력이 바뀌지 않았는지 확인합니다. 필터는 기준 바로 아래·같음·바로 위 값을 넣어 >=와 > 차이를 검증합니다. 조건 표현식은 결과 길이가 입력과 같고 각 위치 라벨이 맞는지 확인합니다. 빈 iterable 결과가 각각 [], set(), {}인지도 테스트합니다.",
        "set 결과는 repr 문자열 순서를 비교하지 않고 집합 동등성을 검사합니다. 출력 문서가 안정적이어야 하면 sorted를 명시합니다. dict comprehension은 중복 key 입력을 넣어 마지막 값 덮어쓰기 정책이 요구와 맞는지 확인하고, 충돌이 오류라면 일반 loop 검증으로 바꿉니다.",
        "중첩 comprehension은 작은 2×3 입력으로 순서를 고정한 뒤 빈 내부 iterable과 비정상 항목을 추가합니다. generator expression은 생성 시점, 첫 next, 전체 소비, 두 번째 소비를 각각 테스트해 lazy 오류와 소진 상태를 문서화합니다.",
        "디버깅할 때 복잡한 comprehension을 for loop로 펼치고 중간 조건·변환 결과를 repr로 관찰합니다. 문제를 고친 뒤 다시 comprehension으로 합칠 필요는 없습니다. 펼친 코드가 더 읽기 좋고 테스트 지점을 제공한다면 그것이 최종 코드여도 됩니다.",
      ],
      concepts: [
        { term: "경계값 테스트", definition: "조건 기준 바로 아래·같음·바로 위처럼 분기 결과가 바뀌는 지점을 검증하는 테스트입니다.", detail: ["score >= 60에는 59, 60, 61을 포함합니다.", "빈 입력, 중복 key, 잘못된 타입도 컨테이너 변환의 중요한 경계입니다."] },
        { term: "관찰 가능한 계약", definition: "결과 값뿐 아니라 순서, 길이, 중복, 입력 보존, 오류 시점 등 호출자가 의존할 수 있는 동작입니다.", detail: ["list는 순서, set은 구성원, dict는 key-value와 충돌 정책을 구분합니다.", "generator는 일회성 소비와 lazy 오류가 계약 일부입니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        {
          title: "복잡한 comprehension을 유지할지 펼칠지 어떻게 판단할까요?",
          options: [
            { name: "컴프리헨션 유지", chooseWhen: "변환 표현식 하나, 선택 조건 하나 정도로 입력→출력이 즉시 읽히고 부수 효과가 없을 때", avoidWhen: "중단점·여러 결과·오류 이유 수집이 필요할 때", tradeoffs: ["핵심 데이터 규칙이 가까이 보입니다.", "중간 상태 관찰 지점이 적습니다."] },
            { name: "일반 for로 펼치기", chooseWhen: "여러 분기, 부수 효과, 복수 결과, 항목별 예외·로그·continue가 필요할 때", avoidWhen: "단순 append 변환만 장황하게 반복할 때", tradeoffs: ["실행 순서와 디버깅이 명확합니다.", "기계적인 초기화·append 줄이 늘어납니다."] },
          ],
        },
      ],
      expertNotes: [
        "property-based test로 임의 입력에서 결과 길이·모든 항목 조건·입력 순서 보존 같은 불변식을 검증할 수 있습니다.",
        "성능 테스트는 warm-up, 입력 생성 비용, materialization 비용을 분리하고 한 번의 작은 timeit 결과로 일반화하지 않습니다.",
      ],
    },
    {
      id: "independent-checkpoint",
      title: "새 comprehension은 동등 loop와 결과 계약으로 검토합니다",
      lead: "한 줄을 외우는 대신 입력 iterable, 반복 이름, filter, transform, 결과 컨테이너를 차례로 표시하면 처음 보는 표현식도 설명할 수 있습니다.",
      explanations: [
        "[transform(x) for x in source if predicate(x)]을 보면 source를 한 번 얻고 x를 순서대로 바인딩하며 predicate가 true인 항목에만 transform을 호출해 list에 넣는다고 설명합니다. conditional expression이 맨 앞에 있으면 항목을 제거하지 않고 각 입력에 결과 하나를 만듭니다. 이 문장을 동등한 for/if/append 코드로 쓸 수 있어야 합니다.",
        "중괄호에서는 콜론 유무를 봅니다. {expr for ...}는 set이라 hash 가능성과 중복 제거·비순서 계약을 확인합니다. {key: value for ...}는 dict라 key 중복 시 마지막 값 덮어쓰기를 확인합니다. 안정된 표시가 필요하면 set을 정렬하고, key 충돌이 오류면 명시 loop를 선택합니다.",
        "for가 여러 개면 왼쪽부터 중첩 loop로 펼치고 조합 수를 계산합니다. 결과 전체가 필요한지 묻고 한 번 소비라면 generator expression을 비교합니다. 출력·DB·파일 쓰기 같은 부수 효과나 두 그룹 동시 생성이 목적이면 컴프리헨션을 내려놓고 일반 for를 선택합니다. 짧음보다 정확한 계약이 우선입니다.",
      ],
      concepts: [],
      codeExamples: [],
      diagnostics: [],
      expertNotes: [
        "API 리뷰에서 comprehension 자체보다 입력 iterable의 재사용 가능성, 결과 컨테이너 타입과 오류 정책을 문서화합니다.",
        "선언적 코드는 검증·관찰성을 없애는 코드가 아니라, 순수 변환 경계를 작게 만들어 테스트하기 쉽게 하는 코드입니다.",
      ],
    },
  ],
  lab: {
    title: "학습 성적 정제·분류·요약 파이프라인",
    scenario: "이름과 점수가 섞인 원본 record를 검증한 뒤 list·set·dict comprehension으로 합격 결과를 만들고, 중복 key와 오류 항목 정책을 비교합니다.",
    setup: [
      "Python 3.11 이상에서 comprehension_lab.py를 UTF-8로 만듭니다.",
      "records = [('둘리', 90), ('일지매', 25), ('장길산', 67), ('둘리', 95), ('도우너', None)]처럼 정상·탈락·중복·잘못된 타입을 포함합니다.",
      "합격 기준은 60점 이상, 허용 점수는 정확한 int 0~100으로 문서화합니다.",
    ],
    steps: [
      "먼저 일반 for에서 각 record 구조·이름·점수 타입과 범위를 검증하고 valid_records와 errors 두 list에 나눕니다.",
      "valid_records에서 합격 record list를 list comprehension으로 만듭니다.",
      "합격 이름 set을 set comprehension으로 만들고 출력은 sorted로 안정화합니다.",
      "이름→점수 dict comprehension을 만들고 중복 둘리의 마지막 값이 남는지 길이와 함께 확인합니다.",
      "중복 key가 오류여야 하는 정책으로 바꿔 일반 for에서 seen set과 duplicate error를 수집합니다.",
      "모든 점수의 pass/fail 라벨 list를 앞 conditional expression으로 만들고 필터 결과 길이와 비교합니다.",
      "큰 range의 제곱 합을 list comprehension을 거치지 않은 generator expression sum으로 계산합니다.",
      "빈 입력, 59·60·61, True, 문자열 점수, 동일 key를 테스트하고 결과·오류 수를 기록합니다.",
    ],
    expectedResult: [
      "None 점수는 변환 중 TypeError로 전체가 중단되지 않고 errors에 이유와 함께 기록됩니다.",
      "합격 list는 입력 상대 순서를 유지하고 set은 중복 이름을 제거하며 dict는 마지막 중복 점수로 덮어씁니다.",
      "엄격 중복 정책에서는 둘리 두 번째 record가 오류로 분류되고 첫 점수가 보존됩니다.",
      "라벨 list는 valid_records와 같은 길이이고 합격 필터 list는 더 짧습니다.",
      "generator 합계는 큰 중간 list 없이 계산되고 소비 후 재사용할 수 없음을 확인합니다.",
    ],
    cleanup: ["실제 개인정보가 아닌 합성 이름·점수만 사용합니다.", "실패 record 전체를 운영 로그에 남기지 않고 index·오류 코드만 남기는 방식을 기록합니다."],
    extensions: [
      "namedtuple 또는 dataclass record로 바꾸고 검증 책임을 분리합니다.",
      "같은 작업을 map/filter로 작성해 readability와 lazy 동작을 비교합니다.",
      "10만 건 입력에서 list comprehension과 generator sum의 메모리·시간을 별도 측정합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "1부터 20까지 숫자에서 짝수 제곱 list와 홀짝 라벨 list를 만드세요.",
      requirements: ["짝수 제곱은 뒤쪽 필터 if를 사용합니다.", "홀짝 라벨은 앞쪽 if/else를 사용합니다.", "입력·두 결과 길이와 첫·마지막 값을 출력합니다."],
      hints: ["[n * n for n in range(1, 21) if n % 2 == 0] 형태를 먼저 만드세요.", "라벨은 모든 입력에 하나씩 생성됩니다."],
      expectedOutcome: "필터 결과 10개와 라벨 결과 20개를 얻고 cardinality 차이를 설명합니다.",
      solutionOutline: ["range를 한 이름에 바인딩합니다.", "필터 comprehension과 conditional expression comprehension을 각각 작성합니다.", "경계와 길이를 assert합니다."],
    },
    {
      difficulty: "응용",
      prompt: "문장 목록에서 정규화된 단어 set과 단어 길이 dict를 만드세요.",
      requirements: ["strip·lower 후 빈 문자열을 제거합니다.", "set 결과는 sorted해서 출력합니다.", "dict key 충돌 시 어떤 원본이 남는지 두 중복 입력으로 확인합니다.", "변환 호출이 중복되지 않도록 일반 loop·helper 함수 대안도 비교합니다."],
      hints: ["같은 strip().lower()를 표현식과 조건에서 반복하면 계산과 가독성이 나빠집니다.", "작은 normalize 함수를 먼저 만들 수 있습니다."],
      expectedOutcome: "중복 없는 정규화 단어와 key별 길이 mapping, 충돌 정책 설명이 완성됩니다.",
      solutionOutline: ["normalize 함수를 작성합니다.", "정규화 중간 list를 한 번 만듭니다.", "set·dict comprehension을 단계별로 적용하고 중복 key 결과를 검증합니다."],
    },
    {
      difficulty: "설계",
      prompt: "수백만 로그 record에서 허용 이벤트의 사용자별 최근 시각을 만드는 변환 파이프라인을 설계하세요.",
      requirements: ["입력 iterator가 일회성이고 매우 크다는 조건을 반영합니다.", "검증 실패, 허용 event filter, user key 충돌의 최근값 정책을 정의합니다.", "컴프리헨션·generator·일반 for를 단계별로 어디에 사용할지 근거를 씁니다.", "개인정보 로그 최소화, 메모리 상한, 항목별 오류 관찰 지표를 포함합니다.", "빈 입력·중복·역순 시각·잘못된 타입·generator 재소비 테스트를 설계합니다."],
      hints: ["dict comprehension의 마지막 입력이 시간상 최신이라는 보장은 없습니다.", "두 번 순회할 수 없는 iterator에서는 한 번의 명시 loop가 더 안전할 수 있습니다.", "모든 오류를 조용히 필터하지 마세요."],
      expectedOutcome: "짧은 문법보다 데이터 크기·정합성·중복 정책·관찰성을 우선한 구현 가능한 설계가 나옵니다.",
      solutionOutline: ["stream 검증과 오류 계수를 한 loop에 둡니다.", "사용자별 현재 최신값을 명시 비교해 dict에 갱신합니다.", "최종 보고 단계에서 작은 결과에 comprehension을 사용합니다.", "성능·보안·정확성 테스트 조건을 문서화합니다."],
    },
  ],
  reviewQuestions: [
    { question: "[x * 2 for x in items]은 어떤 순서로 실행되나요?", answer: "items를 얻고 각 항목을 x에 바인딩한 뒤 x * 2를 평가해 새 list에 추가합니다. 입력 순서대로 반복합니다." },
    { question: "[x for x in items if condition(x)]에서 condition이 False면 앞 표현식 x는 평가되나요?", answer: "결과 표현식은 평가되지 않고 그 항목은 결과에서 빠집니다." },
    { question: "['pass' if x >= 60 else 'fail' for x in scores]는 왜 scores와 길이가 같나요?", answer: "뒤쪽 필터가 아니라 각 입력마다 두 값 중 하나를 선택하는 conditional expression이므로 모든 입력이 결과 하나를 만듭니다." },
    { question: "set comprehension 출력 순서를 정답 문자열로 비교하면 왜 위험한가요?", answer: "set은 순서를 결과 계약으로 보장하지 않습니다. 구성원 동등성을 검사하거나 출력용으로 sorted해야 합니다." },
    { question: "dict comprehension에서 같은 key가 두 번 만들어지면 어떻게 되나요?", answer: "나중 항목의 value가 앞 value를 덮어씁니다. 이것이 올바른 업무 정책인지 별도로 결정해야 합니다." },
    { question: "(x * x for x in values)는 tuple comprehension인가요?", answer: "아닙니다. 필요할 때 값을 만드는 generator expression입니다. tuple이 필요하면 tuple(x * x for x in values)로 소비합니다." },
    { question: "중첩 comprehension의 for 두 개는 어떤 loop 순서인가요?", answer: "왼쪽 for가 바깥 loop, 오른쪽 for가 안쪽 loop입니다. 동등한 중첩 for로 펼쳐 확인할 수 있습니다." },
    { question: "왜 [print(x) for x in items]를 피하나요?", answer: "출력 부수 효과가 목적이지만 print의 반환값 None까지 새 list에 모아 의도와 메모리를 흐립니다. 일반 for가 명확합니다." },
    { question: "두 comprehension으로 generator를 합격·불합격에 나누면 어떤 문제가 생기나요?", answer: "첫 comprehension이 iterator를 모두 소비해 둘째 결과가 빌 수 있습니다. 한 번의 for에서 두 결과를 동시에 만드는 것이 안전합니다." },
  ],
  completionChecklist: [
    "일반 for+append를 동등한 list comprehension으로 바꾸고 실행 순서를 설명할 수 있다.",
    "변환 표현식과 뒤쪽 filter if의 평가 시점을 구분할 수 있다.",
    "필터 if와 앞쪽 conditional expression의 결과 길이를 예측할 수 있다.",
    "list·set·dict comprehension의 순서·중복·key 충돌 계약을 설명할 수 있다.",
    "dict에서 .items()가 필요한 이유를 말할 수 있다.",
    "중첩 for 절을 일반 중첩 loop로 정확히 펼칠 수 있다.",
    "Python 3 comprehension 반복 변수가 바깥으로 누출되지 않음을 확인했다.",
    "eager comprehension과 lazy generator의 메모리·소비·오류 시점을 비교할 수 있다.",
    "부수 효과·여러 결과·항목별 오류에는 일반 for를 선택할 수 있다.",
    "세 실행 예제를 직접 실행해 제시된 출력과 일치함을 확인했다.",
  ],
  nextSessions: [],
  sources: [
    {
      id: "py-day04-ex05",
      repository: "PYTHON-BASIC",
      path: "day04/ex05_comprehension.py",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day04/ex05_comprehension.py",
      usedFor: ["for+append 비교", "list 변환", "필터 if", "조건 표현식", "대문자·길이 필터", "실행 결과"],
      evidence: "Python 3.13.9에서 직접 실행해 일반 loop와 comprehension의 세 배 결과 일치, 짝수 [0,2,4,6,8], even/odd 라벨, 대문자 단어와 길이 필터 결과를 확인했습니다.",
    },
    {
      id: "py-day04-ex06",
      repository: "PYTHON-BASIC",
      path: "day04/ex06_for.py",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day04/ex06_for.py",
      usedFor: ["list·set·dict 분류", "for와 comprehension 비교", "합격 기준 필터", "dict items 언패킹", "실행 결과"],
      evidence: "Python 3.13.9에서 직접 실행해 list 합격 4명·불합격 2명, set 구성원, dict 이름·점수 결과가 일반 loop와 각 comprehension에서 일치함을 확인했습니다. set 표시 순서는 고정 계약으로 사용하지 않았습니다.",
    },
    {
      id: "py-day04-note",
      repository: "PYTHON-BASIC",
      path: "notes/day04_loop_function.md",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day04_loop_function.md",
      usedFor: ["컴프리헨션 세 문법", "set·dict 예제", "for·range 선수 개념", "iterator·generator 비교", "셀프 체크"],
      evidence: "Day04 노트를 전부 읽고 컴프리헨션·이터러블·이터레이터·제너레이터 범위를 감사했으며 함수·lambda 상세는 별도 세션 범위로 남겼습니다.",
    },
    {
      id: "py-day05-ex01",
      repository: "PYTHON-BASIC",
      path: "day05/ex01_lambda.py",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day05/ex01_lambda.py",
      usedFor: ["for·comprehension·map 비교", "filter 비교", "tuple·set 입력", "dict 값 변환·필터"],
      evidence: "원본 전체를 읽고 같은 배수·짝수·dict 변환을 일반 for, comprehension, lambda+map/filter로 나란히 비교하는 구조를 확인했습니다.",
    },
    {
      id: "python-expression-doc",
      repository: "Python 3 Documentation",
      path: "reference/expressions.html#displays-for-lists-sets-and-dictionaries",
      publicUrl: "https://docs.python.org/3/reference/expressions.html#displays-for-lists-sets-and-dictionaries",
      usedFor: ["comprehension 평가 구조", "독립 scope", "generator expression", "중첩 for 순서"],
      evidence: "원본에 짧게만 언급된 scope·평가 순서·generator 차이를 공식 언어 레퍼런스 범위로 보강했습니다.",
    },
  ],
  sourceCoverage: {
    filesRead: 4,
    filesUsed: 4,
    uncoveredNotes: [
      "원본의 기본 list·set·dict 예제는 모두 반영했고, 중첩 comprehension·scope·generator expression은 공식 Python 레퍼런스로 보강했습니다.",
      "lambda·map·filter의 함수형 API 자체와 파일·CSV·Excel 처리는 py-021 이후 별도 세션 범위로 남겼습니다.",
      "async comprehension, assignment expression, bytecode 최적화 세부는 이 원자 세션의 핵심 질문을 벗어나 고급 후속 과정으로 남겼습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
