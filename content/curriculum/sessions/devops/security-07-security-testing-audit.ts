import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "control-evidence-inventory", title: "security requirement를 test·evidence·owner와 연결한 control inventory로 만듭니다",
    lead: "취약점 scanner 통과를 보안 완성으로 보지 않고 authentication, authorization, session, browser, error와 logging control마다 무엇을 어떻게 증명할지 versioned manifest로 관리합니다.",
    mechanism: "ASVS 같은 verification requirement는 목표를 제공하고 source/runtime test는 현재 구현의 evidence를 제공합니다. requirement ID, threat, control owner, enforcement layer, positive/negative test, artifact와 expiry를 연결해야 audit 가능한 claim이 됩니다.",
    workflow: "asset/data/action inventory→threat/abuse case→control objective→enforcement point→test method→expected evidence→owner/expiry→exception/compensation 순으로 control matrix를 작성합니다.",
    invariants: "'secure' 같은 포괄 claim 대신 범위·revision·환경·제한을 명시하고 evidence 없는 control과 만료된 evidence는 pass로 집계하지 않습니다.",
    edgeCases: "third-party identity provider, inherited proxy/WAF control, manual evidence, disabled feature, emergency exception, old client와 shared platform을 포함합니다.",
    failureModes: "checklist에 체크만 하고 test artifact와 source revision을 연결하지 않으면 설정이 바뀌어도 audit status가 계속 green으로 남습니다.",
    verification: "control IDs의 uniqueness, reachable surface coverage, evidence hash/revision/age, owner와 exception expiry를 schema와 CI에서 검증합니다.",
    operations: "control pass/fail/unknown, evidence age, orphan control, exception expiry와 owner response time을 security posture dashboard에 연결합니다.",
    concepts: [c("security control", "특정 threat를 예방·탐지·대응하기 위해 구현한 기술 또는 절차입니다.", ["목표와 enforcement point를 명시합니다.", "evidence가 필요합니다."]), c("verification requirement", "control이 만족해야 할 관찰 가능하고 testable한 요구사항입니다.", ["ASVS 등과 mapping할 수 있습니다.", "version을 기록합니다."]), c("evidence provenance", "test 결과가 어느 source, artifact, config와 환경에서 생성됐는지 추적하는 정보입니다.", ["hash와 time을 둡니다.", "재현 가능해야 합니다."])],
    codeExamples: [node("security07-control-map", "security control-evidence coverage map", "Security07ControlMap.mjs", "control마다 자동화된 최신 evidence가 있는지 release coverage를 계산합니다.", String.raw`const controls = [
  { id: "AUTHN-1", test: true, artifact: true, ageDays: 1 },
  { id: "AUTHZ-2", test: true, artifact: true, ageDays: 3 },
  { id: "CSRF-1", test: true, artifact: false, ageDays: 0 },
  { id: "LOG-3", test: false, artifact: false, ageDays: 40 },
];
for (const x of controls) console.log(x.id + "|verified=" + (x.test && x.artifact && x.ageDays <= 30));
console.log("coverage=" + controls.filter(x => x.test && x.artifact && x.ageDays <= 30).length + "/" + controls.length);`, "AUTHN-1|verified=true\nAUTHZ-2|verified=true\nCSRF-1|verified=false\nLOG-3|verified=false\ncoverage=2/4", ["owasp-asvs", "nist-ssdf", "local-build"])],
  }),
  appliedTopic({
    id: "source-config-audit", title: "source·dependency·runtime config를 서로 다른 evidence로 감사합니다",
    lead: "SecurityConfig와 JWT filter source만 읽고 실제 FilterChainProxy, environment values, reverse proxy와 dependency revision이 같다고 추정하지 않습니다.",
    mechanism: "source audit은 의도와 risky sinks를 찾고 build manifest는 version/provenance, context test는 bean/filter wiring, runtime probe는 effective headers/routes/policies를 증명합니다. 각 층이 다른 질문에 답합니다.",
    workflow: "read-only hashes→dependency graph/SBOM→application context bean/filter dump→sanitized effective config→raw HTTP/browser probe→artifact/source correspondence를 연결합니다.",
    invariants: "actual secret/config value는 evidence에 복사하지 않고 source와 deployed artifact hash가 연결되며 test profile의 security bypass가 production artifact에 포함되지 않습니다.",
    edgeCases: "transitive upgrade, dependency management, environment override, multiple chains, conditional beans, proxy header rewrite, native/AOT와 old instance를 포함합니다.",
    failureModes: "source line만 검토하면 runtime override와 chain ordering을 놓치고 scanner 결과만 보면 업무 authorization과 credential flow를 증명하지 못합니다.",
    verification: "dependency resolution, SBOM, bean/filter snapshot, active profiles, endpoint/header canary와 artifact attestation을 재현 가능한 command로 수집합니다.",
    operations: "source/artifact/config revision skew, unapproved dependency, test bypass bean, filter drift와 evidence collection failure를 경보합니다.",
    concepts: [c("effective configuration", "source defaults와 environment/profile/runtime customizer가 합쳐져 실제 적용되는 설정입니다.", ["값은 redaction합니다.", "runtime에서 확인합니다."]), c("SBOM", "artifact에 포함된 software components와 versions를 기계 판독 형태로 나타낸 목록입니다.", ["dependency provenance에 씁니다.", "취약점 없음 보장과 다릅니다."]), c("artifact correspondence", "검증한 source/config가 실제 배포 artifact와 동일한 build provenance로 연결되는 성질입니다.", ["digest와 attestation을 씁니다.", "rolling revisions를 구분합니다."])],
    codeExamples: [node("security07-evidence-layers", "source-to-runtime evidence-layer gate", "Security07EvidenceLayers.mjs", "각 보안 claim이 source, build, context와 runtime evidence를 모두 갖는지 검사합니다.", String.raw`const claims = {
  filterOrder: ["source", "context", "runtime"],
  dependencyVersion: ["build", "sbom"],
  corsHeaders: ["source", "runtime", "browser"],
};
const required = { filterOrder: ["source", "context", "runtime"], dependencyVersion: ["build", "sbom"], corsHeaders: ["source", "runtime", "browser"] };
for (const key of Object.keys(claims)) console.log(key + "=" + required[key].every(x => claims[key].includes(x)));
console.log("secret-values-captured=false");`, "filterOrder=true\ndependencyVersion=true\ncorsHeaders=true\nsecret-values-captured=false", ["local-security-config", "local-jwt-filter", "local-build", "nist-ssdf"] )],
  }),
  appliedTopic({
    id: "authentication-test-layers", title: "credential parser부터 provider·context·session lifecycle까지 authentication을 층별 test합니다",
    lead: "@WithMockUser만 사용해 실제 password encoder, filter parser, provider와 session fixation/rotation을 우회하지 않고 각 test double이 증명하는 범위를 명시합니다.",
    mechanism: "pure parser/validator test, AuthenticationProvider integration, filter/entry-point MockMvc, full login/session browser test와 credential-store fault test가 서로 다른 contract를 검증합니다.",
    workflow: "missing/malformed/wrong/expired/revoked/locked/disabled/concurrent credential corpus와 success principal/authorities/context lifecycle을 matrix로 만듭니다.",
    invariants: "실제 production credential을 쓰지 않고 실패 뒤 context/chain/side effect가 없으며 성공 principal은 최소 authorities와 credential erasure contract를 가집니다.",
    edgeCases: "Unicode IDs, timing variance, encoder upgrade, parallel login, session fixation, remember-me, logout, provider outage와 key rotation을 포함합니다.",
    failureModes: "mock principal만 주입하면 real filter/provider와 credential parsing bug가 사라지고, controller 200만 확인하면 session/context lifecycle을 놓칩니다.",
    verification: "pure/provider/filter/MockMvc/browser/storage fault tests와 timing distribution, context clear, session/token rotation, log redaction을 실행합니다.",
    operations: "failure reason distribution, auth latency, lockout false positive, context leak와 credential artifact finding을 release evidence로 수집합니다.",
    concepts: [c("test double boundary", "mock/stub/fake가 실제 component 대신 제공하는 보장과 제공하지 못하는 범위입니다.", ["문서화합니다.", "실제 integration으로 보완합니다."]), c("credential corpus", "정상·경계·공격·lifecycle 상태를 대표하는 synthetic credential test inputs입니다.", ["실제 비밀을 쓰지 않습니다.", "versioned합니다."]), c("context lifecycle test", "SecurityContext가 요청·thread·login/logout 경계에서 생성·전파·정리되는지 검증하는 test입니다.", ["thread leak을 포함합니다.", "filter chain과 연결합니다."])],
  }),
  appliedTopic({
    id: "authorization-negative-testing", title: "endpoint·method·resource·tenant 인가의 negative matrix와 side-effect zero를 증명합니다",
    lead: "허용 사례보다 anonymous, wrong permission, other owner, cross-tenant, stale authority와 batch mixed resources 같은 거부 사례를 더 넓게 자동화합니다.",
    mechanism: "MockMvc는 request matcher/status, method test는 proxy interceptor, repository integration은 owner/tenant/version predicates와 affected rows, E2E는 client가 deny 뒤 state를 안전하게 유지하는지 검증합니다.",
    workflow: "runtime route/use-case inventory와 actor×resource relation×action×state를 결합해 최소 allow set을 선언하고 나머지를 default deny로 생성합니다.",
    invariants: "deny는 DB/message/cache/external side effect가 0이고 resource 존재/owner를 불필요하게 노출하지 않으며 test security context가 실제 authorities를 명시합니다.",
    edgeCases: "ERROR/ASYNC dispatch, self-invocation, ownership race, batch partial authorization, soft-deleted object, delegated access와 break-glass expiry를 포함합니다.",
    failureModes: "hasRole test만 통과하면 object ID tamper와 cross-tenant BOLA가 남고 status만 확인하면 mutation-after-deny를 놓칩니다.",
    verification: "request/method/object property tests, DB snapshots/affected rows, event/cache counts, response equivalence와 policy event redaction을 실행합니다.",
    operations: "route/policy/test coverage, unexpected allow, mutation-after-deny, cross-tenant attempts와 flaky race를 gate에 연결합니다.",
    concepts: [c("negative authorization test", "허용되지 않아야 할 actor-resource-action 조합이 실제로 거부되는지 확인하는 test입니다.", ["최소 allow set을 기준으로 합니다.", "side effect를 함께 봅니다."]), c("BOLA", "API object 식별자를 조작해 권한 없는 resource에 접근하는 broken object-level authorization입니다.", ["ID randomness으로 해결되지 않습니다.", "관계 policy가 필요합니다."]), c("mutation-after-deny", "접근 거부 response에도 일부 DB/cache/message 변경이 발생한 심각한 불변식 위반입니다.", ["transaction과 event를 검사합니다.", "release blocker입니다."])],
    codeExamples: [node("security07-authz-matrix", "authorization negative matrix coverage", "Security07AuthzMatrix.mjs", "actor/resource/action 조합의 allow·deny와 side-effect evidence를 집계합니다.", String.raw`const cases = [
  { actor: "owner", relation: "own", action: "read", allow: true, effects: 0 },
  { actor: "other", relation: "other", action: "read", allow: false, effects: 0 },
  { actor: "owner", relation: "own", action: "update", allow: true, effects: 1 },
  { actor: "cross-tenant", relation: "other", action: "update", allow: false, effects: 0 },
];
for (const x of cases) console.log(x.actor + "|" + x.action + "|" + (x.allow ? "allow" : "deny") + "|effects=" + x.effects);
console.log("deny-side-effects=" + cases.filter(x => !x.allow).reduce((n,x) => n + x.effects, 0));`, "owner|read|allow|effects=0\nother|read|deny|effects=0\nowner|update|allow|effects=1\ncross-tenant|update|deny|effects=0\ndeny-side-effects=0", ["spring-method-security", "spring-mockmvc", "owasp-asvs", "owasp-wstg"] )],
  }),
  appliedTopic({
    id: "browser-security-tests", title: "CSRF·CORS·security headers를 실제 browser와 server state readback으로 test합니다",
    lead: "MockMvc의 header presence만으로 cookie automatic attachment, preflight cache, response exposure와 CSP enforcement를 증명하지 않고 서로 다른 HTTPS origins에서 실행합니다.",
    mechanism: "Spring integration은 CSRF valid/invalid token과 filters를, raw HTTP는 preflight/header wire를, browser E2E는 site/cookie/fetch/navigation/CSP와 state side effect를 증명합니다.",
    workflow: "trusted/untrusted/same-site sibling origins×safe/unsafe methods×simple/preflighted requests×credential/token states×response types를 pairwise matrix로 만듭니다.",
    invariants: "cross-site deny 뒤 server state가 unchanged이고 browser console만이 아니라 raw request/response와 trusted readback을 보존하며 real credential/domain을 쓰지 않습니다.",
    edgeCases: "logout/login CSRF, refresh cookie, multipart, bfcache, service worker, old browser, reverse proxy/CDN와 CSP report-only를 포함합니다.",
    failureModes: "server 403만 보면 browser가 요청을 실제 보냈는지와 response를 차단했는지, headers가 proxy에서 변형됐는지 구분할 수 없습니다.",
    verification: "Spring csrf() valid/invalid, raw OPTIONS, browser storage/network, CSP report, proxy/header snapshots와 state readback을 correlation합니다.",
    operations: "origin/token/preflight/header matrix coverage, unexpected allow, mutation-after-deny와 policy revision drift를 수집합니다.",
    concepts: [c("browser security integration test", "실제 browser origin/site/cookie/CORS/CSP enforcement를 포함하는 end-to-end test입니다.", ["MockMvc를 보완합니다.", "별도 HTTPS origins가 필요합니다."]), c("CSRF test token", "synthetic session과 연결된 valid/invalid CSRF token으로 unsafe request의 protection을 검증하는 fixture입니다.", ["production token이 아닙니다.", "rotation도 검증합니다."]), c("trusted readback", "공격 request 뒤 server state가 바뀌지 않았음을 격리된 권한 channel로 확인하는 절차입니다.", ["response만 믿지 않습니다.", "correlation을 사용합니다."])],
    codeExamples: [node("security07-browser-matrix", "browser security matrix gate", "Security07BrowserMatrix.mjs", "origin·request·token 조합의 예상 allow와 mutation을 검증합니다.", String.raw`const tests = [
  ["trusted", "unsafe", "valid", true, 1],
  ["trusted", "unsafe", "missing", false, 0],
  ["untrusted", "simple", "automatic-cookie", false, 0],
  ["untrusted", "preflight", "bearer", false, 0],
];
for (const x of tests) console.log(x[0] + "|" + x[1] + "|" + x[2] + "|allow=" + x[3] + "|mutations=" + x[4]);
console.log("denied-mutations=" + tests.filter(x => !x[3]).reduce((n,x) => n + x[4], 0));`, "trusted|unsafe|valid|allow=true|mutations=1\ntrusted|unsafe|missing|allow=false|mutations=0\nuntrusted|simple|automatic-cookie|allow=false|mutations=0\nuntrusted|preflight|bearer|allow=false|mutations=0\ndenied-mutations=0", ["spring-csrf-test", "spring-result-matchers", "owasp-wstg", "owasp-asvs"])],
  }),
  appliedTopic({
    id: "security-error-audit-tests", title: "401/403 problem contract와 credential-safe logging을 audit test로 고정합니다",
    lead: "missing/invalid/expired/denied failure마다 status, challenge, media/schema, handler, context, chain, side effect, client recovery와 sensitive sinks를 함께 검사합니다.",
    mechanism: "contract test는 RFC problem schema, filter unit은 one-response, MockMvc는 entry point/denied handler, client test는 refresh-once/no-loop, canary scan은 proxy/APM/log/trace/artifact redaction을 증명합니다.",
    workflow: "failure catalog를 public code/internal reason으로 나누고 synthetic credential canary를 모든 sinks로 보내 expected zero findings와 incident response를 연습합니다.",
    invariants: "token/password/Authorization/PII가 body/log/trace/artifact에 없고 401/403 의미가 client action과 일치하며 deny 뒤 mutation이 없습니다.",
    edgeCases: "handler IOException, committed response, downstream 500, proxy HTML error, localization, unknown problem type, concurrent refresh와 debug profile을 포함합니다.",
    failureModes: "body snapshot만 검사하면 headers/status/context/log와 retry loop를 놓치고 masking 몇 글자를 남기면 credential oracle이 될 수 있습니다.",
    verification: "failure matrix, JSON schema, raw headers, one-response counts, sink canary scans, client retry cap와 rotation/revoke/purge drill을 실행합니다.",
    operations: "wrong status/schema, double commit, retry loops, sensitive findings와 incident readback completion을 release blocker로 관리합니다.",
    concepts: [c("security contract test", "security failure의 HTTP/status/header/problem/client recovery 의미를 provider와 consumer가 함께 검증하는 test입니다.", ["message 문자열에 의존하지 않습니다.", "version을 고정합니다."]), c("sink scan", "log, trace, error, artifact 등 데이터 저장/전송 지점에서 sensitive canary를 탐지하는 검증입니다.", ["source grep만으로 부족합니다.", "runtime을 포함합니다."]), c("incident drill", "credential 노출을 가정해 revoke/rotate/contain/purge/readback을 실제로 연습하는 절차입니다.", ["코드 수정과 별개입니다.", "RTO를 측정합니다."])],
  }),
  appliedTopic({
    id: "dependency-secret-static-analysis", title: "SAST·dependency·secret scanning을 high-signal triage와 provenance에 연결합니다",
    lead: "scanner 수를 늘리는 대신 어떤 source/build/dependency/secret class를 찾고 false positive·accepted risk·fix verification을 어떻게 처리할지 정의합니다.",
    mechanism: "SAST는 data/control patterns, SCA는 component/advisory reachability, secret scan은 credential-like material, build provenance는 artifact origin을 다룹니다. 어떤 것도 runtime business authorization test를 대체하지 않습니다.",
    workflow: "pinned tool/rule/database revision→baseline→changed-code high-signal scan→candidate validation→owner/severity/SLA→fix test→full rescan→artifact attestation을 연결합니다.",
    invariants: "scanner finding을 자동으로 취약점 확정/무시하지 않고 실제 secret은 output에 표시하지 않으며 suppression은 reason, scope, owner와 expiry를 가집니다.",
    edgeCases: "generated files, vendored code, test secrets, minified artifacts, transitive dependency, unreachable vulnerability, private registry와 offline DB를 포함합니다.",
    failureModes: "warning 0을 security pass로 취급하면 logic flaws를 놓치고, secret match를 로그에 그대로 출력하면 scanner 자체가 새로운 leak를 만듭니다.",
    verification: "known synthetic vulnerable/secret fixtures, rule version, false-positive regression, dependency reachability, fix diff와 final artifact scans를 실행합니다.",
    operations: "validated findings, age/SLA, suppression expiry, database age, scan coverage/failure와 artifact digest를 security backlog에 연결합니다.",
    concepts: [c("SAST", "source/bytecode의 data/control patterns를 분석해 보안 후보를 찾는 정적 분석입니다.", ["후보 validation이 필요합니다.", "업무 정책 test를 대체하지 않습니다."]), c("SCA", "software components와 vulnerability advisories/license/provenance를 분석하는 과정입니다.", ["SBOM과 연결합니다.", "reachability를 검토합니다."]), c("suppression expiry", "scanner 예외가 영구 blind spot이 되지 않도록 자동 재검토되는 만료 시점입니다.", ["owner와 reason을 둡니다.", "scope를 최소화합니다."])],
    codeExamples: [node("security07-scan-triage", "security scanner triage gate", "Security07ScanTriage.mjs", "candidate를 validated/suppressed-expiring/unknown으로 분류해 release를 판정합니다.", String.raw`const findings = [
  { id: "F1", state: "validated", severity: "high", fixed: true },
  { id: "F2", state: "suppressed", expiresDays: 20 },
  { id: "F3", state: "false-positive", regression: true },
];
const blockers = findings.filter(x => (x.state === "validated" && !x.fixed) || (x.state === "suppressed" && x.expiresDays <= 0) || (x.state === "false-positive" && !x.regression));
for (const x of findings) console.log(x.id + "|" + x.state);
console.log("blockers=" + blockers.length);
console.log("release=" + (blockers.length ? "block" : "pass"));`, "F1|validated\nF2|suppressed\nF3|false-positive\nblockers=0\nrelease=pass", ["nist-ssdf", "owasp-asvs", "slsa"] )],
  }),
  appliedTopic({
    id: "dynamic-abuse-chaos-tests", title: "authorized DAST·abuse cases·fault injection으로 emergent behavior를 검증합니다",
    lead: "production을 무차별 scan하지 않고 소유한 격리 환경과 명시한 scope/rate에서 parser, auth, resource, browser와 failure recovery를 실제 protocol로 시험합니다.",
    mechanism: "DAST는 deployed surface에 입력을 보내고 abuse test는 업무 sequence/privilege, fault injection은 dependency timeout/partial failure를 검증합니다. destructive payload와 data retention을 사전에 통제합니다.",
    workflow: "authorization/scope→disposable environment/data→route inventory→safe rate/payload→authenticated contexts→monitor/stop conditions→cleanup/evidence→finding validation을 수행합니다.",
    invariants: "소유/허가 없는 target을 검사하지 않고 production credentials/PII를 사용하지 않으며 stop condition과 cleanup이 자동화됩니다.",
    edgeCases: "rate limits, account lockout, email/SMS side effects, file upload, third-party callbacks, queue backlog, cost amplification와 shared test tenant를 포함합니다.",
    failureModes: "tool default scan을 production에 실행하면 서비스/데이터/외부 시스템에 피해를 줄 수 있고 scanner alert를 validation 없이 보고하면 false positive가 쌓입니다.",
    verification: "scope enforcement, synthetic canary, request rate, side-effect sinks, stop switch, cleanup readback와 manually reproducible validated finding을 확인합니다.",
    operations: "scan ID/scope/artifact, request/error/side effects, stop triggers, cleanup completeness와 validated candidates를 audit log에 남깁니다.",
    concepts: [c("authorized security test", "소유자·범위·시간·방법·stop condition을 명시해 허가된 환경에 수행하는 보안 test입니다.", ["production은 별도 승인입니다.", "증거를 보존합니다."]), c("abuse case", "정상 기능을 공격자 관점의 순서·권한·입력으로 오용하는 시나리오입니다.", ["business logic을 다룹니다.", "negative test로 자동화합니다."]), c("fault injection", "timeout, partial failure, stale state 같은 장애를 의도적으로 발생시켜 fail-closed와 recovery를 검증하는 기법입니다.", ["blast radius를 제한합니다.", "cleanup을 포함합니다."])],
  }),
  appliedTopic({
    id: "security-mutation-regression", title: "security mutation과 historical regression corpus로 test의 탐지력을 검증합니다",
    lead: "test가 실행됐다는 사실이 아니라 permitAll 확대, owner predicate 제거, CSRF bypass, handler의 token log처럼 실제 위험을 심은 controlled mutant를 확실히 차단하는지 측정합니다.",
    mechanism: "security mutation은 production artifact가 아니라 격리된 test branch/runtime에서 enforcement condition을 의도적으로 약화합니다. historical regression은 과거 validated finding의 최소 synthetic reproducer를 영구 corpus로 보존해 같은 source/sink/path가 되살아나는지 검사합니다.",
    workflow: "control별 kill condition을 정의하고 safe mutant→expected failing tests/gates→artifact 폐기→original clean rerun을 자동화하며 살아남은 mutant는 test gap과 owner backlog로 기록합니다.",
    invariants: "mutant artifact는 서명·배포·cache되지 않고 actual credentials/data를 사용하지 않으며 original source/artifact의 clean hash와 full pass를 마지막에 다시 증명합니다.",
    edgeCases: "equivalent mutant, flaky test, multiple controls catching one mutant, generated config, proxy policy, database predicate, browser-only enforcement와 scanner-only candidate를 포함합니다.",
    failureModes: "line coverage가 높아도 authorization 조건을 제거한 mutant가 살아남을 수 있고, mutant가 shared registry나 test cache에 남으면 오염된 artifact가 배포될 위험이 있습니다.",
    verification: "mutant ID/control mapping, expected test failure, no-deploy provenance, cache/artifact cleanup, surviving mutant triage와 clean rerun digest를 확인합니다.",
    operations: "mutation kill rate, surviving high-risk mutants, historical corpus age, flaky masking과 cleanup failures를 verification backlog와 release gate에 연결합니다.",
    concepts: [c("security mutation", "보안 enforcement를 격리 환경에서 의도적으로 약화해 test가 이를 탐지하는지 확인하는 변경입니다.", ["production 배포를 금지합니다.", "control ID와 연결합니다."]), c("mutation kill", "mutant 때문에 예상한 security test/gate가 실패해 위험을 탐지한 결과입니다.", ["test sensitivity를 나타냅니다.", "equivalent mutant를 review합니다."]), c("historical regression corpus", "과거 validated finding을 비민감 synthetic input과 expected deny로 재현하는 영구 test 집합입니다.", ["finding 재발을 막습니다.", "source revision과 분리합니다."])],
    codeExamples: [node("security07-mutation-gate", "security mutation kill-rate gate", "Security07MutationGate.mjs", "controlled security mutants가 필요한 tests에서 모두 차단되는지 계산합니다.", String.raw`const mutants = [
  { id: "M1", control: "authorization", killed: true },
  { id: "M2", control: "csrf", killed: true },
  { id: "M3", control: "credential-logging", killed: true },
  { id: "M4", control: "problem-redaction", killed: true },
];
for (const x of mutants) console.log(x.id + "|" + x.control + "|killed=" + x.killed);
const rate = mutants.filter(x => x.killed).length / mutants.length * 100;
console.log("killRate=" + rate);
console.log("release=" + (rate === 100 ? "pass" : "block"));`, "M1|authorization|killed=true\nM2|csrf|killed=true\nM3|credential-logging|killed=true\nM4|problem-redaction|killed=true\nkillRate=100\nrelease=pass", ["spring-testing", "owasp-asvs", "nist-ssdf"])],
  }),
  appliedTopic({
    id: "audit-package-release-gate", title: "재현 가능한 audit package와 risk-based release gate를 운영합니다",
    lead: "수천 줄 log를 전달하는 대신 scope, control matrix, versions, commands, summarized outcomes, validated findings, exceptions와 recovery evidence를 immutable package로 만듭니다.",
    mechanism: "risk gate는 critical/high validated open findings, unexpected allow, credential leak, mutation-after-deny와 evidence gaps를 hard blocker로 두고 lower risks는 owner/SLA/compensation을 요구합니다.",
    workflow: "clean artifact에서 tests/scans→machine-readable results→hash/redaction→control mapping→human validation→signed summary→retention/access→release decision을 자동화합니다.",
    invariants: "raw secrets/PII가 package에 없고 pass/fail 계산이 reproducible하며 flaky/disabled test를 pass로 숨기지 않고 exception은 expiry가 있습니다.",
    edgeCases: "partial CI outage, advisory DB stale, manual test pending, flaky browser, emergency release, artifact rebuild와 rollback revision을 포함합니다.",
    failureModes: "모든 warning을 같은 severity로 막으면 bypass 문화가 생기고, green summary만 보존하면 나중에 어떤 source/runtime을 검증했는지 알 수 없습니다.",
    verification: "package schema/hash/signature, source/artifact correspondence, secret scan, control coverage, gate recomputation, exception expiry와 rollback evidence를 독립 재실행합니다.",
    operations: "gate blockers/overrides, evidence age, flaky/disabled tests, finding SLA, package access와 rollback readiness를 owner dashboard에 연결합니다.",
    concepts: [c("audit package", "검증 scope·versions·control mappings·results·findings·exceptions를 재현 가능하게 묶은 artifact입니다.", ["raw secrets를 제외합니다.", "digest를 보존합니다."]), c("risk-based gate", "검증된 위험과 evidence quality에 따라 release를 pass/block/exception으로 결정하는 정책입니다.", ["hard blockers를 명시합니다.", "예외는 만료됩니다."]), c("reproducible decision", "같은 machine-readable evidence와 policy revision으로 누구나 같은 release 결론을 계산할 수 있는 성질입니다.", ["manual reasoning을 기록합니다.", "policy hash를 포함합니다."])],
    codeExamples: [node("security07-release-gate", "security verification release gate", "Security07ReleaseGate.mjs", "control coverage, hard findings, side effects, secret scans와 audit provenance로 release를 판정합니다.", String.raw`const evidence = { controlCoverage: 100, criticalOpen: 0, highOpen: 0, unexpectedAllow: 0, mutationAfterDeny: 0, secretFindings: 0, browserMatrix: 100, artifactMatched: true, rollbackVerified: true };
const pass = evidence.controlCoverage === 100 && evidence.criticalOpen === 0 && evidence.highOpen === 0 && evidence.unexpectedAllow === 0 && evidence.mutationAfterDeny === 0 && evidence.secretFindings === 0 && evidence.browserMatrix === 100 && evidence.artifactMatched && evidence.rollbackVerified;
for (const [key,value] of Object.entries(evidence)) console.log(key + "=" + value);
console.log("release=" + (pass ? "pass" : "block"));`, "controlCoverage=100\ncriticalOpen=0\nhighOpen=0\nunexpectedAllow=0\nmutationAfterDeny=0\nsecretFindings=0\nbrowserMatrix=100\nartifactMatched=true\nrollbackVerified=true\nrelease=pass", ["owasp-asvs", "owasp-wstg", "nist-ssdf", "slsa"] )],
  }),
];

