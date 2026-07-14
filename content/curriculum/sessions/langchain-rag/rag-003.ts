import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-003",
  "slug": "rag-003",
  "courseId": "langchain-rag",
  "moduleId": "rag-llm-lcel",
  "order": 3,
  "title": "ChatOpenAI 모델과 temperature",
  "level": "기초",
  "estimatedMinutes": 45,
  "concepts": [
    "ChatOpenAI",
    "model",
    "temperature"
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
    "동일 여행 역할에서 temperature 설정과 장문 부산 일정 응답이 저장돼 있다.",
    "원본 예제 의도: llm=ChatOpenAI(model='gpt-4o-mini',temperature=0.7)"
  ],
  "expertNotes": [
    "정확성 업무는 재현성·평가를 우선하고 temperature만으로 품질을 설명하지 않는다."
  ],
  "prerequisiteSlugs": [
    "rag-002"
  ],
  "nextSlug": "rag-004"
});
