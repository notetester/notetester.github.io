import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";

export default createInventoryExpertSession({
  "inventoryId": "oauth-04-react-callback",
  "slug": "security-21-full-security-capstone",
  "courseId": "devops",
  "moduleId": "oauth-api-hardening",
  "order": 6,
  "title": "인증·JWT·OAuth·인가·운영 full security capstone",
  "level": "고급",
  "estimatedMinutes": 220,
  "concepts": [
    "threat model",
    "end-to-end authorization",
    "security regression",
    "incident containment",
    "credential rotation",
    "rollback reconciliation",
    "release evidence"
  ],
  "localSources": [
    {
      "repository": "D:/dev/2026-myapp05-cicd",
      "path": "src/pages/OAuthCallbackPage.jsx",
      "lines": 130,
      "bytes": 5315,
      "sha256": "769EEAADCBD5E3100E249F17B9D9B3399734E7A4E9B7328FA81A2899BED35F37"
    },
    {
      "repository": "D:/dev/2026-myapp05-cicd",
      "path": "src/api/Auth.jsx",
      "lines": 223,
      "bytes": 7688,
      "sha256": "F5A496CEB3D46F98AF6AA10469E599ABD9F8CC40D7AA3778BF27F46C87721A7E"
    }
  ],
  "sourceNotes": [
    "callback route 성공 시 주체와 권한이 SecurityContext 및 최종 응답에 정확히 반영되는지 확인한다.",
    "401과 403, 만료와 서명 실패, CSRF와 CORS 실패를 구분해 상태 코드·헤더·감사 로그를 검증한다.",
    "원본 예제 의도: React OAuth callback에서 code 교환·오류 처리의 정상·만료·변조·권한 부족 요청을 각각 만드는 보안 경계 예제를 구현한다.",
    "원본 예제 의도: code exchange 값을 로그에 노출하지 않으면서 필터·컨텍스트·응답 코드의 흐름을 추적한다."
  ],
  "expertNotes": [
    "JWT는 암호화된 세션이 아니라 서명된 주장 형식이며 수명·폐기·저장 위치·권한 검증 정책이 함께 있어야 한다.",
    "브라우저, API, OAuth 제공자 사이의 신뢰 경계를 명시하고 비밀값·개인정보·토큰은 예제와 로그에서 제거한다."
  ],
  "prerequisiteSlugs": [
    "security-20-secret-key-rotation-observability"
  ],
  "nextSlug": "actions-01-workflow-trigger"
});
