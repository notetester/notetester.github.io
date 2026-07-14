import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-026",
  "slug": "ml-026",
  "courseId": "machine-learning",
  "moduleId": "ml-evaluation-trees",
  "order": 2,
  "title": "가지치기와 특성 중요도",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "max_depth",
    "pruning",
    "feature importance"
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
    "깊이 제한 후 훈련/테스트 격차가 줄고 sugar 중요도가 약 86%로 출력된다.",
    "원본 예제 의도: tree=DecisionTreeClassifier(max_depth=3,random_state=42).fit(X,y)"
  ],
  "expertNotes": [
    "불순도 기반 중요도는 고유값 많은 특성에 편향될 수 있다."
  ],
  "prerequisiteSlugs": [
    "ml-025"
  ],
  "nextSlug": "ml-027"
});
