import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-015",
  "slug": "dl-015",
  "courseId": "deep-learning",
  "moduleId": "dl-training",
  "order": 5,
  "title": "EarlyStopping·ModelCheckpoint",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "callback",
    "early stopping",
    "checkpoint"
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
    "최적 epoch 19가 출력되고 best-model.keras 계열 파일이 저장돼 있다.",
    "원본 예제 의도: EarlyStopping(patience=3,restore_best_weights=True)"
  ],
  "expertNotes": [
    "monitor·mode·patience와 restore_best_weights를 명시한다."
  ],
  "prerequisiteSlugs": [
    "dl-014"
  ],
  "nextSlug": "dl-016"
});
