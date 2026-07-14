import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-002",
  "slug": "rag-002",
  "courseId": "langchain-rag",
  "moduleId": "rag-llm-lcel",
  "order": 2,
  "title": "환경 변수와 API 키 위생",
  "level": "입문",
  "estimatedMinutes": 35,
  "concepts": [
    "dotenv",
    "environment variable",
    "secret"
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
      "path": "requirements.txt",
      "lines": 9,
      "bytes": 128,
      "sha256": "17DF55CBB0FD4CAFBDA5EE201B1EA04587D0941721FFBEBDBC673BD024D5BECC"
    }
  ],
  "sourceNotes": [
    "노트북은 .env 로드를 사용한다. 실제 키 값은 공개 인벤토리에서 제거했다.",
    "원본 예제 의도: load_dotenv(); key=os.getenv('OPENAI_API_KEY')"
  ],
  "expertNotes": [
    "키를 출력·커밋하지 말고 서버 측 secret store에서 주입한다."
  ],
  "prerequisiteSlugs": [
    "rag-001"
  ],
  "nextSlug": "rag-003"
});
