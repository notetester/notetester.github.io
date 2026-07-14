import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-011",
  "slug": "ml-011",
  "courseId": "machine-learning",
  "moduleId": "ml-framing-knn",
  "order": 11,
  "title": "MAE·MSE·RMSE와 오차 해석",
  "level": "기초",
  "estimatedMinutes": 45,
  "concepts": [
    "MAE",
    "MSE",
    "RMSE"
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
    "농어 예측 MAE 19.1571이 출력돼 평균적으로 얼마나 틀렸는지 해석할 수 있다.",
    "원본 예제 의도: mae=mean_absolute_error(y_test,model.predict(X_test))"
  ],
  "expertNotes": [
    "업무 단위로 해석 가능한 지표와 큰 오차 벌점을 구분한다."
  ],
  "prerequisiteSlugs": [
    "ml-010"
  ],
  "nextSlug": "ml-012"
});
