import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-038",
  "slug": "ml-038",
  "courseId": "machine-learning",
  "moduleId": "ml-margin-boosting-unsupervised",
  "order": 5,
  "title": "LightGBM·leaf-wise 성장",
  "level": "고급",
  "estimatedMinutes": 65,
  "concepts": [
    "LightGBM",
    "leaf-wise",
    "gain importance"
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
    "테스트 0.8662, CV 0.8745, early stopping 최적 85가 출력된다.",
    "원본 예제 의도: lgbm=LGBMClassifier(n_estimators=500,random_state=42).fit(X,y)"
  ],
  "expertNotes": [
    "작은 데이터에서 leaf-wise는 깊은 과적합을 만들 수 있어 잎 수를 제한한다."
  ],
  "prerequisiteSlugs": [
    "ml-037"
  ],
  "nextSlug": "ml-039"
});
