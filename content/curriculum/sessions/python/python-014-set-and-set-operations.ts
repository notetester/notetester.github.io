import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-014"],
  slug: "python-014-set-and-set-operations",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 14,
  title: "집합과 집합 연산",
  subtitle: "고유한 hashable 값의 membership을 빠르게 검사하고, 교집합·합집합·차집합·부분집합으로 데이터 관계를 표현합니다.",
  level: "기초",
  estimatedMinutes: 105,
  coreQuestion: "순서와 중복보다 ‘어떤 값이 포함되고 서로 어떻게 겹치는가’가 중요할 때 set을 어떻게 사용해야 할까요?",
  summary: "set의 고유성·비인덱싱·hashable 요소 조건과 빈 집합 문법을 확인합니다. &·|·-·^, subset·superset·disjoint 관계, add·update·remove·discard·pop을 실제 권한·태그 예제로 실행하고, 중복 제거 시 순서 손실·비결정 출력·frozenset·입력 크기와 보안 정책까지 다룹니다.",
  objectives: [
    "set의 고유 값·비순서·hashable 요소 계약을 list·dict와 비교할 수 있다.",
    "빈 set과 빈 dict 문법을 정확히 구분하고 iterable에서 set을 만들 수 있다.",
    "교집합·합집합·차집합·대칭차집합과 부분집합 관계를 업무 질문으로 번역할 수 있다.",
    "add·update와 remove·discard·pop·clear의 입력·실패·반환 계약을 구분할 수 있다.",
    "중복 제거에서 순서가 필요한 경우 dict.fromkeys 같은 대안을 선택할 수 있다.",
    "frozenset과 size 제한, 비결정 순서, 민감 권한 집합의 검증을 설명할 수 있다.",
  ],
  prerequisites: [
    { title: "딕셔너리 조회와 수정", reason: "set과 dict key는 hash table과 고유·hashable key 개념을 공유합니다.", sessionSlug: "python-013-dictionary-access-iteration-update" },
    { title: "리스트 생성과 membership", reason: "순서·중복을 보존하는 list와 고유 membership 중심 set을 비교합니다.", sessionSlug: "python-010-list-creation-nesting-mutability" },
  ],
  keywords: ["Python", "set", "frozenset", "intersection", "union", "difference", "symmetric difference", "subset", "membership", "deduplication"],
  chapters: [
    {
      id: "set-model",
      title: "set은 고유한 hashable 요소의 모음입니다",
      lead: "{1,3,5}는 위치가 아니라 포함 여부를 중심으로 설계된 mutable set이며 같은 값은 한 번만 남습니다.",
      explanations: [
        "원본 s2={1,3,5,7,9,2,3,4,5,6,7}에는 중복 리터럴이 있지만 결과에는 각 정수가 한 번만 있습니다. set은 중복 횟수를 보존하지 않으므로 빈도 분석에는 Counter나 dict가 필요합니다.",
        "set은 정해진 인덱스 순서를 계약하지 않아 s[0]이 없습니다. 출력이 정렬된 것처럼 보이는 작은 정수 예제에 의존하면 안 됩니다. 실행·버전·hash randomization에 따라 순회 표현이 달라질 수 있습니다. 표시 순서가 필요하면 sorted(set_value)로 새 list를 만듭니다.",
        "요소는 hashable이어야 합니다. int·str·적절한 tuple은 가능하지만 list·dict·set 자체는 mutable이라 요소가 될 수 없습니다. 집합을 집합의 요소로 넣어야 하면 frozenset을 사용합니다.",
      ],
      concepts: [
        { term: "고유성", definition: "동등한 요소를 여러 번 추가해도 집합에는 하나만 존재하는 특성입니다.", detail: ["중복 제거와 membership 모델에 적합합니다.", "중복 횟수 정보는 사라집니다."] },
        { term: "비순서 계약", definition: "요소가 특정 인덱스 순서에 있다는 보장을 API 의미로 제공하지 않는 특성입니다.", detail: ["순회는 가능하지만 위치 접근은 없습니다.", "결정적인 출력은 별도 sorted 단계가 필요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "TypeError: 'set' object is not subscriptable가 발생한다.", likelyCause: "set을 list처럼 정수 인덱싱했습니다.", checks: ["데이터에서 순서·위치가 실제로 필요한지 확인합니다.", "특정 값 존재를 물으려던 것인지 membership으로 바꿀 수 있는지 봅니다.", "표시만 정렬할지 저장 구조도 순서가 필요한지 결정합니다."], fix: "존재 검사는 in, 순회는 for, 결정적 표시·위치는 sorted 결과 list를 사용합니다.", prevention: "컨테이너 선택 시 순서·중복·조회 요구를 표로 작성합니다." },
      ],
    },
    {
      id: "construction-deduplication",
      title: "빈 집합과 중복 제거의 정보 손실을 확인합니다",
      lead: "{}는 빈 dict이고 빈 set은 set()입니다. list를 set으로 바꾸면 중복뿐 아니라 원래 순서 계약도 잃습니다.",
      explanations: [
        "empty={}의 type은 dict, empty=set()의 type은 set입니다. 중괄호 리터럴에서 key:value가 있으면 dict, 값만 쉼표로 나열하면 set이지만 값이 하나도 없는 경우 {}는 역사적으로 dict입니다.",
        "set([1,3,1,2])는 고유 {1,2,3}을 만들 수 있지만 첫 등장 순서를 보존하는 중복 제거가 목적이면 list(dict.fromkeys(values))가 더 명확합니다. 값들이 hashable해야 한다는 조건은 둘 다 같습니다.",
        "문자열을 set으로 만들면 고유 문자 집합이 됩니다. 단어 목록 하나를 담으려면 {'Python'}, 문자 종류가 필요하면 set('Python')입니다. iterable의 요소 단위를 확인합니다.",
      ],
      concepts: [
        { term: "중복 제거", definition: "동등한 값의 여러 발생을 하나로 축약하는 변환입니다.", detail: ["set은 순서·횟수를 보존하지 않습니다.", "첫 등장 순서가 필요하면 dict key 순서를 활용할 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "set-construction-dedup",
          title: "중복 제거와 순서 보존 대안 비교",
          language: "python",
          filename: "set_dedup.py",
          purpose: "set 변환이 어떤 정보를 보존·손실하는지 list와 dict.fromkeys 결과로 비교합니다.",
          code: "values = ['Python', 'Java', 'Python', 'React', 'Java']\nunique_set = set(values)\nunique_in_order = list(dict.fromkeys(values))\n\nprint(len(values), len(unique_set))\nprint(sorted(unique_set))\nprint(unique_in_order)\nprint('Python' in unique_set)\n\nempty_braces = {}\nempty_set = set()\nprint(type(empty_braces).__name__, type(empty_set).__name__)\nprint(sorted(set('hello')))",
          walkthrough: [
            { lines: "1", explanation: "중복과 첫 등장 순서를 가진 원본 list를 준비합니다." },
            { lines: "2", explanation: "set이 고유 값만 유지하고 순서 의미를 버립니다." },
            { lines: "3", explanation: "dict.fromkeys가 첫 삽입 key 순서를 유지해 고유 list를 만듭니다." },
            { lines: "5-8", explanation: "원본 5개가 고유 3개가 되고, 출력 결정성을 위해 set은 sorted합니다." },
            { lines: "10-12", explanation: "{}와 set()의 타입 차이를 확인합니다." },
            { lines: "13", explanation: "문자열 iterable이 제공한 고유 문자를 sorted list로 투영해 출력 순서를 결정적으로 고정합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "set_dedup.py를 저장"], command: "python set_dedup.py" },
          output: { value: "5 3\n['Java', 'Python', 'React']\n['Python', 'Java', 'React']\nTrue\ndict set\n['e', 'h', 'l', 'o']", explanation: ["sorted set은 사전식 결정 순서, dict 방식은 첫 등장 순서입니다.", "중복 제거 후 횟수 2라는 정보는 두 결과 모두 보존하지 않습니다.", "마지막 문자열 set도 sorted list로 바꿔 어떤 hash seed에서도 exact output을 유지합니다."] },
          experiments: [
            { change: "values에 ['A'] 같은 unhashable list를 요소로 넣습니다.", prediction: "set과 dict.fromkeys 모두 TypeError입니다.", result: "고유 key 방식은 요소가 hashable이어야 합니다." },
            { change: "마지막 줄을 print(set('hello'))로 되돌립니다.", prediction: "표현 순서가 실행별 hash seed에 따라 달라질 수 있습니다.", result: "저장 의미와 표시 순서를 분리해야 하는 이유를 확인합니다." },
          ],
          sourceRefs: ["py-set-basic", "py-day03-note"],
        },
      ],
      diagnostics: [
        { symptom: "빈 set을 {}로 만들었는데 add 메서드가 없다.", likelyCause: "{}가 set이 아니라 dict를 만들었습니다.", checks: ["type(value)을 확인합니다.", "빈 리터럴인지 요소가 있는지 봅니다.", "필요한 컨테이너가 mapping인지 set인지 정합니다."], fix: "빈 set은 set()을 사용합니다.", prevention: "빈 컬렉션 생성의 type을 작은 테스트로 확인합니다." },
        { symptom: "TypeError: unhashable type가 set 생성·add에서 발생한다.", likelyCause: "list·dict·set 같은 mutable 값을 요소로 사용했습니다.", checks: ["문제 요소 type과 중첩을 확인합니다.", "고유 식별자만 set에 넣을 수 있는지 봅니다.", "불변 tuple/frozenset 변환 의미가 맞는지 검토합니다."], fix: "불변 식별자 또는 hashable 표현을 사용합니다.", prevention: "set 요소 타입을 구체화하고 경계 입력을 검증합니다." },
      ],
    },
    {
      id: "membership-performance",
      title: "set은 반복 membership과 고유성 검사에 강합니다",
      lead: "list가 앞에서부터 비교하는 반면 set은 hash를 사용해 평균적으로 빠른 존재 검사를 제공합니다.",
      explanations: [
        "allowed={'read','write'}에서 action in allowed는 평균 O(1) lookup입니다. 많은 요청에서 같은 허용 목록을 확인할 때 list보다 적합합니다. 요소 hash 계산과 equality 계약은 정확해야 합니다.",
        "평균 O(1)은 모든 상황의 절대 상수가 아닙니다. hash 충돌, 큰 객체 hash 비용, 메모리 overhead가 있습니다. 데이터가 아주 작고 순서가 중요하면 list가 더 단순할 수 있습니다.",
        "membership 대상이 외부에서 온 객체라면 타입과 정규화를 먼저 적용합니다. 'ADMIN'과 'admin', Unicode 유사 문자를 같은 것으로 볼지 정책이 필요합니다. 권한 검사는 단순 lower만으로 끝내지 않고 허용된 canonical ID를 사용합니다.",
      ],
      concepts: [
        { term: "hash lookup", definition: "요소의 hash를 바탕으로 후보 위치를 좁혀 동등성을 확인하는 검색 방식입니다.", detail: ["set·dict의 평균 빠른 lookup 기반입니다.", "hash와 equality가 일관되어야 합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: ["사용자 정의 객체의 __eq__를 정의하면서 __hash__ 계약을 어기면 set에서 찾기·중복 판단이 깨질 수 있습니다."],
    },
    {
      id: "set-algebra",
      title: "교집합·합집합·차집합·대칭차집합으로 관계를 계산합니다",
      lead: "집합 연산은 ‘둘 다’, ‘하나라도’, ‘왼쪽에만’, ‘한쪽에만’이라는 업무 질문을 직접 표현합니다.",
      explanations: [
        "a&b 또는 a.intersection(b)는 공통 요소, a|b 또는 union은 어느 쪽이든 있는 요소, a-b 또는 difference는 a에만 있는 요소입니다. 차집합은 방향이 있어 a-b와 b-a가 다릅니다.",
        "a^b 또는 symmetric_difference는 한쪽에만 있고 둘 모두에는 없는 요소입니다. 두 버전의 기능 차이, 변경된 권한, 태그 변화를 찾을 때 유용합니다.",
        "연산자 형태는 양쪽이 set 계열이어야 하는 경우가 많지만 메서드는 iterable을 받을 수 있습니다. 일관성과 타입 명확성을 위해 경계에서 set으로 변환하는 편이 읽기 좋습니다.",
        "교집합을 여러 set에 적용할 때 가장 작은 set부터 검사하면 구현이 최적화할 수 있지만, 먼저 정확한 의미를 확인합니다. 빈 집합과의 교집합은 빈 집합, 합집합은 다른 집합과 같습니다.",
      ],
      concepts: [
        { term: "교집합", definition: "모든 대상 집합에 동시에 포함된 요소의 집합입니다.", detail: ["& 또는 intersection을 사용합니다.", "공통 권한·공통 태그 질문을 표현합니다."] },
        { term: "대칭차집합", definition: "두 집합 중 정확히 한쪽에만 포함된 요소의 집합입니다.", detail: ["^ 또는 symmetric_difference를 사용합니다.", "버전 간 추가·제거 전체 변화를 찾습니다."] },
      ],
      codeExamples: [
        {
          id: "permission-set-algebra",
          title: "요청 권한과 허용 권한의 관계 계산",
          language: "python",
          filename: "permission_sets.py",
          purpose: "원본 숫자 집합 연산을 실제 허용·요청·보유 권한 질문으로 바꿉니다.",
          code: "allowed = {'read', 'write', 'comment'}\nrequested = {'read', 'delete'}\nowned = {'read', 'comment', 'admin'}\n\nprint('허용 요청:', sorted(requested & allowed))\nprint('거부 요청:', sorted(requested - allowed))\nprint('모든 관련:', sorted(requested | owned))\nprint('보유하지만 기본 아님:', sorted(owned - allowed))\nprint('서로 다른 권한:', sorted(allowed ^ owned))\nprint(requested <= allowed)\nprint(allowed.isdisjoint({'billing'}))",
          walkthrough: [
            { lines: "1-3", explanation: "세 집합에 canonical 권한 ID를 담습니다." },
            { lines: "5", explanation: "요청과 허용의 교집합은 실제 허용 가능한 read입니다." },
            { lines: "6", explanation: "요청-허용 차집합은 거부해야 할 delete입니다." },
            { lines: "7-9", explanation: "합집합·방향 차집합·대칭차집합으로 서로 다른 관계를 계산합니다." },
            { lines: "10", explanation: "requested가 allowed의 부분집합인지 검사해 전체 요청 허용 여부를 bool로 얻습니다." },
            { lines: "11", explanation: "billing 집합과 공통이 전혀 없는지 isdisjoint로 확인합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "permission_sets.py를 저장"], command: "python permission_sets.py" },
          output: { value: "허용 요청: ['read']\n거부 요청: ['delete']\n모든 관련: ['admin', 'comment', 'delete', 'read']\n보유하지만 기본 아님: ['admin']\n서로 다른 권한: ['admin', 'write']\nFalse\nTrue", explanation: ["sorted는 표시 결정성만 제공하며 연산 결과 자체는 set입니다.", "차집합 방향에 따라 거부 요청과 추가 보유 권한이 달라집니다.", "부분집합 False가 요청 전체를 허용할 수 없음을 요약합니다."] },
          experiments: [
            { change: "requested에서 delete를 제거합니다.", prediction: "requested<=allowed가 True, 거부 요청이 빈 list입니다.", result: "부분집합이 전체 허용 조건을 직접 표현합니다." },
            { change: "allowed & []를 실행합니다.", prediction: "연산자 &는 list와 직접 지원되지 않아 TypeError입니다.", result: "intersection([]) 메서드 또는 set 변환과의 계약 차이를 확인합니다." },
          ],
          sourceRefs: ["py-set-basic", "py-day03-note"],
        },
      ],
      diagnostics: [
        { symptom: "TypeError: unsupported operand type(s) for +: 'set' and 'set'가 발생한다.", likelyCause: "list 연결처럼 set + set을 사용했습니다.", checks: ["목적이 합집합인지 요소 추가인지 정합니다.", "두 대상 type을 확인합니다.", "중복·순서 요구를 다시 검토합니다."], fix: "합집합은 | 또는 union, in-place 확장은 update를 사용합니다.", prevention: "자료구조별 연산자 의미를 테스트와 문서로 구분합니다." },
      ],
    },
    {
      id: "relations-subsets",
      title: "부분집합·상위집합·서로소 관계를 bool로 묻습니다",
      lead: "a<=b는 a의 모든 요소가 b에 있는지, a<b는 진부분집합인지, isdisjoint는 공통 요소가 전혀 없는지 검사합니다.",
      explanations: [
        "required<=granted는 필요한 권한을 모두 보유했는지 표현합니다. <는 같지 않은 진부분집합이고 <=는 같은 집합도 True입니다. 요구사항의 ‘포함’과 ‘엄격히 더 작음’을 구분합니다.",
        "a>=b와 issuperset은 반대 방향 관계입니다. 변수 이름을 required,granted처럼 구체화하면 방향 실수를 줄입니다. 테스트에 같은 집합·빈 집합·일부 누락을 포함합니다.",
        "isdisjoint는 금지 조합이 하나도 없는지 확인하는 데 유용합니다. 다만 권한 정책은 역할 상속·조건·리소스 범위가 있어 단순 문자열 set만으로 충분한지 검토합니다.",
      ],
      concepts: [
        { term: "부분집합", definition: "한 집합의 모든 요소가 다른 집합에 포함되는 관계입니다.", detail: ["<= 또는 issubset을 사용합니다.", "빈 집합은 모든 집합의 부분집합입니다."] },
        { term: "서로소(disjoint)", definition: "두 집합의 교집합이 빈 집합인 관계입니다.", detail: ["isdisjoint로 직접 검사합니다.", "금지 태그·충돌 그룹 검증에 유용합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
    },
    {
      id: "mutation-apis",
      title: "add·update는 추가 단위, remove·discard는 누락 정책이 다릅니다",
      lead: "add는 한 요소, update는 iterable 여러 요소를 추가하며 remove는 누락 오류, discard는 누락을 조용히 허용합니다.",
      explanations: [
        "s.add(11)는 int 하나를 추가하고 이미 있으면 아무 변화가 없습니다. s.update([2,4],{6})는 iterable의 각 요소를 in-place 합칩니다. 문자열 update는 문자 단위로 펼쳐지므로 한 단어는 add를 사용합니다.",
        "remove(value)는 없으면 KeyError, discard(value)는 없어도 정상입니다. 반드시 존재해야 하는 상태 전환이면 remove가 불변식 위반을 드러내고, 멱등 삭제 API라면 discard가 자연스럽습니다.",
        "pop은 임의의 요소를 제거·반환하며 마지막·첫 요소 의미가 없습니다. 어떤 요소를 처리할지 순서가 필요하면 set을 queue로 쓰지 않습니다. 빈 set pop은 KeyError입니다. clear는 같은 set 객체를 비웁니다.",
        "intersection_update, difference_update, symmetric_difference_update는 같은 set을 변경합니다. 원본 보존이 필요한지 연산자 새 set이 필요한지 결정합니다.",
      ],
      concepts: [
        { term: "멱등 삭제", definition: "같은 삭제 요청을 여러 번 적용해도 최종 상태와 성공 계약이 유지되는 동작입니다.", detail: ["discard는 대상 부재를 오류로 만들지 않습니다.", "remove는 대상 존재가 불변식일 때 적합합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "KeyError가 set.remove 또는 pop에서 발생한다.", likelyCause: "remove 대상이 없거나 빈 set을 pop했습니다.", checks: ["대상 in set과 현재 크기를 확인합니다.", "누락이 정상인 멱등 삭제인지 불변식 오류인지 결정합니다.", "동시 변경으로 먼저 제거됐는지 검토합니다."], fix: "누락 허용이면 discard, 필수 존재면 구체 오류로 처리하고 pop 전 빈 상태를 검사합니다.", prevention: "존재·부재·중복 삭제·빈 pop 테스트를 둡니다." },
      ],
    },
    {
      id: "frozenset-modeling-boundaries",
      title: "frozenset과 도메인 계약으로 집합을 고정합니다",
      lead: "frozenset은 변경 메서드가 없는 불변 집합으로 dict key·다른 set 요소·불변 권한 묶음에 사용할 수 있습니다.",
      explanations: [
        "frozenset({'read','write'})은 add·remove할 수 없고 요소가 hashable이면 자신도 hashable입니다. 순서 없는 조합 자체를 key로 쓰는 캐시와 그래프 edge 표현에 유용합니다. tuple은 순서를 구분하지만 frozenset은 {'A','B'}와 {'B','A'}가 같습니다.",
        "외부 배열을 set으로 바꾸기 전에 최대 항목 수·요소 타입·길이와 canonicalization을 검증합니다. 중복 제거가 악성 입력 크기 자체를 없애 주는 것은 아니며 모든 값을 먼저 읽고 hash해야 합니다.",
        "권한 집합은 문자열 오타를 새 권한처럼 받아들일 수 있습니다. Enum·허용 set과 비교해 unknown=requested-allowed를 거부합니다. 사용자 제공 admin 문자열을 단순 union해 권한을 부여하지 않습니다.",
        "set 순서를 JSON list로 직렬화하면 출력이 실행마다 달라 캐시·테스트·서명에 문제를 줍니다. 경계에서는 sorted canonical list로 변환하고 정렬 규칙을 버전 계약으로 고정합니다.",
      ],
      concepts: [
        { term: "frozenset", definition: "요소 추가·삭제가 불가능한 불변 집합 타입입니다.", detail: ["요소가 hashable이면 frozenset도 hashable합니다.", "집합의 순서 없는 의미를 유지하며 key로 쓸 수 있습니다."] },
        { term: "canonical serialization", definition: "동일한 의미의 값을 항상 같은 순서·형식으로 직렬화하는 규칙입니다.", detail: ["set은 보통 sorted list로 경계 변환합니다.", "서명·캐시 key·snapshot 테스트의 결정성을 높입니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "고유 값을 어떤 구조로 보관할까요?", options: [
          { name: "set", chooseWhen: "변경 가능한 고유 membership과 집합 연산이 핵심일 때", avoidWhen: "순서·중복 횟수·hash key가 필요할 때", tradeoffs: ["빠른 평균 lookup입니다.", "순서를 보장하지 않습니다.", "mutable라 자신은 다른 set 요소가 될 수 없습니다."] },
          { name: "frozenset", chooseWhen: "고정된 순서 없는 조합을 key·값으로 공유할 때", avoidWhen: "요소를 계속 추가·삭제해야 할 때", tradeoffs: ["불변·hash 가능할 수 있습니다.", "집합 연산 결과를 만들 수 있습니다.", "변경은 새 frozenset 생성입니다."] },
        ] },
      ],
      expertNotes: ["비결정 set 순서를 snapshot 테스트에 그대로 쓰지 말고 의미에 맞는 정렬 key로 canonicalize합니다.", "hash 기반 자료구조에 공격자 제어 객체를 넣는 경우 입력 크기와 사용자 정의 hash 비용을 제한합니다."],
    },
  ],
  lab: {
    title: "역할 기반 권한 차이 분석기",
    scenario: "기본·관리자·사용자 요청 권한을 set으로 모델링하고 허용·거부·누락·추가 권한을 계산한 뒤 결정적인 보고서를 만듭니다.",
    setup: ["permission_lab.py를 만듭니다.", "허용 권한 canonical set과 역할별 frozenset을 준비합니다.", "Python 3.11 이상에서 실행합니다."],
    steps: ["unknown=requested-allowed로 알 수 없는 권한을 먼저 거부합니다.", "required<=granted로 필수 권한 충족을 검사합니다.", "두 역할의 공통·차이·대칭차를 계산합니다.", "금지 권한과 isdisjoint를 사용해 충돌을 검사합니다.", "모든 보고 set을 sorted list로 직렬화합니다.", "같은 삭제 요청을 remove와 discard로 반복해 계약을 비교합니다.", "1만 개 외부 입력과 긴 문자열 key의 최대 크기 제한을 추가합니다."],
    expectedResult: ["허용·거부·누락 권한이 방향이 명확한 set 식으로 계산됩니다.", "보고서 순서가 실행마다 결정적입니다.", "unknown admin 권한이 union으로 조용히 승인되지 않습니다.", "멱등 삭제와 필수 존재 삭제의 차이가 드러납니다."],
    cleanup: ["실제 시스템 권한이 아닌 합성 문자열만 사용합니다."],
    extensions: ["권한 ID를 Enum으로 바꿉니다.", "역할 조합 frozenset을 캐시 key로 사용합니다.", "리소스 범위가 있는 권한 모델에서 단순 set의 한계를 문서화합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "두 숫자 집합의 모든 연산과 타입을 출력하세요.", requirements: ["&, |, -, ^와 메서드 버전을 사용합니다.", "a-b와 b-a를 비교합니다.", "부분집합·서로소 결과를 출력합니다."], hints: ["출력 결정성이 필요하면 sorted를 사용합니다.", "차집합은 방향이 있습니다."], expectedOutcome: "집합 관계를 결과 값·타입·업무 문장으로 설명합니다.", solutionOutline: ["겹치는 두 set을 만듭니다.", "각 연산 결과를 sorted합니다.", "관계 bool을 별도 출력합니다."] },
    { difficulty: "응용", prompt: "순서를 보존하는 태그 중복 제거기를 만드세요.", requirements: ["set 변환과 dict.fromkeys 결과를 비교합니다.", "대소문자 정규화하면서 첫 표시 원본을 보존합니다.", "빈 값·unhashable 값·1만 개 입력을 처리합니다.", "중복 횟수가 필요할 때 Counter 대안을 설명합니다."], hints: ["정규화 key와 표시 value를 분리한 dict를 고려합니다.", "set만으로 첫 원본 표시를 보존하기 어렵습니다."], expectedOutcome: "중복 제거의 정보 손실과 순서 정책이 명시된 함수가 완성됩니다." },
    { difficulty: "설계", prompt: "콘텐츠 추천의 관심사 집합 모델을 설계하세요.", requirements: ["사용자·콘텐츠 태그의 교집합 점수와 차집합을 정의합니다.", "태그 ontology·동의어·대소문자 canonicalization을 다룹니다.", "순서·가중치가 필요한 경우 set 한계를 분석합니다.", "입력 크기·비결정 직렬화·민감 관심사 로그 정책을 포함합니다.", "최소 10개 관계 테스트를 작성합니다."], hints: ["단순 교집합 크기는 모든 태그 가중치가 같다고 가정합니다.", "결정적 API 응답은 sorted canonical list로 만듭니다."], expectedOutcome: "set 연산을 실제 추천 관계·가중치·개인정보 계약으로 확장합니다." },
  ],
  reviewQuestions: [
    { question: "빈 set을 왜 {}로 만들 수 없나요?", answer: "{} 문법은 빈 dict에 예약되어 있어 빈 set은 set()을 사용합니다." },
    { question: "set으로 중복 제거하면 어떤 정보가 사라지나요?", answer: "각 값의 중복 횟수와 원래 순서 계약이 사라집니다." },
    { question: "a-b와 b-a는 왜 다른가요?", answer: "차집합은 왼쪽에만 있는 요소를 선택하는 방향성 연산이기 때문입니다." },
    { question: "대칭차집합은 무엇을 반환하나요?", answer: "정확히 한쪽 집합에만 있고 두 집합 공통에는 없는 요소를 반환합니다." },
    { question: "remove와 discard의 차이는 무엇인가요?", answer: "없는 요소에서 remove는 KeyError, discard는 아무 변화 없이 정상입니다." },
    { question: "set.pop에서 어떤 요소가 나오나요?", answer: "임의 요소이며 첫·마지막 순서 계약이 없습니다. 순서 처리에는 다른 구조가 필요합니다." },
    { question: "frozenset은 언제 유용한가요?", answer: "변하지 않는 순서 없는 조합을 dict key나 다른 set 요소로 사용할 때 유용합니다." },
  ],
  completionChecklist: [
    "set의 고유성·비인덱싱·hashable 요소 조건을 설명할 수 있다.",
    "빈 set과 dict, set(iterable)의 요소 단위를 구분할 수 있다.",
    "교집합·합집합·방향 차집합·대칭차집합을 사용할 수 있다.",
    "부분집합·상위집합·서로소 관계를 업무 조건으로 번역할 수 있다.",
    "add·update·remove·discard·pop의 입력·실패 계약을 구분한다.",
    "순서 보존 중복 제거와 결정적 직렬화 대안을 선택할 수 있다.",
    "frozenset·허용 목록·크기 제한으로 집합 경계를 설계할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-set-basic", repository: "PYTHON-BASIC", path: "day03/ex03_set.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day03/ex03_set.py", usedFor: ["set 특성", "중복 제거", "집합 연산", "add·remove·update", "list·tuple 비교"], evidence: "Python 3.13.9에서 원본을 실행해 고유 정수, &·|·양방향 -, 메서드 결과, add/remove와 update 합집합을 확인했습니다. set 출력 순서는 환경 의존으로 분리했습니다." },
    { id: "py-day03-note", repository: "PYTHON-BASIC", path: "notes/day03_collection_control.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day03_collection_control.md", usedFor: ["set 요약", "집합 연산", "중복·인덱스 차이", "셀프 체크"], evidence: "원본 노트를 기준으로 대칭차·관계·frozenset·결정적 직렬화·권한 보안을 보강했습니다." },
  ],
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["Counter 빈도 분석은 py-034에서 다룹니다.", "frozenset·권한 모델·hash 계약과 자원 제한은 원본 공백을 전문가 관점으로 보강했습니다."] },
} satisfies DetailedSession;

const expertChapters: DetailedSession["chapters"] = [
  {
    id: "set-hashability-frozenset-nested-keys",
    title: "hashability와 frozenset으로 불변 집합 값을 모델링합니다",
    lead: "set 요소는 hash table 안에서 lifetime 동안 위치를 다시 찾을 수 있어야 하므로 hashable해야 하며, 집합 자체를 요소·dict key로 쓰려면 frozenset이 필요합니다.",
    explanations: [
      "list, dict, set은 내용이 바뀌어 equality/hash 의미가 달라질 수 있으므로 표준적으로 unhashable입니다. set에 list를 add하면 TypeError입니다.",
      "tuple은 모든 요소가 hashable할 때만 hashable합니다. tuple 안에 list가 있으면 바깥이 불변이어도 set 요소가 될 수 없습니다.",
      "frozenset은 mutation API가 없는 hashable set variant입니다. frozenset을 set 요소나 dict key로 사용해 권한 조합·undirected edge처럼 순서 없는 값을 표현할 수 있습니다.",
      "set과 frozenset equality는 요소 기준이며 insertion order와 무관합니다. 같은 요소면 생성 순서가 달라도 같습니다.",
      "hash 가능하다는 사실이 안전한 cache key라는 뜻은 아닙니다. domain equality, namespace/version과 process 간 serialization representation을 함께 정의해야 합니다.",
    ],
    concepts: [
      { term: "frozenset", definition: "요소를 변경할 수 없고 자신도 hashable할 수 있는 불변 set type입니다.", detail: ["nested set/key에 사용합니다.", "요소 자체도 hashable해야 합니다."] },
      { term: "hash stability", definition: "객체가 hash table에 있는 동안 hash와 equality 결과가 변하지 않는 불변식입니다.", detail: ["mutable key를 금지합니다.", "lookup 정확성의 기반입니다."] },
    ],
    codeExamples: [{
      id: "set-hashability-frozenset-evidence",
      title: "mutable 요소 실패와 nested frozenset 성공을 검증합니다",
      language: "python",
      filename: "set_hashability.py",
      purpose: "set/list/frozenset의 hashability 경계와 순서 없는 equality를 exact output으로 확인합니다.",
      code: String.raw`for value in (["python"], {"python"}, {"course": "python"}):
    try:
        {value}
    except TypeError as error:
        print("unhashable:", type(value).__name__, type(error).__name__)

roles = frozenset({"reader", "editor"})
cache = {roles: "policy-v1"}
print("lookup:", cache[frozenset({"editor", "reader"})])

groups = {frozenset({"alice", "bob"}), frozenset({"cara"})}
print("groups:", sorted((sorted(group) for group in groups), key=lambda group: (len(group), group)))
print("order_independent:", frozenset([1, 2, 3]) == frozenset([3, 2, 1]))

try:
    hash(("course", ["python"]))
except TypeError as error:
    print("tuple_hash_error:", type(error).__name__)`,
      walkthrough: [
        { lines: "1-5", explanation: "list/set/dict를 set element로 만들 때 각각 TypeError가 나는 것을 type 수준으로 분류합니다." },
        { lines: "7-9", explanation: "frozenset key는 생성 순서가 달라도 같은 policy를 조회합니다." },
        { lines: "11-13", explanation: "nested frozensets는 raw set 순서 대신 정렬된 projection으로 결정적으로 출력합니다." },
        { lines: "15-18", explanation: "list를 포함한 tuple도 hashability를 얻지 못함을 확인합니다." },
      ],
      run: { environment: ["Python 3.13+", "hash seed와 무관한 정렬 출력"], command: "python -I -B set_hashability.py" },
      output: { value: "unhashable: list TypeError\nunhashable: set TypeError\nunhashable: dict TypeError\nlookup: policy-v1\ngroups: [['cara'], ['alice', 'bob']]\norder_independent: True\ntuple_hash_error: TypeError", explanation: ["raw set repr를 golden output으로 사용하지 않습니다.", "frozenset equality는 요소와 hash 계약에 기반합니다."] },
      experiments: [
        { change: "roles를 mutable set으로 cache key에 넣습니다.", prediction: "TypeError가 납니다.", result: "frozenset으로 불변 key 의도를 표현합니다." },
        { change: "frozenset 요소에 list를 넣습니다.", prediction: "요소 list가 unhashable이라 여전히 TypeError입니다.", result: "불변성은 object graph 전체를 봐야 합니다." },
        { change: "hash(roles) 숫자를 exact output으로 검증합니다.", prediction: "process/hash seed에 따라 달라질 수 있습니다.", result: "lookup/equality behavior만 결정적으로 검증합니다." },
      ],
      sourceRefs: ["py-set-frozenset", "py-hashable-glossary", "py-datamodel-hash"],
    }],
    diagnostics: [
      { symptom: "set에 list를 추가할 때 unhashable type 오류가 난다.", likelyCause: "mutable list를 hash table element로 사용했습니다.", checks: ["element type과 nested mutable fields를 봅니다.", "순서·중복이 domain에서 필요한지 확인합니다."], fix: "순서가 의미 있으면 tuple, 순서 없는 집합 값이면 frozenset으로 검증·변환합니다.", prevention: "container boundary에 hashability/type tests를 둡니다." },
      { symptom: "frozenset을 썼는데도 nested value에서 TypeError가 난다.", likelyCause: "frozenset 내부 요소 자체가 unhashable입니다.", checks: ["각 nested element에 hash를 시도합니다.", "deep value graph를 inventory합니다."], fix: "모든 nested values를 domain에 맞는 immutable/hashable representation으로 바꿉니다.", prevention: "deep hashability와 equality contract tests를 둡니다." },
    ],
  },
  {
    id: "set-algebra-laws-permission-policy",
    title: "집합 대수와 관계 연산을 권한·태그 정책으로 해석합니다",
    lead: "&·|·-·^를 기호 암기에서 끝내지 않고 요청·허용·누락·초과 집합의 의미와 subset/disjoint 불변식으로 연결합니다.",
    explanations: [
      "intersection requested & allowed는 실제 허용 가능한 항목, difference requested - allowed는 금지된 초과 요청, allowed - requested는 아직 요청하지 않은 가능 항목입니다.",
      "union은 어느 쪽에든 있는 요소, symmetric difference는 한쪽에만 있는 요소입니다. 두 집합 변화의 전체 delta를 볼 때 ^가 유용합니다.",
      "requested <= allowed는 모든 요청 권한이 허용 범위 안인지 한 번에 묻고, isdisjoint는 금지 집합과 하나도 겹치지 않는지 확인합니다.",
      "operator forms는 보통 set-like operands를 요구하고 method forms는 arbitrary iterable을 받을 수 있습니다. API에서 type coercion을 숨기지 않습니다.",
      "권한 판정은 set 연산만으로 끝나지 않습니다. principal·resource·tenant·시간 context와 default-deny, audit를 결합해야 합니다.",
    ],
    concepts: [
      { term: "symmetric difference", definition: "두 집합 중 정확히 한쪽에만 존재하는 요소 집합입니다.", detail: ["변경 delta에 적합합니다.", "A ^ B로 표현합니다."] },
      { term: "subset invariant", definition: "요청 집합의 모든 요소가 허용 집합 안에 있어야 한다는 관계 조건입니다.", detail: ["requested <= allowed입니다.", "초과분은 requested - allowed입니다."] },
      { term: "disjoint", definition: "두 집합의 교집합이 비어 서로 겹치지 않는 관계입니다.", detail: ["forbidden overlap 검사에 씁니다.", "isdisjoint가 short-circuit할 수 있습니다."] },
    ],
    codeExamples: [{
      id: "permission-set-algebra-policy",
      title: "허용·거부·누락·delta 집합과 관계를 계산합니다",
      language: "python",
      filename: "permission_set_algebra.py",
      purpose: "집합 연산 결과를 정렬해 결정적으로 출력하고 default-deny 판정을 검증합니다.",
      code: String.raw`allowed = {"course:read", "course:write", "profile:read"}
requested = {"course:read", "course:delete", "profile:read"}
forbidden = {"admin:grant", "course:delete"}

granted = requested & allowed
denied = requested - allowed
unused = allowed - requested
delta = requested ^ allowed

print("granted:", sorted(granted))
print("denied:", sorted(denied))
print("unused:", sorted(unused))
print("delta:", sorted(delta))
print("subset:", requested <= allowed)
print("forbidden_disjoint:", requested.isdisjoint(forbidden))
print("decision:", "allow" if not denied and requested.isdisjoint(forbidden) else "deny")

print("method_iterable:", sorted(allowed.intersection(["course:read", "missing"])))
try:
    allowed & ["course:read"]
except TypeError as error:
    print("operator_type_error:", type(error).__name__)`,
      walkthrough: [
        { lines: "1-8", explanation: "허용·요청·금지 집합에서 granted, denied, unused와 symmetric delta를 계산합니다." },
        { lines: "10-16", explanation: "정렬된 결과와 subset/disjoint 관계로 default-deny 결정을 만듭니다." },
        { lines: "18-22", explanation: "intersection method는 list iterable을 받지만 & operator는 TypeError라는 operand 계약을 비교합니다." },
      ],
      run: { environment: ["Python 3.13+", "set 출력은 모두 sorted"], command: "python -I -B permission_set_algebra.py" },
      output: { value: "granted: ['course:read', 'profile:read']\ndenied: ['course:delete']\nunused: ['course:write']\ndelta: ['course:delete', 'course:write']\nsubset: False\nforbidden_disjoint: False\ndecision: deny\nmethod_iterable: ['course:read']\noperator_type_error: TypeError", explanation: ["정렬은 표현을 결정적으로 만들 뿐 set 의미를 바꾸지 않습니다.", "denied 또는 forbidden overlap이 있으면 deny합니다."] },
      experiments: [
        { change: "requested를 allowed의 부분집합으로 바꿉니다.", prediction: "denied는 empty이고 subset True입니다.", result: "forbidden overlap도 별도로 확인합니다." },
        { change: "difference 방향을 allowed - requested로 바꿉니다.", prediction: "거부된 요청이 아니라 사용하지 않은 허용 권한이 나옵니다.", result: "연산 방향에 domain 이름을 붙입니다." },
        { change: "권한 strings를 검증 없이 받습니다.", prediction: "오타·case 차이가 새로운 권한처럼 취급됩니다.", result: "canonical enum/registry allowlist가 필요합니다." },
      ],
      sourceRefs: ["py-set-operations", "py-set-relations", "py-operator-set"],
    }],
    diagnostics: [
      { symptom: "허용되지 않은 권한이 granted로 계산된다.", likelyCause: "difference 방향을 뒤집거나 union을 grant 계산에 사용했습니다.", checks: ["requested/allowed operand 이름과 방향을 표로 씁니다.", "denied = requested - allowed를 별도 확인합니다."], fix: "granted는 intersection, denied는 requested difference allowed로 명시합니다.", prevention: "empty/subset/overlap/disjoint decision table을 test합니다." },
      { symptom: "set operator에 list를 넣자 TypeError가 난다.", likelyCause: "operator와 method의 operand 수용 범위를 혼동했습니다.", checks: ["&인지 intersection인지 봅니다.", "입력 type coercion 의도를 확인합니다."], fix: "strict set operands를 유지하거나 method로 iterable 수용을 명시합니다.", prevention: "API type annotations와 operator/method tests를 둡니다." },
    ],
  },
  {
    id: "deduplication-order-frequency-boundary",
    title: "중복 제거에서 순서·빈도·canonicalization 정보 보존을 선택합니다",
    lead: "set으로 중복을 없애는 한 줄은 원래 순서와 발생 횟수를 잃습니다. 어떤 정보를 보존해야 하는지 먼저 결정한 뒤 구조를 선택합니다.",
    explanations: [
      "set(items)는 equality/hash 기준 고유값만 남기고 iteration order는 입력 order contract가 아닙니다. raw set repr를 파일·API·golden output에 사용하지 않습니다.",
      "첫 등장 순서를 보존한 dedup은 list(dict.fromkeys(items))로 표현할 수 있습니다. dict insertion order를 이용하며 hashable elements가 필요합니다.",
      "unhashable elements나 custom equivalence가 필요하면 seen keys와 output list를 분리하고 canonical key function을 사용합니다.",
      "빈도가 필요하면 set으로 가기 전에 Counter 또는 dict counts를 만들고 first index도 저장합니다. dedup 뒤에는 횟수를 복구할 수 없습니다.",
      "casefold/NFC 같은 canonicalization 기준으로 dedup하면 서로 다른 원본 표시가 하나로 합쳐집니다. 대표값을 first/last/preferred 중 무엇으로 선택할지 정책을 둡니다.",
    ],
    concepts: [
      { term: "order-preserving deduplication", definition: "동등한 항목의 첫 등장만 남기면서 입력 상대 순서를 유지하는 변환입니다.", detail: ["dict.fromkeys로 구현할 수 있습니다.", "hashable key가 필요합니다."] },
      { term: "representative selection", definition: "canonical key가 같은 여러 원본 중 결과에 남길 표시값을 고르는 정책입니다.", detail: ["first/last/preferred를 명시합니다.", "정보 손실을 기록합니다."] },
    ],
    codeExamples: [{
      id: "ordered-dedup-canonical-policy",
      title: "set dedup·첫 등장 보존·canonical 대표값을 비교합니다",
      language: "python",
      filename: "ordered_dedup.py",
      purpose: "고유값, 순서와 casefold 대표값 정책을 separate outputs로 검증합니다.",
      code: String.raw`items = ["Python", "java", "Python", "JSP", "java"]
print("set_sorted:", sorted(set(items)))
print("first_order:", list(dict.fromkeys(items)))

def dedup_by(values, key):
    seen = set()
    result = []
    for value in values:
        marker = key(value)
        if marker not in seen:
            seen.add(marker)
            result.append(value)
    return result

variants = ["Straße", "STRASSE", "Python", "PYTHON", "파이썬"]
print("casefold_first:", dedup_by(variants, str.casefold))

counts = {}
for item in items:
    counts[item] = counts.get(item, 0) + 1
print("counts:", counts)`,
      walkthrough: [
        { lines: "1-3", explanation: "set 결과는 정렬해 표시하고 dict.fromkeys 결과는 첫 등장 순서를 보존합니다." },
        { lines: "5-13", explanation: "seen canonical keys와 output values를 분리한 reusable order-preserving dedup을 구현합니다." },
        { lines: "15-21", explanation: "casefold 기준 first representative와 dedup 전 counts를 각각 출력합니다." },
      ],
      run: { environment: ["Python 3.13+", "hash seed에 무관한 출력"], command: "python -I -B ordered_dedup.py" },
      output: { value: "set_sorted: ['JSP', 'Python', 'java']\nfirst_order: ['Python', 'java', 'JSP']\ncasefold_first: ['Straße', 'Python', '파이썬']\ncounts: {'Python': 2, 'java': 2, 'JSP': 1}", explanation: ["set은 sorted projection으로만 출력합니다.", "casefold 중복에서는 첫 원본 spelling을 보존합니다."] },
      experiments: [
        { change: "대표값을 last로 선택합니다.", prediction: "STRASSE와 PYTHON이 결과에 남습니다.", result: "대표값 policy가 user-visible output을 바꿉니다." },
        { change: "NFC+casefold key를 사용합니다.", prediction: "canonical equivalent와 case variants가 함께 합쳐집니다.", result: "normalization policy version이 필요합니다." },
        { change: "nested list elements를 dict.fromkeys에 넣습니다.", prediction: "unhashable TypeError가 납니다.", result: "domain key 추출 또는 linear equality scan을 선택합니다." },
      ],
      sourceRefs: ["py-dict-fromkeys", "py-counter", "py-unicode-casefold"],
    }],
    diagnostics: [
      { symptom: "중복 제거 후 사용자 입력 순서가 바뀐다.", likelyCause: "set iteration을 입력 순서로 사용했습니다.", checks: ["set 변환과 raw repr/iteration을 찾습니다.", "first/last order 요구를 확인합니다."], fix: "first-order dedup에는 dict.fromkeys 또는 explicit seen/result를 사용합니다.", prevention: "order-sensitive repeated inputs를 test합니다." },
      { symptom: "dedup 뒤 occurrence count를 알 수 없다.", likelyCause: "빈도를 집계하기 전에 set으로 정보를 버렸습니다.", checks: ["pipeline에서 set 변환 위치를 찾습니다.", "count/first-index 요구를 확인합니다."], fix: "Counter/dict로 frequency metadata를 먼저 수집하고 필요하면 고유 projection을 만듭니다.", prevention: "pipeline별 정보 보존 표를 둡니다." },
    ],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...expertChapters);
session.reviewQuestions.push(
  { question: "set 요소가 hashable해야 하는 이유는 무엇인가요?", answer: "hash table에서 lifetime 동안 같은 bucket/equality로 다시 찾을 수 있어야 하기 때문입니다." },
  { question: "frozenset은 언제 사용하나요?", answer: "순서 없는 불변 집합 값을 다른 set 요소나 dict key로 사용할 때 적합합니다." },
  { question: "tuple이면 항상 set 요소가 될 수 있나요?", answer: "아닙니다. tuple 안의 모든 요소도 hashable해야 합니다." },
  { question: "requested - allowed의 의미는 무엇인가요?", answer: "요청했지만 허용 집합에 없는 거부 대상입니다." },
  { question: "symmetric difference는 무엇을 반환하나요?", answer: "두 집합 중 정확히 한쪽에만 있는 요소 전체를 반환합니다." },
  { question: "isdisjoint는 무엇을 묻나요?", answer: "두 집합이 하나의 공통 요소도 갖지 않는지 묻습니다." },
  { question: "set으로 dedup하면 어떤 정보를 잃나요?", answer: "입력 순서 contract와 occurrence frequency를 잃습니다." },
  { question: "첫 등장 순서를 보존하는 hashable dedup 방법은?", answer: "list(dict.fromkeys(items)) 또는 explicit seen/result pattern입니다." },
);
session.completionChecklist.push(
  "set 요소의 deep hashability를 확인한다.",
  "frozenset을 불변 집합 key로 사용할 수 있다.",
  "hash 값 자체를 golden output으로 쓰지 않는다.",
  "intersection·union·difference·symmetric difference를 domain 의미로 설명한다.",
  "subset·disjoint 관계로 default-deny 정책을 검증한다.",
  "operator와 method operand 계약을 구분한다.",
  "중복 제거 전 순서·빈도 보존 요구를 정한다.",
  "canonical dedup의 representative selection을 명시한다.",
);
session.sources.push(
  { id: "py-set-frozenset", repository: "Python 3 Library Reference", path: "Set Types — set, frozenset", publicUrl: "https://docs.python.org/3/library/stdtypes.html#set-types-set-frozenset", usedFor: ["hashable elements", "frozenset", "set operations"], evidence: "set/frozenset의 공식 type 계약입니다." },
  { id: "py-hashable-glossary", repository: "Python 3 Glossary", path: "hashable", publicUrl: "https://docs.python.org/3/glossary.html#term-hashable", usedFor: ["hash stability requirement"], evidence: "hashable의 공식 정의입니다." },
  { id: "py-datamodel-hash", repository: "Python 3 Language Reference", path: "object.__hash__", publicUrl: "https://docs.python.org/3/reference/datamodel.html#object.__hash__", usedFor: ["hash/equality invariant"], evidence: "hash protocol primary reference입니다." },
  { id: "py-set-operations", repository: "Python 3 Library Reference", path: "Set operations", publicUrl: "https://docs.python.org/3/library/stdtypes.html#set", usedFor: ["intersection/union/difference/symmetric difference"], evidence: "집합 연산 공식 계약입니다." },
  { id: "py-set-relations", repository: "Python 3 Library Reference", path: "Set comparisons and isdisjoint", publicUrl: "https://docs.python.org/3/library/stdtypes.html#set-types-set-frozenset", usedFor: ["subset/superset/disjoint"], evidence: "set 관계 연산의 공식 근거입니다." },
  { id: "py-operator-set", repository: "Python 3 Language Reference", path: "Binary bitwise operations", publicUrl: "https://docs.python.org/3/reference/expressions.html#binary-bitwise-operations", usedFor: ["&, |, ^ operator syntax"], evidence: "set에 overload되는 operator 문법의 primary reference입니다." },
  { id: "py-dict-fromkeys", repository: "Python 3 Library Reference", path: "dict.fromkeys", publicUrl: "https://docs.python.org/3/library/stdtypes.html#dict.fromkeys", usedFor: ["order-preserving dedup"], evidence: "dict.fromkeys 공식 API입니다." },
  { id: "py-counter", repository: "Python 3 Library Reference", path: "collections.Counter", publicUrl: "https://docs.python.org/3/library/collections.html#collections.Counter", usedFor: ["frequency preservation"], evidence: "빈도 mapping의 공식 API입니다." },
  { id: "py-unicode-casefold", repository: "Python 3 Library Reference", path: "str.casefold", publicUrl: "https://docs.python.org/3/library/stdtypes.html#str.casefold", usedFor: ["canonical dedup key"], evidence: "casefold의 공식 문자열 API입니다." },
);

export default session;
