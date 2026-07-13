import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localAuditRefs = [
  "local-react-intro", "local-react-router", "local-react-network", "local-react-zustand",
  "local-react-auth-crud", "local-react-modern-roadmap", "local-app01-package", "local-app02-package",
  "local-app03-package", "local-app01-app", "local-app02-app", "local-app03-app",
  "local-app01-test", "local-app02-test", "local-app03-test", "local-app01-vitals",
];

const officialRefs = [
  "react-creating-app", "react-cra-sunset", "react-state-structure", "react-effects", "react-strict-mode",
  "react-profiler", "react-suspense", "react-act", "react-router-modes", "react-router-route-object",
  "vite-guide", "vite-build", "vite-env", "vite-deploy", "rtl-guiding", "playwright-intro",
  "playwright-best-practices", "wcag22", "url-standard", "fetch-standard", "html-history",
  "rfc9110", "rfc9111", "rfc9457", "owasp-asvs", "owasp-authorization",
  "owasp-input-validation", "owasp-logging", "owasp-secrets",
];

const topics = [
  appliedTopic({
    id: "sanitized-estate-inventory",
    title: "my-app01~03와 REACT 문서를 sanitized evidence inventory로 고정합니다",
    lead: "캡스톤은 새 화면부터 만드는 과제가 아니라 지금까지 만든 학습 자산이 무엇을 증명하고 무엇은 아직 증명하지 못하는지 재현 가능한 inventory로 선언하는 일에서 시작합니다.",
    mechanism: "read-only 감사에서 my-app01 src 114개·126,089 bytes, my-app02 src 17개·26,047 bytes, my-app03 src 24개·57,668 bytes와 REACT 문서 13개·89,228 bytes를 확인했습니다. 합계는 168 files·299,032 bytes입니다. App, package, test, vitals와 여섯 문서의 exact hash를 별도 provenance로 기록해 학습 gallery, router/network/state/auth/CRUD, scaffold tests와 legacy metrics surface를 서로 구분합니다.",
    workflow: "repository→documentation/runtime/test/operations category→file count·bytes·extension→representative exact hash→observed capability→gap→proposed capstone evidence 순서로 manifest를 만들고, 실제 사용자·콘텐츠·경로·저장 키·credential·token·endpoint·domain 값은 count나 generic capability로 치환합니다.",
    invariants: "원본 세 저장소와 문서는 변경하지 않고 observed와 inferred/proposed를 같은 문장에 섞지 않으며 파일 수가 기능 완성도나 품질을 의미한다고 과장하지 않습니다.",
    edgeCases: "generated assets, dependency directories, duplicate scaffold files, binary assets, deleted-but-tracked files, line-ending 차이, case-sensitive 경로, symlink와 untracked local experiments를 manifest policy로 명시합니다.",
    failureModes: "대표 파일 몇 개만 읽고 전체 React 숙련도를 선언하거나 raw route·member·token·server 값을 공개 자료에 복사하면 provenance와 privacy가 동시에 무너집니다.",
    verification: "exact lines·bytes·SHA-256, inventory 합계, extension counts, git status unchanged, sourceRef coverage와 redaction scan을 독립적으로 재계산합니다.",
    operations: "manifest에는 repository alias, relative path, digest, audit date와 capability label만 두고 개인 식별 가능 값과 환경별 endpoint는 secret store 또는 비공개 운영 문서에 둡니다.",
    concepts: [
      c("evidence inventory", "소스와 문서가 실제로 보여 주는 capability를 위치·digest·한계와 함께 기록한 목록입니다.", ["포트폴리오 주장 근거가 됩니다.", "재감사 시 drift를 찾습니다."]),
      c("sanitized provenance", "민감 값을 복제하지 않으면서 어떤 원본에서 결론이 나왔는지 검증할 수 있는 출처 기록입니다.", ["exact hash를 포함합니다.", "관찰과 제안을 분리합니다."]),
      c("capability gap", "현재 evidence로는 충족을 증명할 수 없는 architecture·quality·operation 요구입니다.", ["결함과 학습 기회를 구분합니다.", "backlog와 gate로 변환합니다."]),
    ],
    codeExamples: [node(
      "react45-estate-inventory",
      "sanitized React estate inventory",
      "React45EstateInventory.mjs",
      "네 source group의 공개 가능한 count와 bytes만 합산하고 private values가 복사되지 않았음을 확인합니다.",
      String.raw`const groups = [
  { name: "app01-src", files: 114, bytes: 126089 },
  { name: "app02-src", files: 17, bytes: 26047 },
  { name: "app03-src", files: 24, bytes: 57668 },
  { name: "react-docs", files: 13, bytes: 89228 },
];
const total = groups.reduce((sum, item) => ({
  files: sum.files + item.files,
  bytes: sum.bytes + item.bytes,
}), { files: 0, bytes: 0 });
for (const item of groups) console.log(item.name + "=" + item.files + ":" + item.bytes);
console.log("total=" + total.files + ":" + total.bytes);
console.log("private-values-copied=false");`,
      "app01-src=114:126089\napp02-src=17:26047\napp03-src=24:57668\nreact-docs=13:89228\ntotal=168:299032\nprivate-values-copied=false",
      localAuditRefs.concat(["react-creating-app", "react-cra-sunset"]),
    )],
  }),
  appliedTopic({
    id: "target-architecture-adrs",
    title: "UI·state·router·network·server trust boundary를 target architecture와 ADR로 설계합니다",
    lead: "components를 폴더별로 나누는 수준을 넘어 사용자 journey가 어느 state owner, route loader/action, API contract와 server authorization을 통과하는지 한 장의 dependency rule과 여러 작은 ADR로 고정합니다.",
    mechanism: "presentation은 accessible UI와 event intent를, feature layer는 use case와 state transition을, data adapter는 HTTP/cache/storage translation을, server는 identity·authorization·validation·persistence를 소유합니다. React state는 최소 표현만 보관하고 파생 값은 render에서 계산하며 Effect는 외부 시스템 동기화에 한정합니다. router mode와 data ownership은 배포 환경, SSR 필요성, mutation/revalidation 요구로 선택합니다.",
    workflow: "critical journeys를 작성하고 trust/state/runtime boundary를 표시한 뒤 module dependency 방향, public interfaces, error taxonomy와 ownership을 선언합니다. 각 선택에는 context·options·decision·consequences·migration·rollback을 포함한 ADR을 붙이고 원본 구현은 adapter 뒤에서 점진적으로 이동합니다.",
    invariants: "client route guard와 hidden button은 authorization이 아니며 UI state를 server truth로 취급하지 않습니다. domain layer가 React/router/browser global에 직접 의존하지 않고 infrastructure failure가 domain 의미를 덮지 않습니다.",
    edgeCases: "deep link, refresh, back/forward, duplicate tabs, expired identity, optimistic mutation, partial response, stale cache, replay, hydration 여부와 browser storage unavailable을 boundary table에 넣습니다.",
    failureModes: "거대한 App component와 global store가 route·form·server state를 모두 소유하면 변경 영향이 확산되고, diagram만 있고 dependency test가 없으면 architecture는 즉시 drift합니다.",
    verification: "import rule, route/state ownership table, contract tests, ADR decision log, negative authorization cases와 dependency cycle detection으로 구조가 실제 build와 일치하는지 확인합니다.",
    operations: "각 boundary는 stable error code, correlation ID, latency/availability signal과 owner/runbook을 가지되 raw payload·token·URL parameter를 telemetry에 넣지 않습니다.",
    concepts: [
      c("trust boundary", "입력이나 identity를 다시 검증해야 하는 권한·프로세스·저장 경계입니다.", ["browser/server 사이가 대표적입니다.", "UI 가시성과 권한을 구분합니다."]),
      c("state ownership", "어떤 계층이 값의 진실, 갱신과 invalidation을 책임지는지 정한 계약입니다.", ["중복 state를 줄입니다.", "reconciliation 책임을 명확히 합니다."]),
      c("ADR", "중요한 architecture 선택의 맥락, 대안, 결정과 결과를 남기는 짧은 기록입니다.", ["왜를 보존합니다.", "migration/rollback을 포함합니다."]),
    ],
    codeExamples: [node(
      "react45-dependency-rule",
      "architecture dependency direction gate",
      "React45DependencyRule.mjs",
      "module dependency가 presentation→feature→domain 또는 infrastructure adapter 방향만 따르는지 검사합니다.",
      String.raw`const rank = { presentation: 3, feature: 2, infrastructure: 2, domain: 1 };
const edges = [
  ["presentation", "feature"],
  ["feature", "domain"],
  ["infrastructure", "domain"],
  ["presentation", "domain"],
];
const violations = edges.filter(([from, to]) => rank[from] < rank[to]);
for (const [from, to] of edges) console.log(from + "->" + to + "=" + (rank[from] >= rank[to] ? "allow" : "block"));
console.log("violations=" + (violations.length || "none"));`,
      "presentation->feature=allow\nfeature->domain=allow\ninfrastructure->domain=allow\npresentation->domain=allow\nviolations=none",
      ["local-react-router", "local-react-network", "local-react-zustand", "local-react-auth-crud", "react-state-structure", "react-effects", "react-router-modes", "react-router-route-object"],
    )],
  }),
  appliedTopic({
    id: "incremental-runtime-migration",
    title: "CRA 학습 이력은 보존하고 current Vite·framework runtime으로 parity 기반 이행합니다",
    lead: "기존 CRA snapshot을 낡았다고 지우지 않고 당시 학습 evidence로 보존하면서 신규 production runtime은 현행 React 권고와 배포 요구에 맞춰 별도 target을 만들고 slice별 parity를 증명합니다.",
    mechanism: "CRA sunsetting은 기존 app이 즉시 동작하지 않는다는 뜻이 아닙니다. package·App·test snapshots는 versions와 assumptions가 다른 세 학습 지점을 보여 줍니다. 신규 shell은 Vite 또는 React가 권하는 framework를 선택하고 route, asset/base path, env, test transform, service worker와 deployment semantics 차이를 adapter와 parity suite로 드러냅니다.",
    workflow: "현재 build/test/runtime baseline을 freeze하고 target shell을 병렬 생성한 뒤 shared domain/feature contract부터 옮깁니다. read-only page→authenticated read→mutation→error/offline→observability 순서로 migration wave를 작게 유지하고 각 wave가 동일 acceptance journeys와 rollback artifact를 통과한 뒤 traffic을 이동합니다.",
    invariants: "big-bang rewrite를 피하고 old artifact가 항상 복구 가능해야 하며 migration 중에도 auth/authorization, URL semantics, cache, accessibility와 data integrity가 약해지지 않습니다.",
    edgeCases: "public base path, dynamic import chunk skew, environment prefix 차이, history fallback, stale service worker, router major-version semantics, Jest/Vitest timer 차이와 third-party CommonJS를 qualification합니다.",
    failureModes: "개발 서버가 뜨는 것만으로 migration 완료라 하면 production assets/deep link/env/test가 깨지고, 두 runtime이 같은 storage/cache를 무계획으로 공유하면 rollback 후 session과 data가 불일치합니다.",
    verification: "old/new production builds, route matrix, visual/semantic parity, contract/E2E suite, bundle/performance/a11y/security gates, canary metrics와 rollback rehearsal을 wave별로 저장합니다.",
    operations: "artifact digest, runtime/router version, feature flag, cohort와 migration wave를 low-cardinality metadata로 관찰하고 mixed-version failure runbook을 제공합니다.",
    concepts: [
      c("strangler migration", "기존 시스템을 유지한 채 작은 기능 경계를 새 구현으로 차례로 우회하는 이행 방식입니다.", ["rollback이 작습니다.", "동시 운영 계약이 필요합니다."]),
      c("parity suite", "기존과 신규 runtime이 유지해야 할 사용자 관찰 가능 동작을 같은 fixture로 비교하는 검증 집합입니다.", ["내부 구현 동일성을 요구하지 않습니다.", "의도한 변화는 별도 승인합니다."]),
      c("runtime skew", "문서·chunk·cache·client와 server가 서로 다른 release 계약을 사용하는 상태입니다.", ["배포와 rollback에서 발생합니다.", "versioned compatibility가 필요합니다."]),
    ],
    codeExamples: [node(
      "react45-migration-waves",
      "incremental migration qualification",
      "React45MigrationWaves.mjs",
      "각 migration wave가 parity, quality와 rollback evidence를 모두 갖췄는지 판정합니다.",
      String.raw`const waves = [
  { name: "public-read", parity: true, quality: true, rollback: true },
  { name: "authenticated-read", parity: true, quality: true, rollback: true },
  { name: "mutation", parity: true, quality: true, rollback: true },
];
for (const wave of waves) {
  const ready = wave.parity && wave.quality && wave.rollback;
  console.log(wave.name + "=" + (ready ? "ready" : "block"));
}
console.log("cutover=" + (waves.every((wave) => wave.parity && wave.quality && wave.rollback) ? "ready" : "block"));`,
      "public-read=ready\nauthenticated-read=ready\nmutation=ready\ncutover=ready",
      ["local-react-intro", "local-react-modern-roadmap", "local-app01-package", "local-app02-package", "local-app03-package", "react-creating-app", "react-cra-sunset", "vite-guide", "vite-deploy"],
    )],
  }),
  appliedTopic({
    id: "production-build-supply-config",
    title: "build·dependency·environment·secret·artifact를 재현 가능한 supply chain으로 묶습니다",
    lead: "production build 성공을 한 번의 명령이 아니라 잠긴 dependency, 허용된 public configuration, 검증된 artifact와 provenance를 같은 입력에서 반복 생성하는 계약으로 다룹니다.",
    mechanism: "lockfile과 supported runtime을 고정하고 clean install→lint/type/test→production build→manifest/SBOM→artifact signing/digest 순서를 CI에서 실행합니다. Vite client env는 bundle에 노출될 public 값이므로 allowlist와 schema를 적용하고 secret은 server/CI secret manager에만 둡니다. source maps, licenses와 transitive dependencies도 release artifact의 일부입니다.",
    workflow: "configuration을 public build-time, public runtime, server secret, operational metadata로 분류하고 schema/default/failure mode를 선언합니다. ephemeral runner에서 동일 commit·lockfile로 두 번 build해 reproducibility 차이를 조사하며 artifact digest와 dependency/license/vulnerability evidence를 release record에 연결합니다.",
    invariants: "client prefix가 붙은 값은 secret이 아니며 credential을 repository, example, log, source map과 browser storage에 두지 않습니다. build failure를 fallback default로 숨기지 않고 deploy 대상은 검증한 immutable artifact와 정확히 같아야 합니다.",
    edgeCases: "optional dependency, native module, registry outage, revoked package, timezone/locale, nondeterministic timestamp, base URL, source map access, cache poisoning과 emergency dependency patch를 다룹니다.",
    failureModes: "developer machine에서 생성한 폴더를 그대로 배포하면 입력과 provenance가 사라지고, 모든 environment 변수를 browser에 주입하면 secret leakage와 환경별 비재현성이 생깁니다.",
    verification: "clean-room build, lockfile immutability, allowlist rejection, secret scan, SBOM/license review, digest equality, deploy smoke/deep-link test와 artifact retention/rollback fetch를 확인합니다.",
    operations: "release에는 commit, lockfile digest, builder/runtime, artifact/SBOM digest, environment schema version과 approval을 기록하고 credential 자체는 절대 기록하지 않습니다.",
    concepts: [
      c("immutable artifact", "검증 이후 내용이 바뀌지 않고 digest로 식별되는 배포 단위입니다.", ["같은 artifact를 승격합니다.", "rollback 대상을 명확히 합니다."]),
      c("SBOM", "artifact를 구성하는 direct/transitive software components와 versions의 목록입니다.", ["공급망 조사에 사용합니다.", "license/vulnerability evidence와 연결합니다."]),
      c("public configuration", "browser bundle이나 network response를 통해 사용자에게 노출될 수 있다고 전제하는 설정입니다.", ["allowlist와 schema가 필요합니다.", "secret과 분리합니다."]),
    ],
    codeExamples: [node(
      "react45-public-env-gate",
      "browser configuration allowlist",
      "React45PublicEnvGate.mjs",
      "synthetic 환경 키 중 browser bundle에 허용된 public configuration만 선택하고 secret-like 이름을 차단합니다.",
      String.raw`const env = {
  APP_PUBLIC_RELEASE: "r42",
  APP_PUBLIC_API_MODE: "proxy",
  APP_INTERNAL_SIGNING_KEY: "redacted",
  DATABASE_PASSWORD: "redacted",
};
const allowed = new Set(["APP_PUBLIC_RELEASE", "APP_PUBLIC_API_MODE"]);
const selected = Object.keys(env).filter((key) => allowed.has(key)).sort();
const blocked = Object.keys(env).filter((key) => !allowed.has(key)).sort();
console.log("public=" + selected.join(","));
console.log("blocked=" + blocked.join(","));
console.log("secret-values-printed=false");
console.log("build=" + (selected.length === 2 && blocked.length === 2 ? "pass" : "block"));`,
      "public=APP_PUBLIC_API_MODE,APP_PUBLIC_RELEASE\nblocked=APP_INTERNAL_SIGNING_KEY,DATABASE_PASSWORD\nsecret-values-printed=false\nbuild=pass",
      ["local-app01-package", "local-app02-package", "local-app03-package", "vite-build", "vite-env", "vite-deploy", "owasp-secrets"],
    )],
  }),
  appliedTopic({
    id: "full-stack-security-contract",
    title: "auth·CRUD를 server-enforced security contract와 abuse case로 완성합니다",
    lead: "로그인 화면과 client store가 있다는 사실을 security 완료로 간주하지 않고 identity lifecycle, object/function authorization, validation, HTTP semantics와 privacy-safe failure를 full-stack contract로 정의합니다.",
    mechanism: "client는 credential을 안전한 channel로 제출하고 authenticated UI를 표현하지만 신뢰 결정은 server가 매 request마다 수행합니다. server는 canonical input schema, object ownership/role/policy, CSRF·session/token lifecycle, rate/size 제한과 persistence constraints를 적용합니다. 401, 403, 404, 409, 422/Problem Details 같은 response 의미를 client recovery와 맞춥니다.",
    workflow: "asset·actor·entry point·trust boundary를 threat model로 그린 뒤 정상 journey보다 먼저 anonymous, expired, forged role, foreign object, mass assignment, malformed/oversized input, stored XSS, open redirect와 replay cases를 contract tests로 작성합니다. UI는 server error code를 안전한 사용자 행동으로 매핑합니다.",
    invariants: "client validation은 UX이며 server validation을 대체하지 않고 ID를 알거나 button을 숨기는 것이 권한을 부여하지 않습니다. token/credential, raw personal content와 stack trace는 client/log/telemetry에 노출하지 않습니다.",
    edgeCases: "동시 update, deleted resource, permission change mid-session, compromised refresh path, clock skew, duplicate submit, retry after unknown commit, Unicode normalization과 nested object fields를 포함합니다.",
    failureModes: "happy-path 로그인과 CRUD E2E만 통과시키면 IDOR, role tampering, stored XSS와 replay를 놓치며 모든 실패를 200 또는 generic network error로 만들면 정확한 recovery와 탐지가 불가능합니다.",
    verification: "ASVS-derived controls, authorization matrix, schema property tests, negative integration/E2E, secure cookie/header behavior, audit event redaction, dependency scan와 manual abuse review를 release gate에 연결합니다.",
    operations: "authentication/authorization decision code, policy version, route template, outcome와 correlation ID만 기록하고 credential·token·raw object ID·payload·full URL은 제외합니다.",
    concepts: [
      c("object-level authorization", "요청한 특정 resource에 대해 현재 subject가 action을 수행할 수 있는지 server가 검사하는 규칙입니다.", ["IDOR를 방지합니다.", "매 request에서 평가합니다."]),
      c("canonical validation", "encoding과 구조를 정규화한 뒤 server가 허용된 schema와 business invariant를 검사하는 과정입니다.", ["client validation과 별개입니다.", "mass assignment를 막습니다."]),
      c("Problem Details", "HTTP API 오류를 machine-readable type, status와 안전한 detail로 전달하는 표준 형식입니다.", ["RFC 9457을 따릅니다.", "민감 내부 정보를 제외합니다."]),
    ],
    codeExamples: [node(
      "react45-security-matrix",
      "authorization and validation contract matrix",
      "React45SecurityMatrix.mjs",
      "role과 resource ownership 조합을 server-style policy로 평가하고 client visibility가 결정에 관여하지 않음을 확인합니다.",
      String.raw`function decide({ authenticated, role, owns, valid }) {
  if (!authenticated) return 401;
  if (!valid) return 422;
  if (role === "admin" || owns) return 200;
  return 403;
}
const cases = [
  ["anonymous", { authenticated: false, role: "none", owns: false, valid: true }],
  ["owner", { authenticated: true, role: "member", owns: true, valid: true }],
  ["foreign", { authenticated: true, role: "member", owns: false, valid: true }],
  ["invalid", { authenticated: true, role: "member", owns: true, valid: false }],
  ["admin", { authenticated: true, role: "admin", owns: false, valid: true }],
];
for (const [name, input] of cases) console.log(name + "=" + decide(input));
console.log("client-visibility-authorizes=false");`,
      "anonymous=401\nowner=200\nforeign=403\ninvalid=422\nadmin=200\nclient-visibility-authorizes=false",
      ["local-react-auth-crud", "local-app03-app", "fetch-standard", "rfc9110", "rfc9457", "owasp-asvs", "owasp-authorization", "owasp-input-validation"],
    )],
  }),
  appliedTopic({
    id: "quality-gates-traceability",
    title: "requirement에서 unit·component·contract·E2E evidence까지 traceability를 만듭니다",
    lead: "테스트 개수를 늘리는 대신 어떤 사용자·보안·접근성·복구 requirement가 어느 fidelity에서 검증되고 실패하면 누가 출시를 막는지 양방향 traceability로 관리합니다.",
    mechanism: "pure state/validator는 unit, accessible interaction과 boundary behavior는 React Testing Library component test, HTTP schema/error semantics는 MSW 또는 disposable server contract integration, 실제 router/browser/storage/network journey는 Playwright E2E가 담당합니다. 같은 risk를 중복 실행하기보다 낮은 layer에서 빠르게 넓게 검증하고 browser에서 핵심 연결과 실제 platform behavior를 증명합니다.",
    workflow: "requirement ID와 abuse/failure case를 먼저 정의하고 test ID, fixture, environment, expected evidence, owner와 gate를 연결합니다. placeholder App tests는 삭제 근거를 남기고 실제 route/auth/CRUD/network contracts로 교체하며 deterministic clocks/IDs/data와 독립된 browser context를 사용합니다.",
    invariants: "implementation detail selector와 arbitrary timeout을 피하고 role·accessible name·label 같은 semantic query와 observable outcome을 사용합니다. retry로 실패를 숨기지 않고 test가 못 보는 requirement를 covered로 표시하지 않습니다.",
    edgeCases: "empty/invalid/large/Unicode input, rapid double submit, aborted/stale response, 401/403/404/409/422/5xx, deep link, reload/back, keyboard-only, zoom, reduced motion와 offline을 risk matrix에 포함합니다.",
    failureModes: "statement coverage가 높아도 server authorization과 browser navigation을 검증하지 못할 수 있고, live shared server나 current time에 의존한 E2E는 순서 의존·flake와 데이터 오염을 만듭니다.",
    verification: "requirement→test와 test→requirement 양방향 orphan scan, exact stdout/screenshot/trace/schema evidence, mutation/negative cases, flake quarantine owner와 CI shard reproducibility를 확인합니다.",
    operations: "실패 artifact는 synthetic account/data와 redacted network만 포함하고 trace retention, access control, rerun budget와 quarantine expiry를 운영합니다.",
    concepts: [
      c("test traceability", "requirement·risk와 이를 검증하는 test/evidence를 양방향으로 연결한 관계입니다.", ["orphan requirement를 찾습니다.", "무의미한 test도 찾습니다."]),
      c("fidelity boundary", "unit, component, integration, browser가 실제 runtime을 어느 정도 포함하는지 정한 범위입니다.", ["빠르기와 현실성 tradeoff가 있습니다.", "risk별로 선택합니다."]),
      c("deterministic fixture", "시간·ID·데이터·network 결과가 test마다 통제되고 독립적으로 초기화되는 입력입니다.", ["flake를 줄입니다.", "재현을 가능하게 합니다."]),
    ],
    codeExamples: [node(
      "react45-traceability-gate",
      "requirement to evidence traceability gate",
      "React45TraceabilityGate.mjs",
      "필수 requirement가 서로 다른 fidelity evidence와 owner를 모두 가지는지 확인합니다.",
      String.raw`const requirements = ["auth-negative", "crud-conflict", "keyboard-flow", "offline-recovery"];
const evidence = [
  { requirement: "auth-negative", layer: "contract", owner: "security" },
  { requirement: "crud-conflict", layer: "integration", owner: "feature" },
  { requirement: "keyboard-flow", layer: "e2e", owner: "accessibility" },
  { requirement: "offline-recovery", layer: "e2e", owner: "resilience" },
];
const missing = requirements.filter((id) => !evidence.some((item) => item.requirement === id && item.owner));
const layers = [...new Set(evidence.map((item) => item.layer))].sort();
console.log("requirements=" + requirements.length);
console.log("layers=" + layers.join(","));
console.log("missing=" + (missing.join(",") || "none"));
console.log("gate=" + (missing.length === 0 ? "pass" : "block"));`,
      "requirements=4\nlayers=contract,e2e,integration\nmissing=none\ngate=pass",
      ["local-app01-test", "local-app02-test", "local-app03-test", "react-act", "rtl-guiding", "playwright-intro", "playwright-best-practices"],
    )],
  }),
  appliedTopic({
    id: "inclusive-performance-resilience",
    title: "performance·WCAG·error/offline recovery를 같은 사용자 task budget으로 검증합니다",
    lead: "빠른 화면, 접근 가능한 화면, 실패를 견디는 화면을 별도 체크리스트로 쪼개지 않고 slow device·assistive technology·partial outage에서도 사용자가 task를 완료하고 상태를 이해하는지를 하나의 품질 outcome으로 봅니다.",
    mechanism: "Profiler와 current Web Vitals는 render/interaction 결과를, production bundle trace는 code delivery를, WCAG 2.2 검사는 keyboard/focus/name/status/reflow를, Error Boundary·Suspense와 network state machine은 render/loading/offline recovery를 증명합니다. budget은 LCP/INP/CLS뿐 아니라 input latency, focus preservation, status announcement와 retry/draft recovery를 포함합니다.",
    workflow: "critical task마다 fast/slow/offline/error fixture를 만들고 production-like artifact에서 keyboard와 assistive technology journey를 실행합니다. bottleneck을 Profiler/network timeline에 귀속한 뒤 state locality, selector, algorithm, route split을 최소 변경하며 loading/error/empty/stale/unknown-commit 상태의 label·focus·recovery action을 함께 재검증합니다.",
    invariants: "성능을 위해 accessible name/status를 제거하지 않고 skeleton이 focus target이나 content 의미를 속이지 않으며 offline에서 완료되지 않은 mutation을 성공으로 표시하지 않습니다. Error Boundary는 event/network error를 자동으로 잡는다고 가정하지 않습니다.",
    edgeCases: "IME rapid input, large list, zoom/reflow, reduced motion, screen-reader virtual cursor, chunk load failure, stale service worker, cache miss, reconnect conflict, background tab와 no-interaction metric을 포함합니다.",
    failureModes: "평균 Lighthouse 한 번이나 memo 사용 개수로 성능을 주장하면 실제 field tail을 놓치고, fallback만 추가하면 focus loss·retry loop·stale data로 task completion이 더 나빠질 수 있습니다.",
    verification: "field cohort와 controlled lab cohort, metric version, keyboard·focus·status assertions, axe와 manual review, Profiler attribution, bundle manifest, fault injection, reconnect reconciliation와 no-data-loss proof를 같은 release packet에 저장합니다.",
    operations: "route template, task class, metric bucket, failure code, recovery outcome와 release만 수집하고 raw query/content, DOM text, user/resource ID는 기록하지 않습니다.",
    concepts: [
      c("inclusive performance", "device·network·input 방식·보조 기술 차이를 포함해 task가 신속하고 이해 가능하게 끝나는 품질입니다.", ["속도와 접근성을 함께 봅니다.", "tail cohort를 숨기지 않습니다."]),
      c("degraded mode", "일부 dependency가 실패해도 가능한 기능과 데이터 freshness를 정직하게 제한하여 제공하는 상태입니다.", ["제한을 알립니다.", "복구 행동을 제공합니다."]),
      c("unknown commit", "client가 응답을 받지 못해 mutation이 server에 반영됐는지 확정할 수 없는 상태입니다.", ["무조건 retry하지 않습니다.", "idempotency 또는 조회로 합의합니다."]),
    ],
    codeExamples: [node(
      "react45-inclusive-budget",
      "cross-quality user task budget",
      "React45InclusiveBudget.mjs",
      "성능 수치와 keyboard/status/recovery evidence를 함께 통과시켜 부분 최적화가 출시되지 않게 합니다.",
      String.raw`const measured = { lcpMs: 2100, inpMs: 160, cls: 0.05 };
const budget = { lcpMs: 2500, inpMs: 200, cls: 0.1 };
const evidence = { keyboardComplete: true, focusPreserved: true, statusAnnounced: true, offlineRecovery: true };
const metricChecks = Object.keys(budget).map((key) => measured[key] <= budget[key]);
for (const key of Object.keys(evidence).sort()) console.log(key + "=" + (evidence[key] ? "pass" : "block"));
console.log("metrics=" + (metricChecks.every(Boolean) ? "pass" : "block"));
console.log("release=" + (metricChecks.every(Boolean) && Object.values(evidence).every(Boolean) ? "pass" : "block"));`,
      "focusPreserved=pass\nkeyboardComplete=pass\nofflineRecovery=pass\nstatusAnnounced=pass\nmetrics=pass\nrelease=pass",
      ["local-app01-vitals", "local-react-modern-roadmap", "react-profiler", "react-suspense", "wcag22"],
    )],
  }),
  appliedTopic({
    id: "privacy-observability-slo",
    title: "privacy-safe telemetry·SLO·error budget로 production truth를 운영합니다",
    lead: "console log와 client error dump가 아니라 어떤 사용자 outcome이 어느 release에서 실패하는지 최소 정보로 설명하고, SLO 위반이 release 속도와 개선 우선순위를 실제로 바꾸게 합니다.",
    mechanism: "critical journey의 availability/latency/correctness/recovery SLI를 정의하고 route template·release·browser/device/network cohort 같은 low-cardinality dimensions로 집계합니다. client correlation ID는 server trace와 연결하지만 identity나 content를 포함하지 않습니다. error budget은 허용 실패량이며 burn rate가 빠르면 canary 중단, rollback 또는 reliability work를 촉발합니다.",
    workflow: "data inventory와 purpose를 작성하고 event schema, consent/legal basis, redaction, sampling, cardinality, retention, access와 deletion을 승인합니다. synthetic probes와 field telemetry를 구분하고 dashboard→alert→runbook→owner→post-incident action의 폐쇄 루프를 rehearsal합니다.",
    invariants: "token, credential, raw URL/query, form value, free-form content, stack의 sensitive locals와 stable user/resource identifier를 telemetry에 넣지 않습니다. missing signal을 success로 계산하지 않고 client-only telemetry를 server correctness의 완전한 진실로 취급하지 않습니다.",
    edgeCases: "ad blocker, offline buffer, duplicate/reordered event, clock skew, bot traffic, very low traffic, partial telemetry outage, new error code, high-cardinality explosion과 deletion request를 포함합니다.",
    failureModes: "모든 것을 기록하면 유출 영향과 비용이 커지고 정작 action이 어려워지며, alert threshold만 있고 user-impact SLO나 owner가 없으면 noise 때문에 실제 incident를 놓칩니다.",
    verification: "schema allowlist tests, secret/PII canary strings, cardinality/volume budget, sampling bias, SLI query golden cases, alert fire/resolve, runbook execution, retention deletion과 access audit을 검증합니다.",
    operations: "SLO window와 error budget policy, burn-rate severity, on-call owner, incident communication, evidence retention과 postmortem follow-up 기한을 서비스 운영 계약으로 둡니다.",
    concepts: [
      c("SLI", "사용자 관점의 availability·latency·correctness 같은 품질을 수치로 측정하는 지표입니다.", ["측정 query가 명시됩니다.", "SLO의 근거입니다."]),
      c("error budget", "SLO 목표가 허용하는 실패량으로, 신뢰성과 변경 속도의 의사결정 기준입니다.", ["소진률을 봅니다.", "release policy와 연결합니다."]),
      c("cardinality", "telemetry dimension이 만들 수 있는 서로 다른 값 조합의 수입니다.", ["비용과 query 안정성에 영향 줍니다.", "raw identifiers를 피합니다."]),
    ],
    codeExamples: [node(
      "react45-error-budget",
      "SLO error budget and burn-rate model",
      "React45ErrorBudget.mjs",
      "synthetic request 집계에서 허용 실패와 실제 실패, budget 소진률을 계산합니다.",
      String.raw`const window = { total: 10000, good: 9993, objective: 0.999 };
const allowedBad = Math.floor(window.total * (1 - window.objective));
const actualBad = window.total - window.good;
const burn = actualBad / allowedBad;
console.log("allowed-bad=" + allowedBad);
console.log("actual-bad=" + actualBad);
console.log("burn=" + burn.toFixed(2));
console.log("policy=" + (burn <= 1 ? "within-budget" : "freeze"));
console.log("raw-identifiers-recorded=false");`,
      "allowed-bad=10\nactual-bad=7\nburn=0.70\npolicy=within-budget\nraw-identifiers-recorded=false",
      ["local-app01-vitals", "rfc9110", "owasp-logging"],
    )],
  }),
  appliedTopic({
    id: "release-canary-rollback",
    title: "immutable artifact를 canary로 승격하고 data·cache·session까지 rollback rehearsal합니다",
    lead: "배포 명령 성공이 아니라 검증된 artifact가 관찰 가능한 작은 cohort에서 안전하게 확대되고 실패 시 코드뿐 아니라 browser cache, chunk, session과 진행 중 mutation을 합의하는 데까지 release를 책임집니다.",
    mechanism: "build once/promote many artifact와 release manifest를 사용하고 pre-deploy compatibility, smoke, synthetic journey를 통과한 뒤 canary→staged ramp→full로 진행합니다. stop conditions는 security/a11y/correctness/performance/SLO를 함께 봅니다. rollback은 이전 immutable artifact, compatible API/schema, old chunk retention, cache invalidation과 unknown mutation reconciliation을 포함합니다.",
    workflow: "release checklist와 approver를 고정하고 canary cohort/기간/minimum volume을 선언합니다. 자동·수동 stop signal이 발생하면 traffic을 동결하고 rollback 또는 roll-forward를 선택하며 deep link, auth refresh, CRUD, offline reconnect와 mixed-version clients를 rehearsal한 결과를 저장합니다.",
    invariants: "같은 version tag 내용을 바꾸지 않고 untested rebuild를 rollback artifact로 사용하지 않으며 destructive data migration은 app rollback과 독립된 forward/compensation 전략을 갖습니다. telemetry outage 중에는 안전하다고 가정하지 않습니다.",
    edgeCases: "document와 chunk version skew, service worker cache, long-lived tab, in-flight mutation, API backward incompatibility, database expand/contract, CDN propagation, partial region failure와 emergency credential rotation을 포함합니다.",
    failureModes: "deploy 직후 homepage 200만 확인하면 authenticated deep link와 mutation failure를 놓치고, source rollback만 하면 이미 변경된 data/schema/cache 때문에 더 큰 장애가 생길 수 있습니다.",
    verification: "artifact/SBOM digest, signed approvals, compatibility matrix, staged smoke/E2E, canary SLI sample sufficiency, stop trigger, rollback time, mixed-version/session/cache/data reconciliation과 incident timeline을 확인합니다.",
    operations: "release ID, artifact digest, stage/cohort, decision reason, approver, start/stop/rollback timestamps와 safe aggregate outcomes를 audit trail에 남깁니다.",
    concepts: [
      c("canary release", "작은 실제 traffic cohort에서 새 artifact의 위험을 제한하며 관찰하는 배포 단계입니다.", ["명확한 stop 조건이 필요합니다.", "충분한 sample을 기다립니다."]),
      c("expand-contract migration", "old/new app이 동시에 동작하도록 schema를 먼저 확장하고 전환 후 오래된 shape를 제거하는 방식입니다.", ["rollback compatibility를 보존합니다.", "단계를 건너뛰지 않습니다."]),
      c("release reconciliation", "배포나 rollback 뒤 client·cache·session·server·data가 같은 truth에 도달하도록 확인하고 교정하는 과정입니다.", ["unknown mutation을 확인합니다.", "장기 탭을 고려합니다."]),
    ],
    codeExamples: [node(
      "react45-release-state",
      "staged release and rollback state machine",
      "React45ReleaseState.mjs",
      "모든 quality gate와 rollback evidence가 있을 때만 canary에서 full로 승격하는 deterministic state machine입니다.",
      String.raw`const evidence = {
  artifact: true, security: true, accessibility: true, performance: true,
  correctness: true, observability: true, rollback: true,
};
const required = Object.keys(evidence).sort();
const ready = required.every((key) => evidence[key]);
const stages = ready ? ["validated", "canary", "ramp", "full"] : ["blocked"];
console.log("required=" + required.join(","));
console.log("missing=" + (required.filter((key) => !evidence[key]).join(",") || "none"));
console.log("stages=" + stages.join("->"));
console.log("rollback-rehearsed=" + evidence.rollback);`,
      "required=accessibility,artifact,correctness,observability,performance,rollback,security\nmissing=none\nstages=validated->canary->ramp->full\nrollback-rehearsed=true",
      ["vite-build", "vite-deploy", "rfc9111", "html-history", "url-standard"],
    )],
  }),
  appliedTopic({
    id: "portfolio-evidence-defense",
    title: "코드·결과·판단·한계를 portfolio-ready evidence packet으로 방어합니다",
    lead: "완성 화면을 나열하는 포트폴리오가 아니라 문제 정의부터 architecture, threat, test, inclusive performance, 운영과 rollback까지 어떤 선택을 왜 했고 무엇으로 증명했는지 독자가 중간 절부터 읽어도 재현할 수 있게 만듭니다.",
    mechanism: "최상위 README는 audience별 빠른 길, learning goals, sanitized demo와 evidence index를 제공합니다. architecture diagram/ADR, API/error contract, threat model, test traceability/report, accessibility statement, performance baseline, observability/SLO, release manifest와 rollback runbook이 stable IDs로 상호 링크됩니다. 모든 숫자는 environment·commit·artifact·date와 limitation을 동반합니다.",
    workflow: "대표 journey마다 challenge→constraints→options→decision→implementation→verification→operation→reflection narrative를 작성합니다. code excerpt는 최소화하고 실제 executable command와 exact expected outcome, screenshot/trace provenance, failure demonstration과 개선 전후 evidence를 제공하며 공개 전에 secret/identity/domain/license를 점검합니다.",
    invariants: "하지 않은 일을 완료했다고 쓰지 않고 Node model을 실제 browser/server proof로 오해시키지 않으며 개인/운영 endpoint, credential/token, 사용자 content와 내부 identifiers를 공개하지 않습니다. 오래된 학습 방식은 당시 맥락과 current replacement를 함께 적습니다.",
    edgeCases: "offline reader, deep-linked section, screen-reader navigation, code version drift, unavailable demo backend, expired screenshot, third-party license, recruiter의 짧은 검토와 면접관의 깊은 질문을 모두 고려합니다.",
    failureModes: "README에 기술 이름과 screenshot만 늘어놓으면 engineering judgment와 reproducibility가 보이지 않고, limitation을 숨기면 한 질문으로 전체 신뢰가 무너집니다.",
    verification: "fresh clone build/test commands, internal/external link checker, sourceRef missing/unused scan, example exact stdout, heading/landmark/keyboard audit, asset alt text, secret/domain scan, evidence date/digest와 independent reviewer defense rehearsal을 수행합니다.",
    operations: "문서 owner와 review cadence, dependency/runtime change trigger, broken-link monitor, demo status, artifact retention과 archive policy를 정해 포트폴리오도 유지되는 product로 운영합니다.",
    concepts: [
      c("evidence packet", "주장마다 구현·test·measurement·operation artifact와 limitation을 연결한 검증 가능한 문서 묶음입니다.", ["면접 질문에 근거로 답합니다.", "독립 재현이 가능합니다."]),
      c("progressive disclosure", "짧은 overview에서 깊은 원리와 raw evidence로 단계적으로 이동하도록 정보를 조직하는 방식입니다.", ["중간 진입을 지원합니다.", "중복 설명과 링크를 균형 있게 씁니다."]),
      c("defense rehearsal", "제약·대안·실패·tradeoff를 제3자의 반론에 근거로 설명해 보는 검토입니다.", ["과장을 찾습니다.", "학습의 깊이를 확인합니다."]),
    ],
    codeExamples: [node(
      "react45-portfolio-gate",
      "production capstone evidence completeness gate",
      "React45PortfolioGate.mjs",
      "전체 capstone 주장에 필요한 공개 evidence와 redaction을 최종 판정합니다.",
      String.raw`const evidence = {
  inventory: true, architecture: true, build: true, tests: true, security: true,
  accessibility: true, performance: true, observability: true, release: true,
  rollback: true, limitations: true, reproducible: true,
};
const required = Object.keys(evidence).sort();
const missing = required.filter((key) => evidence[key] !== true);
console.log("evidence-count=" + required.length);
console.log("missing=" + (missing.join(",") || "none"));
console.log("private-values-copied=false");
console.log("portfolio=" + (missing.length === 0 ? "ready" : "block"));`,
      "evidence-count=12\nmissing=none\nprivate-values-copied=false\nportfolio=ready",
      localAuditRefs.concat(officialRefs),
    )],
  }),
];

