import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "docker-06-spring-jar-image",
  "slug": "docker-06-spring-jar-image",
  "courseId": "devops",
  "moduleId": "docker-images-containers",
  "order": 6,
  "title": "Spring Boot JAR 이미지와 JVM 실행",
  "level": "중급",
  "estimatedMinutes": 90,
  "concepts": [
    "JAR",
    "eclipse-temurin",
    "ENTRYPOINT",
    "port"
  ],
  "localSources": [
    {
      "repository": "D:/dev/springboot",
      "path": "MyProject03-cicd/Dockerfile",
      "lines": 8,
      "bytes": 292,
      "sha256": "77EF97ADD77F4C0098C87F93291399938600ECEF351644B3879FB639567BA807"
    },
    {
      "repository": "D:/dev/2026-myproject04-cicd",
      "path": "Dockerfile",
      "lines": 6,
      "bytes": 122,
      "sha256": "20734509A85BECC48CD934C78C01C9D4D8B1573A17C428DC6B24281C845F8D9D"
    },
    {
      "repository": "D:/dev/springboot",
      "path": "MyProject03-cicd/build.gradle",
      "lines": 41,
      "bytes": 1337,
      "sha256": "880565901855EB179C52276EEF4D833830B1A6F2586C5DBA489F2B266F83DF81"
    }
  ],
  "sourceNotes": [
    "Actions 로그, 이미지 digest, 컨테이너 상태와 HTTP health check로 JAR 산출물의 동일성을 확인한다.",
    "빌드 실패·인증 실패·배포 실패를 구분하고 이전 버전 서비스가 유지되거나 복구되는지 확인한다.",
    "원본 예제 의도: Spring Boot JAR 이미지와 JVM 실행를 최소 workflow/Dockerfile/배포 명령으로 구성하고 각 단계의 입력과 산출물을 표시한다.",
    "원본 예제 의도: eclipse-temurin 실패를 의도적으로 만들어 로그·종료 코드·재시도·롤백 동작을 검증한다."
  ],
  "expertNotes": [
    "CI는 검증 가능한 동일 산출물을 만들고 CD는 그 산출물의 승인·배포·관찰·복구를 통제해야 한다.",
    "장기 AWS 키와 SSH 비밀을 줄이고 OIDC, 최소 권한, digest 고정, provenance와 취약점 검사를 단계적으로 도입한다."
  ],
  "prerequisiteSlugs": [
    "docker-05-nginx-spa-routing"
  ],
  "nextSlug": "docker-07-nonroot-jre-healthcheck"
});
