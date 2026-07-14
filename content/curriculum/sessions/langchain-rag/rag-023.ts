import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-023",
  "slug": "rag-023",
  "courseId": "langchain-rag",
  "moduleId": "rag-retrieval",
  "order": 11,
  "title": "PyPDFLoader 페이지 단위 로드",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "PyPDFLoader",
    "page",
    "PDF extraction"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/03_RAG_PDF.ipynb",
      "lines": 398,
      "bytes": 14086,
      "sha256": "548E072DE91CEA485E2663AA8E14DBD3C460AD70DEB40CE35BA65B9975939063"
    },
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "data/Samsung_Card_Manual_Korean_1.3.pdf",
      "lines": 3339,
      "bytes": 682030,
      "sha256": "19277B37014F76B1764E6B48CBD4F697C5CD9A436B9FB5762EFD4EC81F8E9D3B"
    }
  ],
  "sourceNotes": [
    "삼성 매뉴얼 총 6페이지가 로드되고 page metadata가 출력된다.",
    "원본 예제 의도: pages=PyPDFLoader(pdf_path).load()"
  ],
  "expertNotes": [
    "스캔 PDF·표·다단 문서에는 OCR/layout-aware parser가 필요할 수 있다."
  ],
  "prerequisiteSlugs": [
    "rag-022"
  ],
  "nextSlug": "rag-024"
});