const sources: SessionSource[] = [
  { id: "local-security-config", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/config/SecurityConfig.java", usedFor: ["source/config audit scope", "filter/request/error control inventory"], evidence: "2026-07-14 read-only sanitized audit: 106 lines, 6,013 bytes, SHA-256 B1051723C4FEE8FCBEC587B0A1CFCFA7A9EB0C461EBE59602DA980EF1D62CCD8. 실제 routes/origins/messages는 복사하지 않았습니다." },
  { id: "local-jwt-filter", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtRequestFilter.java", usedFor: ["filter/context/failure test scope", "credential-log sink finding"], evidence: "2026-07-14 read-only sanitized audit: 94 lines, 4,208 bytes, SHA-256 EA08D71D7A21293E92451B7867142AB1582B403664C4A26C3D47213FE9E432B2. token/header/subject 값은 복사하지 않았습니다." },
  { id: "local-build", repository: "D:/dev/2026-myproject04-cicd", path: "build.gradle", usedFor: ["dependency/version/SBOM audit boundary"], evidence: "2026-07-14 read-only audit: 56 lines, 2,047 bytes, SHA-256 CBF6CB4A2BDE7B7C072C924F3C03E009EF7EEE737314B1F4EDB82FB77EB5C0A5." },
  { id: "spring-testing", repository: "Spring Security reference", path: "servlet/test/index.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/test/index.html", usedFor: ["Spring Security test architecture and support"], evidence: "Spring Security 공식 testing reference입니다." },
  { id: "spring-mockmvc", repository: "Spring Security reference", path: "servlet/test/mockmvc/index.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/test/mockmvc/index.html", usedFor: ["FilterChainProxy and MockMvc integration"], evidence: "Spring Security 공식 MockMvc integration reference입니다." },
  { id: "spring-csrf-test", repository: "Spring Security reference", path: "servlet/test/mockmvc/csrf.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/test/mockmvc/csrf.html", usedFor: ["valid/invalid CSRF MockMvc tests"], evidence: "Spring Security 공식 CSRF testing reference입니다." },
  { id: "spring-result-matchers", repository: "Spring Security reference", path: "servlet/test/mockmvc/result-matchers.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/test/mockmvc/result-matchers.html", usedFor: ["authenticated/unauthenticated result assertions"], evidence: "Spring Security 공식 MockMvc result matcher reference입니다." },
  { id: "spring-method-security", repository: "Spring Security reference", path: "servlet/authorization/method-security.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html", usedFor: ["method-security proxy tests and IDOR examples"], evidence: "Spring Security 공식 method-security reference입니다." },
  { id: "owasp-asvs", repository: "OWASP ASVS", path: "www-project-application-security-verification-standard", publicUrl: "https://owasp.org/www-project-application-security-verification-standard/", usedFor: ["security verification requirements and control coverage"], evidence: "OWASP 공식 ASVS project입니다. 현재 stable release와 requirement IDs는 audit 시작 시 고정합니다." },
  { id: "owasp-wstg", repository: "OWASP WSTG", path: "www-project-web-security-testing-guide", publicUrl: "https://owasp.org/www-project-web-security-testing-guide/", usedFor: ["authorized web security test methods"], evidence: "OWASP 공식 Web Security Testing Guide project입니다." },
  { id: "nist-ssdf", repository: "NIST SP 800-218", path: "sp/800/218/final", publicUrl: "https://csrc.nist.gov/pubs/sp/800/218/final", usedFor: ["secure development verification, provenance and response practices"], evidence: "NIST 공식 Secure Software Development Framework publication입니다." },
  { id: "slsa", repository: "SLSA specification", path: "spec/v1.2", publicUrl: "https://slsa.dev/spec/v1.2/", usedFor: ["build provenance and artifact correspondence"], evidence: "SLSA 공식 supply-chain levels specification입니다." },
];

const session = createExpertSession({
  inventoryId: "security-07-security-testing-audit", slug: "security-07-security-testing-audit", courseId: "devops", moduleId: "security-filter-authentication", order: 7,
  title: "security testing·audit evidence", subtitle: "source와 runtime, Spring tests, browser/negative/abuse testing, scanners와 재현 가능한 audit gate를 하나의 evidence chain으로 연결합니다.",
  level: "고급", estimatedMinutes: 185,
  coreQuestion: "보안 설정이 있어 보인다는 인상을 넘어 어떤 위협과 control을 어느 source·artifact·runtime에서 실제로 검증했는지 어떻게 재현 가능한 증거로 남길까요?",
  summary: "학습 프로젝트의 SecurityConfig, JWT filter와 build snapshot 3개를 read-only·sanitized audit scope로 사용하고 credential logging finding을 포함한 실제 risk를 control-evidence matrix에 연결합니다. source/config/runtime evidence, authentication layers, request/method/object negative authorization, real-browser CSRF/CORS/CSP, security problem/log sink tests, SAST/SCA/secret triage, authorized DAST/abuse/fault tests와 reproducible audit package를 Spring Security·OWASP ASVS/WSTG·NIST SSDF·SLSA 근거 및 일곱 executable models로 완성합니다.",
  objectives: ["control requirement와 evidence provenance를 mapping한다.", "source/build/context/runtime evidence를 구분한다.", "authentication parser/provider/filter/session을 층별 test한다.", "authorization negative matrix와 side-effect zero를 증명한다.", "CSRF/CORS/CSP를 real browser에서 검증한다.", "401/403/problem/log sinks를 audit한다.", "SAST/SCA/secret candidates를 검증·triage한다.", "허가된 DAST/abuse/fault test를 안전하게 수행한다.", "재현 가능한 audit package와 release gate를 운영한다."],
  prerequisites: [{ title: "security 예외·EntryPoint·AccessDeniedHandler", reason: "보안 failure의 status/header/problem/context/chain/log/client recovery contract를 알아야 audit matrix가 표면적 status test로 끝나지 않습니다.", sessionSlug: "security-06-authentication-exception-entrypoint" }],
  keywords: ["Spring Security Test", "MockMvc", "negative test", "ASVS", "WSTG", "SSDF", "SBOM", "SAST", "SCA", "secret scanning", "DAST", "audit evidence", "release gate"],
  topics,
  lab: { title: "Spring Security feature를 control-to-evidence audit package로 qualification하기", scenario: "원본은 변경하지 않고 synthetic users/resources/credentials와 disposable Spring/browser environment에서 source→build→filter→DB/browser→audit decision의 전체 evidence chain을 만듭니다.", setup: ["Java 21/Spring Security compatible fixture", "JUnit·Spring Security Test·MockMvc", "disposable database and 3 HTTPS browser origins", "SBOM/SAST/SCA/secret scanners pinned versions", "synthetic credential canaries", "authorized isolated DAST target", "immutable artifact store", "원본 3 files read-only"], steps: ["ASVS-derived control matrix에 threats, enforcement, tests, owner와 evidence expiry를 기록합니다.", "원본 hashes, dependency graph/SBOM, context/filter snapshot과 runtime effective response를 연결합니다.", "credential corpus로 parser/provider/filter/context/session success/failure를 실행합니다.", "route/method/object/tenant negative authorization와 DB/cache/event side-effect zero를 검증합니다.", "separate HTTPS origins에서 CSRF/CORS/headers/CSP와 server state readback을 실행합니다.", "401/403/problem/client recovery와 proxy/APM/log/trace/artifact secret canary scan을 실행합니다.", "SAST/SCA/secret candidates를 validate하고 suppression expiry/fix regression을 기록합니다.", "허가된 isolated DAST/abuse/fault tests를 rate/stop/cleanup controls와 수행합니다.", "machine-readable results를 control IDs에 mapping하고 digest/redaction/signature를 검증합니다.", "risk gate와 rollback/credential incident drill, 원본 unchanged를 독립 재실행합니다."], expectedResult: ["모든 security claim이 source/artifact/config/runtime과 재현 가능한 test evidence를 가집니다.", "negative authorization/browser failures가 side effect를 만들지 않고 client recovery가 제한됩니다.", "scanner output이 validated finding, expiry 있는 suppression 또는 regression-guarded false positive로 triage됩니다.", "audit package에 secrets/PII가 없고 같은 policy로 같은 release decision을 재계산할 수 있습니다.", "critical control/evidence gap과 credential leak은 예외 없이 release를 차단하고 recovery evidence를 요구합니다."], cleanup: ["synthetic identities/resources/credentials와 disposable DB/browser origins를 폐기합니다.", "scan/DAST targets, queues, contexts, proxies와 canary sinks를 종료합니다.", "raw captures를 redaction 후 policy에 따라 삭제하고 signed summary만 보존합니다.", "원본 3 files hash/status unchanged를 확인합니다."], extensions: ["property-based authorization test generation과 mutation testing을 추가합니다.", "SBOM/VEX와 advisory reachability automation을 통합합니다.", "security test evidence를 deployment attestation에 연결합니다.", "continuous control monitoring과 exception-expiry bot을 운영합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node models를 실행하고 각 결과를 source/build/test/browser/scan/audit evidence에 대응시키세요.", requirements: ["stdout 완전 일치", "control map", "evidence layers", "authz matrix", "browser matrix", "scan triage", "release gate"], hints: ["deterministic model은 actual Spring/browser/scanner/DAST evidence가 아닙니다."], expectedOutcome: "보안 claim과 증거의 적용 범위·한계·만료를 설명합니다.", solutionOutline: ["requirements→evidence layers→negative/browser/error→scans/abuse→gate 순서입니다."] },
    { difficulty: "응용", prompt: "한 CRUD+login feature의 complete security verification packet을 만드세요.", requirements: ["control matrix", "source/artifact provenance", "authn/authz", "browser", "errors/logs", "scanners", "abuse tests", "findings", "rollback"], hints: ["green scan summary만 보존하지 말고 commands, revisions와 limitations를 포함하세요."], expectedOutcome: "다른 reviewer가 독립 재현하고 같은 risk decision을 내릴 수 있습니다.", solutionOutline: ["scope→threat/control→execute→validate→package/decide 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 secure verification governance를 작성하세요.", requirements: ["ASVS/SSDF mapping", "evidence schema", "test layers", "tool provenance", "finding triage", "exceptions", "retention/privacy", "release/incident gate"], hints: ["모든 warning을 blocker로 만드는 대신 hard invariants와 validated severity를 명시하세요."], expectedOutcome: "팀들이 일관된 rigor로 보안을 증명하고 예외와 drift를 관리합니다.", solutionOutline: ["standardize→automate→validate→attest→monitor/recover 순서입니다."] },
  ],
  nextSessions: ["security-08-filter-authentication-capstone"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["실제 routes, origins, messages, Authorization headers, tokens, subjects와 environment secrets는 공개 content/evidence에 복사하지 않았습니다.", "credential logging source behavior는 value 없이 audit finding과 canary/sink-scan control로 연결했고 실제 credential 노출 가능성이 있으면 revoke/rotate/purge/readback이 필요합니다.", "scanner와 test double 결과를 actual business authorization, browser/runtime behavior 또는 vulnerability absence로 과장하지 않습니다.", "Node models는 actual Spring context/filter/DB/browser/scanner/DAST를 대체하지 않으므로 lab에서 isolated integration evidence를 요구합니다."] },
});

export default session;
