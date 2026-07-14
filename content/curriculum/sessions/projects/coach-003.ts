import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "coach-003",
  "slug": "coach-003",
  "courseId": "projects",
  "moduleId": "coach-ai-flow",
  "order": 3,
  "title": "직접 Chat Completions 호출과 오류 분류",
  "level": "고급",
  "estimatedMinutes": 60,
  "concepts": [
    "HTTP API",
    "error handling",
    "timeout"
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
    "키 없음·잘못된 키·네트워크·API 오류·빈 콘텐츠를 서로 다른 메시지로 처리한다.",
    "원본 예제 의도: const response=await fetch(apiUrl,{method:'POST',headers,body:JSON.stringify(payload)})"
  ],
  "expertNotes": [
    "timeout, AbortController, retry/backoff, idempotency가 추가로 필요하다."
  ],
  "prerequisiteSlugs": [
    "coach-002"
  ],
  "nextSlug": "coach-004"
});
