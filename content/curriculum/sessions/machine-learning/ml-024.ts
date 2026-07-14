import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-024",
  "slug": "ml-024",
  "courseId": "machine-learning",
  "moduleId": "ml-classification-optimization",
  "order": 6,
  "title": "와인 이진분류와 선형 모델 한계",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "wine dataset",
    "interpretability",
    "nonlinearity"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex12_로지스틱회귀_와인분류.ipynb",
      "lines": 461,
      "bytes": 14031,
      "sha256": "C6DE76CE82CC07231E5F2A0533F7899F570C8380F13FF50870FB7AA440606372"
    }
  ],
  "sourceNotes": [
    "로지스틱 회귀 성능·계수와 결정 트리 필요성이 비교된다.",
    "원본 예제 의도: lr.fit(train_scaled,train_y); print(lr.coef_)"
  ],
  "expertNotes": [
    "선형 결정경계가 도메인 규칙을 얼마나 놓치는지 오분류 사례로 본다."
  ],
  "prerequisiteSlugs": [
    "ml-023"
  ],
  "nextSlug": "ml-025"
});
