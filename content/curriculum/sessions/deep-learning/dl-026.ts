import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-026",
  "slug": "dl-026",
  "courseId": "deep-learning",
  "moduleId": "dl-cnn",
  "order": 9,
  "title": "직접 그린 숫자 추론",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "interactive inference",
    "canvas",
    "distribution shift"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex07_합성곱 신경망(CNN)을 이용한 손글씨 숫자 분류¶.ipynb",
      "lines": 820,
      "bytes": 334003,
      "sha256": "00936F77F8CB9DB9CED6EC9E738FC6D139E4C2595359FA3D171C115369FC0D1E"
    }
  ],
  "sourceNotes": [
    "새 이미지 7을 7로 예측한 결과와 마우스 입력 실습이 있다.",
    "원본 예제 의도: pred=model.predict(drawn.reshape(1,28,28,1))"
  ],
  "expertNotes": [
    "사용자 입력의 획 두께·정렬을 학습 데이터와 맞춘다."
  ],
  "prerequisiteSlugs": [
    "dl-025"
  ],
  "nextSlug": "dl-027"
});
