import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-022",
  "slug": "rag-022",
  "courseId": "langchain-rag",
  "moduleId": "rag-retrieval",
  "order": 10,
  "title": "JSON RAG 체인과 메타데이터",
  "level": "중급",
  "estimatedMinutes": 60,
  "concepts": [
    "JSON RAG",
    "metadata",
    "domain mapping"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/02_RAG_JSON.ipynb",
      "lines": 393,
      "bytes": 13260,
      "sha256": "D16EDF1FB7CA98552504EB2B8E0BA6A729A128385B6068669D93E993C8A3304E"
    }
  ],
  "sourceNotes": [
    "AI 과정의 ML·scikit-learn·DL·PyTorch·LLM·프로젝트 항목과 강사 경력이 출력된다.",
    "원본 예제 의도: answer=rag_chain.invoke('AI 강좌 커리큘럼은?')"
  ],
  "expertNotes": [
    "검색 filter에 쓸 metadata와 사용자에게 보여 줄 citation metadata를 분리한다."
  ],
  "prerequisiteSlugs": [
    "rag-021"
  ],
  "nextSlug": "rag-023"
});
