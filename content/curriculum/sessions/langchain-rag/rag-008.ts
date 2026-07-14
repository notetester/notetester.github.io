import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-008",
  "slug": "rag-008",
  "courseId": "langchain-rag",
  "moduleId": "rag-memory",
  "order": 1,
  "title": "전체 Buffer Memory 원리",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "ConversationBufferMemory",
    "history",
    "MessagesPlaceholder"
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
    "부산 추천 뒤 '그 근처 맛집'을 이어 묻고 전체 Human/AI history가 출력된다.",
    "원본 예제 의도: history=memory.load_memory_variables({})['history']; memory.save_context({'input':q},{'output':a})"
  ],
  "expertNotes": [
    "대화 전체를 프롬프트에 넣으면 비용·지연·개인정보가 누적된다."
  ],
  "prerequisiteSlugs": [
    "rag-007"
  ],
  "nextSlug": "rag-009"
});
