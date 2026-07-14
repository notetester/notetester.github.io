import type { SessionSource } from "../../types";
import { appliedTopic, concept, nodeExample } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const topics: ExpertTopic[] = [
  appliedTopic({
    id: "local-credential-provenance",
    title: "로컬 BCrypt 사용 증거와 UserDetailsService 부재를 함께 기록합니다",
    lead: "있는 코드를 자세히 읽는 것만큼 없는 기능을 없다고 명시하는 일이 안전한 학습 자료의 출발점입니다.",
    mechanism: "로컬 AppConfig와 BCryptConfig에는 PasswordEncoder bean 구조가 있고 회원·방명록 흐름에는 encode 또는 matches 사용이 보입니다. 그러나 조사한 대상에서는 UserDetailsService 구현, loadUserByUsername 또는 DaoAuthenticationProvider 구성 증거를 찾지 못했으므로 이 세션은 local BCrypt snapshot과 공식 authentication 계약을 분리합니다.",
    workflow: "selected file마다 경로·line·byte·SHA-256을 고정하고 bean type, encode/matches call과 저장 경계 같은 구조만 inventory합니다. build.gradle과 pom은 선언된 framework 세대의 단서로 쓰되 resolved dependency report가 없으면 Spring Security patch와 runtime algorithm parameter를 단정하지 않습니다.",
    invariants: "local claim은 선택한 source에서 관찰 가능하고 official semantic claim은 현재 reference/Javadoc에 연결됩니다. password, encoded hash, username, email, endpoint와 configuration value는 source에서 공개 예제로 복사하지 않으며 synthetic identity만 사용합니다.",
    edgeCases: "같은 BCryptPasswordEncoder라도 strength·SecureRandom·library version이 다를 수 있고 bean이 실제 authentication provider에 연결되지 않았을 수 있습니다. test profile, duplicate bean, manual new 호출과 legacy hash migration도 별도 확인합니다.",
    failureModes: "encode 호출 하나만 보고 안전한 credential lifecycle이 완성됐다고 쓰면 lookup, matching, account state, rate limit, reset과 upgrade가 사라집니다. 반대로 UserDetailsService가 없다는 이유로 local hashing 근거까지 버리면 학습 progression을 잃습니다.",
    verification: "hash fingerprint를 재계산하고 secret-shaped fixture가 문서·stdout·git diff에 0건인지 검사합니다. disposable supported-version project에서 공식 UserDetailsService와 provider flow를 별도 실행해 local code와 혼동하지 않은 채 gap을 채웁니다.",
    operations: "dependency report, encoder id·cost policy, migration coverage와 local provenance를 release별 manifest로 유지합니다. source drift가 생기면 새 해시를 자동 승인하지 않고 owner가 구조 변화와 문서 claim을 대조합니다.",
    concepts: [
      concept("negative evidence", "조사 범위에서 특정 구현을 찾지 못했다는 범위가 명시된 결과입니다.", ["전체 부재를 과장하지 않습니다.", "검색 범위와 pattern을 기록합니다."]),
      concept("credential provenance", "password 처리 설명이 어느 bean·call structure와 공식 계약에 근거하는지의 추적 정보입니다.", ["실제 hash를 포함하지 않습니다.", "version 범위를 둡니다."]),
      concept("implementation gap", "학습할 공식 메커니즘과 local source가 실제로 구현한 범위 사이의 차이입니다.", ["숨기지 않고 lab로 보완합니다.", "portfolio claim과 분리합니다."]),
    ],
    codeExamples: [
      nodeExample("sec02-evidence-gate", "credential claim provenance gate", "security02-evidence.mjs", "로컬 증거가 있는 BCrypt 사용과 없는 UserDetailsService claim을 다르게 분류합니다.", `const claims = [
  { id: "encoder-bean", local: true, official: true, sensitive: false },
  { id: "encode-matches", local: true, official: true, sensitive: false },
  { id: "local-userdetails-service", local: false, official: true, sensitive: false },
  { id: "copied-hash", local: true, official: false, sensitive: true }
];
for (const claim of claims) {
  const state = claim.sensitive ? "BLOCKED" : claim.local ? "OBSERVED" : "OFFICIAL-ONLY";
  console.log(claim.id + "=" + state);
}
console.log("secret-values=0");`, "encoder-bean=OBSERVED\nencode-matches=OBSERVED\nlocal-userdetails-service=OFFICIAL-ONLY\ncopied-hash=BLOCKED\nsecret-values=0", ["local-app-config", "local-members-controller", "local-guestbook-service", "local-bcrypt-config", "local-member-controller", "local-build-current", "local-springmvc-pom", "spring-userdetails-reference"]),
    ],
    expertNotes: ["검색에서 발견하지 못한 사실은 지정된 snapshot 범위의 negative evidence입니다.", "local BCrypt use와 framework authentication integration을 같은 claim으로 합치지 않습니다."],
  }),
  appliedTopic({
    id: "credential-lifecycle-threat-model",
    title: "password를 입력 순간부터 폐기·사고 대응까지 lifecycle로 다룹니다",
    lead: "강한 hash 함수 하나를 선택해도 수집, 전송, 메모리, 저장, 검증, reset, upgrade와 로그 중 하나가 새면 credential 시스템은 안전하지 않습니다.",
    mechanism: "credential lifecycle은 enrollment/change에서 plaintext를 짧게 받고 TLS 경계 안에서 검증한 뒤 adaptive one-way hash만 저장합니다. login 때 candidate를 encoder matches로 검증하고 plaintext를 지속 객체·queue·log에 남기지 않으며 reset과 compromise 시 기존 credential을 무효화합니다.",
    workflow: "data-flow diagram에 browser, proxy, application memory, authentication provider, user store, log/APM, support tool와 backup을 표시합니다. 각 경계마다 plaintext/hash/token의 허용 여부, retention, access, rotation·deletion owner를 정합니다.",
    invariants: "복구 가능한 plaintext password는 어떤 저장소에도 존재하지 않고 network에는 TLS가 적용됩니다. password hash도 인증 대체물처럼 민감하게 취급하며 최소 권한 DB 접근, backup protection과 breach response 범위를 가집니다.",
    edgeCases: "registration retry, duplicate submit, Unicode normalization, paste/password manager, change-password 재인증, reset token race, support screenshot, heap dump, dead-letter queue와 database replica·backup을 검사합니다.",
    failureModes: "request DTO 전체 logging, exception toString, analytics event와 support ticket가 plaintext를 복사할 수 있습니다. 암호화만 저장하면 decryption key compromise로 전체 password가 즉시 노출되고 per-user brute-force 비용도 없습니다.",
    verification: "synthetic secret canary를 정상·실패·timeout·reset 흐름에 넣고 response/log/trace/metric/snapshot/queue에서 0건인지 검사합니다. TLS termination 이후 내부 hop과 database/backup access도 독립적으로 review합니다.",
    operations: "credential incident runbook은 ingest 중단, credential reset, session/token invalidation, user notification, audit 범위와 법적 절차를 포함합니다. password policy·hash cost·breach evidence 변경은 owner와 날짜를 가진 결정 기록으로 남깁니다.",
    concepts: [
      concept("credential lifecycle", "password 생성부터 전송·검증·변경·폐기·사고 대응까지의 전체 상태 전이입니다.", ["hashing 한 단계보다 넓습니다.", "각 상태의 owner를 둡니다."]),
      concept("one-way hash", "원문 복호화가 아니라 candidate 일치 검증을 위해 설계한 변환입니다.", ["adaptive cost와 salt가 필요합니다.", "hash도 민감합니다."]),
      concept("secret-zero telemetry", "관측 pipeline 어디에도 plaintext·hash·reset token 형태의 canary가 남지 않는 검증입니다.", ["exporter 끝까지 검사합니다.", "실패 path를 포함합니다."]),
    ],
    codeExamples: [
      nodeExample("sec02-lifecycle", "credential 상태 전이와 retention gate", "security02-lifecycle.mjs", "plaintext가 검증 직후 폐기되고 저장소에는 synthetic hash envelope만 남는 상태를 모델링합니다.", `const transitions = [
  ["RECEIVED", "VALIDATED"],
  ["VALIDATED", "HASHED"],
  ["HASHED", "PLAINTEXT_DISCARDED"],
  ["PLAINTEXT_DISCARDED", "STORED_HASH"]
];
let state = "RECEIVED";
for (const [from, to] of transitions) {
  if (state !== from) throw new Error("invalid transition");
  state = to;
}
console.log("final=" + state);
console.log("plaintext-retained=false");
console.log("reversible-storage=false");
console.log("telemetry-canary-hits=0");`, "final=STORED_HASH\nplaintext-retained=false\nreversible-storage=false\ntelemetry-canary-hits=0", ["owasp-password-storage", "owasp-authentication", "nist-800-63b"]),
    ],
    expertNotes: ["password hash는 공개 가능한 checksum이 아니라 offline guessing 대상이 되는 credential material입니다.", "heap dump와 support tooling은 application log 밖의 leakage surface입니다."],
  }),
  appliedTopic({
    id: "userdetailsservice-lookup-contract",
    title: "UserDetailsService를 identity lookup adapter로 제한합니다",
    lead: "loadUserByUsername은 controller용 사용자 조회가 아니라 authentication provider가 검증에 필요한 사용자 표현을 가져오는 계약입니다.",
    mechanism: "UserDetailsService는 username 형태의 식별자를 받아 UserDetails를 반환하고 DaoAuthenticationProvider가 이를 사용합니다. password 비교를 service가 직접 재구현하거나 login 성공 side effect를 섞지 않고 lookup, credential verification과 post-authentication policy의 책임을 분리합니다.",
    workflow: "입력 canonicalization과 tenant scope를 authentication boundary에서 한 번 정의하고 repository query는 parameter binding과 unique invariant를 사용합니다. found/not-found/duplicate/store-unavailable를 내부적으로 구분하되 public 응답은 account enumeration을 줄이는 균일한 실패 계약을 가집니다.",
    invariants: "한 canonical login identifier는 tenant 안에서 최대 한 active account로 해석되고 lookup 결과는 필요한 authentication fields만 포함합니다. repository entity 전체나 민감 profile을 principal에 싣지 않고 request가 끝난 뒤 장기 cache에 raw credential을 남기지 않습니다.",
    edgeCases: "case folding, Unicode confusable, leading/trailing space, renamed login, multi-tenant duplicate, deleted/locked user, replica lag, cache stale, transaction 경계와 store timeout을 검사합니다.",
    failureModes: "email/username normalization을 registration과 login에서 다르게 적용하면 duplicate 또는 account confusion이 생깁니다. not-found와 wrong-password 응답 시간·문구가 다르면 공격자가 유효 계정을 열거할 수 있습니다.",
    verification: "canonicalization golden corpus, unique constraint, found/not-found/duplicate/timeout fault를 unit+repository integration으로 실행합니다. public status/body/timing band와 internal stable reason을 각각 assertion하고 PII logging을 차단합니다.",
    operations: "lookup latency·outcome은 raw identifier 없이 store/tenant category와 reason으로 집계합니다. identifier policy 변경에는 migration, collision report, alias expiry와 rollback이 필요합니다.",
    concepts: [
      concept("UserDetailsService", "인증에 필요한 UserDetails를 식별자로 조회하는 Spring Security 계약입니다.", ["credential 비교 자체가 핵심 책임은 아닙니다.", "domain profile service와 분리할 수 있습니다."]),
      concept("canonical identifier", "동일 사용자를 일관되게 찾기 위해 normalization 규칙을 적용한 로그인 식별자입니다.", ["registration과 login이 같아야 합니다.", "Unicode·tenant를 고려합니다."]),
      concept("account enumeration", "응답 내용·상태·시간 차이로 유효한 계정 존재를 알아내는 공격입니다.", ["public 실패를 균일화합니다.", "내부 감사 이유는 유지합니다."]),
    ],
    codeExamples: [
      nodeExample("sec02-user-lookup", "tenant-scoped UserDetails lookup 결과", "security02-user-lookup.mjs", "found, missing, duplicate와 unavailable을 내부 reason으로 분리하면서 public 실패를 균일화합니다.", `const rows = new Map([
  ["alpha:learner", [{ id: "u1", enabled: true }]],
  ["alpha:duplicate", [{ id: "u2" }, { id: "u3" }]]
]);
function lookup(tenant, raw) {
  const key = tenant.toLowerCase() + ":" + raw.trim().toLowerCase();
  const found = rows.get(key) || [];
  if (found.length === 1) return { internal: "FOUND", public: "CONTINUE" };
  if (found.length === 0) return { internal: "NOT_FOUND", public: "INVALID_CREDENTIALS" };
  return { internal: "DUPLICATE", public: "INVALID_CREDENTIALS" };
}
for (const name of ["learner", "missing", "duplicate"]) {
  const result = lookup("ALPHA", name);
  console.log(name + "=" + result.internal + "/" + result.public);
}`, "learner=FOUND/CONTINUE\nmissing=NOT_FOUND/INVALID_CREDENTIALS\nduplicate=DUPLICATE/INVALID_CREDENTIALS", ["spring-userdetails-reference", "userdetails-service-api", "userdetails-api", "dao-provider-api"]),
    ],
    expertNotes: ["UserDetailsService가 반환하는 password hash를 controller response로 직렬화하지 않습니다.", "public 균일 실패와 internal diagnosability를 동시에 유지합니다."],
  }),
  appliedTopic({
    id: "userdetails-account-state-authorities",
    title: "UserDetails의 계정 상태와 authorities를 인증 결과에 정확히 반영합니다",
    lead: "password가 맞아도 disabled, locked, expired 또는 credential-expired account는 같은 방식으로 authenticated가 되어서는 안 됩니다.",
    mechanism: "UserDetails는 username, encoded password, authorities와 enabled·accountNonLocked·accountNonExpired·credentialsNonExpired 상태를 제공합니다. provider는 password 검증과 함께 상태를 평가하며 public error는 과도한 계정 정보를 노출하지 않도록 번역합니다.",
    workflow: "domain account state를 authentication-specific projection으로 mapping하고 상태 조합의 우선순위·복구 action·audit reason을 표로 만듭니다. authorities는 저장된 role 이름을 무작정 복사하지 않고 application capability vocabulary와 최소 권한으로 생성합니다.",
    invariants: "disabled/locked/expired state는 authenticated token 발급과 protected side effect를 막고, authority는 server-side authoritative source에서 옵니다. password hash와 내부 flags 전체를 session/client principal에 불필요하게 보존하지 않습니다.",
    edgeCases: "temporary lock expiry, admin unlock race, credential expiry grace flow, disabled tenant, authority cache stale, role rename, empty authorities와 deleted account의 active session을 검사합니다.",
    failureModes: "모든 boolean을 true로 hard-code하면 운영 계정 제어가 무력화되고, DB role 문자열을 client claim과 합치면 privilege escalation이 생깁니다. lock reason을 public login message로 노출하면 enumeration과 support 정보 노출이 커집니다.",
    verification: "2^4 상태 조합 중 정책이 허용하는 조합과 authority matrix를 parameterized test로 실행합니다. 이미 발급된 context/session이 상태 변경 후 언제 재평가되는지도 integration·revocation test로 확인합니다.",
    operations: "lock/disable/expiry event는 actor, reason, expiry, owner와 correlation을 감사하되 raw identifier는 최소화합니다. mass lock이나 stale authority가 생기면 authentication admission을 제한하고 active context invalidation을 수행합니다.",
    concepts: [
      concept("account state flags", "계정·credential의 사용 가능성을 authentication provider에 전달하는 상태 계약입니다.", ["password 일치와 별도입니다.", "복구 workflow가 필요합니다."]),
      concept("GrantedAuthority", "authenticated principal이 가진 application permission 표현입니다.", ["server에서 생성합니다.", "role prefix 의미를 고정합니다."]),
      concept("principal projection", "domain user에서 request authentication에 필요한 최소 정보만 뽑은 표현입니다.", ["entity 전체를 싣지 않습니다.", "직렬화 범위를 제한합니다."]),
    ],
    codeExamples: [
      nodeExample("sec02-account-state", "계정 상태와 authority admission", "security02-account-state.mjs", "password 일치 후에도 네 상태 불변식과 필요한 authority를 모두 통과해야 인증을 승인합니다.", `const attempts = [
  { name: "active", password: true, enabled: true, unlocked: true, accountFresh: true, credentialFresh: true, roles: ["READ"] },
  { name: "locked", password: true, enabled: true, unlocked: false, accountFresh: true, credentialFresh: true, roles: ["READ"] },
  { name: "expired", password: true, enabled: true, unlocked: true, accountFresh: true, credentialFresh: false, roles: ["READ"] },
  { name: "wrong", password: false, enabled: true, unlocked: true, accountFresh: true, credentialFresh: true, roles: ["READ"] }
];
function admit(a) {
  return a.password && a.enabled && a.unlocked && a.accountFresh && a.credentialFresh ? "AUTHENTICATED" : "REJECTED";
}
for (const attempt of attempts) console.log(attempt.name + "=" + admit(attempt));`, "active=AUTHENTICATED\nlocked=REJECTED\nexpired=REJECTED\nwrong=REJECTED", ["userdetails-api", "spring-authentication-architecture", "dao-provider-api"]),
    ],
    expertNotes: ["상태 검사 순서의 public error 차이는 enumeration 위험을 검토합니다.", "authority freshness가 중요하면 장기 session/token과 재평가 전략을 함께 설계합니다."],
  }),
  appliedTopic({
    id: "daoauthenticationprovider-flow",
    title: "DaoAuthenticationProvider의 lookup·password 검증·authenticated token 흐름을 추적합니다",
    lead: "UserDetailsService와 PasswordEncoder는 독립 부품이지만 DaoAuthenticationProvider 안에서 정확한 순서와 실패 계약으로 결합됩니다.",
    mechanism: "ProviderManager는 지원하는 Authentication token을 처리할 AuthenticationProvider에 위임합니다. DaoAuthenticationProvider는 UserDetailsService로 사용자를 조회하고 PasswordEncoder로 presented password와 stored encoded password를 비교한 뒤 account 상태를 확인해 authenticated result를 만듭니다.",
    workflow: "unauthenticated username/password token, provider supports 판정, lookup, pre-check, password match, post-check, credential erasure와 authenticated token 생성 순서를 state machine으로 그립니다. 실패는 public invalid-credentials 계약과 internal stable reason으로 분리합니다.",
    invariants: "plaintext password는 compare 이후 result token에 남지 않고 credentials erasure 정책이 적용됩니다. provider는 지원하지 않는 token을 임의 cast하지 않으며 성공 result의 authorities와 principal은 검증된 UserDetails에서만 옵니다.",
    edgeCases: "여러 provider의 null/exception/success, user cache, compromised password check, password upgrade, account-state race, timing equalization과 provider 순서 변경을 검사합니다.",
    failureModes: "controller에서 repository와 encoder를 직접 호출해 authentication을 만들면 provider의 state check, event, credential erasure와 extension point를 우회합니다. provider order가 넓은 custom provider부터면 잘못된 token을 가로챌 수 있습니다.",
    verification: "supports/lookup/match/state/erase 단계마다 spy count와 synthetic faults를 주입하고 성공 token에 raw credential이 없는지 assertion합니다. 실제 Spring integration에서 event와 SecurityContext 연결도 별도로 확인합니다.",
    operations: "provider별 success/failure/latency를 low-cardinality reason으로 관측하고 raw username·password를 제외합니다. provider 추가·순서 변경은 authentication matrix와 rollback artifact를 요구합니다.",
    concepts: [
      concept("DaoAuthenticationProvider", "UserDetailsService와 PasswordEncoder를 사용해 username/password authentication을 수행하는 provider입니다.", ["account state를 포함합니다.", "controller service가 아닙니다."]),
      concept("ProviderManager", "AuthenticationManager 구현으로 여러 AuthenticationProvider에 인증을 위임합니다.", ["supports와 순서가 중요합니다.", "parent manager 구성을 검토합니다."]),
      concept("credential erasure", "인증 완료 후 Authentication에서 민감한 credential을 제거하는 방어입니다.", ["모든 참조와 cache를 확인합니다.", "로그 redaction을 대체하지 않습니다."]),
    ],
    codeExamples: [
      nodeExample("sec02-provider-flow", "provider authentication 상태 전이", "security02-provider.mjs", "조회·match·상태·erase가 모두 성공해야 authenticated result를 만드는 흐름을 실행합니다.", `function authenticate(input) {
  const trace = ["RECEIVED"];
  if (!input.supported) return { trace: trace.concat("UNSUPPORTED"), result: "PASS" };
  trace.push("LOOKUP");
  if (!input.found) return { trace: trace.concat("REJECT"), result: "INVALID" };
  trace.push("MATCH");
  if (!input.passwordMatch || !input.enabled) return { trace: trace.concat("REJECT"), result: "INVALID" };
  trace.push("ERASE");
  return { trace: trace.concat("AUTHENTICATED"), result: "OK" };
}
for (const input of [
  { supported: true, found: true, passwordMatch: true, enabled: true },
  { supported: true, found: true, passwordMatch: false, enabled: true },
  { supported: false }
]) {
  const result = authenticate(input);
  console.log(result.trace.join(">") + "=" + result.result);
}
console.log("credential-in-result=false");`, "RECEIVED>LOOKUP>MATCH>ERASE>AUTHENTICATED=OK\nRECEIVED>LOOKUP>MATCH>REJECT=INVALID\nRECEIVED>UNSUPPORTED=PASS\ncredential-in-result=false", ["dao-provider-api", "password-encoder-api", "spring-authentication-architecture"]),
    ],
    expertNotes: ["교육 모델의 단계 순서는 지원 version 실제 provider integration test로 검증합니다.", "credential erasure가 cached UserDetails와 충돌할 수 있으므로 reference sharing을 확인합니다."],
  }),
  appliedTopic({
    id: "passwordencoder-one-way-adaptive",
    title: "PasswordEncoder를 one-way adaptive verification 계약으로 사용합니다",
    lead: "encode 결과를 다시 decode하려는 사고방식에서 벗어나 presented password를 stored hash와 matches로 검증하는 것이 핵심입니다.",
    mechanism: "PasswordEncoder는 raw password를 encode하고 raw candidate와 encoded representation의 matches를 제공합니다. modern password hashing은 per-password salt와 조정 가능한 work factor로 offline guessing 비용을 높이며 일반 fast hash나 reversible encryption과 목적이 다릅니다.",
    workflow: "지원 algorithm과 parameter를 security policy로 정하고 production hardware에서 목표 검증 latency와 peak login capacity를 benchmark합니다. registration/change는 encode, login은 matches, migration은 upgradeEncoding 또는 id/version envelope로 분리합니다.",
    invariants: "같은 plaintext도 salt 때문에 encoded 값이 달라질 수 있지만 둘 다 matches를 통과합니다. raw와 encoded argument 순서를 바꾸지 않고 저장 column은 전체 encoded envelope를 truncation 없이 보존합니다.",
    edgeCases: "null/empty, maximum length, Unicode normalization, very long password DoS, malformed/truncated hash, unknown algorithm id, weak legacy hash와 concurrency 아래 CPU saturation을 검사합니다.",
    failureModes: "SHA-256 한 번처럼 빠른 hash는 공격자도 빠르게 대입할 수 있고, hash를 equals로 비교하면 salt 때문에 정상 login이 실패합니다. cost를 무작정 올리면 공격자가 login endpoint CPU를 고갈시킬 수 있습니다.",
    verification: "encode→matches positive/negative, distinct-salt, malformed hash, max length와 latency distribution을 실제 encoder로 실행합니다. 교육 예제는 envelope policy만 모델링하며 cryptographic implementation을 직접 작성하지 않습니다.",
    operations: "p50/p95/p99 verification latency, CPU saturation, queue와 rejection을 algorithm id·cost bucket별로 관측합니다. cost 변경은 capacity test, canary, rollback과 old-hash compatibility window를 포함합니다.",
    concepts: [
      concept("PasswordEncoder", "raw password를 one-way encoded representation으로 만들고 candidate 일치를 검증하는 계약입니다.", ["복호화 API가 아닙니다.", "구현과 parameter를 versioning합니다."]),
      concept("adaptive work factor", "hardware 변화에 맞춰 password verification 비용을 조절하는 parameter입니다.", ["benchmark가 필요합니다.", "가용성 budget과 균형을 잡습니다."]),
      concept("per-password salt", "같은 password도 다른 encoded 결과가 되게 하는 무작위 값입니다.", ["보통 encoded format에 포함됩니다.", "secret pepper와 다릅니다."]),
    ],
    codeExamples: [
      nodeExample("sec02-hash-envelope", "encoded password envelope parser", "security02-hash-envelope.mjs", "실제 hash 계산 없이 algorithm id·parameter·payload가 있는 versioned envelope만 안전하게 분류합니다.", `const stored = ["{bcrypt}$2x$synthetic", "{legacy}synthetic", "missing-prefix"];
function classify(value) {
  const match = /^\{([a-z0-9-]+)\}(.+)$/.exec(value);
  if (!match) return "MALFORMED";
  if (match[1] === "bcrypt") return "CURRENT";
  if (match[1] === "legacy") return "UPGRADE";
  return "UNKNOWN";
}
for (const value of stored) console.log(classify(value));
console.log("real-hashes=0");`, "CURRENT\nUPGRADE\nMALFORMED\nreal-hashes=0", ["password-encoder-api", "bcrypt-api", "spring-password-storage", "owasp-password-storage", "nist-800-63b"]),
    ],
    expertNotes: ["Node 예제는 암호학 구현이 아니라 metadata migration contract만 보여 줍니다.", "password maximum은 hash DoS를 막되 passphrase UX와 표준 지침을 함께 검토합니다."],
  }),
  appliedTopic({
    id: "delegatingpasswordencoder-versioning",
    title: "DelegatingPasswordEncoder의 {id} 형식으로 algorithm migration을 가능하게 합니다",
    lead: "모든 계정 hash를 한 번에 교체할 수 없으므로 저장 형식이 어떤 encoder로 검증할지 스스로 설명해야 점진적 migration이 가능합니다.",
    mechanism: "DelegatingPasswordEncoder는 encoded password 앞의 {id}를 사용해 matches decoder를 선택하고 새 encode에는 현재 id를 사용합니다. id는 암호 강도 자체가 아니라 algorithm/parameter 정책으로 routing하는 version metadata입니다.",
    workflow: "current encode id, accepted legacy ids, unknown/missing id 실패 정책과 retirement date를 registry로 관리합니다. legacy raw hash에 prefix를 붙이는 migration은 실제 format과 parameter가 정확히 일치할 때만 수행하고 추측으로 label하지 않습니다.",
    invariants: "새 password는 current id로만 생성되고 legacy id는 검증 후 upgrade 대상이 됩니다. unknown id와 malformed payload는 fail closed하며 default fallback decoder로 조용히 수용하지 않습니다.",
    edgeCases: "prefix truncation, brace injection, renamed id, different BCrypt cost under same id, database collation, mixed deployments와 rollback artifact가 새 id를 모르는 경우를 검사합니다.",
    failureModes: "id 없이 encoder를 교체하면 기존 사용자가 모두 로그인 실패하거나 weak fallback이 영구 유지됩니다. unknown id 예외를 피하려고 모든 값을 noop encoder로 보내면 plaintext 또는 attacker-controlled format을 허용할 수 있습니다.",
    verification: "current/legacy/unknown/missing/malformed matrix를 실제 DelegatingPasswordEncoder로 실행하고 encode id, matches, upgrade와 public failure를 assertion합니다. rolling deployment에서 old/new binary가 양쪽 저장 형식을 읽는지 검증합니다.",
    operations: "id별 account count와 successful upgrade count를 privacy-safe aggregate로 추적하고 0에 도달한 legacy decoder만 승인 후 제거합니다. rollback window 동안 이전 binary가 새 id를 처리할 전략이 없으면 rollout을 진행하지 않습니다.",
    concepts: [
      concept("DelegatingPasswordEncoder", "저장된 {id}에 따라 여러 PasswordEncoder로 matches를 위임하고 새 encode 정책을 선택하는 구현입니다.", ["migration을 지원합니다.", "unknown id 정책이 중요합니다."]),
      concept("algorithm agility", "보안·성능 변화에 따라 저장 credential algorithm과 parameter를 점진적으로 바꿀 수 있는 능력입니다.", ["format versioning이 필요합니다.", "rollback 호환성을 검증합니다."]),
      concept("fail closed", "알 수 없거나 잘못된 credential format을 약한 fallback으로 처리하지 않고 인증 실패로 끝내는 정책입니다.", ["안정된 public error로 번역합니다.", "내부 reason은 감사합니다."]),
    ],
    codeExamples: [
      nodeExample("sec02-delegating-registry", "encoder id registry와 migration 판정", "security02-delegating.mjs", "current·legacy·unknown id를 registry로 분류하고 새 encode id를 하나로 고정합니다.", `const registry = new Map([
  ["bcrypt-v2", { accepts: true, current: true }],
  ["bcrypt-v1", { accepts: true, current: false }]
]);
function route(id) {
  const policy = registry.get(id);
  if (!policy || !policy.accepts) return "REJECT";
  return policy.current ? "VERIFY" : "VERIFY_AND_UPGRADE";
}
for (const id of ["bcrypt-v2", "bcrypt-v1", "unknown"]) console.log(id + "=" + route(id));
console.log("encode-id=bcrypt-v2");`, "bcrypt-v2=VERIFY\nbcrypt-v1=VERIFY_AND_UPGRADE\nunknown=REJECT\nencode-id=bcrypt-v2", ["delegating-password-encoder-api", "spring-password-storage", "password-encoder-api"]),
    ],
    expertNotes: ["같은 algorithm도 parameter 세대를 별도 id로 표현하면 운영 가시성이 좋아집니다.", "id prefix는 신뢰할 수 없는 metadata이므로 registry 외 값은 거부합니다."],
  }),
  appliedTopic({
    id: "bcrypt-capacity-threat",
    title: "BCrypt work factor를 보안 비용과 가용성 capacity로 함께 결정합니다",
    lead: "BCrypt cost는 높을수록 무조건 좋은 숫자가 아니라 공격자의 offline 비용과 서버의 online 로그인 처리량을 동시에 바꿉니다.",
    mechanism: "BCrypt는 salt와 exponential work factor를 가진 password hash입니다. cost 한 단계 증가는 대략 계산량을 크게 늘리므로 목표 latency는 production CPU, container quota와 동시 login·reset peak에서 직접 측정해야 합니다.",
    workflow: "후보 cost별 warm-up 후 single·concurrent encode/matches latency, CPU, queue와 timeout을 benchmark합니다. 예상 정상 peak, credential stuffing burst와 autoscaling delay를 넣어 admission/rate-limit 뒤에도 authentication capacity가 남는지 계산합니다.",
    invariants: "선택 cost는 security minimum을 충족하면서 정상 사용자 p99와 failover capacity budget 안에 있습니다. benchmark fixture는 synthetic password이고 결과에는 hash를 저장하지 않으며 production secret을 성능 도구에 넣지 않습니다.",
    edgeCases: "CPU model 차이, noisy neighbor, JIT warm-up, virtual thread 여부, container throttling, very long input, reset batch, migration rehash와 blue/green 서로 다른 cost를 검사합니다.",
    failureModes: "개발 노트북 단일 요청만 재면 production concurrency에서 timeout이 폭증합니다. rate limit 없이 높은 cost를 공개 endpoint에 적용하면 작은 bot traffic이 CPU denial-of-service로 바뀔 수 있습니다.",
    verification: "실제 encoder benchmark를 여러 실행·percentile로 기록하고 queueing 포함 end-to-end login test와 비교합니다. cost+1 fault, burst, node loss와 autoscaling cold start에서 정상 traffic SLO가 유지되는지 확인합니다.",
    operations: "verification latency, CPU throttle, queue depth, rate-limit reject를 cost bucket별로 관측합니다. cost rollout은 small canary, capacity headroom과 자동 rollback trigger를 갖고 security downgrade는 별도 승인합니다.",
    concepts: [
      concept("BCrypt cost", "BCrypt key setup 반복 횟수를 지수적으로 조절하는 work factor입니다.", ["production benchmark가 필요합니다.", "가용성 위험을 포함합니다."]),
      concept("offline guessing", "공격자가 탈취한 hash를 자체 hardware에서 후보 password와 비교하는 공격입니다.", ["server rate limit이 직접 막지 못합니다.", "adaptive hash가 비용을 높입니다."]),
      concept("authentication capacity", "정상 peak와 공격 traffic 아래에서 허용 가능한 latency로 password 검증할 수 있는 처리 능력입니다.", ["queue와 failover를 포함합니다.", "rate limit과 함께 설계합니다."]),
    ],
    expertNotes: ["구체 cost 숫자는 시간·hardware·deployment마다 재측정해야 하므로 영구 정답처럼 쓰지 않습니다.", "encoder benchmark와 전체 provider/database latency를 둘 다 봅니다."],
  }),
  appliedTopic({
    id: "rehash-upgrade-on-login",
    title: "성공한 login에서 약한 hash를 원자적으로 upgrade합니다",
    lead: "모든 사용자의 plaintext를 알 수 없으므로 legacy hash migration은 사용자가 올바른 password를 제시한 순간을 안전하게 활용합니다.",
    mechanism: "현재 encoder로 matches가 성공하고 upgradeEncoding이 true이면 같은 presented password를 current policy로 다시 encode해 저장합니다. 이 동작은 인증 성공을 막지 않되 concurrent password change와 stale write를 덮지 않도록 credential version compare-and-set을 사용합니다.",
    workflow: "verify legacy→authenticated result 확보→current encode→versioned conditional update→audit 순서를 정의합니다. update 실패가 race인지 store 장애인지 구분하고 raw password를 retry queue나 event payload에 넣지 않습니다.",
    invariants: "잘못된 password는 rehash하지 않고 성공한 candidate만 사용합니다. concurrent change가 있으면 새 credential을 덮지 않으며, 저장 성공 후 legacy id count가 감소하고 plaintext는 즉시 폐기됩니다.",
    edgeCases: "동시 로그인, password change/reset, replica read 뒤 primary write, transaction rollback, update timeout 결과 불명, mixed-version node와 upgrade write 실패를 검사합니다.",
    failureModes: "matches 전에 새 hash를 저장하거나 unconditional update하면 공격 입력 또는 stale login이 credential을 바꿀 수 있습니다. rehash job에 plaintext를 보내면 migration 편의를 위해 가장 민감한 값을 장기 보존하게 됩니다.",
    verification: "legacy/current/wrong/malformed와 concurrent version race를 deterministic repository fixture로 실행합니다. 실제 provider integration에서 login 성공, upgrade count, stored id와 credential erasure를 확인합니다.",
    operations: "legacy id population, upgrade attempt/success/race/failure를 aggregate로 추적합니다. 오류가 급증하면 upgrade write만 feature flag로 멈추고 verification compatibility는 유지하며 reconciliation을 수행합니다.",
    concepts: [
      concept("upgradeEncoding", "저장된 encoded password가 현재 policy보다 약하거나 오래되어 재인코딩이 필요한지 판단하는 계약입니다.", ["matches 성공 후 사용합니다.", "구현별 의미를 확인합니다."]),
      concept("compare-and-set", "읽은 credential version이 그대로일 때만 새 hash를 쓰는 원자적 갱신입니다.", ["concurrent reset을 보호합니다.", "결과 불명을 처리합니다."]),
      concept("opportunistic rehash", "정상 인증에서 얻은 올바른 plaintext를 짧게 사용해 hash를 점진적으로 upgrade하는 방식입니다.", ["비로그인 계정은 별도 전략이 필요합니다.", "plaintext를 queue에 남기지 않습니다."]),
    ],
    codeExamples: [
      nodeExample("sec02-upgrade", "credential version 기반 opportunistic rehash", "security02-upgrade.mjs", "matches와 legacy 판정 뒤 version이 같을 때만 current id로 갱신합니다.", `function login(record, attempt, observedVersion) {
  if (attempt !== "correct") return "INVALID";
  if (record.id === "bcrypt-v2") return "AUTHENTICATED";
  if (record.version !== observedVersion) return "AUTHENTICATED_RACE_NO_UPDATE";
  record.id = "bcrypt-v2";
  record.version += 1;
  return "AUTHENTICATED_UPGRADED";
}
const legacy = { id: "bcrypt-v1", version: 7 };
console.log("first=" + login(legacy, "correct", 7));
console.log("id=" + legacy.id + "/version=" + legacy.version);
console.log("wrong=" + login(legacy, "wrong", 8));
console.log("plaintext-queued=false");`, "first=AUTHENTICATED_UPGRADED\nid=bcrypt-v2/version=8\nwrong=INVALID\nplaintext-queued=false", ["password-encoder-api", "delegating-password-encoder-api", "spring-password-storage", "local-members-controller", "local-guestbook-service"]),
    ],
    expertNotes: ["upgrade write 실패를 login 전체 실패로 만들지 여부는 threat·consistency 정책으로 명시합니다.", "reset/change는 opportunistic login rehash보다 높은 credential version을 가져야 합니다."],
  }),
  appliedTopic({
    id: "enumeration-stuffing-rate-limit",
    title: "계정 열거·credential stuffing·password spraying을 계층적으로 제한합니다",
    lead: "안전한 hash도 공격자가 수천 개의 유출 credential을 online endpoint에 시험하는 것을 막지 못하므로 admission과 탐지가 필요합니다.",
    mechanism: "credential stuffing은 다른 breach의 username/password 조합을 재사용하고 spraying은 적은 common password를 많은 계정에 시도합니다. 균일 public failure, per-account·per-source·global adaptive rate limit, bot signal, MFA와 breached-password 방어를 겹칩니다.",
    workflow: "로그인 전 cheap validation, risk-aware admission, bounded password verification, 결과 기록과 backoff 순서를 둡니다. account key는 privacy-preserving keyed digest로 집계하고 IP 하나만 차단해 NAT 사용자를 모두 막거나 분산 공격을 놓치지 않습니다.",
    invariants: "공격 traffic이 password encoder capacity를 독점하지 않고 정상 사용자는 복구 가능한 경로를 가집니다. rate-limit state는 raw password를 절대 포함하지 않고 public error는 계정 존재와 정확한 lock 상태를 과도하게 드러내지 않습니다.",
    edgeCases: "IPv6 rotation, proxy chain, NAT, botnet, low-and-slow, username variants, disabled account, distributed limiter partition, clock skew, fail-open/closed와 support unlock abuse를 검사합니다.",
    failureModes: "per-IP만 두면 botnet을 막지 못하고 shared network를 차단합니다. password match 후에만 rate limit을 적용하면 가장 비싼 hash 연산이 이미 수행되어 CPU DoS 방어가 되지 않습니다.",
    verification: "known/unknown account의 response schema와 timing band, burst/sustained/distributed corpus, limiter outage와 normal-user recovery를 load test합니다. synthetic credential만 사용하고 외부 real account를 공격하지 않습니다.",
    operations: "attempt, admitted, limited, provider latency, suspicious reuse와 recovery success를 privacy-safe aggregate로 관측합니다. threshold는 attack simulation과 false-positive review로 조정하고 emergency mode·owner·expiry를 둡니다.",
    concepts: [
      concept("credential stuffing", "다른 곳에서 유출된 credential 조합을 자동으로 재사용해 계정을 탈취하는 공격입니다.", ["password hash만으로 막지 못합니다.", "MFA와 rate limit이 필요합니다."]),
      concept("password spraying", "계정 lock을 피하려 적은 흔한 password를 많은 계정에 시도하는 공격입니다.", ["account·source·global 축을 봅니다.", "low-and-slow를 탐지합니다."]),
      concept("adaptive admission", "위험 신호와 capacity에 따라 expensive authentication 전 요청을 허용·지연·challenge·거부하는 정책입니다.", ["공정성과 복구를 검증합니다.", "PII를 최소화합니다."]),
    ],
    codeExamples: [
      nodeExample("sec02-admission", "다축 authentication admission gate", "security02-admission.mjs", "account·source·global budget 중 하나라도 초과하면 expensive password check 전에 거부합니다.", `const budget = { account: 3, source: 5, global: 10 };
const attempts = [
  { name: "normal", account: 1, source: 2, global: 4 },
  { name: "account-burst", account: 4, source: 4, global: 8 },
  { name: "source-burst", account: 2, source: 7, global: 9 },
  { name: "global-burst", account: 1, source: 2, global: 12 }
];
function admit(a) {
  return a.account <= budget.account && a.source <= budget.source && a.global <= budget.global;
}
for (const attempt of attempts) console.log(attempt.name + "=" + (admit(attempt) ? "HASH" : "LIMIT"));
console.log("raw-identifiers=0");`, "normal=HASH\naccount-burst=LIMIT\nsource-burst=LIMIT\nglobal-burst=LIMIT\nraw-identifiers=0", ["owasp-credential-stuffing", "owasp-authentication", "nist-800-63b"]),
    ],
    expertNotes: ["uniform response가 완벽한 timing equality를 보장하지 않으므로 statistical test와 capacity를 함께 봅니다.", "lockout은 공격자가 victim을 차단하는 도구가 될 수 있어 단계적 challenge와 recovery를 설계합니다."],
  }),
  appliedTopic({
    id: "reset-change-compromise",
    title: "password change·reset·compromise를 기존 session과 연결합니다",
    lead: "새 hash 저장 성공만으로 credential 변경이 끝나는 것이 아니라 누가 요청했는지, 기존 session을 어떻게 처리할지, recovery token을 어떻게 폐기할지가 필요합니다.",
    mechanism: "authenticated change는 current password 또는 강한 재인증을 요구하고 reset은 짧은 수명·single-use·purpose-bound token으로 별도 신원 회복을 수행합니다. 성공 시 credential version을 올리고 reset token과 필요에 따라 기존 sessions/tokens를 무효화합니다.",
    workflow: "request→identity proof→policy validation→current encode→atomic credential version update→reset token consume→session invalidation→notification 순서를 transaction·outbox 경계와 함께 설계합니다.",
    invariants: "reset token은 password나 authentication token이 아니며 hash 형태로 저장하고 한 번만 사용됩니다. 성공 response와 notification에 새 password·hash를 포함하지 않고 오래된 session이 계속 고권한 action을 하지 못합니다.",
    edgeCases: "double click, token replay, email delivery delay, concurrent login/change, stolen active session, account email change, support override, transaction commit 후 notification 실패와 distributed session store를 검사합니다.",
    failureModes: "reset token을 URL access log·analytics에 보존하거나 재사용 가능하게 두면 mailbox/link leakage가 계정 탈취로 이어집니다. password change 후 active session을 전혀 고려하지 않으면 이미 탈취된 session은 계속 유효합니다.",
    verification: "valid/expired/used/wrong-purpose token, concurrent consume와 session invalidation matrix를 실제 persistence fixture로 실행합니다. notification content, logs와 browser history에 secret canary가 없는지 확인합니다.",
    operations: "reset requested/consumed/failed, credential version, session revocation과 notification delivery를 correlation하되 token 원문은 저장하지 않습니다. compromise mode는 강제 reset, global session revoke와 support escalation을 갖습니다.",
    concepts: [
      concept("credential version", "password 변경·reset 때 증가시켜 기존 authentication state의 freshness를 판단하는 값입니다.", ["session/token과 비교합니다.", "원자적으로 갱신합니다."]),
      concept("purpose-bound reset token", "특정 계정의 password reset 한 작업에만 짧게 사용할 수 있는 single-use secret입니다.", ["원문 저장을 피합니다.", "replay를 막습니다."]),
      concept("session revocation", "credential compromise 또는 변경 뒤 기존 authenticated state를 더 이상 사용할 수 없게 하는 조치입니다.", ["분산 store를 포함합니다.", "사용자 선택 정책을 둘 수 있습니다."]),
    ],
    expertNotes: ["reset link의 Referrer-Policy와 third-party resource도 token leakage model에 포함합니다.", "notification은 보안 event 알림이지 password나 reset secret 전달 채널이 아닙니다."],
  }),
  appliedTopic({
    id: "verification-observability-governance",
    title: "credential subsystem을 test·관측·migration·incident evidence로 운영합니다",
    lead: "로그인 happy path와 BCrypt unit test만으로는 lookup ambiguity, algorithm drift, CPU exhaustion, reset replay와 secret leakage를 증명할 수 없습니다.",
    mechanism: "검증은 pure lifecycle model, real encoder benchmark, repository uniqueness, provider integration, browser login/reset, load/attack simulation과 production-like canary로 나뉩니다. provenance, encoder registry, cost benchmark와 secret-zero 결과를 credential manifest로 묶습니다.",
    workflow: "not-found·wrong password·locked·unknown id·legacy upgrade·store timeout·rate limit·reset replay부터 고정하고 정상 login을 마지막에 확인합니다. 모든 결과는 public contract, internal reason, side effect, latency와 secret retention으로 평가합니다.",
    invariants: "모든 source id가 실제 학습 예제에 연결되고 local fingerprint가 재현됩니다. production artifact는 accepted algorithm ids, current id, cost capacity, legacy population, reset/session policy와 rollback 호환성을 설명합니다.",
    edgeCases: "test encoder가 production보다 약한 경우, clock skew, parallel context leakage, database collation, mixed deployment, backup restore, incident 강제 reset과 offline users를 검사합니다.",
    failureModes: "test에서 NoOpPasswordEncoder를 조용히 사용하면 production hash format과 provider wiring을 증명하지 못합니다. 로그 redaction unit test만 통과해도 APM exporter·heap dump·support UI가 secret을 보존할 수 있습니다.",
    verification: "stdout exact test, targeted lint/type/content schema, official URL live check, local line/byte/hash와 sourceRefs missing/unused를 자동화합니다. actual Spring integration과 encoder benchmark 결과는 교육 model과 별도 artifact로 보존합니다.",
    operations: "SLO는 login success만 아니라 lookup/store/hash latency, limiter fairness, legacy retirement, reset abuse와 secret canary 0을 포함합니다. algorithm/cost/provider 변경은 canary, immutable rollback, active-session compatibility와 incident rehearsal을 요구합니다.",
    concepts: [
      concept("credential manifest", "encoder ids·parameters, lookup/provider wiring, migration population, capacity와 검증 evidence를 release별로 기록한 artifact입니다.", ["비밀값을 포함하지 않습니다.", "rollback 호환성을 설명합니다."]),
      concept("differential qualification", "old/new algorithm·provider·deployment가 같은 credential corpus에 의도한 차이만 보이는지 비교하는 검증입니다.", ["legacy와 malformed를 포함합니다.", "mixed version을 검사합니다."]),
      concept("secret canary", "실제 secret 대신 leakage pipeline을 탐지하기 위해 넣는 고유 synthetic 문자열입니다.", ["실제 credential을 쓰지 않습니다.", "모든 exporter를 검사합니다."]),
    ],
    codeExamples: [
      nodeExample("sec02-release-gate", "credential release evidence 승인", "security02-release-gate.mjs", "encoder registry, negative matrix, capacity, legacy migration과 secret-zero가 모두 있어야 배포를 승인합니다.", `const evidence = {
  acceptedIds: 2,
  currentIds: 1,
  negativeCases: 24,
  failedCases: 0,
  capacityHeadroom: 0.42,
  rollbackReadsCurrentId: true,
  secretCanaryHits: 0
};
const approved = evidence.currentIds === 1 &&
  evidence.negativeCases >= 20 &&
  evidence.failedCases === 0 &&
  evidence.capacityHeadroom >= 0.25 &&
  evidence.rollbackReadsCurrentId &&
  evidence.secretCanaryHits === 0;
console.log("release=" + (approved ? "APPROVED" : "BLOCKED"));
console.log("accepted-ids=" + evidence.acceptedIds);
console.log("capacity-headroom=" + evidence.capacityHeadroom);
console.log("secret-canary-hits=" + evidence.secretCanaryHits);`, "release=APPROVED\naccepted-ids=2\ncapacity-headroom=0.42\nsecret-canary-hits=0", ["spring-password-storage", "spring-userdetails-reference", "owasp-password-storage", "owasp-authentication", "owasp-credential-stuffing", "nist-800-63b"]),
    ],
    expertNotes: ["학습 자료의 strict validation과 실제 cryptographic benchmark를 같은 test로 착각하지 않습니다.", "credential incident rehearsal에는 session/token revocation과 user recovery capacity도 포함합니다."],
  }),
];

