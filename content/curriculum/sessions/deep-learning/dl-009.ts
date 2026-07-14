import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-009",
  "slug": "dl-009",
  "courseId": "deep-learning",
  "moduleId": "dl-ann-dnn",
  "order": 9,
  "title": "Sequential 구성 방식과 model.summary",
  "level": "기초",
  "estimatedMinutes": 45,
  "concepts": [
    "Sequential",
    "layer",
    "parameter count"
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
    "여러 모델 요약표에 층별 output shape와 파라미터 수가 저장돼 있다.",
    "원본 예제 의도: model=keras.Sequential(name='패션 MNIST 모델'); model.add(Flatten()); model.summary()"
  ],
  "expertNotes": [
    "파라미터 수를 직접 계산해 summary와 맞추는 연습을 한다."
  ],
  "prerequisiteSlugs": [
    "dl-008"
  ],
  "nextSlug": "dl-010"
});
