import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-035",
  "slug": "ml-035",
  "courseId": "machine-learning",
  "moduleId": "ml-margin-boosting-unsupervised",
  "order": 2,
  "title": "RBF 커널·C·gamma·스케일",
  "level": "고급",
  "estimatedMinutes": 65,
  "concepts": [
    "RBF kernel",
    "C",
    "gamma"
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
    "moon 데이터의 선형/RBF 비교, C·gamma 결정경계, grid 최적 C=100/gamma=1이 저장돼 있다.",
    "원본 예제 의도: svc=SVC(kernel='rbf',C=100,gamma=1).fit(X_scaled,y)"
  ],
  "expertNotes": [
    "원본 일부 설명의 gamma 방향 오타 가능성을 그림과 공식으로 교정해야 한다."
  ],
  "prerequisiteSlugs": [
    "ml-034"
  ],
  "nextSlug": "ml-036"
});
