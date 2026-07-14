import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-001",
  "slug": "dl-001",
  "courseId": "deep-learning",
  "moduleId": "dl-ann-dnn",
  "order": 1,
  "title": "ANN·TensorFlow·Keras·PyTorch 역할",
  "level": "입문",
  "estimatedMinutes": 40,
  "concepts": [
    "ANN",
    "TensorFlow",
    "Keras",
    "PyTorch"
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
    "TensorFlow 2.21 환경과 세 프레임워크 역할 설명이 저장돼 있다.",
    "원본 예제 의도: import tensorflow as tf\nfrom tensorflow import keras"
  ],
  "expertNotes": [
    "프레임워크 API보다 tensor·gradient·loss의 공통 원리를 먼저 이해한다."
  ],
  "prerequisiteSlugs": [
    "ml-040"
  ],
  "nextSlug": "dl-002"
});
