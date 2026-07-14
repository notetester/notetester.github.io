import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-033",
  "slug": "dl-033",
  "courseId": "deep-learning",
  "moduleId": "dl-sequence-nlp",
  "order": 1,
  "title": "순차 데이터와 RNN 상태",
  "level": "중급",
  "estimatedMinutes": 50,
  "concepts": [
    "sequence",
    "RNN",
    "hidden state"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex10_순환 신경망(RNN)과 순차 데이터.ipynb",
      "lines": 263,
      "bytes": 876680,
      "sha256": "102B54894E1BD051D4457A6E2E2B05A3A8B8E709EF692402B1D7ADFDDED526B5"
    }
  ],
  "sourceNotes": [
    "순차 데이터·RNN·tanh·Flatten 불필요성이 설명돼 있다.",
    "원본 예제 의도: SimpleRNN(8,input_shape=(timesteps,features))"
  ],
  "expertNotes": [
    "긴 의존성에서 vanishing gradient가 생기는 이유를 보강한다."
  ],
  "prerequisiteSlugs": [
    "dl-032"
  ],
  "nextSlug": "dl-034"
});
