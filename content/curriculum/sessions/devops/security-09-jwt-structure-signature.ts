import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const localCore = ["local-jwt-util", "local-jwt-config", "local-build", "local-app-config"];

const topics = [
  appliedTopic({
    id: "jwt-source-capability-audit",
    title: "로컬 JWT snapshot을 값 없는 capability·gap 표로 복원합니다",
    lead: "JWT API 이름만 읽지 않고 token kind, signing algorithm/key boundary, claims, validation rules, key rotation, logging sink와 dependency version을 source hash에 연결합니다.",
    mechanism: "read-only audit에서 local snapshot은 하나의 HMAC signing boundary와 같은 형태의 access/refresh issuance, subject·issued-at·expiration 중심 claims, signature/expiration 중심 parsing을 보여 줍니다. 이는 2026-07-14 학습 snapshot의 관찰이지 현재 표준 구현의 권고가 아닙니다.",
    workflow: "파일 hash→dependency/runtime→issuer profiles→header/claims→key source→verifier rules→credential sinks→rotation/recovery evidence 순으로 관찰과 설계 권고를 분리합니다.",
    invariants: "token, header, secret, subject, endpoint, payload와 환경 값은 복사하지 않고 line/byte/hash와 구조적 count만 남기며 source observation을 official requirement로 과장하지 않습니다.",
    edgeCases: "여러 issuer, 여러 token kind, old/new key overlap, unknown kid, missing claim, clock drift, malformed compact input와 logging failure를 포함합니다.",
    failureModes: "단일 happy-path decode 성공을 보안 증거로 쓰면 access/refresh 혼동, algorithm confusion, stale key, credential 노출과 dependency drift가 보이지 않습니다.",
    verification: "source hashes, dependency lock, issuer/profile matrix, secret-sink scan와 synthetic negative corpus를 독립 reviewer가 재현합니다.",
    operations: "source revision, key profile ID, verifier policy revision, redacted finding ID와 remediation owner를 기록하고 실제 credential 발견 시 즉시 노출 대응 절차로 전환합니다.",
    concepts: [
      c("capability audit", "현재 source가 발급·서명·검증·회전·폐기 중 무엇을 실제 구현하는지 값 없이 분류하는 감사입니다.", ["관찰과 권고를 분리합니다.", "hash로 snapshot을 고정합니다."]),
      c("token profile", "token kind별 issuer, audience, type, algorithm, claims와 lifetime의 상호 배타적 규칙 집합입니다.", ["access와 refresh를 분리합니다.", "verifier가 고정합니다."]),
      c("credential sink", "bearer credential이나 signing material이 log, trace, error, DB 또는 artifact로 흘러가는 지점입니다.", ["원문을 수집하지 않습니다.", "발견 즉시 차단·대응합니다."]),
    ],
    codeExamples: [node("security09-source-audit", "sanitized JWT capability audit", "Security09SourceAudit.mjs", "로컬 hash와 구조 관찰을 값 없는 capability 표로 검증합니다.", String.raw`const files = [
  ["jwt-util", 76, "305E21E9", "shared-signing-profile"],
  ["jwt-config", 24, "018CA97D", "validity-and-key-input"],
  ["build", 56, "CBF6CB4A", "snapshot-versions"],
  ["app-config", 41, "0D261E13", "placeholders-audited"],
];
for (const x of files) console.log(x.join("|"));
console.log("credential-values-copied=false");
console.log("snapshot-is-current-guidance=false");`, "jwt-util|76|305E21E9|shared-signing-profile\njwt-config|24|018CA97D|validity-and-key-input\nbuild|56|CBF6CB4A|snapshot-versions\napp-config|41|0D261E13|placeholders-audited\ncredential-values-copied=false\nsnapshot-is-current-guidance=false", localCore.concat(["local-jwt-learning", "local-secrets-learning", "rfc7519", "rfc7515", "rfc7517", "rfc7638", "rfc8414", "rfc8725", "rfc9068", "spring-jwt", "jjwt-0115", "owasp-jwt", "owasp-secrets"]))],
  }),
  appliedTopic({
    id: "jwt-compact-serialization",
    title: "JWT·JWS·JWE와 compact serialization을 byte 경계에서 구분합니다",
    lead: "점으로 나뉜 문자열을 암호화된 안전한 데이터로 오해하지 않고 protected header, payload와 signature가 어떤 bytes를 표현하는지 추적합니다.",
    mechanism: "JWT는 claims를 전달하는 형식이고 JWS는 서명 또는 MAC, JWE는 암호화를 제공합니다. 일반적인 signed compact JWS는 base64url protected header, payload, signature의 세 segment이며 앞의 두 segment를 점으로 연결한 ASCII bytes가 signing input입니다.",
    workflow: "segment count/size 제한→base64url syntax→UTF-8 JSON parse→duplicate/member policy→profile header/claims→signature verification 순서를 고정하고 parse 결과를 신뢰하기 전에 cryptographic verification을 완료합니다.",
    invariants: "base64url은 암호화가 아니며 unsigned header/payload preview는 display hint일 뿐 authorization input이 아니고 원본 segment bytes를 재직렬화해 signing input을 만들지 않습니다.",
    edgeCases: "padding, non-canonical encoding, invalid UTF-8, oversized segment, duplicate claim, nested JWT, detached payload와 JWE 5-segment input을 구분합니다.",
    failureModes: "decoded payload가 읽힌다는 이유로 진짜라고 믿거나 parsed object를 다시 JSON stringify해 검증하면 attacker-controlled data 사용 또는 byte mismatch가 생깁니다.",
    verification: "원본 compact bytes와 signing input hex, malformed corpus, size/time limits, duplicate-member policy와 JWS/JWE 분류를 test합니다.",
    operations: "raw token은 log하지 않고 parse stage와 stable reason code, bounded length bucket, profile ID만 수집합니다.",
    concepts: [
      c("JWT", "JSON claims를 당사자 사이에 전달하기 위한 compact representation입니다.", ["JWS 또는 JWE 안에 실릴 수 있습니다.", "내용 공개 여부와 진위는 별도 속성입니다."]),
      c("JWS signing input", "BASE64URL(protected header)와 BASE64URL(payload)를 점으로 연결한 정확한 ASCII octets입니다.", ["원본 segment를 사용합니다.", "JSON 재직렬화를 하지 않습니다."]),
      c("base64url", "binary를 URL-safe alphabet 문자열로 표현하는 encoding입니다.", ["기밀성을 제공하지 않습니다.", "decode 전에 크기를 제한합니다."]),
    ],
    codeExamples: [node("security09-compact-model", "compact JWS structural parser", "Security09CompactModel.mjs", "실제 credential 없이 synthetic segment label로 JWS/JWE 구조와 signing input을 분류합니다.", String.raw`function classify(value) {
  const parts = value.split(".");
  if (parts.some(x => x.length === 0)) return "reject:empty-segment";
  if (parts.length === 3) return "jws|signing-input=" + parts.slice(0, 2).join(".");
  if (parts.length === 5) return "jwe";
  return "reject:segment-count";
}
for (const value of ["header.payload.signature", "protected.key.iv.ciphertext.tag", "a..c", "a.b"]) {
  console.log(classify(value));
}`, "jws|signing-input=header.payload\njwe\nreject:empty-segment\nreject:segment-count", ["rfc7519", "rfc7515"])],
  }),
  appliedTopic({
    id: "jwt-json-byte-boundary",
    title: "JSON member와 signature bytes 사이의 canonicalization 함정을 차단합니다",
    lead: "논리적으로 같은 JSON object라도 whitespace, member order와 Unicode encoding이 달라지면 JWS bytes가 달라짐을 이해하고 verifier가 원문 signing input을 사용하게 합니다.",
    mechanism: "JWS는 semantic object가 아니라 protected header/payload의 encoded octets에 서명합니다. parser가 duplicate member를 마지막 값으로 덮어쓰는지 거부하는지도 security policy이며 producer와 verifier가 다르면 claim smuggling이 가능합니다.",
    workflow: "raw segment 보존→bounded decode→strict UTF-8→duplicate detection→JSON type validation→profile validation을 수행하되 signature input은 raw segments에서 만듭니다.",
    invariants: "검증 전 claims를 business logic에 쓰지 않고 duplicate security-relevant member를 거부하며 number/string/null coercion을 하지 않습니다.",
    edgeCases: "동일 key 중복, exponent number, negative NumericDate, Unicode normalization, BOM, trailing bytes와 deeply nested object를 포함합니다.",
    failureModes: "서로 다른 parser가 첫 값과 마지막 값을 선택하면 issuer/audience/type 해석이 갈려 한 component가 허용한 token을 다른 component가 다른 의미로 처리합니다.",
    verification: "byte-different semantic-equivalent fixtures와 duplicate/conflicting claim corpus를 모든 gateway/resource verifier에서 같은 결과로 실행합니다.",
    operations: "parser/version/profile revision과 reject reason만 남기고 decoded payload 전체를 telemetry에 넣지 않습니다.",
    concepts: [
      c("octet integrity", "서명이 의미 객체가 아니라 정확한 byte sequence를 보호한다는 성질입니다.", ["raw signing input을 보존합니다.", "재직렬화를 피합니다."]),
      c("duplicate member policy", "JSON object에 같은 이름이 반복될 때 거부 또는 일관된 처리 방식을 강제하는 규칙입니다.", ["security claims는 거부가 안전합니다.", "parser parity를 test합니다."]),
    ],
    codeExamples: [node("security09-signing-input", "signing input byte identity", "Security09SigningInput.mjs", "원본 segment와 재구성된 문자열의 byte identity 차이를 보여 줍니다.", String.raw`const original = "eyJ6IjoxLCJhIjoyfQ.payload";
const rebuilt = "eyJhIjoyLCJ6IjoxfQ.payload";
const originalHex = Buffer.from(original, "ascii").toString("hex");
const rebuiltHex = Buffer.from(rebuilt, "ascii").toString("hex");
console.log("same-text=" + (original === rebuilt));
console.log("same-bytes=" + (originalHex === rebuiltHex));
console.log("verify-input=original-segments");`, "same-text=false\nsame-bytes=false\nverify-input=original-segments", ["rfc7515", "rfc8725"])],
  }),
  appliedTopic({
    id: "jwt-mac-signature-trust",
    title: "MAC shared secret와 asymmetric signature의 trust·blast-radius를 구분합니다",
    lead: "HS256과 RS/ES 계열을 단순 속도 선택으로 보지 않고 누가 발급할 수 있고 누가 검증만 할 수 있는지, key compromise가 어디까지 확산되는지 설계합니다.",
    mechanism: "HMAC verifier는 같은 secret을 알아야 하므로 검증자도 token을 위조할 수 있습니다. asymmetric verifier는 public key만 배포해 issuer private key와 resource-server verification 권한을 분리할 수 있습니다.",
    workflow: "issuer/verifier actors→token profile→trust domain→key ownership→distribution→rotation→compromise blast radius를 그린 뒤 algorithm을 고릅니다.",
    invariants: "검증 전용 component에 발급 권한을 주지 않고 한 key를 서로 다른 algorithm/purpose/profile에 재사용하지 않으며 private/symmetric material은 secret manager 경계를 벗어나지 않습니다.",
    edgeCases: "monolith single trust domain, 여러 resource servers, offline jobs, HSM/KMS, disaster recovery, multi-region과 third-party issuer를 포함합니다.",
    failureModes: "public key bytes를 HMAC secret으로 오해하는 HS/RS confusion이나 모든 서비스에 shared secret을 복제하는 구조는 한 verifier compromise를 전체 issuer compromise로 확대합니다.",
    verification: "actor별 가능한 operation matrix, key access IAM, signing/verification negative tests와 compromise tabletop을 실행합니다.",
    operations: "key material 대신 opaque key version/profile, sign/verify failure counts, rotation age와 access audit event만 관찰합니다.",
    concepts: [
      c("MAC", "공유 secret으로 authenticity와 integrity를 검증하는 message authentication code입니다.", ["검증자도 생성 가능합니다.", "trust domain이 공유됩니다."]),
      c("digital signature", "private key로 서명하고 public key로 검증하는 비대칭 구조입니다.", ["발급과 검증 권한을 분리합니다.", "public key 배포가 가능합니다."]),
      c("blast radius", "key compromise가 위조·검증·서비스 범위에 미치는 최대 영향입니다.", ["profile별로 제한합니다.", "복구 절차를 설계합니다."]),
    ],
  }),
  appliedTopic({
    id: "jwt-algorithm-confusion",
    title: "algorithm allowlist와 key-alg binding으로 alg confusion을 막습니다",
    lead: "token header의 alg를 신뢰해 verifier를 선택하지 않고 deployment가 기대하는 profile에서 algorithm과 key type을 먼저 고정합니다.",
    mechanism: "RFC 8725는 application이 허용 algorithm을 명시하고 각 key가 정확히 한 algorithm과 함께 쓰이도록 요구합니다. none 거부만으로 충분하지 않고 HS/RS key confusion, weak/deprecated algorithm과 library default drift를 함께 막아야 합니다.",
    workflow: "trusted issuer/profile 선택→fixed alg allowlist→key metadata alg/use/kty 확인→cryptographic verify→claims profile 순서로 처리합니다.",
    invariants: "untrusted alg는 dispatch input이 아니며 profile allowlist에 없는 값, key metadata와 불일치, none과 ambiguous key는 signature 연산 전에 거부합니다.",
    edgeCases: "missing alg, mixed-case/unknown values, duplicated header, key without alg metadata, migration overlap과 library upgrade default 변화를 포함합니다.",
    failureModes: "decode한 header가 말하는 algorithm에 맞춰 같은 bytes를 다른 key type으로 재해석하면 attacker가 신뢰 모델을 바꿀 수 있습니다.",
    verification: "allowed pair positive fixture와 none/wrong alg/wrong kty/wrong use/wrong issuer negative matrix를 모든 verifier에 실행합니다.",
    operations: "stable reason code와 profile/policy revision을 기록하고 attacker-provided alg/kid 원문은 bounded/redacted 형태로만 집계합니다.",
    concepts: [
      c("algorithm allowlist", "verifier deployment가 token 외부에서 정한 허용 algorithm 집합입니다.", ["profile별로 좁힙니다.", "none은 거부합니다."]),
      c("key-alg binding", "하나의 key가 의도한 algorithm·use·profile에서만 사용되도록 묶는 규칙입니다.", ["metadata와 config로 강제합니다.", "cross-use를 막습니다."]),
    ],
    codeExamples: [node("security09-alg-policy", "algorithm and key-type allowlist", "Security09AlgPolicy.mjs", "header 요청과 trusted profile의 algorithm/key metadata가 모두 맞을 때만 선택합니다.", String.raw`const profile = { alg: "RS256", kty: "RSA", use: "sig" };
function select(header, key) {
  if (header.alg !== profile.alg) return "reject:alg";
  if (key.kty !== profile.kty) return "reject:kty";
  if (key.use !== profile.use) return "reject:use";
  return "accept:key-selected";
}
console.log(select({ alg: "RS256" }, { kty: "RSA", use: "sig" }));
console.log(select({ alg: "HS256" }, { kty: "RSA", use: "sig" }));
console.log(select({ alg: "RS256" }, { kty: "oct", use: "sig" }));
console.log(select({ alg: "RS256" }, { kty: "RSA", use: "enc" }));`, "accept:key-selected\nreject:alg\nreject:kty\nreject:use", ["rfc8725", "rfc9068", "owasp-jwt"])],
  }),
  appliedTopic({
    id: "jwt-signing-key-lifecycle",
    title: "signing key의 생성·보관·접근·회전·폐기를 credential lifecycle로 운영합니다",
    lead: "충분한 entropy의 key를 만드는 것뿐 아니라 charset 변환, config injection, secret manager, least privilege, backup, rotation과 compromise recovery를 하나의 lifecycle로 다룹니다.",
    mechanism: "symmetric key는 algorithm 요구 길이 이상의 random bytes여야 하고 사람이 정한 문구나 무의식적 getBytes 변환은 key derivation이 아닙니다. asymmetric private key는 KMS/HSM 또는 제한된 issuer boundary에 두고 public verification material만 배포합니다.",
    workflow: "generate→label/profile bind→secret store→runtime identity access→memory use→overlap rotation→retire→destroy→audit를 자동화합니다.",
    invariants: "key 원문이 source, image, CI output, exception, heap dump와 일반 logs에 없고 access는 issuer workload와 break-glass owner로 제한되며 rotation과 rollback이 시험됩니다.",
    edgeCases: "secret manager outage, cold start, multi-region propagation, restore from backup, rollback artifact, emergency key compromise와 clock skew를 포함합니다.",
    failureModes: "환경 변수 placeholder가 있다는 사실만으로 안전하다고 결론 내리거나 old key를 즉시 삭제하면 verifier outage가 생기고, 무기한 보존하면 compromise window가 커집니다.",
    verification: "secret scanning, runtime identity/IAM, key age, rotation drill, old/new verification overlap와 retirement readback을 실행합니다.",
    operations: "key ID/version과 access event만 기록하고 key bytes·token·decoded claims를 절대로 log하지 않습니다.",
    concepts: [
      c("key lifecycle", "cryptographic key를 생성부터 파기까지 통제하는 상태 전이입니다.", ["owner와 rotation SLO를 둡니다.", "복구를 연습합니다."]),
      c("secret manager boundary", "key material을 versioned storage와 workload identity로 제한하는 운영 경계입니다.", ["source와 분리합니다.", "access를 감사합니다."]),
      c("overlap window", "새 token은 새 key로 발급하면서 기존 유효 token은 old public key로 검증하는 제한된 기간입니다.", ["최대 token lifetime을 반영합니다.", "retirement가 끝납니다."]),
    ],
  }),
  appliedTopic({
    id: "jwt-header-key-selection",
    title: "typ·kid·crit와 remote key header를 비신뢰 입력으로 처리합니다",
    lead: "kid는 key 자체가 아니라 trusted issuer의 bounded key set 안에서 후보를 찾는 hint이며 typ는 profile 분리 신호, crit는 이해하지 못하면 거부해야 하는 확장 계약입니다.",
    mechanism: "protected header도 signature가 검증되기 전까지 공격자 입력입니다. jku/x5u를 임의 URL fetch에 사용하면 SSRF와 attacker-controlled key substitution이 가능하므로 issuer metadata/config에서 신뢰한 JWKS 위치만 사용합니다.",
    workflow: "bounded header parse→profile typ check→trusted issuer configuration→local cached JWKS→kid exact match→alg/use/kty binding→verify를 수행하고 unrecognized crit는 거부합니다.",
    invariants: "kid를 파일/SQL/URL에 직접 연결하지 않고 remote header URL을 fetch하지 않으며 duplicate kid, unknown crit, missing required typ와 ambiguous key match는 fail closed입니다.",
    edgeCases: "unknown kid during rotation, kid reuse, Unicode/path-like kid, duplicate JWKS members, missing kid with one key와 nested JWT를 포함합니다.",
    failureModes: "kid를 string concatenation으로 filesystem path나 query에 넣거나 jku를 따라가면 key selection이 injection/SSRF 경계가 됩니다.",
    verification: "unknown/duplicate/path-like kid, untrusted jku/x5u, unsupported crit와 wrong typ를 network egress가 0인 fixture에서 test합니다.",
    operations: "kid 원문 대신 allowlisted key version과 reason code를 남기고 unknown-kid burst는 issuer/rotation incident와 공격 모두를 고려해 rate limit합니다.",
    concepts: [
      c("kid", "trusted key set 안에서 검증 후보를 식별하는 protected-header hint입니다.", ["신뢰의 근원이 아닙니다.", "bounded exact match만 허용합니다."]),
      c("typ", "JWT kind를 명시해 서로 다른 validation profile을 선택·분리하는 media type hint입니다.", ["RFC 8725의 explicit typing을 적용합니다.", "claims 규칙과 함께 검증합니다."]),
      c("crit", "이해해야만 처리 가능한 header extension 이름 목록입니다.", ["모르면 거부합니다.", "지원 목록을 고정합니다."]),
    ],
    codeExamples: [node("security09-kid-selection", "bounded kid key selection", "Security09KidSelection.mjs", "trusted registry 안에서 kid·alg·use·kty가 한 key와 정확히 일치하는지 모델링합니다.", String.raw`const keys = [
  { kid: "v-current", alg: "RS256", use: "sig", kty: "RSA" },
  { kid: "v-previous", alg: "RS256", use: "sig", kty: "RSA" },
];
function choose(h) {
  if (h.jku) return "reject:remote-header-url";
  const matches = keys.filter(k => k.kid === h.kid);
  if (matches.length !== 1) return "reject:kid";
  const k = matches[0];
  return k.alg === h.alg && k.use === "sig" && k.kty === "RSA" ? "accept:" + k.kid : "reject:metadata";
}
console.log(choose({ kid: "v-current", alg: "RS256" }));
console.log(choose({ kid: "unknown", alg: "RS256" }));
console.log(choose({ kid: "v-current", alg: "HS256" }));
console.log(choose({ kid: "v-current", alg: "RS256", jku: "untrusted" }));`, "accept:v-current\nreject:kid\nreject:metadata\nreject:remote-header-url", ["rfc7515", "rfc7517", "rfc8725"])],
  }),
  appliedTopic({
    id: "jwt-jwks-thumbprint",
    title: "JWK·JWKS와 thumbprint를 issuer-bound trust data로 다룹니다",
    lead: "JWK의 kty, use, key_ops, alg와 kid를 읽고 RFC 7638 thumbprint가 무엇을 동일성 근거로 제공하며 무엇을 제공하지 않는지 구분합니다.",
    mechanism: "JWKS는 JWK들의 set이고 public verification key 배포에 쓰입니다. thumbprint는 필요한 members의 canonical representation hash로 key material identity를 제공하지만 issuer authorization, freshness, intended audience나 revocation을 스스로 증명하지 않습니다.",
    workflow: "issuer metadata/config trust→TLS fetch→size/schema 제한→JWK public-only validation→kid/alg/use/kty/profile binding→cache/version→thumbprint inventory를 수행합니다.",
    invariants: "resource server는 issuer별 JWKS를 섞지 않고 private/symmetric material이 public JWKS에 노출되지 않으며 duplicate/ambiguous key와 unsupported curves/parameters를 거부합니다.",
    edgeCases: "same key different kid, same kid different key, missing use/alg, x5c chain, duplicate modulus, malformed coordinates와 oversized set을 포함합니다.",
    failureModes: "thumbprint가 같으니 모든 issuer에서 신뢰하거나 kid만 같으니 동일 key라고 판단하면 issuer-key binding을 잃습니다.",
    verification: "issuer/JWKS mapping, schema/size bounds, duplicate identity/kid, thumbprint inventory와 TLS/cache behavior를 test합니다.",
    operations: "issuer profile, JWKS version, bounded key count와 thumbprint prefix 같은 비밀이 아닌 식별자만 사용합니다.",
    concepts: [
      c("JWK", "cryptographic key와 kty/use/alg 등 metadata를 JSON으로 표현하는 형식입니다.", ["public distribution에 쓸 수 있습니다.", "metadata도 검증합니다."]),
      c("JWKS", "하나 이상의 JWK를 담는 JSON key set입니다.", ["issuer에 bind합니다.", "cache·rotation을 운영합니다."]),
      c("JWK thumbprint", "정해진 members의 canonical JSON hash로 key material을 식별하는 값입니다.", ["trust anchor 자체가 아닙니다.", "issuer/profile과 함께 씁니다."]),
    ],
  }),
  appliedTopic({
    id: "jwt-key-rotation",
    title: "JWKS cache·unknown kid·overlap으로 무중단 key rotation을 설계합니다",
    lead: "새 private key로 발급을 전환하기 전에 verifier가 새 public key를 받을 수 있게 하고 old token의 최대 검증 기간 뒤 old key를 제거합니다.",
    mechanism: "rotation은 publish new verification key→cache propagation 확인→issuer signing switch→old/new concurrent verify→old token expiry/revoke window→old key retirement의 순서입니다. unknown kid는 한 번 bounded refresh할 수 있지만 token마다 무제한 fetch하면 DoS가 됩니다.",
    workflow: "key state planned/published/signing/verifying-only/retired/compromised와 각 전이의 owner, cache TTL, health probe, rollback trigger를 정의합니다.",
    invariants: "어느 순간에도 valid token을 검증할 key가 모든 verifier에 있고 issuer는 published/propagated key로만 서명하며 unknown-kid refresh는 coalesced·rate-limited입니다.",
    edgeCases: "stale CDN, partial region rollout, simultaneous app rollback, issuer/JWKS outage, compromised old/current key와 emergency revoke를 포함합니다.",
    failureModes: "signing switch와 JWKS publish 순서를 뒤집으면 401 폭증이 생기고, old key를 무기한 남기면 탈취 key의 위조 기간이 끝나지 않습니다.",
    verification: "각 rotation phase에서 old/new/future/unknown kid matrix, cache headers, offline startup, rollback과 compromise drill을 실행합니다.",
    operations: "unknown-kid rate, JWKS refresh result/age, active signing version, verification version distribution과 401 change point를 관찰합니다.",
    concepts: [
      c("key rotation", "발급 key를 새 version으로 안전하게 바꾸고 이전 key를 제한된 기간 뒤 폐기하는 과정입니다.", ["publish가 signing보다 먼저입니다.", "retirement가 완료됩니다."]),
      c("JWKS cache", "trusted issuer의 public key set을 TTL과 refresh policy로 보관하는 verifier state입니다.", ["outage 내성을 줍니다.", "staleness를 제한합니다."]),
      c("unknown-kid coalescing", "동시에 발생한 unknown kid 요청이 한 번의 bounded refresh를 공유하도록 하는 제어입니다.", ["fetch storm을 막습니다.", "negative cache를 제한합니다."]),
    ],
    codeExamples: [node("security09-rotation", "key rotation overlap state machine", "Security09Rotation.mjs", "publish, switch, overlap, retire 순서에서 발급/검증 key 집합을 계산합니다.", String.raw`const phases = [
  ["publish", "old", ["old", "new"]],
  ["switch", "new", ["old", "new"]],
  ["overlap", "new", ["old", "new"]],
  ["retire", "new", ["new"]],
];
for (const [phase, signs, verifies] of phases) {
  console.log(phase + "|sign=" + signs + "|verify=" + verifies.join(","));
}
console.log("publish-before-switch=" + (phases[0][2].includes("new") && phases[1][1] === "new"));`, "publish|sign=old|verify=old,new\nswitch|sign=new|verify=old,new\noverlap|sign=new|verify=old,new\nretire|sign=new|verify=new\npublish-before-switch=true", ["rfc7517", "rfc8414", "spring-jwt"])],
  }),
  appliedTopic({
    id: "jwt-cross-token-confusion",
    title: "access·refresh·ID token을 explicit type와 mutually exclusive rules로 분리합니다",
    lead: "서명 key와 subject가 맞다는 공통점만으로 서로 다른 JWT kind가 다른 endpoint에서 받아들여지지 않도록 type, audience, issuer, claims와 key profile을 분리합니다.",
    mechanism: "RFC 8725는 다른 종류 JWT에 explicit typing과 상호 배타적 validation rules를 권고합니다. RFC 9068 access-token profile은 at+jwt type과 resource audience 같은 access 전용 조건을 정의하므로 refresh/ID/session token과 교환 가능하지 않습니다.",
    workflow: "token kind inventory→profile별 typ/issuer/audience/alg/key/claims/lifetime→endpoint accepted profile→negative cross-kind matrix를 작성합니다.",
    invariants: "각 verifier는 정확히 한 intended profile을 고정하고 wrong/missing type, wrong audience, refresh-only/access-only claims와 다른 issuer/key를 signature가 유효해도 거부합니다.",
    edgeCases: "legacy token without typ, nested token, OAuth ID token, logout token, service token, migration overlap와 gateway-resigned token을 포함합니다.",
    failureModes: "local snapshot처럼 access와 refresh가 같은 key·algorithm·claim shape이고 공통 parser가 subject만 반환하면 refresh token이 access 경계에서 구조적으로 구별되지 않을 수 있습니다.",
    verification: "모든 token kind를 모든 verifier에 투입해 diagonal만 accept하는 cross-product test와 migration telemetry를 실행합니다.",
    operations: "profile ID와 cross-kind reject count를 기록하되 token 원문·subject·claims는 기록하지 않습니다.",
    concepts: [
      c("cross-JWT confusion", "한 종류로 발급된 JWT가 다른 종류의 verifier에서 잘못 수용되는 문제입니다.", ["type/profile을 분리합니다.", "negative matrix로 검증합니다."]),
      c("mutually exclusive validation", "서로 다른 token kind가 같은 검증 규칙을 모두 통과할 수 없게 만드는 규칙입니다.", ["typ·aud·claims·key를 조합합니다.", "endpoint가 profile을 고정합니다."]),
    ],
    codeExamples: [node("security09-type-matrix", "cross-token type separation matrix", "Security09TypeMatrix.mjs", "profile별 expected typ/audience가 일치하는 경우만 수용합니다.", String.raw`const profiles = {
  access: { typ: "at+jwt", aud: "resource" },
  refresh: { typ: "refresh+jwt", aud: "token-service" },
  identity: { typ: "id+jwt", aud: "client" },
};
function accepts(verifier, token) {
  const p = profiles[verifier];
  return p.typ === token.typ && p.aud === token.aud;
}
for (const verifier of Object.keys(profiles)) {
  const row = Object.entries(profiles).map(([kind, token]) => kind + ":" + accepts(verifier, token));
  console.log(verifier + "|" + row.join(","));
}`, "access|access:true,refresh:false,identity:false\nrefresh|access:false,refresh:true,identity:false\nidentity|access:false,refresh:false,identity:true", ["rfc8725", "rfc9068", "local-jwt-util"])],
  }),
  appliedTopic({
    id: "jwt-library-version-boundary",
    title: "JJWT 0.11.5·Spring Boot 4 snapshot을 migration evidence로 다룹니다",
    lead: "로컬 build에 적힌 JJWT 0.11.5와 Spring Boot 4.0.6을 현재 best practice라고 부르지 않고, 실제 API behavior·dependency compatibility·security guidance를 migration 전에 다시 고정합니다.",
    mechanism: "library는 parsing API, default constraints, supported algorithms와 exception classes를 제공하지만 issuer/audience/type/key trust policy를 대신 설계하지 않습니다. version이 달라지면 parser builder와 key API뿐 아니라 transitive Jackson, provider와 runtime behavior도 달라질 수 있습니다.",
    workflow: "현재 build/hash→official tag/release notes→supported runtime matrix→SBOM/advisories→contract tests→staged dependency update→production-like readback 순으로 진행합니다.",
    invariants: "dependency upgrade와 policy redesign을 한 번에 숨기지 않고 old/new verifier가 같은 approved/negative corpus 결과를 내며 실제 token/secret fixture를 저장소에 커밋하지 않습니다.",
    edgeCases: "split JJWT api/impl/jackson versions, classpath duplicate, provider change, FIPS constraints, native image, serialization drift와 rollback artifact를 포함합니다.",
    failureModes: "최신으로 보이는 version 문자열만 보고 안전하다고 결론 내리거나 예전 blog API를 복사하면 runtime linkage failure와 validation gap이 동시에 생깁니다.",
    verification: "dependency insight/SBOM, official tag docs, clean build, algorithm/key/claims negative corpus와 old/new behavior differential을 실행합니다.",
    operations: "library/runtime/SBOM revision, verifier policy revision과 canary error rate를 함께 관찰하고 rollback artifact를 immutable하게 보존합니다.",
    concepts: [
      c("version boundary", "source snapshot의 dependency behavior와 현재 공식 guidance 사이를 명시적으로 다시 검증하는 경계입니다.", ["tag를 고정합니다.", "현재성을 과장하지 않습니다."]),
      c("contract corpus", "library version과 무관하게 동일해야 하는 positive/negative token-profile 결과 집합입니다.", ["synthetic fixtures를 씁니다.", "upgrade differential에 사용합니다."]),
    ],
  }),
  appliedTopic({
    id: "jwt-release-incident-gate",
    title: "signature subsystem을 test·telemetry·incident recovery gate로 완성합니다",
    lead: "한 valid token 성공 테스트가 아니라 malformed, wrong alg/key/type, stale JWKS, rotation, credential sink와 compromise recovery를 release 조건으로 만듭니다.",
    mechanism: "cryptographic positive/negative vectors, parser/resource integration, rotation chaos, secret-sink scan와 production-like canary가 서로 다른 실패를 잡습니다. credential 값이 log에 노출됐다면 코드 수정만으로 끝나지 않고 token revoke, key rotate 필요성 평가, log purge/retention, downstream readback과 incident 기록이 필요합니다.",
    workflow: "policy manifest→synthetic corpus→library integration→Spring resource server→JWKS/rotation fault→logs/traces/artifacts scan→canary→rollback/incident drill을 실행합니다.",
    invariants: "unknown/ambiguous input은 fail closed이고 raw credential/key/claims는 모든 sinks에서 0이며 key compromise recovery time과 old-key retirement가 측정됩니다.",
    edgeCases: "log pipeline retry, APM capture, proxy dump, partial JWKS outage, region clock skew, old artifact rollback와 incident 동안의 emergency key set을 포함합니다.",
    failureModes: "검증 실패 수만 alert하면 공격과 issuer outage/rotation 실수를 구분하지 못하고 raw token을 debug log에 추가하면 관측이 곧 credential 유출이 됩니다.",
    verification: "release evidence를 machine-readable gate로 재계산하고 한 control을 의도적으로 실패시켜 block과 recovery runbook이 실제 작동하는지 봅니다.",
    operations: "bounded reject reason, issuer/profile/policy/key version, JWKS age와 recovery milestones만 수집하며 high-cardinality attacker input은 저장하지 않습니다.",
    concepts: [
      c("signature release gate", "algorithm/key/profile/rotation/secret-sink evidence가 기준을 만족할 때만 배포하는 정책입니다.", ["machine-readable합니다.", "rollback을 포함합니다."]),
      c("credential incident recovery", "노출 가능 credential을 revoke/rotate하고 복사본을 purge하며 downstream 상태를 확인하는 절차입니다.", ["원문을 재수집하지 않습니다.", "readback을 남깁니다."]),
      c("cryptographic agility", "정책과 key profile을 통제된 migration으로 바꾸고 이전 알고리즘/키를 종료할 수 있는 능력입니다.", ["dual-accept 기간을 제한합니다.", "downgrade를 막습니다."]),
    ],
    codeExamples: [node("security09-release-gate", "JWT signature release evidence gate", "Security09ReleaseGate.mjs", "policy, negative corpus, rotation, sink scan와 recovery evidence를 함께 판정합니다.", String.raw`const evidence = {
  algNegativePass: true,
  crossTypeRejects: 6,
  expectedCrossTypeRejects: 6,
  unknownKidFetchesPerBurst: 1,
  rawCredentialFindings: 0,
  rotationPass: true,
  compromiseDrillPass: true,
  snapshotCurrentClaimed: false,
};
const pass = evidence.algNegativePass &&
  evidence.crossTypeRejects === evidence.expectedCrossTypeRejects &&
  evidence.unknownKidFetchesPerBurst === 1 &&
  evidence.rawCredentialFindings === 0 &&
  evidence.rotationPass && evidence.compromiseDrillPass &&
  evidence.snapshotCurrentClaimed === false;
for (const [k, v] of Object.entries(evidence)) console.log(k + "=" + v);
console.log("release=" + (pass ? "pass" : "block"));`, "algNegativePass=true\ncrossTypeRejects=6\nexpectedCrossTypeRejects=6\nunknownKidFetchesPerBurst=1\nrawCredentialFindings=0\nrotationPass=true\ncompromiseDrillPass=true\nsnapshotCurrentClaimed=false\nrelease=pass", ["rfc8725", "spring-jwt", "owasp-jwt", "owasp-secrets", "local-jwt-filter"])],
  }),
];

