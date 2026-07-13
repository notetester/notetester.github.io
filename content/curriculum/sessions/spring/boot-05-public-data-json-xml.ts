import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-14", explanation: "JDK 21 Duration·Instant·record·collections 또는 hardened XML parser로 외부 API 경계의 typed input과 limits를 모델링합니다." },
      { lines: "15-끝에서 6줄 전", explanation: "deadline, status/media classification, bounded retry, schema evolution, XXE 차단, canonical mapping 또는 freshness 결정을 deterministic하게 수행합니다." },
      { lines: "마지막 6줄", explanation: "결정 결과와 안전 불변식을 고정된 stdout으로 출력해 예상 결과와 완전히 대조합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "Spring·network·실제 공공 API key·실제 endpoint 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 줄바꿈까지 문서와 완전히 같아야 합니다.", "교육용 model은 실제 upstream SLA, Spring RestClient/WebClient codecs, TLS, rate-limit headers와 schema를 대체하지 않습니다."] },
    experiments: [
      { change: "timeout budget, status, Retry-After, missing/extra field, XML DOCTYPE, cache age를 하나씩 바꿉니다.", prediction: "retry/parse/cache 결정이 명시된 reason과 함께 달라지며 unbounded blocking이나 null 성공으로 숨지 않습니다.", result: "synthetic stub server와 contract fixtures에서 request count, elapsed time, typed outcome과 zero-secret evidence를 확인합니다." },
      { change: "실제 provider의 sanitized schema sample을 별도 fixture에 연결합니다.", prediction: "canonical model은 유지되고 provider-specific adapter 또는 compatibility alert만 바뀝니다.", result: "provider terms가 허용하는 범위에서 versioned fixtures, provenance와 observed schema fingerprint를 보존합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "source-public-api-audit",
    title: "원본 WeatherService와 Controller의 network·parse·error·secret 경계를 read-only로 감사합니다",
    lead: "외부 API 예제는 정상 응답 한 번보다 timeout, non-2xx, malformed body, schema drift와 secret/provenance 처리에서 운영 품질이 갈립니다.",
    explanations: [
      "원본 WeatherServiceImpl은 configuration에서 key를 주입받아 query URL을 만들고 HttpURLConnection으로 JSON/XML을 읽습니다. URL, key, provider-specific endpoint·category·domain 값은 공개 학습자료에 복사하지 않고 호출 구조와 위험만 provenance로 사용합니다.",
      "connection에 connect/read timeout 설정이 없고 성공 조건은 사실상 responseCode == 200에 한정됩니다. IOException catch는 message를 log하고 null을 반환하며 JSON parse 실패는 빈 목록, XML parse 실패는 null을 반환해 no-data와 dependency/contract failure가 구분되지 않습니다.",
      "JSON parser는 깊은 nested path와 field names를 고정해 missing/changed shape에 취약합니다. XML parser는 기본 DocumentBuilderFactory를 사용해 external entity/DOCTYPE hardening이 없으므로 upstream 또는 중간 데이터가 공격 가능하다면 XXE/SSRF/file disclosure 경계를 검토해야 합니다.",
      "원본 PublicDataApiController는 일부 external URL을 직접 호출해 raw String을 반환하고 여러 provider 결과 list를 controller surface로 노출합니다. controller가 provider wire shape, transport failure와 public API status를 그대로 떠안지 않도록 outbound port→provider adapter→canonical service→response DTO 층으로 나눕니다.",
    ],
    concepts: [
      c("outbound boundary", "application이 외부 provider의 network, credentials, status와 payload schema를 받아들이는 신뢰 경계입니다.", ["controller와 분리합니다.", "limits와 telemetry를 둡니다."]),
      c("typed outcome", "성공, no-data, rate-limited, timeout, invalid payload와 unavailable을 null이 아닌 구체 상태로 표현한 결과입니다.", ["HTTP mapping과 retry가 달라집니다.", "cause는 안전하게 보존합니다."]),
      c("source provenance", "어떤 provider, request time/parameters, response observation과 transformation version에서 값이 왔는지 추적하는 metadata입니다.", ["secret은 포함하지 않습니다.", "freshness 판단에 사용합니다."]),
    ],
    diagnostics: [
      d("화면에는 데이터 없음만 보이지만 provider가 실제로 timeout됐습니다.", "service가 IOException과 parse failure를 null/empty list로 반환했습니다.", ["outbound duration/status logs를 봅니다.", "service catch return을 봅니다.", "no-data와 error metrics를 비교합니다."], "sealed/typed outcome 또는 예외 taxonomy로 no-data와 dependency failure를 분리하고 HTTP/problem으로 매핑합니다.", "timeout/non-2xx/malformed/no-data fixtures를 각각 둡니다."),
      d("XML 호출 중 내부 file 또는 unexpected network access 흔적이 있습니다.", "기본 DocumentBuilderFactory가 DTD/external entities를 제한하지 않았습니다.", ["factory features/attributes를 봅니다.", "DOCTYPE fixture를 격리에서 실행합니다.", "egress/file-access telemetry를 확인합니다."], "DOCTYPE/external entities/external DTD/schema access를 금지하고 size/depth limits 또는 streaming parser를 적용합니다.", "XXE canary와 parser-upgrade regression tests를 둡니다."),
    ],
    expertNotes: ["원본에 주입된 실제 key가 source/history에 노출됐을 가능성이 있으면 문서에 복사하지 말고 provider revoke/rotate와 usage audit를 별도 수행합니다.", "source hash는 snapshot을 고정하지만 provider가 현재 같은 schema/SLA를 보장한다는 증거가 아니므로 live contract 관찰은 별도입니다."],
  },
  {
    id: "outbound-port-provider-adapter",
    title: "Controller에서 provider wire format을 제거하고 outbound port·adapter·canonical service로 분리합니다",
    lead: "provider JSON/XML과 URL을 controller가 직접 알면 외부 변경이 public API를 깨뜨리고 fallback, cache와 tests가 흩어집니다.",
    explanations: [
      "application core에는 WeatherQuery와 WeatherSnapshot 같은 canonical types, 그리고 WeatherProvider port를 둡니다. JSON provider와 XML provider adapters가 transport/config/parser를 소유하고 controller는 canonical service 결과만 HTTP DTO로 변환합니다.",
      "adapter는 provider-specific query parameter names, authentication placement, status/error envelope와 schema aliases를 캡슐화합니다. core에 provider field names나 raw Document/JsonNode를 넘기지 않습니다.",
      "fallback은 모든 실패를 다른 provider로 무조건 전환하는 기능이 아닙니다. query semantics, units, spatial/temporal resolution과 licensing이 동등한지 확인하고 timeout budget, rate quota와 stale cache를 함께 고려합니다.",
      "dependency injection은 interface를 만들었다는 사실보다 ownership과 lifecycle에 의미가 있습니다. immutable configured client를 singleton adapter에 주입하고 per-request mutable builder/body는 method local로 둡니다.",
    ],
    concepts: [
      c("outbound port", "application이 외부 capability에서 필요로 하는 domain-oriented operation을 정의한 interface입니다.", ["provider protocol을 숨깁니다.", "fake/stub 구현을 허용합니다."]),
      c("provider adapter", "특정 external API의 URI, auth, transport와 payload를 outbound port의 canonical types로 변환하는 component입니다.", ["anti-corruption layer 역할을 합니다.", "provider별 telemetry를 둡니다."]),
      c("canonical model", "여러 provider 표현을 application이 소유한 공통 semantics와 units로 정규화한 type입니다.", ["정보 손실을 문서화합니다.", "provider raw data와 구분합니다."]),
    ],
    diagnostics: [
      d("provider JSON field rename이 public REST response까지 즉시 깨뜨립니다.", "controller가 raw provider payload/Map을 그대로 반환했습니다.", ["controller return type을 봅니다.", "provider field names의 사용 범위를 찾습니다.", "public schema diff를 확인합니다."], "provider adapter에서 old/new fields를 canonical DTO로 변환하고 public response는 독립 version을 유지합니다.", "provider fixture와 public contract tests를 분리합니다."),
      d("fallback provider로 바꿨더니 값 단위와 시각이 달라집니다.", "semantic equivalence와 unit/time normalization 없이 transport 성공만 비교했습니다.", ["provider metadata/units를 봅니다.", "observation timestamp와 location resolution을 비교합니다.", "canonical mapper를 확인합니다."], "provider별 units/time/quality를 명시적으로 변환하고 동등하지 않으면 degraded provenance를 표시하거나 실패합니다.", "cross-provider golden fixtures와 tolerance rules를 둡니다."),
    ],
    expertNotes: ["canonical model은 모든 raw fields의 합집합이 아니라 application이 책임질 의미만 포함합니다.", "raw payload 보존이 audit에 필요하면 암호화, 최소 보존, license/PII policy와 access control을 별도 설계합니다."],
  },
  {
    id: "uri-query-secret-safety",
    title: "URI와 query를 typed builder로 만들고 API key·private host를 logs/cache/history에서 격리합니다",
    lead: "문자열 concatenation과 query credential은 encoding 오류뿐 아니라 access log, exception, proxy와 browser history에 secret을 확산시킬 수 있습니다.",
    explanations: [
      "base URI는 HTTPS, expected host/port와 no-userinfo constraints를 typed configuration으로 검증합니다. untrusted redirect를 자동 추적할 때 credential이 다른 host로 전달되지 않도록 redirect policy와 final URI를 확인합니다.",
      "query names/values는 component-aware builder로 percent-encode하고 이미 encoded value를 재인코딩하지 않습니다. location, timestamp, pagination bounds를 validate해 SSRF나 request explosion을 막습니다.",
      "provider가 key를 query에 요구하면 client/server/proxy access logs에서 query를 drop/redact하고 exception에 전체 URI를 넣지 않습니다. 가능하면 authorization header 또는 provider-supported credential mechanism과 short-lived/least-privileged key를 사용합니다.",
      "key는 environment/configtree/secret manager에서 주입하고 source sample에는 invalid placeholder만 둡니다. 노출 가능 key는 삭제보다 revoke/rotate가 우선이며 old key last-used와 CI artifact/history 범위를 확인합니다.",
    ],
    concepts: [
      c("component-aware URI building", "scheme, authority, path와 query components를 구분해 각각의 encoding/validation 규칙으로 URI를 생성하는 방식입니다.", ["문자열 연결을 피합니다.", "final host를 검증합니다."]),
      c("secret propagation", "credential이 source, process args, URI, logs, traces, caches와 artifacts로 복제되는 흐름입니다.", ["값 수집 자체를 줄입니다.", "rotation과 usage audit가 필요합니다."]),
      c("SSRF boundary", "attacker-controlled input이 server의 outbound destination이나 protocol을 바꾸지 못하게 제한하는 경계입니다.", ["fixed provider host를 사용합니다.", "DNS/redirect도 고려합니다."]),
    ],
    diagnostics: [
      d("access log와 APM span에 API key query가 보입니다.", "전체 request URI/query를 기본 logging/telemetry에 수집했습니다.", ["edge/app/APM/log sinks를 값 출력 없이 inventory합니다.", "credential last-used를 확인합니다.", "retention/backups를 봅니다."], "key를 revoke/rotate하고 query logging을 제거/redact하며 provider가 지원하면 header credential로 전환합니다.", "secret canary scan과 URI-safe telemetry schema를 둡니다."),
      d("사용자 입력 URL로 internal metadata endpoint가 호출됩니다.", "base URL 또는 redirect destination을 untrusted input에서 허용했습니다.", ["final resolved URI와 redirects를 봅니다.", "scheme/host/IP validation을 확인합니다.", "egress policy를 봅니다."], "fixed provider registry, HTTPS exact host/port와 egress firewall을 적용하고 redirects를 제한합니다.", "SSRF DNS/redirect/IP literal adversarial tests를 둡니다."),
    ],
    expertNotes: ["마스킹된 query도 key length/prefix를 노출할 수 있어 가능하면 query 자체를 수집하지 않습니다.", "DNS rebinding/redirect까지 다루려면 URL parse allowlist만이 아니라 resolver와 network egress control이 필요합니다."],
  },
  {
    id: "client-lifecycle-timeout-deadline",
    title: "재사용 가능한 HTTP client에 connect timeout·request timeout·전체 deadline과 cancellation을 둡니다",
    lead: "timeout이 없는 blocking I/O는 worker thread와 connection을 무기한 점유해 한 provider 장애를 application 전체 고갈로 확산시킵니다.",
    explanations: [
      "connect timeout은 TCP/TLS connection establishment를, response/request timeout은 header/body 수신을 제한합니다. DNS, pool acquisition, parse와 retries를 포함한 end-to-end deadline을 별도로 계산해 각 단계 timeout 합이 caller budget을 넘지 않게 합니다.",
      "JDK HttpClient나 Spring RestClient 같은 configured client는 connection reuse를 위해 singleton으로 관리하고 request-specific HttpRequest/builders는 매번 생성합니다. per-call new client는 handshake와 pool 효율을 악화시킬 수 있습니다.",
      "caller가 취소되거나 deadline을 넘으면 in-flight request와 retry sleep도 중단합니다. blocking stack에서 interrupt/cancellation propagation을 시험하고 response body stream은 모든 경로에서 닫습니다.",
      "timeout 값은 임의 상수가 아니라 provider latency percentiles, caller SLO와 retry attempts를 기반으로 정합니다. 너무 짧으면 retry storm, 너무 길면 resource exhaustion이 되므로 canary와 adaptive alert로 조정합니다.",
    ],
    concepts: [
      c("connect timeout", "외부 endpoint와 connection을 설정하는 단계에 허용한 최대 시간입니다.", ["전체 request deadline과 다릅니다.", "DNS/TLS 범위를 client 구현에서 확인합니다."]),
      c("deadline budget", "caller가 전체 operation 완료까지 허용한 절대 또는 남은 시간 한도입니다.", ["모든 attempts/parse가 공유합니다.", "downstream에 전파합니다."]),
      c("cancellation propagation", "상위 요청 종료나 deadline을 하위 network call, wait와 parser에 전달해 불필요 작업을 멈추는 성질입니다.", ["resource cleanup이 필요합니다.", "interrupt semantics를 시험합니다."]),
    ],
    codeExamples: [java("boot05-timeout-budget", "전체 deadline을 connect·attempt·parse 예산으로 배분", "Boot05TimeoutBudget.java", "남은 caller budget을 넘지 않게 단계별 timeout을 cap하고 retry 가능 시간을 계산합니다.", String.raw`import java.time.Duration;

public class Boot05TimeoutBudget {
record Budget(Duration total, Duration connectCap, Duration attemptCap, Duration parseReserve) {
    Duration connect() { return total.minus(parseReserve).compareTo(connectCap) < 0 ? total.minus(parseReserve) : connectCap; }
    Duration attempt() { return total.minus(parseReserve).compareTo(attemptCap) < 0 ? total.minus(parseReserve) : attemptCap; }
    boolean canRetry(Duration elapsed, Duration backoff) {
        return elapsed.plus(backoff).plus(parseReserve).compareTo(total) < 0;
    }
}

    public static void main(String[] args) {
        Budget budget = new Budget(Duration.ofMillis(1800), Duration.ofMillis(300),
                Duration.ofMillis(900), Duration.ofMillis(200));
        System.out.println("connect-ms=" + budget.connect().toMillis());
        System.out.println("attempt-ms=" + budget.attempt().toMillis());
        System.out.println("retry-at-700=" + budget.canRetry(Duration.ofMillis(700), Duration.ofMillis(200)));
        System.out.println("retry-at-1500=" + budget.canRetry(Duration.ofMillis(1500), Duration.ofMillis(200)));
        Budget tight = new Budget(Duration.ofMillis(350), Duration.ofMillis(300),
                Duration.ofMillis(900), Duration.ofMillis(200));
        System.out.println("tight-connect-ms=" + tight.connect().toMillis());
    }
}`, "connect-ms=300\nattempt-ms=900\nretry-at-700=true\nretry-at-1500=false\ntight-connect-ms=150", ["jdk-httpclient", "jdk-httprequest", "spring-rest-clients", "jdk-duration"])],
    diagnostics: [
      d("provider 장애 때 request threads가 계속 쌓이고 application이 응답하지 않습니다.", "connect/read/overall deadline이 없거나 매우 깁니다.", ["thread dump와 pool pending을 봅니다.", "client timeout config를 확인합니다.", "provider latency와 request age를 봅니다."], "bounded connect/request/deadline과 cancellation을 적용하고 concurrency bulkhead를 둡니다.", "blackhole/slow-body fault tests와 saturation alert를 둡니다."),
      d("retry를 추가한 뒤 caller timeout을 항상 초과합니다.", "각 attempt에 전체 timeout을 새로 부여해 retry/backoff가 budget을 누적 초과했습니다.", ["attempt timeline을 봅니다.", "remaining deadline 계산을 확인합니다.", "parse reserve를 봅니다."], "모든 attempts가 하나의 end-to-end deadline을 공유하고 남은 budget이 부족하면 retry하지 않습니다.", "virtual clock deadline property tests를 둡니다."),
    ],
    expertNotes: ["RestTemplate의 current deprecation/권고 상태는 사용하는 Spring version official docs로 확인하고 migration을 계획합니다.", "timeout exception을 catch해 null로 바꾸지 말고 typed transient failure와 elapsed/phase telemetry를 남깁니다."],
  },
  {
    id: "http-status-media-error-body",
    title: "2xx 범위·204·redirect·non-2xx error body·Content-Type과 size를 parse 전에 검증합니다",
    lead: "status가 200이라는 한 조건만으로 성공을 정의하거나 모든 body를 JSON/XML로 parse하면 provider의 오류 envelope와 HTML gateway page를 데이터로 오인합니다.",
    explanations: [
      "HTTP 2xx는 여러 status가 있으며 204는 body가 없습니다. provider contract가 200만 성공으로 정했다면 명시적으로 검증하되 조건식의 우연한 범위 비교에 기대지 않고 expected statuses와 body requirements를 표로 둡니다.",
      "3xx redirect를 자동 추적할지, 몇 hop과 어떤 hosts를 허용할지 결정합니다. credential-bearing request가 다른 origin으로 redirect되면 auth stripping/denial을 적용하고 final URI를 telemetry에 value-free category로 기록합니다.",
      "non-2xx body는 provider problem/error envelope일 수 있지만 HTML proxy page나 거대한 payload일 수 있습니다. status, Content-Type, Content-Length/streamed byte limit을 먼저 검사하고 bounded snippet 또는 parsed safe code만 기록합니다.",
      "2xx인데 Content-Type이 예상 JSON/XML과 다르거나 body가 malformed이면 transport success가 아니라 contract failure입니다. no-data provider code와 empty array/element는 provider schema에 맞춰 typed no-data로 변환합니다.",
    ],
    concepts: [
      c("transport success", "HTTP exchange가 status/headers/body framing 수준에서 완료된 상태입니다.", ["payload schema success와 다릅니다.", "2xx 범위를 명시합니다."]),
      c("contract failure", "응답 status/media/body가 provider와 합의한 wire schema를 만족하지 못한 실패입니다.", ["retry 여부는 원인별로 다릅니다.", "sample/fingerprint를 안전하게 기록합니다."]),
      c("bounded error body", "오류 진단을 위해 읽되 최대 bytes와 공개 field를 제한한 response body 처리입니다.", ["전체 HTML/secret dump를 피합니다.", "stream을 닫습니다."]),
    ],
    codeExamples: [java("boot05-http-classification", "status·media type·body 유무로 외부 응답 분류", "Boot05HttpClassification.java", "200 하나가 아니라 status, expected media type과 body requirement를 함께 판정합니다.", String.raw`public class Boot05HttpClassification {
    static String classify(int status, String mediaType, int bytes) {
        if (status == 204) return "success:no-content";
        if (status == 429) return "transient:rate-limited";
        if (status >= 500) return "transient:upstream";
        if (status >= 400) return "permanent:request";
        if (status < 200 || status >= 300) return "redirect-or-protocol";
        if (bytes == 0) return "contract:empty-body";
        if (!(mediaType.equals("application/json") || mediaType.equals("application/xml"))) return "contract:media-type";
        return "success:" + mediaType;
    }
    public static void main(String[] args) {
        System.out.println(classify(200, "application/json", 120));
        System.out.println(classify(204, "application/json", 0));
        System.out.println(classify(200, "text/html", 80));
        System.out.println(classify(429, "application/json", 40));
        System.out.println(classify(503, "text/plain", 20));
        System.out.println(classify(400, "application/json", 60));
    }
}`, "success:application/json\nsuccess:no-content\ncontract:media-type\ntransient:rate-limited\ntransient:upstream\npermanent:request", ["rfc9110", "rfc6585-429", "source-weather-service"])],
    diagnostics: [
      d("HTML gateway error를 JSON parser exception으로만 기록합니다.", "status와 Content-Type을 검사하기 전에 body parser를 호출했습니다.", ["raw status/content-type을 봅니다.", "redirect/final URI를 확인합니다.", "parser invocation order를 봅니다."], "status→media type→size→schema 순서로 validate하고 HTML은 bounded error category로 처리합니다.", "2xx wrong-media와 5xx HTML fixtures를 둡니다."),
      d("204 응답을 malformed JSON으로 재시도합니다.", "body가 없어야 하는 status와 payload requirement를 구분하지 않았습니다.", ["status별 provider contract를 봅니다.", "body bytes를 확인합니다.", "retry reason을 봅니다."], "204를 명시된 no-content success 또는 provider contract violation으로 처리하고 parser를 호출하지 않습니다.", "status/body combination table tests를 둡니다."),
    ],
    expertNotes: ["Content-Type parameter와 structured suffix를 허용할지는 provider contract와 parser가 지원하는 범위로 정확히 정의합니다.", "error body logging은 최대 bytes만으로 충분하지 않으며 secrets/PII field allowlist와 retention도 필요합니다."],
  },
  {
    id: "retry-idempotency-backoff",
    title: "retryable failure만 deadline 안에서 exponential backoff·jitter·Retry-After로 제한합니다",
    lead: "재시도는 성공률을 높일 수 있지만 잘못된 status, non-idempotent operation이나 무제한 동시 retry에서는 provider와 자신을 함께 압박합니다.",
    explanations: [
      "timeout, connection reset, selected 5xx와 429가 transient 후보이며 authentication, invalid parameter, schema failure를 무조건 retry하지 않습니다. provider 문서와 operation semantics를 기준으로 allowlist합니다.",
      "GET 같은 idempotent read는 retry하기 쉽지만 quota-consuming request도 비용이 있습니다. POST command는 provider idempotency key와 server guarantee가 없으면 ambiguous outcome 뒤 중복 side effect를 만들 수 있습니다.",
      "exponential backoff는 base×2^attempt를 cap하고 random jitter로 synchronized clients를 분산합니다. deterministic tests는 injected random/Clock을 사용하고 production은 attempt/elapsed/deadline/max delay를 모두 제한합니다.",
      "429/503의 Retry-After를 지원하면 delta-seconds/date를 parse하고 remaining deadline과 policy cap 안에서 존중합니다. invalid/과도한 값은 safe fallback을 사용하며 모든 retries가 하나의 request budget과 concurrency limit를 공유합니다.",
    ],
    concepts: [
      c("retry classification", "failure cause, status와 operation semantics로 재시도 가능 여부를 명시적으로 판정하는 규칙입니다.", ["exception 전체 retry를 피합니다.", "provider contract를 반영합니다."]),
      c("exponential backoff with jitter", "attempt마다 지연을 지수 증가시키되 cap과 random 분산을 적용하는 재시도 간격 전략입니다.", ["retry storm을 줄입니다.", "deadline과 결합합니다."]),
      c("Retry-After", "server가 다음 request 전 기다릴 시간을 알려 주는 response header입니다.", ["429/503에서 사용될 수 있습니다.", "무조건 무한 대기하지 않습니다."]),
    ],
    codeExamples: [java("boot05-retry-policy", "method·status·attempt별 bounded retry 판정", "Boot05RetryPolicy.java", "idempotent read와 transient statuses만 제한된 attempt 안에서 retry합니다.", String.raw`import java.util.*;

public class Boot05RetryPolicy {
    static boolean retry(String method, int status, int attempt) {
        boolean idempotent = Set.of("GET", "HEAD", "PUT", "DELETE").contains(method);
        boolean transientStatus = status == 429 || status == 502 || status == 503 || status == 504;
        return idempotent && transientStatus && attempt < 3;
    }
    static long delayMillis(int attempt) {
        long base = 100L << Math.min(attempt, 4);
        return Math.min(base, 1000L);
    }
    public static void main(String[] args) {
        System.out.println("get-503-a0=" + retry("GET", 503, 0));
        System.out.println("post-503-a0=" + retry("POST", 503, 0));
        System.out.println("get-400-a0=" + retry("GET", 400, 0));
        System.out.println("get-429-a3=" + retry("GET", 429, 3));
        for (int attempt = 0; attempt < 5; attempt++) System.out.println("delay" + attempt + "=" + delayMillis(attempt));
    }
}`, "get-503-a0=true\npost-503-a0=false\nget-400-a0=false\nget-429-a3=false\ndelay0=100\ndelay1=200\ndelay2=400\ndelay3=800\ndelay4=1000", ["rfc9110", "rfc6585-429", "spring-rest-clients"])],
    diagnostics: [
      d("provider 장애 순간 outbound traffic이 정상의 여러 배로 증가합니다.", "모든 instance가 즉시 같은 간격으로 retry해 retry storm을 만들었습니다.", ["attempt count와 timestamps를 봅니다.", "backoff/jitter/cap을 확인합니다.", "concurrency와 deadline을 봅니다."], "bounded exponential backoff, jitter, retry budget과 bulkhead를 적용합니다.", "fleet-level fault test와 attempt amplification alert를 둡니다."),
      d("POST timeout 뒤 동일 데이터가 두 번 생성됩니다.", "ambiguous outcome인 non-idempotent operation을 key 없이 retry했습니다.", ["provider request IDs를 봅니다.", "idempotency guarantee/key를 확인합니다.", "timeout이 send 전/후인지 봅니다."], "provider-supported idempotency key/lookup이 없으면 자동 retry를 금지하고 reconciliation state로 전환합니다.", "response-loss duplicate side-effect tests를 둡니다."),
    ],
    expertNotes: ["예제는 jitter 없이 deterministic delay만 보입니다. production은 injected RNG로 full/equal/decorrelated jitter 중 선택을 검증합니다.", "DELETE가 protocol상 idempotent여도 provider quota/audit side effects와 response semantics를 고려합니다."],
  },
  {
    id: "rate-limit-concurrency-circuit",
    title: "provider quota를 token budget·concurrency bulkhead·cache·circuit state로 보호합니다",
    lead: "429에 도달한 뒤 재시도만 조절하기보다 요청을 만들기 전 quota와 in-flight concurrency를 제어해야 합니다.",
    explanations: [
      "provider의 초/분/일 quota와 endpoint별 비용을 configuration schema로 관리합니다. tenant/user 입력이 unbounded fan-out을 만들지 않게 query batching, deduplication과 cache coalescing을 적용합니다.",
      "bulkhead는 provider별 semaphore/connection pool/queue를 제한해 한 dependency가 모든 request threads를 점유하지 않게 합니다. queue wait도 deadline에 포함하고 full이면 fast failure 또는 stale result를 반환합니다.",
      "circuit breaker는 반복 transient failures에서 잠시 호출을 차단하고 half-open probe로 회복을 확인합니다. authentication/schema failure를 단순 availability circuit으로 숨기지 않고 alert/disable configuration으로 분류합니다.",
      "rate headers가 있다면 provider-specific adapter가 remaining/reset semantics를 해석하지만 신뢰 가능한 단일 truth로 과장하지 않습니다. local counters, 429, subscription console과 billing/audit를 대조합니다.",
    ],
    concepts: [
      c("bulkhead", "dependency별 동시 실행과 queue를 격리해 resource exhaustion의 blast radius를 제한하는 패턴입니다.", ["timeout과 함께 사용합니다.", "rejection 계약이 필요합니다."]),
      c("request coalescing", "동일 key의 동시에 발생한 fetch를 하나의 in-flight request로 합치고 결과를 공유하는 방식입니다.", ["stampede를 줄입니다.", "cancellation/tenant scope를 설계합니다."]),
      c("circuit breaker", "실패율/횟수 조건에서 호출을 일시 차단하고 제한된 probe로 recovery를 확인하는 state machine입니다.", ["retry와 역할이 다릅니다.", "false open과 stale policy를 관찰합니다."]),
    ],
    diagnostics: [
      d("한 인기 location 요청으로 provider quota가 빠르게 소진됩니다.", "동일 query를 request마다 호출하고 cache/coalescing/rate budget이 없습니다.", ["normalized query별 call count를 봅니다.", "cache hit/coalesced waiters를 봅니다.", "provider quota usage를 확인합니다."], "semantic cache key, single-flight coalescing과 provider/tenant quota budget을 적용합니다.", "burst/load tests와 calls-per-result SLO를 둡니다."),
      d("provider가 느려지자 unrelated endpoints도 thread starvation입니다.", "outbound calls가 global worker/connection pool을 제한 없이 점유했습니다.", ["thread/connection pool by dependency를 봅니다.", "queue wait를 확인합니다.", "cancellation propagation을 봅니다."], "provider별 concurrency bulkhead, bounded queue와 fast degradation을 적용합니다.", "dependency saturation isolation tests를 둡니다."),
    ],
    expertNotes: ["circuit open 동안 stale cache를 반환하면 age/provenance와 degraded status를 client가 알 수 있게 합니다.", "local limiter가 여러 replicas의 global daily quota를 완전히 보장하지 않으므로 shared accounting 또는 conservative allocation을 고려합니다."],
  },
  {
    id: "json-schema-drift-limits",
    title: "JSON을 schema-first로 검증하고 required/optional/unknown/type drift와 resource limits를 분리합니다",
    lead: "깊은 path를 곧바로 get하면 중간 object가 사라지는 순간 generic exception이 되므로 boundary schema와 compatibility policy가 필요합니다.",
    explanations: [
      "provider response의 envelope, list, item과 pagination/error schemas를 versioned fixtures로 둡니다. required field는 없으면 contract failure, optional field는 documented default/absence로 처리하고 unknown additive fields는 보존 여부와 telemetry를 정합니다.",
      "string으로 오던 count/measurement가 number가 되거나 item이 object/array 사이에서 바뀌는 type drift를 coercion으로 조용히 숨기지 않습니다. 안전한 명시적 compatibility adapter는 old/new shape를 별도 branches로 parse하고 deprecation alert를 냅니다.",
      "JSON payload bytes, nesting depth, array items, string length와 numeric range를 parse 전/중 제한합니다. 전체 JsonNode tree는 단순하지만 큰 document에서 memory amplification이 있으므로 streaming parser와 per-record validation을 고려합니다.",
      "schema fingerprint와 first-observed time, provider response media/version을 값 없이 기록합니다. sample payload는 provider terms와 개인정보를 확인하고 synthetic/redacted fixture를 우선합니다.",
    ],
    concepts: [
      c("schema drift", "provider payload의 field, type, requiredness, nesting 또는 semantics가 consumer expectation에서 변하는 현상입니다.", ["additive와 breaking을 구분합니다.", "관찰 시점을 기록합니다."]),
      c("compatibility adapter", "한정된 old/new provider shapes를 명시적으로 받아 같은 canonical model로 변환하는 임시 migration logic입니다.", ["무제한 coercion을 피합니다.", "removal date/telemetry가 필요합니다."]),
      c("parser resource limit", "payload bytes, depth, token/string/array 크기 등 parser가 소비할 수 있는 자원 상한입니다.", ["DoS를 제한합니다.", "business bounds와 함께 둡니다."]),
    ],
    codeExamples: [java("boot05-json-drift", "required·optional·unknown JSON shape를 typed policy로 판정", "Boot05JsonDrift.java", "Map fixture에서 required field와 type을 엄격히 검사하고 optional/unknown additions를 별도 evidence로 기록합니다.", String.raw`import java.util.*;

public class Boot05JsonDrift {
    static String inspect(Map<String, Object> item) {
        if (!item.containsKey("observedAt")) return "invalid:missing-observedAt";
        if (!(item.get("observedAt") instanceof String)) return "invalid:type-observedAt";
        if (!item.containsKey("value")) return "invalid:missing-value";
        if (!(item.get("value") instanceof Number)) return "invalid:type-value";
        Set<String> unknown = new TreeSet<>(item.keySet());
        unknown.removeAll(Set.of("observedAt", "value", "quality"));
        String quality = item.containsKey("quality") ? item.get("quality").toString() : "unknown";
        return "valid:quality=" + quality + ",unknown=" + unknown;
    }
    public static void main(String[] args) {
        System.out.println(inspect(Map.of("observedAt", "2026-01-01T00:00:00Z", "value", 12.5)));
        System.out.println(inspect(Map.of("observedAt", "2026-01-01T00:00:00Z", "value", 12.5, "quality", "verified", "note", "new")));
        System.out.println(inspect(Map.of("value", 12.5)));
        System.out.println(inspect(Map.of("observedAt", "2026-01-01T00:00:00Z", "value", "12.5")));
    }
}`, "valid:quality=unknown,unknown=[]\nvalid:quality=verified,unknown=[note]\ninvalid:missing-observedAt\ninvalid:type-value", ["source-public-controller", "json-schema-core", "rfc8259", "source-weather-service", "openapi-311"])],
    diagnostics: [
      d("provider가 field 하나를 제거하자 NullPointerException 후 빈 목록이 반환됩니다.", "nested path requiredness를 검증하지 않고 catch-all로 no-data처럼 처리했습니다.", ["first missing path를 봅니다.", "schema fixture/version을 확인합니다.", "empty result mapping을 추적합니다."], "boundary schema에서 required path failure를 typed contract error로 만들고 last-known-good/fallback 정책을 별도 적용합니다.", "missing intermediate/item field mutation tests를 둡니다."),
      d("작은 response였는데 parser memory가 급증합니다.", "압축 해제 크기, nesting/array/string limits 없이 전체 tree를 만들었습니다.", ["wire/decompressed bytes와 heap profile을 봅니다.", "depth/item counts를 확인합니다.", "parser constraints를 봅니다."], "compressed/decompressed byte, depth, token과 item limits를 두고 필요하면 streaming parse합니다.", "zip-bomb/deep/huge-array fixtures를 격리에서 둡니다."),
    ],
    expertNotes: ["JSON Schema validation 성공은 units, freshness와 domain range가 맞다는 보증이 아니므로 canonical mapping validation이 추가로 필요합니다.", "unknown fields를 모두 reject하면 provider additive change에 취약하고 모두 ignore하면 drift를 놓치므로 accept+observe 또는 endpoint별 policy를 명시합니다."],
  },
  {
    id: "xml-secure-parsing-xxe",
    title: "XML parser에서 DOCTYPE·external entities·external schema를 금지하고 size/depth를 제한합니다",
    lead: "기본 DocumentBuilderFactory는 안전한 외부 데이터 parser 설정이 아니므로 XXE, entity expansion과 memory limits를 명시해야 합니다.",
    explanations: [
      "FEATURE_SECURE_PROCESSING을 켜고 DOCTYPE을 금지하며 external general/parameter entities와 external DTD/schema access를 비활성화합니다. 필요한 feature가 parser에서 지원되지 않으면 조용히 계속하지 말고 startup/test에서 fail closed합니다.",
      "DocumentBuilderFactory와 DocumentBuilder는 thread-safety를 가정하지 않고 documented lifecycle로 사용합니다. parser에 ErrorHandler를 설정해 malformed input이 stderr에 민감 snippets를 출력하지 않게 typed error로 변환합니다.",
      "DOM은 전체 tree를 memory에 만들므로 payload limit 이후에도 깊이, element count와 text length를 검증합니다. 대형 feeds는 hardened streaming parser를 고려하되 event state machine과 entity settings를 별도로 test합니다.",
      "namespaceAware 설정과 qualified names를 provider schema에 맞춥니다. getElementsByTagName 전역 검색은 nested context가 바뀌면 잘못된 item을 잡을 수 있어 direct child/namespace path와 cardinality를 검증합니다.",
    ],
    concepts: [
      c("XXE", "XML external entity resolution을 악용해 local file, network resource 또는 service availability를 침해하는 공격 class입니다.", ["DTD/entity를 금지하는 것이 핵심입니다.", "egress control도 보조합니다."]),
      c("FEATURE_SECURE_PROCESSING", "XML processor가 implementation-defined secure processing limits를 적용하도록 요청하는 표준 feature입니다.", ["외부 access 차단을 별도 설정합니다.", "limit 값을 target JDK에서 검증합니다."]),
      c("fail closed parser configuration", "필수 보안 feature를 적용할 수 없으면 unsafe default로 parse를 계속하지 않고 initialization을 실패시키는 정책입니다.", ["parser upgrade regression을 둡니다.", "지원 여부를 startup에 검증합니다."]),
    ],
    codeExamples: [java("boot05-safe-xml", "DOCTYPE와 external entity를 차단하는 JAXP parser", "Boot05SafeXml.java", "JDK XMLConstants와 parser features를 적용해 정상 XML은 읽고 DOCTYPE payload는 stderr 노출 없이 거부합니다.", String.raw`import java.io.*;
import javax.xml.XMLConstants;
import javax.xml.parsers.*;
import org.w3c.dom.Document;
import org.xml.sax.*;
import org.xml.sax.helpers.DefaultHandler;

public class Boot05SafeXml {
    static Document parse(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
        factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
        DocumentBuilder builder = factory.newDocumentBuilder();
        builder.setErrorHandler(new DefaultHandler() {
            @Override public void error(SAXParseException ex) throws SAXException { throw ex; }
            @Override public void fatalError(SAXParseException ex) throws SAXException { throw ex; }
        });
        return builder.parse(new ByteArrayInputStream(xml.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    }
    public static void main(String[] args) throws Exception {
        Document safe = parse("<weather><item><value>12</value></item></weather>");
        System.out.println("root=" + safe.getDocumentElement().getTagName());
        System.out.println("items=" + safe.getElementsByTagName("item").getLength());
        boolean blocked;
        try { parse("<!DOCTYPE x [<!ENTITY e SYSTEM 'file:///forbidden'>]><x>&e;</x>"); blocked = false; }
        catch (SAXException ex) { blocked = true; }
        System.out.println("doctype-blocked=" + blocked);
    }
}`, "root=weather\nitems=1\ndoctype-blocked=true", ["jdk-documentbuilderfactory", "jdk-xmlconstants", "owasp-xxe", "w3c-xml"])],
    diagnostics: [
      d("DOCTYPE fixture가 local file text를 element에 포함합니다.", "external entities/DTD access가 활성화된 parser를 사용했습니다.", ["factory feature/attributes를 봅니다.", "actual parser implementation/version을 확인합니다.", "egress/file access를 격리에서 관찰합니다."], "DOCTYPE, external entities와 external DTD/schema를 fail-closed 차단하고 parser limits를 적용합니다.", "JDK/parser upgrade마다 XXE regression fixture를 둡니다."),
      d("namespace가 추가된 뒤 item count가 0 또는 잘못된 값을 반환합니다.", "namespace awareness와 contextual path/cardinality를 정의하지 않고 tag-name 전역 검색을 사용했습니다.", ["namespace URI/local name을 봅니다.", "tree/path를 sanitized fixture로 확인합니다.", "duplicate/nested tags를 시험합니다."], "namespace-aware direct path와 expected cardinality/type을 검증해 canonical mapper에 전달합니다.", "namespaced/nested/duplicate/missing XML fixtures를 둡니다."),
    ],
    expertNotes: ["보안 feature URI 지원은 parser/JDK에 따라 확인해야 하며 catch하고 무시하면 fail open입니다.", "XML signature가 필요한 경우 wrapping/canonicalization 등 별도 복잡성이 있으므로 일반 DOM hardening만으로 안전하다고 간주하지 않습니다."],
  },
  {
    id: "json-xml-canonical-parity",
    title: "JSON과 XML adapters를 같은 canonical units·time·missing-value semantics로 수렴시킵니다",
    lead: "두 format이 같은 provider operation을 표현해도 숫자 type, element absence, attributes와 timezone이 달라질 수 있어 parse 성공만 비교하면 안 됩니다.",
    explanations: [
      "각 adapter는 raw string/number와 provider units를 읽은 뒤 BigDecimal/enum/Instant 같은 canonical types로 변환합니다. XML 빈 element, missing element, JSON null과 absent를 같은 no-observation semantics로 합칠지 명시합니다.",
      "observation time, publication time와 retrieval time을 구분합니다. provider local date/time에 timezone가 없으면 provider contract의 zone을 명시적으로 적용하고 DST gap/overlap을 test합니다.",
      "quality flag, station/location resolution과 unit conversion rounding을 canonical model에 포함하거나 provenance로 보존합니다. 값만 같다고 source quality까지 같다고 간주하지 않습니다.",
      "JSON/XML parity tests는 semantic field를 비교하고 raw serialization order/whitespace를 비교하지 않습니다. provider format별 fixture가 같은 canonical snapshot을 만들고 invalid inputs는 같은 typed failure class로 수렴해야 합니다.",
    ],
    concepts: [
      c("semantic parity", "서로 다른 wire formats가 canonical units, timestamps, missing/error 의미에서 동등한 결과를 만드는 성질입니다.", ["문자열 bytes equality가 아닙니다.", "quality/provenance도 봅니다."]),
      c("observation time", "측정/관측이 실제로 나타내는 시각으로 retrieval/publication time과 구분됩니다.", ["timezone와 precision을 보존합니다.", "freshness의 기준입니다."]),
      c("unit normalization", "provider-specific 측정 단위를 application canonical unit으로 정확한 conversion/rounding rule로 변환하는 과정입니다.", ["원 단위도 provenance에 남깁니다.", "range validation을 적용합니다."]),
    ],
    codeExamples: [java("boot05-canonical", "JSON/XML provider records를 같은 canonical snapshot으로 변환", "Boot05Canonical.java", "format별 raw type 차이를 adapter에서 흡수하고 canonical value/time/unit equality를 확인합니다.", String.raw`import java.math.BigDecimal;
import java.time.Instant;

public class Boot05Canonical {
    record JsonReading(String observedAt, double value, String unit) {}
    record XmlReading(String observedAtText, String valueText, String unitText) {}
    record Snapshot(Instant observedAt, BigDecimal value, String unit) {}
    static Snapshot fromJson(JsonReading value) {
        return new Snapshot(Instant.parse(value.observedAt()), BigDecimal.valueOf(value.value()), value.unit());
    }
    static Snapshot fromXml(XmlReading value) {
        return new Snapshot(Instant.parse(value.observedAtText()), new BigDecimal(value.valueText()), value.unitText());
    }
    public static void main(String[] args) {
        Snapshot json = fromJson(new JsonReading("2026-01-01T00:00:00Z", 12.5, "C"));
        Snapshot xml = fromXml(new XmlReading("2026-01-01T00:00:00Z", "12.50", "C"));
        System.out.println("json=" + json.observedAt() + "," + json.value() + json.unit());
        System.out.println("xml=" + xml.observedAt() + "," + xml.value() + xml.unit());
        System.out.println("semantic-equal=" + (json.observedAt().equals(xml.observedAt())
                && json.value().compareTo(xml.value()) == 0 && json.unit().equals(xml.unit())));
    }
}`, "json=2026-01-01T00:00:00Z,12.5C\nxml=2026-01-01T00:00:00Z,12.50C\nsemantic-equal=true", ["rfc8259", "w3c-xml", "jdk-clock"])],
    diagnostics: [
      d("JSON과 XML 결과가 같은 값인데 서로 다른 시각을 가리킵니다.", "한 format은 UTC, 다른 format은 provider local time으로 parse했습니다.", ["raw time fields와 zone contract를 봅니다.", "canonical Instant를 비교합니다.", "DST boundary fixture를 실행합니다."], "provider별 zone/precision을 adapter에 명시하고 canonical Instant와 original provenance를 보존합니다.", "UTC/offset/local/DST gap-overlap tests를 둡니다."),
      d("format 전환 뒤 소수점 값이 조금씩 달라집니다.", "double parsing과 unit conversion/rounding policy가 adapters마다 다릅니다.", ["raw lexical value/unit을 봅니다.", "BigDecimal conversion source를 확인합니다.", "rounding scale/mode를 대조합니다."], "정확도가 필요한 measurement는 lexical BigDecimal과 공통 unit conversion policy를 사용합니다.", "boundary/round-trip/parity fixtures를 둡니다."),
    ],
    expertNotes: ["BigDecimal equality는 scale까지 비교하므로 semantic numeric parity에는 compareTo, wire formatting parity에는 별도 scale 계약을 사용합니다.", "canonicalization이 provider의 불확실성/quality flag를 버리면 숫자 parity만 맞고 의사결정은 잘못될 수 있습니다."],
  },
  {
    id: "cache-freshness-validators-stale",
    title: "semantic cache key·freshness·ETag/Last-Modified와 stale-if-error 정책을 명시합니다",
    lead: "외부 데이터를 cache하면 quota와 latency를 줄일 수 있지만 시간·location·format·authorization dimensions나 관측 시각을 놓치면 오래되거나 다른 값을 반환합니다.",
    explanations: [
      "cache key는 normalized query, provider, canonical schema version과 결과 semantics를 바꾸는 모든 dimensions를 포함합니다. API key나 사용자 개인정보를 key/log에 그대로 넣지 않고 tenant isolation이 필요하면 opaque scope를 포함합니다.",
      "freshness TTL은 provider update cadence와 business 허용 age를 기반으로 하고 retrieval time보다 observation/publication time을 함께 봅니다. negative/no-data cache는 짧은 별도 TTL로 outage를 영구화하지 않습니다.",
      "provider가 ETag/Last-Modified를 지원하면 If-None-Match/If-Modified-Since로 conditional request를 보내 304에서 stored representation metadata를 갱신합니다. validator가 query/provider와 정확히 결합됐는지 확인합니다.",
      "stale-if-error는 bounded maximum staleness, eligible transient errors와 response provenance/degraded indicator를 명시합니다. authentication, schema corruption과 revoked data에서는 stale을 조용히 반환하지 않습니다.",
    ],
    concepts: [
      c("semantic cache key", "결과 의미를 바꾸는 normalized inputs와 schema/provider scope를 모두 포함한 cache identity입니다.", ["secret을 포함하지 않습니다.", "key collision tests가 필요합니다."]),
      c("conditional request", "ETag 또는 Last-Modified validator로 representation 변경 여부만 확인해 전송 비용을 줄이는 HTTP 요청입니다.", ["304 handling이 필요합니다.", "validator scope를 지킵니다."]),
      c("stale-if-error policy", "선택된 transient failure에서 제한된 age의 이전 성공 값을 degraded 표시와 함께 반환하는 복구 규칙입니다.", ["모든 error에 적용하지 않습니다.", "max stale와 provenance를 공개합니다."]),
    ],
    codeExamples: [java("boot05-cache-freshness", "observation age와 failure class로 fresh/stale 사용 판정", "Boot05CacheFreshness.java", "주입한 현재 시각으로 fresh, bounded stale fallback과 too-old 결과를 결정합니다.", String.raw`import java.time.*;

public class Boot05CacheFreshness {
    record Cached(Instant observedAt, Instant fetchedAt) {}
    static String decide(Cached cached, Instant now, boolean transientFailure) {
        Duration age = Duration.between(cached.observedAt(), now);
        if (age.compareTo(Duration.ofMinutes(10)) <= 0) return "fresh:" + age.toMinutes() + "m";
        if (transientFailure && age.compareTo(Duration.ofMinutes(30)) <= 0) return "stale-fallback:" + age.toMinutes() + "m";
        return "unavailable:" + age.toMinutes() + "m";
    }
    public static void main(String[] args) {
        Instant now = Instant.parse("2026-01-01T01:00:00Z");
        System.out.println(decide(new Cached(now.minus(Duration.ofMinutes(5)), now.minusSeconds(30)), now, false));
        System.out.println(decide(new Cached(now.minus(Duration.ofMinutes(20)), now.minus(Duration.ofMinutes(15))), now, true));
        System.out.println(decide(new Cached(now.minus(Duration.ofMinutes(20)), now.minus(Duration.ofMinutes(15))), now, false));
        System.out.println(decide(new Cached(now.minus(Duration.ofMinutes(45)), now.minus(Duration.ofMinutes(40))), now, true));
    }
}`, "fresh:5m\nstale-fallback:20m\nunavailable:20m\nunavailable:45m", ["rfc9111", "jdk-clock", "jdk-duration"])],
    diagnostics: [
      d("서로 다른 query가 같은 cached response를 받습니다.", "cache key에서 location/time/provider/filter dimension이 빠졌습니다.", ["normalized request와 key를 비교합니다.", "collision 순서를 재현합니다.", "tenant/provider scope를 봅니다."], "모든 semantic dimensions와 schema version을 canonical key에 포함하고 secrets는 opaque scope로 분리합니다.", "pairwise key collision/property tests를 둡니다."),
      d("provider 인증 오류인데 오래된 값이 정상처럼 계속 보입니다.", "stale fallback을 모든 failure에 적용하고 age/provenance를 숨겼습니다.", ["fallback eligibility reason을 봅니다.", "cached observation age를 확인합니다.", "response degraded indicator를 봅니다."], "transient availability failure만 bounded stale 대상으로 하고 auth/schema/revocation은 fail closed합니다.", "failure-class×age stale matrix를 둡니다."),
    ],
    expertNotes: ["fetchedAt만으로 freshness를 판단하면 provider가 오래된 observation을 새로 반환한 경우를 놓칩니다.", "cache encryption과 access control은 민감한 raw/provider data classification에 맞추며 deletion/retention obligations를 포함합니다."],
  },
  {
    id: "provenance-observability-contract-tests",
    title: "데이터 provenance·license·schema fingerprint와 contract/fault tests를 운영 release gate로 만듭니다",
    lead: "외부 데이터의 숫자만 저장하면 언제 어디서 어떤 provider/adapter version으로 얻었는지, 사용 조건과 품질이 무엇인지 나중에 설명할 수 없습니다.",
    explanations: [
      "canonical snapshot에는 provider identifier, observation/publication/retrieval time, normalized query scope, units/quality와 adapter/schema version을 넣습니다. request credential, full URL query와 불필요한 개인 위치는 제외하거나 최소화합니다.",
      "공공데이터라도 license, attribution, redistribution, retention, rate limits와 변경 공지를 확인합니다. source link와 retrieved-at을 사용자 UI/다운stream export에 필요한 수준으로 표시하고 provider 이름을 데이터 정확성 보증처럼 과장하지 않습니다.",
      "metrics는 provider/operation, outcome class, status class, attempt, cache result, latency/bytes와 parser failure reason을 낮은 cardinality로 기록합니다. raw payload, key, exact user query와 exception message를 label/log에 넣지 않습니다.",
      "stub server tests는 timeout, slow/chunked/oversize, DNS/connect/TLS failure, 204/3xx/4xx/429/5xx, wrong media, malformed/old/new JSON/XML, XXE, Retry-After, cache stampede와 cancellation을 재현합니다. live smoke는 provider terms와 quota 안에서 최소화합니다.",
      "schema change는 observed fingerprint alert, quarantined sample, adapter patch, canary와 rollback 순서로 처리합니다. unknown data를 null/empty 성공으로 배포하지 않고 last-known-good/stale status와 incident owner를 분명히 합니다.",
    ],
    concepts: [
      c("data provenance record", "값의 provider, 관측·수집 시각, query scope, units, quality와 transformation version을 설명하는 metadata입니다.", ["재현성과 attribution에 필요합니다.", "secret/PII 최소화를 적용합니다."]),
      c("schema fingerprint", "민감 값 없이 field/type/structure 변화 여부를 식별하는 stable digest 또는 version evidence입니다.", ["semantic change 전체를 잡지는 못합니다.", "first-seen과 sample custody를 기록합니다."]),
      c("fault injection contract test", "외부 dependency의 network/status/payload 실패를 제어된 stub으로 재현해 timeout, retry, parser와 degradation 계약을 검증하는 테스트입니다.", ["live outage를 기다리지 않습니다.", "elapsed/request count를 assert합니다."]),
    ],
    diagnostics: [
      d("사용자가 값의 기준 시각과 출처를 물었지만 답할 수 없습니다.", "canonical data에 observation/provenance와 adapter version을 저장하지 않았습니다.", ["stored fields와 response metadata를 봅니다.", "provider terms/attribution을 확인합니다.", "retrieval logs의 retention을 봅니다."], "최소 provenance schema를 canonical model과 exports에 추가하고 과거 unknown은 추정하지 않고 unknown으로 표시합니다.", "provenance completeness tests와 UI attribution review를 둡니다."),
      d("provider schema 변경이 production에서 처음 발견됩니다.", "versioned fixtures, drift fingerprint와 canary contract smoke가 없습니다.", ["provider notices와 last-good fixture를 봅니다.", "parser failure onset을 확인합니다.", "deployment/schema timeline을 대조합니다."], "sanitized old/current/next fixtures와 periodic canary를 운영하고 drift 시 adapter를 격리 배포합니다.", "schema mutation tests와 automated alert/rollback을 둡니다."),
    ],
    expertNotes: ["provider sample payload의 공개·저장 권한도 license와 개인정보 정책을 확인해야 하므로 synthetic fixtures를 기본으로 합니다.", "telemetry에서 status 200만 성공으로 보지 말고 schema-validated canonical mapping과 freshness outcome까지 집계합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "source-weather-service", repository: "nohssam springmvc/myproject01 학습 원본", path: "springmvc\\myproject01\\src\\main\\java\\org\\study\\myproject01\\publicdata\\service\\WeatherServiceImpl.java", usedFor: ["HttpURLConnection", "query credential structure", "missing timeouts", "JSON nested path", "default XML parser", "null/empty failure"], evidence: "2026-07-14 read-only audit에서 timeout 없는 HttpURLConnection, 사실상 200 전용 성공 판정, catch 후 null/empty, rigid JSON path와 unhardened DocumentBuilderFactory를 확인했습니다. 실제 endpoint/key/category 값은 복사하지 않았습니다. SHA-256 8B690130CF98C13B4FDA06897E5FD6F88A31B787F6D3BC3327A916F8AD2C23D4." },
  { id: "source-public-controller", repository: "nohssam springmvc/myproject01 학습 원본", path: "springmvc\\myproject01\\src\\main\\java\\org\\study\\myproject01\\publicdata\\controller\\PublicDataApiController.java", usedFor: ["controller direct external call", "raw String response", "provider list exposure", "missing typed error mapping"], evidence: "2026-07-14 read-only audit에서 controller가 일부 external URL을 직접 호출해 raw String을 반환하고 provider results를 public surface에 노출하는 구조를 확인했습니다. 실제 route/domain 값은 복사하지 않았습니다. SHA-256 E300058E3545D52142A15000A24A21C391A6C3B66C3FD2E0F49F21FCDFF784B5." },
  { id: "spring-rest-clients", repository: "Spring Framework Reference", path: "integration/rest-clients.html", publicUrl: "https://docs.spring.io/spring-framework/reference/integration/rest-clients.html", usedFor: ["RestClient", "WebClient", "HTTP interface", "RestTemplate lifecycle status"], evidence: "current official Spring reference에서 synchronous/reactive REST clients와 current RestTemplate guidance를 확인했습니다." },
  { id: "jdk-httpclient", repository: "Oracle Java SE 21 API", path: "java.net.http/java/net/http/HttpClient.html", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.html", usedFor: ["reusable HTTP client", "connect timeout", "redirect", "sync/async send"], evidence: "JDK 21 HttpClient의 immutable configured client, timeout/redirect와 send APIs를 확인했습니다." },
  { id: "jdk-httprequest", repository: "Oracle Java SE 21 API", path: "java.net.http/java/net/http/HttpRequest.html", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpRequest.html", usedFor: ["request timeout", "URI", "headers", "method/body"], evidence: "JDK 21 HttpRequest builder의 per-request URI, timeout, headers와 body publisher APIs를 확인했습니다." },
  { id: "jdk-documentbuilderfactory", repository: "Oracle Java SE 21 API", path: "java.xml/javax/xml/parsers/DocumentBuilderFactory.html", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/javax/xml/parsers/DocumentBuilderFactory.html", usedFor: ["DOM parser factory", "features", "namespace awareness", "secure configuration"], evidence: "JAXP DocumentBuilderFactory의 feature/attribute configuration과 parser construction API를 확인했습니다." },
  { id: "jdk-xmlconstants", repository: "Oracle Java SE 21 API", path: "java.xml/javax/xml/XMLConstants.html", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/javax/xml/XMLConstants.html", usedFor: ["FEATURE_SECURE_PROCESSING", "ACCESS_EXTERNAL_DTD", "ACCESS_EXTERNAL_SCHEMA"], evidence: "JAXP secure processing와 external access restriction constants를 확인했습니다." },
  { id: "owasp-xxe", repository: "OWASP Cheat Sheet Series", path: "XML_External_Entity_Prevention_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html", usedFor: ["XXE threat", "DOCTYPE disablement", "JAXP hardening", "defense in depth"], evidence: "untrusted XML parser에서 DTD/external entities를 비활성화하는 security guidance를 확인했습니다." },
  { id: "json-schema-core", repository: "JSON Schema", path: "draft/2020-12/json-schema-core", publicUrl: "https://json-schema.org/draft/2020-12/json-schema-core", usedFor: ["JSON schema", "instance validation", "vocabulary", "schema evolution"], evidence: "JSON Schema 2020-12 Core specification의 schema/instance model을 확인했습니다." },
  { id: "rfc8259", repository: "IETF RFC Editor", path: "rfc/rfc8259.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc8259.html", usedFor: ["JSON syntax", "numbers", "interoperability", "parser limits context"], evidence: "JSON grammar와 parser interoperability/security considerations를 RFC 원문에서 확인했습니다." },
  { id: "rfc9110", repository: "IETF RFC Editor", path: "rfc/rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["HTTP status", "methods", "Retry-After", "conditional requests", "media types"], evidence: "HTTP semantics, status, validators와 Retry-After field의 기준을 확인했습니다." },
  { id: "rfc9111", repository: "IETF RFC Editor", path: "rfc/rfc9111.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9111.html", usedFor: ["freshness", "cache keys", "validators", "stale response"], evidence: "HTTP caching의 freshness, validation과 stale handling semantics를 확인했습니다." },
  { id: "rfc6585-429", repository: "IETF RFC Editor", path: "rfc/rfc6585.html#section-4", publicUrl: "https://www.rfc-editor.org/rfc/rfc6585.html#section-4", usedFor: ["429 Too Many Requests", "Retry-After", "rate limiting"], evidence: "RFC 6585 section 4의 429 status와 Retry-After 사용을 확인했습니다." },
  { id: "w3c-xml", repository: "W3C", path: "TR/xml/", publicUrl: "https://www.w3.org/TR/xml/", usedFor: ["XML documents", "elements", "entities", "well-formedness"], evidence: "XML specification의 document, DTD/entity와 well-formedness 기반을 확인했습니다." },
  { id: "jdk-clock", repository: "Oracle Java SE 21 API", path: "java.base/java/time/Clock.html", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Clock.html", usedFor: ["injected current time", "deterministic freshness/retry tests"], evidence: "Clock abstraction과 fixed/offset clock을 deterministic time tests에 사용하는 API를 확인했습니다." },
  { id: "jdk-duration", repository: "Oracle Java SE 21 API", path: "java.base/java/time/Duration.html", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Duration.html", usedFor: ["timeouts", "deadline budget", "cache age", "non-negative validation"], evidence: "Duration의 immutable time-based amount와 comparison/arithmetic APIs를 확인했습니다." },
  { id: "openapi-311", repository: "OpenAPI Initiative", path: "oas/v3.1.1.html", publicUrl: "https://spec.openapis.org/oas/v3.1.1.html", usedFor: ["public response DTO", "provider-independent REST schema", "error contracts"], evidence: "OpenAPI 3.1.1 operations, response media schemas와 JSON Schema alignment를 확인했습니다." },
];

const session = createExpertSession({
  inventoryId: "boot-05-public-data-json-xml", slug: "boot-05-public-data-json-xml", courseId: "spring", moduleId: "spring-boot-rest-integration", order: 5,
  title: "공공데이터 JSON·XML 호출과 응답 매핑",
  subtitle: "timeout·retry·schema drift·XXE·quota·cache·provenance를 갖춘 provider adapter로 원본 호출을 재구성합니다",
  level: "고급", estimatedMinutes: 105,
  coreQuestion: "외부 공공 API의 JSON/XML을 secret과 resources를 보호하며 호출하고, provider 장애·schema 변화·불완전 데이터를 canonical REST 계약과 provenance로 어떻게 안전하게 변환할까요?",
  summary: "WeatherServiceImpl과 PublicDataApiController 두 원본을 read-only로 감사합니다. 원본의 query-key URL 구조, timeout 없는 HttpURLConnection, 사실상 200만 성공 처리, catch 후 null/empty, 경직된 nested JSON path, 기본 DocumentBuilderFactory와 controller의 direct/raw provider exposure를 정확히 드러내되 실제 key, endpoint, route, category와 domain 값은 복사하지 않습니다. outbound port/provider adapter, URI/secret/SSRF, reusable client와 deadline/cancellation, status/media/error-body 검증, bounded retry/backoff/Retry-After/idempotency, quota/bulkhead/circuit, JSON schema drift/limits, hardened XML/XXE, JSON/XML canonical parity, cache validators/stale policy, provenance/license/observability/fault tests까지 확장합니다. 일곱 JDK 21 exact examples는 timeout budget, HTTP classification, retry, JSON drift, secure XML, canonical mapping과 freshness를 실제 실행합니다.",
  objectives: ["원본 외부 호출의 timeout, null/empty, schema와 XXE 위험을 source evidence로 설명한다.", "provider wire format을 outbound port/adapter와 canonical public DTO에서 격리한다.", "URI/query/key를 안전하게 구성하고 secret propagation과 SSRF를 차단한다.", "connect/request/deadline/cancellation과 reusable client lifecycle을 구현한다.", "status, media type, size와 error body를 parse 전에 검증한다.", "retryable failure, idempotency, backoff/jitter/Retry-After와 quota/bulkhead를 설계한다.", "JSON schema drift와 hardened XML parser를 resource limits와 함께 검증한다.", "canonical units/time, cache freshness, provenance/license와 fault-test rollout을 운영한다."],
  prerequisites: [{ title: "React 연동 CORS와 preflight 진단", reason: "외부 provider 호출은 browser direct CORS 요청과 server-to-server HTTP가 다르므로 origin policy와 server adapter 경계를 먼저 구분해야 합니다.", sessionSlug: "boot-04-cors-client-server" }],
  keywords: ["public data API", "RestClient", "HttpClient", "timeout", "deadline", "retry", "Retry-After", "rate limit", "bulkhead", "JSON Schema", "schema drift", "XML", "XXE", "DocumentBuilderFactory", "canonical model", "ETag", "stale-if-error", "provenance"],
  topics,
  lab: {
    title: "JSON·XML 공공데이터 adapter를 deadline·schema·XXE·cache·provenance까지 production-ready로 만들기",
    scenario: "실제 provider key 없이 synthetic stub server에서 정상/장애/변경 payload를 재현하고 canonical API의 정확성과 복구를 증명합니다.",
    setup: ["JDK 21", "원본과 호환되는 Spring Boot/Gradle fixture", "local stub HTTP server", "synthetic JSON/XML/error/XXE fixtures", "virtual/fixed Clock와 deterministic RNG", "real provider key/endpoint/domain 접근 금지", "원본 두 파일 read-only"],
    steps: ["원본 두 파일 hash와 transport/parser/error/controller evidence를 기록하고 actual values를 수집하지 않습니다.", "WeatherProvider port, provider adapters, canonical query/snapshot과 typed outcomes를 정의합니다.", "fixed HTTPS provider registry와 component-aware query builder, secret-free telemetry를 구현합니다.", "singleton client에 connect timeout을, request마다 timeout과 shared end-to-end deadline/cancellation을 적용합니다.", "2xx/204/3xx/4xx/429/5xx, media type, compressed/decompressed bytes와 bounded error body를 검증합니다.", "idempotency와 status별 retry classification, capped exponential jitter, Retry-After와 remaining budget을 검증합니다.", "provider/tenant quota, concurrency bulkhead, queue timeout, circuit와 single-flight cache를 fault test합니다.", "old/current/additive/breaking JSON fixtures에 required/optional/unknown/type/depth/item limits를 적용합니다.", "XML factory에서 DOCTYPE/entities/external DTD/schema를 fail-closed 차단하고 namespace/cardinality/size를 검증합니다.", "JSON/XML을 같은 canonical units/Instant/quality/provenance로 매핑하고 semantic parity를 검사합니다.", "ETag/304, fresh/no-data/stale-if-error/max-stale와 cache-key collision을 fixed Clock으로 검증합니다.", "schema fingerprint, license/attribution, low-cardinality telemetry와 canary/rollback runbook을 완료합니다."],
    expectedResult: ["모든 network call은 bounded deadline, concurrency와 retry budget 안에서 종료됩니다.", "no-data, timeout, rate limit, non-2xx, schema와 parser failure가 null/empty로 섞이지 않습니다.", "DOCTYPE/external access와 oversized/deep payload가 fail closed로 차단됩니다.", "JSON/XML adapters가 같은 units/time/quality를 가진 canonical snapshot을 만듭니다.", "cache 결과는 age/degraded/provenance를 보존하고 provider key가 logs/artifacts에 없습니다.", "schema drift와 provider outage에서 canary/rollback 또는 bounded stale 정책이 반복 가능합니다."],
    cleanup: ["stub server, disposable clients/threads, temp XML/JSON files와 caches를 제거합니다.", "synthetic credentials와 canary tokens를 폐기하고 logs에서 값이 없음을 확인합니다.", "temporary verbose body/parser/network logging을 원복합니다.", "원본 두 파일 hash/status unchanged를 readback합니다."],
    extensions: ["reactive WebClient에서 cancellation/backpressure/body limits를 비교합니다.", "provider 두 곳의 semantic fallback과 quality scoring을 구현합니다.", "JSON Schema/OpenAPI drift bot과 quarantined sample workflow를 연결합니다.", "메일 전송 같은 side-effect 외부 연동의 idempotency/outbox를 Boot06으로 확장합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Java examples를 실행하고 stub HTTP/XML tests로 같은 결과를 재현하세요.", requirements: ["전체 deadline의 remaining budget을 확인합니다.", "status/media failure를 분리합니다.", "retry attempts와 delays를 고정합니다.", "missing/type/unknown JSON drift를 재현합니다.", "DOCTYPE가 stderr/파일 노출 없이 차단됨을 확인합니다.", "JSON/XML canonical numeric parity를 확인합니다.", "fresh/stale/unavailable age matrix를 확인합니다."], hints: ["실제 provider를 반복 호출하지 말고 synthetic fixtures로 request count와 elapsed time까지 assert하세요."], expectedOutcome: "transport부터 canonical/cache 결과까지 실패를 숨기지 않는 evidence chain을 설명합니다.", solutionOutline: ["budget→classify→retry→schema→secure XML→canonical→cache 순서입니다."] },
    { difficulty: "응용", prompt: "원본 WeatherService/Controller를 provider adapter architecture로 이관하는 patch plan을 작성하세요.", requirements: ["real key rotation/secret injection을 분리합니다.", "controller direct/raw calls를 제거합니다.", "typed outcomes와 public ProblemDetail mapping을 둡니다.", "timeouts/deadline/retry/bulkhead를 구성합니다.", "JSON schema와 XML hardening/limits를 구현합니다.", "canonical units/time/provenance를 둡니다.", "cache/ETag/stale policy를 정의합니다.", "fault tests, canary와 rollback을 포함합니다."], hints: ["null을 empty list로 바꾸는 것만으로는 장애와 no-data가 여전히 섞입니다."], expectedOutcome: "provider 변경과 장애가 public API에 격리되는 migration 설계가 완성됩니다.", solutionOutline: ["audit→rotate→port→client→parse→normalize→cache→operate 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 외부 공공데이터 integration platform 표준을 설계하세요.", requirements: ["provider registry/config/secret/egress policy를 정합니다.", "timeout/deadline/retry/idempotency/quota 기준을 둡니다.", "status/media/body limits와 error taxonomy를 둡니다.", "JSON/XML/schema/XXE parser profiles를 정합니다.", "canonical model/units/time/quality/provenance를 정합니다.", "cache/validator/stale/coalescing 정책을 둡니다.", "license/attribution/privacy/retention을 포함합니다.", "telemetry/fault tests/schema incident/canary/rollback을 포함합니다."], hints: ["HTTP client wrapper가 아니라 provider onboarding부터 폐기까지 lifecycle 표준을 만드세요."], expectedOutcome: "보안·정확성·quota·복구가 감사 가능한 external data governance가 완성됩니다.", solutionOutline: ["onboard→constrain→fetch→validate→normalize→serve→observe→retire 순서입니다."] },
  ],
  nextSessions: ["boot-06-email-service"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["원본의 실제 API key, endpoint URL, provider route/category/domain values는 공개 학습자료와 examples에 복사하지 않았고 구조적 evidence만 사용했습니다.", "원본 WeatherService의 timeout 부재, 사실상 200 전용 성공, null/empty failure, rigid JSON path와 default XML factory 및 Controller direct/raw exposure를 current JDK/Spring/IETF/W3C/OWASP/JSON Schema 자료로 교정했습니다.", "JDK examples는 network 없이 정책/parse를 deterministic하게 설명하므로 실제 provider TLS, redirect, rate headers, schema, license와 SLA는 approved stub/live contract tests에서 별도로 검증해야 합니다.", "provider와 library 동작은 변할 수 있으므로 target Spring/JDK/parser version, provider terms/change notices와 organization egress/privacy policy에 주기적으로 다시 대조해야 합니다."] },
});

export default session;
