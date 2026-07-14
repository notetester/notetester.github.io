import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-036",
  "slug": "dl-036",
  "courseId": "deep-learning",
  "moduleId": "dl-sequence-nlp",
  "order": 4,
  "title": "Embedding 학습과 의미 공간",
  "level": "중급",
  "estimatedMinutes": 60,
  "concepts": [
    "Embedding",
    "vocabulary",
    "dense representation"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex11_IMDB 리뷰 분류.ipynb",
      "lines": 1335,
      "bytes": 797118,
      "sha256": "5320623CA1BEEFF5B4E6F0FBD714110BCDFCBD17D86A93B2044C4EA0092BC2BF"
    },
    {
      "repository": "D:/dev/2026-DL",
      "path": "best-embedding-model.keras",
      "lines": 6233,
      "bytes": 1951842,
      "sha256": "0C2AD829E2EF434183DE8425039D03EDF00DD9E4161BBE3635C0DBFB15BF6615"
    }
  ],
  "sourceNotes": [
    "어휘 500/1000 embedding 모델과 검증 곡선·실전 예측이 있다.",
    "원본 예제 의도: Embedding(input_dim=1000,output_dim=16,input_length=100)"
  ],
  "expertNotes": [
    "embedding 유사도가 곧 의미·공정성을 보장하지 않는다."
  ],
  "prerequisiteSlugs": [
    "dl-035"
  ],
  "nextSlug": "dl-037"
});
