import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-020",
  "slug": "ml-020",
  "courseId": "machine-learning",
  "moduleId": "ml-classification-optimization",
  "order": 2,
  "title": "시그모이드와 이진 로지스틱 회귀",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "sigmoid",
    "logit",
    "binary classification"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex09_로지스틱회귀-2.ipynb",
      "lines": 1311,
      "bytes": 229569,
      "sha256": "72A4A936689DFC51CB0D053EF0138952D0B83A4BA8EE6765869A278ADC8B5825"
    }
  ],
  "sourceNotes": [
    "시그모이드 곡선과 도미/빙어 이진 분류의 계수·확률이 저장돼 있다.",
    "원본 예제 의도: z=np.linspace(-5,5); plt.plot(z,1/(1+np.exp(-z)))"
  ],
  "expertNotes": [
    "로지스틱 회귀는 이름과 달리 분류 모델이며 임계값은 업무 비용에 맞춰야 한다."
  ],
  "prerequisiteSlugs": [
    "ml-019"
  ],
  "nextSlug": "ml-021"
});
