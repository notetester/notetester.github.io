import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-025",
  "slug": "ml-025",
  "courseId": "machine-learning",
  "moduleId": "ml-evaluation-trees",
  "order": 1,
  "title": "결정트리·Gini·분기 읽기",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "DecisionTree",
    "Gini",
    "tree plot"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex13_결정 트리.ipynb",
      "lines": 480,
      "bytes": 601285,
      "sha256": "8AA39E8EBF061735A62C9339F63702DE39D7C49EB4916039369E7AAE68518CEB"
    }
  ],
  "sourceNotes": [
    "무제한 트리는 훈련 거의 100%, 테스트 약 86%이며 sugar 분기가 시각화된다.",
    "원본 예제 의도: tree=DecisionTreeClassifier(random_state=42).fit(X,y)\nplot_tree(tree)"
  ],
  "expertNotes": [
    "트리는 표준화가 불필요하지만 범주 인코딩·누락값 처리는 별도다."
  ],
  "prerequisiteSlugs": [
    "ml-024"
  ],
  "nextSlug": "ml-026"
});
