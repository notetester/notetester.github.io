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
          run: { environment: ["Python 3.10 이상", "match_points.py를 저장"], command: "python -I -X utf8 match_points.py" },
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
          run: { environment: ["Python 3.10 이상", "match_events.py를 저장"], command: "python -I -X utf8 match_events.py" },
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

const expertSession = session as DetailedSession;
expertSession.level = "전문가";
expertSession.estimatedMinutes = 300;
expertSession.chapters.push(
  {
    id: "subject-evaluation-and-binding-lifecycle",
    title: "subject는 정확히 한 번 평가되고 바인딩 수명은 case 설계의 일부입니다",
    lead: "패턴을 여러 개 적어도 match 뒤 표현식은 한 번만 평가됩니다. 반면 각 패턴의 구조 검사와 guard는 위에서 아래로 진행되므로 비용·부작용·이름 바인딩을 서로 다른 단계로 추적해야 합니다.",
    explanations: [
      "PEP 634의 실행 모델에서 subject expression은 match 진입 시 한 번 평가됩니다. subject가 함수 호출이라면 case 수만큼 재호출되지 않습니다. 이 보장은 네트워크 조회나 상태 변경 함수를 subject에 넣어도 좋다는 권고가 아니라, 평가 횟수를 예측할 수 있다는 의미입니다. 외부 I/O는 match 전에 이름 있는 변수로 받아 실패와 재시도를 분리하는 편이 관찰 가능성과 테스트성이 좋습니다.",
      "패턴 성공 뒤 guard가 평가됩니다. guard가 거짓이면 다음 case로 이동하지만, 실패한 매칭 과정에서 만들어졌던 일부 이름이 구현 세부에 따라 남을 수 있는지에 의존해서는 안 됩니다. PEP 634는 실패 중 부분 바인딩을 이용하거나 가정하지 말라고 경계를 둡니다. 실무에서는 캡처 이름을 해당 case 블록 안에서만 사용하는 규칙이 가장 안전합니다.",
      "`case pattern as whole`은 세부 값을 분해하면서 동시에 일치한 전체 객체를 보존합니다. 원본 이벤트를 감사 로그에 그대로 남기기보다는 whole에서 허용된 식별자만 골라 기록해야 합니다. as는 복사하지 않고 같은 객체를 바인딩하므로, 가변 객체를 변경하면 원본 subject도 바뀐다는 점을 기억합니다.",
      "subject에 쉼표가 포함된 표현식은 튜플을 만들 수 있습니다. `match x, y:`는 두 값을 평가해 튜플 subject를 구성한 뒤 하나의 sequence pattern과 비교합니다. 평가 순서와 예외 지점을 명확히 해야 한다면 `subject = (x, y)`를 먼저 적어 디버거에서 확인합니다.",
    ],
    concepts: [
      { term: "single subject evaluation", definition: "match가 시작될 때 subject 표현식을 한 번 평가해 결과 객체를 모든 case 검사에 공유하는 규칙입니다.", detail: ["case마다 subject 함수를 다시 호출하지 않습니다.", "guard 함수는 도달한 case마다 별도로 호출될 수 있습니다."], caveat: "평가 횟수 보장이 외부 I/O를 subject에 숨기는 설계를 정당화하지는 않습니다." },
      { term: "partial binding boundary", definition: "패턴이 끝내 실패했을 때 중간에 만들어진 capture 이름의 상태를 프로그램 로직이 사용하지 않는 경계입니다.", detail: ["성공한 case 블록 안에서만 캡처를 소비합니다.", "guard 실패 뒤 바깥 이름 존재 여부를 검사하는 코드를 만들지 않습니다."] },
    ],
    codeExamples: [
      {
        id: "subject-evaluated-once",
        title: "함수 subject의 단일 평가와 as 전체 캡처 확인",
        language: "python",
        filename: "subject_once.py",
        purpose: "case가 여러 개여도 subject 생성 함수는 한 번만 호출되고, mapping을 분해하면서 전체 객체를 함께 참조할 수 있음을 검증합니다.",
        code: "calls = 0\n\ndef load_event():\n    global calls\n    calls += 1\n    return {'kind': 'score', 'value': 87, 'trace': 'T-01'}\n\nmatch load_event():\n    case {'kind': 'score', 'value': int(value), **rest} as whole if 0 <= value <= 100:\n        print(f'score={value}, extra={sorted(rest)}, same={whole[\"value\"] == value}')\n    case {'kind': kind} as whole:\n        print(f'unsupported={kind}, keys={sorted(whole)}')\n    case _:\n        print('invalid')\n\nprint(f'calls={calls}')",
        walkthrough: [
          { lines: "1-6", explanation: "호출 횟수를 기록하는 합성 subject 생성 함수를 정의합니다. 실제 서비스에서는 I/O 대신 이미 얻은 값을 넘기는 편이 좋습니다." },
          { lines: "8-10", explanation: "mapping 구조, int class pattern, 범위 guard를 통과한 뒤 **rest와 as whole을 동시에 사용합니다." },
          { lines: "11-14", explanation: "구조가 더 넓은 fallback과 최종 irrefutable wildcard를 뒤에 둡니다." },
          { lines: "16", explanation: "case가 세 개여도 load_event 호출은 한 번임을 출력으로 고정합니다." },
        ],
        run: { environment: ["Python 3.10 이상", "subject_once.py를 UTF-8로 저장"], command: "python -I -X utf8 subject_once.py" },
        output: { value: "score=87, extra=['trace'], same=True\ncalls=1", explanation: ["첫 case에서 구조와 guard가 모두 성공합니다.", "rest에는 명시하지 않은 trace만 남습니다.", "whole은 같은 mapping을 가리키며 subject 생성 함수는 정확히 한 번 호출됩니다."] },
        experiments: [
          { change: "value를 120으로 바꿉니다.", prediction: "첫 패턴은 구조적으로 맞지만 guard가 거짓이라 두 번째 case가 실행됩니다.", result: "guard 실패가 match 종료가 아니라 다음 case 진행이라는 점을 확인합니다." },
          { change: "load_event()를 각 if 조건에서 직접 반복 호출하는 구현과 비교합니다.", prediction: "호출 횟수와 상태 일관성 관리가 더 어려워집니다.", result: "subject 단일 평가와 사전 변수화의 설계 가치를 구분합니다." },
        ],
        sourceRefs: ["pep-634-spec", "python-match-reference", "pep-636-tutorial"],
      },
    ],
    diagnostics: [
      { symptom: "subject 함수가 한 번인데도 외부 API가 여러 번 호출된다.", likelyCause: "subject가 아니라 여러 guard 또는 case 블록에서 API 함수를 반복 호출했습니다.", checks: ["subject 생성 함수와 guard 함수에 별도 호출 카운터를 둡니다.", "각 guard가 어느 패턴 성공 뒤 평가되는지 로그 대신 합성 테스트로 추적합니다.", "property 접근자나 __match_args__ 대상 속성 자체에 부작용이 있는지 확인합니다."], fix: "외부 값을 match 전에 한 번 취득하고 guard는 이미 얻은 순수 데이터만 검사하도록 바꿉니다.", prevention: "패턴·guard는 순수 판별로 제한하고 I/O 경계를 별도 함수로 리뷰합니다." },
      { symptom: "guard 실패 뒤 캡처 이름을 읽을 때 환경별로 결과가 다르거나 UnboundLocalError가 난다.", likelyCause: "실패한 패턴의 부분 바인딩 상태에 의존했습니다.", checks: ["캡처 이름이 case 블록 밖에서 사용되는지 검색합니다.", "성공 case마다 명시 return 또는 결과 변수 할당이 있는지 확인합니다.", "wildcard에서 기본 결과를 만드는지 확인합니다."], fix: "각 성공 case에서 완성된 결과를 반환하고 캡처 이름은 블록 밖으로 누출하지 않습니다.", prevention: "부분 바인딩은 미정의 경계로 취급하는 테스트·리뷰 규칙을 둡니다." },
    ],
    expertNotes: ["속성 패턴은 객체 속성을 읽을 수 있으므로 descriptor나 property에 부작용이 있다면 구조 매칭이 순수하지 않을 수 있습니다.", "guard 평가 순서는 case 순서에 관찰 가능하게 의존하므로 비용 큰 guard를 무조건 앞에 두는 미세 최적화보다 좁고 의미 있는 패턴 순서를 먼저 설계합니다."],
  },
  {
    id: "class-or-as-irrefutable-reachability",
    title: "class·OR·as 패턴과 irrefutable 도달 가능성을 하나의 문법 계약으로 읽습니다",
    lead: "class pattern은 타입과 속성 계약을, OR는 대안 계약을, as는 전체 보존을 표현합니다. capture-all과 wildcard는 irrefutable이라 case 블록의 마지막 위치 제약까지 컴파일 단계에서 영향을 줍니다.",
    explanations: [
      "class pattern의 위치 인수는 클래스가 제공하는 `__match_args__` 순서에 의존합니다. dataclass가 이를 자동 생성하더라도 공개 API의 필드 순서를 바꾸면 기존 위치 패턴 의미가 달라질 수 있습니다. 도메인 경계에서는 `Point(x=0, y=y)` 같은 keyword class pattern이 이름으로 의도를 고정해 장기 유지보수에 유리합니다.",
      "OR 패턴의 각 대안은 동일한 이름 집합을 바인딩해야 합니다. `('ok', value) | ('pass', value)`는 허용되지만 한쪽만 value를 캡처하면 case 블록이 어떤 이름을 받을지 정할 수 없어 SyntaxError입니다. 각 대안의 타입 계약까지 같다는 뜻은 아니므로 guard나 class subpattern으로 후속 조건을 명시합니다.",
      "`P as name`은 P가 성공한 경우 그 부분의 subject를 name에 추가 바인딩합니다. OR 전체를 보존하려면 괄호와 우선순위를 읽기 쉽게 적습니다. 지나치게 중첩된 OR·as는 작은 정규화 함수나 여러 case로 나누는 것이 낫습니다.",
      "wildcard `_`와 일반 capture `name`은 항상 일치할 수 있는 irrefutable pattern입니다. guard 없는 irrefutable case 뒤에는 어떤 case도 도달할 수 없으므로 컴파일러가 SyntaxError로 막습니다. guard가 붙은 capture case는 guard가 거짓일 수 있어 다음 case가 도달 가능하지만, 지나치게 넓은 캡처가 앞에 있으면 설계 의도를 읽기 어렵습니다.",
    ],
    concepts: [
      { term: "__match_args__", definition: "class pattern의 위치 subpattern을 어떤 속성 이름에 대응할지 선언하는 문자열 튜플입니다.", detail: ["dataclass가 보통 필드 순서로 생성합니다.", "공개 순서 변경은 위치 패턴 소비자에게 호환성 변화가 될 수 있습니다."], caveat: "keyword class pattern은 __match_args__ 순서에 의존하지 않습니다." },
      { term: "irrefutable pattern", definition: "문법상 어떤 subject에도 반드시 일치할 수 있는 wildcard 또는 capture 같은 패턴입니다.", detail: ["guard 없는 irrefutable case는 마지막이어야 합니다.", "OR 패턴도 최소 한 대안이 irrefutable이면 전체 도달 가능성을 주의합니다."] },
    ],
    codeExamples: [
      {
        id: "dataclass-class-pattern-contract",
        title: "dataclass 위치 패턴과 keyword 패턴의 API 차이",
        language: "python",
        filename: "class_patterns.py",
        purpose: "__match_args__가 위치 패턴을 연결하는 방식과 keyword class pattern의 명시성을 실행 결과로 비교합니다.",
        code: "from dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass Point:\n    x: int\n    y: int\n\ndef describe(point):\n    match point:\n        case Point(0, 0) as whole:\n            return f'origin:{whole}'\n        case Point(x=0, y=y):\n            return f'y-axis:{y}'\n        case Point(x=x, y=y) if x == y:\n            return f'diagonal:{x}'\n        case Point(x=x, y=y):\n            return f'point:{x},{y}'\n        case _:\n            return 'not-point'\n\nprint(Point.__match_args__)\nfor item in [Point(0, 0), Point(0, 3), Point(4, 4), Point(2, 5), (1, 2)]:\n    print(describe(item))",
        walkthrough: [
          { lines: "1-6", explanation: "frozen dataclass를 만들고 자동 생성된 __match_args__를 관찰합니다." },
          { lines: "8-12", explanation: "가장 구체적인 위치 class pattern에서 as로 전체 객체를 보존하고, 다음 case는 keyword 속성 이름으로 y축을 표현합니다." },
          { lines: "13-18", explanation: "속성 간 동등성은 guard로 검사하고 일반 Point와 비 Point fallback을 뒤에 둡니다." },
          { lines: "21-23", explanation: "위치 계약과 모든 분기 결과를 고정된 합성 데이터로 실행합니다." },
        ],
        run: { environment: ["Python 3.10 이상", "class_patterns.py를 UTF-8로 저장"], command: "python -I -X utf8 class_patterns.py" },
        output: { value: "('x', 'y')\norigin:Point(x=0, y=0)\ny-axis:3\ndiagonal:4\npoint:2,5\nnot-point", explanation: ["dataclass의 위치 패턴 순서는 x, y입니다.", "keyword 패턴은 속성 이름을 문서처럼 드러냅니다.", "tuple은 모양이 비슷해도 Point class pattern과 일치하지 않습니다."] },
        experiments: [
          { change: "필드 선언 순서를 y, x로 바꾸고 Point(0, 3)을 다시 봅니다.", prediction: "위치 패턴의 의미가 함께 바뀌지만 keyword 패턴은 이름 기준을 유지합니다.", result: "공개 class pattern API에서 keyword 사용의 호환성 장점을 확인합니다." },
          { change: "`case Point(x=x, y=x)`로 동등성을 표현하려 합니다.", prediction: "같은 이름을 패턴 안에서 여러 번 바인딩할 수 없어 SyntaxError입니다.", result: "관계 검사는 guard 책임임을 확인합니다." },
        ],
        sourceRefs: ["pep-634-spec", "python-dataclasses-doc", "python-match-reference"],
      },
    ],
    diagnostics: [
      { symptom: "dataclass 필드 순서를 바꾼 뒤 위치 class pattern 분기가 조용히 달라졌다.", likelyCause: "소비자가 자동 __match_args__ 순서에 결합되어 있었습니다.", checks: ["클래스의 __match_args__를 출력합니다.", "저장소에서 `case ClassName(` 위치 패턴을 검색합니다.", "필드 이름 기반 테스트와 이전 버전 객체를 실행합니다."], fix: "외부·장기 계약에는 keyword class pattern을 사용하고 필요한 경우 __match_args__를 명시적으로 안정화합니다.", prevention: "__match_args__ 변경을 API 호환성 리뷰 항목에 넣습니다." },
      { symptom: "OR pattern에서 alternative patterns bind different names SyntaxError가 발생한다.", likelyCause: "각 OR 대안이 서로 다른 capture 이름 집합을 만들었습니다.", checks: ["각 `|` 대안에서 캡처되는 이름을 집합으로 적습니다.", "literal과 class subpattern이 만드는 이름을 확인합니다.", "공통 처리 블록이 정말 같은 데이터 계약을 요구하는지 검토합니다."], fix: "모든 대안이 같은 이름을 바인딩하도록 고치거나 별도 case로 나눕니다.", prevention: "OR는 단순 표면 차이만 합치고 결과 계약이 다르면 case를 분리합니다." },
    ],
    expertNotes: ["class pattern은 isinstance 검사와 속성 추출을 합치지만 생성자 호출이 아니며 새 객체를 만들지 않습니다.", "`case _ if condition`은 문법상 wildcard지만 guard가 거짓일 수 있어 뒤 case가 허용됩니다. 그래도 입력 구조와 무관한 전역 조건을 case 순서에 섞는 설계는 피합니다."],
  },
  {
    id: "version-boundary-and-pattern-contract-testing",
    title: "Python 3.10 버전 경계와 패턴 도달 가능성을 컴파일·행동 테스트로 고정합니다",
    lead: "match는 런타임 feature flag가 아니라 parser 문법입니다. 지원 버전, 정적 컴파일, case/guard 경계, unknown 정책을 배포 계약으로 함께 검증해야 합니다.",
    explanations: [
      "match 문법은 Python 3.10 parser부터 인식합니다. 3.9에서 해당 파일을 import하면 분기에 도달하지 않아도 전체 파일 parsing 단계에서 SyntaxError가 납니다. 따라서 `if sys.version_info`로 같은 파일 안의 match를 감싸는 방식은 하위 버전 호환책이 아닙니다. 하위 버전을 지원해야 하면 match 코드 자체를 별도 3.10+ 모듈로 격리하거나 if/dispatch로 작성합니다.",
      "CI에서는 지원하는 최소·최대 Python matrix에 `py_compile` 또는 import 테스트를 둡니다. `python -I -X utf8`은 사용자 site-packages와 `PYTHONPATH` 영향을 줄이고 UTF-8 모드를 고정해 예제가 로컬 환경에 우연히 의존하지 않게 합니다. 이것이 가상환경 의존성까지 제공하는 것은 아니므로 표준 라이브러리 예제와 외부 패키지 예제를 구분합니다.",
      "컴파일러는 guard 없는 irrefutable case 뒤의 패턴을 unreachable로 거부합니다. 그러나 의미상 중복되는 literal·넓은 class·mapping case를 모두 찾아주지는 않습니다. 순서 테스트는 각 case를 한 번씩 통과하는 대표값뿐 아니라 앞 case와 겹치는 값, guard 경계값, unknown 구조를 포함해야 합니다.",
      "패턴 매칭 결과를 문자열 하나로만 테스트하면 어떤 case가 선택됐는지 우연히 같은 출력에 가려질 수 있습니다. 도메인 결과를 Enum·dataclass 같은 구조화 값으로 반환하고 표시를 바깥에서 수행하면 분기 계약과 UI 문구를 독립적으로 검증할 수 있습니다.",
    ],
    concepts: [
      { term: "parser boundary", definition: "코드가 실행되기 전에 인터프리터가 파일 문법 전체를 해석할 수 있어야 하는 버전 경계입니다.", detail: ["match는 Python 3.10 미만에서 import 자체가 실패합니다.", "런타임 조건문은 parser가 모르는 문법을 숨기지 못합니다."] },
      { term: "case coverage", definition: "각 case와 guard의 참·거짓 전이, overlap, unknown 경로를 입력 집합으로 검증하는 행동 계약입니다.", detail: ["문장 coverage만으로 패턴 의미를 보장하지 않습니다.", "경계와 겹침 입력을 명시합니다."] },
    ],
    codeExamples: [
      {
        id: "or-as-guard-and-unreachable-compile",
        title: "OR·as·guard 실행과 irrefutable 도달 불가 컴파일 검사",
        language: "python",
        filename: "pattern_contracts.py",
        purpose: "같은 capture 계약을 가진 OR 대안과 전체 캡처를 사용하고, wildcard 뒤 case가 컴파일 단계에서 거부됨을 확인합니다.",
        code: "def classify(record):\n    match record:\n        case (('ok', int(code)) | ('pass', int(code))) as whole if code >= 200:\n            return f'accepted:{whole[0]}:{code}'\n        case ('ok' | 'pass', int(code)):\n            return f'low:{code}'\n        case _:\n            return 'unknown'\n\nfor record in [('ok', 204), ('pass', 201), ('ok', 99), ('fail', 500)]:\n    print(classify(record))\n\nbad_source = \"match 1:\\n    case _:\\n        pass\\n    case 1:\\n        pass\\n\"\ntry:\n    compile(bad_source, '<unreachable>', 'exec')\nexcept SyntaxError as error:\n    print(type(error).__name__)",
        walkthrough: [
          { lines: "1-4", explanation: "두 OR 대안 모두 code를 바인딩하며 as whole은 선택된 tuple 전체를 보존합니다. guard는 capture 뒤 평가됩니다." },
          { lines: "5-8", explanation: "낮은 코드와 unknown을 분리하고 wildcard를 마지막에 둡니다." },
          { lines: "10-11", explanation: "OR 두 대안, guard 실패, unknown 경계를 모두 실행합니다." },
          { lines: "13-17", explanation: "guard 없는 wildcard 뒤 literal case를 문자열로 컴파일해 도달 불가 오류의 타입을 고정합니다." },
        ],
        run: { environment: ["Python 3.10 이상", "pattern_contracts.py를 UTF-8로 저장"], command: "python -I -X utf8 pattern_contracts.py" },
        output: { value: "accepted:ok:204\naccepted:pass:201\nlow:99\nunknown\nSyntaxError", explanation: ["OR 대안은 같은 code 이름 계약을 제공합니다.", "guard 실패는 다음 구조 case로 진행합니다.", "irrefutable wildcard 뒤 case는 실행 이전 컴파일 단계에서 거부됩니다."] },
        experiments: [
          { change: "첫 OR의 두 번째 대안에서 code 캡처를 제거합니다.", prediction: "대안의 바인딩 이름 집합이 달라 SyntaxError입니다.", result: "OR case 블록의 이름 계약이 컴파일 단계에 검증됨을 확인합니다." },
          { change: "bad_source의 wildcard에 `if False` guard를 붙입니다.", prediction: "뒤 case가 문법적으로 도달 가능해져 compile이 성공합니다.", result: "irrefutable pattern과 guard가 도달 가능성에 미치는 차이를 확인합니다." },
        ],
        sourceRefs: ["pep-634-spec", "pep-635-rationale", "pep-636-tutorial", "python-match-reference", "python-pycompile-doc", "python-enum-doc", "python-sys-version-doc"],
      },
    ],
    diagnostics: [
      { symptom: "Python 3.9에서 version if문으로 감쌌는데도 모듈 import가 실패한다.", likelyCause: "parser가 조건 실행 전에 파일 전체의 match 문법을 읽지 못합니다.", checks: ["최소 인터프리터 버전을 확인합니다.", "match가 들어 있는 모듈의 import 경로를 찾습니다.", "패키지 메타데이터 requires-python과 CI matrix를 비교합니다."], fix: "최소 버전을 3.10+로 올리거나 match 없는 호환 모듈로 구현합니다.", prevention: "지원 최소 버전에서 모든 배포 모듈을 py_compile합니다." },
      { symptom: "모든 case 줄이 실행됐는데 overlap 버그가 배포 후 발견된다.", likelyCause: "각 case 대표값만 테스트하고 앞뒤 패턴이 동시에 맞는 겹침·guard 경계를 테스트하지 않았습니다.", checks: ["case별 입력 집합의 포함 관계를 표로 만듭니다.", "경계 바로 아래·같음·바로 위 값을 넣습니다.", "unknown과 잘못된 타입, 추가 key 입력을 포함합니다."], fix: "분기 선택 결과를 구조화 값으로 반환하고 overlap 표 기반 테스트를 추가합니다.", prevention: "case coverage를 line coverage와 별도 품질 기준으로 관리합니다." },
    ],
    expertNotes: ["패턴 문법의 지원 버전은 라이브러리의 `Requires-Python`과 wheel 분류자, 문서, CI가 동일하게 말해야 합니다.", "정적 타입 검사기는 mapping payload의 런타임 구조를 모두 증명하지 못하므로 pattern 분기 뒤에도 도메인 invariant를 명시적 타입·검증으로 유지합니다."],
  },
);

