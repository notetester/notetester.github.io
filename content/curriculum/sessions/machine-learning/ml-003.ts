import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-003",
  "slug": "ml-003",
  "courseId": "machine-learning",
  "moduleId": "ml-framing-knn",
  "order": 3,
  "title": "산점도와 KNN 직관",
  "level": "입문",
  "estimatedMinutes": 45,
  "concepts": [
    "KNN",
    "distance",
    "scatter plot"
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
    "도미는 우측 상단, 빙어는 좌측 하단으로 분리된 저장 그림이 있다.",
    "원본 예제 의도: plt.scatter(bream_length,bream_weight)\nplt.scatter(smelt_length,smelt_weight)"
  ],
  "expertNotes": [
    "거리 기반 모델은 축 스케일과 차원의 저주에 민감하다."
  ],
  "prerequisiteSlugs": [
    "ml-002"
  ],
  "nextSlug": "ml-004"
});
