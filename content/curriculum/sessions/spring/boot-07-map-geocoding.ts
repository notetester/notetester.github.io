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
      { lines: "1-" + first, explanation: "JDK 21 records와 pure ports로 key placement, geocoding candidates, coordinate, privacy, quota/retry와 accessible fallback을 분리합니다." },
      { lines: (first + 1) + "-" + second, explanation: "정상·ambiguous·invalid·quota·timeout·consent denied·SDK unavailable와 provider-specific error 경로를 실행합니다." },
      { lines: (second + 1) + "-" + count, explanation: "실제 API key·주소·사용자 위치·vendor payload는 출력하지 않고 synthetic coordinate, bounded outcome와 capability만 남깁니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring/Kakao SDK/API/browser/network/credential 불필요"], command: "java " + filename },
    output: { value: output, explanation: ["stdout은 제시된 결과와 완전히 같아야 합니다.", "JDK-only models는 browser permission/SDK/CSP, vendor geocoding precision, network quota와 actual CRS transformation을 대신하지 않습니다."] },
    experiments: [
      { change: "key kind, candidate score, lon/lat order, consent, accuracy, status/timeout과 map availability를 바꿉니다.", prediction: "명시된 boundary는 secret 노출 없이 ambiguous/invalid/retryable/privacy/accessibility 결과를 안정적으로 분류합니다.", result: "placement, choice, coordinate order, retention, retry action와 text fallback을 비교합니다." },
      { change: "동일 계약을 browser SDK→server geocoding port→vendor sandbox/controlled fixtures로 실행합니다.", prediction: "domain/IP restrictions, HTTP timing, quota headers, precision metadata, CSP reports와 screen-reader/keyboard 증거가 추가됩니다.", result: "opaque request id와 route/provider operation만으로 cross-tier evidence를 연결합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "client-server-map-topology",
    title: "브라우저 지도 SDK와 서버 지오코딩 API의 책임·신뢰 경계를 분리합니다",
    lead: "지도 한 화면에서 모든 기능을 브라우저에 넣거나 모든 pan/marker를 서버로 우회하면 key·개인정보·latency와 quota 경계가 흐려집니다.",
    explanations: [
      "브라우저 JavaScript SDK는 map canvas, pan/zoom, visible marker와 사용자 상호작용을 담당하고 domain-restricted JavaScript key를 사용할 수 있습니다. server는 secret REST key가 필요한 주소 검색, normalization, policy, cache와 vendor abstraction을 담당합니다.",
      "위치 permission은 명시적 사용자 action 뒤 browser가 요청하고 필요한 목적·정밀도만 server에 전달합니다. 단순 map display에 current device location을 자동 요청하지 않습니다.",
      "client가 vendor payload를 application domain model로 직접 확산시키지 않고 MapPoint, GeocodeCandidate, Precision과 Attribution 같은 좁은 DTO를 사용합니다. server API와 browser SDK version/coordinate contract를 명시합니다.",
      "원본 KakoController는 주로 JSP view 연결 구조이고 kakao_map04.jsp는 browser SDK key, geolocation, LatLng, marker/infowindow 상호작용을 직접 포함합니다. 서버 REST geocoding/cache/security가 이미 있다고 가정하지 않습니다.",
    ],
    concepts: [
      c("map topology", "browser SDK, application server와 vendor APIs가 어떤 데이터·key·interaction을 소유하는지 나타낸 구조입니다.", ["latency/privacy를 결정합니다.", "두 경로를 분리합니다."]),
      c("browser capability", "화면 렌더링·permission·interaction처럼 browser에서 수행해야 하거나 수행하기 적합한 기능입니다.", ["신뢰 경계는 아닙니다.", "server가 authorization을 유지합니다."]),
      c("server geocoding port", "주소/좌표 query를 vendor-neutral input/output과 timeout/error contract로 노출하는 application-owned interface입니다.", ["secret을 보호합니다.", "vendor 교체를 돕습니다."]),
    ],
    diagnostics: [d("REST secret이 JSP에 보이거나 모든 지도 interaction이 느린 server round trip이 됩니다.", "JavaScript SDK와 server REST key/capability를 구분하지 않았습니다.", ["script key type", "network calls", "server routes", "browser permission", "vendor payload types"], "browser render와 server secret geocoding을 분리하고 shared normalized DTO/coordinate contract를 둡니다.", "bundle/HTML secret scan과 client/server capability architecture tests를 둡니다.")],
    expertNotes: ["브라우저에 보이는 JavaScript key는 비밀번호처럼 숨길 수 없으므로 domain restriction·quota·rotation으로 통제합니다.", "server proxy가 모든 호출을 맡아도 authorization, privacy와 quota abuse를 자동 해결하지 않습니다."],
  },
  {
    id: "api-key-placement-restriction-rotation",
    title: "JavaScript·REST·Admin key의 배치와 domain/IP·API allow-list·rotation을 구분합니다",
    lead: "모든 app key를 같은 secret으로 취급하거나 JavaScript key를 server credential로 사용하면 노출과 권한 범위가 설계와 어긋납니다.",
    explanations: [
      "JavaScript key는 browser SDK용으로 등록된 web domain에서만 동작하도록 제한하고 bundle/HTML에서 보일 수 있음을 전제로 합니다. REST API key와 access/client secret은 server secret store에서만 사용하고 browser로 전달하지 않습니다.",
      "Admin key처럼 강한 key는 server only, 최소 API allow-list와 별도 환경/rotation을 적용합니다. 개발·staging·production key와 domain/IP restrictions를 분리하고 wildcard·localhost 잔존을 배포 gate에서 확인합니다.",
      "key를 query/log/exception/trace에 넣지 않고 authorization header 같은 vendor 요구 위치를 사용합니다. 유출 시 revoke→reissue→deploy→verification 순서와 dependent cache/worker restart runbook을 준비합니다.",
      "third-party script 자체와 JavaScript key는 서로 다른 supply-chain 위험입니다. CSP, vendor domain pinning, version/change monitor와 SRI 가능 여부를 검토하고 SRI가 불가능한 dynamic SDK에는 allow-list·CSP report·fallback을 강화합니다.",
    ],
    concepts: [
      c("platform key", "browser, REST server, native 또는 admin 같은 호출 환경·권한에 맞춰 발급된 app identifier/credential입니다.", ["종류를 바꿔 쓰지 않습니다.", "환경별로 분리합니다."]),
      c("domain restriction", "JavaScript key가 등록된 web origins에서만 승인되도록 vendor가 확인하는 설정입니다.", ["key 은닉이 아닙니다.", "정확한 origins를 관리합니다."]),
      c("key rotation", "새 key를 병행 배포·검증한 뒤 이전 key를 폐기하고 누출 흔적을 점검하는 lifecycle입니다.", ["rollback window가 필요합니다.", "zero-downtime을 설계합니다."]),
    ],
    codeExamples: [java("boot07-key-boundary", "key 종류별 위치·노출·제한 계약", "Boot07KeyBoundary.java", "JavaScript/REST/Admin key를 browser/server 배치와 필수 restriction으로 분류하되 실제 값을 다루지 않습니다.", String.raw`public class Boot07KeyBoundary {
  enum Kind { JAVASCRIPT, REST, ADMIN }
  record Rule(String location, boolean browserVisible, String restriction) {}
  static Rule rule(Kind kind) {
    return switch (kind) {
      case JAVASCRIPT -> new Rule("BROWSER", true, "REGISTERED_ORIGINS");
      case REST -> new Rule("SERVER", false, "ALLOWED_IPS");
      case ADMIN -> new Rule("SERVER", false, "MINIMUM_APIS");
    };
  }
  public static void main(String[] args) {
    for (Kind kind : Kind.values()) System.out.println(kind + "=" + rule(kind));
    System.out.println("actual-key-printed=false");
    System.out.println("environment-separated=true");
  }
}`, "JAVASCRIPT=Rule[location=BROWSER, browserVisible=true, restriction=REGISTERED_ORIGINS]\nREST=Rule[location=SERVER, browserVisible=false, restriction=ALLOWED_IPS]\nADMIN=Rule[location=SERVER, browserVisible=false, restriction=MINIMUM_APIS]\nactual-key-printed=false\nenvironment-separated=true", ["local-map-jsp", "kakao-web-guide", "kakao-web-docs", "kakao-rest-getting-started", "kakao-security", "w3c-csp3", "w3c-sri", "owasp-third-party-js"])],
    diagnostics: [d("REST/Admin key가 page source·bundle·referrer/log에 보이거나 JavaScript key가 모든 origin에서 남용됩니다.", "key type과 runtime boundary, platform restriction/rotation inventory가 없습니다.", ["rendered HTML/bundle", "server config", "vendor key settings", "logs/APM", "quota by key"], "JavaScript key는 exact origins, REST/Admin은 server secret+IP/API restrictions와 환경별 rotation을 적용합니다.", "secret scan, unregistered-origin/IP, old-key revoke와 quota anomaly tests를 둡니다.")],
    expertNotes: ["JavaScript key 노출 자체와 REST/Admin secret 유출의 severity를 구분하되 공개 key도 abuse 가능성을 모니터링합니다.", "CSP/SRI는 vendor account key restriction과 secret rotation을 대신하지 않습니다."],
  },
  {
    id: "geocoding-candidate-precision",
    title: "주소 지오코딩을 문자열→한 점이 아니라 후보·정확도·precision 선택으로 모델링합니다",
    lead: "첫 번째 검색 결과를 자동 저장하면 동명 도로·건물, 유사 검색과 주소 갱신에서 잘못된 위치가 확정됩니다.",
    explanations: [
      "GeocodeQuery는 normalized address, locale/region bias와 exact/similar mode를 포함하고 결과는 candidates, normalized label, point, address type, precision, confidence/quality와 provider metadata를 반환합니다.",
      "0건은 NOT_FOUND, 여러 비슷한 후보는 AMBIGUOUS로 사용자 선택을 요구하고 충분한 exact match만 자동 선택합니다. vendor가 confidence를 제공하지 않으면 임의 숫자를 만들어 신뢰도를 가장하지 않고 rules/precision을 별도 표시합니다.",
      "rooftop, parcel, street, locality와 centroid는 사용 목적에 따라 허용 오차가 다릅니다. 배송·안전 같은 고위험 의사결정은 지도 marker만으로 확정하지 않고 주소 확인/추가 증거를 요구합니다.",
      "forward geocoding과 reverse geocoding 결과는 원래 주소를 완벽히 round-trip하지 않을 수 있습니다. 사용자가 입력한 label, normalized result와 point의 provenance/version을 분리 보존합니다.",
    ],
    concepts: [
      c("geocode candidate", "한 address query와 연관된 normalized label, coordinate와 precision을 가진 가능한 결과입니다.", ["복수일 수 있습니다.", "사용자 선택이 필요할 수 있습니다."]),
      c("precision class", "점이 건물·필지·도로·지역 중심 중 어느 공간 범위를 대표하는지 나타낸 품질 분류입니다.", ["accuracy 숫자와 다릅니다.", "목적 허용 기준을 둡니다."]),
      c("ambiguous result", "상위 후보 차이가 작거나 query 정보가 부족해 하나를 안전하게 자동 선택할 수 없는 결과입니다.", ["첫 row를 선택하지 않습니다.", "추가 입력을 요구합니다."]),
    ],
    codeExamples: [java("boot07-geocode-choice", "없음·모호·명확 후보 분류", "Boot07GeocodeChoice.java", "후보 score 규칙을 synthetic 값으로 실행해 NONE/AMBIGUOUS/CHOSEN을 구분합니다.", String.raw`import java.util.*;

public class Boot07GeocodeChoice {
  enum Choice { NONE, AMBIGUOUS, CHOSEN }
  record Candidate(String id, double score) {}
  static Choice choose(List<Candidate> candidates) {
    if (candidates.isEmpty() || candidates.getFirst().score() < 0.90) return Choice.NONE;
    if (candidates.size() > 1 && candidates.getFirst().score() - candidates.get(1).score() < 0.02) return Choice.AMBIGUOUS;
    return Choice.CHOSEN;
  }
  public static void main(String[] args) {
    System.out.println("none=" + choose(List.of()));
    System.out.println("low=" + choose(List.of(new Candidate("synthetic-a",0.80))));
    System.out.println("ambiguous=" + choose(List.of(new Candidate("synthetic-a",0.96),new Candidate("synthetic-b",0.95))));
    System.out.println("chosen=" + choose(List.of(new Candidate("synthetic-a",0.98),new Candidate("synthetic-b",0.90))));
  }
}`, "none=NONE\nlow=NONE\nambiguous=AMBIGUOUS\nchosen=CHOSEN", ["kakao-local-api", "kakao-rest-reference", "local-map-controller"])],
    diagnostics: [d("잘못된 동명 주소의 첫 결과가 자동 저장되고 사용자가 정밀도를 알 수 없습니다.", "candidate/precision 계약 없이 documents[0]을 성공으로 처리했습니다.", ["query mode", "candidate count/order", "precision/address type", "selection UX", "stored provenance"], "NOT_FOUND/AMBIGUOUS/CHOSEN과 purpose별 precision threshold를 모델링합니다.", "0/1/multi/tie/low-precision/changed-address fixtures와 user confirmation tests를 둡니다.")],
    expertNotes: ["vendor score가 없으면 synthetic confidence를 사실처럼 노출하지 않고 rule-based selection임을 명시합니다.", "지오코딩 결과는 시간이 지나 바뀔 수 있어 provider/version/timestamp와 재검증 정책이 필요합니다."],
  },
  {
    id: "coordinate-order-crs-accuracy",
    title: "longitude·latitude 순서, CRS, 단위·범위·accuracy와 저장 precision을 명시합니다",
    lead: "x/y와 lat/lng를 이름 없이 double 두 개로 넘기면 둘 다 유효 범위인 지역에서 swap 오류가 조용히 다른 위치를 가리킵니다.",
    explanations: [
      "GeoJSON/WGS 84 표현은 coordinate array에서 longitude, latitude 순서를 사용하고 많은 지도 SDK constructor는 latitude, longitude 순서를 사용합니다. boundary마다 named types와 explicit mapping을 둡니다.",
      "longitude는 -180..180, latitude는 -90..90 범위를 검사하고 NaN/Infinity를 거절합니다. vendor가 다른 CRS를 지원하면 source/target CRS와 transformation library/version, axis order를 metadata로 남깁니다.",
      "browser geolocation accuracy는 95% confidence level의 meters로 정의됩니다. coordinate decimal places만으로 센서 정확도를 주장하지 않고 marker circle/text로 uncertainty를 표현합니다.",
      "로그/cache/analytics는 목적에 필요한 grid/geohash/rounded precision만 사용하고 authoritative storage는 정밀도 손실 정책을 명시합니다. 과도한 decimal은 허위 정확성과 재식별 위험을 키웁니다.",
    ],
    concepts: [
      c("coordinate reference system", "숫자 좌표가 지구의 위치로 해석되는 datum, axes, units와 order의 규칙입니다.", ["CRS id를 명시합니다.", "변환은 손실/오차가 있습니다."]),
      c("axis order", "coordinate tuple에서 longitude/x와 latitude/y가 나타나는 순서입니다.", ["API마다 다를 수 있습니다.", "named mapping을 씁니다."]),
      c("accuracy radius", "보고된 coordinate가 실제 위치와 가까울 것으로 기대되는 confidence radius입니다.", ["meters 단위입니다.", "decimal precision과 다릅니다."]),
    ],
    codeExamples: [java("boot07-coordinate-contract", "좌표 범위·순서·표시 precision", "Boot07CoordinateContract.java", "synthetic WGS 84 point를 lon/lat named record로 검증하고 GeoJSON order와 rounded display를 출력합니다.", String.raw`import java.math.*;

public class Boot07CoordinateContract {
  record Wgs84(double longitude, double latitude, double accuracyMeters) {
    boolean valid() {
      return Double.isFinite(longitude) && Double.isFinite(latitude)
        && longitude>=-180 && longitude<=180 && latitude>=-90 && latitude<=90
        && Double.isFinite(accuracyMeters) && accuracyMeters>=0;
    }
  }
  static double round5(double value) {
    return BigDecimal.valueOf(value).setScale(5,RoundingMode.HALF_UP).doubleValue();
  }
  public static void main(String[] args) {
    Wgs84 point = new Wgs84(12.345678,34.567891,25.0);
    System.out.println("valid=" + point.valid());
    System.out.println("geojson=[" + round5(point.longitude()) + ", " + round5(point.latitude()) + "]");
    System.out.println("invalid-range=" + new Wgs84(181,0,10).valid());
    System.out.println("sdk-order=latitude,longitude");
    System.out.println("accuracy-unit=meters");
  }
}`, "valid=true\ngeojson=[12.34568, 34.56789]\ninvalid-range=false\nsdk-order=latitude,longitude\naccuracy-unit=meters", ["local-map-jsp", "kakao-local-api", "w3c-geolocation", "rfc-geojson", "ogc-wkt-crs"])],
    diagnostics: [d("marker가 다른 대륙·바다에 나타나거나 좌표 변환 뒤 수백 미터 어긋납니다.", "x/y와 lat/lng 순서, CRS/axis/unit 또는 precision을 boundary에 기록하지 않았습니다.", ["source/target CRS", "tuple order", "range/finite checks", "transform version", "known control points"], "Wgs84LongitudeLatitude 같은 named type과 explicit adapters, CRS metadata를 사용합니다.", "swap/NaN/Infinity/range, known control points와 round-trip tolerance tests를 둡니다.")],
    expertNotes: ["한국 주변처럼 lon과 lat가 모두 각자의 범위에 들어가면 range check만으로 swap을 찾지 못해 known-region/control-point test가 필요합니다.", "rounded display coordinate를 authoritative routing/geofence input으로 재사용하지 않습니다."],
  },
  {
    id: "consent-purpose-minimization-retention",
    title: "위치 요청을 user action·purpose·정밀도·보존·삭제 선택과 연결합니다",
    lead: "페이지 로드 즉시 current position을 요청하거나 정밀 좌표를 무기한 저장하면 기능 필요보다 넓은 민감정보를 수집합니다.",
    explanations: [
      "현재 위치가 필요한 button/action에서 목적과 사용 범위, 저장 여부를 먼저 설명한 뒤 browser permission을 요청합니다. 지도 보기·주소 검색에는 device geolocation이 필요하지 않을 수 있습니다.",
      "routing처럼 일회성 기능은 memory/session 동안만 사용하고 analytics에는 coarse region 또는 수집하지 않는 선택을 우선합니다. 계정에 장소를 저장하려면 별도 명시적 action, retention과 조회·수정·삭제 UI를 제공합니다.",
      "permission denied, unavailable, timeout과 stale cached position을 정상 product states로 처리하고 주소 입력·텍스트 검색 fallback을 제공합니다. permission을 반복 prompt하거나 거부를 오류로 비난하지 않습니다.",
      "server 전송·third-party geocoder 공유·log/cache/backup의 data flow를 disclosure에 포함합니다. raw address/coordinate를 URL, referrer, metrics tags와 error payload에 넣지 않습니다.",
    ],
    concepts: [
      c("purpose limitation", "위치 데이터를 설명한 특정 기능에만 사용하고 다른 목적에 재사용하지 않는 원칙입니다.", ["consent copy와 연결합니다.", "secondary use를 제한합니다."]),
      c("data minimization", "필요한 정밀도·필드·시간과 대상만 수집·처리하는 원칙입니다.", ["coarse/ephemeral을 우선합니다.", "logs/cache도 포함합니다."]),
      c("permission fallback", "사용자가 위치 권한을 거부하거나 기능이 unavailable일 때 주소/텍스트 등 동등 목적의 대안을 제공하는 경로입니다.", ["map SDK 장애에도 씁니다.", "강제 prompt를 피합니다."]),
    ],
    codeExamples: [java("boot07-privacy-decision", "사용자 action·consent·목적별 위치 사용", "Boot07PrivacyDecision.java", "명시적 action/consent가 없으면 거절하고 route는 ephemeral precise, nearby는 coarse 결과를 반환합니다.", String.raw`public class Boot07PrivacyDecision {
  enum Purpose { ROUTE, NEARBY }
  enum Decision { DENIED, EPHEMERAL_PRECISE, EPHEMERAL_COARSE }
  record Request(boolean userAction, boolean consent, Purpose purpose) {}
  static Decision decide(Request request) {
    if (!request.userAction() || !request.consent()) return Decision.DENIED;
    return request.purpose()==Purpose.ROUTE ? Decision.EPHEMERAL_PRECISE : Decision.EPHEMERAL_COARSE;
  }
  public static void main(String[] args) {
    System.out.println("page-load=" + decide(new Request(false,false,Purpose.NEARBY)));
    System.out.println("denied=" + decide(new Request(true,false,Purpose.ROUTE)));
    System.out.println("route=" + decide(new Request(true,true,Purpose.ROUTE)));
    System.out.println("nearby=" + decide(new Request(true,true,Purpose.NEARBY)));
    System.out.println("stored-by-default=false");
  }
}`, "page-load=DENIED\ndenied=DENIED\nroute=EPHEMERAL_PRECISE\nnearby=EPHEMERAL_COARSE\nstored-by-default=false", ["w3c-geolocation", "w3c-permissions", "w3c-permissions-policy"])],
    diagnostics: [d("페이지 진입만으로 permission prompt가 뜨고 raw 좌표가 analytics/log에 남습니다.", "user action/purpose/retention gate 없이 geolocation과 telemetry를 자동 실행했습니다.", ["prompt trigger", "permission state", "server/vendor flow", "logs/cache/backups", "delete controls"], "명시 action과 purpose별 precision/ephemeral default, fallback과 deletion을 적용합니다.", "load-no-prompt, denied/unavailable/timeout, retention expiry와 location canary tests를 둡니다.")],
    expertNotes: ["browser permission 허용은 애플리케이션의 모든 저장·재사용·제3자 공유에 대한 포괄 동의가 아닙니다.", "법률 판단을 코드 주석으로 대신하지 않고 제품·법무 정책과 현재 관할 요구를 별도 확인합니다."],
  },
  {
    id: "quota-cache-coalescing-degradation",
    title: "vendor quota를 cache·request coalescing·negative TTL과 graceful degradation으로 보호합니다",
    lead: "키 입력마다 geocode를 호출하거나 동일 주소를 동시 요청하면 quota와 비용을 소모하고 장애가 사용자 전체로 증폭됩니다.",
    explanations: [
      "검색은 debounce와 최소 입력, submit intent를 적용하고 server는 normalized query+locale/mode+vendor/version의 privacy-safe key로 cache합니다. exact address 원문을 cache metric/key log에 노출하지 않습니다.",
      "동일 key의 in-flight request를 coalesce해 한 vendor call을 공유하고 per-user/tenant/global quota와 concurrency bulkhead를 둡니다. vendor daily/minute quota와 remaining/reset headers가 있으면 bounded metadata로 반영합니다.",
      "positive result와 NOT_FOUND의 TTL을 다르게 하고 ambiguous/error를 장기 cache하지 않습니다. 주소 데이터 갱신, vendor version과 privacy deletion이 cache invalidation에 반영돼야 합니다.",
      "quota 초과 시 stale-if-allowed cache, 텍스트 주소·외부 지도 link·manual entry 같은 fallback을 제공합니다. 다른 vendor로 자동 전환할 때 license, coordinate/precision와 결과 consistency가 달라짐을 명시합니다.",
    ],
    concepts: [
      c("request coalescing", "동일한 in-flight external query를 여러 caller가 공유해 한 번만 호출하는 기법입니다.", ["quota를 줄입니다.", "cancellation/failure fan-out을 설계합니다."]),
      c("negative cache", "NOT_FOUND 같은 부정 결과를 짧은 기간 저장해 반복 호출을 줄이는 cache입니다.", ["오래된 부정 결과를 주의합니다.", "error와 구분합니다."]),
      c("graceful degradation", "지도/vendor가 불가해도 핵심 목적을 텍스트·수동 입력·stale data로 제한적으로 계속 제공하는 설계입니다.", ["정확도 상태를 표시합니다.", "silent fallback을 피합니다."]),
    ],
    diagnostics: [d("사용자 한 명의 입력으로 quota가 소진되거나 장애 때 모든 thread가 vendor에 몰립니다.", "debounce/coalescing/cache와 per-scope quota·bulkhead가 없습니다.", ["call per action", "in-flight duplicates", "cache hit/TTL", "vendor quota", "thread/pool saturation"], "normalized safe cache key, single-flight와 user/global budgets 및 degradation을 적용합니다.", "burst/same-query, quota exhaustion, cache stampede와 stale fallback load tests를 둡니다.")],
    expertNotes: ["주소 cache는 개인정보가 될 수 있어 암호화, partition, TTL와 deletion을 성능보다 먼저 정의합니다.", "provider terms가 caching/derived data 저장을 제한할 수 있으므로 현재 공식 정책을 확인합니다."],
  },
  {
    id: "timeout-retry-circuit-idempotency",
    title: "connect/read/deadline·cancellation과 status-aware retry를 idempotent query에 한정합니다",
    lead: "외부 지도 API 기본 무한 timeout과 무조건 세 번 retry는 thread를 고갈시키고 429·quota 장애를 증폭합니다.",
    explanations: [
      "HTTP client에 connect timeout, response/read timeout과 end-to-end deadline을 두고 cancellation이 connection/pool을 해제하는지 검증합니다. DNS/TLS/connect/read/parse 단계와 user abort를 구분합니다.",
      "GET geocoding은 일반적으로 retry 가능한 의도지만 invalid 4xx와 auth/key failure는 즉시 terminal로 처리합니다. timeout/selected 5xx/429는 Retry-After, remaining deadline과 max attempts 안에서 exponential backoff+jitter를 적용합니다.",
      "circuit breaker는 연속 dependency failure에서 빠르게 fallback하고 half-open probe를 제한합니다. 모든 user 입력 오류를 dependency failure로 세어 circuit을 열지 않습니다.",
      "client browser와 server가 동시에 retry하면 곱셈 amplification이 생깁니다. 한 계층이 정책을 소유하고 request id/deadline을 전달하며 queue/cache와 quota telemetry를 함께 봅니다.",
    ],
    concepts: [
      c("end-to-end deadline", "DNS/connect/read/retry를 포함한 전체 external operation이 완료돼야 하는 절대 시간 예산입니다.", ["remaining time을 전달합니다.", "단계 timeout보다 상위입니다."]),
      c("retryable classification", "HTTP/status/exception과 operation semantics를 기준으로 재시도 가능 여부를 정한 stable 결과입니다.", ["4xx를 뭉뚱그리지 않습니다.", "idempotency를 포함합니다."]),
      c("circuit breaker", "dependency failure가 임계치를 넘으면 일시적으로 호출을 차단하고 제한된 probe로 복구를 확인하는 상태기입니다.", ["fallback과 연결합니다.", "metric 분류가 중요합니다."]),
    ],
    codeExamples: [java("boot07-retry-policy", "HTTP·timeout별 cache/retry/terminal 분류", "Boot07RetryPolicy.java", "cache hit, 200, invalid 400, quota 429, 503과 timeout을 stable action으로 분류합니다.", String.raw`public class Boot07RetryPolicy {
  enum Action { USE_CACHE, RETURN, TERMINAL, RETRY_AFTER, RETRY_BOUNDED }
  record Input(boolean cacheHit, boolean timeout, int status) {}
  static Action decide(Input in) {
    if (in.cacheHit()) return Action.USE_CACHE;
    if (in.timeout()) return Action.RETRY_BOUNDED;
    if (in.status()==200) return Action.RETURN;
    if (in.status()==429) return Action.RETRY_AFTER;
    if (in.status()>=500) return Action.RETRY_BOUNDED;
    return Action.TERMINAL;
  }
  public static void main(String[] args) {
    System.out.println("cache=" + decide(new Input(true,false,0)));
    System.out.println("ok=" + decide(new Input(false,false,200)));
    System.out.println("invalid=" + decide(new Input(false,false,400)));
    System.out.println("quota=" + decide(new Input(false,false,429)));
    System.out.println("server=" + decide(new Input(false,false,503)));
    System.out.println("timeout=" + decide(new Input(false,true,0)));
  }
}`, "cache=USE_CACHE\nok=RETURN\ninvalid=TERMINAL\nquota=RETRY_AFTER\nserver=RETRY_BOUNDED\ntimeout=RETRY_BOUNDED", ["kakao-quota", "spring-rest-clients", "jdk-http-client", "rfc-http-semantics", "rfc-http-cache"])],
    diagnostics: [d("vendor 장애에서 request 수가 retry 배수로 늘고 web threads가 timeout 없이 막힙니다.", "end-to-end deadline, status classification과 single retry owner가 없습니다.", ["HTTP timeouts", "attempt timeline", "429/Retry-After", "browser+server retries", "pool/circuit"], "유한 deadline과 idempotent status-aware jitter retry, breaker/bulkhead를 server 정책으로 통합합니다.", "slow connect/read, 400/401/429/5xx, deadline exhaustion과 retry amplification tests를 둡니다.")],
    expertNotes: ["Retry-After가 있어도 사용자 deadline·quota와 max age를 넘겨 무한 대기하지 않습니다.", "circuit state를 user/tenant별 query errors가 오염하지 않게 dependency failures만 계산합니다."],
  },
  {
    id: "third-party-script-csp-sri",
    title: "지도 SDK를 third-party executable dependency로 관리하고 CSP·SRI 가능/불가능 경계를 명시합니다",
    lead: "외부 script 하나는 page origin 권한으로 DOM, storage와 network에 접근하므로 단순 CDN asset보다 큰 공급망 경계입니다.",
    explanations: [
      "정확한 HTTPS vendor origins와 필요한 script/connect/img/style/font sources를 CSP allow-list에 둡니다. unsafe-inline·wildcard를 추가하기 전에 nonce/hash와 SDK 실제 subresource graph를 report-only에서 관찰합니다.",
      "고정 bytes/version과 CORS가 지원되면 SRI hash를 사용할 수 있지만 dynamic SDK URL/response가 매번 달라지거나 CORS를 지원하지 않으면 SRI가 작동하지 않을 수 있습니다. integrity 속성을 장식처럼 넣지 않고 실제 browser에서 검증합니다.",
      "SDK version/changelog, vendor domain/DNS와 CSP violation/loader error를 모니터링하고 unavailable 시 text/list/static fallback을 제공합니다. 장애 복구를 위해 더 넓은 arbitrary script domain을 즉시 허용하지 않습니다.",
      "JavaScript key, CSP nonce와 API result를 template 문자열로 섞지 않고 safe configuration channel을 사용합니다. source map, error reporter와 page HTML에도 REST/Admin key나 precise location이 포함되지 않게 합니다.",
    ],
    concepts: [
      c("third-party executable", "외부 origin에서 받아 page 권한으로 실행되는 JavaScript dependency입니다.", ["supply-chain 위험이 큽니다.", "inventory/change monitor가 필요합니다."]),
      c("Content Security Policy", "문서가 실행·연결·표시할 resource origins와 inline code 조건을 response policy로 제한하는 방어입니다.", ["report-only로 관찰합니다.", "XSS의 추가 계층입니다."]),
      c("Subresource Integrity", "외부 resource bytes가 지정한 cryptographic hash와 일치할 때만 실행하도록 하는 browser 검증입니다.", ["CORS가 필요합니다.", "dynamic response에는 어려울 수 있습니다."]),
    ],
    diagnostics: [d("CSP를 적용하자 지도가 깨져 wildcard/unsafe-inline을 열었거나 integrity가 있어도 script가 검증되지 않습니다.", "SDK subresource graph와 SRI CORS/bytes 안정성을 조사하지 않았습니다.", ["CSP reports", "script response/cache/version", "integrity+CORS", "network subresources", "fallback"], "report-only로 최소 origins/nonce를 도출하고 SRI 지원 여부를 실제 검증하며 text fallback을 유지합니다.", "vendor compromise/change simulation, CSP/SRI failure와 no-SDK browser tests를 둡니다.")],
    expertNotes: ["CSP host allow-list는 허용 host 자체가 compromised됐을 때 완전한 보호가 아니므로 dependency 변경·fallback도 필요합니다.", "third-party terms와 script behavior가 바뀔 수 있어 현재 문서/응답을 정기 재검증합니다."],
  },
  {
    id: "accessible-map-text-fallback",
    title: "시각 지도와 동등한 텍스트 결과·키보드 controls·상태 메시지·무스크립트 대안을 제공합니다",
    lead: "canvas marker와 mouse click만으로 장소를 제공하면 screen reader, keyboard 사용자와 SDK/JS 장애 사용자는 정보를 얻지 못합니다.",
    explanations: [
      "map은 보조 visualization으로 두고 결과 목록에 장소명, normalized 주소, 거리/precision과 action links를 semantic HTML로 제공합니다. marker selection과 list focus/selection을 양방향 동기화합니다.",
      "zoom/pan/marker controls는 keyboard와 visible focus, 충분한 target size와 accessible name을 제공합니다. map 내부 keyboard trap을 피하고 건너뛰기/나가기 안내를 둡니다.",
      "loading, 결과 수, permission denied와 vendor failure는 aria-live/status semantics로 알리되 모든 pan마다 과도하게 읽지 않습니다. color/shape만으로 precision·selected state를 전달하지 않습니다.",
      "noscript 또는 SDK unavailable에서도 주소 form, text results와 외부 지도/길찾기 링크 같은 핵심 fallback을 제공합니다. fallback link에는 precise location/secret을 불필요하게 query에 넣지 않습니다.",
    ],
    concepts: [
      c("text equivalent", "시각 map의 핵심 장소·관계·action을 semantic text/list로 제공하는 대안입니다.", ["정보 목적이 같아야 합니다.", "fallback으로도 작동합니다."]),
      c("keyboard map control", "mouse drag/click 없이 focus, arrow/button과 standard keyboard로 map 기능을 수행하는 interface입니다.", ["trap을 피합니다.", "명확한 안내가 필요합니다."]),
      c("status message", "focus를 강제로 옮기지 않고 loading/result/error 변화를 assistive technology가 인식하게 하는 메시지입니다.", ["과도한 announcement를 피합니다.", "role/live를 사용합니다."]),
    ],
    codeExamples: [java("boot07-accessible-fallback", "지도와 동등한 text/keyboard fallback", "Boot07AccessibleFallback.java", "SDK 사용 가능/불가 모두 같은 장소 목록과 keyboard capability를 유지하는 view model을 실행합니다.", String.raw`import java.util.*;

public class Boot07AccessibleFallback {
  record Place(String label, String precision) {}
  record View(boolean mapAvailable, boolean keyboard, List<String> textResults, String status) {}
  static View render(boolean sdk, List<Place> places) {
    List<String> text = places.stream().map(p -> p.label() + " (" + p.precision() + ")").toList();
    String status = sdk ? "MAP_AND_TEXT_READY" : "TEXT_FALLBACK_READY";
    return new View(sdk, true, text, status);
  }
  public static void main(String[] args) {
    List<Place> places = List.of(new Place("Result A","BUILDING"),new Place("Result B","STREET"));
    View normal = render(true, places);
    View fallback = render(false, places);
    System.out.println("normal-status=" + normal.status());
    System.out.println("fallback-status=" + fallback.status());
    System.out.println("same-results=" + normal.textResults().equals(fallback.textResults()));
    System.out.println("keyboard=" + fallback.keyboard());
    System.out.println("results=" + fallback.textResults());
  }
}`, "normal-status=MAP_AND_TEXT_READY\nfallback-status=TEXT_FALLBACK_READY\nsame-results=true\nkeyboard=true\nresults=[Result A (BUILDING), Result B (STREET)]", ["local-map-jsp", "w3c-wcag22", "w3c-status-messages"])],
    diagnostics: [d("지도 SDK가 없거나 keyboard/screen reader 사용 시 장소를 선택할 수 없습니다.", "canvas/marker mouse event만 있고 semantic list, focus/status와 fallback이 없습니다.", ["DOM roles/names", "keyboard paths", "focus trap", "status announcements", "no-JS/SDK failure"], "동등한 text result list와 keyboard controls, live status와 noscript/manual fallback을 제공합니다.", "screen-reader/keyboard/zoom/reduced-motion/no-SDK task completion tests를 둡니다.")],
    expertNotes: ["시각 지도에 aria-label 하나만 붙이는 것으로 공간 정보와 actions의 text equivalent가 되지 않습니다.", "외부 지도 link는 새로운 privacy/domain 이동을 명확히 알리고 안전하게 구성합니다."],
  },
  {
    id: "vendor-neutral-port-error-model",
    title: "vendor adapter를 application port 뒤에 두고 좌표·precision·오류를 normalized model로 변환합니다",
    lead: "Controller, JSP와 DB가 Kakao response field/error code를 직접 알면 provider 변경·장애와 계약 테스트가 모든 계층에 전파됩니다.",
    explanations: [
      "Geocoder port는 GeocodeQuery→Found/Ambiguous/NotFound/Invalid/RateLimited/Unavailable처럼 application-owned result를 반환합니다. adapter만 vendor authorization, request parameters, response schema와 error codes를 압니다.",
      "Found에는 named WGS84 point, precision/address type와 display label을 최소화해 담고 raw vendor document를 domain entity나 cache에 저장하지 않습니다. attribution/license metadata가 필요하면 명시 field로 보존합니다.",
      "두 vendor fallback은 결과 의미·coordinate CRS·precision과 quota가 같지 않으므로 silent substitution하지 않습니다. adapter conformance fixtures와 application acceptance threshold가 일치하는지 검증합니다.",
      "Controller는 public 400/404/429/503과 stable problem code를 선택하고 secret/vendor response를 노출하지 않습니다. 브라우저는 retry/fallback UI를 application code로 처리합니다.",
    ],
    concepts: [
      c("geocoder port", "application이 필요한 주소→후보 capability를 vendor-neutral query/result로 정의한 outbound interface입니다.", ["adapter가 구현합니다.", "controller가 vendor를 모릅니다."]),
      c("normalized error", "provider별 status/code를 Invalid, RateLimited, Unavailable 같은 안정된 application category로 변환한 결과입니다.", ["retry policy의 입력입니다.", "raw body를 숨깁니다."]),
      c("adapter conformance", "모든 vendor adapter가 coordinate order, precision, ambiguity와 error semantics를 같은 test suite로 충족하는 성질입니다.", ["fixture를 공유합니다.", "차이를 문서화합니다."]),
    ],
    codeExamples: [java("boot07-vendor-port", "provider 결과를 application outcome으로 변환", "Boot07VendorPort.java", "provider 200 candidate, 429와 invalid query를 vendor-neutral Found/Retryable/Invalid 결과로 변환합니다.", String.raw`public class Boot07VendorPort {
  sealed interface Result permits Found, Retryable, Invalid {}
  record Found(double longitude, double latitude, String precision) implements Result {}
  record Retryable(String category) implements Result {}
  record Invalid(String code) implements Result {}
  static Result normalize(int status, boolean candidate) {
    if (status==200 && candidate) return new Found(12.5,34.5,"BUILDING");
    if (status==429 || status>=500) return new Retryable("DEPENDENCY");
    return new Invalid("INVALID_QUERY");
  }
  public static void main(String[] args) {
    System.out.println("found=" + normalize(200,true));
    System.out.println("quota=" + normalize(429,false));
    System.out.println("invalid=" + normalize(400,false));
    System.out.println("raw-provider-body=false");
  }
}`, "found=Found[longitude=12.5, latitude=34.5, precision=BUILDING]\nquota=Retryable[category=DEPENDENCY]\ninvalid=Invalid[code=INVALID_QUERY]\nraw-provider-body=false", ["kakao-local-api", "kakao-rest-reference", "spring-rest-clients"])],
    diagnostics: [d("provider field/code 변경이 Controller/JSP/DB를 동시에 깨뜨립니다.", "raw vendor DTO와 exception을 application/public contract로 사용했습니다.", ["imports/types by layer", "stored/cache payload", "error mapping", "fallback adapter tests"], "application-owned geocoder port/result와 vendor adapter mapping을 둡니다.", "recorded synthetic contract fixtures와 multi-adapter conformance tests를 둡니다.")],
    expertNotes: ["vendor-neutral model은 공통 분모만 남기기보다 application이 실제 필요로 하는 precision/attribution을 소유해야 합니다.", "recorded payload에는 실제 주소·좌표·key를 넣지 않고 synthetic fixtures와 schema만 사용합니다."],
  },
  {
    id: "map-observability-testing-operations",
    title: "위치 원문 없는 관측·quota SLO와 browser/server/vendor failure matrix를 운영합니다",
    lead: "정확한 주소·좌표·API key를 로그에 남기면 장애 추적은 쉬워 보여도 민감정보와 secret가 장기간 복제됩니다.",
    explanations: [
      "browser는 map load/permission/result/fallback과 request generation을, server는 route/operation/cache hit/retry/result category를, adapter는 provider operation/status/duration/quota bucket을 동일 opaque request id로 연결합니다.",
      "raw address, precise lon/lat, user id, key와 full vendor URL/body를 log/metric/trace에 넣지 않습니다. query shape, candidate count bucket, precision class, coarse region if justified, status와 latency만 allow-list합니다.",
      "SLO는 map SDK load, geocode success/ambiguous/not-found, cache hit, quota remaining class, dependency latency/error, permission-denied fallback task completion과 accessible text availability를 분리합니다.",
      "test matrix는 key restriction/rotation, CSP/SRI/script failure, permission states, coordinate/CRS/swap, ambiguity, quota/cache stampede, timeout/retry, provider schema/error, screen reader/keyboard/no-JS와 location canary를 포함합니다.",
    ],
    concepts: [
      c("location-safe telemetry", "주소·정밀 좌표·key 없이 map/geocode operation의 bounded 상태와 성능을 기록하는 schema입니다.", ["allow-list를 씁니다.", "canary로 검증합니다."]),
      c("quota SLO", "사용량·remaining/reset, cache/coalescing과 429 비율을 서비스 예산으로 관리하는 운영 목표입니다.", ["key별 abuse를 봅니다.", "값을 bounded bucket으로 만듭니다."]),
      c("cross-boundary matrix", "browser permission/SDK, server port, vendor HTTP, cache와 accessible fallback 단계별 정상·실패·복구를 연결한 테스트 표입니다.", ["실제 origin을 포함합니다.", "secret 없이 실행합니다."]),
    ],
    diagnostics: [d("장애 조사 자료에 precise location/key가 남거나 browser와 provider failure를 연결할 수 없습니다.", "full URL/payload logging과 correlation 없는 계층별 문구에 의존했습니다.", ["browser analytics", "server HTTP logs", "client wire logs", "APM/cache keys", "exports/backups"], "opaque correlation과 bounded operation/status/precision/cache/quota schema만 허용합니다.", "synthetic location/key canary 0건과 모든 failure case의 cross-tier event continuity를 검사합니다.")],
    expertNotes: ["coarse location도 희소 집단/시간과 결합하면 민감할 수 있어 목적·보존을 검토합니다.", "SDK/vendor 실제 UI는 자동 unit test만으로 부족해 controlled browser accessibility/security smoke를 별도로 운영합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-map-controller", repository: "local learning archive", path: "springmvc/myproject01/src/main/java/org/study/myproject01/kakao/controller/KakoController.java", usedFor: ["legacy Kakao view routing and model structure provenance"], evidence: "Read-only structural audit: 43 lines, 1,278 bytes, SHA-256 1E7CCFE91630308001020028CC54E72D8576B36038CB6B91A2809E967504EDFC." },
  { id: "local-map-jsp", repository: "local learning archive", path: "springmvc/myproject01/src/main/webapp/WEB-INF/views/kakao/kakao_map04.jsp", usedFor: ["legacy browser SDK key, geolocation, LatLng, marker and infowindow provenance"], evidence: "Read-only structural audit: 77 lines, 3,211 bytes, SHA-256 6B5FECF995D314A7FC7FEE7F16C26EB7DBB68EB07A3EEBF42DB43C4F019FD4D6." },
  { id: "kakao-web-guide", repository: "Kakao Maps", path: "Web API Guide", publicUrl: "https://apis.map.kakao.com/web/guide/", usedFor: ["JavaScript key, registered domain and map SDK setup"], evidence: "Kakao Maps 공식 Web API guide입니다." },
  { id: "kakao-web-docs", repository: "Kakao Maps", path: "Web API Documentation", publicUrl: "https://apis.map.kakao.com/web/documentation/", usedFor: ["map, LatLng, marker and services API semantics"], evidence: "Kakao Maps 공식 Web API documentation입니다." },
  { id: "kakao-local-api", repository: "Kakao Developers", path: "Local REST API", publicUrl: "https://developers.kakao.com/docs/en/local/dev-guide", usedFor: ["address geocoding, coordinates, result metadata and REST key"], evidence: "Kakao Developers 공식 Local API 문서입니다." },
  { id: "kakao-rest-reference", repository: "Kakao Developers", path: "REST API Reference", publicUrl: "https://developers.kakao.com/docs/en/rest-api/reference", usedFor: ["local API operations and error boundary"], evidence: "Kakao Developers 공식 REST API reference입니다." },
  { id: "kakao-rest-getting-started", repository: "Kakao Developers", path: "REST API Getting Started", publicUrl: "https://developers.kakao.com/docs/en/rest-api/getting-started", usedFor: ["server REST key and allowed IP boundary"], evidence: "Kakao Developers 공식 REST API 시작 문서입니다." },
  { id: "kakao-security", repository: "Kakao Developers", path: "Security Guidelines", publicUrl: "https://developers.kakao.com/docs/en/getting-started/security-guideline", usedFor: ["platform key placement, restriction and rotation"], evidence: "Kakao Developers 공식 security guide입니다." },
  { id: "kakao-quota", repository: "Kakao Developers", path: "Quota", publicUrl: "https://developers.kakao.com/docs/en/getting-started/quota", usedFor: ["Local API quota and degradation planning"], evidence: "Kakao Developers 공식 quota 문서입니다." },
  { id: "spring-rest-clients", repository: "Spring Framework Reference", path: "REST Clients", publicUrl: "https://docs.spring.io/spring-framework/reference/integration/rest-clients.html", usedFor: ["server HTTP client and response/error mapping"], evidence: "Spring Framework 공식 REST clients 문서입니다." },
  { id: "jdk-http-client", repository: "Java SE 21 API", path: "HttpClient", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.html", usedFor: ["connect timeout and asynchronous HTTP lifecycle"], evidence: "Oracle Java SE 21 공식 HTTP Client API입니다." },
  { id: "w3c-geolocation", repository: "W3C", path: "Geolocation", publicUrl: "https://www.w3.org/TR/geolocation/", usedFor: ["permission, accuracy, timeout and location privacy"], evidence: "W3C 공식 Geolocation specification입니다." },
  { id: "w3c-permissions", repository: "W3C", path: "Permissions", publicUrl: "https://www.w3.org/TR/permissions/", usedFor: ["browser permission state and user choice"], evidence: "W3C 공식 Permissions specification입니다." },
  { id: "w3c-permissions-policy", repository: "W3C", path: "Permissions Policy", publicUrl: "https://www.w3.org/TR/permissions-policy/", usedFor: ["geolocation delegation to embedded contexts"], evidence: "W3C 공식 Permissions Policy specification입니다." },
  { id: "rfc-geojson", repository: "IETF RFC Editor", path: "RFC 7946 GeoJSON", publicUrl: "https://www.rfc-editor.org/rfc/rfc7946.html#section-4", usedFor: ["WGS 84 and longitude/latitude coordinate order"], evidence: "IETF Standards Track GeoJSON 문서입니다." },
  { id: "ogc-wkt-crs", repository: "Open Geospatial Consortium", path: "WKT Coordinate Reference Systems", publicUrl: "https://www.ogc.org/standards/wkt-crs/", usedFor: ["CRS and coordinate operation representation"], evidence: "OGC 공식 CRS standard overview입니다." },
  { id: "rfc-http-semantics", repository: "IETF RFC Editor", path: "RFC 9110 HTTP Semantics", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["GET, status and Retry-After semantics"], evidence: "IETF Standards Track HTTP semantics입니다." },
  { id: "rfc-http-cache", repository: "IETF RFC Editor", path: "RFC 9111 HTTP Caching", publicUrl: "https://www.rfc-editor.org/rfc/rfc9111.html", usedFor: ["cache freshness, authorization and shared-cache boundaries"], evidence: "IETF Standards Track HTTP caching 문서입니다." },
  { id: "w3c-csp3", repository: "W3C", path: "Content Security Policy Level 3", publicUrl: "https://www.w3.org/TR/CSP3/", usedFor: ["third-party script and connection source policy"], evidence: "W3C 공식 CSP Level 3 specification입니다." },
  { id: "w3c-sri", repository: "W3C", path: "Subresource Integrity", publicUrl: "https://www.w3.org/TR/SRI/", usedFor: ["third-party script byte integrity and CORS boundary"], evidence: "W3C 공식 Subresource Integrity specification입니다." },
  { id: "owasp-third-party-js", repository: "OWASP Cheat Sheet Series", path: "Third Party JavaScript Management", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html", usedFor: ["third-party SDK inventory and supply-chain controls"], evidence: "OWASP 공식 third-party JavaScript guidance입니다." },
  { id: "w3c-wcag22", repository: "W3C", path: "WCAG 2.2", publicUrl: "https://www.w3.org/TR/WCAG22/", usedFor: ["non-text alternatives and keyboard accessibility"], evidence: "W3C Recommendation WCAG 2.2입니다." },
  { id: "w3c-status-messages", repository: "W3C WAI", path: "Understanding Status Messages", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages", usedFor: ["accessible dynamic map/result status"], evidence: "W3C WAI 공식 WCAG guidance입니다." },
];

const session = createExpertSession({
  inventoryId: "boot-07-map-geocoding", slug: "boot-07-map-geocoding", courseId: "spring", moduleId: "spring-boot-rest-integration", order: 7,
  title: "지도·주소 API를 서버와 화면에 연결하기", subtitle: "browser/server key 경계에서 좌표·지오코딩 품질, 위치 개인정보, quota/retry, CSP/SRI와 접근 가능한 fallback까지 연결합니다.", level: "고급", estimatedMinutes: 95,
  coreQuestion: "지도와 주소 기능을 제공하면서 key·정밀 위치를 노출하지 않고, 좌표·후보 정확성·quota·third-party script 장애와 접근성까지 어떻게 검증할까요?",
  summary: "로컬 KakoController.java와 kakao_map04.jsp를 read-only로 감사해 view routing, browser JavaScript key, geolocation, LatLng, marker/infowindow 구조를 provenance로 사용합니다. 실제 key·URL parameter·주소·사용자 좌표는 복제하지 않고 server REST geocoding/cache/security가 원본에 있다고 가정하지 않습니다. browser SDK/server geocoder topology, JavaScript/REST/Admin key·domain/IP/API restriction과 rotation, candidate/precision ambiguity, WGS84 lon/lat·SDK axis·CRS/accuracy, user-action consent·minimization·retention, quota/cache/single-flight/degradation, finite deadline/status-aware retry/breaker, third-party SDK CSP/SRI 가능 경계, text/keyboard/status/no-SDK accessibility, vendor-neutral port/error conformance와 location-zero telemetry/failure matrix로 깊게 교정합니다. 일곱 JDK 21 예제는 key 없이 placement, candidate choice, coordinate, privacy, retry, accessible fallback과 vendor normalization을 exact output으로 증명합니다.",
  objectives: ["browser map SDK와 server geocoding port의 책임·trust boundary를 분리한다.", "JavaScript·REST·Admin key를 적절한 runtime과 restriction/rotation에 배치한다.", "geocode 후보·ambiguity·precision과 forward/reverse 의미를 모델링한다.", "longitude/latitude, CRS, axis, accuracy와 storage precision을 검증한다.", "위치 consent·purpose·minimization·retention·fallback을 설계한다.", "quota, cache/coalescing, timeout/retry/breaker와 degradation을 운영한다.", "third-party script CSP/SRI와 공급망 경계를 검증한다.", "접근성, vendor abstraction, zero-location 관측과 cross-boundary tests를 완성한다."],
  prerequisites: [{ title: "메일 전송 API, 비동기화와 실패 복구", reason: "외부 provider의 secret, durable retry, failure classification과 zero-leak observability를 이해해야 지도 SDK/지오코딩의 key·quota·timeout·fallback 경계를 설계할 수 있습니다.", sessionSlug: "boot-06-email-service" }],
  keywords: ["geocoding", "map SDK", "API key boundary", "coordinate", "longitude", "latitude", "CRS", "privacy", "quota", "cache", "CSP", "SRI", "accessibility", "vendor adapter"], topics,
  lab: {
    title: "Kakao 지도 JSP를 privacy-safe browser SDK+server geocoder로 재구성하기",
    scenario: "기존 JSP는 browser key와 geolocation·marker를 직접 다루지만 server REST key boundary, geocode ambiguity/CRS, consent/retention, quota/retry, script integrity와 accessible fallback이 통합 계약으로 검증되지 않습니다.",
    setup: ["Controller/JSP 원본은 read-only hash provenance로 고정하고 실제 key/address/user coordinate/domain 값을 복제하지 않습니다.", "MapPoint, GeocodeQuery/Candidate/Precision, vendor-neutral Result와 key inventory를 정의합니다.", "synthetic geocode fixtures, quota/cache/timeout provider와 browser permission/SDK test origins를 준비합니다.", "CSP report-only, screen-reader/keyboard/no-JS harness와 location/key canary collectors를 준비합니다."],
    steps: ["browser SDK와 server REST geocode/data flow 및 trust boundary를 그립니다.", "key type별 runtime, exact domain/IP/API restrictions와 rotation을 검증합니다.", "query normalization, 0/multi/low precision candidate selection UX를 구현합니다.", "WGS84 lon/lat named type, SDK adapter, CRS/accuracy/range tests를 작성합니다.", "user action/consent, purpose precision, ephemeral default와 manual fallback을 적용합니다.", "privacy-safe cache key, single-flight, user/global quota와 negative TTL을 구현합니다.", "connect/read/deadline, status-aware retry, circuit/bulkhead와 degradation을 검증합니다.", "CSP origins/nonce와 SDK SRI 지원 가능성을 actual browser에서 확인합니다.", "semantic text list, keyboard/focus/status와 no-SDK/noscript fallback을 구현합니다.", "Geocoder port와 vendor adapter normalized errors/conformance fixtures를 작성합니다.", "map/geocode/cache/quota/accessibility SLO와 zero-location correlation을 적용합니다.", "permission/CRS/quota/script/vendor/browser failure matrix와 runbook을 제출합니다."],
    expectedResult: ["REST/Admin secret은 HTML/bundle/log에 없고 JavaScript key는 exact origin restriction과 quota/rotation을 가집니다.", "geocode는 없음·모호·정밀도를 구분하며 coordinate order/CRS/accuracy가 명시됩니다.", "위치는 명시 action과 purpose에 필요한 정밀도·수명만 처리되고 manual/text fallback이 항상 있습니다.", "quota/timeout/vendor/script 장애에서 bounded retry와 cache/degradation이 작동합니다.", "지도와 동등한 keyboard/text 결과가 있고 telemetry에 key·주소·정밀 좌표가 없습니다."],
    cleanup: ["synthetic geocode/cache/quota/circuit와 saved-place fixtures를 제거합니다.", "browser location permission/test origins, CSP reports와 SDK resources를 정리합니다.", "logs/traces/cache keys/screenshots/artifacts에서 synthetic key/address/location canary가 0건인지 확인합니다.", "connections/executors와 로컬 KakoController.java/kakao_map04.jsp는 원상 보존합니다."],
    extensions: ["두 vendor adapter의 precision/license/quota conformance를 비교합니다.", "offline/static tile 또는 server-rendered accessible map fallback을 설계합니다.", "geofence/routing에서 uncertainty propagation과 고위험 user confirmation을 추가합니다.", "key leak·quota exhaustion·SDK compromise와 location deletion incident drill을 수행합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Java 예제를 실행해 key, geocode, coordinate, privacy, retry, fallback과 adapter 결과를 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "actual key가 출력되지 않음을 확인합니다.", "NONE/AMBIGUOUS/CHOSEN을 설명합니다.", "GeoJSON과 SDK axis order를 구분합니다.", "page-load/denied가 위치를 쓰지 않음을 확인합니다.", "429/5xx/timeout action을 설명합니다.", "SDK unavailable에도 text/keyboard가 유지됨을 확인합니다.", "provider raw body가 없음을 확인합니다."], hints: ["각 결과가 browser, application server, vendor 중 어느 경계에서 만들어지는지 적으세요."], expectedOutcome: "marker가 보인다는 사실을 넘어 key·위치·정확성·fallback 계약을 실행 증거로 설명합니다.", solutionOutline: ["separate→restrict→choose→transform→consent→budget→fallback 순서입니다."] },
    { difficulty: "응용", prompt: "controlled browser와 vendor fixtures에서 server geocoder+accessible map flow를 구현하세요.", requirements: ["key boundary/restrictions를 검증합니다.", "candidate/precision/coordinate contract를 구현합니다.", "consent/minimization/deletion을 적용합니다.", "cache/coalescing/quota/deadline/retry를 검증합니다.", "CSP/SRI SDK boundary를 확인합니다.", "text/keyboard/no-SDK fallback을 제공합니다.", "vendor port/conformance와 zero-location canary를 통과합니다."], hints: ["browser JavaScript key 노출과 REST/Admin secret 노출을 같은 문제로 처리하지 마세요."], expectedOutcome: "vendor·permission·script 장애에도 개인정보와 핵심 장소 기능이 안전하게 유지됩니다.", solutionOutline: ["bound→normalize→minimize→call→render→degrade→prove 순서입니다."] },
    { difficulty: "설계", prompt: "조직용 map/geocoding integration standard를 작성하세요.", requirements: ["client/server/key/rotation rules를 둡니다.", "candidate/precision/CRS/axis rules를 둡니다.", "consent/purpose/retention/deletion rules를 둡니다.", "quota/cache/retry/circuit rules를 둡니다.", "CSP/SRI/third-party inventory rules를 둡니다.", "accessibility/fallback/vendor-port/telemetry rules를 둡니다.", "unit/server/vendor/browser/security/a11y gates를 포함합니다."], hints: ["정확성·privacy·availability·accessibility를 독립 축으로 평가하세요."], expectedOutcome: "모든 위치 기능이 vendor 교체와 사고에도 감사 가능한 기준을 유지합니다.", solutionOutline: ["partition→constrain→qualify→protect→degrade→observe→release 순서입니다."] },
  ],
  nextSessions: ["boot-08-translation-ai-api"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["KakoController.java는 inventory 표기 그대로 read-only로 43 lines/1,278 bytes와 SHA-256 1E7CCFE91630308001020028CC54E72D8576B36038CB6B91A2809E967504EDFC를 확인했습니다.", "kakao_map04.jsp는 read-only로 77 lines/3,211 bytes와 SHA-256 6B5FECF995D314A7FC7FEE7F16C26EB7DBB68EB07A3EEBF42DB43C4F019FD4D6를 확인했습니다.", "원본에서 Controller view routing과 JSP의 JavaScript key, geolocation, LatLng, marker/infowindow interaction을 확인했지만 server HTTP client/geocoding, quota/cache/retry, CSP/SRI/ARIA/noscript가 존재한다고 가정하지 않았습니다.", "실제 API key, registered domain, address, user/device location, coordinates와 vendor response/configuration 값은 maintained examples에 복제하지 않았습니다.", "JDK-only examples는 Kakao SDK/REST behavior, actual browser permission/CSP/SRI, vendor quota, CRS transformation과 accessibility testing을 대체하지 않습니다."] },
});

export default session;
