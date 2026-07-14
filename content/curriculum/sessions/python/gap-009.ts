import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "gap-009",
  "slug": "gap-009",
  "courseId": "python",
  "moduleId": "gap-concurrency-ops",
  "order": 4,
  "title": "테스트 double·coverage·property testing·CI matrix",
  "level": "전문가",
  "estimatedMinutes": 100,
  "concepts": [
    "mock",
    "coverage",
    "Hypothesis",
    "CI"
  ],
  "localSources": [],
  "sourceNotes": [
    "원본은 unittest/pytest 기본 9 node까지이며 mock·coverage·property/E2E가 없다.",
    "원본 예제 의도: @given(st.integers())\ndef test_invariant(x): assert f(x)>=0"
  ],
  "expertNotes": [
    "GAP: 실패를 먼저 재현하고 회귀 테스트로 고정하는 워크플로우가 필요하다."
  ],
  "prerequisiteSlugs": [
    "gap-008"
  ],
  "nextSlug": "ml-001"
});
