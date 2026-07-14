import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-015",
  "slug": "rag-015",
  "courseId": "langchain-rag",
  "moduleId": "rag-retrieval",
  "order": 3,
  "title": "CSVLoader와 행 단위 Document",
  "level": "기초",
  "estimatedMinutes": 55,
  "concepts": [
    "CSVLoader",
    "Document",
    "metadata"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/01_RAG_CSV.ipynb",
      "lines": 281,
      "bytes": 8797,
      "sha256": "D06921F6DB0E60C4A2DE4BC553B1319A2F7B70662F872CD87C0E04FCCBBF41ED"
    },
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "data/academy_faq.csv",
      "lines": 17,
      "bytes": 2066,
      "sha256": "2D78ED0F5EACF9AF13EBCF6ACCF27DB606D72975A6AA3E84A1CCFFEE80BE2B46"
    }
  ],
  "sourceNotes": [
    "FAQ 15개 문서가 로드되고 첫 내용·source·row metadata가 출력된다.",
    "원본 예제 의도: docs=CSVLoader(path,encoding='utf-8').load()"
  ],
  "expertNotes": [
    "행 구조가 의미 단위와 맞는지, 헤더가 본문에 어떻게 들어가는지 확인한다."
  ],
  "prerequisiteSlugs": [
    "rag-014"
  ],
  "nextSlug": "rag-016"
});
