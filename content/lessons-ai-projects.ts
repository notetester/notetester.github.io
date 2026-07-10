import type { Lesson } from "./types";

export const aiProjectLessons: Lesson[] = [
  {
    slug: "python-data-foundations",
    track: "ai",
    order: 1,
    title: "Python 데이터 기초: 문법을 분석 코드로 연결하기",
    eyebrow: "일반 개념 · Python",
    summary:
      "변수와 컬렉션부터 함수, 예외 처리, 클래스까지를 데이터 분석에 자주 쓰는 흐름으로 다시 연결합니다.",
    level: "기초",
    duration: "55분",
    why:
      "머신러닝 코드는 결국 데이터를 읽고, 조건에 따라 가공하고, 함수로 묶는 Python 프로그램입니다. 문법을 따로 외우기보다 값이 어디서 와서 어떤 모양으로 바뀌는지 추적할 수 있어야 이후 NumPy·Pandas·모델 코드를 정확히 읽을 수 있습니다.",
    prerequisites: [
      "프로그래밍이 처음이어도 시작할 수 있습니다.",
      "Python 3.11 이상과 터미널에서 python 명령을 실행할 수 있는 환경",
      "파일과 폴더 경로가 무엇인지에 대한 기본 이해",
    ],
    keywords: ["Python", "자료형", "컬렉션", "함수", "예외 처리", "클래스", "타입 힌트"],
    sections: [
      {
        id: "values-and-collections",
        title: "1. 값, 변수, 컬렉션의 역할",
        paragraphs: [
          "변수는 상자라기보다 객체를 가리키는 이름입니다. 정수(int), 실수(float), 문자열(str), 참·거짓(bool)은 한 값을 표현하고, 리스트(list)는 순서 있는 여러 값, 딕셔너리(dict)는 key와 value의 대응 관계를 표현합니다.",
          "분석 코드에서는 한 행을 딕셔너리로, 여러 행을 리스트로 표현하면 표 데이터로 넘어가기 쉽습니다. 리스트는 수정 가능한 mutable 객체이므로 원본을 보존해야 할 때는 복사 여부도 의식해야 합니다.",
        ],
        bullets: [
          "list: 순서가 있고 값을 추가·수정할 수 있습니다.",
          "tuple: 순서는 있지만 생성 뒤 항목을 바꾸지 않는 값 묶음에 적합합니다.",
          "dict: 이름 있는 필드를 표현해 데이터 한 건을 읽기 쉽게 만듭니다.",
          "set: 중복을 제거하거나 포함 여부를 빠르게 확인할 때 사용합니다.",
        ],
        code: {
          language: "python",
          label: "학습 기록을 컬렉션으로 표현하기",
          code: `lessons = [
    {"topic": "Python", "minutes": 50, "done": True},
    {"topic": "NumPy", "minutes": 35, "done": False},
]

completed = [item["topic"] for item in lessons if item["done"]]
total_minutes = sum(item["minutes"] for item in lessons)

print(completed)
print(total_minutes)`,
          explanation: [
            "조건을 만족하는 항목만 리스트 컴프리헨션으로 고릅니다.",
            "sum과 generator 표현식을 조합하면 별도 누적 변수를 만들지 않아도 됩니다.",
          ],
        },
        result: {
          label: "실행 결과",
          output: `['Python']
85`,
          explanation: "완료된 주제만 선택되고, 두 학습 시간의 합은 85분입니다.",
        },
        tip: "딕셔너리 key의 철자가 바뀌면 KeyError가 납니다. 외부 데이터를 다룰 때는 item.get(\"topic\")처럼 누락 가능성을 명시적으로 처리하세요.",
      },
      {
        id: "functions-and-flow",
        title: "2. 조건·반복·함수로 변환 규칙 만들기",
        paragraphs: [
          "조건문은 어떤 경로를 실행할지 고르고, 반복문은 같은 규칙을 여러 값에 적용합니다. 함수는 그 규칙에 이름을 붙여 입력과 출력을 명확하게 만드는 장치입니다.",
          "분석 코드에서는 출력만 하는 함수보다 값을 return하는 함수가 재사용과 테스트에 유리합니다. 함수 안에서 외부 변수를 몰래 바꾸지 않는 작은 순수 함수부터 만드는 습관이 좋습니다.",
        ],
        code: {
          language: "python",
          label: "안전한 평균 함수",
          code: `def average(values: list[float]) -> float | None:
    if not values:
        return None
    return sum(values) / len(values)

for scores in ([90, 80, 70], []):
    value = average(scores)
    message = "데이터 없음" if value is None else f"평균 {value:.1f}"
    print(message)`,
          explanation: [
            "빈 리스트를 먼저 처리해 0으로 나누는 오류를 피합니다.",
            "타입 힌트의 float | None은 값이 없을 수 있다는 계약을 호출자에게 알려 줍니다.",
          ],
        },
        result: {
          label: "실행 결과",
          output: `평균 80.0
데이터 없음`,
        },
        tip: "기본값이 있는 매개변수는 기본값이 없는 매개변수 뒤에 둡니다. mutable 기본값으로 []나 {}를 직접 두지 말고 None을 받은 뒤 함수 안에서 만드세요.",
      },
      {
        id: "files-and-errors",
        title: "3. 파일 경계에서는 예외와 인코딩을 함께 생각하기",
        paragraphs: [
          "파일 입출력은 프로그램 바깥의 상태를 만나는 경계입니다. 파일이 없거나, 권한이 없거나, 예상과 다른 인코딩일 수 있으므로 정상 경로와 실패 경로를 함께 설계해야 합니다.",
          "with 문은 작업이 끝나거나 예외가 발생해도 파일을 닫아 줍니다. CSV·JSON처럼 구조가 있는 형식은 문자열을 직접 자르기보다 표준 모듈을 사용해야 따옴표와 줄바꿈 같은 경계 사례를 안전하게 처리할 수 있습니다.",
        ],
        code: {
          language: "python",
          label: "JSON 설정을 읽고 검증하기",
          code: `import json
from pathlib import Path

def load_config(path: Path) -> dict:
    try:
        with path.open(encoding="utf-8") as file:
            config = json.load(file)
    except FileNotFoundError:
        return {"batch_size": 32, "source": "default"}

    batch_size = config.get("batch_size", 32)
    if not isinstance(batch_size, int) or batch_size <= 0:
        raise ValueError("batch_size는 양의 정수여야 합니다.")
    return {"batch_size": batch_size, "source": "file"}`,
          explanation: [
            "없는 파일은 안전한 기본값으로 처리하지만, 잘못된 값은 조용히 숨기지 않고 오류로 알립니다.",
            "API key 같은 비밀값은 JSON 파일에 커밋하지 말고 환경변수나 비밀 관리 도구로 주입합니다.",
          ],
        },
        tip: "except Exception으로 모든 오류를 삼키면 원인을 잃습니다. 복구할 수 있는 예외만 좁게 잡고, 나머지는 호출자에게 전달하세요.",
      },
      {
        id: "objects-and-types",
        title: "4. 클래스와 타입 힌트로 데이터 계약 표현하기",
        paragraphs: [
          "클래스는 관련 데이터와 동작을 한 개념으로 묶습니다. 단순한 데이터 묶음은 dataclass로 표현하면 생성자와 출력 코드를 줄이면서 필드 의미를 선명하게 만들 수 있습니다.",
          "타입 힌트는 실행 시 값을 강제하지 않지만 IDE, 정적 검사기, 동료에게 기대하는 형태를 알려 줍니다. 모델 입력처럼 모양이 중요한 코드일수록 타입과 검증을 함께 두는 편이 좋습니다.",
        ],
        code: {
          language: "python",
          label: "학습 진행 상태 모델",
          code: `from dataclasses import dataclass

@dataclass(frozen=True)
class StudyProgress:
    topic: str
    completed: int
    total: int

    @property
    def ratio(self) -> float:
        if self.total <= 0:
            raise ValueError("total은 1 이상이어야 합니다.")
        return self.completed / self.total

progress = StudyProgress("Python", 12, 16)
print(progress.topic, f"{progress.ratio:.0%}")`,
        },
        result: {
          label: "실행 결과",
          output: `Python 75%`,
          explanation: "frozen=True로 만든 객체는 생성 뒤 필드가 바뀌지 않아 상태 추적이 쉬워집니다.",
        },
      },
      {
        id: "python-debug-checklist",
        title: "5. 읽을 때와 디버깅할 때의 체크 순서",
        paragraphs: [
          "코드를 중간부터 보더라도 입력의 타입과 모양, 변환 뒤 타입과 모양, 반환값을 차례로 적으면 흐름을 복원할 수 있습니다. 오류 메시지의 마지막 줄만 보지 말고 traceback에서 처음 내 코드가 등장하는 위치를 찾으세요.",
          "작은 예제로 가설을 검증하고, print보다 repr·type·len을 함께 확인하면 공백·None·자료형 차이를 빨리 발견할 수 있습니다.",
        ],
        bullets: [
          "값이 아니라 type(value), len(value), 가능한 경우 shape까지 확인합니다.",
          "함수 입력을 최소 예제로 줄여 같은 오류가 재현되는지 봅니다.",
          "원본 컬렉션을 바꿨는지, 복사본을 바꿨는지 확인합니다.",
          "경로는 현재 작업 디렉터리에 따라 달라질 수 있으므로 Path.resolve()로 확인합니다.",
          "테스트는 정상값뿐 아니라 빈 값, None, 경계값, 잘못된 타입도 포함합니다.",
        ],
        tip: "한 번에 여러 줄을 고치면 무엇이 원인이었는지 알기 어렵습니다. 관찰 → 한 가지 가설 → 작은 변경 → 재실행 순서를 지키세요.",
      },
    ],
    checkpoints: [
      "list, tuple, dict, set의 차이와 적합한 사용 상황을 설명할 수 있다.",
      "입력과 반환값이 분명한 작은 함수를 작성할 수 있다.",
      "파일을 with 문으로 열고 복구 가능한 예외만 처리할 수 있다.",
      "mutable 객체의 공유와 복사가 결과에 미치는 영향을 설명할 수 있다.",
      "traceback, type, len을 이용해 데이터 흐름을 추적할 수 있다.",
    ],
    related: ["numpy-pandas-preprocessing", "machine-learning-workflow"],
    sources: [
      {
        label: "Python Basic 공개 학습 노트",
        repository: "https://github.com/notetester/PYTHON-BASIC",
        path: "notes/README.md",
        note: "day01~day16 문법·파일·클래스·예외·타입·테스트 로드맵",
      },
      {
        label: "기본 자료형 예제",
        repository: "https://github.com/notetester/PYTHON-BASIC",
        path: "day01/ex03_datatype.py",
      },
      {
        label: "함수 매개변수 예제",
        repository: "https://github.com/notetester/PYTHON-BASIC",
        path: "day04/ex08_function.py",
      },
    ],
  },
  {
    slug: "numpy-pandas-preprocessing",
    track: "ai",
    order: 2,
    title: "NumPy·Pandas 전처리: 모델이 읽을 수 있는 데이터 만들기",
    eyebrow: "일반 개념 · 데이터 처리",
    summary:
      "배열의 shape와 벡터화, DataFrame의 결측치 처리, 훈련 데이터 기준 스케일링을 하나의 전처리 흐름으로 익힙니다.",
    level: "기초",
    duration: "65분",
    why:
      "모델 성능 문제의 상당수는 알고리즘보다 데이터 모양, 결측치, 단위 차이, 누수에서 시작합니다. NumPy는 빠른 수치 배열을, Pandas는 이름 있는 표를 제공하며 두 도구의 경계를 이해하면 전처리 오류를 눈으로 추적할 수 있습니다.",
    prerequisites: [
      "python-data-foundations의 리스트·딕셔너리·함수 개념",
      "행과 열로 구성된 표를 읽을 수 있는 정도의 기초",
      "numpy, pandas, scikit-learn이 설치된 Python 환경",
    ],
    keywords: ["NumPy", "Pandas", "ndarray", "DataFrame", "결측치", "표준화", "데이터 누수"],
    sections: [
      {
        id: "array-shape-vectorization",
        title: "1. ndarray는 값뿐 아니라 shape와 dtype을 가진다",
        paragraphs: [
          "NumPy ndarray는 같은 자료형의 값을 연속적인 배열로 다루며 반복문 대신 배열 단위 연산을 수행합니다. 이 벡터화 덕분에 코드가 짧고 계산이 빠릅니다.",
          "shape는 축별 크기입니다. 2차원 특성 행렬은 보통 (샘플 수, 특성 수), 이미지 묶음은 (샘플 수, 높이, 너비)처럼 읽습니다. reshape는 원소 수를 바꾸지 않고 모양만 바꿉니다.",
        ],
        code: {
          language: "python",
          label: "리스트와 ndarray의 연산 차이",
          code: `import numpy as np

python_list = [1, 2, 3]
array = np.array([1, 2, 3], dtype=np.float32)

print(python_list * 2)
print(array * 2)
print(array.shape, array.dtype)`,
          explanation: [
            "리스트의 *는 반복이고 ndarray의 *는 요소별 곱셈입니다.",
            "dtype을 명시하면 메모리와 정밀도를 예측하기 쉬워집니다.",
          ],
        },
        result: {
          label: "실행 결과",
          output: `[1, 2, 3, 1, 2, 3]
[2. 4. 6.]
(3,) float32`,
        },
        tip: "슬라이싱 결과는 원본 메모리를 공유하는 view일 수 있습니다. 독립적으로 수정해야 한다면 .copy()를 명시하세요.",
      },
      {
        id: "broadcasting-and-axis",
        title: "2. 브로드캐스팅과 axis를 모르면 맞는 듯 틀린 결과가 나온다",
        paragraphs: [
          "브로드캐스팅은 모양이 다른 배열을 호환 가능한 축에 맞춰 자동 확장하는 규칙입니다. 마지막 축부터 크기가 같거나 한쪽이 1이면 연산할 수 있습니다.",
          "axis=0 집계는 행 방향으로 내려가 각 열의 결과를 만들고, axis=1 집계는 열 방향으로 가며 각 행의 결과를 만듭니다. 숫자만 외우지 말고 결과 shape를 함께 예상하세요.",
        ],
        code: {
          language: "python",
          label: "열별 중심화와 행별 평균",
          code: `import numpy as np

x = np.array([[10, 20], [30, 50], [50, 80]])
column_mean = x.mean(axis=0)
centered = x - column_mean

print(column_mean)
print(centered)
print(centered.mean(axis=1))`,
        },
        result: {
          label: "실행 결과",
          output: `[30. 50.]
[[-20. -30.]
 [  0.   0.]
 [ 20.  30.]]
[-25.   0.  25.]`,
          explanation: "(2,)인 열 평균이 (3, 2) 배열의 각 행에 브로드캐스팅됩니다.",
        },
        tip: "연산 전후에 shape를 출력하세요. 실행은 되지만 의도와 다른 축으로 계산되는 오류가 문법 오류보다 더 위험합니다.",
      },
      {
        id: "dataframe-cleaning",
        title: "3. DataFrame에서 결측치와 타입을 먼저 진단한다",
        paragraphs: [
          "Pandas Series는 인덱스를 가진 한 열이고 DataFrame은 여러 Series가 모인 표입니다. CSV를 읽자마자 head, info, dtypes, isna().sum()을 확인하면 데이터의 실제 상태를 빠르게 파악할 수 있습니다.",
          "결측치를 무조건 삭제하거나 평균으로 채우면 표본 수와 분포가 바뀔 수 있습니다. 왜 비었는지, 예측 시에도 같은 방식으로 처리할 수 있는지, 목표값과 관계가 있는지부터 판단해야 합니다.",
        ],
        code: {
          language: "python",
          label: "결측치 진단과 그룹 기준 대체",
          code: `import pandas as pd

df = pd.DataFrame({
    "team": ["A", "A", "B", "B"],
    "score": [80, None, 70, 90],
})

print(df.isna().sum().to_dict())
df["score"] = df["score"].fillna(df.groupby("team")["score"].transform("median"))
print(df.to_dict("records"))`,
          explanation: [
            "전체 평균 대신 같은 그룹의 중앙값을 사용한다는 도메인 가정을 코드에 드러냈습니다.",
            "실전에서는 이 대체 규칙도 훈련 세트에서 학습해 검증·테스트 세트에 동일하게 적용해야 합니다.",
          ],
        },
        result: {
          label: "실행 결과",
          output: `{'team': 0, 'score': 1}
[{'team': 'A', 'score': 80.0}, {'team': 'A', 'score': 80.0}, {'team': 'B', 'score': 70.0}, {'team': 'B', 'score': 90.0}]`,
        },
      },
      {
        id: "split-then-fit",
        title: "4. 먼저 나누고, 훈련 세트로만 전처리기를 fit한다",
        paragraphs: [
          "표준화는 각 특성에서 평균을 빼고 표준편차로 나누어 단위를 맞춥니다. 거리 기반 모델이나 경사하강 기반 모델은 특성 단위 차이에 민감하므로 효과가 큽니다.",
          "전체 데이터의 평균과 표준편차를 미리 계산하면 테스트 데이터 정보가 훈련 과정에 섞이는 데이터 누수가 발생합니다. split → fit(train) → transform(train/test/new)의 순서를 고정하세요.",
        ],
        code: {
          language: "python",
          label: "누수 없는 분할과 표준화",
          code: `from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

x_train, x_test, y_train, y_test = train_test_split(
    features,
    target,
    test_size=0.2,
    stratify=target,
    random_state=42,
)

scaler = StandardScaler()
x_train_scaled = scaler.fit_transform(x_train)
x_test_scaled = scaler.transform(x_test)
new_scaled = scaler.transform([[25, 150]])`,
          explanation: [
            "stratify는 분류 클래스 비율을 분할 뒤에도 비슷하게 유지합니다.",
            "새 입력도 반드시 같은 scaler로 변환해야 좌표계가 일치합니다.",
          ],
        },
        result: {
          label: "원본 노트북의 대표 관찰",
          output: `훈련 평균: [27.29722222, 454.09722222]
훈련 표준편차: [9.98244253, 323.29893931]
스케일 전 새 생선 예측: 0
스케일 후 새 생선 예측: 1`,
          explanation: "길이와 무게의 단위 차이를 바로잡자 KNN의 거리 판단이 달라진 사례입니다.",
        },
        tip: "결측치 대체, 스케일링, 범주형 인코딩을 Pipeline/ColumnTransformer로 묶으면 교차 검증에서도 같은 순서를 지키기 쉽습니다.",
      },
      {
        id: "preprocessing-checklist",
        title: "5. 전처리 완료 기준",
        paragraphs: [
          "전처리는 보기 좋은 표를 만드는 일이 아니라, 학습과 실제 예측에서 같은 의미의 수치 입력을 보장하는 일입니다. 각 변환의 이유와 학습된 통계값을 재현 가능하게 남겨야 합니다.",
          "특히 목표값을 이용한 집계, 미래 시점 정보, 테스트 세트 기준 대체값은 누수의 흔한 원인입니다. 결과가 지나치게 좋을수록 분할 경계를 먼저 의심하세요.",
        ],
        bullets: [
          "행 하나와 열 하나가 무엇을 의미하는지 문장으로 설명합니다.",
          "결측치 개수, 중복, 범위, dtype, 클래스 비율을 기록합니다.",
          "훈련·검증·테스트를 변환 전에 분리합니다.",
          "fit은 훈련 세트에만, transform은 모든 세트에 같은 객체로 적용합니다.",
          "변환 뒤 NaN·무한대·shape·열 순서를 다시 검증합니다.",
        ],
        tip: "Pandas 인덱스 정렬은 편리하지만 예상치 못한 NaN을 만들 수 있습니다. 배열로 바꾸기 전 index와 열 순서가 일치하는지 확인하세요.",
      },
    ],
    checkpoints: [
      "ndarray의 shape와 dtype을 읽고 예상 결과 shape를 설명할 수 있다.",
      "브로드캐스팅과 axis=0/1의 차이를 작은 배열로 검증할 수 있다.",
      "결측치 처리 방법이 분포와 의미에 미치는 영향을 설명할 수 있다.",
      "데이터 누수가 없는 fit/transform 순서를 구현할 수 있다.",
      "새 입력에도 훈련 때와 동일한 전처리 객체를 적용할 수 있다.",
    ],
    related: ["python-data-foundations", "machine-learning-workflow", "deep-learning-neural-network"],
    sources: [
      {
        label: "NumPy 학습 노트",
        repository: "https://github.com/notetester/PYTHON-BASIC",
        path: "notes/day08_numpy.md",
        note: "shape, dtype, 브로드캐스팅, view/copy, 벡터화 설명",
      },
      {
        label: "Pandas 학습 노트",
        repository: "https://github.com/notetester/PYTHON-BASIC",
        path: "notes/day09_pandas.md",
        note: "Series, DataFrame, 결측치, groupby, merge 설명",
      },
      {
        label: "ML 데이터 전처리 실습",
        repository: "https://github.com/nohssam/2026_ML",
        path: "ex03_데이터 전처리.ipynb",
        note: "KNN에서 StandardScaler 적용 전후를 비교하는 공개 노트북",
      },
    ],
  },
  {
    slug: "machine-learning-workflow",
    track: "ai",
    order: 3,
    title: "머신러닝 워크플로: 문제 정의에서 평가까지",
    eyebrow: "일반 개념 · Machine Learning",
    summary:
      "특성과 목표 정의, 데이터 분할, 기준 모델, 검증, 지표 해석을 재현 가능한 실험 한 사이클로 묶습니다.",
    level: "중급",
    duration: "75분",
    why:
      "모델을 fit하는 한 줄보다 중요한 것은 무엇을 예측하는지, 미래에 알 수 있는 특성만 사용했는지, 어떤 오류를 줄여야 하는지를 정하는 일입니다. 일관된 실험 순서를 알면 알고리즘이 바뀌어도 결과를 공정하게 비교할 수 있습니다.",
    prerequisites: [
      "numpy-pandas-preprocessing의 분할·결측치·표준화 개념",
      "평균과 비율을 해석할 수 있는 기초 통계",
      "scikit-learn의 estimator가 fit과 predict를 제공한다는 정도의 이해",
    ],
    keywords: ["지도학습", "분류", "회귀", "검증", "Pipeline", "혼동행렬", "정밀도", "재현율"],
    sections: [
      {
        id: "problem-and-label",
        title: "1. 모델보다 먼저 예측 문제와 성공 기준을 적는다",
        paragraphs: [
          "지도학습은 정답인 target이 있는 데이터에서 feature와 target의 관계를 학습합니다. target이 범주면 분류, 연속된 수치면 회귀입니다. 비지도학습은 정답 없이 군집이나 저차원 구조를 찾습니다.",
          "예측 시점도 정의해야 합니다. 예를 들어 결제 취소를 결제 직후 예측한다면 취소 뒤에만 생기는 환불 상태는 feature로 쓸 수 없습니다. 이는 미래 정보 누수입니다.",
        ],
        code: {
          language: "text",
          label: "문제 정의 카드 예시",
          code: `목표: 와인의 측정값으로 화이트 와인 여부를 분류한다.
관측 단위: 와인 샘플 1개
특성: alcohol, sugar, pH
목표값: class (red=0, white=1)
예측 시점: 세 특성 측정 직후
중요 오류: 화이트 와인을 레드로 놓치는 FN
기준 지표: recall과 F1, 보조로 confusion matrix`,
          explanation: [
            "관측 단위와 예측 시점을 먼저 고정하면 중복 행과 미래 정보 사용을 판별하기 쉬워집니다.",
            "업무 비용에 따라 FP와 FN 중 더 비싼 오류가 달라집니다.",
          ],
        },
        tip: "정확도를 성공 기준으로 자동 선택하지 마세요. 불균형 데이터에서는 다수 클래스를 찍기만 해도 정확도가 높을 수 있습니다.",
      },
      {
        id: "baseline-pipeline",
        title: "2. 분할과 전처리를 Pipeline으로 고정한다",
        paragraphs: [
          "테스트 세트는 최종 일반화 성능을 확인하기 위한 봉인된 데이터입니다. 모델과 하이퍼파라미터 선택에는 훈련 세트 내부의 검증 세트나 교차 검증을 사용합니다.",
          "Pipeline은 scaler와 model을 한 객체로 묶어 각 교차 검증 fold의 훈련 부분에서만 scaler가 fit되게 합니다. 실험 코드와 실제 예측 코드가 같은 순서를 공유한다는 장점도 있습니다.",
        ],
        code: {
          language: "python",
          label: "로지스틱 회귀 기준 모델",
          code: `from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

x_train, x_test, y_train, y_test = train_test_split(
    x, y, test_size=0.2, stratify=y, random_state=42
)

model = make_pipeline(
    StandardScaler(),
    LogisticRegression(max_iter=1000, random_state=42),
)
model.fit(x_train, y_train)
y_pred = model.predict(x_test)`,
          explanation: [
            "로지스틱 회귀는 이름과 달리 대표적인 확률 기반 분류기입니다.",
            "random_state는 데이터 분할과 난수 기반 동작을 반복 가능하게 만듭니다.",
          ],
        },
      },
      {
        id: "metrics-as-cost",
        title: "3. 혼동행렬에서 지표의 의미를 읽는다",
        paragraphs: [
          "혼동행렬은 실제 클래스와 예측 클래스를 교차해 TN, FP, FN, TP 개수를 보여 줍니다. accuracy는 전체 중 정답 비율, precision은 양성 예측 중 실제 양성 비율, recall은 실제 양성 중 찾아낸 비율입니다.",
          "F1은 precision과 recall의 조화평균으로 둘 중 하나가 매우 낮으면 함께 낮아집니다. 다중 클래스에서는 macro 평균과 weighted 평균이 다르므로 클래스별 support를 함께 보세요.",
        ],
        code: {
          language: "python",
          label: "분류 지표를 한 번에 확인하기",
          code: `from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

print(confusion_matrix(y_test, y_pred))
print("accuracy", accuracy_score(y_test, y_pred))
print("precision", precision_score(y_test, y_pred))
print("recall", recall_score(y_test, y_pred))
print("f1", f1_score(y_test, y_pred))`,
        },
        result: {
          label: "공개 와인 분류 노트북의 대표 결과",
          output: `confusion matrix
[[115 205]
 [ 86 894]]
accuracy  0.7762
precision 0.8135
recall    0.9122
f1        0.8600`,
          explanation: "화이트 와인(1)은 대부분 찾았지만 레드 와인 205개를 화이트로 잘못 예측했습니다. 한 숫자만 보면 이 오류 구조를 놓칩니다.",
        },
        tip: "positive class가 무엇인지 먼저 확인하세요. label 1의 의미를 반대로 이해하면 precision과 recall의 업무 해석도 반대가 됩니다.",
      },
      {
        id: "validation-and-selection",
        title: "4. 교차 검증으로 선택하고 테스트는 마지막 한 번만 본다",
        paragraphs: [
          "k-fold 교차 검증은 훈련 데이터를 k개 조각으로 나누고, 한 조각씩 검증에 사용해 k개의 점수를 얻습니다. 평균은 기대 성능을, 표준편차는 분할에 따른 흔들림을 보여 줍니다.",
          "여러 알고리즘과 하이퍼파라미터를 테스트 점수로 고르면 테스트 세트에도 과적합됩니다. GridSearchCV나 RandomizedSearchCV는 훈련 세트 내부에서만 실행하고 최종 선택 뒤 테스트를 평가하세요.",
        ],
        code: {
          language: "python",
          label: "교차 검증 결과의 평균과 변동 확인",
          code: `from sklearn.model_selection import cross_validate, StratifiedKFold

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_validate(
    model,
    x_train,
    y_train,
    cv=cv,
    scoring=["f1", "recall"],
    return_train_score=True,
)

print(f"validation f1: {scores['test_f1'].mean():.3f}")
print(f"f1 std: {scores['test_f1'].std():.3f}")`,
          explanation: [
            "훈련 점수와 검증 점수 차이가 크면 과적합을 의심합니다.",
            "시간 순서 데이터와 사용자별 반복 관측은 일반 k-fold 대신 TimeSeriesSplit이나 GroupKFold가 필요할 수 있습니다.",
          ],
        },
      },
      {
        id: "reproducible-experiment",
        title: "5. 재현 가능한 실험과 운영 전 점검",
        paragraphs: [
          "좋은 실험 기록은 데이터 버전, feature 목록, 분할 규칙, 전처리, 모델 파라미터, 지표, 실행 환경을 함께 남깁니다. 모델 파일만 저장하면 어떤 데이터와 규칙으로 만들었는지 복원할 수 없습니다.",
          "배포 뒤에는 실제 입력 분포가 훈련 때와 달라지는 drift, 결측률 변화, 클래스 비율 변화, 지연시간을 관찰해야 합니다. 오프라인 점수는 운영 품질의 출발점이지 끝이 아닙니다.",
        ],
        bullets: [
          "항상 단순 기준선과 비교합니다: 다수 클래스, 평균값, 간단한 선형 모델 등.",
          "feature 생성 코드와 모델을 같은 버전으로 묶습니다.",
          "학습·검증·테스트의 중복 사용자나 중복 문서를 검사합니다.",
          "확률 임계값은 업무 비용과 검증 데이터로 선택합니다.",
          "모델 성능뿐 아니라 실패 사례를 표본으로 직접 읽습니다.",
        ],
        result: {
          label: "실험 완료 기록 예시",
          output: `dataset=wine-v1 | split=stratified-42 | model=logistic-regression
test_f1=0.8600 | test_recall=0.9122 | artifacts=model+metrics+feature-schema`,
        },
        tip: "점수가 좋아졌다는 이유만으로 복잡한 모델을 선택하지 마세요. 개선 폭, 변동성, 추론 비용, 설명 가능성까지 함께 비교해야 합니다.",
      },
    ],
    checkpoints: [
      "feature, target, 관측 단위, 예측 시점을 한 문단으로 정의할 수 있다.",
      "훈련·검증·테스트의 역할과 누수 위험을 설명할 수 있다.",
      "Pipeline 안에 전처리와 모델을 함께 넣을 수 있다.",
      "혼동행렬에서 FP와 FN을 찾아 업무 비용으로 해석할 수 있다.",
      "데이터·코드·파라미터·지표를 포함한 실험 기록을 남길 수 있다.",
    ],
    related: ["numpy-pandas-preprocessing", "deep-learning-neural-network", "career-tuner-architecture"],
    sources: [
      {
        label: "훈련 세트와 테스트 세트",
        repository: "https://github.com/nohssam/2026_ML",
        path: "ex02_훈련세트와 데이터세트.ipynb",
      },
      {
        label: "모델 평가 지표 실습",
        repository: "https://github.com/nohssam/2026_ML",
        path: "ex18_모델_평가_지표.ipynb",
        note: "와인 분류의 accuracy, precision, recall, F1, confusion matrix 실행 결과",
      },
      {
        label: "검증 세트 실습",
        repository: "https://github.com/nohssam/2026_ML",
        path: "ex14_검증세트.ipynb",
      },
    ],
  },
  {
    slug: "deep-learning-neural-network",
    track: "ai",
    order: 4,
    title: "딥러닝 신경망: 층·손실·학습 곡선 읽기",
    eyebrow: "일반 개념 · Deep Learning",
    summary:
      "뉴런의 가중합부터 Dense·CNN·RNN의 역할, 손실함수, 검증 곡선과 과적합 제어까지 실행 흐름으로 이해합니다.",
    level: "중급",
    duration: "80분",
    why:
      "딥러닝은 층을 많이 쌓는 기술이 아니라 입력을 유용한 표현으로 바꾸고 손실의 기울기로 파라미터를 갱신하는 방법입니다. 텐서 shape, 출력층과 손실의 계약, 훈련·검증 곡선을 읽을 수 있어야 모델을 안전하게 고칠 수 있습니다.",
    prerequisites: [
      "machine-learning-workflow의 분할·검증·과적합 개념",
      "NumPy 배열 shape와 행렬곱의 기초",
      "TensorFlow/Keras가 설치된 환경 또는 노트북 실행 환경",
    ],
    keywords: ["신경망", "Dense", "활성화 함수", "손실함수", "역전파", "CNN", "RNN", "과적합"],
    sections: [
      {
        id: "neuron-and-loss",
        title: "1. 뉴런은 가중합을 변환하고, 손실은 틀린 정도를 수치화한다",
        paragraphs: [
          "한 뉴런은 입력 x와 가중치 w를 곱해 더하고 편향 b를 더한 뒤 활성화 함수를 적용합니다. 학습은 정답과 예측의 차이인 loss가 작아지는 방향으로 w와 b를 반복 갱신하는 과정입니다.",
          "ReLU는 은닉층에서 음수를 0으로 바꾸어 비선형 표현을 만들고, softmax는 다중 클래스 출력 점수를 합이 1인 확률처럼 변환합니다. 활성화와 손실은 문제 유형에 맞춰 쌍으로 선택해야 합니다.",
        ],
        code: {
          language: "python",
          label: "한 뉴런의 순전파를 NumPy로 보기",
          code: `import numpy as np

x = np.array([0.2, 0.8])
w = np.array([1.5, -0.5])
b = 0.1

z = x @ w + b
relu = max(0.0, z)
print(f"z={z:.2f}, relu={relu:.2f}")`,
          explanation: [
            "@는 벡터 내적이며 각 입력의 영향도를 가중치로 합칩니다.",
            "실제 신경망은 이 계산을 많은 샘플과 뉴런에 텐서 연산으로 동시에 수행합니다.",
          ],
        },
        result: {
          label: "실행 결과",
          output: `z=0.00, relu=0.00`,
        },
        tip: "마지막 층의 출력 수는 클래스 수와 같아야 합니다. 다중 클래스 정수 label에는 softmax + sparse_categorical_crossentropy 조합이 흔합니다.",
      },
      {
        id: "tensor-preparation",
        title: "2. 입력 텐서의 shape와 범위를 먼저 고정한다",
        paragraphs: [
          "Fashion-MNIST는 28×28 회색조 이미지 60,000장을 훈련에, 10,000장을 테스트에 제공합니다. 픽셀은 0~255이므로 255로 나누어 0~1 범위로 맞추면 최적화가 안정적입니다.",
          "Dense 층은 보통 한 샘플을 1차원 벡터로 받으므로 Flatten으로 28×28을 784개 값으로 펼칩니다. CNN은 공간 관계를 사용하므로 이미지 축을 유지하고 채널 축을 추가합니다.",
        ],
        code: {
          language: "python",
          label: "Fashion-MNIST 로드와 정규화",
          code: `from tensorflow import keras

(x_train, y_train), (x_test, y_test) = keras.datasets.fashion_mnist.load_data()
x_train = x_train.astype("float32") / 255.0
x_test = x_test.astype("float32") / 255.0

print(x_train.shape, y_train.shape)
print(x_test.shape, y_test.shape)
print(x_train.min(), x_train.max())`,
        },
        result: {
          label: "실행 결과",
          output: `(60000, 28, 28) (60000,)
(10000, 28, 28) (10000,)
0.0 1.0`,
          explanation: "샘플 축과 이미지 축을 구분하고, 정답은 샘플마다 클래스 번호 하나를 갖습니다.",
        },
      },
      {
        id: "build-and-compile",
        title: "3. 모델 구조와 학습 규칙은 별도 단계다",
        paragraphs: [
          "모델을 build하는 단계는 어떤 층을 어떤 순서로 통과할지 정의합니다. compile은 loss, optimizer, metric을 정해 어떻게 학습하고 관찰할지 결정합니다.",
          "파라미터 수는 각 층의 입력 수와 출력 뉴런 수로 계산할 수 있습니다. Dense(784→100)는 784×100 가중치와 100개 편향을 가져 78,500개 파라미터가 됩니다.",
        ],
        code: {
          language: "python",
          label: "다중 클래스 Dense 신경망",
          code: `from tensorflow import keras

model = keras.Sequential([
    keras.layers.Input(shape=(28, 28)),
    keras.layers.Flatten(),
    keras.layers.Dense(100, activation="relu"),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(10, activation="softmax"),
])

model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)
model.summary()`,
          explanation: [
            "Dropout은 훈련 중 일부 연결을 무작위로 끊어 특정 뉴런에 과도하게 의존하는 것을 줄입니다.",
            "summary에서 각 층의 출력 shape와 파라미터 수를 확인하세요.",
          ],
        },
        result: {
          label: "대표 모델 요약",
          output: `Flatten output: (None, 784)
Dense(100) params: 78,500
Dropout output: (None, 100)
Dense(10) params: 1,010
Total params: 79,510`,
        },
      },
      {
        id: "training-curves",
        title: "4. epoch 숫자보다 훈련·검증 곡선을 함께 읽는다",
        paragraphs: [
          "epoch는 전체 훈련 데이터를 한 번 본 횟수이고 batch는 한 번의 가중치 갱신에 사용하는 샘플 묶음입니다. epoch가 늘면 훈련 loss는 대체로 감소하지만 검증 loss가 다시 증가하면 과적합 신호입니다.",
          "EarlyStopping은 검증 성능이 더 이상 좋아지지 않을 때 멈추고 가장 좋은 가중치를 복원합니다. ModelCheckpoint는 그 시점의 모델을 파일로 보존합니다.",
        ],
        code: {
          language: "python",
          label: "검증과 조기 종료를 포함한 훈련",
          code: `callbacks = [
    keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=3,
        restore_best_weights=True,
    )
]

history = model.fit(
    x_train,
    y_train,
    validation_split=0.2,
    epochs=30,
    batch_size=64,
    callbacks=callbacks,
    verbose=0,
)

print(history.history.keys())
print("epochs", len(history.history["loss"]))`,
        },
        result: {
          label: "대표 실행 결과",
          output: `dict_keys(['accuracy', 'loss', 'val_accuracy', 'val_loss'])
epochs 11
best weights restored from the lowest validation loss`,
          explanation: "실제 epoch 수와 점수는 장치·라이브러리 버전·난수에 따라 달라질 수 있으므로 곡선의 관계를 해석하는 것이 핵심입니다.",
        },
        tip: "test 세트를 validation_data로 반복 사용하지 마세요. 검증으로 모델을 선택하고 테스트는 최종 확인에만 사용합니다.",
      },
      {
        id: "architecture-choice",
        title: "5. 데이터 구조에 맞춰 Dense·CNN·RNN을 선택한다",
        paragraphs: [
          "Dense는 모든 입력을 펼쳐 연결하므로 작은 표 데이터나 기준 모델에 좋습니다. CNN은 가까운 픽셀의 지역 패턴과 위치 이동에 강해 이미지에 적합합니다. RNN 계열은 순서를 따라 상태를 전달하며 텍스트·시계열을 다루지만, 긴 문맥에서는 Transformer가 더 널리 쓰입니다.",
          "복잡한 구조를 쓰기 전에 단순 기준선, 데이터량, 지연시간, 설명 가능성을 비교하세요. 전이학습은 큰 데이터로 학습된 모델의 표현을 재사용해 적은 데이터에서도 강한 출발점을 제공합니다.",
        ],
        code: {
          language: "python",
          label: "이미지 공간을 유지하는 작은 CNN",
          code: `cnn = keras.Sequential([
    keras.layers.Input(shape=(28, 28, 1)),
    keras.layers.Conv2D(32, 3, activation="relu", padding="same"),
    keras.layers.MaxPooling2D(),
    keras.layers.Conv2D(64, 3, activation="relu", padding="same"),
    keras.layers.GlobalAveragePooling2D(),
    keras.layers.Dense(10, activation="softmax"),
])`,
          explanation: [
            "Conv2D는 작은 필터로 지역 특징을 찾고 pooling은 공간 크기를 줄입니다.",
            "GlobalAveragePooling2D는 큰 Flatten보다 파라미터 수를 줄이는 선택이 될 수 있습니다.",
          ],
        },
        bullets: [
          "OOM이 나면 batch 크기, 입력 해상도, 모델 폭을 줄입니다.",
          "NaN loss가 나면 입력 NaN, 너무 큰 학습률, 잘못된 loss/label 조합을 확인합니다.",
          "재현성에는 seed뿐 아니라 결정론 설정과 라이브러리·장치 버전도 영향을 줍니다.",
          "Windows 네이티브 TensorFlow 2.11+ GPU 지원 제약은 WSL2 환경을 검토합니다.",
        ],
        tip: "accuracy만 저장하지 말고 loss 곡선, 클래스별 지표, 잘못 분류한 샘플도 함께 보세요.",
      },
    ],
    checkpoints: [
      "뉴런의 가중합, 활성화, loss, 역전파의 관계를 설명할 수 있다.",
      "입력과 출력 텐서 shape를 층별로 추적할 수 있다.",
      "출력층 활성화와 손실함수를 문제 유형에 맞게 조합할 수 있다.",
      "훈련 loss와 검증 loss의 분리를 과적합 신호로 해석할 수 있다.",
      "Dense, CNN, RNN/Transformer가 적합한 데이터 구조를 구분할 수 있다.",
    ],
    related: ["machine-learning-workflow", "langchain-rag-pipeline", "career-tuner-architecture"],
    sources: [
      {
        label: "인공신경망 실습",
        repository: "https://github.com/nohssam/2026-DL",
        path: "ex01_인공신경망(ANN).ipynb",
        note: "Fashion-MNIST shape, 스케일링, CPU/GPU 실행 확인",
      },
      {
        label: "신경망 모델 훈련 실습",
        repository: "https://github.com/nohssam/2026-DL",
        path: "ex03_신경망모델훈련.ipynb",
        note: "history, validation, loss/accuracy 곡선",
      },
      {
        label: "합성곱 신경망 실습",
        repository: "https://github.com/nohssam/2026-DL",
        path: "ex05_합성곱신경망(CNN).ipynb",
      },
    ],
  },
  {
    slug: "langchain-rag-pipeline",
    track: "ai",
    order: 5,
    title: "LangChain RAG: 문서를 찾고 근거로 답하게 만들기",
    eyebrow: "일반 개념 · RAG",
    summary:
      "문서 로딩, 청크 분할, 임베딩, 벡터 검색, 근거 프롬프트, 출처 표시를 하나의 검색 증강 생성 파이프라인으로 연결합니다.",
    level: "중급",
    duration: "85분",
    why:
      "LLM은 학습 시점 이후의 사내 문서나 업로드한 PDF 내용을 자동으로 알지 못합니다. RAG는 질문과 관련된 문서 조각을 먼저 찾아 프롬프트에 넣어 주므로 최신성·근거성·추적 가능성을 높일 수 있습니다. 다만 검색 실패를 생성 모델이 고쳐 주지는 않으므로 단계별 평가가 필요합니다.",
    prerequisites: [
      "python-data-foundations의 함수·파일·예외 처리",
      "벡터가 숫자 배열이라는 정도의 이해",
      "LLM 호출에는 별도 API 자격증명과 비용·개인정보 정책이 필요하다는 인식",
    ],
    keywords: ["LangChain", "RAG", "청크", "임베딩", "FAISS", "Retriever", "프롬프트", "출처"],
    sections: [
      {
        id: "rag-mental-model",
        title: "1. RAG는 검색과 생성을 연결한 시스템이다",
        paragraphs: [
          "Retrieval-Augmented Generation은 질문에 관련된 근거를 검색(Retrieval)하고 그 근거를 입력에 추가(Augmented)해 답을 생성(Generation)하는 구조입니다. 모델 자체를 다시 학습시키는 파인튜닝과는 목적이 다릅니다.",
          "온라인 질의 전에 문서를 로드하고 청크로 나누어 임베딩한 뒤 벡터 저장소에 색인합니다. 질의 때는 질문을 임베딩해 가까운 청크를 찾고, 질문+근거를 프롬프트에 넣습니다.",
        ],
        code: {
          language: "text",
          label: "두 단계 RAG 파이프라인",
          code: `[색인 단계]
PDF/CSV/JSON → Loader → Documents → Splitter → Chunks
             → Embeddings → Vector Store

[질의 단계]
Question → Retriever(top-k) → Context + Question → Prompt
         → Chat Model → Answer + Source metadata`,
          explanation: [
            "색인은 문서가 바뀔 때 다시 만들고, 질의는 사용자 질문마다 실행합니다.",
            "각 청크의 파일명·페이지·문서 ID metadata를 보존해야 출처를 표시할 수 있습니다.",
          ],
        },
        tip: "RAG가 기억(memory)과 같지는 않습니다. 대화 이력은 이전 발화를 보존하고, RAG는 외부 지식에서 근거를 검색합니다.",
      },
      {
        id: "load-and-split",
        title: "2. 좋은 청크는 문맥을 보존하면서 검색 단위가 작다",
        paragraphs: [
          "Loader는 PDF 페이지 같은 원본을 Document 객체로 바꾸고 page_content와 metadata를 제공합니다. Splitter는 긴 텍스트를 검색 가능한 조각으로 나눕니다.",
          "chunk_size가 너무 크면 여러 주제가 섞이고, 너무 작으면 정의와 조건이 갈라집니다. chunk_overlap은 경계에서 문장이 잘리는 문제를 줄이지만 중복 검색과 토큰 비용을 늘립니다.",
        ],
        code: {
          language: "python",
          label: "PDF 로드와 재귀적 분할",
          code: `from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

pages = PyPDFLoader("guide.pdf").load()
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100,
)
chunks = splitter.split_documents(pages)

print("pages", len(pages))
print("chunks", len(chunks))
print(chunks[0].metadata)`,
          explanation: [
            "RecursiveCharacterTextSplitter는 문단, 줄, 공백 순으로 가능한 자연스러운 경계를 찾습니다.",
            "스캔 PDF는 텍스트가 없을 수 있어 OCR 단계와 품질 검사가 별도로 필요합니다.",
          ],
        },
        result: {
          label: "대표 실행 결과",
          output: `pages 12
chunks 47
{'source': 'guide.pdf', 'page': 0}`,
          explanation: "숫자는 문서 길이와 설정에 따라 달라지며 source와 page가 남았는지가 더 중요합니다.",
        },
      },
      {
        id: "embed-and-retrieve",
        title: "3. 임베딩은 의미를 좌표로 바꾸고 검색기는 가까운 청크를 고른다",
        paragraphs: [
          "임베딩 모델은 텍스트를 고정 길이 숫자 벡터로 변환합니다. 의미가 비슷한 문장은 벡터 공간에서 가깝다는 가정을 이용해 cosine similarity나 거리로 관련 청크를 찾습니다.",
          "top-k를 늘리면 recall은 높아질 수 있지만 불필요한 문맥과 비용도 늘어납니다. metadata filter, hybrid search, reranker를 조합하면 검색 품질을 개선할 수 있습니다.",
        ],
        code: {
          language: "python",
          label: "FAISS 색인과 검색",
          code: `from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vector_store = FAISS.from_documents(chunks, embeddings)
retriever = vector_store.as_retriever(search_kwargs={"k": 3})

docs = retriever.invoke("배포 전에 무엇을 확인해야 하나요?")
for doc in docs:
    print(doc.metadata.get("page"), doc.page_content[:60])`,
          explanation: [
            "임베딩 모델이 바뀌면 기존 벡터와 차원·의미 공간이 달라지므로 재색인이 필요합니다.",
            "민감 문서를 외부 임베딩 API로 보내도 되는지 정책과 동의를 먼저 확인합니다.",
          ],
        },
        result: {
          label: "대표 검색 결과",
          output: `8 배포 전에는 환경변수, 데이터베이스 마이그레이션, 헬스 체크를...
9 롤백 절차와 모니터링 대시보드를 사전에 확인합니다...
7 CI에서 테스트와 시크릿 스캔이 통과했는지 확인합니다...`,
        },
        tip: "검색 결과가 틀리면 프롬프트보다 먼저 원문 추출, 청크, metadata, 검색 query, top-k를 확인하세요.",
      },
      {
        id: "grounded-generation",
        title: "4. 프롬프트는 근거 밖에서 답하지 않는 계약을 만든다",
        paragraphs: [
          "검색된 context를 그대로 넣는 것만으로 환각이 사라지지는 않습니다. 문서에 없으면 모른다고 말하고, 답의 문장마다 어떤 출처를 사용했는지 연결하는 규칙이 필요합니다.",
          "출처 표시는 모델이 만든 문자열보다 검색 단계에서 얻은 metadata를 기반으로 구성하는 편이 안전합니다. 답변과 별도로 사용한 document ID, page, score를 서버가 보존하면 감사와 재평가가 가능합니다.",
        ],
        code: {
          language: "python",
          label: "근거 제한 프롬프트와 생성",
          code: `from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

prompt = ChatPromptTemplate.from_template("""
아래 참고 문서만 사용해 한국어로 답하세요.
근거가 부족하면 '문서에서 확인할 수 없습니다.'라고 답하세요.

[참고 문서]
{context}

[질문]
{question}
""")

messages = prompt.invoke({"context": context_text, "question": query})
answer = ChatOpenAI(model="gpt-4o-mini", temperature=0).invoke(messages)
print(answer.content)`,
          explanation: [
            "temperature=0도 사실성을 보장하지는 않습니다. 검색 근거와 평가가 여전히 필요합니다.",
            "사용자 문서 안의 명령문은 prompt injection일 수 있으므로 문서를 신뢰할 수 없는 데이터로 취급합니다.",
          ],
        },
        result: {
          label: "대표 응답",
          output: `배포 전에는 테스트·시크릿 스캔, 환경변수와 마이그레이션, 헬스 체크와 롤백 절차를 확인해야 합니다.

출처: guide.pdf p.8, p.9, p.7`,
        },
      },
      {
        id: "rag-product-evaluation",
        title: "5. 앱 상태·보안·평가까지가 RAG 제품이다",
        paragraphs: [
          "Streamlit 같은 UI에서는 업로드 파일을 임시 저장한 뒤 반드시 삭제하고, 벡터 저장소와 대화 이력을 세션별로 분리해야 합니다. 여러 사용자가 같은 전역 저장소를 공유하면 문서가 섞이는 심각한 정보 노출이 생길 수 있습니다.",
          "평가는 retrieval과 generation을 분리합니다. 검색 단계는 정답 근거가 top-k에 포함되는지, 생성 단계는 답이 근거에 충실한지와 질문에 유용한지를 측정합니다.",
        ],
        bullets: [
          "API key는 .env를 커밋하지 않고 호스팅 환경의 secret으로 주입합니다.",
          "업로드 크기·형식·페이지 수를 제한하고 파서 실패를 사용자에게 설명합니다.",
          "세션 종료와 재업로드 시 임시 파일과 벡터 인덱스를 정리합니다.",
          "문서 ID와 접근 권한을 검색 filter에 적용해 권한 밖 청크를 차단합니다.",
          "질문·검색 청크·답·출처·지연시간을 개인정보 정책에 맞춰 평가 로그로 남깁니다.",
        ],
        code: {
          language: "text",
          label: "RAG 평가표 예시",
          code: `질문: 환불 가능 기간은?
정답 근거: policy.pdf p.4
retrieval hit@3: true
answer grounded: true
answer useful: true
citation correct: true
latency: 1.8s`,
        },
        tip: "LLM 답만 눈으로 몇 개 보는 방식은 검색 회귀를 놓칩니다. 고정 질문·정답 근거 세트를 만들어 변경 전후를 자동 비교하세요.",
      },
    ],
    checkpoints: [
      "RAG와 파인튜닝, 대화 memory의 목적 차이를 설명할 수 있다.",
      "loader → splitter → embedding → vector store → retriever → LLM 흐름을 그릴 수 있다.",
      "chunk_size, overlap, top-k의 trade-off를 설명할 수 있다.",
      "검색 metadata로 출처를 표시하고 문서 밖 답변을 제한할 수 있다.",
      "검색 품질과 생성 품질을 별도 지표로 평가할 수 있다.",
    ],
    related: ["python-data-foundations", "machine-learning-workflow", "career-tuner-architecture"],
    sources: [
      {
        label: "LangChain RAG 공개 실습 저장소",
        repository: "https://github.com/nohssam/2026_LangChain_RAG",
        path: "sample02/00_RAG.ipynb",
      },
      {
        label: "PDF RAG Streamlit 챗봇",
        repository: "https://github.com/nohssam/2026_LangChain_RAG",
        path: "sample02/07_streamlit_rag_chat.py",
        note: "PDF 로드, 청크, FAISS, 검색, 스트리밍 답변, 출처 표시 흐름",
      },
      {
        label: "RAG 실행 의존성",
        repository: "https://github.com/nohssam/2026_LangChain_RAG",
        path: "requirements.txt",
      },
    ],
  },
  {
    slug: "career-tuner-architecture",
    track: "projects",
    order: 1,
    title: "CareerTuner에서 배우는 AI 제품 아키텍처",
    eyebrow: "프로젝트 사례 · CareerTuner",
    summary:
      "지원 건 중심 도메인, 수직 기능 분리, AI provider 폴백, 근거 게이트와 분석 버저닝을 실제 프로젝트 구조로 읽습니다.",
    level: "실전",
    duration: "80분",
    why:
      "AI 기능은 모델 호출 한 번으로 끝나지 않습니다. 사용자 맥락, 입력 버전, 동의, 근거, 실패 대체 경로, 사용량, 재현성을 제품 구조 안에 넣어야 합니다. CareerTuner는 이 문제를 하나의 지원 건을 중심으로 조립한 사례입니다.",
    prerequisites: [
      "Spring Controller → Service → Persistence 기본 흐름",
      "React SPA가 REST API를 호출한다는 기초 이해",
      "machine-learning-workflow와 langchain-rag-pipeline의 평가·근거 개념",
    ],
    keywords: ["모노레포", "수직 슬라이스", "Application Case", "AI 오케스트레이션", "Fallback", "Evidence Gate", "버저닝"],
    sections: [
      {
        id: "application-case-core",
        title: "1. 화면이 아니라 도메인의 수명주기를 중심에 둔다",
        paragraphs: [
          "CareerTuner의 핵심 단위는 채용공고 파일이 아니라 지원 건(Application Case)입니다. 특정 기업·직무·공고에 지원하는 하나의 작업 공간 안에 공고 분석, 프로필 비교, 전략, 면접, 첨삭 결과를 연결합니다.",
          "이 중심 단위가 있으면 사용자는 여러 지원을 섞지 않고 이력을 볼 수 있고, 시스템은 어떤 프로필 버전과 공고 revision으로 분석했는지 추적할 수 있습니다.",
        ],
        code: {
          language: "text",
          label: "지원 건 중심 관계",
          code: `User
 ├─ Profile ── ProfileVersion
 └─ ApplicationCase (회사 + 직무 + 공고 한 건)
     ├─ JobPostingRevision
     ├─ AnalysisRun
     ├─ JobAnalysis / CompanyAnalysis / FitAnalysis
     ├─ StrategyTask
     ├─ InterviewSession ── Question ── Answer
     └─ CorrectionRequest`,
          explanation: [
            "공고 수정은 새 지원 건이 아니라 같은 공고의 revision으로 남깁니다.",
            "분석 결과는 입력 버전과 AnalysisRun에 연결해야 재분석 전후를 비교할 수 있습니다.",
          ],
        },
        result: {
          label: "사용자 관점의 결과",
          output: `네이버 백엔드 지원
공고 v2 · 프로필 v5 · 적합도 분석 run #12
이전 run 대비 +6점 · 부족 역량 3개 · 학습 과제 4개`,
        },
        tip: "테이블을 화면 메뉴별로 먼저 만들면 같은 개념이 중복됩니다. 사용자에게 오래 남는 업무 단위와 그 상태 전이를 먼저 찾으세요.",
      },
      {
        id: "vertical-slices",
        title: "2. 기능을 프런트부터 DB까지 수직으로 소유한다",
        paragraphs: [
          "모노레포는 backend, frontend, ml, docs를 한 저장소에 두지만 모든 코드를 한 폴더에 섞는다는 뜻은 아닙니다. 도메인별로 controller → service → mapper → domain/dto를 두고 프런트도 feature별 pages, components, api, hooks, types를 둡니다.",
          "한 기능 담당자가 사용자 화면, 사용자 API, 대응 관리자 기능까지 함께 보면 변경의 전체 계약을 확인할 수 있습니다. 공통 인증·라우팅·DB·AI 공통 엔진은 팀 합의 영역으로 분리해 충돌을 줄입니다.",
        ],
        code: {
          language: "java",
          label: "인증 사용자와 동의를 경계에서 확인하는 API",
          code: `@RestController
@RequestMapping("/api/fit-analyses")
@RequiredArgsConstructor
@RequiresConsent(ConsentType.AI_DATA)
class FitAnalysisController {
    private final FitAnalysisService service;

    @PostMapping("/application-cases/{caseId}")
    ApiResponse<FitAnalysisDetailResponse> generate(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long caseId) {
        return ApiResponse.ok(service.generate(user.id(), caseId, false));
    }
}`,
          explanation: [
            "사용자 ID를 요청 body가 아니라 인증 principal에서 얻어 다른 사용자의 데이터를 지정하지 못하게 합니다.",
            "동의 정책을 annotation과 service 검증으로 적용하면 AI 데이터 처리 경계를 명시할 수 있습니다.",
          ],
        },
        result: {
          label: "대표 API 응답",
          output: `{
  "success": true,
  "code": "OK",
  "message": "요청이 성공했습니다.",
  "data": { "applicationCaseId": 42, "fitScore": 78, "runId": 12 }
}`,
          explanation: "표준 envelope를 사용하면 프런트가 성공·오류를 같은 방식으로 처리할 수 있습니다.",
        },
      },
      {
        id: "ai-provider-and-evidence",
        title: "3. AI provider와 근거 판정을 한 호출부에 흩뿌리지 않는다",
        paragraphs: [
          "실제 AI 제품은 provider 장애, 비용, API key 부재, 응답 형식 오류를 처리해야 합니다. 호출부마다 if 문을 반복하기보다 전략 인터페이스와 단일 dispatcher가 자체 모델 → 외부 모델 → 규칙/mock 순서를 결정하도록 만듭니다.",
          "모델이 그럴듯하게 말하는 것과 사실에 근거하는 것은 다릅니다. FitAnalysis의 근거 게이트처럼 공고 원문, 사용자 프로필, 검증된 외부 근거가 있는 주장만 노출하고 불확실성 상태를 결과에 포함해야 합니다.",
        ],
        code: {
          language: "text",
          label: "AI 분석 실행 계약",
          code: `GenerateFitAnalysis(command)
  ├─ validate ownership + consent
  ├─ load profileVersion + jobPostingRevision
  ├─ provider dispatcher
  │   ├─ self-hosted model
  │   ├─ Claude / OpenAI
  │   └─ deterministic mock or rule fallback
  ├─ parse structured response against schema
  ├─ evidence gate: SUPPORTED | PARTIAL | UNSUPPORTED
  └─ persist result + source + prompt/model version + usage`,
          explanation: [
            "구조화 schema 검증 실패를 정상 분석처럼 저장하지 않습니다.",
            "fallback을 사용했다면 결과 source에 남겨 사용자가 품질 차이를 알 수 있게 합니다.",
          ],
        },
        result: {
          label: "근거 포함 결과 예시",
          output: `matchedSkill: "Spring Boot"
evidence: jobPosting.requirements[2] + profile.skills[4]
gate: SUPPORTED
confidence: HIGH
generationSource: OPENAI`,
        },
        tip: "같은 전략 인터페이스에 @Primary 구현체가 여러 개면 실행 환경에 따라 Bean 선택이 깨집니다. 우선순위를 한 dispatcher에 모으고 계약 테스트로 중복을 막으세요.",
      },
      {
        id: "history-and-reproducibility",
        title: "4. 재분석은 덮어쓰기가 아니라 비교 가능한 새 실행이다",
        paragraphs: [
          "사용자 프로필과 공고는 계속 바뀝니다. 최신 점수만 덮어쓰면 왜 결과가 달라졌는지 설명할 수 없습니다. 입력 스냅샷과 분석 실행을 버전으로 저장하고 최신 결과를 별도로 조회합니다.",
          "보관과 삭제도 업무 상태와 분리합니다. DRAFT·ANALYZING·READY는 진행 상태이고 archived_at과 deleted_at은 가시성·수명주기를 표현합니다. 서로 다른 의미를 한 status enum에 몰아넣지 않는 설계입니다.",
        ],
        code: {
          language: "sql",
          label: "분석 재현성에 필요한 최소 연결",
          code: `analysis_run(
  id,
  application_case_id,
  profile_version_id,
  job_posting_revision_id,
  model_name,
  prompt_version,
  generation_source,
  created_at
)

fit_analysis(
  id,
  analysis_run_id,
  score,
  result_json,
  evidence_json
)`,
          explanation: [
            "result_json만 두지 않고 어떤 입력과 모델·프롬프트로 만들었는지 함께 연결합니다.",
            "개인 데이터의 실제 보존 기간과 삭제 정책은 법률·동의 요구에 맞춰 별도로 정의해야 합니다.",
          ],
        },
      },
      {
        id: "career-tuner-lessons",
        title: "5. 이 프로젝트에서 재사용할 학습 포인트",
        paragraphs: [
          "CareerTuner의 구조를 그대로 복사하기보다 문제의 크기에 맞게 원칙을 가져오세요. 작은 앱은 단일 provider와 단순 테이블로 시작해도 되지만, 도메인 중심 ID, 입력 버전, 근거, 오류 출처는 초기에 잡을수록 이득이 큽니다.",
          "공개 포트폴리오에는 실제 비밀값과 사용자 데이터를 제거하고 mock 데이터로 흐름을 재현합니다. 기능 설명서와 라이브 데모를 함께 두면 코드를 실행하기 어려운 독자도 설계 의도를 확인할 수 있습니다.",
        ],
        bullets: [
          "업무의 중심 aggregate를 정하고 모든 AI 결과를 그 ID에 연결합니다.",
          "도메인별 수직 슬라이스와 팀 공통 변경 영역을 명시합니다.",
          "AI 응답 schema, fallback, evidence, usage를 제품 데이터로 취급합니다.",
          "입력과 실행을 버전으로 남겨 재분석을 비교 가능하게 만듭니다.",
          "공개 데모는 mock으로 동작시키되 실제 구조와 다른 점을 문서에 표시합니다.",
        ],
        tip: "개인 이력서·면접 영상·공고 원문은 민감할 수 있습니다. 캐시, 로그, 백업, 공개 저장소까지 포함한 데이터 수명주기를 먼저 설계하세요.",
      },
    ],
    checkpoints: [
      "Application Case가 여러 AI 기능을 묶는 이유를 설명할 수 있다.",
      "기능별 수직 슬라이스와 공통 플랫폼 영역을 구분할 수 있다.",
      "AI provider fallback과 evidence gate의 책임을 각각 설명할 수 있다.",
      "분석 결과를 입력·모델·프롬프트 버전과 연결할 수 있다.",
      "공개 포트폴리오에서 mock과 실제 구현의 경계를 문서화할 수 있다.",
    ],
    related: ["machine-learning-workflow", "langchain-rag-pipeline", "triptogether-domain-collaboration"],
    sources: [
      {
        label: "CareerTuner 공개 포트폴리오",
        repository: "https://github.com/notetester/CareerTunerPortfolio",
        path: "README.md",
        note: "공개 dev 브랜치의 제품 흐름·기술 스택·보안 처리 안내",
      },
      {
        label: "공개 아키텍처 설명서",
        repository: "https://github.com/notetester/CareerTunerPortfolio",
        path: "portfolio-docs/architecture.md",
      },
      {
        label: "적합도 분석 설명서",
        repository: "https://github.com/notetester/CareerTunerPortfolio",
        path: "portfolio-docs/fit-analysis.md",
        note: "근거 게이트와 분석 도메인의 공개 설명",
      },
    ],
  },
  {
    slug: "lcb-legacy-modernization",
    track: "projects",
    order: 2,
    title: "LCB에서 배우는 레거시 Spring MVC 현대화",
    eyebrow: "프로젝트 사례 · LCB Cinema",
    summary:
      "JSP·jQuery·Spring MVC·MyBatis WAR 구조를 읽고, 동작을 보존하면서 의존성 주입·트랜잭션·상태 모델·테스트를 점진적으로 개선합니다.",
    level: "실전",
    duration: "75분",
    why:
      "레거시를 현대화한다는 것은 전부 다시 쓰는 일이 아닙니다. 현재 요청 흐름과 사용자 행동을 먼저 보존하고, 가장 위험한 경계부터 테스트로 감싼 뒤 작은 단위로 교체해야 정보와 기능을 잃지 않습니다.",
    prerequisites: [
      "Servlet/JSP의 요청·응답과 세션 개념",
      "Spring MVC의 Controller와 view name 반환 방식",
      "MyBatis mapper interface와 XML SQL의 역할",
    ],
    keywords: ["레거시", "Spring MVC", "JSP", "MyBatis", "WAR", "점진적 현대화", "상태 전이", "회귀 테스트"],
    sections: [
      {
        id: "read-current-flow",
        title: "1. 먼저 현재 요청 흐름을 복원한다",
        paragraphs: [
          "LCB는 브라우저 요청이 DispatcherServlet과 interceptor를 거쳐 Controller, Service, MyBatis Mapper, MySQL로 가고 JSP 또는 JSON으로 돌아오는 전통적인 Spring MVC WAR 구조입니다.",
          "현대화 전에 URL, 세션 key, Model attribute, view name, mapper SQL을 한 흐름으로 따라가야 합니다. 한 층만 보고 이름을 바꾸면 JSP나 JavaScript가 기대하는 계약이 조용히 깨질 수 있습니다.",
        ],
        code: {
          language: "text",
          label: "LCB 런타임 계층",
          code: `Browser + jQuery
  → Filter / DispatcherServlet / Interceptor
  → MovieController
  → MovieService
  → MovieMapper interface + MovieMapper.xml
  → MySQL
  → JSP view 또는 @ResponseBody JSON`,
          explanation: [
            "Controller는 HTTP·세션·화면 계약을, Service는 업무 규칙을, Mapper는 SQL을 담당해야 합니다.",
            "실제 프로젝트에서는 이 책임이 섞여 있을 수 있으므로 관찰한 현재 동작과 목표 구조를 구분해 기록합니다.",
          ],
        },
        result: {
          label: "대표 요청 결과",
          output: `GET /movie/movieDetail?mno=7
→ model['mno'] = 7
→ view: /WEB-INF/views/movie/movieDetail.jsp
→ AJAX GET /movie/getList/7
→ MovieVO JSON`,
        },
      },
      {
        id: "find-risk-without-rewrite",
        title: "2. 작동 코드에서 변경 위험을 구체적으로 찾는다",
        paragraphs: [
          "예제의 getList는 같은 mapper 조회를 로그 출력과 반환에 두 번 호출할 수 있고, 필드 주입은 의존성을 숨겨 단위 테스트를 어렵게 합니다. 좋아요 확인과 등록, 카운터 갱신이 여러 호출로 나뉘면 동시 요청에서 중복이나 카운터 불일치가 생길 수 있습니다.",
          "이런 문제를 발견했다고 즉시 SPA와 JPA로 재작성할 필요는 없습니다. 같은 URL과 JSP를 유지하면서 생성자 주입, 단일 조회, 트랜잭션, DB UNIQUE 제약부터 적용할 수 있습니다.",
        ],
        code: {
          language: "java",
          label: "기존 계약을 유지한 작은 개선",
          code: `@Controller
@RequestMapping("/movie")
@RequiredArgsConstructor
class MovieController {
    private final MovieService movieService;

    @GetMapping("/getList/{movieCode}")
    @ResponseBody
    MovieResponse getMovie(@PathVariable int movieCode) {
        return MovieResponse.from(movieService.getMovie(movieCode));
    }
}`,
          explanation: [
            "생성자 주입은 필수 의존성을 생성 시점에 보장하고 테스트에서 fake를 넣기 쉽게 합니다.",
            "영속 객체를 바로 JSON으로 내보내지 않고 DTO를 사용하면 DB 변경이 화면 계약으로 번지는 것을 줄입니다.",
          ],
        },
        tip: "System.out으로 엔터티 전체를 출력하면 개인정보나 긴 본문이 로그에 남을 수 있습니다. 구조화 로그와 필요한 식별자만 사용하세요.",
      },
      {
        id: "atomic-like-and-reservation",
        title: "3. 여러 DB 변경은 하나의 업무 트랜잭션으로 묶는다",
        paragraphs: [
          "좋아요, 좌석 선점, 결제, 취소는 읽기와 쓰기가 연속되는 업무입니다. 요청 중간에 실패하면 일부 테이블만 바뀌지 않도록 Service 메서드에 트랜잭션 경계를 둡니다.",
          "중복 좋아요는 서비스의 사전 조회만으로 막지 말고 (member_id, movie_code) UNIQUE 제약을 최종 방어선으로 둡니다. 표시용 카운터는 원장 데이터와 어긋날 수 있으므로 원자적 증가 또는 주기적 reconcile이 필요합니다.",
        ],
        code: {
          language: "java",
          label: "좋아요 토글의 트랜잭션 경계",
          code: `@Transactional
public LikeResult likeMovie(long memberId, long movieCode) {
    boolean inserted = likesMapper.insertIfAbsent(memberId, movieCode) == 1;
    if (!inserted) {
        return LikeResult.alreadyLiked(movieCode);
    }
    movieMapper.incrementLikeCount(movieCode);
    return LikeResult.created(movieCode);
}`,
          explanation: [
            "insertIfAbsent는 DB의 UNIQUE 제약과 함께 동시 요청을 안전하게 처리합니다.",
            "예외가 나면 좋아요 원장과 카운터 갱신이 함께 rollback되어야 합니다.",
          ],
        },
        result: {
          label: "대표 동시 요청 결과",
          output: `request A: 201 CREATED, likeCount 41 → 42
request B: 200 ALREADY_LIKED, likeCount remains 42
likes rows for (member=3, movie=7): 1`,
        },
      },
      {
        id: "state-machine-first",
        title: "4. 예매를 boolean이 아니라 상태 전이로 모델링한다",
        paragraphs: [
          "좌석을 선택했다고 곧바로 결제 완료 티켓이 되는 것은 아닙니다. 공개 포트폴리오는 AVAILABLE → HELD → PAID → CANCELLED 흐름과 선점 만료를 보여 줍니다.",
          "상태 전이는 허용된 출발 상태를 조건으로 업데이트해야 합니다. 취소는 좌석 반환, 결제·환불 이력, 운영 지표 갱신을 같은 업무 사건으로 다룹니다.",
        ],
        code: {
          language: "sql",
          label: "경쟁 조건을 줄이는 조건부 상태 변경",
          code: `UPDATE seat_hold
SET status = 'PAID', paid_at = CURRENT_TIMESTAMP
WHERE hold_id = #{holdId}
  AND member_id = #{memberId}
  AND status = 'HELD'
  AND expires_at > CURRENT_TIMESTAMP;

-- affected rows가 0이면 만료·중복 결제·권한 오류 중 하나다.`,
          explanation: [
            "먼저 SELECT하고 나중에 UPDATE하는 사이에 상태가 바뀔 수 있으므로 UPDATE 조건에 이전 상태를 포함합니다.",
            "상태마다 누가 어떤 이유로 언제 바꿨는지 이력을 남기면 운영 대응이 쉬워집니다.",
          ],
        },
        result: {
          label: "예매 시나리오 결과",
          output: `AVAILABLE → HELD (4분 타이머 시작)
HELD → PAID (티켓 발급, 활성 좌석 감소)
PAID → CANCELLED (환불 기록, 좌석 반환)
만료된 HELD → AVAILABLE`,
        },
      },
      {
        id: "strangler-checklist",
        title: "5. 테스트로 둘러싼 뒤 점진적으로 교체한다",
        paragraphs: [
          "가장 먼저 현재 페이지와 API의 smoke test를 만들어 동작 기준을 고정합니다. 그 다음 설정 외재화, 생성자 주입, DTO, 트랜잭션, 전역 예외 처리, 테스트를 적용하고 화면은 그대로 유지할 수 있습니다.",
          "새 기능은 REST API나 별도 모듈로 만들고 기존 JSP가 그 API를 사용하게 하면서 경계를 이동하는 Strangler 방식이 전면 재작성보다 안전합니다. 각 단계에서 빌드·핵심 시나리오·DB 변경을 검증합니다.",
        ],
        bullets: [
          "DB·SMTP 자격증명은 placeholder와 환경변수로 분리합니다.",
          "문자 인코딩, context path, JSP EL과 JavaScript 경계를 회귀 테스트합니다.",
          "Mapper의 ${} 문자열 치환 대신 #{} parameter binding을 사용합니다.",
          "로그인·예매·결제·취소처럼 손실 비용이 큰 흐름부터 테스트합니다.",
          "사용하지 않는 코드는 호출 증거를 확인한 뒤 한 단계씩 제거합니다.",
        ],
        result: {
          label: "완료 기준 예시",
          output: `Maven WAR package: success
guided booking smoke test: pass
seat hold expiry: pass
payment cancellation returns seat: pass
secret scan: no committed credential`,
          explanation: "공개 포트폴리오에는 서버 없이도 핵심 상태 흐름을 확인하는 Pages 데모와 기술 문서가 함께 제공됩니다.",
        },
        tip: "프레임워크 버전 업과 업무 로직 변경을 한 커밋에 섞지 마세요. 실패했을 때 원인과 rollback 경계를 찾기 어려워집니다.",
      },
    ],
    checkpoints: [
      "JSP 요청 하나를 Controller, Service, Mapper, SQL, view까지 추적할 수 있다.",
      "전면 재작성 없이 적용 가능한 개선을 위험도 순으로 나열할 수 있다.",
      "좋아요·예매의 동시성 문제를 DB 제약과 트랜잭션으로 방어할 수 있다.",
      "예매 수명주기를 명시적인 상태 전이로 표현할 수 있다.",
      "현재 동작을 보존하는 smoke test를 먼저 설계할 수 있다.",
    ],
    related: ["triptogether-domain-collaboration", "career-tuner-architecture", "machine-learning-workflow"],
    sources: [
      {
        label: "LCB Cinema 공개 포트폴리오",
        repository: "https://github.com/notetester/LCBPortfolio",
        path: "README.md",
        note: "Spring MVC WAR와 GitHub Pages 상태 시뮬레이터 설명",
      },
      {
        label: "LCB 아키텍처 문서",
        repository: "https://github.com/notetester/LCBPortfolio",
        path: "docs/architecture.html",
        note: "런타임 계층, 요청 흐름, 예매·채팅 흐름",
      },
      {
        label: "영화 Controller 원본",
        repository: "https://github.com/notetester/LCBPortfolio",
        path: "src/main/java/com/lcb404/controller/MovieController.java",
      },
      {
        label: "영화 MyBatis SQL",
        repository: "https://github.com/notetester/LCBPortfolio",
        path: "src/main/resources/sqlmap/MovieMapper.xml",
      },
    ],
  },
  {
    slug: "triptogether-domain-collaboration",
    track: "projects",
    order: 3,
    title: "TripTogether에서 배우는 도메인 협업과 교체 가능한 설계",
    eyebrow: "프로젝트 사례 · TripTogether",
    summary:
      "여행·예약·지갑·보상·관리 도메인의 경계를 나누고 Provider, 트랜잭션, 상태·이력, ADR로 팀 협업 계약을 만드는 법을 봅니다.",
    level: "실전",
    duration: "85분",
    why:
      "기능이 많은 서비스는 코드량보다 도메인 사이의 약속이 어렵습니다. 항공권 구매가 지갑을 차감하고 이력을 남기며, 취소가 환불과 좌석 상태를 되돌리는 것처럼 여러 모듈을 지나는 불변식을 명시해야 팀 작업에서도 데이터가 맞게 유지됩니다.",
    prerequisites: [
      "Spring MVC와 MyBatis의 Controller → Service → Mapper 흐름",
      "DB 트랜잭션과 UNIQUE/외래키 제약의 기초",
      "상태 전이와 API 요청·응답을 읽을 수 있는 정도의 이해",
    ],
    keywords: ["도메인 경계", "Provider Pattern", "트랜잭션", "불변식", "상태 이력", "ADR", "Mock", "협업"],
    sections: [
      {
        id: "bounded-context-map",
        title: "1. 기능 목록을 도메인과 자산 흐름으로 다시 나눈다",
        paragraphs: [
          "TripTogether는 여행지 탐색, 여행 코스, 항공권, 패키지, 지갑, 보상, 커뮤니티, 신고, 관리자 기능을 포함합니다. 메뉴가 많다고 모든 서비스가 서로 직접 호출하면 변경 영향이 폭발합니다.",
          "각 도메인이 소유하는 데이터와 공개하는 작업을 정하고, 도메인 사이에서는 ID와 명시적 DTO·Service 계약으로 협업합니다. 특히 cash, mileage, point, EXP는 이름이 비슷해도 획득·소비·정산 규칙이 다른 자산입니다.",
        ],
        code: {
          language: "text",
          label: "도메인 협업 지도",
          code: `Explore ── spotId ──▶ Flight / TravelPackage / Course
Auth ── userId ─────▶ Community / Booking / Admin
Flight / Package ── payment command ──▶ Wallet
Community / Booking ── activity event ──▶ Reward
Report ── moderation decision ──▶ Community visibility
Admin ── policy/version ──▶ Wallet / Reward / Moderation`,
          explanation: [
            "도메인은 다른 도메인의 테이블을 임의로 수정하기보다 소유 서비스의 명령을 호출합니다.",
            "읽기 화면에 여러 정보가 필요하면 전용 query service나 projection으로 조합할 수 있습니다.",
          ],
        },
        tip: "패키지 이름만 나눈다고 경계가 생기지는 않습니다. 누가 데이터를 쓰는지와 실패 시 누가 복구하는지를 함께 정하세요.",
      },
      {
        id: "provider-seam",
        title: "2. 외부 연동 앞에 Provider 경계를 둔다",
        paragraphs: [
          "실제 항공 API가 준비되지 않아도 예약 UX와 가격·할인 규칙은 개발할 수 있습니다. FlightOfferProvider 인터페이스는 여행지와 날짜를 받아 견적을 반환하는 계약을 정의하고 Mock 구현은 결정적인 샘플 견적을 만듭니다.",
          "나중에 Amadeus 같은 API를 붙일 때 Service와 화면을 크게 바꾸지 않고 Provider 구현과 외부 응답 변환만 교체할 수 있습니다. Mock은 임시 쓰레기가 아니라 개발·테스트용 계약 구현체입니다.",
        ],
        code: {
          language: "java",
          label: "교체 가능한 항공 견적 Provider",
          code: `public interface FlightOfferProvider {
    boolean supports(ExploreVO spot);

    List<FlightOfferDto> getOffers(
        ExploreVO spot,
        LocalDate departureDate,
        LocalDate returnDate
    );
}

@Component
class MockFlightOfferProvider implements FlightOfferProvider {
    // spotId와 날짜를 seed로 사용해 같은 입력에 재현 가능한 견적 생성
}`,
          explanation: [
            "supports로 국내 여행지처럼 제공 대상이 아닌 입력을 명시적으로 거릅니다.",
            "외부 provider는 timeout, retry, rate limit, circuit breaker 정책을 경계 안에서 처리합니다.",
          ],
        },
        result: {
          label: "대표 견적 결과",
          output: `ICN → NRT | 2026-08-10 ~ 2026-08-15
TripTogether Air  412,000원
Korean Air        440,000원
Asiana Airlines   457,000원
같은 spotId+날짜 입력은 같은 가격 범위를 재현`,
        },
        tip: "Mock이 실제 provider와 다른 DTO나 예외를 사용하면 교체 시점에 문제가 드러납니다. 같은 contract test를 모든 구현체에 적용하세요.",
      },
      {
        id: "transaction-invariants",
        title: "3. 구매는 여러 변경이 아니라 하나의 업무 원자성이다",
        paragraphs: [
          "항공권 구매는 견적 재확인, 할인 적용, 캐시·마일리지 합계 검증, 잔액 차감, 결제 이력, 자산 이력, 예매 생성이 모두 성공해야 완료됩니다. 하나라도 실패하면 이전 변경을 rollback해야 합니다.",
          "클라이언트가 보낸 가격을 믿지 않고 서버에서 같은 offerId와 날짜로 견적을 다시 조회합니다. 잔액 row는 for update로 잠가 동시 결제가 같은 돈을 두 번 쓰지 못하게 합니다.",
        ],
        code: {
          language: "java",
          label: "구매 서비스의 핵심 불변식",
          code: `@Transactional
public FlightPurchaseResult purchase(Long userId, PurchaseRequest request) {
    FlightOffer offer = provider.getOffer(request.offerId(), request.dates())
        .orElseThrow(() -> new IllegalArgumentException("견적 없음"));

    UserWallet wallet = walletMapper.selectForUpdate(userId);
    long finalPrice = applyMemberDiscount(offer, wallet.grade());

    require(request.cash() + request.mileage() == finalPrice);
    require(request.mileage() <= floorToThousand(finalPrice * 30 / 100));
    require(wallet.canPay(request.cash(), request.mileage()));

    walletMapper.debit(...);
    paymentMapper.insertCompleted(...);
    walletHistoryMapper.insertUsage(...);
    return flightMapper.insertPurchase(...);
}`,
          explanation: [
            "cash+mileage=최종가, mileage≤30%, 잔액 충분이라는 불변식을 DB 쓰기 전에 확인합니다.",
            "결제·지갑·예매 이력은 같은 transaction 안에 있어 중간 실패 시 함께 되돌아갑니다.",
          ],
        },
        result: {
          label: "대표 구매 결과",
          output: `purchaseNo: FLT-7A12C4E9D0B34420
finalPrice: 412000
usedCash: 312000
usedMileage: 100000
cashBalance: 188000
mileageBalance: 25000
paymentStatus: COMPLETED`,
        },
        tip: "외부 결제 승인까지 포함하면 DB transaction만으로 원자성을 만들 수 없습니다. READY 주문, idempotency key, 보상 처리와 webhook 재시도를 설계하세요.",
      },
      {
        id: "states-history-policy",
        title: "4. 현재 상태, 변경 요청, 이력을 분리한다",
        paragraphs: [
          "승인된 여행 패키지를 판매자가 수정할 때 원본을 즉시 덮어쓰면 검토 전 내용이 사용자에게 노출됩니다. TripTogether는 APPROVED 원본을 유지하고 별도 revision에 수정 요청을 저장한 뒤 관리자가 승인할 때 반영합니다.",
          "지갑과 보상도 현재 잔액만 저장하지 않고 변화 이력을 남깁니다. 상태 스냅샷은 빠른 조회에, 이력은 감사·복구·분쟁 해결에 사용됩니다.",
        ],
        code: {
          language: "text",
          label: "패키지 승인과 수정 요청 상태",
          code: `새 패키지:
DRAFT → PENDING → APPROVED
                └→ REJECTED

승인된 패키지 수정:
TRAVEL_PACKAGE(APPROVED)는 계속 공개
  └→ TRAVEL_PACKAGE_REVISION(PENDING)
        ├→ APPROVED: 원본에 반영 + 이력 기록
        └→ REJECTED: 원본 유지 + 반려 사유 기록`,
          explanation: [
            "현재 공개본과 검토 중 후보를 분리해 사용자가 보는 안정된 상태를 보장합니다.",
            "상태 변경 API는 허용된 이전 상태, actor 권한, version을 확인해야 합니다.",
          ],
        },
        result: {
          label: "운영 결과 예시",
          output: `public package version: v3 APPROVED
seller revision: v4 PENDING
admin decision: REJECTED (가격 근거 보완 필요)
public users still see: v3`,
        },
      },
      {
        id: "collaboration-contracts",
        title: "5. ADR·계약 테스트·관찰 가능성으로 팀의 기억을 코드 밖에도 남긴다",
        paragraphs: [
          "팀이 커질수록 왜 이런 상태와 제약을 선택했는지가 사라집니다. ADR(Architecture Decision Record)은 배경, 고려한 선택지, 결정, 결과를 짧게 기록해 같은 논의를 반복하지 않게 합니다.",
          "인터페이스만으로는 의미 계약이 충분하지 않습니다. Provider contract test, Service 불변식 테스트, Mapper 통합 테스트, 사용자 시나리오 테스트를 계층별로 두고 로그에는 correlation ID와 업무 ID를 남겨 문제를 추적합니다.",
        ],
        code: {
          language: "text",
          label: "협업 변경 절차 예시",
          code: `1. 변경 제안: mileage 상한 30% → 등급별 정책
2. ADR: 배경·대안·결정·마이그레이션·rollback 기록
3. 계약 갱신: WalletPolicy DTO + Flight/Package 소비자 테스트
4. DB migration: 새 정책 version과 effective_from 추가
5. feature flag로 읽기 경로 전환
6. 지표 확인: 결제 실패율·할인액·지연시간
7. 안정화 뒤 이전 정책 코드 제거`,
          explanation: [
            "공통 정책 변경은 생산자와 모든 소비자를 같은 체크리스트에 올립니다.",
            "정책 version과 적용 시점을 저장하면 과거 결제의 계산 근거를 재현할 수 있습니다.",
          ],
        },
        bullets: [
          "ADR status는 Proposed → Accepted 또는 Superseded로 관리합니다.",
          "서비스 오류를 문자열 하나로 던지기보다 안정된 error code와 사용자 메시지를 분리합니다.",
          "재시도 가능한 외부 오류와 사용자 입력 오류를 구분합니다.",
          "로그에 비밀값·결제키·개인정보 원문을 남기지 않습니다.",
          "도메인별 소유자와 공통 파일 변경 승인 규칙을 문서화합니다.",
        ],
        tip: "공유 테이블을 여러 모듈이 직접 업데이트하면 책임이 사라집니다. 소유 서비스 한 곳을 통해 변경하고 필요한 경우 event/outbox로 다른 도메인에 알리세요.",
      },
    ],
    checkpoints: [
      "TripTogether의 주요 도메인과 각 도메인이 소유할 데이터를 구분할 수 있다.",
      "Mock과 실제 외부 API가 공유할 Provider 계약을 설계할 수 있다.",
      "구매·환불에서 지켜야 할 불변식과 transaction 경계를 설명할 수 있다.",
      "현재 상태, 수정 요청, 변경 이력을 별도 모델로 나눌 수 있다.",
      "여러 팀이 건드리는 정책 변경을 ADR과 contract test로 관리할 수 있다.",
    ],
    related: ["lcb-legacy-modernization", "career-tuner-architecture", "langchain-rag-pipeline"],
    sources: [
      {
        label: "TripTogether 공개 포트폴리오",
        repository: "https://github.com/notetester/TripTogetherPortfolio",
        path: "README.md",
        note: "공개 dev 브랜치의 도메인·상태·DB·테스트 구조 설명",
      },
      {
        label: "항공 견적 Provider 계약",
        repository: "https://github.com/notetester/TripTogetherPortfolio",
        path: "src/main/java/org/triptogether/flight/provider/FlightOfferProvider.java",
      },
      {
        label: "항공권 구매 트랜잭션",
        repository: "https://github.com/notetester/TripTogetherPortfolio",
        path: "src/main/java/org/triptogether/flight/service/FlightServiceImpl.java",
      },
      {
        label: "아키텍처 결정 기록 인덱스",
        repository: "https://github.com/notetester/TripTogetherPortfolio",
        path: "docs/adr/README.md",
        note: "신고·보안·정책·테스트 결정을 MADR 형식으로 관리",
      },
    ],
  },
];
