import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-030",
  "slug": "rag-030",
  "courseId": "langchain-rag",
  "moduleId": "rag-ui-production",
  "order": 3,
  "title": "LLM 스트리밍 응답",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "streaming",
    "chunk",
    "incremental rendering"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/06_streamlit_chat.py",
      "lines": 77,
      "bytes": 2815,
      "sha256": "B3409FCB8174FDA92D5C70D651A4680B7836BC4B6A84499047E8BC4685D80775"
    }
  ],
  "sourceNotes": [
    "청크 누적 렌더링 코드가 있으나 latency·중단·오류 실행 증거는 없다.",
    "원본 예제 의도: for chunk in llm.stream(history): full+=chunk.content; placeholder.markdown(full)"
  ],
  "expertNotes": [
    "취소·timeout·부분 응답·재시도 시 중복 표시를 설계한다."
  ],
  "prerequisiteSlugs": [
    "rag-029"
  ],
  "nextSlug": "rag-031"
});
