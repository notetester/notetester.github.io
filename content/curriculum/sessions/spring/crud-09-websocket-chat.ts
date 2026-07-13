import type { DetailedCodeExample, DiagnosticCase, SessionConcept, SessionSource } from "../../types";
import { createExpertSession, type ExpertTopic } from "../../session-builders/create-expert-session.ts";

const c = (term: string, definition: string, detail: string[], caveat?: string): SessionConcept => ({ term, definition, detail, caveat });
const d = (symptom: string, likelyCause: string, checks: string[], fix: string, prevention: string): DiagnosticCase => ({ symptom, likelyCause, checks, fix, prevention });
function java(id: string, title: string, filename: string, purpose: string, code: string, output: string, sourceRefs: string[]): DetailedCodeExample {
  const lines = code.split("\n").length;
  const a = Math.max(1, Math.floor(lines / 3));
  const b = Math.max(a + 1, Math.floor(lines * 2 / 3));
  return {
    id, title, language: "java", filename, purpose, code,
    walkthrough: [
      { lines: `1-${a}`, explanation: "JDK 21 crypto·concurrent collections·bounded queues로 WebSocket의 handshake와 connection/message 상태를 재현합니다." },
      { lines: `${a + 1}-${b}`, explanation: "정상 연결뿐 아니라 origin·revocation·slow consumer·duplicate·gap 입력을 deterministic policy에 통과시킵니다." },
      { lines: `${b + 1}-${lines}`, explanation: "사용자 메시지나 session token을 출력하지 않고 accept 값, count, sequence와 stable decision만 stdout으로 검증합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring/WebSocket server/browser/network/credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서의 예상 결과와 한 글자씩 일치해야 합니다.", "JDK-only 모형은 실제 HTTP Upgrade, frame fragmentation/masking, proxy timeout, Spring container send와 distributed broker를 대신하지 않습니다."] },
    experiments: [
      { change: "origin·auth version·registry race·queue limit·message sequence를 한 항목씩 바꿉니다.", prediction: "연결 수락, close/deny, delivered order와 resume cursor가 명시된 정책대로 바뀝니다.", result: "stable decision, close category, pending bytes, ack와 duplicate/gap count를 비교합니다." },
      { change: "같은 matrix를 실제 WebSocket client, reverse proxy와 여러 application nodes에서 실행합니다.", prediction: "HTTP headers, fragmentation, concurrent send, network loss, proxy idle timeout과 broker ordering이 추가로 드러납니다.", result: "handshake status, frames, close code, reconnect convergence와 bounded telemetry를 기록합니다." },
    ], sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "http-upgrade-handshake",
    title: "HTTP Upgrade와 Sec-WebSocket-Accept를 연결 수락 전 검증 단계로 이해합니다",
    lead: "WebSocket은 별도 마법 포트가 아니라 HTTP 요청으로 시작해 101 Switching Protocols 이후 하나의 장기 양방향 연결로 전환됩니다.",
    explanations: [
      "client는 GET 요청에 Upgrade: websocket, Connection: Upgrade, Sec-WebSocket-Version: 13, 무작위 Sec-WebSocket-Key와 browser Origin을 보냅니다. server는 path, method, version, headers, origin, authentication과 capacity를 검증한 뒤에만 101을 반환합니다.",
      "Sec-WebSocket-Accept는 client key 문자열에 RFC GUID를 이어 SHA-1 digest 후 Base64한 값입니다. 이는 protocol handshake proof이지 password hash나 message integrity/authentication mechanism이 아닙니다.",
      "101 이후 같은 TCP/TLS 연결에서 양쪽이 독립적으로 frames를 보냅니다. HTTP URL/method/status 중심 모델에서 message type, room, sequence, correlation과 failure를 정의하는 application protocol로 책임이 이동합니다.",
      "Sec-WebSocket-Protocol은 client가 제안한 값 중 server가 지원하는 정확한 subprotocol/version을 하나 선택하는 negotiation입니다. 모르는 protocol을 묵인하면 서로 다른 JSON schema·authorization 의미가 같은 socket에서 충돌합니다.",
      "reverse proxy/load balancer는 Upgrade와 Connection을 전달하고 long-lived timeout, connection limits와 draining을 지원해야 합니다. 직접 접속 성공만으로 배포 topology의 handshake가 통과한다고 결론내리지 않습니다.",
    ],
    concepts: [
      c("opening handshake", "HTTP 요청과 응답으로 WebSocket protocol 전환 조건을 협상하는 단계입니다.", ["성공은 101입니다.", "origin/auth/capacity를 이때 검사합니다."]),
      c("Sec-WebSocket-Accept", "client key와 고정 GUID를 SHA-1/Base64해 server가 handshake를 이해했음을 증명하는 응답 값입니다.", ["RFC algorithm입니다.", "사용자 인증이 아닙니다."]),
      c("subprotocol", "WebSocket frames 위에서 사용할 application messaging protocol/version을 handshake에서 합의한 값입니다.", ["client 제안 중 선택합니다.", "schema와 compatibility를 고정합니다."]),
    ],
    codeExamples: [java("crud09-handshake", "RFC 6455 handshake accept와 origin allow-list", "Crud09Handshake.java", "RFC sample key의 accept 값을 계산하고 exact origin allow-list에서 trusted/untrusted 결과를 실행합니다.", String.raw`import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

public class Crud09Handshake {
  static String accept(String key) throws Exception {
    String magic = key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    byte[] digest = MessageDigest.getInstance("SHA-1").digest(magic.getBytes(StandardCharsets.ISO_8859_1));
    return Base64.getEncoder().encodeToString(digest);
  }
  public static void main(String[] args) throws Exception {
    Set<String> allowed = Set.of("https://learn.example");
    System.out.println("accept=" + accept("dGhlIHNhbXBsZSBub25jZQ=="));
    System.out.println("trusted-origin=" + allowed.contains("https://learn.example"));
    System.out.println("foreign-origin=" + allowed.contains("https://evil.example"));
    System.out.println("status=101");
    System.out.println("accept-is-authentication=false");
  }
}`, "accept=s3pPLMBiTxaQ9kYGzzhZRbK+xOo=\ntrusted-origin=true\nforeign-origin=false\nstatus=101\naccept-is-authentication=false", ["rfc6455", "spring-websocket-overview", "spring-websocket-server", "spring-origin-interceptor", "java-message-digest", "java-base64"] )],
    diagnostics: [
      d("직접 server 접속은 되지만 배포 URL은 200/400/502로 handshake가 실패합니다.", "proxy가 Upgrade headers를 전달하지 않거나 path/TLS/idle/HTTP version routing이 application과 다릅니다.", ["client request and response headers", "proxy Upgrade config", "application handshake logs", "TLS/SNI and route target"], "proxy에 explicit WebSocket upgrade·timeout·drain 설정을 적용하고 101 및 subprotocol을 end-to-end로 검증합니다.", "direct/proxy/CDN 경로별 valid/invalid version, headers, origin과 capacity handshake tests를 둡니다."),
    ],
    expertNotes: ["handshake SHA-1은 RFC protocol proof에 쓰이며 credential hashing에 SHA-1을 사용해도 된다는 뜻이 아닙니다.", "101 이전 실패는 HTTP status로, 101 이후 protocol 실패는 가능한 close frame/code로 표현합니다."],
  },
  {
    id: "origin-cookie-cswsh",
    title: "browser Origin 검증과 CSWSH 방어를 cookie 인증과 함께 설계합니다",
    lead: "browser WebSocket API는 일반 AJAX CORS와 다른 제약을 가지며, cookie가 자동 전송되면 악성 origin도 피해자 session으로 socket을 열 수 있습니다.",
    explanations: [
      "Cross-Site WebSocket Hijacking은 공격자 page가 피해자의 browser cookie를 이용해 application socket을 연결하고 messages를 주고받는 문제입니다. handshake path에 인증이 있다는 사실만으로 같은-origin이 보장되지 않습니다.",
      "browser client에는 Origin이 제공되므로 scheme+host+port의 exact allow-list와 TLS를 검증합니다. '*' 또는 suffix/substring 비교로 credentialed origins를 열지 않고 환경별 allowed origins를 versioned config로 관리합니다.",
      "Origin은 browser script 출처 방어 신호이며 non-browser client는 임의 값을 보낼 수 있습니다. 따라서 origin을 identity나 API client authentication으로 사용하지 않고 token/mTLS 등 별도 credential과 authorization을 둡니다.",
      "cookie session을 재사용하면 SameSite, Secure, HttpOnly와 CSRF/handshake token 전략을 Spring Security 정책과 맞춥니다. query token은 access log, history와 proxy에 새기 쉬우므로 짧은 one-time ticket 또는 안전한 protocol mechanism을 사용합니다.",
      "Spring WebSocket registration의 allowed origins와 HandshakeInterceptor를 사용해 handshake 전에 거부하고 SockJS fallback별 origin 지원 차이를 검증합니다. application message를 받은 뒤 origin을 확인하는 것은 너무 늦습니다.",
    ],
    concepts: [
      c("CSWSH", "악성 web origin이 피해자의 자동 전송 credential로 WebSocket을 열어 권한을 도용하는 공격입니다.", ["Origin 검증이 핵심입니다.", "message authorization도 필요합니다."]),
      c("Origin", "browser script를 시작한 scheme, host와 port를 나타내는 handshake header입니다.", ["exact allow-list로 검사합니다.", "non-browser identity가 아닙니다."]),
      c("one-time ticket", "짧은 만료와 한 번의 연결에만 사용할 수 있게 발급한 handshake credential입니다.", ["replay를 제한합니다.", "URL 노출을 피합니다."]),
    ],
    diagnostics: [
      d("다른 domain의 page에서 로그인 사용자의 chat socket이 성공적으로 연결됩니다.", "allowed origin이 '*'이거나 Origin을 검사하지 않고 session cookie만 인증했습니다.", ["handshake Origin and cookie", "allowedOrigins/patterns", "proxy header preservation", "CSRF/ticket policy"], "exact trusted origins와 TLS를 handshake에서 검사하고 cookie 정책·one-time connection ticket 및 per-message authorization을 적용합니다.", "trusted/foreign/null/spoofed origin과 browser/non-browser clients를 분리한 CSWSH integration test를 둡니다."),
    ],
    expertNotes: ["Host와 Origin은 역할이 다르며 forwarded headers를 신뢰할 proxy 목록 없이 조합하지 않습니다.", "origin 거부 로그에 full cookie/token/query를 남기지 않고 origin category와 decision만 기록합니다."],
  },
  {
    id: "handshake-message-authorization",
    title: "handshake authentication과 매 message·room authorization 및 철회를 연결합니다",
    lead: "연결 시 로그인했다고 수 시간 뒤 보내는 모든 message와 room subscription이 계속 허용되는 것은 아닙니다.",
    explanations: [
      "Spring Security를 쓰면 HTTP handshake의 Principal을 WebSocket session으로 전달할 수 있습니다. session registry에는 opaque connection id, principal id, auth version과 authorized scopes만 두고 credential 원문이나 client의 from field를 저장하지 않습니다.",
      "CONNECT 성공은 transport 사용 권한일 뿐 SEND/SUBSCRIBE/JOIN/ADMIN action 권한이 아닙니다. message마다 server-known principal과 destination/room/resource state를 평가하고 client가 보낸 sender/role/tenant를 덮어씁니다.",
      "Spring Messaging/STOMP를 사용하면 inbound destination과 message type에 AuthorizationManager rule을 적용하고 broker prefix로 client가 system topic을 사칭하지 못하게 default deny합니다. raw handler에서도 같은 typed policy를 직접 구현해야 합니다.",
      "role revoke, account lock, room ban과 resource deletion이 long-lived connection에 반영되도록 authVersion/security stamp를 주기적/critical action에서 확인하고 revoke event로 해당 connections를 close/unsubscribe합니다.",
      "권한 실패는 payload를 broadcast하기 전에 끝내고 stable error/close policy를 사용합니다. existence privacy가 필요한 room은 unauthorized와 nonexistent response를 외부에서 구분하지 않되 internal reason은 bounded audit에 남깁니다.",
    ],
    concepts: [
      c("handshake principal", "HTTP Upgrade 요청에서 인증되어 WebSocket session에 연결된 server-side identity입니다.", ["client sender field보다 우선합니다.", "credential을 저장하지 않습니다."]),
      c("message authorization", "각 inbound action과 destination/resource에 principal 권한을 평가하는 검사입니다.", ["connect authorization과 별도입니다.", "broadcast 전에 수행합니다."]),
      c("revocation event", "계정·room 권한 변경을 active connections에 전달해 cache/connection을 갱신하거나 닫는 사건입니다.", ["version을 포함합니다.", "중복·지연을 처리합니다."]),
    ],
    codeExamples: [java("crud09-authorization", "connection auth version과 room membership 재검증", "Crud09Authorization.java", "연결 당시 유효한 principal이 허용 room에 보낼 수 있지만 auth version 철회 뒤 같은 connection이 거부되는지 실행합니다.", String.raw`import java.util.*;

public class Crud09Authorization {
  record Connection(String principal, int authVersion, Set<String> rooms) {}
  static boolean allowed(Connection connection, String room, Map<String, Integer> current) {
    return Objects.equals(current.get(connection.principal()), connection.authVersion())
        && connection.rooms().contains(room);
  }
  public static void main(String[] args) {
    Map<String, Integer> versions = new HashMap<>();
    versions.put("learner", 8);
    Connection connection = new Connection("learner", 8, Set.of("study-room"));
    System.out.println("member-send=" + allowed(connection, "study-room", versions));
    System.out.println("other-room=" + allowed(connection, "admin-room", versions));
    versions.put("learner", 9);
    System.out.println("after-revoke=" + allowed(connection, "study-room", versions));
    System.out.println("client-sender-trusted=false");
    System.out.println("credential-stored=false");
  }
}`, "member-send=true\nother-room=false\nafter-revoke=false\nclient-sender-trusted=false\ncredential-stored=false", ["spring-websocket-security", "spring-websocket-session", "owasp-websocket", "java-set"] )],
    diagnostics: [
      d("room에서 추방한 사용자가 기존 socket으로 계속 message를 보냅니다.", "connect-time authentication만 확인하고 room membership/auth version을 message마다 또는 revoke event에서 갱신하지 않았습니다.", ["session principal/version", "inbound destination policy", "room membership source", "revoke delivery/close trace"], "server principal 기반 per-message authorization과 versioned revocation을 적용하고 stale connection을 close/unsubscribe합니다.", "join/send/subscribe/admin과 role/ban/delete 동시성 matrix를 active connection에서 실행합니다."),
    ],
    expertNotes: ["Spring Security가 주로 inbound channel을 보호하므로 subscription rule로 outbound data visibility를 제한합니다.", "connection close만으로 이미 다른 node/broker에 enqueue된 unauthorized message를 회수할 수 없으므로 publish 전 authorization과 version을 함께 둡니다."],
  },
  {
    id: "message-schema-input-limits",
    title: "WebSocket frame 위에 versioned message envelope·검증·rate와 비용 한도를 정의합니다",
    lead: "WebSocket protocol은 payload 의미를 정하지 않으므로 문자열을 그대로 broadcast하면 XSS, injection, impersonation과 무제한 resource 사용을 application이 떠안습니다.",
    explanations: [
      "envelope에는 protocolVersion, type, clientMessageId, roomId와 type별 body를 둡니다. server는 unknown version/type/field, missing/duplicate id와 invalid UTF-8/JSON을 거부하고 client timestamp·sender·authority를 신뢰하지 않습니다.",
      "frame size, reassembled message size, JSON depth/fields/string length, binary type, compression ratio와 messages/bytes per time window를 제한합니다. fragmentation과 permessage-deflate가 실제 처리 비용을 숨기지 않게 decompressed budget을 둡니다.",
      "validation은 syntax/schema 뒤 authorization, domain invariant, persistence 순서로 진행합니다. 실패 message는 broadcast/storage를 호출하지 않고 bounded error code 또는 close policy로 끝냅니다.",
      "chat text는 저장·전송 시 plain data로 취급하고 각 HTML/attribute/notification context에서 output encode합니다. HTML sanitizer를 쓰더라도 SQL/command/template injection과 URL preview fetch는 별도 안전 경계를 갖습니다.",
      "rate limiting은 connection만이 아니라 principal, room, tenant와 node 전체 capacity를 함께 봅니다. 순간 burst와 sustained rate, expensive message type, fan-out multiplier를 구분하고 overload 시 queue를 무제한 늘리지 않습니다.",
    ],
    concepts: [
      c("message envelope", "transport payload에 type, version, id와 routing metadata를 부여한 application protocol 구조입니다.", ["schema를 versioning합니다.", "sender는 server가 결정합니다."]),
      c("fan-out multiplier", "inbound 한 message가 몇 개의 outbound deliveries와 작업을 만드는지 나타내는 비용 배수입니다.", ["rate budget에 포함합니다.", "큰 room에서 커집니다."]),
      c("message budget", "frame/reassembled/decompressed bytes, parse depth, rate와 처리 시간을 제한한 계약입니다.", ["connection과 principal 단위입니다.", "초과 시 명시적으로 거부합니다."]),
    ],
    diagnostics: [
      d("짧은 inbound message 몇 개가 수천 outbound frames와 높은 CPU를 만듭니다.", "payload/schema 비용과 room fan-out을 고려하지 않은 connection-only rate limit과 무제한 parse/compression이 있습니다.", ["inbound vs outbound counts", "decompressed/parsed bytes", "room member cardinality", "queue/CPU duration"], "type별 size/parse/rate/fan-out budget과 bounded queues를 적용하고 expensive operations를 별도 quota로 분리합니다.", "fragmented, compressed bomb, deep JSON, many recipients와 burst/sustained load corpus를 둡니다."),
    ],
    expertNotes: ["WebSocket masking은 browser-to-server wire requirement이지 XSS나 application encryption이 아닙니다.", "validation error에 raw message를 반사하면 공격 payload와 개인정보가 다른 client/log로 확산될 수 있습니다."],
  },
  {
    id: "thread-safe-session-registry",
    title: "connection registry를 thread-safe ownership·snapshot·정확한 cleanup으로 만듭니다",
    lead: "TextWebSocketHandler는 여러 연결 callback을 동시에 받을 수 있으므로 ArrayList를 add/remove/iterate하면 race, ConcurrentModificationException과 stale session이 생깁니다.",
    explanations: [
      "로컬 EchoHandler는 singleton handler field의 ArrayList에 WebSocketSession을 추가하고 message마다 전체 list를 순회해 동일 payload를 보낸 뒤 close에서 제거합니다. echo 흐름 provenance는 분명하지만 collection과 send concurrency, failure cleanup이 보호되지 않습니다.",
      "ConcurrentHashMap<connectionId, SessionContext> 같은 registry로 atomic add/remove/lookup을 하고 broadcast는 weakly consistent snapshot semantics를 명시합니다. 같은 순간 join/leave가 현재 message를 받는지 product contract로 정합니다.",
      "afterConnectionClosed뿐 아니라 transport error, send failure, heartbeat timeout, authentication revoke와 node shutdown에서 동일 idempotent remove를 호출합니다. close callback이 오지 않는 비정상 경로를 lease/heartbeat로 회수합니다.",
      "registry entry에는 raw WebSocketSession 외에 principal id, authorized rooms, connectedAt, lastSeen, node와 bounded queue/close state를 둡니다. mutable context update는 atomic replacement 또는 narrow lock으로 불변식을 지킵니다.",
      "Concurrent collection은 session.sendMessage thread safety를 자동 보장하지 않습니다. registry concurrency와 각 connection outbound serialization/backpressure를 별도 component로 분리합니다.",
    ],
    concepts: [
      c("session registry", "active connection id를 server-side connection context와 대응시키는 동시성 자료구조입니다.", ["add/remove가 원자적입니다.", "room/node index와 일관성을 관리합니다."]),
      c("weakly consistent snapshot", "동시 변경 중에도 예외 없이 순회하지만 특정 시점의 완전한 snapshot을 보장하지 않는 관찰입니다.", ["broadcast membership 의미를 정합니다.", "정확한 delivery와 구분합니다."]),
      c("idempotent removal", "close/error/revoke가 여러 번 와도 같은 connection을 안전하게 한 번 제거하는 처리입니다.", ["secondary indexes도 정리합니다.", "metric double decrement를 막습니다."]),
    ],
    codeExamples: [java("crud09-registry", "ConcurrentHashMap connection registry", "Crud09Registry.java", "동시 map 기반 registry에 두 연결을 등록하고 snapshot·idempotent remove 후 count를 결정적으로 검증합니다.", String.raw`import java.util.*;
import java.util.concurrent.*;

public class Crud09Registry {
  record Session(String id, String principal) {}
  public static void main(String[] args) {
    ConcurrentMap<String, Session> registry = new ConcurrentHashMap<>();
    registry.putIfAbsent("c2", new Session("c2", "user-b"));
    registry.putIfAbsent("c1", new Session("c1", "user-a"));
    List<String> snapshot = registry.keySet().stream().sorted().toList();
    boolean removedFirst = registry.remove("c1") != null;
    boolean removedAgain = registry.remove("c1") != null;
    System.out.println("snapshot=" + snapshot);
    System.out.println("removed-first=" + removedFirst);
    System.out.println("removed-again=" + removedAgain);
    System.out.println("active=" + registry.size());
    System.out.println("array-list-shared=false");
  }
}`, "snapshot=[c1, c2]\nremoved-first=true\nremoved-again=false\nactive=1\narray-list-shared=false", ["local-echo-handler", "java-concurrent-map", "spring-websocket-handler", "spring-websocket-session"] )],
    diagnostics: [
      d("접속/종료가 겹칠 때 ConcurrentModificationException 또는 이미 닫힌 session이 계속 남습니다.", "singleton handler의 ArrayList를 여러 callback thread가 무보호로 변경·순회하고 error path removal이 없습니다.", ["registry type and bean scope", "callback thread traces", "all remove paths", "room/active metric consistency"], "ConcurrentMap registry와 idempotent cleanup을 사용하고 per-session sender를 분리하며 heartbeat lease를 둡니다.", "barrier join/leave/broadcast/send-fail/revoke와 duplicate close concurrency tests를 둡니다."),
    ],
    expertNotes: ["CopyOnWriteArrayList는 읽기 위주 소규모에는 가능하지만 join/leave copy cost와 per-room index를 측정합니다.", "active connection gauge는 registry size read 하나보다 add/remove event와 periodic reconciliation을 함께 사용합니다."],
  },
  {
    id: "serialized-send-backpressure",
    title: "connection별 send를 직렬화하고 bounded queue·slow-consumer 정책을 적용합니다",
    lead: "broadcast loop가 모든 WebSocketSession.sendMessage를 직접 호출하면 한 느린 client가 handler thread를 막고 여러 thread의 동시 send가 frame 순서를 깨뜨릴 수 있습니다.",
    explanations: [
      "Spring WebSocketSession API는 underlying standard session이 concurrent send를 허용하지 않을 수 있으므로 send를 동기화하거나 ConcurrentWebSocketSessionDecorator처럼 하나의 writer와 buffer/send-time limits를 둡니다.",
      "connection마다 pending message count뿐 아니라 encoded bytes를 제한합니다. queue가 가득 차면 newest/oldest drop, coalesce, disconnect(예: retry-later category) 중 message type별 정책을 정하고 silent unbounded buffering을 금지합니다.",
      "chat messages는 보통 drop보다 disconnect+resume 또는 durable fetch가 적합하고 presence/typing은 최신 값으로 coalesce할 수 있습니다. 모든 message에 하나의 overflow 전략을 적용하지 않습니다.",
      "broadcast producer는 enqueue 결과를 받고 accepted/rejected/closed를 집계하되 한 session 실패로 다른 sessions fan-out 전체를 중단하지 않습니다. 동시에 delivery guarantee를 성공 count와 혼동하지 않습니다.",
      "backpressure는 server queue만의 문제가 아닙니다. browser WebSocket API의 bufferedAmount, mobile network, proxy와 downstream broker를 측정하고 ingress rate를 fan-out egress capacity에 맞춰 admission control합니다.",
    ],
    concepts: [
      c("backpressure", "소비 속도보다 생산 속도가 빠를 때 생산을 제한하거나 버퍼·drop·close로 과부하를 전파하는 제어입니다.", ["queue를 bounded하게 둡니다.", "message type별 정책이 필요합니다."]),
      c("serialized send", "connection 하나의 outbound frames를 동시에 쓰지 않고 하나의 순서로 전송하는 규칙입니다.", ["thread safety와 ordering을 지킵니다.", "registry concurrency와 별도입니다."]),
      c("slow consumer", "server가 생성하는 outbound data를 합의된 시간·속도로 소비하지 못하는 connection입니다.", ["다른 사용자와 격리합니다.", "close/resume 정책을 둡니다."]),
    ],
    codeExamples: [java("crud09-backpressure", "byte-bounded per-session outbound queue", "Crud09Backpressure.java", "5-byte queue에 2-byte와 3-byte message는 들어가고 다음 1-byte message는 거부되어 close 1013 정책이 선택되는지 실행합니다.", String.raw`import java.nio.charset.StandardCharsets;
import java.util.*;

public class Crud09Backpressure {
  static final class Outbox {
    final int limit; int pending; boolean closed; final Queue<String> queue = new ArrayDeque<>();
    Outbox(int limit) { this.limit = limit; }
    boolean offer(String message) {
      int bytes = message.getBytes(StandardCharsets.UTF_8).length;
      if (closed || pending + bytes > limit) { closed = true; return false; }
      queue.add(message); pending += bytes; return true;
    }
  }
  public static void main(String[] args) {
    Outbox outbox = new Outbox(5);
    System.out.println("offer-aa=" + outbox.offer("aa"));
    System.out.println("offer-bbb=" + outbox.offer("bbb"));
    System.out.println("offer-c=" + outbox.offer("c"));
    System.out.println("pending-bytes=" + outbox.pending);
    System.out.println("close-code=1013");
    System.out.println("unbounded=false");
  }
}`, "offer-aa=true\noffer-bbb=true\noffer-c=false\npending-bytes=5\nclose-code=1013\nunbounded=false", ["spring-concurrent-session", "spring-websocket-session", "whatwg-websockets", "java-array-deque"] )],
    diagnostics: [
      d("한 느린 client 뒤 전체 room latency와 heap이 계속 증가합니다.", "handler thread가 sequential blocking send를 하거나 connection queue가 bytes/time limit 없이 커집니다.", ["per-session send duration", "pending messages/bytes", "broadcast worker utilization", "slow client close/drop events"], "connection별 serialized sender와 bytes/send-time limits를 두고 type별 coalesce/drop/disconnect+resume 정책을 적용합니다.", "한 slow consumer와 많은 정상 consumers를 함께 둔 load test에서 latency/heap isolation을 검증합니다."),
    ],
    expertNotes: ["close 1013 사용과 client retry 의미는 application protocol 문서에 고정하고 민감 reason 문자열을 보내지 않습니다.", "queue entry 수가 같아도 UTF-8/binary payload bytes가 크게 다르므로 encoded byte budget을 측정합니다."],
  },
  {
    id: "ordering-dedup-reconnect",
    title: "sequence·message id·ack와 resume cursor로 중복·gap·재연결을 수렴시킵니다",
    lead: "TCP는 한 연결의 byte 순서를 보장하지만 여러 producers/nodes, reconnect, retry와 broker redelivery까지 application message exactly-once를 보장하지 않습니다.",
    explanations: [
      "ordering scope를 connection, room, conversation, aggregate 중 하나로 명시하고 server-assigned monotonic sequence를 둡니다. wall-clock timestamp나 client time으로 total order를 만들지 않습니다.",
      "clientMessageId/idempotency key는 SEND retry의 중복 effect를 막고 serverMessageId/sequence는 delivery와 UI order를 식별합니다. 같은 id와 다른 payload는 conflict/security event로 처리합니다.",
      "client는 연속 sequence까지 ack/cursor로 보존하고 gap을 발견하면 bounded reorder buffer 또는 REST/history resync를 요청합니다. 무한히 missing message를 기다리지 않고 gap timeout/size를 둡니다.",
      "reconnect는 exponential backoff+jitter와 total deadline을 사용하고 server에 lastAck를 보냅니다. server는 retention window 안의 messages만 replay하고 너무 오래된 cursor에는 snapshot/full resync를 요구합니다.",
      "exactly-once delivery를 약속하기보다 at-least-once delivery에서 idempotent effect와 ordered projection을 만듭니다. persistence commit, broker publish와 socket send 사이의 unknown outcome은 durable outbox/history로 해소합니다.",
    ],
    concepts: [
      c("sequence", "정해진 ordering scope 안에서 server가 message에 부여하는 단조 증가 위치입니다.", ["timestamp와 다릅니다.", "gap/ack를 판단합니다."]),
      c("deduplication", "같은 operation/message id의 재처리를 감지해 effect를 한 번만 적용하는 처리입니다.", ["retention window가 필요합니다.", "같은 id 다른 payload를 거부합니다."]),
      c("resume cursor", "client가 연속으로 처리 완료한 마지막 위치를 나타내 재연결 replay 시작점을 정하는 값입니다.", ["ack semantics를 명시합니다.", "retention 밖이면 resync합니다."]),
    ],
    codeExamples: [java("crud09-ordering", "duplicate와 out-of-order gap을 수렴하는 sequence buffer", "Crud09Ordering.java", "1,2,duplicate 2,4,3 순서의 messages를 [A,B,C,D]로 적용하고 ack/resume cursor를 계산합니다.", String.raw`import java.util.*;

public class Crud09Ordering {
  record Message(int sequence, String value) {}
  public static void main(String[] args) {
    List<Message> input = List.of(new Message(1,"A"), new Message(2,"B"), new Message(2,"B-dup"), new Message(4,"D"), new Message(3,"C"));
    Map<Integer, String> pending = new TreeMap<>();
    List<String> applied = new ArrayList<>();
    int expected = 1, duplicates = 0;
    for (Message message : input) {
      if (message.sequence() < expected || pending.containsKey(message.sequence())) { duplicates++; continue; }
      pending.put(message.sequence(), message.value());
      while (pending.containsKey(expected)) applied.add(pending.remove(expected++));
    }
    System.out.println("applied=" + applied);
    System.out.println("duplicates=" + duplicates);
    System.out.println("buffered=" + pending.size());
    System.out.println("ack=" + (expected - 1));
    System.out.println("resume-from=" + expected);
  }
}`, "applied=[A, B, C, D]\nduplicates=1\nbuffered=0\nack=4\nresume-from=5", ["rfc6455", "java-tree-map", "owasp-websocket", "spring-websocket-overview"] )],
    diagnostics: [
      d("재연결 후 chat message가 중복되거나 시간 순서로 재정렬되어 대화가 뒤집힙니다.", "client timestamp를 ordering key로 쓰고 idempotency id, server sequence와 last-ack replay contract가 없습니다.", ["ordering scope and sequence owner", "client/server message ids", "ack/cursor persistence", "broker/node delivery traces"], "server sequence와 dedup store, contiguous ack와 bounded gap/resync를 구현하고 reconnect replay를 idempotent하게 만듭니다.", "duplicate, loss, 4-before-3, reconnect during send, stale cursor와 multi-node producer tests를 둡니다."),
    ],
    expertNotes: ["room-global sequence는 contention hotspot이 될 수 있어 필요한 ordering scope만 좁게 선택합니다.", "ack는 socket write, browser receive, UI apply, durable client store 중 어느 단계인지 protocol에 정확히 정의합니다."],
  },
  {
    id: "heartbeat-close-reconnect",
    title: "heartbeat·idle timeout·close handshake와 재접속 폭주를 운영 계약으로 만듭니다",
    lead: "모바일 network와 proxy는 TCP가 끊겨도 즉시 알리지 않을 수 있고, 모든 client가 동시에 재연결하면 장애 복구 중 server를 다시 압박합니다.",
    explanations: [
      "RFC ping/pong 또는 application heartbeat의 owner와 interval/timeout을 정합니다. message traffic이 충분하면 heartbeat를 생략할지, browser API가 protocol ping을 직접 노출하지 않는 제약 때문에 application message를 쓸지 client별로 결정합니다.",
      "lastSeen은 inbound frame/heartbeat와 successful outbound write 중 무엇으로 갱신하는지 정의합니다. 단순 wall-clock 한 번으로 끊지 말고 event-loop delay와 temporary network jitter를 허용하되 stale lease는 반드시 회수합니다.",
      "정상 종료는 close frame과 code를 교환하고 더 이상 data frame을 보내지 않습니다. 1000 정상, 1001 going away, 1008 policy violation, 1011 server error 등 protocol/application mapping을 문서화하고 1006은 wire로 보내는 code가 아님을 구분합니다.",
      "server deploy는 새 connection admission을 중지하고 readiness를 내린 뒤 clients에 going-away/retry hint를 주고 bounded drain deadline 후 종료합니다. registry, broker subscription과 queue를 idempotent cleanup합니다.",
      "client reconnect는 exponential backoff, random jitter, server Retry-After equivalent와 online/visibility 상태를 사용합니다. authentication failure나 policy close를 무한 retry하지 않고 token refresh/relogin 또는 terminal UI로 전환합니다.",
    ],
    concepts: [
      c("heartbeat", "장기 연결의 양 끝이 살아 있고 path가 동작하는지 주기적으로 확인하는 control/application 신호입니다.", ["timeout과 짝입니다.", "traffic/환경에 맞춥니다."]),
      c("closing handshake", "한 endpoint가 Close frame을 보내고 상대의 Close를 받아 연결을 질서 있게 종료하는 절차입니다.", ["code/reason을 제한합니다.", "이후 data를 보내지 않습니다."]),
      c("reconnect storm", "장애 뒤 많은 clients가 같은 시점에 재접속해 복구 중인 server를 다시 과부하시키는 현상입니다.", ["backoff+jitter로 완화합니다.", "admission control이 필요합니다."]),
    ],
    diagnostics: [
      d("node 재시작 순간 connections가 줄지 않고 재접속 요청이 폭증해 복구가 반복됩니다.", "graceful drain/heartbeat stale cleanup과 client backoff+jitter가 없고 load balancer가 종료 node에 계속 연결합니다.", ["readiness and new admissions", "close codes/drain duration", "reconnect attempt distribution", "registry stale lease"], "readiness→admission stop→1012/going-away policy→bounded drain 순서를 만들고 clients에 jittered backoff와 terminal close 분류를 적용합니다.", "rolling deploy, proxy idle, half-open, network flap과 mass reconnect load test를 둡니다."),
    ],
    expertNotes: ["heartbeat interval을 지나치게 짧게 하면 battery/network와 server timer 비용이 커지므로 failure detection SLO에서 역산합니다.", "close reason은 client에 노출되는 데이터이므로 stack trace, account 상태와 내부 node 정보를 포함하지 않습니다."],
  },
  {
    id: "multi-node-broker-architecture",
    title: "local broadcast를 room index·broker·presence와 delivery semantics로 확장합니다",
    lead: "node 메모리의 session list만 순회하면 같은 node 사용자에게만 전송되고 scale-out, restart와 rolling deploy에서 room 상태가 분열됩니다.",
    explanations: [
      "각 node는 자신이 소유한 connections와 per-session outbound queues만 관리하고 room message는 shared broker/pub-sub 또는 partitioned stream으로 전달합니다. global registry를 매 message마다 강한 일관성으로 복제하려 하지 않습니다.",
      "durable chat history와 ephemeral delivery/presence를 분리합니다. DB commit과 broker publish는 outbox로 연결하고 client reconnect는 durable history/cursor에서 복구하며 presence/typing loss는 최신 snapshot으로 수렴합니다.",
      "partition key를 room/conversation으로 두면 같은 partition 내 order를 얻지만 hot room이 bottleneck이 될 수 있습니다. shard/fan-out tree, rate/admission과 celebrity-room architecture를 workload로 선택합니다.",
      "presence는 connect/disconnect count만으로 정확하지 않습니다. principal의 여러 devices/tabs, heartbeat lease, node crash와 broker duplicate를 고려한 OR-set/lease 또는 approximate online semantics를 product에 설명합니다.",
      "broker delivery는 duplicate, delay, out-of-order와 redelivery를 가정합니다. event에 message id, room, sequence, auth/policy version과 trace correlation을 두되 raw content를 telemetry key로 사용하지 않습니다.",
    ],
    concepts: [
      c("connection ownership", "특정 application node가 socket과 outbound queue를 직접 관리하는 책임입니다.", ["broker는 socket을 쓰지 않습니다.", "node loss 때 lease가 만료됩니다."]),
      c("partition key", "broker에서 ordering과 load 분배 범위를 정하는 message key입니다.", ["room 단위가 흔합니다.", "hot partition을 고려합니다."]),
      c("presence lease", "heartbeat가 갱신되는 동안만 online으로 간주하고 node failure 뒤 자동 만료되는 임시 상태입니다.", ["정확도 한계를 설명합니다.", "여러 connection을 집계합니다."]),
    ],
    diagnostics: [
      d("같은 room인데 일부 사용자는 message를 받고 일부는 node에 따라 못 받습니다.", "broadcast가 local session list에만 의존하고 cross-node broker/subscription과 durable replay가 없습니다.", ["connection node ownership", "room broker subscriptions", "publish/consume traces", "history sequence/cursor"], "node-local registry와 shared room stream을 분리하고 outbox, idempotent consume, sequence replay와 subscription reconciliation을 구현합니다.", "2+ nodes에서 join/publish/node-kill/rebalance/duplicate/redelivery와 hot-room load tests를 둡니다."),
    ],
    expertNotes: ["sticky session은 reconnect 경로를 줄일 뿐 cross-node room broadcast와 node failure recovery를 해결하지 않습니다.", "presence를 보안 authorization 근거로 사용하지 않고 UX용 approximate 상태로 제한합니다."],
  },
  {
    id: "observability-testing-operations",
    title: "handshake부터 reconnect까지 protocol trace·privacy·chaos evidence로 검증합니다",
    lead: "HTTP access log는 101까지만 보여 주므로 message authorization, queue, sequence gap과 close 원인을 별도 관측하지 않으면 실시간 장애가 보이지 않습니다.",
    explanations: [
      "handshake metrics는 accepted/rejected reason, origin category, auth outcome, subprotocol, duration과 active capacity를 기록합니다. session id, cookie/token, full query, IP와 Origin의 사용자별 raw 값을 high-cardinality label로 넣지 않습니다.",
      "connection metrics는 active by bounded pool/node, age, heartbeat timeout, close code category와 reconnect attempt를 둡니다. message metrics는 type, allowed/denied, bytes, parse/handler latency, fan-out, queue/drop와 sequence gap을 집계합니다.",
      "payload logging은 기본 금지하고 synthetic message id·trace correlation과 schema/version만 사용합니다. content debug가 불가피하면 명시적 승인, redaction, 짧은 retention과 접근 감사가 있는 별도 secure channel을 사용합니다.",
      "unit tests는 handshake accept, policy, registry, queue와 sequence pure contracts를 검증합니다. 실제 integration은 browser/non-browser clients, fragmentation, binary/UTF-8, concurrent send, proxy, TLS, origin/auth, close와 reconnect를 실행합니다.",
      "load/chaos는 slow consumer, hot room, broker duplicate/partition, node kill, proxy idle, clock skew와 reconnect storm을 주입합니다. 성공률 하나보다 unauthorized deliveries 0, bounded heap/queue, convergence time와 message loss/duplicate contract를 검증합니다.",
    ],
    concepts: [
      c("protocol trace", "connection id correlation 아래 handshake, authorized message, sequence, queue와 close 사건을 payload 없이 연결한 관측 기록입니다.", ["logical connection/reconnect를 구분합니다.", "bounded fields를 사용합니다."]),
      c("delivery invariant", "권한 없는 전달 0, room sequence 수렴, queue bound처럼 부하·실패에도 유지해야 할 규칙입니다.", ["SLO보다 correctness에 가깝습니다.", "chaos에서 검증합니다."]),
      c("connection cardinality", "동시에 유지되는 sockets, room memberships와 per-connection state가 만드는 자원 규모입니다.", ["heap/FD/timers와 연결됩니다.", "admission capacity를 정합니다."]),
    ],
    diagnostics: [
      d("실시간 장애를 분석하려면 raw chat payload와 session token이 든 debug log를 켜야 합니다.", "protocol event·sequence·queue correlation이 없고 payload를 유일한 진단 수단으로 삼았습니다.", ["handshake/message/close telemetry", "payload/token logging", "trace and message ids", "retention/access"], "opaque connection/message correlation과 bounded type/reason/bytes/sequence metrics를 추가하고 raw payload/token을 제거·회전합니다.", "synthetic secret canary 0건과 handshake→send→fanout→ack→close/reconnect trace completeness를 CI에서 검사합니다."),
    ],
    expertNotes: ["close code 분포만 보지 말고 어떤 policy/queue/heartbeat state에서 시작됐는지 protocol trace로 연결합니다.", "로컬 EchoHandler는 read-only provenance이며 실제 package, 사용자 payload와 session id log를 공개 학습자료에 복사하지 않습니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-echo-handler", repository: "local learning archive", path: "SPRING/MyWeb/src/main/java/.../util/EchoHandler.java", usedFor: ["legacy ArrayList registry and broadcast provenance"], evidence: "Read-only audit: 42 lines, 1,725 bytes, SHA-256 5716B67A4E2BF38130A0B81F00D7902E5934F7FDC230A74DEDF0D0312453E7A4." },
  { id: "spring-websocket-overview", repository: "Spring Framework Reference", path: "WebSockets", publicUrl: "https://docs.spring.io/spring-framework/reference/web/websocket.html", usedFor: ["HTTP Upgrade, 101 and WebSocket architecture"], evidence: "Spring Framework 공식 WebSocket overview입니다." },
  { id: "spring-websocket-server", repository: "Spring Framework Reference", path: "WebSocket API", publicUrl: "https://docs.spring.io/spring-framework/reference/web/websocket/server.html", usedFor: ["handler registration, handshake and allowed origins"], evidence: "Spring Framework 공식 WebSocket server reference입니다." },
  { id: "spring-websocket-handler", repository: "Spring Framework API", path: "WebSocketHandler", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/socket/WebSocketHandler.html", usedFor: ["connection, message, transport error and close callbacks"], evidence: "Spring Framework 공식 WebSocketHandler API입니다." },
  { id: "spring-websocket-session", repository: "Spring Framework API", path: "WebSocketSession", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/socket/WebSocketSession.html", usedFor: ["session principal, attributes and send contract"], evidence: "Spring Framework 공식 WebSocketSession API입니다." },
  { id: "spring-concurrent-session", repository: "Spring Framework API", path: "ConcurrentWebSocketSessionDecorator", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/socket/handler/ConcurrentWebSocketSessionDecorator.html", usedFor: ["serialized send, buffer and send-time limits"], evidence: "Spring Framework 공식 concurrent session decorator API입니다." },
  { id: "spring-origin-interceptor", repository: "Spring Framework API", path: "OriginHandshakeInterceptor", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/socket/server/support/OriginHandshakeInterceptor.html", usedFor: ["handshake Origin allow-list"], evidence: "Spring Framework 공식 OriginHandshakeInterceptor API입니다." },
  { id: "spring-websocket-security", repository: "Spring Security Reference", path: "WebSocket Security", publicUrl: "https://docs.spring.io/spring-security/reference/servlet/integrations/websocket.html", usedFor: ["handshake principal and inbound message authorization"], evidence: "Spring Security 공식 WebSocket security reference입니다." },
  { id: "rfc6455", repository: "IETF RFC Editor", path: "RFC 6455 The WebSocket Protocol", publicUrl: "https://www.rfc-editor.org/rfc/rfc6455.html", usedFor: ["handshake, frames, origin, ping/pong and close semantics"], evidence: "IETF 표준 WebSocket protocol 문서입니다." },
  { id: "whatwg-websockets", repository: "WHATWG", path: "WebSockets Standard", publicUrl: "https://websockets.spec.whatwg.org/", usedFor: ["browser WebSocket API and buffered behavior"], evidence: "WHATWG 공식 WebSockets Standard입니다." },
  { id: "owasp-websocket", repository: "OWASP Cheat Sheet Series", path: "WebSocket Security Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html", usedFor: ["CSWSH, authentication, message validation, limits and logging"], evidence: "OWASP 공식 WebSocket security guidance입니다." },
  { id: "java-message-digest", repository: "Java SE 21 API", path: "MessageDigest", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/MessageDigest.html", usedFor: ["RFC handshake digest example"], evidence: "Oracle JDK 공식 MessageDigest API입니다." },
  { id: "java-base64", repository: "Java SE 21 API", path: "Base64", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Base64.html", usedFor: ["RFC handshake accept encoding"], evidence: "Oracle JDK 공식 Base64 API입니다." },
  { id: "java-set", repository: "Java SE 21 API", path: "Set", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html", usedFor: ["origin and room allow-list model"], evidence: "Oracle JDK 공식 Set API입니다." },
  { id: "java-concurrent-map", repository: "Java SE 21 API", path: "ConcurrentMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentMap.html", usedFor: ["thread-safe connection registry"], evidence: "Oracle JDK 공식 ConcurrentMap API입니다." },
  { id: "java-array-deque", repository: "Java SE 21 API", path: "ArrayDeque", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayDeque.html", usedFor: ["bounded outbound queue model"], evidence: "Oracle JDK 공식 ArrayDeque API입니다." },
  { id: "java-tree-map", repository: "Java SE 21 API", path: "TreeMap", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeMap.html", usedFor: ["ordered gap buffer model"], evidence: "Oracle JDK 공식 TreeMap API입니다." },
];

const session = createExpertSession({
  inventoryId: "crud-09-websocket-chat", slug: "crud-09-websocket-chat", courseId: "spring", moduleId: "spring-layered-crud", order: 9,
  title: "WebSocket 핸드셰이크와 실시간 메시지", subtitle: "HTTP Upgrade에서 인증된 연결을 만들고 동시 registry·backpressure·순서·재연결·scale-out까지 검증합니다.", level: "전문가", estimatedMinutes: 105,
  coreQuestion: "장기 양방향 연결에서 origin과 principal을 어떻게 검증하고, 느린 client·동시 broadcast·중복·순서 gap·node 장애에도 권한 없는 전달과 무제한 queue 없이 chat을 수렴시킬까요?",
  summary: "로컬 EchoHandler를 read-only로 감사해 singleton ArrayList session registry, connect add, 전체 payload broadcast와 close remove 구조를 확인했습니다. 단순 echo를 그대로 복제하지 않고 RFC 6455 HTTP Upgrade/Accept/subprotocol, exact Origin과 CSWSH, handshake principal·message/room authorization·revocation, versioned envelope와 size/rate/fan-out budgets, concurrent registry와 idempotent cleanup, serialized send/backpressure, sequence·dedup·ack·resume, heartbeat/close/reconnect storm, multi-node broker/outbox/presence 및 payload-free observability/chaos 검증으로 확장합니다. 다섯 JDK 21 예제가 RFC accept, authorization revocation, concurrent registry, bounded queue와 out-of-order convergence stdout을 실제 실행합니다.",
  objectives: ["HTTP Upgrade, 101, Sec-WebSocket-Accept와 subprotocol을 설명한다.", "exact Origin과 handshake credential로 CSWSH를 방어한다.", "connect와 message/room authorization 및 revocation을 분리한다.", "versioned envelope와 frame/message/parse/rate/fan-out budget을 설계한다.", "thread-safe registry와 모든 close/error cleanup을 검증한다.", "connection별 serialized send와 bounded backpressure를 적용한다.", "sequence, dedup, ack와 resume로 reconnect를 수렴시킨다.", "heartbeat, close code와 jittered reconnect를 운영한다.", "node-local connections와 shared broker/history/presence를 분리한다.", "protocol trace와 slow-consumer/hot-room/node-failure chaos gate를 만든다."],
  prerequisites: [{ title: "로그인 인터셉터와 요청 전·후 처리", reason: "HTTP handshake principal, 세션 철회, authorization, 비동기 context와 cleanup을 이해해야 장기 WebSocket 연결의 인증·인가·수명 경계를 안전하게 설계할 수 있습니다.", sessionSlug: "crud-08-login-interceptor" }],
  keywords: ["WebSocket", "HTTP Upgrade", "handshake", "Origin", "CSWSH", "WebSocketSession", "session registry", "broadcast", "backpressure", "ordering", "deduplication", "ack", "reconnect", "heartbeat", "close code", "broker", "presence"],
  topics,
  lab: {
    title: "단일-node echo handler를 안전한 multi-node room chat으로 진화시키기",
    scenario: "ArrayList의 모든 sessions에 payload를 그대로 보내는 handler가 있습니다. 브라우저 cookie, 악성 origin, 느린 client, duplicate/reorder, 권한 철회와 node 재시작에서도 메시지 보안·순서·자원 bound를 보장해야 합니다.",
    setup: ["로컬 EchoHandler는 read-only provenance로 보존하고 실제 package, session id와 사용자 payload를 복사하지 않습니다.", "trusted/foreign origins, anonymous/member/banned synthetic principals와 versioned message fixtures를 준비합니다.", "2개 application nodes, proxy, fake/real broker, durable history와 controllable slow clients를 격리 환경에 구성합니다.", "connection/message ids, room sequence, queue bytes와 close categories만 남기는 protocol trace를 준비합니다."],
    steps: ["RFC sample handshake와 invalid method/version/key/subprotocol을 검증합니다.", "exact Origin과 authenticated principal/cookie 또는 one-time ticket을 handshake에서 검사합니다.", "client sender를 무시하고 SEND/SUBSCRIBE/JOIN을 server principal·room policy로 authorize합니다.", "message schema, size/depth/rate/fan-out budgets를 적용합니다.", "ConcurrentMap registry와 error/timeout/revoke/shutdown idempotent cleanup을 구현합니다.", "connection별 serialized sender, bytes/send-time limits와 slow-consumer policy를 적용합니다.", "server sequence, client idempotency id, contiguous ack와 bounded gap/resync를 구현합니다.", "heartbeat/lease, close codes와 jittered reconnect/drain을 검증합니다.", "room partition broker와 DB outbox/history replay를 2개 nodes에 연결합니다.", "duplicate, out-of-order, broker partition, node kill, hot room과 reconnect storm fault를 주입합니다.", "unauthorized delivery 0, bounded heap/queue와 replay convergence를 확인합니다.", "source hash, protocol/version, capacity, privacy와 rollback runbook을 제출합니다."],
    expectedResult: ["trusted origin과 valid principal/subprotocol만 101을 받고 다른 handshake는 message handler 전에 거부됩니다.", "모든 inbound action은 server principal과 current room/auth version으로 authorize되고 client sender spoof가 무시됩니다.", "registry와 per-session queue는 concurrent join/leave와 slow consumer에도 bounded하며 다른 clients latency를 격리합니다.", "duplicate/loss/reorder/reconnect 뒤 clients가 같은 durable room sequence와 cursor로 수렴합니다.", "node/broker/proxy 장애에서도 close/reconnect가 폭주하지 않고 protocol trace가 payload/credential 없이 원인을 설명합니다."],
    cleanup: ["synthetic connections, room memberships, broker topics, history/outbox와 dedup records를 제거합니다.", "clients, proxy, nodes, executors와 broker를 종료하고 registry/queue/lease가 0인지 확인합니다.", "logs/traces에서 cookie, token, full session id, message content와 개인 origin 값이 없는지 검사합니다.", "로컬 학습 원본은 변경하지 않습니다."],
    extensions: ["STOMP destination authorization과 raw WebSocket protocol을 같은 threat matrix로 비교합니다.", "binary attachment reference, end-to-end encryption의 key/metadata trade-off를 별도 설계합니다.", "hot-room adaptive fan-out tree와 regional sequence/replay architecture를 부하로 검증합니다.", "mobile background/visibility와 proxy별 heartbeat/reconnect compatibility lab을 추가합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java 예제를 실행해 handshake, authorization, registry, backpressure와 ordering 불변식을 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "RFC accept 값과 authentication을 구분합니다.", "revocation 뒤 send가 false인지 확인합니다.", "remove가 idempotent인지 확인합니다.", "6번째 byte가 queue를 닫는지 확인합니다.", "1,2,2,4,3이 A,B,C,D로 수렴하는지 확인합니다."], hints: ["각 boolean/count를 실제 client/proxy/server trace의 어떤 evidence로 바꿀지 적으세요."], expectedOutcome: "WebSocket을 단순 지속 연결이 아니라 versioned·authorized·bounded protocol로 설명합니다.", solutionOutline: ["upgrade→authenticate→authorize→validate→enqueue→sequence→ack 순서입니다."] },
    { difficulty: "응용", prompt: "로컬 EchoHandler를 room-aware secure handler로 재설계하고 2-node fault tests를 실행하세요.", requirements: ["origin/auth handshake를 둡니다.", "message schema와 authorization을 둡니다.", "concurrent registry/cleanup을 구현합니다.", "serialized bounded send를 둡니다.", "sequence/dedup/resume을 구현합니다.", "broker/outbox/history를 연결합니다.", "heartbeat/drain/reconnect를 검증합니다.", "payload-free telemetry와 chaos gates를 통과합니다."], hints: ["broadcast loop를 고치기 전에 connection owner, room ordering scope와 delivery contract를 먼저 정하세요."], expectedOutcome: "slow client와 node failure에도 권한·순서·자원이 통제된 chat service가 완성됩니다.", solutionOutline: ["model→handshake→guard→serialize→persist→fanout→recover 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 실시간 messaging protocol·capacity·운영 표준을 작성하세요.", requirements: ["handshake/origin/subprotocol policy를 둡니다.", "authentication/revocation/destination authorization을 둡니다.", "schema/size/rate/fan-out budgets를 둡니다.", "queue/slow-consumer/drop/close policy를 둡니다.", "ordering/dedup/ack/replay semantics를 둡니다.", "heartbeat/drain/reconnect와 broker failure를 정의합니다.", "privacy, load/chaos와 delivery invariants release gate를 둡니다."], hints: ["'실시간' 대신 p95 delivery, queue bytes, reconnect convergence, retention과 unauthorized delivery 0을 수치/불변식으로 적으세요."], expectedOutcome: "client·proxy·nodes·broker가 같은 versioned protocol과 failure semantics를 공유하는 표준이 완성됩니다.", solutionOutline: ["negotiate→identify→constrain→order→distribute→recover→observe 순서입니다."] },
  ],
  nextSessions: ["boot-01-gradle-starter-autoconfig"], sources,
  sourceCoverage: { filesRead: 1, filesUsed: 1, uncoveredNotes: ["EchoHandler.java는 read-only로 42 lines/1,725 bytes와 SHA-256 5716B67A4E2BF38130A0B81F00D7902E5934F7FDC230A74DEDF0D0312453E7A4을 확인했습니다.", "원본의 ArrayList session list, connect add, payload broadcast와 close remove 구조만 provenance로 요약하고 실제 package, session ids와 사용자 message/log 값은 복사하지 않았습니다.", "원본이 다루지 않는 HTTP handshake/origin/auth, CSWSH, concurrent send/backpressure, message schema/rate, ordering/dedup/reconnect, broker/outbox/presence와 observability는 공식 문서와 synthetic examples로 보강했습니다.", "JDK-only examples는 actual HTTP Upgrade, frame masking/fragmentation, Spring session concurrency, proxy/network와 broker delivery를 대체하지 않습니다.", "다음 session slug는 inventory chain의 boot-01-gradle-starter-autoconfig을 사용하며 Spring Boot에서 WebSocket configuration/operations를 더 자동화할 때 현재 protocol invariants를 유지해야 합니다."] },
});

export default session;
