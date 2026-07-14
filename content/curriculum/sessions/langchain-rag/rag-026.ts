import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-026",
  "slug": "rag-026",
  "courseId": "langchain-rag",
  "moduleId": "rag-retrieval",
  "order": 14,
  "title": "PDF RAG 답변과 출처 추적",
  "level": "고급",
  "estimatedMinutes": 65,
  "concepts": [
    "PDF RAG",
    "citation",
    "source metadata"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/03_RAG_PDF.ipynb",
      "lines": 398,
      "bytes": 14086,
      "sha256": "548E072DE91CEA485E2663AA8E14DBD3C460AD70DEB40CE35BA65B9975939063"
    }
  ],
  "sourceNotes": [
    "동시 최대 8개 카드, BitLocker 활성 장치 인증 불가 답변과 검색 페이지 출처가 출력된다.",
    "원본 예제 의도: docs=retriever.invoke(q); answer=rag_chain.invoke(q)"
  ],
  "expertNotes": [
    "답변 문장별 근거 매핑과 인용 검증은 추가 보강이 필요하다."
  ],
  "prerequisiteSlugs": [
    "rag-025"
  ],
  "nextSlug": "rag-027"
});
