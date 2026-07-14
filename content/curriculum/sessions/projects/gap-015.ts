import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "gap-015",
  "slug": "gap-015",
  "courseId": "projects",
  "moduleId": "gap-data-ai-production",
  "order": 6,
  "title": "RAG golden set·faithfulness·공격 방어·관측성",
  "level": "전문가",
  "estimatedMinutes": 130,
  "concepts": [
    "golden set",
    "faithfulness",
    "prompt injection",
    "tracing"
  ],
  "localSources": [],
  "sourceNotes": [
    "원본은 소수 데모 질문만 있고 retrieval recall·faithfulness·adversarial 평가가 없다.",
    "원본 예제 의도: case={'question':q,'expected_sources':['manual:p6'],'forbidden':'context instruction'}"
  ],
  "expertNotes": [
    "GAP: 검색/생성 지표, PII, 문서 주입, 비용·latency SLO를 자동 평가한다."
  ],
  "prerequisiteSlugs": [
    "gap-014"
  ]
});
