import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "gap-002",
  "slug": "gap-002",
  "courseId": "python",
  "moduleId": "gap-python-runtime",
  "order": 2,
  "title": "dunder·property·descriptor·ABC·Protocol",
  "level": "전문가",
  "estimatedMinutes": 90,
  "concepts": [
    "data model",
    "descriptor",
    "Protocol"
  ],
  "localSources": [],
  "sourceNotes": [
    "원본에는 dataclass까지만 있고 descriptor/ABC/Protocol 실습이 없다.",
    "원본 예제 의도: class Named(Protocol):\n name:str"
  ],
  "expertNotes": [
    "GAP: composition과 structural typing을 포함한 설계 비교가 필요하다."
  ],
  "prerequisiteSlugs": [
    "gap-001"
  ],
  "nextSlug": "gap-003"
});