expertSession.reviewQuestions.push(
  { question: "match subject에 함수 호출을 쓰면 case마다 호출되나요?", answer: "아닙니다. subject 표현식은 match 진입 시 한 번 평가되고 그 결과가 case 검사에 사용됩니다. 다만 guard의 함수 호출은 도달할 때마다 별도로 평가될 수 있습니다." },
  { question: "패턴이 중간까지 성공했다가 실패했을 때 캡처 이름을 바깥에서 사용해도 되나요?", answer: "안 됩니다. 실패 중 부분 바인딩의 잔존 여부에 의존하지 말고 성공한 case 블록 안에서만 캡처를 소비합니다." },
  { question: "OR pattern 각 대안이 서로 다른 이름을 캡처할 수 있나요?", answer: "같은 case 블록으로 합쳐지는 OR 대안은 동일한 capture 이름 집합을 바인딩해야 하며 다르면 SyntaxError입니다." },
  { question: "as pattern은 값을 복사하나요?", answer: "아닙니다. 일치한 전체 또는 부분 subject 객체를 다른 이름으로 바인딩하므로 가변 객체라면 동일 객체를 가리킵니다." },
  { question: "dataclass 위치 class pattern의 순서는 어디서 오나요?", answer: "주로 dataclass가 생성한 __match_args__ 문자열 튜플 순서를 따릅니다. 필드 순서 변화에 민감하므로 안정적 계약에는 keyword pattern을 선호합니다." },
  { question: "guard 없는 case name과 case _ 뒤에 다른 case를 둘 수 있나요?", answer: "둘 다 irrefutable pattern이므로 뒤 case가 도달 불가능해 컴파일 오류가 납니다." },
  { question: "Python 3.9 지원 코드에서 sys.version_info로 match를 감싸면 되나요?", answer: "아닙니다. 3.9 parser가 파일 전체를 실행 전에 읽으므로 match 문법 자체에서 실패합니다. 별도 호환 구현이나 최소 3.10 계약이 필요합니다." },
  { question: "case coverage는 line coverage와 어떻게 다른가요?", answer: "각 패턴 대표값뿐 아니라 패턴 간 overlap, guard 참·거짓 경계, 구조 오류와 unknown까지 어떤 case가 선택되는지 검증합니다." },
);

