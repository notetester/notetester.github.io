import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "gap-007",
  "slug": "gap-007",
  "courseId": "python",
  "moduleId": "gap-concurrency-ops",
  "order": 2,
  "title": "asyncio·취소·timeout·backpressure",
  "level": "전문가",
  "estimatedMinutes": 100,
  "concepts": [
    "asyncio",
    "cancellation",
    "timeout"
  ],
  "localSources": [],
  "sourceNotes": [
    "원본과 Streamlit 앱에 async 운영 실습이 없다.",
    "원본 예제 의도: async with asyncio.timeout(2): await fetch_all()"
  ],
  "expertNotes": [
    "GAP: task leak과 graceful shutdown까지 테스트한다."
  ],
  "prerequisiteSlugs": [
    "gap-006"
  ],
  "nextSlug": "gap-008"
});
