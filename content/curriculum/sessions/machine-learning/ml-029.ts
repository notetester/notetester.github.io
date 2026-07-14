import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-029",
  "slug": "ml-029",
  "courseId": "machine-learning",
  "moduleId": "ml-evaluation-trees",
  "order": 5,
  "title": "GridSearchCV·RandomizedSearchCV",
  "level": "고급",
  "estimatedMinutes": 60,
  "concepts": [
    "grid search",
    "random search",
    "hyperparameter"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex14_검증세트.ipynb",
      "lines": 563,
      "bytes": 335482,
      "sha256": "F53217294030CC13DBCD590F567CE28FCDE24E9B5FD1E72290DBA7EAF5D0E25F"
    }
  ],
  "sourceNotes": [
    "최적 파라미터와 최적 교차검증 점수가 저장돼 있다.",
    "원본 예제 의도: search=RandomizedSearchCV(tree,params,n_iter=100,cv=5,random_state=42).fit(X,y)"
  ],
  "expertNotes": [
    "탐색 공간·예산·최종 재학습 절차를 실험 기록에 남긴다."
  ],
  "prerequisiteSlugs": [
    "ml-028"
  ],
  "nextSlug": "ml-030"
});
