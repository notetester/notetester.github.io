import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-012",
  "slug": "dl-012",
  "courseId": "deep-learning",
  "moduleId": "dl-training",
  "order": 2,
  "title": "epoch와 과대적합 진단",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "epoch",
    "overfitting",
    "generalization gap"
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
    "훈련 손실은 감소하지만 검증 손실이 다시 증가하는 전형적 그림이 있다.",
    "원본 예제 의도: plt.plot(history.history['loss']); plt.plot(history.history['val_loss'])"
  ],
  "expertNotes": [
    "테스트가 아닌 검증 손실로 학습 중단 시점을 고른다."
  ],
  "prerequisiteSlugs": [
    "dl-011"
  ],
  "nextSlug": "dl-013"
});
