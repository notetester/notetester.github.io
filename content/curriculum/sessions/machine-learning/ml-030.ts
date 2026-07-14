import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-030",
  "slug": "ml-030",
  "courseId": "machine-learning",
  "moduleId": "ml-evaluation-trees",
  "order": 6,
  "title": "정확도·정밀도·재현율·F1",
  "level": "중급",
  "estimatedMinutes": 60,
  "concepts": [
    "precision",
    "recall",
    "F1",
    "support"
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
    "정확도 0.7762, 정밀도 0.8135, 재현율 0.9122, F1 0.8600이 출력된다.",
    "원본 예제 의도: print(classification_report(y_test,y_pred))"
  ],
  "expertNotes": [
    "불균형 데이터에서는 클래스별 지표와 업무 임계값을 함께 본다."
  ],
  "prerequisiteSlugs": [
    "ml-029"
  ],
  "nextSlug": "ml-031"
});
