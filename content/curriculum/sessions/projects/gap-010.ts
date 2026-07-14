import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "gap-010",
  "slug": "gap-010",
  "courseId": "projects",
  "moduleId": "gap-data-ai-production",
  "order": 1,
  "title": "NumPy view/copy·axis·수치 안정성·성능",
  "level": "전문가",
  "estimatedMinutes": 100,
  "concepts": [
    "view",
    "axis",
    "numerical stability",
    "benchmark"
  ],
  "localSources": [],
  "sourceNotes": [
    "원본 NumPy는 기초 벡터화까지이며 메모리 공유·안정성 벤치마크가 없다.",
    "원본 예제 의도: view=a[:,1:]; print(np.shares_memory(a,view))"
  ],
  "expertNotes": [
    "GAP: loop 대비 vectorization과 overflow/underflow를 측정한다."
  ],
  "prerequisiteSlugs": [
    "coach-010"
  ],
  "nextSlug": "gap-011"
});
