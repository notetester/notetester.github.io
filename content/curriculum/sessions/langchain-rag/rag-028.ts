import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-028",
  "slug": "rag-028",
  "courseId": "langchain-rag",
  "moduleId": "rag-ui-production",
  "order": 1,
  "title": "Streamlit 입력 위젯과 앱 실행",
  "level": "기초",
  "estimatedMinutes": 50,
  "concepts": [
    "Streamlit",
    "widget",
    "app runtime"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample02/05_streamlit.py",
      "lines": 50,
      "bytes": 1915,
      "sha256": "64277E43E28DC035A3322999EBB05504F0FF91CF86CBA33BE0988FE6B8DFCC52"
    }
  ],
  "sourceNotes": [
    "테스트 앱 코드는 있으나 저장된 화면 캡처나 자동 실행 증거는 없다.",
    "원본 예제 의도: name=st.text_input('이름'); st.write(f'안녕하세요, {name}님!')"
  ],
  "expertNotes": [
    "UI 상태는 스크립트 재실행 모델로 동작한다는 점을 먼저 이해한다."
  ],
  "prerequisiteSlugs": [
    "rag-027"
  ],
  "nextSlug": "rag-029"
});
