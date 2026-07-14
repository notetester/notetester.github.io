import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-011",
  "slug": "dl-011",
  "courseId": "deep-learning",
  "moduleId": "dl-training",
  "order": 1,
  "title": "훈련·검증 곡선과 history",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "history",
    "validation loss",
    "learning curve"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex03_신경망모델훈련.ipynb",
      "lines": 1143,
      "bytes": 712866,
      "sha256": "B8143BB1939E0C400968E4B9F5163265BE677E52A775E70C9D0A5A88B002C298"
    }
  ],
  "sourceNotes": [
    "history 키 accuracy/loss/val_accuracy/val_loss와 곡선이 저장돼 있다.",
    "원본 예제 의도: history=model.fit(X,y,validation_data=(Xv,yv),epochs=20)"
  ],
  "expertNotes": [
    "최종 값만 보지 말고 epoch별 격차와 변곡점을 읽는다."
  ],
  "prerequisiteSlugs": [
    "dl-010"
  ],
  "nextSlug": "dl-012"
});
