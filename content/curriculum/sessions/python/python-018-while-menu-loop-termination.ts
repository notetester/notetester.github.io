import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-018"],
  slug: "python-018-while-menu-loop-termination",
  courseId: "python",
  moduleId: "02-control-functions-io",
  order: 18,
  title: "while·메뉴 루프·종료 조건",
  subtitle: "조건을 다시 검사하며 상태를 바꾸는 반복의 구조를 이해하고, 사용자가 종료 메뉴를 고를 때 정확히 끝나는 루프를 설계합니다.",
  level: "기초",
  estimatedMinutes: 110,
  coreQuestion: "반복 횟수를 미리 알 수 없을 때 while은 어떤 상태를 언제 검사하고 바꾸며, 종료 가능성을 어떻게 코드와 테스트로 증명할까요?",
  summary: "원본의 1~10 출력, 짝수 출력, Quit 메뉴 예제를 직접 재현합니다. while은 조건이 참인 동안 본문을 반복하므로 초기 상태·조건·상태 갱신이 하나의 계약을 이룹니다. 이 세션에서는 카운터 추적, 0회 실행 가능성, 경계값, sentinel 메뉴, 잘못된 입력, 무한 반복과 off-by-one 진단, 자동 테스트 가능한 입력 시뮬레이션을 익힙니다. break와 continue는 다음 원자 세션의 범위로 남기고, 여기서는 조건 자체가 거짓이 되어 자연스럽게 종료되는 구조에 집중합니다.",
  objectives: [
    "while의 조건 검사 → 본문 실행 → 상태 갱신 → 조건 재검사 순서를 상태표로 설명할 수 있다.",
    "초기값과 비교 연산자를 보고 본문이 0회, 유한 횟수, 무한히 실행될 가능성을 예측할 수 있다.",
    "1부터 10까지와 그중 짝수만 출력하는 원본 루프를 직접 실행하고 cnt의 변화를 추적할 수 있다.",
    "종료 선택값을 sentinel로 사용하는 메뉴 루프를 작성하고 마지막 선택이 처리된 뒤 종료되는 시점을 설명할 수 있다.",
    "증감식 누락, 잘못된 경계 연산자, 입력 타입 불일치, 숫자 변환 실패를 traceback과 상태 출력으로 진단할 수 있다.",
    "실제 input과 처리 로직을 분리해 정해진 입력 시퀀스로 종료 가능성을 자동 검증할 수 있다.",
  ],
  prerequisites: [
    {
      title: "불리언과 truthiness",
      reason: "while은 매 반복 시작마다 조건의 진리값을 판정합니다. 숫자와 컬렉션이 조건에서 어떻게 True·False가 되는지 알아야 종료 조건을 정확히 읽을 수 있습니다.",
      sessionSlug: "python-003-truthiness",
    },
    {
      title: "if·elif·else와 조건 표현식",
      reason: "짝수만 출력하거나 메뉴 번호별 동작을 나눌 때 while 본문 안의 조건 분기를 사용합니다.",
      sessionSlug: "python-016-if-elif-else-conditional-expression",
    },
  ],
  keywords: ["Python", "while", "반복문", "종료 조건", "sentinel", "메뉴 루프", "카운터", "무한 루프", "off-by-one", "loop invariant"],
  chapters: [
    {
      id: "while-execution-model",
      title: "while은 조건을 먼저 검사하는 반복문입니다",
      lead: "while condition:은 본문을 무조건 한 번 실행하는 문법이 아니라, 매 반복 직전에 조건을 검사해 True일 때만 본문에 들어갑니다.",
      explanations: [
        "파이썬은 while 줄에 도달하면 조건식을 평가합니다. 결과가 truthy면 들여쓴 본문을 위에서 아래로 한 번 실행하고 다시 while 줄로 돌아옵니다. 조건이 falsy면 본문을 건너뛰고 while 블록 다음 문장으로 이동합니다. 따라서 실행 순서는 초기 상태 준비 → 조건 검사 → 본문 → 상태 변화 → 조건 재검사의 고리입니다.",
        "초기 조건이 처음부터 False라면 본문은 0회 실행됩니다. cnt = 11 다음 while cnt <= 10은 한 번도 출력하지 않습니다. 이 성질은 최소 한 번 입력을 받아야 하는 절차를 설계할 때 중요합니다. while을 썼다고 자동으로 한 번 실행되는 것은 아니므로 초기 상태가 첫 진입을 허용하는지 확인해야 합니다.",
        "while 자체는 반복 횟수를 계산해 주지 않습니다. 조건이 언젠가 거짓이 될지 여부는 프로그램이 관리하는 상태에 달려 있습니다. 카운터 루프라면 cnt가 경계를 향해 움직여야 하고, 메뉴 루프라면 choice가 종료 선택값으로 갱신될 수 있어야 합니다. 상태가 그대로이거나 경계에서 멀어지는 방향으로 바뀌면 루프는 끝나지 않을 수 있습니다.",
      ],
      concepts: [
        {
          term: "선검사 반복",
          definition: "본문에 들어가기 전에 조건을 먼저 평가하는 반복 구조입니다.",
          detail: [
            "초기 조건이 False면 본문은 0회 실행됩니다.",
            "각 본문 실행이 끝날 때마다 같은 조건을 다시 평가합니다.",
          ],
          analogy: "놀이기구에 탈 때마다 먼저 남은 이용권이 있는지 확인하고, 탑승 후 이용권 수를 줄인 뒤 다시 확인하는 과정과 같습니다.",
        },
        {
          term: "루프 상태",
          definition: "반복 조건과 본문의 동작을 결정하며 실행 중 변하는 값들의 집합입니다.",
          detail: [
            "카운터 cnt, 사용자의 메뉴 선택 choice, 남은 작업 수 등이 상태가 될 수 있습니다.",
            "상태를 어떤 문장이 어떻게 바꾸는지 찾으면 반복 횟수와 종료 여부를 추론할 수 있습니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: [
        "운영 코드에서는 반복 조건에 네트워크 상태나 외부 파일 변화가 들어갈 수 있습니다. 외부 상태가 영원히 바뀌지 않는 경우를 대비해 timeout, 최대 재시도 수, 취소 신호 같은 상한을 별도로 설계합니다.",
      ],
    },
    {
      id: "counter-state-trace",
      title: "초기식·조건식·증감식을 상태표로 추적합니다",
      lead: "원본이 강조한 세 부분은 문법 조각이 아니라 종료 가능성을 증명하는 최소 정보입니다.",
      explanations: [
        "cnt = 1은 첫 검사에 사용할 초기 상태입니다. cnt <= 10은 현재 값을 반복 범위에 포함할지 결정합니다. cnt += 1은 본문을 한 번 수행한 뒤 다음 상태로 이동시킵니다. 세 요소 중 하나라도 빠지면 출력 범위가 달라지거나 종료되지 않습니다.",
        "첫 반복 직전 cnt는 1이고 조건은 True입니다. 1을 출력한 뒤 cnt는 2가 됩니다. 열 번째 반복 직전 cnt는 10이고 <= 조건이 True라 10을 출력합니다. 그 뒤 11이 되고 다음 검사에서 False가 되어 종료합니다. 종료 시점의 cnt가 11이라는 사실까지 추적해야 경계가 정확한지 알 수 있습니다.",
        "짝수 루프에서도 cnt는 모든 1~10 상태를 지나갑니다. if cnt % 2 == 0 조건이 출력 여부만 결정할 뿐 cnt 갱신은 if 바깥에서 항상 실행됩니다. 갱신을 if 안으로 옮기면 첫 cnt=1이 홀수라 갱신되지 않아 같은 상태를 영원히 반복하게 됩니다.",
      ],
      concepts: [
        {
          term: "카운터",
          definition: "반복 진행 정도를 숫자로 나타내고 매 반복 일정한 규칙으로 갱신하는 상태 변수입니다.",
          detail: [
            "이름은 cnt보다 count, current 같은 역할 중심 이름이 유지보수에 유리할 수 있습니다.",
            "증가량은 반드시 1일 필요가 없지만 종료 경계를 향해야 합니다.",
          ],
        },
        {
          term: "loop invariant",
          definition: "반복 시작이나 종료 시점마다 계속 참이어야 하는 상태 관계입니다.",
          detail: [
            "1~10 루프에서는 각 본문 시작 시 1 <= cnt <= 10이라는 관계를 확인할 수 있습니다.",
            "invariant를 적으면 상태 갱신이 범위를 벗어나거나 건너뛰는 버그를 찾기 쉽습니다.",
          ],
          caveat: "invariant가 참이라는 사실만으로 종료가 증명되지는 않습니다. 상태가 종료 경계를 향해 진전된다는 조건도 필요합니다.",
        },
      ],
      codeExamples: [
        {
          id: "while-source-counter-replay",
          title: "1~10 전체와 짝수를 원본 구조로 출력하기",
          language: "python",
          filename: "while_counts.py",
          purpose: "원본 ex08_while.py의 두 카운터 루프를 그대로 재구성해 조건 경계, 출력 end 옵션, 상태 갱신 위치를 검증합니다.",
          code: "count = 1\nwhile count <= 10:\n    print(count, end=' ')\n    count += 1\nprint()\n\ncount = 1\nwhile count <= 10:\n    if count % 2 == 0:\n        print(count, end=' ')\n    count += 1\nprint()\n\nprint(f'종료 상태: count={count}')",
          walkthrough: [
            {
              lines: "1",
              explanation: "첫 조건 검사 전에 count를 1로 초기화합니다. 1을 포함해 출력하려는 요구사항과 초기값이 일치합니다.",
            },
            {
              lines: "2-4",
              explanation: "10 이하인 동안 현재 수를 출력하고 매번 1 증가시킵니다. end=' '는 자동 줄바꿈 대신 공백을 사용합니다.",
            },
            {
              lines: "5",
              explanation: "첫 루프의 숫자들을 한 줄에 모은 뒤 빈 print로 줄을 바꿉니다.",
            },
            {
              lines: "7-11",
              explanation: "둘째 루프는 모든 count를 갱신하되 짝수일 때만 출력합니다. 갱신이 if 밖에 있어 홀수에서도 다음 상태로 진행합니다.",
            },
            {
              lines: "14",
              explanation: "마지막 10을 처리한 뒤 count가 11이 되어 조건이 False였음을 출력으로 확인합니다.",
            },
          ],
          run: {
            environment: ["Python 3.11 이상", "UTF-8로 저장한 while_counts.py", "외부 패키지 없음"],
            command: "python while_counts.py",
          },
          output: {
            value: "1 2 3 4 5 6 7 8 9 10 \n2 4 6 8 10 \n종료 상태: count=11",
            explanation: [
              "첫 줄은 <=가 10을 포함하기 때문에 1부터 10까지 나옵니다.",
              "둘째 줄은 같은 열 개 상태 중 나머지가 0인 수만 출력합니다.",
              "마지막 count=11은 종료 조건을 만족하지 않은 첫 상태입니다.",
            ],
          },
          experiments: [
            {
              change: "두 while 조건을 count < 10으로 바꿉니다.",
              prediction: "10을 처리하기 전에 조건이 False가 되어 첫 줄은 1~9, 둘째 줄은 2·4·6·8만 출력됩니다.",
              result: "경계 연산자 하나가 최종 포함값을 바꾸는 off-by-one 차이를 확인합니다.",
            },
            {
              change: "둘째 루프의 count += 1을 if 블록 안으로 옮깁니다.",
              prediction: "초기 count=1이 홀수라 if가 실행되지 않고 count가 계속 1이어서 출력 없이 무한 반복합니다.",
              result: "상태 갱신은 특정 분기만이 아니라 모든 반복 경로에서 일어나야 함을 확인합니다. 실제 실험은 실행 중단 방법을 준비한 뒤 수행합니다.",
            },
          ],
          sourceRefs: ["py-while-source", "py-day03-while-note"],
        },
      ],
      diagnostics: [
        {
          symptom: "프로그램이 출력 없이 계속 실행되고 종료되지 않는다.",
          likelyCause: "조건에 영향을 주는 상태 갱신이 누락됐거나 특정 if 분기 안에만 있어 현재 상태에서 실행되지 않습니다.",
          checks: [
            "while 조건에 등장하는 모든 이름을 적고 본문에서 어느 줄이 값을 바꾸는지 찾습니다.",
            "본문 첫 줄에 print(repr(state))를 임시 추가해 같은 상태가 반복되는지 확인합니다.",
            "모든 분기 경로에서 상태가 종료 경계를 향해 변하는지 표로 추적합니다.",
          ],
          fix: "상태 갱신을 모든 반복에서 실행되는 위치로 옮기고, 증가·감소 방향이 조건 경계를 향하도록 수정합니다.",
          prevention: "초기·중간·마지막·종료 직후 상태를 테스트하고 개발 중에는 안전한 최대 반복 수를 둡니다.",
        },
      ],
    },
    {
      id: "boundaries-and-zero-runs",
      title: "경계 연산자와 초기값이 반복 횟수를 결정합니다",
      lead: "<와 <=, 0과 1의 차이는 작아 보이지만 출력 개수와 배열 접근 범위를 바꾸는 대표적인 off-by-one 원인입니다.",
      explanations: [
        "1부터 10까지 포함하려면 초기값 1과 조건 <= 10의 조합이 자연스럽습니다. 0부터 9까지 열 번 반복하려면 초기값 0과 조건 < 10을 사용합니다. 둘 다 열 번이지만 값의 범위가 다릅니다. 요구사항을 먼저 닫힌 구간 [1,10] 또는 반열린 구간 [0,10)처럼 적으면 코드 변환이 쉬워집니다.",
        "초기값이 이미 종료 경계 밖이면 본문은 실행되지 않습니다. 이것은 오류일 수도 있고 정상 동작일 수도 있습니다. 처리할 작업이 0개인 큐에서 while remaining > 0이 0회 실행되는 것은 자연스럽습니다. 반면 사용자에게 반드시 한 번 메뉴를 보여야 하는데 choice를 종료값 4로 초기화하면 본문이 0회여서 요구사항이 깨집니다.",
        "반복 후 상태도 계약에 포함해야 합니다. count <= limit 루프가 끝난 뒤 count는 보통 limit + 1입니다. 이후 코드가 count를 마지막 유효값이라고 가정하면 오류가 납니다. 반복 안에서 처리한 값과 반복을 끝낸 첫 실패 상태를 구분하세요.",
      ],
      concepts: [
        {
          term: "off-by-one error",
          definition: "반복의 시작·끝 경계를 한 칸 잘못 포함하거나 제외해 실행 횟수가 하나 많거나 적어지는 오류입니다.",
          detail: [
            "<와 <=, 초기값 0과 1, 갱신 전·후 출력 위치에서 자주 생깁니다.",
            "작은 값으로 손으로 펼친 상태표와 길이 검증이 효과적입니다.",
          ],
        },
        {
          term: "반열린 구간",
          definition: "시작은 포함하고 끝은 제외하는 [start, end) 형태의 범위입니다.",
          detail: [
            "인덱스 기반 반복에서 길이 n이면 유효 인덱스 0부터 n-1을 자연스럽게 표현합니다.",
            "while index < len(items) 형태가 대표적입니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "1부터 10을 기대했는데 10이 빠지거나 11까지 출력된다.",
          likelyCause: "비교 연산자와 출력·증감 순서가 요구한 포함 범위와 맞지 않습니다.",
          checks: [
            "첫 본문 진입 전 값, 마지막 기대값, 종료 직후 값을 적습니다.",
            "조건이 <인지 <=인지 확인합니다.",
            "출력이 증감 전인지 후인지 확인합니다.",
          ],
          fix: "요구 범위를 먼저 [시작, 끝] 또는 [시작, 끝)로 적고 초기값·조건·증감 순서를 그 범위에 맞춥니다.",
          prevention: "0개, 1개, 일반 개수, 경계 바로 전·후를 자동 테스트합니다.",
        },
      ],
    },
    {
      id: "sentinel-menu-loop",
      title: "종료 선택값을 sentinel로 사용합니다",
      lead: "원본 메뉴는 choice가 4가 될 때까지 입력을 반복하고, 4를 읽은 다음 재검사에서 자연스럽게 루프를 끝냅니다.",
      explanations: [
        "sentinel은 일반 처리값과 구분되는 종료 표식입니다. 메뉴 번호 1, 2, 3은 동작을 선택하고 4는 Quit을 뜻합니다. choice를 0처럼 종료값이 아닌 값으로 초기화하면 첫 조건 choice != 4가 True라 메뉴를 한 번 이상 보여 줍니다.",
        "본문에서 새 입력을 choice에 저장하는 문장이 핵심 상태 갱신입니다. 사용자가 4를 입력한 즉시 현재 본문 나머지는 계속 실행될 수 있고, 본문이 끝난 뒤 조건을 다시 검사할 때 루프가 종료됩니다. 원본이 4도 '당신의 선택: 4'로 출력한 뒤 작별 메시지를 보여 주는 이유입니다.",
        "sentinel의 타입은 입력 변환과 일치해야 합니다. int(input())을 사용하면 choice는 int이므로 4와 비교합니다. input 결과를 변환하지 않고 문자열로 유지하면 '4'와 비교해야 합니다. choice != 4와 choice='4'가 섞이면 값 모양은 같아 보여도 타입이 달라 영원히 종료되지 않습니다.",
      ],
      concepts: [
        {
          term: "sentinel",
          definition: "반복을 종료하거나 특별 상태를 알리기 위해 일반 처리값과 구분해 정한 표식 값입니다.",
          detail: [
            "메뉴의 Quit 번호, 파일 읽기의 EOF, 큐의 종료 메시지 등이 될 수 있습니다.",
            "정상 데이터와 충돌하지 않고 타입까지 명확해야 합니다.",
          ],
          caveat: "마법 숫자 4만 흩어 놓지 말고 QUIT = 4처럼 이름을 붙이면 메뉴 순서 변경과 리뷰가 쉬워집니다.",
        },
        {
          term: "자연 종료",
          definition: "본문에서 상태를 바꾼 뒤 while 조건이 False가 되어 다음 반복에 진입하지 않는 종료 방식입니다.",
          detail: [
            "이 세션은 자연 종료에 집중합니다.",
            "본문 중간에서 즉시 빠져나오는 break는 다음 원자 세션에서 다룹니다.",
          ],
        },
      ],
      codeExamples: [
        {
          id: "deterministic-menu-loop",
          title: "정해진 선택값으로 메뉴 종료를 자동 검증하기",
          language: "python",
          filename: "menu_simulation.py",
          purpose: "원본의 choice != 4 구조를 유지하면서 입력값을 리스트로 제공해 모든 실행에서 같은 종료 과정을 재현합니다.",
          code: "ACTIONS = {1: 'Add', 2: 'Del', 3: 'List'}\nQUIT = 4\nchoices = [1, 9, 3, 4]\n\nposition = 0\nchoice = 0\nwhile choice != QUIT:\n    choice = choices[position]\n    position += 1\n    print(f'입력: {choice}')\n\n    if choice in ACTIONS:\n        print(f'실행: {ACTIONS[choice]}')\n    elif choice != QUIT:\n        print('지원하지 않는 메뉴')\n\nprint('수고하셨습니다.')\nprint(f'소비한 입력 수: {position}')",
          walkthrough: [
            {
              lines: "1-3",
              explanation: "처리 메뉴와 종료 sentinel을 이름으로 분리하고, 원본 input 대신 재현 가능한 선택값 네 개를 준비합니다.",
            },
            {
              lines: "5-7",
              explanation: "position은 다음 입력 위치, choice는 종료 조건 상태입니다. choice=0이므로 첫 조건은 True입니다.",
            },
            {
              lines: "8-10",
              explanation: "현재 위치의 선택을 읽고 위치를 1 증가시킵니다. 실제 input이 choice를 갱신하는 역할을 리스트가 대신합니다.",
            },
            {
              lines: "12-15",
              explanation: "1~3은 동작을 출력하고, 9처럼 미지원인 값만 오류 메시지를 냅니다. QUIT=4는 미지원으로 보고하지 않습니다.",
            },
            {
              lines: "17-18",
              explanation: "choice가 4인 본문까지 마친 뒤 다음 조건 검사에서 False가 되어 작별 메시지로 이동합니다. 네 입력을 정확히 소비했습니다.",
            },
          ],
          run: {
            environment: ["Python 3.11 이상", "UTF-8로 저장한 menu_simulation.py", "외부 패키지 없음"],
            command: "python menu_simulation.py",
          },
          output: {
            value: "입력: 1\n실행: Add\n입력: 9\n지원하지 않는 메뉴\n입력: 3\n실행: List\n입력: 4\n수고하셨습니다.\n소비한 입력 수: 4",
            explanation: [
              "9는 종료값이 아니므로 오류를 출력하고 다음 반복으로 진행합니다.",
              "4를 읽은 반복에서는 별도 동작 없이 본문이 끝나며 다음 조건에서 종료됩니다.",
              "position=4는 선택 네 개를 더 읽으려 하지 않고 정확히 종료했음을 보여 줍니다.",
            ],
          },
          experiments: [
            {
              change: "choices 마지막 4를 제거합니다.",
              prediction: "종료 sentinel에 도달하지 못해 다음 입력을 읽을 때 IndexError가 발생합니다.",
              result: "테스트용 입력에도 종료 가능성을 보장하는 sentinel 또는 최대 시도 정책이 필요함을 확인합니다.",
            },
            {
              change: "choice = choices[position]을 str(choices[position])으로 바꾸고 조건은 int 4를 유지합니다.",
              prediction: "문자열 '4'와 정수 4가 같지 않아 루프가 종료되지 않고 이후 IndexError가 납니다.",
              result: "sentinel 비교는 값뿐 아니라 타입 계약까지 일치해야 합니다.",
            },
          ],
          sourceRefs: ["py-while-source", "py-day03-while-note"],
        },
      ],
      diagnostics: [
        {
          symptom: "Quit에 4를 입력했는데 메뉴가 다시 나오거나 입력이 끝난 뒤 오류가 발생한다.",
          likelyCause: "choice가 문자열 '4'인데 조건은 정수 4와 비교하거나, 읽은 값을 다른 이름에 저장해 조건 상태가 갱신되지 않았습니다.",
          checks: [
            "print(repr(choice), type(choice))로 실제 값과 타입을 확인합니다.",
            "while 조건에 쓰인 이름과 input 결과를 대입한 이름이 같은지 확인합니다.",
            "QUIT 상수의 타입이 입력 파싱 결과와 같은지 확인합니다.",
          ],
          fix: "문자열로 처리한다면 '4', 정수로 파싱한다면 4로 전체 계약을 통일하고 조건 상태에 새 입력을 대입합니다.",
          prevention: "Quit, 일반 메뉴, 잘못된 타입을 포함한 입력 시퀀스 테스트를 두고 sentinel을 이름 있는 상수로 관리합니다.",
        },
      ],
    },
    {
      id: "input-validation-without-lost-progress",
      title: "잘못된 입력은 상태를 망가뜨리지 않고 다시 받습니다",
      lead: "int(input())은 간단하지만 숫자가 아닌 입력에서 ValueError로 프로그램 전체가 끝나므로, 사용자 루프에는 입력 계약과 복구 정책이 필요합니다.",
      explanations: [
        "원본은 학습 초점을 while에 두기 위해 입력을 즉시 int로 변환합니다. 따라서 x, 빈 줄, 4.0을 입력하면 ValueError가 발생합니다. 이것은 while 오류가 아니라 문자열을 정수로 바꾸는 경계에서 난 오류입니다. traceback 마지막 줄의 예외 타입과 변환 대상 문자열을 먼저 확인합니다.",
        "입력을 문자열로 받은 뒤 허용 메뉴 집합에 속하는지 확인하면 변환 예외 없이 처리할 수 있습니다. 또는 try/except ValueError로 숫자 변환 실패만 좁게 복구할 수 있습니다. 어느 방식을 선택하든 잘못된 입력이 종료 상태로 오인되거나 이전 choice를 덮어 루프가 비정상 종료되지 않게 해야 합니다.",
        "입력이 영원히 잘못될 수 있다는 점도 설계해야 합니다. 대화형 프로그램은 사용자가 다시 입력할 수 있지만 자동화·네트워크 서비스는 최대 시도, timeout, 취소 신호가 필요합니다. 무제한 재시도는 CPU를 거의 쓰지 않더라도 사용자 세션과 자원을 영원히 붙잡을 수 있습니다.",
      ],
      concepts: [
        {
          term: "입력 경계",
          definition: "외부 문자열이 프로그램 내부의 검증된 타입과 상태로 들어오는 지점입니다.",
          detail: [
            "input은 항상 문자열을 반환합니다.",
            "파싱·허용 범위·오류 메시지를 경계에서 처리하면 내부 루프 상태가 단순해집니다.",
          ],
        },
        {
          term: "복구 가능한 오류",
          definition: "사용자에게 원인을 알리고 새 입력으로 정상 흐름을 계속할 수 있는 오류입니다.",
          detail: [
            "숫자 메뉴에서 비숫자 입력은 보통 재입력으로 복구할 수 있습니다.",
            "예상하지 못한 시스템 오류까지 광범위하게 숨기면 진단이 어려워집니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "ValueError: invalid literal for int() with base 10이 발생하고 메뉴가 종료된다.",
          likelyCause: "input으로 받은 문자열이 정수 표기가 아닌데 int가 변환을 시도했습니다.",
          checks: [
            "traceback 마지막 줄에서 실제 입력 표현을 확인합니다.",
            "공백 제거 후 빈 문자열인지, 소수점이나 문자가 포함됐는지 봅니다.",
            "허용 메뉴가 정말 숫자여야 하는지 입력 계약을 확인합니다.",
          ],
          fix: "문자열 허용 목록으로 먼저 검증하거나 int 변환만 좁은 try/except ValueError로 감싸고 유효한 새 입력을 받습니다.",
          prevention: "정상 메뉴, 범위 밖 숫자, 문자, 빈 줄, 양끝 공백 표본을 테스트합니다.",
        },
        {
          symptom: "자동 실행에서 EOFError: EOF when reading a line이 발생한다.",
          likelyCause: "루프가 준비된 입력 수보다 더 많이 input을 호출했거나 종료 sentinel이 입력 시퀀스에 없습니다.",
          checks: [
            "몇 번째 반복에서 몇 번째 input을 요청했는지 카운터를 출력합니다.",
            "테스트 입력 마지막에 Quit 값이 있는지 확인합니다.",
            "sentinel 타입 불일치로 Quit를 지나친 것은 아닌지 확인합니다.",
          ],
          fix: "테스트 입력에 유효한 종료값을 포함하고, 입력 공급자가 끝날 수 있는 환경에서는 EOF를 명시적 취소 또는 오류로 처리합니다.",
          prevention: "소비한 입력 수를 검증하고 종료값 없음·즉시 종료·여러 잘못된 값 후 종료 사례를 둡니다.",
        },
      ],
    },
    {
      id: "termination-proof-and-safety",
      title: "종료 가능성을 말이 아니라 상태 변화로 증명합니다",
      lead: "while이 언젠가 끝날 것이라는 기대 대신, 매 반복 종료 경계에 가까워지는 값을 정하고 하한·상한을 확인합니다.",
      explanations: [
        "카운터 루프에는 variant라고 부를 수 있는 진행량이 있습니다. 예를 들어 10 - count는 반복마다 1씩 줄고 일정한 하한 아래로 무한히 내려가기 전에 조건이 False가 됩니다. 메뉴 루프는 사용자가 4를 입력할 가능성에 의존하므로 수학적으로 자동 종료를 보장하지 않습니다. 그 대신 취소·최대 시도·세션 timeout 정책을 추가할 수 있습니다.",
        "루프 본문에 여러 분기가 있다면 모든 경로가 상태를 갱신하거나 의도적으로 다음 입력을 기다리는지 검토합니다. 한 경로에서만 count가 증가하지 않으면 특정 입력에서 멈춥니다. 코드 리뷰에서는 조건에 등장하는 변수, 본문의 갱신 문장, 경계 방향, 외부 의존성을 표로 적는 것이 효과적입니다.",
        "무한 루프를 발견했을 때는 먼저 안전하게 중단합니다. 터미널에서 Ctrl+C는 일반적으로 KeyboardInterrupt를 일으켜 현재 프로그램을 멈춥니다. 그 뒤 상태 출력을 추가하고 작은 입력으로 재현합니다. 프로세스를 반복해서 강제 종료하는 것보다 종료 조건을 최소 예제로 줄여 원인을 찾습니다.",
      ],
      concepts: [
        {
          term: "종료 증명",
          definition: "반복 상태가 매번 종료 경계에 가까워지고 무한히 진행할 수 없음을 논리적으로 설명하는 과정입니다.",
          detail: [
            "유한 카운터는 진행량과 상·하한으로 설명할 수 있습니다.",
            "사용자·네트워크 같은 외부 상태에는 최대 시도와 timeout 같은 운영 상한이 필요합니다.",
          ],
        },
        {
          term: "KeyboardInterrupt",
          definition: "사용자가 보통 Ctrl+C로 실행 중인 파이썬 프로그램의 중단을 요청했을 때 발생하는 예외입니다.",
          detail: [
            "개발 중 실수로 만든 무한 루프를 중단하는 데 유용합니다.",
            "운영 종료 절차는 파일·DB 연결 정리까지 고려한 별도 graceful shutdown이 필요합니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: [
        "반복이 외부 API를 호출한다면 지수 backoff, jitter, 최대 재시도, idempotency를 함께 설계합니다. 빠른 무한 재시도는 상대 서비스를 공격하는 것과 같은 부하를 만들 수 있습니다.",
        "비밀번호·토큰을 상태 진단용 print에 남기지 않습니다. 반복 횟수, 상태 코드, 입력 길이처럼 최소한의 메타데이터만 기록합니다.",
      ],
    },
    {
      id: "testable-loop-design",
      title: "입력·상태 전이·동작을 분리하면 루프를 테스트할 수 있습니다",
      lead: "input과 print를 while 안에 모두 넣으면 사람이 직접 입력해야 검증할 수 있지만, 상태 전이를 분리하면 고정 입력으로 종료 과정을 재현할 수 있습니다.",
      explanations: [
        "앞의 메뉴 시뮬레이션은 실제 input 대신 choices 리스트를 사용했습니다. 목적은 사용자 인터페이스를 없애는 것이 아니라 입력 공급자를 바꿔도 같은 상태 전이 규칙을 검증하는 것입니다. 실제 앱에서는 input 함수가 문자열을 제공하고 테스트에서는 준비한 시퀀스가 값을 제공합니다.",
        "루프 테스트는 최종 출력만 확인하지 말고 처리 순서, 소비한 입력 수, 종료 후 상태를 함께 봅니다. 즉시 Quit는 1개만 소비해야 하고, 잘못된 값 두 개 뒤 Quit는 3개를 소비하며, Quit가 없으면 정한 최대 시도나 입력 소진 오류로 끝나야 합니다.",
        "반복 본문이 커지면 메뉴 표시, 입력 파싱, 명령 실행, 상태 갱신을 함수로 나눕니다. 이 세션에서는 함수 구현보다 책임 분리의 이유만 다루며, 함수 세션 이후 같은 코드를 더 작은 단위 테스트로 리팩터링할 수 있습니다.",
      ],
      concepts: [
        {
          term: "상태 전이",
          definition: "현재 상태와 입력을 바탕으로 다음 상태와 수행 동작을 결정하는 과정입니다.",
          detail: [
            "메뉴에서는 current choice와 새 입력이 다음 choice를 만듭니다.",
            "전이를 분리하면 동일 입력에 동일 결과가 나오는지 자동 검증하기 쉽습니다.",
          ],
        },
        {
          term: "결정적 테스트",
          definition: "같은 초기 상태와 입력을 주면 매번 같은 실행 순서와 결과가 나오는 테스트입니다.",
          detail: [
            "대화형 입력, 현재 시간, 네트워크를 직접 의존하지 않게 분리합니다.",
            "무한 대기 대신 유한 입력과 명시적 실패를 사용합니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        {
          title: "while과 for 중 무엇을 선택할까요?",
          options: [
            {
              name: "while",
              chooseWhen: "종료 시점이 횟수보다 상태·사용자 입력·외부 조건으로 결정될 때",
              avoidWhen: "이미 순회할 컬렉션이나 정확한 range가 있을 때",
              tradeoffs: ["상태 기반 종료를 직접 표현합니다.", "초기화·갱신 누락으로 무한 반복이 생길 수 있습니다.", "종료 안전장치를 직접 설계해야 합니다."],
            },
            {
              name: "for",
              chooseWhen: "컬렉션의 각 원소나 정해진 range를 한 번씩 처리할 때",
              avoidWhen: "다음 반복 여부가 처리 결과나 사용자 선택에 따라 달라질 때",
              tradeoffs: ["인덱스 갱신을 직접 쓰지 않아 실수가 줄어듭니다.", "순회 대상이 유한하면 종료가 더 분명합니다.", "for와 range는 뒤 원자 세션에서 상세히 다룹니다."],
            },
          ],
        },
      ],
      expertNotes: [
        "상태 기계로 커지는 메뉴는 while 하나에 case를 계속 추가하지 말고 명시적인 상태 타입과 전이표, 입력 검증, 관찰 가능한 이벤트로 분리합니다.",
      ],
    },
  ],
  lab: {
    title: "안전한 학습 기록 메뉴 만들기",
    scenario: "사용자가 학습 시간 추가, 현재 합계 조회, 초기화, 종료를 선택하는 콘솔 메뉴를 만듭니다. 잘못된 입력으로 프로그램이 죽거나 종료되지 않는 상태를 방지합니다.",
    setup: [
      "study_menu.py 파일을 만들고 Python 3.11 이상을 사용합니다.",
      "메뉴는 1=시간 추가, 2=합계 조회, 3=초기화, 4=종료로 정합니다.",
      "실제 개인정보 대신 합성 학습 시간만 사용합니다.",
    ],
    steps: [
      "QUIT = '4', choice = ''와 total_minutes = 0으로 상태를 초기화합니다.",
      "while choice != QUIT 조건으로 메뉴 루프를 만듭니다.",
      "input 결과를 strip하고 {'1','2','3','4'} 안에 있는지 검사합니다.",
      "1을 선택하면 분 단위 문자열을 추가로 받아 숫자인지 검증하고 0 이상의 정수만 total_minutes에 더합니다.",
      "2를 선택하면 현재 누적 분을 출력하고, 3을 선택하면 0으로 되돌립니다.",
      "4를 선택한 본문에서는 종료 예정 메시지를 출력하고 다음 조건 재검사에서 자연 종료하게 합니다.",
      "문자, 빈 줄, 범위 밖 메뉴, 음수 시간, 즉시 종료, 여러 작업 뒤 종료를 차례로 시험합니다.",
      "각 반복 시작에 반복 횟수와 choice의 repr만 진단하고 실제 민감 입력은 로그에 남기지 않습니다.",
      "테스트용 선택 시퀀스에 반드시 4를 넣고 소비한 입력 수와 최종 total_minutes를 검증합니다.",
    ],
    expectedResult: [
      "잘못된 메뉴 입력은 안내 후 같은 루프에서 다시 입력받습니다.",
      "유효한 시간만 누적되고 조회·초기화가 상태에 반영됩니다.",
      "4를 입력한 반복 뒤 조건이 False가 되어 작별 메시지와 함께 종료합니다.",
      "즉시 종료와 여러 작업 후 종료 모두 유한 횟수로 끝나며 최종 상태를 설명할 수 있습니다.",
    ],
    cleanup: ["실행 결과에 실제 사용자 이름·토큰·환경 변수 값을 포함하지 않고 합성 데이터 파일만 보관합니다."],
    extensions: [
      "최대 잘못된 입력 5회 후 세션을 종료하는 정책을 추가합니다.",
      "메뉴 표시·입력 파싱·상태 변경을 함수로 분리한 뒤 고정 입력 테스트를 만듭니다.",
      "다음 세션에서 break를 배운 뒤 자연 종료 방식과 중간 종료 방식을 비교합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "원본의 1~10 및 짝수 출력 루프를 작성하고 상태표를 만드세요.",
      requirements: [
        "초기식, 조건식, 증감식을 주석이 아니라 실제 코드에서 식별합니다.",
        "1, 10, 종료 직후 11 상태의 조건 결과를 표로 적습니다.",
        "짝수 루프의 증감은 if 바깥에 둡니다.",
        "조건을 < 10으로 바꾼 결과도 기록합니다.",
      ],
      hints: ["본문 시작 시 count와 본문 끝의 count를 구분하세요.", "print의 end=' '와 마지막 빈 print의 역할을 확인하세요."],
      expectedOutcome: "두 원본 출력과 종료 상태를 재현하고 <=와 <의 경계 차이를 설명합니다.",
      solutionOutline: ["count=1로 시작합니다.", "while count<=10 안에서 출력 후 증가합니다.", "둘째 루프에 짝수 if를 추가하되 증가는 항상 실행합니다."],
    },
    {
      difficulty: "응용",
      prompt: "사용자가 정답을 맞힐 때까지 힌트를 주는 숫자 추측 루프를 만드세요.",
      requirements: [
        "정답은 고정된 합성 값으로 두고 사용자 입력은 문자열 검증 후 정수로 바꿉니다.",
        "정답보다 작음·큼·일치를 구분합니다.",
        "시도 횟수를 매 유효 입력마다 증가시킵니다.",
        "정답을 맞히면 조건 상태가 False가 되어 자연 종료되게 합니다.",
        "문자 입력과 즉시 정답을 포함한 테스트를 기록합니다.",
      ],
      hints: ["solved=False를 초기 상태로 두고 정답일 때 True로 갱신할 수 있습니다.", "잘못된 입력은 유효 시도 횟수에 포함할지 정책을 먼저 정하세요."],
      expectedOutcome: "입력 오류를 복구하고 정답 상태에서 유한하게 종료하는 상태 기반 while을 완성합니다.",
    },
    {
      difficulty: "설계",
      prompt: "외부 작업 상태를 주기적으로 확인하는 polling 루프를 안전하게 설계하세요.",
      requirements: [
        "pending, success, failed, cancelled 상태와 unknown 상태 정책을 정의합니다.",
        "최대 시도 수와 총 timeout을 모두 둡니다.",
        "각 시도 사이 대기와 향후 backoff 확장 지점을 설명합니다.",
        "성공·실패·영구 pending·상태 조회 오류 입력 시퀀스를 결정적으로 테스트합니다.",
        "로그에는 시도 번호·상태 코드만 남기고 응답의 비밀값은 제외합니다.",
        "while 조건만으로 자연 종료되는 버전과 다음 세션의 break가 필요한 버전의 trade-off를 적습니다.",
      ],
      hints: ["attempts < max_attempts와 terminal 상태 여부를 조건에 함께 표현할 수 있습니다.", "현재 시간 의존은 테스트 가능한 clock으로 분리하는 설계를 고려하세요."],
      expectedOutcome: "사용자 메뉴의 종료 조건을 운영 가능한 timeout·재시도·관찰성 설계로 확장합니다.",
    },
  ],
  reviewQuestions: [
    {
      question: "while 본문은 최소 한 번 실행되나요?",
      answer: "아닙니다. 본문 전에 조건을 먼저 검사하므로 초기 조건이 False면 0회 실행됩니다.",
    },
    {
      question: "count=1, while count<=10, count+=1 루프가 끝난 직후 count는 얼마이며 왜 그런가요?",
      answer: "11입니다. count=10인 반복을 실행한 뒤 1 증가하고, 다음 검사에서 11<=10이 False라 종료합니다.",
    },
    {
      question: "짝수일 때만 count를 증가시키면 왜 초기 count=1에서 무한 반복하나요?",
      answer: "1은 홀수라 if 본문과 증가 문장이 실행되지 않으므로 상태가 계속 1이고 while 조건은 계속 True입니다.",
    },
    {
      question: "메뉴 choice를 0으로 초기화하는 이유는 무엇인가요?",
      answer: "종료 sentinel 4와 다른 값으로 시작해 첫 조건 choice!=4를 True로 만들고 메뉴를 한 번 이상 실행하기 위해서입니다.",
    },
    {
      question: "사용자가 문자열 '4'를 입력했는데 choice!=4가 계속 True일 수 있는 이유는 무엇인가요?",
      answer: "input 결과는 문자열이고 정수 4와는 타입과 값이 같지 않습니다. 문자열로 유지하면 '4', int로 변환하면 4와 비교해야 합니다.",
    },
    {
      question: "<와 <= 차이를 점검하는 가장 단순한 방법은 무엇인가요?",
      answer: "첫 상태, 마지막 포함해야 할 상태, 종료 직후 상태를 손으로 표로 적고 각각의 조건 결과를 계산합니다.",
    },
    {
      question: "카운터 루프와 사용자 메뉴 루프의 종료 보장에는 어떤 차이가 있나요?",
      answer: "유한 카운터는 상태가 경계를 향해 일정하게 변하면 종료를 증명할 수 있습니다. 메뉴는 사용자가 Quit를 선택하지 않을 수 있어 최대 시도·timeout 같은 운영 상한이 추가로 필요할 수 있습니다.",
    },
    {
      question: "왜 테스트에서 input을 고정 선택값 리스트로 바꾸나요?",
      answer: "같은 입력 순서와 종료 결과를 자동으로 재현하고 소비한 입력 수, 최종 상태, sentinel 누락 실패를 검증하기 위해서입니다.",
    },
  ],
  completionChecklist: [
    "while의 조건 검사·본문·상태 갱신·재검사 순서를 설명할 수 있다.",
    "초기 상태만 보고 본문이 0회 실행될 수 있는지 판단할 수 있다.",
    "1~10과 짝수 출력 루프의 count 상태를 끝까지 추적할 수 있다.",
    "off-by-one과 무한 반복을 초기값·조건·갱신 위치에서 진단할 수 있다.",
    "sentinel 메뉴 루프에서 Quit를 읽은 반복과 실제 종료 시점을 구분할 수 있다.",
    "input 문자열과 int sentinel의 타입 계약을 일치시킬 수 있다.",
    "잘못된 입력과 EOF를 복구 또는 명시 실패로 설계할 수 있다.",
    "고정 입력 시퀀스로 종료 가능성과 소비한 입력 수를 테스트할 수 있다.",
    "외부 상태 반복에 최대 시도·timeout·안전한 로그가 필요한 이유를 설명할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    {
      id: "py-while-source",
      repository: "PYTHON-BASIC",
      path: "day03/ex08_while.py",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day03/ex08_while.py",
      usedFor: ["while 기본 구조", "1~10 출력", "짝수 출력", "Quit 메뉴", "원본 실행 결과"],
      evidence: "공개 main 브랜치와 동일한 원본을 Python 3.13.9에서 1, 2, 4 입력으로 직접 실행해 두 숫자 줄, 세 번의 메뉴 선택, Quit 뒤 작별 메시지를 확인했습니다.",
    },
    {
      id: "py-day03-while-note",
      repository: "PYTHON-BASIC",
      path: "notes/day03_collection_control.md",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day03_collection_control.md",
      usedFor: ["초기식·조건식·증감식", "end=' '", "메뉴 Quit 패턴", "파일 매핑"],
      evidence: "Day03 노트의 while 절과 핵심 요약, 파일 매핑을 검토하고 종료 증명·경계 진단·입력 테스트를 보강했습니다.",
    },
    {
      id: "python-while-reference",
      repository: "Python 공식 문서",
      path: "reference/compound_stmts.html#the-while-statement",
      publicUrl: "https://docs.python.org/3/reference/compound_stmts.html#the-while-statement",
      usedFor: ["선검사 while 의미", "조건 재평가", "공식 문법 범위"],
      evidence: "원본에서 간단히 제시한 while 실행 순서를 공식 언어 레퍼런스 범위와 대조했습니다. break·continue·else는 별도 세션 범위로 남겼습니다.",
    },
  ],
  sourceCoverage: {
    filesRead: 3,
    filesUsed: 2,
    uncoveredNotes: [
      "이전 학습본의 day03/ex08_while.py도 대조했으며 canonical 파일과 실행 본문이 동일해 중복 출처로 공개하지 않았습니다.",
      "break와 continue는 py-019 범위이므로 이 세션 코드에서는 사용하지 않고 조건 상태가 False가 되는 자연 종료만 다룹니다.",
      "함수 추출과 iterator 주입의 상세 문법은 뒤 함수 세션 범위입니다. 여기서는 choices 리스트와 position 상태로 결정적 테스트 원리만 보여 줍니다.",
      "로컬 드라이브 경로와 비공개 백업 저장소 URL은 공개 학습자료에 넣지 않았고 검증된 공개 저장소 링크와 일반화된 provenance 설명만 사용했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;
