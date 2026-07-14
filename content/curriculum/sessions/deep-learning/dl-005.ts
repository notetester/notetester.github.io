import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-005",
  "slug": "dl-005",
  "courseId": "deep-learning",
  "moduleId": "dl-ann-dnn",
  "order": 5,
  "title": "Dense·softmax 분류기",
  "level": "기초",
  "estimatedMinutes": 50,
  "concepts": [
    "Dense",
    "softmax",
    "cross entropy"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex01_인공신경망(ANN).ipynb",
      "lines": 727,
      "bytes": 780733,
      "sha256": "7E9C6E0B0A2787F54DD8D6D94B86B499093AE8550158A4B110EABC6FFA6EC7C6"
    }
  ],
  "sourceNotes": [
    "인공신경망 점수 약 0.83115가 저장돼 있다.",
    "원본 예제 의도: model=keras.Sequential([keras.layers.Dense(10,activation='softmax',input_shape=(784,))])"
  ],
  "expertNotes": [
    "다중분류 출력 수는 클래스 수, 손실은 라벨 표현 방식과 맞춘다."
  ],
  "prerequisiteSlugs": [
    "dl-004"
  ],
  "nextSlug": "dl-006"
});
