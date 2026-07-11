import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-013"],
  slug: "python-013-dictionary-access-iteration-update",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 13,
  title: "딕셔너리 조회·순회·수정",
  subtitle: "키를 값의 의미 있는 주소로 사용하고, []·get의 실패 계약과 동적 view·삽입 순서·중복 키·안전한 갱신을 이해합니다.",
  level: "기초",
  estimatedMinutes: 115,
  coreQuestion: "키 기반 데이터를 조회하고 변경할 때 ‘키 없음’을 숨기지 않으면서 구조와 순서를 어떻게 안전하게 유지할까요?",
  summary: "dict의 hashable key와 값 매핑, 삽입 순서와 중복 키 덮어쓰기, []·get·in의 차이를 실행합니다. keys·values·items가 snapshot list가 아닌 동적 view라는 점, items 언패킹 순회, 대입·update·pop·del, 중첩 dict와 얕은 복사, 입력 검증·성능·보안 경계를 다룹니다.",
  objectives: [
    "dict를 key→value 매핑으로 설명하고 hashable key 조건을 말할 수 있다.",
    "[]·get·in을 필수 키와 선택 키 계약에 맞게 선택할 수 있다.",
    "keys·values·items view의 타입과 변경 반영 특성을 설명할 수 있다.",
    "items를 key,value로 언패킹해 순회하고 순회 중 구조 변경 오류를 피할 수 있다.",
    "키 대입·update·setdefault·pop·del의 변경·반환 계약을 비교할 수 있다.",
    "중첩 mapping과 얕은 복사, 입력 크기·키 충돌·민감정보 노출 경계를 검토할 수 있다.",
  ],
  prerequisites: [
    { title: "튜플·패킹·언패킹", reason: "items가 제공하는 (key,value) tuple을 두 이름으로 분해합니다.", sessionSlug: "python-012-tuple-packing-unpacking" },
    { title: "리스트 CRUD와 복사", reason: "mutable 컨테이너의 변경·alias·얕은 복사 계약을 dict에 적용합니다.", sessionSlug: "python-011-list-crud-sorting-copying" },
  ],
  keywords: ["Python", "dict", "mapping", "hashable", "KeyError", "get", "items", "dict view", "update", "setdefault"],
  chapters: [
    {
      id: "mapping-model",
      title: "dict는 고유 키를 값에 연결하는 가변 mapping입니다",
      lead: "list가 위치로 값을 찾는다면 dict는 name·age 같은 의미 있는 key로 값을 찾습니다.",
      explanations: [
        "{'name':'hong','age':24}에서 각 key는 고유하고 value는 어떤 Python 객체도 될 수 있습니다. key는 lookup 동안 hash가 안정적이어야 하므로 str·int·적절한 tuple은 가능하지만 list·dict는 직접 key가 될 수 없습니다.",
        "같은 key를 리터럴에 두 번 쓰면 마지막 값이 이전 값을 덮습니다. {'name':'kang','name':'Park'} 결과는 name:'Park' 하나입니다. 오류가 나지 않으므로 설정 파일의 중복을 반드시 탐지해야 한다면 일반 dict 생성 전 파서 단계가 필요합니다.",
        "현대 Python dict는 삽입 순서를 보존합니다. 기존 key의 값을 바꿔도 보통 원래 위치는 유지되고 삭제 후 다시 넣으면 끝으로 갑니다. 순서가 업무 계약이면 문서화하고, 단순히 우연한 출력 모양으로 의존하지 않습니다.",
      ],
      concepts: [
        { term: "mapping", definition: "고유 key를 해당 value에 연결하고 key로 값을 찾는 컨테이너 추상입니다.", detail: ["dict는 mutable mapping의 대표 구현입니다.", "list의 정수 위치와 달리 key는 도메인 의미를 표현할 수 있습니다."] },
        { term: "hashable key", definition: "수명 동안 안정적인 hash와 equality 계약을 제공해 dict 색인에 사용할 수 있는 객체입니다.", detail: ["str·int·불변 요소 tuple이 흔합니다.", "list처럼 내부 값이 바뀌는 객체는 key가 될 수 없습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "TypeError: unhashable type: 'list'가 key를 넣을 때 발생한다.", likelyCause: "변경 가능한 list를 dict key로 사용했습니다.", checks: ["문제 key의 type과 내부 요소를 확인합니다.", "순서가 있는 불변 복합 key인지 고유 ID가 필요한지 정합니다.", "tuple로 바꿔도 내부가 모두 hashable인지 봅니다."], fix: "의미에 맞는 tuple·str·int 또는 불변 식별자를 key로 사용합니다.", prevention: "key 타입을 타입 힌트와 입력 검증에 명시하고 hash 경계 테스트를 둡니다." },
      ],
    },
    {
      id: "lookup-contracts",
      title: "[]는 필수 키, get은 선택 키에 사용합니다",
      lead: "mapping[key]는 누락을 KeyError로 드러내고 get은 기본값을 반환합니다. 어느 실패가 정상인지 계약이 먼저입니다.",
      explanations: [
        "user['name']은 name이 반드시 있어야 한다는 기대를 표현합니다. 없으면 KeyError와 누락 key가 traceback에 보입니다. 예외를 잡아 도메인 오류로 바꾸거나 상위로 전달합니다.",
        "user.get('hobby')는 없으면 None, get('hobby','미입력')은 지정 기본값을 반환합니다. 그러나 실제 value가 None인 경우와 키가 없는 경우가 같아질 수 있습니다. 구분이 필요하면 key in user를 먼저 보거나 고유 sentinel=object()를 기본값으로 사용합니다.",
        "in은 dict에서 기본적으로 key membership입니다. 'name' in user는 key 확인이고 'hong' in user는 value 검색이 아닙니다. 값 membership이 필요하면 user.values()지만 중복과 선형 탐색 비용을 고려합니다.",
      ],
      concepts: [
        { term: "필수 키", definition: "구조 계약상 반드시 존재해야 하며 누락이 오류인 key입니다.", detail: ["[] 접근이 누락을 즉시 드러냅니다.", "API 경계에서 전체 필수 키를 먼저 검증할 수도 있습니다."] },
        { term: "선택 키", definition: "존재하지 않아도 정상이며 기본 동작이 정의된 key입니다.", detail: ["get으로 기본값을 표현할 수 있습니다.", "None 자체가 유효 값이면 누락과 구분할 sentinel이 필요합니다."] },
      ],
      codeExamples: [
        {
          id: "dictionary-lookup-views",
          title: "필수·선택 조회와 동적 view 관찰",
          language: "python",
          filename: "dict_lookup.py",
          purpose: "원본 ex02_dict의 []·get·in·keys·values·items를 누락 구분과 변경 반영까지 확장합니다.",
          code: "user = {'name': 'kang', 'age': 10, 'gender': True, 'hobby': None}\nkeys_view = user.keys()\nitems_view = user.items()\n\nprint(user['name'], user.get('name'))\nprint(user.get('missing'))\nprint('hobby' in user, 'missing' in user)\nprint(list(keys_view))\n\nuser['city'] = 'Seoul'\nprint(list(keys_view))\nprint(list(items_view))\n\nsentinel = object()\nprint(user.get('hobby', sentinel) is sentinel)\nprint(user.get('missing', sentinel) is sentinel)",
          walkthrough: [
            { lines: "1", explanation: "실제 None 값 hobby와 완전히 누락된 missing을 비교할 mapping을 만듭니다." },
            { lines: "2-3", explanation: "keys와 items view를 현재 dict에 연결된 상태로 보관합니다." },
            { lines: "5-7", explanation: "필수·선택 조회와 key membership 결과를 확인합니다." },
            { lines: "8", explanation: "view를 list snapshot으로 구체화해 현재 네 key를 출력합니다." },
            { lines: "10-12", explanation: "city를 추가한 뒤 기존 view를 다시 구체화하면 새 key·item이 반영됩니다." },
            { lines: "14-16", explanation: "고유 object sentinel로 실제 None 값과 누락을 구분합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "dict_lookup.py를 저장"], command: "python dict_lookup.py" },
          output: { value: "kang kang\nNone\nTrue False\n['name', 'age', 'gender', 'hobby']\n['name', 'age', 'gender', 'hobby', 'city']\n[('name', 'kang'), ('age', 10), ('gender', True), ('hobby', None), ('city', 'Seoul')]\nFalse\nTrue", explanation: ["get None만 보면 hobby와 missing을 구분할 수 없습니다.", "view는 생성 시점 snapshot이 아니라 원본 dict 변경을 반영합니다.", "고유 sentinel 동일성 검사가 누락만 True로 표시합니다."] },
          experiments: [
            { change: "print(user['missing'])를 추가합니다.", prediction: "KeyError: 'missing'이 발생합니다.", result: "필수 키 누락 계약이 get과 다르게 드러납니다." },
            { change: "print('kang' in user)를 추가합니다.", prediction: "value가 존재해도 key가 아니므로 False입니다.", result: "dict in의 기본 대상이 key임을 확인합니다." },
          ],
          sourceRefs: ["py-dict-basic", "py-day03-note"],
        },
      ],
      diagnostics: [
        { symptom: "KeyError가 발생한다.", likelyCause: "[]로 존재하지 않는 key를 읽었거나 삭제 후 다시 접근했습니다.", checks: ["예외 메시지 key와 dict.keys를 확인합니다.", "철자·대소문자·공백·타입이 같은지 봅니다.", "필수 키인지 선택 키인지 데이터 계약을 확인합니다."], fix: "필수라면 경계 검증과 의미 있는 오류를 제공하고, 선택이면 get과 명시 기본값을 사용합니다.", prevention: "필수·선택 key schema와 누락 테스트를 작성합니다." },
      ],
    },
    {
      id: "dictionary-views",
      title: "keys·values·items는 원본에 연결된 view입니다",
      lead: "dict_keys·dict_values·dict_items는 바로 list가 아니며 원본 변경을 반영하는 가벼운 관찰 창입니다.",
      explanations: [
        "user.keys(), values(), items()는 전용 view 객체입니다. 인덱싱하려고 view[0]을 쓰면 TypeError입니다. 첫 항목이 꼭 필요하면 next(iter(view))를 쓰되 빈 dict를 처리하고, 순서 snapshot이 필요하면 list(view)로 구체화합니다.",
        "items view의 각 요소는 (key,value) tuple이므로 for key,value in user.items()로 언패킹합니다. list(user.items())[0][0]처럼 매번 전체 list를 만드는 원본 방식보다 직접 순회가 명확하고 효율적입니다.",
        "view를 순회하는 동안 dict 크기를 바꾸면 RuntimeError가 날 수 있습니다. 값만 바꾸는 것과 key 추가·삭제는 다릅니다. 삭제 대상 key를 먼저 list로 수집한 뒤 별도 단계에서 변경합니다.",
      ],
      concepts: [
        { term: "dictionary view", definition: "dict의 key·value·item을 복사하지 않고 동적으로 관찰하는 객체입니다.", detail: ["원본 변경을 반영합니다.", "sequence처럼 정수 인덱싱하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "TypeError: 'dict_keys' object is not subscriptable가 발생한다.", likelyCause: "keys view를 list처럼 정수 인덱싱했습니다.", checks: ["type 결과가 dict_keys인지 확인합니다.", "첫 값, 전체 snapshot, 순회 중 무엇이 필요한지 정합니다.", "빈 dict 가능성을 확인합니다."], fix: "순회는 for, snapshot은 list(view), 첫 요소는 기본값을 처리한 next(iter(view), default)를 사용합니다.", prevention: "view와 sequence 반환 타입을 타입 힌트·테스트에서 구분합니다." },
        { symptom: "RuntimeError: dictionary changed size during iteration가 발생한다.", likelyCause: "keys/items view를 순회하면서 key를 추가·삭제했습니다.", checks: ["반복문 내부의 대입·pop·del을 찾습니다.", "값 갱신인지 구조 변경인지 구분합니다.", "변경 대상 key를 별도 목록으로 수집할 수 있는지 봅니다."], fix: "list(user) snapshot을 순회하거나 삭제 key를 먼저 수집한 뒤 두 번째 단계에서 변경합니다.", prevention: "순회와 구조 변경 단계를 분리하고 연속 삭제 테스트를 둡니다." },
      ],
    },
    {
      id: "insert-update-delete",
      title: "키 대입은 추가와 수정 모두 수행합니다",
      lead: "mapping[key]=value는 key가 없으면 삽입, 있으면 value 교체입니다. 변경 전 존재 여부가 업무 의미라면 따로 검사합니다.",
      explanations: [
        "user['name']='Kim'은 기존 name 값을 바꾸고, user['city']='Seoul'은 새 항목을 끝에 추가합니다. upsert 동작이 편리하지만 ‘이미 있으면 오류’인 등록 계약에는 if key in user 또는 별도 API가 필요합니다.",
        "update(other)는 여러 key를 한 번에 병합하며 충돌 key는 오른쪽 값이 덮습니다. Python 3.9+의 left|right는 새 dict, left|=right는 왼쪽 변경입니다. 설정 병합에서 어느 쪽이 우선인지 명시하고 민감 설정 덮어쓰기를 검토합니다.",
        "setdefault(key,default)는 key가 있으면 기존 값을, 없으면 default를 넣고 반환합니다. 그룹 list 초기화에 쓸 수 있지만 default 표현식은 호출 전에 평가되고 mutable 기본 객체의 생성·공유를 주의합니다. collections.defaultdict가 더 명확한 경우도 있습니다.",
        "pop(key) 삭제 값 반환, pop(key,default)는 누락 기본값, del mapping[key]는 누락 KeyError, clear는 같은 dict를 비웁니다. popitem은 마지막 삽입 항목을 제거해 반환하지만 업무 순서에 의존할 때 계약을 명시합니다.",
      ],
      concepts: [
        { term: "upsert", definition: "key가 없으면 insert, 있으면 update하는 하나의 연산 의미입니다.", detail: ["dict key 대입이 기본적으로 upsert입니다.", "중복 등록을 거부해야 하면 존재 검사와 원자성 정책이 필요합니다."] },
        { term: "병합 우선순위", definition: "같은 key가 여러 mapping에 있을 때 어느 value가 최종 결과가 될지 정한 규칙입니다.", detail: ["update와 |에서 오른쪽 입력이 보통 덮습니다.", "설정·권한·비밀값 병합은 우선순위를 문서화하고 테스트합니다."] },
      ],
      codeExamples: [
        {
          id: "dictionary-update-inventory",
          title: "재고 mapping 갱신·병합·삭제",
          language: "python",
          filename: "dict_update.py",
          purpose: "단일 key 수정과 bulk update, 새 dict 병합, pop 반환 계약을 하나의 상태 흐름으로 확인합니다.",
          code: "stock = {'apple': 3, 'banana': 2}\nstock['apple'] += 2\nstock['mango'] = 4\nprint(stock)\n\nincoming = {'banana': 5, 'orange': 7}\nmerged = stock | incoming\nprint(stock)\nprint(merged)\n\nremoved = merged.pop('mango')\nmissing = merged.pop('melon', 0)\nprint(removed, missing)\nprint(merged)\n\ngroups = {}\ngroups.setdefault('backend', []).append('Spring')\nprint(groups)",
          walkthrough: [
            { lines: "1-3", explanation: "기존 apple을 읽어 누적하고 새 mango를 삽입합니다." },
            { lines: "6-8", explanation: "|가 새 dict를 만들며 banana 충돌은 incoming의 5가 이깁니다. stock 원본은 유지됩니다." },
            { lines: "10-12", explanation: "mango는 삭제 값 4, 없는 melon은 지정 기본 0을 반환합니다." },
            { lines: "14-16", explanation: "setdefault가 새 backend list를 넣고 반환한 같은 list에 Spring을 append합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "dict_update.py를 저장"], command: "python dict_update.py" },
          output: { value: "{'apple': 5, 'banana': 2, 'mango': 4}\n{'apple': 5, 'banana': 2, 'mango': 4}\n{'apple': 5, 'banana': 5, 'mango': 4, 'orange': 7}\n4 0\n{'apple': 5, 'banana': 5, 'orange': 7}\n{'backend': ['Spring']}", explanation: ["새 key는 삽입 순서 끝에 나타납니다.", "merged 변경과 pop은 stock 원본에 영향을 주지 않지만 value가 mutable이면 얕은 공유를 확인해야 합니다.", "pop default가 누락을 예외 없이 0으로 표현합니다."] },
          experiments: [
            { change: "merged=stock|incoming을 stock.update(incoming)으로 바꿉니다.", prediction: "stock 자체가 바뀌고 update 반환은 None입니다.", result: "새 결과와 in-place 병합 계약 차이를 확인합니다." },
            { change: "groups.setdefault('backend', []).append를 두 번 실행합니다.", prediction: "기존 list를 반환해 Spring이 두 번 추가됩니다.", result: "key가 있을 때 새 []는 저장되지 않지만 표현식 생성 비용은 발생합니다." },
          ],
          sourceRefs: ["py-dict-basic", "py-day03-note"],
        },
      ],
      diagnostics: [],
    },
    {
      id: "iteration-transformation",
      title: "순회는 key·value·item 중 필요한 관점을 선택합니다",
      lead: "for key in mapping이 기본이고 value가 함께 필요하면 items를 언패킹합니다.",
      explanations: [
        "for key in user는 keys view 순회와 같습니다. value는 user[key]로 읽을 수 있지만 두 값이 항상 필요하면 for key,value in user.items()가 한눈에 의도를 보여 줍니다. value만 순회하면 key 맥락을 잃을 수 있습니다.",
        "새 mapping 변환은 {key: transform(value) for key,value in source.items()} dict 컴프리헨션으로 만들 수 있습니다. 원본을 보존하고 key 충돌·필터링 규칙을 명시합니다. 자세한 컴프리헨션은 py-020에서 다룹니다.",
        "정렬된 보고서가 필요하면 for key in sorted(mapping)처럼 별도 정렬 key list를 순회합니다. dict 자체를 sort하는 메서드는 없으며 삽입 순서와 보고서 정렬을 구분합니다.",
      ],
      concepts: [
        { term: "item 언패킹", definition: "items가 제공하는 (key,value) tuple을 반복문의 두 이름으로 나누는 패턴입니다.", detail: ["위치 [0], [1] 접근보다 의미가 명확합니다.", "key와 value를 동시에 변환·검증하기 쉽습니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
    },
    {
      id: "nested-dictionaries-copy",
      title: "중첩 dict는 경로와 복사 깊이를 명시합니다",
      lead: "user['profile']['name']은 두 번의 필수 key lookup이며 각 단계가 dict라는 계약을 요구합니다.",
      explanations: [
        "중첩 접근을 user.get('profile',{}).get('name')로 쓰면 누락을 쉽게 기본화하지만 profile이 None이나 list이면 AttributeError이고, 필수 구조 오류를 조용히 숨길 수 있습니다. 각 단계 schema를 검증하거나 dataclass·TypedDict·검증 라이브러리를 사용합니다.",
        "dict.copy(), dict(mapping), {**mapping}은 바깥 얕은 복사입니다. profile 안 list를 복사본에서 append하면 원본에도 보일 수 있습니다. 업데이트 경로만 새 객체로 만드는 구조적 복사 또는 도메인 모델을 검토합니다.",
        "재귀 병합은 단순 update와 다릅니다. nested key를 통째로 덮을지 내부를 합칠지, list는 교체·연결·고유 병합 중 무엇인지 정책이 필요합니다. 보안 설정에서 공격자 입력이 admin 같은 중첩 값을 덮지 못하도록 허용 key를 제한합니다.",
      ],
      concepts: [
        { term: "경로 접근", definition: "중첩 mapping에서 key의 연속으로 특정 값에 도달하는 과정입니다.", detail: ["각 중간 단계의 존재와 타입이 계약입니다.", "누락 기본화가 구조 오류를 숨기지 않는지 검토합니다."] },
        { term: "얕은 dict 복사", definition: "새 바깥 dict를 만들고 key와 value 객체 참조를 재사용하는 복사입니다.", detail: ["중첩 mutable value는 공유됩니다.", "필요한 경로만 새로 만드는 도메인 복사가 더 명확할 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "복사한 dict의 중첩 list를 바꿨는데 원본도 바뀐다.", likelyCause: "dict.copy가 바깥 mapping만 복사하고 내부 list 참조를 공유했습니다.", checks: ["copy['tags'] is original['tags']를 확인합니다.", "객체 그래프로 공유할 value와 독립 value를 구분합니다.", "deepcopy 비용·의미가 적절한지 검토합니다."], fix: "필요한 중첩 경로를 list.copy 등으로 별도 복사하거나 도메인 복사 함수를 만듭니다.", prevention: "중첩 변경 독립성 테스트와 복사 정책 문서를 둡니다." },
      ],
    },
    {
      id: "modeling-security-performance",
      title: "dict를 schema·보안·성능 계약과 함께 사용합니다",
      lead: "자유로운 key-value 구조는 편리하지만 오타·누락·과도한 입력과 비밀 노출을 자동으로 막지 않습니다.",
      explanations: [
        "고정 사용자 레코드를 dict로 표현하면 필드 오타가 런타임 KeyError 또는 새 잘못된 key 삽입으로 나타납니다. TypedDict는 정적 도구, dataclass/Pydantic류는 이름·타입·검증을 더 명확히 제공할 수 있습니다.",
        "외부 JSON object는 dict로 파싱되지만 최대 key 수, key 길이, 중첩 깊이, 허용 key와 value 타입을 검증합니다. 무제한 중첩·대용량 mapping은 메모리와 처리 시간을 소모합니다.",
        "dict 전체를 f'{user=}'로 로그에 남기면 password·token·개인정보가 노출될 수 있습니다. 허용 필드만 선택하고 중앙 마스킹과 구조화 로그를 사용합니다. 단순 pop으로 제거한 복사본도 얕은 공유·예외 로그를 검토합니다.",
        "dict lookup은 평균 O(1)이지만 hash 계산과 충돌, 메모리 비용이 있습니다. 순서 range 데이터에 dict를 무조건 쓰지 말고 index 접근·정렬·직렬화 요구를 비교합니다.",
      ],
      concepts: [
        { term: "schema", definition: "허용 key, 필수·선택 여부, value 타입·범위와 중첩 구조를 정의한 데이터 계약입니다.", detail: ["자유로운 dict에 제품 의미를 부여합니다.", "검증·직렬화·API 문서와 일치해야 합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "고정 레코드에 dict와 dataclass 중 무엇을 선택할까요?", options: [
          { name: "dict", chooseWhen: "동적 key, JSON 경계, 간단한 임시 변환이 핵심일 때", avoidWhen: "고정 필드 오타·타입을 조기에 잡고 도메인 동작이 필요할 때", tradeoffs: ["유연하고 직렬화가 쉽습니다.", "오타가 새 key가 될 수 있습니다.", "필드 계약을 별도로 유지해야 합니다."] },
          { name: "dataclass/검증 모델", chooseWhen: "고정 필드·타입·기본값·검증과 IDE 지원이 중요할 때", avoidWhen: "완전히 동적인 임시 mapping에 과도한 구조일 때", tradeoffs: ["자기 설명적이고 도구 지원이 좋습니다.", "직렬화 변환이 필요합니다.", "버전·검증 라이브러리 정책이 추가됩니다."] },
        ] },
      ],
      expertNotes: ["캐시 key로 dict 자체를 쓸 수 없습니다. 정렬된 item tuple이나 불변 도메인 key를 만들되 중첩·순서 의미를 명확히 합니다.", "권한·설정 병합에서 공격자 제공 key가 내부 플래그를 덮지 않도록 허용 목록과 별도 namespace를 사용합니다."],
    },
  ],
  lab: {
    title: "학습자 프로필 schema와 안전한 갱신",
    scenario: "name·track·progress·tags를 가진 중첩 dict 입력을 검증하고 허용 필드만 갱신한 뒤 민감정보 없는 보고서를 만듭니다.",
    setup: ["dict_profile_lab.py를 만듭니다.", "정상·누락·잘못된 타입·추가 admin key 입력을 준비합니다.", "Python 3.11 이상에서 실행합니다."],
    steps: ["필수 name·track과 선택 tags를 []·get 계약으로 분리합니다.", "허용 key 집합 밖 입력을 오류로 수집합니다.", "progress의 done·total 중첩 구조와 범위를 검증합니다.", "원본을 보존한 새 결과 dict를 만들고 tags list 공유 여부를 테스트합니다.", "items 언패킹으로 사람이 읽는 보고서를 생성하되 token·password를 제외합니다.", "기존 profile과 update payload의 병합 충돌 우선순위를 테스트합니다.", "순회 중 key 삭제 오류를 재현하고 두 단계 삭제로 수정합니다."],
    expectedResult: ["필수 누락과 선택 누락이 서로 다른 결과가 됩니다.", "허용되지 않은 admin·token key가 저장·로그되지 않습니다.", "중첩 mutable value 복사 정책이 테스트로 증명됩니다.", "원본·정규화·검증 결과가 구분됩니다."],
    cleanup: ["합성 비밀 문자열만 쓰고 실제 개인정보·토큰을 저장하지 않습니다."],
    extensions: ["TypedDict 또는 dataclass 모델로 같은 schema를 표현합니다.", "검증 오류를 field path와 code 구조로 만듭니다.", "대형·깊은 JSON 입력 제한을 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 dict의 key·value·items와 조회 계약을 출력하세요.", requirements: ["[], get, in을 존재·부재 key에 적용합니다.", "view와 list snapshot 타입을 비교합니다.", "dict 변경 후 기존 view가 갱신되는지 확인합니다."], hints: ["get 누락은 기본 None입니다.", "list(view)는 그 순간 snapshot입니다."], expectedOutcome: "조회·view 반환 계약을 실행 결과로 설명합니다.", solutionOutline: ["작은 user dict를 만듭니다.", "view를 먼저 저장합니다.", "새 key를 넣기 전후 view를 출력합니다."] },
    { difficulty: "응용", prompt: "상품 재고 update 함수를 만드세요.", requirements: ["없는 상품 추가, 기존 수량 증감, 음수 결과 거부를 처리합니다.", "원본 변경형과 새 dict 반환형을 각각 구현합니다.", "누락·0·매우 큰 수량과 잘못된 타입을 테스트합니다.", "반환·오류·원본 보존 계약을 문서화합니다."], hints: ["copy는 중첩 value 공유를 확인합니다.", "bool은 int 하위 타입이라는 경계도 검토합니다."], expectedOutcome: "upsert 편의와 업무 검증을 분리한 두 API가 완성됩니다." },
    { difficulty: "설계", prompt: "다중 환경 설정 병합 시스템을 설계하세요.", requirements: ["default·file·environment·runtime 우선순위를 정합니다.", "중첩 dict와 list의 병합 규칙을 명시합니다.", "secret key의 입력·로그·덮어쓰기 권한을 제한합니다.", "중복·알 수 없는 key·깊이·크기 오류를 다룹니다.", "최소 12개의 병합 테스트를 작성합니다."], hints: ["단순 update는 중첩 dict 전체를 덮습니다.", "환경별 허용 key와 비밀 namespace를 분리하세요."], expectedOutcome: "dict 문법을 운영 가능한 설정 schema·보안·버전 계약으로 확장합니다." },
  ],
  reviewQuestions: [
    { question: "dict key가 list일 수 없는 이유는 무엇인가요?", answer: "list는 mutable해 안정적인 hash를 제공하지 않으므로 dict 색인 key가 될 수 없습니다." },
    { question: "[]와 get은 누락 key에서 어떻게 다른가요?", answer: "[]는 KeyError, get은 지정 기본값 또는 None을 반환합니다." },
    { question: "value가 None인 key와 누락 key를 get으로 어떻게 구분하나요?", answer: "key in mapping을 확인하거나 고유 object sentinel을 get 기본값으로 사용합니다." },
    { question: "keys view를 만든 뒤 dict에 key를 추가하면 view는 바뀌나요?", answer: "예. view는 snapshot이 아니라 원본 dict의 현재 상태를 동적으로 반영합니다." },
    { question: "같은 key가 dict 리터럴에 두 번 있으면 무엇이 남나요?", answer: "마지막 value 하나가 남고 key는 중복되지 않습니다." },
    { question: "dict.copy 뒤 중첩 list 변경이 원본에 보일 수 있는 이유는 무엇인가요?", answer: "바깥 dict만 새로 만들고 내부 mutable value 참조는 공유하는 얕은 복사이기 때문입니다." },
    { question: "items 순회 중 key를 삭제하면 왜 위험한가요?", answer: "동적 view를 순회하면서 dict 크기가 바뀌어 RuntimeError 또는 누락이 생길 수 있어 변경 단계를 분리해야 합니다." },
  ],
  completionChecklist: [
    "dict의 고유 hashable key와 삽입 순서·중복 덮어쓰기를 설명할 수 있다.",
    "필수·선택 key에 []·get·in을 맞게 사용할 수 있다.",
    "dict view와 list snapshot의 차이를 재현할 수 있다.",
    "items를 key,value로 언패킹하고 구조 변경을 순회와 분리할 수 있다.",
    "대입·update·|·setdefault·pop·del의 변경·반환 계약을 구분한다.",
    "중첩 dict의 경로 검증과 얕은 복사 공유를 추적할 수 있다.",
    "schema·허용 key·크기·민감정보 로그 정책을 설계할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-dict-basic", repository: "PYTHON-BASIC", path: "day03/ex02_dict.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day03/ex02_dict.py", usedFor: ["dict 생성", "[]·get", "keys·values·items", "in", "수정·중복 key"], evidence: "Python 3.13.9에서 원본을 실행해 str/int key 조회, view 타입, item tuple, get None, membership, 수정과 마지막 중복 key Park 결과를 확인했습니다." },
    { id: "py-day03-note", repository: "PYTHON-BASIC", path: "notes/day03_collection_control.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day03_collection_control.md", usedFor: ["dict 조회·수정 요약", "get과 [] 차이", "순회 범위", "셀프 체크"], evidence: "원본 노트의 dict 계약을 유지하고 동적 view·sentinel·병합·schema·보안 경계를 보강했습니다." },
  ],
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["set 집합 연산은 py-014에서 별도 학습합니다.", "TypedDict·검증 모델·설정 병합 보안은 원본 공백을 전문가 관점으로 보강했습니다."] },
} satisfies DetailedSession;

export default session;
