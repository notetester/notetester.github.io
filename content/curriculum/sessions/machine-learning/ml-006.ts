import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-006",
  "slug": "ml-006",
  "courseId": "machine-learning",
  "moduleId": "ml-framing-knn",
  "order": 6,
  "title": "훈련·테스트 분리와 샘플링 편향",
  "level": "기초",
  "estimatedMinutes": 50,
  "concepts": [
    "train set",
    "test set",
    "sampling bias"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex02_훈련세트와 데이터세트.ipynb",
      "lines": 384,
      "bytes": 31598,
      "sha256": "1F4BA55BBB65EBA9F3EF50D51083957AABFD1530D791F836C25DFCD067B9864D"
    }
  ],
  "sourceNotes": [
    "순서대로 자른 테스트 정확도가 0.0으로 저장되어 샘플링 편향을 증명한다.",
    "원본 예제 의도: train_X=X[:35]; test_X=X[35:]"
  ],
  "expertNotes": [
    "테스트 세트는 최종 평가 전에 절대 학습 의사결정에 사용하지 않는다."
  ],
  "prerequisiteSlugs": [
    "ml-005"
  ],
  "nextSlug": "ml-007"
});
