import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "gap-006",
  "slug": "gap-006",
  "courseId": "python",
  "moduleId": "gap-concurrency-ops",
  "order": 1,
  "title": "threading·multiprocessing·GIL",
  "level": "전문가",
  "estimatedMinutes": 100,
  "concepts": [
    "threading",
    "multiprocessing",
    "GIL"
  ],
  "localSources": [],
  "sourceNotes": [
    "원본에 동시성·병렬성 실행 자료가 전혀 없다.",
    "원본 예제 의도: with ProcessPoolExecutor() as ex: list(ex.map(cpu_job,data))"
  ],
  "expertNotes": [
    "GAP: CPU-bound와 I/O-bound를 같은 벤치마크로 비교한다."
  ],
  "prerequisiteSlugs": [
    "gap-005"
  ],
  "nextSlug": "gap-007"
});
