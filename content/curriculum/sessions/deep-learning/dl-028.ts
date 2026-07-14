import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-028",
  "slug": "dl-028",
  "courseId": "deep-learning",
  "moduleId": "dl-transfer",
  "order": 1,
  "title": "전이학습·특성 추출·파인튜닝",
  "level": "고급",
  "estimatedMinutes": 50,
  "concepts": [
    "transfer learning",
    "feature extraction",
    "fine tuning"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex09_전이학습.ipynb",
      "lines": 1039,
      "bytes": 829222,
      "sha256": "1C66209EE14C1F0A4ECDABF26112FBAFC9CCF17584F8B50AAC287A34E6CFD452"
    }
  ],
  "sourceNotes": [
    "두 전략과 MobileNetV2 구조가 상세히 설명돼 있다.",
    "원본 예제 의도: base=MobileNetV2(include_top=False,weights='imagenet'); base.trainable=False"
  ],
  "expertNotes": [
    "원본/목표 도메인 차이가 크면 전이 효과가 낮을 수 있다."
  ],
  "prerequisiteSlugs": [
    "dl-027"
  ],
  "nextSlug": "dl-029"
});
