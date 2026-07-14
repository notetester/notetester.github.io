import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-012",
  "slug": "rag-012",
  "courseId": "langchain-rag",
  "moduleId": "rag-memory",
  "order": 5,
  "title": "Memory deprecation과 LangGraph 전환",
  "level": "고급",
  "estimatedMinutes": 45,
  "concepts": [
    "deprecation",
    "LangGraph persistence",
    "migration"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample01/01_basic_langchain.ipynb",
      "lines": 1050,
      "bytes": 78100,
      "sha256": "DA39C20AD9D8595EF62D86245DC02707B6BB9987F57228711C4F6423F68166E2"
    },
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample01/02_basic_memory.ipynb",
      "lines": 314,
      "bytes": 17108,
      "sha256": "7C6C7D570B78D79B95D5774DEE84FB7E663BE4E798AEFC724650228CE61BF7E1"
    }
  ],
  "sourceNotes": [
    "저장 출력에 LangGraph built-in persistence 사용 권고 경고가 실제로 있다.",
    "원본 예제 의도:  # RunnableWithMessageHistory 실행 시 deprecation warning 확인"
  ],
  "expertNotes": [
    "공개 자료에는 사용 버전과 최신 권장 API를 함께 표기해야 한다."
  ],
  "prerequisiteSlugs": [
    "rag-011"
  ],
  "nextSlug": "rag-013"
});
