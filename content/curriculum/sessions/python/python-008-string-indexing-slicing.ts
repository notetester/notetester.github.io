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
          code: "text = 'Hello Python'\n\nprint(text[::2])\nprint(text[::-1])\nprint(text[11:6:-1])\n\nchanged = text[:6] + 'K' + text[7:]\nprint(text)\nprint(changed)\nprint(len(text), len(changed))",
          walkthrough: [
            { lines: "1", explanation: "원본 str을 준비합니다." },
            { lines: "3", explanation: "0,2,4,6,8,10 위치를 선택해 HloPto를 만듭니다." },
            { lines: "4", explanation: "생략 경계와 -1 step으로 전체 순서를 뒤집습니다." },
            { lines: "5", explanation: "인덱스 11부터 7까지 역방향으로 선택하고 stop 6은 제외해 nohty를 만듭니다." },
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

const advancedChapters: DetailedSession["chapters"] = [
  {
    id: "slice-objects-normalized-bounds",
    title: "슬라이스 표기를 slice 객체와 정규화된 index 범위로 해석합니다",
    lead: "`text[start:stop:step]`는 세 숫자를 대충 보정하는 문법이 아니라 slice 객체가 sequence 길이에 맞춰 경계를 정규화하고 range와 같은 위치 집합을 선택하는 연산입니다.",
    explanations: [
      "대괄호 안의 colon 표기는 내부적으로 start·stop·step을 가진 slice 객체로 표현할 수 있습니다. `text[1:7:2]`와 `text[slice(1, 7, 2)]`는 같은 위치를 고릅니다. slice를 이름에 담으면 설정·API·반복 처리에서 재사용할 수 있고 repr로 계약을 기록할 수 있습니다.",
      "start와 stop의 None은 단순히 0과 len이라는 뜻이 아닙니다. 양수 step에서는 앞과 뒤 경계를 향하지만 음수 step에서는 기본 start가 마지막 유효 위치, 기본 stop은 첫 위치 앞의 sentinel이 됩니다. 그래서 `[::-1]`은 전체 역순이고 `slice(None, None, -1).indices(8)`은 `(7, -1, -1)`입니다.",
      "`slice.indices(length)`는 음수·생략·범위 밖 값을 주어진 길이에 맞는 `(start, stop, step)`으로 정규화합니다. 그 tuple을 `range`에 넣으면 실제 선택될 index를 볼 수 있어 복잡한 역방향·큰 경계를 디버깅하기 좋습니다.",
      "슬라이스 stop은 언제나 선택에서 제외됩니다. 양수 step에서는 start보다 작은 stop이면 빈 결과이고, 음수 step에서는 start보다 큰 stop이면 빈 결과입니다. ‘방향에 맞춰 stop에 도달하기 전까지’라는 range 관점으로 보면 암기할 예외가 줄어듭니다.",
      "범위 밖 단일 인덱스는 IndexError지만 슬라이스 경계는 가능한 범위로 clamp됩니다. 이 관대한 동작은 preview에는 편리하지만 고정 형식 parser에서는 잘못된 짧은 입력을 조용히 부분값으로 만들 수 있습니다. 먼저 전체 길이와 구분자 계약을 검사합니다.",
      "step=0은 이동할 수 없어 slice 객체 생성 자체가 아니라 실제 적용 또는 indices 호출 때 ValueError를 냅니다. 외부 설정으로 step을 받는 API는 integer 변환, 0 금지, 방향 허용 범위와 최대 표본 수를 적용 전에 검사합니다.",
      "custom object는 `__getitem__`에서 int 또는 slice를 받을 수 있습니다. 구현자는 slice.indices로 경계를 정규화할 수 있지만, built-in str와 같은 의미를 제공할지 view를 반환할지 새 객체를 반환할지는 타입의 계약입니다. 모든 slicing이 str과 같은 복사 비용이라고 일반화하지 않습니다.",
    ],
    concepts: [
      { term: "slice object", definition: "start·stop·step을 보관해 sequence 선택 규칙을 표현하는 내장 객체입니다.", detail: ["대괄호 colon 표기와 함께 사용할 수 있습니다.", "indices(length)로 경계를 정규화합니다."] },
      { term: "normalized bounds", definition: "생략·음수·범위 밖 경계를 특정 sequence 길이에 맞춰 실제 순회 가능한 start·stop·step으로 바꾼 값입니다.", detail: ["step 부호에 따라 기본값이 다릅니다.", "range에 넣어 위치를 검산할 수 있습니다."] },
      { term: "clamping", definition: "슬라이스의 과도한 경계를 가능한 sequence 경계로 제한하는 동작입니다.", detail: ["단일 index의 IndexError와 다릅니다.", "입력 검증을 대신하지 않습니다."] },
    ],
    codeExamples: [{
      id: "python-slice-indices-trace",
      title: "과도한 경계와 전체 역순을 정규화해 실제 index를 출력합니다",
      language: "python",
      filename: "slice_indices.py",
      purpose: "slice.indices 결과와 range index 목록이 실제 문자열 결과와 일치함을 exact output으로 검증합니다.",
      code: "text = 'abcdefgh'\n\nspec = slice(-100, 100, 2)\nstart, stop, step = spec.indices(len(text))\nprint(f'normalized={start},{stop},{step}|value={text[spec]}')\n\nreverse = slice(None, None, -1)\nrstart, rstop, rstep = reverse.indices(len(text))\nprint(f'reverse={rstart},{rstop},{rstep}|value={text[reverse]}')\nprint(f'indices={list(range(rstart, rstop, rstep))}')",
      walkthrough: [
        { lines: "1-5", explanation: "-100과100을 길이8에 맞춰0과8로 clamp하고 짝수 위치 문자를 선택합니다." },
        { lines: "7-9", explanation: "음수 step의 생략 경계가 마지막 index7과 sentinel -1로 정규화됩니다." },
        { lines: "10", explanation: "range에 같은 tuple을 넣어 실제 방문 index를 눈으로 검산합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 내장 slice·range"], command: "python slice_indices.py" },
      output: { value: "normalized=0,8,2|value=aceg\nreverse=7,-1,-1|value=hgfedcba\nindices=[7, 6, 5, 4, 3, 2, 1, 0]", explanation: ["큰 경계는0과8로 정규화됩니다.", "음수 step의 stop -1은 실제 index -1을 포함한다는 뜻이 아니라 첫 위치 앞 sentinel입니다."] },
      experiments: [
        { change: "spec을 slice(6, 1, -2)로 바꿉니다.", prediction: "index6,4,2의 g,e,c를 선택합니다.", result: "stop1은 제외됩니다." },
        { change: "slice(1, 6, 0).indices(8)을 호출합니다.", prediction: "ValueError가 발생합니다.", result: "0 step 검증 위치를 확인합니다." },
        { change: "같은 spec을 길이3 문자열에 적용합니다.", prediction: "normalized stop과 결과가 새 길이에 맞게 바뀝니다.", result: "slice object는 절대 index 목록이 아니라 길이 의존 규칙입니다." },
      ],
      sourceRefs: ["python-slicing-expression-008", "python-builtins-slice-008", "python-sequence-operations-008"],
    }],
    diagnostics: [
      { symptom: "`[::-1]`의 stop이 왜 -1인데 마지막 문자가 빠지지 않는지 혼란스럽습니다.", likelyCause: "정규화 tuple의 -1 sentinel을 일반 음수 index -1과 같은 선택 위치로 읽었습니다.", checks: ["slice(None,None,-1).indices(len(text))를 출력합니다.", "range 결과 index를 확인합니다.", "명시적 `[:-1:-1]`과 생략 stop을 비교합니다."], fix: "음수 step의 생략 stop은 첫 원소 앞 sentinel이라는 range 관점으로 추적합니다.", prevention: "정·역방향 표본을 slice.indices와 index 목록으로 함께 테스트합니다." },
      { symptom: "짧은 고정 형식 입력이 오류 없이 일부 필드로 파싱됩니다.", likelyCause: "슬라이스가 범위 밖 stop을 clamp한다는 동작을 형식 검증으로 오해했습니다.", checks: ["원본 len과 delimiter 위치를 먼저 출력합니다.", "각 slice가 빈 문자열인지 확인합니다.", "정상 입력 계약과 최소 길이를 적습니다."], fix: "슬라이스 전에 전체 길이·구분자·문자 종류를 검증하고 실패 이유를 명시적으로 반환합니다.", prevention: "빈 값·한 글자 부족·delimiter 오류·과도한 길이를 parser test에 둡니다." },
    ],
  },
  {
    id: "unicode-codepoint-grapheme-byte-windows",
    title: "코드 포인트 slice와 grapheme·UTF-8 byte 제한을 서로 다른 단위로 설계합니다",
    lead: "Python str의 index 한 칸은 Unicode code point 하나이며, 사용자가 보는 글자와 저장소가 세는 byte는 별도의 경계이므로 ‘10글자’ 요구를 단위 없는 숫자로 구현하면 안 됩니다.",
    explanations: [
      "Python의 len(str)과 index·slice는 Unicode code point sequence를 기준으로 합니다. UTF-8은 한 code point를 1~4 bytes로 encode할 수 있으므로 `len(text)`와 `len(text.encode('utf-8'))`는 다릅니다. DB column·메시지 queue·protocol이 byte 상한을 말한다면 bytes 기준을 별도로 검사합니다.",
      "`é`는 U+00E9 한 code point 또는 U+0065 뒤 U+0301 결합 부호 두 code points로 표현될 수 있습니다. 후자를 `[:1]`로 자르면 e와 accent가 분리됩니다. NFC로 canonical representation을 통일하면 이 사례의 code point 수는 줄지만 모든 사용자 인식 글자 문제를 해결하지는 않습니다.",
      "가족 이모지는 여러 emoji와 zero-width joiner가 하나처럼 보이고 국기 emoji는 regional indicators 두 개로 구성됩니다. skin tone modifier와 variation selector도 slice 중간에서 분리될 수 있습니다. 사용자 인터페이스의 ‘한 글자’는 Unicode grapheme cluster segmentation을 지원하는 라이브러리나 플랫폼 API로 처리합니다.",
      "정규화와 grapheme segmentation은 책임이 다릅니다. normalization은 canonical/compatibility representation을 다루고 segmentation은 표시상 문자 경계를 찾습니다. 먼저 보존·비교 정책을 정규화에 적용하고, 그 결과를 사용자 표시 단위로 segment할지 결정합니다.",
      "byte 상한에 맞추려고 UTF-8 bytes를 임의 위치에서 `[:limit]`로 자른 뒤 decode하면 multi-byte sequence 중간을 끊어 UnicodeDecodeError가 날 수 있습니다. text를 code point 또는 grapheme 단위로 점진적으로 추가하면서 encode 길이를 확인하거나, 프로토콜이 정한 안전한 truncation API를 사용합니다.",
      "보안에서는 시각적으로 보이는 suffix 몇 글자 마스킹만으로 충분하지 않을 수 있습니다. combining mark·RTL control·zero-width character가 표시를 교란할 수 있고, 너무 짧은 식별자는 앞뒤 공개만으로 거의 전체가 드러납니다. 마스킹 전에 입력 단위와 최소 숨김량, 로그 제어 문자 정책을 정합니다.",
      "국제화 테스트는 `가`, `e\\u0301`, NFC `é`, 가족 이모지, 국기, CJK 확장 문자와 ASCII를 함께 사용합니다. code point 목록, grapheme 예상 수, UTF-8 byte 수를 각각 기록하면 요구사항이 어느 단위에서 실패했는지 찾기 쉽습니다.",
    ],
    concepts: [
      { term: "code point window", definition: "Python str의 start·stop이 선택하는 Unicode code point 구간입니다.", detail: ["UTF-8 byte window와 다릅니다.", "grapheme cluster를 분리할 수 있습니다."] },
      { term: "grapheme boundary", definition: "사용자가 하나의 표시 문자로 인식하는 code point 묶음 사이의 경계입니다.", detail: ["표준 str slicing은 인식하지 않습니다.", "UI 길이 제한에 중요합니다."] },
      { term: "byte budget", definition: "인코딩 뒤 허용되는 최대 bytes 수입니다.", detail: ["codec을 함께 명시해야 합니다.", "multi-byte sequence 중간을 자르지 않습니다."] },
    ],
    codeExamples: [{
      id: "python-unicode-slice-units",
      title: "결합 악센트의 raw·NFC code point window와 UTF-8 길이를 비교합니다",
      language: "python",
      filename: "unicode_slice_units.py",
      purpose: "겉보기 문자열을 code point 단위로 자른 결과와 normalization 뒤 결과, byte 길이를 ASCII 표기로 확인합니다.",
      code: "import unicodedata\n\ndef points(value):\n    return ','.join(f'U+{ord(char):04X}' for char in value)\n\ntext = 'e\\u0301X'\nnfc = unicodedata.normalize('NFC', text)\nprint(f'raw_len={len(text)}|head={points(text[:1])}|tail={points(text[1:])}')\nprint(f'nfc_len={len(nfc)}|head={points(nfc[:1])}|tail={points(nfc[1:])}')\nprint(f'utf8_bytes={len(text.encode(\"utf-8\"))},{len(nfc.encode(\"utf-8\"))}|same_nfc={unicodedata.normalize(\"NFC\", text) == nfc}')",
      walkthrough: [
        { lines: "1-4", explanation: "보이지 않는 결합 부호를 U+ code point 목록으로 바꾸는 진단 helper를 만듭니다." },
        { lines: "6-7", explanation: "분해형 e+accent+X와 NFC é+X를 준비합니다." },
        { lines: "8-10", explanation: "각 첫 slice와 tail, code point 수, UTF-8 byte 수를 분리해 출력합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "표준 라이브러리 unicodedata"], command: "python unicode_slice_units.py" },
      output: { value: "raw_len=3|head=U+0065|tail=U+0301,U+0058\nnfc_len=2|head=U+00E9|tail=U+0058\nutf8_bytes=4,3|same_nfc=True", explanation: ["raw [:1]은 accent를 tail에 남깁니다.", "NFC 뒤 첫 code point는 U+00E9입니다.", "겉보기는 같아도 UTF-8 bytes 수가 다릅니다."] },
      experiments: [
        { change: "text를 가족 이모지+X로 바꿉니다.", prediction: "NFC를 적용해도 여러 code point이며 [:1]은 전체 가족 grapheme이 아닙니다.", result: "normalization과 segmentation 차이를 확인합니다." },
        { change: "UTF-8 bytes를2 bytes에서 자르고 strict decode합니다.", prediction: "문자 경계를 끊으면 UnicodeDecodeError가 날 수 있습니다.", result: "byte budget용 안전한 truncation이 필요합니다." },
        { change: "ASCII 'eX'와 byte 수를 비교합니다.", prediction: "code point 수2와 byte 수2가 같아 ASCII만으로는 문제가 숨습니다.", result: "다국어 fixture 필요성을 확인합니다." },
      ],
      sourceRefs: ["python-unicode-howto-008", "python-unicodedata-008", "python-str-encode-008"],
    }],
    diagnostics: [
      { symptom: "닉네임을 한 글자만 잘랐는데 악센트나 이모지가 깨져 보입니다.", likelyCause: "code point slice를 grapheme cluster slice로 사용했습니다.", checks: ["각 code point를 U+ 표기로 봅니다.", "결합 부호·ZWJ·modifier 존재를 확인합니다.", "요구 단위가 UI 글자인지 묻습니다."], fix: "사용자 인식 글자 제한에는 Unicode grapheme segmentation을 지원하는 도구를 사용하고 normalization 정책을 별도로 적용합니다.", prevention: "결합 문자·ZWJ emoji·국기·skin tone fixture를 UI test에 포함합니다." },
      { symptom: "byte 제한에 맞춘 문자열을 decode할 때 오류가 납니다.", likelyCause: "UTF-8 multi-byte sequence 중간에서 bytes를 잘랐습니다.", checks: ["잘린 bytes의 hex와 마지막 lead/continuation byte를 봅니다.", "원본 codec과 byte limit을 확인합니다.", "text/code point 기준 대안을 비교합니다."], fix: "완전한 문자 또는 grapheme 단위로 추가하면서 encode 길이를 계산해 limit 이하에서 멈춥니다.", prevention: "byte limit-1·limit·limit+1과 1~4 byte code point를 함께 테스트합니다." },
    ],
  },
  {
    id: "slicing-allocation-parsing-redaction",
    title: "슬라이스 복사 비용·반복 조립·파싱과 마스킹 실패 정책을 함께 설계합니다",
    lead: "str 슬라이스는 편리하지만 새 문자열 값을 만들고, 반복적인 큰 구간 복사와 단순 위치 마스킹은 성능·정확성·개인정보 요구를 동시에 놓칠 수 있습니다.",
    explanations: [
      "built-in str은 immutable이므로 부분 슬라이스 결과는 독립적인 str 값으로 사용됩니다. 구현 최적화의 세부 identity에 의존하지 말고 선택 길이에 비례한 새 결과가 만들어질 수 있다고 계획합니다. 수 GB text에서 겹치는 큰 window를 수천 번 만들면 총 복사량과 메모리 peak가 커집니다.",
      "검색이나 parser가 원문을 계속 필요로 한다면 매 단계 substring을 만들기보다 `(start, stop)` index pair를 전달하고 최종 경계에서만 slice합니다. bytes protocol에는 memoryview가 복사 없는 view를 제공할 수 있지만 str의 Unicode code point view가 아니므로 codec 경계를 바꾸어 버리는 최적화는 신중해야 합니다.",
      "문자열을 반복문에서 `result += piece`로 계속 조립하면 매번 더 큰 중간 문자열이 생길 수 있습니다. 조각을 list에 모아 `''.join(parts)`하거나 `io.StringIO`를 쓰면 의도가 분명하고 대량 조립에 적합합니다. 작은 고정 조각 두세 개는 가독성을 우선합니다.",
      "고정 위치 parser는 slice 전에 전체 형식을 검증하고, variable format은 split·partition·정규식·전용 parser 중 계약에 맞는 도구를 선택합니다. `date[:4]`가 값을 반환했다는 사실은 월·일이나 달력 유효성을 보장하지 않으므로 datetime 같은 도메인 parser에 넘깁니다.",
      "앞뒤 일부만 남기는 마스킹은 화면 표시 정책이지 암호화나 익명화가 아닙니다. 너무 짧은 값은 전부 숨기고, keep 수를 검증하며, 원본을 로그에 함께 남기지 않습니다. 이메일·전화·카드 번호에는 단순 문자 위치보다 도메인별 최소 공개 규칙과 접근 통제가 필요합니다.",
      "negative keep, 비문자 입력, empty value, keep*2와 정확히 같은 길이, 매우 긴 입력은 별도 경계입니다. 함수가 code point 기준임을 이름·docstring에 밝히고 grapheme 기준 요구가 있으면 다른 API를 제공합니다.",
      "성능을 판단할 때는 exact 출력 예제에 wall-clock 숫자를 넣지 않습니다. `timeit`·profiler로 현실적인 크기와 반복을 측정하되 CI에서는 상대적 미세 시간보다 결과 정확성, 할당 상한, 최대 입력 완료 여부를 검증합니다.",
      "slice 결과를 cache하면 원문 전체를 key나 closure로 붙잡아 메모리가 오래 유지될 수도 있습니다. 데이터 수명, cache 크기, 개인정보 보존 기간을 함께 검토하고, 민감 원문을 성능 편의상 장기 cache하지 않습니다.",
    ],
    concepts: [
      { term: "allocation surface", definition: "슬라이스·연결·조립 과정에서 새 문자열과 중간 결과가 만들어지는 범위입니다.", detail: ["입력 크기와 반복 횟수에 따라 커집니다.", "profiler로 측정합니다."] },
      { term: "index span", definition: "원문을 복사하지 않고 start·stop 위치로 부분 범위를 가리키는 애플리케이션 수준 표현입니다.", detail: ["최종 소비 시점에 slice할 수 있습니다.", "원문 수명 관리가 필요합니다."] },
      { term: "display masking", definition: "민감값의 일부를 별표 등으로 가려 사용자 화면에 최소한만 보이는 표시 규칙입니다.", detail: ["익명화·암호화가 아닙니다.", "짧은 값과 Unicode 단위를 정의합니다."] },
    ],
    codeExamples: [{
      id: "python-validated-codepoint-mask",
      title: "짧은 값은 전부 숨기고 긴 값만 앞뒤 code point를 남깁니다",
      language: "python",
      filename: "validated_mask.py",
      purpose: "keep 경계와 immutable slice 조립을 명시해 과도한 정보 공개를 피하는 표시 함수를 만듭니다.",
      code: "def mask_codepoints(value, keep=2):\n    if not isinstance(value, str):\n        raise TypeError('value must be str')\n    if keep < 0:\n        raise ValueError('keep must be non-negative')\n    if len(value) <= keep * 2:\n        return '*' * len(value)\n    hidden = len(value) - keep * 2\n    return value[:keep] + '*' * hidden + value[-keep:]\n\nfor sample in ('ABCD', 'ABCDEFGHIJ', '가나다라마바사'):\n    print(f'{sample!r}|masked={mask_codepoints(sample)!r}|length={len(sample)}')",
      walkthrough: [
        { lines: "1-6", explanation: "str 타입과 음수 keep을 거부하고 공개 구간이 겹치는 짧은 값은 모두 숨깁니다." },
        { lines: "7-8", explanation: "긴 값에만 앞·뒤 slice와 정확한 수의 별표를 새 문자열로 조립합니다." },
        { lines: "10-11", explanation: "경계 길이·긴 ASCII·한글 code point 입력을 repr와 길이로 확인합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "code point 기준 표시 계약"], command: "python validated_mask.py" },
      output: { value: "'ABCD'|masked='****'|length=4\n'ABCDEFGHIJ'|masked='AB******IJ'|length=10\n'가나다라마바사'|masked='가나***바사'|length=7", explanation: ["길이4는 keep 양쪽이 겹쳐 전부 숨깁니다.", "한글 완성형은 각 음절이 한 code point라 양쪽 두 글자를 남깁니다.", "이 함수는 grapheme·익명화 계약이 아닙니다."] },
      experiments: [
        { change: "keep=0으로 실행합니다.", prediction: "모든 code point가 별표가 됩니다.", result: "0 경계를 허용하는 정책을 확인합니다." },
        { change: "keep=-1로 실행합니다.", prediction: "ValueError가 납니다.", result: "음수 slicing 의미가 보안 정책에 스며들지 않습니다." },
        { change: "결합 문자·가족 이모지를 입력합니다.", prediction: "code point 기준 별표와 남은 조각이 사용자 글자 경계를 보장하지 않습니다.", result: "grapheme 전용 API로 분리해야 합니다." },
      ],
      sourceRefs: ["python-sequence-operations-008", "python-data-model-getitem-008", "python-timeit-008"],
    }],
    diagnostics: [
      { symptom: "큰 텍스트 window 처리에서 메모리가 예상보다 급증합니다.", likelyCause: "겹치는 큰 str slice와 반복 연결로 많은 중간 문자열을 만들었습니다.", checks: ["입력 길이·window 크기·반복 수를 곱해 총 선택량을 추정합니다.", "profiler로 allocation과 peak를 측정합니다.", "substring 대신 index span 전달 가능성을 봅니다."], fix: "start/stop span을 유지하고 최종 경계에서만 slice하며 대량 조립은 join 또는 streaming writer로 바꿉니다.", prevention: "최대 현실 입력의 메모리·완료 시간 budget test를 둡니다." },
      { symptom: "마스킹했는데 짧은 식별자의 대부분이 노출됩니다.", likelyCause: "항상 앞뒤 keep 글자를 남겨 공개 구간이 겹치거나 최소 숨김량을 정하지 않았습니다.", checks: ["길이0부터2*keep+1까지 표를 만듭니다.", "도메인 최소 공개 요구를 확인합니다.", "원본이 다른 로그 필드에 남는지 검색합니다."], fix: "짧은 값은 전부 숨기고 도메인별 최소 숨김량·접근 권한·보존 정책을 적용합니다.", prevention: "짧은 경계표와 결과에 원본 금지 marker가 없는지 자동 검사합니다." },
    ],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...advancedChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "python-slicing-expression-008", repository: "Python Language Reference", path: "Slicings", publicUrl: "https://docs.python.org/3/reference/expressions.html#slicings", usedFor: ["slice grammar", "subscription dispatch", "start stop step"], evidence: "슬라이스 표현식이 slice item과 subscription으로 해석되는 공식 문법을 확인했습니다." },
  { id: "python-builtins-slice-008", repository: "Python Standard Library", path: "Built-in Functions — slice", publicUrl: "https://docs.python.org/3/library/functions.html#slice", usedFor: ["slice object", "slice.indices", "normalized bounds"], evidence: "slice constructor와 indices(length)의 공식 동작을 확인했습니다." },
  { id: "python-sequence-operations-008", repository: "Python Standard Library", path: "Common Sequence Operations", publicUrl: "https://docs.python.org/3/library/stdtypes.html#common-sequence-operations", usedFor: ["indexing", "slicing", "concatenation", "repetition", "immutable sequence notes"], evidence: "str을 포함한 공통 sequence 연산과 반복 연결 주의점을 공식 문서로 확인했습니다." },
  { id: "python-unicode-howto-008", repository: "Python Documentation", path: "Unicode HOWTO", publicUrl: "https://docs.python.org/3/howto/unicode.html", usedFor: ["code points", "encodings", "text versus bytes", "Unicode iteration"], evidence: "Python str의 Unicode code point 모델과 bytes 경계를 공식 HOWTO로 확인했습니다." },
  { id: "python-unicodedata-008", repository: "Python Standard Library", path: "unicodedata.normalize", publicUrl: "https://docs.python.org/3/library/unicodedata.html#unicodedata.normalize", usedFor: ["NFC", "combining sequences", "normalization boundary"], evidence: "결합 문자 예제의 NFC 변환을 공식 API로 확인했습니다." },
  { id: "python-str-encode-008", repository: "Python Standard Library", path: "str.encode", publicUrl: "https://docs.python.org/3/library/stdtypes.html#str.encode", usedFor: ["UTF-8 byte length", "byte budget", "encoding errors"], evidence: "str에서 bytes로 변환할 때의 encoding·errors 계약을 확인했습니다." },
  { id: "python-data-model-getitem-008", repository: "Python Language Reference", path: "object.__getitem__", publicUrl: "https://docs.python.org/3/reference/datamodel.html#object.__getitem__", usedFor: ["custom subscription", "int versus slice argument", "sequence protocol"], evidence: "사용자 정의 타입이 subscription과 slicing에 참여하는 공식 protocol을 확인했습니다." },
  { id: "python-timeit-008", repository: "Python Standard Library", path: "timeit — Measure execution time", publicUrl: "https://docs.python.org/3/library/timeit.html", usedFor: ["repeatable performance measurement", "setup separation", "benchmark caution"], evidence: "슬라이스·조립 성능을 환경 독립 출력에 섞지 않고 별도 측정하는 공식 도구를 확인했습니다." },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "`text[1:7:2]`와 `text[slice(1,7,2)]`는 어떤 관계인가요?", answer: "같은 slice 규칙을 전달해 같은 위치를 선택합니다." },
  { question: "slice.indices(length)는 무엇을 반환하나요?", answer: "생략·음수·범위 밖 경계를 해당 길이에 맞춘 start, stop, step tuple로 반환합니다." },
  { question: "음수 step에서 생략 stop의 -1은 마지막 index -1을 선택하나요?", answer: "아닙니다. 첫 원소 앞의 순회 sentinel로 사용되어 index0까지 포함할 수 있습니다." },
  { question: "슬라이스가 범위 밖에서 오류를 내지 않는 것이 parser 검증을 대신하나요?", answer: "아닙니다. 짧은 입력도 부분 문자열을 반환하므로 길이·구분자 계약을 먼저 검사합니다." },
  { question: "Python str의 한 index는 UTF-8 한 byte인가요?", answer: "아닙니다. Unicode code point 하나이며 UTF-8에서는 여러 bytes일 수 있습니다." },
  { question: "NFC를 적용하면 모든 이모지를 한 code point로 만들 수 있나요?", answer: "아닙니다. grapheme cluster와 normalization은 다른 문제이며 ZWJ emoji는 계속 여러 code points일 수 있습니다." },
  { question: "UTF-8 bytes를 limit에서 바로 잘라도 안전한가요?", answer: "아닙니다. multi-byte sequence 중간을 끊을 수 있어 완전한 문자 경계를 유지해야 합니다." },
  { question: "반복적인 문자열 조립에는 왜 join을 고려하나요?", answer: "immutable str 연결이 많은 중간 값을 만들 수 있어 조각을 모아 한 번 조립하는 방식이 의도와 비용을 줄일 수 있습니다." },
  { question: "앞뒤 두 글자 마스킹이 익명화를 보장하나요?", answer: "아닙니다. 표시 최소화일 뿐이며 짧은 값·Unicode·재식별·다른 로그 필드를 함께 고려해야 합니다." },
);

(session.completionChecklist as string[]).push(
  "slice 객체와 colon 표기의 대응을 설명한다.",
  "slice.indices로 정·역방향 경계를 정규화한다.",
  "range index 목록으로 실제 선택 위치를 검산한다.",
  "슬라이스 clamping과 parser 입력 검증을 구분한다.",
  "code point·grapheme·UTF-8 byte 단위를 분리한다.",
  "결합 문자와 NFC 전후 slice 결과를 U+ 표기로 비교했다.",
  "byte 제한에서 multi-byte sequence를 안전하게 보존한다.",
  "대량 slice·연결의 allocation surface를 측정하고 줄인다.",
  "마스킹의 짧은 값·음수 keep·Unicode 경계를 테스트한다.",
);
