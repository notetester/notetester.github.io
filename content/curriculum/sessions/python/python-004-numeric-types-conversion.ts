import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-004"],
  slug: "python-004-numeric-types-conversion",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 4,
  title: "숫자형·진법·형 변환",
  subtitle: "int·float·complex가 같은 ‘숫자’이면서도 저장 방식과 가능한 연산이 다른 이유를 확인하고, 변환·반올림·표시를 구분합니다.",
  level: "입문",
  estimatedMinutes: 100,
  coreQuestion: "숫자를 정확히 계산하고 표시하려면 int, float, complex와 형 변환을 어떻게 구분해야 할까요?",
  summary: "정수·실수·복소수 객체, 과학적 표기와 8·16진수 리터럴, int/float 변환을 실제 출력으로 관찰합니다. 특히 int 변환의 0 방향 절삭, 소수 표시 포맷과 원래 값의 차이, 부동소수점 오차를 진단하는 법까지 연결합니다.",
  objectives: [
    "int, float, complex 리터럴을 만들고 type과 각 타입의 역할을 설명할 수 있다.",
    "지수 표기, 8진수와 16진수 표기를 읽고 실제 정수 값으로 변환할 수 있다.",
    "float와 int 사이 변환이 새 객체를 만들며 어떤 정보가 사라지는지 예측할 수 있다.",
    "절삭, 반올림, 문자열 표시 형식을 서로 다른 작업으로 구분할 수 있다.",
    "금액·측정값·신호 데이터에 맞는 숫자 표현을 선택하고 부동소수점 오차를 진단할 수 있다.",
  ],
  prerequisites: [
    { title: "첫 스크립트 실행과 출력", reason: "숫자 객체와 type 결과를 print와 f-string으로 관찰합니다.", sessionSlug: "python-001-output-names-types" },
    { title: "변수와 동적 타입", reason: "이름에 숫자 객체를 바인딩하고 변환 결과를 다른 이름으로 받는 흐름을 이해하면 좋습니다.", sessionSlug: "python-002-variables-dynamic-types" },
  ],
  keywords: ["Python", "int", "float", "complex", "부동소수점", "진법", "형 변환", "절삭", "반올림", "Decimal"],
  chapters: [
    {
      id: "numeric-family",
      title: "하나의 숫자형이 아니라 세 가지 핵심 타입입니다",
      lead: "18, 18.0, 18+0j는 수학적으로 비슷해 보여도 Python에서는 각각 int, float, complex 객체이며 표현 범위와 계산 규칙이 다릅니다.",
      explanations: [
        "정수 리터럴 18은 int, 소수점이 있는 18.0과 지수 표기 1.8e1은 float, j를 포함한 18+0j는 complex입니다. type을 찍으면 객체의 타입을 직접 확인할 수 있습니다. 이름에 타입을 선언하지 않아도 오른쪽 표현식이 만든 객체의 타입은 분명히 존재합니다.",
        "서로 다른 숫자 타입을 연산하면 정보 범위를 보존하는 방향으로 결과 타입이 넓어질 수 있습니다. 예를 들어 int와 float를 더하면 float가 되고, float와 complex를 더하면 complex가 됩니다. 이를 무조건적인 자동 변환으로 오해해서는 안 됩니다. 숫자 문자열 '18'은 숫자 타입이 아니므로 18과 바로 더할 수 없습니다.",
        "타입 선택은 데이터의 의미에서 시작합니다. 개수와 순번처럼 분수가 허용되지 않는 값은 int가 자연스럽고, 길이와 평균처럼 연속적인 근삿값은 float가 편리합니다. 회전·주파수 영역처럼 실수부와 허수부가 필요한 과학 계산에서는 complex가 유용합니다.",
      ],
      concepts: [
        { term: "숫자형 계층", definition: "Python이 수를 표현하는 관련 타입들의 체계입니다.", detail: ["입문에서 int, float, complex를 먼저 다루며 bool도 int의 하위 타입이라는 특성이 있지만 논리 의미가 우선입니다.", "연산자는 피연산자의 타입에 따라 지원 여부와 반환 타입이 정해집니다."], caveat: "숫자로 보이는 문자열은 숫자 객체가 아닙니다. 외부 입력은 검증 후 명시적으로 변환해야 합니다." },
      ],
      codeExamples: [],
      diagnostics: [],
    },
    {
      id: "integer-model",
      title: "int는 개수와 정확한 정수 계산의 기본입니다",
      lead: "Python의 int는 고정 32비트 범위에 갇힌 Java int와 달리 메모리가 허용하는 범위에서 큰 정수를 표현합니다.",
      explanations: [
        "정수에는 소수 부분이 없습니다. 양수·0·음수를 정확히 표현하고 덧셈·곱셈 결과도 정수인 동안 반올림 오차가 생기지 않습니다. Python int는 임의 정밀도를 사용하므로 매우 큰 값을 계산하면 OverflowError로 즉시 넘치는 대신 더 많은 메모리와 계산 시간이 필요합니다.",
        "개수, 데이터베이스 식별자, 원 단위 금액처럼 정확한 정수 의미가 있는 값에는 int가 적합합니다. 그러나 나눗셈 /은 두 int를 받아도 float를 반환합니다. 정수 몫이 필요할 때는 //를 쓰되 음수에서 아래쪽으로 내림한다는 규칙은 연산자 세션에서 따로 확인합니다.",
      ],
      concepts: [
        { term: "임의 정밀도 정수", definition: "고정된 몇 비트 범위가 아니라 필요한 만큼 자릿수를 늘려 표현하는 정수입니다.", detail: ["아주 큰 정수도 값 자체는 정확하지만 자릿수가 늘수록 메모리와 시간이 증가합니다.", "외부 시스템의 32·64비트 정수 열에 저장할 때는 그 시스템 범위를 별도로 확인해야 합니다."], analogy: "칸 수가 고정된 계수기보다 숫자가 커질 때 종이를 이어 붙이는 기록지에 가깝습니다." },
      ],
      codeExamples: [
        {
          id: "numeric-types-observation",
          title: "정수·실수·복소수의 타입과 구성 요소 관찰",
          language: "python",
          filename: "numeric_types.py",
          purpose: "원본 ex05_number.py의 대표 값을 한 번에 실행해 리터럴 표기와 실제 타입을 연결합니다.",
          code: "age = 18\nweight = 72.14\nsignal = 415 + 34j\nheight = 1.817e2\n\nprint(f'{age=}, {type(age)=}')\nprint(f'{weight=}, {type(weight)=}')\nprint(f'{signal=}, {type(signal)=}')\nprint(f'{signal.real=}, {signal.imag=}')\nprint(f'{height=}, {type(height)=}')",
          walkthrough: [
            { lines: "1", explanation: "소수점 없는 18 리터럴이 int 객체를 만들고 age 이름이 그 객체를 가리킵니다." },
            { lines: "2", explanation: "72.14는 float 리터럴입니다. 화면의 십진 표기와 내부 이진 부동소수점 표현은 구분해야 합니다." },
            { lines: "3", explanation: "j가 허수 단위를 나타내며 complex 객체를 만듭니다. Python 문법에서는 수학책의 i 대신 j를 씁니다." },
            { lines: "4", explanation: "1.817e2는 1.817×10²이고 결과 타입은 float입니다." },
            { lines: "6-10", explanation: "f-string의 = 표기로 이름과 값을 함께 확인합니다. complex의 real과 imag 속성은 float 값을 반환합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "numeric_types.py를 UTF-8로 저장"], command: "python numeric_types.py" },
          output: { value: "age=18, type(age)=<class 'int'>\nweight=72.14, type(weight)=<class 'float'>\nsignal=(415+34j), type(signal)=<class 'complex'>\nsignal.real=415.0, signal.imag=34.0\nheight=181.7, type(height)=<class 'float'>", explanation: ["복소수 전체는 complex지만 real과 imag 구성 요소는 float로 관찰됩니다.", "지수 표기는 입력 표기 방식이며 height 값의 일반 출력은 181.7입니다.", "f-string 출력 형식이 객체의 타입을 바꾸지는 않습니다."] },
          experiments: [
            { change: "print(type(age + weight))를 추가합니다.", prediction: "int와 float의 연산 결과가 float로 확장됩니다.", result: "<class 'float'>가 출력됩니다." },
            { change: "very_large = 10 ** 100을 만들고 출력합니다.", prediction: "32·64비트 범위를 넘어도 1 뒤에 0이 100개인 int가 출력됩니다.", result: "Python int의 임의 정밀도를 확인하되, 큰 계산이 비용 없이 무한하다는 뜻은 아닙니다." },
          ],
          sourceRefs: ["py-number-types"],
        },
      ],
      diagnostics: [],
      expertNotes: ["정확한 정수라도 JSON을 거쳐 JavaScript Number로 전달하면 2^53-1보다 큰 값의 정밀도가 깨질 수 있습니다. 시스템 경계에서는 문자열 또는 BigInt 호환 규약을 설계합니다."],
    },
    {
      id: "float-model",
      title: "float는 실수를 완벽히 저장하는 통이 아닙니다",
      lead: "대부분의 Python float는 IEEE 754 배정밀도 이진 부동소수점이며, 많은 십진 소수를 정확히 표현하지 못하고 가장 가까운 이진 값으로 저장합니다.",
      explanations: [
        "0.1을 이진수로 유한하게 나타낼 수 없기 때문에 0.1 + 0.2 == 0.3이 False가 되는 유명한 결과가 생깁니다. 이것은 Python의 계산 실수가 아니라 제한된 비트로 실수를 근사하는 표준 방식의 결과입니다. 일반 측정·통계·그래픽 계산에서는 빠르고 충분하지만, 정확한 십진 규칙이 필요한 금액에서는 주의해야 합니다.",
        "float를 비교할 때 계산 과정을 거친 값에 단순 ==를 적용하지 말고 math.isclose로 허용 오차를 명시할 수 있습니다. 테스트에서는 pytest.approx 같은 도구도 사용합니다. 허용 오차는 무작정 크게 두는 값이 아니라 데이터 크기와 업무 요구에서 정해야 합니다.",
        "NaN과 양·음의 무한대도 float가 표현할 수 있는 특수 값입니다. NaN은 자기 자신과도 같지 않으므로 value == float('nan')으로 검사하면 안 되고 math.isnan을 사용합니다. 데이터 분석에서 결측과 무한값은 집계 결과를 오염시킬 수 있어 입력 경계에서 확인해야 합니다.",
      ],
      concepts: [
        { term: "부동소수점", definition: "제한된 비트로 부호·유효숫자·지수를 저장해 매우 넓은 범위의 실수를 근사하는 표현입니다.", detail: ["표현 범위와 속도에 강점이 있지만 모든 십진 소수를 정확히 담지는 못합니다.", "출력에서 짧게 보이는 값은 Python이 읽기 좋은 십진 문자열로 표현한 것이며 내부 값이 수학적 십진수와 완전히 같다는 보장은 아닙니다."], analogy: "곡선을 아주 촘촘한 격자점 중 가장 가까운 점으로 기록하는 것과 비슷합니다." },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "0.1 + 0.2 == 0.3이 False가 된다.", likelyCause: "0.1과 0.2가 이진 부동소수점으로 정확히 표현되지 않아 합과 0.3의 내부 근삿값이 미세하게 다릅니다.", checks: ["print(repr(0.1 + 0.2))로 0.30000000000000004를 확인합니다.", "두 값의 차 abs((0.1 + 0.2) - 0.3)를 확인합니다.", "업무가 근사 계산인지 정확한 십진 계산인지 구분합니다."], fix: "근사 비교에는 math.isclose를 사용하고, 정확한 십진 금액에는 문자열에서 Decimal을 생성하거나 최소 화폐 단위 int를 사용합니다.", prevention: "float의 == 비교를 코드 리뷰 항목으로 두고 데이터 의미에 맞는 허용 오차 또는 숫자 타입을 먼저 결정합니다." },
      ],
      expertNotes: ["Decimal('0.1')은 십진 문자열을 정확히 해석하지만 Decimal(0.1)은 이미 근사된 float 값을 받아 예상보다 긴 값이 됩니다.", "과학 계산에서는 절대 오차와 상대 오차를 함께 고려하며, 큰 값과 매우 작은 값이 섞이는 연산 순서도 수치 안정성에 영향을 줍니다."],
    },
    {
      id: "complex-model",
      title: "complex는 실수부와 허수부를 한 객체로 다룹니다",
      lead: "복소수는 모든 프로젝트에서 쓰이지 않지만 Python 기본 숫자형이며 신호 처리, 푸리에 변환, 공학 계산을 읽을 때 필요한 표기입니다.",
      explanations: [
        "415 + 34j는 real=415.0, imag=34.0인 complex 객체입니다. conjugate()로 켤레복소수를 구하고 abs로 원점에서의 크기를 계산할 수 있습니다. 일반적인 대소 비교는 정의되지 않으므로 complex 값에 <를 적용하면 TypeError가 납니다.",
        "cmath 모듈은 복소수용 제곱근과 삼각함수를 제공합니다. math.sqrt(-1)는 실수 범위에서 ValueError가 나지만 cmath.sqrt(-1)은 1j를 반환합니다. 어떤 수학적 도메인에서 계산하는지가 API 선택을 결정합니다.",
      ],
      concepts: [
        { term: "복소수", definition: "a+bj 꼴로 실수부와 허수부를 함께 가진 수입니다.", detail: ["Python에서는 허수 단위에 j를 사용하고 .real과 .imag로 구성 요소를 읽습니다.", "복소수 리터럴 전체의 type은 complex이며 구성 요소는 float로 제공됩니다."], caveat: "크기를 비교하려면 무엇을 기준으로 할지 먼저 정해야 합니다. Python은 complex 사이의 임의 대소 순서를 제공하지 않습니다." },
      ],
      codeExamples: [],
      diagnostics: [],
    },
    {
      id: "notation-and-bases",
      title: "지수·8진수·16진수는 값을 적는 다른 방법입니다",
      lead: "1.817e2와 181.7은 같은 float 값을, 0o11과 9는 같은 int 값을 만듭니다. 표기법과 타입을 혼동하지 않습니다.",
      explanations: [
        "과학적 표기 e는 10의 거듭제곱을 뜻합니다. 1.817e2는 181.7, 1.817e5는 181700.0입니다. e가 포함된 숫자 리터럴은 float입니다. 매우 크거나 작은 측정값을 읽기 쉽게 쓰는 데 유용합니다.",
        "0o 접두사는 8진수, 0x는 16진수, 0b는 2진수 리터럴입니다. 0o11은 8+1=9, 0x11은 16+1=17입니다. 객체는 모두 int이고 print의 기본 십진 표현 때문에 9와 17로 보입니다. 원래 진법으로 표시하려면 oct, hex, bin 또는 f-string의 o, x, b 지정자를 사용합니다.",
        "진법은 권한 비트, 색상, 네트워크 마스크, 바이너리 프로토콜을 다룰 때 등장합니다. 진법 문자열을 정수로 읽을 때 int('ff', 16)처럼 base를 명시하고, 사용자가 임의의 base를 넣을 수 있다면 허용 범위를 검증합니다.",
      ],
      concepts: [
        { term: "진법", definition: "몇 개의 숫자 기호를 한 자리의 기준으로 사용할지 정한 표현 체계입니다.", detail: ["진법이 달라도 표현 대상인 정수 값은 같을 수 있습니다.", "리터럴의 접두사는 사람이 소스에서 진법을 구분하게 하며 객체에 ‘16진 int 타입’이 따로 생기는 것은 아닙니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "0o18 또는 0x1G를 적자 SyntaxError가 발생한다.", likelyCause: "선택한 진법에서 허용되지 않는 숫자 기호를 리터럴에 사용했습니다.", checks: ["접두사가 0b, 0o, 0x 중 무엇인지 확인합니다.", "2진수는 0·1, 8진수는 0~7, 16진수는 0~9와 a~f만 사용하는지 봅니다.", "외부 문자열이면 리터럴 문법이 아니라 int(text, base) 변환 경로인지 확인합니다."], fix: "해당 진법의 유효한 자리 기호로 고치거나 의도한 값에 맞는 접두사로 변경합니다.", prevention: "프로토콜·권한·색상처럼 진법 의미가 있는 이름을 쓰고 변환 테스트에 경계 문자를 포함합니다." },
      ],
    },
    {
      id: "conversion-rounding-format",
      title: "변환·절삭·반올림·표시를 구분합니다",
      lead: "int(27.789), round(27.789, 2), f'{27.789:.2f}'는 비슷해 보이지만 반환 타입과 목적이 모두 다릅니다.",
      explanations: [
        "float(27)은 값이 27.0인 새 float 객체를 만들고 원래 num 이름이 가리키는 int는 바꾸지 않습니다. int(27.789)는 소수 부분을 0 방향으로 버려 27을 만듭니다. 음수 int(-27.789)는 -27이므로 수직선의 아래쪽으로 내리는 floor와 다릅니다.",
        "round(value, 2)는 숫자 반올림 결과를 만들지만 정확히 절반인 값은 흔히 기대하는 ‘항상 올림’과 다른 bankers rounding 규칙과 부동소수점 표현 영향을 받을 수 있습니다. f'{value:.2f}'는 표시 문자열을 만들기 때문에 타입이 str입니다. 계산 결과를 계속 사용해야 하는지, 최종 표시만 정돈할지 먼저 결정해야 합니다.",
        "(price // 10) * 10은 양의 정수 가격의 일의 자리를 버리는 데 쓸 수 있지만 음수와 다른 자릿수에서는 의도를 명시해야 합니다. 금액 정책에 따른 절사·반올림은 Decimal의 rounding mode로 규칙을 코드에 드러내는 편이 안전합니다.",
      ],
      concepts: [
        { term: "명시적 형 변환", definition: "int, float 같은 생성 함수를 호출해 다른 타입의 새 값을 만드는 일입니다.", detail: ["변환이 성공하면 새 객체를 반환하고 원본 객체를 자동 수정하지 않습니다.", "정보가 줄어드는 float→int 변환에서는 소수 부분이 사라지므로 의도를 검증해야 합니다."] },
        { term: "표시 형식", definition: "값을 사람에게 보여 줄 문자열 모양을 정하는 작업입니다.", detail: [".2f와 쉼표 포맷은 str 결과를 만들고 계산 값 자체를 바꾸지 않습니다.", "저장·계산용 값과 UI 표시 문자열을 분리하면 중복 변환과 오류를 줄일 수 있습니다."], caveat: "포맷된 '1,234.50'을 다시 float로 바로 바꾸면 쉼표 때문에 ValueError가 납니다. 원본 숫자를 별도로 유지하세요." },
      ],
      codeExamples: [
        {
          id: "conversion-vs-formatting",
          title: "같은 실수에 변환·반올림·포맷 적용하기",
          language: "python",
          filename: "conversion_lab.py",
          purpose: "원본 ex06_number.py의 결과를 확장해 각 연산의 값과 타입을 동시에 비교합니다.",
          code: "value = 27.789\ntruncated = int(value)\nrounded = round(value, 2)\nformatted = f'{value:.2f}'\n\nprint(f'{value=}, {type(value).__name__}')\nprint(f'{truncated=}, {type(truncated).__name__}')\nprint(f'{rounded=}, {type(rounded).__name__}')\nprint(f'{formatted=}, {type(formatted).__name__}')\n\nnegative = -27.789\nprint(f'int={int(negative)}, floor={negative // 1}')",
          walkthrough: [
            { lines: "1", explanation: "원본 float 객체를 value 이름에 둡니다." },
            { lines: "2", explanation: "int는 소수 부분을 0 방향으로 제거한 새 int 27을 반환합니다." },
            { lines: "3", explanation: "round는 둘째 자리 기준으로 숫자 결과를 반환합니다. 이 예에서는 27.79입니다." },
            { lines: "4", explanation: "f-string 포맷은 같은 모양 27.79를 가진 str을 만듭니다." },
            { lines: "6-9", explanation: "값과 타입 이름을 함께 출력해 결과 모양이 같아도 rounded와 formatted의 타입이 다름을 확인합니다." },
            { lines: "11-12", explanation: "음수에서 int는 -27, // 1은 -28.0이 되어 0 방향 절삭과 내림의 차이를 드러냅니다." },
          ],
          run: { environment: ["Python 3.11 이상", "conversion_lab.py를 저장"], command: "python conversion_lab.py" },
          output: { value: "value=27.789, float\ntruncated=27, int\nrounded=27.79, float\nformatted='27.79', str\nint=-27, floor=-28.0", explanation: ["formatted에 따옴표가 보이는 것은 f-string의 = 디버깅 표기가 repr을 사용해 str임을 드러내기 때문입니다.", "int와 //는 양수에서 비슷해 보일 수 있지만 음수에서 다른 규칙을 적용합니다.", "원본 value는 모든 작업 뒤에도 27.789인 float로 남습니다."] },
          experiments: [
            { change: "value를 27.784로 바꿉니다.", prediction: "rounded와 formatted가 모두 27.78 모양이 되며 truncated는 계속 27입니다.", result: "원본 ex06의 27.784 → 27.78 출력과 일치합니다." },
            { change: "print(float('1,234.50'))를 실행합니다.", prediction: "천 단위 쉼표를 float가 허용하지 않아 ValueError가 납니다.", result: "표시 문자열을 계산 입력으로 재사용하지 말아야 하는 이유를 확인합니다." },
          ],
          sourceRefs: ["py-number-conversion"],
        },
      ],
      diagnostics: [
        { symptom: "int(27.9)가 28이 아니라 27이 된다.", likelyCause: "int 변환을 반올림 함수로 오해했습니다. int는 소수 부분을 0 방향으로 제거합니다.", checks: ["요구사항이 정수 타입 변환인지 수학적 반올림인지 확인합니다.", "음수 입력도 함께 시험해 int(-27.9)가 -27인지 봅니다.", "표시만 정돈할지 계산값을 바꿀지 구분합니다."], fix: "반올림이 목적이면 정책에 맞게 round 또는 Decimal.quantize를 사용하고, 표시라면 f-string 포맷을 사용합니다.", prevention: "함수 이름이 아니라 입·출력 타입과 경계값 테스트로 정책을 문서화합니다." },
      ],
      comparisons: [
        { title: "정확한 소수 금액을 무엇으로 표현할까요?", options: [
          { name: "최소 단위 int", chooseWhen: "원처럼 소수 단위가 없거나 센트처럼 고정 최소 단위로 계산할 때", avoidWhen: "소수 자릿수와 반올림 정책이 여러 통화·상품별로 달라질 때", tradeoffs: ["정수 계산이 정확하고 빠릅니다.", "표시할 때 단위 환산이 필요합니다.", "범위와 통화 단위를 함께 관리해야 합니다."] },
          { name: "Decimal", chooseWhen: "정확한 십진수와 명시적인 반올림 정책이 필요할 때", avoidWhen: "대규모 과학 배열 연산처럼 float 생태계와 성능이 중요한 때", tradeoffs: ["십진 규칙을 명확히 표현합니다.", "문자열에서 생성해야 입력 의도가 보존됩니다.", "float보다 느리고 타입을 섞을 때 주의가 필요합니다."] },
        ] },
      ],
    },
    {
      id: "choosing-and-boundaries",
      title: "데이터 의미와 시스템 경계에서 타입을 선택합니다",
      lead: "‘소수점이 보이면 float’ 같은 표면 규칙보다 허용 오차, 범위, 외부 저장 형식, 반올림 정책을 함께 판단해야 합니다.",
      explanations: [
        "학생 수와 반복 횟수는 int, 온도 센서 측정은 보통 float, 정확한 세금 계산은 Decimal 또는 최소 단위 int가 적합합니다. 신호의 주파수 변환 결과는 complex가 될 수 있습니다. 같은 화면 숫자라도 의미에 따라 올바른 타입이 달라집니다.",
        "CSV·JSON·데이터베이스·JavaScript 같은 경계를 넘으면 Python 내부 타입 보장이 끝납니다. JSON에는 Decimal이나 complex 표준 표현이 없고, JavaScript Number는 큰 정수를 정확히 표현하지 못할 수 있습니다. 직렬화 규약과 검증을 설계해야 합니다.",
        "성능 최적화는 정확성 요구 뒤에 옵니다. 계산량이 큰 데이터 과학에서는 NumPy의 고정 크기 dtype을 사용하지만 overflow와 정밀도를 직접 관리해야 합니다. Python int와 NumPy int64가 같은 범위라고 가정하지 않습니다.",
      ],
      concepts: [
        { term: "수치 정책", definition: "값의 타입, 허용 범위, 오차, 반올림, 표시와 직렬화 방법을 함께 정한 규칙입니다.", detail: ["정책을 함수와 테스트로 중앙화하면 화면마다 다른 반올림을 적용하는 문제를 막을 수 있습니다.", "경계값·음수·매우 큰 값·NaN·무한대를 테스트에 포함합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: ["ML 입력 전처리에서는 float32와 float64의 메모리·속도·정밀도 trade-off를 측정합니다. 모델 재현성을 위해 dtype을 명시적으로 기록합니다.", "보안 관점에서 숫자 변환도 입력 검증입니다. 지나치게 긴 정수 문자열, NaN, infinity, 범위 밖 수를 무제한 허용하면 자원 고갈이나 검증 우회로 이어질 수 있습니다."],
    },
  ],
  lab: {
    title: "측정값과 금액이 섞인 주문 계산기",
    scenario: "무게로 판매하는 상품의 무게는 float, 개수 상품은 int, 금액은 원 단위 int로 관리하고 출력에서만 천 단위 구분자를 적용합니다.",
    setup: ["numeric_order.py 파일을 만듭니다.", "Python 3.11 이상에서 실행합니다.", "이번 실습에서는 입력을 리터럴로 고정해 타입 변화에 집중합니다."],
    steps: ["weight_kg=1.25, price_per_kg=12800을 만들고 무게 상품 금액을 계산합니다.", "item_count=3, unit_price=4500을 만들고 개수 상품 금액을 계산합니다.", "각 중간값의 type을 출력하고 최종 합계가 float인지 int인지 확인합니다.", "업무 규칙을 ‘원 미만 0 방향 절삭’으로 정하고 int로 변환한 결제 금액을 만듭니다.", "화면에는 쉼표를 적용하되 원본 숫자 타입이 유지되는지 다시 확인합니다."],
    expectedResult: ["무게 상품 16,000원과 개수 상품 13,500원이 계산됩니다.", "결제 금액은 29,500원인 int, 표시 결과는 쉼표가 있는 str임을 구분합니다.", "절삭 규칙을 반올림으로 바꾸면 어느 줄과 테스트가 달라지는지 설명할 수 있습니다."],
    cleanup: ["숫자와 표시 문자열을 별도 이름으로 유지한 상태로 파일을 보관합니다."],
    extensions: ["0.1kg 단위에서 부동소수점 차이를 출력합니다.", "Decimal을 문자열에서 만들어 같은 계산을 비교합니다.", "16진수 상품 상태 코드를 추가하고 십진·16진 표시를 함께 보여 줍니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "네 가지 숫자 표기를 만들고 값과 타입을 출력하세요.", requirements: ["십진 int, float, 0b 이진수, 0x 16진수를 사용합니다.", "각 값의 기본 십진 출력과 bin/hex 결과를 비교합니다.", "예상 결과를 먼저 적고 실행합니다."], hints: ["0b1010과 0x0A는 모두 십진 10입니다.", "type은 둘 다 int를 반환합니다."], expectedOutcome: "표기법과 객체 타입이 별개임을 실행 결과로 설명합니다.", solutionOutline: ["네 리터럴을 서로 다른 이름에 바인딩합니다.", "값·type·변환 표시를 f-string으로 출력합니다."] },
    { difficulty: "응용", prompt: "양수와 음수에서 int, //, round를 비교하는 표를 만드세요.", requirements: ["27.9와 -27.9를 모두 사용합니다.", "각 연산 결과와 타입을 출력합니다.", "0 방향 절삭과 내림 차이를 한 문장으로 설명합니다."], hints: ["negative // 1은 -28.0입니다.", "round에 두 번째 인수를 생략했을 때 반환 타입도 확인합니다."], expectedOutcome: "양수만 시험했을 때 숨는 차이를 음수 경계값으로 드러냅니다." },
    { difficulty: "설계", prompt: "포인트·거리·결제 금액을 가진 여행 정산 모델의 숫자 정책을 설계하세요.", requirements: ["각 필드에 int, float, Decimal 중 하나를 선택하고 이유를 씁니다.", "외부 JSON 경계에서 큰 정수와 Decimal을 어떻게 보낼지 정합니다.", "NaN·음수·최댓값 검증 규칙을 포함합니다.", "정상 2개와 실패 3개의 테스트 입력·예상 결과를 작성합니다."], hints: ["화면 표시 형식은 저장 타입과 분리합니다.", "돈은 float가 편해 보여도 정확한 십진 정책을 먼저 검토합니다."], expectedOutcome: "문법 예제를 넘어 실제 시스템 경계에서 검증 가능한 수치 정책 문서와 코드 윤곽이 완성됩니다." },
  ],
  reviewQuestions: [
    { question: "18, 18.0, 18+0j의 type은 각각 무엇인가요?", answer: "차례로 int, float, complex입니다. 출력 값이 비슷해도 객체 타입과 지원 연산이 다릅니다." },
    { question: "0o11과 0x11은 왜 출력하면 각각 9와 17인가요?", answer: "접두사는 소스의 진법 표기이고 만들어진 객체는 int입니다. print의 기본 int 표현이 십진수라 9와 17로 보입니다." },
    { question: "int(-27.9)와 -27.9 // 1의 차이는 무엇인가요?", answer: "int는 0 방향으로 절삭해 -27, //는 아래 방향으로 내림해 -28.0을 만듭니다." },
    { question: "f'{value:.2f}' 결과를 계속 숫자 계산에 써도 되나요?", answer: "결과는 str이므로 숫자 계산용 원본 값을 유지해야 합니다. 포맷은 표시 단계에서 적용합니다." },
    { question: "0.1+0.2를 0.3과 비교할 때 무엇을 사용해야 하나요?", answer: "근사 계산이면 math.isclose로 의미 있는 허용 오차를 사용하고, 정확한 십진 계산이면 Decimal이나 최소 단위 int를 검토합니다." },
    { question: "Python int가 큰 값을 정확히 표현해도 외부 시스템에서 깨질 수 있는 이유는 무엇인가요?", answer: "JSON 소비자의 JavaScript Number나 데이터베이스 고정 폭 정수처럼 경계의 타입 범위가 다를 수 있기 때문입니다. 직렬화 규약과 범위 검증이 필요합니다." },
  ],
  completionChecklist: [
    "int, float, complex 리터럴과 type 결과를 예측할 수 있다.",
    "지수 표기와 2·8·16진수 리터럴을 십진 값으로 읽을 수 있다.",
    "float의 이진 근사와 math.isclose가 필요한 이유를 설명할 수 있다.",
    "int 변환, // 내림, round, f-string 포맷의 결과와 타입을 구분할 수 있다.",
    "금액에 float를 무조건 사용하지 않고 Decimal 또는 최소 단위 int를 비교할 수 있다.",
    "외부 시스템 경계에서 큰 정수·Decimal·complex의 직렬화 문제를 질문할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-number-types", repository: "PYTHON-BASIC", path: "day01/ex05_number.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day01/ex05_number.py", usedFor: ["int·float·complex", "지수 표기", "8·16진수", "실행 결과"], evidence: "Python 3.13.9에서 직접 실행해 complex 구성 요소, 181.7·181700.0, 0o11=9, 0x11=17 결과를 확인했습니다." },
    { id: "py-number-conversion", repository: "PYTHON-BASIC", path: "day01/ex06_number.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day01/ex06_number.py", usedFor: ["int↔float 변환", "절삭", "소수 표시", "원 단위 절사"], evidence: "원본 실행에서 int(27.489)=27, int(27.789)=27, 27.784→27.78, 27.787→27.79, 124567→124560을 확인했습니다." },
    { id: "py-day01-note", repository: "PYTHON-BASIC", path: "notes/day01_basic.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day01_basic.md", usedFor: ["숫자형 요약", "반올림과 버림 구분", "진법 복습 질문"], evidence: "Day01 노트의 숫자형 표와 Q4·Q5를 원자 세션의 복습·실습 범위에 반영했습니다." },
  ],
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["산술·비교·논리 연산자는 py-005 후속 세션에서 별도로 깊게 다룹니다.", "Decimal과 수치 안정성은 원본 공백을 전문가 관점으로 보강했으며 원본 직접 실습 범위와 구분했습니다."] },
} satisfies DetailedSession;

export default session;

const advancedChapters: DetailedSession["chapters"] = [
  {
    id: "integer-precision-size-guardrails",
    title: "int의 임의 정밀도와 시간·메모리·문자열 변환 한계를 함께 봅니다",
    lead: "고정 폭 overflow가 없다는 장점이 입력 크기와 계산 비용이 무제한이라는 뜻은 아닙니다.",
    explanations: [
      "Python `int`는 값에 필요한 만큼 정밀도를 늘려 큰 정수를 표현합니다. C의 signed64 overflow처럼 조용히 wrap하지 않지만 값이 커질수록 arithmetic 시간과 memory 사용량이 증가합니다.",
      "`bit_length()`는 부호와 leading zeros를 제외한 binary 표현에 필요한 bits 수를 제공합니다. protocol field 범위·cryptographic parameter size·serialization 전 guard에 사용할 수 있습니다.",
      "decimal text와 int 사이 변환은 매우 긴 공격 입력에서 CPU를 소모할 수 있어 Python은 non-power-of-two conversion digit limit를 제공합니다. 설정을 무조건 해제하지 말고 application input length를 먼저 제한합니다.",
      "`int(text, base)`는 whitespace와 sign, 지정 base의 digits를 해석합니다. `base=0`은 prefix로 base를 추론하지만 user-facing input에서 허용 문법을 명시하는 편이 오류와 혼동을 줄입니다.",
      "`//`와 `%`, `divmod`는 음수에서도 `a == (a // b) * b + a % b` 관계를 유지하고 remainder는 divisor와 같은 sign 또는0입니다. truncate-to-zero 언어와 결과가 다릅니다.",
      "database·binary protocol·NumPy type은 고정 폭일 수 있습니다. Python int가 값을 표현해도 boundary target range를 넘으면 명시적으로 거부해야 합니다.",
    ],
    concepts: [
      { term: "arbitrary precision integer", definition: "값 크기에 맞춰 storage를 늘려 고정 폭 overflow 없이 정수를 표현하는 모델입니다.", detail: ["자원 비용은 증가합니다.", "외부 고정 폭 경계는 별도입니다."] },
      { term: "bit length", definition: "정수 절댓값을 binary로 표현하는 데 필요한 bits 수입니다.", detail: ["0의 bit_length는0입니다.", "range guard에 활용합니다."] },
      { term: "conversion digit limit", definition: "매우 긴 decimal 문자열과 int 변환의 과도한 비용을 줄이기 위한 interpreter guard입니다.", detail: ["version/config를 확인합니다.", "application length validation이 우선입니다."] },
    ],
    codeExamples: [{
      id: "python-big-int-boundary",
      title: "2의100제곱과 음수 divmod를 exact 검증합니다",
      language: "python",
      filename: "integer_boundaries.py",
      purpose: "환경 의존 memory 주소/크기를 출력하지 않고 임의 정밀도, bit/digit 수와 floor division invariant를 관찰합니다.",
      code: "value = 2 ** 100\nquotient, remainder = divmod(-17, 5)\n\nprint(f'value={value}')\nprint(f'bits={value.bit_length()}|decimal_digits={len(str(value))}')\nprint(f'divmod={quotient},{remainder}|reconstructed={quotient * 5 + remainder}')\nprint(f'fits_signed64={-(2 ** 63) <= value < 2 ** 63}')",
      walkthrough: [
        { lines: "1-2", explanation: "고정 큰 정수와 음수/divisor 양수 divmod 결과를 준비합니다." },
        { lines: "4-5", explanation: "exact value와 binary bits101·decimal digits31을 출력합니다." },
        { lines: "6-7", explanation: "quotient/remainder invariant와 signed64 target 범위를 검증합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 built-ins만 사용"], command: "python integer_boundaries.py" },
      output: { value: "value=1267650600228229401496703205376\nbits=101|decimal_digits=31\ndivmod=-4,3|reconstructed=-17\nfits_signed64=False", explanation: ["2**100은 정확히 보존됩니다.", "-17 // 5는-4이고 remainder3입니다.", "Python에서는 표현되지만 signed64에는 들어가지 않습니다."] },
      experiments: [
        { change: "value를 2**63-1로 바꿉니다.", prediction: "fits_signed64=True이고 bits=63입니다.", result: "target inclusive/exclusive boundary를 확인합니다." },
        { change: "divisor를 -5로 바꿉니다.", prediction: "remainder sign이 음수 divisor를 따릅니다.", result: "floor division invariant로 결과를 검증합니다." },
        { change: "수백만 decimal digits 입력을 int로 바꿉니다.", prediction: "길이 guard 또는 큰 CPU 비용 경계에 걸립니다.", result: "실험 대신 bounded synthetic input과 configured limit를 사용합니다." },
      ],
      sourceRefs: ["python-numeric-stdtypes-004", "python-sys-int-limit", "python-expressions-arithmetic-004"],
    }],
    diagnostics: [
      { symptom: "Python 계산은 되지만 DB insert에서 overflow가 납니다.", likelyCause: "Python arbitrary precision 값을 고정 폭 DB column range와 검증하지 않았습니다.", checks: ["target min/max를 확인합니다.", "bit_length와 실제 value를 봅니다.", "schema signed/unsigned를 확인합니다."], fix: "serialization/DB boundary 전에 target range를 명시적으로 검증합니다.", prevention: "min-1/min/max/max+1 contract tests를 둡니다." },
      { symptom: "긴 숫자 문자열 변환이 실패하거나 CPU를 오래 씁니다.", likelyCause: "interpreter digit limit 또는 application input bound가 없습니다.", checks: ["문자열 길이를 먼저 봅니다.", "sys int conversion limit를 확인합니다.", "base가 power-of-two인지 확인합니다."], fix: "입력 길이와 업무 range를 conversion 전에 제한합니다.", prevention: "oversized numeric payload negative test와 request size limit를 둡니다." },
      { symptom: "음수 페이지 번호 계산이 다른 언어와 다릅니다.", likelyCause: "Python `//` floor와 truncate-to-zero division을 혼동했습니다.", checks: ["divmod 결과를 봅니다.", "reconstruction invariant를 검증합니다.", "domain에서 음수를 허용하는지 확인합니다."], fix: "음수 input을 거부하거나 floor semantics를 명시적으로 반영합니다.", prevention: "양수·음수 dividend/divisor matrix를 test합니다." },
    ],
  },
  {
    id: "decimal-fraction-exact-models",
    title: "Decimal과 Fraction으로 decimal money·rational ratio의 정확한 모델을 선택합니다",
    lead: "float의 binary 근사를 무조건 나쁘다고 하지 않고 값의 출처와 필요한 algebra에 맞는 numeric type을 고릅니다.",
    explanations: [
      "`Decimal('0.1')`은 decimal 문자열0.1을 정확히 표현하지만 `Decimal(0.1)`은 이미 근사된 binary float 값을 정확히 가져와 긴 decimal expansion이 됩니다. 외부 decimal text는 문자열에서 생성합니다.",
      "Decimal arithmetic는 현재 context의 precision, rounding, traps와 flags 영향을 받습니다. library가 global context를 무심코 바꾸지 말고 `localcontext()`로 operation boundary를 좁힙니다.",
      "`Fraction(numerator, denominator)`은 유리수를 기약분수로 정확히 표현합니다. ratio·확률·unit conversion에 유용하지만 denominator가 커질 수 있어 input과 operation complexity를 제한합니다.",
      "float, Decimal, Fraction을 무분별하게 섞으면 TypeError 또는 예상하지 않은 coercion이 납니다. 한 계산 domain의 canonical type과 boundary conversions를 정합니다.",
      "money에는 currency·minor unit·rounding rule이 함께 필요합니다. Decimal type 하나만 사용했다고 회계 규칙이 완성되는 것은 아닙니다.",
      "serialization에서는 Decimal/Fraction을 JSON number로 자동 손실 변환하지 말고 decimal string 또는 numerator/denominator schema를 명시합니다.",
    ],
    concepts: [
      { term: "decimal arithmetic context", definition: "Decimal operation의 precision·rounding·signals/traps를 결정하는 실행 설정입니다.", detail: ["thread/context-local behavior를 확인합니다.", "localcontext로 범위를 좁힙니다."] },
      { term: "rational number", definition: "두 integers의 비 p/q로 정확히 표현할 수 있는 수이며 Fraction이 이를 기약 형태로 모델링합니다.", detail: ["denominator0은 금지됩니다.", "크기 증가를 관리합니다."] },
      { term: "canonical numeric type", definition: "한 업무 계산 경계에서 값과 연산 의미를 대표하도록 선택한 단일 numeric type입니다.", detail: ["혼합 coercion을 줄입니다.", "serialization schema와 연결합니다."] },
    ],
    codeExamples: [{
      id: "python-decimal-fraction-exactness",
      title: "float 근사와 Decimal·Fraction exact 결과를 비교합니다",
      language: "python",
      filename: "exact_numbers.py",
      purpose: "고정 inputs와 local Decimal context로 representation·precision 차이를 exact 출력합니다.",
      code: "from decimal import Decimal, localcontext\nfrom fractions import Fraction\n\nfloat_sum = 0.1 + 0.1 + 0.1\ndecimal_sum = Decimal('0.1') * 3\nrational_sum = Fraction(1, 3) + Fraction(1, 6)\n\nwith localcontext() as context:\n    context.prec = 6\n    seventh = Decimal(1) / Decimal(7)\n\nprint(f'float_equal={float_sum == 0.3}|hex={float_sum.hex()}')\nprint(f'decimal={decimal_sum}|fraction={rational_sum}')\nprint(f'one_seventh={seventh}')",
      walkthrough: [
        { lines: "1-6", explanation: "binary float sum, decimal 문자열 기반 sum과 rational sum을 준비합니다." },
        { lines: "8-10", explanation: "Decimal precision6을 local context 안에서만 적용해1/7을 계산합니다." },
        { lines: "12-14", explanation: "float equality/hex와 exact Decimal/Fraction, rounded context 결과를 출력합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "decimal·fractions 표준 라이브러리"], command: "python exact_numbers.py" },
      output: { value: "float_equal=False|hex=0x1.3333333333334p-2\ndecimal=0.3|fraction=1/2\none_seventh=0.142857", explanation: ["float sum은 0.3과 binary representation이 다릅니다.", "Decimal과 Fraction은 의도한 decimal/rational 값을 정확히 표현합니다.", "1/7은 context precision6에서 반올림됩니다."] },
      experiments: [
        { change: "Decimal('0.1')을 Decimal(0.1)로 바꿉니다.", prediction: "긴 decimal 근삿값이 나타납니다.", result: "float source의 근사도 정확히 보존되기 때문입니다." },
        { change: "context.prec를3으로 바꿉니다.", prediction: "one_seventh=0.143입니다.", result: "precision policy가 operation output을 바꿉니다." },
        { change: "Fraction(1, 0)을 만듭니다.", prediction: "ZeroDivisionError가 납니다.", result: "invalid denominator를 boundary에서 거부합니다." },
      ],
      sourceRefs: ["python-decimal-doc", "python-fractions-doc", "python-floating-point-tutorial"],
    }],
    diagnostics: [
      { symptom: "Decimal을 썼는데 여전히 긴0.100000... 값입니다.", likelyCause: "문자열이 아니라 binary float0.1에서 Decimal을 생성했습니다.", checks: ["constructor argument type을 봅니다.", "repr와 as_tuple을 확인합니다.", "입력 source format을 확인합니다."], fix: "decimal text는 Decimal(text), exact integer는 Decimal(integer)로 변환합니다.", prevention: "float→Decimal boundary를 lint/review하고 exact fixtures를 둡니다." },
      { symptom: "다른 code 실행 뒤 Decimal 결과 자릿수가 바뀝니다.", likelyCause: "shared context precision/rounding을 전역적으로 변경했습니다.", checks: ["getcontext 변경을 검색합니다.", "operation 주변 localcontext를 봅니다.", "concurrent task context를 확인합니다."], fix: "localcontext 안에서 필요한 policy를 설정하고 library global mutation을 제거합니다.", prevention: "context-isolation test와 explicit rounding policy를 둡니다." },
    ],
  },
  {
    id: "float-special-values-overflow-nan",
    title: "float의 infinity·NaN·signed zero와 유한성 검사를 정상 data contract에 포함합니다",
    lead: "IEEE 754 special value는 exception 없이 계산을 전파할 수 있어 단순 range 비교만으로 검증되지 않습니다.",
    explanations: [
      "Python float는 일반적으로 IEEE 754 binary64를 사용하며 너무 큰 유한 연산 결과가 infinity가 될 수 있습니다. 모든 환경 세부를 가정하기보다 `math.isfinite`로 application boundary를 검증합니다.",
      "NaN은 자신과도 같지 않아 `nan == nan`이 False이고 ordered comparisons도 False입니다. NaN 판별에는 `math.isnan`을 사용합니다.",
      "`min`, `max`, sorting과 NaN을 섞으면 total ordering을 가정한 business logic이 불안정해집니다. ingest 단계에서 special values를 거부하거나 명시 category로 분리합니다.",
      "positive/negative infinity는 `math.isinf`, 모든 정상 finite number는 `math.isfinite`로 분류합니다. 문자열 `nan`, `inf`를 float parser가 허용할 수 있으므로 user numeric policy를 별도로 둡니다.",
      "-0.0은0.0과 equal이지만 sign bit가 있고 division·copysign·serialization에서 차이가 보일 수 있습니다. domain이 방향을 사용하지 않으면 canonical zero 정책을 둘 수 있습니다.",
      "JSON 표준 상 non-finite numbers portability는 제한됩니다. serializer의 allow_nan/default behavior를 확인하고 interoperable API에서는 reject 또는 tagged string schema를 사용합니다.",
    ],
    concepts: [
      { term: "NaN", definition: "정의되지 않거나 표현할 수 없는 floating result를 나타내는 not-a-number special value입니다.", detail: ["자기 자신과 같지 않습니다.", "math.isnan으로 검사합니다."] },
      { term: "infinity", definition: "float 범위를 넘거나 명시적으로 만든 양·음의 무한 special value입니다.", detail: ["math.isinf로 검사합니다.", "finite range validation 전에 거부합니다."] },
      { term: "finite-number contract", definition: "application이 NaN/infinity를 허용하지 않고 유한 numeric value만 받는다는 boundary 규칙입니다.", detail: ["parse 뒤 즉시 검사합니다.", "serialization과 연결합니다."] },
    ],
    codeExamples: [{
      id: "python-float-special-values",
      title: "overflow infinity와 NaN comparison을 exact 분류합니다",
      language: "python",
      filename: "float_specials.py",
      purpose: "platform address나 locale 없이 math predicates와 IEEE-visible 결과를 검증합니다.",
      code: "import math\n\nfinite = 1.5\noverflow = 1e308 * 10\nnot_a_number = float('nan')\n\nprint(f'finite={math.isfinite(finite)}|overflow={overflow}|isinf={math.isinf(overflow)}')\nprint(f'nan_equal={not_a_number == not_a_number}|isnan={math.isnan(not_a_number)}')\nprint(f'nan_ordered={(not_a_number < 0) or (not_a_number > 0)}|all_finite={all(map(math.isfinite, [finite, overflow]))}')",
      walkthrough: [
        { lines: "1-5", explanation: "finite value, overflow infinity와 parsed NaN을 준비합니다." },
        { lines: "7-9", explanation: "finite/inf/NaN predicates, self-equality, ordered comparisons와 batch contract를 출력합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "math 표준 라이브러리"], command: "python float_specials.py" },
      output: { value: "finite=True|overflow=inf|isinf=True\nnan_equal=False|isnan=True\nnan_ordered=False|all_finite=False", explanation: ["overflow는 exception 대신 inf가 됩니다.", "NaN은 자기 자신과 같지 않습니다.", "한 값이 infinity라 batch finite contract가 False입니다."] },
      experiments: [
        { change: "overflow를1e307로 바꿉니다.", prediction: "finite=True이고 isinf=False입니다.", result: "경계에서는 predicate로 분류합니다." },
        { change: "nan 검사에 `value == float('nan')`을 씁니다.", prediction: "항상 False입니다.", result: "math.isnan을 사용합니다." },
        { change: "json.dumps에 NaN을 전달하고 allow_nan=False를 설정합니다.", prediction: "ValueError로 non-standard value를 거부합니다.", result: "API interoperability policy를 명시합니다." },
      ],
      sourceRefs: ["python-math-specials", "python-expressions-comparisons-004", "python-json-numbers-004", "py-day01-note"],
    }],
    diagnostics: [
      { symptom: "range check를 통과하지도 실패하지도 않고 NaN이 남습니다.", likelyCause: "NaN ordered comparisons가 모두 False인 특성을 고려하지 않았습니다.", checks: ["math.isnan/isfinite를 먼저 봅니다.", "parser가 nan text를 허용하는지 확인합니다.", "aggregation source를 추적합니다."], fix: "range 비교 전에 finite-number contract를 적용합니다.", prevention: "NaN·±inf·-0.0 fixtures를 numeric boundary에 둡니다." },
      { symptom: "API consumer가 JSON 숫자를 parse하지 못합니다.", likelyCause: "serializer가 NaN/Infinity 확장을 출력했지만 consumer는 strict JSON입니다.", checks: ["wire payload를 봅니다.", "allow_nan 설정을 확인합니다.", "schema numeric constraints를 봅니다."], fix: "non-finite를 reject하거나 explicit tagged nullable/error schema로 변환합니다.", prevention: "strict cross-language JSON contract test를 둡니다." },
    ],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...advancedChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "python-numeric-stdtypes-004", repository: "Python Standard Library", path: "Numeric Types — int, float, complex", publicUrl: "https://docs.python.org/3/library/stdtypes.html#numeric-types-int-float-complex", usedFor: ["integer precision", "numeric operations", "bit_length"], evidence: "built-in numeric types의 공식 API입니다." },
  { id: "python-sys-int-limit", repository: "Python Standard Library", path: "Integer string conversion length limitation", publicUrl: "https://docs.python.org/3/library/stdtypes.html#integer-string-conversion-length-limitation", usedFor: ["conversion digit limit", "denial-of-service guard"], evidence: "긴 integer text 변환 제한의 공식 설명입니다." },
  { id: "python-expressions-arithmetic-004", repository: "Python Language Reference", path: "6.7 Binary arithmetic operations", publicUrl: "https://docs.python.org/3/reference/expressions.html#binary-arithmetic-operations", usedFor: ["floor division", "modulo", "power"], evidence: "정수/실수 arithmetic semantics의 공식 근거입니다." },
  { id: "python-decimal-doc", repository: "Python Standard Library", path: "decimal — Decimal fixed-point and floating-point arithmetic", publicUrl: "https://docs.python.org/3/library/decimal.html", usedFor: ["Decimal", "context", "rounding", "signals"], evidence: "decimal arithmetic의 공식 API입니다." },
  { id: "python-fractions-doc", repository: "Python Standard Library", path: "fractions — Rational numbers", publicUrl: "https://docs.python.org/3/library/fractions.html", usedFor: ["Fraction", "rational exactness", "normalization"], evidence: "rational number의 공식 API입니다." },
  { id: "python-floating-point-tutorial", repository: "Python Documentation", path: "Floating-Point Arithmetic: Issues and Limitations", publicUrl: "https://docs.python.org/3/tutorial/floatingpoint.html", usedFor: ["binary approximation", "0.1", "comparison strategy"], evidence: "float representation 한계의 공식 tutorial입니다." },
  { id: "python-math-specials", repository: "Python Standard Library", path: "math — isfinite, isinf, isnan", publicUrl: "https://docs.python.org/3/library/math.html#number-theoretic-and-representation-functions", usedFor: ["NaN", "infinity", "finite validation"], evidence: "floating special value predicates의 공식 API입니다." },
  { id: "python-expressions-comparisons-004", repository: "Python Language Reference", path: "6.10 Comparisons", publicUrl: "https://docs.python.org/3/reference/expressions.html#comparisons", usedFor: ["NaN comparisons", "cross numeric comparisons"], evidence: "comparison과 NaN semantics의 공식 근거입니다." },
  { id: "python-json-numbers-004", repository: "Python Standard Library", path: "json — Infinite and NaN number values", publicUrl: "https://docs.python.org/3/library/json.html#infinite-and-nan-number-values", usedFor: ["non-finite serialization", "allow_nan"], evidence: "JSON interoperability의 공식 동작입니다." },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "Python int에는 overflow가 전혀 없다는 말이 정확한가요?", answer: "고정 폭 wrap은 없지만 memory·시간과 외부 고정 폭 boundary 한계는 있습니다." },
  { question: "2**100의 bit_length는 얼마인가요?", answer: "최상위1 bit 위치를 포함해101입니다." },
  { question: "-17을5로 divmod한 결과는?", answer: "quotient-4, remainder3이며 -17=(-4)*5+3입니다." },
  { question: "Decimal을 float0.1에서 만들면 왜 길어지나요?", answer: "이미 근사된 binary float 값을 정확히 Decimal로 옮기기 때문입니다." },
  { question: "Fraction(1,3)+Fraction(1,6)은?", answer: "기약분수1/2입니다." },
  { question: "Decimal context는 무엇을 결정하나요?", answer: "precision, rounding, signals/traps 같은 arithmetic policy를 결정합니다." },
  { question: "NaN은 자신과 같은가요?", answer: "아닙니다. NaN equality는 자기 자신과도 False입니다." },
  { question: "NaN을 어떻게 검사하나요?", answer: "`math.isnan(value)`를 사용합니다." },
  { question: "API에서 infinity를 그대로 JSON number로 보내도 되나요?", answer: "strict JSON consumer와 호환되지 않을 수 있어 reject 또는 명시 schema가 필요합니다." },
);

(session.completionChecklist as string[]).push(
  "arbitrary precision과 무제한 자원을 구분한다.",
  "bit_length로 target range를 점검한다.",
  "긴 integer text를 conversion 전에 제한한다.",
  "Python int와 signed/unsigned 외부 범위를 검증한다.",
  "Decimal을 decimal 문자열에서 생성한다.",
  "Decimal context를 local boundary로 제한한다.",
  "Fraction의 rational exactness와 denominator 비용을 설명한다.",
  "NaN·infinity를 range 비교 전에 거부한다.",
  "non-finite serialization policy를 명시한다.",
);
