import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-027",
  "slug": "ml-027",
  "courseId": "machine-learning",
  "moduleId": "ml-evaluation-trees",
  "order": 3,
  "title": "검증세트와 데이터 역할 분리",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "validation set",
    "model selection",
    "holdout"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex14_검증세트.ipynb",
      "lines": 563,
      "bytes": 335482,
      "sha256": "F53217294030CC13DBCD590F567CE28FCDE24E9B5FD1E72290DBA7EAF5D0E25F"
    }
  ],
  "sourceNotes": [
    "훈련은 높고 검증은 낮은 과대적합 사례가 저장돼 있다.",
    "원본 예제 의도: train_X,val_X,train_y,val_y=train_test_split(train_X,train_y,random_state=42)"
  ],
  "expertNotes": [
    "훈련·검증·테스트의 의사결정 권한을 문서화한다."
  ],
  "prerequisiteSlugs": [
    "ml-026"
  ],
  "nextSlug": "ml-028"
});
