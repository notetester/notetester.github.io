export type ModuleMeta = {
  courseId: string;
  id: string;
  order: number;
  title: string;
  description: string;
};

export const moduleMeta: ModuleMeta[] = [
  { courseId: "web", id: "01-html-document-forms", order: 1, title: "HTML 문서·콘텐츠·폼", description: "문서 구조와 의미 있는 콘텐츠에서 링크·표·폼·접근 가능한 페이지까지 만듭니다." },
  { courseId: "web", id: "02-css-cascade-layout-responsive", order: 2, title: "CSS 캐스케이드·레이아웃·반응형", description: "선택자와 박스 모델에서 배치·Flexbox·모바일 우선 반응형 설계까지 확장합니다." },
  { courseId: "web", id: "03-xml-data-formats", order: 3, title: "XML과 데이터 형식", description: "well-formed XML 트리와 namespace·파싱을 익히고 JSON·YAML과 안전하게 비교합니다." },
  { courseId: "javascript", id: "01-javascript-dom-async", order: 1, title: "JavaScript·DOM·비동기", description: "언어 실행 모델과 DOM 이벤트에서 Promise·fetch·JSON/XML UI까지 연결합니다." },
  { courseId: "javascript", id: "02-jquery-legacy-migration", order: 2, title: "jQuery와 현대 DOM 전환", description: "jQuery 선택·조작·효과·AJAX를 이해하고 유지보수 가능한 현대 API로 옮깁니다." },
  { courseId: "java", id: "java-language-control", order: 1, title: "실행·자료형·제어문·배열", description: "소스와 JVM 실행 모델에서 기본형·연산·입력·분기·반복·배열까지 언어의 토대를 만듭니다." },
  { courseId: "java", id: "java-oop-design", order: 2, title: "객체지향 설계", description: "클래스와 객체의 상태·행동에서 캡슐화·상속·다형성·추상화와 인터페이스 설계까지 확장합니다." },
  { courseId: "java", id: "java-core-functional", order: 3, title: "예외·컬렉션·람다·Stream", description: "예외 경계와 generic collection을 익히고 함수형 인터페이스·람다·Stream 처리로 연결합니다." },
  { courseId: "java", id: "java-systems", order: 4, title: "I/O·네트워크·동시성·JDBC", description: "파일과 직렬화에서 socket·thread·동시성 제어·database 연결까지 시스템 경계를 다룹니다." },
  { courseId: "servlet-jsp", id: "servlet-http-lifecycle", order: 1, title: "Servlet과 HTTP 요청·응답", description: "Servlet 매핑과 생명주기에서 요청 파라미터·인코딩·forward·redirect·scope와 Front Controller까지 연결합니다." },
  { courseId: "servlet-jsp", id: "jsp-el-jstl-view", order: 2, title: "JSP·EL·JSTL 뷰", description: "JSP 변환과 내장 객체를 이해하고 scriptlet을 EL·JSTL 기반의 안전한 뷰 표현으로 옮깁니다." },
  { courseId: "servlet-jsp", id: "mvc-mybatis-capstone", order: 3, title: "MyBatis MVC CRUD와 방명록 진화", description: "Mapper·Command·Front Controller를 결합해 CRUD·트랜잭션·PRG·보안·multipart 업로드까지 발전시킵니다." },
  { courseId: "database", id: "db-foundation-ddl", order: 1, title: "관계 모델·DDL·무결성", description: "현실의 엔티티와 관계를 테이블로 옮기고 자료형·키·NULL·DEFAULT·제약조건으로 스키마 불변식을 만듭니다." },
  { courseId: "database", id: "db-query-foundations", order: 2, title: "SELECT·조건·함수·집계", description: "투영과 필터에서 NULL 3값 논리·문자·날짜 함수·GROUP BY와 집계 결과 계약까지 확장합니다." },
  { courseId: "database", id: "db-joins-subqueries", order: 3, title: "조인·서브쿼리·복합 조회", description: "카티션 곱을 출발점으로 inner/outer join, 상관·비상관 서브쿼리와 CTE·윈도 함수의 선택 기준을 익힙니다." },
  { courseId: "database", id: "db-programmability-performance", order: 4, title: "트랜잭션·프로그래밍·성능", description: "VIEW·프로시저·함수·트리거의 경계를 이해하고 ACID·격리·잠금·인덱스·실행 계획으로 운영 품질을 검증합니다." },
  { courseId: "database", id: "db-project-schema-portability", order: 5, title: "프로젝트 스키마·보안·이식성", description: "회원·여행·예약 도메인을 정규화하고 migration·secret hygiene와 MySQL·Oracle 차이를 명시적 이식 경계로 관리합니다." },
  { courseId: "spring", id: "jdbc-foundations", order: 1, title: "JDBC 연결·실행·매핑", description: "Driver·Connection부터 PreparedStatement·ResultSet·트랜잭션·pool·JdbcTemplate까지 데이터 접근의 물리 경계를 다룹니다." },
  { courseId: "spring", id: "mybatis-mapping", order: 2, title: "MyBatis 설정·Mapper·동적 SQL", description: "SqlSessionFactory와 interface/XML binding, parameter·result mapping, CRUD·동적 SQL·페이징·통합 테스트를 연결합니다." },
  { courseId: "spring", id: "spring-ioc-di-aop", order: 3, title: "Spring IoC·DI·빈 생명주기·AOP", description: "BeanDefinition과 생성자 주입에서 후보 선택·Java 설정·scope·lifecycle·proxy advice까지 객체 조립 원리를 익힙니다." },
  { courseId: "spring", id: "spring-mvc-request-response", order: 4, title: "Spring MVC 요청·응답", description: "DispatcherServlet에서 mapping·binding·validation·model·view·session·exception·interceptor까지 HTTP 경계를 구현합니다." },
  { courseId: "spring", id: "spring-layered-crud", order: 5, title: "계층형 CRUD 애플리케이션", description: "Controller·Service·Mapper 계층과 DTO·트랜잭션·검색·페이징·파일·보안·통합 테스트를 하나의 CRUD 흐름으로 묶습니다." },
  { courseId: "spring", id: "spring-boot-rest-integration", order: 6, title: "Spring Boot·REST·외부 연동", description: "자동 구성과 profile에서 REST 계약·validation·exception·HTTP client·설정·관측·배포 가능한 API까지 확장합니다." },
  { courseId: "spring", id: "spring-data-jpa", order: 7, title: "Spring Data JPA", description: "entity identity·연관관계·영속성 컨텍스트·dirty checking·Repository query·fetch·locking·transaction을 검증합니다." },
  { courseId: "react", id: "react-rendering-components", order: 1, title: "React 렌더링·컴포넌트", description: "JSX와 component·props·state를 pure render와 reconciliation 관점에서 이해하고 목록·조건·composition으로 확장합니다." },
  { courseId: "react", id: "react-events-forms-hooks", order: 2, title: "이벤트·폼·핵심 Hook", description: "event와 controlled form에서 useState·useEffect·useRef·memoization·custom Hook의 의존성 계약까지 다룹니다." },
  { courseId: "react", id: "react-state-management", order: 3, title: "상태 모델링·Context·reducer·Zustand", description: "local/shared/server state를 구분하고 Context·useReducer·Zustand의 update·selector·persistence·test 경계를 설계합니다." },
  { courseId: "react", id: "react-router-network", order: 4, title: "Router·Fetch·Axios·API 상태", description: "route·navigation·URL state와 HTTP request의 loading·error·cancel·retry·cache·authentication 흐름을 연결합니다." },
  { courseId: "react", id: "react-integrated-app-quality", order: 5, title: "통합 앱·테스트·성능·접근성", description: "인증·방명록 UI를 통합하고 component test·error boundary·profiling·accessibility·배포 품질로 완성합니다." },
  { courseId: "devops", id: "security-filter-authentication", order: 1, title: "Spring Security 인증·인가", description: "SecurityFilterChain·Authentication·PasswordEncoder·CSRF·CORS·method security를 threat model과 함께 구현합니다." },
  { courseId: "devops", id: "token-client-integration", order: 2, title: "Access·Refresh token과 React 연동", description: "JWT 발급·검증·rotation·storage·cookie·interceptor·logout·동시 갱신을 end-to-end 공격 시나리오로 검증합니다." },
  { courseId: "devops", id: "oauth-api-hardening", order: 3, title: "OAuth 연동·API 보안 강화", description: "Kakao·Naver authorization flow와 account linking, redirect·state·PKCE·rate limit·audit·secret rotation을 다룹니다." },
  { courseId: "devops", id: "actions-workflow-ci", order: 4, title: "GitHub Actions와 신뢰할 수 있는 CI", description: "workflow trigger·job·step·cache·artifact·matrix·permissions·OIDC·supply-chain policy로 재현 가능한 CI를 만듭니다." },
  { courseId: "devops", id: "docker-images-containers", order: 5, title: "Docker 이미지·컨테이너", description: "Dockerfile layer·build context·multi-stage·runtime user·network·volume·healthcheck·Compose와 image provenance를 검증합니다." },
  { courseId: "devops", id: "registry-ec2-deployment", order: 6, title: "Registry·AWS EC2 배포·운영", description: "Docker Hub image promotion에서 EC2 pull·secret·reverse proxy·TLS·zero-downtime·rollback·backup·observability까지 운영합니다." },
  { courseId: "python", id: "01-language-foundations", order: 1, title: "언어의 기본 모델", description: "실행·값·타입·문자열·컬렉션·조건을 Python의 객체 모델로 연결합니다." },
  { courseId: "python", id: "02-control-functions-io", order: 2, title: "제어 흐름·함수·파일", description: "반복과 함수 계약에서 파일·CSV·Excel·JSON 입출력 파이프라인까지 확장합니다." },
  { courseId: "python", id: "03-oop-stdlib", order: 3, title: "객체지향·모듈·표준 기능", description: "클래스와 상속, import 경계, 재현 가능한 난수와 표준 라이브러리를 다룹니다." },
  { courseId: "python", id: "04-reliability-tooling", order: 4, title: "견고성·타입·테스트", description: "예외, 정규식, 타입 힌트, 가상환경과 자동 테스트로 신뢰할 수 있는 프로그램을 만듭니다." },
];

export const moduleMetaByKey = new Map(moduleMeta.map((item) => [`${item.courseId}:${item.id}`, item]));

export function getModuleMeta(courseId: string, moduleId: string) {
  return moduleMetaByKey.get(`${courseId}:${moduleId}`);
}

export function getModuleTitle(courseId: string, moduleId: string) {
  return getModuleMeta(courseId, moduleId)?.title ?? moduleId.replace(/^\d+-/, "").replaceAll("-", " ");
}
