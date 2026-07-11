import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-017"],
  slug: "python-017-structural-pattern-matching",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 17,
  title: "match/case 구조적 패턴 매칭",
  subtitle: "값 비교를 넘어 시퀀스·mapping·객체 구조를 분해하고 캡처하며, 가드와 case 순서로 명확한 분기를 만듭니다.",
  level: "중급",
  estimatedMinutes: 120,
  coreQuestion: "입력 값의 내용과 구조를 동시에 검사·분해해야 할 때 match/case를 어떻게 정확하고 안전하게 사용할까요?",
  summary: "Python 3.10+ 구조적 패턴 매칭의 literal·OR·wildcard, capture와 case 순서를 설명합니다. 좌표 시퀀스 분해와 guard를 재현하고 starred sequence, mapping, class pattern을 확장합니다. bare name capture 함정, 도달 불가능 case, 입력 schema 검증, if-elif와 dispatch table 선택 기준까지 다룹니다.",
  objectives: [
    "match가 단순 switch뿐 아니라 구조 검사·분해·이름 캡처를 수행한다는 점을 설명할 수 있다.",
    "literal·OR·wildcard 패턴과 위에서 첫 일치 case 선택 순서를 사용할 수 있다.",
    "시퀀스·mapping·class pattern에서 입력 구조와 캡처 이름을 추적할 수 있다.",
    "guard가 패턴 일치 뒤 추가 조건을 검사하는 순서를 설명할 수 있다.",
    "bare name이 상수 비교가 아니라 capture가 될 수 있는 함정을 피할 수 있다.",
    "if-elif, match, dict dispatch, 다형성 중 유지보수에 맞는 구조를 선택할 수 있다.",
  ],
  prerequisites: [
    { title: "if·elif·else와 조건 표현식", reason: "첫 참 분기와 case 순서를 기존 조건문과 비교합니다.", sessionSlug: "python-016-if-elif-else-conditional-expression" },
    { title: "튜플·패킹·언패킹", reason: "시퀀스 패턴이 구조를 분해하고 값을 이름에 바인딩하는 방식을 연결합니다.", sessionSlug: "python-012-tuple-packing-unpacking" },
  ],
  keywords: ["Python", "match", "case", "structural pattern matching", "capture pattern", "guard", "sequence pattern", "mapping pattern", "wildcard"],
  chapters: [
    {
      id: "matching-model",
      title: "match는 subject를 한 번 평가하고 case를 위에서 검사합니다",
      lead: "match subject:에서 subject 값을 얻은 뒤 각 case 패턴과 구조적으로 맞는지 순서대로 검사하고 첫 일치 블록 하나를 실행합니다.",
      explanations: [
        "match는 Python 3.10에 추가됐습니다. 실행 환경이 3.9 이하이면 코드를 실행하기 전에 SyntaxError입니다. 프로젝트 최소 버전과 CI matrix, pyproject 설정을 일치시킵니다.",
        "case 'A':는 literal 값 동등성, case '토'|'일':은 두 패턴 중 하나, case _:는 모든 나머지를 받는 wildcard입니다. elif 체인처럼 첫 일치에서 멈추므로 구체 패턴을 넓은 패턴보다 먼저 둡니다.",
        "단순 값 하나를 비교하는 모양은 다른 언어 switch와 비슷하지만 핵심은 구조입니다. case (0,y)는 길이 2 시퀀스이며 첫 값 0인 입력을 확인하고 두 번째 값을 y 이름에 캡처합니다.",
      ],
      concepts: [
        { term: "subject", definition: "match 뒤에 한 번 평가되어 각 case 패턴과 비교되는 대상 값입니다.", detail: ["함수 호출 subject는 한 번만 호출됩니다.", "패턴마다 subject 구조를 다시 생성하지 않습니다."] },
        { term: "구조적 패턴", definition: "값의 타입·길이·key·속성·내부 값 모양을 검사하면서 일부를 이름에 바인딩하는 규칙입니다.", detail: ["단순 bool 조건보다 분해 구조를 가까이 표현합니다.", "패턴 일치와 추가 계산은 guard로 분리할 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "match 문법 줄에서 SyntaxError가 발생한다.", likelyCause: "Python 3.10 미만 인터프리터로 실행하거나 콜론·들여쓰기·패턴 문법이 잘못됐습니다.", checks: ["python --version과 sys.executable을 확인합니다.", "match·case 줄 끝 콜론과 블록 들여쓰기를 봅니다.", "지원하지 않는 패턴 문법을 최소 예제로 줄입니다."], fix: "Python 3.10+ 환경을 사용하거나 하위 버전 지원이 필요하면 if-elif·dispatch로 구현합니다.", prevention: "최소 Python 버전을 프로젝트 설정·README·CI에 고정합니다." },
      ],
    },
    {
      id: "literal-or-wildcard-order",
      title: "literal·OR·wildcard는 좁은 패턴부터 배치합니다",
      lead: "case _는 모든 값과 일치하므로 마지막에 두며, 앞에 두면 뒤 case가 도달 불가능합니다.",
      explanations: [
        "grade A·B·C와 나머지 F 메시지는 literal case와 wildcard로 표현할 수 있습니다. 값이 고정된 작은 분류에서 if grade=='A' 반복보다 대상과 패턴이 가까이 보입니다.",
        "OR 패턴 case '토'|'일'은 같은 블록을 공유합니다. 각 대안이 이름을 캡처한다면 같은 이름 집합을 바인딩해야 합니다. 한쪽만 x를 만드는 OR 패턴은 뒤 블록의 이름 계약이 모호해 허용되지 않습니다.",
        "wildcard _는 값을 이름으로 보존하지 않습니다. case other:는 wildcard가 아니라 어떤 값이든 other에 캡처하는 패턴이므로 역시 모든 나머지를 받고 뒤 case를 가립니다.",
      ],
      concepts: [
        { term: "OR pattern", definition: "|로 여러 패턴 중 하나가 맞으면 같은 case를 실행하는 패턴입니다.", detail: ["논리 or 표현식이 아니라 pattern 문법입니다.", "모든 대안은 같은 capture 이름을 바인딩해야 합니다."] },
        { term: "wildcard _", definition: "어떤 값과도 일치하지만 해당 값을 일반 이름으로 캡처하지 않는 나머지 패턴입니다.", detail: ["보통 마지막 case에 둡니다.", "기본 거부·unknown 처리 의미를 명시합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "SyntaxError: wildcard makes remaining patterns unreachable가 발생한다.", likelyCause: "case _ 또는 모든 값을 캡처하는 bare name case를 뒤 패턴보다 앞에 배치했습니다.", checks: ["각 case가 어떤 입력 전체를 덮는지 적습니다.", "_와 bare capture 위치를 확인합니다.", "더 구체적인 패턴을 먼저 둘 수 있는지 봅니다."], fix: "wildcard/capture-all을 마지막으로 옮기고 구체 패턴을 앞에 둡니다.", prevention: "case 순서를 좁은 구조→넓은 구조→unknown으로 리뷰합니다." },
      ],
    },
    {
      id: "capture-patterns",
      title: "bare name은 기존 변수 비교가 아니라 새 capture입니다",
      lead: "case x:는 subject가 기존 x와 같은지 검사하지 않고 어떤 값이든 x에 바인딩합니다.",
      explanations: [
        "상수처럼 보이는 RED=1을 정의한 뒤 case RED:를 쓰면 일반 지역 bare name capture로 해석되어 모든 값을 잡고 뒤 case를 가릴 수 있습니다. enum.Color.RED처럼 점이 있는 qualified name은 value pattern으로 비교할 수 있습니다.",
        "case (x,y)는 두 요소를 각각 캡처합니다. 패턴 안 같은 이름을 여러 번 써 두 값 동등성을 자동 검사하는 방식은 허용되지 않습니다. case (x,y) if x==y처럼 guard를 사용합니다.",
        "case matched as whole은 패턴과 일치한 전체 또는 부분 값을 추가 이름으로 캡처합니다. 디버깅·후속 처리에 유용하지만 너무 많은 캡처는 블록 결합도를 높입니다.",
      ],
      concepts: [
        { term: "capture pattern", definition: "패턴에 맞은 값을 새 이름에 바인딩하는 bare name 패턴입니다.", detail: ["어떤 값과도 일치할 수 있습니다.", "기존 같은 이름의 값과 비교하는 문법이 아닙니다."] },
        { term: "value pattern", definition: "qualified name이 가리키는 기존 값과 subject 부분을 비교하는 패턴입니다.", detail: ["EnumMember 같은 점 표기를 사용합니다.", "literal은 직접 value 비교 패턴입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "특정 상수 case가 모든 입력과 일치한다.", likelyCause: "case STATUS처럼 bare name을 상수 비교로 오해했지만 capture-all로 해석됐습니다.", checks: ["패턴 이름에 점이 있는 qualified value인지 확인합니다.", "컴파일러가 뒤 case unreachable 경고를 내는지 봅니다.", "literal 또는 Enum.Member로 재현합니다."], fix: "문자·숫자 literal 또는 qualified Enum.Member value pattern을 사용합니다.", prevention: "패턴에서 대문자 bare name도 상수로 가정하지 않고 린터·Enum을 사용합니다." },
      ],
    },
    {
      id: "sequence-patterns",
      title: "시퀀스 패턴은 길이와 위치 값을 함께 검사합니다",
      lead: "case (0,y)는 두 요소 시퀀스만 일치하고 첫 요소 0을 확인한 뒤 y를 캡처합니다.",
      explanations: [
        "원본 describe_point는 (0,0), (0,y), (x,0), (x,y), _ 순서입니다. 원점을 먼저 두지 않으면 (0,y)가 원점까지 잡습니다. 두 축 패턴 뒤 일반 두 좌표를 두어 구체→일반 순서를 지킵니다.",
        "list와 tuple 같은 sequence는 괄호·대괄호 패턴 모두 구조에 맞을 수 있지만 str·bytes는 문자 시퀀스처럼 자동 분해 매칭되지 않습니다. 문자열 명령은 literal·split 결과를 사용합니다.",
        "case [first,*middle,last]는 최소 두 요소를 요구하고 나머지를 list middle로 캡처합니다. 길이 1·0은 맞지 않습니다. 가변 길이 프로토콜은 최대 길이와 타입을 guard·사전 검증합니다.",
        "패턴 실패는 예외가 아니라 다음 case로 이동합니다. 구조 오류를 반드시 사용자에게 알려야 하면 마지막 case에서 명시 오류를 반환하거나 raise합니다.",
      ],
      concepts: [
        { term: "sequence pattern", definition: "시퀀스의 요소 수·위치별 subpattern을 동시에 검사하고 분해하는 패턴입니다.", detail: ["고정 길이와 *rest 가변 길이를 표현합니다.", "str·bytes는 일반 sequence pattern 대상에서 제외됩니다."] },
      ],
      codeExamples: [
        {
          id: "structural-point-matching",
          title: "좌표의 값과 구조를 동시에 분류",
          language: "python",
          filename: "match_points.py",
          purpose: "원본 describe_point를 그대로 재현하고 구조 불일치까지 명시합니다.",
          code: "def describe_point(point):\n    match point:\n        case (0, 0):\n            return '원점'\n        case (0, y):\n            return f'y축 위 (y={y})'\n        case (x, 0):\n            return f'x축 위 (x={x})'\n        case (x, y):\n            return f'일반 좌표 ({x}, {y})'\n        case _:\n            return '좌표 아님'\n\nfor point in [(0, 0), (0, 5), (3, 0), (2, 4), (1, 2, 3), 'xy']:\n    print(f'{point!r} -> {describe_point(point)}')",
          walkthrough: [
            { lines: "1-2", explanation: "함수 인수 point를 match subject로 한 번 평가합니다." },
            { lines: "3-4", explanation: "가장 구체적인 두 literal 좌표 원점을 먼저 처리합니다." },
            { lines: "5-10", explanation: "축 패턴에서 한 좌표를 캡처하고 마지막 두 요소 일반 패턴이 나머지 좌표를 처리합니다." },
            { lines: "11-12", explanation: "길이·타입 구조가 맞지 않는 나머지를 명시합니다." },
            { lines: "14-15", explanation: "네 정상 좌표, 길이 3 tuple과 str 경계를 실행합니다." },
          ],
          run: { environment: ["Python 3.10 이상", "match_points.py를 저장"], command: "python match_points.py" },
          output: { value: "(0, 0) -> 원점\n(0, 5) -> y축 위 (y=5)\n(3, 0) -> x축 위 (x=3)\n(2, 4) -> 일반 좌표 (2, 4)\n(1, 2, 3) -> 좌표 아님\n'xy' -> 좌표 아님", explanation: ["case 순서가 원점·축·일반 좌표 포함 관계를 해결합니다.", "길이 3은 고정 길이 2 패턴과 일치하지 않습니다.", "문자열 'xy'는 두 문자 sequence로 구조 매칭되지 않습니다."] },
          experiments: [
            { change: "case (0,y)를 case (0,*rest)로 바꿉니다.", prediction: "원점 뒤 x=0인 길이 1 이상 다양한 tuple이 일치하고 rest는 list입니다.", result: "가변 구조 허용이 넓어져 사전 schema 검증 필요성이 커집니다." },
            { change: "case (x,y)를 맨 위로 옮깁니다.", prediction: "모든 길이 2 좌표를 먼저 잡아 원점·축 case가 실행되지 않습니다.", result: "구체→일반 case 순서 원칙을 확인합니다." },
          ],
          sourceRefs: ["py-match-case", "py-day03-note"],
        },
      ],
      diagnostics: [],
    },
    {
      id: "mapping-class-patterns",
      title: "mapping key와 객체 속성 구조도 패턴으로 검사합니다",
      lead: "case {'type':'message','text':text}:는 필요한 key와 literal을 확인하고 value를 캡처하며 추가 key는 기본적으로 허용합니다.",
      explanations: [
        "mapping pattern은 명시한 key가 존재하고 value subpattern이 맞는지 검사합니다. dict에 추가 key가 있어도 일치합니다. 나머지 key가 필요하면 **rest로 캡처하고, 허용하지 않으려면 별도 guard·schema 검증이 필요합니다.",
        "class pattern은 case Point(x=0,y=y)처럼 타입과 공개 match 속성을 검사합니다. dataclass는 __match_args__를 제공해 위치 패턴을 쓸 수 있지만 keyword pattern이 필드 의미와 버전 변화에 더 명확합니다.",
        "외부 JSON dict를 match한다고 해서 value 타입·길이·권한이 모두 안전해지는 것은 아닙니다. 패턴은 일부 구조 분기이며 완전 schema 검증과 오류 수집은 검증 모델이 더 적합할 수 있습니다.",
      ],
      concepts: [
        { term: "mapping pattern", definition: "필요한 key와 각 value의 subpattern을 검사·캡처하는 패턴입니다.", detail: ["추가 key는 기본적으로 일치를 방해하지 않습니다.", "**rest로 나머지 항목을 받을 수 있습니다."] },
        { term: "class pattern", definition: "객체 타입과 지정 속성 또는 __match_args__ 위치를 검사하는 패턴입니다.", detail: ["dataclass·도메인 이벤트 분기에 유용합니다.", "keyword pattern이 필드 의미를 더 명확히 합니다."] },
      ],
      codeExamples: [
        {
          id: "event-mapping-patterns",
          title: "외부 이벤트 dict를 구조별로 분류",
          language: "python",
          filename: "match_events.py",
          purpose: "literal key, value capture, OR, guard와 **rest를 하나의 이벤트 라우터에서 확인합니다.",
          code: "def route(event):\n    match event:\n        case {'type': 'message', 'text': str(text)} if text.strip():\n            return f'메시지: {text.strip()}'\n        case {'type': 'join' | 'leave', 'user': str(user)}:\n            return f'멤버 이벤트: {user}'\n        case {'type': 'score', 'value': int(value)} if 0 <= value <= 100:\n            return f'점수: {value}'\n        case {'type': event_type, **rest}:\n            return f'지원하지 않는 이벤트: {event_type}, fields={sorted(rest)}'\n        case _:\n            return '잘못된 이벤트 구조'\n\nevents = [\n    {'type': 'message', 'text': '  안녕  ', 'id': 1},\n    {'type': 'join', 'user': '둘리'},\n    {'type': 'score', 'value': 101},\n    ['message', '안녕'],\n]\nfor event in events:\n    print(route(event))",
          walkthrough: [
            { lines: "1-4", explanation: "message literal과 text가 실제 str인 class pattern을 검사한 뒤 빈 값 guard를 적용합니다. 추가 id key는 허용됩니다." },
            { lines: "5-6", explanation: "join 또는 leave literal을 OR pattern으로 공유하고 user str을 캡처합니다." },
            { lines: "7-8", explanation: "bool도 int 하위 타입일 수 있다는 점은 도메인 검증에서 추가로 고려하며 여기서는 int와 범위를 검사합니다." },
            { lines: "9-10", explanation: "type key가 있는 unknown 이벤트의 나머지 필드 이름을 보고합니다." },
            { lines: "11-12", explanation: "mapping 구조조차 아닌 입력을 기본 오류로 처리합니다." },
            { lines: "14-20", explanation: "정상 두 개, 범위 밖 score, list 구조를 실행합니다." },
          ],
          run: { environment: ["Python 3.10 이상", "match_events.py를 저장"], command: "python match_events.py" },
          output: { value: "메시지: 안녕\n멤버 이벤트: 둘리\n지원하지 않는 이벤트: score, fields=['value']\n잘못된 이벤트 구조", explanation: ["score 패턴 구조는 맞지만 guard 101 범위가 거짓이라 다음 generic type case로 이동합니다.", "mapping pattern은 id 추가 key가 있어도 message와 일치합니다.", "list는 mapping case 전체에 실패해 wildcard로 갑니다."] },
          experiments: [
            { change: "score value를 True로 바꿉니다.", prediction: "bool은 int의 하위 타입이라 int(value) class pattern과 범위 guard를 통과할 수 있습니다.", result: "정확히 int만 허용하려면 type(value) is int guard 같은 도메인 검증이 필요합니다." },
            { change: "message text를 공백만 넣습니다.", prediction: "구조는 맞지만 guard가 False라 generic type case로 이동합니다.", result: "구조 오류와 내용 검증 오류를 별도 case로 분리할 필요를 확인합니다." },
          ],
          sourceRefs: ["py-match-case", "py-day03-note"],
        },
      ],
      diagnostics: [],
    },
    {
      id: "guards-and-binding",
      title: "guard는 패턴 일치와 capture 뒤에 추가 조건을 검사합니다",
      lead: "case x if x>0은 먼저 subject를 x에 캡처하고 그다음 guard bool을 평가합니다.",
      explanations: [
        "원본 sign은 case 0, case x if x>0, case _ 순서로 영·양수·음수를 분류합니다. 0 literal이 먼저라 x guard는 0 이외에서 평가됩니다. guard가 False면 다음 case로 계속 갑니다.",
        "guard에서 캡처 이름을 사용할 수 있지만 함수 호출·상태 변경 같은 부작용을 피합니다. 어느 패턴에서 guard가 평가될지 순서에 의존하고 디버깅이 어려워집니다.",
        "패턴이 성공했지만 guard가 실패한 뒤 capture 이름이 바깥에 남을 수 있는 세부에 의존하지 않습니다. case 블록 안에서만 해당 이름이 유효하다는 설계 관점으로 사용합니다.",
        "복잡한 schema 검증을 guard 한 줄에 몰아넣지 말고 패턴으로 구조, 검증 함수로 도메인 규칙을 분리합니다.",
      ],
      concepts: [
        { term: "guard", definition: "패턴이 일치하고 capture가 만들어진 뒤 case 선택을 확정하기 전에 검사하는 if 조건입니다.", detail: ["False면 다음 case로 진행합니다.", "구조 이외의 범위·관계 조건을 표현합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "패턴은 맞아 보이는데 해당 case가 실행되지 않는다.", likelyCause: "guard가 False이거나 더 앞의 넓은 case가 먼저 일치했습니다.", checks: ["패턴 일치와 guard bool을 별도로 재현합니다.", "앞 case가 subject를 이미 잡는지 확인합니다.", "캡처 값 type·범위를 repr로 봅니다."], fix: "case 순서를 구체→일반으로 정리하고 guard를 이름 있는 bool 함수로 단순화합니다.", prevention: "패턴 성공/guard 실패, 경계값, 앞 case 충돌 테스트를 둡니다." },
      ],
    },
    {
      id: "choosing-pattern-matching",
      title: "구조 분해가 핵심일 때 match를 선택합니다",
      lead: "모든 if-elif를 match로 바꾸는 것이 목표가 아니라 데이터 모양과 분기 로직을 가장 읽기 좋게 표현하는 도구를 선택합니다.",
      explanations: [
        "한 숫자의 범위 조건은 if-elif가 자연스럽습니다. 정확한 명령 문자열→함수 호출만 필요하면 dict dispatch가 데이터로 확장하기 쉽습니다. 이벤트의 타입·key·중첩 구조를 동시에 분해하면 match가 강합니다.",
        "객체 타입별 동작이 계속 늘면 match isinstance case보다 각 클래스의 메서드 다형성이 변경에 강할 수 있습니다. 외부 데이터 경계의 일회성 분류와 내부 도메인 행동을 구분합니다.",
        "case가 수십 개로 커지면 순서 충돌과 coverage가 어려워집니다. 하위 라우터 함수로 분리하고 unknown을 기본 거부하며 입력 schema 버전을 먼저 match합니다.",
        "패턴 매칭은 데이터 검증 라이브러리를 대체하지 않습니다. 필요한 key만 확인한 mapping pattern은 추가·잘못된 필드를 허용할 수 있고 모든 오류를 수집하지 않습니다.",
      ],
      concepts: [
        { term: "dispatch", definition: "입력 종류에 맞는 처리 함수·객체를 선택해 호출하는 구조입니다.", detail: ["dict, match, 다형성으로 구현할 수 있습니다.", "새 종류 추가·unknown·권한·관찰성을 함께 설계합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "분기 도구를 어떻게 선택할까요?", options: [
          { name: "match/case", chooseWhen: "literal과 중첩 sequence·mapping·class 구조를 한 번에 검사·분해할 때", avoidWhen: "단순 범위 계산이나 동적으로 등록되는 명령이 핵심일 때", tradeoffs: ["구조와 캡처가 가깝습니다.", "순서·capture 문법 학습이 필요합니다.", "Python 3.10+가 필요합니다."] },
          { name: "if/dispatch/다형성", chooseWhen: "범위 조건, 동적 함수 테이블, 객체 자체 행동이 핵심일 때", avoidWhen: "복잡한 구조 분해가 반복돼 인덱스·get 코드가 길어질 때", tradeoffs: ["버전 호환과 익숙함이 좋습니다.", "dispatch table은 동적 확장이 쉽습니다.", "구조 분해는 수동 코드가 늘 수 있습니다."] },
        ] },
      ],
      expertNotes: ["공개 이벤트 protocol에 schemaVersion literal을 먼저 매칭하고 unknown 버전은 기본 거부해 forward compatibility를 명시합니다.", "패턴 case coverage와 unknown telemetry를 수집하되 전체 payload의 개인정보를 로그에 남기지 않습니다."],
    },
  ],
  lab: {
    title: "버전 있는 학습 이벤트 라우터",
    scenario: "dict로 들어오는 lesson_started·code_run·lesson_completed 이벤트를 version과 payload 구조로 분기하고 잘못된 이벤트를 안전하게 거부합니다.",
    setup: ["event_router.py를 만듭니다.", "정상·누락·추가·잘못된 타입·unknown version 이벤트를 준비합니다.", "Python 3.10 이상에서 실행합니다."],
    steps: ["case {'version':1,'type':'lesson_started','lesson':str(slug)} 패턴을 만듭니다.", "code_run에는 language str과 exitCode int를 캡처하고 허용 범위 guard를 둡니다.", "completed에는 duration>0 guard를 둡니다.", "type은 있지만 payload 오류인 case와 unknown type·version을 구분합니다.", "추가 key 허용 여부와 **rest 로그 최소화 정책을 정합니다.", "bool이 int pattern을 통과하는 경계를 테스트합니다.", "각 case·guard 실패·wildcard branch coverage를 확인합니다."],
    expectedResult: ["정상 이벤트는 캡처한 typed 값으로 처리됩니다.", "구조 오류·도메인 오류·unknown version이 구분됩니다.", "case 순서가 넓은 패턴으로 구체 오류를 가리지 않습니다.", "민감 payload 전체를 출력하지 않고 event type·error code만 기록합니다."],
    cleanup: ["합성 이벤트만 사용합니다."],
    extensions: ["dataclass 이벤트 class pattern으로 변환합니다.", "dict dispatch와 match 구현을 비교합니다.", "schema validator를 match 앞에 두고 오류 목록을 반환합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "요일·학점·숫자 부호를 match로 분류하세요.", requirements: ["literal, OR, wildcard, guard를 모두 사용합니다.", "각 case 순서의 이유를 씁니다.", "unknown·경계 입력을 실행합니다."], hints: ["wildcard는 마지막에 둡니다.", "양수 guard 전에 0 literal을 처리합니다."], expectedOutcome: "원본 네 패턴 종류를 독립적으로 설명하고 재현합니다.", solutionOutline: ["세 함수로 작은 match를 만듭니다.", "대표·unknown 값을 순회 출력합니다.", "guard False가 다음 case로 가는지 확인합니다."] },
    { difficulty: "응용", prompt: "CLI 명령 토큰을 sequence pattern으로 라우팅하세요.", requirements: ["['add',name,*tags], ['remove',name], ['list'] 구조를 처리합니다.", "빈 name·과도한 tag 수 guard를 둡니다.", "문자열 원본을 split한 결과만 매칭합니다.", "잘못된 길이와 unknown 명령을 구분합니다."], hints: ["str 자체는 sequence pattern으로 문자 분해되지 않습니다.", "더 구체적인 fixed pattern을 먼저 둡니다."], expectedOutcome: "가변 길이 명령 구조를 분해하면서 schema 오류를 명시합니다." },
    { difficulty: "설계", prompt: "결제 webhook 이벤트 라우터를 설계하세요.", requirements: ["version·event type·중첩 payload·금액·통화 구조를 패턴화합니다.", "서명 검증은 match 전 신뢰 경계로 분리합니다.", "unknown·중복·재전송·bool-as-int·민감 로그를 다룹니다.", "match·검증 모델·dispatch·도메인 다형성 책임을 나눕니다.", "최소 15개 case/guard/보안 테스트를 작성합니다."], hints: ["패턴 일치가 webhook 진위를 보장하지 않습니다.", "추가 key를 mapping pattern이 허용한다는 점을 검토합니다."], expectedOutcome: "구조적 패턴을 보안·schema·멱등성 있는 이벤트 처리 아키텍처로 확장합니다." },
  ],
  reviewQuestions: [
    { question: "match와 switch의 가장 큰 차이는 무엇인가요?", answer: "match는 값뿐 아니라 시퀀스·mapping·객체 구조를 검사하고 내부 값을 이름에 캡처할 수 있습니다." },
    { question: "case _는 어디에 두어야 하나요?", answer: "모든 값과 일치하므로 보통 마지막에 두어 구체 case를 가리지 않게 합니다." },
    { question: "case STATUS가 기존 상수 STATUS와 비교하나요?", answer: "일반 bare name이면 capture pattern이어서 모든 값을 잡을 수 있습니다. literal 또는 Enum.STATUS 같은 qualified name을 씁니다." },
    { question: "case (0,y)는 무엇을 검사·생성하나요?", answer: "길이 2 sequence와 첫 값 0을 검사하고 두 번째 값을 y 이름에 캡처합니다." },
    { question: "guard가 False면 match 전체가 끝나나요?", answer: "아닙니다. 다음 case 패턴으로 계속 검사합니다." },
    { question: "mapping pattern에 적지 않은 추가 key가 있으면 실패하나요?", answer: "기본적으로 추가 key는 허용됩니다. 엄격 schema는 별도 검증이 필요합니다." },
    { question: "언제 if가 match보다 낫나요?", answer: "숫자 범위·복합 bool 계산이 중심이고 구조 분해가 필요 없을 때 if가 더 직접적입니다." },
  ],
  completionChecklist: [
    "Python 3.10+ match의 subject·첫 일치 실행 순서를 설명할 수 있다.",
    "literal·OR·wildcard를 구체→일반 순서로 작성할 수 있다.",
    "bare capture와 qualified value pattern을 구분할 수 있다.",
    "고정·별표 sequence pattern으로 구조를 분해할 수 있다.",
    "mapping·class pattern의 추가 key·속성 계약을 설명할 수 있다.",
    "guard의 평가 시점과 실패 후 다음 case 흐름을 예측할 수 있다.",
    "match·if·dispatch·다형성과 schema 검증의 책임을 비교할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-match-case", repository: "PYTHON-BASIC", path: "day03/ex09_match.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day03/ex09_match.py", usedFor: ["literal·wildcard", "OR pattern", "좌표 sequence pattern", "guard", "실행 결과"], evidence: "Python 3.13.9에서 원본을 실행해 A/B/C/F 메시지, 주말/평일, 네 좌표 분류와 영·양수·음수 결과를 확인했습니다." },
    { id: "py-day03-note", repository: "PYTHON-BASIC", path: "notes/day03_collection_control.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day03_collection_control.md", usedFor: ["match 기초", "구조 분해", "guard", "버전 주의"], evidence: "원본 노트 범위를 유지하고 capture 함정·mapping/class pattern·schema·보안 dispatch를 보강했습니다." },
  ],
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["반복문은 다음 py-018~019 모듈에서 다룹니다.", "mapping/class pattern·bare capture·이벤트 schema 보안은 원본 공백을 전문가 관점으로 보강했습니다."] },
} satisfies DetailedSession;

export default session;