const sources: SessionSource[] = [
  {
    id: "local-react-intro", repository: "D:/dev/REACT", path: "docs/react/01-intro-setup.md",
    usedFor: ["React learning setup history", "CRA-era baseline and current migration context"],
    evidence: "2026-07-14 read-only sanitized audit: 166 lines, 8,577 bytes, SHA-256 F5606F52A72C9BE700F1F8F44C189E1848D4825292E20F14694033D47AE7C6B4. actual local paths, user values와 URLs는 복사하지 않았습니다.",
  },
  {
    id: "local-react-router", repository: "D:/dev/REACT", path: "docs/react/08-router.md",
    usedFor: ["router learning provenance", "navigation and route architecture baseline"],
    evidence: "2026-07-14 read-only sanitized audit: 107 lines, 5,551 bytes, SHA-256 5D1D686C17CD50FF6FF7ADFD5AD41DA9715DB9C8674059523378422DED643541. actual routes와 URL values는 복사하지 않았습니다.",
  },
  {
    id: "local-react-network", repository: "D:/dev/REACT", path: "docs/react/09-fetch-axios.md",
    usedFor: ["network learning provenance", "HTTP/loading/error contract baseline"],
    evidence: "2026-07-14 read-only sanitized audit: 108 lines, 4,797 bytes, SHA-256 3A5B8BF21C44D86E331AED7A8B6E554E3B2F65FA91D576A48CFBFF22679F3507. actual endpoints, domains와 payload values는 복사하지 않았습니다.",
  },
  {
    id: "local-react-zustand", repository: "D:/dev/REACT", path: "docs/react/10-zustand-basics.md",
    usedFor: ["client state learning provenance", "state ownership and selector baseline"],
    evidence: "2026-07-14 read-only sanitized audit: 134 lines, 6,356 bytes, SHA-256 36F89869EA061A9A77710A84CB8B43AD157E1DC8510B08FE7D15CC286B877C6D. actual store keys와 sample values는 복사하지 않았습니다.",
  },
  {
    id: "local-react-auth-crud", repository: "D:/dev/REACT", path: "docs/react/11-zustand-auth-crud.md",
    usedFor: ["auth and CRUD learning provenance", "client/server security boundary gap"],
    evidence: "2026-07-14 read-only sanitized audit: 115 lines, 5,909 bytes, SHA-256 8B2C3D04101D66DBCE4489268A1C91D8A79C4D205C4832289A069629B77156F7. actual identity, credential/token, route, endpoint와 data values는 복사하지 않았습니다.",
  },
  {
    id: "local-react-modern-roadmap", repository: "D:/dev/REACT", path: "docs/react/12-modern-react-roadmap.md",
    usedFor: ["CRA history preservation and modern roadmap", "testing, accessibility, performance and deployment gap inventory"],
    evidence: "2026-07-14 read-only sanitized audit: 204 lines, 9,672 bytes, SHA-256 123B645573BF48E3FC576514D2A7EDC4F80D56702BD23D79F75072167D959DAD. actual local/demo URLs와 domain strings는 복사하지 않았습니다.",
  },
  {
    id: "local-app01-package", repository: "D:/dev/REACT", path: "code/react/01-basics-my-app01/package.json",
    usedFor: ["app01 dependency/runtime snapshot", "clean build and migration provenance"],
    evidence: "2026-07-14 read-only sanitized audit: 44 lines, 1,052 bytes, SHA-256 95D4B6AFFC94A53A78615268C6A2BB901C2B1CA916966F914BFBA17DB98BCD0B. package metadata와 dependency shape만 사용했습니다.",
  },
  {
    id: "local-app02-package", repository: "D:/dev/my-app02", path: "package.json",
    usedFor: ["app02 dependency/runtime snapshot", "test/build migration provenance"],
    evidence: "2026-07-14 read-only sanitized audit: 41 lines, 910 bytes, SHA-256 98987F42DF8262D135362B6AC2E5187CE67F3BDFF295A8EC62405A8B0CAF4E8E. package metadata와 dependency shape만 사용했습니다.",
  },
  {
    id: "local-app03-package", repository: "D:/dev/my-app03", path: "package.json",
    usedFor: ["app03 dependency/runtime snapshot", "router/auth/CRUD migration provenance"],
    evidence: "2026-07-14 read-only sanitized audit: 42 lines, 976 bytes, SHA-256 00C58E0456AE908D84C6DA0DA918D2D29CB3293ED3FD0BAA5258D8EDC1167E9B. package metadata와 dependency shape만 사용했습니다.",
  },
  {
    id: "local-app01-app", repository: "D:/dev/REACT", path: "code/react/01-basics-my-app01/src/App.js",
    usedFor: ["large learning-gallery composition", "capstone decomposition provenance"],
    evidence: "2026-07-14 read-only sanitized audit: 64 lines, 2,593 bytes, SHA-256 A74CF035261424CEB448C27FBC7CD5DF747D72D615BCE24BB3BC26B52E3998E1. actual UI text, routes와 values는 복사하지 않았습니다.",
  },
  {
    id: "local-app02-app", repository: "D:/dev/my-app02", path: "src/App.js",
    usedFor: ["app02 runtime composition", "component/router integration provenance"],
    evidence: "2026-07-14 read-only sanitized audit: 30 lines, 880 bytes, SHA-256 5FF7DE7AFDC11D4413421A26FE137A064A382FC0ECDA21C5C6AB48B934665150. actual routes, content와 identifiers는 복사하지 않았습니다.",
  },
  {
    id: "local-app03-app", repository: "D:/dev/my-app03", path: "src/App.js",
    usedFor: ["app03 route/auth composition", "production boundary and migration provenance"],
    evidence: "2026-07-14 read-only sanitized audit: 45 lines, 1,624 bytes, SHA-256 ABD82125C323391DC7E6FF98DDF47509470F5351B9CE01A16FDE1BEB38469A08. actual routes, storage keys, identity와 endpoint values는 복사하지 않았습니다.",
  },
  {
    id: "local-app01-test", repository: "D:/dev/REACT", path: "code/react/01-basics-my-app01/src/App.test.js",
    usedFor: ["existing interaction-test evidence", "test traceability baseline"],
    evidence: "2026-07-14 read-only sanitized audit: 20 lines, 721 bytes, SHA-256 603CA0C1FF2ECA80431D199509B9C047FA5B5F0594ABACAB1561367FC90D253C. actual UI text, route와 live data values는 복사하지 않았습니다.",
  },
  {
    id: "local-app02-test", repository: "D:/dev/my-app02", path: "src/App.test.js",
    usedFor: ["scaffold placeholder test evidence", "real contract-test replacement gap"],
    evidence: "2026-07-14 read-only sanitized audit: 8 lines, 246 bytes, SHA-256 F7784693194B8657D1BF70C37EA70F4A2D694C4566EC41550A8E650EB600AAA4. placeholder structure만 사용했습니다.",
  },
  {
    id: "local-app03-test", repository: "D:/dev/my-app03", path: "src/App.test.js",
    usedFor: ["scaffold placeholder test evidence", "auth/CRUD/router test replacement gap"],
    evidence: "2026-07-14 read-only sanitized audit: 8 lines, 254 bytes, SHA-256 78EB8F13A8B8CBDCD6F25554F77111A90C9B1E5C128CF84B003C6A821A7F67E5. placeholder structure만 사용했습니다.",
  },
  {
    id: "local-app01-vitals", repository: "D:/dev/REACT", path: "code/react/01-basics-my-app01/src/reportWebVitals.js",
    usedFor: ["legacy metric callback provenance", "current production observability gap"],
    evidence: "2026-07-14 read-only sanitized audit: 13 lines, 362 bytes, SHA-256 714851669856152806C289F9AAC6240B414BBAC50C60EE4F7E6247F31EAC0C1C. metric names와 callback structure만 사용했습니다.",
  },
  {
    id: "react-creating-app", repository: "React official documentation", path: "learn/creating-a-react-app",
    publicUrl: "https://react.dev/learn/creating-a-react-app",
    usedFor: ["current React app creation and framework/build-tool choices"],
    evidence: "React 공식 현행 application creation guidance입니다.",
  },
  {
    id: "react-cra-sunset", repository: "React official blog", path: "2025/02/14/sunsetting-create-react-app",
    publicUrl: "https://react.dev/blog/2025/02/14/sunsetting-create-react-app",
    usedFor: ["Create React App deprecation and migration context"],
    evidence: "React 공식 Create React App sunsetting announcement입니다.",
  },
  {
    id: "react-state-structure", repository: "React official documentation", path: "learn/choosing-the-state-structure",
    publicUrl: "https://react.dev/learn/choosing-the-state-structure",
    usedFor: ["minimal state and single ownership principles"],
    evidence: "React 공식 state structure guidance입니다.",
  },
  {
    id: "react-effects", repository: "React official documentation", path: "learn/synchronizing-with-effects",
    publicUrl: "https://react.dev/learn/synchronizing-with-effects",
    usedFor: ["external synchronization and Effect boundary"],
    evidence: "React 공식 Effect synchronization guidance입니다.",
  },
  {
    id: "react-strict-mode", repository: "React official documentation", path: "reference/react/StrictMode",
    publicUrl: "https://react.dev/reference/react/StrictMode",
    usedFor: ["development checks and repeatable side-effect diagnosis"],
    evidence: "React 공식 현행 StrictMode API 문서입니다.",
  },
  {
    id: "react-profiler", repository: "React official documentation", path: "reference/react/Profiler",
    publicUrl: "https://react.dev/reference/react/Profiler",
    usedFor: ["render/commit performance evidence"],
    evidence: "React 공식 현행 Profiler API 문서입니다.",
  },
  {
    id: "react-suspense", repository: "React official documentation", path: "reference/react/Suspense",
    publicUrl: "https://react.dev/reference/react/Suspense",
    usedFor: ["loading boundary and reveal semantics"],
    evidence: "React 공식 현행 Suspense API 문서입니다.",
  },
  {
    id: "react-act", repository: "React official documentation", path: "reference/react/act",
    publicUrl: "https://react.dev/reference/react/act",
    usedFor: ["test update and assertion synchronization"],
    evidence: "React 공식 현행 act test helper 문서입니다.",
  },
  {
    id: "react-router-modes", repository: "React Router official documentation", path: "start/modes",
    publicUrl: "https://reactrouter.com/start/modes",
    usedFor: ["router framework/data/declarative mode selection"],
    evidence: "React Router 공식 현행 mode guidance입니다.",
  },
  {
    id: "react-router-route-object", repository: "React Router official documentation", path: "start/data/route-object",
    publicUrl: "https://reactrouter.com/start/data/route-object",
    usedFor: ["route object, loader/action and error boundary architecture"],
    evidence: "React Router 공식 현행 route-object guidance입니다.",
  },
  {
    id: "vite-guide", repository: "Vite official documentation", path: "guide",
    publicUrl: "https://vite.dev/guide/",
    usedFor: ["current Vite project and runtime baseline"],
    evidence: "Vite 공식 현행 guide입니다.",
  },
  {
    id: "vite-build", repository: "Vite official documentation", path: "guide/build",
    publicUrl: "https://vite.dev/guide/build",
    usedFor: ["production build, chunks, base path and artifact behavior"],
    evidence: "Vite 공식 현행 production build 문서입니다.",
  },
  {
    id: "vite-env", repository: "Vite official documentation", path: "guide/env-and-mode",
    publicUrl: "https://vite.dev/guide/env-and-mode",
    usedFor: ["browser-exposed environment configuration"],
    evidence: "Vite 공식 현행 env and mode 문서입니다.",
  },
  {
    id: "vite-deploy", repository: "Vite official documentation", path: "guide/static-deploy",
    publicUrl: "https://vite.dev/guide/static-deploy",
    usedFor: ["static deployment, CI and public base qualification"],
    evidence: "Vite 공식 현행 static deployment guidance입니다.",
  },
  {
    id: "rtl-guiding", repository: "Testing Library official documentation", path: "docs/guiding-principles",
    publicUrl: "https://testing-library.com/docs/guiding-principles",
    usedFor: ["user-centered semantic test design"],
    evidence: "Testing Library 공식 guiding principles입니다.",
  },
  {
    id: "playwright-intro", repository: "Playwright official documentation", path: "docs/intro",
    publicUrl: "https://playwright.dev/docs/intro",
    usedFor: ["real-browser E2E setup and execution"],
    evidence: "Playwright 공식 현행 introduction입니다.",
  },
  {
    id: "playwright-best-practices", repository: "Playwright official documentation", path: "docs/best-practices",
    publicUrl: "https://playwright.dev/docs/best-practices",
    usedFor: ["test isolation, locators, web-first assertions and CI practice"],
    evidence: "Playwright 공식 현행 best practices입니다.",
  },
  {
    id: "wcag22", repository: "W3C Web Content Accessibility Guidelines", path: "WCAG22",
    publicUrl: "https://www.w3.org/TR/WCAG22/",
    usedFor: ["keyboard, focus, name, status, reflow and motion requirements"],
    evidence: "W3C Recommendation인 WCAG 2.2입니다.",
  },
  {
    id: "url-standard", repository: "WHATWG URL Standard", path: "URL",
    publicUrl: "https://url.spec.whatwg.org/",
    usedFor: ["URL parsing, serialization and safe navigation semantics"],
    evidence: "WHATWG Living Standard의 URL 규범입니다.",
  },
  {
    id: "fetch-standard", repository: "WHATWG Fetch Standard", path: "Fetch",
    publicUrl: "https://fetch.spec.whatwg.org/",
    usedFor: ["request, response, network and abort behavior"],
    evidence: "WHATWG Living Standard의 Fetch 규범입니다.",
  },
  {
    id: "html-history", repository: "WHATWG HTML Living Standard", path: "nav-history-apis.html",
    publicUrl: "https://html.spec.whatwg.org/multipage/nav-history-apis.html",
    usedFor: ["session history and SPA navigation behavior"],
    evidence: "WHATWG HTML Living Standard의 navigation and session history 규범입니다.",
  },
  {
    id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html",
    publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html",
    usedFor: ["HTTP method, status and semantics contracts"],
    evidence: "HTTP Semantics 표준입니다.",
  },
  {
    id: "rfc9111", repository: "IETF RFC 9111", path: "rfc9111.html",
    publicUrl: "https://www.rfc-editor.org/rfc/rfc9111.html",
    usedFor: ["HTTP caching, freshness and invalidation contracts"],
    evidence: "HTTP Caching 표준입니다.",
  },
  {
    id: "rfc9457", repository: "IETF RFC 9457", path: "rfc9457.html",
    publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html",
    usedFor: ["machine-readable safe HTTP API problem details"],
    evidence: "Problem Details for HTTP APIs 표준입니다.",
  },
  {
    id: "owasp-asvs", repository: "OWASP Application Security Verification Standard", path: "www-project-application-security-verification-standard",
    publicUrl: "https://owasp.org/www-project-application-security-verification-standard/",
    usedFor: ["production security control and verification baseline"],
    evidence: "OWASP 공식 ASVS project guidance입니다.",
  },
  {
    id: "owasp-authorization", repository: "OWASP Cheat Sheet Series", path: "Authorization_Cheat_Sheet.html",
    publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html",
    usedFor: ["deny-by-default and per-request authorization design"],
    evidence: "OWASP 공식 authorization guidance입니다.",
  },
  {
    id: "owasp-input-validation", repository: "OWASP Cheat Sheet Series", path: "Input_Validation_Cheat_Sheet.html",
    publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html",
    usedFor: ["server canonical input validation and allowlisting"],
    evidence: "OWASP 공식 input validation guidance입니다.",
  },
  {
    id: "owasp-logging", repository: "OWASP Cheat Sheet Series", path: "Logging_Cheat_Sheet.html",
    publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html",
    usedFor: ["privacy-safe security and operational logging"],
    evidence: "OWASP 공식 logging guidance입니다.",
  },
  {
    id: "owasp-secrets", repository: "OWASP Cheat Sheet Series", path: "Secrets_Management_Cheat_Sheet.html",
    publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html",
    usedFor: ["secret lifecycle, storage, access and rotation"],
    evidence: "OWASP 공식 secrets management guidance입니다.",
  },
];

