import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-008",
  "slug": "dl-008",
  "courseId": "deep-learning",
  "moduleId": "dl-ann-dnn",
  "order": 8,
  "title": "sigmoid·tanh·ReLU 활성화",
  "level": "기초",
  "estimatedMinutes": 50,
  "concepts": [
    "activation",
    "sigmoid",
    "ReLU"
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
    "sigmoid 모델과 ReLU+Flatten 모델의 구성·훈련 결과가 있다.",
    "원본 예제 의도: keras.layers.Dense(100,activation='relu')"
  ],
  "expertNotes": [
    "기울기 소실·dead ReLU를 수식과 gradient histogram으로 보강한다."
  ],
  "prerequisiteSlugs": [
    "dl-007"
  ],
  "nextSlug": "dl-009"
});
