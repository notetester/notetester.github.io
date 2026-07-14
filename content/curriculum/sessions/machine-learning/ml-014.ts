import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-014",
  "slug": "ml-014",
  "courseId": "machine-learning",
  "moduleId": "ml-regression-features",
  "order": 2,
  "title": "다항회귀와 비선형 관계",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "polynomial feature",
    "underfitting",
    "curve"
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
    "2차식 무게 = 1.01×길이²-21.6×길이+1160.5가 노트에 기록돼 있다.",
    "원본 예제 의도: X2=np.column_stack((X**2,X))\nlr.fit(X2,y)"
  ],
  "expertNotes": [
    "다항 차수는 검증으로 고르고 그래프 모양만으로 정하지 않는다."
  ],
  "prerequisiteSlugs": [
    "ml-013"
  ],
  "nextSlug": "ml-015"
});
