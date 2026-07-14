import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-020",
  "slug": "dl-020",
  "courseId": "deep-learning",
  "moduleId": "dl-cnn",
  "order": 3,
  "title": "padding·stride·출력 크기",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "padding",
    "stride",
    "output shape"
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
    "same/valid와 stride 그림이 저장돼 있으나 수치 shape 실험은 보강할 필요가 있다.",
    "원본 예제 의도: Conv2D(32,3,padding='same',strides=2)"
  ],
  "expertNotes": [
    "출력 크기 공식을 직접 적용해 summary와 검산한다."
  ],
  "prerequisiteSlugs": [
    "dl-019"
  ],
  "nextSlug": "dl-021"
});
