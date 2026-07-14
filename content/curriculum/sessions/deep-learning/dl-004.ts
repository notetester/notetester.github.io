import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-004",
  "slug": "dl-004",
  "courseId": "deep-learning",
  "moduleId": "dl-ann-dnn",
  "order": 4,
  "title": "픽셀 정규화와 Flatten",
  "level": "기초",
  "estimatedMinutes": 45,
  "concepts": [
    "normalization",
    "Flatten",
    "feature vector"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex01_인공신경망(ANN).ipynb",
      "lines": 727,
      "bytes": 780733,
      "sha256": "7E9C6E0B0A2787F54DD8D6D94B86B499093AE8550158A4B110EABC6FFA6EC7C6"
    }
  ],
  "sourceNotes": [
    "평탄화 결과 shape (60000,784)가 출력된다.",
    "원본 예제 의도: X=train_X.reshape(-1,784)/255.0"
  ],
  "expertNotes": [
    "표준화와 평탄화는 서로 다른 변환이므로 원본 용어 혼동을 교정한다."
  ],
  "prerequisiteSlugs": [
    "dl-003"
  ],
  "nextSlug": "dl-005"
});
