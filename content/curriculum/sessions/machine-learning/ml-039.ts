import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-039",
  "slug": "ml-039",
  "courseId": "machine-learning",
  "moduleId": "ml-margin-boosting-unsupervised",
  "order": 6,
  "title": "군집·평균 이미지·KMeans·elbow",
  "level": "고급",
  "estimatedMinutes": 65,
  "concepts": [
    "clustering",
    "KMeans",
    "centroid",
    "inertia"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex15_군집알고리즘.ipynb",
      "lines": 489,
      "bytes": 1561519,
      "sha256": "6140139F7630A44A1A4AF05A7D8F5034CD38CCCE446EAB7E3141C2DE1A1B5BEE"
    },
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex16_K-평균.ipynb",
      "lines": 560,
      "bytes": 2248700,
      "sha256": "736AD55F5596F9C8AF6BCB6C916045189D6E8898A86F76E19661F4E70A39AAB4"
    },
    {
      "repository": "D:/dev/2026_ML",
      "path": "data/fruits_300.npy",
      "lines": 1396,
      "bytes": 3000128,
      "sha256": "F4D3E7FFB1CE1061D9AE4829BB386C9A792FEC77948FB67DD95618E32738CAFC"
    }
  ],
  "sourceNotes": [
    "300개 과일 이미지, cluster count 110/99/91, 중심 이미지와 elbow 곡선이 저장돼 있다.",
    "원본 예제 의도: km=KMeans(n_clusters=3,random_state=42).fit(fruits_2d)"
  ],
  "expertNotes": [
    "군집 번호에는 의미가 없으며 정답 라벨과 임의로 동일시하지 않는다."
  ],
  "prerequisiteSlugs": [
    "ml-038"
  ],
  "nextSlug": "ml-040"
});
