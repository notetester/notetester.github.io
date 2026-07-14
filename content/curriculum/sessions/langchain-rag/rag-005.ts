import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-005",
  "slug": "rag-005",
  "courseId": "langchain-rag",
  "moduleId": "rag-llm-lcel",
  "order": 5,
  "title": "ChatPromptTemplate과 few-shot",
  "level": "기초",
  "estimatedMinutes": 50,
  "concepts": [
    "few-shot",
    "message template",
    "style steering"
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
    "few-shot 요리 말투 예제와 파스타 답변이 저장돼 있다.",
    "원본 예제 의도: prompt=ChatPromptTemplate.from_messages([('system','요리 교사'),('user','{question}')])"
  ],
  "expertNotes": [
    "특정 실존 인물 모방보다 검증 가능한 스타일 속성을 명시한다."
  ],
  "prerequisiteSlugs": [
    "rag-004"
  ],
  "nextSlug": "rag-006"
});
