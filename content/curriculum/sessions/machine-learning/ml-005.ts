import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-005",
  "slug": "ml-005",
  "courseId": "machine-learning",
  "moduleId": "ml-framing-knn",
  "order": 5,
  "title": "fit·predict·score와 k 선택",
  "level": "기초",
  "estimatedMinutes": 50,
  "concepts": [
    "fit",
    "predict",
    "accuracy",
    "hyperparameter"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex01_k_최근접이웃알고리즘.ipynb",
      "lines": 381,
      "bytes": 87129,
      "sha256": "8BB0197CB8EA18D1B6C64151821017D20B8E26629A2D7550364FF248B95343C6"
    }
  ],
  "sourceNotes": [
    "기본 k는 훈련 정확도 1.0, k=49는 0.7142857이며 새 샘플은 도미로 예측됐다.",
    "원본 예제 의도: kn=KNeighborsClassifier(n_neighbors=5).fit(X,y)\nprint(kn.predict([[30,600]]))"
  ],
  "expertNotes": [
    "훈련 점수만으로 k를 고르면 일반화 성능을 알 수 없다."
  ],
  "prerequisiteSlugs": [
    "ml-004"
  ],
  "nextSlug": "ml-006"
});
