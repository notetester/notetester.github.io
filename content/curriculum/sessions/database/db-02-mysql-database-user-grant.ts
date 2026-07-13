import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });

function example(
  id: string,
  title: string,
  filename: string,
  purpose: string,
  code: string,
  output: string,
  sourceRefs: string[],
): DetailedCodeExample {
  return {
    id,
    title,
    language: "python",
    filename,
    purpose,
    code,
    walkthrough: [
      { lines: "1-5", explanation: "실제 MySQL server·계정·credential을 사용하지 않고 synthetic policy input을 선언합니다. 이 예제의 Python 결과를 MySQL 인증 성공 증거로 오해하지 않습니다." },
      { lines: "6-끝에서 4줄 전", explanation: "account identity, privilege set, role, TLS 또는 lifecycle 불변식을 결정적 함수로 계산합니다. secret 값과 개인정보는 생성·읽기·출력하지 않습니다." },
      { lines: "마지막 4줄", explanation: "정렬된 값과 stable 판정만 stdout에 출력해 문서의 기대 결과와 완전 일치시킵니다. 실제 배포 전에는 별도 격리 MySQL integration test가 필요합니다." },
    ],
    run: { environment: ["Python 3.11 이상", "외부 package 불필요", "MySQL server·network·credential 불필요"], command: `python -I -X utf8 ${filename}` },
    output: { value: output, explanation: ["고정된 synthetic policy를 사용하므로 출력은 실행 환경의 사용자·host·secret에 의존하지 않습니다.", "SQL 문자열은 교육용 plan이며 실제 적용 전 MySQL 8.4 test instance에서 syntax·effective grants·connection behavior를 검증해야 합니다."] },
    experiments: [
      { change: "필요 privilege 하나를 제거하거나 과도한 privilege 하나를 추가합니다.", prediction: "missing 또는 excess 집합이 바뀌며 policy gate가 실패합니다.", result: "권한 검토는 ALL/없음의 이분법이 아니라 실제 operation contract와의 set diff입니다." },
      { change: "host scope를 localhost에서 %로 넓힙니다.", prediction: "network에서 도달 가능한 client 범위가 넓어져 별도 firewall·TLS·monitoring 근거가 필요합니다.", result: "account host pattern 하나만으로 end-to-end network trust가 완성되지 않습니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "database-schema-boundary",
    title: "database·schema·owner 경계를 application 책임과 맞춥니다",
    lead: "CREATE DATABASE 한 줄은 이름 공간만 만드는 작업이 아닙니다. 문자 집합·collation·소유 팀·환경·backup·migration 책임의 시작점입니다.",
    explanations: [
      "MySQL에서 database와 schema는 실질적으로 같은 이름 공간으로 사용됩니다. 하지만 application architecture에서 schema boundary는 table 이름 충돌을 피하는 기능보다 중요합니다. 서로 다른 배포 주기, data owner, retention, 권한과 복구 단위를 한 database에 섞으면 최소 권한과 migration blast radius가 커집니다.",
      "database 이름에 dev·prod 같은 환경을 넣는 것만으로 격리되지 않습니다. server/cluster, network, cloud account, backup repository와 운영 credential까지 분리해야 accidental cross-environment write를 막습니다. application은 startup 시 기대 environment marker와 schema version을 확인하고 mismatch면 fail closed해야 합니다.",
      "default character set과 collation은 새 table·column의 비교·정렬·unique 의미에 영향을 줄 수 있습니다. utf8mb4를 선택했다는 사실만으로 case/accent sensitivity가 결정되지 않으므로 identifier, email, code, display text별 비교 정책을 명시합니다. 생성 후 default 변경이 기존 columns를 자동으로 같은 의미로 변환한다고 가정하지 않습니다.",
      "database 생성 권한은 migration service 또는 DBA 경계에 두고 runtime application 계정에는 주지 않습니다. runtime이 필요할 때마다 database/table을 만드는 설계는 compromised application의 권한을 schema 전체 파괴로 확대하고 immutable infrastructure·reviewed migration을 우회합니다.",
    ],
    concepts: [
      c("schema boundary", "같은 naming·ownership·migration·access·recovery 정책 아래 관리되는 database object의 경계입니다.", ["MySQL에서는 CREATE DATABASE와 CREATE SCHEMA가 같은 계열의 기능입니다.", "service boundary와 반드시 1:1일 필요는 없지만 owner와 change path는 하나로 설명돼야 합니다."]),
      c("collation", "문자열 비교와 정렬, 일부 unique 판정의 규칙입니다.", ["대소문자·accent·locale·version에 따라 결과가 달라질 수 있습니다.", "identifier와 display text가 같은 collation 요구를 갖는다고 가정하지 않습니다."]),
    ],
    codeExamples: [example(
      "db02-environment-schema-policy",
      "환경별 database 생성 plan을 policy로 검증하기",
      "schema_policy.py",
      "실제 CREATE DATABASE를 실행하지 않고 name·charset·collation·runtime DDL 금지 불변식을 판정합니다.",
      String.raw`from dataclasses import dataclass

@dataclass(frozen=True)
class DatabasePlan:
    name: str
    charset: str
    collation: str
    runtime_can_ddl: bool

plan = DatabasePlan("learning_prod", "utf8mb4", "utf8mb4_0900_ai_ci", False)
checks = {
    "environment-suffix": plan.name.endswith("_prod"),
    "full-unicode": plan.charset == "utf8mb4",
    "collation-explicit": bool(plan.collation),
    "runtime-ddl-denied": not plan.runtime_can_ddl,
}

sql = f"CREATE DATABASE {plan.name} CHARACTER SET {plan.charset} COLLATE {plan.collation}"
print("checks=" + ",".join(f"{name}:{str(value).lower()}" for name, value in checks.items()))
print("policy-pass=" + str(all(checks.values())).lower())
print("ddl=" + sql)
print("secret-material=none")`,
      "checks=environment-suffix:true,full-unicode:true,collation-explicit:true,runtime-ddl-denied:true\npolicy-pass=true\nddl=CREATE DATABASE learning_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci\nsecret-material=none",
      ["local-db-0122", "mysql-create-database", "mysql-charset"],
    )],
    diagnostics: [
      d("개발 application이 운영 database에 table을 만들었다.", "환경별 endpoint·credential·network가 분리되지 않았고 runtime 계정에 CREATE 권한이 있었습니다.", ["connection endpoint와 environment variables를 redacted 형태로 확인합니다.", "SHOW GRANTS 또는 관리 catalog에서 runtime DDL 권한을 봅니다.", "audit log에서 최초 CREATE statement와 deploy identity를 찾습니다."], "운영 write를 격리하고 runtime DDL을 revoke한 뒤 reviewed migration identity만 schema change를 수행하게 합니다.", "cloud/network/account separation과 startup environment assertion, destructive canary를 둡니다."),
      d("같은 이메일이 collation 변경 뒤 중복 또는 충돌한다.", "문자 비교 정책을 business key 계약 없이 database default에 맡겼습니다.", ["column별 actual charset/collation을 조회합니다.", "normalized key별 collision preview를 만듭니다.", "application normalization과 DB comparison을 비교합니다."], "canonical key 정책을 확정하고 collision을 해소한 뒤 online conversion과 unique 재검증을 단계화합니다.", "collation migration에 duplicate preflight와 dialect contract tests를 둡니다."),
    ],
    expertNotes: ["managed service에서 database 생성은 region·encryption key·HA·backup policy와 함께 provisioning code로 관리합니다.", "schema-per-tenant는 isolation을 높일 수 있지만 migration fan-out, connection pool, catalog 크기와 restore 단위 비용을 함께 측정합니다."],
  },
  {
    id: "account-user-host-identity",
    title: "MySQL account를 user 문자열이 아니라 user@host identity로 이해합니다",
    lead: "'app'@'localhost'와 'app'@'%'는 이름이 비슷해도 서로 다른 account입니다. authentication과 grant는 선택된 account row에 결합됩니다.",
    explanations: [
      "MySQL account identity는 user name과 client host 부분의 조합입니다. 같은 user name에 여러 host account가 있으면 connection source와 matching rule에 따라 선택되는 row가 달라질 수 있습니다. 따라서 ‘app 권한’을 묻지 말고 정확한 quoted account와 실제 connection path를 함께 기록합니다.",
      "host '%'는 편리한 universal trust가 아니라 넓은 후보 범위입니다. network firewall이 차단한다면 당장 접속되지 않을 수 있지만 계정 정책 자체는 넓습니다. 반대로 localhost account가 있더라도 container·VM에서 TCP로 접속하면 server가 보는 source가 localhost가 아닐 수 있습니다.",
      "account name을 따옴표 없이 user@host 한 token처럼 쓰거나 host를 생략하면 version별 기본·deprecated behavior에 기대게 됩니다. automation에서는 'user'@'host'를 항상 명시하고 catalog·SHOW CREATE USER·SHOW GRANTS에서도 같은 canonical 표현을 사용합니다.",
      "host pattern은 application tenant나 최종 사용자 authorization을 표현하지 않습니다. 하나의 application DB account 뒤에 여러 사용자가 있다면 row/operation 권한은 application security layer가 맡고, database account는 workload identity와 service boundary를 나타냅니다.",
    ],
    concepts: [
      c("MySQL account", "인증과 privilege가 결합된 'user'@'host' 조합입니다.", ["같은 user part라도 host part가 다르면 별도 account입니다.", "connection 때 server가 선택한 account와 CURRENT_USER()를 구분해 진단합니다."]),
      c("host scope", "어떤 client source가 account 후보와 일치할 수 있는지 나타내는 account identity 범위입니다.", ["network reachability·DNS·proxy/NAT와 함께 해석합니다.", "최소 범위를 선택하고 actual connection path로 검증합니다."]),
    ],
    codeExamples: [example(
      "db02-account-inventory",
      "user@host를 canonical inventory로 비교하기",
      "account_inventory.py",
      "host를 생략한 모호한 기록을 금지하고 intended account·source zone을 정확히 매핑합니다.",
      String.raw`from dataclasses import dataclass

@dataclass(frozen=True, order=True)
class Account:
    user: str
    host: str
    zone: str

accounts = [
    Account("learning_app", "localhost", "same-host-admin"),
    Account("learning_app", "10.20.30.%", "private-app-subnet"),
    Account("learning_migrate", "10.20.40.15", "migration-runner"),
]

canonical = [f"'{a.user}'@'{a.host}'" for a in sorted(accounts)]
broad = [name for name in canonical if "@'%'" in name]
print("accounts=" + ";".join(canonical))
print("zones=" + ";".join(f"{a.user}@{a.host}:{a.zone}" for a in sorted(accounts)))
print("broad-host-count=" + str(len(broad)))
print("host-omitted=false")`,
      "accounts='learning_app'@'10.20.30.%';'learning_app'@'localhost';'learning_migrate'@'10.20.40.15'\nzones=learning_app@10.20.30.%:private-app-subnet;learning_app@localhost:same-host-admin;learning_migrate@10.20.40.15:migration-runner\nbroad-host-count=0\nhost-omitted=false",
      ["mysql-account-names", "mysql-connection-access", "local-db-0122"],
    )],
    diagnostics: [
      d("권한을 부여했는데 application은 여전히 access denied가 난다.", "GRANT한 account와 실제 connection이 매칭한 user@host row가 다릅니다.", ["성공 가능한 session에서 USER()와 CURRENT_USER()를 비교합니다.", "exact SHOW GRANTS FOR 'user'@'host'를 확인합니다.", "proxy·NAT·container를 거친 server 관점 source를 확인합니다."], "실제 workload identity에 최소 host account를 만들고 중복·anonymous·legacy accounts를 정리합니다.", "integration test가 exact CURRENT_USER와 expected grants를 assertion하게 합니다."),
      d("localhost 계정만 만들었는데 원격 접속이 된다고 오해했다.", "client가 Unix socket인지 TCP인지, container/WSL/VM 경계를 구분하지 않았습니다.", ["client protocol과 resolved endpoint를 확인합니다.", "server general/audit connection source를 봅니다.", "localhost·127.0.0.1·host gateway 경로를 각각 test합니다."], "실제 topology를 문서화하고 각 path에 명시 account·TLS·firewall policy를 둡니다.", "배포 topology가 바뀔 때 DB connectivity contract test를 필수화합니다."),
    ],
    expertNotes: ["host matching에 DNS를 사용할 때 name resolution availability·spoofing·skip_name_resolve 설정을 함께 검토합니다.", "Kubernetes/mesh/NAT 환경에서는 pod IP를 account host allowlist로 관리하기보다 stable network identity와 TLS/proxy 경계를 설계할 수 있습니다."],
  },
  {
    id: "host-network-tls-layers",
    title: "host scope·firewall·TLS·server identity를 서로 다른 방어층으로 설계합니다",
    lead: "'%'를 쓰지 않는 것만으로 안전한 network가 되지 않고, port가 닫혀 있다는 사실만으로 credential·권한 위험이 사라지지도 않습니다.",
    explanations: [
      "접속에는 route와 firewall, server listener, account host match, authentication, TLS policy, privilege 검사가 순서대로 관여합니다. access denied와 timeout, certificate verify failure를 하나의 ‘DB 연결 안 됨’으로 묶지 않으면 어떤 방어층이 실패했는지 빠르게 찾을 수 있습니다.",
      "REQUIRE SSL은 account가 encrypted transport를 요구하게 하지만 client가 server identity를 검증하는 방식과는 별개입니다. client는 가능한 환경에서 VERIFY_IDENTITY 계열 설정과 신뢰할 CA, 정확한 server name을 사용해 중간자 공격을 줄입니다. 암호화만 되고 상대를 검증하지 않는 연결은 잘못된 endpoint와도 안전하게 암호화할 수 있습니다.",
      "private subnet도 자동 신뢰 영역이 아닙니다. compromised workload, lateral movement, misrouted peering을 고려해 security group을 source workload로 제한하고 DB account도 최소 privilege·TLS·rotation을 유지합니다. network와 database policy는 하나가 뚫렸을 때 다른 하나가 blast radius를 줄입니다.",
      "연결 진단 출력에 DSN 전체나 password를 남기지 않습니다. host·port·database·TLS mode·account alias·correlation id만 구조적으로 기록하고 credential은 secret manager reference와 version metadata로 추적합니다.",
    ],
    concepts: [
      c("secure transport", "client와 server 사이 data를 암호화하고, 설정에 따라 certificate chain과 server identity까지 검증하는 연결입니다.", ["encryption과 identity verification을 구분합니다.", "account REQUIRE, server policy, client ssl-mode가 함께 맞아야 합니다."]),
      c("defense in depth", "network·authentication·TLS·authorization·audit가 서로 다른 우회와 실수를 제한하는 다층 방어입니다.", ["private network만으로 broad DB privilege를 정당화하지 않습니다.", "한 층의 장애를 다른 층의 log와 test로 탐지합니다."]),
    ],
    codeExamples: [example(
      "db02-connection-policy",
      "연결 policy에서 reachability와 TLS identity를 분리하기",
      "connection_policy.py",
      "실제 socket을 열지 않고 production connection metadata에 필요한 fail-closed 조건을 평가합니다.",
      String.raw`from dataclasses import dataclass

@dataclass(frozen=True)
class ConnectionPolicy:
    private_endpoint: bool
    source_restricted: bool
    require_tls: bool
    verify_identity: bool
    secret_in_command: bool

policy = ConnectionPolicy(True, True, True, True, False)
checks = {
    "private-endpoint": policy.private_endpoint,
    "source-restricted": policy.source_restricted,
    "tls-required": policy.require_tls,
    "server-identity-verified": policy.verify_identity,
    "secret-not-in-command": not policy.secret_in_command,
}

print("checks=" + ",".join(f"{k}:{str(v).lower()}" for k, v in checks.items()))
print("policy-pass=" + str(all(checks.values())).lower())
print("diagnostic-fields=host,port,database,tls-mode,account-alias")
print("credential-output=redacted")`,
      "checks=private-endpoint:true,source-restricted:true,tls-required:true,server-identity-verified:true,secret-not-in-command:true\npolicy-pass=true\ndiagnostic-fields=host,port,database,tls-mode,account-alias\ncredential-output=redacted",
      ["mysql-encrypted-connections", "mysql-connection-access", "mysql-password-security"],
    )],
    diagnostics: [
      d("TLS를 켰는데도 client가 잘못된 DB endpoint에 연결됐다.", "암호화만 요구하고 CA/server hostname 검증을 하지 않았습니다.", ["client ssl-mode를 확인합니다.", "certificate SAN과 접속 hostname을 비교합니다.", "trust store provenance와 만료를 봅니다."], "VERIFY_IDENTITY 수준의 검증과 관리된 CA, 정확한 endpoint name을 사용합니다.", "certificate expiry·hostname mismatch·untrusted CA negative tests를 둡니다."),
      d("운영 DB timeout을 계정 권한 문제로 오진한다.", "network reachability 단계와 MySQL authentication 단계를 구분하지 않았습니다.", ["DNS resolve·route·TCP connect를 secret 없이 단계별 확인합니다.", "server listener와 security group log를 봅니다.", "handshake가 도달한 뒤에만 account error를 해석합니다."], "layer별 timeout과 error category를 구조화하고 runbook을 reachability→TLS→auth→privilege 순서로 만듭니다.", "synthetic connection monitor가 단계별 실패를 분류하게 합니다."),
    ],
    expertNotes: ["certificate rotation은 server/client trust overlap, pool reconnect, rollback window를 포함해 rehearsal합니다.", "database proxy를 쓰더라도 proxy-to-DB TLS·proxy IAM·session multiplexing과 transaction semantics를 별도로 검증합니다."],
  },
  {
    id: "authentication-secret-lifecycle",
    title: "CREATE USER를 secret 생성·전달·회전·폐기 workflow로 다룹니다",
    lead: "SQL 파일에 password를 적는 순간 source control, shell history, process list, CI log와 backup으로 secret이 복제될 수 있습니다.",
    explanations: [
      "원본 01_22.sql은 학습용 CREATE USER와 plaintext authentication string을 포함합니다. 공개 세션에서는 값을 복제하지 않고 [REDACTED]로만 다룹니다. 실제 운영에서는 IDENTIFIED BY RANDOM PASSWORD 같은 server-side 생성 기능, secret manager, one-time delivery 또는 workload identity를 사용해 사람이 static secret을 반복 입력하는 경로를 줄입니다.",
      "authentication plugin 선택은 client driver compatibility와 server policy에 연결됩니다. deprecated plugin에 고정하거나 hash 문자열을 임의 복사하지 않습니다. account metadata와 connector matrix를 inventory하고 upgrade staging에서 handshake를 검증합니다.",
      "secret rotation은 새 credential 생성만이 아니라 dual-credential 또는 coordinated cutover, connection pool 갱신, old credential revoke, failed authentication 관측과 rollback을 포함합니다. 긴-lived pool이 old session으로 계속 동작할 수 있으므로 새 connection 성공과 old credential 실패를 각각 확인합니다.",
      "migration·CI log에는 SQL statement와 command arguments가 남을 수 있습니다. secret을 command line에 직접 전달하지 않고 protected input/channel을 사용하며 debug tracing을 끕니다. audit에는 secret 값 대신 secret id, version, rotated_at, owner와 expiry만 남깁니다.",
    ],
    concepts: [
      c("credential lifecycle", "secret의 생성·저장·전달·사용·회전·폐기와 사고 대응 전체 과정입니다.", ["값을 아는 사람과 system을 최소화합니다.", "rotation success는 새 secret 성공과 old secret 거부까지 포함합니다."]),
      c("authentication plugin", "account credential을 검증하는 MySQL server/client protocol mechanism입니다.", ["connector compatibility와 migration plan이 필요합니다.", "authorization privilege와는 별도 단계입니다."]),
    ],
    codeExamples: [example(
      "db02-secret-safe-account-plan",
      "plaintext 없는 account bootstrap plan 만들기",
      "account_plan.py",
      "실제 secret을 생성하지 않고 random password·TLS·initial lock을 포함한 SQL plan과 redaction invariant를 확인합니다.",
      String.raw`account = "'learning_app'@'10.20.30.%'"
statements = [
    f"CREATE USER {account} IDENTIFIED BY RANDOM PASSWORD REQUIRE SSL ACCOUNT LOCK",
    f"GRANT SELECT, INSERT, UPDATE ON learning_prod.* TO {account}",
    f"ALTER USER {account} ACCOUNT UNLOCK",
]

forbidden = ["plain-password", "IDENTIFIED BY '"]
joined = "\n".join(statements)
safe = not any(token in joined for token in forbidden)

print("plan=" + " -> ".join(statements))
print("plaintext-present=" + str(not safe).lower())
print("initial-state=locked")
print("delivery=secret-manager-reference-only")`,
      "plan=CREATE USER 'learning_app'@'10.20.30.%' IDENTIFIED BY RANDOM PASSWORD REQUIRE SSL ACCOUNT LOCK -> GRANT SELECT, INSERT, UPDATE ON learning_prod.* TO 'learning_app'@'10.20.30.%' -> ALTER USER 'learning_app'@'10.20.30.%' ACCOUNT UNLOCK\nplaintext-present=false\ninitial-state=locked\ndelivery=secret-manager-reference-only",
      ["mysql-create-user", "mysql-password-management", "mysql-account-locking", "mysql-password-security"],
    )],
    diagnostics: [
      d("Git history에서 DB password가 발견됐다.", "CREATE USER 또는 connection command에 plaintext를 넣어 source control에 commit했습니다.", ["노출 commit·fork·CI artifact·log·cache 범위를 파악합니다.", "해당 account와 secret version의 사용처를 inventory합니다.", "audit에서 악용 흔적을 확인합니다."], "즉시 credential을 rotate/revoke하고 history rewrite만으로 해결됐다고 가정하지 않으며 affected consumers를 새 secret으로 전환합니다.", "secret scanning, protected injection, random password bootstrap과 pre-commit/CI gate를 둡니다."),
      d("password 회전 뒤 일부 instance만 access denied가 난다.", "pool/replica별 secret version 전환과 old credential 폐기를 원자적으로 가정했습니다.", ["instance별 secret version과 reconnect 시각을 확인합니다.", "connection pool lifetime을 봅니다.", "새/old auth failure metric을 분리합니다."], "dual window 또는 staged rollout으로 새 credential 성공을 확인한 뒤 pool을 drain하고 old credential을 폐기합니다.", "rotation rehearsal과 per-instance version telemetry를 운영합니다."),
    ],
    expertNotes: ["MFA와 certificate-based account는 자동 workload와 human admin account에 서로 다른 운영 모델이 필요합니다.", "break-glass credential은 평상시 locked/offline 보관하고 사용 승인·짧은 TTL·session recording·사후 rotation을 강제합니다."],
  },
  {
    id: "least-privilege-grant-scope",
    title: "GRANT를 필요한 operation과 object scope의 최소 집합으로 계산합니다",
    lead: "GRANT ALL은 학습을 빠르게 시작하게 하지만 runtime compromise가 schema 변경·삭제·다른 data 접근으로 번지는 폭을 크게 만듭니다.",
    explanations: [
      "privilege는 global, database, table, column, routine 등 scope와 operation 종류의 조합입니다. application user가 learning_prod의 특정 tables에서 SELECT·INSERT·UPDATE만 필요하다면 *.* ALL이나 database ALL은 요구보다 큽니다. migration과 runtime, read-only analytics, backup, monitoring identity를 나눕니다.",
      "최소 권한은 추측으로 privilege를 하나씩 추가하는 작업이 아닙니다. user story/API를 SQL operation과 objects로 mapping하고 integration test를 정상 operation과 금지 operation 모두에 실행합니다. permission denied가 날 때마다 broad grant를 추가하지 말고 exact statement와 missing privilege를 분류합니다.",
      "권한은 시간이 지나며 누적됩니다. feature가 삭제되거나 table owner가 바뀌어도 old grants가 남을 수 있으므로 desired manifest와 actual SHOW GRANTS/catalog를 정기 diff합니다. revoke는 사용 telemetry와 canary를 거쳐 hidden batch/reporting dependency를 찾습니다.",
      "WITH GRANT OPTION이나 CREATE USER 같은 privilege는 다른 identity에 권한을 확장하는 capability입니다. 일반 runtime에는 주지 않고 privileged automation도 승인·audit·short-lived credential로 제한합니다. stored routine DEFINER와 view security context도 간접 privilege path로 inventory합니다.",
    ],
    concepts: [
      c("least privilege", "identity가 현재 책임을 수행하는 데 필요한 최소 operation·object·시간 범위만 갖는 원칙입니다.", ["runtime과 migration privilege를 분리합니다.", "desired/actual diff와 negative tests로 지속적으로 검증합니다."]),
      c("privilege scope", "권한이 적용되는 global·database·table·column·routine 등 object 범위입니다.", ["같은 SELECT라도 *.*와 db.table의 blast radius가 다릅니다.", "dynamic privilege와 administrative capability는 data DML과 별도로 검토합니다."]),
    ],
    codeExamples: [example(
      "db02-least-privilege-diff",
      "요구 operation과 actual grant를 set diff하기",
      "least_privilege.py",
      "GRANT ALL 대신 API operation inventory에서 missing·excess privilege를 계산합니다.",
      String.raw`required = {
    "learning_prod.lesson:SELECT",
    "learning_prod.progress:SELECT",
    "learning_prod.progress:INSERT",
    "learning_prod.progress:UPDATE",
}
actual = required | {
    "learning_prod.lesson:DELETE",
    "learning_prod.*:CREATE",
}

missing = sorted(required - actual)
excess = sorted(actual - required)
policy_pass = not missing and not excess

print("required=" + ";".join(sorted(required)))
print("missing=" + (";".join(missing) or "none"))
print("excess=" + ";".join(excess))
print("policy-pass=" + str(policy_pass).lower())`,
      "required=learning_prod.lesson:SELECT;learning_prod.progress:INSERT;learning_prod.progress:SELECT;learning_prod.progress:UPDATE\nmissing=none\nexcess=learning_prod.*:CREATE;learning_prod.lesson:DELETE\npolicy-pass=false",
      ["mysql-grant", "mysql-privileges", "local-db-0122"],
    )],
    diagnostics: [
      d("취약한 read endpoint로 table이 DROP됐다.", "runtime account에 database/global ALL 또는 DDL 권한이 있었습니다.", ["exact CURRENT_USER와 SHOW GRANTS를 보존합니다.", "audit에서 destructive statement와 source request를 연결합니다.", "다른 schemas까지 같은 account가 접근 가능한지 봅니다."], "incident identity를 lock/rotate하고 runtime에서 DDL·administrative privileges를 revoke한 뒤 migration account를 분리합니다.", "negative integration test로 CREATE/DROP/GRANT가 거부되는지 검사합니다."),
      d("권한을 줄인 뒤 야간 batch만 실패한다.", "interactive API 기준으로만 required operations를 inventory해 hidden consumer를 놓쳤습니다.", ["query/audit telemetry를 시간대·account·object별 분석합니다.", "scheduler/report/backup jobs의 identity를 inventory합니다.", "shared account 때문에 consumer attribution이 불가능한지 봅니다."], "consumer별 identity를 분리하고 batch contract에 필요한 최소 grants만 부여합니다.", "desired grant manifest에 owner·consumer·expiry·last-used evidence를 둡니다."),
    ],
    expertNotes: ["row-level policy가 필요한 domain은 MySQL privilege만으로 충분한지 application/service boundary와 view/routine 설계를 검토합니다.", "privilege review는 sensitive columns, data export volume, inference risk와 query resource abuse까지 포함해야 합니다."],
  },
  {
    id: "roles-default-active",
    title: "role을 privilege bundle과 활성화 정책으로 관리합니다",
    lead: "여러 account에 개별 GRANT를 복제하면 drift가 커집니다. role은 책임 단위로 privilege를 묶지만 assignment와 activation을 별도로 검증해야 합니다.",
    explanations: [
      "role은 privilege 집합을 이름 붙여 여러 accounts에 부여하는 관리 단위입니다. learning_reader, learning_runtime_writer, learning_migrator처럼 job responsibility를 표현하고 environment별 object scope는 provisioning data로 분리합니다. 역할 이름이 ADMIN처럼 지나치게 넓으면 least privilege 논의를 가립니다.",
      "role이 account에 granted됐다는 사실과 session에서 active하다는 사실은 다를 수 있습니다. default role과 SET ROLE behavior를 명시하고 connection pool 초기화에서 effective role을 확인합니다. access test는 role assignment catalog뿐 아니라 새 session의 실제 operation 결과를 봅니다.",
      "role hierarchy는 재사용을 늘리지만 transitive privilege를 숨길 수 있습니다. cycle·broad parent·unexpected admin capability를 graph로 검사하고, review에는 direct와 inherited privileges를 펼친 effective set을 제공합니다.",
      "human operator는 업무에 따라 role을 일시 활성화하고 workload account는 고정 default role을 사용할 수 있습니다. privileged role activation은 approval·short TTL·ticket/correlation·audit와 결합해 standing access를 줄입니다.",
    ],
    concepts: [
      c("role", "privilege들을 직무·책임 단위로 묶어 account에 부여할 수 있는 named authorization principal입니다.", ["grant duplication과 drift를 줄입니다.", "assignment·default/active state·inheritance를 모두 검증합니다."]),
      c("effective privileges", "direct grants와 active roles의 inherited grants를 합쳐 현재 session이 실제 사용할 수 있는 권한 집합입니다.", ["desired role 이름만 보고 판단하지 않습니다.", "새 session과 pooled session의 activation 차이를 확인합니다."]),
    ],
    diagnostics: [
      d("role을 부여했지만 새 connection에서 table을 읽지 못한다.", "role이 default/active가 아니거나 pool session 초기화가 role을 활성화하지 않았습니다.", ["SHOW GRANTS와 active roles를 확인합니다.", "새 session과 기존 pooled session을 비교합니다.", "DEFAULT ROLE provisioning 순서를 봅니다."], "workload account에 의도한 default role을 설정하고 connection acceptance test에서 effective operation을 확인합니다.", "role assignment 후 반드시 fresh-session integration test를 실행합니다."),
      d("reader role이 예상 밖의 DELETE 권한을 갖는다.", "role hierarchy parent에 broad privilege가 추가되어 transitive하게 상속됐습니다.", ["direct/inherited grant graph를 펼칩니다.", "변경 commit과 approver를 찾습니다.", "같은 parent를 쓰는 모든 accounts의 blast radius를 계산합니다."], "broad parent를 분리하고 responsibility별 최소 roles로 재구성한 뒤 affected sessions를 재연결합니다.", "role graph cycle/broad privilege lint와 effective-set diff approval을 둡니다."),
    ],
    expertNotes: ["role 변경은 이미 열린 sessions에 언제 반영되는지 version behavior와 pool lifetime을 확인합니다.", "identity governance와 연결할 때 role owner, approval, recertification, expiry와 orphan account cleanup을 자동화합니다."],
  },
  {
    id: "verify-effective-access",
    title: "SHOW GRANTS와 positive·negative connection test로 effective access를 검증합니다",
    lead: "SQL이 오류 없이 실행됐다는 사실은 application 경로에서 원하는 account가 원하는 privilege만 갖는다는 증거가 아닙니다.",
    explanations: [
      "provisioning 후 exact account의 SHOW CREATE USER, SHOW GRANTS, default/active role과 TLS requirements를 수집하되 authentication strings와 sensitive metadata를 redacted합니다. desired manifest와 canonicalize해서 missing·excess·unexpected host account를 diff합니다.",
      "positive test는 application이 실제 사용하는 driver·protocol·network path로 SELECT/INSERT 같은 허용 operation을 수행합니다. negative test는 다른 schema read, DROP, GRANT, secret table access가 명시적으로 거부되는지 확인합니다. root로 test하고 runtime도 된다고 추론하지 않습니다.",
      "connection pool은 privilege·role·password 변경 전 session을 재사용할 수 있습니다. 새 connection, 기존 connection, drain/reconnect 뒤 결과를 구분해 propagation과 rotation을 확인합니다. test cleanup은 자신이 만든 synthetic rows와 objects만 제거합니다.",
      "실패 evidence에는 secret 없이 timestamp, environment, server identity, client version, resolved account, TLS mode, operation category, error code와 correlation id를 남깁니다. raw query parameter와 PII를 log에 포함하지 않습니다.",
    ],
    concepts: [
      c("positive authorization test", "허용해야 하는 identity·operation·object 조합이 성공하는지 검증하는 test입니다.", ["실제 driver와 network path를 사용합니다.", "test fixture와 cleanup ownership을 명확히 합니다."]),
      c("negative authorization test", "금지해야 하는 operation이 확실히 거부되는지 검증해 excess privilege를 찾는 test입니다.", ["DROP·GRANT·cross-schema read 같은 blast-radius operation을 안전한 isolated fixture에서 test합니다.", "error category와 resolved account를 증거로 남깁니다."]),
    ],
    diagnostics: [
      d("SHOW GRANTS는 맞는데 application 요청은 다른 권한으로 동작한다.", "확인한 account와 application pool이 resolve한 CURRENT_USER/active role이 다릅니다.", ["application connection에서 resolved account를 redacted telemetry로 확인합니다.", "pool config·secret alias·endpoint를 비교합니다.", "fresh connection과 existing session을 나눠 test합니다."], "workload별 account alias와 endpoint를 고정하고 acceptance test가 resolved identity를 assertion하게 합니다.", "configuration drift와 secret reference version을 deploy gate에 비교합니다."),
      d("권한 검증 test가 production data를 변경했다.", "isolated schema·synthetic fixture·transaction/cleanup 없이 real objects에 write했습니다.", ["test가 만든 row/object 범위를 즉시 식별합니다.", "audit와 backup으로 unintended mutation을 평가합니다.", "cleanup이 broad DELETE/DROP을 사용하는지 봅니다."], "격리 test database와 unique run id, owned fixture, narrow cleanup을 사용합니다.", "production negative tests는 read-only safe probes로 제한하고 destructive test는 ephemeral environment에서만 실행합니다."),
    ],
    expertNotes: ["authorization contract tests를 schema migration과 application release 양쪽 pipeline에서 실행하면 privilege drift를 더 빨리 찾습니다.", "audit log 접근 자체도 민감 privilege이며 tamper resistance, retention, time sync와 query access를 별도로 통제합니다."],
  },
  {
    id: "privilege-change-flush-semantics",
    title: "GRANT·REVOKE의 즉시 반영과 FLUSH PRIVILEGES의 실제 용도를 구분합니다",
    lead: "현대 account-management statement 뒤에 습관적으로 FLUSH PRIVILEGES를 붙이면 불필요한 administrative privilege와 implicit commit 위험을 가릴 수 있습니다.",
    explanations: [
      "MySQL 8.4에서 GRANT, REVOKE, CREATE USER 같은 account-management statements로 grant tables를 간접 변경하면 server가 변경을 인지합니다. system grant tables를 직접 INSERT/UPDATE/DELETE하는 방식은 권장되지 않으며 그때 reload가 필요할 수 있습니다. 원본의 FLUSH PRIVILEGES는 학습 당시 관행을 보여 주지만 항상 필요한 후속 문장으로 가르치지 않습니다.",
      "FLUSH PRIVILEGES는 RELOAD 또는 관련 administrative privilege를 요구하고 failed-login tracking reset 등 추가 효과를 가질 수 있습니다. 또한 FLUSH 계열은 implicit commit을 일으킬 수 있으므로 business transaction 안에 무심코 넣지 않습니다. 정확한 version 문서와 운영 목적을 확인합니다.",
      "권한 변경 효과는 열린 client session, active roles, prepared workflow와 product version에 따라 관찰 방식이 다를 수 있습니다. desired statement 성공만 보지 말고 fresh/existing session에서 positive·negative operations를 test합니다.",
      "grant table 직접 수정은 schema가 internal implementation이고 upgrade compatibility를 깨뜨릴 수 있어 금지합니다. 지원되는 account-management statements와 declarative provisioning tool을 사용하고 direct mutation을 audit policy로 탐지합니다.",
    ],
    concepts: [
      c("privilege reload", "server가 grant table 변경을 in-memory access control 상태에 반영하는 과정입니다.", ["지원 account-management statements는 변경을 server에 알립니다.", "direct grant-table DML은 권장되지 않으며 reload가 필요할 수 있습니다."]),
      c("implicit commit", "명시 COMMIT 없이도 특정 administrative/DDL statement가 현재 transaction 경계를 종료하는 동작입니다.", ["FLUSH 등 statement별 문서를 확인합니다.", "business DML transaction과 administration을 분리합니다."]),
    ],
    diagnostics: [
      d("GRANT 뒤 FLUSH PRIVILEGES가 access denied로 실패한다.", "GRANT 권한은 있지만 FLUSH에 필요한 administrative privilege는 없는 account로 불필요한 문장을 실행했습니다.", ["GRANT 자체 성공과 effective access를 test합니다.", "FLUSH를 넣은 이유와 version 문서를 확인합니다.", "account에 RELOAD를 추가하려는 변경의 blast radius를 검토합니다."], "지원되는 GRANT/REVOKE 뒤 불필요한 FLUSH를 제거하고 fresh-session access test로 검증합니다.", "SQL template lint로 account statements 뒤 무조건 FLUSH 관행을 탐지합니다."),
      d("관리 script 실행 중 business transaction이 예상보다 일찍 commit됐다.", "implicit commit statement를 같은 session/transaction에 섞었습니다.", ["statement 순서와 autocommit을 확인합니다.", "implicit commit 목록과 binary/audit log를 봅니다.", "부분 적용된 rows를 invariant query로 찾습니다."], "administrative statements를 별도 connection과 change workflow로 분리하고 business transaction을 복구합니다.", "transaction boundary test와 statement allowlist를 migration runner에 둡니다."),
    ],
    expertNotes: ["privilege cache/metadata behavior는 version upgrade release notes와 staging test로 재검증합니다.", "skip-grant-tables 같은 emergency mode 사용 후에는 정상 authentication 복원·credential rotation·audit와 restart policy를 runbook에 포함합니다."],
  },
  {
    id: "account-lifecycle-revoke-drop-definer",
    title: "account 생성부터 lock·rotation·revoke·drop·orphan object까지 수명 주기를 닫습니다",
    lead: "사용하지 않는 계정을 남겨 두거나 곧바로 DROP하면 각각 standing access와 DEFINER·ownership 장애라는 다른 위험을 만듭니다.",
    explanations: [
      "account onboarding은 owner, purpose, environment, host, roles/grants, TLS, credential mechanism, expiry, review date와 ticket을 가져야 합니다. 처음에는 ACCOUNT LOCK 상태로 만들고 provisioning·verification이 끝난 뒤 unlock하면 partial configuration exposure를 줄일 수 있습니다.",
      "offboarding은 먼저 traffic/usage를 확인하고 account lock으로 새 connection을 막은 뒤 pool drain, secret revoke, grants/roles revoke, dependent objects와 DEFINER references 이관, audit 보존, 최종 DROP 순서로 진행합니다. emergency incident에서는 빠른 lock·secret rotation과 forensic preservation을 우선합니다.",
      "stored routine, view, event, trigger의 DEFINER가 삭제 account를 가리키면 deployment나 실행이 깨지거나 orphan object가 남을 수 있습니다. DROP 전에 dependency query와 replacement definer/security model을 검토합니다. broad admin definer는 privilege escalation surface가 될 수 있습니다.",
      "휴면 account는 last-used가 없다는 이유만으로 즉시 삭제하지 않습니다. batch schedule, disaster recovery, seasonal job을 owner와 확인하되 owner 없는 account에는 expiry를 두고 recertification하지 않으면 lock되게 합니다.",
    ],
    concepts: [
      c("account recertification", "account의 owner·purpose·scope·last use·expiry를 주기적으로 재승인하는 governance 과정입니다.", ["owner 없는 account와 excess privilege를 줄입니다.", "human과 workload identity의 review 주기와 evidence가 다를 수 있습니다."]),
      c("DEFINER", "stored object가 실행될 security context를 지정할 수 있는 MySQL object metadata입니다.", ["account drop/rename과 dependency가 있습니다.", "invoker/definer 권한과 object body를 함께 review합니다."]),
    ],
    diagnostics: [
      d("퇴사자 또는 폐기 service 계정이 여전히 접속 가능하다.", "identity lifecycle event와 DB account inventory가 연결되지 않았습니다.", ["owner·last connection·grants·secret use를 확인합니다.", "shared account 사용 여부를 봅니다.", "dependent definers/jobs를 inventory합니다."], "account를 lock하고 secret을 revoke한 뒤 dependency를 이관하고 승인된 절차로 revoke/drop합니다.", "HR/service catalog event와 automated expiry·recertification을 연결합니다."),
      d("DROP USER 뒤 view 또는 routine이 실패한다.", "DEFINER dependency를 사전 조회·이관하지 않았습니다.", ["schema objects의 DEFINER를 검색합니다.", "SQL SECURITY와 required privileges를 검토합니다.", "replica/environment별 동일 dependency를 확인합니다."], "least-privileged managed definer 또는 invoker model로 안전하게 이관하고 object tests 후 account를 제거합니다.", "offboarding preflight에 definer dependency gate를 둡니다."),
    ],
    expertNotes: ["account rename은 identity semantics와 audit continuity, grants/definer behavior를 version별로 검증합니다.", "incident lock은 이미 열린 sessions를 자동 종료하지 않을 수 있으므로 session termination·pool drain·token/secret rotation을 함께 실행합니다."],
  },
  {
    id: "declarative-provisioning-audit-breakglass",
    title: "권한을 declarative manifest·diff·승인·audit·break-glass runbook으로 운영합니다",
    lead: "수동 SQL 한 번은 빠르지만 누가 왜 무엇을 바꿨고 실제 상태가 원하는 상태와 같은지 재현하기 어렵습니다.",
    explanations: [
      "desired manifest에는 account alias, exact user@host, roles/grants, TLS·lock·expiry, owner와 purpose를 secret 없이 기록합니다. pipeline은 actual state를 read-only로 수집·canonicalize하고 missing/excess diff를 preview한 뒤 승인된 change만 적용합니다. secret 값은 별도 secret manager lifecycle로 관리합니다.",
      "plan과 apply를 분리하고 destructive revoke/drop은 impact·last-used·dependency evidence와 별도 승인을 요구합니다. idempotent account statements의 warning을 무시하지 않고 unexpected existing account나 plugin drift를 policy failure로 분류합니다.",
      "audit log는 누가 어떤 administrative operation을 어느 ticket·deploy와 연결해 수행했는지 남깁니다. credential과 PII query values는 최소화/redact하고 time sync, retention, immutable export, access control과 incident search procedure를 갖춥니다.",
      "break-glass는 평상시 broad standing admin을 정당화하지 않습니다. 짧은 TTL의 별도 locked identity, 다중 승인, secure checkout, session recording, command scope, 사후 revoke/rotation과 review로 emergency access를 통제합니다.",
    ],
    concepts: [
      c("declarative access manifest", "원하는 account·role·privilege policy를 secret 없이 versioned data로 표현한 source of truth입니다.", ["actual state와 diff해 drift를 찾습니다.", "preview·approval·apply·readback을 분리합니다."]),
      c("break-glass access", "정상 경로 장애나 중대 incident에서 제한적으로 사용하는 비상 privileged access입니다.", ["짧은 TTL·승인·recording·사후 revoke가 필요합니다.", "상시 broad admin account를 대신하는 통제된 예외입니다."]),
    ],
    diagnostics: [
      d("IaC는 통과했지만 실제 DB에 수동 broad grant가 남아 있다.", "pipeline이 desired apply만 하고 actual drift readback과 excess revoke를 검증하지 않았습니다.", ["SHOW GRANTS/catalog를 canonical manifest와 diff합니다.", "manual change audit와 owner를 찾습니다.", "pipeline identity가 readback할 권한과 coverage를 확인합니다."], "excess grant를 영향 분석 후 revoke하고 continuous drift detection과 alert를 둡니다.", "모든 access change를 reviewed pipeline로 제한하고 out-of-band change에 expiry를 강제합니다."),
      d("incident 중 공용 root credential이 chat에 공유됐다.", "사전 설계된 break-glass checkout·승인·session 경로가 없어 ad hoc secret 공유로 대응했습니다.", ["노출 channel·참여자·log 범위를 파악합니다.", "root usage audit와 열린 sessions를 확인합니다.", "credential rotation과 evidence preservation을 계획합니다."], "공용 credential을 rotate하고 개인 귀속 short-lived break-glass flow로 전환합니다.", "분기별 emergency rehearsal과 접근 불가 scenario를 포함한 runbook test를 합니다."),
    ],
    expertNotes: ["GitOps access management에서도 controller compromise와 overly broad reconciliation identity를 threat model합니다.", "권한 변경 SLO는 속도뿐 아니라 unauthorized expansion 탐지 시간, revoke completion, audit completeness와 break-glass recovery 시간을 포함합니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-db-0122", repository: "local dbstudy snapshot", path: "dbstudy/01_22.sql", usedFor: ["CREATE DATABASE·CREATE USER·GRANT·host scope·FLUSH 원본"], evidence: "원본을 read-only로 감사했고 authentication string은 [REDACTED]로만 취급해 값·hash를 공개하지 않았습니다." },
  { id: "mysql-create-database", repository: "MySQL 8.4 Reference Manual", path: "CREATE DATABASE", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-database.html", usedFor: ["database/schema·charset·collation"], evidence: "MySQL database 생성 공식 문서입니다." },
  { id: "mysql-charset", repository: "MySQL 8.4 Reference Manual", path: "Database Character Set and Collation", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/charset-database.html", usedFor: ["default character set·collation"], evidence: "MySQL database 문자 정책 공식 문서입니다." },
  { id: "mysql-create-user", repository: "MySQL 8.4 Reference Manual", path: "CREATE USER", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/create-user.html", usedFor: ["account·random password·TLS·resource·lock options"], evidence: "MySQL account 생성 공식 문서입니다." },
  { id: "mysql-account-names", repository: "MySQL 8.4 Reference Manual", path: "Specifying Account Names", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/account-names.html", usedFor: ["user@host identity"], evidence: "MySQL account naming 공식 문서입니다." },
  { id: "mysql-connection-access", repository: "MySQL 8.4 Reference Manual", path: "Connection Verification", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/connection-access.html", usedFor: ["host matching·authentication stage"], evidence: "MySQL connection access 공식 문서입니다." },
  { id: "mysql-grant", repository: "MySQL 8.4 Reference Manual", path: "GRANT", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/grant.html", usedFor: ["object privilege·roles·scope"], evidence: "MySQL GRANT 공식 문서입니다." },
  { id: "mysql-privileges", repository: "MySQL 8.4 Reference Manual", path: "Privileges Provided by MySQL", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/privileges-provided.html", usedFor: ["static·dynamic privilege inventory"], evidence: "MySQL privilege 종류 공식 문서입니다." },
  { id: "mysql-roles", repository: "MySQL 8.4 Reference Manual", path: "Using Roles", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/roles.html", usedFor: ["role grant·default·activation"], evidence: "MySQL role 공식 문서입니다." },
  { id: "mysql-encrypted-connections", repository: "MySQL 8.4 Reference Manual", path: "Configuring Encrypted Connections", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/using-encrypted-connections.html", usedFor: ["REQUIRE SSL·client identity verification"], evidence: "MySQL TLS 공식 문서입니다." },
  { id: "mysql-password-management", repository: "MySQL 8.4 Reference Manual", path: "Password Management", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/password-management.html", usedFor: ["expiry·history·failed login·rotation"], evidence: "MySQL password lifecycle 공식 문서입니다." },
  { id: "mysql-account-locking", repository: "MySQL 8.4 Reference Manual", path: "Account Locking", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/account-locking.html", usedFor: ["ACCOUNT LOCK·UNLOCK"], evidence: "MySQL account lock 공식 문서입니다." },
  { id: "mysql-password-security", repository: "MySQL 8.4 Reference Manual", path: "End-User Password Security", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/password-security-user.html", usedFor: ["command line·log secret exposure"], evidence: "MySQL credential 취급 공식 문서입니다." },
  { id: "mysql-privilege-changes", repository: "MySQL 8.4 Reference Manual", path: "When Privilege Changes Take Effect", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/privilege-changes.html", usedFor: ["GRANT/REVOKE 반영·direct grant table 금지"], evidence: "MySQL privilege reload 공식 문서입니다." },
  { id: "mysql-flush", repository: "MySQL 8.4 Reference Manual", path: "FLUSH Statement", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/flush.html", usedFor: ["FLUSH PRIVILEGES·required privilege·implicit commit"], evidence: "MySQL FLUSH 공식 문서입니다." },
];

const session = createExpertSession({
  inventoryId: "db-02-mysql-database-user-grant",
  slug: "db-02-mysql-database-user-grant",
  courseId: "database",
  moduleId: "db-foundation-ddl",
  order: 2,
  title: "MySQL 데이터베이스·사용자·권한을 안전하게 구성하기",
  subtitle: "CREATE DATABASE·user@host·GRANT를 secret lifecycle, 최소 권한, TLS, 검증, 회수와 감사까지 닫힌 운영 계약으로 확장합니다.",
  level: "입문",
  estimatedMinutes: 720,
  coreQuestion: "application이 필요한 데이터 작업만 안전하게 수행하도록 database, account, network, credential과 privilege 경계를 어떻게 만들고 지속적으로 검증할까요?",
  summary: "원본 dbstudy/01_22.sql의 CREATE DATABASE, CREATE USER user@host, GRANT ALL과 FLUSH PRIVILEGES 흐름을 read-only로 감사하되 plaintext authentication string은 복제하지 않습니다. database/schema ownership과 collation, exact user@host identity, host·firewall·TLS 방어층, random password와 secret rotation, object-level least privilege, role activation, SHOW GRANTS와 positive/negative access test, 현대 account-management statements와 FLUSH PRIVILEGES의 차이, account lock·revoke·drop·DEFINER dependency, declarative drift control과 break-glass까지 연결합니다. 다섯 Python 예제는 실제 MySQL·credential 없이 policy를 exact output으로 검증하며, 최종 적용 증거는 격리 MySQL 8.4 integration environment에서 별도로 수집하도록 경계를 명시합니다.",
  objectives: [
    "MySQL database/schema boundary와 charset·collation·owner·environment 정책을 설명한다.",
    "MySQL account를 exact 'user'@'host' identity로 inventory하고 connection path와 연결한다.",
    "plaintext secret 없이 account를 bootstrap·전달·rotation·폐기하는 workflow를 설계한다.",
    "runtime·migration·read-only·admin responsibility별 최소 privilege와 role을 계산한다.",
    "network reachability, TLS encryption, server identity, authentication, authorization failure를 구분한다.",
    "SHOW GRANTS와 positive/negative tests로 desired·actual effective access를 검증한다.",
    "FLUSH PRIVILEGES 관행을 version별 실제 semantics와 implicit commit 위험으로 교정한다.",
    "account onboarding·recertification·lock·revoke·drop·DEFINER 이관·audit·break-glass를 운영한다.",
  ],
  prerequisites: [{ title: "관계 모델과 schema·instance", reason: "database boundary와 object privilege가 무엇을 보호하는지 이해해야 합니다.", sessionSlug: "db-01-relational-model" }],
  keywords: ["CREATE DATABASE", "CREATE USER", "GRANT", "REVOKE", "user@host", "least privilege", "role", "TLS", "credential rotation", "SHOW GRANTS", "FLUSH PRIVILEGES", "ACCOUNT LOCK", "DEFINER", "break-glass"],
  topics,
  lab: {
    title: "학습 서비스의 migration·runtime·reader 계정을 최소 권한으로 provisioning하기",
    scenario: "learning_prod database를 migration runner가 관리하고 API runtime은 lesson 조회와 progress 쓰기만, reporting job은 승인된 views 읽기만 수행합니다. 모든 연결은 private network와 server identity가 검증된 TLS를 사용하며 plaintext secret을 산출물에 남기지 않습니다.",
    setup: ["실제 production이 아닌 격리 MySQL 8.4 test instance를 준비합니다.", "synthetic schema와 rows만 사용합니다.", "secret manager 또는 random password bootstrap 경로를 준비하고 terminal/history logging을 점검합니다.", "desired access manifest, plan, apply, readback evidence를 분리합니다."],
    steps: [
      "database 이름·charset·collation·owner·backup·migration policy를 선언합니다.",
      "migration, runtime, reader accounts의 exact user@host와 network source를 정의합니다.",
      "accounts를 random password·REQUIRE SSL·ACCOUNT LOCK 상태로 생성하고 secret reference만 전달합니다.",
      "API endpoints와 batch queries를 operation/object matrix로 만들어 roles/grants를 계산합니다.",
      "migration·runtime·reader role을 부여하고 default/active role을 fresh session에서 확인합니다.",
      "VERIFY_IDENTITY 연결로 server certificate와 CURRENT_USER를 검증합니다.",
      "허용 SELECT/INSERT/UPDATE positive tests와 cross-schema read·DROP·GRANT negative tests를 실행합니다.",
      "desired manifest와 SHOW CREATE USER/SHOW GRANTS actual state를 redacted canonical diff합니다.",
      "password rotation, pool drain, old credential failure, account lock과 unlock을 rehearsal합니다.",
      "offboarding의 definer dependency·revoke·drop·audit·rollback/restore runbook을 검토합니다.",
    ],
    expectedResult: ["세 accounts의 effective privileges가 요구 operation과 정확히 일치합니다.", "negative tests는 모두 예상한 authorization category로 거부됩니다.", "TLS와 server identity, resolved account가 evidence에 남고 secret 값은 없습니다.", "account-management statements 뒤 불필요한 FLUSH PRIVILEGES가 없습니다.", "rotation·lock·revoke·definer 이관·break-glass 절차가 owner와 시간 기준을 가집니다."],
    cleanup: ["test accounts를 먼저 lock하고 dependent objects를 확인합니다.", "synthetic rows와 schema만 owned cleanup으로 제거합니다.", "test secrets를 revoke하고 local history/log에 값이 남지 않았는지 확인합니다.", "test instance를 종료하거나 network 접근을 차단합니다."],
    extensions: ["short-lived cloud/IAM authentication과 static password를 threat model로 비교합니다.", "role graph와 desired/actual grants를 CI policy로 검사합니다.", "certificate/secret 동시 rotation failure를 fault injection합니다.", "audit log를 immutable sink로 전달하고 unauthorized grant detection SLO를 측정합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 policy 예제를 다시 작성하고 각 판정이 어떤 MySQL integration test로 이어지는지 표로 만드세요.", requirements: ["secret·PII를 사용하지 않습니다.", "user@host를 항상 exact quoted form으로 기록합니다.", "required/actual privilege set diff를 만듭니다.", "TLS encryption과 identity verification을 구분합니다.", "stdout을 문서와 완전 일치시킵니다."], hints: ["Python 결과는 MySQL 성공 증거가 아니라 사전 policy evidence입니다.", "negative operation을 최소 하나씩 연결하세요."], expectedOutcome: "account·network·secret·grant policy를 결정적 test로 설명합니다.", solutionOutline: ["desired identity→policy calculation→exact output→MySQL test mapping 순서로 작성합니다."] },
    { difficulty: "응용", prompt: "원본의 dbuser@% + GRANT ALL + FLUSH 흐름을 최소 권한·TLS·rotation 가능한 test-environment provisioning으로 교정하세요.", requirements: ["원본 password 값을 복제하지 않습니다.", "host scope 선택 근거를 씁니다.", "runtime과 migration account를 분리합니다.", "GRANT ALL을 operation matrix로 치환합니다.", "불필요한 FLUSH를 제거하고 근거 문서를 연결합니다.", "positive/negative fresh-session tests를 작성합니다.", "rollback과 cleanup을 포함합니다."], hints: ["%를 바꾸는 것만으로 network policy가 완성되지는 않습니다.", "ACCOUNT LOCK으로 partial provisioning을 줄일 수 있습니다."], expectedOutcome: "원본 학습 가치를 보존하면서 production 방향의 안전한 account workflow가 완성됩니다.", solutionOutline: ["audit→threat→desired manifest→apply plan→readback→rotation/offboarding 순서로 구성합니다."] },
    { difficulty: "설계", prompt: "조직의 database access governance ADR과 break-glass runbook을 작성하세요.", requirements: ["human/workload/migration/backup identities를 분리합니다.", "role owner·approval·expiry·recertification을 정의합니다.", "secret/certificate lifecycle을 정의합니다.", "actual drift detection과 excess revoke gate를 설계합니다.", "DEFINER와 orphan dependencies를 다룹니다.", "audit retention·tamper resistance·privacy를 다룹니다.", "break-glass TTL·다중 승인·recording·사후 rotation을 포함합니다.", "권한 사고 대응 SLO와 rehearsal을 정의합니다."], hints: ["빠른 복구와 상시 broad access는 같은 것이 아닙니다."], expectedOutcome: "최소 권한을 배포 순간이 아니라 지속 운영 system으로 만드는 실행 가능한 ADR이 완성됩니다.", solutionOutline: ["identity classes→policy→provisioning→verification→lifecycle→incident→metrics 순서로 작성합니다."] },
  ],
  nextSessions: ["db-03-create-table-types-null-default"],
  sources,
  sourceCoverage: {
    filesRead: 1,
    filesUsed: 1,
    uncoveredNotes: [
      "inventory의 dbstudy/01_22.sql 한 파일을 모두 read-only로 확인했습니다.",
      "원본 CREATE USER authentication string은 값·hash·길이·재사용 여부를 공개하지 않고 [REDACTED]로만 취급했습니다.",
      "원본 GRANT ALL과 FLUSH PRIVILEGES는 historical learning evidence로 보존하되 최소 권한과 현대 statement 반영 semantics로 교정했습니다.",
      "Python exact examples는 policy simulator이며 실제 MySQL account 생성·network·credential·production data를 사용하지 않았습니다.",
    ],
  },
});

export default session;
