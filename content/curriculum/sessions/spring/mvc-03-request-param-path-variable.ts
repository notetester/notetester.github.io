import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-" + Math.min(12, lineCount), explanation: "query/path/form input과 required/default/conversion/allowlist 규칙을 JDK 21 record·collection으로 정의합니다." },
      { lines: Math.min(13, lineCount) + "-" + Math.max(13, lineCount - 8), explanation: "정상, missing, malformed, multi-value와 over-posting을 실행해 200·400·404 및 rejected field를 결정적으로 분류합니다." },
      { lines: Math.max(1, lineCount - 7) + "-" + lineCount, explanation: "실제 요청값이 아니라 synthetic 값, field category, status와 binding invariant만 정확히 출력합니다." },
    ],
    run: { environment: ["JDK 21 이상", "javac --release 21", "Spring·Servlet container·network·credential 불필요"], command: "javac --release 21 " + filename + " && java " + filename.replace(/\.java$/, "") },
    output: { value: output, explanation: ["stdout은 격리된 JDK 21 실행 결과와 정확히 일치해야 합니다.", "mini binder는 Spring WebDataBinder, ConversionService, Bean Validation과 PathPattern 구현을 대체하지 않으므로 MockMvc/target container test가 필요합니다."] },
    experiments: [
      { change: "required/default/Optional, path segment type, list cardinality 또는 allowed fields를 하나씩 바꿉니다.", prediction: "binding result, default 적용 시점과 4xx category가 달라집니다.", result: "route match→value extraction→conversion→binding→validation 순서의 evidence를 대조합니다." },
      { change: "nested/deep property, unknown field, 과도한 list/length와 encoded separator를 주입합니다.", prediction: "경계를 두지 않으면 over-posting, allocation 증가 또는 다른 path match가 발생합니다.", result: "dedicated input DTO, allowlist, size/depth limit와 canonical path policy를 적용합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "request-input-surfaces",
    title: "path·query·form·header·body를 서로 다른 의미의 불신 입력으로 분리합니다",
    lead: "Controller method argument는 Java type으로 보이지만 network에서는 문자열·byte 입력입니다. 어느 request surface에서 왔고 route 선택, conversion, binding과 validation 중 어느 단계가 소유하는지 알아야 4xx를 정확히 설명할 수 있습니다.",
    explanations: [
      "path variable은 선택된 resource identity, query parameter는 filter·sort·page 같은 representation 선택, form parameter는 browser field 입력, body는 media type별 representation에 주로 사용합니다. 편의 때문에 모든 값을 command object 하나로 섞지 않습니다.",
      "Spring MVC는 handler가 선택된 뒤 argument resolver가 annotation과 declared type을 보고 request 값을 추출하고 ConversionService/WebDataBinder를 사용합니다. handler mapping 실패와 argument binding 실패를 구분합니다.",
      "원본 RequestController에는 RequestParam과 low-level HttpServletRequest progression이 있고 ResponseController에는 ModelAttribute/Model/redirect progression이 있습니다. PathVariable은 확인되지 않으므로 존재한다고 가정하지 않고 공식 reference와 synthetic example로 보완합니다.",
      "servlet-context의 annotation-driven은 argument resolvers, converters와 validation integration의 기반이지만 application-specific converter와 validator가 자동 등록됐다는 뜻은 아닙니다.",
      "모든 외부 입력은 length, count, format과 semantic 범위를 제한합니다. log/metric에는 raw path variable, query, form/body와 unknown field 값을 넣지 않고 field category와 error code만 기록합니다.",
    ],
    concepts: [
      c("argument resolution", "선택된 handler의 parameter metadata를 바탕으로 request·session·model 등의 값을 준비하는 MVC 단계입니다.", ["mapping 뒤에 실행됩니다.", "resolver별 failure를 분류합니다.", "raw input을 신뢰하지 않습니다."]),
      c("untrusted input", "client가 조작할 수 있어 type·length·authorization·semantic 검증 전 신뢰할 수 없는 값입니다.", ["path/query도 포함합니다.", "출력 encoding과 별개입니다."]),
      c("binding pipeline", "값 추출→conversion→object property binding→validation으로 typed argument를 만드는 단계입니다.", ["각 단계 오류를 분리합니다.", "domain/service validation과 연결합니다."]),
    ],
    diagnostics: [d("controller에 진입하지 않았는데 모두 validation 실패로 기록되거나 raw query가 로그에 남습니다.", "route match, extraction, conversion, binding과 validation phase를 구분하지 않고 request dump로 진단했습니다.", ["selected handler 존재", "argument resolver", "conversion/binding error category", "validation invocation", "log redaction"], "bounded failure-phase code와 field name allowlist를 만들고 raw value 없이 lifecycle trace를 남깁니다.", "없는 route, missing value, malformed type, invalid semantic과 unknown field를 별도 4xx corpus로 검증합니다.")],
    expertNotes: ["Java parameter type은 network input을 안전하게 만들지 않으며 conversion 이전과 이후 경계를 모두 검증합니다.", "client error telemetry도 공격자가 만드는 high-cardinality 값으로 metric을 오염시키지 않게 제한합니다."],
  },
  {
    id: "request-param-required-default-optional",
    title: "@RequestParam의 required·defaultValue·Optional을 presence와 빈 값 계약으로 설계합니다",
    lead: "파라미터가 없음, 이름은 있지만 빈 문자열, malformed 값과 semantic 범위 위반은 서로 다릅니다. default를 편의로 넣기 전에 각 상태가 API에서 무엇을 뜻하는지 결정합니다.",
    explanations: [
      "기본 required=true인 scalar RequestParam이 없으면 argument resolution에서 400 계열 오류가 날 수 있습니다. optional input은 required=false, Optional 또는 nullable contract 중 프로젝트 표준을 선택합니다.",
      "defaultValue는 값이 없거나 특정 빈 입력에서 적용되는 framework semantics를 current version에서 확인합니다. page=1 같은 안전한 presentation default와 authorization/business default를 구분합니다.",
      "primitive int는 absence를 표현할 수 없으므로 required/default와 결합을 명시합니다. wrapper/Optional을 쓰더라도 null을 service 깊숙이 전파하지 말고 controller boundary에서 domain request로 변환합니다.",
      "parameter 이름 추론은 compiler -parameters metadata에 의존할 수 있으므로 public API 이름은 annotation에 명시하거나 build configuration을 qualification합니다.",
      "default 적용 후에도 size 상한, sort allowlist와 문자열 normalization을 검증합니다. default가 validation을 우회하거나 client error를 조용히 성공으로 바꾸지 않게 합니다.",
    ],
    concepts: [
      c("@RequestParam", "query/form parameter 등을 handler argument에 이름으로 연결하는 annotation입니다.", ["required/default를 명시합니다.", "multi-value type을 지원합니다.", "conversion 오류를 다룹니다."]),
      c("presence", "request에 parameter 이름과 값이 제공됐는지 나타내는 상태입니다.", ["absence와 empty를 구분합니다.", "default semantics를 문서화합니다."]),
      c("Optional input", "값이 없을 수 있음을 type과 API 계약으로 명시한 입력입니다.", ["domain에 무제한 전파하지 않습니다.", "empty/malformed를 구분합니다."]),
    ],
    codeExamples: [java("mvc03-request-param", "required·default·multi-value query binding", "Mvc03RequestParam.java", "합성 query map에서 required 검색어, default page와 반복 tag를 bind하고 missing required를 400으로 분류합니다.", String.raw`import java.util.List;
import java.util.Map;

public class Mvc03RequestParam {
  record Result(int status, String query, int page, List<String> tags) {}

  static Result bind(Map<String, List<String>> params) {
    String query = params.getOrDefault("q", List.of()).stream().findFirst().orElse(null);
    if (query == null || query.isBlank()) return new Result(400, "missing", 0, List.of());
    String pageText = params.getOrDefault("page", List.of("1")).getFirst();
    try {
      int page = Integer.parseInt(pageText);
      if (page < 1) return new Result(400, "range", 0, List.of());
      return new Result(200, query, page, List.copyOf(params.getOrDefault("tag", List.of())));
    } catch (NumberFormatException exception) {
      return new Result(400, "type", 0, List.of());
    }
  }

  public static void main(String[] args) {
    Result ok = bind(Map.of("q", List.of("spring"), "tag", List.of("mvc", "http")));
    Result missing = bind(Map.of("page", List.of("2")));
    Result malformed = bind(Map.of("q", List.of("spring"), "page", List.of("x")));
    System.out.println("ok=" + ok.status() + ",q=" + ok.query() + ",page=" + ok.page());
    System.out.println("tags=" + ok.tags());
    System.out.println("missing=" + missing.status() + "," + missing.query());
    System.out.println("malformed=" + malformed.status() + "," + malformed.query());
    System.out.println("default-applied=true");
  }
}`, "ok=200,q=spring,page=1\ntags=[mvc, http]\nmissing=400,missing\nmalformed=400,type\ndefault-applied=true", ["local-request-controller", "spring-request-param", "spring-method-arguments", "java-map", "java-list"])],
    diagnostics: [d("parameter가 없을 때 primitive default 0으로 진행되거나 빈 문자열이 의도치 않은 default로 바뀝니다.", "presence/empty/default/required와 conversion 순서를 API 계약으로 정하지 않았습니다.", ["raw presence category", "annotation required/default", "declared primitive/wrapper/Optional type", "conversion error", "post-default validation"], "absence·empty·malformed·out-of-range 결과를 표로 정하고 controller boundary에서 typed request 또는 stable 400으로 변환합니다.", "각 parameter에 missing/empty/multiple/malformed/min/max/default cases를 생성해 status와 service 호출 여부를 검증합니다.")],
    expertNotes: ["defaultValue는 client가 보내지 않은 사실을 숨길 수 있으므로 audit/behavior에 중요한 값에는 신중히 사용합니다.", "parameter 이름을 method reflection에만 의존하면 build flag 변화가 API runtime failure가 될 수 있습니다."],
  },
  {
    id: "multi-value-parameters",
    title: "반복 parameter·List·MultiValueMap의 순서·중복·상한을 명시합니다",
    lead: "같은 이름의 query/form parameter는 여러 값을 가질 수 있습니다. scalar로 받으면 첫 값 또는 conversion behavior에 의존하고, collection으로 받으면 공격자가 많은 값을 보내 resource를 소모할 수 있습니다.",
    explanations: [
      "List/array/MultiValueMap 중 API 의미에 맞는 type을 사용합니다. 순서가 의미 있는지, duplicate를 허용하는지와 absent/empty collection 결과를 문서화합니다.",
      "comma-delimited 한 parameter와 같은 이름을 반복한 parameter는 converter/configuration에 따라 다르게 해석될 수 있습니다. public contract에서 한 encoding을 선택하고 실제 client/MockMvc로 검증합니다.",
      "collection field마다 최대 항목 수, 각 값 길이와 전체 encoded request size를 제한합니다. deduplication 전에 원본 count로 abuse를 감지하고 정상화 뒤 semantic validation을 합니다.",
      "Map<String,String> 전체 수집은 unknown parameter를 조용히 받아들일 수 있습니다. 공개 filter set은 named parameters 또는 allowlisted MultiValueMap adapter로 제한합니다.",
      "metric에는 list count bucket과 validation category만 남기고 각 값은 기록하지 않습니다. error response도 rejected raw list를 echo하지 않습니다.",
    ],
    concepts: [
      c("multi-value parameter", "한 parameter name이 request에서 여러 값을 갖는 형태입니다.", ["List/array로 표현합니다.", "순서·중복을 정의합니다.", "cardinality를 제한합니다."]),
      c("MultiValueMap", "하나의 key에 여러 value를 보존하는 Spring collection abstraction입니다.", ["unknown key allowlist를 둡니다.", "scalar Map과 구분합니다."]),
      c("cardinality limit", "한 field 또는 request가 허용할 값 개수의 상한입니다.", ["allocation/SQL 폭증을 막습니다.", "client error로 조기 종료합니다."]),
    ],
    codeExamples: [java("mvc03-multi-value", "반복 parameter의 순서·중복·상한", "Mvc03MultiValue.java", "합성 tag 목록을 최대 3개로 제한하고 순서 보존·중복 제거 정책과 초과 400을 실행합니다.", String.raw`import java.util.LinkedHashSet;
import java.util.List;

public class Mvc03MultiValue {
  record Result(int status, List<String> values, String category) {}

  static Result bind(List<String> values) {
    if (values.size() > 3) return new Result(400, List.of(), "too-many");
    if (values.stream().anyMatch(value -> value.isBlank() || value.length() > 12)) {
      return new Result(400, List.of(), "invalid-value");
    }
    return new Result(200, List.copyOf(new LinkedHashSet<>(values)), "ok");
  }

  public static void main(String[] args) {
    Result ok = bind(List.of("mvc", "http", "mvc"));
    Result empty = bind(List.of());
    Result tooMany = bind(List.of("a", "b", "c", "d"));
    System.out.println("ok=" + ok.status() + "," + ok.values());
    System.out.println("deduplicated=" + (ok.values().size() == 2));
    System.out.println("empty=" + empty.status() + "," + empty.values());
    System.out.println("too-many=" + tooMany.status() + "," + tooMany.category());
    System.out.println("raw-values-logged=false");
  }
}`, "ok=200,[mvc, http]\ndeduplicated=true\nempty=200,[]\ntoo-many=400,too-many\nraw-values-logged=false", ["spring-request-param", "spring-method-arguments", "spring-mockmvc", "java-list"])],
    diagnostics: [d("반복 parameter가 scalar로 조용히 축소되거나 수천 값이 SQL IN 절과 memory를 폭증시킵니다.", "multi-value encoding과 최대 cardinality/length를 정의하지 않았습니다.", ["declared argument type", "raw value count bucket", "converter delimiter behavior", "dedup/order policy", "downstream query size"], "List/MultiValueMap 계약과 count/length 상한을 controller에서 적용하고 query/service에도 batch ceiling을 둡니다.", "absent/empty/one/duplicate/max/max+1/comma/repeated encodings을 실제 container와 client에서 검증합니다.")],
    expertNotes: ["deduplication은 제품 의미를 바꾸므로 무조건 적용하지 않고 set semantics일 때만 사용합니다.", "입력 제한과 database parameter/URL length 제한을 함께 qualification합니다."],
  },
  {
    id: "path-variable-matching-conversion",
    title: "@PathVariable을 pattern match와 type conversion·resource lookup의 세 단계로 나눕니다",
    lead: "없는 path, pattern은 맞지만 type conversion이 실패한 path와 변환된 ID의 resource가 없는 경우는 다른 4xx입니다. 모두 not found로 뭉치면 client와 보안 정책이 모호해집니다.",
    explanations: [
      "PathPattern이 literal/variable/regex segment로 lookup path를 먼저 match합니다. match하지 않으면 handler가 선택되지 않아 404가 되고 controller conversion은 실행되지 않습니다.",
      "선택된 variable 문자열은 declared Long, UUID, enum 또는 custom type으로 conversion됩니다. malformed 값은 type mismatch 400 계열이 될 수 있으며 converter error에 raw path를 넣지 않습니다.",
      "변환 성공 뒤 positive/range/tenant scope와 object-level authorization을 검증하고 repository lookup을 수행합니다. 없는 resource의 404와 접근 거부의 external policy를 일관되게 정합니다.",
      "variable 이름 추론 역시 compiler parameter metadata에 영향받을 수 있어 annotation name과 route template을 명시하거나 build를 고정합니다.",
      "encoded slash, semicolon, dot segments와 Unicode normalization은 proxy/container/PathPattern 차이를 만들 수 있습니다. ID format을 좁히고 target deployment corpus에서 canonicalization을 검증합니다.",
    ],
    concepts: [
      c("@PathVariable", "URI template에서 capture한 path segment를 handler argument에 연결하는 annotation입니다.", ["pattern match 뒤 conversion됩니다.", "resource authorization과 별개입니다."]),
      c("PathPattern", "request path를 segment 단위로 parse해 controller route pattern과 match하는 Spring MVC mechanism입니다.", ["specificity를 비교합니다.", "encoding을 고려합니다."]),
      c("type mismatch", "문자열 입력을 declared target type으로 변환할 수 없어 argument 준비가 실패한 상태입니다.", ["semantic invalid와 구분합니다.", "stable 400 category를 제공합니다."]),
    ],
    codeExamples: [java("mvc03-path-variable", "path match·conversion·range의 404/400/200 분리", "Mvc03PathVariable.java", "고정 /items/{id} 모양을 합성 segment로 검사해 없는 route, 숫자 오류, 범위 오류와 성공을 구분합니다.", String.raw`public class Mvc03PathVariable {
  record Result(int status, String category, long id) {}

  static Result handle(String path) {
    String prefix = "/items/";
    if (!path.startsWith(prefix) || path.length() == prefix.length()) {
      return new Result(404, "no-route", 0);
    }
    String segment = path.substring(prefix.length());
    if (segment.contains("/")) return new Result(404, "no-route", 0);
    try {
      long id = Long.parseLong(segment);
      if (id < 1) return new Result(400, "range", 0);
      return new Result(200, "ok", id);
    } catch (NumberFormatException exception) {
      return new Result(400, "type", 0);
    }
  }

  public static void main(String[] args) {
    System.out.println("ok=" + handle("/items/42"));
    System.out.println("type=" + handle("/items/x"));
    System.out.println("range=" + handle("/items/0"));
    System.out.println("missing=" + handle("/other/42"));
    System.out.println("lookup-after-conversion=true");
  }
}`, "ok=Result[status=200, category=ok, id=42]\ntype=Result[status=400, category=type, id=0]\nrange=Result[status=400, category=range, id=0]\nmissing=Result[status=404, category=no-route, id=0]\nlookup-after-conversion=true", ["spring-request-mapping", "spring-path-matching", "rfc3986", "rfc9110-status", "java-string"])],
    diagnostics: [d("잘못된 ID가 500이 되거나 encoded path가 proxy와 application에서 다른 resource로 match합니다.", "path normalization, pattern match, conversion과 semantic validation을 구분하지 않았습니다.", ["edge/container raw/effective path", "PathPattern candidate", "captured segment category", "converter exception", "range/authorization/lookup result"], "canonical path policy와 좁은 ID converter를 적용하고 404/400/403/resource-404를 stable contract로 분리합니다.", "encoded slash/dot/semicolon/unicode, empty/extra segment, overflow와 unauthorized ID corpus를 실제 배포 경로에서 실행합니다.")],
    expertNotes: ["regex pattern으로 모든 semantic validation을 해결하지 말고 path shape와 domain rule을 분리합니다.", "404/403 선택은 enumeration risk와 API usability를 함께 고려해 전체 application에서 일관되게 적용합니다."],
  },
  {
    id: "conversion-service-formatters",
    title: "ConversionService와 Formatter를 locale·timezone·failure category까지 포함해 구성합니다",
    lead: "모든 request 값은 문자열에서 시작합니다. 숫자, enum, 날짜와 domain ID conversion이 환경 default에 기대면 locale/timezone 또는 대소문자에 따라 결과가 달라집니다.",
    explanations: [
      "Converter는 source→target type conversion을, Formatter는 locale-aware print/parse를 제공할 수 있습니다. web input에 필요한 converter를 명시적으로 등록하고 전역 application converter와 scope를 검토합니다.",
      "숫자는 overflow, sign, decimal/scale과 locale separator를 제한합니다. enum은 case policy와 allowlist를 정하고 Java enum 이름을 public API에 영구 고정할지 고민합니다.",
      "날짜/시간은 ISO format, zone과 offset 존재 여부를 명시합니다. LocalDate와 Instant의 의미를 섞지 않고 DST 경계·precision을 target service/DB까지 round-trip합니다.",
      "custom converter는 DB/network 조회나 무거운 business logic을 수행하지 않습니다. conversion은 bounded·deterministic해야 하며 resource authorization과 lookup은 service에서 실행합니다.",
      "conversion error response에는 field, expected format category와 code를 제공하되 raw value나 stack trace는 제외합니다. 내부에는 converter id/version과 cause category를 제한적으로 남깁니다.",
    ],
    concepts: [
      c("ConversionService", "source type 값을 target type으로 변환할 converter registry와 실행 contract입니다.", ["web binding과 공유될 수 있습니다.", "converter scope/collision을 관리합니다."]),
      c("Formatter", "locale context를 고려해 object를 문자열로 print하거나 parse하는 contract입니다.", ["public format을 명시합니다.", "환경 locale 의존을 피합니다."]),
      c("deterministic conversion", "같은 approved input과 configuration에서 시간·locale·외부 상태와 무관하게 같은 typed 결과 또는 같은 error를 내는 변환입니다.", ["I/O를 피합니다.", "경계를 테스트합니다."]),
    ],
    codeExamples: [java("mvc03-conversion", "enum·ISO 날짜·숫자 conversion 결과", "Mvc03Conversion.java", "합성 문자열을 enum, LocalDate와 bounded int로 변환하고 malformed 날짜를 400 category로 분류합니다.", String.raw`import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Locale;

public class Mvc03Conversion {
  enum Sort { RECENT, NAME }
  record Result(int status, String value) {}

  static Result convert(String sort, String date, String size) {
    try {
      Sort parsedSort = Sort.valueOf(sort.toUpperCase(Locale.ROOT));
      LocalDate parsedDate = LocalDate.parse(date);
      int parsedSize = Integer.parseInt(size);
      if (parsedSize < 1 || parsedSize > 100) return new Result(400, "size-range");
      return new Result(200, parsedSort + "," + parsedDate + "," + parsedSize);
    } catch (DateTimeParseException exception) {
      return new Result(400, "date-format");
    } catch (IllegalArgumentException exception) {
      return new Result(400, "type");
    }
  }

  public static void main(String[] args) {
    System.out.println("ok=" + convert("recent", "2026-07-14", "20"));
    System.out.println("bad-date=" + convert("recent", "14-07-2026", "20"));
    System.out.println("bad-enum=" + convert("unknown", "2026-07-14", "20"));
    System.out.println("bad-size=" + convert("name", "2026-07-14", "101"));
    System.out.println("locale-fixed=true");
  }
}`, "ok=Result[status=200, value=RECENT,2026-07-14,20]\nbad-date=Result[status=400, value=date-format]\nbad-enum=Result[status=400, value=type]\nbad-size=Result[status=400, value=size-range]\nlocale-fixed=true", ["spring-conversion", "spring-formatting", "spring-init-binder", "java-local-date"])],
    diagnostics: [d("로컬에서는 날짜/숫자가 bind되지만 다른 locale/timezone 환경에서 type mismatch나 다른 날짜가 됩니다.", "implicit formatter와 system locale/zone에 의존했습니다.", ["registered converters/formatters", "request format contract", "runtime locale/zone", "overflow/precision", "conversion error category"], "ISO/approved formats와 zone을 API에 명시하고 deterministic converter/formatter를 MVC config 또는 binder scope에 등록합니다.", "locale/zone matrix, DST/overflow/invalid enum/date와 converter collision test를 실행합니다.")],
    expertNotes: ["편리한 lenient parsing은 잘못된 입력을 다른 유효 값으로 바꿀 수 있으므로 public API에는 엄격한 format을 선호합니다.", "domain object lookup converter는 authorization과 I/O를 binding 단계에 숨길 수 있어 신중히 사용합니다."],
  },
  {
    id: "command-object-binding",
    title: "command object를 dedicated web input DTO로 만들고 constructor/property binding을 구분합니다",
    lead: "여러 request parameter를 객체에 bind하면 controller signature가 간결해지지만 client가 property path를 선택합니다. persistence entity나 권한 field가 있는 domain object를 직접 노출하지 않습니다.",
    explanations: [
      "@ModelAttribute argument는 model에서 object를 가져오거나 만들고 WebDataBinder가 request 값을 bind할 수 있습니다. attribute name, creation source와 constructor/setter binding을 명시합니다.",
      "dedicated input DTO는 이 operation이 받을 field만 포함합니다. immutable record/constructor는 입력 surface를 구조적으로 좁히고 mutable bean은 allowedFields/requiredFields로 보강합니다.",
      "nested property와 auto-grow는 편리하지만 deep graph와 큰 collection allocation을 유발할 수 있습니다. nesting depth, collection size와 object creation을 제한합니다.",
      "binding object와 service command/domain entity를 분리해 server-owned id, owner, role, status, audit field를 service가 결정하게 합니다.",
      "binding 완료는 type 구조가 만들어졌다는 뜻이며 domain invariant·authorization·existence와 transaction 검증은 이후 service boundary에서 수행합니다.",
    ],
    concepts: [
      c("command object", "한 web operation의 입력 field를 모아 binding·validation하는 dedicated object입니다.", ["entity와 분리합니다.", "허용 field만 포함합니다.", "service command로 변환합니다."]),
      c("constructor binding", "constructor parameter를 통해 object를 생성하며 request가 제공할 입력을 구조적으로 제한하는 방식입니다.", ["immutable design에 적합합니다.", "parameter metadata를 검증합니다."]),
      c("property binding", "기존 object의 writable property에 setter/property path로 값을 적용하는 방식입니다.", ["over-posting을 통제합니다.", "nested growth를 제한합니다."]),
    ],
    diagnostics: [d("form field를 추가했더니 entity의 권한·owner·status까지 client가 바꿀 수 있습니다.", "persistence/domain object를 command로 직접 bind해 writable property 전체를 input surface로 노출했습니다.", ["handler argument type", "writable/nested properties", "allowed/disallowed fields", "DTO→domain mapping", "service authorization"], "operation-specific immutable input DTO와 explicit mapping을 사용하고 server-owned field는 request type에서 제거합니다.", "unknown/sensitive/nested/indexed fields를 제출해 rejected field와 final domain state가 안전한지 검증합니다.")],
    expertNotes: ["DTO가 많다는 비용보다 공개 input surface가 entity 변화에 따라 확장되는 위험이 큽니다.", "constructor binding도 constructor가 민감 field를 포함하면 안전하지 않으므로 dedicated type가 핵심입니다."],
  },
  {
    id: "over-posting-field-policy",
    title: "over-posting을 unknown·disallowed field evidence와 최종 state로 차단합니다",
    lead: "공격자는 화면에 없는 field도 직접 전송할 수 있습니다. HTML form을 숨겼거나 disabled로 둔 것은 server binding policy가 아니며, mass assignment를 explicit allowlist로 제한해야 합니다.",
    explanations: [
      "input DTO에 필요한 field만 두는 것이 첫 방어입니다. mutable object를 bind해야 하면 @InitBinder의 allowedFields와 auto-grow limit를 operation별로 설정합니다.",
      "unknown field를 무시할지 400으로 거부할지 API 정책을 정합니다. 조용한 무시는 backward compatibility에 유용할 수 있지만 typo·공격 탐지를 약화시키므로 version/consumer 특성에 맞춥니다.",
      "disallowed field 이름도 public error에 내부 entity 구조로 과도하게 노출하지 않습니다. 승인된 public field code와 generic unknown-field category를 사용합니다.",
      "binding allowlist 뒤에도 service가 current principal과 stored resource를 기준으로 authorization과 transition rule을 적용합니다. controller DTO만으로 권한을 결정하지 않습니다.",
      "test는 role, ownerId, id, status, balance 같은 synthetic sensitive names와 nested/indexed variants를 주입하고 DB readback에서 server-owned state가 바뀌지 않았음을 확인합니다.",
    ],
    concepts: [
      c("over-posting", "client가 의도한 form/API field 밖의 writable property를 보내 server object를 변경하는 mass-assignment 위험입니다.", ["UI 숨김으로 막을 수 없습니다.", "dedicated DTO/allowlist를 사용합니다."]),
      c("allowed fields", "WebDataBinder가 property binding을 허용할 명시적 field 목록입니다.", ["operation별로 좁힙니다.", "nested path를 검토합니다."]),
      c("server-owned field", "identity, ownership, authorization, workflow와 audit처럼 client가 직접 정하지 않고 server가 계산하는 field입니다.", ["request DTO에서 제거합니다.", "service에서 결정합니다."]),
    ],
    codeExamples: [java("mvc03-over-posting", "allowed field만 bind하고 role을 거부", "Mvc03OverPosting.java", "합성 input map에서 displayName/age만 command로 옮기고 role field를 rejected evidence로 남깁니다.", String.raw`import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class Mvc03OverPosting {
  record Binding(Map<String, String> accepted, List<String> rejected) {}

  static Binding bind(Map<String, String> input) {
    Set<String> allowed = Set.of("displayName", "age");
    Map<String, String> accepted = new LinkedHashMap<>();
    List<String> rejected = new ArrayList<>();
    input.forEach((key, value) -> {
      if (allowed.contains(key)) accepted.put(key, value);
      else rejected.add(key);
    });
    rejected.sort(String::compareTo);
    return new Binding(Map.copyOf(accepted), List.copyOf(rejected));
  }

  public static void main(String[] args) {
    Binding result = bind(Map.of("displayName", "learner", "age", "20", "role", "ADMIN"));
    System.out.println("accepted-keys=" + result.accepted().keySet().stream().sorted().toList());
    System.out.println("rejected=" + result.rejected());
    System.out.println("role-bound=" + result.accepted().containsKey("role"));
    System.out.println("status=400");
    System.out.println("raw-rejected-value-logged=false");
  }
}`, "accepted-keys=[age, displayName]\nrejected=[role]\nrole-bound=false\nstatus=400\nraw-rejected-value-logged=false", ["spring-data-binding", "spring-model-attribute", "spring-init-binder", "jakarta-validation", "java-map"])],
    diagnostics: [d("일반 사용자가 form에 없는 field를 추가해 privileged state를 변경합니다.", "entity/command의 writable property를 field allowlist와 service authorization 없이 자동 binding했습니다.", ["input DTO fields", "binder allowed/disallowed", "suppressed/unknown fields", "service transition/ownership check", "final DB readback"], "dedicated immutable DTO와 explicit mapping을 사용하고 unknown/disallowed input은 stable client error와 security telemetry로 처리합니다.", "sensitive/nested/indexed field fuzz와 role/owner별 integration test로 server-owned state 불변을 확인합니다.")],
    expertNotes: ["disallowedFields blacklist는 새 sensitive property가 추가될 때 놓칠 수 있어 allowlist/dedicated DTO가 더 안전합니다.", "validation success와 authorization success를 같은 것으로 취급하지 않습니다."],
  },
  {
    id: "validation-binding-result-boundary",
    title: "binding/type 오류와 Bean Validation·domain validation을 순서대로 연결합니다",
    lead: "문자열을 type으로 바꾸지 못한 오류와 type은 맞지만 범위를 어긴 오류는 다른 evidence입니다. BindingResult를 올바른 argument 옆에 두고 controller와 service validation 책임을 분리합니다.",
    explanations: [
      "@Valid 또는 @Validated는 data binding 뒤 constraint validation을 적용할 수 있습니다. binding failure가 있으면 일부 field가 target object에 적용되지 않았을 수 있어 error list와 rejected state를 함께 봅니다.",
      "BindingResult/Errors는 보통 바로 앞 model attribute 또는 validated argument의 error를 받는 위치 규칙이 중요합니다. 잘못 배치하면 framework가 exception path로 처리할 수 있습니다.",
      "web validation은 required, length, format과 단순 cross-field를 빠르게 거릅니다. uniqueness, current state transition, ownership과 transaction-dependent invariant는 service/domain에서 다시 검사합니다.",
      "validation group 남용은 한 DTO가 많은 operation에 결합될 신호일 수 있습니다. create/update/patch별 dedicated command로 public input과 required field를 명확히 합니다.",
      "field error response에는 public field, code와 safe message를 제공하고 rejected raw value, constraint implementation, stack trace와 domain 내부를 노출하지 않습니다.",
    ],
    concepts: [
      c("BindingResult", "특정 binding/validation 대상의 field/global error와 suppressed field를 담는 Spring MVC 결과입니다.", ["대상 argument 바로 뒤에 둡니다.", "raw rejected value 노출을 통제합니다."]),
      c("Bean Validation", "annotation/constraint를 통해 object field와 class-level invariant를 검증하는 Jakarta specification입니다.", ["binding 뒤 적용됩니다.", "domain/authorization을 대체하지 않습니다."]),
      c("validation boundary", "web structural validation과 service/domain stateful invariant가 각각 책임지는 경계입니다.", ["중복과 gap을 문서화합니다.", "transaction 안 검증을 구분합니다."]),
    ],
    diagnostics: [d("@Valid를 붙였는데 validation error가 controller에서 처리되지 않고 500/예외 page가 됩니다.", "BindingResult 위치가 대상 바로 뒤가 아니거나 exception resolver/error contract가 구성되지 않았습니다.", ["handler signature order", "binding vs method validation exception", "validator registration", "error resolver", "response status/schema"], "대상 argument와 BindingResult를 인접시키고 binding/constraint/domain error를 stable 400/422 정책으로 매핑합니다.", "type mismatch, field/global constraint, unknown field와 service conflict를 별도 test하고 service 미호출/rollback을 확인합니다.")],
    expertNotes: ["400과 422 중 선택보다 같은 failure가 환경·handler마다 흔들리지 않는 일관성이 중요합니다.", "message bundle과 locale을 사용해도 내부 constraint나 rejected PII가 response에 섞이지 않게 합니다."],
  },
  {
    id: "binding-error-security-contract",
    title: "4xx error를 field code·correlation과 security limit로 설계합니다",
    lead: "binding 실패는 정상적인 client error이면서 공격 surface이기도 합니다. 상세 stack trace를 보여 주지 않으면서 client가 수정할 수 있는 충분한 구조와 운영자가 원인을 찾을 bounded evidence가 필요합니다.",
    explanations: [
      "404 route, 400 missing/type/binding, 403 authorization, 413/414 size, 415 media와 domain conflict를 phase/code로 구분합니다. 모든 예외를 같은 Bad Request message로 덮지 않습니다.",
      "problem response에는 status, stable application code, approved field names와 correlation id를 제공할 수 있습니다. request target, raw value, class name, stack trace와 SQL은 넣지 않습니다.",
      "parameter count, name length, value length, nested depth, collection auto-grow와 body/request size를 edge/container/MVC에 걸쳐 제한합니다. 어느 layer가 어떤 status를 반환하는지 qualification합니다.",
      "Unicode normalization, null byte, encoded separators, property path syntax와 extremely large numbers를 fuzz합니다. parser/converter가 오래 걸리거나 allocation을 과도하게 하지 않는지 deadline과 memory로 봅니다.",
      "security telemetry는 normalized route, error code, field category, count/length bucket과 source risk signal만 사용하고 raw 공격 문자열을 일반 metric label에 넣지 않습니다.",
    ],
    concepts: [
      c("problem response", "HTTP error의 status, stable type/code와 safe detail을 구조화한 response 계약입니다.", ["correlation을 제공합니다.", "민감한 내부 정보를 제외합니다."]),
      c("binding limit", "parameter count/length, nesting, collection growth와 numeric range를 제한해 parser·binder resource abuse를 막는 정책입니다.", ["edge/container/MVC를 맞춥니다.", "fail fast합니다."]),
      c("error code", "message 문구와 분리되어 client가 처리할 수 있는 stable failure category입니다.", ["field/value를 포함하지 않습니다.", "version compatibility를 관리합니다."]),
    ],
    diagnostics: [d("악성 property path나 큰 숫자/목록 입력에서 CPU·memory가 급증하고 error body에 raw value/stack trace가 노출됩니다.", "binder/parser limit와 error redaction을 두지 않고 exception 객체를 그대로 serialize했습니다.", ["request size/count/depth", "auto-grow limits", "conversion timing/allocation", "exception resolver", "response/log secret scan"], "입력 budget을 edge/container/binder에 적용하고 exception을 approved problem code와 bounded field metadata로 변환합니다.", "oversize/deep/indexed/overflow/unicode/encoded fuzz에서 bounded latency, 4xx와 raw-value-zero를 검증합니다.")],
    expertNotes: ["공격 payload를 보존해야 한다면 restricted security store와 보존/접근 정책을 사용하고 일반 application log와 분리합니다.", "client 4xx 급증은 단순 사용자 실수뿐 아니라 API drift나 attack signal일 수 있어 route/version별로 관측합니다."],
  },
  {
    id: "binding-observability-contract-testing",
    title: "route→resolver→converter→binder→validator→service를 MockMvc와 실제 container에서 추적합니다",
    lead: "binding test는 controller method가 호출됐는지만 보지 않고 status, field error code, service 호출 여부와 state effect를 외부 HTTP 계약으로 확인해야 합니다.",
    explanations: [
      "pure converter/validator unit test는 경계값을 빠르게 검증합니다. MockMvc는 annotated mapping, argument resolver, binding/validation과 exception handling을 검증하고 actual container test는 URL decoding, parameter parsing과 filters를 확인합니다.",
      "정상·missing·empty·multi·malformed·overflow·unknown/disallowed·invalid semantic·unauthorized cases를 table-driven corpus로 관리합니다. request 생성 helper가 실제 parameter encoding 차이를 숨기지 않게 합니다.",
      "trace에는 normalized route, resolver/converter id category, binding/validation error counts, service-called boolean, status와 latency를 둡니다. raw values와 full error object는 제외합니다.",
      "converter/binder 설정 변경은 old/new corpus를 differential 실행하고 public error code·field names와 successful typed request가 같은지 비교합니다.",
      "배포 canary에서 400/404/413/415와 converter error distribution을 version별로 보고 spike 시 route/config artifact를 rollback합니다. client drift와 attack을 구분할 sample policy를 둡니다.",
    ],
    concepts: [
      c("binding corpus", "입력 surface별 정상·경계·malformed·abuse request와 expected status/error/state를 모은 테스트 집합입니다.", ["table-driven으로 관리합니다.", "실제 encoding을 포함합니다."]),
      c("service-called invariant", "controller boundary에서 거부된 4xx request는 service/transaction/persistence를 호출하지 않아야 한다는 조건입니다.", ["mock/trace로 확인합니다.", "resource 절약을 증명합니다."]),
      c("differential binding test", "converter/binder/framework old/new 버전에 같은 request corpus를 실행해 typed result와 error contract 차이를 비교하는 테스트입니다.", ["허용 차이를 명시합니다.", "migration gate로 사용합니다."]),
    ],
    codeExamples: [java("mvc03-binding-pipeline", "추출→conversion→allowlist→validation 단계 trace", "Mvc03BindingPipeline.java", "합성 field map을 단계별 처리해 정상 입력과 unknown/missing/type 오류에서 service 호출 여부를 확인합니다.", String.raw`import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class Mvc03BindingPipeline {
  record Result(int status, String phase, boolean serviceCalled, List<String> trace) {}

  static Result bind(Map<String, String> input) {
    List<String> trace = new ArrayList<>(List.of("extract"));
    Set<String> allowed = Set.of("name", "age");
    if (!allowed.containsAll(input.keySet())) return new Result(400, "allowlist", false, List.copyOf(trace));
    String name = input.get("name");
    if (name == null || name.isBlank()) return new Result(400, "required", false, List.copyOf(trace));
    trace.add("convert");
    int age;
    try { age = Integer.parseInt(input.getOrDefault("age", "")); }
    catch (NumberFormatException exception) { return new Result(400, "conversion", false, List.copyOf(trace)); }
    trace.add("validate");
    if (age < 0 || age > 130) return new Result(400, "validation", false, List.copyOf(trace));
    trace.add("service");
    return new Result(200, "ok", true, List.copyOf(trace));
  }

  public static void main(String[] args) {
    System.out.println("ok=" + bind(Map.of("name", "learner", "age", "20")));
    System.out.println("unknown=" + bind(Map.of("name", "learner", "age", "20", "role", "x")));
    System.out.println("missing=" + bind(Map.of("age", "20")));
    System.out.println("type=" + bind(Map.of("name", "learner", "age", "x")));
    System.out.println("raw-input-logged=false");
  }
}`, "ok=Result[status=200, phase=ok, serviceCalled=true, trace=[extract, convert, validate, service]]\nunknown=Result[status=400, phase=allowlist, serviceCalled=false, trace=[extract]]\nmissing=Result[status=400, phase=required, serviceCalled=false, trace=[extract]]\ntype=Result[status=400, phase=conversion, serviceCalled=false, trace=[extract, convert]]\nraw-input-logged=false", ["local-response-controller", "local-servlet-context", "spring-validation", "spring-error-responses", "spring-mockmvc", "spring-method-arguments", "java-optional"])],
    diagnostics: [d("framework/converter upgrade 뒤 400 error field/code가 바뀌거나 invalid request가 service까지 도달합니다.", "binding corpus와 service-called/state invariant 없이 happy-path controller test만 실행했습니다.", ["old/new typed arguments", "error phase/code/field", "service invocation", "transaction/DB state", "actual container decoding"], "같은 binding corpus를 unit→MockMvc→container에 실행하고 invalid case service 호출 0과 state unchanged를 assertion합니다.", "upgrade differential, 4xx canary distribution과 rollback 가능한 MVC config artifact를 release gate에 둡니다.")],
    expertNotes: ["MockMvc standalone setup은 production ControllerAdvice/converters/security와 다를 수 있으므로 어떤 configuration을 포함했는지 manifest로 남깁니다.", "관측 field 이름도 public allowlist를 사용해 내부 nested property 구조를 노출하지 않습니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-request-controller", repository: "SPRING/SpringBasic", path: "src/main/java/com/simple/controller/RequestController.java", usedFor: ["RequestParam and low-level request progression"], evidence: "read-only scanner로 90-line, public method8, RequestParam5, HttpServletRequest2와 mapping 구조만 확인했으며 route·parameter literal/source body는 복사하지 않았습니다." },
  { id: "local-response-controller", repository: "SPRING/SpringBasic", path: "src/main/java/com/simple/controller/ResponseController.java", usedFor: ["ModelAttribute/model/redirect argument progression"], evidence: "read-only scanner로 75-line, ModelAttribute2, Model/ModelAndView/RedirectAttributes 구조만 확인했으며 attribute/view 값은 복사하지 않았습니다." },
  { id: "local-servlet-context", repository: "SPRING/SpringBasic", path: "src/main/webapp/WEB-INF/config/servlet-context.xml", usedFor: ["annotation-driven binding infrastructure progression"], evidence: "read-only scanner로 annotation-driven, component scan과 view resolver 존재만 확인했으며 package/path 설정값은 복사하지 않았습니다." },
  { id: "spring-request-param", repository: "Spring Framework", path: "@RequestParam", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/requestparam.html", usedFor: ["required/default/Optional/multi-value parameter binding"], evidence: "Spring Framework 공식 RequestParam reference입니다." },
  { id: "spring-request-mapping", repository: "Spring Framework", path: "Mapping Requests and URI Patterns", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html#mvc-ann-requestmapping-uri-templates", usedFor: ["PathVariable and URI pattern matching"], evidence: "Spring Framework 공식 URI template mapping 절입니다." },
  { id: "spring-path-matching", repository: "Spring Framework", path: "Path Matching", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/handlermapping-path.html", usedFor: ["lookup path decoding and PathPattern"], evidence: "Spring Framework 공식 path matching reference입니다." },
  { id: "spring-method-arguments", repository: "Spring Framework", path: "Method Arguments", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/arguments.html", usedFor: ["argument resolver and BindingResult/Optional contracts"], evidence: "Spring Framework 공식 handler method arguments reference입니다." },
  { id: "spring-data-binding", repository: "Spring Framework", path: "Web MVC Data Binding", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-data-binding.html", usedFor: ["safe model design and dedicated input objects"], evidence: "Spring Framework 공식 MVC data binding reference입니다." },
  { id: "spring-model-attribute", repository: "Spring Framework", path: "@ModelAttribute Method Argument", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/modelattrib-method-args.html", usedFor: ["command object creation/binding/validation"], evidence: "Spring Framework 공식 ModelAttribute argument reference입니다." },
  { id: "spring-init-binder", repository: "Spring Framework", path: "@InitBinder", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-initbinder.html", usedFor: ["allowed fields and binder customization"], evidence: "Spring Framework 공식 InitBinder reference입니다." },
  { id: "spring-conversion", repository: "Spring Framework", path: "Spring Type Conversion", publicUrl: "https://docs.spring.io/spring-framework/reference/core/validation/convert.html", usedFor: ["ConversionService/Converter contracts"], evidence: "Spring Framework 공식 type conversion reference입니다." },
  { id: "spring-formatting", repository: "Spring Framework", path: "Spring Field Formatting", publicUrl: "https://docs.spring.io/spring-framework/reference/core/validation/format.html", usedFor: ["Formatter locale-aware parse/print"], evidence: "Spring Framework 공식 formatting reference입니다." },
  { id: "spring-validation", repository: "Spring Framework", path: "Validation", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html", usedFor: ["MVC validation and error handling"], evidence: "Spring Framework 공식 MVC validation reference입니다." },
  { id: "spring-error-responses", repository: "Spring Framework", path: "Error Responses", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html", usedFor: ["problem response/error contract"], evidence: "Spring Framework 공식 MVC error response reference입니다." },
  { id: "spring-mockmvc", repository: "Spring Framework", path: "MockMvc", publicUrl: "https://docs.spring.io/spring-framework/reference/testing/mockmvc.html", usedFor: ["binding HTTP contract tests"], evidence: "Spring Framework 공식 MockMvc reference입니다." },
  { id: "jakarta-validation", repository: "Jakarta Bean Validation 3.1", path: "Specification", publicUrl: "https://jakarta.ee/specifications/bean-validation/3.1/jakarta-validation-spec-3.1.html", usedFor: ["constraint validation boundary"], evidence: "Jakarta Bean Validation 공식 specification입니다." },
  { id: "rfc3986", repository: "IETF URI Generic Syntax", path: "URI Syntax", publicUrl: "https://www.rfc-editor.org/rfc/rfc3986.html", usedFor: ["path/query/encoding semantics"], evidence: "IETF RFC 3986 공식 URI specification입니다." },
  { id: "rfc9110-status", repository: "IETF HTTP Semantics", path: "Client Error 4xx", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5", usedFor: ["400/403/404/413/414 semantics"], evidence: "IETF RFC 9110 공식 client error status 절입니다." },
  { id: "java-map", repository: "Java SE 21 API", path: "Map", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html", usedFor: ["parameter/over-posting/binding examples"], evidence: "Oracle JDK 공식 Map API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["multi-value/request parameter examples"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-local-date", repository: "Java SE 21 API", path: "LocalDate", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/LocalDate.html", usedFor: ["deterministic date conversion example"], evidence: "Oracle JDK 공식 LocalDate API입니다." },
  { id: "java-string", repository: "Java SE 21 API", path: "String", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html", usedFor: ["path segment example"], evidence: "Oracle JDK 공식 String API입니다." },
  { id: "java-optional", repository: "Java SE 21 API", path: "Optional", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html", usedFor: ["optional input and pipeline evidence"], evidence: "Oracle JDK 공식 Optional API입니다." },
];

const session = createExpertSession({
  inventoryId: "mvc-03-request-param-path-variable", slug: "mvc-03-request-param-path-variable", courseId: "spring", moduleId: "spring-mvc-request-response", order: 3,
  title: "요청 파라미터·PathVariable·객체 바인딩", subtitle: "query/path 입력의 presence·multi-value·conversion에서 command object·over-posting·validation·4xx·보안 한계와 테스트 evidence까지 binding pipeline을 완성합니다.", level: "중급", estimatedMinutes: 950,
  coreQuestion: "문자열 request input을 안전한 typed controller argument와 command로 바꾸면서 missing·malformed·unknown·unauthorized 입력을 일관된 4xx로 막고 service state를 보호하려면 어떻게 해야 할까요?",
  summary: "SpringBasic RequestController, ResponseController와 servlet-context.xml을 read-only 구조 scanner로 확인해 RequestParam/HttpServletRequest, ModelAttribute/Model/redirect와 annotation-driven progression을 보존했습니다. 로컬에 PathVariable·validation/session annotation은 확인되지 않아 있다고 가정하지 않고 공식 문서로 확장했습니다. input surfaces, required/default/Optional, multi-value, PathPattern/PathVariable, conversion/formatting, command binding, over-posting allowlist, BindingResult/validation, input limits/error security와 unit→MockMvc→container evidence를 독립적으로 설명합니다. 다섯 JDK 21 exact examples는 query binding, list cardinality, path 404/400, deterministic conversion, over-posting과 pipeline rejection을 실행합니다.",
  objectives: ["path/query/form/body input surface와 argument resolution 단계를 구분한다.", "RequestParam required/default/Optional의 absence·empty 의미를 설계한다.", "multi-value parameter의 순서·중복·cardinality를 제한한다.", "PathVariable pattern match·conversion·lookup과 404/400을 구분한다.", "ConversionService/Formatter의 locale/timezone/overflow를 통제한다.", "dedicated command DTO와 constructor/property binding을 설계한다.", "over-posting을 field allowlist와 service authorization으로 차단한다.", "BindingResult·Bean Validation·problem response·input limits와 테스트 evidence를 운영한다."],
  prerequisites: [{ title: "@RequestMapping과 HTTP 메서드·경로 설계", reason: "path/method 조건과 404/405를 먼저 이해해야 handler 선택 뒤 PathVariable/RequestParam conversion·binding 400을 정확히 구분할 수 있습니다.", sessionSlug: "mvc-02-requestmapping-http-method" }],
  keywords: ["@RequestParam", "@PathVariable", "data binding", "type conversion", "ConversionService", "Formatter", "WebDataBinder", "@InitBinder", "@ModelAttribute", "command object", "over-posting", "allowedFields", "BindingResult", "Bean Validation", "multi-value", "400", "404"], topics,
  lab: {
    title: "안전한 request binding pipeline과 4xx contract 구축",
    scenario: "검색 query, typed resource ID와 create/update form을 한 application에서 처리하며 unknown field, malformed 값, 큰 목록과 encoded path가 service/DB에 도달하지 않아야 합니다.",
    setup: ["원본 controller/config는 read-only로 보존하고 annotation/argument/infrastructure 구조만 inventory합니다.", "JDK exact models, converter/validator unit tests, MockMvc와 actual container corpus를 준비합니다.", "dedicated synthetic DTO와 allowed field/input budget 표를 작성합니다.", "raw path/query/form/body가 없는 binding phase/error telemetry를 준비합니다."],
    steps: ["input surface별 owner, presence/empty/default와 public field를 정의합니다.", "RequestParam missing/multi/default/overflow matrix를 실행합니다.", "PathPattern match→PathVariable conversion→range/auth/lookup을 분리합니다.", "enum/date/number/domain ID converter와 locale/zone을 고정합니다.", "operation-specific immutable command DTO와 explicit domain mapping을 만듭니다.", "unknown/disallowed/nested/indexed field를 over-posting corpus로 주입합니다.", "BindingResult와 field/global/domain validation status/code를 검증합니다.", "parameter count/length/depth/cardinality/number limits를 edge/container/binder에 적용합니다.", "invalid request의 service-called 0과 DB state unchanged를 확인합니다.", "old/new binding corpus, canary 4xx와 rollback config를 승인합니다."],
    expectedResult: ["input별 presence/default/type/range/field error table", "404 route와 400 conversion/binding/validation phase evidence", "multi-value order/duplicate/cardinality 결과", "over-posting rejected field와 server-owned state readback", "invalid case service/transaction 호출 0", "PII 없는 route/phase/error-count/latency telemetry"],
    cleanup: ["synthetic request/domain state를 삭제합니다.", "test server/executor를 종료하고 active request/connection absence를 확인합니다."],
    extensions: ["multipart와 request body binding을 별도 media contract로 확장합니다.", "custom domain ID converter와 tenant authorization을 qualification합니다.", "property-based/fuzz input budget test를 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "RequestParam과 PathVariable 정상·missing·malformed 표를 구현하세요.", requirements: ["absence와 empty를 구분합니다.", "default/Optional 정책을 정합니다.", "multi-value를 포함합니다.", "path no-match와 type mismatch를 분리합니다.", "숫자 range/overflow를 검사합니다.", "status/error code를 assertion합니다.", "invalid service 호출 0을 확인합니다."], hints: ["handler가 선택되지 않은 404와 선택 뒤 conversion 400은 다른 단계입니다."], expectedOutcome: "request value가 typed argument 또는 stable 4xx가 되는 과정이 재현됩니다.", solutionOutline: ["match→extract→default→convert→validate→service 순서입니다."] },
    { difficulty: "응용", prompt: "entity direct binding을 dedicated command와 allowlist로 전환하세요.", requirements: ["public input field를 inventory합니다.", "server-owned field를 제거합니다.", "constructor/property binding을 선택합니다.", "unknown field policy를 둡니다.", "nested/list growth limit를 둡니다.", "BindingResult와 domain validation을 연결합니다.", "role/owner/status over-posting을 주입합니다.", "final DB state 불변을 확인합니다."], hints: ["화면에 없는 field도 client가 직접 보낼 수 있습니다."], expectedOutcome: "mass assignment 없이 operation-specific input contract가 완성됩니다.", solutionOutline: ["surface audit→DTO→binder→validation→mapping→authorization→readback 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring MVC binding·validation governance를 작성하세요.", requirements: ["parameter/path/body surface policy를 둡니다.", "naming/required/default/multi-value 표준을 둡니다.", "converter/formatter locale/zone policy를 둡니다.", "dedicated DTO/allowed field를 요구합니다.", "web/domain/authorization validation 경계를 둡니다.", "input budget과 error schema/redaction을 둡니다.", "unit/MockMvc/container/fuzz corpus를 요구합니다.", "upgrade differential·canary·rollback을 포함합니다."], hints: ["편리한 자동 binding의 input surface와 실패 phase를 반드시 명시하세요."], expectedOutcome: "입력 추출부터 운영 장애·upgrade까지 일관된 binding 표준이 완성됩니다.", solutionOutline: ["surface→conversion→binding→validation→security→evidence→rollout 순서입니다."] },
  ],
  nextSessions: ["mvc-04-model-command-object"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["RequestController.java는 90-line 원본에서 RequestParam5, HttpServletRequest2와 mapping/public method 구조만 확인했으며 route/parameter literal과 source body는 복사하지 않았습니다.", "ResponseController.java는 75-line 원본에서 ModelAttribute2, Model/ModelAndView/RedirectAttributes 사용 구조만 확인했으며 attribute/view 값은 복사하지 않았습니다.", "servlet-context.xml은 annotation-driven, component scan과 view resolver 존재만 확인했으며 package/path attribute 값은 복사하지 않았습니다.", "로컬 source에서는 PathVariable, BindingResult, validation과 session annotation이 확인되지 않아 이를 근거로 주장하지 않고 Spring/Jakarta/IETF/JDK 공식 문서와 synthetic exact examples로 보완했습니다.", "JDK binder는 Spring PathPattern/WebDataBinder/ConversionService/Validator, Servlet parameter parsing과 security filter를 대체하지 않으므로 MockMvc와 target container corpus를 별도로 요구합니다."] },
});

export default session;
