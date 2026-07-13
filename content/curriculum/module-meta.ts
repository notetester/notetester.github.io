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
