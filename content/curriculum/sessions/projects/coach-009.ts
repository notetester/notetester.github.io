import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "coach-009",
  "slug": "coach-009",
  "courseId": "projects",
  "moduleId": "coach-domain-ops",
  "order": 2,
  "title": "MySQL 스키마·마이그레이션·seed",
  "level": "고급",
  "estimatedMinutes": 65,
  "concepts": [
    "MySQL",
    "schema migration",
    "seed data"
  ],
  "localSources": [
    {
      "repository": "D:/dev/coachbot",
      "path": "Back/server/schema.sql",
      "lines": 270,
      "bytes": 11213,
      "sha256": "ADD9632CA1CBF85DA3E28F6731D68766F8E32E74F3D03ED81BEF113D6258C6CA"
    },
    {
      "repository": "D:/dev/coachbot",
      "path": "Back/server/seed_data.sql",
      "lines": 113,
      "bytes": 7363,
      "sha256": "C79BFE35592C30FBCE7B5197EF6F76D0F27449793A82433F8E2CB71B94D09E09"
    },
    {
      "repository": "D:/dev/coachbot",
      "path": "Back/server/SCHEMA_GUIDELINES.md",
      "lines": 103,
      "bytes": 2780,
      "sha256": "EF628EC6EE612E3C3E0E339E4D86C733F44C76A02B48221B01F6A66882BC814E"
    }
  ],
  "sourceNotes": [
    "schema, 5개 migration, seed와 운영 지침이 존재한다.",
    "원본 예제 의도: CREATE TABLE mock_interview_submissions (...);"
  ],
  "expertNotes": [
    "비밀번호 예시와 개인정보는 공개 학습자료에서 실제 값 대신 안전한 placeholder만 쓴다."
  ],
  "prerequisiteSlugs": [
    "coach-008"
  ],
  "nextSlug": "coach-010"
});
