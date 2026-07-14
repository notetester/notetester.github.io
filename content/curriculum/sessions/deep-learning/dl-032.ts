import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-032",
  "slug": "dl-032",
  "courseId": "deep-learning",
  "moduleId": "dl-transfer",
  "order": 5,
  "title": "부분 동결 해제와 작은 학습률",
  "level": "고급",
  "estimatedMinutes": 65,
  "concepts": [
    "unfreeze",
    "fine-tuning",
    "small learning rate"
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
      "path": "best-mobilenet-finetune.keras",
      "lines": 70292,
      "bytes": 22008602,
      "sha256": "105510DE007160CF31199B15884BF1181D0F95E03E72877B50BABB718A04DA7E"
    }
  ],
  "sourceNotes": [
    "전체 154층 중 마지막 30개 해제, 나머지 124개 동결과 파인튜닝 곡선이 있다.",
    "원본 예제 의도: base.trainable=True\nfor layer in base.layers[:-30]: layer.trainable=False"
  ],
  "expertNotes": [
    "큰 학습률은 사전학습 표현을 파괴하는 catastrophic forgetting을 만든다."
  ],
  "prerequisiteSlugs": [
    "dl-031"
  ],
  "nextSlug": "dl-033"
});
