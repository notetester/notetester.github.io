import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lineCount = code.split(/\r?\n/).length;
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${Math.min(10, lineCount)}`, explanation: "작은 interface contract와 구현, composition root 또는 test double을 정의합니다. 예제는 JDK 21만 사용하므로 전략 자체의 동작을 Spring context와 분리해 확인할 수 있습니다." },
      { lines: `${Math.min(11, lineCount)}-${Math.max(11, lineCount - 7)}`, explanation: "같은 client에서 구현 교체, deterministic ordering, 선택적 fallback 또는 concurrent invocation을 실행하고 contract가 유지되는지 검사합니다." },
      { lines: `${Math.max(1, lineCount - 6)}-${lineCount}`, explanation: "결과·호출 수·순서·failure category만 stdout에 출력합니다. 구현 객체의 임의 toString, 내부 주소와 환경별 값은 출력하지 않습니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "외부 Spring jar·network·DB·credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout을 문서와 한 글자씩 대조합니다.", "순수 Java 결과는 strategy contract의 최소 증거이며 실제 Spring 후보 탐색, qualifier, scope, proxy와 lifecycle은 지원 버전 context test로 별도 검증합니다."] },
    experiments: [
      { change: "새 구현을 하나 더 넣고 동일 입력·failure corpus를 실행하거나 strategy ordering의 동률을 만듭니다.", prediction: "interface가 구문 모양만 같고 의미 contract가 다르거나 tie-break가 없으면 client 결과가 구현·등록 순서에 따라 달라집니다.", result: "pre/postcondition, stable failure category, deterministic selector와 compatibility suite를 계약에 추가합니다." },
      { change: "singleton strategy에 mutable request state를 추가하고 병렬 호출하거나 primary를 permanent failure로 바꿉니다.", prediction: "요청 간 상태 누출 또는 허용하지 않은 fallback이 나타나며 단일 성공 테스트는 이를 발견하지 못합니다.", result: "immutable/stateless 구현, scope 검토, fault matrix와 concurrency test를 release gate에 둡니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "interface-as-behavioral-port",
    title: "인터페이스를 구현 목록이 아니라 행동 계약과 포트로 읽습니다",
    lead: "interface는 method signature만 공유하는 장치가 아니라 client가 의존할 안정된 의미, 입력 범위, 결과와 실패 분류를 이름 붙인 경계이며 이 계약이 있어야 구현 교체가 안전합니다.",
    explanations: [
      "원본 IBattery는 energy라는 한 method를 가진 interface이고 Car는 IBattery field를 생성자로 받습니다. 이 작은 구조는 자동차가 특정 배터리 class를 직접 만들지 않고 공급 능력이라는 추상화에 의존한다는 DI의 핵심을 보여 줍니다.",
      "signature가 같아도 구현 하나는 요청량을 반환하고 다른 하나는 남은 잔량을 반환한다면 대체 가능하지 않습니다. parameter 단위, 허용 범위, 반환 의미, null 정책, side effect, timeout과 failure category를 contract test로 고정해야 합니다.",
      "port는 application이 필요로 하는 언어로 작게 정의합니다. 외부 SDK의 거대한 interface를 그대로 domain에 노출하면 vendor type, retry와 lifecycle이 client 전역으로 새어 나가므로 adapter가 SDK를 port로 번역합니다.",
      "interface default method에 운영 정책을 계속 쌓으면 모든 구현이 암묵적으로 coupling됩니다. 안정된 최소 contract와 조합 가능한 decorator/policy를 분리하고 breaking semantic change는 새 version의 port로 다룹니다.",
      "초보자는 'interface를 만들면 결합도가 낮아진다'고 외우기 쉽지만 구현을 client 내부에서 new하면 composition coupling은 그대로입니다. object graph를 조립하는 바깥 경계가 구현을 선택해 constructor로 넘겨야 합니다.",
    ],
    concepts: [
      c("interface", "구현 class가 제공해야 할 operation signature와 client가 기대할 행동 의미를 선언하는 Java type입니다.", ["직접 생성 결합을 제거할 수 있습니다.", "의미 contract는 문서와 test로 보강합니다."]),
      c("port", "application core가 외부 capability를 자신의 언어로 요청하는 작은 안정 경계입니다.", ["adapter가 vendor 세부사항을 번역합니다.", "방향은 core에서 바깥을 향합니다."]),
      c("behavioral contract", "입력·출력·side effect·failure·동시성에 대해 모든 구현이 지켜야 하는 관찰 가능한 규칙입니다.", ["signature보다 넓습니다.", "공통 corpus로 검증합니다."]),
    ],
    codeExamples: [java("core04-two-strategies", "같은 계약 아래 두 배터리 전략 교체", "Core04TwoStrategies.java", "client 코드를 바꾸지 않고 두 구현을 constructor에 넣어 결과와 대체 지점을 확인합니다.", String.raw`public class Core04TwoStrategies {
  interface Battery { int supply(int requested); }
  static final class FixedBattery implements Battery {
    public int supply(int requested) { return Math.min(requested, 80); }
  }
  static final class EfficientBattery implements Battery {
    public int supply(int requested) { return requested - requested / 10; }
  }
  static final class Car {
    private final Battery battery;
    Car(Battery battery) { this.battery = java.util.Objects.requireNonNull(battery); }
    int charge(int requested) { return battery.supply(requested); }
  }
  public static void main(String[] args) {
    int fixed = new Car(new FixedBattery()).charge(100);
    int efficient = new Car(new EfficientBattery()).charge(100);
    System.out.println("fixed=" + fixed);
    System.out.println("efficient=" + efficient);
    System.out.println("same-contract=" + (fixed >= 0 && efficient >= 0));
    System.out.println("implementations=2");
  }
}`, "fixed=80\nefficient=90\nsame-contract=true\nimplementations=2", ["local-ibattery", "local-car", "spring-di", "spring-qualifier", "spring-primary", "spring-profile", "java-objects"])],
    diagnostics: [d("새 구현으로 교체하자 값의 단위나 실패 시점이 달라져 client 계산이 깨집니다.", "interface signature만 복사했고 모든 구현이 공유할 행동 계약과 compatibility corpus를 정의하지 않았습니다.", ["parameter/return 단위", "null·범위 precondition", "side effect와 idempotency", "exception/failure taxonomy"], "client 관점의 pre/postcondition과 공통 contract test를 정의하고 위반 구현을 adapter로 교정하거나 후보에서 제외합니다.", "모든 구현과 test double에 동일 contract suite를 실행하고 semantic change를 API version으로 관리합니다.")],
    expertNotes: ["interface 이름은 기술명보다 client가 원하는 capability를 표현해야 구현 변화가 domain vocabulary를 흔들지 않습니다.", "public interface로 만들기 전에 하나의 client와 실제 교체 축이 있는지 확인해 의미 없는 추상화 비용을 피합니다."],
  },
  {
    id: "substitution-and-contract-testing",
    title: "LSP를 공통 contract test와 실패 의미로 검증합니다",
    lead: "대체 가능성은 compile 성공이 아니라 어떤 허용 구현을 넣어도 client가 의존하는 불변식이 깨지지 않는다는 성질이며 정상 값뿐 아니라 빈 값, 경계, timeout과 실패에서도 확인해야 합니다.",
    explanations: [
      "Liskov substitution을 실무적으로 적용하면 구현은 interface의 precondition을 더 강하게 요구하거나 postcondition을 약하게 만들 수 없습니다. 예를 들어 contract가 0을 허용하는데 한 구현만 0에서 예외를 던지면 그 구현은 대체 가능하지 않습니다.",
      "공통 contract suite는 implementation factory를 parameter로 받고 동일한 normal/boundary/failure corpus를 실행합니다. 구현별 test는 내부 algorithm을 확인하지만 공통 suite는 client가 보는 behavior가 같은지를 확인합니다.",
      "checked/unchecked exception class만 맞추는 것으로 부족합니다. 재시도 가능 여부, 요청이 적용되었을 가능성, idempotency key 필요 여부와 개인정보 포함 여부를 stable failure category로 번역합니다.",
      "시간과 random, 외부 service를 사용하는 구현은 clock, random source와 transport port를 주입해 test를 deterministic하게 만듭니다. production implementation의 retry를 fake sleep으로 검증하지 말고 attempt sequence와 budget을 관찰합니다.",
      "contract가 너무 느슨하면 구현 차이를 client가 다시 instanceof와 분기로 처리합니다. 공통 최소 의미는 interface에 두고 정말 다른 capability는 capability-specific interface나 explicit policy로 분리합니다.",
    ],
    concepts: [
      c("substitutability", "허용된 구현을 교체해도 client가 기대하는 관찰 가능한 계약이 유지되는 성질입니다.", ["compile compatibility보다 강합니다.", "실패와 동시성도 포함합니다."]),
      c("contract test", "여러 구현에 같은 behavior corpus와 assertion을 반복 실행하는 재사용 가능한 test입니다.", ["구현 factory를 parameter화합니다.", "client-visible 결과를 검사합니다."]),
      c("failure taxonomy", "구현별 exception을 client가 처리할 안정된 category와 속성으로 번역한 분류입니다.", ["retry 가능성을 포함합니다.", "원인 문자열을 API로 삼지 않습니다."]),
    ],
    diagnostics: [d("mock test는 통과하지만 실제 구현 하나만 빈 입력·timeout·중복 호출에서 다른 결과를 냅니다.", "test double을 contract의 기준으로 삼고 production 구현 전체에 같은 corpus를 실행하지 않았습니다.", ["공통 contract suite 대상 목록", "boundary/failure fixtures", "mock default behavior", "implementation별 timeout/idempotency"], "client-visible contract corpus를 만들고 모든 production adapter와 fake에 parameterized하게 실행합니다.", "새 구현 등록 조건에 contract suite 통과와 failure taxonomy review를 포함합니다.")],
    expertNotes: ["실패 message text는 locale/version에 따라 달라질 수 있으므로 category와 structured attributes를 assertion합니다.", "성능도 contract 일부라면 고정 millisecond보다 budget·분포·부하 조건을 별도 performance test로 관리합니다."],
  },
  {
    id: "constructor-composition-root",
    title: "client는 constructor에만 의존하고 composition root가 구현을 선택합니다",
    lead: "Car처럼 required strategy를 constructor로 받으면 완전한 객체가 만들어지고 구현 선택은 @Configuration, @Bean 또는 자동 등록을 담당하는 composition root 한곳으로 이동합니다.",
    explanations: [
      "constructor parameter type이 interface이면 client source는 구현 class 이름을 몰라도 됩니다. 하지만 같은 module 안에서 implementation을 직접 new하거나 static factory가 숨겨 선택하면 test와 profile 교체가 다시 어려워집니다.",
      "composition root는 환경·설정·후보를 읽고 완성된 object graph를 조립하는 application edge입니다. domain/service는 Environment나 ApplicationContext를 조회하지 않고 이미 선택된 strategy 또는 명시 provider만 받습니다.",
      "필수 dependency에는 constructor injection을 기본으로 하고 optional behavior는 valid default 또는 provider로 모델링합니다. nullable field와 뒤늦은 setter로 interface strategy를 넣으면 이전 세션의 invalid state 비용이 되돌아옵니다.",
      "여러 constructor가 있거나 generated/proxy subclass가 있을 때 선택 규칙을 추측하지 않습니다. 지원 Spring version의 공식 @Autowired contract와 context test로 어떤 constructor가 사용됐는지 검증합니다.",
      "graph manifest에는 client logical id, port, selected implementation logical id, qualifier/profile, scope와 configuration generation을 기록하되 내부 credential과 원본 설정값은 기록하지 않습니다.",
    ],
    concepts: [
      c("composition root", "구현 선택과 object graph 조립을 application의 한 바깥 경계에 모은 위치입니다.", ["domain은 container를 조회하지 않습니다.", "환경별 차이가 드러납니다."]),
      c("constructor composition", "required port를 생성 시 전달해 생성 직후 invariant를 완성하는 조립 방식입니다.", ["null 중간 상태를 막습니다.", "test에서 직접 fake를 넣습니다."]),
      c("graph manifest", "runtime client→port→implementation·scope·selector edge를 값 없이 기록한 구조 evidence입니다.", ["drift를 비교합니다.", "secret을 제외합니다."]),
    ],
    diagnostics: [d("interface로 바꿨는데 test가 실제 구현의 network나 DB에 연결합니다.", "client 또는 static factory가 구현을 내부에서 직접 생성해 composition root가 구현 선택을 소유하지 못합니다.", ["new Concrete 검색", "static singleton/factory", "ApplicationContext lookup", "test constructor graph"], "구현 생성을 @Configuration/@Bean 또는 application factory로 이동하고 client에는 port constructor parameter만 남깁니다.", "architecture test로 core module의 adapter 생성·container lookup 의존을 금지합니다.")],
    expertNotes: ["composition root는 하나의 물리 파일일 필요는 없지만 graph 선택 책임은 application boundary에서 추적 가능해야 합니다.", "Spring 없이 client unit test를 실행할 수 있는지가 container 결합을 확인하는 좋은 신호입니다."],
  },
  {
    id: "spring-candidate-resolution",
    title: "여러 Spring 구현 후보를 이름 추측 없이 명시적으로 해소합니다",
    lead: "한 interface 구현 bean이 둘 이상이면 injection point의 cardinality가 달라지므로 @Primary, @Qualifier, profile, collection 또는 selector 중 의도를 표현하는 수단을 선택해야 합니다.",
    explanations: [
      "@Primary는 여러 후보 중 단일값 injection point의 우선 후보를 정하지만 모든 후보를 주입하는 collection에서 다른 bean을 제거하지 않습니다. default와 exclusive라는 서로 다른 의미를 혼동하지 않습니다.",
      "@Qualifier는 bean id 문자열의 우연한 일치보다 의미 있는 분류 annotation으로 만들 수 있습니다. region, protocol, workload처럼 안정된 축을 쓰고 class 이름·배포 slot을 domain code에 퍼뜨리지 않습니다.",
      "@Profile은 특정 Environment profile에서 bean definition을 등록하는 조건입니다. request마다 구현을 선택하는 도구가 아니며 잘못된 active profile이 배포 전체 graph를 바꾸므로 startup graph readback이 필요합니다.",
      "field 이름 fallback이나 parameter 이름 기반 해소는 refactor·compiler metadata에 민감할 수 있습니다. candidate ambiguity가 design signal이면 명시 qualifier, primary 또는 strategy registry로 의도를 나타냅니다.",
      "후보가 0, 1, 2개일 때의 context test를 모두 둡니다. 0개에서 fallback인지 startup failure인지, 2개에서 ambiguity인지 ordered collection인지 기대 결과를 먼저 적습니다.",
    ],
    concepts: [
      c("candidate resolution", "injection point type과 qualifier·primary·name·priority metadata로 대상 bean을 선택하는 과정입니다.", ["cardinality를 확인합니다.", "context startup에 검증합니다."]),
      c("@Primary", "단일값 autowiring에서 여러 후보 중 우선 사용할 bean을 표시하는 Spring annotation입니다.", ["collection 후보를 제거하지 않습니다.", "유일성을 뜻하지 않습니다."]),
      c("@Qualifier", "type 후보 집합을 의미 metadata로 더 좁히는 Spring annotation 또는 custom annotation입니다.", ["문자열 refactor를 관리합니다.", "injection point와 candidate를 맞춥니다."]),
    ],
    diagnostics: [d("구현 bean을 하나 추가하자 NoUniqueBeanDefinition 계열 startup 오류가 나거나 엉뚱한 구현이 선택됩니다.", "단일 injection point의 후보 cardinality와 primary/qualifier policy를 새 등록 전에 검증하지 않았습니다.", ["type별 bean names", "primary/qualifier metadata", "active profiles", "injection point type/name"], "하나의 명시 default 또는 semantic qualifier를 정하고 0/1/N 후보 context matrix를 실행합니다.", "CI graph manifest diff에서 interface별 candidate count와 selector 변화를 승인 대상으로 만듭니다.")],
    expertNotes: ["@Primary를 충돌을 잠시 숨기는 응급 조치로 연쇄 추가하지 말고 실제 선택 규칙을 한곳에 둡니다.", "profile 조합 수가 커지면 pairwise 조합과 production exact profile startup smoke를 함께 사용합니다."],
  },
  {
    id: "test-doubles-by-purpose",
    title: "fake·stub·spy·mock을 목적에 맞게 쓰고 계약을 대신하게 하지 않습니다",
    lead: "test double은 실제 collaborator를 가볍고 결정적으로 대체하지만 반환 고정, 상태 구현, 호출 관찰와 상호작용 기대라는 서로 다른 목적을 구분해야 test가 구현 세부사항에 묶이지 않습니다.",
    explanations: [
      "stub은 질문에 준비된 값을 답하고 fake는 단순하지만 작동하는 in-memory 구현을 제공합니다. spy는 실제 또는 fake 동작을 유지하면서 call sequence를 관찰하고 mock은 기대 interaction을 중심으로 검증합니다.",
      "상태 기반 결과가 핵심이면 fake를 우선하고 정확한 외부 command 횟수·순서가 계약이면 spy/mock을 제한적으로 사용합니다. 모든 private helper 호출을 verify하면 harmless refactor도 test를 깨뜨립니다.",
      "failure double은 timeout, transient, permanent, partial-apply와 malformed response를 각각 만들 수 있어야 합니다. 단순 `throw new RuntimeException` 하나는 retry와 보상 설계를 검증하기 부족합니다.",
      "double도 production interface contract를 지켜야 하므로 공통 contract suite 대상에 포함합니다. 반대로 fake만 제공하는 편의 behavior를 production contract로 착각하지 않도록 adapter integration test가 필요합니다.",
      "Spring context가 필요 없는 client test는 constructor에 fake/spy를 직접 넣습니다. qualifier/profile/wiring을 확인할 때만 작은 context slice를 사용해 빠른 behavior test와 graph test를 분리합니다.",
    ],
    concepts: [
      c("test double", "test에서 collaborator 역할을 대신하도록 제어 가능한 구현입니다.", ["목적에 따라 stub/fake/spy/mock으로 나눕니다.", "production contract를 지킵니다."]),
      c("fake", "in-memory store처럼 단순화했지만 실제 동작과 상태를 가진 test 구현입니다.", ["state-based test에 좋습니다.", "production nonfunctional behavior는 대체하지 않습니다."]),
      c("spy", "호출을 기록하면서 위임 또는 준비된 동작을 수행하는 관찰용 double입니다.", ["call count/input을 확인합니다.", "과도한 interaction assertion을 피합니다."]),
    ],
    codeExamples: [java("core04-spy-double", "결과를 유지하며 호출을 관찰하는 spy", "Core04SpyDouble.java", "대문자 변환 fake에 spy를 감싸 결과, 호출 수와 입력 총 길이를 deterministic하게 확인합니다.", String.raw`import java.util.Objects;

