import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-007",
  "slug": "ml-007",
  "courseId": "machine-learning",
  "moduleId": "ml-framing-knn",
  "order": 7,
  "title": "셔플·stratify·random_state",
  "level": "기초",
  "estimatedMinutes": 50,
  "concepts": [
    "shuffle",
    "stratified split",
    "reproducibility"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex02_훈련세트와 데이터세트.ipynb",
      "lines": 384,
      "bytes": 31598,
      "sha256": "1F4BA55BBB65EBA9F3EF50D51083957AABFD1530D791F836C25DFCD067B9864D"
    },
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex04_데이터전처리(숙제).ipynb",
      "lines": 107,
      "bytes": 22713,
      "sha256": "CC058F1E8B2820FD76B1DFFF665361DC4CF69680349C0CA9AE3861B3ADB9A95C"
    }
  ],
  "sourceNotes": [
    "무작위 인덱스 분할 뒤 테스트 정확도 1.0과 두 클래스가 섞인 산점도가 있다.",
    "원본 예제 의도: train_test_split(X,y,stratify=y,random_state=42)"
  ],
  "expertNotes": [
    "작은 데이터에서는 seed 하나에 의존하지 말고 반복 검증한다."
  ],
  "prerequisiteSlugs": [
    "ml-006"
  ],
  "nextSlug": "ml-008"
});
