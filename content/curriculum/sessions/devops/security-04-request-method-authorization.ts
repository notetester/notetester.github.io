import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localRefs = ["local-security-config", "local-jwt-filter", "local-build"];

const topics = [
  appliedTopic({
    id: "authorization-source-audit", title: "학습 프로젝트의 request 규칙을 값 없이 복원하고 보장 범위를 구분합니다",
    lead: "permitAll·authenticated와 HTTP method matcher가 선언된 순서, custom JWT filter가 만든 Authentication의 authorities, method security 존재 여부를 하나의 decision trace로 복원합니다.",
    mechanism: "로컬 SecurityConfig는 일부 공개 경로와 한 GET 공개 규칙 뒤 anyRequest().authenticated()를 두고, JwtRequestFilter는 검증된 subject로 authority 없는 Authentication을 만듭니다. 따라서 현재 snapshot은 인증 여부는 표현하지만 role·permission·resource ownership을 증명하지 못합니다.",
    workflow: "원본을 read-only hash한 뒤 dispatcher type→method→normalized path→첫 request matcher→Authentication type/authorities→method interceptor→resource predicate→decision 순서의 redacted 표를 만듭니다.",
    invariants: "실제 route·subject·token·domain value를 공개 자료로 복사하지 않고, permitAll은 보안 filter 전체 우회가 아니며 authenticated는 대상 resource를 변경할 권한과 동일하지 않다고 명시합니다.",
    edgeCases: "ERROR/FORWARD dispatch, trailing slash와 encoded path, HEAD/OPTIONS, anonymous token, remember-me, authority 없음, stale account, 같은 경로의 다른 method를 포함합니다.",
    failureModes: "화면 버튼이 숨겨지거나 JWT 서명이 유효하다는 이유만으로 authorization이 끝났다고 판단하면 horizontal·vertical privilege escalation을 놓칩니다.",
    verification: "source hash, filter order, matcher first-match trace, Authentication authorities, method-security bootstrap과 owner predicate를 synthetic request matrix와 실제 MockMvc integration에서 대조합니다.",
    operations: "policy/build version, matched rule ID, principal class, resource class와 allow/deny reason만 low-cardinality로 남기고 subject·token·raw path parameter는 남기지 않습니다.",
    concepts: [c("authentication", "요청 주체가 누구인지 또는 어떤 credential을 증명했는지 나타내는 결과입니다.", ["Authentication 객체로 표현됩니다.", "권한 결정을 자동으로 보장하지 않습니다."]), c("authorization", "인증된 또는 익명 주체가 특정 action을 특정 resource에 수행할 수 있는지 결정하는 과정입니다.", ["request와 method/resource 층에서 반복합니다.", "deny-by-default가 기준입니다."]), c("source claim boundary", "로컬 코드에서 직접 관찰한 동작과 강화 설계를 구분하는 경계입니다.", ["버전과 hash를 기록합니다.", "부재를 보장으로 과장하지 않습니다."])],
    codeExamples: [node("security04-source-trace", "redacted authorization source trace", "Security04SourceTrace.mjs", "로컬 snapshot에서 관찰 가능한 rule과 아직 없는 resource policy를 값 없이 구분합니다.", String.raw`const observed = [
  ["public-auth", "path", "permitAll"],
  ["public-read", "method+path", "permitAll"],
  ["fallback", "any", "authenticated"],
];
for (const row of observed) console.log(row.join("|"));
console.log("granted-authorities=0");
console.log("resource-policy-observed=false");`, "public-auth|path|permitAll\npublic-read|method+path|permitAll\nfallback|any|authenticated\ngranted-authorities=0\nresource-policy-observed=false", localRefs.concat(["spring-authorization"]))],
  }),
  appliedTopic({
    id: "request-matcher-first-match", title: "RequestMatcher의 first-match와 dispatch 경계를 실행 가능한 정책으로 만듭니다",
    lead: "authorizeHttpRequests의 규칙은 목록 설명이 아니라 위에서 아래로 첫 일치 규칙이 결정을 소유하는 ordered program이므로 넓은 matcher가 좁은 규칙을 가리지 않게 설계합니다.",
    mechanism: "method, path, servlet path와 dispatcher type이 matcher 입력이며 AuthorizationFilter는 REQUEST뿐 아니라 다른 dispatch도 고려합니다. securityMatcher는 chain 선택이고 requestMatcher는 선택된 chain 내부 authorization이라는 서로 다른 경계입니다.",
    workflow: "공개 exact endpoints→정적/health의 좁은 규칙→method-specific permissions→authenticated business endpoints→explicit denyAll 순으로 inventory를 만들고 각 규칙에 stable ID를 부여합니다.",
    invariants: "모든 reachable request는 정확히 하나의 의도된 rule에 매칭되고 unmatched request는 허용되지 않으며 path normalization 책임을 proxy·container·firewall까지 포함해 일관되게 둡니다.",
    edgeCases: "동일 path의 GET/POST, HEAD fallback, OPTIONS preflight, ERROR dispatch, duplicate slash, encoded separator, context path, 여러 SecurityFilterChain ordering을 포함합니다.",
    failureModes: "상단의 광범위 permitAll이나 lower-priority chain이 먼저 선택되면 뒤의 admin·method 규칙은 실행되지 않아 정책이 코드에 있어도 효력이 없습니다.",
    verification: "rule reachability, overlap/shadow analysis, full method/path/dispatch negative matrix, actual filter-chain debug와 Spring Security test를 함께 실행합니다.",
    operations: "unmatched, unexpected-public, shadowed-rule와 deny reason을 policy revision별 집계하고 새 route가 inventory 없이 배포되면 gate를 차단합니다.",
    concepts: [c("first-match semantics", "여러 request 규칙 중 선언 순서상 처음 일치한 규칙이 결정을 내리는 의미입니다.", ["순서가 정책입니다.", "overlap을 분석합니다."]), c("securityMatcher", "특정 HttpSecurity로 만든 filter chain 자체가 적용될 요청 범위를 고르는 matcher입니다.", ["chain 내부 requestMatcher와 다릅니다.", "order와 함께 검토합니다."]), c("dispatcher type", "REQUEST, FORWARD, INCLUDE, ERROR, ASYNC처럼 servlet request가 처리되는 단계입니다.", ["같은 URI도 재-dispatch될 수 있습니다.", "허용은 의도적으로 선언합니다."])],
    codeExamples: [node("security04-ordered-rules", "first-match authorization evaluator", "Security04OrderedRules.mjs", "method/path에 대한 좁은 규칙과 deny-all fallback의 도달성을 확인합니다.", String.raw`const rules = [
  { id: "health-read", match: r => r.method === "GET" && r.path === "/health", decision: "permit" },
  { id: "record-write", match: r => r.method === "POST" && r.path === "/records", decision: "records:write" },
  { id: "fallback", match: () => true, decision: "deny" },
];
const requests = [{ method: "GET", path: "/health" }, { method: "POST", path: "/records" }, { method: "DELETE", path: "/records" }];
for (const request of requests) { const rule = rules.find(x => x.match(request)); console.log(request.method + "|" + request.path + "|" + rule.id + "|" + rule.decision); }`, "GET|/health|health-read|permit\nPOST|/records|record-write|records:write\nDELETE|/records|fallback|deny", ["spring-authorize-http", "rfc9110", "local-security-config"])],
  }),
  appliedTopic({
    id: "deny-default-policy-inventory", title: "route inventory와 deny-by-default를 신규 endpoint의 안전장치로 사용합니다",
    lead: "알려진 endpoint만 허용하고 그 밖의 경로는 차단하며, application route inventory와 security policy inventory의 차이를 CI에서 검출합니다.",
    mechanism: "framework mapping은 배포 때 추가될 수 있지만 security config가 자동으로 의도를 알 수는 없습니다. explicit fallback과 inventory diff가 새 controller·actuator·error route의 accidental exposure를 막습니다.",
    workflow: "RequestMapping metadata, actuator exposure, static resources와 error routes를 수집해 owner·data class·allowed actors/actions·request rule·method rule을 연결하고 orphan/overbroad rule을 실패시킵니다.",
    invariants: "정책에 없는 route는 deny, 정책에 없는 action은 deny, disabled feature의 endpoint도 deny이며 test-only/admin endpoints가 production artifact에 조용히 노출되지 않습니다.",
    edgeCases: "framework-generated endpoints, trailing variants, content negotiation, versioned API, deprecated route, management port와 feature flag off를 포함합니다.",
    failureModes: "anyRequest().authenticated()만으로 끝내면 새 endpoint가 로그인 사용자 전체에 자동 공개되고, 문서 inventory만 갱신하면 runtime mapping drift가 남습니다.",
    verification: "runtime mappings와 policy manifest의 set equality, anonymous/user/admin negative cases, packaged artifact route scan와 canary unauthorized probe를 실행합니다.",
    operations: "orphan route/rule, unexpected allow, policy age와 ownerless resource를 release dashboard에 연결하고 emergency deny switch를 rehearsal합니다.",
    concepts: [c("deny by default", "명시적으로 허용되지 않은 모든 요청과 action을 거부하는 정책 기본값입니다.", ["fallback denyAll로 표현할 수 있습니다.", "method/resource에도 적용합니다."]), c("route inventory", "실행 artifact가 실제 제공하는 method·path·dispatcher의 versioned 목록입니다.", ["문서가 아니라 runtime에서 수집합니다.", "policy와 diff합니다."]), c("policy drift", "route, identity model 또는 business rule과 authorization 선언이 서로 달라진 상태입니다.", ["CI와 runtime에서 탐지합니다.", "owner를 지정합니다."])],
    codeExamples: [node("security04-route-coverage", "route-to-policy coverage gate", "Security04RouteCoverage.mjs", "runtime routes와 policy rule의 차이를 찾아 미정 endpoint를 차단합니다.", String.raw`const routes = ["GET /health", "GET /records", "POST /records", "DELETE /records/:id"];
const policy = new Set(["GET /health", "GET /records", "POST /records"]);
const uncovered = routes.filter(route => !policy.has(route));
console.log("routes=" + routes.length);
console.log("covered=" + (routes.length - uncovered.length));
console.log("uncovered=" + uncovered.join(","));
console.log("release=" + (uncovered.length ? "block" : "pass"));`, "routes=4\ncovered=3\nuncovered=DELETE /records/:id\nrelease=block", ["spring-authorize-http", "owasp-authorization", "cwe-862"])],
  }),
  appliedTopic({
    id: "authorities-roles-permissions", title: "role shortcut과 granular authority를 실제 업무 action으로 번역합니다",
    lead: "hasRole의 prefix 규칙을 암기하는 데서 멈추지 않고 principal이 획득한 authority가 어느 issuer·계정 상태·tenant·policy version에서 왔는지 추적합니다.",
    mechanism: "GrantedAuthority는 문자열 permission을 표현하고 hasRole은 관례적 prefix를 붙이는 shortcut입니다. coarse role은 permission 집합으로 변환하고 disabled/locked/stale membership과 step-up 조건을 decision input에 포함합니다.",
    workflow: "resource:action 명명, role→permission mapping, issuance/revocation, hierarchy, tenant scope와 SoD를 versioned policy로 만들고 Authentication 생성 시 최소 권한만 snapshot합니다.",
    invariants: "사용자 입력을 authority로 신뢰하지 않고, role 이름이 object ownership을 대체하지 않으며 privilege 변경은 session/token lifetime 안에 폐기 또는 재평가됩니다.",
    edgeCases: "authority 없음, duplicate/conflicting roles, renamed permission, deleted membership, cross-tenant admin, break-glass와 clock/skewed cache를 포함합니다.",
    failureModes: "ROLE_ADMIN 하나로 모든 domain action을 묶거나 오래된 JWT authority를 무기한 신뢰하면 최소 권한과 신속한 revoke가 불가능합니다.",
    verification: "role-permission truth table, issuance source, negative permission combinations, revoke latency, cross-tenant와 privilege escalation regression을 실행합니다.",
    operations: "permission allow/deny, stale policy/token age, privileged action, break-glass duration과 revocation lag를 actor 식별자 없이 집계합니다.",
    concepts: [c("GrantedAuthority", "Authentication에 부여된 개별 권한을 표현하는 Spring Security 계약입니다.", ["보통 문자열 authority를 사용합니다.", "발급 근거와 수명을 검증합니다."]), c("role", "여러 permission을 업무 책임 단위로 묶은 coarse-grained 정책 개념입니다.", ["Spring shortcut의 prefix를 이해합니다.", "resource 조건을 대체하지 않습니다."]), c("least privilege", "주체가 현재 업무에 필요한 최소 action·resource·시간 범위만 갖게 하는 원칙입니다.", ["default deny와 함께 씁니다.", "정기적으로 재인증합니다."])],
    codeExamples: [node("security04-authority-matrix", "role-permission expansion and decision", "Security04AuthorityMatrix.mjs", "role을 granular permission으로 확장해 action별 결정을 출력합니다.", String.raw`const roleMap = { reader: ["record:read"], editor: ["record:read", "record:write"] };
const principal = { roles: ["reader"], direct: ["profile:write"] };
const granted = new Set([...principal.roles.flatMap(role => roleMap[role] ?? []), ...principal.direct]);
for (const permission of ["record:read", "record:write", "profile:write"]) console.log(permission + "=" + granted.has(permission));
console.log("unknown=deny");`, "record:read=true\nrecord:write=false\nprofile:write=true\nunknown=deny", ["spring-authorization", "spring-method-security", "nist-zero-trust"])],
  }),
  appliedTopic({
    id: "method-security-defense-depth", title: "@EnableMethodSecurity와 @PreAuthorize를 service use case 경계에 둡니다",
    lead: "URL 규칙을 통과한 뒤에도 scheduler, messaging, alternate controller와 직접 service 호출이 같은 업무 정책을 지키도록 method invocation을 두 번째 authorization 경계로 사용합니다.",
    mechanism: "method security interceptor는 proxy를 통과하는 호출 전후에 AuthorizationManager를 적용합니다. @PreAuthorize는 호출 전 input/principal 조건, @PostAuthorize는 결과 기반 조건을 표현하지만 결과가 이미 계산된 비용·부작용과 self-invocation 한계를 고려합니다.",
    workflow: "business capability 단위 service method에 permission과 resource policy를 배치하고 meta-annotation으로 의미를 이름 붙이며 request policy와 중복이 아니라 defense-in-depth matrix로 연결합니다.",
    invariants: "모든 privileged use case는 transport와 무관하게 보호되고, annotation 없는 public service와 self-invocation을 inventory하며, authorization 이전에 mutation이 일어나지 않습니다.",
    edgeCases: "self-invocation, private/final method, async thread, transaction ordering, proxy interface, multiple annotations와 post-filter 대량 collection을 포함합니다.",
    failureModes: "controller annotation만 두면 비웹 호출이 우회할 수 있고, proxy 밖 self-call을 보호된 것으로 오해하면 실제 interceptor가 실행되지 않습니다.",
    verification: "ApplicationContext에서 interceptor/advisor 존재, 외부 proxy call과 self-call 차이, anonymous/authority/resource negative tests, transaction side-effect zero를 검증합니다.",
    operations: "method policy ID, allow/deny reason, invocation source와 policy version을 authorization event로 연결하되 argument/result payload는 기록하지 않습니다.",
    concepts: [c("method security", "Spring bean method invocation을 authorization interceptor로 보호하는 기능입니다.", ["@EnableMethodSecurity로 활성화합니다.", "request security를 보완합니다."]), c("@PreAuthorize", "method 실행 전에 expression 또는 AuthorizationManager로 접근을 결정하는 annotation입니다.", ["input과 principal을 참조할 수 있습니다.", "정책을 meta-annotation으로 캡슐화합니다."]), c("proxy boundary", "Spring AOP interceptor가 적용되는 bean proxy를 통과하는 호출 경계입니다.", ["self-invocation을 주의합니다.", "integration test로 확인합니다."])],
  }),
  appliedTopic({
    id: "object-level-authorization", title: "ID가 아니라 principal-resource 관계로 object-level authorization을 수행합니다",
    lead: "사용자가 전송한 record ID, owner 문자열이나 UI visibility를 권한으로 취급하지 않고 server가 조회한 resource의 tenant·owner·status와 action을 함께 평가합니다.",
    mechanism: "request-level role은 endpoint 진입을 제한하지만 같은 endpoint 안의 각 object 접근은 별도입니다. query 자체에 tenant/owner predicate를 넣거나 조회 후 policy component가 검증하고 mutation affected-row까지 확인합니다.",
    workflow: "principal ID/tenant를 trusted context에서 얻고 request ID로 resource를 조회한 뒤 action, ownership, membership, lifecycle state와 exceptional delegation을 policy에 전달합니다.",
    invariants: "client-supplied owner/role은 무시하고 존재 여부를 과도하게 노출하지 않으며 update/delete는 authorization predicate와 version을 만족한 정확한 row만 변경합니다.",
    edgeCases: "enumerated IDs, deleted/archived resource, transferred ownership, shared resource, tenant move, admin support, batch endpoint와 nested child를 포함합니다.",
    failureModes: "로그인만 검사하거나 record.owner == request.body.owner를 비교하면 IDOR/BOLA와 mass assignment가 발생합니다.",
    verification: "owner/other/same-role/cross-tenant/admin/anonymous matrix, ID tamper, field tamper, batch partial deny와 affected-row zero/many를 테스트합니다.",
    operations: "object policy reason, resource type, action, tenant class와 deny spike를 수집하되 raw ID와 개인정보는 hash조차 불필요하면 남기지 않습니다.",
    concepts: [c("object-level authorization", "특정 resource instance에 대한 action 권한을 principal-resource 관계로 판단하는 정책입니다.", ["endpoint role 검사와 별도입니다.", "모든 object ID를 검증합니다."]), c("IDOR/BOLA", "공격자가 식별자를 바꾸어 권한 없는 object에 접근하는 취약점 범주입니다.", ["추측 어려운 ID만으로 막히지 않습니다.", "server-side policy가 필요합니다."]), c("affected-row check", "mutation이 예상한 authorization·version predicate에 맞는 정확한 행 수를 변경했는지 확인하는 불변식입니다.", ["0은 conflict/deny/not-found를 구분합니다.", "다수는 rollback합니다."])],
    codeExamples: [node("security04-object-policy", "tenant-owner object policy", "Security04ObjectPolicy.mjs", "synthetic principal과 resource 관계로 read/update 결정을 분리합니다.", String.raw`function decide(principal, resource, action) {
  if (!principal || principal.tenant !== resource.tenant) return "deny:tenant";
  if (action === "read" && (resource.owner === principal.id || principal.permissions.includes("record:read:any"))) return "allow";
  if (action === "update" && resource.owner === principal.id && principal.permissions.includes("record:update:own")) return "allow";
  return "deny:policy";
}
const resource = { tenant: "t1", owner: "u1" };
const cases = [{ id: "u1", tenant: "t1", permissions: ["record:update:own"] }, { id: "u2", tenant: "t1", permissions: [] }, { id: "u1", tenant: "t2", permissions: ["record:read:any"] }];
for (const p of cases) console.log(p.id + "|" + p.tenant + "|update|" + decide(p, resource, "update"));`, "u1|t1|update|allow\nu2|t1|update|deny:policy\nu1|t2|update|deny:tenant", ["owasp-authorization", "owasp-idor", "cwe-639", "spring-method-security"])],
  }),
  appliedTopic({
    id: "policy-components-meta-annotations", title: "복잡한 정책을 testable AuthorizationManager와 domain meta-annotation으로 분리합니다",
    lead: "긴 SpEL과 controller별 중복 조건을 줄이고 policy input/output을 명시한 component로 만들어 같은 판단을 request, method와 batch 경계에서 재사용합니다.",
    mechanism: "AuthorizationManager는 Authentication supplier와 secure object를 입력으로 decision을 반환하며 method security meta-annotation은 업무 이름을 코드에 남깁니다. repository 조회가 필요한 policy는 timeout/cache/stale과 transaction boundary도 계약에 포함합니다.",
    workflow: "정책을 pure rule, attribute resolver, decision combiner와 audit publisher로 나누고 stable deny reason·policy version을 반환하게 설계합니다.",
    invariants: "policy failure/timeout은 allow가 아니며 expression에 arbitrary bean/data access를 숨기지 않고 same input은 same policy snapshot에서 같은 결정을 냅니다.",
    edgeCases: "missing attributes, resolver outage, stale membership cache, multiple annotations, conflicting allow/deny, batch mixed resources와 policy rollout을 포함합니다.",
    failureModes: "각 annotation의 ad-hoc SpEL이 repository를 호출하면 N+1, 예외 허용, 관찰 불가능성과 review drift가 생깁니다.",
    verification: "pure policy table, resolver contract/fault tests, composition precedence, cache expiry, annotation wiring과 request/method parity를 실행합니다.",
    operations: "policy evaluation latency, resolver failure, cache age, decision reason와 revision을 bounded labels로 관찰합니다.",
    concepts: [c("AuthorizationManager", "secure object와 Authentication을 바탕으로 authorization 결정을 만드는 Spring Security 전략 계약입니다.", ["request와 method 계층에 사용됩니다.", "composition할 수 있습니다."]), c("meta-annotation", "여러 security annotation/expression을 업무 의미의 단일 annotation으로 캡슐화하는 방법입니다.", ["정책 이름을 명확히 합니다.", "wiring test가 필요합니다."]), c("fail closed", "정책 평가 실패·timeout·불명확한 상태를 허용이 아니라 거부로 처리하는 원칙입니다.", ["복구 경로를 제공합니다.", "가용성 tradeoff를 운영합니다."])],
  }),
  appliedTopic({
    id: "tenant-delegation-break-glass", title: "tenant isolation·delegation·break-glass를 시간 제한 정책으로 설계합니다",
    lead: "관리자라는 전역 문자열에 의존하지 않고 어느 tenant의 어떤 resource/action을 누구 대신 언제까지 수행하는지 명시합니다.",
    mechanism: "tenant membership, delegated scope, approval, purpose, expiry와 session assurance를 decision attributes로 사용하고 break-glass는 정상 role이 아니라 별도 audited capability로 취급합니다.",
    workflow: "default tenant boundary→owner/team permissions→time-bounded delegation→dual-approved emergency capability 순으로 정책을 겹치고 revoke propagation과 post-incident review를 연결합니다.",
    invariants: "tenant mismatch는 명시적 예외 없이는 deny, delegation은 transitive하지 않고 expiry 후 즉시 무효이며 break-glass action은 최소 scope·짧은 TTL·사후 검토를 가집니다.",
    edgeCases: "membership 변경 중 token, tenant merge, delegated user 삭제, clock skew, incident 중 identity provider outage와 offline worker를 포함합니다.",
    failureModes: "super-admin bypass가 code 곳곳에 흩어지면 tenant boundary를 검증할 수 없고 침해 시 blast radius가 전체 데이터로 확장됩니다.",
    verification: "cross-tenant negative property tests, delegation issue/use/revoke/expire, break-glass approval·TTL·scope와 audit completeness를 검증합니다.",
    operations: "cross-tenant deny, active delegations, emergency grants, expiry/revoke lag와 review overdue를 보안 운영에 연결합니다.",
    concepts: [c("tenant isolation", "한 tenant의 주체가 다른 tenant resource에 접근하지 못하게 모든 data path에 적용하는 경계입니다.", ["query와 policy 모두에 적용합니다.", "cache key도 분리합니다."]), c("delegation", "특정 주체가 제한된 action을 다른 주체에게 일정 기간 맡기는 capability입니다.", ["scope와 expiry가 필수입니다.", "재위임을 통제합니다."]), c("break-glass", "긴급 상황에서 엄격한 승인·최소 scope·감사 하에 일시 권한을 부여하는 절차입니다.", ["일상 role이 아닙니다.", "사후 review가 필수입니다."])],
  }),
  appliedTopic({
    id: "authorization-test-matrix", title: "positive보다 더 큰 negative authorization matrix를 자동화합니다",
    lead: "허용되어야 할 한 사례뿐 아니라 anonymous, wrong authority, same role other resource, cross-tenant와 stale privilege를 모든 endpoint·method·service action에 적용합니다.",
    mechanism: "unit policy tests는 rule logic, method tests는 proxy/interceptor, MockMvc는 filter/matcher/status, repository integration은 query predicates/affected rows, E2E는 client가 401/403 뒤 안전한 상태를 유지하는지 증명합니다.",
    workflow: "actor classes×resource relations×actions×states×transport를 pairwise/property-based로 생성하고 최소 필수 allow set 외에는 모두 deny expectation으로 둡니다.",
    invariants: "mock user 이름만 바꾸는 test가 아니라 authorities와 resource fixture를 명시하고, deny 뒤 side effect·event·cache mutation이 0이며 test bypass profile이 production에 없습니다.",
    edgeCases: "ERROR dispatch, async, batch mixed ownership, race로 owner 변경, stale token, policy resolver fault와 rollback을 포함합니다.",
    failureModes: "status 403만 확인하고 DB/cache side effect를 보지 않으면 authorization 이후 일부 mutation이나 timing leak을 놓칩니다.",
    verification: "decision, HTTP status/problem, response equivalence, DB affected rows, events, logs redaction, cache와 latency budget을 한 test evidence에 연결합니다.",
    operations: "policy coverage, mutation-after-deny, flaky race, missing negative combinations와 production deny baseline을 release gate로 사용합니다.",
    concepts: [c("authorization matrix", "actor, resource relation, action과 state 조합별 예상 allow/deny를 적은 executable 표입니다.", ["positive와 negative를 함께 둡니다.", "새 policy 때 diff합니다."]), c("side-effect zero", "거부된 요청이 DB, message, cache와 외부 시스템을 변경하지 않아야 한다는 불변식입니다.", ["transaction과 event를 검사합니다.", "response status만으로 충분하지 않습니다."]), c("policy coverage", "reachable endpoint/use case와 actor-resource 조합 중 자동화된 authorization evidence가 있는 비율입니다.", ["line coverage와 다릅니다.", "위험 기반 gate로 씁니다."])],
    codeExamples: [node("security04-negative-matrix", "authorization negative-matrix gate", "Security04NegativeMatrix.mjs", "actor-resource-action 조합에서 오직 의도한 최소 allow set만 통과하는지 계산합니다.", String.raw`const actors = ["anonymous", "owner", "other", "admin"];
const actions = ["read", "update", "delete"];
const allowed = new Set(["owner:read", "owner:update", "owner:delete", "admin:read", "admin:delete"]);
let allow = 0, deny = 0;
for (const actor of actors) for (const action of actions) allowed.has(actor + ":" + action) ? allow++ : deny++;
console.log("cases=" + actors.length * actions.length);
console.log("allow=" + allow);
console.log("deny=" + deny);
console.log("default-deny=" + (allow + deny === 12));`, "cases=12\nallow=5\ndeny=7\ndefault-deny=true", ["spring-security-test", "owasp-authorization", "cwe-862", "cwe-639"])],
  }),
  appliedTopic({
    id: "authorization-events-rollout", title: "authorization events·canary·rollback으로 정책 변경을 운영합니다",
    lead: "authorization은 배포 후 끝나는 정적 설정이 아니라 route·role·tenant 변화와 함께 진화하므로 decision evidence와 안전한 policy rollout이 필요합니다.",
    mechanism: "allow/deny event에는 policy ID/revision, actor/resource class, action, matched layer와 reason을 넣고 payload·token·PII를 제외합니다. shadow evaluation은 old policy가 결정을 소유한 채 new decision 차이를 측정합니다.",
    workflow: "offline corpus→shadow compare→internal cohort→small canary→guarded rollout 순으로 진행하고 unexpected allow, deny spike, latency와 resolver failure가 threshold를 넘으면 old revision으로 되돌립니다.",
    invariants: "shadow policy가 side effect나 response를 바꾸지 않고, log 유실이 허용으로 이어지지 않으며 rollback artifact와 policy cache compatibility를 사전 검증합니다.",
    edgeCases: "old token/new role, rolling instances with two policy revisions, event backlog, clock skew, telemetry outage와 emergency deny를 포함합니다.",
    failureModes: "deny 수 감소만 성공으로 보면 accidental allow를 놓치며, raw subject/resource ID를 고카디널리티 label로 남기면 개인정보와 비용 문제가 생깁니다.",
    verification: "golden corpus, old/new differential, canary guardrail, telemetry redaction/cardinality, rollback/readback와 revoke propagation을 rehearsal합니다.",
    operations: "unexpected allow=즉시 차단, deny reason shift, p95 decision latency, resolver errors와 policy revision skew에 owner·runbook을 연결합니다.",
    concepts: [c("authorization event", "정책 평가의 입력 분류, 결정, reason과 revision을 privacy-safe하게 기록한 사건입니다.", ["allow와 deny를 모두 다룹니다.", "payload는 기록하지 않습니다."]), c("shadow evaluation", "현재 정책은 그대로 두고 새 정책의 결정을 병렬 계산해 차이를 관찰하는 배포 단계입니다.", ["side effect가 없어야 합니다.", "unexpected allow를 찾습니다."]), c("policy rollback", "문제가 있는 policy revision을 검증된 이전 revision으로 되돌리고 cache·token 영향을 reconcile하는 절차입니다.", ["artifact를 불변으로 보존합니다.", "readback을 확인합니다."])],
    codeExamples: [node("security04-release-gate", "authorization policy rollout gate", "Security04ReleaseGate.mjs", "unexpected allow·deny spike·latency·coverage·rollback evidence로 rollout을 판정합니다.", String.raw`const evidence = { unexpectedAllow: 0, denySpikePercent: 2, p95Ms: 8, policyCoverage: 100, rollbackVerified: true, sensitiveLogFindings: 0 };
const pass = evidence.unexpectedAllow === 0 && evidence.denySpikePercent <= 5 && evidence.p95Ms <= 20 && evidence.policyCoverage === 100 && evidence.rollbackVerified && evidence.sensitiveLogFindings === 0;
for (const [key, value] of Object.entries(evidence)) console.log(key + "=" + value);
console.log("release=" + (pass ? "pass" : "block"));`, "unexpectedAllow=0\ndenySpikePercent=2\np95Ms=8\npolicyCoverage=100\nrollbackVerified=true\nsensitiveLogFindings=0\nrelease=pass", ["spring-authz-events", "spring-authorization", "owasp-logging", "nist-zero-trust"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-security-config", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/config/SecurityConfig.java", usedFor: ["request matcher order", "public/authenticated boundary", "exception/filter context"], evidence: "2026-07-14 read-only sanitized audit: 106 lines, 6,013 bytes, SHA-256 B1051723C4FEE8FCBEC587B0A1CFCFA7A9EB0C461EBE59602DA980EF1D62CCD8. 실제 route/origin/message 값은 공개 예제에 복사하지 않았습니다." },
  { id: "local-jwt-filter", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtRequestFilter.java", usedFor: ["Authentication construction", "authority/resource-policy gap", "filter boundary"], evidence: "2026-07-14 read-only sanitized audit: 94 lines, 4,208 bytes, SHA-256 EA08D71D7A21293E92451B7867142AB1582B403664C4A26C3D47213FE9E432B2. credential/token/subject 값은 복사하지 않았습니다." },
  { id: "local-build", repository: "D:/dev/2026-myproject04-cicd", path: "build.gradle", usedFor: ["source snapshot runtime/version boundary"], evidence: "2026-07-14 read-only audit: 56 lines, 2,047 bytes, SHA-256 CBF6CB4A2BDE7B7C072C924F3C03E009EF7EEE737314B1F4EDB82FB77EB5C0A5. Spring Boot 4.0.6, Java 21과 managed Spring Security snapshot을 현재 공식 문서와 구분했습니다." },
  { id: "spring-authorization", repository: "Spring Security reference", path: "servlet/authorization", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authorization/", usedFor: ["request/method authorization model", "Spring Security 7 migration boundary"], evidence: "Spring Security 공식 authorization reference입니다." },
  { id: "spring-authorize-http", repository: "Spring Security reference", path: "servlet/authorization/authorize-http-requests.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html", usedFor: ["authorizeHttpRequests", "first-match/matcher/dispatch semantics"], evidence: "Spring Security 공식 request authorization reference입니다." },
  { id: "spring-method-security", repository: "Spring Security reference", path: "servlet/authorization/method-security.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html", usedFor: ["@EnableMethodSecurity", "@PreAuthorize and interceptors"], evidence: "Spring Security 공식 method-security reference입니다." },
  { id: "spring-security-test", repository: "Spring Security reference", path: "servlet/test/mockmvc/index.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/test/mockmvc/index.html", usedFor: ["MockMvc authorization tests"], evidence: "Spring Security 공식 MockMvc integration reference입니다." },
  { id: "spring-authz-events", repository: "Spring Security reference", path: "servlet/authorization/events.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authorization/events.html", usedFor: ["authorization event publication"], evidence: "Spring Security 공식 authorization events reference입니다." },
  { id: "owasp-authorization", repository: "OWASP Cheat Sheet Series", path: "Authorization_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", usedFor: ["least privilege", "deny by default", "authorization tests"], evidence: "OWASP 공식 authorization guidance입니다." },
  { id: "owasp-idor", repository: "OWASP Cheat Sheet Series", path: "Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html", usedFor: ["object-level authorization", "ID tamper defense"], evidence: "OWASP 공식 IDOR prevention guidance입니다." },
  { id: "owasp-logging", repository: "OWASP Cheat Sheet Series", path: "Logging_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["authorization event privacy", "security monitoring"], evidence: "OWASP 공식 logging guidance입니다." },
  { id: "cwe-862", repository: "MITRE CWE", path: "data/definitions/862.html", publicUrl: "https://cwe.mitre.org/data/definitions/862.html", usedFor: ["missing authorization weakness", "route policy coverage"], evidence: "MITRE 공식 CWE-862 entry입니다." },
  { id: "cwe-639", repository: "MITRE CWE", path: "data/definitions/639.html", publicUrl: "https://cwe.mitre.org/data/definitions/639.html", usedFor: ["user-controlled key authorization weakness", "negative object tests"], evidence: "MITRE 공식 CWE-639 entry입니다." },
  { id: "nist-zero-trust", repository: "NIST SP 800-207", path: "sp/800/207/final", publicUrl: "https://csrc.nist.gov/pubs/sp/800/207/final", usedFor: ["least privilege and continuous policy evaluation", "policy rollout"], evidence: "NIST 공식 Zero Trust Architecture publication입니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["HTTP method semantics", "request boundary"], evidence: "HTTP Semantics 표준입니다." },
];

const session = createExpertSession({
  inventoryId: "security-04-request-method-authorization", slug: "security-04-request-method-authorization", courseId: "devops", moduleId: "security-filter-authentication", order: 4,
  title: "request·method·resource 인가", subtitle: "ordered request matchers에서 method proxy와 object/tenant policy, negative matrix, policy rollout까지 defense in depth로 연결합니다.",
  level: "고급", estimatedMinutes: 170,
  coreQuestion: "인증된 요청이라는 사실을 넘어 누가 어떤 resource에 어떤 action을 할 수 있는지 request, method와 data boundary마다 어떻게 일관되게 검증하고 운영할까요?",
  summary: "Spring Boot 4.0.6/Java 21 학습 프로젝트의 SecurityConfig, JWT filter와 build snapshot 3개를 read-only·sanitized 감사해 현재의 public/authenticated matcher와 authority/resource-policy gap을 정확히 구분합니다. 실제 route, token, subject와 origin은 복사하지 않습니다. first-match/dispatch, deny-by-default route inventory, granular authorities, method-security proxy, object/tenant authorization, test matrix와 authorization-event shadow rollout을 Spring Security·OWASP·MITRE·NIST·IETF 근거 및 여섯 executable models로 완성합니다.",
  objectives: ["로컬 request authorization 보장과 gap을 redacted audit한다.", "first-match·chain·dispatcher semantics를 적용한다.", "runtime route inventory와 deny-by-default를 CI gate로 만든다.", "role과 granular authority의 발급·revoke lifecycle을 설계한다.", "method security proxy와 meta-annotation을 검증한다.", "principal-resource 관계로 IDOR/BOLA를 차단한다.", "tenant·delegation·break-glass 정책을 제한한다.", "negative matrix에서 side-effect zero를 증명한다.", "authorization events와 shadow/canary/rollback을 운영한다."],
  prerequisites: [{ title: "session login·Authentication과 SecurityContext", reason: "인증 filter/provider가 만든 Authentication과 SecurityContext의 수명·경계를 알아야 그 principal/authorities를 인가 입력으로 안전하게 사용할 수 있습니다.", sessionSlug: "security-03-session-login-authentication" }],
  keywords: ["authorizeHttpRequests", "RequestMatcher", "AuthorizationManager", "@PreAuthorize", "GrantedAuthority", "deny by default", "IDOR", "BOLA", "tenant isolation", "least privilege", "authorization event", "policy rollback"],
  topics,
  lab: { title: "request→method→resource authorization을 deny-by-default로 qualification하기", scenario: "원본 파일은 변경하지 않고 synthetic route/controller/service/resources와 disposable Spring Security application에서 policy manifest, negative matrix, shadow rollout과 rollback을 검증합니다.", setup: ["Java 21", "Spring Boot 4/Spring Security compatible test fixture", "JUnit·Spring Security Test·MockMvc", "disposable database", "policy manifest/diff tool", "deterministic clock", "privacy-safe event sink", "원본 3 files read-only"], steps: ["원본 hash와 request/filter/Auth authorities를 redacted trace로 기록합니다.", "runtime routes와 first-match request rules를 추출해 overlap/shadow/uncovered를 차단합니다.", "resource:action authority와 role mapping, issuance/revoke contract를 정의합니다.", "@EnableMethodSecurity와 business meta-annotations를 service proxy에 적용합니다.", "principal/tenant/owner/version 기반 object policy와 affected-row predicate를 구현합니다.", "anonymous/owner/other/admin/cross-tenant×read/write/delete negative matrix를 실행합니다.", "deny 뒤 DB/cache/event side effect가 0인지 fault와 race를 포함해 검증합니다.", "authorization events를 redaction하고 old/new policy shadow differential을 측정합니다.", "unexpected allow/deny spike/latency/coverage guardrail로 canary와 rollback을 rehearsal합니다.", "원본 files의 hash/git status unchanged를 확인합니다."], expectedResult: ["모든 runtime route가 의도된 단 하나의 request rule과 business policy에 연결됩니다.", "로그인 여부나 client 값이 아니라 trusted principal-resource 관계가 action을 결정합니다.", "method/transport 우회와 cross-tenant·ID tamper가 deny되고 side effect가 없습니다.", "정책 변경이 unexpected allow 없이 shadow/canary/rollback evidence를 남깁니다.", "로그·metric에 token, subject, raw resource ID와 개인정보가 남지 않습니다."], cleanup: ["synthetic users, roles, resources, policies와 database를 제거합니다.", "test contexts, event sinks, timers, caches와 feature flags를 종료합니다.", "authorization traces를 retention/redaction policy에 따라 폐기합니다.", "원본 3 files hash/status unchanged를 재확인합니다."], extensions: ["OPA/Cedar 같은 external policy decision point를 adapter 뒤에 qualification합니다.", "property-based route/object authorization matrix를 자동 생성합니다.", "privileged access management와 dual approval을 연동합니다.", "policy-as-code 서명·provenance와 organization-wide drift dashboard를 추가합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Node models를 실행하고 request/method/resource/operation evidence에 각각 대응시키세요.", requirements: ["stdout 완전 일치", "source trace", "first-match", "route coverage", "authority mapping", "object policy", "negative matrix", "rollout gate"], hints: ["Node decision model은 실제 Spring filter/proxy/DB transaction을 대체하지 않습니다."], expectedOutcome: "인가 결정의 각 층과 실패 시 side-effect/rollback 증거를 설명합니다.", solutionOutline: ["audit→match→default deny→authority/method→object/tenant→test/operate 순서입니다."] },
    { difficulty: "응용", prompt: "한 CRUD API를 request role 검사에서 tenant-aware object authorization으로 강화하세요.", requirements: ["route inventory", "least privilege", "method policy", "owner/tenant predicate", "affected rows", "negative matrix", "events", "canary rollback"], hints: ["client가 보낸 owner나 UI 버튼을 권한으로 사용하지 마세요."], expectedOutcome: "horizontal/vertical escalation과 policy drift를 자동으로 차단하는 feature가 완성됩니다.", solutionOutline: ["inventory→policy input→enforce twice→prove deny→roll out 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 authorization governance를 작성하세요.", requirements: ["identity/authority lifecycle", "route/method/object policy", "tenant/delegation", "default deny", "testing", "privacy-safe events", "policy provenance", "incident rollback"], hints: ["framework annotation 목록이 아니라 data/action/owner와 evidence 기준을 중심으로 작성하세요."], expectedOutcome: "새 서비스도 같은 최소 권한·검증·운영 기준을 적용할 수 있습니다.", solutionOutline: ["facts→policy→enforcement→evidence→rollout/recovery 순서입니다."] },
  ],
  nextSessions: ["security-05-csrf-cors-security-headers"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["로컬 source의 실제 route, origin, message, subject, token과 domain literal은 공개 content에 복사하지 않았습니다.", "로컬 snapshot에서 authorities가 없는 Authentication 생성과 request authenticated fallback을 관찰했지만 role/method/object authorization 구현으로 과장하지 않습니다.", "source build는 Spring Boot 4.0.6/Java 21 snapshot이며 현재 Spring Security 7.1/7.0/6.5 공식 문서의 버전별 차이를 적용 시 lockfile과 API로 다시 확인해야 합니다.", "Node models는 actual RequestMatcher normalization, filter-chain order, AOP proxy, transaction과 database isolation을 대체하지 않으므로 lab integration을 요구합니다."] },
});

export default session;
