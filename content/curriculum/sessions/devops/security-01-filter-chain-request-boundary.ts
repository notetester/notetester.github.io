import type { SessionSource } from "../../types";
import { appliedTopic, concept, nodeExample } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const topics: ExpertTopic[] = [
  appliedTopic({
    id: "local-provenance-version-boundary",
    title: "로컬 SecurityConfig의 사실과 현재 Spring Security 계약을 분리해 읽습니다",
    lead: "보안 설정은 짧아 보여도 framework 세대, 등록된 filter, session 정책과 실제 request matcher가 합쳐져야 의미가 생깁니다.",
    mechanism: "로컬 세 SecurityConfig와 JWT request filter를 read-only로 확인하면 SecurityFilterChain bean, stateless session 정책, CSRF·CORS 구성, authorization rule과 사용자 filter 배치가 보입니다. build file은 Spring Boot 4.0.6 plugin 선언을 보여 주지만 dependency resolution 결과를 캡처하지 않았으므로 정확한 Spring Security patch version까지 추론하지 않습니다.",
    workflow: "먼저 file hash·line·byte를 기록하고 annotation, bean return type, filter insertion point와 default rule의 존재만 구조적으로 inventory합니다. 그 뒤 현재 공식 reference와 Javadoc에서 같은 API 계약을 확인하고, 과거 강의의 WebSecurityConfigurerAdapter 또는 Spring Security 5 자동 저장 설명과 섞이지 않게 source snapshot·versioned docs·현재 docs를 별도 열로 유지합니다.",
    invariants: "문서의 모든 local claim은 해시가 고정된 파일에서 관찰되어야 하고, framework semantic claim은 공식 문서에 연결되어야 합니다. 실제 endpoint literal, 허용 origin, credential, 사용자 식별자와 configuration value는 공개 학습 fixture로 복사하지 않습니다.",
    edgeCases: "같은 class 이름이어도 다른 프로젝트·branch·빌드 결과일 수 있고, Boot plugin version과 resolved Security version은 다를 수 있습니다. 주석 처리된 rule, conditional bean, test profile, generated configuration과 transitive dependency override도 별도 확인 대상입니다.",
    failureModes: "설정 한 파일만 보고 ‘session login이 구현됐다’거나 ‘CSRF가 필요 없다’고 결론 내리면 source가 증명하지 않은 기능을 발명하게 됩니다. 반대로 JWT라는 이름만 보고 filter chain, exception translation, CORS와 authorization boundary를 생략하면 실제 request 처리 순서를 잃습니다.",
    verification: "hash manifest, dependency report, application context의 filter-chain debug output과 synthetic MockMvc matrix를 층별로 대조합니다. 공개 문서에는 구조와 결정 근거만 남기고 실제 route·origin·token-shaped canary가 0건인지 별도 검사합니다.",
    operations: "업그레이드마다 resolved dependency lock, filter list·order, matcher inventory와 authorization matrix를 artifact로 남깁니다. drift가 생기면 source hash와 runtime artifact 중 어느 쪽이 바뀌었는지 먼저 분리하고, 이전 immutable artifact로 rollback할 수 있어야 합니다.",
    concepts: [
      concept("source snapshot", "특정 시점 파일의 경로·크기·해시로 고정한 관찰 대상입니다.", ["현재 runtime과 같다는 추가 증거가 필요합니다.", "민감한 실제 값 대신 구조만 인용합니다."]),
      concept("semantic provenance", "설명 하나가 local source 관찰인지 framework 공식 계약인지 추적하는 근거입니다.", ["추론과 관찰을 구분합니다.", "version 범위를 함께 기록합니다."]),
      concept("resolved version", "빌드 도구가 dependency management와 override를 적용한 뒤 실제 선택한 library version입니다.", ["plugin 선언만으로 단정하지 않습니다.", "dependency report로 검증합니다."]),
    ],
    codeExamples: [
      nodeExample("sec01-provenance", "관찰·추론·금지된 복사를 분리하는 provenance gate", "security01-provenance.mjs", "로컬 구조적 관찰과 공식 semantic 근거가 모두 있어야 문서 claim을 승인합니다.", `const claims = [
  { id: "chain-bean", local: true, official: true, secret: false },
  { id: "exact-patch", local: false, official: false, secret: false },
  { id: "route-literal", local: true, official: false, secret: true }
];
for (const claim of claims) {
  const approved = claim.local && claim.official && !claim.secret;
  console.log(claim.id + "=" + (approved ? "APPROVED" : "BLOCKED"));
}
console.log("approved=" + claims.filter((item) => item.local && item.official && !item.secret).length);`, "chain-bean=APPROVED\nexact-patch=BLOCKED\nroute-literal=BLOCKED\napproved=1", ["local-security-current", "local-build-current", "local-security-mp1", "local-security-mp2", "spring-architecture"]),
    ],
    expertNotes: ["Spring Boot plugin 선언은 유용한 세대 힌트지만 dependency report를 대신하지 않습니다.", "로컬 파일은 stateless token 설정의 학습 근거이며 session login 구현의 근거가 아닙니다."],
  }),
  appliedTopic({
    id: "servlet-to-filterchainproxy",
    title: "Servlet container에서 FilterChainProxy까지 request 경계를 추적합니다",
    lead: "SecurityFilterChain은 controller 앞에 놓인 추상 목록이 아니라 servlet filter 호출을 Spring 보안 filter들로 위임하는 실행 경로입니다.",
    mechanism: "container는 등록된 Filter를 호출하고 DelegatingFilterProxy는 Spring bean lifecycle과 servlet filter 등록 사이를 연결합니다. 보통 이름이 springSecurityFilterChain인 FilterChainProxy가 여러 SecurityFilterChain 중 request에 맞는 첫 chain을 고른 뒤 그 chain의 security filters를 순서대로 실행합니다.",
    workflow: "raw request가 firewall normalization을 통과하는지, 어떤 chain matcher가 true인지, 어떤 filters가 호출되고 controller 또는 error response로 어디서 종료되는지를 한 요청 timeline으로 그립니다. authentication, context load, exploit protection, authorization과 exception translation을 같은 시계열에 놓습니다.",
    invariants: "모든 보호 대상 dispatch는 의도한 FilterChainProxy를 지나야 하고 정확히 하나의 chain 선택 결과와 결정 가능한 filter order를 가져야 합니다. filter가 request를 short-circuit하면 뒤 controller가 실행되지 않아야 하며 cleanup은 성공·실패 모두 수행되어야 합니다.",
    edgeCases: "ERROR·ASYNC dispatch, forwarded request, static resource, preflight, 이미 인증된 context, filter가 response를 commit한 경우와 여러 servlet context를 확인합니다. OncePerRequestFilter도 이름만으로 모든 dispatch에서 한 번을 보장한다고 오해하지 않습니다.",
    failureModes: "container registration 누락은 bean이 존재해도 전체 보안 우회를 만들고, FilterChainProxy를 직접 여러 번 등록하면 중복 실행을 만듭니다. custom filter가 chain.doFilter를 호출하지 않거나 두 번 호출하면 요청 소실·중복 side effect가 발생합니다.",
    verification: "container integration test에서 synthetic correlation id를 넣고 proxy 진입, selected chain, filter sequence, controller count와 context cleanup을 기록합니다. pure array model은 선택 개념만 증명하므로 실제 compatible Spring artifact에서 dispatcher별 검증을 반복합니다.",
    operations: "filter-chain topology를 low-cardinality version으로 배포 artifact에 포함하고, bypass·double invocation·committed response를 경보합니다. 실제 header와 principal은 기록하지 않고 chain id, filter class category와 stable reason만 남깁니다.",
    concepts: [
      concept("DelegatingFilterProxy", "servlet container Filter 호출을 Spring-managed Filter bean으로 위임하는 다리입니다.", ["container registration과 bean lifecycle을 연결합니다.", "보안 정책 그 자체는 아닙니다."]),
      concept("FilterChainProxy", "request와 일치하는 SecurityFilterChain을 선택해 security filters를 실행하는 중심 Filter입니다.", ["첫 일치 chain이 중요합니다.", "firewall과 context cleanup 경계도 제공합니다."]),
      concept("short circuit", "filter가 downstream chain을 호출하지 않고 response를 끝내는 제어 흐름입니다.", ["거부에는 정상입니다.", "중복 호출과 구분합니다."]),
    ],
    codeExamples: [
      nodeExample("sec01-chain-selection", "첫 일치 SecurityFilterChain 선택", "security01-chain-selection.mjs", "더 구체적인 chain을 먼저 배치해야 하는 이유를 세 synthetic request로 실행합니다.", `const chains = [
  { id: "ops", match: (r) => r.zone === "ops" },
  { id: "api", match: (r) => r.path.startsWith("/api/") },
  { id: "fallback", match: () => true }
];
for (const request of [
  { name: "admin", zone: "ops", path: "/api/items" },
  { name: "api", zone: "user", path: "/api/items" },
  { name: "web", zone: "user", path: "/home" }
]) {
  console.log(request.name + "=" + chains.find((chain) => chain.match(request)).id);
}`, "admin=ops\napi=api\nweb=fallback", ["spring-architecture", "spring-java-config", "security-filter-chain-api", "filter-chain-proxy-api", "jakarta-filter-api"]),
    ],
    expertNotes: ["SecurityFilterChain 자체는 servlet Filter가 아니며 FilterChainProxy가 선택·실행합니다.", "chain debug log를 운영에서 무제한 켜기보다 synthetic test와 topology artifact를 우선합니다."],
  }),
  appliedTopic({
    id: "multi-chain-first-match",
    title: "여러 SecurityFilterChain의 first-match 규칙을 겹침 없이 설계합니다",
    lead: "여러 chain은 서로 합쳐지는 것이 아니라 우선순위대로 첫 일치 하나가 선택되므로 넓은 matcher 하나가 뒤 chain 전체를 가릴 수 있습니다.",
    mechanism: "각 chain은 chain-level securityMatcher와 내부 request authorization rules를 가집니다. chain matcher가 false면 그 chain의 filters와 rules는 모두 후보에서 빠지고, true인 첫 chain만 실행됩니다. 내부 rule의 anyRequest는 다른 chain으로 넘어가라는 뜻이 아닙니다.",
    workflow: "request space를 host·servlet path·method·media type·network zone 같은 안정된 차원으로 partition하고 각 partition의 owner, order, default policy를 표로 만듭니다. 구체 matcher에서 넓은 fallback 순으로 두고 unclaimed request가 존재하는지 계산합니다.",
    invariants: "모든 지원 request는 정확히 하나의 의도한 chain에 속하고, 보호 대상이 0개 chain에 속하지 않으며, 중복 영역의 winner가 review에서 명시됩니다. 마지막 fallback은 deny 또는 의도한 public policy를 가져야 합니다.",
    edgeCases: "trailing slash, encoded separator, case sensitivity, servlet context path, reverse proxy rewrite, OPTIONS, HEAD, ERROR dispatch와 framework matcher semantic 변경을 포함합니다. method 없는 matcher가 write endpoint까지 넓어지는지도 확인합니다.",
    failureModes: "fallback chain을 @Order(1)에 두면 뒤의 API chain이 영원히 실행되지 않습니다. chain matcher와 authorizeHttpRequests matcher를 같은 것으로 오해하면 ‘어떤 filter가 적용되는가’와 ‘누가 허용되는가’가 섞입니다.",
    verification: "matcher truth table과 pairwise overlap·gap 검사를 pure model로 실행하고, 실제 MockMvc 또는 container test에서 selected chain marker와 최종 status를 대조합니다. negative request가 예상 chain에서 거부되는지 반드시 포함합니다.",
    operations: "route inventory 변경 PR은 chain partition diff를 생성하고 overlap/gap budget을 0으로 유지합니다. 새로운 chain은 canary에서 synthetic matrix를 통과한 뒤 traffic을 받고, 예상 외 winner가 관측되면 즉시 fallback order로 rollback합니다.",
    concepts: [
      concept("chain matcher", "어떤 request에 SecurityFilterChain 전체가 적용되는지 결정하는 matcher입니다.", ["authorization matcher보다 바깥 경계입니다.", "first-match selection에 사용됩니다."]),
      concept("request partition", "지원 request 공간을 겹침·누락 없이 policy owner별로 나눈 집합입니다.", ["overlap winner를 명시합니다.", "fallback을 포함합니다."]),
      concept("shadowing", "앞선 넓은 matcher가 뒤의 더 구체적인 chain을 도달 불가능하게 만드는 현상입니다.", ["order test로 탐지합니다.", "정상 응답만으로 놓치기 쉽습니다."]),
    ],
    expertNotes: ["여러 chain은 defense-in-depth로 누적 적용되지 않습니다.", "chain order 변경은 refactor가 아니라 보안 정책 변경으로 review합니다."],
  }),
  appliedTopic({
    id: "firewall-request-matching",
    title: "HttpFirewall과 RequestMatcher의 canonical request 의미를 고정합니다",
    lead: "같아 보이는 URL 문자열도 container decoding·normalization과 matcher 종류에 따라 다른 resource를 가리킬 수 있습니다.",
    mechanism: "FilterChainProxy는 HttpFirewall을 통해 비정상 request를 거부하거나 matcher가 사용할 path representation을 정리합니다. StrictHttpFirewall의 허용 범위를 느슨하게 바꾸는 것은 단순 호환성 설정이 아니라 path ambiguity, method와 header attack surface를 바꾸는 결정입니다.",
    workflow: "public route contract에서 raw target, proxy rewrite, servlet context, path within application, decoded segment와 controller mapping이 각각 어떤 값을 보는지 문서화합니다. security matcher와 MVC router가 동일한 canonical resource를 판단하는지 encoded·duplicate separator corpus로 비교합니다.",
    invariants: "보안 계층과 handler mapping은 동일 request를 동일 resource와 method로 해석해야 하며 ambiguity는 허용보다 거부로 수렴해야 합니다. firewall exception을 추가하면 필요한 정확한 문법만 허용하고 전역 permissive toggle을 피합니다.",
    edgeCases: "semicolon matrix parameter, encoded slash·backslash·dot segment, duplicate slash, null byte, mixed case method, CRLF header, host ambiguity와 proxy가 decode를 한 번 더 하는 경우를 검사합니다.",
    failureModes: "보안 matcher가 raw path를 허용하고 controller가 decoded path를 민감 resource로 해석하면 authorization bypass가 됩니다. 오류를 해결하려고 firewall을 끄면 한 endpoint 호환성 문제가 전체 application 공격면 확대가 됩니다.",
    verification: "malformed corpus는 firewall 단계에서 stable reject가 되고 handler count 0인지 확인합니다. 허용 corpus는 proxy·container·Spring matcher·handler가 동일 canonical id를 산출하는지 integration test로 검증합니다.",
    operations: "firewall rejection reason은 원문 URL을 저장하지 않고 category와 count로 관측합니다. reverse proxy 또는 container upgrade 전에 canonicalization differential suite를 실행하고 증가한 reject와 route mismatch를 canary 기준에 연결합니다.",
    concepts: [
      concept("canonicalization", "여러 표현을 정책 판단에 사용할 하나의 안정된 resource 표현으로 만드는 과정입니다.", ["decode 횟수와 owner를 명시합니다.", "ambiguity는 거부합니다."]),
      concept("HttpFirewall", "FilterChainProxy 앞에서 위험한 request를 거부하고 matcher용 request를 감싸는 경계입니다.", ["controller validation과 역할이 다릅니다.", "완화는 threat review가 필요합니다."]),
      concept("parser differential", "proxy·container·security matcher·router가 같은 bytes를 다르게 해석하는 차이입니다.", ["authorization bypass 원인이 됩니다.", "실제 stack으로 검증합니다."]),
    ],
    codeExamples: [
      nodeExample("sec01-canonical-path", "모호한 경로 거부 모델", "security01-canonical-path.mjs", "encoded separator와 dot segment를 정상화하려 시도하지 않고 보안 경계에서 거부합니다.", `const targets = ["/docs/start", "/docs/%2fadmin", "/docs/../admin", "/docs//start"];
function inspect(target) {
  if (/%2f|%5c/i.test(target)) return "ENCODED_SEPARATOR";
  if (target.split("/").includes("..")) return "DOT_SEGMENT";
  if (target.includes("//")) return "DUPLICATE_SEPARATOR";
  return "ACCEPT";
}
for (const target of targets) console.log(inspect(target));
console.log("accepted=" + targets.filter((target) => inspect(target) === "ACCEPT").length);`, "ACCEPT\nENCODED_SEPARATOR\nDOT_SEGMENT\nDUPLICATE_SEPARATOR\naccepted=1", ["request-matcher-api", "strict-http-firewall-api", "filter-chain-proxy-api", "owasp-access-control"]),
    ],
    expertNotes: ["예제의 문자열 검사는 실제 StrictHttpFirewall 구현을 복제하지 않습니다.", "proxy와 application 양쪽 normalization을 관찰하지 않으면 한쪽 test만 통과할 수 있습니다."],
  }),
  appliedTopic({
    id: "filter-order-custom-filter",
    title: "기본 filter order와 custom JWT filter의 선행 조건을 증명합니다",
    lead: "addFilterBefore 한 줄은 이름으로만 순서를 정하는 것이 아니라 custom filter가 읽고 쓰는 상태의 선행 조건을 선언합니다.",
    mechanism: "Spring Security filters는 exploit protection, context load, authentication, request cache, authorization과 exception handling이 의존하는 순서를 가집니다. 로컬 JWT filter는 username/password authentication filter를 anchor로 앞에 배치되어 context를 설정하는 구조이지만 그것이 session login을 사용한다는 뜻은 아닙니다.",
    workflow: "custom filter가 필요로 하는 request normalization, context availability, credential extraction, authentication result와 downstream authorization을 dependency graph로 적습니다. anchor 앞·뒤를 선택한 이유와 already-authenticated, invalid credential, no credential 동작을 각각 정의합니다.",
    invariants: "한 request에서 custom authentication attempt는 최대 한 번이고, 실패한 token이 기존 유효 context를 덮어쓰지 않으며, 성공한 context는 authorization 전에 보입니다. raw credential과 PII는 log·exception·metric label에 남지 않습니다.",
    edgeCases: "ASYNC/ERROR dispatch, duplicate filter registration, 여러 chain에서 같은 filter bean 재사용, context가 이미 있는 경우, expired·malformed token, downstream exception과 response committed 상태를 검사합니다.",
    failureModes: "filter를 authorization 뒤에 두면 항상 anonymous로 거부되고, 너무 앞에 두어 firewall·CORS보다 먼저 처리하면 malformed request 또는 preflight를 잘못 인증합니다. filter bean을 container와 Security chain 양쪽에 등록하면 두 번 실행될 수 있습니다.",
    verification: "의존 graph의 topological order를 정적 gate로 검사하고 실제 chain integration에서 invocation count, context transition, error contract와 cleanup을 검증합니다. anchor class의 존재만 아니라 runtime filter list를 readback합니다.",
    operations: "filter topology hash와 custom filter invocation/reason count를 version별로 비교합니다. order drift, duplicate invocation, credential-shaped telemetry가 하나라도 생기면 rollout을 중단하고 이전 chain artifact로 되돌립니다.",
    concepts: [
      concept("filter anchor", "custom filter의 상대 위치를 지정할 때 기준이 되는 알려진 filter class입니다.", ["의존 이유가 필요합니다.", "해당 filter 기능 사용 여부와 동일하지 않습니다."]),
      concept("ordering invariant", "필요한 상태가 생성된 뒤 소비되고 cleanup 전에는 더 이상 사용되지 않는 순서 계약입니다.", ["graph로 표현합니다.", "runtime list로 검증합니다."]),
      concept("idempotent authentication attempt", "중복 dispatch나 등록에도 같은 request의 인증 side effect가 한 번만 적용되는 성질입니다.", ["marker와 dispatcher policy가 필요합니다.", "실패도 count합니다."]),
    ],
    codeExamples: [
      nodeExample("sec01-filter-order", "filter 의존 순서 검증", "security01-filter-order.mjs", "context load→custom authentication→authorization→cleanup 순서를 위반한 topology를 찾습니다.", `const required = [
  ["firewall", "context-load"],
  ["context-load", "jwt-auth"],
  ["jwt-auth", "authorization"],
  ["authorization", "cleanup"]
];
function validate(order) {
  const position = new Map(order.map((name, index) => [name, index]));
  return required.every(([before, after]) => position.get(before) < position.get(after));
}
console.log("good=" + validate(["firewall","context-load","jwt-auth","authorization","cleanup"]));
console.log("bad=" + validate(["jwt-auth","firewall","context-load","authorization","cleanup"]));
console.log("credential-in-log=false");`, "good=true\nbad=false\ncredential-in-log=false", ["local-jwt-current", "local-security-current", "spring-architecture", "filter-chain-proxy-api"]),
    ],
    expertNotes: ["UsernamePasswordAuthenticationFilter 앞에 둔 사실은 form login 활성화의 증거가 아닙니다.", "OncePerRequestFilter의 dispatch 정책은 override와 container behavior까지 확인합니다."],
  }),
  appliedTopic({
    id: "authentication-authorization-boundary",
    title: "authentication과 request authorization을 별도 결정으로 모델링합니다",
    lead: "로그인 성공은 신원에 대한 증거일 뿐 모든 request 허용을 뜻하지 않으며, public route도 입력 검증과 exploit protection을 면제받지 않습니다.",
    mechanism: "authentication은 credential 또는 기존 context를 Authentication으로 바꾸고, authorization은 현재 Authentication과 request resource·method·attributes를 사용해 access decision을 냅니다. permitAll은 authorization decision을 허용할 뿐 filter chain 전체를 건너뛰지 않습니다.",
    workflow: "route·method별 필요한 principal state, authority, ownership과 contextual condition을 표로 작성합니다. public, authenticated, role/capability, owner-only, deny-all을 분리하고 가장 구체적인 rule에서 default deny로 수렴시킵니다.",
    invariants: "보호 resource는 anonymous·불충분 authority·다른 owner에게 거부되고 필요한 authority를 가진 올바른 principal만 허용됩니다. client가 보낸 role·owner id를 신뢰하지 않고 server-side authoritative data와 비교합니다.",
    edgeCases: "GET과 HEAD, collection과 item, bulk action, nested resource, stale authority, disabled account, remember-me·anonymous token, service-to-service principal과 method-level policy 중복을 검사합니다.",
    failureModes: "authenticated()만 사용하면 수평 권한 검사가 사라지고, URL prefix role만 보면 object ownership bypass가 남습니다. 순서가 넓은 permitAll부터 시작하면 뒤의 deny rule은 도달하지 못할 수 있습니다.",
    verification: "actor×resource×method matrix를 negative-first로 실행하고 controller/service side effect count가 거부 시 0인지 확인합니다. request-level과 method-level decision이 다르면 어느 정책이 authoritative한지 명시합니다.",
    operations: "allow/deny reason과 policy version을 low-cardinality로 기록하고 principal·resource raw id는 hash 또는 category로 최소화합니다. 새 route가 inventory에 없거나 default deny에 걸리면 배포 gate에서 owner가 분류해야 합니다.",
    concepts: [
      concept("authentication", "현재 요청 주체와 credential 검증 상태를 표현하는 과정·결과입니다.", ["권한 부여와 다릅니다.", "실패·anonymous 상태를 포함합니다."]),
      concept("authorization", "주체가 특정 resource action을 수행할 수 있는지 정책으로 판단하는 과정입니다.", ["resource·method·context가 필요합니다.", "default deny가 안전합니다."]),
      concept("object-level authorization", "URL 접근보다 구체적으로 대상 record와 actor 관계를 검증하는 정책입니다.", ["IDOR를 방지합니다.", "client owner field를 믿지 않습니다."]),
    ],
    codeExamples: [
      nodeExample("sec01-authorization-matrix", "actor-resource-method 정책 matrix", "security01-authorization.mjs", "anonymous, reader, owner와 admin의 read/write 결과를 deny-by-default로 계산합니다.", `const requests = [
  { actor: "anonymous", role: "NONE", owner: false, method: "GET" },
  { actor: "reader", role: "READER", owner: false, method: "GET" },
  { actor: "writer", role: "READER", owner: true, method: "POST" },
  { actor: "admin", role: "ADMIN", owner: false, method: "DELETE" }
];
function decide(r) {
  if (r.role === "ADMIN") return "ALLOW";
  if (r.method === "GET" && r.role === "READER") return "ALLOW";
  if (r.method === "POST" && r.owner) return "ALLOW";
  return "DENY";
}
for (const request of requests) console.log(request.actor + "=" + decide(request));`, "anonymous=DENY\nreader=ALLOW\nwriter=ALLOW\nadmin=ALLOW", ["spring-authorize-http", "owasp-access-control", "local-security-current"]),
    ],
    expertNotes: ["permitAll은 authentication filter와 CSRF/CORS/firewall을 자동 비활성화하지 않습니다.", "authority 문자열 naming보다 actor-action-resource-context 불변식이 먼저입니다."],
  }),
  appliedTopic({
    id: "deny-by-default-contract",
    title: "route inventory와 deny-by-default를 변경 계약으로 만듭니다",
    lead: "마지막 anyRequest 정책은 편의 설정이 아니라 분류되지 않은 새 endpoint가 공개되는지 차단되는지를 결정하는 안전망입니다.",
    mechanism: "명시적 allow rule은 product requirement로 승인된 request 집합만 열고 나머지는 authenticated 또는 denyAll로 닫습니다. route inventory는 controller mapping뿐 아니라 static, actuator, error, documentation, upload, websocket handshake와 management port를 포함합니다.",
    workflow: "build 단계에서 handler mapping inventory를 생성하고 security rule coverage와 join합니다. 각 route는 owner, data class, methods, required authentication/authorization, CSRF/CORS와 rate limit 정책을 가져야 하며 미분류 route는 실패합니다.",
    invariants: "새 route는 policy metadata 없이는 production artifact가 되지 않고, 삭제 route의 stale allow rule도 제거됩니다. wildcard는 최소 범위이고 method 없는 허용은 의도적으로 검토됩니다.",
    edgeCases: "framework generated endpoints, trailing patterns, content negotiation, alternate method, actuator child endpoints, static path traversal, GraphQL 단일 URL 내부 operation과 websocket message authorization을 검사합니다.",
    failureModes: "anyRequest().permitAll()은 누락을 성공으로 만들고, broad static ignore는 filter chain 자체를 우회해 header와 firewall까지 잃을 수 있습니다. 문서 route만 보고 management port를 빠뜨리면 별도 공격면이 남습니다.",
    verification: "route-policy coverage count, wildcard expansion과 negative request를 CI에서 계산합니다. production-like artifact의 실제 mapping과 source inventory가 일치하는지 startup probe로 확인합니다.",
    operations: "route diff는 보안 reviewer에게 자동 전달하고 unclassified count는 항상 0이어야 합니다. emergency route는 만료 시간·feature flag·owner·telemetry와 rollback을 포함하며 영구 wildcard로 남기지 않습니다.",
    concepts: [
      concept("deny by default", "명시적으로 허용되지 않은 action을 기본 거부하는 정책입니다.", ["새 endpoint 누락을 안전하게 실패시킵니다.", "사용자 경험용 404와 감사용 이유를 분리할 수 있습니다."]),
      concept("route-policy coverage", "실제 노출 route와 보안 정책 metadata가 완전히 대응하는 정도입니다.", ["generated endpoint도 포함합니다.", "stale rule도 탐지합니다."]),
      concept("security ignore", "request를 Spring Security filter chain 밖으로 완전히 제외하는 설정입니다.", ["permitAll보다 영향이 큽니다.", "정적 자원도 최소화합니다."]),
    ],
    expertNotes: ["denyAll fallback은 route 분류 자동화를 대체하지 않고 마지막 안전망입니다.", "management plane은 application plane과 별도 inventory·network policy를 가질 수 있습니다."],
  }),
  appliedTopic({
    id: "csrf-browser-credentials",
    title: "CSRF를 browser가 자동 첨부하는 credential과 unsafe method의 문제로 이해합니다",
    lead: "JWT라는 단어만으로 CSRF가 사라지지 않으며 token이 cookie에 있는지 JavaScript header에 있는지에 따라 browser의 자동 전송 성질이 달라집니다.",
    mechanism: "CSRF는 공격 site가 victim browser를 통해 authenticated state-changing request를 보내는 위협입니다. session cookie, HTTP Basic과 자동 전송 cookie token은 영향을 받으며 synchronizer token, cookie attribute, same-site 정책과 origin 검사가 겹쳐 방어합니다.",
    workflow: "credential transport별로 browser auto-attach, cross-site readability, storage/XSS risk와 refresh path를 표로 만듭니다. safe/unsafe method, form/JSON, same-site/cross-site와 login/logout CSRF까지 구분하고 CSRF 비활성화는 threat model 근거를 요구합니다.",
    invariants: "state change는 사용자 의도와 결합된 예측 불가능한 token 또는 동등한 검증을 요구하고, 공격 origin은 credential만으로 action을 성공시키지 못합니다. GET은 side effect를 만들지 않고 token은 URL·log에 노출되지 않습니다.",
    edgeCases: "SameSite 예외, subdomain trust, legacy browser, CORS preflight 없는 simple request, multipart, login CSRF, token rotation, multiple tabs와 SPA refresh 경쟁을 검사합니다.",
    failureModes: "stateless server라도 browser가 credential을 cookie로 자동 전송하면 CSRF가 가능합니다. 반대로 CSRF token을 localStorage에 저장하며 XSS 위험을 무시하거나, CORS가 CSRF 방어를 자동 제공한다고 오해할 수 있습니다.",
    verification: "victim session을 가진 실제 browser fixture에서 cross-site form·fetch, missing/wrong/stale token과 allowed origin을 실행하고 server side effect가 0인지 확인합니다. pure model은 transport 분류만 증명합니다.",
    operations: "CSRF reject는 token 값을 기록하지 않고 reason·route class·method로 집계합니다. policy 변경은 browser matrix와 canary를 거치고 예상 reject 급증 시 이전 설정으로 rollback하되 보호 자체를 임시 해제하지 않습니다.",
    concepts: [
      concept("CSRF", "사용자 browser가 자동으로 보낼 credential을 악용해 원치 않는 state change를 유도하는 공격입니다.", ["XSS와 다릅니다.", "credential transport를 봐야 합니다."]),
      concept("synchronizer token", "사용자 session과 결합되고 공격 site가 알 수 없는 값을 unsafe request에 요구하는 방어입니다.", ["URL에 넣지 않습니다.", "server 검증이 필요합니다."]),
      concept("SameSite", "cookie의 cross-site 전송 범위를 제한하는 browser 속성입니다.", ["유일한 방어로 과신하지 않습니다.", "scheme/site 의미를 확인합니다."]),
    ],
    codeExamples: [
      nodeExample("sec01-csrf-policy", "credential transport별 CSRF 요구 판단", "security01-csrf.mjs", "cookie 자동 첨부와 unsafe method가 함께 있을 때 token 검증을 요구합니다.", `const cases = [
  { name: "cookie-post", automatic: true, method: "POST", token: false },
  { name: "cookie-get", automatic: true, method: "GET", token: false },
  { name: "header-post", automatic: false, method: "POST", token: false },
  { name: "cookie-post-token", automatic: true, method: "POST", token: true }
];
const safe = new Set(["GET", "HEAD", "OPTIONS"]);
function decide(item) {
  return item.automatic && !safe.has(item.method) && !item.token ? "REJECT" : "ALLOW";
}
for (const item of cases) console.log(item.name + "=" + decide(item));`, "cookie-post=REJECT\ncookie-get=ALLOW\nheader-post=ALLOW\ncookie-post-token=ALLOW", ["spring-csrf", "owasp-csrf", "local-security-current"]),
    ],
    expertNotes: ["CSRF와 XSS는 대체 관계가 아니며 token storage 선택은 두 위협을 함께 봅니다.", "GET side effect가 있으면 CSRF 설정 이전에 HTTP contract부터 수정합니다."],
  }),
  appliedTopic({
    id: "cors-preflight-boundary",
    title: "CORS를 origin 기반 browser read 권한으로 정확히 제한합니다",
    lead: "CORS는 서버 인증·인가가 아니고, 허용 origin·method·header·credential의 조합이 browser에 cross-origin response 읽기 권한을 줍니다.",
    mechanism: "browser는 일부 cross-origin request 전에 credential 없는 preflight OPTIONS를 보내고 server 응답을 평가합니다. Spring Security보다 CORS 처리가 먼저 필요한 이유는 preflight에 session cookie가 없어서 인증 실패로 오인할 수 있기 때문입니다.",
    workflow: "정확한 scheme-host-port origin allow-list, 필요한 methods·request headers·exposed headers와 credentials 여부를 product flow에서 도출합니다. wildcard와 credential 조합을 거부하고 origin reflection은 registry membership 검증 뒤에만 수행합니다.",
    invariants: "미등록 origin은 preflight와 actual response 읽기가 모두 허용되지 않고, 등록 origin도 필요한 최소 method/header만 사용합니다. CORS 허용과 server-side authentication·authorization은 독립적으로 모두 통과해야 합니다.",
    edgeCases: "null origin, file/sandboxed document, subdomain takeover, mixed scheme/port, punycode, trailing dot, preflight cache, redirect, CDN cache의 Vary: Origin과 non-browser client를 검사합니다.",
    failureModes: "Origin 값을 그대로 Access-Control-Allow-Origin으로 반사하면서 credentials를 허용하면 임의 site에 authenticated response가 노출됩니다. OPTIONS를 전역 permit하면서 실제 method policy를 검증하지 않거나 CORS를 network ACL로 오해할 수 있습니다.",
    verification: "허용/거부 origin×method×header×credential matrix를 실제 browser와 server integration에서 실행합니다. response headers뿐 아니라 JavaScript가 읽을 수 있는지, state change와 authorization이 별도로 통제되는지 확인합니다.",
    operations: "origin registry 변경은 소유권·만료·environment를 검토하고 wildcard count를 0으로 유지합니다. preflight reject와 cache hit를 low-cardinality로 관측하며 실제 origin 문자열을 고카디널리티 label로 저장하지 않습니다.",
    concepts: [
      concept("origin", "scheme, host와 port의 tuple로 정의되는 browser 보안 경계입니다.", ["path는 포함하지 않습니다.", "site와 동일하지 않습니다."]),
      concept("preflight", "browser가 실제 cross-origin request 허용 여부를 묻는 OPTIONS request입니다.", ["보통 credential이 없습니다.", "actual authorization을 대체하지 않습니다."]),
      concept("credentialed CORS", "cookie·HTTP authentication 같은 credential을 포함한 cross-origin request를 browser가 허용하도록 하는 정책입니다.", ["정확한 origin이 필요합니다.", "최소 범위를 적용합니다."]),
    ],
    codeExamples: [
      nodeExample("sec01-cors-gate", "CORS tuple와 credential release gate", "security01-cors.mjs", "정확한 origin·method·header만 허용하고 wildcard credential 조합을 차단합니다.", `const policy = {
  origins: new Set(["https://study.example"]),
  methods: new Set(["GET", "POST"]),
  headers: new Set(["content-type"]),
  credentials: true
};
function allow(r) {
  return policy.origins.has(r.origin) &&
    policy.methods.has(r.method) &&
    r.headers.every((header) => policy.headers.has(header));
}
console.log("known=" + allow({ origin: "https://study.example", method: "POST", headers: ["content-type"] }));
console.log("evil=" + allow({ origin: "https://evil.example", method: "POST", headers: ["content-type"] }));
console.log("extra-header=" + allow({ origin: "https://study.example", method: "POST", headers: ["x-debug"] }));
console.log("wildcard-with-credentials=false");`, "known=true\nevil=false\nextra-header=false\nwildcard-with-credentials=false", ["spring-cors", "owasp-cors", "local-security-current"]),
    ],
    expertNotes: ["CORS는 curl·server client를 막지 않으므로 authorization 경계가 아닙니다.", "allowedOrigins 값은 공개 예제의 synthetic domain으로 대체합니다."],
  }),
  appliedTopic({
    id: "exception-translation-contract",
    title: "인증 필요와 권한 부족을 401·403·redirect 계약으로 분리합니다",
    lead: "같은 접근 실패라도 anonymous가 인증을 시작해야 하는지 authenticated principal이 권한 부족인지에 따라 처리와 사용자 행동이 달라집니다.",
    mechanism: "ExceptionTranslationFilter는 보안 exception을 HTTP response로 번역하며 AuthenticationEntryPoint는 인증 시작, AccessDeniedHandler는 권한 부족을 담당합니다. form UI는 safe redirect를 쓸 수 있고 API는 stable problem body와 status를 사용합니다.",
    workflow: "request channel별 anonymous, invalid credential, expired credential, authenticated-but-forbidden과 CSRF failure를 분류합니다. response status, content type, public error code, retry/login action과 no-secret logging을 계약으로 고정합니다.",
    invariants: "401과 403은 client가 취할 다음 행동과 일치하고 이미 committed response를 다시 쓰지 않습니다. 내부 stack, matcher, credential과 principal PII는 public body에 포함되지 않고 redirect target은 allow-listed local path만 사용합니다.",
    edgeCases: "HTML vs JSON content negotiation, AJAX, expired session, request cache, concurrent response, CORS error가 보안 error를 가리는 경우와 reverse proxy가 status를 바꾸는 경우를 검사합니다.",
    failureModes: "모든 실패를 200과 login HTML로 반환하면 API client가 JSON parse error로 오인하고 retry loop를 만듭니다. 모든 거부를 401로 반환하면 이미 인증된 사용자가 credential 재입력을 반복하고 authorization incident가 숨습니다.",
    verification: "상태 matrix별 status/header/body schema, redirect target, side effect 0과 log redaction을 contract test합니다. browser test에서는 화면 메시지와 focus 이동, API test에서는 machine-readable stable code를 확인합니다.",
    operations: "entry-point와 denied reason을 policy version별로 집계하되 raw path·principal을 label로 쓰지 않습니다. 401/403 비율 drift, redirect loop와 response commit exception을 alert하고 이전 error contract로 rollback합니다.",
    concepts: [
      concept("AuthenticationEntryPoint", "인증되지 않은 요청이 보호 resource에 접근할 때 인증을 시작하거나 401을 만드는 전략입니다.", ["channel별 계약이 필요합니다.", "authorization denial과 다릅니다."]),
      concept("AccessDeniedHandler", "인증된 주체의 권한 부족 또는 접근 거부를 403 등으로 번역하는 전략입니다.", ["민감한 이유를 노출하지 않습니다.", "감사와 사용자 메시지를 분리합니다."]),
      concept("problem response", "machine-readable type·status·stable code·correlation을 가진 오류 계약입니다.", ["credential과 내부 stack을 제외합니다.", "versioning합니다."]),
    ],
    expertNotes: ["CSRF failure가 anonymous처럼 보일 수 있으므로 internal reason과 public response를 분리합니다.", "SPA의 login navigation도 open redirect 방지와 원래 request 안전성 검증이 필요합니다."],
  }),
  appliedTopic({
    id: "testing-observability-release",
    title: "filter chain을 negative-first test·관측·rollback 가능한 release artifact로 만듭니다",
    lead: "보안 설정은 application이 뜨고 정상 request가 200이라는 사실이 아니라 우회·오분류·복구가 없음을 반복 증명해야 완성됩니다.",
    mechanism: "검증 pyramid는 pure matcher model, Spring slice/MockMvc, 실제 servlet container, browser CSRF/CORS와 production-like canary로 나뉩니다. topology, route coverage, authorization matrix와 redaction evidence를 하나의 versioned security manifest로 묶습니다.",
    workflow: "anonymous·wrong role·wrong owner·malformed path·missing CSRF·disallowed origin부터 작성하고 마지막에 happy path를 확인합니다. source hash, resolved dependencies, runtime filters와 test artifact를 correlation 가능한 release id로 연결합니다.",
    invariants: "모든 거부 case는 controller/service side effect 0이고 모든 허용 case는 정확히 하나의 intended chain을 지납니다. test fixture는 synthetic identity만 사용하며 log·trace·metric·snapshot에 credential-shaped canary가 없습니다.",
    edgeCases: "parallel tests의 context leakage, cached preflight, async dispatch, test-only bean, profile divergence, proxy header, stale browser cookie와 rollback 후 session/token compatibility를 포함합니다.",
    failureModes: "MockMvc standalone setup은 실제 security filters를 빠뜨릴 수 있고, mocked authentication은 credential parsing·context persistence를 증명하지 않습니다. status만 assertion하면 잘못된 chain이 우연히 같은 status를 반환해도 통과합니다.",
    verification: "selected chain marker, ordered filter categories, decision reason, status/body, side-effect count와 cleanup을 함께 assertion합니다. 공식 URL live check, sourceRefs completeness와 local hash 재검증도 content release gate에 포함합니다.",
    operations: "canary는 synthetic negative probes를 지속 실행하고 reject-rate·latency·topology drift를 baseline과 비교합니다. rollback trigger, immutable 이전 artifact, session/token compatibility와 post-rollback reconciliation을 사전에 rehearsal합니다.",
    concepts: [
      concept("negative-first testing", "허용되어서는 안 되는 요청과 실패 후 side effect 부재를 먼저 고정하는 검증 방식입니다.", ["status만 보지 않습니다.", "우회 경로를 포함합니다."]),
      concept("security manifest", "route, chain, matcher, filter order, dependency와 검증 evidence를 release별로 묶은 artifact입니다.", ["민감한 값을 제외합니다.", "diff와 rollback에 사용합니다."]),
      concept("rollback qualification", "이전 artifact로 돌아갈 때 policy·session·token·cache가 안전하게 호환되는지 미리 검증하는 과정입니다.", ["복구 시간을 측정합니다.", "reconciliation을 포함합니다."]),
    ],
    codeExamples: [
      nodeExample("sec01-release-gate", "보안 release evidence gate", "security01-release-gate.mjs", "route coverage, negative tests, topology와 secret-zero 증거가 모두 있어야 배포를 승인합니다.", `const evidence = {
  routeCoverage: 1,
  overlap: 0,
  negativeCases: 18,
  failedNegativeCases: 0,
  topologyKnown: true,
  secretCanaryHits: 0
};
const approved = evidence.routeCoverage === 1 &&
  evidence.overlap === 0 &&
  evidence.negativeCases >= 10 &&
  evidence.failedNegativeCases === 0 &&
  evidence.topologyKnown &&
  evidence.secretCanaryHits === 0;
console.log("release=" + (approved ? "APPROVED" : "BLOCKED"));
console.log("negative-cases=" + evidence.negativeCases);
console.log("secret-canary-hits=" + evidence.secretCanaryHits);`, "release=APPROVED\nnegative-cases=18\nsecret-canary-hits=0", ["spring-architecture", "spring-authorize-http", "owasp-access-control", "owasp-csrf", "owasp-cors"]),
    ],
    expertNotes: ["filter class 전체 이름을 metric label로 쓰기보다 manifest artifact에 보관합니다.", "공식 URL live 여부와 source fingerprint drift도 교육 자료 신뢰성의 일부입니다."],
  }),
];

