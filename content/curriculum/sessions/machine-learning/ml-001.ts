import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-001",
  "slug": "ml-001",
  "courseId": "machine-learning",
  "moduleId": "ml-framing-knn",
  "order": 1,
  "title": "AI·ML·DL과 학습 방식 분류",
  "level": "입문",
  "estimatedMinutes": 35,
  "concepts": [
    "AI",
    "지도학습",
    "비지도학습",
    "강화학습"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex00_AI_ML_DL.ipynb",
      "lines": 154,
      "bytes": 373679,
      "sha256": "AEC11AC841662FFEE3273EF98E017849AC363F1526E7D1734B6FD6BEAB87D72C"
    }
  ],
  "sourceNotes": [
    "노트북에 지도·비지도·강화·딥러닝과 회귀·분류·군집·차원축소가 그림과 함께 정리돼 있다.",
    "원본 예제 의도: problem={'input':'features','answer':'label','goal':'classification'}"
  ],
  "expertNotes": [
    "강화학습은 개념만 있고 실행 코드는 없어 보강 공백이다."
  ],
  "prerequisiteSlugs": [
    "gap-009"
  ],
  "nextSlug": "ml-002"
});
