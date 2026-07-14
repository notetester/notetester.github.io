import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "coach-005",
  "slug": "coach-005",
  "courseId": "projects",
  "moduleId": "coach-ai-flow",
  "order": 5,
  "title": "질문 생성·카테고리·추천 프롬프트",
  "level": "고급",
  "estimatedMinutes": 55,
  "concepts": [
    "question generation",
    "category",
    "prompt constraint"
  ],
  "localSources": [
    {
      "repository": "D:/dev/coachbot",
      "path": "Back/server/routes/ai.js",
      "lines": 342,
      "bytes": 11478,
      "sha256": "CC6CF33947DF02E0ADDBA29B8EAA8143A956863342C283D2E5C4D578D3E13561"
    }
  ],
  "sourceNotes": [
    "단일 질문 생성과 조건 기반 5개 추천 엔드포인트가 구현돼 있다.",
    "원본 예제 의도: prompt=`${category} 관련 면접 질문을 하나만 생성`"
  ],
  "expertNotes": [
    "중복·편향·난이도·금지 질문 검사와 고정 평가셋이 필요하다."
  ],
  "prerequisiteSlugs": [
    "coach-004"
  ],
  "nextSlug": "coach-006"
});