const sources: SessionSource[] = [
  { id: "local-security-current", repository: "2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/config/SecurityConfig.java", usedFor: ["SecurityFilterChain, stateless request boundary and custom filter placement snapshot"], evidence: "read-only: 106 lines, 6013 bytes, SHA-256 b1051723c4fee8fcbec587b0a1cfcfa7a9eb0c461ebe59602da980ef1d62ccd8; endpoint/origin literals were not copied." },
  { id: "local-jwt-current", repository: "2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtRequestFilter.java", usedFor: ["request authentication filter and SecurityContext write snapshot"], evidence: "read-only: 94 lines, 4208 bytes, SHA-256 ea08d71d7a21293e92451b7867142ab1582b403664c4a26c3d47213fe9e432b2; token and identity values were not copied." },
  { id: "local-build-current", repository: "2026-myproject04-cicd", path: "build.gradle", usedFor: ["Spring Boot plugin 4.0.6 and security starter declaration snapshot"], evidence: "read-only: 56 lines, 2047 bytes, SHA-256 cbf6cb4a2bde7b7c072c924f3c03e009ef7eee737314b1f4edb82fb77eb5c0a5; resolved Security patch version was not inferred." },
  { id: "local-security-mp1", repository: "springboot/MyProject01", path: "src/main/java/com/study/myproject01/config/SecurityConfig.java", usedFor: ["earlier stateless SecurityFilterChain comparison"], evidence: "read-only: 95 lines, 5358 bytes, SHA-256 eb9f60c8463b53f8c26a581cbb9deebc42d78835eb82a56e23212c4d91817f65." },
  { id: "local-security-mp2", repository: "springboot/MyProject02", path: "src/main/java/com/study/myproject02/config/SecurityConfig.java", usedFor: ["second stateless SecurityFilterChain comparison"], evidence: "read-only: 99 lines, 5708 bytes, SHA-256 879f2f96673fb007eb84370f5a21d46496735e329c8871010e377e5b548c4081." },
  { id: "spring-architecture", repository: "Spring Security Reference", path: "Servlet Architecture", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/architecture.html", usedFor: ["DelegatingFilterProxy, FilterChainProxy, first-match chain and filter ordering"], evidence: "Spring Security current official reference." },
  { id: "spring-java-config", repository: "Spring Security Reference", path: "Java Configuration", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/configuration/java.html", usedFor: ["multiple SecurityFilterChain and securityMatcher configuration"], evidence: "Spring Security current official reference." },
  { id: "security-filter-chain-api", repository: "Spring Security Javadoc", path: "SecurityFilterChain", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/SecurityFilterChain.html", usedFor: ["matches and getFilters API contract"], evidence: "Spring Security current official Javadoc." },
  { id: "filter-chain-proxy-api", repository: "Spring Security Javadoc", path: "FilterChainProxy", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/FilterChainProxy.html", usedFor: ["chain selection, firewall and filter execution API contract"], evidence: "Spring Security current official Javadoc." },
  { id: "request-matcher-api", repository: "Spring Security Javadoc", path: "RequestMatcher", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/util/matcher/RequestMatcher.html", usedFor: ["request matching contract"], evidence: "Spring Security current official Javadoc." },
  { id: "strict-http-firewall-api", repository: "Spring Security Javadoc", path: "StrictHttpFirewall", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/firewall/StrictHttpFirewall.html", usedFor: ["malformed and ambiguous request rejection"], evidence: "Spring Security current official Javadoc." },
  { id: "spring-authorize-http", repository: "Spring Security Reference", path: "Authorize HTTP Requests", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html", usedFor: ["request authorization rules and deny-by-default"], evidence: "Spring Security current official reference." },
  { id: "spring-csrf", repository: "Spring Security Reference", path: "CSRF", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html", usedFor: ["CSRF threat and servlet protection"], evidence: "Spring Security current official reference." },
  { id: "spring-cors", repository: "Spring Security Reference", path: "CORS", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html", usedFor: ["preflight ordering and CORS integration"], evidence: "Spring Security current official reference." },
  { id: "jakarta-filter-api", repository: "Jakarta Servlet 6.1 API", path: "Filter", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/filter", usedFor: ["container Filter and FilterChain contract"], evidence: "Jakarta EE official API." },
  { id: "owasp-access-control", repository: "OWASP Cheat Sheet Series", path: "Authorization Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", usedFor: ["least privilege, deny by default and authorization tests"], evidence: "OWASP primary defensive guidance." },
  { id: "owasp-csrf", repository: "OWASP Cheat Sheet Series", path: "Cross-Site Request Forgery Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", usedFor: ["browser credential and CSRF defenses"], evidence: "OWASP primary defensive guidance." },
  { id: "owasp-cors", repository: "OWASP Web Security Testing Guide", path: "Testing Cross Origin Resource Sharing", publicUrl: "https://owasp.org/www-project-web-security-testing-guide/stable/4-Web_Application_Security_Testing/11-Client-side_Testing/07-Testing_Cross_Origin_Resource_Sharing", usedFor: ["CORS origin and credential negative testing"], evidence: "OWASP primary testing guidance." },
];

const session = createExpertSession({
    inventoryId: "sec-01-security-filter-chain",
  slug: "security-01-filter-chain-request-boundary",
  courseId: "devops",
  moduleId: "security-filter-authentication",
  order: 1,
  title: "SecurityFilterChain과 request 보안 경계",
  subtitle: "Servlet request가 FilterChainProxy의 first-match chain, firewall, custom authentication, authorization, CSRF·CORS와 예외 번역을 통과하는 전 과정을 local provenance와 현재 공식 계약으로 증명합니다.",
  level: "전문가",
  estimatedMinutes: 1080,
  coreQuestion: "한 request가 정확히 의도한 SecurityFilterChain을 지나 최소 권한으로 허용 또는 거부되고, framework version·route·proxy가 바뀌어도 우회·중복·정보 노출 없이 이를 어떻게 반복 증명할까요?",
  summary: "세 로컬 SecurityConfig와 JWT request filter를 read-only로 감사해 stateless token-oriented snapshot을 보존하되 실제 endpoint·origin·identity 값은 복사하지 않았습니다. Servlet container→DelegatingFilterProxy→FilterChainProxy, first-match multi-chain partition, HttpFirewall canonicalization, custom filter order, authentication/authorization 분리, deny-by-default route coverage, CSRF credential model, CORS preflight, 401/403 exception translation과 negative-first release 운영까지 현재 Spring Security 공식 문서와 OWASP 지침으로 확장합니다.",
  objectives: ["로컬 관찰과 현재 framework 계약, resolved version을 구분한다.", "Servlet Filter에서 FilterChainProxy까지 실행 경로를 설명한다.", "여러 chain의 first-match overlap과 gap을 검증한다.", "firewall과 matcher의 canonical resource 의미를 맞춘다.", "custom authentication filter의 order와 중복 방지를 증명한다.", "authentication과 request/object authorization을 분리한다.", "route inventory와 deny-by-default를 자동화한다.", "credential transport에 맞는 CSRF 정책을 설계한다.", "CORS preflight와 credential tuple을 최소화한다.", "401·403·redirect 오류 계약을 분리한다.", "negative-first evidence와 rollback으로 release를 승인한다."],
  prerequisites: [{ title: "React 운영 통합", reason: "browser credential, CORS·CSRF와 frontend error behavior가 production boundary에서 만납니다.", sessionSlug: "react-45-production-capstone" }],
  keywords: ["SecurityFilterChain", "FilterChainProxy", "DelegatingFilterProxy", "RequestMatcher", "HttpFirewall", "filter order", "deny by default", "authorization", "CSRF", "CORS", "AuthenticationEntryPoint", "AccessDeniedHandler", "provenance"],
  topics,
  lab: {
    title: "Synthetic 서비스의 request security boundary를 설계하고 우회 corpus로 검증하기",
    scenario: "web UI와 JSON API가 같은 servlet application에 있고 stateless token filter, public read route, owner-only write route와 credentialed browser flow를 안전하게 분리해야 합니다.",
    setup: ["실제 endpoint·origin·credential 대신 synthetic route와 identity를 사용합니다.", "지원 Spring Security version의 disposable project와 실제 servlet container를 준비합니다.", "route·method·actor·chain·CSRF·CORS matrix와 malformed request corpus를 작성합니다.", "local source hash와 resolved dependency report를 read-only artifact로 보관합니다."],
    steps: ["container→FilterChainProxy request timeline을 그립니다.", "chain matchers를 구체적 순서로 partition하고 overlap/gap을 계산합니다.", "firewall과 handler의 canonical path corpus를 대조합니다.", "custom authentication filter의 dependency order와 한 번 실행을 검증합니다.", "route×method×actor×owner authorization matrix를 negative-first로 실행합니다.", "unclassified route와 stale allow rule을 실패시킵니다.", "cookie/header credential별 CSRF browser test를 실행합니다.", "origin×method×header×credentials CORS matrix를 browser에서 실행합니다.", "401/403/problem/redirect contract와 secret-zero telemetry를 검증합니다.", "security manifest, canary와 rollback rehearsal evidence를 승인합니다."],
    expectedResult: ["모든 request가 정확히 하나의 의도한 chain에 속합니다.", "malformed path와 unauthorized action은 controller side effect 0으로 거부됩니다.", "CSRF와 CORS 정책이 credential/browser threat model과 일치합니다.", "401·403과 user recovery action이 일치합니다.", "실제 route·origin·credential·PII가 artifact나 telemetry에 노출되지 않습니다."],
    cleanup: ["disposable application과 synthetic identities를 run id로 제거합니다.", "browser cookie·preflight cache와 request cache를 비웁니다.", "temporary debug logging과 test-only filter를 제거합니다.", "local source와 provenance manifest는 변경하지 않습니다."],
    extensions: ["method security와 request policy의 differential test를 추가합니다.", "reverse proxy·multiple servlet·management port topology를 확장합니다.", "property-based malformed path와 matcher overlap generator를 구축합니다.", "OpenTelemetry span에 low-cardinality decision evidence를 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Node 예제를 실행하고 request가 선택·정규화·인증·인가·CSRF·CORS gate를 지나는 순서를 설명하세요.", requirements: ["stdout을 완전히 대조합니다.", "first-match와 rule match를 구분합니다.", "malformed path 거부 이유를 설명합니다.", "filter anchor의 선행 조건을 적습니다.", "authorization matrix 반례를 추가합니다.", "CSRF와 CORS가 해결하는 위협을 구분합니다."], hints: ["200 response보다 어느 chain과 어떤 decision이 만들었는지를 먼저 추적하세요."], expectedOutcome: "request boundary를 결정 가능한 상태 전이로 설명합니다.", solutionOutline: ["provenance→select→canonicalize→authenticate→authorize→protect→translate 순서입니다."] },
    { difficulty: "응용", prompt: "작은 Spring application에 web/API 두 chain과 owner-only write 정책을 구현하고 negative corpus를 통과시키세요.", requirements: ["resolved version을 기록합니다.", "chain overlap/gap 0을 증명합니다.", "custom filter 중복 실행을 막습니다.", "deny-by-default를 둡니다.", "CSRF/CORS browser test를 실행합니다.", "401/403 contract를 고정합니다.", "secret-zero telemetry를 확인합니다.", "rollback을 rehearsal합니다."], hints: ["chain-level matcher와 내부 authorization matcher를 다른 열로 관리하세요."], expectedOutcome: "변경·실패·복구까지 검증된 request security manifest가 생성됩니다.", solutionOutline: ["inventory→partition→implement→negative test→canary→rollback 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Servlet request security boundary 표준을 작성하세요.", requirements: ["provenance/version 규칙을 둡니다.", "filter registration·order 규칙을 둡니다.", "matcher canonicalization corpus를 둡니다.", "route-policy coverage와 default deny를 요구합니다.", "CSRF credential matrix를 요구합니다.", "CORS registry governance를 둡니다.", "error/redaction contract를 둡니다.", "manifest·observability·rollback gate를 포함합니다."], hints: ["정상 로그인보다 미분류 route와 parser differential을 먼저 실패시키세요."], expectedOutcome: "프로젝트마다 재사용 가능한 request-boundary governance가 완성됩니다.", solutionOutline: ["evidence→policy→enforcement→verification→operation 순서입니다."] },
  ],
  nextSessions: ["security-02-userdetails-password-encoder"],
  sources,
  sourceCoverage: {
    filesRead: 5,
    filesUsed: 5,
    uncoveredNotes: ["세 SecurityConfig는 stateless token-oriented request filter 설정을 보여 주며 session form login 구현을 증명하지 않습니다.", "build.gradle의 Boot plugin 선언으로 정확한 resolved Spring Security patch version을 추론하지 않았습니다.", "실제 endpoint matcher, origin, token, username과 configuration 값은 공개 자료에 복사하지 않았습니다.", "synthetic Node 모델은 실제 Servlet container, Spring matcher, firewall, browser CORS·CSRF 동작을 대체하지 않으므로 lab integration evidence가 필수입니다."],
  },
});

export default session;
