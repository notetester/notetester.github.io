import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-007",
  "slug": "rag-007",
  "courseId": "langchain-rag",
  "moduleId": "rag-llm-lcel",
  "order": 7,
  "title": "구조화된 답변 계약과 실패 처리",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "output contract",
    "structured output",
    "validation"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample01/01_basic_langchain.ipynb",
      "lines": 1050,
      "bytes": 78100,
      "sha256": "DA39C20AD9D8595EF62D86245DC02707B6BB9987F57228711C4F6423F68166E2"
    }
  ],
  "sourceNotes": [
    "FastAPI 질문에 세 구획을 갖춘 장문 응답이 저장돼 있다.",
    "원본 예제 의도: prompt='①정의 ②이유 ③예시 순서로 답하라'"
  ],
  "expertNotes": [
    "문장 지시만 믿지 말고 JSON schema/Pydantic 검증과 retry를 보강한다."
  ],
  "prerequisiteSlugs": [
    "rag-006"
  ],
  "nextSlug": "rag-008"
});
