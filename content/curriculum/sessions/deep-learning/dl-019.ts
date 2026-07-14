import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-019",
  "slug": "dl-019",
  "courseId": "deep-learning",
  "moduleId": "dl-cnn",
  "order": 2,
  "title": "필터·커널·채널과 feature map",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "kernel",
    "channel",
    "feature map"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex05_합성곱신경망(CNN).ipynb",
      "lines": 156,
      "bytes": 596977,
      "sha256": "F737A4138CF909955CF7CD3CA24E4D32A5E90C26AC8DD9D5868FFDBF511BF08C"
    }
  ],
  "sourceNotes": [
    "커널이 이동하며 특징맵을 만드는 시각 자료가 있다.",
    "원본 예제 의도: y=tf.nn.conv2d(x,filters,strides=1,padding='SAME')"
  ],
  "expertNotes": [
    "입력 채널×출력 채널×커널 크기로 가중치 수를 계산한다."
  ],
  "prerequisiteSlugs": [
    "dl-018"
  ],
  "nextSlug": "dl-020"
});
