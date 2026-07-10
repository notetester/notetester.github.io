export type GlossaryTerm = {
  term: string;
  english?: string;
  definition: string;
  lesson?: string;
};

export const glossaryTerms: GlossaryTerm[] = [
  { term: "DOM", english: "Document Object Model", definition: "브라우저가 HTML 문서를 자바스크립트로 읽고 바꿀 수 있도록 트리 형태의 객체로 표현한 것입니다.", lesson: "javascript-dom-events" },
  { term: "HTTP", english: "Hypertext Transfer Protocol", definition: "브라우저와 서버가 요청과 응답을 주고받을 때 사용하는 규칙입니다. 메서드, 주소, 헤더, 본문으로 메시지를 구성합니다.", lesson: "servlet-jsp-request-lifecycle" },
  { term: "세션", english: "Session", definition: "여러 HTTP 요청이 같은 사용자의 연속된 활동임을 서버가 식별하기 위한 상태 저장 방식입니다.", lesson: "servlet-jsp-request-lifecycle" },
  { term: "쿠키", english: "Cookie", definition: "브라우저가 도메인별로 보관했다가 요청과 함께 보내는 작은 문자열 데이터입니다. 세션 식별자나 사용자 설정에 자주 쓰입니다.", lesson: "jwt-auth-flow" },
  { term: "DI", english: "Dependency Injection", definition: "객체가 필요한 협력 객체를 직접 만들지 않고 외부에서 전달받게 하는 설계 방식입니다.", lesson: "spring-core-di" },
  { term: "IoC", english: "Inversion of Control", definition: "객체 생성과 생명주기 제어권을 애플리케이션 코드가 아니라 프레임워크가 맡는다는 뜻입니다.", lesson: "spring-core-di" },
  { term: "MVC", english: "Model View Controller", definition: "데이터·화면·요청 제어의 책임을 분리해 변경의 영향을 줄이는 애플리케이션 구조입니다.", lesson: "spring-mvc-request-flow" },
  { term: "ORM", english: "Object Relational Mapping", definition: "객체와 관계형 데이터베이스 테이블 사이의 변환 규칙을 정의해 SQL 작성 부담을 줄이는 기술입니다.", lesson: "jpa-entity-lifecycle" },
  { term: "영속성 컨텍스트", english: "Persistence Context", definition: "JPA가 조회한 엔티티의 상태와 변경을 추적하는 논리적 작업 공간입니다.", lesson: "jpa-entity-lifecycle" },
  { term: "트랜잭션", english: "Transaction", definition: "여러 데이터 변경을 모두 성공시키거나 모두 취소하는 하나의 작업 단위입니다.", lesson: "relational-sql-mysql-oracle" },
  { term: "정규화", english: "Normalization", definition: "중복과 갱신 이상을 줄이기 위해 데이터를 관계와 책임에 따라 여러 테이블로 나누는 과정입니다.", lesson: "relational-sql-mysql-oracle" },
  { term: "컴포넌트", english: "Component", definition: "React에서 화면의 한 부분과 그 동작을 캡슐화한 재사용 가능한 UI 단위입니다.", lesson: "react-components-state" },
  { term: "상태", english: "State", definition: "시간과 사용자 행동에 따라 바뀌며 화면을 다시 그리게 만드는 애플리케이션 데이터입니다.", lesson: "react-components-state" },
  { term: "JWT", english: "JSON Web Token", definition: "서명된 JSON 정보를 URL에 안전한 문자열로 표현한 토큰 형식입니다. 암호화와는 다른 개념입니다.", lesson: "jwt-auth-flow" },
  { term: "CI", english: "Continuous Integration", definition: "코드가 합쳐질 때마다 빌드와 테스트를 자동 수행해 문제를 일찍 찾는 방식입니다.", lesson: "github-actions-docker-aws" },
  { term: "CD", english: "Continuous Delivery / Deployment", definition: "검증된 결과물을 배포 가능한 상태로 유지하거나 실제 환경까지 자동 배포하는 방식입니다.", lesson: "github-actions-docker-aws" },
  { term: "컨테이너", english: "Container", definition: "애플리케이션과 실행에 필요한 환경을 하나의 격리된 단위로 묶은 것입니다.", lesson: "github-actions-docker-aws" },
  { term: "특성", english: "Feature", definition: "머신러닝 모델이 예측할 때 입력으로 사용하는 관측 가능한 값입니다.", lesson: "machine-learning-workflow" },
  { term: "레이블", english: "Label", definition: "지도학습에서 모델이 맞히도록 학습하는 정답 값입니다.", lesson: "machine-learning-workflow" },
  { term: "과적합", english: "Overfitting", definition: "학습 데이터는 잘 맞히지만 처음 보는 데이터에는 성능이 떨어지는 상태입니다.", lesson: "machine-learning-workflow" },
  { term: "손실 함수", english: "Loss Function", definition: "모델의 예측이 정답과 얼마나 다른지 하나의 수치로 나타내는 함수입니다.", lesson: "deep-learning-neural-network" },
  { term: "임베딩", english: "Embedding", definition: "문장이나 항목의 의미적 특징을 비교할 수 있도록 고정 길이 숫자 벡터로 표현한 것입니다.", lesson: "langchain-rag-pipeline" },
  { term: "벡터 데이터베이스", english: "Vector Database", definition: "임베딩 벡터 사이의 유사도를 빠르게 검색하도록 설계된 저장소입니다.", lesson: "langchain-rag-pipeline" },
  { term: "RAG", english: "Retrieval-Augmented Generation", definition: "질문과 관련된 근거 문서를 먼저 검색한 뒤 그 근거를 포함해 언어 모델이 답하게 하는 구조입니다.", lesson: "langchain-rag-pipeline" },
  { term: "청킹", english: "Chunking", definition: "긴 문서를 검색과 모델 입력에 적당한 작은 단위로 나누는 과정입니다.", lesson: "langchain-rag-pipeline" },
  { term: "DTO", english: "Data Transfer Object", definition: "계층이나 시스템 사이에서 전달할 데이터 모양을 명확하게 정의한 객체입니다.", lesson: "spring-mvc-request-flow" },
  { term: "리팩터링", english: "Refactoring", definition: "외부 동작은 유지하면서 코드 구조를 더 이해하기 쉽고 변경하기 좋게 개선하는 작업입니다.", lesson: "lcb-legacy-modernization" },
  { term: "도메인", english: "Domain", definition: "소프트웨어가 해결하려는 실제 업무 영역과 그 안의 규칙·용어·관계를 뜻합니다.", lesson: "triptogether-domain-collaboration" },
];
