import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "gap-008",
  "slug": "gap-008",
  "courseId": "python",
  "moduleId": "gap-concurrency-ops",
  "order": 3,
  "title": "logging·config·CLI·HTTP·DB 운영",
  "level": "전문가",
  "estimatedMinutes": 100,
  "concepts": [
    "logging",
    "configuration",
    "CLI",
    "transaction"
  ],
  "localSources": [
    {
      "repository": "D:/dev/anaconda_projects",
      "path": "db/project_filebrowser.db",
      "lines": 22,
      "bytes": 32768,
      "sha256": "82255D263BF8B0D420595CA5F88BC4C640139E425540029F4A93FA171717636D"
    }
  ],
  "sourceNotes": [
    "SQLite schema에는 alembic_version/projects 테이블이 있으나 projects 행이 0개라 학습 내용·실행 이력은 없다. 운영 앱 과정은 신규 작성이 필요하다.",
    "원본 예제 의도: logging.config.dictConfig(config); parser=argparse.ArgumentParser()"
  ],
  "expertNotes": [
    "GAP: secret·환경별 config·transaction rollback을 포함한다."
  ],
  "prerequisiteSlugs": [
    "gap-007"
  ],
  "nextSlug": "gap-009"
});
