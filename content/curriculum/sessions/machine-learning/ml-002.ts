import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-002",
  "slug": "ml-002",
  "courseId": "machine-learning",
  "moduleId": "ml-framing-knn",
  "order": 2,
  "title": "문제 유형·타깃·평가지표 먼저 정하기",
  "level": "입문",
  "estimatedMinutes": 40,
  "concepts": [
    "problem framing",
    "target",
    "metric"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex00_AI_ML_DL.ipynb",
      "lines": 154,
      "bytes": 373679,
      "sha256": "AEC11AC841662FFEE3273EF98E017849AC363F1526E7D1734B6FD6BEAB87D72C"
    }
  ],
  "sourceNotes": [
    "원본은 문제 유형 목록을 제공하지만 실제 요구사항에서 지표를 고르는 실습은 없다.",
    "원본 예제 의도: task='regression' if y.dtype.kind in 'fc' else 'classification'"
  ],
  "expertNotes": [
    "모델보다 실패 비용과 의사결정 기준을 먼저 고른다."
  ],
  "prerequisiteSlugs": [
    "ml-001"
  ],
  "nextSlug": "ml-003"
});
