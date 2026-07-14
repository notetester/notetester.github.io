import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-010",
  "slug": "ml-010",
  "courseId": "machine-learning",
  "moduleId": "ml-framing-knn",
  "order": 10,
  "title": "KNN 회귀와 입력 shape",
  "level": "기초",
  "estimatedMinutes": 50,
  "concepts": [
    "KNeighborsRegressor",
    "reshape",
    "R2"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex05_k_최근접이웃_회귀.ipynb",
      "lines": 627,
      "bytes": 510407,
      "sha256": "AD6858F01FDA7BD86F086CD0801D0B0031A2FCEF480BA30E57CF8D784421B23D"
    }
  ],
  "sourceNotes": [
    "입력 shape (42,1)/(14,1), 훈련 R² 0.9699, 테스트 R² 0.9928가 저장돼 있다.",
    "원본 예제 의도: X=train_length.reshape(-1,1)\nknr=KNeighborsRegressor().fit(X,y)"
  ],
  "expertNotes": [
    "scikit-learn의 X는 샘플×특성 2차원이라는 계약을 강조한다."
  ],
  "prerequisiteSlugs": [
    "ml-009"
  ],
  "nextSlug": "ml-011"
});
