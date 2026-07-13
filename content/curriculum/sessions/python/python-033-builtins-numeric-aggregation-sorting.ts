import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-033"],
  slug: "python-033-builtins-numeric-aggregation-sorting",
  courseId: "python",
  moduleId: "03-oop-stdlib",
  order: 33,
  title: "내장 함수·수치 집계·정렬",
  subtitle: "짧은 내장 함수 호출 뒤의 iterable·truthiness·비교·정밀도 계약을 이해해, 데이터 누락을 숨기지 않는 집계와 안정적인 순위를 만듭니다.",
  level: "중급",
  estimatedMinutes: 145,
  coreQuestion: "abs·sum·zip·all·any·min·max·sorted 같은 내장 함수를 데이터 길이·빈 입력·타입·정밀도·동점 정책까지 포함한 신뢰 가능한 계산으로 어떻게 조합할까요?",
  summary: "원본의 MAE 0.40, zip strict 길이 오류, 확률 검증, 이상치, 최고·최저 학생, 안정 정렬을 실행 모델로 재구성합니다. iterable 지연 소비와 short-circuit, all(empty)=True·any(empty)=False, min/max 빈 입력, key 1회 평가, stable sort와 복합 key를 다룹니다. round의 bankers rounding·float 경계, divmod·chr/ord·enumerate와 함께 eval 보안 위험과 안전한 parser 대안을 전문가 수준으로 확장합니다.",
  objectives: [
    "내장 함수가 구체 list가 아니라 iterable·comparison·truthiness protocol을 소비한다는 점을 설명할 수 있다.",
    "abs·sum·len을 사용한 MAE를 구현하고 빈 입력·길이 불일치·NaN·가중치 정규화 경계를 검증할 수 있다.",
    "zip의 shortest truncation과 strict=True 실패 시점을 구분해 누락 data를 조기에 찾을 수 있다.",
    "all·any의 short-circuit와 빈 iterable 결과를 논리 항등원으로 설명하고 검증 bug를 피할 수 있다.",
    "min·max·sorted의 key·default·reverse와 stable sorting을 사용해 결정적 순위 정책을 만들 수 있다.",
    "round·divmod·pow·chr·ord·enumerate를 domain 단위·정밀도·Unicode 경계에 맞게 사용할 수 있다.",
    "신뢰할 수 없는 문자열에 eval을 사용하지 않고 JSON·ast.literal_eval·명시 parser를 선택할 수 있다.",
  ],
  prerequisites: [
    { title: "break·continue·for·range", reason: "iterable 소비와 enumerate·zip loop, short-circuit 흐름을 추적합니다.", sessionSlug: "python-019-break-continue-for-range" },
    { title: "함수 계약·스코프·반환", reason: "집계 함수의 빈 입력·실패·반환 타입을 계약으로 만듭니다.", sessionSlug: "python-021-function-contract-scope-return" },
    { title: "lambda·map·filter·고차 함수", reason: "sorted·min·max의 key callable과 지연 iterable을 연결합니다.", sessionSlug: "python-023-lambda-map-filter-higher-order" },
  ],
  keywords: ["Python", "builtins", "abs", "sum", "zip", "strict", "all", "any", "min", "max", "sorted", "stable sort", "round", "eval", "MAE"],
  chapters: [
    {
      id: "builtins-and-protocols",
      title: "내장 함수는 짧은 문법 뒤에서 iterable·truthiness·comparison protocol을 호출합니다",
      lead: "sum(values)와 sorted(values)는 list 전용이 아니며 generator·tuple·사용자 iterable을 소비하므로 재사용과 소진 여부를 이해해야 합니다.",
      explanations: [
        "내장 함수는 Python runtime이 기본 제공하는 callable이지만 마법처럼 모든 입력을 알아서 정제하지 않습니다. sum은 더할 수 있는 요소 iterable, len은 __len__, sorted는 iteration과 비교 가능한 key, all·any는 truthiness를 요구합니다. 입력 계약이 어긋나면 TypeError나 의미 오류가 납니다.",
        "generator를 sum·all·sorted에 넘기면 소비됩니다. 같은 generator를 두 번째 집계하면 비어 있을 수 있습니다. 여러 통계가 필요하면 한 번 loop에서 함께 계산하거나 재반복 가능한 collection으로 materialize하되 data 크기를 고려합니다.",
        "지역 변수 이름을 sum, max, list처럼 만들면 내장 이름을 가려 이후 호출이 실패합니다. builtins module로 우회할 수 있지만 total·maximum·items처럼 의미 있는 이름으로 고치는 것이 좋습니다.",
        "짧은 한 줄이 정확하다는 보장은 없습니다. data provenance·단위·빈 입력·길이·NaN·정렬 동점 정책을 함수 경계에서 검증하고 계산식은 그 뒤 간결하게 유지합니다.",
      ],
      concepts: [
        { term: "protocol-oriented builtin", definition: "구체 class보다 __iter__·__len__·__bool__·비교 같은 행동 protocol을 통해 다양한 객체를 처리하는 내장 함수입니다.", detail: ["duck typing과 연결됩니다.", "지원 protocol과 domain 의미는 별도입니다."] },
        { term: "iterator consumption", definition: "sum·list·sorted 같은 소비자가 iterator에서 요소를 꺼내 상태를 끝까지 진행시키는 동작입니다.", detail: ["한 번 소비되는 generator는 재사용할 수 없습니다.", "무한 iterator에는 종료 조건 없는 소비자를 쓰면 끝나지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "첫 집계는 맞지만 같은 data의 두 번째 집계가 0·빈 결과가 된다.", likelyCause: "list가 아니라 한 번 소비되는 iterator/generator를 첫 내장 함수가 모두 소진했습니다.", checks: ["iter(value) is value인지 확인합니다.", "type과 repr 대신 next를 제한적으로 관찰합니다.", "어느 함수가 iterator를 소비하는지 순서를 추적합니다."], fix: "재사용이 필요하면 bounded collection으로 materialize하거나 한 pass에서 여러 집계를 계산하거나 iterator factory를 다시 호출합니다.", prevention: "API type을 Iterable과 Iterator로 구분하고 두 번 소비하는 test를 둡니다." },
      ],
    },
    {
      id: "abs-sum-mae",
      title: "수치 집계는 수식보다 길이·빈 값·유한성·단위 검증이 먼저입니다",
      lead: "MAE는 대응하는 실제값과 예측값 차이의 절대값 평균이며 pair 정렬과 분모가 정확해야 의미가 있습니다.",
      explanations: [
        "원본 actual=[3.0,2.5,4.0,5.0], predicted=[2.5,2.9,3.5,4.8]에서 절대 오차는 0.5,0.4,0.5,0.2이고 합 1.6을 4로 나눠 0.40입니다. abs는 부호를 제거하지만 오차 방향 정보는 잃으므로 bias가 필요하면 signed error도 별도 계산합니다.",
        "빈 두 list는 길이가 같아도 평균 분모가 0입니다. domain에서 metric undefined로 예외를 낼지 None을 반환할지 정합니다. 0.0으로 조용히 바꾸면 예측이 완벽한 경우와 평가 sample 없음이 섞입니다.",
        "NaN은 비교와 집계를 오염시켜 sum 결과도 NaN이 될 수 있습니다. math.isfinite로 actual·predicted를 검증하거나 missing 정책을 명시합니다. 일부 pair만 drop하면 sample 수와 selection bias를 함께 보고합니다.",
        "weighted mean은 sum(error*weight)/sum(weight)이며 단순히 len으로 나누지 않습니다. weight 음수·모두 0·길이 불일치를 검증합니다. 시간·금액·거리처럼 단위가 다르면 같은 숫자 list라도 직접 평균내지 않습니다.",
      ],
      concepts: [
        { term: "MAE", definition: "대응하는 실제값과 예측값의 절대 오차를 평균한 회귀 metric입니다.", detail: ["원래 target과 같은 단위를 가집니다.", "오차 방향과 큰 오차 제곱 강조는 하지 않습니다."] },
        { term: "finite number", definition: "NaN과 양·음의 Infinity가 아닌 정상 유한 수치입니다.", detail: ["math.isfinite로 검사합니다.", "bool을 숫자로 허용할지도 domain에서 정합니다."] },
      ],
      codeExamples: [
        {
          id: "validated-mae",
          title: "길이·빈 입력·유한 수를 검증하는 MAE",
          language: "python",
          filename: "validated_mae.py",
          purpose: "zip(strict=True)와 명시 경계 검증으로 정상 0.40과 세 실패 분류를 재현합니다.",
          code: "from math import isfinite\n\ndef mean_absolute_error(actual, predicted):\n    if not actual:\n        raise ValueError('at least one pair is required')\n    pairs = list(zip(actual, predicted, strict=True))\n    if any(type(value) not in (int, float) or not isfinite(value)\n           for pair in pairs for value in pair):\n        raise ValueError('all values must be finite numbers')\n    return sum(abs(a - p) for a, p in pairs) / len(pairs)\n\ncases = [\n    ([3.0, 2.5, 4.0, 5.0], [2.5, 2.9, 3.5, 4.8]),\n    ([1.0, 2.0], [1.0]),\n    ([], []),\n    ([1.0, float('nan')], [1.0, 2.0]),\n]\nfor index, (actual, predicted) in enumerate(cases, 1):\n    try:\n        print(f'{index}: MAE={mean_absolute_error(actual, predicted):.2f}')\n    except ValueError as error:\n        print(f'{index}: ERROR {error}')",
          walkthrough: [
            { lines: "1-5", explanation: "빈 실제값을 metric undefined로 먼저 거부하고 strict zip으로 길이를 검증하며 pair를 한 번 materialize합니다." },
            { lines: "6-9", explanation: "bool을 제외한 정확한 int·float와 유한성을 모든 pair에서 검사합니다." },
            { lines: "10", explanation: "검증된 pair만 절대 오차 합과 실제 pair 수로 평균냅니다." },
            { lines: "12-17", explanation: "정상, 길이 불일치, 빈 입력, NaN 네 경계를 준비합니다." },
            { lines: "18-22", explanation: "strict zip도 ValueError이므로 동일 호출자 경계에서 의미 있는 메시지와 함께 관찰합니다." },
          ],
          run: { environment: ["Python 3.10 이상", "validated_mae.py로 저장"], command: "python validated_mae.py" },
          output: { value: "1: MAE=0.40\n2: ERROR zip() argument 2 is shorter than argument 1\n3: ERROR at least one pair is required\n4: ERROR all values must be finite numbers", explanation: ["원본 네 pair의 MAE는 0.40입니다.", "길이 불일치는 짧은 쪽을 조용히 버리지 않고 strict 오류가 됩니다.", "빈 data와 NaN은 서로 다른 계약 오류로 분류됩니다."] },
          experiments: [
            { change: "strict=True를 제거합니다.", prediction: "두 번째 case가 첫 pair만 사용해 MAE=0.00으로 성공처럼 보입니다.", result: "zip의 기본 shortest truncation이 label·prediction 누락을 숨길 수 있습니다." },
            { change: "빈 check를 zip 뒤 pairs의 길이 검사로 옮깁니다.", prediction: "동일 결과지만 generic iterable을 받으면 truthiness·len 가정 없이 pairs 기준으로 처리할 수 있습니다.", result: "API가 Sequence인지 Iterable인지에 따라 validation 위치를 설계합니다." },
          ],
          sourceRefs: ["py-builtin-source", "python-builtins-doc"],
        },
      ],
      diagnostics: [
        { symptom: "평가 metric이 좋아 보이지만 실제값과 예측값 길이가 다르다.", likelyCause: "기본 zip이 짧은 iterable에서 멈춰 남은 sample을 조용히 버렸습니다.", checks: ["두 입력 count와 sample ID 집합을 비교합니다.", "zip strict 사용 여부를 봅니다.", "shuffle·filter 뒤 alignment가 유지되는지 확인합니다."], fix: "Python 3.10+ zip(...,strict=True) 또는 사전 길이·ID join 검증을 사용하고 누락 sample을 오류·report로 처리합니다.", prevention: "길이뿐 아니라 sample ID alignment contract test를 둡니다." },
      ],
    },
    {
      id: "zip-enumerate-alignment",
      title: "zip은 위치를 묶고 enumerate는 관찰용 순번을 붙이므로 실제 식별자와 혼동하지 않습니다",
      lead: "두 iterable이 같은 순서·길이라는 전제가 있을 때만 위치 zip이 의미 있는 pair를 만듭니다.",
      explanations: [
        "zip(actual,predicted)는 각 iterator에서 한 요소씩 가져와 tuple을 만듭니다. 기본은 어느 하나가 끝나면 멈춥니다. strict=True는 소비 과정에서 길이 불일치를 발견하므로 generator의 오류가 zip 생성 줄이 아니라 iteration 중 나타납니다.",
        "두 dataset이 정렬 기준이 다르면 길이가 같아도 잘못된 pair가 만들어집니다. ML label·prediction은 sample ID를 보존하고 ID로 join하거나 split index를 동일하게 적용합니다. 위치 alignment는 schema contract입니다.",
        "enumerate(items,start=1)는 순번과 value를 제공하지만 그 index가 database ID는 아닙니다. filter·sort 뒤 enumerate 번호는 바뀝니다. 사용자-facing row number와 안정 식별자를 따로 둡니다.",
        "여러 iterable zip strict는 어느 argument가 짧거나 긴지 오류를 제공합니다. 무한 iterator와 유한 iterator를 strict로 묶으면 유한 쪽 종료 뒤 무한 쪽 추가 요소를 확인하고 오류가 납니다. 소비 side effect와 종료를 고려합니다.",
      ],
      concepts: [
        { term: "positional alignment", definition: "여러 iterable의 같은 순번 요소가 같은 관측 대상을 나타낸다는 data 계약입니다.", detail: ["같은 길이만으로 충분하지 않습니다.", "stable ID로 검증할 수 있습니다."] },
        { term: "enumerate", definition: "iterable 요소를 소비하면서 지정 start의 증가 순번과 value tuple을 생성하는 내장 함수입니다.", detail: ["지연 iterator를 반환합니다.", "순번은 domain ID와 다릅니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "길이는 같은데 metric·join 결과가 이상하고 sample별 비교가 뒤섞인다.", likelyCause: "두 iterable의 sort·filter·shuffle 순서가 달라 positional alignment가 깨졌습니다.", checks: ["pair마다 stable sample ID를 함께 출력합니다.", "전처리 pipeline의 shuffle seed와 filter 조건을 비교합니다.", "ID set 차이와 순서를 각각 검사합니다."], fix: "ID key로 명시 join하고 동일 split index를 양쪽에 적용하며 zip 전 ID equality를 단언합니다.", prevention: "data pipeline artifact에 sample ID와 order hash를 보존합니다." },
      ],
    },
    {
      id: "all-any-truthiness",
      title: "all·any는 short-circuit하고 빈 iterable에서는 각각 True·False를 반환합니다",
      lead: "all은 모든 요소가 truthy인지, any는 하나라도 truthy인지 검사하며 필요한 지점까지만 iterator를 소비합니다.",
      explanations: [
        "원본 all([1,2,3])은 True, all([1,0,3])은 False이고 any([0,0,0])은 False입니다. 공백 문자열 ' '은 비어 있지 않아 truthy입니다. 사용자 입력의 의미 있는 값 검증에는 value.strip() 같은 domain predicate가 필요합니다.",
        "all(generator)는 첫 falsy에서 멈추고 any는 첫 truthy에서 멈춥니다. 뒤 요소의 expensive call이나 예외·side effect는 실행되지 않을 수 있습니다. 검증은 순수 predicate로 만들고 모든 오류를 수집해야 하면 explicit loop를 사용합니다.",
        "논리 항등 때문에 all([])은 True, any([])은 False입니다. '모든 점수가 범위 안'을 all로만 검사하면 빈 점수도 True가 됩니다. 최소 하나가 필요하면 bool(scores) and all(...) 또는 별도 empty 오류를 둡니다.",
        "sample value가 None이 아닌지 all(v is not None ...)로 확인하면 0·False·빈 문자열도 유효하게 보존할 수 있습니다. all(values)로 바꾸면 합법적인 0까지 missing으로 오해합니다. missing sentinel과 truthiness를 구분합니다.",
      ],
      concepts: [
        { term: "vacuous truth", definition: "반례가 하나도 없는 빈 집합에서 '모든 요소가 조건을 만족한다'가 True가 되는 논리 규칙이며 all([])=True에 반영됩니다.", detail: ["data 존재 요구는 별도 검사입니다.", "any([])=False는 참인 증거가 없기 때문입니다."] },
        { term: "short-circuit", definition: "결과가 확정되면 남은 요소를 평가·소비하지 않는 실행 방식입니다.", detail: ["all은 첫 False, any는 첫 True에서 멈춥니다.", "predicate side effect에 의존하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "빈 입력이 '모두 유효함' 검사에서 통과한다.", likelyCause: "all(empty)가 True라는 논리 규칙과 최소 한 요소 domain 요구를 분리하지 않았습니다.", checks: ["입력 count와 all 결과를 각각 기록합니다.", "generator가 앞에서 이미 소진됐는지 확인합니다.", "최소 cardinality 계약을 찾습니다."], fix: "빈 입력을 먼저 거부하거나 bool(items) and all(predicate(x) for x in items)처럼 존재 조건을 추가합니다.", prevention: "empty·one valid·one invalid·mixed 사례를 validator test에 포함합니다." },
      ],
    },
    {
      id: "min-max-sorted",
      title: "min·max·sorted는 key로 비교 기준을 분리하고 stable sort로 동점을 결정합니다",
      lead: "key callable은 각 요소를 비교 가능한 값으로 변환하며 원본 요소 자체가 결과로 반환됩니다.",
      explanations: [
        "원본 max(students,key=lambda x:x['score'])는 score가 가장 큰 원본 dict를 반환합니다. 빈 iterable에서는 ValueError이며 min/max는 default를 지정할 수 있습니다. 그러나 empty가 오류인지 없음인지 domain에 따라 선택합니다.",
        "sorted는 새 list를 반환해 원본을 유지하고 list.sort는 원본을 제자리 변경하며 None을 반환합니다. large data에서 둘 다 요소 reference list memory를 사용하며 이미 정렬된 lazy stream을 만들지는 않습니다.",
        "Python sort는 stable하여 key가 같은 요소의 입력 순서를 보존합니다. 점수 내림차순·이름 오름차순은 key=lambda s:(-s.score,s.name)처럼 한 tuple key로 명시할 수 있습니다. reverse=True는 전체 비교 방향을 뒤집으므로 혼합 방향에는 tuple 변환 또는 여러 stable pass를 사용합니다.",
        "key function은 보통 요소당 한 번 평가되므로 expensive normalization을 key에 둘 수 있지만 예외·I/O side effect는 피합니다. None과 숫자가 섞인 key는 직접 비교할 수 없어 missing rank를 tuple 첫 요소로 분리합니다.",
      ],
      concepts: [
        { term: "key function", definition: "정렬·min·max가 각 원본 요소에서 비교 기준을 한 번 추출하도록 받는 callable입니다.", detail: ["결과는 원본 요소입니다.", "비교 가능한 일관 타입을 반환해야 합니다."] },
        { term: "stable sort", definition: "비교 key가 같은 요소들의 기존 상대 순서를 유지하는 정렬 성질입니다.", detail: ["여러 단계 정렬과 결정적 tie-break에 유용합니다.", "입력 순서가 비결정적이면 안정성만으로 결과가 결정적이지 않습니다."] },
      ],
      codeExamples: [
        {
          id: "deterministic-ranking",
          title: "점수·시간·이름으로 결정적 학생 순위 만들기",
          language: "python",
          filename: "stable_ranking.py",
          purpose: "복합 key와 stable sorting, 원본 보존, min/max 원본 반환을 확인합니다.",
          code: "students = [\n    {'name': 'Carol', 'score': 95, 'minutes': 80},\n    {'name': 'Alice', 'score': 88, 'minutes': 40},\n    {'name': 'Bob', 'score': 95, 'minutes': 70},\n    {'name': 'Dave', 'score': 95, 'minutes': 70},\n]\n\nranked = sorted(\n    students,\n    key=lambda student: (-student['score'], student['minutes'], student['name']),\n)\nfor rank, student in enumerate(ranked, 1):\n    print(f\"{rank}. {student['name']} {student['score']}/{student['minutes']}\")\n\nbest = max(students, key=lambda student: student['score'])\nlowest = min(students, key=lambda student: student['score'])\nprint(f\"max-first={best['name']}, min={lowest['name']}\")\nprint([student['name'] for student in students])",
          walkthrough: [
            { lines: "1-6", explanation: "동점 95 세 명과 입력 순서를 관찰할 수 있는 원본 list를 준비합니다." },
            { lines: "8-11", explanation: "score는 음수로 내림차순, minutes와 name은 오름차순인 tuple key를 만듭니다." },
            { lines: "12-13", explanation: "enumerate start=1로 display rank를 붙입니다." },
            { lines: "15-17", explanation: "max는 첫 최고점 Carol, min은 Alice 원본 dict를 반환합니다. max 자체에는 추가 tie-break가 없습니다." },
            { lines: "18", explanation: "sorted가 원본 students 순서를 변경하지 않았음을 확인합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "stable_ranking.py로 저장"], command: "python stable_ranking.py" },
          output: { value: "1. Bob 95/70\n2. Dave 95/70\n3. Carol 95/80\n4. Alice 88/40\nmax-first=Carol, min=Alice\n['Carol', 'Alice', 'Bob', 'Dave']", explanation: ["Bob과 Dave는 score·minutes가 같아 name 오름차순으로 결정됩니다.", "max의 key 동점은 첫 입력 Carol을 반환합니다.", "원본 list는 그대로 보존됩니다."] },
          experiments: [
            { change: "tuple key에서 name을 제거합니다.", prediction: "Bob과 Dave 동점의 입력 상대 순서 Bob→Dave가 stable하게 유지됩니다.", result: "입력 source 순서가 달라지면 동점 결과도 달라질 수 있어 결정적 tie-break가 필요합니다." },
            { change: "sorted 대신 students.sort를 사용하고 반환값을 print합니다.", prediction: "students 자체가 정렬되고 method 반환은 None입니다.", result: "새 결과와 in-place mutation 계약을 구분합니다." },
          ],
          sourceRefs: ["py-numeric-source", "python-sorted-doc"],
        },
      ],
      diagnostics: [
        { symptom: "같은 점수의 순위가 실행·DB 조회마다 바뀐다.", likelyCause: "tie-break key를 정하지 않았고 입력 순서 자체가 비결정적입니다.", checks: ["key가 동점일 때 추가 field를 확인합니다.", "DB query에 ORDER BY가 완전한지 봅니다.", "set·dict source 순서에 의존하는지 확인합니다."], fix: "domain상 결정적 unique tie-breaker를 복합 key/ORDER BY 마지막에 추가합니다.", prevention: "동점 여러 개와 입력 순서 permutation을 ranking test에 포함합니다." },
      ],
    },
    {
      id: "round-divmod-unicode",
      title: "round·divmod·chr·ord는 표시·단위·Unicode code point 계약과 함께 사용합니다",
      lead: "숫자를 보기 좋게 출력하는 것과 저장할 정확 값을 바꾸는 것은 다른 결정입니다.",
      explanations: [
        "round(x,n)는 tie에서 nearest-even 방식과 binary float 표현의 영향을 받습니다. round(2.5)=2, round(3.5)=4이고 round(2.675,2)가 직관과 다를 수 있습니다. 금액은 Decimal과 명시 rounding mode를 사용합니다. f-string 표시 형식도 원본 값을 변경하지 않습니다.",
        "divmod(a,b)는 (a//b,a%b)를 한 tuple로 반환하고 음수에서 floor division 규칙을 따릅니다. pagination·시간 단위 분해에 유용하지만 page number가 0/1 기반인지, 음수 입력을 허용하는지 정합니다.",
        "pow(base,exp,mod)는 세 인수에서 효율적 modular exponentiation을 제공하지만 암호 protocol을 직접 조립하는 것은 위험합니다. 검증된 cryptography library를 사용합니다.",
        "ord는 길이 1 Unicode str의 code point를 int로, chr은 유효 code point int를 str로 바꿉니다. 사용자가 보는 한 글자는 combining mark·emoji sequence 여러 code point일 수 있습니다. code point와 grapheme cluster를 구분합니다.",
      ],
      concepts: [
        { term: "round half to even", definition: "정확히 중간인 값에서 마지막 자리의 짝수 쪽을 선택해 반복 반올림 bias를 줄이는 방식입니다.", detail: ["binary float가 정확한 중간값인지 별도 문제입니다.", "Decimal rounding mode를 domain에 맞게 선택합니다."] },
        { term: "Unicode code point", definition: "Unicode 문자 체계의 정수 값으로 ord·chr가 변환하는 단위입니다.", detail: ["사용자 지각 문자 하나와 항상 같지 않습니다.", "유효 범위 밖 chr는 ValueError입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "round 결과가 기대한 상업 반올림과 다르거나 금액 합계가 1원 차이 난다.", likelyCause: "binary float와 Python round의 nearest-even을 domain의 decimal rounding과 동일하게 가정했습니다.", checks: ["repr 원본 float와 tie 값을 확인합니다.", "계약의 통화 단위·반올림 시점·mode를 찾습니다.", "Decimal 문자열 생성 경로를 확인합니다."], fix: "금액을 Decimal 또는 minor unit 정수로 표현하고 명시 rounding mode를 최종 정책 시점에 적용합니다.", prevention: "x.5 tie·음수·누적·환율 경계 golden test를 둡니다." },
      ],
    },
    {
      id: "eval-security-and-safe-parsing",
      title: "eval은 문자열 data를 현재 process 권한의 code로 실행하므로 신뢰 입력에 사용하지 않습니다",
      lead: "원본 eval('1+2')는 3을 반환하지만 같은 기능이 file·network·secret 접근 code도 실행할 수 있다는 뜻입니다.",
      explanations: [
        "eval은 Python expression을 compile·실행하고 globals·locals에 접근할 수 있습니다. 사용자 수식 계산, 설정, CSV field 변환에 쓰면 임의 code execution 취약점입니다. globals를 빈 dict로 제한해도 builtins·object graph 우회 때문에 안전 sandbox로 간주하지 않습니다.",
        "JSON data는 json.loads, Python literal 호환이 꼭 필요하고 source가 제한돼도 ast.literal_eval, 숫자는 int·float·Decimal, 날짜는 명시 parser를 사용합니다. literal_eval도 매우 큰·깊은 input의 memory·stack 자원 고갈 가능성이 있어 size limit가 필요합니다.",
        "수식 기능이 필요하면 허용 operator·함수·변수만 있는 작은 parser/AST evaluator를 만들거나 검증된 expression engine을 격리 process에서 resource limit와 함께 사용합니다. AST node whitelist만으로 attribute·call·comprehension이 새 공격면이 되지 않게 default deny합니다.",
        "eval을 제거할 때 기존 문자열 표현을 inventory하고 schema migration을 제공합니다. 단순 replace로 literal_eval로 바꾸면 기존 code expression이 실패할 수 있는데, 그 실패는 보안상 필요한 contract change일 수 있습니다.",
      ],
      concepts: [
        { term: "arbitrary code execution", definition: "공격자가 process가 실행할 code를 제어해 그 process 권한으로 파일·network·secret·명령에 접근할 수 있는 취약점입니다.", detail: ["eval·exec·unsafe deserialization이 대표 경계입니다.", "입력 validation보다 code 실행 자체를 제거합니다."] },
        { term: "allowlist parser", definition: "허용된 token·node·operator·함수만 처리하고 나머지를 기본 거부하는 제한된 해석기입니다.", detail: ["크기·깊이·시간 제한도 필요합니다.", "Python eval sandbox를 직접 흉내내지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "사용자 입력 수식·설정·CSV 값을 eval로 변환하고 있다.", likelyCause: "짧은 type 변환 편의를 data parsing과 code execution의 차이보다 우선했습니다.", checks: ["eval·exec·compile 호출과 입력 provenance를 추적합니다.", "globals 제한을 안전장치로 오해하는지 봅니다.", "실제 필요한 grammar와 타입을 목록화합니다."], fix: "JSON·명시 type parser·허용 grammar evaluator로 교체하고 input size·depth를 제한합니다.", prevention: "보안 lint와 code review에서 eval/exec를 금지하고 parser negative test를 유지합니다." },
      ],
      comparisons: [
        { title: "문자열을 어떤 방식으로 해석할까요?", options: [
          { name: "명시 parser/JSON", chooseWhen: "알려진 data schema·숫자·날짜·설정 값을 읽을 때", avoidWhen: "실제 Python language 전체 실행이 제품 요구일 때", tradeoffs: ["안전하고 계약이 명확합니다.", "허용 grammar 구현이 필요합니다.", "오류 위치·범위를 통제할 수 있습니다."] },
          { name: "ast.literal_eval", chooseWhen: "신뢰 범위의 기존 Python literal 표현을 제한적으로 migration할 때", avoidWhen: "무제한 외부 대용량 input이나 연산 expression이 필요할 때", tradeoffs: ["일반 eval보다 범위가 제한됩니다.", "JSON과 문법·상호운용이 다릅니다.", "자원 제한은 별도입니다."] },
          { name: "eval", chooseWhen: "신뢰된 개발자 code를 의도적으로 현재 process에서 평가하는 매우 제한된 도구일 때", avoidWhen: "사용자·파일·network·DB 등 외부 영향 입력", tradeoffs: ["Python expression 전체를 실행합니다.", "보안 sandbox가 아닙니다.", "감사·재현·권한 위험이 큽니다."] },
        ] },
      ],
      expertNotes: ["대규모 수치 집계에는 math.fsum·statistics·NumPy를 비교하고 overflow·NaN·dtype·분산 처리의 reduction order를 명시합니다.", "정렬 key가 locale text면 casefold만으로 모든 언어 collation을 해결하지 못하므로 locale/ICU 정책과 Unicode normalization을 계약합니다."],
    },
  ],
  lab: {
    title: "검증 가능한 모델 평가·순위 보고서",
    scenario: "sample ID·실제값·예측값·group이 있는 record를 검증해 전체/group MAE와 오류 순위를 결정적으로 출력합니다.",
    setup: ["evaluation_report.py와 test_evaluation_report.py를 만듭니다.", "표준 라이브러리만 사용하고 합성 record를 준비합니다.", "모든 수치는 같은 target 단위라고 가정합니다."],
    steps: ["actual과 prediction record를 ID로 join하고 duplicate·누락·추가 ID를 거부합니다.", "값이 bool이 아닌 유한 int/float인지 검증합니다.", "전체와 group별 MAE를 계산하되 empty group 정책을 정합니다.", "abs error 내림차순·sample ID 오름차순 복합 key로 순위를 만듭니다.", "all·any로 전체 유효·threshold 초과 존재를 검사하되 empty를 먼저 처리합니다.", "평균 표시는 f-string으로 2자리 출력하되 내부 float 값을 유지합니다.", "길이만 같은 순서 불일치, NaN, duplicate, empty, 동점, generator 재소비를 테스트합니다.", "사용자 threshold는 float parser로 읽고 eval을 사용하지 않습니다."],
    expectedResult: ["ID alignment 오류가 metric 계산 전에 발견됩니다.", "원본 대표 data의 MAE 0.40이 재현됩니다.", "빈 data와 완벽 예측 0.00이 구분됩니다.", "동점 error 순위가 반복 실행에서 결정적입니다.", "NaN·bool·무한대가 report를 오염시키지 않습니다.", "원문 record 전체를 민감 로그에 남기지 않고 ID·오류 code만 보고합니다."],
    cleanup: ["합성 data만 사용합니다."],
    extensions: ["가중 MAE와 weight 합 검증을 추가합니다.", "math.fsum과 sum의 오차를 큰 data에서 비교합니다.", "streaming 집계와 bounded top-k heap을 구현합니다.", "NumPy vectorization 결과와 동일 contract fixture를 공유합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 abs·zip·all·any·min·max·sorted를 실행하고 빈 입력을 추가하세요.", requirements: ["MAE 0.40과 strict zip 오류를 재현합니다.", "all([])·any([])·min([])·max([],default=None)을 기록합니다.", "공백·0·None truthiness를 비교합니다.", "sorted가 원본을 보존하는지 확인합니다."], hints: ["각 결과뿐 아니라 type과 입력 mutation도 기록합니다.", "빈 metric은 별도 계약 오류로 처리합니다."], expectedOutcome: "내장 함수의 정상·빈·불일치 경계를 예측합니다.", solutionOutline: ["원본 출력 기준을 만듭니다.", "한 경계씩 추가합니다.", "short-circuit와 소비 순서를 설명합니다."] },
    { difficulty: "응용", prompt: "상품 가격·평점 목록에서 검증·집계·top-k를 만드세요.", requirements: ["ID·price·rating type과 범위를 all로 검증하되 empty를 거부합니다.", "할인 전후 MAE 유사 평균 절대 변화량을 계산합니다.", "평점 내림·가격 오름·ID 오름으로 정렬합니다.", "None price 정책과 Decimal rounding을 정합니다.", "eval 없이 CSV 문자열을 변환합니다."], hints: ["bool은 int 하위 타입입니다.", "stable sort의 동점 입력 순서에만 의존하지 않습니다."], expectedOutcome: "data 계약이 명시된 결정적 상품 report를 만듭니다." },
    { difficulty: "설계", prompt: "여러 worker가 만드는 대규모 metric aggregation pipeline을 설계하세요.", requirements: ["ID alignment·dedup·partition completeness를 검증합니다.", "NaN·Infinity·missing·late record 정책을 정합니다.", "sum 순서에 따른 float 재현성과 math.fsum/Decimal 대안을 비교합니다.", "bounded memory top-k와 stable global tie-break를 설계합니다.", "schema version·관찰성·민감 ID 마스킹을 포함합니다.", "사용자 expression을 eval 없이 제한 DSL로 처리합니다."], hints: ["worker별 partial aggregate 결합 순서가 결과를 바꿀 수 있습니다.", "길이 일치가 ID 정합성을 보장하지 않습니다."], expectedOutcome: "내장 함수 수준의 수식을 분산 data 품질·재현성·보안 architecture로 확장합니다." },
  ],
  reviewQuestions: [
    { question: "zip의 기본 길이 정책은 무엇인가요?", answer: "가장 짧은 iterable이 끝나면 멈춰 긴 쪽 나머지를 버리며 strict=True로 불일치를 오류로 만들 수 있습니다." },
    { question: "all([])와 any([])는 각각 무엇인가요?", answer: "all([])은 True이고 any([])은 False이므로 최소 요소 요구는 별도로 검사합니다." },
    { question: "MAE가 빈 입력에서 0이어도 되나요?", answer: "대개 metric undefined이므로 0이라는 완벽 예측과 혼동하지 않도록 예외·None 등 명시 계약을 사용합니다." },
    { question: "max(items,key=...)는 key 값을 반환하나요?", answer: "아닙니다. key가 가장 큰 원본 요소를 반환합니다." },
    { question: "sorted와 list.sort의 중요한 차이는 무엇인가요?", answer: "sorted는 새 list를 반환하고 원본을 보존하며 list.sort는 원본을 변경하고 None을 반환합니다." },
    { question: "stable sort는 무엇을 보장하나요?", answer: "같은 비교 key 요소의 기존 상대 순서를 보존하지만 입력 순서가 비결정적이면 결과 결정성은 보장하지 않습니다." },
    { question: "round를 금액 계산에 바로 쓰면 왜 주의해야 하나요?", answer: "binary float 표현과 nearest-even 정책이 상업적 decimal rounding 계약과 다를 수 있습니다." },
    { question: "eval에 빈 globals를 주면 사용자 입력에 안전한가요?", answer: "아닙니다. Python code 실행 자체를 제거하고 명시 parser·허용 grammar를 사용해야 합니다." },
  ],
  completionChecklist: [
    "내장 함수가 소비하는 iterable·truthiness·comparison protocol을 설명할 수 있다.",
    "길이·빈 값·유한성을 검증한 MAE를 구현할 수 있다.",
    "zip strict와 ID alignment를 구분해 data 누락을 찾을 수 있다.",
    "all·any short-circuit와 빈 결과를 예측할 수 있다.",
    "min·max·sorted key·default·stable tie-break를 설계할 수 있다.",
    "round·divmod·Unicode code point를 domain 정책에 맞게 사용할 수 있다.",
    "iterator 재소비·내장 이름 가림·빈 min/max 오류를 진단할 수 있다.",
    "eval을 제거하고 안전한 data parser·제한 expression 경계를 선택할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-builtin-source", repository: "PYTHON-BASIC", path: "day07/ex01_builtin_basic.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day07/ex01_builtin_basic.py", usedFor: ["abs", "MAE", "zip strict", "all·any", "outlier", "chr·ord", "divmod", "enumerate", "eval"], evidence: "원본을 Python 3.13.9에서 실행해 MAE 0.40, strict zip 길이 오류, truthiness·이상치·Unicode·divmod·eval 출력을 확인했습니다." },
    { id: "py-numeric-source", repository: "PYTHON-BASIC", path: "day07/ex02_numeric.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day07/ex02_numeric.py", usedFor: ["sum·len", "가중합", "min·max key", "round", "pow", "sorted", "label count"], evidence: "원본 실행에서 total 433, 평균 86.60, 최고 Bob 95·최저 Carol 72, 정렬·반올림·길이 결과를 확인했습니다." },
    { id: "python-builtins-doc", repository: "Python documentation", path: "library/functions.html", publicUrl: "https://docs.python.org/3/library/functions.html", usedFor: ["abs·all·any·enumerate·eval·len·min·max·round·sorted·sum·zip"], evidence: "공식 built-in 함수 계약을 빈 iterable·strict·default·round·eval 설명의 기준으로 사용했습니다." },
    { id: "python-sorted-doc", repository: "Python documentation", path: "howto/sorting.html", publicUrl: "https://docs.python.org/3/howto/sorting.html", usedFor: ["key", "stable sorting", "복합·다단계 정렬"], evidence: "공식 sorting HOWTO를 동점과 결정적 ranking 설계의 기준으로 사용했습니다." },
  ],
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["NumPy vectorization과 ML metric library는 ML 과정에서 dtype·axis·mask와 함께 확장합니다.", "ID alignment·vacuous truth·stable tie-break·eval RCE·분산 집계 재현성은 원본 내장 함수 예제를 전문가 data pipeline 수준으로 보강한 내용입니다."] },
} satisfies DetailedSession;

const expertChapters: DetailedSession["chapters"] = [
  {
    id: "precision-empty-and-selection-contracts",
    title: "집계의 빈 입력·정밀도·선택 반환 계약을 분리합니다",
    lead: "sum·math.fsum·min·max는 모두 iterable을 소비하지만 빈 입력, 부동소수 누적, key와 반환값의 의미가 서로 다릅니다.",
    explanations: [
      "sum(iterable, start)는 iterable을 합하고 빈 iterable이면 start를 반환합니다. Python 3.12부터 float 합계 정확도 알고리즘이 개선됐지만 math.fsum과 계약은 다릅니다. start 기본값 0 때문에 빈 합계가 실제 합계 0과 구별되지 않으므로 데이터 존재가 업무 전제라면 집계 전에 개수를 검증합니다.",
      "binary float의 덧셈은 결합법칙을 만족하지 않습니다. 큰 수와 작은 수가 섞인 합계는 순서에 따라 작은 항이 사라질 수 있고 math.fsum은 여러 부분합을 추적해 일반 sum보다 정확한 결과를 제공합니다.",
      "min과 max는 빈 iterable에서 ValueError를 내지만 단일 iterable 형식에서는 default를 줄 수 있습니다. None을 default로 쓰면 실제 데이터에 None이 허용되는지까지 계약해야 합니다.",
      "key 함수는 비교용 값을 계산할 뿐 min·max가 반환하는 것은 원본 요소입니다. key가 같은 여러 요소에서는 처음 만난 요소가 선택되므로 입력 순서가 불안정하다면 명시 tie-break key가 필요합니다.",
      "집계의 시간 복잡도는 보통 요소 수 n에 선형이고 generator는 한 번 소비됩니다. 같은 데이터를 합계·최솟값·검증에 반복 사용하려면 한 번의 루프로 함께 집계하거나 의도적으로 materialize합니다.",
    ],
    concepts: [
      { term: "compensated summation", definition: "반올림으로 잃을 수 있는 작은 항을 별도 부분합으로 추적해 부동소수 합계 오차를 줄이는 방식입니다.", detail: ["math.fsum이 이 목적의 표준 도구입니다.", "Decimal·정수 단위와 선택 기준은 domain에 따라 다릅니다."] },
      { term: "selection key", definition: "원본 요소를 비교 가능한 값으로 투영하는 함수입니다.", detail: ["반환되는 값은 key 결과가 아니라 원본 요소입니다.", "동점 정책은 별도 tie-break로 표현합니다."] },
    ],
    codeExamples: [{
      id: "sum-fsum-min-max-contracts",
      title: "sum·fsum의 정밀도와 min·max의 빈 값·key 계약을 실행합니다",
      language: "python",
      filename: "aggregation_contracts.py",
      purpose: "집계 함수의 정상 결과뿐 아니라 빈 입력과 원본 요소 반환을 exact output으로 고정합니다.",
      code: String.raw`import math

values = [1e16, 1.0, 1e-16]
print("sum:", sum(values))
print("fsum:", math.fsum(values))
print("empty_sum_start:", sum([], 10))

try:
    min([])
except ValueError as error:
    print("empty_min_error:", type(error).__name__)
print("empty_min_default:", min([], default=None))

records = [
    {"id": "a", "score": 90},
    {"id": "b", "score": 95},
    {"id": "c", "score": 95},
]
winner = max(records, key=lambda item: item["score"])
print("winner:", winner)
print("lowest_id:", min(records, key=lambda item: (item["score"], item["id"]))["id"])`,
      walkthrough: [
        { lines: "1-6", explanation: "큰 float와 작은 항이 섞인 입력에서 sum과 fsum의 한 ULP 차이, 빈 sum의 start 반환을 확인합니다." },
        { lines: "8-12", explanation: "빈 min의 ValueError와 default=None 계약을 분리합니다." },
        { lines: "14-21", explanation: "max key 동점에서 첫 record가 선택되고 반환값이 원본 dict임을 확인합니다." },
      ],
      run: { environment: ["Python 3.13+", "stdin/network/filesystem 불필요"], command: "python -I -B -X utf8 aggregation_contracts.py" },
      output: { value: "sum: 1e+16\nfsum: 1.0000000000000002e+16\nempty_sum_start: 10\nempty_min_error: ValueError\nempty_min_default: None\nwinner: {'id': 'b', 'score': 95}\nlowest_id: a", explanation: ["fsum은 부동소수 표현 자체를 decimal로 바꾸지는 않지만 작은 항 누적 손실을 줄여 이 입력에서 다른 representable float를 만듭니다.", "max는 score 95라는 key가 아니라 첫 원본 record b를 반환합니다."] },
      experiments: [
        { change: "values 순서를 [1e-16, 1.0, 1e16]으로 바꿉니다.", prediction: "구현별 sum의 마지막 bit가 달라질 수 있지만 fsum은 더 강한 정확도 계약을 제공합니다.", result: "순서가 외부에서 바뀌는 분산 집계는 재현성 정책이 필요합니다." },
        { change: "min([], default=0)을 사용합니다.", prediction: "오류 없이 0을 반환합니다.", result: "실제 최솟값 0과 empty sentinel을 구분할 수 있는지 검토합니다." },
        { change: "winner key에 (score, id)를 사용합니다.", prediction: "동점에서 id가 큰 c가 선택됩니다.", result: "tie-break가 업무 규칙으로 노출됩니다." },
      ],
      sourceRefs: ["python-math-fsum", "python-builtins-sum", "python-builtins-min", "python-builtins-max"],
    }],
    diagnostics: [
      { symptom: "같은 float 데이터인데 worker 결합 순서에 따라 합계 마지막 자리가 달라진다.", likelyCause: "부동소수 덧셈을 결합법칙이 성립하는 연산처럼 취급했습니다.", checks: ["입력 순서와 partial aggregate 결합 순서를 기록합니다.", "sum과 math.fsum 결과를 비교합니다.", "NaN·Infinity와 단위 혼합을 먼저 검사합니다."], fix: "허용 오차와 reduction order를 계약하고 필요하면 math.fsum·Decimal·정수 최소 단위를 사용합니다.", prevention: "순서 permutation과 큰 값·작은 값 혼합 회귀 test를 유지합니다." },
    ],
    expertNotes: ["정확도 도구는 데이터 의미를 대신하지 않습니다. 금액은 decimal rounding, 과학 계산은 오차 허용, 대규모 array는 dtype과 reduction algorithm까지 함께 결정합니다."],
  },
  {
    id: "stable-sorting-and-alignment-evidence",
    title: "안정 정렬과 zip(strict=True)로 순위·정렬·정합성을 증명합니다",
    lead: "sorted의 안정성은 동점 상대 순서를 보존하고 zip의 strict 모드는 위치 기반 결합에서 길이 손실을 오류로 바꿉니다.",
    explanations: [
      "sorted는 모든 iterable을 소비해 새 list를 만들고 원본 list는 바꾸지 않습니다. key는 요소마다 한 번 계산되므로 비싼 key를 반복 비교하는 직접 comparator보다 예측하기 쉽습니다.",
      "안정 정렬은 같은 key인 요소의 원래 상대 순서를 유지합니다. 여러 기준을 tuple key 하나로 표현하거나 낮은 우선순위부터 여러 번 stable sort할 수 있지만 방향이 섞이면 각 항의 방향을 명시해야 합니다.",
      "stable이라는 말은 결과 전체가 자동으로 결정적이라는 뜻이 아닙니다. set·병렬 수집처럼 입력 순서가 흔들리면 동점 결과도 흔들리므로 영속 ID 같은 최종 tie-break를 둡니다.",
      "zip은 기본적으로 가장 짧은 iterable에서 조용히 종료합니다. 길이가 같아야 하는 열·label·예측값을 결합할 때 strict=True는 남은 요소를 ValueError로 드러냅니다.",
      "길이 일치는 ID 정합성을 보장하지 않습니다. 위치 결합이 아니라 식별자 join이 필요한 데이터에는 dict key set 비교와 duplicate 검사를 먼저 수행합니다.",
    ],
    concepts: [
      { term: "stable sorting", definition: "비교 key가 같은 요소들이 입력에서 갖던 상대 순서를 결과에서도 유지하는 성질입니다.", detail: ["다단계 정렬에 사용할 수 있습니다.", "입력 순서가 안정적이라는 보장은 별도입니다."] },
      { term: "strict alignment", definition: "짝지을 iterable의 길이 불일치를 조용한 절단이 아니라 실패로 처리하는 계약입니다.", detail: ["zip(strict=True)가 길이를 검사합니다.", "ID 일치 검사는 별도로 필요합니다."] },
    ],
    codeExamples: [{
      id: "stable-sorted-zip-enumerate-contracts",
      title: "동점 안정성·명시 tie-break·strict zip·enumerate 시작값을 확인합니다",
      language: "python",
      filename: "sorting_alignment.py",
      purpose: "순위 보고서에서 입력 보존, 동점 순서와 길이 오류를 exact output으로 검증합니다.",
      code: String.raw`rows = [
    {"id": "b", "score": 90},
    {"id": "a", "score": 90},
    {"id": "c", "score": 80},
]
stable = sorted(rows, key=lambda row: -row["score"])
deterministic = sorted(rows, key=lambda row: (-row["score"], row["id"]))
print("stable:", [row["id"] for row in stable])
print("tie_break:", [row["id"] for row in deterministic])
print("original:", [row["id"] for row in rows])
print("ranked:", list(enumerate([row["id"] for row in deterministic], start=1)))

print("paired:", list(zip(["a", "b"], [10, 20], strict=True)))
try:
    list(zip(["a", "b"], [10], strict=True))
except ValueError as error:
    print("strict_error:", type(error).__name__)`,
      walkthrough: [
        { lines: "1-10", explanation: "score 동점의 입력 상대 순서와 id tie-break 결과, 원본 불변을 나란히 출력합니다." },
        { lines: "11", explanation: "enumerate start=1이 표시용 순위를 만들며 원본 index와 다른 정책임을 드러냅니다." },
        { lines: "13-17", explanation: "정상 strict zip과 길이 불일치 ValueError를 확인합니다." },
      ],
      run: { environment: ["Python 3.13+", "stdin/network/filesystem 불필요"], command: "python -I -B -X utf8 sorting_alignment.py" },
      output: { value: "stable: ['b', 'a', 'c']\ntie_break: ['a', 'b', 'c']\noriginal: ['b', 'a', 'c']\nranked: [(1, 'a'), (2, 'b'), (3, 'c')]\npaired: [('a', 10), ('b', 20)]\nstrict_error: ValueError", explanation: ["stable 결과 b,a는 입력 순서를 보존합니다.", "ID tie-break를 추가한 결과는 upstream 수집 순서와 독립적입니다."] },
      experiments: [
        { change: "zip에서 strict=True를 제거합니다.", prediction: "불일치 예제는 [('a', 10)]만 만들고 b를 조용히 버립니다.", result: "기본 편의 동작이 데이터 손실을 숨길 수 있습니다." },
        { change: "rows를 set에서 만들었다고 가정합니다.", prediction: "score만 key로 한 동점 순서는 계약할 수 없습니다.", result: "stable sort와 deterministic input을 구분합니다." },
        { change: "enumerate start를 0으로 바꿉니다.", prediction: "rank가 0,1,2가 됩니다.", result: "저장 index와 사용자 표시 순위를 분리합니다." },
      ],
      sourceRefs: ["python-zip-strict", "python-enumerate-contract", "python-sorted-doc"],
    }],
    diagnostics: [
      { symptom: "두 열의 길이가 달라도 report가 만들어지고 마지막 레코드가 사라진다.", likelyCause: "기본 zip의 shortest-stop 계약을 정합성 검사로 오해했습니다.", checks: ["각 iterable 길이와 소비 여부를 기록합니다.", "zip(strict=True)로 재현합니다.", "ID 중복·집합 차이도 별도로 확인합니다."], fix: "길이 일치가 전제면 strict=True를 사용하고 식별자 데이터는 ID join으로 검증합니다.", prevention: "누락·추가·순서 교환 fixture를 포함합니다." },
    ],
    expertNotes: ["정렬 결과를 API pagination cursor로 사용한다면 모든 행을 유일하게 정렬하는 마지막 key가 필요합니다. 그렇지 않으면 페이지 사이에서 중복·누락이 생길 수 있습니다."],
  },
  {
    id: "short-circuit-iterator-and-complexity",
    title: "all·any의 short-circuit와 iterator 소비 비용을 관찰합니다",
    lead: "all과 any는 truth protocol을 사용해 필요한 지점까지만 소비하므로 결과뿐 아니라 평가 횟수와 부작용도 계약에 포함됩니다.",
    explanations: [
      "all은 첫 falsy에서 False를 반환하고 any는 첫 truthy에서 True를 반환합니다. 뒤 항목은 평가하지 않으므로 generator의 validation·로그·network 호출을 모두 수행하는 도구로 쓰면 안 됩니다.",
      "all([])은 보편 명제가 반례 없이 참이라는 vacuous truth로 True이고 any([])는 False입니다. 최소 하나가 필요하면 bool(items) 또는 별도 count 검사를 결합합니다.",
      "generator expression은 lazy하고 한 번 소비됩니다. all을 통과한 같은 generator를 any나 sum에 재사용하면 이미 비어 있어 전혀 다른 결과가 나옵니다.",
      "all·any·sum·min·max는 최악의 경우 O(n)이고 sorted는 일반적으로 O(n log n)이며 결과 list O(n) 공간을 사용합니다. zip과 enumerate 자체는 lazy iterator라 소비한 만큼 진행합니다.",
      "short-circuit predicate에 외부 부작용을 넣기보다 pure predicate와 별도 오류 수집 단계를 사용하면 평가 순서 변경과 부분 실행을 피할 수 있습니다.",
    ],
    concepts: [
      { term: "short-circuit", definition: "최종 결과가 결정되는 즉시 나머지 operand나 iterable 요소 평가를 생략하는 동작입니다.", detail: ["all은 첫 falsy, any는 첫 truthy에서 멈춥니다.", "부작용 실행 횟수에 영향을 줍니다."] },
      { term: "single-pass iterator", definition: "소비한 항목으로 되돌아갈 수 없어 한 번의 순회 뒤 비는 iterator입니다.", detail: ["generator와 zip·enumerate 객체가 대표적입니다.", "반복 집계에는 재생성 또는 materialize가 필요합니다."] },
    ],
    codeExamples: [{
      id: "all-any-short-circuit-evidence",
      title: "평가 trace로 all·any의 중단 지점과 generator 소진을 확인합니다",
      language: "python",
      filename: "short_circuit_iterators.py",
      purpose: "truth 결과만 보지 않고 실제로 평가된 값과 iterator 재사용 결과를 exact output으로 남깁니다.",
      code: String.raw`def traced(values, events):
    for value in values:
        events.append(value)
        yield value

all_events = []
print("all_result:", all(traced([1, 2, 0, 3], all_events)), all_events)

any_events = []
print("any_result:", any(traced([0, "", "ok", 9], any_events)), any_events)

empty = []
print("empty:", all(empty), any(empty))

stream = (number for number in [1, 2, 3])
print("first_all:", all(stream))
print("after_exhaustion:", list(stream), any(stream))

indexed = enumerate(["alpha", "beta"], start=10)
print("lazy_type:", type(indexed).__name__)
print("first:", next(indexed))
print("remaining:", list(indexed))`,
      walkthrough: [
        { lines: "1-10", explanation: "trace list에 실제 평가된 항목만 기록해 all은 0, any는 'ok'에서 멈추는 것을 증명합니다." },
        { lines: "12-13", explanation: "빈 all/any의 서로 다른 identity 결과를 확인합니다." },
        { lines: "15-17", explanation: "all이 generator를 끝까지 소비한 뒤 같은 객체가 비어 있음을 확인합니다." },
        { lines: "19-22", explanation: "enumerate가 lazy iterator이며 next 이후 나머지만 남는 것을 봅니다." },
      ],
      run: { environment: ["Python 3.13+", "stdin/network/filesystem 불필요"], command: "python -I -B -X utf8 short_circuit_iterators.py" },
      output: { value: "all_result: False [1, 2, 0]\nany_result: True [0, '', 'ok']\nempty: True False\nfirst_all: True\nafter_exhaustion: [] False\nlazy_type: enumerate\nfirst: (10, 'alpha')\nremaining: [(11, 'beta')]", explanation: ["trace가 short-circuit로 생략된 3과 9를 보여 줍니다.", "소진된 generator에서 any는 빈 iterable 규칙으로 False입니다."] },
      experiments: [
        { change: "all 입력의 0을 제거합니다.", prediction: "3까지 모두 평가하고 True가 됩니다.", result: "최악 평가 횟수 O(n)을 확인합니다." },
        { change: "stream을 list로 바꿉니다.", prediction: "all 뒤에도 list(stream)과 any(stream)을 반복 계산할 수 있습니다.", result: "재사용성과 O(n) 메모리의 tradeoff를 확인합니다." },
        { change: "predicate 내부에 print를 넣습니다.", prediction: "short-circuit 이후 항목은 출력되지 않습니다.", result: "검증 부작용을 all/any에 숨기지 않아야 합니다." },
      ],
      sourceRefs: ["python-builtins-all", "python-builtins-any", "python-enumerate-contract"],
    }],
    diagnostics: [
      { symptom: "all 검증 뒤 같은 generator의 합계가 0이 된다.", likelyCause: "single-pass generator가 all에서 이미 소비됐습니다.", checks: ["type과 iter(obj) is obj 여부를 확인합니다.", "각 단계의 소비 횟수를 trace합니다.", "generator를 생성하는 factory인지 객체 하나인지 봅니다."], fix: "한 pass에서 필요한 결과를 함께 계산하거나 재생성 가능한 factory/list를 사용합니다.", prevention: "pipeline API에 ownership·single-use를 문서화하고 재소비 test를 둡니다." },
    ],
    expertNotes: ["성능 표기는 계약의 시작점입니다. key 함수 비용, Python 호출 overhead, I/O latency와 데이터 materialization이 실제 병목을 바꿀 수 있으므로 대표 크기에서 측정합니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...expertChapters);
session.reviewQuestions.push(
  { question: "sum과 math.fsum을 어떤 기준으로 선택하나요?", answer: "일반 합계와 정수에는 sum이 간단하고, 크기가 크게 다른 float가 섞여 누적 오차가 중요하면 math.fsum을 검토합니다. 금액처럼 decimal 계약이면 Decimal이나 정수 최소 단위를 선택합니다." },
  { question: "min([], default=None)의 위험은 무엇인가요?", answer: "None이 실제 데이터로도 허용되면 빈 입력과 실제 최솟값 None을 구분하지 못하므로 별도 sentinel이나 사전 empty 검사가 필요합니다." },
  { question: "max(items, key=key_fn)은 동점에서 무엇을 반환하나요?", answer: "입력에서 처음 만난 최대 key의 원본 요소를 반환합니다." },
  { question: "stable sort만으로 API 결과가 항상 결정적인가요?", answer: "아닙니다. 동점의 입력 순서 자체가 불안정하면 결과도 흔들리므로 유일한 ID 같은 tie-break를 추가해야 합니다." },
  { question: "zip(strict=True)가 ID 순서 오류도 잡나요?", answer: "아닙니다. 길이 불일치만 잡으므로 ID 집합·중복·순서 계약은 별도로 검증해야 합니다." },
  { question: "all과 any 안의 predicate에 부작용을 넣으면 왜 위험한가요?", answer: "short-circuit 이후 항목은 평가되지 않아 일부 부작용만 실행되고, 순서 변경에 따라 결과 외 동작도 달라집니다." },
  { question: "sorted와 zip·enumerate의 공간 특성은 어떻게 다른가요?", answer: "sorted는 입력을 소비해 O(n) 결과 list를 만들고, zip과 enumerate는 소비 시점에 항목을 만드는 lazy iterator입니다." },
);
session.completionChecklist.push(
  "sum의 empty start와 실제 합계 0을 업무 계약에서 구분한다.",
  "부동소수 누적 오차가 중요한 경로에서 math.fsum·Decimal·정수 단위를 비교한다.",
  "min·max의 default와 key가 원본 요소 반환에 미치는 영향을 설명한다.",
  "stable sort의 보장과 결정적 tie-break 요구를 구분한다.",
  "zip(strict=True) 길이 검사와 ID alignment 검사를 함께 설계한다.",
  "all·any의 빈 iterable 결과와 short-circuit 평가 횟수를 테스트한다.",
  "single-pass iterator를 반복 소비하지 않고 시간·공간 복잡도를 기록한다.",
);
(session.sources as DetailedSession["sources"]).push(
  { id: "python-math-fsum", repository: "Python documentation", path: "library/math.html#math.fsum", publicUrl: "https://docs.python.org/3/library/math.html#math.fsum", usedFor: ["정밀 float 집계", "순서 민감도"], evidence: "공식 math 문서의 fsum 정확한 부동소수 합계 계약을 기준으로 사용했습니다." },
  { id: "python-builtins-sum", repository: "Python documentation", path: "library/functions.html#sum", publicUrl: "https://docs.python.org/3/library/functions.html#sum", usedFor: ["start", "빈 iterable", "선형 집계"], evidence: "공식 sum 문서의 start와 iterable 합계 계약을 확인했습니다." },
  { id: "python-builtins-min", repository: "Python documentation", path: "library/functions.html#min", publicUrl: "https://docs.python.org/3/library/functions.html#min", usedFor: ["default", "key", "빈 입력"], evidence: "공식 min 문서의 iterable·default·key와 동점 첫 항목 계약을 사용했습니다." },
  { id: "python-builtins-max", repository: "Python documentation", path: "library/functions.html#max", publicUrl: "https://docs.python.org/3/library/functions.html#max", usedFor: ["key", "원본 요소 반환", "동점"], evidence: "공식 max 문서의 key와 첫 최대 항목 반환 계약을 사용했습니다." },
  { id: "python-zip-strict", repository: "Python documentation", path: "library/functions.html#zip", publicUrl: "https://docs.python.org/3/library/functions.html#zip", usedFor: ["lazy zip", "strict 길이 검증"], evidence: "공식 zip 문서의 shortest-stop과 strict=True ValueError 계약을 확인했습니다." },
  { id: "python-enumerate-contract", repository: "Python documentation", path: "library/functions.html#enumerate", publicUrl: "https://docs.python.org/3/library/functions.html#enumerate", usedFor: ["lazy iterator", "start index"], evidence: "공식 enumerate 문서의 start와 iterator 반환 계약을 확인했습니다." },
  { id: "python-builtins-all", repository: "Python documentation", path: "library/functions.html#all", publicUrl: "https://docs.python.org/3/library/functions.html#all", usedFor: ["short-circuit", "빈 iterable"], evidence: "공식 all 문서의 첫 falsy 중단과 empty True 계약을 확인했습니다." },
  { id: "python-builtins-any", repository: "Python documentation", path: "library/functions.html#any", publicUrl: "https://docs.python.org/3/library/functions.html#any", usedFor: ["short-circuit", "빈 iterable"], evidence: "공식 any 문서의 첫 truthy 중단과 empty False 계약을 확인했습니다." },
);

export default session;
