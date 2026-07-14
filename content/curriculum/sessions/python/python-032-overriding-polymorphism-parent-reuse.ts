import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-032"],
  slug: "python-032-overriding-polymorphism-parent-reuse",
  courseId: "python",
  moduleId: "03-oop-stdlib",
  order: 32,
  title: "오버라이딩·다형성·부모 재사용",
  subtitle: "같은 호출이 실제 객체 타입에 맞는 행동을 선택하는 원리를 이해하고, 부모 계약을 깨지 않으면서 재사용·확장하는 설계를 만듭니다.",
  level: "중급",
  estimatedMinutes: 140,
  coreQuestion: "서로 다른 객체를 같은 인터페이스로 다루되 subclass가 부모 호출자의 기대를 깨뜨리지 않도록 override의 입력·출력·예외·상태 계약을 어떻게 지킬까요?",
  summary: "Python의 같은 class 내 재정의는 overload가 아니라 마지막 이름 binding이라는 점, subclass override와 runtime dynamic dispatch를 구분합니다. Animal Dog/Cat/Fish와 Employee Manager/Intern 원본을 실행 모델로 재구성하고 super로 부모 행동을 확장하는 순서를 다룹니다. signature·반환·예외·부수 효과를 포함한 행동 하위 타입, abstract base class·Protocol·duck typing, 상속과 composition 선택, plugin whitelist·test matrix까지 확장합니다.",
  objectives: [
    "같은 class body의 같은 이름 재정의와 subclass overriding을 구분하고 Python식 overload 대안을 설명할 수 있다.",
    "base type 변수나 공통 loop에서 실제 runtime type의 override method가 선택되는 dynamic dispatch를 추적할 수 있다.",
    "subclass method가 부모보다 더 강한 사전조건·약한 결과·예상 밖 예외를 만들 때 substitutability가 깨지는 이유를 설명할 수 있다.",
    "super가 고정된 부모 이름이 아니라 현재 MRO의 다음 구현을 협력 호출한다는 점을 사용할 수 있다.",
    "부모 행동을 완전히 대체할지 전후로 확장할지 결정하고 반환값·예외·state mutation을 보존할 수 있다.",
    "ABC·Protocol·duck typing으로 행동 계약을 표현하고 nominal inheritance와 비교할 수 있다.",
    "상속보다 composition이 변화 축·runtime 조합·test 격리에 적합한 상황을 선택할 수 있다.",
  ],
  prerequisites: [
    { title: "상속·super·초기화 누락", reason: "MRO와 협력적 super, base invariant 초기화를 바탕으로 method override를 확장합니다.", sessionSlug: "python-031-inheritance-super-initialization" },
    { title: "인스턴스·클래스·정적 메서드", reason: "bound method와 runtime class lookup을 이해한 뒤 dynamic dispatch를 다룹니다.", sessionSlug: "python-029-instance-class-static-methods" },
    { title: "기본값·*args·**kwargs", reason: "override signature 호환과 overload 대신 명시적 인수 계약을 비교합니다.", sessionSlug: "python-022-default-args-varargs-kwargs" },
  ],
  keywords: ["Python", "override", "overloading", "polymorphism", "dynamic dispatch", "super", "MRO", "Liskov substitution", "ABC", "Protocol", "composition"],
  chapters: [
    {
      id: "overload-vs-override",
      title: "Python에서 같은 class의 같은 method 이름은 overload 집합이 아니라 마지막 binding입니다",
      lead: "override는 subclass가 base method 이름을 새 구현으로 제공하는 것이고, 같은 class에서 signature만 다른 method를 여러 개 두는 전통적 overload와 다릅니다.",
      explanations: [
        "원본 ex13·ex14는 Python이 Java식 runtime method overload를 기본 제공하지 않는다는 점을 설명합니다. class body에서 def add(self,a,b) 뒤 def add(self,a,b,c)를 다시 쓰면 두 function이 공존하는 것이 아니라 add 이름이 마지막 function을 가리킵니다. 첫 구현은 class namespace에 남지 않습니다.",
        "인수 개수 차이는 기본값·*args·keyword-only로 하나의 signature에서 표현할 수 있지만 각 형태의 의미와 타입을 검증해야 합니다. add(*args)가 0개에서 sum(())=0을 반환하는 것이 domain상 올바른지, bool·문자열이 허용되는지 계약을 정합니다.",
        "타입에 따라 동작이 크게 달라지면 isinstance cascade보다 다른 이름의 함수, functools.singledispatch, 별도 class polymorphism을 고려합니다. 정적 type checker의 @overload는 여러 호출 signature를 설명하지만 runtime implementation은 마지막 하나여야 합니다. typing overload와 runtime dispatch를 혼동하지 않습니다.",
        "override는 inheritance 계층에서 이름 lookup이 subclass implementation을 먼저 선택하는 것입니다. 부모와 같은 signature일 필요를 interpreter가 강제하지는 않지만 기존 부모 호출자가 그대로 사용할 수 있도록 행동 계약을 호환해야 합니다.",
      ],
      concepts: [
        { term: "overriding", definition: "subclass가 base class에 있는 같은 이름 method를 새 구현으로 제공해 runtime lookup 결과를 바꾸는 것입니다.", detail: ["실제 객체 타입에서 더 가까운 구현이 선택됩니다.", "호출 호환성은 설계·타입·테스트로 보장합니다."] },
        { term: "overloading", definition: "같은 이름에 여러 signature 구현을 두고 인수 형태에 따라 선택하는 개념이며 Python은 일반 class method에서 Java식 runtime overload를 기본 제공하지 않습니다.", detail: ["기본값·가변 인수·다른 이름·singledispatch가 대안입니다.", "typing.@overload는 정적 signature 설명입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "같은 class에 만든 첫 번째 method가 호출되지 않고 마지막 정의만 보인다.", likelyCause: "signature가 다르면 자동 overload될 것으로 생각했지만 class namespace의 같은 이름을 마지막 def가 덮었습니다.", checks: ["Class.__dict__['method']와 source 정의 위치를 확인합니다.", "inspect.signature로 실제 남은 구현을 봅니다.", "정적 @overload와 runtime implementation 구조를 구분합니다."], fix: "하나의 명확한 signature로 통합하거나 의미가 다르면 method 이름을 나누고 필요한 경우 singledispatch·class polymorphism을 선택합니다.", prevention: "중복 method 이름 lint와 각 지원 호출 형태 contract test를 사용합니다." },
      ],
    },
    {
      id: "dynamic-dispatch",
      title: "다형성은 같은 호출이 실제 객체의 override 구현으로 dispatch되는 성질입니다",
      lead: "for animal in animals: animal.speak() 한 줄은 각 객체 runtime type의 method lookup을 수행해 다른 행동을 선택합니다.",
      explanations: [
        "원본 Animal.speak는 일반 소리를 출력하고 Dog와 Cat은 같은 이름을 override합니다. Fish는 override하지 않아 MRO에서 Animal.speak를 찾습니다. 호출 변수 이름이나 선언 type이 아니라 실제 객체 class와 MRO가 구현을 결정합니다.",
        "다형성의 장점은 caller가 Dog·Cat·Fish마다 if type 분기를 반복하지 않는 것입니다. 새로운 Bird가 speak 계약을 만족하면 loop를 수정하지 않고 추가할 수 있습니다. caller는 구체 타입이 아니라 공통 행동 계약에 의존합니다.",
        "type(obj) is Dog 같은 정확 타입 검사로 branch하면 subclass 확장을 가로막습니다. 정말 특수 능력이 필요하면 isinstance 또는 Protocol capability를 사용하되, 공통 행동은 method dispatch에 맡깁니다. 문자열 class 이름으로 분기하는 방식은 rename과 보안에 취약합니다.",
        "원본 speak가 print만 하고 None을 반환하면 caller는 결과를 조합하기 어렵습니다. 교육 예제는 그대로 이해하되 domain API에서는 speak가 str을 반환하고 UI layer가 출력하도록 분리하면 같은 다형성 계약을 CLI·web·test가 재사용할 수 있습니다.",
      ],
      concepts: [
        { term: "polymorphism", definition: "공통 호출 계약을 가진 서로 다른 객체가 각자의 구현으로 응답해 caller가 구체 타입 분기 없이 다룰 수 있는 성질입니다.", detail: ["inheritance뿐 아니라 Protocol·duck typing으로도 가능합니다.", "같은 이름만이 아니라 호환되는 행동 의미가 필요합니다."] },
        { term: "dynamic dispatch", definition: "실행 중 실제 객체 type과 MRO를 사용해 호출할 method 구현을 선택하는 과정입니다.", detail: ["subclass override가 base 구현보다 먼저 선택됩니다.", "instance attribute에 callable을 둘 때도 lookup 세부를 고려합니다."] },
      ],
      codeExamples: [
        {
          id: "animal-polymorphic-loop",
          title: "구체 타입 분기 없이 세 동물 행동 호출",
          language: "python",
          filename: "animal_polymorphism.py",
          purpose: "Dog·Cat override와 Fish의 부모 fallback을 동일 loop에서 실행하고 반환값 중심 계약으로 개선합니다.",
          code: "class Animal:\n    def __init__(self, name):\n        self.name = name\n\n    def speak(self):\n        return f'{self.name}: 소리를 냅니다.'\n\nclass Dog(Animal):\n    def speak(self):\n        return f'{self.name}: 멍멍'\n\nclass Cat(Animal):\n    def speak(self):\n        return f'{self.name}: 야옹'\n\nclass Fish(Animal):\n    pass\n\nanimals = [Dog('몽실이'), Cat('첨지'), Fish('방울이')]\nfor animal in animals:\n    print(f'{type(animal).__name__} -> {animal.speak()}')\n\nprint([animal.name for animal in animals])",
          walkthrough: [
            { lines: "1-6", explanation: "base Animal은 모든 subclass가 공유할 name 초기화와 fallback speak 계약을 제공합니다." },
            { lines: "8-14", explanation: "Dog와 Cat은 같은 인수·반환 계약을 유지하며 내용만 override합니다." },
            { lines: "16-17", explanation: "Fish는 구현이 없어 MRO에서 Animal.speak를 재사용합니다." },
            { lines: "19-21", explanation: "하나의 loop가 runtime class별 method를 dispatch하고 type 이름은 관찰용으로만 출력합니다." },
            { lines: "23", explanation: "base에서 초기화한 공통 name invariant를 모든 객체가 유지합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "animal_polymorphism.py로 저장"], command: "python animal_polymorphism.py" },
          output: { value: "Dog -> 몽실이: 멍멍\nCat -> 첨지: 야옹\nFish -> 방울이: 소리를 냅니다.\n['몽실이', '첨지', '방울이']", explanation: ["Dog·Cat은 override 결과, Fish는 부모 fallback 결과를 반환합니다.", "loop에는 isinstance branch가 없습니다.", "세 객체 모두 base 생성자 name 계약을 만족합니다."] },
          experiments: [
            { change: "Bird(Animal)를 추가하고 speak를 override합니다.", prediction: "animals list에 넣기만 하면 loop 수정 없이 Bird 결과가 출력됩니다.", result: "caller가 공통 계약에 의존할 때 확장 지점이 열립니다." },
            { change: "Cat.speak signature를 speak(volume)로 바꿉니다.", prediction: "기존 animal.speak() loop에서 Cat만 TypeError가 납니다.", result: "이름이 같아도 호출 signature가 호환되지 않으면 substitutability가 깨집니다." },
          ],
          sourceRefs: ["py-animal-override-source", "python-class-doc"],
        },
      ],
      diagnostics: [
        { symptom: "공통 loop에서 특정 subclass만 TypeError 또는 AttributeError가 발생한다.", likelyCause: "override signature·return·초기화 상태가 base 계약과 호환되지 않습니다.", checks: ["base와 모든 override signature를 비교합니다.", "base type을 기대하는 같은 contract test를 각 subclass에 실행합니다.", "super 초기화와 required attribute를 확인합니다."], fix: "부모가 허용한 호출을 subclass도 받아들이고 필요한 invariant를 초기화하며 호환되는 결과를 반환하게 수정합니다.", prevention: "새 subclass를 공통 contract test suite에 자동 등록합니다." },
      ],
    },
    {
      id: "behavioral-contract",
      title: "좋은 override는 signature뿐 아니라 결과·예외·상태 의미까지 부모 계약을 지킵니다",
      lead: "부모 대신 subclass를 넣어도 caller의 정당한 기대가 깨지지 않아야 행동 하위 타입입니다.",
      explanations: [
        "부모 process(data)가 모든 bytes를 허용하는데 subclass가 ASCII만 허용하면 더 강한 사전조건을 요구해 기존 caller를 깨뜨립니다. 부모 withdraw가 잔액 부족에서 InsufficientFunds를 약속했는데 subclass가 KeyError를 던지면 예외 계약도 깨집니다.",
        "반환 type은 caller가 기대한 연산을 지원해야 합니다. base calculate가 float를 반환하는데 subclass가 화면에 print만 하고 None을 반환하면 같은 loop에서 합계를 낼 수 없습니다. 정적 type override 검사가 일부 signature를 찾지만 value 범위·부수 효과는 contract test가 필요합니다.",
        "subclass가 부모보다 더 적은 것을 요구하고 최소한 같은 것을 보장하는 방향이 대체 가능성에 유리합니다. 다만 Liskov 원칙을 기계적 문장으로만 적용하지 말고 실제 caller invariant·domain 의미를 정의합니다.",
        "override마다 docstring을 복사해 다른 의미를 숨기지 않습니다. base contract를 상속한다는 점과 달라지는 정책을 명시하고, 차이가 너무 크면 같은 계층이 아닌 별도 interface·composition을 선택합니다.",
      ],
      concepts: [
        { term: "behavioral subtyping", definition: "subclass 객체가 base가 약속한 입력·출력·예외·상태 의미를 지켜 base 대신 안전하게 사용될 수 있는 관계입니다.", detail: ["상속 문법만으로 자동 보장되지 않습니다.", "공통 contract test와 type 검사로 검증합니다."] },
        { term: "Liskov substitution", definition: "base type이 기대되는 위치에 subtype을 넣어도 프로그램의 올바른 성질이 깨지지 않아야 한다는 설계 원칙입니다.", detail: ["사전조건 강화와 사후조건 약화를 경계합니다.", "실제 domain 계약을 먼저 정의해야 합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "subclass를 넣으면 결과 type·예외·부수 효과가 달라 caller가 별도 분기를 요구한다.", likelyCause: "nominal 상속만 했고 행동 계약을 호환시키지 않았습니다.", checks: ["base caller가 의존하는 사전·사후조건을 적습니다.", "반환 type·None·예외 class·mutation을 subclass별 비교합니다.", "caller의 isinstance workaround를 찾습니다."], fix: "override를 base 계약에 맞추거나 의미가 본질적으로 다르면 별도 Protocol·composition·다른 type으로 분리합니다.", prevention: "base contract fixture를 모든 구현에 parameterized 실행하고 정적 override 검사를 CI에 둡니다." },
      ],
    },
    {
      id: "super-parent-reuse",
      title: "super는 부모 class 이름이 아니라 MRO의 다음 구현을 협력 호출합니다",
      lead: "override가 부모 행동을 전후로 확장할 때 super().method(...)를 사용하면 현재 class 다음 MRO 구현과 협력합니다.",
      explanations: [
        "원본 Manager.work는 super().info()로 name·salary를 먼저 출력한 뒤 team 관리 문장을 출력합니다. 부모 work를 확장하려는 의도라면 super().work()가 더 직접적일 수 있지만, 원본은 다른 부모 method도 재사용할 수 있음을 보여 줍니다. 어떤 계약을 확장하는지 명확히 선택합니다.",
        "super는 '직접 부모 호출'이라는 단순 표현보다 MRO의 다음 method proxy입니다. 다중 상속에서 Base.method(self)를 하드코딩하면 다른 mixin 구현을 건너뛰거나 두 번 호출할 수 있습니다. 협력적 chain의 모든 구현이 super를 호출하고 signature를 호환해야 합니다.",
        "부모 method가 값을 반환하면 override가 super 결과를 보존·변환·결합할지 결정합니다. super().save()를 호출하고 return을 잊으면 부모 ID가 None으로 사라집니다. 예외를 잡아 삼키면 부모 실패 계약도 바뀝니다.",
        "부모 method를 호출하기 전 subclass precondition, 호출 후 post-processing 순서는 invariant에 영향을 줍니다. transaction·lock·resource context를 부모가 관리하면 중간에서 side effect를 반복하지 않습니다. template method pattern으로 고정 flow와 override hook을 나누는 방법도 있습니다.",
      ],
      concepts: [
        { term: "super", definition: "현재 class와 instance context에서 MRO의 다음 구현을 찾아 호출하도록 돕는 proxy입니다.", detail: ["다중 상속의 협력적 호출에 중요합니다.", "부모 class 이름 하드코딩과 의미가 다릅니다."] },
        { term: "협력적 상속", definition: "MRO chain의 각 구현이 호환 signature로 super를 호출해 모든 참여자의 행동이 정확히 한 번 실행되도록 설계하는 방식입니다.", detail: ["모든 class가 같은 protocol에 동의해야 합니다.", "비협력 third-party class와 섞을 때 adapter가 필요할 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "employee-super-extension",
          title: "부모 반환값을 보존하며 역할별 행동 확장",
          language: "python",
          filename: "employee_override.py",
          purpose: "Employee 기본 work 결과를 Manager가 super로 확장하고 Intern이 완전히 대체하는 계약 차이를 출력합니다.",
          code: "class Employee:\n    def __init__(self, name, salary):\n        self.name = name\n        self.salary = salary\n\n    def work(self):\n        return [f'{self.name}: 기본 업무']\n\n    def annual_salary(self):\n        return self.salary * 12\n\nclass Manager(Employee):\n    def __init__(self, name, salary, team):\n        super().__init__(name, salary)\n        self.team = team\n\n    def work(self):\n        messages = super().work()\n        messages.append(f'{self.name}: {self.team} 관리')\n        return messages\n\nclass Intern(Employee):\n    def __init__(self, name, salary, duration):\n        super().__init__(name, salary)\n        self.duration = duration\n\n    def work(self):\n        return [f'{self.name}: 보조 업무 ({self.duration}개월)']\n\nemployees = [\n    Employee('김일반', 3000),\n    Manager('총무부', 4000, '개발팀'),\n    Intern('장길산', 2000, 6),\n]\nfor employee in employees:\n    print(' | '.join(employee.work()))\n    print(f'annual={employee.annual_salary()}')",
          walkthrough: [
            { lines: "1-10", explanation: "base가 name·salary invariant, list[str] work 반환, 공통 연봉 계산을 제공합니다." },
            { lines: "12-21", explanation: "Manager는 base 초기화와 work 결과를 super로 재사용하고 team 메시지를 추가해 같은 list[str] 계약을 유지합니다." },
            { lines: "23-29", explanation: "Intern은 초기화는 재사용하지만 work 행동은 완전히 대체하면서 같은 반환 구조를 지킵니다." },
            { lines: "30-37", explanation: "하나의 loop가 세 구현을 호출하고 inherited annual_salary를 분기 없이 사용합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "employee_override.py로 저장"], command: "python employee_override.py" },
          output: { value: "김일반: 기본 업무\nannual=36000\n총무부: 기본 업무 | 총무부: 개발팀 관리\nannual=48000\n장길산: 보조 업무 (6개월)\nannual=24000", explanation: ["Manager는 부모 list 결과를 잃지 않고 한 메시지를 확장합니다.", "Intern은 다른 내용이지만 list[str] 반환 계약을 유지합니다.", "세 객체 모두 부모 annual_salary를 재사용합니다."] },
          experiments: [
            { change: "Manager.work 마지막 return messages를 삭제합니다.", prediction: "join이 None을 받아 Manager에서만 TypeError가 납니다.", result: "부모 호출을 했다는 사실만으로 반환 계약이 자동 유지되지 않습니다." },
            { change: "Manager에서 super().work()를 Employee.work(self)로 바꿉니다.", prediction: "현재 단일 상속에서는 같지만 mixin이 MRO에 추가되면 중간 구현을 건너뛸 수 있습니다.", result: "협력적 확장 가능성이 있으면 class 이름 하드코딩보다 super가 적합합니다." },
          ],
          sourceRefs: ["py-employee-super-source", "python-super-doc"],
        },
      ],
      diagnostics: [
        { symptom: "override가 부모 작업을 실행했지만 caller가 받던 반환값이 None으로 바뀐다.", likelyCause: "super().method 결과를 받았지만 override에서 return하지 않았습니다.", checks: ["base와 override의 모든 return 경로를 비교합니다.", "super 호출 결과를 어디서 사용하는지 봅니다.", "예외를 잡아 반환값 없이 끝나는 경로를 찾습니다."], fix: "부모 반환 계약에 맞춰 결과를 그대로 return하거나 명시적으로 호환 변환한 값을 반환합니다.", prevention: "base caller 관점의 반환 type·값·예외 contract test를 모든 override에 실행합니다." },
      ],
    },
    {
      id: "abc-protocol-duck-typing",
      title: "공통 행동 계약은 상속 계층 없이 ABC·Protocol·duck typing으로도 표현할 수 있습니다",
      lead: "다형성의 핵심은 같은 행동 계약이지 반드시 같은 base class의 data와 구현을 공유하는 것은 아닙니다.",
      explanations: [
        "duck typing에서는 객체가 speak method를 올바르게 제공하면 Animal을 상속하지 않아도 caller가 사용할 수 있습니다. 유연하지만 오류가 실제 호출까지 늦어질 수 있습니다. 명확한 문서와 test가 필요합니다.",
        "abc.ABC와 @abstractmethod는 nominal subclass가 필수 method를 구현하지 않으면 instance 생성을 막습니다. 공통 runtime skeleton과 등록 관계가 중요할 때 적합합니다. abstractmethod도 base 구현을 가질 수 있고 subclass가 super로 재사용할 수 있습니다.",
        "typing.Protocol은 구조적으로 필요한 method signature를 표현해 정적 type checker가 inheritance 없이 호환성을 검사하게 합니다. @runtime_checkable isinstance는 attribute 존재 수준이며 상세 signature·의미를 runtime에서 완전히 검증하지 않습니다.",
        "공통 data·invariant·implementation 재사용이 적으면 Protocol과 composition이 깊은 inheritance보다 결합이 낮습니다. 반대로 template flow와 공통 state가 강하면 ABC가 자연스러울 수 있습니다.",
      ],
      concepts: [
        { term: "duck typing", definition: "구체 class 계보보다 객체가 실제로 필요한 행동을 제공하는지에 의존하는 Python식 다형성입니다.", detail: ["상속 없는 객체도 참여할 수 있습니다.", "행동 의미는 문서·test·type Protocol로 보강합니다."] },
        { term: "Protocol", definition: "명시 inheritance 없이 필요한 attribute와 method signature를 구조적으로 표현하는 typing 계약입니다.", detail: ["정적 검사에 유용합니다.", "runtime semantic validation을 대체하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "상속하지 않은 객체도 우연히 method 이름은 맞지만 반환 의미가 달라 runtime에서 실패한다.", likelyCause: "duck typing을 이름 존재만으로 해석하고 signature·반환·예외 계약을 검증하지 않았습니다.", checks: ["Protocol signature와 실제 구현 annotation을 비교합니다.", "공통 contract test를 해당 객체에도 실행합니다.", "반환 shape와 side effect를 확인합니다."], fix: "Protocol·ABC 또는 adapter로 계약을 명시하고 모든 구현에 같은 행동 test를 적용합니다.", prevention: "public extension point에 interface 문서·type checking·conformance test kit를 제공합니다." },
      ],
    },
    {
      id: "contract-tests-for-implementations",
      title: "공통 contract test를 모든 구현에 반복 적용해 다형성의 의미를 고정합니다",
      lead: "각 subclass의 개별 예제만 검사하면 모두 통과해도 base caller가 기대하는 공통 성질이 서로 달라질 수 있습니다.",
      explanations: [
        "contract test는 base interface를 사용하는 caller 관점에서 허용 입력, 반환 type·범위, 예외 분류, 입력 mutation, 반복 호출 같은 공통 행동을 정의합니다. 구현 factory 목록을 parameterize해 Dog·Cat·Fish 또는 모든 shipping policy에 같은 assertion을 실행합니다. 새 subclass가 등록되면 기존 계약을 자동으로 다시 검증합니다.",
        "구현별 고유 행동 test도 필요합니다. 공통 suite는 모든 speak가 non-empty str을 반환한다는 성질을 검사하고 Dog test는 '멍멍' 정책을 검사할 수 있습니다. 공통 계약과 구체 정책을 한 test에 섞으면 base 의미가 특정 subclass에 끌려갑니다.",
        "mutation과 예외도 결과값만큼 중요합니다. 부모가 입력 object를 보존한다면 호출 전후 deep equality를 비교하고, 부모가 DomainError를 약속하면 모든 구현의 같은 실패가 그 계층으로 나타나는지 검사합니다. 실행 시간·I/O 같은 비기능 계약은 완전히 동일하게 강제하기보다 timeout·resource budget으로 별도 측정합니다.",
        "type checker는 override 이름·signature·return annotation 불일치를 일찍 찾지만 실제 값 범위와 side effect를 실행하지 않습니다. 정적 검사, 공통 contract test, 구현별 unit test, 외부 adapter integration test를 층으로 나눠야 다형성 회귀를 줄일 수 있습니다.",
      ],
      concepts: [
        { term: "contract test", definition: "공통 interface의 모든 구현이 동일한 행동 약속을 지키는지 같은 assertion suite로 검증하는 test입니다.", detail: ["factory·fixture를 parameterize해 구현을 교체합니다.", "signature뿐 아니라 결과·예외·mutation·경계를 검사합니다."] },
        { term: "conformance suite", definition: "외부 plugin이나 adapter 구현자가 host의 공개 protocol을 만족하는지 검증할 수 있도록 제공하는 재사용 가능한 test 묶음입니다.", detail: ["version별 요구 사항을 고정합니다.", "보안 sandbox·timeout test와 함께 제공할 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "각 subclass unit test는 통과하지만 공통 caller에 함께 넣으면 일부만 실패한다.", likelyCause: "구현별 happy path만 검사하고 base 행동 계약을 동일 suite로 실행하지 않았습니다.", checks: ["caller가 의존하는 공통 assertion 목록을 적습니다.", "각 구현의 반환·예외·mutation·빈 입력을 표로 비교합니다.", "새 구현이 contract suite에 자동 포함되는지 확인합니다."], fix: "base caller 관점의 parameterized contract test를 만들고 모든 현재·plugin 구현에 실행합니다.", prevention: "interface version과 함께 conformance suite를 배포하고 새 구현 등록 조건에 통과를 포함합니다." },
      ],
    },
    {
      id: "composition-and-extension-safety",
      title: "행동을 교체·조합하는 변화 축에는 상속보다 composition이 더 단순할 수 있습니다",
      lead: "is-a 관계가 약하고 정책 조합이 많다면 subclass 수를 늘리기보다 협력 객체를 주입합니다.",
      explanations: [
        "알림 channel EmailEmployee·SmsEmployee·SlackManager처럼 역할과 전송 정책 두 축을 상속으로 조합하면 class 폭발과 diamond가 생깁니다. Employee가 Notifier Protocol을 받아 work 후 notifier.send를 호출하면 역할과 channel을 독립적으로 교체할 수 있습니다.",
        "composition은 runtime에 fake dependency를 주입해 test하기 쉽고 외부 I/O·retry·rate limit를 domain entity에서 분리합니다. 하지만 위임 boilerplate와 객체 graph 구성이 늘 수 있습니다. 단순 공통 구현 재사용에는 얕은 상속이 더 명확할 수 있습니다.",
        "plugin class를 외부 문자열로 import해 polymorphism에 넣으면 arbitrary code execution 위험이 있습니다. 허용된 plugin ID→factory registry를 사용하고 signature·version·권한·resource limit를 검증합니다. override는 trust boundary를 없애지 않습니다.",
        "override chain이 길면 실제 실행 구현과 super 순서를 이해하기 어렵습니다. MRO를 출력해야만 기본 행동을 알 수 있다면 계층을 얕게 만들고 composition·명시 pipeline으로 전환할 신호입니다.",
      ],
      concepts: [
        { term: "composition", definition: "객체가 다른 객체를 소유·주입받아 필요한 행동을 위임하는 has-a 설계입니다.", detail: ["정책을 runtime에 조합할 수 있습니다.", "상속 계보와 독립적으로 교체·test할 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "다형성을 어떤 구조로 만들까요?", options: [
          { name: "상속 + override", chooseWhen: "안정적인 is-a 관계, 공통 invariant·template flow·구현 재사용이 강할 때", avoidWhen: "서로 독립적인 정책 축을 모든 조합 subclass로 만들 때", tradeoffs: ["호출 API가 자연스럽습니다.", "base 변경이 전체 계층에 영향을 줍니다.", "MRO·super 계약이 필요합니다."] },
          { name: "Protocol + composition", chooseWhen: "행동 capability가 핵심이고 구현 교체·조합·test double이 필요할 때", avoidWhen: "공통 state와 lifecycle을 매번 위임해야 해 중복이 큰 경우", tradeoffs: ["결합이 낮고 runtime 조합이 쉽습니다.", "object wiring과 위임 코드가 늘 수 있습니다.", "구조적 계약의 의미를 test해야 합니다."] },
          { name: "명시 분기/dispatch table", chooseWhen: "작고 닫힌 종류 집합을 data-driven function으로 처리할 때", avoidWhen: "각 종류 state와 행동이 계속 성장하고 plugin 확장이 필요할 때", tradeoffs: ["flow가 한눈에 보입니다.", "종류 추가 때 중앙 table을 수정합니다.", "구조 분해는 match와 함께 사용할 수 있습니다."] },
        ] },
      ],
      expertNotes: ["Python 3.12+ typing.override decorator와 type checker를 사용하면 base method 오타·signature 불일치를 더 일찍 찾을 수 있지만 runtime 행동 계약 test는 여전히 필요합니다.", "외부 plugin override에는 timeout·memory·I/O 권한·process isolation을 적용하고 plugin 예외가 host invariant를 깨지 않게 transaction boundary를 둡니다."],
    },
  ],
  lab: {
    title: "배송비 정책 다형성과 contract test",
    scenario: "일반·냉장·해외 배송 정책을 같은 quote(order) 계약으로 구현하고 상속·Protocol+composition 두 설계를 비교합니다.",
    setup: ["shipping.py와 test_shipping_contract.py를 만듭니다.", "Order는 weight·subtotal·destination·temperature flag를 가진 합성 data입니다.", "모든 quote는 음수가 아닌 Decimal 금액과 설명을 반환합니다."],
    steps: ["ShippingPolicy Protocol 또는 ABC에 quote(order) 호출·반환·예외 계약을 정의합니다.", "Standard·ColdChain·International 구현을 만들고 구체 타입 분기 없는 loop에서 호출합니다.", "공통 base fee가 있다면 super로 재사용할지 주입된 FeeCalculator로 composition할지 비교합니다.", "subclass가 더 강한 사전조건을 요구하거나 None을 반환하는 실패 구현을 만들어 contract test가 잡는지 확인합니다.", "지원하지 않는 destination·0 weight·최대 weight·bool weight·currency를 경계로 둡니다.", "모든 구현에 같은 parameterized contract test를 실행합니다.", "새 Express 정책을 caller 수정 없이 추가합니다.", "외부 plugin 정책은 whitelist factory·timeout·오류 격리 설계를 추가합니다."],
    expectedResult: ["caller는 정책 구체 class를 if로 분기하지 않습니다.", "모든 구현이 같은 입력 signature와 반환 구조·예외 분류를 지킵니다.", "부모 결과를 확장하는 구현은 return을 잃지 않습니다.", "새 정책 추가가 기존 caller와 다른 구현을 바꾸지 않습니다.", "상속과 composition 선택 근거가 state·변화 축·test 관점으로 기록됩니다."],
    cleanup: ["외부 배송 API를 호출하지 않고 합성 order만 사용합니다."],
    extensions: ["실제 carrier API adapter를 Protocol로 주입합니다.", "currency 환율 snapshot과 quote 유효 시간을 계약에 넣습니다.", "async quote와 timeout/cancellation contract를 설계합니다.", "plugin conformance test kit와 semantic version matrix를 만듭니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 Animal과 Employee 예제를 반환값 중심으로 재작성하고 dispatch 표를 만드세요.", requirements: ["Dog·Cat override와 Fish fallback을 같은 loop에서 실행합니다.", "각 runtime type과 선택된 method 정의 class를 기록합니다.", "Manager super 확장과 Intern 완전 대체를 비교합니다.", "모든 work/speak 반환 type을 통일합니다.", "override에서 return을 빠뜨린 실패를 재현합니다."], hints: ["type(obj).mro()와 method.__qualname__을 관찰할 수 있습니다.", "print는 caller UI layer로 옮깁니다."], expectedOutcome: "override 선택·부모 fallback·super 확장·반환 계약을 실행 결과로 설명합니다.", solutionOutline: ["원본을 먼저 실행합니다.", "출력 method를 str 반환으로 바꿉니다.", "공통 loop와 contract assertion을 만듭니다."] },
    { difficulty: "응용", prompt: "여러 문서 renderer를 Protocol 기반으로 구현하세요.", requirements: ["render(document)->str 계약으로 Html·Markdown·Plain renderer를 만듭니다.", "같은 contract test를 모두 실행합니다.", "unsupported node 예외와 escaping·empty document 계약을 통일합니다.", "공통 escaping을 상속 또는 composition으로 재사용하고 근거를 씁니다.", "새 JSON renderer를 caller 수정 없이 추가합니다."], hints: ["같은 method 이름만으로 HTML 안전 계약이 자동 보장되지 않습니다.", "escaping strategy는 주입 가능한 dependency가 될 수 있습니다."], expectedOutcome: "구조적 다형성과 보안 결과 계약을 함께 검증합니다." },
    { difficulty: "설계", prompt: "서드파티 결제 plugin extension point를 설계하세요.", requirements: ["authorize·capture·refund Protocol과 결과·예외·idempotency 계약을 정의합니다.", "상속 base skeleton과 composition adapter 대안을 비교합니다.", "plugin ID whitelist·signature·version·권한·secret 주입을 설계합니다.", "timeout·retry·circuit breaker·transaction rollback을 포함합니다.", "공통 conformance·fault injection·sandbox test kit를 제공합니다.", "host가 plugin traceback·민감 card data를 로그에 남기지 않게 합니다."], hints: ["override는 보안 격리나 transaction을 자동 제공하지 않습니다.", "부모보다 더 강한 입력 제약이 기존 merchant caller를 깨뜨릴 수 있습니다."], expectedOutcome: "다형성을 공개 확장 API의 호환성·보안·운영 계약으로 확장합니다." },
  ],
  reviewQuestions: [
    { question: "같은 class에 같은 이름 method를 signature만 달리 두면 overload되나요?", answer: "아닙니다. class namespace에서 마지막 def가 같은 이름을 다시 bind해 이전 구현을 덮습니다." },
    { question: "Fish가 speak를 override하지 않으면 어떤 구현이 호출되나요?", answer: "Fish MRO에서 다음으로 찾은 Animal.speak 부모 구현이 호출됩니다." },
    { question: "다형성 loop가 구체 타입 if 분기보다 어떤 장점이 있나요?", answer: "caller가 공통 계약에만 의존해 새 구현을 추가해도 loop를 수정하지 않을 수 있습니다." },
    { question: "override signature가 다르면 Python interpreter가 항상 class 정의 때 막나요?", answer: "아닙니다. 실행 시 특정 호출에서 실패할 수 있으므로 type checker와 contract test가 필요합니다." },
    { question: "super는 항상 직접 부모 class를 뜻하나요?", answer: "아닙니다. 현재 class와 instance context에서 MRO의 다음 구현을 찾는 proxy입니다." },
    { question: "super method를 호출한 뒤 return을 생략하면 부모 반환값이 자동 전달되나요?", answer: "아닙니다. override가 명시적으로 반환하지 않으면 None입니다." },
    { question: "Protocol 다형성에 명시 상속이 필요한가요?", answer: "구조적으로 필요한 attribute·method를 제공하면 명시 상속 없이 정적 호환으로 볼 수 있습니다." },
    { question: "언제 composition이 상속보다 나을 수 있나요?", answer: "is-a 관계가 약하고 독립 정책을 runtime에 교체·조합하거나 I/O dependency를 격리해야 할 때 유리합니다." },
  ],
  completionChecklist: [
    "Python의 이름 재binding과 subclass overriding을 구분할 수 있다.",
    "runtime type·MRO에 따른 dynamic dispatch를 추적할 수 있다.",
    "override의 signature·반환·예외·mutation 계약을 비교할 수 있다.",
    "super로 부모 결과를 보존하며 전후 행동을 확장할 수 있다.",
    "협력적 super와 class 이름 하드코딩의 MRO 차이를 설명할 수 있다.",
    "ABC·Protocol·duck typing의 계약·검사 시점을 비교할 수 있다.",
    "공통 contract test를 모든 구현에 parameterized 실행할 수 있다.",
    "상속·composition·dispatch table을 변화 축과 보안 경계에 맞게 선택할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-overload-default-source", repository: "PYTHON-BASIC", path: "day06/ex13_class.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex13_class.py", usedFor: ["overload 개념", "기본값 대안", "같은 method 이름"], evidence: "원본을 실행해 add(10,20,10)=40과 기본 num3=5인 add(1,2)=8을 확인하고 runtime overload와 구분했습니다." },
    { id: "py-overload-varargs-source", repository: "PYTHON-BASIC", path: "day06/ex14_class.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex14_class.py", usedFor: ["*args 대안", "가변 개수 합계"], evidence: "원본의 1·2·3·4개 인수 합계 40·3·1·90을 확인하고 빈 입력·type 계약 보강에 사용했습니다." },
    { id: "py-animal-override-source", repository: "PYTHON-BASIC", path: "day06/ex15_class.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex15_class.py", usedFor: ["Dog·Cat override", "Fish 부모 fallback", "공통 info"], evidence: "원본을 실행해 몽실이·첨지의 override 소리, 방울이의 Animal fallback과 세 info 출력을 확인했습니다." },
    { id: "py-employee-super-source", repository: "PYTHON-BASIC", path: "day06/ex16_class.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex16_class.py", usedFor: ["Employee base", "Manager·Intern override", "super 초기화", "부모 method 재사용"], evidence: "원본을 실행해 Employee·Manager·Intern work/info와 salary·team·duration 결과를 확인하고 반환 계약 중심으로 확장했습니다." },
    { id: "python-class-doc", repository: "Python documentation", path: "tutorial/classes.html#inheritance", publicUrl: "https://docs.python.org/3/tutorial/classes.html#inheritance", usedFor: ["method lookup", "inheritance", "override", "다형성"], evidence: "공식 class inheritance 설명을 runtime lookup과 override 기준으로 사용했습니다." },
    { id: "python-super-doc", repository: "Python documentation", path: "library/functions.html#super", publicUrl: "https://docs.python.org/3/library/functions.html#super", usedFor: ["super proxy", "MRO", "협력적 호출"], evidence: "공식 super 계약을 직접 부모 호출 오해와 다중 상속 협력 설명의 기준으로 사용했습니다." },
  ],
  sourceCoverage: { filesRead: 4, filesUsed: 4, uncoveredNotes: ["abstract base class와 Protocol의 API 전체는 타입/architecture 심화 세션에서 더 확장할 수 있습니다.", "행동 하위 타입·contract test·composition·plugin isolation은 원본 override 예제를 전문가 공개 확장 설계로 보강한 내용입니다."] },
} satisfies DetailedSession;

export default session;

const advancedPolymorphismChapters: DetailedSession["chapters"] = [
  {
    id: "lsp-contracts-structural-protocols",
    title: "LSP를 signature가 아니라 precondition·postcondition·error·state contract로 검사합니다",
    lead: "override method 이름이 같다는 사실만으로 substitutable하지 않으며 caller가 기대하는 입력 범위와 결과·예외·부작용을 자식이 깨지 않아야 합니다.",
    explanations: [
      "Liskov substitution 관점에서 subtype은 base가 허용한 입력을 더 좁게 거부하지 않고, 약속한 결과를 최소한 충족하며, base invariant를 보존해야 합니다. parameter 이름·개수만 맞추는 검사는 충분하지 않습니다.",
      "override가 더 강한 precondition을 요구하면 base client가 정상 전달한 값에서 자식만 실패합니다. 반대로 postcondition을 약화해 None이나 다른 단위를 반환하면 caller의 후속 연산이 깨집니다.",
      "예외도 public contract입니다. base가 invalid input에 ValueError를 약속했는데 subclass가 KeyError·network exception을 새로 노출하면 caller의 recovery가 무너질 수 있습니다. 원인을 보존하면서 boundary exception으로 변환합니다.",
      "state mutation·I/O·성능도 상황에 따라 behavioral contract입니다. read-only query override가 파일을 삭제하거나 O(1) 기대를 무제한 network scan으로 바꾸면 타입상 호환돼도 대체 가능하지 않습니다.",
      "`typing.Protocol`은 명시 inheritance 없이 필요한 attributes·methods를 가진 객체를 structural subtype으로 표현합니다. application service가 concrete base class 대신 작은 Protocol을 받으면 third-party adapter와 fake가 쉽게 참여합니다.",
      "`@runtime_checkable` Protocol의 isinstance는 required attribute 존재를 단순 검사하며 method signature·return type·semantic behavior를 검증하지 않습니다. static checker와 contract tests를 함께 사용합니다.",
      "Protocol을 거대한 interface로 만들면 구현과 fake가 불필요한 methods에 결합됩니다. 소비자 관점의 작은 capability로 나누고 실제 호출하는 operations만 선언합니다.",
      "duck typing도 실패를 늦추라는 뜻이 아닙니다. system boundary에서 configuration·capability를 검증하고 core loop에는 명확한 typed contract를 전달합니다.",
    ],
    concepts: [
      { term: "Liskov substitution principle", definition: "하위 타입을 상위 타입 대신 사용해도 프로그램이 기대한 행동 계약이 유지되어야 한다는 원칙입니다.", detail: ["pre/postconditions와 invariant를 포함합니다.", "signature 일치보다 넓습니다."] },
      { term: "structural subtyping", definition: "명시적 상속보다 필요한 member 구조를 만족하는지로 subtype 관계를 판단하는 방식입니다.", detail: ["typing.Protocol이 지원합니다.", "runtime semantics는 별도 test가 필요합니다."] },
      { term: "behavioral contract", definition: "입력·결과·오류·상태 변화·resource 특성에 대한 caller와 implementation의 약속입니다.", detail: ["모든 구현에 같은 suite를 적용합니다.", "문서와 tests로 유지합니다."] },
    ],
    codeExamples: [{
      id: "python-runtime-protocol-contract",
      title: "상속하지 않은 renderer를 Protocol 소비 함수와 runtime shape 검사에 사용합니다",
      language: "python",
      filename: "renderer_protocol.py",
      purpose: "structural interface가 nominal base 없이 작동하되 consumer가 result invariant를 별도로 검증하는 모습을 보여 줍니다.",
      code: "from typing import Protocol, runtime_checkable\n\n@runtime_checkable\nclass Renderer(Protocol):\n    def render(self, payload: dict) -> str:\n        ...\n\nclass TextRenderer:\n    def render(self, payload: dict) -> str:\n        parts = [f'{key}={payload[key]}' for key in sorted(payload)]\n        return ','.join(parts)\n\ndef publish(renderer: Renderer, payload: dict) -> str:\n    result = renderer.render(payload)\n    if not isinstance(result, str):\n        raise TypeError('renderer must return str')\n    return result\n\nrenderer = TextRenderer()\nprint(f'runtime={isinstance(renderer, Renderer)}|output={publish(renderer, {\"score\": 90, \"name\": \"Kim\"})}')",
      walkthrough: [
        { lines: "1-6", explanation: "runtime-checkable Protocol이 소비자가 필요한 render signature만 선언합니다." },
        { lines: "8-11", explanation: "TextRenderer는 Protocol을 상속하지 않고 같은 capability를 구조적으로 제공합니다." },
        { lines: "13-17", explanation: "consumer는 static type과 별개로 중요한 return invariant를 runtime boundary에서 확인합니다." },
        { lines: "19-20", explanation: "structural runtime check와 deterministic sorted output을 함께 출력합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 라이브러리 typing"], command: "python renderer_protocol.py" },
      output: { value: "runtime=True|output=name=Kim,score=90", explanation: ["TextRenderer는 Renderer를 명시 상속하지 않아도 required method를 가집니다.", "runtime protocol check는 shape를 보고 publish가 return str invariant를 확인합니다."] },
      experiments: [
        { change: "render attribute가 문자열인 객체를 만듭니다.", prediction: "runtime Protocol check가 attribute 존재만 보고 통과할 가능성이 있어 실제 호출은 실패합니다.", result: "runtime_checkable을 완전한 validation으로 사용하지 않습니다." },
        { change: "render가 None을 반환하게 합니다.", prediction: "publish의 postcondition 검사에서 TypeError가 납니다.", result: "behavioral contract를 boundary에 둡니다." },
        { change: "Protocol에 close method까지 추가합니다.", prediction: "필요하지 않은 capability 때문에 기존 renderer와 fakes가 불필요하게 결합됩니다.", result: "consumer별 작은 Protocol을 유지합니다." },
      ],
      sourceRefs: ["python-protocol-032", "pep544-032", "python-class-doc"],
    }],
    diagnostics: [
      { symptom: "subclass가 base type test는 통과하지만 정상 base 입력에서만 실패합니다.", likelyCause: "override가 더 강한 precondition을 추가해 LSP를 위반했습니다.", checks: ["base contract의 입력 domain을 표로 만듭니다.", "모든 implementation에 같은 cases를 실행합니다.", "새 validation·exception을 비교합니다."], fix: "base 입력 전체를 지원하거나 더 좁은 behavior는 별도 타입·method로 분리합니다.", prevention: "base contract suite를 모든 subclasses/adapters에 parameterize합니다." },
      { symptom: "runtime Protocol isinstance는 True인데 method 호출이 TypeError를 냅니다.", likelyCause: "runtime_checkable은 member 존재만 단순 검사하고 signature·타입·동작을 확인하지 않습니다.", checks: ["attribute가 callable인지 봅니다.", "static type checker 결과를 확인합니다.", "실제 contract suite를 실행합니다."], fix: "Protocol을 static typing에 사용하고 system boundary에는 명시 validation·adapter·behavior tests를 둡니다.", prevention: "bad shape와 bad behavior fakes를 negative tests에 포함합니다." },
    ],
  },
  {
    id: "abc-template-method-super-hooks",
    title: "ABC와 template method로 workflow는 고정하고 override hook만 확장합니다",
    lead: "base가 알고리즘 순서·공통 invariant를 소유하고 subclass는 작은 abstract hook만 구현하면 parent 재사용과 확장 지점이 명확해집니다.",
    explanations: [
      "ABCMeta와 `@abstractmethod`는 필수 operations를 구현하지 않은 class의 instance화를 막습니다. 문서와 static type만이 아니라 nominal runtime contract가 필요한 framework extension point에 적합합니다.",
      "template method는 public workflow를 concrete base method에 두고 normalize→validate→serialize 같은 순서를 고정합니다. subclasses는 hook만 override해 공통 validation·metrics·cleanup을 우회하지 않습니다.",
      "abstract method도 기본 implementation을 가질 수 있고 subclass가 `super().hook()`으로 공통 normalization을 재사용한 뒤 결과를 확장할 수 있습니다. abstract라는 말이 body가 없어야 한다는 뜻은 아닙니다.",
      "hook contract에는 input ownership, mutation 허용, return type, 호출 횟수와 exception을 적습니다. base가 같은 dict를 여러 hook에 공유하면 subclass mutation이 다음 단계에 영향을 주므로 copy·immutable value를 고려합니다.",
      "template method가 너무 많은 protected hooks와 boolean flags를 가지면 fragile base class가 됩니다. workflow 변화 자체가 필요하면 subclass보다 strategy pipeline composition으로 전환합니다.",
      "`super()` 재사용은 부모 class 이름을 직접 적지 않아 hierarchy refactor와 MRO 협력을 유지합니다. 다만 base hook 반환값을 무시하거나 두 번 호출하면 postcondition·side effect가 깨집니다.",
      "ABC registration이나 `__subclasshook__`으로 virtual subclass를 만들 수 있지만 implementation을 상속하지 않고 contract 보장도 자동 검사하지 않습니다. 명시적 Protocol·adapter가 더 읽기 쉬운지 비교합니다.",
    ],
    concepts: [
      { term: "template method", definition: "알고리즘의 전체 순서는 base concrete method가 정의하고 일부 단계를 override hook으로 위임하는 패턴입니다.", detail: ["공통 invariant를 중앙화합니다.", "hook 범위를 작게 유지합니다."] },
      { term: "abstract base class", definition: "필수 abstract members를 선언해 구현되지 않은 class의 instance화를 막는 nominal interface입니다.", detail: ["abc 모듈이 제공합니다.", "abstract method에도 공통 body가 있을 수 있습니다."] },
      { term: "override hook", definition: "subclass가 제한된 customization을 제공하도록 base가 의도적으로 노출한 method입니다.", detail: ["input·output 계약을 문서화합니다.", "workflow 전체를 우회하지 않습니다."] },
    ],
    codeExamples: [{
      id: "python-abc-template-super-hook",
      title: "base export workflow와 normalize 기본 구현을 super로 재사용합니다",
      language: "python",
      filename: "export_template.py",
      purpose: "ABC가 serialize hook을 강제하고 subclass가 base normalization을 확장하면서 public workflow 순서를 보존하는지 확인합니다.",
      code: "from abc import ABC, abstractmethod\n\nclass Exporter(ABC):\n    def export(self, rows):\n        normalized = [self.normalize(row) for row in rows]\n        return self.serialize(normalized)\n\n    def normalize(self, row):\n        return {key: str(value).strip() for key, value in row.items()}\n\n    @abstractmethod\n    def serialize(self, rows):\n        raise NotImplementedError\n\nclass PipeExporter(Exporter):\n    def normalize(self, row):\n        normalized = super().normalize(row)\n        normalized['name'] = normalized['name'].upper()\n        return normalized\n\n    def serialize(self, rows):\n        return '\\n'.join(f'{row[\"name\"]}|{row[\"score\"]}' for row in rows)\n\nexporter = PipeExporter()\nresult = exporter.export([{'name': ' Kim ', 'score': 90}, {'name': 'Lee', 'score': 85}])\nprint(f'result={result!r}')\nprint(f'abstract={sorted(Exporter.__abstractmethods__)}|type={type(exporter).__name__}')",
      walkthrough: [
        { lines: "1-13", explanation: "ABC의 concrete export가 workflow를 고정하고 normalize 기본 body와 abstract serialize hook을 제공합니다." },
        { lines: "15-22", explanation: "subclass는 super normalization을 한 번 재사용해 name만 확장하고 serialization을 구현합니다." },
        { lines: "24-27", explanation: "두 rows를 public template method로 처리하고 newline을 repr로 고정해 abstract metadata와 함께 출력합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 라이브러리 abc"], command: "python export_template.py" },
      output: { value: "result='KIM|90\\nLEE|85'\nabstract=['serialize']|type=PipeExporter", explanation: ["export는 모든 rows에 normalize 후 serialize 순서를 강제합니다.", "PipeExporter는 공통 strip 뒤 name uppercase만 추가합니다.", "serialize 구현으로 abstract contract를 완성합니다."] },
      experiments: [
        { change: "PipeExporter.serialize를 제거합니다.", prediction: "PipeExporter instance화가 TypeError로 실패합니다.", result: "필수 hook이 runtime에 강제됩니다." },
        { change: "normalize에서 super 호출을 제거합니다.", prediction: "공백 제거·문자열 변환 공통 contract가 사라집니다.", result: "parent reuse 여부를 override tests에 포함합니다." },
        { change: "export 자체를 subclass에서 override합니다.", prediction: "공통 workflow를 우회할 수 있어 invariant가 깨질 수 있습니다.", result: "public template override를 금지할지 문서·final convention으로 관리합니다." },
      ],
      sourceRefs: ["python-abc-032", "python-super-doc", "python-class-doc"],
    }],
    diagnostics: [
      { symptom: "새 exporter가 공통 validation과 metrics를 건너뜁니다.", likelyCause: "작은 serialize hook 대신 public template method 전체를 override했습니다.", checks: ["override 목록을 봅니다.", "base workflow call count를 기록합니다.", "공통 postcondition suite를 실행합니다."], fix: "workflow를 base concrete method에 두고 subclass가 필요한 abstract hook만 구현하게 합니다.", prevention: "template sequence와 공통 validation을 모든 implementations contract test에 둡니다." },
    ],
  },
  {
    id: "override-variance-covariant-results",
    title: "override의 parameter·return variance와 명시적 `@override` 검사를 적용합니다",
    lead: "subclass는 base보다 구체적인 return type을 제공할 수 있지만 허용 parameter를 임의로 좁히면 base caller가 깨지므로 variance를 호출 방향으로 이해해야 합니다.",
    explanations: [
      "return covariance는 base가 Animal을 약속할 때 subclass가 Dog처럼 더 구체적인 subtype을 반환해도 caller가 Animal로 사용할 수 있다는 뜻입니다. runtime dispatch는 실제 factory class의 override를 선택합니다.",
      "parameter는 반대 방향을 고려합니다. base method가 모든 Animal을 받는데 subclass가 Dog만 받도록 좁히면 Animal을 전달하는 기존 caller가 실패합니다. override는 같은 범위 또는 더 넓게 처리해야 substitutable합니다.",
      "mutable generic container는 읽기와 쓰기를 모두 허용해 일반적으로 invariant입니다. `list[Dog]`를 `list[Animal]`로 취급하면 Cat을 append할 수 있어 안전하지 않습니다. read-only Sequence와 type variables의 variance를 구분합니다.",
      "Python 3.12+의 `typing.override`는 runtime 동작을 바꾸지 않지만 type checker가 base member 오타·rename을 발견하게 합니다. decorator를 쓴 것만으로 LSP 행동이 검증되는 것은 아닙니다.",
      "return annotation은 실제 runtime value를 자동 검사하지 않습니다. contract boundary와 tests에서 isinstance·schema·postcondition을 검증하고 static checker를 함께 사용합니다.",
      "overload와 override를 구분합니다. `@overload` declarations는 한 function의 static call signatures를 설명하고 runtime implementation은 하나이며, override는 inheritance MRO에서 구현을 대체합니다.",
      "API evolution에서 base return을 넓히거나 parameter를 좁히면 subclasses와 callers 모두 영향을 받습니다. public Protocol·ABC와 implementations를 같은 type-check matrix로 검사합니다.",
    ],
    concepts: [
      { term: "covariant return", definition: "override가 base return type보다 더 구체적인 subtype을 반환해도 안전한 관계입니다.", detail: ["caller는 여전히 base type으로 사용할 수 있습니다.", "postcondition을 강화합니다."] },
      { term: "parameter contravariance", definition: "subtype 구현이 base caller가 허용한 입력을 좁히지 않고 같거나 더 넓게 받아야 한다는 방향입니다.", detail: ["Dog-only narrowing은 위험합니다.", "static checker가 진단할 수 있습니다."] },
      { term: "typing.override", definition: "method가 base의 member를 의도적으로 override한다는 표시로 type checker가 이름·signature drift를 찾게 하는 decorator입니다.", detail: ["runtime dispatch는 바꾸지 않습니다.", "behavior test를 대신하지 않습니다."] },
    ],
    codeExamples: [{
      id: "python-covariant-factory-override",
      title: "base Animal return을 Dog return으로 좁힌 factory override를 같은 caller에서 사용합니다",
      language: "python",
      filename: "covariant_factory.py",
      purpose: "@override와 dynamic dispatch, covariant result가 base contract consumer에서 안전하게 작동하는지 exact 확인합니다.",
      code: "from typing import override\n\nclass Animal:\n    def __init__(self, name):\n        self.name = name\n\n    def speak(self):\n        return f'animal:{self.name}'\n\nclass Dog(Animal):\n    def speak(self):\n        return f'dog:{self.name}'\n\nclass Factory:\n    def create(self) -> Animal:\n        return Animal('generic')\n\nclass DogFactory(Factory):\n    @override\n    def create(self) -> Dog:\n        return Dog('Rex')\n\ndef describe(factory: Factory):\n    animal = factory.create()\n    return f'{type(animal).__name__}:{animal.speak()}:{isinstance(animal, Animal)}'\n\nprint(describe(Factory()))\nprint(describe(DogFactory()))",
      walkthrough: [
        { lines: "1-12", explanation: "Animal base와 더 구체적인 Dog가 같은 speak contract를 제공합니다." },
        { lines: "14-21", explanation: "Factory는 Animal, DogFactory override는 covariant Dog를 반환하도록 annotation합니다." },
        { lines: "23-28", explanation: "base Factory를 받는 caller가 dynamic result를 Animal contract로 사용해 두 구현 결과를 출력합니다." },
      ],
      run: { environment: ["Python 3.12 이상", "표준 라이브러리 typing.override"], command: "python covariant_factory.py" },
      output: { value: "Animal:animal:generic:True\nDog:dog:Rex:True", explanation: ["base factory는 Animal을 반환합니다.", "subclass override는 Dog를 반환하고 dynamic speak를 호출합니다.", "두 결과 모두 Animal contract를 만족합니다."] },
      experiments: [
        { change: "DogFactory.create가 str을 반환하게 합니다.", prediction: "type checker가 return incompatibility를 찾고 runtime caller의 speak가 실패합니다.", result: "static·behavior tests를 함께 둡니다." },
        { change: "base method가 Animal parameter를 받고 override가 Dog만 받게 합니다.", prediction: "base caller가 Cat을 전달할 때 subclass만 실패해 LSP를 위반합니다.", result: "override parameter를 좁히지 않습니다." },
        { change: "@override method 이름을 creat로 오타 냅니다.", prediction: "type checker가 base member를 override하지 않는다고 진단합니다.", result: "rename drift를 조기에 발견합니다." },
      ],
      sourceRefs: ["python-override-032", "typing-variance-032", "python-class-doc", "python-super-doc", "py-overload-default-source", "py-overload-varargs-source"],
    }],
    diagnostics: [
      { symptom: "override decorator가 있는데 production에서 반환 타입 오류가 납니다.", likelyCause: "annotation과 decorator를 runtime validation으로 오해했거나 type checker를 실행하지 않았습니다.", checks: ["type checker CI 결과를 확인합니다.", "실제 return type과 postcondition을 기록합니다.", "base contract suite를 모든 factories에 실행합니다."], fix: "static checker를 CI에 포함하고 system boundary·contract tests에서 runtime result를 검증합니다.", prevention: "정상·잘못된 implementation fixtures로 static 및 runtime negative tests를 둡니다." },
    ],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...advancedPolymorphismChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "python-protocol-032", repository: "Python Standard Library", path: "typing.Protocol and runtime_checkable", publicUrl: "https://docs.python.org/3/library/typing.html#typing.Protocol", usedFor: ["structural subtyping", "runtime_checkable", "consumer protocols", "generic protocols"], evidence: "Protocol의 static structural typing과 runtime check 한계를 공식 문서로 확인했습니다." },
  { id: "pep544-032", repository: "Python Enhancement Proposals", path: "PEP 544 Protocols: Structural subtyping", publicUrl: "https://peps.python.org/pep-0544/", usedFor: ["protocol rationale", "subtyping", "runtime implementation", "variance"], evidence: "Python structural subtyping 설계와 Protocol 의미를 승인된 PEP 원문으로 확인했습니다." },
  { id: "python-abc-032", repository: "Python Standard Library", path: "abc — Abstract Base Classes", publicUrl: "https://docs.python.org/3/library/abc.html", usedFor: ["ABC", "abstractmethod", "abstract implementation", "virtual subclasses"], evidence: "abstract method와 instance화 제한·subclass hook 규칙을 공식 문서로 확인했습니다." },
  { id: "python-override-032", repository: "Python Standard Library", path: "typing.override", publicUrl: "https://docs.python.org/3/library/typing.html#typing.override", usedFor: ["override intent", "type checker diagnostics", "runtime marker"], evidence: "Python 3.12+ override decorator의 static 목적과 runtime 동작을 공식 문서로 확인했습니다." },
  { id: "typing-variance-032", repository: "Python Typing Specification", path: "Generics — Variance", publicUrl: "https://typing.python.org/en/latest/spec/generics.html#variance", usedFor: ["covariance", "contravariance", "invariance", "generic override compatibility"], evidence: "type parameter variance와 subtype 관계를 공식 Python typing specification으로 확인했습니다." },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "override signature가 같으면 LSP가 자동으로 성립하나요?", answer: "아닙니다. 입력 범위·결과·예외·상태 변화 같은 behavioral contract도 유지해야 합니다." },
  { question: "runtime_checkable Protocol isinstance가 method signature도 검사하나요?", answer: "아닙니다. required attribute 존재를 단순 검사하므로 static checker와 behavior test가 필요합니다." },
  { question: "ABC abstractmethod에도 공통 구현 body를 둘 수 있나요?", answer: "가능하며 subclass가 super로 그 구현을 재사용하면서 abstract contract를 완성할 수 있습니다." },
  { question: "template method의 장점은 무엇인가요?", answer: "공통 workflow 순서와 invariant는 base가 보존하고 subclass는 제한된 hook만 구현하게 합니다." },
  { question: "override return을 base보다 구체적인 subtype으로 바꿀 수 있나요?", answer: "caller가 base return으로 계속 사용할 수 있다면 covariant return으로 안전할 수 있습니다." },
  { question: "override parameter를 base보다 좁은 subtype만 받게 해도 되나요?", answer: "아닙니다. base caller의 정상 입력을 거부해 substitutability를 깨뜨릴 수 있습니다." },
  { question: "typing.override가 runtime dispatch를 바꾸나요?", answer: "아닙니다. override 의도를 type checker가 검증하도록 표시할 뿐 MRO dispatch 자체는 같습니다." },
);

(session.completionChecklist as string[]).push(
  "override를 pre/postcondition·exception·state contract로 검토한다.",
  "작은 Protocol로 structural dependency를 표현한다.",
  "runtime_checkable의 shape-only 한계를 설명한다.",
  "ABC template method와 abstract hook 책임을 분리한다.",
  "super로 base hook implementation을 한 번 재사용한다.",
  "covariant return과 parameter narrowing 위험을 구분한다.",
  "typing.override와 contract tests를 함께 적용한다.",
);
