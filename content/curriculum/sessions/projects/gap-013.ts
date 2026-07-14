import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "gap-013",
  "slug": "gap-013",
  "courseId": "projects",
  "moduleId": "gap-data-ai-production",
  "order": 4,
  "title": "ML calibration·threshold·fairness·drift",
  "level": "전문가",
  "estimatedMinutes": 120,
  "concepts": [
    "calibration",
    "threshold",
    "fairness",
    "drift"
  ],
  "localSources": [],
  "sourceNotes": [
    "원본은 accuracy/F1까지 있고 calibration·공정성·drift 모니터링이 없다.",
    "원본 예제 의도: CalibrationDisplay.from_estimator(model,X_test,y_test)"
  ],
  "expertNotes": [
    "GAP: subgroup metric과 배포 후 분포 변화를 포함한다."
  ],
  "prerequisiteSlugs": [
    "gap-012"
  ],
  "nextSlug": "gap-014"
});
