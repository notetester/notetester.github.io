import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "coach-007",
  "slug": "coach-007",
  "courseId": "projects",
  "moduleId": "coach-ai-flow",
  "order": 7,
  "title": "MediaRecorder와 모의면접 기록",
  "level": "고급",
  "estimatedMinutes": 65,
  "concepts": [
    "MediaStream",
    "recording",
    "browser storage"
  ],
  "localSources": [
    {
      "repository": "D:/dev/coachbot",
      "path": "Front/src/pages/MockInterviewRecording.tsx",
      "lines": 277,
      "bytes": 9220,
      "sha256": "E6C4391990E26E46C1C2CACB2BE4354B2EF3411AC8CB77948CB65665CDCF8DBC"
    },
    {
      "repository": "D:/dev/coachbot",
      "path": "Back/server/routes/recording.js",
      "lines": 326,
      "bytes": 9963,
      "sha256": "206515D1654FE9124790703857EDF9744235716A8E4FD39336DFDE503CC369E5"
    }
  ],
  "sourceNotes": [
    "트랙 종료·녹화 목록·localStorage 메타데이터 저장 흐름이 구현돼 있다.",
    "원본 예제 의도: const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:true})"
  ],
  "expertNotes": [
    "Blob은 localStorage에서 제거되므로 실제 업로드·보존·동의 정책이 필요하다."
  ],
  "prerequisiteSlugs": [
    "coach-006"
  ],
  "nextSlug": "coach-008"
});
