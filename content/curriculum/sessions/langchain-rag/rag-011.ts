import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-011",
  "slug": "rag-011",
  "courseId": "langchain-rag",
  "moduleId": "rag-memory",
  "order": 4,
  "title": "요약 Memory와 정보 손실",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "summary memory",
    "compression",
    "fact retention"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample01/03_basic_memory2.ipynb",
      "lines": 367,
      "bytes": 21805,
      "sha256": "0A81578700730695875412F39673AF7A8EC4CE1E8B5194436BAFF603373825ED"
    }
  ],
  "sourceNotes": [
    "가족 여행 대화를 요약해 유지하는 챗봇 응답이 저장돼 있다.",
    "원본 예제 의도: summary=llm.invoke(f'다음 대화를 요약: {history}')"
  ],
  "expertNotes": [
    "요약이 숫자·부정·사용자 선호를 왜곡하는지 회귀 테스트한다."
  ],
  "prerequisiteSlugs": [
    "rag-010"
  ],
  "nextSlug": "rag-012"
});
