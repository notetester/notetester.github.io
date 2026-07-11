import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-008"],
  slug: "python-008-string-indexing-slicing",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 8,
  title: "문자열 인덱싱·슬라이싱",
  subtitle: "문자의 위치와 반열린 범위를 정확히 추적하고, 음수 인덱스·step·불변성·Unicode 경계를 실제 결과로 이해합니다.",
  level: "입문",
  estimatedMinutes: 100,
  coreQuestion: "문자열의 한 위치와 범위를 오류 없이 선택하고, 선택 결과가 원본과 어떤 관계인지 어떻게 설명할까요?",
  summary: "0부터 시작하는 인덱스, 오른쪽에서 세는 음수 인덱스, 끝 위치를 포함하지 않는 슬라이스를 그림처럼 추적합니다. 범위를 거꾸로 썼을 때 빈 문자열이 되는 이유, step과 역순, IndexError·ValueError·TypeError 진단, 문자열 불변성과 Unicode 문자 단위의 한계까지 다룹니다.",
  objectives: [
    "문자열 길이와 양수·음수 인덱스 범위를 계산하고 특정 문자를 예측할 수 있다.",
    "slice[start:stop:step]의 반열린 범위와 생략 기본값을 설명할 수 있다.",
    "인덱싱의 범위 초과와 슬라이싱의 범위 보정이 다르게 동작하는 이유를 구분할 수 있다.",
    "문자열이 불변 객체라는 사실을 재바인딩과 연결해 설명할 수 있다.",
    "Unicode 코드 포인트와 사용자가 보는 글자 단위가 항상 같지 않다는 한계를 인식할 수 있다.",
  ],
  prerequisites: [
    { title: "문자열 표기와 escape", reason: "str 객체를 만들고 출력하는 방법을 사용합니다.", sessionSlug: "python-007-string-literals-escapes-raw" },
    { title: "숫자형과 연산자", reason: "인덱스는 정수이고 시작·끝·step의 부호와 범위를 계산합니다.", sessionSlug: "python-005-arithmetic-comparison-logic" },
  ],
  keywords: ["Python", "str", "인덱싱", "슬라이싱", "negative index", "step", "immutable", "IndexError", "Unicode"],
  chapters: [
    {
      id: "string-as-sequence",
      title: "문자열은 순서가 있는 문자 시퀀스입니다",
      lead: "str은 문자들이 순서대로 놓인 불변 시퀀스이므로 길이를 구하고 위치로 한 요소 또는 새 범위를 선택할 수 있습니다.",
      explanations: [
        "text = 'Hello Python'에서 len(text)는 12입니다. 공백도 하나의 위치를 차지합니다. 첫 문자의 위치는 0이고 마지막 문자의 양수 인덱스는 len(text)-1인 11입니다. 다른 언어와 마찬가지로 0부터 시작하는 이유를 외우는 데 그치지 말고 가능한 위치가 0 이상 len 미만이라는 범위로 기억하세요.",
        "text[index]는 해당 위치의 한 문자를 str로 반환합니다. Python에는 별도 char 타입이 없으므로 text[0]의 type도 str이고 길이는 1입니다. 선택은 원본 문자열을 제거하거나 바꾸지 않습니다.",
        "인덱스는 ‘몇 번째 사람’보다 시작점에서 몇 칸 떨어졌는지를 나타내는 offset으로 보면 0이 자연스럽습니다. 첫 문자는 시작점에서 0칸, 두 번째는 1칸 떨어져 있습니다. 이 관점은 배열, 리스트, 파일 위치와 슬라이스 길이를 이해할 때 이어집니다.",
      ],
      concepts: [
        { term: "시퀀스(sequence)", definition: "요소가 순서를 가지며 위치를 통해 접근할 수 있는 데이터 모델입니다.", detail: ["문자열, 리스트, 튜플, range가 대표적인 시퀀스입니다.", "시퀀스마다 변경 가능성은 다르며 str과 tuple은 불변, list는 가변입니다."], analogy: "번호가 0부터 붙은 좌석 줄처럼 각 요소의 순서가 고정되어 있습니다." },
        { term: "offset", definition: "시작 기준점에서 얼마나 떨어져 있는지를 나타내는 정수 위치입니다.", detail: ["첫 요소의 offset은 0입니다.", "len이 n인 시퀀스의 유효한 양수 offset은 0부터 n-1까지입니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
    },
    {
      id: "positive-negative-index",
      title: "양수와 음수 인덱스는 같은 위치를 양쪽에서 셉니다",
      lead: "양수 0은 왼쪽 첫 문자, 음수 -1은 오른쪽 마지막 문자입니다. 길이가 n일 때 음수 -n까지가 유효합니다.",
      explanations: [
        "'Hello Python'에서 text[6]은 P입니다. 왼쪽에서 H=0, e=1, l=2, l=3, o=4, 공백=5, P=6으로 셉니다. text[-1]은 n, text[-2]는 o입니다. 같은 위치는 양수 i와 i-len(text)라는 음수로 표현할 수 있습니다.",
        "마지막 요소를 읽을 때 text[len(text)-1]보다 text[-1]이 간단하고 길이가 바뀌어도 의도가 유지됩니다. 그러나 계산된 음수 인덱스가 -len보다 작아지면 IndexError가 납니다. 음수라고 해서 자동으로 끝에 순환하는 것은 아닙니다.",
        "빈 문자열은 유효한 인덱스가 없습니다. text[-1]을 안전하게 쓰려면 먼저 문자열이 비어 있지 않은지 확인하거나, 요구사항상 빈 입력을 금지하고 경계에서 검증합니다. try/except로 모든 IndexError를 숨기면 데이터 결함을 놓칠 수 있습니다.",
      ],
      concepts: [
        { term: "음수 인덱스", definition: "시퀀스 끝을 기준으로 -1부터 왼쪽으로 세는 위치 표기입니다.", detail: ["-1은 마지막, -len(sequence)는 첫 요소입니다.", "유효 범위 밖 음수 인덱스는 양수와 마찬가지로 IndexError를 만듭니다."], caveat: "음수 인덱스는 순환 인덱스가 아닙니다. -len보다 작은 값이 끝에서 다시 이어지지 않습니다." },
      ],
      codeExamples: [
        {
          id: "index-and-basic-slice",
          title: "양쪽 인덱스와 반열린 슬라이스 확인",
          language: "python",
          filename: "index_slice_basics.py",
          purpose: "원본 ex02_string.py의 모든 핵심 출력을 repr과 길이 정보로 보강해 공백·빈 문자열까지 눈에 보이게 만듭니다.",
          code: "text = 'Hello Python'\n\nprint(text[6])\nprint(text[-2])\nprint(text[1:3], type(text[1:3]))\nprint(repr(text[3:1]))\nprint(text[-4:-2])\nprint(repr(text[-2:-4]))\nprint(text[:5])\nprint(text[6:])",
          walkthrough: [
            { lines: "1", explanation: "길이 12인 str을 text 이름에 바인딩합니다. 중간 공백도 인덱스 5의 요소입니다." },
            { lines: "3", explanation: "양수 인덱스 6은 일곱 번째 문자 P를 선택합니다." },
            { lines: "4", explanation: "-2는 끝에서 두 번째 문자 o를 선택합니다." },
            { lines: "5", explanation: "1 이상 3 미만 위치인 e와 l을 새 str 'el'로 만듭니다. 한 범위 선택 결과도 str입니다." },
            { lines: "6", explanation: "기본 step은 +1인데 시작 3에서 끝 1 방향으로 갈 수 없어 빈 문자열이 됩니다. repr이 두 따옴표로 빈 값을 드러냅니다." },
            { lines: "7-8", explanation: "음수 위치도 실제 위치로 환산한 뒤 같은 방향 규칙을 적용합니다. -4:-2는 th, -2:-4는 빈 문자열입니다." },
            { lines: "9-10", explanation: "start 생략은 처음부터, stop 생략은 끝까지를 뜻해 Hello와 Python을 얻습니다." },
          ],
          run: { environment: ["Python 3.11 이상", "index_slice_basics.py를 UTF-8로 저장"], command: "python index_slice_basics.py" },
          output: { value: "P\no\nel <class 'str'>\n''\nth\n''\nHello\nPython", explanation: ["빈 문자열 줄을 그냥 print하면 아무것도 안 보여 repr로 ''를 표시했습니다.", "stop 위치의 문자는 포함되지 않아 [1:3]이 인덱스 1과 2만 선택합니다.", "같은 원본에서 선택해도 모든 슬라이스 결과는 별도 str 값입니다."] },
          experiments: [
            { change: "text[6]을 text[12]로 바꿉니다.", prediction: "길이 12의 마지막 유효 인덱스는 11이므로 IndexError가 납니다.", result: "IndexError: string index out of range가 발생합니다." },
            { change: "text[1:3]을 text[1:3:2]로 바꿉니다.", prediction: "인덱스 1만 선택하고 다음 3은 stop이라 포함되지 않습니다.", result: "'e'가 출력됩니다." },
          ],
          sourceRefs: ["py-string-index-code", "py-day02-note"],
        },
      ],
      diagnostics: [
        { symptom: "IndexError: string index out of range가 발생한다.", likelyCause: "유효 범위 0..len-1 또는 -len..-1 밖의 단일 인덱스를 사용했거나 빈 문자열에서 요소를 읽었습니다.", checks: ["repr(text)와 len(text)를 함께 출력합니다.", "사용한 index가 -len(text) 이상 len(text) 미만인지 확인합니다.", "입력 정제 후 예상과 달리 빈 문자열이 된 경로를 추적합니다."], fix: "업무 규칙에 따라 빈 입력을 거부하거나 인덱스를 검증합니다. 기본값이 의미 있을 때만 조건식으로 대체합니다.", prevention: "빈 값, 길이 1, 마지막 위치, 범위 밖을 포함한 경계 테스트를 작성합니다." },
      ],
    },
    {
      id: "half-open-slice",
      title: "start는 포함하고 stop은 포함하지 않습니다",
      lead: "text[start:stop]은 start ≤ index < stop인 요소를 선택합니다. 반열린 범위는 길이와 이어 붙이기 규칙을 단순하게 만듭니다.",
      explanations: [
        "step이 +1일 때 슬라이스 길이는 유효 범위 안에서 대체로 stop-start입니다. text[0:5]가 5글자인 이유입니다. stop을 포함하지 않기 때문에 text[:i]와 text[i:]를 더하면 원본이 정확히 복원되고 i 위치가 겹치거나 빠지지 않습니다.",
        "start를 생략하면 처음 경계, stop을 생략하면 끝 경계를 사용합니다. text[:]는 전체를 선택합니다. 문자열은 불변이어서 값이 같지만 새 객체 생성 여부는 구현 최적화에 따라 달라질 수 있으므로 is로 복사 여부를 판단하지 않습니다.",
        "슬라이스 경계가 길이를 넘어가면 가능한 범위로 보정됩니다. text[:1000]은 전체 문자열을 반환하고 오류가 나지 않습니다. 단일 인덱싱과 다른 이 규칙은 부분 데이터 처리에 편리하지만, 잘못된 경계 계산을 조용히 숨길 수도 있어 예상 길이를 검사해야 합니다.",
      ],
      concepts: [
        { term: "반열린 구간", definition: "시작 경계는 포함하고 끝 경계는 제외하는 범위입니다.", detail: ["[start, stop)로 표기하며 길이 계산이 stop-start로 단순합니다.", "인접한 [:i]와 [i:] 범위가 겹치지 않고 원본 전체를 나눕니다."], analogy: "호텔 숙박에서 체크인 날짜는 포함하고 체크아웃 날짜의 밤은 포함하지 않아 숙박 일수가 체크아웃-체크인인 것과 비슷합니다." },
        { term: "경계 보정", definition: "슬라이스의 start와 stop이 시퀀스 범위를 넘어도 가능한 범위로 제한하는 동작입니다.", detail: ["단일 인덱스는 보정하지 않고 범위 밖이면 오류를 냅니다.", "보정이 편리한지 잘못된 계산을 숨기는지는 요구사항에 따라 다릅니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "text[3:1]이 오류 대신 빈 문자열을 반환한다.", likelyCause: "기본 step +1은 작은 인덱스에서 큰 인덱스로만 이동하는데 start가 stop보다 큽니다.", checks: ["start, stop, step 세 값을 적어 봅니다.", "step 부호가 목표 방향과 맞는지 확인합니다.", "repr(result)와 len(result)로 빈 문자열을 명확히 확인합니다."], fix: "정방향 범위라면 start와 stop을 바로잡고, 역방향 선택이 목적이면 음수 step을 명시합니다.", prevention: "슬라이스를 쓰기 전에 선택될 인덱스 3~5개를 손으로 적고 테스트합니다." },
      ],
    },
    {
      id: "step-and-reverse",
      title: "세 번째 값 step이 방향과 간격을 정합니다",
      lead: "text[start:stop:step]에서 step은 다음 인덱스로 얼마나 이동할지 정합니다. 음수 step은 오른쪽에서 왼쪽으로 이동합니다.",
      explanations: [
        "text[::2]는 처음부터 끝까지 두 칸 간격으로 선택하고 text[1::2]는 홀수 위치를 선택합니다. text[::-1]은 끝에서 처음 방향으로 한 칸씩 가므로 역순 문자열을 만듭니다. step이 음수일 때 생략된 start와 stop 기본 경계도 역방향에 맞게 달라집니다.",
        "text[5:1:-1]은 인덱스 5,4,3,2를 선택하고 stop 1은 포함하지 않습니다. 음수 step인데 start가 stop보다 작으면 결과는 빈 문자열입니다. 방향·포함 규칙은 정방향과 대칭적으로 이해할 수 있습니다.",
        "step은 0일 수 없습니다. 다음 위치로 영원히 이동하지 못하기 때문에 Python은 ValueError를 냅니다. 외부 설정에서 step을 받는다면 0을 명시적으로 거부하고 부호에 따라 경계를 검사합니다.",
      ],
      concepts: [
        { term: "step", definition: "슬라이스에서 다음에 선택할 인덱스까지의 이동량입니다.", detail: ["양수는 왼쪽에서 오른쪽, 음수는 오른쪽에서 왼쪽 방향입니다.", "절댓값이 2면 한 요소씩 건너뜁니다."], caveat: "0은 이동 방향을 만들 수 없어 ValueError입니다." },
      ],
      codeExamples: [
        {
          id: "slice-step-and-immutability",
          title: "간격·역순·새 문자열 조립 확인",
          language: "python",
          filename: "slice_steps.py",
          purpose: "step과 불변성을 한 예제에서 확인하고, 원본을 수정하는 대신 슬라이스를 조합하는 방법을 익힙니다.",
          code: "text = 'Hello Python'\n\nprint(text[::2])\nprint(text[::-1])\nprint(text[10:5:-1])\n\nchanged = text[:6] + 'K' + text[7:]\nprint(text)\nprint(changed)\nprint(len(text), len(changed))",
          walkthrough: [
            { lines: "1", explanation: "원본 str을 준비합니다." },
            { lines: "3", explanation: "0,2,4,6,8,10 위치를 선택해 HloPto를 만듭니다." },
            { lines: "4", explanation: "생략 경계와 -1 step으로 전체 순서를 뒤집습니다." },
            { lines: "5", explanation: "인덱스 10부터 6까지 역방향으로 선택하고 stop 5는 제외해 nohty를 만듭니다." },
            { lines: "7", explanation: "P가 있는 인덱스 6 앞부분, 새 K, 인덱스 7 이후를 연결해 새 str을 만듭니다." },
            { lines: "8-10", explanation: "원본은 그대로이고 changed만 Hello Kython입니다. 두 문자열 길이는 모두 12입니다." },
          ],
          run: { environment: ["Python 3.11 이상", "slice_steps.py를 저장"], command: "python slice_steps.py" },
          output: { value: "HloPto\nnohtyP olleH\nnohty\nHello Python\nHello Kython\n12 12", explanation: ["역순 결과에는 공백도 원래 위치 관계에 따라 포함됩니다.", "슬라이스와 +는 새 문자열을 구성하며 text의 문자를 직접 바꾸지 않습니다.", "문자 하나를 같은 길이 하나로 교체해 전체 길이는 유지됩니다."] },
          experiments: [
            { change: "text[::2]를 text[1::2]로 바꿉니다.", prediction: "1,3,5,7,9,11 위치가 선택됩니다.", result: "el yhn이 출력되며 공백도 하나의 선택 요소임을 확인합니다." },
            { change: "text[::0]을 실행합니다.", prediction: "0 간격은 허용되지 않아 ValueError가 납니다.", result: "ValueError: slice step cannot be zero가 발생합니다." },
          ],
          sourceRefs: ["py-string-index-code", "py-day02-note"],
        },
      ],
      diagnostics: [
        { symptom: "ValueError: slice step cannot be zero가 발생한다.", likelyCause: "slice의 세 번째 값이 0이거나 계산 결과가 0입니다.", checks: ["슬라이스에 전달한 step 값을 repr로 확인합니다.", "사용자 입력이나 나눗셈 결과로 step이 만들어졌는지 추적합니다.", "원하는 방향과 간격을 양수 또는 음수 정수로 표현합니다."], fix: "step=0을 입력 검증에서 거부하고 목적에 맞는 1, -1 또는 다른 0이 아닌 값을 사용합니다.", prevention: "동적 step에는 0, 1, -1과 큰 절댓값 경계 테스트를 둡니다." },
      ],
    },
    {
      id: "immutability-rebinding",
      title: "문자열 요소는 바꿀 수 없고 새 값을 재바인딩합니다",
      lead: "text[6] = 'K'는 TypeError입니다. 문자열을 변경한 것처럼 보이는 연산도 실제로는 새 str을 만들고 이름을 다시 연결합니다.",
      explanations: [
        "str은 immutable이므로 인덱스 대입, append, del text[0] 같은 요소 수준 변경을 지원하지 않습니다. 불변 객체는 여러 코드가 같은 값을 참조해도 누군가 내부 문자를 몰래 바꾸지 못한다는 안정성과 hash key 사용 가능성을 제공합니다.",
        "text = 'Hello' 다음 text = text + ' Python'은 text 객체를 수정하는 것이 아닙니다. 오른쪽 연결이 새 문자열을 만들고 text 이름이 새 객체를 가리킵니다. 이전 객체를 다른 이름이 가리키면 그대로 남습니다. 이 차이는 반복문에서 매우 많은 문자열을 +로 연결할 때 성능에도 영향을 줍니다.",
        "문자 여러 개를 조립할 때는 조각을 list에 모아 ''.join(parts)를 사용하는 것이 의도를 잘 나타내고 반복 복사를 줄일 수 있습니다. 한두 조각의 간단한 연결에는 +도 충분하므로 실제 크기와 가독성을 기준으로 선택합니다.",
      ],
      concepts: [
        { term: "불변성(immutability)", definition: "객체가 만들어진 뒤 그 객체 내부 상태를 바꿀 수 없는 성질입니다.", detail: ["문자열 연산은 원본을 수정하지 않고 새 str을 반환합니다.", "이름 재바인딩은 가능하므로 코드에서 값이 달라져 보일 수 있습니다."], analogy: "인쇄된 책의 글자를 고치는 대신 수정된 새 판을 만들고 책장 라벨이 새 판을 가리키게 하는 것과 비슷합니다." },
        { term: "재바인딩", definition: "기존 이름이 다른 객체를 가리키도록 연결을 바꾸는 일입니다.", detail: ["객체 자체 변경과 구분해야 공유 참조를 정확히 이해할 수 있습니다.", "str에서는 대부분의 ‘변경’ 코드가 새 값 반환과 재바인딩으로 구현됩니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "TypeError: 'str' object does not support item assignment가 발생한다.", likelyCause: "text[index] = value로 불변 문자열의 요소를 직접 수정하려 했습니다.", checks: ["type(text)가 str인지 확인합니다.", "바꾸려는 위치와 대체할 문자열 길이 정책을 확인합니다.", "원본 보존이 필요한지 새 값 이름이 필요한지 정합니다."], fix: "슬라이스 연결, replace 또는 문자 list 변환 후 join으로 새 문자열을 만들고 새 이름에 받습니다.", prevention: "문자열 API가 새 값을 반환한다는 규칙을 기억하고 반환값을 버리지 않는 테스트를 둡니다." },
      ],
      expertNotes: ["CPython이 일부 문자열 표현을 재사용하더라도 불변성의 의미는 객체 id 최적화가 아니라 관찰 가능한 변경 불가능 계약입니다.", "루프에서 거대한 문자열을 반복 연결할 때는 성능과 메모리를 측정하고 list+join 또는 io.StringIO를 고려합니다."],
    },
    {
      id: "boundaries-and-parsing",
      title: "고정 위치 파싱은 입력 계약이 있을 때만 안전합니다",
      lead: "date[:4]처럼 위치로 데이터를 나누는 코드는 빠르고 간단하지만 길이와 형식이 보장되지 않으면 조용히 잘못된 값을 만들 수 있습니다.",
      explanations: [
        "'2026-07-11'에서 year=text[:4], month=text[5:7], day=text[8:10]은 명확합니다. 그러나 '26-7-11'도 슬라이스는 오류 없이 짧거나 엉뚱한 문자열을 반환합니다. 먼저 길이·구분자·숫자 여부를 검증하거나 datetime.strptime 같은 전용 파서를 사용해야 합니다.",
        "파일 확장자를 path[-3:]로 읽으면 .jpeg, 대문자, 확장자 없는 파일을 놓칩니다. pathlib.Path.suffix 같은 도메인 API를 사용하면 운영체제 경로 규칙과 복수 suffix를 더 명확하게 다룰 수 있습니다. 슬라이스는 데이터 계약이 단순하고 고정일 때 사용합니다.",
        "마스킹에서 phone[-4:]로 마지막 네 글자를 보이는 것도 입력 정규화 뒤에 해야 합니다. 하이픈과 공백이 남으면 잘못된 글자를 노출할 수 있고 짧은 값은 전체가 드러날 수 있습니다. 최소 길이와 공개 정책을 검증합니다.",
      ],
      concepts: [
        { term: "입력 계약", definition: "입력의 길이·문자 종류·구분자·허용 실패를 명시한 규칙입니다.", detail: ["슬라이스 전에 계약을 검증하면 빈 문자열로 조용히 실패하는 일을 줄입니다.", "날짜·경로·URL처럼 전용 파서가 있는 도메인은 검증된 API를 우선합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "고정 위치 슬라이스와 전용 파서 중 무엇을 선택할까요?", options: [
          { name: "슬라이스", chooseWhen: "길이와 위치가 엄격히 고정되고 사전에 검증된 식별자·프로토콜 필드일 때", avoidWhen: "날짜·경로·URL처럼 변형과 예외가 많은 데이터일 때", tradeoffs: ["간단하고 빠릅니다.", "형식 변화에 취약합니다.", "범위 보정이 오류를 숨길 수 있습니다."] },
          { name: "전용 파서", chooseWhen: "유효성 검사, 다양한 형식, 의미 있는 오류가 필요할 때", avoidWhen: "고정 폭 한 필드를 읽는 데 과도한 의존성이 될 때", tradeoffs: ["도메인 규칙을 재사용합니다.", "오류 메시지와 타입 결과가 명확합니다.", "지원 형식과 버전을 확인해야 합니다."] },
        ] },
      ],
    },
    {
      id: "unicode-and-performance",
      title: "인덱스 한 칸이 항상 사용자가 보는 한 글자는 아닙니다",
      lead: "Python str 인덱싱은 Unicode 코드 포인트 단위로 동작하지만 결합 문자와 이모지 시퀀스는 여러 코드 포인트가 화면의 한 글자처럼 보일 수 있습니다.",
      explanations: [
        "한글 완성형 '가'는 보통 한 코드 포인트이지만 'ᄀ'과 'ᅡ'의 결합 표현은 두 코드 포인트가 한 음절처럼 렌더링될 수 있습니다. 악센트 결합 문자와 피부색·가족 이모지도 마찬가지입니다. len과 슬라이스가 사용자가 기대하는 시각 글자 수와 다를 수 있습니다.",
        "Unicode 정규화는 겉보기 같은 문자열을 비교·검색할 때 필요할 수 있습니다. unicodedata.normalize로 NFC·NFD 정책을 정할 수 있지만 무조건 정규화하면 의미가 달라지는 도메인도 있으므로 입력 계약에서 결정합니다.",
        "사용자 표시 단위인 grapheme cluster를 안전하게 자르려면 표준 re만으로 충분하지 않을 수 있고 Unicode grapheme을 지원하는 라이브러리나 UI 계층을 사용합니다. 바이트 길이 제한이 있는 데이터베이스·네트워크에서는 text.encode('utf-8')의 길이도 별도로 확인합니다.",
      ],
      concepts: [
        { term: "Unicode 코드 포인트", definition: "Unicode가 문자 요소에 부여한 정수 식별 단위이며 Python str 인덱싱의 기본 단위입니다.", detail: ["UTF-8 바이트 수와 코드 포인트 수는 다릅니다.", "여러 코드 포인트가 하나의 사용자 인식 글자처럼 렌더링될 수 있습니다."] },
        { term: "grapheme cluster", definition: "사용자가 화면에서 하나의 글자로 인식하는 Unicode 코드 포인트 묶음입니다.", detail: ["결합 악센트와 일부 이모지는 여러 코드 포인트로 구성됩니다.", "정확한 UI 글자 수 제한은 grapheme 지원 도구가 필요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "이모지나 악센트 문자를 슬라이스했더니 깨진 조각처럼 보인다.", likelyCause: "코드 포인트 경계로 잘라 하나의 grapheme cluster를 구성하는 결합 시퀀스를 분리했습니다.", checks: ["문자열의 repr과 [hex(ord(ch)) for ch in text]를 확인합니다.", "len(text)와 화면에서 보이는 글자 수를 비교합니다.", "요구사항이 코드 포인트, 바이트, 사용자 인식 글자 중 어느 단위인지 정합니다."], fix: "UI 글자 단위가 필요하면 grapheme cluster를 지원하는 라이브러리로 분할하고, 저장 한도면 UTF-8 바이트 길이를 별도 검사합니다.", prevention: "한글 조합형·결합 악센트·가족 이모지·피부색 이모지를 국제화 테스트에 포함합니다." },
      ],
      expertNotes: ["민감정보 마스킹도 Unicode와 정규화 우회를 고려해야 합니다. 시각적으로 비슷한 문자와 제어 문자를 로그·식별자 정책에서 검토합니다.", "문자열 슬라이스는 선택 길이에 비례해 새 문자열 데이터를 만들 수 있습니다. 거대한 텍스트의 반복 슬라이스는 메모리 프로파일링 후 스트리밍·인덱스 범위 전달을 고려합니다."],
    },
  ],
  lab: {
    title: "고정 형식 학습 코드 파서와 마스커",
    scenario: "PY-2026-00042 같은 학습 기록 코드를 검증하고 언어·연도·일련번호를 슬라이스로 추출한 뒤 공개 화면에서는 일부를 마스킹합니다.",
    setup: ["slice_parser.py를 만듭니다.", "정상 값 'PY-2026-00042'와 실패 값 4개를 준비합니다.", "Python 3.11 이상에서 실행합니다."],
    steps: ["len이 13이고 인덱스 2·7이 하이픈인지 먼저 검사합니다.", "language=text[:2], year=text[3:7], serial=text[8:]로 추출합니다.", "year와 serial의 isdigit 결과를 검사하고 실패 이유를 구분합니다.", "공개 값은 앞 2글자와 마지막 2글자만 남기고 중간을 *로 조립합니다.", "짧은 입력·구분자 오류·문자 일련번호·Unicode 유사 하이픈을 실행합니다.", "각 결과의 repr과 길이를 기록합니다."],
    expectedResult: ["정상 입력에서 PY, 2026, 00042가 추출됩니다.", "잘못된 입력은 빈 슬라이스로 조용히 통과하지 않고 구체적인 검증 실패가 됩니다.", "마스킹은 입력 최소 길이를 통과한 값에만 적용됩니다."],
    cleanup: ["실제 개인 식별자 대신 합성 학습 코드만 사용합니다."],
    extensions: ["언어 코드 허용 목록을 추가합니다.", "슬라이스 파서와 정규식·dataclass 파서를 비교합니다.", "마스킹 대상에 결합 문자와 이모지를 넣고 단위 한계를 기록합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "'Developer'의 모든 양수·음수 인덱스를 표로 출력하세요.", requirements: ["각 문자에 양수 인덱스와 대응 음수 인덱스를 표시합니다.", "첫·마지막·범위 밖 위치를 확인합니다.", "Python에는 char 타입이 없음을 type으로 증명합니다."], hints: ["음수 대응은 index-len(text)입니다.", "범위 밖 오류는 마지막에 별도로 재현합니다."], expectedOutcome: "같은 위치를 양쪽 인덱스로 찾고 유효 범위를 설명할 수 있습니다.", solutionOutline: ["len을 구합니다.", "처음에는 반복문 없이 대표 세 위치만 작성해도 됩니다.", "한 문자 결과의 type과 len을 확인합니다."] },
    { difficulty: "응용", prompt: "날짜 문자열을 슬라이스로 파싱하고 검증하세요.", requirements: ["YYYY-MM-DD 길이와 구분자를 검사합니다.", "연·월·일을 추출하고 숫자 여부를 봅니다.", "2026-2-3, 빈 문자열, 잘못된 구분자를 실패시킵니다.", "datetime 파서와 책임 차이를 설명합니다."], hints: ["슬라이스 전에 전체 형식 검증을 합니다.", "월별 날짜 유효성은 슬라이스만으로 충분하지 않습니다."], expectedOutcome: "문자 위치 추출과 도메인 날짜 검증을 구분한 코드가 됩니다." },
    { difficulty: "설계", prompt: "닉네임 길이 제한과 미리보기 정책을 국제화 관점에서 설계하세요.", requirements: ["코드 포인트·UTF-8 바이트·grapheme 중 제한 단위를 선택합니다.", "긴 값의 앞·뒤 미리보기를 정의합니다.", "한글·결합 악센트·가족 이모지 테스트를 포함합니다.", "단순 슬라이스가 실패하는 사례와 사용할 도구를 문서화합니다."], hints: ["len(text), len(text.encode('utf-8'))가 다를 수 있습니다.", "UI 글자 단위는 별도 grapheme 지원이 필요합니다."], expectedOutcome: "‘10글자’라는 모호한 요구를 검증 가능한 단위와 실패 정책으로 바꾼 설계가 완성됩니다." },
  ],
  reviewQuestions: [
    { question: "길이 12 문자열의 유효한 양수·음수 인덱스 범위는 무엇인가요?", answer: "양수는 0부터 11, 음수는 -12부터 -1입니다. 12와 -13은 범위 밖입니다." },
    { question: "text[1:3]이 두 글자인 이유는 무엇인가요?", answer: "start 1은 포함하고 stop 3은 제외해 인덱스 1과 2만 선택하기 때문입니다." },
    { question: "text[100]과 text[:100]은 범위 밖에서 어떻게 다른가요?", answer: "단일 인덱싱은 IndexError, 슬라이싱은 가능한 끝 경계로 보정되어 전체 또는 일부 문자열을 반환합니다." },
    { question: "text[3:1]이 빈 문자열인데 text[3:1:-1]은 값이 나오는 이유는 무엇인가요?", answer: "기본 +1 step은 start 3에서 작은 stop 방향으로 갈 수 없지만 -1 step은 역방향으로 이동하기 때문입니다." },
    { question: "text[0] = 'A'가 실패하는 이유는 무엇인가요?", answer: "str 객체는 불변이라 요소 대입을 지원하지 않습니다. 새 문자열을 만들어 이름을 재바인딩해야 합니다." },
    { question: "len(text)가 화면 글자 수와 다를 수 있는 이유는 무엇인가요?", answer: "Python len은 Unicode 코드 포인트 수를 세지만 여러 코드 포인트가 한 grapheme cluster로 렌더링될 수 있기 때문입니다." },
  ],
  completionChecklist: [
    "0부터 len-1과 -len부터 -1까지 인덱스 범위를 계산할 수 있다.",
    "반열린 슬라이스의 start·stop 포함 규칙을 설명할 수 있다.",
    "start·stop 생략과 양수·음수 step 결과를 예측할 수 있다.",
    "인덱싱·슬라이싱·step=0의 서로 다른 오류 동작을 진단할 수 있다.",
    "불변 문자열 변경을 새 값 조립과 재바인딩으로 구현할 수 있다.",
    "고정 위치 파싱 전 입력 계약을 검증하고 Unicode 글자 단위 한계를 설명할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-string-index-code", repository: "PYTHON-BASIC", path: "day02/ex02_string.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day02/ex02_string.py", usedFor: ["양수·음수 인덱스", "반열린 슬라이스", "빈 역방향 범위", "불변성"], evidence: "Python 3.13.9에서 직접 실행해 P, o, el, 두 빈 줄, th, Hello와 Python 출력 순서를 확인했습니다." },
    { id: "py-day02-note", repository: "PYTHON-BASIC", path: "notes/day02_string_list_tuple.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day02_string_list_tuple.md", usedFor: ["인덱싱 표", "슬라이싱 요약", "불변성", "셀프 체크"], evidence: "원본 노트의 범위 규칙을 기준으로 step·경계 검증·Unicode 한계를 별도 전문가 설명으로 보강했습니다." },
  ],
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["문자열 메서드는 py-009 세션으로 분리합니다.", "grapheme cluster와 대용량 문자열 성능은 원본 공백을 전문가 관점으로 명시해 보강했습니다."] },
} satisfies DetailedSession;

export default session;
