import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-027",
  "slug": "dl-027",
  "courseId": "deep-learning",
  "moduleId": "dl-cnn",
  "order": 10,
  "title": "합성곱 가중치 시각화",
  "level": "고급",
  "estimatedMinutes": 55,
  "concepts": [
    "filter visualization",
    "weights",
    "activation"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex08_전이학습 전 합성곱 신경망의 시각화.ipynb",
      "lines": 294,
      "bytes": 944244,
      "sha256": "D3F07C92379E588FC2AC4AD0DCC30248E3A851D5A8DE54F743AE6961F40C70BF"
    },
    {
      "repository": "D:/dev/2026-DL",
      "path": "best-cnn-model2.keras",
      "lines": 12491,
      "bytes": 4041838,
      "sha256": "A21366A4BE2A702C46862934A6253C737ACE30E053CE14B1FA848CF4C7CA9495"
    }
  ],
  "sourceNotes": [
    "첫 Conv shape (3,3,1,32), 둘째 Conv (3,3,32,64)와 필터 그림이 있다.",
    "원본 예제 의도: filters,bias=model.layers[0].get_weights()"
  ],
  "expertNotes": [
    "가중치 그림만으로 의미를 단정하지 말고 activation map과 함께 본다."
  ],
  "prerequisiteSlugs": [
    "dl-026"
  ],
  "nextSlug": "dl-028"
});