const sources: SessionSource[] = [
  { id: "local-app-config", repository: "2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/config/AppConfig.java", usedFor: ["BCrypt-based PasswordEncoder bean snapshot"], evidence: "read-only: 12 lines, 444 bytes, SHA-256 833a08d463f2e84ef2837060b8d60497d64521c0386fe5e04873b2dbdab952d3." },
  { id: "local-members-controller", repository: "2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/members/controller/MembersController.java", usedFor: ["member credential encode/match call-site snapshot"], evidence: "read-only: 514 lines, 21038 bytes, SHA-256 72f5f59fcf79c94cda20546fa25634ae2c8c8f47c43953b45263e07cf3bb246d; identities, endpoints and encoded values were not copied." },
  { id: "local-guestbook-service", repository: "2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/guestbook/service/GuestBookServiceImpl.java", usedFor: ["application service PasswordEncoder match snapshot"], evidence: "read-only: 51 lines, 1852 bytes, SHA-256 9a10c2411332f921c4617fb1eff41e8383a18660cb92c6c5007a13dab614e049." },
  { id: "local-bcrypt-config", repository: "2026-springmvc01", path: "src/main/java/org/study/myproject01/config/BCryptConfig.java", usedFor: ["legacy Spring MVC BCrypt bean comparison"], evidence: "read-only: 16 lines, 599 bytes, SHA-256 71fa8094238b09ebdc4495d74a52c32586a4ab4f8c637fec0703a7043bc496a6." },
  { id: "local-member-controller", repository: "2026-springmvc01", path: "src/main/java/org/study/myproject01/members/controller/MemberController.java", usedFor: ["legacy Spring MVC member encode call-site comparison"], evidence: "read-only: 62 lines, 2259 bytes, SHA-256 232fe7260c89c2cc2e849d087514c536ef3528a5f0cbd4d1dd154266ce788215; user values were not copied." },
  { id: "local-build-current", repository: "2026-myproject04-cicd", path: "build.gradle", usedFor: ["Spring Boot plugin 4.0.6 and security starter declaration snapshot"], evidence: "read-only: 56 lines, 2047 bytes, SHA-256 cbf6cb4a2bde7b7c072c924f3c03e009ef7eee737314b1f4edb82fb77eb5c0a5; resolved Security patch was not inferred." },
  { id: "local-springmvc-pom", repository: "2026-springmvc01", path: "pom.xml", usedFor: ["Spring MVC security-crypto dependency declaration snapshot"], evidence: "read-only: 129 lines, 4648 bytes, SHA-256 48eec6d753fae3f656b6f6248d907bd8e6c5eb2b2bfdabfecd358e38aa933798." },
  { id: "spring-userdetails-reference", repository: "Spring Security Reference", path: "UserDetailsService", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/user-details.html", usedFor: ["UserDetailsService and DaoAuthenticationProvider integration"], evidence: "Spring Security current official reference." },
  { id: "userdetails-service-api", repository: "Spring Security Javadoc", path: "UserDetailsService", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/core/userdetails/UserDetailsService.html", usedFor: ["loadUserByUsername API contract"], evidence: "Spring Security current official Javadoc." },
  { id: "userdetails-api", repository: "Spring Security Javadoc", path: "UserDetails", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/core/userdetails/UserDetails.html", usedFor: ["account state, password and authorities contract"], evidence: "Spring Security current official Javadoc." },
  { id: "dao-provider-api", repository: "Spring Security Javadoc", path: "DaoAuthenticationProvider", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/authentication/dao/DaoAuthenticationProvider.html", usedFor: ["user lookup and password authentication provider flow"], evidence: "Spring Security current official Javadoc." },
  { id: "password-encoder-api", repository: "Spring Security Javadoc", path: "PasswordEncoder", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/crypto/password/PasswordEncoder.html", usedFor: ["encode, matches and upgradeEncoding contract"], evidence: "Spring Security current official Javadoc." },
  { id: "bcrypt-api", repository: "Spring Security Javadoc", path: "BCryptPasswordEncoder", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/crypto/bcrypt/BCryptPasswordEncoder.html", usedFor: ["BCrypt implementation and strength semantics"], evidence: "Spring Security current official Javadoc." },
  { id: "delegating-password-encoder-api", repository: "Spring Security Javadoc", path: "DelegatingPasswordEncoder", publicUrl: "https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/crypto/password/DelegatingPasswordEncoder.html", usedFor: ["id-prefixed password format and migration routing"], evidence: "Spring Security current official Javadoc." },
  { id: "spring-password-storage", repository: "Spring Security Reference", path: "Password Storage", publicUrl: "https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html", usedFor: ["adaptive one-way functions, storage format and migration"], evidence: "Spring Security current official reference." },
  { id: "spring-authentication-architecture", repository: "Spring Security Reference", path: "Authentication Architecture", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html", usedFor: ["AuthenticationManager, ProviderManager and AuthenticationProvider flow"], evidence: "Spring Security current official reference." },
  { id: "owasp-password-storage", repository: "OWASP Cheat Sheet Series", path: "Password Storage Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", usedFor: ["password hashing, work factors and migration guidance"], evidence: "OWASP primary defensive guidance." },
  { id: "owasp-authentication", repository: "OWASP Cheat Sheet Series", path: "Authentication Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", usedFor: ["generic errors, password policy, reset and reauthentication"], evidence: "OWASP primary defensive guidance." },
  { id: "owasp-credential-stuffing", repository: "OWASP Cheat Sheet Series", path: "Credential Stuffing Prevention Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html", usedFor: ["credential stuffing detection and layered controls"], evidence: "OWASP primary defensive guidance." },
  { id: "nist-800-63b", repository: "NIST Digital Identity Guidelines", path: "SP 800-63B Authentication and Lifecycle Management", publicUrl: "https://pages.nist.gov/800-63-4/sp800-63b.html", usedFor: ["password verifier and authenticator lifecycle requirements"], evidence: "NIST primary standard guidance." },
];

const session = createExpertSession({
    inventoryId: "sec-02-password-encoder-login",
  slug: "security-02-userdetails-password-encoder",
  courseId: "devops",
  moduleId: "security-filter-authentication",
  order: 2,
  title: "UserDetails·PasswordEncoder와 credential lifecycle",
  subtitle: "로컬 BCrypt 사용의 실제 범위를 보존하면서 UserDetailsService, DaoAuthenticationProvider, adaptive password hashing, algorithm migration, 공격 방어와 incident recovery를 하나의 검증 가능한 lifecycle로 만듭니다.",
  level: "전문가",
  estimatedMinutes: 1140,
  coreQuestion: "password 입력부터 lookup·검증·계정 상태·hash upgrade·reset·사고 대응까지 plaintext와 권한을 노출하지 않고, 성능·migration·공격 조건에서도 인증 결과를 어떻게 정확히 증명할까요?",
  summary: "AppConfig·BCryptConfig와 member/guestbook PasswordEncoder call sites를 read-only로 감사했지만 조사 범위에서 local UserDetailsService 구현은 확인하지 못했습니다. 이 gap을 명시한 뒤 credential lifecycle, canonical lookup, UserDetails 상태·authorities, DaoAuthenticationProvider, one-way adaptive hashing, DelegatingPasswordEncoder id, BCrypt capacity, opportunistic rehash, enumeration·stuffing admission, reset/session revocation과 release governance를 현재 Spring Security·OWASP·NIST 근거로 상세히 확장합니다.",
  objectives: ["로컬 BCrypt 증거와 확인되지 않은 UserDetailsService를 구분한다.", "credential plaintext·hash의 lifecycle과 trust boundary를 설계한다.", "UserDetailsService lookup과 identifier canonicalization을 구현한다.", "UserDetails 상태와 authorities를 최소 principal로 projection한다.", "DaoAuthenticationProvider 흐름과 credential erasure를 추적한다.", "PasswordEncoder의 salt·adaptive cost·matches 계약을 설명한다.", "DelegatingPasswordEncoder로 algorithm migration을 설계한다.", "BCrypt cost와 authentication capacity를 benchmark한다.", "성공 login에서 hash를 원자적으로 upgrade한다.", "enumeration·stuffing·spraying을 다축 admission으로 제한한다.", "change/reset/compromise와 session revocation을 연결한다.", "credential release·migration·incident evidence를 운영한다."],
  prerequisites: [{ title: "SecurityFilterChain과 request 보안 경계", reason: "credential authentication이 실행되는 filter·request·error 경계를 먼저 이해해야 provider 결과를 안전하게 연결할 수 있습니다.", sessionSlug: "security-01-filter-chain-request-boundary" }],
  keywords: ["UserDetailsService", "UserDetails", "DaoAuthenticationProvider", "ProviderManager", "PasswordEncoder", "BCryptPasswordEncoder", "DelegatingPasswordEncoder", "upgradeEncoding", "credential lifecycle", "account enumeration", "credential stuffing", "password reset", "secret zero"],
  topics,
  lab: {
    title: "Versioned password credential subsystem과 공격·migration corpus 구축하기",
    scenario: "legacy BCrypt policy와 새 policy가 공존하는 synthetic 회원 시스템에 lookup, account state, provider flow, reset과 다축 admission을 추가해야 합니다.",
    setup: ["실제 사용자·password·hash 대신 synthetic identities와 non-secret envelope를 사용합니다.", "지원 Spring Security version의 disposable project와 실제 PasswordEncoder를 준비합니다.", "local source fingerprint와 resolved dependency report를 별도 artifact로 고정합니다.", "lookup·state·algorithm id·cost·attack·reset matrix를 작성합니다."],
    steps: ["credential data-flow와 secret 허용/금지 경계를 표시합니다.", "tenant-scoped canonical identifier와 unique repository를 구현합니다.", "UserDetails state·authorities projection과 provider flow를 연결합니다.", "current/legacy/unknown encoder id matrix를 실행합니다.", "production-like CPU에서 cost와 concurrent capacity를 benchmark합니다.", "successful legacy login의 versioned rehash race를 검증합니다.", "enumeration과 stuffing corpus를 expensive hash 전에 제한합니다.", "change/reset token과 active session revocation을 연결합니다.", "secret canary를 logs/traces/snapshots/exporters에서 검색합니다.", "manifest, canary와 rollback compatibility를 승인합니다."],
    expectedResult: ["lookup·password·account-state 실패가 public contract와 internal reason으로 분리됩니다.", "새 hash는 current id로 생성되고 legacy는 성공 인증에서 안전하게 upgrade됩니다.", "공격 burst 아래 정상 authentication capacity가 유지됩니다.", "reset replay와 concurrent credential write가 차단됩니다.", "plaintext·hash·token-shaped canary가 모든 artifact에서 0건입니다."],
    cleanup: ["synthetic users, hashes, sessions와 reset records를 run id로 제거합니다.", "benchmark output에서 encoded payload를 삭제하고 aggregate만 보존합니다.", "temporary limiter/debug configuration과 test provider를 제거합니다.", "local source files는 변경하지 않습니다."],
    extensions: ["MFA·passkey와 password fallback 정책을 결합합니다.", "compromised password service를 privacy-safe하게 통합합니다.", "HSM/secret manager pepper rotation을 별도 threat model로 검증합니다.", "multi-region user store와 limiter consistency를 chaos test합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여덟 Node 예제를 실행하고 lookup→provider→encoder→upgrade→admission 흐름을 상태 표로 작성하세요.", requirements: ["stdout을 완전히 대조합니다.", "local observed와 official-only claim을 구분합니다.", "not-found와 duplicate public error를 설명합니다.", "계정 상태 반례를 추가합니다.", "unknown encoder id를 거부합니다.", "rehash race를 설명합니다.", "hash 전 admission 이유를 적습니다.", "secret-zero 결과를 확인합니다."], hints: ["password가 맞다는 사실과 account가 허용된다는 사실을 별도 열로 두세요."], expectedOutcome: "credential 인증을 결정 가능한 lifecycle로 설명합니다.", solutionOutline: ["lookup→verify→state→erase→authenticate→upgrade→observe 순서입니다."] },
    { difficulty: "응용", prompt: "실제 Spring Security disposable project에 UserDetailsService와 versioned encoder migration을 구현하세요.", requirements: ["resolved version을 기록합니다.", "identifier uniqueness를 강제합니다.", "UserDetails 상태 matrix를 실행합니다.", "DaoAuthenticationProvider를 연결합니다.", "current/legacy/unknown id를 검증합니다.", "cost capacity를 benchmark합니다.", "reset/revocation을 검증합니다.", "secret canary 0을 확인합니다."], hints: ["controller에서 password comparison을 다시 구현하지 마세요."], expectedOutcome: "공격·migration·복구까지 qualification된 credential subsystem이 완성됩니다.", solutionOutline: ["provenance→lookup→provider→hash policy→migration→attack test→release 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 password credential governance 표준을 작성하세요.", requirements: ["lifecycle와 data classification을 둡니다.", "identifier·enumeration 정책을 둡니다.", "provider/account-state 규칙을 둡니다.", "encoder registry·cost benchmark를 요구합니다.", "legacy retirement와 rollback을 정의합니다.", "stuffing admission과 MFA 연결을 둡니다.", "reset/session revocation을 정의합니다.", "secret-zero·incident rehearsal을 포함합니다."], hints: ["algorithm 선택표보다 migration과 rollback에서 시작해도 좋습니다."], expectedOutcome: "새 서비스와 legacy migration에 공통 적용 가능한 credential 표준이 완성됩니다.", solutionOutline: ["classify→verify→version→limit→recover→audit 순서입니다."] },
  ],
  nextSessions: ["security-03-session-login-authentication"],
  sources,
  sourceCoverage: {
    filesRead: 7,
    filesUsed: 7,
    uncoveredNotes: ["선택한 local source에서는 BCrypt-based PasswordEncoder bean과 encode/matches call structure를 확인했습니다.", "조사 범위에서 UserDetailsService 구현, loadUserByUsername 또는 DaoAuthenticationProvider 설정은 확인하지 못해 official-only coverage로 명시했습니다.", "Boot plugin·pom declaration만으로 정확한 resolved Spring Security patch 또는 encoder parameter를 추론하지 않았습니다.", "실제 password, encoded hash, identity, endpoint와 configuration value를 공개 예제에 복사하지 않았습니다.", "Node examples는 cryptographic implementation이 아니며 실제 Spring provider·encoder·repository·browser·load tests를 대체하지 않습니다."],
  },
});

export default session;
