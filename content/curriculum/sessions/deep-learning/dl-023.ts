import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-023",
  "slug": "dl-023",
  "courseId": "deep-learning",
  "moduleId": "dl-cnn",
  "order": 6,
  "title": "외부 이미지 전처리와 배치 차원",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "image preprocessing",
    "grayscale",
    "batch dimension"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex06_합성공 신경망을 이용한 분류.ipynb",
      "lines": 804,
      "bytes": 488537,
      "sha256": "197051E858BCC68902D14A4D13CF1D709E94FF74291D0AF40F7EB0EEF03182E6"
    },
    {
      "repository": "D:/dev/2026-DL",
      "path": "data/fashion_test.png",
      "lines": 4,
      "bytes": 448,
      "sha256": "D1CB535C544652BB98B8D01D25300A6DE6750821D6C60601BE0F3633AD7CDF20"
    }
  ],
  "sourceNotes": [
    "외부 패션 이미지 여러 장의 예측 그림이 생성돼 있다.",
    "원본 예제 의도: img=cv2.imread(path,cv2.IMREAD_GRAYSCALE); x=img.reshape(1,28,28,1)/255"
  ],
  "expertNotes": [
    "배경색·반전·resize 보간이 훈련 분포와 달라지는 문제를 점검한다."
  ],
  "prerequisiteSlugs": [
    "dl-022"
  ],
  "nextSlug": "dl-024"
});
