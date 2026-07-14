import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-034",
  "slug": "ml-034",
  "courseId": "machine-learning",
  "moduleId": "ml-margin-boosting-unsupervised",
  "order": 1,
  "title": "선형 SVM·마진·서포트 벡터",
  "level": "고급",
  "estimatedMinutes": 55,
  "concepts": [
    "SVM",
    "margin",
    "support vector"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex20_SVM.ipynb",
      "lines": 1431,
      "bytes": 1341599,
      "sha256": "E72A13130D2394A18E1ECCA96732BE2C7DC70A7D962BF7A80D4BF415420178B8"
    }
  ],
  "sourceNotes": [
    "선형 blob 정확도 1.0, 서포트 벡터 3개와 결정경계 그림이 있다.",
    "원본 예제 의도: svc=SVC(kernel='linear',C=1).fit(X,y)"
  ],
  "expertNotes": [
    "마진 최대화와 규제 C의 관계를 기하학적으로 설명한다."
  ],
  "prerequisiteSlugs": [
    "ml-033"
  ],
  "nextSlug": "ml-035"
});
