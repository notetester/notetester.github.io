import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-018",
  "slug": "dl-018",
  "courseId": "deep-learning",
  "moduleId": "dl-cnn",
  "order": 1,
  "title": "CNN 필요성과 지역 연결",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "CNN",
    "locality",
    "weight sharing"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex05_합성곱신경망(CNN).ipynb",
      "lines": 156,
      "bytes": 596977,
      "sha256": "F737A4138CF909955CF7CD3CA24E4D32A5E90C26AC8DD9D5868FFDBF511BF08C"
    }
  ],
  "sourceNotes": [
    "CNN 필요성·필터·패딩·스트라이드가 설명 그림과 함께 있다.",
    "원본 예제 의도: Conv2D(32,kernel_size=3,activation='relu')"
  ],
  "expertNotes": [
    "Dense 대비 파라미터 절감과 translation equivariance를 연결한다."
  ],
  "prerequisiteSlugs": [
    "dl-017"
  ],
  "nextSlug": "dl-019"
});
