export type CourseMeta = {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  description: string;
  color: string;
};

export const courseMeta: CourseMeta[] = [
  { id: "web", order: 1, title: "웹 문서와 브라우저", shortTitle: "HTML · CSS · XML", description: "문서 구조에서 레이아웃과 데이터 표현까지 브라우저의 기본 언어를 정확히 익힙니다.", color: "#e36f43" },
  { id: "javascript", order: 2, title: "JavaScript와 웹 상호작용", shortTitle: "JavaScript · DOM · jQuery", description: "언어 문법, 실행 모델, DOM 이벤트와 비동기 처리를 현대 JavaScript까지 연결합니다.", color: "#c75b39" },
  { id: "java", order: 3, title: "Java 언어와 객체지향", shortTitle: "Java · OOP · Collections", description: "타입과 제어 흐름부터 객체 모델, 컬렉션, 예외, 동시성까지 단계적으로 다룹니다.", color: "#2e7a73" },
  { id: "servlet-jsp", order: 4, title: "Servlet과 JSP 웹 개발", shortTitle: "HTTP · Servlet · JSP", description: "요청과 응답의 생명주기에서 세션, 필터, MVC 웹 애플리케이션까지 구현합니다.", color: "#276a65" },
  { id: "database", order: 5, title: "관계형 데이터베이스", shortTitle: "SQL · MySQL · Oracle", description: "데이터 모델링과 SQL에서 트랜잭션, 인덱스, 실행 계획까지 실습합니다.", color: "#3867a8" },
  { id: "spring", order: 6, title: "Spring 애플리케이션", shortTitle: "Core · MVC · Boot · Data", description: "IoC 컨테이너에서 MVC, MyBatis, JPA, 보안과 운영까지 하나의 흐름으로 연결합니다.", color: "#315b95" },
  { id: "react", order: 7, title: "React 프런트엔드", shortTitle: "Components · State · Router", description: "렌더링 모델과 상태 설계에서 서버 통신, 테스트와 성능 최적화까지 확장합니다.", color: "#7b58a5" },
  { id: "devops", order: 8, title: "인증과 CI/CD 배포", shortTitle: "JWT · Actions · Docker · AWS", description: "인증 위협 모델과 자동 빌드, 컨테이너 이미지, 클라우드 배포를 운영 관점으로 익힙니다.", color: "#66488d" },
  { id: "python", order: 9, title: "Python 언어와 데이터 처리", shortTitle: "Python · NumPy · pandas", description: "첫 실행부터 언어의 객체 모델, 파일과 테스트, 데이터 분석 도구까지 빈틈없이 학습합니다.", color: "#b07a22" },
  { id: "machine-learning", order: 10, title: "머신러닝", shortTitle: "전처리 · 모델 · 평가", description: "데이터 누수를 피하는 실험 설계에서 지도·비지도 학습과 모델 해석까지 다룹니다.", color: "#9a691d" },
  { id: "deep-learning", order: 11, title: "딥러닝", shortTitle: "Tensor · Neural Networks", description: "텐서와 역전파에서 CNN, 시퀀스, 전이학습과 학습 안정화까지 구현합니다.", color: "#845b22" },
  { id: "langchain-rag", order: 12, title: "LangChain과 RAG", shortTitle: "LLM · Retrieval · RAG", description: "프롬프트와 체인에서 수집, 청킹, 검색, 평가와 운영 가능한 RAG까지 설계합니다.", color: "#6f542c" },
  { id: "projects", order: 13, title: "프로젝트 아키텍처", shortTitle: "CareerTuner · LCB · TripTogether", description: "실전 프로젝트에서 재사용할 수 있는 설계, 협업, 보안과 운영 교훈을 추출합니다.", color: "#b0495a" },
];

export const courseMetaById = new Map(courseMeta.map((course) => [course.id, course]));
