import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-002"],
  slug: "python-002-variables-dynamic-types",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 2,
  title: "변수는 상자가 아니라 객체에 붙는 이름입니다",
  subtitle: "이름 바인딩, 객체의 타입, 재바인딩, type·isinstance, del 이후의 NameError를 하나의 실행 모델로 연결합니다.",
  level: "입문",
  estimatedMinutes: 105,
  coreQuestion: "파이썬에서 변수에 타입이 있다는 흔한 설명 대신, 이름과 객체의 관계로 대입·재바인딩·삭제를 어떻게 정확히 이해할 수 있을까요?",
  summary: "파이썬의 대입문은 타입이 고정된 상자에 값을 넣는 과정이 아닙니다. 오른쪽 표현식으로 객체를 얻고 왼쪽 이름을 그 객체에 연결하는 이름 바인딩입니다. 같은 이름을 다른 타입의 객체에 재바인딩할 수 있지만 객체 자체의 타입이 흐릿해지는 것은 아닙니다. type과 isinstance가 답하는 질문의 차이, del이 객체가 아니라 이름 연결을 제거한다는 사실, 그 뒤 NameError를 진단하는 순서를 실제 코드와 정확한 출력으로 확인합니다.",
  objectives: [
    "대입문의 오른쪽 평가와 왼쪽 이름 바인딩 순서를 말로 설명할 수 있다.",
    "이름, 객체, 타입을 서로 구분하고 ‘동적 타이핑’이 객체의 타입 부재를 뜻하지 않음을 설명할 수 있다.",
    "하나의 이름을 int에서 str 객체로 재바인딩하고 이전 객체를 다른 별칭이 계속 가리키는 상황을 추적할 수 있다.",
    "type 결과를 읽고 정확한 타입 확인과 isinstance 기반 계층 확인을 목적에 맞게 선택할 수 있다.",
    "del이 현재 이름 공간의 바인딩을 제거한다는 사실과 객체 수명은 별개임을 설명할 수 있다.",
    "NameError traceback에서 실패한 이름·파일·줄·정의 순서를 확인해 원인을 수정할 수 있다.",
    "타입 힌트와 테스트가 동적 타이핑을 보완하는 도구이지 런타임 타입을 자동 고정하는 장치가 아님을 설명할 수 있다.",
  ],
  prerequisites: [
    {
      title: "첫 실행부터 이름·값·타입까지",
      reason: "파이썬 파일 실행, print, 문자열 리터럴, 가장 기본적인 type 출력 경험이 있으면 이 세션에서 화면 결과보다 이름과 객체의 관계에 집중할 수 있습니다.",
      sessionSlug: "python-001-output-names-types",
    },
    {
      title: "터미널에서 Python 파일 실행",
      reason: "예제를 .py 파일로 저장하고 python 파일명.py를 실행할 수 있으면 충분합니다. 클래스·함수·메모리 관리에 대한 선수 지식은 요구하지 않습니다.",
    },
  ],
  keywords: ["Python", "변수", "이름", "바인딩", "객체", "동적 타이핑", "재바인딩", "type", "isinstance", "del", "NameError", "namespace"],
  chapters: [
    {
      id: "names-objects-binding",
      title: "이름·객체·타입을 세 칸으로 나누어 생각합니다",
      lead: "변수를 ‘값을 담는 상자’라고만 생각하면 재바인딩, 별칭, 리스트 공유, 함수 인수에서 설명이 무너집니다. 파이썬에서는 이름과 객체 사이의 연결을 먼저 봅니다.",
      explanations: [
        "age = 20을 실행할 때 먼저 오른쪽의 정수 리터럴 20이 평가됩니다. 그 결과는 int 타입의 객체입니다. 그 다음 현재 이름 공간에 age라는 이름과 그 객체의 연결이 만들어집니다. 이후 print(age)는 age라는 글자를 출력하는 것이 아니라, 이름 공간에서 age가 가리키는 객체를 찾고 그 객체를 print에 전달합니다. 따라서 한 줄을 읽을 때 ‘age 안에 20을 넣었다’에서 멈추지 말고 ‘age라는 이름이 int 객체 20을 가리킨다’까지 말할 수 있어야 합니다.",
        "이름은 소스 코드에서 객체를 다시 찾기 위한 식별자입니다. 객체는 실제 값과 동작을 가진 런타임 대상입니다. 타입은 그 객체가 어떤 연산과 행동을 지원하는지 결정하는 클래스입니다. age는 이름, 20은 int 객체, int는 타입입니다. 이 셋을 섞지 않으면 같은 이름이 나중에 문자열을 가리켜도 ‘정수가 문자열로 변했다’고 잘못 말하지 않게 됩니다. 정수 객체 20이 문자열로 변한 것이 아니라 age의 연결 대상이 바뀐 것입니다.",
        "파이썬 구현은 작은 정수나 일부 문자열 객체를 재사용할 수 있습니다. 그러나 입문 코드에서 객체 동일성을 추측하거나 메모리 주소를 외우는 것은 목표가 아닙니다. 중요한 관찰은 이름과 객체가 같은 개념이 아니며 여러 이름이 같은 객체를 가리킬 수 있다는 사실입니다. 구현별 캐시 때문에 우연히 나온 id 값이나 is 결과를 언어 규칙처럼 사용해서는 안 됩니다.",
        "이 모델은 뒤에서 배우는 리스트에도 그대로 이어집니다. 정수와 문자열은 변경 불가능한 객체라 별칭의 효과가 덜 눈에 띄지만, 두 이름이 같은 리스트를 가리키면 한 이름을 통한 항목 변경이 다른 이름에서도 보입니다. 지금은 컬렉션 변경까지 확장하지 않고 ‘이름 연결과 객체는 분리되어 있다’는 중심 원리만 정확히 세웁니다.",
      ],
      concepts: [
        {
          term: "이름(name)",
          definition: "현재 이름 공간에서 객체를 찾기 위해 사용하는 식별자입니다.",
          detail: [
            "total_score처럼 코드에 적는 식별자가 이름입니다. 이름 자체가 int나 str 값을 보관하는 물리적 통인 것은 아닙니다.",
            "이름을 읽으면 파이썬은 현재 규칙에 따라 이름 공간에서 바인딩을 찾고, 찾지 못하면 NameError를 발생시킵니다.",
          ],
          analogy: "도서관 서가의 책이 객체라면 검색 시스템에 등록된 ‘파이썬 입문서’라는 항목은 그 책을 찾는 이름에 가깝습니다.",
        },
        {
          term: "객체(object)",
          definition: "런타임에서 정체성, 타입, 값을 가진 대상입니다.",
          detail: [
            "3, 3.14, '학습', True뿐 아니라 list, 함수, 클래스와 type 결과로 나오는 클래스도 객체입니다.",
            "객체의 타입은 가능한 연산을 결정합니다. int 객체끼리 +하면 덧셈하고 str 객체끼리 +하면 연결합니다.",
          ],
          caveat: "print 결과가 같아 보여도 객체 타입이 같다는 뜻은 아닙니다. 정수 3과 문자열 '3'은 화면에는 모두 3으로 보일 수 있지만 서로 다른 타입입니다.",
        },
        {
          term: "이름 바인딩(binding)",
          definition: "이름 공간의 특정 이름을 객체와 연결하는 동작입니다.",
          detail: [
            "대입, import, 함수 정의, 클래스 정의 등 여러 문법이 이름을 바인딩할 수 있습니다. 이 세션은 가장 단순한 대입문에 집중합니다.",
            "재대입은 기존 이름의 바인딩을 다른 객체로 바꿉니다. 객체의 타입을 현장에서 변환하는 것과는 다릅니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: [
        "CPython의 참조 횟수나 작은 정수 캐시는 구현 세부입니다. 이름 바인딩이라는 언어 수준 모델과 특정 구현의 메모리 회수 시점을 구분합니다.",
        "id()는 한 객체의 수명 동안 동일성을 관찰하는 도구이지 영구 식별자나 메모리 주소 계약이 아닙니다.",
      ],
    },
    {
      id: "assignment-and-rebinding",
      title: "대입은 오른쪽을 먼저 평가하고 이름을 다시 연결합니다",
      lead: "재바인딩을 줄 단위로 추적하면 같은 이름의 type 결과가 바뀌는 이유와 다른 별칭이 이전 값을 유지하는 이유를 동시에 설명할 수 있습니다.",
      explanations: [
        "value = 21에서 파이썬은 오른쪽 표현식을 먼저 평가합니다. 오른쪽 평가가 성공해야 왼쪽 value의 바인딩이 만들어집니다. 예를 들어 value = 10 / 0은 오른쪽에서 ZeroDivisionError가 나므로 value를 새 결과에 연결하는 단계까지 가지 못합니다. 이미 value가 다른 객체를 가리키고 있었다면 실패한 대입 때문에 그 이전 바인딩이 자동으로 사라지지도 않습니다.",
        "alias = value를 실행하면 value가 가리키는 객체를 찾아 alias도 같은 객체에 연결합니다. 객체를 무조건 새로 복사하는 문장이 아닙니다. 이어서 value = '스물하나'를 실행하면 value만 새 str 객체로 재바인딩됩니다. alias는 여전히 앞서 연결된 int 객체 21을 가리킵니다. 이 상태를 표로 적으면 value→str '스물하나', alias→int 21입니다.",
        "파이썬 이름은 실행 중 다른 타입의 객체에 재바인딩될 수 있습니다. 이것이 동적 타이핑에서 자주 보는 현상입니다. 그러나 가능하다고 해서 한 이름의 의미를 계속 바꾸는 코드가 좋은 것은 아닙니다. total이 처음에는 합계 숫자였다가 나중에는 완료 메시지 문자열이 되면 독자는 매 줄마다 타입과 의미를 다시 추론해야 합니다. 학습 실험에서는 재바인딩을 관찰하되 실제 프로그램에서는 한 이름의 역할을 일관되게 유지하는 편이 안전합니다.",
        "이름 규칙도 바인딩 전에 적용됩니다. 영문자 또는 밑줄로 시작하고 뒤에는 숫자를 쓸 수 있으며, if·for·class 같은 키워드는 이름으로 쓸 수 없습니다. Python은 대소문자를 구분하므로 score, Score, SCORE는 서로 다른 이름입니다. 문법상 가능한 이름과 협업에 좋은 이름은 다릅니다. snake_case로 역할을 드러낸 total_score, retry_count 같은 이름을 우선합니다.",
      ],
      concepts: [
        {
          term: "재바인딩(rebinding)",
          definition: "이미 존재하는 이름을 다른 객체에 다시 연결하는 일입니다.",
          detail: [
            "value = 21 다음 value = '스물하나'는 int 객체를 str로 바꾸는 과정이 아니라 value의 대상 객체를 바꾸는 과정입니다.",
            "이전 객체를 다른 이름이 계속 가리키고 있다면 그 객체와 바인딩은 그대로 유효합니다.",
          ],
          analogy: "사무실의 ‘당직자’ 표찰이 오늘은 민수, 내일은 영희를 가리키는 것과 비슷합니다. 민수가 영희로 변한 것이 아니라 표찰의 대상이 바뀐 것입니다.",
        },
        {
          term: "별칭(alias)",
          definition: "둘 이상의 이름이 같은 객체를 가리키는 상태에서 각 이름을 서로의 별칭이라고 부를 수 있습니다.",
          detail: [
            "불변 객체에서는 한 이름의 재바인딩이 다른 이름을 바꾸지 않습니다.",
            "변경 가능한 객체에서는 객체 자체의 변경이 모든 별칭에서 관찰될 수 있으므로 이후 리스트 세션에서 복사와 함께 다시 다룹니다.",
          ],
        },
      ],
      codeExamples: [
        {
          id: "python-binding-rebinding-story",
          title: "바인딩·별칭·재바인딩을 한 줄씩 추적하기",
          language: "python",
          filename: "binding_story.py",
          purpose: "원본의 변수와 기본 자료형 개요를 실행 가능한 상태 추적 예제로 확장해, 객체의 타입과 이름의 재바인딩을 분리해서 관찰합니다.",
          code: `value = 21
alias = value
print(f"첫 바인딩: value={value!r}, type={type(value).__name__}")

value = "스물하나"
print(f"재바인딩: value={value!r}, type={type(value).__name__}")
print(f"이전 객체: alias={alias!r}, type={type(alias).__name__}")
print(f"검사: {isinstance(alias, int)} {isinstance(value, str)}")`,
          walkthrough: [
            { lines: "1", explanation: "정수 객체 21을 평가한 뒤 value 이름을 그 객체에 바인딩합니다." },
            { lines: "2", explanation: "value가 가리키는 같은 int 객체를 alias도 가리킵니다. 이 문장은 값의 독립 복사를 보장하는 문법이 아닙니다." },
            { lines: "3", explanation: "!r은 repr 표현을 사용합니다. 정수는 21로 보이고 타입 객체의 __name__은 int를 돌려줍니다." },
            { lines: "5", explanation: "value 이름만 새 str 객체 '스물하나'로 재바인딩합니다. alias 바인딩에는 아무 동작도 하지 않습니다." },
            { lines: "6-8", explanation: "두 이름의 현재 값과 타입을 따로 관찰하고 isinstance로 기대한 계층에 속하는지 확인합니다." },
          ],
          run: {
            environment: ["Python 3.11 이상", "UTF-8로 저장한 binding_story.py", "파일 폴더에서 연 PowerShell 또는 터미널"],
            command: "python binding_story.py",
          },
          output: {
            value: `첫 바인딩: value=21, type=int
재바인딩: value='스물하나', type=str
이전 객체: alias=21, type=int
검사: True True`,
            explanation: [
              "첫 줄은 value가 int 객체를 가리키던 최초 상태입니다.",
              "둘째 줄의 따옴표는 !r이 문자열임을 구분해 보여 준 결과이며 value의 현재 타입은 str입니다.",
              "셋째 줄은 alias가 이전 int 객체를 계속 가리킨다는 증거입니다. value의 재바인딩이 alias를 재바인딩하지 않았습니다.",
              "마지막 두 True는 alias가 int 계층, value가 str 계층이라는 현재 상태 검사가 모두 성공했다는 뜻입니다.",
            ],
          },
          experiments: [
            {
              change: "value = '스물하나' 바로 앞에 print(value is alias)를 추가합니다.",
              prediction: "재바인딩 전 두 이름은 같은 객체를 가리키므로 True가 출력됩니다.",
              result: "True가 출력됩니다. 단, 숫자 값 비교에 is를 쓰라는 뜻이 아니라 이 예제에서 별칭 상태를 잠깐 관찰한 것입니다.",
            },
            {
              change: "재바인딩 뒤에 print(value is alias)를 추가합니다.",
              prediction: "서로 다른 타입의 서로 다른 객체를 가리키므로 False가 출력됩니다.",
              result: "False가 출력됩니다. 값 비교는 ==, 객체 동일성 관찰은 is라는 목적 차이를 유지해야 합니다.",
            },
          ],
          sourceRefs: ["py-day01-ex03", "py-day01-ex01", "py-day01-note"],
        },
      ],
      diagnostics: [
        {
          symptom: "SyntaxError: invalid decimal literal 또는 invalid syntax가 변수 이름 줄에서 발생한다.",
          likelyCause: "2score처럼 숫자로 시작했거나 class·for 같은 예약어를 이름으로 사용했습니다.",
          checks: ["오류 화살표가 가리키는 식별자를 확인합니다.", "python -c \"import keyword; print(keyword.iskeyword('class'))\"로 예약어 여부를 확인합니다.", "이름이 영문자나 밑줄로 시작하는지 확인합니다."],
          fix: "score2, class_name처럼 유효하고 역할이 드러나는 snake_case 이름으로 바꿉니다.",
          prevention: "에디터의 Python 문법 검사와 자동 완성을 켜고 약어보다 의미 있는 이름을 사용합니다.",
        },
      ],
    },
    {
      id: "objects-have-types",
      title: "동적 타이핑이어도 객체의 타입은 분명합니다",
      lead: "‘변수의 타입이 실행 중 바뀐다’는 짧은 설명은 편리하지만 정확한 모델은 ‘이름이 다른 타입의 객체를 가리킬 수 있다’입니다.",
      explanations: [
        "원본 ex03_datatype.py는 int, float, str, bool, list, tuple, dict, set을 첫날 자료형 지도로 제시합니다. int는 정수, float는 실수, str은 텍스트, bool은 True/False를 표현합니다. list와 tuple은 순서 있는 여러 항목, dict는 키와 값의 대응, set은 중복 없는 항목 집합을 표현합니다. 이 세션에서는 각 컬렉션의 모든 연산을 배우지 않고, 어떤 리터럴을 평가하든 결과는 특정 타입의 객체라는 사실에 초점을 맞춥니다.",
        "동적 타이핑은 이름 옆에 int 같은 고정 타입 선언이 반드시 있어야 실행되는 언어가 아니라는 뜻에 가깝습니다. 실행 중 name = '둘리' 다음 name = 10이 문법적으로 가능합니다. 그렇다고 객체가 타입 없이 떠다니거나 파이썬이 모든 연산을 자동 변환해 주는 것은 아닙니다. '3' + 4는 str과 int의 덧셈 계약이 없어서 TypeError가 발생합니다. Python은 동적이지만 아무 타입이나 조용히 섞는 약한 규칙을 기본으로 하지 않습니다.",
        "타입은 가능한 연산뿐 아니라 결과 의미도 결정합니다. 3 + 4는 int 덧셈 7, '3' + '4'는 str 연결 '34'입니다. 화면의 문자가 비슷해도 입력 객체의 타입에 따라 프로그램의 의미가 달라집니다. 외부 입력은 흔히 문자열로 들어오므로 계산 경계에서 검증하고 int 또는 float로 명시적으로 변환해야 합니다.",
        "bool은 True와 False 두 싱글턴 값을 사용하며 int의 하위 클래스라는 역사적 특성이 있습니다. 따라서 isinstance(True, int)는 True입니다. 이 사실을 ‘True를 일반 숫자 1처럼 아무 계산에나 써도 된다’는 설계 지침으로 오해하면 안 됩니다. 타입 계층 확인과 도메인 의미 검증은 별개입니다.",
      ],
      concepts: [
        {
          term: "동적 타이핑(dynamic typing)",
          definition: "실행 시 객체의 타입을 사용해 연산을 결정하고, 이름에 하나의 타입을 런타임 문법으로 영구 고정하지 않는 방식입니다.",
          detail: [
            "한 이름은 실행 중 서로 다른 타입 객체에 재바인딩될 수 있습니다.",
            "지원하지 않는 연산은 해당 줄이 실행될 때 TypeError 등으로 실패할 수 있어 테스트와 타입 힌트가 중요합니다.",
          ],
          caveat: "동적 타이핑과 자동 형변환은 같은 말이 아닙니다. Python은 문자열 숫자와 정수를 알아서 더하지 않습니다.",
        },
        {
          term: "타입(type)",
          definition: "객체가 지원하는 연산과 행동을 정하는 클래스입니다.",
          detail: [
            "type(3)은 int 클래스 객체, type('3')은 str 클래스 객체를 반환합니다.",
            "type 자체도 객체이며 print가 <class 'int'> 같은 표현으로 보여 줍니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "TypeError: can only concatenate str (not \"int\") to str가 발생한다.",
          likelyCause: "문장 만들기와 숫자 계산을 구분하지 않고 str 객체와 int 객체에 +를 적용했습니다.",
          checks: ["+ 양쪽 표현식을 각각 type으로 확인합니다.", "목적이 숫자 합인지 출력 문장인지 먼저 정합니다.", "input이나 파일에서 읽은 값이 문자열인지를 확인합니다."],
          fix: "표시 목적이면 f-string을 사용합니다. 계산 목적이면 입력을 검증한 뒤 int(text)처럼 경계에서 명시 변환합니다.",
          prevention: "입력·계산·표시 단계를 분리하고 이름에 text, count처럼 역할을 드러냅니다.",
        },
      ],
      expertNotes: [
        "타입 힌트가 없는 동적 코드도 타입 계약을 갖습니다. 계약이 문서·테스트·호출 관례에 암묵적으로 있을 뿐입니다.",
        "API 경계에서는 허용 타입과 실패 방식을 명확히 적어 런타임 오류가 깊은 내부에서 늦게 드러나는 것을 줄입니다.",
      ],
    },
    {
      id: "type-and-isinstance",
      title: "type과 isinstance는 서로 다른 질문에 답합니다",
      lead: "type은 객체의 정확한 클래스를 관찰하고, isinstance는 지정한 클래스 또는 그 하위 클래스 계층에 속하는지 검사합니다.",
      explanations: [
        "type(value)는 value의 실제 클래스 객체를 반환합니다. 학습 중 print(type(value))로 관찰하면 <class 'int'> 같은 출력이 나옵니다. 사람이 읽는 보고서에는 type(value).__name__을 쓰면 int처럼 짧게 보이지만, 프로그램 로직을 클래스 이름 문자열에 의존시키지 않는 편이 좋습니다. 클래스 이름은 리팩터링될 수 있고 문자열은 상속 관계를 표현하지 못합니다.",
        "type(value) is int는 정확히 int 타입인지를 묻습니다. isinstance(value, int)는 value가 int 또는 int의 하위 클래스 객체인지를 묻습니다. 일반적인 입력 검증과 다형성 코드에는 하위 타입을 허용하는 isinstance가 더 자연스럽습니다. 정확한 내장 타입만 허용해야 하는 드문 직렬화 경계나 구현 분기에서는 type 비교가 의도일 수 있지만, 그 선택 이유를 명시해야 합니다.",
        "True 예제가 두 함수의 차이를 선명하게 보여 줍니다. type(True)은 bool이고 type(True) is int는 False입니다. 그러나 bool이 int의 하위 클래스이므로 isinstance(True, int)는 True입니다. 따라서 ‘정수만 받는다’는 도메인 규칙에서 불리언을 거부하고 싶다면 isinstance(value, int)만으로 충분하지 않습니다. type(value) is int 또는 isinstance(value, int) and not isinstance(value, bool)처럼 실제 요구를 코드로 표현합니다.",
        "더 큰 Python 코드에서는 타입 이름보다 지원 행동을 검사하는 덕 타이핑도 사용합니다. 예를 들어 반복 가능한 값을 모두 받을 때 list인지 정확히 검사하기보다 반복 프로토콜을 사용하는 편이 확장성이 좋습니다. 다만 입문 단계에서 무조건 검사를 없애라는 뜻은 아닙니다. 외부 데이터 경계에서는 명확한 검증이 필요하고, 내부의 협력 객체에서는 행동 계약이 더 적절할 수 있습니다.",
      ],
      concepts: [
        {
          term: "type()",
          definition: "인수 객체의 실제 클래스 객체를 반환하는 내장 함수입니다.",
          detail: ["관찰과 디버깅에 직접적입니다.", "type(x) is SomeType은 정확한 타입만 인정하고 하위 타입을 제외합니다."],
        },
        {
          term: "isinstance()",
          definition: "객체가 지정 클래스 또는 그 하위 클래스의 인스턴스인지 불리언으로 검사합니다.",
          detail: ["isinstance(x, (int, float))처럼 타입 튜플 중 하나인지 검사할 수 있습니다.", "상속과 추상 기반 클래스를 존중하므로 일반 API 검증에 type 동등 비교보다 유연합니다."],
          caveat: "도메인 규칙과 타입 계층은 다를 수 있습니다. bool이 int 하위 타입이어도 주문 수량으로 True를 허용할 필요는 없습니다.",
        },
      ],
      codeExamples: [
        {
          id: "python-type-versus-isinstance",
          title: "정확한 타입과 타입 계층을 같은 표에서 비교하기",
          language: "python",
          filename: "type_checks.py",
          purpose: "type과 isinstance가 동일한 함수의 두 표기가 아니라 서로 다른 질문이라는 사실을 bool·int·float·str 값으로 확인합니다.",
          code: `samples = [True, 1, 3.5, "3"]
for item in samples:
    print(repr(item), type(item).__name__, type(item) is int, isinstance(item, int))`,
          walkthrough: [
            { lines: "1", explanation: "서로 다른 타입의 객체 네 개를 순서대로 관찰하기 위한 목록입니다. 목록 자체의 상세 규칙은 후속 세션에서 배웁니다." },
            { lines: "2", explanation: "각 항목을 item 이름에 차례로 재바인딩합니다. 반복할 때 item의 현재 객체와 타입이 바뀝니다." },
            { lines: "3", explanation: "repr 값, 실제 타입 이름, 정확히 int인지, int 계층인지 순서대로 출력합니다." },
          ],
          run: {
            environment: ["Python 3.11 이상", "UTF-8로 저장한 type_checks.py"],
            command: "python type_checks.py",
          },
          output: {
            value: `True bool False True
1 int True True
3.5 float False False
'3' str False False`,
            explanation: [
              "True의 실제 타입은 bool이므로 정확한 int 비교는 False지만, bool이 int의 하위 클래스라 isinstance는 True입니다.",
              "1은 실제 타입도 int이고 int 계층에도 속해 두 검사가 모두 True입니다.",
              "3.5와 '3'은 각각 float와 str이며 int 계층이 아니므로 두 검사가 모두 False입니다.",
              "repr 덕분에 문자열 '3'에는 따옴표가 보여 정수 3과 시각적으로 구분됩니다.",
            ],
          },
          experiments: [
            {
              change: "마지막 인수를 int 대신 (int, float)로 바꿉니다: isinstance(item, (int, float)).",
              prediction: "True, 1, 3.5는 True이고 '3'만 False입니다.",
              result: "지정된 두 타입 계층 중 하나에 속하면 True가 됩니다. bool은 여전히 int 계층에 포함됩니다.",
            },
            {
              change: "정수 도메인 검사식을 type(item) is int로 별도 출력합니다.",
              prediction: "오직 1만 True입니다.",
              result: "정확한 int만 받는 요구는 충족하지만 사용자 정의 int 하위 타입도 거부한다는 trade-off가 있습니다.",
            },
          ],
          sourceRefs: ["py-day01-ex03", "py-day01-note"],
        },
      ],
      diagnostics: [
        {
          symptom: "isinstance(True, int)가 예상과 달리 True다.",
          likelyCause: "Python에서 bool이 int의 하위 클래스라는 타입 계층과 ‘수량은 정수여야 한다’는 도메인 의미를 같은 것으로 보았습니다.",
          checks: ["print(type(True).__mro__)로 클래스 탐색 순서를 관찰합니다.", "정확한 int만 필요한지 int 하위 타입까지 허용할지 요구를 적습니다.", "불리언 입력을 별도로 금지해야 하는지 확인합니다."],
          fix: "정확한 내장 int만 허용한다면 type(value) is int를 사용합니다. 하위 타입은 허용하되 bool만 제외하려면 isinstance(value, int) and not isinstance(value, bool)를 사용합니다.",
          prevention: "타입 검사 전에 기술 타입 조건과 업무 의미 조건을 문장으로 구분합니다.",
        },
      ],
      comparisons: [
        {
          title: "객체 종류를 확인할 때 무엇을 선택할까요?",
          options: [
            { name: "type(x) is T", chooseWhen: "정확히 T 클래스만 허용해야 하는 명확한 경계", avoidWhen: "하위 클래스와 다형성을 자연스럽게 지원해야 할 때", tradeoffs: ["결과가 엄격하고 예측하기 쉽습니다.", "합법적인 하위 타입과 프록시를 거부할 수 있습니다."] },
            { name: "isinstance(x, T)", chooseWhen: "T와 하위 타입의 계약을 함께 허용할 때", avoidWhen: "bool을 int로 인정하면 안 되는 등 도메인 규칙이 계층과 다를 때 단독 사용", tradeoffs: ["상속과 추상 타입을 존중합니다.", "타입 계층의 예상 밖 관계도 함께 허용할 수 있습니다."] },
            { name: "행동 사용(덕 타이핑)", chooseWhen: "구체 클래스보다 필요한 메서드·프로토콜이 중요한 내부 협력", avoidWhen: "불신 외부 입력의 구조를 먼저 검증해야 할 때", tradeoffs: ["확장성과 재사용성이 좋습니다.", "실패가 실제 행동 호출 시점에 드러날 수 있어 테스트와 명확한 오류가 필요합니다."] },
          ],
        },
      ],
    },
    {
      id: "del-and-name-lifetime",
      title: "del은 객체가 아니라 이름 바인딩을 제거합니다",
      lead: "del score 뒤에 score를 읽으면 NameError가 나지만, 이것만으로 정수 객체 95가 즉시 파괴되었다고 결론 내리면 안 됩니다.",
      explanations: [
        "del score는 현재 이름 공간에서 score라는 바인딩을 제거합니다. 그 다음 score 표현식을 평가하면 파이썬은 해당 이름을 찾을 수 없어 NameError를 발생시킵니다. 원본 ex01_print.py에는 del su와 print(su)가 주석 처리되어 있습니다. 주석을 해제하면 정상 출력 예제의 마지막에서 의도적인 실패가 일어나며, 그 줄 뒤 코드는 실행되지 않습니다.",
        "삭제 전후 이름 존재를 globals()로 관찰할 수 있습니다. 파일 최상위에서 'score' in globals()는 전역 이름 공간 매핑에 키가 있는지 확인합니다. del 전에는 True, del 후에는 False입니다. globals는 학습 관찰 도구로 유용하지만 일반 업무 로직을 문자열 기반 전역 조회로 설계하라는 의미는 아닙니다.",
        "객체 수명과 이름 삭제는 별개입니다. alias = score 뒤 del score를 실행해도 alias가 같은 객체를 계속 가리키므로 alias는 유효합니다. 어떤 객체를 가리키는 강한 참조가 더는 없으면 Python 구현의 메모리 관리 대상이 될 수 있지만, 정확한 회수 시점과 방식은 구현에 따라 다를 수 있습니다. del을 메모리 즉시 해제 명령처럼 사용하지 않습니다.",
        "실제 코드에서 지역 이름을 일부러 del할 일은 흔하지 않습니다. 매우 큰 임시 객체의 참조를 긴 함수 중간에 명시적으로 끊거나, 루프 뒤 임시 이름의 오사용을 막는 특수 상황은 있을 수 있습니다. 그러나 대부분은 작은 함수로 수명을 좁히는 구조가 더 읽기 쉽고 테스트하기 쉽습니다. del은 데이터 구조 항목 삭제 문법에서도 쓰이지만, 이 세션은 이름 바인딩 삭제에만 집중합니다.",
      ],
      concepts: [
        {
          term: "del 문",
          definition: "지정한 대상의 바인딩 또는 항목 삭제 연산을 수행하는 문장입니다. 여기서는 이름 바인딩 삭제를 다룹니다.",
          detail: ["del name 후 같은 이름을 읽으면 다시 바인딩하기 전까지 NameError가 발생합니다.", "del(name)처럼 괄호를 쓸 수 있어도 del은 일반 함수 호출이 아니라 문법 문장입니다."],
          caveat: "del name이 모든 별칭을 지우거나 객체 메모리를 즉시 반환하라는 보장은 없습니다.",
        },
        {
          term: "이름 공간(namespace)",
          definition: "이름과 객체 바인딩을 보관하는 매핑입니다.",
          detail: ["모듈 전역, 함수 지역, 클래스 등 서로 다른 이름 공간이 있습니다.", "이 세션의 파일 최상위 예제는 globals()로 모듈 전역 이름을 관찰합니다."],
        },
      ],
      codeExamples: [
        {
          id: "python-del-nameerror",
          title: "이름 삭제 전후와 NameError를 안전하게 관찰하기",
          language: "python",
          filename: "delete_binding.py",
          purpose: "원본 ex01_print.py의 주석 처리된 del 실험을 프로그램 전체를 중간 종료하지 않는 형태로 재구성합니다.",
          code: `score = 95
print("삭제 전:", "score" in globals())
del score
print("삭제 후:", "score" in globals())

try:
    print(score)
except NameError as error:
    print("오류 종류:", type(error).__name__)
    print("원인:", error)`,
          walkthrough: [
            { lines: "1-2", explanation: "score를 int 객체에 바인딩하고 현재 모듈 전역 이름 공간에 키가 존재하는지 확인합니다." },
            { lines: "3-4", explanation: "del이 score 바인딩을 제거한 뒤 같은 이름 공간에 score 키가 없음을 확인합니다." },
            { lines: "6-7", explanation: "삭제된 이름을 실제로 읽어 NameError가 발생하는 지점을 만듭니다." },
            { lines: "8-10", explanation: "이번 학습 실험에서는 예외 객체를 받아 종류와 메시지만 출력합니다. 일반 프로그램에서 모든 NameError를 잡으라는 패턴은 아닙니다." },
          ],
          run: {
            environment: ["Python 3.11 이상", "UTF-8로 저장한 delete_binding.py"],
            command: "python delete_binding.py",
          },
          output: {
            value: `삭제 전: True
삭제 후: False
오류 종류: NameError
원인: name 'score' is not defined`,
            explanation: [
              "첫 True는 대입으로 score 바인딩이 전역 이름 공간에 만들어졌다는 뜻입니다.",
              "False는 del 뒤 이름 연결이 제거되었다는 뜻이지 정수 객체 95의 즉시 메모리 파괴를 증명하지 않습니다.",
              "삭제된 score를 읽는 순간 NameError 객체가 만들어지고 except가 이를 관찰합니다.",
              "예외 메시지의 score 철자는 파이썬이 찾지 못한 실제 이름이므로 오타 진단에도 사용합니다.",
            ],
          },
          experiments: [
            {
              change: "첫 줄 뒤 alias = score를 추가하고 del 뒤 print(alias)를 실행합니다.",
              prediction: "score는 없어도 alias가 같은 int 객체를 가리켜 95가 출력됩니다.",
              result: "95가 출력됩니다. del이 다른 이름의 바인딩까지 제거하지 않는다는 증거입니다.",
            },
            {
              change: "try/except를 제거하고 print(score) 뒤에 print('끝')을 추가합니다.",
              prediction: "traceback이 출력되고 '끝'은 출력되지 않습니다.",
              result: "처리되지 않은 NameError가 현재 프로그램 흐름을 중단하므로 뒤 문장에 도달하지 않습니다.",
            },
          ],
          sourceRefs: ["py-day01-ex01", "py-day01-note"],
        },
      ],
      diagnostics: [
        {
          symptom: "NameError: name 'score' is not defined가 발생한다.",
          likelyCause: "이름을 바인딩하기 전에 읽었거나, del로 삭제했거나, score와 socre처럼 철자가 다른 이름을 사용했습니다.",
          checks: ["traceback 가장 마지막 줄에서 찾지 못한 이름을 확인합니다.", "바로 위의 내 파일 경로와 줄 번호를 찾습니다.", "해당 줄보다 앞에서 같은 철자의 대입이 실제 실행되는지 확인합니다.", "대소문자와 조건 분기 안에서만 정의되는지 확인합니다."],
          fix: "사용 전에 올바른 이름을 바인딩하고 의도하지 않은 del을 제거합니다. 오타라면 한 이름으로 통일합니다.",
          prevention: "짧고 의미 있는 snake_case 이름, 에디터의 미정의 이름 검사, 작은 단위의 반복 실행을 사용합니다.",
        },
        {
          symptom: "del score를 실행했는데 alias 또는 같은 값이 여전히 출력되어 삭제가 실패했다고 생각한다.",
          likelyCause: "del이 값 자체와 모든 별칭을 삭제한다고 오해했습니다. 다른 이름이 같은 객체를 계속 가리키거나 같은 값의 별도 객체가 존재할 수 있습니다.",
          checks: ["어떤 이름을 del했는지 확인합니다.", "삭제 전에 alias = score 같은 별칭 대입이 있었는지 찾습니다.", "globals 또는 locals에서 삭제한 이름의 존재와 다른 이름의 존재를 각각 확인합니다."],
          fix: "삭제하려는 것이 이름인지 컨테이너 항목인지 업무 데이터인지 먼저 구분합니다. 단순히 더는 쓰지 않을 지역값이라면 작은 함수 범위로 구조를 바꿉니다.",
          prevention: "이름 바인딩 삭제와 객체 수명·데이터 삭제를 같은 용어로 뭉뚱그리지 않습니다.",
        },
      ],
      expertNotes: [
        "CPython에서는 참조 횟수가 0이 되면 즉시 정리되는 경우가 많지만 순환 참조와 다른 Python 구현 때문에 이를 언어 보장으로 의존하지 않습니다.",
        "비밀번호 문자열을 del한다고 메모리에서 모든 사본이 안전하게 지워진다고 보장할 수 없습니다. 비밀 수명 관리는 별도의 보안 설계가 필요합니다.",
      ],
    },
    {
      id: "nameerror-debugging",
      title: "NameError는 마지막 줄부터 정의 경로를 거꾸로 추적합니다",
      lead: "오류를 없애기 위해 무작정 try/except를 두르기보다, 이름 검색이 왜 실패했는지 정의·철자·분기·이름 공간 순서로 확인합니다.",
      explanations: [
        "처리되지 않은 NameError가 발생하면 traceback이 출력됩니다. 가장 아래에는 NameError라는 예외 타입과 name 'score' is not defined 같은 메시지가 있습니다. 바로 위에는 실패한 파일 경로, 줄 번호, 코드 줄이 있습니다. 라이브러리 호출이 길게 보이더라도 먼저 가장 아래의 내 코드 프레임을 찾습니다.",
        "첫 번째 점검은 철자와 대소문자입니다. total_score를 정의하고 total_socre를 읽으면 서로 다른 이름입니다. 두 번째는 실행 순서입니다. 파일은 위에서 아래로 실행되므로 print(score)가 score = 10보다 앞이면 실패합니다. 세 번째는 조건부 정의입니다. if 조건이 False일 때만 건너뛰는 대입 뒤에서 이름을 읽으면 어떤 실행에서는 존재하고 다른 실행에서는 없습니다.",
        "함수 내부와 외부는 서로 다른 이름 공간을 만들 수 있습니다. 함수 안에서 바인딩한 지역 이름을 함수 밖에서 바로 읽을 수 없습니다. 반대로 함수 안에서 같은 이름에 대입하면 파이썬은 그 이름을 지역 이름으로 판단하므로 대입 전 읽기에서 UnboundLocalError가 날 수 있습니다. UnboundLocalError는 NameError의 하위 예외지만 자세한 scope 규칙은 함수 세션에서 다룹니다.",
        "광범위한 except Exception 또는 except NameError로 오류를 숨기면 오타가 기본값으로 조용히 바뀌어 더 큰 잘못된 결과를 만들 수 있습니다. 의도적으로 선택 가능한 이름을 조회하는 구조라면 dict 같은 명시적 매핑을 사용합니다. 개발 중의 미정의 이름은 코드를 고치는 것이 기본 해결입니다.",
      ],
      concepts: [
        {
          term: "NameError",
          definition: "현재 이름 검색 규칙으로 요청한 이름의 바인딩을 찾지 못했을 때 발생하는 예외입니다.",
          detail: ["오타, 정의 전 사용, del 뒤 사용, 잘못된 이름 공간 접근이 대표 원인입니다.", "메시지에 찾지 못한 이름이 표시되어 첫 진단 단서가 됩니다."],
        },
        {
          term: "traceback",
          definition: "예외 지점까지 이어진 실행 호출 경로와 파일·줄 정보를 보여 주는 진단 기록입니다.",
          detail: ["가장 마지막 예외 타입·메시지부터 읽고 위쪽의 내 코드 위치로 이동합니다.", "첫 오류를 고친 뒤 다시 실행해 다음 독립 오류가 있는지 확인합니다."],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "코드에 score = 10이 보이는데도 NameError가 간헐적으로 발생한다.",
          likelyCause: "score 대입이 조건문 안에 있어 일부 실행 경로에서 수행되지 않거나, 예외 발생으로 대입 줄까지 도달하지 못했습니다.",
          checks: ["모든 분기에서 score가 바인딩되는지 흐름을 그립니다.", "대입 전 줄에서 다른 예외가 발생하지 않는지 확인합니다.", "분기 뒤 print 직전에 'score' in locals() 또는 globals()를 학습용으로 관찰합니다."],
          fix: "모든 정상 경로에서 값을 결정하도록 if/else 양쪽에 대입하거나, 값이 없을 수 있음을 None 같은 명시적 상태와 검증으로 표현합니다.",
          prevention: "조건부로 생겼다 사라지는 이름보다 먼저 기본 상태를 설계하고 정적 분석이 경로를 확인하도록 타입 힌트를 사용합니다.",
        },
      ],
      expertNotes: [
        "LEGB(Local, Enclosing, Global, Builtins) 이름 검색 규칙은 함수·클로저 세션에서 확장합니다. 지금은 오류가 발생한 현재 범위와 정의 시점을 먼저 봅니다.",
        "내장 이름 type, list, str에 다른 값을 바인딩하면 즉시 NameError는 나지 않지만 원래 내장 호출을 가려 디버깅을 어렵게 만듭니다.",
      ],
    },
    {
      id: "reading-type-state",
      title: "코드를 값 표가 아니라 바인딩 상태표로 읽습니다",
      lead: "각 줄 뒤에 이름→객체·타입 상태를 기록하면 출력 암기보다 훨씬 많은 오류를 미리 예측할 수 있습니다.",
      explanations: [
        "짧은 코드를 읽을 때 줄 번호, 실행한 문장, 현재 이름, 객체 값, 객체 타입을 표로 기록합니다. value = 21 뒤에는 value→21(int), alias = value 뒤에는 value→21(int), alias→21(int), value = '스물하나' 뒤에는 value→'스물하나'(str), alias→21(int)입니다. 이 표는 어떤 print가 무엇을 읽을지 직접 보여 줍니다.",
        "출력만 예측하면 우연히 정답을 맞힐 수 있지만 상태표는 이유를 설명하게 합니다. 특히 재바인딩과 별칭이 섞이면 ‘현재 value는 무엇인가’, ‘이전 객체를 가리키는 이름이 남았는가’, ‘type은 어느 객체에 묻는가’를 분리해야 합니다. 이 습관은 이후 함수 인수, 리스트 복사, 클래스 속성, pandas DataFrame 참조 문제로 확장됩니다.",
        "변형 실험은 한 번에 한 조건만 바꿉니다. 정수를 실수로 바꾸고 type 출력 변화를 기록한 뒤, 별칭 줄을 제거하고 결과를 다시 기록합니다. 여러 줄을 동시에 바꾸면 어떤 변경이 결과 원인인지 알기 어렵습니다. 예측→실행→실제 결과→차이 설명 네 칸을 남기면 학습 기록이 작은 테스트 문서가 됩니다.",
        "원본 ex03_datatype.py는 주석으로 자료형 목록을 제공하지만 실행 출력은 없습니다. 이는 실패가 아니라 개요 파일의 역할입니다. 이 세션은 그 목록을 그대로 출력하는 데 그치지 않고, 원본 ex01_print.py의 type과 del을 결합해 관찰 가능한 실행 증거를 추가했습니다. 원본에서 직접 증명한 범위와 교육을 위해 보강한 설명을 출처에 구분합니다.",
      ],
      concepts: [
        {
          term: "상태 추적(state tracing)",
          definition: "각 실행 단계 뒤 프로그램의 중요한 이름과 객체 관계를 기록하는 디버깅·학습 방법입니다.",
          detail: ["입력, 현재 바인딩, 타입, 다음 연산, 출력으로 나누면 원인과 결과가 연결됩니다.", "작은 프로그램에서는 손으로 표를 만들고 큰 프로그램에서는 디버거·테스트·구조화 로그를 사용합니다."],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "ex03_datatype.py를 실행했는데 아무 출력도 없어 Python 실행이 실패했다고 판단한다.",
          likelyCause: "원본 파일은 자료형 개요가 모두 주석으로만 작성되어 있고 print나 다른 출력 문장이 없습니다.",
          checks: ["명령 종료 코드가 0인지 확인합니다.", "파일에서 #으로 시작하지 않는 실행 문장이 있는지 확인합니다.", "맨 아래에 print('실행 확인')을 임시 추가하면 출력 통로를 확인할 수 있습니다."],
          fix: "파일의 역할을 주석형 개요로 이해하고, 관찰이 필요하면 별도 실습 파일에서 값을 만들고 type을 출력합니다.",
          prevention: "학습 문서에 ‘정상 실행되지만 출력 없음’이라는 예상 결과를 명시해 무출력과 실패를 구분합니다.",
        },
      ],
    },
    {
      id: "typing-maintainability-tests",
      title: "전문가 코드는 동적 유연성과 명시적 계약을 함께 사용합니다",
      lead: "재바인딩이 가능하다는 언어 특성과 의미가 계속 바뀌는 코드를 작성하는 것은 다른 문제입니다.",
      explanations: [
        "한 이름을 여러 타입에 재바인딩하는 실험은 동적 타이핑을 이해하는 데 좋습니다. 그러나 업무 코드에서 user가 어떤 줄에서는 사용자 객체, 다른 줄에서는 사용자 ID 문자열, 또 다른 줄에서는 None이 되면 호출자는 매번 상태를 추론해야 합니다. 서로 다른 의미에는 user, user_id처럼 다른 이름을 사용하고, 값이 없을 수 있으면 Optional 의미를 타입 힌트와 분기로 드러냅니다.",
        "타입 힌트 count: int = 3은 사람과 IDE, mypy·pyright 같은 정적 검사기에 의도를 전달합니다. 기본 Python 런타임은 이후 count = '세 개'를 자동으로 막지 않습니다. 타입 힌트는 동적 타이핑을 없애는 문법이 아니라 실행 전에 불일치 가능성을 발견하도록 돕는 별도 계약 정보입니다. 런타임의 불신 외부 데이터에는 여전히 파싱과 검증이 필요합니다.",
        "테스트는 대표값만이 아니라 타입 경계를 확인해야 합니다. 수량 함수가 int를 받는다면 1뿐 아니라 0, 음수, True, 1.0, '1', None을 넣어 허용·거부 정책을 기록합니다. 특히 bool과 int 관계처럼 언어 타입 계층과 업무 의미가 다른 경계는 테스트가 명세 역할을 합니다.",
        "디버깅 출력에는 값, 타입, 의미 있는 라벨을 함께 기록하되 비밀번호·토큰·개인정보를 출력하지 않습니다. repr은 문자열 따옴표와 이스케이프를 보여 줘 진단에 좋지만 비밀까지 더 정확히 노출할 수 있습니다. 운영 환경은 print 대신 logging과 민감 정보 마스킹 정책을 사용합니다.",
      ],
      concepts: [
        {
          term: "타입 힌트(type hint)",
          definition: "이름·인수·반환값에 기대하는 타입을 도구와 독자에게 전달하는 주석 정보입니다.",
          detail: ["기본 런타임에서 대입을 강제로 제한하지 않습니다.", "정적 검사, 자동 완성, 리팩터링과 API 문서화에 도움을 줍니다."],
          caveat: "외부 JSON이나 사용자 입력이 타입 힌트를 자동으로 따르는 것은 아니므로 런타임 검증이 별도로 필요합니다.",
        },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        {
          title: "동적 코드의 타입 의도를 어떻게 보강할까요?",
          options: [
            { name: "의미 있는 이름", chooseWhen: "모든 코드에서 가장 먼저", avoidWhen: "없음. 다만 이름만으로 복잡한 구조 전체를 설명하려 할 때", tradeoffs: ["추가 도구 없이 읽기 쉬워집니다.", "실제 타입 불일치를 자동 검출하지는 않습니다."] },
            { name: "타입 힌트+정적 검사", chooseWhen: "함수·모듈 경계와 장기 유지 코드", avoidWhen: "한 줄 실험에서 설정 비용이 학습 목적보다 클 때", tradeoffs: ["실행 전 많은 불일치를 찾습니다.", "런타임 외부 데이터 검증을 대신하지 않습니다."] },
            { name: "런타임 검증", chooseWhen: "사용자 입력·파일·API 등 신뢰 경계", avoidWhen: "내부 모든 줄에 중복 검사해 코드 흐름을 가릴 때", tradeoffs: ["실제 잘못된 데이터를 경계에서 차단합니다.", "검사 비용과 오류 설계가 필요합니다."] },
          ],
        },
      ],
      expertNotes: [
        "값에 따라 타입이 달라지는 API보다 가능한 상태를 별도 타입·명시적 결과 객체로 표현하면 호출자가 다루기 쉽습니다.",
        "성능을 위해 del을 습관적으로 넣기 전에 프로파일링하고, 객체 수명이 길어진 구조적 원인을 먼저 줄입니다.",
      ],
    },
    {
      id: "independent-checkpoint",
      title: "이 세션만 열어도 답할 수 있는 최종 체크포인트",
      lead: "문법 이름을 암기했는지가 아니라 새 코드를 보고 바인딩 상태, 타입 질문, 실패 지점을 설명할 수 있는지 확인합니다.",
      explanations: [
        "새 대입문을 만나면 오른쪽에서 어떤 객체가 만들어지는지, 왼쪽에서 어느 이름의 바인딩이 생기거나 바뀌는지 순서대로 말합니다. 같은 이름에 다른 타입 값을 대입했다면 객체가 변신했다고 말하지 않고 이름이 재바인딩되었다고 설명합니다. 다른 별칭이 있는지 확인해 이전 객체 접근 가능성도 함께 추적합니다.",
        "타입을 확인할 때는 질문을 먼저 고릅니다. 단순 관찰은 type, 정확한 클래스 일치는 type(x) is T, 하위 클래스 포함 계약은 isinstance를 사용합니다. bool과 int처럼 계층과 업무 의미가 어긋나는 사례에서는 추가 규칙을 작성합니다. 함수가 지원 행동만 필요하다면 구체 타입 검사를 줄이는 덕 타이핑도 후속 선택지입니다.",
        "NameError가 나오면 예외를 숨기지 않고 traceback 마지막 줄, 사용자 파일·줄, 철자, 정의 순서, 분기, 현재 이름 공간을 확인합니다. del은 해당 이름 연결을 제거할 뿐 모든 별칭과 객체를 강제로 없애는 명령이 아닙니다. 이 네 문장을 스스로 설명할 수 있으면 다음 자료형·컬렉션 세션으로 넘어갈 준비가 된 것입니다.",
      ],
      concepts: [],
      codeExamples: [],
      diagnostics: [],
      expertNotes: [
        "코드 리뷰에서는 ‘변수 타입이 바뀐다’는 표현을 완전히 금지하기보다, 참조 모델이 중요한 버그에서는 이름 재바인딩과 객체 타입을 정확히 구분합니다.",
        "학습 설명은 쉬운 비유로 시작해도 되지만, 별칭·변경 가능성에서 비유가 깨지는 지점을 반드시 밝혀야 합니다.",
      ],
    },
  ],
  lab: {
    title: "학습 상태 이름의 생애주기 추적기",
    scenario: "학습 진도를 나타내는 이름을 생성하고 별칭을 만든 뒤 다른 타입으로 재바인딩하고 삭제하면서, 각 단계의 값·타입·이름 존재 여부를 상태표와 실제 출력으로 검증합니다.",
    setup: [
      "Python 3.11 이상을 준비하고 python --version으로 선택된 버전을 기록합니다.",
      "새 파일 variable_lifecycle.py를 UTF-8로 만듭니다.",
      "표의 열을 단계, 이름, repr 값, type 이름, 존재 여부로 미리 적습니다.",
    ],
    steps: [
      "progress = 25를 바인딩하고 repr(progress), type(progress).__name__을 출력합니다.",
      "saved_progress = progress로 별칭을 만들고 두 이름이 현재 같은 객체를 가리키는지 학습용 is 검사로 관찰합니다.",
      "progress = '25%'로 재바인딩한 뒤 progress와 saved_progress의 값·타입을 각각 출력합니다.",
      "type(progress) is str과 isinstance(saved_progress, int)를 출력하고 두 질문의 의미를 설명합니다.",
      "del progress를 실행하고 'progress' in globals() 결과를 기록합니다.",
      "삭제된 progress를 읽어 발생하는 NameError를 먼저 처리하지 않은 상태로 실행하고 traceback을 기록합니다.",
      "마지막에는 예외 실험을 try/except로 감싸 saved_progress가 여전히 25임을 출력합니다.",
    ],
    expectedResult: [
      "재바인딩 전 progress와 saved_progress는 int 객체 25를 가리킵니다.",
      "재바인딩 후 progress는 str '25%', saved_progress는 int 25를 가리킵니다.",
      "del 뒤 progress 이름은 없지만 saved_progress는 정상 출력됩니다.",
      "처리하지 않은 실험에서는 정확한 NameError traceback과 실패 줄을 확인하고, 처리한 버전에서는 프로그램이 마지막 줄까지 실행됩니다.",
    ],
    cleanup: ["traceback을 관찰한 실패 버전과 복구 버전을 둘 다 학습 기록에 보존합니다.", "실습 출력에 개인 정보나 비밀값이 없는지 확인합니다."],
    extensions: [
      "progress: int = 25 타입 힌트를 추가한 뒤 문자열 재바인딩을 런타임과 정적 검사기가 각각 어떻게 다루는지 비교합니다.",
      "True, 1, 1.0, '1'을 입력 후보로 두고 수량 규칙의 허용·거부 표를 설계합니다.",
      "리스트 하나를 두 이름에 바인딩해 객체 자체 변경과 이름 재바인딩의 차이를 다음 세션 예고 실험으로 기록합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "course 이름을 문자열 객체에 바인딩하고 type을 확인한 뒤 같은 이름을 정수 객체에 재바인딩하세요.",
      requirements: ["각 대입 직후 repr 값과 type.__name__을 출력합니다.", "두 상태를 이름→객체 표로 적습니다.", "객체가 변한 것이 아니라 이름의 대상이 바뀌었다는 문장을 포함합니다."],
      hints: ["f'{course!r}'를 쓰면 문자열 따옴표를 관찰하기 쉽습니다.", "대입 오른쪽부터 상태를 기록하세요."],
      expectedOutcome: "같은 이름에서 str과 int 타입 출력이 차례로 나오고 재바인딩을 정확한 용어로 설명합니다.",
      solutionOutline: ["course = 'Python' 상태를 출력합니다.", "course = 9로 재바인딩합니다.", "두 type 결과와 상태표를 비교합니다."],
    },
    {
      difficulty: "응용",
      prompt: "주문 수량 검증에서 bool을 거부하고 정확한 int만 허용하는 함수를 만들기 전, type과 isinstance 조건을 값 표로 실험하세요.",
      requirements: ["True, 1, 0, -1, 1.0, '1'을 검사합니다.", "type(x) is int와 isinstance(x, int) 결과를 모두 기록합니다.", "업무 규칙에 적합한 조건을 선택하고 이유를 씁니다."],
      hints: ["bool은 int 하위 클래스입니다.", "기술 타입 계층과 수량이라는 업무 의미를 구분하세요."],
      expectedOutcome: "True를 제외하고 실제 int 값만 허용하는 규칙과 그 경계값 근거가 완성됩니다.",
      solutionOutline: ["후보 목록을 순회합니다.", "두 검사 결과를 출력합니다.", "정확한 int 조건 또는 bool 제외 조건을 선택합니다."],
    },
    {
      difficulty: "설계",
      prompt: "사용자 입력으로 받은 학습 세션 수를 검증·변환·보관하는 작은 콘솔 경계를 설계하세요.",
      requirements: ["원본 문자열 이름과 변환된 정수 이름을 다르게 정합니다.", "빈 문자열, '3', '3.5', True에 해당하는 내부 테스트 값을 포함합니다.", "정상·실패의 타입과 메시지를 기록합니다.", "불필요한 del 대신 이름 수명을 짧게 유지하는 함수 구조를 제안합니다."],
      hints: ["입력은 문자열이라는 경계 가정에서 시작하세요.", "변환 전 검증과 int 변환 실패를 구분하세요.", "한 이름을 str과 int 의미로 재사용하지 마세요."],
      expectedOutcome: "입력 텍스트·검증·정수 변환·업무 사용 단계가 분리되고 각 이름의 의미와 타입이 일관된 설계가 나옵니다.",
      solutionOutline: ["raw_count와 session_count를 분리합니다.", "변환 오류를 사용자 메시지로 바꿉니다.", "경계값 표를 테스트로 고정합니다.", "지역 함수가 끝나면 임시 이름 수명도 끝나게 설계합니다."],
    },
  ],
  reviewQuestions: [
    { question: "score = 10에서 이름, 객체, 타입은 각각 무엇인가요?", answer: "score는 이름, 10은 런타임 정수 객체, int는 그 객체의 타입입니다. 대입은 score 이름을 int 객체 10에 바인딩합니다." },
    { question: "score = 10 다음 score = '완료'를 실행하면 정수 객체가 문자열 객체로 변한 것인가요?", answer: "아닙니다. score 이름이 새 str 객체 '완료'로 재바인딩되었습니다. int 객체 10 자체가 str로 변한 것은 아닙니다." },
    { question: "alias = score 뒤 score를 재바인딩하면 alias도 자동으로 새 객체를 가리키나요?", answer: "아닙니다. 재바인딩한 이름만 대상이 바뀝니다. alias는 기존 객체에 대한 바인딩을 유지합니다." },
    { question: "동적 타이핑은 '3' + 4를 Python이 자동으로 7로 만든다는 뜻인가요?", answer: "아닙니다. str과 int의 해당 + 연산은 지원되지 않아 TypeError가 발생합니다. 필요한 목적에 따라 명시 변환하거나 f-string을 써야 합니다." },
    { question: "type(True) is int와 isinstance(True, int)의 결과가 다른 이유는 무엇인가요?", answer: "True의 정확한 타입은 bool이므로 첫 결과는 False입니다. bool은 int의 하위 클래스이므로 isinstance 결과는 True입니다." },
    { question: "del score는 무엇을 삭제하나요?", answer: "현재 이름 공간의 score 바인딩을 제거합니다. 다른 이름이 같은 객체를 가리킬 수 있고 객체 메모리의 즉시 파괴를 보장하지 않습니다." },
    { question: "NameError가 발생하면 traceback에서 가장 먼저 무엇을 확인하나요?", answer: "가장 아래의 예외 타입과 찾지 못한 이름을 보고, 바로 위의 내 파일·줄에서 철자, 정의 순서, 분기, 이름 공간을 확인합니다." },
    { question: "타입 힌트 count: int = 3은 이후 count = '세 개'를 런타임에서 막나요?", answer: "기본 Python 런타임은 막지 않습니다. 타입 힌트는 사람과 정적 검사 도구에 의도를 제공하며 외부 입력의 런타임 검증은 별도로 필요합니다." },
  ],
  completionChecklist: [
    "이름·객체·타입을 한 예제에서 각각 지목할 수 있다.",
    "대입문의 오른쪽 평가 뒤 왼쪽 바인딩 순서를 설명할 수 있다.",
    "별칭을 만든 뒤 한 이름만 재바인딩한 상태를 표로 추적할 수 있다.",
    "동적 타이핑과 자동 형변환을 구분할 수 있다.",
    "type 정확 일치와 isinstance 계층 검사의 선택 기준을 말할 수 있다.",
    "bool과 int의 관계를 업무 규칙과 분리해 검증할 수 있다.",
    "del 이후 NameError가 나는 이유와 다른 별칭이 남을 수 있는 이유를 설명할 수 있다.",
    "NameError traceback을 정의·철자·분기·이름 공간 순으로 진단할 수 있다.",
    "세 코드 예제를 직접 실행하고 제시된 출력과 일치함을 확인했다.",
  ],
  nextSessions: [],
  sources: [
    {
      id: "py-day01-ex03",
      repository: "PYTHON-BASIC",
      path: "day01/ex03_datatype.py",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day01/ex03_datatype.py",
      usedFor: ["기본 자료형 지도", "객체별 타입", "동적 타이핑 설명의 원본 범위"],
      evidence: "Python 3.13.9에서 직접 실행했으며 종료 코드 0과 무출력을 확인했습니다. 파일은 int·float·str·bool·list·tuple·dict·set 특징을 주석으로 제공하는 개요형 원본입니다.",
    },
    {
      id: "py-day01-ex01",
      repository: "PYTHON-BASIC",
      path: "day01/ex01_print.py",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day01/ex01_print.py",
      usedFor: ["변수 대입", "type 출력", "del과 NameError 실험", "실행 결과 근거"],
      evidence: "Python 3.13.9에서 직접 실행해 문자열 출력, 값 3, int·float·str·str·bool·bool 타입 출력을 확인했습니다. 원본의 del su와 print(su)는 의도적 실패 실험으로 주석 처리되어 있습니다.",
    },
    {
      id: "py-day01-note",
      repository: "PYTHON-BASIC",
      path: "notes/day01_basic.md",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day01_basic.md",
      usedFor: ["변수 이름 규칙", "type 표", "del 이후 NameError", "자료형 전체 개요", "참고 파일 매핑"],
      evidence: "Day01 노트를 직접 읽고 변수 선언·이름 규칙·type 결과·del 설명과 ex01/ex03 파일 매핑을 원본 범위로 확인했습니다.",
    },
  ],
  sourceCoverage: {
    filesRead: 3,
    filesUsed: 3,
    uncoveredNotes: [
      "주 원본 ex03_datatype.py는 자료형 목록만 주석으로 제공하고 실행 출력이 없으므로, ex01_print.py의 실제 type·del 코드를 근거로 세 개의 독립 실행 예제를 재구성했습니다.",
      "list·tuple·dict·set의 생성·변경·순회는 이 세션의 단일 핵심 질문을 벗어나므로 후속 컬렉션 세션으로 남겼습니다.",
      "LEGB 전체 규칙, 함수 지역변수의 UnboundLocalError, 가비지 컬렉션 내부 알고리즘은 이름 바인딩을 이해하는 데 필요한 경계만 소개하고 후속 함수·객체 모델 세션으로 남겼습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
