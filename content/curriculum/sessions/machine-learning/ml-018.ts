import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-018",
  "slug": "ml-018",
  "courseId": "machine-learning",
  "moduleId": "ml-regression-features",
  "order": 6,
  "title": "Lasso와 희소 계수",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "Lasso",
    "L1",
    "feature selection"
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
    "alpha가 커질수록 계수가 0이 되고 10을 넘으며 급격히 성능이 변하는 곡선이 있다.",
    "원본 예제 의도: lasso=Lasso(alpha=10).fit(X_s,y)\nprint(np.sum(lasso.coef_==0))"
  ],
  "expertNotes": [
    "상관된 특성에서 Lasso 선택은 불안정할 수 있다."
  ],
  "prerequisiteSlugs": [
    "ml-017"
  ],
  "nextSlug": "ml-019"
});
