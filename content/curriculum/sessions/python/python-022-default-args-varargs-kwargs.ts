import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-022"],
  slug: "python-022-default-args-varargs-kwargs",
  courseId: "python",
  moduleId: "02-control-functions-io",
  order: 22,
  title: "기본값·*args·**kwargs",
  subtitle: "호출 인수가 함수 매개변수에 결합되는 규칙을 이해하고, 편리함 때문에 계약이 흐려지지 않는 확장 가능한 함수 signature를 설계합니다.",
  level: "중급",
  estimatedMinutes: 125,
  coreQuestion: "선택 인수와 가변 인수를 유연하게 받으면서도 잘못된 호출을 일찍 발견하고 API 의미를 오래 안정적으로 유지하려면 signature를 어떻게 설계해야 할까요?",
  summary: "기본 인수의 정의 시점 평가, 필수 매개변수와의 순서, 가변 기본값 공유 함정을 실행으로 확인합니다. *args가 남은 위치 인수를 tuple로, **kwargs가 남은 키워드 인수를 dict로 수집하는 원리를 다루고 /와 *로 positional-only·keyword-only 경계를 설계합니다. iterable·mapping unpacking, 중복·누락 오류, wrapper 전달과 외부 옵션 whitelist까지 초급 문법에서 공개 API 설계로 확장합니다.",
  objectives: [
    "호출 인수가 위치·키워드 규칙에 따라 매개변수에 결합되고 누락·중복이 TypeError가 되는 과정을 설명할 수 있다.",
    "기본 인수 표현식이 호출 때가 아니라 def 실행 시 한 번 평가된다는 사실을 실행 결과로 증명할 수 있다.",
    "가변 객체 기본값 공유 버그를 재현하고 None sentinel 또는 명시적 불변 기본값으로 고칠 수 있다.",
    "*args가 tuple, **kwargs가 dict라는 실제 자료형과 순회·검증 방법을 사용할 수 있다.",
    "/와 *를 이용해 positional-only와 keyword-only 매개변수를 설계할 수 있다.",
    "*iterable·**mapping 호출 unpacking과 중복 key·잘못된 key 오류를 진단할 수 있다.",
    "무제한 kwargs 전달이 오타·보안·호환성 문제를 숨길 수 있음을 알고 공개 API에서 명시적 옵션을 선택할 수 있다.",
  ],
  prerequisites: [
    { title: "함수 계약·스코프·반환", reason: "함수 signature를 입력 계약으로 보고 호출 frame의 지역 이름 결합을 확장합니다.", sessionSlug: "python-021-function-contract-scope-return" },
    { title: "튜플·패킹·언패킹", reason: "*args의 tuple 수집과 *iterable 호출 전개를 packing·unpacking 관점으로 연결합니다.", sessionSlug: "python-012-tuple-packing-unpacking" },
    { title: "딕셔너리 조회·순회·수정", reason: "**kwargs의 dict 구조, key 중복과 whitelist 검증을 다룹니다.", sessionSlug: "python-013-dictionary-access-iteration-update" },
  ],
  keywords: ["Python", "default argument", "mutable default", "args", "kwargs", "positional-only", "keyword-only", "signature", "argument unpacking"],
  chapters: [
    {
      id: "argument-binding",
      title: "호출은 인수를 signature의 매개변수에 결합하는 검증 과정입니다",
      lead: "함수 본문이 시작되기 전에 Python은 각 인수가 어느 매개변수에 연결되는지 결정하고 누락·중복·알 수 없는 이름을 거부합니다.",
      explanations: [
        "def say(name, age, gender=True)에서 name과 age는 필수이고 gender는 기본값이 있는 선택 매개변수입니다. say('hong', 24, False)는 세 위치 인수를 순서대로 결합하고, say('park', 12)는 gender가 생략되어 기본값 True를 사용합니다. 원본 실행에서 park가 남성으로 출력되는 이유입니다.",
        "위치 인수 뒤에는 키워드 인수를 쓸 수 있지만 일반 키워드 인수 뒤에 위치 인수를 둘 수 없습니다. say(name='hong', 24)는 함수가 실행되기 전 SyntaxError입니다. say('hong', 24, age=30)는 age가 위치와 키워드로 두 번 전달되어 TypeError입니다. 결합 오류는 본문 검증 코드가 아니라 호출 protocol에서 먼저 발생합니다.",
        "키워드 호출은 숫자·bool 인수가 여러 개일 때 의미를 드러냅니다. resize(image, 800, 600, True)보다 resize(image, width=800, height=600, keep_ratio=True)가 읽기 쉽습니다. 하지만 매개변수 이름이 공개 호출 계약이 되므로 이름을 바꾸면 키워드 호출자가 깨질 수 있습니다.",
        "inspect.signature로 signature를 볼 수 있지만 동적 introspection에 의존해 호출을 억지로 맞추기보다 명확한 함수를 설계해야 합니다. TypeError 메시지를 숨기려고 모든 것을 *args, **kwargs로 받으면 오타가 함수 깊은 곳까지 전달되고 IDE·정적 분석 지원이 약해집니다.",
      ],
      concepts: [
        { term: "argument binding", definition: "호출에 주어진 위치·키워드 인수를 함수 signature의 각 매개변수에 연결하는 과정입니다.", detail: ["함수 본문 실행 전에 완료됩니다.", "필수 누락·중복·알 수 없는 키워드는 보통 TypeError입니다."] },
        { term: "signature", definition: "매개변수의 이름·종류·순서·기본값과 반환 annotation으로 표현되는 함수 호출 인터페이스입니다.", detail: ["호출자의 소스 코드와 도구가 의존합니다.", "공개 함수에서는 변경을 API 호환성 문제로 다룹니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "TypeError: got multiple values for argument가 발생한다.", likelyCause: "같은 매개변수에 위치 인수와 키워드 인수 또는 **mapping의 key가 동시에 결합됐습니다.", checks: ["signature 순서에 위치 인수를 하나씩 대응시킵니다.", "명시 키워드와 **mapping key를 펼쳐 중복을 찾습니다.", "wrapper가 같은 옵션을 추가해 다시 전달하는지 봅니다."], fix: "각 매개변수 값을 한 경로로만 전달하고 wrapper에서 default와 사용자 옵션을 병합할 때 중복 정책을 명시합니다.", prevention: "호출부에서 의미 있는 값은 키워드로 통일하고 **kwargs 전달 전에 허용 key와 중복을 검사합니다." },
      ],
    },
    {
      id: "default-arguments",
      title: "기본값은 선택 계약이며 기본값 매개변수는 필수 위치 매개변수 뒤에 둡니다",
      lead: "기본값은 호출자가 생략했을 때 사용할 값이지 입력 검증 실패를 덮는 임의의 fallback이 아닙니다.",
      explanations: [
        "원본 ex08은 def say(name, age, gender=True)를 사용하고 def say2(name, gender=True, age)를 주석으로 막았습니다. 같은 positional-or-keyword 구간에서는 기본값 없는 필수 매개변수 age가 기본값 있는 gender 뒤에 올 수 없어 SyntaxError입니다. Python이 어떤 위치 값이 어느 매개변수인지 모호한 signature를 허용하지 않는 것입니다.",
        "기본값은 가장 흔하고 안전한 동작이어야 합니다. send_email(..., dry_run=False)처럼 기본 호출이 실제 외부 발송을 수행하면 학습·테스트 환경에서 사고를 부를 수 있습니다. 파괴적 또는 비용 큰 동작은 명시적 opt-in, 별도 함수, 확인 단계가 더 안전할 수 있습니다.",
        "None을 기본값으로 쓰면 두 의미를 구분해야 합니다. 호출자가 값을 생략했다는 sentinel로 쓰는지, 실제 None도 유효한 입력인지 계약에 적습니다. 둘을 구분해야 하면 object()로 전용 sentinel을 만들 수 있습니다. '없음' 하나로 생략·초기화·삭제 의미를 동시에 표현하면 API가 모호해집니다.",
        "기본값을 바꾸는 일은 호출 코드를 수정하지 않아도 동작을 바꾸는 API 변경입니다. timeout=30을 timeout=5로 줄이면 생략 호출이 모두 달라집니다. 공개 API에서는 release note·테스트·관찰 지표로 영향을 확인하고 중요한 정책은 호출자가 명시하게 합니다.",
      ],
      concepts: [
        { term: "default argument", definition: "호출자가 해당 인수를 생략했을 때 매개변수에 연결되는 정의 시 지정 객체입니다.", detail: ["선택 가능한 입력 계약을 만듭니다.", "정의 시점 평가와 객체 공유를 이해해야 합니다."] },
        { term: "sentinel", definition: "인수 생략이나 특별 상태를 일반 유효값과 구분하기 위한 고유 표시 객체입니다.", detail: ["None이 유효값이면 전용 object를 사용할 수 있습니다.", "identity is 비교로 구분합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "SyntaxError: non-default argument follows default argument가 발생한다.", likelyCause: "같은 위치 매개변수 구간에서 기본값 있는 매개변수 뒤에 필수 매개변수를 선언했습니다.", checks: ["signature를 왼쪽부터 필수·선택 순서로 분류합니다.", "필수 매개변수를 keyword-only로 만드는 편이 의미상 나은지 봅니다.", "원본처럼 문제가 있는 정의를 최소 파일에서 컴파일합니다."], fix: "필수 positional-or-keyword 매개변수를 먼저 두거나 * 뒤 keyword-only 필수 매개변수로 설계합니다.", prevention: "signature를 필수 위치→선택 위치→*args→keyword-only→**kwargs 순서로 리뷰합니다." },
      ],
    },
    {
      id: "default-evaluation-and-mutability",
      title: "기본 인수 표현식은 def 때 한 번 평가되므로 가변 객체가 호출 사이에 공유됩니다",
      lead: "tags=[]는 호출마다 새 리스트를 만든다는 뜻이 아니라 함수 객체가 만들어질 때 리스트 하나를 만들어 계속 재사용한다는 뜻입니다.",
      explanations: [
        "모듈 import 과정에서 def add_tag_bad(tag, tags=[])가 실행되면 빈 리스트 하나가 기본값 tuple에 보관됩니다. 첫 호출이 append한 리스트를 두 번째 생략 호출이 다시 받습니다. 서버 요청·테스트 사이에 이전 데이터가 섞이는 실제 버그가 될 수 있습니다.",
        "None sentinel 패턴은 def add_tag(tag, tags=None)로 선언하고 본문에서 if tags is None: tags=[]를 실행합니다. 생략 호출마다 새 리스트가 생기지만 호출자가 명시적으로 리스트를 전달하면 그 객체를 수정할지 복사할지 별도 계약이 필요합니다. 기본값 문제를 고쳤다고 모든 mutation 문제가 사라지는 것은 아닙니다.",
        "list·dict·set뿐 아니라 사용자 정의 인스턴스, generator, 열린 파일처럼 상태를 가진 객체도 위험합니다. 반면 None, 숫자, 문자열, tuple 같은 불변 객체는 기본값으로 안전한 경우가 많습니다. tuple 안에 list가 들어 있으면 중첩 가변성은 여전히 남습니다.",
        "datetime.now()나 expensive_lookup() 같은 호출을 기본값 표현식에 두면 함수 호출 때마다 최신 값을 얻지 않습니다. 정의 시 한 번 계산된 시간이 고정됩니다. 현재 시간이 필요하면 기본값 None을 두고 본문에서 clock()을 호출하거나 clock 의존성을 주입합니다.",
      ],
      concepts: [
        { term: "정의 시점 평가", definition: "기본 인수 표현식이 함수가 호출될 때마다가 아니라 def 문으로 함수 객체를 만들 때 한 번 실행되는 규칙입니다.", detail: ["평가된 객체는 함수의 기본값 정보에 보관됩니다.", "import 시점에 만들어진 상태가 모든 생략 호출에 재사용될 수 있습니다."] },
        { term: "가변 기본값 함정", definition: "list·dict 같은 기본값 객체를 함수가 변경해 여러 호출이 예기치 않게 상태를 공유하는 문제입니다.", detail: ["None sentinel로 호출별 새 객체를 만들 수 있습니다.", "의도적 memoization이라면 숨은 기본값 대신 명시적 cache 구조를 사용합니다."] },
      ],
      codeExamples: [
        {
          id: "mutable-default-trap",
          title: "공유되는 기본 리스트와 호출별 리스트를 나란히 재현",
          language: "python",
          filename: "mutable_defaults.py",
          purpose: "가변 기본값의 정의 시점 평가를 출력으로 확인하고 None sentinel 수정을 검증합니다.",
          code: "def add_tag_bad(tag, tags=[]):\n    tags.append(tag)\n    return tags\n\ndef add_tag(tag, tags=None):\n    if tags is None:\n        tags = []\n    tags.append(tag)\n    return tags\n\nprint('bad 1:', add_tag_bad('python'))\nprint('bad 2:', add_tag_bad('java'))\nprint('good 1:', add_tag('python'))\nprint('good 2:', add_tag('java'))\nprovided = ['web']\nprint('provided:', add_tag('css', provided))\nprint('caller sees:', provided)",
          walkthrough: [
            { lines: "1-3", explanation: "빈 리스트 하나가 정의 시 기본값으로 만들어지고 생략 호출마다 같은 객체에 append합니다." },
            { lines: "5-10", explanation: "기본값 None은 불변 sentinel이고 생략할 때마다 본문에서 새 리스트를 만듭니다." },
            { lines: "12-15", explanation: "bad 두 호출은 누적되고 good 두 생략 호출은 독립적임을 비교합니다." },
            { lines: "16-18", explanation: "호출자가 리스트를 명시하면 add_tag가 그 객체를 변경하므로 caller sees에도 css가 보입니다. 이것은 별도 mutation 계약입니다." },
          ],
          run: { environment: ["Python 3.8 이상", "mutable_defaults.py로 저장"], command: "python mutable_defaults.py" },
          output: { value: "bad 1: ['python']\nbad 2: ['python', 'java']\ngood 1: ['python']\ngood 2: ['java']\nprovided: ['web', 'css']\ncaller sees: ['web', 'css']", explanation: ["bad 2에 첫 호출 python이 남아 기본 객체 공유가 증명됩니다.", "good 생략 호출은 서로 다른 리스트를 생성합니다.", "명시 전달한 리스트는 여전히 같은 가변 객체이므로 수정 정책을 따로 결정해야 합니다."] },
          experiments: [
            { change: "tags=[] 대신 tags={}로 바꾸고 key를 추가합니다.", prediction: "dict도 같은 방식으로 호출 사이 key를 누적합니다.", result: "문제의 본질은 list 문법이 아니라 상태를 바꿀 수 있는 기본 객체 공유입니다." },
            { change: "tags.append 전에 tags = list(tags)로 복사합니다.", prediction: "명시 전달한 caller 리스트도 바뀌지 않고 새 결과만 반환됩니다.", result: "None sentinel과 입력 mutation 계약은 서로 다른 설계 문제임을 확인합니다." },
          ],
          sourceRefs: ["python-default-doc", "py-function-args-source"],
        },
      ],
      diagnostics: [
        { symptom: "새 함수 호출인데 이전 호출의 항목이 결과에 남아 있다.", likelyCause: "list·dict·set 같은 가변 객체를 기본값으로 두고 본문에서 변경했습니다.", checks: ["함수 __defaults__와 기본 객체 id를 호출 전후 확인합니다.", "signature의 [], {}, set(), 사용자 인스턴스를 찾습니다.", "여러 생략 호출을 같은 프로세스에서 연속 실행합니다."], fix: "기본값을 None 또는 전용 sentinel로 바꾸고 본문에서 호출별 객체를 생성합니다.", prevention: "린터의 dangerous-default-value 규칙과 두 번 연속 호출하는 회귀 테스트를 사용합니다." },
      ],
    },
    {
      id: "args-collection",
      title: "*args는 결합되지 않은 위치 인수를 순서대로 tuple에 모읍니다",
      lead: "별표 이름은 특별한 이름이 아니라 매개변수 종류이며 args는 관례적으로 쓰는 지역 이름입니다.",
      explanations: [
        "원본 add_all(*args)는 add_all(1,2,3,4,5)를 호출했을 때 args=(1,2,3,4,5), type(args)=tuple을 출력합니다. tuple이므로 순서와 중복이 보존되고 인덱싱·순회·언패킹이 가능합니다. args 자체에 append할 수는 없지만 요소가 가변 객체라면 그 내부는 바뀔 수 있습니다.",
        "def mix(a, *args, **kwargs)에서 첫 위치 인수는 a에 결합되고 남은 위치 인수 2,3은 args tuple에 들어갑니다. *args를 선언하면 그 뒤 일반 매개변수는 위치로 받을 수 없고 keyword-only가 됩니다. 이를 이용해 중요한 옵션을 이름으로만 호출하게 만들 수 있습니다.",
        "가변 개수라고 해서 아무 타입이나 받아도 되는 것은 아닙니다. add_all(*args)가 sum(args)를 호출하면 문자열이나 None이 섞였을 때 오류가 납니다. 함수 시작에서 요소 계약을 검증하거나 Iterable[float] 하나를 받는 설계와 비교합니다. 많은 데이터를 *args로 펼치면 호출 메모리와 signature 의미가 불분명할 수 있습니다.",
        "*args는 decorator·adapter처럼 여러 signature를 전달할 때도 쓰지만 원래 함수의 명시적 signature를 잃을 수 있습니다. functools.wraps는 metadata를 보존하고 ParamSpec 같은 타입 도구로 호출 계약을 표현할 수 있습니다. 무조건적인 전달보다 wrapper가 실제로 지원하는 옵션을 좁게 정의하는 편이 좋습니다.",
      ],
      concepts: [
        { term: "variadic positional parameter", definition: "일반 매개변수에 결합되지 않은 0개 이상의 위치 인수를 tuple로 수집하는 *name 매개변수입니다.", detail: ["0개면 빈 tuple입니다.", "선언 뒤 매개변수는 keyword-only가 됩니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "*args 함수에서 sum 또는 비교 중 예상하지 못한 TypeError가 발생한다.", likelyCause: "가변 인수 개수만 허용했을 뿐 각 요소 타입·빈 입력·범위 계약을 검증하지 않았습니다.", checks: ["args repr과 각 type을 enumerate로 출력합니다.", "빈 tuple이 허용되는지 확인합니다.", "bool이 int로 처리되는 경계도 도메인상 허용되는지 봅니다."], fix: "요소를 명시적으로 검증하고 동일 종류 컬렉션이 핵심이면 Sequence[T] 매개변수 하나로 바꾸는 방안도 비교합니다.", prevention: "0개·1개·여러 개·잘못된 요소가 섞인 호출을 자동 테스트합니다." },
      ],
    },
    {
      id: "kwargs-collection",
      title: "**kwargs는 남은 키워드 인수를 이름과 값의 dict로 모읍니다",
      lead: "kwargs는 유연한 확장 통로이지만 오타와 지원하지 않는 옵션까지 조용히 받아들이면 계약 검증이 늦어집니다.",
      explanations: [
        "원본 info(**kwargs)는 name='홍길동', age=20, addr='서울'을 dict로 받고 type(kwargs)=dict를 출력합니다. keyword 이름은 문자열 key가 되고 호출에 적은 순서가 현대 Python dict의 삽입 순서로 유지됩니다. 하지만 의미 검증을 순서에 의존해서는 안 됩니다.",
        "**kwargs 앞에 선언된 명시 매개변수와 같은 이름은 먼저 그 매개변수에 결합됩니다. 정의되지 않은 나머지만 kwargs로 들어갑니다. 함수가 오타 colro='red'까지 받아 아무 효과 없이 버리면 사용자는 성공했다고 오해합니다. 지원 key 집합과 차집합을 계산해 unknown을 TypeError 또는 ValueError로 거부합니다.",
        "외부 HTTP query나 JSON dict를 그대로 **options로 펼치면 내부 함수의 숨은 옵션을 공격자가 조절할 수 있습니다. debug, verify_ssl, output_path 같은 민감 옵션이 노출될 수 있습니다. 신뢰 경계에서는 whitelist로 필요한 key만 새 dict에 복사하고 타입·범위를 검증한 뒤 전달합니다.",
        "library wrapper가 **kwargs를 하위 library로 그대로 전달하면 하위 버전에서 새 옵션이 추가될 때 wrapper 행동이 우연히 바뀔 수 있습니다. 공개 지원 옵션을 명시하고 나머지는 거부하거나 별도 namespace로 격리합니다. 유연성과 안정성은 같은 것이 아닙니다.",
      ],
      concepts: [
        { term: "variadic keyword parameter", definition: "명시 매개변수에 결합되지 않은 0개 이상의 키워드 인수를 dict로 수집하는 **name 매개변수입니다.", detail: ["key는 호출 키워드 이름인 문자열입니다.", "unknown 옵션 정책과 값 검증이 필요합니다."] },
        { term: "whitelist", definition: "외부에서 허용할 이름을 미리 정하고 그 집합에 포함된 값만 내부 계약으로 전달하는 경계 검증 방식입니다.", detail: ["단순 blacklist보다 새 민감 옵션이 자동 노출되는 위험을 줄입니다.", "허용 key별 타입·범위 검증도 함께 필요합니다."] },
      ],
      codeExamples: [
        {
          id: "report-varargs-kwargs",
          title: "위치 점수와 keyword-only 배율, metadata를 구분하는 보고서",
          language: "python",
          filename: "variadic_report.py",
          purpose: "일반 매개변수·*args·keyword-only·**kwargs의 결합 결과와 호출 unpacking을 함께 확인합니다.",
          code: "def report(title, *scores, scale=1.0, **meta):\n    if not scores:\n        raise ValueError('at least one score is required')\n    adjusted = [score * scale for score in scores]\n    return title, sum(adjusted), meta\n\nfirst = report('중간고사', 80, 90, scale=1.1, teacher='둘리')\nprint(first)\n\nvalues = [70, 85, 95]\noptions = {'scale': 1.0, 'teacher': '고길동', 'room': 3}\nsecond = report('기말고사', *values, **options)\nprint(second)\n\ntry:\n    report('빈 시험')\nexcept ValueError as error:\n    print(f'ERROR: {error}')",
          walkthrough: [
            { lines: "1", explanation: "title은 첫 위치 인수, scores는 남은 위치 tuple, scale은 *scores 뒤라 keyword-only, meta는 남은 keyword dict입니다." },
            { lines: "2-5", explanation: "빈 scores를 계약 오류로 거부하고 배율 적용 결과와 metadata를 tuple 하나로 반환합니다." },
            { lines: "7-8", explanation: "명시 호출에서 80·90은 scores, scale은 전용 매개변수, teacher만 meta에 들어갑니다." },
            { lines: "10-13", explanation: "list는 *로 위치 인수에, dict는 **로 키워드 인수에 펼칩니다." },
            { lines: "15-18", explanation: "*args가 0개일 수도 있으므로 함수 계약이 한 개 이상을 요구하면 본문에서 명시적으로 검증합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "variadic_report.py로 저장"], command: "python variadic_report.py" },
          output: { value: "('중간고사', 187.0, {'teacher': '둘리'})\n('기말고사', 250.0, {'teacher': '고길동', 'room': 3})\nERROR: at least one score is required", explanation: ["현재 실행에서는 80*1.1과 90*1.1의 합이 repr 기준 187.0으로 표시됩니다. 금액처럼 십진 정밀도가 계약이면 float 표시만 믿지 말고 Decimal·반올림 정책을 사용합니다.", "scale은 keyword-only 매개변수에 소비되어 meta dict에는 들어가지 않습니다.", "*values와 **options는 호출 전에 각각 위치·키워드 인수로 전개됩니다."] },
          experiments: [
            { change: "report('시험', 80, 2.0)처럼 scale을 위치로 전달합니다.", prediction: "2.0도 scores tuple 요소가 되고 scale은 기본 1.0을 유지합니다.", result: "*scores 뒤 scale이 keyword-only이므로 중요한 옵션을 이름으로 강제할 수 있습니다." },
            { change: "options에 title key를 추가하고 report('기말고사', *values, **options)를 호출합니다.", prediction: "title이 위치와 키워드로 중복되어 본문 실행 전 TypeError가 발생합니다.", result: "**mapping의 key까지 포함해 argument binding 중복을 확인해야 합니다." },
          ],
          sourceRefs: ["py-function-args-source", "py-function-default-source", "python-call-doc"],
        },
      ],
      diagnostics: [
        { symptom: "지원하지 않는 키워드 오타가 오류 없이 무시되거나 깊은 하위 함수에서 실패한다.", likelyCause: "상위 함수가 **kwargs를 검증 없이 수집·폐기하거나 그대로 전달합니다.", checks: ["kwargs key 집합과 실제 사용 key를 비교합니다.", "wrapper와 하위 함수 signature를 각각 봅니다.", "외부 입력 dict가 그대로 **로 펼쳐지는지 확인합니다."], fix: "공개 옵션은 명시 매개변수로 선언하고 필요한 가변 옵션은 whitelist·타입 검증 후 전달하며 unknown key를 즉시 거부합니다.", prevention: "오타 key·민감 key·하위 버전 변화에 대한 contract test를 둡니다." },
      ],
    },
    {
      id: "positional-keyword-only",
      title: "/와 *로 호출 방식을 제한하면 의미와 호환성 경계를 명시할 수 있습니다",
      lead: "매개변수가 위치와 키워드 모두 가능한 기본 규칙만 따를 필요는 없습니다. API 의도에 맞게 호출 형태를 제한할 수 있습니다.",
      explanations: [
        "def ratio(numerator, denominator, /):에서 / 앞 매개변수는 positional-only라 ratio(10, 2)만 가능하고 numerator=10 같은 키워드는 허용하지 않습니다. 매개변수 이름을 구현 세부로 남기거나 dict key와 같은 이름을 **kwargs로 별도 받을 때 유용합니다. 남용하면 호출 의미가 흐려질 수 있습니다.",
        "def connect(host, *, timeout=10, verify=True)에서 * 뒤 timeout과 verify는 keyword-only입니다. connect('api', 3, False) 같은 의미 불분명한 호출을 막고 connect('api', timeout=3, verify=False)를 강제합니다. *args가 이미 있으면 그 뒤 매개변수는 자동으로 keyword-only입니다.",
        "keyword-only 매개변수도 기본값을 생략하면 필수입니다. def export(data, *, destination)처럼 만들면 destination을 이름으로 반드시 적어야 합니다. 파일 삭제·배포 환경·통화 단위 같은 중요한 의미를 호출부에 드러내는 데 좋습니다.",
        "공개 API에 /나 *를 추가하면 기존 호출이 깨질 수 있습니다. 새 함수에서는 처음부터 의미 있게 설계하고 기존 함수는 사용 현황·deprecation·migration을 거칩니다. signature 제한은 스타일 문제가 아니라 호출자 호환 계약입니다.",
      ],
      concepts: [
        { term: "positional-only", definition: "signature의 / 앞에 있어 키워드 이름으로 전달할 수 없는 매개변수입니다.", detail: ["C 구현 내장 함수와 호환하거나 이름을 API에서 감출 때 유용합니다.", "호출 의미가 중요한 옵션에는 오히려 keyword-only가 낫습니다."] },
        { term: "keyword-only", definition: "* 또는 *args 뒤에 있어 반드시 이름을 붙여 전달해야 하는 매개변수입니다.", detail: ["bool·단위·정책 옵션의 의미를 호출부에 드러냅니다.", "기본값이 없으면 이름으로 전달해야 하는 필수 옵션입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "TypeError: takes ... positional arguments but ... were given 또는 positional-only arguments passed as keyword가 발생한다.", likelyCause: "함수의 * 뒤 옵션을 위치로 주었거나 / 앞 매개변수를 키워드로 주었습니다.", checks: ["help(function) 또는 inspect.signature로 /와 * 위치를 봅니다.", "호출의 위치·키워드 인수를 분리합니다.", "사용 중인 library 버전의 signature가 변경됐는지 확인합니다."], fix: "signature가 요구하는 방식으로 호출하고 공개 API 변경이라면 호출부 migration과 버전 호환을 함께 처리합니다.", prevention: "IDE signature 도움과 정적 검사를 사용하고 중요한 옵션은 키워드 형태로 코드 리뷰합니다." },
      ],
    },
    {
      id: "call-unpacking-api-design",
      title: "호출 unpacking은 데이터 구조를 인수로 펼치므로 shape와 신뢰 경계를 먼저 검증합니다",
      lead: "*iterable과 **mapping은 편리한 adapter이지만 런타임 데이터의 길이·key가 곧 호출 signature가 됩니다.",
      explanations: [
        "coordinates = (10, 20) 뒤 move(*coordinates)는 move(10, 20)와 같습니다. 요소가 하나 부족하거나 많으면 argument binding TypeError입니다. iterable이 generator라면 호출 준비 과정에서 소비되므로 다시 사용할 수 없을 수 있습니다.",
        "options = {'timeout': 3, 'verify': True} 뒤 connect(host, **options)는 두 키워드 인수로 펼쳐집니다. key는 문자열이어야 하고 signature가 받지 않는 key는 **kwargs가 없다면 TypeError입니다. 명시 인수와 mapping key가 중복돼도 오류입니다.",
        "dict를 합쳐 옵션 우선순위를 정할 때 {**defaults, **user_options}는 뒤 값이 앞 key를 덮습니다. 이것이 의도인지 반드시 확인합니다. 보안 기본값 verify=True가 사용자 외부 입력 verify=False에 덮이면 위험할 수 있습니다. 민감 정책은 사용자가 덮지 못하게 분리하거나 검증합니다.",
        "함수가 성장하면서 매개변수가 열 개가 넘고 여러 계층에서 **kwargs를 전달한다면 config dataclass·TypedDict·명시 option 객체가 더 적합할 수 있습니다. 이름 있는 구조는 validation·문서·버전 migration을 한 곳에 모읍니다.",
      ],
      concepts: [
        { term: "call unpacking", definition: "호출 위치의 *iterable을 위치 인수로, **mapping을 키워드 인수로 펼치는 문법입니다.", detail: ["함수 정의의 수집과 반대 방향입니다.", "길이·key·중복은 argument binding 규칙을 따라 검증됩니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "**options 호출에서 unexpected keyword argument 또는 keywords must be strings 오류가 발생한다.", likelyCause: "mapping에 signature가 지원하지 않는 key 또는 문자열이 아닌 key가 있습니다.", checks: ["options의 repr과 keys의 type을 확인합니다.", "대상 함수 signature와 허용 key 차집합을 계산합니다.", "여러 dict 병합 뒤 생긴 key를 추적합니다."], fix: "허용 문자열 key만 새 dict에 복사하고 필요한 변환·검증 후 **로 전달합니다.", prevention: "외부 mapping을 그대로 펼치지 않고 schema·TypedDict·whitelist와 contract test를 사용합니다." },
      ],
      comparisons: [
        { title: "확장 옵션을 어떤 형태로 받을까요?", options: [
          { name: "명시 매개변수", chooseWhen: "지원 옵션이 안정적이고 IDE·타입·오타 검출이 중요할 때", avoidWhen: "정말 동적인 임의 metadata key를 보존해야 할 때", tradeoffs: ["계약이 가장 선명합니다.", "옵션 추가가 signature 변경입니다.", "keyword-only로 호출 의미를 강제할 수 있습니다."] },
          { name: "*args·**kwargs", chooseWhen: "decorator 전달, 동적 metadata처럼 가변 shape가 실제 도메인일 때", avoidWhen: "명확히 알 수 있는 옵션을 단지 편의상 숨길 때", tradeoffs: ["유연하고 forwarding이 쉽습니다.", "오타·문서·타입 검사가 약해질 수 있습니다.", "경계 검증과 허용 정책이 필요합니다."] },
          { name: "설정 객체", chooseWhen: "옵션이 많고 함께 검증·버전 관리·재사용되어야 할 때", avoidWhen: "두세 개 단순 인수만 있는 작은 함수일 때", tradeoffs: ["validation과 문서를 한 타입에 모읍니다.", "객체 생성 비용과 구조가 늘어납니다.", "하위 계층에 무제한 kwargs를 흘리지 않습니다."] },
        ] },
      ],
      expertNotes: ["decorator가 임의 signature를 보존해야 한다면 functools.wraps와 typing.ParamSpec을 사용해 runtime metadata와 정적 호출 계약을 함께 유지합니다.", "외부 dict를 **kwargs로 넘기기 전에 key뿐 아니라 값 타입·범위·경로·URL·권한을 검증하고 민감 기본값을 외부가 덮지 못하게 합니다."],
    },
  ],
  lab: {
    title: "안전한 데이터 내보내기 함수 signature 설계",
    scenario: "여러 출력 형식과 선택 옵션을 받는 export_records 함수를 만들되, 잘못된 호출과 외부 옵션 주입을 본문 깊은 곳이 아니라 API 경계에서 차단합니다.",
    setup: ["export_api.py와 test_export_api.py를 만듭니다.", "실제 파일 대신 문자열 결과를 반환해 core 계약을 먼저 검증합니다.", "format은 csv·json, encoding은 utf-8만 지원한다고 가정합니다."],
    steps: ["records를 첫 필수 매개변수로 두고 *, destination, format='json', pretty=False처럼 중요한 옵션을 keyword-only로 설계합니다.", "destination은 기본값 없이 필수 keyword-only로 만들어 호출부에 명시하게 합니다.", "tags는 None 기본값으로 받고 호출별 새 list를 만들되 입력을 수정하지 않습니다.", "metadata는 **kwargs 전체 대신 명시적 mapping 하나로 받고 허용 key를 검증합니다.", "format·encoding·pretty 타입과 빈 records 계약을 정합니다.", "*values·**options 호출 예제를 만들고 중복 destination·unknown option 오류를 재현합니다.", "같은 생략 호출을 두 번 실행해 가변 상태가 공유되지 않음을 테스트합니다.", "외부 query dict에서 허용 key만 whitelist해 호출 옵션으로 옮깁니다."],
    expectedResult: ["필수·선택·keyword-only 의미가 signature만으로 보입니다.", "가변 기본값이 호출 사이에 공유되지 않습니다.", "오타와 unknown option은 즉시 명확한 오류가 됩니다.", "외부 입력이 내부의 임의 옵션을 덮지 않습니다.", "정상·누락·중복·잘못된 타입·두 번 호출 경계 테스트가 통과합니다."],
    cleanup: ["실제 경로 쓰기 없이 합성 records만 사용합니다."],
    extensions: ["ExportOptions dataclass와 명시 매개변수 버전을 비교합니다.", "deprecated 옵션 이름을 한 버전 동안 경고와 함께 새 이름으로 migration합니다.", "ParamSpec을 사용한 timing decorator로 signature 타입을 보존합니다.", "파일 adapter를 추가하고 경로 traversal 방어를 별도 신뢰 경계로 구현합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 greet·add_all·info·mix를 실행하고 매개변수 결합 표를 작성하세요.", requirements: ["각 호출의 일반 매개변수·args tuple·kwargs dict를 표로 기록합니다.", "인수를 0개·1개·여러 개로 바꿉니다.", "필수 누락·중복 key TypeError를 한 번씩 재현합니다.", "args와 kwargs의 실제 type을 출력합니다."], hints: ["함수 본문 첫 줄에서 repr과 type을 출력합니다.", "오류 호출은 try/except TypeError로 메시지를 기록할 수 있습니다."], expectedOutcome: "호출 문법을 암기하지 않고 binding 결과를 예측합니다.", solutionOutline: ["원본을 변경 없이 실행합니다.", "호출별 signature 대응표를 만듭니다.", "정상과 실패 호출을 최소 예제로 분리합니다."] },
    { difficulty: "응용", prompt: "알림 전송 함수의 signature를 오타와 위험한 기본값에 강하게 설계하세요.", requirements: ["recipient와 message는 필수, channel·dry_run·timeout은 keyword-only로 둡니다.", "dry_run의 안전한 기본 정책을 설명합니다.", "attachments는 가변 기본값 없이 처리하고 입력 목록을 수정하지 않습니다.", "임의 kwargs 대신 지원 옵션을 명시합니다.", "누락·unknown·중복·가변 공유 테스트를 작성합니다."], hints: ["* 하나로 keyword-only 구간을 만들 수 있습니다.", "실제 발송 adapter와 payload 생성 core를 분리합니다."], expectedOutcome: "호출부에서 위험한 동작과 옵션 의미가 명시되는 API를 만듭니다." },
    { difficulty: "설계", prompt: "외부 plugin 함수를 감싸는 장기 호환 wrapper 정책을 설계하세요.", requirements: ["현재와 목표 signature를 제시합니다.", "*args/**kwargs forwarding 범위와 unknown 옵션 정책을 정합니다.", "하위 library 버전별 지원 옵션 matrix를 만듭니다.", "외부 JSON 옵션 whitelist·타입·권한 검증을 포함합니다.", "functools.wraps·ParamSpec·contract test를 사용합니다.", "deprecated 옵션 migration과 telemetry를 설계합니다."], hints: ["무조건 전달은 새 하위 옵션을 자동 노출할 수 있습니다.", "공개 wrapper 계약과 하위 implementation signature를 분리합니다."], expectedOutcome: "유연성·타입 안정성·보안·버전 호환성을 균형 있게 다룬 forwarding API를 제안합니다." },
  ],
  reviewQuestions: [
    { question: "기본 인수 표현식은 언제 평가되나요?", answer: "def 문이 실행되어 함수 객체가 만들어질 때 한 번 평가되며 생략 호출마다 다시 평가되지 않습니다." },
    { question: "왜 def f(required=1, other)는 허용되지 않나요?", answer: "같은 위치 매개변수 구간에서 선택 매개변수 뒤 필수 매개변수가 오면 위치 인수 결합이 모호해져 SyntaxError입니다." },
    { question: "가변 리스트를 기본값으로 두면 어떤 문제가 생기나요?", answer: "기본 리스트 하나가 호출 사이에 공유되어 이전 호출의 변경 상태가 다음 호출에 남을 수 있습니다." },
    { question: "*args의 실제 타입은 무엇인가요?", answer: "결합되지 않은 위치 인수를 순서대로 모은 tuple입니다." },
    { question: "**kwargs의 실제 타입은 무엇인가요?", answer: "결합되지 않은 키워드 이름과 값을 모은 dict입니다." },
    { question: "*args 뒤에 선언한 scale 매개변수는 어떻게 호출하나요?", answer: "keyword-only이므로 scale=1.2처럼 이름을 붙여 전달해야 합니다." },
    { question: "함수 호출의 *values와 정의의 *args는 어떤 방향 차이가 있나요?", answer: "호출의 *는 iterable을 여러 위치 인수로 펼치고 정의의 *args는 남은 위치 인수를 tuple 하나로 모읍니다." },
    { question: "외부 dict를 그대로 **kwargs로 넘기면 왜 위험할 수 있나요?", answer: "호출자가 의도하지 않은 내부 옵션과 민감 정책까지 조절하거나 새 하위 옵션이 자동 노출될 수 있어 whitelist와 검증이 필요합니다." },
  ],
  completionChecklist: [
    "필수·선택 인수의 위치와 결합 오류를 설명할 수 있다.",
    "기본값 정의 시점 평가와 가변 기본값 공유를 재현할 수 있다.",
    "None sentinel과 실제 None 유효값 계약을 구분할 수 있다.",
    "*args tuple과 **kwargs dict의 내용을 호출 전에 예측할 수 있다.",
    "/와 *를 사용해 positional-only·keyword-only signature를 설계할 수 있다.",
    "*iterable·**mapping 전개 시 길이·key·중복 오류를 진단할 수 있다.",
    "명시 매개변수·가변 인수·설정 객체 중 API에 맞는 방식을 선택할 수 있다.",
    "외부 옵션을 whitelist하고 위험한 기본 정책의 덮어쓰기를 막을 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-function-default-source", repository: "PYTHON-BASIC", path: "day04/ex08_function.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day04/ex08_function.py", usedFor: ["필수·기본값 매개변수 순서", "위치 호출", "기본 bool 옵션"], evidence: "원본을 Python 3.13.9에서 실행해 hong=False, kang=True, park 기본 True의 세 출력과 잘못된 기본값 순서 주석을 확인했습니다." },
    { id: "py-function-args-source", repository: "PYTHON-BASIC", path: "day04/ex07_function.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day04/ex07_function.py", usedFor: ["기본값", "*args tuple", "**kwargs dict", "일반·가변 인수 혼합"], evidence: "원본 실행에서 args가 tuple로 1~5와 1~10을 수집하고 kwargs가 dict로 name·age·addr를 수집하며 mix에서 a=1, args=(2,3), kwargs name·age가 출력됨을 확인했습니다." },
    { id: "python-default-doc", repository: "Python documentation", path: "tutorial/controlflow.html#default-argument-values", publicUrl: "https://docs.python.org/3/tutorial/controlflow.html#default-argument-values", usedFor: ["기본값 평가 시점", "가변 기본값 경고", "키워드 인수"], evidence: "공식 자습서의 기본값 한 번 평가와 공유 객체 경고를 실행 예제의 기준으로 사용했습니다." },
    { id: "python-call-doc", repository: "Python documentation", path: "reference/expressions.html#calls", publicUrl: "https://docs.python.org/3/reference/expressions.html#calls", usedFor: ["argument binding", "*iterable", "**mapping", "중복·unknown 오류"], evidence: "공식 언어 참조의 호출·인수 slot 채우기·iterable/mapping 전개 규칙으로 오류 진단과 API 설계를 보강했습니다." },
  ],
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["lambda·map·filter는 py-023에서 별도 고차 함수 세션으로 다룹니다.", "가변 기본값·positional-only·keyword-only·ParamSpec·외부 옵션 whitelist는 원본 문법을 전문가 수준 API 계약으로 확장한 보강 내용입니다."] },
} satisfies DetailedSession;

export default session;
