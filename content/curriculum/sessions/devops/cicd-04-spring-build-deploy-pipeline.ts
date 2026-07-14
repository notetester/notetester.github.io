import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "cicd-04-spring-build-deploy-pipeline",
  "slug": "cicd-04-spring-build-deploy-pipeline",
  "courseId": "devops",
  "moduleId": "registry-ec2-deployment",
  "order": 4,
  "title": "Gradle JAR→Docker→EC2 Spring Boot 파이프라인",
  "level": "고급",
  "estimatedMinutes": 115,
  "concepts": [
    "Gradle build",
    "JAR",
    "backend image",
    "port 8080"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-myproject04-cicd",
      "path": ".github/workflows/ci-cd.yml",
      "lines": 74,
      "bytes": 2756,
      "sha256": "C35DF012731BB2F5C5E4B96D17BFCA012C07C726133532D9051279A5FDCFDD4C"
    },
    {
      "repository": "D:/dev/2026-myproject04-cicd",
      "path": "Dockerfile",
      "lines": 6,
      "bytes": 122,
      "sha256": "20734509A85BECC48CD934C78C01C9D4D8B1573A17C428DC6B24281C845F8D9D"
    }
  ],
  "sourceNotes": [
    "Actions 로그, 이미지 digest, 컨테이너 상태와 HTTP health check로 Gradle build 산출물의 동일성을 확인한다.",
    "빌드 실패·인증 실패·배포 실패를 구분하고 이전 버전 서비스가 유지되거나 복구되는지 확인한다.",
    "원본 예제 의도: Gradle JAR→Docker→EC2 Spring Boot 파이프라인를 최소 workflow/Dockerfile/배포 명령으로 구성하고 각 단계의 입력과 산출물을 표시한다.",
    "원본 예제 의도: JAR 실패를 의도적으로 만들어 로그·종료 코드·재시도·롤백 동작을 검증한다."
  ],
  "expertNotes": [
    "CI는 검증 가능한 동일 산출물을 만들고 CD는 그 산출물의 승인·배포·관찰·복구를 통제해야 한다.",
    "장기 AWS 키와 SSH 비밀을 줄이고 OIDC, 최소 권한, digest 고정, provenance와 취약점 검사를 단계적으로 도입한다."
  ],
  "prerequisiteSlugs": [
    "cicd-03-react-build-deploy-pipeline"
  ],
  "nextSlug": "cicd-05-env-transfer-ec2"
});
