import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-031"],
  slug: "python-031-inheritance-super-initialization",
  courseId: "python",
  moduleId: "03-oop-stdlib",
  order: 31,
  title: "상속·super·초기화 누락",
  subtitle: "부모 기능을 단순 복사로 오해하지 않고 MRO lookup과 생성 invariant를 이해해, subclass가 언제나 완전한 객체로 태어나도록 만듭니다.",
  level: "중급",
  estimatedMinutes: 145,
  coreQuestion: "subclass가 부모의 행동과 상태 계약을 재사용하면서도 __init__ override 때문에 필요한 attribute가 빠지거나 다중 상속 초기화가 중복되지 않게 어떻게 설계할까요?",
  summary: "Animal→Dog/Cat의 inherited method lookup, Person→Docter의 super().__init__ 호출과 누락 AttributeError를 원본 실행으로 분석합니다. subclass가 __init__을 정의하면 부모 생성자가 자동 호출되지 않는 사실, super가 MRO의 다음 구현을 호출하는 협력 protocol, diamond 다중 상속의 한 번씩 초기화를 재현합니다. is-a·substitutability, constructor signature, mixin과 composition 선택, immutable invariant·test·serialization bypass까지 확장합니다.",
  objectives: [
    "상속이 부모 attribute를 instance에 복사하는 것이 아니라 MRO를 통한 lookup 관계라는 점을 설명할 수 있다.",
    "is-a 관계와 단순 코드 재사용을 구분하고 subclass가 부모 caller를 대체할 수 있어야 하는 이유를 설명할 수 있다.",
    "subclass가 __init__을 정의할 때 부모 __init__이 자동 실행되지 않는다는 사실을 재현할 수 있다.",
    "super().__init__으로 부모 invariant를 초기화하고 subclass 고유 상태를 추가하는 순서를 설계할 수 있다.",
    "MRO를 읽고 super가 고정 직접 부모가 아니라 다음 구현을 호출한다는 점을 사용할 수 있다.",
    "다중 상속에서 호환 keyword signature와 모든 class의 super 호출로 각 초기화를 한 번씩 실행할 수 있다.",
    "상속·mixin·composition 중 관계와 변화 축에 적합한 구조를 선택하고 초기화 contract test를 작성할 수 있다.",
  ],
  prerequisites: [
    { title: "클래스·객체·생성자", reason: "__init__, self, instance attribute, class lookup을 바탕으로 subclass 생성 흐름을 확장합니다.", sessionSlug: "python-028-class-object-constructor" },
    { title: "인스턴스·클래스·정적 메서드", reason: "bound method와 class/instance attribute lookup을 MRO로 확장합니다.", sessionSlug: "python-029-instance-class-static-methods" },
  ],
  keywords: ["Python", "inheritance", "subclass", "super", "__init__", "MRO", "multiple inheritance", "diamond inheritance", "mixin", "composition", "invariant"],
  chapters: [
    {
      id: "inheritance-lookup-model",
      title: "상속은 코드 복사가 아니라 subclass에서 base class로 이어지는 attribute lookup 관계입니다",
      lead: "Dog instance에 eat가 직접 저장되지 않아도 Dog MRO를 따라 Animal.eat를 찾아 bound method로 호출할 수 있습니다.",
      explanations: [
        "원본 ex10의 Dog와 Cat은 Animal을 상속하고 sound만 직접 정의합니다. dog.eat()를 호출하면 먼저 dog instance, Dog class, Animal class 순서로 eat를 찾아 Animal.eat function을 dog에 bind합니다. 부모 method가 자식 class source에 복사된 것은 아닙니다.",
        "Dog.eat를 새로 정의하면 Animal.eat를 가리고 override가 됩니다. Animal.eat를 나중에 변경하면 override하지 않은 subclass는 새 행동을 lookup하지만 이미 override한 subclass는 자기 구현을 유지합니다. base 변경 영향이 계층 전체에 퍼질 수 있어 public contract와 test가 필요합니다.",
        "issubclass(Dog, Animal)과 isinstance(dog, Animal)은 nominal 관계를 확인합니다. 그러나 문법상 상속했다고 행동 의미가 자동으로 맞는 것은 아닙니다. Animal을 기대하는 caller가 Dog를 넣어도 올바르게 동작하는 is-a 관계인지 domain에서 검토합니다.",
        "공통 method 두 개를 재사용하려고 의미상 무관한 class를 상속하면 base state·future change까지 강하게 결합됩니다. 재사용 helper function, composition, Protocol이 더 정확할 수 있습니다.",
      ],
      concepts: [
        { term: "inheritance", definition: "subclass가 base class의 attribute lookup 관계와 type 관계에 참여해 상태·행동 contract를 재사용·확장하는 구조입니다.", detail: ["source code 복사가 아닙니다.", "MRO가 lookup 순서를 결정합니다."] },
        { term: "is-a relationship", definition: "subclass 객체를 base type이 기대되는 곳에 의미상 대체할 수 있는 domain 관계입니다.", detail: ["문법상 subclass만으로 충분하지 않습니다.", "입력·출력·예외·invariant 호환이 필요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "부모 method를 고쳤는데 일부 subclass만 동작이 달라지거나 그대로다.", likelyCause: "일부 subclass가 해당 이름을 override해 MRO에서 부모 구현을 가리고 있습니다.", checks: ["type(obj).mro()를 확인합니다.", "각 class __dict__에 method 이름이 있는지 봅니다.", "obj.method.__func__.__qualname__으로 선택 구현을 확인합니다."], fix: "override 의도를 명시하고 공통 contract를 유지하거나 중복 구현을 제거해 부모 재사용으로 통일합니다.", prevention: "base 변경 시 모든 concrete subclass contract test를 실행합니다." },
      ],
    },
    {
      id: "constructor-selection",
      title: "객체 생성은 runtime class의 __new__·__init__을 선택하며 부모 __init__은 자동 연쇄되지 않습니다",
      lead: "subclass에 __init__이 없으면 상속된 부모 __init__을 쓰지만 subclass가 정의하면 그 구현이 선택되고 부모 초기화는 명시적으로 협력해야 합니다.",
      explanations: [
        "Person.__init__(name,age)가 self.name과 self.age를 만든다고 해도 Docter가 __init__(addr)를 새로 정의하면 Person.__init__은 자동 호출되지 않습니다. Docter instance는 addr만 가진 채 생성될 수 있고 info가 name을 읽을 때 나중에 AttributeError가 납니다.",
        "오류가 생성 시점이 아니라 method 호출 시점에 나타나는 것이 더 위험합니다. 잘못된 반쪽 객체가 list·cache·DB session에 들어가 다른 위치에서 실패할 수 있습니다. 생성이 성공했다면 public method가 요구하는 invariant가 모두 준비되어야 합니다.",
        "subclass가 __init__을 전혀 정의하지 않으면 inherited Person.__init__ signature를 그대로 사용합니다. 고유 상태가 없다면 불필요하게 override하지 않습니다. 단순히 pass-through __init__을 만들면 signature drift와 super 누락 가능성만 늘어납니다.",
        "__init__은 객체를 새로 return하는 생성자가 아니라 이미 만들어진 self를 초기화하며 None을 반환해야 합니다. 대체 생성은 classmethod factory에서 cls(...)를 호출해 동일 invariant 경로로 연결합니다.",
      ],
      concepts: [
        { term: "initialization invariant", definition: "정상 생성된 instance가 모든 public 행동 전에 반드시 갖춰야 하는 attribute·값 범위·관계입니다.", detail: ["base와 subclass invariant를 모두 만족해야 합니다.", "생성 직후 contract test로 검증합니다."] },
        { term: "constructor inheritance", definition: "subclass가 __init__을 정의하지 않을 때 MRO에서 base __init__을 찾아 사용하는 lookup 동작입니다.", detail: ["subclass가 override하면 자동 부모 호출은 없습니다.", "signature도 선택된 __init__에 따라 달라집니다."] },
      ],
      codeExamples: [
        {
          id: "missing-and-fixed-super-init",
          title: "부모 초기화 누락 AttributeError와 수정된 객체 비교",
          language: "python",
          filename: "super_init_fix.py",
          purpose: "원본 ex12 실패를 안전하게 포착하고 super 초기화가 완전한 state를 만드는 결과를 나란히 확인합니다.",
          code: "class Person:\n    def __init__(self, name, age):\n        if not name or age < 0:\n            raise ValueError('invalid person')\n        self.name = name\n        self.age = age\n\nclass BrokenDoctor(Person):\n    def __init__(self, address):\n        self.address = address\n\n    def info(self):\n        return f'{self.name}/{self.age}/{self.address}'\n\nclass Doctor(Person):\n    def __init__(self, name, age, address):\n        super().__init__(name, age)\n        self.address = address\n\n    def info(self):\n        return f'{self.name}/{self.age}/{self.address}'\n\nbroken = BrokenDoctor('제주도')\nprint(f'broken attrs={sorted(vars(broken))}')\ntry:\n    print(broken.info())\nexcept AttributeError as error:\n    print(f'ERROR: missing {error.name}')\n\ndoctor = Doctor('마이콜', 13, '제주도')\nprint(f'doctor attrs={sorted(vars(doctor))}')\nprint(doctor.info())",
          walkthrough: [
            { lines: "1-7", explanation: "Person 생성자는 name·age validation과 두 base attribute invariant를 소유합니다." },
            { lines: "9-14", explanation: "BrokenDoctor는 부모 초기화를 건너뛰고 address만 만들어 info 계약을 만족하지 못합니다." },
            { lines: "16-22", explanation: "Doctor는 super().__init__으로 base invariant를 먼저 만든 뒤 고유 address를 추가합니다." },
            { lines: "24-29", explanation: "broken의 실제 __dict__를 보고 info 실패에서 누락 attribute 이름만 안전하게 출력합니다." },
            { lines: "30-32", explanation: "수정 객체는 세 attribute와 정상 info 결과를 가집니다." },
          ],
          run: { environment: ["Python 3.11 이상", "super_init_fix.py로 저장"], command: "python super_init_fix.py" },
          output: { value: "broken attrs=['address']\nERROR: missing name\ndoctor attrs=['address', 'age', 'name']\n마이콜/13/제주도", explanation: ["BrokenDoctor 생성 자체는 성공하지만 name·age가 없어 나중에 실패합니다.", "AttributeError.name으로 전체 민감 객체 repr 없이 누락 이름을 진단합니다.", "Doctor는 base와 subclass state를 모두 완성합니다."] },
          experiments: [
            { change: "Doctor에서 super().__init__을 self.name=name 대입으로 바꿉니다.", prediction: "현재 name은 생기지만 age와 부모 validation이 빠져 다시 불완전합니다.", result: "부모 구현을 복사하면 invariant 변경을 놓치므로 정상 협력 호출이 낫습니다." },
            { change: "Person validation에 age<=150을 추가합니다.", prediction: "super를 사용하는 Doctor에도 자동 적용되고 BrokenDoctor는 여전히 우회합니다.", result: "공통 invariant를 한 초기화 경로에 집중하는 장점을 확인합니다." },
          ],
          sourceRefs: ["py-super-source", "py-super-missing-source", "python-super-doc"],
        },
      ],
      diagnostics: [
        { symptom: "subclass 객체 생성은 성공하지만 inherited method에서 base attribute가 없다는 AttributeError가 난다.", likelyCause: "subclass __init__이 base __init__을 호출하지 않고 base invariant를 만들지 않았습니다.", checks: ["vars(instance)와 base __init__ 대입 목록을 비교합니다.", "subclass MRO와 __init__ 선택 구현을 확인합니다.", "모든 생성 경로·classmethod factory에서 같은 문제가 있는지 봅니다."], fix: "협력적 super().__init__에 필요한 인수를 전달하고 subclass 고유 state를 적절한 순서에 추가합니다.", prevention: "생성 직후 base public method·attribute contract를 모든 subclass와 factory에 실행합니다." },
      ],
    },
    {
      id: "super-and-mro",
      title: "super는 현재 class 다음 MRO 구현을 호출하므로 직접 부모 이름 하드코딩과 다릅니다",
      lead: "단일 상속에서는 부모 호출처럼 보이지만 실제 의미는 method resolution order의 협력 chain입니다.",
      explanations: [
        "Doctor의 super().__init__(name,age)는 현재 class와 self를 바탕으로 Doctor MRO에서 다음 Person.__init__을 찾습니다. super()가 Person instance를 만드는 것이 아니며 self는 여전히 Doctor instance입니다. 그래서 Person이 만든 name·age가 같은 Doctor.__dict__에 들어갑니다.",
        "Person.__init__(self,name,age)로 직접 호출해도 단일 상속 예제는 동작할 수 있지만 다중 상속에서 MRO 중간 mixin을 건너뛰고 diamond base를 중복 호출할 수 있습니다. 확장 가능한 계층은 모든 참여 class가 super protocol에 협력합니다.",
        "Class.mro() 또는 Class.__mro__는 lookup 순서를 보여 줍니다. Python은 C3 linearization으로 local precedence와 일관성을 유지하며 모순된 base 순서는 class 정의 때 TypeError가 될 수 있습니다.",
        "zero-argument super는 method 정의의 __class__ cell과 첫 인수를 사용하므로 nested function·복사한 function 같은 특수 상황에서 주의합니다. 일반 instance·class method 안에서는 super()를 사용하고 의미를 명확히 유지합니다.",
      ],
      concepts: [
        { term: "MRO", definition: "method resolution order로 instance attribute를 찾지 못했을 때 class와 base class를 검색하는 선형 순서입니다.", detail: ["Class.mro()로 확인합니다.", "super는 이 순서의 다음 구현을 사용합니다."] },
        { term: "C3 linearization", definition: "다중 상속의 local base 순서와 각 base의 순서를 일관되게 보존하는 Python MRO 계산 방식입니다.", detail: ["diamond에서 공통 base를 한 번 배치합니다.", "일관된 순서를 만들 수 없으면 class 정의가 실패합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "super()를 호출했는데 예상한 직접 부모가 아니라 mixin method가 실행된다.", likelyCause: "super는 source에 적힌 한 부모가 아니라 runtime class MRO의 다음 구현을 선택합니다.", checks: ["type(self).mro() 전체를 출력합니다.", "각 class __dict__에 해당 method가 있는지 확인합니다.", "class base 순서가 변경됐는지 봅니다."], fix: "협력 chain이 의도라면 모든 구현 signature와 super 호출을 맞추고, 특정 구현 직접 호출이 정말 필요하면 상속 구조 자체를 재검토합니다.", prevention: "다중 상속 class의 MRO와 각 초기화 실행 횟수를 test에 명시합니다." },
      ],
    },
    {
      id: "initialization-order-invariants",
      title: "base와 subclass 초기화 순서는 invariant·property·override 호출에 영향을 줍니다",
      lead: "보통 base invariant를 먼저 만들고 subclass state를 추가하지만 base 생성자가 override method를 호출하면 subclass state가 아직 없을 수 있습니다.",
      explanations: [
        "super().__init__ 전 subclass attribute가 base validation에 필요할 수도 있고, 반대로 base attribute를 subclass 계산에 사용할 수도 있습니다. 순서는 domain dependency를 따라 정하고 생성 중 public override method를 호출하지 않는 편이 안전합니다.",
        "base __init__에서 self.validate()를 호출하면 runtime dispatch로 subclass override가 선택될 수 있습니다. subclass __init__이 아직 고유 field를 만들기 전이면 AttributeError나 잘못된 validation이 납니다. 생성자는 private/non-overridable helper 또는 완전한 값 검증 후 대입을 사용합니다.",
        "validation 실패 전에 일부 self attribute를 대입하면 외부에서 객체가 보통 반환되지는 않지만 descriptor·registry·finalizer가 부분 state를 관찰할 수 있습니다. 입력을 local 변수로 모두 검증한 뒤 state를 commit하는 패턴이 명확합니다.",
        "dataclass inheritance에서도 generated __init__, field order, __post_init__와 base __post_init__ 협력이 자동으로 원하는 의미가 되지 않을 수 있습니다. 생성 signature와 super/post-init 호출을 실제 실행·type checker로 확인합니다.",
      ],
      concepts: [
        { term: "virtual call during construction", definition: "base 초기화 중 self의 override 가능한 method를 호출해 아직 완성되지 않은 subclass 구현이 실행되는 위험한 패턴입니다.", detail: ["runtime dispatch는 생성 중에도 작동합니다.", "private helper·factory·two-phase 명시 lifecycle로 피합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "base __init__ 안에서 호출한 method가 subclass attribute 누락으로 실패한다.", likelyCause: "생성 중 override 가능한 method가 dynamic dispatch되어 subclass 초기화 전에 실행됐습니다.", checks: ["base 생성자의 self.method 호출을 찾습니다.", "실제 선택된 __qualname__과 MRO를 확인합니다.", "subclass attribute 대입 순서를 추적합니다."], fix: "base 생성자는 override되지 않는 validation helper를 사용하거나 완전 초기화 후 explicit hook을 호출하도록 lifecycle을 분리합니다.", prevention: "constructor에서 overridable method 호출을 code review 규칙으로 금지하고 subclass 생성 test를 둡니다." },
      ],
    },
    {
      id: "cooperative-multiple-inheritance",
      title: "다중 상속은 호환 signature와 super chain으로 각 초기화를 정확히 한 번 실행합니다",
      lead: "diamond에서 각 class가 직접 부모 이름을 호출하면 공통 root가 두 번 실행될 수 있지만 협력적 super는 MRO를 한 줄로 따릅니다.",
      explanations: [
        "다중 상속 자체가 항상 나쁜 것은 아니지만 독립적인 작은 mixin과 명확한 protocol에 제한하는 편이 좋습니다. 각 __init__은 자신이 소비하는 keyword를 명시적으로 받고 나머지 **kwargs를 super에 전달합니다. 마지막 root는 남은 unknown keyword를 거부합니다.",
        "모든 참여 class가 super를 호출해야 chain이 다음 구현으로 진행합니다. 한 class가 super를 빼면 뒤 mixin과 root 초기화가 끊깁니다. 반대로 직접 Root.__init__을 두 branch에서 호출하면 root가 두 번 실행될 수 있습니다.",
        "cooperative signature는 이름 충돌을 피해야 합니다. 두 mixin이 같은 keyword를 다른 의미로 소비하면 base 순서에 따라 결과가 달라집니다. namespace가 분명한 옵션이나 별도 configuration 객체를 사용합니다.",
        "외부 library class가 cooperative super를 따르지 않으면 무리하게 chain에 넣지 말고 adapter·composition을 고려합니다. class가 허용한 상속 extension contract를 확인합니다.",
      ],
      concepts: [
        { term: "diamond inheritance", definition: "두 inheritance branch가 같은 공통 base에서 갈라졌다가 한 subclass에서 다시 합쳐지는 계층 모양입니다.", detail: ["MRO는 공통 base를 한 번 배치합니다.", "직접 부모 호출은 중복 초기화를 만들 수 있습니다."] },
        { term: "cooperative super", definition: "MRO에 참여한 모든 class가 호환 signature로 super를 호출해 chain의 다음 구현에 처리를 넘기는 protocol입니다.", detail: ["각 class는 자기 인수만 소비합니다.", "chain을 끊는 class와 중복 직접 호출을 피합니다."] },
      ],
      codeExamples: [
        {
          id: "cooperative-diamond-init",
          title: "keyword 전달로 diamond MRO를 한 번씩 초기화",
          language: "python",
          filename: "cooperative_super.py",
          purpose: "StudyTask→Named→Timed→Root chain과 최종 state를 출력해 cooperative super 동작을 확인합니다.",
          code: "class Root:\n    def __init__(self, **kwargs):\n        if kwargs:\n            raise TypeError(f'unknown options: {sorted(kwargs)}')\n        self.steps = ['Root']\n\nclass Named(Root):\n    def __init__(self, *, name, **kwargs):\n        super().__init__(**kwargs)\n        self.name = name\n        self.steps.append('Named')\n\nclass Timed(Root):\n    def __init__(self, *, minutes, **kwargs):\n        super().__init__(**kwargs)\n        self.minutes = minutes\n        self.steps.append('Timed')\n\nclass StudyTask(Named, Timed):\n    def __init__(self, *, topic, **kwargs):\n        super().__init__(**kwargs)\n        self.topic = topic\n        self.steps.append('StudyTask')\n\ntask = StudyTask(topic='Python', name='함수 복습', minutes=45)\nprint(' -> '.join(cls.__name__ for cls in StudyTask.mro()))\nprint(task.steps)\nprint(f'{task.topic}/{task.name}/{task.minutes}')",
          walkthrough: [
            { lines: "1-5", explanation: "Root는 chain 끝에서 남은 keyword를 거부하고 공통 steps를 한 번 만듭니다." },
            { lines: "7-17", explanation: "Named와 Timed는 각 keyword만 소비하고 나머지를 super에 넘긴 뒤 돌아오는 순서로 state와 marker를 추가합니다." },
            { lines: "19-24", explanation: "StudyTask base 순서가 MRO를 정하고 topic을 추가합니다." },
            { lines: "25-28", explanation: "한 호출로 전체 chain을 실행해 MRO, 실제 완료 순서, 세 domain attribute를 출력합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "cooperative_super.py로 저장"], command: "python cooperative_super.py" },
          output: { value: "StudyTask -> Named -> Timed -> Root -> object\n['Root', 'Timed', 'Named', 'StudyTask']\nPython/함수 복습/45", explanation: ["호출 진행은 StudyTask→Named→Timed→Root이고 super에서 돌아오며 marker가 Root→Timed→Named→StudyTask 순서로 쌓입니다.", "공통 Root 초기화는 한 번만 실행됩니다.", "모든 keyword가 소비되어 Root에 unknown 옵션이 남지 않습니다."] },
          experiments: [
            { change: "Named.__init__에서 super 호출을 제거합니다.", prediction: "Timed와 Root가 실행되지 않아 steps 자체가 없고 뒤 append에서 AttributeError가 납니다.", result: "한 참여자가 super chain을 끊으면 MRO 뒤 초기화 전체가 빠집니다." },
            { change: "StudyTask(..., typo=1)를 추가합니다.", prediction: "아무 class도 typo를 소비하지 않아 Root가 unknown options TypeError로 거부합니다.", result: "**kwargs를 조용히 버리지 않고 chain 끝에서 오타를 검출합니다." },
          ],
          sourceRefs: ["py-super-source", "python-mro-doc", "python-super-doc"],
        },
      ],
      diagnostics: [
        { symptom: "다중 상속에서 특정 base 초기화가 두 번 또는 전혀 실행되지 않는다.", likelyCause: "일부 class가 직접 Base.__init__을 호출하거나 super chain을 중간에서 끊었습니다.", checks: ["Concrete.mro() 순서를 적습니다.", "각 __init__의 super 호출과 signature를 확인합니다.", "초기화 marker·counter로 실행 횟수를 측정합니다."], fix: "모든 참여 class를 cooperative signature로 맞추고 자기 keyword만 소비한 뒤 super를 한 번 호출하게 합니다.", prevention: "diamond class의 MRO·실행 순서·각 base 한 번 초기화를 test로 고정합니다." },
      ],
    },
    {
      id: "inheritance-vs-mixin-composition",
      title: "상태·수명·변화 축이 다르면 깊은 상속보다 mixin 또는 composition을 선택합니다",
      lead: "상속은 강한 type·lifecycle 결합이므로 단순 코드 재사용만이 목적이면 더 작은 도구가 낫습니다.",
      explanations: [
        "Animal→Dog처럼 의미 있는 is-a와 공통 lifecycle이 있으면 얕은 상속이 읽기 쉽습니다. 하지만 Logger 기능을 얻기 위해 BusinessService가 Logger를 상속하는 것은 is-a가 아닙니다. logger 객체를 주입하는 composition이 자연스럽습니다.",
        "mixin은 단독 instance 의미가 없고 작은 orthogonal 행동을 추가하는 class입니다. 보통 state를 최소화하고 __init__을 정의하지 않으며 method 이름 충돌과 MRO 위치를 문서화합니다. 여러 stateful mixin은 cooperative protocol 복잡도를 급격히 높입니다.",
        "composition은 객체가 협력 dependency를 field로 소유하고 위임합니다. runtime 교체·fake test·독립 versioning에 유리하지만 forwarding code가 늘 수 있습니다. Protocol로 dependency 행동을 좁게 정의합니다.",
        "subclass 수가 역할×저장소×알림 channel 조합으로 폭발하거나 base flag가 계속 늘면 inheritance 축이 잘못 잡힌 신호입니다. 독립 정책을 object로 분리해 조합합니다.",
      ],
      concepts: [
        { term: "mixin", definition: "독립 domain entity가 아니라 다른 class에 작고 재사용 가능한 행동을 추가하려는 보조 base class입니다.", detail: ["state와 초기화를 최소화합니다.", "MRO·method 충돌 contract가 필요합니다."] },
        { term: "composition", definition: "상속 대신 다른 객체를 attribute로 소유·주입받아 행동을 위임하는 has-a 구조입니다.", detail: ["runtime 교체와 test 격리가 쉽습니다.", "dependency lifecycle을 명시해야 합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "재사용 관계를 어떻게 만들까요?", options: [
          { name: "상속", chooseWhen: "안정적인 is-a 관계와 공통 invariant·lifecycle·행동 contract가 있을 때", avoidWhen: "단순 helper 재사용이나 여러 독립 정책 조합이 목적일 때", tradeoffs: ["공통 API와 dispatch가 자연스럽습니다.", "base 변경과 MRO 결합이 큽니다.", "substitutability를 지켜야 합니다."] },
          { name: "mixin", chooseWhen: "state가 거의 없는 작은 orthogonal capability를 여러 class에 추가할 때", avoidWhen: "자체 lifecycle·필수 constructor state가 큰 기능일 때", tradeoffs: ["작은 행동 재사용에 편리합니다.", "method 충돌과 base 순서가 생깁니다.", "독립 객체 의미가 약합니다."] },
          { name: "composition", chooseWhen: "정책·I/O·service를 runtime에 교체·조합하고 독립 test할 때", avoidWhen: "하나의 진정한 subtype 계층과 공통 implementation이 중심일 때", tradeoffs: ["결합과 class 폭발을 줄입니다.", "위임과 object wiring이 늘 수 있습니다.", "dependency 소유·수명을 명시합니다."] },
        ] },
      ],
      expertNotes: ["ORM·serializer가 __init__을 우회해 __new__ 또는 attribute 주입으로 객체를 복원할 수 있으므로 domain invariant가 중요하면 factory·validation hook·repository boundary를 검증합니다.", "untrusted class 이름으로 subtype을 동적 생성·import하지 말고 허용 factory registry와 process isolation을 사용합니다."],
    },
    {
      id: "testing-initialization-contracts",
      title: "생성 contract test는 모든 subclass·factory·복원 경로가 완전한 invariant를 만드는지 확인합니다",
      lead: "happy path method test만으로는 생성 직후 누락 attribute와 다른 경로의 부분 초기화를 놓칠 수 있습니다.",
      explanations: [
        "base가 보장하는 attribute·public method 목록을 contract fixture로 만들고 모든 concrete subclass factory에 같은 test를 실행합니다. vars에 특정 구현 세부가 있는지만 검사하기보다 public property·method가 정상 동작하고 허용 범위를 지키는지 봅니다.",
        "direct constructor뿐 아니라 classmethod from_text, copy/deepcopy, pickle·JSON repository 복원, ORM loading 경로를 inventory합니다. 일부 경로가 __init__을 우회하면 별도 validation이 필요합니다. 신뢰할 수 없는 pickle은 code execution 위험 때문에 사용하지 않습니다.",
        "초기화 실패 object가 global registry나 event bus에 등록되지 않도록 validation과 side effect 순서를 검사합니다. 모든 입력을 검증하고 state를 완성한 뒤 외부 등록을 transaction처럼 수행하며 실패 시 rollback합니다.",
        "MRO와 super chain test는 구현 세부에 지나치게 고정하지 않되 각 base invariant가 정확히 한 번 성립하는 결과를 단언합니다. instrumentation marker는 학습·진단용이고 production contract는 관찰 가능한 상태와 행동입니다.",
      ],
      concepts: [
        { term: "construction path", definition: "direct constructor, 대체 생성자, 복사, deserializer, ORM 등 객체를 만들어 유효 상태로 만드는 모든 진입 경로입니다.", detail: ["모두 같은 invariant를 만족해야 합니다.", "__init__을 우회하는 경로를 별도 검증합니다."] },
        { term: "construction contract test", definition: "각 concrete subtype과 생성 경로가 base·subclass invariant와 public 행동을 생성 직후 만족하는지 공통 검증하는 test입니다.", detail: ["누락 super와 부분 객체를 일찍 찾습니다.", "실패 시 외부 side effect 부재도 검사합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "직접 생성 test는 통과하지만 deserialization·factory로 만든 subclass만 나중에 실패한다.", likelyCause: "일부 construction path가 __init__·super validation을 우회하거나 인수를 다르게 전달합니다.", checks: ["모든 object 생성 진입점을 inventory합니다.", "각 경로 직후 base public contract를 실행합니다.", "복원 library가 __init__·__post_init__을 호출하는지 확인합니다."], fix: "모든 경로를 하나의 validated factory로 모으거나 우회 경로에 명시 validation hook을 추가합니다.", prevention: "construction path×subclass matrix contract test와 invalid data fixture를 CI에 둡니다." },
      ],
    },
  ],
  lab: {
    title: "학습 콘텐츠 계층과 협력적 metadata 초기화",
    scenario: "Lesson base와 VideoLesson·CodeLesson subtype, Timestamped·Tagged mixin을 설계해 모든 생성 경로가 공통 title·duration invariant와 고유 state를 보존하도록 만듭니다.",
    setup: ["lesson_models.py와 test_lesson_construction.py를 만듭니다.", "외부 DB·파일 없이 합성 metadata만 사용합니다.", "title은 non-empty, duration은 1~600분이라는 base 계약을 둡니다."],
    steps: ["Lesson.__init__이 title·duration을 local로 검증한 뒤 instance state를 만듭니다.", "VideoLesson과 CodeLesson은 super로 base invariant를 만들고 url 또는 language 고유 field를 검증합니다.", "base 생성자에서 override method를 호출하지 않습니다.", "Timestamped·Tagged가 정말 mixin이어야 하는지 composition value object와 비교합니다.", "다중 상속을 선택했다면 keyword-only cooperative signature와 Root unknown 옵션 거부를 구현합니다.", "각 concrete class MRO와 초기화 결과를 기록합니다.", "from_dict classmethod가 cls(...)를 호출해 같은 invariant 경로를 사용하게 합니다.", "모든 subtype×direct/from_dict 생성에 공통 contract test를 실행합니다.", "잘못된 duration·누락 title·unknown keyword·super 누락 변형을 test가 잡는지 확인합니다."],
    expectedResult: ["정상 생성된 모든 subtype이 title·duration 공통 행동을 즉시 사용할 수 있습니다.", "subclass 고유 attribute와 validation이 base state를 덮지 않습니다.", "super chain이 MRO의 각 참여 초기화를 정확히 한 번 실행합니다.", "unknown option과 잘못된 입력이 부분 객체 등록 전에 실패합니다.", "composition을 선택한 정책은 상속 계층과 독립적으로 교체·test할 수 있습니다."],
    cleanup: ["합성 객체만 사용해 정리할 외부 자원이 없습니다."],
    extensions: ["frozen dataclass 계층과 일반 class를 비교합니다.", "Protocol 기반 renderer를 각 Lesson에 composition합니다.", "schemaVersion 있는 JSON 복원과 construction contract를 연결합니다.", "plugin lesson factory allowlist와 conformance suite를 설계합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 Animal·Docter 세 파일을 실행하고 attribute lookup·초기화 표를 작성하세요.", requirements: ["Dog/Cat의 inherited eat·play와 고유 sound 정의 위치를 기록합니다.", "정상 Docter와 super 누락 Docter의 vars 차이를 비교합니다.", "원본 AttributeError의 누락 이름과 발생 시점을 설명합니다.", "super 수정 뒤 base validation 변경이 subtype에 적용되는지 확인합니다."], hints: ["Class.mro와 vars(instance)를 함께 봅니다.", "실패 예제는 try/except로 학습 output을 안정화합니다."], expectedOutcome: "lookup과 생성 초기화를 서로 다른 흐름으로 추적합니다.", solutionOutline: ["원본을 격리 실행합니다.", "class별 __dict__와 instance state를 표로 만듭니다.", "누락 super를 수정하고 회귀 test를 둡니다."] },
    { difficulty: "응용", prompt: "Employee·Manager·Intern 계층의 생성 contract를 설계하세요.", requirements: ["name·salary base invariant와 team·duration subtype invariant를 정의합니다.", "keyword-only constructor와 super를 사용합니다.", "direct/from_dict 두 생성 경로가 같은 validation을 사용합니다.", "base public method를 모든 subtype에서 test합니다.", "잘못된 subtype state가 registry에 남지 않게 합니다."], hints: ["factory에서 subclass 이름을 하드코딩하지 않습니다.", "검증 후 외부 side effect 순서를 지킵니다."], expectedOutcome: "모든 subtype이 base 대신 안전하게 사용되는 완전한 생성 경로를 만듭니다." },
    { difficulty: "설계", prompt: "다중 상속 mixin이 많은 legacy framework를 composition으로 단계적 전환하세요.", requirements: ["현재 MRO·constructor signature·super 단절 지점을 inventory합니다.", "각 base의 실제 state owner와 capability를 분류합니다.", "협력적 super 임시 안정화와 장기 composition migration을 나눕니다.", "public constructor 호환 adapter와 deprecation을 설계합니다.", "subclass·factory·serializer contract test matrix를 만듭니다.", "plugin·untrusted class import·thread state 위험을 포함합니다."], hints: ["한 번에 계층을 제거하지 않고 characterization test로 현재 행동을 고정합니다.", "stateful mixin부터 service/value object 후보를 찾습니다."], expectedOutcome: "MRO 의존 legacy 구조를 검증 가능하고 교체 가능한 객체 graph로 전환하는 계획을 제시합니다." },
  ],
  reviewQuestions: [
    { question: "Dog가 Animal.eat를 사용할 때 method가 Dog source에 복사되나요?", answer: "아닙니다. instance와 Dog에서 못 찾은 뒤 MRO의 Animal.eat를 찾아 dog에 bind합니다." },
    { question: "subclass가 __init__을 정의하면 부모 __init__이 자동 호출되나요?", answer: "아닙니다. 선택된 subclass __init__이 명시적으로 super 등으로 협력해야 합니다." },
    { question: "super().__init__이 별도 부모 객체를 초기화하나요?", answer: "아닙니다. 같은 subclass instance self를 MRO 다음 초기화 구현에 전달합니다." },
    { question: "왜 super 누락 오류가 생성 시가 아니라 info 호출 때 날 수 있나요?", answer: "Python은 필요한 attribute 목록을 생성 직후 자동 검사하지 않아 누락 name을 실제로 읽을 때 AttributeError가 나기 때문입니다." },
    { question: "super는 항상 source에 적은 직접 부모를 호출하나요?", answer: "아닙니다. runtime class의 MRO에서 현재 class 다음 구현을 호출합니다." },
    { question: "다중 상속에서 **kwargs를 그냥 버리면 어떤 문제가 있나요?", answer: "오타와 아직 소비되지 않은 필수 option이 조용히 사라집니다. chain 끝 root가 unknown을 거부해야 합니다." },
    { question: "base __init__에서 self.validate를 호출하면 왜 위험할 수 있나요?", answer: "dynamic dispatch로 아직 고유 attribute가 준비되지 않은 subclass override가 실행될 수 있습니다." },
    { question: "단순 기능 재사용에 상속이 항상 최선인가요?", answer: "아닙니다. is-a가 약하거나 정책 교체·조합이 핵심이면 helper·mixin·composition이 더 낮은 결합을 만듭니다." },
  ],
  completionChecklist: [
    "instance·subclass·base 순서의 inherited attribute lookup을 추적할 수 있다.",
    "is-a와 단순 코드 재사용을 구분할 수 있다.",
    "subclass __init__ 선택과 부모 초기화 비자동성을 설명할 수 있다.",
    "super로 base와 subtype invariant를 완전하게 초기화할 수 있다.",
    "MRO를 읽고 협력적 super chain의 다음 구현을 예측할 수 있다.",
    "diamond에서 각 초기화가 한 번씩 실행되는 keyword protocol을 만들 수 있다.",
    "생성 중 virtual call과 부분 객체 side effect를 피할 수 있다.",
    "상속·mixin·composition과 모든 construction path contract test를 설계할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-inheritance-source", repository: "PYTHON-BASIC", path: "day06/ex10_class.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex10_class.py", usedFor: ["Animal base", "Dog·Cat inheritance", "inherited eat·play", "고유 sound"], evidence: "원본을 Python 3.13.9에서 실행해 Dog와 Cat 모두 부모 먹는다·움직인다를 사용하고 각 sound를 출력함을 확인했습니다." },
    { id: "py-super-source", repository: "PYTHON-BASIC", path: "day06/ex11_class.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex11_class.py", usedFor: ["Person base 초기화", "Docter super", "subclass address", "정상 info"], evidence: "원본 실행에서 super().__init__(name,age) 뒤 마이콜, 13, 제주도 세 상태가 정상 출력됨을 확인했습니다." },
    { id: "py-super-missing-source", repository: "PYTHON-BASIC", path: "day06/ex12_class.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex12_class.py", usedFor: ["부모 초기화 누락", "부분 instance", "의도된 AttributeError"], evidence: "원본을 실행해 Docter(addr) 생성 뒤 info의 self.name에서 AttributeError: object has no attribute 'name'이 발생하는 traceback을 확인했습니다." },
    { id: "python-super-doc", repository: "Python documentation", path: "library/functions.html#super", publicUrl: "https://docs.python.org/3/library/functions.html#super", usedFor: ["super proxy", "MRO next", "협력적 다중 상속"], evidence: "공식 super 설명을 직접 부모 호출 오해와 cooperative chain 설명의 기준으로 사용했습니다." },
    { id: "python-mro-doc", repository: "Python documentation", path: "reference/datamodel.html#customizing-instance-and-subclass-checks", publicUrl: "https://docs.python.org/3/reference/datamodel.html", usedFor: ["class MRO", "attribute lookup", "다중 상속"], evidence: "공식 data model과 class tutorial 범위를 바탕으로 MRO·C3·lookup·construction contract를 보강했습니다." },
  ],
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["method overriding과 행동 다형성은 바로 다음 py-032에서 반환·예외 contract까지 확장합니다.", "C3 협력 초기화·생성 중 virtual call·mixin/composition·construction path test는 원본 super 누락 예제를 전문가 수준으로 보강한 내용입니다."] },
} satisfies DetailedSession;

export default session;

const advancedInheritanceChapters: DetailedSession["chapters"] = [
  {
    id: "cooperative-signatures-keyword-consumption",
    title: "cooperative multiple inheritance는 MRO와 호환 signature·한 번의 super 호출로 완성합니다",
    lead: "diamond에서 각 class가 자기 keyword만 소비하고 나머지를 같은 형태로 super에 전달해야 모든 initializer가 MRO 순서대로 정확히 한 번 실행됩니다.",
    explanations: [
      "`super()`는 고정된 부모 이름이 아니라 현재 class 다음 MRO 위치부터 attribute를 찾는 proxy입니다. 따라서 Named의 super가 직접 base만 부르는 것이 아니라 실제 object type의 다음 sibling mixin을 호출할 수 있습니다.",
      "cooperative `__init__`은 각 class가 처리할 keyword를 keyword-only parameter로 꺼내고 나머지 `**kwargs`를 super로 전달하는 공통 protocol을 가질 수 있습니다. signature가 서로 호환되지 않으면 MRO 변경에서 unexpected/missing argument가 납니다.",
      "leaf class도 같은 방식으로 super를 한 번 호출하고 root class가 남은 kwargs가 비었는지 확인하면 오타와 누락을 빠르게 발견합니다. `object.__init__`에는 불필요한 arguments를 전달하지 않습니다.",
      "부모 이름을 직접 호출하면 diamond의 shared ancestor가 두 번 초기화되거나 sibling initializer가 건너뛰어집니다. cooperative hierarchy 안에서는 모든 참여 class가 super protocol을 지켜야 한 class의 직접 호출이 chain 전체를 깨지 않습니다.",
      "MRO는 C3 linearization으로 local precedence와 monotonicity를 지키며 `Class.__mro__` 또는 `Class.mro()`로 확인합니다. base order를 바꾸면 method/initializer 순서가 바뀌므로 API와 test에 명시합니다.",
      "mixin은 작고 독립적인 behavior를 제공하고 일반적으로 독자적인 identity·복잡한 constructor state를 최소화합니다. 여러 mixin이 같은 method를 제공하면 cooperative super와 반환 계약을 모두 문서화합니다.",
      "초기화 event가 중요한 resource class는 constructor보다 context manager·factory를 고려합니다. `__init__` 중간 실패에서 이미 연 file·lock을 안전하게 정리하기 어렵기 때문입니다.",
    ],
    concepts: [
      { term: "cooperative signature", definition: "MRO chain의 각 method가 자기 인자를 소비하고 남은 인자를 super에 전달할 수 있도록 맞춘 호출 규약입니다.", detail: ["keyword-only arguments가 유용합니다.", "root가 잔여 kwargs를 검증합니다."] },
      { term: "C3 linearization", definition: "Python이 multiple inheritance의 일관된 method resolution order를 계산하는 알고리즘입니다.", detail: ["local base order를 존중합니다.", "monotonic MRO를 만듭니다."] },
      { term: "diamond initialization", definition: "두 상속 경로가 같은 ancestor에서 만나는 hierarchy의 초기화 문제입니다.", detail: ["직접 부모 호출은 중복 위험이 있습니다.", "cooperative super가 한 번씩 방문합니다."] },
    ],
    codeExamples: [{
      id: "python-cooperative-keyword-mro",
      title: "keyword를 단계별로 소비하며 diamond MRO의 모든 initializer를 한 번씩 호출합니다",
      language: "python",
      filename: "cooperative_keywords.py",
      purpose: "호환 signature와 zero-argument super가 실제 MRO event 순서와 instance invariant를 완성하는지 확인합니다.",
      code: "events = []\n\nclass Root:\n    def __init__(self, **kwargs):\n        if kwargs:\n            raise TypeError(f'unused arguments: {sorted(kwargs)}')\n        events.append('Root')\n\nclass Tagged(Root):\n    def __init__(self, *, tag, **kwargs):\n        self.tag = tag\n        events.append('Tagged')\n        super().__init__(**kwargs)\n\nclass Named(Root):\n    def __init__(self, *, name, **kwargs):\n        self.name = name\n        events.append('Named')\n        super().__init__(**kwargs)\n\nclass Item(Named, Tagged):\n    def __init__(self, **kwargs):\n        events.append('Item')\n        super().__init__(**kwargs)\n\nitem = Item(name='book', tag='study')\nprint(f'mro={[cls.__name__ for cls in Item.__mro__]}')\nprint(f'events={events}|state={item.name},{item.tag}')",
      walkthrough: [
        { lines: "1-7", explanation: "Root가 cooperative chain의 끝에서 남은 keyword를 거부하고 자신의 event를 남깁니다." },
        { lines: "9-21", explanation: "Tagged와 Named가 자기 keyword만 소비하고 나머지를 MRO 다음 class로 전달합니다." },
        { lines: "21-24", explanation: "Item도 부모 이름을 고정하지 않고 super chain을 시작합니다." },
        { lines: "26-28", explanation: "Item의 C3 MRO, initializer events와 완성된 state를 exact 출력합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 문법만 사용"], command: "python cooperative_keywords.py" },
      output: { value: "mro=['Item', 'Named', 'Tagged', 'Root', 'object']\nevents=['Item', 'Named', 'Tagged', 'Root']|state=book,study", explanation: ["base order 때문에 Named 뒤 Tagged가 실행됩니다.", "각 initializer가 한 번씩 실행됩니다.", "Root에 남은 keyword가 없습니다."] },
      experiments: [
        { change: "Item의 base 순서를 Tagged, Named로 바꿉니다.", prediction: "MRO와 event 중 두 mixin 순서가 바뀌지만 state는 완성됩니다.", result: "base order가 public behavior임을 확인합니다." },
        { change: "Named에서 super 호출을 제거합니다.", prediction: "Tagged와 Root가 실행되지 않아 tag가 없습니다.", result: "한 class의 비협조가 chain 전체를 끊습니다." },
        { change: "Item에 unknown=1을 전달합니다.", prediction: "Root가 unused arguments를 TypeError로 거부합니다.", result: "keyword 오타가 조용히 유실되지 않습니다." },
      ],
      sourceRefs: ["python-super-doc", "python-mro-doc", "python-type-mro-031", "python-classes-inheritance-031"],
    }],
    diagnostics: [
      { symptom: "diamond hierarchy에서 공통 base initializer가 두 번 실행됩니다.", likelyCause: "각 branch가 base 이름을 직접 호출해 MRO cooperative chain을 우회했습니다.", checks: ["Class.__mro__를 출력합니다.", "모든 __init__의 direct Base.__init__ 호출을 찾습니다.", "event/call count를 기록합니다."], fix: "참여 class 모두 호환 signature와 super 한 번 호출 규약으로 통일합니다.", prevention: "각 initializer exactly-once contract test를 둡니다." },
      { symptom: "base 순서를 바꾸자 unexpected keyword argument가 납니다.", likelyCause: "한 class가 자기 인자 외 kwargs를 받거나 다음 super로 전달하는 cooperative signature를 지키지 않았습니다.", checks: ["MRO의 모든 __init__ signature를 나열합니다.", "각 단계가 소비·전달하는 key를 추적합니다.", "root 잔여 kwargs를 봅니다."], fix: "keyword-only own arguments와 **kwargs forwarding protocol을 맞추거나 multiple inheritance 대신 composition을 사용합니다.", prevention: "지원 base order와 keyword matrix를 type/runtime test에 고정합니다." },
    ],
  },
  {
    id: "inheritance-versus-composition-substitutability",
    title: "코드 재사용보다 substitutability를 먼저 묻고 정책 조립에는 composition을 선택합니다",
    lead: "상속은 public contract 전체를 물려받는 강한 관계이고 composition은 필요한 collaborator만 명시적으로 위임하는 관계입니다.",
    explanations: [
      "자식이 부모를 상속하면 부모를 받는 모든 함수에서 의미 있게 동작해야 합니다. 단지 method 몇 줄을 재사용하려고 상속하면 자식이 지원하지 못하는 public operations와 state invariant까지 노출됩니다.",
      "composition은 formatter·repository·clock 같은 collaborator를 constructor로 받아 behavior를 조립합니다. wrapper는 inner object의 작은 Protocol에만 의존할 수 있어 class hierarchy를 고치지 않고 조합 순서를 바꿀 수 있습니다.",
      "inheritance는 framework hook, stable is-a domain relation, shared template method처럼 override contract가 명확할 때 유용합니다. composition은 runtime 교체, 여러 독립 정책 조합, test fake, lifecycle 분리에 유리합니다.",
      "delegation을 무작정 모든 method에 forwarding하면 wrapper가 inner API와 강하게 결합됩니다. 소비자가 필요한 최소 interface만 노출하고 inner object 자체를 public으로 새지 않게 합니다.",
      "decorator pattern의 wrapper 순서는 behavior입니다. Prefix(Upper(Json))와 Upper(Prefix(Json))가 다를 수 있으므로 composition root에서 조합하고 integration test에 순서를 기록합니다.",
      "subclass explosion은 region×format×cache처럼 독립 차원을 상속 조합으로 표현할 때 나타납니다. 각 차원을 strategy object로 분리하면 N×M subclasses 대신 N+M implementations와 조합으로 줄일 수 있습니다.",
      "성능 때문에 inheritance를 선택하기 전에 실제 profile을 측정합니다. 한 번의 delegation call보다 잘못된 public contract와 test coupling 비용이 더 클 수 있습니다.",
    ],
    concepts: [
      { term: "substitutability", definition: "하위 타입 객체가 상위 타입을 기대하는 위치에서 계약을 깨지 않고 사용될 수 있는 성질입니다.", detail: ["method 존재만으로 충분하지 않습니다.", "행동·오류·불변식을 포함합니다."] },
      { term: "delegation", definition: "한 객체가 보유한 collaborator에게 일부 작업을 명시적으로 맡기는 composition 방식입니다.", detail: ["최소 interface에 의존합니다.", "runtime 조합이 가능합니다."] },
      { term: "strategy object", definition: "교체 가능한 한 가지 정책·알고리즘을 작은 객체로 캡슐화한 collaborator입니다.", detail: ["subclass 수를 줄입니다.", "test fake를 주입할 수 있습니다."] },
    ],
    codeExamples: [{
      id: "python-composed-formatter-strategies",
      title: "JSON formatter와 prefix 정책을 상속 없이 조합합니다",
      language: "python",
      filename: "formatter_composition.py",
      purpose: "Report가 concrete hierarchy가 아니라 format method를 가진 collaborator를 사용하고 wrapper가 동작을 추가하는 구조를 보여 줍니다.",
      code: "import json\n\nclass JsonFormatter:\n    def format(self, payload):\n        return json.dumps(payload, sort_keys=True, separators=(',', ':'))\n\nclass PrefixFormatter:\n    def __init__(self, inner, prefix):\n        self.inner = inner\n        self.prefix = prefix\n\n    def format(self, payload):\n        return self.prefix + self.inner.format(payload)\n\nclass Report:\n    def __init__(self, formatter):\n        self.formatter = formatter\n\n    def render(self, payload):\n        return self.formatter.format(payload)\n\nformatter = PrefixFormatter(JsonFormatter(), 'REPORT:')\nreport = Report(formatter)\nprint(report.render({'score': 90, 'name': 'Kim'}))\nprint(f'wrapper={type(report.formatter).__name__}|inner={type(report.formatter.inner).__name__}')",
      walkthrough: [
        { lines: "1-5", explanation: "JsonFormatter가 deterministic JSON serialization policy 하나를 구현합니다." },
        { lines: "7-13", explanation: "PrefixFormatter가 inner formatter를 포함하고 같은 작은 format interface로 behavior를 감쌉니다." },
        { lines: "15-20", explanation: "Report는 formatter concrete base class를 상속 요구하지 않고 collaborator에 위임합니다." },
        { lines: "22-25", explanation: "composition root에서 두 policies를 조립해 output과 runtime 구조를 확인합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 라이브러리 json"], command: "python formatter_composition.py" },
      output: { value: "REPORT:{\"name\":\"Kim\",\"score\":90}\nwrapper=PrefixFormatter|inner=JsonFormatter", explanation: ["Report는 formatter 구현의 상속 관계를 알지 못합니다.", "wrapper와 inner policy를 runtime에 조합합니다.", "sort_keys로 exact JSON 순서를 고정합니다."] },
      experiments: [
        { change: "JsonFormatter 대신 FakeFormatter를 주입합니다.", prediction: "Report class 변경 없이 deterministic test 결과를 만들 수 있습니다.", result: "constructor injection이 test seam을 제공합니다." },
        { change: "PrefixFormatter 두 개를 중첩합니다.", prediction: "바깥 prefix부터 순서대로 결과에 붙습니다.", result: "조합 순서를 composition root에서 관리합니다." },
        { change: "Report가 JsonFormatter를 상속하게 바꿉니다.", prediction: "Report가 JSON formatter의 한 종류라는 잘못된 is-a contract가 생깁니다.", result: "has-a relation에는 composition을 유지합니다." },
      ],
      sourceRefs: ["python-typing-protocol-031", "python-classes-inheritance-031", "python-abc-031"],
    }],
    diagnostics: [
      { symptom: "독립 정책 조합마다 subclass가 기하급수적으로 늘어납니다.", likelyCause: "format·cache·region 같은 orthogonal variations를 단일 inheritance tree에 넣었습니다.", checks: ["변화 축을 나열합니다.", "각 subclass가 override하는 책임을 비교합니다.", "작은 strategy interface로 분리 가능한지 봅니다."], fix: "독립 정책을 collaborator objects로 분리하고 composition root에서 조합합니다.", prevention: "새 variation 추가 시 기존 classes 수정 수와 조합 수를 architecture test/review에서 봅니다." },
    ],
  },
  {
    id: "subclass-creation-hooks-registration",
    title: "`__init_subclass__` hook으로 subclass 선언 시점의 contract와 registry를 검증합니다",
    lead: "instance __init__보다 앞선 class creation lifecycle에서 plugin key·required metadata를 검사할 수 있지만 import-time side effect와 global registry 수명을 관리해야 합니다.",
    explanations: [
      "base class의 `__init_subclass__`는 직접 subclass가 만들어질 때 호출됩니다. class header keyword를 받아 metadata를 검증하고 super로 나머지를 전달하면 metaclass보다 가벼운 extension hook이 됩니다.",
      "cooperative multiple inheritance에서 __init_subclass__도 keyword를 자기 몫만 소비하고 `super().__init_subclass__(**kwargs)`를 호출해야 다른 bases가 hook에 참여합니다.",
      "plugin registry는 class definition, 즉 module import 시간에 변경됩니다. optional plugin이 import되지 않으면 등록도 되지 않으며 reload·중복 import name·test isolation 정책이 필요합니다.",
      "동일 key를 조용히 overwrite하면 import 순서에 따라 구현이 바뀝니다. duplicate를 class creation error로 거부하고 error에 key와 class 이름을 명확히 남깁니다.",
      "registry가 untrusted module을 자동 import하거나 class name 문자열을 eval하지 않게 합니다. plugin discovery는 설치 metadata entry points 같은 명시적 mechanism과 allowlist를 사용합니다.",
      "subclass hook은 instance invariant를 대신하지 않습니다. class metadata는 hook에서, 각 object 값·resource는 __init__/factory/context manager에서 검증합니다.",
      "runtime subclass 생성이 많으면 registry가 classes를 강하게 참조해 unload를 막을 수 있습니다. application lifecycle에 맞춰 registry owner·weak reference·cleanup 필요성을 검토합니다.",
    ],
    concepts: [
      { term: "class creation hook", definition: "subclass 객체가 만들어지는 시점에 base class가 metadata와 선언 계약을 검사하는 __init_subclass__ 확장점입니다.", detail: ["instance 생성 전입니다.", "cooperative super를 사용합니다."] },
      { term: "plugin registry", definition: "안정된 key를 구현 class에 연결해 factory가 선택할 수 있게 하는 mapping입니다.", detail: ["import lifecycle과 연결됩니다.", "중복·신뢰 정책이 필요합니다."] },
    ],
    codeExamples: [{
      id: "python-init-subclass-plugin-registry",
      title: "subclass key를 선언 시점에 검증하고 plugin registry에 등록합니다",
      language: "python",
      filename: "plugin_registry.py",
      purpose: "__init_subclass__의 class header keyword·cooperative super·duplicate policy를 작은 deterministic registry로 확인합니다.",
      code: "class Plugin:\n    registry = {}\n\n    def __init_subclass__(cls, *, key, **kwargs):\n        super().__init_subclass__(**kwargs)\n        if not key:\n            raise ValueError('plugin key required')\n        if key in Plugin.registry:\n            raise ValueError(f'duplicate plugin: {key}')\n        cls.key = key\n        Plugin.registry[key] = cls\n\nclass JsonPlugin(Plugin, key='json'):\n    def render(self, value):\n        return f'json:{value}'\n\nclass TextPlugin(Plugin, key='text'):\n    def render(self, value):\n        return f'text:{value}'\n\nselected = Plugin.registry['json']()\nprint(f'keys={sorted(Plugin.registry)}|types={[Plugin.registry[key].__name__ for key in sorted(Plugin.registry)]}')\nprint(f'selected={type(selected).__name__}|result={selected.render(42)}')",
      walkthrough: [
        { lines: "1-11", explanation: "base hook이 key를 소비하고 super에 나머지를 전달한 뒤 empty·duplicate를 거부해 registry를 갱신합니다." },
        { lines: "13-19", explanation: "두 subclass가 class header keyword로 서로 다른 stable key를 선언합니다." },
        { lines: "21-23", explanation: "registry factory로 json implementation을 만들고 sorted metadata와 behavior를 출력합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 문법만 사용"], command: "python plugin_registry.py" },
      output: { value: "keys=['json', 'text']|types=['JsonPlugin', 'TextPlugin']\nselected=JsonPlugin|result=json:42", explanation: ["class definitions가 실행될 때 두 registrations가 완료됩니다.", "sorted key 순서로 exact metadata를 출력합니다.", "registry에서 선택한 class를 instance화합니다."] },
      experiments: [
        { change: "key='json'인 subclass를 하나 더 선언합니다.", prediction: "class creation 중 duplicate ValueError가 납니다.", result: "import 순서 overwrite를 차단합니다." },
        { change: "한 subclass에서 super hook 호출을 가로막는 다른 base를 섞습니다.", prediction: "다음 hook이 실행되지 않을 수 있습니다.", result: "모든 participating bases가 cooperative protocol을 지켜야 합니다." },
        { change: "plugin module을 import하지 않습니다.", prediction: "registry에 그 implementation이 없습니다.", result: "discovery/import lifecycle을 entrypoint에서 명시합니다." },
      ],
      sourceRefs: ["python-init-subclass-031", "python-super-doc", "python-type-mro-031", "py-inheritance-source"],
    }],
    diagnostics: [
      { symptom: "plugin이 어떤 실행에서는 registry에 있고 다른 실행에서는 없습니다.", likelyCause: "registration이 module import-time class definition에 의존하지만 plugin discovery/import 순서가 명시되지 않았습니다.", checks: ["등록 class module이 실제 import됐는지 봅니다.", "registry 초기화·reload·test cleanup을 추적합니다.", "entry point metadata를 확인합니다."], fix: "composition root에서 plugin discovery를 명시적으로 실행하고 duplicate·missing key를 startup validation으로 거부합니다.", prevention: "clean process에서 설치된 plugins 목록과 registry snapshot을 integration test합니다." },
    ],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...advancedInheritanceChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "python-init-subclass-031", repository: "Python Language Reference", path: "object.__init_subclass__", publicUrl: "https://docs.python.org/3/reference/datamodel.html#object.__init_subclass__", usedFor: ["class creation hook", "class keywords", "cooperative super", "registration"], evidence: "subclass 생성 시 hook 호출과 class header keyword 전달 규칙을 공식 데이터 모델로 확인했습니다." },
  { id: "python-type-mro-031", repository: "Python Standard Library", path: "type.mro", publicUrl: "https://docs.python.org/3/library/stdtypes.html#class.__mro__", usedFor: ["__mro__", "method lookup order", "multiple inheritance diagnostics"], evidence: "class의 method resolution order를 관찰하는 표준 attribute를 공식 문서로 확인했습니다." },
  { id: "python-abc-031", repository: "Python Standard Library", path: "abc — Abstract Base Classes", publicUrl: "https://docs.python.org/3/library/abc.html", usedFor: ["nominal contracts", "abstract methods", "subclass hooks", "composition comparison"], evidence: "ABC의 nominal interface와 subclass customization 범위를 공식 문서로 확인했습니다." },
  { id: "python-typing-protocol-031", repository: "Python Standard Library", path: "typing.Protocol", publicUrl: "https://docs.python.org/3/library/typing.html#typing.Protocol", usedFor: ["structural interface", "strategy typing", "composition", "substitutability"], evidence: "상속 없이 format method 계약을 표현하는 structural typing API를 공식 문서로 확인했습니다." },
  { id: "python-classes-inheritance-031", repository: "Python Tutorial", path: "Inheritance and Multiple Inheritance", publicUrl: "https://docs.python.org/3/tutorial/classes.html#inheritance", usedFor: ["isinstance", "issubclass", "method lookup", "multiple inheritance"], evidence: "Python class inheritance와 dynamic MRO 개요를 공식 tutorial로 확인했습니다." },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "super()는 항상 소스에 적힌 직접 부모만 호출하나요?", answer: "아닙니다. 현재 class 다음 MRO 위치부터 lookup하므로 sibling class가 다음일 수 있습니다." },
  { question: "cooperative __init__에서 각 class는 kwargs를 어떻게 처리하나요?", answer: "자기 keyword만 소비하고 나머지를 super로 전달하며 root가 잔여값을 검증합니다." },
  { question: "diamond에서 부모 이름 직접 호출이 위험한 이유는 무엇인가요?", answer: "shared ancestor를 두 번 호출하거나 MRO의 sibling initializer를 건너뛸 수 있기 때문입니다." },
  { question: "코드 재사용이 있으면 상속을 선택해도 되나요?", answer: "먼저 semantic is-a와 substitutability가 성립해야 하며 단순 재사용에는 composition이 더 적합할 수 있습니다." },
  { question: "strategy composition이 subclass explosion을 줄이는 이유는 무엇인가요?", answer: "독립 변화 축을 각각 객체로 구현해 모든 조합을 별도 subclass로 만들지 않아도 되기 때문입니다." },
  { question: "__init_subclass__는 instance가 만들어질 때 호출되나요?", answer: "아닙니다. subclass class 객체가 선언·생성될 때 호출됩니다." },
  { question: "plugin registry가 import lifecycle과 결합되는 이유는 무엇인가요?", answer: "class definition이 module import 때 실행되어 그 시점에 registration side effect가 발생하기 때문입니다." },
);

(session.completionChecklist as string[]).push(
  "MRO를 출력하고 super의 다음 lookup 위치를 설명한다.",
  "cooperative signature로 keyword를 소비·전달한다.",
  "diamond initializer가 정확히 한 번씩 실행됨을 검증했다.",
  "상속 선택 전에 semantic is-a와 substitutability를 검사한다.",
  "독립 정책은 strategy composition으로 조립한다.",
  "__init_subclass__ hook에서 class metadata를 검증한다.",
  "plugin registry의 import·duplicate·cleanup lifecycle을 관리한다.",
);
