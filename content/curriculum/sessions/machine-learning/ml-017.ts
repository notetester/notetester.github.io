import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-017",
  "slug": "ml-017",
  "courseId": "machine-learning",
  "moduleId": "ml-regression-features",
  "order": 5,
  "title": "Ridge와 alpha 곡선",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "Ridge",
    "L2",
    "alpha"
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
    "alpha별 훈련/테스트 점수 곡선에서 약 0.1이 적절하다는 해석이 있다.",
    "원본 예제 의도: ridge=Ridge(alpha=.1).fit(X_s,y)"
  ],
  "expertNotes": [
    "alpha 탐색은 로그 스케일과 교차검증을 사용한다."
  ],
  "prerequisiteSlugs": [
    "ml-016"
  ],
  "nextSlug": "ml-018"
});
