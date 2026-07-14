import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-015",
  "slug": "ml-015",
  "courseId": "machine-learning",
  "moduleId": "ml-regression-features",
  "order": 3,
  "title": "다중회귀와 특성공학",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "multiple regression",
    "feature engineering",
    "interaction"
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
    "길이·높이·두께와 교호작용 특성이 확장된 shape/이름으로 출력된다.",
    "원본 예제 의도: poly=PolynomialFeatures(include_bias=False)\nX_poly=poly.fit_transform(X)"
  ],
  "expertNotes": [
    "특성 수가 샘플 수에 비해 커지면 분산과 누수 위험이 커진다."
  ],
  "prerequisiteSlugs": [
    "ml-014"
  ],
  "nextSlug": "ml-016"
});
