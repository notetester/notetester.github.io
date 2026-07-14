import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-009",
  "slug": "ml-009",
  "courseId": "machine-learning",
  "moduleId": "ml-framing-knn",
  "order": 9,
  "title": "kneighbors로 예측 근거 시각화",
  "level": "기초",
  "estimatedMinutes": 45,
  "concepts": [
    "nearest neighbors",
    "distance",
    "diagnostics"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex03_데이터 전처리.ipynb",
      "lines": 1047,
      "bytes": 116856,
      "sha256": "483430D15AA842FF2D9AD6BF71A277A87CE8A183227C05788AA20104395E7618"
    }
  ],
  "sourceNotes": [
    "표준화 전 이웃의 실제 좌표·타깃·거리가 출력되고 표준화 후 이웃 그림이 저장돼 있다.",
    "원본 예제 의도: dist,idx=kn.kneighbors([new_scaled],n_neighbors=5)"
  ],
  "expertNotes": [
    "이웃 근거는 국소 설명이지만 인과 설명은 아니다."
  ],
  "prerequisiteSlugs": [
    "ml-008"
  ],
  "nextSlug": "ml-010"
});
