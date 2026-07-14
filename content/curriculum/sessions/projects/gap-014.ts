import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "gap-014",
  "slug": "gap-014",
  "courseId": "projects",
  "moduleId": "gap-data-ai-production",
  "order": 5,
  "title": "DL 재현성·mixed precision·분산학습·배포",
  "level": "전문가",
  "estimatedMinutes": 130,
  "concepts": [
    "mixed precision",
    "distributed training",
    "serving",
    "reproducibility"
  ],
  "localSources": [],
  "sourceNotes": [
    "원본은 로컬 CPU 훈련·모델 저장까지이며 serving/분산/성능 테스트가 없다.",
    "원본 예제 의도: tf.keras.mixed_precision.set_global_policy('mixed_float16')"
  ],
  "expertNotes": [
    "GAP: saved model API, latency, batching, rollback을 포함한다."
  ],
  "prerequisiteSlugs": [
    "gap-013"
  ],
  "nextSlug": "gap-015"
});
