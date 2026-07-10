export type ProjectHighlight = {
  slug: string;
  name: string;
  role: string;
  description: string;
  concepts: string[];
  repository: string;
  portfolio?: string;
  lesson: string;
};

export const projectHighlights: ProjectHighlight[] = [
  {
    slug: "career-tuner",
    name: "CareerTuner",
    role: "AI 기반 커리어 분석 플랫폼",
    description: "추천·근거 검색·프롬프트 계약·관리자 운영처럼 대규모 제품에서 반복되는 설계 문제를 학습합니다.",
    concepts: ["계층형 백엔드", "RAG", "AI fallback", "관리자 UI", "멀티플랫폼"],
    repository: "https://github.com/notetester/CareerTunerPortfolio",
    portfolio: "https://notetester.github.io/CareerTunerPortfolio/",
    lesson: "career-tuner-architecture",
  },
  {
    slug: "lcb",
    name: "LCB",
    role: "레거시 영화 서비스와 현대화 포트폴리오",
    description: "오래된 Java·JSP·Spring 코드를 읽고 보안과 표현 계층을 분리해 안전한 정적 데모로 옮기는 과정을 살펴봅니다.",
    concepts: ["레거시 분석", "JSP", "Spring MVC", "보안 개선", "점진적 현대화"],
    repository: "https://github.com/notetester/LCB",
    portfolio: "https://notetester.github.io/LCBPortfolio/",
    lesson: "lcb-legacy-modernization",
  },
  {
    slug: "trip-together",
    name: "TripTogether",
    role: "여행 협업과 일정 도메인 플랫폼",
    description: "여행, 멤버, 일정, 권한이 서로 얽힐 때 도메인 규칙과 API 경계를 어떻게 잡는지 학습합니다.",
    concepts: ["도메인 모델링", "권한", "협업 상태", "API 계약", "포트폴리오 설명"],
    repository: "https://github.com/notetester/TripTogetherPortfolio",
    portfolio: "https://notetester.github.io/TripTogetherPortfolio/",
    lesson: "triptogether-domain-collaboration",
  },
];
