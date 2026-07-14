import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-006",
  "slug": "rag-006",
  "courseId": "langchain-rag",
  "moduleId": "rag-llm-lcel",
  "order": 6,
  "title": "LCEL 파이프와 StrOutputParser",
  "level": "기초",
  "estimatedMinutes": 50,
  "concepts": [
    "LCEL",
    "Runnable",
    "StrOutputParser"
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
    "AIMessage가 아닌 문자열이 출력되는 기본 체인이 실행됐다.",
    "원본 예제 의도: chain=prompt | llm | StrOutputParser()\ntext=chain.invoke({'topic':'LangChain'})"
  ],
  "expertNotes": [
    "각 단계의 입력·출력 타입을 추적하면 체인 오류를 빠르게 찾는다."
  ],
  "prerequisiteSlugs": [
    "rag-005"
  ],
  "nextSlug": "rag-007"
});
