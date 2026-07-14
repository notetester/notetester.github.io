import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "gap-011",
  "slug": "gap-011",
  "courseId": "projects",
  "moduleId": "gap-data-ai-production",
  "order": 2,
  "title": "Pandas groupby·merge·pivot·window·대용량",
  "level": "전문가",
  "estimatedMinutes": 110,
  "concepts": [
    "groupby",
    "merge",
    "pivot",
    "rolling"
  ],
  "localSources": [],
  "sourceNotes": [
    "노트에 일부 언급은 있으나 실행 코드·결과가 없다.",
    "원본 예제 의도: result=(df.merge(dim,on='id').groupby('group').value.agg(['mean','count']))"
  ],
  "expertNotes": [
    "GAP: 10,000행 grade2.csv에서 메모리·성능·검증 체크를 실행한다."
  ],
  "prerequisiteSlugs": [
    "gap-010"
  ],
  "nextSlug": "gap-012"
});
