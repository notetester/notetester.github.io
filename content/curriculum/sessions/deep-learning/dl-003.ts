import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-003",
  "slug": "dl-003",
  "courseId": "deep-learning",
  "moduleId": "dl-ann-dnn",
  "order": 3,
  "title": "Fashion-MNIST shape와 클래스 균형",
  "level": "입문",
  "estimatedMinutes": 45,
  "concepts": [
    "Fashion-MNIST",
    "image tensor",
    "class balance"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex01_인공신경망(ANN).ipynb",
      "lines": 727,
      "bytes": 780733,
      "sha256": "7E9C6E0B0A2787F54DD8D6D94B86B499093AE8550158A4B110EABC6FFA6EC7C6"
    }
  ],
  "sourceNotes": [
    "훈련 (60000,28,28), 테스트 (10000,28,28), 클래스별 6000개가 출력된다.",
    "원본 예제 의도: (train_X,train_y),(test_X,test_y)=keras.datasets.fashion_mnist.load_data()"
  ],
  "expertNotes": [
    "이미지의 축 순서와 픽셀 범위를 모델 입력 계약으로 남긴다."
  ],
  "prerequisiteSlugs": [
    "dl-002"
  ],
  "nextSlug": "dl-004"
});
