import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "gap-005",
  "slug": "gap-005",
  "courseId": "python",
  "moduleId": "gap-python-runtime",
  "order": 5,
  "title": "고급 타입과 정적 검사",
  "level": "전문가",
  "estimatedMinutes": 90,
  "concepts": [
    "TypeVar",
    "Generic",
    "TypedDict",
    "mypy"
  ],
  "localSources": [],
  "sourceNotes": [
    "원본에는 Optional/Union/Callable/Literal/dataclass만 있다.",
    "원본 예제 의도: T=TypeVar('T')\ndef first(xs:Sequence[T])->T: return xs[0]"
  ],
  "expertNotes": [
    "GAP: mypy/pyright 성공·실패 출력을 학습 결과로 저장한다."
  ],
  "prerequisiteSlugs": [
    "gap-004"
  ],
  "nextSlug": "gap-006"
});
