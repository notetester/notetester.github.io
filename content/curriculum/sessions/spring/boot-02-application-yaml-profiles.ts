import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: "1-15", explanation: "JDK 21 records·maps·sets·Duration·URI로 property precedence, profile expansion, environment name, validation과 value-free fingerprint를 모델링합니다." },
      { lines: "16-끝에서 6줄 전", explanation: "source origin과 override, bounded expansion, canonical key, typed constraints 또는 redaction category를 결정적으로 계산합니다." },
      { lines: "마지막 6줄", explanation: "effective value가 아니라 필요한 최소 evidence를 정렬된 stdout으로 출력해 설정 설명과 실제 결과를 대조합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java source-file mode", "Spring Boot·YAML parser·network·real secret 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 예상 결과와 완전히 같아야 합니다.", "교육용 model은 실제 ConfigData, relaxed binding, profile expression과 Bean Validation engine을 대체하지 않습니다."] },
    experiments: [
      { change: "source order, profile group, environment key, duration/URI 또는 secret key를 하나씩 바꿉니다.", prediction: "origin, expanded profiles, canonical key, validation result 또는 redaction category가 달라집니다.", result: "model stdout과 disposable Boot context의 Environment·configprops·startup failure를 비교합니다." },
      { change: "같은 설정을 classpath YAML, external file, environment와 command line에 중복 선언합니다.", prediction: "documented precedence와 activation에 따라 하나의 effective origin이 선택됩니다.", result: "값은 노출하지 않고 key, source name, origin line, type와 validation category만 기록합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "source-yaml-secret-audit",
    title: "원본 YAML을 key schema·origin·민감도·수명으로 감사하고 실제 값은 격리합니다",
    lead: "설정 파일은 단순 메모가 아니라 자동 구성과 보안 경계를 바꾸는 runtime input이므로 key 구조와 provenance만 학습하고 실제 credential은 즉시 rotation 대상으로 분리합니다.",
    explanations: [
      "원본 application.yaml은 application name, datasource, MyBatis와 JWT namespaces를 한 파일에 둡니다. DB 연결 및 token signing 관련 평문 값은 학습자료·예제·로그에 복사하지 않았고, 이미 노출됐을 가능성이 있는 credential은 revoke/rotate, history와 CI artifact 범위 조사 대상으로 취급합니다.",
      "key inventory에는 owner, data type, required/default, sensitivity, allowed environments, reload/restart semantics와 deprecation version을 둡니다. password/secret라는 이름만 민감한 것이 아니라 URL query, certificate, API token, private host와 tenant identifier도 분류합니다.",
      "source hash는 읽은 snapshot을 고정하지만 안전한 configuration이라는 보증은 아닙니다. current effective config는 profile, imported data, environment와 command line 때문에 파일 내용과 달라질 수 있습니다.",
      "sample YAML에는 무효 placeholder와 설명 가능한 non-secret defaults만 둡니다. real local configuration은 ignored file 또는 승인된 secret provider에서 주입하며 team chat, issue, screenshot과 test fixture로 복사하지 않습니다.",
      "실습은 원본을 변경하거나 실제 DB에 접속하지 않습니다. sanitized fixture에서 key names와 types만 재현하고 모든 output은 origin과 category 중심으로 만듭니다.",
    ],
    concepts: [
      c("configuration schema", "지원 key, type, constraints, default, sensitivity, owner와 lifecycle을 정의한 versioned 계약입니다.", ["YAML 모양보다 넓습니다.", "metadata와 tests로 검증합니다."]),
      c("configuration origin", "effective property가 어느 file/document/line/environment source에서 왔는지 나타내는 provenance입니다.", ["값과 별도로 기록할 수 있습니다.", "override 진단에 핵심입니다."]),
      c("secret rotation", "기존 credential을 폐기하고 새 credential을 발급·배포·검증한 뒤 잔여 사용을 차단하는 수명 전환입니다.", ["파일 삭제보다 먼저 수행할 수 있습니다.", "consumer cutover와 audit가 필요합니다."]),
    ],
    diagnostics: [
      d("repository scanner가 application.yaml에서 credential을 발견합니다.", "real DB/JWT credential을 source-controlled config에 저장했습니다.", ["값을 출력하지 않고 current/history/forks/CI artifacts 범위를 식별합니다.", "provider access logs와 last-used를 확인합니다.", "모든 consumers와 owner를 inventory합니다."], "credential을 revoke/rotate하고 approved injection으로 전환한 뒤 history rewrite는 별도 백업·협업 계획으로 수행합니다.", "secret scanning, short-lived credentials, sample/real config 분리와 rotation rehearsal를 운영합니다."),
      d("누가 어떤 key를 바꿨는지 알 수 없어 장애 복구가 늦습니다.", "configuration을 unversioned mutable file로 운영하고 schema, owner, change audit와 deployment correlation이 없습니다.", ["effective source/origin과 config release id를 봅니다.", "change audit와 deployment timeline을 대조합니다.", "unknown/defaulted keys를 검사합니다."], "configuration release를 versioned/approved input으로 만들고 value-free fingerprint와 rollback snapshot을 artifact에 연결합니다.", "config changes도 review, canary, audit와 rollback gate를 통과하게 합니다."),
    ],
    expertNotes: ["credential 문자열 일부를 마스킹해도 길이·prefix·suffix가 공격 정보가 될 수 있어 값 자체를 수집하지 않는 진단을 우선합니다.", "secret rotation 뒤 old credential의 last-used가 0이고 모든 consumers가 새 version을 사용하는지 readback해야 완료입니다."],
  },
  {
    id: "yaml-documents-types-parsing",
    title: "YAML indentation·documents·scalar type을 문자열 모양이 아니라 binding 결과로 검증합니다",
    lead: "YAML은 사람이 읽기 쉽지만 indentation, colon, quoting, anchors와 implicit scalar 해석 때문에 눈으로 맞아 보이는 파일도 다른 tree/type을 만들 수 있습니다.",
    explanations: [
      "space indentation으로 mapping과 sequence 계층을 표현하며 tab, 잘못된 들여쓰기와 duplicate keys는 parser/tool에 따라 오류 또는 overwrite를 만들 수 있습니다. CI parser와 runtime Boot/SnakeYAML 조합을 canonical하게 사용합니다.",
      "colon, hash, leading zero, date-like text, on/off/yes/no 같은 scalar는 YAML version/schema와 parser에 따라 type 해석 차이가 있을 수 있습니다. port·duration·ID·URL처럼 의미가 중요한 값은 @ConfigurationProperties target type과 explicit syntax로 검증합니다.",
      "`---`는 한 file 안의 새 YAML document를 시작하며 각 document는 spring.config.activate 조건을 가질 수 있습니다. document 순서와 later override를 test하고 active profile 선언이 허용되지 않는 profile-specific document 규칙을 지킵니다.",
      "anchors/aliases는 중복을 줄일 수 있지만 effective configuration과 override origin을 어렵게 만들 수 있습니다. 운영 설정에서는 clarity와 tool support를 우선하고 secret reuse를 anchor로 감추지 않습니다.",
      "YAML과 properties가 같은 location/basename에 함께 있으면 precedence가 생기므로 한 format을 일관되게 사용합니다. extension만 바꾼 duplicate file을 남기지 않습니다.",
    ],
    concepts: [
      c("YAML document", "`---` 경계로 분리되며 독립 mapping tree와 activation 조건을 가질 수 있는 설정 단위입니다.", ["한 file에 여러 documents가 있을 수 있습니다.", "order와 activation을 검증합니다."]),
      c("scalar typing", "YAML token을 string, number, boolean, null 등 값 type으로 해석하는 규칙입니다.", ["target binding type과 함께 확인합니다.", "보이는 글자만으로 단정하지 않습니다."]),
      c("duplicate key", "같은 mapping에서 동일 key가 반복되는 구조 오류입니다.", ["tool behavior에 의존하지 않습니다.", "lint와 parser strictness로 차단합니다."]),
    ],
    diagnostics: [
      d("YAML은 parse되지만 duration 또는 ID가 예상과 다른 type으로 binding됩니다.", "암시적 scalar 해석과 target type/unit을 명시하지 않았습니다.", ["origin line과 parsed node type을 확인합니다.", "ConfigurationProperties target type/metadata를 봅니다.", "경계값 binding test를 실행합니다."], "Duration/DataSize/URI/enum 같은 semantic type을 사용하고 unit·quote policy를 명시합니다.", "representative YAML fixture를 runtime parser와 configuration binding test로 검증합니다."),
      d("같은 key를 수정했는데 이전 값이 계속 적용됩니다.", "다중 document 또는 duplicate file/properties가 더 높은 precedence에서 override합니다.", ["loaded config documents와 origin을 trace합니다.", "동일 basename의 properties/YAML을 찾습니다.", "duplicate keys와 active conditions를 검사합니다."], "중복 sources를 제거하고 document activation/override를 최소화해 origin을 단일하게 만듭니다.", "config lint와 expected origin contract를 CI에 둡니다."),
    ],
    expertNotes: ["YAML spec와 Boot ConfigData rules는 다른 층입니다. 문법상 유효해도 Boot activation 위치가 잘못될 수 있습니다.", "parser upgrade는 dependency update이자 configuration behavior change이므로 fixture regression을 포함합니다."],
  },
  {
    id: "property-source-precedence-origin",
    title: "PropertySource 우선순위를 source 이름·origin·effective value의 provenance chain으로 추적합니다",
    lead: "같은 key가 classpath YAML, external file, environment, system property와 command line에 나타날 때 높은 precedence source가 낮은 source를 override합니다.",
    explanations: [
      "SpringApplication default, @PropertySource, config data, environment, system properties, command-line와 test-specific sources는 정해진 order를 가집니다. 목록을 영구 암기하지 말고 사용 Boot version 공식 문서와 Environment property sources를 확인합니다.",
      "config data 내부에서도 packaged application, packaged profile, external application, external profile files의 order가 있습니다. external이라는 이유만으로 모든 command line보다 높거나 모든 import보다 낮다고 단순화하지 않습니다.",
      "effective value만 출력하면 어디에서 덮였는지 알 수 없습니다. key, selected source, origin resource/line과 value type을 기록하고 sensitive value는 redacted/absent로 둡니다.",
      "command-line properties는 편리하지만 process list, shell history와 audit에서 비밀을 노출할 수 있습니다. behavioral toggle도 승인되지 않은 ad-hoc override가 fleet drift를 만들지 않도록 policy를 둡니다.",
      "test property sources는 production precedence를 그대로 대표하지 않을 수 있습니다. unit/binding test와 packaged runtime origin test를 분리합니다.",
    ],
    concepts: [
      c("PropertySource precedence", "동일 key 후보 중 어떤 source의 값이 effective가 되는지 정하는 ordered resolution 규칙입니다.", ["source 종류와 ConfigData 내부 order를 포함합니다.", "Boot version별 공식 문서를 확인합니다."]),
      c("override chain", "낮은 기본값부터 최종 source까지 같은 key가 어떻게 대체됐는지 나타낸 provenance sequence입니다.", ["drift와 오타를 찾습니다.", "값 없이 source names만 기록할 수 있습니다."]),
      c("effective property", "모든 sources, profiles와 binding 전 resolution을 거쳐 Environment에서 조회되는 최종 property입니다.", ["파일 원문과 다를 수 있습니다.", "application behavior 입력입니다."]),
    ],
    codeExamples: [java("boot02-precedence", "여러 property sources에서 최종 값과 origin 선택", "Boot02Precedence.java", "낮은 default부터 높은 command-line까지 같은 key를 overlay해 effective value와 origin을 계산합니다.", String.raw`import java.util.*;

public class Boot02Precedence {
  record Source(String name, int order, Map<String, String> values) {}
  record Resolved(String value, String origin) {}
  static Resolved resolve(String key, List<Source> sources) {
    Resolved result = null;
    for (var source : sources.stream().sorted(Comparator.comparingInt(Source::order)).toList()) {
      if (source.values().containsKey(key)) result = new Resolved(source.values().get(key), source.name());
    }
    return result;
  }
  public static void main(String[] args) {
    var sources = List.of(
        new Source("defaults", 0, Map.of("server.port", "8080")),
        new Source("classpath-yaml", 10, Map.of("server.port", "8081")),
        new Source("environment", 20, Map.of("server.port", "8082")),
        new Source("command-line", 30, Map.of("server.port", "9090")));
    var result = resolve("server.port", sources);
    System.out.println("value=" + result.value());
    System.out.println("origin=" + result.origin());
    System.out.println("candidates=" + sources.size());
  }
}`, "value=9090\norigin=command-line\ncandidates=4", ["boot-external-config", "spring-environment", "boot-actuator-endpoints"] )],
    diagnostics: [
      d("환경변수를 바꿨는데 command-line 값이 계속 사용됩니다.", "더 높은 precedence source가 같은 key를 override하고 있습니다.", ["Environment property sources와 origin을 확인합니다.", "process arguments와 deployment manifest를 봅니다.", "test source가 섞이지 않았는지 확인합니다."], "불필요한 higher-precedence override를 제거하고 configuration owner/source를 하나로 정합니다.", "fleet policy가 승인되지 않은 command-line/system-property overrides를 검출합니다."),
      d("origin 진단 로그에 DB password가 평문으로 남습니다.", "effective value와 provenance를 같은 방식으로 직렬화했습니다.", ["log fields와 actuator sanitization을 검사합니다.", "log sink/cache/ticket 복제 범위를 확인합니다.", "credential 사용 이력을 봅니다."], "값을 즉시 rotate하고 진단은 key/source/type/redaction flag만 기록하도록 바꿉니다.", "central redaction tests와 forbidden-key/value-pattern scans를 운영합니다."),
    ],
    expertNotes: ["property source order는 단일 숫자 목록보다 config data location groups, imports와 profiles를 함께 봐야 합니다.", "null override semantics는 source 형식마다 다를 수 있으므로 null로 낮은 값을 지우는 설계를 피하고 explicit absence policy를 둡니다."],
  },
  {
    id: "config-data-locations-imports",
    title: "classpath·external locations와 spring.config.import를 fail-fast·optional·group 단위로 설계합니다",
    lead: "ConfigData는 application files와 imported locations를 startup 초기 단계에 로드하며 location replacement/addition과 optional 여부가 배포 성공 조건을 바꿉니다.",
    explanations: [
      "기본 search locations에는 classpath root/config와 current directory/config 계열이 포함됩니다. working directory에 우연히 놓인 application.yaml이 packaged defaults를 override할 수 있어 deployment directory contents를 artifact처럼 관리합니다.",
      "spring.config.location은 기본 locations를 대체하고 additional-location은 추가합니다. 두 이름을 혼동하면 packaged defaults가 사라지거나 예상치 못한 external file이 남을 수 있으므로 loaded locations trace와 missing-file tests를 둡니다.",
      "spring.config.import는 document 아래 다른 file/config tree/provider를 import합니다. fixed import는 없으면 startup 실패, optional: import는 없어도 진행하므로 해당 설정이 정말 optional인지 business invariant로 결정합니다.",
      "location groups는 profile-specific resolution의 precedence tier를 표현합니다. comma와 semicolon의 의미를 test 없이 조합하지 않고 environment별 expected origin matrix를 만듭니다.",
      "remote config provider는 network/auth/cache/last-known-good와 outage policy가 필요합니다. startup이 무기한 block되지 않도록 timeout, retry budget, fail-open/closed와 rollback snapshot을 정의합니다.",
    ],
    concepts: [
      c("ConfigData", "application context refresh 전에 files, config trees와 providers에서 configuration documents를 로드·활성화하는 Boot subsystem입니다.", ["profile-aware합니다.", "origin을 보존합니다."]),
      c("optional location", "존재하지 않아도 startup을 계속하도록 `optional:` semantics를 명시한 configuration location입니다.", ["실제로 optional인 data에만 씁니다.", "오타 은폐 수단이 아닙니다."]),
      c("location group", "같은 precedence tier로 profile resolution해야 하는 configuration locations 묶음입니다.", ["separator 의미를 공식 문서로 확인합니다.", "origin matrix로 test합니다."]),
    ],
    diagnostics: [
      d("배포 폴더의 오래된 application.yaml 때문에 새 artifact 설정이 적용되지 않습니다.", "external default search location이 packaged config보다 높은 precedence로 남아 drift했습니다.", ["loaded config locations/origins를 trace합니다.", "deployment directory files와 owner를 inventory합니다.", "artifact/config release ids를 비교합니다."], "external config를 versioned managed path로 이동하고 unmanaged stale files를 안전하게 quarantine합니다.", "immutable deployment directory와 config fingerprint conformance를 적용합니다."),
      d("필수 secret/config import가 없어도 서비스가 시작돼 첫 요청에서 실패합니다.", "필수 location에 optional:을 붙여 startup invariant를 약화했습니다.", ["import declaration과 missing-location event를 봅니다.", "bound configuration validation을 확인합니다.", "readiness와 first-use failure를 재현합니다."], "필수 config는 fail-fast import와 validation을 사용하고 optional feature는 explicit disabled state를 둡니다.", "missing/corrupt/permission-denied config fault tests를 CI와 canary에서 실행합니다."),
    ],
    expertNotes: ["config provider availability를 liveness에 직접 묶으면 restart storm이 생길 수 있어 startup/readiness/runtime refresh 정책을 분리합니다.", "external file permissions만으로 secret safety가 완성되지 않으며 backup, process access, logs와 rotation을 포함합니다."],
  },
  {
    id: "profiles-active-default-groups",
    title: "active·default·include·group profiles를 환경 이름이 아니라 기능 조합 계약으로 관리합니다",
    lead: "profile은 configuration/bean activation selector이며 production이라는 한 단어 뒤에 DB, observability, integration 같은 세부 capabilities를 group으로 묶을 수 있습니다.",
    explanations: [
      "spring.profiles.active는 property source precedence를 따르며 높은 source가 기존 list를 대체할 수 있습니다. 아무 profile도 active하지 않으면 default profile이 사용되며 default=none 정책도 선택할 수 있습니다.",
      "include는 추가 profiles를 활성화하고 group은 logical profile을 fine-grained members로 확장합니다. active/include/group declarations는 profile-specific document나 on-profile activated document에 둘 수 없는 규칙을 지킵니다.",
      "dev/test/prod 하나에 모든 behavior를 넣으면 조합 test가 어렵습니다. db-mysql, mail-live, metrics처럼 capability를 분리하되 profile explosion을 막는 approved groups와 compatibility matrix를 둡니다.",
      "@Profile은 bean definition 자체를 조건부로 만듭니다. 설정 값만 달라지는 경우는 typed property가 더 명확할 수 있고, profile로 security를 끄는 위험한 default를 만들지 않습니다.",
      "활성 profiles 이름은 logs에 남길 수 있어도 tenant/customer/secret을 profile name에 넣지 않습니다. runtime evidence에는 sorted active/default/group expansion과 config release id를 기록합니다.",
    ],
    concepts: [
      c("active profile", "현재 Environment에서 profile expression과 profile-specific config/beans를 활성화하는 이름 집합입니다.", ["higher source가 active list를 바꿀 수 있습니다.", "sorted evidence로 기록합니다."]),
      c("default profile", "active profile이 하나도 없을 때 적용되는 fallback profile입니다.", ["기본 이름은 default입니다.", "none으로 비활성 정책을 둘 수 있습니다."]),
      c("profile group", "하나의 logical profile을 여러 fine-grained profiles로 확장하는 선언입니다.", ["non-profile-specific document에 정의합니다.", "조합 matrix를 줄입니다."]),
    ],
    codeExamples: [java("boot02-profile-groups", "profile group을 순환 없이 결정적으로 확장", "Boot02Profiles.java", "production group을 세부 profiles로 펼치고 sorted active set과 unknown count를 출력합니다.", String.raw`import java.util.*;

public class Boot02Profiles {
  static SortedSet<String> expand(Collection<String> requested, Map<String, List<String>> groups) {
    var result = new TreeSet<String>();
    var queue = new ArrayDeque<>(requested);
    while (!queue.isEmpty()) {
      var profile = queue.removeFirst();
      if (!result.add(profile)) continue;
      groups.getOrDefault(profile, List.of()).forEach(queue::addLast);
    }
    return result;
  }
  public static void main(String[] args) {
    var groups = Map.of("production", List.of("proddb", "metrics"));
    var active = expand(List.of("production"), groups);
    System.out.println("active=" + active);
    System.out.println("groupMembers=" + groups.get("production"));
    System.out.println("count=" + active.size());
  }
}`, "active=[metrics, proddb, production]\ngroupMembers=[proddb, metrics]\ncount=3", ["boot-profiles", "spring-profile-javadoc", "boot-external-config"] )],
    diagnostics: [
      d("--spring.profiles.active=prod 실행 뒤 include가 예상과 다르게 사라집니다.", "active list replacement, include processing과 property source/list merge semantics를 혼동했습니다.", ["각 source의 active/include/group declarations를 봅니다.", "sorted final profiles와 origin을 기록합니다.", "profile-specific document에 금지 declaration이 있는지 확인합니다."], "group을 non-profile-specific base document에 정의하고 activation contract test로 expected set을 고정합니다.", "지원 profile combinations를 CI matrix와 startup assertion으로 운영합니다."),
      d("prod profile 없이도 live mail/payment bean이 생성됩니다.", "안전하지 않은 bean이 default/unconditional configuration에 있고 @Profile/property condition이 fail-open입니다.", ["bean origin과 conditions를 확인합니다.", "active/default profiles를 봅니다.", "missing/unknown profile negative test를 실행합니다."], "live integration은 explicit opt-in condition과 required secret validation을 사용하고 safe fake/disabled default를 둡니다.", "non-prod가 live endpoints/credentials를 사용할 수 없는 network/IAM control도 적용합니다."),
    ],
    expertNotes: ["profile은 authorization boundary가 아니므로 prod profile 문자열만으로 민감 자원 접근을 허용하지 않습니다.", "조합 가능한 profiles는 pairwise/approved group tests와 invalid combination fail-fast가 필요합니다."],
  },
  {
    id: "profile-document-activation",
    title: "profile expression과 cloud-platform activation을 document-level 조건으로 검증합니다",
    lead: "spring.config.activate.on-profile은 profile expression이 맞을 때 document를 활성화하고 on-cloud-platform은 runtime platform 조건을 결합할 수 있습니다.",
    explanations: [
      "profile expression은 !, &, |와 괄호 의미를 가지며 단순 comma list와 같다고 가정하지 않습니다. 표현식을 사람이 읽을 수 있는 decision table과 positive/negative fixtures로 검증합니다.",
      "multi-document YAML에서 base defaults와 activated overrides를 가까이 둘 수 있지만 file이 커지면 origin/ownership이 흐려집니다. feature별 config file/import로 분리할지 변경 빈도와 owner를 기준으로 결정합니다.",
      "cloud platform detection은 Kubernetes 등 특정 environment 신호를 사용하지만 spoof/mis-detection 가능성과 local emulation을 고려합니다. 보안 정책을 platform detection 하나에 맡기지 않습니다.",
      "document activation 뒤에도 property source precedence가 적용됩니다. activated라고 무조건 최종 값이 되는 것이 아니라 다른 higher source가 override할 수 있습니다.",
      "활성화되지 않은 document의 잘못된 secret/default가 artifact에 존재하는 것 자체가 안전하지 않을 수 있습니다. 비활성 profile에 real production secret을 넣지 않습니다.",
    ],
    concepts: [
      c("profile expression", "active profile set에 대해 논리 연산으로 document/bean activation 여부를 계산하는 조건입니다.", ["truth table로 검증합니다.", "복잡성을 제한합니다."]),
      c("document activation", "ConfigData document가 profile 또는 cloud-platform condition을 만족할 때 property source로 참여하는 과정입니다.", ["precedence와 별도 단계입니다.", "origin을 기록합니다."]),
      c("cloud platform condition", "runtime environment가 특정 cloud platform으로 감지될 때 configuration document를 활성화하는 조건입니다.", ["보안 신뢰 root가 아닙니다.", "platform test가 필요합니다."]),
    ],
    diagnostics: [
      d("`prod & metrics`라고 썼는데 일부 환경에서 document가 활성화되지 않습니다.", "active set, expression parsing 또는 shell/YAML quoting을 확인하지 않았습니다.", ["sorted active profiles를 봅니다.", "raw expression의 parsed/quoted form을 확인합니다.", "모든 truth-table cases를 실행합니다."], "표현식을 단순화하고 quoted canonical syntax와 decision table tests를 둡니다.", "profile expression lint와 environment matrix test를 CI에 추가합니다."),
      d("Kubernetes 밖의 test에서 Kubernetes document가 켜집니다.", "platform detection 신호가 test environment에 우연히 존재하거나 programmatic override가 남았습니다.", ["CloudPlatform detection inputs를 봅니다.", "environment/property origins를 확인합니다.", "test harness의 injected variables/files를 inventory합니다."], "platform-specific config를 explicit test fixture와 condition으로 격리하고 fake signals를 cleanup합니다.", "target/non-target platform negative tests와 config fingerprint drift alert를 둡니다."),
    ],
    expertNotes: ["복잡한 activation expression은 configuration을 작은 프로그램으로 만들므로 code와 같은 review/testing을 요구합니다.", "platform-specific value와 secret provider binding은 분리해 detection이 secret 권한을 자동 부여하지 않게 합니다."],
  },
  {
    id: "relaxed-binding-environment-names",
    title: "kebab-case canonical key와 environment variable mapping·list index를 relaxed binding 규칙으로 연결합니다",
    lead: "ConfigurationProperties는 여러 naming form을 relaxed binding하지만 canonical key를 하나 정하고 environment variable 변환의 dash·underscore·index 손실을 test해야 합니다.",
    explanations: [
      "property files/YAML에서는 lower-case kebab-case를 canonical하게 사용합니다. Java field는 camelCase일 수 있고 environment variable은 대개 dot을 underscore로, dash를 제거하고 uppercase로 바꾸는 form을 사용합니다.",
      "list index는 environment variable name에서 underscore로 둘러싼 numeric token처럼 표현될 수 있습니다. nested map key에 특수문자가 있으면 bracket notation과 binding rules를 공식 문서로 확인합니다.",
      "relaxed binding은 오타를 모두 고쳐 주지 않습니다. 유사하지만 지원되지 않는 key가 무시되면 metadata completion, unknown-key lint와 binding tests가 필요합니다.",
      "환경변수 이름 충돌이 발생할 수 있습니다. 서로 다른 canonical keys가 dash 제거/uppercase 뒤 같은 name이 되지 않는지 schema review하고 flat secret provider keys와 mapping을 검증합니다.",
      "raw environment dump는 다른 process/runtime secrets를 노출할 수 있습니다. 필요한 key의 존재, origin과 type만 allowlist로 확인합니다.",
    ],
    concepts: [
      c("relaxed binding", "kebab-case, camelCase와 environment-style 이름을 ConfigurationProperties target에 정규화해 binding하는 Boot 규칙입니다.", ["모든 오타를 허용하지 않습니다.", "canonical naming을 유지합니다."]),
      c("canonical property name", "문서·metadata와 files에서 사용하는 lower-case kebab-case 중심의 대표 key 이름입니다.", ["environment form을 파생합니다.", "schema collision을 검토합니다."]),
      c("indexed binding", "list/array element 위치를 property path의 index로 표현해 structured collection에 binding하는 방식입니다.", ["environment form을 test합니다.", "list override semantics와 함께 봅니다."]),
    ],
    codeExamples: [java("boot02-env-name", "environment 변수 이름을 단순 canonical path로 변환", "Boot02EnvName.java", "숫자 token을 list index로, 나머지 underscore token을 lower-case path segment로 바꾸는 교육용 mapping을 실행합니다.", String.raw`import java.util.*;

public class Boot02EnvName {
  static String canonical(String environmentName) {
    var parts = environmentName.toLowerCase(Locale.ROOT).split("_");
    var result = new StringBuilder();
    for (var part : parts) {
      if (part.matches("\\d+")) result.append("[").append(part).append("]");
      else {
        if (!result.isEmpty()) result.append(".");
        result.append(part);
      }
    }
    return result.toString();
  }
  public static void main(String[] args) {
    System.out.println("server=" + canonical("SERVER_PORT"));
    System.out.println("list=" + canonical("MY_SERVICE_0_OTHER"));
    System.out.println("simple=" + canonical("APP_FEATURE_ENABLED"));
  }
}`, "server=server.port\nlist=my.service[0].other\nsimple=app.feature.enabled", ["boot-external-config", "boot-config-metadata", "jdk-locale"] )],
    diagnostics: [
      d("APP_RETRY_MAX_ATTEMPTS를 설정했는데 typed field가 default를 사용합니다.", "canonical prefix/key, environment mapping 또는 target field 이름이 일치하지 않습니다.", ["configuration metadata canonical key를 봅니다.", "property origin과 bound object를 redacted form으로 확인합니다.", "minimal binding test를 실행합니다."], "canonical kebab-case schema에서 environment name을 생성하고 deployment manifest key를 교정합니다.", "schema에서 env names를 자동 생성·검증하고 unknown/missing required keys를 fail-fast합니다."),
      d("두 설정 key가 같은 environment 변수 이름으로 충돌합니다.", "dash removal/uppercase 변환 뒤 canonical names가 동일해졌습니다.", ["전체 schema의 derived env names를 비교합니다.", "effective origin을 확인합니다.", "platform key normalization 제한을 봅니다."], "namespace/key naming을 바꿔 one-to-one mapping을 만들고 deprecated alias migration을 제공합니다.", "configuration metadata build에서 env-name collision 검사를 수행합니다."),
    ],
    expertNotes: ["예제 mapping은 규칙의 핵심을 보여 주는 model일 뿐 실제 Boot Binder의 dash/map/bracket edge cases를 대체하지 않습니다.", "환경 변수는 string transport이므로 type safety는 binding/validation 단계에서 확보합니다."],
  },
  {
    id: "configuration-properties-types-validation",
    title: "@ConfigurationProperties를 immutable type·단위·validation·metadata 계약으로 만듭니다",
    lead: "관련 keys를 typed object에 묶으면 conversion, validation, documentation과 tests를 중앙화할 수 있지만 registration, nested validation과 default 정책을 명시해야 합니다.",
    explanations: [
      "prefix별 properties class는 feature owner와 namespace를 표현합니다. record/constructor binding 또는 JavaBean style은 Boot version과 framework requirements에 맞추고 mutable global config로 남용하지 않습니다.",
      "Duration, DataSize, URI, enum과 collection은 raw long/string보다 의미와 unit을 명확히 합니다. suffix 없는 숫자의 default unit이 무엇인지 annotation/metadata로 명시하고 overflow·zero·negative 경계를 test합니다.",
      "Jakarta Bean Validation annotations와 @Validated로 required/range/pattern constraints를 startup에 적용할 수 있습니다. nested object validation과 cross-field invariants는 별도 validator/constructor에서 검증합니다.",
      "secret field도 typed binding 대상일 수 있지만 toString, record 자동 출력, exception message와 actuator configprops에 값이 노출되지 않게 wrapper/redaction을 설계합니다.",
      "configuration processor가 생성한 metadata는 IDE completion와 description/default/deprecation을 돕습니다. generated metadata와 manual additions를 artifact에서 검사하고 code constraints와 drift하지 않게 test합니다.",
    ],
    concepts: [
      c("@ConfigurationProperties", "공통 prefix 아래 external properties를 typed object graph에 binding하는 Boot annotation/contract입니다.", ["validation과 metadata를 결합할 수 있습니다.", "registration/scanning이 필요합니다."]),
      c("semantic type", "Duration, DataSize, URI처럼 값의 단위와 허용 연산을 자료형으로 표현한 configuration type입니다.", ["string parsing ambiguity를 줄입니다.", "경계값을 test합니다."]),
      c("configuration validation", "binding된 settings가 required/range/cross-field invariants를 만족하지 않으면 startup을 실패시키는 검증입니다.", ["secret을 message에 출력하지 않습니다.", "safe actionable key를 제공합니다."]),
    ],
    codeExamples: [java("boot02-validation", "Duration·URI·retry 설정의 cross-field validation", "Boot02Validation.java", "typed settings에서 positive timeout, HTTPS endpoint와 retry 범위를 검사해 safe error codes만 출력합니다.", String.raw`import java.net.URI;
import java.time.Duration;
import java.util.*;

public class Boot02Validation {
  record Settings(Duration timeout, URI endpoint, int retries) {}
  static List<String> validate(Settings value) {
    var errors = new ArrayList<String>();
    if (value.timeout().isZero() || value.timeout().isNegative()) errors.add("timeout-positive");
    if (!"https".equals(value.endpoint().getScheme())) errors.add("endpoint-https");
    if (value.endpoint().getUserInfo() != null) errors.add("endpoint-no-userinfo");
    if (value.retries() < 0 || value.retries() > 5) errors.add("retries-range");
    return errors;
  }
  public static void main(String[] args) {
    var valid = new Settings(Duration.ofSeconds(2), URI.create("https://api.example.test"), 3);
    var invalid = new Settings(Duration.ZERO, URI.create("http://user@example.test"), 9);
    System.out.println("valid=" + validate(valid));
    System.out.println("invalid=" + validate(invalid));
  }
}`, "valid=[]\ninvalid=[timeout-positive, endpoint-https, endpoint-no-userinfo, retries-range]", ["boot-external-config", "boot-config-metadata", "jakarta-validation", "jdk-duration", "jdk-uri"] )],
    diagnostics: [
      d("timeout=5가 5초라고 생각했지만 다른 unit으로 동작합니다.", "suffix 없는 number와 target/default unit을 문서화하지 않았습니다.", ["metadata와 target Duration/DataSize field를 봅니다.", "origin raw syntax를 값 노출 없이 확인합니다.", "unit별 binding test를 실행합니다."], "명시 unit suffix를 요구하고 semantic type과 range validation을 사용합니다.", "config lint가 unitless duration/data size를 차단하고 boundary fixtures를 유지합니다."),
      d("validation error에 full secret 또는 URL userinfo가 출력됩니다.", "constraint message/toString이 rejected value 전체를 포함합니다.", ["startup logs/error response와 crash reports를 검사합니다.", "record/toString/validator interpolation을 확인합니다.", "노출 credential을 rotate합니다."], "message는 property key와 safe constraint code만 포함하고 secret type의 출력/serialization을 금지합니다.", "negative validation tests가 logs에 canary secret이 없음을 검사합니다."),
    ],
    expertNotes: ["validation은 configuration correctness를 높이지만 external service reachability나 credential 권한을 모두 증명하지 않습니다.", "startup remote validation은 dependency outage와 startup coupling을 만들 수 있어 syntax/shape와 live probe의 phase를 구분합니다."],
  },
  {
    id: "collection-map-merge-overrides",
    title: "list replacement와 map merge를 profile/source override의 데이터 모델로 명시합니다",
    lead: "복합 property는 scalar처럼 element별로 자연스럽게 합쳐진다고 가정하면 다른 profile/source에서 stale entries와 index mismatch가 생깁니다.",
    explanations: [
      "Boot Binder의 list binding은 높은 source의 list가 낮은 list 전체를 대체하는 경우가 핵심입니다. index 0만 override하면 나머지가 유지될 것이라는 추측을 버리고 expected final list를 test합니다.",
      "map은 key별 entries가 여러 sources에서 결합될 수 있지만 같은 key는 높은 source가 override합니다. 값 object 내부 binding, null/empty와 case conversion edge를 실제 version에서 확인합니다.",
      "profile-specific list를 feature allowlist로 쓰면 누락/추가가 보안 behavior를 바꿉니다. set semantics가 필요하면 unique/sorted validation과 explicit full list를 사용합니다.",
      "environment variables로 큰 collections를 전달하면 naming과 diff/review가 어렵습니다. structured external file/config provider와 atomic versioned update를 고려합니다.",
      "collection size와 element length를 제한해 configuration bomb, memory/startup cost와 unbounded metric labels를 방지합니다.",
    ],
    concepts: [
      c("list replacement", "높은 precedence source에 list가 존재하면 낮은 source list와 element-wise merge하지 않고 선택되는 binding behavior입니다.", ["versioned docs/test로 확인합니다.", "전체 final list를 선언합니다."]),
      c("map merge", "여러 sources의 map entries가 key별로 결합되고 같은 key는 높은 source가 대체되는 binding behavior입니다.", ["nested values를 test합니다.", "key normalization을 고려합니다."]),
      c("collection bound", "설정 collection의 허용 element count, key/value length와 uniqueness를 제한하는 validation입니다.", ["resource abuse를 줄입니다.", "operator error를 빠르게 찾습니다."]),
    ],
    diagnostics: [
      d("prod profile에서 allowlist 한 항목만 바꿨더니 나머지가 사라집니다.", "list가 element merge된다고 가정했지만 higher source list가 전체를 대체했습니다.", ["각 source의 list와 origin을 봅니다.", "bound final object를 redacted snapshot으로 확인합니다.", "profile matrix binding test를 실행합니다."], "profile별 complete list를 명시하거나 map/set schema로 목적에 맞게 재설계합니다.", "모든 supported profile의 final collection snapshot/behavior를 test합니다."),
      d("잘못된 environment map key가 조용히 새 entry를 만듭니다.", "open-ended map에 allowed keys/metadata/validation이 없습니다.", ["effective map key set과 origins를 봅니다.", "canonical/env name mapping을 확인합니다.", "unknown key policy를 검사합니다."], "enum/typed fields 또는 allowed-key validator로 schema를 닫고 migration alias를 명시합니다.", "config CI가 unknown keys와 cardinality limits를 검사합니다."),
    ],
    expertNotes: ["collection merge behavior는 설정 API 설계의 일부이므로 client/operator 문서에 final semantics를 명시합니다.", "대규모 rules/data를 configuration property에 넣기보다 versioned domain data store와 validation/publish workflow를 고려합니다."],
  },
  {
    id: "secrets-configtree-rotation",
    title: "secret file/config tree를 source 분리·최소 권한·versioned rotation과 zero-leak 검증으로 운영합니다",
    lead: "환경 변수나 mounted file로 옮기는 것만으로 끝내지 않고 secret 생성, 전달, process read, refresh/restart, rotation, audit와 폐기 전체 수명을 설계합니다.",
    explanations: [
      "configtree: import는 directory의 files를 property keys/values로 읽어 Docker/Kubernetes mounted secrets와 결합할 수 있습니다. directory permissions, symlink/path, atomic update와 file encoding/newline semantics를 target platform에서 검증합니다.",
      "secret provider는 workload identity와 least privilege를 사용하고 build/CI가 production secret을 읽지 않게 합니다. environment별 namespace와 service account를 분리해 lateral movement를 줄입니다.",
      "rotation은 dual-version window가 필요할 수 있습니다. signing key는 old tokens 검증과 new tokens 발급 key를 구분하고 DB password는 new credential 배포→connections 전환→old revoke 순서를 조정합니다.",
      "reloadable configuration과 immutable startup configuration을 구분합니다. 값이 바뀌어도 existing connection pool/client가 자동 갱신되지 않을 수 있어 explicit refresh or rolling restart와 readiness를 설계합니다.",
      "logs, actuator, heap/thread dump, exception, metrics, traces와 support bundle을 canary secret으로 검사합니다. secret key/value를 label에 넣지 않고 version id와 rotation outcome만 bounded telemetry로 남깁니다.",
    ],
    concepts: [
      c("configuration tree", "directory 아래 file names를 keys, file contents를 values로 가져오는 ConfigData representation입니다.", ["mounted secrets와 결합합니다.", "filesystem security가 중요합니다."]),
      c("dual-version rotation", "old/new credential versions가 제한된 전환 기간 공존해 consumer cutover와 rollback을 허용하는 rotation 방식입니다.", ["발급/검증 역할을 구분합니다.", "old version 폐기 deadline이 필요합니다."]),
      c("zero-leak test", "synthetic canary secret이 모든 logs/artifacts/endpoints/support outputs에 나타나지 않는지 자동 검사하는 negative test입니다.", ["실제 secret을 test에 쓰지 않습니다.", "sink 전체를 포함합니다."]),
    ],
    codeExamples: [java("boot02-safe-fingerprint", "값 없이 config type·redaction fingerprint 생성", "Boot02Fingerprint.java", "sensitive key는 secret category로, non-secret 값은 boolean/integer/string type으로만 분류해 drift evidence를 만듭니다.", String.raw`import java.util.*;

public class Boot02Fingerprint {
  static String category(String key, String value) {
    var lower = key.toLowerCase(Locale.ROOT);
    if (lower.contains("password") || lower.contains("secret") || lower.contains("token")) return "secret:redacted";
    if (value.matches("-?\\d+")) return "integer";
    if (value.equals("true") || value.equals("false")) return "boolean";
    return "string";
  }
  public static void main(String[] args) {
    var config = new TreeMap<String, String>();
    config.put("app.feature.enabled", "true");
    config.put("db.password", "synthetic-not-a-real-secret");
    config.put("server.port", "8080");
    config.forEach((key, value) -> System.out.println(key + "=" + category(key, value)));
    System.out.println("keys=" + config.size());
  }
}`, "app.feature.enabled=boolean\ndb.password=secret:redacted\nserver.port=integer\nkeys=3", ["boot-external-config", "owasp-secrets", "kubernetes-secrets", "docker-secrets"] )],
    diagnostics: [
      d("secret file은 갱신됐지만 application은 오래된 credential로 계속 접속합니다.", "mounted file update와 bound bean/client/pool refresh lifecycle이 연결되지 않았습니다.", ["secret version/file inode·mtime과 process config version을 비교합니다.", "client/pool creation time과 refresh support를 봅니다.", "old credential last-used를 확인합니다."], "명시적 reload hook 또는 rolling restart로 new version을 bind하고 health/readiness 뒤 old version을 revoke합니다.", "rotation rehearsal가 provider→mount→bind→connections→revoke 전 단계를 검증합니다."),
      d("support bundle/heap dump에 secret이 포함됩니다.", "source file만 보호하고 memory, diagnostics와 exported artifacts의 sensitive data policy를 두지 않았습니다.", ["bundle/dump 생성·보관·접근 경로를 격리합니다.", "canary secret scan을 수행합니다.", "노출 credential을 rotate하고 audit합니다."], "diagnostic collection을 최소화·암호화·접근 통제하고 config values를 제외/redact합니다.", "zero-leak negative tests와 support artifact retention/deletion policy를 운영합니다."),
    ],
    expertNotes: ["Kubernetes Secret 객체 이름이 secret이라고 해서 etcd, RBAC, pod access와 backups가 자동 안전한 것은 아닙니다.", "JWT signing key rotation은 algorithm/key id/verification set/token lifetime과 clock skew를 함께 설계해야 하며 단순 문자열 교체가 아닙니다."],
  },
  {
    id: "configuration-metadata-deprecation",
    title: "configuration metadata와 deprecation alias로 설정 API를 versioning합니다",
    lead: "설정 key는 운영자와 배포 도구가 사용하는 public API이므로 rename/removal을 code field 변경처럼 처리하고 metadata에 type·description·replacement를 제공합니다.",
    explanations: [
      "configuration processor는 @ConfigurationProperties에서 META-INF/spring-configuration-metadata.json을 생성해 IDE completion, types, defaults와 descriptions를 제공합니다. artifact에 metadata가 실제 포함됐는지 검사합니다.",
      "description은 field 의미와 unit/constraints를 설명하고 secret example/default를 쓰지 않습니다. runtime에 결정되는 default를 metadata에 거짓으로 고정하지 않습니다.",
      "deprecated key는 since, reason과 replacement를 제공하고 제한된 compatibility window에서 old→new alias를 지원합니다. old/new가 함께 있으면 conflict policy와 warning을 값 없이 기록합니다.",
      "error-level metadata deprecation은 더 이상 bind되지 않는 key를 IDE/tool에 알릴 수 있지만 runtime unknown-key policy와 별도일 수 있습니다. removal test와 migration checker를 둡니다.",
      "manual additional metadata는 processor가 추론하지 못하는 corner cases에 사용하되 generated metadata와 duplicate/drift하지 않게 JSON parse/schema tests를 실행합니다.",
    ],
    concepts: [
      c("configuration metadata", "supported property groups/keys의 type, description, default와 deprecation 정보를 담는 jar metadata입니다.", ["IDE/tooling을 돕습니다.", "runtime validation을 대신하지 않습니다."]),
      c("deprecated property", "향후 제거될 설정 key이며 since, reason, replacement와 compatibility window를 제공하는 versioned API 상태입니다.", ["사용 여부를 telemetry로 봅니다.", "값은 기록하지 않습니다."]),
      c("property alias", "migration 기간 old key를 new semantic field로 연결하는 compatibility mapping입니다.", ["conflict precedence를 정의합니다.", "deadline 뒤 제거합니다."]),
    ],
    diagnostics: [
      d("key를 rename한 뒤 production이 조용히 default로 시작합니다.", "old key alias/deprecation과 required validation 없이 field 이름만 바꿨습니다.", ["old/new origins와 metadata를 봅니다.", "binding/unknown key logs를 확인합니다.", "config fleet usage를 key presence만으로 집계합니다."], "compatibility alias와 warning/replacement를 제공하고 new key required validation·migration tooling을 배포합니다.", "설정 API change가 deprecation window와 fleet zero-usage gate를 통과해야 합니다."),
      d("IDE completion에는 key가 있지만 runtime에서 bind되지 않습니다.", "metadata가 code/runtime version과 drift하거나 registration/prefix가 다릅니다.", ["jar metadata와 loaded class version을 비교합니다.", "ConfigurationProperties registration/prefix를 봅니다.", "minimal binding test를 실행합니다."], "metadata를 같은 build에서 생성하고 stale manual entry를 제거해 artifact/runtime을 정렬합니다.", "artifact test가 metadata keys를 runtime binding fixtures와 대조합니다."),
    ],
    expertNotes: ["설정 key compatibility는 rolling deployment 중 old/new binaries가 같은 config를 읽는 기간까지 포함합니다.", "deprecated key 사용 metric은 raw value/tenant가 아니라 key id, application version과 count 같은 bounded labels로 제한합니다."],
  },
  {
    id: "diagnostics-sanitization-observability",
    title: "env·configprops·condition report를 최소 노출 진단과 drift telemetry로 사용합니다",
    lead: "설정 문제를 빠르게 찾으려면 effective origin과 binding 결과가 필요하지만 management endpoints와 verbose logs가 내부 topology와 credentials를 공개하지 않도록 접근·sanitization을 먼저 설계합니다.",
    explanations: [
      "Actuator env는 Environment properties, configprops는 @ConfigurationProperties binding 결과를 보여 줄 수 있으며 sanitization 정책이 적용됩니다. endpoint가 available해도 HTTP/JMX exposure와 access authorization을 별도로 구성해야 합니다.",
      "production에서 conditions/env/configprops를 public Internet에 노출하지 않습니다. 관리 network, strong authentication, least privilege, audit, rate limit과 response retention을 둡니다.",
      "sanitization key patterns에만 의존하면 예상 밖 key의 secret을 놓칩니다. schema sensitivity annotation/allowlist와 value-free default diagnostics를 사용하고 generic URL/userinfo도 민감하게 봅니다.",
      "configuration telemetry는 release/fingerprint, active profiles, missing/invalid/unknown count와 origin category 정도로 bounded합니다. full key/value, tenant와 file path를 metric labels에 넣지 않습니다.",
      "incident capture는 debug/trace logging enable window, approver, expected evidence, zero-leak scan과 disable/cleanup을 runbook에 둡니다. 영구 verbose logging으로 해결하지 않습니다.",
    ],
    concepts: [
      c("configprops endpoint", "ConfigurationProperties beans와 binding 정보를 진단하는 Actuator endpoint입니다.", ["sanitization 대상입니다.", "public exposure를 제한합니다."]),
      c("configuration drift", "승인 baseline과 runtime effective key/profile/origin/type state가 달라진 상태입니다.", ["값 없이 fingerprint로 비교합니다.", "intentional change와 incident를 구분합니다."]),
      c("bounded telemetry", "label values와 cardinality가 제한된 configuration 운영 지표입니다.", ["secret/raw key-value를 제외합니다.", "release/category 중심입니다."]),
    ],
    diagnostics: [
      d("env endpoint가 200으로 외부에서 접근됩니다.", "endpoint exposure와 access/security chain을 명시하지 않아 sensitive management surface가 공개됐습니다.", ["외부/내부 network에서 endpoint를 검사합니다.", "management exposure/access와 SecurityFilterChain order를 봅니다.", "access logs와 response caches를 조사합니다."], "즉시 endpoint를 차단하고 별도 관리망·최소 권한을 적용하며 노출 가능 credential을 rotate합니다.", "external attack-surface scan과 management endpoint allowlist test를 배포 gate로 둡니다."),
      d("config fingerprint metric cardinality가 폭증합니다.", "raw values, full file paths 또는 arbitrary profile/key sets를 labels로 사용했습니다.", ["series labels와 top cardinality를 봅니다.", "raw values/tenant identifiers 포함 여부를 검사합니다.", "monitoring cost와 ingestion limits를 확인합니다."], "label을 release, known category와 bounded outcome으로 줄이고 상세 evidence는 access-controlled artifact로 분리합니다.", "metric schema review와 cardinality budget/alerts를 운영합니다."),
    ],
    expertNotes: ["redacted endpoint도 bean names, class names와 configuration topology를 노출할 수 있어 접근 통제가 필요합니다.", "drift fingerprint hash에 low-entropy secret 값을 직접 넣으면 offline guessing 위험이 있어 key/type/origin categories 중심으로 구성합니다."],
  },
  {
    id: "config-contract-testing",
    title: "parser·binding·profile·origin·secret-negative tests를 계층화합니다",
    lead: "설정 검증은 YAML parse 한 번이 아니라 schema, source precedence, activation, binding constraints, context behavior와 packaged runtime을 서로 다른 속도로 시험합니다.",
    explanations: [
      "lint/parser tests는 indentation, duplicate keys와 forbidden plaintext patterns를 빠르게 찾습니다. 실제 Boot parser/version과 동일한 binding 결과를 보장하지 않으므로 context tests가 뒤따릅니다.",
      "ApplicationContextRunner 또는 작은 Boot context로 property sets마다 bean/condition/binding result와 startup failure를 검증합니다. positive뿐 아니라 missing, empty, malformed, boundary, conflicting old/new keys를 포함합니다.",
      "profile matrix는 approved groups와 invalid combinations를 모두 다룹니다. pairwise를 사용해 폭발을 줄이되 production group은 full integration과 packaged launch를 거칩니다.",
      "origin/precedence test는 classpath/external/env/command-line fixture를 격리해 final value와 selected source를 확인합니다. test-specific property sources가 결과를 가리지 않도록 별도 process smoke를 둡니다.",
      "secret-negative test는 synthetic canary가 Git diff, bootJar, test reports, stdout/stderr, logs, actuator and support bundle에 없음을 검사합니다. 실제 credential은 절대 fixture로 쓰지 않습니다.",
    ],
    concepts: [
      c("binding test", "property inputs를 typed configuration object에 binding하고 conversion/validation 결과를 검증하는 test입니다.", ["full application보다 빠를 수 있습니다.", "runtime Binder를 사용합니다."]),
      c("profile matrix", "지원 profile/group 조합과 invalid combinations의 expected beans/config를 정의한 test matrix입니다.", ["조합 폭발을 관리합니다.", "production path를 완전 검증합니다."]),
      c("secret-negative fixture", "실제 비밀이 아닌 식별 가능한 canary string으로 leakage sinks를 검사하는 test input입니다.", ["검사 뒤 폐기합니다.", "값을 production에 사용하지 않습니다."]),
    ],
    diagnostics: [
      d("binding unit tests는 통과하지만 java -jar에서 다른 profile/origin이 선택됩니다.", "test property sources와 working directory/external files가 packaged runtime과 다릅니다.", ["test와 runtime property source list를 비교합니다.", "working directory/config locations를 inventory합니다.", "별도 process origin evidence를 확인합니다."], "packaged artifact를 clean directory에서 explicit config release로 launch하는 integration test를 추가합니다.", "CI가 unmanaged files가 없는 ephemeral runtime에서 profile/origin matrix를 실행합니다."),
      d("secret scanner가 false positive가 많아 무시됩니다.", "실제 leak patterns와 synthetic canary, allowlist owner/expiry를 구분하지 않은 broad regex만 사용합니다.", ["finding types와 true/false positive를 sample review합니다.", "allowlist justification/expiry를 봅니다.", "high-confidence provider formats와 entropy evidence를 결합합니다."], "layered scanners와 canary negative tests를 사용하고 allowlist를 좁고 만료되게 관리합니다.", "secret incident drills와 scanner precision/recall review를 정기 수행합니다."),
    ],
    expertNotes: ["test가 secret 값을 assert하기 위해 failure output에 찍지 않도록 presence/hash comparison API를 사용합니다.", "configuration tests는 platform manifest/secret provider/IAM tests와 함께 있어야 end-to-end가 됩니다."],
  },
  {
    id: "deployment-drift-canary-rollback",
    title: "configuration을 binary·schema와 함께 canary하고 rollback compatibility로 운영을 닫습니다",
    lead: "같은 jar도 다른 config로 전혀 다른 application이 되므로 artifact digest와 configuration release/fingerprint를 한 deployment identity로 추적합니다.",
    explanations: [
      "deploy manifest는 artifact digest, config release, secret version references, profile group, schema/migration version을 묶습니다. raw secret이나 full config를 deployment annotation에 넣지 않습니다.",
      "preflight는 required keys/types, supported profiles, forbidden defaults, config location accessibility와 secret version existence를 확인합니다. live credential 사용 권한은 workload identity로 runtime에 제한합니다.",
      "canary에서 startup/binding errors, condition/bean drift, readiness, auth, downstream failure, latency/resource와 secret leak signals를 baseline과 비교합니다. configuration-only rollout도 동일 gate를 거칩니다.",
      "rollback은 이전 binary가 current config/schema/secret versions를 이해할 수 있어야 합니다. key rename은 alias window, secret rotation은 dual-version window, schema는 expand-contract로 backward compatibility를 확보합니다.",
      "incident 뒤 root cause, actual override chain, blast radius, rotation/revoke evidence와 prevention tests를 기록합니다. 비밀 값을 timeline이나 postmortem에 재인용하지 않습니다.",
    ],
    concepts: [
      c("deployment identity", "artifact digest와 config/schema/secret reference versions를 묶어 실제 실행 상태를 식별하는 정보입니다.", ["값을 포함하지 않습니다.", "rollback target을 명확히 합니다."]),
      c("configuration canary", "일부 instance/traffic에 새 configuration release를 적용해 behavior와 drift를 비교하는 rollout입니다.", ["binary canary와 같은 검증을 요구합니다.", "자동 rollback threshold가 필요합니다."]),
      c("compatibility window", "old/new binaries와 configs/secret versions가 함께 동작해 rolling deploy와 rollback을 허용하는 제한 기간입니다.", ["종료 기준이 필요합니다.", "stale usage를 관측합니다."]),
    ],
    diagnostics: [
      d("binary rollback 뒤 old version이 새 property key를 몰라 default로 동작합니다.", "설정 rename/removal에 alias와 compatibility window가 없었습니다.", ["old/new metadata와 bound origins를 비교합니다.", "deprecated key usage를 확인합니다.", "rollback config release 가능 여부를 봅니다."], "old/new key alias와 conflict policy를 제공하거나 binary와 config를 함께 atomic rollback합니다.", "upgrade/rollback matrix가 N/N-1 binaries와 config releases를 검증합니다."),
      d("config-only 변경이 fleet 일부에만 적용돼 behavior가 갈립니다.", "mutable file/provider update가 atomic/versioned하지 않고 instance별 refresh timing이 다릅니다.", ["instance별 config release/fingerprint를 봅니다.", "provider propagation/refresh events를 확인합니다.", "traffic outcomes를 release별로 비교합니다."], "immutable version reference와 progressive restart/refresh acknowledgment를 사용해 convergence를 확인합니다.", "fleet conformance가 100% 또는 승인 threshold에 도달해야 rollout을 완료합니다."),
    ],
    expertNotes: ["configuration refresh는 transaction처럼 모든 beans에 atomic하지 않을 수 있어 runtime reload 지원 범위를 좁힙니다.", "rollback이 불가능한 secret compromise에서는 forward rotation과 containment가 우선일 수 있습니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-build-gradle", repository: "D:/dev/springboot/MyProject01", path: "build.gradle", usedFor: ["configuration processor scope", "Boot 4.0.6/Java 21 baseline"], evidence: "2026-07-14 read-only audit: 51 lines, 1,839 bytes, SHA-256 A02F07F87FFE4643B08FD5AE91A5714B67261035287F03298778209AB8DA2FF1." },
  { id: "local-main-class", repository: "D:/dev/springboot/MyProject01", path: "src/main/java/com/study/myproject01/MyProject01Application.java", usedFor: ["configuration bootstrap owner", "root package"], evidence: "2026-07-14 read-only audit: 13 lines, 336 bytes, SHA-256 E4D34C3C4A47ED027D715FD1E2EFC0A444F537197930C43956872DC59C4D99D2." },
  { id: "local-application-yaml", repository: "D:/dev/springboot/MyProject01", path: "src/main/resources/application.yaml", usedFor: ["YAML key schema", "datasource/MyBatis/JWT namespaces", "plaintext-secret remediation"], evidence: "2026-07-14 read-only audit: 22 lines, 621 bytes, SHA-256 65F89F39F4416557F2A314D5450C4D29D79FC6A2750EF953C4A2CFAF3DD8369E. DB/JWT 관련 실제 값은 어느 공개 내용에도 복사하지 않았습니다." },
  { id: "boot-external-config", repository: "Spring Boot", path: "reference/features/external-config.html", publicUrl: "https://docs.spring.io/spring-boot/reference/features/external-config.html", usedFor: ["property source order", "ConfigData locations/imports", "relaxed binding", "collections", "configtree"], evidence: "2026-07-14 current official reference에서 external sources, precedence, locations, profile files, imports, binding과 configuration tree 규칙을 확인했습니다." },
  { id: "boot-profiles", repository: "Spring Boot", path: "reference/features/profiles.html", publicUrl: "https://docs.spring.io/spring-boot/reference/features/profiles.html", usedFor: ["active/default/include", "profile groups", "profile-specific restrictions"], evidence: "profile activation, groups와 active/include/group declarations의 document restrictions를 확인했습니다." },
  { id: "boot-config-metadata", repository: "Spring Boot", path: "specification/configuration-metadata/", publicUrl: "https://docs.spring.io/spring-boot/specification/configuration-metadata/", usedFor: ["generated metadata", "IDE support", "ConfigurationProperties processing"], evidence: "META-INF/spring-configuration-metadata.json의 목적과 generation source를 확인했습니다." },
  { id: "boot-metadata-format", repository: "Spring Boot", path: "specification/configuration-metadata/format.html", publicUrl: "https://docs.spring.io/spring-boot/specification/configuration-metadata/format.html", usedFor: ["metadata type/default", "deprecation since/reason/replacement/level"], evidence: "configuration metadata JSON groups/properties/deprecation format을 확인했습니다." },
  { id: "boot-actuator-endpoints", repository: "Spring Boot", path: "reference/actuator/endpoints.html", publicUrl: "https://docs.spring.io/spring-boot/reference/actuator/endpoints.html", usedFor: ["env/configprops/conditions", "access/exposure", "sanitization boundary"], evidence: "management endpoint availability, access와 exposure가 구분되고 env/configprops가 sanitization 대상임을 확인했습니다." },
  { id: "spring-environment", repository: "Spring Framework", path: "javadoc-api/org/springframework/core/env/Environment.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/env/Environment.html", usedFor: ["profiles", "property resolution", "Environment abstraction"], evidence: "Environment가 profiles와 property resolution을 모델링하는 공식 API임을 확인했습니다." },
  { id: "spring-profile-javadoc", repository: "Spring Framework", path: "javadoc-api/org/springframework/context/annotation/Profile.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Profile.html", usedFor: ["@Profile expression", "bean/config activation"], evidence: "@Profile의 component/config registration 조건과 profile expression semantics를 확인했습니다." },
  { id: "spring-property-sources", repository: "Spring Framework", path: "javadoc-api/org/springframework/core/env/PropertySources.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/env/PropertySources.html", usedFor: ["ordered property sources", "origin reasoning"], evidence: "ordered PropertySource collection API를 확인했습니다." },
  { id: "yaml-spec", repository: "YAML", path: "spec/1.2.2/", publicUrl: "https://yaml.org/spec/1.2.2/", usedFor: ["documents", "mappings/sequences/scalars", "anchors/aliases"], evidence: "YAML 1.2.2 specification의 information model과 document syntax를 확인했습니다." },
  { id: "jakarta-validation", repository: "Jakarta Bean Validation", path: "specifications/bean-validation/3.1/", publicUrl: "https://jakarta.ee/specifications/bean-validation/3.1/", usedFor: ["constraint validation", "nested/cross-field validation boundary"], evidence: "Jakarta Validation 3.1 specification과 API contract를 확인했습니다." },
  { id: "owasp-secrets", repository: "OWASP Cheat Sheet Series", path: "cheatsheets/Secrets_Management_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html", usedFor: ["secret lifecycle", "rotation", "least privilege", "logging avoidance"], evidence: "secret creation, rotation, revocation, auditing와 application consumption security guidance를 확인했습니다." },
  { id: "kubernetes-secrets", repository: "Kubernetes", path: "docs/concepts/configuration/secret/", publicUrl: "https://kubernetes.io/docs/concepts/configuration/secret/", usedFor: ["mounted secrets", "RBAC/storage caveats", "rotation environment"], evidence: "Kubernetes Secret의 pod delivery, access and protection considerations를 확인했습니다." },
  { id: "docker-secrets", repository: "Docker", path: "engine/swarm/secrets/", publicUrl: "https://docs.docker.com/engine/swarm/secrets/", usedFor: ["mounted secret files", "service access", "secret lifecycle"], evidence: "Docker Swarm secrets의 service delivery and rotation example boundary를 확인했습니다." },
  { id: "jdk-duration", repository: "Oracle Java SE 21", path: "java.base/java/time/Duration.html", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Duration.html", usedFor: ["typed timeout", "zero/negative validation"], evidence: "Duration의 immutable time-based amount API를 확인했습니다." },
  { id: "jdk-uri", repository: "Oracle Java SE 21", path: "java.base/java/net/URI.html", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URI.html", usedFor: ["typed endpoint", "scheme/userinfo inspection"], evidence: "URI syntax component와 accessor API를 확인했습니다." },
  { id: "jdk-locale", repository: "Oracle Java SE 21", path: "java.base/java/util/Locale.html", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Locale.html", usedFor: ["locale-stable key normalization"], evidence: "Locale.ROOT를 locale-insensitive normalization에 사용하는 API 근거를 확인했습니다." },
];

const session = createExpertSession({
  inventoryId: "boot-02-application-yaml-profiles", slug: "boot-02-application-yaml-profiles", courseId: "spring", moduleId: "spring-boot-rest-integration", order: 2,
  title: "application.yaml·환경변수·profile 설정 분리",
  subtitle: "원본 평문 설정을 값 없이 감사하고 ConfigData 우선순위·profile·typed binding·secret rotation·fleet rollback까지 증명합니다",
  level: "중급", estimatedMinutes: 90,
  coreQuestion: "같은 Boot artifact가 classpath YAML, external file, environment, command line과 profiles에서 어떤 effective configuration을 선택하며 이를 비밀 노출 없이 어떻게 검증·배포·되돌릴까요?",
  summary: "springboot/MyProject01의 build.gradle, application class와 application.yaml을 read-only로 감사합니다. 원본 YAML의 application/datasource/MyBatis/JWT key 구조는 학습 provenance로 사용하지만 실제 DB/JWT 값은 절대 복사하지 않고 즉시 rotation·history/artifact 범위 조사 대상으로 다룹니다. YAML documents/scalars, PropertySource precedence와 origin, ConfigData location/import, active/default/include/group profiles, document activation, relaxed binding/environment names, ConfigurationProperties semantic types/validation, list/map override, configtree secret rotation, metadata/deprecation, Actuator 최소 노출, contract tests와 config canary/rollback을 단계별로 연결합니다. 다섯 JDK 21 examples는 precedence, profile group, environment key, typed validation과 value-free fingerprint를 exact stdout으로 재현하며 실제 Boot Binder/ConfigData context tests와의 경계를 명시합니다.",
  objectives: ["원본 YAML의 key schema와 민감도를 실제 값 없이 감사하고 secret rotation을 계획한다.", "YAML document/scalar와 Boot ConfigData activation/precedence를 구분한다.", "classpath·external·environment·command-line override chain과 origin을 추적한다.", "active/default/include/group profile과 invalid combinations를 검증한다.", "relaxed binding, environment names, list/map override를 final object tests로 확인한다.", "ConfigurationProperties에 semantic types, validation, metadata/deprecation을 적용한다.", "configtree/provider secret의 injection·reload·rotation·zero-leak lifecycle을 운영한다.", "artifact+config deployment identity, canary, fleet convergence와 rollback compatibility를 증명한다."],
  prerequisites: [{ title: "Gradle, starter와 Spring Boot 자동 구성", reason: "dependency와 auto-configuration conditions가 external properties를 입력으로 사용한다는 구조를 알아야 config 변경이 bean graph를 어떻게 바꾸는지 설명할 수 있습니다.", sessionSlug: "boot-01-gradle-starter-autoconfig" }],
  keywords: ["application.yaml", "ConfigData", "PropertySource", "configuration origin", "spring.config.import", "profile group", "profile expression", "relaxed binding", "environment variable", "ConfigurationProperties", "Bean Validation", "configuration metadata", "configtree", "secret rotation", "Actuator", "configuration drift", "rollback"],
  topics,
  lab: {
    title: "원본 YAML을 값 노출 없이 versioned configuration·profile·secret rollout으로 전환하기",
    scenario: "sanitized fixture에서 모든 source/profile 조합의 effective origin과 typed binding을 검증하고 secret rotation, canary와 rollback evidence를 완성합니다.",
    setup: ["JDK 21", "원본과 호환되는 Gradle Wrapper", "격리된 Boot fixture", "synthetic canary secret", "원본 files read-only", "실제 production DB/credential 접근 금지"],
    steps: ["원본 세 파일의 hash와 key namespaces만 기록하고 values는 수집하지 않습니다.", "노출 가능 DB/JWT credentials를 revoke/rotate workflow와 history/CI artifact 범위 조사에 등록합니다.", "configuration schema에 type, required/default, sensitivity, owner, reload와 deprecation을 작성합니다.", "YAML lint/parser와 duplicate/scalar/document activation fixtures를 실행합니다.", "classpath/external/env/command-line sources를 격리해 precedence와 selected origin matrix를 검증합니다.", "active/default/include/group/profile-expression과 invalid combinations을 context tests로 실행합니다.", "ConfigurationProperties semantic types, ranges, cross-field invariants와 metadata artifact를 검사합니다.", "list/map override와 derived environment-name collision을 negative tests로 검증합니다.", "synthetic configtree secret을 bind/rotate하고 logs, Actuator, bootJar와 support outputs zero-leak을 검사합니다.", "artifact digest+config release+secret version reference로 canary하고 fleet convergence와 N-1 rollback을 rehearsal합니다."],
    expectedResult: ["실제 secret은 source, stdout, reports와 artifacts에 새로 나타나지 않습니다.", "각 effective key는 expected source/origin/type과 profile activation을 가집니다.", "missing/malformed/unknown/conflicting configuration은 safe actionable error로 fail-fast합니다.", "secret rotation 뒤 old version last-used가 0이고 all consumers가 new reference로 수렴합니다.", "config canary와 rollback이 binary/schema compatibility를 포함해 반복 가능합니다."],
    cleanup: ["disposable contexts/processes, external config dirs, env/system properties와 reports를 제거합니다.", "synthetic canary secrets와 mounted files를 revoke/delete하고 zero-leak scan 결과만 보존합니다.", "temporary Actuator exposure/trace logging을 원복합니다.", "원본 세 파일이 변경되지 않았음을 hash/status로 readback합니다."],
    extensions: ["custom ConfigData provider의 timeout/cache/last-known-good fault tests를 추가합니다.", "configuration metadata에서 environment manifest/schema를 생성합니다.", "fleet config fingerprint conformance와 automated rollback을 연결합니다.", "JWT signing key dual-version rotation과 token lifetime matrix를 별도 security lab으로 확장합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java examples를 실행하고 actual Boot에서 대응하는 Environment/Binder evidence를 표로 작성하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "value와 origin을 구분합니다.", "profile group expansion을 설명합니다.", "environment key model의 한계를 적습니다.", "typed validation error codes를 설명합니다.", "fingerprint가 secret value를 포함하지 않음을 확인합니다."], hints: ["model output을 Boot 보장이라고 쓰지 말고 disposable context에서 한 번 더 검증하세요."], expectedOutcome: "설정의 source→activation→binding→validation→redaction 흐름을 실행 증거로 설명합니다.", solutionOutline: ["precedence→profiles→naming→types→safe evidence 순서입니다."] },
    { difficulty: "응용", prompt: "원본 YAML을 안전한 base/profile/configtree 구조로 migration하는 implementation plan을 작성하세요.", requirements: ["실제 credential rotation을 첫 단계로 둡니다.", "base와 environment overrides를 최소화합니다.", "typed schema/validation/metadata를 작성합니다.", "profile groups와 invalid combinations을 정의합니다.", "secret provider/IAM/rotation을 설계합니다.", "origin/list/map tests를 추가합니다.", "Actuator 최소 노출과 zero-leak tests를 둡니다.", "config canary/fleet convergence/rollback을 포함합니다."], hints: ["sample file에 old 값을 복사하지 말고 invalid placeholders만 사용하세요."], expectedOutcome: "보안·재현성·운영 복구가 있는 configuration migration이 완성됩니다.", solutionOutline: ["rotate→schema→sources→profiles→binding→secrets→tests→rollout 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 Spring Boot configuration platform 표준을 작성하세요.", requirements: ["schema/metadata/deprecation 정책을 정의합니다.", "source precedence/location/import 정책을 둡니다.", "profile/group naming과 combination policy를 둡니다.", "secret provider/identity/rotation/zero-leak을 정의합니다.", "validation/unknown/list-map semantics를 정의합니다.", "diagnostic exposure/redaction/retention을 둡니다.", "deployment identity/canary/fleet conformance를 둡니다.", "N/N-1 compatibility와 incident response를 포함합니다."], hints: ["파일 포맷 표준이 아니라 configuration lifecycle 표준을 만드세요."], expectedOutcome: "개발부터 사고 복구까지 감사 가능한 configuration governance가 완성됩니다.", solutionOutline: ["API schema→delivery→activation→binding→observe→rotate→rollback 순서입니다."] },
  ],
  nextSessions: ["boot-03-rest-json-contract"], sources,
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["원본 application.yaml의 실제 datasource URL/account/password와 JWT signing material은 공개 내용에 복사하지 않았으며 structural namespaces와 remediation need만 사용했습니다.", "원본은 단일 YAML 중심이고 profile groups, imports, typed properties/validation, metadata deprecation, configtree rotation과 canary evidence가 충분하지 않아 current Spring Boot/Spring/Jakarta/YAML/OWASP/platform/JDK 공식 자료로 보강했습니다.", "원본 Boot application을 실제 credential/DB로 실행하지 않았으므로 effective property sources, binding 결과와 rotation outcome은 disposable fixture lab에서 검증해야 합니다.", "환경 변수·configtree·Actuator 운영 권고는 target deployment platform, Boot 4.0.6 versioned docs와 organization security policy에 다시 대조해야 합니다."] },
});

export default session;
