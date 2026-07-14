import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-036",
  "slug": "ml-036",
  "courseId": "machine-learning",
  "moduleId": "ml-margin-boosting-unsupervised",
  "order": 3,
  "title": "SVR와 커널별 회귀",
  "level": "고급",
  "estimatedMinutes": 55,
  "concepts": [
    "SVR",
    "kernel regression",
    "epsilon"
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
    "linear·RBF·poly SVR의 곡선과 훈련 score가 한 화면에 저장돼 있다.",
    "원본 예제 의도: svr=SVR(kernel='rbf').fit(X,y)"
  ],
  "expertNotes": [
    "epsilon 관 내부 오차와 커널 하이퍼파라미터를 분리해 튜닝한다."
  ],
  "prerequisiteSlugs": [
    "ml-035"
  ],
  "nextSlug": "ml-037"
});
