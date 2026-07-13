import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localRefs = ["local-security-config", "local-jwt-filter", "local-build"];

const topics = [
  appliedTopic({
    id: "capstone-source-threat-model", title: "source snapshot을 asset·actor·trust-boundary threat model로 변환합니다",
    lead: "SecurityConfig와 JWT filter의 annotation/API 목록이 아니라 browser→proxy→filter chain→controller/service→data store를 지나는 credentials, principals, actions와 sensitive sinks를 복원합니다.",
    mechanism: "로컬 snapshot은 Boot 4/Java 21, custom bearer filter, stateless request rules, CSRF disable, credentialed CORS와 inline 401 response를 보여 줍니다. 이는 학습 출발점이며 authority/resource policy, browser credential assumptions, centralized errors와 audit controls가 모두 구현됐다는 보장은 아닙니다.",
    workflow: "read-only hash→assets/data classes→actors/credentials→entry points→trust boundaries→normal/abuse flows→controls/evidence→residual risks/owners를 값 없는 diagram과 register로 만듭니다.",
    invariants: "실제 route, origin, token, subject와 message를 복사하지 않고 source observation·official guarantee·capstone design을 명확히 구분하며 모든 public claim을 evidence에 연결합니다.",
    edgeCases: "anonymous/public flow, browser and non-browser clients, admin/support, background job, OAuth callback, proxy/CDN, outage/recovery와 old clients를 포함합니다.",
    failureModes: "JWT filter가 있으니 안전하다는 결론은 credential lifecycle, object authorization, CSRF, errors, logs와 incident recovery의 연결된 attack path를 숨깁니다.",
    verification: "source/build hashes, runtime filter/request flow, data-flow sinks, abuse cases와 control-evidence mapping을 independent reviewer가 재현합니다.",
    operations: "threat/control/risk IDs, owner, evidence age, residual severity와 exception expiry를 dashboard에 연결하고 sensitive data는 diagram/log에서 제외합니다.",
    concepts: [c("trust boundary", "서로 다른 신뢰 수준의 component·actor·network 사이에서 data와 authority가 넘어가는 경계입니다.", ["validation/authentication/authorization을 배치합니다.", "diagram에 표시합니다."]), c("abuse flow", "정상 기능의 credential·sequence·resource를 공격자 관점에서 오용하는 경로입니다.", ["control과 test로 연결합니다.", "happy path를 보완합니다."]), c("residual risk", "적용한 controls 뒤에도 남아 owner가 accept/mitigate/transfer/avoid해야 하는 위험입니다.", ["evidence와 expiry를 둡니다.", "숨기지 않습니다."])],
    codeExamples: [node("security08-threat-register", "redacted trust-boundary threat register", "Security08ThreatRegister.mjs", "source observations에서 주요 assets/threats/controls/evidence 상태를 값 없이 정리합니다.", String.raw`const risks = [
  ["R1", "credential-log", "remove+rotate+scan", "open"],
  ["R2", "object-authorization", "policy+negative-tests", "planned"],
  ["R3", "browser-csrf-assumption", "credential-model+browser-tests", "planned"],
  ["R4", "error-contract-drift", "central-handlers+schema", "planned"],
];
for (const row of risks) console.log(row.join("|"));
console.log("sensitive-values-copied=false");`, "R1|credential-log|remove+rotate+scan|open\nR2|object-authorization|policy+negative-tests|planned\nR3|browser-csrf-assumption|credential-model+browser-tests|planned\nR4|error-contract-drift|central-handlers+schema|planned\nsensitive-values-copied=false", localRefs.concat(["owasp-asvs", "nist-ssdf"]))],
  }),
  appliedTopic({
    id: "capstone-filter-chain", title: "FilterChainProxy를 credential·exploit protection·authorization 순서의 executable architecture로 설계합니다",
    lead: "custom filter를 특정 class 앞에 넣는 한 줄에서 멈추지 않고 여러 SecurityFilterChain selection, CORS/CSRF, authentication, exception translation과 AuthorizationFilter의 순서를 실패 경로까지 그립니다.",
    mechanism: "FilterChainProxy는 첫 matching SecurityFilterChain을 선택하고 각 filter가 request/response/context에 명시된 책임을 가집니다. custom bearer extraction은 authentication component에 위임하고 failure는 configured entry point로 한 번만 전달합니다.",
    workflow: "surface별 securityMatcher/order→framework filters→custom authentication converter/provider→context repository/policy→exception translation→authorization→cleanup을 diagram과 context test로 고정합니다.",
    invariants: "한 request는 한 chain과 한 최종 response owner를 가지며 invalid credential에서 context/chain/side effect가 없고 CORS preflight/exploit protection은 의도한 순서로 처리됩니다.",
    edgeCases: "overlapping chains, ERROR/ASYNC dispatch, filter double registration, already committed response, request cache, stateless/session surfaces와 proxy error를 포함합니다.",
    failureModes: "custom filter가 header를 log하고 직접 JSON을 쓰며 모든 Exception을 credential invalid로 바꾸면 secret leak, double response, outage 오진과 schema drift가 생깁니다.",
    verification: "ApplicationContext filter dump, request matrix, chain/commit/context counters, entry/deny handlers, CORS/CSRF order와 runtime raw responses를 검증합니다.",
    operations: "selected chain/filter failure stage, context/commit anomalies, handler ID와 build/policy revision을 privacy-safe하게 수집합니다.",
    concepts: [c("FilterChainProxy", "Spring Security의 여러 SecurityFilterChain을 선택하고 실행하는 중심 servlet Filter입니다.", ["첫 matching chain을 사용합니다.", "filter ordering을 관리합니다."]), c("authentication converter", "HTTP request에서 credential 후보를 추출해 Authentication request로 변환하는 component입니다.", ["검증과 분리합니다.", "oversized/malformed input을 제한합니다."]), c("one-response architecture", "filter, entry point, denied handler와 controller 중 정확히 한 경계만 response를 commit하는 설계입니다.", ["failure delegation을 사용합니다.", "counts로 검증합니다."])],
    codeExamples: [node("security08-filter-sequence", "filter-chain success/failure invariant model", "Security08FilterSequence.mjs", "preflight, missing, invalid, valid와 denied requests의 response owner/context/chain을 검증합니다.", String.raw`const cases = [
  ["preflight", "cors", false, 0, 1],
  ["missing-protected", "entry-point", false, 0, 1],
  ["invalid", "entry-point", false, 0, 1],
  ["valid-allowed", "controller", true, 1, 0],
  ["valid-denied", "denied-handler", true, 0, 1],
];
for (const x of cases) console.log(x[0] + "|owner=" + x[1] + "|context=" + x[2] + "|chain=" + x[3] + "|commits=" + x[4]);`, "preflight|owner=cors|context=false|chain=0|commits=1\nmissing-protected|owner=entry-point|context=false|chain=0|commits=1\ninvalid|owner=entry-point|context=false|chain=0|commits=1\nvalid-allowed|owner=controller|context=true|chain=1|commits=0\nvalid-denied|owner=denied-handler|context=true|chain=0|commits=1", ["spring-architecture", "spring-auth-architecture", "spring-cors", "local-security-config", "local-jwt-filter"])],
  }),
  appliedTopic({
    id: "capstone-credential-lifecycle", title: "password·session·access credential을 issuance에서 revoke까지 한 lifecycle로 연결합니다",
    lead: "PasswordEncoder 선택, login Authentication과 SecurityContext, session fixation/logout 또는 bearer validation을 서로 고립된 예제로 두지 않고 principal assurance와 revoke latency를 포함한 lifecycle로 만듭니다.",
    mechanism: "password는 adaptive one-way function으로 저장하고 online verification은 throttling/lockout/MFA와 결합합니다. session ID나 access token은 password가 아니지만 bearer credential이므로 transport/storage/expiry/rotation/revoke와 logging 금지가 필요합니다.",
    workflow: "enroll/reset→hash/upgrade→login/provider→context/session/token issue→use/step-up→authority change→logout/revoke→incident rotate를 credential 종류별 state machine으로 정의합니다.",
    invariants: "plaintext/reversible password 저장과 raw credential logging이 없고 authentication success 전 context를 설정하지 않으며 privilege/credential lifecycle이 account state와 합리적인 시간 안에 수렴합니다.",
    edgeCases: "concurrent login, encoder migration, locked/disabled user, session fixation, device logout, stolen credential, clock skew, provider outage와 recovery를 포함합니다.",
    failureModes: "signature validation만 하고 account disable/revoke를 무시하거나 password hash만 강하게 하고 online brute-force를 제한하지 않으면 lifecycle의 다른 경계가 공격 표면이 됩니다.",
    verification: "password corpus/upgrade, provider failure, session rotation/context cleanup, bearer storage/transport, logout/revoke lag, timing and secret-sink scans를 실행합니다.",
    operations: "credential type/age/assurance, auth failure reason, revoke propagation, encoder version와 sensitive finding을 bounded metrics로 관찰합니다.",
    concepts: [c("credential lifecycle", "credential을 생성·저장·제시·검증·회전·폐기·사고 대응하는 전체 과정입니다.", ["종류별 threat가 다릅니다.", "owner와 SLO를 둡니다."]), c("adaptive password hash", "cost를 조정할 수 있는 일방향 password verification function입니다.", ["work factor를 운영합니다.", "평문 복구가 불가능해야 합니다."]), c("revoke latency", "권한/credential 폐기 결정이 모든 verifier와 session/token에 실제 반영될 때까지 걸리는 시간입니다.", ["측정합니다.", "위험에 맞게 제한합니다."])],
    codeExamples: [node("security08-credential-lifecycle", "credential lifecycle state and revocation gate", "Security08CredentialLifecycle.mjs", "password/session/bearer credential의 저장·rotation·revoke evidence를 비교합니다.", String.raw`const credentials = [
  { type: "password", stored: "adaptive-hash", rotates: "reset", revocable: true },
  { type: "session", stored: "opaque-id", rotates: "login", revocable: true },
  { type: "access", stored: "memory-or-none", rotates: "short-expiry", revocable: "bounded" },
];
for (const x of credentials) console.log(x.type + "|stored=" + x.stored + "|rotation=" + x.rotates + "|revocable=" + x.revocable);
console.log("raw-credential-logs=0");`, "password|stored=adaptive-hash|rotation=reset|revocable=true\nsession|stored=opaque-id|rotation=login|revocable=true\naccess|stored=memory-or-none|rotation=short-expiry|revocable=bounded\nraw-credential-logs=0", ["spring-password", "spring-session-security", "owasp-password", "owasp-session", "local-jwt-filter"])],
  }),
  appliedTopic({
    id: "capstone-authorization", title: "request·method·object·tenant policy를 least-privilege decision chain으로 통합합니다",
    lead: "anyRequest().authenticated()에서 끝내지 않고 route/action permission, service method, resource owner/tenant/version과 affected-row를 방어층별로 평가합니다.",
    mechanism: "request matcher는 coarse surface, method security는 transport-independent use case, domain policy/repository predicate는 object relationship을 보호합니다. granular authorities와 default deny를 사용하고 UI visibility는 convenience일 뿐 authorization이 아닙니다.",
    workflow: "runtime route inventory→resource:action permissions→role mapping→method meta-annotations→principal-resource policy→query predicates/affected rows→events/negative matrix를 연결합니다.",
    invariants: "unmatched route/action과 cross-tenant/object tamper는 deny되고 client-supplied role/owner는 신뢰하지 않으며 deny 뒤 mutation/event/cache side effect가 없습니다.",
    edgeCases: "same-role other owner, batch mixed resources, ownership race, delegated access, break-glass, stale JWT authority, self-invocation와 async job을 포함합니다.",
    failureModes: "JWT subject만 context에 넣고 authorities가 비어 있거나 authenticated만 검사하면 로그인한 모든 사용자가 모든 protected business action에 접근할 수 있습니다.",
    verification: "route/policy coverage, request/method proxy tests, actor-resource property matrix, cross-tenant, affected rows와 policy rollout differential을 실행합니다.",
    operations: "matched policy/revision, action/resource class, allow/deny reason, unexpected allow와 revoke/policy skew를 privacy-safe하게 관찰합니다.",
    concepts: [c("defense-in-depth authorization", "request, method와 object/data 경계에서 독립된 policy를 반복 적용하는 설계입니다.", ["한 층 우회를 제한합니다.", "같은 business rule을 공유합니다."]), c("resource relationship", "principal과 object 사이 owner, tenant, membership, delegation과 lifecycle 상태입니다.", ["ID와 다릅니다.", "server가 조회합니다."]), c("authorization side-effect zero", "거부된 action이 database, message, cache와 외부 시스템을 전혀 변경하지 않는 불변식입니다.", ["status와 별도로 검증합니다.", "transaction ordering이 중요합니다."])],
    codeExamples: [node("security08-authorization-chain", "layered authorization decision chain", "Security08AuthorizationChain.mjs", "request, permission, tenant/owner와 version 조건을 단계별로 평가합니다.", String.raw`function decide(x) {
  if (!x.routeKnown) return "deny:route";
  if (!x.permissions.includes(x.action)) return "deny:permission";
  if (x.principalTenant !== x.resourceTenant) return "deny:tenant";
  if (x.requiresOwner && x.principal !== x.owner) return "deny:owner";
  if (!x.versionMatches) return "deny:version";
  return "allow";
}
const base = { routeKnown: true, permissions: ["record:update"], action: "record:update", principalTenant: "t1", resourceTenant: "t1", principal: "u1", owner: "u1", requiresOwner: true, versionMatches: true };
for (const patch of [{}, { principal: "u2" }, { resourceTenant: "t2" }, { versionMatches: false }]) console.log(decide({ ...base, ...patch }));`, "allow\ndeny:owner\ndeny:tenant\ndeny:version", ["spring-authorize-http", "spring-method-security", "owasp-authorization", "nist-zero-trust"])],
  }),
  appliedTopic({
    id: "capstone-browser-protections", title: "CSRF·CORS·cookies·headers를 browser credential threat model로 통합합니다",
    lead: "stateless/JWT라는 label이 아니라 browser가 어떤 credential을 자동 첨부하는지, 어느 origins가 response를 읽고 어떤 resource가 실행되는지를 기준으로 protection을 구성합니다.",
    mechanism: "CSRF는 state-changing automatic-credential request를 막고 CORS는 cross-origin script response sharing, CSP/headers는 browser resource/transport behavior를 제한합니다. 서로 대체하지 않으며 XSS가 있으면 token/DOM controls의 assumptions도 다시 평가합니다.",
    workflow: "credential table→endpoint CSRF decisions/token lifecycle→exact owned CORS origins/methods/headers→SameSite/origin/Fetch Metadata→security headers/CSP report-only→browser matrix를 구현합니다.",
    invariants: "unsafe cross-site deny 뒤 state가 unchanged이고 credentialed CORS에 wildcard/reflection이 없으며 actual HTTPS error/static/API responses도 승인 headers를 가집니다.",
    edgeCases: "refresh/logout cookies, simple form, preflight cache, sibling subdomain, OAuth redirect, bfcache/service worker, proxy/CDN와 old SPA를 포함합니다.",
    failureModes: "CORS가 CSRF를 막는다고 믿거나 JWT라서 CSRF를 끄면 simple request와 cookie refresh 경계를 놓치고, source header config가 proxy에서 사라질 수 있습니다.",
    verification: "separate HTTPS origins, cookie/token rotation, simple/preflight requests, server state readback, CSP report/enforce, proxy/header and cache revision을 실행합니다.",
    operations: "CSRF deny/mutation, CORS unexpected allow, preflight, CSP/header coverage와 policy/cache revision skew를 관찰합니다.",
    concepts: [c("browser credential model", "browser가 credential을 저장·접근·자동 첨부하는 규칙을 endpoint별로 표현한 threat model입니다.", ["CSRF 결정의 입력입니다.", "cookie/header를 구분합니다."]), c("cross-origin sharing", "CORS headers에 따라 browser script가 다른 origin response를 읽을 수 있게 하는 opt-in입니다.", ["request 자체 방어가 아닙니다.", "exact allowlist를 씁니다."]), c("browser enforcement evidence", "actual browser가 cookie/CORS/CSP/header policy를 적용한 network·state 결과입니다.", ["server unit test와 다릅니다.", "HTTPS origins에서 수집합니다."])],
    codeExamples: [node("security08-browser-gate", "browser security integrated gate", "Security08BrowserGate.mjs", "CSRF/CORS/header evidence와 denied mutation을 하나의 gate로 평가합니다.", String.raw`const evidence = { unsafeCrossSiteMutations: 0, corsUnexpectedAllow: 0, trustedPreflightPass: true, csrfRotationPass: true, headerCoverage: 100, cspBlockingViolations: 0 };
const pass = evidence.unsafeCrossSiteMutations === 0 && evidence.corsUnexpectedAllow === 0 && evidence.trustedPreflightPass && evidence.csrfRotationPass && evidence.headerCoverage === 100 && evidence.cspBlockingViolations === 0;
for (const [key,value] of Object.entries(evidence)) console.log(key + "=" + value);
console.log("gate=" + (pass ? "pass" : "block"));`, "unsafeCrossSiteMutations=0\ncorsUnexpectedAllow=0\ntrustedPreflightPass=true\ncsrfRotationPass=true\nheaderCoverage=100\ncspBlockingViolations=0\ngate=pass", ["spring-csrf", "spring-cors", "spring-headers", "owasp-csrf"])],
  }),
  appliedTopic({
    id: "capstone-error-contract", title: "authentication/authorization/browser failures를 중앙 Problem Details 계약으로 번역합니다",
    lead: "missing·invalid·expired credential, authenticated deny와 CSRF failure를 상태와 recovery semantics가 다른 stable problem types로 매핑합니다.",
    mechanism: "ExceptionTranslationFilter는 entry point와 denied handler를 선택하고 custom filters는 failure를 중앙 component에 위임합니다. 401 challenge, 403 deny와 RFC 9457 body를 surface별로 구성하며 internal exception/credential은 노출하지 않습니다.",
    workflow: "failure source/classification→context clear→entry/deny handler→status/challenge/problem→client refresh/login/forbidden action→logs/metrics를 catalog와 matrix로 고정합니다.",
    invariants: "한 response만 commit되고 401/403 의미가 client recovery와 일치하며 detail/message를 control flow에 쓰지 않고 body/log/trace/artifact에 secret/PII가 없습니다.",
    edgeCases: "anonymous AccessDeniedException, handler IOException, committed response, proxy HTML error, unknown code, old client, concurrent refresh와 telemetry outage를 포함합니다.",
    failureModes: "각 filter catch가 JSON을 직접 쓰면 status/header/schema가 drift하고 모든 401에서 refresh하면 expired가 아닌 invalid/revoked credential으로 retry loop가 생깁니다.",
    verification: "failure matrix의 status/header/schema/context/chain/side-effect/log/client action, secret canary scan와 old/new compatibility를 실행합니다.",
    operations: "problem type/code/status/surface, handler failure, retry loop와 sensitive canary findings를 bounded metrics와 incident runbook에 연결합니다.",
    concepts: [c("failure translation", "내부 authentication/authorization exception을 안전한 HTTP status, challenge와 public problem으로 바꾸는 과정입니다.", ["결정과 representation을 분리합니다.", "handler가 소유합니다."]), c("problem catalog", "stable problem type/code/status와 client recovery semantics의 versioned 목록입니다.", ["RFC 9457을 사용합니다.", "unknown fallback을 둡니다."]), c("credential-safe telemetry", "보안 실패를 관찰하되 token, password, Authorization와 PII를 제외한 bounded events입니다.", ["reason code를 사용합니다.", "sink scans로 검증합니다."])],
    codeExamples: [node("security08-problem-catalog", "security failure problem and client-action catalog", "Security08ProblemCatalog.mjs", "failure를 status/code/client recovery로 안정되게 매핑합니다.", String.raw`const catalog = {
  missing: [401, "AUTH_REQUIRED", "login"],
  invalid: [401, "CREDENTIAL_REJECTED", "stop"],
  expired: [401, "CREDENTIAL_EXPIRED", "refresh-once"],
  denied: [403, "ACCESS_DENIED", "forbidden"],
  csrf: [403, "CSRF_REJECTED", "reload-token-once"],
};
for (const key of Object.keys(catalog)) console.log(key + "|" + catalog[key].join("|"));
console.log("raw-exception-exposed=false");`, "missing|401|AUTH_REQUIRED|login\ninvalid|401|CREDENTIAL_REJECTED|stop\nexpired|401|CREDENTIAL_EXPIRED|refresh-once\ndenied|403|ACCESS_DENIED|forbidden\ncsrf|403|CSRF_REJECTED|reload-token-once\nraw-exception-exposed=false", ["spring-architecture", "spring-auth-architecture", "rfc9457", "owasp-logging"] )],
  }),
  appliedTopic({
    id: "capstone-verification-evidence", title: "threat→control→test→artifact evidence chain을 release gate로 만듭니다",
    lead: "source review와 scanner green을 합쳐 'secure'라 쓰지 않고 각 risk/control에 unit, context, MockMvc, DB, browser, scanner, abuse와 recovery evidence를 연결합니다.",
    mechanism: "Spring tests는 filter/security context, DB integration은 object policy/side effects, browser는 origin/credential enforcement, scanners는 candidate/provenance, incident drill은 revoke/rollback/purge를 증명합니다.",
    workflow: "control IDs→test IDs/commands→expected invariants→machine results→source/artifact/config revision→redaction/hash→validated findings/exceptions→gate decision을 reproducible package로 만듭니다.",
    invariants: "evidence 없는/matured control은 pass가 아니고 critical open, unexpected allow, mutation-after-deny, credential leak와 unrecoverable rollback은 hard blocker입니다.",
    edgeCases: "flaky/disabled tests, stale advisory DB, manual evidence, emergency exception, rolling artifact revisions와 telemetry outage를 포함합니다.",
    failureModes: "line coverage나 scanner warning 0만 gate로 쓰면 business authorization/browser/incident gaps를 놓치고 raw artifacts에 secrets가 남을 수 있습니다.",
    verification: "audit package schema/digest, control coverage, independent rerun, source-artifact correspondence, secret scan, exception expiry와 decision recomputation을 실행합니다.",
    operations: "control/evidence coverage, validated findings/SLA, test flake/disable, exception expiry, package access와 rollback readiness를 관찰합니다.",
    concepts: [c("control-evidence chain", "threat와 control에서 구체 test, result, source/artifact revision까지 이어지는 추적 관계입니다.", ["audit claim을 재현합니다.", "evidence age를 관리합니다."]), c("hard security invariant", "위반되면 보상 없이 release를 차단해야 하는 기준입니다.", ["credential leak/unexpected allow 등이 해당합니다.", "명시적으로 관리합니다."]), c("independent reproducibility", "다른 reviewer가 같은 artifact/policy/commands로 같은 evidence와 decision을 얻는 성질입니다.", ["환경을 기록합니다.", "manual 판단 이유도 남깁니다."])],
    codeExamples: [node("security08-control-evidence", "capstone control-evidence release gate", "Security08ControlEvidence.mjs", "인증·인가·browser·error·audit controls와 hard invariants로 gate를 계산합니다.", String.raw`const controls = { filter: true, credentials: true, authorization: true, browser: true, errors: true, audit: true };
const hard = { unexpectedAllow: 0, mutationAfterDeny: 0, credentialLeaks: 0, unreconciledRollback: 0 };
const coverage = Object.values(controls).filter(Boolean).length / Object.keys(controls).length * 100;
const pass = coverage === 100 && Object.values(hard).every(x => x === 0);
console.log("controlCoverage=" + coverage);
for (const [key,value] of Object.entries(hard)) console.log(key + "=" + value);
console.log("release=" + (pass ? "pass" : "block"));`, "controlCoverage=100\nunexpectedAllow=0\nmutationAfterDeny=0\ncredentialLeaks=0\nunreconciledRollback=0\nrelease=pass", ["spring-testing", "owasp-asvs", "nist-ssdf"])],
  }),
  appliedTopic({
    id: "capstone-credential-incident", title: "credential logging 발견을 revoke·rotate·contain·purge·readback incident로 처리합니다",
    lead: "source에서 token/header logging을 삭제하는 patch만으로 완료하지 않고 어떤 credentials가 어느 sinks에 언제 노출됐을 수 있는지 보수적으로 조사하고 실제 효력을 폐기합니다.",
    mechanism: "containment는 logging/exports/access를 막고 eradication은 unsafe sinks 제거, recovery는 session/token/key revoke/rotate와 services restart, post-incident는 logs/backups/support bundles purge 가능성·retention과 detection control을 다룹니다.",
    workflow: "detect/classify→stop collection→preserve redacted evidence→identify credential types/scope→revoke/rotate→restrict/purge sinks→deploy fix→secret canary scan→readback→lessons/actions를 실행합니다.",
    invariants: "실제 token 값을 incident ticket/chat에 붙이지 않고 rotation command 성공만 믿지 않으며 old credentials가 verifier마다 reject되고 logs/artifacts에 새 credentials가 없는지 확인합니다.",
    edgeCases: "long-lived refresh/session, rolling instances, multiple signing keys, log shipping delay, immutable backups, third-party APM, support download와 unknown exposure window를 포함합니다.",
    failureModes: "logger line 삭제만 하고 기존 token을 살려두거나 downstream sinks를 보지 않으면 공격 가능성과 노출 copy가 계속 남습니다.",
    verification: "synthetic canary, credential inventory, revoke/rotate propagation, old credential rejection, sink access/purge, new deployment scans와 incident RTO/RPO를 검증합니다.",
    operations: "credential incident count, containment/revoke/purge/readback durations, sink coverage와 overdue postmortem actions에 security owner를 둡니다.",
    concepts: [c("credential containment", "추가 credential 수집·접근·전파를 즉시 멈추는 incident 단계입니다.", ["logging/export/access를 통제합니다.", "서비스 risk를 평가합니다."]), c("credential rotation", "새 credential/key를 발급·배포하고 old material을 폐기하는 절차입니다.", ["overlap과 verifier propagation을 관리합니다.", "readback이 필요합니다."]), c("secret sink inventory", "credential이 복사될 수 있는 application/proxy/APM/log/trace/artifact/backup locations 목록입니다.", ["retention/access owner를 둡니다.", "canary로 검증합니다."])],
    codeExamples: [node("security08-incident-gate", "credential incident recovery gate", "Security08IncidentGate.mjs", "containment, rotation, old credential reject, sink scans와 readback evidence를 검사합니다.", String.raw`const evidence = { collectionStopped: true, credentialsRevoked: true, keysRotated: true, oldCredentialRejected: true, activeSinksScanned: 8, activeSinksExpected: 8, newLeaks: 0, purgeReviewed: true, readbackVerified: true };
const pass = evidence.collectionStopped && evidence.credentialsRevoked && evidence.keysRotated && evidence.oldCredentialRejected && evidence.activeSinksScanned === evidence.activeSinksExpected && evidence.newLeaks === 0 && evidence.purgeReviewed && evidence.readbackVerified;
for (const [key,value] of Object.entries(evidence)) console.log(key + "=" + value);
console.log("incident=" + (pass ? "contained-and-recovered" : "open"));`, "collectionStopped=true\ncredentialsRevoked=true\nkeysRotated=true\noldCredentialRejected=true\nactiveSinksScanned=8\nactiveSinksExpected=8\nnewLeaks=0\npurgeReviewed=true\nreadbackVerified=true\nincident=contained-and-recovered", ["owasp-logging", "nist-ssdf", "local-jwt-filter"] )],
  }),
  appliedTopic({
    id: "capstone-policy-rollout", title: "security policy와 filter/error contracts를 shadow·canary·rollback으로 배포합니다",
    lead: "인증·인가·CSRF/CORS·problem changes는 old frontend/token/policy와 공존하므로 한 번에 전환하지 않고 compatibility와 unexpected allow/deny guardrails를 둡니다.",
    mechanism: "shadow evaluator는 현재 decision을 유지한 채 새 authorization/CSRF/error mapping을 계산하고, canary는 작은 cohort에서 actual enforcement를 적용합니다. signed immutable policy/build revision과 cache/token compatibility를 rollback에 포함합니다.",
    workflow: "offline corpus→shadow differential→internal→small canary→guarded expansion→old path retirement→post-deploy reconciliation 순으로 진행합니다.",
    invariants: "fallback이 wildcard/permit-all/CSRF global disable/raw error가 아니고 unexpected allow·credential leak은 즉시 stop하며 rollback도 안전한 logging/headers를 유지합니다.",
    edgeCases: "rolling instances, old SPA caches, preflight max-age, session/token issued under old policy, policy resolver outage, telemetry loss와 emergency deny를 포함합니다.",
    failureModes: "deny spike만 보면 accidental allow를 놓치고 code rollback이 cache/token/policy/data divergence를 자동으로 복구한다고 가정하면 잠재 authorization 오류가 남습니다.",
    verification: "old/new decision/status/header differential, client compatibility, unexpected allow/mutation, cache/policy revision, rollback/readback와 reconciliation을 rehearsal합니다.",
    operations: "revision skew, unexpected allow/deny, auth latency, client retry, CSRF/CORS/CSP/errors, rollback and reconciliation health를 single dashboard로 운영합니다.",
    concepts: [c("security shadow evaluation", "현재 정책은 유지하고 새 정책/contract 결과를 side-effect 없이 병렬 계산하는 배포 단계입니다.", ["unexpected allow를 찾습니다.", "payload를 기록하지 않습니다."]), c("security canary", "제한된 cohort에 새 enforcement를 적용하고 hard invariants를 감시하는 배포 단계입니다.", ["blast radius를 줄입니다.", "rollback trigger를 둡니다."]), c("security reconciliation", "rollback/partial rollout 뒤 sessions, tokens, caches, policy와 client state의 차이를 탐지·수렴시키는 과정입니다.", ["코드 rollback과 별도입니다.", "owner/runbook이 필요합니다."])],
  }),
  appliedTopic({
    id: "capstone-architecture-review", title: "전문가 architecture review와 운영 handoff로 첫 Security 모듈을 완성합니다",
    lead: "framework 설정 review에서 끝내지 않고 threats, decisions, code/data boundaries, tests, telemetry, runbooks와 residual risks를 새 팀원이 독립 이해할 수 있는 package로 전달합니다.",
    mechanism: "architecture decision records에는 context/options/decision/tradeoffs/evidence/rollback을, diagrams에는 trust/data/control flows를, runbooks에는 symptoms/checks/safe actions/readback/escalation을 담습니다.",
    workflow: "source-backed current state→target architecture→gap/risk backlog→incremental migrations→qualification evidence→production readiness review→owner/on-call training→periodic revalidation을 수행합니다.",
    invariants: "문서는 runtime truth와 revision을 갖고 risky assumptions/known gaps를 숨기지 않으며 code links가 실제 source를 가리키고 secrets/PII는 포함하지 않습니다.",
    edgeCases: "new auth scheme/provider, API/mobile clients, ownership change, dependency major upgrade, incident exception, deprecated endpoint와 unavailable expert를 포함합니다.",
    failureModes: "최종 diagram만 예쁘게 만들고 negative tests/incident runbook/owners를 누락하면 변경·장애 때 설계를 재현하거나 안전하게 복구할 수 없습니다.",
    verification: "independent walkthrough, threat/control trace, commands/artifact rerun, failure drill, on-call simulation, link/revision/secret scan와 residual-risk acceptance를 확인합니다.",
    operations: "architecture/control doc age, owner coverage, drill results, residual risk/SLA, incident lessons와 dependency/policy changes를 periodic review에 연결합니다.",
    concepts: [c("security architecture package", "current/target diagrams, ADRs, threats, controls, tests, evidence, risks와 runbooks의 versioned 묶음입니다.", ["새 reader가 독립 이해할 수 있어야 합니다.", "source/artifact와 연결합니다."]), c("operational handoff", "개발자가 구현한 control을 운영자가 관찰·대응·복구할 수 있게 owner, dashboard, alert와 runbook을 전달하는 과정입니다.", ["drill로 검증합니다.", "연락처/권한을 확인합니다."]), c("periodic revalidation", "dependencies, clients, credentials와 threats 변화에 따라 control evidence와 assumptions를 정기적으로 다시 검증하는 절차입니다.", ["evidence expiry를 둡니다.", "major change 때 즉시 수행합니다."])],
    codeExamples: [node("security08-capstone-gate", "filter/authentication capstone readiness gate", "Security08CapstoneGate.mjs", "architecture, controls, evidence, incidents, rollback과 handoff를 최종 판정합니다.", String.raw`const readiness = { threatModel: true, filterChain: true, credentialLifecycle: true, authorization: true, browserSecurity: true, errorContract: true, verification: true, incidentRunbook: true, rollback: true, ownerHandoff: true, hardFindings: 0 };
const pass = Object.entries(readiness).every(([key,value]) => key === "hardFindings" ? value === 0 : value === true);
for (const [key,value] of Object.entries(readiness)) console.log(key + "=" + value);
console.log("capstone=" + (pass ? "pass" : "block"));`, "threatModel=true\nfilterChain=true\ncredentialLifecycle=true\nauthorization=true\nbrowserSecurity=true\nerrorContract=true\nverification=true\nincidentRunbook=true\nrollback=true\nownerHandoff=true\nhardFindings=0\ncapstone=pass", ["spring-architecture", "spring-testing", "owasp-asvs", "nist-zero-trust", "nist-ssdf"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-security-config", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/config/SecurityConfig.java", usedFor: ["filter/request/CSRF/CORS/entry-point current-state audit"], evidence: "2026-07-14 read-only sanitized audit: 106 lines, 6,013 bytes, SHA-256 B1051723C4FEE8FCBEC587B0A1CFCFA7A9EB0C461EBE59602DA980EF1D62CCD8. 실제 routes/origins/messages는 복사하지 않았습니다." },
  { id: "local-jwt-filter", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtRequestFilter.java", usedFor: ["custom bearer/context/failure current-state audit", "credential logging incident"], evidence: "2026-07-14 read-only sanitized audit: 94 lines, 4,208 bytes, SHA-256 EA08D71D7A21293E92451B7867142AB1582B403664C4A26C3D47213FE9E432B2. 실제 header/token/subject 값은 복사하지 않았습니다." },
  { id: "local-build", repository: "D:/dev/2026-myproject04-cicd", path: "build.gradle", usedFor: ["Boot 4.0.6/Java 21/dependency current-state boundary"], evidence: "2026-07-14 read-only audit: 56 lines, 2,047 bytes, SHA-256 CBF6CB4A2BDE7B7C072C924F3C03E009EF7EEE737314B1F4EDB82FB77EB5C0A5." },
  { id: "spring-architecture", repository: "Spring Security reference", path: "servlet/architecture.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/architecture.html", usedFor: ["FilterChainProxy, ExceptionTranslationFilter and filter architecture"], evidence: "Spring Security 공식 Servlet architecture reference입니다." },
  { id: "spring-auth-architecture", repository: "Spring Security reference", path: "servlet/authentication/architecture.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html", usedFor: ["AuthenticationManager/provider/context/entry-point architecture"], evidence: "Spring Security 공식 authentication architecture reference입니다." },
  { id: "spring-password", repository: "Spring Security reference", path: "features/authentication/password-storage.html", publicUrl: "https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html", usedFor: ["adaptive password storage and upgrade"], evidence: "Spring Security 공식 password storage reference입니다." },
  { id: "spring-session-security", repository: "Spring Security reference", path: "servlet/authentication/session-management.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html", usedFor: ["session fixation/concurrency/context lifecycle"], evidence: "Spring Security 공식 session management reference입니다." },
  { id: "spring-authorize-http", repository: "Spring Security reference", path: "servlet/authorization/authorize-http-requests.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html", usedFor: ["request authorization/default deny"], evidence: "Spring Security 공식 request authorization reference입니다." },
  { id: "spring-method-security", repository: "Spring Security reference", path: "servlet/authorization/method-security.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html", usedFor: ["method/object authorization"], evidence: "Spring Security 공식 method-security reference입니다." },
  { id: "spring-csrf", repository: "Spring Security reference", path: "servlet/exploits/csrf.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html", usedFor: ["browser CSRF protection/token lifecycle"], evidence: "Spring Security 공식 CSRF reference입니다." },
  { id: "spring-cors", repository: "Spring Security reference", path: "servlet/integrations/cors.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html", usedFor: ["CORS ordering/integration"], evidence: "Spring Security 공식 CORS reference입니다." },
  { id: "spring-headers", repository: "Spring Security reference", path: "servlet/exploits/headers.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/exploits/headers.html", usedFor: ["security response headers"], evidence: "Spring Security 공식 security headers reference입니다." },
  { id: "spring-testing", repository: "Spring Security reference", path: "servlet/test/index.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/test/index.html", usedFor: ["security control integration tests"], evidence: "Spring Security 공식 testing reference입니다." },
  { id: "rfc9457", repository: "IETF RFC 9457", path: "rfc9457.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["security Problem Details contract"], evidence: "Problem Details for HTTP APIs 표준입니다." },
  { id: "owasp-asvs", repository: "OWASP ASVS", path: "www-project-application-security-verification-standard", publicUrl: "https://owasp.org/www-project-application-security-verification-standard/", usedFor: ["capstone security verification control framework"], evidence: "OWASP 공식 ASVS project입니다." },
  { id: "owasp-password", repository: "OWASP Cheat Sheet Series", path: "Password_Storage_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", usedFor: ["password storage and upgrade risk"], evidence: "OWASP 공식 password storage guidance입니다." },
  { id: "owasp-session", repository: "OWASP Cheat Sheet Series", path: "Session_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", usedFor: ["session credential lifecycle"], evidence: "OWASP 공식 session management guidance입니다." },
  { id: "owasp-authorization", repository: "OWASP Cheat Sheet Series", path: "Authorization_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", usedFor: ["least privilege/object authorization/default deny"], evidence: "OWASP 공식 authorization guidance입니다." },
  { id: "owasp-csrf", repository: "OWASP Cheat Sheet Series", path: "Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", usedFor: ["browser CSRF defense in depth"], evidence: "OWASP 공식 CSRF prevention guidance입니다." },
  { id: "owasp-logging", repository: "OWASP Cheat Sheet Series", path: "Logging_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["credential-safe telemetry and incident sinks"], evidence: "OWASP 공식 logging guidance입니다." },
  { id: "nist-zero-trust", repository: "NIST SP 800-207", path: "sp/800/207/final", publicUrl: "https://csrc.nist.gov/pubs/sp/800/207/final", usedFor: ["least privilege/continuous policy and architecture review"], evidence: "NIST 공식 Zero Trust Architecture publication입니다." },
  { id: "nist-ssdf", repository: "NIST SP 800-218", path: "sp/800/218/final", publicUrl: "https://csrc.nist.gov/pubs/sp/800/218/final", usedFor: ["secure development evidence, incident and provenance"], evidence: "NIST 공식 Secure Software Development Framework publication입니다." },
];

const session = createExpertSession({
  inventoryId: "security-08-filter-authentication-capstone", slug: "security-08-filter-authentication-capstone", courseId: "devops", moduleId: "security-filter-authentication", order: 8,
  title: "filter·authentication·authorization capstone", subtitle: "source threat model에서 filter chain, credential·인가·browser·error controls, audit, credential incident와 안전한 rollout까지 production readiness로 통합합니다.",
  level: "전문가", estimatedMinutes: 230,
  coreQuestion: "Spring Security 기능 조각을 어떻게 하나의 위협 기반 architecture, 검증 가능한 controls와 사고 후 복구 가능한 운영 체계로 통합할까요?",
  summary: "Spring Boot 4.0.6/Java 21 학습 프로젝트의 SecurityConfig, custom JWT filter와 build snapshot을 read-only·sanitized audit해 현재 filter/request/CSRF/CORS/401 behavior와 gaps를 구분합니다. 특히 raw Authorization/token logging은 값 없이 credential incident로 분류합니다. trust-boundary threat model, one-response filter architecture, password/session/bearer lifecycle, request/method/object/tenant authorization, browser protections, RFC 9457 failures, control-evidence gate, revoke/rotate/contain/purge incident와 shadow/canary/rollback/operational handoff를 Spring·IETF·OWASP·NIST 근거 및 아홉 executable models로 통합합니다.",
  objectives: ["source snapshot을 threat/control/risk model로 변환한다.", "filter chain과 one-response architecture를 검증한다.", "password/session/bearer credential lifecycle을 연결한다.", "request/method/object/tenant authorization을 적용한다.", "CSRF/CORS/cookies/headers를 browser model로 통합한다.", "401/403/problem/client recovery를 중앙화한다.", "threat-control-test-artifact evidence gate를 만든다.", "credential logging incident를 revoke/rotate/purge/readback한다.", "security policy를 shadow/canary/rollback한다.", "architecture package와 운영 handoff를 완성한다."],
  prerequisites: [{ title: "security testing·audit evidence", reason: "각 control의 source/artifact/runtime evidence와 negative/browser/scan/audit limitations를 알아야 capstone readiness를 인상이나 checklist가 아닌 재현 가능한 gate로 판정할 수 있습니다.", sessionSlug: "security-07-security-testing-audit" }],
  keywords: ["Spring Security capstone", "FilterChainProxy", "credential lifecycle", "least privilege", "object authorization", "CSRF", "CORS", "Problem Details", "security evidence", "credential incident", "canary", "rollback", "operational handoff"],
  topics,
  lab: { title: "source-backed Spring Security architecture를 공격·장애·incident까지 qualification하기", scenario: "원본은 변경하지 않고 synthetic users/resources/credentials와 disposable Spring/DB/browser/proxy environment에서 정상/공격/장애/rollback/credential-leak recovery 전 과정을 실행합니다.", setup: ["Java 21/Spring Security compatible capstone app", "JUnit·MockMvc·disposable database", "3 HTTPS browser origins and proxy emulator", "synthetic password/session/bearer/CSRF credentials", "fault/clock/policy injectors", "structured telemetry and secret-canary sinks", "immutable audit artifact store", "원본 3 files read-only"], steps: ["원본 hashes와 source/build/current filter threat diagram을 redacted합니다.", "surface별 SecurityFilterChain/filter/handler/context one-response architecture를 구현합니다.", "password enroll/login/session/token/logout/revoke/rotation lifecycle을 synthetic credentials로 검증합니다.", "runtime routes, granular permissions, method/object/tenant/version policy와 negative side-effect-zero matrix를 실행합니다.", "separate origins에서 CSRF token rotation, CORS preflight, cookies, headers/CSP와 state readback을 검증합니다.", "missing/invalid/expired/denied/CSRF failures를 status/challenge/problem/client action/log sinks까지 matrix화합니다.", "control IDs를 Spring/DB/browser/scanner/abuse/recovery test evidence와 artifact revisions에 mapping합니다.", "source credential-logging incident를 가정해 stop/revoke/rotate/contain/purge/canary/readback을 rehearsal합니다.", "old/new policies와 clients를 shadow/canary rollout하고 unexpected allow/leak/rollback triggers를 검증합니다.", "independent architecture review, on-call drill, residual-risk acceptance와 원본 unchanged를 완료합니다."], expectedResult: ["모든 request가 의도된 chain/handler/policy에서 정확히 한 response와 bounded context lifecycle을 가집니다.", "credentials와 authorities가 lifecycle·resource 경계에서 최소 권한으로 수렴하고 deny 뒤 side effect가 없습니다.", "untrusted browser requests가 state를 변경하거나 credentialed response를 읽지 못하고 actual responses가 approved headers를 가집니다.", "security failures가 stable 401/403 problems와 제한된 client recovery를 사용하고 sensitive sinks가 0입니다.", "credential leak·policy regression·partial rollout을 verified revoke/rotate/rollback/reconciliation으로 복구할 수 있습니다.", "새 engineer/on-call이 package만으로 architecture, evidence, risks와 runbooks를 독립 재현합니다."], cleanup: ["synthetic credentials/users/resources, policies와 disposable DB를 폐기합니다.", "browser origins, proxy, contexts, faults, timers, caches, event/log sinks를 종료합니다.", "raw captures/canaries를 scan/redact 후 retention policy에 따라 삭제합니다.", "incident/rollback artifacts의 safe summary/digest만 보존하고 원본 3 files hash/status unchanged를 확인합니다."], extensions: ["Spring OAuth2 Resource Server JWT validation으로 custom filter migration을 qualification합니다.", "WebAuthn/MFA와 step-up authentication을 credential architecture에 추가합니다.", "external policy engine과 signed policy provenance를 canary 뒤 도입합니다.", "continuous control monitoring과 automated credential incident containment를 구현합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "아홉 Node models를 실행하고 threat/filter/credential/authz/browser/error/evidence/incident/capstone 단계에 대응시키세요.", requirements: ["stdout 완전 일치", "threat register", "filter sequence", "credential lifecycle", "authorization chain", "browser gate", "problem catalog", "control evidence", "incident gate", "capstone gate"], hints: ["Node models는 actual Spring filters, cryptography, database, browser와 incident system을 대체하지 않습니다."], expectedOutcome: "security architecture의 각 경계·불변식·evidence·recovery를 설명합니다.", solutionOutline: ["threat→enforce→lifecycle/policy→browser/errors→evidence/incident→handoff 순서입니다."] },
    { difficulty: "응용", prompt: "학습 source를 production-ready security architecture로 단계 migration하세요.", requirements: ["source claim boundary", "filter components", "credential lifecycle", "object authz", "browser defenses", "problem contract", "secret-safe logs", "audit gate", "incident/rollback"], hints: ["한 번의 big-bang rewrite 대신 seam, shadow와 canary를 사용하세요."], expectedOutcome: "old clients와 runtime risks를 통제하며 incremental하고 reversible한 migration이 완성됩니다.", solutionOutline: ["audit/threat→seams→controls/tests→shadow/canary→retire/recover 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 Spring Security production-readiness standard를 작성하세요.", requirements: ["threat/data flow", "filter/authn", "credential lifecycle", "authz", "browser", "errors/privacy", "verification/provenance", "incident/rollout", "ownership/revalidation"], hints: ["annotation/API checklist 대신 hard invariants와 evidence/readback을 중심으로 작성하세요."], expectedOutcome: "여러 서비스가 같은 security rigor와 운영 복구 기준을 공유합니다.", solutionOutline: ["architecture controls→evidence gates→operations/incident→periodic revalidation 순서입니다."] },
  ],
  nextSessions: ["security-09-jwt-structure-signature"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["실제 routes, origins, response messages, Authorization headers, tokens, subjects와 configuration secrets는 공개 content/examples/evidence에 복사하지 않았습니다.", "로컬 source의 raw Authorization/token logging은 credential disclosure incident risk로 분류했으며 운영 노출 가능성이 있다면 즉시 collection 중지, revoke/rotate, sink containment/purge와 readback이 필요합니다.", "authenticated fallback과 authority 없는 custom Authentication을 robust request/method/object authorization으로 과장하지 않고 target controls로 분리했습니다.", "Node models는 actual FilterChainProxy/provider/password hashing/crypto/DB/browser/proxy/incident systems를 대체하지 않으므로 capstone lab evidence를 요구합니다."] },
});

export default session;
