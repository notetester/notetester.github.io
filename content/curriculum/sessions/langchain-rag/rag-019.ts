import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-019",
  "slug": "rag-019",
  "courseId": "langchain-rag",
  "moduleId": "rag-retrieval",
  "order": 7,
  "title": "retriever k와 recall trade-off",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "retriever",
    "top-k",
    "recall"
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
    "상위 3개 문서를 사용해 수강료·환불·주차·취업 질문에 답했다.",
    "원본 예제 의도: retriever=vectordb.as_retriever(search_kwargs={'k':3})"
  ],
  "expertNotes": [
    "k는 3으로 고정하지 말고 recall@k와 context 비용을 함께 측정한다."
  ],
  "prerequisiteSlugs": [
    "rag-018"
  ],
  "nextSlug": "rag-020"
});
