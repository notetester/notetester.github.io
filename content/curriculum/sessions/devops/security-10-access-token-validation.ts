import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localValidation = ["local-jwt-util", "local-jwt-filter", "local-jwt-config", "local-security-config", "local-build"];

const topics = [
  appliedTopic({
    id: "access-source-validation-audit",
    title: "로컬 access-token path를 extraction→principal까지 값 없이 감사합니다",
    lead: "custom filter, parser, SecurityContext와 request policy를 연결해 어느 단계가 header 형식, signature, claims, account 상태와 authorities를 검증하는지 capability matrix로 복원합니다.",
    mechanism: "2026-07-14 snapshot은 Bearer extraction, JJWT signature/expiration parsing, subject 기반 Authentication 생성과 empty authorities를 보여 줍니다. issuer, audience, explicit type, jti, access/refresh profile 분리와 authorization mapping은 이 path에서 구조적으로 확인되지 않았습니다.",
    workflow: "source hash→credential extraction→profile selection→key/signature→claims→principal/account lookup→authorities→request/method/object policy→failure response/log sinks를 추적합니다.",
    invariants: "실제 header, token, subject, route, payload, endpoint와 config 값을 복사하지 않고 관찰된 source behavior와 목표 architecture를 분리합니다.",
    edgeCases: "missing/malformed/multiple headers, wrong token kind, disabled account, stale authorities, async/error dispatch, preflight, committed response와 parser outage를 포함합니다.",
    failureModes: "signature가 맞고 subject가 있다는 사실만으로 access를 허용하면 다른 issuer/audience/token kind, disabled user와 empty-authority 정책 gap을 놓칩니다.",
    verification: "source hashes와 stage별 positive/negative corpus, context/chain/response/log assertions를 독립적으로 재현합니다.",
    operations: "token 원문이 아닌 stage/reason/profile/policy revision과 context outcome만 bounded telemetry로 남깁니다.",
    concepts: [
      c("validation surface", "access credential이 HTTP에서 authorization principal로 바뀌는 모든 enforcement 단계입니다.", ["단계별 owner를 둡니다.", "실패 결과를 분리합니다."]),
      c("principal projection", "검증된 claims와 현재 account/policy를 Authentication principal·authorities로 변환하는 과정입니다.", ["subject 복사와 다릅니다.", "권한 freshness를 설계합니다."]),
      c("validation gap", "필요한 profile rule이 source, config, test 또는 operations에서 enforcement되지 않는 상태입니다.", ["관찰 근거를 남깁니다.", "negative test로 닫습니다."]),
    ],
    codeExamples: [node("security10-source-audit", "sanitized access validation stage audit", "Security10SourceAudit.mjs", "로컬 snapshot에서 확인한 validation stages와 gap을 실제 값 없이 표로 출력합니다.", String.raw`const stages = [
  ["extract-bearer", "observed"],
  ["verify-signature-expiry", "observed"],
  ["issuer-audience-type", "gap"],
  ["access-refresh-separation", "gap"],
  ["authority-mapping", "gap-empty"],
  ["credential-safe-logging", "risk"],
];
for (const row of stages) console.log(row.join("|"));
console.log("credential-values-copied=false");
console.log("snapshot-current-guidance=false");`, "extract-bearer|observed\nverify-signature-expiry|observed\nissuer-audience-type|gap\naccess-refresh-separation|gap\nauthority-mapping|gap-empty\ncredential-safe-logging|risk\ncredential-values-copied=false\nsnapshot-current-guidance=false", localValidation.concat(["local-jwt-learning", "local-security-learning", "local-integration-learning", "rfc7519", "rfc8725", "rfc9068", "rfc6750", "rfc7009", "rfc7662", "rfc8414", "spring-jwt", "spring-bearer", "spring-multitenancy", "owasp-jwt", "owasp-authorization", "owasp-session"]))],
  }),
  appliedTopic({
    id: "access-validation-pipeline",
    title: "access-token validation을 순서가 있는 fail-closed pipeline으로 만듭니다",
    lead: "decode와 validation을 구분하고 untrusted bytes를 bounded parsing한 뒤 trusted profile, algorithm/key, signature, claims와 principal을 순차적으로 확정합니다.",
    mechanism: "안전한 pipeline은 transport/extraction limits→syntax/header parse→expected profile/issuer configuration→algorithm/key selection→signature→required claims/types→time/audience→principal/authorities→authorization 순서이며 앞 단계 실패 시 뒤 단계 side effect가 없습니다.",
    workflow: "각 stage의 input/output/error code와 금지 side effect를 manifest에 적고 library exception을 stable security outcome으로 중앙 번역합니다.",
    invariants: "signature 전 decoded claims를 신뢰하지 않고 validation이 완전히 끝나기 전 SecurityContext를 설정하지 않으며 실패 request가 controller/DB mutation으로 진행하지 않습니다.",
    edgeCases: "oversized header, duplicate credential, malformed UTF-8/JSON, algorithm mismatch, key timeout, missing claim, stale account와 response already committed를 포함합니다.",
    failureModes: "catch-all filter가 parsing, expiry, key outage와 application bug를 모두 invalid token으로 바꾸면 outage 진단이 어렵고 직접 response write로 one-response invariant가 깨집니다.",
    verification: "stage별 fault injection에서 context=false, chain=0, commit=1, raw credential sink=0과 stable error mapping을 검증합니다.",
    operations: "stage·reason·issuer-profile·policy revision·latency를 기록하되 high-cardinality claims와 token bytes는 제외합니다.",
    concepts: [
      c("fail-closed pipeline", "필수 단계 하나라도 실패하면 principal/side effect 없이 거부하는 순차 검증 구조입니다.", ["단계 순서가 고정됩니다.", "failure owner가 하나입니다."]),
      c("decode", "encoded bytes를 구조로 해석하는 작업으로 authenticity를 증명하지 않습니다.", ["display와 validation을 구분합니다.", "bounded parsing을 적용합니다."]),
      c("stable failure code", "library exception 문자열과 분리된 versioned client/telemetry 분류입니다.", ["credential 정보를 담지 않습니다.", "recovery action과 연결합니다."]),
    ],
    codeExamples: [node("security10-pipeline", "fail-closed access validation pipeline", "Security10Pipeline.mjs", "stage 실패가 뒤 단계와 context 설정을 중단하는지 모델링합니다.", String.raw`const stages = ["extract", "profile", "key", "signature", "claims", "principal"];
function run(failAt) {
  const visited = [];
  for (const stage of stages) {
    visited.push(stage);
    if (stage === failAt) return "reject:" + stage + "|visited=" + visited.join(",") + "|context=false";
  }
  return "accept|visited=" + visited.join(",") + "|context=true";
}
console.log(run("signature"));
console.log(run("claims"));
console.log(run(null));`, "reject:signature|visited=extract,profile,key,signature|context=false\nreject:claims|visited=extract,profile,key,signature,claims|context=false\naccept|visited=extract,profile,key,signature,claims,principal|context=true", ["rfc8725", "rfc9068", "spring-jwt", "spring-bearer"])],
  }),
  appliedTopic({
    id: "access-profile-type-separation",
    title: "typ와 profile로 access token만 resource server에 통과시킵니다",
    lead: "유효한 서명이라는 공통점보다 intended use가 우선이며 resource server는 access-token profile 하나를 token 외부 configuration으로 고정합니다.",
    mechanism: "RFC 8725의 explicit typing과 mutually exclusive validation, RFC 9068의 at+jwt profile을 적용해 refresh, ID, logout과 service-specific token이 access verifier를 통과하지 못하게 합니다.",
    workflow: "accepted token kind→required typ→issuer/audience→algorithm/key→required/forbidden claims→lifetime→principal mapping을 versioned profile로 정의합니다.",
    invariants: "missing/wrong type와 다른 profile claims는 signature가 valid해도 reject되고 endpoint나 token claim이 verifier profile을 임의로 바꾸지 않습니다.",
    edgeCases: "legacy token without typ, application/jwt media type, nested JWT, multiple access profiles, gateway token exchange와 migration dual-accept를 포함합니다.",
    failureModes: "공통 parseToken이 subject만 반환하면 refresh token이나 다른 JWT kind가 access credential로 오용되는 cross-JWT confusion이 생길 수 있습니다.",
    verification: "issuer별 token-kind cross-product의 diagonal access fixtures만 accept하고 legacy 기간과 종료일을 telemetry로 검증합니다.",
    operations: "profile ID, accepted/rejected type category와 migration cohort만 기록하고 typ raw input은 bounded하게 다룹니다.",
    concepts: [
      c("access-token profile", "resource server가 허용하는 typ·issuer·audience·algorithm·claims·lifetime 규칙 집합입니다.", ["token 외부에서 선택합니다.", "version을 둡니다."]),
      c("explicit typing", "JWT kind를 protected typ와 상호 배타적 claims rules로 명확히 구분하는 방법입니다.", ["cross-kind confusion을 막습니다.", "legacy exception을 만료시킵니다."]),
    ],
    codeExamples: [node("security10-profile-matrix", "resource-server profile matrix", "Security10ProfileMatrix.mjs", "access verifier가 at+jwt와 resource audience 조합만 수용하는지 확인합니다.", String.raw`const tokens = [
  ["access", "at+jwt", "resource"],
  ["refresh", "refresh+jwt", "token-service"],
  ["identity", "id+jwt", "client"],
  ["wrong-audience", "at+jwt", "other-resource"],
];
function validate([name, typ, aud]) {
  return name + "|" + (typ === "at+jwt" && aud === "resource" ? "accept" : "reject");
}
for (const token of tokens) console.log(validate(token));`, "access|accept\nrefresh|reject\nidentity|reject\nwrong-audience|reject", ["rfc8725", "rfc9068", "local-jwt-util"])],
  }),
  appliedTopic({
    id: "access-issuer-audience-subject",
    title: "iss·aud·sub를 issuer-key-resource trust relation으로 검증합니다",
    lead: "claim 문자열 존재 여부가 아니라 expected issuer가 선택한 key로 서명됐고 현재 resource가 audience이며 subject가 profile의 principal 규칙에 맞는지 확인합니다.",
    mechanism: "iss는 expected exact value와 key configuration을 bind하고 aud는 array/string 형식을 엄격히 처리해 현재 resource identifier를 포함해야 합니다. sub는 issuer 안에서 principal을 식별하지만 tenant/account status/authorization을 자동 증명하지 않습니다.",
    workflow: "request surface→trusted issuer profile→issuer-specific key set→signature→exact iss→aud membership→subject syntax/lookup→current account/policy 순서로 처리합니다.",
    invariants: "issuer를 token 값만으로 무제한 신뢰하지 않고 issuer별 key set을 섞지 않으며 audience 누락/불일치와 wrong-type claims를 coercion 없이 거부합니다.",
    edgeCases: "aud string/array, multiple resources, case/trailing slash, issuer alias, subject reassignment, deleted/disabled account, multi-tenant namespace와 pairwise subject를 포함합니다.",
    failureModes: "signature만 확인하고 aud를 생략하면 한 API용 token이 다른 API에서 replay되고, sub를 database authority로 직접 믿으면 계정 상태와 권한 변경이 반영되지 않습니다.",
    verification: "wrong issuer/key/audience, missing/array/type mismatch, disabled/deleted principal과 cross-tenant matrix를 실행합니다.",
    operations: "issuer/profile와 audience class, account resolution outcome만 low-cardinality로 남기고 subject 원문은 log하지 않습니다.",
    concepts: [
      c("issuer-key binding", "expected issuer를 그 issuer에게 구성된 verification key set과 함께 검증하는 관계입니다.", ["token 값만으로 key를 고르지 않습니다.", "multi-issuer를 격리합니다."]),
      c("audience validation", "aud claim이 현재 resource server의 configured identifier를 포함하는지 엄격히 확인하는 절차입니다.", ["API 간 replay를 막습니다.", "string/array를 처리합니다."]),
      c("subject resolution", "validated sub를 현재 account/domain principal로 해석하고 lifecycle 상태를 적용하는 과정입니다.", ["authorization과 분리합니다.", "원문 logging을 피합니다."]),
    ],
  }),
  appliedTopic({
    id: "access-time-claims-clock",
    title: "exp·nbf·iat와 clock skew를 NumericDate boundary로 검증합니다",
    lead: "만료 시간을 사람이 읽는 날짜로만 보지 않고 NumericDate seconds, inclusive/exclusive boundary, verifier clock, leeway와 최대 lifetime을 executable policy로 고정합니다.",
    mechanism: "exp는 현재 시간이 expiration보다 앞서야 하며 nbf 전에는 처리하지 않습니다. 작은 leeway는 clock skew 보정이지 lifetime 연장이 아니고 iat는 발급 시각/provenance로서 future bound와 exp-iat 최대 lifetime 같은 profile policy에 사용합니다.",
    workflow: "trusted UTC clock→claim type/finite/integer policy→required exp→nbf→iat future bound→max lifetime→optional token age 순서로 검증합니다.",
    invariants: "server clock을 사용하고 seconds/milliseconds를 혼동하지 않으며 leeway는 작고 문서화되어 모든 verifier에 일관되며 exp 누락/비수치/비정상 lifetime을 거부합니다.",
    edgeCases: "now==exp, now==nbf, leap-second representation, negative/fractional NumericDate, suspended VM clock jump, regional skew, long-running request와 queue delay를 포함합니다.",
    failureModes: "client clock을 믿거나 skew를 크게 잡아 만료 token을 오래 허용하고, milliseconds 값을 seconds로 해석하면 사실상 무기한 또는 즉시 만료가 됩니다.",
    verification: "boundary의 바로 전/같음/바로 후, ±skew, future iat, excessive lifetime와 fake clock property tests를 실행합니다.",
    operations: "clock offset, time-reject reason, token age/lifetime bucket과 NTP health를 관찰하되 exact claims를 고카디널리티 label로 쓰지 않습니다.",
    concepts: [
      c("NumericDate", "1970-01-01T00:00:00Z 이후 seconds로 표현하는 JWT 시간 값입니다.", ["UTC 기준입니다.", "단위와 type을 검증합니다."]),
      c("clock skew leeway", "issuer와 verifier clock 오차를 보정하는 작고 제한된 허용치입니다.", ["만료 연장 수단이 아닙니다.", "정책으로 고정합니다."]),
      c("maximum token lifetime", "exp와 iat 차이가 넘지 않아야 하는 profile 상한입니다.", ["탈취 window를 제한합니다.", "issuer 실수를 차단합니다."]),
    ],
    codeExamples: [node("security10-clock", "access token clock-boundary validator", "Security10Clock.mjs", "fixed clock에서 exp/nbf/iat와 max lifetime을 결정적으로 검증합니다.", String.raw`const now = 1700000000;
const skew = 30;
const maxLifetime = 900;
function validate(c) {
  if (![c.exp, c.nbf, c.iat].every(Number.isInteger)) return "reject:time-type";
  if (now - skew >= c.exp) return "reject:expired";
  if (now + skew < c.nbf) return "reject:not-before";
  if (c.iat > now + skew) return "reject:future-issued";
  if (c.exp - c.iat > maxLifetime) return "reject:lifetime";
  return "accept";
}
const base = { iat: now - 60, nbf: now - 60, exp: now + 300 };
console.log(validate(base));
console.log(validate({ ...base, exp: now - skew }));
console.log(validate({ ...base, nbf: now + skew + 1 }));
console.log(validate({ ...base, iat: now + skew + 1 }));
console.log(validate({ ...base, exp: base.iat + maxLifetime + 1 }));`, "accept\nreject:expired\nreject:not-before\nreject:future-issued\nreject:lifetime", ["rfc7519", "rfc9068", "spring-jwt"])],
  }),
  appliedTopic({
    id: "access-jti-scope-authorities",
    title: "jti·scope와 authorities를 authentication에서 authorization으로 안전하게 투영합니다",
    lead: "jti는 token instance identifier, scope는 위임된 권한 범위이며 둘 다 business object authorization이나 현재 account 상태를 자동 보장하지 않습니다.",
    mechanism: "resource server는 validated issuer/profile의 scope representation을 allowlisted authorities로 mapping하고 method/object policy가 resource relationship을 추가 검증합니다. jti는 replay correlation/denylist에 쓸 수 있지만 충분한 uniqueness, issuer namespace와 bounded retention이 필요합니다.",
    workflow: "claim schema/type→allowed scope vocabulary→prefix/mapping→current account restrictions→request/method/object authorization→audit outcome을 연결합니다.",
    invariants: "client-supplied role/authority를 무조건 신뢰하지 않고 unknown scope는 privilege로 승격하지 않으며 empty authorities의 의미와 deny-by-default를 명시합니다.",
    edgeCases: "scope string/array dialect, duplicates, case, renamed permission, stale role, admin step-up, jti collision, batch resources와 delegated access를 포함합니다.",
    failureModes: "authenticated만 검사하거나 empty authorities principal을 모든 보호 기능에 허용하면 token possession이 곧 전체 business authorization이 됩니다.",
    verification: "scope parser type/fuzz, allowlist mapping, unknown/duplicate, request/method/object negative matrix와 authority change propagation을 test합니다.",
    operations: "permission class/policy revision/allow-deny reason과 jti의 keyed correlation digest만 필요한 기간 동안 저장하며 raw token·subject는 제외합니다.",
    concepts: [
      c("jti", "JWT를 issuer namespace 안에서 고유하게 식별하기 위한 claim입니다.", ["replay/denylist correlation에 씁니다.", "원문 token 대체물이 아닙니다."]),
      c("scope", "client에게 위임된 접근 범위를 나타내는 authorization input입니다.", ["resource server가 allowlist mapping합니다.", "object ownership을 대체하지 않습니다."]),
      c("authority mapping", "validated scope/roles와 current policy를 framework authorities로 변환하는 과정입니다.", ["unknown values는 거부/무시 정책을 명시합니다.", "method/object checks와 연결합니다."]),
    ],
    codeExamples: [node("security10-scope-map", "strict scope-to-authority projection", "Security10ScopeMap.mjs", "known scope만 stable authority로 mapping하고 unknown scope를 privilege로 만들지 않습니다.", String.raw`const mapping = new Map([
  ["record:read", "SCOPE_record:read"],
  ["record:update", "SCOPE_record:update"],
]);
function project(scope) {
  if (typeof scope !== "string") return "reject:scope-type";
  const values = [...new Set(scope.split(" ").filter(Boolean))];
  const unknown = values.filter(x => !mapping.has(x));
  if (unknown.length) return "reject:unknown-scope";
  return "accept:" + values.map(x => mapping.get(x)).sort().join(",");
}
console.log(project("record:read record:update"));
console.log(project("record:read record:read"));
console.log(project("record:admin"));
console.log(project(["record:read"]));`, "accept:SCOPE_record:read,SCOPE_record:update\naccept:SCOPE_record:read\nreject:unknown-scope\nreject:scope-type", ["rfc9068", "spring-jwt", "owasp-authorization", "local-jwt-filter"])],
  }),
  appliedTopic({
    id: "access-jwks-multi-issuer",
    title: "JWKS cache·unknown kid와 multi-issuer를 tenant isolation 경계로 운영합니다",
    lead: "issuer discovery와 key refresh를 request마다 임의 수행하지 않고 allowlisted issuer profile별 decoder/cache/policy를 격리합니다.",
    mechanism: "Spring resource server는 issuer-uri/JWK Set URI와 validators로 issuer, signature, exp/nbf 및 audience를 구성할 수 있습니다. multi-tenancy는 AuthenticationManagerResolver 같은 trusted issuer resolution을 쓰되 issuer claim parsing은 아직 비신뢰이므로 allowlist가 필요합니다.",
    workflow: "request surface/tenant→trusted issuer allowlist→issuer-specific JwtDecoder/JWKS cache→signature/claims→tenant policy를 연결하고 unknown kid refresh를 coalesce/rate-limit합니다.",
    invariants: "issuer A key를 issuer B token에 쓰지 않고 unknown issuer는 network fetch 전에 거부하며 stale cache와 issuer outage behavior가 명시됩니다.",
    edgeCases: "new tenant onboarding, issuer alias, same kid across issuers, JWKS CDN stale, cold start, key rollover, partial outage와 tenant deletion을 포함합니다.",
    failureModes: "token iss를 URL로 그대로 fetch하면 SSRF/dynamic trust가 되고 global key registry는 같은 kid 충돌로 cross-issuer key selection을 만들 수 있습니다.",
    verification: "unknown issuer egress=0, same-kid isolation, stale/new key matrix, cache stampede, startup/outage/rollback과 tenant removal을 test합니다.",
    operations: "issuer profile, JWKS age/refresh result, unknown issuer/kid reason과 tenant onboarding revision을 bounded하게 관찰합니다.",
    concepts: [
      c("trusted issuer allowlist", "resource server가 사전에 승인한 issuer와 decoder/policy mapping입니다.", ["token 외부 trust anchor입니다.", "동적 URL fetch를 막습니다."]),
      c("issuer-isolated cache", "issuer마다 분리한 JWKS와 refresh state입니다.", ["same kid 충돌을 막습니다.", "tenant lifecycle과 연결합니다."]),
      c("AuthenticationManagerResolver", "request 또는 token context에 따라 승인된 AuthenticationManager를 선택하는 Spring Security 전략입니다.", ["allowlist가 필요합니다.", "검증 책임을 분리합니다."]),
    ],
  }),
  appliedTopic({
    id: "access-bearer-errors",
    title: "Bearer 401·403·WWW-Authenticate와 redaction 계약을 정확히 만듭니다",
    lead: "missing/invalid/expired/revoked credential과 authenticated-but-forbidden을 구분해 client가 login, refresh 또는 권한 안내 중 맞는 recovery만 수행하게 합니다.",
    mechanism: "RFC 6750에서 invalid bearer credential은 보통 401과 challenge, 충분하지 않은 scope는 403과 insufficient_scope 의미를 가집니다. body는 stable problem contract로 만들되 token, decoded claims와 internal exception을 포함하지 않습니다.",
    workflow: "failure stage→authentication state→401 entry point 또는 403 denied handler→WWW-Authenticate→problem code→client action→privacy-safe telemetry를 catalog로 고정합니다.",
    invariants: "response owner는 하나이고 401/403 semantics가 일관되며 invalid token에 controller side effect가 없고 raw Authorization/token이 logs, traces, errors/APM에 없습니다.",
    edgeCases: "missing token on public/protected route, multiple headers, proxy-generated error, committed response, expired vs malformed, insufficient scope, old client와 refresh loop를 포함합니다.",
    failureModes: "모든 401에서 refresh를 시도하면 malformed/revoked/wrong-audience token으로 무한 loop가 생기고 filter의 raw header/token debug log는 bearer credential 노출입니다.",
    verification: "failure matrix의 status/challenge/body/context/chain/client action/sink scan와 proxy end-to-end response를 test합니다.",
    operations: "problem type/reason/profile/policy revision과 retry outcome만 수집하며 credential 발견 시 즉시 sink 차단·revoke/rotate 판단·purge/readback을 수행합니다.",
    concepts: [
      c("Bearer challenge", "resource server가 credential failure의 authentication scheme과 오류 의미를 전달하는 WWW-Authenticate response입니다.", ["401과 함께 사용합니다.", "민감 detail을 제외합니다."]),
      c("401/403 boundary", "인증 credential이 없거나 유효하지 않은 경우와 인증됐지만 action이 금지된 경우의 구분입니다.", ["client recovery가 다릅니다.", "status만이 아닌 context를 검증합니다."]),
      c("redaction contract", "어떤 credential/claim/error data도 sink에 남기지 않을지 source부터 APM까지 강제하는 규칙입니다.", ["canary scan으로 검증합니다.", "incident 절차와 연결합니다."]),
    ],
    codeExamples: [node("security10-bearer-errors", "Bearer failure response classifier", "Security10BearerErrors.mjs", "authentication 상태와 scope 결과로 status/challenge/client action을 결정합니다.", String.raw`function response(x) {
  if (!x.credential || !x.valid) return "401|challenge=Bearer|action=login-or-approved-refresh";
  if (!x.scopeAllowed) return "403|challenge=Bearer insufficient_scope|action=show-forbidden";
  return "200|challenge=none|action=continue";
}
console.log(response({ credential: false }));
console.log(response({ credential: true, valid: false }));
console.log(response({ credential: true, valid: true, scopeAllowed: false }));
console.log(response({ credential: true, valid: true, scopeAllowed: true }));
console.log("raw-credential-output=false");`, "401|challenge=Bearer|action=login-or-approved-refresh\n401|challenge=Bearer|action=login-or-approved-refresh\n403|challenge=Bearer insufficient_scope|action=show-forbidden\n200|challenge=none|action=continue\nraw-credential-output=false", ["rfc6750", "spring-bearer", "local-jwt-filter"])],
  }),
  appliedTopic({
    id: "access-revocation-introspection",
    title: "short lifetime·denylist·introspection을 revocation latency로 비교합니다",
    lead: "self-contained JWT의 offline verification 장점과 account disable, logout, credential theft에 즉시 반응하기 어려운 단점을 business risk와 outage budget으로 선택합니다.",
    mechanism: "short-lived JWT는 state 없이 exp까지 유효할 수 있고 jti denylist는 verifier state/propagation을 추가합니다. RFC 7662 introspection은 authorization server의 active 상태를 조회하지만 latency·availability와 cache staleness trade-off가 있으며 RFC 7009 revocation은 token/grant 폐기 lifecycle을 제공합니다.",
    workflow: "threat/revoke event→허용 revoke latency→token lifetime→state mechanism→cache/fail behavior→propagation SLO→readback/incident를 설계합니다.",
    invariants: "logout UI 성공과 실제 revoke를 구분하고 denylist entry TTL은 token expiry와 맞으며 introspection cache/failure policy가 고위험 action을 fail open하지 않습니다.",
    edgeCases: "authorization server outage, regional propagation, clock skew, jti absent/collision, account role change, emergency revoke, long-running request와 offline service를 포함합니다.",
    failureModes: "JWT이므로 revoke 가능하다고 막연히 말하거나 introspection cache를 길게 잡으면 active=false가 늦게 반영되고, 매 request 중앙 조회는 auth service outage를 전체 API outage로 전파합니다.",
    verification: "revoke event부터 모든 verifier deny까지 측정하고 cache hit/miss/outage, JWT expiry, denylist TTL와 account-disable test를 실행합니다.",
    operations: "revoke propagation latency, introspection availability/cache age, denylist size/expiry와 stale-accept count를 관찰합니다.",
    concepts: [
      c("revocation latency", "폐기 결정부터 모든 resource verifier가 credential을 거부할 때까지의 시간입니다.", ["SLO로 측정합니다.", "token lifetime과 연결합니다."]),
      c("token introspection", "authorization server가 token의 현재 active 상태와 metadata를 보호된 endpoint로 알려 주는 protocol입니다.", ["cache trade-off가 있습니다.", "resource server 인증이 필요합니다."]),
      c("jti denylist", "특정 token identifier를 만료까지 거부하는 verifier-side state입니다.", ["unique jti가 필요합니다.", "bounded retention을 씁니다."]),
    ],
    codeExamples: [node("security10-revocation", "access revocation strategy selector", "Security10Revocation.mjs", "허용 revoke latency와 dependency 조건에 따라 전략의 적합성을 설명합니다.", String.raw`const strategies = [
  { name: "short-jwt", latency: 600, online: false },
  { name: "jti-denylist", latency: 5, online: true },
  { name: "introspection", latency: 2, online: true },
];
function eligible(limit, onlineAllowed) {
  return strategies.filter(x => x.latency <= limit && (onlineAllowed || !x.online)).map(x => x.name);
}
console.log("low-risk=" + eligible(600, false).join(","));
console.log("high-risk=" + eligible(5, true).join(","));
console.log("offline-high-risk=" + (eligible(5, false).join(",") || "none"));`, "low-risk=short-jwt\nhigh-risk=jti-denylist,introspection\noffline-high-risk=none", ["rfc7009", "rfc7662", "rfc6750", "owasp-session"])],
  }),
  appliedTopic({
    id: "access-spring-resource-server",
    title: "custom filter를 Spring resource-server components와 책임별로 비교합니다",
    lead: "BearerTokenAuthenticationFilter, JwtDecoder, validators, JwtAuthenticationConverter, AuthenticationEntryPoint와 AuthorizationFilter가 제공하는 경계를 이해하고 custom behavior를 최소화합니다.",
    mechanism: "Spring resource server는 bearer extraction/authentication flow와 JWT signature/time/issuer/audience validators를 조합하고 converter로 authorities를 투영할 수 있습니다. custom filter가 필요해도 credential parsing, authentication, failure translation과 context lifecycle을 framework contracts에 맞춥니다.",
    workflow: "SecurityFilterChain→bearer resolver→AuthenticationManager/provider→JwtDecoder/validators→converter→SecurityContext→request/method authorization→entry/deny handlers를 구성합니다.",
    invariants: "filter는 raw credential을 log하지 않고 authorities가 정책과 일치하며 invalid credential이 context/chain을 진행하지 않고 config와 runtime effective validators가 동일합니다.",
    edgeCases: "custom header resolver, multiple chains, stateless context, ASYNC/ERROR dispatch, issuer startup independence, decoder bean override와 test double drift를 포함합니다.",
    failureModes: "custom OncePerRequestFilter가 모든 예외를 잡고 직접 401을 쓰며 empty authorities principal을 만들면 framework failure/authorization contract가 분절됩니다.",
    verification: "ApplicationContext bean/filter/validator snapshot, MockMvc positive/negative claims, method/object policy, actual WWW-Authenticate와 sink scan을 실행합니다.",
    operations: "selected chain/decoder/profile, auth latency/failure stage와 authority mapping revision을 관찰합니다.",
    concepts: [
      c("JwtDecoder", "JWT signature와 configured validators를 실행해 검증된 Jwt를 만드는 Spring Security component입니다.", ["issuer/audience validators를 구성합니다.", "profile별로 분리합니다."]),
      c("JwtAuthenticationConverter", "검증된 JWT claims를 principal 이름과 GrantedAuthority로 투영하는 component입니다.", ["authorization policy와 맞춥니다.", "unknown scope를 제한합니다."]),
      c("BearerTokenAuthenticationFilter", "request bearer credential을 Authentication 흐름에 전달하는 Spring Security filter입니다.", ["failure handler와 context를 사용합니다.", "직접 business logic을 하지 않습니다."]),
    ],
  }),
  appliedTopic({
    id: "access-adversarial-testing",
    title: "claim·clock·JWKS·replay adversarial corpus로 validation을 증명합니다",
    lead: "valid/expired 두 fixture를 넘어 모든 필수 claim의 missing/wrong type/boundary, wrong issuer/audience/type/key, parser ambiguity와 operational faults를 체계적으로 생성합니다.",
    mechanism: "table/property-based corpus는 한 번에 한 invariant를 깨고 expected stage/reason/context/side effects를 고정합니다. 실제 signature fixture는 ephemeral keys를 쓰고 deterministic clock과 local JWKS server로 시간/network를 제어합니다.",
    workflow: "policy manifest→valid seed→single mutations→cross-product high-risk pairs→Spring integration→proxy/browser client recovery→sink scan→coverage report를 만듭니다.",
    invariants: "negative fixture가 production credential을 포함하지 않고 expected reject가 library message가 아닌 stable policy reason이며 rejected request side effect가 0입니다.",
    edgeCases: "duplicate JSON, huge segments, unicode, wrong NumericDate unit, key rotation race, stale cache, authorization-server outage, replay burst와 concurrency를 포함합니다.",
    failureModes: "mock Jwt로 controller만 test하면 실제 parser/signature/JWKS/time behavior를 건너뛰고 높은 line coverage가 validation coverage처럼 보입니다.",
    verification: "각 profile rule에 positive/negative test ID가 있고 mutation coverage, actual filter/context/response, network calls와 DB/event side effects를 확인합니다.",
    operations: "corpus/policy/library/runtime revision과 pass/fail counts를 보존하고 failed raw fixtures는 제한된 synthetic artifact store에만 둡니다.",
    concepts: [
      c("single-invariant mutation", "valid synthetic token에서 한 validation rule만 깨 expected failure stage를 분명히 하는 fixture입니다.", ["원인 격리를 돕습니다.", "matrix coverage를 계산합니다."]),
      c("deterministic clock", "시간 claim boundary를 반복 가능하게 검증하는 주입 가능한 clock입니다.", ["sleep test를 피합니다.", "region skew를 모델링합니다."]),
      c("validation coverage", "profile의 각 rule과 실패 경로가 executable test에 연결된 정도입니다.", ["line coverage와 다릅니다.", "mutant로 탐지력을 봅니다."]),
    ],
  }),
  appliedTopic({
    id: "access-rollout-incident",
    title: "validator 변경을 shadow·canary·rollback·incident gate로 운영합니다",
    lead: "issuer/audience/type 또는 lifetime rule을 한 번에 강제해 정상 client를 끊지 않으면서도 dual-accept가 영구 bypass가 되지 않게 migration합니다.",
    mechanism: "새 validator를 observe-only shadow로 실행해 old-accept/new-reject 이유를 분류하고 issuer/client를 고친 뒤 canary enforce, cohort 확대, old profile 종료를 수행합니다. credential sink나 forged/replayed acceptance가 발견되면 release보다 incident response가 우선입니다.",
    workflow: "policy diff→synthetic corpus→shadow differential→client remediation→canary enforce→SLO/security gate→full rollout→legacy removal→reconciliation/rollback을 실행합니다.",
    invariants: "shadow는 authorization decision을 바꾸지 않고 raw claims를 log하지 않으며 dual-accept 종료일과 owner가 있고 rollback도 removed validation을 무기한 복구하지 않습니다.",
    edgeCases: "old mobile client, issuer clock bug, JWKS outage, unexpected audience, emergency account revoke, telemetry loss와 partial region rollback을 포함합니다.",
    failureModes: "new-reject count만 보고 audience 검증을 꺼 버리거나 debug를 위해 token을 수집하면 compatibility 문제를 security bypass/credential incident로 바꿉니다.",
    verification: "differential reason cohort, false-accept/false-reject review, canary SLO, secret sink scan, revoke propagation과 rollback rehearsal을 gate로 계산합니다.",
    operations: "old/new decision pair, bounded reason, profile/policy revision, client cohort와 revoke/JWKS health를 dashboard로 운영합니다.",
    concepts: [
      c("shadow validation", "현재 decision은 유지하면서 새 policy 결과만 비민감하게 비교하는 migration 단계입니다.", ["authorization에 쓰지 않습니다.", "종료 조건을 둡니다."]),
      c("validation differential", "같은 request에 대한 old/new validator의 accept/reject와 reason 차이입니다.", ["client gap을 찾습니다.", "security review가 필요합니다."]),
      c("legacy profile retirement", "임시 dual-accept rule을 정한 날짜와 evidence 뒤 제거하는 절차입니다.", ["owner/expiry가 있습니다.", "사용량 0을 readback합니다."]),
    ],
    codeExamples: [node("security10-release-gate", "access validation rollout gate", "Security10ReleaseGate.mjs", "claim coverage, cross-type rejects, side effects, sinks, canary와 rollback evidence를 판정합니다.", String.raw`const evidence = {
  requiredClaimCoverage: 100,
  negativeCasesPassed: 48,
  negativeCasesTotal: 48,
  crossTypeUnexpectedAccept: 0,
  rejectedSideEffects: 0,
  rawCredentialFindings: 0,
  canaryErrorBudgetHealthy: true,
  revokeSloVerified: true,
  rollbackVerified: true,
  legacyExpiryAssigned: true,
};
const pass = evidence.requiredClaimCoverage === 100 &&
  evidence.negativeCasesPassed === evidence.negativeCasesTotal &&
  evidence.crossTypeUnexpectedAccept === 0 &&
  evidence.rejectedSideEffects === 0 &&
  evidence.rawCredentialFindings === 0 &&
  evidence.canaryErrorBudgetHealthy && evidence.revokeSloVerified &&
  evidence.rollbackVerified && evidence.legacyExpiryAssigned;
for (const [k, v] of Object.entries(evidence)) console.log(k + "=" + v);
console.log("release=" + (pass ? "pass" : "block"));`, "requiredClaimCoverage=100\nnegativeCasesPassed=48\nnegativeCasesTotal=48\ncrossTypeUnexpectedAccept=0\nrejectedSideEffects=0\nrawCredentialFindings=0\ncanaryErrorBudgetHealthy=true\nrevokeSloVerified=true\nrollbackVerified=true\nlegacyExpiryAssigned=true\nrelease=pass", ["rfc8725", "rfc9068", "spring-jwt", "spring-multitenancy", "owasp-jwt", "local-security-config"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-jwt-util", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtUtil.java", usedFor: ["signature/expiration/subject validation snapshot", "claims/profile gap audit"], evidence: "2026-07-14 read-only sanitized audit: 76 lines, 2,817 bytes, SHA-256 305E21E9D9E251BA7B402BB275C951BBC021F6FB270D6895926AF0CBEFB1AF1D. token/secret/subject/claim 값은 복사하지 않았습니다." },
  { id: "local-jwt-filter", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtRequestFilter.java", usedFor: ["Bearer extraction/context/failure path", "credential logging risk"], evidence: "2026-07-14 read-only sanitized audit: 94 lines, 4,208 bytes, SHA-256 EA08D71D7A21293E92451B7867142AB1582B403664C4A26C3D47213FE9E432B2. credential-bearing header/token log path와 empty authorities projection을 값 없이 확인했습니다." },
  { id: "local-jwt-config", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtConfig.java", usedFor: ["key and validity configuration boundary"], evidence: "2026-07-14 read-only sanitized audit: 24 lines, 689 bytes, SHA-256 018CA97DE544B68571CF48E58BB737BF259040A5E22E5768D69E43F91BD4B5DD. config 값은 복사하지 않았습니다." },
  { id: "local-security-config", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/config/SecurityConfig.java", usedFor: ["filter chain and request-policy integration"], evidence: "2026-07-14 read-only sanitized audit: 106 lines, 6,013 bytes, SHA-256 B1051723C4FEE8FCBEC587B0A1CFCFA7A9EB0C461EBE59602DA980EF1D62CCD8. routes/origins/messages는 복사하지 않았습니다." },
  { id: "local-build", repository: "D:/dev/2026-myproject04-cicd", path: "build.gradle", usedFor: ["Boot/JJWT snapshot boundary"], evidence: "2026-07-14 read-only audit: 56 lines, 2,047 bytes, SHA-256 CBF6CB4A2BDE7B7C072C924F3C03E009EF7EEE737314B1F4EDB82FB77EB5C0A5. JJWT 0.11.5/Boot 4.0.6 snapshot을 현재 best practice로 과장하지 않습니다." },
  { id: "local-jwt-learning", repository: "D:/dev/REACT", path: "docs/springboot/03-jwt.md", usedFor: ["prior JWT/access/refresh learning coverage"], evidence: "2026-07-14 read-only sanitized audit: 230 lines, 11,495 bytes, SHA-256 0791CBA92C83E9E933395C0001C18F3CDB7DA7CB5EAEB97D2F73EB6C3ECF097C." },
  { id: "local-security-learning", repository: "D:/dev/REACT", path: "docs/springboot/02-spring-security.md", usedFor: ["prior filter/security learning coverage"], evidence: "2026-07-14 read-only sanitized audit: 271 lines, 14,992 bytes, SHA-256 26C1353D511E96F8A4FAE49A14E02D2E0F040B2D6D5DA5916D8F59C12C85F06C." },
  { id: "local-integration-learning", repository: "D:/dev/REACT", path: "docs/integration/react-springboot-jwt-flow.md", usedFor: ["prior client-server token flow coverage"], evidence: "2026-07-14 read-only sanitized audit: 202 lines, 10,116 bytes, SHA-256 7287E0FA7A3A43E37DA0FEF8FF378CEABB0CE2EDB8404FBF2ACB94C0AE89FE97." },
  { id: "rfc7519", repository: "IETF RFC Editor", path: "RFC 7519", publicUrl: "https://www.rfc-editor.org/rfc/rfc7519.html", usedFor: ["iss/sub/aud/exp/nbf/iat/jti and NumericDate"], evidence: "JWT registered claims와 NumericDate를 정의합니다." },
  { id: "rfc8725", repository: "IETF RFC Editor", path: "RFC 8725", publicUrl: "https://www.rfc-editor.org/rfc/rfc8725.html", usedFor: ["issuer/audience/algorithm/type validation BCP"], evidence: "JWT 구현과 배포의 보안 best current practice입니다." },
  { id: "rfc9068", repository: "IETF RFC Editor", path: "RFC 9068", publicUrl: "https://www.rfc-editor.org/rfc/rfc9068.html", usedFor: ["OAuth JWT access-token profile"], evidence: "at+jwt type, issuer, audience와 access-token claims profile을 정의합니다." },
  { id: "rfc6750", repository: "IETF RFC Editor", path: "RFC 6750", publicUrl: "https://www.rfc-editor.org/rfc/rfc6750.html", usedFor: ["Bearer transport, 401/403 and challenge"], evidence: "OAuth bearer token 사용과 resource-server errors를 정의합니다." },
  { id: "rfc7009", repository: "IETF RFC Editor", path: "RFC 7009", publicUrl: "https://www.rfc-editor.org/rfc/rfc7009.html", usedFor: ["token revocation lifecycle"], evidence: "OAuth token revocation protocol을 정의합니다." },
  { id: "rfc7662", repository: "IETF RFC Editor", path: "RFC 7662", publicUrl: "https://www.rfc-editor.org/rfc/rfc7662.html", usedFor: ["token introspection active state and caching tradeoff"], evidence: "OAuth token introspection protocol을 정의합니다." },
  { id: "rfc8414", repository: "IETF RFC Editor", path: "RFC 8414", publicUrl: "https://www.rfc-editor.org/rfc/rfc8414.html", usedFor: ["trusted authorization-server metadata"], evidence: "Authorization Server Metadata를 정의합니다." },
  { id: "spring-jwt", repository: "Spring Security reference", path: "servlet/oauth2/resource-server/jwt.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html", usedFor: ["JwtDecoder, issuer, audience, time and algorithm configuration"], evidence: "Spring Security 공식 resource-server JWT reference입니다." },
  { id: "spring-bearer", repository: "Spring Security reference", path: "servlet/oauth2/resource-server/bearer-tokens.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/bearer-tokens.html", usedFor: ["Bearer extraction and authentication flow"], evidence: "Spring Security 공식 bearer-token reference입니다." },
  { id: "spring-multitenancy", repository: "Spring Security reference", path: "servlet/oauth2/resource-server/multitenancy.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/multitenancy.html", usedFor: ["trusted multi-issuer resolution"], evidence: "Spring Security 공식 resource-server multi-tenancy reference입니다." },
  { id: "owasp-jwt", repository: "OWASP Cheat Sheet Series", path: "JSON_Web_Token_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html", usedFor: ["Java JWT implementation controls"], evidence: "OWASP 공식 JWT cheat sheet입니다." },
  { id: "owasp-authorization", repository: "OWASP Cheat Sheet Series", path: "Authorization_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", usedFor: ["least privilege and object authorization"], evidence: "OWASP 공식 authorization cheat sheet입니다." },
  { id: "owasp-session", repository: "OWASP Cheat Sheet Series", path: "Session_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", usedFor: ["bearer credential handling and lifecycle"], evidence: "OWASP 공식 session management cheat sheet입니다." },
];

const session = createExpertSession({
    inventoryId: "sec-06-jwt-claims-expiration",
  slug: "security-10-access-token-validation",
  courseId: "devops",
  moduleId: "token-client-integration",
  order: 2,
  title: "access token validation·claims·clock",
  subtitle: "서명 성공 뒤 typ·iss·aud·시간·scope·revocation과 Spring Security principal projection을 fail-closed pipeline으로 검증합니다.",
  level: "고급",
  estimatedMinutes: 220,
  coreQuestion: "서명이 유효한 JWT가 지금 이 resource의 이 action에 쓸 수 있는 access token이라는 사실을 어떤 claims·clock·policy·runtime evidence로 증명할까요?",
  summary: "로컬 custom filter/JwtUtil/SecurityConfig와 세 학습 문서를 값 없이 감사해 signature/expiration/subject 중심 path, empty authorities와 credential sink 위험을 확인합니다. 이를 출발점으로 access profile, ordered validation pipeline, typ, issuer-key binding, audience, subject, exp/nbf/iat/jti, deterministic clock, scope/authority projection, multi-issuer JWKS, Bearer 401/403, short JWT·denylist·introspection revocation, Spring resource-server architecture, adversarial corpus와 shadow/canary incident rollout을 RFC 7519/6750/7009/7662/8414/8725/9068, Spring Security와 OWASP 근거 및 여덟 executable models로 완성합니다.",
  objectives: ["decode와 validation을 구분한다.", "access-token profile과 cross-type rejection을 설계한다.", "issuer-key-audience 관계를 검증한다.", "exp/nbf/iat와 clock skew boundary를 구현한다.", "jti/scope를 current authorities와 object policy에 연결한다.", "multi-issuer JWKS를 격리한다.", "401/403/challenge/client recovery를 정확히 만든다.", "revocation과 introspection trade-off를 정량화한다.", "Spring resource-server validation components를 통합한다.", "shadow/canary/incident evidence로 배포한다."],
  prerequisites: [{ title: "JWT 구조·서명·key selection", reason: "claims를 신뢰하기 전에 compact signing input, algorithm allowlist, issuer-bound key selection과 rotation이 완료되어야 합니다.", sessionSlug: "security-09-jwt-structure-signature" }],
  keywords: ["access token", "JwtDecoder", "iss", "aud", "sub", "exp", "nbf", "iat", "jti", "clock skew", "scope", "401", "403", "introspection", "revocation"],
  topics,
  lab: {
    title: "Spring access-token validation and revocation qualification lab",
    scenario: "synthetic issuer/resource/API와 disposable Spring fixture에서 every claim/type/clock/key/revocation failure를 실제 filter→context→authorization→response→telemetry까지 추적합니다.",
    setup: ["Node.js 20 이상", "Java 21/Spring Security resource-server fixture", "ephemeral signing keys와 synthetic JWT corpus", "deterministic Clock", "local test HTTPS issuer/JWKS/introspection server", "synthetic users/resources/scopes", "log/APM/trace canary scanner", "원본 local files read-only"],
    steps: ["로컬 source hashes와 stage/gap matrix를 값 없이 재검증합니다.", "accepted access profile의 typ/issuer/audience/algorithm/claims/lifetime을 manifest로 고정합니다.", "valid seed에서 missing/wrong-type/wrong-value/boundary single mutations를 생성합니다.", "deterministic clock으로 exp/nbf/iat/skew/max-lifetime boundaries를 실행합니다.", "issuer-isolated JWKS와 unknown issuer/kid, stale cache, rollover/outage를 test합니다.", "scope를 allowlisted authorities로 mapping하고 request/method/object negative matrix를 실행합니다.", "missing/invalid/expired/revoked/insufficient-scope의 401/403/challenge/client action을 검증합니다.", "short JWT, jti denylist와 introspection의 revoke propagation/outage/cache를 측정합니다.", "logs/traces/errors/APM/artifacts의 credential canary와 rejected side-effect zero를 검사합니다.", "shadow differential→canary→full enforce→legacy retirement→rollback/incident gate를 재계산합니다."],
    expectedResult: ["wrong typ/issuer/key/audience/time/scope token은 context와 business side effect 없이 stable reason으로 거부됩니다.", "모든 time boundary가 동일 clock/skew policy로 반복 가능하고 units confusion이 없습니다.", "validated scope만 authorities가 되며 object/tenant authorization은 별도로 deny-by-default를 적용합니다.", "401/403/challenge와 client recovery가 failure semantics와 일치하고 retry loop가 없습니다.", "revoke latency, JWKS/introspection outage behavior와 rollback/incident 절차가 측정된 evidence를 가집니다."],
    cleanup: ["ephemeral keys/tokens, synthetic accounts/resources와 denylist/introspection state를 폐기합니다.", "local issuer/JWKS/introspection server, caches와 disposable Spring runtime을 종료합니다.", "raw test captures를 삭제하고 redacted aggregate/hash만 보존합니다.", "원본 local files hash/status unchanged를 확인합니다."],
    extensions: ["sender-constrained access token DPoP/mTLS threat model을 추가합니다.", "policy-as-code와 generated validation corpus를 통합합니다.", "multi-region clock/JWKS/revocation chaos를 자동화합니다.", "continuous old/new validator differential monitor를 운영합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여덟 Node examples를 실행하고 각 stdout을 실제 Spring validation stage와 연결하세요.", requirements: ["stdout 완전 일치", "profile/claims/clock/error/revocation mapping", "credential 값 없음", "model 한계 기록"], hints: ["Node model의 accept는 실제 signature, Spring context 또는 network behavior를 증명하지 않습니다."], expectedOutcome: "각 validation rule의 input, failure stage, HTTP/client outcome과 verification layer를 설명합니다.", solutionOutline: ["source→pipeline/profile→claims/clock/scope→errors/revoke→gate 순서입니다."] },
    { difficulty: "응용", prompt: "두 issuer와 두 resource audience의 access-token qualification packet을 만드세요.", requirements: ["trusted issuer allowlist", "isolated JWKS", "aud matrix", "clock corpus", "scope/object policy", "401/403", "revoke SLO", "sink scan"], hints: ["token의 iss URL을 trust anchor나 unrestricted fetch target으로 사용하지 마세요."], expectedOutcome: "cross-issuer/resource replay, stale claims와 operational outage를 deterministic하게 거부·복구합니다.", solutionOutline: ["profiles→fixtures→integration→faults→telemetry/incident 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 access-token validation 표준과 migration policy를 작성하세요.", requirements: ["claims schema", "clock/skew", "principal/authority mapping", "revocation tiers", "multi-issuer onboarding", "errors/privacy", "shadow/canary", "legacy retirement"], hints: ["revocation 요구를 token 형식 선택 전에 수치화하세요."], expectedOutcome: "서비스마다 검증 규칙이 drift하지 않고 변경을 안전하게 단계화합니다.", solutionOutline: ["risk/SLO→profiles→runtime components→evidence→rollout/governance 순서입니다."] },
  ],
  nextSessions: ["security-11-refresh-token-rotation"],
  sources,
  sourceCoverage: {
    filesRead: 8,
    filesUsed: 8,
    uncoveredNotes: ["로컬 source/docs의 실제 Authorization header, token, secret, subject, routes, payload, endpoint와 environment 값을 공개 content에 복사하지 않았습니다.", "JwtRequestFilter의 credential-bearing header/token logging path는 value-free risk로만 사용했습니다. 실제 노출 가능성이 있으면 source 제거 외에 token revoke, key rotate 필요성 평가, log/APM purge와 downstream readback이 필요합니다.", "로컬 validator snapshot의 signature/expiration/subject path를 현재 access-token validation best practice로 과장하지 않으며 issuer/audience/type/clock/authority/revocation은 lab에서 독립 증거를 요구합니다.", "Node examples는 actual cryptography, Spring filter/context, JWKS/introspection network와 DB side effects를 대체하지 않습니다."],
  },
});

export default session;
