import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const count = code.split("\n").length;
  const first = Math.max(1, Math.floor(count / 3));
  const second = Math.max(first + 1, Math.floor((count * 2) / 3));
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-" + first, explanation: "JDK 21 표준 암호·시간·collection API로 OTP, 공개 응답, MIME 입력과 durable delivery 상태를 외부 시스템 없이 모델링합니다." },
      { lines: (first + 1) + "-" + second, explanation: "정상·오답·만료·재사용·rate limit·header injection·transient/permanent delivery와 domain alignment 분기를 실행합니다." },
      { lines: (second + 1) + "-" + count, explanation: "실제 이메일 주소·코드·SMTP credential·본문은 출력하지 않고 entropy, outcome, attempt, 상태와 bounded boolean만 남깁니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring/Jakarta Mail/SMTP/DNS/DB/network/credential 불필요"], command: "java " + filename },
    output: { value: output, explanation: ["stdout은 제시된 결과와 완전히 같아야 합니다.", "JDK-only 모델은 실제 JavaMailSender, SMTP acceptance/delivery, DNS authentication, DB transaction과 multi-instance worker를 대신하지 않습니다."] },
    experiments: [
      { change: "code space, expiry, attempts, duplicate worker, SMTP category와 SPF/DKIM alignment를 바꿉니다.", prediction: "명시된 보안·전달 계약은 public response를 균일하게 유지하면서 내부 상태를 terminal/retryable outcome으로 분리합니다.", result: "entropy, verify outcome, retry count, outbox state, suppression과 DMARC pass를 비교합니다." },
      { change: "같은 scenario를 MockMvc→durable challenge/outbox store→worker→test SMTP/DNS fixtures로 실행합니다.", prediction: "HTTP timing/status, transaction commit, message headers, provider response, bounce와 authentication 결과가 추가됩니다.", result: "opaque request/challenge/message ids만으로 end-to-end evidence를 연결합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "email-purpose-threat-boundary",
    title: "이메일 주소 확인·복구·알림의 목적과 위협 경계를 먼저 분리합니다",
    lead: "메일이 도착했다는 사실, 주소 소유를 확인했다는 사실과 강한 사용자 인증은 서로 다른 보증이며 한 코드 흐름으로 뭉치면 위험이 숨습니다.",
    explanations: [
      "주소 확인은 특정 mailbox를 현재 사용자가 제어하는지 확인하고, 비밀번호 복구는 계정 접근을 되찾는 고위험 흐름이며, 알림은 상태 변경을 전달합니다. 각 목적의 challenge scope, 성공 후 허용 action, 보존·감사와 재인증 요구를 별도 use case로 정의합니다.",
      "NIST의 현재 지침은 이메일을 out-of-band authentication 수단으로 사용하지 않도록 하면서 주소 검증·복구 코드가 같은 범주가 아님을 구분합니다. 학습 예제는 이메일 OTP를 phishing-resistant MFA로 표현하지 않습니다.",
      "요청 endpoint는 계정/주소 존재 여부와 delivery 성공을 즉시 드러내지 않는 동일한 public status·message shape를 반환합니다. 실제 scheduling, rate decision과 delivery는 제한된 내부 event에서만 구분합니다.",
      "원본 EmailService와 EmailAPIController를 read-only로 감사하면 SecureRandom·MIME 전송과 HttpSession 검증 상태를 볼 수 있지만 durable challenge, expiry, attempts와 outbox가 이미 구현됐다는 근거는 없습니다.",
    ],
    concepts: [
      c("verification purpose", "challenge가 증명하려는 사실과 성공 후 허용할 action의 좁은 범위입니다.", ["주소 확인·복구·인증을 분리합니다.", "scope를 token에 묶습니다."]),
      c("assurance boundary", "메일 소유 확인이 제공하는 보증과 제공하지 못하는 보증을 명시한 경계입니다.", ["phishing resistance가 아닙니다.", "risk에 따라 재인증합니다."]),
      c("uniform response", "계정 존재·rate·delivery 차이가 외부 status, body와 관찰 가능한 처리에서 쉽게 구분되지 않게 한 계약입니다.", ["enumeration을 줄입니다.", "내부 관측은 유지합니다."]),
    ],
    diagnostics: [d("응답 문구나 시간으로 등록된 이메일과 SMTP 성공 여부를 구분할 수 있습니다.", "controller가 lookup/send 결과를 public response에 직접 반영했습니다.", ["status/body variants", "latency distributions", "rate paths", "provider failure handling"], "동일한 accepted response와 bounded work를 사용하고 내부 scheduling outcome만 안전하게 기록합니다.", "존재/부재/rate/provider failure의 schema·timing 분포와 enumeration tests를 둡니다.")],
    expertNotes: ["메일 발송 성공은 recipient inbox delivery나 사람이 읽었다는 증거가 아닙니다.", "복구 성공 뒤에도 기존 session/token 폐기와 보안 알림 같은 별도 account lifecycle이 필요합니다."],
  },
  {
    id: "otp-entropy-generation-format",
    title: "OTP code space·entropy·SecureRandom·표시 형식을 함께 설계합니다",
    lead: "6자리라는 형식만으로 안전하지 않으며 유효 시간과 시도 횟수, 발급량을 곱한 online guessing 확률을 계산해야 합니다.",
    explanations: [
      "code는 SecureRandom 같은 cryptographically strong generator로 균등하게 생성하고 decimal code라면 leading zero를 보존합니다. 일반 Random, timestamp, email hash와 순차 counter를 entropy source로 사용하지 않습니다.",
      "decimal 6자리는 백만 개 후보로 약 19.93 bits입니다. 보안은 이 숫자만이 아니라 challenge당 attempts, 주소/IP/device별 issue/verify rate, expiry와 server-side replay prevention을 합쳐 평가합니다.",
      "code를 log, metric label, exception, URL query와 analytics에 넣지 않습니다. challenge 저장소에는 keyed digest와 metadata만 두되, durable 비동기 worker가 나중에 template을 만들려면 code 원문은 별도의 암호화된 단기 delivery envelope에 최소 수명으로 보관하고 terminal 전송 뒤 제거해야 합니다.",
      "여러 목적의 code가 우연히 같더라도 challenge id, purpose, target identity digest와 transaction/session binding이 달라야 합니다. verifier가 code 문자열만으로 모든 계정을 검색하지 않습니다.",
    ],
    concepts: [
      c("code space", "생성 가능한 서로 다른 OTP 값의 전체 집합 크기입니다.", ["entropy 계산의 입력입니다.", "format과 generator가 결정합니다."]),
      c("online guessing budget", "유효 시간 동안 공격자가 허용받을 수 있는 검증 시도 수와 성공 확률의 상한입니다.", ["rate limit을 포함합니다.", "발급 endpoint도 포함합니다."]),
      c("cryptographic random", "공격자가 과거 출력을 알아도 다음 값을 현실적으로 예측하기 어려운 난수 source입니다.", ["SecureRandom을 사용합니다.", "균등 mapping을 확인합니다."]),
    ],
    codeExamples: [java("boot06-otp-entropy", "OTP entropy와 비노출 생성", "Boot06OtpEntropy.java", "SecureRandom으로 decimal code를 만들되 값은 출력하지 않고 code space entropy, 길이와 범위만 검증합니다.", String.raw`import java.security.*;
import java.util.*;

public class Boot06OtpEntropy {
  public static void main(String[] args) {
    int symbols = 1_000_000;
    double bits = Math.log(symbols) / Math.log(2);
    int value = new SecureRandom().nextInt(symbols);
    String code = String.format(Locale.ROOT, "%06d", value);
    System.out.printf(Locale.ROOT, "entropy=%.2f bits%n", bits);
    System.out.println("length-six=" + (code.length() == 6));
    System.out.println("range-valid=" + (value >= 0 && value < symbols));
    System.out.println("code-printed=false");
  }
}`, "entropy=19.93 bits\nlength-six=true\nrange-valid=true\ncode-printed=false", ["local-email-service", "jdk-secure-random", "nist-authenticators"])],
    diagnostics: [d("재시작 시간이나 이전 code를 알면 다음 code를 추측할 수 있습니다.", "일반 Random seed, timestamp 또는 좁고 편향된 생성 방식을 사용했습니다.", ["generator class", "code-space distribution", "seed/source", "issue/attempt budgets"], "SecureRandom의 bounded uniform generation과 leading-zero format을 사용합니다.", "large-sample range/distribution sanity와 source-code forbidden RNG rule을 둡니다.")],
    expertNotes: ["짧은 OTP를 느린 password hash 하나로만 보호할 수 없으며 keyed digest, expiry와 rate가 함께 필요합니다.", "entropy 숫자는 위험 평가 근거이지 사용자가 더 긴 code를 항상 감당할 수 있다는 뜻은 아닙니다."],
  },
  {
    id: "challenge-hash-expiry-single-use",
    title: "challenge를 keyed hash·expiry·attempts·single-use 상태로 원자 소비합니다",
    lead: "세션에 plaintext code만 넣고 equals로 비교하면 다중 instance, 재시작, 탈취·재사용과 동시 두 요청을 안전하게 처리하기 어렵습니다.",
    explanations: [
      "durable challenge row는 opaque id, purpose, target digest, keyed code digest, issued/expires time, attempts/max, consumed/revoked state와 version을 저장합니다. plaintext code와 실제 이메일은 이 검증 row나 로그에 두지 않습니다. 단, 비동기 배송 전까지 필요한 code/recipient는 worker만 복호화할 수 있는 별도 단기 delivery envelope 또는 동등한 atomic protocol로 수명·접근·삭제를 통제합니다.",
      "verify는 challenge scope와 current time, terminal state, attempts를 검사한 뒤 constant-time digest comparison을 하고 성공과 consume을 한 transaction/CAS로 수행합니다. 두 동시 요청 중 하나만 ACCEPTED가 되어야 합니다.",
      "잘못된 시도도 atomic increment하고 max 도달 시 terminal lock/revoke로 전환합니다. 만료·소비·폐기 row는 retention에 따라 purge하며 backup과 replicas의 수명도 고려합니다.",
      "HttpSession은 브라우저 흐름 correlation에 보조로 쓸 수 있지만 authoritative challenge store가 아닙니다. tab/session 교체, load balancing, mobile link와 restart에서도 server-side durable state가 검증의 근거입니다.",
    ],
    concepts: [
      c("keyed digest", "server secret key와 code/context를 MAC으로 변환해 원문 없이 equality를 검증하는 값입니다.", ["pepper key rotation이 필요합니다.", "challenge scope를 포함합니다."]),
      c("single-use consume", "한 challenge의 성공 상태 전이를 원자적으로 한 번만 허용하는 동작입니다.", ["replay를 막습니다.", "CAS/transaction이 필요합니다."]),
      c("terminal state", "CONSUMED, EXPIRED, REVOKED처럼 더 이상 검증 가능한 상태로 돌아가지 않는 challenge 상태입니다.", ["retry를 멈춥니다.", "retention을 적용합니다."]),
    ],
    codeExamples: [java("boot06-challenge-state", "keyed digest·expiry·single-use 검증", "Boot06ChallengeState.java", "고정 Clock에서 오답, 정답 consume, replay와 expiry를 순서대로 실행하고 code 원문을 출력하지 않습니다.", String.raw`import java.nio.charset.*;
import java.security.*;
import java.time.*;
import javax.crypto.*;
import javax.crypto.spec.*;

public class Boot06ChallengeState {
  enum Outcome { INVALID, ACCEPTED, REPLAY, EXPIRED }
  static final byte[] KEY = "synthetic-test-pepper".getBytes(StandardCharsets.UTF_8);
  static byte[] digest(String id, String code) throws Exception {
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(KEY, "HmacSHA256"));
    return mac.doFinal((id + ":" + code).getBytes(StandardCharsets.UTF_8));
  }
  static final class Challenge {
    final String id; final byte[] digest; final Instant expires;
    int attempts; boolean used;
    Challenge(String id, String code, Instant expires) throws Exception {
      this.id=id; this.digest=digest(id,code); this.expires=expires;
    }
    synchronized Outcome verify(String code, Instant now) throws Exception {
      if (used) return Outcome.REPLAY;
      if (!now.isBefore(expires)) return Outcome.EXPIRED;
      attempts++;
      if (!MessageDigest.isEqual(digest, digest(id,code))) return Outcome.INVALID;
      used=true;
      return Outcome.ACCEPTED;
    }
  }
  public static void main(String[] args) throws Exception {
    Instant now = Instant.parse("2030-01-01T00:00:00Z");
    Challenge active = new Challenge("challenge-a","test-code",now.plusSeconds(300));
    System.out.println("wrong=" + active.verify("wrong",now));
    System.out.println("correct=" + active.verify("test-code",now));
    System.out.println("replay=" + active.verify("test-code",now));
    Challenge expired = new Challenge("challenge-b","other",now.minusSeconds(1));
    System.out.println("expired=" + expired.verify("other",now));
    System.out.println("attempts=" + active.attempts);
  }
}`, "wrong=INVALID\ncorrect=ACCEPTED\nreplay=REPLAY\nexpired=EXPIRED\nattempts=2", ["local-email-controller", "jdk-mac", "owasp-forgot-password", "nist-authenticators"])],
    diagnostics: [d("같은 code가 두 번 성공하거나 서버 재시작 뒤 검증이 모두 사라집니다.", "plaintext session attribute와 비원자 equals 검증을 authoritative state로 사용했습니다.", ["storage schema", "expiry clock", "attempt increment", "consume transaction/CAS", "multi-instance route"], "keyed digest challenge를 durable store에 두고 verify+consume을 조건부 update로 수행합니다.", "동시 two-verifier success 1, replay, restart, expiry boundary와 key rotation tests를 둡니다.")],
    expertNotes: ["HMAC test key는 예제 전용이며 production key는 secret manager와 versioned rotation을 사용합니다.", "constant-time comparison은 online enumeration/rate와 storage leakage 전체를 해결하지 않습니다."],
  },
  {
    id: "issue-verify-rate-enumeration",
    title: "발급·검증 rate limit과 enumeration 방지를 identity·network·challenge 축으로 설계합니다",
    lead: "IP 하나만 막으면 분산 공격을 놓치고 email 하나만 막으면 공격자가 타인 계정을 잠그는 denial-of-service를 만들 수 있습니다.",
    explanations: [
      "issue endpoint는 target digest, account, network prefix, device/session과 global provider budget을 조합해 sliding/token bucket을 적용합니다. verify는 challenge와 actor context별 attempts를 원자 증가시키고 성공·terminal에서 리셋 정책을 명시합니다.",
      "등록 여부, rate limit, provider outage와 이미 발급된 challenge가 있는 경우에도 외부에는 같은 accepted shape를 반환할 수 있습니다. 429 노출이 필요한 공개 API라면 존재 여부와 독립적인 global/actor rate만 표현합니다.",
      "resend는 기존 code 수명을 연장하지 않고 새 challenge를 만들며 이전 challenge를 revoke할지 동시 유효 개수를 제한합니다. 공격자가 계속 resend해 사용자의 code를 무효화하는 abuse를 방지합니다.",
      "CAPTCHA/risk signal은 defense in depth이고 accessibility와 privacy를 검토합니다. 발급량·verify failure·target suppression을 bounded buckets로 관측하고 raw email/IP를 metric label에 넣지 않습니다.",
    ],
    concepts: [
      c("multi-dimensional rate limit", "target, challenge, network, device와 global quota를 함께 적용하는 제한 정책입니다.", ["우회와 lockout을 균형 잡습니다.", "opaque digests를 사용합니다."]),
      c("enumeration resistance", "응답·시간·부수효과 차이로 계정이나 주소 존재를 쉽게 추측하지 못하게 하는 성질입니다.", ["generic response를 사용합니다.", "timing도 측정합니다."]),
      c("resend policy", "새 발급 때 이전 challenge의 유효성, cooldown과 최대 동시 개수를 정한 규칙입니다.", ["code confusion을 줄입니다.", "abuse를 막습니다."]),
    ],
    codeExamples: [java("boot06-uniform-rate", "균일 공개 응답과 내부 scheduling 분리", "Boot06UniformRate.java", "존재·부재 대상 모두 같은 202 응답을 반환하고 target별 두 번까지만 내부 enqueue하는 정책을 실행합니다.", String.raw`import java.util.*;

public class Boot06UniformRate {
  record PublicResult(int status, String code) {}
  record Internal(PublicResult result, boolean scheduled) {}
  static final class Limiter {
    private final Map<String,Integer> counts = new HashMap<>();
    boolean allow(String digest) {
      int next = counts.merge(digest, 1, Integer::sum);
      return next <= 2;
    }
  }
  static Internal request(boolean exists, String digest, Limiter limiter) {
    boolean allowed = limiter.allow(digest);
    boolean scheduled = exists && allowed;
    return new Internal(new PublicResult(202, "REQUEST_ACCEPTED"), scheduled);
  }
  public static void main(String[] args) {
    Limiter limiter = new Limiter();
    Internal existing = request(true, "target-a", limiter);
    Internal missing = request(false, "target-b", limiter);
    request(true, "target-a", limiter);
    Internal limited = request(true, "target-a", limiter);
    System.out.println("public-equal=" + existing.result().equals(missing.result()));
    System.out.println("status=" + existing.result());
    System.out.println("scheduled-existing=" + existing.scheduled());
    System.out.println("scheduled-missing=" + missing.scheduled());
    System.out.println("third-limited=" + !limited.scheduled());
  }
}`, "public-equal=true\nstatus=PublicResult[status=202, code=REQUEST_ACCEPTED]\nscheduled-existing=true\nscheduled-missing=false\nthird-limited=true", ["local-email-controller", "owasp-forgot-password", "owasp-authentication"])],
    diagnostics: [d("공격자가 응답·메일 발송량 차이로 가입 주소를 찾거나 resend로 사용자를 잠급니다.", "존재 분기와 단일 축 limiter가 public behavior에 노출됐습니다.", ["response/timing", "target/network/global buckets", "resend invalidation", "provider queue"], "uniform response와 multi-dimensional bounded limiter, 이전 challenge 정책을 적용합니다.", "존재/부재/limited/provider-down timing distributions와 distributed abuse tests를 둡니다.")],
    expertNotes: ["내부 scheduled boolean은 테스트/관측용이며 public response나 browser analytics에 노출하지 않습니다.", "rate key hash도 회전·retention·충돌 정책과 접근 통제가 필요합니다."],
  },
  {
    id: "api-contract-sync-async-acceptance",
    title: "HTTP accepted·queued·SMTP accepted·delivered를 서로 다른 상태로 표현합니다",
    lead: "send 호출이 예외 없이 끝났다고 사용자에게 배송 완료를 말하면 queue, remote SMTP와 bounce 단계의 실패를 거짓 성공으로 숨깁니다.",
    explanations: [
      "issue endpoint는 challenge/outbox를 transaction에 저장한 뒤 202 Accepted와 generic code를 반환합니다. 즉시 동기 SMTP가 요구되는 작은 시스템도 bounded timeout과 실패 시 challenge/outbox consistency를 명시합니다.",
      "QUEUED는 durable work가 기록됐음, SUBMITTED는 provider/SMTP가 메시지를 받아들였음, DELIVERED는 신뢰 가능한 delivery signal이 있음, BOUNCED/SUPPRESSED는 실패·향후 차단을 뜻합니다. OPENED는 tracking 정책과 privacy가 별도입니다.",
      "client polling/webhook가 필요하면 opaque request id에 authorization을 적용하고 raw recipient를 path에 넣지 않습니다. verification flow는 mail delivery status를 기다리는 대신 challenge 입력과 expiry를 중심으로 동작합니다.",
      "controller thread에서 mail I/O를 분리해도 단순 @Async in-memory task는 process crash 시 사라집니다. 먼저 durable outbox commit, 그 뒤 worker claim/send가 기본 경계입니다.",
    ],
    concepts: [
      c("acceptance state", "HTTP 요청 수락, durable queue, SMTP acceptance와 final delivery를 구분한 상태 모델입니다.", ["완료 의미를 과장하지 않습니다.", "각 transition 증거가 다릅니다."]),
      c("202 Accepted", "요청 처리를 수락했으나 아직 완료되지 않았음을 나타내는 HTTP 결과입니다.", ["status resource를 제공할 수 있습니다.", "delivery 보장이 아닙니다."]),
      c("durable enqueue", "process가 중단돼도 재개할 수 있도록 작업을 transactionally persistent store에 기록하는 동작입니다.", ["@Async와 다릅니다.", "worker가 claim합니다."]),
    ],
    diagnostics: [d("API는 성공했지만 재시작 시 메일 작업이 사라지거나 배송 완료로 잘못 표시됩니다.", "controller가 @Async 호출 여부 또는 SMTP send 반환을 final delivery로 해석했습니다.", ["outbox commit", "worker queue durability", "SMTP/provider acceptance", "bounce state", "public copy"], "accepted/queued/submitted/delivered/bounced 상태를 분리하고 202는 durable enqueue 뒤에만 반환합니다.", "crash-before/after-commit/send와 delayed bounce 상태 전이 tests를 둡니다.")],
    expertNotes: ["delivery state가 필요 없다면 수집하지 않는 것이 개인정보·운영 복잡도 측면에서 더 낫습니다.", "verification UX는 메일 시스템의 최종 delivery 확정이 아니라 code expiry와 resend 안내를 명확히 합니다."],
  },
  {
    id: "mime-template-header-injection",
    title: "MIME alternative·template escaping·주소 파싱과 header injection을 안전하게 처리합니다",
    lead: "사용자 이름이나 제목을 HTML/Subject/From에 문자열 연결하면 XSS-like mail content, CRLF header injection과 spoofing이 발생할 수 있습니다.",
    explanations: [
      "발신 주소·display name·subject는 server-owned template/version과 validated structured address API로 구성합니다. CR/LF와 control characters를 user-controlled header field에 허용하지 않고 Reply-To도 allow-list policy를 적용합니다.",
      "메일은 text/plain과 text/html alternative를 제공해 client 호환성과 접근성을 높입니다. template variable은 HTML text/attribute/URL context별 escaping을 적용하고 code를 markup이나 tracking URL에 무분별하게 넣지 않습니다.",
      "unsubscribe/branding/locale template은 versioned artifacts로 관리하고 preview/snapshot에서 실제 recipient·code를 쓰지 않습니다. remote image와 tracking pixel은 privacy·deliverability·consent 정책을 거칩니다.",
      "MimeMessageHelper와 Jakarta Mail은 메시지 구성을 도와주지만 unsafe template/header 값을 자동으로 비즈니스 allow-list로 바꾸지는 않습니다. MIME parse와 encoded-word, Unicode 주소/subject를 test SMTP에서 확인합니다.",
    ],
    concepts: [
      c("MIME alternative", "같은 내용을 text/plain과 text/html representations로 제공하는 multipart 구조입니다.", ["fallback과 접근성을 돕습니다.", "내용 의미가 같아야 합니다."]),
      c("header injection", "CR/LF 같은 구분자를 입력에 넣어 추가 메일 header나 body 경계를 생성하는 공격입니다.", ["structured APIs를 씁니다.", "control chars를 거절합니다."]),
      c("template context escaping", "HTML text, attribute와 URL 등 출력 위치에 맞춰 untrusted 값을 안전하게 변환하는 방어입니다.", ["한 escape를 재사용하지 않습니다.", "sanitize와 다릅니다."]),
    ],
    codeExamples: [java("boot06-mime-safety", "header validation과 HTML context escaping", "Boot06MimeSafety.java", "CRLF subject를 거절하고 synthetic variable을 HTML text로 escape하며 multipart alternative 정책을 출력합니다.", String.raw`public class Boot06MimeSafety {
  static boolean safeHeader(String value) {
    return value != null && value.chars().noneMatch(ch -> ch=='\r' || ch=='\n' || ch<32);
  }
  static String escapeHtml(String value) {
    return value.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
      .replace("\"","&quot;").replace("'","&#39;");
  }
  public static void main(String[] args) {
    String synthetic = "<tag>";
    System.out.println("safe-subject=" + safeHeader("Verification notice"));
    System.out.println("injected-accepted=" + safeHeader("Notice\r\nBcc: hidden"));
    System.out.println("escaped=" + escapeHtml(synthetic).equals("&lt;tag&gt;"));
    System.out.println("multipart=alternative");
    System.out.println("raw-user-header=false");
  }
}`, "safe-subject=true\ninjected-accepted=false\nescaped=true\nmultipart=alternative\nraw-user-header=false", ["local-email-service", "spring-email", "spring-boot-email", "jakarta-mail", "rfc-message-format", "rfc-mime"])],
    diagnostics: [d("사용자 입력 뒤 Bcc/Reply-To가 추가되거나 HTML template 구조가 깨집니다.", "raw 문자열을 header와 HTML에 context 구분 없이 연결했습니다.", ["address/header setters", "CRLF controls", "template sinks", "MIME parse tree"], "server-owned headers, structured address parsing과 context-aware template escaping을 사용합니다.", "CR/LF/control/Unicode address와 HTML attribute/URL injection corpus를 test SMTP에서 검사합니다.")],
    expertNotes: ["HTML sanitize는 header injection을 막지 않고 header validation은 HTML injection을 막지 않습니다.", "메일 client별 rendering 차이 때문에 보안과 의미가 text/plain에서도 유지돼야 합니다."],
  },
  {
    id: "durable-outbox-worker-idempotency",
    title: "메일 작업을 durable outbox에 저장하고 claim·lease·idempotency로 한 번 효과를 만듭니다",
    lead: "DB 상태 변경 뒤 메일 send가 실패하거나 send 뒤 process가 죽으면 누락과 중복 사이의 불확실한 결과가 생깁니다.",
    explanations: [
      "업무 transaction은 challenge/domain state와 MailRequested outbox row를 함께 commit합니다. worker는 SKIP LOCKED/lease/version 같은 claim protocol로 row를 소유하고 attempt를 기록한 뒤 provider를 호출합니다. code/recipient가 필요한 outbox payload는 challenge digest와 분리해 envelope encryption, worker 전용 key/access, 짧은 expiry와 terminal 뒤 secure deletion을 적용합니다.",
      "SMTP send 성공 직후 completion 저장 전에 crash하면 재전송될 수 있으므로 exactly-once delivery를 가정하지 않습니다. stable message/operation id, provider idempotency 지원과 recipient-facing duplicate-safe content를 사용합니다.",
      "PENDING→PROCESSING→RETRY_WAIT→SUBMITTED 또는 DEAD의 명시 상태, nextAttemptAt, leaseUntil, maxAttempts와 lastErrorCategory를 둡니다. 오래된 PROCESSING을 회수하되 살아 있는 worker와 중복 claim하지 않습니다.",
      "Spring transaction-bound listener는 phase를 연결하지만 listener 실행 자체의 durable 재처리를 자동으로 보장하지 않습니다. outbox/publication registry의 persistence와 restart/multi-instance recovery 동작을 실제로 검증합니다.",
    ],
    concepts: [
      c("transactional outbox", "업무 변경과 외부 전송 의도를 같은 DB transaction에 기록하고 별도 worker가 전달하는 패턴입니다.", ["누락 창을 줄입니다.", "중복 가능성을 처리합니다."]),
      c("lease claim", "worker가 제한 시간 동안 특정 job 처리 권한을 원자 획득하는 protocol입니다.", ["crash recovery가 가능합니다.", "fencing/version을 고려합니다."]),
      c("idempotency key", "같은 logical mail operation의 중복 처리·provider 호출을 식별하는 stable token입니다.", ["recipient/tenant scope에 묶습니다.", "plaintext를 포함하지 않습니다."]),
    ],
    codeExamples: [java("boot06-outbox-state", "durable worker retry와 중복 claim 효과", "Boot06OutboxState.java", "transient 실패 뒤 재시도 성공, 완료 job 중복 실행 거절과 permanent bounce suppression을 작은 상태기로 실행합니다.", String.raw`public class Boot06OutboxState {
  enum State { PENDING, RETRY_WAIT, SUBMITTED, DEAD, SUPPRESSED }
  enum Provider { TRANSIENT, ACCEPTED, PERMANENT }
  static final class Job {
    State state=State.PENDING; int attempts;
    boolean run(Provider provider) {
      if (state==State.SUBMITTED || state==State.DEAD || state==State.SUPPRESSED) return false;
      attempts++;
      state = switch (provider) {
        case TRANSIENT -> State.RETRY_WAIT;
        case ACCEPTED -> State.SUBMITTED;
        case PERMANENT -> State.DEAD;
      };
      return true;
    }
  }
  public static void main(String[] args) {
    Job job = new Job();
    System.out.println("first-run=" + job.run(Provider.TRANSIENT) + ":" + job.state);
    System.out.println("second-run=" + job.run(Provider.ACCEPTED) + ":" + job.state);
    System.out.println("duplicate-run=" + job.run(Provider.ACCEPTED));
    System.out.println("attempts=" + job.attempts);
    Job bounce = new Job();
    bounce.run(Provider.PERMANENT);
    bounce.state=State.SUPPRESSED;
    System.out.println("bounce=" + bounce.state);
  }
}`, "first-run=true:RETRY_WAIT\nsecond-run=true:SUBMITTED\nduplicate-run=false\nattempts=2\nbounce=SUPPRESSED", ["spring-modulith-events", "spring-transaction-events", "rfc-smtp", "rfc-dsn"])],
    diagnostics: [d("재시작 때 메일이 사라지거나 두 worker가 같은 recipient에게 중복 전송합니다.", "in-memory async queue 또는 claim/lease/idempotency 없는 polling입니다.", ["business/outbox transaction", "claim SQL/version", "lease recovery", "provider operation id", "completion crash window"], "durable outbox와 atomic claim, bounded lease 및 duplicate-safe operation을 적용합니다.", "crash-before/after-send, two workers, stale lease와 restart recovery tests를 둡니다.")],
    expertNotes: ["outbox는 SMTP와 DB를 하나의 distributed transaction으로 만들지 않으며 중복을 설계 대상으로 바꿉니다.", "outbox payload도 개인정보이므로 최소화·암호화·retention·access control을 적용합니다."],
  },
  {
    id: "smtp-retry-bounce-suppression",
    title: "SMTP transient/permanent 결과·backoff·bounce와 suppression을 수명주기로 처리합니다",
    lead: "모든 MailException을 즉시 재시도하면 영구 실패를 폭주시키고, 재시도하지 않으면 일시 장애에서 메시지가 유실됩니다.",
    explanations: [
      "SMTP 4yz/transport timeout처럼 transient 가능성이 있는 category만 exponential backoff와 jitter, max attempts/age로 재시도합니다. 5yz invalid recipient, policy rejection과 malformed message는 수정 없이 같은 payload를 반복하지 않습니다.",
      "connection/write/read timeout을 유한하게 설정하고 worker concurrency, provider quota와 destination domain별 circuit/bulkhead를 둡니다. 무한 timeout은 web/worker thread와 queue lease를 점유합니다.",
      "DSN/webhook는 provider signature·message correlation을 검증하고 delivered/delayed/failed를 idempotent transition으로 반영합니다. forwarded mailbox, delayed bounce와 out-of-order events를 고려합니다.",
      "hard bounce와 complaint는 suppression list에 최소 identifier digest와 reason category/expiry를 저장해 반복 발송을 막습니다. transient mailbox-full을 영구 suppression할지 정책과 사용자 수정/appeal 경로를 둡니다.",
    ],
    concepts: [
      c("transient delivery failure", "시간·네트워크·remote capacity 변화 후 재시도가 성공할 수 있는 전송 실패입니다.", ["4yz가 대표적입니다.", "bounded backoff를 씁니다."]),
      c("delivery status notification", "메일 전달 결과를 machine-readable action/status fields로 보고하는 메시지 형식입니다.", ["수락과 최종 전달을 구분합니다.", "위조/중복을 검증합니다."]),
      c("suppression list", "hard bounce·complaint 등으로 향후 전송을 제한할 target 기록입니다.", ["최소화·retention이 필요합니다.", "override 정책이 필요합니다."]),
    ],
    diagnostics: [d("영구 주소 오류가 수천 번 재시도되거나 일시 timeout 한 번으로 메일이 DEAD가 됩니다.", "provider/SMTP failure category와 max age/backoff/suppression 정책이 없습니다.", ["SMTP class/status", "timeout type", "attempt schedule", "DSN/webhook", "suppression"], "transient/permanent/unknown을 stable category로 변환하고 bounded jitter retry와 terminal handling을 적용합니다.", "4yz/5yz/timeout/accept-then-bounce/out-of-order webhook fault matrix를 둡니다.")],
    expertNotes: ["provider의 accepted response는 최종 mailbox delivery가 아니므로 상태 이름을 과장하지 않습니다.", "retry storm는 provider 장애를 악화시키므로 queue age와 destination-level backoff를 함께 관측합니다."],
  },
  {
    id: "spf-dkim-dmarc-alignment",
    title: "SPF·DKIM과 최신 RFC 9989 DMARC alignment를 발신 도메인 운영 계약으로 검증합니다",
    lead: "SMTP credential만 맞으면 수신자가 메시지를 신뢰하는 것이 아니며 From domain과 인증 identifier가 정렬되지 않으면 전달성과 spoofing 방어가 약해집니다.",
    explanations: [
      "SPF는 SMTP MAIL FROM identity의 발송 host authorization을 평가하고 DKIM은 signing domain과 메시지 일부의 cryptographic signature를 검증합니다. 둘은 서로 대체하지 않고 forwarding/mailing-list behavior가 다릅니다.",
      "DMARC는 visible RFC5322.From author domain과 SPF 또는 DKIM authenticated identifier의 alignment 및 정책을 결합합니다. 2026년에 공개된 RFC 9989가 RFC 7489를 대체한 현재 기준임을 명시합니다.",
      "From은 조직이 제어하고 DNS SPF/DKIM/DMARC record와 정렬된 domain으로 고정하며 사용자 email을 From에 넣지 않습니다. 사용자 회신 주소는 validated Reply-To 정책으로 분리하고 CRLF를 거절합니다.",
      "DNS key rotation, DKIM selector, SPF lookup limits, DMARC aggregate/failure reports의 privacy와 third-party sender alignment를 운영합니다. p=none 관찰→quarantine/reject 전환은 실제 report와 모든 발송 source inventory 뒤에 수행합니다.",
    ],
    concepts: [
      c("identifier alignment", "visible From domain과 SPF MAIL FROM 또는 DKIM signing domain이 DMARC 규칙에 따라 일치하는 관계입니다.", ["pass mechanism 하나 이상이 필요합니다.", "strict/relaxed mode가 있습니다."]),
      c("DKIM selector", "DNS에 게시한 signing public key를 선택하는 이름으로 key rotation과 병행 배포를 지원합니다.", ["private key는 server/provider에 둡니다.", "retirement를 관리합니다."]),
      c("DMARC policy", "alignment 실패 메시지 처리와 aggregate reporting을 domain owner가 DNS로 게시하는 정책입니다.", ["RFC 9989를 기준으로 합니다.", "보고서 개인정보를 관리합니다."]),
    ],
    codeExamples: [java("boot06-dmarc-alignment", "SPF/DKIM alignment 조합 판정", "Boot06DmarcAlignment.java", "SPF 또는 DKIM이 pass하면서 author domain과 정렬될 때만 DMARC pass가 되는 논리를 실행합니다.", String.raw`public class Boot06DmarcAlignment {
  record Evidence(boolean spfPass, boolean spfAligned, boolean dkimPass, boolean dkimAligned) {}
  static boolean dmarcPass(Evidence e) {
    return (e.spfPass() && e.spfAligned()) || (e.dkimPass() && e.dkimAligned());
  }
  public static void main(String[] args) {
    System.out.println("spf-aligned=" + dmarcPass(new Evidence(true,true,false,false)));
    System.out.println("spf-unaligned=" + dmarcPass(new Evidence(true,false,false,false)));
    System.out.println("dkim-aligned=" + dmarcPass(new Evidence(false,false,true,true)));
    System.out.println("both-fail=" + dmarcPass(new Evidence(false,false,false,false)));
    System.out.println("raw-domain-logged=false");
  }
}`, "spf-aligned=true\nspf-unaligned=false\ndkim-aligned=true\nboth-fail=false\nraw-domain-logged=false", ["rfc-spf", "rfc-dkim", "rfc-dmarc-9989", "rfc-message-format"])],
    diagnostics: [d("메일은 전송되지만 스팸/거절되고 DMARC report에 alignment failure가 늘어납니다.", "visible From과 MAIL FROM/DKIM d= domain, third-party sender 또는 DNS records가 정렬되지 않았습니다.", ["RFC5322.From", "envelope domain", "DKIM selector/signature", "SPF result", "DMARC aggregate reports"], "발송 source inventory와 aligned domains를 구성하고 staged DMARC policy/key rotation을 운영합니다.", "DNS/authentication fixture와 provider header/report parser tests를 둡니다.")],
    expertNotes: ["SPF/DKIM/DMARC pass는 메시지 내용의 무해성이나 계정 자체가 탈취되지 않았음을 보장하지 않습니다.", "DMARC aggregate report도 IP/domain 식별 정보를 포함할 수 있어 접근·retention을 제한합니다."],
  },
  {
    id: "zero-leak-observability",
    title: "code·recipient·본문·credential이 없는 correlation과 SLO를 설계합니다",
    lead: "메일 장애를 조사하려고 request DTO, MIME message와 SMTP session debug를 켜면 OTP와 개인정보·인증정보가 로그/trace에 복제됩니다.",
    explanations: [
      "server-generated request/challenge/message id를 사용해 issue, outbox commit, worker claim, provider result와 bounce를 연결합니다. ids는 random opaque이고 authorization token이나 raw email hash를 외부에 노출하지 않습니다.",
      "metrics는 purpose enum, outcome, queue state, attempt bucket, SMTP/provider category, template version, latency/queue-age bucket과 destination-domain class처럼 bounded fields를 사용합니다. email, code, subject/body와 message headers는 tags에서 제외합니다.",
      "mail library debug, exception message와 provider webhook payload가 credential/recipient를 포함할 수 있으므로 production redaction과 restricted quarantine을 적용합니다. 노출된 SMTP/API secret, DKIM private key와 pepper는 즉시 rotate합니다.",
      "SLO는 API accepted latency와 queue age, send submission, bounce/complaint, expiry-before-send와 challenge verify success를 분리합니다. 단순 send success ratio로 사용자 경험을 결론내리지 않습니다.",
    ],
    concepts: [
      c("zero-leak telemetry", "메일 주소, code, body, token과 credential을 기본적으로 배제한 allow-list 관측 schema입니다.", ["bounded metadata만 남깁니다.", "canary로 검증합니다."]),
      c("queue age", "outbox가 생성된 뒤 현재/완료까지 대기한 시간으로 delivery backlog의 핵심 지표입니다.", ["attempt latency와 구분합니다.", "expiry와 연결합니다."]),
      c("template version", "메일 내용 구조를 값 없이 식별하는 stable release id입니다.", ["incident rollback을 돕습니다.", "본문을 로그에 넣지 않습니다."]),
    ],
    diagnostics: [d("APM/log에 OTP·recipient·SMTP credential 또는 MIME body가 남습니다.", "DTO/message/session debug 전체 기록과 deny-list redaction에 의존했습니다.", ["controller logs", "mail debug", "exception/webhook payload", "APM attributes", "exports/backups"], "allow-list event schema와 opaque ids만 사용하고 노출 secret을 rotate·폐기합니다.", "synthetic recipient/code/key canary가 모든 exporters/backups에서 0건인지 검사합니다.")],
    expertNotes: ["이메일을 되돌릴 수 없는 hash로만 바꿔도 낮은 entropy/known directory에서는 재식별될 수 있습니다.", "raw evidence가 꼭 필요하면 짧은 retention·암호화·승인 접근의 별도 quarantine으로 분리합니다."],
  },
  {
    id: "email-failure-matrix-testing",
    title: "Clock·concurrency·test SMTP·DNS·crash와 bounce를 다층 failure matrix로 검증합니다",
    lead: "mail sender mock이 send 1회를 확인하는 테스트만으로 expiry race, MIME 구조, outbox crash와 실제 SMTP/DNS 전달 계약을 증명할 수 없습니다.",
    explanations: [
      "unit test는 SecureRandom wrapper bounds, Clock expiry, keyed digest, attempts/state machine, header validator와 template escaping을 검증합니다. 실제 code 값 snapshot이나 random seed를 production contract로 고정하지 않습니다.",
      "MockMvc는 uniform response, validation/rate, session independence와 status/schema를, repository integration은 atomic consume, unique operation, outbox commit/claim/lease를 검증합니다.",
      "test SMTP/Jakarta Mail integration은 MIME tree, text/plain+html, encoded headers, From/Reply-To, timeout와 provider classification을 검사합니다. DNS fixture는 SPF/DKIM/DMARC alignment와 selector rotation을 검증합니다.",
      "failure matrix는 crash-before/after commit/send, two workers, slow SMTP, 4yz/5yz, accepted-then-bounce, duplicate/out-of-order webhook, expired-before-send와 deployment restart를 포함합니다. 원본 두 파일은 read-only evidence로 보존합니다.",
    ],
    concepts: [
      c("test SMTP", "실제 MIME/SMTP client 동작을 network boundary에서 받아 메시지 구조와 failure를 통제하는 시험 server입니다.", ["mock보다 깊습니다.", "외부 실제 recipient를 쓰지 않습니다."]),
      c("virtual clock", "현재 시간을 주입해 expiry, retry schedule과 retention boundary를 결정적으로 검증하는 Clock입니다.", ["sleep을 피합니다.", "timezone을 명시합니다."]),
      c("delivery failure matrix", "HTTP, store, worker, SMTP, DNS와 webhook 단계별 실패·재시도·terminal·관측 결과 표입니다.", ["crash window를 포함합니다.", "cleanup을 검증합니다."]),
    ],
    diagnostics: [d("unit test는 통과하지만 운영에서 MIME 깨짐, double consume 또는 outbox stuck가 납니다.", "mail sender mock과 happy path만 있어 framework/protocol/concurrency/crash 경계를 실행하지 않았습니다.", ["test pyramid", "actual MIME parse", "DB concurrency", "worker restart", "DNS/webhook fixtures"], "unit→MockMvc→store/outbox→test SMTP/DNS→crash/load 순서의 representative matrix를 필수화합니다.", "각 위험이 가장 가까운 layer에서 재현되고 full-flow evidence로 연결되는 release gate를 둡니다.")],
    expertNotes: ["실제 외부 주소로 smoke mail을 보내지 말고 조직이 소유한 controlled sink와 synthetic data를 사용합니다.", "provider sandbox success도 production DNS, quota와 reputation을 자동 보장하지 않습니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-email-service", repository: "local learning archive", path: "springmvc/myproject01/src/main/java/org/study/myproject01/email/service/EmailService.java", usedFor: ["legacy SecureRandom, MIME template and synchronous send structure provenance"], evidence: "Read-only structural audit: 58 lines, 2,740 bytes, SHA-256 DF067A64CF186FA2722F735F3A1778201F61645B8DD2733C0FF1F1593E729E5E." },
  { id: "local-email-controller", repository: "local learning archive", path: "springmvc/myproject01/src/main/java/org/study/myproject01/email/controller/EmailAPIController.java", usedFor: ["legacy HttpSession challenge issue/verify structure provenance"], evidence: "Read-only structural audit: 52 lines, 1,709 bytes, SHA-256 79DAFB0AA08972B2DA5AD8D45AF9D782D26F1069688BBABDB961901CEBC7269F." },
  { id: "spring-boot-email", repository: "Spring Boot Reference", path: "Sending Email", publicUrl: "https://docs.spring.io/spring-boot/reference/io/email.html", usedFor: ["JavaMailSender auto-configuration and finite timeouts"], evidence: "Spring Boot 공식 email 문서입니다." },
  { id: "spring-email", repository: "Spring Framework Reference", path: "Email", publicUrl: "https://docs.spring.io/spring-framework/reference/integration/email.html", usedFor: ["JavaMailSender, MimeMessageHelper and template composition"], evidence: "Spring Framework 공식 email 문서입니다." },
  { id: "jakarta-mail", repository: "Jakarta EE Specification", path: "Jakarta Mail 2.1", publicUrl: "https://jakarta.ee/specifications/mail/2.1/jakarta-mail-spec-2.1", usedFor: ["mail message, transport and MIME API semantics"], evidence: "Eclipse Foundation Jakarta Mail 공식 specification입니다." },
  { id: "jdk-secure-random", repository: "Java SE 21 API", path: "SecureRandom", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/SecureRandom.html", usedFor: ["cryptographically strong OTP generation"], evidence: "Oracle Java SE 21 공식 API입니다." },
  { id: "jdk-mac", repository: "Java SE 21 API", path: "Mac", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/javax/crypto/Mac.html", usedFor: ["keyed challenge digest"], evidence: "Oracle Java SE 21 공식 cryptography API입니다." },
  { id: "nist-authenticators", repository: "NIST SP 800-63B-4", path: "Authenticators", publicUrl: "https://pages.nist.gov/800-63-4/sp800-63b/authenticators/", usedFor: ["single use, replay/rate limits and email assurance boundary"], evidence: "NIST 공식 digital identity guidance입니다." },
  { id: "owasp-forgot-password", repository: "OWASP Cheat Sheet Series", path: "Forgot Password", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html", usedFor: ["random, secure, expiring single-use recovery tokens and enumeration"], evidence: "OWASP 공식 recovery flow guidance입니다." },
  { id: "owasp-authentication", repository: "OWASP Cheat Sheet Series", path: "Authentication", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", usedFor: ["generic errors and enumeration resistance"], evidence: "OWASP 공식 authentication guidance입니다." },
  { id: "spring-modulith-events", repository: "Spring Modulith Reference", path: "Working with Application Events", publicUrl: "https://docs.spring.io/spring-modulith/reference/events.html", usedFor: ["durable event publication and recovery concepts"], evidence: "Spring Modulith 공식 event publication 문서입니다." },
  { id: "spring-transaction-events", repository: "Spring Framework Reference", path: "Transaction-bound Events", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html", usedFor: ["transaction event phase and durability boundary"], evidence: "Spring Framework 공식 transaction-bound event 문서입니다." },
  { id: "rfc-smtp", repository: "IETF RFC Editor", path: "RFC 5321 SMTP", publicUrl: "https://www.rfc-editor.org/rfc/rfc5321.html#section-4.2.1", usedFor: ["SMTP reply classes, queue and retry semantics"], evidence: "IETF Standards Track SMTP 문서입니다." },
  { id: "rfc-message-format", repository: "IETF RFC Editor", path: "RFC 5322 Internet Message Format", publicUrl: "https://www.rfc-editor.org/rfc/rfc5322.html#section-2.2", usedFor: ["header field syntax and CRLF boundaries"], evidence: "IETF Standards Track message format 문서입니다." },
  { id: "rfc-mime", repository: "IETF RFC Editor", path: "RFC 2045 MIME Part One", publicUrl: "https://www.rfc-editor.org/rfc/rfc2045.html", usedFor: ["MIME body and transfer encoding"], evidence: "IETF Standards Track MIME 문서입니다." },
  { id: "rfc-dsn", repository: "IETF RFC Editor", path: "RFC 3464 Delivery Status Notifications", publicUrl: "https://www.rfc-editor.org/rfc/rfc3464.html", usedFor: ["delivered, delayed and failed status processing"], evidence: "IETF Standards Track DSN format입니다." },
  { id: "rfc-spf", repository: "IETF RFC Editor", path: "RFC 7208 SPF", publicUrl: "https://www.rfc-editor.org/rfc/rfc7208.html", usedFor: ["sender policy authorization"], evidence: "IETF Standards Track SPF 문서입니다." },
  { id: "rfc-dkim", repository: "IETF RFC Editor", path: "RFC 6376 DKIM", publicUrl: "https://www.rfc-editor.org/rfc/rfc6376.html", usedFor: ["domain signing and selector semantics"], evidence: "IETF Standards Track DKIM 문서입니다." },
  { id: "rfc-dmarc-9989", repository: "IETF RFC Editor", path: "RFC 9989 DMARC", publicUrl: "https://www.rfc-editor.org/rfc/rfc9989.html#section-4", usedFor: ["current DMARC alignment and policy"], evidence: "RFC 7489를 대체한 IETF Proposed Standard DMARC 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "boot-06-email-service", slug: "boot-06-email-service", courseId: "spring", moduleId: "spring-boot-rest-integration", order: 6,
  title: "메일 전송 API, 비동기화와 실패 복구", subtitle: "OTP challenge 보안에서 MIME·durable outbox·SMTP bounce와 SPF/DKIM/최신 DMARC까지 값 없는 실행 증거로 연결합니다.", level: "고급", estimatedMinutes: 95,
  coreQuestion: "메일 요청을 빠르게 수락하면서도 code·주소·credential을 노출하지 않고, 만료·재사용·재시작·중복·bounce와 도메인 인증까지 어떻게 정확히 복구할까요?",
  summary: "로컬 EmailService.java와 EmailAPIController.java를 read-only로 감사해 SecureRandom, MimeMessageHelper, 동기 send와 HttpSession 기반 code issue/verify 구조를 provenance로 사용합니다. 실제 이메일·code·sender/config 값은 복제하지 않고 durable expiry/attempt/consume/outbox가 원본에 있다고 가정하지 않습니다. 목적별 assurance·enumeration, code entropy와 SecureRandom, HMAC digest·Clock expiry·single-use CAS와 session→durable state, 다축 issue/verify rate, 202 accepted 상태, MIME alternative/template/header injection, transactional outbox worker/lease/idempotency, SMTP transient/permanent retry·DSN/bounce/suppression, SPF·DKIM·RFC 9989 DMARC alignment, zero-leak SLO와 crash/DNS/test-SMTP matrix로 깊게 교정합니다. 여섯 JDK 21 예제는 code를 출력하지 않고 entropy, challenge state, uniform response/rate, MIME safety, outbox lifecycle과 alignment를 exact output으로 증명합니다.",
  objectives: ["주소 확인·복구·알림과 authentication assurance를 분리한다.", "OTP code space, SecureRandom과 online guessing budget을 계산한다.", "challenge를 keyed digest·expiry·attempts·single-use durable state로 저장한다.", "발급·검증 rate와 enumeration·resend abuse를 통제한다.", "HTTP accepted, queued, submitted, delivered와 bounced 상태를 구분한다.", "MIME/template/header를 context-safe하게 구성한다.", "durable outbox, worker claim, retry·bounce·idempotency를 설계한다.", "SPF·DKIM·RFC 9989 DMARC와 zero-leak 관측·failure tests를 운영한다."],
  prerequisites: [{ title: "공공데이터 JSON·XML 호출과 응답 매핑", reason: "외부 API의 timeout·retry·error mapping과 secret redaction을 알아야 SMTP/provider 호출을 durable worker와 안전한 delivery 상태로 확장할 수 있습니다.", sessionSlug: "boot-05-public-data-json-xml" }],
  keywords: ["mail sender", "template", "async", "retry", "OTP", "SecureRandom", "single use", "rate limit", "MIME", "header injection", "outbox", "bounce", "SPF", "DKIM", "DMARC RFC 9989"], topics,
  lab: {
    title: "세션 기반 이메일 code를 durable challenge+outbox로 재구성하기",
    scenario: "기존 흐름은 SecureRandom과 MIME 메일을 사용하지만 challenge state가 HttpSession에 있고 expiry/rate/atomic consume 및 crash-safe async delivery·bounce·domain-auth evidence가 부족합니다.",
    setup: ["두 원본은 read-only hash provenance로 고정하고 실제 email/code/sender/SMTP/DNS 값을 복제하지 않습니다.", "purpose-scoped challenge와 outbox/message/suppression schema 및 Clock/key versions를 정의합니다.", "controlled test SMTP, synthetic DNS/auth results, durable DB와 multi-worker/crash harness를 준비합니다.", "MockMvc uniform response, fake provider/DSN webhook와 secret canary collectors를 준비합니다."],
    steps: ["메일 목적·assurance와 generic public response 표를 만듭니다.", "SecureRandom code space와 expiry/attempt risk를 계산합니다.", "HMAC digest, purpose/target binding과 atomic consume challenge를 구현합니다.", "issue/verify/resend의 target/network/device/global rate를 적용합니다.", "challenge+outbox를 transaction commit하고 202를 반환합니다.", "plain/html MIME, server headers와 context-escaped template을 구성합니다.", "worker claim/lease, idempotency와 crash recovery를 구현합니다.", "SMTP 4yz/5yz/timeout을 bounded jitter retry/terminal로 분류합니다.", "DSN/provider webhook, hard bounce와 suppression을 idempotent 처리합니다.", "SPF/DKIM/DMARC alignment와 RFC 9989 policy/report를 test fixture로 검증합니다.", "queue age·expiry-before-send·bounce SLO와 zero-leak correlation을 적용합니다.", "concurrency/restart/DNS/MIME/failure matrix와 runbook을 제출합니다."],
    expectedResult: ["존재·rate·provider 상태와 무관하게 public response schema가 균일하고 code 원문이 저장·출력되지 않습니다.", "challenge는 expiry/attempt/scope를 지키며 동시 검증 success 1, replay 0입니다.", "business state와 outbox가 함께 commit되고 crash/retry에도 logical mail effect가 중복되지 않습니다.", "MIME headers/template은 injection 없이 plain/html 의미가 일치합니다.", "delivery/bounce/authentication evidence와 telemetry에 recipient, code, credential와 raw body가 없습니다."],
    cleanup: ["synthetic challenges, outbox/jobs, DSN, suppression과 test mailbox를 retention policy대로 제거합니다.", "SMTP/DNS fixtures, executors, leases, connections와 worker processes를 종료합니다.", "logs/traces/webhook artifacts/backups에서 synthetic email/code/key canary가 0건인지 확인합니다.", "로컬 EmailService.java와 EmailAPIController.java는 수정하지 않습니다."],
    extensions: ["pepper/key rotation 중 active challenge dual verification을 훈련합니다.", "provider 이중화와 destination-domain circuit breaker를 비교합니다.", "WebAuthn 기반 phishing-resistant 복구/재인증 대안을 설계합니다.", "DMARC aggregate report ingestion과 sender inventory drift alert를 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "여섯 Java 예제를 실행해 entropy, challenge, uniform response, MIME, outbox와 DMARC 결과를 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "code가 출력되지 않음을 확인합니다.", "오답→정답→replay→expiry를 설명합니다.", "존재/부재 public response가 같음을 확인합니다.", "CRLF header가 거절됨을 확인합니다.", "transient→submitted와 duplicate false를 확인합니다.", "SPF/DKIM alignment 조합을 설명합니다."], hints: ["각 출력이 public response인지 restricted internal evidence인지 구분하세요."], expectedOutcome: "send 호출이 아니라 challenge·delivery 수명주기로 이메일 기능을 설명합니다.", solutionOutline: ["scope→generate→digest→limit→enqueue→deliver→authenticate 순서입니다."] },
    { difficulty: "응용", prompt: "durable challenge/outbox와 test SMTP/DNS에서 전체 failure matrix를 구현하세요.", requirements: ["generic response와 timing을 검증합니다.", "HMAC/expiry/attempt/atomic consume을 구현합니다.", "multi-dimensional rate/resend를 적용합니다.", "transactional outbox와 two-worker claim을 검증합니다.", "MIME/header/template tests를 둡니다.", "4yz/5yz/bounce/suppression을 처리합니다.", "SPF/DKIM/DMARC와 zero-leak canary를 검증합니다."], hints: ["SMTP accepted와 delivered를 같은 상태로 이름 붙이지 마세요."], expectedOutcome: "재시작·중복·provider/DNS 장애에도 보안과 전달 상태가 복구됩니다.", solutionOutline: ["persist→claim→classify→retry→suppress→measure→prove 순서입니다."] },
    { difficulty: "설계", prompt: "조직용 verification-mail security/deliverability standard를 작성하세요.", requirements: ["purpose/assurance/enumeration 규칙을 둡니다.", "entropy/hash/expiry/single-use/rate rules를 둡니다.", "MIME/template/header rules를 둡니다.", "durable async/idempotency/retry/bounce rules를 둡니다.", "SPF/DKIM/RFC9989 DMARC 운영을 둡니다.", "zero-leak SLO/retention/rotation을 둡니다.", "unit/HTTP/DB/SMTP/DNS/crash gates를 포함합니다."], hints: ["각 상태가 어떤 독립 증거로 진입하는지 적으세요."], expectedOutcome: "메일 보안과 전달성을 변경·감사 가능한 release 기준으로 운영합니다.", solutionOutline: ["bound→minimize→persist→deliver→align→observe→qualify 순서입니다."] },
  ],
  nextSessions: ["boot-07-map-geocoding"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["EmailService.java는 read-only로 58 lines/2,740 bytes와 SHA-256 DF067A64CF186FA2722F735F3A1778201F61645B8DD2733C0FF1F1593E729E5E를 확인했습니다.", "EmailAPIController.java는 read-only로 52 lines/1,709 bytes와 SHA-256 79DAFB0AA08972B2DA5AD8D45AF9D782D26F1069688BBABDB961901CEBC7269F를 확인했습니다.", "원본에서 SecureRandom, MimeMessageHelper HTML send와 HttpSession set/get/remove 비교 구조를 확인했지만 hash/Clock expiry/attempt/rate/@Async/outbox가 존재한다고 가정하지 않았습니다.", "실제 email, code, sender, subject/body, SMTP credential, domain/DNS와 session attribute 값은 maintained examples에 복제하지 않았습니다.", "JDK-only examples는 Spring/Jakarta Mail, actual SMTP queue/delivery, DB transaction/multi-worker와 live DNS authentication을 대체하지 않습니다."] },
});

export default session;
