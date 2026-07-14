import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-013",
  "slug": "dl-013",
  "courseId": "deep-learning",
  "moduleId": "dl-training",
  "order": 3,
  "title": "Adam과 적응적 학습률",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "Adam",
    "adaptive learning rate",
    "convergence"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex03_신경망모델훈련.ipynb",
      "lines": 1143,
      "bytes": 712866,
      "sha256": "B8143BB1939E0C400968E4B9F5163265BE677E52A775E70C9D0A5A88B002C298"
    }
  ],
  "sourceNotes": [
    "SGD 계열과 Adam의 학습 곡선 비교가 저장돼 있다.",
    "원본 예제 의도: keras.optimizers.Adam(learning_rate=1e-3)"
  ],
  "expertNotes": [
    "Adam이 항상 더 좋은 일반화를 보장하지 않으며 learning-rate sweep이 필요하다."
  ],
  "prerequisiteSlugs": [
    "dl-012"
  ],
  "nextSlug": "dl-014"
});
