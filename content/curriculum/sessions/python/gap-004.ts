import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "gap-004",
  "slug": "gap-004",
  "courseId": "python",
  "moduleId": "gap-python-runtime",
  "order": 4,
  "title": "패키징·pyproject·wheel·versioning",
  "level": "전문가",
  "estimatedMinutes": 90,
  "concepts": [
    "pyproject.toml",
    "wheel",
    "semantic versioning"
  ],
  "localSources": [],
  "sourceNotes": [
    "원본에는 venv/requirements까지만 있고 배포 가능한 패키지 증거가 없다.",
    "원본 예제 의도: python -m build\npip install dist/package.whl"
  ],
  "expertNotes": [
    "GAP: src layout, editable install, lock과 release CI를 포함한다."
  ],
  "prerequisiteSlugs": [
    "gap-003"
  ],
  "nextSlug": "gap-005"
});
