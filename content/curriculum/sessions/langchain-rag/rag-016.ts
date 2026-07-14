import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-016",
  "slug": "rag-016",
  "courseId": "langchain-rag",
  "moduleId": "rag-retrieval",
  "order": 4,
  "title": "JSON을 도메인 Document로 변환",
  "level": "중급",
  "estimatedMinutes": 60,
  "concepts": [
    "JSON",
    "Document",
    "metadata design"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/02_RAG_JSON.ipynb",
      "lines": 393,
      "bytes": 13260,
      "sha256": "D16EDF1FB7CA98552504EB2B8E0BA6A729A128385B6068669D93E993C8A3304E"
    },
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "data/academy_info.json",
      "lines": 86,
      "bytes": 3245,
      "sha256": "02EA5D518F76E271EF3A54B6358A7ABB6D546763A286D02C1E3CBB8489F69D96"
    }
  ],
  "sourceNotes": [
    "학원·강좌·강사·시설·할인·취업 정보 11개 문서가 생성·출력된다.",
    "원본 예제 의도: docs.append(Document(page_content=content,metadata={'section':'강좌','강좌명':name}))"
  ],
  "expertNotes": [
    "중첩 JSON은 기술적 노드가 아니라 검색할 의미 단위로 평탄화한다."
  ],
  "prerequisiteSlugs": [
    "rag-015"
  ],
  "nextSlug": "rag-017"
});
