import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-001"],
  slug: "python-001-output-names-types",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 1,
  title: "첫 실행부터 이름·값·타입까지",
  subtitle: "print 한 줄을 넘어서, 파이썬이 소스 코드를 읽고 이름과 객체를 연결한 뒤 화면에 표현하는 과정을 이해합니다.",
  level: "입문",
  estimatedMinutes: 90,
  coreQuestion: "파이썬 코드에서 변수에 값을 넣고 출력한다는 말은 내부적으로 정확히 무엇을 뜻할까요?",
  summary: "처음 만나는 print, 문자열 리터럴, 변수, type, del, f-string을 하나의 실행 모델로 연결합니다. 단순히 문법을 암기하지 않고 이름 바인딩과 객체의 타입, 표현식 평가, 문자열 포매팅, NameError 진단까지 직접 실행하며 확인합니다.",
  objectives: [
    "파이썬 파일을 위에서 아래로 실행할 때 표현식 평가와 함수 호출이 일어나는 순서를 설명할 수 있다.",
    "변수를 값을 담는 상자라고만 외우지 않고 이름이 객체를 가리키는 바인딩으로 설명할 수 있다.",
    "type()의 결과를 읽고 int, float, str, bool 객체를 구분할 수 있다.",
    "print()의 여러 인수와 문자열 리터럴, f-string을 목적에 맞게 선택할 수 있다.",
    "정의되지 않은 이름에서 발생하는 NameError를 traceback의 마지막 줄부터 진단할 수 있다.",
  ],
  prerequisites: [
    { title: "파일과 폴더의 기본 개념", reason: "코드를 .py 파일로 저장하고 현재 작업 폴더에서 실행하기 위해 파일 경로가 무엇인지 정도만 알면 됩니다." },
    { title: "터미널 명령 한 줄 실행", reason: "PowerShell 또는 터미널에서 python 파일명.py를 입력할 수 있으면 충분하며, 파이썬 문법 선수 지식은 필요하지 않습니다." },
  ],
  keywords: ["Python", "print", "변수", "이름 바인딩", "객체", "type", "f-string", "NameError", "리터럴"],
  chapters: [
    {
      id: "execution-model",
      title: "파이썬 파일은 위에서 아래로 실행됩니다",
      lead: "첫 줄의 print가 화면에 글자를 그리는 마법처럼 보이지만, 실제로는 소스 읽기 → 구문 해석 → 표현식 평가 → 함수 호출 → 출력이라는 순서가 있습니다.",
      explanations: [
        "터미널에서 python hello.py를 실행하면 운영체제는 python이라는 실행 프로그램을 시작하고 hello.py의 경로를 인수로 전달합니다. 파이썬 인터프리터는 파일의 문자를 읽고 문법에 맞는 구조인지 확인한 뒤 모듈의 최상위 문장을 앞에서부터 실행합니다. 이 세션에서는 복잡한 컴파일 내부 구조보다 ‘현재 문장이 끝난 뒤 다음 문장으로 간다’는 관찰 가능한 순서에 집중합니다.",
        "print('Hello Python')에서 따옴표로 둘러싼 부분은 문자열 리터럴입니다. 리터럴은 소스 코드에 값을 직접 적는 표기입니다. 인터프리터는 먼저 str 객체에 해당하는 값을 만들고, print라는 이름이 가리키는 내장 함수를 찾은 뒤 그 객체를 인수로 넘깁니다. print 함수는 사람이 읽을 수 있는 문자열 표현을 표준 출력으로 보내고 기본적으로 줄바꿈을 덧붙입니다.",
        "파일을 실행했는데 아무것도 보이지 않는다고 해서 실행이 실패한 것은 아닙니다. 대입문이나 주석처럼 표준 출력에 쓸 동작이 없는 코드는 정상적으로 실행되어도 터미널에 흔적이 없습니다. 반대로 대화형 셸에서는 표현식 값이 자동으로 표시될 수 있어, 파일 실행과 REPL의 화면 결과가 다를 수 있습니다. 결과를 관찰하려면 파일에서는 print를 명시해야 합니다.",
      ],
      concepts: [
        { term: "인터프리터", definition: "파이썬 소스를 읽어 현재 환경에서 실행하는 프로그램입니다.", detail: ["Windows에서는 py 또는 python 명령으로 시작하는 경우가 많습니다. 같은 컴퓨터에 여러 버전이 있으면 명령이 어느 실행 파일을 가리키는지 확인해야 합니다.", "파이썬도 내부적으로 바이트코드를 만들 수 있지만, 입문 단계에서는 소스 문장의 실행 순서와 오류가 멈추는 지점을 먼저 정확히 보는 것이 중요합니다."], analogy: "악보가 소스 파일이라면 인터프리터는 악보를 순서대로 연주하는 연주자에 가깝습니다. 악보 자체가 소리를 내는 것은 아닙니다." },
        { term: "표준 출력", definition: "프로그램이 일반적인 텍스트 결과를 내보내는 기본 통로입니다.", detail: ["터미널에서 실행하면 보통 현재 터미널 창에 표시됩니다.", "나중에는 이 통로를 파일로 리다이렉션하거나 테스트 도구가 가로채서 결과를 검증할 수도 있습니다."], caveat: "print 결과와 함수의 return 값은 다릅니다. print는 화면에 표시하고 기본적으로 None을 반환합니다." },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "'python'은 내부 또는 외부 명령이 아니라는 메시지가 나온다.", likelyCause: "파이썬이 설치되지 않았거나 설치 경로가 PATH에 등록되지 않았거나 Windows 앱 실행 별칭이 다른 프로그램을 가리킵니다.", checks: ["PowerShell에서 py --version을 실행해 Python Launcher가 있는지 확인합니다.", "Get-Command python과 Get-Command py로 실제 실행 경로를 확인합니다.", "설치되어 있다면 python -c \"import sys; print(sys.executable)\"로 선택된 인터프리터를 확인합니다."], fix: "설치된 환경에서는 작동하는 py 명령을 사용하거나 가상환경을 활성화합니다. 설치가 없다면 공식 배포판을 설치하면서 PATH 옵션을 확인합니다.", prevention: "프로젝트 README에 검증한 Python 버전과 실행 명령을 함께 기록하고, 가상환경을 사용해 프로젝트별 인터프리터를 고정합니다." },
      ],
      expertNotes: ["운영 프로그램은 print만으로 로그를 남기지 않습니다. 시간·심각도·모듈 이름을 구조적으로 남기고 출력 목적지를 제어할 수 있는 logging을 사용합니다.", "재현 가능한 학습 결과에는 Python 버전, 운영체제, 실행 명령을 함께 적어야 합니다. 날짜나 설치 패키지에 따라 달라지는 출력은 고정된 정답처럼 제시하지 않습니다."],
    },
    {
      id: "print-and-literals",
      title: "print와 문자열 리터럴을 분리해서 이해하기",
      lead: "따옴표는 출력 명령이 아니라 문자열 값을 만드는 문법이고, print는 그 값을 출력 통로로 보내는 함수입니다.",
      explanations: [
        "작은따옴표와 큰따옴표는 같은 str 타입의 값을 만듭니다. 문자열 안에 작은따옴표가 많으면 바깥을 큰따옴표로 감싸고, 반대의 경우에는 작은따옴표를 쓰면 이스케이프를 줄일 수 있습니다. 세 개의 따옴표는 줄바꿈을 포함한 여러 줄 문자열을 만들며, 함수나 클래스의 첫 문장에 놓이면 문서화 문자열인 docstring으로도 사용됩니다.",
        "print는 쉼표로 여러 값을 받을 수 있고 기본 구분자 sep=' '를 사이에 둡니다. 출력 마지막에는 end='\\n'이 붙습니다. 따라서 print('A', 'B', sep='-', end='!')는 A-B!를 쓰고 자동 줄바꿈을 하지 않습니다. 문자열 연결과 출력 옵션을 섞지 말고, 먼저 어떤 값이 만들어지는지와 print가 어떻게 표시할지를 나눠 생각하면 오류를 줄일 수 있습니다.",
      ],
      concepts: [
        { term: "리터럴", definition: "소스 코드에 값을 직접 표현하는 문법입니다.", detail: ["'Hello'는 문자열 리터럴, 3은 정수 리터럴, 3.14는 실수 리터럴, True는 불리언 리터럴입니다.", "따옴표 문자는 문자열 값에 포함되지 않고 문자열의 시작과 끝을 표시합니다."], analogy: "메뉴에 ‘아메리카노’라고 직접 적는 것이 리터럴이라면, 주문 번호로 나중에 메뉴를 찾는 것은 이름을 통한 참조에 가깝습니다." },
      ],
      codeExamples: [
        {
          id: "python-first-output",
          title: "문자열과 타입을 순서대로 출력하기",
          language: "python",
          filename: "first_output.py",
          purpose: "원본 ex01_print.py의 핵심을 작은 실행 단위로 재구성해 리터럴, 이름, type, print 호출 순서를 확인합니다.",
          code: "print('Hello Python')\n\nscore = 3\nprint(score)\nprint(type(score))\nprint(type(3.14))\nprint(type('A'))\nprint(type(True))",
          walkthrough: [
            { lines: "1", explanation: "문자열 리터럴로 str 객체를 만들고 내장 함수 print에 전달합니다. 출력 뒤에는 기본 줄바꿈이 붙습니다." },
            { lines: "3", explanation: "정수 리터럴 3으로 만들어진 int 객체를 score라는 이름에 바인딩합니다. 대입문 자체는 출력하지 않습니다." },
            { lines: "4", explanation: "score라는 이름을 평가해 현재 가리키는 객체 3을 print에 전달합니다." },
            { lines: "5-8", explanation: "type은 객체의 타입 객체를 반환합니다. print가 그 타입 객체의 읽기 쉬운 표현을 터미널에 표시합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "UTF-8로 저장한 first_output.py", "파일이 있는 폴더에서 연 PowerShell 또는 터미널"], command: "python first_output.py" },
          output: { value: "Hello Python\n3\n<class 'int'>\n<class 'float'>\n<class 'str'>\n<class 'bool'>", explanation: ["첫 줄은 문자열 값 자체입니다.", "score가 가리키는 값은 3이며 type(score)는 int 타입 객체를 돌려줍니다.", "따옴표 한 글자도 Python에서는 별도 char 타입이 아니라 str입니다.", "True와 False는 bool 타입이며 첫 글자를 반드시 대문자로 씁니다."] },
          experiments: [
            { change: "score = 3을 score = 3.0으로 바꿉니다.", prediction: "화면의 값은 3.0으로 바뀌고 type(score)는 float가 됩니다.", result: "파이썬 이름에는 고정 타입 선언이 없고 새 대입 시 다른 타입 객체를 가리킬 수 있습니다." },
            { change: "마지막에 print('A', 3, True, sep=' | ')를 추가합니다.", prediction: "서로 다른 타입의 값을 print가 문자열 표현으로 바꾸고 |로 구분합니다.", result: "A | 3 | True가 한 줄에 출력됩니다. 이것이 값들이 모두 str로 영구 변환됐다는 뜻은 아닙니다." },
          ],
          sourceRefs: ["py-day01-ex01", "py-day01-note"],
        },
      ],
      diagnostics: [],
    },
    {
      id: "names-and-binding",
      title: "변수는 상자보다 이름표에 가깝습니다",
      lead: "파이썬의 대입은 이름 안에 값을 밀어 넣는 동작보다, 현재 실행 공간의 이름을 객체에 연결하는 동작으로 이해해야 이후의 리스트·함수·객체 참조가 자연스럽습니다.",
      explanations: [
        "score = 3에서 오른쪽 표현식을 먼저 평가해 int 객체를 얻고, 왼쪽 이름 score를 그 객체에 연결합니다. 이후 score = '완료'를 실행하면 score가 새 str 객체를 가리키도록 바인딩이 바뀝니다. 이전 객체를 다른 이름이 가리키고 있다면 그대로 남고, 아무도 가리키지 않으면 나중에 메모리 관리 대상이 될 수 있습니다.",
        "이름 규칙은 문법과 관례를 구분해야 합니다. 영문자나 밑줄로 시작하고 뒤에 숫자를 쓸 수 있으며, if·class 같은 키워드는 이름으로 쓸 수 없습니다. 한글 식별자도 문법상 가능하지만 협업과 도구 호환성을 위해 설명적인 영문 snake_case를 주로 사용합니다. age, total_score처럼 역할이 드러나는 이름은 su1처럼 맥락 없는 이름보다 코드를 오래 이해하게 해 줍니다.",
        "동일성(identity)과 동등성(equality)은 나중에 반드시 구분합니다. 두 이름이 값이 같은 별도 객체를 가리킬 수 있으며 ==는 보통 값의 동등성을, is는 같은 객체인지의 동일성을 검사합니다. 숫자 캐싱 같은 구현 세부에 기대어 is로 숫자나 문자열 값을 비교하면 안 됩니다.",
      ],
      concepts: [
        { term: "이름 바인딩", definition: "현재 이름 공간에서 식별자와 객체 사이의 연결을 만들거나 바꾸는 일입니다.", detail: ["대입의 오른쪽이 먼저 평가되고 성공한 뒤 왼쪽 이름이 바뀝니다.", "여러 이름이 하나의 mutable 객체를 함께 가리키면 한쪽을 통한 변경이 다른 쪽에서도 관찰됩니다. 이 문제는 리스트 세션에서 직접 실험합니다."], caveat: "‘변수에 타입이 있다’고 말할 때는 편의적 표현일 수 있습니다. 런타임에서 타입을 가진 것은 객체이고 이름은 실행 중 다른 타입의 객체에 다시 바인딩될 수 있습니다." },
        { term: "이름 공간(namespace)", definition: "이름과 그 이름이 가리키는 객체의 매핑입니다.", detail: ["모듈, 함수, 클래스는 서로 다른 이름 공간을 만들 수 있습니다.", "처음에는 파일 최상위의 전역 이름 공간과 함수 안 지역 이름 공간이 구분된다는 정도를 기억하면 됩니다."], analogy: "연락처 앱에서 ‘담당자’라는 항목이 특정 전화번호를 가리키다가 인수인계 후 새 전화번호를 가리키는 것과 비슷합니다." },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: ["타입 힌트 score: int = 3은 도구와 사람에게 의도를 전달하지만 기본 Python 런타임이 이후 score = '완료'를 자동 차단하지는 않습니다. 정적 검사기는 별도로 실행해야 합니다."],
    },
    {
      id: "types-and-introspection",
      title: "type으로 객체의 종류를 관찰합니다",
      lead: "타입은 가능한 연산과 동작을 결정합니다. 같은 + 기호도 int에서는 덧셈, str에서는 연결로 해석되는 이유가 객체의 타입에 있습니다.",
      explanations: [
        "type(value)는 value가 가리키는 객체의 클래스를 반환합니다. 결과가 <class 'int'>처럼 보이는 이유는 type 함수가 문자열이 아니라 클래스 객체 자체를 반환하고, print가 그 객체의 표현을 출력하기 때문입니다. 비교가 필요하다면 type(value).__name__ 문자열에 의존하기보다 상황에 따라 isinstance(value, int)를 사용합니다.",
        "첫날에는 int, float, str, bool을 먼저 구분합니다. list·tuple·dict·set은 여러 값을 조직하는 컬렉션이며 이후 별도 세션에서 변경 가능성, 순서, 키, 중복 규칙을 다룹니다. 모든 타입 이름을 한 번에 암기하는 것이 목표가 아니라 현재 객체가 어떤 연산을 지원하고 그 결과가 어떤 타입인지 질문하는 습관이 목표입니다.",
      ],
      concepts: [
        { term: "동적 타이핑", definition: "실행 중 객체가 타입을 가지며 이름을 사용하기 전에 고정 타입 선언을 요구하지 않는 방식입니다.", detail: ["동적이라는 말은 타입이 없다는 뜻이 아닙니다. 3은 언제나 int 객체이고 '3'은 str 객체입니다.", "잘못된 타입 연산은 실행이 해당 줄에 도달했을 때 TypeError로 드러날 수 있으므로 테스트와 타입 검사가 중요합니다."], caveat: "동적 타이핑과 약한 타이핑은 같은 말이 아닙니다. Python은 '3' + 4를 자동 숫자 변환하지 않고 TypeError로 막습니다." },
      ],
      codeExamples: [],
      diagnostics: [],
    },
    {
      id: "fstrings-and-expressions",
      title: "f-string은 값을 설명이 있는 텍스트로 바꿉니다",
      lead: "중괄호 안에는 이름뿐 아니라 표현식과 함수 호출도 들어갈 수 있습니다. 먼저 값을 계산한 뒤 포맷 규칙으로 문자열을 만듭니다.",
      explanations: [
        "f-string 앞의 f는 문자열 리터럴 안 중괄호를 표현식 자리로 해석하게 합니다. f'{price:,}'는 price 객체 자체를 바꾸지 않고 천 단위 구분자가 포함된 새 문자열을 만듭니다. f'{ratio:.2f}' 역시 표시할 때 소수 둘째 자리까지 반올림할 뿐 원래 float 값의 정밀도를 잘라 저장하지 않습니다.",
        "f'{x=}' 문법은 표현식의 소스 텍스트와 값을 함께 보여 주어 작은 실험과 디버깅에 유용합니다. 운영 로그에서는 비밀값이 함께 출력되지 않도록 주의해야 하며, 사용자에게 보여 줄 문장과 개발자 진단 로그를 구분해야 합니다.",
      ],
      concepts: [
        { term: "표현식", definition: "평가했을 때 하나의 값을 만드는 코드 조각입니다.", detail: ["x, 10, x + 10, hi()는 모두 상황에 따라 값을 만드는 표현식입니다.", "대입문 전체는 일반적인 표현식과 다르므로 f-string 중괄호에 score = 3 같은 문장을 그대로 넣을 수 없습니다."], analogy: "보고서 양식의 빈칸마다 계산식을 넣고 최종 문서를 만드는 것과 비슷합니다." },
        { term: "포맷 지정자", definition: "값을 문자열로 표시하는 모양을 정하는 규칙입니다.", detail: [".2f는 고정 소수점 둘째 자리까지 표시하고 쉼표는 천 단위 구분자를 표시합니다.", "표시 형식과 실제 데이터 변환을 구분해야 합니다. 계산에는 원래 숫자 객체가 그대로 사용됩니다."] },
      ],
      codeExamples: [
        {
          id: "python-fstring-report",
          title: "계산 결과를 읽을 수 있는 보고서로 출력하기",
          language: "python",
          filename: "score_report.py",
          purpose: "원본 ex02_print.py의 표현식, 디버깅 표기, 소수 포맷, 천 단위 구분을 하나의 작은 성적 보고서로 연결합니다.",
          code: "name = '둘리'\npython_score = 87\ndatabase_score = 92\naverage = (python_score + database_score) / 2\n\nprint(f'이름: {name}')\nprint(f'{python_score=}, {database_score=}')\nprint(f'평균: {average:.2f}')\nprint(f'누적 학습 코드: {1234567:,}줄')",
          walkthrough: [
            { lines: "1-3", explanation: "학습자 이름은 str, 두 점수는 int 객체로 만들고 각 이름을 바인딩합니다." },
            { lines: "4", explanation: "괄호 안 덧셈을 먼저 평가한 뒤 /로 나눕니다. Python의 / 결과는 정수끼리 나누어도 float입니다." },
            { lines: "6", explanation: "name을 평가하고 그 문자열 표현을 문장 안에 삽입합니다." },
            { lines: "7", explanation: "= 디버깅 표기가 표현식 이름과 repr 형태의 값을 함께 만듭니다." },
            { lines: "8", explanation: ".2f는 average를 소수 둘째 자리까지 고정해 표시합니다. 원래 average 객체를 수정하지 않습니다." },
            { lines: "9", explanation: "정수 리터럴도 중괄호 안에서 바로 포맷할 수 있고 쉼표 지정자는 세 자리마다 구분합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "score_report.py를 UTF-8로 저장"], command: "python score_report.py" },
          output: { value: "이름: 둘리\npython_score=87, database_score=92\n평균: 89.50\n누적 학습 코드: 1,234,567줄", explanation: ["평균 계산값 89.5가 .2f에 의해 89.50으로 표시됩니다.", "디버깅 표기는 변수 이름을 직접 적은 문자열과 달리 이름을 바꾸면 출력 라벨도 함께 바뀝니다.", "1,234,567은 출력 문자열의 형식이며 정수 값은 여전히 1234567입니다."] },
          experiments: [
            { change: "average 출력 직후 print(type(average))를 추가합니다.", prediction: "포맷 결과와 무관하게 float가 출력됩니다.", result: "<class 'float'>가 출력되어 표시 형식과 객체 타입이 별개임을 확인합니다." },
            { change: "첫 줄의 f를 제거해 print('이름: {name}')로 실행합니다.", prediction: "중괄호가 평가되지 않고 글자 그대로 나옵니다.", result: "이름: {name}이 출력됩니다. f 접두사가 해석 규칙을 바꾼다는 증거입니다." },
          ],
          sourceRefs: ["py-day01-ex02", "py-day01-note"],
        },
      ],
      diagnostics: [],
    },
    {
      id: "deletion-and-errors",
      title: "del과 NameError로 이름의 존재를 확인합니다",
      lead: "del score는 정수 객체를 파괴하라는 명령이 아니라 현재 이름 공간에서 score 바인딩을 제거합니다. 그 다음 접근이 실패하는 이유를 traceback으로 읽습니다.",
      explanations: [
        "del score 뒤에 print(score)가 오면 파이썬은 score라는 이름을 현재 이름 공간에서 찾지 못해 NameError를 발생시킵니다. 오류가 발생한 줄 뒤의 문장은 실행되지 않습니다. traceback은 호출 경로를 위에서 아래로 보여 주고 마지막 줄에 예외 타입과 핵심 메시지를 둡니다. 입문자는 긴 경로보다 마지막 줄의 NameError와 따옴표 안 이름을 먼저 확인하면 됩니다.",
        "오타도 같은 NameError를 만들 수 있습니다. total_score를 정의하고 total_socre를 출력하면 서로 다른 이름입니다. 대소문자도 구분하므로 name, Name, NAME은 별개입니다. 에디터의 자동 완성과 정적 분석을 사용하되, 오류 메시지를 직접 읽는 능력을 대신하게 하지는 마세요.",
      ],
      concepts: [
        { term: "예외", definition: "정상 흐름을 계속할 수 없는 상황을 타입과 메시지로 표현한 객체입니다.", detail: ["처리하지 않은 예외는 traceback을 출력하고 현재 프로그램 실행을 중단합니다.", "NameError는 이름 검색 실패, TypeError는 지원하지 않는 타입 조합처럼 예외 타입이 문제 범주를 알려 줍니다."] },
        { term: "traceback", definition: "오류가 발생한 위치까지 어떤 코드 경로를 거쳤는지 보여 주는 진단 기록입니다.", detail: ["가장 아래의 예외 타입과 메시지부터 읽고 바로 위의 사용자 코드 파일·줄 번호를 찾습니다.", "라이브러리 내부 프레임이 많더라도 처음에는 내가 작성한 파일의 마지막 프레임에 집중합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "NameError: name 'score' is not defined가 발생한다.", likelyCause: "score를 대입하기 전에 읽었거나, del로 지웠거나, 철자가 다른 이름을 사용했습니다.", checks: ["traceback 마지막 줄에서 찾지 못한 이름의 정확한 철자를 확인합니다.", "표시된 사용자 코드 줄보다 위에 그 이름을 대입하는 문장이 실제로 실행되는지 확인합니다.", "조건문이나 함수 안에서만 정의되어 현재 이름 공간에 없는 것은 아닌지 확인합니다."], fix: "사용 전에 올바른 철자로 값을 바인딩하고, 불필요한 del을 제거합니다. 단순히 예외를 숨기기 위해 광범위한 try/except를 추가하지 않습니다.", prevention: "의미 있는 이름과 일관된 snake_case를 사용하고 에디터의 미정의 이름 검사를 켜며 작은 단위로 자주 실행합니다." },
        { symptom: "TypeError: can only concatenate str (not \"int\") to str가 발생한다.", likelyCause: "문자열 연결 연산 +에 int 객체를 그대로 섞었습니다. 동적 타이핑이 자동 형 변환을 뜻한다고 오해한 경우가 많습니다.", checks: ["오류 줄의 + 양쪽 값을 type으로 확인합니다.", "목적이 숫자 덧셈인지 문장 출력인지 결정합니다.", "외부 입력이 문자열로 들어온 것은 아닌지 확인합니다."], fix: "출력 문장이라면 f-string을 사용하고, 숫자 계산이라면 검증 후 int(value) 또는 float(value)로 명시 변환합니다.", prevention: "경계에서 입력 타입을 확인하고 계산 데이터와 표시 문자열을 분리합니다." },
      ],
    },
    {
      id: "complete-mental-model",
      title: "입력·평가·바인딩·표시를 한 흐름으로 연결합니다",
      lead: "새 코드를 볼 때 ‘무엇이 출력될까?’만 맞히지 말고, 각 줄에서 어떤 객체가 만들어지고 어느 이름이 무엇을 가리키며 어떤 표현이 출력되는지 추적합니다.",
      explanations: [
        "source = 3이라는 줄은 정수 객체를 만들고 source 이름을 연결합니다. label = f'{source=}'에서는 source를 읽고 문자열 표현을 구성한 뒤 새 str 객체를 label에 연결합니다. print(label)은 label이 가리키는 str 객체를 표준 출력에 보냅니다. 같은 세 줄에도 객체 생성, 이름 검색, 표현식 평가, 함수 호출이 차례로 들어 있습니다.",
        "이 정신 모델은 이후 모든 파이썬 학습의 기준점입니다. 리스트를 두 이름이 공유할 때의 변경, 함수 인수 전달, 클래스 인스턴스, pandas DataFrame의 복사와 뷰 문제도 결국 이름과 객체의 관계를 추적하면 훨씬 정확하게 이해할 수 있습니다.",
        "전문가가 코드를 빠르게 읽는 이유는 문법을 많이 외워서만이 아닙니다. 각 문장의 부작용, 반환값, 실패 가능성, 타입 변화를 예측하는 공통 모델이 있기 때문입니다. 지금은 아주 작은 print 예제로 그 습관을 시작합니다.",
      ],
      concepts: [],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "파일 실행과 대화형 셸 중 무엇을 선택할까요?", options: [
          { name: "파일(.py) 실행", chooseWhen: "재현하고 저장하며 여러 줄의 실행 순서를 확인할 때", avoidWhen: "한 표현식의 결과를 아주 빠르게 탐색할 때", tradeoffs: ["print를 명시해야 결과가 보입니다.", "같은 파일을 다시 실행해 결과를 재현하기 쉽습니다.", "버전 관리와 테스트에 연결할 수 있습니다."] },
          { name: "REPL 대화형 셸", chooseWhen: "짧은 표현식이나 type 결과를 즉시 실험할 때", avoidWhen: "긴 프로그램과 반복 가능한 학습 기록을 만들 때", tradeoffs: ["표현식 결과를 자동 표시해 빠릅니다.", "이전 입력 상태가 남아 처음부터 재현하기 어려울 수 있습니다.", "종료하면 입력 기록을 별도로 보존해야 합니다."] },
        ] },
      ],
      expertNotes: ["디버깅 시 값만 찍지 말고 의미 있는 라벨, 타입, 경계 조건을 함께 관찰합니다. 단, 토큰·비밀번호·개인정보는 f-string 디버깅 출력에 포함하지 않습니다.", "라이브러리 API는 객체의 __str__ 또는 __repr__ 구현에 따라 print 결과가 달라질 수 있습니다. 출력 문자열을 영구 데이터 형식처럼 파싱하지 말고 구조화된 값을 사용합니다."],
    },
  ],
  lab: {
    title: "내 첫 학습 상태 보고서 만들기",
    scenario: "오늘 학습한 과정명, 완료한 세션 수, 목표 세션 수, 완료율을 이름과 타입이 드러나도록 출력하는 작은 프로그램을 만듭니다.",
    setup: ["새 폴더에 learning_report.py 파일을 만듭니다.", "터미널에서 python --version으로 3.11 이상인지 확인합니다.", "파일을 UTF-8로 저장합니다."],
    steps: ["course_name에 'Python 기초', completed에 1, total에 40을 바인딩합니다.", "completion_rate = completed / total * 100 표현식으로 완료율을 계산합니다.", "f-string을 사용해 과정명과 completed= 디버깅 표기, 완료율을 소수 첫째 자리까지 출력합니다.", "각 이름의 type을 별도 줄에 출력하고 예상한 타입과 비교합니다.", "completed를 2로 바꾸어 실행하고 출력 중 어떤 부분이 왜 달라지는지 기록합니다."],
    expectedResult: ["과정명, 완료 세션 수, 전체 세션 수, 2.5% 완료율이 읽기 쉬운 문장으로 표시됩니다.", "course_name은 str, completed와 total은 int, completion_rate는 float로 확인됩니다.", "입력값 하나를 바꾸었을 때 계산 표현식과 출력이 일관되게 갱신됩니다."],
    cleanup: ["실습 파일은 이후 세션에서도 확장할 수 있도록 삭제하지 않고 학습 폴더에 보관합니다."],
    extensions: ["남은 세션 수를 계산해 추가합니다.", "예상 총 학습 시간을 분 단위 정수로 두고 시간·분으로 나누어 표시합니다.", "일부 이름을 del한 뒤 traceback을 읽고 다시 복구해 봅니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "책 정보 두 권을 각각 이름으로 만들고 f-string으로 출력하세요.", requirements: ["title, author, pages 이름을 사용합니다.", "pages의 타입을 출력합니다.", "페이지 수에 천 단위 구분자를 적용합니다."], hints: ["문자열은 따옴표로, 페이지 수는 따옴표 없이 정수 리터럴로 만듭니다.", "f'{pages:,}' 형식을 사용합니다."], expectedOutcome: "책 제목·저자·페이지가 한 문장으로 나오고 pages가 int임을 설명할 수 있습니다.", solutionOutline: ["세 이름을 먼저 바인딩합니다.", "type(pages)를 별도 print로 확인합니다.", "마지막 print에서 f-string 포맷을 적용합니다."] },
    { difficulty: "응용", prompt: "상품 단가와 수량으로 주문 요약을 출력하세요.", requirements: ["unit_price와 quantity를 int로 둡니다.", "total_price 표현식을 만들고 모든 금액에 쉼표를 표시합니다.", "각 줄 실행 전후 객체 타입이 바뀌는지 설명합니다."], hints: ["total_price = unit_price * quantity로 계산합니다.", "포맷은 문자열 표시만 바꾸며 원래 int를 바꾸지 않습니다."], expectedOutcome: "입력 숫자를 바꿔도 총액과 표시 형식이 자동 갱신되는 보고서가 완성됩니다." },
    { difficulty: "설계", prompt: "세 가지 기술의 학습 진도를 표현하는 콘솔 대시보드를 설계하세요.", requirements: ["기술명·완료 수·전체 수를 표현할 이름 체계를 직접 정합니다.", "각 완료율을 계산하고 소수 첫째 자리로 표시합니다.", "왜 그 이름과 타입을 골랐는지 주석이 아닌 별도 설명으로 기록합니다.", "일부 값을 문자열로 잘못 입력했을 때 생길 실패를 재현하고 해결합니다."], hints: ["처음에는 반복문 없이 각 기술을 별도 이름으로 작성해도 됩니다.", "문자열 숫자를 계산에 쓰려면 경계에서 int로 변환해야 합니다."], expectedOutcome: "정상 결과와 의도한 TypeError, 수정 결과를 모두 보존한 재현 가능한 실험 기록이 만들어집니다." },
  ],
  reviewQuestions: [
    { question: "print('3')과 print(3)의 화면은 비슷한데 무엇이 다른가요?", answer: "첫 값은 str 객체, 둘째 값은 int 객체입니다. print는 둘 다 사람이 읽는 3으로 표시하지만 가능한 연산과 type 결과가 다릅니다." },
    { question: "score = 3 다음 score = '완료'가 가능한 이유는 무엇인가요?", answer: "타입을 가진 객체와 이름의 바인딩을 구분하기 때문입니다. score 이름이 int 객체에서 str 객체로 다시 바인딩됩니다." },
    { question: "f'{value:.2f}'를 사용하면 원래 float 값도 소수 둘째 자리로 잘리나요?", answer: "아닙니다. 새로 만들어지는 표시 문자열의 형식만 바뀌고 원래 float 객체의 값은 그대로입니다." },
    { question: "NameError가 나오면 traceback에서 무엇부터 확인해야 하나요?", answer: "가장 마지막 줄의 예외 타입과 찾지 못한 이름을 보고, 바로 위의 내 파일과 줄 번호에서 정의 시점·철자·이름 공간을 확인합니다." },
    { question: "파일을 정상 실행했는데 출력이 하나도 없을 수 있나요?", answer: "가능합니다. 대입과 계산만 하고 print나 다른 출력 부작용이 없다면 정상 종료되어도 터미널에는 아무것도 표시되지 않습니다." },
    { question: "동적 타이핑은 Python이 문자열과 숫자를 알아서 섞어 계산해 준다는 뜻인가요?", answer: "아닙니다. 객체의 타입은 명확하며 호환되지 않는 연산은 TypeError가 납니다. 동적이라는 말은 이름에 고정 타입 선언이 필수는 아니라는 뜻에 가깝습니다." },
  ],
  completionChecklist: [
    "문자열 리터럴과 print 함수의 역할을 구분해 설명할 수 있다.",
    "대입의 오른쪽 평가와 왼쪽 이름 바인딩 순서를 설명할 수 있다.",
    "int, float, str, bool 값을 만들고 type 결과를 예측할 수 있다.",
    "f-string에서 표현식, = 디버깅 표기, .2f와 쉼표 포맷을 사용할 수 있다.",
    "NameError traceback을 읽고 오타·정의 순서·del 중 원인을 찾을 수 있다.",
    "파일 실행과 REPL에서 결과 표시가 다른 이유를 말할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-day01-ex01", repository: "PYTHON-BASIC", path: "day01/ex01_print.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day01/ex01_print.py", usedFor: ["print", "문자열 리터럴", "변수", "type", "del"], evidence: "원본을 Python 3.13.9에서 재실행해 Hello Python과 여섯 타입 출력을 확인했습니다." },
    { id: "py-day01-ex02", repository: "PYTHON-BASIC", path: "day01/ex02_print.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day01/ex02_print.py", usedFor: ["f-string", "표현식", "디버깅 표기", "숫자 포맷"], evidence: "원본 실행에서 사칙연산, x=5 표기, 3.14·3.15 반올림, 1,000,000 구분자 결과를 확인했습니다." },
    { id: "py-day01-ex03", repository: "PYTHON-BASIC", path: "day01/ex03_datatype.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day01/ex03_datatype.py", usedFor: ["기본 자료형 지도", "mutable과 immutable의 후속 범위"], evidence: "출력이 없는 개요 파일이므로 코드 주석의 타입 목록을 후속 세션 범위 설계에 사용했습니다." },
    { id: "py-day01-note", repository: "PYTHON-BASIC", path: "notes/day01_basic.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day01_basic.md", usedFor: ["변수 이름 규칙", "f-string 표", "셀프 체크", "파일 매핑"], evidence: "Day01 노트의 Q3과 타입 표를 검토하고 이름 바인딩·오류 진단 설명을 보강했습니다." },
  ],
  sourceCoverage: { filesRead: 4, filesUsed: 4, uncoveredNotes: ["ex03_datatype.py는 의도적으로 출력이 없어 이 세션에서 직접 type 관찰 코드를 추가했습니다.", "숫자·불리언 연산의 상세는 원본 세션 2로 분리해 중복을 피합니다."] },
} satisfies DetailedSession;

export default session;
