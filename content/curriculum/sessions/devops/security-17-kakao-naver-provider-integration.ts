import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "oauth-03-kakao-naver-provider",
  "slug": "security-17-kakao-naver-provider-integration",
  "courseId": "devops",
  "moduleId": "oauth-api-hardening",
  "order": 2,
  "title": "Kakao·Naver provider adapter와 canonical identity",
  "level": "고급",
  "estimatedMinutes": 220,
  "concepts": [
    "provider adapter",
    "authorization token exchange",
    "canonical provider subject",
    "profile schema",
    "scope minimization",
    "unlink webhook",
    "provider outage contract"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-myproject04-cicd",
      "path": "src/main/java/com/study/myproject02/members/service/KakaoOAuthService.java",
      "lines": 97,
      "bytes": 4065,
      "sha256": "9C7A55CF9972E4D5DF4661123A66D93CDC20B002CCAF6572A57A44352F364D91"
    },
    {
      "repository": "D:/dev/2026-myproject04-cicd",
      "path": "src/main/java/com/study/myproject02/members/service/NaverOAuthService.java",
      "lines": 88,
      "bytes": 3586,
      "sha256": "EFF0B45A481AD39989B9D878CAAA01CA06E2CC47ADA2701D7F6A6C4ED2FED23D"
    },
    {
      "repository": "D:/dev/2026-myapp05-cicd",
      "path": "src/pages/OAuthCallbackPage.jsx",
      "lines": 130,
      "bytes": 5315,
      "sha256": "769EEAADCBD5E3100E249F17B9D9B3399734E7A4E9B7328FA81A2899BED35F37"
    }
  ],
  "sourceNotes": [
    "provider adapter 성공 시 주체와 권한이 SecurityContext 및 최종 응답에 정확히 반영되는지 확인한다.",
    "401과 403, 만료와 서명 실패, CSRF와 CORS 실패를 구분해 상태 코드·헤더·감사 로그를 검증한다.",
    "원본 예제 의도: Kakao·Naver 공급자 응답을 공통 사용자로 매핑의 정상·만료·변조·권한 부족 요청을 각각 만드는 보안 경계 예제를 구현한다.",
    "원본 예제 의도: user info 값을 로그에 노출하지 않으면서 필터·컨텍스트·응답 코드의 흐름을 추적한다."
  ],
  "expertNotes": [
    "JWT는 암호화된 세션이 아니라 서명된 주장 형식이며 수명·폐기·저장 위치·권한 검증 정책이 함께 있어야 한다.",
    "브라우저, API, OAuth 제공자 사이의 신뢰 경계를 명시하고 비밀값·개인정보·토큰은 예제와 로그에서 제거한다."
  ],
  "prerequisiteSlugs": [
    "security-16-oauth-authorization-code-pkce"
  ],
  "nextSlug": "security-18-account-linking-state-redirect"
});
