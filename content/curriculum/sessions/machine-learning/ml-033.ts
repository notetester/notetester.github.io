import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-033",
  "slug": "ml-033",
  "courseId": "machine-learning",
  "moduleId": "ml-evaluation-trees",
  "order": 9,
  "title": "GradientBoosting·HistGradientBoosting",
  "level": "고급",
  "estimatedMinutes": 60,
  "concepts": [
    "boosting",
    "gradient boosting",
    "histogram binning"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex19_앙상블 학습.ipynb",
      "lines": 351,
      "bytes": 11309,
      "sha256": "50ECF4A492878732B0763C3C76F539C410F1DE4ECEBB4168DF87BEBD141C16FB"
    }
  ],
  "sourceNotes": [
    "GB 테스트 0.8577, HGB 테스트 0.8777와 교차검증 결과가 있다.",
    "원본 예제 의도: hgb=HistGradientBoostingClassifier(random_state=42).fit(X,y)"
  ],
  "expertNotes": [
    "학습률과 트리 수의 trade-off를 early stopping으로 관리한다."
  ],
  "prerequisiteSlugs": [
    "ml-032"
  ],
  "nextSlug": "ml-034"
});
