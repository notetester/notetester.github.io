import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-030",
  "slug": "dl-030",
  "courseId": "deep-learning",
  "moduleId": "dl-transfer",
  "order": 3,
  "title": "MobileNetV2 전처리와 입력 해상도",
  "level": "고급",
  "estimatedMinutes": 55,
  "concepts": [
    "MobileNetV2",
    "preprocess_input",
    "resize"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex09_전이학습.ipynb",
      "lines": 1039,
      "bytes": 829222,
      "sha256": "1C66209EE14C1F0A4ECDABF26112FBAFC9CCF17584F8B50AAC287A34E6CFD452"
    }
  ],
  "sourceNotes": [
    "CIFAR 32×32를 MobileNet 입력으로 변환하는 파이프라인이 있다.",
    "원본 예제 의도: x=tf.image.resize(x,(96,96)); x=tf.keras.applications.mobilenet_v2.preprocess_input(x)"
  ],
  "expertNotes": [
    "사전학습 모델이 기대하는 픽셀 범위와 채널 순서를 지킨다."
  ],
  "prerequisiteSlugs": [
    "dl-029"
  ],
  "nextSlug": "dl-031"
});
