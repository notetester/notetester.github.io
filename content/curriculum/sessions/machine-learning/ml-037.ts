import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-037",
  "slug": "ml-037",
  "courseId": "machine-learning",
  "moduleId": "ml-margin-boosting-unsupervised",
  "order": 4,
  "title": "XGBoost·교차검증·early stopping",
  "level": "고급",
  "estimatedMinutes": 65,
  "concepts": [
    "XGBoost",
    "early stopping",
    "feature importance"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex21_XGBoost와 LightGBM.ipynb",
      "lines": 504,
      "bytes": 76339,
      "sha256": "E5EEEF5B198238FF9D7D9686D4A98A354CBF0E58985DA672E2385D73ECDADE60"
    }
  ],
  "sourceNotes": [
    "테스트 0.8654, CV 0.8744, 최적 반복 95와 중요도 그림이 있다.",
    "원본 예제 의도: xgb=XGBClassifier(n_estimators=500,random_state=42).fit(X,y,eval_set=[(Xv,yv)])"
  ],
  "expertNotes": [
    "검증 세트를 early stopping에 쓰고 테스트에는 손대지 않는다."
  ],
  "prerequisiteSlugs": [
    "ml-036"
  ],
  "nextSlug": "ml-038"
});
