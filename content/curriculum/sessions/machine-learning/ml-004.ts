import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-004",
  "slug": "ml-004",
  "courseId": "machine-learning",
  "moduleId": "ml-framing-knn",
  "order": 4,
  "title": "특성 행렬 X와 타깃 y 만들기",
  "level": "입문",
  "estimatedMinutes": 40,
  "concepts": [
    "feature matrix",
    "target",
    "zip"
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
    "49개 생선 데이터와 49개 이진 타깃이 그대로 출력돼 있다.",
    "원본 예제 의도: X=[[l,w] for l,w in zip(length,weight)]\ny=[1]*35+[0]*14"
  ],
  "expertNotes": [
    "행·열 의미와 shape를 항상 문서화한다."
  ],
  "prerequisiteSlugs": [
    "ml-003"
  ],
  "nextSlug": "ml-005"
});
