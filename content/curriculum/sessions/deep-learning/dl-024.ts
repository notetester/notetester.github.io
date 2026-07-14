import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-024",
  "slug": "dl-024",
  "courseId": "deep-learning",
  "moduleId": "dl-cnn",
  "order": 7,
  "title": "MNIST CNN 설계·평가",
  "level": "중급",
  "estimatedMinutes": 60,
  "concepts": [
    "MNIST",
    "CNN",
    "test evaluation"
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
    "검증 약 0.9899, 테스트 정확도 0.9906과 loss가 저장돼 있다.",
    "원본 예제 의도: loss,acc=model.evaluate(test_X,test_y)"
  ],
  "expertNotes": [
    "비슷한 벤치마크라도 데이터셋별 난이도와 전처리가 다르다."
  ],
  "prerequisiteSlugs": [
    "dl-023"
  ],
  "nextSlug": "dl-025"
});
