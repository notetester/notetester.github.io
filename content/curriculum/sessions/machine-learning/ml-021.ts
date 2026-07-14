import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-021",
  "slug": "ml-021",
  "courseId": "machine-learning",
  "moduleId": "ml-classification-optimization",
  "order": 3,
  "title": "소프트맥스 다중 로지스틱 회귀",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "softmax",
    "multinomial",
    "decision function"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex10_로지스틱회귀-3.ipynb",
      "lines": 485,
      "bytes": 217163,
      "sha256": "7308A8879A03F3E406C69E433B3CED13BC71448D734B884C5A3560F7C350D1A8"
    }
  ],
  "sourceNotes": [
    "다중 클래스 결정 점수·소프트맥스 확률과 성능 개선 단계가 출력돼 있다.",
    "원본 예제 의도: lr=LogisticRegression(C=20,max_iter=1000).fit(X,y)"
  ],
  "expertNotes": [
    "확률 합 1 검증과 calibration 보강이 필요하다."
  ],
  "prerequisiteSlugs": [
    "ml-020"
  ],
  "nextSlug": "ml-022"
});
