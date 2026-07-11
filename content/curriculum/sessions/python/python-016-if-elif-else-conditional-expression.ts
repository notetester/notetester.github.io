import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-016"],
  slug: "python-016-if-elif-else-conditional-expression",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 16,
  title: "if·elif·else와 조건 표현식",
  subtitle: "조건의 truthiness와 위에서 아래 선택 순서를 추적하고, 경계·들여쓰기·상호배타 분기를 검증 가능한 정책으로 만듭니다.",
  level: "기초",
  estimatedMinutes: 115,
  coreQuestion: "여러 조건 중 정확히 어떤 코드 블록이 실행되는지 예측하고, 경계에서 잘못된 분기를 어떻게 막을까요?",
  summary: "콜론과 들여쓰기 블록, 단일 if, if-else, 첫 참만 선택하는 if-elif-else와 독립 if 여러 개의 차이를 다룹니다. 짝홀·membership·학점 경계를 실행하고 조건 순서, guard clause, pass, 조건 표현식, 권한 정책의 결정표와 분기 coverage까지 연결합니다.",
  objectives: [
    "조건식 평가와 들여쓰기 블록 실행·건너뛰기 순서를 설명할 수 있다.",
    "독립 if 여러 개와 if-elif-else의 중복 실행 여부를 구분할 수 있다.",
    "넓은 조건과 좁은 조건의 순서를 학점·구간 예제로 검증할 수 있다.",
    "else·guard clause·중첩 분기를 요구사항에 맞게 선택할 수 있다.",
    "pass와 조건 표현식의 적절한 사용 범위를 설명할 수 있다.",
    "경계값·결정표·분기 coverage로 정책 코드를 테스트할 수 있다.",
  ],
  prerequisites: [
    { title: "산술·비교·논리 연산자", reason: "조건식의 비교·membership·and/or 우선순위와 단락 평가를 사용합니다.", sessionSlug: "python-005-arithmetic-comparison-logic" },
    { title: "입력·형 변환·검증 경계", reason: "외부 문자열을 검증된 숫자로 만든 뒤 조건 분기에 전달합니다.", sessionSlug: "python-015-input-conversion-validation-boundary" },
  ],
  keywords: ["Python", "if", "elif", "else", "indentation", "branch", "guard clause", "conditional expression", "pass", "boundary testing"],
  chapters: [
    {
      id: "branch-mental-model",
      title: "if는 조건을 평가해 블록 실행 여부를 선택합니다",
      lead: "if condition: 다음 들여쓰기 블록은 condition의 truthiness가 True일 때만 실행되고 이후 공통 코드는 다시 합류합니다.",
      explanations: [
        "score>=60은 bool을 반환하고 if는 그 값을 사용합니다. condition이 bool이 아니어도 truthiness로 판단하지만, 정책 코드에서는 비교 결과처럼 의미가 드러나는 bool 표현이 읽기 좋습니다.",
        "단일 if는 조건이 거짓일 때 아무 동작 없이 다음 동일 들여쓰기 문장으로 갑니다. 합격 메시지만 선택적으로 출력하고 ‘수고하셨습니다’가 항상 실행되는 구조를 블록 경계로 구분해야 합니다.",
        "분기는 위에서 아래로 실행 흐름을 갈라놓지만 변수 타입·값의 계약을 자동 보장하지 않습니다. 조건 안에서만 result를 만들고 조건이 거짓인 뒤 result를 읽으면 정의되지 않을 수 있습니다. 모든 경로에서 필요한 값은 기본값 또는 else로 보장합니다.",
      ],
      concepts: [
        { term: "분기(branch)", definition: "조건 결과에 따라 실행할 코드 경로를 선택하는 제어 흐름입니다.", detail: ["각 경로의 상태 변화와 반환을 추적해야 합니다.", "경로가 다시 합류할 때 필요한 이름이 모든 분기에서 정의됐는지 확인합니다."] },
        { term: "블록", definition: "같은 들여쓰기 수준으로 묶여 함께 실행되는 문장 집합입니다.", detail: ["콜론 뒤 다음 줄부터 더 깊은 들여쓰기가 시작합니다.", "들여쓰기 수준이 돌아오면 블록이 끝납니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
    },
    {
      id: "colon-indentation",
      title: "콜론과 들여쓰기가 블록 경계를 정의합니다",
      lead: "Python은 중괄호 대신 들여쓰기를 문법으로 사용하므로 보이는 정렬이 실제 실행 구조입니다.",
      explanations: [
        "if 줄 끝에는 콜론이 필요하고 다음 블록은 보통 공백 4칸을 사용합니다. 탭과 공백을 섞으면 화면상 비슷해도 TabError·IndentationError가 날 수 있습니다. 에디터를 spaces 4와 보이지 않는 문자 표시로 설정합니다.",
        "들여쓰기가 한 칸 더 깊으면 중첩 블록입니다. 실수로 print를 if 안에 두거나 밖에 두면 오류 없이 실행 의미만 바뀔 수 있어 코드 리뷰에서 블록 끝을 확인합니다.",
        "빈 블록은 허용되지 않아 아직 구현하지 않을 때 pass를 둘 수 있습니다. pass는 조건을 무시하거나 프로그램을 멈추는 명령이 아니라 문법상 아무 작업도 하지 않는 자리표시자입니다.",
      ],
      concepts: [
        { term: "IndentationError", definition: "Python이 기대한 블록 들여쓰기 구조와 실제 공백이 맞지 않을 때 발생하는 문법 오류입니다.", detail: ["블록 시작 뒤 들여쓰기 누락, 예상치 못한 들여쓰기에서 발생합니다.", "탭·공백 혼용은 TabError로 나타날 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "IndentationError: expected an indented block 또는 unexpected indent가 발생한다.", likelyCause: "콜론 뒤 블록 들여쓰기가 없거나 문맥과 맞지 않는 들여쓰기가 들어갔습니다.", checks: ["오류 줄과 바로 위 콜론 줄을 확인합니다.", "탭·공백 표시를 켜고 같은 블록 수준을 비교합니다.", "빈 블록이면 pass가 필요한지 봅니다."], fix: "공백 4칸 규칙으로 블록을 맞추고 탭을 공백으로 변환합니다.", prevention: "포매터·린터와 에디터 indentation 설정을 사용합니다." },
      ],
    },
    {
      id: "independent-vs-exclusive",
      title: "독립 if는 모두 검사하고 elif 체인은 첫 참에서 멈춥니다",
      lead: "여러 조건이 동시에 실행될 수 있는지, 정확히 하나만 선택해야 하는지가 구조 선택 기준입니다.",
      explanations: [
        "독립 if 세 개는 각 조건을 모두 평가해 여러 블록이 실행될 수 있습니다. 숫자가 양수이면서 짝수처럼 여러 특성을 동시에 표시할 때 적합합니다.",
        "if-elif-else는 위에서 첫 truthy 조건의 블록 하나만 실행하고 나머지를 건너뜁니다. 학점·요금 구간·상태 분류처럼 상호배타 결과 하나가 필요할 때 사용합니다.",
        "짝수/홀수는 나머지가 0인지에 따라 둘 중 하나이므로 if-else가 자연스럽습니다. 원본의 초기값 res='홀수' 뒤 짝수일 때만 덮는 방식도 동작하지만, 두 분기가 명시된 if-else가 정책을 더 분명히 보여 줍니다.",
        "elif는 앞 조건이 거짓일 때만 평가되므로 비싼 함수 호출·부작용이 뒤에 있으면 실행 여부가 달라집니다. 조건식에는 가능하면 부작용 없는 bool 계산을 사용합니다.",
      ],
      concepts: [
        { term: "상호배타", definition: "한 입력에서 동시에 둘 이상 선택되면 안 되는 결과 관계입니다.", detail: ["if-elif-else 체인이 첫 참 하나를 선택합니다.", "조건 범위가 겹쳐도 순서가 결과를 결정하므로 경계를 검토합니다."] },
      ],
      codeExamples: [
        {
          id: "branching-even-and-grade",
          title: "짝홀과 학점 분기의 실행 경로 확인",
          language: "python",
          filename: "branching_basics.py",
          purpose: "원본 ex05·ex07의 짝홀과 학점 계산을 비대화형 고정값으로 재현해 경계 순서를 확인합니다.",
          code: "number = 7\nif number % 2 == 0:\n    parity = '짝수'\nelse:\n    parity = '홀수'\nprint(parity)\n\naverage = 250 / 3\nif average >= 90:\n    grade = 'A학점'\nelif average >= 80:\n    grade = 'B학점'\nelif average >= 70:\n    grade = 'C학점'\nelse:\n    grade = 'F학점'\nprint(f'{average:.2f}', grade)",
          walkthrough: [
            { lines: "1-6", explanation: "7%2가 1이라 if 블록을 건너뛰고 else에서 홀수를 선택합니다." },
            { lines: "8", explanation: "원본 입력 100+80+70의 평균 83.333...을 재현합니다." },
            { lines: "9-16", explanation: "90 조건은 False, 80 조건은 True라 B를 선택하고 70·else는 평가하지 않습니다." },
            { lines: "17", explanation: "표시만 소수 둘째 자리로 만들고 grade 결과를 함께 출력합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "branching_basics.py를 저장"], command: "python branching_basics.py" },
          output: { value: "홀수\n83.33 B학점", explanation: ["짝홀은 정확히 한 분기가 parity를 정의합니다.", "평균은 B와 C 조건을 모두 수학적으로 만족하지만 elif가 첫 참 B 하나만 선택합니다.", "경계 조건을 높은 값부터 내려 써야 이 결과가 맞습니다."] },
          experiments: [
            { change: "average를 90, 89.999, 80, 79.999로 바꿉니다.", prediction: "각 포함 경계에서 A·B·B·C가 됩니다.", result: "부동소수점 입력과 >= 경계를 테스트해야 합니다." },
            { change: "elif를 모두 독립 if로 바꿉니다.", prediction: "83.33에서 B 뒤 C도 실행해 마지막 grade가 C로 덮입니다.", result: "독립 특성 검사와 상호배타 분류의 구조 차이를 확인합니다." },
          ],
          sourceRefs: ["py-if-basic", "py-if-else", "py-multi-if", "py-day03-note"],
        },
      ],
      diagnostics: [],
    },
    {
      id: "condition-order-boundaries",
      title: "elif 순서는 넓은 조건이 좁은 조건을 가리지 않게 정합니다",
      lead: "average>=70을 average>=90보다 먼저 두면 95도 첫 조건 70에서 멈춰 C가 됩니다.",
      explanations: [
        "구간 분류는 보통 높은 하한부터 내림차순으로 검사하거나 낮은 상한부터 오름차순으로 검사합니다. 두 방식을 섞지 않습니다. 조건 옆에 구간 [90,∞), [80,90)처럼 적어 겹침·틈을 확인합니다.",
        "else는 앞 조건의 여집합 전체입니다. 점수 범위를 먼저 검증하지 않으면 -10과 1000도 각각 F 또는 A로 분류될 수 있습니다. 분류 전에 0<=score<=100 불변식을 검사합니다.",
        "경계는 70·80·90만 아니라 바로 아래 값과 최솟값·최댓값을 함께 테스트합니다. int 점수면 69·70, float 평균이면 69.999·70.0처럼 표현 오차 정책도 정합니다.",
      ],
      concepts: [
        { term: "조건 가리기", definition: "앞의 넓은 truthy 조건이 뒤의 더 구체 조건에 도달하지 못하게 하는 문제입니다.", detail: ["elif는 첫 참에서 멈춥니다.", "구체 조건을 먼저 두거나 범위를 명시합니다."] },
        { term: "여집합 else", definition: "앞의 모든 if·elif 조건이 거짓인 나머지 입력 전체를 받는 분기입니다.", detail: ["예상하지 않은 범위도 포함될 수 있습니다.", "입력 검증 없이 else를 정상 카테고리로 쓰면 오류를 숨길 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "95점이 C학점처럼 낮은 첫 조건으로 분류된다.", likelyCause: "average>=70 같은 넓은 하한 조건을 >=90보다 앞에 두어 뒤 조건이 가려졌습니다.", checks: ["각 조건이 표현하는 수직선 구간을 적습니다.", "입력 95에서 위에서부터 truth 값을 기록합니다.", "독립 if인지 elif 체인인지 확인합니다."], fix: "하한 조건을 높은 값부터 배치하거나 명시 범위 조건을 사용합니다.", prevention: "각 경계·바로 아래·범위 밖을 parameterized test로 검증합니다." },
      ],
    },
    {
      id: "else-guards-nesting",
      title: "정상 흐름을 평평하게 만들기 위해 guard를 사용합니다",
      lead: "잘못된 입력·권한 없음처럼 조기에 종료할 조건을 먼저 처리하면 깊은 중첩을 줄일 수 있습니다.",
      explanations: [
        "if valid: if authorized: if available:처럼 중첩이 깊어지면 각 else가 어느 if에 대응하는지 어렵습니다. 함수 안에서는 if not valid: raise 또는 return으로 guard한 뒤 정상 흐름을 이어갈 수 있습니다.",
        "아직 함수 return을 배우기 전 스크립트에서는 오류 상태 변수를 두거나 sys.exit로 종료할 수 있지만, exit와 계산 로직을 분리하는 구조가 테스트에 유리합니다. 함수는 py-021에서 자세히 다룹니다.",
        "else를 생략해도 되는지는 조건 거짓에서 해야 할 일이 없는지로 결정합니다. 상태 변수를 모든 경로에서 정의해야 하면 명시적 else가 안전합니다.",
        "논리 and/or로 모든 분기를 한 줄에 압축하지 않습니다. 권한·결제·삭제 정책은 명시적인 이름·분기와 결정표가 감사하기 쉽습니다.",
      ],
      concepts: [
        { term: "guard clause", definition: "정상 처리를 계속할 수 없는 조건을 함수 앞부분에서 조기에 반환·예외 처리하는 분기입니다.", detail: ["중첩 깊이를 줄입니다.", "실패 이유와 정상 불변식을 가까이 둡니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "NameError 또는 UnboundLocalError로 분기 뒤 변수가 없다.", likelyCause: "일부 if 경로에서만 이름을 정의하고 거짓 경로에서도 사용했습니다.", checks: ["모든 가능한 경로에서 대입 여부를 표시합니다.", "else 또는 조기 종료가 있는지 확인합니다.", "기본값이 실제 의미를 가지는지 검토합니다."], fix: "모든 계속 경로에서 값을 정의하거나 실패 경로를 return/raise로 끝냅니다.", prevention: "분기별 테스트와 정적 타입 검사를 사용합니다." },
      ],
    },
    {
      id: "membership-pass-conditional",
      title: "membership·pass·조건 표현식은 간단한 의도를 짧게 표현합니다",
      lead: "'money' in pocket은 bool 조건, pass는 빈 블록, true_value if condition else false_value는 값 선택 표현식입니다.",
      explanations: [
        "원본 pocket 예제는 money membership이 True면 ‘택시 타고 가자’, 아니면 ‘뛰어가자’를 선택합니다. list membership은 값 동등성을 순차 검사하며, 큰 허용 목록이면 set을 고려합니다.",
        "pass는 아무 일도 하지 않습니다. if money in pocket: pass는 돈이 있을 때 상태·출력 변화가 없고, 없을 때만 else가 실행됩니다. 임시 구현에는 TODO와 테스트를 남기고 영구적으로 중요한 오류를 pass로 숨기지 않습니다.",
        "message='택시' if 'money' in pocket else '도보'는 하나의 값을 고르는 표현식입니다. 간단하고 부작용 없는 두 값에 적합합니다. 중첩 조건 표현식은 읽기 어려우므로 if-elif로 바꿉니다.",
        "조건 표현식도 선택된 쪽만 평가합니다. 함수 호출이 양쪽에 있으면 조건에 따라 하나만 실행됩니다. 부작용에 의존하지 말고 값을 계산하는 용도로 사용합니다.",
      ],
      concepts: [
        { term: "조건 표현식", definition: "true_value if condition else false_value 형태로 두 값 중 하나를 평가·반환하는 표현식입니다.", detail: ["결과를 대입·return·함수 인수에 사용할 수 있습니다.", "복잡한 다중 분기는 문장형 if가 더 명확합니다."] },
        { term: "pass", definition: "문법상 문장이 필요한 블록에서 아무 동작도 하지 않는 문장입니다.", detail: ["자리표시자와 의도적 no-op에 사용합니다.", "예외를 처리하거나 조건을 건너뛰는 기능은 아닙니다."] },
      ],
      codeExamples: [
        {
          id: "membership-policy-choice",
          title: "소지품과 교통 정책을 bool·조건 표현식으로 분리",
          language: "python",
          filename: "membership_choice.py",
          purpose: "원본 ex06의 membership과 조건 표현식을 사용자 상태 정책으로 명확히 분리합니다.",
          code: "pocket = ['phone', 'money', 'paper']\nhas_money = 'money' in pocket\nhas_phone = 'phone' in pocket\n\ntransport = '택시 타고 가자' if has_money else '뛰어가자'\nprint(has_money, transport)\n\nif has_phone and not has_money:\n    action = '결제 앱을 확인한다'\nelif has_money:\n    action = '현금으로 결제한다'\nelse:\n    action = '도움을 요청한다'\nprint(action)",
          walkthrough: [
            { lines: "1-3", explanation: "membership 결과를 의미 있는 bool 이름으로 분리합니다." },
            { lines: "5-6", explanation: "간단한 두 문자열 값 선택에 조건 표현식을 사용합니다." },
            { lines: "8-13", explanation: "여러 상호배타 행동과 논리 조건은 문장형 elif 체인으로 표현합니다." },
            { lines: "14", explanation: "현재 pocket에는 money가 있어 두 번째 분기가 현금 결제를 선택합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "membership_choice.py를 저장"], command: "python membership_choice.py" },
          output: { value: "True 택시 타고 가자\n현금으로 결제한다", explanation: ["조건 계산과 사용자 문장을 별도 이름으로 두어 테스트하기 쉽습니다.", "첫 elif 조건은 phone True지만 not money False라 건너뜁니다.", "두 번째 money True에서 이후 else는 실행되지 않습니다."] },
          experiments: [
            { change: "pocket에서 money를 제거합니다.", prediction: "transport는 뛰어가자, action은 결제 앱 확인입니다.", result: "첫 if 조건이 True가 되어 뒤 elif를 건너뜁니다." },
            { change: "pocket을 빈 list로 만듭니다.", prediction: "도움을 요청한다가 선택됩니다.", result: "else가 앞 조건 전체의 나머지 상태를 처리합니다." },
          ],
          sourceRefs: ["py-if-else", "py-day03-note"],
        },
      ],
      diagnostics: [],
    },
    {
      id: "policy-testing-security",
      title: "분기 코드는 결정표와 경계 테스트로 검증합니다",
      lead: "한 번 실행해 원하는 출력이 나온 것으로 모든 경로가 맞다고 볼 수 없습니다. 조건 조합과 경계를 체계적으로 나열합니다.",
      explanations: [
        "학점은 69.99·70·79.99·80·89.99·90과 범위 밖을 테스트합니다. 권한 조건은 owner/admin/active의 True·False 조합을 decision table로 만듭니다. 실행되지 않은 분기는 coverage 도구로 발견할 수 있습니다.",
        "조건 순서 변경은 동작 변경이므로 리팩터링 전후 테스트를 유지합니다. 복잡한 정책은 함수·정책 객체로 분리하고 조건마다 이름을 부여합니다.",
        "보안 분기는 기본 거부가 원칙입니다. 알 수 없는 역할을 else에서 일반 사용자로 자동 허용하거나 예외 시 통과시키지 않습니다. 인증 실패·누락·만료·비활성을 각각 거부하고 감사 이벤트를 남깁니다.",
        "시간·환경·DB 상태를 조건에서 직접 읽으면 테스트가 불안정합니다. 필요한 상태를 인수로 주입하고 조건 평가와 I/O를 분리합니다.",
      ],
      concepts: [
        { term: "decision table", definition: "입력 조건 조합과 기대 행동을 표로 나열해 빠진·겹친 정책을 찾는 도구입니다.", detail: ["bool n개에는 최대 2^n 조합이 있습니다.", "권한·할인·상태 전이 테스트에 유용합니다."] },
        { term: "기본 거부", definition: "명시적으로 허용된 조건이 아니면 접근·행동을 거부하는 보안 원칙입니다.", detail: ["unknown·오류·누락을 허용으로 처리하지 않습니다.", "else의 의미를 ‘나머지 허용’으로 두기 전에 위협 모델을 검토합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "특정 권한 조합에서 비활성 사용자가 허용된다.", likelyCause: "and·or 괄호 또는 elif 순서가 요구사항과 달라 일부 조합을 잘못 분류했습니다.", checks: ["하위 조건을 bool 이름으로 분리합니다.", "모든 조합 decision table과 실제 결과를 비교합니다.", "unknown·None·예외 경로가 어느 else로 가는지 확인합니다."], fix: "정책을 괄호가 명확한 bool 함수로 만들고 기본 거부·조합 테스트를 적용합니다.", prevention: "보안 분기에는 부정 테스트와 branch coverage를 필수화합니다." },
      ],
      comparisons: [
        { title: "간단한 값 선택과 정책 분기 중 어떤 문법을 쓸까요?", options: [
          { name: "조건 표현식", chooseWhen: "부작용 없는 두 짧은 값 중 하나를 고를 때", avoidWhen: "다중 조건·오류 처리·여러 문장이 필요할 때", tradeoffs: ["한 줄로 값의 관계가 보입니다.", "중첩하면 읽기 어렵습니다.", "선택된 표현식만 평가됩니다."] },
          { name: "if-elif-else", chooseWhen: "여러 상호배타 경로·상태 변경·오류·로그가 필요할 때", avoidWhen: "단순한 두 문자열 대입에 과도하게 장황할 때", tradeoffs: ["블록별 의도가 명확합니다.", "조건 순서가 정책입니다.", "분기별 테스트가 필요합니다."] },
        ] },
      ],
      expertNotes: ["분기 폭발이 생기면 상태 머신·룰 테이블·다형성 같은 구조를 검토하되, 새로운 추상화도 테스트 가능한 의미를 가져야 합니다.", "시간 기반 권한은 timezone과 경계 순간을 주입해 테스트하고 시스템 현재 시각을 조건 곳곳에서 직접 읽지 않습니다."],
    },
  ],
  lab: {
    title: "검증된 성적 분류와 장학금 결정표",
    scenario: "세 점수 평균으로 학점을 정하고 출석·부정행위·평균 조건으로 장학금 여부를 기본 거부 정책으로 판단합니다.",
    setup: ["grade_policy_lab.py를 만듭니다.", "평균 경계와 attendance, cheating bool 조합을 준비합니다.", "Python 3.11 이상에서 실행합니다."],
    steps: ["각 점수 0~100을 먼저 검증하고 범위 밖을 분류하지 않습니다.", "평균 학점 조건을 90·80·70 하한 순서로 구현합니다.", "장학금은 not cheating and attendance>=0.9 and average>=85로 이름 있는 하위 조건을 둡니다.", "조건 미충족 이유를 첫 실패 하나 또는 전체 목록으로 반환하는 정책을 정합니다.", "69.99·70·79.99·80·89.99·90·100과 범위 밖을 테스트합니다.", "장학금 조건 조합 decision table을 작성합니다.", "branch coverage로 모든 학점·거부 이유가 실행되는지 확인합니다."],
    expectedResult: ["학점 경계가 겹치거나 비지 않습니다.", "범위 밖 점수가 F로 조용히 분류되지 않습니다.", "부정행위·출석·평균 중 하나라도 실패하면 장학금을 거부합니다.", "각 분기와 경계의 테스트 근거가 남습니다."],
    cleanup: ["합성 점수와 상태만 사용합니다."],
    extensions: ["학점 임계값을 설정 dict로 받아 순서·중복을 검증합니다.", "정책 결과를 dataclass decision으로 만듭니다.", "여러 학교 규칙을 전략 객체로 분리합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "정수 하나를 양수·0·음수로 분류하세요.", requirements: ["if-elif-else로 정확히 한 결과를 선택합니다.", "-1·0·1 경계를 실행합니다.", "독립 if 세 개 버전과 결과를 비교합니다."], hints: ["0을 별도 elif로 둡니다.", "조건 순서와 겹침을 적습니다."], expectedOutcome: "상호배타 분기와 경계 테스트를 설명할 수 있습니다.", solutionOutline: ["number>0, number==0, else를 사용합니다.", "세 입력을 각각 실행합니다.", "여러 결과 가능 여부를 비교합니다."] },
    { difficulty: "응용", prompt: "배송 수단 선택 정책을 구현하세요.", requirements: ["거리·무게·긴급·지역 제한을 검증합니다.", "자전거·택배·퀵·배송불가가 상호배타입니다.", "경계와 unknown region을 기본 거부합니다.", "조건 표현식이 적합한 한 부분만 선택해 사용합니다."], hints: ["입력 검증과 분류를 분리합니다.", "넓은 조건이 구체 조건을 가리지 않게 하세요."], expectedOutcome: "복합 요구를 읽을 수 있는 bool 이름과 elif 정책으로 변환합니다." },
    { difficulty: "설계", prompt: "JWT 접근 결정 정책을 분기 표로 설계하세요.", requirements: ["token 존재·서명·만료·사용자 활성·역할·리소스 소유를 구분합니다.", "unknown·예외는 기본 거부합니다.", "각 거부 이유의 사용자 응답과 감사 로그를 분리합니다.", "모든 bool 조합 중 의미 있는 테스트를 작성합니다.", "if 중첩과 guard clause 대안을 비교합니다."], hints: ["인증과 인가를 한 bool에 뭉치지 마세요.", "민감 token을 로그에 남기지 않습니다."], expectedOutcome: "입문 if를 보안상 감사 가능한 접근 결정 흐름으로 확장합니다." },
  ],
  reviewQuestions: [
    { question: "단일 if 조건이 False면 무엇이 실행되나요?", answer: "들여쓰기 블록을 건너뛰고 블록과 같은 수준의 다음 문장으로 진행합니다." },
    { question: "독립 if 세 개와 if-elif-else의 차이는 무엇인가요?", answer: "독립 if는 모든 조건을 검사해 여러 블록이 실행될 수 있고 elif 체인은 첫 참 하나만 실행합니다." },
    { question: "학점 하한 조건을 높은 점수부터 써야 하는 이유는 무엇인가요?", answer: "낮은 넓은 조건을 먼저 쓰면 높은 점수도 그 조건에서 멈춰 뒤의 구체 조건이 가려지기 때문입니다." },
    { question: "else가 항상 안전한 정상 기본값인가요?", answer: "아닙니다. 앞 조건의 여집합 전체라 범위 밖·unknown도 포함할 수 있어 사전 검증과 기본 거부가 필요합니다." },
    { question: "pass는 조건을 건너뛰거나 예외를 숨기나요?", answer: "아닙니다. 블록에서 아무 동작도 하지 않는 문장일 뿐이며 다음 흐름은 정상 진행됩니다." },
    { question: "조건 표현식은 언제 적합한가요?", answer: "부작용 없는 짧은 두 값 중 하나를 선택할 때 적합하고 다중 정책·여러 문장에는 if가 낫습니다." },
    { question: "분기 정책을 어떻게 검증하나요?", answer: "경계값·바로 아래/위, decision table, 부정 테스트와 branch coverage로 모든 경로를 확인합니다." },
  ],
  completionChecklist: [
    "콜론·들여쓰기 블록과 조건 거짓 후 합류 흐름을 설명할 수 있다.",
    "독립 if와 상호배타 elif 체인을 요구에 맞게 선택할 수 있다.",
    "조건 순서·경계·else 여집합을 구간으로 검토할 수 있다.",
    "모든 계속 경로에서 필요한 변수가 정의되게 만들 수 있다.",
    "membership·pass·조건 표현식을 적절한 범위에서 사용할 수 있다.",
    "guard clause로 깊은 중첩을 줄이는 이유를 설명할 수 있다.",
    "결정표·경계·branch coverage와 기본 거부로 정책을 검증할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-if-basic", repository: "PYTHON-BASIC", path: "day03/ex05_if.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day03/ex05_if.py", usedFor: ["단일 if", "들여쓰기", "짝홀 판별", "입력 실행"], evidence: "Python 3.13.9에 입력 7을 제공해 '홀수' 출력을 확인했습니다. 주석 속 합격·짝홀 예제도 범위 설계에 반영했습니다." },
    { id: "py-if-else", repository: "PYTHON-BASIC", path: "day03/ex06_if_else.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day03/ex06_if_else.py", usedFor: ["if-else", "membership", "pass", "조건 표현식"], evidence: "원본 실행에서 membership True/False, money 분기와 조건 표현식 '택시 타고 가자' 출력을 확인했습니다." },
    { id: "py-multi-if", repository: "PYTHON-BASIC", path: "day03/ex07_multi_if.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day03/ex07_multi_if.py", usedFor: ["if-elif-else", "학점 경계", "입력·평균·출력"], evidence: "둘리·100·80·70 입력으로 total 250, average 83.33, B학점 결과를 확인했습니다. 내장 sum shadow는 total로 개선했습니다." },
    { id: "py-day03-note", repository: "PYTHON-BASIC", path: "notes/day03_collection_control.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day03_collection_control.md", usedFor: ["조건문 형식", "다중 분기", "membership·pass", "셀프 체크"], evidence: "원본 노트 범위를 유지하고 결정표·guard·기본 거부·분기 coverage를 보강했습니다." },
  ],
  sourceCoverage: { filesRead: 4, filesUsed: 4, uncoveredNotes: ["match/case는 py-017, 반복문은 py-018~019에서 별도로 다룹니다.", "정책 객체·branch coverage·보안 기본 거부는 원본 공백을 전문가 관점으로 보강했습니다."] },
} satisfies DetailedSession;

export default session;
