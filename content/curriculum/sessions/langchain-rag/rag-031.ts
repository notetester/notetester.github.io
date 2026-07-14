import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-031",
  "slug": "rag-031",
  "courseId": "langchain-rag",
  "moduleId": "rag-ui-production",
  "order": 4,
  "title": "PDF 업로드·임시파일·동적 RAG UI",
  "level": "고급",
  "estimatedMinutes": 75,
  "concepts": [
    "file upload",
    "tempfile",
    "dynamic chunking",
    "session vectorstore"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/07_streamlit_rag_chat.py",
      "lines": 191,
      "bytes": 8305,
      "sha256": "0574DE4689AA92A67E54E88CFD0884EB2AC889745EA04B26549044B40995545A"
    }
  ],
  "sourceNotes": [
    "페이지·chunk 수 표시, chunk_size/overlap/k 슬라이더, vector DB 재로딩 코드가 완성돼 있다.",
    "원본 예제 의도: with NamedTemporaryFile(delete=False,suffix='.pdf') as f: ...\nfinally: os.unlink(tmp_path)"
  ],
  "expertNotes": [
    "파일 크기·MIME·악성 PDF 제한과 사용자별 index 격리를 추가한다."
  ],
  "prerequisiteSlugs": [
    "rag-030"
  ],
  "nextSlug": "rag-032"
});
