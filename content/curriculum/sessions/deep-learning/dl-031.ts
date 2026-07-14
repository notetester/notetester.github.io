import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-031",
  "slug": "dl-031",
  "courseId": "deep-learning",
  "moduleId": "dl-transfer",
  "order": 4,
  "title": "동결 분류기 학습",
  "level": "고급",
  "estimatedMinutes": 60,
  "concepts": [
    "frozen backbone",
    "classifier head",
    "global average pooling"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex09_전이학습.ipynb",
      "lines": 1039,
      "bytes": 829222,
      "sha256": "1C66209EE14C1F0A4ECDABF26112FBAFC9CCF17584F8B50AAC287A34E6CFD452"
    },
    {
      "repository": "D:/dev/2026-DL",
      "path": "best-mobilenet-feature.keras",
      "lines": 30000,
      "bytes": 9774473,
      "sha256": "EE0B0B5ACFA77AFAA395E17B1832E43294AF66AD596C87A8201EFA8CD62D5989"
    }
  ],
  "sourceNotes": [
    "1단계 테스트 정확도 0.8605와 feature extraction 학습 곡선이 있다.",
    "원본 예제 의도: model=Sequential([base,GlobalAveragePooling2D(),Dropout(.2),Dense(10,activation='softmax')])"
  ],
  "expertNotes": [
    "BatchNorm 층의 training 모드는 동결/파인튜닝 때 특별히 주의한다."
  ],
  "prerequisiteSlugs": [
    "dl-030"
  ],
  "nextSlug": "dl-032"
});
