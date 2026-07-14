import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "gap-012",
  "slug": "gap-012",
  "courseId": "projects",
  "moduleId": "gap-data-ai-production",
  "order": 3,
  "title": "재현 가능한 EDA·데이터 계약·누수 감사",
  "level": "전문가",
  "estimatedMinutes": 120,
  "concepts": [
    "EDA",
    "data contract",
    "leakage",
    "reproducibility"
  ],
  "localSources": [],
  "sourceNotes": [
    "원본은 개별 기능은 풍부하지만 문제 정의→EDA→정제→보고서 통합 프로젝트가 없다.",
    "원본 예제 의도: assert set(train_ids).isdisjoint(test_ids)"
  ],
  "expertNotes": [
    "GAP: 데이터 버전·schema·seed·보고서까지 하나의 파이프라인으로 만든다."
  ],
  "prerequisiteSlugs": [
    "gap-011"
  ],
  "nextSlug": "gap-013"
});
