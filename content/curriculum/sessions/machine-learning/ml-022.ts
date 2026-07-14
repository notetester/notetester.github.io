import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-022",
  "slug": "ml-022",
  "courseId": "machine-learning",
  "moduleId": "ml-classification-optimization",
  "order": 4,
  "title": "손실함수와 경사하강법 종류",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "loss",
    "batch gradient descent",
    "SGD"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex11_경사하강법.ipynb",
      "lines": 1038,
      "bytes": 471746,
      "sha256": "64A2EDB5A1491C7EE09CD98856EFA30762D46D58D28A0A21869DBFAC9A13468D"
    }
  ],
  "sourceNotes": [
    "배치·미니배치·확률적 경사하강과 로그 손실 원리가 마크다운에 설명돼 있다.",
    "원본 예제 의도: sgd=SGDClassifier(loss='log_loss',random_state=42)"
  ],
  "expertNotes": [
    "학습률과 특성 스케일이 수렴 속도에 미치는 영향을 보강한다."
  ],
  "prerequisiteSlugs": [
    "ml-021"
  ],
  "nextSlug": "ml-023"
});
