import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-001",
  "slug": "rag-001",
  "courseId": "langchain-rag",
  "moduleId": "rag-llm-lcel",
  "order": 1,
  "title": "LLM 애플리케이션과 Prompt 역할",
  "level": "입문",
  "estimatedMinutes": 40,
  "concepts": [
    "LLM",
    "prompt",
    "system/user/assistant"
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
    "역할을 구분하는 이유와 여행 전문가 예시 응답이 저장돼 있다.",
    "원본 예제 의도: messages=[('system','친절한 교사'),('user','RAG가 뭐야?')]"
  ],
  "expertNotes": [
    "프롬프트는 보안 경계가 아니며 사용자 입력과 권한 검증을 대신하지 않는다."
  ],
  "prerequisiteSlugs": [
    "dl-040"
  ],
  "nextSlug": "rag-002"
});
