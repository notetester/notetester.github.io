import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-016",
  "slug": "ml-016",
  "courseId": "machine-learning",
  "moduleId": "ml-regression-features",
  "order": 4,
  "title": "과대적합·규제·표준화 순서",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "overfitting",
    "regularization",
    "scaling"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex07_다중회귀.ipynb",
      "lines": 1010,
      "bytes": 421965,
      "sha256": "E20D9C5754A2CBA93CBF3DDDF7A32D324A15AF1056618E675B3148740B1D3A30"
    }
  ],
  "sourceNotes": [
    "특성을 과도하게 늘린 뒤 훈련 점수만 높아지는 결과와 규제 필요성이 기록돼 있다.",
    "원본 예제 의도: X_s=StandardScaler().fit_transform(X_poly)"
  ],
  "expertNotes": [
    "Pipeline으로 변환과 모델을 묶어 교차검증 누수를 막는 보강이 필요하다."
  ],
  "prerequisiteSlugs": [
    "ml-015"
  ],
  "nextSlug": "ml-017"
});
