import type { Track } from "./types";

export const tracks: Track[] = [
  {
    id: "web",
    order: 1,
    label: "웹의 언어",
    shortLabel: "HTML · CSS · JS",
    description:
      "브라우저가 문서와 스타일, 동작을 해석하는 순서를 HTML부터 jQuery와 XML까지 연결합니다.",
    color: "#e36f43",
    icon: "01",
  },
  {
    id: "java",
    order: 2,
    label: "Java에서 JSP까지",
    shortLabel: "Java · Servlet · JSP",
    description:
      "문법과 객체지향에서 시작해 요청과 응답, 세션, JSP 렌더링이 이어지는 서버 흐름을 익힙니다.",
    color: "#2e7a73",
    icon: "02",
  },
  {
    id: "backend",
    order: 3,
    label: "데이터와 Spring",
    shortLabel: "SQL · MVC · MyBatis · JPA",
    description:
      "MySQL·Oracle의 관계형 모델을 Spring MVC, MyBatis, JPA와 연결해 데이터가 오가는 전체 경로를 봅니다.",
    color: "#3867a8",
    icon: "03",
  },
  {
    id: "frontend-devops",
    order: 4,
    label: "프런트엔드와 배포",
    shortLabel: "React · JWT · CI/CD · Docker",
    description:
      "React 앱의 상태와 인증부터 GitHub Actions, Docker Hub, AWS 배포까지 운영 흐름으로 확장합니다.",
    color: "#7b58a5",
    icon: "04",
  },
  {
    id: "ai",
    order: 5,
    label: "Python에서 RAG까지",
    shortLabel: "Python · ML · DL · LangChain",
    description:
      "Python 데이터 처리에서 머신러닝과 딥러닝을 거쳐 검색 증강 생성 시스템의 구조까지 단계적으로 다룹니다.",
    color: "#b07a22",
    icon: "05",
  },
  {
    id: "projects",
    order: 6,
    label: "프로젝트에서 다시 배우기",
    shortLabel: "CareerTuner · LCB · TripTogether",
    description:
      "완성 프로젝트 안에서 인증, 추천, 레거시 개선, 협업 도메인 설계처럼 재사용 가능한 개념을 꺼내 봅니다.",
    color: "#b0495a",
    icon: "06",
  },
];

export const trackMap = Object.fromEntries(
  tracks.map((track) => [track.id, track]),
) as Record<Track["id"], Track>;
