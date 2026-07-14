import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-040",
  "slug": "ml-040",
  "courseId": "machine-learning",
  "moduleId": "ml-margin-boosting-unsupervised",
  "order": 7,
  "title": "PCA 차원축소·재구성·설명분산",
  "level": "고급",
  "estimatedMinutes": 70,
  "concepts": [
    "PCA",
    "explained variance",
    "reconstruction"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex17_PCA알고리즘(차원축소).ipynb",
      "lines": 2589,
      "bytes": 4291695,
      "sha256": "812728058E17483FDBD6C626622A5BE4D2998E7B526F3538D88695AAFF03F9A9"
    }
  ],
  "sourceNotes": [
    "축소 shape·재구성 이미지·설명 분산과 LogisticRegression/KMeans 비교가 저장돼 있다.",
    "원본 예제 의도: pca=PCA(n_components=.5).fit(fruits_2d)\nrecon=pca.inverse_transform(pca.transform(fruits_2d))"
  ],
  "expertNotes": [
    "PCA는 스케일과 선형성에 민감하고 지도 목표를 직접 최적화하지 않는다."
  ],
  "prerequisiteSlugs": [
    "ml-039"
  ],
  "nextSlug": "dl-001"
});
