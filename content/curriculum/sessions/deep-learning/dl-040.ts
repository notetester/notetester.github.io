import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-040",
  "slug": "dl-040",
  "courseId": "deep-learning",
  "moduleId": "dl-sequence-nlp",
  "order": 8,
  "title": "쇼핑 BiGRU 추론·아티팩트 재현성",
  "level": "고급",
  "estimatedMinutes": 75,
  "concepts": [
    "BiGRU",
    "inference",
    "artifact versioning"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex13_네이버 쇼핑 리뷰.ipynb",
      "lines": 532,
      "bytes": 26724,
      "sha256": "CB38CB4CCFF153900A9FCBA8A8D6C2235E9BD52130083DBCAAC9E37A61BFD0D4"
    },
    {
      "repository": "D:/dev/2026-DL",
      "path": "ko_sentiment_biGRU_whit.keras",
      "lines": 78487,
      "bytes": 23784739,
      "sha256": "255C3BCECD4FFF9E47510729B45A6A22DCA8B73E890CAF811E55B50116012464"
    }
  ],
  "sourceNotes": [
    "5개 실전 문장에서 긍정 0.978·0.740·0.984와 부정 0.000 결과가 저장돼 있다.",
    "원본 예제 의도: p=float(model.predict(seq)[0,0]); label='긍정' if p>=.5 else '부정'"
  ],
  "expertNotes": [
    "모델·토크나이저·maxlen·임계값·라벨 방향을 하나의 배포 번들로 관리한다."
  ],
  "prerequisiteSlugs": [
    "dl-039"
  ],
  "nextSlug": "rag-001"
});
