import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "sec-16-secret-config-redaction",
  "slug": "security-20-secret-key-rotation-observability",
  "courseId": "devops",
  "moduleId": "oauth-api-hardening",
  "order": 5,
  "title": "secret·key rotation·redaction·security observability",
  "level": "고급",
  "estimatedMinutes": 220,
  "concepts": [
    "secret manager",
    "overlap key rotation",
    "configuration provenance",
    "redaction",
    "audit event",
    "security telemetry",
    "credential incident recovery"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-myproject04-cicd",
      "path": "src/main/resources/application.yaml",
      "lines": 42,
      "bytes": 1067,
      "sha256": "0D261E132D271707DA4B3285B1B09B3142CC6ECC92B403368213F7A1C76FCEC8"
    },
    {
      "repository": "D:/dev/REACT",
      "path": "docs/guide/02-security-and-actions-secrets.md",
      "lines": 47,
      "bytes": 2979,
      "sha256": "BA782A50E37F974098DC925EA2EA86F8DE0662262B281A140A670BD5676C79CD"
    }
  ],
  "sourceNotes": [
    "secret management 성공 시 주체와 권한이 SecurityContext 및 최종 응답에 정확히 반영되는지 확인한다.",
    "401과 403, 만료와 서명 실패, CSRF와 CORS 실패를 구분해 상태 코드·헤더·감사 로그를 검증한다.",
    "원본 예제 의도: DB·JWT·OAuth 비밀값을 프로필과 저장소로 분리의 정상·만료·변조·권한 부족 요청을 각각 만드는 보안 경계 예제를 구현한다.",
    "원본 예제 의도: environment variable 값을 로그에 노출하지 않으면서 필터·컨텍스트·응답 코드의 흐름을 추적한다."
  ],
  "expertNotes": [
    "JWT는 암호화된 세션이 아니라 서명된 주장 형식이며 수명·폐기·저장 위치·권한 검증 정책이 함께 있어야 한다.",
    "브라우저, API, OAuth 제공자 사이의 신뢰 경계를 명시하고 비밀값·개인정보·토큰은 예제와 로그에서 제거한다."
  ],
  "prerequisiteSlugs": [
    "security-19-api-rate-limit-abuse"
  ],
  "nextSlug": "security-21-full-security-capstone"
});
