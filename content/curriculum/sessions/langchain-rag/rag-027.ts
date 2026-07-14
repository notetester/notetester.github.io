import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-027",
  "slug": "rag-027",
  "courseId": "langchain-rag",
  "moduleId": "rag-retrieval",
  "order": 15,
  "title": "일반 LLM 대 RAG 통제 비교",
  "level": "고급",
  "estimatedMinutes": 60,
  "concepts": [
    "baseline",
    "groundedness",
    "comparison"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/04_RAG_VS_LLM.ipynb",
      "lines": 231,
      "bytes": 8119,
      "sha256": "9A8D2908489FF07F53D9287411307ABACB5EC788A50EC5B4D1CC698E99C4758D"
    }
  ],
  "sourceNotes": [
    "일반 LLM은 모호하게 답하지만 RAG는 '최대 8개'와 BitLocker 제약을 정확히 답하는 비교가 있다.",
    "원본 예제 의도: base=llm.invoke(q); grounded=rag_chain.invoke(q)"
  ],
  "expertNotes": [
    "한두 질문의 데모 대신 고정 평가셋과 blinded scoring을 만든다."
  ],
  "prerequisiteSlugs": [
    "rag-026"
  ],
  "nextSlug": "rag-028"
});
