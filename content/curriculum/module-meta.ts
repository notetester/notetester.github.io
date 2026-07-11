export type ModuleMeta = {
  courseId: string;
  id: string;
  order: number;
  title: string;
  description: string;
};

export const moduleMeta: ModuleMeta[] = [
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
