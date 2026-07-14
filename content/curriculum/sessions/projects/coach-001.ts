import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "coach-001",
  "slug": "coach-001",
  "courseId": "projects",
  "moduleId": "coach-ai-flow",
  "order": 1,
  "title": "CoachBot 요구사항에서 AI 기능 경계 찾기",
  "level": "고급",
  "estimatedMinutes": 50,
  "concepts": [
    "product boundary",
    "AI feature",
    "fallback"
  ],
  "localSources": [
    {
      "repository": "D:/dev/coachbot",
      "path": "Back/server/README.md",
      "lines": 164,
      "bytes": 5578,
      "sha256": "61B750C051795C6A7ABD8342E3BD4FDB029C25CF4056FAD70F4B24543041673B"
    },
    {
      "repository": "D:/dev/coachbot",
      "path": "Front/src/pages/MockInterviewAIFeedback.tsx",
      "lines": 213,
      "bytes": 8050,
      "sha256": "9984C1C10037EC809D592B67F0AC5A9F6E47750D49F01DAED43692409FFE9D3D"
    }
  ],
  "sourceNotes": [
    "README API와 프론트 화면에서 AI가 맡는 기능과 일반 CRUD가 구분된다.",
    "원본 예제 의도: features=['면접 피드백','질문 생성','질문 추천']"
  ],
  "expertNotes": [
    "AI가 실패해도 제출·평가 데이터가 소실되지 않는 경계를 둔다."
  ],
  "prerequisiteSlugs": [
    "rag-032"
  ],
  "nextSlug": "coach-002"
});