expertSession.completionChecklist.push(
  "subject 표현식과 guard 표현식의 평가 횟수를 분리해 설명할 수 있다.",
  "실패한 패턴의 부분 바인딩 상태에 의존하지 않는 코드를 작성할 수 있다.",
  "OR pattern 모든 대안의 capture 이름 계약을 검토할 수 있다.",
  "as pattern이 복사가 아니라 동일 객체 바인딩임을 설명할 수 있다.",
  "__match_args__ 위치 계약과 keyword class pattern의 호환성 차이를 판단할 수 있다.",
  "irrefutable pattern과 guard가 뒤 case 도달 가능성에 미치는 영향을 예측할 수 있다.",
  "Python 3.10 parser 경계를 프로젝트 메타데이터·CI·문서에 일치시킬 수 있다.",
  "대표·overlap·guard 경계·unknown을 포함한 case coverage 표를 만들 수 있다.",
);

expertSession.sources.push(
  { id: "pep-634-spec", repository: "Python", path: "PEP 634", publicUrl: "https://peps.python.org/pep-0634/", usedFor: ["subject 단일 평가", "pattern 문법", "바인딩과 guard", "irrefutable 규칙"], evidence: "구조적 패턴 매칭의 규범 명세에서 평가 순서, 패턴 종류, 바인딩과 실패 경계를 확인했습니다." },
  { id: "pep-635-rationale", repository: "Python", path: "PEP 635", publicUrl: "https://peps.python.org/pep-0635/", usedFor: ["설계 근거", "구조적 분해의 사용 기준"], evidence: "구조적 패턴 매칭이 값 switch를 넘어 데이터 구조를 분해하도록 설계된 이유를 교차 확인했습니다." },
  { id: "pep-636-tutorial", repository: "Python", path: "PEP 636", publicUrl: "https://peps.python.org/pep-0636/", usedFor: ["sequence", "mapping", "class", "OR와 as", "guard"], evidence: "공식 튜토리얼의 점진적 예제를 전문가 설명과 실행 예제의 학습 순서에 반영했습니다." },
  { id: "python-match-reference", repository: "Python", path: "reference/compound_stmts.html#the-match-statement", publicUrl: "https://docs.python.org/3/reference/compound_stmts.html#the-match-statement", usedFor: ["match 실행 의미", "case 순서", "guard", "irrefutable case"], evidence: "현재 언어 레퍼런스에서 match statement의 문법과 실행 순서를 확인했습니다." },
  { id: "python-dataclasses-doc", repository: "Python", path: "library/dataclasses.html", publicUrl: "https://docs.python.org/3/library/dataclasses.html", usedFor: ["dataclass", "match_args", "frozen 객체"], evidence: "dataclass의 match_args 생성 옵션과 필드 기반 클래스 계약을 확인했습니다." },
  { id: "python-enum-doc", repository: "Python", path: "library/enum.html", publicUrl: "https://docs.python.org/3/library/enum.html", usedFor: ["qualified value pattern", "상수 분기"], evidence: "bare capture 대신 Enum.Member qualified name을 안정적 값 패턴으로 사용하는 근거를 보강했습니다." },
  { id: "python-pycompile-doc", repository: "Python", path: "library/py_compile.html", publicUrl: "https://docs.python.org/3/library/py_compile.html", usedFor: ["컴파일 검증", "버전 경계 CI"], evidence: "배포 전 모듈 문법 컴파일 검증 절차를 공식 표준 라이브러리 문서와 맞췄습니다." },
  { id: "python-sys-version-doc", repository: "Python", path: "library/sys.html#sys.version_info", publicUrl: "https://docs.python.org/3/library/sys.html#sys.version_info", usedFor: ["런타임 버전 정보", "parser 경계 비교"], evidence: "런타임 버전 정보와 parser 문법 호환이 서로 다른 단계임을 설명하는 근거로 사용했습니다." },
);
