import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-009",
  "slug": "rag-009",
  "courseId": "langchain-rag",
  "moduleId": "rag-memory",
  "order": 2,
  "title": "RunnableWithMessageHistory 세션 분리",
  "level": "중급",
  "estimatedMinutes": 60,
  "concepts": [
    "RunnableWithMessageHistory",
    "session_id",
    "ChatMessageHistory"
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
    "user_001의 질문·답 쌍이 순서대로 저장·출력된다.",
    "원본 예제 의도: chain_h.invoke({'input':q},config={'configurable':{'session_id':'user_001'}})"
  ],
  "expertNotes": [
    "저장소를 dict로만 두면 프로세스 재시작·다중 인스턴스에서 유실된다."
  ],
  "prerequisiteSlugs": [
    "rag-008"
  ],
  "nextSlug": "rag-010"
});
