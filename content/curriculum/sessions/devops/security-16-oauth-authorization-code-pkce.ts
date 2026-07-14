import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localProviderRefs = ["local-oauth-config", "local-kakao-service", "local-naver-service", "local-oauth-userinfo"];
const localClientRefs = ["local-login-page", "local-auth-api"];

const topics = [
  appliedTopic({
    id: "oauth-source-flow-audit", title: "React login과 두 provider service를 redacted authorization-code sequence로 감사합니다",
    lead: "login button, callback와 provider HTTP calls를 따로 읽지 않고 browser→authorization endpoint→callback→code exchange→profile→local account/session의 trust boundaries로 복원합니다.",
    mechanism: "로컬 snapshot은 provider-specific config/services/profile DTO와 React login/auth flow를 보여 줍니다. 그러나 실제 client registration, redirect/state/PKCE binding, exact provider contract와 account linking policy를 current 표준 수준으로 모두 보장한다고 과장하지 않습니다.",
    workflow: "read-only hashes→actors/client type→authorization request fields→browser redirects→callback inputs→token exchange authentication/PKCE→userinfo/profile mapping→local identity/session→errors/log sinks를 값 없는 sequence로 작성합니다.",
    invariants: "실제 client ID/secret, authorization/token/userinfo endpoints, redirect URI, state/code/verifier/tokens, provider user data와 local routes를 공개 content에 복사하지 않습니다.",
    edgeCases: "user deny, two tabs, callback reload, wrong provider, expired code, provider outage, missing email/profile, existing account, old frontend와 reverse proxy를 포함합니다.",
    failureModes: "provider login이 정상 동작한다는 이유만으로 state/PKCE/mix-up/open redirect/account linking과 secret-safe logging이 검증됐다고 보면 identity takeover 경로를 놓칩니다.",
    verification: "source hashes, sanitized HTTP call graph, actual registration/config readback, state/verifier stores, callback one-time use, provider response schema와 session issuance를 isolated fixtures에서 대조합니다.",
    operations: "provider/client/flow revision, stable callback outcome, state/PKCE validation, exchange/profile latency와 error class를 bounded labels로 남기고 credentials/PII는 기록하지 않습니다.",
    concepts: [c("authorization code flow", "browser가 authorization server에서 일회용 code를 받아 client가 token endpoint에서 교환하는 OAuth flow입니다.", ["front/back channels를 나눕니다.", "PKCE와 state를 사용합니다."]), c("OAuth client", "resource owner를 대신해 authorization을 요청하고 token을 사용하는 application role입니다.", ["public/confidential 특성이 다릅니다.", "등록된 metadata를 가집니다."]), c("source claim boundary", "로컬 provider integration에서 관찰한 사실과 표준상 필요한 보장을 구분하는 경계입니다.", ["버전과 hash를 기록합니다.", "credential values는 제외합니다."])],
    codeExamples: [node("security16-source-sequence", "redacted OAuth source sequence", "Security16SourceSequence.mjs", "로컬 source의 provider/client 흐름과 추가 verification gaps를 값 없이 분리합니다.", String.raw`const steps = [
  ["start", "browser>authorization-server", "observed-shape"],
  ["callback", "browser>client", "observed-shape"],
  ["exchange", "client>token-endpoint", "observed-shape"],
  ["profile", "client>resource-server", "observed-shape"],
  ["state-binding", "browser-session", "verify"],
  ["pkce-binding", "verifier-challenge", "verify"],
];
for (const row of steps) console.log(row.join("|"));
console.log("provider-values-copied=false");`, "start|browser>authorization-server|observed-shape\ncallback|browser>client|observed-shape\nexchange|client>token-endpoint|observed-shape\nprofile|client>resource-server|observed-shape\nstate-binding|browser-session|verify\npkce-binding|verifier-challenge|verify\nprovider-values-copied=false", localProviderRefs.concat(localClientRefs, ["rfc6749", "rfc9700"]))],
  }),
  appliedTopic({
    id: "oauth-roles-channels", title: "resource owner·user-agent·client·authorization/resource server와 channels를 구분합니다",
    lead: "OAuth를 소셜 로그인 API 한 번으로 축약하지 않고 누가 어느 credential을 보고 어떤 endpoint를 신뢰하는지 front-channel과 back-channel sequence로 추적합니다.",
    mechanism: "authorization request/response는 user-agent를 경유해 노출·변조·redirect 공격을 고려하고 token exchange는 authenticated TLS back-channel입니다. OAuth authorization 자체와 OIDC authentication/ID Token semantics를 구분합니다.",
    workflow: "roles, endpoint ownership, request/response parameters, credential visibility, redirect hops, TLS/DNS/proxy와 local session issuance를 data-flow diagram에 표시합니다.",
    invariants: "authorization code는 resource token이 아니고 access token은 local login identity proof로 임의 재해석하지 않으며 authorization server와 resource server metadata를 trusted registration/discovery에서 얻습니다.",
    edgeCases: "SPA public client, BFF/confidential client, native app, provider resource API, multiple issuers, embedded WebView, reverse proxy와 mobile deep links를 포함합니다.",
    failureModes: "front/back channel을 구분하지 않으면 code/token을 URL/log/browser에 노출하거나 client secret을 SPA bundle에 넣는 잘못된 설계를 할 수 있습니다.",
    verification: "browser/network capture, TLS endpoint/issuer metadata, bundle secret scan, token exchange authentication와 local session boundary를 실제 client type별로 검증합니다.",
    operations: "flow/client type, channel, issuer/provider class, redirect/exchange outcomes와 secret scan findings를 관찰합니다.",
    concepts: [c("front-channel", "user-agent redirect를 경유해 authorization request/response가 이동하는 channel입니다.", ["URL/history/referrer 노출을 고려합니다.", "state/issuer를 검증합니다."]), c("back-channel", "client server가 authorization server와 직접 TLS로 code/token을 교환하는 channel입니다.", ["browser에 secret을 노출하지 않습니다.", "endpoint 인증을 검증합니다."]), c("OAuth vs OIDC", "OAuth는 delegated authorization framework이고 OIDC는 그 위에 identity authentication semantics를 추가합니다.", ["ID Token은 OIDC에 속합니다.", "access token을 identity로 오용하지 않습니다."])],
    codeExamples: [node("security16-role-map", "OAuth role and credential visibility map", "Security16RoleMap.mjs", "flow 단계별 channel과 browser/token visibility를 정리합니다.", String.raw`const steps = [
  ["authorization-request", "front", "browser", "state+challenge"],
  ["authorization-response", "front", "browser", "code+state+issuer"],
  ["token-exchange", "back", "client-server", "code+verifier"],
  ["resource-call", "back", "client-or-bff", "access-token"],
];
for (const row of steps) console.log(row.join("|"));
console.log("client-secret-in-browser=false");`, "authorization-request|front|browser|state+challenge\nauthorization-response|front|browser|code+state+issuer\ntoken-exchange|back|client-server|code+verifier\nresource-call|back|client-or-bff|access-token\nclient-secret-in-browser=false", ["rfc6749", "rfc8252", "oauth-browser-bcp", "oidc-core"])],
  }),
  appliedTopic({
    id: "client-registration-redirect", title: "client registration과 redirect URI를 exact·owned·environment-specific contract로 고정합니다",
    lead: "request가 보낸 redirect_uri를 suffix/substring으로 허용하거나 callback 뒤 임의 return URL로 재사용하지 않고 provider 등록값과 exact match합니다.",
    mechanism: "authorization server는 등록된 redirect URIs와 authorization request를 비교하고 client는 callback의 target origin/path를 소유해야 합니다. local post-login destination은 별도 opaque state record의 allowlisted route ID로 저장합니다.",
    workflow: "environment/client type별 client ID, redirect URI, allowed grant/response types, auth method, scopes, contacts와 rotation owner를 configuration-as-code로 관리합니다.",
    invariants: "wildcard/suffix/open redirect가 없고 production client에 localhost/preview가 없으며 redirect URI query/path canonicalization을 provider/client가 같은 exact value로 사용합니다.",
    edgeCases: "trailing slash, percent encoding, case/default port, reverse proxy forwarded host, custom schemes, loopback ports, multiple domains, decommissioned callback와 preview environments를 포함합니다.",
    failureModes: "startsWith/endsWith 검사는 attacker subdomain/path를 허용하고 callback next 파라미터를 검증 없이 redirect하면 code/session 탈취나 phishing open redirect가 됩니다.",
    verification: "registration readback, hostile URI corpus, proxy target reconstruction, environment promotion diff, callback/return-route allowlist와 expired domain scan을 실행합니다.",
    operations: "client registration revision, redirect mismatch, unknown environment, domain ownership/expiry와 rejected return route를 bounded metrics로 관찰합니다.",
    concepts: [c("redirect URI", "authorization response가 돌아올 client endpoint로 authorization server에 사전 등록된 URI입니다.", ["exact matching을 우선합니다.", "post-login return route와 다릅니다."]), c("client registration", "client ID, redirect URIs, grant types, auth method와 metadata를 authorization server에 등록한 contract입니다.", ["environment별 provenance를 둡니다.", "secret rotation owner를 둡니다."]), c("open redirect", "공격자가 destination을 조작해 trusted domain을 임의 외부 위치로 redirect시키는 취약점입니다.", ["OAuth code/session 탈취에 악용될 수 있습니다.", "route ID allowlist를 씁니다."])],
    codeExamples: [node("security16-redirect-policy", "exact redirect and local return-route policy", "Security16RedirectPolicy.mjs", "registered redirects와 local route IDs를 exact allowlist로 검증합니다.", String.raw`const redirects = new Set(["https://app.example/oauth/callback"]);
const returnRoutes = new Set(["home", "profile"]);
const cases = [
  ["https://app.example/oauth/callback", "home"],
  ["https://app.example.evil/oauth/callback", "home"],
  ["https://app.example/oauth/callback", "https://evil.example"],
];
for (const x of cases) console.log(x[0] + "|" + x[1] + "|allow=" + (redirects.has(x[0]) && returnRoutes.has(x[1])));`, "https://app.example/oauth/callback|home|allow=true\nhttps://app.example.evil/oauth/callback|home|allow=false\nhttps://app.example/oauth/callback|https://evil.example|allow=false", ["rfc6749", "rfc9700", "owasp-oauth", "local-oauth-config"])],
  }),
  appliedTopic({
    id: "state-transaction-binding", title: "state를 random 문자열이 아니라 browser transaction과 redirect intent의 one-time binding으로 만듭니다",
    lead: "callback에 state가 존재하는지만 보지 않고 누가 어느 provider/client/redirect/PKCE transaction을 시작했는지 server-controlled state record와 constant-time equality로 검증합니다.",
    mechanism: "고엔트로피 state handle은 browser session/cookie, issuer/provider, client, exact redirect, PKCE verifier reference, created/expiry와 post-login route ID에 연결되고 callback에서 원자적으로 consume됩니다.",
    workflow: "state random 생성→server/session store record→SameSite/Secure binding→authorization request→callback exact lookup/expiry/provider/session compare→consume-before-exchange→safe error/restart를 구현합니다.",
    invariants: "state에 raw token/PII/return URL을 encode하지 않고 callback마다 one-time consume하며 missing/mismatch/expired/replayed state에서 code exchange/local session issuance가 없습니다.",
    edgeCases: "two tabs, login retry, browser back/reload, expired session, same-site attacker, parallel callbacks, store outage, rolling deployment와 user deny를 포함합니다.",
    failureModes: "state를 client가 만든 return URL 또는 provider 이름으로 사용하면 login CSRF/session swapping/open redirect가 되고 state 재사용을 허용하면 callback replay가 가능합니다.",
    verification: "entropy/collision, wrong/missing/session/provider/redirect state, one-time concurrency, expiry, consume-before-side-effect와 no-state-in-log를 테스트합니다.",
    operations: "state issued/consumed/mismatch/replay/expired, transaction age와 store errors를 bounded metrics로 집계하고 state 값을 기록하지 않습니다.",
    concepts: [c("state parameter", "authorization request와 callback을 client transaction에 연결하는 opaque value입니다.", ["CSRF/session swapping을 방어합니다.", "one-time binding이 필요합니다."]), c("authorization transaction", "state, browser session, issuer/client/redirect, PKCE와 return intent를 묶은 server-side record입니다.", ["TTL과 consume state를 둡니다.", "raw credentials를 저장하지 않습니다."]), c("login CSRF", "공격자가 자신의 authorization response를 피해자 browser session에 결합해 계정을 바꾸거나 연결하는 공격입니다.", ["state/session binding으로 막습니다.", "account linking에서 특히 중요합니다."])],
    codeExamples: [node("security16-state-store", "one-time OAuth state transaction store", "Security16StateStore.mjs", "session/provider/redirect binding과 atomic consume/replay를 모델링합니다.", String.raw`const store = new Map([["s1", { session: "b1", provider: "p1", redirectId: "cb", expires: 1100, used: false }]]);
function consume(handle, input, now) { const x = store.get(handle); if (!x) return "missing"; if (x.used) return "replay"; if (x.expires < now) return "expired"; if (x.session !== input.session || x.provider !== input.provider || x.redirectId !== input.redirectId) return "mismatch"; x.used = true; return "ok"; }
console.log(consume("s1", { session: "b2", provider: "p1", redirectId: "cb" }, 1000));
console.log(consume("s1", { session: "b1", provider: "p1", redirectId: "cb" }, 1000));
console.log(consume("s1", { session: "b1", provider: "p1", redirectId: "cb" }, 1001));`, "mismatch\nok\nreplay", ["rfc6749", "rfc9700", "owasp-oauth", "spring-oauth-login"])],
  }),
  appliedTopic({
    id: "pkce-s256-lifecycle", title: "PKCE S256 verifier·challenge를 authorization transaction에 one-time binding합니다",
    lead: "PKCE를 query parameter 이름 암기로 끝내지 않고 random verifier generation, S256 derivation, front-channel challenge와 back-channel verifier 비교가 code interception을 어떻게 막는지 추적합니다.",
    mechanism: "client는 충분한 entropy/허용 charset/length의 verifier를 만들고 BASE64URL-ENCODE(SHA256(ASCII(verifier))) challenge와 method S256을 authorization request에 넣습니다. verifier는 state transaction에 server-side 또는 protected client context로 보관하고 exchange 후 폐기합니다.",
    workflow: "CSPRNG verifier→S256 challenge→state record reference→authorization request→callback state consume→token exchange with exact verifier→verifier deletion을 수행합니다.",
    invariants: "plain method/fallback/downgrade를 허용하지 않고 verifier를 URL/log/browser history/analytics에 노출하지 않으며 code는 verifier·client·redirect에 bound되고 한 번만 교환됩니다.",
    edgeCases: "verifier encoding/padding, wrong length/charset, two tabs, lost state store, code replay, server cluster, native/public client, provider PKCE capability mismatch를 포함합니다.",
    failureModes: "challenge를 고정하거나 verifier를 localStorage에 장기 저장/로그하면 interception 방어가 약해지고 S256 실패 시 plain으로 fallback하면 downgrade가 됩니다.",
    verification: "RFC known transformations, entropy/format, wrong/missing verifier, challenge mismatch, code one-time/client/redirect binding, log/history scans와 concurrent exchange를 실행합니다.",
    operations: "PKCE method, exchange success/mismatch, verifier record age/cleanup와 unsupported-provider outcome을 값 없이 관찰합니다.",
    concepts: [c("code verifier", "client가 생성해 token exchange에서 제시하는 고엔트로피 random 문자열입니다.", ["front-channel에 보내지 않습니다.", "one-time 삭제합니다."]), c("code challenge", "verifier에서 derivation해 authorization request에 넣는 값입니다.", ["S256을 사용합니다.", "authorization server가 code와 bind합니다."]), c("code interception", "authorization code를 가로챈 attacker가 token endpoint에서 먼저 교환하는 공격입니다.", ["PKCE verifier binding으로 완화합니다.", "redirect/state도 필요합니다."])],
    codeExamples: [node("security16-pkce-model", "PKCE S256 derivation and exchange binding", "Security16PkceModel.mjs", "Node crypto로 synthetic verifier challenge와 wrong/correct exchange를 실행합니다.", String.raw`import { createHash } from "node:crypto";
const verifier = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";
const challenge = createHash("sha256").update(verifier, "ascii").digest("base64url");
function exchange(presented) { const derived = createHash("sha256").update(presented, "ascii").digest("base64url"); return derived === challenge ? "issued" : "pkce-mismatch"; }
console.log("method=S256");
console.log("challengeLength=" + challenge.length);
console.log(exchange(verifier + "x"));
console.log(exchange(verifier));`, "method=S256\nchallengeLength=43\npkce-mismatch\nissued", ["rfc7636", "rfc9700", "rfc8252", "oauth-browser-bcp"])],
  }),
  appliedTopic({
    id: "code-exchange-client-type", title: "public SPA·confidential BFF의 code exchange와 credential ownership을 구분합니다",
    lead: "client secret을 browser bundle에 넣지 않고 public client는 PKCE를 필수로, confidential server/BFF는 server-held client authentication과 PKCE를 함께 사용합니다.",
    mechanism: "token endpoint는 exact client_id, code, redirect_uri와 verifier를 검증하고 confidential client auth는 secret/private_key_jwt/mTLS 등 등록 method에 따릅니다. BFF가 token을 보관하면 browser에는 same-origin session과 CSRF contract가 남습니다.",
    workflow: "client type/topology 결정→registration auth method→secret/key vault+rotation→code exchange request allowlist→response schema/minimization→server token storage/session issuance→error/retry/no-log를 구현합니다.",
    invariants: "public client에 meaningful secret이 없고 code/token exchange는 browser-exposed generic proxy를 통하지 않으며 token response/cache/log/error에 credentials가 남지 않습니다.",
    edgeCases: "secret rotation overlap, lost token response, exchange timeout, duplicate callback, BFF session outage, multi-region, provider auth-method differences와 DPoP를 포함합니다.",
    failureModes: "SPA environment variable의 client secret은 누구나 추출할 수 있고 unrestricted backend exchange proxy는 attacker code를 trusted client로 교환하는 confused deputy가 됩니다.",
    verification: "bundle/source/artifact secret scans, public/confidential registration, token endpoint negative matrix, exact redirect/verifier, retry/idempotency, BFF cookie/CSRF와 secret rotation을 실행합니다.",
    operations: "client auth method/revision, exchange latency/outcome, secret/key age/rotation, duplicate code와 token sink findings를 관찰합니다.",
    concepts: [c("public client", "client credential의 confidentiality를 유지할 수 없는 OAuth client입니다.", ["browser/native app이 대표적입니다.", "PKCE를 사용합니다."]), c("confidential client", "server 환경에서 client credential을 안전하게 보관·인증할 수 있는 client입니다.", ["secret/key rotation을 운영합니다.", "BFF가 될 수 있습니다."]), c("confused deputy", "권한 있는 component가 attacker의 요청을 자기 권한으로 대신 수행하도록 속는 문제입니다.", ["code/client/redirect/state binding을 검증합니다.", "generic exchange proxy를 피합니다."])],
  }),
  appliedTopic({
    id: "issuer-mixup-oidc-nonce", title: "issuer mix-up과 OIDC ID Token nonce·claims를 OAuth state와 별도로 검증합니다",
    lead: "여러 provider를 지원할 때 callback path/provider parameter만 믿지 않고 authorization response issuer와 transaction의 expected issuer를 비교하며 OIDC라면 ID Token validation을 독립 수행합니다.",
    mechanism: "RFC 9207 iss parameter 또는 issuer-specific redirect, discovery metadata와 transaction binding이 authorization-server mix-up을 줄입니다. OIDC ID Token은 signature, iss, aud/azp, exp/iat, nonce, authentication context를 검증하고 access token/userinfo와 용도를 구분합니다.",
    workflow: "trusted issuer registry/discovery→transaction expected issuer/nonce→authorization response state+iss→issuer token endpoint→ID Token profile/key/nonce→userinfo subject equality→local identity mapping을 수행합니다.",
    invariants: "provider 이름/URL을 request input에서 임의 선택하지 않고 issuer/token endpoint/JWKS는 same trusted metadata set이며 nonce는 state와 다른 one-time replay binding이고 userinfo sub가 ID Token sub와 일치합니다.",
    edgeCases: "same callback multiple issuers, stale discovery/JWKS, issuer alias/trailing slash, multiple audiences/azp, missing nonce, code flow without OIDC, pairwise subject와 key rollover를 포함합니다.",
    failureModes: "callback의 provider query로 token endpoint를 고르면 attacker issuer code를 victim client로 교환하는 mix-up이 가능하고 access token claims를 ID Token처럼 쓰면 authentication semantics가 깨집니다.",
    verification: "wrong/missing iss, issuer metadata mix, wrong nonce/aud/azp/sub, expired token, JWKS rollover/outage와 OAuth-only provider branch를 negative test합니다.",
    operations: "expected/actual issuer class, state/nonce/mix-up reject, discovery/JWKS revision와 ID Token validation reason을 token/subject 없이 관찰합니다.",
    concepts: [c("authorization-server mix-up", "client가 authorization response를 한 issuer에서 받고 다른 issuer의 endpoint/identity로 처리하게 만드는 공격입니다.", ["issuer binding을 검증합니다.", "여러 provider에서 중요합니다."]), c("nonce", "OIDC authentication request와 ID Token을 one-time으로 연결해 replay를 줄이는 값입니다.", ["state와 목적이 다릅니다.", "transaction에 bind합니다."]), c("ID Token", "OIDC client에게 authentication event와 subject claims를 전달하는 signed token입니다.", ["access token과 다릅니다.", "iss/aud/nonce 등을 검증합니다."])],
    codeExamples: [node("security16-issuer-binding", "state/issuer/nonce callback binding", "Security16IssuerBinding.mjs", "expected provider transaction과 callback issuer/nonce 조합을 fail closed로 분류합니다.", String.raw`const tx = { state: "s1", issuer: "https://issuer-a.example", nonce: "n1", used: false };
function validate(input) { if (tx.used) return "replay"; if (input.state !== tx.state) return "state"; if (input.issuer !== tx.issuer) return "issuer"; if (input.nonce !== tx.nonce) return "nonce"; tx.used = true; return "ok"; }
console.log(validate({ state: "s1", issuer: "https://issuer-b.example", nonce: "n1" }));
console.log(validate({ state: "s1", issuer: "https://issuer-a.example", nonce: "bad" }));
console.log(validate({ state: "s1", issuer: "https://issuer-a.example", nonce: "n1" }));
console.log(validate({ state: "s1", issuer: "https://issuer-a.example", nonce: "n1" }));`, "issuer\nnonce\nok\nreplay", ["rfc9207", "oidc-core", "oidc-discovery", "rfc9700"])],
  }),
  appliedTopic({
    id: "callback-error-replay-privacy", title: "callback deny/error/replay를 stable problem·restart UX와 privacy-safe telemetry로 처리합니다",
    lead: "provider error_description이나 exception/token body를 그대로 browser/log에 전달하지 않고 user deny, expired/replayed state/code, exchange/profile outage와 local conflict를 stable outcomes로 분류합니다.",
    mechanism: "callback은 state/issuer를 error response에도 먼저 검증하고 one-time transaction을 적절히 consume합니다. public message와 internal reason을 분리하고 retry는 새 state/verifier로 flow를 다시 시작하며 code exchange를 무한 반복하지 않습니다.",
    workflow: "parse bounded callback→lookup transaction→validate state/issuer/error→consume/retry policy→exchange/profile/local identity→session or safe problem→cleanup/redirect allowlist를 수행합니다.",
    invariants: "code/state/error_description/token/PII가 URL 이후 referrer, logs, analytics와 support artifacts로 퍼지지 않고 실패 callback이 local session/account link를 만들지 않습니다.",
    edgeCases: "provider deny, duplicate/reloaded callback, partial exchange success, malformed content type, oversized body, local account conflict, popup closed와 old transaction을 포함합니다.",
    failureModes: "exception message와 provider response를 그대로 노출하면 tokens/PII/internal endpoints가 새고 자동 callback retry는 code replay와 duplicate account/session을 만듭니다.",
    verification: "error matrix, state/issuer before detail, one-time consume, no-side-effect, URL/referrer/history/log/trace/artifact scans와 accessible restart UX를 실행합니다.",
    operations: "stable outcome/provider class/transaction age/retry count와 sink findings를 bounded metrics로 관찰하고 raw callback values는 기록하지 않습니다.",
    concepts: [c("callback problem taxonomy", "OAuth callback 실패를 public stable code, internal reason과 safe recovery action으로 분류한 목록입니다.", ["provider text를 노출하지 않습니다.", "client flow와 연결합니다."]), c("fresh authorization restart", "실패/만료 뒤 기존 code/state를 재사용하지 않고 새 state/verifier로 authorization request를 시작하는 복구입니다.", ["retry loop를 막습니다.", "user intent를 보존합니다."]), c("callback privacy", "authorization response의 code/state/error와 provider identity data가 browser/log/referrer/artifact에 최소화되도록 하는 정책입니다.", ["redaction과 retention을 둡니다.", "sink scan으로 검증합니다."])],
  }),
  appliedTopic({
    id: "oauth-flow-test-matrix", title: "authorization server emulator·browser·provider sandbox로 공격·장애 matrix를 실행합니다",
    lead: "service method mock 성공을 넘어서 malicious redirect/state/code/verifier/issuer, token/profile schema와 browser navigation을 실제 protocol로 검증합니다.",
    mechanism: "pure models는 state/PKCE, client integration은 callback/exchange, authorization-server emulator는 one-time code binding, browser E2E는 redirects/cookies/history, provider sandbox contract tests는 current deviations와 outage를 증명합니다.",
    workflow: "normal/deny/missing/mismatch/replay/expired/concurrent/mix-up/open-redirect/token-error/profile-error cases를 client type/provider/environment별로 생성하고 side effect와 sinks를 검증합니다.",
    invariants: "tests는 production credentials/accounts/endpoints를 사용하지 않고 deny/replay/mix-up 뒤 token/local session/account mutation이 0이며 cleanup이 원본/provider sandbox를 오염시키지 않습니다.",
    edgeCases: "two tabs, popup, reverse proxy, old browser/client, provider rate limit, malformed JSON, token timeout, key rotation와 telemetry outage를 포함합니다.",
    failureModes: "happy-path provider sandbox만 쓰면 attacker-controlled issuer/redirect/state와 deterministic concurrency/fault를 만들기 어렵고 external instability가 test signal을 흐립니다.",
    verification: "emulator known contracts, real browser captures, sandbox minimal smoke, local DB/session readback, secret/PII scans, cleanup and replay/retry counts를 실행합니다.",
    operations: "matrix coverage, provider/emulator/browser layers, unexpected session/account mutation, flaky external tests와 evidence age를 release gate로 관리합니다.",
    concepts: [c("authorization-server emulator", "authorization/code/token endpoints와 공격/fault cases를 deterministic하게 제공하는 owned test server입니다.", ["실제 provider를 대체하지 않습니다.", "negative tests에 유용합니다."]), c("provider sandbox", "provider가 제공하거나 격리한 test environment/account로 실제 contract를 확인하는 환경입니다.", ["production data를 쓰지 않습니다.", "rate/terms를 준수합니다."]), c("OAuth side-effect zero", "invalid/mismatched/replayed flow가 token, local session/account/link와 external mutation을 만들지 않는 불변식입니다.", ["response만 보지 않습니다.", "DB/session을 readback합니다."])],
    codeExamples: [node("security16-flow-matrix", "OAuth flow negative-matrix gate", "Security16FlowMatrix.mjs", "redirect/state/PKCE/issuer/code conditions에서 session issuance를 제한합니다.", String.raw`const cases = [
  ["normal", true, true, true, true, true],
  ["state-mismatch", true, false, true, true, false],
  ["pkce-mismatch", true, true, false, true, false],
  ["issuer-mixup", true, true, true, false, false],
  ["code-replay", false, true, true, true, false],
];
for (const x of cases) { const issued = x[1] && x[2] && x[3] && x[4]; console.log(x[0] + "|issued=" + issued + "|expected=" + x[5]); }
console.log("unexpected=" + cases.filter(x => (x[1] && x[2] && x[3] && x[4]) !== x[5]).length);`, "normal|issued=true|expected=true\nstate-mismatch|issued=false|expected=false\npkce-mismatch|issued=false|expected=false\nissuer-mixup|issued=false|expected=false\ncode-replay|issued=false|expected=false\nunexpected=0", ["spring-oauth-login", "spring-authorized-client", "rfc7636", "rfc9207", "owasp-oauth"])],
  }),
  appliedTopic({
    id: "oauth-rollout-operations", title: "provider registration·state store·PKCE/client changes를 canary·rollback으로 운영합니다",
    lead: "client secret/redirect/provider contract와 callback state schema가 frontend/backend/provider console에 걸쳐 있으므로 revisioned configuration과 old transaction compatibility가 필요합니다.",
    mechanism: "새 redirect/client registration은 verify-before-use, secrets/keys는 overlap rotation, state records는 versioned readers, provider adapter는 shadow schema compare와 canary cohort를 사용합니다. rollback 후 already-issued codes/transactions/sessions를 reconcile합니다.",
    workflow: "registration readback→secret/key availability→offline/emulator tests→provider sandbox→internal/canary→traffic expansion→old redirect/client drain→secret retire→transaction cleanup/reconciliation을 수행합니다.",
    invariants: "fallback이 wildcard redirect/state bypass/PKCE plain/client-secret browser 노출이 아니고 old/new issuer/provider transactions를 명시적으로 분리하며 emergency change에 expiry/owner가 있습니다.",
    edgeCases: "provider console propagation delay, secret rollover, old SPA callback, rolling server, stale state store, DNS/TLS, provider outage/rate limit와 telemetry loss를 포함합니다.",
    failureModes: "코드만 rollback해도 provider registration/secret/state transactions/local sessions는 자동 복구되지 않고 장애 대응으로 state/PKCE를 끄면 account takeover 위험이 생깁니다.",
    verification: "registration/secret readback, old/new transaction differential, canary unexpected session/account, rollback, state cleanup, client/provider contract and sink scans를 rehearsal합니다.",
    operations: "registration/secret/state schema/adapters revisions, callback/exchange/profile SLI, security rejects, provider quotas, canary/rollback/reconciliation을 dashboard/runbook에 연결합니다.",
    concepts: [c("OAuth configuration provenance", "client registrations, redirects, auth methods와 secrets가 어떤 review/revision으로 환경에 배포됐는지 추적하는 정보입니다.", ["provider readback을 포함합니다.", "rotation owner를 둡니다."]), c("transaction compatibility", "old/new state/PKCE/callback schema records를 안전하게 읽고 각각의 validator로 처리하는 제한된 기간입니다.", ["version tag를 둡니다.", "종료 후 cleanup합니다."]), c("provider rollback", "application code뿐 아니라 registration/secrets/state transactions/sessions를 이전 안전 상태로 수렴시키는 절차입니다.", ["readback과 reconciliation이 필요합니다.", "wildcard 완화가 아닙니다."])],
    codeExamples: [node("security16-release-gate", "OAuth code-PKCE production gate", "Security16ReleaseGate.mjs", "redirect/state/PKCE/issuer/secret/privacy/rollback evidence로 release를 판정합니다.", String.raw`const evidence = { exactRedirects: true, stateReplayFindings: 0, pkceS256: true, issuerMixupsAccepted: 0, clientSecretsInBrowser: 0, negativeMatrix: 100, callbackLeaks: 0, providerReadback: true, rollbackVerified: true, ownerHandoff: true };
const pass = evidence.exactRedirects && evidence.stateReplayFindings === 0 && evidence.pkceS256 && evidence.issuerMixupsAccepted === 0 && evidence.clientSecretsInBrowser === 0 && evidence.negativeMatrix === 100 && evidence.callbackLeaks === 0 && evidence.providerReadback && evidence.rollbackVerified && evidence.ownerHandoff;
for (const [key,value] of Object.entries(evidence)) console.log(key + "=" + value);
console.log("release=" + (pass ? "pass" : "block"));`, "exactRedirects=true\nstateReplayFindings=0\npkceS256=true\nissuerMixupsAccepted=0\nclientSecretsInBrowser=0\nnegativeMatrix=100\ncallbackLeaks=0\nproviderReadback=true\nrollbackVerified=true\nownerHandoff=true\nrelease=pass", ["rfc6749", "rfc7636", "rfc8252", "rfc9207", "rfc9700", "oidc-core", "oauth-browser-bcp", "spring-oauth-login", "nist-ssdf"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-oauth-config", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/config/OAuthConfig.java", usedFor: ["provider configuration source boundary"], evidence: "2026-07-14 read-only sanitized audit: 54 lines, 1,633 bytes, SHA-256 36D2B64133DD2816EC0EC47FD76FA00BED77DE3F0B0F4AE830A154962F296DD2. 실제 client IDs/secrets/endpoints/redirect URIs는 복사하지 않았습니다." },
  { id: "local-kakao-service", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/members/service/KakaoOAuthService.java", usedFor: ["provider-A code exchange/profile flow shape"], evidence: "2026-07-14 read-only sanitized audit: 96 lines, 4,065 bytes, SHA-256 9C7A55CF9972E4D5DF4661123A66D93CDC20B002CCAF6572A57A44352F364D91. 실제 provider endpoints/credentials/tokens/profile data는 복사하지 않았습니다." },
  { id: "local-naver-service", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/members/service/NaverOAuthService.java", usedFor: ["provider-B code exchange/profile flow shape"], evidence: "2026-07-14 read-only sanitized audit: 87 lines, 3,586 bytes, SHA-256 EFF0B45A481AD39989B9D878CAAA01CA06E2CC47ADA2701D7F6A6C4ED2FED23D. 실제 provider endpoints/credentials/tokens/profile data는 복사하지 않았습니다." },
  { id: "local-oauth-userinfo", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/members/vo/OAuthUserInfo.java", usedFor: ["local provider profile DTO shape"], evidence: "2026-07-14 read-only sanitized audit: 19 lines, 610 bytes, SHA-256 35A9E904F30E5C84089F7F14475DD15DDB54FAC7551DDBAA5DC8F62FD3004F29. 실제 user/provider values는 복사하지 않았습니다." },
  { id: "local-login-page", repository: "D:/dev/my-app03", path: "src/pages/LoginPage.jsx", usedFor: ["browser login/callback source shape"], evidence: "2026-07-14 read-only sanitized audit: 97 lines, 4,359 bytes, SHA-256 9F2817A1D28183C3967F9B21273D93397D8231B5D2EB5D62C952B4DBDEEA09A8. 실제 routes/provider/user values는 복사하지 않았습니다." },
  { id: "local-auth-api", repository: "D:/dev/my-app03", path: "src/api/Auth.jsx", usedFor: ["client auth HTTP/interceptor source context"], evidence: "2026-07-14 read-only sanitized audit: 156 lines, 5,591 bytes, SHA-256 6722BE000C762CE3ABE30E6BD54C358D48BB9173AA5A7B158519ED6F44866F64. 실제 endpoints/tokens/storage keys는 복사하지 않았습니다." },
  { id: "rfc6749", repository: "IETF RFC 6749", path: "rfc6749.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc6749.html", usedFor: ["OAuth roles, endpoints, authorization code and redirect semantics"], evidence: "OAuth 2.0 Authorization Framework 표준입니다." },
  { id: "rfc7636", repository: "IETF RFC 7636", path: "rfc7636.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc7636.html", usedFor: ["PKCE verifier/challenge/S256 semantics"], evidence: "Proof Key for Code Exchange 표준입니다." },
  { id: "rfc8252", repository: "IETF RFC 8252", path: "rfc8252.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc8252.html", usedFor: ["native/public client redirect and PKCE practices"], evidence: "OAuth 2.0 for Native Apps BCP입니다." },
  { id: "rfc9207", repository: "IETF RFC 9207", path: "rfc9207.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9207.html", usedFor: ["authorization response issuer identification/mix-up"], evidence: "OAuth 2.0 Authorization Server Issuer Identification 표준입니다." },
  { id: "rfc9700", repository: "IETF RFC 9700", path: "rfc9700.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9700.html", usedFor: ["OAuth security best current practice"], evidence: "Best Current Practice for OAuth 2.0 Security입니다." },
  { id: "oauth-browser-bcp", repository: "IETF OAuth Working Group", path: "draft-ietf-oauth-browser-based-apps", publicUrl: "https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps", usedFor: ["browser client/BFF/token architecture"], evidence: "IETF browser-based apps draft입니다; 적용 시 current revision/final publication을 다시 확인합니다." },
  { id: "oidc-core", repository: "OpenID Foundation", path: "openid-connect-core-1_0.html", publicUrl: "https://openid.net/specs/openid-connect-core-1_0.html", usedFor: ["OIDC ID Token, nonce, issuer/audience/subject semantics"], evidence: "OpenID Connect Core 1.0 specification입니다." },
  { id: "oidc-discovery", repository: "OpenID Foundation", path: "openid-connect-discovery-1_0.html", publicUrl: "https://openid.net/specs/openid-connect-discovery-1_0.html", usedFor: ["trusted issuer metadata/discovery"], evidence: "OpenID Connect Discovery 1.0 specification입니다." },
  { id: "spring-oauth-login", repository: "Spring Security reference", path: "servlet/oauth2/login/core.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/oauth2/login/core.html", usedFor: ["Spring OAuth2 Login authorization request/callback components"], evidence: "Spring Security 공식 OAuth2 Login core reference입니다." },
  { id: "spring-authorized-client", repository: "Spring Security reference", path: "servlet/oauth2/client/authorized-clients.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/oauth2/client/authorized-clients.html", usedFor: ["authorized client/token lifecycle context"], evidence: "Spring Security 공식 authorized client reference입니다." },
  { id: "owasp-oauth", repository: "OWASP Cheat Sheet Series", path: "OAuth2_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html", usedFor: ["OAuth redirect/state/PKCE security review"], evidence: "OWASP 공식 OAuth2 guidance입니다." },
  { id: "nist-ssdf", repository: "NIST SP 800-218", path: "sp/800/218/final", publicUrl: "https://csrc.nist.gov/pubs/sp/800/218/final", usedFor: ["configuration provenance, verification and recovery"], evidence: "NIST 공식 Secure Software Development Framework publication입니다." },
];

const session = createExpertSession({
  inventoryId: "oauth-01-authorization-code-flow", slug: "security-16-oauth-authorization-code-pkce", courseId: "devops", moduleId: "oauth-api-hardening", order: 1,
  title: "OAuth authorization code·PKCE·state·issuer", subtitle: "provider login source를 exact redirect, one-time state transaction, PKCE S256, issuer/nonce binding과 reversible provider operations로 강화합니다.",
  level: "고급", estimatedMinutes: 205,
  coreQuestion: "browser redirect를 거치는 OAuth code flow에서 session swapping, code interception, open redirect와 issuer mix-up 없이 올바른 client/provider transaction만 local identity/session으로 바꾸려면 무엇을 검증해야 할까요?",
  summary: "Boot4 OAuth config, 두 provider services와 profile DTO, my-app03 login/Auth sources 6개를 read-only·sanitized audit해 browser authorization→callback→exchange→profile→local session의 observed shape를 복원합니다. 실제 credentials, provider endpoints, redirect URIs, tokens와 user data는 복사하지 않으며 state/PKCE/issuer/account-linking 보장이 source에 완전 구현됐다고 과장하지 않습니다. OAuth roles/channels, exact registration/redirect, server-bound one-time state, PKCE S256 lifecycle, public/confidential/BFF exchange, issuer mix-up와 OIDC nonce, safe callback errors, emulator/browser/sandbox negative matrix와 configuration canary/rollback을 IETF·OpenID·Spring·OWASP·NIST 근거 및 아홉 executable models로 완성합니다.",
  objectives: ["local provider flow와 security gaps를 redacted audit한다.", "OAuth roles와 front/back channels를 구분한다.", "client registration과 redirect URI를 exact contract로 관리한다.", "state를 browser/provider/redirect transaction에 one-time bind한다.", "PKCE S256 verifier/challenge lifecycle을 구현한다.", "public SPA와 confidential BFF code exchange를 구분한다.", "issuer mix-up과 OIDC nonce/ID Token을 검증한다.", "callback errors/replay/privacy와 restart UX를 안전하게 처리한다.", "emulator/browser/provider sandbox negative matrix를 실행한다.", "registration/secret/state/client changes를 canary/rollback한다."],
  prerequisites: [{ title: "access·refresh·React token security capstone", reason: "OAuth exchange가 만든 provider/access/refresh/local credentials를 profile, storage, revoke, incident와 client state 관점에서 안전하게 수명 관리할 수 있어야 합니다.", sessionSlug: "security-15-token-security-capstone" }],
  keywords: ["OAuth 2.0", "authorization code", "PKCE", "S256", "state", "redirect URI", "public client", "confidential client", "BFF", "issuer mix-up", "nonce", "OIDC", "login CSRF", "callback privacy"],
  topics,
  lab: { title: "authorization-code+PKCE flow를 mix-up·replay·rollback까지 qualification하기", scenario: "원본은 변경하지 않고 synthetic clients/accounts와 owned authorization-server emulator, disposable Spring client/BFF와 separate browser origins에서 정상/공격/장애/provider canary를 재현합니다.", setup: ["Java 21/Spring Security OAuth2-compatible client fixture", "owned authorization/token/userinfo emulator", "three HTTPS browser origins and proxy emulator", "transactional one-time state/code store", "deterministic random/clock/fault injector", "synthetic client registrations and nonfunctional secrets", "provider sandbox minimal accounts where authorized", "원본 6 files read-only"], steps: ["원본 hashes와 browser→provider→callback→exchange→profile sequence를 redacted합니다.", "roles, front/back channels, credential visibility와 OAuth/OIDC boundaries를 diagram합니다.", "environment-specific exact redirect/client metadata와 safe local return-route IDs를 등록합니다.", "opaque state를 browser session/provider/client/redirect/PKCE/TTL에 bind하고 atomic consume합니다.", "CSPRNG verifier와 S256 challenge를 생성해 missing/wrong/replayed code exchange를 거부합니다.", "public client/BFF confidential exchange와 bundle/response/log secret scans를 실행합니다.", "multiple issuers에서 state+iss, discovery/JWKS와 OIDC nonce/iss/aud/azp/sub validation을 실행합니다.", "deny/error/reload/concurrent callbacks와 URL/referrer/log/artifact privacy를 검증합니다.", "emulator negative matrix, real browser captures와 provider sandbox contract smoke를 분리합니다.", "registration/secret/state schema canary, old transaction compatibility, rollback/reconciliation과 원본 unchanged를 완료합니다."], expectedResult: ["callback은 exact registered redirect와 one-time browser/provider transaction에만 연결됩니다.", "가로챈 code는 correct verifier/client/redirect 없이 교환되지 않고 code/state/verifier 재사용이 side effect를 만들지 않습니다.", "wrong issuer/nonce/audience/provider mix-up이 local identity/session/account mutation 전에 거부됩니다.", "public browser에 client secret/token callback details가 남지 않고 errors는 safe restart action을 제공합니다.", "provider registration/secret/state schema changes를 readback·canary·rollback하고 old transactions/sessions를 reconcile할 수 있습니다."], cleanup: ["synthetic clients/accounts/codes/state/verifier/token/profile와 local sessions를 폐기합니다.", "emulator, browser contexts/origins, proxy, clocks, stores, caches와 provider sandbox sessions를 종료합니다.", "captures/logs/artifacts를 credential/PII scan·redaction 후 retention policy에 따라 삭제합니다.", "원본 6 files hash/status unchanged를 확인합니다."], extensions: ["PAR/JAR/JARM을 authorization request/response integrity matrix에 추가합니다.", "DPoP sender-constrained tokens와 BFF session을 통합합니다.", "WebAuthn/step-up authentication과 OIDC acr/amr/max_age를 연결합니다.", "dynamic client registration과 federation metadata provenance를 qualification합니다."] },
  exercises: [
    { difficulty: "따라하기", prompt: "아홉 Node models를 실행하고 roles/redirect/state/PKCE/issuer/negative/rollout evidence에 대응시키세요.", requirements: ["stdout 완전 일치", "source sequence", "role map", "redirect policy", "state store", "PKCE", "issuer binding", "flow matrix", "release gate"], hints: ["Node models는 actual browser, TLS, authorization server, Spring client와 provider contract를 대체하지 않습니다."], expectedOutcome: "authorization transaction의 모든 binding과 실제 integration gap을 설명합니다.", solutionOutline: ["audit/roles→register/redirect→state/PKCE→issuer/errors/tests→rollout 순서입니다."] },
    { difficulty: "응용", prompt: "ad-hoc provider callback을 server-side state+PKCE+issuer-bound flow로 migration하세요.", requirements: ["client type", "exact redirect", "state transaction", "PKCE S256", "issuer/OIDC", "safe exchange/profile", "privacy/errors", "negative browser tests", "canary rollback"], hints: ["state를 단순 return URL이나 provider 문자열로 사용하지 마세요."], expectedOutcome: "login CSRF, interception, replay, open redirect와 mix-up을 차단하는 incremental migration이 완성됩니다.", solutionOutline: ["inventory→transaction store→PKCE/issuer binding→adapter/tests→canary/drain 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 OAuth client production standard를 작성하세요.", requirements: ["roles/client types", "registrations/redirects", "state/PKCE", "issuer/OIDC", "secrets/tokens", "errors/privacy", "testing", "provider operations/incident"], hints: ["provider별 sample URL보다 invariant, evidence와 recovery를 중심으로 작성하세요."], expectedOutcome: "새 provider/client도 같은 security contract와 qualification을 적용합니다.", solutionOutline: ["metadata provenance→transaction bindings→exchange/identity→evidence/operations 순서입니다."] },
  ],
  nextSessions: ["security-17-kakao-naver-provider-integration"], sources,
  sourceCoverage: { filesRead: 6, filesUsed: 6, uncoveredNotes: ["실제 client IDs/secrets, provider authorization/token/userinfo endpoints, redirect URIs, state/code/verifiers/tokens, local routes와 provider/user/profile data는 공개 content/examples/evidence에 복사하지 않았습니다.", "로컬 config/services/client flow를 authorization-code/provider profile shape로 관찰했지만 exact redirect, server-bound state, PKCE S256, issuer mix-up/OIDC validation과 robust account linking이 모두 구현됐다고 과장하지 않습니다.", "두 provider의 현재 console/settings/API contract는 provider 공식 문서와 sandbox registration readback으로 별도 qualification해야 하며 source snapshot의 literals를 최신 권고로 사용하지 않습니다.", "Node models는 actual CSPRNG/TLS/browser redirect, Spring OAuth2 components, authorization server/provider sandbox와 transactional code/state stores를 대체하지 않으므로 lab integration을 요구합니다."] },
});

export default session;
