import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "coach-006",
  "slug": "coach-006",
  "courseId": "projects",
  "moduleId": "coach-ai-flow",
  "order": 6,
  "title": "프론트 AI API 타입과 에러 UX",
  "level": "고급",
  "estimatedMinutes": 55,
  "concepts": [
    "TypeScript",
    "API client",
    "error UX"
  ],
  "localSources": [
    {
      "repository": "D:/dev/coachbot",
      "path": "Front/src/utils/ai.ts",
      "lines": 92,
      "bytes": 2236,
      "sha256": "0BE47DA5A35AADBD59F5001E62F90F70B4F788ADD9C389F1A1FD4D7D9DF5B47E"
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
    "네트워크 TypeError와 일반 오류를 나누고 loading/feedback 상태를 관리한다.",
    "원본 예제 의도: const response=await apiPost<AIFeedbackResponse>('/ai/feedback',{question,answer})"
  ],
  "expertNotes": [
    "서버 오류 코드를 구조화하고 재시도 가능 여부를 UI에 전달한다."
  ],
  "prerequisiteSlugs": [
    "coach-005"
  ],
  "nextSlug": "coach-007"
});
