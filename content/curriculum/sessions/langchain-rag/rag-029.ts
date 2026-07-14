import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-029",
  "slug": "rag-029",
  "courseId": "langchain-rag",
  "moduleId": "rag-ui-production",
  "order": 2,
  "title": "채팅 UI·session_state·초기화",
  "level": "중급",
  "estimatedMinutes": 60,
  "concepts": [
    "session_state",
    "chat_message",
    "chat_input"
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
    "이전 메시지 렌더링·초기화 버튼·브라우저 세션 기록 코드가 완성돼 있으나 저장 화면은 없다.",
    "원본 예제 의도: if 'messages' not in st.session_state: st.session_state.messages=[]"
  ],
  "expertNotes": [
    "세션 상태는 영구 저장이 아니며 사용자 간 격리를 검증한다."
  ],
  "prerequisiteSlugs": [
    "rag-028"
  ],
  "nextSlug": "rag-030"
});
