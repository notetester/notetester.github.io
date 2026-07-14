import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-028",
  "slug": "ml-028",
  "courseId": "machine-learning",
  "moduleId": "ml-evaluation-trees",
  "order": 4,
  "title": "교차검증과 StratifiedKFold",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "cross validation",
    "fold",
    "StratifiedKFold"
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
    "cross_validate가 자동 셔플하지 않는다는 주의와 폴드 점수가 출력된다.",
    "원본 예제 의도: cv=StratifiedKFold(n_splits=10,shuffle=True,random_state=42)\nscores=cross_validate(model,X,y,cv=cv)"
  ],
  "expertNotes": [
    "동일 개인·시간 순서 데이터는 무작위 KFold가 아닌 그룹/시계열 분할이 필요하다."
  ],
  "prerequisiteSlugs": [
    "ml-027"
  ],
  "nextSlug": "ml-029"
});
