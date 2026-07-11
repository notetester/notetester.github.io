import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-034"],
  slug: "python-034-random-reproducibility-counter",
  courseId: "python",
  moduleId: "03-oop-stdlib",
  order: 34,
  title: "random·재현성·Counter",
  subtitle: "의사난수 상태를 실험 입력으로 관리하고, 데이터 누수를 막는 분할과 결정적인 빈도 분석을 재현 가능한 파이프라인으로 만듭니다.",
  level: "중급",
  estimatedMinutes: 150,
  coreQuestion: "같은 실험은 다시 재현하면서도 서로 다른 작업의 난수 상태가 간섭하지 않고, 빈도·분할 결과를 데이터 버전과 함께 신뢰할 수 있게 어떻게 기록할까요?",
  summary: "random.seed·randint·random·shuffle 원본 출력과 80/10/10 split, Counter의 missing 0·most_common·불용어 제거를 재구성합니다. 전역 난수 대신 random.Random 인스턴스를 주입하고 shuffle의 원본 mutation, sample·choice 경계를 다룹니다. seed만으로 부족한 재현성, group/stratified split과 leakage, secrets 보안 난수, Counter multiset 연산·동점, Unicode tokenization·stopword 편향과 artifact provenance까지 전문가 수준으로 확장합니다.",
  objectives: [
    "의사난수 생성기 state와 seed의 관계를 설명하고 같은 seed·같은 호출 순서에서 같은 sequence를 재현할 수 있다.",
    "module 전역 random state와 독립 random.Random 객체를 구분해 component 간 간섭을 막을 수 있다.",
    "randint·random·choice·sample·shuffle의 범위·복원·mutation 계약을 구분할 수 있다.",
    "dataset split에서 copy·seed·ID 보존·train/validation/test disjointness를 검증할 수 있다.",
    "시간·사용자·그룹·label 구조에 맞춰 random·stratified·group·temporal split을 선택하고 leakage를 피할 수 있다.",
    "token·label 빈도를 Counter로 세고 missing key·most_common 동점·update/subtract 의미를 설명할 수 있다.",
    "password·token·인증 code에는 random 대신 secrets를 사용하고 실험 artifact에 seed·data·code·환경 provenance를 기록할 수 있다.",
  ],
  prerequisites: [
    { title: "break·continue·for·range", reason: "난수 sequence와 dataset·token iteration을 추적합니다.", sessionSlug: "python-019-break-continue-for-range" },
    { title: "리스트 CRUD·정렬·복사", reason: "shuffle의 in-place mutation과 split 전 copy를 구분합니다.", sessionSlug: "python-011-list-crud-sorting-copying" },
    { title: "딕셔너리 조회·순회·수정", reason: "Counter의 mapping 유사 조회와 빈도 결과를 다룹니다.", sessionSlug: "python-013-dictionary-access-iteration-update" },
  ],
  keywords: ["Python", "random", "seed", "Random", "shuffle", "sample", "dataset split", "reproducibility", "data leakage", "Counter", "most_common", "secrets"],
  chapters: [
    {
      id: "pseudorandom-state",
      title: "random은 진짜 무작위가 아니라 내부 state에서 결정적으로 다음 값을 만드는 의사난수입니다",
      lead: "같은 algorithm·초기 state·호출 순서라면 같은 값 sequence가 나오고 한 번 더 호출하면 이후 전체 sequence가 이동합니다.",
      explanations: [
        "원본 random.seed(42) 뒤 randint(1,10)을 다섯 번 호출하면 같은 환경에서 같은 정수 sequence를 얻습니다. seed는 생성기의 긴 내부 state를 초기화하는 입력입니다. 결과 하나마다 seed를 다시 주는 것이 아니라 실험 시작에서 설정하고 state가 호출마다 진행합니다.",
        "같은 seed라도 호출 순서가 바뀌면 결과 mapping이 바뀝니다. 중간에 debug용 random() 한 번을 추가하면 뒤 shuffle과 sample도 달라집니다. 난수 소비를 숨은 global side effect가 아니라 함수 입력 dependency로 취급합니다.",
        "재현성은 random처럼 보이는 결과를 고정하기 위한 도구이지 학습·validation·test를 같은 data로 만들기 위한 것이 아닙니다. 같은 split artifact를 반복 비교해 code change 효과를 분리하는 데 사용합니다.",
        "Python random은 Mersenne Twister 기반의 통계적 simulation용이며 암호학적으로 예측 저항성이 없습니다. seed를 숨겨도 출력 몇 개로 state를 추정할 수 있어 token·password에 쓰지 않습니다.",
      ],
      concepts: [
        { term: "PRNG", definition: "작은 초기 seed와 내부 state를 사용해 무작위처럼 보이는 결정적 sequence를 생성하는 pseudo-random number generator입니다.", detail: ["같은 state와 호출이면 같은 다음 값입니다.", "통계용과 암호용 generator 요구가 다릅니다."] },
        { term: "seed", definition: "의사난수 생성기의 초기 state를 결정하도록 제공하는 값입니다.", detail: ["실험 provenance의 한 요소입니다.", "data·code·library·호출 순서까지 자동 고정하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "seed는 같은데 refactor 뒤 shuffle·sampling 결과가 달라졌다.", likelyCause: "같은 generator에서 난수 호출 횟수·순서가 달라졌거나 library algorithm·data 순서가 변했습니다.", checks: ["난수 호출 graph와 RNG 객체별 state owner를 비교합니다.", "입력 ID 순서와 data hash를 확인합니다.", "Python·library version과 algorithm을 기록합니다."], fix: "작업별 독립 RNG를 주입하고 split index 자체를 artifact로 저장하며 data·code·환경 version을 함께 고정합니다.", prevention: "golden split ID·provenance manifest와 재현 test를 유지합니다." },
      ],
    },
    {
      id: "global-vs-local-rng",
      title: "전역 random state보다 독립 Random 객체를 작업별로 소유·주입합니다",
      lead: "random.seed는 module-level singleton state 전체를 바꾸므로 다른 library·test의 난수 소비와 간섭합니다.",
      explanations: [
        "원본은 교육을 위해 random.seed와 module 함수를 사용합니다. 작은 script에서는 명확하지만 library 함수가 내부에서 random.seed(42)를 호출하면 caller의 random sequence까지 reset합니다. test 순서와 component 결합이 생깁니다.",
        "rng = random.Random(seed)는 독립 state를 가진 객체입니다. split_dataset(items,rng), augment(image,rng)처럼 dependency를 인수로 전달하면 test에서 고정 RNG를 주고 production에서 다른 seed를 선택할 수 있습니다.",
        "작업별 seed를 단순히 모두 42로 두면 서로 같은 패턴 correlation이 생길 수 있습니다. master seed에서 명시적으로 child seed를 파생하거나 experiment config에 이름별 seed를 기록합니다. Python random과 NumPy·PyTorch·GPU는 각각 별도 RNG가 있어 모두 설정해야 할 수 있습니다.",
        "RNG 객체를 여러 thread가 공유하면 호출 interleaving에 따라 어느 작업이 어떤 값을 받는지 비결정적일 수 있습니다. thread/task별 generator 또는 deterministic work allocation을 사용합니다. thread-safe 호출 가능성과 실험 결정성은 다릅니다.",
      ],
      concepts: [
        { term: "RNG dependency injection", definition: "난수를 생성하는 객체를 함수·class에 명시 인수로 전달해 state 소유와 test 제어를 드러내는 설계입니다.", detail: ["전역 seed 간섭을 줄입니다.", "작업별 독립 stream을 만들 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "개별 test는 통과하지만 suite 순서나 병렬 실행에서 난수 결과가 달라진다.", likelyCause: "여러 test·component가 module 전역 random state를 공유하고 seed·소비 순서를 바꿉니다.", checks: ["random.seed와 module-level random 호출을 검색합니다.", "test 순서를 shuffle해 재현합니다.", "thread·async worker가 같은 generator를 공유하는지 확인합니다."], fix: "각 test·component에 독립 Random instance를 생성·주입하고 global state를 수정하지 않습니다.", prevention: "test fixture가 RNG를 제공하고 parallel·order-randomized CI를 실행합니다." },
      ],
    },
    {
      id: "random-api-semantics",
      title: "randint·random·choice·sample·shuffle은 범위·중복·mutation 계약이 다릅니다",
      lead: "원하는 결과 shape와 원본 보존 여부를 먼저 정한 뒤 난수 API를 선택합니다.",
      explanations: [
        "randint(a,b)는 양 끝을 모두 포함한 정수입니다. range처럼 끝 b가 제외된다고 오해하기 쉽습니다. randrange(start,stop)에는 stop이 제외됩니다. random()은 보통 0.0 이상 1.0 미만 float입니다.",
        "choice(sequence)는 한 요소를 선택하고 반복 호출하면 중복이 가능합니다. choices(population,k=n)는 복원 추출과 weight를 지원합니다. sample(population,k)는 기본적으로 중복 없는 선택이며 k가 population보다 크면 ValueError입니다.",
        "shuffle(list)는 원본 list를 제자리 변경하고 None을 반환합니다. shuffled = rng.shuffle(items)는 shuffled가 None이 됩니다. 원본 순서가 필요하면 copy를 만들고 shuffle합니다. tuple·generator는 직접 shuffle할 수 없습니다.",
        "가중치가 음수·모두 0·NaN이면 의미가 없거나 오류가 납니다. 확률이라고 해서 자동 합 1일 필요는 없지만 relative weight의 출처와 정밀도를 검증합니다. 보안 추첨·규제 lottery는 표준 random만으로 공정성 요구를 충족하지 않습니다.",
      ],
      concepts: [
        { term: "sampling with replacement", definition: "한 번 선택한 요소를 다시 선택 후보에 남겨 같은 요소가 여러 번 나올 수 있는 표본 추출입니다.", detail: ["choice 반복·choices가 해당합니다.", "sample은 기본적으로 without replacement입니다."] },
        { term: "in-place shuffle", definition: "list 요소 순서를 같은 객체 안에서 바꾸고 별도 결과 list를 반환하지 않는 동작입니다.", detail: ["반환값은 None입니다.", "원본 보존이 필요하면 먼저 shallow copy합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "shuffle 뒤 결과 변수는 None이거나 원본 dataset 순서가 사라졌다.", likelyCause: "list.sort와 마찬가지로 shuffle이 in-place이고 None을 반환한다는 계약을 놓쳤습니다.", checks: ["shuffle 반환값과 items id를 확인합니다.", "원본 alias가 다른 component에 공유되는지 봅니다.", "split 전에 copy했는지 확인합니다."], fix: "shuffled = list(items); rng.shuffle(shuffled)처럼 복사본을 변경합니다.", prevention: "입력 불변성 test와 mutation 이름 convention을 사용합니다." },
      ],
    },
    {
      id: "reproducible-data-splitting",
      title: "dataset split은 비율보다 ID disjointness·대표성·누수 방지가 핵심입니다",
      lead: "원본 100개 index shuffle 후 80/10/10 slice는 출발점이며 실제 data 구조에 맞는 split unit을 정해야 합니다.",
      explanations: [
        "원본은 indices 0~99를 seed 42로 섞고 앞 80 train, 다음 10 validation, 마지막 10 test로 나눕니다. 세 길이 합이 100이고 set 교집합이 비어 있는지 검증합니다. 원본 row를 직접 shuffle하면 label·feature alignment가 같이 움직이는지도 확인합니다.",
        "같은 사용자의 여러 기록, 같은 환자의 이미지, 같은 문서의 chunk가 서로 다른 split에 들어가면 model이 entity 특징을 기억해 과대평가할 수 있습니다. group ID 단위로 split합니다. 시계열은 미래가 train에 들어가지 않게 temporal split을 사용합니다.",
        "불균형 label은 random split에서 validation/test에 희귀 class가 없을 수 있습니다. label 비율을 유지하는 stratified split을 사용하되 group·time 제약과 충돌하면 우선순위와 평가 설계를 명시합니다.",
        "split 전에 전체 data로 scaler·vocabulary·feature selection을 fit하면 validation/test 정보가 train preprocessing에 누수됩니다. train에서 fit하고 validation/test에는 transform만 적용합니다. duplicate·near-duplicate도 split 전에 group화합니다.",
      ],
      concepts: [
        { term: "data leakage", definition: "평가 시점에 사용할 수 없는 validation·test·미래 정보가 training 또는 preprocessing에 들어가 성능이 과대평가되는 문제입니다.", detail: ["같은 entity·duplicate·global fit가 원인이 됩니다.", "split unit과 pipeline fit 경계를 함께 설계합니다."] },
        { term: "stratified split", definition: "각 split의 class·target 분포가 전체와 유사하도록 층별로 나누는 방식입니다.", detail: ["희귀 class 대표성에 도움 됩니다.", "group·time 제약과 함께 검토합니다."] },
      ],
      codeExamples: [
        {
          id: "local-rng-split",
          title: "원본을 보존하는 독립 RNG 80/10/10 분할",
          language: "python",
          filename: "reproducible_split.py",
          purpose: "같은 seed 재현, 다른 seed 차이, split 크기·교집합·원본 보존을 한 번에 확인합니다.",
          code: "from random import Random\n\ndef split_ids(ids, *, seed, train_size=8, val_size=1):\n    shuffled = list(ids)\n    Random(seed).shuffle(shuffled)\n    train_end = train_size\n    val_end = train_end + val_size\n    return shuffled[:train_end], shuffled[train_end:val_end], shuffled[val_end:]\n\nids = list(range(10))\nfirst = split_ids(ids, seed=42)\nsecond = split_ids(ids, seed=42)\nthird = split_ids(ids, seed=7)\n\nprint(first)\nprint(f'same-seed={first == second}, different-seed={first != third}')\ntrain, val, test = first\nprint(f'sizes={len(train)}/{len(val)}/{len(test)}')\nprint(f'disjoint={not (set(train) & set(val) | set(train) & set(test) | set(val) & set(test))}')\nprint(f'complete={set(train + val + test) == set(ids)}')\nprint(f'original={ids}')",
          walkthrough: [
            { lines: "1-8", explanation: "입력을 새 list로 복사하고 함수 호출별 독립 Random(seed)로 shuffle한 뒤 8/1/1 slice를 반환합니다." },
            { lines: "10-13", explanation: "같은 입력·seed 두 번과 다른 seed 한 번을 생성합니다." },
            { lines: "15-20", explanation: "실제 split, 재현성, 크기, pairwise 교집합 없음, 전체 ID 보존을 검증합니다." },
            { lines: "21", explanation: "입력 ids 원본 순서가 변경되지 않았음을 확인합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "reproducible_split.py로 저장"], command: "python reproducible_split.py" },
          output: { value: "([7, 3, 2, 8, 5, 6, 9, 4], [0], [1])\nsame-seed=True, different-seed=True\nsizes=8/1/1\ndisjoint=True\ncomplete=True\noriginal=[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]", explanation: ["seed 42의 10개 순열에서 첫 8·다음 1·마지막 1이 분리됩니다.", "독립 RNG로 같은 seed 결과가 같고 다른 seed는 다릅니다.", "split은 겹치지 않고 모든 ID를 정확히 한 번 포함하며 원본은 보존됩니다."] },
          experiments: [
            { change: "shuffled = ids로 바꿉니다.", prediction: "함수 호출이 caller의 ids list 순서를 직접 변경하고 두 번째 호출 입력 순서도 달라집니다.", result: "seed만 같아도 시작 sequence가 다르면 결과 artifact가 달라질 수 있습니다." },
            { change: "ID를 사용자별 여러 row로 바꾸고 row 단위 split합니다.", prediction: "같은 사용자의 row가 train과 test에 동시에 들어갈 수 있습니다.", result: "실제 leakage 방지는 group unit split이 필요합니다." },
          ],
          sourceRefs: ["py-random-source", "python-random-doc"],
        },
      ],
      diagnostics: [
        { symptom: "test 성능은 매우 높은데 실제 배포 성능이 크게 낮다.", likelyCause: "같은 entity·duplicate·미래 data 또는 전체 data로 fit한 preprocessing이 split 경계를 넘어 누수됐습니다.", checks: ["train/test ID·group·hash 교집합을 검사합니다.", "시간 순서와 duplicate cluster를 봅니다.", "scaler·vocabulary·feature selection fit 대상이 train만인지 확인합니다."], fix: "entity/group/time 단위로 다시 split하고 모든 학습형 preprocessing을 train에서만 fit한 뒤 평가 artifact를 재생성합니다.", prevention: "split manifest·leakage audit·group disjoint test를 model CI에 둡니다." },
      ],
    },
    {
      id: "counter-multiset",
      title: "Counter는 key별 정수 count를 가진 multiset이며 missing key는 0으로 읽힙니다",
      lead: "dict와 비슷하지만 존재하지 않는 label 조회가 KeyError 대신 0이고 update·subtract·연산자의 count 정책이 다릅니다.",
      explanations: [
        "원본 labels에서 Counter는 cat 3, dog 4, bird 2를 셉니다. counter['fish']는 key가 없어도 0입니다. membership 'fish' in counter는 실제 저장 key 여부를 확인하므로 0 조회와 존재를 구분합니다.",
        "most_common(k)는 count 내림차순 요소를 반환합니다. 동점 순서는 처음 만난 순서에 의존할 수 있어 입력 source가 비결정적이면 report도 달라집니다. 결정적 결과가 필요하면 (-count,key)로 별도 sorted합니다.",
        "update(iterable)는 요소별 +1, update(mapping)는 제공 count만큼 더합니다. subtract는 음수·0 count를 남길 수 있고 unary +counter는 양수만 정리합니다. Counter addition·intersection·union은 multiset 의미를 가지므로 일반 수치 dict 연산과 혼동하지 않습니다.",
        "Counter.total은 최신 Python에서 count 합을 제공합니다. 음수 count가 있으면 unique item 수나 실제 token 수와 다릅니다. len(counter)는 저장 key 수이지 전체 빈도 합이 아닙니다.",
      ],
      concepts: [
        { term: "multiset", definition: "각 고유 요소가 몇 번 존재하는지 multiplicity count를 함께 가지는 집합 확장 자료구조입니다.", detail: ["Counter가 Python 구현을 제공합니다.", "순수 set과 달리 중복 수를 보존합니다."] },
        { term: "most_common", definition: "Counter 요소를 count가 큰 순으로 최대 n개 반환하는 method입니다.", detail: ["결과는 (element,count) tuple list입니다.", "동점의 결정적 key가 필요하면 별도 정렬합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "Counter key 수를 전체 token 수로 보고하거나 subtract 뒤 음수 count가 report에 나온다.", likelyCause: "len(counter), total count, 양수 multiset 정리의 의미를 혼동했습니다.", checks: ["len(counter), counter.total(), sum(counter.values())를 비교합니다.", "0·음수 stored key를 출력합니다.", "update/subtract history를 추적합니다."], fix: "필요 metric을 고유 종류 수와 총 빈도로 이름을 분리하고 양수 multiset이 필요하면 +counter로 정리합니다.", prevention: "empty·missing·0·negative·tie counter fixture를 둡니다." },
      ],
    },
    {
      id: "text-frequency-pipeline",
      title: "단어 빈도는 split보다 tokenization·정규화·불용어·언어 정책이 결과를 결정합니다",
      lead: "Counter는 주어진 token을 정확히 셀 뿐 어떤 문자열이 같은 단어인지 스스로 판단하지 않습니다.",
      explanations: [
        "원본 sentence.split은 whitespace로 나눠 the 4, cat 2, on 2, mat 2 등을 셉니다. 'cat,'와 'cat', 'Cat'은 다른 token입니다. casefold·Unicode normalization·punctuation·emoji·한국어 형태소 정책을 목적에 맞게 정합니다.",
        "불용어 the·on·is 제거는 흔한 전처리지만 task에 따라 부정어·관계어 정보를 잃습니다. stopword version과 언어를 artifact에 기록하고 train/test에 같은 pipeline을 적용합니다. label이나 미래 corpus로 stopword를 고르면 leakage가 될 수 있습니다.",
        "most_common 결과는 빈도가 큰 항목을 보여 주지만 document frequency와 term frequency는 다릅니다. 한 문서 반복이 corpus 전체 대표성을 과장할 수 있습니다. TF-IDF·BM25는 ML/RAG 과정에서 별도로 다룹니다.",
        "민감 text 빈도를 로그·artifact로 남기면 희귀 token이 개인정보·secret을 노출할 수 있습니다. 최소 count threshold, masking, 접근 권한, retention을 적용합니다.",
      ],
      concepts: [
        { term: "tokenization", definition: "원문 문자열을 빈도·모델이 처리할 단위 token sequence로 나누는 규칙입니다.", detail: ["whitespace split은 가장 단순한 한 방식입니다.", "언어·목적·Unicode에 따라 결과가 달라집니다."] },
        { term: "stopword", definition: "특정 분석에서 정보량이 낮다고 판단해 제거하는 빈번한 token 목록입니다.", detail: ["task와 언어에 따라 다릅니다.", "version·leakage·편향을 기록합니다."] },
      ],
      codeExamples: [
        {
          id: "deterministic-word-frequency",
          title: "정규화·불용어 후 결정적 빈도 순위",
          language: "python",
          filename: "word_counter.py",
          purpose: "영문·한글·구두점이 있는 합성 문장을 정규화하고 Counter missing·total·tie-break를 확인합니다.",
          code: "from collections import Counter\nimport re\nimport unicodedata\n\ntext = 'Python, python! 데이터 데이터 AI ai; 학습.'\nnormalized = unicodedata.normalize('NFC', text).casefold()\ntokens = re.findall(r'[^\\W_]+', normalized, flags=re.UNICODE)\nstopwords = {'ai'}\nfiltered = [token for token in tokens if token not in stopwords]\ncounts = Counter(filtered)\nranked = sorted(counts.items(), key=lambda item: (-item[1], item[0]))\n\nprint(tokens)\nprint(filtered)\nprint(ranked)\nprint(f'total={counts.total()}, kinds={len(counts)}, missing={counts[\"없음\"]}')",
          walkthrough: [
            { lines: "1-6", explanation: "NFC와 casefold를 적용하고 Unicode word character 중 underscore를 제외한 연속 token을 추출합니다." },
            { lines: "7-9", explanation: "정규화된 ai를 불용어로 제거하고 남은 token 빈도를 셉니다." },
            { lines: "10", explanation: "count 내림차순과 token 오름차순으로 동점을 결정합니다." },
            { lines: "12-15", explanation: "각 pipeline 단계와 전체 빈도·고유 종류·missing 0을 출력합니다." },
          ],
          run: { environment: ["Python 3.10 이상", "word_counter.py로 저장"], command: "python word_counter.py" },
          output: { value: "['python', 'python', '데이터', '데이터', 'ai', 'ai', '학습']\n['python', 'python', '데이터', '데이터', '학습']\n[('python', 2), ('데이터', 2), ('학습', 1)]\ntotal=5, kinds=3, missing=0", explanation: ["대소문자·구두점 차이가 정규화되어 python과 ai가 각각 합쳐집니다.", "ai 두 개는 stopword라 제거됩니다.", "python과 데이터 동점은 Unicode 문자열 오름차순 key로 결정됩니다."] },
          experiments: [
            { change: "casefold를 제거합니다.", prediction: "Python과 python이 다른 token이 되어 각각 count 1입니다.", result: "정규화 정책이 vocabulary와 빈도를 직접 바꿉니다." },
            { change: "ranked 대신 counts.most_common()을 사용하고 입력 token 순서를 바꿉니다.", prediction: "동점 python·데이터의 순서가 처음 등장 순서에 따라 바뀔 수 있습니다.", result: "report 결정성이 필요하면 명시 tie-break를 둡니다." },
          ],
          sourceRefs: ["py-counter-source", "python-counter-doc"],
        },
      ],
      diagnostics: [
        { symptom: "같은 단어가 대소문자·구두점·Unicode 형태별로 여러 빈도 key에 갈라진다.", likelyCause: "tokenization과 normalization을 정의하지 않고 whitespace split 결과를 바로 셌습니다.", checks: ["repr과 Unicode code point를 비교합니다.", "casefold·NFC/NFKC·punctuation 정책을 확인합니다.", "train과 serving pipeline version을 비교합니다."], fix: "task에 맞는 공통 tokenizer·normalizer를 versioned component로 만들고 양쪽에서 동일 적용합니다.", prevention: "대소문자·결합 문자·emoji·한글·구두점 golden token fixture를 둡니다." },
      ],
    },
    {
      id: "security-and-full-reproducibility",
      title: "실험 재현성에는 seed뿐 아니라 data·code·환경·split artifact가 필요하고 보안 난수는 별도입니다",
      lead: "seed 숫자 하나는 난수 초기 state만 설명하며 전체 실험과 배포 결과를 재구성하는 provenance manifest가 아닙니다.",
      explanations: [
        "재현 가능한 실험은 code commit, dependency lock, Python/OS/GPU version, data snapshot/hash, preprocessing config, split ID, 모든 library seed, deterministic algorithm flag를 기록합니다. 외부 API·병렬 reduction·GPU kernel은 seed만 같아도 비결정적일 수 있습니다.",
        "random state를 pickle로 저장할 수 있지만 pickle은 신뢰할 수 없는 source에서 code execution 위험이 있습니다. 내부 artifact라도 version 호환과 provenance를 관리하고 가능하면 split ID·생성 config처럼 더 단순한 결과 artifact를 저장합니다.",
        "세션 token·password reset·초대 code는 secrets.token_urlsafe, secrets.randbelow를 사용합니다. 재현되면 안 되는 보안 값에 fixed seed를 쓰지 않습니다. 테스트는 실제 token 값을 고정하기보다 형식·길이·충돌 정책과 generator dependency를 검증합니다.",
        "공정 추첨은 난수 API 하나보다 seed commitment·audit log·bias 없는 sampling·독립 검증이 필요할 수 있습니다. 규제 요구에 맞는 cryptographic RNG와 절차를 사용합니다.",
      ],
      concepts: [
        { term: "experiment provenance", definition: "결과를 다시 만들고 비교하기 위해 code·data·환경·config·seed·split·artifact의 출처와 version을 기록한 정보입니다.", detail: ["seed보다 넓습니다.", "민감 data 원문 대신 hash·접근 제어를 사용합니다."] },
        { term: "CSPRNG", definition: "출력 일부를 알아도 다음 값을 현실적으로 예측하기 어렵도록 설계된 cryptographically secure pseudo-random generator입니다.", detail: ["Python secrets가 OS 보안 난수를 사용합니다.", "simulation random과 목적이 다릅니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "password reset token·API key를 random.randint나 fixed seed로 생성한다.", likelyCause: "실험 재현용 PRNG와 공격자 예측을 막는 보안 난수 요구를 혼동했습니다.", checks: ["credential·token 생성 경로의 random import를 찾습니다.", "entropy·길이·URL encoding·만료·단일 사용 정책을 검토합니다.", "token이 로그에 남는지 확인합니다."], fix: "secrets.token_urlsafe·token_bytes 또는 검증된 인증 library를 사용하고 충분한 entropy·만료·hash 저장·단일 사용을 적용합니다.", prevention: "보안 lint·threat model·token negative test를 두고 값 원문을 로그에서 금지합니다." },
      ],
      comparisons: [
        { title: "어떤 난수 도구를 사용할까요?", options: [
          { name: "random.Random", chooseWhen: "simulation·학습 split·재현 가능한 일반 sampling일 때", avoidWhen: "token·password·공격자가 예측하면 안 되는 값", tradeoffs: ["seed와 독립 state를 제어하기 쉽습니다.", "암호학적 안전성이 없습니다.", "호출 순서와 환경 provenance가 필요합니다."] },
          { name: "secrets", chooseWhen: "인증 token·임시 password·보안 nonce처럼 예측 저항성이 필요할 때", avoidWhen: "같은 실험 sequence를 seed로 재현해야 할 때", tradeoffs: ["OS 보안 entropy를 사용합니다.", "의도적으로 deterministic 재현을 제공하지 않습니다.", "수명·저장·비교 정책도 필요합니다."] },
          { name: "전문 ML RNG", chooseWhen: "NumPy·PyTorch·GPU tensor 연산과 distributed worker를 제어할 때", avoidWhen: "표준 Python list sampling만 필요한 작은 script", tradeoffs: ["vectorized·device별 generator를 제공합니다.", "library·device마다 별도 seed와 deterministic flag가 필요합니다.", "성능과 완전 결정성 tradeoff가 있습니다."] },
        ] },
      ],
      expertNotes: ["Python random sequence의 cross-version 영구 호환을 artifact contract로 가정하지 말고 생성된 split ID 자체를 저장합니다.", "Counter 기반 vocabulary를 model artifact에 저장할 때 tokenizer version·normalization·minimum count·tie-break를 함께 고정해 token ID drift를 막습니다."],
    },
  ],
  lab: {
    title: "재현 가능한 텍스트 분류 split·vocabulary artifact",
    scenario: "문서 ID·user group·label·text가 있는 합성 corpus를 group-aware로 80/10/10 분할하고 train text만으로 Counter vocabulary를 만듭니다.",
    setup: ["dataset_artifact.py와 test_dataset_artifact.py를 만듭니다.", "최소 30개 합성 문서와 반복 user group·불균형 label을 준비합니다.", "실제 개인정보는 사용하지 않습니다."],
    steps: ["입력 document ID·group ID unique와 필수 field를 검증합니다.", "Random(seed) 한 객체를 split 전용으로 만들고 group 단위 순서를 copy·shuffle합니다.", "group 전체를 train/val/test 중 하나에 배치하고 ID·group 교집합이 없는지 검증합니다.", "희귀 label이 평가에 없을 경우 경고·재분할 정책을 정합니다.", "tokenizer는 NFC·casefold·명시 regex와 versioned stopwords를 사용합니다.", "vocabulary Counter는 train text만 update하고 (-count,token)으로 결정적 순서를 만듭니다.", "artifact에 code version·data hash·seed·split IDs·tokenizer config·Counter 결과를 JSON으로 저장합니다.", "같은 config 두 실행의 artifact hash가 같은지, 다른 seed가 split만 바꾸는지 테스트합니다.", "duplicate text·same group leakage·empty label·동점 token·global random 간섭을 테스트합니다."],
    expectedResult: ["같은 data·config·환경에서 split ID와 vocabulary artifact가 동일합니다.", "train/validation/test의 document·group 교집합이 비어 있습니다.", "validation/test token은 vocabulary fit에 영향을 주지 않습니다.", "동점 token ID 순서가 결정적입니다.", "입력 corpus와 전역 random state가 변경되지 않습니다.", "artifact가 seed만 아니라 재현에 필요한 provenance를 포함합니다."],
    cleanup: ["합성 artifact를 TemporaryDirectory에서 제거합니다."],
    extensions: ["multilabel iterative stratification을 비교합니다.", "temporal holdout과 group split을 함께 설계합니다.", "NumPy/PyTorch generator seed manifest를 추가합니다.", "민감 희귀 token에 differential privacy 또는 minimum frequency를 검토합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 random·Counter 출력을 재현하고 전역·독립 RNG를 비교하세요.", requirements: ["seed 42·5 정수 sequence와 seed 42 float sequence를 기록합니다.", "shuffle 전후 원본 mutation과 copy version을 비교합니다.", "80/10/10 split 교집합·완전성을 확인합니다.", "Counter missing 0·most_common·total·len 차이를 기록합니다."], hints: ["격리 process에서 원본 기준 출력을 만듭니다.", "Random(42) 두 객체 sequence를 나란히 비교합니다."], expectedOutcome: "난수 state와 Counter 의미를 출력으로 예측합니다.", solutionOutline: ["원본을 먼저 실행합니다.", "global 코드를 local RNG로 바꿉니다.", "동일 seed·다른 seed·호출 추가 실험을 합니다."] },
    { difficulty: "응용", prompt: "설문 응답을 respondent group 단위로 split하고 답변 빈도를 분석하세요.", requirements: ["같은 respondent가 여러 split에 들어가지 않습니다.", "희귀 response label 분포를 보고합니다.", "train에서만 Counter category vocabulary를 만듭니다.", "missing·unknown·동점 category 정책을 정합니다.", "seed·split ID·data hash를 artifact에 기록합니다."], hints: ["row shuffle보다 group 목록을 shuffle합니다.", "Counter missing 0과 실제 key 존재를 구분합니다."], expectedOutcome: "group leakage 없는 재현 가능한 빈도·split pipeline을 만듭니다." },
    { difficulty: "설계", prompt: "분산 ML 실험의 end-to-end reproducibility 정책을 설계하세요.", requirements: ["Python·NumPy·framework·worker·GPU RNG owner를 목록화합니다.", "data snapshot·split manifest·code commit·container·dependency lock을 기록합니다.", "deterministic algorithm 성능 tradeoff와 비결정 연산을 분류합니다.", "재시작·checkpoint·worker count 변화에 stable sampling을 설계합니다.", "secret seed와 실험 seed를 분리하고 보안 token은 secrets를 사용합니다.", "artifact signing·access·retention·민감 token 빈도 보호를 포함합니다."], hints: ["하나의 global seed 호출로 모든 library가 고정되지 않습니다.", "결과 split ID를 저장하면 PRNG algorithm drift를 줄일 수 있습니다."], expectedOutcome: "seed 한 줄을 감사 가능한 실험 lineage와 보안 난수 분리 정책으로 확장합니다." },
  ],
  reviewQuestions: [
    { question: "같은 seed면 어떤 조건에서 같은 난수 sequence가 나오나요?", answer: "같은 generator algorithm·초기 state·입력 순서·호출 순서에서 같은 sequence가 나옵니다." },
    { question: "왜 library 함수 안에서 random.seed를 호출하면 좋지 않나요?", answer: "module 전역 RNG state를 reset해 caller와 다른 component의 sequence·test 순서에 간섭하기 때문입니다." },
    { question: "shuffle의 반환값과 원본 효과는 무엇인가요?", answer: "list를 제자리에서 섞고 None을 반환하므로 원본 보존이 필요하면 copy를 먼저 만듭니다." },
    { question: "sample과 choices의 기본 차이는 무엇인가요?", answer: "sample은 중복 없는 추출이고 choices는 기본적으로 복원 추출이라 같은 요소가 여러 번 나올 수 있습니다." },
    { question: "seed 42의 80/10/10 분할이면 leakage가 없다고 보장되나요?", answer: "아닙니다. entity·group·time·duplicate 단위를 고려하고 preprocessing도 train에서만 fit해야 합니다." },
    { question: "Counter에 없는 key를 조회하면 무엇인가요?", answer: "KeyError 대신 count 0을 반환하지만 key membership과는 다릅니다." },
    { question: "most_common 동점 순서는 항상 key 오름차순인가요?", answer: "아닙니다. 처음 만난 순서에 의존할 수 있어 결정적 결과는 명시 복합 정렬을 사용합니다." },
    { question: "보안 token에 random.Random을 쓰면 안 되는 이유는 무엇인가요?", answer: "일반 PRNG는 출력이 예측 가능할 수 있어 공격자 예측 저항성을 제공하지 않으므로 secrets를 사용합니다." },
  ],
  completionChecklist: [
    "PRNG seed·state·호출 순서의 결정성을 설명할 수 있다.",
    "전역 random 대신 독립 Random 객체를 주입할 수 있다.",
    "randint·choice·sample·choices·shuffle 계약을 구분할 수 있다.",
    "원본을 보존하고 disjoint·complete한 split을 만들 수 있다.",
    "group·time·stratification과 preprocessing leakage를 진단할 수 있다.",
    "Counter missing·total·most_common·동점·음수 count를 설명할 수 있다.",
    "정규화·tokenization·stopword가 빈도 결과에 미치는 영향을 고정할 수 있다.",
    "실험 provenance와 secrets 기반 보안 난수 정책을 분리할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-random-source", repository: "PYTHON-BASIC", path: "day07/ex03_random.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day07/ex03_random.py", usedFor: ["seed", "randint", "random", "shuffle", "80/10/10 split"], evidence: "원본을 Python 3.13.9에서 실행해 seed 42·5 정수, seed 42 float, 0~9 shuffle과 train 80/val 10/test 10 출력을 확인했습니다." },
    { id: "py-counter-source", repository: "PYTHON-BASIC", path: "day07/ex04_collection.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day07/ex04_collection.py", usedFor: ["Counter", "missing 0", "most_common", "단어 빈도", "불용어 제거"], evidence: "원본 실행에서 dog 4·cat 3·bird 2, fish 0, 상위 2개와 the/cat/on/mat 빈도, stopword 제거 결과를 확인했습니다." },
    { id: "python-random-doc", repository: "Python documentation", path: "library/random.html", publicUrl: "https://docs.python.org/3/library/random.html", usedFor: ["PRNG", "Random instance", "seed", "choice·sample·shuffle", "보안 경고"], evidence: "공식 random module 계약을 범위·state·thread·security 선택 기준으로 사용했습니다." },
    { id: "python-counter-doc", repository: "Python documentation", path: "library/collections.html#collections.Counter", publicUrl: "https://docs.python.org/3/library/collections.html#collections.Counter", usedFor: ["missing 0", "update·subtract", "most_common", "total", "multiset 연산"], evidence: "공식 Counter 계약을 빈도·동점·0/음수 count 설명의 기준으로 사용했습니다." },
  ],
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["NumPy·PyTorch·GPU RNG와 stratified/group split library API는 ML 과정에서 실제 tensor·dataframe과 함께 확장합니다.", "독립 RNG·leakage audit·Unicode tokenization·CSPRNG·provenance manifest는 원본 random/Counter 예제를 전문가 실험 운영 수준으로 보강한 내용입니다."] },
} satisfies DetailedSession;

export default session;
