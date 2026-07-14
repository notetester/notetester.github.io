import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "sec-12-axios-bearer-401",
  "slug": "security-19-api-rate-limit-abuse",
  "courseId": "devops",
  "moduleId": "oauth-api-hardening",
  "order": 4,
  "title": "API rate limit·abuse case·cost와 distributed quota",
  "level": "고급",
  "estimatedMinutes": 220,
  "concepts": [
    "rate limiting",
    "token bucket",
    "abuse case",
    "Retry-After",
    "distributed counter",
    "resource cost budget",
    "fair client recovery"
  ],
  "localSources": [
    {
      "repository": "D:/dev/my-app03",
      "path": "src/api/Http.jsx",
      "lines": 18,
      "bytes": 872,
      "sha256": "AF76567C8C1C44235F58A126BB281EFFBD7955B5EC06E0F7170B765C852C8987"
    }
  ],
  "sourceNotes": [
    "Axios interceptor 성공 시 주체와 권한이 SecurityContext 및 최종 응답에 정확히 반영되는지 확인한다.",
    "401과 403, 만료와 서명 실패, CSRF와 CORS 실패를 구분해 상태 코드·헤더·감사 로그를 검증한다.",
    "원본 예제 의도: Axios Bearer 주입, 401 재발급과 동시 요청의 정상·만료·변조·권한 부족 요청을 각각 만드는 보안 경계 예제를 구현한다.",
    "원본 예제 의도: Bearer header 값을 로그에 노출하지 않으면서 필터·컨텍스트·응답 코드의 흐름을 추적한다."
  ],
  "expertNotes": [
    "JWT는 암호화된 세션이 아니라 서명된 주장 형식이며 수명·폐기·저장 위치·권한 검증 정책이 함께 있어야 한다.",
    "브라우저, API, OAuth 제공자 사이의 신뢰 경계를 명시하고 비밀값·개인정보·토큰은 예제와 로그에서 제거한다."
  ],
  "prerequisiteSlugs": [
    "security-18-account-linking-state-redirect"
  ],
  "nextSlug": "security-20-secret-key-rotation-observability"
});
