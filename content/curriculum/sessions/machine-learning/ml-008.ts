import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-008",
  "slug": "ml-008",
  "courseId": "machine-learning",
  "moduleId": "ml-framing-knn",
  "order": 8,
  "title": "스케일 불균형과 표준화",
  "level": "기초",
  "estimatedMinutes": 55,
  "concepts": [
    "StandardScaler",
    "mean",
    "standard deviation"
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
    "표준화 전 [25,150]은 빙어, 표준화 후는 도미로 바뀌며 평균 [27.2972,454.0972]가 출력된다.",
    "원본 예제 의도: scaler=StandardScaler().fit(train_X)\ntrain_s=scaler.transform(train_X)"
  ],
  "expertNotes": [
    "scaler는 훈련 데이터에만 fit해 누수를 막는다."
  ],
  "prerequisiteSlugs": [
    "ml-007"
  ],
  "nextSlug": "ml-009"
});
