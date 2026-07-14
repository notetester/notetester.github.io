import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "coach-010",
  "slug": "coach-010",
  "courseId": "projects",
  "moduleId": "coach-domain-ops",
  "order": 3,
  "title": "CoachBot AI 운영 체크리스트",
  "level": "전문가",
  "estimatedMinutes": 75,
  "concepts": [
    "observability",
    "privacy",
    "evaluation",
    "cost"
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
    },
    {
      "repository": "D:/dev/coachbot",
      "path": "Front/src/pages/MockInterviewRecording.tsx",
      "lines": 277,
      "bytes": 9220,
      "sha256": "E6C4391990E26E46C1C2CACB2BE4354B2EF3411AC8CB77948CB65665CDCF8DBC"
    }
  ],
  "sourceNotes": [
    "코드에는 기능 경로는 있으나 모델 품질 평가·trace·비용·PII 보존기간 자동 검증은 없다.",
    "원본 예제 의도: checklist=['prompt version','latency','token cost','human override','PII retention']"
  ],
  "expertNotes": [
    "포트폴리오 사례는 구현과 미구현을 명시해 과장하지 않는다."
  ],
  "prerequisiteSlugs": [
    "coach-009"
  ],
  "nextSlug": "gap-010"
});
