import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "docker-09-network-volume-compose",
  "slug": "docker-09-network-volume-compose",
  "courseId": "devops",
  "moduleId": "docker-images-containers",
  "order": 9,
  "title": "네트워크·볼륨·Compose로 로컬 통합 환경",
  "level": "고급",
  "estimatedMinutes": 100,
  "concepts": [
    "Docker network",
    "volume",
    "Compose",
    "service discovery"
  ],
  "localSources": [
    {
      "repository": "D:/dev/springboot",
      "path": "JPATest/compose.yaml",
      "lines": 11,
      "bytes": 225,
      "sha256": "0E0855F6381BC002DE4B62D9A9D06F6A959A2285E80A1228F83E91B7C5046983"
    }
  ],
  "sourceNotes": [
    "Actions 로그, 이미지 digest, 컨테이너 상태와 HTTP health check로 Docker network 산출물의 동일성을 확인한다.",
    "빌드 실패·인증 실패·배포 실패를 구분하고 이전 버전 서비스가 유지되거나 복구되는지 확인한다.",
    "원본 예제 의도: 네트워크·볼륨·Compose로 로컬 통합 환경를 최소 workflow/Dockerfile/배포 명령으로 구성하고 각 단계의 입력과 산출물을 표시한다.",
    "원본 예제 의도: volume 실패를 의도적으로 만들어 로그·종료 코드·재시도·롤백 동작을 검증한다."
  ],
  "expertNotes": [
    "CI는 검증 가능한 동일 산출물을 만들고 CD는 그 산출물의 승인·배포·관찰·복구를 통제해야 한다.",
    "장기 AWS 키와 SSH 비밀을 줄이고 OIDC, 최소 권한, digest 고정, provenance와 취약점 검사를 단계적으로 도입한다."
  ],
  "prerequisiteSlugs": [
    "docker-08-env-build-runtime"
  ],
  "nextSlug": "cicd-01-dockerhub-login-tag-push"
});
