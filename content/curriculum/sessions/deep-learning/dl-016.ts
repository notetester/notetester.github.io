import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-016",
  "slug": "dl-016",
  "courseId": "deep-learning",
  "moduleId": "dl-training",
  "order": 6,
  "title": "모델·가중치 저장과 복원",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "serialization",
    "weights",
    "model reload"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex03_신경망모델훈련.ipynb",
      "lines": 1143,
      "bytes": 712866,
      "sha256": "B8143BB1939E0C400968E4B9F5163265BE677E52A775E70C9D0A5A88B002C298"
    },
    {
      "repository": "D:/dev/2026-DL",
      "path": "best-model.keras",
      "lines": 3099,
      "bytes": 979478,
      "sha256": "5602C3DFF67439E18F82AF540B0D9F5A43A1E259DDD236EC6C3D2ACA9EAA085F"
    },
    {
      "repository": "D:/dev/2026-DL",
      "path": "model_sample2.weights.h5",
      "lines": 3069,
      "bytes": 976600,
      "sha256": "A0406777C56579A290E41586BD0A59DBE00F8DB976BC94C0C799AC971010D90B"
    }
  ],
  "sourceNotes": [
    "복원 모델 정확도 0.8803333, 샘플 8을 확률 0.999998로 예측한 결과가 있다.",
    "원본 예제 의도: model.save('model.keras'); restored=keras.models.load_model('model.keras')"
  ],
  "expertNotes": [
    "코드·전처리·라벨맵·라이브러리 버전도 모델과 함께 버전화한다."
  ],
  "prerequisiteSlugs": [
    "dl-015"
  ],
  "nextSlug": "dl-017"
});
