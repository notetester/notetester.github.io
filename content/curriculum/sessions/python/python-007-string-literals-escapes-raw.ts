import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-007"],
  slug: "python-007-string-literals-escapes-raw",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 7,
  title: "문자열 리터럴과 역슬래시를 정확히 읽는 법",
  subtitle: "따옴표 선택부터 escape·여러 줄 문자열·docstring·raw string·Unicode·불변성까지, 소스 표기와 실제 str 값을 구분합니다.",
  level: "기초",
  estimatedMinutes: 120,
  coreQuestion: "파이썬 소스의 따옴표와 역슬래시는 어떻게 하나의 str 객체로 해석되며, 언제 일반 문자열·raw string·pathlib를 선택해야 할까요?",
  summary: "문자열 리터럴은 소스 코드의 표기이고 str은 그 표기를 해석해 만들어진 객체입니다. 작은따옴표와 큰따옴표는 같은 타입을 만들며, escape sequence는 줄바꿈·탭·따옴표·역슬래시·Unicode 문자를 소스에 표현합니다. 세 따옴표는 여러 줄 str을 만들지만 함수·클래스·모듈 첫 문장에 놓일 때만 docstring으로 인식됩니다. raw string은 역슬래시 escape 처리를 대부분 억제하지만 끝에 홀수 개의 역슬래시를 둘 수 없고, 경로나 정규식을 안전하게 검증해 주는 별도 타입도 아닙니다. 실제 실행 결과와 실패 사례를 통해 표기, 값, 출력, repr, 인코딩, 불변성을 연결합니다.",
  objectives: [
    "작은따옴표·큰따옴표·세 따옴표가 모두 str 객체를 만들며 어떤 표기를 선택하면 escape가 줄어드는지 설명할 수 있다.",
    "일반 문자열에서 \\n·\\t·\\\\·\\'·\\\"가 소스 해석 뒤 어떤 문자로 저장되는지 print와 repr로 확인할 수 있다.",
    "여러 줄 문자열과 함수·클래스·모듈 docstring의 차이를 __doc__ 관찰로 설명할 수 있다.",
    "raw string이 역슬래시를 보존하는 정확한 범위와 끝의 홀수 역슬래시 제한을 재현할 수 있다.",
    "Windows 경로, 정규식, Unicode escape에서 일반 문자열·raw string·pathlib·re.escape를 목적에 맞게 선택할 수 있다.",
    "str이 불변 객체이므로 인덱스 대입이 실패하고 연결·치환은 새 문자열을 만든다는 점을 설명할 수 있다.",
    "문자열 escape가 HTML·SQL·셸 보안 escaping이나 bytes 인코딩을 대신하지 않음을 구분할 수 있다.",
  ],
  prerequisites: [
    {
      title: "변수와 이름 바인딩",
      reason: "문자열 리터럴을 평가하면 str 객체가 만들어지고 이름이 그 객체에 연결된다는 관계를 이해해야 불변 문자열의 재바인딩을 정확히 설명할 수 있습니다.",
      sessionSlug: "python-002-variables-dynamic-types",
    },
    {
      title: "print와 type 사용",
      reason: "문자열의 화면 표현과 실제 타입을 관찰하기 위해 print, repr, type 결과를 읽을 수 있으면 충분합니다.",
      sessionSlug: "python-001-output-names-types",
    },
  ],
  keywords: ["Python", "str", "문자열 리터럴", "따옴표", "escape sequence", "raw string", "docstring", "repr", "Unicode", "pathlib", "정규식", "불변성", "인코딩"],
  chapters: [
    {
      id: "literal-to-str-object",
      title: "문자열 리터럴은 str 객체를 만드는 소스 표기입니다",
      lead: "따옴표는 문자열 값에 저장되는 장식이 아니라 파이썬 파서에게 문자열의 시작·끝과 해석 규칙을 알려 주는 문법입니다.",
      explanations: [
        "소스에 '헬로 python'이라고 적으면 파이썬은 작은따옴표 사이 문자를 읽어 str 객체를 만듭니다. 큰따옴표로 같은 내용을 적어도 값과 타입은 같습니다. 원본 ex01_string.py에서 작은따옴표와 큰따옴표 버전을 각각 print하면 둘 다 헬로 python <class 'str'>로 출력되는 것이 직접 증거입니다. 따옴표 문자 자체는 경계를 표시할 뿐 값에 자동으로 포함되지 않습니다.",
        "문자열 리터럴은 소스 표기이고 str은 런타임 객체입니다. 화면에 보이는 출력도 객체 그 자체가 아니라 print가 만든 사람이 읽기 쉬운 표현입니다. 예를 들어 줄바꿈 문자를 포함한 str을 print하면 실제 줄이 바뀌지만 repr로 보면 \\n이라는 escape 표기가 보입니다. 값을 이해하려면 소스, 런타임 문자 시퀀스, print 결과, repr 결과를 네 단계로 나누어 봅니다.",
        "Python의 str은 Unicode 텍스트를 표현합니다. 한글, 영문, 이모지와 다양한 문자 체계가 같은 str 타입에 들어갑니다. 파일·네트워크로 내보낼 때는 UTF-8 같은 인코딩으로 bytes로 바꾸고, bytes를 읽을 때는 같은 인코딩 규칙으로 str로 decode해야 합니다. 따옴표 종류가 인코딩을 결정하지는 않습니다.",
        "원본은 str이라는 이름에 문자열을 대입합니다. 실행 자체는 되지만 이후 str(123)처럼 내장 타입 변환 함수를 호출하려 하면 str 이름이 문자열 객체로 가려져 TypeError가 납니다. 학습 원본의 결과는 존중하되 새 코드에서는 text, message, path_text처럼 의미 있는 이름을 사용해 내장 str을 보존합니다.",
      ],
      concepts: [
        {
          term: "문자열 리터럴",
          definition: "소스 코드에서 문자 시퀀스 값을 직접 표현하는 문법입니다.",
          detail: ["'text', \"text\", '''text''', \"\"\"text\"\"\"는 모두 상황에 따라 str 객체를 만듭니다.", "접두사 r은 escape 처리 규칙을 바꾸고 f는 중괄호 표현식을 평가하는 별도의 리터럴 규칙입니다."],
          analogy: "악보의 기호가 소스 표기라면 실제 연주된 소리가 런타임 값에 가깝습니다. 기호와 결과는 연결되지만 같은 것은 아닙니다.",
        },
        {
          term: "str",
          definition: "Python에서 Unicode 텍스트를 표현하는 불변 시퀀스 타입입니다.",
          detail: ["문자열 안 문자는 순서를 가지며 인덱싱·슬라이싱·포함 검사 대상이 됩니다.", "불변이므로 한 번 만들어진 str 객체의 특정 문자를 그 자리에서 교체할 수 없습니다."],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "TypeError: 'str' object is not callable가 str(123) 줄에서 발생한다.",
          likelyCause: "앞에서 str = '문자열'처럼 내장 str 타입 이름을 다른 문자열 객체에 재바인딩해 호출 가능한 내장 타입을 가렸습니다.",
          checks: ["오류 직전에 print(type(str), repr(str))로 현재 str 이름의 대상을 확인합니다.", "파일 위쪽에서 str = 패턴을 검색합니다.", "대화형 셸이라면 이전 실험의 바인딩이 남아 있는지 확인합니다."],
          fix: "변수 이름을 text 또는 message로 바꾸고 현재 세션에서는 del str 또는 인터프리터 재시작으로 내장 이름을 복구합니다.",
          prevention: "str, list, dict, sum, type, input처럼 자주 쓰는 내장 이름을 일반 변수명으로 사용하지 않습니다.",
        },
      ],
      expertNotes: [
        "소스 파일의 기본 인코딩은 Python 3에서 UTF-8입니다. 외부 파일의 인코딩과 소스 코드 인코딩은 별도 경계입니다.",
        "str은 Unicode 코드 포인트의 시퀀스이지만 사용자가 보는 글자 하나가 코드 포인트 하나라고 항상 보장되지는 않습니다. 결합 문자와 이모지는 별도 국제화 주제입니다.",
      ],
    },
    {
      id: "choosing-quotes",
      title: "내용에 맞는 바깥 따옴표를 선택하면 escape가 줄어듭니다",
      lead: "작은따옴표와 큰따옴표 사이에 타입 차이는 없습니다. 내용 속 따옴표와 팀 스타일을 보고 읽기 쉬운 쪽을 선택합니다.",
      explanations: [
        "I'm ready.처럼 작은따옴표가 포함된 영어 문장은 바깥을 큰따옴표로 감싸면 내부 apostrophe를 그대로 적을 수 있습니다. 반대로 그는 \"준비\"라고 말했다처럼 큰따옴표가 필요한 문장은 바깥을 작은따옴표로 감싸면 쉽습니다. 원본도 \"I'm Ok !!\"와 'I\"m Ok !!'를 통해 바깥·안쪽 따옴표 조합을 보여 줍니다.",
        "같은 따옴표를 안에도 써야 한다면 역슬래시로 delimiter를 escape할 수 있습니다. 'It\\'s ready' 또는 \"그는 \\\"준비\\\"라고 말했다\"처럼 씁니다. 중요한 것은 역슬래시가 언제나 값에 남는 문자가 아니라, 이 경우에는 다음 따옴표를 문자열 종료 기호가 아닌 내용 문자로 해석하게 한다는 점입니다.",
        "문자열 안에 JSON이나 Python dict처럼 따옴표가 많은 구조를 손으로 조합하면 escape가 빠르게 복잡해집니다. 원본의 \"{'name' : 'hong'}\"은 단순 출력에는 괜찮지만 실제 JSON 생성에는 json.dumps를 사용해야 큰따옴표, Unicode, 제어문자와 데이터 타입을 올바르게 직렬화합니다. 사람이 보는 한 줄 예제와 기계가 읽을 데이터 형식을 구분합니다.",
        "프로젝트에서는 formatter가 선택한 따옴표 스타일을 따르는 편이 협업에 좋습니다. 스타일보다 중요한 것은 불필요한 escape를 피하고, 문자열의 경계가 한눈에 보이며, 데이터 자체를 코드 조각으로 이어 붙이지 않는 것입니다.",
      ],
      concepts: [
        {
          term: "delimiter",
          definition: "문자열 리터럴의 시작과 끝을 표시하는 따옴표 경계입니다.",
          detail: ["바깥 작은따옴표 안에서는 escape되지 않은 작은따옴표가 리터럴을 닫습니다.", "다른 종류 따옴표는 그 문자열 안에서 보통 일반 문자입니다."],
        },
        {
          term: "quote escape",
          definition: "바깥 delimiter와 같은 따옴표를 내용으로 넣기 위해 앞에 역슬래시를 쓰는 표기입니다.",
          detail: ["소스의 \\'는 런타임 값에서 작은따옴표 한 문자입니다.", "repr은 필요에 따라 따옴표 또는 역슬래시를 다시 escape해 재현 가능한 표현을 보여 줍니다."],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "SyntaxError: unterminated string literal가 따옴표가 든 문장 줄에서 발생한다.",
          likelyCause: "바깥 delimiter와 같은 따옴표를 내용에서 escape하지 않아 문자열이 예상보다 일찍 끝났습니다.",
          checks: ["오류 줄의 시작 따옴표 종류를 확인합니다.", "문장 내부에 같은 종류의 escape되지 않은 따옴표가 있는지 찾습니다.", "에디터의 문자열 색상이 어느 지점에서 끊기는지 확인합니다."],
          fix: "바깥 따옴표 종류를 바꾸거나 내부 따옴표 앞에 역슬래시를 사용합니다.",
          prevention: "내용에 가장 적은 escape가 필요한 따옴표를 선택하고 formatter와 문법 강조를 사용합니다.",
        },
      ],
    },
    {
      id: "escape-sequences",
      title: "escape sequence는 소스의 두 글자를 값의 한 문자로 해석할 수 있습니다",
      lead: "역슬래시는 출력 장식이 아니라 다음 문자와 함께 특별한 의미를 만드는 lexical 표기입니다. 실제 값은 print와 repr을 함께 봐야 정확합니다.",
      explanations: [
        "일반 문자열에서 \\n은 줄바꿈 문자, \\t는 탭 문자, \\\\는 역슬래시 한 문자, \\'와 \\\"는 따옴표 문자로 해석됩니다. 소스에서 \\와 n 두 문자를 보아도 런타임 str에는 줄바꿈 문자 하나가 들어갑니다. len('A\\nB')가 3인 이유는 A, 줄바꿈, B 세 문자이기 때문입니다.",
        "print는 제어문자를 동작으로 보여 줍니다. 줄바꿈은 실제 줄을 바꾸고 탭은 다음 탭 위치로 이동합니다. repr은 줄바꿈을 다시 \\n처럼 escape된 표현으로 보여 주므로 눈에 보이지 않는 문자와 뒤쪽 공백을 진단하기 좋습니다. 출력이 이상할 때 print만 반복하기보다 repr을 함께 사용합니다.",
        "역슬래시 자체가 필요한 Windows 경로에서는 일반 문자열에 역슬래시를 두 번 적어야 합니다. 소스의 \"C:\\\\new\\\\test\"가 만드는 실제 값은 C:\\new\\test입니다. 만약 \"C:\\new\\test\"처럼 적으면 \\n이 줄바꿈, \\t가 탭으로 해석되어 경로가 조용히 다른 값이 됩니다. 특히 C:\\Users는 \\U Unicode escape 시작으로 해석되어 SyntaxError가 날 수 있습니다.",
        "인식되지 않는 escape에 기대는 것도 피합니다. 현재 버전에서 경고가 나거나 미래 버전에서 동작이 엄격해질 수 있습니다. 역슬래시를 문자로 원하면 일반 문자열에서 \\\\로 명시하거나 raw string을 목적에 맞게 선택합니다.",
      ],
      concepts: [
        {
          term: "escape sequence",
          definition: "역슬래시와 뒤 문자를 조합해 직접 적기 어렵거나 제어 기능이 있는 문자를 표현하는 소스 표기입니다.",
          detail: ["\\n·\\t는 제어문자, \\\\는 역슬래시, \\'·\\\"는 따옴표를 표현합니다.", "\\xhh·\\uhhhh·\\Uhhhhhhhh·\\N{name}는 코드값이나 Unicode 이름으로 문자를 표현할 수 있습니다."],
          caveat: "문자열 리터럴 escape는 HTML, SQL, 셸, URL 문맥의 보안 escaping과 전혀 다른 문제입니다.",
        },
        {
          term: "repr()",
          definition: "객체를 가능하면 모호하지 않고 재현 가능한 개발자용 표현으로 보여 주는 내장 함수입니다.",
          detail: ["str의 줄바꿈·탭·역슬래시는 repr에서 escape 표기로 보입니다.", "print(value)는 사용자 친화 표현, print(repr(value))는 내부 문자 진단에 유용합니다."],
        },
      ],
      codeExamples: [
        {
          id: "python-quotes-and-escapes",
          title: "따옴표 선택과 제어문자를 print·repr로 비교하기",
          language: "python",
          filename: "quotes_and_escapes.py",
          purpose: "원본의 따옴표·escape 예제를 줄바꿈, 탭, 역슬래시 경로까지 확장해 소스 표기와 실제 출력의 차이를 관찰합니다.",
          code: `apostrophe = "I'm ready."
quotation = '그는 "준비"라고 말했다.'
layout = "첫째 줄\\n둘째 줄\\t(탭 뒤)"
windows_path = "C:\\\\new\\\\test"

print(apostrophe)
print(quotation)
print(layout)
print(repr(windows_path))`,
          walkthrough: [
            { lines: "1", explanation: "내용에 작은따옴표가 있어 바깥을 큰따옴표로 선택했습니다. escape가 필요 없습니다." },
            { lines: "2", explanation: "내용에 큰따옴표가 있어 바깥을 작은따옴표로 선택했습니다." },
            { lines: "3", explanation: "소스의 \\n과 \\t가 각각 실제 줄바꿈과 탭 문자로 해석됩니다." },
            { lines: "4", explanation: "일반 문자열에서 역슬래시 한 문자를 저장하려고 소스에는 역슬래시를 두 번씩 적었습니다." },
            { lines: "6-9", explanation: "print는 제어문자를 동작으로 보여 주고 repr은 경로의 역슬래시를 escape 표기로 드러냅니다." },
          ],
          run: {
            environment: ["Python 3.11 이상", "UTF-8로 저장한 quotes_and_escapes.py"],
            command: "python quotes_and_escapes.py",
          },
          output: {
            value: `I'm ready.
그는 "준비"라고 말했다.
첫째 줄
둘째 줄\t(탭 뒤)
'C:\\\\new\\\\test'`,
            explanation: [
              "첫 두 줄에는 바깥 delimiter가 출력되지 않고 내용 속 따옴표만 남습니다.",
              "layout의 \\n은 실제 줄 분리, \\t는 둘째 줄과 괄호 사이의 실제 탭으로 보입니다.",
              "마지막은 repr 결과이므로 실제 값의 각 역슬래시가 두 개의 소스 표기처럼 보입니다. 값에 역슬래시가 두 배로 저장됐다는 뜻은 아닙니다.",
            ],
          },
          experiments: [
            {
              change: "마지막 줄을 print(windows_path)로 바꿉니다.",
              prediction: "C:\\new\\test처럼 실제 역슬래시 한 개씩 보입니다.",
              result: "print는 문자열의 사용자용 내용을 내보내므로 repr에서 보이던 추가 escape가 사라집니다.",
            },
            {
              change: "windows_path를 \"C:\\new\\test\"로 잘못 줄여 적습니다.",
              prediction: "\\n은 줄바꿈, \\t는 탭이 되어 한 줄 경로로 출력되지 않습니다.",
              result: "C: 뒤에서 줄이 바뀌고 est 앞에는 탭이 적용됩니다. 문법 오류 없이 잘못된 값이 만들어질 수 있어 repr 검사가 중요합니다.",
            },
          ],
          sourceRefs: ["py-day02-ex01", "py-day02-note", "python-lexical-doc"],
        },
      ],
      diagnostics: [
        {
          symptom: "Windows 경로를 출력했더니 중간에서 줄이 바뀌거나 글자가 탭처럼 벌어진다.",
          likelyCause: "일반 문자열의 \\n과 \\t가 경로 문자가 아니라 newline·tab escape로 해석됐습니다.",
          checks: ["print(repr(path))로 실제 저장 문자를 봅니다.", "소스의 역슬래시가 두 번씩 escape됐는지 확인합니다.", "경로를 직접 작성해야 하는지 pathlib로 조립할 수 있는지 확인합니다."],
          fix: "일반 문자열에서는 역슬래시를 \\\\로 쓰거나, 끝 역슬래시 제한을 이해한 raw string을 사용하거나, Path('C:/') / 'new' / 'test'처럼 pathlib로 구성합니다.",
          prevention: "경로는 문자열 이어 붙이기보다 pathlib를 사용하고 테스트에서 repr 또는 Path.parts를 확인합니다.",
        },
        {
          symptom: "SyntaxError: (unicode error) 'unicodeescape' ... truncated \\UXXXXXXXX escape가 C:\\Users 경로에서 발생한다.",
          likelyCause: "일반 문자열의 \\U가 8자리 Unicode escape 시작으로 해석됐지만 뒤 문자가 올바른 형식이 아닙니다.",
          checks: ["오류 줄에 C:\\Users 같은 직접 경로가 있는지 봅니다.", "문자열 접두사 r의 유무와 끝 역슬래시 여부를 확인합니다.", "모든 역슬래시가 일반 문자열에서 두 번 적혔는지 확인합니다."],
          fix: "'C:\\\\Users\\\\name'처럼 escape하거나 r'C:\\Users\\name'을 사용합니다. 실제 경로 조합에는 pathlib.Path를 우선합니다.",
          prevention: "Windows 경로를 코드에 하드코딩하지 않고 설정·환경에서 받아 Path로 즉시 변환합니다.",
        },
      ],
    },
    {
      id: "multiline-and-docstrings",
      title: "세 따옴표 문자열과 docstring은 위치가 역할을 가릅니다",
      lead: "세 따옴표는 여러 줄 str을 만드는 문법입니다. 그 문자열이 특정 코드 블록의 첫 문장이면 문서화 메타데이터로도 사용됩니다.",
      explanations: [
        "'''...'''와 \"\"\"...\"\"\"는 실제 줄바꿈을 포함한 문자열 리터럴을 만들 수 있습니다. 시작 delimiter 다음 줄부터 쓰면 그 첫 줄바꿈도 값에 포함될 수 있고, 들여쓴 코드 안에 쓰면 각 줄의 들여쓰기 공백도 값에 들어갑니다. 예상 출력과 다르면 repr을 사용해 선행·후행 newline과 공백을 확인합니다.",
        "함수, 클래스 또는 모듈 본문의 첫 문장이 문자열 리터럴이면 Python은 그 값을 __doc__에 저장해 문서화 문자열로 사용합니다. 같은 세 따옴표 문자열을 변수에 대입하면 그냥 여러 줄 str입니다. 함수 중간에 아무 이름에도 대입하지 않고 둔 문자열은 일반 표현식 문장일 뿐 해당 함수의 docstring이 되지 않습니다.",
        "docstring은 주석과 다릅니다. 주석은 토큰화 과정에서 실행 객체로 남지 않지만 docstring은 런타임에서 __doc__으로 조회되고 help, IDE, 문서 생성기가 활용할 수 있습니다. 따라서 공개 API의 목적, 인수, 반환, 예외를 문서화하는 데 쓰고 임시로 코드 블록을 끄는 수단으로 남용하지 않습니다.",
        "여러 줄 사용자 메시지를 코드 들여쓰기와 함께 쓰면 불필요한 공백이 들어갈 수 있습니다. textwrap.dedent로 공통 들여쓰기를 제거하거나 문자열을 괄호 안 인접 리터럴로 나누어 소스 가독성과 실제 값을 분리합니다. HTML·SQL을 긴 문자열로 직접 조립하는 경우에는 전용 템플릿·파라미터 API가 더 안전합니다.",
      ],
      concepts: [
        {
          term: "triple-quoted string",
          definition: "세 개의 작은따옴표 또는 큰따옴표로 경계를 표시해 실제 줄바꿈을 포함할 수 있는 문자열 리터럴입니다.",
          detail: ["세 따옴표 안에서도 일반 문자열 escape는 처리됩니다. raw 접두사를 붙인 경우에만 raw 규칙이 적용됩니다.", "값에 포함된 첫·마지막 줄바꿈과 들여쓰기를 repr로 확인해야 합니다."],
        },
        {
          term: "docstring",
          definition: "모듈·함수·클래스 본문의 첫 문장에 놓여 __doc__으로 사용되는 문자열 리터럴입니다.",
          detail: ["보통 관례상 세 큰따옴표를 사용하지만 한 줄 문자열 리터럴도 위치 조건을 만족하면 docstring이 될 수 있습니다.", "help와 문서 도구가 읽는 런타임 메타데이터입니다."],
          caveat: "세 따옴표를 사용했다는 사실만으로 docstring이 되지 않습니다. 위치가 핵심입니다.",
        },
      ],
      codeExamples: [
        {
          id: "python-multiline-docstring-immutability",
          title: "일반 여러 줄 값·docstring·불변 문자열을 한 번에 구분하기",
          language: "python",
          filename: "multiline_and_docstring.py",
          purpose: "세 따옴표의 두 역할과 str 불변성 때문에 수정 대신 새 문자열을 만드는 패턴을 정확한 출력으로 확인합니다.",
          code: `def guide():
    """한 줄 문서화 문자열."""
    return "파이썬"

text = "Hello"
updated = "K" + text[1:]
multiline = """첫째
둘째"""

print(text)
print(updated)
print(guide.__doc__)
print(type(guide.__doc__).__name__)
print(repr(multiline))`,
          walkthrough: [
            { lines: "1-3", explanation: "함수 첫 문장의 문자열이 guide.__doc__에 저장됩니다. return 문자열과는 별도 객체·역할입니다." },
            { lines: "5-6", explanation: "text[0]을 직접 바꾸지 않고 슬라이스 text[1:]와 'K'를 연결해 새 str updated를 만듭니다." },
            { lines: "7-8", explanation: "세 따옴표로 실제 newline 한 문자를 포함한 일반 str을 만듭니다. 변수에 대입됐으므로 docstring이 아닙니다." },
            { lines: "10-14", explanation: "원본·새 문자열, docstring 값과 타입, 여러 줄 문자열의 repr을 차례로 관찰합니다." },
          ],
          run: {
            environment: ["Python 3.11 이상", "UTF-8로 저장한 multiline_and_docstring.py"],
            command: "python multiline_and_docstring.py",
          },
          output: {
            value: `Hello
Kello
한 줄 문서화 문자열.
str
'첫째\\n둘째'`,
            explanation: [
              "Hello가 그대로 남고 새 문자열 Kello가 따로 출력되어 불변 객체를 수정한 것이 아님을 보여 줍니다.",
              "guide.__doc__은 실제 str이며 함수의 return 값 '파이썬'과 다릅니다.",
              "multiline의 repr에는 실제 줄바꿈 문자가 \\n으로 표시됩니다.",
            ],
          },
          experiments: [
            {
              change: "함수의 docstring 앞에 x = 1을 넣습니다.",
              prediction: "문자열이 함수 첫 문장이 아니게 되어 guide.__doc__은 None이 됩니다.",
              result: "type 이름을 출력하려면 NoneType이 나오며 문자열 문장은 문서화 메타데이터로 등록되지 않습니다.",
            },
            {
              change: "multiline 시작 delimiter 바로 뒤에 줄바꿈을 추가합니다.",
              prediction: "값의 첫 문자도 newline이 되어 repr이 '\\n첫째\\n둘째' 형태가 됩니다.",
              result: "소스 가독성을 위한 줄 배치도 실제 값에 포함되므로 출력 계약을 확인해야 합니다.",
            },
          ],
          sourceRefs: ["py-day02-ex01", "py-day02-note", "python-lexical-doc"],
        },
      ],
      diagnostics: [],
      expertNotes: [
        "docstring에 비밀·개인정보를 넣지 않습니다. 패키지 배포물과 help 출력에 포함될 수 있습니다.",
        "다국어 docstring도 가능하지만 공개 라이브러리는 팀의 문서 언어·스타일 계약을 정하고 API 변경과 함께 갱신합니다.",
      ],
    },
    {
      id: "raw-string-rules",
      title: "raw string은 역슬래시 해석을 억제하지만 아무 문자열이나 허용하지는 않습니다",
      lead: "r 접두사는 정규식과 경로를 읽기 쉽게 만들지만, 파서가 문자열 끝을 찾기 위한 최소 규칙까지 제거하지는 않습니다.",
      explanations: [
        "r'C:\\new\\test'처럼 문자열 앞에 r을 붙이면 \\n과 \\t를 줄바꿈·탭으로 바꾸지 않고 역슬래시와 문자 n·t를 그대로 보존합니다. 따라서 일반 문자열 \"C:\\\\new\\\\test\"와 raw string r\"C:\\new\\test\"는 같은 실제 문자 시퀀스를 만들 수 있습니다. raw가 값에 특별한 경로 타입을 만드는 것이 아니라 리터럴 해석 방식을 바꿀 뿐입니다.",
        "raw string에서도 바깥 delimiter를 알아야 문자열 끝을 찾을 수 있습니다. delimiter 앞의 역슬래시는 따옴표를 escape된 것으로 보게 하며 그 역슬래시도 값에 남습니다. 이 때문에 raw string은 홀수 개의 역슬래시로 끝날 수 없습니다. r'C:\\temp\\'는 마지막 역슬래시가 닫는 따옴표를 escape해 리터럴이 끝나지 않은 것으로 해석되어 SyntaxError가 납니다.",
        "끝 역슬래시가 필요한 값은 일반 문자열 'C:\\\\temp\\\\'를 쓰거나 r'C:\\temp' + '\\\\'처럼 두 리터럴을 조합합니다. 경로 목적이라면 Path('C:/temp') 같은 pathlib 객체를 사용하고 문자열 표시가 꼭 필요한 경계에서 str(path)로 변환하는 편이 운영체제별 구분자 처리를 명확히 합니다.",
        "raw string은 \\uD55C 같은 Unicode escape도 문자 변환하지 않습니다. 일반 문자열 '\\uD55C'은 한으로 해석되지만 raw 문자열 r'\\uD55C'은 역슬래시, u, D, 5, 5, C 문자를 보존합니다. 이미 만들어진 외부 문자열에 r을 나중에 적용할 수는 없습니다. r은 런타임 함수가 아니라 소스 리터럴 접두사입니다.",
      ],
      concepts: [
        {
          term: "raw string literal",
          definition: "r 또는 R 접두사로 escape sequence 변환을 대부분 억제하는 문자열 리터럴 표기입니다.",
          detail: ["정규식 패턴과 역슬래시가 많은 고정 텍스트를 읽기 쉽게 합니다.", "결과는 여전히 평범한 str 객체이며 OS 경로 검증·정규식 안전·보안 처리를 자동 제공하지 않습니다."],
          caveat: "홀수 개 역슬래시로 끝날 수 없고 delimiter 관련 lexical 규칙은 남습니다.",
        },
        {
          term: "odd trailing backslash",
          definition: "닫는 따옴표 바로 앞에 홀수 개의 연속 역슬래시가 있어 마지막 역슬래시가 delimiter를 escape하는 상태입니다.",
          detail: ["raw string도 이 상태에서는 닫는 따옴표를 문자열 끝으로 인식하지 못합니다.", "짝수 개라면 마지막 delimiter가 정상적으로 문자열을 닫을 수 있습니다."],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "r'C:\\temp\\'처럼 raw 경로를 적었더니 SyntaxError: unterminated string literal가 발생한다.",
          likelyCause: "raw string이 홀수 개의 역슬래시로 끝나 마지막 역슬래시가 닫는 따옴표를 escape했습니다.",
          checks: ["닫는 따옴표 직전 연속 역슬래시 개수를 셉니다.", "raw 접두사가 있어 모든 문법 규칙이 사라진다고 오해했는지 확인합니다.", "실제로 디렉터리 구분자로 끝나는 문자열이 필요한지 확인합니다."],
          fix: "일반 문자열 'C:\\\\temp\\\\'를 쓰거나 r'C:\\temp' + '\\\\'로 끝 문자를 별도 추가합니다. 경로 연산은 pathlib.Path로 바꿉니다.",
          prevention: "raw string의 끝 역슬래시 제한을 테스트에 포함하고 경로를 수동 문자열 연결하지 않습니다.",
        },
        {
          symptom: "raw = r'\\n'을 출력했는데 줄이 바뀌지 않아 raw가 고장났다고 생각한다.",
          likelyCause: "raw string의 목적 자체가 \\n escape 변환을 억제하고 역슬래시와 n을 보존하는 것입니다.",
          checks: ["print(repr(raw))와 len(raw)를 확인합니다.", "실제 newline이 필요한지 문자 두 개가 필요한지 요구를 구분합니다.", "일반 문자열 '\\n'과 결과를 나란히 비교합니다."],
          fix: "실제 newline이 필요하면 일반 문자열 '\\n'을 사용합니다. 문자 그대로 \\n이 필요하면 raw string을 유지합니다.",
          prevention: "소스 표기와 목표 런타임 문자 시퀀스를 먼저 적고 리터럴 방식을 선택합니다.",
        },
      ],
    },
    {
      id: "paths-regex-unicode",
      title: "경로·정규식·Unicode는 역슬래시를 서로 다른 언어로 사용합니다",
      lead: "raw string은 표기를 단순화할 뿐입니다. 그 문자열을 소비하는 pathlib·정규식 엔진·Unicode 해석기의 규칙은 각각 별도로 적용됩니다.",
      explanations: [
        "Windows 경로는 역슬래시를 구분자로 쓰지만 Python 문자열 파서는 먼저 escape를 해석합니다. raw string으로 고정 경로를 적을 수 있어도 사용자 홈, 운영체제 차이, 상위 경로 이동을 직접 문자열 연결로 처리하면 오류와 보안 위험이 커집니다. Path.home() / 'study' / 'note.txt'처럼 pathlib의 / 연산자로 경로 구성 요소를 결합하면 의도가 분명하고 테스트가 쉽습니다.",
        "정규식도 역슬래시를 메타문자에 사용합니다. Python 문자열 파서와 정규식 파서라는 두 단계가 있으므로 일반 문자열 '\\\\d+'는 정규식 엔진에 \\d+를 전달하지만 raw string r'\\d+'는 같은 패턴을 더 읽기 쉽게 표현합니다. 그러나 raw string이 사용자 입력을 안전한 리터럴 패턴으로 만들어 주지는 않습니다. 사용자가 입력한 점·별표·괄호를 문자 그대로 찾으려면 re.escape를 사용합니다.",
        "Unicode escape는 소스에 직접 쓰기 어려운 문자를 코드값으로 표현합니다. 일반 문자열에서 \\uD55C\\uAE00은 한글로, raw string에서 같은 표기는 역슬래시가 포함된 텍스트로 남습니다. 직접 한글을 UTF-8 소스에 쓰는 것이 읽기 쉬운 경우가 많고, 보이지 않는 제어문자나 특정 코드 포인트를 명확히 해야 할 때 escape가 유용합니다.",
        "str의 len은 Unicode 코드 포인트 수를 세는 관점에 가깝고 사용자가 보는 글자 묶음 수와 다를 수 있습니다. 한글 두 음절 '한글'은 len 2지만 결합 문자와 ZWJ 이모지는 화면 한 글자가 여러 코드 포인트일 수 있습니다. 사용자 이름 길이 제한 같은 정책을 단순 len 하나로 국제화 요구에 적용하지 않습니다.",
      ],
      concepts: [
        {
          term: "이중 해석",
          definition: "문자열 리터럴을 Python 파서가 먼저 해석하고, 만들어진 str을 정규식·경로·SQL 같은 소비자가 다시 자기 문법으로 해석하는 과정입니다.",
          detail: ["raw string은 첫 단계의 역슬래시 처리를 줄입니다.", "두 번째 소비자 문법의 메타문자·보안 규칙은 그대로 남습니다."],
        },
        {
          term: "Unicode escape",
          definition: "\\u·\\U·\\N 표기로 Unicode 문자를 소스에 표현하는 escape입니다.",
          detail: ["일반 str 리터럴에서 해석됩니다.", "raw str 리터럴에서는 escape 변환되지 않고 표기 문자가 남습니다."],
        },
      ],
      codeExamples: [
        {
          id: "python-raw-regex-unicode",
          title: "일반 경로·raw 경로·정규식·Unicode를 비교하기",
          language: "python",
          filename: "raw_regex_unicode.py",
          purpose: "raw string이 만드는 실제 값과 정규식·Unicode에서 다음 해석 단계가 어떻게 달라지는지 하나의 재현 가능한 출력으로 확인합니다.",
          code: `from re import fullmatch

normal_path = "C:\\\\new\\\\test"
raw_path = r"C:\\new\\test"
pattern = r"\\d{4}-\\d{2}-\\d{2}"
escaped_unicode = "\\uD55C\\uAE00"
raw_unicode = r"\\uD55C\\uAE00"

print(normal_path == raw_path)
print(repr(raw_path))
print(bool(fullmatch(pattern, "2026-07-11")))
print(escaped_unicode)
print(raw_unicode)`,
          walkthrough: [
            { lines: "1", explanation: "정규식 전체 일치를 검사하는 fullmatch를 가져옵니다." },
            { lines: "3-4", explanation: "일반 문자열은 역슬래시를 두 번, raw 문자열은 한 번 적었지만 둘 다 같은 실제 경로 문자 시퀀스를 만듭니다." },
            { lines: "5", explanation: "raw 표기는 Python 파서가 \\d를 변환하지 않게 하고 정규식 엔진이 숫자 메타패턴으로 해석하게 합니다." },
            { lines: "6-7", explanation: "일반 문자열의 Unicode escape는 두 한글 문자로, raw 문자열은 escape 표기 자체로 남습니다." },
            { lines: "9-13", explanation: "값 동등성, 내부 역슬래시, 정규식 결과, Unicode 변환 여부를 차례로 출력합니다." },
          ],
          run: {
            environment: ["Python 3.11 이상", "UTF-8로 저장한 raw_regex_unicode.py"],
            command: "python raw_regex_unicode.py",
          },
          output: {
            value: `True
'C:\\\\new\\\\test'
True
한글
\\uD55C\\uAE00`,
            explanation: [
              "첫 True는 서로 다른 소스 표기가 같은 str 값을 만들었음을 뜻합니다.",
              "repr은 실제 값의 역슬래시를 escape해 두 개처럼 표시합니다.",
              "날짜 문자열 전체가 정규식의 네 자리-두 자리-두 자리 규칙과 맞아 True입니다.",
              "일반 Unicode escape는 한글로 변환되고 raw Unicode 표기는 문자 그대로 출력됩니다.",
            ],
          },
          experiments: [
            {
              change: "날짜 입력을 '26-7-11'로 바꿉니다.",
              prediction: "각 자리 수가 패턴과 달라 False가 출력됩니다.",
              result: "fullmatch는 문자열 전체가 정확한 자리 수와 구분자 규칙을 만족할 때만 성공합니다.",
            },
            {
              change: "print(len(escaped_unicode), len(raw_unicode))를 추가합니다.",
              prediction: "2와 12가 출력됩니다.",
              result: "escaped_unicode는 한글 두 코드 포인트, raw_unicode는 역슬래시·u·16진 문자로 이뤄진 열두 문자입니다.",
            },
          ],
          sourceRefs: ["py-day02-ex01", "py-day02-note", "python-lexical-doc", "python-pathlib-doc"],
        },
      ],
      diagnostics: [
        {
          symptom: "사용자가 입력한 '.'을 찾는 정규식이 모든 문자를 일치시키는 등 예상보다 넓게 동작한다.",
          likelyCause: "raw string이 정규식 메타문자를 일반 문자로 바꿔 준다고 오해했습니다. 점은 정규식 엔진에서 임의 한 문자를 뜻합니다.",
          checks: ["실제로 정규식 문법을 의도했는지 문자 그대로 검색할지 결정합니다.", "print(repr(pattern))으로 엔진에 전달되는 값을 봅니다.", "사용자 입력 부분에 re.escape를 적용했는지 확인합니다."],
          fix: "사용자 입력을 문자 그대로 찾으려면 re.escape(user_text)로 패턴 조각을 만들고, 애플리케이션이 정한 정규식 구조와 분리합니다.",
          prevention: "raw string을 보안 함수로 설명하지 않고 Python 리터럴 단계와 정규식 단계의 책임을 문서화합니다.",
        },
      ],
      comparisons: [
        {
          title: "역슬래시가 많은 값을 어떤 방식으로 표현할까요?",
          options: [
            { name: "일반 문자열+escape", chooseWhen: "줄바꿈·탭·Unicode 문자를 실제 값으로 넣거나 끝 역슬래시가 필요할 때", avoidWhen: "정규식처럼 역슬래시가 너무 많아 가독성이 크게 떨어질 때", tradeoffs: ["모든 escape 규칙을 명시적으로 사용할 수 있습니다.", "경로·정규식에서는 역슬래시가 중복돼 읽기 어려울 수 있습니다."] },
            { name: "raw string", chooseWhen: "고정 정규식이나 끝이 역슬래시가 아닌 역슬래시 많은 텍스트", avoidWhen: "홀수 역슬래시로 끝나거나 실제 newline·Unicode escape 변환이 필요할 때", tradeoffs: ["소스와 소비자 문법이 더 비슷해집니다.", "여전히 str이며 소비자 문법·보안을 해결하지 않습니다."] },
            { name: "pathlib.Path", chooseWhen: "파일 시스템 경로를 구성·검증·탐색할 때", avoidWhen: "정규식이나 일반 텍스트처럼 파일 경로가 아닌 값", tradeoffs: ["운영체제 구분자와 경로 연산 의도가 명확합니다.", "외부 API가 문자열만 받으면 경계에서 변환해야 합니다."] },
          ],
        },
      ],
      expertNotes: [
        "불신 경로는 resolve 후 허용된 기준 디렉터리 내부인지 확인해 .. 경로 traversal을 막습니다. raw 여부와 무관합니다.",
        "정규식에 불신 패턴 전체를 허용하면 ReDoS 위험이 생길 수 있습니다. 길이·기능 제한과 시간 제한 가능한 엔진을 검토합니다.",
      ],
    },
    {
      id: "string-immutability",
      title: "str 불변성은 수정 대신 새 문자열과 재바인딩을 만듭니다",
      lead: "문자열은 문자 시퀀스지만 list처럼 특정 위치에 새 값을 대입할 수 없습니다. 연결·반복·슬라이싱도 결과 문자열을 새로 만듭니다.",
      explanations: [
        "text = 'Hello' 뒤 text[0] = 'K'를 실행하면 TypeError가 발생합니다. str 객체는 생성 후 내부 문자 시퀀스를 그 자리에서 바꿀 수 없는 불변 타입이기 때문입니다. 'K' + text[1:]처럼 원하는 새 str을 만들고 text 또는 다른 이름에 바인딩해야 합니다. 원래 객체를 다른 이름이 가리키고 있다면 그 값은 변하지 않습니다.",
        "원본의 '@' + '@'는 새 문자열 '@@', '@' * 5는 새 문자열 '@@@@@'를 만듭니다. in과 not in은 객체를 바꾸지 않고 포함 여부 bool을 반환합니다. 대소문자를 구분하므로 'H'와 'llo'는 'Hello'에 있지만 'hello'는 없습니다. 이 결과는 원본 실행에서 True, True, False, True, False 순으로 확인됩니다.",
        "짧은 문자열 몇 개를 연결하는 +는 명확합니다. 많은 조각을 반복문에서 계속 +하면 매번 새 문자열을 만들 수 있어 비용이 커질 수 있습니다. 조각을 list에 모은 뒤 ''.join(parts)를 사용하는 방식이 의도와 성능에 유리한 경우가 많습니다. 최적화는 실제 크기와 프로파일링을 기준으로 하되 불변성 때문에 새 결과가 생긴다는 모델은 유지합니다.",
        "불변성은 문자열을 dict 키로 쓰고 여러 코드가 공유해도 한쪽에서 내용이 몰래 변하지 않는 장점이 있습니다. 그러나 이름 재바인딩은 언제든 가능합니다. text = text.replace('H', 'K')는 기존 str을 수정한 것이 아니라 replace가 반환한 새 str을 text 이름에 다시 연결한 것입니다.",
      ],
      concepts: [
        {
          term: "불변성(immutability)",
          definition: "객체가 생성된 뒤 그 객체 내부 값을 제자리에서 변경할 수 없는 성질입니다.",
          detail: ["str 인덱스 대입은 지원되지 않습니다.", "연결, 반복, replace, upper 같은 연산은 결과가 같아 보이는 경우에도 개념상 새 str 값을 반환합니다."],
          caveat: "이름 재바인딩이 가능하다는 사실과 객체가 불변이라는 사실은 모순이 아닙니다.",
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "TypeError: 'str' object does not support item assignment가 text[0] = 'K'에서 발생한다.",
          likelyCause: "str을 변경 가능한 문자 배열처럼 취급했습니다.",
          checks: ["type(text)가 str인지 확인합니다.", "원하는 변경이 한 위치 교체인지 전체 규칙 치환인지 정합니다.", "원본 문자열을 보존해야 하는지 확인합니다."],
          fix: "'K' + text[1:] 또는 text.replace('H', 'K', 1)로 새 문자열을 만들고 새 이름 또는 기존 이름에 재바인딩합니다.",
          prevention: "문자열 메서드와 연산자가 새 결과를 반환한다는 사실을 코드 리뷰와 테스트에서 확인합니다.",
        },
      ],
      expertNotes: [
        "불변 객체는 해시 가능성과 안전한 공유에 유리하지만, 대규모 텍스트 편집에는 전용 버퍼·조각 리스트·스트리밍 처리가 적합할 수 있습니다.",
        "문자열 interning 같은 구현 최적화를 is 기반 값 비교에 이용하지 않습니다. 문자열 값 비교는 ==를 사용합니다.",
      ],
    },
    {
      id: "security-encoding-boundaries",
      title: "문자열 표기와 보안 escaping·인코딩 경계를 혼동하지 않습니다",
      lead: "역슬래시를 올바르게 썼다는 사실은 그 문자열이 SQL, HTML, 셸, URL, 정규식에서 안전하다는 뜻이 아닙니다.",
      explanations: [
        "Python 리터럴 escape는 소스 파일을 파싱해 str 객체를 만드는 규칙입니다. SQL injection은 SQL 파서, XSS는 HTML·JavaScript 파서, 셸 injection은 명령 셸, URL 인코딩은 URL 구성요소 규칙의 문제입니다. 각 문맥은 전용 API를 사용해야 합니다. SQL에는 파라미터 바인딩, HTML에는 템플릿의 컨텍스트 escaping, 셸에는 인수 배열과 shell=False, URL에는 urllib.parse 같은 구성요소 인코딩을 사용합니다.",
        "raw string은 신뢰 표시가 아닙니다. r 접두사를 붙여도 사용자 입력의 .. 경로, 정규식 메타문자, HTML 태그, SQL 따옴표가 안전해지지 않습니다. raw는 오직 소스 코드에서 역슬래시 해석을 줄이는 표기입니다. 외부 입력은 데이터 경계에서 길이, 허용 형식, 정규화와 권한을 검증합니다.",
        "str과 bytes를 구분해야 파일·네트워크 문자 깨짐을 진단할 수 있습니다. text.encode('utf-8')는 str을 bytes로, data.decode('utf-8')는 bytes를 str로 바꿉니다. 잘못된 codec을 쓰면 UnicodeDecodeError가 발생하거나 잘못된 문자가 만들어질 수 있습니다. 오류를 무조건 ignore하면 데이터 손실과 보안 검증 우회를 숨길 수 있습니다.",
        "로그에는 repr가 유용하지만 비밀번호, 토큰, 주민번호처럼 민감한 값까지 정확히 노출할 수 있습니다. 운영 로그는 구조화된 필드와 마스킹 정책을 사용하고, 줄바꿈 같은 제어문자가 로그 구조를 속이지 않도록 신뢰하지 않는 입력을 정규화하거나 안전한 직렬화 형식으로 기록합니다.",
      ],
      concepts: [
        {
          term: "문맥별 escaping",
          definition: "같은 문자라도 HTML·SQL·셸·URL 등 소비자 문법에 맞게 안전하게 표현하는 처리입니다.",
          detail: ["한 문맥의 escape 함수를 다른 문맥에 재사용하면 안전하지 않습니다.", "가능하면 문자열 조립 대신 구조화·파라미터 API를 사용합니다."],
        },
        {
          term: "encode/decode 경계",
          definition: "Unicode str과 바이트 시퀀스 bytes 사이를 문자 인코딩 규칙으로 변환하는 지점입니다.",
          detail: ["encode는 str→bytes, decode는 bytes→str입니다.", "양쪽이 같은 codec 계약을 써야 원래 텍스트를 복원할 수 있습니다."],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "파일을 읽었더니 UnicodeDecodeError가 발생하거나 한글이 깨진다.",
          likelyCause: "실제 파일 bytes 인코딩과 decode에 선택한 codec이 다릅니다. 문자열 따옴표나 raw 접두사 문제는 아닙니다.",
          checks: ["파일 생성 주체와 명세에서 실제 인코딩을 확인합니다.", "open(..., encoding='utf-8')처럼 명시했는지 봅니다.", "일부 bytes를 무작정 str(data)로 감싸지 않았는지 확인합니다."],
          fix: "데이터의 실제 codec으로 decode하고 생성·저장 단계도 같은 UTF-8 계약으로 통일합니다. 손실 허용 정책 없이는 errors='ignore'를 쓰지 않습니다.",
          prevention: "파일·HTTP Content-Type·DB 연결에서 인코딩을 명시하고 한글·이모지 왕복 테스트를 둡니다.",
        },
      ],
      expertNotes: [
        "Unicode 정규화가 다른 두 문자열은 화면상 같아도 ==가 False일 수 있습니다. 사용자 식별자 비교에는 정책에 맞는 unicodedata.normalize를 검토합니다.",
        "보안 필터 전에 decode·정규화 순서를 명시해 중복 인코딩과 우회 문제를 줄입니다.",
      ],
    },
    {
      id: "independent-checkpoint",
      title: "새 문자열을 만나면 표기→값→소비자 순서로 검증합니다",
      lead: "따옴표 암기가 아니라 어떤 파서가 어느 단계에서 역슬래시와 문자를 해석하는지 설명할 수 있어야 합니다.",
      explanations: [
        "첫째, 소스 리터럴 표기를 봅니다. delimiter 종류, r 접두사, 세 따옴표, escape를 확인합니다. 둘째, Python 파서가 만든 실제 str 값을 repr과 len으로 예측합니다. 셋째, print·정규식·pathlib·파일 인코더 같은 소비자가 그 str을 어떻게 해석할지 따로 봅니다. 이 세 단계를 섞지 않으면 raw string이 정규식 보안이나 경로 검증을 해 준다는 오해를 피할 수 있습니다.",
        "문자열 안 따옴표는 바깥 delimiter를 바꾸거나 escape합니다. 여러 줄 값은 세 따옴표를 쓰되 첫·마지막 newline과 들여쓰기를 확인합니다. docstring은 세 따옴표 모양이 아니라 코드 블록 첫 문장이라는 위치로 결정합니다. raw string은 역슬래시를 보존하지만 홀수 역슬래시로 끝날 수 없습니다.",
        "str은 불변이므로 문자 위치에 대입하지 않고 새 문자열을 만들어 재바인딩합니다. 많은 조각은 join을 검토합니다. 외부 bytes에는 인코딩을 명시하고, SQL·HTML·셸·정규식에는 각 문맥의 구조화 API를 사용합니다. 이 기준을 새 예제에 적용해 소스·repr·출력을 모두 설명할 수 있으면 다음 문자열 인덱싱·메서드 세션으로 넘어갈 준비가 됐습니다.",
      ],
      concepts: [],
      codeExamples: [],
      diagnostics: [],
      expertNotes: [
        "코드 리뷰에서는 불필요한 역슬래시 수만 보는 것이 아니라 그 문자열의 다음 소비자가 누구인지 확인합니다.",
        "테스트에는 정상 문자열뿐 아니라 빈 문자열, 끝 역슬래시, newline·tab, 한글·이모지, 정규식 메타문자와 경로 traversal 입력을 포함합니다.",
      ],
    },
  ],
  lab: {
    title: "문자열 표기 실험실: 소스·repr·소비자 결과표",
    scenario: "Windows 학습자료 경로, 날짜 정규식, 한글 안내문을 일반 문자열과 raw string으로 표현하고 각 단계의 실제 값을 검증하는 작은 진단 프로그램을 만듭니다.",
    setup: [
      "Python 3.11 이상에서 string_lab.py를 UTF-8로 만듭니다.",
      "표의 열을 이름, 소스 표기, repr 결과, len, 최종 소비자 결과로 준비합니다.",
      "개인 실제 경로 대신 C:\\study\\python 같은 예시 경로만 사용합니다.",
    ],
    steps: [
      "일반 문자열 \"C:\\\\study\\\\python\"과 raw 문자열 r\"C:\\study\\python\"을 만들고 ==, repr, len을 비교합니다.",
      "newline = '첫째\\n둘째'와 raw_newline = r'첫째\\n둘째'를 만들고 print·repr·len을 각각 기록합니다.",
      "날짜 패턴 r'\\d{4}-\\d{2}-\\d{2}'로 정상·비정상 날짜 형식에 fullmatch를 실행합니다.",
      "일반 Unicode escape '\\uD55C\\uAE00'과 raw 표기를 출력하고 길이를 비교합니다.",
      "함수 첫 문장에 docstring을 두고 __doc__을 확인한 뒤, 같은 세 따옴표를 변수에 대입해 역할을 비교합니다.",
      "text[0] = 'K' 실패를 재현하고 슬라이싱+연결로 새 문자열을 만드는 수정 결과를 보존합니다.",
      "raw string 끝 역슬래시 실패 코드는 별도 broken_raw.py에 작성해 traceback을 기록한 뒤 정상 파일과 분리합니다.",
    ],
    expectedResult: [
      "일반 escape 경로와 raw 경로가 같은 str 값임을 True로 확인합니다.",
      "일반 \\n은 실제 newline 한 문자, raw \\n은 역슬래시와 n 두 문자로 구분됩니다.",
      "정규식은 정확한 자리의 날짜만 일치하고 Unicode 일반·raw 표기의 출력과 길이가 다릅니다.",
      "docstring은 __doc__에 나타나고 일반 여러 줄 변수는 독립 str 값으로 남습니다.",
      "불변 문자열 인덱스 대입과 raw 끝 역슬래시의 서로 다른 오류 유형·발생 시점을 설명합니다.",
    ],
    cleanup: ["broken_raw.py는 의도적 실패 파일임을 이름과 README 메모로 표시합니다.", "실험 경로에 사용자 이름·토큰 등 민감 정보를 넣지 않습니다."],
    extensions: [
      "pathlib.Path로 같은 경로를 만들고 parts, name, suffix를 관찰합니다.",
      "사용자 검색어 '.', '*', '['를 re.escape한 패턴과 그대로 쓴 패턴으로 비교합니다.",
      "한글·이모지 문자열을 UTF-8로 encode한 bytes와 다시 decode한 str의 타입·길이·왕복 동등성을 기록합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "따옴표와 escape를 최소화해 세 문장을 만들고 print와 repr 차이를 기록하세요.",
      requirements: ["apostrophe가 있는 영어 문장, 큰따옴표가 있는 한국어 문장, newline·tab이 있는 문장을 각각 만듭니다.", "각 값의 type과 repr을 출력합니다.", "소스의 역슬래시 수와 런타임 문자 수를 설명합니다."],
      hints: ["내용에 작은따옴표가 있으면 바깥 큰따옴표를 먼저 고려하세요.", "보이지 않는 문자는 repr과 len으로 확인하세요."],
      expectedOutcome: "세 값이 모두 str이고 따옴표 선택·escape·print·repr의 역할 차이를 설명합니다.",
      solutionOutline: ["각 문장에 읽기 쉬운 delimiter를 고릅니다.", "newline과 tab은 일반 문자열 escape로 작성합니다.", "print(type(value), repr(value)) 결과표를 만듭니다."],
    },
    {
      difficulty: "응용",
      prompt: "일반 문자열과 raw string으로 같은 Windows 경로와 날짜 정규식을 표현하고 동등성과 실패 경계를 검증하세요.",
      requirements: ["두 경로의 ==와 repr을 비교합니다.", "정상·비정상 날짜를 fullmatch합니다.", "raw string이 홀수 역슬래시로 끝나는 SyntaxError와 수정법 두 가지를 기록합니다."],
      hints: ["일반 경로에서는 역슬래시를 두 번 적습니다.", "끝 역슬래시는 일반 escape 또는 raw 문자열 뒤 별도 '\\\\' 연결을 고려하세요."],
      expectedOutcome: "raw string의 장점과 정확한 한계를 코드·출력·SyntaxError로 설명합니다.",
      solutionOutline: ["같은 문자 시퀀스를 두 표기로 만듭니다.", "정규식 소비 단계를 분리합니다.", "의도적 실패 파일을 별도로 실행합니다."],
    },
    {
      difficulty: "설계",
      prompt: "사용자가 입력한 파일 이름과 검색어를 받아 기준 폴더 안 텍스트 파일을 찾는 안전한 입력 경계를 설계하세요.",
      requirements: ["pathlib로 기준 폴더와 파일 이름을 결합합니다.", "resolve 결과가 기준 폴더 안인지 검증하는 정책을 설명합니다.", "검색어를 문자 그대로 정규식에 넣을 때 re.escape를 사용합니다.", "UTF-8 decode 실패 정책과 로그 민감정보 마스킹을 포함합니다."],
      hints: ["raw string은 런타임 사용자 입력에 적용할 수 있는 함수가 아닙니다.", "경로 traversal과 정규식 메타문자는 서로 다른 소비자 문법의 문제입니다.", "errors='ignore'는 조용한 데이터 손실을 만들 수 있습니다."],
      expectedOutcome: "문자열 표기, 경로 권한, 정규식 안전, 인코딩, 로그가 분리된 구현 준비 설계가 완성됩니다.",
      solutionOutline: ["입력값을 str로 받고 길이·허용 문자를 검증합니다.", "Path.resolve와 relative_to 또는 is_relative_to로 기준 경계를 확인합니다.", "re.escape한 검색어로 패턴을 만듭니다.", "decode 오류와 사용자 메시지·내부 로그를 구분합니다."],
    },
  ],
  reviewQuestions: [
    { question: "'Hello'와 \"Hello\"는 타입이나 값이 다른가요?", answer: "아닙니다. 둘 다 같은 내용의 str 객체를 만들 수 있습니다. 따옴표 선택은 주로 내부 따옴표와 스타일에 따른 소스 가독성 문제입니다." },
    { question: "소스의 'A\\nB'는 런타임에서 몇 문자이며 print하면 어떻게 보이나요?", answer: "A, newline, B 세 문자입니다. print하면 A와 B가 서로 다른 줄에 보이고 repr은 'A\\nB'처럼 escape를 보여 줍니다." },
    { question: "세 따옴표 문자열은 언제 docstring이 되나요?", answer: "모듈·함수·클래스 본문의 첫 문장에 문자열 리터럴로 놓일 때 __doc__으로 사용됩니다. 변수에 대입한 세 따옴표 문자열은 일반 str입니다." },
    { question: "raw string은 역슬래시를 전혀 해석하지 않으므로 r'C:\\temp\\'도 가능한가요?", answer: "불가능합니다. 홀수 개의 끝 역슬래시가 닫는 따옴표를 escape해 리터럴이 끝나지 않으므로 SyntaxError가 발생합니다." },
    { question: "r'\\uD55C'과 '\\uD55C'의 차이는 무엇인가요?", answer: "raw 표기는 역슬래시·u·16진 문자 텍스트를 보존하고, 일반 문자열은 Unicode escape를 해석해 한 문자 '한'을 만듭니다." },
    { question: "raw string을 사용하면 사용자 정규식 입력이 안전해지나요?", answer: "아닙니다. raw는 소스 리터럴의 escape 처리만 바꿉니다. 사용자 입력을 문자 그대로 찾으려면 re.escape 등 정규식 단계의 처리가 필요합니다." },
    { question: "text[0] = 'K'가 실패하지만 text = 'K' + text[1:]은 가능한 이유는 무엇인가요?", answer: "str 객체는 불변이라 기존 문자를 제자리 수정할 수 없습니다. 두 번째 문장은 새 str을 만든 뒤 text 이름을 새 객체에 재바인딩합니다." },
    { question: "Python 문자열 escape와 HTML/SQL escaping은 같은 개념인가요?", answer: "아닙니다. Python escape는 소스에서 str을 만드는 규칙입니다. HTML·SQL은 각각의 소비자 문맥에 맞는 전용 escaping 또는 파라미터 API가 필요합니다." },
    { question: "str과 bytes의 경계에서 encode와 decode 방향은 무엇인가요?", answer: "str.encode(codec)은 bytes를 만들고 bytes.decode(codec)은 str을 만듭니다. 양쪽 codec 계약이 맞아야 텍스트가 보존됩니다." },
  ],
  completionChecklist: [
    "내용에 따라 작은따옴표와 큰따옴표를 선택하고 같은 delimiter를 escape할 수 있다.",
    "\\n·\\t·\\\\·따옴표 escape의 실제 값과 print·repr 결과를 예측할 수 있다.",
    "여러 줄 일반 문자열과 __doc__에 저장되는 docstring을 구분할 수 있다.",
    "일반 경로와 raw 경로가 같은 str 값을 만드는 예제를 작성할 수 있다.",
    "raw string이 홀수 역슬래시로 끝날 수 없는 이유와 해결법을 설명할 수 있다.",
    "정규식과 Unicode에서 Python 파서 뒤 두 번째 해석 단계를 구분할 수 있다.",
    "str 인덱스 대입 오류를 새 문자열 생성과 재바인딩으로 수정할 수 있다.",
    "pathlib·re.escape·encode/decode를 각각 어떤 경계에 쓰는지 말할 수 있다.",
    "문자열 리터럴 escape가 보안 escaping을 대신하지 않음을 설명할 수 있다.",
    "세 실행 예제를 직접 실행해 제시된 출력과 일치함을 확인했다.",
  ],
  nextSessions: [],
  sources: [
    {
      id: "py-day02-ex01",
      repository: "PYTHON-BASIC",
      path: "day02/ex01_string.py",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day02/ex01_string.py",
      usedFor: ["작은·큰따옴표", "따옴표 escape", "문자열 연결·반복", "in·not in", "type 출력"],
      evidence: "Python 3.13.9에서 원본을 직접 실행해 여섯 str 타입 출력, @@, @@@@@, 포함 검사 True·True·False·True·False를 순서대로 확인했습니다.",
    },
    {
      id: "py-day02-note",
      repository: "PYTHON-BASIC",
      path: "notes/day02_string_list_tuple.md",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day02_string_list_tuple.md",
      usedFor: ["문자열 표기·escape 표", "str 불변성", "==와 is 구분", "내장 str 이름 가림 주의", "문자열 연산"],
      evidence: "Day02 노트를 전부 읽고 문자열·리스트·튜플 범위 중 이번 원자 세션에 해당하는 표기, escape, 불변성, 연산, 이름 주의사항만 사용했습니다.",
    },
    {
      id: "python-lexical-doc",
      repository: "Python 3 Documentation",
      path: "reference/lexical_analysis.html#string-and-bytes-literals",
      publicUrl: "https://docs.python.org/3/reference/lexical_analysis.html#string-and-bytes-literals",
      usedFor: ["문자열 prefix", "escape sequence", "raw string 끝 역슬래시 제한", "Unicode escape"],
      evidence: "원본 학습자료에 없는 raw string의 정확한 lexical 한계와 escape 종류를 공식 언어 레퍼런스 범위로 보강했습니다.",
    },
    {
      id: "python-pathlib-doc",
      repository: "Python 3 Documentation",
      path: "library/pathlib.html",
      publicUrl: "https://docs.python.org/3/library/pathlib.html",
      usedFor: ["경로 문자열 대안", "운영체제별 경로 구성", "Path 객체 경계"],
      evidence: "raw 경로 문자열을 파일 시스템 경로 추상화로 오해하지 않도록 pathlib 선택 기준을 공식 라이브러리 범위로 보강했습니다.",
    },
  ],
  sourceCoverage: {
    filesRead: 2,
    filesUsed: 2,
    uncoveredNotes: [
      "주 원본 ex01_string.py는 raw string·Unicode·docstring 위치 규칙을 직접 실행하지 않아 공식 Python 레퍼런스로 정확한 한계와 버전 독립 규칙을 보강했습니다.",
      "노트의 인덱싱·슬라이싱·문자열 메서드 상세와 list·tuple 내용은 이번 단일 핵심 질문을 벗어나므로 후속 세션 범위로 남겼습니다.",
      "정규식 문법 전체, pathlib API 전체, Unicode 정규화·grapheme segmentation 구현은 각각 별도 전문 세션에서 확장해야 합니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
