import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-002",
  "slug": "dl-002",
  "courseId": "deep-learning",
  "moduleId": "dl-ann-dnn",
  "order": 2,
  "title": "CPU·GPU 실행 환경 진단",
  "level": "입문",
  "estimatedMinutes": 40,
  "concepts": [
    "GPU",
    "CUDA",
    "WSL2",
    "device"
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
    "native Windows TensorFlow 2.11+에서 GPU를 못 찾고 CPU만 사용한다는 경고가 저장돼 있다.",
    "원본 예제 의도: print(tf.config.list_physical_devices('GPU'))"
  ],
  "expertNotes": [
    "환경·드라이버·프레임워크 버전을 실행 결과와 함께 기록한다."
  ],
  "prerequisiteSlugs": [
    "dl-001"
  ],
  "nextSlug": "dl-003"
});
