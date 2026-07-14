import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "gap-001",
  "slug": "gap-001",
  "courseId": "python",
  "moduleId": "gap-python-runtime",
  "order": 1,
  "title": "Python 객체 모델·identity·GC",
  "level": "전문가",
  "estimatedMinutes": 75,
  "concepts": [
    "identity",
    "reference",
    "garbage collection"
  ],
  "localSources": [],
  "sourceNotes": [
    "원본 40세션에는 객체 identity·reference count·GC 실행 증거가 없다.",
    "원본 예제 의도: a=[]; b=a; print(a is b,sys.getrefcount(a))"
  ],
  "expertNotes": [
    "GAP: CPython 구현 세부와 언어 보장을 구분한 신규 실습이 필요하다."
  ],
  "prerequisiteSlugs": [
    "python-040-venv-requirements-unittest-pytest"
  ],
  "nextSlug": "gap-002"
});
