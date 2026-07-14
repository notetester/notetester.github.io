import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-031",
  "slug": "ml-031",
  "courseId": "machine-learning",
  "moduleId": "ml-evaluation-trees",
  "order": 7,
  "title": "혼동행렬과 1·2종 오류",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "confusion matrix",
    "false positive",
    "false negative"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex18_모델_평가_지표.ipynb",
      "lines": 446,
      "bytes": 124428,
      "sha256": "2B4AB2D492876BDE62A26E2B43CCCA279BBBA66226CE25021D6A176E8CD3AEE0"
    }
  ],
  "sourceNotes": [
    "[[115,205],[86,894]]가 출력되고 TN/FP/FN/TP로 해석돼 있다.",
    "원본 예제 의도: cm=confusion_matrix(y_test,y_pred)"
  ],
  "expertNotes": [
    "어느 클래스가 positive인지 명시하지 않으면 지표 의미가 뒤집힌다."
  ],
  "prerequisiteSlugs": [
    "ml-030"
  ],
  "nextSlug": "ml-032"
});
