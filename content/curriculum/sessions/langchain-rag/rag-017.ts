import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-017",
  "slug": "rag-017",
  "courseId": "langchain-rag",
  "moduleId": "rag-retrieval",
  "order": 5,
  "title": "OpenAI Embedding과 벡터 의미",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "embedding",
    "vector",
    "semantic similarity"
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
    "CSV/JSON/PDF에서 동일 embedding 모델로 FAISS index가 생성된다.",
    "원본 예제 의도: embeddings=OpenAIEmbeddings(model='text-embedding-3-small')"
  ],
  "expertNotes": [
    "embedding 모델 변경 시 기존 index를 재생성하고 버전을 기록한다."
  ],
  "prerequisiteSlugs": [
    "rag-016"
  ],
  "nextSlug": "rag-018"
});