public class Core04SpyDouble {
  interface Route { String select(String input); }
  static final class UppercaseFake implements Route {
    public String select(String input) { return input.toUpperCase(java.util.Locale.ROOT); }
  }
  static final class RouteSpy implements Route {
    private final Route delegate;
    private int calls;
    private int totalInput;
    RouteSpy(Route delegate) { this.delegate = Objects.requireNonNull(delegate); }
    public String select(String input) {
      calls++;
      totalInput += input.length();
      return delegate.select(input);
    }
  }
  public static void main(String[] args) {
    RouteSpy spy = new RouteSpy(new UppercaseFake());
    String first = spy.select("east");
    String second = spy.select("west");
    System.out.println("first=" + first);
    System.out.println("second=" + second);
    System.out.println("calls=" + spy.calls);
    System.out.println("total-input=" + spy.totalInput);
    System.out.println("deterministic=" + (first.equals("EAST") && second.equals("WEST")));
  }
}`, "first=EAST\nsecond=WEST\ncalls=2\ntotal-input=8\ndeterministic=true", ["spring-testing", "spring-proxying", "java-objects"])],
    diagnostics: [d("구현을 refactor했을 뿐 결과는 같은데 수십 mock interaction test가 깨집니다.", "client contract가 아니라 private call order와 framework proxy 세부사항을 assertion했습니다.", ["결과/state assertions", "verify 대상의 business 의미", "proxy/self-invocation", "fake contract coverage"], "결과·상태 중심 fake로 옮기고 외부 command의 exactly-once처럼 실제 계약인 interaction만 spy로 검증합니다.", "test review에서 각 verify가 보호하는 user-visible invariant를 요구합니다.")],
    expertNotes: ["spy가 thread-safe하지 않으면 병렬 production behavior test에서 call count evidence 자체가 틀릴 수 있습니다.", "mock framework의 lenient default가 null/0을 돌려 실제 구현과 다른 경로를 만들 수 있으므로 explicit stubbing과 strict mode를 검토합니다."],
  },
  {
    id: "ordered-strategy-pipeline",
    title: "여러 전략을 List pipeline으로 조합하고 순서를 계약으로 만듭니다",
    lead: "전략을 하나 고르는 대신 validation, normalization, enrichment처럼 모두 실행할 때는 `List<Port>`가 자연스럽지만 순서·중복·중단·rollback 의미를 명시해야 합니다.",
    explanations: [
      "Spring은 동일 type의 bean collection을 주입할 수 있으며 Ordered/@Order metadata가 ordering에 관여할 수 있습니다. ordering이 business correctness라면 container 발견 순서를 믿지 말고 priority와 안정된 tie-break를 함께 검증합니다.",
      "pipeline stage는 input을 변환해 다음 stage에 넘기거나 immutable context에 result를 누적할 수 있습니다. stage 하나가 partial side effect 후 실패하면 앞 단계 결과를 보상할지 전체 transaction으로 묶을지 결정합니다.",
      "duplicate stage registration은 같은 validation의 반복일 수도 있지만 email 발송·차감 같은 command의 중복 실행일 수도 있습니다. logical stage id의 uniqueness를 startup에 검증하고 의도한 반복만 별도 instance id로 허용합니다.",
      "@Order 값은 순서 비교이지 모든 consumer의 semantic dependency를 설명하지 않습니다. A가 만든 데이터를 B가 요구한다면 input/output type 또는 pipeline graph validation으로 선행 조건을 드러냅니다.",
      "운영 telemetry에는 pipeline version, ordered logical ids, stage result category와 duration을 bounded label로 남깁니다. request payload와 구현 object string을 stage label로 사용하지 않습니다.",
    ],
    concepts: [
      c("strategy pipeline", "같은 또는 연속 contract의 여러 구현을 정해진 순서로 실행하는 합성입니다.", ["순서와 중단 정책이 계약입니다.", "부분 효과를 처리합니다."]),
      c("deterministic ordering", "같은 후보 집합이면 등록·탐색 환경과 무관하게 동일한 완전 순서를 만드는 규칙입니다.", ["priority와 tie-break를 둡니다.", "manifest로 확인합니다."]),
      c("stage identity", "pipeline 중복·순서·관측에 사용하는 안정된 logical id입니다.", ["class 이름과 분리합니다.", "startup에 uniqueness를 검증합니다."]),
    ],
    codeExamples: [java("core04-ordered-pipeline", "priority와 이름 tie-break가 있는 strategy pipeline", "Core04OrderedPipeline.java", "등록 순서와 다른 세 stage를 정렬해 항상 같은 결과를 만들고 source list의 불변성도 확인합니다.", String.raw`import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class Core04OrderedPipeline {
  record Stage(int order, String name, String suffix) {
    String apply(String input) { return input + suffix; }
  }
  public static void main(String[] args) {
    List<Stage> registered = List.of(
        new Stage(30, "enrich", "|enriched"),
        new Stage(10, "validate", "|valid"),
        new Stage(20, "normalize", "|normalized"));
    List<Stage> ordered = registered.stream()
        .sorted(Comparator.comparingInt(Stage::order).thenComparing(Stage::name))
        .toList();
    String result = "item";
    for (Stage stage : ordered) result = stage.apply(result);
    String names = ordered.stream().map(Stage::name).collect(Collectors.joining(","));
    boolean immutable;
    try { registered.add(new Stage(40, "late", "|late")); immutable = false; }
    catch (UnsupportedOperationException expected) { immutable = true; }
    System.out.println("order=" + names);
    System.out.println("result=" + result);
    System.out.println("stages=" + ordered.size());
    System.out.println("source-immutable=" + immutable);
  }
}`, "order=validate,normalize,enrich\nresult=item|valid|normalized|enriched\nstages=3\nsource-immutable=true", ["spring-order", "spring-ordered", "spring-autowired", "java-comparator", "java-list", "java-service-loader"])],
    diagnostics: [d("같은 build인데 stage 결과 순서가 test와 production에서 다르거나 새 bean 추가 후 결과가 바뀝니다.", "component scan/collection iteration order를 business order로 사용했고 priority 동률의 tie-break와 duplicate id 검증이 없습니다.", ["injected order manifest", "@Order/Ordered values", "동률 후보", "duplicate logical ids"], "명시 priority와 stable logical-id tie-break로 완전 순서를 만들고 중복·dependency를 startup validation합니다.", "후보 등록 순서를 shuffle한 property test와 graph manifest diff를 CI에 둡니다.")],
    expertNotes: ["Spring ordering metadata와 JDK 정렬 결과가 같은지 작은 context test로 readback해야 pure Java example을 framework 보장으로 과장하지 않습니다.", "병렬 pipeline은 순서 없는 최적화가 아니라 dependency·side effect·merge associativity를 증명한 별도 execution model입니다."],
  },
  {
    id: "runtime-selection-and-registry",
    title: "부팅 시 선택과 요청별 전략 선택을 분리합니다",
    lead: "profile이나 primary는 application graph를 부팅할 때 정하는 선택이고 tenant, command type처럼 요청마다 달라지는 선택은 immutable registry와 명시 selector가 담당해야 합니다.",
    explanations: [
      "request code가 ApplicationContext.getBean 문자열 조회를 수행하면 service locator가 되어 dependency 집합, missing key와 scope가 숨겨집니다. composition root에서 검증된 `Map<Key, Strategy>` 또는 selector object를 constructor로 넘깁니다.",
      "외부 입력을 bean 이름으로 바로 사용하지 않습니다. 허용된 domain enum/key로 parse하고 unknown key는 stable validation error 또는 명시 default policy로 처리해 임의 내부 bean 접근을 막습니다.",
      "ObjectProvider는 lazy·optional·ordered stream 접근을 제공하지만 매 요청마다 무제한 context 조회를 정당화하지 않습니다. prototype/scoped lifecycle과 정말 늦은 creation이 필요할 때 좁은 provider adapter로 감쌉니다.",
      "ServiceLoader 같은 JDK plugin discovery를 쓰면 provider configuration, class loader, ordering과 failure가 별도 contract입니다. discovered provider를 검증·snapshot하고 runtime 요청 경로에서 계속 재검색하지 않습니다.",
      "registry 교체는 새 immutable generation을 준비하고 모든 key·contract를 검증한 뒤 atomic publish합니다. 같은 request가 여러 번 lookup할 때 generation이 섞이지 않게 request 시작 시 snapshot을 잡습니다.",
    ],
    concepts: [
      c("strategy registry", "명시 key에서 검증된 strategy instance로 가는 immutable lookup table입니다.", ["허용 key를 제한합니다.", "composition root가 만듭니다."]),
      c("selector", "request context를 domain key로 변환하고 missing/default 정책을 적용하는 객체입니다.", ["container API를 숨깁니다.", "입력을 검증합니다."]),
      c("ObjectProvider", "Spring bean의 lazy·optional·iterable lookup을 위한 provider interface입니다.", ["scope lifecycle을 존중합니다.", "service locator 남용을 피합니다."]),
    ],
    diagnostics: [d("사용자 입력 문자열에 따라 getBean을 호출하다 unknown key, 잘못된 scope 또는 내부 bean 노출이 발생합니다.", "request-time 선택을 container 이름 lookup과 결합하고 허용 key·default·generation을 검증하지 않았습니다.", ["getBean call sites", "외부 입력→bean name 경로", "registry key set", "scoped bean ownership"], "허용 domain key를 parse해 immutable registry/selector로 조회하고 provider가 필요하면 lifecycle-aware 좁은 adapter를 둡니다.", "unknown/missing/duplicate key negative test와 generation-consistency test를 자동화합니다.")],
    expertNotes: ["registry key를 class simple name으로 만들면 rename이 API breaking change가 되므로 명시 stable key를 사용합니다.", "plugin discovery는 code execution boundary이므로 provider allowlist, signing/supply-chain 검증과 classloader cleanup도 운영 설계에 포함합니다."],
  },
  {
    id: "failure-fallback-idempotency",
    title: "fallback을 실패 은폐가 아닌 제한된 정책으로 설계합니다",
    lead: "primary strategy가 실패하면 아무 구현이나 다시 호출하는 방식은 중복 side effect와 데이터 불일치를 만들 수 있으므로 category, apply 상태, retry budget와 fallback 적합성을 먼저 확인합니다.",
    explanations: [
      "transient transport 실패와 permanent validation 실패를 구분합니다. permanent를 fallback으로 우회하면 같은 잘못된 요청을 다른 시스템에 보내거나 business rule을 회피할 수 있습니다.",
      "timeout은 primary가 적용되지 않았다는 증거가 아닙니다. command가 반영된 뒤 응답만 사라질 수 있으므로 idempotency key, status query 또는 reconciliation이 없으면 다른 strategy 재실행을 금지할 수 있습니다.",
      "fallback 결과가 primary와 같은 품질·일관성·security contract를 충족하는지 정의합니다. degraded result라면 response metadata와 metric에 표시하고 무기한 정상 성공으로 숨기지 않습니다.",
      "retry와 fallback budget은 하나의 end-to-end deadline 안에서 관리합니다. primary가 budget을 모두 소진한 뒤 fallback을 시작하면 timeout amplification과 thread exhaustion이 일어납니다.",
      "circuit breaker, bulkhead와 fallback은 서로 다른 정책입니다. decorator 순서가 retry-inside-breaker인지 반대인지에 따라 metric과 traffic이 달라지므로 구성 순서를 manifest와 fault test로 고정합니다.",
    ],
    concepts: [
      c("fallback", "명시된 실패 category에서만 대체 결과 또는 대체 strategy를 사용하는 degraded 정책입니다.", ["모든 예외를 잡지 않습니다.", "degraded 상태를 관측합니다."]),
      c("idempotency", "같은 logical command가 중복 전달되어도 추가 효과 없이 같은 최종 상태를 만드는 속성입니다.", ["key와 저장 범위가 필요할 수 있습니다.", "timeout ambiguity를 줄입니다."]),
      c("failure category", "transient·permanent·unknown-apply처럼 처리 정책과 연결된 안정된 실패 분류입니다.", ["message parsing을 피합니다.", "fallback 허용 여부를 결정합니다."]),
    ],
    codeExamples: [java("core04-controlled-fallback", "transient만 fallback하고 permanent는 전파", "Core04ControlledFallback.java", "두 failure category를 만들어 허용된 transient만 대체하고 permanent가 은폐되지 않음을 확인합니다.", String.raw`public class Core04ControlledFallback {
  enum Category { TRANSIENT, PERMANENT }
  static final class StrategyFailure extends RuntimeException {
    final Category category;
    StrategyFailure(Category category) { this.category = category; }
  }
  interface Strategy { String run(String input); }
  static final class CountingFallback implements Strategy {
    int calls;
    public String run(String input) { calls++; return "fallback:" + input; }
  }
  static String route(Strategy primary, Strategy fallback, String input) {
    try { return primary.run(input); }
    catch (StrategyFailure failure) {
      if (failure.category != Category.TRANSIENT) throw failure;
      return fallback.run(input);
    }
  }
  public static void main(String[] args) {
    int[] primaryCalls = {0};
    CountingFallback fallback = new CountingFallback();
    Strategy transientPrimary = input -> { primaryCalls[0]++; throw new StrategyFailure(Category.TRANSIENT); };
    String result = route(transientPrimary, fallback, "task");
    boolean permanentPropagated;
    try { route(input -> { throw new StrategyFailure(Category.PERMANENT); }, fallback, "task"); permanentPropagated = false; }
    catch (StrategyFailure expected) { permanentPropagated = expected.category == Category.PERMANENT; }
    System.out.println("result=" + result);
    System.out.println("primary-calls=" + primaryCalls[0]);
    System.out.println("fallback-calls=" + fallback.calls);
    System.out.println("permanent-propagated=" + permanentPropagated);
    System.out.println("category=TRANSIENT");
  }
}`, "result=fallback:task\nprimary-calls=1\nfallback-calls=1\npermanent-propagated=true\ncategory=TRANSIENT", ["spring-proxying", "spring-testing", "java-objects"])],
    diagnostics: [d("primary 장애 뒤 fallback에서도 command가 실행되어 중복 처리되거나 permanent 오류가 성공으로 보입니다.", "apply 여부가 불명확한 실패와 영구 실패까지 broad catch로 fallback했고 idempotency/reconciliation이 없습니다.", ["caught exception 범위", "failure category/apply state", "idempotency key store", "fallback metric/result metadata"], "허용 category와 remaining budget을 명시하고 unknown-apply는 status/reconciliation 후 처리하며 permanent는 전파합니다.", "partial-apply·timeout·permanent fault injection과 duplicate command test를 release gate에 둡니다.")],
    expertNotes: ["fallback의 성공률만 보면 primary 품질 저하가 숨겨지므로 primary/fallback/degraded 결과를 분리해 측정합니다.", "fallback이 개인정보를 다른 processor/region으로 보내면 기능 계약 외에 법적·보안 경계가 바뀌므로 별도 승인이 필요합니다."],
  },
  {
    id: "scope-thread-safety-lifecycle",
    title: "strategy의 scope·상태·thread safety와 lifecycle ownership을 함께 검토합니다",
    lead: "Spring singleton strategy는 여러 요청 thread가 같은 instance를 사용하므로 mutable request field, non-thread-safe client와 runtime 교체가 있으면 interface가 있어도 race와 resource leak가 발생합니다.",
    explanations: [
      "stateless strategy는 모든 request data를 method parameter와 local variable에 두고 immutable collaborators만 공유합니다. cache나 counter가 필요하면 thread-safe component로 분리하고 consistency와 cardinality를 정의합니다.",
      "prototype을 singleton에 직접 주입하면 injection 시 만들어진 하나의 instance가 계속 사용될 수 있습니다. 매번 새 instance가 정말 필요하면 ObjectProvider 같은 scoped lookup과 누가 close하는지를 명확히 합니다.",
      "전략이 connection pool, executor 또는 native resource를 소유하면 create/warmup/use/drain/close lifecycle을 composition root가 관리합니다. fallback/registry에서 reference를 제거했다고 old resource가 자동으로 닫히지 않습니다.",
      "runtime strategy swap은 AtomicReference field 하나만 바꾸는 것으로 끝나지 않습니다. 새 generation health 확인, request별 snapshot, in-flight reference count와 old close/rollback evidence가 필요합니다.",
      "concurrency test는 sleep timing이 아니라 latch/barrier와 많은 deterministic inputs를 사용해 lost update, mixed generation, close-during-use를 확인합니다. ThreadSanitizer 같은 도구가 없어도 invariant-based stress corpus를 반복할 수 있습니다.",
    ],
    concepts: [
      c("stateless strategy", "request 간 변경 가능한 instance state를 보유하지 않는 구현입니다.", ["singleton 공유가 단순합니다.", "collaborator thread safety는 별도입니다."]),
      c("scope mismatch", "consumer와 dependency의 생명주기 기대가 달라 실제 instance 생성·공유 방식이 의도와 어긋난 상태입니다.", ["prototype-in-singleton을 검토합니다.", "provider와 ownership을 명시합니다."]),
      c("resource ownership", "strategy가 만든 thread/client/resource의 start, drain, close 책임과 시점을 정한 계약입니다.", ["교체 시 old를 닫습니다.", "실패 생성도 cleanup합니다."]),
    ],
    codeExamples: [java("core04-stateless-concurrency", "불변 strategy의 병렬 호출", "Core04StatelessConcurrency.java", "한 immutable strategy를 여덟 task가 공유해 결과 개수·고유성·합계와 failure zero를 확인합니다.", String.raw`import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class Core04StatelessConcurrency {
  record Multiplier(int factor) { int apply(int value) { return value * factor; } }
  public static void main(String[] args) throws Exception {
    Multiplier strategy = new Multiplier(2);
    ExecutorService pool = Executors.newFixedThreadPool(4);
    List<Future<Integer>> futures = new ArrayList<>();
    int failures = 0;
    try {
      for (int value = 1; value <= 8; value++) {
        int input = value;
        futures.add(pool.submit(() -> strategy.apply(input)));
      }
      List<Integer> results = new ArrayList<>();
      for (Future<Integer> future : futures) results.add(future.get());
      int sum = results.stream().mapToInt(Integer::intValue).sum();
      int unique = new HashSet<>(results).size();
      System.out.println("tasks=" + results.size());
      System.out.println("unique=" + unique);
      System.out.println("sum=" + sum);
      System.out.println("failures=" + failures);
      System.out.println("strategy-immutable=true");
    } finally {
      pool.shutdown();
    }
  }
}`, "tasks=8\nunique=8\nsum=72\nfailures=0\nstrategy-immutable=true", ["spring-scopes", "spring-object-provider", "java-atomic-integer", "java-executor-service", "java-list"])],
    diagnostics: [d("병렬 부하에서 strategy 결과가 다른 사용자 값과 섞이거나 교체 중 closed client 오류가 납니다.", "singleton 구현에 mutable request state가 있고 generation snapshot/drain 없이 collaborator를 교체·close했습니다.", ["instance fields와 scope", "collaborator thread-safety", "generation capture 지점", "in-flight/close event order"], "request state를 local immutable data로 옮기고 새 generation atomic publish 후 old reference가 0일 때 close합니다.", "barrier 기반 병렬·swap·close stress test와 active-generation/resource metric을 둡니다.")],
    expertNotes: ["AtomicInteger counter가 thread-safe해도 여러 field의 compound invariant가 자동으로 원자화되지는 않습니다.", "virtual thread 사용 여부는 공유 strategy의 thread safety 요구를 없애지 않으며 오히려 concurrency cardinality를 늘릴 수 있습니다."],
  },
  {
    id: "migration-concrete-to-interface",
    title: "구체 class 의존을 interface와 adapter로 단계적으로 이동합니다",
    lead: "기존 client type을 한 번에 바꾸기보다 현재 behavior와 call sites를 inventory하고 port, concrete adapter, compatibility constructor와 canary를 순차 도입해야 정보와 rollback 경로가 보존됩니다.",
    explanations: [
      "먼저 concrete dependency가 client에 제공하는 실제 method, exception, lifecycle와 hidden behavior를 기록합니다. 사용하지 않는 거대한 API까지 새 interface에 복사하지 말고 client가 요구하는 최소 operation부터 정의합니다.",
      "기존 concrete class를 구현으로 직접 수정할 수 있으면 port를 implement하고, 외부/legacy class이면 adapter가 변환합니다. adapter는 parameter mapping, failure taxonomy, transaction와 close ownership을 한곳에 둡니다.",
      "compatibility constructor/factory는 old concrete를 받아 adapter로 감싸 새 primary constructor에 위임할 수 있습니다. deprecation telemetry와 call-site inventory로 old path 사용이 0인지 증명한 뒤 제거합니다.",
      "old/new graph를 같은 captured synthetic corpus에 shadow 실행해 결과·category·side effect intent를 비교합니다. 실제 command를 이중 실행하면 안 되는 경로는 record/replay 또는 dry-run adapter를 사용합니다.",
      "rollout은 implementation logical id와 graph generation을 표시하고 작은 traffic canary, error/latency/degraded diff, rollback 후 old resource cleanup을 확인합니다. 단순 bean 이름 변경을 rollback plan으로 착각하지 않습니다.",
    ],
    concepts: [
      c("adapter", "기존/외부 API를 application port의 parameter, result, failure와 lifecycle 의미로 번역하는 구현입니다.", ["vendor type을 격리합니다.", "translation test를 둡니다."]),
      c("compatibility path", "old caller를 유지하면서 내부적으로 새 port composition에 위임하는 임시 migration 경로입니다.", ["usage를 측정합니다.", "expiry를 정합니다."]),
      c("shadow comparison", "같은 입력에 대한 old/new 관찰 결과를 production effect 없이 비교하는 migration 검증입니다.", ["민감값을 제거합니다.", "semantic diff를 분류합니다."]),
    ],
    diagnostics: [d("interface migration 후 compile은 되지만 transaction, exception 또는 close 시점이 달라집니다.", "method shape만 adapter로 감싸고 concrete dependency의 hidden behavior와 lifecycle을 baseline하지 않았습니다.", ["old call-site/method inventory", "transaction/retry boundaries", "exception category mapping", "resource ownership"], "client-visible behavior corpus와 lifecycle event를 baseline하고 adapter contract test·shadow canary로 semantic diff를 해소합니다.", "compatibility usage-zero, behavior diff zero와 cleanup zero-leak를 제거 gate로 둡니다.")],
    expertNotes: ["interface 도입 자체를 성공 지표로 보지 말고 client change cost, test isolation과 implementation rollout risk가 실제로 줄었는지 측정합니다.", "temporary adapter가 모든 service를 조회하는 범용 service locator로 성장하지 않도록 port 하나의 translation 책임으로 제한합니다."],
  },
  {
    id: "strategy-operations-governance",
    title: "전략 등록·선택·교체를 운영 증거와 승인 규칙으로 관리합니다",
    lead: "구현 교체가 쉬워진 만큼 어떤 구현이 왜 선택됐고 같은 계약을 지키며 안전하게 폐기됐는지를 manifest, bounded telemetry, rollout gate와 incident runbook으로 추적해야 합니다.",
    explanations: [
      "build/startup 단계에 port별 후보 logical id, qualifier/primary/profile, order, scope, contract version과 selected/default 여부를 graph manifest로 만듭니다. classpath 우연과 scan order drift를 배포 전에 비교합니다.",
      "metric은 strategy logical id, outcome category, degraded 여부, latency bucket과 generation처럼 cardinality가 제한된 label을 사용합니다. input, tenant raw id, exception message와 object toString을 label로 쓰지 않습니다.",
      "새 구현의 release gate는 common contract, adapter integration, context candidate matrix, fault/retry/fallback, concurrency와 cleanup test입니다. compile과 happy path 하나는 대체 가능성 증거가 아닙니다.",
      "incident runbook은 wrong selection, no/ambiguous candidate, semantic violation, partial apply, fallback storm, mixed generation과 leaked resource를 구분합니다. 먼저 graph/selection evidence를 고정하고 무작정 primary를 바꾸지 않습니다.",
      "deprecated implementation 제거 전 stored configuration, profile, plugin registry와 rollback artifact에서 reference가 0인지 확인합니다. 제거 후 다시 등장하지 않도록 allowlist와 architecture rule을 갱신합니다.",
    ],
    concepts: [
      c("strategy manifest", "port별 후보·selector·order·scope·contract version·generation을 기록한 배포 evidence입니다.", ["값과 credential을 제외합니다.", "old/new graph를 비교합니다."]),
      c("bounded telemetry", "logical id와 stable category처럼 cardinality가 제한되고 민감하지 않은 전략 관측 정보입니다.", ["raw input을 금지합니다.", "fallback을 분리합니다."]),
      c("implementation rollout", "새 구현을 contract/fault/context 검증하고 canary·관측·rollback·cleanup하는 교체 과정입니다.", ["graph generation을 기록합니다.", "old resource를 폐기합니다."]),
    ],
    diagnostics: [d("장애 시 어느 구현과 qualifier/profile이 사용됐는지 모르고 rollback 뒤 old/new resource가 함께 남습니다.", "strategy graph manifest, generation-tagged telemetry와 lifecycle cleanup gate가 없습니다.", ["deployed graph manifest", "selected logical id/generation", "fallback/degraded metrics", "active resources after rollback"], "선택 evidence를 배포 artifact로 만들고 generation별 canary·rollback·drain/close 결과를 기록합니다.", "release checklist에 graph diff 승인, contract/fault corpus와 post-rollback zero-leak를 포함합니다.")],
    expertNotes: ["implementation class name은 refactor 세부사항일 수 있으므로 metric/API에는 안정된 logical id와 contract version을 사용합니다.", "전략 수가 늘어날수록 선택 가능성보다 중복 capability와 ownership을 주기적으로 정리하는 catalog governance가 중요합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-ibattery", repository: "SPRING/SpringDI", path: "src/main/java/ex04/quiz/IBattery.java", usedFor: ["single energy-method interface progression"], evidence: "read-only scanner로 interface 선언과 한 method만 확인했습니다." },
  { id: "local-car", repository: "SPRING/SpringDI", path: "src/main/java/ex04/quiz/Car.java", usedFor: ["single IBattery field and constructor injection progression"], evidence: "read-only scanner로 한 interface field, one-argument constructor와 getter structure만 확인했습니다." },
  { id: "spring-di", repository: "Spring Framework Reference", path: "Dependency Injection", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html", usedFor: ["constructor composition and interface dependency"], evidence: "Spring 공식 dependency injection reference입니다." },
  { id: "spring-autowired", repository: "Spring Framework Reference", path: "Using @Autowired", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html", usedFor: ["constructor and collection candidate injection"], evidence: "Spring 공식 autowiring reference입니다." },
  { id: "spring-qualifier", repository: "Spring Framework Javadoc", path: "Qualifier", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/annotation/Qualifier.html", usedFor: ["semantic candidate narrowing"], evidence: "Spring 공식 Qualifier API입니다." },
  { id: "spring-primary", repository: "Spring Framework Javadoc", path: "Primary", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Primary.html", usedFor: ["single-valued candidate preference"], evidence: "Spring 공식 Primary API입니다." },
  { id: "spring-profile", repository: "Spring Framework Javadoc", path: "Profile", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Profile.html", usedFor: ["boot-time profile selection"], evidence: "Spring 공식 Profile API입니다." },
  { id: "spring-scopes", repository: "Spring Framework Reference", path: "Bean Scopes", publicUrl: "https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html", usedFor: ["singleton/prototype strategy lifecycle"], evidence: "Spring 공식 bean scopes reference입니다." },
  { id: "spring-order", repository: "Spring Framework Javadoc", path: "Order", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/annotation/Order.html", usedFor: ["declarative collection ordering"], evidence: "Spring 공식 Order API입니다." },
  { id: "spring-ordered", repository: "Spring Framework Javadoc", path: "Ordered", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/Ordered.html", usedFor: ["programmatic priority contract"], evidence: "Spring 공식 Ordered API입니다." },
  { id: "spring-object-provider", repository: "Spring Framework Javadoc", path: "ObjectProvider", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/ObjectProvider.html", usedFor: ["lazy, optional and scoped lookup boundary"], evidence: "Spring 공식 ObjectProvider API입니다." },
  { id: "spring-testing", repository: "Spring Framework Reference", path: "Testing", publicUrl: "https://docs.spring.io/spring-framework/reference/testing.html", usedFor: ["context and integration contract tests"], evidence: "Spring 공식 testing reference입니다." },
  { id: "spring-proxying", repository: "Spring Framework Reference", path: "Proxying Mechanisms", publicUrl: "https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", usedFor: ["strategy proxy and self-invocation boundary"], evidence: "Spring 공식 AOP proxy reference입니다." },
  { id: "java-objects", repository: "Java SE 21 API", path: "Objects", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html", usedFor: ["required collaborator null guard"], evidence: "Oracle JDK 공식 Objects API입니다." },
  { id: "java-comparator", repository: "Java SE 21 API", path: "Comparator", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html", usedFor: ["stable order and tie-break"], evidence: "Oracle JDK 공식 Comparator API입니다." },
  { id: "java-list", repository: "Java SE 21 API", path: "List", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html", usedFor: ["ordered immutable strategy collections"], evidence: "Oracle JDK 공식 List API입니다." },
  { id: "java-service-loader", repository: "Java SE 21 API", path: "ServiceLoader", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ServiceLoader.html", usedFor: ["plugin provider discovery comparison"], evidence: "Oracle JDK 공식 ServiceLoader API입니다." },
  { id: "java-atomic-integer", repository: "Java SE 21 API", path: "AtomicInteger", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html", usedFor: ["thread-safe observation counter boundary"], evidence: "Oracle JDK 공식 AtomicInteger API입니다." },
  { id: "java-executor-service", repository: "Java SE 21 API", path: "ExecutorService", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html", usedFor: ["concurrent strategy invocation example"], evidence: "Oracle JDK 공식 ExecutorService API입니다." },
];

const session = createExpertSession({
  inventoryId: "spring-core-04-interface-strategy", slug: "spring-core-04-interface-strategy", courseId: "spring", moduleId: "spring-ioc-di-aop", order: 4,
  title: "인터페이스로 구현 교체와 테스트 대역 만들기", subtitle: "IBattery와 Car에서 출발해 행동 계약, 후보 해소, 전략 pipeline, test double, fallback, 동시성과 무중단 구현 migration까지 검증합니다.", level: "전문가", estimatedMinutes: 980,
  coreQuestion: "interface 하나를 추가하는 데서 멈추지 않고 모든 구현이 같은 행동 계약을 지키며 Spring이 올바른 후보를 선택하고 test·failure·concurrency·운영 교체까지 안전하게 만들려면 무엇을 검증해야 할까요?",
  summary: "원본 IBattery의 단일 method interface와 Car의 한 interface field·constructor 구조를 read-only로 확인했습니다. 여기서 interface/port의 행동 계약과 LSP contract test, constructor composition root, @Primary·@Qualifier·profile 후보 해소, fake·stub·spy·mock, ordered collection pipeline, request-time immutable registry, 실패 category·idempotency·fallback, singleton thread safety와 resource lifecycle, concrete-to-interface migration 및 운영 governance로 확장합니다. 다섯 JDK 21 source-file examples는 구현 교체, spy double, deterministic pipeline, transient-only fallback과 stateless concurrent invocation을 exact stdout으로 검증합니다.",
  objectives: ["interface signature와 client-visible 행동 계약을 구분한다.", "모든 구현과 test double에 공통 contract corpus를 실행한다.", "constructor composition root에서 구현 선택을 격리한다.", "Primary·Qualifier·Profile·collection 후보 해소 의미를 구분한다.", "fake·stub·spy·mock을 목적에 맞게 선택한다.", "ordered pipeline과 request-time registry를 deterministic하게 구성한다.", "failure category·idempotency·budget으로 fallback을 제한한다.", "singleton strategy의 scope·thread safety·lifecycle ownership을 검증한다.", "concrete dependency를 adapter·compatibility·canary로 migration한다.", "graph manifest와 bounded telemetry로 구현 교체를 운영한다."],
  prerequisites: [{ title: "setter 주입과 선택 의존성의 비용", reason: "필수 dependency를 constructor에 두고 진짜 optional/default와 runtime reconfiguration을 구분해야 interface strategy의 lifecycle을 안전하게 설계할 수 있습니다.", sessionSlug: "spring-core-03-setter-injection" }],
  keywords: ["interface", "strategy", "loose coupling", "test double", "contract test", "LSP", "composition root", "Qualifier", "Primary", "ordered pipeline", "fallback", "idempotency", "thread safety", "adapter migration"], topics,
  lab: {
    title: "IBattery/Car 예제를 production-grade strategy architecture로 확장",
    scenario: "하나의 Car client가 여러 battery 구현, test double과 장애 fallback을 사용하며 부팅 profile과 요청 조건에 따라 구현을 선택하고 신규 구현을 무중단 도입해야 합니다.",
    setup: ["원본 두 Java file을 변경하지 않고 hash, interface method와 constructor edge만 기록합니다.", "JDK 21 examples와 작은 지원 Spring version context fixture를 준비합니다.", "battery port의 input/output 단위, pre/postcondition, failure, idempotency와 concurrency contract를 작성합니다.", "후보 logical id, qualifier/profile/order/scope/generation을 값 없이 기록할 manifest schema를 준비합니다."],
    steps: ["concrete call sites와 hidden behavior/lifecycle을 inventory합니다.", "client 언어의 최소 port와 공통 contract corpus를 정의합니다.", "production adapter, fake, spy와 category별 failure double을 구현합니다.", "composition root에서 constructor graph를 만들고 0/1/N candidate context matrix를 실행합니다.", "여러 구현 pipeline의 priority, tie-break, duplicate와 stage dependency를 검증합니다.", "request-time 선택은 allowlisted key와 immutable registry snapshot으로 구현합니다.", "transient/permanent/unknown-apply와 budget별 retry/fallback test를 실행합니다.", "singleton 병렬 호출, generation swap과 old resource drain/close를 stress test합니다.", "old/new adapter를 shadow corpus와 canary로 비교하고 rollback을 연습합니다.", "legacy concrete usage zero와 post-rollback resource zero를 확인한 뒤 compatibility path를 제거합니다."],
    expectedResult: ["client source 변경 없이 두 구현과 fake를 교체하고 공통 contract가 유지됩니다.", "다섯 Java example stdout이 문서와 완전히 일치합니다.", "후보 0/1/N, order, unknown key와 failure category가 예상대로 처리됩니다.", "병렬·swap·fallback에서 중복 효과, mixed generation과 resource leak가 없습니다.", "manifest에 선택 근거가 있고 input·credential·object string이 노출되지 않습니다."],
    cleanup: ["ephemeral contexts, fake registry, captures와 test reports를 run id로 제거합니다.", "executor, provider-created instances와 old strategy resources를 drain/close합니다.", "active old generation, thread와 resource count가 0인지 확인합니다.", "원본 IBattery.java와 Car.java는 변경하지 않습니다."],
    extensions: ["custom qualifier annotation과 compile-time architecture rule을 추가합니다.", "ServiceLoader plugin을 allowlist·contract suite·classloader cleanup과 결합합니다.", "reference-counted atomic registry rollout을 구현합니다.", "contract corpus를 consumer-driven adapter compatibility artifact로 배포합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 구현 교체·spy·order·fallback·concurrency 계약을 표로 정리하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "두 구현이 같은 client에서 실행됨을 설명합니다.", "spy 결과와 호출 관찰을 분리합니다.", "pipeline priority와 tie-break를 설명합니다.", "permanent failure가 fallback되지 않음을 확인합니다.", "병렬 결과의 count·unique·sum을 확인합니다."], hints: ["interface는 signature보다 client가 관찰하는 규칙이 핵심입니다."], expectedOutcome: "strategy의 정상·경계·실패·동시성 behavior를 실행 evidence로 설명합니다.", solutionOutline: ["contract→compose→select→observe→fail→concur 순서로 대조합니다."] },
    { difficulty: "응용", prompt: "Car를 여러 production battery와 test double이 있는 Spring graph로 확장하세요.", requirements: ["최소 port와 common contract suite를 둡니다.", "constructor composition을 사용합니다.", "0/1/N candidate context test를 실행합니다.", "semantic qualifier/default를 정의합니다.", "ordered collection/registry를 deterministic하게 만듭니다.", "category별 failure double과 idempotency를 검증합니다.", "scope/thread safety/cleanup을 확인합니다.", "secret-free graph manifest와 rollback을 포함합니다."], hints: ["부팅 선택과 요청별 선택을 같은 mechanism으로 처리하지 마세요."], expectedOutcome: "구현이 늘어나도 선택·test·실패·lifecycle이 명시적인 strategy graph가 완성됩니다.", solutionOutline: ["inventory→contract→adapter→wire→fault→stress→observe 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 interface strategy 및 구현 rollout 표준을 작성하세요.", requirements: ["interface/port 승인 기준을 정의합니다.", "behavior/failure/concurrency contract를 요구합니다.", "fake/spy/mock 사용 원칙을 둡니다.", "Primary/Qualifier/Profile/collection 정책을 둡니다.", "registry key와 plugin security를 검토합니다.", "fallback/idempotency/budget rule을 둡니다.", "scope/lifecycle/resource ownership을 정의합니다.", "manifest, canary, rollback, compatibility removal gate를 포함합니다."], hints: ["구현 개수보다 교체 시 유지돼야 하는 client 불변식을 먼저 적으세요."], expectedOutcome: "추상화 생성부터 구현 폐기까지 재사용 가능한 strategy governance가 완성됩니다.", solutionOutline: ["define→verify→select→operate→migrate→retire 순서입니다."] },
  ],
  nextSessions: ["spring-core-05-collection-injection"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["IBattery.java는 interface와 한 energy-style method만 확인했으며 method의 production 의미·단위·failure contract는 원본에 충분히 표현되지 않습니다.", "Car.java는 한 IBattery field, one-argument constructor와 getter structure만 확인했으며 Spring annotation, 후보 해소와 runtime selection은 포함하지 않습니다.", "원본은 contract test, test-double taxonomy, pipeline order, qualifier/profile, fallback/idempotency, concurrency, resource lifecycle와 migration rollout을 포함하지 않아 공식 Spring/JDK 문서와 synthetic examples로 보완했습니다.", "JDK examples는 Spring candidate resolver, AOP proxy, scope와 lifecycle을 재현하지 않으므로 지원 version context matrix를 별도 실행해야 합니다."] },
});

export default session;
