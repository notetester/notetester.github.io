import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "rag-010",
  "slug": "rag-010",
  "courseId": "langchain-rag",
  "moduleId": "rag-memory",
  "order": 3,
  "title": "최근 k개 Window Memory",
  "level": "중급",
  "estimatedMinutes": 55,
  "concepts": [
    "window memory",
    "context budget",
    "truncation"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026_LangChain_RAG",
      "path": "sample01/02_basic_memory.ipynb",
      "lines": 314,
      "bytes": 17108,
      "sha256": "7C6C7D570B78D79B95D5774DEE84FB7E663BE4E798AEFC724650228CE61BF7E1"
    }
  ],
  "sourceNotes": [
    "부산→수도→서울 인구→이전 여행지의 연속 응답과 k별 기억 한계가 저장돼 있다.",
    "원본 예제 의도: history.messages=history.messages[-k*2:]"
  ],
  "expertNotes": [
    "메시지 수가 아니라 토큰 수와 중요도를 기준으로 자르는 전략을 보강한다."
  ],
  "prerequisiteSlugs": [
    "rag-009"
  ],
  "nextSlug": "rag-011"
});
