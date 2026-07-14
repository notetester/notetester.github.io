import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-010",
  "slug": "dl-010",
  "courseId": "deep-learning",
  "moduleId": "dl-ann-dnn",
  "order": 10,
  "title": "optimizer·학습률·compile 계약",
  "level": "기초",
  "estimatedMinutes": 50,
  "concepts": [
    "optimizer",
    "learning rate",
    "compile"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex02_심층신경망(DNN).ipynb",
      "lines": 1092,
      "bytes": 552776,
      "sha256": "17FB8F8BB1AC5C6DE4B30FAD78BB1E029B0B9F8E19566A0622EF8906A3099DFB"
    }
  ],
  "sourceNotes": [
    "optimizer별 모델 구성과 Fashion-MNIST 훈련 이력이 있다.",
    "원본 예제 의도: model.compile(optimizer='adam',loss='sparse_categorical_crossentropy',metrics=['accuracy'])"
  ],
  "expertNotes": [
    "loss·output activation·label encoding 세 가지가 서로 호환돼야 한다."
  ],
  "prerequisiteSlugs": [
    "dl-009"
  ],
  "nextSlug": "dl-011"
});