const session = createExpertSession({
  inventoryId: "react-45-production-capstone",
  slug: "react-45-production-capstone",
  courseId: "react",
  moduleId: "react-integrated-app-quality",
  order: 5,
  title: "React production capstone",
  subtitle: "my-app01~03와 REACT 학습 이력을 sanitized evidence로 보존하고 architecture·build·test·security·접근성·성능·관측성·release·rollback을 하나의 production portfolio로 완성합니다.",
  level: "전문가",
  estimatedMinutes: 165,
  coreQuestion: "여러 세대의 React 학습 코드와 문서를 지우거나 과장하지 않으면서, 실제 사용자가 신뢰할 수 있고 면접과 운영에서 근거로 방어 가능한 production application으로 어떻게 통합할까요?",
  summary: "REACT docs 여섯 파일, my-app01~03 package/App/test와 app01 reportWebVitals까지 열여섯 local files를 read-only로 감사했습니다. src/docs inventory는 168 files·299,032 bytes이며 actual routes, DOM identifiers, users, contents, credentials/tokens, storage keys, endpoints/domains는 공개 content에 복사하지 않았습니다. CRA-era learning history와 app별 version 차이를 숨기지 않고 current React·React Router·Vite·Testing Library·Playwright·W3C·WHATWG·IETF·OWASP 근거로 target architecture, incremental migration, reproducible supply chain, server-enforced auth/CRUD security, traceable tests, inclusive performance/resilience, privacy SLO, staged release/rollback과 portfolio defense를 열 executable Node models에 연결합니다.",
  objectives: [
    "my-app01~03와 REACT docs를 exact digest가 있는 sanitized capability inventory로 만든다.",
    "UI·state·router·network·server trust boundary와 dependency rule을 ADR로 고정한다.",
    "CRA 학습 이력을 보존하면서 current Vite/framework target으로 parity 기반 점진 이행한다.",
    "lockfile·public configuration·secret·SBOM·immutable artifact를 재현 가능한 build chain으로 운영한다.",
    "auth·CRUD를 object/function authorization, canonical validation과 safe HTTP error contract로 강화한다.",
    "requirement와 unit/component/contract/E2E/a11y/security evidence의 양방향 traceability를 만든다.",
    "performance·WCAG·error/offline recovery를 하나의 사용자 task outcome으로 검증한다.",
    "privacy-safe telemetry, SLI/SLO, error budget와 incident runbook을 설계한다.",
    "canary release와 code/data/cache/session rollback을 실제로 rehearsal한다.",
    "README·ADR·threat model·reports·runbook·limitations를 재현 가능한 portfolio evidence packet으로 방어한다.",
  ],
  prerequisites: [{
    title: "성능·접근성·error resilience",
    reason: "current field metrics, bundle/render work, accessible recovery, offline reconciliation와 privacy-safe canary/rollback을 알아야 capstone의 cross-quality release evidence를 완성할 수 있습니다.",
    sessionSlug: "react-44-performance-accessibility-resilience",
  }],
  keywords: [
    "React production", "capstone", "evidence inventory", "ADR", "trust boundary", "state ownership",
    "CRA migration", "Vite", "immutable artifact", "SBOM", "authorization", "Problem Details",
    "test traceability", "WCAG 2.2", "Web Vitals", "SLO", "error budget", "canary", "rollback", "portfolio",
  ],
  topics,
  lab: {
    title: "my-app01~03 production portfolio qualification",
    scenario: "원본 REACT/my-app01~03는 read-only로 유지하고 synthetic identity/content와 disposable API를 사용해 representative authenticated CRUD journey를 current runtime target으로 점진 이행한 뒤 architecture부터 rollback까지 하나의 evidence packet으로 검증합니다.",
    setup: [
      "Node.js current supported runtime과 locked package manager",
      "fresh-clone old CRA artifacts와 separate current Vite/framework target",
      "synthetic deterministic fixtures, clocks, IDs와 disposable server/database",
      "React Testing Library/user-event, contract integration harness와 Playwright browsers",
      "production build analyzer, Profiler/current Web Vitals collector와 accessibility tools",
      "privacy-safe local telemetry/SLO dashboard fixture와 staged release simulator",
      "artifact/SBOM/digest store, canary and rollback runbook",
      "REACT docs와 my-app01~03 원본 read-only checkout",
    ],
    steps: [
      "열여섯 representative files의 lines·bytes·SHA-256와 네 source group 168 files·299,032 bytes inventory를 재확인하고 private-value redaction manifest를 만듭니다.",
      "critical journeys와 trust/state/runtime boundaries를 diagram, dependency rule, API/error contract와 ADR로 작성합니다.",
      "기존 production-like build/test baseline을 freeze하고 target runtime shell과 migration waves, parity criteria와 rollback artifact를 선언합니다.",
      "lockfile 기반 clean build, env allowlist/schema, secret scan, SBOM/license review와 immutable artifact digest를 생성합니다.",
      "anonymous/expired/foreign-object/invalid/oversized/replay/XSS/open-redirect abuse cases를 server-enforced auth/CRUD contract tests에 추가합니다.",
      "requirement IDs를 unit/component/contract/E2E/a11y/security tests와 연결하고 orphan/placeholder/flake를 제거합니다.",
      "large/slow/offline/error 조건에서 Profiler·bundle·Web Vitals와 keyboard/focus/status/recovery evidence를 함께 수집합니다.",
      "telemetry schema redaction/cardinality/retention, SLI query, SLO/error budget, alert와 incident runbook을 rehearsal합니다.",
      "validated artifact를 canary→ramp→full state machine으로 승격하고 chunk/cache/session/in-flight mutation/data rollback을 실행합니다.",
      "fresh clone commands, README deep links, ADR/threat/test/a11y/performance/SLO/release/rollback reports와 explicit limitations를 독립 reviewer 앞에서 방어합니다.",
    ],
    expectedResult: [
      "모든 공개 주장이 exact source provenance, executable test/measurement 또는 명시된 limitation과 연결됩니다.",
      "current runtime target이 old learning behavior의 승인된 parity를 유지하면서 server authorization, accessibility와 failure recovery를 강화합니다.",
      "동일 lockfile/commit으로 검증된 immutable artifact와 SBOM이 생성되고 browser bundle에는 허용된 public configuration만 들어갑니다.",
      "synthetic normal/negative/slow/offline journeys가 deterministic하게 재현되고 privacy-safe SLO와 canary stop 조건에 반영됩니다.",
      "code뿐 아니라 chunk/cache/session/in-flight mutation/data를 포함한 rollback 뒤 시스템 truth가 합의됩니다.",
      "처음부터 읽지 않아도 각 portfolio section이 prerequisite link, 용어 설명, 실행 명령, 결과와 근거로 독립 이해됩니다.",
    ],
    cleanup: [
      "disposable server/database, synthetic accounts/data, test browser contexts, timers/listeners와 temporary credentials를 폐기합니다.",
      "temporary builds, source maps, traces, screenshots, logs와 telemetry buffers를 retention/redaction policy에 따라 제거합니다.",
      "canary flags, proxy/service-worker/cache와 staged release simulator를 초기 상태로 되돌립니다.",
      "원본 REACT/my-app01~03의 exact hashes와 git status unchanged를 확인하고 capstone repository artifact만 보존합니다.",
    ],
    extensions: [
      "SSR/streaming/React Server Components framework target과 static SPA target의 security·performance·operation tradeoff ADR을 비교합니다.",
      "software provenance signing, dependency policy와 automated SBOM/vulnerability diff를 release gate에 추가합니다.",
      "real assistive-technology matrix와 low-end device/network field cohort qualification을 확장합니다.",
      "chaos drill에서 API partial outage, CDN/chunk skew, telemetry loss, schema migration과 credential rotation을 함께 rehearsal합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "열 Node examples를 실행하고 각 model을 실제 source/build/browser/server/operation evidence와 대응시키세요.",
      requirements: [
        "stdout 완전 일치", "168-file sanitized inventory", "dependency rule", "migration waves",
        "public env gate", "authorization matrix", "traceability gate", "inclusive budget",
        "error budget", "release state", "portfolio gate", "Node model 한계 설명",
      ],
      hints: ["Node 계산은 실제 React rendering, browser navigation, server authorization, assistive technology, field telemetry, deploy와 rollback을 증명하지 않으므로 lab evidence가 반드시 필요합니다."],
      expectedOutcome: "source provenance부터 portfolio defense까지 각 evidence의 owner, fidelity와 limitation을 설명합니다.",
      solutionOutline: ["inventory→architect→migrate/build→secure/test→qualify/observe→release/defend 순서로 연결합니다."],
    },
    {
      difficulty: "응용",
      prompt: "my-app03의 대표 authenticated CRUD journey 하나를 current production target으로 점진 이행하고 release packet을 완성하세요.",
      requirements: [
        "read-only provenance와 ADR", "old/new parity and rollback", "immutable artifact/SBOM/env schema",
        "server authorization/validation", "component/contract/E2E negatives", "keyboard/focus/status",
        "Profiler/current Web Vitals budgets", "offline/unknown-commit recovery", "privacy SLO",
        "canary stop/rollback rehearsal", "fresh-clone portfolio narrative",
      ],
      hints: ["client store의 로그인 상태와 route guard를 server authorization evidence로 계산하지 마세요."],
      expectedOutcome: "정상 화면뿐 아니라 공격·실패·느린 환경·배포 되돌림까지 재현 가능한 production slice가 완성됩니다.",
      solutionOutline: ["freeze contract→threat/ADR→strangle slice→negative tests→inclusive qualification→canary/reconcile→document 순서입니다."],
    },
    {
      difficulty: "설계",
      prompt: "my-app01~03 학습 자산 전체를 유지보수 가능한 공개 React production portfolio program으로 운영하는 governance를 작성하세요.",
      requirements: [
        "sanitized provenance policy", "target architecture and dependency enforcement", "runtime/dependency migration cadence",
        "build/SBOM/secrets", "security and HTTP contracts", "test traceability/flake policy",
        "WCAG/performance/resilience budgets", "privacy telemetry/SLO/incident", "release/data rollback",
        "docs ownership, link drift, demo status and defense review",
      ],
      hints: ["기술 목록이나 단일 품질 점수 대신 사용자 outcome과 reproducible evidence로 승인 규칙을 만드세요."],
      expectedOutcome: "학습 history와 current production practice가 충돌하지 않고, drift가 자동 탐지되며, 모든 주장이 근거와 limitation을 갖습니다.",
      solutionOutline: ["classify evidence→assign ownership→define gates→automate verification→operate incidents/releases→review narrative 순서입니다."],
    },
  ],
  nextSessions: ["security-01-filter-chain-request-boundary"],
  sources,
  sourceCoverage: {
    filesRead: 16,
    filesUsed: 16,
    uncoveredNotes: [
      "REACT docs 여섯 파일과 my-app01~03 package/App/test, app01 reportWebVitals를 read-only로 읽고 exact lines·bytes·SHA-256를 기록했습니다.",
      "src/docs inventory는 app01 114 files·126,089 bytes, app02 17·26,047, app03 24·57,668, docs 13·89,228로 총 168 files·299,032 bytes입니다.",
      "app01의 제한된 interaction tests와 app02/03의 scaffold placeholder tests를 구분했으며 전체 production contract coverage가 이미 있다고 주장하지 않습니다.",
      "세 package snapshots와 CRA-era 문서를 current runtime으로 오해하지 않고 학습 history로 보존하며 current React/Vite/framework migration은 proposed target으로 명시했습니다.",
      "actual routes, DOM/storage identifiers, users, contents, credentials/tokens, endpoints/domains, metric attribution과 environment values는 공개 content에 복사하지 않았습니다.",
      "Node models는 actual React/browser/server/auth/accessibility/field telemetry/build/deploy/rollback을 대체하지 않으므로 production-like integration lab을 요구합니다.",
    ],
  },
});

export default session;
