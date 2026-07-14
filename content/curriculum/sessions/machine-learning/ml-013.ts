import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-013",
  "slug": "ml-013",
  "courseId": "machine-learning",
  "moduleId": "ml-regression-features",
  "order": 1,
  "title": "단순 선형회귀와 계수",
  "level": "기초",
  "estimatedMinutes": 50,
  "concepts": [
    "LinearRegression",
    "coefficient",
    "intercept"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex06_선형회귀.ipynb",
      "lines": 1760,
      "bytes": 300456,
      "sha256": "77CD81D6BD61832F0F711758027378EDC7A6A5850B421E30F07D6D2B7CB196EF"
    }
  ],
  "sourceNotes": [
    "회귀선·기울기·절편과 훈련/테스트 R²가 출력·시각화돼 있다.",
    "원본 예제 의도: lr=LinearRegression().fit(X,y)\nprint(lr.coef_,lr.intercept_)"
  ],
  "expertNotes": [
    "계수 해석은 단위·상관·누락 변수에 의존한다."
  ],
  "prerequisiteSlugs": [
    "ml-012"
  ],
  "nextSlug": "ml-014"
});
