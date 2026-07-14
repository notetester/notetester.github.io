import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-006",
  "slug": "dl-006",
  "courseId": "deep-learning",
  "moduleId": "dl-ann-dnn",
  "order": 6,
  "title": "선형 기준선과 신경망 비교",
  "level": "기초",
  "estimatedMinutes": 45,
  "concepts": [
    "baseline",
    "SGDClassifier",
    "generalization"
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
    "선형 기준선 약 0.81945와 ANN 약 0.83115가 비교된다.",
    "원본 예제 의도: baseline=SGDClassifier(loss='log_loss').fit(X,y)"
  ],
  "expertNotes": [
    "복잡한 모델은 단순 기준선보다 의미 있게 나을 때 채택한다."
  ],
  "prerequisiteSlugs": [
    "dl-005"
  ],
  "nextSlug": "dl-007"
});
