import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-013",
  "slug": "rag-013",
  "courseId": "langchain-rag",
  "moduleId": "rag-retrieval",
  "order": 1,
  "title": "RAG가 필요한 이유와 한계",
  "level": "입문",
  "estimatedMinutes": 45,
  "concepts": [
    "RAG",
    "grounding",
    "hallucination"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/00_RAG.ipynb",
      "lines": 171,
      "bytes": 7942,
      "sha256": "CF7894CD9507492C1C8CB00508167FBBBDC7DE2A1A4013F9CAB043F9748C6E5E"
    }
  ],
  "sourceNotes": [
    "일반 LLM과 문서 기반 답변 차이가 개념 예시로 설명돼 있다.",
    "원본 예제 의도: answer = generate(question, retrieve(question))"
  ],
  "expertNotes": [
    "RAG는 검색된 문서가 틀리거나 부족하면 정확성을 보장하지 않는다."
  ],
  "prerequisiteSlugs": [
    "rag-012"
  ],
  "nextSlug": "rag-014"
});
