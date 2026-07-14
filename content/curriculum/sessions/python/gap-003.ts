import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "gap-003",
  "slug": "gap-003",
  "courseId": "python",
  "moduleId": "gap-python-runtime",
  "order": 3,
  "title": "closure·decorator·generator·contextlib",
  "level": "전문가",
  "estimatedMinutes": 90,
  "concepts": [
    "closure",
    "decorator",
    "generator",
    "context manager"
  ],
  "localSources": [],
  "sourceNotes": [
    "원본에는 lambda와 with 사용은 있으나 구현 원리와 generator 실행 증거가 없다.",
    "원본 예제 의도: @contextmanager\ndef timer(): yield"
  ],
  "expertNotes": [
    "GAP: lazy evaluation·send/throw/close와 decorator factory를 추가한다."
  ],
  "prerequisiteSlugs": [
    "gap-002"
  ],
  "nextSlug": "gap-004"
});
