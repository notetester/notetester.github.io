import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-018",
  "slug": "rag-018",
  "courseId": "langchain-rag",
  "moduleId": "rag-retrieval",
  "order": 6,
  "title": "FAISS vector store 구축",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "FAISS",
    "vector index",
    "from_documents"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/01_RAG_CSV.ipynb",
      "lines": 281,
      "bytes": 8797,
      "sha256": "D06921F6DB0E60C4A2DE4BC553B1319A2F7B70662F872CD87C0E04FCCBBF41ED"
    },
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/02_RAG_JSON.ipynb",
      "lines": 393,
      "bytes": 13260,
      "sha256": "D16EDF1FB7CA98552504EB2B8E0BA6A729A128385B6068669D93E993C8A3304E"
    }
  ],
  "sourceNotes": [
    "15개 CSV와 11개 JSON 문서에 대해 index 생성 후 질의가 성공했다.",
    "원본 예제 의도: vectordb=FAISS.from_documents(docs,embeddings)"
  ],
  "expertNotes": [
    "메모리 index는 재시작 시 사라지므로 저장·로드·동시성 정책을 보강한다."
  ],
  "prerequisiteSlugs": [
    "rag-017"
  ],
  "nextSlug": "rag-019"
});
