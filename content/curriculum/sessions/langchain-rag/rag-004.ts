import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-004",
  "slug": "rag-004",
  "courseId": "langchain-rag",
  "moduleId": "rag-llm-lcel",
  "order": 4,
  "title": "PromptTemplate 변수 주입",
  "level": "기초",
  "estimatedMinutes": 45,
  "concepts": [
    "PromptTemplate",
    "template variable",
    "invoke"
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
    "topic=LangChain 실행 시 한 문장 정의가 실제 출력된다.",
    "원본 예제 의도: prompt=PromptTemplate.from_template(\"'{topic}'을 한 문장으로 설명\")"
  ],
  "expertNotes": [
    "템플릿 변수와 신뢰 경계를 분리하고 사용자가 system 지시를 덮지 못하게 한다."
  ],
  "prerequisiteSlugs": [
    "rag-003"
  ],
  "nextSlug": "rag-005"
});
