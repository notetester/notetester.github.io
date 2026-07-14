import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-029"],
  slug: "python-029-instance-class-static-methods",
  courseId: "python",
  moduleId: "03-oop-stdlib",
  order: 29,
  title: "인스턴스·클래스·정적 메서드",
  subtitle: "self·cls·아무 암시 인수도 없는 세 호출 계약을 구분하고, 상태의 소유자와 생성 책임에 맞는 메서드 또는 모듈 함수를 선택합니다.",
  level: "중급",
  estimatedMinutes: 130,
  coreQuestion: "어떤 동작을 특정 객체, 클래스 전체, 또는 상태 없는 일반 함수 중 어디에 두어야 호출 의미와 상속·테스트·동시성이 가장 명확해질까요?",
  summary: "인스턴스에서 method를 조회할 때 함수가 self와 결합되는 bound method 모델, classmethod가 실제 호출 class를 cls로 받는 대체 생성자 패턴, staticmethod가 자동 self·cls 없이 namespace만 제공하는 차이를 실행으로 확인합니다. 클래스 변수 공유, subclass 보존, descriptor 호출, 모듈 함수·property·factory와의 선택 기준, mutable class state와 동시성·테스트 격리까지 다룹니다.",
  objectives: [
    "instance.method 호출이 class function에 instance를 self로 결합한 bound method 호출임을 설명할 수 있다.",
    "인스턴스 상태를 읽고 바꾸는 동작을 instance method로 설계하고 class에서 직접 호출할 때 self 누락 오류를 진단할 수 있다.",
    "classmethod가 호출된 실제 class를 cls로 받아 class state와 polymorphic 대체 생성자를 구현하는 이유를 설명할 수 있다.",
    "staticmethod가 self·cls를 자동으로 받지 않으며 class namespace에 둔 일반 함수와 유사하다는 점을 사용할 수 있다.",
    "대체 생성자에는 classmethod, 상태 무관 helper에는 staticmethod와 module function 중 적합한 위치를 선택할 수 있다.",
    "class variable과 instance attribute의 lookup·가림·공유를 추적하고 mutable class state 함정을 피할 수 있다.",
    "공유 class state가 테스트·thread·process에서 만드는 결합을 줄이고 명시적 repository·dependency로 전환할 수 있다.",
  ],
  prerequisites: [
    { title: "클래스·객체·생성자", reason: "class object, instance, __init__, self와 attribute lookup을 바탕으로 method binding을 확장합니다.", sessionSlug: "python-028-class-object-constructor" },
    { title: "함수 계약·스코프·반환", reason: "세 method 종류를 암시 인수와 상태 소유자가 다른 함수 계약으로 분석합니다.", sessionSlug: "python-021-function-contract-scope-return" },
    { title: "기본값·*args·**kwargs", reason: "대체 생성자와 wrapper의 호출 signature·keyword-only 계약을 설계합니다.", sessionSlug: "python-022-default-args-varargs-kwargs" },
  ],
  keywords: ["Python", "instance method", "bound method", "self", "classmethod", "cls", "staticmethod", "alternative constructor", "class variable", "descriptor"],
  chapters: [
    {
      id: "method-binding-model",
      title: "instance에서 함수를 조회하면 self가 결합된 bound method가 만들어집니다",
      lead: "obj.method(arg)는 대체로 type(obj).method(obj, arg)와 같은 결합을 수행하므로 self는 특별 키워드가 아니라 첫 매개변수 관례입니다.",
      explanations: [
        "class Calc 안 def plus(self, a, b)는 class body가 실행될 때 function 객체로 Calc namespace에 저장됩니다. Calc.plus를 조회하면 아직 일반 function이고 Calc().plus를 조회하면 descriptor protocol이 instance를 결합한 bound method를 돌려줍니다. 이후 calc.plus(5,3)는 Python이 calc를 첫 인수로 자동 전달합니다.",
        "self라는 철자는 문법 예약어가 아니지만 생태계 전체의 강한 관례라 다른 이름을 쓰지 않습니다. 중요한 것은 self가 현재 instance를 가리킨다는 사실입니다. 같은 class의 두 instance가 같은 function implementation을 공유해도 self가 다르므로 서로 다른 attribute를 읽고 바꿀 수 있습니다.",
        "Calc.plus(5,3)처럼 instance 없이 호출하면 5가 self 자리에, 3이 a 자리에 들어가고 b가 누락되어 TypeError가 납니다. Calc.plus(calc,5,3)처럼 instance를 명시하면 실행되지만 일반 호출에서는 calc.plus(5,3)가 계약과 의도를 더 잘 드러냅니다.",
        "method를 callback으로 전달할 때 calc.plus는 이미 self가 결합됐으므로 두 숫자만 받습니다. Calc.plus는 세 인수를 요구합니다. functools.partial과 bound method를 섞을 때 signature를 확인하고 객체 수명이 callback에 의해 예상보다 오래 보존될 수 있음을 고려합니다.",
      ],
      concepts: [
        { term: "bound method", definition: "class의 function을 instance에서 조회해 그 instance가 첫 인수 self로 결합된 호출 가능 객체입니다.", detail: ["호출할 때 self를 다시 적지 않습니다.", "__self__와 __func__로 결합 대상과 원본 function을 관찰할 수 있습니다."] },
        { term: "descriptor binding", definition: "class attribute 조회 protocol이 function과 instance를 결합해 method 호출 의미를 만드는 동작입니다.", detail: ["instance method·classmethod·staticmethod가 서로 다른 descriptor를 사용합니다.", "attribute access가 단순 dict lookup만은 아님을 보여 줍니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "TypeError: ... missing 1 required positional argument: 'self'가 발생한다.", likelyCause: "instance method를 instance 생성 없이 class에서 호출하거나 decorator를 잘못 제거했습니다.", checks: ["호출 대상이 Class.method인지 instance.method인지 확인합니다.", "정의의 첫 매개변수와 decorator를 봅니다.", "method를 다른 변수에 저장하는 과정에서 bound 상태가 달라졌는지 확인합니다."], fix: "instance 상태가 필요하면 객체를 생성해 instance.method로 호출하고 상태가 필요 없으면 설계상 classmethod·staticmethod·module function 중 적합한 형태로 명시적으로 바꿉니다.", prevention: "method 종류와 호출 형태를 테스트하고 IDE·타입 검사의 signature 경고를 사용합니다." },
      ],
    },
    {
      id: "instance-methods",
      title: "인스턴스 메서드는 한 객체의 상태와 invariant를 다룹니다",
      lead: "self attribute를 읽거나 변경해 객체별 행동을 만들 때 instance method가 자연스럽습니다.",
      explanations: [
        "원본 Car의 forward·back·stop은 self를 받지만 현재 구현은 고정 문장만 출력합니다. 이후 속도·연료·상태를 읽고 바꾸는 behavior로 확장할 가능성이 있다면 Car instance method가 적절합니다. 반대로 숫자 두 개만 더하고 Calc 상태를 전혀 쓰지 않는 plus는 class가 실제 domain state를 갖는지 다시 생각할 수 있습니다.",
        "instance method는 객체의 invariant를 지키는 경계가 됩니다. account.withdraw(amount)는 잔액을 직접 외부에서 빼게 하는 대신 amount 양수·잔액 충분·통화 정책을 검사한 뒤 상태를 바꿉니다. self attribute를 public으로 무제한 수정하게 두면 method 계약을 우회할 수 있습니다.",
        "method가 새 객체를 반환할지 self를 변경할지 이름과 문서에 드러냅니다. list.sort는 제자리 변경하고 None을 반환하며 sorted는 새 list를 반환합니다. immutable value object는 with_discount처럼 새 instance를 반환하고 mutable entity는 rename처럼 명시된 상태 변경을 할 수 있습니다.",
        "instance method가 파일·DB·전역 설정까지 직접 읽으면 객체 상태 외 숨은 의존성이 늘어납니다. repository나 clock을 생성자에 주입하거나 method 인수로 받아 테스트 가능한 경계를 유지합니다.",
      ],
      concepts: [
        { term: "instance method", definition: "instance 조회 시 self가 자동 결합되고 해당 객체의 상태와 행동을 표현하는 일반 class function입니다.", detail: ["첫 매개변수는 관례상 self입니다.", "class variable도 조회할 수 있지만 상태 소유 의미를 구분합니다."] },
        { term: "invariant", definition: "객체가 유효한 동안 항상 만족해야 하는 상태 규칙입니다.", detail: ["생성자와 상태 변경 method에서 보호합니다.", "외부 직접 attribute 변경을 최소화합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "한 instance를 변경했는데 다른 instance 동작도 함께 달라진다.", likelyCause: "instance attribute가 아니라 class variable의 mutable 객체를 변경하거나 외부 공유 객체를 self에 저장했습니다.", checks: ["instance.__dict__와 Class.__dict__를 비교합니다.", "attribute가 list·dict·set이고 class body에 정의됐는지 봅니다.", "두 instance의 attribute id를 확인합니다."], fix: "객체별 상태는 __init__에서 새 instance attribute로 만들고 의도적 공유 상태는 별도 owner·repository에 명시합니다.", prevention: "두 instance 독립성 테스트와 mutable class attribute lint·review를 둡니다." },
      ],
    },
    {
      id: "classmethods-and-cls",
      title: "classmethod는 호출된 실제 class를 cls로 받아 상속을 보존합니다",
      lead: "@classmethod descriptor는 class에서 호출해도 instance에서 호출해도 첫 인수로 class object를 전달합니다.",
      explanations: [
        "원본 Calc.mul은 @classmethod와 cls를 선언하지만 계산에서 cls를 사용하지 않습니다. 동작은 가능하지만 단순 곱셈이라면 staticmethod나 module function이 더 정확합니다. classmethod는 class 자체가 실제로 필요한지로 판단하지 '객체 없이 호출하고 싶다'만으로 선택하지 않습니다.",
        "가장 대표적인 용도는 대체 생성자입니다. cls(...)를 호출하면 base class 이름을 하드코딩하지 않아 subclass에서 inherited factory를 호출할 때 subclass instance를 만듭니다. from_text, from_json, from_fahrenheit처럼 입력 표현을 parse·검증한 뒤 정상 생성자로 연결합니다.",
        "classmethod는 class-level registry·설정·counter를 다룰 수 있지만 inheritance에서 각 subclass가 attribute를 새로 가지는지 base mutable object를 공유하는지 주의합니다. cls.count += 1은 subclass에 새 int attribute를 만들 수 있고 cls.registry.append는 base list 객체를 공유할 수 있습니다.",
        "대체 생성자가 여러 개 늘어나면 parsing·I/O가 class에 과도하게 결합될 수 있습니다. 단순 text parse는 classmethod가 좋지만 DB·network·복잡한 dependency가 필요하면 별도 factory/service가 더 명확합니다. constructor는 유효한 객체 생성에 집중합니다.",
      ],
      concepts: [
        { term: "classmethod", definition: "@classmethod로 감싸져 호출된 class object가 첫 매개변수 cls로 자동 전달되는 method입니다.", detail: ["instance 없이 Class.method로 호출할 수 있습니다.", "상속 시 실제 subclass가 cls가 됩니다."] },
        { term: "대체 생성자", definition: "기본 __init__와 다른 입력 표현을 받아 검증·변환한 뒤 cls(...)로 객체를 만드는 classmethod입니다.", detail: ["이름은 보통 from_text·from_dict처럼 source를 드러냅니다.", "subclass 보존을 위해 구체 class 이름보다 cls를 사용합니다."] },
      ],
      codeExamples: [
        {
          id: "alternative-constructor-subclass",
          title: "cls를 사용해 subclass를 보존하는 from_text",
          language: "python",
          filename: "classmethod_factory.py",
          purpose: "기본 생성자와 대체 생성자, subclass inherited 호출에서 실제 생성 타입을 확인합니다.",
          code: "class User:\n    role = 'member'\n\n    def __init__(self, name, age):\n        name = name.strip()\n        if not name or age < 0:\n            raise ValueError('invalid user')\n        self.name = name\n        self.age = age\n\n    @classmethod\n    def from_text(cls, text):\n        name, age_text = (part.strip() for part in text.split(',', 1))\n        return cls(name, int(age_text))\n\n    def describe(self):\n        return f'{type(self).__name__}:{self.name}/{self.age}/{self.role}'\n\nclass Admin(User):\n    role = 'admin'\n\nuser = User.from_text('둘리, 10')\nadmin = Admin.from_text('고길동, 40')\nprint(user.describe())\nprint(admin.describe())\nprint(type(admin).__name__)",
          walkthrough: [
            { lines: "1-9", explanation: "기본 생성자가 name·age invariant를 한 곳에서 지키고 instance attribute를 만듭니다." },
            { lines: "11-14", explanation: "from_text가 input 표현을 parse한 뒤 구체 User가 아니라 cls를 호출해 실제 호출 class를 보존합니다." },
            { lines: "16-17", explanation: "instance method는 runtime type·instance 상태·class에서 조회한 role을 조합합니다." },
            { lines: "19-20", explanation: "Admin은 role만 override하고 inherited from_text를 재사용합니다." },
            { lines: "22-26", explanation: "User와 Admin class에서 각각 factory를 호출해 다른 실제 타입이 생성됨을 확인합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "classmethod_factory.py로 저장"], command: "python classmethod_factory.py" },
          output: { value: "User:둘리/10/member\nAdmin:고길동/40/admin\nAdmin", explanation: ["User.from_text의 cls는 User이고 Admin.from_text의 cls는 Admin입니다.", "Admin 생성에 inherited User.__init__가 사용되면서 실제 instance type은 Admin입니다.", "role attribute lookup은 Admin class 값을 선택합니다."] },
          experiments: [
            { change: "return cls(...)를 return User(...)로 바꿉니다.", prediction: "Admin.from_text를 호출해도 User instance가 만들어지고 role도 member입니다.", result: "classmethod 대체 생성자에서 구체 class 하드코딩이 polymorphism을 깨뜨립니다." },
            { change: "Admin에 __init__(name, age, permissions)를 추가합니다.", prediction: "inherited from_text가 필요한 permissions를 전달하지 못해 TypeError가 납니다.", result: "subclass constructor signature 호환이 깨지면 factory도 override하거나 생성 protocol을 재설계해야 합니다." },
          ],
          sourceRefs: ["py-class-person-source", "py-class-method-source", "python-classmethod-doc"],
        },
      ],
      diagnostics: [
        { symptom: "subclass에서 inherited factory를 호출했는데 base class 객체가 만들어진다.", likelyCause: "classmethod 안에서 cls(...)가 아니라 BaseClass(...)를 하드코딩했습니다.", checks: ["factory decorator와 첫 인수 cls를 확인합니다.", "return 식이 어떤 class를 호출하는지 봅니다.", "type(Subclass.from_x(...))를 테스트합니다."], fix: "subclass 보존이 계약이면 cls(...)를 호출하고 constructor signature 호환을 유지합니다.", prevention: "base·subclass 각각 대체 생성자를 호출하는 polymorphic factory test를 둡니다." },
      ],
    },
    {
      id: "staticmethods",
      title: "staticmethod는 자동 self·cls 없이 class namespace에 놓인 일반 함수입니다",
      lead: "@staticmethod descriptor는 function을 꺼낼 때 instance나 class를 결합하지 않으므로 전달한 인수만 받습니다.",
      explanations: [
        "원본 Calc.minus는 @staticmethod로 두 숫자를 받아 뺍니다. Calc.minus(5,3)과 Calc().minus(5,3) 모두 실행되지만 instance를 통해 호출하면 객체 상태를 쓸 것처럼 보일 수 있어 class 호출이 의도를 더 잘 드러냅니다.",
        "staticmethod는 class의 domain과 강하게 관련된 validation·conversion helper인데 instance나 class state가 필요 없을 때 쓸 수 있습니다. Temperature.is_valid_celsius, Coordinate.distance처럼 class namespace에서 발견성이 좋아질 수 있습니다.",
        "그렇다고 모든 utility를 class에 넣을 필요는 없습니다. 여러 class가 공유하거나 domain 소유자가 분명하지 않은 함수는 module-level function이 import·test·재사용에 더 단순합니다. Java식 UtilityClass를 습관적으로 만들지 않습니다.",
        "staticmethod는 override될 수 있지만 instance method처럼 dynamic self state를 받지 않습니다. 다른 method에서 self.validator(...) 또는 type(self).validator(...)를 어떻게 조회하느냐에 따라 subclass override 반영이 달라집니다. 확장 hook이 필요하면 명시 method protocol이나 dependency injection을 고려합니다.",
      ],
      concepts: [
        { term: "staticmethod", definition: "@staticmethod로 감싸져 class·instance 조회 모두에서 self나 cls가 자동 전달되지 않는 function입니다.", detail: ["class namespace 조직을 제공합니다.", "상태가 필요해지면 method 종류나 책임 위치를 다시 설계합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "staticmethod 안에서 self attribute나 cls class variable에 접근할 수 없다.", likelyCause: "staticmethod에는 암시적으로 전달되는 self·cls가 없는데 instance/class state가 필요한 동작을 배치했습니다.", checks: ["function이 실제로 읽는 상태 목록을 적습니다.", "그 상태의 소유자가 instance인지 class인지 확인합니다.", "단지 class namespace가 편해서 static으로 둔 것인지 봅니다."], fix: "instance 상태면 instance method, 실제 class 상태·polymorphic constructor면 classmethod로 바꾸고 상태 무관하면 필요한 값을 명시 인수로 받습니다.", prevention: "method 종류를 '객체 없이 호출 가능'이 아니라 필요한 상태 소유자로 선택합니다." },
      ],
    },
    {
      id: "three-methods-in-one-model",
      title: "세 메서드 종류는 암시 첫 인수와 상태 소유자가 다릅니다",
      lead: "instance method에는 self, classmethod에는 cls, staticmethod에는 아무 암시 인수도 전달되지 않습니다.",
      explanations: [
        "원본 ex09는 plus(self,a,b), minus(a,b), mul(cls,a,b)을 한 Calc에 둡니다. 호출 결과는 모두 숫자 계산이지만 method 종류를 구분하는 교육 예제입니다. 실제 설계에서는 mul이 cls를 사용하지 않으므로 classmethod 이유가 약하고 세 계산은 module function이 더 간단할 수 있습니다.",
        "반대로 객체별 scale을 가진 Calculator라면 plus가 self.scale을 사용하는 instance method가 됩니다. precision 정책을 class별로 override하고 대체 객체를 만들면 classmethod가 의미를 가질 수 있습니다. 숫자 범위 검증만 하는 helper는 staticmethod 또는 module function이 될 수 있습니다.",
        "어떤 형태든 호출 계약을 일관되게 유지합니다. 같은 이름 method가 subclass에서 instance→staticmethod로 바뀌면 호출은 일부 동작해도 override protocol과 type checker가 혼란스러워집니다. 상속 관계에서는 signature와 method kind를 보존합니다.",
        "method decorator 순서도 중요합니다. @classmethod와 @property 조합 같은 고급 패턴은 버전과 descriptor semantics가 복잡하며 평범한 명시 API가 더 낫습니다. 이해하기 어려운 마법보다 호출자가 예측 가능한 classmethod factory와 instance property를 분리합니다.",
      ],
      concepts: [
        { term: "암시 인수", definition: "method descriptor가 attribute 조회 시 호출자 대신 자동으로 결합하는 self 또는 cls입니다.", detail: ["staticmethod에는 없습니다.", "나머지 인수는 일반 함수 binding 규칙을 따릅니다."] },
      ],
      codeExamples: [
        {
          id: "method-kind-state-ownership",
          title: "상태 소유자에 따라 세 method를 한 class에 배치",
          language: "python",
          filename: "method_kinds.py",
          purpose: "instance scale, class 생성 counter, 상태 없는 validation이 각각 self·cls·staticmethod에 연결되는 이유를 확인합니다.",
          code: "class ScaledNumber:\n    created = 0\n\n    def __init__(self, value, scale=1):\n        if not self.is_number(value) or not self.is_number(scale):\n            raise TypeError('value and scale must be numbers')\n        self.value = value\n        self.scale = scale\n        type(self).created += 1\n\n    def result(self):\n        return self.value * self.scale\n\n    @classmethod\n    def from_percent(cls, value, percent):\n        return cls(value, percent / 100)\n\n    @staticmethod\n    def is_number(value):\n        return type(value) in (int, float)\n\na = ScaledNumber(10, 3)\nb = ScaledNumber.from_percent(200, 25)\nprint(f'a={a.result()}, b={b.result()}')\nprint(f'created={ScaledNumber.created}')\nprint(ScaledNumber.is_number(True), ScaledNumber.is_number(3.5))\nprint(a.result.__self__ is a)",
          walkthrough: [
            { lines: "1-10", explanation: "created는 class 통계이고 value·scale은 객체별 상태입니다. __init__는 static validation을 호출하고 runtime class counter를 증가시킵니다." },
            { lines: "12-13", explanation: "result는 self의 두 attribute를 사용하므로 instance method입니다." },
            { lines: "15-17", explanation: "from_percent는 cls를 호출해 대체 표현을 instance로 만듭니다." },
            { lines: "19-21", explanation: "is_number는 어떤 instance·class state도 읽지 않고 전달 값만 검사합니다. bool을 int에서 의도적으로 제외합니다." },
            { lines: "23-27", explanation: "직접 생성과 factory, class counter, static validation, bound method의 __self__를 출력합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "method_kinds.py로 저장"], command: "python method_kinds.py" },
          output: { value: "a=30, b=50.0\ncreated=2\nFalse True\nTrue", explanation: ["a.result는 instance scale 3을, b는 classmethod가 만든 scale 0.25를 사용합니다.", "두 생성 경로 모두 __init__를 거쳐 class counter가 2입니다.", "staticmethod는 True를 숫자로 허용하지 않고 bound result의 __self__는 a입니다."] },
          experiments: [
            { change: "type(self).created += 1을 ScaledNumber.created += 1로 바꾼 뒤 subclass를 생성합니다.", prediction: "subclass별 counter가 아니라 base class counter만 증가합니다.", result: "class state를 어느 class에 소유시킬지 cls/type(self)와 구체 class 이름이 결정합니다." },
            { change: "is_number의 @staticmethod를 제거하고 signature를 그대로 둡니다.", prediction: "self.is_number(value)가 instance를 첫 인수로 추가해 인수 개수 TypeError가 납니다.", result: "decorator가 attribute binding protocol을 실제로 바꿉니다." },
          ],
          sourceRefs: ["py-static-method-source", "py-class-method-source", "python-staticmethod-doc", "python-classmethod-doc"],
        },
      ],
      diagnostics: [
        { symptom: "decorator를 바꾼 뒤 인수 개수 오류가 나거나 override가 이상하게 동작한다.", likelyCause: "instance·class·static method의 binding 방식과 signature를 함께 바꾸지 않았습니다.", checks: ["Class.__dict__의 descriptor 종류를 확인합니다.", "Class.method와 instance.method의 signature를 비교합니다.", "base·subclass에서 같은 method kind와 인수 계약인지 봅니다."], fix: "필요한 상태 소유자에 맞는 method kind로 통일하고 모든 호출부·override·type hint·test를 함께 변경합니다.", prevention: "public method kind 변경을 API breaking change로 다루고 base/subclass contract test를 유지합니다." },
      ],
    },
    {
      id: "class-and-instance-attributes",
      title: "class variable은 공유되고 instance 대입은 같은 이름을 가릴 수 있습니다",
      lead: "instance.attribute 조회는 먼저 instance 상태를 찾고 없으면 class 계층을 찾기 때문에 읽기와 대입의 효과가 다를 수 있습니다.",
      explanations: [
        "Calc.count=0 같은 class variable은 class object에 하나 있습니다. c.count를 읽으면 instance에 count가 없을 때 Calc.count를 찾습니다. c.count = 5를 대입하면 기본적으로 c.__dict__에 instance attribute가 생겨 class count를 가리며 Calc.count는 그대로입니다.",
        "반면 class variable tags=[]를 c.tags.append('x')하면 instance 대입이 아니라 공유 list 객체 변경이라 모든 instance에서 보입니다. c.tags = ['x']는 instance list를 새로 만들어 가립니다. 이 차이가 mutable class attribute 버그의 핵심입니다.",
        "class counter는 process 한 개 안에서도 thread-safe한 원자 transaction이 아닙니다. 여러 thread·async task·process가 생성하면 정확한 영속 ID나 quota로 사용할 수 없습니다. 통계·식별자는 lock, DB sequence, metrics backend처럼 요구에 맞는 owner에 둡니다.",
        "test가 class variable을 바꾸면 다음 test에 남을 수 있습니다. fixture에서 원래 값을 복원하거나 class state 없는 설계를 선호합니다. import cache 때문에 module reload 없이 같은 class object가 test suite 전체에서 공유될 수 있습니다.",
      ],
      concepts: [
        { term: "class variable", definition: "class namespace에 저장되어 기본적으로 모든 instance가 attribute lookup으로 공유하는 값입니다.", detail: ["불변 상수·class metadata에 적합합니다.", "mutable 상태와 counter는 수명·동시성을 주의합니다."] },
        { term: "attribute shadowing", definition: "instance에 같은 이름 attribute를 만들어 class attribute가 해당 instance 조회에서 가려지는 현상입니다.", detail: ["class attribute가 삭제된 것은 아닙니다.", "mutable object 내부 변경과 이름 재연결을 구분합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "Class.count를 바꿨는데 특정 instance만 예전 또는 다른 값을 계속 본다.", likelyCause: "그 instance에 같은 이름 attribute가 생겨 class variable을 shadowing합니다.", checks: ["instance.__dict__에 count가 있는지 확인합니다.", "vars(Class)와 vars(instance)를 비교합니다.", "instance.count 대입 위치를 찾습니다."], fix: "class state 변경은 classmethod·Class.attribute로 일관되게 처리하고 객체별 상태면 명확히 다른 instance attribute로 설계합니다.", prevention: "class와 instance에서 같은 상태 이름을 혼용하지 않고 lookup·shadowing test를 둡니다." },
      ],
    },
    {
      id: "choosing-the-owner",
      title: "상태의 실제 소유자와 변경 축을 기준으로 method·함수·service를 선택합니다",
      lead: "class 안에 넣을 수 있다는 사실보다 누가 상태를 소유하고 누가 확장하며 누가 테스트하는지가 더 중요한 설계 기준입니다.",
      explanations: [
        "특정 객체의 현재 상태와 invariant를 사용하면 instance method, 실제 class/subclass를 만들거나 class metadata가 필요하면 classmethod, class domain에 밀접하지만 상태가 없으면 staticmethod 후보입니다. 어느 class에도 자연스럽게 속하지 않으면 module function이 가장 단순합니다.",
        "staticmethod가 다른 staticmethod만 계속 호출하고 class가 data를 갖지 않는다면 namespace class 냄새일 수 있습니다. Python module 자체가 namespace이므로 관련 함수·constant를 module에 두고 import하면 됩니다.",
        "외부 DB·API를 호출해 객체를 만드는 기능은 classmethod에 모두 넣기보다 repository/service가 I/O를 담당하고 classmethod가 이미 읽은 data를 validate·construct하는 구조가 test와 transaction에 유리합니다. creation과 retrieval을 구분합니다.",
        "상속 확장이 실제 요구가 아니라면 cls를 쓰기 위해 classmethod를 만들 필요가 없습니다. 반대로 plugin subclass를 지원한다면 registry와 factory의 class ownership, thread safety, unknown type 검증을 명확히 합니다.",
      ],
      concepts: [
        { term: "상태 소유자", definition: "데이터의 수명·변경·동시성·복구 책임을 실제로 가지는 객체·class·service·저장소입니다.", detail: ["method 배치 기준이 됩니다.", "편의 namespace와 실제 ownership을 구분합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "동작을 어디에 둘까요?", options: [
          { name: "instance method", chooseWhen: "특정 객체 상태·invariant·polymorphic behavior가 필요할 때", avoidWhen: "self를 전혀 쓰지 않고 여러 class가 같은 helper를 공유할 때", tradeoffs: ["행동과 상태가 가깝습니다.", "객체 생성과 dependency가 필요합니다.", "mutation 계약을 명시해야 합니다."] },
          { name: "classmethod", chooseWhen: "대체 생성자나 실제 subclass·class metadata가 필요할 때", avoidWhen: "cls를 전혀 쓰지 않는 단순 계산일 때", tradeoffs: ["subclass-preserving factory가 가능합니다.", "공유 class state 결합이 생길 수 있습니다.", "constructor signature 호환이 필요합니다."] },
          { name: "staticmethod", chooseWhen: "class domain에 밀접하지만 객체·class 상태와 독립적인 작은 helper일 때", avoidWhen: "단지 Java식 utility namespace를 만들 때", tradeoffs: ["class에서 발견하기 쉽습니다.", "module function보다 override·lookup 의미가 추가됩니다.", "상태가 필요해지면 재설계해야 합니다."] },
          { name: "module function/service", chooseWhen: "여러 타입이 공유하거나 I/O·dependency·transaction을 조정할 때", avoidWhen: "객체 invariant를 직접 바꾸는 핵심 behavior일 때", tradeoffs: ["호출과 테스트가 단순합니다.", "domain API가 흩어질 수 있습니다.", "service로 외부 dependency를 명시할 수 있습니다."] },
        ] },
      ],
      expertNotes: ["descriptor protocol을 직접 구현하면 lazy attribute·validation·ORM field를 만들 수 있지만, method binding 원리를 충분히 이해하고 단순 property로 해결되지 않을 때 사용합니다.", "class-level registry에 외부 문자열로 class를 선택할 때는 import 경로를 실행하지 말고 허용된 identifier→factory whitelist를 사용합니다."],
    },
  ],
  lab: {
    title: "다중 통화 Money value object와 생성 경계 설계",
    scenario: "금액과 통화를 가진 Money를 만들고 문자열 대체 생성자, instance 연산, 상태 없는 통화 code 검증을 method 종류에 맞게 배치합니다.",
    setup: ["money.py와 test_money.py를 만듭니다.", "Decimal과 ISO 통화 code 합성값만 사용합니다.", "Money는 생성 뒤 amount·currency를 바꾸지 않는 value object로 설계합니다."],
    steps: ["__init__ 또는 dataclass __post_init__에서 Decimal amount와 대문자 currency invariant를 검증합니다.", "add(self, other)는 같은 통화만 더하고 새 Money를 반환하는 instance method로 만듭니다.", "from_text(cls, 'KRW 1200.50')는 parse 후 cls(...)를 호출하는 classmethod로 만듭니다.", "is_currency_code(value)는 class state가 필요 없는 validation으로 staticmethod와 module function을 비교해 선택합니다.", "subclass RewardMoney에서 inherited from_text가 RewardMoney를 만드는지 테스트합니다.", "format policy가 객체별·class별·외부 service 중 어디에 속하는지 근거를 씁니다.", "mutable class registry를 만들지 않고 지원 통화는 불변 frozenset 또는 주입된 policy로 관리합니다.", "정상·음수 정책·통화 불일치·잘못된 text·bool amount·subclass 생성·두 instance 독립성을 테스트합니다."],
    expectedResult: ["instance method가 특정 Money 상태와 invariant를 사용합니다.", "classmethod 대체 생성자가 subclass 타입을 보존합니다.", "상태 없는 검증은 self·cls를 억지로 받지 않습니다.", "instance 상태와 class metadata가 서로 shadowing되지 않습니다.", "외부 exchange rate I/O는 Money가 아니라 주입 가능한 service에 남습니다."],
    cleanup: ["외부 파일·네트워크를 사용하지 않습니다."],
    extensions: ["ExchangeService를 주입해 환전하되 rate 시점·source 계약을 분리합니다.", "classmethod from_json_model과 JSON schema validation을 연결합니다.", "불변 dataclass와 일반 class 구현을 비교합니다.", "plugin currency factory registry의 thread safety와 whitelist를 설계합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 Calc의 plus·minus·mul을 실행하고 각 attribute binding 정보를 출력하세요.", requirements: ["Class.method와 instance.method의 type·__self__ 존재를 비교합니다.", "세 정상 호출과 잘못된 호출을 하나씩 재현합니다.", "cls를 쓰지 않는 mul이 왜 classmethod인지 교육 목적과 실제 설계를 구분합니다.", "module function 버전도 작성합니다."], hints: ["getattr(value, '__self__', None)을 확인합니다.", "오류 호출은 TypeError 메시지를 기록합니다."], expectedOutcome: "decorator 이름을 암기하지 않고 실제 binding과 상태 요구로 세 종류를 구분합니다.", solutionOutline: ["원본을 변경 없이 실행합니다.", "각 attribute를 class와 instance에서 조회합니다.", "필요 상태 표를 만들어 더 적절한 소유자를 제안합니다."] },
    { difficulty: "응용", prompt: "날짜 범위 DateRange class에 세 method 종류를 적절히 배치하세요.", requirements: ["duration과 contains는 instance 상태를 쓰는 method로 만듭니다.", "from_iso_range는 cls를 쓰는 대체 생성자로 만듭니다.", "is_iso_date는 상태 없는 helper 위치를 비교합니다.", "end < start invariant와 timezone/date 경계를 검증합니다.", "subclass factory·두 instance 독립성·잘못된 입력을 테스트합니다."], hints: ["factory에서 DateRange를 하드코딩하지 않습니다.", "datetime I/O와 현재 날짜는 숨은 전역로 읽지 않습니다."], expectedOutcome: "호출 의미와 상속을 보존하는 작은 domain API를 만듭니다." },
    { difficulty: "설계", prompt: "여러 저장소에서 User를 만드는 factory architecture를 설계하세요.", requirements: ["from_dict classmethod와 DB/API repository 책임을 구분합니다.", "subclass·plugin 생성 protocol을 정의합니다.", "외부 type identifier를 factory whitelist로 검증합니다.", "class registry의 동시성·test reset·process 분산 한계를 다룹니다.", "DI container·module factory·classmethod 대안을 비교합니다.", "transaction·cache·관찰성·민감 field 정책을 포함합니다."], hints: ["I/O retrieval과 이미 읽은 data의 object construction은 다른 책임입니다.", "global mutable registry가 유일한 답은 아닙니다."], expectedOutcome: "method 문법에서 확장·보안·동시성·테스트 가능한 객체 생성 architecture로 확장합니다." },
  ],
  reviewQuestions: [
    { question: "instance.method(arg)에서 self는 누가 전달하나요?", answer: "class function을 instance에서 조회할 때 descriptor가 instance를 bound method에 결합하고 호출 시 self로 자동 전달합니다." },
    { question: "classmethod의 첫 인수 cls는 무엇인가요?", answer: "method를 호출한 실제 class object이며 inherited 호출에서는 subclass가 될 수 있습니다." },
    { question: "staticmethod를 instance에서 호출할 수 있나요?", answer: "가능하지만 self는 전달되지 않으며 상태 독립성을 드러내려면 보통 Class.method 형태가 명확합니다." },
    { question: "대체 생성자에서 왜 return Base(...)보다 return cls(...)가 좋은가요?", answer: "subclass에서 inherited factory를 호출할 때 실제 subclass instance를 만들어 polymorphism을 보존하기 때문입니다." },
    { question: "cls를 전혀 쓰지 않는 classmethod는 항상 좋은 선택인가요?", answer: "아닙니다. class state나 실제 class가 필요 없다면 staticmethod 또는 module function이 더 정확할 수 있습니다." },
    { question: "c.count=5가 Calc.count를 바꾸나요?", answer: "보통 c instance에 같은 이름 attribute를 만들어 class variable을 가리며 Calc.count는 그대로입니다." },
    { question: "class variable tags=[]에 c.tags.append를 하면 왜 다른 instance에도 보이나요?", answer: "instance가 class에서 찾은 같은 list 객체를 변경했기 때문에 공유 상태가 바뀝니다." },
    { question: "외부 DB에서 객체를 읽는 기능은 무조건 classmethod인가요?", answer: "아닙니다. I/O·transaction dependency는 repository/service가 맡고 classmethod는 이미 읽은 data의 검증·생성에 집중하는 편이 명확할 수 있습니다." },
  ],
  completionChecklist: [
    "class function과 bound instance method의 self 결합을 설명할 수 있다.",
    "instance invariant와 mutation을 instance method에 배치할 수 있다.",
    "classmethod cls와 subclass-preserving 대체 생성자를 구현할 수 있다.",
    "staticmethod가 자동 인수를 받지 않음을 실행으로 확인할 수 있다.",
    "class variable lookup·instance shadowing·mutable 공유를 추적할 수 있다.",
    "세 method·module function·service 중 상태 소유자에 맞는 위치를 선택할 수 있다.",
    "class 공유 상태의 test·thread·process 한계를 설명할 수 있다.",
    "factory registry와 외부 type 식별자에 whitelist·동시성 정책을 적용할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-car-instance-source", repository: "PYTHON-BASIC", path: "day06/ex03_class.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex03_class.py", usedFor: ["instance 생성", "instance attribute", "instance method 호출", "main guard"], evidence: "Car instance의 color·wheel·cc와 forward·stop·back 호출 흐름을 감사해 객체 상태와 method 소유 설명의 출발점으로 사용했습니다." },
    { id: "py-class-person-source", repository: "PYTHON-BASIC", path: "day06/ex07_class.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex07_class.py", usedFor: ["__init__", "self attribute", "-> None"], evidence: "Person(name,age)의 instance 초기화와 constructor 반환 annotation을 대체 생성자의 invariant 연결에 사용했습니다." },
    { id: "py-static-method-source", repository: "PYTHON-BASIC", path: "day06/ex08_class.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex08_class.py", usedFor: ["instance method", "staticmethod", "class/instance 호출 차이"], evidence: "원본을 실행해 Calc.minus(5,3)=2와 calc.plus(5,3)=8을 확인하고 상태 소유 기준을 보강했습니다." },
    { id: "py-class-method-source", repository: "PYTHON-BASIC", path: "day06/ex09.class.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex09.class.py", usedFor: ["classmethod", "cls", "세 method 종류 비교"], evidence: "원본을 실행해 static minus=-2, class mul=15, instance plus=8을 확인하고 cls 미사용 교육 예제를 실제 대체 생성자 설계로 확장했습니다." },
    { id: "python-classmethod-doc", repository: "Python documentation", path: "library/functions.html#classmethod", publicUrl: "https://docs.python.org/3/library/functions.html#classmethod", usedFor: ["classmethod binding", "class/subclass 전달", "대체 생성자"], evidence: "공식 built-in classmethod 계약을 subclass-preserving factory 설명의 기준으로 사용했습니다." },
    { id: "python-staticmethod-doc", repository: "Python documentation", path: "library/functions.html#staticmethod", publicUrl: "https://docs.python.org/3/library/functions.html#staticmethod", usedFor: ["staticmethod binding", "class namespace", "호출 형태"], evidence: "공식 built-in staticmethod 계약을 instance·class 자동 인수 없음과 module function 비교의 기준으로 사용했습니다." },
  ],
  sourceCoverage: { filesRead: 4, filesUsed: 4, uncoveredNotes: ["상속·super와 method overriding은 py-031·032에서 MRO와 constructor 협력을 포함해 별도 확장합니다.", "descriptor binding·mutable class state·thread/process 안전·factory registry whitelist는 원본 세 method 예제를 전문가 설계 수준으로 보강한 내용입니다."] },
} satisfies DetailedSession;

export default session;

const bindingChapters: DetailedSession["chapters"] = [
  {
    id: "descriptor-binding-introspection",
    title: "function descriptor가 instance·class·static access에서 무엇을 bind하는지 관찰합니다",
    lead: "세 method 종류의 차이는 첫 parameter 이름이 아니라 class namespace의 descriptor가 attribute access 때 반환하는 객체와 암시적으로 전달하는 값입니다.",
    explanations: [
      "class body의 일반 function은 descriptor protocol의 `__get__`을 제공해 instance에서 조회하면 bound method를 만듭니다. bound method는 `__self__`에 instance, `__func__`에 원래 function을 보관하고 호출 때 instance를 첫 인자로 전달합니다.",
      "같은 function을 class에서 `Demo.method`로 조회하면 특정 instance에 bind되지 않은 function을 얻습니다. Python 3에는 Python 2식 unbound method type이 따로 없으며 직접 호출하려면 `Demo.method(obj, value)`처럼 instance를 명시할 수 있습니다.",
      "classmethod descriptor는 class와 instance 어느 쪽에서 조회해도 owning/subclass를 `__self__`로 bind합니다. 그래서 hard-coded base 이름 대신 cls로 alternative constructor를 구현하면 subclass 호출이 subclass instance를 만들 수 있습니다.",
      "staticmethod descriptor는 underlying function을 그대로 반환하고 instance나 class를 자동 전달하지 않습니다. class namespace에 둘 이유는 domain grouping이며 class/instance state가 필요해지면 module function·instance collaborator·classmethod 중 책임을 다시 선택합니다.",
      "bound method object는 access마다 새 wrapper일 수 있으므로 `obj.method is obj.method` identity에 의존하지 않습니다. 함수 자체 비교가 필요하면 `__func__`, receiver는 `__self__`를 보되 production 로직보다 introspection·test 도구에 제한합니다.",
      "decorator 순서도 descriptor 의미를 바꿉니다. property·classmethod·staticmethod와 다른 decorator를 조합할 때 Python 버전별 지원과 반환 descriptor를 확인하고 간단한 wrapper를 class 밖에서 먼저 테스트합니다.",
      "method signature의 self·cls 이름은 convention이지만 강력한 독해 계약입니다. 다른 이름도 실행되지만 lint·문서·팀 이해를 깨므로 표준 이름과 type annotation을 유지합니다.",
    ],
    concepts: [
      { term: "bound method", definition: "function과 receiver를 묶어 호출 시 receiver를 첫 인자로 자동 전달하는 객체입니다.", detail: ["__self__와 __func__를 가집니다.", "instance method access가 만듭니다."] },
      { term: "descriptor binding", definition: "attribute object의 __get__이 instance·owner에 따라 조회 결과를 변환하는 과정입니다.", detail: ["function·classmethod·staticmethod가 다르게 동작합니다.", "property도 같은 protocol 계열입니다."] },
      { term: "receiver", definition: "bound call에서 암시적으로 전달되는 instance 또는 class 객체입니다.", detail: ["instance method는 self입니다.", "classmethod는 cls입니다."] },
    ],
    codeExamples: [{
      id: "python-method-descriptor-binding",
      title: "__self__·__func__로 세 method의 binding 결과를 비교합니다",
      language: "python",
      filename: "method_binding.py",
      purpose: "호출 문법만 외우지 않고 descriptor access가 어떤 receiver와 function을 반환하는지 exact 관찰합니다.",
      code: "class Demo:\n    def instance(self, value):\n        return f'{type(self).__name__}:{value}'\n\n    @classmethod\n    def build(cls):\n        return cls.__name__\n\n    @staticmethod\n    def add(left, right):\n        return left + right\n\nobj = Demo()\nbound = obj.instance\nprint(f'instance_bound={bound.__self__ is obj}|func_same={bound.__func__ is Demo.instance}|result={bound(3)}')\nprint(f'class_bound={Demo.build.__self__ is Demo}|result={Demo.build()}')\nprint(f'static_same={obj.add is Demo.add}|result={obj.add(2, 5)}')",
      walkthrough: [
        { lines: "1-11", explanation: "일반 function, classmethod, staticmethod가 같은 class namespace에 선언됩니다." },
        { lines: "13-15", explanation: "instance access로 만든 bound method의 receiver와 원래 function을 비교합니다." },
        { lines: "16-17", explanation: "classmethod는 class에 bind되고 staticmethod는 같은 underlying function을 반환함을 확인합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 문법만 사용"], command: "python method_binding.py" },
      output: { value: "instance_bound=True|func_same=True|result=Demo:3\nclass_bound=True|result=Demo\nstatic_same=True|result=7", explanation: ["bound.__self__는 obj이고 __func__는 class function입니다.", "Demo.build는 Demo class에 bind됩니다.", "staticmethod는 receiver 없이 두 숫자만 받습니다."] },
      experiments: [
        { change: "`Demo.instance(3)`으로 호출합니다.", prediction: "self가 없어 TypeError가 납니다.", result: "class access는 instance를 자동 bind하지 않습니다." },
        { change: "obj.instance를 두 번 조회해 is로 비교합니다.", prediction: "동등한 호출 wrapper여도 identity가 False일 수 있습니다.", result: "method wrapper identity에 의존하지 않습니다." },
        { change: "Demo를 상속한 Child에서 build를 호출합니다.", prediction: "result가 Child입니다.", result: "classmethod receiver는 실제 lookup class입니다." },
      ],
      sourceRefs: ["python-descriptor-howto-029", "python-descriptor-model-029", "python-types-method-029"],
    }],
    diagnostics: [
      { symptom: "`Demo.method()` 호출에서 missing positional argument self가 납니다.", likelyCause: "class를 통해 일반 function을 조회하면서 instance receiver를 전달하지 않았습니다.", checks: ["type(Demo.method)와 type(obj.method)을 비교합니다.", "bound.__self__ 존재를 봅니다.", "method가 state를 정말 필요로 하는지 확인합니다."], fix: "instance method는 obj.method()로 호출하거나 설계상 receiver가 없으면 static/module function으로 명확히 바꿉니다.", prevention: "public call style과 signature를 예제·type check에 고정합니다." },
      { symptom: "decorator를 추가한 뒤 mock이나 wrapper가 cls 대신 이상한 객체를 받습니다.", likelyCause: "decorator 순서가 descriptor를 일반 function처럼 감싸 binding semantics를 잃었습니다.", checks: ["class __dict__의 raw descriptor type을 봅니다.", "조회 전후 inspect.ismethod 결과를 비교합니다.", "wrapper가 __get__ 또는 functools.wraps를 보존하는지 확인합니다."], fix: "descriptor를 인지하는 decorator를 사용하거나 underlying function에 먼저 적용한 뒤 classmethod/staticmethod로 감쌉니다.", prevention: "class와 subclass, instance 세 access 경로를 decorator contract test에 둡니다." },
    ],
  },
  {
    id: "class-state-inheritance-shadowing",
    title: "class state의 상속·재바인딩·instance shadowing을 mutation과 분리합니다",
    lead: "cls.attr 대입은 실제 호출 class namespace를 만들 수 있지만 inherited mutable object 내부 변경은 부모와 자식이 같은 객체를 공유할 수 있습니다.",
    explanations: [
      "attribute lookup은 instance→class→base MRO를 따라갑니다. instance에 `total`이 없으면 class 값을 보지만 `instance.total = 99`는 보통 instance __dict__에 새 attribute를 만들어 class state를 바꾸지 않습니다.",
      "classmethod에서 `cls.total += 1`은 read와 assignment의 조합입니다. subclass가 inherited 값을 읽은 뒤 자기 namespace에 새 total을 bind해 base와 분리될 수 있습니다. 어느 class가 호출했는지가 state owner를 결정합니다.",
      "반면 `cls.items.append(x)`는 assignment 없이 inherited list object를 mutate하므로 base와 여러 subclasses가 같은 list를 공유할 수 있습니다. subclass별 registry가 필요하면 `__init_subclass__`에서 새 container를 만들거나 external registry를 주입합니다.",
      "class state는 process 안에서 공유되므로 tests의 실행 순서, worker process, reload와 concurrency에 영향을 받습니다. cache·counter·registry의 lifecycle과 lock을 명시하고 durable 데이터처럼 취급하지 않습니다.",
      "constant는 class attribute로 자연스럽지만 mutable operational state는 instance service나 repository가 더 testable할 수 있습니다. classmethod가 편하다는 이유만으로 global singleton과 같은 숨은 dependency를 만들지 않습니다.",
      "class property처럼 보이는 복잡한 descriptor보다 명시적 classmethod query가 error handling·async·caching 정책을 드러내기 쉽습니다. state read와 mutation methods를 분리합니다.",
    ],
    concepts: [
      { term: "instance shadowing", definition: "같은 이름을 instance namespace에 bind해 class/base attribute lookup을 가리는 현상입니다.", detail: ["class 값은 그대로일 수 있습니다.", "오타가 새 field를 만들 수도 있습니다."] },
      { term: "subclass rebinding", definition: "inherited 값을 읽은 뒤 subclass namespace에 같은 이름의 새 binding을 만드는 동작입니다.", detail: ["`cls.x += 1`에서 나타날 수 있습니다.", "mutable 내부 변경과 다릅니다."] },
      { term: "shared mutable class state", definition: "base와 subclasses가 같은 mutable attribute 객체를 상속해 함께 변경하는 상태입니다.", detail: ["test leakage 원인이 됩니다.", "owner와 lifecycle을 명시합니다."] },
    ],
    codeExamples: [{
      id: "python-class-state-shadowing",
      title: "base·subclass classmethod 재바인딩과 instance shadow를 분리합니다",
      language: "python",
      filename: "class_state_shadow.py",
      purpose: "같은 total 이름이 MRO lookup, subclass assignment, instance assignment에서 어느 namespace에 저장되는지 확인합니다.",
      code: "class Counter:\n    total = 0\n\n    @classmethod\n    def bump(cls):\n        cls.total += 1\n        return cls.total\n\nclass ChildCounter(Counter):\n    pass\n\nbase_result = Counter.bump()\nchild_result = ChildCounter.bump()\nchild = ChildCounter()\nchild.total = 99\nprint(f'returns={base_result},{child_result}|class_values={Counter.total},{ChildCounter.total}')\nprint(f'instance={child.total}|child_class={ChildCounter.total}|base_class={Counter.total}')",
      walkthrough: [
        { lines: "1-7", explanation: "classmethod가 cls namespace의 total을 읽고 증가 후 다시 bind합니다." },
        { lines: "9-10", explanation: "subclass는 처음에 base total을 상속 조회합니다." },
        { lines: "12-17", explanation: "base·subclass 호출 뒤 instance에 같은 이름을 shadow하고 세 namespace 값을 출력합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 문법만 사용"], command: "python class_state_shadow.py" },
      output: { value: "returns=1,2|class_values=1,2\ninstance=99|child_class=2|base_class=1", explanation: ["ChildCounter.bump는 inherited 1을 읽고 ChildCounter.total=2를 만듭니다.", "instance assignment 99는 두 class 값 모두 바꾸지 않습니다."] },
      experiments: [
        { change: "total을 list로 바꾸고 append합니다.", prediction: "subclass에 새 binding 없이 inherited list를 함께 변경할 수 있습니다.", result: "rebind와 in-place mutation을 구분합니다." },
        { change: "ChildCounter.total=10을 class body에 선언합니다.", prediction: "첫 bump 결과가11이고 base는1을 유지합니다.", result: "subclass 초기 state override가 명시적입니다." },
        { change: "여러 test가 Counter.bump를 공유합니다.", prediction: "초기화하지 않으면 순서에 따라 기대값이 달라집니다.", result: "instance fixture나 explicit reset/repository를 사용합니다." },
      ],
      sourceRefs: ["python-descriptor-model-029", "python-classmethod-doc", "python-inspect-method-029"],
    }],
    diagnostics: [
      { symptom: "subclass registry를 수정했더니 base와 다른 subclass에도 항목이 생깁니다.", likelyCause: "inherited mutable class attribute를 append해 같은 object를 공유했습니다.", checks: ["Base.items is Child.items를 확인합니다.", "assignment와 in-place mutation을 구분합니다.", "각 class __dict__에 이름이 있는지 봅니다."], fix: "subclass 생성 때 새 container를 bind하거나 registry owner를 외부 instance로 분리합니다.", prevention: "base·두 subclass의 object identity와 mutation isolation test를 둡니다." },
    ],
  },
  {
    id: "method-ownership-dependency-testability",
    title: "method 종류를 상태 소유권·다형성·dependency 주입과 testability 기준으로 선택합니다",
    lead: "instance state는 instance method, subclass-aware factory/policy는 classmethod, receiver 없는 순수 helper는 static/module function이라는 출발점 위에 dependency lifetime을 검토합니다.",
    explanations: [
      "instance method는 constructor로 받은 dependency와 instance invariant를 자연스럽게 사용합니다. repository·clock·transport를 field로 주입하면 test마다 fake instance를 넘길 수 있고 class global patch 범위를 줄입니다.",
      "classmethod alternative constructor는 parsing·default policy 뒤 `cls(...)`를 호출해 subclass를 보존합니다. 그러나 network·filesystem을 classmethod 안에서 직접 찾으면 factory와 side effect가 결합하므로 dependency를 argument로 받거나 별도 assembler에 둡니다.",
      "staticmethod는 override할 수 있는 class namespace function이지만 implicit cls가 없어 어떤 subclass가 호출했는지 모릅니다. helper가 subclass policy를 읽어야 하면 classmethod, object state를 읽어야 하면 instance method입니다.",
      "module-level pure function은 한 class에 속하지 않는 transformation에 더 단순하고 import·test·reuse가 쉽습니다. Java식 utility class를 만들기 위해 staticmethod만 모으지 않습니다.",
      "class attribute로 clock 함수를 제공하면 subclass test seam을 만들 수 있지만 process-global mutable patch보다 constructor injection이 병렬 test에 안전합니다. 예제는 binding 차이를 보여 주고 production에서는 instance service를 우선 검토합니다.",
      "API를 바꿀 때 instance→static 전환은 call syntax가 우연히 유지돼도 override·mock·signature contract가 달라집니다. semantic version과 subclass 사용자를 확인합니다.",
    ],
    concepts: [
      { term: "method ownership", definition: "동작이 어느 상태와 lifecycle에 책임을 지는지에 따라 instance·class·module 중 위치를 정하는 기준입니다.", detail: ["문법 편의보다 dependency를 봅니다.", "override 요구를 포함합니다."] },
      { term: "test seam", definition: "실제 dependency를 deterministic fake로 바꿀 수 있는 명시적 경계입니다.", detail: ["constructor injection이 대표적입니다.", "global patch 범위를 줄입니다."] },
    ],
    codeExamples: [{
      id: "python-classmethod-static-test-seam",
      title: "classmethod가 실제 subclass의 static clock 정책을 사용합니다",
      language: "python",
      filename: "method_test_seam.py",
      purpose: "cls dispatch와 receiver 없는 static dependency가 subclass override에서 어떻게 결합되는지 deterministic 출력으로 봅니다.",
      code: "class TokenService:\n    clock = staticmethod(lambda: 100)\n\n    @classmethod\n    def issue(cls, user):\n        return f'{cls.__name__}:{user}:{cls.clock()}'\n\nclass DeterministicTokenService(TokenService):\n    clock = staticmethod(lambda: 42)\n\nprint(TokenService.issue('kim'))\nprint(DeterministicTokenService.issue('kim'))",
      walkthrough: [
        { lines: "1-6", explanation: "base class는 receiver 없는 clock function과 subclass-aware classmethod를 가집니다." },
        { lines: "8-9", explanation: "test subclass가 static clock만 deterministic function으로 대체합니다." },
        { lines: "11-12", explanation: "같은 classmethod가 실제 cls 이름과 cls.clock lookup을 사용해 다른 결과를 냅니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 문법만 사용"], command: "python method_test_seam.py" },
      output: { value: "TokenService:kim:100\nDeterministicTokenService:kim:42", explanation: ["classmethod는 hard-coded TokenService가 아니라 cls를 사용합니다.", "staticmethod clock에는 receiver가 자동 전달되지 않습니다.", "subclass lookup으로 deterministic 정책을 선택합니다."] },
      experiments: [
        { change: "issue에서 TokenService.clock을 직접 호출합니다.", prediction: "subclass도100을 사용합니다.", result: "hard-coded base name이 polymorphism을 차단합니다." },
        { change: "clock을 instance constructor argument로 옮깁니다.", prediction: "subclass 없이 service instance마다 fake를 주입할 수 있습니다.", result: "병렬 test와 dependency lifetime이 더 명시적입니다." },
        { change: "clock을 일반 instance method로 바꾸고 classmethod에서 호출합니다.", prediction: "instance가 없어 호출할 수 없습니다.", result: "receiver 요구와 factory 책임을 다시 분리합니다." },
      ],
      sourceRefs: ["python-classmethod-doc", "python-staticmethod-doc", "python-descriptor-howto-029", "python-inspect-method-029", "py-car-instance-source"],
    }],
    diagnostics: [
      { symptom: "test가 class clock patch를 복구하지 못해 다른 test 결과가 바뀝니다.", likelyCause: "process-wide class state를 직접 monkey-patch하고 lifecycle을 관리하지 않았습니다.", checks: ["원래 descriptor를 class __dict__에서 확인합니다.", "test 병렬 실행과 patch 범위를 봅니다.", "constructor injection 가능성을 검토합니다."], fix: "fixture/context manager로 patch를 복구하거나 instance dependency injection으로 옮깁니다.", prevention: "병렬·순서 무작위 test와 state leakage 검사를 둡니다." },
    ],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...bindingChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "python-descriptor-howto-029", repository: "Python Documentation", path: "Descriptor Guide", publicUrl: "https://docs.python.org/3/howto/descriptor.html", usedFor: ["function binding", "classmethod", "staticmethod", "property protocol"], evidence: "function과 method decorator가 __get__으로 binding되는 과정을 공식 HOWTO로 확인했습니다." },
  { id: "python-descriptor-model-029", repository: "Python Language Reference", path: "Invoking Descriptors", publicUrl: "https://docs.python.org/3/reference/datamodel.html#invoking-descriptors", usedFor: ["attribute lookup order", "descriptor __get__", "instance versus class access"], evidence: "descriptor 호출과 instance/class attribute lookup 규칙을 공식 데이터 모델로 확인했습니다." },
  { id: "python-types-method-029", repository: "Python Standard Library", path: "types.MethodType", publicUrl: "https://docs.python.org/3/library/types.html#types.MethodType", usedFor: ["bound method type", "__func__", "__self__"], evidence: "bound instance method의 표준 runtime type과 attributes를 공식 문서로 확인했습니다." },
  { id: "python-inspect-method-029", repository: "Python Standard Library", path: "inspect predicates", publicUrl: "https://docs.python.org/3/library/inspect.html#inspect.ismethod", usedFor: ["ismethod", "isfunction", "descriptor introspection", "test diagnostics"], evidence: "조회 결과가 method/function인지 진단하는 inspect API를 공식 문서로 확인했습니다." },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "bound instance method의 __self__와 __func__는 무엇인가요?", answer: "__self__는 receiver instance이고 __func__는 class에 선언된 원래 function입니다." },
  { question: "Python 3에서 `Class.method`는 instance에 bind된 method인가요?", answer: "아닙니다. 일반 function을 얻으며 호출하려면 instance를 첫 인자로 직접 주거나 instance에서 조회합니다." },
  { question: "classmethod를 subclass에서 호출하면 cls는 누구인가요?", answer: "method를 실제 호출한 subclass가 cls로 bind됩니다." },
  { question: "`cls.total += 1`과 `cls.items.append(x)`의 상속 차이는 무엇인가요?", answer: "전자는 subclass에 새 binding을 만들 수 있고 후자는 inherited mutable object를 그대로 변경할 수 있습니다." },
  { question: "instance.total 대입이 class total을 바꾸나요?", answer: "일반적으로 instance namespace에 같은 이름을 만들어 class 값을 shadow할 뿐입니다." },
  { question: "staticmethod가 module function보다 항상 좋은가요?", answer: "아닙니다. class domain에 명확히 속하지 않는 pure helper는 module function이 더 단순할 수 있습니다." },
  { question: "시간·DB dependency를 classmethod 내부에서 전역 조회하면 어떤 문제가 생기나요?", answer: "숨은 dependency와 shared state가 되어 test 격리·병렬성·lifecycle 관리가 어려워집니다." },
);

(session.completionChecklist as string[]).push(
  "descriptor binding으로 instance·class·static method 차이를 설명한다.",
  "bound method의 __self__·__func__를 진단에 사용한다.",
  "subclass classmethod가 실제 cls를 보존하는 factory를 작성한다.",
  "class 재바인딩과 inherited mutable object mutation을 구분한다.",
  "instance shadowing이 class state를 바꾸지 않음을 검증했다.",
  "method 위치를 state owner와 override 요구로 결정한다.",
  "dependency를 class global patch보다 명시적으로 주입한다.",
);
