import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-014",
  "slug": "rag-014",
  "courseId": "langchain-rag",
  "moduleId": "rag-retrieval",
  "order": 2,
  "title": "RAG 5단계 파이프라인",
  "level": "기초",
  "estimatedMinutes": 50,
  "concepts": [
    "load",
    "split",
    "embed",
    "retrieve",
    "generate"
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
      "path": "image/RAG.png",
      "lines": 78,
      "bytes": 50231,
      "sha256": "75820F5379EE60184570DA5F1007C459ABEA86E7689933D8F02CC9B54FD95055"
    }
  ],
  "sourceNotes": [
    "RAG 흐름 그림과 핵심 효과가 저장돼 있다.",
    "원본 예제 의도: docs=load(); chunks=split(docs); index=embed(chunks); context=retrieve(q); answer=generate(q,context)"
  ],
  "expertNotes": [
    "각 단계별 독립 지표와 실패 로그를 남겨야 병목을 찾을 수 있다."
  ],
  "prerequisiteSlugs": [
    "rag-013"
  ],
  "nextSlug": "rag-015"
});
