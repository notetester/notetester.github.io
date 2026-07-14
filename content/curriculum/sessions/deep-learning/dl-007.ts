import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-007",
  "slug": "dl-007",
  "courseId": "deep-learning",
  "moduleId": "dl-ann-dnn",
  "order": 7,
  "title": "은닉층과 DNN의 비선형성",
  "level": "기초",
  "estimatedMinutes": 50,
  "concepts": [
    "DNN",
    "hidden layer",
    "nonlinearity"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex02_심층신경망(DNN).ipynb",
      "lines": 1092,
      "bytes": 552776,
      "sha256": "17FB8F8BB1AC5C6DE4B30FAD78BB1E029B0B9F8E19566A0622EF8906A3099DFB"
    }
  ],
  "sourceNotes": [
    "5 epoch 훈련과 검증 정확도 약 0.8695가 저장돼 있다.",
    "원본 예제 의도: Dense(100,activation='sigmoid'), Dense(10,activation='softmax')"
  ],
  "expertNotes": [
    "활성화가 없으면 여러 Dense도 하나의 선형 변환과 같다."
  ],
  "prerequisiteSlugs": [
    "dl-006"
  ],
  "nextSlug": "dl-008"
});
