import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "coach-002",
  "slug": "coach-002",
  "courseId": "projects",
  "moduleId": "coach-ai-flow",
  "order": 2,
  "title": "Express AI 라우트와 입력 검증",
  "level": "고급",
  "estimatedMinutes": 55,
  "concepts": [
    "Express",
    "API route",
    "validation"
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
    "/feedback, /generate-question, /recommend-questions, /models 엔드포인트가 구현돼 있다.",
    "원본 예제 의도: router.post('/feedback',async(req,res)=>{ const {question,answer}=req.body; ... })"
  ],
  "expertNotes": [
    "길이 제한·스키마 검증·인증·rate limit이 보강돼야 한다."
  ],
  "prerequisiteSlugs": [
    "coach-001"
  ],
  "nextSlug": "coach-003"
});
