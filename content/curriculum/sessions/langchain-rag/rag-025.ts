import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-025",
  "slug": "rag-025",
  "courseId": "langchain-rag",
  "moduleId": "rag-retrieval",
  "order": 13,
  "title": "유사도 점수와 검색 디버깅",
  "level": "고급",
  "estimatedMinutes": 60,
  "concepts": [
    "similarity score",
    "ranking",
    "retrieval debugging"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/03_RAG_PDF.ipynb",
      "lines": 398,
      "bytes": 14086,
      "sha256": "548E072DE91CEA485E2663AA8E14DBD3C460AD70DEB40CE35BA65B9975939063"
    }
  ],
  "sourceNotes": [
    "상위 점수 0.9743, 1.0590, 1.1236과 문서 일부가 출력된다.",
    "원본 예제 의도: for doc,score in vectordb.similarity_search_with_score('삼성전자',k=3): print(score)"
  ],
  "expertNotes": [
    "거리/유사도 방향은 vector store별로 달라 수치 의미를 확인한다."
  ],
  "prerequisiteSlugs": [
    "rag-024"
  ],
  "nextSlug": "rag-026"
});
