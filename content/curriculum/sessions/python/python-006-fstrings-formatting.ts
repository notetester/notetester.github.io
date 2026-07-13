import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-006"],
  slug: "python-006-fstrings-formatting",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 6,
  title: "f-string과 표시 형식",
  subtitle: "값을 문자열에 끼워 넣는 문법을 넘어 표현식 평가, 변환 플래그, 정렬·폭·정밀도와 안전한 출력 경계를 익힙니다.",
  level: "입문",
  estimatedMinutes: 90,
  coreQuestion: "계산용 값을 바꾸지 않으면서 사람이 읽기 좋은 문자열을 정확하고 안전하게 만들려면 어떻게 해야 할까요?",
  summary: "f-string 중괄호에서 표현식이 언제 평가되는지 추적하고, {x=}, !r, 폭·정렬·부호·쉼표·정밀도 지정자를 사용합니다. 출력 형식과 데이터 타입, 반올림 정책, 로그의 비밀값 노출, 사용자 입력을 포맷 문자열로 취급할 때의 위험까지 구분합니다.",
  objectives: [
    "f-string 리터럴과 일반 문자열의 해석 차이를 설명할 수 있다.",
    "중괄호 안 이름·산술식·함수 호출의 평가 순서를 추적할 수 있다.",
    "= 디버깅 표기와 !s·!r 변환이 언제 유용한지 구분할 수 있다.",
    "폭·정렬·채움·부호·천 단위·정밀도 지정자로 표 형태 출력을 만들 수 있다.",
    "포맷된 문자열과 원본 숫자를 분리하고 민감정보를 출력하지 않는 경계를 설계할 수 있다.",
  ],
  prerequisites: [
    { title: "첫 스크립트 실행과 출력", reason: "print 호출과 문자열 리터럴, 이름 바인딩을 사용합니다.", sessionSlug: "python-001-output-names-types" },
    { title: "숫자형과 형 변환", reason: "숫자 포맷은 값의 타입과 표시 문자열을 분리해야 정확히 이해할 수 있습니다.", sessionSlug: "python-004-numeric-types-conversion" },
  ],
  keywords: ["Python", "f-string", "format specifier", "표현식", "repr", "정렬", "정밀도", "로깅", "문자열 포매팅"],
  chapters: [
    {
      id: "formatting-boundary",
      title: "계산과 표시 사이에 경계를 만듭니다",
      lead: "프로그램 안에서는 숫자와 객체를 원래 타입으로 유지하고, 사용자·로그·파일에 보여 주는 마지막 단계에서 문자열 표현을 만듭니다.",
      explanations: [
        "name + '님의 점수는 ' + str(score)처럼 연결할 수도 있지만 값이 많아질수록 변환과 문장 구조가 섞여 읽기 어렵습니다. f'{name}님의 점수는 {score}점'은 고정 문장과 변하는 표현식을 가까이 배치해 의도를 보여 줍니다.",
        "포매팅은 새 str 객체를 만드는 작업입니다. f'{price:,}'가 '1,234'를 만들더라도 price는 계속 int 1234입니다. 계산 도중 쉼표 문자열을 덮어쓰면 다음 덧셈과 정렬에서 TypeError나 잘못된 문자열 연결이 생깁니다. raw value와 display value 이름을 분리하세요.",
        "표시 규칙은 업무 규칙과 연결됩니다. 소수 둘째 자리 표시는 단순 UI 선택일 수도 있고 결제 반올림 정책일 수도 있습니다. f-string은 표시를 담당할 뿐 금액 정책을 자동 결정하지 않습니다. 정책 계산을 먼저 끝내고 그 결과를 포맷하는 순서를 지킵니다.",
      ],
      concepts: [
        { term: "문자열 포매팅", definition: "값의 문자열 표현을 고정 텍스트와 조합하고 표시 모양을 정하는 과정입니다.", detail: ["입력 객체를 변경하지 않고 새 str을 만듭니다.", "같은 값도 사용자 UI, 개발 로그, CSV에 따라 다른 표현이 필요할 수 있습니다."], analogy: "창고의 원상품은 그대로 두고 진열할 때 가격표와 포장 모양을 붙이는 일과 비슷합니다." },
      ],
      codeExamples: [],
      diagnostics: [],
    },
    {
      id: "literal-and-expression",
      title: "f 접두사가 중괄호를 표현식 자리로 바꿉니다",
      lead: "일반 문자열의 {name}은 글자 그대로이고 f-string의 {name}은 현재 이름 공간에서 name을 찾아 값을 문자열로 바꿉니다.",
      explanations: [
        "인터프리터는 f-string을 만날 때 중괄호 안 표현식을 왼쪽부터 평가합니다. f'{a + b}'는 먼저 a와 b를 찾고 + 연산을 수행한 결과를 포맷합니다. hi()를 넣으면 문자열을 만드는 그 시점에 함수가 호출되므로 부작용이나 비용이 큰 호출을 무심코 반복하지 않아야 합니다.",
        "중괄호 자체를 출력하려면 {{와 }}로 두 번 씁니다. 이 방법으로 JSON과 비슷한 모양을 만들 수는 있지만 실제 JSON 직렬화에는 json.dumps를 사용해야 이스케이프와 타입 규칙이 안전합니다.",
        "Python 3.12부터 f-string 표현식 문법 제약이 완화되었지만 지원해야 할 최소 버전을 먼저 확인해야 합니다. 학습 코드는 Python 3.11에서도 동작하도록 중괄호 안 복잡한 따옴표와 여러 줄 로직을 피하고, 계산을 설명적인 이름에 먼저 바인딩하는 편이 읽기 쉽습니다.",
      ],
      concepts: [
        { term: "보간(interpolation)", definition: "문자열 틀의 지정된 위치에 평가한 값을 삽입하는 동작입니다.", detail: ["중괄호 안에는 이름뿐 아니라 값을 반환하는 표현식이 올 수 있습니다.", "표현식이 예외를 일으키면 문자열 생성도 완료되지 않습니다."], caveat: "사용자 입력을 Python 표현식으로 실행하는 기능이 아닙니다. 입력 문자열을 eval로 평가해 f-string처럼 쓰면 코드 실행 취약점이 됩니다." },
      ],
      codeExamples: [
        {
          id: "fstring-learning-report",
          title: "표현식과 숫자 포맷으로 학습 보고서 만들기",
          language: "python",
          filename: "learning_report.py",
          purpose: "원본 ex02_print.py의 표현식, 소수 정밀도, 천 단위 포맷을 하나의 재현 가능한 보고서로 연결합니다.",
          code: "name = '둘리'\ncompleted = 17\ntotal = 40\nlines = 1234567\nrate = completed / total * 100\n\nprint(f'학습자: {name}')\nprint(f'진도: {completed}/{total} ({rate:.1f}%)')\nprint(f'정리한 코드: {lines:,}줄')\nprint(f'{completed=}, {total=}')",
          walkthrough: [
            { lines: "1-4", explanation: "표시 전 원본 값을 str과 int 타입으로 유지합니다." },
            { lines: "5", explanation: "진도율 계산을 출력식 밖에서 끝내 이름을 부여합니다. 테스트와 재사용이 쉬워집니다." },
            { lines: "7", explanation: "str 값은 기본 문자열 표현으로 문장에 삽입됩니다." },
            { lines: "8", explanation: "rate:.1f는 float를 소수 첫째 자리 고정 형식으로 표시합니다. 원래 rate 값은 바뀌지 않습니다." },
            { lines: "9", explanation: "쉼표 지정자가 정수의 천 단위 구분자를 만듭니다." },
            { lines: "10", explanation: "= 디버깅 표기가 표현식 텍스트와 repr 값을 함께 보여 줍니다." },
          ],
          run: { environment: ["Python 3.11 이상", "UTF-8 learning_report.py"], command: "python learning_report.py" },
          output: { value: "학습자: 둘리\n진도: 17/40 (42.5%)\n정리한 코드: 1,234,567줄\ncompleted=17, total=40", explanation: ["17/40×100은 42.5이며 .1f 때문에 한 자리로 표시됩니다.", "lines는 int로 유지되고 화면 문자열에만 쉼표가 생깁니다.", "디버깅 줄은 개발 확인에 유용하지만 사용자 최종 화면에는 보통 별도 문장을 사용합니다."] },
          experiments: [
            { change: "두 번째 줄의 f 접두사를 지웁니다.", prediction: "중괄호와 포맷 지정자가 평가되지 않고 그대로 출력됩니다.", result: "진도: {completed}/{total} ({rate:.1f}%)가 문자 그대로 보입니다." },
            { change: "rate 계산을 print 중괄호 안에 직접 넣습니다.", prediction: "결과는 같지만 한 줄이 길어지고 계산만 따로 검사하기 어려워집니다.", result: "동작 가능성과 유지보수 가독성이 별개의 판단이라는 점을 확인합니다." },
          ],
          sourceRefs: ["py-fstring-code", "py-day01-note"],
        },
      ],
      diagnostics: [
        { symptom: "화면에 {name}이 값 대신 그대로 나온다.", likelyCause: "문자열 리터럴 앞의 f 접두사를 빠뜨렸거나 중괄호를 두 번 써서 이스케이프했습니다.", checks: ["시작 따옴표 바로 앞에 f가 있는지 확인합니다.", "{{name}}처럼 중괄호가 두 겹인지 확인합니다.", "출력하려는 것이 실제 값인지 중괄호 문자 자체인지 정합니다."], fix: "값 보간이면 f'{name}', 중괄호 문자면 f'{{name}}'을 사용합니다.", prevention: "예상 출력 한 줄을 테스트로 고정하고 문장 템플릿 변경 시 함께 검증합니다." },
      ],
    },
    {
      id: "conversion-flags",
      title: "기본 표현, !s, !r와 = 디버깅 표기를 구분합니다",
      lead: "사람용 설명은 str, 개발자 진단은 repr 표현이 유용합니다. f-string은 !s와 !r로 어떤 변환을 먼저 적용할지 지정할 수 있습니다.",
      explanations: [
        "f'{value}'와 f'{value!s}'는 str(value)를 사용하고, f'{value!r}'는 repr(value)를 사용합니다. 문자열은 !r에서 따옴표와 이스케이프가 보여 빈 문자열·공백·줄바꿈을 진단하기 좋습니다. 사용자 화면에는 보통 !s가 자연스럽습니다.",
        "f'{x=}'는 표현식 소스와 repr 결과를 함께 만듭니다. x='둘리'라면 x='둘리'처럼 따옴표가 보여 타입 단서를 줍니다. 공백을 포함해 f'{x = }'처럼 적으면 표현식 텍스트의 공백도 출력에 반영될 수 있습니다.",
        "객체의 __str__과 __repr__을 나중에 직접 정의할 수 있습니다. __repr__은 가능하면 모호하지 않은 개발자 표현, __str__은 읽기 좋은 사용자 표현이라는 관례가 있지만 보안 필터가 자동 적용되는 것은 아닙니다.",
      ],
      concepts: [
        { term: "repr", definition: "객체를 개발자가 구분하고 진단하기 좋은 문자열로 표현하는 함수와 관례입니다.", detail: ["문자열의 따옴표와 이스케이프가 드러나 공백 문제를 찾기 좋습니다.", "객체 구현에 따라 비밀 필드가 포함될 수 있으므로 로그 안전성을 별도로 검토합니다."] },
        { term: "디버깅 = 표기", definition: "f-string 표현식의 텍스트와 결과를 함께 출력하는 문법입니다.", detail: ["작은 실험에서 이름과 값을 반복 입력하지 않아도 됩니다.", "최종 사용자 문장보다 임시 진단과 개발 로그에 적합합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: ["dataclass의 자동 repr은 모든 필드를 노출할 수 있습니다. 비밀번호·토큰 필드는 repr=False로 제외하고 로그 정책에서도 재검토합니다."],
    },
    {
      id: "format-mini-language",
      title: "폭·정렬·채움·부호·정밀도를 조합합니다",
      lead: "콜론 뒤 형식 지정자는 하나의 작은 언어입니다. [채움][정렬][부호][폭][그룹][.정밀도][타입] 순서를 이해하면 표와 보고서를 예측 가능하게 만들 수 있습니다.",
      explanations: [
        "문자열은 기본 왼쪽 정렬, 숫자는 기본 오른쪽 정렬입니다. <는 왼쪽, >는 오른쪽, ^는 가운데 정렬이고 앞에 채움 문자를 둘 수 있습니다. f'{name:.<10}'은 폭 10에서 name 뒤를 점으로 채웁니다.",
        "+는 양수에도 부호를 표시하고, 0 채움은 자릿수를 맞출 때 쓸 수 있습니다. 쉼표는 천 단위 구분, _는 밑줄 구분을 제공합니다. d는 십진 정수, b·o·x는 진법, f는 고정 소수점, e는 지수 표기, %는 100을 곱한 백분율 표현입니다.",
        "폭은 최소 폭이지 최대 길이 제한이 아닙니다. 이름이 폭보다 길면 잘리지 않고 전체가 출력되어 표가 밀립니다. 사용자 입력을 표에 넣을 때는 길이 정책, 유니코드 표시 폭, 줄바꿈을 별도로 처리해야 합니다.",
      ],
      concepts: [
        { term: "format specification mini-language", definition: "값의 문자열 표시 방법을 콜론 뒤 짧은 기호로 지정하는 규칙입니다.", detail: ["값 타입에 따라 지원하는 타입 코드가 다릅니다.", "여러 규칙을 한 번에 조합하되 팀에서 자주 쓰는 패턴은 함수로 이름을 부여하면 읽기 쉽습니다."] },
      ],
      codeExamples: [
        {
          id: "fstring-aligned-table",
          title: "고정 폭 학습 진도표 정렬하기",
          language: "python",
          filename: "progress_table.py",
          purpose: "정렬, 폭, 백분율과 천 단위 포맷을 조합해 값과 열 경계를 눈으로 확인합니다.",
          code: `course = 'Python'
completed = 17
total = 40
rate = completed / total
lines = 1234567

print(f'| {"과정":^10} | {"진도":^9} | {"비율":^8} | {"코드":^12} |')
print(f'| {course:<10} | {completed:>2}/{total:<2}   | {rate:>7.1%} | {lines:>11,} |')
print(f'{255:#010x}')`,
          walkthrough: [
            { lines: "1-5", explanation: "계산값을 원래 타입으로 준비합니다. rate는 0.425인 float입니다." },
            { lines: "7", explanation: "문자열 리터럴도 중괄호 안에서 ^10처럼 가운데 정렬할 수 있습니다." },
            { lines: "8", explanation: "과정명은 왼쪽, 숫자는 오른쪽 정렬합니다. .1%는 0.425를 42.5%로 표시하고 쉼표는 코드 줄 수를 구분합니다." },
            { lines: "9", explanation: "#는 0x 접두사를, 010은 총 폭 10과 0 채움을, x는 소문자 16진수 표현을 지정합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "고정 폭 글꼴을 쓰는 터미널 권장"], command: "python progress_table.py" },
          output: { value: "|     과정     |    진도     |    비율    |      코드      |\n| Python     | 17/40   |   42.5% |   1,234,567 |\n0x000000ff", explanation: ["한글의 터미널 표시 폭은 환경에 따라 열 경계가 조금 달라질 수 있지만 문자열 길이 기준 포맷은 동일합니다.", "% 타입은 원래 0.425에 100을 곱한 표시를 만들고 rate를 바꾸지 않습니다.", "#010x는 접두사를 포함한 총 폭을 0으로 채웁니다."] },
          experiments: [
            { change: "course를 'Machine Learning'으로 바꿉니다.", prediction: "폭 10을 넘어도 문자열이 잘리지 않아 표가 오른쪽으로 밀립니다.", result: "폭은 최소값이라는 규칙을 확인하고 길이 제한 정책이 별도임을 알 수 있습니다." },
            { change: "rate의 .1%를 .2f로 바꿉니다.", prediction: "42.5%가 아니라 원래 값 0.42가 표시됩니다.", result: "타입 코드가 값의 표시 의미를 바꾼다는 점을 확인합니다." },
          ],
          sourceRefs: ["py-fstring-code", "py-day01-note"],
        },
      ],
      diagnostics: [
        { symptom: "ValueError: Unknown format code 'f' for object of type 'str'가 발생한다.", likelyCause: ".2f 숫자 포맷을 숫자 문자열에 적용했습니다.", checks: ["포맷 대상에 type 또는 !r 디버깅 출력을 적용합니다.", "외부 입력이 항상 str이라는 사실을 확인합니다.", "빈 문자열·쉼표·단위가 섞였는지 검증합니다."], fix: "입력 경계에서 유효한 숫자 문자열인지 검사한 뒤 float 또는 Decimal로 변환하고 포맷합니다.", prevention: "파싱·계산·표시 단계를 분리하고 잘못된 입력을 포함한 테스트를 둡니다." },
      ],
    },
    {
      id: "dynamic-format-and-nesting",
      title: "표시 규칙도 값으로 만들 수 있지만 단순함을 우선합니다",
      lead: "폭과 정밀도가 실행 중 결정되면 중첩 필드를 사용할 수 있습니다. 강력하지만 한 줄이 복잡해지면 이름 있는 포맷 규칙이나 함수를 선택합니다.",
      explanations: [
        "width=12, precision=3일 때 f'{value:{width}.{precision}f}'처럼 폭과 정밀도를 동적으로 넣을 수 있습니다. 바깥 중괄호는 value 필드, 안쪽 중괄호는 형식 지정자에 들어갈 값을 평가합니다.",
        "동적 형식 문자열을 사용자 입력에서 그대로 받는 것은 허용 규칙을 검토해야 합니다. f-string 자체는 소스에 고정되지만 format(value, user_spec)는 매우 큰 폭처럼 자원 사용을 유발하거나 예상치 못한 표현을 만들 수 있습니다. 허용 목록으로 폭·정밀도 범위를 제한합니다.",
        "번역이 필요한 사용자 문장을 f-string으로 소스에 박아 두면 어순과 복수형 처리가 어렵습니다. 국제화 도구가 관리하는 메시지 키와 매개변수 시스템을 사용하고 숫자·통화·날짜의 locale 규칙을 분리합니다.",
      ],
      concepts: [
        { term: "동적 형식 지정자", definition: "폭·정밀도 같은 포맷 설정을 실행 중 값으로 결정하는 방식입니다.", detail: ["보고서 열 폭과 사용자 설정에 유용합니다.", "허용 범위를 검증하고 지나친 중첩은 읽을 수 있는 함수로 추출합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "문자열 조립 방법을 어떻게 고를까요?", options: [
          { name: "f-string", chooseWhen: "코드에 고정된 짧은 문장 안에 로컬 값을 읽기 좋게 넣을 때", avoidWhen: "번역팀이 관리하는 메시지나 실행 중 외부 템플릿을 사용할 때", tradeoffs: ["가독성과 표현력이 좋습니다.", "표현식이 즉시 평가됩니다.", "Python 소스 밖에서 재사용하기 어렵습니다."] },
          { name: "템플릿·국제화 시스템", chooseWhen: "다국어, 사용자 정의 템플릿, 반복 재사용이 필요할 때", avoidWhen: "간단한 개발자 진단 한 줄에 과도한 구조가 될 때", tradeoffs: ["문장과 데이터를 분리할 수 있습니다.", "누락 변수와 escaping 정책이 필요합니다.", "템플릿 엔진에 따라 보안 모델이 달라집니다."] },
        ] },
      ],
    },
    {
      id: "failures-and-security",
      title: "따옴표·중괄호 오류와 정보 노출을 함께 진단합니다",
      lead: "포맷 문법 오류는 실행 전 SyntaxError로, 타입과 형식 불일치는 실행 중 ValueError로, 민감정보 출력은 오류 없이도 보안 사고로 나타날 수 있습니다.",
      explanations: [
        "닫히지 않은 중괄호와 따옴표는 SyntaxError를 만듭니다. 오류 줄만 보지 말고 바로 앞 줄의 열린 따옴표·괄호까지 확인합니다. 긴 f-string은 여러 이름에 계산 결과를 바인딩하고 문장을 나누면 문법 오류와 중복 호출을 줄일 수 있습니다.",
        "포맷 대상 타입이 규칙과 맞지 않으면 ValueError가 납니다. f'{name:.2f}'에서 name이 str이면 실패합니다. 오류를 f'{name}'으로 무작정 바꾸기 전에 그 값이 원래 숫자여야 하는지, 입력 검증이 빠졌는지 확인합니다.",
        "토큰·비밀번호·주민번호를 f'{user=}'나 f'{request.headers=}'로 출력하면 프로그램은 정상 동작해도 로그에 비밀이 남습니다. 비밀 필드는 애초에 전달하지 않거나 중앙 마스킹 함수를 거치고 로그 보존·접근 권한도 제한해야 합니다.",
      ],
      concepts: [
        { term: "민감정보 마스킹", definition: "로그와 화면에 필요 이상의 비밀값이 남지 않도록 제거하거나 일부만 표시하는 정책입니다.", detail: ["각 개발자가 f-string마다 임의 처리하지 말고 중앙 함수와 구조화 로그 필터를 사용합니다.", "마스킹된 값도 조합하면 식별 가능할 수 있어 최소 수집 원칙이 우선입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "SyntaxError: f-string: expecting '}' 또는 unterminated string 오류가 난다.", likelyCause: "중괄호나 따옴표의 짝이 맞지 않거나 지원 버전에서 복잡한 표현식 문법을 사용했습니다.", checks: ["오류 위치와 바로 앞 줄의 따옴표·중괄호 쌍을 셉니다.", "문자 중괄호를 {{ 또는 }}로 이스케이프했는지 확인합니다.", "python --version과 사용한 f-string 문법의 최소 버전을 확인합니다."], fix: "복잡한 표현식을 이름에 먼저 바인딩하고 단순한 필드로 줄입니다. 문자 중괄호는 두 번 씁니다.", prevention: "포매터와 린터를 사용하고 지원하는 최소 Python 버전으로 CI 문법 검사를 실행합니다." },
        { symptom: "로그에 access_token이나 비밀번호 전체가 출력됐다.", likelyCause: "객체 전체 또는 디버깅 = 표기를 편의상 출력하면서 민감 필드 필터를 적용하지 않았습니다.", checks: ["해당 로그의 보존 위치와 접근자를 확인해 사고 범위를 판단합니다.", "이미 노출된 토큰·비밀번호를 즉시 폐기하거나 회전합니다.", "같은 객체를 출력하는 다른 경로와 예외 추적 시스템을 검색합니다."], fix: "비밀을 회전하고 로그를 허용 범위에서 삭제·격리한 뒤 구조화 로그의 마스킹 필터를 적용합니다.", prevention: "로그 허용 필드를 목록으로 관리하고 secret 탐지 테스트와 코드 리뷰 규칙을 둡니다." },
      ],
      expertNotes: ["성능이 중요한 대량 로그에서는 f-string이 로그 레벨과 무관하게 먼저 평가될 수 있습니다. logging의 지연 포맷 방식을 사용하면 비활성 로그의 계산 비용을 피할 수 있습니다."],
    },
    {
      id: "format-design-checklist",
      title: "읽기 좋은 출력은 데이터 계약에서 시작합니다",
      lead: "좋은 포맷은 예쁜 정렬만이 아니라 타입, 단위, locale, 길이, 민감도와 실패 처리를 명시한 결과입니다.",
      explanations: [
        "출력 코드를 쓰기 전에 대상 독자와 매체를 정합니다. 터미널 표는 고정 폭이 중요하고, CSV는 눈에 보이는 쉼표보다 구조화된 열과 escaping이 중요하며, JSON은 f-string으로 만들면 안 됩니다. HTML에서는 escaping 없는 문자열 삽입이 XSS로 이어질 수 있습니다.",
        "단위는 값과 함께 관리합니다. 42.5가 비율인지 퍼센트인지, 1000이 원인지 달러 센트인지 문장과 이름으로 드러냅니다. 표시에서 %를 사용하면 값에 100이 곱해지므로 이미 42.5인 값을 .1%로 포맷해 4,250.0%를 만드는 이중 변환을 조심합니다.",
        "출력 결과도 테스트할 수 있습니다. 핵심 계산은 숫자로 테스트하고, 사용자에게 중요한 문장만 예상 문자열과 비교합니다. 날짜·locale·터미널 폭처럼 환경에 따라 달라지는 요소는 환경을 고정하거나 구조적 부분을 검사합니다.",
      ],
      concepts: [
        { term: "표시 계약", definition: "누구에게 어떤 매체로 어떤 단위·정밀도·민감도 규칙을 적용해 보여 줄지 정한 약속입니다.", detail: ["원본 데이터 계약과 별개로 관리하되 서로 모순되지 않아야 합니다.", "예제 출력에는 실행 환경과 변동 가능한 부분을 표시합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: ["구조화 로그에서는 사람이 읽는 문장을 전부 조립하기보다 event 이름과 typed field를 전송하고 수집기에서 검색·표시합니다.", "웹 템플릿은 컨텍스트별 escaping을 제공하는 엔진을 사용합니다. f-string은 HTML·SQL·셸 명령의 안전한 템플릿 엔진이 아닙니다."],
    },
  ],
  lab: {
    title: "학습 과정 콘솔 성적표",
    scenario: "여러 기술의 완료 수, 전체 수, 진도율, 코드 줄 수를 정렬된 표로 만들되 원본 값과 표시 문자열을 분리합니다.",
    setup: ["format_dashboard.py를 만듭니다.", "Python 3.11 이상과 고정 폭 터미널을 사용합니다.", "Python·Java·React 세 과정의 값을 이름으로 준비합니다."],
    steps: ["표 머리글의 각 열 폭을 먼저 정합니다.", "진도율은 0~1 float로 계산하고 .1%로 표시합니다.", "코드 줄 수는 int로 유지한 뒤 출력에서만 쉼표를 적용합니다.", "가장 긴 과정명을 넣어 폭 초과 동작을 확인하고 길이 정책을 추가합니다.", "개발자용 repr 진단 한 줄과 사용자용 표를 분리합니다.", "token='secret-demo' 값을 만들되 어느 출력에도 포함되지 않는 테스트를 추가합니다."],
    expectedResult: ["세 과정의 열이 일관된 규칙으로 정렬됩니다.", "표시 후에도 진도율은 float, 코드 줄 수는 int입니다.", "폭을 넘는 이름의 처리 정책과 비밀값 비출력 검사가 코드에 드러납니다."],
    cleanup: ["실제 토큰을 실습 파일·터미널·Git 기록에 넣지 않습니다. demo 문자열만 사용합니다."],
    extensions: ["출력 폭과 소수 자릿수를 명령행 값으로 받아 허용 범위를 검증합니다.", "같은 데이터를 CSV로 저장하면서 화면용 쉼표를 제거한 원본 숫자를 사용합니다.", "한국어·영문 과정명 표시 폭 차이를 기록합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "이름·나이·평균 점수로 한 줄 소개를 만드세요.", requirements: ["f-string 하나로 문장을 만듭니다.", "평균은 소수 둘째 자리, 나이는 d 정수 형식으로 표시합니다.", "각 원본 값의 type이 바뀌지 않았음을 확인합니다."], hints: ["{average:.2f}를 사용합니다.", "포맷 결과를 별도 display 이름에 저장해 type을 비교합니다."], expectedOutcome: "사람용 문장과 계산용 원본 값을 구분할 수 있습니다.", solutionOutline: ["원본 세 값을 바인딩합니다.", "소개 문자열을 새 이름으로 만들고 출력합니다.", "원본과 결과의 type을 확인합니다."] },
    { difficulty: "응용", prompt: "정렬된 상품 가격표를 만드세요.", requirements: ["상품명 왼쪽, 수량 오른쪽, 가격 오른쪽 정렬을 사용합니다.", "가격에 천 단위와 원 단위를 표시합니다.", "긴 상품명과 음수 가격을 넣어 정책을 정합니다."], hints: ["<, >와 폭을 조합합니다.", "폭은 문자열을 자르지 않습니다."], expectedOutcome: "정상 데이터뿐 아니라 폭 초과·음수 경계에 대한 의도가 있는 표가 완성됩니다." },
    { difficulty: "설계", prompt: "운영 로그용 안전한 사용자 이벤트 포맷터를 설계하세요.", requirements: ["허용 필드만 받거나 선택하는 방식을 씁니다.", "email은 일부 마스킹하고 token·password는 절대 출력하지 않습니다.", "!r이 필요한 진단 필드와 사용자용 !s 필드를 구분합니다.", "민감정보가 결과 문자열에 없는 테스트 3개를 작성합니다."], hints: ["객체 전체 repr을 출력하지 마세요.", "문자열 포함 여부를 assert로 검증할 수 있습니다."], expectedOutcome: "편리한 디버깅보다 최소 공개를 우선하는 재사용 가능한 포맷터와 테스트가 만들어집니다." },
  ],
  reviewQuestions: [
    { question: "f'{price:,}'를 실행하면 price의 타입도 str로 바뀌나요?", answer: "아닙니다. 포맷 결과로 새 str이 만들어질 뿐 price가 가리키는 원본 숫자 객체는 그대로입니다." },
    { question: "f'{x=}'와 f'{x}'의 차이는 무엇인가요?", answer: "= 표기는 표현식 텍스트와 repr 값을 함께 보여 주고, 일반 필드는 값의 기본 문자열 표현만 삽입합니다." },
    { question: "{rate:.1%}에서 rate가 0.425이면 무엇이 나오나요?", answer: "42.5%가 나옵니다. % 형식이 값에 100을 곱해 백분율 기호와 함께 표시합니다." },
    { question: "폭 10에 15글자 문자열을 넣으면 잘리나요?", answer: "아닙니다. 폭은 최소 폭이므로 전체 문자열이 출력되고 표가 밀릴 수 있습니다. 자르기 정책은 별도로 구현해야 합니다." },
    { question: "JSON이나 SQL 문장을 f-string으로 만드는 것이 왜 위험한가요?", answer: "각 형식의 escaping·타입·매개변수 규칙을 놓쳐 주입이나 깨진 문서를 만들 수 있습니다. 전용 직렬화기와 매개변수 API를 사용해야 합니다." },
    { question: "logging.debug(f'{expensive()}')의 숨은 비용은 무엇인가요?", answer: "debug 레벨이 꺼져 있어도 f-string과 expensive 호출이 먼저 평가됩니다. 로깅의 지연 포맷과 레벨 검사를 사용합니다." },
  ],
  completionChecklist: [
    "일반 문자열과 f-string의 중괄호 해석 차이를 설명할 수 있다.",
    "중괄호 안 표현식과 함수 호출의 평가 시점을 예측할 수 있다.",
    "!s, !r, = 디버깅 표기를 목적에 맞게 선택할 수 있다.",
    "정렬·폭·정밀도·쉼표·백분율·진법 포맷을 조합할 수 있다.",
    "계산용 원본 값과 표시용 str을 별도 이름으로 유지할 수 있다.",
    "로그에 민감정보가 들어가지 않도록 허용 필드와 테스트를 설계할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-fstring-code", repository: "PYTHON-BASIC", path: "day01/ex02_print.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day01/ex02_print.py", usedFor: ["기본 보간", "표현식과 함수 호출", "= 디버깅", ".2f와 쉼표", "실행 결과"], evidence: "Python 3.13.9에서 원본을 실행해 x=5, y=10, 3.14·3.15, 1,000,000과 1,234,560 결과를 확인했습니다." },
    { id: "py-day01-note", repository: "PYTHON-BASIC", path: "notes/day01_basic.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day01_basic.md", usedFor: ["f-string 기본·표현식", "포맷 지정자 표", "셀프 체크 Q3", "Python 버전 주의"], evidence: "원본 노트의 f-string 범위를 유지하고 정렬·변환 플래그·안전한 로그를 전문가 보강으로 명시했습니다." },
  ],
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["Python 3.14 t-string은 최신 호환 메모로 분리되어 있어 이 f-string 원자 세션에서는 차이만 언급하고 별도 고급 세션으로 남깁니다.", "국제화·구조화 로그·HTML escaping은 원본 공백을 전문가 관점으로 보강했습니다."] },
} satisfies DetailedSession;

export default session;

const advancedChapters: DetailedSession["chapters"] = [
  {
    id: "format-specification-mini-language",
    title: "format specification mini-language를 폭·정렬·부호·정밀도 계약으로 읽습니다",
    lead: "`:` 뒤의 짧은 문자열은 장식이 아니라 fill, alignment, sign, alternate form, zero padding, width, grouping, precision, type을 순서대로 조합하는 작은 언어입니다.",
    explanations: [
      "format field는 대체로 `[[fill]align][sign][z][#][0][width][grouping][.precision][type]`의 순서를 따릅니다. 모든 조각을 외울 필요는 없지만 순서를 바꾸면 ValueError가 날 수 있다는 점과, 폭·정밀도·type의 책임을 구분해야 합니다. 먼저 데이터 타입과 표시 계약을 정한 뒤 가장 단순한 spec부터 한 조각씩 추가합니다.",
      "문자열의 `<`, `>`, `^`는 각각 왼쪽·오른쪽·가운데 정렬이고 바로 앞 한 문자를 fill로 쓸 수 있습니다. `Python:.<10`은 최소 폭 10을 점으로 채우지만 길이 10을 넘는 문자열을 자르지 않습니다. 잘라야 한다면 문자열 precision이나 명시적인 안전한 축약 정책을 별도로 적용해야 합니다.",
      "숫자에서 `+`는 양수에도 부호를 표시하고 `0`과 width는 부호 뒤를 0으로 채웁니다. `#`는 2진·8진·16진수에 `0b`, `0o`, `0x` 접두사를 붙입니다. `+06d`와 `#06x`는 둘 다 여섯 칸이지만 부호와 진법 접두사의 위치가 다르므로 예상 문자열을 직접 테스트합니다.",
      "`,` 또는 `_` grouping은 큰 수를 읽기 쉽게 하지만 저장·계산 값이 아니라 표시 문자열의 일부입니다. CSV에서 쉼표 grouping을 그대로 넣으면 열 구분 escaping이 추가로 필요하고, 기계 간 계약에는 JSON 숫자나 원본 숫자 필드를 사용해야 합니다.",
      "float의 `.2f`는 소수점 아래 두 자리로 반올림해 표시하고 `.1%`는 값에 100을 곱한 뒤 퍼센트 기호를 붙입니다. 반올림된 표시를 다시 계산 입력으로 삼지 말고 원본 수치를 보존합니다. 금융 규칙은 float 표시만으로 결정하지 말고 Decimal과 명시적 rounding policy를 검토합니다.",
      "format protocol은 `format(value, spec)`과 `f'{value:spec}'`가 공유합니다. 사용자 정의 타입은 `__format__`으로 자체 표기 계약을 제공할 수 있지만, 지원하지 않는 spec을 조용히 무시하지 말고 명확한 ValueError를 내는 편이 오타를 빨리 찾습니다.",
      "표의 정렬은 Python 코드 포인트 수와 터미널 표시 폭이 다를 때 어긋날 수 있습니다. 한글·결합 문자·전각 문자·이모지가 섞인 CLI 표는 단순 width만 믿지 말고 대상 터미널에서 검사하거나 표시 폭을 계산하는 전용 계층을 둡니다.",
    ],
    concepts: [
      { term: "format specification mini-language", definition: "값이 문자열로 변환될 때 정렬·폭·정밀도·표현 형식을 지시하는 `:` 뒤의 규칙입니다.", detail: ["값의 타입은 바꾸지 않습니다.", "잘못된 조합은 보통 ValueError를 만듭니다."] },
      { term: "minimum field width", definition: "출력 필드가 차지할 최소 문자 수이며 값이 더 길 때 자르는 최대 길이가 아닙니다.", detail: ["정렬과 fill이 남는 공간에 적용됩니다.", "초과 길이 정책은 별도로 설계합니다."] },
      { term: "presentation type", definition: "d, f, e, x, %처럼 값의 최종 표현 종류를 선택하는 spec의 마지막 요소입니다.", detail: ["대상 타입과 호환되어야 합니다.", "표시와 계산 계약을 분리합니다."] },
    ],
    codeExamples: [{
      id: "python-format-spec-matrix",
      title: "정수·실수·문자열의 format spec을 한 화면에서 검산합니다",
      language: "python",
      filename: "format_matrix.py",
      purpose: "부호와 접두사까지 폭에 포함되는 방식, 최소 폭, grouping과 percent 변환을 exact output으로 확인합니다.",
      code: "value = 12345.678\ncount = 42\nname = 'Python'\n\nprint(f'number={value:,.2f}|signed={count:+06d}|hex={count:#06x}')\nprint(f'text={name:.<10}|center={name:*^10}|percent={0.125:.1%}')",
      walkthrough: [
        { lines: "1-3", explanation: "계산용 float·int와 표시할 str을 원본 타입 그대로 둡니다." },
        { lines: "5", explanation: "grouping·precision, sign-aware zero padding, alternate hexadecimal form을 비교합니다." },
        { lines: "6", explanation: "문자열 fill·가운데 정렬과 비율의 percent 표시를 확인합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "locale에 의존하지 않는 고정 spec"], command: "python format_matrix.py" },
      output: { value: "number=12,345.68|signed=+00042|hex=0x002a\ntext=Python....|center=**Python**|percent=12.5%", explanation: ["width에는 부호와 0x 접두사도 포함됩니다.", "문자열 폭은 최소 폭이고 percent는 0.125를 12.5%로 표시합니다."] },
      experiments: [
        { change: "name을 'LongPythonName'으로 바꿉니다.", prediction: "폭 10을 넘겨도 잘리지 않고 전체가 출력됩니다.", result: "width가 maximum length가 아님을 확인합니다." },
        { change: "value에 `.2e`를 적용합니다.", prediction: "1.23e+04 형태의 과학 표기법이 됩니다.", result: "같은 원본 값에 presentation type만 바뀝니다." },
        { change: "문자열 name에 `d`를 적용합니다.", prediction: "ValueError가 발생합니다.", result: "type과 presentation type 호환성을 경계에서 검증합니다." },
      ],
      sourceRefs: ["python-format-spec-006", "python-builtins-format-006", "python-string-format-006"],
    }],
    diagnostics: [
      { symptom: "`ValueError: Invalid format specifier`가 발생합니다.", likelyCause: "spec 요소 순서가 틀렸거나 값 타입이 해당 presentation type을 지원하지 않습니다.", checks: ["value의 type과 repr을 봅니다.", "spec을 width·precision·type으로 분해합니다.", "요소를 하나씩 제거해 실패하는 최소 spec을 찾습니다."], fix: "공식 mini-language 순서로 spec을 다시 구성하고 타입별 지원 형식을 적용합니다.", prevention: "표시 계약별 대표값·음수·0·긴 문자열을 exact output으로 테스트합니다." },
      { symptom: "폭을 지정했는데 긴 값 때문에 표의 열이 밀립니다.", likelyCause: "width를 최대 길이나 자동 truncate 기능으로 오해했습니다.", checks: ["입력의 len과 지정 width를 비교합니다.", "초과값의 업무 정책을 확인합니다.", "한글·이모지의 실제 표시 폭도 확인합니다."], fix: "명시적인 축약·줄바꿈·열 확장 중 하나를 선택하고 원본 보존 및 생략 표시 규칙을 둡니다.", prevention: "가장 긴 정상값과 비정상 초과값을 UI/터미널 통합 테스트에 포함합니다." },
    ],
  },
  {
    id: "dynamic-format-policy-and-internationalization",
    title: "동적 format spec은 허용 목록으로 제한하고 locale 책임을 표시 계층에 둡니다",
    lead: "폭과 정밀도를 실행 중 바꿀 수 있다는 사실은 임의 문자열을 spec으로 받아도 된다는 뜻이 아니며, 국제화된 숫자·날짜 표시는 별도의 정책과 테스트가 필요합니다.",
    explanations: [
      "f-string은 format spec 안에도 대체 필드를 둘 수 있어 `f'{value:{width}.{precision}f}'`처럼 폭과 정밀도를 계산할 수 있습니다. 중첩이 깊어지면 읽기와 검증이 어려워지므로 width·precision을 먼저 정수로 검증하고 spec 이름을 만들어 `format`에 전달하는 편이 진단하기 쉽습니다.",
      "외부 사용자가 임의 spec을 전달하면 예상치 못한 아주 큰 width로 메모리와 로그를 부풀리거나 객체의 custom `__format__` 경로를 호출할 수 있습니다. `compact`, `report` 같은 의미 있는 profile을 허용 목록의 고정 spec에 매핑하고 길이·정밀도 상한을 둡니다.",
      "Python의 기본 `,` grouping과 `.` decimal point는 일관된 기술 출력에는 좋지만 모든 언어권의 숫자 표기 규칙을 해결하지 않습니다. `n` presentation type은 현재 locale 설정의 영향을 받으며 프로세스 전역 locale 변경은 같은 프로세스의 다른 thread와 라이브러리에 영향을 줄 수 있습니다.",
      "locale 기반 출력은 개발 장비와 CI에서 사용 가능한 locale 이름이 다를 수 있습니다. 정확한 사용자 지역화가 필요하면 요청별 locale을 지원하는 국제화 라이브러리·프레임워크 계층을 사용하고, 학습 예제의 exact output은 locale-neutral spec으로 고정합니다.",
      "날짜·시간의 f-string도 결국 대상 객체의 `__format__`을 호출합니다. datetime format code는 숫자 mini-language와 다른 문법을 사용하므로 같은 `:.2f` 사고를 적용하지 않습니다. timezone-aware 값, locale 이름, 서머타임과 ISO 기계 계약을 분리합니다.",
      "표시 profile은 데이터 단위와 함께 버전 관리합니다. 예를 들어 ratio 원본 0.125를 compact에서 12.5%, export에서 0.125로 내보낸다면 profile 이름·단위·정밀도와 rounding 기대를 테스트에 기록합니다.",
      "동적 포맷 결과가 다시 parser 입력이 되면 grouping·공백·통화기호 때문에 복원이 불안정합니다. 계산과 직렬화에는 typed value를 유지하고, 포맷된 문자열은 최종 사용자 경계에서만 만듭니다.",
    ],
    concepts: [
      { term: "dynamic format spec", definition: "폭·정밀도·표현 규칙을 실행 중 선택해 `format` 또는 중첩 필드에 전달하는 spec입니다.", detail: ["숫자 범위를 먼저 검증합니다.", "외부 입력은 allowlist profile로 변환합니다."] },
      { term: "locale-neutral output", definition: "실행 장비의 지역 설정과 무관하게 같은 구두점·숫자·날짜 표현을 내는 기계적 표시 계약입니다.", detail: ["테스트와 프로토콜에 적합합니다.", "사용자 지역화와 목적이 다릅니다."] },
      { term: "presentation profile", definition: "compact·report·export처럼 매체별 폭·정밀도·단위를 이름 있는 정책으로 묶은 것입니다.", detail: ["임의 spec보다 검토하기 쉽습니다.", "상한과 예상 출력을 함께 둡니다."] },
    ],
    codeExamples: [{
      id: "python-dynamic-format-allowlist",
      title: "동적 폭·정밀도와 허용된 표시 profile을 분리합니다",
      language: "python",
      filename: "dynamic_format.py",
      purpose: "검증된 숫자 중첩 spec과 사용자 선택 profile allowlist의 경계를 exact output으로 보여 줍니다.",
      code: "value = 12.3456\nwidth = 10\nprecision = 3\ndynamic = f'{value:{width}.{precision}f}'\nprint(f'dynamic={dynamic!r}')\n\nprofiles = {'compact': '.2f', 'report': '12,.2f'}\nfor name in ('compact', 'report'):\n    spec = profiles[name]\n    print(f'{name}|spec={spec!r}|value={format(value, spec)!r}')\n\ntry:\n    profile = 'raw-user-spec'\n    if profile not in profiles:\n        raise ValueError('unknown profile')\nexcept ValueError as error:\n    print(f'rejected={type(error).__name__}:{error}')",
      walkthrough: [
        { lines: "1-5", explanation: "정수 width와 precision으로 중첩 spec을 구성하고 repr로 공백까지 관찰합니다." },
        { lines: "7-10", explanation: "외부 이름은 두 개의 검토된 고정 spec 중 하나로만 매핑됩니다." },
        { lines: "12-17", explanation: "알 수 없는 profile은 임의 spec으로 실행하지 않고 안정된 업무 오류로 바꿉니다." },
      ],
      run: { environment: ["Python 3.11 이상", "locale-neutral format spec"], command: "python dynamic_format.py" },
      output: { value: "dynamic='    12.346'\ncompact|spec='.2f'|value='12.35'\nreport|spec='12,.2f'|value='       12.35'\nrejected=ValueError:unknown profile", explanation: ["폭 10에는 네 공백이 생깁니다.", "report 폭 12에는 일곱 공백이 생깁니다.", "알 수 없는 입력은 실행되지 않습니다."] },
      experiments: [
        { change: "width를 1_000_000으로 요청합니다.", prediction: "허용한다면 거대한 문자열이 만들어질 수 있습니다.", result: "width 상한 검증이 resource policy임을 확인합니다." },
        { change: "precision을 -1로 바꿉니다.", prediction: "구성된 spec이 유효하지 않아 오류가 납니다.", result: "0 이상 업무 상한 이하로 먼저 검증합니다." },
        { change: "profiles에 percent='.1%'를 추가하고 0.125를 넣습니다.", prediction: "12.5%가 됩니다.", result: "profile에 입력 단위도 함께 문서화합니다." },
      ],
      sourceRefs: ["python-format-spec-006", "python-builtins-format-006", "python-locale-006"],
    }],
    diagnostics: [
      { symptom: "사용자 입력 뒤 로그 한 줄이 수백 MB로 커집니다.", likelyCause: "검증하지 않은 동적 width를 그대로 format spec에 넣었습니다.", checks: ["spec 입력 출처와 최대 길이를 확인합니다.", "width·precision을 숫자로 파싱한 위치를 찾습니다.", "custom __format__ 호출 가능성을 봅니다."], fix: "외부 선택을 고정 profile allowlist로 매핑하고 폭·정밀도·결과 길이 상한을 적용합니다.", prevention: "최대·최대+1·비숫자·알 수 없는 profile을 resource-limit 테스트에 포함합니다." },
      { symptom: "개발 PC와 서버의 숫자 구분자가 다릅니다.", likelyCause: "`n` 형식이나 locale-aware API가 프로세스 환경 설정에 의존합니다.", checks: ["현재 locale과 환경 변수를 기록합니다.", "사용한 presentation type을 확인합니다.", "CI와 운영체제의 설치 locale을 비교합니다."], fix: "기계 계약은 locale-neutral 형식으로 고정하고 사용자 표시는 요청별 국제화 계층에서 생성합니다.", prevention: "지원 locale별 golden test와 locale-neutral export test를 분리합니다." },
    ],
  },
  {
    id: "formatting-security-structured-boundaries",
    title: "f-string을 HTML·JSON·SQL·shell escaping 도구로 오해하지 않습니다",
    lead: "문자열 보간은 값을 붙일 뿐 출력 컨텍스트의 문법과 공격 경계를 알지 못하므로 전용 인코더·매개변수 API·구조화 로깅이 필요합니다.",
    explanations: [
      "f-string은 `<`, `&`, 따옴표를 HTML 문맥에 맞게 escape하지 않습니다. 텍스트 노드와 attribute·URL·script context의 규칙도 서로 다릅니다. 웹 프레임워크의 auto-escaping template을 기본으로 하고, 낮은 수준의 단순 텍스트 경계에서만 `html.escape` 같은 전용 함수를 씁니다.",
      "JSON을 `f'{{\"message\": \"{message}\"}}'`로 만들면 따옴표·역슬래시·개행·제어 문자에서 문서가 깨지거나 구조가 바뀝니다. `json.dumps`는 문자열 escaping과 타입·Unicode·중첩 구조를 함께 처리하므로 dict/list 같은 typed 구조를 전달합니다.",
      "SQL 값은 f-string으로 붙이지 않고 DB driver의 parameter binding을 사용합니다. 식별자와 값의 문법은 다르며 placeholder 자체에도 따옴표를 덧씌우지 않습니다. table/column 이름이 동적이면 driver의 identifier API나 검토된 allowlist가 필요합니다.",
      "shell command도 하나의 f-string을 만들어 실행하지 않습니다. 가능하면 subprocess에 argument list를 전달하고 shell=False를 유지합니다. 출력용 `shlex.join`은 명령 표시를 돕지만 모든 운영체제 shell 실행의 안전성 계약을 대신하지 않습니다.",
      "로그에서 f-string은 비활성 level이어도 표현식과 함수 호출을 먼저 평가합니다. `logging.debug('user_id=%s', user_id)` 같은 지연 formatting은 불필요한 변환을 줄이지만, 비밀번호·token을 전달해도 된다는 뜻은 아닙니다. 허용 필드와 중앙 redaction이 먼저입니다.",
      "`!r`은 개행과 제어 문자를 눈에 보이게 해 진단에 유용하지만 비밀을 제거하거나 log injection을 완전히 막는 sanitizer가 아닙니다. 데이터 최소화·길이 제한·제어 문자 정책·구조화 필드를 함께 적용합니다.",
      "표시 테스트는 정상 문장뿐 아니라 따옴표, `<>&`, 역슬래시, 개행, 한글, 매우 긴 값과 비밀 marker를 포함해야 합니다. 결과가 문법적으로 유효한지 전용 parser로 다시 읽고, 금지된 비밀이 결과에 없음을 assert합니다.",
    ],
    concepts: [
      { term: "contextual escaping", definition: "HTML·JSON·SQL·shell처럼 서로 다른 출력 문맥의 문법에 맞춰 특별 문자를 안전하게 표현하는 처리입니다.", detail: ["한 문맥의 escape를 다른 문맥에 재사용하지 않습니다.", "전용 encoder나 parameter API를 사용합니다."] },
      { term: "structured logging", definition: "완성 문장 하나 대신 event 이름과 typed fields를 분리해 로깅 시스템에 전달하는 방식입니다.", detail: ["검색과 redaction이 쉬워집니다.", "민감 필드 allowlist가 여전히 필요합니다."] },
      { term: "lazy logging formatting", definition: "log record가 실제 처리될 때 인자와 형식 문자열을 결합하도록 미루는 방식입니다.", detail: ["비활성 level 비용을 줄입니다.", "민감정보 보호 기능은 아닙니다."] },
    ],
    codeExamples: [{
      id: "python-context-encoders",
      title: "같은 입력을 개발자 표시·HTML 텍스트·JSON 문서에 각각 맞게 변환합니다",
      language: "python",
      filename: "context_encoders.py",
      purpose: "f-string repr, HTML escaping, JSON serialization이 서로 다른 계약임을 exact output과 parser round-trip으로 증명합니다.",
      code: "import html\nimport json\n\nmessage = '<b title=\"x\">가</b>\\nnext'\nhtml_text = html.escape(message, quote=True)\npayload = json.dumps({'message': message}, ensure_ascii=False, sort_keys=True)\n\nprint(f'display={message!r}')\nprint(f'html={html_text!r}')\nprint(f'json={payload}')\nprint(f'roundtrip={json.loads(payload)[\"message\"] == message}')",
      walkthrough: [
        { lines: "1-3", explanation: "각 출력 문맥을 담당하는 표준 라이브러리를 import합니다." },
        { lines: "5-7", explanation: "HTML은 markup 특수 문자를 escape하고 JSON은 dict를 문서로 직렬화합니다." },
        { lines: "9-11", explanation: "repr로 보이지 않는 개행을 드러내고 JSON parser로 원본 복원을 검사합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 라이브러리 html·json"], command: "python context_encoders.py" },
      output: { value: "display='<b title=\"x\">가</b>\\nnext'\nhtml='&lt;b title=&quot;x&quot;&gt;가&lt;/b&gt;\\nnext'\njson={\"message\": \"<b title=\\\"x\\\">가</b>\\nnext\"}\nroundtrip=True", explanation: ["repr의 backslash-n은 한 줄 로그에서 개행 경계를 보입니다.", "HTML과 JSON은 서로 다른 문자 집합과 구조를 처리합니다.", "JSON 결과는 전용 parser로 원본을 복원합니다."] },
      experiments: [
        { change: "message에 `&`와 tab을 추가합니다.", prediction: "HTML은 &amp;를 만들고 JSON은 tab을 escape합니다.", result: "문맥별 encoder가 다른 규칙을 적용합니다." },
        { change: "dict를 f-string으로 직접 JSON처럼 출력합니다.", prediction: "Python repr의 작은따옴표 때문에 일반적인 JSON이 아닙니다.", result: "serializer를 대체할 수 없음을 확인합니다." },
        { change: "message에 demo token marker를 넣고 금지 assert를 추가합니다.", prediction: "허용 필드 정책이 없다면 그대로 남습니다.", result: "escaping과 redaction은 별도 책임입니다." },
      ],
      sourceRefs: ["python-html-escape-006", "python-json-006", "python-logging-006"],
    }],
    diagnostics: [
      { symptom: "사용자 이름의 따옴표 때문에 JSON parse가 실패합니다.", likelyCause: "JSON 문자열을 f-string으로 직접 조립해 escape와 타입 규칙을 빠뜨렸습니다.", checks: ["결과를 json.loads로 읽어 봅니다.", "문자열 연결·f-string JSON 생성을 검색합니다.", "따옴표·역슬래시·개행 fixture를 넣습니다."], fix: "dict/list 구조를 만들고 json.dumps 또는 framework serializer를 사용합니다.", prevention: "직렬화 결과 round-trip과 schema test를 둡니다." },
      { symptom: "HTML 화면에서 입력이 태그로 실행되거나 구조를 깨뜨립니다.", likelyCause: "f-string 보간을 HTML escaping으로 오해했거나 safe 표시를 잘못 지정했습니다.", checks: ["값이 들어간 HTML context를 확인합니다.", "template auto-escape 설정과 safe bypass를 찾습니다.", "`<>&\"'` 입력으로 재현합니다."], fix: "context-aware auto-escaping template을 사용하고 raw HTML 허용은 별도 sanitizer와 엄격한 정책으로 제한합니다.", prevention: "XSS 경계 테스트와 safe bypass 코드 리뷰 규칙을 둡니다." },
    ],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...advancedChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "python-format-spec-006", repository: "Python Language Reference", path: "Format Specification Mini-Language", publicUrl: "https://docs.python.org/3/library/string.html#format-specification-mini-language", usedFor: ["format spec grammar", "alignment", "width", "precision", "presentation types"], evidence: "형식 지정자의 순서와 타입별 표시 규칙을 공식 표준 라이브러리 문서로 확인했습니다." },
  { id: "python-fstring-lexical-006", repository: "Python Language Reference", path: "Formatted string literals", publicUrl: "https://docs.python.org/3/reference/lexical_analysis.html#f-strings", usedFor: ["f-string lexical grammar", "replacement fields", "conversion", "nested fields"], evidence: "f-string의 중괄호·변환·중첩 필드 구문을 공식 언어 레퍼런스로 확인했습니다." },
  { id: "python-builtins-format-006", repository: "Python Standard Library", path: "Built-in Functions — format", publicUrl: "https://docs.python.org/3/library/functions.html#format", usedFor: ["format built-in", "__format__ dispatch", "dynamic spec"], evidence: "format(value, spec)이 타입의 __format__ protocol을 사용하는 공식 계약을 확인했습니다." },
  { id: "python-string-format-006", repository: "Python Standard Library", path: "Custom String Formatting", publicUrl: "https://docs.python.org/3/library/string.html#custom-string-formatting", usedFor: ["Formatter", "field parsing", "format customization"], evidence: "format string parsing과 확장 지점의 공식 범위를 확인했습니다." },
  { id: "python-locale-006", repository: "Python Standard Library", path: "locale — Internationalization services", publicUrl: "https://docs.python.org/3/library/locale.html", usedFor: ["locale-sensitive n format", "process locale", "internationalization boundary"], evidence: "locale 설정의 프로세스 범위와 지역화 출력 주의점을 공식 문서로 확인했습니다." },
  { id: "python-html-escape-006", repository: "Python Standard Library", path: "html.escape", publicUrl: "https://docs.python.org/3/library/html.html#html.escape", usedFor: ["HTML special characters", "quote escaping", "context boundary"], evidence: "HTML 텍스트의 기본 특수 문자 변환 API를 공식 문서로 확인했습니다." },
  { id: "python-json-006", repository: "Python Standard Library", path: "json — JSON encoder and decoder", publicUrl: "https://docs.python.org/3/library/json.html", usedFor: ["JSON serialization", "ensure_ascii", "round-trip parsing"], evidence: "typed Python 구조를 JSON으로 인코딩하고 다시 디코딩하는 공식 API를 확인했습니다." },
  { id: "python-logging-006", repository: "Python Standard Library", path: "logging — Logging facility", publicUrl: "https://docs.python.org/3/library/logging.html", usedFor: ["lazy formatting", "log levels", "structured field boundary"], evidence: "logging 호출에서 format 문자열과 arguments를 분리하는 공식 API를 확인했습니다." },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "format width는 문자열을 지정 길이로 잘라 주나요?", answer: "아닙니다. 최소 폭이므로 더 긴 값은 전체가 출력되고 축약 정책은 따로 구현해야 합니다." },
  { question: "`+06d`에서 부호도 여섯 칸에 포함되나요?", answer: "포함됩니다. 42는 +00042로 표시됩니다." },
  { question: "`.1%`는 값 0.125를 어떻게 표시하나요?", answer: "100을 곱한 표시값 12.5%를 만듭니다. 원본 float는 바뀌지 않습니다." },
  { question: "외부 사용자의 format spec을 그대로 받아도 되나요?", answer: "큰 폭과 custom format 경로 등 위험이 있으므로 검토된 profile allowlist와 수치 상한을 사용합니다." },
  { question: "`n` 형식이 모든 서버에서 같은 출력인가요?", answer: "현재 locale의 영향을 받으므로 기계 계약의 exact output에는 locale-neutral 형식을 사용합니다." },
  { question: "f-string으로 JSON을 만들면 어떤 입력에서 깨지나요?", answer: "따옴표·역슬래시·개행·제어 문자와 중첩 타입에서 깨질 수 있어 json.dumps를 사용합니다." },
  { question: "html.escape 결과를 SQL에도 쓸 수 있나요?", answer: "아닙니다. 출력 문맥마다 문법이 다르며 SQL 값은 driver parameter binding을 사용합니다." },
  { question: "`!r`이 민감정보를 안전하게 마스킹하나요?", answer: "아닙니다. 보이지 않는 문자를 드러낼 뿐 비밀 제거는 allowlist와 redaction 책임입니다." },
  { question: "logging의 지연 formatting이 해결하지 못하는 문제는 무엇인가요?", answer: "비활성 로그의 계산 비용은 줄일 수 있지만 전달한 token·password 노출은 막지 못합니다." },
);

(session.completionChecklist as string[]).push(
  "format spec의 fill·alignment·sign·width·precision·type 역할을 분해한다.",
  "width가 최소 폭이고 truncate 정책이 아님을 긴 값으로 검증했다.",
  "부호·진법 접두사·0 padding의 정확한 결과를 예측한다.",
  "동적 width·precision에 범위 검증과 profile allowlist를 적용한다.",
  "locale-neutral 기계 출력과 사용자 국제화 표시를 분리한다.",
  "HTML·JSON·SQL·shell에 각각 전용 경계 API를 선택한다.",
  "json.dumps 결과를 json.loads로 round-trip 검증한다.",
  "escaping과 민감정보 redaction이 다른 책임임을 설명한다.",
  "logging 지연 formatting의 성능 이점과 보안 한계를 구분한다.",
);
