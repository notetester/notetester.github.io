import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id,
    title,
    language: "java",
    filename,
    purpose,
    code,
    walkthrough: [
      { lines: "1-12", explanation: "JDK 21 records·collections만으로 starter graph, conditional back-off, package scan, archive layer 또는 startup state를 재현합니다." },
      { lines: "13-끝에서 5줄 전", explanation: "입력을 정렬·분류하고 불변식을 계산합니다. 실제 Spring Boot jar를 흉내 내는 것이 아니라 자동 구성의 의사결정 구조를 관찰 가능하게 만듭니다." },
      { lines: "마지막 5줄", explanation: "선택된 feature·condition·package·layer·availability를 결정적 stdout으로 출력해 설명과 실행 결과를 한 글자씩 대조합니다." },
    ],
    run: {
      environment: ["JDK 21 이상", "Java source-file mode", "Spring·Gradle·network·DB·credential 불필요"],
      command: `java ${filename}`,
    },
    output: {
      value: output,
      explanation: ["stdout은 문서의 예상 결과와 완전히 같아야 합니다.", "이 작은 model은 실제 condition evaluation report, dependency graph, bootJar와 target runtime 검증을 대체하지 않습니다."],
    },
    experiments: [
      { change: "starter·classpath·user bean·root package·artifact version 또는 startup failure를 하나씩 바꿉니다.", prediction: "같은 코드라도 match/back-off, scan 대상, archive layer 또는 readiness가 달라집니다.", result: "변경 전후 stdout과 실제 Boot의 dependencies·conditions·beans·archive evidence를 비교합니다." },
      { change: "동일 개념을 원본 프로젝트의 Gradle Wrapper와 disposable profile에서 실행합니다.", prediction: "실제 transitive dependency·auto-configuration·embedded server·configuration binding이 추가됩니다.", result: "dependency report, condition report, tests, archive listing과 health/readiness를 함께 보존합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "source-baseline-secret-boundary",
    title: "원본 세 파일을 버전·의존성·설정·비밀 경계로 먼저 감사합니다",
    lead: "Spring Boot 프로젝트를 이해할 때 main 메서드 한 줄만 보지 않고 build.gradle, application class, external configuration을 하나의 실행 계약으로 읽어야 재현성과 보안을 동시에 설명할 수 있습니다.",
    explanations: [
      "원본 build.gradle은 Spring Boot 4.0.6 plugin, dependency-management plugin, Java 21 toolchain, Web MVC·JDBC·MyBatis·Security starters와 runtime/test/annotation processor 구성을 선언합니다. 이 세션은 좌표와 구조를 학습 근거로 사용하지만 최신 호환성은 공식 문서와 실제 dependency report로 다시 확인합니다.",
      "원본 application class는 최상위 project package에 있고 @SpringBootApplication 뒤 SpringApplication.run을 호출합니다. 짧은 코드는 많은 동작을 숨기므로 annotation expansion, component scan root, application context 생성, auto-configuration candidate 평가를 이후 절에서 분해합니다.",
      "원본 YAML에는 DB 연결과 JWT 관련 평문 값이 있습니다. 공개 학습자료에는 host·username·password·secret의 실제 값을 복사하지 않았고, 구조적 위험만 기록합니다. 이미 version control에 들어간 비밀은 파일에서 지우는 것만으로 끝나지 않으며 rotation, history/CI artifact 검사와 접근 로그 검토가 필요합니다.",
      "source snapshot과 current recommendation을 구분합니다. 원본이 성공적으로 실행됐다는 사실은 현재 지원 조합, 안전한 기본값, production readiness를 자동 증명하지 않습니다. source hash·line count는 무엇을 읽었는지 고정하고 공식 문서는 의미와 업그레이드 경계를 보강합니다.",
      "학습 재현은 원본 개발 DB에 접속하지 않습니다. disposable profile, synthetic credentials, 격리된 port와 mock/fake dependency를 사용하고, 실습 종료 뒤 process·temp files·generated reports를 제거합니다.",
    ],
    concepts: [
      c("execution baseline", "source, build tool, JDK, dependency graph, configuration inputs와 expected artifact를 함께 고정한 재현 기준입니다.", ["파일 버전만으로 충분하지 않습니다.", "환경과 외부 서비스 경계를 포함합니다."]),
      c("secret boundary", "소스·로그·artifact에 들어가면 안 되는 credential을 injection, rotation, access control과 redaction으로 관리하는 경계입니다.", ["placeholder도 실제 secret과 분리합니다.", "유출 가능성이 있으면 즉시 폐기·교체합니다."]),
      c("source provenance", "어떤 원본 파일의 어느 구조를 학습 내용으로 사용했는지 hash와 근거로 추적하는 정보입니다.", ["값 복사를 뜻하지 않습니다.", "현재 공식 자료와 구분합니다."]),
    ],
    codeExamples: [java("boot01-feature-graph", "starter를 기능과 전이 모듈 graph로 펼치기", "Boot01Graph.java", "starter가 한 jar가 아니라 지원되는 dependency 묶음이라는 점을 작은 graph와 정렬된 결과로 확인합니다.", String.raw`import java.util.*;

public class Boot01Graph {
  static final Map<String, List<String>> GRAPH = Map.of(
      "jdbc", List.of("boot", "jdbc", "pool"),
      "security", List.of("boot", "security", "logging"),
      "webmvc", List.of("boot", "mvc", "json", "server"));
  static SortedSet<String> resolve(List<String> starters) {
    var modules = new TreeSet<String>();
    starters.forEach(name -> modules.addAll(GRAPH.getOrDefault(name, List.of())));
    return modules;
  }
  public static void main(String[] args) {
    var starters = List.of("webmvc", "jdbc", "security");
    System.out.println("starters=" + starters);
    System.out.println("modules=" + resolve(starters));
    System.out.println("featureCount=" + resolve(starters).size());
  }
}`, "starters=[webmvc, jdbc, security]\nmodules=[boot, jdbc, json, logging, mvc, pool, security, server]\nfeatureCount=8", ["local-build-gradle", "boot-build-systems", "boot-auto-config"] )],
    diagnostics: [
      d("원본을 공개한 뒤 credential scanner가 YAML의 DB/JWT 값을 탐지합니다.", "환경별 비밀을 application.yaml에 직접 저장하고 source와 configuration을 같은 수명으로 관리했습니다.", ["현재와 과거 Git objects를 값 자체를 출력하지 않고 scanner로 검사합니다.", "CI logs·build archives·backup forks 노출 범위를 확인합니다.", "credential 사용 이력과 접근 권한을 봅니다."], "해당 credential을 먼저 revoke/rotate하고 secret manager 또는 승인된 environment injection으로 옮긴 뒤 history 정리는 별도 검토·백업·협업 절차로 수행합니다.", "pre-commit/CI secret scanning, sample config와 real config 분리, short-lived credentials와 정기 rotation을 운영합니다."),
      d("다른 개발자 PC에서 같은 commit이 시작되지 않습니다.", "JDK·Gradle·resolved dependencies·profile·external services 중 하나 이상이 baseline에 고정되지 않았습니다.", ["java -version과 ./gradlew --version을 기록합니다.", "dependency graph/lock과 active profiles를 비교합니다.", "required ports·DB·environment keys를 safe inventory로 확인합니다."], "Wrapper와 toolchain, dependency policy, disposable profile과 explicit preflight를 repository에 둡니다.", "CI가 clean checkout에서 test→bootJar→smoke를 실행하고 provenance manifest를 artifact와 함께 보존합니다."),
    ],
    expertNotes: ["실제 credential 문자열은 교육적 가치가 없고 공개 피해만 만듭니다. 구조와 remediation만 남깁니다.", "hash는 읽은 snapshot을 식별하지만 내용의 안전성·정확성·라이선스를 보증하지 않습니다."],
  },
  {
    id: "gradle-plugin-wrapper-toolchain",
    title: "Gradle plugin, Wrapper와 Java toolchain의 서로 다른 책임을 분리합니다",
    lead: "plugin version은 Boot task와 dependency integration을 추가하고, Wrapper는 Gradle 실행기 버전을, toolchain은 compile/test에 사용할 Java를 통제합니다.",
    explanations: [
      "java plugin은 source sets, compile/test/jar lifecycle을 만들고 Spring Boot plugin은 bootRun, bootJar와 executable archive 지원을 결합합니다. dependency-management plugin 또는 Gradle platform 사용 방식은 선택할 수 있지만, 두 체계가 어떤 version constraint를 적용하는지 한 방식으로 문서화합니다.",
      "Gradle Wrapper의 gradlew/gradlew.bat, wrapper properties와 wrapper jar는 local Gradle 설치 차이를 줄입니다. distribution URL과 SHA-256 검증을 review하고 wrapper upgrade는 generated files 전체를 함께 갱신해 clean CI에서 검증합니다.",
      "Java toolchain languageVersion=21은 Gradle daemon JVM과 반드시 같지 않습니다. compile/test task가 선택한 compiler/runtime, target deployment runtime과 bytecode compatibility를 각각 출력해 확인합니다.",
      "Boot plugin마다 지원하는 Gradle 범위가 있으므로 무작정 최신 Wrapper로 올리지 않습니다. source의 Boot 4.0.6 조합은 그 버전의 system requirements와 release notes를 기준으로 검증하고, current docs의 숫자를 과거 버전에 역적용하지 않습니다.",
      "configuration cache/build cache는 속도 기능이지 정확성 면제 장치가 아닙니다. environment·timestamp·network처럼 선언되지 않은 task input은 재현성을 깨뜨리므로 cache hit/miss보다 task inputs/outputs를 먼저 바로잡습니다.",
    ],
    concepts: [
      c("Gradle plugin", "Gradle model에 task, convention, configuration과 dependency integration을 추가하는 versioned 확장입니다.", ["application dependency와 별도 해석 단계가 있습니다.", "plugin portal/repository 신뢰 경계를 가집니다."]),
      c("Gradle Wrapper", "repository가 선언한 Gradle distribution으로 build를 시작하게 하는 scripts와 metadata 묶음입니다.", ["wrapper jar와 distribution 무결성을 검증합니다.", "JDK 선택을 대신하지 않습니다."]),
      c("Java toolchain", "compile/test/javadoc 같은 task가 사용할 Java installation 요구를 선언하는 Gradle 기능입니다.", ["daemon JVM과 구분합니다.", "target runtime matrix를 별도로 시험합니다."]),
    ],
    diagnostics: [
      d("./gradlew build가 Unsupported class file 또는 plugin 적용 오류로 중단됩니다.", "Boot plugin, Gradle Wrapper, daemon JDK와 toolchain JDK의 지원 matrix가 어긋났습니다.", ["./gradlew --version에서 Gradle·launcher JVM·daemon JVM을 봅니다.", "build.gradle plugin/toolchain과 wrapper properties를 확인합니다.", "해당 Boot 버전 system requirements를 대조합니다."], "지원되는 조합을 선택하고 Wrapper/toolchain을 원자적으로 갱신한 뒤 clean build를 실행합니다.", "Renovate/Dependabot 제안도 compatibility matrix CI를 통과해야 merge하도록 합니다."),
      d("개발 PC에서는 성공하지만 CI에서 다른 bytecode나 test 결과가 나옵니다.", "local installed JDK를 우연히 사용하고 toolchain download/resolution 또는 locale/timezone이 통제되지 않았습니다.", ["compileJava/test의 javaLauncher와 compiler metadata를 출력합니다.", "artifact의 class major version을 검사합니다.", "CI image, locale, timezone과 file encoding을 비교합니다."], "toolchain과 CI runtime을 명시하고 locale/timezone-sensitive tests를 explicit input으로 만듭니다.", "지원 JDK matrix와 artifact bytecode acceptance를 CI gate로 유지합니다."),
    ],
    expertNotes: ["Wrapper checksum은 Gradle distribution tampering을 줄이지만 Maven artifacts와 plugins 검증은 별도 dependency verification이 필요합니다.", "toolchain auto-download를 허용하면 resolver와 repository trust도 supply-chain inventory에 포함합니다."],
  },
  {
    id: "starter-bom-configurations",
    title: "starter, BOM과 Gradle configuration을 dependency graph의 서로 다른 축으로 읽습니다",
    lead: "starter는 기능별 의존성 묶음, BOM은 호환 version constraints, implementation/runtimeOnly/testImplementation은 classpath와 배포 범위를 결정합니다.",
    explanations: [
      "starter를 추가하면 Spring modules, logging, JSON, embedded server 같은 transitive dependencies가 들어올 수 있습니다. 기능 이름만 보고 믿지 말고 ./gradlew dependencies와 dependencyInsight로 requested→selected version, constraint, conflict resolution과 제외 항목을 확인합니다.",
      "Spring Boot가 관리하는 dependency는 대개 개별 version을 쓰지 않아도 됩니다. 관리 목록 밖의 MyBatis starter나 JWT library처럼 explicit version을 쓰는 항목은 Boot compatibility와 보안 업데이트 수명을 별도로 소유해야 합니다.",
      "implementation은 main compile/runtime에, runtimeOnly는 compile API가 아니지만 실행에, compileOnly와 annotationProcessor는 생성/compile 단계에, testImplementation은 test에만 필요합니다. devtools의 developmentOnly처럼 production archive에서 제외되는지 bootJar listing으로 확인합니다.",
      "BOM은 자동으로 dependency를 추가하지 않고 version constraints를 제공합니다. starter는 편의 dependency이지 모든 feature를 켜는 스위치가 아니며 실제 auto-configuration은 classpath, properties, beans, web application type 등 conditions까지 평가합니다.",
      "중복 test starters와 넓은 starter는 build time·attack surface·auto-config 후보를 늘릴 수 있습니다. dependency를 최소화하되 수동 jar 조합으로 supported set을 깨지 말고 feature/test 요구와 owner를 graph로 관리합니다.",
    ],
    concepts: [
      c("starter", "특정 기능에 필요한 supported dependency set을 편리하게 가져오는 opinionated dependency descriptor입니다.", ["실행 코드를 직접 많이 담지 않을 수 있습니다.", "transitive graph를 검토해야 합니다."]),
      c("BOM", "관련 artifact version들의 호환 constraints를 모은 Bill of Materials입니다.", ["dependency 존재가 아니라 version 선택을 돕습니다.", "override는 검증 책임을 증가시킵니다."]),
      c("dependency configuration", "dependency가 어느 compile/runtime/test/processor classpath와 artifact에 참여하는지 정하는 Gradle scope입니다.", ["visibility와 packaging에 영향 줍니다.", "최소 범위를 선택합니다."]),
    ],
    diagnostics: [
      d("ClassNotFoundException이 runtime에서만 발생합니다.", "필요 library를 compileOnly/annotationProcessor에만 두었거나 exclusion과 version conflict로 runtimeClasspath에서 빠졌습니다.", ["runtimeClasspath dependencies를 출력합니다.", "dependencyInsight로 selected/excluded 이유를 찾습니다.", "bootJar BOOT-INF/lib를 확인합니다."], "API 사용 목적에 맞는 configuration으로 옮기고 supported starter/BOM graph를 복원합니다.", "compile smoke뿐 아니라 packaged jar를 별도 process에서 실행하는 test를 둡니다."),
      d("하위 library를 올린 뒤 NoSuchMethodError가 납니다.", "Boot BOM이 검증한 family 중 일부만 강제 override해 binary-compatible하지 않은 조합을 만들었습니다.", ["requested/selected dependency versions를 모두 기록합니다.", "Boot dependency versions와 library compatibility 문서를 확인합니다.", "duplicate classes와 runtime class origin을 봅니다."], "가능하면 Boot release 단위로 정렬하고 필수 override는 최소 범위와 regression suite로 관리합니다.", "version catalog/lock, dependency convergence와 upgrade canary를 운영합니다."),
    ],
    expertNotes: ["dependency locking은 선택된 version을 재현하지만 그 version이 취약하지 않다는 보증은 아닙니다.", "dependency verification은 artifact 무결성/provenance를 돕지만 dependency의 안전한 동작을 검증하지 않습니다."],
  },
  {
    id: "springapplication-context-lifecycle",
    title: "main에서 SpringApplication과 ApplicationContext lifecycle을 단계별로 펼칩니다",
    lead: "SpringApplication.run은 환경 준비, application type 결정, context 생성·refresh, runner 실행과 ready/failure events를 조정하며 반환된 context가 bean lifecycle의 owner가 됩니다.",
    explanations: [
      "public static void main은 JVM entry point이고 SpringApplication.run에 primary source와 args를 전달합니다. primary source는 component scan과 auto-configuration package의 기준이 되므로 application class의 package 위치가 architecture 결정입니다.",
      "Boot는 classpath로 servlet/reactive/non-web application type을 추론하지만 필요하면 명시할 수 있습니다. servlet starter가 의도치 않게 들어오면 embedded server가 시작될 수 있으므로 dependency graph와 WebApplicationType evidence를 같이 봅니다.",
      "context refresh 중 bean creation, configuration binding, server startup이나 database initialization이 실패하면 ready가 아닙니다. port가 열렸다는 단일 신호보다 ApplicationReadyEvent와 health/readiness, 실제 smoke request를 분리합니다.",
      "CommandLineRunner/ApplicationRunner는 context 시작 뒤 실행되며 긴 blocking 작업이나 실패가 readiness와 shutdown에 영향을 줍니다. migration, cache warmup, message listener 시작의 owner·timeout·idempotency를 설계합니다.",
      "graceful shutdown은 process signal, readiness 거부, in-flight drain, bean destroy와 resource close 순서를 다룹니다. IDE stop과 kill -9만으로 정상 cleanup을 검증했다고 말하지 않습니다.",
    ],
    concepts: [
      c("primary source", "SpringApplication이 configuration과 package 탐색의 출발점으로 사용하는 application class입니다.", ["보통 @SpringBootApplication class입니다.", "root package 배치가 중요합니다."]),
      c("ApplicationContext", "bean definitions를 생성·연결·lifecycle 관리하고 application events와 resources를 제공하는 Spring container입니다.", ["run의 반환값입니다.", "close가 lifecycle 종료를 소유합니다."]),
      c("readiness", "새 traffic을 안전하게 처리할 준비가 되었는지를 나타내는 application availability 상태입니다.", ["liveness와 목적이 다릅니다.", "외부 dependency 정책을 신중히 둡니다."]),
    ],
    codeExamples: [java("boot01-startup-state", "startup event와 readiness 전이를 상태 기계로 검증", "Boot01Startup.java", "context refresh가 끝나기 전에는 ready가 아니며 failure가 ready를 건너뛴다는 lifecycle 불변식을 출력합니다.", String.raw`import java.util.*;

public class Boot01Startup {
  static List<String> start(boolean failDuringRefresh) {
    var events = new ArrayList<String>();
    events.add("starting");
    events.add("environment-prepared");
    events.add("context-prepared");
    if (failDuringRefresh) {
      events.add("failed");
      return events;
    }
    events.add("started");
    events.add("ready");
    return events;
  }
  public static void main(String[] args) {
    var success = start(false);
    var failure = start(true);
    System.out.println("success=" + success);
    System.out.println("failure=" + failure);
    System.out.println("successReady=" + success.contains("ready"));
    System.out.println("failureReady=" + failure.contains("ready"));
  }
}`, "success=[starting, environment-prepared, context-prepared, started, ready]\nfailure=[starting, environment-prepared, context-prepared, failed]\nsuccessReady=true\nfailureReady=false", ["local-main-class", "boot-spring-application", "boot-availability"] )],
    diagnostics: [
      d("process는 살아 있지만 traffic을 받으면 즉시 실패합니다.", "process existence 또는 socket open을 readiness로 간주해 runner, binding, DB migration이나 dependency warmup 완료를 확인하지 않았습니다.", ["startup events와 failure stack root를 봅니다.", "readiness state와 health components를 분리합니다.", "representative smoke request를 보냅니다."], "ready 전 traffic을 차단하고 critical initialization을 bounded·observable하게 완료한 뒤 readiness를 수락합니다.", "deployment가 readiness gate와 timeout/rollback을 사용하고 cold-start fault tests를 실행합니다."),
      d("종료 배포 때 요청이 끊기고 connection이 남습니다.", "readiness withdrawal, server drain, executor/connection pool과 context close 순서가 통제되지 않았습니다.", ["shutdown signal과 lifecycle event timestamps를 봅니다.", "in-flight count와 grace period를 확인합니다.", "destroy callbacks/resource leaks를 검사합니다."], "traffic 제거→bounded drain→context/resource close 순서를 platform과 Boot 설정에 맞춥니다.", "graceful shutdown acceptance와 forced termination fallback을 정기 rehearsal합니다."),
    ],
    expertNotes: ["liveness에 모든 외부 dependency를 넣으면 dependency 장애 때 restart storm이 생길 수 있습니다.", "startup event listener는 너무 이른 단계에서 bean을 요구하거나 blocking I/O를 하지 않도록 event별 capability를 구분합니다."],
  },
  {
    id: "springbootapplication-package-scan",
    title: "@SpringBootApplication의 세 역할과 package scan 경계를 해체합니다",
    lead: "@SpringBootApplication은 configuration, component scanning, auto-configuration opt-in을 결합하며 application class 아래 package가 기본 탐색 경계가 됩니다.",
    explanations: [
      "annotation을 마법으로 외우지 말고 @SpringBootConfiguration, @EnableAutoConfiguration, @ComponentScan 역할을 분리합니다. 각각 user bean definitions, condition 기반 infrastructure, project component discovery를 담당합니다.",
      "application class를 너무 깊은 feature package에 두면 sibling controller/service가 scan되지 않습니다. default package에 두면 모든 jar를 광범위하게 읽을 수 있어 피하고, 조직 root package에 두거나 scan boundary를 의도적으로 명시합니다.",
      "component scan과 JPA entity/repository, MyBatis mapper scan은 동일하지 않을 수 있습니다. 각 subsystem이 어떤 annotation/package를 기준으로 찾는지 Boot auto-configuration package와 explicit configuration을 구분합니다.",
      "넓은 scan은 이름 충돌, 예상치 못한 test configuration과 startup cost를 만들 수 있습니다. packages는 architecture API이며 module test로 included/excluded beans를 검증합니다.",
      "scan failure를 @ComponentScan(\"모든 것\")로 덮지 않습니다. package 선언, source set, dependency direction과 application root를 먼저 고치고 explicit scan은 boundary가 불가피할 때 이유와 owner를 남깁니다.",
    ],
    concepts: [
      c("component scan", "지정 base package 아래 stereotype/configuration classes를 bean candidates로 찾는 과정입니다.", ["classpath 전체와 같지 않습니다.", "package 구조가 결과를 결정합니다."]),
      c("auto-configuration package", "@EnableAutoConfiguration이 결정해 entity/repository 같은 여러 Boot 기능의 기본 탐색 기준으로 쓰는 package입니다.", ["component scan과 관련 있지만 동일 API가 아닙니다.", "추가 package는 명시할 수 있습니다."]),
      c("backing package architecture", "package 포함 관계를 discovery와 dependency boundary로 사용하는 project 구조입니다.", ["application class를 root에 둡니다.", "feature modules의 공개 경계를 test합니다."]),
    ],
    codeExamples: [java("boot01-package-scan", "root package 포함 규칙을 실행 결과로 확인", "Boot01Scan.java", "application class의 root package 아래 type만 기본 scan 후보가 된다는 package prefix 규칙을 재현합니다.", String.raw`import java.util.*;

public class Boot01Scan {
  static List<String> included(String root, List<String> types) {
    return types.stream()
        .filter(type -> type.startsWith(root + "."))
        .sorted()
        .toList();
  }
  public static void main(String[] args) {
    var types = List.of(
        "com.study.shared.ClockConfig",
        "com.study.myproject01.board.BoardController",
        "com.study.myproject01.MyProject01Application",
        "com.study.myproject01.user.UserService");
    var result = included("com.study.myproject01", types);
    System.out.println("included=" + result);
    System.out.println("excludedCount=" + (types.size() - result.size()));
  }
}`, "included=[com.study.myproject01.MyProject01Application, com.study.myproject01.board.BoardController, com.study.myproject01.user.UserService]\nexcludedCount=1", ["local-main-class", "boot-structuring", "boot-auto-config"] )],
    diagnostics: [
      d("Controller에 annotation이 있는데 mapping이 등록되지 않습니다.", "application root 밖에 class가 있거나 source set/dependency에 포함되지 않아 component scan candidate가 아닙니다.", ["class의 package와 application class package를 비교합니다.", "compiled classes/runtimeClasspath 존재를 확인합니다.", "conditions/beans/mappings report에서 등록 여부를 봅니다."], "application root 아래로 구조를 정리하거나 최소한의 explicit scan/import로 boundary를 선언합니다.", "architecture tests가 feature packages와 expected beans/mappings를 검증합니다."),
      d("test에서만 원치 않는 configuration bean이 로드됩니다.", "test helper/configuration이 scan 가능한 package와 source set에 들어가 production context candidate가 됐습니다.", ["bean definition resource와 declaring class를 확인합니다.", "main/test source sets와 package를 봅니다.", "slice/full context 차이를 비교합니다."], "test configuration을 test source set과 명시적 import 경계로 이동합니다.", "context runner 또는 application context test가 금지 bean 부재를 검증합니다."),
    ],
    expertNotes: ["package rename은 단순 cosmetic change가 아니라 bean discovery behavior change일 수 있습니다.", "large codebase는 feature package, explicit module API와 Spring Modulith 같은 검증 도구를 고려하되 scan을 module isolation으로 오해하지 않습니다."],
  },
  {
    id: "conditional-auto-configuration-backoff",
    title: "자동 구성을 classpath·property·bean·application type condition과 back-off로 설명합니다",
    lead: "Boot는 모든 설정을 무조건 만드는 것이 아니라 후보 configuration의 conditions를 평가하고 사용자가 제공한 bean이 있으면 많은 기본 구성이 물러나도록 설계됩니다.",
    explanations: [
      "@ConditionalOnClass는 기술 library 존재, @ConditionalOnMissingBean은 user override 부재, property/resource/web application conditions는 환경과 실행 형태를 평가합니다. 하나만 match해도 되는 것이 아니라 해당 configuration의 모든 필요한 conditions를 봅니다.",
      "starter 추가→classpath 변화→새 auto-configuration 후보→bean graph 변화의 연쇄를 추적합니다. 그래서 dependency 추가는 compile 편의가 아니라 runtime architecture change로 review해야 합니다.",
      "back-off는 user bean이 이름·type·generic·search strategy 조건에 실제로 잡힐 때 일어납니다. 비슷한 bean을 만들었다고 자동으로 대체되지 않으며 conditions report의 matched/not matched message가 근거입니다.",
      "auto-configuration exclusion은 최후의 명시적 선택입니다. 왜 match했고 어떤 bean을 대체할지 이해하지 않고 exclude하면 연관 infrastructure와 tests가 조용히 사라질 수 있습니다.",
      "conditions는 startup snapshot입니다. profile/property/classpath가 다른 CI와 production에서 결과가 달라질 수 있으므로 sanitized condition report 또는 expected bean contract를 환경별로 검사합니다.",
    ],
    concepts: [
      c("conditional auto-configuration", "classpath, bean, property, resource와 application type 조건이 맞을 때만 default infrastructure bean을 제공하는 Boot 구성 방식입니다.", ["candidate와 match를 구분합니다.", "조건 report로 설명합니다."]),
      c("back-off", "사용자가 명시한 bean이나 설정이 있을 때 auto-configuration이 중복 기본 bean 생성을 포기하는 규칙입니다.", ["type/name/search condition을 확인합니다.", "override와 exclusion은 다릅니다."]),
      c("condition evaluation report", "각 auto-configuration이 match/not-match한 조건과 이유를 startup에서 기록한 진단 자료입니다.", ["민감 설정 값은 노출하지 않습니다.", "배포별 diff에 유용합니다."]),
    ],
    codeExamples: [java("boot01-conditions", "classpath와 user bean에 따른 match/back-off 모델", "Boot01Conditions.java", "동일 starter라도 classpath와 user bean 유무에 따라 자동 구성 결과가 달라지는 조건표를 실행합니다.", String.raw`public class Boot01Conditions {
  record Environment(boolean servletApi, boolean jdbcApi, boolean userDataSource) {}
  static String web(Environment env) {
    return env.servletApi() ? "match" : "no-match";
  }
  static String dataSource(Environment env) {
    if (!env.jdbcApi()) return "no-match";
    return env.userDataSource() ? "back-off" : "auto-configure";
  }
  public static void main(String[] args) {
    var defaultEnv = new Environment(true, true, false);
    var customEnv = new Environment(true, true, true);
    var cliEnv = new Environment(false, false, false);
    System.out.println("default=web:" + web(defaultEnv) + ",data:" + dataSource(defaultEnv));
    System.out.println("custom=web:" + web(customEnv) + ",data:" + dataSource(customEnv));
    System.out.println("cli=web:" + web(cliEnv) + ",data:" + dataSource(cliEnv));
  }
}`, "default=web:match,data:auto-configure\ncustom=web:match,data:back-off\ncli=web:no-match,data:no-match", ["boot-auto-config", "boot-custom-auto-config", "boot-actuator-endpoints"] )],
    diagnostics: [
      d("기대한 DataSource bean 대신 다른 pool/configuration이 생성됩니다.", "classpath·property·user bean conditions 중 실제 match 결과를 추측했고 multiple candidates 또는 type mismatch를 놓쳤습니다.", ["conditions report에서 관련 auto-config class를 찾습니다.", "beans report에서 type/name/resource를 봅니다.", "runtimeClasspath와 effective properties를 안전하게 확인합니다."], "원하는 user bean과 qualifier/primary 또는 supported property를 명시하고 불필요 dependency를 제거합니다.", "ApplicationContextRunner/integration test가 expected bean graph와 back-off를 고정합니다."),
      d("exclude 적용 뒤 startup은 되지만 transaction/test support가 사라집니다.", "문제의 한 bean만이 아니라 auto-configuration 전체를 제외해 연관 infrastructure도 제거했습니다.", ["exclude 전후 conditions/beans diff를 봅니다.", "auto-config javadoc/source와 dependent beans를 확인합니다.", "transaction/health/test behavior를 실행합니다."], "세밀한 user bean override나 property customization으로 교체하고 exclusion은 영향 범위를 문서화합니다.", "upgrade마다 excluded class와 replacement contract를 재검증합니다."),
    ],
    expertNotes: ["auto-configuration implementation internals는 public extension API가 아닐 수 있으므로 nested classes를 직접 호출하지 않습니다.", "conditions endpoint는 강력한 진단 자료이므로 production HTTP 노출을 기본 허용하지 않고 authorization·sanitization을 적용합니다."],
  },
  {
    id: "external-configuration-bootstrap",
    title: "자동 구성 입력인 external configuration을 code와 분리하되 검증·타입·비밀 정책을 둡니다",
    lead: "application.yaml은 bean graph를 바꾸는 executable input이므로 형식만 맞는다고 안전하지 않으며 source precedence, binding, validation과 secret injection을 함께 관리합니다.",
    explanations: [
      "Boot는 properties/YAML, environment variables, system properties와 command-line arguments 등 여러 property sources를 결합합니다. 우선순위를 암기하기보다 실제 Environment/actuator env의 origin을 안전하게 확인하고 배포 플랫폼의 injection 규칙을 문서화합니다.",
      "@ConfigurationProperties는 related keys를 typed object로 묶고 validation과 metadata를 제공할 수 있습니다. @Value가 나쁘다는 단순 규칙 대신 규모, type conversion, validation, reuse와 testability를 기준으로 선택합니다.",
      "비밀은 source tree에 default로 두지 않습니다. local developer도 committed password 대신 secret store, environment injection 또는 ignored local config를 사용하고 sample file에는 무효 placeholder와 required keys만 둡니다.",
      "unknown/misspelled keys와 duration 단위를 조용히 허용하면 설정이 적용됐다고 착각합니다. configuration metadata, binding tests, startup validation과 config lint로 fail-fast 범위를 정합니다.",
      "Boot02에서 profiles와 precedence를 더 깊게 다루지만, 여기서는 configuration이 auto-config conditions와 bean properties를 바꾸므로 build artifact와 동일하게 release evidence에 포함한다는 점을 고정합니다.",
    ],
    concepts: [
      c("property source", "Environment에 key/value와 origin을 제공하는 ordered configuration source입니다.", ["later/higher precedence가 override할 수 있습니다.", "origin과 value 노출 정책을 분리합니다."]),
      c("configuration binding", "external keys를 typed object graph로 변환하고 validation하는 과정입니다.", ["duration/data size 같은 type을 사용합니다.", "startup failure policy를 둡니다."]),
      c("effective configuration", "모든 sources와 precedence가 적용된 뒤 runtime이 실제 사용하는 sanitized 설정 결과입니다.", ["source file 한 장과 다를 수 있습니다.", "비밀 값 자체는 출력하지 않습니다."]),
    ],
    diagnostics: [
      d("YAML을 수정했는데 auto-configuration 결과가 바뀌지 않습니다.", "더 높은 precedence source가 override하거나 key/profile/indentation이 잘못되어 binding되지 않았습니다.", ["effective property origin을 safe endpoint/test에서 확인합니다.", "active profile과 config import를 봅니다.", "binding/validation logs에서 key를 확인합니다."], "중복 source를 제거하고 typed configuration과 validation으로 expected value/origin을 고정합니다.", "environment별 configuration contract test와 unknown-key review를 둡니다."),
      d("진단을 위해 env endpoint를 열었다가 credential metadata가 노출됩니다.", "운영 진단 편의를 위해 sensitive actuator endpoint를 인증·노출·sanitization 설계 없이 공개했습니다.", ["management endpoint exposure와 network policy를 확인합니다.", "response cache/log/monitor 복제 범위를 조사합니다.", "노출 가능 credential을 rotate합니다."], "endpoint를 차단하거나 최소 권한 관리망에서만 사용하고 value sanitization과 access audit를 적용합니다.", "production exposure allowlist와 automated external scan을 운영합니다."),
    ],
    expertNotes: ["environment variable도 process inspection, crash dump와 CI log에 노출될 수 있어 secret manager 사용만으로 모든 위험이 사라지지 않습니다.", "configuration change는 binary 재배포 없이도 architecture를 바꿀 수 있으므로 승인·audit·rollback 대상입니다."],
  },
  {
    id: "feature-classpath-test-scope",
    title: "Web MVC·JDBC·Security·MyBatis와 test starter가 만드는 classpath 효과를 기능별로 검증합니다",
    lead: "원본의 여러 starter는 controller, datasource, mapper, filter chain과 test infrastructure 후보를 동시에 추가하므로 단일 startup 성공보다 기능별 contract가 필요합니다.",
    explanations: [
      "Web MVC starter는 servlet web application과 JSON/HTTP infrastructure를, JDBC starter는 DataSource와 transaction-related infrastructure를, Security starter는 filter chain과 authentication defaults를 가져올 수 있습니다. 각 feature는 classpath만이 아니라 properties와 user beans에 의해 최종 결정됩니다.",
      "MyBatis Spring Boot starter는 제3자 ecosystem artifact이므로 Boot major/Jakarta namespace 호환성과 mapper scan/configuration을 공식 MyBatis 문서 및 integration tests로 확인합니다. Boot BOM이 모든 외부 starter version을 자동 관리한다고 가정하지 않습니다.",
      "security starter를 추가하면 endpoint behavior가 달라질 수 있습니다. compile만 통과하고 401/403/CSRF/CORS가 바뀌는 regression을 놓치지 않도록 public/authenticated role별 HTTP contract를 실행합니다.",
      "testImplementation starter들은 production archive에 들어가면 안 됩니다. test slice와 full context는 서로 다른 bean graph를 제공하므로 빠른 slice가 실제 embedded server, security, DB migration과 serialization 계약을 모두 대신하지 않습니다.",
      "annotation processors는 compile-time metadata/code generation에 참여합니다. Lombok/configuration processor의 생성 결과와 IDE build/Gradle build 차이를 줄이고 generated sources를 source of truth로 오해하지 않습니다.",
    ],
    concepts: [
      c("classpath feature", "특정 library 존재가 auto-configuration 후보와 runtime capability를 바꾸는 기능 경계입니다.", ["dependency 추가가 behavior change입니다.", "conditions와 tests로 확인합니다."]),
      c("test scope", "test compile/runtime에서만 사용할 libraries와 auto-configuration support의 dependency 범위입니다.", ["production archive와 분리합니다.", "slice별 bean graph를 이해합니다."]),
      c("annotation processor", "compile 단계에서 metadata나 source를 생성하는 도구입니다.", ["runtime dependency와 다릅니다.", "incremental build와 IDE parity를 검증합니다."]),
    ],
    diagnostics: [
      d("Security starter 추가 뒤 모든 기존 API test가 401/403으로 실패합니다.", "default security auto-configuration이 filter chain을 만들었지만 endpoint별 authentication/authorization/CSRF 계약을 정의하지 않았습니다.", ["registered SecurityFilterChain과 order를 봅니다.", "anonymous/authenticated/role/CSRF request matrix를 실행합니다.", "conditions report로 default/custom back-off를 확인합니다."], "명시적 최소 권한 filter chain과 method/object authorization을 설계하고 tests를 갱신합니다.", "dependency PR가 HTTP security contract suite와 negative tests를 통과해야 합니다."),
      d("IDE에서는 Lombok/config metadata가 보이지만 CI compile이 실패합니다.", "IDE plugin/generated cache와 Gradle annotationProcessor configuration이 불일치합니다.", ["clean ./gradlew compileJava를 실행합니다.", "annotationProcessor dependency와 generated sources를 봅니다.", "JDK/processor compatibility를 확인합니다."], "Gradle build를 canonical하게 만들고 compileOnly/annotationProcessor를 정확히 선언합니다.", "clean CI와 IDE import documentation, processor upgrade matrix를 유지합니다."),
    ],
    expertNotes: ["starter를 제거한 뒤에도 transitive dependency가 다른 path로 남을 수 있으므로 dependencyInsight로 완전 제거를 확인합니다.", "test starter가 많다고 coverage가 생기지 않으며 failure-path와 packaged-artifact tests를 설계해야 합니다."],
  },
  {
    id: "bootjar-layers-reproducibility",
    title: "bootJar를 실행 가능한 archive·dependency provenance·container layer 단위로 검증합니다",
    lead: "Boot Gradle plugin은 application classes와 nested dependencies를 포함한 executable archive를 만들며 build 성공뿐 아니라 contents, launch, digest와 layer 안정성을 확인해야 합니다.",
    explanations: [
      "bootJar는 java -jar로 실행 가능한 archive를 만들고 main class를 탐색하거나 명시 설정합니다. plain jar와 executable jar의 목적·classifier를 혼동하면 배포 플랫폼이 잘못된 artifact를 실행할 수 있습니다.",
      "BOOT-INF/classes에는 application classes/resources, BOOT-INF/lib에는 dependencies가 들어갑니다. archive listing으로 devtools/test-only/secret file이 없는지, runtime driver가 있는지와 duplicate resources를 확인합니다.",
      "layered archive는 변화가 적은 dependencies와 자주 바뀌는 application을 분리해 container cache를 활용합니다. cache 효율을 위해 dependency와 application 경계를 거꾸로 배치하지 않고 layer metadata를 실행 evidence로 봅니다.",
      "reproducible build는 같은 source/input이 같은 bytes/digest로 수렴하는 목표입니다. timestamps, generated build info, filesystem order와 environment-dependent resources를 통제하고 SBOM/provenance/signature는 생성 artifact digest에 연결합니다.",
      "jar가 시작된다는 것과 서비스가 올바르다는 것은 다릅니다. clean environment에서 java -jar→readiness→representative request→graceful stop을 실행하고 동일 digest만 promotion합니다.",
    ],
    concepts: [
      c("executable archive", "application classes와 nested runtime dependencies, Boot loader metadata를 묶어 java -jar로 시작할 수 있는 artifact입니다.", ["plain jar와 구조가 다릅니다.", "launch smoke가 필요합니다."]),
      c("layered jar", "container image cache를 위해 archive contents를 변화 빈도별 layers로 기술한 executable jar입니다.", ["layer metadata가 포함됩니다.", "correctness보다 build/pull 효율을 돕습니다."]),
      c("artifact provenance", "artifact digest가 source revision, builder, dependency inputs와 tests에 어떻게 연결되는지 증명하는 metadata입니다.", ["동일 digest promotion을 돕습니다.", "서명 검증 정책이 필요합니다."]),
    ],
    codeExamples: [java("boot01-archive-layers", "artifact를 기본 Boot layer 정책으로 분류", "Boot01Layers.java", "release dependency, loader, snapshot dependency와 application을 결정적 layer 순서로 나눕니다.", String.raw`import java.util.*;

public class Boot01Layers {
  record Artifact(String name, boolean loader, boolean project, boolean snapshot) {}
  static String layer(Artifact artifact) {
    if (artifact.loader()) return "spring-boot-loader";
    if (artifact.project()) return "application";
    if (artifact.snapshot()) return "snapshot-dependencies";
    return "dependencies";
  }
  public static void main(String[] args) {
    var artifacts = List.of(
        new Artifact("jackson.jar", false, false, false),
        new Artifact("loader.class", true, false, false),
        new Artifact("local-lib-SNAPSHOT.jar", false, false, true),
        new Artifact("BoardController.class", false, true, false));
    var grouped = new LinkedHashMap<String, List<String>>();
    List.of("dependencies", "spring-boot-loader", "snapshot-dependencies", "application")
        .forEach(name -> grouped.put(name, new ArrayList<>()));
    artifacts.forEach(a -> grouped.get(layer(a)).add(a.name()));
    grouped.forEach((name, values) -> System.out.println(name + "=" + values));
  }
}`, "dependencies=[jackson.jar]\nspring-boot-loader=[loader.class]\nsnapshot-dependencies=[local-lib-SNAPSHOT.jar]\napplication=[BoardController.class]", ["boot-gradle-packaging", "boot-executable-jar", "gradle-dependency-verification"] )],
    diagnostics: [
      d("CI build artifact는 있지만 java -jar가 main class를 찾지 못합니다.", "plain jar를 배포했거나 bootJar main class 탐색/manifest가 잘못되었습니다.", ["artifact filename/classifier와 task outputs를 봅니다.", "jar manifest와 BOOT-INF structure를 확인합니다.", "java -jar exit/output을 검사합니다."], "배포 artifact를 bootJar output/digest로 명시하고 main class를 unambiguous하게 구성합니다.", "CI가 정확한 promoted artifact를 clean process에서 launch-smoke합니다."),
      d("container image가 매 코드 변경마다 dependency layer까지 다시 전송됩니다.", "jar/image layer order가 application과 stable dependencies를 분리하지 못하거나 build context metadata가 매번 변합니다.", ["layer index와 image history/digests를 비교합니다.", "dependency lock과 generated timestamps를 봅니다.", "Dockerfile extraction/copy 순서를 확인합니다."], "Boot layered jar의 stable→volatile ordering을 사용하고 nondeterministic inputs를 제거합니다.", "cache hit, image size와 cold pull을 관측하되 correctness gate 뒤에 최적화합니다."),
    ],
    expertNotes: ["archive에 source YAML이 포함될 수 있으므로 build-time secret 주입을 resource file로 남기지 않습니다.", "SBOM·signature는 생성만 하지 말고 deploy admission에서 expected identity/digest against policy로 검증합니다."],
  },
  {
    id: "diagnostics-condition-bean-startup",
    title: "debug log, conditions·beans·configprops·startup evidence로 추측 대신 자동 구성 결과를 설명합니다",
    lead: "자동 구성 문제는 annotation을 더 붙이기 전에 dependency graph, condition evaluation, bean definition origin, effective configuration과 startup timeline을 연결해 진단합니다.",
    explanations: [
      "--debug 또는 debug property로 condition evaluation 정보를 얻을 수 있지만 운영 로그에 무제한 남기지 않습니다. positive/negative matches에서 목표 auto-configuration의 조건과 message를 찾아 dependency/property/user bean 가설을 검증합니다.",
      "Actuator conditions, beans, configprops, env와 startup endpoints는 강력한 runtime evidence입니다. endpoint별 availability/exposure/access는 다르며 config values와 bean metadata가 내부 구조를 노출할 수 있어 기본 public API로 취급하지 않습니다.",
      "bean definition origin과 injection candidate를 보면 같은 type 충돌, @Primary/@Qualifier와 back-off 실패를 설명할 수 있습니다. stack trace의 마지막 줄만 보지 말고 최초 meaningful cause와 condition chain을 보존합니다.",
      "BufferingApplicationStartup 같은 startup instrumentation은 bean instantiation steps를 볼 수 있지만 overhead, bounded buffer와 민감 bean names를 고려합니다. p95 startup regression과 release diff를 safe aggregate로 관리합니다.",
      "진단 artifact는 application version, dependency lock, sanitized config fingerprint와 correlation됩니다. 비밀/PII/전체 environment dump를 ticket에 붙이지 않고 최소 evidence와 redaction review를 거칩니다.",
    ],
    concepts: [
      c("bean origin", "bean definition이 어느 configuration class/method/resource에서 등록됐는지 나타내는 근거입니다.", ["duplicate/override 진단에 필요합니다.", "instance value와 구분합니다."]),
      c("startup timeline", "application lifecycle과 bean instantiation steps의 순서·duration을 기록한 bounded 진단 자료입니다.", ["성능 병목을 찾습니다.", "business readiness test를 대신하지 않습니다."]),
      c("diagnostic exposure", "내부 condition/config/bean 정보를 누가 어디서 볼 수 있는지 정하는 management 보안 경계입니다.", ["endpoint access와 network exposure를 모두 통제합니다.", "response/log retention을 포함합니다."]),
    ],
    diagnostics: [
      d("NoSuchBeanDefinitionException에 @Component를 반복 추가해 duplicate bean이 생깁니다.", "scan/condition/origin을 확인하지 않고 annotation을 증상별로 덧붙였습니다.", ["missing type의 injection point를 봅니다.", "conditions와 beans report에서 candidate/origin을 찾습니다.", "package scan/runtimeClasspath를 확인합니다."], "정확한 discovery 또는 configuration boundary를 고치고 중복 annotation/bean을 제거합니다.", "context contract test와 architecture test로 expected single bean을 고정합니다."),
      d("startup endpoint를 켰는데 production memory와 내부 정보 노출이 증가합니다.", "buffer size/retention/access policy 없이 상세 startup recording을 상시 활성화했습니다.", ["startup recorder type과 buffer bounds를 봅니다.", "endpoint exposure/auth/network를 검사합니다.", "response/log/ticket 복제 경로를 확인합니다."], "진단 window와 bounded recorder를 사용하고 관리 endpoint를 최소 권한으로 격리합니다.", "incident runbook에 enable→capture→sanitize→disable 단계를 둡니다."),
    ],
    expertNotes: ["conditions report는 왜 configuration이 match했는지 설명하지만 bean의 business correctness는 별도 tests가 필요합니다.", "관측 label에 raw bean/user/property values를 넣지 않고 stable bounded categories를 사용합니다."],
  },
  {
    id: "devtools-runtime-separation",
    title: "개발 편의와 production runtime을 classpath·process·configuration으로 분리합니다",
    lead: "devtools, hot reload와 IDE 실행은 피드백을 빠르게 하지만 packaged production artifact의 classloader, restart, cache와 shutdown behavior를 그대로 대표하지 않습니다.",
    explanations: [
      "developmentOnly configuration의 devtools는 기본 boot archive에서 제외되는지 확인합니다. 포함 여부를 추측하지 말고 runtimeClasspath와 bootJar listing을 각각 검사합니다.",
      "restart classloader는 변경된 project classes와 stable libraries를 분리해 빠르게 재시작할 수 있지만 class identity, static cache, serialization과 resource loading 문제를 production과 다르게 보이게 할 수 있습니다.",
      "IDE run은 environment, working directory와 classpath 순서가 Gradle bootRun/java -jar와 다를 수 있습니다. canonical commands와 launch profiles를 repository 문서에 두고 세 경로의 smoke를 구분합니다.",
      "live reload와 template/cache defaults도 development experience를 바꿉니다. 개발 설정을 production profile에 섞지 않고 config diff와 artifact inspection으로 absence를 증명합니다.",
      "빠른 reload는 tests를 대신하지 않습니다. schema/config/security change는 restart 뒤 보이는 화면만 확인하지 말고 clean process, empty cache와 packaged artifact에서 검증합니다.",
    ],
    concepts: [
      c("developmentOnly", "개발 실행 classpath에는 포함하지만 production executable archive에서는 기본 제외하도록 의도를 표시하는 Gradle configuration입니다.", ["task별 classpath를 확인합니다.", "비밀 저장 공간이 아닙니다."]),
      c("restart classloader", "변경 가능한 application classes를 별도 classloader로 다시 로드해 개발 재시작을 빠르게 하는 devtools mechanism입니다.", ["production class loading과 다를 수 있습니다.", "static state 문제를 숨기거나 드러낼 수 있습니다."]),
      c("launch parity", "IDE, bootRun, java -jar와 deployment가 같은 inputs/contracts를 만족하는지 비교하는 검증입니다.", ["완전 동일 process라는 뜻은 아닙니다.", "차이를 명시합니다."]),
    ],
    diagnostics: [
      d("IDE/devtools에서는 되지만 packaged jar에서 resource를 찾지 못합니다.", "working directory filesystem path 또는 IDE-specific classpath에 의존했습니다.", ["java -jar의 working directory와 classpath resource listing을 봅니다.", "getResource/filesystem APIs 사용을 구분합니다.", "bootJar contents를 확인합니다."], "immutable resource는 classpath API로 읽고 external writable data는 explicit configured path로 분리합니다.", "packaged artifact integration test를 canonical 배포 directory에서 실행합니다."),
      d("production artifact에 devtools가 포함되거나 restart behavior가 관찰됩니다.", "devtools를 implementation/runtimeOnly에 두었거나 custom bootJar classpath가 developmentOnly를 포함했습니다.", ["dependency configuration과 bootJar BOOT-INF/lib를 봅니다.", "custom task classpath 설정을 확인합니다.", "runtime process loaded classes를 검사합니다."], "developmentOnly로 이동하고 custom packaging inclusion을 제거한 뒤 artifact를 재생성합니다.", "release gate가 forbidden development/test artifacts를 archive에서 검사합니다."),
    ],
    expertNotes: ["developer convenience dependency도 supply-chain dependency이므로 version과 provenance 검토에서 제외하지 않습니다.", "production 문제 재현 때 devtools와 IDE cache를 끈 clean packaged launch를 우선 baseline으로 둡니다."],
  },
  {
    id: "build-supply-chain-governance",
    title: "dependency lock·verification·SBOM·취약점 판단을 build 공급망 운영으로 연결합니다",
    lead: "재현 가능한 dependency graph와 artifact 무결성, 취약점 영향 분석, 승인된 upgrade·rollback을 분리해 운영해야 단순 버전 고정을 넘어선 공급망 통제가 됩니다.",
    explanations: [
      "dependency locking은 resolved versions를 기록해 시간이 지나도 selection drift를 줄입니다. changing/SNAPSHOT artifact에는 같은 coordinate가 다른 bytes를 가질 수 있어 release input으로 피하거나 별도 immutable repository policy를 둡니다.",
      "Gradle dependency verification은 checksums/signatures로 downloaded artifacts와 metadata의 무결성/provenance를 검증할 수 있습니다. baseline 자동 생성은 현재 받은 artifact를 신뢰해 기록하는 bootstrap이므로 independent review 없이 안전 보증으로 쓰지 않습니다.",
      "SBOM은 구성 목록이고 vulnerability scanner finding은 영향 조사 시작점입니다. 사용 경로, reachable code, configuration, exploit preconditions와 vendor advisory를 검토하되 critical build fix를 이유 없이 미루지 않습니다.",
      "plugin, Wrapper, container base image, GitHub Actions와 builder도 application dependencies와 같은 provenance graph에 포함합니다. long-lived repository credentials를 줄이고 artifact repository 쓰기 권한과 promotion을 분리합니다.",
      "upgrade는 dependency graph diff, release notes, compilation, unit/slice/integration, packaged smoke, performance/security regression과 canary를 통과합니다. rollback은 old binary만이 아니라 schema/config compatibility와 credential rotation을 고려합니다.",
    ],
    concepts: [
      c("dependency lock", "resolved dependency versions를 파일에 기록하고 이후 selection이 달라지면 검출하는 재현성 장치입니다.", ["artifact bytes 검증과 다릅니다.", "의도적 update workflow가 필요합니다."]),
      c("dependency verification", "다운로드한 artifacts/metadata의 expected checksum 또는 signature를 정책과 대조하는 Gradle 기능입니다.", ["취약점 검사를 대신하지 않습니다.", "bootstrap trust를 검토합니다."]),
      c("SBOM", "release artifact에 포함된 components와 versions/identifiers를 기계가 읽을 수 있게 기록한 목록입니다.", ["실제 digest/provenance와 연결합니다.", "존재만으로 안전하지 않습니다."]),
    ],
    diagnostics: [
      d("lockfile이 있는데도 같은 version artifact가 갑자기 달라집니다.", "changing/SNAPSHOT dependency 또는 repository republish를 사용해 coordinate version만 고정되고 bytes가 고정되지 않았습니다.", ["artifact checksum과 repository metadata를 비교합니다.", "changing module/cache policy를 확인합니다.", "verification metadata와 trusted repository를 봅니다."], "release에서는 immutable versions/repository를 사용하고 independent checksum/signature verification을 적용합니다.", "repository immutability, dependency verification과 artifact retention을 policy로 강제합니다."),
      d("취약점 scanner를 통과했지만 malicious dependency가 build에 들어옵니다.", "known-CVE 검사만 수행하고 name squatting, repository shadowing, plugin/artifact provenance를 검증하지 않았습니다.", ["dependency/plugin coordinates와 repository order를 검토합니다.", "verification metadata/digests/signatures를 확인합니다.", "새 transitive graph와 maintainer provenance를 봅니다."], "승인 repository/coordinates, checksums/signatures와 dependency change review를 결합합니다.", "new dependency gate, provenance attestation과 least-privilege build isolation을 운영합니다."),
    ],
    expertNotes: ["verification metadata 자체도 code review와 protected branch를 거쳐야 합니다.", "긴급 security update와 reproducibility는 대립하지 않으며 lock/verification을 승인된 새 artifact로 원자적으로 갱신합니다."],
  },
  {
    id: "qualification-upgrade-runbook",
    title: "clean build부터 canary·rollback까지 Boot baseline의 완료 기준을 운영 runbook으로 닫습니다",
    lead: "초기 프로젝트 생성의 완료는 IDE에서 main이 한 번 실행되는 것이 아니라 source→dependency→conditions→artifact→runtime→recovery evidence가 반복 가능하게 연결되는 상태입니다.",
    explanations: [
      "preflight에서 Wrapper/JDK compatibility, required configuration schema, free port와 disposable dependencies를 확인합니다. real production credentials가 없는 상태가 정상이며 missing required secret은 safe key name과 actionable message로 fail-fast합니다.",
      "CI는 clean checkout에서 wrapper validation, dependency verification/lock, compilation, tests, bootJar, archive policy scan과 launch smoke를 수행합니다. test skip으로 artifact를 만들 수 있게 하더라도 promotion gate는 tests 성공 artifact만 허용합니다.",
      "runtime acceptance는 application version/digest, conditions fingerprint, expected beans/mappings, readiness와 representative authenticated/unauthenticated request를 포함합니다. DB/JWT values나 full environment는 evidence에 넣지 않습니다.",
      "canary는 startup/error/latency/resource/security metrics와 condition/bean drift를 bounded categories로 비교합니다. threshold 초과 시 동일 digest promotion을 중단하고 config/schema compatibility를 확인해 rollback합니다.",
      "upgrade 뒤 문서와 inventory도 갱신합니다. source snapshot의 Boot 4.0.6과 현재 선택 버전을 섞지 않고 release notes, removed/deprecated APIs와 third-party starter compatibility를 기록합니다.",
    ],
    concepts: [
      c("qualification", "artifact가 지정 환경에서 기능·보안·운영 acceptance criteria를 충족한다는 반복 가능한 검증 과정입니다.", ["build success보다 넓습니다.", "evidence와 owner가 필요합니다."]),
      c("configuration fingerprint", "비밀 값을 제외하고 key schema, origins와 behavior-affecting categories를 비교할 수 있게 만든 배포 설정 식별 정보입니다.", ["raw config dump가 아닙니다.", "drift 비교에 씁니다."]),
      c("rollback compatibility", "이전 artifact가 현재 schema/config/external contracts에서 안전하게 다시 동작할 수 있는 성질입니다.", ["binary swap만으로 충분하지 않을 수 있습니다.", "forward fix도 준비합니다."]),
    ],
    diagnostics: [
      d("canary는 시작되지만 production promotion 뒤 일부 환경에서만 auto-config가 달라집니다.", "canary와 production의 dependency artifact는 같아도 configuration/profile/classpath extension이 달라 conditions 결과가 drift했습니다.", ["artifact digest와 runtime classpath를 비교합니다.", "sanitized configuration origin/fingerprint를 봅니다.", "conditions/beans/mappings expected set을 비교합니다."], "environment contract를 versioned deployment input으로 만들고 promotion 전 drift gate를 둡니다.", "fleet-wide configuration/condition conformance와 progressive rollout을 운영합니다."),
      d("rollback했지만 이전 버전이 새 schema/config에서 시작되지 않습니다.", "upgrade가 destructive schema/config/API change를 먼저 적용해 backward compatibility window를 없앴습니다.", ["migration ledger와 schema compatibility를 봅니다.", "old/new configuration keys와 defaults를 비교합니다.", "external contract version을 확인합니다."], "expand-contract와 dual-read/write 또는 forward recovery를 사용해 rollback window를 보존합니다.", "각 release가 upgrade/rollback rehearsal와 data restore acceptance를 통과합니다."),
    ],
    expertNotes: ["canary health가 정상이어도 authorization·data correctness와 rare failure path는 별도 acceptance가 필요합니다.", "지원 종료나 major upgrade는 library version 변경이 아니라 Jakarta/package, plugin, test, deployment contracts의 migration project로 관리합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-build-gradle", repository: "D:/dev/springboot/MyProject01", path: "build.gradle", usedFor: ["Boot 4.0.6 plugin", "Java 21 toolchain", "starter/configuration/source audit"], evidence: "2026-07-14 read-only audit: 51 lines, 1,839 bytes, SHA-256 A02F07F87FFE4643B08FD5AE91A5714B67261035287F03298778209AB8DA2FF1. Dependency coordinates와 scope 구조만 사용했으며 실제 credential은 이 파일에 없었습니다." },
  { id: "local-main-class", repository: "D:/dev/springboot/MyProject01", path: "src/main/java/com/study/myproject01/MyProject01Application.java", usedFor: ["root package", "@SpringBootApplication", "SpringApplication.run"], evidence: "2026-07-14 read-only audit: 13 lines, 336 bytes, SHA-256 E4D34C3C4A47ED027D715FD1E2EFC0A444F537197930C43956872DC59C4D99D2." },
  { id: "local-application-yaml", repository: "D:/dev/springboot/MyProject01", path: "src/main/resources/application.yaml", usedFor: ["external configuration structure", "secret remediation boundary", "MyBatis/data source namespaces"], evidence: "2026-07-14 read-only audit: 22 lines, 621 bytes, SHA-256 65F89F39F4416557F2A314D5450C4D29D79FC6A2750EF953C4A2CFAF3DD8369E. 평문 DB/JWT 관련 값은 읽었지만 본문·예제·로그에 복사하지 않았고 rotation 필요성만 기록했습니다." },
  { id: "boot-system-requirements", repository: "Spring Boot", path: "system-requirements.html", publicUrl: "https://docs.spring.io/spring-boot/system-requirements.html", usedFor: ["Java·Gradle·Servlet support matrix", "version qualification"], evidence: "2026-07-14 기준 current official system requirements를 확인했습니다. 원본 4.0.6에는 해당 release의 versioned requirements를 적용해야 합니다." },
  { id: "boot-build-systems", repository: "Spring Boot", path: "reference/using/build-systems.html", publicUrl: "https://docs.spring.io/spring-boot/reference/using/build-systems.html", usedFor: ["BOM", "managed dependencies", "starter definition"], evidence: "Spring Boot release가 curated dependency list/BOM을 제공하고 starters가 supported transitive dependency set을 제공한다는 공식 설명을 확인했습니다." },
  { id: "boot-gradle-introduction", repository: "Spring Boot Gradle Plugin", path: "gradle-plugin/introduction.html", publicUrl: "https://docs.spring.io/spring-boot/gradle-plugin/introduction.html", usedFor: ["plugin capabilities", "supported Gradle range", "configuration cache"], evidence: "Boot Gradle plugin이 executable archive, run과 dependency management integration을 제공한다는 current official guide를 확인했습니다." },
  { id: "boot-gradle-dependencies", repository: "Spring Boot Gradle Plugin", path: "gradle-plugin/managing-dependencies.html", publicUrl: "https://docs.spring.io/spring-boot/gradle-plugin/managing-dependencies.html", usedFor: ["dependency-management plugin", "Gradle BOM support", "version override trade-off"], evidence: "Boot plugin에서 dependency management를 적용하는 공식 선택지를 확인했습니다." },
  { id: "boot-auto-config", repository: "Spring Boot", path: "reference/using/auto-configuration.html", publicUrl: "https://docs.spring.io/spring-boot/reference/using/auto-configuration.html", usedFor: ["@EnableAutoConfiguration", "conditions", "back-off/exclusion", "auto-configuration package"], evidence: "classpath 기반 자동 구성, user configuration의 non-invasive replacement와 exclusion 경계를 확인했습니다." },
  { id: "boot-custom-auto-config", repository: "Spring Boot", path: "reference/features/developing-auto-configuration.html", publicUrl: "https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html", usedFor: ["@AutoConfiguration", "ConditionalOnClass/MissingBean", "imports metadata", "custom starter boundary"], evidence: "auto-configuration candidates와 conditional bean/back-off, metadata 등록 규칙을 확인했습니다." },
  { id: "boot-structuring", repository: "Spring Boot", path: "reference/using/structuring-your-code.html", publicUrl: "https://docs.spring.io/spring-boot/reference/using/structuring-your-code.html", usedFor: ["default package warning", "application class root placement", "component scan boundary"], evidence: "default package를 피하고 application class를 root package 위에 두는 공식 권고를 확인했습니다." },
  { id: "boot-spring-application", repository: "Spring Boot", path: "reference/features/spring-application.html", publicUrl: "https://docs.spring.io/spring-boot/reference/features/spring-application.html", usedFor: ["SpringApplication", "events", "application context", "availability"], evidence: "SpringApplication lifecycle, events, ApplicationContext와 availability state 경계를 확인했습니다." },
  { id: "boot-availability", repository: "Spring Boot", path: "reference/features/spring-application.html#features.spring-application.application-availability", publicUrl: "https://docs.spring.io/spring-boot/reference/features/spring-application.html#features.spring-application.application-availability", usedFor: ["liveness", "readiness", "probe semantics"], evidence: "liveness와 readiness의 서로 다른 의미와 external check를 liveness에 넣을 때의 위험을 확인했습니다." },
  { id: "boot-gradle-packaging", repository: "Spring Boot Gradle Plugin", path: "gradle-plugin/packaging.html", publicUrl: "https://docs.spring.io/spring-boot/gradle-plugin/packaging.html", usedFor: ["bootJar/bootWar", "main class", "developmentOnly exclusion", "layers"], evidence: "BootJar task, executable/plain archive, BOOT-INF layout와 기본 layer order를 확인했습니다." },
  { id: "boot-executable-jar", repository: "Spring Boot", path: "specification/executable-jar/", publicUrl: "https://docs.spring.io/spring-boot/specification/executable-jar/", usedFor: ["nested jars", "Boot loader", "archive format"], evidence: "Spring Boot executable jar/war 형식과 loader 역할을 확인했습니다." },
  { id: "boot-actuator-endpoints", repository: "Spring Boot", path: "reference/actuator/endpoints.html", publicUrl: "https://docs.spring.io/spring-boot/reference/actuator/endpoints.html", usedFor: ["conditions/beans/configprops/env/health/startup", "availability/exposure/access"], evidence: "built-in management endpoints와 endpoint access/exposure가 별도 조건이라는 공식 설명을 확인했습니다." },
  { id: "boot-actuator-startup", repository: "Spring Boot Actuator API", path: "api/rest/actuator/startup.html", publicUrl: "https://docs.spring.io/spring-boot/api/rest/actuator/startup.html", usedFor: ["startup timeline", "BufferingApplicationStartup evidence"], evidence: "startup endpoint가 recorded startup steps snapshot/drain을 제공하는 current API를 확인했습니다." },
  { id: "boot-testing", repository: "Spring Boot", path: "reference/testing/index.html", publicUrl: "https://docs.spring.io/spring-boot/reference/testing/index.html", usedFor: ["boot-test modules", "test auto-configuration", "slice/full-context boundary"], evidence: "Spring Boot test core와 test auto-configuration modules 역할을 확인했습니다." },
  { id: "boot-test-dependencies", repository: "Spring Boot", path: "reference/testing/test-scope-dependencies.html", publicUrl: "https://docs.spring.io/spring-boot/reference/testing/test-scope-dependencies.html", usedFor: ["starter-test contents", "test scope"], evidence: "starter-test가 제공하는 JUnit, Spring Test, AssertJ, Mockito 등 공식 test dependency set을 확인했습니다." },
  { id: "gradle-wrapper", repository: "Gradle", path: "current/userguide/gradle_wrapper.html", publicUrl: "https://docs.gradle.org/current/userguide/gradle_wrapper.html", usedFor: ["Wrapper execution", "distribution checksum", "upgrade files"], evidence: "Gradle Wrapper가 선언된 distribution을 사용하며 SHA-256 검증을 지원한다는 공식 문서를 확인했습니다." },
  { id: "gradle-toolchains", repository: "Gradle", path: "current/userguide/toolchains.html", publicUrl: "https://docs.gradle.org/current/userguide/toolchains.html", usedFor: ["Java toolchain", "launcher/compiler selection", "daemon separation"], evidence: "Gradle Java toolchain의 compile/test launcher selection과 installation discovery 경계를 확인했습니다." },
  { id: "gradle-dependency-locking", repository: "Gradle", path: "current/userguide/dependency_locking.html", publicUrl: "https://docs.gradle.org/current/userguide/dependency_locking.html", usedFor: ["resolved version lock", "lock update", "changing dependency caveat"], evidence: "lock state가 selected versions를 strict하게 재현하고 changing dependencies에 적합하지 않다는 공식 설명을 확인했습니다." },
  { id: "gradle-dependency-verification", repository: "Gradle", path: "current/userguide/dependency_verification.html", publicUrl: "https://docs.gradle.org/current/userguide/dependency_verification.html", usedFor: ["checksums", "signatures", "bootstrap trust", "plugins/artifacts scope"], evidence: "dependency verification의 integrity/provenance 목적과 baseline bootstrap의 신뢰 한계를 확인했습니다." },
];

const session = createExpertSession({
  inventoryId: "boot-01-gradle-starter-autoconfig",
  slug: "boot-01-gradle-starter-autoconfig",
  courseId: "spring",
  moduleId: "spring-boot-rest-integration",
  order: 1,
  title: "Gradle, starter와 Spring Boot 자동 구성",
  subtitle: "원본 Boot 4.0.6 프로젝트를 안전하게 감사하고 build graph부터 conditions·bootJar·운영 qualification까지 실행 증거로 해체합니다",
  level: "기초",
  estimatedMinutes: 85,
  coreQuestion: "SpringApplication.run 한 줄 뒤에서 Gradle·starter·BOM·classpath·조건부 자동 구성·package scan·executable archive가 어떻게 연결되며, 그 결과를 어떻게 안전하게 증명할까요?",
  summary: "springboot/MyProject01의 build.gradle, 최상위 @SpringBootApplication class와 application.yaml을 read-only로 감사합니다. 원본의 Boot 4.0.6·Java 21·Web MVC/JDBC/MyBatis/Security dependency 구조는 provenance로 보존하되 YAML의 실제 DB/JWT 값은 절대 복사하지 않고 rotate해야 할 plaintext secret risk로만 다룹니다. Gradle plugin·Wrapper·toolchain, starter와 BOM/configuration, SpringApplication/ApplicationContext lifecycle, package scan, conditional auto-configuration/back-off, external configuration, feature/test classpaths, bootJar/layers, Actuator diagnostics, devtools separation, dependency lock/verification와 canary·rollback까지 초급 main 메서드에서 production qualification으로 연결합니다. 다섯 JDK 21 examples는 starter graph, startup state, package scan, condition/back-off와 archive layers를 결정적 stdout으로 실행하며 실제 Boot conditions/dependency/archive tests와의 경계를 명시합니다.",
  objectives: [
    "원본 세 파일의 버전·dependency·package·configuration 구조를 비밀 값 없이 provenance로 설명한다.",
    "Gradle plugin, Wrapper, Java toolchain과 dependency configurations의 책임을 구분한다.",
    "starter와 BOM, transitive dependency와 auto-configuration condition을 서로 다른 단계로 추적한다.",
    "@SpringBootApplication, SpringApplication, ApplicationContext와 package scan 경계를 펼쳐 설명한다.",
    "classpath·property·user bean에 따른 auto-configuration match/back-off를 conditions evidence로 검증한다.",
    "bootJar contents, executable launch, layers, digest와 development/test artifact 제외를 검사한다.",
    "conditions·beans·configprops·startup diagnostics를 최소 노출과 redaction 정책 아래 사용한다.",
    "dependency lock/verification, test, canary와 rollback을 Boot upgrade qualification runbook으로 운영한다.",
  ],
  prerequisites: [{ title: "WebSocket 핸드셰이크와 실시간 메시지", reason: "전통 Spring MVC의 component/lifecycle와 layered application 경계를 알고 있어야 Boot가 무엇을 자동화하고 무엇을 자동화하지 않는지 비교할 수 있습니다.", sessionSlug: "crud-09-websocket-chat" }],
  keywords: ["Spring Boot 4", "Gradle", "starter", "BOM", "dependency management", "Java toolchain", "SpringApplication", "SpringBootApplication", "auto-configuration", "condition report", "back-off", "component scan", "bootJar", "layered jar", "Actuator", "dependency locking", "dependency verification", "secret rotation"],
  topics,
  lab: {
    title: "원본 Boot 프로젝트를 비밀 없이 재현 가능한 auto-configuration·artifact qualification으로 전환하기",
    goal: "원본 세 파일을 변경하지 않고 sanitized clone/fixture에서 dependency→conditions→beans→bootJar→runtime evidence를 만들며 secret remediation과 rollback runbook을 완성합니다.",
    prerequisites: ["JDK 21", "원본과 호환되는 Gradle Wrapper", "격리된 작업 복사본", "synthetic configuration/비밀", "localhost disposable port", "원본 파일 read-only 권한"],
    steps: ["세 원본 파일의 hash/line count와 dependency/config key 구조를 기록하되 values는 수집하지 않습니다.", "노출 가능성이 있는 DB/JWT credential을 owner에게 rotation 대상으로 등록하고 source/history/CI artifact 범위를 조사합니다.", "Wrapper·Boot plugin·Gradle·JDK compatibility를 공식 versioned requirements와 대조합니다.", "dependencies/dependencyInsight로 starter/BOM/configuration별 requested→selected graph를 저장합니다.", "synthetic profile에서 conditions, beans, config binding origins와 mappings를 최소 노출로 capture합니다.", "user bean/classpath/property를 하나씩 바꿔 match/back-off differential tests를 실행합니다.", "clean test와 bootJar를 만들고 BOOT-INF, forbidden dev/test/secret resources, layers와 digest를 검사합니다.", "java -jar로 별도 process를 시작해 readiness·representative request·graceful stop과 failure startup을 검증합니다.", "dependency lock/verification과 provenance/SBOM을 artifact digest에 연결하고 canary thresholds를 작성합니다.", "config/schema compatible rollback과 credential rotation/history cleanup readback까지 rehearsal합니다."],
    expectedResult: ["실제 secret이 어떤 output·commit·artifact에도 새로 노출되지 않습니다.", "dependency selection, condition match/back-off와 bean origins를 재현 가능한 evidence로 설명합니다.", "동일 source/input의 bootJar가 승인된 contents와 launch/readiness contract를 만족합니다.", "devtools/test dependencies와 local config가 production archive에 없습니다.", "upgrade/canary/rollback과 credential rotation owners가 명시된 runbook이 남습니다."],
    cleanup: ["disposable process, ports, temp configs/reports와 test data를 제거합니다.", "실습용 synthetic credentials를 revoke하고 secret scanner output을 안전하게 폐기합니다.", "원본 세 파일이 변경되지 않았음을 hash/status로 readback합니다.", "Actuator debug exposure와 temporary verbose logging을 원복합니다."],
    extensions: ["ApplicationContextRunner로 auto-config condition matrix를 자동화합니다.", "Testcontainers로 disposable DB integration을 추가합니다.", "reproducible build/digest differential과 SBOM admission을 CI에 연결합니다.", "Spring Boot major upgrade의 Jakarta/third-party starter compatibility matrix를 작성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 각 stdout을 실제 Boot evidence의 어느 부분과 대조할지 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "starter와 auto-configuration을 구분합니다.", "success/failure readiness를 구분합니다.", "root package 포함 규칙을 설명합니다.", "match/back-off/no-match를 설명합니다.", "layer order와 cache 목적을 설명합니다."], hints: ["JDK model이 실제 Boot를 대체한다고 쓰지 말고 dependency/conditions/archive evidence 위치를 함께 적으세요."], expectedOutcome: "숨은 자동화의 각 단계를 관찰 가능한 입력·결정·산출물로 설명합니다.", solutionOutline: ["graph→lifecycle→scan→conditions→artifact 순서로 실행하고 실제 보고서와 연결합니다."] },
    { difficulty: "응용", prompt: "원본 MyProject01을 값 노출 없이 production-ready build baseline으로 교정하는 patch와 검증 계획을 작성하세요.", requirements: ["평문 DB/JWT credential rotation을 최우선으로 둡니다.", "Wrapper/toolchain/version matrix를 고정합니다.", "dependency graph/lock/verification을 둡니다.", "typed config/validation과 secret injection을 설계합니다.", "conditions/beans contract를 검증합니다.", "test→bootJar→archive scan→launch smoke를 수행합니다.", "Actuator 최소 노출을 적용합니다.", "canary/rollback evidence를 포함합니다."], hints: ["실제 값을 새 파일이나 답안에 옮기지 마세요.", "source cleanup과 credential rotation을 다른 작업으로 추적하세요."], expectedOutcome: "재현성·보안·runtime evidence가 있는 implementation-ready remediation이 완성됩니다.", solutionOutline: ["revoke/rotate→baseline→graph→config→context tests→artifact→canary/rollback 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring Boot starter·auto-configuration·build 공급망 표준을 작성하세요.", requirements: ["지원 Boot/Gradle/JDK matrix를 정의합니다.", "starter/BOM/version override 정책을 둡니다.", "package/condition/back-off architecture tests를 둡니다.", "configuration/secret lifecycle을 정의합니다.", "bootJar contents/digest/provenance acceptance를 둡니다.", "Actuator diagnostic access/redaction을 정의합니다.", "dependency lock/verification/SBOM 취약점 workflow를 둡니다.", "upgrade/canary/rollback/RTO owner를 포함합니다."], hints: ["build success, artifact integrity, dependency vulnerability와 runtime correctness를 각각 별도 gate로 두세요."], expectedOutcome: "초기 생성부터 운영 upgrade까지 감사 가능한 Boot governance가 완성됩니다.", solutionOutline: ["support matrix→build inputs→runtime conditions→artifact→deploy evidence→recovery 순서입니다."] },
  ],
  nextSessions: ["boot-02-application-yaml-profiles"],
  sources,
  sourceCoverage: {
    filesRead: 3,
    filesUsed: 3,
    uncoveredNotes: [
      "원본 application.yaml의 DB URL/username/password와 JWT secret처럼 공개에 부적절한 실제 값은 어느 본문·예제·expected output에도 복사하지 않았고, 노출 가능성을 전제로 rotation과 history/artifact 범위 조사만 요구했습니다.",
      "원본 build.gradle의 Boot 4.0.6, Java 21, Web MVC/JDBC/MyBatis/Security/test/processor scopes와 application class의 package/annotations만 progression 근거로 사용했습니다.",
      "원본을 실행하거나 실제 DB/secret을 사용하지 않았으므로 resolved graph, condition report, bean graph, bootJar contents와 runtime outcome은 lab에서 disposable configuration으로 검증해야 합니다.",
      "dependency locking/verification, Actuator exposure, reproducible artifact/provenance, canary와 rollback은 원본에 충분하지 않아 current Spring Boot·Gradle 공식 문서와 synthetic JDK examples로 보강했습니다.",
    ],
  },
});

export default session;
