import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-032",
  "slug": "rag-032",
  "courseId": "langchain-rag",
  "moduleId": "rag-ui-production",
  "order": 5,
  "title": "RAG 품질·보안·운영 공백 감사",
  "level": "전문가",
  "estimatedMinutes": 75,
  "concepts": [
    "RAG evaluation",
    "prompt injection",
    "observability",
    "cost"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/00_RAG.ipynb",
      "lines": 171,
      "bytes": 7942,
      "sha256": "CF7894CD9507492C1C8CB00508167FBBBDC7DE2A1A4013F9CAB043F9748C6E5E"
    },
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/07_streamlit_rag_chat.py",
      "lines": 191,
      "bytes": 8305,
      "sha256": "0574DE4689AA92A67E54E88CFD0884EB2AC889745EA04B26549044B40995545A"
    }
  ],
  "sourceNotes": [
    "원본에는 retrieval/faithfulness 자동평가, 공격 테스트, 비용·지연 계측, 지속 index 운영 증거가 없다.",
    "원본 예제 의도: metrics={'retrieval_recall':None,'faithfulness':None,'answer_relevance':None}"
  ],
  "expertNotes": [
    "전문가 과정은 golden set, adversarial docs, PII redaction, rate limit, trace를 새로 구현해야 한다."
  ],
  "prerequisiteSlugs": [
    "rag-031"
  ],
  "nextSlug": "coach-001"
});
