import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "coach-008",
  "slug": "coach-008",
  "courseId": "projects",
  "moduleId": "coach-domain-ops",
  "order": 1,
  "title": "평가·승인·멘토 도메인과 AI 결합",
  "level": "고급",
  "estimatedMinutes": 60,
  "concepts": [
    "evaluation workflow",
    "approval",
    "mentor"
  ],
  "localSources": [
    {
      "repository": "D:/dev/coachbot",
      "path": "Back/server/routes/evaluations.js",
      "lines": 323,
      "bytes": 10352,
      "sha256": "4323A21339C61727A785A3B9410C98DC9624289F11204E2C4D028A0F364E9352"
    },
    {
      "repository": "D:/dev/coachbot",
      "path": "Back/server/routes/mockInterview.js",
      "lines": 161,
      "bytes": 4842,
      "sha256": "EC30D0045213E6436B218570031FA9E45410E19F3A781BDAF4045DD04593A567"
    },
    {
      "repository": "D:/dev/coachbot",
      "path": "Front/src/pages/Analysis.tsx",
      "lines": 556,
      "bytes": 21224,
      "sha256": "56DFB89E53F9C2DD7937A801522B0A639DC729BB268A6216A437FD411100E146"
    }
  ],
  "sourceNotes": [
    "평가 CRUD·승인/거절·관리자 코멘트와 분석 화면이 구현돼 있다.",
    "원본 예제 의도: POST /api/evaluations; POST /api/mock-interview/:id/approve"
  ],
  "expertNotes": [
    "AI 점수와 인간 승인 기록을 분리하고 감사 로그를 남긴다."
  ],
  "prerequisiteSlugs": [
    "coach-007"
  ],
  "nextSlug": "coach-009"
});
