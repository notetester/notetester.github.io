import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-019",
  "slug": "ml-019",
  "courseId": "machine-learning",
  "moduleId": "ml-classification-optimization",
  "order": 1,
  "title": "다중분류와 predict_proba",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "multiclass",
    "probability",
    "class order"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex08_로지스틱회귀-1.ipynb",
      "lines": 731,
      "bytes": 94589,
      "sha256": "A38953FCF9129931EB05BB38B78B0005E8C7361A0B70869B5E155EFCA11E53B3"
    }
  ],
  "sourceNotes": [
    "5개 샘플의 어종별 확률과 classes 순서가 출력돼 있다.",
    "원본 예제 의도: proba=kn.predict_proba(X_test[:5]); print(kn.classes_,proba)"
  ],
  "expertNotes": [
    "확률 열은 반드시 classes_ 순서와 함께 해석한다."
  ],
  "prerequisiteSlugs": [
    "ml-018"
  ],
  "nextSlug": "ml-020"
});
