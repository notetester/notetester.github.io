import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-038",
  "slug": "dl-038",
  "courseId": "deep-learning",
  "moduleId": "dl-sequence-nlp",
  "order": 6,
  "title": "한국어 BiGRU 감성분류",
  "level": "고급",
  "estimatedMinutes": 70,
  "concepts": [
    "Bidirectional GRU",
    "sentiment",
    "checkpoint"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex12_네이버영화리뷰.ipynb",
      "lines": 687,
      "bytes": 33402,
      "sha256": "27916648EFDDD0C4FDFD166426BDAC05F65A3CFF1266CE15935A61831B4E6ABC"
    },
    {
      "repository": "D:/dev/2026-DL",
      "path": "nsmc_biGRU_whitespace.keras",
      "lines": 52316,
      "bytes": 16104736,
      "sha256": "0944001CD4D39BEE19C1CAE4D6DF3854BDAB74D3413C4B5E1BC7FD5AD4B93F56"
    }
  ],
  "sourceNotes": [
    "8 epoch 학습에서 첫 검증 정확도 약 0.8052와 학습률 기록이 있다.",
    "원본 예제 의도: Bidirectional(GRU(64,dropout=.2))"
  ],
  "expertNotes": [
    "정확도 외에 클래스별 F1·calibration·오류 사례가 필요하다."
  ],
  "prerequisiteSlugs": [
    "dl-037"
  ],
  "nextSlug": "dl-039"
});
