import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-039",
  "slug": "dl-039",
  "courseId": "deep-learning",
  "moduleId": "dl-sequence-nlp",
  "order": 7,
  "title": "쇼핑 리뷰 20만 건 파이프라인",
  "level": "고급",
  "estimatedMinutes": 70,
  "concepts": [
    "shopping reviews",
    "Tokenizer",
    "data split"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex13_네이버 쇼핑 리뷰.ipynb",
      "lines": 532,
      "bytes": 26724,
      "sha256": "CB38CB4CCFF153900A9FCBA8A8D6C2235E9BD52130083DBCAAC9E37A61BFD0D4"
    }
  ],
  "sourceNotes": [
    "전체 200,000, train 159,951/test 39,995와 tokenizer 저장 경로가 출력된다.",
    "원본 예제 의도: train_X,test_X=train_test_split(texts,test_size=.2,stratify=labels,random_state=42)"
  ],
  "expertNotes": [
    "중복 리뷰·상품/작성자 누수를 그룹 분할로 점검해야 한다."
  ],
  "prerequisiteSlugs": [
    "dl-038"
  ],
  "nextSlug": "dl-040"
});
