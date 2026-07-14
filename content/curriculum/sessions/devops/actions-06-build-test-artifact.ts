import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "actions-06-build-test-artifact",
  "slug": "actions-06-build-test-artifact",
  "courseId": "devops",
  "moduleId": "actions-workflow-ci",
  "order": 6,
  "title": "빌드·테스트·artifact를 분리한 CI",
  "level": "고급",
  "estimatedMinutes": 100,
  "concepts": [
    "build",
    "test",
    "artifact",
    "retention"
  ],
  "localSources": [
    {
      "repository": "D:/dev/my-app04-cicd",
      "path": ".github/workflows/ci-cd.yml",
      "lines": 108,
      "bytes": 5141,
      "sha256": "F5C8B564368FF040B48C8275FEDC01D5BBB31C24C54D5E50C3710CB9CC4EECB6"
    },
    {
      "repository": "D:/dev/2026-myproject04-cicd",
      "path": ".github/workflows/ci-cd.yml",
      "lines": 74,
      "bytes": 2756,
      "sha256": "C35DF012731BB2F5C5E4B96D17BFCA012C07C726133532D9051279A5FDCFDD4C"
    }
  ],
  "sourceNotes": [
    "Actions 로그, 이미지 digest, 컨테이너 상태와 HTTP health check로 build 산출물의 동일성을 확인한다.",
    "빌드 실패·인증 실패·배포 실패를 구분하고 이전 버전 서비스가 유지되거나 복구되는지 확인한다.",
    "원본 예제 의도: 빌드·테스트·artifact를 분리한 CI를 최소 workflow/Dockerfile/배포 명령으로 구성하고 각 단계의 입력과 산출물을 표시한다.",
    "원본 예제 의도: test 실패를 의도적으로 만들어 로그·종료 코드·재시도·롤백 동작을 검증한다."
  ],
  "expertNotes": [
    "CI는 검증 가능한 동일 산출물을 만들고 CD는 그 산출물의 승인·배포·관찰·복구를 통제해야 한다.",
    "장기 AWS 키와 SSH 비밀을 줄이고 OIDC, 최소 권한, digest 고정, provenance와 취약점 검사를 단계적으로 도입한다."
  ],
  "prerequisiteSlugs": [
    "actions-05-checkout-runtime-cache"
  ],
  "nextSlug": "actions-07-matrix-needs-condition"
});
