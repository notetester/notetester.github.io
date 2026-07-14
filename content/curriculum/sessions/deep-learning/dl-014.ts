import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-014",
  "slug": "dl-014",
  "courseId": "deep-learning",
  "moduleId": "dl-training",
  "order": 4,
  "title": "Dropout 정규화",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "Dropout",
    "regularization",
    "train/eval mode"
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
    "Dropout 적용 모델의 요약과 검증 곡선이 있다.",
    "원본 예제 의도: model.add(keras.layers.Dropout(0.3))"
  ],
  "expertNotes": [
    "추론 때 Dropout이 비활성화되고 스케일이 보정되는 이유를 설명한다."
  ],
  "prerequisiteSlugs": [
    "dl-013"
  ],
  "nextSlug": "dl-015"
});
