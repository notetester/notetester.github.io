import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-029",
  "slug": "dl-029",
  "courseId": "deep-learning",
  "moduleId": "dl-transfer",
  "order": 2,
  "title": "CIFAR-10과 tf.data 파이프라인",
  "level": "고급",
  "estimatedMinutes": 60,
  "concepts": [
    "CIFAR-10",
    "tf.data",
    "batching",
    "prefetch"
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
    "훈련 50,000/테스트 10,000과 10개 클래스, 40k/10k train-val split이 출력된다.",
    "원본 예제 의도: ds=tf.data.Dataset.from_tensor_slices((X,y)).shuffle(10000).batch(64).prefetch(tf.data.AUTOTUNE)",
    "인벤토리에 선언된 원본 2개 중 현재 snapshot에서 1개만 fingerprint했으므로 누락 파일의 동작을 추정하지 않습니다."
  ],
  "expertNotes": [
    "cache 위치와 shuffle buffer가 메모리·재현성에 미치는 영향을 측정한다."
  ],
  "prerequisiteSlugs": [
    "dl-028"
  ],
  "nextSlug": "dl-030"
});
