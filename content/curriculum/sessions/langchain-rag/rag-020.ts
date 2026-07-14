import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-020",
  "slug": "rag-020",
  "courseId": "langchain-rag",
  "moduleId": "rag-retrieval",
  "order": 8,
  "title": "Grounded prompt와 모름 처리",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "grounded generation",
    "fallback",
    "context"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/01_RAG_CSV.ipynb",
      "lines": 281,
      "bytes": 8797,
      "sha256": "D06921F6DB0E60C4A2DE4BC553B1319A2F7B70662F872CD87C0E04FCCBBF41ED"
    }
  ],
  "sourceNotes": [
    "FAQ 안 질문은 근거로 답하고 정보 부족 시 문의 경로를 안내하는 출력이 있다.",
    "원본 예제 의도: prompt='FAQ에 없는 내용은 상담전화로 안내하라.\\n{content}\\n{question}'"
  ],
  "expertNotes": [
    "모름 처리 준수율을 별도 테스트하고 context의 지시문은 데이터로 취급한다."
  ],
  "prerequisiteSlugs": [
    "rag-019"
  ],
  "nextSlug": "rag-021"
});
