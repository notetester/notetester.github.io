import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-034",
  "slug": "dl-034",
  "courseId": "deep-learning",
  "moduleId": "dl-sequence-nlp",
  "order": 2,
  "title": "IMDB 토큰·길이 분포·padding",
  "level": "중급",
  "estimatedMinutes": 60,
  "concepts": [
    "tokenization",
    "sequence length",
    "pad_sequences"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex11_IMDB 리뷰 분류.ipynb",
      "lines": 1335,
      "bytes": 797118,
      "sha256": "5320623CA1BEEFF5B4E6F0FBD714110BCDFCBD17D86A93B2044C4EA0092BC2BF"
    }
  ],
  "sourceNotes": [
    "25,000개 리뷰, 평균 길이 239.0/중앙값 178, padded shape (20000,100)이 출력된다.",
    "원본 예제 의도: X=pad_sequences(train_seq,maxlen=100)"
  ],
  "expertNotes": [
    "maxlen은 분포와 계산 비용을 보고 결정하며 truncating 방향을 기록한다."
  ],
  "prerequisiteSlugs": [
    "dl-033"
  ],
  "nextSlug": "dl-035"
});
