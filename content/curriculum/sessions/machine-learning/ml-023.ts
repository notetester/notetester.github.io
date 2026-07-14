import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-023",
  "slug": "ml-023",
  "courseId": "machine-learning",
  "moduleId": "ml-classification-optimization",
  "order": 5,
  "title": "partial_fit·epoch·조기 중단 직관",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "partial_fit",
    "epoch",
    "learning curve"
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
    "epoch별 훈련/테스트 점수 곡선에서 약 100 epoch가 적절하다는 결과가 있다.",
    "원본 예제 의도: for _ in range(300):\n model.partial_fit(X,y,classes=classes)"
  ],
  "expertNotes": [
    "테스트 곡선으로 epoch를 고른 원본은 검증 세트 사용으로 교정해야 한다."
  ],
  "prerequisiteSlugs": [
    "ml-022"
  ],
  "nextSlug": "ml-024"
});
