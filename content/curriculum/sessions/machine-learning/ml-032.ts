import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "ml-032",
  "slug": "ml-032",
  "courseId": "machine-learning",
  "moduleId": "ml-evaluation-trees",
  "order": 8,
  "title": "랜덤 포레스트·OOB·중요도",
  "level": "고급",
  "estimatedMinutes": 60,
  "concepts": [
    "RandomForest",
    "bagging",
    "OOB"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_ML",
      "path": "ex19_앙상블 학습.ipynb",
      "lines": 351,
      "bytes": 11309,
      "sha256": "50ECF4A492878732B0763C3C76F539C410F1DE4ECEBB4168DF87BEBD141C16FB"
    }
  ],
  "sourceNotes": [
    "테스트 0.8892, OOB 0.8965, sugar 중요도 50.1%가 출력된다.",
    "원본 예제 의도: rf=RandomForestClassifier(n_estimators=100,oob_score=True,random_state=42).fit(X,y)"
  ],
  "expertNotes": [
    "OOB는 편리하지만 별도 최종 테스트를 대체하지 않는다."
  ],
  "prerequisiteSlugs": [
    "ml-031"
  ],
  "nextSlug": "ml-033"
});
