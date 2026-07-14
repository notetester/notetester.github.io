import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-021",
  "slug": "rag-021",
  "courseId": "langchain-rag",
  "moduleId": "rag-retrieval",
  "order": 9,
  "title": "CSV RAG 체인 구성",
  "level": "중급",
  "estimatedMinutes": 60,
  "concepts": [
    "RunnablePassthrough",
    "retriever chain",
    "Q&A"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/01_RAG_CSV.ipynb",
      "lines": 281,
      "bytes": 8797,
      "sha256": "D06921F6DB0E60C4A2DE4BC553B1319A2F7B70662F872CD87C0E04FCCBBF41ED"
    }
  ],
  "sourceNotes": [
    "수강료 월 35/45/55만원과 환불 규정이 실제 답변으로 출력된다.",
    "원본 예제 의도: rag_chain={'content':retriever,'question':RunnablePassthrough()} | prompt | llm"
  ],
  "expertNotes": [
    "Document 목록을 문자열로 포맷하는 과정과 출처 표시를 명시해야 한다."
  ],
  "prerequisiteSlugs": [
    "rag-020"
  ],
  "nextSlug": "rag-022"
});
