import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "actions-07-matrix-needs-condition",
  "slug": "actions-07-matrix-needs-condition",
  "courseId": "devops",
  "moduleId": "actions-workflow-ci",
  "order": 7,
  "title": "matrix·needs·조건식으로 파이프라인 구성",
  "level": "고급",
  "estimatedMinutes": 100,
  "concepts": [
    "matrix",
    "needs",
    "if condition",
    "fail-fast"
  ],
  "localSources": [
    {
      "repository": "D:/dev/github-action-basic",
      "path": ".github/workflows/github-actions-demo.yaml",
      "lines": 35,
      "bytes": 1216,
      "sha256": "241EDA63B33CCBC446B1F6E2E7E9DDAD68485ECE4B2875B68BDDAF0E956A2C09"
    }
  ],
  "sourceNotes": [
    "Actions 로그, 이미지 digest, 컨테이너 상태와 HTTP health check로 matrix 산출물의 동일성을 확인한다.",
    "빌드 실패·인증 실패·배포 실패를 구분하고 이전 버전 서비스가 유지되거나 복구되는지 확인한다.",
    "원본 예제 의도: matrix·needs·조건식으로 파이프라인 구성를 최소 workflow/Dockerfile/배포 명령으로 구성하고 각 단계의 입력과 산출물을 표시한다.",
    "원본 예제 의도: needs 실패를 의도적으로 만들어 로그·종료 코드·재시도·롤백 동작을 검증한다."
  ],
  "expertNotes": [
    "CI는 검증 가능한 동일 산출물을 만들고 CD는 그 산출물의 승인·배포·관찰·복구를 통제해야 한다.",
    "장기 AWS 키와 SSH 비밀을 줄이고 OIDC, 최소 권한, digest 고정, provenance와 취약점 검사를 단계적으로 도입한다."
  ],
  "prerequisiteSlugs": [
    "actions-06-build-test-artifact"
  ],
  "nextSlug": "actions-08-permissions-concurrency"
});
