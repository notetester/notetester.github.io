import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-028"],
  slug: "python-028-class-object-constructor",
  courseId: "python",
  moduleId: "03-oop-stdlib",
  order: 28,
  title: "클래스·객체·생성자",
  subtitle: "class 본문이 클래스 객체를 만들고, 호출된 클래스가 인스턴스를 초기화하며, self를 통해 객체별 상태를 유지하는 전 과정을 추적합니다.",
  level: "중급",
  estimatedMinutes: 140,
  coreQuestion: "관련 데이터와 동작을 하나의 객체로 묶을 때 클래스 정의·인스턴스 생성·__init__·self·속성 조회는 어떤 순서로 작동하며, 공유 상태와 불완전한 객체를 어떻게 피할까요?",
  summary: "원본 Human·Human2·Human3와 Calc 클래스를 직접 실행해 클래스 변수, 인스턴스 변수, __init__, self, 메서드 호출을 확인합니다. class 본문이 정의 시 한 번 실행되어 클래스 객체를 만들고, 클래스를 호출하면 새 인스턴스가 생성된 뒤 __init__이 초기화한다는 정신 모델을 세웁니다. 인스턴스와 클래스 속성의 조회·shadowing, bound method의 self 전달, 가변 클래스 속성 공유 버그, 생성 시 불변식 검증, dataclass와 일반 클래스의 선택, has-a composition과 is-a inheritance의 경계, 상태 없는 Calc가 정말 클래스여야 하는지도 함께 검토합니다.",
  objectives: [
    "class 문 실행과 클래스 객체 생성, 클래스 호출과 인스턴스 생성·초기화의 순서를 설명할 수 있다.",
    "__init__이 객체를 새로 만드는 함수라기보다 생성된 인스턴스의 초기 상태를 설정하는 메서드임을 설명할 수 있다.",
    "self가 현재 인스턴스를 가리키며 instance.method() 호출에서 자동 전달되는 과정을 코드로 추적할 수 있다.",
    "클래스 속성과 인스턴스 속성의 저장 위치·공유 범위·shadowing을 구분할 수 있다.",
    "가변 클래스 속성이 모든 인스턴스에 공유되는 실패를 재현하고 __init__의 인스턴스 속성으로 고칠 수 있다.",
    "생성 시 유효하지 않은 상태를 거부하는 invariant 검증과 오류 테스트를 작성할 수 있다.",
    "일반 클래스·dataclass·모듈 함수·composition을 책임과 상태에 따라 선택할 수 있다.",
  ],
  prerequisites: [
    {
      title: "함수 계약·스코프·반환",
      reason: "메서드는 클래스 이름 공간에 저장된 함수이며, self 매개변수와 return·예외 계약은 일반 함수의 규칙을 따릅니다.",
      sessionSlug: "python-021-function-contract-scope-return",
    },
    {
      title: "기본값·*args·**kwargs",
      reason: "__init__의 선택 인수와 가변 기본값 함정을 객체 상태 초기화에 연결합니다.",
      sessionSlug: "python-022-default-args-varargs-kwargs",
    },
  ],
  keywords: ["Python", "class", "object", "instance", "__init__", "self", "attribute lookup", "class attribute", "instance attribute", "invariant", "dataclass", "composition"],
  chapters: [
    {
      id: "class-statement-model",
      title: "class 문은 설계도를 저장하는 것이 아니라 클래스 객체를 만듭니다",
      lead: "파이썬이 class Human:을 만나는 순간 들여쓴 본문을 실행해 별도 이름 공간을 채운 뒤 Human이라는 클래스 객체를 만듭니다.",
      explanations: [
        "class 본문 안의 대입 name = '둘리'와 함수 정의 def prn(...):는 인스턴스를 만들 때마다 반복되는 준비 코드가 아닙니다. 클래스 정의가 실행될 때 한 번 평가되어 클래스 이름 공간에 name, age, prn 같은 속성을 만듭니다. 이후 Human이라는 이름이 완성된 클래스 객체를 가리킵니다.",
        "클래스도 객체이므로 Human.name처럼 인스턴스 없이 클래스 속성을 읽을 수 있고, type(Human)은 일반적으로 type입니다. hong = Human()에서 괄호는 클래스를 호출합니다. 이 호출은 새 Human 인스턴스를 만드는 프로토콜을 시작하며, 클래스 본문을 다시 실행하는 것은 아닙니다.",
        "설계도 비유는 입문에 유용하지만 정적인 종이와 달리 클래스 객체 자체도 런타임 값이라는 차이를 기억해야 합니다. 다른 함수에 전달하고, 클래스 속성을 읽고 바꾸고, type과 isinstance로 검사할 수 있습니다. 그렇다고 런타임에 속성을 무분별하게 추가하라는 뜻은 아니며 공개 계약은 명시적으로 유지합니다.",
      ],
      concepts: [
        {
          term: "클래스 객체",
          definition: "class 문이 실행된 결과로 만들어지며 인스턴스를 생성하고 공통 속성·메서드를 제공하는 호출 가능한 객체입니다.",
          detail: [
            "클래스 이름 Human은 이 객체를 가리킵니다.",
            "Human() 호출은 새 인스턴스 생성 프로토콜을 시작합니다.",
          ],
          analogy: "공장의 설계 문서라기보다 제품 생성 기능과 공통 정책을 가진 실제 가동 중인 공장 객체에 가깝습니다.",
        },
        {
          term: "클래스 이름 공간",
          definition: "class 본문에서 정의한 이름을 속성으로 보관하는 공간입니다.",
          detail: [
            "메서드 함수, 클래스 상수, 공유 설정이 들어갑니다.",
            "인스턴스별 데이터와 구분해야 합니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "클래스 정의를 import했을 뿐인데 class 본문의 print나 파일 접근이 실행된다.",
          likelyCause: "class 본문은 인스턴스 생성 때가 아니라 클래스 정의 자체가 실행될 때 한 번 실행됩니다.",
          checks: [
            "class 들여쓰기 바로 아래에 함수 밖 실행문이 있는지 확인합니다.",
            "import 시점과 인스턴스 생성 시점의 출력을 분리해 기록합니다.",
            "상수 계산인지 외부 부수 효과인지 구분합니다.",
          ],
          fix: "클래스 본문에는 선언적 정의와 안전한 상수만 두고 외부 I/O·등록 부수 효과는 명시적 초기화 함수로 옮깁니다.",
          prevention: "import smoke test에서 예기치 않은 stdout·파일·네트워크 변경이 없는지 확인합니다.",
        },
      ],
      expertNotes: [
        "metaclass와 descriptor는 클래스 생성·속성 접근을 더 확장하지만 이 세션에서는 type이 만드는 일반 클래스의 관찰 가능한 순서에 집중합니다.",
      ],
    },
    {
      id: "instance-init-self",
      title: "클래스 호출은 인스턴스를 만들고 __init__으로 상태를 설정합니다",
      lead: "일상적으로 __init__을 생성자라고 부르지만 정확히는 이미 만들어진 새 인스턴스를 초기화하는 특수 메서드입니다.",
      explanations: [
        "Human2('김두한', 17, '종로')처럼 클래스를 호출하면 Python의 객체 생성 프로토콜이 새 인스턴스를 얻고 그 인스턴스와 나머지 인수를 __init__에 전달합니다. 일반적인 클래스에서는 __new__가 인스턴스 생성을 맡고 __init__이 초기화를 맡습니다. 입문 코드에서 __new__를 직접 구현할 필요는 거의 없습니다.",
        "def __init__(self, name, age, addr):의 self는 새 인스턴스를 가리킵니다. self.name = name은 매개변수 지역값을 인스턴스 속성으로 저장합니다. 오른쪽 name은 __init__ 실행 중에만 존재하는 지역 이름이고 왼쪽 self.name은 인스턴스가 살아 있는 동안 유지되는 속성입니다. 둘은 철자가 같아도 저장 위치와 생존 기간이 다릅니다.",
        "__init__은 None을 반환해야 합니다. return other처럼 다른 객체를 명시적으로 반환하면 TypeError가 발생합니다. 팩토리나 대체 생성자에서 다른 객체를 돌려줘야 한다면 별도 함수나 classmethod를 사용합니다.",
        "인수가 빠지거나 많으면 __init__ 본문에 들어가기 전에 TypeError가 납니다. 이 오류는 객체 상태 검증 실패와 구분해야 합니다. 호출 형태가 맞더라도 나이 -1처럼 도메인 규칙을 어기면 __init__ 안에서 ValueError를 명시적으로 발생시킬 수 있습니다.",
      ],
      concepts: [
        {
          term: "인스턴스",
          definition: "특정 클래스의 생성 프로토콜로 만들어지고 자기 상태를 가질 수 있는 개별 객체입니다.",
          detail: [
            "kim과 dong이 같은 클래스로 만들어져도 서로 다른 인스턴스입니다.",
            "isinstance(kim, Human2)로 클래스 관계를 확인할 수 있습니다.",
          ],
        },
        {
          term: "__init__",
          definition: "새 인스턴스가 만들어진 뒤 호출되어 초기 상태와 invariant를 설정하는 특수 메서드입니다.",
          detail: [
            "첫 인수로 새 인스턴스 self를 받습니다.",
            "정상 완료 시 None을 반환해야 합니다.",
          ],
          caveat: "__init__이 인스턴스를 메모리에 할당하는 정확한 생성 단계는 아닙니다. 객체 생성 자체는 __new__가 담당합니다.",
        },
        {
          term: "self",
          definition: "인스턴스 메서드 호출의 대상 객체를 받는 관례적인 첫 매개변수 이름입니다.",
          detail: [
            "키워드는 아니지만 관례와 도구 호환성을 위해 self라는 이름을 사용합니다.",
            "메서드 본문에서 self.attribute로 현재 객체의 상태에 접근합니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "TypeError: Human2.__init__() missing required positional argument가 발생한다.",
          likelyCause: "클래스 호출에 __init__이 요구하는 name, age, addr 중 일부를 전달하지 않았습니다.",
          checks: [
            "클래스 호출 인수와 __init__ 시그니처를 나란히 비교합니다.",
            "self는 호출자가 직접 넣지 않는다는 점을 확인합니다.",
            "기본값이 정말 도메인에서 안전한지 검토합니다.",
          ],
          fix: "필수 인수를 모두 전달하거나 의미 있는 선택값에만 기본값을 정의합니다.",
          prevention: "타입 힌트와 IDE 시그니처 검사, 정상·누락·추가 인수 테스트를 사용합니다.",
        },
        {
          symptom: "TypeError: __init__() should return None, not ...가 발생한다.",
          likelyCause: "__init__에서 self나 다른 값을 명시적으로 반환했습니다.",
          checks: [
            "__init__의 모든 return 문을 찾습니다.",
            "객체 생성 결과를 바꾸려는 요구인지 단순 초기화인지 확인합니다.",
          ],
          fix: "__init__은 값 없이 return하거나 끝까지 실행하고, 객체를 선택해 반환해야 하면 factory/classmethod를 사용합니다.",
          prevention: "__init__ 반환 타입을 -> None으로 표기하고 테스트에서 클래스 호출 성공을 확인합니다.",
        },
      ],
    },
    {
      id: "attribute-lookup-state",
      title: "인스턴스 속성과 클래스 속성은 저장 위치와 조회 순서가 다릅니다",
      lead: "obj.attr은 흔히 인스턴스 상태를 먼저 찾고 없으면 클래스의 공통 속성으로 올라가지만, 대입은 인스턴스에 새 속성을 만들어 클래스값을 가릴 수 있습니다.",
      explanations: [
        "원본 Human은 name과 age를 클래스 본문에 두어 모든 인스턴스가 같은 기본값을 봅니다. Human3은 phone을 클래스 속성으로 공유하고 name, age, email을 __init__에서 self에 저장해 인스턴스마다 다르게 유지합니다. dong.phone과 dong2.phone이 같은 번호를 출력하지만 두 이메일은 서로 다릅니다.",
        "일반적인 속성 조회에서 instance.name은 인스턴스에 name이 있으면 그 값을 사용하고, 없으면 클래스와 상속 계층에서 찾습니다. dong.phone은 인스턴스에 phone이 없어서 Human3.phone을 봅니다. dong.phone = '개인 번호'로 대입하면 보통 dong 인스턴스에 phone을 만들어 클래스 속성을 가립니다. dong2와 Human3.phone은 여전히 기존값입니다.",
        "실제 Python 속성 조회에는 descriptor와 __getattribute__가 참여해 data descriptor가 인스턴스 dict보다 우선하는 등의 세부 규칙이 있습니다. 여기서는 일반 데이터 속성의 인스턴스→클래스 fallback을 정신 모델로 사용하고 property 같은 descriptor는 후속 고급 세션에서 확장합니다.",
        "클래스 속성은 모든 객체에 정말 같은 정책·상수·통계가 필요할 때 사용합니다. 사람별 이름·이메일·잔액처럼 개별 상태를 클래스 속성에 두면 한 객체만 바꾸려던 코드가 shadowing을 만들거나 공유 정책을 오해하게 됩니다.",
      ],
      concepts: [
        {
          term: "인스턴스 속성",
          definition: "특정 인스턴스에 저장되어 그 객체의 개별 상태를 나타내는 속성입니다.",
          detail: [
            "보통 __init__에서 self.name 형태로 만듭니다.",
            "다른 인스턴스의 같은 이름 속성과 독립적입니다.",
          ],
        },
        {
          term: "클래스 속성",
          definition: "클래스 객체에 저장되어 인스턴스 조회의 공통 fallback 또는 클래스 수준 정책으로 사용되는 속성입니다.",
          detail: [
            "Class.attr로 직접 읽고 갱신할 수 있습니다.",
            "immutable 상수·공통 설정에는 적합하지만 mutable 컨테이너는 공유 함정이 큽니다.",
          ],
        },
        {
          term: "attribute shadowing",
          definition: "인스턴스에 클래스 속성과 같은 이름의 속성을 만들어 해당 인스턴스 조회에서 클래스값을 가리는 현상입니다.",
          detail: [
            "클래스 속성 자체가 바뀐 것은 아닙니다.",
            "del instance.attr 뒤에는 다시 클래스 속성이 보일 수 있습니다.",
          ],
        },
      ],
      codeExamples: [
        {
          id: "human-instance-and-class-state",
          title: "사람별 상태와 공통 속성·shadowing 확인",
          language: "python",
          filename: "human_state.py",
          purpose: "원본 Human2·Human3 구조를 한 클래스로 재구성해 __init__, self, 클래스 속성 fallback, 인스턴스 shadowing을 정확히 관찰합니다.",
          code: "class Human:\n    species = '사람'\n    phone_prefix = '010'\n\n    def __init__(self, name, age, email):\n        self.name = name\n        self.age = age\n        self.email = email\n\n    def introduce(self):\n        return f'{self.name}는 {self.age}살입니다.'\n\ndong = Human('희동이', 3, 'dong@example.com')\ngildong = Human('길동이', 15, 'gildong@example.com')\n\nprint(dong.introduce())\nprint(gildong.introduce())\nprint(dong.phone_prefix, gildong.phone_prefix, Human.phone_prefix)\n\ndong.phone_prefix = '070'\nprint(dong.phone_prefix, gildong.phone_prefix, Human.phone_prefix)\nprint(dong.email != gildong.email)",
          walkthrough: [
            {
              lines: "1-3",
              explanation: "species와 phone_prefix는 클래스 정의 시 Human 클래스 객체에 한 번 저장됩니다.",
            },
            {
              lines: "5-8",
              explanation: "__init__은 호출 때 전달된 세 값을 현재 self 인스턴스의 개별 속성으로 저장합니다.",
            },
            {
              lines: "10-11",
              explanation: "introduce는 self를 통해 호출 대상 인스턴스의 name과 age를 읽어 문자열을 반환합니다.",
            },
            {
              lines: "13-14",
              explanation: "같은 Human 클래스를 두 번 호출해 서로 다른 상태의 인스턴스를 만듭니다.",
            },
            {
              lines: "18",
              explanation: "두 인스턴스에는 phone_prefix가 없으므로 둘 다 Human.phone_prefix의 '010'을 봅니다.",
            },
            {
              lines: "20-22",
              explanation: "dong.phone_prefix 대입은 dong에만 '070' 속성을 만들어 클래스값을 가립니다. gildong과 클래스는 계속 '010'입니다.",
            },
          ],
          run: {
            environment: ["Python 3.11 이상", "UTF-8로 저장한 human_state.py", "외부 패키지 없음"],
            command: "python human_state.py",
          },
          output: {
            value: "희동이는 3살입니다.\n길동이는 15살입니다.\n010 010 010\n070 010 010\nTrue",
            explanation: [
              "introduce는 같은 메서드지만 self가 다른 인스턴스라 서로 다른 상태를 읽습니다.",
              "첫 phone 줄은 클래스 속성 fallback을, 둘째 phone 줄은 dong만의 shadowing을 보여 줍니다.",
              "서로 다른 email 속성은 인스턴스별 상태가 독립적임을 확인합니다.",
            ],
          },
          experiments: [
            {
              change: "Human.phone_prefix = '011'을 마지막에 실행합니다.",
              prediction: "gildong은 011을 보지만 이미 070으로 shadowing한 dong은 계속 070을 봅니다.",
              result: "인스턴스에 같은 이름 속성이 생기면 이후 클래스값 변경도 그 인스턴스 조회에는 가려집니다.",
            },
            {
              change: "del dong.phone_prefix 뒤 dong.phone_prefix를 출력합니다.",
              prediction: "인스턴스 shadow 속성이 삭제되어 다시 Human의 공통값이 보입니다.",
              result: "속성 삭제가 클래스 속성을 지우는 것이 아니라 fallback 경로를 다시 드러냅니다.",
            },
          ],
          sourceRefs: ["py-class-basic", "py-day06-class-note"],
        },
      ],
      diagnostics: [
        {
          symptom: "클래스 속성을 바꿨는데 특정 인스턴스만 이전 또는 다른 값을 계속 본다.",
          likelyCause: "그 인스턴스에 같은 이름의 속성이 만들어져 클래스 속성을 shadowing합니다.",
          checks: [
            "vars(instance) 또는 instance.__dict__에 해당 이름이 있는지 확인합니다.",
            "Class.attr과 instance.attr을 나란히 출력합니다.",
            "대입이 Class.attr인지 instance.attr인지 검색합니다.",
          ],
          fix: "공통 정책은 클래스 이름으로 갱신하고, 실수로 만든 인스턴스 shadow 속성은 설계 검토 후 제거합니다.",
          prevention: "공유 설정과 개별 상태의 이름·갱신 API를 분리하고 직접 속성 대입보다 명시적 메서드를 사용합니다.",
        },
      ],
    },
    {
      id: "bound-method-self",
      title: "instance.method()는 함수를 bound method로 묶어 self를 전달합니다",
      lead: "메서드 정의의 self를 호출자가 직접 쓰지 않는 이유는 인스턴스에서 함수를 조회할 때 대상 객체가 함께 결합되기 때문입니다.",
      explanations: [
        "Calc.add는 클래스에서 조회한 함수이고 calc.add는 calc 인스턴스에 바인딩된 메서드입니다. calc.add(10, 3)을 호출하면 Python이 개념적으로 Calc.add(calc, 10, 3)처럼 calc를 첫 인수 self로 전달합니다. 그래서 호출문에는 2개 숫자만 보이지만 정의에는 self를 포함한 3개 매개변수가 있습니다.",
        "self를 정의에서 생략하면 calc.add(10,3)의 첫 숫자 10이 첫 매개변수로 들어가거나 인수 개수 TypeError가 납니다. self는 예약어가 아니지만 다른 이름을 쓰면 독자와 IDE가 혼란스러우므로 관례를 지킵니다.",
        "원본 Calc는 add, sub, mul, div가 인스턴스 상태를 전혀 사용하지 않습니다. 객체 생성 교육에는 유용하지만 제품 설계에서는 모듈 함수나 staticmethod가 더 솔직할 수 있습니다. 반대로 계산 이력, precision 정책, 통화 같은 상태가 생기면 Calc 인스턴스가 그 책임을 묶는 이유가 생깁니다.",
        "클래스를 쓴다는 사실만으로 객체지향 설계가 좋아지는 것은 아닙니다. 데이터와 동작이 함께 변하며 invariant를 지킬 필요가 있는지, 여러 인스턴스가 서로 다른 상태를 가져야 하는지 먼저 질문합니다.",
      ],
      concepts: [
        {
          term: "bound method",
          definition: "클래스의 함수와 특정 인스턴스가 결합되어 호출 시 그 인스턴스를 첫 인수로 자동 전달하는 객체입니다.",
          detail: [
            "calc.add는 bound method이고 Calc.add는 함수로 관찰할 수 있습니다.",
            "같은 메서드를 다른 인스턴스에서 조회하면 서로 다른 self가 결합됩니다.",
          ],
        },
        {
          term: "인스턴스 메서드",
          definition: "첫 매개변수 self로 호출 대상 인스턴스의 상태와 동작에 접근하는 메서드입니다.",
          detail: [
            "객체별 상태를 읽거나 변경할 때 사용합니다.",
            "상태를 전혀 쓰지 않는 유틸리티는 모듈 함수·staticmethod와 비교합니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "TypeError: method() takes 2 positional arguments but 3 were given처럼 예상보다 인수가 하나 많다고 나온다.",
          likelyCause: "인스턴스 메서드 정의에서 self를 빠뜨렸는데 bound method 호출이 인스턴스를 자동 전달했습니다.",
          checks: [
            "메서드 정의의 첫 매개변수가 self인지 확인합니다.",
            "Class.method와 instance.method의 repr을 비교합니다.",
            "Class.method(instance, ...) 직접 호출로 실제 인수 대응을 확인합니다.",
          ],
          fix: "인스턴스 메서드 첫 매개변수에 self를 추가하고 내부 상태 접근도 self.attribute로 바꿉니다.",
          prevention: "메서드 시그니처 린터와 최소 인스턴스 호출 테스트를 사용합니다.",
        },
      ],
      comparisons: [
        {
          title: "상태 없는 계산 동작을 어디에 둘까요?",
          options: [
            {
              name: "모듈 함수",
              chooseWhen: "입력만으로 결과가 정해지고 공유·인스턴스 상태가 전혀 없을 때",
              avoidWhen: "여러 연산이 공통 정책·이력·자원을 함께 유지해야 할 때",
              tradeoffs: ["호출과 테스트가 단순합니다.", "관련 함수가 많아지면 namespace 설계가 필요합니다.", "불필요한 객체 생성을 피합니다."],
            },
            {
              name: "인스턴스 클래스",
              chooseWhen: "객체마다 다른 상태·정책·의존성을 유지하며 메서드가 그 invariant를 지킬 때",
              avoidWhen: "모든 메서드가 self를 전혀 사용하지 않는 단순 유틸리티일 때",
              tradeoffs: ["데이터와 동작을 함께 캡슐화합니다.", "잘못 쓰면 Java식 namespace 용도의 빈 객체가 됩니다.", "테스트에서 상태 생명주기를 관리해야 합니다."],
            },
          ],
        },
      ],
    },
    {
      id: "mutable-class-attribute-trap",
      title: "가변 클래스 속성은 모든 인스턴스가 같은 객체를 공유합니다",
      lead: "클래스 속성이 list·dict·set처럼 변경 가능한 객체라면 한 인스턴스의 append가 다른 인스턴스에서도 보이는 대표적인 상태 누출이 생깁니다.",
      explanations: [
        "items = []를 클래스 본문에 두면 빈 리스트가 클래스 정의 시 한 번 만들어집니다. a.items와 b.items가 인스턴스에서 별도 속성을 찾지 못하면 같은 Class.items 리스트를 반환합니다. a.items.append('책')은 속성 이름을 새로 대입하지 않고 공유 리스트 자체를 변경하므로 b.items에서도 책이 보입니다.",
        "a.items = ['책']처럼 대입하면 a에 새 인스턴스 속성이 생겨 shadowing할 수 있지만, 이 방식은 append와 대입이 전혀 다른 공유 의미를 가져 혼란을 키웁니다. 객체별 컬렉션이라면 __init__에서 self.items = []를 실행해 인스턴스마다 새 리스트를 만드는 것이 정답입니다.",
        "함수의 가변 기본값 함정과 원인은 비슷합니다. 코드가 정의될 때 한 번 만들어진 mutable 객체를 여러 호출·인스턴스가 공유합니다. dataclass에서도 items: list = []는 금지되고 field(default_factory=list)로 매 인스턴스 새 리스트를 만듭니다.",
      ],
      concepts: [
        {
          term: "가변 클래스 속성",
          definition: "클래스 객체에 저장된 list·dict·set 등 변경 가능한 공유 객체입니다.",
          detail: [
            "모든 인스턴스가 의도적으로 공유하는 registry·cache에는 쓸 수 있습니다.",
            "객체별 컬렉션에는 거의 항상 __init__ 인스턴스 속성이 필요합니다.",
          ],
          caveat: "공유가 의도된 경우에도 동시성, 초기화, 테스트 격리, 메모리 수명 정책이 필요합니다.",
        },
      ],
      codeExamples: [
        {
          id: "mutable-class-state-bug",
          title: "공유 리스트 실패와 인스턴스별 리스트 수정 비교",
          language: "python",
          filename: "shared_state.py",
          purpose: "클래스 본문 리스트를 공유하는 실패와 __init__에서 새 리스트를 만드는 수정안을 같은 출력으로 비교합니다.",
          code: "class BrokenCart:\n    items = []\n\n    def add(self, item):\n        self.items.append(item)\n\nfirst = BrokenCart()\nsecond = BrokenCart()\nfirst.add('Python 책')\nprint(first.items)\nprint(second.items)\nprint(first.items is second.items)\n\nclass Cart:\n    def __init__(self):\n        self.items = []\n\n    def add(self, item):\n        self.items.append(item)\n\nthird = Cart()\nfourth = Cart()\nthird.add('Python 책')\nprint(third.items)\nprint(fourth.items)\nprint(third.items is fourth.items)",
          walkthrough: [
            {
              lines: "1-5",
              explanation: "BrokenCart.items 리스트는 클래스 정의 때 한 번 만들어지고 add는 self를 통해 조회한 그 공유 리스트를 변경합니다.",
            },
            {
              lines: "7-12",
              explanation: "두 인스턴스 중 first만 add했지만 second도 같은 리스트를 보고 is 비교가 True입니다.",
            },
            {
              lines: "14-19",
              explanation: "수정한 Cart는 호출마다 __init__에서 새 리스트 객체를 self.items에 저장합니다.",
            },
            {
              lines: "21-26",
              explanation: "third 변경은 fourth에 나타나지 않고 is 비교도 False여서 상태가 격리됐음을 증명합니다.",
            },
          ],
          run: {
            environment: ["Python 3.11 이상", "UTF-8로 저장한 shared_state.py", "외부 패키지 없음"],
            command: "python shared_state.py",
          },
          output: {
            value: "['Python 책']\n['Python 책']\nTrue\n['Python 책']\n[]\nFalse",
            explanation: [
              "BrokenCart 두 출력이 같은 이유는 인스턴스가 아니라 클래스에 저장된 동일 리스트를 조회하기 때문입니다.",
              "수정한 Cart는 각 __init__ 호출이 새 리스트를 만들어 fourth가 빈 상태를 유지합니다.",
              "is 비교는 값 동등성이 아니라 실제 같은 리스트 객체인지 확인합니다.",
            ],
          },
          experiments: [
            {
              change: "BrokenCart에서 first.items = []를 먼저 실행한 뒤 add합니다.",
              prediction: "first에만 새 리스트가 shadowing되어 second는 클래스의 기존 공유 리스트를 봅니다.",
              result: "대입과 append의 속성 동작 차이가 상태를 더 예측하기 어렵게 만듭니다.",
            },
            {
              change: "Cart의 self.items = []를 self.items = DEFAULT_ITEMS로 바꾸고 DEFAULT_ITEMS가 공유 리스트라면?",
              prediction: "저장 위치는 인스턴스여도 두 속성이 같은 리스트 객체를 가리켜 다시 공유 버그가 생깁니다.",
              result: "인스턴스 속성이라는 사실보다 매번 새 mutable 객체를 만드는지가 핵심입니다.",
            },
          ],
          sourceRefs: ["py-day06-class-note", "python-dataclass-reference"],
        },
      ],
      diagnostics: [
        {
          symptom: "한 객체에서 목록에 값을 추가했는데 새로 만든 다른 객체에도 같은 값이 보인다.",
          likelyCause: "가변 컨테이너를 클래스 속성으로 한 번 만들었거나 여러 인스턴스 속성이 같은 외부 리스트를 참조합니다.",
          checks: [
            "first.items is second.items를 확인합니다.",
            "vars(first), vars(second), Class.__dict__에서 속성 저장 위치를 확인합니다.",
            "__init__이 호출마다 새 리스트를 만드는지 봅니다.",
          ],
          fix: "객체별 상태는 __init__에서 self.items = []로 만들고 외부 리스트를 받을 때 공유·복사 정책을 명시합니다.",
          prevention: "두 인스턴스를 만든 뒤 한쪽만 변경하는 격리 테스트를 반드시 둡니다.",
        },
      ],
    },
    {
      id: "invariants-and-construction-errors",
      title: "유효하지 않은 객체는 생성 단계에서 거부합니다",
      lead: "객체의 모든 공개 메서드가 의존하는 규칙은 __init__에서 한 번 검증해 불완전한 상태가 시스템 안으로 퍼지지 않게 합니다.",
      explanations: [
        "invariant는 객체가 정상적으로 존재하는 동안 항상 참이어야 하는 규칙입니다. 나이는 0 이상, 계좌 잔액은 음수 불가, 이메일은 빈 문자열 불가처럼 도메인에서 정합니다. __init__에서 검증한 뒤 속성을 저장하면 이후 메서드는 기본 상태를 신뢰할 수 있습니다.",
        "검증 순서는 부수 효과보다 먼저 둡니다. DB 등록이나 로그 발송 후 나이 오류를 발견하면 절반만 생성된 외부 상태가 남습니다. 입력을 지역값으로 검증하고 모든 조건이 통과한 뒤 self 속성과 외부 자원을 갱신합니다.",
        "__init__에서 ValueError가 발생하면 호출자는 정상 인스턴스를 받지 못합니다. 예외 메시지에는 어떤 규칙이 깨졌는지 넣되 비밀번호·전체 개인정보를 포함하지 않습니다. 타입 자체가 잘못된 경우 TypeError, 값 범위가 잘못된 경우 ValueError처럼 오류 분류를 일관되게 정합니다.",
        "속성을 공개 대입으로 언제든 바꿀 수 있다면 생성 시 invariant만으로 충분하지 않습니다. 나중에는 property, 불변 dataclass, 명령 메서드로 변경 경로를 통제할 수 있습니다. 이 세션에서는 생성 경계의 최소 검증을 먼저 익힙니다.",
      ],
      concepts: [
        {
          term: "invariant",
          definition: "객체가 유효한 생명주기 동안 항상 유지해야 하는 상태 규칙입니다.",
          detail: [
            "생성 시 검증하고 모든 상태 변경 메서드에서도 보존합니다.",
            "문서·코드·테스트가 같은 규칙을 표현해야 합니다.",
          ],
        },
        {
          term: "fail fast",
          definition: "잘못된 상태를 발견한 가장 가까운 경계에서 즉시 명확한 오류로 거부하는 설계입니다.",
          detail: [
            "오류가 먼 곳의 AttributeError나 계산 오류로 변형되는 것을 막습니다.",
            "오류 메시지는 원인과 필드 의미를 제공하되 민감값을 노출하지 않습니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "객체 생성은 성공하지만 메서드를 호출할 때 AttributeError 또는 이상한 계산 결과가 난다.",
          likelyCause: "__init__에서 필수 속성을 빠뜨렸거나 유효하지 않은 값을 검증 없이 저장했습니다.",
          checks: [
            "모든 메서드가 사용하는 self 속성을 목록화하고 __init__의 모든 성공 경로에서 설정되는지 확인합니다.",
            "vars(instance)와 예상 schema를 비교합니다.",
            "0·빈 문자열·음수·None 경계 생성 테스트를 실행합니다.",
          ],
          fix: "필수 속성을 원자적으로 초기화하고 도메인 invariant를 위반하면 생성 시 명시적 예외를 발생시킵니다.",
          prevention: "정상 최소값·경계값·잘못된 값별 생성 테스트와 타입 검사를 둡니다.",
        },
      ],
      expertNotes: [
        "다중 스레드나 비동기 환경에서 객체가 생성 중인 self 참조를 전역 registry에 먼저 공개하지 마세요. 초기화가 완료되기 전에 다른 코드가 관찰하는 this escape 문제를 만들 수 있습니다.",
      ],
    },
    {
      id: "dataclass-and-composition",
      title: "데이터 중심 객체는 dataclass로 줄이고 has-a 관계는 composition으로 표현합니다",
      lead: "반복적인 __init__·repr·동등성 코드를 줄이는 dataclass도 invariant와 관계 설계를 대신하지는 않습니다.",
      explanations: [
        "@dataclass는 타입 힌트가 있는 필드를 바탕으로 __init__, __repr__, __eq__ 등을 생성해 데이터 중심 객체의 보일러플레이트를 줄입니다. 일반 클래스보다 무조건 좋은 것이 아니라 동작보다 구조화된 데이터와 값 비교가 중심일 때 적합합니다.",
        "검증은 __post_init__에서 수행할 수 있습니다. frozen=True는 일반 속성 대입을 막아 값 객체에 유용하지만 내부 mutable 객체까지 자동 불변으로 만들지는 않습니다. list 필드는 field(default_factory=list)로 인스턴스마다 새 값을 만듭니다.",
        "Address가 Person의 한 부분이라면 Person이 Address를 가진다는 has-a composition이 자연스럽습니다. Person이 Address의 한 종류라는 is-a 관계가 아니므로 상속하면 의미가 틀립니다. composition은 작은 객체의 invariant를 재사용하고 각각 독립 테스트하게 합니다.",
        "상속은 대체 가능성, 즉 자식이 부모가 기대되는 곳에서 같은 계약을 지킬 때 사용합니다. 코드 재사용만을 위해 무조건 상속하지 않습니다. 이 세션에서는 composition 경계까지만 다루고 상속·super는 후속 원자 세션에서 상세히 다룹니다.",
      ],
      concepts: [
        {
          term: "dataclass",
          definition: "선언한 필드를 바탕으로 초기화·표현·동등성 같은 메서드를 생성하는 표준 라이브러리 도구입니다.",
          detail: [
            "__post_init__에서 생성 후 invariant를 검증할 수 있습니다.",
            "가변 기본 필드는 field(default_factory=...)를 사용합니다.",
          ],
          caveat: "자동 생성 코드가 도메인 행동·캡슐화·validation 설계를 대신하지 않습니다.",
        },
        {
          term: "composition",
          definition: "한 객체가 책임을 나눈 다른 객체를 속성으로 가지며 협력하는 has-a 설계입니다.",
          detail: [
            "Person has an Address처럼 부분·협력 관계를 표현합니다.",
            "상속보다 결합을 명시하고 구성 요소를 교체·테스트하기 쉽습니다.",
          ],
        },
      ],
      codeExamples: [
        {
          id: "dataclass-invariant-composition",
          title: "Address를 구성하고 나이 invariant를 지키는 dataclass",
          language: "python",
          filename: "person_dataclass.py",
          purpose: "일반 Human 원본을 데이터 중심 모델로 발전시켜 dataclass 자동 메서드, __post_init__ 검증, Address composition을 확인합니다.",
          code: "from dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass Address:\n    city: str\n    district: str\n\n@dataclass\nclass Person:\n    name: str\n    age: int\n    address: Address\n\n    def __post_init__(self):\n        if not self.name.strip():\n            raise ValueError('이름은 비어 있을 수 없습니다.')\n        if self.age < 0:\n            raise ValueError('나이는 0 이상이어야 합니다.')\n\naddress = Address('서울', '종로')\nperson = Person('김두한', 17, address)\nprint(person)\nprint(person.address.city)\n\ntry:\n    Person('둘리', -1, address)\nexcept ValueError as error:\n    print(f'생성 실패: {error}')",
          walkthrough: [
            {
              lines: "1-6",
              explanation: "frozen Address는 도시·구역을 묶은 값 객체이며 dataclass가 init/repr/eq를 생성합니다.",
            },
            {
              lines: "8-12",
              explanation: "Person은 name, age와 Address 객체를 필드로 가져 has-a composition을 표현합니다.",
            },
            {
              lines: "14-18",
              explanation: "__post_init__은 자동 __init__이 필드를 대입한 직후 호출되어 이름과 나이 invariant를 검증합니다.",
            },
            {
              lines: "20-23",
              explanation: "정상 객체의 자동 repr과 구성된 Address의 city를 출력합니다.",
            },
            {
              lines: "25-28",
              explanation: "음수 나이는 ValueError로 거부되고 호출자에게 정상 Person 인스턴스가 반환되지 않습니다.",
            },
          ],
          run: {
            environment: ["Python 3.11 이상", "UTF-8로 저장한 person_dataclass.py", "표준 라이브러리 dataclasses 사용"],
            command: "python person_dataclass.py",
          },
          output: {
            value: "Person(name='김두한', age=17, address=Address(city='서울', district='종로'))\n서울\n생성 실패: 나이는 0 이상이어야 합니다.",
            explanation: [
              "자동 repr가 중첩된 Address까지 구조적으로 보여 줍니다.",
              "Person은 Address를 상속하지 않고 속성으로 구성해 city를 위임받습니다.",
              "음수 입력은 유효하지 않은 객체로 퍼지기 전에 생성 경계에서 거부됩니다.",
            ],
          },
          experiments: [
            {
              change: "address.city = '부산'을 실행합니다.",
              prediction: "Address가 frozen dataclass라 FrozenInstanceError가 발생합니다.",
              result: "값 객체의 직접 속성 재대입을 막지만 내부 필드가 mutable이면 별도 보호가 필요합니다.",
            },
            {
              change: "Person에 tags: list[str] = []를 직접 추가합니다.",
              prediction: "dataclass가 mutable default를 감지해 ValueError로 거부합니다.",
              result: "field(default_factory=list)를 사용해야 각 인스턴스에 새 리스트가 생성됩니다.",
            },
          ],
          sourceRefs: ["py-class-basic", "py-day06-class-note", "python-dataclass-reference"],
        },
      ],
      diagnostics: [
        {
          symptom: "dataclass 필드에 list 기본값을 넣자 mutable default ... is not allowed 오류가 난다.",
          likelyCause: "모든 인스턴스가 같은 리스트를 공유하는 함정을 막기 위해 dataclass가 직접 mutable 기본값을 거부합니다.",
          checks: [
            "필드 기본값이 list·dict·set 인스턴스인지 확인합니다.",
            "공유가 정말 의도인지 객체별 상태인지 결정합니다.",
          ],
          fix: "객체별 상태라면 from dataclasses import field 후 field(default_factory=list)를 사용합니다.",
          prevention: "두 인스턴스 상태 격리 테스트와 mutable default 린트를 사용합니다.",
        },
      ],
      comparisons: [
        {
          title: "일반 클래스·dataclass·composition 중 무엇을 선택할까요?",
          options: [
            {
              name: "일반 클래스",
              chooseWhen: "행동·캡슐화·생명주기와 사용자 정의 초기화가 핵심일 때",
              avoidWhen: "단순 데이터 보관 때문에 init/repr/eq만 반복 작성할 때",
              tradeoffs: ["모든 동작을 명시적으로 제어합니다.", "보일러플레이트가 늘 수 있습니다.", "복잡한 invariant와 자원 관리에 적합합니다."],
            },
            {
              name: "dataclass",
              chooseWhen: "명시적 필드와 값 표현·비교가 중심인 데이터 객체일 때",
              avoidWhen: "필드보다 행동·동적 속성·복잡한 생성 프로토콜이 핵심일 때",
              tradeoffs: ["자동 init/repr/eq로 간결합니다.", "__post_init__과 field 정책을 알아야 합니다.", "무조건 불변·검증되는 것은 아닙니다."],
            },
            {
              name: "composition",
              chooseWhen: "객체가 다른 책임 객체를 가지고 협력하는 has-a 관계일 때",
              avoidWhen: "정말 같은 계약의 is-a 대체 관계를 표현해야 할 때",
              tradeoffs: ["책임을 작은 단위로 나누고 교체·테스트하기 쉽습니다.", "위임 코드가 늘 수 있습니다.", "상속 계층의 강한 결합을 피합니다."],
            },
          ],
        },
      ],
    },
    {
      id: "object-design-review",
      title: "객체는 상태와 동작의 경계를 지킬 때 가치가 있습니다",
      lead: "class 키워드를 썼다는 이유보다 어떤 상태를 누가 소유하고 어떤 메서드가 invariant를 보존하는지가 설계 품질을 결정합니다.",
      explanations: [
        "좋은 객체는 생성 직후 사용할 수 있고 모든 공개 메서드가 invariant를 유지합니다. 필수 속성을 나중에 외부 코드가 하나씩 대입해야 한다면 그 사이 불완전 상태가 존재합니다. __init__ 또는 명시적 factory가 완전한 상태를 만들게 하세요.",
        "속성을 모두 공개하고 외부가 자유롭게 바꾸게 하면 클래스가 단순 dict보다 나은 점이 줄어듭니다. 그렇다고 getter/setter를 기계적으로 만들 필요는 없습니다. 변경에 규칙이 있을 때 메서드나 property로 그 규칙을 한곳에 둡니다.",
        "클래스 수준 공유 상태는 테스트 격리를 어렵게 합니다. 테스트 하나가 registry나 cache를 바꾸면 다음 테스트가 영향을 받습니다. 공유가 의도됐다면 reset·dependency injection·동시성 정책을 설계하고, 의도되지 않았다면 인스턴스로 이동합니다.",
        "코드 리뷰 체크리스트는 간단합니다. 이 데이터는 인스턴스별인가 공통인가, 모든 생성 경로가 필수 속성을 설정하는가, self를 실제 사용하는가, mutable 객체가 공유되는가, 잘못된 값이 생성 단계에서 거부되는가, 상속보다 composition이 자연스러운가를 확인합니다.",
      ],
      concepts: [
        {
          term: "캡슐화",
          definition: "상태와 그 상태를 유효하게 다루는 동작을 하나의 경계에 모으고 내부 표현의 변경 영향을 제한하는 설계입니다.",
          detail: [
            "private 표기 자체보다 invariant를 지키는 공개 API가 핵심입니다.",
            "Python의 underscore 관례와 property는 의도를 전달하지만 보안 경계는 아닙니다.",
          ],
        },
        {
          term: "책임",
          definition: "객체가 알고 수행하며 상태를 보존해야 하는 한 묶음의 이유입니다.",
          detail: [
            "서로 다른 변경 이유가 많아지면 작은 협력 객체로 분리합니다.",
            "상태 없는 utility namespace만 만들기보다 모듈 함수를 검토합니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: [
        "객체 repr에 이메일·토큰·비밀번호 같은 민감값을 자동 포함하지 마세요. dataclass field(repr=False) 또는 안전한 사용자 정의 repr로 로그 노출을 제한합니다.",
        "객체를 캐시·직렬화할 때 클래스 버전과 invariant 변경을 고려합니다. 오래된 데이터를 __init__ 검증 없이 __dict__에 복원하면 잘못된 상태가 들어올 수 있습니다.",
      ],
    },
  ],
  lab: {
    title: "학습 계정과 진행 기록 객체 설계",
    scenario: "학습자 계정이 이름·이메일·누적 학습 분을 유효하게 유지하고, 여러 계정이 서로 기록을 공유하지 않도록 객체 모델을 만듭니다.",
    setup: [
      "learning_account.py를 만들고 Python 3.11 이상을 사용합니다.",
      "합성 이름과 example.com 이메일만 사용합니다.",
      "일반 클래스 버전을 먼저 만들고 이후 dataclass 값 객체를 조합합니다.",
    ],
    steps: [
      "EmailAddress frozen dataclass를 만들고 빈 문자열과 @ 누락을 __post_init__에서 거부합니다.",
      "LearningAccount 클래스 __init__에서 name, EmailAddress, initial_minutes를 받고 이름 공백과 음수 시간을 거부합니다.",
      "sessions 리스트를 반드시 self.sessions = []로 만들어 계정마다 분리합니다.",
      "add_session(minutes, topic) 메서드가 양수 시간과 빈 주제를 검증한 뒤 기록을 추가하고 total_minutes를 갱신하게 합니다.",
      "summary 메서드는 현재 객체 상태를 반환하되 이메일 전체는 로그용 문자열에서 마스킹합니다.",
      "두 계정을 만들어 한쪽에만 세션을 추가하고 리스트 is 비교와 양쪽 요약을 확인합니다.",
      "클래스 속성 provider = 'notetester'를 두고 한 인스턴스 shadowing과 클래스 갱신 차이를 실험합니다.",
      "음수 초기값, 빈 이름, 잘못된 이메일, 0분 세션, 빈 주제 생성·메서드 오류를 각각 테스트합니다.",
      "같은 기능을 모두 dataclass로 만들 때 자동 eq/repr가 계정 identity에 적절한지 비교합니다.",
      "저장소·메일 발송 책임을 계정 상속으로 넣지 않고 별도 collaborator composition으로 둘 이유를 설계 문서에 적습니다.",
    ],
    expectedResult: [
      "각 계정은 독립 sessions 리스트와 누적 시간을 유지합니다.",
      "잘못된 초기 상태는 객체 사용 전에 명시적 ValueError로 거부됩니다.",
      "EmailAddress composition이 이메일 검증 책임을 재사용합니다.",
      "공유 클래스 속성, 인스턴스 shadow 속성, 개별 상태의 차이가 출력으로 확인됩니다.",
      "민감정보를 과도하게 repr·로그에 노출하지 않는 정책이 포함됩니다.",
    ],
    cleanup: ["합성 데이터만 사용하며 실행 로그에 실제 이메일·토큰을 남기지 않습니다."],
    extensions: [
      "sessions 기록을 frozen dataclass Session으로 분리해 composition을 한 단계 확장합니다.",
      "읽기 전용 total_minutes property와 검증된 변경 메서드로 invariant 경계를 강화합니다.",
      "저장소 interface를 주입해 메모리 저장과 파일 저장을 교체 가능한 구조로 만듭니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "원본 Human2 형태의 Student 클래스를 만들고 두 인스턴스 상태를 비교하세요.",
      requirements: [
        "name, age, course를 __init__에서 self 속성으로 만듭니다.",
        "school 클래스 속성을 하나 둡니다.",
        "두 인스턴스의 서로 다른 상태와 같은 school을 출력합니다.",
        "한 인스턴스에만 school을 대입해 shadowing을 확인합니다.",
        "vars(instance)와 Class.school을 나란히 기록합니다.",
      ],
      hints: ["클래스 속성은 메서드 밖, 인스턴스 속성은 self에 저장합니다.", "인스턴스 대입은 클래스 속성을 수정하지 않을 수 있습니다."],
      expectedOutcome: "클래스·인스턴스 저장 위치와 속성 fallback을 실제 출력으로 설명합니다.",
      solutionOutline: ["class와 __init__을 정의합니다.", "두 객체를 만듭니다.", "공통·개별 속성을 출력하고 shadowing 전후를 비교합니다."],
    },
    {
      difficulty: "응용",
      prompt: "가변 클래스 속성으로 깨지는 TodoList와 수정 버전을 구현하세요.",
      requirements: [
        "실패 버전은 tasks=[]를 클래스 속성으로 둡니다.",
        "두 인스턴스 중 하나만 변경한 뒤 다른 쪽에 값이 보이는 결과를 기록합니다.",
        "수정 버전은 __init__에서 새 리스트를 만듭니다.",
        "is 비교와 두 인스턴스 격리 테스트를 추가합니다.",
        "외부 리스트를 생성자 인수로 받을 때 복사·공유 정책을 설명합니다.",
      ],
      hints: ["append는 속성 재대입이 아니라 리스트 객체 변경입니다.", "list(initial_tasks)로 얕은 복사를 만들 수 있지만 중첩 mutable은 별도 정책이 필요합니다."],
      expectedOutcome: "공유 mutable 상태의 원인과 인스턴스별 초기화 해결법을 재현 가능한 테스트로 남깁니다.",
    },
    {
      difficulty: "설계",
      prompt: "주문·금액·할인 정책을 composition으로 설계하세요.",
      requirements: [
        "Money frozen dataclass에 음수·통화 invariant를 둡니다.",
        "Order가 항목 목록과 DiscountPolicy 객체를 갖게 합니다.",
        "정책을 Order 상속 계층으로 만들지 않고 collaborator로 주입하는 이유를 설명합니다.",
        "가변 기본값과 민감 repr 노출을 방지합니다.",
        "정상·빈 주문·음수 가격·서로 다른 정책·두 주문 상태 격리 테스트를 작성합니다.",
        "상태 없는 계산을 모듈 함수로 둘지 policy 객체로 둘지 trade-off를 기록합니다.",
      ],
      hints: ["is-a와 has-a 문장으로 관계를 읽어 보세요.", "field(default_factory=list)와 일반 클래스 __init__ 새 리스트를 비교하세요."],
      expectedOutcome: "클래스 문법을 invariant·composition·테스트 가능한 의존성 설계로 확장합니다.",
    },
  ],
  reviewQuestions: [
    {
      question: "class 본문은 언제 실행되나요?",
      answer: "class 문 자체가 실행될 때 한 번 실행되어 이름 공간을 채우고 클래스 객체를 만듭니다. 인스턴스마다 본문 전체가 반복 실행되는 것은 아닙니다.",
    },
    {
      question: "__init__을 생성자라고 부를 때 정확히 보충해야 할 설명은 무엇인가요?",
      answer: "일상적으로 생성자라 부르지만 새 객체 자체는 __new__가 만들고 __init__은 그 인스턴스를 초기화합니다.",
    },
    {
      question: "self.name = name에서 두 name은 어떻게 다른가요?",
      answer: "오른쪽 name은 __init__의 지역 매개변수이고 왼쪽 self.name은 현재 인스턴스에 저장되어 객체 생명주기 동안 유지되는 속성입니다.",
    },
    {
      question: "dong.phone이 클래스 속성을 읽은 뒤 dong.phone='070'을 대입하면 다른 인스턴스도 바뀌나요?",
      answer: "일반적으로 dong에 인스턴스 속성이 생겨 클래스 속성을 shadowing합니다. 다른 인스턴스와 클래스값은 그대로입니다.",
    },
    {
      question: "instance.method(1,2) 호출에 self를 직접 쓰지 않는 이유는 무엇인가요?",
      answer: "인스턴스에서 메서드를 조회하면 그 인스턴스가 함수와 결합된 bound method가 되고 호출 시 self로 자동 전달되기 때문입니다.",
    },
    {
      question: "왜 items=[] 클래스 속성이 객체별 목록에 위험한가요?",
      answer: "클래스 정의 시 리스트 하나만 만들어 모든 인스턴스가 같은 객체를 조회하므로 한쪽 append가 다른 쪽에서도 보입니다.",
    },
    {
      question: "생성자 invariant를 언제 검사해야 하나요?",
      answer: "외부 부수 효과나 self 공개 전에 입력 지역값을 검증하고, 위반 시 객체가 정상 사용되기 전에 명시적 예외로 거부합니다.",
    },
    {
      question: "dataclass가 자동으로 해결하지 않는 것은 무엇인가요?",
      answer: "도메인 invariant, 캡슐화, composition 책임, mutable 내부 객체의 완전한 불변성, 민감정보 repr 정책은 직접 설계해야 합니다.",
    },
    {
      question: "Address와 Person 관계에 composition이 자연스러운 이유는 무엇인가요?",
      answer: "Person은 Address의 한 종류가 아니라 Address를 가진 has-a 관계이므로 속성으로 구성하는 것이 의미와 교체 가능성을 잘 표현합니다.",
    },
    {
      question: "Calc 메서드가 self를 전혀 사용하지 않는다면 무엇을 검토해야 하나요?",
      answer: "상태 없는 모듈 함수나 staticmethod가 더 솔직한지, 향후 객체별 정책·이력·의존성이 정말 필요한지 검토합니다.",
    },
  ],
  completionChecklist: [
    "class 문과 클래스 객체, 인스턴스 생성의 순서를 설명할 수 있다.",
    "__new__와 __init__ 역할을 입문 수준에서 정확히 구분할 수 있다.",
    "self 지역 매개변수와 self.attribute 인스턴스 상태를 구분할 수 있다.",
    "bound method가 self를 자동 전달하는 과정을 설명할 수 있다.",
    "클래스 속성 fallback과 인스턴스 shadowing을 재현할 수 있다.",
    "가변 클래스 속성의 공유 버그를 두 인스턴스 테스트로 찾을 수 있다.",
    "생성 시 invariant를 검증하고 적절한 예외를 발생시킬 수 있다.",
    "dataclass의 자동 기능과 default_factory 필요성을 설명할 수 있다.",
    "is-a와 has-a를 사용해 상속과 composition 경계를 선택할 수 있다.",
    "상태 없는 동작에 클래스가 필요한지 모듈 함수와 비교할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    {
      id: "py-class-basic",
      repository: "PYTHON-BASIC",
      path: "day06/ex01_class.py",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex01_class.py",
      usedFor: ["class 기본", "Human 인스턴스", "__init__", "self", "클래스·인스턴스 속성", "원본 출력"],
      evidence: "공개 main과 동일한 원본을 Python 3.13.9에서 실행해 Human.name, 둘리·김두한·희동이·길동이 인스턴스 출력과 두 객체의 공유 phone 값을 확인했습니다.",
    },
    {
      id: "py-class-calc",
      repository: "PYTHON-BASIC",
      path: "day06/ex02_class.py",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex02_class.py",
      usedFor: ["인스턴스 메서드", "self", "상태 없는 Calc 설계 비교", "입력 실행"],
      evidence: "10, 3, +, n 입력으로 원본을 실행해 result=13과 프로그램 종료를 확인했습니다. Calc 메서드가 self 상태를 사용하지 않는 점을 모듈 함수 비교에 활용했습니다.",
    },
    {
      id: "py-day06-class-note",
      repository: "PYTHON-BASIC",
      path: "notes/day06_class.md",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day06_class.md",
      usedFor: ["클래스·객체 정의", "변수 종류", "__init__·self", "메서드 종류", "셀프 체크"],
      evidence: "Day06 노트의 클래스 기본·변수 종류·생성자 절과 파일 매핑을 검토하고 정확한 __new__/__init__ 구분, lookup, mutable 공유, invariant를 보강했습니다.",
    },
    {
      id: "python-class-reference",
      repository: "Python 공식 문서",
      path: "tutorial/classes.html",
      publicUrl: "https://docs.python.org/3/tutorial/classes.html",
      usedFor: ["클래스 객체", "인스턴스 객체", "메서드·self", "클래스·인스턴스 변수"],
      evidence: "원본의 설계도 비유를 Python의 클래스·인스턴스 객체와 bound method 규약으로 정확히 보강했습니다.",
    },
    {
      id: "python-dataclass-reference",
      repository: "Python 공식 문서",
      path: "library/dataclasses.html",
      publicUrl: "https://docs.python.org/3/library/dataclasses.html",
      usedFor: ["dataclass 자동 메서드", "__post_init__", "frozen", "default_factory"],
      evidence: "원본에서 다루지 않은 데이터 중심 클래스와 mutable default 방지 범위를 공식 표준 라이브러리 문서로 보강했습니다.",
    },
  ],
  sourceCoverage: {
    filesRead: 5,
    filesUsed: 3,
    uncoveredNotes: [
      "이전 학습본의 ex01_class.py와 ex02_class.py를 canonical과 대조했으며 실행 본문이 동일해 중복 공개 출처로 사용하지 않았습니다.",
      "정적·클래스 메서드, import/main guard, 상속·super·다형성은 py-029 이후 별도 원자 세션 범위이므로 선택 기준만 언급하고 상세 문법은 확장하지 않았습니다.",
      "attribute descriptor 세부 우선순위, metaclass, __slots__는 원본과 이번 원자 범위를 넘어 후속 전문가 과정으로 남겼습니다.",
      "mutable 클래스 속성, invariant, dataclass, composition은 원본 공백을 공식 문서와 독립 실행 예제로 보강했습니다.",
      "로컬 드라이브 경로와 비공개 백업 URL은 공개 데이터에 넣지 않고 검증된 공개 저장소 링크와 일반화된 source audit 설명만 남겼습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const advancedObjectChapters: DetailedSession["chapters"] = [
  {
    id: "value-semantics-equality-hash-slots",
    title: "identity와 value equality를 분리하고 hash·immutability·slots 계약을 함께 설계합니다",
    lead: "두 인스턴스가 같은 값을 표현하는지와 같은 객체인지, dictionary key로 안전한지, 어떤 attribute layout을 허용하는지는 서로 연결되지만 별도 선택입니다.",
    explanations: [
      "`is`는 object identity, `==`는 `__eq__`가 정의하는 value relation입니다. 일반 domain value는 같은 field로 만든 두 객체가 `==`일 수 있지만 `is`는 False이고, singleton sentinel·None 검사에 identity를 사용합니다.",
      "`__eq__`에서 모르는 타입은 False를 즉시 반환하기보다 `NotImplemented`를 반환해 상대 타입의 reflected comparison 기회를 줍니다. equality는 reflexive·symmetric·transitive한 equivalence relation이 되도록 설계하고 mutable external state에 의존하지 않습니다.",
      "같다고 비교되는 객체는 같은 hash를 가져야 합니다. mutable field로 equality와 hash를 만들면 set/dict에 넣은 뒤 field 변경으로 bucket을 찾지 못할 수 있어 immutable value object로 만들거나 hash를 비활성화합니다.",
      "dataclass는 선언 field를 기준으로 repr·eq를 생성할 수 있고 frozen=True는 일반 field assignment를 막으며 hash 생성 정책에도 영향을 줍니다. frozen은 deep immutability가 아니어서 field 안 mutable list까지 얼리지 않으므로 immutable member 타입도 선택합니다.",
      "slots=True는 선언된 fields 중심의 slot layout을 만들어 보통 instance `__dict__`를 없애고 오타 attribute 생성을 막으며 메모리를 줄일 수 있습니다. weakref·multiple inheritance·serialization framework와 호환성을 검토하고 무조건 성능 최적화로 적용하지 않습니다.",
      "`__repr__`은 가능한 한 class와 핵심 상태를 명확히 보여 디버깅을 돕되 password·token·개인정보를 포함하지 않습니다. eval 가능한 표현은 목표일 수 있지만 resource handle·비밀·거대한 collection에서는 안전하고 bounded한 진단 표현이 우선입니다.",
      "constructor invariant는 equality/hash보다 먼저 성립해야 합니다. `__post_init__`에서 level 범위와 blank name을 거부하면 invalid object가 set·cache·다른 객체에 들어가기 전에 실패합니다.",
    ],
    concepts: [
      { term: "object identity", definition: "한 객체가 다른 참조와 정확히 같은 runtime object인지 나타내는 관계입니다.", detail: ["is로 비교합니다.", "value equality와 다릅니다."] },
      { term: "hash contract", definition: "동등한 객체는 같은 hash를 가져야 하고 key로 존재하는 동안 hash가 바뀌지 않아야 한다는 규약입니다.", detail: ["mutable equality state와 충돌합니다.", "dict·set correctness에 필요합니다."] },
      { term: "slot layout", definition: "instance가 가질 attribute 이름을 descriptor slot으로 선언하는 저장 구조입니다.", detail: ["일반 __dict__를 생략할 수 있습니다.", "상속·도구 호환성을 확인합니다."] },
    ],
    codeExamples: [{
      id: "python-frozen-slotted-value-object",
      title: "frozen slotted dataclass의 equality·identity·hash·mutation을 검증합니다",
      language: "python",
      filename: "course_key_value.py",
      purpose: "immutable key object에서 생성 invariant와 value semantics가 함께 작동하는지 exact output으로 확인합니다.",
      code: "from dataclasses import FrozenInstanceError, dataclass\n\n@dataclass(frozen=True, slots=True)\nclass CourseKey:\n    name: str\n    level: int\n\n    def __post_init__(self):\n        if not self.name.strip():\n            raise ValueError('name must not be blank')\n        if self.level < 1:\n            raise ValueError('level must be positive')\n\nfirst = CourseKey('Python', 1)\nsecond = CourseKey('Python', 1)\nprint(f'equal={first == second}|same={first is second}|hash_equal={hash(first) == hash(second)}')\nprint(f'repr={first!r}|has_dict={hasattr(first, \"__dict__\")}')\ntry:\n    first.level = 2\nexcept FrozenInstanceError as error:\n    print(f'mutation={type(error).__name__}')",
      walkthrough: [
        { lines: "1-6", explanation: "frozen·slots dataclass에 key를 구성하는 두 fields를 선언합니다." },
        { lines: "8-12", explanation: "__post_init__에서 blank name과 비양수 level을 거부해 instance invariant를 완성합니다." },
        { lines: "14-17", explanation: "같은 값을 가진 별도 객체의 equality·identity·hash와 generated repr·slot layout을 관찰합니다." },
        { lines: "18-21", explanation: "frozen field 변경이 전용 exception으로 차단되는지 stderr 없이 확인합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 라이브러리 dataclasses"], command: "python course_key_value.py" },
      output: { value: "equal=True|same=False|hash_equal=True\nrepr=CourseKey(name='Python', level=1)|has_dict=False\nmutation=FrozenInstanceError", explanation: ["값은 같지만 서로 다른 instance입니다.", "동등한 frozen values의 hash도 같습니다.", "slots=True라 일반 instance __dict__가 없습니다."] },
      experiments: [
        { change: "name을 blank로 생성합니다.", prediction: "__post_init__에서 ValueError가 납니다.", result: "invalid key가 collection에 들어가기 전에 실패합니다." },
        { change: "mutable list field를 frozen dataclass에 추가합니다.", prediction: "field 재할당은 막혀도 list 내부 변경은 가능합니다.", result: "frozen과 deep immutability를 구분합니다." },
        { change: "eq=False로 바꿉니다.", prediction: "generated value equality 대신 object identity 기반 기본 equality가 남습니다.", result: "domain 의미에 맞는 equality 정책을 선택합니다." },
      ],
      sourceRefs: ["python-object-identity-028", "python-eq-hash-028", "python-slots-028", "python-dataclass-options-028"],
    }],
    diagnostics: [
      { symptom: "set에 넣은 객체를 field 수정 뒤 찾을 수 없습니다.", likelyCause: "mutable field가 __eq__와 __hash__에 참여해 저장 뒤 hash가 바뀌었습니다.", checks: ["hash 전후를 비교합니다.", "equality에 참여하는 fields를 봅니다.", "dataclass frozen/unsafe_hash 설정을 확인합니다."], fix: "key object를 immutable value로 만들거나 mutable entity의 hash를 비활성화하고 stable identifier를 key로 사용합니다.", prevention: "mutation 시나리오와 equal-implies-same-hash property test를 둡니다." },
      { symptom: "slots 적용 뒤 framework가 attribute나 weak reference를 만들지 못합니다.", likelyCause: "framework가 __dict__·__weakref__ 또는 동적 fields를 기대합니다.", checks: ["instance에 __dict__와 __weakref__가 있는지 봅니다.", "base classes의 slots를 확인합니다.", "serializer/ORM 공식 지원을 확인합니다."], fix: "필요 slot을 포함하거나 해당 integration type에는 slots를 사용하지 않고 adapter를 둡니다.", prevention: "slots 도입 전 serialization·ORM·mock·inheritance 통합 테스트를 실행합니다." },
    ],
  },
  {
    id: "manual-value-object-composition-boundary",
    title: "작은 value object를 직접 구현하고 상속 대신 composition으로 invariant를 재사용합니다",
    lead: "Progress는 Percentage의 한 종류가 아니라 Percentage를 보유하므로 has-a 관계로 모델링하면 범위 검증과 표시 책임을 독립적으로 재사용할 수 있습니다.",
    explanations: [
      "composition은 한 객체가 다른 객체를 field로 보유해 기능과 invariant를 조립합니다. `Progress(Percentage)` 같은 상속은 Progress가 모든 Percentage 자리에서 대체 가능하다는 잘못된 is-a 주장을 만들 수 있습니다.",
      "Percentage constructor는 bool을 숫자로 우연히 허용할지, int·float·Decimal 중 무엇을 받을지, NaN을 어떻게 처리할지 정해야 합니다. 예제는 0~100 범위를 한 곳에서 검사하지만 production 금액·비율에는 Decimal과 정밀도 정책을 고려합니다.",
      "read-only property는 `_value` 저장 방식을 숨기고 외부가 invariant를 우회해 변경하지 못하게 합니다. Python의 underscore는 완전한 접근 통제가 아니므로 모든 public constructor·factory가 같은 검증을 사용하도록 설계합니다.",
      "수동 `__eq__`는 같은 semantic type만 비교하고 다른 타입에는 NotImplemented를 반환합니다. Percentage(75)와 raw int 75를 같다고 만들면 hash·산술·API 기대가 복잡해질 수 있어 explicit `.value` 변환을 사용합니다.",
      "Progress의 repr는 포함된 value object repr를 재사용해 구조를 보여 줍니다. 비밀이나 큰 payload가 포함된 composition에서는 각 component가 안전한 repr 정책을 제공해야 상위 객체도 안전합니다.",
      "composition은 dependency를 constructor로 전달해 test double을 주입할 수도 있습니다. 단순 data value는 실제 immutable object를 쓰고, clock·repository·transport처럼 side effect가 있는 collaborator에 Protocol과 fake를 사용합니다.",
      "객체 graph를 JSON·DB로 저장할 때 `__dict__` 전체를 직렬화하지 말고 public schema mapper를 둡니다. 내부 `_value`, cache와 향후 구현 변경을 wire contract에서 분리합니다.",
    ],
    concepts: [
      { term: "composition", definition: "객체가 다른 객체를 field로 포함해 책임과 동작을 조립하는 관계입니다.", detail: ["has-a 관계를 표현합니다.", "상속보다 결합을 명시적으로 제어합니다."] },
      { term: "value object", definition: "identity보다 검증된 값과 equality가 핵심인 작은 domain 객체입니다.", detail: ["보통 immutable하게 설계합니다.", "단위와 invariant를 함께 보존합니다."] },
      { term: "NotImplemented comparison", definition: "비교할 줄 모르는 상대 타입에서 Python의 다른 비교 경로를 허용하는 특별 반환값입니다.", detail: ["False와 다릅니다.", "NotImplementedError exception과 다릅니다."] },
    ],
    codeExamples: [{
      id: "python-manual-percentage-composition",
      title: "Percentage invariant를 Progress가 composition으로 사용합니다",
      language: "python",
      filename: "progress_composition.py",
      purpose: "수동 slots·property·repr·equality와 has-a object graph를 한 예제로 검증합니다.",
      code: "class Percentage:\n    __slots__ = ('_value',)\n\n    def __init__(self, value):\n        if isinstance(value, bool) or not isinstance(value, (int, float)):\n            raise TypeError('rate must be numeric')\n        if not 0 <= value <= 100:\n            raise ValueError('rate must be between 0 and 100')\n        self._value = float(value)\n\n    @property\n    def value(self):\n        return self._value\n\n    def __repr__(self):\n        return f'Percentage({self.value:.1f})'\n\n    def __eq__(self, other):\n        if not isinstance(other, Percentage):\n            return NotImplemented\n        return self.value == other.value\n\nclass Progress:\n    __slots__ = ('course', 'rate')\n\n    def __init__(self, course, rate):\n        self.course = course\n        self.rate = Percentage(rate)\n\n    def __repr__(self):\n        return f'Progress(course={self.course!r}, rate={self.rate!r})'\n\nprogress = Progress('Python', 75)\nsame_rate = Percentage(75)\nprint(progress)\nprint(f'value_equal={progress.rate == same_rate}|identity_equal={progress.rate is same_rate}')\ntry:\n    Progress('JSON', 120)\nexcept ValueError as error:\n    print(f'invalid={type(error).__name__}:{error}')",
      walkthrough: [
        { lines: "1-9", explanation: "Percentage가 slot과 constructor에서 타입·범위 invariant를 소유합니다." },
        { lines: "11-21", explanation: "read-only property, bounded repr와 same-type value equality를 구현합니다." },
        { lines: "23-31", explanation: "Progress는 Percentage를 상속하지 않고 포함하며 구조적인 repr를 제공합니다." },
        { lines: "33-40", explanation: "별도 value 객체 equality·identity와 잘못된 rate의 controlled failure를 출력합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 문법만 사용"], command: "python progress_composition.py" },
      output: { value: "Progress(course='Python', rate=Percentage(75.0))\nvalue_equal=True|identity_equal=False\ninvalid=ValueError:rate must be between 0 and 100", explanation: ["Progress와 Percentage는 has-a 관계입니다.", "두 Percentage는 값은 같지만 identity는 다릅니다.", "범위 밖 값은 object graph 생성 전에 거부됩니다."] },
      experiments: [
        { change: "rate=True를 전달합니다.", prediction: "bool은 int subclass지만 명시 검사로 TypeError가 납니다.", result: "숫자 타입의 숨은 subclass 경계를 확인합니다." },
        { change: "Percentage.__eq__에서 raw int도 허용합니다.", prediction: "편해 보이지만 symmetric comparison과 hash 설계가 더 복잡해집니다.", result: "explicit value extraction을 우선합니다." },
        { change: "Progress를 Percentage의 subclass로 바꿉니다.", prediction: "Progress가 숫자 비율이 필요한 모든 곳에 대체 가능하다는 잘못된 API가 생깁니다.", result: "is-a와 has-a 질문으로 설계를 검토합니다." },
      ],
      sourceRefs: ["python-object-repr-028", "python-eq-hash-028", "python-slots-028", "python-class-reference"],
    }],
    diagnostics: [
      { symptom: "Progress가 Percentage API 전체를 노출해 course 의미와 숫자 연산이 섞입니다.", likelyCause: "코드 재사용만 보고 has-a 관계를 상속으로 모델링했습니다.", checks: ["Progress가 Percentage가 필요한 모든 곳에 대체 가능한지 묻습니다.", "부모 public methods가 자식에 모두 유효한지 봅니다.", "composition field로 바꾼 API를 비교합니다."], fix: "Percentage를 field로 포함하고 Progress가 필요한 operations만 위임합니다.", prevention: "상속 결정에 semantic is-a·LSP checklist를 적용합니다." },
      { symptom: "repr 로그에 token이나 개인정보가 함께 노출됩니다.", likelyCause: "component의 __dict__ 또는 모든 fields를 자동 repr에 포함했습니다.", checks: ["generated/manual repr fields를 확인합니다.", "중첩 객체 repr를 추적합니다.", "로그 보존·접근 범위를 봅니다."], fix: "민감 field를 repr에서 제외·redact하고 bounded public fields만 표시합니다.", prevention: "secret marker가 repr·exception·structured log에 없는지 테스트합니다." },
    ],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...advancedObjectChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "python-object-identity-028", repository: "Python Language Reference", path: "Objects, values and types", publicUrl: "https://docs.python.org/3/reference/datamodel.html#objects-values-and-types", usedFor: ["identity", "type", "mutability", "object lifetime"], evidence: "Python object의 identity·type·value 기본 모델을 공식 언어 레퍼런스로 확인했습니다." },
  { id: "python-object-repr-028", repository: "Python Language Reference", path: "object.__repr__", publicUrl: "https://docs.python.org/3/reference/datamodel.html#object.__repr__", usedFor: ["developer representation", "repr fallback", "debugging contract"], evidence: "__repr__의 목적과 반환 타입 규약을 공식 문서로 확인했습니다." },
  { id: "python-eq-hash-028", repository: "Python Language Reference", path: "object.__eq__ and object.__hash__", publicUrl: "https://docs.python.org/3/reference/datamodel.html#object.__hash__", usedFor: ["equality", "NotImplemented", "hash invariant", "mutable keys"], evidence: "equality override와 hash 생성·비활성화 규칙을 공식 데이터 모델에서 확인했습니다." },
  { id: "python-slots-028", repository: "Python Language Reference", path: "object.__slots__", publicUrl: "https://docs.python.org/3/reference/datamodel.html#object.__slots__", usedFor: ["slot descriptors", "__dict__ omission", "inheritance constraints"], evidence: "__slots__가 instance layout과 attribute 생성에 미치는 영향을 공식 문서로 확인했습니다." },
  { id: "python-dataclass-options-028", repository: "Python Standard Library", path: "dataclasses.dataclass", publicUrl: "https://docs.python.org/3/library/dataclasses.html#dataclasses.dataclass", usedFor: ["generated eq/repr", "frozen", "unsafe_hash", "slots"], evidence: "dataclass의 eq·frozen·hash·slots option 상호작용을 공식 문서로 확인했습니다." },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "값이 같은 두 객체에서 `is`도 True여야 하나요?", answer: "아닙니다. is는 identity이고 ==는 value equality라 별도 객체가 값만 같을 수 있습니다." },
  { question: "__eq__가 모르는 타입에서 무엇을 반환하는 것이 좋은가요?", answer: "NotImplemented를 반환해 상대 타입의 비교 기회를 주며 NotImplementedError를 raise하는 것과 다릅니다." },
  { question: "frozen dataclass는 내부 list도 변경 불가능한가요?", answer: "아닙니다. field 재할당을 막지만 참조된 mutable 객체 내부까지 자동으로 얼리지 않습니다." },
  { question: "slots=True의 장점과 위험은 무엇인가요?", answer: "동적 attribute 오타와 메모리를 줄일 수 있지만 __dict__·weakref·상속·framework 호환성을 확인해야 합니다." },
  { question: "Progress가 Percentage를 상속하는 대신 포함해야 하는 이유는 무엇인가요?", answer: "Progress는 Percentage의 한 종류가 아니라 비율 값을 가진 객체라는 has-a 관계이기 때문입니다." },
);

(session.completionChecklist as string[]).push(
  "identity와 value equality를 is·==로 구분한다.",
  "equal objects의 hash invariant와 mutable key 위험을 설명한다.",
  "frozen·slots dataclass의 범위와 deep immutability 한계를 안다.",
  "안전하고 bounded한 repr에서 민감정보를 제외한다.",
  "상속 대신 composition으로 value object invariant를 재사용한다.",
);
