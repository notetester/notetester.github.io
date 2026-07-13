import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-019"],
  slug: "python-019-break-continue-for-range",
  courseId: "python",
  moduleId: "02-control-functions-io",
  order: 19,
  title: "break·continue·for·range",
  subtitle: "이터러블의 값을 하나씩 소비하면서 현재 반복을 건너뛰고, 가장 가까운 반복을 끝내고, 끝이 제외되는 정수 구간을 정확히 설계합니다.",
  level: "기초",
  estimatedMinutes: 145,
  coreQuestion: "반복 대상의 값을 빠짐없이 처리하면서 특정 항목만 건너뛰거나 원하는 순간에 종료하고, 그 실행 경계를 어떻게 정확히 증명할까요?",
  summary: "for가 단순한 횟수 문법이 아니라 iterable에서 값을 하나씩 받는 과정임을 설명합니다. 원본의 커피 자판기 break, 특정 숫자와 짝수를 건너뛰는 continue, list·tuple·set·dict·문자열 순회, range와 구구단을 직접 실행한 결과에 연결합니다. break와 continue의 정확한 이동 지점, while 상태 갱신 위치, for-else, 중첩 반복의 가장 안쪽 탈출, range의 stop 미포함·음수 step·빈 구간, 순서와 언패킹·변경 중 순회 위험, finally 정리 보장까지 경계값으로 검증합니다.",
  objectives: [
    "for가 iterable에서 다음 값을 받아 loop target에 바인딩하고 소진될 때 종료되는 흐름을 설명할 수 있다.",
    "break가 가장 가까운 반복문 하나를 즉시 종료하고 loop else를 건너뛰는 규칙을 예측할 수 있다.",
    "continue가 현재 본문의 나머지를 건너뛴 뒤 for의 다음 값 또는 while의 조건 검사로 이동함을 설명할 수 있다.",
    "range(start, stop, step)의 stop 미포함, 양·음 step, 빈 구간과 step=0 실패를 정확히 예측할 수 있다.",
    "list·tuple·string·dict·set의 순회 값과 순서 보장을 구분하고 items 언패킹을 사용할 수 있다.",
    "중첩 for에서 break가 가장 안쪽 반복만 끝낸다는 사실을 실행 결과로 검증하고 전체 탈출 구조를 선택할 수 있다.",
    "continue가 일반 후처리 코드는 건너뛰지만 finally와 context manager 정리는 실행한다는 차이를 테스트할 수 있다.",
  ],
  prerequisites: [
    { title: "while·메뉴 루프·종료 조건", reason: "break와 continue가 이동할 반복 경계, while에서 상태 변화가 없으면 무한 반복이 되는 이유를 연결합니다.", sessionSlug: "python-018-while-menu-loop-termination" },
    { title: "산술·비교·논리 연산자", reason: "range 경계, 짝수 필터 n % 2, 종료·건너뛰기 조건을 정확한 bool 표현식으로 작성합니다.", sessionSlug: "python-005-arithmetic-comparison-logic" },
    { title: "튜플·패킹·언패킹", reason: "dict.items()와 좌표 목록을 for target의 여러 이름으로 분해합니다.", sessionSlug: "python-012-tuple-packing-unpacking" },
  ],
  keywords: ["Python", "for", "iterable", "iterator", "break", "continue", "for else", "range", "nested loop", "dict items", "unpacking", "finally"],
  chapters: [
    {
      id: "for-iteration-model",
      title: "for는 횟수를 세는 문법이 아니라 다음 값을 요청하는 문법입니다",
      lead: "for target in iterable은 반복 가능한 객체에서 값을 하나씩 얻어 target에 바인딩하고 본문을 실행합니다.",
      explanations: [
        "원본 ex03_for.py는 list의 one부터 five, tuple의 네 색, set의 세 이름, dict의 key·value·item, 문자열의 각 문자를 순회합니다. for는 list 전용도 range 전용도 아닙니다. 객체가 iterable 계약을 제공하면 Python은 iterator를 얻고 다음 값이 없다는 신호가 올 때까지 target에 값을 차례로 바인딩합니다.",
        "개념적으로 iter(iterable)로 iterator를 만들고 next(iterator)를 반복하다 StopIteration을 만나 정상 종료합니다. 보통 for가 이 예외를 내부에서 처리하므로 직접 잡지 않습니다. 이 정신 모델은 파일의 줄, generator의 지연 값, database cursor를 순회할 때도 같습니다. 다만 한 번 소비되는 iterator와 여러 번 새 iterator를 만들 수 있는 collection을 구분해야 합니다.",
        "target 이름은 매 반복마다 현재 값을 가리킵니다. for가 새 scope를 만들지는 않아 정상 종료 뒤 마지막 값이 이름에 남을 수 있지만 그 동작에 의존해 결과를 전달하지 않습니다. 빈 iterable이면 본문이 한 번도 실행되지 않아 target이 새로 만들어지지 않을 수 있습니다. 필요한 결과는 반복 전에 명시적으로 초기화하거나 함수에서 반환합니다.",
      ],
      concepts: [
        { term: "iterable", definition: "iter를 통해 iterator를 제공해 for로 순회할 수 있는 객체입니다.", detail: ["list·tuple·str·dict·set·range와 파일 등이 iterable입니다.", "iterable이 항상 모든 값을 메모리에 이미 보관하는 것은 아닙니다."] },
        { term: "iterator", definition: "next 호출마다 다음 값을 하나씩 반환하고 끝에서 StopIteration을 알리는 상태 있는 객체입니다.", detail: ["한 번 끝까지 소비하면 다시 값이 나오지 않는 iterator가 많습니다.", "for가 next와 종료 예외 처리를 대신합니다."], analogy: "책 전체가 iterable이라면 현재 책갈피를 들고 다음 페이지를 건네는 도구가 iterator입니다." },
        { term: "loop target", definition: "각 iteration에서 현재 값을 바인딩받는 for 왼쪽 이름 또는 언패킹 패턴입니다.", detail: ["for value in values의 value가 target입니다.", "for key, value in mapping.items()처럼 한 항목을 여러 이름으로 분해할 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "빈 목록을 순회한 뒤 loop target을 읽자 NameError가 난다.", likelyCause: "본문이 한 번도 실행되지 않아 반복 대상 이름이 이 코드 경로에서 바인딩되지 않았습니다.", checks: ["iterable 길이가 0인지 확인합니다.", "target 이름이 반복 전에 초기화됐는지 봅니다.", "반복 결과를 마지막 target에 의존하는지 검토합니다."], fix: "결과 이름을 반복 전에 의미 있는 기본값으로 초기화하거나 검색 결과를 함수 return으로 명시합니다.", prevention: "빈 iterable 테스트를 두고 loop target을 반복 결과 전달 수단으로 사용하지 않습니다." },
      ],
    },
    {
      id: "break-termination-boundary",
      title: "break는 현재 가장 가까운 반복문을 즉시 끝냅니다",
      lead: "break가 실행되면 현재 iteration의 아래 문장과 다음 iteration은 모두 생략되고 반복문 다음 문장으로 이동합니다.",
      explanations: [
        "원본 ex01_while_break.py는 coffee=10에서 while True를 시작하고 판매할 때마다 1을 줄입니다. coffee가 0이 되는 열 번째 iteration에서 판매 중지 메시지를 출력한 뒤 break로 while을 끝내고 별표 구분선을 출력합니다. break가 없으면 조건이 항상 True인 반복은 스스로 끝나지 않습니다.",
        "break 조건은 초기값 경계까지 포함해 검토합니다. 원본을 coffee=0으로 시작하면 본문이 먼저 coffee를 -1로 만들고 coffee == 0 검사가 영원히 참이 되지 않습니다. 재고가 0 이하이면 시작 전에 판매를 막거나, 감소 전에 재고를 확인하거나, 종료 조건을 coffee <= 0으로 설계해야 합니다. 대표 정상값 10만 실행하면 이 결함을 볼 수 없습니다.",
        "break는 프로그램이나 함수 전체를 종료하지 않고 문법상 자신을 감싼 가장 가까운 for 또는 while 하나만 끝냅니다. 중첩 반복에서 안쪽 break 뒤에는 바깥 반복의 다음 본문이 계속됩니다. 함수 전체 검색을 끝내려면 return, 상태 flag, 작은 helper 함수로의 분리 같은 구조를 선택합니다.",
      ],
      concepts: [
        { term: "break", definition: "실행 중인 가장 가까운 반복문 하나를 즉시 종료하는 제어문입니다.", detail: ["현재 본문의 break 아래와 남은 iteration을 실행하지 않습니다.", "반복문 다음 문장으로 흐름이 이동합니다.", "for/while의 else가 있으면 break 종료에서는 else도 실행하지 않습니다."] },
        { term: "termination condition", definition: "반복을 유한하게 끝내는 상태·입력·사건에 대한 조건입니다.", detail: ["while True에는 도달 가능한 break 또는 외부 취소 정책이 필요합니다.", "초기값이 이미 경계를 넘은 경우도 테스트해야 합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "coffee를 0으로 시작했는데 판매 루프가 -1, -2로 계속 내려가며 끝나지 않는다.", likelyCause: "본문에서 먼저 감소한 뒤 coffee == 0만 검사해 초기 0을 지나쳤습니다.", checks: ["한 iteration 안에서 상태 변경과 break 검사 순서를 적습니다.", "초기값 0과 음수를 직접 실행합니다.", "종료 조건이 ==인지 <=인지 업무 규칙을 확인합니다."], fix: "판매 전에 coffee <= 0을 검사하거나 while coffee > 0처럼 조건에 재고 불변식을 넣고 마지막 판매 뒤 종료 메시지를 분리합니다.", prevention: "정상 양수뿐 아니라 0·음수·1 경계와 최대 iteration 제한을 테스트합니다." },
      ],
      expertNotes: ["외부 서비스 polling은 break 하나만으로 운영 종료를 보장하지 않습니다. timeout, cancellation, 최대 재시도, backoff와 finally 정리를 함께 설계합니다."],
    },
    {
      id: "continue-next-iteration",
      title: "continue는 현재 iteration의 나머지만 건너뜁니다",
      lead: "for에서는 다음 항목을 요청하고, while에서는 조건을 다시 검사하므로 상태 갱신 위치가 안전성을 결정합니다.",
      explanations: [
        "원본 ex02_while_continue.py는 cnt를 먼저 1 증가시킨 뒤 cnt==4이면 continue합니다. 그래서 4의 print만 건너뛰고 cnt는 다음 값 5로 진행합니다. 홀수 예제도 cnt를 먼저 증가시키고 짝수에서 continue해 1, 3, 5, 7, 9만 출력합니다.",
        "while에서 cnt += 1을 continue 아래로 옮기면 cnt가 4일 때 증가 문장을 영원히 건너뛰어 같은 상태로 반복합니다. continue는 마법처럼 loop state를 갱신하지 않습니다. while 본문의 모든 continue 경로가 종료 조건을 향해 상태를 변화시키는지 확인해야 합니다.",
        "for에서 continue는 iterator가 다음 값을 주므로 수동 index 증가가 필요하지 않습니다. 하지만 현재 항목에 대한 로그·통계·정리 문장도 continue 아래에 있으면 함께 건너뜁니다. 반드시 실행할 정리는 try/finally 또는 with로 구조화하고, 단순 후처리는 continue 전에 놓을지 명시적으로 결정합니다.",
      ],
      concepts: [
        { term: "continue", definition: "현재 iteration 본문의 남은 문장을 건너뛰고 다음 iteration으로 이동하는 제어문입니다.", detail: ["for는 iterator의 다음 값을 요청합니다.", "while은 조건을 다시 검사합니다.", "반복문 자체를 종료하지 않습니다."] },
        { term: "progress invariant", definition: "반복이 종료 조건을 향해 상태를 계속 변화시킨다는 보장입니다.", detail: ["while의 모든 경로, 특히 continue 경로에서 확인합니다.", "입력 소비, counter 증가, 시간 경과 중 적어도 하나가 진행돼야 합니다."] },
      ],
      codeExamples: [
        {
          id: "search-continue-break-else",
          title: "빈 값을 건너뛰고 찾으면 종료하며 없으면 else 실행",
          language: "python",
          filename: "search_records.py",
          purpose: "continue·break·for-else의 이동 지점을 호출 두 번으로 비교합니다.",
          code: "def find_target(items, target):\n    for index, item in enumerate(items):\n        if item == \"\":\n            print(f\"{target}: skip empty at {index}\")\n            continue\n        if item == target:\n            print(f\"{target}: found at {index}\")\n            break\n    else:\n        print(f\"{target}: not found\")\n\nrecords = [\"draft\", \"\", \"ready\"]\nfor target in (\"ready\", \"missing\"):\n    find_target(records, target)",
          walkthrough: [
            { lines: "1-2", explanation: "enumerate로 index와 item을 함께 받고 target별 검색을 함수 경계에 둡니다." },
            { lines: "3-5", explanation: "빈 문자열은 메시지만 남기고 continue로 아래 target 비교를 건너뜁니다." },
            { lines: "6-8", explanation: "일치하면 위치를 출력하고 break해 남은 항목과 loop else를 건너뜁니다." },
            { lines: "9-10", explanation: "iterable을 끝까지 소비했지만 break가 없을 때만 not found가 출력됩니다." },
            { lines: "12-14", explanation: "찾는 값과 없는 값을 같은 records에 적용해 두 종료 경로를 모두 실행합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "search_records.py를 저장"], command: "python -I -X utf8 search_records.py" },
          output: { value: "ready: skip empty at 1\nready: found at 2\nmissing: skip empty at 1\nmissing: not found", explanation: ["ready 검색은 index 1을 건너뛰고 index 2에서 break해 else가 없습니다.", "missing 검색은 빈 값만 건너뛴 뒤 정상 소진돼 else가 실행됩니다.", "continue는 검색 전체가 아니라 현재 빈 item 처리만 끝냅니다."] },
          experiments: [
            { change: "records를 빈 목록으로 바꿉니다.", prediction: "본문이 0회 실행되고 두 target 모두 for-else의 not found를 출력합니다.", result: "break가 없는 정상 소진이므로 빈 iterable에서도 else가 실행됩니다." },
            { change: "continue를 break로 바꿉니다.", prediction: "빈 값을 만나는 순간 검색 전체가 끝나 ready도 찾지 못하고 else도 실행되지 않습니다.", result: "skip 메시지만 나오므로 건너뛰기와 종료의 의미 차이가 드러납니다." },
          ],
          sourceRefs: ["py-while-continue", "py-day04-note"],
        },
      ],
      diagnostics: [
        { symptom: "while에서 특정 값에 도달한 뒤 CPU를 사용하며 같은 상태로 무한 반복한다.", likelyCause: "continue가 counter·입력 소비·상태 갱신 문장보다 먼저 실행돼 진행 상태가 고정됐습니다.", checks: ["continue로 들어가는 모든 경로를 표시합니다.", "조건에 사용하는 이름이 각 경로에서 변하는지 로그로 봅니다.", "안전한 최대 iteration을 두고 최소 예제로 재현합니다."], fix: "상태 갱신을 continue 조건보다 앞에 두거나 while 조건과 갱신 구조를 다시 설계합니다.", prevention: "각 continue 경로에 progress invariant 테스트와 0·경계 입력을 둡니다." },
      ],
    },
    {
      id: "collection-order-unpacking",
      title: "컬렉션마다 순회 값과 순서 계약이 다릅니다",
      lead: "같은 for 문법이라도 list·tuple·string은 요소, dict는 기본적으로 key, set은 안정적인 표시 순서를 보장하지 않습니다.",
      explanations: [
        "list와 tuple은 저장된 위치 순서로 요소를 줍니다. 문자열은 Unicode 문자열의 문자를 순서대로 줍니다. 원본은 Python Hello에서 o를 continue해 P y t h n, 공백, H e l l을 출력합니다. 사용자에게 보이는 grapheme과 Python 문자열 code point가 항상 일대일인 것은 국제화 과정에서 별도로 다룹니다.",
        "dict를 직접 순회하거나 keys()를 순회하면 key가 나옵니다. values()는 value, items()는 (key, value) tuple을 insertion order로 제공합니다. Python 3.7+에서 dict insertion order는 언어 보장입니다. for key, value in mapping.items()는 각 2-tuple을 두 이름으로 언패킹합니다.",
        "set은 중복 없는 집합 의미가 핵심이며 iteration 순서를 공개 계약으로 사용하면 안 됩니다. 같은 실행에서 우연히 일정해 보여도 Python 버전·hash randomization·데이터에 따라 달라질 수 있습니다. 표시·테스트에 순서가 필요하면 sorted(set_value)처럼 명시합니다.",
        "순회 중 collection 크기를 바꾸는 것은 위험합니다. dict에 key를 추가·삭제하면 RuntimeError가 날 수 있고 list에서 삭제하면 다음 요소가 앞으로 이동해 건너뛸 수 있습니다. filtering이 목적이면 새 collection을 만들거나 list(mapping.items()) 같은 snapshot을 순회합니다.",
      ],
      concepts: [
        { term: "iteration order", definition: "for가 다음 항목을 내보내는 순서에 대한 타입의 계약입니다.", detail: ["list·tuple·str·dict에는 의미 있는 안정 순서가 있습니다.", "set 순서는 정렬 계약이 아닙니다.", "정렬이 필요하면 명시적 key와 sorted를 사용합니다."] },
        { term: "iteration unpacking", definition: "각 반복 항목의 구조를 여러 target 이름으로 분해하는 문법입니다.", detail: ["dict.items()의 2-tuple을 key, value로 받습니다.", "항목 길이가 target 개수와 다르면 ValueError가 납니다."] },
      ],
      codeExamples: [
        {
          id: "ordered-collection-iteration",
          title: "list·dict·set의 순회 계약을 결정적인 출력으로 비교",
          language: "python",
          filename: "collection_iteration.py",
          purpose: "원본의 list와 dict 순회를 보존하되 set은 sorted로 명시해 재현 가능한 결과를 만듭니다.",
          code: "colors = [\"red\", \"green\", \"blue\"]\nprofile = {\"name\": \"park\", \"age\": 24}\ntags = {\"python\", \"loop\", \"basic\"}\n\nfor index, color in enumerate(colors, start=1):\n    print(f\"color {index}: {color}\")\n\nfor key, value in profile.items():\n    print(f\"{key}={value}\")\n\nprint(\"tags:\", \",\".join(sorted(tags)))",
          walkthrough: [
            { lines: "1-3", explanation: "위치 순서 list, insertion order dict, 순서 없는 set을 준비합니다. 민감정보 없는 합성값만 사용합니다." },
            { lines: "5-6", explanation: "enumerate가 1부터 index를 만들고 list 위치 순서를 유지합니다." },
            { lines: "8-9", explanation: "items의 각 2-tuple을 key와 value로 언패킹합니다." },
            { lines: "11", explanation: "set을 바로 출력하지 않고 sorted list로 만든 뒤 join해 환경과 무관한 출력 순서를 보장합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "collection_iteration.py를 저장"], command: "python -I -X utf8 collection_iteration.py" },
          output: { value: "color 1: red\ncolor 2: green\ncolor 3: blue\nname=park\nage=24\ntags: basic,loop,python", explanation: ["list가 입력 위치 red→green→blue를 유지합니다.", "dict가 literal insertion order name→age를 유지합니다.", "set 자체 순서가 아니라 sorted 결과를 사용해 basic→loop→python이 재현됩니다."] },
          experiments: [
            { change: "for key, value in profile로 items()를 제거합니다.", prediction: "dict 직접 순회는 key 문자열 하나를 주므로 두 문자로 언패킹할 수 있는 key는 이상하게 분리되거나 다른 길이에서는 ValueError가 납니다.", result: "items를 사용해야 key·value 2-tuple 계약이 명확합니다." },
            { change: "sorted(tags)를 tags로 바꾸고 여러 새 Python 프로세스에서 실행합니다.", prediction: "태그 순서를 공개 결과로 신뢰할 수 없습니다.", result: "환경에 따라 순서가 달라질 수 있어 테스트 기대값에는 정렬이 필요합니다." },
          ],
          sourceRefs: ["py-for-collections", "py-day04-note"],
        },
      ],
      diagnostics: [
        { symptom: "for key, value in data에서 unpack할 값이 너무 많거나 부족하다는 ValueError가 난다.", likelyCause: "각 반복 항목이 정확히 두 요소가 아니거나 dict를 items 없이 직접 순회했습니다.", checks: ["반복 전에 첫 항목 repr과 type을 봅니다.", "dict인지 dict.items()인지 확인합니다.", "가변 길이 레코드가 섞였는지 검사합니다."], fix: "key·value가 필요하면 mapping.items()를 쓰고 입력 record schema를 검증합니다.", prevention: "언패킹 target 수와 항목 길이를 문서화하고 빈 값·잘못된 길이 테스트를 둡니다." },
        { symptom: "set 순회 결과를 문자열로 비교하는 테스트가 실행마다 실패한다.", likelyCause: "set에 정렬된 iteration order가 있다고 가정했습니다.", checks: ["타입이 set인지 확인합니다.", "테스트가 값의 집합이 아니라 출력 순서를 비교하는지 봅니다.", "서로 다른 프로세스에서 결과를 재현합니다."], fix: "순서가 의미 없으면 set 동등성을 검사하고, 표시 순서가 필요하면 sorted를 적용합니다.", prevention: "API·문서에서 collection 순서 계약을 타입별로 명시합니다." },
      ],
      expertNotes: ["dict의 insertion order는 보장되지만 정렬 order는 아닙니다. key 정렬이 업무 요구이면 sorted(mapping.items(), key=...)를 명시합니다."],
    },
    {
      id: "range-half-open-sequence",
      title: "range는 stop을 제외하는 메모리 효율적인 정수 시퀀스입니다",
      lead: "range(start, stop, step)는 start에서 시작해 step을 더하며 stop에 도달하기 전에 멈춥니다.",
      explanations: [
        "원본 ex04_for_range.py의 range(1, 11)은 1부터 10까지이며 len은 10, type은 range입니다. range 객체를 print하면 range(1, 11)로 보이고 list처럼 숫자 전체를 미리 저장하지 않습니다. 필요할 때 정수를 계산하므로 매우 큰 구간도 range 객체 자체는 작습니다.",
        "인수가 하나면 start=0, step=1입니다. 둘이면 start와 stop, 셋이면 step까지 지정합니다. 양수 step에서는 start < stop이어야 값이 있고, 음수 step에서는 start > stop이어야 값이 있습니다. range(5, 1, 1)은 오류가 아니라 빈 range이고 range(1, 5, -1)도 빈 range입니다.",
        "stop 미포함 half-open 구간은 길이와 이어 붙이기에 유리합니다. range(0, len(items))는 유효 index 0부터 len-1까지 맞지만 값만 필요하면 직접 for item in items가 더 명확합니다. index와 값이 모두 필요하면 range(len(...))보다 enumerate를 우선합니다.",
        "step은 0일 수 없습니다. 다음 값이 영원히 변하지 않아 종료 방향을 정의할 수 없으므로 range(..., 0)은 생성 시 ValueError를 냅니다. 외부에서 step을 받으면 range를 만들기 전에 0과 방향을 검증해 사용자가 이해할 오류를 반환합니다.",
      ],
      concepts: [
        { term: "half-open interval", definition: "시작은 포함하고 끝은 포함하지 않는 [start, stop) 형태의 구간입니다.", detail: ["range(1, 4)는 1·2·3입니다.", "인접 구간의 경계를 중복 없이 나누기 쉽습니다."] },
        { term: "step", definition: "현재 값에서 다음 값으로 이동할 때 더하는 0이 아닌 정수입니다.", detail: ["양수는 증가, 음수는 감소합니다.", "stop 방향과 맞지 않으면 빈 range입니다.", "0은 ValueError입니다."] },
        { term: "lazy integer sequence", definition: "모든 정수를 list로 저장하지 않고 시작·끝·간격 규칙으로 값을 계산하는 시퀀스입니다.", detail: ["len, index, membership을 지원합니다.", "화면에 전체 값을 보려면 list로 명시적으로 materialize할 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "range-boundary-table",
          title: "증가·감소·빈 range와 membership 확인",
          language: "python",
          filename: "range_boundaries.py",
          purpose: "start·stop·step 방향과 stop 미포함을 작고 정확한 결과표로 검증합니다.",
          code: "cases = [\n    (\"up\", range(1, 8, 2)),\n    (\"down\", range(5, 0, -2)),\n    (\"empty\", range(5, 1, 1)),\n]\n\nfor label, numbers in cases:\n    print(label, list(numbers), len(numbers))\n\nodd = range(1, 10, 2)\nprint(\"membership:\", 7 in odd, 8 in odd)",
          walkthrough: [
            { lines: "1-5", explanation: "양수 step, 음수 step, 방향이 맞지 않는 양수 step 세 구간을 준비합니다." },
            { lines: "7-8", explanation: "학습 출력에서만 list로 materialize하고 range의 len을 함께 확인합니다." },
            { lines: "10-11", explanation: "1·3·5·7·9 range에서 7과 8 membership을 비교합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "range_boundaries.py를 저장"], command: "python -I -X utf8 range_boundaries.py" },
          output: { value: "up [1, 3, 5, 7] 4\ndown [5, 3, 1] 3\nempty [] 0\nmembership: True False", explanation: ["up은 1부터 2씩 증가해 stop 8 전의 7에서 끝납니다.", "down은 5부터 -2씩 감소해 stop 0을 포함하지 않습니다.", "양수 step으로 5에서 1 방향으로 갈 수 없어 empty는 정상적인 빈 시퀀스입니다."] },
          experiments: [
            { change: "range(5, 0, -2)를 range(5, -1, -2)로 바꿉니다.", prediction: "5·3·1이고 다음 -1은 stop과 같아 여전히 제외됩니다.", result: "stop은 감소 range에서도 포함되지 않습니다." },
            { change: "range(1, 8, 0)을 추가합니다.", prediction: "목록을 순회하기 전 range 생성에서 ValueError가 납니다.", result: "range() arg 3 must not be zero 메시지를 확인합니다." },
          ],
          sourceRefs: ["py-for-range", "py-day04-note"],
        },
      ],
      diagnostics: [
        { symptom: "range 결과가 오류 없이 빈 목록이 된다.", likelyCause: "step 방향과 start→stop 방향이 맞지 않거나 start와 stop이 같습니다.", checks: ["start, stop, step을 각각 출력합니다.", "step 부호와 start<stop 또는 start>stop 관계를 확인합니다.", "stop이 제외됨을 고려해 마지막 기대값을 계산합니다."], fix: "증가 구간은 양수 step과 start<stop, 감소 구간은 음수 step과 start>stop으로 맞춥니다.", prevention: "증가·감소·동일 경계의 예상 list와 len 테스트를 둡니다." },
        { symptom: "range를 만들 때 ValueError: range() arg 3 must not be zero가 난다.", likelyCause: "step이 0이라 다음 값과 종료 방향을 만들 수 없습니다.", checks: ["외부 입력에서 step이 0인지 확인합니다.", "기본값 대입이 or 패턴으로 잘못 0을 바꿨는지 봅니다.", "증가·감소 중 의도한 방향을 확인합니다."], fix: "range 생성 전에 step == 0을 명시적으로 거부하고 사용자에게 0이 아닌 값을 요구합니다.", prevention: "step 입력 계약과 -1·0·1 경계 테스트를 둡니다." },
      ],
      comparisons: [
        { title: "index가 필요할 때 무엇을 사용할까요?", options: [
          { name: "직접 순회", chooseWhen: "요소 값만 필요할 때", avoidWhen: "위치 번호가 실제 요구일 때", tradeoffs: ["가장 직접적이고 index 오류가 없습니다.", "위치를 자동 제공하지 않습니다."] },
          { name: "enumerate", chooseWhen: "index와 요소가 함께 필요할 때", avoidWhen: "숫자 구간 자체가 데이터일 때", tradeoffs: ["index 시작값을 지정할 수 있습니다.", "range(len(...))보다 값 접근이 명확합니다."] },
          { name: "range", chooseWhen: "횟수·정수 구간·구구단 축이 실제 반복 데이터일 때", avoidWhen: "collection 요소를 index로 다시 조회하기만 할 때", tradeoffs: ["메모리 효율적인 정수 시퀀스입니다.", "stop·step 경계를 정확히 설계해야 합니다."] },
        ] },
      ],
      expertNotes: ["range membership은 정수를 하나씩 전부 순회하지 않고 산술 조건으로 판단할 수 있습니다. 그러나 가독성을 해치는 거대한 index 계산보다 도메인 이름과 검증을 우선합니다."],
    },
    {
      id: "nested-loops-break-scope",
      title: "중첩 반복은 격자를 만들고 break는 가장 안쪽만 끝냅니다",
      lead: "구구단은 바깥 단과 안쪽 곱하는 수의 Cartesian product이며, 안쪽 break 뒤 바깥 단은 계속됩니다.",
      explanations: [
        "원본 ex04_for_range.py는 range(2, 10)의 단과 range(1, 10)의 곱하는 수를 중첩해 8×9=72개 식을 만듭니다. 바깥 값 하나마다 안쪽 range를 처음부터 모두 순회합니다. 시간 복잡도와 출력 수는 두 길이의 곱입니다.",
        "안쪽에서 break하면 안쪽 for만 종료하고 바깥 본문의 다음 문장과 다음 바깥 iteration은 계속됩니다. Python에는 labeled break가 없습니다. 전체 탐색을 즉시 끝내려면 helper 함수에서 return하거나, 찾은 결과를 반환하거나, 작은 generator에서 next를 사용하는 편이 flag 중첩보다 명확할 수 있습니다.",
        "중첩 continue도 가장 가까운 반복에 적용됩니다. 안쪽 continue는 현재 cell만 건너뛰고 다음 column으로 갑니다. 바깥 row 전체를 건너뛰려면 바깥 본문 수준에서 continue해야 합니다. 들여쓰기는 단순 스타일이 아니라 어느 반복을 제어하는지 결정합니다.",
      ],
      concepts: [
        { term: "nested loop", definition: "반복문 본문 안에 다른 반복문이 있어 바깥 값마다 안쪽 구간을 순회하는 구조입니다.", detail: ["격자·조합·표 생성에 사용합니다.", "두 입력 길이의 곱만큼 실행될 수 있어 비용을 계산합니다."] },
        { term: "innermost loop", definition: "break 또는 continue 문을 가장 가깝게 직접 감싸는 반복문입니다.", detail: ["break는 이 반복 하나만 종료합니다.", "들여쓰기를 따라 제어 대상을 확인합니다."] },
      ],
      codeExamples: [
        {
          id: "nested-break-scope",
          title: "안쪽 break 뒤 바깥 반복이 계속되는 결과",
          language: "python",
          filename: "nested_break.py",
          purpose: "break의 범위를 좌표 탐색 결과로 눈에 보이게 만듭니다.",
          code: "visited = []\n\nfor row in range(1, 4):\n    for column in range(1, 4):\n        if row == 2 and column == 2:\n            print(f\"break inner at {row},{column}\")\n            break\n        visited.append((row, column))\n    print(f\"row {row} done\")\n\nprint(\"visited:\", visited)",
          walkthrough: [
            { lines: "1", explanation: "실제로 처리한 좌표만 순서대로 저장합니다." },
            { lines: "3-4", explanation: "3×3 좌표 후보를 바깥 row, 안쪽 column으로 만듭니다." },
            { lines: "5-7", explanation: "(2,2)에서 안쪽 break를 실행하므로 (2,2)와 (2,3)은 visited에 들어가지 않습니다." },
            { lines: "8-9", explanation: "안쪽 종료 뒤에도 row 2 done이 나오고 바깥 row 3이 계속됩니다." },
            { lines: "11", explanation: "최종 좌표 목록으로 어느 iteration이 생략됐는지 검증합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "nested_break.py를 저장"], command: "python -I -X utf8 nested_break.py" },
          output: { value: "row 1 done\nbreak inner at 2,2\nrow 2 done\nrow 3 done\nvisited: [(1, 1), (1, 2), (1, 3), (2, 1), (3, 1), (3, 2), (3, 3)]", explanation: ["row 2 done과 row 3 done이 보여 break가 바깥 for를 끝내지 않았습니다.", "row 2에서는 column 1만 방문하고 2에서 탈출했습니다.", "row 3은 다시 모든 column을 순회합니다."] },
          experiments: [
            { change: "break를 continue로 바꿉니다.", prediction: "(2,2)만 생략하고 (2,3)은 방문합니다.", result: "visited에 (2,3)이 추가되어 현재 iteration 건너뛰기임을 확인합니다." },
            { change: "좌표 탐색을 함수로 감싸 break 대신 return (row, column)을 사용합니다.", prediction: "(2,2)에서 함수 전체가 즉시 끝납니다.", result: "바깥 row 3 관련 출력이 없어 전체 탈출 구조가 됩니다." },
          ],
          sourceRefs: ["py-for-range", "py-day04-note"],
        },
      ],
      diagnostics: [
        { symptom: "안쪽에서 break했는데 바깥 반복이 계속 실행된다.", likelyCause: "break는 labeled 전체 탈출이 아니라 가장 가까운 반복 하나만 종료합니다.", checks: ["break를 감싸는 들여쓰기 블록을 확인합니다.", "안쪽 뒤 바깥 본문 로그를 추가합니다.", "원하는 종료 범위가 안쪽·바깥·함수인지 정의합니다."], fix: "전체 탐색을 helper 함수로 분리해 return하거나 명시적 결과 flag를 바깥 조건에서 처리합니다.", prevention: "중첩 제어 흐름 테스트에 찾은 직후 실행되면 안 되는 바깥 로그를 assertion으로 둡니다." },
      ],
    },
    {
      id: "loop-else",
      title: "반복문의 else는 break 없이 정상 소진됐음을 나타냅니다",
      lead: "for·while의 else는 조건문 else가 아니라 반복이 break로 중단되지 않았을 때 실행되는 완료 경로입니다.",
      explanations: [
        "검색에서 target을 찾으면 break하고, 끝까지 찾지 못하면 else에서 not found를 처리할 수 있습니다. flag=False로 시작해 찾을 때 True로 바꾸고 반복 뒤 검사하는 코드를 줄입니다. 앞의 검색 예제에서 ready는 break해 else가 없고 missing은 정상 소진돼 else가 실행됩니다.",
        "continue는 break가 아니므로 여러 번 실행돼도 iterable을 끝까지 소진하면 else가 실행됩니다. 빈 iterable도 break가 한 번도 없으므로 else가 바로 실행됩니다. while은 조건이 False가 되어 정상 종료할 때 else를 실행하고 break 종료에서는 건너뜁니다.",
        "for-else가 팀에 낯설어 읽기 어렵다면 helper 함수의 early return과 반복 뒤 명시적 기본 return이 더 나을 수 있습니다. 문법을 사용할 수 있다는 이유가 선택 근거는 아닙니다. 검색 성공·실패 두 경로가 분명해지는 경우에 사용하고 테스트 이름에 break/no-break를 드러냅니다.",
      ],
      concepts: [
        { term: "loop else", definition: "반복이 break 없이 정상 완료됐을 때 실행되는 블록입니다.", detail: ["continue는 else를 막지 않습니다.", "빈 iterable에서도 실행됩니다.", "검색 실패·재시도 소진 처리에 유용합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "검색 결과를 어떤 흐름으로 표현할까요?", options: [
          { name: "for-else", chooseWhen: "break 성공과 정상 소진 실패를 한 반복에 가까이 둘 때", avoidWhen: "팀이 문법을 오해하거나 성공 처리가 복잡할 때", tradeoffs: ["별도 flag가 없습니다.", "else 의미를 모르면 if와 혼동할 수 있습니다."] },
          { name: "helper 함수 return", chooseWhen: "찾는 순간 함수 전체를 종료하고 결과를 돌려줄 때", avoidWhen: "반복 뒤 공통 정리와 여러 결과를 계속 처리해야 할 때", tradeoffs: ["중첩 반복 전체 탈출도 명확합니다.", "작은 함수 경계를 추가합니다."] },
        ] },
      ],
    },
    {
      id: "cleanup-mutation-safety",
      title: "continue와 break가 있어도 정리는 구조로 보장합니다",
      lead: "continue 아래의 평범한 후처리는 건너뛰지만, 실행 중인 try의 finally와 with의 __exit__ 정리는 다음 iteration 전에 수행됩니다.",
      explanations: [
        "파일을 열고 특정 record에서 continue하는 코드가 close 문장을 continue 아래에 직접 두면 정리를 건너뛸 수 있습니다. with open(...)을 사용하면 블록을 continue·break·예외로 나가도 context manager가 정리합니다. try/finally도 continue가 실제 다음 iteration으로 이동하기 전에 finally를 실행합니다.",
        "반드시 실행할 정리와 정상 처리 완료 후에만 실행할 후처리를 구분합니다. finally에는 lock release, 파일·connection 반환처럼 무조건 필요한 일을 둡니다. 성공 count 증가나 completed 로그는 continue에서 생략되는 것이 맞을 수 있으므로 finally에 무조건 옮기지 않습니다.",
        "순회 중 원본 list를 삭제하면 index가 당겨져 항목을 건너뛸 수 있습니다. dict와 set 크기 변경은 RuntimeError가 날 수 있습니다. 새 결과 collection을 만들거나 원본 snapshot을 순회하고, 매우 큰 데이터라면 generator pipeline과 명시적 mutation 단계를 분리합니다.",
      ],
      concepts: [
        { term: "structured cleanup", definition: "제어 흐름이 continue·break·return·예외로 달라져도 finally 또는 context manager가 자원을 정리하게 만드는 구조입니다.", detail: ["continue는 finally가 끝난 뒤 다음 iteration으로 갑니다.", "with 블록을 나가면 __exit__가 호출됩니다.", "정리 실패도 별도 관찰과 복구 정책이 필요합니다."] },
      ],
      codeExamples: [
        {
          id: "continue-finally-cleanup",
          title: "continue에서도 finally는 실행되고 일반 후처리는 생략됨",
          language: "python",
          filename: "continue_cleanup.py",
          purpose: "정리 코드와 정상 완료 후처리의 실행 차이를 정확한 로그 순서로 확인합니다.",
          code: "for number in [1, -1, 2]:\n    try:\n        print(\"start\", number)\n        if number < 0:\n            print(\"skip\", number)\n            continue\n        print(\"use\", number)\n    finally:\n        print(\"cleanup\", number)\n    print(\"completed\", number)",
          walkthrough: [
            { lines: "1-3", explanation: "세 숫자마다 try에 들어가 시작 로그를 남깁니다." },
            { lines: "4-6", explanation: "음수 -1은 skip을 출력하고 continue를 예약합니다." },
            { lines: "7", explanation: "양수만 use 처리까지 진행합니다." },
            { lines: "8-9", explanation: "다음 iteration으로 실제 이동하기 전에 finally cleanup이 모든 숫자에서 실행됩니다." },
            { lines: "10", explanation: "일반 후처리 completed는 continue한 -1에서는 실행되지 않습니다." },
          ],
          run: { environment: ["Python 3.11 이상", "continue_cleanup.py를 저장"], command: "python -I -X utf8 continue_cleanup.py" },
          output: { value: "start 1\nuse 1\ncleanup 1\ncompleted 1\nstart -1\nskip -1\ncleanup -1\nstart 2\nuse 2\ncleanup 2\ncompleted 2", explanation: ["cleanup -1이 보여 continue도 finally를 건너뛰지 않습니다.", "completed -1은 없어 finally 밖 일반 코드는 건너뜁니다.", "양수에서는 use→cleanup→completed 순서입니다."] },
          experiments: [
            { change: "continue를 break로 바꿉니다.", prediction: "cleanup -1 뒤 반복 전체가 끝나 number 2 로그가 없습니다.", result: "finally는 실행되지만 이후 iteration은 실행되지 않습니다." },
            { change: "finally를 제거하고 cleanup print를 continue 아래 일반 코드로 옮깁니다.", prediction: "-1 정리 로그가 사라집니다.", result: "제어문과 무관한 정리가 필요하면 구조적 보장이 필요함을 확인합니다." },
          ],
          sourceRefs: ["py-while-continue", "py-day04-note"],
        },
      ],
      diagnostics: [
        { symptom: "continue가 있는 데이터 처리 뒤 일부 파일·connection이 반환되지 않는다.", likelyCause: "정리 문장이 continue 아래의 일반 경로에 있어 건너뛰었습니다.", checks: ["모든 continue·break·예외 경로를 표시합니다.", "자원 획득과 해제 로그를 id로 짝지어 봅니다.", "with 또는 try/finally 안에 획득이 있는지 확인합니다."], fix: "context manager 또는 try/finally로 자원 수명을 감싸고 cleanup을 무조건 실행 경로에 둡니다.", prevention: "skip·예외·break 테스트에서도 열린 자원 수가 0인지 검증합니다." },
        { symptom: "list에서 조건에 맞는 항목을 삭제하며 순회했더니 일부 값이 남는다.", likelyCause: "삭제 뒤 다음 요소가 현재 index로 이동했지만 iterator는 다음 index로 진행해 건너뛰었습니다.", checks: ["원본 list와 각 단계 index를 출력합니다.", "순회 중 append·remove·del을 찾습니다.", "dict/set이면 크기 변경 RuntimeError 가능성을 봅니다."], fix: "새 list comprehension이나 별도 결과 list를 만들고 원본 교체를 반복 밖에서 수행합니다.", prevention: "읽기 순회와 mutation 단계를 분리하고 연속 삭제 대상 테스트를 둡니다." },
      ],
      expertNotes: ["비동기 반복에서는 cancellation 시 async context manager와 finally가 정리하도록 설계하고, cancellation 예외를 광범위하게 삼키지 않습니다."],
    },
    {
      id: "loop-design-review",
      title: "반복 설계는 대상·진행·종료·정리 네 질문으로 검토합니다",
      lead: "짧은 반복문도 무엇을 소비하고 어떻게 진행하며 언제 끝나고 무엇을 반드시 정리하는지 답할 수 있어야 합니다.",
      explanations: [
        "첫째, 반복 대상과 순서 계약을 확인합니다. collection 자체인지 snapshot인지, set 순서가 의미 있는지, iterator가 한 번만 소비되는지 적습니다. 둘째, while이라면 모든 continue 경로에서 상태가 진행되는지, for라면 순회 중 원본을 변경하지 않는지 봅니다.",
        "셋째, 정상 소진·break·예외·취소의 종료 결과를 구분합니다. 검색 실패를 loop else로 처리할지, 전체 중첩을 return으로 끝낼지 선택합니다. 넷째, 자원 정리를 with·finally로 보장하고 성공 후처리와 무조건 정리를 섞지 않습니다.",
        "성능은 iteration 수와 본문 비용의 곱입니다. 구구단 8×9는 작지만 사용자 입력 두 목록의 중첩 비교는 크기가 커지면 급격히 늘어납니다. membership을 set으로 바꾸거나 index·dict lookup으로 알고리즘을 바꿀 수 있는지 측정합니다. break가 평균 시간을 줄여도 최악의 경우와 정확성은 별도로 검증합니다.",
      ],
      concepts: [
        { term: "loop contract", definition: "반복 대상, 순서, 진행 상태, 종료 경로, 결과와 정리 책임을 함께 적은 실행 약속입니다.", detail: ["대표 출력보다 빈 값·경계·중단·예외 경로를 포함합니다.", "성능과 자원 수명도 반복 횟수와 함께 검토합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: ["반복 본문이 길고 break·continue가 여러 곳이면 작은 함수, generator, filter 단계로 분해해 각 단계의 입력·출력·정리를 독립 테스트합니다."],
    },
  ],
  lab: {
    title: "학습 기록에서 첫 합격 항목 찾기",
    scenario: "여러 학습 기록을 순회하며 잘못된 항목은 건너뛰고, 지정 범위의 첫 합격 점수를 찾으면 즉시 종료하며, 없으면 정상 소진 메시지를 냅니다. 모든 기록은 처리 여부와 정리 로그를 남깁니다.",
    setup: ["learning_search.py를 만듭니다.", "records에 빈 dict, 잘못된 score, 정상 불합격, 정상 합격 항목을 섞습니다.", "Python 3.11 이상에서 실행합니다."],
    steps: [
      "enumerate(records, start=1)로 화면 번호와 record를 순회합니다.",
      "필수 key가 없거나 score가 int가 아니면 continue하되 skip reason을 출력합니다.",
      "0 <= score <= 100 연쇄 비교로 범위를 검증하고 범위 밖을 건너뜁니다.",
      "score >= 80인 첫 기록에서 결과를 저장하고 break합니다.",
      "for-else에서 합격 기록을 끝까지 찾지 못한 경우를 출력합니다.",
      "각 record 처리를 try/finally로 감싸 cleanup 로그가 continue와 break에서도 실행되는지 확인합니다.",
      "빈 records, 첫 항목 합격, 마지막 합격, 합격 없음, bool score 경계를 테스트합니다.",
    ],
    expectedResult: ["잘못된 항목은 이유와 함께 건너뛰며 다음 record를 계속 검사합니다.", "첫 합격에서 break해 뒤 record는 읽지 않습니다.", "합격 없음과 빈 목록에서는 for-else가 실행됩니다.", "continue와 break가 있어도 시작한 record의 cleanup 로그는 모두 남습니다."],
    cleanup: ["합성 데이터만 사용하고 실제 이름·전화번호·토큰을 기록하지 않습니다."],
    extensions: ["최대 검사 수를 range 또는 islice로 제한합니다.", "중첩된 과정→세션 검색을 helper 함수 return으로 전체 탈출합니다.", "pytest parametrize로 정상 소진·break·continue·빈 목록 경로를 자동화합니다."],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "1부터 20까지에서 3의 배수는 건너뛰고 15보다 큰 첫 값을 만나면 종료하세요.",
      requirements: ["range(1, 21)을 사용합니다.", "3의 배수에 continue를 사용합니다.", "15보다 큰 첫 출력 가능 값에서 break합니다.", "각 값이 출력·skip·break 중 어느 경로인지 표로 예측합니다."],
      hints: ["continue 조건을 break 조건보다 먼저 둘 때 18이 어떤 경로인지 확인하세요.", "최종 출력 뒤 loop else가 실행되는지 실험하세요."],
      expectedOutcome: "제어문 순서에 따라 같은 값이 skip 또는 break 후보가 될 수 있음을 설명합니다.",
      solutionOutline: ["각 iteration에서 modulo 조건을 먼저 검사합니다.", "그다음 종료 경계를 검사합니다.", "break 유무와 else 출력을 비교합니다."],
    },
    {
      difficulty: "응용",
      prompt: "dict 상품 목록에서 품절은 건너뛰고 예산 안의 첫 추천 상품을 찾으세요.",
      requirements: ["items() 언패킹을 사용합니다.", "dict insertion order와 추천 우선순위 관계를 설명합니다.", "품절 continue, 발견 break, 없음 for-else를 사용합니다.", "빈 dict·모두 품절·예산 경계·set 입력 오류를 테스트합니다.", "순회 중 dict를 변경하지 않습니다."],
      hints: ["가격과 재고를 nested dict에서 읽기 전에 key·type을 검사하세요.", "정렬 우선순위가 필요하면 반복 전에 sorted 결과를 만드세요."],
      expectedOutcome: "순서 계약과 세 종료 경로가 명확한 추천 검색기가 완성됩니다.",
      solutionOutline: ["입력 validation을 먼저 둡니다.", "skip과 accept 조건을 분리합니다.", "발견 결과를 반환하거나 loop else를 사용합니다.", "원본 collection은 읽기 전용으로 유지합니다."],
    },
    {
      difficulty: "설계",
      prompt: "대용량 로그 스트림의 검증·필터·조기 종료 파이프라인을 설계하세요.",
      requirements: ["한 번만 소비되는 iterator를 입력으로 받습니다.", "잘못된 record continue, 치명 오류 break 또는 예외 정책을 구분합니다.", "최대 처리 건수와 시간 제한을 둡니다.", "모든 record 자원 정리를 context manager/finally로 보장합니다.", "set 순서와 원본 mutation에 의존하지 않습니다.", "정상 소진·빈 스트림·조기 종료·예외·취소 테스트를 최소 12개 작성합니다.", "중첩 반복이 필요하면 return·generator·flag 중 선택 근거를 적습니다."],
      hints: ["parse, validate, process를 작은 함수로 분리하세요.", "처리 count와 skip reason을 구조화해 집계하세요.", "실제 민감 로그 대신 합성 record를 사용하세요."],
      expectedOutcome: "제어 흐름뿐 아니라 자원·관측성·성능·취소까지 포함한 재현 가능한 반복 처리 설계가 완성됩니다.",
      solutionOutline: ["loop contract를 문서화합니다.", "각 record를 with/try-finally로 감쌉니다.", "정상·skip·stop·failure 결과를 구조화합니다.", "경계와 호출 횟수를 자동 검증합니다."],
    },
  ],
  reviewQuestions: [
    { question: "for value in values에서 value는 언제 바인딩되나요?", answer: "iterator가 다음 값을 반환할 때마다 현재 항목에 다시 바인딩된 뒤 본문이 실행됩니다." },
    { question: "break는 중첩 반복 전체를 끝내나요?", answer: "아닙니다. 가장 가까운 반복 하나만 종료합니다. 전체 종료는 함수 return 등 별도 구조가 필요합니다." },
    { question: "while에서 continue 때문에 무한 반복이 생기는 대표 원인은?", answer: "조건에 쓰는 counter나 입력 소비가 continue 아래에 있어 해당 경로에서 상태가 변하지 않는 경우입니다." },
    { question: "continue가 실행되면 finally도 건너뛰나요?", answer: "아닙니다. 다음 iteration으로 이동하기 전에 현재 try의 finally가 실행됩니다. finally 밖의 일반 후처리는 건너뛸 수 있습니다." },
    { question: "for-else의 else는 언제 실행되나요?", answer: "반복이 break 없이 정상 소진될 때 실행됩니다. continue나 빈 iterable은 else를 막지 않습니다." },
    { question: "range(2, 10, 3)의 값과 stop 규칙은?", answer: "2, 5, 8입니다. 다음 11은 범위를 넘고 stop 10은 포함하지 않습니다." },
    { question: "range(5, 1, 1)이 ValueError가 아니라 빈 range인 이유는?", answer: "양수 step으로 5에서 더 작은 stop 방향으로 갈 수 없어 생성 가능한 값이 없기 때문입니다." },
    { question: "dict를 직접 for로 순회하면 무엇이 나오나요?", answer: "key가 insertion order로 나옵니다. value는 values(), key-value 쌍은 items()를 사용합니다." },
    { question: "set 출력 순서를 테스트 기대값으로 쓰면 안 되는 이유는?", answer: "set iteration은 정렬·insertion order 계약이 아니며 프로세스와 환경에 따라 달라질 수 있습니다." },
    { question: "순회 중 list 항목을 삭제하면 왜 값이 건너뛰어질 수 있나요?", answer: "삭제로 다음 요소가 현재 index로 당겨졌는데 iterator는 다음 index로 진행하기 때문입니다." },
  ],
  completionChecklist: [
    "iterable·iterator·loop target의 관계로 for 실행을 설명할 수 있다.",
    "break·continue·정상 소진의 이동 지점을 코드 줄 단위로 예측할 수 있다.",
    "while continue 경로의 progress invariant를 점검할 수 있다.",
    "for-else가 break·continue·빈 iterable에서 어떻게 동작하는지 설명할 수 있다.",
    "list·tuple·str·dict·set 순회 값과 순서 계약을 구분할 수 있다.",
    "range의 stop 미포함, 양·음 step, 빈 범위, step=0을 예측할 수 있다.",
    "중첩 break가 안쪽만 종료함을 실행 결과로 증명할 수 있다.",
    "continue·break에서도 finally와 context manager 정리를 보장할 수 있다.",
    "순회 중 mutation을 피하고 빈 값·경계·조기 종료 테스트를 작성할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-while-break", repository: "PYTHON-BASIC", path: "day04/ex01_while_break.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day04/ex01_while_break.py", usedFor: ["break", "while True", "커피 재고 상태", "종료 후 흐름"], evidence: "Python 3.13.9에서 직접 실행해 재고 10→0의 열 iteration, 판매 중지 메시지와 break 뒤 별표 출력을 확인했습니다." },
    { id: "py-while-continue", repository: "PYTHON-BASIC", path: "day04/ex02_while_continue.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day04/ex02_while_continue.py", usedFor: ["continue", "상태 갱신 위치", "4 제외", "홀수 필터"], evidence: "직접 실행해 1 2 3 5 6 7 8 9 10과 1 3 5 7 9를 확인하고 cnt 증가가 continue 전에 있어 진행이 보장됨을 감사했습니다." },
    { id: "py-for-collections", repository: "PYTHON-BASIC", path: "day04/ex03_for.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day04/ex03_for.py", usedFor: ["list·tuple·set·dict·string 순회", "keys·values·items", "언패킹", "문자 continue"], evidence: "직접 실행해 list·tuple 위치 순서, dict 네 순회 형태, tuple 언패킹과 Python Hello에서 o가 제외된 출력을 확인했습니다. set 순서는 실행 결과를 공개 계약으로 사용하지 않았습니다." },
    { id: "py-for-range", repository: "PYTHON-BASIC", path: "day04/ex04_for_range.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day04/ex04_for_range.py", usedFor: ["range", "len·type", "7단", "중첩 구구단", "출력 방향"], evidence: "직접 실행한 118개 출력 줄에서 range(1, 11), 길이 10, range 타입, 1~10, 7단과 2~9단 두 배치 결과를 확인했습니다." },
    { id: "py-day04-note", repository: "PYTHON-BASIC", path: "notes/day04_loop_function.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day04_loop_function.md", usedFor: ["break·continue 요약", "for 대상", "dict 순회", "for-else", "range 인수", "self-check"], evidence: "Day04 노트의 반복문 1~3절과 Q1을 감사해 원본 범위를 유지하고 iterator·정리·mutation·성능 공백을 구분해 보강했습니다." },
  ],
  sourceCoverage: {
    filesRead: 5,
    filesUsed: 5,
    uncoveredNotes: [
      "원본 set 출력에는 실행 순서가 나타나지만 이를 안정 순서로 일반화하지 않고 sorted를 사용한 결정적 예제를 추가했습니다.",
      "원본 range는 양수 step 중심이므로 음수 step, 빈 구간, step=0과 membership은 기술 보강입니다.",
      "for-else는 Day04 노트에는 있으나 실행 파일에는 직접 예제가 없어 검색 성공·실패·빈 iterable 결과를 새 실행 예제로 보강했습니다.",
      "continue와 finally/context manager 정리, 순회 중 mutation, 전체 중첩 탈출은 원본 공백을 전문가 관점으로 추가했습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const expertSession = session as DetailedSession;
expertSession.level = "전문가";
expertSession.estimatedMinutes = 300;
expertSession.chapters.push({
  id: "iterator-protocol-mutation-and-formal-termination",
  title: "for를 iterator protocol·StopIteration·변이 안정성·종료 증명으로 해석합니다",
  lead: "for는 인덱스를 자동 증가시키는 문법이 아니라 iterable에서 iterator를 얻고 next를 반복 호출하는 protocol 소비자입니다. 이 관점을 가지면 단일 소비, loop-else, break, 컨테이너 변이와 무한 iterator의 위험을 일관되게 설명할 수 있습니다.",
  explanations: [
    "`for target in iterable`은 개념적으로 `iterator = iter(iterable)`을 한 번 수행한 뒤 `next(iterator)`가 값을 돌려주는 동안 본문을 실행하고 StopIteration에서 정상 종료합니다. iterator의 `__iter__`는 보통 자기 자신을 반환하고 `__next__`는 다음 값 또는 StopIteration을 제공합니다. StopIteration을 for 바깥에서 직접 처리할 필요는 드물지만 custom iterable·stream·generator 디버깅에는 이 모델이 핵심입니다.",
    "iterable은 여러 iterator를 새로 만들 수 있는 컨테이너일 수 있고, iterator는 대개 한 번 소비하면 되돌릴 수 없는 상태 객체입니다. list는 반복을 두 번 시작할 수 있지만 `iter(list)`가 만든 iterator와 generator expression은 소비 후 비어 있습니다. 동일 데이터의 두 pass가 필요하면 재생성 가능한 iterable을 받거나 필요한 크기 안에서 명시적으로 materialize합니다.",
    "for-else의 else는 iterable이 비어서 끝나거나 처음부터 비었을 때처럼 break 없이 정상 고갈하면 실행됩니다. continue는 break가 아니므로 else 실행을 막지 않습니다. return·예외는 loop를 빠져나가지만 else로 가지 않습니다. 검색 성공에서 break하고 else에서 not-found를 처리하면 별도 flag를 없앨 수 있지만 중첩 loop에서는 break가 가장 가까운 한 loop만 끝낸다는 점을 반영합니다.",
    "반복 중 같은 list를 삭제하면 iterator의 다음 index와 요소 이동이 엇갈려 항목이 건너뛰어질 수 있습니다. dict·set 크기를 바꾸면 RuntimeError가 날 수 있습니다. `for item in items.copy()`에서 원본을 수정하거나, 새 컬렉션을 만들어 대체하거나, 삭제 대상을 먼저 수집하는 2단계 방식을 사용합니다. 단, snapshot은 메모리와 시점 일관성 비용을 가집니다.",
    "range는 값들을 미리 저장한 list가 아니라 start·stop·step 규칙을 가진 불변 sequence 객체입니다. stop은 포함하지 않고 step은 0일 수 없으며 음수 step에서는 start가 stop보다 커야 값이 나옵니다. `range(len(items))`는 index 자체가 필요할 때만 쓰고 값만 필요하면 직접 반복, index와 값이면 enumerate를 선택합니다.",
    "유한 컨테이너 for의 종료는 iterator가 결국 StopIteration을 내는 것으로 설명됩니다. `itertools.count()`나 종료 없는 generator는 유한하지 않으므로 break·islice·외부 deadline 같은 별도 경계가 필요합니다. 본문이 iterator를 직접 `next()`로 추가 소비하면 한 반복당 여러 항목이 사라지므로 protocol 소유권도 명확히 합니다.",
  ],
  concepts: [
    { term: "iterable", definition: "iter()가 iterator를 반환해 for가 순회할 수 있는 객체입니다.", detail: ["컨테이너는 보통 매번 새 iterator를 제공합니다.", "iterable이라고 모두 길이나 index를 제공하지는 않습니다."] },
    { term: "iterator", definition: "__next__로 다음 값을 제공하고 끝에서 StopIteration을 발생시키는 상태 있는 단일 소비 객체입니다.", detail: ["__iter__는 보통 self를 반환합니다.", "소비 위치가 객체 안에 저장됩니다."] },
    { term: "normal exhaustion", definition: "break·return·예외가 아니라 iterator가 StopIteration을 내서 for가 끝난 상태입니다.", detail: ["for-else의 else가 실행됩니다.", "빈 iterable도 정상 고갈입니다."] },
  ],
  codeExamples: [
    {
      id: "custom-iterator-break-else-snapshot",
      title: "custom iterator의 고갈, break와 snapshot 변이",
      language: "python",
      filename: "iterator_protocol.py",
      purpose: "__next__/StopIteration, for-else의 정상 고갈 조건, 반복 대상 snapshot을 한 실행에서 검증합니다.",
      code: "class Countdown:\n    def __init__(self, start):\n        self.current = start\n\n    def __iter__(self):\n        return self\n\n    def __next__(self):\n        if self.current <= 0:\n            raise StopIteration\n        value = self.current\n        self.current -= 1\n        return value\n\ndef find(iterable, target):\n    for value in iterable:\n        if value == target:\n            print(f'found:{value}')\n            break\n    else:\n        print('not-found')\n\nfind(Countdown(3), 2)\nfind(Countdown(2), 9)\n\nvalues = [1, 2, 3, 4]\nfor value in values.copy():\n    if value % 2 == 0:\n        values.remove(value)\nprint(f'odds={values}')",
      walkthrough: [
        { lines: "1-14", explanation: "Countdown은 자기 자신을 iterator로 반환하고 상태를 한 칸씩 줄이다 0에서 StopIteration을 냅니다." },
        { lines: "16-23", explanation: "검색 성공은 break로 else를 건너뛰고, 정상 고갈은 not-found else를 실행합니다." },
        { lines: "25-30", explanation: "복사 snapshot을 순회하며 원본 list에서 짝수를 제거해 index 이동에 따른 누락을 피합니다." },
      ],
      run: { environment: ["Python 3.8 이상", "iterator_protocol.py를 UTF-8로 저장"], command: "python -I -X utf8 iterator_protocol.py" },
      output: { value: "found:2\nnot-found\nodds=[1, 3]", explanation: ["첫 iterator는 2에서 break하므로 else가 실행되지 않습니다.", "둘째는 2와 1을 모두 소비한 뒤 StopIteration으로 끝나 else가 실행됩니다.", "snapshot과 원본을 분리해 모든 짝수가 제거됩니다."] },
      experiments: [
        { change: "첫 find 호출이 끝난 Countdown 객체를 변수에 보존해 다시 find합니다.", prediction: "break 당시 남은 상태부터 이어서 소비하며 처음부터 재시작하지 않습니다.", result: "iterator가 단일 소비 상태 객체임을 확인합니다." },
        { change: "values.copy()를 values로 바꿉니다.", prediction: "요소 이동 때문에 일부 입력에서는 삭제 대상이 건너뛰어질 수 있습니다.", result: "반복 중 동일 list 구조 변경의 불안정성을 재현합니다." },
      ],
      sourceRefs: ["python-iterator-protocol-doc", "python-for-reference-doc", "python-range-doc", "python-itertools-doc", "python-enumerate-doc"],
    },
  ],
  diagnostics: [
    { symptom: "generator를 두 번째 for에서 순회했더니 아무 값도 나오지 않는다.", likelyCause: "generator iterator가 첫 번째 순회에서 이미 StopIteration까지 소비됐습니다.", checks: ["type과 iter(obj) is obj 여부를 확인합니다.", "첫 pass 뒤 next를 sentinel default와 함께 호출합니다.", "두 pass가 정말 필요한지 데이터 흐름을 검토합니다."], fix: "generator를 새로 만드는 factory를 호출하거나, 크기가 제한된 경우 list로 한 번 materialize합니다.", prevention: "함수 인수 계약에서 iterable과 single-pass iterator를 구분하고 소비 주체를 하나로 정합니다." },
    { symptom: "list에서 조건에 맞는 항목을 지웠는데 일부가 남는다.", likelyCause: "같은 list를 순회하면서 삭제해 다음 index로 이동한 요소를 건너뛰었습니다.", checks: ["for 대상과 remove/pop 대상이 동일 객체인지 확인합니다.", "연속된 삭제 대상 입력으로 재현합니다.", "dict/set 크기 변경 RuntimeError도 함께 확인합니다."], fix: "새 list comprehension을 만들거나 snapshot을 순회하거나 삭제 대상을 먼저 수집합니다.", prevention: "순회 단계와 구조 변경 단계를 분리하는 코딩 규칙을 둡니다." },
  ],
  comparisons: [
    { title: "반복에서 값·index·병렬 입력을 어떻게 얻을까요?", options: [
      { name: "직접 for / enumerate", chooseWhen: "값 또는 index와 값이 필요할 때", avoidWhen: "두 iterable을 위치별로 함께 묶어야 할 때", tradeoffs: ["값만 쓰면 가장 단순합니다.", "enumerate는 시작 index를 명시할 수 있습니다.", "길이 기반 index 오류를 줄입니다."] },
      { name: "zip / range", chooseWhen: "여러 iterable을 병렬 소비하거나 숫자 progression 자체가 필요할 때", avoidWhen: "단순 컨테이너 값을 얻기 위해 range(len(...))가 불필요할 때", tradeoffs: ["zip은 기본적으로 가장 짧은 입력에서 끝납니다.", "strict=True는 길이 불일치를 검출할 수 있습니다.", "range는 stop exclusive와 step 방향을 명시합니다."] },
    ] },
  ],
  expertNotes: ["PEP 479 때문에 generator 함수 내부에서 의도치 않게 발생한 StopIteration은 RuntimeError로 변환될 수 있으므로 generator 종료는 return을 사용합니다.", "외부 iterator를 여러 소비자가 나눠 next하는 구조는 항목 소유권과 backpressure를 명시하지 않으면 누락·순서 버그가 됩니다."],
});

expertSession.reviewQuestions.push(
  { question: "for 문은 내부적으로 어떤 종료 신호를 사용하나요?", answer: "iterable에서 얻은 iterator의 __next__를 반복 호출하고 StopIteration이 발생하면 정상 고갈로 종료합니다." },
  { question: "iterable과 iterator의 핵심 차이는 무엇인가요?", answer: "iterable은 iter()로 순회자를 제공하는 객체이고 iterator는 현재 소비 위치를 가진 단일 소비 객체입니다. 컨테이너는 보통 새 iterator를 여러 번 만들 수 있습니다." },
  { question: "continue가 실행되면 for-else의 else가 생략되나요?", answer: "아닙니다. continue는 다음 반복으로 갈 뿐이며 break 없이 정상 고갈하면 else가 실행됩니다." },
  { question: "반복 중 list 삭제를 안전하게 하는 대표 방법은 무엇인가요?", answer: "새 컬렉션을 만들어 대체하거나 snapshot 복사본을 순회하거나 삭제 대상을 먼저 수집한 뒤 두 번째 단계에서 변경합니다." },
  { question: "무한 iterator의 종료를 어떻게 보장하나요?", answer: "break 조건, itertools.islice 같은 항목 상한, 취소 신호나 monotonic deadline을 소비자 계약으로 추가합니다." },
);

expertSession.completionChecklist.push(
  "for를 iter()·next()·StopIteration 순서로 풀어 설명할 수 있다.",
  "재사용 가능한 iterable과 single-pass iterator를 구분할 수 있다.",
  "break·continue·return·예외·정상 고갈이 loop-else에 미치는 영향을 예측할 수 있다.",
  "range의 stop exclusive·음수 step·step 0 경계를 검증할 수 있다.",
  "반복 중 list·dict·set 구조 변경을 안전한 2단계 처리로 바꿀 수 있다.",
  "무한 iterator에 항목·시간·취소 종료 경계를 추가할 수 있다.",
);

expertSession.sources.push(
  { id: "python-iterator-protocol-doc", repository: "Python", path: "reference/datamodel.html#object.__iter__", publicUrl: "https://docs.python.org/3/reference/datamodel.html#object.__iter__", usedFor: ["iterable", "iterator", "__next__", "StopIteration"], evidence: "언어 데이터 모델의 iterator protocol과 종료 신호를 확인했습니다." },
  { id: "python-for-reference-doc", repository: "Python", path: "reference/compound_stmts.html#the-for-statement", publicUrl: "https://docs.python.org/3/reference/compound_stmts.html#the-for-statement", usedFor: ["for 실행", "break", "continue", "loop else"], evidence: "for가 iterator 항목을 순서대로 대입하고 정상 고갈 시 else를 실행하는 규칙을 확인했습니다." },
  { id: "python-range-doc", repository: "Python", path: "library/stdtypes.html#range", publicUrl: "https://docs.python.org/3/library/stdtypes.html#range", usedFor: ["range sequence", "stop exclusive", "음수 step"], evidence: "range가 값을 미리 저장하지 않는 불변 sequence이며 start·stop·step 규칙을 갖는 점을 확인했습니다." },
  { id: "python-itertools-doc", repository: "Python", path: "library/itertools.html", publicUrl: "https://docs.python.org/3/library/itertools.html", usedFor: ["무한 iterator", "islice", "lazy 조합"], evidence: "무한 iterator와 유한 소비 경계를 설명하기 위해 표준 iterator building blocks를 확인했습니다." },
  { id: "python-enumerate-doc", repository: "Python", path: "library/functions.html#enumerate", publicUrl: "https://docs.python.org/3/library/functions.html#enumerate", usedFor: ["index와 값", "range(len()) 대체"], evidence: "enumerate가 iterable에서 index와 값을 함께 생성하는 공식 의미를 확인했습니다." },
);
