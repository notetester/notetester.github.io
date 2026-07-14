import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-012",
  "slug": "ml-012",
  "courseId": "machine-learning",
  "moduleId": "ml-framing-knn",
  "order": 12,
  "title": "KNN 회귀의 외삽 한계",
  "level": "기초",
  "estimatedMinutes": 45,
  "concepts": [
    "extrapolation",
    "local model",
    "bias"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex05_k_최근접이웃_회귀.ipynb",
      "lines": 627,
      "bytes": 510407,
      "sha256": "AD6858F01FDA7BD86F086CD0801D0B0031A2FCEF480BA30E57CF8D784421B23D"
    }
  ],
  "sourceNotes": [
    "길이 50·100·150 모두 1033.3333으로 같은 값이 나오는 한계가 저장돼 있다.",
    "원본 예제 의도: print(knr.predict([[50],[100],[150]]))"
  ],
  "expertNotes": [
    "훈련 범위 밖 예측에서는 거리 기반 평균이 추세를 연장하지 못한다."
  ],
  "prerequisiteSlugs": [
    "ml-011"
  ],
  "nextSlug": "ml-013"
});