const sources: SessionSource[] = [
  { id: "local-jwt-util", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtUtil.java", usedFor: ["issuer/verifier capability audit", "access-refresh profile separation gap"], evidence: "2026-07-14 read-only sanitized audit: 76 lines, 2,817 bytes, SHA-256 305E21E9D9E251BA7B402BB275C951BBC021F6FB270D6895926AF0CBEFB1AF1D. token, secret, subject와 claim 값은 복사하지 않았습니다." },
  { id: "local-jwt-config", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtConfig.java", usedFor: ["key/validity injection boundary"], evidence: "2026-07-14 read-only sanitized audit: 24 lines, 689 bytes, SHA-256 018CA97DE544B68571CF48E58BB737BF259040A5E22E5768D69E43F91BD4B5DD. configuration 값은 복사하지 않았습니다." },
  { id: "local-jwt-filter", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/java/com/study/myproject02/common/jwt/JwtRequestFilter.java", usedFor: ["credential-sink risk and release gate"], evidence: "2026-07-14 read-only sanitized audit: 94 lines, 4,208 bytes, SHA-256 EA08D71D7A21293E92451B7867142AB1582B403664C4A26C3D47213FE9E432B2. credential-bearing header/token logging path를 값 없이 확인했으며 실제 노출 시 revoke/rotate/purge/readback이 필요합니다." },
  { id: "local-build", repository: "D:/dev/2026-myproject04-cicd", path: "build.gradle", usedFor: ["JJWT 0.11.5 and Boot 4.0.6 snapshot boundary"], evidence: "2026-07-14 read-only audit: 56 lines, 2,047 bytes, SHA-256 CBF6CB4A2BDE7B7C072C924F3C03E009EF7EEE737314B1F4EDB82FB77EB5C0A5. version snapshot을 current best practice로 간주하지 않습니다." },
  { id: "local-app-config", repository: "D:/dev/2026-myproject04-cicd", path: "src/main/resources/application.yaml", usedFor: ["sanitized secret-source structure audit"], evidence: "2026-07-14 read-only structural audit: 41 lines, 1,067 bytes, SHA-256 0D261E132D271707DA4B3285B1B09B3142CC6ECC92B403368213F7A1C76FCEC8. sensitive-like 8 lines 중 environment placeholder 6, literal HTTPS endpoint 2, 그 밖의 literal secret 0으로 분류했고 실제 값은 복사하지 않았습니다." },
  { id: "local-jwt-learning", repository: "D:/dev/REACT", path: "docs/springboot/03-jwt.md", usedFor: ["prior learning terminology and rotation gap audit"], evidence: "2026-07-14 read-only sanitized audit: 230 lines, 11,495 bytes, SHA-256 0791CBA92C83E9E933395C0001C18F3CDB7DA7CB5EAEB97D2F73EB6C3ECF097C. values는 복사하지 않았습니다." },
  { id: "local-secrets-learning", repository: "D:/dev/REACT", path: "docs/guide/02-security-and-actions-secrets.md", usedFor: ["secret lifecycle and CI provenance"], evidence: "2026-07-14 read-only audit: 46 lines, 2,979 bytes, SHA-256 BA782A50E37F974098DC925EA2EA86F8DE0662262B281A140A670BD5676C79CD." },
  { id: "rfc7519", repository: "IETF RFC Editor", path: "RFC 7519", publicUrl: "https://www.rfc-editor.org/rfc/rfc7519.html", usedFor: ["JWT structure and registered claims"], evidence: "JWT의 compact representation과 registered claims를 정의하는 표준입니다." },
  { id: "rfc7515", repository: "IETF RFC Editor", path: "RFC 7515", publicUrl: "https://www.rfc-editor.org/rfc/rfc7515.html", usedFor: ["JWS protected header, signing input and serialization"], evidence: "JWS 서명 입력과 serialization을 정의하는 표준입니다." },
  { id: "rfc7517", repository: "IETF RFC Editor", path: "RFC 7517", publicUrl: "https://www.rfc-editor.org/rfc/rfc7517.html", usedFor: ["JWK and JWKS fields"], evidence: "JSON Web Key와 key set을 정의하는 표준입니다." },
  { id: "rfc7638", repository: "IETF RFC Editor", path: "RFC 7638", publicUrl: "https://www.rfc-editor.org/rfc/rfc7638.html", usedFor: ["JWK thumbprint identity"], evidence: "JWK Thumbprint canonicalization과 hash를 정의합니다." },
  { id: "rfc8414", repository: "IETF RFC Editor", path: "RFC 8414", publicUrl: "https://www.rfc-editor.org/rfc/rfc8414.html", usedFor: ["authorization-server metadata and trusted JWKS discovery"], evidence: "Authorization Server Metadata를 정의합니다." },
  { id: "rfc8725", repository: "IETF RFC Editor", path: "RFC 8725", publicUrl: "https://www.rfc-editor.org/rfc/rfc8725.html", usedFor: ["JWT algorithm, key, issuer and cross-type security BCP"], evidence: "algorithm allowlist, issuer-key binding, audience, explicit typing과 mutually exclusive validation rules를 다루는 JWT BCP입니다." },
  { id: "rfc9068", repository: "IETF RFC Editor", path: "RFC 9068", publicUrl: "https://www.rfc-editor.org/rfc/rfc9068.html", usedFor: ["JWT access-token profile and at+jwt type"], evidence: "OAuth 2.0 JWT access token profile을 정의합니다." },
  { id: "spring-jwt", repository: "Spring Security reference", path: "servlet/oauth2/resource-server/jwt.html", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html", usedFor: ["issuer/JWKS startup, algorithms and validators"], evidence: "Spring Security 공식 servlet resource-server JWT reference입니다." },
  { id: "jjwt-0115", repository: "jwtk/jjwt", path: "tree/0.11.5", publicUrl: "https://github.com/jwtk/jjwt/tree/0.11.5", usedFor: ["local library tag-specific API boundary"], evidence: "로컬 snapshot과 같은 JJWT 0.11.5 공식 tag이며 현재 최신 권고로 과장하지 않습니다." },
  { id: "owasp-jwt", repository: "OWASP Cheat Sheet Series", path: "JSON_Web_Token_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html", usedFor: ["Java JWT implementation threats and mitigations"], evidence: "OWASP 공식 JWT cheat sheet입니다." },
  { id: "owasp-secrets", repository: "OWASP Cheat Sheet Series", path: "Secrets_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html", usedFor: ["key and secret lifecycle controls"], evidence: "OWASP 공식 secrets management cheat sheet입니다." },
];

const session = createExpertSession({
    inventoryId: "sec-05-jwt-structure-signature",
  slug: "security-09-jwt-structure-signature",
  courseId: "devops",
  moduleId: "token-client-integration",
  order: 1,
  title: "JWT 구조·서명·key selection",
  subtitle: "compact bytes에서 alg·kid·JWKS·key rotation과 cross-token 분리까지 cryptographic trust boundary를 재구성합니다.",
  level: "고급",
  estimatedMinutes: 210,
  coreQuestion: "JWT를 decode할 수 있다는 사실을 넘어 어떤 bytes를 누가 어떤 key와 profile로 서명했고 verifier가 왜 그 key를 신뢰하는지 어떻게 증명할까요?",
  summary: "로컬 학습 프로젝트의 JJWT 0.11.5/Boot 4.0.6 snapshot을 값 없이 감사해 same-key access/refresh profile과 credential logging 위험을 확인하고, 이를 현재 권고로 과장하지 않습니다. JWT/JWS/JWE, signing input bytes, MAC과 signature, algorithm confusion, key lifecycle, typ/kid/crit/jku, JWK/JWKS/thumbprint, 무중단 rotation, cross-JWT confusion, library migration과 incident gate를 RFC 7515/7517/7519/7638/8414/8725/9068, Spring Security, JJWT와 OWASP 근거 및 여덟 executable models로 완성합니다.",
  objectives: ["JWT·JWS·JWE와 base64url을 구분한다.", "JWS signing input의 byte identity를 설명한다.", "MAC과 digital signature의 trust boundary를 설계한다.", "algorithm confusion을 allowlist와 key binding으로 차단한다.", "kid/JWK/JWKS/thumbprint의 역할과 한계를 설명한다.", "unknown kid와 cache를 포함한 key rotation을 운영한다.", "access/refresh/ID token validation profile을 상호 배타적으로 만든다.", "library snapshot과 현재 guidance를 분리한다.", "credential sink와 key compromise incident를 복구한다."],
  prerequisites: [{ title: "filter·authentication capstone", reason: "credential extraction, filter chain, SecurityContext와 one-response failure 경계를 알아야 signature 검증을 HTTP authentication 전체와 연결할 수 있습니다.", sessionSlug: "security-08-filter-authentication-capstone" }],
  keywords: ["JWT", "JWS", "JWE", "base64url", "HS256", "RS256", "alg confusion", "kid", "JWK", "JWKS", "thumbprint", "key rotation", "typ", "cross-JWT confusion"],
  topics,
  lab: {
    title: "issuer-bound JWT signature qualification lab",
    scenario: "실제 credential을 쓰지 않는 disposable issuer/resource-server fixture에서 access와 refresh profile, old/new keys와 adversarial headers를 만들어 source→crypto→Spring integration→operations evidence를 연결합니다.",
    setup: ["Node.js 20 이상", "Java 21/Spring Security compatible fixture", "ephemeral asymmetric keys와 synthetic claims", "local-only mock JWKS over test HTTPS", "JJWT tag-pinned compatibility fixture", "secret/log/APM sink canary scanner", "원본 local files read-only"],
    steps: ["로컬 files의 hash와 capability/gap 표를 값 없이 재검증합니다.", "JWT/JWS/JWE segment와 original signing input bytes를 corpus로 고정합니다.", "fixed algorithm/key/profile allowlist와 wrong-alg/key/type negative matrix를 실행합니다.", "trusted issuer metadata에서 JWKS를 받고 kid/alg/use/kty/crit를 bounded하게 검증합니다.", "new key publish→propagation→sign switch→overlap→retire를 region/cache fixture에서 실행합니다.", "access/refresh/identity cross-product가 diagonal에서만 accept되는지 검증합니다.", "JJWT 0.11.5 snapshot과 target library의 contract corpus differential을 실행합니다.", "logs/traces/errors/artifacts에서 raw credential/key/claims canary가 0인지 검사합니다.", "unknown-kid flood, JWKS outage, compromised-key incident와 rollback을 연습합니다.", "machine-readable evidence로 release gate를 재계산합니다."],
    expectedResult: ["signature verification은 fixed profile의 algorithm과 issuer-bound key에서만 수행됩니다.", "untrusted jku/x5u, unknown/duplicate kid, unsupported crit와 wrong typ가 network side effect 없이 거부됩니다.", "rotation 중 old/new valid tokens는 계획한 overlap에서만 검증되고 retirement가 완료됩니다.", "access/refresh/identity token이 서로 다른 verifier에서 교차 수용되지 않습니다.", "raw credentials·keys·claims가 telemetry와 artifact에서 0이며 incident recovery readback이 남습니다."],
    cleanup: ["ephemeral private/symmetric keys와 synthetic tokens를 폐기합니다.", "mock JWKS, caches, test identities와 disposable services를 종료합니다.", "raw captures를 삭제하고 redacted summary/hash만 보존합니다.", "원본 local files의 hash와 git status가 unchanged인지 확인합니다."],
    extensions: ["KMS/HSM remote signing과 workload identity를 추가합니다.", "multi-issuer JwtIssuerAuthenticationManagerResolver fixture를 확장합니다.", "property-based compact parser와 duplicate JSON fuzzing을 추가합니다.", "post-quantum migration과 algorithm agility decision record를 작성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여덟 Node examples를 실행하고 각각 source audit, bytes, algorithm, kid, rotation, type와 release evidence로 분류하세요.", requirements: ["stdout 완전 일치", "실제 token/key 값 없음", "sourceRefs 추적", "JWS/JWE 구분", "negative cases"], hints: ["encoded payload는 encryption이 아니며 Node model은 실제 cryptographic verification을 대체하지 않습니다."], expectedOutcome: "compact 구조와 trust policy를 혼동하지 않고 각 model의 적용 범위를 설명합니다.", solutionOutline: ["source→serialization→alg/key→rotation/type→gate 순서로 표를 만듭니다."] },
    { difficulty: "응용", prompt: "두 issuer와 access/refresh profile의 key selection·rotation qualification packet을 만드세요.", requirements: ["issuer-key binding", "alg allowlist", "typ/aud separation", "JWKS cache", "unknown kid control", "old/new overlap", "secret-sink scan", "rollback"], hints: ["token header의 URL과 algorithm을 trust source로 사용하지 마세요."], expectedOutcome: "정상/오류/공격/rotation 상황에서 deterministic한 accept/reject와 운영 복구를 증명합니다.", solutionOutline: ["profiles→keys→negative matrix→rotation chaos→telemetry/recovery 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 JWT cryptographic agility 표준을 작성하세요.", requirements: ["approved algorithms", "key ownership", "JWKS metadata", "profile typing", "rotation SLO", "library qualification", "incident recovery", "exceptions/expiry"], hints: ["하나의 global shared secret을 편의상 허용하면 blast radius와 verifier 발급 권한을 반드시 모델링하세요."], expectedOutcome: "팀이 version 변화와 key compromise에도 재현 가능한 방식으로 안전하게 migration합니다.", solutionOutline: ["trust domains→profiles→lifecycle→verification evidence→incident governance 순서입니다."] },
  ],
  nextSessions: ["security-10-access-token-validation"],
  sources,
  sourceCoverage: {
    filesRead: 7,
    filesUsed: 7,
    uncoveredNotes: ["로컬 application/JWT/config/filter에서 token, secret, key, subject, routes, payload와 endpoint 값을 공개 content에 복사하지 않았습니다.", "JwtRequestFilter의 credential-bearing header/token logging path는 value-free risk로만 기록했습니다. 실제 log 노출 가능성이 있으면 log 제거만이 아니라 token revoke, key rotation 필요성 평가, log/APM purge, retention 차단과 downstream readback이 필요합니다.", "로컬 JJWT 0.11.5와 Spring Boot 4.0.6은 2026-07-14 source snapshot이지 현재 best practice 선언이 아니며 upgrade 전 공식 docs와 contract corpus를 다시 검증해야 합니다.", "Node examples는 실제 signature/JWKS/Spring/KMS behavior를 대체하지 않으므로 lab의 ephemeral cryptographic integration을 요구합니다."],
  },
});

export default session;
