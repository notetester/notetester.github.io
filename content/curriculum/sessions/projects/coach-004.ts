import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "coach-004",
  "slug": "coach-004",
  "courseId": "projects",
  "moduleId": "coach-ai-flow",
  "order": 4,
  "title": "면접 피드백 프롬프트 설계",
  "level": "고급",
  "estimatedMinutes": 60,
  "concepts": [
    "prompt rubric",
    "feedback",
    "grounding"
  ],
  "localSources": [
    {
      "repository": "D:/dev/coachbot",
      "path": "Back/server/routes/ai.js",
      "lines": 342,
      "bytes": 11478,
      "sha256": "CC6CF33947DF02E0ADDBA29B8EAA8143A956863342C283D2E5C4D578D3E13561"
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
    "서버 응답 feedback을 줄 단위로 렌더링하고 평가 데이터로 저장하는 흐름이 구현돼 있다.",
    "원본 예제 의도: prompt=`질문:${question}\\n답변:${answer}\\n1.강점 2.개선 3.제안 4.평가`"
  ],
  "expertNotes": [
    "직무별 평가 rubric과 근거 문장 인용, 출력 구조 검증을 추가한다."
  ],
  "prerequisiteSlugs": [
    "coach-003"
  ],
  "nextSlug": "coach-005"
});
