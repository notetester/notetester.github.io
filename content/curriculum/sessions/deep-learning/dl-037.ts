import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "dl-037",
  "slug": "dl-037",
  "courseId": "deep-learning",
  "moduleId": "dl-sequence-nlp",
  "order": 5,
  "title": "한국어 영화 리뷰 정제·토큰화",
  "level": "고급",
  "estimatedMinutes": 70,
  "concepts": [
    "NSMC",
    "Korean tokenization",
    "Okt",
    "stopwords"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-DL",
      "path": "ex12_네이버영화리뷰.ipynb",
      "lines": 687,
      "bytes": 33402,
      "sha256": "27916648EFDDD0C4FDFD166426BDAC05F65A3CFF1266CE15935A61831B4E6ABC"
    }
  ],
  "sourceNotes": [
    "정제 후 train 146,182/test 49,157, padded train 116,945×100이 출력된다.",
    "원본 예제 의도: tokens=okt.morphs(text,stem=True)"
  ],
  "expertNotes": [
    "형태소 분석기 버전·사전·전처리 규칙을 실험 자산으로 고정한다."
  ],
  "prerequisiteSlugs": [
    "dl-036"
  ],
  "nextSlug": "dl-038"
});
