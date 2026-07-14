import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-017",
  "slug": "dl-017",
  "courseId": "deep-learning",
  "moduleId": "dl-training",
  "order": 7,
  "title": "TensorBoard 로그와 대시보드",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "TensorBoard",
    "scalar",
    "histogram"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex04_TensorBoard.ipynb",
      "lines": 538,
      "bytes": 30081,
      "sha256": "BEEA86E01A561CAAB56CC2F74C534F375E47F70E63D28E7BB7DEF984EB28DB0D"
    }
  ],
  "sourceNotes": [
    "TensorFlow 2.21/Keras 3.14.1, 로그 경로와 train/validation 이벤트 파일이 있다.",
    "원본 예제 의도: TensorBoard(log_dir=log_dir,histogram_freq=1)",
    "인벤토리에 선언된 원본 2개 중 현재 snapshot에서 1개만 fingerprint했으므로 누락 파일의 동작을 추정하지 않습니다."
  ],
  "expertNotes": [
    "실험 이름에 데이터·모델·seed·시간을 구조화해 비교 가능하게 만든다."
  ],
  "prerequisiteSlugs": [
    "dl-016"
  ],
  "nextSlug": "dl-018"
});
