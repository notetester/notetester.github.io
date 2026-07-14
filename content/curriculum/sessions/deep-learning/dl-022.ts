import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-022",
  "slug": "dl-022",
  "courseId": "deep-learning",
  "moduleId": "dl-cnn",
  "order": 5,
  "title": "Fashion-MNIST CNN 전체 파이프라인",
  "level": "중급",
  "estimatedMinutes": 65,
  "concepts": [
    "CNN pipeline",
    "validation",
    "checkpoint"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex06_합성공 신경망을 이용한 분류.ipynb",
      "lines": 804,
      "bytes": 488537,
      "sha256": "197051E858BCC68902D14A4D13CF1D709E94FF74291D0AF40F7EB0EEF03182E6"
    }
  ],
  "sourceNotes": [
    "훈련/검증 shape와 테스트 정확도 약 0.9230가 저장돼 있다.",
    "원본 예제 의도: model=Sequential([Conv2D(32,3,activation='relu'),MaxPooling2D(),Flatten(),Dense(100,activation='relu'),Dense(10,activation='softmax')])"
  ],
  "expertNotes": [
    "전처리와 라벨 이름을 inference 경로에서도 동일하게 유지한다."
  ],
  "prerequisiteSlugs": [
    "dl-021"
  ],
  "nextSlug": "dl-023"
});
