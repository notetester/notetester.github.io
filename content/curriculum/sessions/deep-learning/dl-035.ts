import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-035",
  "slug": "dl-035",
  "courseId": "deep-learning",
  "moduleId": "dl-sequence-nlp",
  "order": 3,
  "title": "원-핫 시퀀스와 SimpleRNN",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "one-hot",
    "SimpleRNN",
    "sparsity"
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
    "원-핫의 메모리 낭비와 희소성, SimpleRNN 훈련 결과가 있다.",
    "원본 예제 의도: onehot=to_categorical(X,num_classes=500)"
  ],
  "expertNotes": [
    "대규모 어휘에는 원-핫 대신 embedding을 쓴다."
  ],
  "prerequisiteSlugs": [
    "dl-034"
  ],
  "nextSlug": "dl-036"
});
