import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-025",
  "slug": "dl-025",
  "courseId": "deep-learning",
  "moduleId": "dl-cnn",
  "order": 8,
  "title": "혼동행렬과 오분류 샘플",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "confusion matrix",
    "error analysis",
    "misclassification"
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
    "혼동행렬과 잘못 분류된 샘플 이미지가 저장돼 있다.",
    "원본 예제 의도: cm=confusion_matrix(test_y,pred.argmax(1))"
  ],
  "expertNotes": [
    "평균 정확도 이후에는 어떤 클래스 쌍이 왜 헷갈리는지 본다."
  ],
  "prerequisiteSlugs": [
    "dl-024"
  ],
  "nextSlug": "dl-026"
});
