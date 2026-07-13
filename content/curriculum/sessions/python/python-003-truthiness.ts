import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  slug: "python-003-truthiness",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 3,
  inventoryIds: ["py-003"],
  title: "불리언과 truthiness: 값이 조건이 되는 규칙",
  subtitle: "True와 False를 외우는 데서 멈추지 않고, 숫자·문자열·컬렉션·None이 조건문에서 어떻게 판정되는지와 서로 구분해야 하는 이유를 배웁니다.",
  level: "기초",
  estimatedMinutes: 100,
  coreQuestion: "파이썬은 bool이 아닌 값을 조건에서 만났을 때 어떤 규칙으로 참과 거짓을 결정하며, 그 축약 규칙은 언제 안전하고 언제 정보를 잃을까요?",
  summary: "원본 ex04_bool.py의 모든 값을 직접 실행해 falsy와 truthy의 경계를 확인합니다. 0, 빈 문자열, 빈 컬렉션, None은 모두 조건에서 거짓으로 판정되지만 서로 같은 의미는 아닙니다. 반대로 문자열 'False', 리스트 [0], 음수처럼 내용이 있어 보이지 않는 값도 비어 있지 않으면 참입니다. 이 세션은 bool 변환, 조건문의 암묵적 판정, 명시적 비교 선택 기준, 사용자 정의 객체의 진리값 규약, 잘못된 입력을 구분하는 테스트까지 하나의 정신 모델로 연결합니다.",
  objectives: [
    "bool(value)가 객체의 진리값을 판정하는 과정과 조건문이 같은 규칙을 사용하는 이유를 설명할 수 있다.",
    "False, None, 숫자 0, 빈 문자열, 빈 리스트·튜플·딕셔너리·집합을 서로 다른 값으로 유지하면서 공통으로 falsy임을 예측할 수 있다.",
    "문자열 'False', 문자열 '0', 리스트 [0], 음수가 모두 truthy인 이유를 값의 내용이 아니라 비어 있음과 객체 규약으로 설명할 수 있다.",
    "if value와 value is None, len(value) == 0, value == 0 중 도메인 의미에 맞는 조건을 선택할 수 있다.",
    "truthiness 때문에 정상적인 0이나 빈 입력이 누락되는 버그를 재현하고 입력 상태를 명시적으로 분기해 고칠 수 있다.",
    "사용자 정의 클래스의 __bool__ 또는 __len__이 진리값 판정에 참여한다는 사실을 실행 결과로 확인할 수 있다.",
  ],
  prerequisites: [
    {
      title: "첫 실행부터 이름·값·타입까지",
      reason: "bool 함수에 전달되는 것도 객체이며, 이름이 값을 가리킨다는 전 세션의 실행 모델을 알면 '값 자체'와 '그 값의 진리값 판정 결과'를 혼동하지 않습니다.",
      sessionSlug: "python-001-output-names-types",
    },
    {
      title: "함수 호출의 가장 기초적인 모양",
      reason: "bool(값)과 print(값)처럼 이름 뒤 괄호 안에 인수를 넣어 호출한다는 정도만 필요합니다. 함수 정의나 반환문은 이 세션 안에서 필요한 만큼 다시 설명합니다.",
    },
  ],
  keywords: ["Python", "bool", "truthiness", "truthy", "falsy", "None", "빈 컬렉션", "조건문", "__bool__", "__len__"],
  chapters: [
    {
      id: "truth-value-mental-model",
      title: "진리값은 원래 값과 별도로 판정됩니다",
      lead: "파이썬의 조건 자리는 bool 객체만 받는 좁은 문이 아니라, 거의 모든 객체를 받아 그 객체의 진리값을 묻는 문입니다.",
      explanations: [
        "True와 False는 bool 타입의 두 값입니다. 그러나 if의 조건에 반드시 True 또는 False만 직접 적어야 하는 것은 아닙니다. if value:를 실행하면 파이썬은 value가 가리키는 객체를 조건 규약에 따라 판정합니다. 이 판정 결과가 truthiness이며, 참으로 판정되는 객체를 truthy, 거짓으로 판정되는 객체를 falsy라고 부릅니다. bool(value)는 바로 이 판정을 눈에 보이는 True 또는 False로 돌려주는 함수이므로 작은 실험과 테스트에 유용합니다.",
        "중요한 점은 bool(value)가 원래 값을 bool로 영구 변경하지 않는다는 사실입니다. value가 빈 리스트라면 bool(value)는 False를 반환하지만 value는 여전히 list이고 이후 append로 내용을 추가할 수 있습니다. 숫자 0도 bool(0)이 False일 뿐 0이라는 수치 값이 사라지지 않습니다. 조건문은 객체를 잠깐 질문하고 흐름을 선택할 뿐 원본 객체를 대체하지 않습니다.",
        "이 규칙 덕분에 if items:처럼 목록이 비어 있지 않은지를 간결하게 표현할 수 있습니다. 하지만 간결함은 서로 다른 여러 상태를 하나의 False로 접어 버리기도 합니다. None, 0, 빈 문자열은 모두 falsy지만 '값을 받지 못함', '유효한 수치 0', '사용자가 빈 글자를 입력함'처럼 업무 의미가 다릅니다. 전문가에게 truthiness는 단축 문법이 아니라 정보 압축의 선택입니다.",
      ],
      concepts: [
        {
          term: "bool",
          definition: "참과 거짓 두 상태를 나타내는 파이썬 타입이며 값은 True와 False입니다.",
          detail: [
            "bool(value)는 value의 진리값을 판정해 반드시 True 또는 False 중 하나를 반환합니다.",
            "True와 False는 첫 글자가 대문자입니다. true, false는 기본 키워드가 아니므로 정의하지 않았다면 NameError가 발생합니다.",
          ],
          caveat: "bool 결과가 같다고 원래 값이 같다는 뜻은 아닙니다. bool(None), bool(0), bool('')는 모두 False지만 None, 0, ''는 서로 다른 타입과 의미를 가진 값입니다.",
        },
        {
          term: "truthiness",
          definition: "bool이 아닌 객체를 조건 문맥에서 참 또는 거짓으로 판정하는 규칙과 그 결과입니다.",
          detail: [
            "if, while 같은 조건 문맥과 bool 함수가 같은 진리값 규약을 사용합니다.",
            "기본적으로 특별히 거짓으로 정해진 값과 비어 있는 컨테이너가 falsy이고, 그 밖의 대부분 객체는 truthy입니다.",
          ],
          analogy: "출입구에서 신분증 원본을 다른 카드로 바꾸는 것이 아니라, 현재 입장 조건을 만족하는지만 잠깐 확인해 통과 여부를 정하는 것과 비슷합니다.",
        },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: [
        "bool은 int의 하위 클래스이므로 isinstance(True, int)는 True이고 True + True는 2가 됩니다. 이는 언어 호환성의 성질이지, 도메인 수량을 bool로 모델링하라는 권장이 아닙니다.",
      ],
    },
    {
      id: "canonical-falsy-values",
      title: "원본의 모든 falsy 값을 타입별로 확인합니다",
      lead: "거짓으로 판정되는 대표 값은 무작위 목록이 아니라 부재, 수치적 영, 비어 있는 컨테이너라는 세 묶음으로 기억하면 오래 남습니다.",
      explanations: [
        "원본 ex04_bool.py는 0, 0.0, 빈 문자열, 빈 리스트, 빈 튜플, 빈 딕셔너리, 빈 집합, None을 차례로 bool에 넣습니다. 정수와 실수의 영은 수치적으로 영이므로 falsy입니다. 문자열과 컬렉션은 길이가 0이면 falsy입니다. None은 값이 없거나 아직 정해지지 않았음을 표현하는 단일 객체이며 별도의 규칙으로 falsy입니다.",
        "빈 집합을 {}로 만들 수 없다는 점도 함께 기억해야 합니다. {}는 빈 딕셔너리이고 빈 집합은 set()으로 만듭니다. 둘 다 비어 있어 bool 결과는 False지만 타입과 가능한 연산은 다릅니다. 진리값만 보고 원래 타입을 추측하면 안 되는 좋은 예입니다.",
        "원본 출력에서 빈 문자열 줄은 쉼표 앞에 아무 글자도 없어 ', False'처럼 보입니다. 이것은 출력 누락이 아니라 문자열 값이 길이 0이라는 직접적인 증거입니다. repr을 사용하면 ''처럼 경계를 볼 수 있으므로 디버깅할 때는 print(value)보다 print(repr(value), bool(value))가 더 분명할 수 있습니다.",
      ],
      concepts: [
        {
          term: "falsy",
          definition: "조건 문맥이나 bool 호출에서 False로 판정되는 객체입니다.",
          detail: [
            "대표 범주는 False 자체, None, 숫자 0 계열, 비어 있는 문자열·컬렉션입니다.",
            "falsy는 타입 이름이 아니라 판정 결과에 대한 설명입니다. 빈 list와 정수 0은 모두 falsy이지만 같은 연산을 지원하지 않습니다.",
          ],
        },
        {
          term: "None",
          definition: "값이 없거나 아직 결정되지 않았음을 나타내는 NoneType의 단일 값입니다.",
          detail: [
            "None은 빈 문자열이나 0의 다른 표기가 아닙니다.",
            "None 여부를 검사할 때는 value == None보다 value is None을 사용하는 것이 관례이자 더 정확한 의도 표현입니다.",
          ],
          caveat: "API에서 None이 '누락', 빈 문자열이 '사용자가 비움', 0이 '측정값 0'을 뜻한다면 세 상태를 절대로 if value 하나로 합치지 마세요.",
        },
      ],
      codeExamples: [
        {
          id: "truthiness-source-replay",
          title: "원본 falsy·truthy 경계를 표로 재실행하기",
          language: "python",
          filename: "truthiness_table.py",
          purpose: "ex04_bool.py의 핵심 사례를 타입과 repr까지 함께 표시해 어떤 원본 값이 어떤 진리값으로 판정되는지 정확히 관찰합니다.",
          code: "values = [\n    0, 0.0, '', [], (), {}, set(), None,\n    1, -1, 0.12, 'num', [1], (1,), {'a': 1},\n]\n\nfor value in values:\n    print(f'{value!r:<10} type={type(value).__name__:<8} bool={bool(value)}')",
          walkthrough: [
            {
              lines: "1-4",
              explanation: "원본의 8개 falsy 사례와 7개 truthy 사례를 한 리스트에 모읍니다. 이 리스트가 비어 있지 않으므로 리스트 자체의 진리값은 True지만, 반복에서는 내부 원소를 하나씩 따로 판정합니다.",
            },
            {
              lines: "6",
              explanation: "for가 각 원소를 value라는 이름에 순서대로 바인딩합니다. 반복문 문법은 뒤에서 상세히 배우지만 여기서는 같은 관찰을 여러 값에 적용하는 장치로 사용합니다.",
            },
            {
              lines: "7",
              explanation: "!r은 repr 표현을 사용해 빈 문자열도 ''로 보이게 합니다. type 이름과 bool 결과를 함께 출력하므로 같은 False 결과를 가진 값들의 원래 타입이 보존되어 있음을 확인할 수 있습니다.",
            },
          ],
          run: {
            environment: ["Python 3.11 이상", "UTF-8로 저장한 truthiness_table.py", "외부 패키지 없음"],
            command: "python truthiness_table.py",
          },
          output: {
            value: "0          type=int      bool=False\n0.0        type=float    bool=False\n''         type=str      bool=False\n[]         type=list     bool=False\n()         type=tuple    bool=False\n{}         type=dict     bool=False\nset()      type=set      bool=False\nNone       type=NoneType bool=False\n1          type=int      bool=True\n-1         type=int      bool=True\n0.12       type=float    bool=True\n'num'      type=str      bool=True\n[1]        type=list     bool=True\n(1,)       type=tuple    bool=True\n{'a': 1}   type=dict     bool=True",
            explanation: [
              "숫자는 부호나 크기가 아니라 정확히 영인지가 핵심입니다. 따라서 -1과 0.12도 True입니다.",
              "문자열과 컬렉션은 내부 원소의 진리값이 아니라 길이 0 여부가 우선입니다.",
              "None은 별도의 타입이며 출력이 False라는 이유로 0이나 빈 문자열과 같은 값이 되지 않습니다.",
            ],
          },
          experiments: [
            {
              change: "values에 False와 True를 직접 추가합니다.",
              prediction: "False는 bool=False, True는 bool=True이고 둘 다 type=bool로 표시됩니다.",
              result: "명시적인 bool 값도 같은 판정 표 안에서 다른 객체와 일관되게 동작합니다.",
            },
            {
              change: "values에 float('nan')을 추가합니다.",
              prediction: "NaN은 유효한 수치 비교가 까다롭지만 숫자 영이 아니므로 bool=True입니다.",
              result: "nan type=float bool=True가 출력됩니다. '특이하거나 유효하지 않아 보이는 값은 False일 것'이라는 추측이 틀림을 보여 줍니다.",
            },
          ],
          sourceRefs: ["py-truthiness-ex04", "py-day01-truthiness-note"],
        },
      ],
      diagnostics: [
        {
          symptom: "빈 문자열을 출력했더니 값이 사라진 것처럼 보여 어떤 값이 검사됐는지 알 수 없다.",
          likelyCause: "print('')는 경계 표시 없이 길이 0 문자열을 출력하므로 화면에 글자가 나타나지 않습니다.",
          checks: [
            "print(repr(value))로 따옴표를 포함한 개발자 표현을 확인합니다.",
            "print(type(value), len(value))로 문자열 타입과 길이 0을 확인합니다.",
            "공백 한 칸인 ' '과 완전히 빈 ''를 각각 repr로 비교합니다.",
          ],
          fix: "진단 출력에는 f'{value!r}' 또는 repr(value)를 사용하고 값의 타입과 길이를 함께 표시합니다.",
          prevention: "사용자용 출력과 개발자 진단 출력을 분리하고, 보이지 않는 공백을 다루는 입력 검증에는 repr 기반 테스트를 둡니다.",
        },
      ],
    },
    {
      id: "non-empty-is-truthy",
      title: "내용이 거짓처럼 보여도 비어 있지 않으면 truthy입니다",
      lead: "파이썬은 문자열 안의 단어를 해석하거나 컬렉션 안 원소를 재판정해 바깥 객체의 진리값을 만들지 않습니다.",
      explanations: [
        "bool('False')는 True입니다. 문자열 내용이 영어 단어 False여도 길이가 5인 비어 있지 않은 문자열이기 때문입니다. 마찬가지로 bool('0')과 bool(' ')도 True입니다. 환경 변수, HTML 폼, input 함수에서 받은 값은 흔히 문자열이므로 bool(raw_text)로 예·아니오를 해석하면 사용자가 'false'라고 적어도 참으로 처리하는 버그가 생깁니다.",
        "bool([0])도 True입니다. 리스트 안 원소 0은 falsy이지만 리스트 자체에는 원소가 하나 있어 비어 있지 않습니다. bool([False]), bool([None]), bool([''])도 모두 True입니다. 바깥 컬렉션의 진리값은 기본적으로 내부 원소가 모두 참인지 묻는 검사가 아니라 '비어 있는가'를 묻는 검사입니다.",
        "음수는 False가 아닙니다. 원본의 -1은 True로 출력됩니다. 어떤 업무에서 음수가 허용되지 않는다면 if value:가 아니라 if value < 0:처럼 그 업무 규칙을 직접 검사해야 합니다. truthiness는 유효성 검사 전체가 아니라 매우 제한된 축약 규칙입니다.",
      ],
      concepts: [
        {
          term: "truthy",
          definition: "조건 문맥이나 bool 호출에서 True로 판정되는 객체입니다.",
          detail: [
            "0이 아닌 숫자와 비어 있지 않은 문자열·컬렉션은 내용과 상관없이 기본적으로 truthy입니다.",
            "특별한 진리값 메서드를 구현하지 않은 일반 사용자 객체도 대개 truthy입니다.",
          ],
        },
        {
          term: "컨테이너의 진리값",
          definition: "문자열·리스트·튜플·딕셔너리·집합처럼 내용을 담는 객체는 일반적으로 길이가 0이면 False, 0보다 크면 True로 판정됩니다.",
          detail: [
            "내부 원소 각각의 bool 결과를 자동으로 합산하지 않습니다.",
            "원소의 조건을 검사하려면 목적에 맞는 반복이나 이후 배우는 all, any 같은 별도 연산이 필요합니다.",
          ],
          caveat: "공백만 있는 문자열은 길이가 0이 아니므로 truthy입니다. 사용자가 의미 있는 글자를 입력했는지 보려면 text.strip()의 결과를 검사하는 편이 적절할 수 있습니다.",
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "설정 파일에서 enabled='False'를 읽었는데 if enabled: 분기가 실행된다.",
          likelyCause: "enabled는 bool False가 아니라 길이 5인 문자열 'False'라서 truthy입니다.",
          checks: [
            "print(repr(enabled), type(enabled), bool(enabled))로 실제 타입과 내용을 확인합니다.",
            "입력 경계에서 문자열을 소문자·공백 제거한 뒤 허용 토큰 목록에 속하는지 확인합니다.",
            "알 수 없는 문자열을 임의로 False 처리하지 말고 오류로 보고할지 결정합니다.",
          ],
          fix: "normalized = enabled.strip().lower()로 정규화한 뒤 {'true', '1', 'yes'}와 {'false', '0', 'no'}를 명시적으로 매핑하고 그 밖의 값은 ValueError로 거부합니다.",
          prevention: "외부 입력을 받은 직후 도메인 타입으로 파싱하고, 내부 로직에는 문자열 플래그 대신 실제 bool만 전달합니다.",
        },
        {
          symptom: "[0] 또는 [False]를 빈 목록처럼 예상했지만 조건문이 실행된다.",
          likelyCause: "리스트의 진리값은 내부 원소의 bool이 아니라 리스트 길이로 결정되며 두 목록 모두 길이가 1입니다.",
          checks: [
            "print(len(values), bool(values))로 목록 자체의 길이와 진리값을 확인합니다.",
            "원하는 질문이 '원소가 있는가', '참인 원소가 있는가', '모든 원소가 참인가' 중 무엇인지 문장으로 적습니다.",
          ],
          fix: "원소 존재만 확인하면 if values를 유지하고, 원소 내용 조건은 목적에 맞는 명시적 검사로 분리합니다.",
          prevention: "변수 이름을 has_items, valid_flags처럼 질문의 의미가 드러나게 정하고 컬렉션 자체와 내부 값 검사를 한 줄에 혼합하지 않습니다.",
        },
      ],
    },
    {
      id: "implicit-condition-checks",
      title: "if는 bool을 직접 호출하지 않아도 같은 판정을 사용합니다",
      lead: "bool은 규칙을 관찰하는 도구이고, 실제 제어 흐름에서는 조건문이 그 규칙을 암묵적으로 요청합니다.",
      explanations: [
        "if items:는 개념적으로 items의 진리값을 판정해 True 쪽 또는 False 쪽 블록을 선택합니다. 보통 if bool(items):라고 쓸 필요는 없습니다. bool을 한 번 더 적어도 의미가 늘지 않기 때문입니다. 컬렉션이 비어 있는지만 묻는다면 파이썬다운 표현은 if items: 또는 if not items:입니다.",
        "그렇지만 짧은 표현이 항상 좋은 것은 아닙니다. count가 0일 때도 유효한 집계 결과라면 if count:는 '값이 제공되었는가'와 '값이 0이 아닌가'를 섞습니다. 함수의 선택 인수에서 None은 미지정, 0은 명시적으로 0을 지정했다는 뜻이라면 if count is None:으로 구분해야 합니다.",
        "조건을 읽을 때는 문법을 한국어 질문으로 바꾸세요. if items는 '원소가 하나 이상 있는가?', if text.strip()은 '공백을 제거한 뒤 글자가 남는가?', if value is None은 '값이 미지정 상태인가?', if count == 0은 '수치가 정확히 영인가?'라는 서로 다른 질문입니다. 질문이 코드에 그대로 드러날수록 버그가 줄어듭니다.",
      ],
      concepts: [
        {
          term: "조건 문맥",
          definition: "프로그램이 다음 흐름을 선택하기 위해 객체의 진리값을 요구하는 위치입니다.",
          detail: [
            "대표적으로 if와 while의 조건 부분이 있습니다.",
            "조건 문맥은 원본 객체를 bool 객체로 덮어쓰지 않고 판정 결과만 사용합니다.",
          ],
        },
        {
          term: "명시적 상태 검사",
          definition: "truthiness로 여러 상태를 합치지 않고 is None, == 0, len(...) == 0처럼 필요한 상태를 직접 비교하는 방식입니다.",
          detail: [
            "상태 간 의미 차이가 업무 규칙에 중요할 때 사용합니다.",
            "표현이 조금 길어지더라도 정상값을 누락하는 것보다 안전합니다.",
          ],
        },
      ],
      codeExamples: [
        {
          id: "truthiness-preserve-states",
          title: "None·0·빈 입력을 잃지 않는 상태 분류기",
          language: "python",
          filename: "input_state.py",
          purpose: "모두 falsy인 세 값이 서로 다른 업무 의미를 가질 때 if value 하나를 쓰지 않고 상태를 보존하는 방법을 확인합니다.",
          code: "def describe(value):\n    if value is None:\n        return '미입력'\n    if isinstance(value, str) and value.strip() == '':\n        return '빈 문자열'\n    if value == 0:\n        return '수치 0'\n    return '값 있음'\n\nfor sample in [None, '', '   ', 0, 0.0, '0', [], [0]]:\n    print(f'{sample!r:<6} -> {describe(sample)} (bool={bool(sample)})')",
          walkthrough: [
            {
              lines: "1-2",
              explanation: "None은 미입력이라는 별도 상태이므로 가장 먼저 is None으로 검사합니다. == 비교를 사용자 객체가 바꿀 수 있는 것과 달리 is는 바로 그 None 단일 객체인지 묻습니다.",
            },
            {
              lines: "3-4",
              explanation: "문자열일 때만 strip을 호출해 완전한 빈 문자열과 공백만 있는 입력을 같은 입력 상태로 분류합니다. 리스트에는 strip이 없으므로 타입 확인 없이 호출하면 AttributeError가 납니다.",
            },
            {
              lines: "5-6",
              explanation: "0과 0.0은 값이 명시된 수치 결과로 분류합니다. 이 예에서는 두 값의 동등 비교가 True이므로 같은 상태로 처리합니다.",
            },
            {
              lines: "9-10",
              explanation: "여덟 표본의 원본 표현, 도메인 분류, 일반 bool 결과를 나란히 보여 줍니다. falsy라는 공통점만으로는 업무 상태를 충분히 설명할 수 없음을 관찰합니다.",
            },
          ],
          run: {
            environment: ["Python 3.11 이상", "input_state.py를 UTF-8로 저장", "외부 패키지 없음"],
            command: "python input_state.py",
          },
          output: {
            value: "None   -> 미입력 (bool=False)\n''     -> 빈 문자열 (bool=False)\n'   '  -> 빈 문자열 (bool=True)\n0      -> 수치 0 (bool=False)\n0.0    -> 수치 0 (bool=False)\n'0'    -> 값 있음 (bool=True)\n[]     -> 값 있음 (bool=False)\n[0]    -> 값 있음 (bool=True)",
            explanation: [
              "공백 문자열은 일반 bool로 True지만 strip 이후에는 빈 입력으로 분류됩니다.",
              "문자열 '0'은 수치 0이 아니므로 값 있음으로 남습니다. 숫자로 사용할 입력이라면 별도의 파싱 단계가 필요합니다.",
              "빈 리스트는 bool=False지만 이 함수의 문자열·수치 도메인에서 미입력이나 빈 문자열로 임의 해석하지 않습니다.",
            ],
          },
          experiments: [
            {
              change: "첫 세 분기를 제거하고 if not value: return '없음' 하나만 사용합니다.",
              prediction: "None, '', 0, 0.0, []가 모두 '없음'으로 합쳐집니다.",
              result: "코드는 짧아지지만 사용자가 0을 명시했다는 정보와 빈 컬렉션 타입 정보가 사라집니다.",
            },
            {
              change: "표본에 False를 추가합니다.",
              prediction: "bool=False이고, 현재 value == 0 비교가 True라 '수치 0'으로 분류됩니다.",
              result: "bool은 int의 하위 타입이라 False == 0이 True입니다. 실제 API에서는 isinstance(value, bool)을 숫자 검사보다 먼저 두어 정책을 명확히 해야 합니다.",
            },
          ],
          sourceRefs: ["py-truthiness-ex04", "py-day01-truthiness-note", "python-truth-doc"],
        },
      ],
      diagnostics: [],
      comparisons: [
        {
          title: "어떤 조건 표현을 선택해야 할까요?",
          options: [
            {
              name: "if value",
              chooseWhen: "값의 구체적 종류와 상관없이 truthy/falsy 두 상태로 나누는 것이 요구사항과 정확히 같을 때",
              avoidWhen: "None, 0, 빈 문자열, 빈 컬렉션을 서로 구분해야 할 때",
              tradeoffs: ["짧고 파이썬다운 표현입니다.", "여러 상태를 한꺼번에 접어 디버깅 정보를 잃을 수 있습니다."],
            },
            {
              name: "if value is None",
              chooseWhen: "미지정 sentinel인 None만 별도로 처리할 때",
              avoidWhen: "빈 문자열과 빈 컬렉션까지 모두 같은 부재로 보려 할 때",
              tradeoffs: ["의도가 매우 분명하고 유효한 0을 보존합니다.", "다른 빈 상태는 별도 정책이 필요합니다."],
            },
            {
              name: "if len(value) == 0",
              chooseWhen: "길이가 있는 컨테이너의 비어 있음을 숫자로 명시해야 하거나 길이 자체를 함께 사용할 때",
              avoidWhen: "None이나 숫자처럼 len을 지원하지 않는 값이 올 수 있을 때",
              tradeoffs: ["검사 대상이 길이라는 사실이 노출됩니다.", "단순 비어 있음 검사에는 if not value보다 장황할 수 있습니다."],
            },
          ],
        },
      ],
    },
    {
      id: "custom-object-protocol",
      title: "사용자 객체도 __bool__ 또는 __len__으로 진리값을 정합니다",
      lead: "내장 값 목록을 외우는 것보다 객체가 진리값 요청에 응답하는 규약을 이해하면 라이브러리 객체를 만났을 때도 원리를 적용할 수 있습니다.",
      explanations: [
        "사용자 정의 객체가 __bool__ 메서드를 제공하면 bool(instance)와 조건문은 그 메서드의 반환값을 사용합니다. __bool__은 실제 bool을 반환해야 하며 다른 타입을 반환하면 TypeError가 발생합니다. 객체가 __bool__은 없지만 __len__을 제공한다면 길이 0은 False, 양수 길이는 True로 판정됩니다.",
        "둘 다 없다면 일반 객체는 기본적으로 True입니다. 객체 안의 속성이 None이거나 0이라는 사실만으로 객체 전체가 자동 False가 되지 않습니다. 라이브러리 객체를 if obj:로 검사하기 전에 그 타입이 어떤 진리값 규약을 정의했는지 문서를 확인해야 하는 이유입니다.",
        "도메인 객체에 __bool__을 구현할 때는 독자가 쉽게 예측할 수 있는 의미여야 합니다. 예를 들어 장바구니는 항목 수가 0이면 False라는 규칙이 자연스럽지만, 사용자 계정 객체를 '활성 여부' 하나로 bool화하면 존재 여부와 활성 상태를 혼동할 수 있습니다. account.is_active처럼 이름 있는 속성이 더 읽기 좋은 경우가 많습니다.",
      ],
      concepts: [
        {
          term: "__bool__",
          definition: "객체가 bool 변환이나 조건 문맥에서 사용할 진리값을 직접 반환하는 특수 메서드입니다.",
          detail: [
            "반환값은 True 또는 False여야 합니다.",
            "명시적이고 안정적인 도메인 의미가 없으면 구현하지 않고 이름 있는 메서드나 속성을 쓰는 편이 좋습니다.",
          ],
        },
        {
          term: "__len__",
          definition: "컨테이너의 길이를 반환하는 특수 메서드이며 __bool__이 없을 때 길이 0 여부가 진리값 판정에 사용될 수 있습니다.",
          detail: [
            "길이는 0 이상의 정수여야 합니다.",
            "list, tuple, str 같은 내장 컨테이너의 빈 값 판정을 이해하는 정신 모델이 됩니다.",
          ],
          caveat: "__bool__과 __len__을 동시에 정의하면 진리값 판정에서는 __bool__이 우선합니다.",
        },
      ],
      codeExamples: [
        {
          id: "truthiness-custom-cart",
          title: "길이로 진리값을 제공하는 장바구니",
          language: "python",
          filename: "cart_truthiness.py",
          purpose: "빈 컬렉션이 False인 규칙을 사용자 정의 컨테이너에서 재현하고, 조건문이 __len__을 호출하는 흐름을 확인합니다.",
          code: "class Cart:\n    def __init__(self):\n        self.items = []\n\n    def __len__(self):\n        return len(self.items)\n\ncart = Cart()\nprint(len(cart), bool(cart))\n\ncart.items.append('Python 책')\nprint(len(cart), bool(cart))\n\nif cart:\n    print('결제할 항목이 있습니다.')",
          walkthrough: [
            {
              lines: "1-3",
              explanation: "Cart 인스턴스는 내부에 실제 항목을 담는 리스트를 가집니다. 객체가 만들어졌다는 사실과 항목이 있다는 사실은 구분됩니다.",
            },
            {
              lines: "5-6",
              explanation: "__len__이 내부 리스트 길이를 반환합니다. __bool__이 없으므로 bool(cart)는 이 길이가 0인지 사용해 판정합니다.",
            },
            {
              lines: "8-9",
              explanation: "처음 항목 수는 0이므로 len은 0, bool은 False입니다.",
            },
            {
              lines: "11-15",
              explanation: "항목 하나를 추가하면 길이가 1이 되고 bool은 True가 되어 조건 블록이 실행됩니다.",
            },
          ],
          run: {
            environment: ["Python 3.11 이상", "cart_truthiness.py를 UTF-8로 저장", "외부 패키지 없음"],
            command: "python cart_truthiness.py",
          },
          output: {
            value: "0 False\n1 True\n결제할 항목이 있습니다.",
            explanation: [
              "Cart 객체는 두 시점 모두 존재하지만 내부 길이가 달라 진리값이 바뀝니다.",
              "if cart는 cart is not None을 검사하는 문장이 아니라 Cart가 정의한 컨테이너 의미를 사용합니다.",
            ],
          },
          experiments: [
            {
              change: "__len__ 메서드를 통째로 제거합니다.",
              prediction: "새 Cart도 일반 객체 규칙에 따라 bool(cart)가 True가 됩니다.",
              result: "0 False였던 첫 줄에서 len(cart)는 TypeError가 되고, len 호출을 제거해 bool만 확인하면 True가 됩니다.",
            },
            {
              change: "def __bool__(self): return False를 추가합니다.",
              prediction: "항목을 추가해 길이가 1이어도 __bool__이 우선하므로 bool(cart)는 False입니다.",
              result: "두 번째 출력이 1 False가 되고 결제 메시지는 출력되지 않습니다.",
            },
          ],
          sourceRefs: ["python-truth-doc"],
        },
      ],
      diagnostics: [
        {
          symptom: "__bool__ should return bool, returned int라는 TypeError가 발생한다.",
          likelyCause: "__bool__에서 0이나 1 같은 int를 반환해도 될 것이라 생각했지만 특수 메서드 계약은 실제 bool 반환을 요구합니다.",
          checks: [
            "__bool__ 구현의 모든 return 경로를 확인합니다.",
            "반환식의 type을 직접 출력하거나 단위 테스트에서 result is True 또는 result is False를 확인합니다.",
          ],
          fix: "return len(self.items)처럼 정수를 직접 반환하지 말고 return len(self.items) > 0처럼 bool 비교 결과를 반환합니다. 단순 컨테이너라면 __len__만 구현하는 선택도 가능합니다.",
          prevention: "특수 메서드의 반환 타입 계약을 공식 문서로 확인하고 빈 상태와 채워진 상태 테스트를 각각 둡니다.",
        },
      ],
      expertNotes: [
        "NumPy 배열과 pandas 객체처럼 원소가 여러 개인 자료구조는 단일 truthiness가 모호하다는 이유로 조건 평가에서 오류를 낼 수 있습니다. 해당 라이브러리 세션에서는 size, empty, any, all 중 의도에 맞는 명시적 연산을 사용합니다.",
      ],
    },
    {
      id: "state-preservation-and-api-design",
      title: "부재·빈 값·영을 구분하는 API를 설계합니다",
      lead: "truthiness 버그의 상당수는 문법 문제가 아니라 함수가 어떤 상태들을 허용하는지 정하지 않은 설계 문제입니다.",
      explanations: [
        "함수 인수 limit=None이 '제한 없음', limit=0이 '결과를 0개 반환', 양수가 '최대 개수'를 뜻할 수 있습니다. 이때 if not limit:로 검사하면 None과 0이 같은 분기로 들어가 요구사항이 깨집니다. if limit is None을 먼저 사용하고, 그 다음 0 이상인지 검증해야 합니다.",
        "텍스트 입력도 마찬가지입니다. None은 필드가 전달되지 않음, ''는 전달됐지만 비어 있음, '   '는 공백 문자만 있음, '0'은 실제 글자 한 개가 있음이라는 네 상태입니다. 어떤 상태를 같은 것으로 볼지는 파이썬이 아니라 제품 요구사항이 결정합니다. strip을 적용할지, 빈 문자열을 저장할지, None으로 정규화할지 정책을 문서화해야 합니다.",
        "함수 경계에서 입력을 검증하고 내부에는 명확한 타입과 상태만 넘기면 이후 코드가 단순해집니다. 반대로 곳곳에서 if value를 반복하면 같은 값이 화면·DB·API 계층마다 다르게 해석될 수 있습니다. 간단한 bool 판정을 사용하더라도 그 앞에 정규화 계약과 테스트가 있어야 합니다.",
      ],
      concepts: [
        {
          term: "sentinel",
          definition: "일반 데이터와 구분되는 특별한 상태를 표시하기 위해 사용하는 값입니다.",
          detail: [
            "None은 선택 인수가 제공되지 않았음을 나타내는 흔한 sentinel입니다.",
            "None 자체가 유효한 데이터일 때는 object()로 별도 sentinel을 만들어 누락과 명시적 None을 구분할 수도 있습니다.",
          ],
        },
        {
          term: "입력 정규화",
          definition: "외부에서 들어온 여러 표현을 검증된 내부 상태로 변환하는 과정입니다.",
          detail: [
            "공백 제거, 대소문자 통일, 문자열 플래그 파싱 등이 포함될 수 있습니다.",
            "정규화는 데이터를 조용히 버리는 작업이 아니며 허용·거부 규칙과 오류 메시지를 동반해야 합니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        {
          title: "부재를 어떤 값으로 표현할까요?",
          options: [
            {
              name: "None",
              chooseWhen: "정상 데이터 범위에 None이 없고 미지정 상태 하나를 표현할 때",
              avoidWhen: "None 자체가 사용자가 명시할 수 있는 유효한 데이터일 때",
              tradeoffs: ["is None으로 명확히 검사할 수 있습니다.", "무분별하게 사용하면 오류와 정상 부재를 혼동할 수 있습니다."],
            },
            {
              name: "빈 문자열·빈 컬렉션",
              chooseWhen: "값은 제공됐지만 내용이 0개라는 상태 자체가 의미 있을 때",
              avoidWhen: "필드 미제공과 빈 내용을 구분해야 할 때",
              tradeoffs: ["길이 기반 처리가 자연스럽습니다.", "None과 함께 허용하면 상태 수가 늘어나 계약이 복잡해집니다."],
            },
            {
              name: "전용 sentinel 객체",
              chooseWhen: "누락, 명시적 None, 빈 값을 모두 구분해야 할 때",
              avoidWhen: "외부 직렬화 형식으로 직접 전달해야 할 때",
              tradeoffs: ["상태를 가장 정확히 보존합니다.", "API 사용자에게 개념과 비교 방법을 문서화해야 합니다."],
            },
          ],
        },
      ],
      expertNotes: [
        "보안 설정에서 bool(raw_environment_value)를 사용하면 'false' 문자열도 기능을 켭니다. 인증 우회나 디버그 모드 노출로 이어질 수 있으므로 허용된 문자열을 명시적으로 파싱하고 알 수 없는 값은 시작 실패로 처리하세요.",
      ],
    },
    {
      id: "testing-truth-boundaries",
      title: "경계값 표로 truthiness 회귀 테스트를 만듭니다",
      lead: "참 하나와 거짓 하나만 시험하면 문자열 'False', 공백, [0], False와 0의 동등성 같은 실제 실패 지점을 놓칩니다.",
      explanations: [
        "truthiness를 사용하는 함수는 대표값이 아니라 상태 공간을 기준으로 테스트해야 합니다. None, False, 0, 0.0, '', ' ', [], [0], {}, {'x': 0}처럼 비슷해 보이지만 다른 표본을 표로 만드세요. 각 값의 bool 결과만 확인하지 말고 함수가 요구사항에 맞는 상태로 분류하는지도 검증해야 합니다.",
        "테스트 이름은 기대한 질문을 드러내야 합니다. test_zero_is_preserved_as_explicit_limit, test_false_text_is_rejected처럼 작성하면 어떤 상태를 지키려는지 보입니다. test_truthy_1 같은 이름은 구현 세부만 반복해 제품 의미를 설명하지 못합니다.",
        "운영 코드에서 조건을 수정할 때 이 표가 회귀 방지 장치가 됩니다. if value를 if value is None으로 바꾸면 어떤 표본의 결과가 달라져야 하는지 먼저 테스트로 고정한 뒤 코드를 바꾸세요. 작은 진리값 규칙도 API 계약의 일부입니다.",
      ],
      concepts: [
        {
          term: "경계값 테스트",
          definition: "동작이 바뀌는 경계의 바로 양쪽 값과 특별한 상태를 골라 검증하는 테스트 전략입니다.",
          detail: [
            "truthiness에서는 빈 값과 원소 하나, 숫자 0과 음수·양수, None과 명시적 값이 핵심 경계입니다.",
            "외부 입력에서는 실제 bool과 모양만 비슷한 문자열을 함께 넣어야 합니다.",
          ],
        },
        {
          term: "회귀 테스트",
          definition: "이미 고친 오류나 합의한 동작이 이후 변경으로 다시 깨지지 않는지 확인하는 자동 테스트입니다.",
          detail: [
            "버그를 재현하는 입력을 테스트 사례로 남깁니다.",
            "구현 방식보다 사용자에게 보이는 계약을 검증해야 리팩터링을 방해하지 않습니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: [
        "테스트 데이터의 repr과 타입을 실패 메시지에 넣으면 False, 0, '', []처럼 화면상 비슷한 실패를 빠르게 구분할 수 있습니다.",
      ],
    },
    {
      id: "truthiness-decision-checklist",
      title: "코드를 쓰기 전에 질문을 하나로 고정합니다",
      lead: "truthiness를 잘 쓰는 기준은 짧은 코드가 아니라, 조건이 요구사항의 질문 하나에 정확히 답하는가입니다.",
      explanations: [
        "첫째, 검사 대상의 가능한 타입을 적습니다. 문자열만 오는지, None도 오는지, 숫자와 bool이 섞일 수 있는지 모르면 if value의 의미도 정할 수 없습니다. 둘째, falsy 상태들을 같은 결과로 처리해도 되는지 확인합니다. 하나라도 다른 의미라면 명시적 분기가 필요합니다.",
        "셋째, 외부 입력은 먼저 파싱합니다. 문자열 'False'를 내부 bool로 바꾸고, 실패하면 오류를 반환합니다. 넷째, 사용자 정의 객체라면 bool 판정이 무엇을 뜻하는지 문서에서 확인합니다. 다섯째, 경계값 표를 테스트로 남깁니다. 이 다섯 단계면 대부분의 truthiness 오해를 문법 암기가 아니라 설계 절차로 예방할 수 있습니다.",
        "이 세션의 목표는 모든 조건에 명시적 비교를 붙이는 것이 아닙니다. 리스트가 비었는지 묻는 if items는 명료하고 훌륭합니다. 반대로 주문 수량 0과 미입력을 구분해야 하는데 if quantity를 쓰는 것은 짧지만 틀립니다. 같은 문법도 질문과 데이터 계약에 따라 품질이 달라집니다.",
      ],
      concepts: [],
      codeExamples: [],
      diagnostics: [],
      expertNotes: [
        "코드 리뷰에서는 '이 값이 falsy일 수 있는 모든 경우는 무엇인가?', '그 경우들을 정말 같은 의미로 처리해도 되는가?'를 질문하세요.",
        "개인정보나 비밀값을 진단하려고 repr 전체를 로그에 남기지 마세요. 타입·길이·허용 상태처럼 문제 해결에 필요한 최소 메타데이터만 기록합니다.",
      ],
    },
  ],
  lab: {
    title: "회원가입 입력 상태 판정기 만들기",
    scenario: "이름과 추천인 코드, 알림 설정을 받는 함수가 None, 빈 문자열, 공백 문자열, 문자열 'False'를 서로 혼동하지 않도록 입력 경계를 설계합니다.",
    setup: [
      "새 폴더에 signup_state.py를 만들고 Python 3.11 이상에서 실행합니다.",
      "외부 패키지는 사용하지 않습니다.",
      "name, referral_code, notifications 세 입력이 각각 어떤 상태를 허용하는지 먼저 한국어 표로 적습니다.",
    ],
    steps: [
      "normalize_name 함수를 만들고 None은 '이름 누락', strip 후 빈 값은 '빈 이름', 나머지는 정규화된 이름으로 반환합니다.",
      "추천인 코드는 None이면 미제공, 빈 문자열이면 사용자가 지운 값, 나머지는 제공된 코드로 구분합니다.",
      "알림 문자열은 strip().lower()한 뒤 true/1/yes는 True, false/0/no는 False로 변환하고 다른 값은 ValueError를 발생시킵니다.",
      "name 표본 [None, '', '   ', '둘리']와 notifications 표본 ['true', 'False', '0', 'off', '']를 실행합니다.",
      "각 표본에 대해 repr, 원본 bool 결과, 정규화 결과 또는 오류를 한 줄에 기록합니다.",
      "if raw_value 하나만 사용한 잘못된 버전을 별도 함수로 만들고 문자열 'False'가 True로 처리되는 차이를 비교합니다.",
    ],
    expectedResult: [
      "None, 빈 문자열, 공백 문자열이 이름 정책에 따라 서로 설명 가능한 상태로 분류됩니다.",
      "'False'와 '0'은 실제 False로 변환되고 'off'와 빈 문자열은 허용 목록 밖이라 명시적 오류가 됩니다.",
      "잘못된 버전에서는 'False'가 truthy라 알림이 켜지는 버그가 재현됩니다.",
      "정상 결과, 오류 결과, 원본 bool 판정이 함께 남아 이후 정책 변경을 검토할 수 있습니다.",
    ],
    cleanup: ["실습 파일과 실행 결과 텍스트를 같은 폴더에 보관하고 실제 비밀번호나 개인정보는 표본으로 사용하지 않습니다."],
    extensions: [
      "추천인 코드에서 문자열 '0'을 유효한 코드로 보존하는 테스트를 추가합니다.",
      "알림 파서의 허용 토큰을 함수 인수로 받아 한국어 예/아니오도 지원하게 설계합니다.",
      "pytest를 배운 뒤 현재 표본 표를 매개변수화 테스트로 옮깁니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "원본 ex04_bool.py의 값들을 직접 입력하고 bool 결과를 예측한 뒤 확인하세요.",
      requirements: [
        "0, 0.0, '', [], (), {}, set(), None을 모두 포함합니다.",
        "1, -1, 0.12, 'num', [1], (1,), {'a': 1}을 모두 포함합니다.",
        "각 값은 repr, type 이름, bool 결과를 한 줄에 출력합니다.",
        "예측과 다른 값에는 왜 틀렸는지 한 문장을 붙입니다.",
      ],
      hints: ["f'{value!r}'는 빈 문자열과 공백을 눈에 보이게 합니다.", "컬렉션 안 원소가 아니라 컬렉션 자체의 길이에 주목하세요."],
      expectedOutcome: "원본의 15개 표본 결과를 정확히 재현하고 falsy 값을 부재·영·빈 컨테이너로 분류할 수 있습니다.",
      solutionOutline: ["값 목록을 만듭니다.", "반복하며 repr/type/bool을 출력합니다.", "falsy와 truthy를 별도 표로 정리합니다."],
    },
    {
      difficulty: "응용",
      prompt: "검색 결과 limit 인수를 None, 0, 양수로 정확히 구분하는 함수를 작성하세요.",
      requirements: [
        "None은 기본 제한 20개를 사용합니다.",
        "0은 빈 결과를 뜻하며 기본값으로 바꾸면 안 됩니다.",
        "음수와 bool 값은 ValueError로 거부합니다.",
        "None, 0, 5, -1, False 표본의 정상·오류 결과를 기록합니다.",
      ],
      hints: ["bool은 int의 하위 타입이므로 isinstance(limit, bool)을 int 검사보다 먼저 두세요.", "if not limit을 사용하면 None과 0이 합쳐집니다."],
      expectedOutcome: "유효한 0을 보존하고 미지정 상태만 기본값으로 바꾸는 입력 계약과 경계값 테스트가 완성됩니다.",
    },
    {
      difficulty: "설계",
      prompt: "환경 변수의 기능 플래그를 안전하게 bool로 변환하는 파서를 설계하세요.",
      requirements: [
        "허용할 참 문자열과 거짓 문자열을 문서화합니다.",
        "대소문자와 양끝 공백을 정규화합니다.",
        "빈 문자열과 알 수 없는 단어는 조용히 False로 바꾸지 말고 명시적 오류로 처리합니다.",
        "오류 메시지에 비밀값 전체를 노출하지 않는 로깅 정책을 설명합니다.",
        "최소 10개 표본으로 테스트 표를 만듭니다.",
      ],
      hints: ["집합 두 개로 허용 토큰을 관리하면 중복 분기를 줄일 수 있습니다.", "파싱과 기능 실행을 별도 함수로 분리하세요."],
      expectedOutcome: "문자열 'false'가 truthy라 기능이 켜지는 보안성 버그를 차단하고 허용되지 않은 설정으로 애플리케이션이 시작되지 않게 하는 설계가 완성됩니다.",
    },
  ],
  reviewQuestions: [
    {
      question: "bool('False')가 False가 아닌 이유는 무엇인가요?",
      answer: "파이썬은 문자열 내용을 참/거짓 명령으로 해석하지 않습니다. 'False'는 길이가 5인 비어 있지 않은 문자열이므로 True입니다.",
    },
    {
      question: "bool([0])과 bool(0)의 결과가 다른 이유는 무엇인가요?",
      answer: "0은 숫자 영이라 False입니다. [0]은 내부 원소가 falsy여도 원소 하나를 가진 비어 있지 않은 리스트라 True입니다.",
    },
    {
      question: "None, 0, ''가 모두 False라면 같은 값으로 취급해도 되나요?",
      answer: "아닙니다. 진리값 결과만 같을 뿐 타입과 도메인 의미가 다릅니다. 미입력, 수치 영, 빈 텍스트를 구분해야 하면 is None, == 0, 문자열 검사를 각각 사용합니다.",
    },
    {
      question: "빈 문자열과 공백 한 칸 문자열의 bool 결과는 어떻게 다르며 왜 그런가요?",
      answer: "''는 길이 0이라 False이고 ' '는 길이 1이라 True입니다. 의미 있는 글자가 있는지 보려면 strip 후 결과를 검사할 수 있습니다.",
    },
    {
      question: "if items와 if len(items) > 0 중 어느 것이 항상 더 좋은가요?",
      answer: "항상 우월한 하나는 없습니다. 단순히 비어 있지 않은지를 묻는다면 if items가 간결하고 명확합니다. 길이 자체를 강조하거나 다른 계산에 재사용하면 명시적 len이 유용할 수 있습니다.",
    },
    {
      question: "사용자 정의 객체에 __bool__과 __len__이 모두 없으면 보통 어떻게 판정되나요?",
      answer: "일반적으로 True로 판정됩니다. __bool__이 있으면 그것이 우선하고, 없으면 __len__의 0 여부가 사용됩니다.",
    },
    {
      question: "왜 설정 문자열을 bool(raw_value)로 파싱하면 위험한가요?",
      answer: "'false', '0', 'no' 같은 비어 있지 않은 문자열이 모두 True가 되기 때문입니다. 허용 토큰을 명시적으로 매핑하고 알 수 없는 값은 오류로 처리해야 합니다.",
    },
    {
      question: "bool(value)를 호출하면 value의 타입이 bool로 바뀌나요?",
      answer: "아닙니다. value의 진리값을 판정한 새 bool 결과를 반환할 뿐 원본 객체와 이름 바인딩은 그대로입니다.",
    },
  ],
  completionChecklist: [
    "truthy, falsy, bool 타입, truthiness를 서로 연결해 설명할 수 있다.",
    "원본 ex04_bool.py의 모든 표본 결과를 실행 전에 예측할 수 있다.",
    "문자열 'False', 공백 문자열, 리스트 [0]이 True인 이유를 설명할 수 있다.",
    "None, 0, 빈 문자열, 빈 컬렉션을 요구사항에 따라 보존하거나 합칠 수 있다.",
    "if value와 value is None, value == 0, 문자열 strip 검사를 목적에 맞게 선택할 수 있다.",
    "사용자 정의 객체의 __bool__/__len__ 진리값 규약을 설명하고 작은 예제를 구현할 수 있다.",
    "외부 문자열 플래그를 허용 목록으로 안전하게 파싱할 수 있다.",
    "truthiness 경계값을 정상·실패 표본으로 테스트할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    {
      id: "py-truthiness-ex04",
      repository: "PYTHON-BASIC",
      path: "day01/ex04_bool.py",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day01/ex04_bool.py",
      usedFor: ["False로 평가되는 내장 값", "True로 평가되는 비어 있지 않은 값", "원본 실행 결과"],
      evidence: "로컬 파일과 공개 main 브랜치가 동일한 커밋 상태임을 확인하고 Python 3.13.9에서 직접 실행했습니다. 8개 falsy 값과 7개 truthy 값이 원본 주석대로 출력됐습니다.",
    },
    {
      id: "py-day01-truthiness-note",
      repository: "PYTHON-BASIC",
      path: "notes/day01_basic.md",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day01_basic.md",
      usedFor: ["bool 핵심 규칙", "빈 값 표", "셀프 체크 Q2", "원본 파일 매핑"],
      evidence: "Day01 노트의 bool 절과 셀프 체크를 전수 검토했습니다. 원본의 '비어있는 값은 False' 설명을 유지하면서 None·0·빈 값의 도메인 의미 차이와 외부 문자열 파싱 실패를 보강했습니다.",
    },
    {
      id: "python-truth-doc",
      repository: "Python 공식 문서",
      path: "library/stdtypes.html#truth-value-testing",
      publicUrl: "https://docs.python.org/3/library/stdtypes.html#truth-value-testing",
      usedFor: ["__bool__", "__len__", "기본 객체 진리값", "내장 falsy 규칙"],
      evidence: "원본에서 다루지 않은 사용자 정의 객체의 truth value testing 규약을 공식 언어 문서 범위로 명확히 분리해 보충했습니다.",
    },
  ],
  sourceCoverage: {
    filesRead: 2,
    filesUsed: 2,
    uncoveredNotes: [
      "숫자형의 종류·형 변환·산술 연산은 ex05_number.py부터 ex08_number.py의 별도 inventory 세션이므로 이 페이지에서 확장하지 않았습니다. 숫자 0과 음수는 truthiness 경계를 설명하는 범위에서만 사용했습니다.",
      "원본은 내장 값의 bool 결과를 다루며 사용자 정의 __bool__/__len__, 외부 문자열 플래그, None·0·빈 문자열의 API 의미 차이는 다루지 않습니다. 이 범위는 Python 공식 truth value testing 규약과 실무 실패 사례로 보강했습니다.",
      "원본 출력의 빈 문자열은 화면에서 경계가 보이지 않으므로 학습 예제에는 repr 표기를 추가했습니다. 원본 결과 자체는 변경하지 않았습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const advancedChapters: DetailedSession["chapters"] = [
  {
    id: "and-or-operand-return-short-circuit",
    title: "and·or를 bool 반환 연산자가 아니라 operand 선택과 단축 평가로 이해합니다",
    lead: "조건에서는 truth value가 사용되지만 expression 결과는 원래 operand일 수 있어 default 선택·cache·function 호출에서 타입과 부작용이 달라집니다.",
    explanations: [
      "`x and y`는 x가 falsy이면 x 자체를 반환하고, 아니면 y를 평가해 그 결과를 반환합니다. `x or y`는 x가 truthy이면 x 자체를 반환하고, 아니면 y를 평가해 반환합니다.",
      "따라서 `value or default`는 None만 대체하는 문법이 아닙니다. 유효한0, 빈 문자열, 빈 list도 default로 바뀌므로 missing sentinel과 falsy domain value를 구분해야 합니다.",
      "short-circuit는 결과가 결정되면 오른쪽 operand를 평가하지 않습니다. expensive call을 피하거나 guard에 쓸 수 있지만, 오른쪽 side effect가 항상 실행될 것이라 기대하면 state가 달라집니다.",
      "`condition and action()` 같은 표현은 짧지만 action 반환값과 condition 타입을 섞고 statement 의도를 숨길 수 있습니다. 제어 흐름에는 명시적 if가 읽기 쉽고 breakpoint·coverage도 명확합니다.",
      "`and`가 `or`보다 precedence가 높지만 복합 조건은 괄호와 의미 이름으로 의도를 드러냅니다. call 횟수까지 중요한 경우 truth table뿐 아니라 evaluation event trace를 test합니다.",
      "awaitable·generator·database object의 truth test가 금지되거나 비싼 경우도 있습니다. third-party type의 `__bool__` 계약을 확인하고 explicit predicate를 선호합니다.",
    ],
    concepts: [
      { term: "operand-returning boolean operation", definition: "truth value로 분기하되 결과로 bool이 아니라 선택된 원래 operand를 반환하는 and/or semantics입니다.", detail: ["type이 유지될 수 있습니다.", "default idiom에 주의합니다."] },
      { term: "short-circuit", definition: "왼쪽 결과만으로 결론이 나면 오른쪽 expression을 평가하지 않는 동작입니다.", detail: ["성능 최적화가 가능합니다.", "side effect 순서를 바꿉니다."] },
      { term: "sentinel", definition: "missing과0·empty 같은 유효 값을 구분하기 위한 고유 marker object입니다.", detail: ["`None`도 domain에 따라 sentinel입니다.", "identity로 검사합니다."] },
    ],
    codeExamples: [{
      id: "python-short-circuit-event-trace",
      title: "and·or가 어느 operand를 평가하고 무엇을 반환하는지 기록합니다",
      language: "python",
      filename: "short_circuit_trace.py",
      purpose: "함수 call event와 operand result를 분리해 단축 평가를 exact 관찰합니다.",
      code: "events = []\n\ndef probe(name, value):\n    events.append(name)\n    return value\n\nfirst = probe('and-left', 0) and probe('and-right', 99)\nsecond = probe('or-left', 'ready') or probe('or-right', 'fallback')\nthird = probe('fallback-left', '') or probe('fallback-right', 'fallback')\n\nprint(f'values={first!r},{second!r},{third!r}')\nprint(f'events={events}')\nprint(f'types={type(first).__name__},{type(second).__name__},{type(third).__name__}')",
      walkthrough: [
        { lines: "1-5", explanation: "probe는 호출된 operand 이름만 events에 기록하고 전달받은 원래 값을 반환합니다." },
        { lines: "7-9", explanation: "falsy and, truthy or, falsy or의 세 경계를 평가합니다." },
        { lines: "11-13", explanation: "선택된 operand values, 실제 call events와 결과 runtime types를 출력합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 문법만 사용"], command: "python short_circuit_trace.py" },
      output: { value: "values=0,'ready','fallback'\nevents=['and-left', 'or-left', 'fallback-left', 'fallback-right']\ntypes=int,str,str", explanation: ["and-right와 or-right는 평가되지 않습니다.", "and 결과는 int0이고 or 결과는 str operand입니다.", "fallback case에서만 오른쪽 call이 실행됩니다."] },
      experiments: [
        { change: "and-left 값을1로 바꿉니다.", prediction: "and-right event가 추가되고 first=99입니다.", result: "truthy left에서 오른쪽 결과가 최종 operand가 됩니다." },
        { change: "유효 값0에 `value or 10`을 적용합니다.", prediction: "10이 되어0이 유실됩니다.", result: "None/sentinel explicit 검사로 바꿉니다." },
        { change: "probe가 exception을 내게 합니다.", prediction: "short-circuit된 branch의 exception은 발생하지 않습니다.", result: "evaluation 여부가 error surface도 결정합니다." },
      ],
      sourceRefs: ["python-expressions-boolean", "python-truth-stdtypes-003", "python-data-model-truth-003"],
    }],
    diagnostics: [
      { symptom: "0이 유효한 값인데 default로 바뀝니다.", likelyCause: "`value or default`가 모든 falsy values를 missing으로 취급했습니다.", checks: ["0·False·''·[]가 유효한지 domain을 봅니다.", "None/sentinel contract를 확인합니다.", "result type을 출력합니다."], fix: "`if value is None` 또는 고유 sentinel identity 검사로 missing만 대체합니다.", prevention: "missing과 각 falsy domain value를 별도 test합니다." },
      { symptom: "오른쪽 함수의 로그/저장이 간헐적으로 실행되지 않습니다.", likelyCause: "and/or short-circuit branch에 필수 side effect를 넣었습니다.", checks: ["왼쪽 truth table을 만듭니다.", "event trace를 기록합니다.", "side effect 호출을 expression에서 찾습니다."], fix: "필수 action은 명시적 statement로 분리하고 조건부 action은 if로 표현합니다.", prevention: "branch coverage와 call-count assertions를 둡니다." },
      { symptom: "and/or 결과를 bool로 예상했는데 str/list가 전달됩니다.", likelyCause: "and/or가 선택한 operand 자체를 반환합니다.", checks: ["type과 repr을 봅니다.", "consumer가 bool만 요구하는지 확인합니다.", "비교/조건 의도를 분리합니다."], fix: "boolean contract가 필요하면 `bool(expression)` 또는 명시 predicate를 반환합니다.", prevention: "함수 return annotation과 runtime boundary test를 둡니다." },
    ],
  },
  {
    id: "all-any-lazy-quantifiers",
    title: "all·any를 lazy quantifier와 빈 iterable의 논리 항등으로 다룹니다",
    lead: "여러 값의 조건을 합칠 때 단순 반복문보다 의도가 분명하지만 generator 소비·단축 평가·빈 입력 의미를 함께 설계해야 합니다.",
    explanations: [
      "`any(iterable)`은 처음 truthy element에서 True로 끝나고 모두 falsy이면 False입니다. `all(iterable)`은 처음 falsy element에서 False로 끝나고 모두 truthy이면 True입니다.",
      "빈 iterable에서 any는 False, all은 True입니다. 후자는 모든 원소가 조건을 만족한다는 보편 명제가 반례가 없을 때 참인 vacuous truth이며, 업무에서 최소 한 개가 필요하면 `bool(items) and all(...)`을 별도로 씁니다.",
      "generator expression과 쓰면 필요한 지점까지만 값을 생산해 효율적입니다. 하지만 generator는 한 번 소비되므로 같은 iterator로 any 다음 all을 실행하면 남은 elements만 보게 됩니다.",
      "predicate가 network·DB·mutation 같은 side effect를 가지면 단축 평가 때문에 호출 수가 데이터에 따라 달라집니다. pure predicate와 이미 준비된 data에 사용하는 편이 안전합니다.",
      "`all(value is not None for value in fields)`처럼 요구사항을 quantifier로 표현할 수 있지만 empty fields 허용 여부와 String blank normalization을 별도로 정의합니다.",
      "large input에서 모든 diagnostic failures를 수집해야 하면 all/any의 early stop 대신 명시 loop로 error list를 만듭니다. 빠른 결정과 전체 설명은 다른 목표입니다.",
    ],
    concepts: [
      { term: "existential quantifier", definition: "적어도 하나의 element가 truthy인지 묻는 any의 의미입니다.", detail: ["첫 truthy에서 멈춥니다.", "빈 iterable은 False입니다."] },
      { term: "universal quantifier", definition: "모든 elements가 truthy인지 묻는 all의 의미입니다.", detail: ["첫 falsy에서 멈춥니다.", "빈 iterable은 True입니다."] },
      { term: "lazy consumption", definition: "iterator가 요청받은 element만 생산하고 short-circuit 뒤 나머지를 남기는 실행 방식입니다.", detail: ["generator와 잘 맞습니다.", "재사용 시 주의합니다."] },
    ],
    codeExamples: [{
      id: "python-all-any-consumption",
      title: "any·all의 단축 평가와 빈 iterable 결과를 exact 기록합니다",
      language: "python",
      filename: "quantifiers.py",
      purpose: "predicate call 순서와 empty semantics를 값과 함께 검증합니다.",
      code: "def traced(values, events):\n    for value in values:\n        events.append(value)\n        yield value\n\nany_events = []\nall_events = []\nany_result = any(traced([0, '', 3, 4], any_events))\nall_result = all(traced([1, 'ok', 0, 5], all_events))\n\nprint(f'any={any_result}|events={any_events}')\nprint(f'all={all_result}|events={all_events}')\nprint(f'empty_any={any([])}|empty_all={all([])}')",
      walkthrough: [
        { lines: "1-4", explanation: "generator가 값을 yield하기 직전에 실제 소비된 value를 events에 기록합니다." },
        { lines: "6-9", explanation: "any는3에서, all은0에서 결론이 나도록 고정 inputs를 둡니다." },
        { lines: "11-13", explanation: "결과·소비된 prefix와 empty iterable 항등을 출력합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 문법만 사용"], command: "python quantifiers.py" },
      output: { value: "any=True|events=[0, '', 3]\nall=False|events=[1, 'ok', 0]\nempty_any=False|empty_all=True", explanation: ["any는 truthy3 뒤4를 소비하지 않습니다.", "all은 falsy0 뒤5를 소비하지 않습니다.", "빈 all은 True입니다."] },
      experiments: [
        { change: "any input을 [0, '']로 바꿉니다.", prediction: "모두 소비하고 any=False입니다.", result: "existential witness가 없습니다." },
        { change: "all input을 [1, 'ok']로 바꿉니다.", prediction: "모두 소비하고 all=True입니다.", result: "falsy counterexample이 없습니다." },
        { change: "한 generator에 any 뒤 all을 연속 적용합니다.", prediction: "all은 남은 tail만 소비합니다.", result: "one-shot iterator ownership을 문서화합니다." },
      ],
      sourceRefs: ["python-builtins-all-any", "python-iterator-doc-003", "python-expressions-generator-003"],
    }],
    diagnostics: [
      { symptom: "빈 입력인데 all 검증이 True입니다.", likelyCause: "empty iterable의 vacuous truth를 최소1개 요구와 혼동했습니다.", checks: ["input length/presence를 봅니다.", "최소 cardinality 요구를 확인합니다.", "empty fixture를 실행합니다."], fix: "최소 한 개가 필요하면 presence와 all predicate를 함께 검사합니다.", prevention: "empty/one/many cases를 test matrix에 둡니다." },
      { symptom: "두 번째 any/all 호출이 일부 값만 봅니다.", likelyCause: "첫 호출이 같은 generator/iterator를 short-circuit 지점까지 소비했습니다.", checks: ["iter(value) is value인지 봅니다.", "next로 남은 tail을 확인합니다.", "iterator 재사용을 찾습니다."], fix: "각 pass에 새 generator를 만들거나 데이터가 bounded하면 materialize합니다.", prevention: "iterator ownership을 함수 contract에 명시합니다." },
      { symptom: "validation이 첫 오류만 보고 나머지를 누락합니다.", likelyCause: "all/any short-circuit를 전체 오류 수집에 사용했습니다.", checks: ["요구 결과가 boolean인지 error list인지 확인합니다.", "predicate side effects를 봅니다.", "call count를 측정합니다."], fix: "모든 오류가 필요하면 명시 loop/comprehension으로 diagnostics를 수집합니다.", prevention: "fast decision과 exhaustive reporting API를 분리합니다." },
    ],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...advancedChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "python-expressions-boolean", repository: "Python Language Reference", path: "6.11 Boolean operations", publicUrl: "https://docs.python.org/3/reference/expressions.html#boolean-operations", usedFor: ["and", "or", "not", "short-circuit", "operand return"], evidence: "boolean operation의 공식 language semantics입니다." },
  { id: "python-truth-stdtypes-003", repository: "Python Standard Library", path: "Truth Value Testing", publicUrl: "https://docs.python.org/3/library/stdtypes.html#truth-value-testing", usedFor: ["falsy built-ins", "truth test protocol"], evidence: "built-in truth value testing의 공식 목록입니다." },
  { id: "python-data-model-truth-003", repository: "Python Language Reference", path: "Basic customization — object.__bool__ and __len__", publicUrl: "https://docs.python.org/3/reference/datamodel.html#object.__bool__", usedFor: ["__bool__", "__len__", "custom objects"], evidence: "custom truth protocol의 공식 근거입니다." },
  { id: "python-builtins-all-any", repository: "Python Standard Library", path: "Built-in Functions — all and any", publicUrl: "https://docs.python.org/3/library/functions.html#all", usedFor: ["all", "any", "empty iterable"], evidence: "quantifier built-ins의 공식 API입니다." },
  { id: "python-iterator-doc-003", repository: "Python Standard Library", path: "Iterator Types", publicUrl: "https://docs.python.org/3/library/stdtypes.html#iterator-types", usedFor: ["one-shot consumption", "iterator protocol"], evidence: "iterator consumption의 공식 contract입니다." },
  { id: "python-expressions-generator-003", repository: "Python Language Reference", path: "6.2.8 Generator expressions", publicUrl: "https://docs.python.org/3/reference/expressions.html#generator-expressions", usedFor: ["lazy predicate generation", "evaluation timing"], evidence: "generator expression의 공식 semantics입니다." },
  { id: "python-builtins-bool-003", repository: "Python Standard Library", path: "Built-in Functions — bool", publicUrl: "https://docs.python.org/3/library/functions.html#bool", usedFor: ["explicit bool conversion", "truth protocol invocation"], evidence: "bool conversion의 공식 API입니다." },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "`0 and 99`의 결과는 False인가요?", answer: "아닙니다. falsy 첫 operand인 정수0 자체입니다." },
  { question: "`'ready' or fallback()`에서 fallback이 호출되나요?", answer: "아닙니다. 왼쪽이 truthy라 short-circuit됩니다." },
  { question: "`value or default`가 None만 대체하나요?", answer: "아닙니다.0, 빈 문자열, 빈 container 등 모든 falsy value를 대체합니다." },
  { question: "any는 언제 평가를 멈추나요?", answer: "첫 truthy element를 만났을 때 True로 멈춥니다." },
  { question: "all은 언제 평가를 멈추나요?", answer: "첫 falsy element를 만났을 때 False로 멈춥니다." },
  { question: "all([])이 True인 이유는 무엇인가요?", answer: "모든 원소가 truthy라는 명제를 깨는 반례가 빈 집합에는 없기 때문입니다." },
  { question: "같은 generator를 any와 all에 재사용해도 되나요?", answer: "첫 호출이 일부를 소비하므로 의도한 full pass가 아니라면 새 iterator가 필요합니다." },
);

(session.completionChecklist as string[]).push(
  "and·or가 operand 자체를 반환함을 설명한다.",
  "short-circuit call events를 예측한다.",
  "falsy domain value와 missing sentinel을 구분한다.",
  "필수 side effect를 boolean expression에 숨기지 않는다.",
  "all·any의 early termination을 설명한다.",
  "empty any=False·all=True를 검증했다.",
  "one-shot generator consumption을 관리한다.",
);
