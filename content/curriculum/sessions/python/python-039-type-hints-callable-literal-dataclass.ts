import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-039"],
  slug: "python-039-type-hints-callable-literal-dataclass",
  courseId: "python",
  moduleId: "04-reliability-tooling",
  order: 39,
  title: "타입 힌트·Callable·Literal·dataclass",
  subtitle: "실행을 강제하지 않는 annotation을 정적 계약으로 활용하고, 구조·함수·선택값·데이터 모델을 도구가 검증할 수 있는 형태로 설계합니다.",
  level: "고급",
  estimatedMinutes: 180,
  coreQuestion: "동적 Python의 유연성을 유지하면서도 함수·컬렉션·None·callback·데이터 객체의 잘못된 조합을 실행 전에 발견하고, 외부 입력 검증과 혼동하지 않으려면 타입 체계를 어떻게 적용할까요?",
  summary: "원본 add('3','5')가 hint를 어겨도 '35'로 실행되는 증거에서 출발합니다. list/tuple/dict 중첩, Union·Optional narrowing, Callable·Literal·TypeAlias, dataclass 자동 init/repr/eq를 다룹니다. Sequence·Mapping·Iterable·variance, Protocol·TypeVar·generic·ParamSpec, overload·Never·TypeGuard, mutable default·frozen·slots·__post_init__, mypy/pyright/stub/strict adoption과 runtime schema validation 분리까지 확장합니다.",
  objectives: [
    "annotation이 기본 runtime type enforcement가 아니며 __annotations__와 정적 검사 도구가 사용하는 metadata라는 점을 설명할 수 있다.",
    "list[T]·tuple 위치/가변·dict[K,V]·중첩 collection을 정확히 표현하고 concrete와 abstract collection type을 선택할 수 있다.",
    "T | None·Union·Literal을 사용하고 None check·isinstance로 type narrowing을 만들 수 있다.",
    "Callable signature와 Protocol을 사용해 callback·구조적 interface의 입력·반환 계약을 표현할 수 있다.",
    "TypeAlias·NewType·generic TypeVar로 같은 runtime type의 domain 의미와 입력-출력 관계를 표현할 수 있다.",
    "dataclass 생성 method·field default·default_factory·frozen·slots·__post_init__의 책임과 한계를 설명할 수 있다.",
    "mypy·pyright를 CI에 단계적으로 도입하고 Any·ignore·untyped library 경계를 관리할 수 있다.",
    "외부 JSON·사용자 입력에는 annotation과 별도로 runtime parse·schema validation이 필요함을 적용할 수 있다.",
  ],
  prerequisites: [
    { title: "클래스·객체·생성자", reason: "dataclass가 생성하는 __init__·repr·eq와 invariant를 일반 class 모델과 비교합니다.", sessionSlug: "python-028-class-object-constructor" },
    { title: "함수 계약·스코프·반환", reason: "매개변수·반환·예외 계약을 정적 타입으로 표현합니다.", sessionSlug: "python-021-function-contract-scope-return" },
    { title: "lambda·map·filter·고차 함수", reason: "Callable·Protocol callback의 signature를 실제 고차 함수와 연결합니다.", sessionSlug: "python-023-lambda-map-filter-higher-order" },
  ],
  keywords: ["Python", "type hints", "annotation", "mypy", "pyright", "Optional", "Union", "Callable", "Literal", "Protocol", "TypeVar", "dataclass", "runtime validation"],
  chapters: [
    {
      id: "annotations-not-enforcement",
      title: "타입 힌트는 기본적으로 실행을 막지 않고 사람·IDE·정적 분석기의 계약 자료입니다",
      lead: "def add(a:int,b:int)->int라도 add('3','5')는 runtime에서 문자열 연결 '35'를 반환할 수 있습니다.",
      explanations: [
        "원본은 정확히 이 경계를 실행해 hint 위반이 오류 없이 동작함을 보여 줍니다. Python function call은 annotation을 자동 검사·변환하지 않습니다. annotation은 function.__annotations__에 저장되거나 future annotations 정책에 따라 문자열 형태로 지연될 수 있습니다.",
        "정적 type checker는 code 실행 없이 가능한 type 흐름을 분석해 잘못된 호출·None 접근·반환 누락을 찾습니다. 모든 동적 동작을 증명하지 못하며 Any·동적 import·untyped library 경계에서는 검사가 약해집니다.",
        "annotation을 runtime decorator가 읽어 강제하는 framework도 있지만 그 동작은 framework 계약입니다. Python 기본 힌트와 혼동하지 않고 validation·coercion·error type·성능을 확인합니다.",
        "annotation이 실제 코드와 drift하면 false confidence를 만듭니다. return annotation만 고치지 말고 모든 branch와 test·consumer를 함께 검증합니다. type checker를 CI에서 실행해야 주석이 살아 있는 계약이 됩니다.",
      ],
      concepts: [
        { term: "type annotation", definition: "변수·매개변수·반환·field의 예상 타입을 표현해 도구와 독자에게 제공하는 metadata입니다.", detail: ["기본 runtime 강제가 아닙니다.", "typing specification과 Python version에 따라 해석됩니다."] },
        { term: "static type checker", definition: "프로그램을 실제 실행하지 않고 annotation과 code 흐름을 분석해 타입 불일치를 찾는 도구입니다.", detail: ["mypy·pyright가 대표적입니다.", "runtime input validation을 대체하지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "hints-vs-runtime",
          title: "annotation과 실제 runtime type을 나란히 관찰",
          language: "python",
          filename: "typing_runtime.py",
          purpose: "원본 add hint 위반과 Optional narrowing의 정상 흐름을 실행해 정적·runtime 책임을 구분합니다.",
          code: "def add(a: int, b: int) -> int:\n    return a + b\n\ndef find_user(user_id: int) -> str | None:\n    return {1: '둘리', 2: '도우너'}.get(user_id)\n\nprint(add(3, 5), type(add(3, 5)).__name__)\nwrong = add('3', '5')\nprint(wrong, type(wrong).__name__)\nprint(add.__annotations__)\n\nfor user_id in [1, 99]:\n    user = find_user(user_id)\n    if user is None:\n        print(f'{user_id}: missing')\n    else:\n        print(f'{user_id}: {user.upper()}')",
          walkthrough: [
            { lines: "1-2", explanation: "annotation은 int 입력·반환 의도를 표현하지만 runtime check를 넣지 않습니다." },
            { lines: "4-5", explanation: "찾지 못할 수 있는 반환을 str | None으로 명시합니다." },
            { lines: "7-10", explanation: "정상 int 결과와 checker가 경고할 문자열 호출의 실제 str '35', annotation metadata를 출력합니다." },
            { lines: "12-17", explanation: "None 분기 뒤 else에서 checker는 user를 str로 좁혀 upper 호출을 허용합니다." },
          ],
          run: { environment: ["Python 3.10 이상", "typing_runtime.py로 저장"], command: "python typing_runtime.py" },
          output: { value: "8 int\n35 str\n{'a': <class 'int'>, 'b': <class 'int'>, 'return': <class 'int'>}\n1: 둘리\n99: missing", explanation: ["정상 호출은 int 8, 위반 호출은 runtime 오류 없이 str 35입니다.", "annotation은 function metadata에 남습니다.", "Optional 값은 None check 뒤 안전하게 str method를 사용합니다."] },
          experiments: [
            { change: "user is None 분기를 제거하고 바로 user.upper()를 호출합니다.", prediction: "정적 checker가 Optional 접근을 경고하고 user_id 99에서 AttributeError가 납니다.", result: "narrowing은 runtime 안전과 정적 증명을 함께 만듭니다." },
            { change: "add 안에서 isinstance validation을 추가합니다.", prediction: "문자열 호출은 runtime TypeError가 됩니다.", result: "그 검사는 annotation이 아니라 함수가 명시한 별도 runtime 계약입니다." },
          ],
          sourceRefs: ["py-typing-basic-source", "py-typing-optional-source", "python-typing-doc"],
        },
      ],
      diagnostics: [
        { symptom: "타입 힌트를 썼는데 production에 잘못된 타입이 들어온다.", likelyCause: "annotation이 외부 input을 runtime validate한다고 가정했거나 type checker를 실행하지 않습니다.", checks: ["CI에 mypy/pyright 명령이 있는지 봅니다.", "입력 trust boundary의 parser·validator를 확인합니다.", "Any와 type:ignore가 오류 흐름을 가리는지 봅니다."], fix: "정적 검사를 CI에 연결하고 외부 경계에는 명시 runtime validation을 추가합니다.", prevention: "typed core와 validated boundary architecture, strictness metric을 유지합니다." },
      ],
    },
    {
      id: "collection-types-abstractions",
      title: "collection 타입은 요소·key·길이 shape와 함수가 실제로 요구하는 capability를 표현합니다",
      lead: "list[int]와 tuple[int,int], tuple[int,...], dict[str,list[int]]는 서로 다른 mutation·길이·조회 계약입니다.",
      explanations: [
        "원본 scores:list[int], point:tuple[int,int], mixed:tuple[str,int,bool], matrix:list[list[int]]는 내부 shape를 드러냅니다. tuple[int,...]는 임의 길이 동일 int이고 tuple[int,int]는 정확히 두 위치입니다.",
        "함수가 읽기·iteration만 한다면 list[float]보다 Sequence[float]·Iterable[float]가 tuple 등 더 많은 caller를 허용합니다. 그러나 len·여러 번 순회가 필요하면 Iterable보다 Collection/Sequence가 실제 요구에 맞습니다.",
        "받은 collection을 mutate한다면 MutableSequence와 명시 이름을 사용하거나 list를 요구합니다. 읽기 전용 Mapping을 받으면 dict subclass·proxy도 허용하고 반환은 concrete dict로 정할 수 있습니다.",
        "generic container의 variance 때문에 list[Dog]를 list[Animal]로 넘기는 것이 안전하지 않을 수 있습니다. 함수가 Animal을 append하면 원래 Dog list가 깨지기 때문입니다. 읽기 전용 Sequence는 covariance를 활용할 수 있습니다.",
      ],
      concepts: [
        { term: "generic collection", definition: "list[T]·dict[K,V]처럼 container와 내부 요소 타입 관계를 함께 표현한 타입입니다.", detail: ["nested shape도 표현합니다.", "runtime 요소 검증은 자동이 아닙니다."] },
        { term: "variance", definition: "subtype 관계가 generic container type 사이에서 어떤 방향으로 전달되는지 나타내는 규칙입니다.", detail: ["mutable list는 invariant입니다.", "읽기 전용 Sequence는 covariant입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "list[Dog]를 Animal collection 함수에 넘겼는데 checker가 거부한다.", likelyCause: "함수가 mutable list[Animal]을 받아 다른 Animal을 append할 수 있어 list generic이 invariant입니다.", checks: ["함수가 실제 collection을 mutate하는지 확인합니다.", "Sequence·Iterable로 충분한지 봅니다.", "copy와 반환 계약을 검토합니다."], fix: "읽기만 하면 Sequence[Animal] 등 capability type을 받고 mutation이 필요하면 새 list를 만들어 반환하거나 안전한 generic 관계를 설계합니다.", prevention: "구체 container보다 최소 required protocol을 signature에 사용합니다." },
      ],
    },
    {
      id: "union-optional-literal-narrowing",
      title: "Union·Optional·Literal은 가능한 상태를 표현하고 분기로 안전하게 좁힙니다",
      lead: "타입을 넓게 쓰는 것이 유연성은 아니며 caller와 구현이 각 variant를 모두 처리해야 합니다.",
      explanations: [
        "T | None은 값 없음이 정상 가능한 상태라는 뜻입니다. truthiness if value로 검사하면 0·빈 문자열까지 없음으로 오해할 수 있어 is None을 사용합니다. Optional[T]는 T | None과 같습니다.",
        "int | str를 받은 함수는 isinstance로 branch해 각 타입에서 가능한 연산을 수행합니다. 지나치게 많은 Union은 함수가 여러 책임을 가진 신호일 수 있습니다. parsing boundary에서 domain type 하나로 정규화합니다.",
        "Literal['left','center','right']는 정해진 문자열 값을 checker가 구분하게 합니다. runtime에서 'middle'을 자동 거부하지 않으므로 외부 입력은 membership validation이 필요합니다. 선택이 성장하면 Enum이 이름·iteration·runtime identity에 유리할 수 있습니다.",
        "match·isinstance·is None·TypeGuard는 narrowing을 돕습니다. cast는 runtime 변환·검사가 아니라 checker에게 믿으라고 지시하므로 실제 증거 없이 쓰면 오류를 숨깁니다.",
      ],
      concepts: [
        { term: "type narrowing", definition: "조건·pattern·guard를 통해 Union 변수의 가능한 타입 집합을 특정 branch에서 더 작게 증명하는 과정입니다.", detail: ["isinstance·is None이 대표적입니다.", "cast는 증명 없이 정적 관점만 바꿉니다."] },
        { term: "Literal", definition: "특정 값들의 집합만 허용하는 정적 타입입니다.", detail: ["값 기반 overload·상태에 유용합니다.", "runtime validation은 별도입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "Optional 값의 0·빈 문자열이 missing branch로 들어간다.", likelyCause: "None 여부 대신 truthiness로 narrowing했습니다.", checks: ["if value와 if value is None을 비교합니다.", "0·False·''가 유효한 domain인지 확인합니다.", "checker reveal_type 결과를 봅니다."], fix: "없음 sentinel은 is None으로 검사하고 값 유효성은 별도 조건으로 처리합니다.", prevention: "None·0·empty·정상값 table test를 둡니다." },
      ],
    },
    {
      id: "callable-protocol-generics",
      title: "Callable은 함수 shape를, Protocol은 이름 있는 행동 구조를, generic은 타입 관계를 표현합니다",
      lead: "Callable[[int,int],int]는 두 int를 받아 int를 반환하는 호출 가능 객체를 표현하지만 parameter 이름·overload·attribute는 Protocol이 더 잘 나타냅니다.",
      explanations: [
        "원본 apply는 Callable[[int,int],int]를 받아 덧셈·곱셈 lambda를 같은 contract로 호출합니다. 함수뿐 아니라 compatible __call__ 객체와 bound method도 들어올 수 있습니다.",
        "callback에 keyword-only parameter·attribute·여러 overload가 필요하면 class Protocol에 __call__ signature를 정의합니다. service dependency도 Protocol method들로 구조적 typing해 구체 class 상속 없이 fake를 주입할 수 있습니다.",
        "TypeVar는 identity(x:T)->T처럼 입력과 반환이 같은 구체 타입이라는 관계를 보존합니다. object로 쓰면 관계가 사라지고 Any는 검사를 전파해 오류를 숨깁니다. generic class는 Container[T]처럼 field와 method에 관계를 유지합니다.",
        "decorator가 원래 callable signature를 보존하려면 ParamSpec과 TypeVar를 사용할 수 있습니다. 단순 Callable[...,Any]는 caller 검사를 잃습니다. functools.wraps는 runtime metadata, ParamSpec은 정적 signature를 보완합니다.",
      ],
      concepts: [
        { term: "Protocol", definition: "명시 상속 없이 필요한 attribute·method 구조를 만족하는 타입을 정적으로 표현하는 structural interface입니다.", detail: ["dependency inversion과 plugin contract에 유용합니다.", "runtime semantic validation을 자동 제공하지 않습니다."] },
        { term: "TypeVar", definition: "generic 함수·class의 여러 위치에서 같은 또는 제한된 타입 관계를 표현하는 타입 변수입니다.", detail: ["입력-출력 구체 type을 보존합니다.", "bound·constraint를 설정할 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "decorator를 거친 함수가 checker에서 Callable[..., Any]가 되어 잘못된 인수도 통과한다.", likelyCause: "wrapper를 *args/**kwargs와 Any로만 annotation해 원래 signature 관계를 잃었습니다.", checks: ["reveal_type(decorated)를 확인합니다.", "ParamSpec·TypeVar 사용 여부를 봅니다.", "functools.wraps와 stub을 확인합니다."], fix: "ParamSpec으로 parameter specification을 전달하고 TypeVar로 반환 type을 보존합니다.", prevention: "decorated 함수의 정상·잘못된 호출 type-check fixture를 둡니다." },
      ],
    },
    {
      id: "aliases-newtype-overload",
      title: "별칭·NewType·overload는 복잡한 타입과 domain 의미, 호출별 반환 관계를 더 정확히 표현합니다",
      lead: "Matrix=list[list[float]] 별칭은 읽기 이름일 뿐 새로운 runtime type이 아니며 UserId·OrderId 혼동에는 NewType·value object가 낫습니다.",
      explanations: [
        "Python 최신 문법의 type Matrix = list[list[float]] 또는 TypeAlias는 긴 shape에 domain 이름을 줍니다. alias는 checker에서 펼쳐질 수 있고 runtime validation·constructor를 추가하지 않습니다.",
        "NewType('UserId',int)는 checker가 일반 int·다른 ID와 구분하지만 runtime에는 거의 identity function입니다. 범위·format validation이 필요하면 frozen dataclass value object를 사용합니다.",
        "@overload는 Literal flag나 입력 type에 따른 반환 type 관계를 여러 signature로 설명하고 마지막 runtime implementation 하나를 둡니다. implementation을 생략하거나 decorator body를 실행하려 하면 안 됩니다.",
        "Never는 정상 반환하지 않는 함수·도달 불가능 branch를 표현하고 assert_never로 exhaustive union handling을 검사할 수 있습니다. runtime 새 variant가 들어오는 신뢰 경계는 별도 거부합니다.",
      ],
      concepts: [
        { term: "type alias", definition: "복잡한 타입 표현에 읽기 쉬운 이름을 부여하는 정적 동의어입니다.", detail: ["새 runtime class가 아닙니다.", "recursive·generic alias도 가능합니다."] },
        { term: "NewType", definition: "같은 runtime 기반 타입을 checker에서 서로 다른 nominal domain 타입처럼 구분하는 helper입니다.", detail: ["runtime validation은 없습니다.", "강한 invariant에는 value object가 적합합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "UserId와 OrderId가 둘 다 int라 잘못 바꿔 전달해도 checker가 못 잡는다.", likelyCause: "domain ID를 모두 plain int alias로 표현해 nominal 차이가 없습니다.", checks: ["ID alias가 단순 TypeAlias인지 확인합니다.", "함수 signature에서 ID 종류가 섞이는지 봅니다.", "runtime 범위 validation 필요성을 검토합니다."], fix: "NewType 또는 frozen value object로 domain identity를 분리합니다.", prevention: "서로 다른 ID를 뒤바꾼 negative type-check test를 둡니다." },
      ],
    },
    {
      id: "dataclass-data-models",
      title: "dataclass는 반복 boilerplate를 생성하지만 invariant·가변성·상속 설계는 여전히 우리가 책임집니다",
      lead: "field annotation으로 __init__·repr·eq 등을 만들며 list field는 default_factory로 instance마다 새 객체를 생성합니다.",
      explanations: [
        "원본 Student(name,age,scores)는 자동 repr과 constructor를 얻고 average method를 가집니다. @dataclass는 annotation type을 runtime enforce하지 않아 Student(1,'x',[])도 constructor 단계에서 자동 거부하지 않습니다.",
        "scores:list[int]=[]는 mutable default라 dataclass가 오류로 막는 경우가 있으며 field(default_factory=list)를 사용합니다. 전달된 list 자체를 보존하면 caller mutation이 객체에 보일 수 있어 tuple로 변환하거나 copy합니다.",
        "__post_init__은 generated __init__ 뒤 invariant validation·derived field 계산에 사용할 수 있습니다. validation 전에 외부 registry side effect를 만들지 않습니다. InitVar와 field(init=False)도 책임을 문서화합니다.",
        "frozen=True는 attribute assignment를 막아 hashable value object에 도움 되지만 nested list까지 불변으로 만들지 않습니다. slots=True는 __dict__ memory를 줄이고 임의 attribute 추가를 막지만 inheritance·weakref·serialization 호환을 확인합니다.",
      ],
      concepts: [
        { term: "dataclass", definition: "annotated field를 바탕으로 __init__·repr·eq 등 data-oriented class boilerplate를 생성하는 표준 decorator입니다.", detail: ["runtime type enforcement가 아닙니다.", "field·frozen·slots·order option을 제공합니다."] },
        { term: "default_factory", definition: "instance 생성 때마다 field 기본 객체를 새로 만드는 callable입니다.", detail: ["list·dict·set mutable default 공유를 막습니다.", "인수 없이 호출됩니다."] },
      ],
      codeExamples: [
        {
          id: "validated-frozen-student",
          title: "불변 tuple과 __post_init__ invariant가 있는 Student",
          language: "python",
          filename: "typed_dataclass.py",
          purpose: "dataclass 자동 repr·eq, runtime invariant, immutable scores와 callback Protocol을 함께 확인합니다.",
          code: "from dataclasses import dataclass\nfrom typing import Protocol, Literal\n\nclass Formatter(Protocol):\n    def __call__(self, student: 'Student') -> str: ...\n\n@dataclass(frozen=True, slots=True)\nclass Student:\n    name: str\n    scores: tuple[int, ...]\n    level: Literal['beginner', 'advanced'] = 'beginner'\n\n    def __post_init__(self):\n        if not self.name.strip():\n            raise ValueError('name must not be empty')\n        if not self.scores or any(type(score) is not int or not 0 <= score <= 100 for score in self.scores):\n            raise ValueError('scores must contain integers from 0 to 100')\n\n    def average(self) -> float:\n        return sum(self.scores) / len(self.scores)\n\ndef render(student: Student, formatter: Formatter) -> str:\n    return formatter(student)\n\nstudent = Student('둘리', (90, 80, 100), 'advanced')\nprint(student)\nprint(f'average={student.average():.1f}')\nprint(render(student, lambda value: f'{value.name}:{value.level}'))\nprint(student == Student('둘리', (90, 80, 100), 'advanced'))",
          walkthrough: [
            { lines: "1-5", explanation: "Formatter Protocol은 Student 하나를 받아 str을 반환하는 callback 구조를 이름 있게 표현합니다." },
            { lines: "7-12", explanation: "frozen+slots dataclass에 불변 tuple scores와 Literal level을 선언합니다." },
            { lines: "14-18", explanation: "annotation과 별도로 name·scores runtime invariant를 __post_init__에서 검증합니다." },
            { lines: "20-24", explanation: "average instance method와 Protocol callback을 받는 render를 만듭니다." },
            { lines: "26-29", explanation: "자동 repr, 평균, lambda callback, 자동 value equality를 확인합니다." },
          ],
          run: { environment: ["Python 3.10 이상", "typed_dataclass.py로 저장"], command: "python typed_dataclass.py" },
          output: { value: "Student(name='둘리', scores=(90, 80, 100), level='advanced')\naverage=90.0\n둘리:advanced\nTrue", explanation: ["generated repr와 eq가 세 field를 사용합니다.", "tuple과 frozen은 일반 assignment·append를 막아 value 의미를 강화합니다.", "Protocol은 lambda를 명시 상속 없이 callback으로 허용합니다."] },
          experiments: [
            { change: "scores를 list[int]로 바꾸고 caller list를 전달한 뒤 append합니다.", prediction: "frozen이어도 nested list 내용은 바뀌고 평균도 달라집니다.", result: "shallow frozen과 깊은 불변성은 다릅니다." },
            { change: "level='expert'를 전달합니다.", prediction: "기본 runtime에서는 생성되지만 static checker는 Literal 위반을 경고합니다.", result: "외부 입력에는 __post_init__ membership runtime validation도 필요할 수 있습니다." },
          ],
          sourceRefs: ["py-typing-advanced-source", "python-dataclass-doc", "python-protocol-doc"],
        },
      ],
      diagnostics: [
        { symptom: "frozen dataclass인데 내부 list가 바뀌어 hash·평균이 달라진다.", likelyCause: "frozen이 field 이름 재assignment만 막고 nested mutable 객체까지 freeze하지 않습니다.", checks: ["field type에 list·dict·set이 있는지 봅니다.", "caller와 field 객체 id를 비교합니다.", "unsafe_hash 사용 여부를 확인합니다."], fix: "tuple·frozenset·immutable mapping/value object로 변환하고 mutable field를 hash에서 제외하는 의미를 검토합니다.", prevention: "생성 후 외부 원본 mutation과 hash 안정성 test를 둡니다." },
      ],
    },
    {
      id: "static-analysis-and-runtime-boundaries",
      title: "정적 분석은 typed core를 보호하고 외부·동적 경계는 parse·validate·adapter로 좁힙니다",
      lead: "프로젝트 전체를 하루에 strict로 바꾸기보다 module 단위 baseline과 Any 유입 측정으로 단계적으로 강화합니다.",
      explanations: [
        "mypy와 pyright는 같은 typing specification을 지향하지만 default·strict option과 inference가 다를 수 있습니다. 팀 표준 하나를 CI에 고정하고 다른 editor 도구와 차이를 문서화합니다. Python target version을 실제 runtime과 맞춥니다.",
        "legacy untyped function은 Any를 퍼뜨려 downstream 검사를 무력화할 수 있습니다. boundary wrapper에 Protocol·stub·TypedDict를 추가하고 Any를 작은 adapter 안에 가둡니다. ignore는 error code와 이유·만료 issue를 붙입니다.",
        "외부 JSON은 object이므로 TypedDict annotation만 cast하지 말고 runtime schema 검증 후 typed model로 변환합니다. cast는 data를 바꾸지 않습니다. TypeGuard도 함수 구현이 거짓말하면 checker가 속습니다.",
        "CI는 type check, lint, unit test를 모두 실행합니다. type check는 값 범위·I/O·concurrency를 실행하지 않고 test는 모든 branch를 증명하지 못하므로 서로 보완합니다. stubtest·pyright verifytypes로 public package annotation과 runtime API drift를 검사할 수 있습니다.",
      ],
      concepts: [
        { term: "typed boundary", definition: "외부·동적·untyped 값을 parse·validate·adapt해 내부에서 좁고 신뢰 가능한 타입으로 바꾸는 경계입니다.", detail: ["Any 전파를 제한합니다.", "runtime schema와 정적 model을 연결합니다."] },
        { term: "type stub", definition: ".pyi 파일로 runtime implementation과 분리해 module의 public 타입 signature를 기술하는 interface 자료입니다.", detail: ["untyped/extension library를 보완합니다.", "runtime API와 drift하지 않게 검증합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "type checker가 성공하지만 production JSON field 오류가 계속 난다.", likelyCause: "cast·TypedDict annotation으로 외부 data가 실제 검증됐다고 가정했습니다.", checks: ["cast 앞 runtime parser·validator가 있는지 봅니다.", "Any가 model constructor까지 도달하는지 추적합니다.", "schema negative fixture를 실행합니다."], fix: "trust boundary에서 container·field·type·range를 실제 검증하고 validated dataclass/domain model로 변환합니다.", prevention: "schema contract test와 type check를 함께 CI에 둡니다." },
      ],
      comparisons: [
        { title: "타입과 검증 도구의 책임은 무엇인가요?", options: [
          { name: "타입 힌트 + checker", chooseWhen: "개발 중 code 경로·API 조합 오류를 실행 전에 찾을 때", avoidWhen: "외부 입력이 실제 타입인지 runtime에서 증명할 때", tradeoffs: ["빠른 feedback과 refactor 지원을 제공합니다.", "Any·동적 경계에서 약해집니다.", "CI 설정과 annotation 유지가 필요합니다."] },
          { name: "runtime validation", chooseWhen: "JSON·사용자·DB·network 값을 신뢰 가능한 model로 바꿀 때", avoidWhen: "모든 내부 함수 호출마다 중복 검사해 성능·복잡도를 늘릴 때", tradeoffs: ["실제 값을 검사합니다.", "오류·coercion·성능 정책이 필요합니다.", "typed core 경계에 집중합니다."] },
          { name: "unit/property test", chooseWhen: "값 범위·상태·I/O·알고리즘 행동을 실행 증거로 검증할 때", avoidWhen: "모든 가능한 API 조합을 sample만으로 증명하려 할 때", tradeoffs: ["runtime 행동을 검증합니다.", "선택한 사례만 실행합니다.", "type checker와 상호 보완합니다."] },
        ] },
      ],
      expertNotes: ["공개 generic API는 variance·overload·Protocol 안정성이 consumer source compatibility에 영향을 주므로 type-only breaking change도 semantic versioning에서 검토합니다.", "Python version별 annotation evaluation 정책과 typing_extensions backport를 library support matrix에 고정하고 get_type_hints가 import·forward reference를 평가하는 보안·성능을 고려합니다."],
    },
  ],
  lab: {
    title: "typed 학습 진도 domain과 JSON 경계",
    scenario: "외부 JSON dict를 검증해 frozen dataclass Progress로 변환하고 callback·repository Protocol을 통해 처리하는 typed core를 만듭니다.",
    setup: ["progress_types.py, progress_parser.py, test_progress.py, typecheck fixture를 만듭니다.", "Python 3.11 target과 팀 type checker strict config를 정합니다.", "합성 JSON만 사용합니다."],
    steps: ["CourseId·SessionId는 NewType 또는 value object 중 선택 근거를 정합니다.", "ProgressState는 Literal 또는 Enum으로 설계하고 runtime membership을 검증합니다.", "Progress frozen dataclass에 percent·updated_at invariant와 immutable field를 둡니다.", "외부 object를 cast하지 말고 TypedDict/schema parser로 required·extra·type·range를 검증합니다.", "Repository와 Clock을 Protocol로 정의해 fake를 주입합니다.", "Callable/Protocol callback으로 변경 event를 전달하고 signature를 검사합니다.", "generic Result[T,E] 또는 domain exception 중 parse 실패 계약을 선택합니다.", "mypy/pyright strict와 pytest를 실행해 wrong ID·Optional 미검사·invalid Literal negative fixture를 확인합니다.", "dataclass repr·exception·log에 user token이 노출되지 않게 합니다."],
    expectedResult: ["외부 invalid data가 typed core에 들어오기 전에 구조화 오류가 됩니다.", "UserId·CourseId 혼동과 Optional 미검사가 type check에서 발견됩니다.", "frozen Progress가 nested mutable state 없이 안정 value equality를 가집니다.", "fake Repository·Clock가 명시 상속 없이 Protocol을 만족합니다.", "runtime validation과 static check 결과가 서로 다른 failure class를 보완합니다.", "public annotation과 실제 반환 타입이 contract test에서 일치합니다."],
    cleanup: ["합성 fixture만 사용합니다."],
    extensions: ["ParamSpec으로 repository decorator signature를 보존합니다.", "overload로 parse(strict Literal)에 따른 반환 타입을 표현합니다.", "py.typed marker와 stubtest를 적용합니다.", "property-based schema/model round-trip test를 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 typing ex01~04를 실행하고 checker 결과를 별도로 기록하세요.", requirements: ["add('3','5') runtime '35'와 정적 오류를 비교합니다.", "list·tuple·dict·nested annotation을 reveal_type으로 확인합니다.", "Optional None check 전후 narrowing을 봅니다.", "Callable·Literal·dataclass repr/평균을 재현합니다."], hints: ["runtime 출력과 mypy/pyright 출력을 섞지 않습니다.", "잘못된 호출은 negative type fixture로 보존합니다."], expectedOutcome: "annotation metadata·checker·runtime의 세 책임을 구분합니다.", solutionOutline: ["원본을 변경 없이 실행합니다.", "strict type config를 추가합니다.", "경고별 코드 수정·runtime validation 필요 여부를 분류합니다."] },
    { difficulty: "응용", prompt: "typed CSV 학생 import API를 만드세요.", requirements: ["RawRow TypedDict와 validated Student dataclass를 분리합니다.", "Sequence·Mapping 등 최소 capability type을 사용합니다.", "Literal status와 NewType StudentId를 사용합니다.", "오류 issue Result를 generic으로 표현합니다.", "runtime schema·mypy strict·unit test를 모두 통과합니다."], hints: ["cast는 validation이 아닙니다.", "mutable list를 frozen dataclass에 그대로 저장하지 않습니다."], expectedOutcome: "동적 file row를 신뢰 가능한 typed domain으로 변환합니다." },
    { difficulty: "설계", prompt: "대규모 legacy Python 서비스의 점진적 typing 계획을 설계하세요.", requirements: ["module dependency와 Any 유입 boundary를 inventory합니다.", "strictness tier·baseline·신규 코드 gate를 정의합니다.", "third-party stub·Protocol adapter·ignore debt 정책을 만듭니다.", "runtime API·JSON schema·DB model과 static type drift를 검증합니다.", "CI 시간·incremental cache·editor tool 차이를 운영합니다.", "public type compatibility·py.typed·consumer test를 포함합니다."], hints: ["annotation coverage 퍼센트만 높이면 Any가 남을 수 있습니다.", "가장 안정된 domain core와 위험 boundary부터 선택할 수 있습니다."], expectedOutcome: "타입 힌트를 조직적 refactor·호환성·품질 control system으로 확장합니다." },
  ],
  reviewQuestions: [
    { question: "int annotation에 str을 넣으면 Python이 자동 거부하나요?", answer: "기본 runtime에서는 아니며 정적 checker 또는 별도 runtime validation이 필요합니다." },
    { question: "list[int]와 tuple[int,int]는 무엇이 다른가요?", answer: "전자는 가변 길이 int list, 후자는 정확히 두 위치가 int인 tuple을 표현합니다." },
    { question: "Optional[str]은 무엇과 같은가요?", answer: "str | None과 같으며 None 여부를 처리해야 합니다." },
    { question: "Literal['left','right']가 외부 'middle'을 runtime에서 막나요?", answer: "아닙니다. checker용 계약이며 외부 입력에는 membership validation이 필요합니다." },
    { question: "Callable과 Protocol은 언제 구분하나요?", answer: "간단 호출 signature는 Callable, keyword·attribute·여러 method가 있는 구조는 Protocol이 더 명확합니다." },
    { question: "frozen dataclass 안 list도 불변인가요?", answer: "아닙니다. field 재assignment만 막으며 nested list는 변경 가능하므로 tuple 등 immutable 값이 필요합니다." },
    { question: "cast는 값을 변환하거나 검증하나요?", answer: "아닙니다. runtime 효과 없이 checker 관점만 바꿉니다." },
    { question: "type checker와 unit test 중 하나만 있으면 충분한가요?", answer: "아닙니다. 정적 API 조합과 runtime 값·상태 행동을 서로 보완합니다." },
  ],
  completionChecklist: [
    "annotation·정적 checker·runtime validation의 책임을 구분할 수 있다.",
    "collection shape와 최소 capability generic을 선택할 수 있다.",
    "Union·Optional·Literal을 안전하게 narrowing할 수 있다.",
    "Callable·Protocol·TypeVar·ParamSpec의 관계를 설명할 수 있다.",
    "TypeAlias·NewType·overload로 domain 의미와 반환 관계를 표현할 수 있다.",
    "dataclass default_factory·frozen·slots·post_init을 올바르게 사용할 수 있다.",
    "Any·ignore·untyped dependency를 adapter 경계에 제한할 수 있다.",
    "외부 data를 실제 검증한 뒤 typed core로 변환할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-typing-basic-source", repository: "PYTHON-BASIC", path: "day14_typing/ex01_basic.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day14_typing/ex01_basic.py", usedFor: ["변수·함수 annotation", "-> None", "runtime 비강제", "__annotations__"], evidence: "원본을 Python 3.13.9에서 실행해 add(3,5)=8과 hint 위반 add('3','5')='35', annotation dict를 확인했습니다." },
    { id: "py-typing-collections-source", repository: "PYTHON-BASIC", path: "day14_typing/ex02_collections.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day14_typing/ex02_collections.py", usedFor: ["list·tuple·set·dict", "nested collection", "average·word count"], evidence: "원본 collection shape와 평균 84.33·a/b/c 빈도 결과를 감사했습니다." },
    { id: "py-typing-optional-source", repository: "PYTHON-BASIC", path: "day14_typing/ex03_optional_union.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day14_typing/ex03_optional_union.py", usedFor: ["Union", "Optional", "None narrowing", "default None"], evidence: "원본의 int/str description, user 1·99 None branch, optional HTML class 결과를 감사했습니다." },
    { id: "py-typing-advanced-source", repository: "PYTHON-BASIC", path: "day14_typing/ex04_advanced.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day14_typing/ex04_advanced.py", usedFor: ["Callable", "Literal", "type alias", "dataclass"], evidence: "원본 실행에서 apply 8·15, center Literal, transpose, Student 자동 repr와 평균 90.0을 확인했습니다." },
    { id: "python-typing-doc", repository: "Python documentation", path: "library/typing.html", publicUrl: "https://docs.python.org/3/library/typing.html", usedFor: ["Union·Optional·Literal·Callable·Protocol·TypeVar·overload·NewType"], evidence: "공식 typing module 문서를 정적 타입 구조와 advanced 선택의 기준으로 사용했습니다." },
    { id: "python-dataclass-doc", repository: "Python documentation", path: "library/dataclasses.html", publicUrl: "https://docs.python.org/3/library/dataclasses.html", usedFor: ["generated methods", "field", "default_factory", "frozen", "slots", "post_init"], evidence: "공식 dataclasses 계약을 data model 설계의 기준으로 사용했습니다." },
    { id: "python-protocol-doc", repository: "Python documentation", path: "library/typing.html#typing.Protocol", publicUrl: "https://docs.python.org/3/library/typing.html#typing.Protocol", usedFor: ["structural typing", "callback Protocol", "dependency interface"], evidence: "공식 Protocol 설명을 명시 상속 없는 callback·repository contract의 기준으로 사용했습니다." },
  ],
  sourceCoverage: { filesRead: 4, filesUsed: 4, uncoveredNotes: ["각 checker의 모든 strict option과 typing spec proposal은 project support matrix에 맞춰 별도 추적합니다.", "variance·ParamSpec·overload·NewType·stub·typed boundary는 원본 typing 예제를 전문가 library/서비스 수준으로 보강한 내용입니다."] },
} satisfies DetailedSession;

const expertChapters: DetailedSession["chapters"] = [
  {
    id: "runtime-static-callable-literal-narrowing",
    title: "annotation의 runtime 한계와 Callable·Literal·Union narrowing을 함께 설계합니다",
    lead: "type hint는 기본적으로 실행 시 값을 강제하지 않으므로 static checker가 증명할 branch를 작성하고 외부 경계에서는 별도 runtime validation을 수행합니다.",
    explanations: [
      "함수 annotation은 __annotations__ metadata로 저장될 뿐 CPython이 argument·return을 자동 검사하지 않습니다. str을 int parameter에 넣어도 함수 body가 허용하면 실행될 수 있습니다.",
      "Union은 가능한 여러 type을 표현하고 Optional[T]는 T | None과 같은 의미입니다. None 여부를 확인하거나 isinstance·사용자 TypeGuard로 branch를 좁혀야 checker가 안전한 operation을 허용합니다.",
      "Literal은 특정 문자열·정수 값 집합을 API mode로 제한합니다. 외부 JSON은 여전히 임의 str이므로 runtime allowlist validation 후 Literal 변수로 전달합니다.",
      "Callable[[A, B], R]은 호출 signature를 표현하지만 parameter 이름·overload·속성까지 풍부하게 기술하기 어렵습니다. 복잡 callable 객체에는 __call__을 가진 Protocol을 사용합니다.",
      "Any는 type checking을 우회해 오류가 전파되므로 unknown external data에는 object를 사용하고 validation/narrowing으로 안전한 type을 얻는 편이 낫습니다.",
    ],
    concepts: [
      { term: "type narrowing", definition: "조건문·isinstance·TypeGuard 뒤 branch에서 Union/object를 더 구체적인 type으로 좁히는 static 분석입니다.", detail: ["runtime 검사와 연결됩니다.", "checker별 지원 차이를 확인합니다."] },
      { term: "Literal type", definition: "값의 type뿐 아니라 허용되는 특정 literal 값 집합을 표현하는 typing construct입니다.", detail: ["mode·status API에 적합합니다.", "runtime validation을 대신하지 않습니다."] },
    ],
    codeExamples: [{
      id: "typing-runtime-callable-literal-narrowing",
      title: "annotation 비강제와 Literal mode·TypeGuard·Callable 실행을 비교합니다",
      language: "python",
      filename: "typing_boundaries.py",
      purpose: "static type 의도와 실제 runtime behavior를 한 deterministic 예제로 분리합니다.",
      code: String.raw`from collections.abc import Callable
from typing import Literal, TypeGuard

Mode = Literal["keep", "double"]

def annotated_double(value: int) -> int:
    return value * 2

def is_int_list(values: list[object]) -> TypeGuard[list[int]]:
    return all(type(value) is int for value in values)

def transform(
    values: list[int],
    operation: Callable[[int], int],
    mode: Mode,
) -> list[int]:
    if mode == "keep":
        return values.copy()
    return [operation(value) for value in values]

print("annotation_not_enforced:", annotated_double("ha"))
for candidate in [[1, 2, 3], [1, True, 3], [1, "2"]]:
    if is_int_list(candidate):
        print("narrowed:", transform(candidate, lambda value: value * 2, "double"))
    else:
        print("rejected:", candidate)

raw_mode = "triple"
print("runtime_literal_check:", raw_mode in {"keep", "double"})`,
      walkthrough: [
        { lines: "1-10", explanation: "Literal mode와 strict bool 제외 TypeGuard를 정의하고 annotation이 runtime validator가 아님을 준비합니다." },
        { lines: "12-19", explanation: "Callable operation과 Literal mode를 받는 transform의 두 branch를 정의합니다." },
        { lines: "21-27", explanation: "잘못된 str argument도 실행되는 예와 세 object list의 narrowing 결과를 비교합니다." },
        { lines: "28-29", explanation: "외부 raw string에는 별도 allowlist runtime 검사가 필요함을 확인합니다." },
      ],
      run: { environment: ["Python 3.13+", "type checker 실행과 별도의 runtime 예제"], command: "python -I -B -X utf8 typing_boundaries.py" },
      output: { value: "annotation_not_enforced: haha\nnarrowed: [2, 4, 6]\nrejected: [1, True, 3]\nrejected: [1, '2']\nruntime_literal_check: False", explanation: ["bool은 int subclass지만 type(value) is int 정책으로 거부합니다.", "Literal annotation 자체는 raw_mode triple을 runtime에서 막지 않습니다."] },
      experiments: [
        { change: "TypeGuard에서 isinstance(value, int)를 사용합니다.", prediction: "True도 int로 허용됩니다.", result: "type model과 domain policy를 구분합니다." },
        { change: "mode runtime 검사를 제거합니다.", prediction: "동적 caller가 triple을 넘겨도 else branch가 실행될 수 있습니다.", result: "static hint는 untyped boundary를 보호하지 않습니다." },
        { change: "Callable을 Any로 바꿉니다.", prediction: "checker가 operation argument·return 오류를 놓칩니다.", result: "Any 확산을 최소화합니다." },
      ],
      sourceRefs: ["python-typing-callable", "python-typing-doc"],
    }],
    diagnostics: [
      { symptom: "annotation이 있는데 production에서 잘못된 JSON type이 함수 안까지 들어온다.", likelyCause: "type hint를 runtime validation으로 오해했습니다.", checks: ["요청 parsing 경계의 schema validator를 확인합니다.", "untyped/Any caller를 추적합니다.", "static checker가 CI에서 실제 실행되는지 봅니다."], fix: "외부 경계에서 runtime schema를 검증하고 내부에는 좁혀진 typed object만 전달합니다.", prevention: "negative payload integration test와 strict static checker 설정을 유지합니다." },
    ],
    expertNotes: ["annotation introspection은 postponed evaluation·forward reference와 import side effect가 얽힐 수 있으므로 get_type_hints 사용 시 신뢰 경계를 확인합니다."],
  },
  {
    id: "generic-protocol-structural-contracts",
    title: "generic과 Protocol로 구체 class가 아닌 행동 계약에 의존합니다",
    lead: "TypeVar는 입력과 출력 type 관계를 보존하고 Protocol은 명시 상속 없이 필요한 method shape를 만족하는 structural typing을 제공합니다.",
    explanations: [
      "list[Any]를 반환하면 요소 type 관계를 잃지만 TypeVar T를 사용한 first(Sequence[T]) -> T는 입력 요소 type이 반환에 이어짐을 checker가 추론합니다.",
      "Protocol은 특정 base class를 상속하라는 요구 대신 method·property signature를 정의합니다. adapter·test fake·third-party class가 같은 행동을 제공하면 structural하게 호환됩니다.",
      "@runtime_checkable Protocol은 isinstance에서 attribute 존재를 검사할 수 있지만 signature·return type까지 runtime 검증하지 않습니다. 주 목적은 static typing입니다.",
      "Callable 하나로 충분하지 않은 callback—여러 method, configuration property, generic call—에는 Protocol이 더 읽기 쉽습니다. 반대로 단순 함수 하나에는 Callable이 간결합니다.",
      "variance와 mutable collection은 고급 함정입니다. list[Dog]를 list[Animal]로 취급하면 Cat 추가가 가능해지므로 mutable generic은 대개 invariant입니다.",
    ],
    concepts: [
      { term: "generic relationship", definition: "TypeVar를 통해 여러 위치의 type이 서로 같은/연관된 type이라는 제약을 표현하는 모델입니다.", detail: ["입력과 반환 관계를 보존합니다.", "Any보다 정보가 많습니다."] },
      { term: "structural typing", definition: "명시 상속 대신 필요한 attribute·method shape를 제공하는지로 호환성을 판단하는 방식입니다.", detail: ["Protocol이 지원합니다.", "duck typing을 static하게 기술합니다."] },
    ],
    codeExamples: [{
      id: "generic-protocol-runtime-evidence",
      title: "TypeVar first 함수와 runtime_checkable formatter Protocol을 실행합니다",
      language: "python",
      filename: "generic_protocol.py",
      purpose: "generic 반환 관계와 명시 상속 없는 protocol 호환, runtime 검사 한계를 exact output으로 확인합니다.",
      code: String.raw`from collections.abc import Sequence
from typing import Protocol, TypeVar, runtime_checkable

T = TypeVar("T")

def first(items: Sequence[T]) -> T:
    if not items:
        raise ValueError("items required")
    return items[0]

@runtime_checkable
class Formatter(Protocol):
    def format(self, value: int) -> str:
        ...

class HexFormatter:
    def format(self, value: int) -> str:
        return f"0x{value:x}"

class MissingFormatter:
    pass

def render(values: Sequence[int], formatter: Formatter) -> list[str]:
    return [formatter.format(value) for value in values]

formatter = HexFormatter()
print("firsts:", first(["a", "b"]), first([10, 20]))
print("protocol:", isinstance(formatter, Formatter), isinstance(MissingFormatter(), Formatter))
print("rendered:", render([10, 15, 255], formatter))`,
      walkthrough: [
        { lines: "1-9", explanation: "TypeVar T가 Sequence 요소와 first 반환 type 관계를 보존하도록 정의합니다." },
        { lines: "11-20", explanation: "format method 하나를 요구하는 runtime_checkable Protocol과 상속하지 않은 구현·미구현 class를 만듭니다." },
        { lines: "22-28", explanation: "generic first, runtime structural check와 formatter 주입 결과를 확인합니다." },
      ],
      run: { environment: ["Python 3.13+", "stdin/network/filesystem 불필요"], command: "python -I -B -X utf8 generic_protocol.py" },
      output: { value: "firsts: a 10\nprotocol: True False\nrendered: ['0xa', '0xf', '0xff']", explanation: ["HexFormatter는 Formatter를 상속하지 않았어도 필요한 method가 있어 runtime check를 통과합니다.", "static checker는 format parameter·return signature까지 검사하지만 runtime isinstance는 존재 중심입니다."] },
      experiments: [
        { change: "HexFormatter.format이 int를 반환하게 합니다.", prediction: "runtime isinstance는 여전히 True일 수 있지만 static checker는 Protocol 불일치를 보고합니다.", result: "runtime_checkable의 한계를 확인합니다." },
        { change: "first([])를 호출합니다.", prediction: "반환 type과 무관하게 ValueError입니다.", result: "generic typing은 empty runtime invariant를 대신하지 않습니다." },
        { change: "render formatter type을 object로 바꿉니다.", prediction: "checker가 format 호출을 허용하지 않습니다.", result: "Protocol이 필요한 행동을 최소 계약으로 표현합니다." },
      ],
      sourceRefs: ["py-typing-collections-source", "python-protocol-doc", "python-typing-callable"],
    }],
    diagnostics: [
      { symptom: "isinstance(obj, Protocol)가 True인데 method 호출에서 잘못된 return type이 나온다.", likelyCause: "runtime_checkable이 full signature/type validation을 한다고 오해했습니다.", checks: ["static checker 결과를 확인합니다.", "실제 method signature와 return fixture를 봅니다.", "Protocol에 runtime validation을 과도하게 의존하는지 검토합니다."], fix: "Protocol은 static contract로 사용하고 외부 plugin에는 별도 capability/schema integration test를 둡니다.", prevention: "fake와 실제 adapter를 같은 contract test suite로 검증합니다." },
    ],
    expertNotes: ["Protocol을 거대하게 만들면 structural adoption이 어려워집니다. caller가 실제 사용하는 작은 capability별 Protocol을 선호합니다."],
  },
  {
    id: "typeddict-dataclass-frozen-slots-defaults",
    title: "TypedDict 입력 shape와 dataclass runtime model을 분리합니다",
    lead: "TypedDict는 dict key schema를 static하게 표현하고 dataclass는 실제 class 생성·기본값·equality·immutability·slots 동작을 제공하므로 경계와 내부 model에 다르게 사용합니다.",
    explanations: [
      "TypedDict instance는 runtime에 일반 dict이며 생성자 validation을 자동 수행하지 않습니다. Required·NotRequired·total 옵션은 checker가 key 존재를 분석하지만 JSON boundary에는 runtime schema가 필요합니다.",
      "dataclass는 annotation field로 __init__·repr·eq 등을 생성합니다. mutable 기본값은 field(default_factory=list)처럼 instance마다 새 객체를 만들도록 해야 공유 상태를 피합니다.",
      "frozen=True는 field 재할당을 막지만 field 안에 mutable list가 있으면 그 list 내용은 바뀔 수 있는 shallow immutability입니다. 깊은 불변이 필요하면 tuple·frozenset과 immutable element를 사용합니다.",
      "slots=True는 __dict__ 없이 정해진 field storage를 만들 수 있어 memory와 accidental attribute를 줄이지만 weakref·상속·serialization·mocking 호환성을 검토합니다.",
      "dataclass를 ORM/API schema/value object에 무조건 재사용하지 않습니다. persistence·transport·domain validation 책임을 분리하고 변환 함수를 둡니다.",
    ],
    concepts: [
      { term: "TypedDict", definition: "특정 key와 value type을 가진 dict shape를 static checker에 기술하는 typing construct입니다.", detail: ["runtime에는 일반 dict입니다.", "Required/NotRequired로 key 존재를 표현합니다."] },
      { term: "default_factory", definition: "각 dataclass instance 생성 때 호출되어 mutable 기본값을 새로 만드는 factory입니다.", detail: ["shared mutable default를 피합니다.", "인자를 받지 않는 callable입니다."] },
    ],
    codeExamples: [{
      id: "typeddict-dataclass-runtime-contracts",
      title: "TypedDict runtime 비강제와 frozen·slots·default_factory의 실제 동작을 비교합니다",
      language: "python",
      filename: "typed_models.py",
      purpose: "static input shape와 runtime value object 기능·shallow immutability를 exact output으로 확인합니다.",
      code: String.raw`from dataclasses import FrozenInstanceError, dataclass, field
from typing import NotRequired, TypedDict

class UserPayload(TypedDict):
    id: str
    active: bool
    nickname: NotRequired[str]

@dataclass(frozen=True, slots=True)
class Course:
    title: str
    tags: list[str] = field(default_factory=list)

payload: UserPayload = {"id": "u1", "active": True}
print("payload_runtime:", type(payload).__name__, payload)

first = Course("Python")
second = Course("Java")
first.tags.append("typing")
print("independent_defaults:", first.tags, second.tags)
print("has_dict:", hasattr(first, "__dict__"))
try:
    first.title = "Changed"
except FrozenInstanceError as error:
    print("frozen_error:", type(error).__name__)
print("shallow_mutable:", first)`,
      walkthrough: [
        { lines: "1-7", explanation: "Required id/active와 optional nickname을 가진 TypedDict shape를 정의합니다." },
        { lines: "9-13", explanation: "frozen slots dataclass와 instance별 list default_factory를 정의합니다." },
        { lines: "15-16", explanation: "TypedDict 값이 runtime에는 일반 dict임을 확인합니다." },
        { lines: "18-26", explanation: "두 독립 default list, __dict__ 부재, field 재할당 오류와 내부 list mutation을 비교합니다." },
      ],
      run: { environment: ["Python 3.13+", "stdin/network/filesystem 불필요"], command: "python -I -B -X utf8 typed_models.py" },
      output: { value: "payload_runtime: dict {'id': 'u1', 'active': True}\nindependent_defaults: ['typing'] []\nhas_dict: False\nfrozen_error: FrozenInstanceError\nshallow_mutable: Course(title='Python', tags=['typing'])", explanation: ["default_factory로 first와 second의 tags identity가 분리됩니다.", "frozen은 title 재할당을 막지만 list 내부 append는 막지 않습니다."] },
      experiments: [
        { change: "tags를 tuple[str, ...] = ()로 바꿉니다.", prediction: "append가 없어 깊은 불변 model에 더 가까워집니다.", result: "field element까지 불변이어야 합니다." },
        { change: "payload active에 'yes'를 넣습니다.", prediction: "runtime dict 생성은 성공하지만 static checker와 runtime schema validator가 잡아야 합니다.", result: "TypedDict는 runtime parser가 아닙니다." },
        { change: "slots=False로 바꿉니다.", prediction: "__dict__가 생기고 dynamic storage·memory 특성이 달라집니다.", result: "호환성 요구와 slots tradeoff를 평가합니다." },
      ],
      sourceRefs: ["python-typing-typeddict", "python-dataclass-field", "python-dataclass-doc"],
    }],
    diagnostics: [
      { symptom: "frozen dataclass인데 내부 list가 변경되어 hash·cache invariant가 깨진다.", likelyCause: "frozen을 deep immutability로 오해하고 mutable field를 사용했습니다.", checks: ["모든 field의 중첩 mutability를 확인합니다.", "unsafe_hash·dict key 사용을 봅니다.", "default_factory type을 검토합니다."], fix: "tuple·frozenset·immutable child model을 사용하거나 mutation을 허용한 명시 model로 바꿉니다.", prevention: "nested mutation negative test와 hash/equality contract review를 둡니다." },
    ],
    expertNotes: ["slots dataclass의 field를 상속 class가 다시 선언하거나 serialization framework가 __dict__를 가정하는 경우가 있으므로 framework integration test가 필요합니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...expertChapters);
session.reviewQuestions.push(
  { question: "type hint가 runtime에서 argument type을 자동 검사하나요?", answer: "아닙니다. annotation은 metadata이며 static checker·IDE가 사용하고 외부 값은 별도 runtime validation이 필요합니다." },
  { question: "Literal을 사용해도 외부 문자열 allowlist 검사가 필요한가요?", answer: "예. untyped JSON·CLI 값은 runtime에 임의 str이므로 허용 값 검사를 거쳐야 합니다." },
  { question: "TypeGuard는 무엇을 제공하나요?", answer: "사용자 predicate가 True인 branch에서 checker가 argument를 지정한 더 구체 type으로 좁히도록 알려 줍니다." },
  { question: "Callable과 __call__ Protocol은 언제 나누어 쓰나요?", answer: "단순 함수 signature는 Callable, 여러 method·property나 복잡한 callable 객체 계약은 Protocol이 적합합니다." },
  { question: "runtime_checkable Protocol이 method signature까지 검사하나요?", answer: "아닙니다. 주로 attribute 존재를 확인하며 정확한 parameter·return type 검사는 static checker 역할입니다." },
  { question: "TypedDict는 JSON을 runtime 검증하나요?", answer: "아닙니다. runtime에는 일반 dict이므로 별도 schema parser/validator가 필요합니다." },
  { question: "frozen=True와 default_factory의 역할은 각각 무엇인가요?", answer: "frozen은 field 재할당을 막고 default_factory는 instance마다 새 mutable 기본값을 만들지만 둘 다 중첩 객체의 deep immutability를 자동 보장하지 않습니다." },
);
session.completionChecklist.push(
  "annotation과 runtime validation의 책임을 분리하고 strict static checker를 CI에서 실행한다.",
  "Union·Optional을 branch에서 좁히고 Literal 외부 값은 allowlist 검증한다.",
  "Callable과 작은 capability Protocol을 caller 요구에 맞게 선택한다.",
  "TypeVar로 입력·출력 generic 관계를 보존하고 Any 확산을 제한한다.",
  "runtime_checkable Protocol의 signature 검사 한계를 integration test로 보완한다.",
  "TypedDict를 static dict shape로 사용하고 JSON boundary에는 runtime schema를 둔다.",
  "dataclass default_factory·frozen·slots와 중첩 mutability tradeoff를 검증한다.",
);
(session.sources as DetailedSession["sources"]).push(
  { id: "python-typing-callable", repository: "Python documentation", path: "library/typing.html#annotating-callable-objects", publicUrl: "https://docs.python.org/3/library/typing.html#annotating-callable-objects", usedFor: ["Callable", "Protocol __call__", "signature typing"], evidence: "공식 typing 문서의 callable annotation 지침을 함수·객체 callback 계약에 사용했습니다." },
  { id: "python-typing-typeddict", repository: "Python documentation", path: "library/typing.html#typing.TypedDict", publicUrl: "https://docs.python.org/3/library/typing.html#typing.TypedDict", usedFor: ["TypedDict", "Required/NotRequired", "runtime dict"], evidence: "공식 TypedDict 문서의 static shape와 runtime identity 계약을 확인했습니다." },
  { id: "python-dataclass-field", repository: "Python documentation", path: "library/dataclasses.html#dataclasses.field", publicUrl: "https://docs.python.org/3/library/dataclasses.html#dataclasses.field", usedFor: ["field", "default_factory", "frozen", "slots"], evidence: "공식 dataclasses.field 문서를 mutable default와 generated model 옵션 설명에 사용했습니다." },
);

export default session;
