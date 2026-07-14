import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-021",
  "slug": "dl-021",
  "courseId": "deep-learning",
  "moduleId": "dl-cnn",
  "order": 4,
  "title": "Pooling과 수용영역",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "MaxPooling",
    "downsampling",
    "receptive field"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex06_합성공 신경망을 이용한 분류.ipynb",
      "lines": 804,
      "bytes": 488537,
      "sha256": "197051E858BCC68902D14A4D13CF1D709E94FF74291D0AF40F7EB0EEF03182E6"
    }
  ],
  "sourceNotes": [
    "Fashion CNN 모델 요약에서 Conv/Pooling을 거친 shape 변화가 저장돼 있다.",
    "원본 예제 의도: MaxPooling2D(2)"
  ],
  "expertNotes": [
    "pooling은 정보 손실과 계산 절감의 trade-off다."
  ],
  "prerequisiteSlugs": [
    "dl-020"
  ],
  "nextSlug": "dl-022"
});
