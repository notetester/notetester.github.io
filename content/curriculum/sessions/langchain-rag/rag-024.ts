import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-024",
  "slug": "rag-024",
  "courseId": "langchain-rag",
  "moduleId": "rag-retrieval",
  "order": 12,
  "title": "RecursiveCharacterTextSplitter",
  "level": "중급",
  "estimatedMinutes": 60,
  "concepts": [
    "chunking",
    "chunk_size",
    "overlap"
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
    "6페이지가 9개 chunk로 분할됐다는 결과가 있다.",
    "원본 예제 의도: splitter=RecursiveCharacterTextSplitter(chunk_size=500,chunk_overlap=100)"
  ],
  "expertNotes": [
    "문자 수가 아닌 토큰·제목·문단 구조에 맞춘 실험을 추가한다."
  ],
  "prerequisiteSlugs": [
    "rag-023"
  ],
  "nextSlug": "rag-025"
});
